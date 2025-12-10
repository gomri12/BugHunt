
// Simple synth-based sound effect to avoid external assets for this demo
export const playSuccessSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
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

export const playMilestoneSound = () => {
    try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    
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
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) {
      console.warn('AudioContext not available');
      return;
    }
    
    const ctx = new AudioContext();
    
    // Resume context if suspended (required by browser autoplay policy)
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (err) {
        console.warn('Failed to resume audio context:', err);
        return; // Don't play sound if we can't resume
      }
    }
    
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
      
      // Envelope: quick attack, slow decay
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.15 / harmonic, startTime + 0.01); // Higher harmonics quieter
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    });
    
  } catch (e) {
    console.error("Gong sound playback failed", e);
  }
}
