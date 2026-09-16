export type WheelMode =
  | 'classic'
  | 'elimination'
  | 'survival'
  | 'multiple-winners'
  | 'teams'
  | 'pairs'
  | 'order'
  | 'number'
  | 'tournament';

export interface Participant {
  id: string;
  name: string;
  weight?: number;
  color?: string;
  eliminated?: boolean;
}

export interface SpinResult {
  id: string;
  winner: Participant;
  timestamp: number;
  mode: WheelMode;
  remainingCount?: number;
  details?: string;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  members: Participant[];
}

export interface Pair {
  id: string;
  pairNumber: number;
  member1: Participant;
  member2: Participant;
  member3?: Participant; // for odd count group of 3
}

export interface TournamentMatch {
  id: string;
  round: number;
  matchIndex: number;
  player1?: Participant | null;
  player2?: Participant | null;
  winner?: Participant | null;
  nextMatchId?: string;
}

export interface WheelPreset {
  id: string;
  title: string;
  description: string;
  items: string[];
  weights?: number[];
}
