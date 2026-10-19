import { randomBytes } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Pool } from "pg";
import { createPool, migrate, setPoolForTesting } from "@/lib/server/db";
import { authenticate, createSession, createUser, deleteSession, EmailTakenError, getOrCreateGoogleUser, getUserBySessionToken, GoogleAccountConflictError } from "@/lib/server/users";
import {
  createDesign,
  createVersion,
  deleteDesign,
  DesignConflictError,
  disableSharing,
  duplicateDesign,
  enableSharing,
  getDesign,
  getDesignByShareToken,
  getVersionDoc,
  listDesigns,
  listVersions,
  MAX_VERSIONS,
  updateDesign,
} from "@/lib/server/designs";
import { deleteUpload, getUploadData, listUploads, saveUpload, UploadError } from "@/lib/server/uploads";
import { blankDoc } from "@/lib/design/types";

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 0, 10, 0, 0, 0, 10]);

// These tests need a real PostgreSQL database (TEST_DATABASE_URL in .env).
// Each test runs in its own throwaway schema, dropped afterwards.
const TEST_URL = process.env.TEST_DATABASE_URL;
let available = false;
if (TEST_URL) {
  const probe = new Pool({ connectionString: TEST_URL, connectionTimeoutMillis: 3000 });
  try {
    await probe.query("SELECT 1");
    available = true;
  } catch (err) {
    console.warn(`Skipping data-layer tests: cannot connect to TEST_DATABASE_URL (${(err as Error).message}). Run scripts/setup-local-db.sh.`);
  } finally {
    await probe.end();
  }
} else {
  console.warn("Skipping data-layer tests: TEST_DATABASE_URL is not set.");
}

const admin = available ? new Pool({ connectionString: TEST_URL }) : null;
let current: { schema: string; pool: Pool } | null = null;

async function dropCurrent() {
  if (!current || !admin) return;
  await current.pool.end();
  await admin.query(`DROP SCHEMA IF EXISTS ${current.schema} CASCADE`);
  current = null;
}

beforeEach(async () => {
  if (!admin || !TEST_URL) return;
  await dropCurrent();
  const schema = `test_${randomBytes(6).toString("hex")}`;
  await admin.query(`CREATE SCHEMA ${schema}`);
  const pool = createPool(TEST_URL, { schema });
  await migrate(pool);
  setPoolForTesting(pool);
  current = { schema, pool };
});

afterAll(async () => {
  await dropCurrent();
  await admin?.end();
});

describe.skipIf(!available)("data layer (PostgreSQL)", () => {
  describe("users and sessions", () => {
    it("creates users, rejects duplicate emails case-insensitively, authenticates", async () => {
      const u = await createUser("a@example.test", "A", "password123");
      await expect(createUser("A@EXAMPLE.TEST", "A2", "password123")).rejects.toBeInstanceOf(EmailTakenError);
      expect(await authenticate("a@example.test", "password123")).toEqual(u);
      expect(await authenticate("a@example.test", "nope")).toBeNull();
      expect(await authenticate("missing@example.test", "password123")).toBeNull();
    });

    it("resolves, expires and revokes sessions", async () => {
      const u = await createUser("s@example.test", "S", "password123");
      const { token } = await createSession(u.id);
      expect((await getUserBySessionToken(token))?.id).toBe(u.id);
      expect(await getUserBySessionToken(token + "x")).toBeNull();
      vi.useFakeTimers({ now: Date.now() + 31 * 24 * 60 * 60 * 1000, toFake: ["Date"] });
      expect(await getUserBySessionToken(token)).toBeNull();
      vi.useRealTimers();
      const second = await createSession(u.id);
      await deleteSession(second.token);
      expect(await getUserBySessionToken(second.token)).toBeNull();
    });

    it("creates Google-only accounts and reuses the durable Google subject", async () => {
      const identity = { sub: "google-sub-1", email: "creator@gmail.com", name: "Creator" };
      const user = await getOrCreateGoogleUser(identity);
      expect(await authenticate(identity.email, "password123")).toBeNull();
      expect(await getOrCreateGoogleUser({ ...identity, email: "new@gmail.com" })).toEqual(user);
      expect(await getOrCreateGoogleUser(identity)).toEqual(user);
    });

    it("links a trusted Gmail account but rejects an untrusted email match", async () => {
      const gmailUser = await createUser("artist@gmail.com", "Artist", "password123");
      expect(await getOrCreateGoogleUser({ sub: "gmail-sub", email: gmailUser.email, name: "Artist" })).toEqual(gmailUser);
      expect(await authenticate(gmailUser.email, "password123")).toEqual(gmailUser);

      const otherUser = await createUser("artist@example.test", "Artist", "password123");
      await expect(getOrCreateGoogleUser({ sub: "other-sub", email: otherUser.email, name: "Artist" })).rejects.toBeInstanceOf(GoogleAccountConflictError);
      expect(await authenticate(otherUser.email, "password123")).toEqual(otherUser);
    });
  });

  describe("designs", () => {
    it("isolates designs by owner", async () => {
      const alice = await createUser("alice@example.test", "Alice", "password123");
      const bob = await createUser("bob@example.test", "Bob", "password123");
      const d = await createDesign(alice.id, "Poster", blankDoc(100, 200));
      expect(await getDesign(bob.id, d.id)).toBeNull();
      expect(await updateDesign(bob.id, d.id, { title: "hacked" })).toBeNull();
      expect(await deleteDesign(bob.id, d.id)).toBe(false);
      expect(await duplicateDesign(bob.id, d.id)).toBeNull();
      expect(await enableSharing(bob.id, d.id)).toBeNull();
      expect(await listVersions(bob.id, d.id)).toBeNull();
      expect(await listDesigns(bob.id)).toHaveLength(0);
      expect((await getDesign(alice.id, d.id))?.title).toBe("Poster");
      expect(await getDesign(alice.id, "not-a-uuid")).toBeNull();
    });

    it("updates, searches, duplicates and deletes", async () => {
      const u = await createUser("d@example.test", "D", "password123");
      const d = await createDesign(u.id, "100% Summer_sale", blankDoc(100, 100));
      await createDesign(u.id, "Other", blankDoc(100, 100));
      expect(await listDesigns(u.id, "100%")).toHaveLength(1);
      expect(await listDesigns(u.id, "_")).toHaveLength(1);
      await updateDesign(u.id, d.id, { title: "Renamed", doc: blankDoc(300, 400) });
      const after = (await getDesign(u.id, d.id))!;
      expect(after).toMatchObject({ title: "Renamed", width: 300, height: 400 });
      const copy = (await duplicateDesign(u.id, d.id))!;
      expect(copy.title).toBe("Renamed (copy)");
      expect(await deleteDesign(u.id, d.id)).toBe(true);
      expect(await getDesign(u.id, d.id)).toBeNull();
    });

    it("checkpoints the previous state and caps history", async () => {
      const u = await createUser("v@example.test", "V", "password123");
      const d = await createDesign(u.id, "V", blankDoc(100, 100));
      await updateDesign(u.id, d.id, { doc: blankDoc(200, 200) });
      const versions = (await listVersions(u.id, d.id))!;
      expect(versions).toHaveLength(1);
      expect((await getVersionDoc(u.id, d.id, versions[0].id))?.width).toBe(100);
      // Second save within the interval does not add another checkpoint.
      await updateDesign(u.id, d.id, { doc: blankDoc(300, 300) });
      expect(await listVersions(u.id, d.id)).toHaveLength(1);
      for (let i = 0; i < MAX_VERSIONS + 5; i++) await createVersion(u.id, d.id, `v${i}`);
      expect(await listVersions(u.id, d.id)).toHaveLength(MAX_VERSIONS);
    });

    it("rejects saves based on an outdated version", async () => {
      const u = await createUser("c@example.test", "C", "password123");
      const d = await createDesign(u.id, "C", blankDoc(100, 100));
      const first = (await updateDesign(u.id, d.id, { doc: blankDoc(200, 200) }, 0))!;
      expect(first.revision).toBe(1);
      // A second tab still holding revision 0 must not overwrite.
      await expect(updateDesign(u.id, d.id, { doc: blankDoc(300, 300) }, 0)).rejects.toBeInstanceOf(DesignConflictError);
      expect((await getDesign(u.id, d.id))?.width).toBe(200);
      // Renames don't change the revision, so they never cause false conflicts.
      expect((await updateDesign(u.id, d.id, { title: "Renamed" }))?.revision).toBe(1);
      expect((await updateDesign(u.id, d.id, { doc: blankDoc(300, 300) }, 1))?.revision).toBe(2);
    });

    it("shares and revokes view links", async () => {
      const u = await createUser("sh@example.test", "Sh", "password123");
      const d = await createDesign(u.id, "Shared", blankDoc(100, 100));
      const token = (await enableSharing(u.id, d.id))!;
      expect(token.length).toBeGreaterThanOrEqual(32);
      expect(await enableSharing(u.id, d.id)).toBe(token);
      expect((await getDesignByShareToken(token))?.id).toBe(d.id);
      await disableSharing(u.id, d.id);
      expect(await getDesignByShareToken(token)).toBeNull();
    });
  });

  describe("uploads", () => {
    it("stores sniffed images per owner", async () => {
      const u = await createUser("up@example.test", "Up", "password123");
      const other = await createUser("o@example.test", "O", "password123");
      const up = await saveUpload(u.id, "../../etc/passwd.png", PNG);
      expect(up).toMatchObject({ mime: "image/png", width: 10, height: 10 });
      expect(up.name).not.toContain("/");
      expect((await getUploadData(up.id))?.mime).toBe("image/png");
      expect(await listUploads(other.id)).toHaveLength(0);
      expect(await deleteUpload(other.id, up.id)).toBe(false);
      expect(await deleteUpload(u.id, up.id)).toBe(true);
      await expect(saveUpload(u.id, "x.png", new TextEncoder().encode("<svg/>"))).rejects.toBeInstanceOf(UploadError);
      await expect(saveUpload(u.id, "x.png", new Uint8Array())).rejects.toBeInstanceOf(UploadError);
    });
  });
});
