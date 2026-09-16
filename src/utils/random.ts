import { Participant, Team, Pair, TournamentMatch } from '../types';
import { getTeamColor } from './colors';

/**
 * Generates a cryptographically secure random floating-point number in [0, 1)
 */
export function getCryptoRandom(): number {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] / (0xffffffff + 1);
}

/**
 * Returns a cryptographically secure integer between min and max (inclusive)
 */
export function getCryptoRandomInt(min: number, max: number): number {
  const range = max - min + 1;
  if (range <= 0) return min;
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return min + (array[0] % range);
}

/**
 * Selects a winner with completely equal probability using crypto.getRandomValues()
 */
export function selectRandomWinner(participants: Participant[]): { winner: Participant; index: number } {
  if (participants.length === 0) {
    throw new Error('No participants provided');
  }
  const index = getCryptoRandomInt(0, participants.length - 1);
  return { winner: participants[index], index };
}

/**
 * Backward compatibility alias for selectRandomWinner (all participants have equal chance)
 */
export function selectWinnerByWeight(participants: Participant[]): { winner: Participant; index: number } {
  return selectRandomWinner(participants);
}

/**
 * Cryptographically secure Fisher-Yates array shuffle
 */
export function cryptoShuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = getCryptoRandomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Generates balanced random teams.
 * Handles uneven groups so differences between team sizes are never greater than 1.
 */
export function generateTeams(
  participants: Participant[],
  mode: 'teamCount' | 'peoplePerTeam',
  count: number,
  customTeamNames?: string[]
): Team[] {
  const shuffled = cryptoShuffle(participants);
  const total = shuffled.length;
  if (total === 0) return [];

  let numTeams = 1;
  if (mode === 'teamCount') {
    numTeams = Math.max(1, Math.min(count, total));
  } else {
    const peoplePerTeam = Math.max(1, count);
    numTeams = Math.max(1, Math.ceil(total / peoplePerTeam));
  }

  const defaultTeamNames = [
    'Equipo Alpha', 'Equipo Bravo', 'Equipo Charlie', 'Equipo Delta', 'Equipo Eco', 'Equipo Fénix', 'Equipo Goliat', 'Equipo Halcón',
    'Equipo Ícaro', 'Equipo Jaguar', 'Equipo Kilo', 'Equipo Luna', 'Equipo Meteoro', 'Equipo Neptuno', 'Equipo Ónix', 'Equipo Pegaso'
  ];

  const teams: Team[] = Array.from({ length: numTeams }, (_, i) => ({
    id: `team-${i + 1}-${Date.now()}`,
    name: customTeamNames?.[i] || defaultTeamNames[i] || `Equipo ${i + 1}`,
    color: getTeamColor(i),
    members: [],
  }));

  // Distribute one by one to ensure maximum balance (e.g. 10 people -> 4, 3, 3)
  shuffled.forEach((participant, idx) => {
    teams[idx % numTeams].members.push(participant);
  });

  return teams;
}

/**
 * Generates random pairs.
 * Options for odd count:
 * - 'groupOfThree': adds the remaining person into the last pair
 * - 'leaveUnpaired': leaves one person in an unpaired state
 */
export function generatePairs(
  participants: Participant[],
  oddHandling: 'groupOfThree' | 'leaveUnpaired' = 'groupOfThree'
): { pairs: Pair[]; unpaired: Participant | null } {
  const shuffled = cryptoShuffle(participants);
  const pairs: Pair[] = [];
  let unpaired: Participant | null = null;

  for (let i = 0; i < shuffled.length; i += 2) {
    if (i + 1 < shuffled.length) {
      pairs.push({
        id: `pair-${Math.floor(i / 2) + 1}-${Date.now()}`,
        pairNumber: Math.floor(i / 2) + 1,
        member1: shuffled[i],
        member2: shuffled[i + 1],
      });
    } else {
      // Remaining single person
      if (oddHandling === 'groupOfThree' && pairs.length > 0) {
        pairs[pairs.length - 1].member3 = shuffled[i];
      } else {
        unpaired = shuffled[i];
      }
    }
  }

  return { pairs, unpaired };
}

/**
 * Generates a tournament bracket for single elimination
 */
export function generateTournamentBracket(participants: Participant[]): TournamentMatch[][] {
  const shuffled = cryptoShuffle(participants);
  if (shuffled.length === 0) return [];

  // Determine nearest power of 2
  const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(Math.max(2, shuffled.length))));
  const totalRounds = Math.log2(nextPowerOfTwo);

  const rounds: TournamentMatch[][] = [];

  // Round 1 matches
  const round1Matches: TournamentMatch[] = [];
  const numRound1Matches = nextPowerOfTwo / 2;

  for (let i = 0; i < numRound1Matches; i++) {
    const p1 = shuffled[i * 2] || null;
    const p2 = shuffled[i * 2 + 1] || null;
    
    // Auto-advance if bye (one player without opponent)
    const autoWinner = p1 && !p2 ? p1 : (!p1 && p2 ? p2 : null);

    round1Matches.push({
      id: `match-1-${i}`,
      round: 1,
      matchIndex: i,
      player1: p1,
      player2: p2,
      winner: autoWinner,
    });
  }
  rounds.push(round1Matches);

  // Subsequent rounds
  for (let r = 2; r <= totalRounds; r++) {
    const matchesInRound = Math.pow(2, totalRounds - r);
    const currentRoundMatches: TournamentMatch[] = [];

    for (let m = 0; m < matchesInRound; m++) {
      currentRoundMatches.push({
        id: `match-${r}-${m}`,
        round: r,
        matchIndex: m,
        player1: null,
        player2: null,
        winner: null,
      });
    }
    rounds.push(currentRoundMatches);
  }

  // Populate subsequent rounds if byes were present
  for (let r = 0; r < rounds.length - 1; r++) {
    const currentRound = rounds[r];
    const nextRound = rounds[r + 1];

    currentRound.forEach((match, idx) => {
      const targetMatchIndex = Math.floor(idx / 2);
      const isPlayer1Slot = idx % 2 === 0;

      if (match.winner && nextRound[targetMatchIndex]) {
        if (isPlayer1Slot) {
          nextRound[targetMatchIndex].player1 = match.winner;
        } else {
          nextRound[targetMatchIndex].player2 = match.winner;
        }
      }
    });
  }

  return rounds;
}
