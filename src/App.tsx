import React, { useState, useEffect, useRef } from 'react';
import { Participant, WheelMode, SpinResult } from './types';
import {
  getStoredParticipants,
  getDefaultParticipants,
  saveStoredParticipants,
  getStoredHistory,
  saveStoredHistory,
  getStoredSettings,
  saveStoredSettings,
} from './utils/storage';
import { encodeWheelToUrl, decodeWheelFromUrl } from './utils/sharing';
import { selectRandomWinner } from './utils/random';
import { soundFx } from './utils/audio';

import { ParticleBackground } from './components/ParticleBackground';
import { Header } from './components/Header';
import { HeroHome } from './components/HeroHome';
import { ModeSelector } from './components/ModeSelector';
import { WheelCanvas } from './components/WheelCanvas';
import { ParticipantEditor } from './components/ParticipantEditor';
import { ResultModal } from './components/ResultModal';

import { TeamsMode } from './components/TeamsMode';
import { PairsMode } from './components/PairsMode';
import { MultipleWinnersMode } from './components/MultipleWinnersMode';
import { RandomOrderMode } from './components/RandomOrderMode';
import { TournamentMode } from './components/TournamentMode';
import { NumberMode } from './components/NumberMode';
import { RotateCcw, AlertCircle, Sparkles } from 'lucide-react';

export default function App() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [mode, setMode] = useState<WheelMode>('classic');
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [pendingSpinWinner, setPendingSpinWinner] = useState<{
    winner: Participant;
    index: number;
  } | null>(null);
  const [winnerModalData, setWinnerModalData] = useState<Participant | null>(null);
  const [history, setHistory] = useState<SpinResult[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const mainToolRef = useRef<HTMLDivElement | null>(null);

  // Initialize from storage or shared URL
  useEffect(() => {
    // Check shared URL first
    const shared = decodeWheelFromUrl();
    if (shared && shared.items.length > 0) {
      const parsedItems: Participant[] = shared.items.map((item, idx) => ({
        id: `shared-${Date.now()}-${idx}`,
        name: item.name,
        weight: item.weight || 1,
      }));
      setParticipants(parsedItems);
      setMode(shared.mode);
      showToast('¡Configuración de ruleta compartida cargada!');
    } else {
      setParticipants(getStoredParticipants());
    }

    setHistory(getStoredHistory());
    const settings = getStoredSettings();
    setSoundEnabled(settings.soundEnabled);
    soundFx.setMuted(!settings.soundEnabled);
  }, []);

  // Save participants on change
  const handleUpdateParticipants = (next: Participant[]) => {
    setParticipants(next);
    saveStoredParticipants(next);
    if (next.length === 0) {
      setWinnerModalData(null);
      setPendingSpinWinner(null);
      setIsSpinning(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3000);
  };

  const handleToggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    soundFx.setMuted(!enabled);
    saveStoredSettings({ soundEnabled: enabled, spinDuration: 4.5 });
  };

  const handleShare = () => {
    const url = encodeWheelToUrl(mode, participants);
    navigator.clipboard.writeText(url);
    showToast('¡Enlace para compartir copiado al portapapeles!');
  };

  const handleResetAll = () => {
    const defaults = getDefaultParticipants();
    handleUpdateParticipants(defaults);
    setHistory([]);
    setWinnerModalData(null);
    setPendingSpinWinner(null);
    setIsSpinning(false);
    showToast('Ruleta restablecida a los elementos predeterminados.');
  };

  const scrollToWheel = () => {
    if (mainToolRef.current) {
      mainToolRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Active participants for the wheel (filters out eliminated in survival/elimination mode)
  const activeParticipants = participants.filter((p) => !p.eliminated);

  // Start spinning the wheel
  const handleSpinStart = () => {
    if (isSpinning || activeParticipants.length === 0) return;

    // Robust random selection FIRST using crypto.getRandomValues()
    const selection = selectRandomWinner(activeParticipants);
    setPendingSpinWinner(selection);
    setIsSpinning(true);
  };

  // Wheel animation completed
  const handleSpinComplete = (winner: Participant) => {
    setIsSpinning(false);
    setPendingSpinWinner(null);
    setWinnerModalData(winner);

    // Save to history
    const resultItem: SpinResult = {
      id: `spin-${Date.now()}`,
      winner,
      timestamp: Date.now(),
      mode,
      remainingCount: activeParticipants.length,
    };
    const nextHistory = [resultItem, ...history.slice(0, 49)];
    setHistory(nextHistory);
    saveStoredHistory(nextHistory);

    // If in Elimination or Survival mode, automatically mark this participant as eliminated
    if (mode === 'elimination' || (mode === 'survival' && activeParticipants.length > 1)) {
      const nextParticipants = participants.map((p) =>
        p.id === winner.id ? { ...p, eliminated: true } : p
      );
      handleUpdateParticipants(nextParticipants);
    }
  };

  const handleSpinAgain = () => {
    setWinnerModalData(null);
    setTimeout(() => {
      handleSpinStart();
    }, 150);
  };

  const handleRemoveWinnerAndSpin = () => {
    if (!winnerModalData) return;
    const nextParticipants = participants.filter((p) => p.id !== winnerModalData.id);
    handleUpdateParticipants(nextParticipants);
    setWinnerModalData(null);

    if (nextParticipants.length > 0) {
      setTimeout(() => {
        // Spin next
        const active = nextParticipants.filter((p) => !p.eliminated);
        if (active.length > 0) {
          const selection = selectRandomWinner(active);
          setPendingSpinWinner(selection);
          setIsSpinning(true);
        }
      }, 250);
    }
  };

  const handleResetEliminations = () => {
    const next = participants.map((p) => ({ ...p, eliminated: false }));
    handleUpdateParticipants(next);
  };

  const isStandardWheelMode =
    mode === 'classic' ||
    mode === 'elimination' ||
    mode === 'survival';

  return (
    <div className="relative min-h-screen flex flex-col selection:bg-indigo-100 selection:text-indigo-900 bg-white">
      {/* Particle background & subtle dot grid */}
      <ParticleBackground />

      {/* Header bar */}
      <Header
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onShare={handleShare}
        onResetAll={handleResetAll}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pb-20 flex flex-col gap-6">
        {/* Minimal Hero Section */}
        <HeroHome
          currentMode={mode}
          onSelectMode={setMode}
          onScrollToWheel={scrollToWheel}
        />

        {/* Main interactive workstation container */}
        <div
          ref={mainToolRef}
          id="main-randomizer-tool"
          className="pt-2 flex flex-col gap-6"
        >
          {/* Mode Switcher Tabs */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-2 shadow-xs">
            <ModeSelector
              currentMode={mode}
              onSelectMode={setMode}
              disabled={isSpinning}
            />
          </div>

          {/* Mode Specific Banners for Elimination / Survival */}
          {mode === 'elimination' && (
            <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 flex items-center justify-between text-xs sm:text-sm text-rose-950">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>
                  <strong>Modo Eliminación:</strong> Las opciones seleccionadas se eliminan tras cada
                  giro. ({activeParticipants.length} restantes de {participants.length})
                </span>
              </div>
              {participants.some((p) => p.eliminated) && (
                <button
                  type="button"
                  onClick={handleResetEliminations}
                  className="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-semibold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar todos</span>
                </button>
              )}
            </div>
          )}

          {mode === 'survival' && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between text-xs sm:text-sm text-amber-950">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  <strong>Ruleta de Supervivencia:</strong> ¡Gira para eliminar participantes hasta que solo
                  quede el campeón sobreviviente! ({activeParticipants.length} supervivientes)
                </span>
              </div>
              {participants.some((p) => p.eliminated) && (
                <button
                  type="button"
                  onClick={handleResetEliminations}
                  className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Revivir todos</span>
                </button>
              )}
            </div>
          )}

          {/* View Routing */}
          {isStandardWheelMode && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT (Desktop) / TOP (Mobile): The Wheel */}
              <div className="lg:col-span-7 flex flex-col items-center justify-center bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs">
                <WheelCanvas
                  participants={participants}
                  isSpinning={isSpinning}
                  onSpinStart={handleSpinStart}
                  onSpinComplete={handleSpinComplete}
                  winnerToSelect={pendingSpinWinner}
                  isResultShowing={Boolean(winnerModalData)}
                />
              </div>

              {/* RIGHT (Desktop) / BOTTOM (Mobile): Participant Editor */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <ParticipantEditor
                  participants={participants}
                  onChange={handleUpdateParticipants}
                  mode={mode}
                  disabled={isSpinning}
                />
              </div>
            </div>
          )}

          {mode === 'teams' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8">
                <TeamsMode
                  participants={participants}
                  onUpdateParticipants={handleUpdateParticipants}
                />
              </div>
              <div className="lg:col-span-4">
                <ParticipantEditor
                  participants={participants}
                  onChange={handleUpdateParticipants}
                  mode={mode}
                />
              </div>
            </div>
          )}

          {mode === 'pairs' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8">
                <PairsMode participants={participants} />
              </div>
              <div className="lg:col-span-4">
                <ParticipantEditor
                  participants={participants}
                  onChange={handleUpdateParticipants}
                  mode={mode}
                />
              </div>
            </div>
          )}

          {mode === 'multiple-winners' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8">
                <MultipleWinnersMode participants={participants} />
              </div>
              <div className="lg:col-span-4">
                <ParticipantEditor
                  participants={participants}
                  onChange={handleUpdateParticipants}
                  mode={mode}
                />
              </div>
            </div>
          )}

          {mode === 'order' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8">
                <RandomOrderMode participants={participants} />
              </div>
              <div className="lg:col-span-4">
                <ParticipantEditor
                  participants={participants}
                  onChange={handleUpdateParticipants}
                  mode={mode}
                />
              </div>
            </div>
          )}

          {mode === 'tournament' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8">
                <TournamentMode participants={participants} />
              </div>
              <div className="lg:col-span-4">
                <ParticipantEditor
                  participants={participants}
                  onChange={handleUpdateParticipants}
                  mode={mode}
                />
              </div>
            </div>
          )}

          {mode === 'number' && (
            <div className="max-w-2xl mx-auto w-full">
              <NumberMode />
            </div>
          )}
        </div>
      </main>

      {/* Result Modal for standard wheel spins */}
      {winnerModalData && (
        <ResultModal
          winner={winnerModalData}
          mode={mode}
          customBadge={
            mode === 'survival'
              ? activeParticipants.length === 0 || activeParticipants.length === 1
                ? '¡Único Sobreviviente!'
                : 'Participante Eliminado'
              : mode === 'elimination'
              ? 'Seleccionado y Eliminado'
              : undefined
          }
          customHeading={
            mode === 'survival' && activeParticipants.length > 1
              ? `❌ ${winnerModalData.name}`
              : mode === 'survival' && (activeParticipants.length === 0 || activeParticipants.length === 1)
              ? `👑 ${winnerModalData.name}`
              : undefined
          }
          onClose={() => setWinnerModalData(null)}
          onSpinAgain={handleSpinAgain}
          onRemoveWinnerAndSpin={handleRemoveWinnerAndSpin}
          onShareResult={() => {
            navigator.clipboard.writeText(
              `🎉 ¡Resultado del sorteo: ${winnerModalData.name}! Decidido con Ruleta Aleatoria`
            );
            showToast('¡Resultado copiado al portapapeles!');
          }}
          remainingCount={
            mode === 'elimination' || mode === 'survival'
              ? Math.max(0, activeParticipants.length - 1)
              : undefined
          }
        />
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          id="toast-notification"
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white text-xs sm:text-sm font-semibold py-2.5 px-4 rounded-xl shadow-lg border border-neutral-700/50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
