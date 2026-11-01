/**
 * Clean Web Audio API chime for high alert notifications.
 * Respects browser autoplay policies and user mute preference.
 */
class AlertSoundEngine {
  private audioCtx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playWarningChime() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      // Friendly 2-tone alert chime (F#5 -> C#6)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(739.99, now); // F#5
      osc1.frequency.exponentialRampToValueAtTime(1108.73, now + 0.15); // C#6

      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);

      osc1.start(now);
      osc1.stop(now + 0.5);
    } catch {
      // AudioContext might be blocked until user interacts, safely ignored
    }
  }
}

export const alertSound = new AlertSoundEngine();
