import React, { useState } from 'react';
import { Shield, Lock, Mail, ShieldAlert, Check } from 'lucide-react';
import { User } from '../types';
import { loginSuperadmin } from '../services/storage';

interface SuperadminAuthViewProps {
  onSuccess: (user: User) => void;
  onNavigate: (route: string) => void;
}

export const SuperadminAuthView: React.FC<SuperadminAuthViewProps> = ({
  onSuccess,
  onNavigate,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const res = loginSuperadmin(email, password);
    if (res.error || !res.user) {
      setErrorMsg(res.error || 'Credenciales no autorizadas');
      return;
    }

    onSuccess(res.user);
    onNavigate('/superadmin');
  };

  const handleAutofillAdmin = () => {
    setEmail('admin@yasta.hn');
    setPassword('YastaSuper2026!');
    setErrorMsg(null);
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white flex items-center justify-center mx-auto shadow-xs">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">
          Superadministración
        </h1>
        <p className="text-xs text-stone-500">
          Acceso reservado para supervisión de plataforma y auditoría de seguridad
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-700 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-stone-900 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Acceso Restringido:</strong> Esta pantalla no admite registro público. Todas las sesiones y cambios quedan registrados en la auditoría inmutable del sistema.
          </p>
        </div>

        {/* Botón rápido para demo */}
        <button
          type="button"
          onClick={handleAutofillAdmin}
          className="w-full py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
        >
          <Check className="w-3.5 h-3.5 text-stone-900" />
          Autocompletar con cuenta demo (Lic. Roberto Paz)
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Correo corporativo
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="admin@yasta.hn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Contraseña de seguridad
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            Iniciar Sesión como Superadministrador
          </button>
        </form>

        <div className="text-center pt-2 border-t border-stone-100">
          <button
            onClick={() => onNavigate('/')}
            className="text-xs text-stone-600 hover:text-stone-900 font-semibold"
          >
            Volver a la página principal
          </button>
        </div>
      </div>
    </div>
  );
};
