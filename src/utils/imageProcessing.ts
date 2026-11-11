/**
 * Reduce las imágenes en el navegador antes de guardarlas en el prototipo.
 * Se convierten a JPEG para limitar el espacio usado en localStorage.
 */
export async function optimizeImageForStorage(
  file: File,
  maxDimension: number,
  maxOutputBytes: number
): Promise<string> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.src = objectUrl;

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('No se pudo abrir la imagen.'));
    });

    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

    const context = canvas.getContext('2d');
    if (!context) throw new Error('No se pudo procesar la imagen en este navegador.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    let quality = 0.82;
    let dataUrl = canvas.toDataURL('image/jpeg', quality);
    const getDataUrlBytes = (value: string) => Math.ceil((value.length - value.indexOf(',') - 1) * 0.75);

    while (getDataUrlBytes(dataUrl) > maxOutputBytes && quality > 0.5) {
      quality = Math.max(0.5, quality - 0.08);
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }

    if (getDataUrlBytes(dataUrl) > maxOutputBytes) {
      throw new Error('La imagen sigue siendo demasiado pesada. Prueba con una foto más pequeña.');
    }

    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
