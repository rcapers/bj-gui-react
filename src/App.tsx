import { Box, VStack } from '@chakra-ui/react'
import { GameTable } from './components/GameTable'
import { Controls } from './components/Controls'
import { Stats } from './components/Stats'
import { Settings } from './components/Settings'

function App() {
  return (
    <Box 
      minH="100vh" 
      bg="gray.900" 
      color="white" 
      p={4}
    >
      <VStack spacing={8} align="center">
        <Settings />
        <GameTable />
        <Controls />
        <Stats />
      </VStack>
    </Box>
  )
}

export default App
