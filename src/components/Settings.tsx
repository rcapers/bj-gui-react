import { Box, HStack, IconButton, Text } from '@chakra-ui/react'
import { FaSun, FaMoon, FaVolumeUp, FaVolumeMute, FaLightbulb } from 'react-icons/fa'
import { useGameStore } from '../store/gameStore'

export const Settings = () => {
  const { settings, toggleSound, toggleHints } = useGameStore()

  return (
    <HStack spacing={4} p={4}>
      <Box>
        <IconButton
          aria-label="Toggle sound"
          icon={settings.soundEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
          onClick={toggleSound}
          colorScheme={settings.soundEnabled ? 'green' : 'gray'}
        />
        <Text fontSize="sm" textAlign="center" mt={1}>
          Sound
        </Text>
      </Box>

      <Box>
        <IconButton
          aria-label="Toggle hints"
          icon={<FaLightbulb />}
          onClick={toggleHints}
          colorScheme={settings.hintsEnabled ? 'yellow' : 'gray'}
        />
        <Text fontSize="sm" textAlign="center" mt={1}>
          Hints
        </Text>
      </Box>
    </HStack>
  )
}
