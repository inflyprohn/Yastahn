import {
  AuditLog,
  Business,
  ClientBusinessAccount,
  FinancialMovement,
  MenuItem,
  Order,
  OrderStatus,
  PaymentStatus,
  SupportTicket,
  TicketStatus,
  User,
} from '../types';
import {
  INITIAL_ACCOUNTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_BUSINESSES,
  INITIAL_MENU_ITEMS,
  INITIAL_MOVEMENTS,
  INITIAL_ORDERS,
  INITIAL_TICKETS,
  INITIAL_USERS,
} from './mockData';

const STORAGE_KEYS = {
  USERS: 'yasta_v5_users',
  BUSINESSES: 'yasta_v5_businesses',
  MENU_ITEMS: 'yasta_v5_menu_items',
  ORDERS: 'yasta_v5_orders',
  ACCOUNTS: 'yasta_v5_accounts',
  MOVEMENTS: 'yasta_v5_movements',
  TICKETS: 'yasta_v5_tickets',
  AUDIT_LOGS: 'yasta_v5_audit_logs',
  // Cambiar la clave evita reutilizar la sesión de superadmin creada por versiones anteriores.
  CURRENT_USER_ID: 'yasta_v6_current_user_id',
};

// Inicialización de la base de datos limpia en localStorage
export function initializeStorage(forceReset = false): void {
  if (typeof window === 'undefined') return;

  if (forceReset || !localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.BUSINESSES, JSON.stringify(INITIAL_BUSINESSES));
    localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(INITIAL_MENU_ITEMS));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(INITIAL_ACCOUNTS));
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(INITIAL_MOVEMENTS));
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(INITIAL_TICKETS));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    // Las visitas nuevas siempre comienzan sin sesión iniciada.
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
  }
}

// Helpers internos para leer y escribir
function get<T>(key: string, defaultVal: T): T {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const data = localStorage.getItem(key);
    return data ? (JSON.parse(data) as T) : defaultVal;
  } catch (e) {
    console.error('Error reading localStorage key', key, e);
    return defaultVal;
  }
}

function set<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('Error writing localStorage key', key, e);
  }
}

// ==================== USUARIOS & AUTENTICACIÓN SIMULADA ====================

export function getAllUsers(): User[] {
  return get<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
}

export function getCurrentUser(): User | null {
  const users = getAllUsers();
  const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
  if (!currentId) return null;
  return users.find((u) => u.id === currentId) || null;
}

export function setCurrentUser(user: User | null): void {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
  }
}

export function loginCliente(celular: string, pin: string): { user?: User; error?: string } {
  const users = getAllUsers();
  const cleanPhone = celular.replace(/\D/g, '');
  const user = users.find((u) => {
    const userPhoneClean = u.celular.replace(/\D/g, '');
    return userPhoneClean.endsWith(cleanPhone) && u.role === 'cliente';
  });

  if (!user) {
    return { error: 'Credenciales inválidas. Verifique su número de celular y PIN de 4 dígitos.' };
  }

  if (user.pin !== pin) {
    return { error: 'Credenciales inválidas. Verifique su número de celular y PIN de 4 dígitos.' };
  }

  setCurrentUser(user);
  return { user };
}

export function registerCliente(data: {
  nombre: string;
  celular: string;
  pin: string;
  avatarUrl?: string;
}): { user?: User; error?: string } {
  const users = getAllUsers();
  const cleanPhone = data.celular.replace(/\D/g, '');

  const existing = users.find((u) => u.celular.replace(/\D/g, '').endsWith(cleanPhone));
  if (existing) {
    return { error: 'Ya existe una cuenta registrada con este número de celular hondureño.' };
  }

  const newUser: User = {
    id: `usr_${Date.now()}`,
    nombre: data.nombre.trim(),
    celular: data.celular,
    role: 'cliente',
    pin: data.pin,
    avatarUrl: data.avatarUrl || null,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  set(STORAGE_KEYS.USERS, users);
  setCurrentUser(newUser);

  addAuditLog({
    usuarioId: newUser.id,
    usuarioNombre: newUser.nombre,
    rol: 'cliente',
    accion: 'REGISTRO_CLIENTE',
    descripcion: `Nuevo cliente registrado desde interfaz pública: ${newUser.nombre}`,
    entidadAfectada: newUser.id,
  });

  return { user: newUser };
}

export function loginDueno(email: string, pass: string): { user?: User; error?: string } {
  const users = getAllUsers();
  const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase() && u.role === 'dueno');

  if (!user || user.password !== pass) {
    return { error: 'Correo o contraseña incorrectos. Por favor verifique sus datos de acceso.' };
  }

  setCurrentUser(user);
  return { user };
}

export interface OwnerBusinessRegistrationData {
  responsableNombre: string;
  celular: string;
  email: string;
  password: string;
  nombreNegocio: string;
  tipoNegocio: string;
  ciudad: string;
  departamento: string;
  direccion: string;
}

function createBusinessSlug(nombre: string, businesses: Business[]): string {
  const base = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'negocio';

  let slug = base;
  let suffix = 2;
  while (businesses.some((business) => business.slug.toLowerCase() === slug.toLowerCase())) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

export function registerOwnerWithBusiness(
  data: OwnerBusinessRegistrationData
): { user?: User; business?: Business; error?: string } {
  const nombre = data.responsableNombre.trim();
  const celular = data.celular.trim();
  const email = data.email.trim().toLowerCase();
  const nombreNegocio = data.nombreNegocio.trim();
  const tipoNegocio = data.tipoNegocio.trim();
  const ciudad = data.ciudad.trim();
  const departamento = data.departamento.trim();
  const direccion = data.direccion.trim();

  if (!nombre || !celular || !email || !data.password || !nombreNegocio || !tipoNegocio || !ciudad || !departamento || !direccion) {
    return { error: 'Completa todos los campos obligatorios para crear la cuenta y el perfil del negocio.' };
  }

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailIsValid) return { error: 'Escribe un correo electrónico válido.' };
  if (data.password.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres.' };

  const phoneDigits = celular.replace(/\D/g, '');
  const normalizedPhone = phoneDigits.startsWith('504')
    ? `+504 ${phoneDigits.slice(3, 7)}-${phoneDigits.slice(7)}`
    : `+504 ${phoneDigits.slice(0, 4)}-${phoneDigits.slice(4)}`;
  if (phoneDigits.length !== 8 && !(phoneDigits.startsWith('504') && phoneDigits.length === 11)) {
    return { error: 'Escribe un celular hondureño de 8 dígitos, con o sin el prefijo +504.' };
  }

  const users = getAllUsers();
  if (users.some((user) => user.email?.trim().toLowerCase() === email)) {
    return { error: 'Ya existe una cuenta con ese correo electrónico. Inicia sesión o utiliza otro correo.' };
  }

  const businesses = getBusinesses();
  const now = new Date().toISOString();
  const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const businessId = `biz_${uniqueSuffix}`;
  const newUser: User = {
    id: `usr_${uniqueSuffix}`,
    nombre,
    celular: normalizedPhone,
    email,
    role: 'dueno',
    password: data.password,
    ownedBusinessIds: [businessId],
    avatarUrl: null,
    createdAt: now,
  };
  const newBusiness: Business = {
    id: businessId,
    slug: createBusinessSlug(nombreNegocio, businesses),
    nombre: nombreNegocio,
    tipoNegocio,
    logoUrl: '',
    bannerUrl: '',
    descripcion: '',
    direccion,
    ciudad,
    departamento,
    horario: 'Por definir',
    telefono: normalizedPhone,
    ownerId: newUser.id,
    estado: 'activo',
    requierePinMenu: false,
    pinAccesoMenu: '',
    categorias: [],
    createdAt: now,
  };

  users.push(newUser);
  businesses.push(newBusiness);
  set(STORAGE_KEYS.USERS, users);
  set(STORAGE_KEYS.BUSINESSES, businesses);
  setCurrentUser(newUser);

  addAuditLog({
    usuarioId: newUser.id,
    usuarioNombre: newUser.nombre,
    rol: 'dueno',
    accion: 'REGISTRO_NEGOCIO',
    descripcion: `Se creó la cuenta de ${newUser.nombre} y el perfil del negocio "${newBusiness.nombre}".`,
    entidadAfectada: newBusiness.id,
  });

  return { user: newUser, business: newBusiness };
}

export function loginSuperadmin(email: string, pass: string): { user?: User; error?: string } {
  const users = getAllUsers();
  const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase() && u.role === 'superadmin');

  if (!user || user.password !== pass) {
    return { error: 'Credenciales de superadministrador incorrectas.' };
  }

  setCurrentUser(user);
  return { user };
}

export function updateUserProfile(
  userId: string,
  data: { nombre: string; avatarUrl?: string | null; celular?: string },
  actingUser: User
): { success: boolean; user?: User; error?: string } {
  if (actingUser.id !== userId && actingUser.role !== 'superadmin') {
    return { success: false, error: 'No autorizado para editar este perfil.' };
  }

  const cleanName = data.nombre?.trim();
  if (!cleanName) {
    return { success: false, error: 'El nombre de perfil no puede estar vacío.' };
  }

  const users = getAllUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) {
    return { success: false, error: 'Usuario no encontrado.' };
  }

  const oldName = users[index].nombre;
  users[index].nombre = cleanName;
  if (data.avatarUrl !== undefined) {
    users[index].avatarUrl = data.avatarUrl;
  }
  if (data.celular !== undefined && data.celular.trim()) {
    users[index].celular = data.celular.trim();
  }

  set(STORAGE_KEYS.USERS, users);

  if (actingUser.id === userId) {
    setCurrentUser(users[index]);
  }

  addAuditLog({
    usuarioId: actingUser.id,
    usuarioNombre: cleanName,
    rol: actingUser.role,
    accion: 'ACTUALIZAR_PERFIL',
    descripcion: `Se actualizó el nombre de perfil de "${oldName}" a "${cleanName}".`,
    entidadAfectada: userId,
  });

  return { success: true, user: users[index] };
}

export function updateUserAvatar(userId: string, avatarUrl: string | null, actingUser: User): boolean {
  const res = updateUserProfile(userId, { nombre: actingUser.nombre, avatarUrl }, actingUser);
  return res.success;
}

export function resetPlatformToClean(actingUser: User): { success: boolean; error?: string } {
  if (actingUser.role !== 'superadmin') {
    return { success: false, error: 'Solo el superadministrador puede reiniciar la plataforma.' };
  }

  set(STORAGE_KEYS.BUSINESSES, []);
  set(STORAGE_KEYS.MENU_ITEMS, []);
  set(STORAGE_KEYS.ORDERS, []);
  set(STORAGE_KEYS.ACCOUNTS, []);
  set(STORAGE_KEYS.MOVEMENTS, []);
  set(STORAGE_KEYS.TICKETS, []);

  // Limpiar ownedBusinessIds en usuarios dueños
  const users = getAllUsers();
  users.forEach((u) => {
    if (u.ownedBusinessIds && u.ownedBusinessIds.length > 0) {
      u.ownedBusinessIds = [];
    }
  });
  set(STORAGE_KEYS.USERS, users);

  addAuditLog({
    usuarioId: actingUser.id,
    usuarioNombre: actingUser.nombre,
    rol: actingUser.role,
    accion: 'RESET_PLATAFORMA',
    descripcion: `El superadministrador ${actingUser.nombre} reinició la plataforma a nuevo. Se vació el catálogo de cafeterías y datos transaccionales.`,
    entidadAfectada: 'sistema',
  });

  return { success: true };
}

// ==================== NEGOCIOS / CAFETERÍAS ====================

export function getBusinesses(): Business[] {
  return get<Business[]>(STORAGE_KEYS.BUSINESSES, INITIAL_BUSINESSES);
}

export function getBusinessBySlug(slug: string): Business | null {
  const businesses = getBusinesses();
  return businesses.find((b) => b.slug.toLowerCase() === slug.toLowerCase()) || null;
}

export function getBusinessById(id: string): Business | null {
  const businesses = getBusinesses();
  return businesses.find((b) => b.id === id) || null;
}

export function getBusinessesForOwner(ownerId: string): Business[] {
  const businesses = getBusinesses();
  return businesses.filter((b) => b.ownerId === ownerId);
}

export function saveBusiness(business: Business, actingUser: User): { success: boolean; error?: string } {
  // Validación de permisos en capa de datos: solo el dueño asignado o superadmin
  if (actingUser.role !== 'superadmin' && actingUser.id !== business.ownerId) {
    return { success: false, error: 'No tiene permisos para modificar este negocio.' };
  }

  const businesses = getBusinesses();
  const existingIndex = businesses.findIndex((b) => b.id === business.id);

  // Validar slug único si es nuevo o cambió
  const slugCollision = businesses.find((b) => b.slug === business.slug && b.id !== business.id);
  if (slugCollision) {
    return { success: false, error: 'El identificador de enlace (slug) ya está en uso por otro negocio.' };
  }

  if (existingIndex >= 0) {
    businesses[existingIndex] = { ...businesses[existingIndex], ...business };
  } else {
    businesses.push(business);
    // Añadir a ownedBusinessIds del dueño
    const users = getAllUsers();
    const ownerIndex = users.findIndex((u) => u.id === business.ownerId);
    if (ownerIndex >= 0) {
      const owned = users[ownerIndex].ownedBusinessIds || [];
      if (!owned.includes(business.id)) {
        users[ownerIndex].ownedBusinessIds = [...owned, business.id];
        set(STORAGE_KEYS.USERS, users);
      }
    }
  }

  set(STORAGE_KEYS.BUSINESSES, businesses);

  addAuditLog({
    usuarioId: actingUser.id,
    usuarioNombre: actingUser.nombre,
    rol: actingUser.role,
    accion: existingIndex >= 0 ? 'ACTUALIZAR_NEGOCIO' : 'CREAR_NEGOCIO',
    descripcion: `Negocio "${business.nombre}" (${business.slug}) guardado por ${actingUser.nombre}`,
    entidadAfectada: business.id,
  });

  return { success: true };
}

export function setBusinessStatus(
  businessId: string,
  estado: 'activo' | 'suspendido',
  actingUser: User
): boolean {
  if (actingUser.role !== 'superadmin') {
    return false;
  }

  const businesses = getBusinesses();
  const index = businesses.findIndex((b) => b.id === businessId);
  if (index === -1) return false;

  businesses[index].estado = estado;
  set(STORAGE_KEYS.BUSINESSES, businesses);

  addAuditLog({
    usuarioId: actingUser.id,
    usuarioNombre: actingUser.nombre,
    rol: actingUser.role,
    accion: estado === 'suspendido' ? 'SUSPENDER_NEGOCIO' : 'ACTIVAR_NEGOCIO',
    descripcion: `El superadministrador cambió el estado del negocio "${businesses[index].nombre}" a ${estado.toUpperCase()}`,
    entidadAfectada: businessId,
  });

  return true;
}

export function deleteBusiness(
  businessId: string,
  actingUser: User
): { success: boolean; error?: string } {
  if (actingUser.role !== 'superadmin') {
    return { success: false, error: 'Solo el superadministrador puede eliminar negocios.' };
  }

  const businesses = getBusinesses();
  const business = businesses.find((b) => b.id === businessId);
  if (!business) {
    return { success: false, error: 'Negocio no encontrado.' };
  }

  // Filtrar y guardar negocios
  const updatedBusinesses = businesses.filter((b) => b.id !== businessId);
  set(STORAGE_KEYS.BUSINESSES, updatedBusinesses);

  // Eliminar platos asociados
  const menuItems = get<MenuItem[]>(STORAGE_KEYS.MENU_ITEMS, INITIAL_MENU_ITEMS);
  const updatedMenuItems = menuItems.filter((m) => m.businessId !== businessId);
  set(STORAGE_KEYS.MENU_ITEMS, updatedMenuItems);

  // Remover de ownedBusinessIds de los dueños
  const users = getAllUsers();
  users.forEach((u) => {
    if (u.ownedBusinessIds && u.ownedBusinessIds.includes(businessId)) {
      u.ownedBusinessIds = u.ownedBusinessIds.filter((id) => id !== businessId);
    }
  });
  set(STORAGE_KEYS.USERS, users);

  addAuditLog({
    usuarioId: actingUser.id,
    usuarioNombre: actingUser.nombre,
    rol: actingUser.role,
    accion: 'ELIMINAR_NEGOCIO',
    descripcion: `El superadministrador eliminó permanentemente el negocio "${business.nombre}" (${business.slug})`,
    entidadAfectada: businessId,
  });

  return { success: true };
}

// ==================== MENÚ Y PRODUCTOS ====================

export function getMenuItems(businessId: string): MenuItem[] {
  const items = get<MenuItem[]>(STORAGE_KEYS.MENU_ITEMS, INITIAL_MENU_ITEMS);
  return items.filter((i) => i.businessId === businessId);
}

export function saveMenuItem(item: MenuItem, actingUser: User): { success: boolean; error?: string } {
  const business = getBusinessById(item.businessId);
  if (!business) return { success: false, error: 'Negocio no encontrado.' };

  // Comprobar propiedad del negocio
  if (actingUser.role !== 'superadmin' && actingUser.id !== business.ownerId) {
    return { success: false, error: 'No autorizado para modificar el menú de este negocio.' };
  }

  const items = get<MenuItem[]>(STORAGE_KEYS.MENU_ITEMS, INITIAL_MENU_ITEMS);
  const index = items.findIndex((i) => i.id === item.id);

  if (index >= 0) {
    items[index] = item;
  } else {
    items.push(item);
  }

  set(STORAGE_KEYS.MENU_ITEMS, items);
  return { success: true };
}

export function toggleMenuItemAvailability(
  itemId: string,
  businessId: string,
  disponible: boolean,
  actingUser: User
): boolean {
  const business = getBusinessById(businessId);
  if (!business) return false;
  if (actingUser.role !== 'superadmin' && actingUser.id !== business.ownerId) return false;

  const items = get<MenuItem[]>(STORAGE_KEYS.MENU_ITEMS, INITIAL_MENU_ITEMS);
  const index = items.findIndex((i) => i.id === itemId && i.businessId === businessId);
  if (index === -1) return false;

  items[index].disponible = disponible;
  set(STORAGE_KEYS.MENU_ITEMS, items);
  return true;
}

export function deleteMenuItem(itemId: string, businessId: string, actingUser: User): boolean {
  const business = getBusinessById(businessId);
  if (!business) return false;
  if (actingUser.role !== 'superadmin' && actingUser.id !== business.ownerId) return false;

  const items = get<MenuItem[]>(STORAGE_KEYS.MENU_ITEMS, INITIAL_MENU_ITEMS);
  const filtered = items.filter((i) => !(i.id === itemId && i.businessId === businessId));
  set(STORAGE_KEYS.MENU_ITEMS, filtered);
  return true;
}

// ==================== GESTIÓN DE CATEGORÍAS PERSONALIZADAS ====================

export function getBusinessCategories(businessId: string): string[] {
  const business = getBusinessById(businessId);
  if (business?.categorias && business.categorias.length > 0) {
    return business.categorias;
  }
  // Si no tiene categorías explícitas, extraer de los platillos existentes
  const items = getMenuItems(businessId);
  const extracted = Array.from(new Set(items.map((i) => i.categoria))).filter(Boolean);
  return extracted.length > 0 ? extracted : ['General'];
}

export function addBusinessCategory(
  businessId: string,
  nombreCategoria: string,
  actingUser: User
): { success: boolean; error?: string } {
  const business = getBusinessById(businessId);
  if (!business) return { success: false, error: 'Negocio no encontrado.' };
  if (actingUser.role !== 'superadmin' && actingUser.id !== business.ownerId) {
    return { success: false, error: 'No autorizado para gestionar categorías de este negocio.' };
  }

  const cleanCat = nombreCategoria.trim();
  if (!cleanCat) {
    return { success: false, error: 'El nombre de la categoría no puede estar vacío.' };
  }

  const currentCats = getBusinessCategories(businessId);
  if (currentCats.some((c) => c.toLowerCase() === cleanCat.toLowerCase())) {
    return { success: false, error: 'Ya existe una categoría con este nombre.' };
  }

  const updatedCats = [...currentCats, cleanCat];
  business.categorias = updatedCats;

  const businesses = getBusinesses();
  const index = businesses.findIndex((b) => b.id === businessId);
  if (index >= 0) {
    businesses[index].categorias = updatedCats;
    set(STORAGE_KEYS.BUSINESSES, businesses);
  }

  addAuditLog({
    usuarioId: actingUser.id,
    usuarioNombre: actingUser.nombre,
    rol: actingUser.role,
    accion: 'CREAR_CATEGORIA',
    descripcion: `Categoría "${cleanCat}" creada en ${business.nombre}`,
    entidadAfectada: businessId,
  });

  return { success: true };
}

export function updateBusinessCategory(
  businessId: string,
  oldNombre: string,
  newNombre: string,
  actingUser: User
): { success: boolean; error?: string } {
  const business = getBusinessById(businessId);
  if (!business) return { success: false, error: 'Negocio no encontrado.' };
  if (actingUser.role !== 'superadmin' && actingUser.id !== business.ownerId) {
    return { success: false, error: 'No autorizado para gestionar categorías.' };
  }

  const cleanNew = newNombre.trim();
  if (!cleanNew) {
    return { success: false, error: 'El nuevo nombre no puede estar vacío.' };
  }

  const currentCats = getBusinessCategories(businessId);
  const catIndex = currentCats.findIndex((c) => c === oldNombre);
  if (catIndex === -1) {
    return { success: false, error: 'Categoría no encontrada.' };
  }

  // Comprobar colisión
  if (
    cleanNew.toLowerCase() !== oldNombre.toLowerCase() &&
    currentCats.some((c) => c.toLowerCase() === cleanNew.toLowerCase())
  ) {
    return { success: false, error: 'Ya existe otra categoría con ese nombre.' };
  }

  currentCats[catIndex] = cleanNew;
  business.categorias = currentCats;

  const businesses = getBusinesses();
  const bIndex = businesses.findIndex((b) => b.id === businessId);
  if (bIndex >= 0) {
    businesses[bIndex].categorias = currentCats;
    set(STORAGE_KEYS.BUSINESSES, businesses);
  }

  // Cascada: Actualizar los platillos que utilizaban la categoría antigua
  const items = get<MenuItem[]>(STORAGE_KEYS.MENU_ITEMS, INITIAL_MENU_ITEMS);
  let updatedAny = false;
  items.forEach((item) => {
    if (item.businessId === businessId && item.categoria === oldNombre) {
      item.categoria = cleanNew;
      updatedAny = true;
    }
  });
  if (updatedAny) {
    set(STORAGE_KEYS.MENU_ITEMS, items);
  }

  addAuditLog({
    usuarioId: actingUser.id,
    usuarioNombre: actingUser.nombre,
    rol: actingUser.role,
    accion: 'MODIFICAR_CATEGORIA',
    descripcion: `Categoría "${oldNombre}" renombrada a "${cleanNew}" en ${business.nombre}`,
    entidadAfectada: businessId,
  });

  return { success: true };
}

export function deleteBusinessCategory(
  businessId: string,
  nombreCategoria: string,
  actingUser: User
): { success: boolean; error?: string } {
  const business = getBusinessById(businessId);
  if (!business) return { success: false, error: 'Negocio no encontrado.' };
  if (actingUser.role !== 'superadmin' && actingUser.id !== business.ownerId) {
    return { success: false, error: 'No autorizado para eliminar categorías.' };
  }

  const currentCats = getBusinessCategories(businessId);
  if (currentCats.length <= 1) {
    return { success: false, error: 'Debe conservar al menos una categoría en el menú.' };
  }

  const filteredCats = currentCats.filter((c) => c !== nombreCategoria);
  business.categorias = filteredCats;

  const businesses = getBusinesses();
  const bIndex = businesses.findIndex((b) => b.id === businessId);
  if (bIndex >= 0) {
    businesses[bIndex].categorias = filteredCats;
    set(STORAGE_KEYS.BUSINESSES, businesses);
  }

  // Reasignar los productos a la primera categoría disponible
  const fallbackCat = filteredCats[0] || 'General';
  const items = get<MenuItem[]>(STORAGE_KEYS.MENU_ITEMS, INITIAL_MENU_ITEMS);
  items.forEach((item) => {
    if (item.businessId === businessId && item.categoria === nombreCategoria) {
      item.categoria = fallbackCat;
    }
  });
  set(STORAGE_KEYS.MENU_ITEMS, items);

  addAuditLog({
    usuarioId: actingUser.id,
    usuarioNombre: actingUser.nombre,
    rol: actingUser.role,
    accion: 'ELIMINAR_CATEGORIA',
    descripcion: `Categoría "${nombreCategoria}" eliminada en ${business.nombre}. Productos reasignados a "${fallbackCat}".`,
    entidadAfectada: businessId,
  });

  return { success: true };
}

// ==================== PIN DE ACCESO AL MENÚ (FIDELIDAD DE CLIENTES) ====================

export function businessRequiresMenuPin(business: Business): boolean {
  // Para negocios antiguos sin esta opción, conservar el comportamiento que ya tenían.
  return typeof business.requierePinMenu === 'boolean'
    ? business.requierePinMenu
    : Boolean(business.pinAccesoMenu?.trim());
}

export function updateBusinessMenuPin(
  businessId: string,
  nuevoPin: string,
  actingUser: User
): { success: boolean; error?: string } {
  const business = getBusinessById(businessId);
  if (!business) return { success: false, error: 'Negocio no encontrado.' };
  if (actingUser.role !== 'superadmin' && actingUser.id !== business.ownerId) {
    return { success: false, error: 'No autorizado para cambiar el PIN de acceso de este negocio.' };
  }

  const cleanPin = nuevoPin.trim();
  if (cleanPin.length < 3) {
    return { success: false, error: 'El PIN de acceso debe tener al menos 3 caracteres o dígitos.' };
  }

  business.pinAccesoMenu = cleanPin;
  const businesses = getBusinesses();
  const index = businesses.findIndex((b) => b.id === businessId);
  if (index >= 0) {
    businesses[index].pinAccesoMenu = cleanPin;
    set(STORAGE_KEYS.BUSINESSES, businesses);
  }

  addAuditLog({
    usuarioId: actingUser.id,
    usuarioNombre: actingUser.nombre,
    rol: actingUser.role,
    accion: 'ACTUALIZAR_PIN_MENU',
    descripcion: `El dueño actualizó el PIN de fidelidad del local ${business.nombre}`,
    entidadAfectada: businessId,
  });

  return { success: true };
}

export function verifyBusinessMenuPin(businessId: string, pinIngresado: string): boolean {
  const business = getBusinessById(businessId);
  if (!business) return false;
  if (!businessRequiresMenuPin(business)) return true;
  // Si el dueño exige PIN pero todavía no lo configuró, no permitir el acceso por omisión.
  if (!business.pinAccesoMenu?.trim()) return false;
  return business.pinAccesoMenu.trim().toLowerCase() === pinIngresado.trim().toLowerCase();
}

// ==================== PEDIDOS (ORDERS) ====================

export function getOrders(requestingUser: User | null, filterBusinessId?: string): Order[] {
  if (!requestingUser) return [];

  const allOrders = get<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);

  if (requestingUser.role === 'superadmin') {
    if (filterBusinessId) {
      return allOrders.filter((o) => o.businessId === filterBusinessId);
    }
    return allOrders;
  }

  if (requestingUser.role === 'dueno') {
    // Solo puede ver pedidos de sus negocios
    const businesses = getBusinessesForOwner(requestingUser.id);
    const ownedIds = new Set(businesses.map((b) => b.id));

    return allOrders.filter((o) => {
      if (!ownedIds.has(o.businessId)) return false;
      if (filterBusinessId) return o.businessId === filterBusinessId;
      return true;
    });
  }

  // Cliente: solo ve sus propios pedidos
  return allOrders.filter((o) => {
    if (o.clienteId !== requestingUser.id) return false;
    if (filterBusinessId) return o.businessId === filterBusinessId;
    return true;
  });
}

export function createOrder(
  orderInput: Omit<Order, 'id' | 'numeroPedido' | 'fechaCreacion' | 'fechaActualizacion' | 'estadoPago'>,
  actingUser: User
): { order?: Order; error?: string } {
  // Cliente creando pedido
  if (actingUser.id !== orderInput.clienteId && actingUser.role !== 'superadmin') {
    return { error: 'No autorizado para crear pedidos a nombre de otro cliente.' };
  }

  const business = getBusinessById(orderInput.businessId);
  if (!business) return { error: 'El negocio no existe.' };
  if (business.estado === 'suspendido') {
    return { error: 'Este negocio se encuentra suspendido temporalmente y no acepta pedidos.' };
  }

  // Si elige 'fin_de_mes', validar que esté habilitado en su cuenta de este negocio
  if (orderInput.metodoPago === 'fin_de_mes') {
    const account = getClientAccount(orderInput.clienteId, orderInput.businessId, actingUser);
    if (!account || !account.pagoFinDeMesHabilitado) {
      return {
        error:
          'El pago a fin de mes no está habilitado para su cuenta en este negocio. Por favor seleccione Efectivo o Transferencia, o consulte al encargado.',
      };
    }
  }

  const allOrders = get<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  const orderNum = `YST-${100 + allOrders.length + 1}`;
  const now = new Date().toISOString();

  // El estado de pago inicial depende del método:
  // - Efectivo: pendiente
  // - Transferencia: pendiente
  // - Fin de mes: cargado_en_cuenta
  const estadoPago: PaymentStatus =
    orderInput.metodoPago === 'fin_de_mes' ? 'cargado_en_cuenta' : 'pendiente';

  const newOrder: Order = {
    ...orderInput,
    id: `ord_${Date.now()}`,
    numeroPedido: orderNum,
    estadoPago,
    fechaCreacion: now,
    fechaActualizacion: now,
  };

  allOrders.unshift(newOrder);
  set(STORAGE_KEYS.ORDERS, allOrders);

  // Si el pago es fin de mes, registrar de inmediato el cargo en el saldo del cliente
  if (orderInput.metodoPago === 'fin_de_mes') {
    recordOrderChargeToAccount(newOrder);
  }

  return { order: newOrder };
}

export function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  actingUser: User
): { success: boolean; error?: string } {
  const allOrders = get<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  const index = allOrders.findIndex((o) => o.id === orderId);
  if (index === -1) return { success: false, error: 'Pedido no encontrado.' };

  const order = allOrders[index];
  const business = getBusinessById(order.businessId);

  // Validación de permisos: Dueño del negocio o Superadmin
  if (actingUser.role !== 'superadmin' && (!business || business.ownerId !== actingUser.id)) {
    return { success: false, error: 'No tiene permisos para modificar pedidos de este negocio.' };
  }

  order.estadoPedido = newStatus;
  order.fechaActualizacion = new Date().toISOString();
  allOrders[index] = order;
  set(STORAGE_KEYS.ORDERS, allOrders);

  return { success: true };
}

export function cancelOrder(
  orderId: string,
  actingUser: User,
  motivo: string = 'Cancelado por el usuario'
): { success: boolean; error?: string } {
  const allOrders = get<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  const index = allOrders.findIndex((o) => o.id === orderId);
  if (index === -1) return { success: false, error: 'Pedido no encontrado.' };

  const order = allOrders[index];
  const business = getBusinessById(order.businessId);

  // Si es cliente, solo puede cancelar si es su propio pedido y todavía está 'recibido'
  if (actingUser.role === 'cliente') {
    if (order.clienteId !== actingUser.id) {
      return { success: false, error: 'No tienes permiso para cancelar este pedido.' };
    }
    if (order.estadoPedido !== 'recibido') {
      return {
        success: false,
        error: 'El pedido ya está siendo preparado o completado y no puede cancelarse desde la aplicación. Comuníquese directamente con el local.',
      };
    }
  } else if (actingUser.role !== 'superadmin' && (!business || business.ownerId !== actingUser.id)) {
    return { success: false, error: 'No tiene permisos para cancelar pedidos de este negocio.' };
  }

  // Reversión de saldo si fue pago a fin de mes
  if (order.metodoPago === 'fin_de_mes') {
    const accounts = get<ClientBusinessAccount[]>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
    const accIndex = accounts.findIndex(
      (a) => a.clienteId === order.clienteId && a.businessId === order.businessId
    );
    if (accIndex >= 0) {
      accounts[accIndex].saldoPendiente = Math.max(0, accounts[accIndex].saldoPendiente - order.total);
      accounts[accIndex].fechaUltimoMovimiento = new Date().toISOString();
      set(STORAGE_KEYS.ACCOUNTS, accounts);

      const movements = get<FinancialMovement[]>(STORAGE_KEYS.MOVEMENTS, INITIAL_MOVEMENTS);
      const revMovement: FinancialMovement = {
        id: `mov_rev_${Date.now()}`,
        businessId: order.businessId,
        clienteId: order.clienteId,
        tipo: 'ajuste',
        monto: -order.total,
        saldoResultante: accounts[accIndex].saldoPendiente,
        orderId: order.id,
        referencia: `Anulación pedido ${order.numeroPedido}`,
        motivoAjuste: `Cancelación del pedido: ${motivo}`,
        registradoPorId: actingUser.id,
        registradoPorNombre: actingUser.nombre,
        fecha: new Date().toISOString(),
      };
      movements.unshift(revMovement);
      set(STORAGE_KEYS.MOVEMENTS, movements);
    }
  }

  order.estadoPedido = 'cancelado';
  order.fechaActualizacion = new Date().toISOString();
  allOrders[index] = order;
  set(STORAGE_KEYS.ORDERS, allOrders);

  addAuditLog({
    usuarioId: actingUser.id,
    usuarioNombre: actingUser.nombre,
    rol: actingUser.role,
    accion: 'CANCELAR_PEDIDO',
    descripcion: `Pedido ${order.numeroPedido} en "${order.businessNombre}" cancelado por ${actingUser.nombre}. Motivo: ${motivo}`,
    entidadAfectada: `Pedido ${order.numeroPedido}`,
  });

  return { success: true };
}

export function updateClientCreditLimit(
  businessId: string,
  clienteId: string,
  nuevoLimite: number,
  actingUser: User
): { success: boolean; error?: string } {
  const business = getBusinessById(businessId);
  if (!business) return { success: false, error: 'Negocio no encontrado.' };
  if (actingUser.role !== 'superadmin' && actingUser.id !== business.ownerId) {
    return { success: false, error: 'Permisos insuficientes.' };
  }

  const accounts = get<ClientBusinessAccount[]>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
  const index = accounts.findIndex((a) => a.businessId === businessId && a.clienteId === clienteId);
  if (index >= 0) {
    accounts[index].limiteCredito = nuevoLimite;
    set(STORAGE_KEYS.ACCOUNTS, accounts);
  } else {
    accounts.push({
      id: `acc_${businessId}_${clienteId}`,
      clienteId,
      businessId,
      saldoPendiente: 0,
      pagoFinDeMesHabilitado: false,
      limiteCredito: nuevoLimite,
    });
    set(STORAGE_KEYS.ACCOUNTS, accounts);
  }

  addAuditLog({
    usuarioId: actingUser.id,
    usuarioNombre: actingUser.nombre,
    rol: actingUser.role,
    accion: 'ACTUALIZAR_LIMITE_CREDITO',
    descripcion: `Límite de crédito actualizado a L ${nuevoLimite.toFixed(2)} para cliente en "${business.nombre}"`,
    entidadAfectada: `Cuenta cliente ${clienteId} en ${business.nombre}`,
  });

  return { success: true };
}

export function updatePaymentStatus(
  orderId: string,
  newPaymentStatus: PaymentStatus,
  actingUser: User
): { success: boolean; error?: string } {
  const allOrders = get<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  const index = allOrders.findIndex((o) => o.id === orderId);
  if (index === -1) return { success: false, error: 'Pedido no encontrado.' };

  const order = allOrders[index];
  const business = getBusinessById(order.businessId);

  if (actingUser.role !== 'superadmin' && (!business || business.ownerId !== actingUser.id)) {
    return { success: false, error: 'No tiene permisos para registrar cobros en este negocio.' };
  }

  order.estadoPago = newPaymentStatus;
  order.fechaActualizacion = new Date().toISOString();
  allOrders[index] = order;
  set(STORAGE_KEYS.ORDERS, allOrders);

  // Registrar movimiento financiero cuando se recibe efectivo o se confirma transferencia
  if (newPaymentStatus === 'recibido' || newPaymentStatus === 'confirmado') {
    const accounts = get<ClientBusinessAccount[]>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
    const acc = accounts.find(
      (a) => a.clienteId === order.clienteId && a.businessId === order.businessId
    );

    const movements = get<FinancialMovement[]>(STORAGE_KEYS.MOVEMENTS, INITIAL_MOVEMENTS);
    const newMovement: FinancialMovement = {
      id: `mov_${Date.now()}`,
      businessId: order.businessId,
      clienteId: order.clienteId,
      tipo: order.metodoPago === 'efectivo' ? 'pago_efectivo' : 'pago_transferencia',
      monto: -order.total, // Reduce el saldo o salda la transacción
      saldoResultante: acc ? acc.saldoPendiente : 0,
      orderId: order.id,
      referencia: `Cobro pedido ${order.numeroPedido} (${order.metodoPago})`,
      registradoPorId: actingUser.id,
      registradoPorNombre: actingUser.nombre,
      fecha: new Date().toISOString(),
    };
    movements.unshift(newMovement);
    set(STORAGE_KEYS.MOVEMENTS, movements);
  }

  return { success: true };
}

// ==================== CUENTAS, PAGOS A FIN DE MES & LIBRO FINANCIERO ====================

export function getClientAccount(
  clienteId: string,
  businessId: string,
  requestingUser: User | null
): ClientBusinessAccount | null {
  if (!requestingUser) return null;

  // Comprobar autorización: cliente puede ver su propia cuenta, dueño solo la de su negocio, superadmin todas
  if (requestingUser.role === 'cliente' && requestingUser.id !== clienteId) {
    return null;
  }
  if (requestingUser.role === 'dueno') {
    const business = getBusinessById(businessId);
    if (!business || business.ownerId !== requestingUser.id) return null;
  }

  const accounts = get<ClientBusinessAccount[]>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
  let acc = accounts.find((a) => a.clienteId === clienteId && a.businessId === businessId);

  // Si no existe, crear registro base (deshabilitado por defecto como pide el requerimiento)
  if (!acc) {
    acc = {
      id: `acc_${clienteId}_${businessId}`,
      clienteId,
      businessId,
      pagoFinDeMesHabilitado: false, // Deshabilitado por defecto
      saldoPendiente: 0,
      limiteCredito: 500,
    };
    accounts.push(acc);
    set(STORAGE_KEYS.ACCOUNTS, accounts);
  }

  return acc;
}

export function getClientAccountsForClient(clienteId: string, requestingUser: User): ClientBusinessAccount[] {
  if (requestingUser.role === 'cliente' && requestingUser.id !== clienteId) return [];
  const accounts = get<ClientBusinessAccount[]>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
  return accounts.filter((a) => a.clienteId === clienteId);
}

export function getBusinessClientsWithAccounts(
  businessId: string,
  requestingUser: User
): { user: User; account: ClientBusinessAccount }[] {
  const business = getBusinessById(businessId);
  if (!business) return [];
  if (requestingUser.role !== 'superadmin' && business.ownerId !== requestingUser.id) return [];

  const users = getAllUsers().filter((u) => u.role === 'cliente');
  const accounts = get<ClientBusinessAccount[]>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);

  return users.map((user) => {
    let acc = accounts.find((a) => a.clienteId === user.id && a.businessId === businessId);
    if (!acc) {
      acc = {
        id: `acc_${user.id}_${businessId}`,
        clienteId: user.id,
        businessId,
        pagoFinDeMesHabilitado: false,
        saldoPendiente: 0,
        limiteCredito: 500,
      };
    }
    return { user, account: acc };
  });
}

/**
 * Elimina una cuenta de cliente de prueba únicamente cuando no tiene actividad
 * ni relaciones con otros negocios. El historial contable nunca se borra.
 */
export function deleteClientProfile(
  clienteId: string,
  businessId: string,
  actingUser: User
): { success: boolean; error?: string } {
  const business = getBusinessById(businessId);
  if (!business) return { success: false, error: 'No se encontró el negocio seleccionado.' };
  if (actingUser.role !== 'superadmin' && business.ownerId !== actingUser.id) {
    return { success: false, error: 'No tienes permiso para eliminar clientes de este negocio.' };
  }

  const users = getAllUsers();
  const client = users.find((user) => user.id === clienteId && user.role === 'cliente');
  if (!client) return { success: false, error: 'No se encontró el perfil de cliente.' };

  const orders = get<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  if (orders.some((order) => order.clienteId === clienteId)) {
    return {
      success: false,
      error: 'No se puede eliminar este perfil porque tiene pedidos registrados. El historial debe conservarse.',
    };
  }

  const movements = get<FinancialMovement[]>(STORAGE_KEYS.MOVEMENTS, INITIAL_MOVEMENTS);
  if (movements.some((movement) => movement.clienteId === clienteId)) {
    return {
      success: false,
      error: 'No se puede eliminar este perfil porque tiene movimientos contables. El historial debe conservarse.',
    };
  }

  const tickets = get<SupportTicket[]>(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
  if (tickets.some((ticket) => ticket.autorId === clienteId)) {
    return {
      success: false,
      error: 'No se puede eliminar este perfil porque tiene casos de soporte registrados.',
    };
  }

  const accounts = get<ClientBusinessAccount[]>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
  const clientAccounts = accounts.filter((account) => account.clienteId === clienteId);
  if (clientAccounts.some((account) => account.businessId !== businessId)) {
    return {
      success: false,
      error: 'Este cliente tiene una cuenta en otro negocio. Por seguridad, solo el superadministrador puede gestionar ese perfil.',
    };
  }

  const selectedAccount = clientAccounts.find((account) => account.businessId === businessId);
  if ((selectedAccount?.saldoPendiente || 0) > 0) {
    return {
      success: false,
      error: 'No se puede eliminar un perfil con saldo pendiente. Registra primero el pago o ajuste correspondiente.',
    };
  }

  set(STORAGE_KEYS.USERS, users.filter((user) => user.id !== clienteId));
  set(STORAGE_KEYS.ACCOUNTS, accounts.filter((account) => account.clienteId !== clienteId));

  addAuditLog({
    usuarioId: actingUser.id,
    usuarioNombre: actingUser.nombre,
    rol: actingUser.role,
    accion: 'ELIMINAR_PERFIL_CLIENTE',
    descripcion: `Se eliminó el perfil de cliente ${clienteId} de "${business.nombre}".`,
    entidadAfectada: clienteId,
  });

  return { success: true };
}

export function togglePagoFinDeMes(
  clienteId: string,
  businessId: string,
  habilitado: boolean,
  actingUser: User
): boolean {
  const business = getBusinessById(businessId);
  if (!business) return false;
  if (actingUser.role !== 'superadmin' && business.ownerId !== actingUser.id) return false;

  const accounts = get<ClientBusinessAccount[]>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
  const index = accounts.findIndex((a) => a.clienteId === clienteId && a.businessId === businessId);

  if (index >= 0) {
    accounts[index].pagoFinDeMesHabilitado = habilitado;
  } else {
    accounts.push({
      id: `acc_${clienteId}_${businessId}`,
      clienteId,
      businessId,
      pagoFinDeMesHabilitado: habilitado,
      saldoPendiente: 0,
      limiteCredito: 500,
    });
  }

  set(STORAGE_KEYS.ACCOUNTS, accounts);

  addAuditLog({
    usuarioId: actingUser.id,
    usuarioNombre: actingUser.nombre,
    rol: actingUser.role,
    accion: habilitado ? 'HABILITAR_FIN_DE_MES' : 'DESHABILITAR_FIN_DE_MES',
    descripcion: `Se ${habilitado ? 'habilitó' : 'deshabilitó'} la opción de "Pago a fin de mes" para el cliente ${clienteId} en ${business.nombre}`,
    entidadAfectada: businessId,
  });

  return true;
}

// Carga un pedido como deuda al saldo del cliente
function recordOrderChargeToAccount(order: Order): void {
  const accounts = get<ClientBusinessAccount[]>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
  let index = accounts.findIndex(
    (a) => a.clienteId === order.clienteId && a.businessId === order.businessId
  );

  if (index === -1) {
    accounts.push({
      id: `acc_${order.clienteId}_${order.businessId}`,
      clienteId: order.clienteId,
      businessId: order.businessId,
      pagoFinDeMesHabilitado: true,
      saldoPendiente: order.total,
      fechaUltimoMovimiento: new Date().toISOString(),
    });
    index = accounts.length - 1;
  } else {
    accounts[index].saldoPendiente += order.total;
    accounts[index].fechaUltimoMovimiento = new Date().toISOString();
  }

  set(STORAGE_KEYS.ACCOUNTS, accounts);

  // Registrar en movimientos
  const movements = get<FinancialMovement[]>(STORAGE_KEYS.MOVEMENTS, INITIAL_MOVEMENTS);
  movements.unshift({
    id: `mov_${Date.now()}`,
    businessId: order.businessId,
    clienteId: order.clienteId,
    tipo: 'cargo_pedido',
    monto: order.total,
    saldoResultante: accounts[index].saldoPendiente,
    orderId: order.id,
    referencia: `Pedido ${order.numeroPedido} cargado a cuenta (Fin de mes)`,
    registradoPorId: order.clienteId,
    registradoPorNombre: order.clienteNombre,
    fecha: new Date().toISOString(),
  });
  set(STORAGE_KEYS.MOVEMENTS, movements);
}

// Registrar abono o pago manual a la cuenta del cliente (reduce saldo)
export function recordClientPayment(
  params: {
    businessId: string;
    clienteId: string;
    monto: number;
    metodo: 'efectivo' | 'transferencia';
    referencia?: string;
  },
  actingUser: User
): { success: boolean; error?: string } {
  const business = getBusinessById(params.businessId);
  if (!business) return { success: false, error: 'Negocio no encontrado.' };
  if (actingUser.role !== 'superadmin' && business.ownerId !== actingUser.id) {
    return { success: false, error: 'No autorizado para registrar cobros en este negocio.' };
  }

  if (params.monto <= 0) {
    return { success: false, error: 'El monto del abono debe ser mayor a L 0.00' };
  }

  const accounts = get<ClientBusinessAccount[]>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
  const index = accounts.findIndex(
    (a) => a.clienteId === params.clienteId && a.businessId === params.businessId
  );

  if (index === -1) {
    return { success: false, error: 'No se encontró la cuenta del cliente para este negocio.' };
  }

  // Reducir saldo pendiente
  accounts[index].saldoPendiente = Math.max(0, accounts[index].saldoPendiente - params.monto);
  accounts[index].fechaUltimoMovimiento = new Date().toISOString();
  set(STORAGE_KEYS.ACCOUNTS, accounts);

  // Registrar movimiento
  const movements = get<FinancialMovement[]>(STORAGE_KEYS.MOVEMENTS, INITIAL_MOVEMENTS);
  movements.unshift({
    id: `mov_${Date.now()}`,
    businessId: params.businessId,
    clienteId: params.clienteId,
    tipo: 'abono_cuenta',
    monto: -params.monto,
    saldoResultante: accounts[index].saldoPendiente,
    referencia: `Abono a cuenta (${params.metodo === 'efectivo' ? 'Efectivo' : 'Transferencia'}) ${params.referencia ? '- Ref: ' + params.referencia : ''}`,
    registradoPorId: actingUser.id,
    registradoPorNombre: actingUser.nombre,
    fecha: new Date().toISOString(),
  });
  set(STORAGE_KEYS.MOVEMENTS, movements);

  return { success: true };
}

// Ajuste manual con motivo obligatorio (requisito estricto: no se borran movimientos, se hacen ajustes)
export function recordManualAdjustment(
  params: {
    businessId: string;
    clienteId: string;
    montoAjuste: number; // positivo aumenta saldo, negativo reduce saldo
    motivo: string;
  },
  actingUser: User
): { success: boolean; error?: string } {
  const business = getBusinessById(params.businessId);
  if (!business) return { success: false, error: 'Negocio no encontrado.' };
  if (actingUser.role !== 'superadmin' && business.ownerId !== actingUser.id) {
    return { success: false, error: 'No autorizado para realizar ajustes en este negocio.' };
  }

  if (!params.motivo.trim()) {
    return { success: false, error: 'Es obligatorio especificar el motivo del ajuste para la auditoría.' };
  }

  const accounts = get<ClientBusinessAccount[]>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
  let index = accounts.findIndex(
    (a) => a.clienteId === params.clienteId && a.businessId === params.businessId
  );

  if (index === -1) {
    accounts.push({
      id: `acc_${params.clienteId}_${params.businessId}`,
      clienteId: params.clienteId,
      businessId: params.businessId,
      pagoFinDeMesHabilitado: false,
      saldoPendiente: Math.max(0, params.montoAjuste),
      fechaUltimoMovimiento: new Date().toISOString(),
    });
    index = accounts.length - 1;
  } else {
    accounts[index].saldoPendiente = Math.max(0, accounts[index].saldoPendiente + params.montoAjuste);
    accounts[index].fechaUltimoMovimiento = new Date().toISOString();
  }

  set(STORAGE_KEYS.ACCOUNTS, accounts);

  // Registrar en movimientos
  const movements = get<FinancialMovement[]>(STORAGE_KEYS.MOVEMENTS, INITIAL_MOVEMENTS);
  movements.unshift({
    id: `mov_${Date.now()}`,
    businessId: params.businessId,
    clienteId: params.clienteId,
    tipo: 'ajuste',
    monto: params.montoAjuste,
    saldoResultante: accounts[index].saldoPendiente,
    motivoAjuste: params.motivo.trim(),
    referencia: `Ajuste manual: ${params.motivo.trim()}`,
    registradoPorId: actingUser.id,
    registradoPorNombre: actingUser.nombre,
    fecha: new Date().toISOString(),
  });
  set(STORAGE_KEYS.MOVEMENTS, movements);

  addAuditLog({
    usuarioId: actingUser.id,
    usuarioNombre: actingUser.nombre,
    rol: actingUser.role,
    accion: 'AJUSTE_FINANCIERO',
    descripcion: `Ajuste de saldo (${params.montoAjuste >= 0 ? '+' : ''}${params.montoAjuste} HNL) para cliente ${params.clienteId}. Motivo: ${params.motivo}`,
    entidadAfectada: params.businessId,
  });

  return { success: true };
}

export function getFinancialMovements(
  businessId: string,
  requestingUser: User,
  clienteIdFilter?: string
): FinancialMovement[] {
  const business = getBusinessById(businessId);
  if (!business) return [];

  // Comprobar acceso
  if (requestingUser.role === 'dueno' && business.ownerId !== requestingUser.id) {
    return [];
  }
  if (requestingUser.role === 'cliente' && requestingUser.id !== clienteIdFilter) {
    return [];
  }

  const all = get<FinancialMovement[]>(STORAGE_KEYS.MOVEMENTS, INITIAL_MOVEMENTS);
  return all.filter((m) => {
    if (m.businessId !== businessId) return false;
    if (clienteIdFilter && m.clienteId !== clienteIdFilter) return false;
    return true;
  });
}

// ==================== SOPORTE TIPO CHAT ====================

export function getSupportTickets(
  requestingUser: User | null,
  businessIdFilter?: string
): SupportTicket[] {
  if (!requestingUser) return [];

  const tickets = get<SupportTicket[]>(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);

  if (requestingUser.role === 'superadmin') {
    if (businessIdFilter) {
      return tickets.filter((t) => t.businessId === businessIdFilter);
    }
    return tickets;
  }

  if (requestingUser.role === 'dueno') {
    const ownedBusinesses = getBusinessesForOwner(requestingUser.id);
    const ownedIds = new Set(ownedBusinesses.map((b) => b.id));

    return tickets.filter((t) => {
      // Dueño ve tickets relacionados con sus negocios o tickets creados por él mismo
      return (t.businessId && ownedIds.has(t.businessId)) || t.autorId === requestingUser.id;
    });
  }

  // Cliente: ve solo sus propios tickets
  return tickets.filter((t) => t.autorId === requestingUser.id);
}

export function createSupportTicket(
  params: {
    categoria: SupportTicket['categoria'];
    titulo: string;
    descripcion: string;
    businessId?: string;
  },
  actingUser: User
): { ticket?: SupportTicket; error?: string } {
  const tickets = get<SupportTicket[]>(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
  const ticketNum = `TK-${100 + tickets.length + 1}`;
  const now = new Date().toISOString();

  let businessNombre: string | undefined = undefined;
  if (params.businessId) {
    const biz = getBusinessById(params.businessId);
    businessNombre = biz?.nombre;
  }

  const newTicket: SupportTicket = {
    id: `tk_${Date.now()}`,
    ticketNumero: ticketNum,
    autorId: actingUser.id,
    autorNombre: actingUser.nombre,
    autorRol: actingUser.role,
    businessId: params.businessId,
    businessNombre,
    categoria: params.categoria,
    titulo: params.titulo.trim(),
    descripcion: params.descripcion.trim(),
    estado: 'nuevo',
    mensajes: [
      {
        id: `msg_${Date.now()}`,
        autorId: actingUser.id,
        autorNombre: actingUser.nombre,
        autorRol: actingUser.role,
        mensaje: params.descripcion.trim(),
        fecha: now,
      },
    ],
    fechaCreacion: now,
    fechaActualizacion: now,
  };

  tickets.unshift(newTicket);
  set(STORAGE_KEYS.TICKETS, tickets);

  return { ticket: newTicket };
}

export function notifyTransferPayment(
  businessId: string,
  clienteId: string,
  monto: number,
  referencia: string,
  actingUser: User
): { success: boolean; error?: string } {
  const business = getBusinessById(businessId);
  if (!business) return { success: false, error: 'Negocio no encontrado.' };

  // Crear ticket/notificación de pago para el local
  createSupportTicket(
    {
      categoria: 'pago_saldo',
      titulo: `Comprobante de abono por transferencia bancaria (L ${monto.toFixed(2)})`,
      descripcion: `El cliente ${actingUser.nombre} (${actingUser.celular}) notificó un abono bancario de L ${monto.toFixed(2)} para su cuenta en "${business.nombre}". Referencia bancaria: ${referencia}.`,
      businessId,
    },
    actingUser
  );

  addAuditLog({
    usuarioId: actingUser.id,
    usuarioNombre: actingUser.nombre,
    rol: actingUser.role,
    accion: 'NOTIFICAR_ABONO',
    descripcion: `Cliente ${actingUser.nombre} reportó transferencia de L ${monto.toFixed(2)} (Ref: ${referencia}) para "${business.nombre}"`,
    entidadAfectada: `Transferencia cliente ${clienteId} en ${business.nombre}`,
  });

  return { success: true };
}

export function replySupportTicket(
  ticketId: string,
  mensaje: string,
  actingUser: User
): { success: boolean; error?: string } {
  const tickets = get<SupportTicket[]>(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
  const index = tickets.findIndex((t) => t.id === ticketId);
  if (index === -1) return { success: false, error: 'Ticket no encontrado.' };

  const ticket = tickets[index];

  // Comprobar si tiene acceso a este ticket
  if (actingUser.role === 'cliente' && ticket.autorId !== actingUser.id) {
    return { success: false, error: 'No autorizado para responder a este ticket.' };
  }
  if (actingUser.role === 'dueno') {
    const owned = getBusinessesForOwner(actingUser.id).map((b) => b.id);
    if (ticket.businessId && !owned.includes(ticket.businessId) && ticket.autorId !== actingUser.id) {
      return { success: false, error: 'No autorizado para este negocio.' };
    }
  }

  const now = new Date().toISOString();
  ticket.mensajes.push({
    id: `msg_${Date.now()}`,
    autorId: actingUser.id,
    autorNombre: actingUser.nombre,
    autorRol: actingUser.role,
    mensaje: mensaje.trim(),
    fecha: now,
  });

  // Si responde soporte (dueño o superadmin), pasa a 'en_atencion' si estaba 'nuevo'
  if (ticket.estado === 'nuevo' && (actingUser.role === 'superadmin' || actingUser.role === 'dueno')) {
    ticket.estado = 'en_atencion';
  }

  ticket.fechaActualizacion = now;
  tickets[index] = ticket;
  set(STORAGE_KEYS.TICKETS, tickets);

  return { success: true };
}

export function updateSupportTicketStatus(
  ticketId: string,
  newStatus: TicketStatus,
  actingUser: User
): boolean {
  if (actingUser.role !== 'superadmin' && actingUser.role !== 'dueno') {
    return false;
  }

  const tickets = get<SupportTicket[]>(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
  const index = tickets.findIndex((t) => t.id === ticketId);
  if (index === -1) return false;

  tickets[index].estado = newStatus;
  tickets[index].fechaActualizacion = new Date().toISOString();
  set(STORAGE_KEYS.TICKETS, tickets);

  addAuditLog({
    usuarioId: actingUser.id,
    usuarioNombre: actingUser.nombre,
    rol: actingUser.role,
    accion: 'CAMBIO_ESTADO_TICKET',
    descripcion: `Ticket ${tickets[index].ticketNumero} cambiado a estado "${newStatus}" por ${actingUser.nombre}`,
    entidadAfectada: ticketId,
  });

  return true;
}

// ==================== AUDIT LOGS ====================

export function addAuditLog(log: Omit<AuditLog, 'id' | 'fecha'>): void {
  const logs = get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  logs.unshift({
    ...log,
    id: `aud_${Date.now()}`,
    fecha: new Date().toISOString(),
  });
  set(STORAGE_KEYS.AUDIT_LOGS, logs);
}

export function getAuditLogs(actingUser: User): AuditLog[] {
  if (actingUser.role !== 'superadmin') return [];
  return get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
}
