import React, { useState, useMemo } from 'react';
import {
  Coffee,
  ShoppingBag,
  Plus,
  Minus,
  Clock,
  MapPin,
  Phone,
  AlertTriangle,
  CheckCircle2,
  X,
  CreditCard,
  Banknote,
  Calendar,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  ArrowLeft,
  Share2,
  Eye,
  Maximize2,
  UtensilsCrossed,
} from 'lucide-react';
import { Business, MenuItem, OrderItemSnapshot, PaymentMethod, User } from '../types';
import { formatHNL, formatHondurasPhone, isValidHondurasPhone, isValidPIN } from '../utils/formatters';
import {
  createOrder,
  getBusinessCategories,
  getClientAccount,
  getMenuItems,
  loginCliente,
  registerCliente,
  verifyBusinessMenuPin,
} from '../services/storage';

interface PublicCafeMenuProps {
  business: Business;
  currentUser: User | null;
  onNavigateBack: () => void;
  onUserLoggedIn: (user: User) => void;
  onOrderCompleted: (orderId: string) => void;
}

interface CartItem extends OrderItemSnapshot {}

export const PublicCafeMenu: React.FC<PublicCafeMenuProps> = ({
  business,
  currentUser,
  onNavigateBack,
  onUserLoggedIn,
  onOrderCompleted,
}) => {
  const menuItems = useMemo(() => getMenuItems(business.id), [business.id]);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [previewDish, setPreviewDish] = useState<MenuItem | null>(null);

  // Formulario de Checkout
  const [metodoPago, setMetodoPago] = useState<PaymentMethod>('efectivo');
  const [comprobanteTransferencia, setComprobanteTransferencia] = useState('');
  const [horaRecogida, setHoraRecogida] = useState('En 20 minutos');
  const [notasCliente, setNotasCliente] = useState('');
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  // Modal de inicio de sesión o registro rápido en sitio
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'registro'>('login');
  const [authNombre, setAuthNombre] = useState('');
  const [authCelular, setAuthCelular] = useState('');
  const [authPin, setAuthPin] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Estado de desbloqueo con PIN de fidelidad del local
  const [isMenuUnlocked, setIsMenuUnlocked] = useState<boolean>(() => {
    if (currentUser?.role === 'superadmin') return true;
    if (currentUser?.role === 'dueno' && business.ownerId === currentUser.id) return true;
    if (!business.pinAccesoMenu || business.pinAccesoMenu.trim() === '') return true;
    try {
      return sessionStorage.getItem(`yasta_unlocked_menu_${business.id}`) === 'true';
    } catch {
      return false;
    }
  });
  const [menuPinInput, setMenuPinInput] = useState('');
  const [menuPinError, setMenuPinError] = useState<string | null>(null);

  const handleUnlockMenu = (pinToTest?: string) => {
    const pin = (pinToTest ?? menuPinInput).trim();
    if (!pin) {
      setMenuPinError('Por favor ingresa el PIN de 4 dígitos proporcionado por el local.');
      return;
    }
    const verified = verifyBusinessMenuPin(business.id, pin);
    if (!verified) {
      setMenuPinError('PIN incorrecto. Solicita el PIN al personal del local o prueba el PIN demo sugerido.');
      return;
    }
    setMenuPinError(null);
    try {
      sessionStorage.setItem(`yasta_unlocked_menu_${business.id}`, 'true');
    } catch (e) {
      console.warn(e);
    }
    setIsMenuUnlocked(true);
  };

  const handleLockAgain = () => {
    try {
      sessionStorage.removeItem(`yasta_unlocked_menu_${business.id}`);
    } catch (e) {
      console.warn(e);
    }
    setIsMenuUnlocked(false);
    setMenuPinInput('');
  };

  // Consultar si el cliente activo tiene habilitado "pago a fin de mes" en este negocio
  const clientAccount = useMemo(() => {
    if (!currentUser || currentUser.role !== 'cliente') return null;
    return getClientAccount(currentUser.id, business.id, currentUser);
  }, [currentUser, business.id]);

  const isFinDeMesAvailable = clientAccount?.pagoFinDeMesHabilitado === true;

  // Categorías personalizadas del negocio + platillos existentes
  const businessCategories = useMemo(() => getBusinessCategories(business.id), [business.id]);
  const categories = useMemo(() => {
    const setCat = new Set([...businessCategories, ...menuItems.map((i) => i.categoria)]);
    return ['todos', ...Array.from(setCat)];
  }, [businessCategories, menuItems]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'todos') return menuItems;
    return menuItems.filter((i) => i.categoria === selectedCategory);
  }, [menuItems, selectedCategory]);

  const totalCart = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  }, [cart]);

  const totalCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.cantidad, 0);
  }, [cart]);

  // Manejo de Carrito
  const handleAddToCart = (item: MenuItem) => {
    if (!item.disponible) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          nombre: item.nombre,
          precio: item.precio,
          cantidad: 1,
        },
      ];
    });
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.menuItemId === itemId) {
            const newQty = item.cantidad + delta;
            return newQty > 0 ? { ...item, cantidad: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // Enviar Pedido
  const handleConfirmOrder = () => {
    setOrderError(null);

    if (cart.length === 0) {
      setOrderError('El carrito está vacío.');
      return;
    }

    // Si el usuario no ha iniciado sesión, abrir modal de autenticación rápida conservando el origen
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    if (metodoPago === 'transferencia' && !comprobanteTransferencia.trim()) {
      setOrderError('Por favor ingrese el número de referencia o comprobante de su transferencia bancaria.');
      return;
    }

    if (metodoPago === 'fin_de_mes' && !isFinDeMesAvailable) {
      setOrderError(
        'El método "Pago a fin de mes" no está autorizado para su cuenta en este local. Seleccione Efectivo o Transferencia.'
      );
      return;
    }

    const res = createOrder(
      {
        businessId: business.id,
        businessSlug: business.slug,
        businessNombre: business.nombre,
        clienteId: currentUser.id,
        clienteNombre: currentUser.nombre,
        clienteCelular: currentUser.celular,
        items: cart,
        subtotal: totalCart,
        total: totalCart,
        metodoPago,
        estadoPedido: 'recibido',
        notasCliente: notasCliente.trim() || undefined,
        horaEstimadaRecogida: horaRecogida,
        comprobanteTransferencia:
          metodoPago === 'transferencia' ? comprobanteTransferencia.trim() : undefined,
      },
      currentUser
    );

    if (res.error) {
      setOrderError(res.error);
      return;
    }

    if (res.order) {
      setOrderSuccess(res.order.numeroPedido);
      setCart([]);
      setTimeout(() => {
        setIsCartOpen(false);
        setOrderSuccess(null);
        onOrderCompleted(res.order!.id);
      }, 2000);
    }
  };

  // Manejar Login / Registro rápido desde la cafetería
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!isValidHondurasPhone(authCelular)) {
      setAuthError('Ingrese un número de celular hondureño válido de 8 dígitos (+504).');
      return;
    }

    if (!isValidPIN(authPin)) {
      setAuthError('El PIN debe ser exactamente de 4 dígitos numéricos.');
      return;
    }

    if (authMode === 'login') {
      const res = loginCliente(authCelular, authPin);
      if (res.error || !res.user) {
        setAuthError(res.error || 'No se pudo iniciar sesión.');
        return;
      }
      onUserLoggedIn(res.user);
      setShowAuthModal(false);
    } else {
      if (!authNombre.trim()) {
        setAuthError('Por favor ingrese su nombre completo.');
        return;
      }
      const res = registerCliente({
        nombre: authNombre.trim(),
        celular: formatHondurasPhone(authCelular),
        pin: authPin,
      });
      if (res.error || !res.user) {
        setAuthError(res.error || 'No se pudo registrar la cuenta.');
        return;
      }
      onUserLoggedIn(res.user);
      setShowAuthModal(false);
    }
  };

  return (
    <div className="space-y-8 pb-28">
      {/* Botón de volver y acciones */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onNavigateBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a cafeterías
        </button>

        <div className="text-xs text-stone-500 font-mono">
          yasta.hn/c/{business.slug}
        </div>
      </div>

      {/* Banner de Cafetería */}
      <div className="relative rounded-3xl overflow-hidden bg-stone-900 text-white shadow-lg border border-stone-200/50">
        <div className="h-48 sm:h-64 w-full relative">
          {business.bannerUrl ? (
            <img
              src={business.bannerUrl}
              alt={business.nombre}
              className="w-full h-full object-cover opacity-60"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-stone-800 flex items-center justify-center">
              <Coffee className="w-16 h-16 opacity-30 text-amber-200" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/60 to-transparent" />
        </div>

        <div className="p-6 sm:p-8 -mt-20 relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-1.5 shadow-xl border border-stone-200 shrink-0 overflow-hidden">
                {business.logoUrl ? (
                  <img
                    src={business.logoUrl}
                    alt={business.nombre}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full bg-stone-900 text-white font-black text-2xl flex items-center justify-center rounded-xl">
                    {business.nombre.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black font-orlando tracking-tight text-white">
                  {business.nombre}
                </h1>
                <p className="text-xs sm:text-sm text-stone-300 line-clamp-2 max-w-xl mt-1">
                  {business.descripcion}
                </p>
              </div>
            </div>

            <div className="bg-stone-800/80 backdrop-blur-md border border-stone-700 rounded-2xl p-3 text-xs text-stone-300 space-y-1.5 shrink-0">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate max-w-[240px]">{business.direccion}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate max-w-[240px]">{business.horario}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{business.telefono}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de estado suspendido si aplica */}
      {business.estado === 'suspendido' && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex items-center gap-3 text-rose-900 text-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <p className="font-bold">Negocio suspendido temporalmente</p>
            <p className="text-rose-700 mt-0.5">
              Este local no está recibiendo pedidos en este momento por disposición administrativa.
            </p>
          </div>
        </div>
      )}

      {/* Candado / PIN de Acceso por Fidelidad al Menú */}
      {!isMenuUnlocked ? (
        <div className="bg-white rounded-3xl border border-amber-200/80 shadow-md p-6 sm:p-10 max-w-xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-800 mx-auto flex items-center justify-center border border-amber-200 shadow-xs">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100/70 px-3 py-1 rounded-full uppercase tracking-wider">
              <KeyRound className="w-3.5 h-3.5" />
              Menú Exclusivo para Clientes
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              Ingresa el PIN de fidelidad del local
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
              Para consultar los platillos y precios de <strong className="text-stone-900">{business.nombre}</strong>, ingresa el PIN de 4 dígitos proporcionado por el dueño o personal del establecimiento.
            </p>
          </div>

          {/* Formulario de desbloqueo */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUnlockMenu();
            }}
            className="space-y-4 max-w-xs mx-auto"
          >
            <div>
              <label htmlFor="menu-pin-input" className="sr-only">
                PIN de acceso de 4 dígitos
              </label>
              <input
                id="menu-pin-input"
                type="password"
                maxLength={4}
                pattern="[0-9]*"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="• • • •"
                value={menuPinInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setMenuPinInput(val);
                  setMenuPinError(null);
                }}
                className="w-full text-center tracking-[0.5em] text-2xl font-mono font-black py-3.5 px-4 rounded-2xl border-2 border-stone-200 focus:border-amber-600 focus:ring-2 focus:ring-amber-200 focus:outline-hidden transition-all bg-stone-50/50"
              />
            </div>

            {menuPinError && (
              <p className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-200 rounded-xl p-2.5">
                {menuPinError}
              </p>
            )}

            <button
              type="submit"
              disabled={menuPinInput.length !== 4}
              className="w-full py-3.5 px-4 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white rounded-2xl text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:cursor-not-allowed"
            >
              <Unlock className="w-4 h-4" />
              Desbloquear Menú
            </button>
          </form>

          {/* Asistente de Demostración */}
          <div className="pt-4 border-t border-stone-100 space-y-2">
            <p className="text-[11px] text-stone-500">
              ¿Estás evaluando el prototipo o eres cliente de prueba?
            </p>
            <button
              type="button"
              onClick={() => {
                const demoPin = business.pinAccesoMenu || '2026';
                setMenuPinInput(demoPin);
                handleUnlockMenu(demoPin);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>Usar PIN de prueba ({business.pinAccesoMenu || '2026'})</span>
            </button>
            <p className="text-[10px] text-stone-400">
              En el local físico, este código se ubica en el flyer del mostrador o se pide en caja.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Barra de estado de menú desbloqueado */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl px-4 py-2.5 text-xs text-emerald-900">
            <div className="flex items-center gap-2 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Menú desbloqueado con PIN de cliente de <strong>{business.nombre}</strong>
              </span>
            </div>
            {business.pinAccesoMenu && (
              <button
                onClick={handleLockAgain}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
              >
                <Lock className="w-3 h-3" />
                Bloquear acceso
              </button>
            )}
          </div>

          {/* Navegación por Categorías (Interactive filter tabs) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold font-orlando tracking-wide whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                {cat === 'todos' ? 'Todos los platillos' : cat}
              </button>
            ))}
          </div>

          {/* Grid de Menú */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const inCart = cart.find((c) => c.menuItemId === item.id);
          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-5 flex flex-col justify-between shadow-xs transition-shadow ${
                !item.disponible
                  ? 'border-stone-200 bg-stone-50/70 opacity-75'
                  : 'border-stone-200 hover:shadow-md hover:border-amber-400'
              }`}
            >
              <div className="space-y-3">
                {/* Contenedor de Foto con Clic para Previsualización */}
                <div
                  onClick={() => setPreviewDish(item)}
                  className="relative h-44 w-full rounded-xl overflow-hidden bg-stone-100 cursor-pointer group border border-stone-200/60"
                  title="Clic para previsualizar plato ampliado"
                >
                  {item.fotoUrl ? (
                    <>
                      <img
                        src={item.fotoUrl}
                        alt={item.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-stone-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-2xs">
                        <Maximize2 className="w-4 h-4" />
                        <span>Previsualizar plato</span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-amber-50 to-stone-100 text-stone-400 group-hover:text-amber-800 transition-colors">
                      <UtensilsCrossed className="w-8 h-8 stroke-[1.5] mb-1" />
                      <span className="text-[11px] font-medium text-stone-500">
                        Ver detalles del plato
                      </span>
                    </div>
                  )}

                  {!item.disponible && (
                    <div className="absolute top-2.5 right-2.5 bg-rose-700/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                      Agotado
                    </div>
                  )}
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div
                    onClick={() => setPreviewDish(item)}
                    className="cursor-pointer group/title"
                  >
                    <h3 className="text-sm sm:text-base font-bold font-orlando text-stone-900 group-hover/title:text-amber-800 transition-colors">
                      {item.nombre}
                    </h3>
                    <p className="text-[11px] text-stone-500">{item.categoria}</p>
                  </div>
                  <span className="font-mono text-sm font-black text-amber-900 tabular-nums shrink-0">
                    {formatHNL(item.precio)}
                  </span>
                </div>

                <p className="text-xs text-stone-600 line-clamp-2">{item.descripcion}</p>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-stone-100 mt-4">
                {!item.disponible ? (
                  <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg">
                    Agotado hoy
                  </span>
                ) : inCart ? (
                  <div className="flex items-center gap-3 bg-stone-100 rounded-xl p-1">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, -1)}
                      className="w-8 h-8 rounded-lg bg-white text-stone-800 hover:bg-stone-200 flex items-center justify-center shadow-xs transition-colors"
                      aria-label="Disminuir"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold text-stone-900 tabular-nums px-1">
                      {inCart.cantidad}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, 1)}
                      className="w-8 h-8 rounded-lg bg-white text-stone-800 hover:bg-stone-200 flex items-center justify-center shadow-xs transition-colors"
                      aria-label="Aumentar"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={business.estado === 'suspendido'}
                    className="w-full py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Añadir al pedido
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
        </>
      )}

      {/* Barra flotante inferior de Carrito (Natural Thumb Zone) */}
      {isMenuUnlocked && cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-stone-900/90 via-stone-900/80 to-transparent backdrop-blur-xs flex justify-center">
          <div className="max-w-2xl w-full bg-stone-900 text-white rounded-2xl p-4 shadow-2xl border border-stone-700 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm">
                {totalCount}
              </div>
              <div>
                <p className="text-xs text-stone-400">Total a pagar</p>
                <p className="text-base font-black text-white font-mono tabular-nums">
                  {formatHNL(totalCart)}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md flex items-center gap-2 shrink-0"
            >
              <ShoppingBag className="w-4 h-4" />
              Ver pedido y recoger
            </button>
          </div>
        </div>
      )}

      {/* Drawer / Modal de Carrito y Checkout */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
            {/* Header del carrito */}
            <div className="p-5 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900">Tu pedido para recoger</h3>
                <p className="text-xs text-stone-500">{business.nombre}</p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1">
              {/* Lista de productos en carrito */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Productos seleccionados
                </p>
                {cart.map((item) => (
                  <div
                    key={item.menuItemId}
                    className="flex items-center justify-between gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200/80"
                  >
                    <div className="flex-1">
                      <p className="text-xs font-bold text-stone-900">{item.nombre}</p>
                      <p className="text-[11px] text-stone-500">
                        {formatHNL(item.precio)} c/u
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.menuItemId, -1)}
                        className="w-7 h-7 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-xs font-bold"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold tabular-nums w-5 text-center">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.menuItemId, 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-xs font-bold"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-xs font-bold text-stone-900 font-mono tabular-nums w-18 text-right">
                      {formatHNL(item.precio * item.cantidad)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Hora estimada de recogida */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700">
                  ¿Cuándo pasas a recoger en el local?
                </label>
                <select
                  value={horaRecogida}
                  onChange={(e) => setHoraRecogida(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 font-medium focus:ring-1 focus:ring-amber-600 focus:outline-none"
                >
                  <option value="En 15 minutos">En 15 minutos</option>
                  <option value="En 20 minutos">En 20 minutos</option>
                  <option value="En 30 minutos">En 30 minutos</option>
                  <option value="En 45 minutos">En 45 minutos</option>
                  <option value="A la 1:00 PM">A la 1:00 PM</option>
                </select>
                <p className="text-[11px] text-stone-500">
                  Solo pedidos para recoger en barra o mostrador. No realizamos entregas a domicilio.
                </p>
              </div>

              {/* Notas especiales */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">
                  Instrucciones o notas de preparación (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Café sin azúcar, tortilla bien dorada..."
                  value={notasCliente}
                  onChange={(e) => setNotasCliente(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-600"
                />
              </div>

              {/* Métodos de Pago */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Método de pago
                </p>

                <div className="space-y-2">
                  {/* Opción 1: Efectivo */}
                  <label className="flex items-start gap-3 p-3 bg-stone-50 hover:bg-stone-100/80 rounded-xl border border-stone-200 cursor-pointer">
                    <input
                      type="radio"
                      name="metodoPago"
                      value="efectivo"
                      checked={metodoPago === 'efectivo'}
                      onChange={() => setMetodoPago('efectivo')}
                      className="mt-1 text-amber-700 focus:ring-amber-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-emerald-700" />
                        <span className="text-xs font-bold text-stone-900">Efectivo al recoger</span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Paga en caja al momento de recibir tu pedido. El cobro quedará pendiente hasta que el encargado lo confirme.
                      </p>
                    </div>
                  </label>

                  {/* Opción 2: Transferencia Bancaria */}
                  <label className="flex items-start gap-3 p-3 bg-stone-50 hover:bg-stone-100/80 rounded-xl border border-stone-200 cursor-pointer">
                    <input
                      type="radio"
                      name="metodoPago"
                      value="transferencia"
                      checked={metodoPago === 'transferencia'}
                      onChange={() => setMetodoPago('transferencia')}
                      className="mt-1 text-amber-700 focus:ring-amber-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-blue-700" />
                        <span className="text-xs font-bold text-stone-900">
                          Transferencia bancaria (+504)
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Transfiere a la cuenta de la cafetería (Ficohsa, BAC, Atlántida). El pedido se confirma cuando el dueño verifica la referencia.
                      </p>

                      {metodoPago === 'transferencia' && (
                        <div className="mt-2.5 pt-2 border-t border-stone-200">
                          <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                            Número de comprobante o referencia bancaria:
                          </label>
                          <input
                            type="text"
                            placeholder="Ej: REF-BAC-192834"
                            value={comprobanteTransferencia}
                            onChange={(e) => setComprobanteTransferencia(e.target.value)}
                            className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-600"
                          />
                        </div>
                      )}
                    </div>
                  </label>

                  {/* Opción 3: Pago a Fin de Mes (Crédito) */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                      isFinDeMesAvailable
                        ? 'bg-stone-50 hover:bg-stone-100 cursor-pointer border-stone-200'
                        : 'bg-stone-100/50 opacity-80 border-stone-200 cursor-not-allowed'
                    }`}
                  >
                    <input
                      type="radio"
                      name="metodoPago"
                      value="fin_de_mes"
                      disabled={!isFinDeMesAvailable}
                      checked={metodoPago === 'fin_de_mes'}
                      onChange={() => isFinDeMesAvailable && setMetodoPago('fin_de_mes')}
                      className="mt-1 text-amber-700 focus:ring-amber-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-800" />
                        <span className="text-xs font-bold text-stone-900">
                          Pago a fin de mes (Cuenta de confianza)
                        </span>
                        {!isFinDeMesAvailable && (
                          <span className="text-[10px] font-bold text-stone-500 bg-stone-200 px-1.5 py-0.5 rounded">
                            No habilitado
                          </span>
                        )}
                      </div>

                      {isFinDeMesAvailable ? (
                        <div className="text-[11px] text-stone-600 mt-0.5 space-y-0.5">
                          <p>
                            Se cargará a tu saldo en este negocio. Tu saldo actual en {business.nombre} es:{' '}
                            <strong className="text-amber-900 font-mono">
                              {formatHNL(clientAccount?.saldoPendiente || 0)}
                            </strong>
                          </p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          {currentUser
                            ? 'El encargado de esta cafetería aún no ha habilitado la cuenta de fin de mes para su usuario. Puede solicitar la activación en caja.'
                            : 'Inicie sesión como cliente recurrente para verificar si tiene crédito a fin de mes en este local.'}
                        </p>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Mensajes de error o éxito */}
              {orderError && (
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs text-rose-800">
                  {orderError}
                </div>
              )}

              {orderSuccess && (
                <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl text-xs text-emerald-900 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold">¡Pedido {orderSuccess} registrado con éxito!</p>
                    <p className="text-emerald-700 mt-0.5">
                      Recógelo en el local. Redirigiendo a tus pedidos...
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer de confirmación */}
            <div className="p-5 border-t border-stone-200 bg-stone-50 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-stone-500">Total a pagar</p>
                <p className="text-lg font-black text-stone-900 font-mono tabular-nums">
                  {formatHNL(totalCart)}
                </p>
              </div>

              <button
                onClick={handleConfirmOrder}
                className="px-6 py-3 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition-colors shadow-md flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                {currentUser ? 'Confirmar y Enviar Pedido' : 'Ingresar y Confirmar Pedido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Autenticación Rápida en sitio (conserva el origen /c/:slug) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  {authMode === 'login' ? 'Ingresar a Yasta' : 'Registro de Cliente'}
                </h3>
                <p className="text-[11px] text-stone-500">
                  Para confirmar tu pedido en {business.nombre}
                </p>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'registro' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    value={authNombre}
                    onChange={(e) => setAuthNombre(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Celular hondureño (+504)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="9999-9999 o +504 9555-1234"
                  value={authCelular}
                  onChange={(e) => setAuthCelular(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  PIN de 4 dígitos
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="••••"
                  value={authPin}
                  onChange={(e) => setAuthPin(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 tracking-widest text-center focus:outline-none focus:ring-1 focus:ring-amber-600"
                />
                <p className="text-[10px] text-stone-500 mt-1">
                  En la demo usa: <code>1234</code> para Carlos Mejía (+504 9555-1234)
                </p>
              </div>

              {authError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                {authMode === 'login' ? 'Ingresar y volver al pedido' : 'Crear cuenta y continuar'}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-stone-100">
              {authMode === 'login' ? (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('registro');
                    setAuthError(null);
                  }}
                  className="text-xs text-amber-800 font-semibold hover:underline"
                >
                  ¿No tienes cuenta? Regístrate gratis
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError(null);
                  }}
                  className="text-xs text-amber-800 font-semibold hover:underline"
                >
                  ¿Ya tienes cuenta? Ingresar con celular y PIN
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Previsualización Ampliada del Plato de Comida */}
      {previewDish && (
        <div
          onClick={() => setPreviewDish(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 flex flex-col max-h-[90vh]"
          >
            {/* Foto Ampliada del Plato */}
            <div className="relative h-60 sm:h-72 w-full bg-stone-900 shrink-0 overflow-hidden">
              {previewDish.fotoUrl ? (
                <img
                  src={previewDish.fotoUrl}
                  alt={previewDish.nombre}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-amber-900 to-stone-900 text-amber-100">
                  <UtensilsCrossed className="w-16 h-16 opacity-40 mb-2" />
                  <span className="text-xs text-amber-200/80">Platillo sin fotografía</span>
                </div>
              )}

              {/* Botón cerrar flotante */}
              <button
                onClick={() => setPreviewDish(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-stone-950/70 hover:bg-stone-900 text-white flex items-center justify-center backdrop-blur-xs transition-colors shadow-md"
                aria-label="Cerrar vista previa"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Badge de disponibilidad */}
              <div className="absolute bottom-4 left-4">
                {previewDish.disponible ? (
                  <span className="bg-emerald-700/90 backdrop-blur-xs text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Disponible para recoger
                  </span>
                ) : (
                  <span className="bg-rose-700/90 backdrop-blur-xs text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Agotado hoy
                  </span>
                )}
              </div>
            </div>

            {/* Detalles del Platillo */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-stone-500 font-semibold mb-1">
                  <span>{previewDish.categoria}</span>
                  <span aria-hidden="true">·</span>
                  <span>{business.nombre}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-snug">
                    {previewDish.nombre}
                  </h2>
                  <span className="text-xl sm:text-2xl font-black font-mono text-amber-900 tabular-nums shrink-0">
                    {formatHNL(previewDish.precio)}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-stone-700">
                <p className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Descripción & Ingredientes
                </p>
                <p className="text-xs sm:text-sm leading-relaxed text-stone-600">
                  {previewDish.descripcion}
                </p>
              </div>

              {/* Acciones de Carrito dentro de la Previsualización */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-4">
                {(() => {
                  const itemInCart = cart.find((c) => c.menuItemId === previewDish.id);
                  if (!previewDish.disponible) {
                    return (
                      <p className="text-xs font-semibold text-rose-700 italic">
                        Este producto no está disponible para ordenar en este momento.
                      </p>
                    );
                  }

                  if (itemInCart) {
                    return (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3 bg-stone-100 rounded-xl p-1.5">
                          <button
                            onClick={() => handleUpdateQuantity(previewDish.id, -1)}
                            className="w-9 h-9 rounded-lg bg-white text-stone-800 hover:bg-stone-200 flex items-center justify-center font-bold shadow-xs transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-bold text-stone-900 tabular-nums px-2">
                            {itemInCart.cantidad} en tu pedido
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(previewDish.id, 1)}
                            className="w-9 h-9 rounded-lg bg-white text-stone-800 hover:bg-stone-200 flex items-center justify-center font-bold shadow-xs transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => {
                            setPreviewDish(null);
                            setIsCartOpen(true);
                          }}
                          className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                        >
                          Ver mi pedido ({totalCount})
                        </button>
                      </div>
                    );
                  }

                  return (
                    <button
                      onClick={() => {
                        handleAddToCart(previewDish);
                      }}
                      disabled={business.estado === 'suspendido'}
                      className="w-full py-3 px-5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Añadir a mi pedido · {formatHNL(previewDish.precio)}</span>
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
