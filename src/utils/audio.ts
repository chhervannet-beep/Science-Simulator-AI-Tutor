import { useState, useEffect } from "react";

// Local storage key
const STORAGE_KEY = "science_sim_sound_enabled";

// Helper to check state
export function getSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === null ? true : stored === "true";
}

// Helper to set state
export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
  // Dispatch a custom event to notify all listeners in the same window
  window.dispatchEvent(new CustomEvent("sound-toggle", { detail: enabled }));
}

// React hook for observing sound setting
export function useSoundEnabled() {
  const [enabled, setEnabled] = useState<boolean>(getSoundEnabled());

  useEffect(() => {
    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      setEnabled(customEvent.detail);
    };

    window.addEventListener("sound-toggle", handleToggle);
    return () => {
      window.removeEventListener("sound-toggle", handleToggle);
    };
  }, []);

  return [enabled, setSoundEnabled] as const;
}

// Web Audio synthesizer
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    // Standard AudioContext initialization
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  // Resume if suspended (browsers suspend audio contexts until user interaction)
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// --- SOUNDS ---

/**
 * Play a subtle rocket / cannon launch sound (downward sweep with lowpass)
 */
export function playLaunchSound() {
  if (!getSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;
  
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(600, now);
  filter.frequency.exponentialRampToValueAtTime(150, now + 0.25);

  osc.type = "triangle"; // Softer than sine/sawtooth
  osc.frequency.setValueAtTime(280, now);
  osc.frequency.exponentialRampToValueAtTime(70, now + 0.25);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  osc.start(now);
  osc.stop(now + 0.26);
}

/**
 * Play a subtle impact / bounce sound (short low thud)
 */
export function playImpactSound() {
  if (!getSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(150, now);

  osc.type = "sine";
  osc.frequency.setValueAtTime(90, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.18);

  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  osc.start(now);
  osc.stop(now + 0.19);
}

/**
 * Play a crisp element/particle increment sound (crystal chime)
 */
export function playAtomIncrementSound() {
  if (!getSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;

  osc.type = "sine";
  osc.frequency.setValueAtTime(523.25, now); // C5
  osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5 slide

  gain.gain.setValueAtTime(0.05, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  osc.start(now);
  osc.stop(now + 0.21);
}

/**
 * Play a crisp element/particle decrement sound (slightly lower crystal chime)
 */
export function playAtomDecrementSound() {
  if (!getSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;

  osc.type = "sine";
  osc.frequency.setValueAtTime(392.00, now); // G4
  osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.12); // C4 slide

  gain.gain.setValueAtTime(0.05, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  osc.start(now);
  osc.stop(now + 0.21);
}

/**
 * Play a satisfying stable compound sound (harmonic major chord fifth interval)
 */
export function playStableChordSound() {
  if (!getSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5 major triad

  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + idx * 0.04);

    gain.gain.setValueAtTime(0.04, now + idx * 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.start(now + idx * 0.04);
    osc.stop(now + 0.4);
  });
}

/**
 * Play an unstable atom warning hum (pulsing dual frequencies)
 */
export function playUnstableWarningSound() {
  if (!getSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.type = "sine";
  osc1.frequency.setValueAtTime(150, now);
  
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(154, now); // Beats at 4Hz

  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  osc1.start(now);
  osc1.stop(now + 0.41);
  osc2.start(now);
  osc2.stop(now + 0.41);
}

/**
 * Play generic light click sound for UI feedback
 */
export function playClickSound() {
  if (!getSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;

  osc.type = "sine";
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(900, now + 0.05);

  gain.gain.setValueAtTime(0.03, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  osc.start(now);
  osc.stop(now + 0.06);
}
