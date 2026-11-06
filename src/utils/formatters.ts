/**
 * Formateador de moneda en Lempiras hondureños (HNL)
 * Requisito estricto: Intl.NumberFormat("es-HN", { style: "currency", currency: "HNL" })
 */
const hnlFormatter = new Intl.NumberFormat("es-HN", {
  style: "currency",
  currency: "HNL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatHNL(amount: number): string {
  if (isNaN(amount)) return 'L 0.00';
  return hnlFormatter.format(amount);
}

/**
 * Formato de fecha y hora para Honduras (UTC-6)
 */
export function formatHondurasDateTime(isoDateString: string): string {
  try {
    const date = new Date(isoDateString);
    return new Intl.DateTimeFormat("es-HN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Tegucigalpa",
    }).format(date);
  } catch {
    return isoDateString;
  }
}

export function formatHondurasDate(isoDateString: string): string {
  try {
    const date = new Date(isoDateString);
    return new Intl.DateTimeFormat("es-HN", {
      dateStyle: "medium",
      timeZone: "America/Tegucigalpa",
    }).format(date);
  } catch {
    return isoDateString;
  }
}

export function formatHondurasTime(isoDateString: string): string {
  try {
    const date = new Date(isoDateString);
    return new Intl.DateTimeFormat("es-HN", {
      timeStyle: "short",
      timeZone: "America/Tegucigalpa",
    }).format(date);
  } catch {
    return isoDateString;
  }
}

/**
 * Normaliza y valida números de celular hondureños (+504 9XXX-XXXX o 8XXX-XXXX o 3XXX-XXXX)
 */
export function formatHondurasPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('504') && digits.length === 11) {
    const local = digits.slice(3);
    return `+504 ${local.slice(0, 4)}-${local.slice(4)}`;
  }
  if (digits.length === 8) {
    return `+504 ${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  return phone;
}

export function isValidHondurasPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('504')) {
    return digits.length === 11;
  }
  return digits.length === 8;
}

export function isValidPIN(pin: string): boolean {
  return /^\d{4}$/.test(pin.trim());
}

/**
 * Validación estricta de imágenes para fotos de perfil y logos
 * Solo acepta JPEG, PNG y WebP. Rechaza SVG y archivos no válidos.
 * Límite: 2 MB
 */
export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File): ImageValidationResult {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxBytes = 2 * 1024 * 1024; // 2 MB

  if (!allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Formato no permitido. Solo se aceptan imágenes JPG, PNG o WebP. Los archivos SVG o ejecutables no están permitidos por seguridad.',
    };
  }

  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `El archivo supera el tamaño máximo permitido de 2 MB (tamaño actual: ${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
    };
  }

  return { valid: true };
}
