import React, { useState } from 'react';
import { Volume2, VolumeX, Share2, Trash2, Check, Sparkles } from 'lucide-react';
import { soundFx } from '../utils/audio';
import { clearAllLocalData } from '../utils/storage';

interface HeaderProps {
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
  onShare: () => void;
  onResetAll: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  soundEnabled,
  onToggleSound,
  onShare,
  onResetAll,
}) => {
  const [copiedShare, setCopiedShare] = useState(false);

  const handleShareClick = () => {
    onShare();
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const handleResetClick = () => {
    if (confirm('¿Restablecer participantes y borrar los datos guardados localmente?')) {
      clearAllLocalData();
      onResetAll();
    }
  };

  return (
    <header
      id="app-header"
      className="w-full bg-white/85 backdrop-blur-md border-b border-neutral-200/80 sticky top-0 z-30 transition-all"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5 select-none">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <span className="text-lg">🎡</span>
          </div>
          <div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-neutral-900 font-sans block leading-none">
              Ruleta Aleatoria
            </span>
            <span className="text-2xs font-semibold text-neutral-400 uppercase tracking-wider block mt-0.5">
              Sorteos y decisiones
            </span>
          </div>
        </div>

        {/* Right utility actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sound Toggle */}
          <button
            type="button"
            id="sound-toggle-btn"
            onClick={() => onToggleSound(!soundEnabled)}
            aria-label={soundEnabled ? 'Silenciar efectos de sonido' : 'Activar efectos de sonido'}
            title={soundEnabled ? 'Silenciar sonido' : 'Activar sonido'}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-neutral-200/80 hover:bg-neutral-50 text-neutral-600 transition-colors text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Sonido</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-neutral-400" />
                <span className="hidden sm:inline text-neutral-400">Silenciado</span>
              </>
            )}
          </button>

          {/* Share Wheel */}
          <button
            type="button"
            id="share-wheel-btn"
            onClick={handleShareClick}
            title="Copiar enlace compartible"
            className="p-2 sm:px-3.5 sm:py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white transition-all text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
          >
            {copiedShare ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>¡Enlace copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Compartir</span>
              </>
            )}
          </button>

          {/* Reset button */}
          <button
            type="button"
            id="reset-all-btn"
            onClick={handleResetClick}
            title="Restablecer datos locales"
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
            aria-label="Restablecer datos locales"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
