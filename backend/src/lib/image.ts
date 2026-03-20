import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { uploadBuffer } from './storage';

interface ProcessedImage {
  /** Full-size optimized image URL */
  url: string;
  /** Thumbnail URL */
  thumbnailUrl: string;
}

const FULL_MAX_WIDTH = 2048;
const FULL_QUALITY = 82;
const THUMB_WIDTH = 400;
const THUMB_QUALITY = 70;

/**
 * Process and upload an image buffer.
 * Creates an optimized full-size version and a thumbnail.
 */
export async function processAndUploadImage(
  buffer: Buffer,
  originalMimetype: string
): Promise<ProcessedImage> {
  const id = `${Date.now()}-${uuidv4()}`;
  const ext = '.webp'; // Normalize all output to webp

  // Full-size optimized
  const fullBuffer = await sharp(buffer)
    .rotate() // Auto-rotate based on EXIF
    .resize(FULL_MAX_WIDTH, FULL_MAX_WIDTH, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: FULL_QUALITY })
    .toBuffer();

  // Thumbnail
  const thumbBuffer = await sharp(buffer)
    .rotate()
    .resize(THUMB_WIDTH, THUMB_WIDTH, {
      fit: 'cover',
    })
    .webp({ quality: THUMB_QUALITY })
    .toBuffer();

  const fullKey = `images/${id}${ext}`;
  const thumbKey = `thumbnails/${id}${ext}`;

  const [url, thumbnailUrl] = await Promise.all([
    uploadBuffer(fullBuffer, fullKey, 'image/webp'),
    uploadBuffer(thumbBuffer, thumbKey, 'image/webp'),
  ]);

  return { url, thumbnailUrl };
}

/**
 * Process and upload an avatar image.
 * Creates a square-cropped version at two sizes.
 */
export async function processAndUploadAvatar(
  buffer: Buffer
): Promise<string> {
  const id = `${Date.now()}-${uuidv4()}`;
  const ext = '.webp';

  const avatarBuffer = await sharp(buffer)
    .rotate()
    .resize(400, 400, { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer();

  const key = `avatars/${id}${ext}`;
  return uploadBuffer(avatarBuffer, key, 'image/webp');
}
