import { create } from 'zustand';
import { GameState, Card, Suit, Value, GamePhase, Settings } from '../types/game';
import { playSound } from '../utils/sounds';
import { getHint } from '../utils/hints';

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
  currentHint: '',
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
    if (state.gamePhase !== 'dealing' || state.player.bet === 0) return state;

    const newDeck = [...state.deck];
    const playerCard1 = newDeck.pop()!;
    const playerCard2 = newDeck.pop()!;
    const dealerCard1 = newDeck.pop()!;
    const dealerCard2 = { ...newDeck.pop()!, hidden: true };

    // Initial deal with first card only
    const initialState = {
      ...state,
      deck: newDeck,
      player: { 
        ...state.player, 
        hand: [playerCard1],
        score: calculateScore([playerCard1])
      },
      dealer: { 
        ...state.dealer, 
        hand: [],
        score: 0
      },
      gamePhase: 'playerTurn',
      message: 'Dealing cards...'
    };

    // Schedule the remaining cards
    setTimeout(() => {
      set(state => ({
        ...state,
        dealer: {
          ...state.dealer,
          hand: [dealerCard1],
          score: calculateScore([dealerCard1])
        }
      }));
      playSound('cardSlide', state.settings);
    }, 300);

    setTimeout(() => {
      set(state => ({
        ...state,
        player: {
          ...state.player,
          hand: [playerCard1, playerCard2],
          score: calculateScore([playerCard1, playerCard2])
        }
      }));
      playSound('cardSlide', state.settings);
    }, 600);

    setTimeout(() => {
      set(state => {
        const finalDealerHand = [dealerCard1, dealerCard2];
        const playerScore = calculateScore([playerCard1, playerCard2]);
        const currentHint = state.settings.hintsEnabled ? getHint([playerCard1, playerCard2], finalDealerHand) : '';

        // Check for blackjack
        if (playerScore === 21) {
          playSound('win', state.settings);
          return {
            ...state,
            dealer: {
              ...state.dealer,
              hand: finalDealerHand,
              score: calculateScore([dealerCard1])
            },
            message: ' Blackjack! You win!',
            balance: state.balance + Math.floor(state.player.bet * 2.5),
            gamePhase: 'gameOver',
            stats: {
              ...state.stats,
              wins: state.stats.wins + 1,
              currentStreak: state.stats.currentStreak + 1,
              longestStreak: Math.max(state.stats.longestStreak, state.stats.currentStreak + 1),
              biggestWin: Math.max(state.stats.biggestWin, state.player.bet * 1.5),
              gamesPlayed: state.stats.gamesPlayed + 1
            },
            currentHint
          };
        }

        return {
          ...state,
          dealer: {
            ...state.dealer,
            hand: finalDealerHand,
            score: calculateScore([dealerCard1])
          },
          message: 'Your turn!',
          currentHint
        };
      });
      playSound('cardSlide', state.settings);
    }, 900);

    // Play the first card sound immediately
    playSound('cardSlide', state.settings);
    
    return initialState;
  }),

  hit: () => set((state) => {
    if (state.gamePhase !== 'playerTurn') return state;
    
    const newDeck = [...state.deck];
    const newHand = [...state.player.hand, newDeck.pop()!];
    const newScore = calculateScore(newHand);

    const currentHint = state.settings.hintsEnabled ? getHint(newHand, state.dealer.hand) : '';

    playSound('cardSlide', state.settings);
    
    if (newScore > 21) {
      setTimeout(() => playSound('lose', state.settings), 300);
      return {
        ...state,
        deck: newDeck,
        player: { ...state.player, hand: newHand, score: newScore },
        gamePhase: 'gameOver',
        message: ' Bust!',
        stats: {
          ...state.stats,
          losses: state.stats.losses + 1,
          currentStreak: 0,
          biggestLoss: Math.max(state.stats.biggestLoss, state.player.bet),
          gamesPlayed: state.stats.gamesPlayed + 1
        },
        currentHint
      };
    }
    
    return {
      ...state,
      deck: newDeck,
      player: { ...state.player, hand: newHand, score: newScore },
      message: 'Your turn',
      currentHint
    };
  }),

  stand: () => set((state) => {
    // First reveal dealer's card with a flip sound
    playSound('cardFlip', state.settings);
    
    // Update state to reveal dealer's card and change phase
    const newState = {
      ...state,
      gamePhase: 'dealerTurn',
      message: ' Dealer\'s turn',
      dealer: {
        ...state.dealer,
        hand: state.dealer.hand.map(card => ({ ...card, hidden: false }))
      }
    };

    // Schedule dealer's play after a short delay to let the flip animation complete
    setTimeout(() => {
      set((state) => {
        if (state.gamePhase !== 'dealerTurn') return state;

        const newDeck = [...state.deck];
        const newHand = [...state.dealer.hand];
        let newScore = calculateScore(newHand);

        // Deal dealer cards
        while (newScore < 17) {
          const newCard = newDeck.pop()!;
          newHand.push(newCard);
          newScore = calculateScore(newHand);
          playSound('cardSlide', state.settings);
        }

        const playerScore = state.player.score;
        const result = {
          deck: newDeck,
          dealer: { ...state.dealer, hand: newHand, score: newScore },
          gamePhase: 'gameOver' as const,
          message: '',
          balance: state.balance,
          stats: { ...state.stats },
          currentHint: ''
        };

        // Determine outcome and play sound
        if (newScore > 21) {
          result.message = ' You win! Dealer bust!';
          result.balance += state.player.bet * 2;
          result.stats = {
            ...state.stats,
            wins: state.stats.wins + 1,
            currentStreak: state.stats.currentStreak + 1,
            longestStreak: Math.max(state.stats.longestStreak, state.stats.currentStreak + 1),
            biggestWin: Math.max(state.stats.biggestWin, state.player.bet),
            gamesPlayed: state.stats.gamesPlayed + 1
          };
          playSound('win', state.settings);
        } else if (playerScore > newScore) {
          result.message = ' You win!';
          result.balance += state.player.bet * 2;
          result.stats = {
            ...state.stats,
            wins: state.stats.wins + 1,
            currentStreak: state.stats.currentStreak + 1,
            longestStreak: Math.max(state.stats.longestStreak, state.stats.currentStreak + 1),
            biggestWin: Math.max(state.stats.biggestWin, state.player.bet),
            gamesPlayed: state.stats.gamesPlayed + 1
          };
          playSound('win', state.settings);
        } else if (playerScore < newScore && newScore <= 21) {
          result.message = ' Dealer wins';
          result.stats = {
            ...state.stats,
            losses: state.stats.losses + 1,
            currentStreak: 0,
            biggestLoss: Math.max(state.stats.biggestLoss, state.player.bet),
            gamesPlayed: state.stats.gamesPlayed + 1
          };
          playSound('lose', state.settings);
        } else {
          result.message = ' Push';
          result.balance += state.player.bet;
          result.stats = {
            ...state.stats,
            pushes: state.stats.pushes + 1,
            gamesPlayed: state.stats.gamesPlayed + 1
          };
          playSound('cardFlip', state.settings);
        }

        return result;
      });
    }, 500);

    return newState;
  }),

  double: () => set((state) => {
    if (state.balance < state.player.bet) return state;
    
    const newDeck = [...state.deck];
    const newCard = newDeck.pop()!;
    const newHand = [...state.player.hand, newCard];
    const newScore = calculateScore(newHand);

    const currentHint = state.settings.hintsEnabled ? getHint(newHand, state.dealer.hand) : '';

    playSound('chipStack', state.settings);
    setTimeout(() => playSound('cardSlide', state.settings), 300);
    
    if (newScore > 21) {
      playSound('lose', state.settings);
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
        message: ' Bust!',
        stats: {
          ...state.stats,
          losses: state.stats.losses + 1,
          currentStreak: 0,
          biggestLoss: Math.max(state.stats.biggestLoss, state.player.bet * 2),
          gamesPlayed: state.stats.gamesPlayed + 1
        },
        currentHint
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
      message: ' Dealer\'s turn',
      dealer: {
        ...state.dealer,
        hand: state.dealer.hand.map(card => ({ ...card, hidden: false }))
      },
      currentHint
    };
  }),

  dealerPlay: () => set((state) => {
    console.log('Starting dealerPlay');
    if (state.gamePhase !== 'dealerTurn') {
      console.log('Not dealer turn, returning');
      return state;
    }

    const newDeck = [...state.deck];
    const newHand = [...state.dealer.hand];
    let newScore = calculateScore(newHand);
    console.log('Initial dealer score:', newScore);

    // Deal dealer cards
    while (newScore < 17) {
      const newCard = newDeck.pop()!;
      newHand.push(newCard);
      newScore = calculateScore(newHand);
      console.log('Dealer drew card, new score:', newScore);
      playSound('cardSlide', state.settings);
    }

    const playerScore = state.player.score;
    console.log('Comparing scores:', { player: playerScore, dealer: newScore });

    // Create the result state first
    const result = {
      deck: newDeck,
      dealer: { ...state.dealer, hand: newHand, score: newScore },
      gamePhase: 'gameOver' as const,
      message: '',
      balance: state.balance,
      stats: { ...state.stats },
      currentHint: ''
    };

    // Determine outcome and play sound immediately
    if (newScore > 21) {
      console.log('OUTCOME: Dealer bust - Playing win sound');
      result.message = ' You win! Dealer bust!';
      result.balance += state.player.bet * 2;
      result.stats = {
        ...state.stats,
        wins: state.stats.wins + 1,
        currentStreak: state.stats.currentStreak + 1,
        longestStreak: Math.max(state.stats.longestStreak, state.stats.currentStreak + 1),
        biggestWin: Math.max(state.stats.biggestWin, state.player.bet),
        gamesPlayed: state.stats.gamesPlayed + 1
      };
      console.log('About to play win sound');
      playSound('win', state.settings);
      console.log('Win sound played');
    } else if (playerScore > newScore) {
      console.log('OUTCOME: Player wins with higher score - Playing win sound');
      result.message = ' You win!';
      result.balance += state.player.bet * 2;
      result.stats = {
        ...state.stats,
        wins: state.stats.wins + 1,
        currentStreak: state.stats.currentStreak + 1,
        longestStreak: Math.max(state.stats.longestStreak, state.stats.currentStreak + 1),
        biggestWin: Math.max(state.stats.biggestWin, state.player.bet),
        gamesPlayed: state.stats.gamesPlayed + 1
      };
      console.log('About to play win sound');
      playSound('win', state.settings);
      console.log('Win sound played');
    } else if (playerScore < newScore && newScore <= 21) {
      console.log('OUTCOME: Dealer wins - Playing lose sound');
      result.message = ' Dealer wins';
      result.stats = {
        ...state.stats,
        losses: state.stats.losses + 1,
        currentStreak: 0,
        biggestLoss: Math.max(state.stats.biggestLoss, state.player.bet),
        gamesPlayed: state.stats.gamesPlayed + 1
      };
      console.log('About to play lose sound');
      playSound('lose', state.settings);
      console.log('Lose sound played');
    } else {
      console.log('OUTCOME: Push - Playing cardFlip sound');
      result.message = ' Push';
      result.balance += state.player.bet;
      result.stats = {
        ...state.stats,
        pushes: state.stats.pushes + 1,
        gamesPlayed: state.stats.gamesPlayed + 1
      };
      console.log('About to play cardFlip sound');
      playSound('cardFlip', state.settings);
      console.log('CardFlip sound played');
    }

    console.log('Returning final state with message:', result.message);
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
