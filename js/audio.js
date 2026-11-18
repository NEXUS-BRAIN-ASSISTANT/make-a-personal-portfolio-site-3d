/**
 * CyberAudio Engine - Synthesized Web Audio API Sound Effects
 * 100% Procedural & Lightweight - Zero external audio file dependencies
 */

class CyberAudio {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.masterGain = null;
    this.lastScrollSoundTime = 0;
    this.ambientOsc = null;
    this.ambientGain = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  toggle() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.startAmbientHum();
      this.playChime(660, 0.15, 'sine');
      setTimeout(() => this.playChime(880, 0.25, 'sine'), 100);
    } else {
      this.stopAmbientHum();
    }
    return this.enabled;
  }

  playScrollTick(velocity = 1) {
    if (!this.enabled || !this.ctx) return;
    const now = performance.now();
    // Throttle scroll ticks so it sounds like a futuristic high-tech servo / scanner
    if (now - this.lastScrollSoundTime < 45) return;
    this.lastScrollSoundTime = now;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Pitch shifts dynamically with scroll velocity
      const baseFreq = 480 + Math.min(velocity * 60, 750);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.45, t + 0.038);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(baseFreq * 1.3, t);
      filter.Q.setValueAtTime(3.5, t);

      const vol = Math.min(0.04 + velocity * 0.018, 0.14);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.042);
    } catch (e) {}
  }

  playWarpBurst(intensity = 1.0) {
    if (!this.enabled || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(720, t + 0.12);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.45);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, t);
      filter.frequency.linearRampToValueAtTime(1800, t + 0.12);
      filter.frequency.exponentialRampToValueAtTime(150, t + 0.45);

      const vol = Math.min(0.12 * intensity, 0.22);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.48);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.5);
    } catch (e) {}
  }

  playChime(freq = 523.25, duration = 0.2, type = 'sine') {
    if (!this.enabled || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.02, t + duration * 0.5);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + duration);
    } catch (e) {}
  }

  playShockwave() {
    if (!this.enabled || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.45);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, t);
      filter.frequency.exponentialRampToValueAtTime(100, t + 0.45);

      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.5);
    } catch (e) {}
  }

  startAmbientHum() {
    if (!this.ctx) return;
    try {
      if (this.ambientOsc) this.stopAmbientHum();
      const t = this.ctx.currentTime;
      this.ambientOsc = this.ctx.createOscillator();
      this.ambientGain = this.ctx.createGain();

      this.ambientOsc.type = 'sine';
      this.ambientOsc.frequency.setValueAtTime(55, t); // deep 55Hz hum

      this.ambientGain.gain.setValueAtTime(0.0001, t);
      this.ambientGain.gain.linearRampToValueAtTime(0.015, t + 2);

      this.ambientOsc.connect(this.ambientGain);
      this.ambientGain.connect(this.masterGain);
      this.ambientOsc.start(t);
    } catch (e) {}
  }

  stopAmbientHum() {
    if (this.ambientOsc && this.ctx) {
      try {
        const t = this.ctx.currentTime;
        this.ambientGain.gain.linearRampToValueAtTime(0.0001, t + 0.3);
        setTimeout(() => {
          if (this.ambientOsc) {
            this.ambientOsc.stop();
            this.ambientOsc.disconnect();
            this.ambientOsc = null;
          }
        }, 350);
      } catch (e) {}
    }
  }
}

window.cyberAudio = new CyberAudio();
