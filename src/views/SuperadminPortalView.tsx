import React, { useState, useMemo } from 'react';
import {
  Shield,
  Store,
  MessageSquare,
  History,
  CheckCircle2,
  AlertTriangle,
  Send,
  Camera,
  Filter,
  Download,
  Search,
  KeyRound,
  ExternalLink,
  Plus,
  Trash2,
  Edit3,
  X,
  Building2,
} from 'lucide-react';
import { Business, SupportTicket, TicketStatus, User } from '../types';
import { formatHondurasDateTime } from '../utils/formatters';
import {
  getAuditLogs,
  getBusinesses,
  getSupportTickets,
  replySupportTicket,
  setBusinessStatus,
  updateSupportTicketStatus,
  deleteBusiness,
  saveBusiness,
  saveMenuItem,
  getAllUsers,
} from '../services/storage';
import { UserAvatar } from '../components/UserAvatar';
import { AvatarModal } from '../components/AvatarModal';

interface SuperadminPortalViewProps {
  currentUser: User;
  onNavigate: (route: string) => void;
  onSelectCafe: (slug: string) => void;
  onUserUpdated: (user: User) => void;
}

export const SuperadminPortalView: React.FC<SuperadminPortalViewProps> = ({
  currentUser,
  onNavigate,
  onSelectCafe,
  onUserUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'negocios' | 'soporte' | 'auditoria'>('negocios');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Trigger feedback
  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  // Datos globales reactivos
  const businesses = useMemo(() => getBusinesses(), [refreshKey]);
  const allTickets = useMemo(() => getSupportTickets(currentUser), [currentUser, refreshKey]);
  const auditLogs = useMemo(() => getAuditLogs(currentUser), [currentUser, refreshKey]);

  // Filtros de negocios
  const [bizSearch, setBizSearch] = useState('');
  const [bizStatusFilter, setBizStatusFilter] = useState<'todos' | 'activo' | 'suspendido'>('todos');

  const filteredBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      if (bizStatusFilter !== 'todos' && b.estado !== bizStatusFilter) return false;
      if (bizSearch.trim()) {
        const query = bizSearch.toLowerCase();
        return (
          b.nombre.toLowerCase().includes(query) ||
          b.slug.toLowerCase().includes(query) ||
          b.direccion.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [businesses, bizSearch, bizStatusFilter]);

  // Filtros de soporte
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'todos' | TicketStatus>('todos');
  const [ticketBizFilter, setTicketBizFilter] = useState<string>('todos');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    allTickets[0]?.id || null
  );
  const [replyText, setReplyText] = useState('');

  const filteredTickets = useMemo(() => {
    return allTickets.filter((t) => {
      if (ticketStatusFilter !== 'todos' && t.estado !== ticketStatusFilter) return false;
      if (ticketBizFilter !== 'todos' && t.businessId !== ticketBizFilter) return false;
      return true;
    });
  }, [allTickets, ticketStatusFilter, ticketBizFilter]);

  const selectedTicket = allTickets.find((t) => t.id === selectedTicketId);

  // Usuarios y dueños para asignación
  const allUsers = useMemo(() => getAllUsers(), [refreshKey]);
  const owners = useMemo(() => allUsers.filter((u) => u.role === 'dueno'), [allUsers]);

  // Modal para Crear / Editar Negocio
  const [isBizModalOpen, setIsBizModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [bizFormData, setBizFormData] = useState<Partial<Business>>({
    nombre: '',
    slug: '',
    descripcion: '',
    direccion: '',
    ciudad: 'Tegucigalpa',
    departamento: 'Francisco Morazán',
    telefono: '+504 9876-5432',
    horario: 'Lunes a Sábado: 7:00 AM - 6:00 PM',
    ownerId: 'usr_elena',
    pinAccesoMenu: '1234',
    logoUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=300&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
  });
  const [categoriasInput, setCategoriasInput] = useState('Desayunos, Bebidas, Almuerzos');
  const [bizModalError, setBizModalError] = useState<string | null>(null);

  // Abrir modal de creación
  const handleOpenCreate = () => {
    setModalMode('create');
    setBizFormData({
      nombre: '',
      slug: '',
      descripcion: 'Negocio de comidas preparadas y café especial hondureño.',
      direccion: 'Barrio Morazán, Tegucigalpa',
      ciudad: 'Tegucigalpa',
      departamento: 'Francisco Morazán',
      telefono: '+504 9876-5432',
      horario: 'Lunes a Sábado: 7:00 AM - 6:00 PM',
      ownerId: owners[0]?.id || 'usr_elena',
      pinAccesoMenu: '1234',
      logoUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=300&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
    });
    setCategoriasInput('Desayunos, Bebidas, Almuerzos');
    setBizModalError(null);
    setIsBizModalOpen(true);
  };

  // Abrir modal de edición
  const handleOpenEdit = (biz: Business) => {
    setModalMode('edit');
    setBizFormData({ ...biz });
    setCategoriasInput((biz.categorias || ['Desayunos', 'Bebidas']).join(', '));
    setBizModalError(null);
    setIsBizModalOpen(true);
  };

  // Guardar negocio (Crear o Actualizar)
  const handleSaveBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    setBizModalError(null);

    if (!bizFormData.nombre?.trim()) {
      setBizModalError('El nombre del negocio es obligatorio.');
      return;
    }

    const cleanSlug = (
      bizFormData.slug?.trim() ||
      bizFormData.nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    );

    if (!cleanSlug) {
      setBizModalError('El identificador web (slug) es obligatorio.');
      return;
    }

    const businessId = modalMode === 'edit' && bizFormData.id ? bizFormData.id : `biz_${Date.now()}`;
    const targetOwnerId = bizFormData.ownerId || owners[0]?.id || 'usr_elena';

    const parsedCategories = categoriasInput
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const businessToSave: Business = {
      id: businessId,
      slug: cleanSlug,
      nombre: bizFormData.nombre.trim(),
      descripcion: bizFormData.descripcion?.trim() || 'Comidas preparadas y café tradicional.',
      direccion: bizFormData.direccion?.trim() || 'Honduras',
      ciudad: bizFormData.ciudad?.trim() || 'Tegucigalpa',
      departamento: bizFormData.departamento?.trim() || 'Francisco Morazán',
      telefono: bizFormData.telefono?.trim() || '+504 9876-5432',
      horario: bizFormData.horario?.trim() || 'Lunes a Sábado: 7:00 AM - 6:00 PM',
      ownerId: targetOwnerId,
      estado: bizFormData.estado || 'activo',
      pinAccesoMenu: bizFormData.pinAccesoMenu?.trim() || '1234',
      logoUrl:
        bizFormData.logoUrl?.trim() ||
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=300&q=80',
      bannerUrl:
        bizFormData.bannerUrl?.trim() ||
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
      categorias: parsedCategories.length > 0 ? parsedCategories : ['Desayunos', 'Bebidas', 'Especialidades'],
      createdAt: bizFormData.createdAt || new Date().toISOString(),
    };

    const res = saveBusiness(businessToSave, currentUser);
    if (!res.success) {
      setBizModalError(res.error || 'No se pudo guardar el negocio.');
      return;
    }

    // Si es creación nueva, sembrar platos demostrativos para que el menú esté listo para pedir
    if (modalMode === 'create') {
      const initialDishes = [
        {
          id: `item_${businessId}_1`,
          businessId,
          nombre: 'Desayuno Típico Hondureño',
          descripcion: 'Frijolitos fritos, plátano maduro, cuajada fresca, mantequilla y huevos al gusto con tortillas.',
          categoria: parsedCategories[0] || 'Desayunos',
          precio: 95,
          disponible: true,
          fotoUrl: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80',
        },
        {
          id: `item_${businessId}_2`,
          businessId,
          nombre: 'Café de Altura Marcala',
          descripcion: 'Café de estricta altura recién preparado con aroma a caramelo y chocolate.',
          categoria: parsedCategories[1] || 'Bebidas',
          precio: 40,
          disponible: true,
          fotoUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
        },
        {
          id: `item_${businessId}_3`,
          businessId,
          nombre: 'Baleada Especial con Huevo y Aguacate',
          descripcion: 'Tortilla de harina suave recién palmeada con frijoles refritos, mantequilla, queso y aguacate.',
          categoria: parsedCategories[0] || 'Desayunos',
          precio: 55,
          disponible: true,
          fotoUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=600&q=80',
        },
      ];

      initialDishes.forEach((dish) => {
        saveMenuItem(dish, currentUser);
      });
    }

    setIsBizModalOpen(false);
    setRefreshKey((k) => k + 1);
    showToast(
      modalMode === 'create'
        ? `Negocio "${businessToSave.nombre}" creado exitosamente.`
        : `Negocio "${businessToSave.nombre}" actualizado correctamente.`
    );
  };

  // Eliminar negocio permanentemente
  const handleDeleteBusiness = (business: Business) => {
    if (
      window.confirm(
        `¿Confirmas que deseas ELIMINAR permanentemente el negocio "${business.nombre}" (/c/${business.slug})?\n\nEsta acción borrará todo el menú y los datos asociados.`
      )
    ) {
      const res = deleteBusiness(business.id, currentUser);
      if (res.success) {
        setRefreshKey((k) => k + 1);
        showToast(`Negocio "${business.nombre}" eliminado permanentemente.`);
      } else {
        alert(res.error || 'Error al eliminar el negocio.');
      }
    }
  };

  // Suspender / Reactivar cafetería
  const handleToggleBusinessStatus = (business: Business) => {
    const nextStatus = business.estado === 'activo' ? 'suspendido' : 'activo';
    const actionLabel = nextStatus === 'suspendido' ? 'suspender' : 'reactivar';

    if (
      window.confirm(
        `¿Confirmas que deseas ${actionLabel} el negocio "${business.nombre}"? Esta acción quedará registrada en el log de auditoría.`
      )
    ) {
      setBusinessStatus(business.id, nextStatus, currentUser);
      setRefreshKey((k) => k + 1);
      showToast(`Negocio ${business.nombre} ${nextStatus === 'activo' ? 'reactivado' : 'suspendido'} con éxito.`);
    }
  };

  // Responder a ticket
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    replySupportTicket(selectedTicket.id, replyText.trim(), currentUser);
    setReplyText('');
    setRefreshKey((k) => k + 1);
    showToast('Respuesta enviada correctamente.');
  };

  // Cambiar estado de ticket
  const handleChangeTicketStatus = (ticketId: string, newStatus: TicketStatus) => {
    updateSupportTicketStatus(ticketId, newStatus, currentUser);
    setRefreshKey((k) => k + 1);
    showToast(`Estado del caso actualizado a ${newStatus.replace('_', ' ')}.`);
  };

  // Exportar auditoría a archivo JSON
  const handleExportAudit = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `auditoria_yasta_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Registro de auditoría descargado exitosamente.');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Feedback Toast */}
      {feedbackToast && (
        <div className="fixed top-6 right-6 z-50 bg-stone-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl border border-stone-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Header del Superadmin */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <UserAvatar
              nombre={currentUser.nombre}
              avatarUrl={currentUser.avatarUrl}
              role="superadmin"
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
                Superadministración Yasta
              </h1>
              <span className="text-[11px] font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                Lic. Roberto Paz
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-1">
              Supervisión de cafeterías activas, bandeja global de tickets y auditoría de seguridad.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500 font-mono">
            {businesses.length} negocios ({businesses.filter((b) => b.estado === 'activo').length} activos) · {allTickets.length} casos
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setActiveTab('negocios')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-orlando tracking-wide transition-colors ${
            activeTab === 'negocios'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          Cafeterías y Comedores ({businesses.length})
        </button>

        <button
          onClick={() => setActiveTab('soporte')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-orlando tracking-wide transition-colors ${
            activeTab === 'soporte'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          Bandeja Global de Soporte ({allTickets.filter((t) => t.estado !== 'resuelto').length})
        </button>

        <button
          onClick={() => setActiveTab('auditoria')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-orlando tracking-wide transition-colors ${
            activeTab === 'auditoria'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          Registro de Auditoría ({auditLogs.length})
        </button>
      </div>

      {/* ================= PESTAÑA: NEGOCIOS ================= */}
      {activeTab === 'negocios' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Gestión de Cafeterías en Demostración
              </h3>
              <p className="text-xs text-stone-500">
                Supervisa, agrega nuevos negocios, edita sus datos, suspende o elimina locales.
              </p>
            </div>

            {/* Barra de acciones, búsqueda y filtro */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleOpenCreate}
                className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                Agregar Negocio
              </button>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar cafetería..."
                  value={bizSearch}
                  onChange={(e) => setBizSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-600 w-36 sm:w-48"
                />
              </div>

              <select
                value={bizStatusFilter}
                onChange={(e) => setBizStatusFilter(e.target.value as any)}
                className="bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-stone-700"
              >
                <option value="todos">Todos ({businesses.length})</option>
                <option value="activo">Activos ({businesses.filter((b) => b.estado === 'activo').length})</option>
                <option value="suspendido">Suspendidos ({businesses.filter((b) => b.estado === 'suspendido').length})</option>
              </select>
            </div>
          </div>

          {filteredBusinesses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-xs text-stone-500 space-y-3">
              <p>No se encontraron cafeterías con los filtros aplicados.</p>
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                Crear nuevo negocio
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBusinesses.map((biz) => {
                const isSuspended = biz.estado === 'suspendido';
                return (
                  <div
                    key={biz.id}
                    className={`bg-white rounded-2xl border p-5 shadow-xs space-y-4 flex flex-col justify-between ${
                      isSuspended ? 'border-rose-300 bg-rose-50/20' : 'border-stone-200'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-base font-bold text-stone-900">{biz.nombre}</h4>
                          <p className="text-xs font-mono text-stone-500">/c/{biz.slug}</p>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isSuspended
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {isSuspended ? 'Suspendido' : 'Activo'}
                        </span>
                      </div>

                      <p className="text-xs text-stone-600 line-clamp-2">{biz.descripcion}</p>

                      <div className="text-[11px] text-stone-500 space-y-0.5">
                        <p>Ubicación: {biz.direccion}</p>
                        <p>Horario: {biz.horario}</p>
                        <p>Contacto: {biz.telefono}</p>
                      </div>

                      <div className="pt-2 flex items-center justify-between text-xs text-amber-900 bg-amber-50/70 p-2 rounded-xl border border-amber-200/60 font-mono">
                        <div className="flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>PIN fidelidad: <strong>{biz.pinAccesoMenu || '1234'}</strong></span>
                        </div>
                        <button
                          onClick={() => handleOpenEdit(biz)}
                          className="text-[11px] text-amber-800 hover:text-amber-900 underline font-sans font-medium"
                        >
                          Cambiar
                        </button>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelectCafe(biz.slug)}
                          className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1"
                          title="Abrir menú público de este local"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Ver menú
                        </button>

                        <button
                          onClick={() => handleOpenEdit(biz)}
                          className="text-xs font-semibold text-stone-700 hover:text-stone-900 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-stone-100 transition-colors"
                          title="Editar información del negocio"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Editar
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleBusinessStatus(biz)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                            isSuspended
                              ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                              : 'bg-stone-200 hover:bg-stone-300 text-stone-800'
                          }`}
                          title={isSuspended ? 'Reactivar cafetería' : 'Suspender cafetería'}
                        >
                          {isSuspended ? 'Reactivar' : 'Suspender'}
                        </button>

                        <button
                          onClick={() => handleDeleteBusiness(biz)}
                          className="p-1.5 rounded-xl text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 transition-colors"
                          title="Eliminar negocio permanentemente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= PESTAÑA: BANDEJA GLOBAL DE SOPORTE ================= */}
      {activeTab === 'soporte' && (
        <div className="space-y-6">
          {/* Filtros */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-stone-500" />
              <span className="font-bold text-stone-700">Filtrar por estado:</span>
              <select
                value={ticketStatusFilter}
                onChange={(e) => setTicketStatusFilter(e.target.value as any)}
                className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-xs font-medium"
              >
                <option value="todos">Todos</option>
                <option value="nuevo">Nuevo</option>
                <option value="en_atencion">En atención</option>
                <option value="resuelto">Resuelto</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-700">Por negocio:</span>
              <select
                value={ticketBizFilter}
                onChange={(e) => setTicketBizFilter(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-xs font-medium"
              >
                <option value="todos">Todos los negocios</option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Master-Detail de Casos */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Lista de Casos */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 overflow-hidden shadow-xs">
              {filteredTickets.length === 0 ? (
                <p className="p-8 text-center text-xs text-stone-500">
                  No hay tickets que coincidan con los filtros seleccionados.
                </p>
              ) : (
                filteredTickets.map((tk) => {
                  const isSelected = selectedTicketId === tk.id;
                  return (
                    <div
                      key={tk.id}
                      onClick={() => setSelectedTicketId(tk.id)}
                      className={`p-4 cursor-pointer transition-colors ${
                        isSelected ? 'bg-amber-50/60' : 'hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-stone-900">
                          {tk.ticketNumero}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                            tk.estado === 'nuevo'
                              ? 'bg-amber-100 text-amber-900'
                              : tk.estado === 'en_atencion'
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          {tk.estado.replace('_', ' ')}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-stone-900 mt-1 line-clamp-1">
                        {tk.titulo}
                      </h4>

                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {tk.autorNombre} ({tk.autorRol}) · {tk.businessNombre || 'General'}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat y Respuestas del Caso Seleccionado */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
              {selectedTicket ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-stone-900">
                          {selectedTicket.ticketNumero}
                        </span>
                        <span className="text-stone-300">·</span>
                        <h3 className="text-sm font-bold text-stone-900">
                          {selectedTicket.titulo}
                        </h3>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Categoría: {selectedTicket.categoria} · {selectedTicket.businessNombre || 'General'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={selectedTicket.estado}
                        onChange={(e) =>
                          handleChangeTicketStatus(selectedTicket.id, e.target.value as any)
                        }
                        className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-xs font-bold capitalize"
                      >
                        <option value="nuevo">Nuevo</option>
                        <option value="en_atencion">En atención</option>
                        <option value="resuelto">Resuelto</option>
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          handleChangeTicketStatus(
                            selectedTicket.id,
                            selectedTicket.estado === 'resuelto' ? 'en_atencion' : 'resuelto'
                          )
                        }
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                          selectedTicket.estado === 'resuelto'
                            ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                            : 'bg-emerald-700 text-white hover:bg-emerald-800'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {selectedTicket.estado === 'resuelto' ? 'Reabrir caso' : 'Marcar Resuelto'}
                      </button>
                    </div>
                  </div>

                  {/* Historial de Mensajes */}
                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
                    {selectedTicket.mensajes.map((msg) => {
                      const isSuperadmin = msg.autorRol === 'superadmin';
                      return (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-xl text-xs space-y-1 ${
                            isSuperadmin
                              ? 'bg-stone-900 text-white ml-6'
                              : 'bg-stone-100 text-stone-800 mr-6'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] opacity-80">
                            <span className="font-bold">
                              {msg.autorNombre} ({msg.autorRol})
                            </span>
                            <span>{formatHondurasDateTime(msg.fecha)}</span>
                          </div>
                          <p className="leading-relaxed">{msg.mensaje}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Formulario de respuesta */}
                  <form onSubmit={handleSendReply} className="pt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="Escribe una respuesta para el usuario..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-600"
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim()}
                      className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Responder
                    </button>
                  </form>
                </>
              ) : (
                <p className="text-xs text-stone-500 text-center py-12">
                  Selecciona un caso de soporte para ver la conversación.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= PESTAÑA: REGISTRO DE AUDITORÍA ================= */}
      {activeTab === 'auditoria' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Registro Inmutable de Auditoría Administrativa
              </h3>
              <p className="text-xs text-stone-500">
                Trazabilidad de suspensiones, activaciones, cambios de saldo y resolución de casos. Sin almacenamiento de PIN ni contraseñas.
              </p>
            </div>

            <button
              onClick={handleExportAudit}
              className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar bitácora (JSON)
            </button>
          </div>

          <div className="divide-y divide-stone-100 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                      {log.accion}
                    </span>
                    <span className="font-bold text-stone-900">{log.usuarioNombre} ({log.rol})</span>
                  </div>
                  <p className="text-stone-700 mt-1">{log.descripcion}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-stone-400 font-mono">
                    {formatHondurasDateTime(log.fecha)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Crear / Editar Negocio */}
      {isBizModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    {modalMode === 'create' ? 'Agregar Nueva Cafetería o Comedor' : 'Editar Información del Negocio'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {modalMode === 'create'
                      ? 'Configura el perfil inicial. Se añadirán platos de muestra para el menú.'
                      : 'Modifica los datos comerciales, horario o PIN de acceso del cliente.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsBizModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBusiness} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Nombre Comercial *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Café Mirador El Merendón"
                    value={bizFormData.nombre || ''}
                    onChange={(e) => {
                      const nombre = e.target.value;
                      if (modalMode === 'create') {
                        const autoSlug = nombre
                          .toLowerCase()
                          .normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '')
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/(^-|-$)/g, '');
                        setBizFormData({ ...bizFormData, nombre, slug: autoSlug });
                      } else {
                        setBizFormData({ ...bizFormData, nombre });
                      }
                    }}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-amber-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Identificador web (Slug) *</label>
                  <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2">
                    <span className="text-stone-400 select-none font-mono">/c/</span>
                    <input
                      type="text"
                      required
                      placeholder="cafe-mirador"
                      value={bizFormData.slug || ''}
                      onChange={(e) =>
                        setBizFormData({
                          ...bizFormData,
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                        })
                      }
                      className="w-full bg-transparent border-none p-0 text-xs font-mono focus:outline-none ml-0.5"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">PIN fidelidad para ver menú</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="1234"
                    value={bizFormData.pinAccesoMenu || ''}
                    onChange={(e) => setBizFormData({ ...bizFormData, pinAccesoMenu: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-mono tracking-widest focus:ring-1 focus:ring-amber-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-stone-400">PIN que el cliente introduce para abrir el menú</span>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Dueño asignado</label>
                  <select
                    value={bizFormData.ownerId || owners[0]?.id || ''}
                    onChange={(e) => setBizFormData({ ...bizFormData, ownerId: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-amber-600 focus:outline-none"
                  >
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.nombre} ({o.email || o.celular})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Descripción del negocio</label>
                <textarea
                  rows={2}
                  placeholder="Cafetería de especialidad con desayunos típicos, baleadas y repostería artesanal..."
                  value={bizFormData.descripcion || ''}
                  onChange={(e) => setBizFormData({ ...bizFormData, descripcion: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-amber-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Dirección exacta</label>
                  <input
                    type="text"
                    placeholder="Col. Palmira, Avenida República de Chile"
                    value={bizFormData.direccion || ''}
                    onChange={(e) => setBizFormData({ ...bizFormData, direccion: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-amber-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Ciudad y Departamento</label>
                  <input
                    type="text"
                    placeholder="Tegucigalpa, Francisco Morazán"
                    value={bizFormData.ciudad ? `${bizFormData.ciudad}, ${bizFormData.departamento || ''}` : ''}
                    onChange={(e) => {
                      const parts = e.target.value.split(',');
                      setBizFormData({
                        ...bizFormData,
                        ciudad: parts[0]?.trim() || '',
                        departamento: parts[1]?.trim() || 'Honduras',
                      });
                    }}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Teléfono (+504)</label>
                  <input
                    type="text"
                    placeholder="+504 9876-5432"
                    value={bizFormData.telefono || ''}
                    onChange={(e) => setBizFormData({ ...bizFormData, telefono: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-amber-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Horario de atención</label>
                  <input
                    type="text"
                    placeholder="Lunes a Sábado: 7:00 AM - 6:00 PM"
                    value={bizFormData.horario || ''}
                    onChange={(e) => setBizFormData({ ...bizFormData, horario: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Categorías del menú (separadas por coma)
                </label>
                <input
                  type="text"
                  placeholder="Desayunos, Bebidas Calientes, Almuerzos, Postres"
                  value={categoriasInput}
                  onChange={(e) => setCategoriasInput(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-amber-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">URL Foto o Logo</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={bizFormData.logoUrl || ''}
                    onChange={(e) => setBizFormData({ ...bizFormData, logoUrl: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-mono text-[11px] focus:ring-1 focus:ring-amber-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">URL Banner de portada</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={bizFormData.bannerUrl || ''}
                    onChange={(e) => setBizFormData({ ...bizFormData, bannerUrl: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-mono text-[11px] focus:ring-1 focus:ring-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              {bizModalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{bizModalError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsBizModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:text-stone-900 font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {modalMode === 'create' ? 'Crear Negocio' : 'Guardar Cambios'}
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
