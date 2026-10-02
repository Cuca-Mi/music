import React, { useState } from 'react';
import { X, Upload, Link2, Music2 } from 'lucide-react';
import { HERO_BANNER_IMAGE, Track, TrackCategory } from '../data/musicCatalog';

interface AddTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTrack: (newTrack: Track) => void;
}

function extractYouTubeId(url: string): string | undefined {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : undefined;
}

function formatSeconds(sec: number): string {
  const mins = Math.floor(sec / 60);
  const rem = Math.floor(sec % 60);
  return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export const AddTrackModal: React.FC<AddTrackModalProps> = ({
  isOpen,
  onClose,
  onAddTrack,
}) => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('Single Independente');
  const [category, setCategory] = useState<Exclude<TrackCategory, 'all'>>('uploads');
  const [sourceType, setSourceType] = useState<'file' | 'url' | 'synth'>('file');
  const [mediaUrl, setMediaUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [bpm, setBpm] = useState(110);
  const [fileDuration, setFileDuration] = useState(195);
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setMediaUrl(objectUrl);
    setFileName(file.name);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    // Probe audio duration
    const tempAudio = new Audio(objectUrl);
    tempAudio.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(tempAudio.duration) && tempAudio.duration > 0) {
        setFileDuration(Math.round(tempAudio.duration));
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) {
      setErrorMsg('Preencha o título da faixa e o nome do artista.');
      return;
    }

    const ytId = sourceType === 'url' ? extractYouTubeId(mediaUrl) : undefined;
    const categoryLabels: Record<Exclude<TrackCategory, 'all'>, string> = {
      lofi: 'Lo-Fi & Chill',
      eletronica: 'Eletrônica & Synth',
      mpb: 'MPB & Bossa',
      hiphop: 'Hip-Hop & Phonk',
      acustico: 'Acústico & Piano',
      uploads: 'Meus Envios',
    };

    const resolvedCover =
      coverUrl.trim() ||
      (ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : HERO_BANNER_IMAGE);

    const newTrack: Track = {
      id: `trk-custom-${Date.now()}`,
      title: title.trim(),
      artist: artist.trim(),
      artistSubscribers: 'Artista Verificado',
      album: album.trim() || 'Single Independente',
      category,
      categoryLabel: categoryLabels[category],
      durationSeconds: fileDuration,
      durationFormatted: formatSeconds(fileDuration),
      viewsFormatted: 'Novo envio',
      releaseDate: 'Outubro 2026',
      coverUrl: resolvedCover,
      accentHue: '#FF0033',
      description:
        sourceType === 'file'
          ? `Arquivo de áudio local (${fileName || 'MP3/WAV'}) importado para reprodução direta no navegador.`
          : ytId
            ? `Vídeo sincronizado via YouTube Embed (${ytId}) com suporte a Modo Clipe.`
            : 'Faixa adicionada ao catálogo personalizado do OndaTube Music.',
      lyrics: [
        `Faixa: ${title.trim()}`,
        `Artista: ${artist.trim()}`,
        'Adicionada à sua biblioteca personalizada',
      ],
      audioUrl:
        sourceType === 'file' || (sourceType === 'url' && !ytId && mediaUrl.trim())
          ? mediaUrl.trim()
          : undefined,
      youtubeId: ytId,
      synthConfig: {
        bpm: Number(bpm) || 110,
        rootMidi: 58,
        scaleIntervals: [0, 2, 3, 5, 7, 8, 10, 12],
        chordProgression: [
          [0, 3, 7, 10],
          [5, 8, 12, 15],
          [7, 10, 14, 17],
          [3, 7, 10, 14],
        ],
        waveType: 'sawtooth',
        subBassLevel: 0.75,
        arpPattern: [0, 3, 7, 12, 7, 3, 10, 7],
        drumStyle: category === 'lofi' ? 'lofi' : category === 'mpb' ? 'bossa' : 'synthwave',
        filterCutoff: 1350,
      },
      comments: [],
    };

    onAddTrack(newTrack);
    setTitle('');
    setArtist('');
    setMediaUrl('');
    setFileName('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl bg-[#141418] border border-white/10 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="font-display text-lg font-bold text-white">
              Adicionar Música ou Clipe
            </h2>
            <p className="text-xs text-neutral-400">
              Importe um arquivo MP3/WAV local, link do YouTube ou crie uma sessão de estúdio
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Source selector tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0A0A0C] rounded-lg border border-white/5">
            <button
              type="button"
              onClick={() => setSourceType('file')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                sourceType === 'file'
                  ? 'bg-[#FF0033] text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Arquivo MP3/WAV</span>
            </button>
            <button
              type="button"
              onClick={() => setSourceType('url')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                sourceType === 'url'
                  ? 'bg-[#FF0033] text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Link YouTube / URL</span>
            </button>
            <button
              type="button"
              onClick={() => setSourceType('synth')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                sourceType === 'synth'
                  ? 'bg-[#FF0033] text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Music2 className="w-3.5 h-3.5" />
              <span>Sintetizador Web</span>
            </button>
          </div>

          {sourceType === 'file' && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Selecionar arquivo de áudio (.mp3, .wav, .ogg)
              </label>
              <label className="flex flex-col items-center justify-center w-full py-5 px-4 border border-dashed border-white/20 rounded-lg bg-[#0A0A0C] hover:border-[#FF0033] cursor-pointer transition-colors">
                <Upload className="w-5 h-5 text-neutral-400 mb-1.5" />
                <span className="text-xs text-neutral-300 font-medium">
                  {fileName ? fileName : 'Clique para escolher um arquivo de áudio do computador'}
                </span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {sourceType === 'url' && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                URL do Vídeo do YouTube ou Link Direto MP3
              </label>
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... ou https://.../musica.mp3"
                className="w-full px-3.5 py-2 text-sm bg-[#0A0A0C] border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#FF0033]"
              />
            </div>
          )}

          {sourceType === 'synth' && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Andamento do Sintetizador (BPM): <span className="font-mono">{bpm} BPM</span>
              </label>
              <input
                type="range"
                min={68}
                max={145}
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-full yt-slider bg-white/10 h-1.5 rounded-lg"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Título da Música *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Noite em São Paulo"
                className="w-full px-3 py-2 text-sm bg-[#0A0A0C] border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#FF0033]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Artista / Canal *
              </label>
              <input
                type="text"
                required
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Ex: Estúdio Independente"
                className="w-full px-3 py-2 text-sm bg-[#0A0A0C] border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#FF0033]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Álbum / Projeto
              </label>
              <input
                type="text"
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0A0A0C] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF0033]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Estilo Musical
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Exclude<TrackCategory, 'all'>)}
                className="w-full px-3 py-2 text-sm bg-[#0A0A0C] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF0033]"
              >
                <option value="uploads">Meus Envios</option>
                <option value="lofi">Lo-Fi & Chill</option>
                <option value="eletronica">Eletrônica & Synth</option>
                <option value="mpb">MPB & Bossa</option>
                <option value="hiphop">Hip-Hop & Phonk</option>
                <option value="acustico">Acústico & Piano</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              URL da Capa (Opcional)
            </label>
            <input
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="Deixe em branco para usar capa de estúdio automática"
              className="w-full px-3 py-2 text-sm bg-[#0A0A0C] border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#FF0033]"
            />
          </div>

          {errorMsg && <p className="text-xs text-[#FF4D6D]">{errorMsg}</p>}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors whitespace-nowrap"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#FF0033] hover:bg-[#D9002B] rounded-lg transition-colors whitespace-nowrap"
            >
              Salvar e Tocar Agora
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
