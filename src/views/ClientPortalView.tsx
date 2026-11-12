import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building2,
  Calendar,
  Camera,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  Receipt,
  XCircle,
  Send,
  Printer,
  X,
  Phone,
  MapPin,
} from 'lucide-react';
import { Business, FinancialMovement, Order, User } from '../types';
import { formatHNL, formatHondurasDateTime } from '../utils/formatters';
import {
  cancelOrder,
  getBusinesses,
  getClientAccountsForClient,
  getFinancialMovements,
  getOrders,
  notifyTransferPayment,
} from '../services/storage';
import { UserAvatar } from '../components/UserAvatar';
import { AvatarModal } from '../components/AvatarModal';

interface ClientPortalViewProps {
  currentUser: User;
  currentRoute: string;
  onNavigate: (route: string) => void;
  onSelectCafe: (slug: string) => void;
  onUserUpdated: (user: User) => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  currentUser,
  currentRoute,
  onNavigate,
  onSelectCafe,
  onUserUpdated,
}) => {
  const activeTab: 'pedidos' | 'cuentas' = currentRoute === '/cliente/cuentas' ? 'cuentas' : 'pedidos';
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal de Comprobante / Recibo Digital
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  // Modal para Notificar Pago por Transferencia de Saldo
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyBizId, setNotifyBizId] = useState('');
  const [notifyMonto, setNotifyMonto] = useState('');
  const [notifyRef, setNotifyRef] = useState('');
  const [notifyError, setNotifyError] = useState<string | null>(null);

  // Toast de feedback
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Pedidos del cliente
  const orders = useMemo(() => {
    return getOrders(currentUser);
  }, [currentUser, refreshKey]);

  // Cuentas y saldos por negocio (aislamiento de datos multi-tenant)
  const businesses = useMemo(() => getBusinesses(), []);
  const accounts = useMemo(() => {
    return getClientAccountsForClient(currentUser.id, currentUser);
  }, [currentUser, refreshKey]);

  // Negocio seleccionado para ver movimientos contables detallados
  const [selectedBizId, setSelectedBizId] = useState<string>(
    accounts[0]?.businessId || businesses[0]?.id || ''
  );

  const movements = useMemo(() => {
    if (!selectedBizId) return [];
    return getFinancialMovements(selectedBizId, currentUser, currentUser.id);
  }, [selectedBizId, currentUser, refreshKey]);

  const selectedBiz = businesses.find((b) => b.id === selectedBizId);
  const selectedAccount = accounts.find((a) => a.businessId === selectedBizId);

  // Cancelar pedido
  const handleCancelOrder = (orderId: string) => {
    if (!window.confirm('¿Confirmas que deseas cancelar este pedido? Esta acción es irreversible.')) {
      return;
    }
    const res = cancelOrder(orderId, currentUser, 'Cancelado por el cliente desde su portal');
    if (res.success) {
      setRefreshKey((k) => k + 1);
      triggerToast('Pedido cancelado con éxito.');
    } else {
      alert(res.error || 'No se pudo cancelar el pedido.');
    }
  };

  // Notificar abono
  const handleNotifyTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotifyError(null);

    const montoNum = parseFloat(notifyMonto);
    if (isNaN(montoNum) || montoNum <= 0) {
      setNotifyError('Por favor ingresa un monto válido en Lempiras.');
      return;
    }

    if (!notifyRef.trim()) {
      setNotifyError('Por favor ingresa el número de referencia bancaria.');
      return;
    }

    const res = notifyTransferPayment(notifyBizId, currentUser.id, montoNum, notifyRef.trim(), currentUser);
    if (res.success) {
      setShowNotifyModal(false);
      setNotifyMonto('');
      setNotifyRef('');
      setRefreshKey((k) => k + 1);
      triggerToast('Notificación de abono enviada al dueño del local.');
    } else {
      setNotifyError(res.error || 'Error al enviar notificación.');
    }
  };

  // Estados visuales limpios sin pills sandwich
  const getOrderStatusLabel = (status: Order['estadoPedido']) => {
    switch (status) {
      case 'recibido':
        return { label: 'Recibido en cafetería', color: 'text-stone-600' };
      case 'aceptado':
        return { label: 'Aceptado por caja', color: 'text-amber-800' };
      case 'en_preparacion':
        return { label: 'En preparación en cocina', color: 'text-amber-700 font-semibold' };
      case 'listo':
        return { label: '¡Listo para recoger en barra!', color: 'text-emerald-700 font-bold' };
      case 'entregado':
        return { label: 'Entregado al cliente', color: 'text-stone-500' };
      case 'cancelado':
        return { label: 'Cancelado', color: 'text-rose-700' };
    }
  };

  const getPaymentStatusLabel = (method: Order['metodoPago'], status: Order['estadoPago']) => {
    if (method === 'fin_de_mes') {
      return 'Cargado a saldo a fin de mes';
    }
    if (status === 'recibido' || status === 'confirmado') {
      return 'Pagado en caja / verificado';
    }
    return 'Pendiente de pago al recoger';
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="fixed top-20 right-4 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Header del Perfil de Cliente */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <UserAvatar
              nombre={currentUser.nombre}
              avatarUrl={currentUser.avatarUrl}
              role={currentUser.role}
              size="xl"
            />
            <button
              onClick={() => setShowAvatarModal(true)}
              className="absolute bottom-0 right-0 p-1.5 bg-stone-900 text-white rounded-full shadow-md hover:bg-stone-800 transition-colors"
              title="Cambiar foto de perfil"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                {currentUser.nombre}
              </h1>
              <span className="text-xs text-stone-500 font-mono">
                {currentUser.celular}
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-1">
              Portal de cliente para pedidos y control de saldos en cafeterías hondureñas.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate('/soporte')}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4 text-stone-500" />
            Contactar Soporte
          </button>
          <button
            onClick={() => onNavigate('/')}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <ShoppingBag className="w-4 h-4" />
            Hacer nuevo pedido
          </button>
        </div>
      </div>

      {/* Tabs de Navegación Segmentada */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => onNavigate('/cliente/pedidos')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-orlando tracking-wide transition-colors ${
            activeTab === 'pedidos'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          Mis Pedidos ({orders.length})
        </button>
        <button
          onClick={() => onNavigate('/cliente/cuentas')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-orlando tracking-wide transition-colors ${
            activeTab === 'cuentas'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          Cuentas y Saldos por Negocio
        </button>
      </div>

      {/* Contenido de la Pestaña de Pedidos */}
      {activeTab === 'pedidos' && (
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-4">
              <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-900">Aún no tienes pedidos</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Explora las cafeterías y comedores registrados en Yasta para pedir tu café o comida favorita.
                </p>
              </div>
              <button
                onClick={() => onNavigate('/')}
                className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
              >
                Ver cafeterías disponibles
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const statusMeta = getOrderStatusLabel(order.estadoPedido);
                const paymentLabel = getPaymentStatusLabel(order.metodoPago, order.estadoPago);

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4 hover:border-stone-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-stone-900">
                            {order.numeroPedido}
                          </span>
                          <span className="text-stone-300">·</span>
                          <span className="text-xs font-bold text-stone-800">
                            {order.businessNombre}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          {formatHondurasDateTime(order.fechaCreacion)}
                        </p>
                      </div>

                      <div className="flex flex-col sm:items-end">
                        <span className={`text-xs ${statusMeta.color}`}>
                          {statusMeta.label}
                        </span>
                        <span className="text-[11px] text-stone-500">
                          {paymentLabel}
                        </span>
                      </div>
                    </div>

                    {/* Lista de productos congelados al comprar */}
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs text-stone-700"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900 tabular-nums">
                              {item.cantidad}×
                            </span>
                            <span>{item.nombre}</span>
                            {item.notas && (
                              <span className="text-[11px] text-stone-400 italic">
                                ({item.notas})
                              </span>
                            )}
                          </div>
                          <span className="font-mono font-medium tabular-nums text-stone-900">
                            {formatHNL(item.precio * item.cantidad)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Resumen inferior */}
                    <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-stone-600">
                        <Clock className="w-4 h-4 text-amber-700" />
                        <span>Recoger en local: <strong>{order.horaEstimadaRecogida || 'Lo antes posible'}</strong></span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-stone-500">Total:</span>
                        <span className="font-mono text-base font-black text-stone-900 tabular-nums">
                          {formatHNL(order.total)}
                        </span>
                      </div>
                    </div>

                    {/* Botones de Acción Funcionales del Cliente */}
                    <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setSelectedReceiptOrder(order)}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5 text-stone-600" />
                          <span>Ver comprobante</span>
                        </button>

                        <button
                          onClick={() => onSelectCafe(order.businessSlug)}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-amber-700" />
                          <span>Pedir en {order.businessNombre}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {order.estadoPedido === 'recibido' && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="px-3 py-1.5 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Cancelar pedido</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Contenido de la Pestaña de Cuentas y Saldos (Requisito multi-negocio) */}
      {activeTab === 'cuentas' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1">
            <p className="font-bold">Aislamiento de cuentas por negocio</p>
            <p className="text-stone-700">
              Tus consumos, límites y deudas están completamente separados por cafetería. Puedes tener crédito habilitado en una cafetería y cerrado en otra.
            </p>
          </div>

          {/* Tarjetas resumen por negocio */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {businesses.map((biz) => {
              const acc = accounts.find((a) => a.businessId === biz.id);
              const isSelected = selectedBizId === biz.id;
              const hasDebt = (acc?.saldoPendiente || 0) > 0;

              return (
                <div
                  key={biz.id}
                  onClick={() => setSelectedBizId(biz.id)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-amber-700 bg-amber-50/40 shadow-sm'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-stone-900">{biz.nombre}</h4>
                      <p className="text-[11px] text-stone-500">{biz.ciudad}, {biz.departamento}</p>
                    </div>
                    {acc?.pagoFinDeMesHabilitado ? (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        Fin de mes activo
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                        Solo efectivo/transf.
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-end justify-between">
                    <div>
                      <p className="text-[11px] text-stone-500">Saldo pendiente:</p>
                      <p
                        className={`text-lg font-black font-mono tabular-nums ${
                          hasDebt ? 'text-amber-900' : 'text-stone-900'
                        }`}
                      >
                        {formatHNL(acc?.saldoPendiente || 0)}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCafe(biz.slug);
                      }}
                      className="text-xs text-amber-800 hover:text-amber-900 font-semibold inline-flex items-center gap-1"
                    >
                      Ver menú <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detalle del negocio seleccionado y movimientos */}
          {selectedBiz && (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-100">
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Historial de movimientos en {selectedBiz.nombre}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Registro de consumos a fin de mes, abonos y ajustes contables.
                  </p>
                </div>

                <div className="flex flex-col sm:items-end gap-2">
                  <div className="text-right">
                    <span className="text-xs text-stone-500">Deuda actual:</span>
                    <p className="text-lg font-black font-mono text-stone-900 tabular-nums">
                      {formatHNL(selectedAccount?.saldoPendiente || 0)}
                    </p>
                  </div>

                  {(selectedAccount?.saldoPendiente || 0) > 0 && (
                    <button
                      onClick={() => {
                        setNotifyBizId(selectedBiz.id);
                        setNotifyMonto(selectedAccount?.saldoPendiente.toString() || '');
                        setNotifyError(null);
                        setShowNotifyModal(true);
                      }}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Notificar Abono Bancario
                    </button>
                  )}
                </div>
              </div>

              {movements.length === 0 ? (
                <p className="text-xs text-stone-500 py-6 text-center">
                  No hay movimientos de cuenta registrados en este negocio.
                </p>
              ) : (
                <div className="space-y-3">
                  {movements.map((mov) => {
                    const isCredit = mov.monto < 0; // Abono que reduce saldo
                    return (
                      <div
                        key={mov.id}
                        className="flex items-center justify-between gap-4 p-3 bg-stone-50 rounded-xl border border-stone-200/80 text-xs"
                      >
                        <div>
                          <p className="font-bold text-stone-900">{mov.referencia}</p>
                          <p className="text-[11px] text-stone-500">
                            {formatHondurasDateTime(mov.fecha)} · Registrado por {mov.registradoPorNombre}
                          </p>
                          {mov.motivoAjuste && (
                            <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                              Motivo: {mov.motivoAjuste}
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`font-mono font-bold text-sm tabular-nums ${
                              isCredit ? 'text-emerald-700' : 'text-stone-900'
                            }`}
                          >
                            {isCredit ? '' : '+'}
                            {formatHNL(mov.monto)}
                          </span>
                          <p className="text-[10px] text-stone-400 font-mono">
                            Saldo: {formatHNL(mov.saldoResultante)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal de Perfil y Foto */}
      <AvatarModal
        user={currentUser}
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onAvatarUpdated={(newAvatar, newName) => {
          onUserUpdated({
            ...currentUser,
            avatarUrl: newAvatar,
            nombre: newName || currentUser.nombre,
          });
        }}
        onUserUpdated={(updatedUser) => {
          onUserUpdated(updatedUser);
        }}
      />

      {/* Modal Comprobante Digital del Pedido */}
      {selectedReceiptOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-700" />
                <h3 className="text-base font-bold text-stone-900">Comprobante de Pedido</h3>
              </div>
              <button
                onClick={() => setSelectedReceiptOrder(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center space-y-1 bg-stone-50 p-4 rounded-2xl border border-stone-200/80">
              <p className="text-[11px] text-stone-500 font-bold uppercase tracking-wider">Número de Turno en Barra</p>
              <p className="font-mono text-3xl font-black text-stone-900 tracking-wider">
                {selectedReceiptOrder.numeroPedido}
              </p>
              <p className="text-xs font-semibold text-amber-800">
                {selectedReceiptOrder.businessNombre}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Fecha de orden:</span>
                <span className="font-medium text-stone-900">
                  {formatHondurasDateTime(selectedReceiptOrder.fechaCreacion)}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Recogida programada:</span>
                <span className="font-bold text-amber-900">
                  {selectedReceiptOrder.horaEstimadaRecogida || 'En barra'}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Método de pago:</span>
                <span className="font-semibold text-stone-900 capitalize">
                  {selectedReceiptOrder.metodoPago.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Estado actual:</span>
                <span className="font-bold text-stone-900 capitalize">
                  {selectedReceiptOrder.estadoPedido.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Desglose de platillos */}
            <div className="border-t border-stone-100 pt-3 space-y-2">
              <p className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">Detalle del Pedido</p>
              <div className="space-y-1.5">
                {selectedReceiptOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs text-stone-700">
                    <div>
                      <span className="font-bold text-stone-900">{it.cantidad}×</span> {it.nombre}
                      {it.notas && <span className="text-[10px] text-stone-400 italic block">Nota: {it.notas}</span>}
                    </div>
                    <span className="font-mono tabular-nums text-stone-900 font-medium">
                      {formatHNL(it.precio * it.cantidad)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-stone-200 flex justify-between items-center text-sm">
                <span className="font-bold text-stone-900">Total a pagar:</span>
                <span className="font-mono font-black text-amber-900 text-base tabular-nums">
                  {formatHNL(selectedReceiptOrder.total)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Recibo
              </button>
              <button
                onClick={() => setSelectedReceiptOrder(null)}
                className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Notificar Abono por Transferencia */}
      {showNotifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-stone-900">Notificar Abono por Transferencia</h3>
              </div>
              <button
                onClick={() => setShowNotifyModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Si realizaste una transferencia bancaria a la cuenta de la cafetería para abonar a tu saldo a fin de mes, ingresa los datos para que el encargado verifique y registre tu abono.
            </p>

            <form onSubmit={handleNotifyTransferSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Monto transferido (HNL)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Ej. 285.00"
                  value={notifyMonto}
                  onChange={(e) => setNotifyMonto(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Número de referencia bancaria / comprobante
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. BAN-987654321"
                  value={notifyRef}
                  onChange={(e) => setNotifyRef(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>

              {notifyError && (
                <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  {notifyError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNotifyModal(false)}
                  className="px-4 py-2 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Enviar Notificación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
