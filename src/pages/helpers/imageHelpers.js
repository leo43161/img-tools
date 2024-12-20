import imageCompression from 'browser-image-compression';

export const compressImage = async (image) => {
  try {
    const options = {
      maxSizeMB: 0.5,
      alwaysKeepResolution: true
    };
    const compressedBlob = await imageCompression(image, options);
    const compressedImage = new File([compressedBlob], image.name, {
      type: image.type,
      lastModified: Date.now(),
    });
    console.log(`Tamaño de la imagen comprimida: ${compressedImage.size / 1024 / 1024} MB`);
    return compressedImage;
  } catch (error) {
    console.error("Error al comprimir la imagen:", error);
    return null;
  }
};