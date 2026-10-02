import React, { useEffect, useRef } from 'react';
import { Track } from '../data/musicCatalog';
import { audioEngine } from '../services/audioEngine';
import { CoverImage } from './CoverImage';

interface VideoStageVisualizerProps {
  track: Track;
  isPlaying: boolean;
  mode: 'audio' | 'video';
  currentTime: number;
}

export const VideoStageVisualizer: React.FC<VideoStageVisualizerProps> = ({
  track,
  isPlaying,
  mode,
  currentTime,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const freqData = new Uint8Array(64);
    let animId = 0;
    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      audioEngine.getFrequencyData(freqData);

      ctx.clearRect(0, 0, width, height);

      // Subtle atmospheric dark backdrop in Video Clip mode
      if (mode === 'video') {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#09090C');
        bgGrad.addColorStop(1, '#121218');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Calculate average bass energy
        let bassSum = 0;
        for (let i = 0; i < 8; i++) {
          bassSum += freqData[i];
        }
        const bassNorm = isPlaying ? bassSum / (8 * 255) : 0.04;

        // Ambient radial pulse
        const centerX = width / 2;
        const centerY = height * 0.44;
        const baseRadius = Math.min(width, height) * (0.2 + bassNorm * 0.14);

        const glow = ctx.createRadialGradient(
          centerX,
          centerY,
          baseRadius * 0.15,
          centerX,
          centerY,
          baseRadius * 2.4
        );
        glow.addColorStop(0, `${track.accentHue}44`);
        glow.addColorStop(0.5, `${track.accentHue}18`);
        glow.addColorStop(1, 'transparent');

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 2.4, 0, Math.PI * 2);
        ctx.fill();

        // Draw harmonic oscilloscope wave
        ctx.save();
        ctx.strokeStyle = `${track.accentHue}AA`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x <= width; x += 8) {
          const bin = Math.floor((x / width) * 32);
          const amp = isPlaying ? (freqData[bin] / 255) * 42 : 4;
          const y =
            centerY +
            Math.sin(x * 0.015 + phase) * amp +
            Math.cos(x * 0.008 - phase * 0.7) * (amp * 0.5);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Draw crisp symmetric frequency bars along bottom edge
      const barCount = 40;
      const totalWidth = width * 0.84;
      const startX = (width - totalWidth) / 2;
      const barWidth = (totalWidth / barCount) * 0.64;
      const gap = (totalWidth / barCount) * 0.36;

      for (let i = 0; i < barCount; i++) {
        const dataIdx = Math.floor((i / barCount) * 36);
        const raw = freqData[dataIdx] || 0;
        const idleWave = isPlaying
          ? 0
          : Math.sin(phase * 1.5 + i * 0.3) * 4 + 6;
        const barHeight = isPlaying
          ? Math.max(4, (raw / 255) * (mode === 'video' ? height * 0.32 : 48))
          : idleWave;

        const x = startX + i * (barWidth + gap);
        const y = height - barHeight - (mode === 'video' ? 24 : 8);

        ctx.fillStyle = i % 2 === 0 ? track.accentHue : '#F4F4F6CC';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      phase += isPlaying ? 0.06 : 0.015;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [track, isPlaying, mode]);

  // Active lyric line synced with currentTime
  const activeLyricIndex =
    track.lyrics.length > 0
      ? Math.floor((currentTime / Math.max(1, track.durationSeconds)) * track.lyrics.length) %
        track.lyrics.length
      : 0;

  if (mode === 'video' && track.youtubeId) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/10">
        <iframe
          title={track.title}
          src={`https://www.youtube.com/embed/${track.youtubeId}?autoplay=${isPlaying ? 1 : 0}&rel=0&modestbranding=1`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[#0D0D11] border border-white/10 group">
      {mode === 'audio' ? (
        <>
          {/* Blurred atmospheric background from cover art */}
          <CoverImage
            src={track.coverUrl}
            alt={track.title}
            accentHue={track.accentHue}
            className="w-full h-full opacity-35 scale-105 blur-xl transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/30" />

          {/* Centered square high-res album art like YouTube Music */}
          <div className="absolute inset-0 flex flex-col md:flex-row items-center justify-center gap-7 px-6 pb-8">
            <div className="relative w-40 h-40 sm:w-52 sm:h-52 rounded-lg overflow-hidden shadow-2xl border border-white/15 shrink-0">
              <CoverImage
                src={track.coverUrl}
                alt={`${track.title} - ${track.artist}`}
                accentHue={track.accentHue}
                className="w-full h-full"
              />
            </div>

            <div className="max-w-md text-center md:text-left">
              <div className="text-xs text-neutral-300 mb-1.5">
                <span>{track.categoryLabel}</span>
                <span aria-hidden="true" className="mx-1.5">·</span>
                <span>{track.album}</span>
                <span aria-hidden="true" className="mx-1.5">·</span>
                <span className="font-mono tabular-nums">{track.synthConfig.bpm} BPM</span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight mb-1.5">
                {track.title}
              </h2>
              <p className="text-sm text-neutral-300 mb-4">{track.artist}</p>

              {track.lyrics.length > 0 && (
                <div className="border-l-2 border-[#FF0033] pl-3.5 py-1">
                  <p className="text-xs text-neutral-400 mb-0.5">Letra / Guia Sincronizado</p>
                  <p className="text-sm font-medium text-white transition-opacity duration-200">
                    “{track.lyrics[activeLyricIndex]}”
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom live frequency spectrum */}
          <canvas
            ref={canvasRef}
            width={800}
            height={90}
            className="absolute bottom-0 inset-x-0 w-full h-16 pointer-events-none opacity-90"
          />
        </>
      ) : (
        /* Full Visualizer Clip Mode */
        <>
          <canvas
            ref={canvasRef}
            width={960}
            height={540}
            className="w-full h-full block"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40 pointer-events-none" />

          <div className="absolute top-4 left-5 right-5 flex items-center justify-between pointer-events-none">
            <div className="text-xs text-neutral-300">
              <span>Clipe Visualizador de Estúdio</span>
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span className="font-mono tabular-nums">60 FPS WebAudio</span>
            </div>
            <div className="text-xs font-mono tabular-nums text-neutral-300">
              {track.synthConfig.bpm} BPM · {track.durationFormatted}
            </div>
          </div>

          {/* Centered reactive vinyl emblem */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-2 border-white/20 shadow-2xl transition-transform duration-300 ${
                isPlaying ? 'scale-105' : 'scale-95 opacity-80'
              }`}
            >
              <CoverImage
                src={track.coverUrl}
                alt={track.title}
                accentHue={track.accentHue}
                className="w-full h-full"
              />
            </div>
          </div>

          {track.lyrics.length > 0 && (
            <div className="absolute bottom-16 inset-x-6 text-center pointer-events-none">
              <p className="text-base sm:text-lg font-medium text-white drop-shadow-md">
                {track.lyrics[activeLyricIndex]}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
