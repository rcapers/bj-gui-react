import { create } from 'zustand';
import { GameState, Card, Suit, Value, GamePhase, Settings } from '../types/game';
import { playSound } from '../utils/sounds';

const createDeck = (): Card[] => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const values: Value[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck: Card[] = [];

  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }

  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
};

const calculateScore = (hand: Card[]): number => {
  let score = 0;
  let aces = 0;

  for (const card of hand) {
    if (card.hidden) continue;
    
    if (card.value === 'A') {
      aces += 1;
      score += 11;
    } else if (['K', 'Q', 'J'].includes(card.value)) {
      score += 10;
    } else {
      score += parseInt(card.value);
    }
  }

  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }

  return score;
};

const initialState: GameState = {
  deck: createDeck(),
  player: {
    hand: [],
    score: 0,
    bet: 0
  },
  dealer: {
    hand: [],
    score: 0
  },
  balance: 1000,
  gamePhase: 'betting' as GamePhase,
  message: 'Place your bet!',
  settings: {
    soundEnabled: true,
    hintsEnabled: true
  },
  stats: {
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    pushes: 0,
    currentStreak: 0,
    longestStreak: 0,
    biggestWin: 0,
    biggestLoss: 0
  }
};

export const useGameStore = create<GameState>((set) => ({
  ...initialState,

  placeBet: (amount: number) => set((state) => {
    if (state.gamePhase !== 'betting' || amount > state.balance) return state;
    return {
      ...state,
      balance: state.balance - amount,
      player: {
        ...state.player,
        bet: amount
      },
      gamePhase: 'dealing'
    };
  }),

  dealCards: () => set((state) => {
    if (state.gamePhase !== 'dealing') return state;

    const newDeck = [...state.deck];
    const playerHand = [newDeck.pop()!, newDeck.pop()!];
    const dealerHand = [newDeck.pop()!, { ...newDeck.pop()!, hidden: true }];
    
    // Play card dealing sounds
    setTimeout(() => playSound('cardSlide'), 0);
    setTimeout(() => playSound('cardSlide'), 200);
    setTimeout(() => playSound('cardSlide'), 400);
    setTimeout(() => playSound('cardSlide'), 600);

    const playerScore = calculateScore(playerHand);
    const dealerScore = calculateScore(dealerHand);

    // Check for blackjack
    if (playerScore === 21) {
      setTimeout(() => playSound('win'), 800);
      return {
        ...state,
        deck: newDeck,
        player: { ...state.player, hand: playerHand, score: playerScore },
        dealer: { ...state.dealer, hand: dealerHand, score: dealerScore },
        gamePhase: 'gameOver',
        message: '🎉 Blackjack!',
        balance: state.balance + state.player.bet * 2.5,
        stats: {
          ...state.stats,
          wins: state.stats.wins + 1,
          currentStreak: state.stats.currentStreak + 1,
          longestStreak: Math.max(state.stats.longestStreak, state.stats.currentStreak + 1),
          biggestWin: Math.max(state.stats.biggestWin, state.player.bet * 1.5),
          gamesPlayed: state.stats.gamesPlayed + 1
        }
      };
    }

    return {
      ...state,
      deck: newDeck,
      player: { ...state.player, hand: playerHand, score: playerScore },
      dealer: { ...state.dealer, hand: dealerHand, score: dealerScore },
      gamePhase: 'playing',
      message: '🎯 Your turn'
    };
  }),

  hit: () => set((state) => {
    if (state.gamePhase !== 'playing') return state;
    
    const newDeck = [...state.deck];
    const newCard = newDeck.pop()!;
    const newHand = [...state.player.hand, newCard];
    const newScore = calculateScore(newHand);
    
    playSound('cardSlide');
    
    if (newScore > 21) {
      setTimeout(() => playSound('lose'), 300);
      return {
        ...state,
        deck: newDeck,
        player: { ...state.player, hand: newHand, score: newScore },
        gamePhase: 'gameOver',
        message: '💥 Bust!',
        stats: {
          ...state.stats,
          losses: state.stats.losses + 1,
          currentStreak: 0,
          biggestLoss: Math.max(state.stats.biggestLoss, state.player.bet),
          gamesPlayed: state.stats.gamesPlayed + 1
        }
      };
    }
    
    return {
      ...state,
      deck: newDeck,
      player: { ...state.player, hand: newHand, score: newScore },
      message: '🎯 Your turn'
    };
  }),

  stand: () => {
    playSound('cardFlip');
    set((state) => ({
      gamePhase: 'dealerTurn',
      message: '🎲 Dealer\'s turn',
      dealer: {
        ...state.dealer,
        hand: state.dealer.hand.map(card => ({ ...card, hidden: false }))
      }
    }));
  },

  double: () => set((state) => {
    if (state.balance < state.player.bet) return state;
    
    const newDeck = [...state.deck];
    const newCard = newDeck.pop()!;
    const newHand = [...state.player.hand, newCard];
    const newScore = calculateScore(newHand);

    playSound('chipStack');
    setTimeout(() => playSound('cardSlide'), 300);
    
    if (newScore > 21) {
      playSound('lose');
      return {
        deck: newDeck,
        player: { 
          ...state.player, 
          hand: newHand, 
          score: newScore, 
          bet: state.player.bet * 2 
        },
        balance: state.balance - state.player.bet,
        gamePhase: 'gameOver',
        message: '💥 Bust!',
        stats: {
          ...state.stats,
          losses: state.stats.losses + 1,
          currentStreak: 0,
          biggestLoss: Math.max(state.stats.biggestLoss, state.player.bet * 2),
          gamesPlayed: state.stats.gamesPlayed + 1
        }
      };
    }

    return {
      deck: newDeck,
      player: { 
        ...state.player, 
        hand: newHand, 
        score: newScore,
        bet: state.player.bet * 2 
      },
      balance: state.balance - state.player.bet,
      gamePhase: 'dealerTurn',
      message: '🎲 Dealer\'s turn',
      dealer: {
        ...state.dealer,
        hand: state.dealer.hand.map(card => ({ ...card, hidden: false }))
      }
    };
  }),

  dealerPlay: () => set((state) => {
    if (state.gamePhase !== 'dealerTurn') return state;

    const newDeck = [...state.deck];
    const newHand = [...state.dealer.hand];
    let newScore = calculateScore(newHand);

    // Deal dealer cards
    while (newScore < 17) {
      const newCard = newDeck.pop()!;
      newHand.push(newCard);
      newScore = calculateScore(newHand);
      playSound('cardSlide');
    }

    const playerScore = state.player.score;
    console.log('Final scores -', { player: playerScore, dealer: newScore });

    const result = {
      deck: newDeck,
      dealer: { ...state.dealer, hand: newHand, score: newScore },
      gamePhase: 'gameOver' as const,
      message: '',
      balance: state.balance,
      stats: { ...state.stats }
    };

    // Handle game outcome
    if (newScore > 21) {
      console.log('Dealer bust - player wins!');
      result.message = '🎉 You win! Dealer bust!';
      result.balance += state.player.bet * 2;
      result.stats = {
        ...state.stats,
        wins: state.stats.wins + 1,
        currentStreak: state.stats.currentStreak + 1,
        longestStreak: Math.max(state.stats.longestStreak, state.stats.currentStreak + 1),
        biggestWin: Math.max(state.stats.biggestWin, state.player.bet),
        gamesPlayed: state.stats.gamesPlayed + 1
      };
      setTimeout(() => playSound('win'), 500);
    } else if (playerScore > newScore) {
      console.log('Player wins with higher score!');
      result.message = '🎉 You win!';
      result.balance += state.player.bet * 2;
      result.stats = {
        ...state.stats,
        wins: state.stats.wins + 1,
        currentStreak: state.stats.currentStreak + 1,
        longestStreak: Math.max(state.stats.longestStreak, state.stats.currentStreak + 1),
        biggestWin: Math.max(state.stats.biggestWin, state.player.bet),
        gamesPlayed: state.stats.gamesPlayed + 1
      };
      setTimeout(() => playSound('win'), 500);
    } else if (playerScore < newScore) {
      console.log('Dealer wins!');
      result.message = '💔 Dealer wins';
      result.stats = {
        ...state.stats,
        losses: state.stats.losses + 1,
        currentStreak: 0,
        biggestLoss: Math.max(state.stats.biggestLoss, state.player.bet),
        gamesPlayed: state.stats.gamesPlayed + 1
      };
      setTimeout(() => playSound('lose'), 500);
    } else {
      console.log('Push - tie game');
      result.message = '🤝 Push';
      result.balance += state.player.bet;
      result.stats = {
        ...state.stats,
        pushes: state.stats.pushes + 1,
        gamesPlayed: state.stats.gamesPlayed + 1
      };
    }

    return result;
  }),

  resetGame: () => set((state) => ({
    ...initialState,
    balance: state.balance,
    stats: state.stats,
    settings: state.settings,
    deck: createDeck()
  })),

  toggleSound: () => set((state) => ({
    settings: {
      ...state.settings,
      soundEnabled: !state.settings.soundEnabled
    }
  })),

  toggleHints: () => set((state) => ({
    settings: {
      ...state.settings,
      hintsEnabled: !state.settings.hintsEnabled
    }
  }))
}));
