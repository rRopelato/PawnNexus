const maxImages = 5;
const maxOriginalBytes = 5 * 1024 * 1024;
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

type ProcessedImage = {
  original: File;
  image: File;
  thumb: File;
};

export async function processPawnImages(files: File[]) {
  if (files.length < 1) throw new Error('Select at least one image.');
  if (files.length > maxImages) throw new Error('You can upload at most 5 images.');

  const processed: ProcessedImage[] = [];

  for (const file of files) {
    validateOriginal(file);
    const bitmap = await createImageBitmap(file).catch(() => null);
    if (!bitmap) throw new Error(`${file.name} is not a valid image.`);

    const full = await renderWebp(bitmap, fitInside(bitmap.width, bitmap.height, 1920, 1080), 0.86, 'imagem.webp');
    const thumb = await renderWebp(bitmap, fitWidth(bitmap.width, bitmap.height, 400), 0.78, 'thumb.webp');
    bitmap.close();

    processed.push({ original: file, image: full, thumb });
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

async function renderWebp(bitmap: ImageBitmap, size: { width: number; height: number }, quality: number, name: string) {
  let blob: Blob | null = null;

  if ('OffscreenCanvas' in window) {
    const canvas = new OffscreenCanvas(size.width, size.height);
    const context = canvas.getContext('2d');

    if (!context) throw new Error('Unable to process image.');

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(bitmap, 0, 0, size.width, size.height);

    blob = await canvas.convertToBlob({
      type: 'image/webp',
      quality,
    }).catch(() => null);
  }

  if (!blob) {
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Unable to process image.');

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(bitmap, 0, 0, size.width, size.height);

    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', quality);
    });
  }

  if (!blob || blob.type !== 'image/webp') {
    throw new Error('This browser could not convert the image to WebP. Please try Chrome, Firefox, or upload from desktop.');
  }

  return new File([blob], name, { type: 'image/webp' });
}
