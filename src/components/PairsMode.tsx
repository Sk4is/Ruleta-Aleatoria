import React, { useState } from 'react';
import { Participant, Pair } from '../types';
import { generatePairs, selectRandomWinner } from '../utils/random';
import { WheelCanvas } from './WheelCanvas';
import { UserCheck, Copy, Check, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PairsModeProps {
  participants: Participant[];
}

export const PairsMode: React.FC<PairsModeProps> = ({ participants }) => {
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [unpaired, setUnpaired] = useState<Participant | null>(null);
  const [oddOption, setOddOption] = useState<'groupOfThree' | 'leaveUnpaired' | 'spinDecide'>('groupOfThree');
  const [copied, setCopied] = useState<boolean>(false);

  // Wheel state if oddOption === 'spinDecide'
  const [showWheelForOdd, setShowWheelForOdd] = useState<boolean>(false);
  const [isSpinningOdd, setIsSpinningOdd] = useState<boolean>(false);
  const [oddWinner, setOddWinner] = useState<{ winner: Participant; index: number } | null>(null);

  const isOdd = participants.length % 2 !== 0 && participants.length > 0;

  const handleGeneratePairs = () => {
    if (participants.length < 2) return;

    if (isOdd && oddOption === 'spinDecide') {
      setShowWheelForOdd(true);
      return;
    }

    const { pairs: generatedPairs, unpaired: genUnpaired } = generatePairs(
      participants,
      oddOption === 'groupOfThree' ? 'groupOfThree' : 'leaveUnpaired'
    );

    setPairs(generatedPairs);
    setUnpaired(genUnpaired);
    setShowWheelForOdd(false);

    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.7 },
      colors: ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981'],
    });
  };

  const handleSpinOddWheel = () => {
    if (isSpinningOdd || participants.length === 0) return;
    const selection = selectRandomWinner(participants);
    setOddWinner(selection);
    setIsSpinningOdd(true);
  };

  const handleOddWheelComplete = (chosenUnpaired: Participant) => {
    setIsSpinningOdd(false);
    setOddWinner(null);
    setShowWheelForOdd(false);

    // Remaining participants paired
    const remainingToPair = participants.filter((p) => p.id !== chosenUnpaired.id);
    const { pairs: generatedPairs } = generatePairs(remainingToPair, 'leaveUnpaired');

    setPairs(generatedPairs);
    setUnpaired(chosenUnpaired);

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#4f46e5', '#f59e0b', '#10b981'],
    });
  };

  const handleCopyPairs = () => {
    const lines = pairs.map(
      (p) => `Pareja ${p.pairNumber}: ${p.member1.name} & ${p.member2.name}${p.member3 ? ` & ${p.member3.name}` : ''}`
    );
    if (unpaired) {
      lines.push(`Sin pareja: ${unpaired.name}`);
    }
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="pairs-mode-container" className="w-full flex flex-col gap-6">
      {/* Configuration bar */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Odd count handling options if odd */}
          {isOdd && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-500">Manejo de participantes impares:</span>
              <div className="flex items-center rounded-xl bg-neutral-100 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setOddOption('groupOfThree')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    oddOption === 'groupOfThree' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500'
                  }`}
                >
                  Grupo de 3
                </button>
                <button
                  type="button"
                  onClick={() => setOddOption('leaveUnpaired')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    oddOption === 'leaveUnpaired' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500'
                  }`}
                >
                  Dejar 1 sin pareja
                </button>
                <button
                  type="button"
                  onClick={() => setOddOption('spinDecide')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    oddOption === 'spinDecide' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500'
                  }`}
                >
                  🎡 Girar para decidir
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          id="create-pairs-btn"
          disabled={participants.length < 2}
          onClick={handleGeneratePairs}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-40"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Crear parejas</span>
        </button>
      </div>

      {/* Wheel Modal / Drawer for spin to decide who is unpaired */}
      {showWheelForOdd && (
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-sm flex flex-col items-center">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-neutral-900">
              Gira para decidir quién se queda sin pareja
            </h3>
            <p className="text-xs text-neutral-500">
              La ruleta seleccionará a 1 persona para descansar; ¡todos los demás formarán parejas!
            </p>
          </div>
          <WheelCanvas
            participants={participants}
            isSpinning={isSpinningOdd}
            onSpinStart={handleSpinOddWheel}
            onSpinComplete={handleOddWheelComplete}
            winnerToSelect={oddWinner}
          />
        </div>
      )}

      {/* Pairs Display */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-neutral-700" />
            <h3 className="text-base font-bold text-neutral-900">
              Parejas generadas {pairs.length > 0 && `(${pairs.length})`}
            </h3>
          </div>

          {pairs.length > 0 && (
            <button
              type="button"
              id="copy-pairs-btn"
              onClick={handleCopyPairs}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 flex items-center gap-1.5 cursor-pointer text-neutral-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '¡Parejas copiadas!' : 'Copiar parejas'}</span>
            </button>
          )}
        </div>

        {pairs.length === 0 ? (
          <div className="py-14 text-center bg-white rounded-2xl border border-dashed border-neutral-300 p-8 flex flex-col items-center justify-center gap-2">
            <UserCheck className="w-8 h-8 text-neutral-300" />
            <p className="text-sm font-medium text-neutral-600">
              Haz clic en &quot;Crear parejas&quot; para emparejar al azar a los {participants.length} participantes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pairs.map((pair) => (
              <div
                key={pair.id}
                className="bg-white rounded-2xl border border-neutral-200/80 p-4 shadow-xs flex flex-col gap-2.5 transition-all hover:border-neutral-300"
              >
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 text-xs font-bold text-neutral-400">
                  <span>PAREJA {pair.pairNumber}</span>
                  {pair.member3 && (
                    <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-semibold">
                      Trío
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800 bg-neutral-50 px-3 py-2 rounded-xl">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>{pair.member1.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800 bg-neutral-50 px-3 py-2 rounded-xl">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    <span>{pair.member2.name}</span>
                  </div>
                  {pair.member3 && (
                    <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800 bg-indigo-50/60 px-3 py-2 rounded-xl border border-indigo-100">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      <span>{pair.member3.name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {unpaired && (
              <div className="bg-amber-50/50 rounded-2xl border border-amber-200 p-4 shadow-xs flex flex-col gap-2 justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Participante sin pareja
                </span>
                <p className="text-base font-bold text-amber-900">{unpaired.name}</p>
                <p className="text-xs text-amber-700">Miembro impar que descansa en esta ronda.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
