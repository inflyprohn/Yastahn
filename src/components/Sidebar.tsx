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
  QrCode,
} from 'lucide-react';
import { User } from '../types';

type SidebarNavItem = {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  route: string;
  isActive: boolean;
  description: string;
};

interface SidebarProps {
  currentUser: User | null;
  currentRoute: string;
  onNavigate: (route: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  currentRoute,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  // El dueño navega cada sección desde una ruta independiente.
  const exploreItem: SidebarNavItem = {
    id: 'explorar',
    label: 'Explorar Cafeterías',
    shortLabel: 'Inicio',
    icon: Store,
    route: '/',
    isActive: currentRoute === '/' || currentRoute.startsWith('/c/'),
    description: 'Menús y pedidos para recoger',
  };

  const navItems: SidebarNavItem[] = currentUser?.role === 'dueno'
    ? [
        exploreItem,
        {
          id: 'pedidos',
          label: 'Pedidos en Vivo',
          shortLabel: 'Pedidos',
          icon: ShoppingBag,
          route: '/dueno/pedidos',
          isActive: currentRoute === '/dueno' || currentRoute === '/dueno/pedidos',
          description: 'Estado de preparación en barra',
        },
        {
          id: 'menu',
          label: 'Menú y Platillos',
          shortLabel: 'Menú',
          icon: Store,
          route: '/dueno/menu',
          isActive: currentRoute === '/dueno/menu',
          description: 'Administra categorías y platillos',
        },
        {
          id: 'cuentas',
          label: 'Clientes y Fin de Mes',
          shortLabel: 'Clientes',
          icon: Receipt,
          route: '/dueno/cuentas',
          isActive: currentRoute === '/dueno/cuentas',
          description: 'Saldos, crédito y abonos',
        },
        {
          id: 'qr',
          label: 'Código QR del negocio',
          shortLabel: 'Código QR',
          icon: QrCode,
          route: '/dueno/qr',
          isActive: currentRoute === '/dueno/qr',
          description: 'Comparte el menú de tu local',
        },
        {
          id: 'soporte',
          label: 'Soporte y Casos',
          shortLabel: 'Soporte',
          icon: MessageSquare,
          route: '/soporte',
          isActive: currentRoute === '/soporte',
          description: 'Canal de atención y reportes',
        },
      ]
    : [
        exploreItem,
        {
          id: 'pedidos',
          label: currentUser?.role === 'cliente' ? 'Mis Pedidos' : 'Pedidos',
          shortLabel: 'Pedidos',
          icon: ShoppingBag,
          route: currentUser?.role === 'cliente' ? '/cliente' : '/cliente/ingresar',
          isActive: currentUser?.role === 'cliente' && currentRoute === '/cliente',
          description: 'Estado de preparación en barra',
        },
        {
          id: 'cuentas',
          label: currentUser?.role === 'superadmin'
            ? 'Auditoría Global'
            : 'Saldos a Fin de Mes',
          shortLabel: 'Cuentas',
          icon: Receipt,
          route: currentUser?.role === 'superadmin'
            ? '/superadmin'
            : currentUser?.role === 'cliente'
              ? '/cliente'
              : '/cliente/ingresar',
          isActive:
            (currentRoute === '/cliente' && currentUser?.role === 'cliente') ||
            (currentRoute === '/superadmin' && currentUser?.role === 'superadmin'),
          description: 'Libro contable y abonos',
        },
        {
          id: 'soporte',
          label: 'Soporte y Casos',
          shortLabel: 'Soporte',
          icon: MessageSquare,
          route: '/soporte',
          isActive: currentRoute === '/soporte',
          description: 'Canal de atención y reportes',
        },
      ];

  // Elementos adicionales según rol
  if (currentUser?.role === 'superadmin') {
    navItems.push({
      id: 'superadmin',
      label: 'Superadministración',
      shortLabel: 'Admin',
      icon: Shield,
      route: '/superadmin',
      isActive: currentRoute === '/superadmin',
      description: 'Control de cafeterías y auditoría',
    });
  } else if (!currentUser) {
    navItems.push({
      id: 'dueno_ingreso',
      label: 'Acceso para Dueños',
      shortLabel: 'Dueños',
      icon: Store,
      route: '/dueno/ingresar',
      isActive: currentRoute === '/dueno/ingresar',
      description: 'Gestiona tu cafetería o comedor',
    });
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
            className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-left transition-all group relative ${isCollapsed ? 'lg:justify-center lg:px-0' : ''} ${
              active
                ? 'bg-amber-800 text-white shadow-sm font-bold'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/70 font-semibold'
            }`}
          >
            <div
              className={`w-8 h-8 flex items-center justify-center p-0 rounded-xl shrink-0 transition-colors ${
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
        <div className={`relative p-4 border-b border-stone-200 flex items-center justify-between gap-2 ${isCollapsed ? 'lg:px-0' : ''}`}>
          <button
            onClick={() => {
              onNavigate('/');
              onCloseMobile();
            }}
            className={`flex items-center gap-3 text-left focus:outline-none group overflow-hidden ${isCollapsed ? 'lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2' : ''}`}
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

      </nav>
    </>
  );
};
