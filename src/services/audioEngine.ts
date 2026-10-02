import { SynthPresetConfig, Track } from '../data/musicCatalog';

export const EQ_FREQUENCIES = [60, 230, 910, 3600, 14000] as const;

class StudioAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private htmlAudio: HTMLAudioElement | null = null;
  private mediaSource: MediaElementAudioSourceNode | null = null;

  private isPlaying = false;
  private currentTrack: Track | null = null;
  private currentTime = 0;
  private stepIndex = 0;
  private schedulerTimer: number | null = null;
  private progressTimer: number | null = null;
  private volume = 0.8;
  private isMuted = false;
  private eqGains: [number, number, number, number, number] = [0, 0, 0, 0, 0];

  private onTimeUpdateCallback: ((time: number, duration: number) => void) | null = null;
  private onTrackEndCallback: (() => void) | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : this.volume;

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.82;

      // Build 5-band equalizer chain
      this.eqFilters = EQ_FREQUENCIES.map((freq, idx) => {
        const filter = this.ctx!.createBiquadFilter();
        if (idx === 0) {
          filter.type = 'lowshelf';
        } else if (idx === EQ_FREQUENCIES.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.2;
        }
        filter.frequency.value = freq;
        filter.gain.value = this.eqGains[idx];
        return filter;
      });

      // Connect EQ chain -> masterGain -> analyser -> destination
      for (let i = 0; i < this.eqFilters.length - 1; i++) {
        this.eqFilters[i].connect(this.eqFilters[i + 1]);
      }
      this.eqFilters[this.eqFilters.length - 1].connect(this.masterGain);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private getInputNode(): AudioNode {
    this.initContext();
    return this.eqFilters[0];
  }

  public setCallbacks(
    onTimeUpdate: (time: number, duration: number) => void,
    onTrackEnd: () => void
  ) {
    this.onTimeUpdateCallback = onTimeUpdate;
    this.onTrackEndCallback = onTrackEnd;
  }

  public loadTrack(track: Track, autoPlay = true) {
    const isSameTrack = this.currentTrack?.id === track.id;
    this.stopInternalTimers();

    if (this.htmlAudio) {
      this.htmlAudio.pause();
    }

    this.currentTrack = track;
    if (!isSameTrack) {
      this.currentTime = 0;
      this.stepIndex = 0;
    }

    if (track.audioUrl) {
      this.initContext();
      if (!this.htmlAudio) {
        this.htmlAudio = new Audio();
        this.htmlAudio.crossOrigin = 'anonymous';
        this.htmlAudio.addEventListener('timeupdate', () => {
          if (this.htmlAudio && this.currentTrack?.audioUrl) {
            this.currentTime = this.htmlAudio.currentTime;
            const dur =
              Number.isFinite(this.htmlAudio.duration) && this.htmlAudio.duration > 0
                ? this.htmlAudio.duration
                : this.currentTrack.durationSeconds;
            this.onTimeUpdateCallback?.(this.currentTime, dur);
          }
        });
        this.htmlAudio.addEventListener('ended', () => {
          this.isPlaying = false;
          this.onTrackEndCallback?.();
        });
      }

      if (this.htmlAudio.src !== track.audioUrl) {
        this.htmlAudio.src = track.audioUrl;
        this.htmlAudio.currentTime = this.currentTime;
      }

      if (!this.mediaSource && this.ctx) {
        try {
          this.mediaSource = this.ctx.createMediaElementSource(this.htmlAudio);
          this.mediaSource.connect(this.getInputNode());
        } catch {
          // Fallback if mediaSource already connected
        }
      }
    }

    if (autoPlay) {
      this.play();
    } else {
      this.onTimeUpdateCallback?.(this.currentTime, track.durationSeconds);
    }
  }

  public play() {
    if (!this.currentTrack) return;
    this.initContext();
    this.isPlaying = true;

    // If track has an external/uploaded audio file URL
    if (this.currentTrack.audioUrl && this.htmlAudio) {
      this.htmlAudio.play().catch(() => {
        // Fallback to synth if stream fails
        this.startSynthSequencer(this.currentTrack!.synthConfig);
      });
      return;
    }

    // If track is a pure YouTube embed and user is in video mode, still advance timer or play ambient backing
    this.startSynthSequencer(this.currentTrack.synthConfig);
  }

  public pause() {
    this.isPlaying = false;
    this.stopInternalTimers();
    if (this.htmlAudio && !this.htmlAudio.paused) {
      this.htmlAudio.pause();
    }
  }

  public seek(seconds: number) {
    if (!this.currentTrack) return;
    const clamped = Math.max(0, Math.min(seconds, this.currentTrack.durationSeconds));
    this.currentTime = clamped;

    if (this.currentTrack.audioUrl && this.htmlAudio) {
      this.htmlAudio.currentTime = clamped;
    } else {
      const stepDuration = 60 / this.currentTrack.synthConfig.bpm / 4;
      this.stepIndex = Math.floor(clamped / stepDuration);
    }

    this.onTimeUpdateCallback?.(this.currentTime, this.currentTrack.durationSeconds);
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.isMuted ? 0 : this.volume,
        this.ctx.currentTime,
        0.02
      );
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.isMuted ? 0 : this.volume,
        this.ctx.currentTime,
        0.02
      );
    }
  }

  public setEqGains(gains: [number, number, number, number, number]) {
    this.eqGains = [...gains];
    if (this.eqFilters.length === 5 && this.ctx) {
      this.eqFilters.forEach((filter, idx) => {
        filter.gain.setTargetAtTime(gains[idx], this.ctx!.currentTime, 0.03);
      });
    }
  }

  public getFrequencyData(targetArray: Uint8Array): void {
    if (this.analyser && this.isPlaying) {
      this.analyser.getByteFrequencyData(targetArray);
    } else {
      targetArray.fill(0);
    }
  }

  private stopInternalTimers() {
    if (this.schedulerTimer !== null) {
      window.clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    if (this.progressTimer !== null) {
      window.clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  private midiToFreq(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  private startSynthSequencer(config: SynthPresetConfig) {
    this.stopInternalTimers();
    const sixteenthMs = (60 / config.bpm / 4) * 1000;
    const stepSeconds = sixteenthMs / 1000;

    // Trigger first step immediately
    this.triggerStep(this.stepIndex, config, stepSeconds);
    this.stepIndex++;

    this.schedulerTimer = window.setInterval(() => {
      if (!this.isPlaying || !this.currentTrack) return;
      this.triggerStep(this.stepIndex, config, stepSeconds);
      this.stepIndex++;
    }, sixteenthMs);

    this.progressTimer = window.setInterval(() => {
      if (!this.isPlaying || !this.currentTrack) return;
      this.currentTime += 0.2;
      if (this.currentTime >= this.currentTrack.durationSeconds) {
        this.currentTime = 0;
        this.stepIndex = 0;
        this.isPlaying = false;
        this.stopInternalTimers();
        this.onTrackEndCallback?.();
      } else {
        this.onTimeUpdateCallback?.(this.currentTime, this.currentTrack.durationSeconds);
      }
    }, 200);
  }

  private triggerStep(step: number, config: SynthPresetConfig, stepDur: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const stepInBar = step % 16;
    const barIndex = Math.floor(step / 16) % config.chordProgression.length;
    const currentChord = config.chordProgression[barIndex];

    // 1. Chord Pad on step 0 of every bar (or syncopated on bossa)
    if (stepInBar === 0 || (config.drumStyle === 'bossa' && (stepInBar === 3 || stepInBar === 10))) {
      const padDuration = config.drumStyle === 'bossa' ? stepDur * 5 : stepDur * 15;
      currentChord.forEach((interval) => {
        this.playPadVoice(
          this.midiToFreq(config.rootMidi + interval),
          now,
          padDuration,
          config.waveType,
          config.filterCutoff
        );
      });
    }

    // 2. Sub-Bass line
    const bassHitSteps =
      config.drumStyle === 'house' || config.drumStyle === 'synthwave'
        ? [0, 2, 4, 6, 8, 10, 12, 14]
        : config.drumStyle === 'bossa'
          ? [0, 6, 8, 14]
          : [0, 6, 10];

    if (bassHitSteps.includes(stepInBar)) {
      const bassNote = config.rootMidi - 12 + currentChord[0];
      this.playBassVoice(
        this.midiToFreq(bassNote),
        now,
        stepDur * 2.2,
        config.subBassLevel
      );
    }

    // 3. Melodic Arpeggio / Pluck
    const arpInterval = config.arpPattern[step % config.arpPattern.length];
    if (stepInBar % 2 === 0 || (stepInBar === 7 && config.drumStyle !== 'ambient')) {
      const noteMidi = config.rootMidi + 12 + arpInterval + (barIndex % 2 === 1 ? 2 : 0);
      this.playPluckVoice(
        this.midiToFreq(noteMidi),
        now,
        stepDur * 1.8,
        config.filterCutoff
      );
    }

    // 4. Drums & Percussion
    if (config.drumStyle !== 'ambient') {
      // Kick
      if (
        stepInBar === 0 ||
        (config.drumStyle === 'house' && (stepInBar === 4 || stepInBar === 8 || stepInBar === 12)) ||
        (config.drumStyle !== 'house' && stepInBar === 8) ||
        (config.drumStyle === 'phonk' && stepInBar === 11)
      ) {
        this.playKick(now);
      }

      // Snare / Rimshot
      if (stepInBar === 4 || stepInBar === 12) {
        this.playSnare(now, config.drumStyle === 'bossa' || config.drumStyle === 'lofi');
      }

      // Hi-hat
      if (stepInBar % 2 === 0 || (config.drumStyle === 'phonk' && stepInBar % 1 === 0)) {
        this.playHiHat(now, stepInBar % 4 === 2 ? 0.09 : 0.035);
      }
    }
  }

  private playPadVoice(
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType,
    cutoff: number
  ) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.055, startTime + Math.min(0.15, duration * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.getInputNode());

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  private playBassVoice(freq: number, startTime: number, duration: number, level: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, startTime);
    filter.frequency.exponentialRampToValueAtTime(110, startTime + duration);

    const peak = 0.16 * level;
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(peak, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.getInputNode());

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  private playPluckVoice(freq: number, startTime: number, duration: number, cutoff: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff * 1.4, startTime);
    filter.frequency.exponentialRampToValueAtTime(400, startTime + duration);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.075, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.getInputNode());

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  private playKick(startTime: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(135, startTime);
    osc.frequency.exponentialRampToValueAtTime(42, startTime + 0.12);

    gain.gain.setValueAtTime(0.28, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.24);

    osc.connect(gain);
    gain.connect(this.getInputNode());

    osc.start(startTime);
    osc.stop(startTime + 0.25);
  }

  private playSnare(startTime: number, softRim: boolean) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * (softRim ? 0.08 : 0.16);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(softRim ? 1400 : 1900, startTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(softRim ? 0.08 : 0.14, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + (softRim ? 0.08 : 0.16));

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.getInputNode());

    noise.start(startTime);
  }

  private playHiHat(startTime: number, duration: number) {
    if (!this.ctx) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6500, startTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.045, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.getInputNode());

    noise.start(startTime);
  }
}

export const audioEngine = new StudioAudioEngine();
