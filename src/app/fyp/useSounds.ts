
import { useCallback } from 'react';

// In a real app, these would be URLs to actual audio files
const sounds = {
  success: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=', // Placeholder
  fail: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=',    // Placeholder
  swipe: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=',   // Placeholder
};

export const useSounds = () => {
  const playSound = useCallback((soundFile: string) => {
    try {
      // Create a new audio context on user interaction to comply with browser policies
      const audio = new Audio(soundFile);
      audio.volume = 0.3;
      audio.play().catch(e => console.error("Audio playback failed:", e));
    } catch (error) {
        console.error("Could not play sound", error);
    }
  }, []);

  const playSuccess = useCallback(() => {
    // A slightly more realistic sound placeholder
    playSound("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"+Array(30).join("12345678"));
  }, [playSound]);

  const playFail = useCallback(() => {
    playSound("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"+Array(30).join("87654321"));
  }, [playSound]);

  const playSwipe = useCallback(() => {
    playSound("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"+Array(20).join("56781234"));
  }, [playSound]);

  return { playSuccess, playFail, playSwipe };
};
