import heroStudioImg from '../assets/images/hero_featured_album_1790920649904.jpg';
import coverBossaImg from '../assets/images/cover_bossa_acustica_1790920660981.jpg';
import coverSynthImg from '../assets/images/cover_synth_noturno_1790920671232.jpg';
import coverLofiImg from '../assets/images/cover_lofi_estudo_1790920680769.jpg';

export type TrackCategory =
  | 'all'
  | 'lofi'
  | 'eletronica'
  | 'mpb'
  | 'hiphop'
  | 'acustico'
  | 'uploads';

export interface CommentItem {
  id: string;
  author: string;
  handle: string;
  timeAgo: string;
  text: string;
  likes: number;
}

export interface SynthPresetConfig {
  bpm: number;
  rootMidi: number;
  scaleIntervals: number[];
  chordProgression: number[][];
  waveType: OscillatorType;
  subBassLevel: number;
  arpPattern: number[];
  drumStyle: 'lofi' | 'synthwave' | 'bossa' | 'house' | 'ambient' | 'phonk';
  filterCutoff: number;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  artistSubscribers: string;
  album: string;
  category: Exclude<TrackCategory, 'all'>;
  categoryLabel: string;
  durationSeconds: number;
  durationFormatted: string;
  viewsFormatted: string;
  releaseDate: string;
  coverUrl: string;
  accentHue: string;
  description: string;
  lyrics: string[];
  synthConfig: SynthPresetConfig;
  audioUrl?: string; // Optional external/local MP3 or stream URL
  youtubeId?: string; // Optional YouTube video ID for clip mode
  comments: CommentItem[];
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  trackIds: string[];
  createdAt: string;
}

export const HERO_BANNER_IMAGE = heroStudioImg;

export const INITIAL_TRACKS: Track[] = [
  {
    id: 'trk-01',
    title: 'Horizonte Analógico (Sessão Ao Vivo no Estúdio)',
    artist: 'Coletivo Nebulosa',
    artistSubscribers: '418 mil inscritos',
    album: 'Fitas da Meia-Noite',
    category: 'eletronica',
    categoryLabel: 'Eletrônica & Synth',
    durationSeconds: 214,
    durationFormatted: '03:34',
    viewsFormatted: '1,8 mi visualizações',
    releaseDate: 'Outubro 2026',
    coverUrl: heroStudioImg,
    accentHue: '#FF0033',
    description:
      'Gravado ao vivo com sintetizadores modulares analógicos, Roland Juno-106 e bateria eletrônica clássica. Mixagem masterizada em fita de rolo de 1/4 de polegada.',
    lyrics: [
      'Luzes de tungstênio acendem no painel',
      'O pulso da cidade ecoa através dos cabos',
      'Frequências lentas desenham o horizonte',
      'Entre o silêncio e o grave que respira',
      'Deixe a fita girar até o amanhecer',
      'Cada oscilador guarda uma memória viva',
    ],
    synthConfig: {
      bpm: 108,
      rootMidi: 57, // A3
      scaleIntervals: [0, 2, 3, 5, 7, 8, 10, 12],
      chordProgression: [
        [0, 3, 7, 10],
        [8, 12, 15, 19],
        [5, 8, 12, 15],
        [7, 10, 14, 17],
      ],
      waveType: 'sawtooth',
      subBassLevel: 0.75,
      arpPattern: [0, 3, 7, 12, 7, 3, 10, 7],
      drumStyle: 'synthwave',
      filterCutoff: 1450,
    },
    comments: [
      {
        id: 'c-1',
        author: 'Lucas Andrade',
        handle: '@lucasandrade_audio',
        timeAgo: 'há 2 dias',
        text: 'A textura dos sintetizadores analógicos nessa faixa com o equalizador em Bass Boost fica absurda.',
        likes: 342,
      },
      {
        id: 'c-2',
        author: 'Marina Costa',
        handle: '@marinacosta',
        timeAgo: 'há 5 dias',
        text: 'Essa transição entre o modo Áudio e o Visualizador de Clipe é exatamente o que faltava para ouvir programando.',
        likes: 128,
      },
    ],
  },
  {
    id: 'trk-02',
    title: 'Brisa de Santa Teresa',
    artist: 'João Vitor & Quarteto Atlântico',
    artistSubscribers: '290 mil inscritos',
    album: 'Janelas de Cedro',
    category: 'mpb',
    categoryLabel: 'MPB & Bossa',
    durationSeconds: 198,
    durationFormatted: '03:18',
    viewsFormatted: '940 mil visualizações',
    releaseDate: 'Setembro 2026',
    coverUrl: coverBossaImg,
    accentHue: '#F59E0B',
    description:
      'Violão de 7 cordas em cedro maciço acompanhado de piano elétrico Rhodes suave e percussão orgânica gravada no Rio de Janeiro.',
    lyrics: [
      'O sol atravessa a veneziana de madeira',
      'Acordes de sétima maior dançam na varanda',
      'Lá embaixo o bonde dobra a esquina devagar',
      'Um café quente e o compasso sincopado',
      'Tudo encontra seu lugar na tarde dourada',
    ],
    synthConfig: {
      bpm: 92,
      rootMidi: 60, // C4
      scaleIntervals: [0, 2, 4, 5, 7, 9, 11, 12],
      chordProgression: [
        [0, 4, 7, 11],
        [9, 12, 16, 19],
        [2, 5, 9, 12],
        [7, 11, 14, 17],
      ],
      waveType: 'triangle',
      subBassLevel: 0.55,
      arpPattern: [0, 7, 4, 11, 2, 7, 4, 9],
      drumStyle: 'bossa',
      filterCutoff: 1100,
    },
    comments: [
      {
        id: 'c-3',
        author: 'Rafael Mendes',
        handle: '@rafa_violao',
        timeAgo: 'há 1 semana',
        text: 'Que harmonia limpa! Perfeita para deixar tocando no fim de tarde.',
        likes: 215,
      },
    ],
  },
  {
    id: 'trk-03',
    title: 'Chuva no Vinil (Beats para Focar & Programar)',
    artist: 'Koda Lo-Fi',
    artistSubscribers: '1,2 mi inscritos',
    album: 'Caderno de Estudos Vol. 4',
    category: 'lofi',
    categoryLabel: 'Lo-Fi & Chill',
    durationSeconds: 185,
    durationFormatted: '03:05',
    viewsFormatted: '3,4 mi visualizações',
    releaseDate: 'Agosto 2026',
    coverUrl: coverLofiImg,
    accentHue: '#10B981',
    description:
      'Batidas relaxantes em 78 BPM com chiado autêntico de agulha no vinil, acordes de jazz em fita cassete e sub-grave aveludado.',
    lyrics: [
      '[Instrumental — Lo-Fi Chillhop Studio Session]',
      'Frequência recomendada: 60Hz +3dB para imersão profunda',
      'Ideal para sessões de código, leitura e foco contínuo',
    ],
    synthConfig: {
      bpm: 78,
      rootMidi: 58, // Bb3
      scaleIntervals: [0, 2, 3, 5, 7, 8, 10, 12],
      chordProgression: [
        [0, 3, 7, 10],
        [5, 8, 12, 15],
        [3, 7, 10, 14],
        [2, 5, 9, 12],
      ],
      waveType: 'sine',
      subBassLevel: 0.7,
      arpPattern: [0, 3, 7, 10, 12, 10, 7, 3],
      drumStyle: 'lofi',
      filterCutoff: 850,
    },
    comments: [
      {
        id: 'c-4',
        author: 'Beatriz Oliveira',
        handle: '@bia_dev',
        timeAgo: 'há 3 dias',
        text: 'Subi meu projeto no GitHub ouvindo essa faixa no repeat. Zero travamentos!',
        likes: 519,
      },
    ],
  },
  {
    id: 'trk-04',
    title: 'Magnetismo de Rolo 1984',
    artist: 'Vektor & Aurora',
    artistSubscribers: '650 mil inscritos',
    album: 'Arquitetura Noturna',
    category: 'eletronica',
    categoryLabel: 'Eletrônica & Synth',
    durationSeconds: 228,
    durationFormatted: '03:48',
    viewsFormatted: '1,1 mi visualizações',
    releaseDate: 'Outubro 2026',
    coverUrl: coverSynthImg,
    accentHue: '#3B82F6',
    description:
      'Arpejos hipnóticos em 122 BPM inspirados nas trilhas sonoras eletrônicas clássicas e no club underground europeu.',
    lyrics: [
      'A agulha do VU marca o pico exato',
      'Dois canais em estéreo cruzam a madrugada',
      'Sem pressa, o filtro abre como um farol na neblina',
      'Movimento perpétuo em 122 batidas por minuto',
    ],
    synthConfig: {
      bpm: 122,
      rootMidi: 55, // G3
      scaleIntervals: [0, 2, 3, 5, 7, 8, 10, 12],
      chordProgression: [
        [0, 3, 7, 12],
        [7, 10, 14, 19],
        [8, 12, 15, 20],
        [5, 8, 12, 17],
      ],
      waveType: 'sawtooth',
      subBassLevel: 0.85,
      arpPattern: [0, 7, 12, 7, 3, 7, 10, 7],
      drumStyle: 'house',
      filterCutoff: 1750,
    },
    comments: [
      {
        id: 'c-5',
        author: 'Thiago Synth',
        handle: '@thiagosynth',
        timeAgo: 'há 4 dias',
        text: 'Esse arpejo com o visualizador em tela cheia dá uma sensação incrível de estúdio.',
        likes: 184,
      },
    ],
  },
  {
    id: 'trk-05',
    title: 'Deriva Noturna em Tóquio (Drift Phonk)',
    artist: 'Kuroi 808',
    artistSubscribers: '890 mil inscritos',
    album: 'Turbina & Neon',
    category: 'hiphop',
    categoryLabel: 'Hip-Hop & Phonk',
    durationSeconds: 164,
    durationFormatted: '02:44',
    viewsFormatted: '4,2 mi visualizações',
    releaseDate: 'Setembro 2026',
    coverUrl: coverSynthImg,
    accentHue: '#E11D48',
    description:
      'Cowbell marcante, sub-bass 808 saturado e batida acelerada para treinos intensos e direção noturna.',
    lyrics: [
      '[Instrumental — 808 Drift Phonk]',
      'Grave 808 otimizado para fones e monitores de referência',
    ],
    synthConfig: {
      bpm: 132,
      rootMidi: 53, // F3
      scaleIntervals: [0, 1, 3, 5, 7, 8, 10, 12],
      chordProgression: [
        [0, 3, 7],
        [1, 5, 8],
        [0, 3, 7],
        [7, 10, 14],
      ],
      waveType: 'square',
      subBassLevel: 0.95,
      arpPattern: [0, 0, 7, 3, 8, 7, 3, 1],
      drumStyle: 'phonk',
      filterCutoff: 1600,
    },
    comments: [],
  },
  {
    id: 'trk-06',
    title: 'Prelúdio da Serra (Violão & Cordas)',
    artist: 'Clara Vasconcelos',
    artistSubscribers: '175 mil inscritos',
    album: 'Acústico na Mantiqueira',
    category: 'acustico',
    categoryLabel: 'Acústico & Piano',
    durationSeconds: 206,
    durationFormatted: '03:26',
    viewsFormatted: '530 mil visualizações',
    releaseDate: 'Julho 2026',
    coverUrl: coverBossaImg,
    accentHue: '#D97706',
    description:
      'Composição minimalista unindo dedilhado acústico e ambiência cinematográfica gravada em cabana de madeira na Serra da Mantiqueira.',
    lyrics: [
      'A neblina desce lenta sobre o vale',
      'Madeira seca estala na lareira acesa',
      'Cada nota suspensa no ar frio da manhã',
      'O tempo desacelera quando a gente escuta',
    ],
    synthConfig: {
      bpm: 72,
      rootMidi: 62, // D4
      scaleIntervals: [0, 2, 4, 7, 9, 12],
      chordProgression: [
        [0, 4, 7, 11],
        [5, 9, 12, 16],
        [9, 12, 16, 19],
        [7, 11, 14, 18],
      ],
      waveType: 'triangle',
      subBassLevel: 0.45,
      arpPattern: [0, 4, 7, 12, 9, 7, 4, 2],
      drumStyle: 'ambient',
      filterCutoff: 980,
    },
    comments: [],
  },
  {
    id: 'trk-07',
    title: 'Expresso da Paulista (Lo-Fi Jazz Hop)',
    artist: 'Koda Lo-Fi',
    artistSubscribers: '1,2 mi inscritos',
    album: 'Caderno de Estudos Vol. 4',
    category: 'lofi',
    categoryLabel: 'Lo-Fi & Chill',
    durationSeconds: 176,
    durationFormatted: '02:56',
    viewsFormatted: '1,5 mi visualizações',
    releaseDate: 'Agosto 2026',
    coverUrl: coverLofiImg,
    accentHue: '#8B5CF6',
    description:
      'Groove urbano com acordes de sétima menor, bumbo macio e atmosfera noturna de metrópole.',
    lyrics: [
      '[Instrumental — Urban Jazz Hop]',
      'Gravado em 48kHz com simulação de fita analógica',
    ],
    synthConfig: {
      bpm: 84,
      rootMidi: 60,
      scaleIntervals: [0, 2, 3, 5, 7, 9, 10, 12],
      chordProgression: [
        [2, 5, 9, 12],
        [7, 10, 14, 17],
        [0, 4, 7, 11],
        [9, 12, 16, 19],
      ],
      waveType: 'sine',
      subBassLevel: 0.68,
      arpPattern: [2, 5, 9, 12, 9, 7, 5, 4],
      drumStyle: 'lofi',
      filterCutoff: 920,
    },
    comments: [],
  },
  {
    id: 'trk-08',
    title: 'Submarino Atlântico (Deep House Session)',
    artist: 'Coletivo Nebulosa',
    artistSubscribers: '418 mil inscritos',
    album: 'Fitas da Meia-Noite',
    category: 'eletronica',
    categoryLabel: 'Eletrônica & Synth',
    durationSeconds: 242,
    durationFormatted: '04:02',
    viewsFormatted: '820 mil visualizações',
    releaseDate: 'Outubro 2026',
    coverUrl: heroStudioImg,
    accentHue: '#06B6D4',
    description:
      'Deep House atmosférico com pads profundos, baixo pulsante em 120 BPM e percussão cristalina.',
    lyrics: [
      'Abaixo da superfície tudo é correnteza',
      'O grave guia o compasso no escuro azul',
      'Respire fundo no intervalo do compasso',
    ],
    synthConfig: {
      bpm: 120,
      rootMidi: 56, // Ab3
      scaleIntervals: [0, 2, 3, 5, 7, 8, 10, 12],
      chordProgression: [
        [0, 3, 7, 10],
        [5, 8, 12, 15],
        [8, 12, 15, 19],
        [7, 10, 14, 17],
      ],
      waveType: 'sawtooth',
      subBassLevel: 0.8,
      arpPattern: [0, 3, 10, 7, 12, 10, 7, 3],
      drumStyle: 'house',
      filterCutoff: 1320,
    },
    comments: [],
  },
];

export const INITIAL_PLAYLISTS: Playlist[] = [
  {
    id: 'pl-foco',
    name: 'Foco & Programação no GitHub',
    description: 'Seleção fluida de Lo-Fi, Synthwave e Acústico para programar sem distrações.',
    trackIds: ['trk-03', 'trk-01', 'trk-07', 'trk-06'],
    createdAt: 'Outubro 2026',
  },
  {
    id: 'pl-noite',
    name: 'Sessão Analógica da Meia-Noite',
    description: 'Sintetizadores de estúdio, Deep House e batidas noturnas.',
    trackIds: ['trk-01', 'trk-04', 'trk-08', 'trk-05'],
    createdAt: 'Outubro 2026',
  },
  {
    id: 'pl-brasil',
    name: 'Violão & Brisa Brasileira',
    description: 'Acordes quentes de Bossa Nova, MPB instrumental e violão de cedro.',
    trackIds: ['trk-02', 'trk-06'],
    createdAt: 'Setembro 2026',
  },
];

export const EQ_PRESETS: Record<string, { label: string; gains: [number, number, number, number, number] }> = {
  flat: { label: 'Padrão (Flat)', gains: [0, 0, 0, 0, 0] },
  bass: { label: 'Grave Potente (Bass Boost)', gains: [7, 5, 0, 1, 2] },
  lofi: { label: 'Fita Cassete / Lo-Fi', gains: [3, 4, 1, -3, -6] },
  acustico: { label: 'Estúdio Acústico', gains: [2, 1, 0, 3, 4] },
  vocal: { label: 'Destaque Harmônico', gains: [-2, 0, 4, 5, 2] },
  eletronico: { label: 'Clube & Synthwave', gains: [6, 3, -1, 3, 6] },
};
