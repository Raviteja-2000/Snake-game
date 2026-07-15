// Audio Manager - Sound effects and audio handling
// Responsible for all game audio

export class AudioManager {
  constructor(muted = false) {
    this.muted = muted;
    this.audioContext = null;
  }

  // Initialize Web Audio API
  _ensureAudioContext() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.error('Web Audio API not supported:', e);
        return null;
      }
    }
    return this.audioContext;
  }

  // Play tone with frequency and duration
  playTone(frequency = 520, duration = 0.06) {
    if (this.muted) return;
    const ac = this._ensureAudioContext();
    if (!ac) return;

    try {
      const oscillator = ac.createOscillator();
      const gainNode = ac.createGain();

      oscillator.frequency.value = frequency;
      oscillator.type = 'square';

      gainNode.gain.setValueAtTime(0.0001, ac.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.18, ac.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(ac.destination);

      oscillator.start();
      oscillator.stop(ac.currentTime + duration + 0.02);
    } catch (e) {
      console.error('Audio playback error:', e);
    }
  }

  // Play eating sound
  playEatSound() {
    this.playTone(760, 0.08);
  }

  // Play pause sound
  playPauseSound() {
    this.playTone(440, 0.1);
  }

  // Play unpause sound
  playUnpauseSound() {
    this.playTone(520, 0.1);
  }

  // Play crash sound
  playCrashSound() {
    this.playTone(180, 0.2);
  }

  // Play level-up chord progression
  playLevelUpSound() {
    this.playTone(523, 0.15);
    setTimeout(() => this.playTone(659, 0.15), 100);
    setTimeout(() => this.playTone(784, 0.15), 200);
  }

  // Toggle mute
  setMuted(muted) {
    this.muted = muted;
  }
}

export default AudioManager;