import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import fs from 'fs/promises';
import { env } from '../config/env';

const isR2 = Boolean(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET);

let s3: S3Client | null = null;

if (isR2) {
  s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

async function ensureUploadsDir() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

/**
 * Upload a buffer to storage (R2 in production, local disk in development).
 * Returns the public URL path.
 */
export async function uploadBuffer(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  if (isR2 && s3) {
    await s3.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
    // Return R2 public URL
    const publicUrl = env.R2_PUBLIC_URL || `https://${env.R2_BUCKET}.r2.dev`;
    return `${publicUrl}/${key}`;
  }

  // Local disk fallback
  await ensureUploadsDir();
  const filePath = path.join(UPLOADS_DIR, key);
  // Ensure subdirectories exist (e.g., uploads/thumbnails/)
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
  return `/uploads/${key}`;
}

/**
 * Delete a file from storage.
 */
export async function deleteFile(urlOrKey: string): Promise<void> {
  if (isR2 && s3) {
    // Extract key from full URL
    const key = urlOrKey.replace(/^https?:\/\/[^/]+\//, '');
    await s3.send(
      new DeleteObjectCommand({
        Bucket: env.R2_BUCKET!,
        Key: key,
      })
    );
    return;
  }

  // Local disk
  const filePath = urlOrKey.startsWith('/uploads/')
    ? path.join(UPLOADS_DIR, urlOrKey.replace('/uploads/', ''))
    : path.join(UPLOADS_DIR, urlOrKey);

  try {
    await fs.unlink(filePath);
  } catch {
    // File may not exist — ignore
  }
}

export { isR2 };
