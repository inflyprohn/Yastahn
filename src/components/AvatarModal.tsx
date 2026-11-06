import React, { useState, useRef, useEffect } from 'react';
import { Camera, Trash2, X, AlertCircle, CheckCircle2, User as UserIcon, Phone, Shield } from 'lucide-react';
import { User } from '../types';
import { validateImageFile } from '../utils/formatters';
import { updateUserProfile } from '../services/storage';
import { UserAvatar } from './UserAvatar';

interface AvatarModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onAvatarUpdated: (newAvatarUrl: string | null, newName?: string) => void;
  onUserUpdated?: (updatedUser: User) => void;
}

export const AvatarModal: React.FC<AvatarModalProps> = ({
  user,
  isOpen,
  onClose,
  onAvatarUpdated,
  onUserUpdated,
}) => {
  const [nombre, setNombre] = useState<string>(user.nombre || '');
  const [celular, setCelular] = useState<string>(user.celular || '');
  const [previewUrl, setPreviewUrl] = useState<string | null>(user.avatarUrl || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setNombre(user.nombre || '');
      setCelular(user.celular || '');
      setPreviewUrl(user.avatarUrl || null);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

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

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!nombre.trim()) {
      setErrorMessage('El nombre no puede estar vacío.');
      return;
    }

    const res = updateUserProfile(
      user.id,
      {
        nombre: nombre.trim(),
        avatarUrl: previewUrl,
        celular: celular.trim() || undefined,
      },
      user
    );

    if (res.success && res.user) {
      onAvatarUpdated(previewUrl, nombre.trim());
      if (onUserUpdated) {
        onUserUpdated(res.user);
      }
      setSuccessMessage('Perfil actualizado exitosamente.');
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setErrorMessage(res.error || 'No se pudo actualizar el perfil.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50/70">
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-amber-800" />
            <div>
              <h3 className="text-base font-bold text-stone-900 font-orlando">Editar Perfil</h3>
              <p className="text-[11px] text-stone-500 capitalize">Rol: {user.role}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content con scroll */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Mensajes de error o éxito */}
          {errorMessage && (
            <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Campo Nombre Completo */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-800">
              Nombre de usuario / Administrador
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Lic. Roberto Paz o tu nombre deseado"
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-700 focus:bg-white"
              />
            </div>
            <p className="text-[11px] text-stone-500">
              Puedes cambiar el nombre por el que desees mostrar en toda la plataforma.
            </p>
          </div>

          {/* Campo Celular (si aplica) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-800">
              Teléfono de contacto
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={celular}
                onChange={(e) => setCelular(e.target.value)}
                placeholder="+504 9900-1122"
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-medium focus:outline-none focus:ring-1 focus:ring-amber-700 focus:bg-white"
              />
            </div>
          </div>

          {/* Zona de Foto de Perfil */}
          <div className="pt-2 border-t border-stone-100 space-y-3">
            <label className="block text-xs font-bold text-stone-800">
              Foto de perfil (avatar)
            </label>

            <div className="flex items-center gap-4">
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-stone-200 shadow-xs flex items-center justify-center bg-stone-100">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserAvatar
                      nombre={nombre || user.nombre}
                      avatarUrl={null}
                      role={user.role}
                      size="lg"
                    />
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-1.5 px-3 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {previewUrl ? 'Cambiar foto' : 'Subir foto'}
                  </button>

                  {previewUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="py-1.5 px-3 bg-stone-100 text-stone-700 hover:text-rose-600 hover:bg-rose-50 border border-stone-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Quitar
                    </button>
                  )}
                </div>

                <p className="text-[10px] text-stone-400">
                  Formatos: JPEG, PNG o WebP (máx. 2 MB).
                </p>
              </div>
            </div>
          </div>

          {/* Footer del Form */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-800 text-white rounded-xl text-xs font-bold hover:bg-amber-900 transition-colors shadow-xs"
            >
              Guardar Perfil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
