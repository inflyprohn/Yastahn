import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Plus,
  Send,
  AlertCircle,
  CheckCircle2,
  Paperclip,
  Clock,
  Building2,
  X,
} from 'lucide-react';
import { Business, SupportTicket, TicketCategory, TicketStatus, User } from '../types';
import { formatHondurasDateTime } from '../utils/formatters';
import {
  createSupportTicket,
  getBusinesses,
  getSupportTickets,
  replySupportTicket,
  updateSupportTicketStatus,
} from '../services/storage';

interface SupportViewProps {
  currentUser: User | null;
  onNavigate: (route: string) => void;
}

export const SupportView: React.FC<SupportViewProps> = ({
  currentUser,
  onNavigate,
}) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const businesses = useMemo(() => getBusinesses(), []);
  const tickets = useMemo(() => getSupportTickets(currentUser), [currentUser, refreshKey]);

  // Filtro de estado
  const [filterStatus, setFilterStatus] = useState<'todos' | TicketStatus>('todos');

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (filterStatus !== 'todos' && t.estado !== filterStatus) return false;
      return true;
    });
  }, [tickets, filterStatus]);

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    tickets[0]?.id || null
  );
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);

  // Formulario nuevo ticket
  const [categoria, setCategoria] = useState<TicketCategory>('pedido');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [selectedBizId, setSelectedBizId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Formulario de respuesta
  const [replyText, setReplyText] = useState('');

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentUser) {
      setErrorMsg('Debes iniciar sesión para abrir un caso de soporte.');
      return;
    }

    if (!titulo.trim() || !descripcion.trim()) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    const res = createSupportTicket(
      {
        categoria,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        businessId: selectedBizId || undefined,
      },
      currentUser
    );

    if (res.ticket) {
      setShowNewTicketModal(false);
      setTitulo('');
      setDescripcion('');
      setSelectedBizId('');
      setSelectedTicketId(res.ticket.id);
      setRefreshKey((k) => k + 1);
      showToast('Caso de soporte creado exitosamente.');
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedTicket || !replyText.trim()) return;

    replySupportTicket(selectedTicket.id, replyText.trim(), currentUser);
    setReplyText('');
    setRefreshKey((k) => k + 1);
    showToast('Mensaje enviado.');
  };

  const handleToggleResolve = (ticketId: string, currentStatus: TicketStatus) => {
    if (!currentUser) return;
    const nextStatus: TicketStatus = currentStatus === 'resuelto' ? 'en_atencion' : 'resuelto';
    updateSupportTicketStatus(ticketId, nextStatus, currentUser);
    setRefreshKey((k) => k + 1);
    showToast(`Caso ${nextStatus === 'resuelto' ? 'marcado como resuelto' : 'reabierto'}.`);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="fixed top-6 right-6 z-50 bg-stone-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl border border-stone-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            Centro de Soporte y Casos
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Canal directo para reportar inconvenientes con pedidos, saldos a fin de mes o dudas sobre la plataforma.
          </p>
        </div>

        {currentUser ? (
          <button
            onClick={() => setShowNewTicketModal(true)}
            className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            Crear nuevo caso
          </button>
        ) : (
          <button
            onClick={() => onNavigate('/cliente/ingresar')}
            className="px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs shrink-0"
          >
            Iniciar sesión para ver mis casos
          </button>
        )}
      </div>

      {!currentUser ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-4">
          <MessageSquare className="w-12 h-12 text-stone-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-stone-900">
              Inicia sesión para consultar tus conversaciones de soporte
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Tanto clientes como dueños pueden crear casos para resolver dudas sobre pedidos, saldos o pagos.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => onNavigate('/cliente/ingresar')}
              className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold"
            >
              Ingresar como cliente
            </button>
            <button
              onClick={() => onNavigate('/dueno/ingresar')}
              className="px-4 py-2 bg-stone-100 text-stone-800 rounded-xl text-xs font-bold"
            >
              Ingresar como dueño
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filtros de estado para tickets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-stone-500 mr-2">Estado:</span>
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'nuevo', label: 'Nuevos' },
              { id: 'en_atencion', label: 'En atención' },
              { id: 'resuelto', label: 'Resueltos' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  filterStatus === f.id
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Bandeja de Tickets */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 overflow-hidden shadow-xs">
              {filteredTickets.length === 0 ? (
                <p className="p-8 text-center text-xs text-stone-500">
                  No hay conversaciones de soporte con el estado seleccionado.
                </p>
              ) : (
                filteredTickets.map((t) => {
                  const isSelected = selectedTicketId === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      className={`p-4 cursor-pointer transition-colors ${
                        isSelected ? 'bg-amber-50/60' : 'hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-stone-900">
                          {t.ticketNumero}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                            t.estado === 'nuevo'
                              ? 'bg-amber-100 text-amber-900'
                              : t.estado === 'en_atencion'
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          {t.estado.replace('_', ' ')}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-stone-900 mt-1 line-clamp-1">
                        {t.titulo}
                      </h4>

                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {t.businessNombre ? `Local: ${t.businessNombre}` : 'General'} · {formatHondurasDateTime(t.fechaCreacion)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Hilo de conversación */}
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
                        {selectedTicket.categoria} · {selectedTicket.businessNombre || 'General'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg capitalize ${
                          selectedTicket.estado === 'nuevo'
                            ? 'bg-amber-100 text-amber-900'
                            : selectedTicket.estado === 'en_atencion'
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {selectedTicket.estado.replace('_', ' ')}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleToggleResolve(selectedTicket.id, selectedTicket.estado)}
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

                {/* Mensajes */}
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
                  {selectedTicket.mensajes.map((msg) => {
                    const isCurrentUser = msg.autorId === currentUser.id;
                    return (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-xl text-xs space-y-1 ${
                          isCurrentUser
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

                {/* Formulario para enviar mensaje */}
                <form onSubmit={handleSendReply} className="pt-2 flex gap-2">
                  <input
                    type="text"
                    placeholder="Escribe tu mensaje o respuesta..."
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
                    Enviar
                  </button>
                </form>
              </>
            ) : (
              <p className="text-xs text-stone-500 text-center py-12">
                Selecciona un caso para ver los detalles.
              </p>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Modal para Crear Nuevo Caso */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900">Crear caso de soporte</h3>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Categoría del problema
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as any)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="pedido">Problema con un pedido</option>
                  <option value="pago_saldo">Problema con un pago o saldo</option>
                  <option value="ingreso">Problema para ingresar</option>
                  <option value="error_plataforma">Error de la plataforma</option>
                  <option value="otra">Otra consulta</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Negocio relacionado (opcional)
                </label>
                <select
                  value={selectedBizId}
                  onChange={(e) => setSelectedBizId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="">Consulta general / Sin negocio específico</option>
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Título o resumen breve
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Mi comprobante de transferencia no aparece"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Detalle del problema
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe detalladamente lo ocurrido..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  {errorMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="px-4 py-2 text-xs text-stone-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold"
                >
                  Enviar Caso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
