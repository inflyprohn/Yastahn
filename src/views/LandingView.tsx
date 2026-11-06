import React from 'react';
import { Coffee, ArrowRight, QrCode, ShoppingBag, Shield, Clock, MapPin, Phone, KeyRound, Store, UserRound } from 'lucide-react';
import { Business, User } from '../types';
import { getBusinesses } from '../services/storage';
import heroHonduranCafe from '../assets/images/hero_honduran_cafe_1793908265168.jpg';

interface LandingViewProps {
  currentUser: User | null;
  onNavigate: (route: string) => void;
  onSelectCafe: (slug: string) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  currentUser,
  onNavigate,
  onSelectCafe,
}) => {
  const businesses = getBusinesses();
  const activeBusinesses = businesses.filter((b) => b.estado === 'activo');

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-stone-900 text-white shadow-xl">
        <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay">
          <img
            src={heroHonduranCafe}
            alt="Café de Honduras"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/80 to-transparent z-0" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 sm:py-24 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-semibold">
            <span>Honduras</span>
            <span aria-hidden="true">·</span>
            <span>Pedidos para recoger & Cuentas claras</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black font-orlando tracking-tight text-balance leading-tight">
            Tus comidas y café favorito, listos cuando llegues.
          </h1>

          <p className="text-base sm:text-lg text-stone-300 max-w-2xl mx-auto text-balance">
            Plataforma para cafeterías, comedores y negocios de comida en Honduras. Consulta el menú, haz tu pedido para recoger en barra y lleva el control de pagos o saldo a fin de mes.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 pt-2">
            <button
              onClick={() => {
                const el = document.getElementById('cafeterias-list');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-6 py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              Explorar negocios y ordenar
            </button>

            {!currentUser && (
              <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  onClick={() => onNavigate('/cliente/ingresar')}
                  className="flex min-h-16 items-center gap-3 rounded-xl border border-white/20 bg-white px-4 py-3 text-left text-stone-900 shadow-lg transition-colors hover:bg-stone-100"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-900">
                    <UserRound className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold">Ingresar como cliente</span>
                    <span className="mt-0.5 block text-xs text-stone-600">Pedidos, saldos e historial</span>
                  </span>
                </button>

                <button
                  onClick={() => onNavigate('/dueno/ingresar')}
                  className="flex min-h-16 items-center gap-3 rounded-xl border border-stone-600 bg-stone-800/90 px-4 py-3 text-left text-white shadow-lg transition-colors hover:bg-stone-700"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300">
                    <Store className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold leading-tight">Acceso para cafetería o comedor</span>
                    <span className="mt-0.5 block text-xs text-stone-300">Menú, pedidos y cobros</span>
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Características clave en Honduras */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <QrCode className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-stone-900">Menús con código QR</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Cada cafetería cuenta con su propio código QR para mesas o mostrador. Los clientes escanean y piden directamente para recoger sin esperas.
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            L
          </div>
          <h3 className="text-base font-bold text-stone-900">Pagos y saldo a fin de mes</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Acepta efectivo, transferencias bancarias o permite a tus clientes de confianza acumular consumos a fin de mes, con libro contable inmutable.
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-stone-900">Cuentas aisladas por local</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Un mismo cliente puede consumir en varios comedores; sus pedidos, saldos y cuentas permanecen estrictamente separados por negocio.
          </p>
        </div>
      </section>

      {/* Directorio de Negocios Disponibles */}
      <section id="cafeterias-list" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-stone-200 pb-4">
          <div>
            <h2 className="text-2xl font-black font-orlando text-stone-900 tracking-tight">
              Negocios disponibles en Yasta
            </h2>
            <p className="text-xs text-stone-600 mt-1">
              Selecciona una cafetería o comedor para ver su menú, precios en Lempiras y realizar tu pedido para recoger.
            </p>
          </div>
          <span className="text-xs font-semibold text-stone-500">
            {activeBusinesses.length} locales disponibles
          </span>
        </div>

        {businesses.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-10 sm:p-14 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center mx-auto">
              <Coffee className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-stone-900 font-orlando">
                Plataforma lista para nuevos negocios
              </h3>
              <p className="text-xs text-stone-500">
                Actualmente no hay cafeterías abiertas al público. Los negocios dados de alta por el administrador aparecerán aquí con sus menús y pedidos para recoger.
              </p>
            </div>
            {currentUser?.role === 'superadmin' ? (
              <button
                onClick={() => onNavigate('/superadmin')}
                className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2 shadow-xs"
              >
                Ir al Panel de Superadmin
              </button>
            ) : (
              <button
                onClick={() => onNavigate('/superadmin/ingresar')}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors"
              >
                Acceso Administrador
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map((biz) => {
            const isSuspended = biz.estado === 'suspendido';
            return (
              <div
                key={biz.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between shadow-xs ${
                  isSuspended
                    ? 'border-rose-200 opacity-75'
                    : 'border-stone-200 hover:shadow-md hover:border-amber-400'
                }`}
              >
                <div>
                  {/* Banner */}
                  <div className="relative h-44 bg-stone-200 overflow-hidden">
                    {biz.bannerUrl ? (
                      <img
                        src={biz.bannerUrl}
                        alt={biz.nombre}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-amber-800 to-stone-800 flex items-center justify-center text-white">
                        <Coffee className="w-12 h-12 opacity-40" />
                      </div>
                    )}

                    {isSuspended && (
                      <div className="absolute top-3 right-3 bg-rose-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-sm">
                        Suspendido temporalmente
                      </div>
                    )}

                    {/* Logo circular sobre el banner */}
                    <div className="absolute bottom-3 left-4 w-14 h-14 rounded-xl bg-white p-1 shadow-md border border-stone-200 overflow-hidden">
                      {biz.logoUrl ? (
                        <img
                          src={biz.logoUrl}
                          alt={biz.nombre}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-stone-900 text-white font-black text-sm flex items-center justify-center rounded-lg">
                          {biz.nombre.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5 pt-4 space-y-3">
                    <div>
                      <h3 className="text-lg font-bold font-orlando text-stone-900 tracking-tight">
                        {biz.nombre}
                      </h3>
                      <p className="text-xs text-stone-600 line-clamp-2 mt-1">
                        {biz.descripcion}
                      </p>
                    </div>

                    <div className="space-y-1.5 text-xs text-stone-500 pt-1">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                        <span className="truncate">{biz.direccion}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">{biz.horario}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{biz.telefono}</span>
                      </div>
                    </div>

                    {/* Badge de Fidelidad y PIN requerido */}
                    <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-amber-900 font-medium bg-amber-50/80 px-2 py-0.5 rounded-lg border border-amber-200/60">
                        <KeyRound className="w-3 h-3 text-amber-700 shrink-0" />
                        <span>Requiere PIN del local</span>
                      </div>
                      <span className="text-stone-400 text-[10px]">
                        Acceso clientes
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <button
                    onClick={() => onSelectCafe(biz.slug)}
                    disabled={isSuspended}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                      isSuspended
                        ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                        : 'bg-stone-900 hover:bg-stone-800 text-white shadow-xs'
                    }`}
                  >
                    <span>Ver menú y ordenar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </section>
    </div>
  );
};
