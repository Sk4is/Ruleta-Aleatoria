import React, { useState, useEffect } from 'react';
import { Participant, TournamentMatch } from '../types';
import { generateTournamentBracket } from '../utils/random';
import { WheelCanvas } from './WheelCanvas';
import { Swords, Trophy, RotateCcw, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TournamentModeProps {
  participants: Participant[];
}

export const TournamentMode: React.FC<TournamentModeProps> = ({ participants }) => {
  const [rounds, setRounds] = useState<TournamentMatch[][]>([]);
  const [activeWheelMatch, setActiveWheelMatch] = useState<TournamentMatch | null>(null);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [pendingWinner, setPendingWinner] = useState<{ winner: Participant; index: number } | null>(null);

  useEffect(() => {
    if (participants.length >= 2) {
      const initialRounds = generateTournamentBracket(participants);
      setRounds(initialRounds);
    } else {
      setRounds([]);
    }
  }, [participants]);

  const handleResetTournament = () => {
    const fresh = generateTournamentBracket(participants);
    setRounds(fresh);
    setActiveWheelMatch(null);
  };

  const handleSelectWinner = (roundIndex: number, matchIndex: number, winner: Participant) => {
    setRounds((prevRounds) => {
      const copy = prevRounds.map((r) => r.map((m) => ({ ...m })));
      const currentMatch = copy[roundIndex][matchIndex];
      currentMatch.winner = winner;

      // If there is a next round, advance the winner into it
      if (roundIndex + 1 < copy.length) {
        const nextRoundMatchIndex = Math.floor(matchIndex / 2);
        const isPlayer1Slot = matchIndex % 2 === 0;
        const targetNextMatch = copy[roundIndex + 1][nextRoundMatchIndex];

        if (targetNextMatch) {
          if (isPlayer1Slot) {
            targetNextMatch.player1 = winner;
          } else {
            targetNextMatch.player2 = winner;
          }
          // If the next match had a previous winner that is now invalid, clear it
          if (targetNextMatch.winner && targetNextMatch.winner.id !== winner.id) {
            targetNextMatch.winner = null;
          }
        }
      } else {
        // Final match won! Champion decided!
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.55 },
          colors: ['#f59e0b', '#4f46e5', '#10b981', '#ec4899'],
        });
      }

      return copy;
    });

    if (activeWheelMatch) {
      setActiveWheelMatch(null);
    }
  };

  const handleOpenWheelForMatch = (match: TournamentMatch) => {
    if (!match.player1 || !match.player2 || match.winner) return;
    setActiveWheelMatch(match);
  };

  const handleSpinMatch = () => {
    if (!activeWheelMatch || !activeWheelMatch.player1 || !activeWheelMatch.player2 || isSpinning) return;
    const combatants = [activeWheelMatch.player1, activeWheelMatch.player2];
    const randomIndex = Math.random() < 0.5 ? 0 : 1;
    setPendingWinner({ winner: combatants[randomIndex], index: randomIndex });
    setIsSpinning(true);
  };

  const handleWheelDecided = (winner: Participant) => {
    setIsSpinning(false);
    setPendingWinner(null);
    if (!activeWheelMatch) return;

    handleSelectWinner(activeWheelMatch.round - 1, activeWheelMatch.matchIndex, winner);
  };

  // Check if champion has won
  const finalRound = rounds[rounds.length - 1];
  const champion = finalRound && finalRound[0]?.winner ? finalRound[0].winner : null;

  return (
    <div id="tournament-mode-container" className="w-full flex flex-col gap-6">
      {/* Action bar */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Swords className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-base font-bold text-neutral-900">Cuadro de eliminación directa</h3>
            <p className="text-xs text-neutral-500">
              {participants.length} participantes • ¡Haz clic en un participante para avanzar o gira la ruleta!
            </p>
          </div>
        </div>

        <button
          type="button"
          id="reshuffle-tournament-btn"
          disabled={participants.length < 2}
          onClick={handleResetTournament}
          className="px-4 py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-40"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Nuevos emparejamientos</span>
        </button>
      </div>

      {/* Wheel Decider Modal */}
      {activeWheelMatch && activeWheelMatch.player1 && activeWheelMatch.player2 && (
        <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-md flex flex-col items-center">
          <div className="text-center mb-4">
            <h4 className="text-base font-bold text-neutral-900">
              Decidiendo: {activeWheelMatch.player1.name} vs {activeWheelMatch.player2.name}
            </h4>
            <p className="text-xs text-neutral-500">¡Gira la ruleta para determinar quién avanza!</p>
          </div>
          <WheelCanvas
            participants={[activeWheelMatch.player1, activeWheelMatch.player2]}
            isSpinning={isSpinning}
            onSpinStart={handleSpinMatch}
            onSpinComplete={handleWheelDecided}
            winnerToSelect={pendingWinner}
          />
        </div>
      )}

      {/* Champion Banner */}
      {champion && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Campeón del torneo
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900">
                🏆 {champion.name}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetTournament}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
          >
            Jugar de nuevo
          </button>
        </div>
      )}

      {/* Bracket Visual Representation */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs overflow-x-auto">
        {rounds.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 text-sm">
            ¡Añade al menos 2 participantes para generar el cuadro del torneo!
          </div>
        ) : (
          <div className="flex gap-8 sm:gap-12 min-w-max py-4">
            {rounds.map((roundMatches, roundIdx) => {
              const isLastRound = roundIdx === rounds.length - 1;
              const roundTitle = isLastRound
                ? 'Gran Final'
                : roundIdx === rounds.length - 2
                ? 'Semifinales'
                : `Ronda ${roundIdx + 1}`;

              return (
                <div key={roundIdx} className="flex flex-col flex-1 min-w-[200px]">
                  <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 pb-3 mb-4 border-b border-neutral-100 text-center">
                    {roundTitle}
                  </div>

                  <div className="flex flex-col justify-around flex-1 gap-6">
                    {roundMatches.map((match, mIdx) => {
                      const p1 = match.player1;
                      const p2 = match.player2;
                      const hasBoth = p1 && p2;

                      return (
                        <div
                          key={match.id}
                          className="bg-white rounded-2xl border border-neutral-200 p-3 shadow-xs flex flex-col gap-2 relative group hover:border-neutral-300"
                        >
                          {/* Player 1 */}
                          <button
                            type="button"
                            disabled={!p1 || Boolean(match.winner)}
                            onClick={() => p1 && handleSelectWinner(roundIdx, mIdx, p1)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between transition-all cursor-pointer ${
                              match.winner?.id === p1?.id
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold'
                                : p1
                                ? 'bg-neutral-50 hover:bg-indigo-50 text-neutral-800 hover:text-indigo-700'
                                : 'bg-neutral-50/50 text-neutral-300 italic'
                            }`}
                          >
                            <span className="truncate">{p1 ? p1.name : 'Por definir'}</span>
                            {match.winner?.id === p1?.id && <span className="text-xs">✓</span>}
                          </button>

                          {/* VS / Wheel decider icon */}
                          <div className="flex items-center justify-between px-2 text-2xs text-neutral-400 font-mono">
                            <span>VS</span>
                            {hasBoth && !match.winner && (
                              <button
                                type="button"
                                onClick={() => handleOpenWheelForMatch(match)}
                                className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-sans font-semibold cursor-pointer"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>Girar partido</span>
                              </button>
                            )}
                          </div>

                          {/* Player 2 */}
                          <button
                            type="button"
                            disabled={!p2 || Boolean(match.winner)}
                            onClick={() => p2 && handleSelectWinner(roundIdx, mIdx, p2)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between transition-all cursor-pointer ${
                              match.winner?.id === p2?.id
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold'
                                : p2
                                ? 'bg-neutral-50 hover:bg-indigo-50 text-neutral-800 hover:text-indigo-700'
                                : 'bg-neutral-50/50 text-neutral-300 italic'
                            }`}
                          >
                            <span className="truncate">{p2 ? p2.name : 'Por definir'}</span>
                            {match.winner?.id === p2?.id && <span className="text-xs">✓</span>}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
