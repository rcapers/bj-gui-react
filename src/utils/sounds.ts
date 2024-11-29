import { useGameStore } from '../store/gameStore';

// Pre-load audio files
const sounds = {
  cardFlip: new Audio('/sounds/card-flip.mp3'),
  cardSlide: new Audio('/sounds/card-slide.mp3'),
  win: new Audio('/sounds/win.mp3'),
  lose: new Audio('/sounds/lose.mp3')
};

// Adjust volumes individually
sounds.cardFlip.volume = 0.5;
sounds.cardSlide.volume = 0.5;
sounds.win.volume = 0.7;    // Increased win volume
sounds.lose.volume = 0.7;   // Increased lose volume

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

export const playSound = (soundName: 'cardFlip' | 'cardSlide' | 'win' | 'lose') => {
  const { settings } = useGameStore.getState();
  if (!settings.soundEnabled) {
    console.log('Sound disabled, not playing:', soundName);
    return;
  }

  console.log('Attempting to play sound:', soundName);

  const sound = sounds[soundName];
  if (!sound) {
    console.error(`Sound not found: ${soundName}`);
    return;
  }

  try {
    // Create a new instance and play immediately
    const clone = sound.cloneNode() as HTMLAudioElement;
    clone.volume = sound.volume;
    
    // Add error listener
    clone.addEventListener('error', (e) => {
      console.error(`Error playing sound ${soundName}:`, e);
    });

    // Add success listener
    clone.addEventListener('playing', () => {
      console.log(`Sound ${soundName} started playing`);
    });

    const playPromise = clone.play();
    if (playPromise) {
      playPromise.catch(error => {
        console.error(`Error playing sound ${soundName}:`, error);
      });
    }
  } catch (error) {
    console.error(`Exception playing sound ${soundName}:`, error);
  }
};
