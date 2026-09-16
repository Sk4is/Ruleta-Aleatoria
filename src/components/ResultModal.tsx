import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Participant, WheelMode } from '../types';
import { RotateCw, UserMinus, Share2, X, Trophy } from 'lucide-react';

interface ResultModalProps {
  winner: Participant | null;
  mode: WheelMode;
  onClose: () => void;
  onSpinAgain: () => void;
  onRemoveWinnerAndSpin: () => void;
  onShareResult?: () => void;
  remainingCount?: number;
  customBadge?: string;
  customHeading?: string;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  winner,
  mode,
  onClose,
  onSpinAgain,
  onRemoveWinnerAndSpin,
  onShareResult,
  remainingCount,
  customBadge,
  customHeading,
}) => {
  useEffect(() => {
    if (winner) {
      // Fire a tasteful, controlled micro-confetti burst (NOT covering the full screen)
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.62 },
        colors: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'],
        disableForReducedMotion: true,
        ticks: 150,
      });
    }
  }, [winner]);

  if (!winner) return null;

  const isEliminationOrSurvival = mode === 'elimination' || mode === 'survival';

  return (
    <div
      id="result-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/30 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="winner-title"
    >
      <div
        id="result-modal-card"
        className="relative w-full max-w-sm bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-neutral-100 flex flex-col items-center text-center transform transition-all animate-in zoom-in-95 duration-200"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ventana de resultado"
          className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Trophy icon */}
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
          <Trophy className="w-6 h-6" />
        </div>

        {/* Heading */}
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
          {customBadge || (mode === 'survival' ? '¡Superviviente!' : '¡Ganador!')}
        </span>

        {/* Winner Name */}
        <h2
          id="winner-title"
          className="text-2xl sm:text-3xl font-extrabold text-neutral-900 break-words max-w-full px-2 leading-tight"
        >
          {customHeading || `🎉 ${winner.name}`}
        </h2>

        {remainingCount !== undefined && remainingCount > 0 && (
          <p className="text-xs text-neutral-500 mt-2 font-medium">
            {remainingCount} participante{remainingCount === 1 ? '' : 's'} restante{remainingCount === 1 ? '' : 's'}
          </p>
        )}

        {/* Actions Buttons */}
        <div className="w-full flex flex-col gap-2.5 mt-6">
          <button
            type="button"
            id="spin-again-btn"
            onClick={onSpinAgain}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <RotateCw className="w-4 h-4" />
            <span>Girar de nuevo</span>
          </button>

          <button
            type="button"
            id="remove-winner-spin-btn"
            onClick={onRemoveWinnerAndSpin}
            className="w-full py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserMinus className="w-4 h-4 text-neutral-500" />
            <span>Eliminar «{winner.name}» y girar</span>
          </button>

          {onShareResult && (
            <button
              type="button"
              id="share-result-btn"
              onClick={onShareResult}
              className="w-full py-2 px-4 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartir resultado</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
