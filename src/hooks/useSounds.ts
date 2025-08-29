import { useCallback, useRef } from 'react';

export const useSounds = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isEnabledRef = useRef(true);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Audio context not supported:', error);
        return null;
      }
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback((soundType: 'success' | 'alert' | 'timer' | 'complete') => {
    if (!isEnabledRef.current) return;
    
    const audioContext = initAudioContext();
    if (!audioContext) return;

    // Resume audio context if suspended (browser policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    const frequencies = {
      success: [523, 659, 784], // C, E, G (major chord)
      alert: [880, 660, 880], // A, E, A (alert pattern)
      timer: [440, 523, 659], // A, C, E (ascending)
      complete: [659, 784, 880, 1047], // E, G, A, C (completion fanfare)
    };

    const freq = frequencies[soundType];
    const duration = soundType === 'complete' ? 0.4 : 0.3;
    const volume = 0.1;
    
    freq.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = soundType === 'complete' ? 'triangle' : 'sine';
      
      const startTime = audioContext.currentTime + index * 0.1;
      const endTime = startTime + duration;
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);
      
      oscillator.start(startTime);
      oscillator.stop(endTime);
    });
  }, [initAudioContext]);

  const enableSounds = useCallback((enabled: boolean) => {
    isEnabledRef.current = enabled;
  }, []);

  // Test sound to initialize audio context with user interaction
  const testSound = useCallback(() => {
    playSound('success');
  }, [playSound]);

  return {
    playSound,
    enableSounds,
    testSound,
  };
};



