import React, { useState } from 'react';
import { ShieldAlert, RotateCcw, UserCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { User, UserRole } from '../types';
import { getAllUsers, setCurrentUser, initializeStorage } from '../services/storage';

interface DemoBannerProps {
  currentUser: User | null;
  onUserChanged: (user: User | null) => void;
  onNavigate: (route: string) => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  currentUser,
  onUserChanged,
  onNavigate,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const users = getAllUsers();

  const handleSelectRole = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      onUserChanged(target);
      // Navegación contextual conveniente
      if (target.role === 'cliente') onNavigate('/cliente');
      else if (target.role === 'dueno') onNavigate('/dueno');
      else if (target.role === 'superadmin') onNavigate('/superadmin');
    }
  };

  const handleResetData = () => {
    if (window.confirm('¿Desea restablecer todos los datos de prueba a su estado inicial? Se reiniciarán pedidos, saldos y tickets.')) {
      initializeStorage(true);
      window.location.reload();
    }
  };

  return (
    <aside aria-label="Aviso de demostración" className="bg-amber-950 text-amber-50 text-xs border-b border-amber-900/60 no-print">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-medium text-[11px] sm:text-xs">
            <strong>Credenciales demo activas</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Selector rápido de perfiles de prueba */}
          <div className="flex items-center gap-1.5 bg-amber-900/60 rounded-lg p-1 border border-amber-800">
            <span className="text-[11px] text-amber-200 pl-1.5 hidden md:inline">Probar como:</span>
            <button
              onClick={() => handleSelectRole('usr_carlos')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                currentUser?.id === 'usr_carlos'
                  ? 'bg-amber-400 text-stone-950 shadow-xs'
                  : 'text-amber-100 hover:text-white hover:bg-amber-800'
              }`}
              title="Cliente en Café Copán y Comedor Suyapa (con saldo y fin de mes)"
            >
              Carlos (Cliente)
            </button>
            <button
              onClick={() => handleSelectRole('usr_elena')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                currentUser?.id === 'usr_elena'
                  ? 'bg-amber-400 text-stone-950 shadow-xs'
                  : 'text-amber-100 hover:text-white hover:bg-amber-800'
              }`}
              title="Dueña de Café Copán y Baleadas El Progreso"
            >
              Elena (Dueña)
            </button>
            <button
              onClick={() => handleSelectRole('usr_superadmin')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                currentUser?.id === 'usr_superadmin'
                  ? 'bg-amber-400 text-stone-950 shadow-xs'
                  : 'text-amber-100 hover:text-white hover:bg-amber-800'
              }`}
              title="Superadministrador de plataforma"
            >
              Roberto (Superadmin)
            </button>
          </div>

          <button
            onClick={handleResetData}
            title="Restablecer base de datos demo"
            className="p-1 rounded text-amber-300 hover:text-white hover:bg-amber-900 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title="Ver credenciales de acceso"
            className="p-1 rounded text-amber-300 hover:text-white hover:bg-amber-900 text-[11px] flex items-center gap-0.5"
          >
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-amber-900/90 border-t border-amber-800 px-4 py-2.5 text-[11px] text-amber-100">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-bold text-white">Credenciales demo:</span>
              <span><strong>Cliente:</strong> +504 9555-1234 · PIN: 1234</span>
              <span className="text-amber-400/50">|</span>
              <span><strong>Dueña:</strong> dueno@yasta.hn · Copan2026!</span>
              <span className="text-amber-400/50">|</span>
              <span><strong>Superadmin:</strong> admin@yasta.hn · YastaSuper2026!</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
