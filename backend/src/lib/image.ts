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
 * Validate that a buffer's leading bytes are a real JPEG, PNG, or WebP file.
 * The client-supplied mimetype is untrusted; inspect actual magic bytes so a
 * malformed or spoofed upload fails fast with a clear error before sharp runs.
 */
function isAllowedImage(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;

  // PNG: 89 50 4E 47 0D 0A 1A 0A (check the 8-byte signature)
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return true;
  }

  // WebP: "RIFF" (bytes 0-3) .... "WEBP" (bytes 8-11)
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return true;
  }

  return false;
}

/**
 * Process and upload an image buffer.
 * Creates an optimized full-size version and a thumbnail.
 */
export async function processAndUploadImage(
  buffer: Buffer,
  originalMimetype: string
): Promise<ProcessedImage> {
  if (!isAllowedImage(buffer)) {
    throw new Error('Unsupported or corrupt image file');
  }

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
  if (!isAllowedImage(buffer)) {
    throw new Error('Unsupported or corrupt image file');
  }

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
