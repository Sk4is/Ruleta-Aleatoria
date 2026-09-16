import { Participant, SpinResult, WheelPreset } from '../types';

const STORAGE_KEYS = {
  PARTICIPANTS: 'spin_wheel_participants_v1',
  HISTORY: 'spin_wheel_history_v1',
  SAVED_LISTS: 'spin_wheel_saved_lists_v1',
  SETTINGS: 'spin_wheel_settings_v1',
};

export interface AppSettings {
  soundEnabled: boolean;
  spinDuration: number; // in seconds, default 4.5
}

export const DEFAULT_PRESETS: WheelPreset[] = [
  {
    id: 'default-names',
    title: 'Equipo de ejemplo',
    description: 'Lista predeterminada de 8 participantes',
    items: ['Carlos', 'Beatriz', 'Alejandro', 'Diana', 'Elena', 'Fernando', 'Gonzalo', 'Helena'],
  },
  {
    id: 'yes-no',
    title: 'Sí / No / Quizás',
    description: 'Decisiones rápidas o binarias',
    items: ['Sí', 'No', 'Quizás', 'Definitivamente sí', 'Pregunta de nuevo', 'Nunca'],
  },
  {
    id: 'lunch-decider',
    title: '¿Qué comemos hoy?',
    description: 'Para no discutir por el almuerzo',
    items: ['Pizza', 'Sushi', 'Hamburguesas', 'Tacos', 'Comida asiática', 'Ensalada', 'Pasta', 'Ramen'],
  },
  {
    id: 'numbers-1-10',
    title: 'Números del 1 al 10',
    description: 'Elección numérica al azar',
    items: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
  },
  {
    id: 'dice-roll',
    title: 'Dado clásico (1 al 6)',
    description: 'Caras de un dado estándar de 6 lados',
    items: ['1 ⚀', '2 ⚁', '3 ⚂', '4 ⚃', '5 ⚄', '6 ⚅'],
  },
  {
    id: 'activity-break',
    title: 'Pausa activa',
    description: 'Ideas para desconectar la mente',
    items: ['Paseo de 5 min', 'Estiramientos y agua', 'Pausa para café', 'Respiración profunda', 'Escuchar una canción', 'Leer 2 páginas'],
  },
];

export function getDefaultParticipants(): Participant[] {
  return [
    { id: '1', name: 'Carlos' },
    { id: '2', name: 'Beatriz' },
    { id: '3', name: 'Alejandro' },
    { id: '4', name: 'Diana' },
    { id: '5', name: 'Elena' },
    { id: '6', name: 'Fernando' },
    { id: '7', name: 'Gonzalo' },
    { id: '8', name: 'Helena' },
  ];
}

export function getStoredParticipants(): Participant[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PARTICIPANTS);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Fallback to defaults
  }
  // Default names in Spanish only when no saved data exists
  return getDefaultParticipants();
}

export function saveStoredParticipants(participants: Participant[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(participants));
  } catch {
    // quota exceeded or disabled
  }
}

export function getStoredHistory(): SpinResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.slice(0, 50); // cap to 50
    }
  } catch {
    // Ignore
  }
  return [];
}

export function saveStoredHistory(history: SpinResult[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history.slice(0, 50)));
  } catch {
    // Ignore
  }
}

export function getStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      return { soundEnabled: true, spinDuration: 4.5, ...JSON.parse(raw) };
    }
  } catch {
    // Ignore
  }
  return { soundEnabled: true, spinDuration: 4.5 };
}

export function saveStoredSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch {
    // Ignore
  }
}

export function clearAllLocalData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.PARTICIPANTS);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    localStorage.removeItem(STORAGE_KEYS.SAVED_LISTS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  } catch {
    // Ignore
  }
}
