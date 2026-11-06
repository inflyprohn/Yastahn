import React, { useState } from 'react';
import { Store, Lock, Mail, ShieldAlert, Check } from 'lucide-react';
import { User } from '../types';
import { loginDueno } from '../services/storage';

interface OwnerAuthViewProps {
  onSuccess: (user: User) => void;
  onNavigate: (route: string) => void;
}

export const OwnerAuthView: React.FC<OwnerAuthViewProps> = ({
  onSuccess,
  onNavigate,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const res = loginDueno(email, password);
    if (res.error || !res.user) {
      setErrorMsg(res.error || 'Credenciales no válidas');
      return;
    }

    onSuccess(res.user);
    onNavigate('/dueno');
  };

  const handleAutofillElena = () => {
    setEmail('dueno@yasta.hn');
    setPassword('Copan2026!');
    setErrorMsg(null);
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-xs">
          <Store className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">
          Panel de Dueño de Cafetería
        </h1>
        <p className="text-xs text-stone-500">
          Accede para administrar menús, pedidos en mostrador y crédito a clientes
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="dueno@yasta.hn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600"
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
            Ingresar al Panel de Dueño
          </button>
        </form>

        <div className="text-center pt-2 border-t border-stone-100">
          <p className="text-[11px] text-stone-500">
            ¿Eres cliente?{' '}
            <button
              onClick={() => onNavigate('/cliente/ingresar')}
              className="text-amber-800 font-bold hover:underline"
            >
              Ingresa por el portal de clientes
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
