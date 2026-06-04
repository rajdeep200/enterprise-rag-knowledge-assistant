import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { Client as MinioClient } from "minio";
import { env } from "@/lib/env";

function uploadRoot(): string {
  // UPLOAD_DIR is relative to the project root (process.cwd()).
  return path.resolve(process.cwd(), env.UPLOAD_DIR);
}
/**
 * FileStorageService — local disk or MinIO-compatible object storage.
 *
 * Deliberately small interface (save / read / delete / absolutePath) so a future
 * adapter can implement the same contract without touching callers.
 */
function storageClient() {
  if (env.STORAGE_ADAPTER === "minio") {
    return new MinioClient({
      endPoint: env.MINIO_ENDPOINT!,
      port: env.MINIO_PORT ?? 9000,
      useSSL: env.MINIO_USE_SSL ?? false,
      accessKey: env.MINIO_ACCESS_KEY!,
      secretKey: env.MINIO_SECRET_KEY!,
    });
  }

  return new MinioClient({
    endPoint: env.S3_ENDPOINT || "s3.amazonaws.com",
    port: 443,
    useSSL: env.S3_USE_SSL,
    accessKey: env.S3_ACCESS_KEY_ID!,
    secretKey: env.S3_SECRET_ACCESS_KEY!,
    region: env.S3_REGION,
  });
}

async function ensureBucketExists(bucketName: string) {
  if (env.STORAGE_ADAPTER !== "minio") {
    return;
  }

  const client = storageClient();
  const exists = await client.bucketExists(bucketName);
  if (!exists) {
    await client.makeBucket(bucketName);
  }
}

export const FileStorageService = {
  async save(params: {
    companyId: string;
    originalName: string;
    buffer: Buffer;
  }): Promise<{ filePath: string }> {
    const filePath = path.join(params.companyId, `${randomUUID()}${path.extname(params.originalName) || ".pdf"}`);

    if (env.STORAGE_ADAPTER === "minio" || env.STORAGE_ADAPTER === "s3") {
      const bucket = env.STORAGE_ADAPTER === "minio" ? env.MINIO_BUCKET! : env.S3_BUCKET!;
      await ensureBucketExists(bucket);
      await storageClient().putObject(bucket, filePath, params.buffer);
      return { filePath };
    }

    const dir = path.join(uploadRoot(), params.companyId);
    await fs.mkdir(dir, { recursive: true });
    const absolute = path.join(dir, path.basename(filePath));
    await fs.writeFile(absolute, params.buffer);
    return { filePath };
  },

  async read(filePath: string): Promise<Buffer> {
    if (env.STORAGE_ADAPTER === "minio" || env.STORAGE_ADAPTER === "s3") {
      const bucket = env.STORAGE_ADAPTER === "minio" ? env.MINIO_BUCKET! : env.S3_BUCKET!;
      const stream = await storageClient().getObject(bucket, filePath);
      const chunks: Buffer[] = [];
      for await (const chunk of stream as AsyncIterable<Buffer>) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    }

    return fs.readFile(this.absolutePath(filePath));
  },

  async delete(filePath: string): Promise<void> {
    if (env.STORAGE_ADAPTER === "minio" || env.STORAGE_ADAPTER === "s3") {
      const bucket = env.STORAGE_ADAPTER === "minio" ? env.MINIO_BUCKET! : env.S3_BUCKET!;
      try {
        await storageClient().removeObject(bucket, filePath);
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (code !== "NoSuchKey") throw err;
      }
      return;
    }

    try {
      await fs.unlink(this.absolutePath(filePath));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }
  },

  absolutePath(filePath: string): string {
    return path.join(uploadRoot(), filePath);
  },
};
