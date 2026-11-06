import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface SecretVisibilityToggleProps {
  visible: boolean;
  onToggle: () => void;
  label: string;
}

export const SecretVisibilityToggle: React.FC<SecretVisibilityToggleProps> = ({
  visible,
  onToggle,
  label,
}) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${label}`}
    aria-pressed={visible}
    title={`${visible ? 'Ocultar' : 'Mostrar'} ${label}`}
    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-stone-500 transition-colors hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
  >
    {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
  </button>
);
