// Global sound utility
let audioContext: AudioContext | null = null;
let soundsEnabled = true;

const initAudioContext = (): AudioContext | null => {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Audio context not supported:', error);
      return null;
    }
  }
  return audioContext;
};

export const playSound = (soundType: 'success' | 'alert' | 'timer' | 'complete') => {
  if (!soundsEnabled) return;
  
  const ctx = initAudioContext();
  if (!ctx) return;

  // Resume audio context if suspended (browser policy)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  
  const frequencies = {
    success: [523, 659, 784], // C, E, G (major chord)
    alert: [880, 660, 880], // A, E, A (alert pattern)
    timer: [440, 523, 659], // A, C, E (ascending)
    complete: [659, 784, 880, 1047], // E, G, A, C (completion fanfare)
  };

  const freq = frequencies[soundType];
  const duration = soundType === 'complete' ? 0.4 : 0.3;
  const volume = 0.08; // Reduced volume for less intrusive sounds
  
  freq.forEach((frequency, index) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    oscillator.type = soundType === 'complete' ? 'triangle' : 'sine';
    
    const startTime = ctx.currentTime + index * 0.1;
    const endTime = startTime + duration;
    
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);
    
    oscillator.start(startTime);
    oscillator.stop(endTime);
  });
};

export const enableSounds = (enabled: boolean) => {
  soundsEnabled = enabled;
};

export const testSound = () => {
  playSound('success');
};



