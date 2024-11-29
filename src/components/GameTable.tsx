import { Box, HStack, VStack, Text, Image } from '@chakra-ui/react'
import { useGameStore } from '../store/gameStore'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '../types/game'

const MotionBox = motion(Box)

const calculateScore = (hand: Card[]): number => {
  let score = 0
  let aces = 0

  for (const card of hand) {
    if (card.hidden) continue
    
    if (card.value === 'A') {
      aces += 1
      score += 11
    } else if (['K', 'Q', 'J'].includes(card.value)) {
      score += 10
    } else {
      score += parseInt(card.value)
    }
  }

  while (score > 21 && aces > 0) {
    score -= 10
    aces -= 1
  }

  return score
}

interface CardProps {
  card: Card
  index: number
}

const CardComponent = ({ card, index }: CardProps) => {
  const cardValue = card.value === '10' ? '0' : card.value
  const cardPath = card.hidden 
    ? 'https://deckofcardsapi.com/static/img/back.png'
    : `https://deckofcardsapi.com/static/img/${cardValue}${card.suit.charAt(0).toUpperCase()}.png`

  return (
    <MotionBox
      initial={{ scale: 0, x: -300 }}
      animate={{ scale: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ y: -10 }}
    >
      <Image
        src={cardPath}
        alt={card.hidden ? 'Hidden Card' : `${card.value} of ${card.suit}`}
        h="150px"
        w="auto"
        filter="drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.3))"
      />
    </MotionBox>
  )
}

export const GameTable = () => {
  const { player, dealer, gamePhase, message, currentHint, settings } = useGameStore()

  // Handle dealer's turn
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const dealerPlay = async () => {
      if (gamePhase !== 'dealerTurn') return

      // Get fresh state
      const store = useGameStore.getState()
      
      // First reveal hidden card
      const updatedDealer = {
        ...store.dealer,
        hand: store.dealer.hand.map(card => ({ ...card, hidden: false }))
      }
      const dealerScore = calculateScore(updatedDealer.hand)
      useGameStore.setState({ dealer: { ...updatedDealer, score: dealerScore } })

      // Wait a bit before starting dealer's turn
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Keep drawing cards until dealer has 17 or more
      let currentState = useGameStore.getState()
      let currentScore = dealerScore
      let currentHand = updatedDealer.hand
      let currentDeck = [...currentState.deck]

      while (currentScore < 17) {
        const newCard = currentDeck.pop()
        if (!newCard) break

        currentHand = [...currentHand, newCard]
        currentScore = calculateScore(currentHand)

        useGameStore.setState({
          dealer: {
            ...currentState.dealer,
            hand: currentHand,
            score: currentScore
          },
          deck: currentDeck
        })

        // Wait between each card
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Determine winner
      const finalState = useGameStore.getState()
      const playerScore = finalState.player.score

      if (currentScore > 21) {
        // Dealer busts, player wins
        const winnings = finalState.player.bet * 2
        useGameStore.setState({
          balance: finalState.balance + winnings,
          gamePhase: 'gameOver',
          message: 'Dealer busts! You win!',
          stats: {
            ...finalState.stats,
            wins: finalState.stats.wins + 1,
            currentStreak: finalState.stats.currentStreak + 1,
            bestStreak: Math.max(finalState.stats.bestStreak, finalState.stats.currentStreak + 1),
            biggestWin: Math.max(finalState.stats.biggestWin, finalState.player.bet)
          }
        })
      } else if (currentScore < playerScore) {
        // Player has higher score
        const winnings = finalState.player.bet * 2
        useGameStore.setState({
          balance: finalState.balance + winnings,
          gamePhase: 'gameOver',
          message: 'You win!',
          stats: {
            ...finalState.stats,
            wins: finalState.stats.wins + 1,
            currentStreak: finalState.stats.currentStreak + 1,
            bestStreak: Math.max(finalState.stats.bestStreak, finalState.stats.currentStreak + 1),
            biggestWin: Math.max(finalState.stats.biggestWin, finalState.player.bet)
          }
        })
      } else if (currentScore === playerScore) {
        // Push
        useGameStore.setState({
          balance: finalState.balance + finalState.player.bet,
          gamePhase: 'gameOver',
          message: 'Push!',
          stats: {
            ...finalState.stats,
            pushes: finalState.stats.pushes + 1
          }
        })
      } else {
        // Dealer wins
        useGameStore.setState({
          gamePhase: 'gameOver',
          message: 'Dealer wins!',
          stats: {
            ...finalState.stats,
            losses: finalState.stats.losses + 1,
            currentStreak: 0,
            biggestLoss: Math.max(finalState.stats.biggestLoss, finalState.player.bet)
          }
        })
      }
    }

    if (gamePhase === 'dealerTurn') {
      timeoutId = setTimeout(dealerPlay, 500)
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [gamePhase])

  return (
    <Box 
      w="100%" 
      maxW="1000px" 
      h="700px" 
      bg="green.800" 
      borderRadius="xl" 
      p={8}
      position="relative"
      boxShadow="2xl"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      {/* Dealer Section */}
      <VStack spacing={4} align="center" mb={8}>
        <Text fontSize="2xl" fontWeight="bold" color="white">
          Dealer
        </Text>
        <HStack spacing={-4} justify="center">
          {dealer.hand.map((card, index) => (
            <CardComponent key={index} card={card} index={index} />
          ))}
        </HStack>
        <Text fontSize="xl" color="white">
          Score: {dealer.score}
        </Text>
      </VStack>

      {/* Message Area */}
      {message && (
        <Box 
          position="absolute" 
          left="50%" 
          top="50%" 
          transform="translate(-50%, -50%)"
          bg="blackAlpha.900"
          px={8}
          py={4}
          borderRadius="xl"
          boxShadow="dark-lg"
          border="1px solid"
          borderColor="whiteAlpha.200"
          backdropFilter="blur(8px)"
          zIndex={10}
          minW="300px"
        >
          <Text 
            fontSize="3xl" 
            fontWeight="bold" 
            color="white"
            textAlign="center"
            textShadow="0 2px 4px rgba(0,0,0,0.4)"
          >
            {message}
          </Text>
        </Box>
      )}

      {/* Hint Area */}
      {settings.hintsEnabled && currentHint && gamePhase === 'playerTurn' && (
        <Box
          position="absolute"
          left="50%"
          bottom="250px"
          transform="translateX(-50%)"
          bg="blackAlpha.800"
          px={4}
          py={2}
          borderRadius="lg"
          boxShadow="dark-lg"
          border="1px solid"
          borderColor="whiteAlpha.200"
          backdropFilter="blur(4px)"
        >
          <Text
            fontSize="lg"
            color="green.300"
            textAlign="center"
            fontStyle="italic"
          >
            Hint: {currentHint}
          </Text>
        </Box>
      )}

      {/* Center Spacer */}
      <Box flex={1} minH="100px" />

      {/* Player Section */}
      <VStack spacing={4} align="center" mt={8}>
        <Text fontSize="2xl" fontWeight="bold" color="white">
          Your Hand
        </Text>
        <HStack spacing={-4} justify="center">
          {player.hand.map((card, index) => (
            <CardComponent key={index} card={card} index={index} />
          ))}
        </HStack>
        <Text fontSize="xl" color="white">
          Score: {player.score}
        </Text>
      </VStack>
    </Box>
  )
}
