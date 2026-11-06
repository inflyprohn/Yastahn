import React, { useState } from 'react';
import { User as UserIcon, Lock, Phone, ArrowRight, ShieldAlert, Check } from 'lucide-react';
import { User } from '../types';
import { formatHondurasPhone, isValidHondurasPhone, isValidPIN } from '../utils/formatters';
import { loginCliente, registerCliente } from '../services/storage';

interface ClientAuthViewProps {
  mode: 'ingresar' | 'registro';
  redirectSlug?: string | null;
  onSuccess: (user: User) => void;
  onNavigate: (route: string) => void;
}

export const ClientAuthView: React.FC<ClientAuthViewProps> = ({
  mode,
  redirectSlug,
  onSuccess,
  onNavigate,
}) => {
  const [currentMode, setCurrentMode] = useState<'ingresar' | 'registro'>(mode);
  const [nombre, setNombre] = useState('');
  const [celular, setCelular] = useState('');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isValidHondurasPhone(celular)) {
      setErrorMsg('Ingrese un número de celular hondureño válido de 8 dígitos (+504).');
      return;
    }

    if (!isValidPIN(pin)) {
      setErrorMsg('El PIN debe tener exactamente 4 dígitos numéricos.');
      return;
    }

    if (currentMode === 'ingresar') {
      const res = loginCliente(celular, pin);
      if (res.error || !res.user) {
        setErrorMsg(res.error || 'Credenciales incorrectas');
        return;
      }
      onSuccess(res.user);
      if (redirectSlug) {
        onNavigate(`/c/${redirectSlug}`);
      } else {
        onNavigate('/cliente');
      }
    } else {
      if (!nombre.trim()) {
        setErrorMsg('Por favor ingrese su nombre completo.');
        return;
      }
      const res = registerCliente({
        nombre: nombre.trim(),
        celular: formatHondurasPhone(celular),
        pin,
      });
      if (res.error || !res.user) {
        setErrorMsg(res.error || 'No se pudo crear la cuenta.');
        return;
      }
      onSuccess(res.user);
      if (redirectSlug) {
        onNavigate(`/c/${redirectSlug}`);
      } else {
        onNavigate('/cliente');
      }
    }
  };

  const handleAutofillCarlos = () => {
    setCelular('+504 9555-1234');
    setPin('1234');
    setErrorMsg(null);
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">
          {currentMode === 'ingresar' ? 'Ingreso para Clientes' : 'Registro de Cliente Yasta'}
        </h1>
        <p className="text-xs text-stone-500">
          {redirectSlug
            ? `Continúa para ordenar en la cafetería (/c/${redirectSlug})`
            : 'Accede a tus pedidos, saldos y pagos en cafeterías de Honduras'}
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
        {/* Aviso de prototipo demostrativo */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Entorno de demostración:</strong> El acceso se simula con celular y PIN. En producción se implementa autenticación reforzada y verificación SMS real.
          </p>
        </div>

        {/* Botón rápido para pruebas */}
        {currentMode === 'ingresar' && (
          <button
            type="button"
            onClick={handleAutofillCarlos}
            className="w-full py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5 text-amber-700" />
            Llenar con cuenta de prueba (Carlos Mejía)
          </button>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {currentMode === 'registro' && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nombre completo
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos Mejía"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Celular hondureño (+504)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="tel"
                required
                placeholder="9555-1234 o +504 9555-1234"
                value={celular}
                onChange={(e) => setCelular(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              PIN de 4 dígitos
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="password"
                maxLength={4}
                required
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono tracking-widest text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
            </div>
            <p className="text-[10px] text-stone-400 mt-1">
              4 dígitos numéricos para acceso rápido.
            </p>
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
            {currentMode === 'ingresar' ? 'Ingresar como Cliente' : 'Completar Registro'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-stone-100">
          {currentMode === 'ingresar' ? (
            <button
              onClick={() => {
                setCurrentMode('registro');
                setErrorMsg(null);
              }}
              className="text-xs text-amber-800 font-bold hover:underline"
            >
              ¿No tienes cuenta? Regístrate gratis
            </button>
          ) : (
            <button
              onClick={() => {
                setCurrentMode('ingresar');
                setErrorMsg(null);
              }}
              className="text-xs text-amber-800 font-bold hover:underline"
            >
              ¿Ya estás registrado? Inicia sesión aquí
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
