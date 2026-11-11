import React from 'react';
import {
  Coffee,
  Store,
  ShoppingBag,
  Receipt,
  MessageSquare,
  Shield,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  LogOut,
  Camera,
  CheckCircle2,
  Clock,
  Settings,
  Sparkles,
  QrCode,
} from 'lucide-react';
import { User } from '../types';
import { UserAvatar } from './UserAvatar';
import { setCurrentUser } from '../services/storage';

interface SidebarNavigationItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  route: string;
  isActive: boolean;
  description: string;
}

interface SidebarProps {
  currentUser: User | null;
  currentRoute: string;
  onNavigate: (route: string) => void;
  onUserChanged: (user: User | null) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenAvatarModal: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  currentRoute,
  onNavigate,
  onUserChanged,
  isCollapsed,
  onToggleCollapse,
  onOpenAvatarModal,
  mobileOpen,
  onCloseMobile,
}) => {
  const handleLogout = () => {
    setCurrentUser(null);
    onUserChanged(null);
    onNavigate('/');
    onCloseMobile();
  };

  // Cada opción lateral abre una sección propia del panel correspondiente.
  const makeNavItem = (
    id: string,
    label: string,
    shortLabel: string,
    icon: React.ElementType,
    route: string,
    description: string
  ): SidebarNavigationItem => ({
    id,
    label,
    shortLabel,
    icon,
    route,
    description,
    isActive:
      currentRoute === route ||
      (id === 'explorar' && currentRoute.startsWith('/c/')) ||
      (id === 'pedidos' && (currentRoute === '/cliente' || currentRoute === '/dueno')) ||
      (id === 'negocios' && currentRoute === '/superadmin'),
  });

  const navItems: SidebarNavigationItem[] = [
    makeNavItem('explorar', 'Explorar Cafeterías', 'Inicio', Store, '/', 'Menús y pedidos para recoger'),
  ];

  if (currentUser?.role === 'dueno') {
    navItems.push(
      makeNavItem('pedidos', 'Pedidos en Vivo', 'Pedidos', ShoppingBag, '/dueno/pedidos', 'Estado de preparación en barra'),
      makeNavItem('menu', 'Menú y Platillos', 'Menú', Coffee, '/dueno/menu', 'Administra categorías y platillos'),
      makeNavItem('clientes', 'Clientes y Fin de Mes', 'Clientes', Receipt, '/dueno/clientes', 'Saldos, crédito y abonos'),
      makeNavItem('qr', 'Código QR del negocio', 'Código QR', QrCode, '/dueno/qr', 'Comparte el menú de tu local'),
      makeNavItem('soporte', 'Soporte y Casos', 'Soporte', MessageSquare, '/soporte', 'Canal de atención y reportes')
    );
  } else if (currentUser?.role === 'cliente') {
    navItems.push(
      makeNavItem('pedidos', 'Mis Pedidos', 'Pedidos', ShoppingBag, '/cliente/pedidos', 'Estado y seguimiento de pedidos'),
      makeNavItem('cuentas', 'Cuentas y Saldos', 'Cuentas', Receipt, '/cliente/cuentas', 'Consumos, pagos e historial'),
      makeNavItem('soporte', 'Soporte y Casos', 'Soporte', MessageSquare, '/soporte', 'Canal de atención y reportes')
    );
  } else if (currentUser?.role === 'superadmin') {
    navItems.push(
      makeNavItem('negocios', 'Negocios', 'Negocios', Store, '/superadmin/negocios', 'Gestión de cafeterías y comedores'),
      makeNavItem('soporte_admin', 'Soporte y Casos', 'Soporte', MessageSquare, '/superadmin/soporte', 'Bandeja global de atención'),
      makeNavItem('auditoria', 'Auditoría de Plataforma', 'Auditoría', Shield, '/superadmin/auditoria', 'Actividad y cambios registrados')
    );
  } else {
    navItems.push(
      makeNavItem('cliente_ingreso', 'Acceso para Clientes', 'Clientes', ShoppingBag, '/cliente/ingresar', 'Ingresa o crea tu cuenta'),
      makeNavItem('dueno_ingreso', 'Acceso para Dueños', 'Dueños', Store, '/dueno/ingresar', 'Gestiona tu cafetería o comedor')
    );
  }

  const renderNavButtons = () => (
    <div className="space-y-1.5 px-3">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = item.isActive;
        return (
          <button
            key={item.id}
            onClick={() => {
              onNavigate(item.route);
              onCloseMobile();
            }}
            title={item.label}
            className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-left transition-all group relative ${
              active
                ? 'bg-amber-800 text-white shadow-sm font-bold'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/70 font-semibold'
            }`}
          >
            <div
              className={`p-2 rounded-xl shrink-0 transition-colors ${
                active
                  ? 'bg-amber-700 text-white'
                  : 'bg-stone-200/80 text-stone-700 group-hover:bg-amber-100 group-hover:text-amber-900'
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>

            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <span className="block text-xs font-orlando tracking-wide truncate">
                  {item.label}
                </span>
                <span
                  className={`block text-[10px] truncate ${
                    active ? 'text-amber-200' : 'text-stone-600'
                  }`}
                >
                  {item.description}
                </span>
              </div>
            )}

            {/* Tooltip flotante si está colapsado */}
            {isCollapsed && (
              <div className="hidden lg:group-hover:flex absolute left-full ml-3 px-3 py-1.5 bg-stone-900 text-white text-xs font-semibold rounded-xl shadow-xl z-50 whitespace-nowrap pointer-events-none items-center gap-1.5">
                <span>{item.label}</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Backdrop para mobile drawer */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-stone-950/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Desktop y Drawer Mobile */}
      <aside
        aria-label="Barra lateral de navegación"
        className={`fixed top-0 bottom-0 left-0 z-40 bg-stone-100 border-r border-stone-200 flex flex-col justify-between transition-all duration-300 ease-in-out no-print ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } ${
          mobileOpen ? 'translate-x-0 w-72 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Parte Superior: Marca y Toggle */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between gap-2">
          <button
            onClick={() => {
              onNavigate('/');
              onCloseMobile();
            }}
            className="flex items-center gap-3 text-left focus:outline-none group overflow-hidden"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-800 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:bg-amber-900 transition-colors">
              <Coffee className="w-5 h-5 text-amber-100" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-xl font-black font-orlando tracking-tight text-stone-900 leading-none">
                  Yasta.
                </span>
                <span className="text-[10px] font-bold text-amber-800 tracking-wider uppercase mt-0.5">
                  Honduras
                </span>
              </div>
            )}
          </button>

          {/* Botón de Colapsar (solo visible en desktop) */}
          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
            className="hidden lg:flex p-1.5 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-200 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Zona Central: Navegación Principal */}
        <div className="flex-1 py-4 overflow-y-auto space-y-4">
          {!isCollapsed && (
            <div className="px-5">
              <span className="text-[10px] font-bold tracking-wider uppercase text-stone-600">
                Menú Principal
              </span>
            </div>
          )}

          {renderNavButtons()}
        </div>

        {/* Zona Inferior: Perfil solo cuando hay una sesión activa */}
        {currentUser && (
          <div className="p-3 border-t border-stone-200 bg-stone-50/80">
            <div
              className={`rounded-2xl border border-stone-200 bg-white p-3 shadow-xs space-y-2 ${
                isCollapsed ? 'text-center' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <UserAvatar
                    nombre={currentUser.nombre}
                    avatarUrl={currentUser.avatarUrl}
                    role={currentUser.role}
                    size={isCollapsed ? 'sm' : 'md'}
                  />
                  <button
                    onClick={onOpenAvatarModal}
                    title="Cambiar foto de perfil"
                    className="absolute -bottom-1 -right-1 p-1 bg-stone-900 text-white rounded-full shadow-xs hover:bg-amber-800 transition-colors"
                  >
                    <Camera className="w-2.5 h-2.5" />
                  </button>
                </div>

                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-stone-900 truncate">
                      {currentUser.nombre}
                    </p>
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 capitalize">
                      {currentUser.role}
                    </span>
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                  <button
                    onClick={onOpenAvatarModal}
                    className="text-[11px] font-semibold text-stone-600 hover:text-stone-900"
                  >
                    Editar foto
                  </button>

                  <button
                    onClick={handleLogout}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                  >
                    <LogOut className="w-3 h-3" />
                    Salir
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Barra de Navegación Inferior Móvil (Mobile Bottom Bar amigable) */}
      <nav aria-label="Navegación móvil" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-2 py-1.5 flex items-center justify-around no-print shadow-lg">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const active = item.isActive;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.route)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${
                active ? 'text-amber-800 font-bold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <div
                className={`p-1 rounded-lg ${
                  active ? 'bg-amber-100 text-amber-900' : 'text-stone-600'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 font-orlando">{item.shortLabel}</span>
            </button>
          );
        })}

        {currentUser && (
          <button
            onClick={onOpenAvatarModal}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-stone-600"
          >
            <UserAvatar
              nombre={currentUser.nombre}
              avatarUrl={currentUser.avatarUrl}
              role={currentUser.role}
              size="sm"
            />
            <span className="text-[10px] mt-0.5 font-orlando">Perfil</span>
          </button>
        )}
      </nav>
    </>
  );
};
