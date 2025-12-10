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
    
    console.log('Playing gong sound, audio context state:', ctx.state);
    
    // Create a gong-like sound using multiple oscillators with different frequencies
    // Gong sound is characterized by a rich harmonic series
    const baseFreq = 220; // A3
    const harmonics = [1, 2, 3, 4, 5, 6]; // Fundamental and harmonics
    
    harmonics.forEach((harmonic, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      // Use sawtooth wave for rich harmonics, then filter
      osc.type = 'sawtooth';
      osc.frequency.value = baseFreq * harmonic;
      
      // Low-pass filter to soften the sound
      filter.type = 'lowpass';
      filter.frequency.value = 2000;
      filter.Q.value = 1;
      
      const startTime = ctx.currentTime;
      const duration = 1.5;
      
      // Envelope: quick attack, slow decay - increased volume
      const maxGain = 0.3 / harmonic; // Increased from 0.15 to 0.3 for louder sound
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(maxGain, startTime + 0.01); // Higher harmonics quieter
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    });
    
    console.log('Gong sound started');
  } catch (e) {
    console.error("Gong sound playback failed", e);
  }
}
