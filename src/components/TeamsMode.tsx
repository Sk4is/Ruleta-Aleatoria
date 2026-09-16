import React, { useState, useEffect } from 'react';
import { Participant, Team } from '../types';
import { generateTeams, selectRandomWinner } from '../utils/random';
import { WheelCanvas } from './WheelCanvas';
import { Users, Play, Sparkles, Copy, Check, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TeamsModeProps {
  participants: Participant[];
  onUpdateParticipants: (participants: Participant[]) => void;
}

export const TeamsMode: React.FC<TeamsModeProps> = ({
  participants,
}) => {
  const [splitType, setSplitType] = useState<'teamCount' | 'peoplePerTeam'>('teamCount');
  const [targetNumber, setTargetNumber] = useState<number>(3);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLiveWheelMode, setIsLiveWheelMode] = useState<boolean>(false);
  const [liveRemaining, setLiveRemaining] = useState<Participant[]>([]);
  const [currentAssignTeamIndex, setCurrentAssignTeamIndex] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [pendingWinner, setPendingWinner] = useState<{ winner: Participant; index: number } | null>(null);
  const [copiedTeamId, setCopiedTeamId] = useState<string | null>(null);
  const [recentAssignedName, setRecentAssignedName] = useState<string | null>(null);

  // Compute expected distribution preview
  const total = participants.length;
  let computedTeamsCount = 1;
  if (total > 0) {
    if (splitType === 'teamCount') {
      computedTeamsCount = Math.max(1, Math.min(targetNumber, total));
    } else {
      computedTeamsCount = Math.max(1, Math.ceil(total / Math.max(1, targetNumber)));
    }
  }

  const handleCreateInstantly = () => {
    if (participants.length === 0) return;
    const generated = generateTeams(participants, splitType, targetNumber);
    setTeams(generated);
    setIsLiveWheelMode(false);
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.7 },
      colors: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b'],
    });
  };

  // Start "Use Wheel" live assignment mode
  const handleStartWheelMode = () => {
    if (participants.length === 0) return;
    const initialEmptyTeams = generateTeams(participants, splitType, targetNumber).map((t) => ({
      ...t,
      members: [],
    }));
    setTeams(initialEmptyTeams);
    setLiveRemaining([...participants]);
    setCurrentAssignTeamIndex(0);
    setIsLiveWheelMode(true);
    setRecentAssignedName(null);
  };

  // Spin next live pick
  const handleSpinNextPick = () => {
    if (isSpinning || liveRemaining.length === 0) return;
    const { winner, index } = selectRandomWinner(liveRemaining);
    setPendingWinner({ winner, index });
    setIsSpinning(true);
  };

  // When wheel stops on winner in live team mode
  const handleWheelComplete = (winner: Participant) => {
    setIsSpinning(false);
    setPendingWinner(null);
    setRecentAssignedName(winner.name);

    // Place into current team
    setTeams((prevTeams) => {
      const copy = [...prevTeams];
      const targetTeam = copy[currentAssignTeamIndex % copy.length];
      if (targetTeam) {
        targetTeam.members = [...targetTeam.members, winner];
      }
      return copy;
    });

    // Remove from remaining
    const nextRemaining = liveRemaining.filter((p) => p.id !== winner.id);
    setLiveRemaining(nextRemaining);

    // Advance to next team for round-robin balance
    setCurrentAssignTeamIndex((prev) => prev + 1);

    if (nextRemaining.length === 0) {
      // Done all teams!
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#10b981', '#f59e0b', '#ec4899'],
      });
    }
  };

  const handleCopyTeam = (team: Team) => {
    const text = `${team.name}:\n${team.members.map((m, i) => `${i + 1}. ${m.name}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopiedTeamId(team.id);
    setTimeout(() => setCopiedTeamId(null), 2000);
  };

  const handleCopyAllTeams = () => {
    const text = teams
      .map((t) => `${t.name} (${t.members.length}):\n${t.members.map((m) => `• ${m.name}`).join('\n')}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopiedTeamId('all');
    setTimeout(() => setCopiedTeamId(null), 2000);
  };

  return (
    <div id="teams-mode-container" className="w-full flex flex-col gap-6">
      {/* Configuration bar */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Split Mode Radio/Toggle */}
          <div className="flex items-center rounded-xl bg-neutral-100 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSplitType('teamCount')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                splitType === 'teamCount' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500'
              }`}
            >
              Número de equipos
            </button>
            <button
              type="button"
              onClick={() => setSplitType('peoplePerTeam')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                splitType === 'peoplePerTeam' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500'
              }`}
            >
              Personas por equipo
            </button>
          </div>

          {/* Quick preset buttons: 2, 3, 4, 5, Custom */}
          <div className="flex items-center gap-1.5">
            {[2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setTargetNumber(num)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  targetNumber === num
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
                max={Math.max(1, participants.length)}
                value={targetNumber}
                onChange={(e) => setTargetNumber(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-14 px-2 py-1 text-xs border border-neutral-200 rounded-lg text-center font-bold"
              />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="create-teams-instant-btn"
            disabled={participants.length === 0}
            onClick={handleCreateInstantly}
            className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-40"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Crear al instante</span>
          </button>

          <button
            type="button"
            id="create-teams-wheel-btn"
            disabled={participants.length === 0}
            onClick={handleStartWheelMode}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-40"
          >
            <Play className="w-4 h-4" />
            <span>Usar ruleta</span>
          </button>
        </div>
      </div>

      {/* Live Wheel Assignment View */}
      {isLiveWheelMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Wheel side */}
          <div className="lg:col-span-6 flex flex-col items-center bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs">
            <div className="w-full flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-neutral-900">
                  Asignando a: {teams[currentAssignTeamIndex % teams.length]?.name || 'Siguiente equipo'}
                </span>
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: teams[currentAssignTeamIndex % teams.length]?.color }}
                />
              </div>
              <span className="text-xs font-semibold text-neutral-500">
                {liveRemaining.length} sin asignar
              </span>
            </div>

            {liveRemaining.length > 0 ? (
              <>
                <WheelCanvas
                  participants={liveRemaining}
                  isSpinning={isSpinning}
                  onSpinStart={handleSpinNextPick}
                  onSpinComplete={handleWheelComplete}
                  winnerToSelect={pendingWinner}
                />
                {recentAssignedName && (
                  <p className="mt-3 text-xs font-semibold text-emerald-600 animate-pulse">
                    ✓ Se asignó a {recentAssignedName} a {teams[(currentAssignTeamIndex - 1 + teams.length) % teams.length]?.name}
                  </p>
                )}
              </>
            ) : (
              <div className="py-16 text-center flex flex-col items-center gap-3">
                <span className="text-4xl">🎉</span>
                <h3 className="text-lg font-bold text-neutral-800">¡Todos los equipos asignados!</h3>
                <button
                  type="button"
                  onClick={handleStartWheelMode}
                  className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reiniciar</span>
                </button>
              </div>
            )}
          </div>

          {/* Teams cards live progress */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900">Equipos en directo</h3>
              {teams.length > 0 && (
                <button
                  type="button"
                  onClick={handleCopyAllTeams}
                  className="text-xs font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1"
                >
                  {copiedTeamId === 'all' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTeamId === 'all' ? '¡Todo copiado!' : 'Copiar todo'}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {teams.map((team, idx) => {
                const isTarget = isLiveWheelMode && idx === (currentAssignTeamIndex % teams.length) && liveRemaining.length > 0;
                return (
                  <div
                    key={team.id}
                    className={`bg-white rounded-2xl border p-4 shadow-xs transition-all ${
                      isTarget
                        ? 'border-indigo-500 ring-2 ring-indigo-100 scale-[1.01]'
                        : 'border-neutral-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: team.color }}
                        />
                        <span className="font-bold text-sm text-neutral-900">{team.name}</span>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                        {team.members.length}
                      </span>
                    </div>

                    <div className="mt-2.5 flex flex-col gap-1 min-h-[70px]">
                      {team.members.length === 0 ? (
                        <p className="text-xs text-neutral-400 italic py-2">Esperando integrantes...</p>
                      ) : (
                        team.members.map((m, mIdx) => (
                          <div
                            key={m.id}
                            className="flex items-center gap-2 text-xs py-1 px-2 rounded-lg bg-neutral-50 text-neutral-800"
                          >
                            <span className="text-neutral-400 font-mono w-3">{mIdx + 1}.</span>
                            <span className="font-medium truncate">{m.name}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Instant Teams Result View */
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-neutral-700" />
              <h3 className="text-base font-bold text-neutral-900">
                Equipos generados ({teams.length || computedTeamsCount})
              </h3>
            </div>

            {teams.length > 0 && (
              <button
                type="button"
                id="copy-all-teams-btn"
                onClick={handleCopyAllTeams}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 flex items-center gap-1.5 cursor-pointer text-neutral-700"
              >
                {copiedTeamId === 'all' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTeamId === 'all' ? '¡Todos los equipos copiados!' : 'Copiar todos los equipos'}</span>
              </button>
            )}
          </div>

          {teams.length === 0 ? (
            <div className="py-14 text-center bg-white rounded-2xl border border-dashed border-neutral-300 p-8 flex flex-col items-center justify-center gap-2">
              <Users className="w-8 h-8 text-neutral-300" />
              <p className="text-sm font-medium text-neutral-600">
                Haz clic en &quot;Crear al instante&quot; o &quot;Usar ruleta&quot; para dividir a los {participants.length} participantes en equipos equilibrados.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="bg-white rounded-2xl border border-neutral-200/80 p-4 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: team.color }}
                        />
                        <span className="font-bold text-sm text-neutral-900">{team.name}</span>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                        {team.members.length} integrantes
                      </span>
                    </div>

                    <div className="mt-3 flex flex-col gap-1.5">
                      {team.members.map((member, mIdx) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-2 text-xs py-1.5 px-2.5 rounded-xl bg-neutral-50 text-neutral-800"
                        >
                          <span className="text-neutral-400 font-mono w-4">{mIdx + 1}.</span>
                          <span className="font-semibold truncate">{member.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyTeam(team)}
                    className="mt-4 pt-2 border-t border-neutral-100 text-xs font-medium text-neutral-500 hover:text-indigo-600 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {copiedTeamId === team.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar equipo</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
