import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Coffee, ArrowLeft } from 'lucide-react';
import { User, Business } from './types';
import {
  getCurrentUser,
  setCurrentUser,
  getBusinessBySlug,
  initializeStorage,
} from './services/storage';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { AvatarModal } from './components/AvatarModal';
import { DemoBanner } from './components/DemoBanner';
import { LandingView } from './views/LandingView';
import { PublicCafeMenu } from './views/PublicCafeMenu';
import { ClientPortalView } from './views/ClientPortalView';
import { OwnerPortalView } from './views/OwnerPortalView';
import { SuperadminPortalView } from './views/SuperadminPortalView';
import { SupportView } from './views/SupportView';
import { ClientAuthView } from './views/ClientAuthView';
import { OwnerAuthView } from './views/OwnerAuthView';
import { SuperadminAuthView } from './views/SuperadminAuthView';

export default function App() {
  const [currentUser, setUserState] = useState<User | null>(null);
  const [currentRoute, setCurrentRoute] = useState<string>('/');
  const [selectedCafeSlug, setSelectedCafeSlug] = useState<string | null>(null);
  const [originCafeSlug, setOriginCafeSlug] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showGlobalAvatarModal, setShowGlobalAvatarModal] = useState(false);

  // Inicializar almacenamiento local y usuario
  useEffect(() => {
    initializeStorage();
    const user = getCurrentUser();
    setUserState(user);

    // Parsear ruta inicial si existe
    const path = window.location.pathname;
    if (path.startsWith('/c/')) {
      const slug = path.replace('/c/', '').split('/')[0];
      setSelectedCafeSlug(slug);
      setCurrentRoute(`/c/${slug}`);
    } else if (path !== '/' && path !== '') {
      setCurrentRoute(path);
    }
  }, []);

  const navigateTo = (route: string) => {
    setCurrentRoute(route);
    if (route.startsWith('/c/')) {
      const slug = route.replace('/c/', '').split('/')[0];
      setSelectedCafeSlug(slug);
      window.history.pushState({}, '', route);
    } else {
      setSelectedCafeSlug(null);
      window.history.pushState({}, '', route);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUserChanged = (user: User | null) => {
    setUserState(user);
    setCurrentUser(user);
  };

  const handleSelectCafe = (slug: string) => {
    setSelectedCafeSlug(slug);
    setOriginCafeSlug(slug);
    navigateTo(`/c/${slug}`);
  };

  // Renderizar la vista según la ruta activa y control de acceso por rol
  const renderView = () => {
    // 1. Menú público de cafetería específica (/c/:slug)
    if (selectedCafeSlug || currentRoute.startsWith('/c/')) {
      const slug = selectedCafeSlug || currentRoute.replace('/c/', '').split('/')[0];
      const business = getBusinessBySlug(slug);

      if (!business) {
        return (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 max-w-md mx-auto my-12 space-y-4">
            <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto" />
            <h2 className="text-xl font-bold text-stone-900">Cafetería no encontrada</h2>
            <p className="text-xs text-stone-600">
              No existe un negocio registrado con el identificador <code>{slug}</code>.
            </p>
            <button
              onClick={() => navigateTo('/')}
              className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold"
            >
              Volver a la página principal
            </button>
          </div>
        );
      }

      return (
        <PublicCafeMenu
          business={business}
          currentUser={currentUser}
          onNavigateBack={() => navigateTo('/')}
          onUserLoggedIn={(u) => {
            handleUserChanged(u);
          }}
          onOrderCompleted={(_orderId) => {
            navigateTo('/cliente');
          }}
        />
      );
    }

    // 2. Rutas de Autenticación
    if (currentRoute === '/cliente/ingresar') {
      return (
        <ClientAuthView
          mode="ingresar"
          redirectSlug={originCafeSlug}
          onSuccess={handleUserChanged}
          onNavigate={navigateTo}
        />
      );
    }

    if (currentRoute === '/cliente/registro') {
      return (
        <ClientAuthView
          mode="registro"
          redirectSlug={originCafeSlug}
          onSuccess={handleUserChanged}
          onNavigate={navigateTo}
        />
      );
    }

    if (currentRoute === '/dueno/ingresar') {
      return (
        <OwnerAuthView
          onSuccess={handleUserChanged}
          onNavigate={navigateTo}
        />
      );
    }

    if (currentRoute === '/superadmin/ingresar') {
      return (
        <SuperadminAuthView
          onSuccess={handleUserChanged}
          onNavigate={navigateTo}
        />
      );
    }

    // 3. Portal de Cliente (/cliente) - Protegido
    if (currentRoute === '/cliente') {
      if (!currentUser) {
        return (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 max-w-md mx-auto my-12 space-y-4">
            <Coffee className="w-12 h-12 text-amber-700 mx-auto" />
            <h2 className="text-xl font-bold text-stone-900">Inicia sesión como cliente</h2>
            <p className="text-xs text-stone-600">
              Ingresa tu celular hondureño y PIN de 4 dígitos para ver tus pedidos para recoger y cuentas.
            </p>
            <button
              onClick={() => navigateTo('/cliente/ingresar')}
              className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold"
            >
              Ingresar ahora
            </button>
          </div>
        );
      }

      return (
        <ClientPortalView
          currentUser={currentUser}
          onNavigate={navigateTo}
          onSelectCafe={handleSelectCafe}
          onUserUpdated={handleUserChanged}
        />
      );
    }

    // 4. Portal de Dueño (/dueno) - Protegido
    if (currentRoute === '/dueno') {
      if (!currentUser || (currentUser.role !== 'dueno' && currentUser.role !== 'superadmin')) {
        return (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 max-w-md mx-auto my-12 space-y-4">
            <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
            <h2 className="text-xl font-bold text-stone-900">Acceso Restringido a Dueños</h2>
            <p className="text-xs text-stone-600">
              Esta sección está reservada para encargados y dueños de negocios de comida en Honduras. Por favor inicia sesión con tu cuenta de dueño.
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => navigateTo('/dueno/ingresar')}
                className="px-5 py-2.5 bg-amber-700 text-white rounded-xl text-xs font-bold"
              >
                Ingresar como Dueño
              </button>
              <button
                onClick={() => navigateTo('/')}
                className="px-4 py-2.5 bg-stone-100 text-stone-700 rounded-xl text-xs font-semibold"
              >
                Ir al inicio
              </button>
            </div>
          </div>
        );
      }

      return (
        <OwnerPortalView
          currentUser={currentUser}
          onNavigate={navigateTo}
          onSelectCafe={handleSelectCafe}
          onUserUpdated={handleUserChanged}
        />
      );
    }

    // 5. Portal de Superadministrador (/superadmin) - Protegido
    if (currentRoute === '/superadmin') {
      if (!currentUser || currentUser.role !== 'superadmin') {
        return (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 max-w-md mx-auto my-12 space-y-4">
            <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
            <h2 className="text-xl font-bold text-stone-900">Acceso No Autorizado</h2>
            <p className="text-xs text-stone-600">
              Esta pantalla requiere credenciales de Superadministrador. No se proporcionan datos privados.
            </p>
            <button
              onClick={() => navigateTo('/superadmin/ingresar')}
              className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold"
            >
              Iniciar sesión como Superadmin
            </button>
          </div>
        );
      }

      return (
        <SuperadminPortalView
          currentUser={currentUser}
          onNavigate={navigateTo}
          onSelectCafe={handleSelectCafe}
          onUserUpdated={handleUserChanged}
        />
      );
    }

    // 6. Centro de Soporte (/soporte)
    if (currentRoute === '/soporte') {
      return (
        <SupportView
          currentUser={currentUser}
          onNavigate={navigateTo}
        />
      );
    }

    // 7. Página Inicial por Defecto (Landing)
    return (
      <LandingView
        currentUser={currentUser}
        onNavigate={navigateTo}
        onSelectCafe={handleSelectCafe}
      />
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 selection:bg-amber-100 selection:text-amber-900 flex">
      {/* Barra lateral de navegación inspirada en el diseño de referencia */}
      <Sidebar
        currentUser={currentUser}
        currentRoute={currentRoute}
        onNavigate={navigateTo}
        onUserChanged={handleUserChanged}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenAvatarModal={() => setShowGlobalAvatarModal(true)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Contenedor principal adaptable a la barra lateral */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out w-full ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Barra superior de demostración y cambio rápido de rol */}
        <DemoBanner
          currentUser={currentUser}
          onUserChanged={handleUserChanged}
          onNavigate={navigateTo}
        />

        {/* Cabecera / TopBar integrado */}
        <TopBar
          currentUser={currentUser}
          currentRoute={currentRoute}
          onNavigate={navigateTo}
          onUserChanged={handleUserChanged}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onOpenAvatarModal={() => setShowGlobalAvatarModal(true)}
        />

        {/* Contenido principal con presencia de layout de 1440px y responsive mobile-first */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-20 lg:pb-12">
          {renderView()}
        </main>

        {/* Pie de página limpio */}
        <footer className="mt-auto border-t border-stone-200 bg-white text-stone-500 text-xs py-6 no-print">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="font-black font-orlando text-stone-900 text-sm">Yasta</span>
              <span className="text-stone-300">·</span>
              <span className="text-amber-900 font-medium">Honduras</span>
            </div>
            <p className="text-[11px] text-stone-400">
              © {new Date().getFullYear()} Yasta. Todos los derechos reservados.
            </p>
          </div>
        </footer>
      </div>

      {/* Modal global de edición de foto de perfil */}
      {currentUser && (
        <AvatarModal
          user={currentUser}
          isOpen={showGlobalAvatarModal}
          onClose={() => setShowGlobalAvatarModal(false)}
          onAvatarUpdated={(newAvatarUrl) => {
            handleUserChanged({ ...currentUser, avatarUrl: newAvatarUrl });
          }}
        />
      )}
    </div>
  );
};
