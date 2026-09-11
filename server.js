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
  { id: 'closs-cantalo', name: '¡Cántalo, Cántalo, Gol!', file: '/assets/sounds/closs-cantalo.mp3' },
  { id: 'mariano-closs-gol', name: '¡Benzemaaa Mariano Closs Gol!', file: '/assets/sounds/mariano-closs-gol.mp3' },
  { id: 'closs-gol-messi', name: '¡Messi lo Hizo, Gol!', file: '/assets/sounds/closs-gol-messi.mp3' },
  { id: 'closs-gol-enzo', name: '¡Golazo de Enzo Fernández!', file: '/assets/sounds/closs-gol-enzo.mp3' },
  { id: 'closs-lo-va-a-ganar', name: '¡Y lo va a ganar, Gol!', file: '/assets/sounds/closs-lo-va-a-ganar.mp3' },
  { id: 'closs-gol-quintero', name: '¡Golazo de Quintero!', file: '/assets/sounds/closs-gol-quintero.mp3' },
  { id: 'relato-vignolo-gol', name: '¡Gooool Pollo Vignolo!', file: '/assets/sounds/relato-vignolo-gol.mp3' },
  { id: 'relato-golazo-azo', name: '¡Golazo, azo, azo, azo!', file: '/assets/sounds/relato-golazo-azo.mp3' },
  { id: 'relato-maradona-golazo', name: '¡Golazo Histórico!', file: '/assets/sounds/relato-maradona-golazo.mp3' },
  { id: 'gol-caracol', name: '¡Gol, Gol, Gol Caracol!', file: '/assets/sounds/gol-caracol.mp3' }
];

function getRandomGoalClip() {
  const goalClips = [
    '/assets/sounds/closs-cantalo.mp3',
    '/assets/sounds/mariano-closs-gol.mp3',
    '/assets/sounds/closs-gol-messi.mp3',
    '/assets/sounds/closs-gol-enzo.mp3',
    '/assets/sounds/closs-lo-va-a-ganar.mp3',
    '/assets/sounds/closs-gol-quintero.mp3',
    '/assets/sounds/relato-vignolo-gol.mp3',
    '/assets/sounds/relato-golazo-azo.mp3',
    '/assets/sounds/relato-maradona-golazo.mp3',
    '/assets/sounds/gol-caracol.mp3'
  ];
  return goalClips[Math.floor(Math.random() * goalClips.length)];
}

// Función para instanciar el estado individual de una cancha
function createCourtState(courtName, t1Name, t1Color, t2Name, t2Color) {
  return {
    name: courtName,
    team1: {
      name: t1Name,
      shortName: t1Name.substring(0, 4).toUpperCase(),
      logo: '/assets/team-local.svg',
      color: t1Color,
      score: 0
    },
    team2: {
      name: t2Name,
      shortName: t2Name.substring(0, 4).toUpperCase(),
      logo: '/assets/team-visita.svg',
      color: t2Color,
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
}

// Estado global del torneo con soporte para 2 partidos en simultáneo
let matchState = {
  tournament: 'IES NUEVO HORIZONTE',
  tournamentLogo: '/assets/tournament-default.png',
  pin: '1234',
  halfDurationMinutes: 12,
  theme: 'night', // 'night' | 'sunny' | 'cloudy' | 'sunset' | 'grass' | 'high-contrast'
  viewMode: 'dual', // 'dual' (pantalla dividida 2 canchas) | 'cancha1' | 'cancha2'
  crowdAmbiance: {
    enabled: true,
    isPlaying: false,
    autoWithTimer: true,
    volume: 0.35,
    soundUrl: '/assets/sounds/ambiente-estadio-continuo.mp3'
  },
  goalAudio: {
    type: 'closs_random', // 'closs_random' | 'closs_fixed' | 'horn' | 'custom'
    customUrl: '/assets/sounds/closs-cantalo.mp3',
    selectedClip: '/assets/sounds/closs-cantalo.mp3',
    name: 'Mariano Closs (Aleatorio - Variar Frases)'
  },
  cancha1: createCourtState('Cancha 1', 'EQUIPO A (C1)', '#00d2ff', 'EQUIPO B (C1)', '#38bdf8'),
  cancha2: createCourtState('Cancha 2', 'EQUIPO C (C2)', '#f59e0b', 'EQUIPO D (C2)', '#ef4444')
};

// Delegados hacia cancha1 para compatibilidad retrospectiva con clientes o tests legados
Object.defineProperty(matchState, 'team1', {
  get() { return this.cancha1.team1; },
  set(v) { this.cancha1.team1 = v; },
  enumerable: true,
  configurable: true
});
Object.defineProperty(matchState, 'team2', {
  get() { return this.cancha1.team2; },
  set(v) { this.cancha1.team2 = v; },
  enumerable: true,
  configurable: true
});
Object.defineProperty(matchState, 'timer', {
  get() { return this.cancha1.timer; },
  set(v) { this.cancha1.timer = v; },
  enumerable: true,
  configurable: true
});
Object.defineProperty(matchState, 'penalties', {
  get() { return this.cancha1.penalties; },
  set(v) { this.cancha1.penalties = v; },
  enumerable: true,
  configurable: true
});

// Selector de cancha según datos recibidos
function resolveCourt(data) {
  const cKey = (data && (data.cancha === 'cancha2' || data.cancha === '2' || data.court === 'cancha2' || data.court === '2')) ? 'cancha2' : 'cancha1';
  return { key: cKey, court: matchState[cKey] };
}

// =========================================================================
// LÓGICA REGLAMENTARIA DE PENALES (REGLAS OFICIALES FIFA CON TURNOS ALTERNOS)
// =========================================================================
function evaluatePenalties(target) {
  const court = (target && target.penalties) ? target : (matchState[target] || matchState.cancha1);
  const p = court.penalties;
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

    // Condición de imposibilidad matemática
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
        // Empate a 5 goles -> Muerte Súbita
        t1.push('pending');
        t2.push('pending');
        isFinished = false;
        winner = null;
      }
    }
  } else {
    // 2. Muerte Súbita (Tiros 6 en adelante)
    if (taken1 === taken2 && taken1 >= 5) {
      if (score1 > score2) {
        winner = 'team1';
        isFinished = true;
      } else if (score2 > score1) {
        winner = 'team2';
        isFinished = true;
      } else if (taken1 === t1.length) {
        t1.push('pending');
        t2.push('pending');
        isFinished = false;
        winner = null;
      }
    }
  }

  p.winner = winner;
  p.isFinished = isFinished;
  p.winnerName = winner === 'team1' ? court.team1.name : (winner === 'team2' ? court.team2.name : null);

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
    let tickNeeded = false;
    if (matchState.cancha1 && matchState.cancha1.timer && matchState.cancha1.timer.isRunning) {
      matchState.cancha1.timer.seconds++;
      tickNeeded = true;
    }
    if (matchState.cancha2 && matchState.cancha2.timer && matchState.cancha2.timer.isRunning) {
      matchState.cancha2.timer.seconds++;
      tickNeeded = true;
    }
    if (tickNeeded) {
      io.emit('timer_tick', {
        cancha: 'both',
        cancha1: {
          seconds: matchState.cancha1.timer.seconds,
          isRunning: matchState.cancha1.timer.isRunning
        },
        cancha2: {
          seconds: matchState.cancha2.timer.seconds,
          isRunning: matchState.cancha2.timer.isRunning
        },
        // Compatibilidad retrospectiva con oyentes legados
        seconds: matchState.cancha1.timer.seconds,
        isRunning: matchState.cancha1.timer.isRunning
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

// Función auxiliar para construir el registro oficial del partido actual (admite cancha1 o cancha2)
function buildCurrentMatchRecord(courtKey = 'cancha1') {
  const cKey = (courtKey === 'cancha2' || courtKey === '2') ? 'cancha2' : 'cancha1';
  const court = matchState[cKey] || matchState.cancha1;
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) + ' ' + now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  let winner = null;
  let winnerName = null;
  let winnerType = 'regular';

  const p = court.penalties;
  if (p && p.enabled && p.winner) {
    winner = p.winner;
    winnerName = p.winnerName || court[p.winner].name;
    winnerType = 'penalties';
  } else if (court.team1.score > court.team2.score) {
    winner = 'team1';
    winnerName = court.team1.name;
    winnerType = 'regular';
  } else if (court.team2.score > court.team1.score) {
    winner = 'team2';
    winnerName = court.team2.name;
    winnerType = 'regular';
  } else {
    winner = 'draw';
    winnerName = 'Empate';
    winnerType = 'draw';
  }

  return {
    id: 'match-' + cKey + '-' + Date.now(),
    courtKey: cKey,
    courtName: court.name,
    timestamp: now.toISOString(),
    dateFormatted,
    tournament: matchState.tournament || 'IES NUEVO HORIZONTE',
    tournamentLogo: matchState.tournamentLogo,
    team1: { ...court.team1 },
    team2: { ...court.team2 },
    timer: { ...court.timer },
    penalties: JSON.parse(JSON.stringify(court.penalties)),
    winner,
    winnerName,
    winnerType
  };
}

// Descarga directa de Acta en PDF (en cualquier momento)
app.get('/api/report/pdf', async (req, res) => {
  try {
    const courtKey = (req.query.cancha === 'cancha2' || req.query.cancha === '2') ? 'cancha2' : 'cancha1';
    const record = buildCurrentMatchRecord(courtKey);
    const sanitize = (str) => (str || '').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 18);
    const filename = `Acta_${courtKey.toUpperCase()}_${sanitize(record.team1.name)}_vs_${sanitize(record.team2.name)}.pdf`;
    const tempPath = path.join(reportsDir, `temp_${Date.now()}_${filename}`);
    await generateMatchPdf(record, tempPath);
    res.download(tempPath, filename, (err) => {
      if (fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath); } catch (e) {}
      }
    });
  } catch (err) {
    console.error('Error generando PDF:', err);
    res.status(500).json({ error: 'Error al generar el acta en PDF' });
  }
});

// Descarga directa de Planilla en Excel (en cualquier momento)
app.get('/api/report/excel', (req, res) => {
  try {
    const courtKey = (req.query.cancha === 'cancha2' || req.query.cancha === '2') ? 'cancha2' : 'cancha1';
    const record = buildCurrentMatchRecord(courtKey);
    const sanitize = (str) => (str || '').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 18);
    const filename = `Planilla_${courtKey.toUpperCase()}_${sanitize(record.team1.name)}_vs_${sanitize(record.team2.name)}.xlsx`;
    const tempPath = path.join(reportsDir, `temp_${Date.now()}_${filename}`);
    generateMatchExcel(record, tempPath);
    res.download(tempPath, filename, (err) => {
      if (fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath); } catch (e) {}
      }
    });
  } catch (err) {
    console.error('Error generando Excel:', err);
    res.status(500).json({ error: 'Error al generar la planilla en Excel' });
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

  // Modo de visualización de pantalla TV ('dual' | 'cancha1' | 'cancha2')
  socket.on('set_view_mode', (data) => {
    if (data && ['dual', 'cancha1', 'cancha2'].includes(data.mode)) {
      matchState.viewMode = data.mode;
      io.emit('view_mode_updated', { viewMode: matchState.viewMode });
    }
  });

  // Actualizar goles (admite data.cancha)
  socket.on('update_score', (data) => {
    const { key: cKey, court } = resolveCourt(data);
    if (data.team === 'team1' || data.team === 'team2') {
      const team = court[data.team];
      const previousScore = team.score;
      if (typeof data.score === 'number') {
        team.score = Math.max(0, data.score);
      } else if (typeof data.delta === 'number') {
        team.score = Math.max(0, team.score + data.delta);
      }

      io.emit('score_updated', {
        cancha: cKey,
        team: data.team,
        score: team.score,
        courtScore1: court.team1.score,
        courtScore2: court.team2.score,
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
          cancha: cKey,
          courtName: court.name,
          teamKey: data.team,
          teamName: team.name,
          teamColor: team.color,
          teamLogo: team.logo,
          score1: court.team1.score,
          score2: court.team2.score,
          goalAudio: {
            ...matchState.goalAudio,
            customUrl: clipToPlay
          }
        });
      }
    }
  });

  // Cronómetro (iniciar/pausar por cancha)
  socket.on('timer_toggle', (data) => {
    const { key: cKey, court } = resolveCourt(data);
    court.timer.isRunning = !court.timer.isRunning;
    io.emit('timer_state', {
      cancha: cKey,
      seconds: court.timer.seconds,
      isRunning: court.timer.isRunning,
      cancha1: { seconds: matchState.cancha1.timer.seconds, isRunning: matchState.cancha1.timer.isRunning },
      cancha2: { seconds: matchState.cancha2.timer.seconds, isRunning: matchState.cancha2.timer.isRunning }
    });
    if (matchState.crowdAmbiance.enabled && matchState.crowdAmbiance.autoWithTimer) {
      const anyRunning = matchState.cancha1.timer.isRunning || matchState.cancha2.timer.isRunning;
      matchState.crowdAmbiance.isPlaying = anyRunning;
      io.emit('crowd_ambiance_updated', matchState.crowdAmbiance);
    }
  });

  socket.on('timer_set', (data) => {
    const { key: cKey, court } = resolveCourt(data);
    if (typeof data.seconds === 'number') {
      court.timer.seconds = Math.max(0, data.seconds);
      if (typeof data.isRunning === 'boolean') {
        court.timer.isRunning = data.isRunning;
      }
      io.emit('timer_state', {
        cancha: cKey,
        seconds: court.timer.seconds,
        isRunning: court.timer.isRunning,
        cancha1: { seconds: matchState.cancha1.timer.seconds, isRunning: matchState.cancha1.timer.isRunning },
        cancha2: { seconds: matchState.cancha2.timer.seconds, isRunning: matchState.cancha2.timer.isRunning }
      });
    }
  });

  socket.on('timer_reset', (data) => {
    const { key: cKey, court } = resolveCourt(data);
    court.timer.seconds = 0;
    court.timer.isRunning = false;
    io.emit('timer_state', {
      cancha: cKey,
      seconds: 0,
      isRunning: false,
      cancha1: { seconds: matchState.cancha1.timer.seconds, isRunning: matchState.cancha1.timer.isRunning },
      cancha2: { seconds: matchState.cancha2.timer.seconds, isRunning: matchState.cancha2.timer.isRunning }
    });
    if (matchState.crowdAmbiance.autoWithTimer) {
      const anyRunning = matchState.cancha1.timer.isRunning || matchState.cancha2.timer.isRunning;
      matchState.crowdAmbiance.isPlaying = anyRunning;
      io.emit('crowd_ambiance_updated', matchState.crowdAmbiance);
    }
  });

  // Periodos (por cancha)
  socket.on('set_period', (data) => {
    if (data && data.period) {
      const { key: cKey, court } = resolveCourt(data);
      court.timer.period = data.period;

      if (data.period === 'Penales') {
        court.penalties.enabled = true;
      } else {
        court.penalties.enabled = false;
      }

      if (data.autoSetTime) {
        const halfSeconds = (matchState.halfDurationMinutes || 12) * 60;
        if (data.period === '2T' && court.timer.seconds < halfSeconds) {
          court.timer.seconds = halfSeconds;
        } else if (data.period === '1T' && court.timer.seconds === 0) {
          court.timer.seconds = 0;
        }
      }

      io.emit('period_updated', {
        cancha: cKey,
        period: court.timer.period,
        seconds: court.timer.seconds,
        isRunning: court.timer.isRunning,
        penalties: court.penalties
      });
      io.emit('penalties_updated', {
        cancha: cKey,
        penalties: court.penalties
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

  // Tiempo extra (personalizado para demoras / pelota perdida)
  socket.on('set_extra_time', (data) => {
    const { key: cKey, court } = resolveCourt(data);
    if (typeof data.minutes === 'number') {
      court.timer.extraTime = Math.max(0, Math.min(60, Math.round(data.minutes)));
      io.emit('extra_time_updated', {
        cancha: cKey,
        extraTime: court.timer.extraTime
      });
    }
  });

  // CONTROL DE PENALES CON LÓGICA FIFA Y TURNOS ALTERNADOS (POR CANCHA)
  socket.on('set_penalty_shot', (data) => {
    const { key: cKey, court } = resolveCourt(data);
    if (data.team === 'team1' || data.team === 'team2') {
      const p = court.penalties;

      if (p.isFinished && data.state !== 'pending') {
        socket.emit('penalty_turn_error', {
          cancha: cKey,
          message: `La serie de penales ya finalizó. ¡${p.winnerName} es el ganador!`,
          currentTurn: null
        });
        return;
      }

      if (data.state !== 'pending' && p.currentTurn && data.team !== p.currentTurn) {
        const turnTeamName = court[p.currentTurn].name;
        socket.emit('penalty_turn_error', {
          cancha: cKey,
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

      const isWon = evaluatePenalties(court);
      io.emit('penalties_updated', {
        cancha: cKey,
        penalties: court.penalties
      });

      if (isWon) {
        io.emit('play_sound', { sound: 'whistle_long' });
      }
    }
  });

  // Acción rápida de penal (+Gol, +Fallo, Deshacer) con estricto turno alterno
  socket.on('quick_penalty_action', (data) => {
    const { key: cKey, court } = resolveCourt(data);
    if (data.team === 'team1' || data.team === 'team2') {
      const p = court.penalties;

      if (data.action === 'undo') {
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

        evaluatePenalties(court);
        io.emit('penalties_updated', {
          cancha: cKey,
          penalties: court.penalties
        });
        return;
      }

      if (p.isFinished) {
        socket.emit('penalty_turn_error', {
          cancha: cKey,
          message: `La serie de penales ya finalizó. ¡${p.winnerName} es el ganador!`,
          currentTurn: null
        });
        return;
      }

      if (p.currentTurn && data.team !== p.currentTurn) {
        const turnTeamName = court[p.currentTurn].name;
        socket.emit('penalty_turn_error', {
          cancha: cKey,
          message: `No se puede hacer el gol, falta que el otro equipo ejecute el tiro penal (Turno de ${turnTeamName})`,
          currentTurn: p.currentTurn,
          teamName: turnTeamName
        });
        return;
      }

      const arr = p[data.team];
      let found = false;
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] === 'pending') {
          arr[i] = data.action;
          found = true;
          break;
        }
      }

      if (!found && !p.isFinished) {
        p.team1.push('pending');
        p.team2.push('pending');
        p[data.team][arr.length - 1] = data.action;
      }

      const isWon = evaluatePenalties(court);
      io.emit('penalties_updated', {
        cancha: cKey,
        penalties: court.penalties
      });

      if (isWon) {
        io.emit('play_sound', { sound: 'whistle_long' });
      } else if (data.action === 'scored') {
        const clip = getRandomGoalClip();
        io.emit('play_sound_clip', { url: clip });
      } else if (data.action === 'missed') {
        io.emit('play_sound', { sound: 'whistle_short' });
      }
    }
  });

  socket.on('set_first_kicker', (data) => {
    const { key: cKey, court } = resolveCourt(data);
    if (data && (data.team === 'team1' || data.team === 'team2')) {
      const taken1 = court.penalties.team1.filter(s => s !== 'pending').length;
      const taken2 = court.penalties.team2.filter(s => s !== 'pending').length;
      if (taken1 === 0 && taken2 === 0) {
        court.penalties.firstKicker = data.team;
        court.penalties.currentTurn = data.team;
        io.emit('penalties_updated', {
          cancha: cKey,
          penalties: court.penalties
        });
      }
    }
  });

  socket.on('toggle_penalties_visibility', (data) => {
    const { key: cKey, court } = resolveCourt(data);
    court.penalties.enabled = typeof data.enabled === 'boolean' ? data.enabled : !court.penalties.enabled;
    io.emit('penalties_updated', {
      cancha: cKey,
      penalties: court.penalties
    });
  });

  socket.on('reset_penalties', (data) => {
    const { key: cKey, court } = resolveCourt(data);
    court.penalties.team1 = ['pending', 'pending', 'pending', 'pending', 'pending'];
    court.penalties.team2 = ['pending', 'pending', 'pending', 'pending', 'pending'];
    court.penalties.score1 = 0;
    court.penalties.score2 = 0;
    court.penalties.winner = null;
    court.penalties.winnerName = null;
    court.penalties.isFinished = false;
    court.penalties.firstKicker = 'team1';
    court.penalties.currentTurn = 'team1';
    court.penalties.currentRound = 1;
    io.emit('penalties_updated', {
      cancha: cKey,
      penalties: court.penalties
    });
  });

  // Cambio de Tema / Clima de Cancha (Soleado, Nublado, Atardecer, Noche, Césped, Alto Contraste)
  socket.on('set_theme', (data) => {
    if (data && data.theme) {
      matchState.theme = data.theme;
      io.emit('theme_updated', { theme: matchState.theme });
    }
  });

  // Reproducir clip de Mariano Closs o Cánticos desde el Soundboard
  socket.on('play_sound_clip', (data) => {
    if (data && data.url) {
      io.emit('play_sound_clip', { url: data.url });
    }
  });

  // Detener clip de audio en curso
  socket.on('stop_sound_clip', () => {
    io.emit('stop_sound_clip');
  });

  // Reproducir efectos (silbato, bocina)
  socket.on('play_sound', (data) => {
    if (data && data.sound) {
      io.emit('play_sound', data);
    }
  });

  socket.on('trigger_sound', (data) => {
    if (data && data.sound) {
      io.emit('play_sound', data);
    }
  });

  // Ambiente Continuo de Hinchada mientras se juega el partido
  socket.on('set_crowd_ambiance', (data) => {
    if (data) {
      if (typeof data.enabled === 'boolean') matchState.crowdAmbiance.enabled = data.enabled;
      if (typeof data.isPlaying === 'boolean') matchState.crowdAmbiance.isPlaying = data.isPlaying;
      if (typeof data.autoWithTimer === 'boolean') matchState.crowdAmbiance.autoWithTimer = data.autoWithTimer;
      if (typeof data.volume === 'number') matchState.crowdAmbiance.volume = Math.max(0, Math.min(1, data.volume));
      if (data.soundUrl) matchState.crowdAmbiance.soundUrl = data.soundUrl;
      io.emit('crowd_ambiance_updated', matchState.crowdAmbiance);
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

  // Actualizar nombres, colores y logo del torneo (admite cancha1 y cancha2)
  socket.on('update_teams', (data) => {
    if (data.tournament !== undefined) matchState.tournament = data.tournament;
    if (data.tournamentLogo !== undefined) matchState.tournamentLogo = data.tournamentLogo;

    if (data.cancha1) {
      if (data.cancha1.team1) matchState.cancha1.team1 = { ...matchState.cancha1.team1, ...data.cancha1.team1 };
      if (data.cancha1.team2) matchState.cancha1.team2 = { ...matchState.cancha1.team2, ...data.cancha1.team2 };
    }
    if (data.cancha2) {
      if (data.cancha2.team1) matchState.cancha2.team1 = { ...matchState.cancha2.team1, ...data.cancha2.team1 };
      if (data.cancha2.team2) matchState.cancha2.team2 = { ...matchState.cancha2.team2, ...data.cancha2.team2 };
    }

    if (data.cancha && matchState[data.cancha]) {
      const court = matchState[data.cancha];
      if (data.team1) court.team1 = { ...court.team1, ...data.team1 };
      if (data.team2) court.team2 = { ...court.team2, ...data.team2 };
    } else if (!data.cancha1 && !data.cancha2) {
      if (data.team1) matchState.cancha1.team1 = { ...matchState.cancha1.team1, ...data.team1 };
      if (data.team2) matchState.cancha1.team2 = { ...matchState.cancha1.team2, ...data.team2 };
    }

    evaluatePenalties(matchState.cancha1);
    evaluatePenalties(matchState.cancha2);
    io.emit('teams_updated', matchState);
  });

  // Reiniciar partido (por cancha o todo)
  socket.on('reset_match', (data) => {
    const resetCourt = (court) => {
      court.team1.score = 0;
      court.team2.score = 0;
      court.timer.seconds = 0;
      court.timer.isRunning = false;
      court.timer.period = '1T';
      court.timer.extraTime = 0;
      court.penalties.enabled = false;
      court.penalties.team1 = ['pending', 'pending', 'pending', 'pending', 'pending'];
      court.penalties.team2 = ['pending', 'pending', 'pending', 'pending', 'pending'];
      court.penalties.score1 = 0;
      court.penalties.score2 = 0;
      court.penalties.winner = null;
      court.penalties.winnerName = null;
      court.penalties.isFinished = false;
      court.penalties.firstKicker = 'team1';
      court.penalties.currentTurn = 'team1';
      court.penalties.currentRound = 1;
    };

    if (data && (data.cancha === 'cancha1' || data.cancha === 'cancha2')) {
      resetCourt(matchState[data.cancha]);
    } else {
      resetCourt(matchState.cancha1);
      resetCourt(matchState.cancha2);
      matchState.crowdAmbiance.isPlaying = false;
    }

    io.emit('sync_state', matchState);
    io.emit('match_reset', { cancha: data && data.cancha ? data.cancha : 'both' });
    io.emit('crowd_ambiance_updated', matchState.crowdAmbiance);
  });

  // FINALIZAR PARTIDO OFICIALMENTE Y GENERAR REPORTES (EXCEL Y PDF POR CANCHA)
  socket.on('finish_match', async (data) => {
    const { key: cKey, court } = resolveCourt(data);

    court.timer.isRunning = false;
    court.timer.period = 'Finalizado';

    const anyRunning = matchState.cancha1.timer.isRunning || matchState.cancha2.timer.isRunning;
    if (!anyRunning && matchState.crowdAmbiance.isPlaying) {
      matchState.crowdAmbiance.isPlaying = false;
      io.emit('crowd_ambiance_updated', matchState.crowdAmbiance);
    }

    const timestamp = Date.now();
    const matchRecord = buildCurrentMatchRecord(cKey);
    const sanitize = (str) => (str || '').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 18);
    const filenameBase = `partido_${cKey}_${timestamp}_${sanitize(court.team1.name)}_vs_${sanitize(court.team2.name)}`;
    const xlsxFilename = `${filenameBase}.xlsx`;
    const pdfFilename = `${filenameBase}.pdf`;

    const xlsxPath = path.join(reportsDir, xlsxFilename);
    const pdfPath = path.join(reportsDir, pdfFilename);

    matchRecord.files = {
      xlsx: `/reports/${xlsxFilename}`,
      pdf: `/reports/${pdfFilename}`
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

      console.log(`[PARTIDO TERMINADO - ${court.name.toUpperCase()}] ${court.team1.name} ${court.team1.score} - ${court.team2.score} ${court.team2.name}`);
      console.log(`✓ Reporte PDF: ${pdfFilename}`);
      console.log(`✓ Planilla Excel: ${xlsxFilename}`);
    } catch (err) {
      console.error('Error al generar actas del partido:', err);
    }

    io.emit('timer_state', {
      cancha: cKey,
      seconds: court.timer.seconds,
      isRunning: false,
      cancha1: { seconds: matchState.cancha1.timer.seconds, isRunning: matchState.cancha1.timer.isRunning },
      cancha2: { seconds: matchState.cancha2.timer.seconds, isRunning: matchState.cancha2.timer.isRunning }
    });
    io.emit('period_updated', {
      cancha: cKey,
      period: 'Finalizado',
      seconds: court.timer.seconds,
      isRunning: false,
      penalties: court.penalties
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
