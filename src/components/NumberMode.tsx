import React, { useState } from 'react';
import { Participant } from '../types';
import { getCryptoRandomInt } from '../utils/random';
import { WheelCanvas } from './WheelCanvas';
import { Hash, Sparkles, Play, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

export const NumberMode: React.FC = () => {
  const [min, setMin] = useState<number>(1);
  const [max, setMax] = useState<number>(10);
  const [result, setResult] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [useWheel, setUseWheel] = useState<boolean>(false);
  const [pendingWinner, setPendingWinner] = useState<{ winner: Participant; index: number } | null>(null);

  // Generate virtual participants for the wheel from range
  const count = Math.max(1, max - min + 1);
  const wheelParticipants: Participant[] = Array.from({ length: Math.min(50, count) }, (_, i) => ({
    id: `num-${min + i}`,
    name: `${min + i}`,
    weight: 1,
  }));

  const handlePickInstant = () => {
    const val = getCryptoRandomInt(min, max);
    setResult(val);
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.65 },
      colors: ['#4f46e5', '#06b6d4', '#10b981'],
    });
  };

  const handleStartSpin = () => {
    if (isSpinning) return;
    const winningNum = getCryptoRandomInt(min, min + wheelParticipants.length - 1);
    const winIndex = wheelParticipants.findIndex((p) => p.name === `${winningNum}`);
    if (winIndex !== -1) {
      setPendingWinner({ winner: wheelParticipants[winIndex], index: winIndex });
      setIsSpinning(true);
    }
  };

  const handleSpinComplete = (winner: Participant) => {
    setIsSpinning(false);
    setPendingWinner(null);
    setResult(parseInt(winner.name, 10));
  };

  return (
    <div id="number-mode-container" className="w-full flex flex-col gap-6">
      {/* Control bar */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-500">Mín:</span>
            <input
              type="number"
              value={min}
              onChange={(e) => setMin(parseInt(e.target.value) || 0)}
              className="w-16 px-2.5 py-1.5 text-xs font-bold border border-neutral-200 rounded-lg text-center"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-500">Máx:</span>
            <input
              type="number"
              value={max}
              onChange={(e) => setMax(Math.max(min, parseInt(e.target.value) || min + 1))}
              className="w-16 px-2.5 py-1.5 text-xs font-bold border border-neutral-200 rounded-lg text-center"
            />
          </div>

          <div className="flex items-center gap-1.5 ml-2">
            {[[1, 6, 'Dado (1-6)'], [1, 10, '1-10'], [1, 100, '1-100']].map(([sMin, sMax, label]) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setMin(sMin as number);
                  setMax(sMax as number);
                }}
                className="px-2.5 py-1 text-2xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setUseWheel(!useWheel)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              useWheel ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-neutral-200 text-neutral-600'
            }`}
          >
            {useWheel ? 'Ocultar ruleta' : 'Mostrar ruleta'}
          </button>

          <button
            type="button"
            id="generate-number-instant-btn"
            onClick={handlePickInstant}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Generar número</span>
          </button>
        </div>
      </div>

      {useWheel ? (
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs flex flex-col items-center">
          <div className="text-center mb-4">
            <h4 className="text-base font-bold text-neutral-900">
              Ruleta de números aleatorios ({min} a {min + wheelParticipants.length - 1})
            </h4>
          </div>
          <WheelCanvas
            participants={wheelParticipants}
            isSpinning={isSpinning}
            onSpinStart={handleStartSpin}
            onSpinComplete={handleSpinComplete}
            winnerToSelect={pendingWinner}
          />
        </div>
      ) : null}

      {/* Result Display */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-8 shadow-xs flex flex-col items-center justify-center text-center min-h-[180px]">
        {result !== null ? (
          <div className="flex flex-col items-center gap-2 animate-in zoom-in-95 duration-200">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Número seleccionado
            </span>
            <div className="text-6xl sm:text-7xl font-extrabold text-neutral-900 font-mono tracking-tight">
              {result}
            </div>
            <button
              type="button"
              onClick={handlePickInstant}
              className="mt-4 px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Generar otro</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-neutral-400">
            <Hash className="w-8 h-8 text-neutral-300" />
            <p className="text-sm font-medium">
              ¡Haz clic en &quot;Generar número&quot; para elegir un valor aleatorio entre {min} y {max}!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
