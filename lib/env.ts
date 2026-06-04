import { z } from "zod";

/**
 * Centralized, validated environment access.
 * Throws at startup (server-side) if a required variable is missing/invalid,
 * so we fail fast instead of getting cryptic runtime errors deep in a service.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  OPENAI_CHAT_MODEL: z.string().default("gpt-4o-mini"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  UPLOAD_DIR: z.string().default("uploads/documents"),
  STORAGE_ADAPTER: z.enum(["local", "minio", "s3"]).default("local"),
  MINIO_ENDPOINT: z.string().optional(),
  MINIO_PORT: z.preprocess((val) => (val ? Number(val) : undefined), z.number().positive().optional()),
  MINIO_USE_SSL: z.preprocess((val) => (val === "true" ? true : val === "false" ? false : undefined), z.boolean().optional()),
  MINIO_ACCESS_KEY: z.string().optional(),
  MINIO_SECRET_KEY: z.string().optional(),
  MINIO_BUCKET: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_USE_SSL: z.preprocess((val) => (val === "false" ? false : true), z.boolean().optional()).default(true),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
});

const envSchemaWithRefine = envSchema.superRefine((data, ctx) => {
  if (data.STORAGE_ADAPTER === "minio") {
    if (!data.MINIO_ENDPOINT) {
      ctx.addIssue({ path: ["MINIO_ENDPOINT"], code: z.ZodIssueCode.custom, message: "MINIO_ENDPOINT is required when STORAGE_ADAPTER=minio" });
    }
    if (!data.MINIO_ACCESS_KEY) {
      ctx.addIssue({ path: ["MINIO_ACCESS_KEY"], code: z.ZodIssueCode.custom, message: "MINIO_ACCESS_KEY is required when STORAGE_ADAPTER=minio" });
    }
    if (!data.MINIO_SECRET_KEY) {
      ctx.addIssue({ path: ["MINIO_SECRET_KEY"], code: z.ZodIssueCode.custom, message: "MINIO_SECRET_KEY is required when STORAGE_ADAPTER=minio" });
    }
    if (!data.MINIO_BUCKET) {
      ctx.addIssue({ path: ["MINIO_BUCKET"], code: z.ZodIssueCode.custom, message: "MINIO_BUCKET is required when STORAGE_ADAPTER=minio" });
    }
  }

  if (data.STORAGE_ADAPTER === "s3") {
    if (!data.S3_ACCESS_KEY_ID) {
      ctx.addIssue({ path: ["S3_ACCESS_KEY_ID"], code: z.ZodIssueCode.custom, message: "S3_ACCESS_KEY_ID is required when STORAGE_ADAPTER=s3" });
    }
    if (!data.S3_SECRET_ACCESS_KEY) {
      ctx.addIssue({ path: ["S3_SECRET_ACCESS_KEY"], code: z.ZodIssueCode.custom, message: "S3_SECRET_ACCESS_KEY is required when STORAGE_ADAPTER=s3" });
    }
    if (!data.S3_BUCKET) {
      ctx.addIssue({ path: ["S3_BUCKET"], code: z.ZodIssueCode.custom, message: "S3_BUCKET is required when STORAGE_ADAPTER=s3" });
    }
  }
});

// Embedding dimension for text-embedding-3-small. Keep in sync with prisma `vector(1536)`.
export const EMBEDDING_DIMENSIONS = 1536;

const parsed = envSchemaWithRefine.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Invalid environment variables:\n${issues}`);
}

export const env = parsed.data;
