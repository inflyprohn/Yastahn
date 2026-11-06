import React, { useState, useMemo, useRef } from 'react';
import {
  Store,
  QrCode,
  UtensilsCrossed,
  ShoppingBag,
  Users,
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  Check,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Camera,
  AlertCircle,
  FileText,
  DollarSign,
  Building,
  Tag,
  KeyRound,
  ShieldCheck,
  Layers,
  Settings,
  XCircle,
  Filter,
  Sparkles,
  X,
} from 'lucide-react';
import {
  Business,
  MenuItem,
  Order,
  OrderStatus,
  PaymentStatus,
  User,
} from '../types';
import {
  formatHNL,
  formatHondurasDateTime,
  formatHondurasPhone,
  validateImageFile,
} from '../utils/formatters';
import {
  addBusinessCategory,
  cancelOrder,
  deleteBusinessCategory,
  deleteMenuItem,
  getBusinessCategories,
  getBusinessClientsWithAccounts,
  getBusinessesForOwner,
  getFinancialMovements,
  getMenuItems,
  getOrders,
  recordClientPayment,
  recordManualAdjustment,
  saveBusiness,
  saveMenuItem,
  toggleMenuItemAvailability,
  togglePagoFinDeMes,
  updateBusinessCategory,
  updateBusinessMenuPin,
  updateClientCreditLimit,
  updateOrderStatus,
  updatePaymentStatus,
} from '../services/storage';
import { QRCodeDisplay } from '../components/QRCodeDisplay';
import { UserAvatar } from '../components/UserAvatar';
import { AvatarModal } from '../components/AvatarModal';

interface OwnerPortalViewProps {
  currentUser: User;
  onNavigate: (route: string) => void;
  onSelectCafe: (slug: string) => void;
  onUserUpdated: (user: User) => void;
}

export const OwnerPortalView: React.FC<OwnerPortalViewProps> = ({
  currentUser,
  onNavigate,
  onSelectCafe,
  onUserUpdated,
}) => {
  // Negocios que posee este dueño (soporta multi-negocio)
  const ownedBusinesses = useMemo(() => {
    return getBusinessesForOwner(currentUser.id);
  }, [currentUser.id]);

  const [selectedBizId, setSelectedBizId] = useState<string>(
    ownedBusinesses[0]?.id || ''
  );
  const currentBiz = ownedBusinesses.find((b) => b.id === selectedBizId) || ownedBusinesses[0];

  const [activeTab, setActiveTab] = useState<
    'pedidos' | 'menu' | 'clientes' | 'qr' | 'perfil'
  >('pedidos');

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Pedidos del negocio seleccionado
  const orders = useMemo(() => {
    if (!currentBiz) return [];
    return getOrders(currentUser, currentBiz.id);
  }, [currentUser, currentBiz]);

  // Menú del negocio seleccionado
  const menuItems = useMemo(() => {
    if (!currentBiz) return [];
    return getMenuItems(currentBiz.id);
  }, [currentBiz]);

  // Clientes y Cuentas del negocio seleccionado
  const clientsWithAccounts = useMemo(() => {
    if (!currentBiz) return [];
    return getBusinessClientsWithAccounts(currentBiz.id, currentUser);
  }, [currentBiz, currentUser]);

  // Movimientos financieros del negocio
  const movements = useMemo(() => {
    if (!currentBiz) return [];
    return getFinancialMovements(currentBiz.id, currentUser);
  }, [currentBiz, currentUser]);

  // Estado para crear/editar platillo de menú
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [menuFormName, setMenuFormName] = useState('');
  const [menuFormDesc, setMenuFormDesc] = useState('');
  const [menuFormCat, setMenuFormCat] = useState('Desayunos & Antojos');
  const [menuFormPrice, setMenuFormPrice] = useState('50.00');
  const [menuFormAvail, setMenuFormAvail] = useState(true);
  const [menuFormFotoUrl, setMenuFormFotoUrl] = useState<string>('');
  const [menuFormFotoError, setMenuFormFotoError] = useState<string | null>(null);
  const menuFileInputRef = useRef<HTMLInputElement>(null);

  const PRESET_FOOD_PHOTOS = [
    { label: 'Baleada Especial', url: '/src/assets/images/baleada_especial_1793908264377.jpg' },
    { label: 'Desayuno Típico', url: '/src/assets/images/desayuno_tipico_hn_1793908266298.jpg' },
    { label: 'Pollo Chuco', url: '/src/assets/images/pollo_chuco_honduras_1793909291520.jpg' },
    { label: 'Café Pour-Over', url: '/src/assets/images/cafe_pourover_honduras_1793909290813.jpg' },
  ];

  // Categorías personalizadas del negocio
  const businessCategories = useMemo(() => {
    if (!currentBiz) return [];
    return getBusinessCategories(currentBiz.id);
  }, [currentBiz, menuItems]);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState<'create' | 'edit'>('create');
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // PIN de fidelidad para ver el menú
  const [pinMenuInput, setPinMenuInput] = useState(currentBiz?.pinAccesoMenu || '2026');
  const [showEditPinModal, setShowEditPinModal] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Estado para registrar abono o pago a cuenta
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentClientId, setPaymentClientId] = useState('');
  const [paymentMonto, setPaymentMonto] = useState('');
  const [paymentMetodo, setPaymentMetodo] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [paymentReferencia, setPaymentReferencia] = useState('');

  // Estado para registrar ajuste con motivo obligatorio
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjClientId, setAdjClientId] = useState('');
  const [adjMonto, setAdjMonto] = useState('');
  const [adjMotivo, setAdjMotivo] = useState('');

  // Estado para crear un nuevo negocio
  const [showNewBizModal, setShowNewBizModal] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [newBizSlug, setNewBizSlug] = useState('');
  const [newBizDesc, setNewBizDesc] = useState('');
  const [newBizDir, setNewBizDir] = useState('');
  const [newBizHorario, setNewBizHorario] = useState('7:00 AM - 5:00 PM');
  const [newBizTel, setNewBizTel] = useState('+504 9999-9999');

  // Filtro de pedidos
  const [orderFilter, setOrderFilter] = useState<'todos' | 'activos' | 'listos' | 'entregados' | 'cancelados'>('todos');

  // Estado para editar información del negocio actual
  const [showEditBizModal, setShowEditBizModal] = useState(false);
  const [editBizName, setEditBizName] = useState('');
  const [editBizDesc, setEditBizDesc] = useState('');
  const [editBizDir, setEditBizDir] = useState('');
  const [editBizHorario, setEditBizHorario] = useState('');
  const [editBizTel, setEditBizTel] = useState('');
  const [editBizLogo, setEditBizLogo] = useState('');
  const [editBizBanner, setEditBizBanner] = useState('');

  const openEditBizModal = () => {
    if (!currentBiz) return;
    setEditBizName(currentBiz.nombre);
    setEditBizDesc(currentBiz.descripcion);
    setEditBizDir(currentBiz.direccion);
    setEditBizHorario(currentBiz.horario);
    setEditBizTel(currentBiz.telefono);
    setEditBizLogo(currentBiz.logoUrl || '');
    setEditBizBanner(currentBiz.bannerUrl || '');
    setShowEditBizModal(true);
  };

  const handleSaveEditBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBiz) return;
    const updatedBiz: Business = {
      ...currentBiz,
      nombre: editBizName.trim(),
      descripcion: editBizDesc.trim(),
      direccion: editBizDir.trim(),
      horario: editBizHorario.trim(),
      telefono: editBizTel.trim(),
      logoUrl: editBizLogo.trim(),
      bannerUrl: editBizBanner.trim(),
    };
    const res = saveBusiness(updatedBiz, currentUser);
    if (res.success) {
      setShowEditBizModal(false);
      triggerFeedback(`Información de "${updatedBiz.nombre}" actualizada`);
    } else {
      alert(res.error || 'Error al guardar cambios del negocio');
    }
  };

  // Estado para editar límite de crédito de cliente
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitClientId, setLimitClientId] = useState('');
  const [limitMonto, setLimitMonto] = useState('1000.00');

  const openEditLimitModal = (clientId: string, currentLimit: number = 1000) => {
    setLimitClientId(clientId);
    setLimitMonto(currentLimit.toString());
    setShowLimitModal(true);
  };

  const handleSaveCreditLimit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBiz) return;
    const monto = parseFloat(limitMonto);
    if (isNaN(monto) || monto < 0) {
      alert('Ingresa un monto de límite válido.');
      return;
    }
    const res = updateClientCreditLimit(currentBiz.id, limitClientId, monto, currentUser);
    if (res.success) {
      setShowLimitModal(false);
      triggerFeedback(`Límite de crédito actualizado a L ${monto.toFixed(2)}`);
    } else {
      alert(res.error || 'Error al actualizar límite.');
    }
  };

  // Notificación temporal
  const triggerFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Manejar cambio de estado de pedido
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const res = updateOrderStatus(orderId, newStatus, currentUser);
    if (res.success) {
      triggerFeedback(`Estado del pedido actualizado a "${newStatus.replace('_', ' ')}"`);
    }
  };

  // Cancelar pedido por parte del dueño
  const handleCancelOrder = (orderId: string) => {
    const motivo = prompt('Por favor ingresa el motivo de cancelación del pedido:', 'Falta de ingredientes o solicitud del cliente');
    if (motivo === null) return;
    const res = cancelOrder(orderId, currentUser, motivo.trim() || 'Cancelado por el dueño');
    if (res.success) {
      triggerFeedback('Pedido cancelado y saldo ajustado.');
    } else {
      alert(res.error || 'Error al cancelar pedido.');
    }
  };

  // Manejar cobro de pedido (efectivo recibido o transferencia confirmada)
  const handleUpdatePaymentStatus = (orderId: string, newPaymentStatus: PaymentStatus) => {
    const res = updatePaymentStatus(orderId, newPaymentStatus, currentUser);
    if (res.success) {
      triggerFeedback(
        newPaymentStatus === 'recibido'
          ? 'Efectivo registrado como recibido en caja'
          : 'Transferencia bancaria confirmada'
      );
    }
  };

  // Manejar toggle de platillo agotado
  const handleToggleStock = (item: MenuItem) => {
    toggleMenuItemAvailability(item.id, currentBiz.id, !item.disponible, currentUser);
    triggerFeedback(`Producto ${item.nombre} marcado como ${!item.disponible ? 'disponible' : 'agotado'}`);
  };

  const handleMenuFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMenuFormFotoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setMenuFormFotoError(validation.error || 'Formato o tamaño no válido.');
      if (menuFileInputRef.current) menuFileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setMenuFormFotoUrl(reader.result as string);
    };
    reader.onerror = () => {
      setMenuFormFotoError('Error al leer el archivo de imagen.');
    };
    reader.readAsDataURL(file);
  };

  // Guardar platillo
  const handleSaveMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBiz) return;
    const priceNum = parseFloat(menuFormPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Por favor ingrese un precio válido en Lempiras.');
      return;
    }

    const newItem: MenuItem = {
      id: editingMenuItem ? editingMenuItem.id : `menu_${Date.now()}`,
      businessId: currentBiz.id,
      nombre: menuFormName.trim(),
      descripcion: menuFormDesc.trim(),
      categoria: menuFormCat.trim(),
      precio: priceNum,
      disponible: menuFormAvail,
      fotoUrl: menuFormFotoUrl.trim() || undefined,
    };

    saveMenuItem(newItem, currentUser);
    setShowMenuModal(false);
    setEditingMenuItem(null);
    triggerFeedback('Platillo guardado en el menú');
  };

  // Abrir modal de platillo
  const openEditMenuItem = (item?: MenuItem) => {
    setMenuFormFotoError(null);
    if (item) {
      setEditingMenuItem(item);
      setMenuFormName(item.nombre);
      setMenuFormDesc(item.descripcion);
      setMenuFormCat(item.categoria);
      setMenuFormPrice(item.precio.toString());
      setMenuFormAvail(item.disponible);
      setMenuFormFotoUrl(item.fotoUrl || '');
    } else {
      setEditingMenuItem(null);
      setMenuFormName('');
      setMenuFormDesc('');
      setMenuFormCat(businessCategories[0] || 'General');
      setMenuFormPrice('50.00');
      setMenuFormAvail(true);
      setMenuFormFotoUrl('');
    }
    if (menuFileInputRef.current) menuFileInputRef.current.value = '';
    setShowMenuModal(true);
  };

  // Gestión de categorías
  const handleOpenCreateCategory = () => {
    setCategoryModalMode('create');
    setEditingCategoryName('');
    setNewCategoryName('');
    setCategoryError(null);
    setShowCategoryModal(true);
  };

  const handleOpenEditCategory = (catName: string) => {
    setCategoryModalMode('edit');
    setEditingCategoryName(catName);
    setNewCategoryName(catName);
    setCategoryError(null);
    setShowCategoryModal(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBiz) return;
    setCategoryError(null);

    if (categoryModalMode === 'create') {
      const res = addBusinessCategory(currentBiz.id, newCategoryName, currentUser);
      if (res.error) {
        setCategoryError(res.error);
        return;
      }
      triggerFeedback(`Categoría "${newCategoryName}" creada`);
    } else {
      const res = updateBusinessCategory(currentBiz.id, editingCategoryName, newCategoryName, currentUser);
      if (res.error) {
        setCategoryError(res.error);
        return;
      }
      triggerFeedback(`Categoría actualizada a "${newCategoryName}"`);
    }
    setShowCategoryModal(false);
  };

  const handleDeleteCategory = (catName: string) => {
    if (!currentBiz) return;
    if (window.confirm(`¿Seguro que deseas eliminar la categoría "${catName}"? Los productos asignados se reasignarán a otra categoría disponible.`)) {
      const res = deleteBusinessCategory(currentBiz.id, catName, currentUser);
      if (res.error) {
        alert(res.error);
        return;
      }
      triggerFeedback(`Categoría "${catName}" eliminada`);
    }
  };

  const handleSaveMenuPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBiz) return;
    setPinError(null);
    const res = updateBusinessMenuPin(currentBiz.id, pinMenuInput, currentUser);
    if (res.error) {
      setPinError(res.error);
      return;
    }
    triggerFeedback(`PIN de fidelidad actualizado a "${pinMenuInput}"`);
    setShowEditPinModal(false);
  };

  // Eliminar platillo
  const handleDeleteMenuItem = (itemId: string) => {
    if (window.confirm('¿Desea eliminar este producto del menú?')) {
      deleteMenuItem(itemId, currentBiz.id, currentUser);
      triggerFeedback('Producto eliminado del menú');
    }
  };

  // Habilitar/Deshabilitar pago a fin de mes por cliente
  const handleToggleFinDeMes = (clienteId: string, currentVal: boolean) => {
    togglePagoFinDeMes(clienteId, currentBiz.id, !currentVal, currentUser);
    triggerFeedback(`Pago a fin de mes ${!currentVal ? 'habilitado' : 'deshabilitado'} para el cliente`);
  };

  // Registrar abono a cuenta de cliente
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseFloat(paymentMonto);
    if (isNaN(montoNum) || montoNum <= 0) {
      alert('Ingrese un monto válido mayor a L 0.00');
      return;
    }

    const res = recordClientPayment(
      {
        businessId: currentBiz.id,
        clienteId: paymentClientId,
        monto: montoNum,
        metodo: paymentMetodo,
        referencia: paymentReferencia,
      },
      currentUser
    );

    if (res.success) {
      setShowPaymentModal(false);
      setPaymentMonto('');
      setPaymentReferencia('');
      triggerFeedback('Abono registrado con éxito en el libro contable');
    } else {
      alert(res.error || 'Error al registrar abono');
    }
  };

  // Registrar ajuste manual con motivo obligatorio
  const handleRecordAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseFloat(adjMonto);
    if (isNaN(montoNum)) {
      alert('Ingrese un monto válido (puede ser positivo o negativo).');
      return;
    }
    if (!adjMotivo.trim()) {
      alert('Es obligatorio ingresar el motivo del ajuste para la auditoría.');
      return;
    }

    const res = recordManualAdjustment(
      {
        businessId: currentBiz.id,
        clienteId: adjClientId,
        montoAjuste: montoNum,
        motivo: adjMotivo,
      },
      currentUser
    );

    if (res.success) {
      setShowAdjustmentModal(false);
      setAdjMonto('');
      setAdjMotivo('');
      triggerFeedback('Ajuste contable registrado en la auditoría');
    } else {
      alert(res.error || 'Error al registrar ajuste');
    }
  };

  // Crear nuevo negocio
  const handleCreateBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = newBizSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (!slug) {
      alert('Identificador de enlace (slug) requerido.');
      return;
    }

    const newBiz: Business = {
      id: `biz_${Date.now()}`,
      slug,
      nombre: newBizName.trim(),
      logoUrl: '',
      bannerUrl: '',
      descripcion: newBizDesc.trim(),
      direccion: newBizDir.trim(),
      ciudad: 'Tegucigalpa',
      departamento: 'Francisco Morazán',
      horario: newBizHorario.trim(),
      telefono: newBizTel.trim(),
      ownerId: currentUser.id,
      estado: 'activo',
      createdAt: new Date().toISOString(),
    };

    const res = saveBusiness(newBiz, currentUser);
    if (res.success) {
      setShowNewBizModal(false);
      setSelectedBizId(newBiz.id);
      triggerFeedback(`Nuevo negocio "${newBiz.nombre}" creado exitosamente`);
    } else {
      alert(res.error || 'Error al crear negocio');
    }
  };

  if (!currentBiz) {
    return (
      <div className="bg-white rounded-2xl border p-12 text-center space-y-4">
        <Store className="w-12 h-12 text-stone-300 mx-auto" />
        <h3 className="text-base font-bold text-stone-900">No tienes negocios registrados</h3>
        <button
          onClick={() => setShowNewBizModal(true)}
          className="px-5 py-2.5 bg-amber-700 text-white rounded-xl text-xs font-bold"
        >
          Crear mi primera cafetería o comedor
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div className="fixed top-20 right-4 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Selector Multi-Negocio y Perfil del Dueño */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <UserAvatar
              nombre={currentUser.nombre}
              avatarUrl={currentUser.avatarUrl}
              role="dueno"
              size="xl"
            />
            <button
              onClick={() => setShowAvatarModal(true)}
              className="absolute bottom-0 right-0 p-1.5 bg-stone-900 text-white rounded-full shadow-md hover:bg-stone-800 transition-colors"
              title="Cambiar foto de perfil del dueño"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                Panel de {currentUser.nombre}
              </h1>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Dueño Verificado
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-1">
              Administración de pedidos en mostrador, menús, saldos a fin de mes y códigos QR.
            </p>
          </div>
        </div>

        {/* Selector de Negocio Activo si administra varios */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-2xl p-1.5">
            <Store className="w-4 h-4 text-stone-500 ml-2" />
            <select
              value={selectedBizId}
              onChange={(e) => setSelectedBizId(e.target.value)}
              className="bg-transparent text-xs font-bold text-stone-900 pr-4 py-1.5 focus:outline-none cursor-pointer"
            >
              {ownedBusinesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre} ({b.slug})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowNewBizModal(true)}
            className="px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Añadir otro negocio
          </button>

          <button
            onClick={openEditBizModal}
            className="px-3.5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
            title="Editar nombre comercial, dirección, horario y teléfono"
          >
            <Settings className="w-3.5 h-3.5" />
            Editar mi local
          </button>
        </div>
      </div>

      {/* Barra de Pestañas del Panel de Dueño */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-200 scrollbar-none">
        <button
          onClick={() => setActiveTab('pedidos')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-orlando tracking-wide whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'pedidos'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          Pedidos en Vivo ({orders.filter((o) => o.estadoPedido !== 'entregado').length})
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-orlando tracking-wide whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'menu'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          Menú y Platillos ({menuItems.length})
        </button>

        <button
          onClick={() => setActiveTab('clientes')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-orlando tracking-wide whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'clientes'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          Clientes y Fin de Mes ({clientsWithAccounts.length})
        </button>

        <button
          onClick={() => setActiveTab('qr')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-orlando tracking-wide whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'qr'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          Mi negocio → Código QR
        </button>
      </div>

      {/* ================= PESTAÑA: PEDIDOS EN VIVO ================= */}
      {activeTab === 'pedidos' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-stone-900">
              Pedidos de {currentBiz.nombre}
            </h3>
            <span className="text-xs text-stone-500 font-medium">
              Pedidos para recoger en el local
            </span>
          </div>

          {/* Filtros de Pedidos */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'todos', label: `Todos (${orders.length})` },
              { id: 'activos', label: `En preparación (${orders.filter((o) => ['recibido', 'aceptado', 'en_preparacion'].includes(o.estadoPedido)).length})` },
              { id: 'listos', label: `Listos (${orders.filter((o) => o.estadoPedido === 'listo').length})` },
              { id: 'entregados', label: `Entregados (${orders.filter((o) => o.estadoPedido === 'entregado').length})` },
              { id: 'cancelados', label: `Cancelados (${orders.filter((o) => o.estadoPedido === 'cancelado').length})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setOrderFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  orderFilter === f.id
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-2">
              <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto" />
              <p className="text-xs font-bold text-stone-700">No hay pedidos registrados en este negocio</p>
              <p className="text-[11px] text-stone-500">
                Cuando los clientes pidan desde el menú público /c/{currentBiz.slug}, aparecerán aquí inmediatamente.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders
                .filter((o) => {
                  if (orderFilter === 'activos') return ['recibido', 'aceptado', 'en_preparacion'].includes(o.estadoPedido);
                  if (orderFilter === 'listos') return o.estadoPedido === 'listo';
                  if (orderFilter === 'entregados') return o.estadoPedido === 'entregado';
                  if (orderFilter === 'cancelados') return o.estadoPedido === 'cancelado';
                  return true;
                })
                .map((order) => {
                const isPaid =
                  order.estadoPago === 'recibido' ||
                  order.estadoPago === 'confirmado' ||
                  order.estadoPago === 'cargado_en_cuenta';

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-stone-900">
                            {order.numeroPedido}
                          </span>
                          <span className="text-stone-300">·</span>
                          <span className="text-xs font-bold text-stone-800">
                            Cliente: {order.clienteNombre} ({order.clienteCelular})
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Recogida estimada: <strong className="text-stone-800">{order.horaEstimadaRecogida}</strong> · {formatHondurasDateTime(order.fechaCreacion)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-black text-stone-900 text-base tabular-nums">
                          {formatHNL(order.total)}
                        </span>
                      </div>
                    </div>

                    {/* Snapshot de productos congelados */}
                    <div className="bg-stone-50 rounded-xl p-3 space-y-1.5 text-xs">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-stone-700">
                          <div>
                            <span className="font-bold text-stone-900 tabular-nums">{it.cantidad}×</span> {it.nombre}
                            {it.notas && <span className="text-[11px] text-stone-500 italic ml-1">({it.notas})</span>}
                          </div>
                          <span className="font-mono tabular-nums">{formatHNL(it.precio * it.cantidad)}</span>
                        </div>
                      ))}
                      {order.notasCliente && (
                        <div className="text-[11px] text-amber-900 font-medium pt-1 border-t border-stone-200">
                          Nota del cliente: "{order.notasCliente}"
                        </div>
                      )}
                    </div>

                    {/* Estados de Pedido y Pagos Separados */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {/* Estado del Pedido */}
                      <div className="bg-stone-50/60 p-3.5 rounded-xl border border-stone-200/80 space-y-2">
                        <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
                          Estado de Preparación
                        </span>

                        {order.estadoPedido === 'cancelado' ? (
                          <span className="inline-block px-3 py-1 text-xs font-bold rounded-lg bg-rose-100 text-rose-800 border border-rose-300">
                            Pedido Cancelado
                          </span>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {(['recibido', 'aceptado', 'en_preparacion', 'listo', 'entregado'] as OrderStatus[]).map(
                              (st) => (
                                <button
                                  key={st}
                                  onClick={() => handleUpdateOrderStatus(order.id, st)}
                                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors capitalize cursor-pointer ${
                                    order.estadoPedido === st
                                      ? 'bg-stone-900 text-white shadow-xs'
                                      : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                                  }`}
                                >
                                  {st.replace('_', ' ')}
                                </button>
                              )
                            )}

                            {order.estadoPedido !== 'entregado' && (
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                                title="Cancelar pedido"
                              >
                                Cancelar
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Estado del Pago */}
                      <div className="bg-stone-50/60 p-3.5 rounded-xl border border-stone-200/80 space-y-2">
                        <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
                          Cobro ({order.metodoPago.replace('_', ' ')})
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-stone-700">
                            {order.metodoPago === 'fin_de_mes' ? (
                              <span className="text-emerald-800 font-semibold">
                                Cargado al saldo mensual del cliente
                              </span>
                            ) : isPaid ? (
                              <span className="text-emerald-700 font-bold flex items-center gap-1">
                                <Check className="w-4 h-4" /> Cobro confirmado en caja
                              </span>
                            ) : (
                              <span className="text-amber-800 font-semibold">
                                Pago pendiente de cobro
                              </span>
                            )}
                          </span>

                          {/* Acciones de cobro si está pendiente */}
                          {!isPaid && order.metodoPago === 'efectivo' && (
                            <button
                              onClick={() => handleUpdatePaymentStatus(order.id, 'recibido')}
                              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                            >
                              Registrar efectivo recibido
                            </button>
                          )}

                          {!isPaid && order.metodoPago === 'transferencia' && (
                            <div className="flex items-center gap-2">
                              {order.comprobanteTransferencia && (
                                <span className="font-mono text-[11px] text-stone-500">
                                  Ref: {order.comprobanteTransferencia}
                                </span>
                              )}
                              <button
                                onClick={() => handleUpdatePaymentStatus(order.id, 'confirmado')}
                                className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                              >
                                Confirmar transferencia
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= PESTAÑA: MENÚ Y PLATILLOS ================= */}
      {activeTab === 'menu' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Catálogo de Menú - {currentBiz.nombre}
              </h3>
              <p className="text-xs text-stone-500">
                Platillos, bebidas y categorías personalizadas disponibles para pedidos en mostrador.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setPinMenuInput(currentBiz.pinAccesoMenu || '2026');
                  setPinError(null);
                  setShowEditPinModal(true);
                }}
                className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-stone-200 shadow-2xs"
                title="Configurar PIN para que clientes puedan ver el menú"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                <span>PIN Menú: <strong>{currentBiz.pinAccesoMenu || 'Sin PIN'}</strong></span>
              </button>

              <button
                onClick={() => openEditMenuItem()}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Nuevo Platillo
              </button>
            </div>
          </div>

          {/* Gestión de Categorías Personalizadas */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-bold text-stone-900">
                  Categorías personalizadas ({businessCategories.length})
                </span>
                <span className="text-[11px] text-stone-500 hidden sm:inline">
                  · Adapta las secciones según los alimentos que preparas
                </span>
              </div>

              <button
                onClick={handleOpenCreateCategory}
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl transition-colors self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                Nueva categoría
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {businessCategories.map((cat) => {
                const count = menuItems.filter((m) => m.categoria === cat).length;
                return (
                  <div
                    key={cat}
                    className="inline-flex items-center gap-2 bg-stone-50 hover:bg-stone-100 border border-stone-200/80 rounded-xl px-3 py-1.5 text-xs text-stone-800 transition-colors"
                  >
                    <span className="font-semibold font-orlando">{cat}</span>
                    <span className="text-[10px] font-mono text-stone-400 tabular-nums">
                      ({count})
                    </span>

                    <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-stone-200">
                      <button
                        onClick={() => handleOpenEditCategory(cat)}
                        className="p-1 text-stone-400 hover:text-stone-800 rounded transition-colors"
                        title={`Editar categoría ${cat}`}
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      {businessCategories.length > 1 && (
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-1 text-stone-400 hover:text-rose-700 rounded transition-colors"
                          title={`Eliminar categoría ${cat}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  {item.fotoUrl ? (
                    <div className="h-32 w-full rounded-xl overflow-hidden bg-stone-100 mb-3 border border-stone-200/60">
                      <img
                        src={item.fotoUrl}
                        alt={item.nombre}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-full rounded-xl bg-stone-50 border border-dashed border-stone-200 mb-3 flex items-center justify-center text-[11px] text-stone-400">
                      Sin foto configurada
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-stone-900">{item.nombre}</h4>
                      <p className="text-[11px] text-stone-500">{item.categoria}</p>
                    </div>
                    <span className="font-mono font-black text-amber-900 tabular-nums">
                      {formatHNL(item.precio)}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 mt-2 line-clamp-2">
                    {item.descripcion}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleToggleStock(item)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      item.disponible
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {item.disponible ? 'Disponible' : 'Agotado'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditMenuItem(item)}
                      className="p-1.5 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-100"
                      title="Editar platillo"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMenuItem(item.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50"
                      title="Eliminar platillo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= PESTAÑA: CLIENTES Y FIN DE MES ================= */}
      {activeTab === 'clientes' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Gestión de Clientes y Crédito en {currentBiz.nombre}
              </h3>
              <p className="text-xs text-stone-500">
                Habilita el pago a fin de mes solo para clientes de confianza. Registra abonos y ajustes.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientsWithAccounts.map(({ user, account }) => {
              const hasDebt = account.saldoPendiente > 0;
              return (
                <div
                  key={user.id}
                  className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UserAvatar nombre={user.nombre} avatarUrl={user.avatarUrl} size="md" />
                      <div>
                        <h4 className="text-xs font-bold text-stone-900">{user.nombre}</h4>
                        <p className="text-[11px] font-mono text-stone-500">{user.celular}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleFinDeMes(user.id, account.pagoFinDeMesHabilitado)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors border ${
                        account.pagoFinDeMesHabilitado
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                      }`}
                    >
                      {account.pagoFinDeMesHabilitado ? 'Fin de mes activo' : 'Deshabilitado'}
                    </button>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-stone-600">Saldo por pagar:</span>
                      <span
                        className={`font-mono text-base font-black tabular-nums ${
                          hasDebt ? 'text-amber-900' : 'text-stone-900'
                        }`}
                      >
                        {formatHNL(account.saldoPendiente)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-stone-200/60">
                      <span className="text-stone-500">Límite de crédito:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-stone-800">
                          {formatHNL(account.limiteCredito || 1000)}
                        </span>
                        <button
                          onClick={() => openEditLimitModal(user.id, account.limiteCredito || 1000)}
                          className="text-[10px] text-amber-800 hover:text-amber-900 font-bold underline cursor-pointer"
                        >
                          Cambiar
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setPaymentClientId(user.id);
                        setPaymentMonto(account.saldoPendiente.toString());
                        setShowPaymentModal(true);
                      }}
                      className="flex-1 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Registrar Abono
                    </button>
                    <button
                      onClick={() => {
                        setAdjClientId(user.id);
                        setShowAdjustmentModal(true);
                      }}
                      className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Ajuste
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Historial Financiero Inmutable de este negocio */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-stone-900">
              Libro contable de consumos y abonos en {currentBiz.nombre}
            </h4>
            <p className="text-xs text-stone-500">
              Los registros contables no se pueden borrar; cualquier corrección queda registrada como ajuste con motivo obligatorio.
            </p>

            <div className="space-y-2">
              {movements.map((mov) => (
                <div
                  key={mov.id}
                  className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-stone-900">{mov.referencia}</p>
                    <p className="text-[11px] text-stone-500">
                      {formatHondurasDateTime(mov.fecha)} · Por {mov.registradoPorNombre}
                    </p>
                    {mov.motivoAjuste && (
                      <p className="text-[11px] text-amber-800 font-medium">Motivo: {mov.motivoAjuste}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-mono font-bold ${
                        mov.monto < 0 ? 'text-emerald-700' : 'text-stone-900'
                      }`}
                    >
                      {mov.monto < 0 ? '' : '+'}
                      {formatHNL(mov.monto)}
                    </span>
                    <p className="text-[10px] text-stone-400 font-mono">
                      Saldo: {formatHNL(mov.saldoResultante)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= PESTAÑA: CÓDIGO QR ================= */}
      {activeTab === 'qr' && (
        <QRCodeDisplay
          business={currentBiz}
          onNavigateToPublicMenu={() => onSelectCafe(currentBiz.slug)}
        />
      )}

      {/* ================= MODAL: PLATILLO DE MENÚ ================= */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <h3 className="text-base font-bold text-stone-900">
              {editingMenuItem ? 'Editar Platillo' : 'Nuevo Platillo'}
            </h3>

            <form onSubmit={handleSaveMenuItem} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nombre del platillo o bebida
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Baleada con todo"
                  value={menuFormName}
                  onChange={(e) => setMenuFormName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Descripción o ingredientes
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Tortilla de harina suave, frijoles fritos, huevo y mantequilla..."
                  value={menuFormDesc}
                  onChange={(e) => setMenuFormDesc(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-stone-700">
                      Categoría
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenCreateCategory();
                      }}
                      className="text-[10px] text-amber-800 font-bold hover:underline"
                    >
                      + Nueva
                    </button>
                  </div>
                  <select
                    required
                    value={menuFormCat}
                    onChange={(e) => setMenuFormCat(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 font-medium focus:outline-none focus:ring-1 focus:ring-amber-600"
                  >
                    {businessCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Precio en Lempiras (HNL)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={menuFormPrice}
                    onChange={(e) => setMenuFormPrice(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Sección de Foto del Plato */}
              <div className="space-y-2 pt-1 border-t border-stone-100">
                <label className="block text-xs font-semibold text-stone-700">
                  Foto del plato para previsualización del cliente
                </label>

                {menuFormFotoUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-100 h-36 group">
                    <img
                      src={menuFormFotoUrl}
                      alt="Vista previa del plato"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => menuFileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white text-stone-900 rounded-lg text-xs font-bold hover:bg-stone-100 transition-colors shadow-sm"
                      >
                        Cambiar foto
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuFormFotoUrl('');
                          if (menuFileInputRef.current) menuFileInputRef.current.value = '';
                        }}
                        className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm"
                      >
                        Quitar foto
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => menuFileInputRef.current?.click()}
                    className="border-2 border-dashed border-stone-300 hover:border-amber-600 rounded-xl p-4 text-center cursor-pointer bg-stone-50/60 hover:bg-amber-50/30 transition-colors"
                  >
                    <Camera className="w-6 h-6 text-stone-400 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-stone-700">
                      Subir foto del plato (JPG, PNG, WebP)
                    </p>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      Máximo 2 MB · Aparecerá en el menú del cliente con opción de previsualización
                    </p>
                  </div>
                )}

                <input
                  type="file"
                  ref={menuFileInputRef}
                  onChange={handleMenuFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />

                {/* Fotos sugeridas de comida típica hondureña */}
                <div className="pt-1">
                  <span className="text-[11px] text-stone-500 block mb-1.5 font-medium">
                    O selecciona una foto de muestra hondureña:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_FOOD_PHOTOS.map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => {
                          setMenuFormFotoUrl(preset.url);
                          setMenuFormFotoError(null);
                        }}
                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors border ${
                          menuFormFotoUrl === preset.url
                            ? 'bg-amber-900 text-white border-amber-900'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {menuFormFotoError && (
                  <p className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                    {menuFormFotoError}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="availCheck"
                  checked={menuFormAvail}
                  onChange={(e) => setMenuFormAvail(e.target.checked)}
                  className="rounded text-amber-700 focus:ring-amber-600"
                />
                <label htmlFor="availCheck" className="text-xs font-medium text-stone-700">
                  Disponible para ordenar hoy
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowMenuModal(false)}
                  className="px-4 py-2 text-xs text-stone-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REGISTRAR ABONO ================= */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <h3 className="text-base font-bold text-stone-900">Registrar abono de cliente</h3>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Monto abonado en Lempiras (HNL)
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={paymentMonto}
                  onChange={(e) => setPaymentMonto(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Método recibido
                </label>
                <select
                  value={paymentMetodo}
                  onChange={(e) => setPaymentMetodo(e.target.value as any)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="efectivo">Efectivo en caja</option>
                  <option value="transferencia">Transferencia bancaria</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Referencia o nota de recibo
                </label>
                <input
                  type="text"
                  placeholder="Ej. Recibo de caja #402"
                  value={paymentReferencia}
                  onChange={(e) => setPaymentReferencia(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-xs text-stone-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  Confirmar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: AJUSTE MANUAL CON MOTIVO ================= */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <h3 className="text-base font-bold text-stone-900">Ajuste contable de saldo</h3>
            <p className="text-[11px] text-stone-500">
              Registra correcciones de cuenta. Requiere motivo obligatorio para auditoría.
            </p>

            <form onSubmit={handleRecordAdjustment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Monto del ajuste (HNL)
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  placeholder="Ej. -50 para descuento, +50 para cargo"
                  value={adjMonto}
                  onChange={(e) => setAdjMonto(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Motivo obligatorio del ajuste
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ej. Corrección por platillo devuelto según acuerdo con el cliente"
                  value={adjMotivo}
                  onChange={(e) => setAdjMotivo(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  className="px-4 py-2 text-xs text-stone-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold"
                >
                  Guardar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREAR OTRO NEGOCIO ================= */}
      {showNewBizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <h3 className="text-base font-bold text-stone-900">Registrar nuevo negocio</h3>

            <form onSubmit={handleCreateBusiness} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nombre de la cafetería o comedor
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Repostería Danlí"
                  value={newBizName}
                  onChange={(e) => {
                    setNewBizName(e.target.value);
                    if (!newBizSlug) {
                      setNewBizSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                    }
                  }}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Slug / Identificador URL público (/c/slug)
                </label>
                <input
                  type="text"
                  required
                  placeholder="reposteria-danli"
                  value={newBizSlug}
                  onChange={(e) => setNewBizSlug(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  placeholder="Café y panes caseros..."
                  value={newBizDesc}
                  onChange={(e) => setNewBizDesc(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Dirección en Honduras
                </label>
                <input
                  type="text"
                  placeholder="Barrio El Centro, Danlí, El Paraíso"
                  value={newBizDir}
                  onChange={(e) => setNewBizDir(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowNewBizModal(false)}
                  className="px-4 py-2 text-xs text-stone-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-700 text-white rounded-xl text-xs font-bold"
                >
                  Crear Negocio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CATEGORÍA (CREAR / EDITAR) ================= */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-700" />
              <h3 className="text-base font-bold text-stone-900">
                {categoryModalMode === 'create' ? 'Nueva Categoría' : 'Editar Categoría'}
              </h3>
            </div>

            <p className="text-xs text-stone-500">
              Personaliza el menú según lo que vendas (ej. Desayunos Típicos, Baleadas, Platos del Día, Repostería).
            </p>

            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nombre de la categoría
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Almuerzos Ejecutivos"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600"
                />
              </div>

              {categoryError && (
                <p className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                  {categoryError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 text-xs text-stone-600 hover:text-stone-900 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  {categoryModalMode === 'create' ? 'Crear Categoría' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDITAR PIN DE ACCESO AL MENÚ ================= */}
      {showEditPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-700" />
              <h3 className="text-base font-bold text-stone-900">
                PIN de Fidelidad para ver el Menú
              </h3>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Define un PIN exclusivo que proporcionarás a tus clientes para que puedan desbloquear y ver el menú de <strong className="text-stone-900">{currentBiz.nombre}</strong>.
            </p>

            <form onSubmit={handleSaveMenuPin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  PIN de acceso (mínimo 3 caracteres o números)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 2026 o COPAN1"
                  value={pinMenuInput}
                  onChange={(e) => setPinMenuInput(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-base font-mono font-black text-amber-900 text-center tracking-widest focus:outline-none focus:ring-1 focus:ring-amber-600"
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  Este PIN se imprimirá automáticamente en tu afiche QR para las mesas o mostrador.
                </p>
              </div>

              {pinError && (
                <p className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                  {pinError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowEditPinModal(false)}
                  className="px-4 py-2 text-xs text-stone-600 hover:text-stone-900 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  Guardar PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDITAR INFORMACIÓN DEL NEGOCIO ================= */}
      {showEditBizModal && currentBiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-700" />
                <h3 className="text-base font-bold text-stone-900">
                  Editar Información de {currentBiz.nombre}
                </h3>
              </div>
              <button
                onClick={() => setShowEditBizModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBusiness} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nombre comercial del local
                </label>
                <input
                  type="text"
                  required
                  value={editBizName}
                  onChange={(e) => setEditBizName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Descripción del establecimiento
                </label>
                <textarea
                  rows={2}
                  required
                  value={editBizDesc}
                  onChange={(e) => setEditBizDesc(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Dirección física
                  </label>
                  <input
                    type="text"
                    required
                    value={editBizDir}
                    onChange={(e) => setEditBizDir(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Teléfono de contacto (+504)
                  </label>
                  <input
                    type="text"
                    required
                    value={editBizTel}
                    onChange={(e) => setEditBizTel(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Horario de atención
                  </label>
                  <input
                    type="text"
                    required
                    value={editBizHorario}
                    onChange={(e) => setEditBizHorario(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Foto o Logo (URL o Muestra)
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={editBizLogo}
                    onChange={(e) => setEditBizLogo(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Foto de Portada / Banner (URL)
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={editBizBanner}
                  onChange={(e) => setEditBizBanner(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowEditBizModal(false)}
                  className="px-4 py-2 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Guardar Información
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDITAR LÍMITE DE CRÉDITO ================= */}
      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-700" />
                <h3 className="text-base font-bold text-stone-900">
                  Límite de Crédito
                </h3>
              </div>
              <button
                onClick={() => setShowLimitModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Establece el monto máximo que este cliente de confianza puede acumular para su pago a fin de mes.
            </p>

            <form onSubmit={handleSaveCreditLimit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Límite en Lempiras (HNL)
                </label>
                <input
                  type="number"
                  step="50"
                  min="0"
                  required
                  value={limitMonto}
                  onChange={(e) => setLimitMonto(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-base font-mono font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowLimitModal(false)}
                  className="px-4 py-2 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Actualizar Límite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Foto de Perfil */}
      <AvatarModal
        user={currentUser}
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onAvatarUpdated={(newAvatar) => {
          onUserUpdated({ ...currentUser, avatarUrl: newAvatar });
        }}
      />
    </div>
  );
};
