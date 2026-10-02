import React, { useEffect, useMemo, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Heart,
  Plus,
  Search,
  Sliders,
  ListMusic,
  Video,
  Music,
  Share2,
  Check,
  MessageSquare,
  FolderGit2,
  Trash2,
} from 'lucide-react';
import {
  EQ_PRESETS,
  INITIAL_PLAYLISTS,
  INITIAL_TRACKS,
  Playlist,
  Track,
  TrackCategory,
} from './data/musicCatalog';
import { audioEngine, EQ_FREQUENCIES } from './services/audioEngine';
import { CoverImage } from './components/CoverImage';
import { VideoStageVisualizer } from './components/VideoStageVisualizer';
import { AddTrackModal } from './components/AddTrackModal';
import { GitHubDeployModal } from './components/GitHubDeployModal';

type NavSection = 'inicio' | 'explorar' | 'biblioteca' | 'playlists' | 'equalizador';

const STORAGE_KEYS = {
  CUSTOM_TRACKS: 'ondatube_custom_tracks_v1',
  LIKED_IDS: 'ondatube_liked_ids_v1',
  SUBSCRIBED_ARTISTS: 'ondatube_subscribed_artists_v1',
  PLAYLISTS: 'ondatube_playlists_v1',
  HISTORY_IDS: 'ondatube_history_ids_v1',
  EQ_GAINS: 'ondatube_eq_gains_v1',
};

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function App() {
  // Load persistent state from localStorage
  const [tracks, setTracks] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_TRACKS);
      if (saved) {
        const parsed: Track[] = JSON.parse(saved);
        return [...parsed, ...INITIAL_TRACKS];
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_TRACKS;
  });

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PLAYLISTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_PLAYLISTS;
  });

  const [likedIds, setLikedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LIKED_IDS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return ['trk-01', 'trk-03'];
  });

  const [subscribedArtists, setSubscribedArtists] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUBSCRIBED_ARTISTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return ['Coletivo Nebulosa'];
  });

  const [historyIds, setHistoryIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY_IDS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return ['trk-01', 'trk-02', 'trk-03'];
  });

  const [eqGains, setEqGains] = useState<[number, number, number, number, number]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EQ_GAINS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [0, 0, 0, 0, 0];
  });

  // Navigation & UI state
  const [activeNav, setActiveNav] = useState<NavSection>('inicio');
  const [selectedCategory, setSelectedCategory] = useState<TrackCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePlaylistId, setActivePlaylistId] = useState<string>(INITIAL_PLAYLISTS[0].id);

  // Playback state
  const [currentTrackId, setCurrentTrackId] = useState<string>(INITIAL_TRACKS[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stageMode, setStageMode] = useState<'audio' | 'video'>('audio');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(INITIAL_TRACKS[0].durationSeconds);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  // Modals & interactive feedback
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [playlistAddFeedback, setPlaylistAddFeedback] = useState('');

  const currentTrack = useMemo(
    () => tracks.find((t) => t.id === currentTrackId) || tracks[0],
    [tracks, currentTrackId]
  );

  // Save state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LIKED_IDS, JSON.stringify(likedIds));
    } catch {
      // ignore
    }
  }, [likedIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SUBSCRIBED_ARTISTS, JSON.stringify(subscribedArtists));
    } catch {
      // ignore
    }
  }, [subscribedArtists]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
    } catch {
      // ignore
    }
  }, [playlists]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY_IDS, JSON.stringify(historyIds));
    } catch {
      // ignore
    }
  }, [historyIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EQ_GAINS, JSON.stringify(eqGains));
    } catch {
      // ignore
    }
    audioEngine.setEqGains(eqGains);
  }, [eqGains]);

  // Filtered tracks for catalog views
  const filteredTracks = useMemo(() => {
    return tracks.filter((track) => {
      const matchesCategory =
        selectedCategory === 'all' || track.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        track.title.toLowerCase().includes(q) ||
        track.artist.toLowerCase().includes(q) ||
        track.album.toLowerCase().includes(q) ||
        track.categoryLabel.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [tracks, selectedCategory, searchQuery]);

  // Wire up audioEngine callbacks
  useEffect(() => {
    audioEngine.setCallbacks(
      (time, dur) => {
        setCurrentTime(time);
        setDuration(dur);
      },
      () => {
        if (isRepeat) {
          audioEngine.seek(0);
          audioEngine.play();
          setIsPlaying(true);
        } else {
          handleNextTrack();
        }
      }
    );
  });

  // Keyboard spacebar shortcut (when not typing in an input)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const handleSelectTrack = (track: Track, autoPlay = true) => {
    setCurrentTrackId(track.id);
    setDuration(track.durationSeconds);
    setCurrentTime(0);
    setHistoryIds((prev) => [track.id, ...prev.filter((id) => id !== track.id)].slice(0, 20));
    audioEngine.loadTrack(track, autoPlay);
    setIsPlaying(autoPlay);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      audioEngine.loadTrack(currentTrack, true);
      setIsPlaying(true);
    }
  };

  const handleNextTrack = () => {
    const list = filteredTracks.length > 0 ? filteredTracks : tracks;
    if (list.length === 0) return;
    if (isShuffle && list.length > 1) {
      const candidates = list.filter((t) => t.id !== currentTrack.id);
      const randomTrack = candidates[Math.floor(Math.random() * candidates.length)];
      handleSelectTrack(randomTrack, true);
      return;
    }
    const idx = list.findIndex((t) => t.id === currentTrack.id);
    const nextTrack = list[(idx + 1) % list.length];
    handleSelectTrack(nextTrack, true);
  };

  const handlePrevTrack = () => {
    if (currentTime > 4) {
      audioEngine.seek(0);
      setCurrentTime(0);
      return;
    }
    const list = filteredTracks.length > 0 ? filteredTracks : tracks;
    if (list.length === 0) return;
    const idx = list.findIndex((t) => t.id === currentTrack.id);
    const prevTrack = list[(idx - 1 + list.length) % list.length];
    handleSelectTrack(prevTrack, true);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setCurrentTime(newTime);
    audioEngine.seek(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (val > 0 && isMuted) {
      setIsMuted(false);
      audioEngine.setMuted(false);
    }
    audioEngine.setVolume(val);
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioEngine.setMuted(nextMute);
  };

  const handleToggleLike = (trackId: string) => {
    setLikedIds((prev) =>
      prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [trackId, ...prev]
    );
  };

  const handleToggleSubscribe = (artist: string) => {
    setSubscribedArtists((prev) =>
      prev.includes(artist) ? prev.filter((a) => a !== artist) : [...prev, artist]
    );
  };

  const handleAddTrack = (newTrack: Track) => {
    setTracks((prev) => {
      const updated = [newTrack, ...prev];
      const customOnly = updated.filter((t) => t.id.startsWith('trk-custom-'));
      try {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_TRACKS, JSON.stringify(customOnly));
      } catch {
        // ignore
      }
      return updated;
    });
    if (newTrack.youtubeId) {
      setStageMode('video');
    }
    handleSelectTrack(newTrack, true);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    const newComment = {
      id: `cm-${Date.now()}`,
      author: 'Você',
      handle: '@ouvinte_github',
      timeAgo: 'agora mesmo',
      text: commentInput.trim(),
      likes: 1,
    };
    setTracks((prev) =>
      prev.map((t) =>
        t.id === currentTrack.id ? { ...t, comments: [newComment, ...t.comments] } : t
      )
    );
    setCommentInput('');
  };

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const created: Playlist = {
      id: `pl-${Date.now()}`,
      name: newPlaylistName.trim(),
      description: newPlaylistDesc.trim() || 'Playlist personalizada salva no navegador.',
      trackIds: [currentTrack.id],
      createdAt: 'Outubro 2026',
    };
    setPlaylists((prev) => [created, ...prev]);
    setActivePlaylistId(created.id);
    setNewPlaylistName('');
    setNewPlaylistDesc('');
  };

  const handleAddTrackToPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        if (pl.trackIds.includes(trackId)) return pl;
        return { ...pl, trackIds: [...pl.trackIds, trackId] };
      })
    );
    const targetPl = playlists.find((p) => p.id === playlistId);
    if (targetPl) {
      setPlaylistAddFeedback(`Adicionada a "${targetPl.name}"`);
      setTimeout(() => setPlaylistAddFeedback(''), 2500);
    }
  };

  const handleRemoveFromPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists((prev) =>
      prev.map((pl) =>
        pl.id === playlistId
          ? { ...pl, trackIds: pl.trackIds.filter((id) => id !== trackId) }
          : pl
      )
    );
  };

  const handleShareTrack = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#track=${currentTrack.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleImportBackup = (data: { tracks?: Track[]; playlists?: Playlist[] }) => {
    if (Array.isArray(data.tracks) && data.tracks.length > 0) {
      setTracks(data.tracks);
    }
    if (Array.isArray(data.playlists) && data.playlists.length > 0) {
      setPlaylists(data.playlists);
    }
  };

  const isCurrentLiked = likedIds.includes(currentTrack.id);
  const isCurrentSubscribed = subscribedArtists.includes(currentTrack.artist);

  const categories: { id: TrackCategory; label: string }[] = [
    { id: 'all', label: 'Tudo' },
    { id: 'eletronica', label: 'Eletrônica & Synth' },
    { id: 'lofi', label: 'Lo-Fi & Chill' },
    { id: 'mpb', label: 'MPB & Bossa' },
    { id: 'hiphop', label: 'Hip-Hop & Phonk' },
    { id: 'acustico', label: 'Acústico & Piano' },
    { id: 'uploads', label: 'Meus Envios' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#F4F4F6] flex flex-col pb-24">
      {/* STRICT 3-ZONE TOP BAR CONTRACT */}
      <header className="sticky top-0 z-30 h-14 bg-[#0A0A0C]/95 backdrop-blur-md border-b border-white/10 px-4 lg:px-8 flex items-center justify-between">
        {/* Zone 1: Single text element Brand wordmark */}
        <a
          href="#inicio"
          onClick={(e) => {
            e.preventDefault();
            setActiveNav('inicio');
          }}
          className="font-display text-xl font-extrabold tracking-tight text-white hover:text-[#FF0033] transition-colors whitespace-nowrap"
        >
          OndaTube
        </a>

        {/* Zone 2: 5 single-line navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          {(
            [
              { id: 'inicio', label: 'Início' },
              { id: 'explorar', label: 'Explorar' },
              { id: 'biblioteca', label: 'Biblioteca' },
              { id: 'playlists', label: 'Playlists' },
              { id: 'equalizador', label: 'Estúdio EQ' },
            ] as { id: NavSection; label: string }[]
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveNav(item.id)}
              className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                activeNav === item.id
                  ? 'border-[#FF0033] text-white font-semibold'
                  : 'border-transparent text-neutral-400 hover:text-white hover:border-white/30'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: 2 primary actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsGitHubModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-medium text-neutral-200 bg-white/10 hover:bg-white/15 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            GitHub Pages
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#FF0033] hover:bg-[#D9002B] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            + Adicionar Música
          </button>
        </div>
      </header>

      {/* WORKSPACE CANVAS: Sidebar + Main Viewport */}
      <div className="flex-1 flex max-w-[1440px] w-full mx-auto">
        {/* Desktop Left Sidebar (256px) */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-white/10 p-5 space-y-6">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeNav !== 'inicio' && activeNav !== 'explorar') {
                  setActiveNav('explorar');
                }
              }}
              placeholder="Buscar música ou artista..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#141418] border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#FF0033]"
            />
          </div>

          {/* Quick Navigation */}
          <div className="space-y-1">
            <div className="px-2 pb-1.5 text-xs font-semibold text-neutral-400">
              Navegação Principal
            </div>
            {(
              [
                { id: 'inicio', label: 'Palco Principal & Fila' },
                { id: 'explorar', label: 'Catálogo Completo' },
                { id: 'biblioteca', label: `Músicas Curtidas (${likedIds.length})` },
                { id: 'playlists', label: `Minhas Playlists (${playlists.length})` },
                { id: 'equalizador', label: 'Equalizador de 5 Bandas' },
              ] as { id: NavSection; label: string }[]
            ).map((nav) => (
              <button
                key={nav.id}
                type="button"
                onClick={() => setActiveNav(nav.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap truncate ${
                  activeNav === nav.id
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {nav.label}
              </button>
            ))}
          </div>

          {/* Playlists quick access */}
          <div className="pt-4 border-t border-white/10 space-y-1.5">
            <div className="px-2 pb-1 text-xs font-semibold text-neutral-400">
              Suas Playlists
            </div>
            {playlists.map((pl) => (
              <button
                key={pl.id}
                type="button"
                onClick={() => {
                  setActivePlaylistId(pl.id);
                  setActiveNav('playlists');
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <div className="text-xs font-medium text-neutral-200 group-hover:text-white truncate">
                  {pl.name}
                </div>
                <div className="text-[11px] text-neutral-500 font-mono tabular-nums">
                  {pl.trackIds.length} faixas · {pl.createdAt}
                </div>
              </button>
            ))}
          </div>

          {/* GitHub Static Host Ready Card */}
          <div className="mt-auto p-4 rounded-xl bg-[#141418] border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <FolderGit2 className="w-4 h-4 text-[#FF0033] shrink-0" />
              <span>GitHub Pages Pronto</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Este site roda 100% no navegador com caminhos relativos e sintetizador WebAudio integrado.
            </p>
            <button
              type="button"
              onClick={() => setIsGitHubModalOpen(true)}
              className="w-full py-1.5 px-3 text-xs font-medium text-white bg-white/10 hover:bg-white/15 rounded-lg transition-colors whitespace-nowrap"
            >
              Ver Guia & Exportar JSON
            </button>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-8">
          {/* Mobile Navigation & Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 lg:hidden">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar faixas, artistas ou álbuns..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#141418] border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#FF0033]"
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {(
                [
                  { id: 'inicio', label: 'Início' },
                  { id: 'explorar', label: 'Explorar' },
                  { id: 'biblioteca', label: 'Biblioteca' },
                  { id: 'playlists', label: 'Playlists' },
                  { id: 'equalizador', label: 'EQ' },
                ] as { id: NavSection; label: string }[]
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveNav(t.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 ${
                    activeNav === t.id
                      ? 'bg-[#FF0033] text-white'
                      : 'bg-[#141418] text-neutral-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Category Filter Controls (Functional Buttons) */}
          {(activeNav === 'inicio' || activeNav === 'explorar') && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    selectedCategory === cat.id
                      ? 'bg-white text-[#0A0A0C] font-semibold'
                      : 'bg-[#141418] text-neutral-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          {/* VIEW 1: INÍCIO (YouTube Music / YouTube Main Stage + Up Next Queue + Catalog) */}
          {activeNav === 'inicio' && (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-7">
                {/* Left 8 cols: Main YouTube Stage */}
                <div className="xl:col-span-8 space-y-4">
                  {/* Top Bar of Stage: Audio vs Video Clip Switcher (Like YouTube Music) */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1 p-1 bg-[#141418] rounded-lg border border-white/10">
                      <button
                        type="button"
                        onClick={() => setStageMode('audio')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                          stageMode === 'audio'
                            ? 'bg-[#FF0033] text-white'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Music className="w-3.5 h-3.5" />
                        <span>Modo Áudio</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStageMode('video')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                          stageMode === 'video'
                            ? 'bg-[#FF0033] text-white'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Modo Clipe / Visualizador</span>
                      </button>
                    </div>

                    <div className="text-xs text-neutral-400 font-mono tabular-nums">
                      <span>{currentTrack.viewsFormatted}</span>
                      <span aria-hidden="true" className="mx-1.5">·</span>
                      <span>{currentTrack.releaseDate}</span>
                    </div>
                  </div>

                  {/* Interactive Audio/Video Stage */}
                  <VideoStageVisualizer
                    track={currentTrack}
                    isPlaying={isPlaying}
                    mode={stageMode}
                    currentTime={currentTime}
                  />

                  {/* Track Title & YouTube-style Channel / Action Bar */}
                  <div className="pt-1 space-y-4">
                    <div>
                      <h1 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
                        {currentTrack.title}
                      </h1>
                      {/* Unboxed metadata with · separators */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 mt-1">
                        <span>{currentTrack.categoryLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span>Álbum: {currentTrack.album}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {currentTrack.synthConfig.bpm} BPM
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {currentTrack.durationFormatted}
                        </span>
                      </div>
                    </div>

                    {/* Artist Channel + Action Buttons Row */}
                    <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/15 shrink-0">
                          <CoverImage
                            src={currentTrack.coverUrl}
                            alt={currentTrack.artist}
                            accentHue={currentTrack.accentHue}
                            className="w-full h-full"
                          />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {currentTrack.artist}
                          </div>
                          <div className="text-xs text-neutral-400">
                            {currentTrack.artistSubscribers}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleSubscribe(currentTrack.artist)}
                          className={`ml-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                            isCurrentSubscribed
                              ? 'bg-white/10 text-white hover:bg-white/15'
                              : 'bg-white text-[#0A0A0C] hover:bg-neutral-200'
                          }`}
                        >
                          {isCurrentSubscribed ? 'Inscrito' : 'Inscrever-se'}
                        </button>
                      </div>

                      {/* Action Buttons: Play/Pause, Like, Add to Playlist, EQ, Share */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleTogglePlay}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#FF0033] hover:bg-[#D9002B] text-white transition-colors whitespace-nowrap"
                        >
                          {isPlaying ? (
                            <>
                              <Pause className="w-3.5 h-3.5" />
                              <span>Pausar</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              <span>Tocar Agora</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleLike(currentTrack.id)}
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                            isCurrentLiked
                              ? 'bg-[#FF0033]/20 text-[#FF4D6D] border border-[#FF0033]/40'
                              : 'bg-[#141418] text-neutral-200 hover:bg-white/10 border border-white/10'
                          }`}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${isCurrentLiked ? 'fill-current' : ''}`}
                          />
                          <span>{isCurrentLiked ? 'Curtido' : 'Gostei'}</span>
                        </button>

                        {/* Quick Add to Active Playlist */}
                        <button
                          type="button"
                          onClick={() =>
                            handleAddTrackToPlaylist(
                              playlists[0]?.id || 'pl-foco',
                              currentTrack.id
                            )
                          }
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#141418] hover:bg-white/10 text-neutral-200 border border-white/10 transition-colors whitespace-nowrap"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Salvar na Playlist</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveNav('equalizador')}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#141418] hover:bg-white/10 text-neutral-200 border border-white/10 transition-colors whitespace-nowrap"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>EQ</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleShareTrack}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#141418] hover:bg-white/10 text-neutral-200 border border-white/10 transition-colors whitespace-nowrap"
                        >
                          {copiedShare ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Link Copiado</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3.5 h-3.5" />
                              <span>Compartilhar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {playlistAddFeedback && (
                      <div className="text-xs text-emerald-400 font-medium">
                        {playlistAddFeedback}
                      </div>
                    )}

                    {/* YouTube-style Description Box */}
                    <div className="p-4 rounded-xl bg-[#141418] border border-white/10 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-white">
                        <span>Ficha Técnica da Faixa</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums text-neutral-400">
                          {currentTrack.viewsFormatted}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">
                        {currentTrack.description}
                      </p>
                    </div>

                    {/* Interactive Comments Section */}
                    <div className="pt-2 space-y-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <MessageSquare className="w-4 h-4 text-neutral-400" />
                        <span>
                          Comentários ({currentTrack.comments.length})
                        </span>
                      </div>

                      <form onSubmit={handleAddComment} className="flex gap-2.5">
                        <input
                          type="text"
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          placeholder="Adicione um comentário público sobre esta música..."
                          className="flex-1 px-3.5 py-2 text-xs bg-[#141418] border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#FF0033]"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/15 rounded-lg transition-colors whitespace-nowrap shrink-0"
                        >
                          Comentar
                        </button>
                      </form>

                      {currentTrack.comments.length === 0 ? (
                        <p className="text-xs text-neutral-500 py-2">
                          Seja o primeiro a comentar nesta faixa.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {currentTrack.comments.map((cm) => (
                            <div
                              key={cm.id}
                              className="p-3.5 rounded-lg bg-[#141418]/60 border border-white/5 space-y-1"
                            >
                              <div className="flex items-center gap-2 text-xs">
                                <span className="font-semibold text-white">
                                  {cm.author}
                                </span>
                                <span className="text-neutral-500">{cm.handle}</span>
                                <span aria-hidden="true" className="text-neutral-600">
                                  ·
                                </span>
                                <span className="text-neutral-400">{cm.timeAgo}</span>
                              </div>
                              <p className="text-xs text-neutral-200 leading-relaxed">
                                {cm.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right 4 cols: Up Next Queue (A Seguir) */}
                <div className="xl:col-span-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-display text-base font-bold text-white">
                        A Seguir na Fila
                      </h2>
                      <p className="text-xs text-neutral-400">
                        Reprodução contínua automática ({filteredTracks.length} faixas)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(true)}
                      className="text-xs font-medium text-[#FF4D6D] hover:underline whitespace-nowrap"
                    >
                      + Enviar faixa
                    </button>
                  </div>

                  <div className="rounded-xl bg-[#141418] border border-white/10 divide-y divide-white/5 overflow-hidden">
                    {filteredTracks.length === 0 ? (
                      <div className="p-6 text-center space-y-2">
                        <p className="text-xs text-neutral-400">
                          Nenhuma música encontrada para este filtro.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory('all');
                            setSearchQuery('');
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-white/10 rounded-lg"
                        >
                          Limpar Filtros
                        </button>
                      </div>
                    ) : (
                      filteredTracks.map((trk, index) => {
                        const isActive = trk.id === currentTrack.id;
                        return (
                          <div
                            key={trk.id}
                            onClick={() => handleSelectTrack(trk, true)}
                            className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                              isActive
                                ? 'bg-white/10'
                                : 'hover:bg-white/5'
                            }`}
                          >
                            <span className="w-5 text-center font-mono tabular-nums text-xs text-neutral-500 shrink-0">
                              {isActive && isPlaying
                                ? '▶'
                                : String(index + 1).padStart(2, '0')}
                            </span>

                            <div className="relative w-14 h-14 rounded-md overflow-hidden bg-black shrink-0 border border-white/10">
                              <CoverImage
                                src={trk.coverUrl}
                                alt={trk.title}
                                accentHue={trk.accentHue}
                                className="w-full h-full"
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div
                                className={`text-xs font-semibold truncate ${
                                  isActive ? 'text-[#FF4D6D]' : 'text-white'
                                }`}
                              >
                                {trk.title}
                              </div>
                              <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                                {trk.artist}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mt-0.5">
                                <span>{trk.categoryLabel}</span>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums">
                                  {trk.durationFormatted}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Destaques do Catálogo em Grade */}
              <section className="pt-4 border-t border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-lg font-bold text-white">
                      Sessões de Estúdio & Lançamentos
                    </h2>
                    <p className="text-xs text-neutral-400">
                      Clique em qualquer capa para iniciar a reprodução imediata
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveNav('explorar')}
                    className="text-xs font-medium text-neutral-300 hover:text-white hover:underline whitespace-nowrap"
                  >
                    Ver tabela completa
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {tracks.slice(0, 8).map((trk) => {
                    const isActive = trk.id === currentTrack.id;
                    return (
                      <div
                        key={trk.id}
                        onClick={() => handleSelectTrack(trk, true)}
                        className="group cursor-pointer rounded-xl bg-[#141418] border border-white/10 overflow-hidden hover:border-white/25 transition-colors flex flex-col"
                      >
                        <div className="relative aspect-video w-full overflow-hidden bg-black">
                          <CoverImage
                            src={trk.coverUrl}
                            alt={trk.title}
                            accentHue={trk.accentHue}
                            className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                          <span className="absolute bottom-2 right-2 font-mono tabular-nums text-[11px] text-white bg-black/80 px-1.5 py-0.5 rounded">
                            {trk.durationFormatted}
                          </span>
                        </div>

                        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                          <div>
                            <h3
                              className={`text-sm font-semibold line-clamp-1 ${
                                isActive ? 'text-[#FF4D6D]' : 'text-white'
                              }`}
                            >
                              {trk.title}
                            </h3>
                            <p className="text-xs text-neutral-400 mt-0.5 truncate">
                              {trk.artist}
                            </p>
                          </div>

                          {/* Clean unboxed metadata with · separators */}
                          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 pt-1">
                            <span>{trk.categoryLabel}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">
                              {trk.viewsFormatted}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {/* VIEW 2: EXPLORAR (High-Density Studio Data Grid) */}
          {activeNav === 'explorar' && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="font-display text-xl font-bold text-white">
                    Explorar Catálogo de Músicas
                  </h1>
                  <p className="text-xs text-neutral-400">
                    {filteredTracks.length} faixas disponíveis para reprodução imediata
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#FF0033] hover:bg-[#D9002B] rounded-lg transition-colors whitespace-nowrap"
                >
                  + Adicionar Faixa Própria
                </button>
              </div>

              <div className="rounded-xl bg-[#141418] border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-[11px] font-semibold text-neutral-400">
                        <th className="py-3 pl-4 pr-2 w-10">#</th>
                        <th className="py-3 px-3">Faixa</th>
                        <th className="py-3 px-3 hidden md:table-cell">Álbum</th>
                        <th className="py-3 px-3 hidden sm:table-cell">Estilo</th>
                        <th className="py-3 px-3 text-right hidden lg:table-cell">BPM</th>
                        <th className="py-3 px-3 text-right">Duração</th>
                        <th className="py-3 pl-2 pr-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {filteredTracks.map((trk, idx) => {
                        const isActive = trk.id === currentTrack.id;
                        const liked = likedIds.includes(trk.id);
                        return (
                          <tr
                            key={trk.id}
                            onClick={() => handleSelectTrack(trk, true)}
                            className={`cursor-pointer transition-colors ${
                              isActive ? 'bg-white/10' : 'hover:bg-white/5'
                            }`}
                          >
                            <td className="py-2.5 pl-4 pr-2 font-mono tabular-nums text-neutral-500">
                              {String(idx + 1).padStart(2, '0')}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded overflow-hidden shrink-0 border border-white/10">
                                  <CoverImage
                                    src={trk.coverUrl}
                                    alt={trk.title}
                                    accentHue={trk.accentHue}
                                    className="w-full h-full"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div
                                    className={`font-semibold truncate max-w-[240px] sm:max-w-xs ${
                                      isActive ? 'text-[#FF4D6D]' : 'text-white'
                                    }`}
                                  >
                                    {trk.title}
                                  </div>
                                  <div className="text-neutral-400 truncate">
                                    {trk.artist}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-neutral-300 hidden md:table-cell">
                              {trk.album}
                            </td>
                            <td className="py-2.5 px-3 text-neutral-400 hidden sm:table-cell">
                              {trk.categoryLabel}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-400 hidden lg:table-cell">
                              {trk.synthConfig.bpm}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-300">
                              {trk.durationFormatted}
                            </td>
                            <td
                              className="py-2.5 pl-2 pr-4 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => handleToggleLike(trk.id)}
                                className={`p-1.5 rounded-md hover:bg-white/10 transition-colors ${
                                  liked ? 'text-[#FF4D6D]' : 'text-neutral-400'
                                }`}
                                aria-label="Curtir faixa"
                              >
                                <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* VIEW 3: BIBLIOTECA (Músicas Curtidas & Histórico Recente) */}
          {activeNav === 'biblioteca' && (
            <section className="space-y-8">
              <div className="space-y-4">
                <div>
                  <h1 className="font-display text-xl font-bold text-white">
                    Músicas Curtidas
                  </h1>
                  <p className="text-xs text-neutral-400">
                    Salvas automaticamente no seu navegador ({likedIds.length} faixas)
                  </p>
                </div>

                {likedIds.length === 0 ? (
                  <div className="p-8 rounded-xl bg-[#141418] border border-white/10 text-center space-y-3">
                    <p className="text-xs text-neutral-400">
                      Você ainda não marcou nenhuma música com "Gostei".
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveNav('explorar')}
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#FF0033] rounded-lg"
                    >
                      Explorar Músicas
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tracks
                      .filter((t) => likedIds.includes(t.id))
                      .map((trk) => (
                        <div
                          key={trk.id}
                          onClick={() => handleSelectTrack(trk, true)}
                          className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#141418] border border-white/10 hover:border-white/25 cursor-pointer transition-colors"
                        >
                          <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-white/10">
                            <CoverImage
                              src={trk.coverUrl}
                              alt={trk.title}
                              accentHue={trk.accentHue}
                              className="w-full h-full"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold text-white truncate">
                              {trk.title}
                            </h3>
                            <p className="text-xs text-neutral-400 truncate">
                              {trk.artist}
                            </p>
                            <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mt-1">
                              <span>{trk.categoryLabel}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">
                                {trk.durationFormatted}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Listening History */}
              <div className="pt-4 border-t border-white/10 space-y-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-white">
                    Histórico de Reprodução Recente
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Últimas faixas reproduzidas nesta sessão
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {historyIds
                    .map((id) => tracks.find((t) => t.id === id))
                    .filter((t): t is Track => Boolean(t))
                    .map((trk) => (
                      <div
                        key={trk.id}
                        onClick={() => handleSelectTrack(trk, true)}
                        className="p-3 rounded-xl bg-[#141418] border border-white/10 hover:bg-white/5 cursor-pointer transition-colors flex items-center gap-3"
                      >
                        <div className="w-12 h-12 rounded overflow-hidden shrink-0">
                          <CoverImage
                            src={trk.coverUrl}
                            alt={trk.title}
                            accentHue={trk.accentHue}
                            className="w-full h-full"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white truncate">
                            {trk.title}
                          </div>
                          <div className="text-[11px] text-neutral-400 truncate">
                            {trk.artist}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </section>
          )}

          {/* VIEW 4: PLAYLISTS */}
          {activeNav === 'playlists' && (
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-7">
              {/* Left 4 cols: Playlist selector & Create form */}
              <div className="lg:col-span-4 space-y-5">
                <div>
                  <h1 className="font-display text-xl font-bold text-white">
                    Playlists
                  </h1>
                  <p className="text-xs text-neutral-400">
                    Organize coleções e exporte para o seu repositório GitHub
                  </p>
                </div>

                <div className="space-y-2">
                  {playlists.map((pl) => (
                    <button
                      key={pl.id}
                      type="button"
                      onClick={() => setActivePlaylistId(pl.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-colors ${
                        activePlaylistId === pl.id
                          ? 'bg-white/10 border-[#FF0033]'
                          : 'bg-[#141418] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white truncate">
                          {pl.name}
                        </span>
                        <span className="font-mono tabular-nums text-xs text-neutral-400">
                          {pl.trackIds.length} faixas
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1 line-clamp-1">
                        {pl.description}
                      </p>
                    </button>
                  ))}
                </div>

                <form
                  onSubmit={handleCreatePlaylist}
                  className="p-4 rounded-xl bg-[#141418] border border-white/10 space-y-3"
                >
                  <div className="text-xs font-semibold text-white">
                    Criar Nova Playlist
                  </div>
                  <input
                    type="text"
                    required
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="Nome da playlist..."
                    className="w-full px-3 py-2 text-xs bg-[#0A0A0C] border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#FF0033]"
                  />
                  <input
                    type="text"
                    value={newPlaylistDesc}
                    onChange={(e) => setNewPlaylistDesc(e.target.value)}
                    placeholder="Descrição curta (opcional)"
                    className="w-full px-3 py-2 text-xs bg-[#0A0A0C] border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#FF0033]"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 px-4 text-xs font-semibold text-white bg-[#FF0033] hover:bg-[#D9002B] rounded-lg transition-colors whitespace-nowrap"
                  >
                    + Criar Playlist
                  </button>
                </form>
              </div>

              {/* Right 8 cols: Active Playlist Tracks */}
              <div className="lg:col-span-8 space-y-4">
                {(() => {
                  const activePl =
                    playlists.find((p) => p.id === activePlaylistId) || playlists[0];
                  if (!activePl) return null;
                  const plTracks = activePl.trackIds
                    .map((id) => tracks.find((t) => t.id === id))
                    .filter((t): t is Track => Boolean(t));

                  return (
                    <div className="rounded-xl bg-[#141418] border border-white/10 p-5 space-y-5">
                      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
                        <div>
                          <div className="text-xs text-neutral-400">
                            Playlist Selecionada · {activePl.createdAt}
                          </div>
                          <h2 className="font-display text-lg font-bold text-white mt-0.5">
                            {activePl.name}
                          </h2>
                          <p className="text-xs text-neutral-300 mt-1">
                            {activePl.description}
                          </p>
                        </div>

                        {plTracks.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleSelectTrack(plTracks[0], true)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#FF0033] hover:bg-[#D9002B] rounded-lg transition-colors whitespace-nowrap"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Tocar Playlist</span>
                          </button>
                        )}
                      </div>

                      {plTracks.length === 0 ? (
                        <p className="text-xs text-neutral-400 py-4">
                          Esta playlist está vazia. Adicione faixas abaixo.
                        </p>
                      ) : (
                        <div className="divide-y divide-white/5">
                          {plTracks.map((trk, i) => (
                            <div
                              key={trk.id}
                              className="flex items-center justify-between gap-3 py-3"
                            >
                              <div
                                onClick={() => handleSelectTrack(trk, true)}
                                className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                              >
                                <span className="font-mono tabular-nums text-xs text-neutral-500 w-5">
                                  {String(i + 1).padStart(2, '0')}
                                </span>
                                <div className="w-10 h-10 rounded overflow-hidden shrink-0">
                                  <CoverImage
                                    src={trk.coverUrl}
                                    alt={trk.title}
                                    accentHue={trk.accentHue}
                                    className="w-full h-full"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-white truncate">
                                    {trk.title}
                                  </div>
                                  <div className="text-[11px] text-neutral-400 truncate">
                                    {trk.artist} · {trk.durationFormatted}
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveFromPlaylist(activePl.id, trk.id)
                                }
                                className="p-1.5 text-neutral-400 hover:text-[#FF4D6D] rounded-lg hover:bg-white/5 transition-colors"
                                aria-label="Remover da playlist"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Quick add other tracks to this playlist */}
                      <div className="pt-4 border-t border-white/10 space-y-2.5">
                        <div className="text-xs font-semibold text-neutral-300">
                          Adicionar mais músicas a "{activePl.name}"
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {tracks
                            .filter((t) => !activePl.trackIds.includes(t.id))
                            .slice(0, 4)
                            .map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() =>
                                  handleAddTrackToPlaylist(activePl.id, t.id)
                                }
                                className="flex items-center justify-between p-2.5 rounded-lg bg-[#0A0A0C] hover:bg-white/5 border border-white/5 text-left transition-colors"
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="text-xs font-medium text-white truncate">
                                    {t.title}
                                  </div>
                                  <div className="text-[11px] text-neutral-400 truncate">
                                    {t.artist}
                                  </div>
                                </div>
                                <Plus className="w-4 h-4 text-neutral-400 shrink-0" />
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </section>
          )}

          {/* VIEW 5: ESTÚDIO EQ (5-Band Web Audio Equalizer) */}
          {activeNav === 'equalizador' && (
            <section className="max-w-3xl space-y-6">
              <div>
                <h1 className="font-display text-xl font-bold text-white">
                  Equalizador de Estúdio (5 Bandas em Tempo Real)
                </h1>
                <p className="text-xs text-neutral-400">
                  Processamento direto via Web Audio API BiquadFilterNode para moldar graves, médios e agudos
                </p>
              </div>

              {/* EQ Presets */}
              <div className="flex flex-wrap items-center gap-2">
                {Object.entries(EQ_PRESETS).map(([key, preset]) => {
                  const isCurrent =
                    preset.gains.every((val, idx) => val === eqGains[idx]);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEqGains([...preset.gains])}
                      className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                        isCurrent
                          ? 'bg-[#FF0033] text-white font-semibold'
                          : 'bg-[#141418] text-neutral-300 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* 5-Band Sliders Card */}
              <div className="p-6 rounded-xl bg-[#141418] border border-white/10 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-6">
                  {EQ_FREQUENCIES.map((freq, idx) => {
                    const label =
                      freq >= 1000 ? `${(freq / 1000).toFixed(1)} kHz` : `${freq} Hz`;
                    const bandNames = [
                      'Sub-Grave',
                      'Grave',
                      'Médio',
                      'Presença',
                      'Brilho / Ar',
                    ];
                    const gainVal = eqGains[idx];
                    return (
                      <div
                        key={freq}
                        className="flex flex-col items-center p-4 rounded-lg bg-[#0A0A0C] border border-white/5 space-y-3"
                      >
                        <span className="font-mono tabular-nums text-xs font-semibold text-white">
                          {gainVal > 0 ? `+${gainVal}` : gainVal} dB
                        </span>

                        <input
                          type="range"
                          min={-12}
                          max={12}
                          step={1}
                          value={gainVal}
                          onChange={(e) => {
                            const next: [number, number, number, number, number] = [
                              ...eqGains,
                            ];
                            next[idx] = Number(e.target.value);
                            setEqGains(next);
                          }}
                          className="w-full yt-slider bg-white/10 h-1.5 rounded-lg"
                        />

                        <div className="text-center">
                          <div className="font-mono tabular-nums text-xs font-medium text-neutral-200">
                            {label}
                          </div>
                          <div className="text-[11px] text-neutral-500">
                            {bandNames[idx]}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-neutral-400">
                  <span>
                    Tocando agora: <strong className="text-white">{currentTrack.title}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setEqGains([0, 0, 0, 0, 0])}
                    className="text-neutral-300 hover:text-white underline whitespace-nowrap"
                  >
                    Resetar para 0 dB
                  </button>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* PERSISTENT BOTTOM PLAYER BAR (h-20, <= 15% viewport height) */}
      <footer className="fixed bottom-0 inset-x-0 z-40 h-20 bg-[#121216]/95 backdrop-blur-lg border-t border-white/10 px-4 lg:px-8 flex flex-col justify-center">
        {/* Top Interactive Progress Scrubber Line */}
        <div className="w-full flex items-center gap-3 mb-1.5">
          <span className="font-mono tabular-nums text-[11px] text-neutral-400 w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(1, duration)}
            step={0.2}
            value={Math.min(currentTime, duration)}
            onChange={handleSeek}
            aria-label="Progresso da música"
            className="flex-1 yt-slider h-1 bg-white/15 rounded-lg"
          />
          <span className="font-mono tabular-nums text-[11px] text-neutral-400 w-10">
            {formatTime(duration)}
          </span>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between gap-4">
          {/* Left: Current Track Mini Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1 max-w-xs">
            <div
              onClick={() => setActiveNav('inicio')}
              className="w-10 h-10 rounded overflow-hidden shrink-0 border border-white/10 cursor-pointer"
            >
              <CoverImage
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                accentHue={currentTrack.accentHue}
                className="w-full h-full"
              />
            </div>
            <div className="min-w-0">
              <div
                onClick={() => setActiveNav('inicio')}
                className="text-xs font-semibold text-white truncate cursor-pointer hover:underline"
              >
                {currentTrack.title}
              </div>
              <div className="text-[11px] text-neutral-400 truncate">
                {currentTrack.artist}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggleLike(currentTrack.id)}
              className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0 ${
                isCurrentLiked ? 'text-[#FF4D6D]' : 'text-neutral-400'
              }`}
              aria-label="Curtir música atual"
            >
              <Heart className={`w-4 h-4 ${isCurrentLiked ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Center: Transport Controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => setIsShuffle(!isShuffle)}
              className={`p-2 rounded-lg transition-colors hidden sm:inline-flex ${
                isShuffle
                  ? 'text-[#FF4D6D] bg-white/10'
                  : 'text-neutral-400 hover:text-white'
              }`}
              aria-label="Modo aleatório"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handlePrevTrack}
              className="p-2 text-neutral-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Faixa anterior"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleTogglePlay}
              className="w-10 h-10 rounded-full bg-[#FF0033] hover:bg-[#D9002B] text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
              aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={handleNextTrack}
              className="p-2 text-neutral-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Próxima faixa"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsRepeat(!isRepeat)}
              className={`p-2 rounded-lg transition-colors hidden sm:inline-flex ${
                isRepeat
                  ? 'text-[#FF4D6D] bg-white/10'
                  : 'text-neutral-400 hover:text-white'
              }`}
              aria-label="Repetir faixa"
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Audio/Video Toggle, EQ & Volume */}
          <div className="flex items-center justify-end gap-2.5 flex-1 max-w-xs">
            <button
              type="button"
              onClick={() => {
                setStageMode(stageMode === 'audio' ? 'video' : 'audio');
                setActiveNav('inicio');
              }}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/15 text-neutral-200 transition-colors whitespace-nowrap"
            >
              {stageMode === 'audio' ? (
                <>
                  <Video className="w-3.5 h-3.5 text-[#FF4D6D]" />
                  <span>Ver Clipe</span>
                </>
              ) : (
                <>
                  <Music className="w-3.5 h-3.5 text-[#FF4D6D]" />
                  <span>Modo Áudio</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('playlists')}
              className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors hidden sm:inline-flex"
              aria-label="Playlists"
            >
              <ListMusic className="w-4 h-4" />
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleMute}
                className="p-1.5 text-neutral-400 hover:text-white transition-colors"
                aria-label={isMuted ? 'Ativar som' : 'Silenciar'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-[#FF4D6D]" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                aria-label="Volume"
                className="w-20 yt-slider h-1 bg-white/15 rounded-lg"
              />
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AddTrackModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTrack={handleAddTrack}
      />

      <GitHubDeployModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        tracks={tracks}
        playlists={playlists}
        onImportBackup={handleImportBackup}
      />
    </div>
  );
}
