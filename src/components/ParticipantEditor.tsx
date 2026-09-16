import React, { useState, useRef, useEffect } from 'react';
import { Participant, WheelMode } from '../types';
import { Plus, Trash2, Shuffle, FileText, List, RotateCcw, Sparkles } from 'lucide-react';
import { DEFAULT_PRESETS } from '../utils/storage';

interface ParticipantEditorProps {
  participants: Participant[];
  onChange: (participants: Participant[]) => void;
  mode: WheelMode;
  disabled?: boolean;
}

export const ParticipantEditor: React.FC<ParticipantEditorProps> = ({
  participants,
  onChange,
  mode,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [lastDeleted, setLastDeleted] = useState<{ participant: Participant; index: number } | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Close confirmation modal on Escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showConfirmClear) {
        setShowConfirmClear(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showConfirmClear]);

  // Sync bulk text when switching to bulk mode
  useEffect(() => {
    if (isBulkMode) {
      setBulkText(participants.map((p) => p.name).join('\n'));
    }
  }, [isBulkMode, participants]);

  const handleAddSingle = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    // Check if input contained multiple lines (e.g. pasted directly into input)
    if (trimmed.includes('\n')) {
      handleBatchAdd(trimmed);
      return;
    }

    const newParticipant: Participant = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: trimmed,
    };

    onChange([...participants, newParticipant]);
    setInputValue('');
  };

  const handleBatchAdd = (rawText: string) => {
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    const newItems: Participant[] = lines.map((line, idx) => ({
      id: `${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
      name: line,
    }));

    onChange(newItems);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSingle(inputValue);
    }
  };

  const handlePasteIntoInput = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted && pasted.includes('\n')) {
      e.preventDefault();
      const lines = pasted
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      const newItems: Participant[] = lines.map((line, idx) => ({
        id: `${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
        name: line,
        weight: 1,
      }));

      onChange([...participants, ...newItems]);
      setInputValue('');
    }
  };

  const handleRemove = (id: string, index: number) => {
    const itemToRemove = participants.find((p) => p.id === id);
    if (itemToRemove) {
      setLastDeleted({ participant: itemToRemove, index });
    }
    onChange(participants.filter((p) => p.id !== id));
  };

  const handleUndoDelete = () => {
    if (!lastDeleted) return;
    const next = [...participants];
    next.splice(lastDeleted.index, 0, lastDeleted.participant);
    onChange(next);
    setLastDeleted(null);
  };

  const handleRequestClear = () => {
    if (participants.length === 0) return;
    setShowConfirmClear(true);
  };

  const handleConfirmClear = () => {
    setShowConfirmClear(false);
    onChange([]);
    setLastDeleted(null);
    setInputValue('');
    setBulkText('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleCancelClear = () => {
    setShowConfirmClear(false);
  };

  const handleShuffle = () => {
    const shuffled = [...participants];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    onChange(shuffled);
  };

  const handleApplyBulk = () => {
    handleBatchAdd(bulkText);
    setIsBulkMode(false);
  };

  const handleLoadPreset = (presetId: string) => {
    const preset = DEFAULT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const newItems: Participant[] = preset.items.map((name, idx) => ({
      id: `${Date.now()}-${idx}`,
      name,
    }));
    onChange(newItems);
  };

  return (
    <div
      id="participant-editor-card"
      className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm p-5 sm:p-6 w-full flex flex-col"
    >
      {/* Header bar with counter and mode toggles */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100 gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-neutral-900">
            Participantes
          </h2>
          <span
            id="participant-count-badge"
            className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600"
          >
            {participants.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Preset quick selector */}
          <div className="relative inline-block">
            <select
              id="preset-quick-select"
              aria-label="Cargar lista de ejemplo"
              disabled={disabled}
              value=""
              onChange={(e) => {
                if (e.target.value) handleLoadPreset(e.target.value);
              }}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer"
            >
              <option value="" disabled>
                ⚡ Ejemplos...
              </option>
              {DEFAULT_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.title} ({preset.items.length})
                </option>
              ))}
            </select>
          </div>

          {/* Toggle bulk view */}
          <button
            type="button"
            id="toggle-bulk-mode-btn"
            title={isBulkMode ? 'Vista individual' : 'Pegar lista rápida'}
            disabled={disabled}
            onClick={() => setIsBulkMode(!isBulkMode)}
            className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
              isBulkMode
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            {isBulkMode ? <List className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            <span className="hidden sm:inline">{isBulkMode ? 'Lista' : 'Pegar'}</span>
          </button>
        </div>
      </div>

      {/* Bulk Textarea Mode */}
      {isBulkMode ? (
        <div className="mt-3 flex flex-col gap-2">
          <label htmlFor="bulk-participants-textarea" className="text-xs text-neutral-500">
            Pega un nombre por línea (ej. Carlos, Beatriz, Alejandro):
          </label>
          <textarea
            id="bulk-participants-textarea"
            rows={8}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder="Carlos&#10;Beatriz&#10;Alejandro&#10;Diana&#10;Elena"
            className="w-full text-sm font-sans p-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 resize-y leading-relaxed"
          />
          <div className="flex items-center justify-between gap-2 mt-1">
            <span className="text-xs text-neutral-400">
              {bulkText.split('\n').filter((l) => l.trim().length > 0).length} participantes
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBulkMode(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-neutral-600 hover:bg-neutral-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="apply-bulk-text-btn"
                onClick={handleApplyBulk}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm cursor-pointer"
              >
                Aplicar lista
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Standard Single Item Input & List */
        <div className="mt-3 flex flex-col gap-3">
          {/* Add input form */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                id="add-participant-input"
                type="text"
                disabled={disabled}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePasteIntoInput}
                placeholder="Escribe un nombre o pega varios (Enter)..."
                className="w-full text-sm py-2.5 px-3.5 pr-10 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 placeholder:text-neutral-400"
              />
              <button
                type="button"
                id="add-participant-submit-btn"
                disabled={disabled || !inputValue.trim()}
                onClick={() => handleAddSingle(inputValue)}
                aria-label="Añadir participante"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick list action bar: Shuffle, Clear, Undo */}
          <div className="flex items-center justify-between text-xs text-neutral-500 py-1 px-0.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="shuffle-participants-btn"
                disabled={disabled || participants.length < 2}
                onClick={handleShuffle}
                className="flex items-center gap-1 hover:text-neutral-900 disabled:opacity-40 cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Mezclar</span>
              </button>

              {lastDeleted && (
                <button
                  type="button"
                  id="undo-delete-btn"
                  onClick={handleUndoDelete}
                  className="flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Deshacer &quot;{lastDeleted.participant.name}&quot;</span>
                </button>
              )}
            </div>

            {participants.length > 0 && (
              <button
                type="button"
                id="clear-all-participants-btn"
                disabled={disabled}
                onClick={handleRequestClear}
                className="text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
              >
                Vaciar lista
              </button>
            )}
          </div>

          {/* Entries list */}
          <div
            id="participants-scroll-list"
            className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-1"
          >
            {participants.length === 0 ? (
              <div
                id="empty-participants-notice"
                className="py-10 text-center text-neutral-400 text-sm flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-0.5">
                  <Sparkles className="w-5 h-5 stroke-[1.5]" />
                </div>
                <p className="font-bold text-neutral-700 text-sm">No hay participantes</p>
                <p className="text-xs text-neutral-400 max-w-[220px]">
                  Añade nombres para empezar
                </p>
              </div>
            ) : (
              participants.map((p, index) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm border transition-colors group ${
                    p.eliminated
                      ? 'bg-neutral-50 border-neutral-200/50 opacity-40 line-through'
                      : 'bg-white border-neutral-200/80 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-xs font-mono text-neutral-400 w-4 text-right">
                      {index + 1}
                    </span>
                    <span className="font-medium text-neutral-800 truncate">{p.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleRemove(p.id, index)}
                      aria-label={`Eliminar ${p.name}`}
                      className="text-neutral-300 hover:text-red-500 p-1 rounded-md transition-colors opacity-80 group-hover:opacity-100 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal for "Vaciar lista" */}
      {showConfirmClear && (
        <div
          id="confirm-clear-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-clear-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCancelClear();
          }}
        >
          <div
            id="confirm-clear-dialog"
            className="bg-white rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-xl border border-neutral-100 flex flex-col gap-4 transform scale-100 transition-all"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1">
                <h3
                  id="confirm-clear-title"
                  className="text-base font-bold text-neutral-900 leading-snug"
                >
                  ¿Vaciar la lista?
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                  Se eliminarán todos los participantes.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-1 pt-2 border-t border-neutral-100">
              <button
                type="button"
                id="cancel-clear-btn"
                onClick={handleCancelClear}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="confirm-clear-btn"
                onClick={handleConfirmClear}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-red-600 hover:bg-red-700 shadow-xs transition-colors cursor-pointer"
              >
                Vaciar lista
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
