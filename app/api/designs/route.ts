import { HttpError, json, readJson, requireApiUser, route } from "@/lib/server/http";
import { createDesign, listDesigns } from "@/lib/server/designs";
import { createDesignSchema, MAX_DOC_BYTES } from "@/lib/server/schemas";
import { parseDesignDoc } from "@/lib/design/types";

export const GET = route(async (request) => {
  const user = await requireApiUser();
  const q = new URL(request.url).searchParams.get("q")?.trim().slice(0, 100) || undefined;
  return json({ designs: await listDesigns(user.id, q) });
});

export const POST = route(async (request) => {
  const user = await requireApiUser();
  const body = await readJson(request, createDesignSchema, MAX_DOC_BYTES);
  const doc = parseDesignDoc(body.doc);
  if (!doc.ok) throw new HttpError(400, doc.error);
  const design = await createDesign(user.id, body.title ?? "Untitled design", doc.value);
  return json({ design: { id: design.id } }, 201);
});
