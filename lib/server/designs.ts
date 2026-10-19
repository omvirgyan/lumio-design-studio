import "server-only";
import { randomUUID } from "node:crypto";
import { execute, query, queryOne, transaction, type Queryable } from "./db";
import { generateToken } from "./passwords";
import type { DesignDoc } from "@/lib/design/types";

export type DesignSummary = {
  id: string;
  title: string;
  width: number;
  height: number;
  thumbnail: string | null;
  shared: boolean;
  createdAt: number;
  updatedAt: number;
};

export type Design = DesignSummary & { doc: DesignDoc; shareToken: string | null; revision: number };

export type VersionSummary = { id: string; label: string | null; thumbnail: string | null; createdAt: number };

type DesignRow = {
  id: string;
  title: string;
  width: number;
  height: number;
  thumbnail: string | null;
  share_token: string | null;
  created_at: number;
  updated_at: number;
  doc?: DesignDoc;
  revision?: number;
};

/** Minimum gap between automatic history checkpoints. */
export const AUTO_VERSION_INTERVAL_MS = 10 * 60 * 1000;
export const MAX_VERSIONS = 50;

const SUMMARY_COLUMNS = "id, title, width, height, thumbnail, share_token, created_at, updated_at";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ids come from URLs; anything that isn't a UUID can't match and would make Postgres raise. */
function isUuid(id: string): boolean {
  return UUID.test(id);
}

function toSummary(row: DesignRow): DesignSummary {
  return {
    id: row.id,
    title: row.title,
    width: row.width,
    height: row.height,
    thumbnail: row.thumbnail,
    shared: row.share_token !== null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDesign(row: DesignRow): Design {
  return { ...toSummary(row), doc: row.doc as DesignDoc, shareToken: row.share_token, revision: row.revision ?? 0 };
}

export async function listDesigns(ownerId: string, search?: string): Promise<DesignSummary[]> {
  const rows = search
    ? await query<DesignRow>(
        `SELECT ${SUMMARY_COLUMNS} FROM designs WHERE owner_id = $1 AND title ILIKE $2 ESCAPE '\\'
         ORDER BY updated_at DESC LIMIT 500`,
        [ownerId, `%${search.replace(/[\\%_]/g, (c) => "\\" + c)}%`],
      )
    : await query<DesignRow>(`SELECT ${SUMMARY_COLUMNS} FROM designs WHERE owner_id = $1 ORDER BY updated_at DESC LIMIT 500`, [ownerId]);
  return rows.map(toSummary);
}

export async function getDesign(ownerId: string, id: string): Promise<Design | null> {
  if (!isUuid(id)) return null;
  const row = await queryOne<DesignRow>("SELECT * FROM designs WHERE id = $1 AND owner_id = $2", [id, ownerId]);
  return row ? toDesign(row) : null;
}

export async function getDesignByShareToken(token: string): Promise<Design | null> {
  const row = await queryOne<DesignRow>("SELECT * FROM designs WHERE share_token = $1", [token]);
  return row ? toDesign(row) : null;
}

export async function createDesign(ownerId: string, title: string, doc: DesignDoc, thumbnail: string | null = null): Promise<Design> {
  const now = Date.now();
  const id = randomUUID();
  await execute(
    `INSERT INTO designs (id, owner_id, title, width, height, doc, thumbnail, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $8)`,
    [id, ownerId, title, doc.width, doc.height, JSON.stringify(doc), thumbnail, now],
  );
  return { id, title, width: doc.width, height: doc.height, thumbnail, shared: false, shareToken: null, createdAt: now, updatedAt: now, doc, revision: 0 };
}

export type DesignPatch = { title?: string; doc?: DesignDoc; thumbnail?: string | null };

export class DesignConflictError extends Error {
  constructor(public currentRevision: number) {
    super("This design was changed somewhere else");
  }
}

/** Copies the design's current doc into its history and trims old versions. */
async function checkpoint(db: Queryable, designId: string, label: string | null, now: number): Promise<string> {
  const versionId = randomUUID();
  await db.query(
    `INSERT INTO design_versions (id, design_id, doc, thumbnail, label, created_at)
     SELECT $1, id, doc, thumbnail, $2, $3 FROM designs WHERE id = $4`,
    [versionId, label, now, designId],
  );
  await db.query(
    `DELETE FROM design_versions WHERE design_id = $1 AND id NOT IN
       (SELECT id FROM design_versions WHERE design_id = $1 ORDER BY created_at DESC LIMIT $2)`,
    [designId, MAX_VERSIONS],
  );
  return versionId;
}

/**
 * Returns the new updatedAt and document revision, or null if the design does
 * not exist for this owner. When a doc is saved with `expectedRevision` and the
 * stored document has moved on, throws DesignConflictError instead of
 * overwriting it (e.g. a stale second tab).
 */
export async function updateDesign(
  ownerId: string,
  id: string,
  patch: DesignPatch,
  expectedRevision?: number,
): Promise<{ updatedAt: number; revision: number } | null> {
  if (!isUuid(id)) return null;
  return transaction(async (db) => {
    // Row lock: concurrent saves of the same design are serialised, so the revision check is reliable.
    const { rows } = await db.query<{ revision: number }>("SELECT revision FROM designs WHERE id = $1 AND owner_id = $2 FOR UPDATE", [
      id,
      ownerId,
    ]);
    const current = rows[0];
    if (!current) return null;
    if (patch.doc && expectedRevision !== undefined && current.revision !== expectedRevision) {
      throw new DesignConflictError(current.revision);
    }
    const revision = patch.doc ? current.revision + 1 : current.revision;
    const now = Date.now();
    if (patch.doc) {
      const last = await db.query<{ created_at: number }>(
        "SELECT created_at FROM design_versions WHERE design_id = $1 ORDER BY created_at DESC LIMIT 1",
        [id],
      );
      // Checkpoint the state being replaced, at most once per interval.
      if (!last.rows[0] || now - last.rows[0].created_at > AUTO_VERSION_INTERVAL_MS) await checkpoint(db, id, null, now);
    }
    const sets = ["updated_at = $1"];
    const values: unknown[] = [now];
    const add = (column: string, value: unknown, cast = "") => {
      values.push(value);
      sets.push(`${column} = $${values.length}${cast}`);
    };
    if (patch.title !== undefined) add("title", patch.title);
    if (patch.doc) {
      add("doc", JSON.stringify(patch.doc), "::jsonb");
      add("width", patch.doc.width);
      add("height", patch.doc.height);
      add("revision", revision);
    }
    if (patch.thumbnail !== undefined) add("thumbnail", patch.thumbnail);
    values.push(id, ownerId);
    await db.query(`UPDATE designs SET ${sets.join(", ")} WHERE id = $${values.length - 1} AND owner_id = $${values.length}`, values);
    return { updatedAt: now, revision };
  });
}

export async function deleteDesign(ownerId: string, id: string): Promise<boolean> {
  if (!isUuid(id)) return false;
  return (await execute("DELETE FROM designs WHERE id = $1 AND owner_id = $2", [id, ownerId])) > 0;
}

export async function duplicateDesign(ownerId: string, id: string): Promise<Design | null> {
  const source = await getDesign(ownerId, id);
  if (!source) return null;
  return createDesign(ownerId, `${source.title} (copy)`.slice(0, 120), source.doc, source.thumbnail);
}

async function ownsDesign(ownerId: string, designId: string): Promise<boolean> {
  if (!isUuid(designId)) return false;
  return !!(await queryOne("SELECT 1 FROM designs WHERE id = $1 AND owner_id = $2", [designId, ownerId]));
}

export async function createVersion(ownerId: string, designId: string, label: string | null): Promise<VersionSummary | null> {
  if (!(await ownsDesign(ownerId, designId))) return null;
  const now = Date.now();
  const id = await transaction((db) => checkpoint(db, designId, label, now));
  const row = await queryOne<{ thumbnail: string | null }>("SELECT thumbnail FROM design_versions WHERE id = $1", [id]);
  return { id, label, thumbnail: row?.thumbnail ?? null, createdAt: now };
}

export async function listVersions(ownerId: string, designId: string): Promise<VersionSummary[] | null> {
  if (!(await ownsDesign(ownerId, designId))) return null;
  const rows = await query<{ id: string; label: string | null; thumbnail: string | null; created_at: number }>(
    "SELECT id, label, thumbnail, created_at FROM design_versions WHERE design_id = $1 ORDER BY created_at DESC",
    [designId],
  );
  return rows.map((r) => ({ id: r.id, label: r.label, thumbnail: r.thumbnail, createdAt: r.created_at }));
}

export async function getVersionDoc(ownerId: string, designId: string, versionId: string): Promise<DesignDoc | null> {
  if (!isUuid(designId) || !isUuid(versionId)) return null;
  const row = await queryOne<{ doc: DesignDoc }>(
    `SELECT v.doc FROM design_versions v JOIN designs d ON d.id = v.design_id
     WHERE v.id = $1 AND v.design_id = $2 AND d.owner_id = $3`,
    [versionId, designId, ownerId],
  );
  return row?.doc ?? null;
}

export async function enableSharing(ownerId: string, id: string): Promise<string | null> {
  if (!isUuid(id)) return null;
  // Keeps an existing token so previously shared links stay valid.
  const row = await queryOne<{ share_token: string }>(
    `UPDATE designs SET share_token = COALESCE(share_token, $1) WHERE id = $2 AND owner_id = $3 RETURNING share_token`,
    [generateToken(24), id, ownerId],
  );
  return row?.share_token ?? null;
}

export async function disableSharing(ownerId: string, id: string): Promise<boolean> {
  if (!isUuid(id)) return false;
  return (await execute("UPDATE designs SET share_token = NULL WHERE id = $1 AND owner_id = $2", [id, ownerId])) > 0;
}
