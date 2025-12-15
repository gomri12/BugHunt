// Shared audio context for all sounds
let sharedAudioContext: AudioContext | null = null;

const getAudioContext = async (): Promise<AudioContext | null> => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) {
      console.warn('AudioContext not available');
      return null;
    }

    // Create or reuse shared context
    if (!sharedAudioContext) {
      sharedAudioContext = new AudioContext();
    }

    // Resume if suspended (required by browser autoplay policy)
    if (sharedAudioContext.state === 'suspended') {
      try {
        await sharedAudioContext.resume();
        console.log('Audio context resumed');
      } catch (err) {
        console.warn('Failed to resume audio context:', err);
        return null;
      }
    }

    return sharedAudioContext;
  } catch (e) {
    console.error('Error getting audio context:', e);
    return null;
  }
};

// Initialize audio context on first user interaction
if (typeof window !== 'undefined') {
  const initAudio = async () => {
    await getAudioContext();
    // Remove listeners after first initialization
    window.removeEventListener('click', initAudio);
    window.removeEventListener('touchstart', initAudio);
  };
  window.addEventListener('click', initAudio, { once: true });
  window.addEventListener('touchstart', initAudio, { once: true });
}

// Simple synth-based sound effect to avoid external assets for this demo
export const playSuccessSound = async () => {
  try {
    const ctx = await getAudioContext();
    if (!ctx) return;
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(500, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export const playMilestoneSound = async () => {
    try {
    const ctx = await getAudioContext();
    if (!ctx) return;
    
    // Play a major chord arpeggio
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.value = freq;
        
        const startTime = ctx.currentTime + (i * 0.1);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
        
        osc.start(startTime);
        osc.stop(startTime + 0.6);
    });

  } catch (e) {
    console.error("Audio playback failed", e);
  }
}

export const playGongSound = async () => {
  try {
    const ctx = await getAudioContext();
    if (!ctx) {
      console.warn('AudioContext not available for gong sound');
      return;
    }
    
    console.log('Playing happy gong sound, audio context state:', ctx.state);
    
    // Create a happy, cheerful gong sound using a major chord
    // Using C major chord frequencies for a bright, happy sound
    const frequencies = [
      261.63,  // C4 - root
      329.63,  // E4 - major third (happy interval)
      392.00,  // G4 - perfect fifth
      523.25,  // C5 - octave
    ];
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      // Use triangle wave for a softer, more pleasant sound
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      // Slight high-pass filter to brighten the sound
      filter.type = 'highpass';
      filter.frequency.value = 100;
      filter.Q.value = 0.5;
      
      const startTime = ctx.currentTime + (i * 0.05); // Slight stagger for chord effect
      const duration = 1.2;
      
      // Envelope: quick attack, longer sustain, slow decay - MUCH LOUDER
      const maxGain = 0.6 / (i + 1); // Much louder - 0.6 base, decreasing for higher notes
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(maxGain, startTime + 0.02); // Quick attack
      gain.gain.setValueAtTime(maxGain, startTime + 0.1); // Sustain
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // Slow decay
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    });
    
    // Add a bright "ting" sound for extra happiness
    setTimeout(() => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.value = 1046.50; // C6 - high, bright note
      
      const startTime = ctx.currentTime;
      const duration = 0.3;
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.4, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    }, 100);
    
    console.log('Happy gong sound started');
  } catch (e) {
    console.error("Gong sound playback failed", e);
  }
}

// Random \"Great Success\" sounds from local media folder
// These imports assume a top-level `media/` folder in the project root.
// Vite will bundle these files and give us URLs at build time.
import boratKing from '../media/borat-king-in-the-castle-audiotrimmer.mp3';
import boratGreatSuccess from '../media/great-success-borat.mp3';
import boratVeryNice from '../media/its-a-very-nice.mp3';

// Optional extra URL from env, if you want to add more sounds without rebuilding
const GREAT_SUCCESS_URL = (import.meta as any).env?.VITE_GREAT_SUCCESS_URL as string | undefined;

const GREAT_SUCCESS_SOUNDS: string[] = [
  boratKing,
  boratGreatSuccess,
  boratVeryNice,
  GREAT_SUCCESS_URL,
].filter(Boolean) as string[];

export const playGreatSuccessSound = async () => {
  try {
    // Prefer random sound from bundled media (and optional env URL)
    if (GREAT_SUCCESS_SOUNDS.length > 0) {
      const index = Math.floor(Math.random() * GREAT_SUCCESS_SOUNDS.length);
      const url = GREAT_SUCCESS_SOUNDS[index];
      const audio = new Audio(url);
      await audio.play();
      return;
    }

    // Fallback to existing happy gong sound if no media configured
    await playGongSound();
  } catch (e) {
    console.error('Great Success sound playback failed', e);
    // Last fallback: simple success synth
    await playSuccessSound();
  }
};
