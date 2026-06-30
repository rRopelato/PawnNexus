const maxImages = 5;
const maxOriginalBytes = 5 * 1024 * 1024;
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

type ProcessedImage = {
  original: File;
  image: File;
  thumb: File;
};

type OutputFormat = {
  mimeType: 'image/webp' | 'image/jpeg';
  extension: 'webp' | 'jpg';
};

const webpFormat: OutputFormat = { mimeType: 'image/webp', extension: 'webp' };
const jpegFormat: OutputFormat = { mimeType: 'image/jpeg', extension: 'jpg' };

export async function processPawnImages(files: File[]) {
  if (files.length < 1) throw new Error('Select at least one image.');
  if (files.length > maxImages) throw new Error('You can upload at most 5 images.');

  const processed: ProcessedImage[] = [];

  for (const file of files) {
    validateOriginal(file);
    const bitmap = await createImageBitmap(file).catch(() => null);
    if (!bitmap) throw new Error(`${file.name} is not a valid image.`);

    try {
      processed.push({ original: file, ...(await renderImagePair(bitmap)) });
    } finally {
      bitmap.close();
    }
  }

  return processed;
}

function validateOriginal(file: File) {
  if (!allowedTypes.has(file.type)) {
    throw new Error(`${file.name} must be JPG, JPEG, PNG, or WebP.`);
  }

  if (file.size > maxOriginalBytes) {
    throw new Error(`${file.name} must be 5 MB or less.`);
  }
}

async function renderImagePair(bitmap: ImageBitmap) {
  const fullSize = fitInside(bitmap.width, bitmap.height, 1920, 1080);
  const thumbSize = fitWidth(bitmap.width, bitmap.height, 400);

  const webp = await renderPairAs(bitmap, fullSize, thumbSize, webpFormat).catch(() => null);
  if (webp) return webp;

  const jpeg = await renderPairAs(bitmap, fullSize, thumbSize, jpegFormat).catch(() => null);
  if (jpeg) return jpeg;

  throw new Error('This browser could not process this image. Please try another image or upload from desktop.');
}

async function renderPairAs(
  bitmap: ImageBitmap,
  fullSize: { width: number; height: number },
  thumbSize: { width: number; height: number },
  format: OutputFormat,
) {
  const image = await renderImage(bitmap, fullSize, 0.86, `image.${format.extension}`, format);
  const thumb = await renderImage(bitmap, thumbSize, 0.78, `thumb.${format.extension}`, format);
  return { image, thumb };
}

function fitInside(width: number, height: number, maxWidth: number, maxHeight: number) {
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function fitWidth(width: number, height: number, targetWidth: number) {
  const scale = Math.min(1, targetWidth / width);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function renderImage(
  bitmap: ImageBitmap,
  size: { width: number; height: number },
  quality: number,
  name: string,
  format: OutputFormat,
) {
  const blob = await renderBlob(bitmap, size, quality, format.mimeType);
  if (!blob || blob.type !== format.mimeType) {
    throw new Error('Unable to process image.');
  }

  return new File([blob], name, { type: format.mimeType });
}

async function renderBlob(bitmap: ImageBitmap, size: { width: number; height: number }, quality: number, mimeType: string) {
  if ('OffscreenCanvas' in window) {
    const canvas = new OffscreenCanvas(size.width, size.height);
    const context = canvas.getContext('2d');

    if (!context) throw new Error('Unable to process image.');

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(bitmap, 0, 0, size.width, size.height);

    const blob = await canvas.convertToBlob({ type: mimeType, quality }).catch(() => null);
    if (blob?.type === mimeType) return blob;
  }

  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to process image.');

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(bitmap, 0, 0, size.width, size.height);

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType, quality);
  });
}
