import React, { useState, useEffect } from 'react';
import { Participant } from '../types';
import { cryptoShuffle } from '../utils/random';
import { Shuffle, Copy, Check, ArrowUpDown } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RandomOrderModeProps {
  participants: Participant[];
}

export const RandomOrderMode: React.FC<RandomOrderModeProps> = ({ participants }) => {
  const [orderedList, setOrderedList] = useState<Participant[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);

  useEffect(() => {
    setOrderedList(participants);
  }, [participants]);

  const handleShuffle = () => {
    if (participants.length === 0) return;
    setIsShuffling(true);

    setTimeout(() => {
      const shuffled = cryptoShuffle(participants);
      setOrderedList(shuffled);
      setIsShuffling(false);

      confetti({
        particleCount: 25,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b'],
      });
    }, 200);
  };

  const handleCopyOrder = () => {
    const text = orderedList.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="random-order-container" className="w-full flex flex-col gap-6">
      {/* Action Header */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-base font-bold text-neutral-900">Orden aleatorio / Clasificación</h3>
            <p className="text-xs text-neutral-500">
              Ordena de forma aleatoria y justa {orderedList.length} elementos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="copy-order-btn"
            disabled={orderedList.length === 0}
            onClick={handleCopyOrder}
            className="px-4 py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-40"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '¡Orden copiado!' : 'Copiar orden'}</span>
          </button>

          <button
            type="button"
            id="shuffle-order-btn"
            disabled={orderedList.length < 2 || isShuffling}
            onClick={handleShuffle}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-40 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
            <span>Mezclar de nuevo</span>
          </button>
        </div>
      </div>

      {/* Ordered list visual display */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs flex flex-col gap-2">
        {orderedList.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 text-sm">
            ¡Añade participantes en el editor para generar un orden aleatorio!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {orderedList.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3.5 rounded-2xl border border-neutral-200/70 bg-white hover:border-neutral-300 transition-all shadow-2xs hover:shadow-xs group"
              >
                <span
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-mono font-bold ${
                    index === 0
                      ? 'bg-amber-100 text-amber-800'
                      : index === 1
                      ? 'bg-slate-200 text-slate-800'
                      : index === 2
                      ? 'bg-amber-700/20 text-amber-900'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {index + 1}
                </span>

                <span className="font-semibold text-neutral-800 text-sm truncate flex-1">
                  {item.name}
                </span>

                {index === 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    1.º
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
