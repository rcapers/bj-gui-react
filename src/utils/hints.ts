import { Card } from '../types/game';

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

export const getHint = (playerHand: Card[], dealerHand: Card[]): string => {
  const playerScore = calculateScore(playerHand);
  const dealerUpCard = dealerHand[0];
  const dealerValue = dealerUpCard.value === 'A' ? 11 : 
    ['K', 'Q', 'J'].includes(dealerUpCard.value) ? 10 : 
    parseInt(dealerUpCard.value);

  // Basic Strategy
  if (playerScore >= 17) {
    return 'Stand with 17 or higher';
  }

  if (playerScore <= 8) {
    return 'Hit with 8 or lower';
  }

  // Check for soft hands (hands with an Ace counted as 11)
  const hasAce = playerHand.some(card => card.value === 'A');
  if (hasAce && playerScore <= 21) {
    if (playerScore >= 19) {
      return 'Stand with soft 19 or higher';
    }
    if (playerScore === 18) {
      return dealerValue >= 9 ? 'Hit on soft 18 vs 9 or higher' : 'Stand on soft 18 vs 8 or lower';
    }
    return 'Hit on soft 17 or lower';
  }

  // Hard hands
  if (playerScore === 16) {
    return dealerValue >= 7 ? 'Hit on 16 vs 7 or higher' : 'Stand on 16 vs 6 or lower';
  }

  if (playerScore === 15) {
    return dealerValue >= 7 ? 'Hit on 15 vs 7 or higher' : 'Stand on 15 vs 6 or lower';
  }

  if (playerScore === 13 || playerScore === 14) {
    return dealerValue >= 7 ? 'Hit on 13-14 vs 7 or higher' : 'Stand on 13-14 vs 6 or lower';
  }

  if (playerScore === 12) {
    return (dealerValue >= 7 || dealerValue <= 3) ? 'Hit on 12 vs 7+ or 2-3' : 'Stand on 12 vs 4-6';
  }

  if (playerScore === 11) {
    return 'Double down on 11 (Hit if double down not allowed)';
  }

  if (playerScore === 10) {
    return dealerValue >= 10 ? 'Hit on 10 vs 10+' : 'Double down on 10 vs 9 or lower';
  }

  if (playerScore === 9) {
    return (dealerValue >= 7 || dealerValue === 2) ? 'Hit on 9 vs 7+ or 2' : 'Double down on 9 vs 3-6';
  }

  return 'Hit';
};
