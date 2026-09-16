import { Participant, WheelMode } from '../types';

export interface SharedWheelConfig {
  mode: WheelMode;
  items: { name: string; weight?: number }[];
  title?: string;
}

export function encodeWheelToUrl(mode: WheelMode, participants: Participant[]): string {
  try {
    const hasCustomWeights = participants.some((p) => p.weight && p.weight !== 1);
    
    // If all weights are 1 and names don't contain semicolons or special characters, use clean format
    const payload = participants.map(p => ({
      n: p.name,
      ...(hasCustomWeights && p.weight !== 1 ? { w: p.weight } : {})
    }));

    const json = JSON.stringify({ m: mode, p: payload });
    const b64 = btoa(encodeURIComponent(json));

    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('w', b64);
    return url.toString();
  } catch {
    return window.location.href;
  }
}

export function decodeWheelFromUrl(): SharedWheelConfig | null {
  if (typeof window === 'undefined') return null;

  try {
    const params = new URLSearchParams(window.location.search);
    const b64 = params.get('w');
    if (!b64) return null;

    const json = decodeURIComponent(atob(b64));
    const data = JSON.parse(json);

    if (data && Array.isArray(data.p)) {
      return {
        mode: data.m || 'classic',
        items: data.p.map((item: { n: string; w?: number }) => ({
          name: item.n,
          weight: item.w || 1,
        })),
      };
    }
  } catch {
    // Decoding failed or invalid URL
  }
  return null;
}
