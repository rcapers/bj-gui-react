export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Value = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  value: Value;
  hidden?: boolean;
}

export interface Player {
  hand: Card[];
  score: number;
  bet: number;
}

export interface Dealer {
  hand: Card[];
  score: number;
}

export interface Stats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  pushes: number;
  currentStreak: number;
  longestStreak: number;
  biggestWin: number;
  biggestLoss: number;
}

export interface Settings {
  soundEnabled: boolean;
  hintsEnabled: boolean;
}

export type GamePhase = 'betting' | 'playing' | 'dealerTurn' | 'gameOver';

export interface GameState {
  deck: Card[];
  player: Player;
  dealer: Dealer;
  balance: number;
  gamePhase: GamePhase;
  message: string;
  stats: Stats;
  settings: Settings;
  
  // Actions
  placeBet: (amount: number) => void;
  dealCards: () => void;
  hit: () => void;
  stand: () => void;
  double: () => void;
  dealerPlay: () => void;
  resetGame: () => void;
  toggleSound: () => void;
  toggleHints: () => void;
}
