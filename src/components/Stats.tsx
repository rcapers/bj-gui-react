import { Box, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import { useGameStore } from '../store/gameStore'

export const Stats = () => {
  const { stats } = useGameStore()

  const statItems = [
    { label: 'Games Played', value: stats.gamesPlayed.toString() },
    { label: 'Wins', value: stats.wins.toString() },
    { label: 'Losses', value: stats.losses.toString() },
    { label: 'Pushes', value: stats.pushes.toString() },
    { label: 'Current Streak', value: stats.currentStreak.toString() },
    { label: 'Longest Streak', value: stats.longestStreak.toString() },
    { label: 'Biggest Win', value: `$${stats.biggestWin}` },
    { label: 'Biggest Loss', value: `$${stats.biggestLoss}` },
  ]

  return (
    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} w="100%" maxW="1200px">
      {statItems.map((item) => (
        <Box
          key={item.label}
          bg="gray.800"
          p={4}
          borderRadius="lg"
          borderWidth="1px"
          borderColor="gray.700"
          boxShadow="sm"
        >
          <VStack spacing={1} align="center">
            <Text fontSize="sm" color="gray.400">
              {item.label}
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="white">
              {item.value}
            </Text>
            {item.label.includes('Streak') && parseInt(item.value) > 0 && (
              <Text fontSize="sm" color="green.500">
                🔥 Hot Streak!
              </Text>
            )}
          </VStack>
        </Box>
      ))}
    </SimpleGrid>
  )
}
