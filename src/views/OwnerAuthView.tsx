import React, { useEffect, useState } from 'react';
import {
  Building2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Store,
  UserRound,
} from 'lucide-react';
import { User } from '../types';
import { loginDueno, registerOwnerWithBusiness } from '../services/storage';
import { formatHondurasPhone, isValidHondurasPhone } from '../utils/formatters';
import { SecretVisibilityToggle } from '../components/SecretVisibilityToggle';

type OwnerAuthMode = 'ingresar' | 'registro';

interface OwnerAuthViewProps {
  initialMode?: OwnerAuthMode;
  onSuccess: (user: User) => void;
  onNavigate: (route: string) => void;
}

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
}

const hondurasDepartments = [
  'Atlántida', 'Choluteca', 'Colón', 'Comayagua', 'Copán', 'Cortés',
  'El Paraíso', 'Francisco Morazán', 'Gracias a Dios', 'Intibucá', 'Islas de la Bahía',
  'La Paz', 'Lempira', 'Ocotepeque', 'Olancho', 'Santa Bárbara', 'Valle', 'Yoro',
];

const fieldClassName =
  'w-full rounded-xl border border-stone-200 bg-stone-50 py-3 pl-10 pr-3 text-sm text-stone-900 outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-600/15';

const TextField: React.FC<TextFieldProps> = ({
  id,
  label,
  value,
  onChange,
  icon,
  type = 'text',
  placeholder,
  autoComplete,
  maxLength,
}) => (
  <div>
    <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-stone-700">
      {label}
    </label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" aria-hidden="true">
        {icon}
      </span>
      <input
        id={id}
        type={type}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        className={fieldClassName}
      />
    </div>
  </div>
);

export const OwnerAuthView: React.FC<OwnerAuthViewProps> = ({
  initialMode = 'ingresar',
  onSuccess,
  onNavigate,
}) => {
  const [mode, setMode] = useState<OwnerAuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [responsableNombre, setResponsableNombre] = useState('');
  const [celular, setCelular] = useState('');
  const [nombreNegocio, setNombreNegocio] = useState('');
  const [tipoNegocio, setTipoNegocio] = useState('Comedor');
  const [ciudad, setCiudad] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [direccion, setDireccion] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setErrorMsg(null);
  }, [initialMode]);

  const changeMode = (nextMode: OwnerAuthMode) => {
    setErrorMsg(null);
    setMode(nextMode);
    onNavigate(nextMode === 'registro' ? '/dueno/registro' : '/dueno/ingresar');
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);

    if (mode === 'ingresar') {
      const result = loginDueno(email, password);
      if (result.error || !result.user) {
        setErrorMsg(result.error || 'Credenciales no válidas.');
        return;
      }

      onSuccess(result.user);
      onNavigate('/dueno');
      return;
    }

    if (!isValidHondurasPhone(celular)) {
      setErrorMsg('Escribe un celular hondureño válido de 8 dígitos.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    const result = registerOwnerWithBusiness({
      responsableNombre,
      celular: formatHondurasPhone(celular),
      email,
      password,
      nombreNegocio,
      tipoNegocio,
      ciudad,
      departamento,
      direccion,
    });
    if (result.error || !result.user) {
      setErrorMsg(result.error || 'No fue posible crear la cuenta. Revisa los datos e inténtalo de nuevo.');
      return;
    }

    onSuccess(result.user);
    onNavigate('/dueno');
  };

  const isRegistering = mode === 'registro';

  return (
    <div className={`mx-auto px-4 py-10 sm:py-12 ${isRegistering ? 'max-w-3xl' : 'max-w-lg'}`}>
      <div className="mb-7 space-y-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-900 shadow-xs">
          {isRegistering ? <Building2 className="h-6 w-6" /> : <Store className="h-6 w-6" />}
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-stone-900 sm:text-3xl">
            {isRegistering ? 'Registra tu negocio en Yasta' : 'Acceso para negocios'}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-stone-600">
            {isRegistering
              ? 'Crea la cuenta del responsable y el perfil de tu cafetería, comedor o negocio de comida.'
              : 'Administra tu menú, pedidos para recoger y cuentas de tus clientes.'}
          </p>
        </div>
      </div>

      <div className="space-y-6 rounded-3xl border border-stone-200 bg-white p-5 shadow-xs sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {isRegistering ? (
            <>
              <section className="space-y-4">
                <div className="border-b border-stone-100 pb-2">
                  <h2 className="text-sm font-bold text-stone-900">Cuenta del responsable</h2>
                  <p className="mt-1 text-xs text-stone-500">Datos para ingresar y administrar el negocio.</p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField
                    id="owner-name"
                    label="Nombre del responsable"
                    value={responsableNombre}
                    onChange={setResponsableNombre}
                    icon={<UserRound className="h-4 w-4" />}
                    placeholder="Nombre y apellido"
                    autoComplete="name"
                  />
                  <TextField
                    id="owner-phone"
                    label="Celular hondureño"
                    value={celular}
                    onChange={setCelular}
                    icon={<Phone className="h-4 w-4" />}
                    placeholder="9999-9999"
                    autoComplete="tel"
                    maxLength={16}
                  />
                  <div className="sm:col-span-2">
                    <TextField
                      id="owner-email"
                      label="Correo electrónico"
                      value={email}
                      onChange={setEmail}
                      icon={<Mail className="h-4 w-4" />}
                      type="email"
                      placeholder="tunegocio@correo.com"
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <label htmlFor="owner-password" className="mb-1.5 block text-xs font-semibold text-stone-700">
                      Contraseña <span className="font-normal text-stone-500">(mínimo 8 caracteres)</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <input
                        id="owner-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Crea una contraseña"
                        className={`${fieldClassName} pr-11`}
                      />
                      <SecretVisibilityToggle
                        visible={showPassword}
                        onToggle={() => setShowPassword((visible) => !visible)}
                        label="la contraseña"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="owner-confirm-password" className="mb-1.5 block text-xs font-semibold text-stone-700">
                      Confirmar contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <input
                        id="owner-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Repite la contraseña"
                        className={`${fieldClassName} pr-11`}
                      />
                      <SecretVisibilityToggle
                        visible={showConfirmPassword}
                        onToggle={() => setShowConfirmPassword((visible) => !visible)}
                        label="la confirmación de contraseña"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="border-b border-stone-100 pb-2">
                  <h2 className="text-sm font-bold text-stone-900">Perfil del negocio</h2>
                  <p className="mt-1 text-xs text-stone-500">Esta información aparecerá en el directorio y en tu menú.</p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="business-name" className="mb-1.5 block text-xs font-semibold text-stone-700">
                      Nombre del negocio
                    </label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <input
                        id="business-name"
                        required
                        value={nombreNegocio}
                        onChange={(event) => setNombreNegocio(event.target.value)}
                        placeholder="Ej. Comedor Doña Rosa"
                        className={fieldClassName}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="business-type" className="mb-1.5 block text-xs font-semibold text-stone-700">
                      Tipo de negocio
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <select
                        id="business-type"
                        required
                        value={tipoNegocio}
                        onChange={(event) => setTipoNegocio(event.target.value)}
                        className={`${fieldClassName} appearance-none`}
                      >
                        <option>Cafetería</option>
                        <option>Comedor</option>
                        <option>Restaurante</option>
                        <option>Panadería</option>
                        <option>Otro negocio de comida</option>
                      </select>
                    </div>
                  </div>
                  <TextField
                    id="business-city"
                    label="Ciudad o municipio"
                    value={ciudad}
                    onChange={setCiudad}
                    icon={<MapPin className="h-4 w-4" />}
                    placeholder="Ej. San Pedro Sula"
                    autoComplete="address-level2"
                  />
                  <div>
                    <label htmlFor="business-department" className="mb-1.5 block text-xs font-semibold text-stone-700">
                      Departamento
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <select
                        id="business-department"
                        required
                        value={departamento}
                        onChange={(event) => setDepartamento(event.target.value)}
                        className={`${fieldClassName} appearance-none`}
                      >
                        <option value="" disabled>Selecciona un departamento</option>
                        {hondurasDepartments.map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <TextField
                      id="business-address"
                      label="Dirección del local"
                      value={direccion}
                      onChange={setDireccion}
                      icon={<MapPin className="h-4 w-4" />}
                      placeholder="Colonia, calle, punto de referencia"
                      autoComplete="street-address"
                    />
                  </div>
                </div>
              </section>

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-950">
                <strong>Versión de prueba:</strong> por ahora la cuenta se guarda en este navegador. No uses una contraseña real ni información sensible; para operar públicamente hace falta conectar un servidor y una base de datos seguros.
              </div>
            </>
          ) : (
            <>
              <TextField
                id="login-email"
                label="Correo electrónico"
                value={email}
                onChange={setEmail}
                icon={<Mail className="h-4 w-4" />}
                type="email"
                placeholder="tunegocio@correo.com"
                autoComplete="email"
              />
              <div>
                <label htmlFor="login-password" className="mb-1.5 block text-xs font-semibold text-stone-700">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Tu contraseña"
                    className={`${fieldClassName} pr-11`}
                  />
                  <SecretVisibilityToggle
                    visible={showPassword}
                    onToggle={() => setShowPassword((visible) => !visible)}
                    label="la contraseña"
                  />
                </div>
              </div>
            </>
          )}

          {errorMsg && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-amber-800 px-5 py-3.5 text-sm font-bold text-white shadow-xs transition-colors hover:bg-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2"
          >
            {isRegistering ? 'Crear cuenta y perfil del negocio' : 'Ingresar al panel del negocio'}
          </button>
        </form>

        <div className="space-y-3 border-t border-stone-100 pt-5 text-center">
          {isRegistering ? (
            <p className="text-xs text-stone-600">
              ¿Ya tienes una cuenta?{' '}
              <button type="button" onClick={() => changeMode('ingresar')} className="font-bold text-amber-900 hover:underline">
                Inicia sesión
              </button>
            </p>
          ) : (
            <>
              <p className="text-xs text-stone-600">
                ¿Tu negocio todavía no está en Yasta?{' '}
                <button type="button" onClick={() => changeMode('registro')} className="font-bold text-amber-900 hover:underline">
                  Regístralo aquí
                </button>
              </p>
              <p className="text-xs text-stone-500">
                ¿Eres cliente?{' '}
                <button type="button" onClick={() => onNavigate('/cliente/ingresar')} className="font-semibold text-stone-800 hover:underline">
                  Ingresa por el portal de clientes
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
