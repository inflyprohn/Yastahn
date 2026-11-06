import React, { useState, useRef } from 'react';
import { Camera, Trash2, X, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { User } from '../types';
import { validateImageFile } from '../utils/formatters';
import { updateUserAvatar } from '../services/storage';
import { UserAvatar } from './UserAvatar';

interface AvatarModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onAvatarUpdated: (newAvatarUrl: string | null) => void;
}

export const AvatarModal: React.FC<AvatarModalProps> = ({
  user,
  isOpen,
  onClose,
  onAvatarUpdated,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(user.avatarUrl || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación estricta según sección 6 del requerimiento
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Archivo no permitido');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.onerror = () => {
      setErrorMessage('No se pudo leer el archivo de imagen.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPreviewUrl(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = () => {
    const success = updateUserAvatar(user.id, previewUrl, user);
    if (success) {
      onAvatarUpdated(previewUrl);
      setSuccessMessage('Foto de perfil actualizada con éxito.');
      setTimeout(() => {
        onClose();
      }, 800);
    } else {
      setErrorMessage('No se pudo actualizar la foto de perfil.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-700" />
            <h3 className="text-base font-bold text-stone-900">Foto de perfil</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Advertencia de entorno de demostración */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex gap-3 text-xs text-amber-900">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Aviso de seguridad del prototipo</p>
              <p className="mt-0.5 text-stone-700">
                Esta es una versión de demostración. Por favor, <strong>no suba fotografías personales reales</strong> ni documentos confidenciales. Utilice imágenes de muestra o avatares ilustrativos.
              </p>
            </div>
          </div>

          {/* Vista previa circular */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full overflow-hidden border-3 border-stone-200 shadow-inner flex items-center justify-center bg-stone-100">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Vista previa circular"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserAvatar
                    nombre={user.nombre}
                    avatarUrl={null}
                    role={user.role}
                    size="xl"
                  />
                )}
              </div>
            </div>
            <p className="mt-3 text-xs text-stone-500">
              Vista previa en formato circular de {user.nombre}
            </p>
          </div>

          {/* Mensajes de error o éxito */}
          {errorMessage && (
            <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Acciones de selección de archivo */}
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2.5 px-4 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <Camera className="w-4 h-4" />
                {previewUrl ? 'Cambiar imagen' : 'Subir imagen'}
              </button>

              {previewUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="py-2.5 px-4 bg-stone-100 text-stone-700 hover:text-rose-600 hover:bg-rose-50 border border-stone-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  Quitar
                </button>
              )}
            </div>

            <p className="text-center text-[11px] text-stone-500">
              Formatos admitidos: JPEG, PNG o WebP. Tamaño máximo: 2 MB. Archivos SVG no permitidos.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-stone-50 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-700 hover:text-stone-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-amber-700 text-white rounded-xl text-xs font-semibold hover:bg-amber-800 transition-colors shadow-xs"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
};
