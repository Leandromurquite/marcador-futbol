// Motor de Sonidos y Efectos de Audio Real
// Sin sintetizadores de texto (cero IA robótica). Solo audios reales y bocinas acústicas.
class SoundEffects {
  constructor() {
    this.audioCtx = null;
    this.enabled = true;
    this.currentAudioElement = null;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Reproducir archivo de audio real (MP3 de Mariano Closs subido o archivo local)
  playAudioFile(url) {
    if (!this.enabled || !url) return;
    try {
      if (this.currentAudioElement) {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
      }
      const audio = new Audio(url);
      audio.volume = 1.0;
      this.currentAudioElement = audio;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('No se pudo reproducir el archivo de audio:', err);
          // Si falla la reproducción del archivo, suena la bocina de estadio clásica
          this.playGoalHorn();
        });
      }
    } catch (e) {
      this.playGoalHorn();
    }
  }

  // Detener inmediatamente cualquier audio en reproducción
  stopAudio() {
    try {
      if (this.currentAudioElement) {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
        this.currentAudioElement = null;
      }
    } catch (e) {
      console.warn('Error al detener audio:', e);
    }
  }

  // Celebración de gol: reproduce el audio real de Mariano Closs guardado localmente o customUrl
  playGoal(customUrl) {
    if (!this.enabled) return;
    this.init();
    const urlToPlay = customUrl || '/assets/sounds/mariano-closs-gol.mp3';
    this.playAudioFile(urlToPlay);
  }

  // Silbato corto de falta o reanudación
  playWhistleShort() {
    if (!this.enabled) return;
    this.init();
    if (!this.audioCtx) return;
    this._produceWhistle(0.32);
  }

  // Silbato triple largo de final de tiempo o fin de penales
  playWhistleLong() {
    if (!this.enabled) return;
    this.init();
    if (!this.audioCtx) return;
    this._produceWhistle(0.28);
    setTimeout(() => this._produceWhistle(0.28), 350);
    setTimeout(() => this._produceWhistle(0.85), 700);
  }

  // Bocina de Gol estilo Estadio
  playGoalHorn() {
    if (!this.enabled) return;
    this.init();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    const freqs = [130.81, 164.81, 196.00, 261.63]; // C3, E3, G3, C4
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.5, now);
    masterGain.gain.exponentialRampToValueAtTime(0.01, now + 3.2);
    masterGain.connect(ctx.destination);

    freqs.forEach(f => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);
      osc.detune.setValueAtTime(Math.random() * 20 - 10, now);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 3.0);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 3.2);
    });
  }

  _produceWhistle(duration = 0.5) {
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    lfo.frequency.setValueAtTime(24, now);
    lfoGain.gain.setValueAtTime(60, now);
    lfo.connect(lfoGain);

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2600, now);
    lfoGain.connect(osc1.frequency);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(2900, now);
    lfoGain.connect(osc2.frequency);

    gainNode.gain.setValueAtTime(0.0, now);
    gainNode.gain.linearRampToValueAtTime(0.35, now + 0.04);
    gainNode.gain.setValueAtTime(0.35, now + duration - 0.05);
    gainNode.gain.linearRampToValueAtTime(0.0, now + duration);

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, now);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    lfo.start(now);
    osc1.start(now);
    osc2.start(now);

    lfo.stop(now + duration);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  }
}

window.SoundEffects = new SoundEffects();
