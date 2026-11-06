import {
  Business,
  ClientBusinessAccount,
  FinancialMovement,
  MenuItem,
  Order,
  SupportTicket,
  User,
  AuditLog,
} from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_carlos',
    nombre: 'Carlos Mejía',
    celular: '+504 9555-1234',
    role: 'cliente',
    pin: '1234',
    avatarUrl: null,
    createdAt: '2026-10-15T08:30:00Z',
  },
  {
    id: 'usr_kenia',
    nombre: 'Kenia Aguilar',
    celular: '+504 9444-5678',
    role: 'cliente',
    pin: '5678',
    avatarUrl: null,
    createdAt: '2026-10-20T10:15:00Z',
  },
  {
    id: 'usr_elena',
    nombre: 'Doña Elena Romero',
    email: 'dueno@yasta.hn',
    celular: '+504 9876-1234',
    role: 'dueno',
    password: 'Copan2026!',
    ownedBusinessIds: [],
    avatarUrl: null,
    createdAt: '2026-09-01T07:00:00Z',
  },
  {
    id: 'usr_mario',
    nombre: 'Don Mario Villeda',
    email: 'mario@suyapa.hn',
    celular: '+504 9432-5678',
    role: 'dueno',
    password: 'Suyapa2026!',
    ownedBusinessIds: [],
    avatarUrl: null,
    createdAt: '2026-09-10T09:00:00Z',
  },
  {
    id: 'usr_superadmin',
    nombre: 'Lic. Roberto Paz',
    email: 'admin@yasta.hn',
    celular: '+504 9900-1122',
    role: 'superadmin',
    password: 'YastaSuper2026!',
    avatarUrl: null,
    createdAt: '2026-08-01T00:00:00Z',
  },
];

export const INITIAL_BUSINESSES: Business[] = [];

export const INITIAL_MENU_ITEMS: MenuItem[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_ACCOUNTS: ClientBusinessAccount[] = [];

export const INITIAL_MOVEMENTS: FinancialMovement[] = [];

export const INITIAL_TICKETS: SupportTicket[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
