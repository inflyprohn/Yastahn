export type UserRole = 'cliente' | 'dueno' | 'superadmin';

export interface User {
  id: string;
  nombre: string;
  celular: string; // formato hondureño +504 9999-9999
  email?: string;
  role: UserRole;
  avatarUrl?: string | null;
  pin?: string; // 4 dígitos para cliente (almacenado simulado en demo)
  password?: string; // para dueño / superadmin
  ownedBusinessIds?: string[];
  createdAt: string;
}

export interface Business {
  id: string;
  slug: string;
  nombre: string;
  logoUrl: string;
  bannerUrl: string;
  descripcion: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  horario: string;
  telefono: string;
  ownerId: string;
  estado: 'activo' | 'suspendido';
  pinAccesoMenu?: string; // PIN único proporcionado por el dueño para ver el menú
  categorias?: string[]; // Categorías personalizadas del negocio
  createdAt: string;
}

export interface MenuItem {
  id: string;
  businessId: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: number; // en Lempiras (HNL)
  disponible: boolean;
  fotoUrl?: string;
}

export type OrderStatus =
  | 'recibido'
  | 'aceptado'
  | 'en_preparacion'
  | 'listo'
  | 'entregado'
  | 'cancelado';

export type PaymentMethod = 'efectivo' | 'transferencia' | 'fin_de_mes';

export type PaymentStatus =
  | 'pendiente'
  | 'recibido'
  | 'confirmado'
  | 'cargado_en_cuenta';

export interface OrderItemSnapshot {
  menuItemId: string;
  nombre: string;
  precio: number;
  cantidad: number;
  notas?: string;
}

export interface Order {
  id: string;
  numeroPedido: string; // ej. YST-1042
  businessId: string;
  businessSlug: string;
  businessNombre: string;
  clienteId: string;
  clienteNombre: string;
  clienteCelular: string;
  items: OrderItemSnapshot[];
  subtotal: number;
  total: number;
  metodoPago: PaymentMethod;
  estadoPago: PaymentStatus;
  estadoPedido: OrderStatus;
  notasCliente?: string;
  horaEstimadaRecogida?: string;
  comprobanteTransferencia?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface ClientBusinessAccount {
  id: string;
  clienteId: string;
  businessId: string;
  pagoFinDeMesHabilitado: boolean;
  saldoPendiente: number; // Monto adeudado en Lempiras
  limiteCredito?: number;
  fechaUltimoMovimiento?: string;
}

export type MovementType =
  | 'cargo_pedido'
  | 'pago_efectivo'
  | 'pago_transferencia'
  | 'abono_cuenta'
  | 'ajuste';

export interface FinancialMovement {
  id: string;
  businessId: string;
  clienteId: string;
  tipo: MovementType;
  monto: number;
  saldoResultante: number;
  orderId?: string;
  referencia?: string;
  motivoAjuste?: string;
  registradoPorId: string;
  registradoPorNombre: string;
  fecha: string;
}

export type TicketCategory =
  | 'pedido'
  | 'pago_saldo'
  | 'ingreso'
  | 'error_plataforma'
  | 'otra';

export type TicketStatus = 'nuevo' | 'en_atencion' | 'resuelto';

export interface TicketMessage {
  id: string;
  autorId: string;
  autorNombre: string;
  autorRol: UserRole;
  mensaje: string;
  fecha: string;
  adjuntoNombre?: string;
}

export interface SupportTicket {
  id: string;
  ticketNumero: string; // ej. TK-101
  autorId: string;
  autorNombre: string;
  autorRol: UserRole;
  businessId?: string;
  businessNombre?: string;
  categoria: TicketCategory;
  titulo: string;
  descripcion: string;
  estado: TicketStatus;
  mensajes: TicketMessage[];
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface AuditLog {
  id: string;
  usuarioId: string;
  usuarioNombre: string;
  rol: UserRole;
  accion: string;
  descripcion: string;
  entidadAfectada: string;
  fecha: string;
}
