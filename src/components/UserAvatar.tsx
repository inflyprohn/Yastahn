import React from 'react';
import { UserRole } from '../types';

interface UserAvatarProps {
  nombre: string;
  avatarUrl?: string | null;
  role?: UserRole;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  nombre,
  avatarUrl,
  role,
  size = 'md',
  className = '',
  onClick,
}) => {
  const getInitials = (nameStr: string) => {
    if (!nameStr) return 'Y';
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base font-semibold',
    xl: 'w-20 h-20 text-2xl font-bold',
  }[size];

  // Colores sutiles por rol según la constitución de diseño
  const roleBg = {
    cliente: 'bg-amber-100 text-amber-900 border-amber-200',
    dueno: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    superadmin: 'bg-stone-200 text-stone-900 border-stone-300',
  }[role || 'cliente'];

  if (avatarUrl) {
    return (
      <div
        onClick={onClick}
        className={`relative inline-block rounded-full overflow-hidden shrink-0 border border-stone-200 shadow-xs ${sizeClasses} ${
          onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''
        } ${className}`}
        title={nombre}
      >
        <img
          src={avatarUrl}
          alt={`Foto de ${nombre}`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full font-medium shrink-0 border shadow-xs select-none ${roleBg} ${sizeClasses} ${
        onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''
      } ${className}`}
      title={nombre}
    >
      {getInitials(nombre)}
    </div>
  );
};
