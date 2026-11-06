import React, { useState } from 'react';
import { Coffee, LogIn, LogOut, User as UserIcon, Shield, Store, Menu as HamburgerIcon, X } from 'lucide-react';
import { User } from '../types';
import { UserAvatar } from './UserAvatar';
import { AvatarModal } from './AvatarModal';
import { setCurrentUser } from '../services/storage';

interface TopBarProps {
  currentUser: User | null;
  currentRoute: string;
  onNavigate: (route: string) => void;
  onUserChanged: (user: User | null) => void;
  onOpenMobileSidebar: () => void;
  onOpenAvatarModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentUser,
  currentRoute,
  onNavigate,
  onUserChanged,
  onOpenMobileSidebar,
  onOpenAvatarModal,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const handleLogout = () => {
    setCurrentUser(null);
    onUserChanged(null);
    setShowUserDropdown(false);
    onNavigate('/');
  };

  // Título contextual según ruta
  const getPageTitle = () => {
    if (currentRoute === '/') return 'Cafeterías y Comedores';
    if (currentRoute.startsWith('/c/')) return 'Menú de Cafetería';
    if (currentRoute === '/cliente') return 'Mis Pedidos y Saldos';
    if (currentRoute === '/dueno') return 'Panel de Gestión Comercial';
    if (currentRoute === '/superadmin') return 'Superadministración de Plataforma';
    if (currentRoute === '/soporte') return 'Centro de Soporte y Casos';
    if (currentRoute.includes('ingresar')) return 'Iniciar Sesión';
    if (currentRoute.includes('registro')) return 'Registro de Cliente';
    return 'Yasta Honduras';
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 no-print">
        <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Lado Izquierdo: Botón Menú Móvil + Título Contextual */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenMobileSidebar}
              className="lg:hidden p-2 rounded-xl text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-colors focus:outline-none"
              title="Abrir menú de navegación"
            >
              <HamburgerIcon className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-base sm:text-lg font-black font-orlando text-stone-900 tracking-tight leading-tight">
                {getPageTitle()}
              </h1>
              <p className="text-[11px] text-stone-600 hidden sm:block">
                Honduras · Pedidos para recoger en local
              </p>
            </div>
          </div>

          {/* Lado Derecho: Acciones Rápidas y Perfil */}
          <div className="flex items-center gap-3 shrink-0">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 p-1.5 rounded-2xl hover:bg-stone-100 border border-stone-200/80 transition-colors focus:outline-none bg-stone-50/50"
                  title="Menú de usuario"
                >
                  <UserAvatar
                    nombre={currentUser.nombre}
                    avatarUrl={currentUser.avatarUrl}
                    role={currentUser.role}
                    size="sm"
                  />
                  <div className="hidden sm:flex flex-col text-left pr-1.5">
                    <span className="text-xs font-bold text-stone-900 max-w-[130px] truncate leading-tight">
                      {currentUser.nombre}
                    </span>
                    <span className="text-[10px] text-amber-800 font-semibold capitalize leading-none">
                      {currentUser.role}
                    </span>
                  </div>
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="text-xs font-bold text-stone-900 truncate">
                        {currentUser.nombre}
                      </p>
                      <p className="text-[11px] text-stone-500 capitalize">
                        Rol: {currentUser.role}
                      </p>
                      <p className="text-[11px] font-mono text-stone-400 truncate">
                        {currentUser.celular || currentUser.email}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenAvatarModal();
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-stone-500" />
                      Foto de perfil
                    </button>

                    {currentUser.role === 'cliente' && (
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onNavigate('/cliente');
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2 transition-colors"
                      >
                        <Coffee className="w-4 h-4 text-stone-500" />
                        Mis pedidos y saldos
                      </button>
                    )}

                    {currentUser.role === 'dueno' && (
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onNavigate('/dueno');
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2 transition-colors"
                      >
                        <Store className="w-4 h-4 text-stone-500" />
                        Panel del negocio
                      </button>
                    )}

                    {currentUser.role === 'superadmin' && (
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onNavigate('/superadmin');
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2 transition-colors"
                      >
                        <Shield className="w-4 h-4 text-stone-500" />
                        Superadministrador
                      </button>
                    )}

                    <div className="border-t border-stone-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors font-semibold"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('/cliente/ingresar')}
                  className="px-3 sm:px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-colors"
                >
                  Ingresar
                </button>
                <button
                  onClick={() => onNavigate('/cliente/registro')}
                  className="px-3 sm:px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  Registrarse
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
