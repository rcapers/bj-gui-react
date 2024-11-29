import { HStack, Button, VStack, Text, Box } from '@chakra-ui/react'
import { useGameStore } from '../store/gameStore'
import { motion } from 'framer-motion'

const MotionButton = motion(Button)

const CHIP_VALUES = [5, 25, 100, 500]

const getChipColor = (value: number) => {
  switch (value) {
    case 5: return { bg: 'red.500', hover: 'red.400' }
    case 25: return { bg: 'green.500', hover: 'green.400' }
    case 100: return { bg: 'blue.500', hover: 'blue.400' }
    case 500: return { bg: 'purple.500', hover: 'purple.400' }
    default: return { bg: 'gray.500', hover: 'gray.400' }
  }
}

export const Controls = () => {
  const { gamePhase, player, balance, placeBet, hit, stand, double, resetGame, dealCards } = useGameStore()

  const handleChipClick = (value: number) => {
    if (value > balance) {
      return // Chip is disabled anyway, but extra safety check
    }
    placeBet(value)
    dealCards()
  }

  const renderControls = () => {
    if (gamePhase === 'betting') {
      return (
        <Box>
          <Text 
            fontSize="xl" 
            fontWeight="bold" 
            color="white" 
            textAlign="center"
            mb={4}
          >
            Balance: ${balance}
          </Text>
          <HStack spacing={4} justify="center">
            {CHIP_VALUES.map((value) => {
              const chipColor = getChipColor(value)
              const isDisabled = value > balance
              
              return (
                <MotionButton
                  key={value}
                  whileHover={{ scale: 1.1, y: -5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleChipClick(value)}
                  size="lg"
                  bg={chipColor.bg}
                  _hover={{ bg: chipColor.hover }}
                  isDisabled={isDisabled}
                  opacity={isDisabled ? 0.5 : 1}
                  borderRadius="full"
                  h="70px"
                  w="70px"
                  boxShadow="lg"
                  border="4px solid"
                  borderColor={isDisabled ? 'gray.600' : 'whiteAlpha.300'}
                  color="white"
                  fontSize="xl"
                  fontWeight="bold"
                  _disabled={{
                    opacity: 0.5,
                    cursor: 'not-allowed',
                    _hover: { bg: chipColor.bg }
                  }}
                >
                  ${value}
                </MotionButton>
              )
            })}
          </HStack>
        </Box>
      )
    }

    if (gamePhase === 'playing') {
      return (
        <Box>
          <Text 
            fontSize="xl" 
            fontWeight="bold" 
            color="white" 
            textAlign="center"
            mb={4}
          >
            Current Bet: ${player.bet}
          </Text>
          <HStack spacing={4} justify="center">
            <MotionButton
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={hit}
              colorScheme="green"
              size="lg"
              px={8}
              fontSize="xl"
            >
              Hit
            </MotionButton>
            <MotionButton
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={stand}
              colorScheme="red"
              size="lg"
              px={8}
              fontSize="xl"
            >
              Stand
            </MotionButton>
            <MotionButton
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={double}
              colorScheme="purple"
              size="lg"
              px={8}
              fontSize="xl"
              isDisabled={player.bet > balance || player.hand.length > 2}
            >
              Double
            </MotionButton>
          </HStack>
        </Box>
      )
    }

    if (gamePhase === 'gameOver') {
      return (
        <Box>
          <Text 
            fontSize="xl" 
            fontWeight="bold" 
            color="white" 
            textAlign="center"
            mb={4}
          >
            Balance: ${balance}
          </Text>
          <HStack justify="center">
            <MotionButton
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={resetGame}
              colorScheme="blue"
              size="lg"
              px={8}
              fontSize="xl"
            >
              New Hand
            </MotionButton>
          </HStack>
        </Box>
      )
    }

    return null
  }

  return (
    <Box
      w="100%"
      maxW="1000px"
      bg="blackAlpha.300"
      p={6}
      borderRadius="xl"
      mt={4}
    >
      {renderControls()}
    </Box>
  )
}
