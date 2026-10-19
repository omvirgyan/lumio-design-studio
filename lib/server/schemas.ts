import { z } from "zod";
import { designDocSchema } from "@/lib/design/types";

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email").max(254);

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(80),
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password").max(200),
});

export const titleSchema = z.string().trim().min(1).max(120);

// Thumbnails are small JPEG/PNG previews produced client-side.
export const thumbnailSchema = z
  .string()
  .max(400_000)
  .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, "Invalid thumbnail");

export const createDesignSchema = z.object({
  title: titleSchema.optional(),
  doc: designDocSchema,
});

export const patchDesignSchema = z.object({
  title: titleSchema.optional(),
  doc: designDocSchema.optional(),
  thumbnail: thumbnailSchema.nullable().optional(),
  /** The document revision the client's edits are based on; enables conflict detection. */
  baseRevision: z.number().int().nonnegative().optional(),
});

export const createVersionSchema = z.object({
  label: z.string().trim().max(80).optional(),
});

export const MAX_DOC_BYTES = 8_000_000;
