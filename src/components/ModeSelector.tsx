import React from 'react';
import { WheelMode } from '../types';

interface ModeSelectorProps {
  currentMode: WheelMode;
  onSelectMode: (mode: WheelMode) => void;
  disabled?: boolean;
}

interface ModeItem {
  id: WheelMode;
  label: string;
  icon: string;
  tagline: string;
}

export const MODES: ModeItem[] = [
  { id: 'classic', label: 'Ruleta clásica', icon: '🎡', tagline: 'Cada giro elige a 1 ganador' },
  { id: 'elimination', label: 'Eliminación', icon: '❌', tagline: 'Elimina al elegido en cada giro' },
  { id: 'survival', label: 'Supervivencia', icon: '👑', tagline: 'Gana el último en pie' },
  { id: 'multiple-winners', label: 'Varios ganadores', icon: '🏆', tagline: 'Sortea varios ganadores' },
  { id: 'teams', label: 'Equipos', icon: '👥', tagline: 'Divide en grupos equilibrados' },
  { id: 'pairs', label: 'Parejas', icon: '👫', tagline: 'Empareja a todos los miembros' },
  { id: 'order', label: 'Orden aleatorio', icon: '🔀', tagline: 'Mezcla y clasifica listas' },
  { id: 'tournament', label: 'Torneo', icon: '⚔️', tagline: 'Duelos por eliminatorias' },
  { id: 'number', label: 'Número aleatorio', icon: '🔢', tagline: 'Generador de rangos mín - máx' },
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onSelectMode,
  disabled = false,
}) => {
  return (
    <div className="w-full">
      {/* Scrollable pill tabs */}
      <div
        id="mode-selector-bar"
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-1 border-b border-neutral-100"
      >
        {MODES.map((m) => {
          const isActive = currentMode === m.id;
          return (
            <button
              key={m.id}
              id={`mode-tab-${m.id}`}
              type="button"
              disabled={disabled}
              onClick={() => onSelectMode(m.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100/80 border border-neutral-200/70'
              }`}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
