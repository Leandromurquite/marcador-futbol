const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const os = require('os');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');
const QRCode = require('qrcode');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

const { generateMatchExcel, generateMatchPdf } = require('./reports');

// Configurar carpetas estáticas
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const soundsDir = path.join(__dirname, 'public', 'assets', 'sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

const reportsDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const historyFilePath = path.join(dataDir, 'historial_partidos.json');
if (!fs.existsSync(historyFilePath)) {
  fs.writeFileSync(historyFilePath, JSON.stringify([], null, 2), 'utf8');
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));
app.use('/reports', express.static(reportsDir));

// Configuración de Multer para logos y audios
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    const isAudio = file.mimetype.startsWith('audio/') || ['.mp3', '.wav', '.m4a', '.ogg', '.aac'].includes(ext);
    const prefix = isAudio ? 'audio-' : 'logo-';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, prefix + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 30 * 1024 * 1024 } // 30MB
});

// Función para obtener la IP local de la máquina
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  const candidates = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (iface.address.startsWith('192.168.') || iface.address.startsWith('10.') || iface.address.startsWith('172.')) {
          return iface.address;
        }
        candidates.push(iface.address);
      }
    }
  }
  return candidates[0] || 'localhost';
}

const localIp = getLocalIpAddress();
const controlUrl = `http://${localIp}:${PORT}/control`;
const displayUrl = `http://${localIp}:${PORT}/`;

const CLOSS_CLIPS = [
  { id: 'closs-cantalo', name: '¡Cántalo, Cántalo, Cántalo!', file: '/assets/sounds/closs-cantalo.mp3' },
  { id: 'mariano-closs-gol', name: '¡Benzemaaa Mariano Closs Gol!', file: '/assets/sounds/mariano-closs-gol.mp3' },
  { id: 'closs-cerrar-estadio', name: '¡Cierren el Estadio, Genio!', file: '/assets/sounds/closs-cerrar-estadio.mp3' },
  { id: 'closs-no-lo-cante', name: '¡No lo Cante, no lo Grite!', file: '/assets/sounds/closs-no-lo-cante.mp3' },
  { id: 'closs-atencion', name: '¡Atención, Gol!', file: '/assets/sounds/closs-atencion.mp3' },
  { id: 'closs-al-palo', name: '¡Al Palo!', file: '/assets/sounds/closs-al-palo.mp3' },
  { id: 'closs-cerca-palo', name: '¡Cerca del Palo!', file: '/assets/sounds/closs-cerca-palo.mp3' }
];

function getRandomGoalClip() {
  const goalClips = [
    '/assets/sounds/closs-cantalo.mp3',
    '/assets/sounds/mariano-closs-gol.mp3',
    '/assets/sounds/closs-cerrar-estadio.mp3',
    '/assets/sounds/closs-atencion.mp3',
    '/assets/sounds/closs-no-lo-cante.mp3'
  ];
  return goalClips[Math.floor(Math.random() * goalClips.length)];
}

// Estado global del partido
let matchState = {
  tournament: 'TORNEO DE FÚTBOL',
  pin: '1234',
  halfDurationMinutes: 45,
  theme: 'night', // 'night' | 'sunny' | 'cloudy' | 'sunset' | 'grass' | 'high-contrast'
  goalAudio: {
    type: 'closs_random', // 'closs_random' | 'closs_fixed' | 'horn' | 'custom'
    customUrl: '/assets/sounds/closs-cantalo.mp3',
    selectedClip: '/assets/sounds/closs-cantalo.mp3',
    name: 'Mariano Closs (Aleatorio - Variar Frases)'
  },
  team1: {
    name: 'EQUIPO LOCAL',
    shortName: 'LOC',
    logo: '/assets/team-local.svg',
    color: '#00d2ff',
    score: 0
  },
  team2: {
    name: 'EQUIPO VISITA',
    shortName: 'VIS',
    logo: '/assets/team-visita.svg',
    color: '#ff3366',
    score: 0
  },
  timer: {
    seconds: 0,
    isRunning: false,
    period: '1T',
    extraTime: 0
  },
  penalties: {
    enabled: false,
    firstKicker: 'team1', // 'team1' | 'team2'
    currentTurn: 'team1', // 'team1' | 'team2' | null
    currentRound: 1,      // 1..5, 6...
    team1: ['pending', 'pending', 'pending', 'pending', 'pending'],
    team2: ['pending', 'pending', 'pending', 'pending', 'pending'],
    score1: 0,
    score2: 0,
    winner: null,      // 'team1' | 'team2' | null
    winnerName: null,  // Nombre del equipo ganador
    isFinished: false  // true si matemáticamente ya terminó
  }
};

// =========================================================================
// LÓGICA REGLAMENTARIA DE PENALES (REGLAS OFICIALES FIFA CON TURNOS ALTERNOS)
// =========================================================================
function evaluatePenalties(state) {
  const p = state.penalties;
  const t1 = p.team1;
  const t2 = p.team2;
  const first = p.firstKicker || 'team1';

  const taken1 = t1.filter(s => s !== 'pending').length;
  const taken2 = t2.filter(s => s !== 'pending').length;
  const score1 = t1.filter(s => s === 'scored').length;
  const score2 = t2.filter(s => s === 'scored').length;

  p.score1 = score1;
  p.score2 = score2;

  let winner = null;
  let isFinished = false;

  // 1. Serie regular de los primeros 5 tiros
  if (t1.length <= 5 && t2.length <= 5) {
    const rem1 = 5 - taken1;
    const rem2 = 5 - taken2;

    // Condición de imposibilidad matemática:
    // Si un equipo tiene más goles que los que el rival puede alcanzar sumando todos sus tiros restantes
    if (score1 > score2 + rem2) {
      winner = 'team1';
      isFinished = true;
    } else if (score2 > score1 + rem1) {
      winner = 'team2';
      isFinished = true;
    } else if (taken1 === 5 && taken2 === 5) {
      if (score1 > score2) {
        winner = 'team1';
        isFinished = true;
      } else if (score2 > score1) {
        winner = 'team2';
        isFinished = true;
      } else {
        // Empate a 5 goles -> Iniciar Muerte Súbita (tiro 6)
        t1.push('pending');
        t2.push('pending');
        isFinished = false;
        winner = null;
      }
    }
  } else {
    // 2. Muerte Súbita (Tiros 6 en adelante)
    // Se decide únicamente cuando ambos equipos patearon el mismo número de tiros (por pares)
    if (taken1 === taken2 && taken1 >= 5) {
      if (score1 > score2) {
        winner = 'team1';
        isFinished = true;
      } else if (score2 > score1) {
        winner = 'team2';
        isFinished = true;
      } else if (taken1 === t1.length) {
        // Siguen empatados tras el par de tiros -> Agregar siguiente tiro
        t1.push('pending');
        t2.push('pending');
        isFinished = false;
        winner = null;
      }
    }
  }

  p.winner = winner;
  p.isFinished = isFinished;
  p.winnerName = winner === 'team1' ? state.team1.name : (winner === 'team2' ? state.team2.name : null);

  // Determinar turno actual y número de ronda
  if (isFinished) {
    p.currentTurn = null;
  } else {
    if (first === 'team1') {
      if (taken1 === taken2) {
        p.currentTurn = 'team1';
        p.currentRound = taken1 + 1;
      } else if (taken1 === taken2 + 1) {
        p.currentTurn = 'team2';
        p.currentRound = taken1;
      } else {
        p.currentTurn = taken1 <= taken2 ? 'team1' : 'team2';
        p.currentRound = Math.max(taken1, taken2);
      }
    } else {
      if (taken2 === taken1) {
        p.currentTurn = 'team2';
        p.currentRound = taken2 + 1;
      } else if (taken2 === taken1 + 1) {
        p.currentTurn = 'team1';
        p.currentRound = taken2;
      } else {
        p.currentTurn = taken2 <= taken1 ? 'team2' : 'team1';
        p.currentRound = Math.max(taken1, taken2);
      }
    }
  }

  return isFinished;
}

// Cronómetro del servidor
let timerInterval = null;

function startServerTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    if (matchState.timer.isRunning) {
      matchState.timer.seconds++;
      io.emit('timer_tick', {
        seconds: matchState.timer.seconds,
        isRunning: matchState.timer.isRunning
      });
    }
  }, 1000);
}

startServerTimer();

// Endpoints REST
app.get('/api/state', (req, res) => {
  const stateToSend = { ...matchState };
  delete stateToSend.pin;
  res.json(stateToSend);
});

app.get('/api/network-info', async (req, res) => {
  try {
    const qrDataUrl = await QRCode.toDataURL(controlUrl, {
      margin: 2,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
    res.json({
      localIp,
      port: PORT,
      controlUrl,
      displayUrl,
      qrDataUrl
    });
  } catch (err) {
    res.status(500).json({ error: 'Error generando código QR' });
  }
});

// Verificar PIN
app.post('/api/verify-pin', (req, res) => {
  const { pin } = req.body;
  if (pin && String(pin).trim() === String(matchState.pin).trim()) {
    res.json({ valid: true });
  } else {
    res.status(401).json({ valid: false, message: 'PIN incorrecto' });
  }
});

// Subida de logos
app.post('/api/upload-logo', upload.single('logo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se envió ninguna imagen' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, url: fileUrl });
});

// Subida de audio (MP3, WAV, etc.)
app.post('/api/upload-audio', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se envió ningún archivo de audio' });
  }
  const audioUrl = `/uploads/${req.file.filename}`;
  matchState.goalAudio.type = 'custom';
  matchState.goalAudio.customUrl = audioUrl;
  matchState.goalAudio.name = req.file.originalname;

  io.emit('goal_audio_updated', matchState.goalAudio);
  res.json({ success: true, url: audioUrl, filename: req.file.originalname });
});

// Historial de partidos terminados
app.get('/api/history', (req, res) => {
  try {
    if (fs.existsSync(historyFilePath)) {
      const list = JSON.parse(fs.readFileSync(historyFilePath, 'utf8'));
      res.json({ success: true, history: list });
    } else {
      res.json({ success: true, history: [] });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error al leer historial de partidos' });
  }
});

// Rutas directas
app.get('/control', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'control.html'));
});

app.get('/marcador', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// WebSockets
io.on('connection', (socket) => {
  socket.emit('sync_state', matchState);

  // Actualizar goles
  socket.on('update_score', (data) => {
    if (data.team === 'team1' || data.team === 'team2') {
      const team = matchState[data.team];
      const previousScore = team.score;
      if (typeof data.score === 'number') {
        team.score = Math.max(0, data.score);
      } else if (typeof data.delta === 'number') {
        team.score = Math.max(0, team.score + data.delta);
      }

      io.emit('score_updated', {
        team: data.team,
        score: team.score,
        state: matchState
      });

      if (team.score > previousScore) {
        let clipToPlay = matchState.goalAudio.customUrl;
        if (matchState.goalAudio.type === 'closs_random') {
          clipToPlay = getRandomGoalClip();
        } else if (matchState.goalAudio.type === 'closs_fixed') {
          clipToPlay = matchState.goalAudio.selectedClip || '/assets/sounds/closs-cantalo.mp3';
        }

        io.emit('goal_celebration', {
          teamKey: data.team,
          teamName: team.name,
          teamColor: team.color,
          teamLogo: team.logo,
          score1: matchState.team1.score,
          score2: matchState.team2.score,
          goalAudio: {
            ...matchState.goalAudio,
            customUrl: clipToPlay
          }
        });
      }
    }
  });

  // Cronómetro
  socket.on('timer_toggle', () => {
    matchState.timer.isRunning = !matchState.timer.isRunning;
    io.emit('timer_state', {
      seconds: matchState.timer.seconds,
      isRunning: matchState.timer.isRunning
    });
  });

  socket.on('timer_set', (data) => {
    if (typeof data.seconds === 'number') {
      matchState.timer.seconds = Math.max(0, data.seconds);
      if (typeof data.isRunning === 'boolean') {
        matchState.timer.isRunning = data.isRunning;
      }
      io.emit('timer_state', {
        seconds: matchState.timer.seconds,
        isRunning: matchState.timer.isRunning
      });
    }
  });

  socket.on('timer_reset', () => {
    matchState.timer.seconds = 0;
    matchState.timer.isRunning = false;
    io.emit('timer_state', {
      seconds: 0,
      isRunning: false
    });
  });

  // Periodos
  socket.on('set_period', (data) => {
    if (data && data.period) {
      matchState.timer.period = data.period;

      if (data.period === 'Penales') {
        matchState.penalties.enabled = true;
      }

      if (data.autoSetTime) {
        const halfSeconds = (matchState.halfDurationMinutes || 45) * 60;
        if (data.period === '2T' && matchState.timer.seconds < halfSeconds) {
          matchState.timer.seconds = halfSeconds;
        } else if (data.period === '1T' && matchState.timer.seconds === 0) {
          matchState.timer.seconds = 0;
        }
      }

      io.emit('period_updated', {
        period: matchState.timer.period,
        seconds: matchState.timer.seconds,
        isRunning: matchState.timer.isRunning,
        penalties: matchState.penalties
      });
    }
  });

  // Duración de tiempo de partido
  socket.on('set_half_duration', (data) => {
    if (data && typeof data.minutes === 'number' && data.minutes > 0) {
      matchState.halfDurationMinutes = data.minutes;
      io.emit('half_duration_updated', {
        halfDurationMinutes: matchState.halfDurationMinutes
      });
    }
  });

  // Tiempo extra
  socket.on('set_extra_time', (data) => {
    if (typeof data.minutes === 'number') {
      matchState.timer.extraTime = Math.max(0, data.minutes);
      io.emit('extra_time_updated', {
        extraTime: matchState.timer.extraTime
      });
    }
  });

  // CONTROL DE PENALES CON LÓGICA FIFA Y TURNOS ALTERNADOS
  socket.on('set_penalty_shot', (data) => {
    // data: { team: 'team1'|'team2', index: number, state: 'pending'|'scored'|'missed' }
    if (data.team === 'team1' || data.team === 'team2') {
      const p = matchState.penalties;

      // Si ya finalizó
      if (p.isFinished && data.state !== 'pending') {
        socket.emit('penalty_turn_error', {
          message: `La serie de penales ya finalizó. ¡${p.winnerName} es el ganador!`,
          currentTurn: null
        });
        return;
      }

      // Validación de turno al marcar gol o fallo
      if (data.state !== 'pending' && p.currentTurn && data.team !== p.currentTurn) {
        const turnTeamName = matchState[p.currentTurn].name;
        socket.emit('penalty_turn_error', {
          message: `No se puede hacer el gol, falta que el otro equipo ejecute el tiro penal (Turno de ${turnTeamName})`,
          currentTurn: p.currentTurn,
          teamName: turnTeamName
        });
        return;
      }

      const arr = p[data.team];
      if (data.index >= 0 && data.index < arr.length) {
        arr[data.index] = data.state;
      }

      const isWon = evaluatePenalties(matchState);
      io.emit('penalties_updated', matchState.penalties);

      if (isWon) {
        io.emit('play_sound', { sound: 'whistle_long' });
      }
    }
  });

  // Acción rápida de penal (+Gol, +Fallo, Deshacer) con estricto turno alterno
  socket.on('quick_penalty_action', (data) => {
    // data: { team: 'team1'|'team2', action: 'scored' | 'missed' | 'undo' }
    if (data.team === 'team1' || data.team === 'team2') {
      const p = matchState.penalties;

      if (data.action === 'undo') {
        // Deshacer el último tiro registrado en la serie
        const taken1 = p.team1.filter(s => s !== 'pending').length;
        const taken2 = p.team2.filter(s => s !== 'pending').length;

        let targetTeam = data.team;
        const first = p.firstKicker || 'team1';
        if (taken1 > taken2) {
          targetTeam = 'team1';
        } else if (taken2 > taken1) {
          targetTeam = 'team2';
        } else if (taken1 === taken2 && taken1 > 0) {
          targetTeam = first === 'team1' ? 'team2' : 'team1';
        }

        const arr = p[targetTeam];
        for (let i = arr.length - 1; i >= 0; i--) {
          if (arr[i] !== 'pending') {
            arr[i] = 'pending';
            break;
          }
        }

        evaluatePenalties(matchState);
        io.emit('penalties_updated', matchState.penalties);
        return;
      }

      // Si la serie ya terminó
      if (p.isFinished) {
        socket.emit('penalty_turn_error', {
          message: `La serie de penales ya finalizó. ¡${p.winnerName} es el ganador!`,
          currentTurn: null
        });
        return;
      }

      // VALIDACIÓN ESTRICTA DE TURNO
      if (p.currentTurn && data.team !== p.currentTurn) {
        const turnTeamName = matchState[p.currentTurn].name;
        socket.emit('penalty_turn_error', {
          message: `No se puede hacer el gol, falta que el otro equipo ejecute el tiro penal (Turno de ${turnTeamName})`,
          currentTurn: p.currentTurn,
          teamName: turnTeamName
        });
        return;
      }

      const arr = p[data.team];
      // Encontrar primer tiro pendiente
      let found = false;
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] === 'pending') {
          arr[i] = data.action;
          found = true;
          break;
        }
      }

      // Muerte súbita: si no había pendientes
      if (!found && !p.isFinished) {
        p.team1.push('pending');
        p.team2.push('pending');
        p[data.team][arr.length - 1] = data.action;
      }

      const isWon = evaluatePenalties(matchState);
      io.emit('penalties_updated', matchState.penalties);

      if (isWon) {
        io.emit('play_sound', { sound: 'whistle_long' });
      } else if (data.action === 'scored') {
        const clip = getRandomGoalClip();
        io.emit('play_sound_clip', { url: clip });
      } else if (data.action === 'missed') {
        if (data.reason === 'post') {
          io.emit('play_sound_clip', { url: '/assets/sounds/closs-al-palo.mp3' });
        } else if (data.reason === 'wide') {
          io.emit('play_sound_clip', { url: '/assets/sounds/closs-cerca-palo.mp3' });
        } else {
          io.emit('play_sound', { sound: 'whistle_short' });
        }
      }
    }
  });

  socket.on('set_first_kicker', (data) => {
    if (data && (data.team === 'team1' || data.team === 'team2')) {
      const taken1 = matchState.penalties.team1.filter(s => s !== 'pending').length;
      const taken2 = matchState.penalties.team2.filter(s => s !== 'pending').length;
      if (taken1 === 0 && taken2 === 0) {
        matchState.penalties.firstKicker = data.team;
        matchState.penalties.currentTurn = data.team;
        io.emit('penalties_updated', matchState.penalties);
      }
    }
  });

  socket.on('toggle_penalties_visibility', (data) => {
    matchState.penalties.enabled = typeof data.enabled === 'boolean' ? data.enabled : !matchState.penalties.enabled;
    io.emit('penalties_updated', matchState.penalties);
  });

  socket.on('reset_penalties', () => {
    matchState.penalties.team1 = ['pending', 'pending', 'pending', 'pending', 'pending'];
    matchState.penalties.team2 = ['pending', 'pending', 'pending', 'pending', 'pending'];
    matchState.penalties.score1 = 0;
    matchState.penalties.score2 = 0;
    matchState.penalties.winner = null;
    matchState.penalties.winnerName = null;
    matchState.penalties.isFinished = false;
    matchState.penalties.firstKicker = 'team1';
    matchState.penalties.currentTurn = 'team1';
    matchState.penalties.currentRound = 1;
    io.emit('penalties_updated', matchState.penalties);
  });

  // Cambio de Tema / Clima de Cancha (Soleado, Nublado, Atardecer, Noche, Césped, Alto Contraste)
  socket.on('set_theme', (data) => {
    if (data && data.theme) {
      matchState.theme = data.theme;
      io.emit('theme_updated', { theme: matchState.theme });
    }
  });

  // Reproducir clip de Mariano Closs desde el Soundboard
  socket.on('play_sound_clip', (data) => {
    if (data && data.url) {
      io.emit('play_sound_clip', { url: data.url });
    }
  });

  // Configuración de audio
  socket.on('set_goal_audio', (data) => {
    if (data && data.type) {
      matchState.goalAudio.type = data.type;
      if (data.customUrl !== undefined) matchState.goalAudio.customUrl = data.customUrl;
      if (data.selectedClip !== undefined) matchState.goalAudio.selectedClip = data.selectedClip;
      if (data.name) matchState.goalAudio.name = data.name;
      io.emit('goal_audio_updated', matchState.goalAudio);
    }
  });

  // PIN de seguridad
  socket.on('set_pin', (data) => {
    if (data && data.pin && String(data.pin).trim().length >= 4) {
      matchState.pin = String(data.pin).trim();
      socket.emit('pin_changed', { success: true });
    }
  });

  // Actualizar nombres y colores
  socket.on('update_teams', (data) => {
    if (data.tournament) matchState.tournament = data.tournament;
    if (data.team1) {
      matchState.team1 = { ...matchState.team1, ...data.team1 };
    }
    if (data.team2) {
      matchState.team2 = { ...matchState.team2, ...data.team2 };
    }
    // Reevaluar ganador si cambiaron los nombres
    if (matchState.penalties.winner) {
      matchState.penalties.winnerName = matchState.penalties.winner === 'team1' ? matchState.team1.name : matchState.team2.name;
    }
    io.emit('teams_updated', matchState);
  });

  // Reiniciar partido
  socket.on('reset_match', () => {
    matchState.team1.score = 0;
    matchState.team2.score = 0;
    matchState.timer.seconds = 0;
    matchState.timer.isRunning = false;
    matchState.timer.period = '1T';
    matchState.timer.extraTime = 0;
    matchState.penalties.enabled = false;
    matchState.penalties.team1 = ['pending', 'pending', 'pending', 'pending', 'pending'];
    matchState.penalties.team2 = ['pending', 'pending', 'pending', 'pending', 'pending'];
    matchState.penalties.score1 = 0;
    matchState.penalties.score2 = 0;
    matchState.penalties.winner = null;
    matchState.penalties.winnerName = null;
    matchState.penalties.isFinished = false;
    matchState.penalties.firstKicker = 'team1';
    matchState.penalties.currentTurn = 'team1';
    matchState.penalties.currentRound = 1;
    io.emit('sync_state', matchState);
    io.emit('match_reset');
  });

  // FINALIZAR PARTIDO OFICIALMENTE Y GENERAR REPORTES (EXCEL Y PDF)
  socket.on('finish_match', async () => {
    // 1. Detener cronómetro y cambiar periodo a Finalizado
    matchState.timer.isRunning = false;
    matchState.timer.period = 'Finalizado';

    // 2. Determinar ganador oficial
    let winner = null;
    let winnerName = null;
    let winnerType = 'regular'; // 'regular' | 'penalties' | 'draw'

    const p = matchState.penalties;
    if (p && p.enabled && p.winner) {
      winner = p.winner;
      winnerName = p.winnerName || matchState[p.winner].name;
      winnerType = 'penalties';
    } else if (matchState.team1.score > matchState.team2.score) {
      winner = 'team1';
      winnerName = matchState.team1.name;
      winnerType = 'regular';
    } else if (matchState.team2.score > matchState.team1.score) {
      winner = 'team2';
      winnerName = matchState.team2.name;
      winnerType = 'regular';
    } else {
      winner = 'draw';
      winnerName = 'Empate';
      winnerType = 'draw';
    }

    const timestamp = Date.now();
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) + ' ' + now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

    const sanitize = (str) => (str || '').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 18);
    const filenameBase = `partido_${timestamp}_${sanitize(matchState.team1.name)}_vs_${sanitize(matchState.team2.name)}`;
    const xlsxFilename = `${filenameBase}.xlsx`;
    const pdfFilename = `${filenameBase}.pdf`;

    const xlsxPath = path.join(reportsDir, xlsxFilename);
    const pdfPath = path.join(reportsDir, pdfFilename);

    const matchRecord = {
      id: 'match-' + timestamp,
      timestamp: now.toISOString(),
      dateFormatted: dateFormatted,
      tournament: matchState.tournament,
      team1: { ...matchState.team1 },
      team2: { ...matchState.team2 },
      timer: { ...matchState.timer },
      penalties: JSON.parse(JSON.stringify(matchState.penalties)),
      winner,
      winnerName,
      winnerType,
      files: {
        xlsx: `/reports/${xlsxFilename}`,
        pdf: `/reports/${pdfFilename}`
      }
    };

    try {
      generateMatchExcel(matchRecord, xlsxPath);
      await generateMatchPdf(matchRecord, pdfPath);

      let history = [];
      if (fs.existsSync(historyFilePath)) {
        try {
          history = JSON.parse(fs.readFileSync(historyFilePath, 'utf8'));
        } catch (e) {
          history = [];
        }
      }
      history.unshift(matchRecord);
      if (history.length > 50) history = history.slice(0, 50);
      fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2), 'utf8');

      console.log(`[PARTIDO TERMINADO] ${matchState.team1.name} ${matchState.team1.score} - ${matchState.team2.score} ${matchState.team2.name}`);
      console.log(`✓ Reporte PDF: ${pdfFilename}`);
      console.log(`✓ Planilla Excel: ${xlsxFilename}`);
    } catch (err) {
      console.error('Error al generar actas del partido:', err);
    }

    io.emit('timer_state', {
      seconds: matchState.timer.seconds,
      isRunning: false
    });
    io.emit('period_updated', {
      period: 'Finalizado',
      seconds: matchState.timer.seconds,
      isRunning: false,
      penalties: matchState.penalties
    });
    io.emit('play_sound', { sound: 'whistle_long' });
    io.emit('match_finished', matchRecord);
  });

  socket.on('trigger_sound', (data) => {
    io.emit('play_sound', data);
  });
});

server.listen(PORT, '0.0.0.0', async () => {
  console.log('\n======================================================');
  console.log('       ⚽ MARCADOR DE FÚTBOL EN TIEMPO REAL ⚽        ');
  console.log('======================================================');
  console.log(`💻 PANTALLA DEL MARCADOR (PC/TV): http://localhost:${PORT}`);
  console.log(`📱 CONTROL REMOTO PRIVADO:        ${controlUrl}`);
  console.log(`🔑 PIN DE ACCESO CELULAR:         ${matchState.pin}`);
  console.log('======================================================\n');
});
