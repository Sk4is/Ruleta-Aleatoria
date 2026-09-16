import React, { useState } from 'react';
import { Participant } from '../types';
import { cryptoShuffle, selectRandomWinner } from '../utils/random';
import { WheelCanvas } from './WheelCanvas';
import { Trophy, Sparkles, Play, Copy, Check, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MultipleWinnersModeProps {
  participants: Participant[];
}

export const MultipleWinnersMode: React.FC<MultipleWinnersModeProps> = ({
  participants,
}) => {
  const [winnerCount, setWinnerCount] = useState<number>(3);
  const [winners, setWinners] = useState<Participant[]>([]);
  const [isWheelDrawing, setIsWheelDrawing] = useState<boolean>(false);
  const [availableForWheel, setAvailableForWheel] = useState<Participant[]>([]);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [pendingSpinWinner, setPendingSpinWinner] = useState<{ winner: Participant; index: number } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const maxPossible = Math.max(1, participants.length);
  const targetCount = Math.min(winnerCount, maxPossible);

  const handlePickInstantly = () => {
    if (participants.length === 0) return;
    const shuffled = cryptoShuffle(participants);
    const selected = shuffled.slice(0, targetCount);
    setWinners(selected);
    setIsWheelDrawing(false);

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#ec4899', '#4f46e5', '#10b981'],
    });
  };

  const handleStartWheelDraw = () => {
    if (participants.length === 0) return;
    setWinners([]);
    setAvailableForWheel([...participants]);
    setIsWheelDrawing(true);
  };

  const handleSpinNextWinner = () => {
    if (isSpinning || availableForWheel.length === 0 || winners.length >= targetCount) return;
    const selection = selectRandomWinner(availableForWheel);
    setPendingSpinWinner(selection);
    setIsSpinning(true);
  };

  const handleWheelComplete = (winner: Participant) => {
    setIsSpinning(false);
    setPendingSpinWinner(null);

    setWinners((prev) => [...prev, winner]);
    setAvailableForWheel((prev) => prev.filter((p) => p.id !== winner.id));

    confetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.65 },
      colors: ['#f59e0b', '#4f46e5', '#10b981'],
    });
  };

  const handleCopyWinners = () => {
    const text = winners.map((w, i) => `${i + 1}. ${w.name}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="multiple-winners-container" className="w-full flex flex-col gap-6">
      {/* Control bar */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-neutral-500">Número de ganadores:</span>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setWinnerCount(num)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  winnerCount === num
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-50 border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {num}
              </button>
            ))}
            <div className="flex items-center gap-1 ml-1">
              <span className="text-xs text-neutral-400">Personalizado:</span>
              <input
                type="number"
                min={1}
                max={participants.length}
                value={winnerCount}
                onChange={(e) => setWinnerCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-14 px-2 py-1 text-xs border border-neutral-200 rounded-lg text-center font-bold"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="pick-winners-instant-btn"
            disabled={participants.length === 0}
            onClick={handlePickInstantly}
            className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-40"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Elegir al instante</span>
          </button>

          <button
            type="button"
            id="pick-winners-wheel-btn"
            disabled={participants.length === 0}
            onClick={handleStartWheelDraw}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-40"
          >
            <Play className="w-4 h-4" />
            <span>Girar uno a uno</span>
          </button>
        </div>
      </div>

      {/* Wheel sequential drawing mode */}
      {isWheelDrawing ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 flex flex-col items-center bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs">
            <div className="w-full flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <span className="text-sm font-bold text-neutral-900">
                Sorteando ganador #{winners.length + 1} de {targetCount}
              </span>
              <span className="text-xs font-semibold text-neutral-500">
                {availableForWheel.length} disponibles
              </span>
            </div>

            {winners.length < targetCount && availableForWheel.length > 0 ? (
              <WheelCanvas
                participants={availableForWheel}
                isSpinning={isSpinning}
                onSpinStart={handleSpinNextWinner}
                onSpinComplete={handleWheelComplete}
                winnerToSelect={pendingSpinWinner}
              />
            ) : (
              <div className="py-16 text-center flex flex-col items-center gap-3">
                <span className="text-4xl">👑</span>
                <h3 className="text-lg font-bold text-neutral-800">
                  ¡Todos los {targetCount} ganadores sorteados!
                </h3>
                <button
                  type="button"
                  onClick={handleStartWheelDraw}
                  className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Sortear de nuevo</span>
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900">
                Ganadores ({winners.length}/{targetCount})
              </h3>
              {winners.length > 0 && (
                <button
                  type="button"
                  onClick={handleCopyWinners}
                  className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {Array.from({ length: targetCount }, (_, i) => {
                const w = winners[i];
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                      w
                        ? 'bg-amber-50/50 border-amber-200 text-amber-950 font-bold'
                        : 'bg-white border-neutral-200/80 text-neutral-400 italic font-normal'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-xs font-mono font-bold text-neutral-700 shadow-xs">
                      {i + 1}
                    </span>
                    <span className="text-sm truncate">
                      {w ? `🎉 ${w.name}` : 'Esperando siguiente giro...'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Instant winners display */
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-neutral-900">
                Ganadores seleccionados {winners.length > 0 && `(${winners.length})`}
              </h3>
            </div>

            {winners.length > 0 && (
              <button
                type="button"
                id="copy-winners-btn"
                onClick={handleCopyWinners}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 flex items-center gap-1.5 cursor-pointer text-neutral-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Ganadores copiados!' : 'Copiar ganadores'}</span>
              </button>
            )}
          </div>

          {winners.length === 0 ? (
            <div className="py-14 text-center bg-white rounded-2xl border border-dashed border-neutral-300 p-8 flex flex-col items-center justify-center gap-2">
              <Trophy className="w-8 h-8 text-neutral-300" />
              <p className="text-sm font-medium text-neutral-600">
                Elige {targetCount} ganador{targetCount === 1 ? '' : 'es'} usando &quot;Elegir al instante&quot; o &quot;Girar uno a uno&quot;.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {winners.map((winner, idx) => (
                <div
                  key={winner.id}
                  className="bg-white rounded-2xl border border-amber-200/80 p-4 shadow-xs flex items-center gap-3 bg-gradient-to-r from-amber-50/40 to-white"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold font-mono">
                    #{idx + 1}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                      Ganador {idx + 1}
                    </p>
                    <p className="text-base font-bold text-neutral-900 truncate">
                      {winner.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
