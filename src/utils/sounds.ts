// Pre-load audio files
const sounds = {
  cardFlip: new Audio('/sounds/card-flip.mp3'),
  cardSlide: new Audio('/sounds/card-slide.mp3'),
  win: new Audio('/sounds/win.mp3'),
  lose: new Audio('/sounds/lose.mp3'),
  chipStack: new Audio('/sounds/card-flip.mp3')  // Using card-flip for now as a placeholder
};

// Adjust volumes individually
sounds.cardFlip.volume = 0.5;
sounds.cardSlide.volume = 0.5;
sounds.win.volume = 0.7;    // Increased win volume
sounds.lose.volume = 0.7;   // Increased lose volume
sounds.chipStack.volume = 0.5;

// Make sure sounds are loaded
Object.values(sounds).forEach(sound => {
  sound.load();
  sound.addEventListener('error', (e) => {
    console.error('Error loading sound:', e);
  });
  // Set sounds to start from beginning when played
  sound.addEventListener('ended', () => {
    sound.currentTime = 0;
  });
});

type GameSettings = {
  soundEnabled: boolean;
  hintsEnabled: boolean;
};

export const playSound = (soundName: keyof typeof sounds, settings: GameSettings) => {
  if (!settings?.soundEnabled) return;

  const sound = sounds[soundName];
  if (!sound) {
    console.error(`Sound not found: ${soundName}`);
    return;
  }

  try {
    // Reset the sound to the beginning
    sound.currentTime = 0;
    
    // Play the sound immediately
    sound.play()
      .catch(error => {
        console.error(`Error playing ${soundName}:`, error);
        // Try one more time
        setTimeout(() => {
          sound.currentTime = 0;
          sound.play().catch(e => console.error(`Retry failed for ${soundName}:`, e));
        }, 100);
      });
  } catch (error) {
    console.error(`Error playing sound ${soundName}:`, error);
  }
};
