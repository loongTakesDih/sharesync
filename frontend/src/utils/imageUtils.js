const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxBase64Length = 700000;
const outputWidth = 600;
const outputHeight = 450;

export const readImageFileForCrop = async (file) => {
  if (!file || !acceptedImageTypes.includes(file.type)) {
    throw new Error("Please choose a JPEG, PNG, or WebP image.");
  }

  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);

  return {
    height: image.height,
    source,
    width: image.width,
  };
};

export const cropImageToBase64 = async ({
  focalX = 50,
  focalY = 50,
  source,
  zoom = 1,
}) => {
  const image = await loadImage(source);
  const attempts = [
    { quality: 0.68, width: outputWidth, height: outputHeight },
    { quality: 0.62, width: outputWidth, height: outputHeight },
    { quality: 0.6, width: 540, height: 405 },
    { quality: 0.58, width: 480, height: 360 },
  ];

  for (const attempt of attempts) {
    const cropped = drawCroppedImage(image, {
      ...attempt,
      focalX,
      focalY,
      zoom,
    });

    if (cropped.length <= maxBase64Length) {
      return cropped;
    }
  }

  throw new Error("Image is too large. Please choose a smaller image.");
};

export const compressImageToBase64 = async (file) => {
  const cropImage = await readImageFileForCrop(file);

  return cropImageToBase64({
    focalX: 50,
    focalY: 50,
    source: cropImage.source,
    zoom: 1,
  });
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read this image."));
    reader.readAsDataURL(file);
  });

const loadImage = (source) =>
  new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load this image."));
    image.src = source;
  });

const drawCroppedImage = (
  image,
  { focalX, focalY, height, quality, width, zoom }
) => {
  const targetAspect = width / height;
  const imageAspect = image.width / image.height;
  let cropWidth = image.width;
  let cropHeight = image.height;

  if (imageAspect > targetAspect) {
    cropWidth = image.height * targetAspect;
  } else {
    cropHeight = image.width / targetAspect;
  }

  const safeZoom = Math.max(1, Math.min(2.5, zoom));
  cropWidth /= safeZoom;
  cropHeight /= safeZoom;

  const sourceX = (image.width - cropWidth) * (focalX / 100);
  const sourceY = (image.height - cropHeight) * (focalY / 100);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = width;
  canvas.height = height;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(
    image,
    sourceX,
    sourceY,
    cropWidth,
    cropHeight,
    0,
    0,
    width,
    height
  );

  return canvas.toDataURL("image/jpeg", quality);
};
