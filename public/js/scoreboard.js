// Lógica de Pantalla del Marcador (TV / PC / Transmisión)
document.addEventListener('DOMContentLoaded', () => {
  const socket = io();

  // Elementos del DOM
  const tournamentName = document.getElementById('tournamentName');
  const tournamentLogo = document.getElementById('tournamentLogo');
  
  // Equipos
  const cardTeam1 = document.getElementById('cardTeam1');
  const nameTeam1 = document.getElementById('nameTeam1');
  const logoTeam1 = document.getElementById('logoTeam1');
  const scoreTeam1 = document.getElementById('scoreTeam1');
  const accentTeam1 = document.getElementById('accentTeam1');

  const cardTeam2 = document.getElementById('cardTeam2');
  const nameTeam2 = document.getElementById('nameTeam2');
  const logoTeam2 = document.getElementById('logoTeam2');
  const scoreTeam2 = document.getElementById('scoreTeam2');
  const accentTeam2 = document.getElementById('accentTeam2');

  // Tablero Principal de Penales (Transmisión de TV)
  const penaltyMainBoard = document.getElementById('penaltyMainBoard');
  const penaltyStatusLine = document.getElementById('penaltyStatusLine');
  const penaltyAggregateScore = document.getElementById('penaltyAggregateScore');
  const penaltyWinnerBanner = document.getElementById('penaltyWinnerBanner');
  const penaltyWinnerMessage = document.getElementById('penaltyWinnerMessage');
  const penaltyWinnerSub = document.getElementById('penaltyWinnerSub');

  const penRowTeam1 = document.getElementById('penRowTeam1');
  const penAccent1 = document.getElementById('penAccent1');
  const penBoardLogo1 = document.getElementById('penBoardLogo1');
  const penBoardName1 = document.getElementById('penBoardName1');
  const penKickerTag1 = document.getElementById('penKickerTag1');
  const penShotsStrip1 = document.getElementById('penShotsStrip1');
  const penBoardScore1 = document.getElementById('penBoardScore1');

  const penRowTeam2 = document.getElementById('penRowTeam2');
  const penAccent2 = document.getElementById('penAccent2');
  const penBoardLogo2 = document.getElementById('penBoardLogo2');
  const penBoardName2 = document.getElementById('penBoardName2');
  const penKickerTag2 = document.getElementById('penKickerTag2');
  const penShotsStrip2 = document.getElementById('penShotsStrip2');
  const penBoardScore2 = document.getElementById('penBoardScore2');

  const turnTagTeam1 = document.getElementById('turnTagTeam1');
  const turnTagTeam2 = document.getElementById('turnTagTeam2');

  // Selector de Tema / Clima
  const btnCycleTheme = document.getElementById('btnCycleTheme');
  const themeBtnIcon = document.getElementById('themeBtnIcon');
  const THEMES = ['night', 'sunny', 'cloudy', 'sunset', 'grass', 'high-contrast'];
  const THEME_ICONS = {
    'night': '🌙',
    'sunny': '☀️',
    'cloudy': '⛅',
    'sunset': '🌅',
    'grass': '🌱',
    'high-contrast': '⚡'
  };
  let currentTheme = 'night';

  function applyTheme(theme) {
    if (!theme) return;
    currentTheme = theme;
    document.body.dataset.theme = theme;
    if (themeBtnIcon) {
      themeBtnIcon.textContent = THEME_ICONS[theme] || '🌙';
    }
  }

  if (btnCycleTheme) {
    btnCycleTheme.addEventListener('click', () => {
      const curIdx = THEMES.indexOf(currentTheme);
      const nextTheme = THEMES[(curIdx + 1) % THEMES.length];
      applyTheme(nextTheme);
      socket.emit('set_theme', { theme: nextTheme });
    });
  }

  // Cronómetro y Periodo
  const timerDisplay = document.getElementById('timerDisplay');
  const timerMinutes = document.getElementById('timerMinutes');
  const timerSeconds = document.getElementById('timerSeconds');
  const periodBadge = document.getElementById('periodBadge');
  const timerStatusText = document.getElementById('timerStatusText');
  const extraTimeBadge = document.getElementById('extraTimeBadge');
  const extraMinutes = document.getElementById('extraMinutes');

  // Modal QR Privado
  const qrModal = document.getElementById('qrModal');
  const btnCloseQrModal = document.getElementById('btnCloseQrModal');
  const qrImage = document.getElementById('qrImage');
  const qrDirectUrl = document.getElementById('qrDirectUrl');
  const btnFullscreen = document.getElementById('btnFullscreen');
  const btnToggleSound = document.getElementById('btnToggleSound');
  const soundIcon = document.getElementById('soundIcon');

  // Celebración de Gol
  const goalOverlay = document.getElementById('goalOverlay');
  const goalTeamLogo = document.getElementById('goalTeamLogo');
  const goalTeamName = document.getElementById('goalTeamName');
  const goalScorePill = document.getElementById('goalScorePill');

  // Overlay de Partido Concluido (TV)
  const matchFinishedOverlay = document.getElementById('matchFinishedOverlay');
  const concludedTournament = document.getElementById('concludedTournament');
  const concludedLogo1 = document.getElementById('concludedLogo1');
  const concludedName1 = document.getElementById('concludedName1');
  const concludedScore1 = document.getElementById('concludedScore1');
  const concludedLogo2 = document.getElementById('concludedLogo2');
  const concludedName2 = document.getElementById('concludedName2');
  const concludedScore2 = document.getElementById('concludedScore2');
  const concludedPenaltiesPill = document.getElementById('concludedPenaltiesPill');
  const concludedPenaltiesScore = document.getElementById('concludedPenaltiesScore');
  const concludedWinnerTitle = document.getElementById('concludedWinnerTitle');
  const btnCloseConcluded = document.getElementById('btnCloseConcluded');

  let currentSeconds = 0;
  let isTimerRunning = false;
  let goalTimeout = null;
  let currentGoalAudio = { type: 'closs_random', customUrl: '/assets/sounds/closs-cantalo.mp3' };

  // Audio continuo de Hinchada
  const stadiumAmbianceAudio = document.getElementById('stadiumAmbianceAudio');
  let crowdAmbianceConfig = { enabled: true, isPlaying: false, autoWithTimer: true, volume: 0.35 };

  // Audio dedicado para celebración de gol
  const goalCelebrationAudio = document.getElementById('goalCelebrationAudio');

  // Banner flotante de activación de audio (para políticas de autoplay de navegadores)
  const audioUnlockBanner = document.getElementById('audioUnlockBanner');
  const btnUnlockAudio = document.getElementById('btnUnlockAudio');

  // Cargar info de red para el QR privado
  async function loadNetworkInfo() {
    try {
      const res = await fetch('/api/network-info');
      const data = await res.json();
      if (data.controlUrl) {
        qrDirectUrl.textContent = data.controlUrl;
        qrDirectUrl.href = data.controlUrl;
      }
      if (data.qrDataUrl) {
        qrImage.src = data.qrDataUrl;
      }
    } catch (err) {
      console.error('Error obteniendo info de red:', err);
    }
  }
  loadNetworkInfo();

  // Formatear segundos a MM:SS
  function updateTimerText(totalSecs) {
    currentSeconds = totalSecs;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    timerMinutes.textContent = String(mins).padStart(2, '0');
    timerSeconds.textContent = String(secs).padStart(2, '0');
  }

  // Renderizar la tira principal numerada (1 a 5+) en el panel de transmisión
  function renderNumberedShotsStrip(stripEl, shotsArray, isKickingTurn) {
    if (!stripEl) return;
    stripEl.innerHTML = '';
    
    // Primer índice pendiente de este equipo
    const firstPendingIdx = shotsArray.findIndex(s => s === 'pending');

    shotsArray.forEach((state, idx) => {
      const card = document.createElement('div');
      card.className = `pen-shot-card ${state}`;
      
      if (isKickingTurn && idx === firstPendingIdx) {
        card.classList.add('current-kick');
      }

      if (state === 'scored') {
        card.textContent = '⚽';
      } else if (state === 'missed') {
        card.textContent = '✗';
      } else {
        card.textContent = String(idx + 1);
      }

      stripEl.appendChild(card);
    });
  }

  function updatePenaltiesUI(penalties) {
    if (!penalties) return;
    const show = penalties.enabled;

    // Solo un tablero de penales: el panel broadcast oficial abajo del marcador
    if (penaltyMainBoard) penaltyMainBoard.style.display = show ? 'flex' : 'none';

    if (show) {
      // Sincronizar datos de equipos con el tablero central de penales
      if (penBoardName1) penBoardName1.textContent = nameTeam1.textContent.trim();
      if (penBoardLogo1) penBoardLogo1.src = logoTeam1.src;
      if (penBoardScore1) penBoardScore1.textContent = penalties.score1 || 0;
      if (penAccent1 && accentTeam1) penAccent1.style.background = accentTeam1.style.background;

      if (penBoardName2) penBoardName2.textContent = nameTeam2.textContent.trim();
      if (penBoardLogo2) penBoardLogo2.src = logoTeam2.src;
      if (penBoardScore2) penBoardScore2.textContent = penalties.score2 || 0;
      if (penAccent2 && accentTeam2) penAccent2.style.background = accentTeam2.style.background;

      if (penaltyAggregateScore) {
        penaltyAggregateScore.textContent = `${penalties.score1 || 0} - ${penalties.score2 || 0}`;
      }

      const roundNum = penalties.currentRound || 1;
      const isTeam1Turn = penalties.currentTurn === 'team1';
      const isTeam2Turn = penalties.currentTurn === 'team2';

      if (penaltyStatusLine) {
        if (penalties.isFinished) {
          penaltyStatusLine.textContent = 'SERIE FINALIZADA • ¡HAY GANADOR!';
        } else {
          const roundText = roundNum <= 5 ? `RONDA ${roundNum} DE 5` : `MUERTE SÚBITA (TIRO ${roundNum})`;
          const kickerName = isTeam1Turn ? nameTeam1.textContent.trim().toUpperCase() : (isTeam2Turn ? nameTeam2.textContent.trim().toUpperCase() : 'FINALIZADO');
          penaltyStatusLine.textContent = `${roundText} • TURNO DE: ${kickerName} ⚡`;
        }
      }

      // Resaltado de turno en filas de penales
      if (penRowTeam1) {
        penRowTeam1.classList.toggle('kicking-turn', isTeam1Turn);
        penRowTeam1.classList.toggle('team-winner', penalties.isFinished && penalties.winner === 'team1');
      }
      if (penRowTeam2) {
        penRowTeam2.classList.toggle('kicking-turn', isTeam2Turn);
        penRowTeam2.classList.toggle('team-winner', penalties.isFinished && penalties.winner === 'team2');
      }
      if (penKickerTag1) penKickerTag1.style.display = isTeam1Turn ? 'inline-block' : 'none';
      if (penKickerTag2) penKickerTag2.style.display = isTeam2Turn ? 'inline-block' : 'none';

      // Renderizar tiros numerados 1..5 en el tablero principal
      renderNumberedShotsStrip(penShotsStrip1, penalties.team1, isTeam1Turn);
      renderNumberedShotsStrip(penShotsStrip2, penalties.team2, isTeam2Turn);

      // Indicadores de turno en las tarjetas de equipos
      cardTeam1.classList.toggle('kicking-turn', isTeam1Turn);
      cardTeam2.classList.toggle('kicking-turn', isTeam2Turn);
      if (turnTagTeam1) turnTagTeam1.style.display = isTeam1Turn ? 'inline-flex' : 'none';
      if (turnTagTeam2) turnTagTeam2.style.display = isTeam2Turn ? 'inline-flex' : 'none';

      // LÓGICA DE GANADOR DE PENALES
      if (penalties.isFinished && penalties.winner) {
        const winnerName = penalties.winnerName || (penalties.winner === 'team1' ? nameTeam1.textContent : nameTeam2.textContent);
        if (penaltyWinnerMessage) penaltyWinnerMessage.textContent = `¡GANADOR POR PENALES: ${winnerName}!`;
        if (penaltyWinnerSub) penaltyWinnerSub.textContent = `Serie finalizada matemáticamente (${penalties.score1} a ${penalties.score2}) • ¡Campeón / Clasificado!`;
        if (penaltyWinnerBanner) penaltyWinnerBanner.style.display = 'flex';

        cardTeam1.classList.toggle('team-winner', penalties.winner === 'team1');
        cardTeam2.classList.toggle('team-winner', penalties.winner === 'team2');
      } else {
        if (penaltyWinnerBanner) penaltyWinnerBanner.style.display = 'none';
        cardTeam1.classList.remove('team-winner');
        cardTeam2.classList.remove('team-winner');
      }
    } else {
      if (penaltyWinnerBanner) penaltyWinnerBanner.style.display = 'none';
      if (turnTagTeam1) turnTagTeam1.style.display = 'none';
      if (turnTagTeam2) turnTagTeam2.style.display = 'none';
      cardTeam1.classList.remove('kicking-turn', 'team-winner');
      cardTeam2.classList.remove('kicking-turn', 'team-winner');
    }
  }

  // Sincronizar estado completo
  function renderState(state) {
    if (!state) return;

    tournamentName.textContent = state.tournament || 'TORNEO DE FÚTBOL';
    if (tournamentLogo) {
      tournamentLogo.src = state.tournamentLogo || '/assets/tournament-default.png';
    }
    if (state.goalAudio) currentGoalAudio = state.goalAudio;

    // Equipo 1 - Nombre completo
    nameTeam1.textContent = state.team1.name || 'EQUIPO LOCAL';
    logoTeam1.src = state.team1.logo || '/assets/team-local.svg';
    scoreTeam1.textContent = state.team1.score;
    if (state.team1.color) {
      accentTeam1.style.background = state.team1.color;
      accentTeam1.style.boxShadow = `0 0 16px ${state.team1.color}`;
    }

    // Equipo 2 - Nombre completo
    nameTeam2.textContent = state.team2.name || 'EQUIPO VISITA';
    logoTeam2.src = state.team2.logo || '/assets/team-visita.svg';
    scoreTeam2.textContent = state.team2.score;
    if (state.team2.color) {
      accentTeam2.style.background = state.team2.color;
      accentTeam2.style.boxShadow = `0 0 16px ${state.team2.color}`;
    }

    // Cronómetro
    if (state.timer) {
      updateTimerText(state.timer.seconds);
      setTimerRunningState(state.timer.isRunning);
      updatePeriod(state.timer.period);
      updateExtraTime(state.timer.extraTime);
    }

    // Tema / Clima de Cancha
    if (state.theme) {
      applyTheme(state.theme);
    }

    // Ambiente de Hinchada
    if (state.crowdAmbiance) {
      crowdAmbianceConfig = state.crowdAmbiance;
      updateCrowdAmbiance();
    }

    // Penales
    if (state.penalties) {
      updatePenaltiesUI(state.penalties);
    }
  }

  function setTimerRunningState(running) {
    isTimerRunning = !!running;
    if (timerDisplay) {
      timerDisplay.classList.toggle('timer-paused', !isTimerRunning);
      timerDisplay.classList.toggle('running', isTimerRunning);
    }
    if (timerStatusText) {
      timerStatusText.textContent = isTimerRunning ? 'EN JUEGO' : 'PAUSADO';
      timerStatusText.style.color = isTimerRunning ? '#38bdf8' : '#94a3b8';
    }
    updateCrowdAmbiance();
  }

  function updatePeriod(period) {
    periodBadge.textContent = period || '1T';
  }

  function updateExtraTime(mins) {
    if (mins && mins > 0) {
      extraMinutes.textContent = mins;
      extraTimeBadge.style.display = 'inline-flex';
    } else {
      extraTimeBadge.style.display = 'none';
    }
  }

  function animateScoreNumber(el) {
    el.classList.remove('score-bump');
    void el.offsetWidth;
    el.classList.add('score-bump');
  }

  function updateCrowdAmbiance() {
    if (!stadiumAmbianceAudio) return;
    const shouldPlay = crowdAmbianceConfig && (
      crowdAmbianceConfig.isPlaying === true || 
      (crowdAmbianceConfig.enabled && isTimerRunning && crowdAmbianceConfig.autoWithTimer !== false)
    );
    if (shouldPlay) {
      stadiumAmbianceAudio.volume = (typeof crowdAmbianceConfig.volume === 'number') ? crowdAmbianceConfig.volume : 0.35;
      if (stadiumAmbianceAudio.paused) {
        const p = stadiumAmbianceAudio.play();
        if (p !== undefined) {
          p.then(() => {
            if (audioUnlockBanner) audioUnlockBanner.style.display = 'none';
          }).catch((err) => {
            console.warn('Autoplay bloqueado por el navegador en pantalla:', err);
            if (audioUnlockBanner) audioUnlockBanner.style.display = 'flex';
          });
        }
      }
    } else {
      if (!stadiumAmbianceAudio.paused) {
        stadiumAmbianceAudio.pause();
      }
    }
  }

  // Celebración de gol (Audio real sin IA)
  function showGoalCelebration(data) {
    if (goalTimeout) clearTimeout(goalTimeout);

    goalTeamLogo.src = data.teamLogo || '/assets/team-local.svg';
    goalTeamName.textContent = data.teamName || 'EQUIPO';
    goalScorePill.textContent = `${data.score1} - ${data.score2}`;

    goalOverlay.style.display = 'flex';

    // Atenuar hinchada durante el relato de gol
    if (stadiumAmbianceAudio && !stadiumAmbianceAudio.paused) {
      stadiumAmbianceAudio.volume = Math.max(0.05, (crowdAmbianceConfig.volume || 0.35) * 0.15);
      setTimeout(() => {
        if (stadiumAmbianceAudio && isTimerRunning && crowdAmbianceConfig.enabled) {
          stadiumAmbianceAudio.volume = crowdAmbianceConfig.volume || 0.35;
        }
      }, 7000);
    }

    // Reproducir audio real de gol (Mariano Closs)
    const audioConfig = data.goalAudio || currentGoalAudio;
    const audioUrl = (audioConfig && audioConfig.customUrl) ? audioConfig.customUrl : '/assets/sounds/closs-cantalo.mp3';

    if (goalCelebrationAudio) {
      goalCelebrationAudio.src = audioUrl;
      goalCelebrationAudio.currentTime = 0;
      goalCelebrationAudio.volume = 1.0;
      const playPromise = goalCelebrationAudio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          if (audioUnlockBanner) audioUnlockBanner.style.display = 'none';
        }).catch((err) => {
          console.warn('Autoplay bloqueado en celebración de gol:', err);
          if (audioUnlockBanner) audioUnlockBanner.style.display = 'flex';
          if (window.SoundEffects) window.SoundEffects.playGoal(audioUrl);
        });
      }
    } else if (window.SoundEffects) {
      window.SoundEffects.playGoal(audioUrl);
    }

    goalTimeout = setTimeout(() => {
      goalOverlay.style.display = 'none';
    }, 6000);
  }

  goalOverlay.addEventListener('click', () => {
    goalOverlay.style.display = 'none';
    if (goalTimeout) clearTimeout(goalTimeout);
  });

  // Socket Events
  socket.on('sync_state', (state) => renderState(state));

  socket.on('timer_tick', (data) => {
    updateTimerText(data.seconds);
    setTimerRunningState(data.isRunning);
  });

  socket.on('timer_state', (data) => {
    updateTimerText(data.seconds);
    setTimerRunningState(data.isRunning);
  });

  socket.on('score_updated', (data) => {
    if (data.team === 'team1') {
      scoreTeam1.textContent = data.score;
      animateScoreNumber(scoreTeam1);
    } else if (data.team === 'team2') {
      scoreTeam2.textContent = data.score;
      animateScoreNumber(scoreTeam2);
    }
  });

  socket.on('goal_celebration', (data) => {
    showGoalCelebration(data);
  });

  socket.on('goal_audio_updated', (audio) => {
    currentGoalAudio = audio;
  });

  socket.on('period_updated', (data) => {
    updatePeriod(data.period);
    if (typeof data.seconds === 'number') updateTimerText(data.seconds);
    if (typeof data.isRunning === 'boolean') setTimerRunningState(data.isRunning);
    if (data.penalties) updatePenaltiesUI(data.penalties);
  });

  socket.on('penalties_updated', (penalties) => {
    updatePenaltiesUI(penalties);
  });

  socket.on('extra_time_updated', (data) => {
    updateExtraTime(data.extraTime);
  });

  socket.on('teams_updated', (state) => renderState(state));

  socket.on('play_sound', (data) => {
    if (!window.SoundEffects) return;
    if (data.sound === 'whistle_short') window.SoundEffects.playWhistleShort();
    else if (data.sound === 'whistle_long') window.SoundEffects.playWhistleLong();
    else if (data.sound === 'goal_horn') window.SoundEffects.playGoalHorn();
  });

  socket.on('theme_updated', (data) => {
    if (data && data.theme) {
      applyTheme(data.theme);
    }
  });

  socket.on('play_sound_clip', (data) => {
    if (data && data.url && window.SoundEffects) {
      window.SoundEffects.playGoal(data.url);
    }
  });

  socket.on('stop_sound_clip', () => {
    if (window.SoundEffects) {
      window.SoundEffects.stopAudio();
    }
  });

  socket.on('crowd_ambiance_updated', (cfg) => {
    if (cfg) {
      crowdAmbianceConfig = cfg;
      if (stadiumAmbianceAudio) {
        if (typeof cfg.volume === 'number') {
          stadiumAmbianceAudio.volume = cfg.volume;
        }
        if (cfg.soundUrl && !stadiumAmbianceAudio.src.endsWith(cfg.soundUrl)) {
          stadiumAmbianceAudio.src = cfg.soundUrl;
        }
      }
      updateCrowdAmbiance();
    }
  });

  // Evento Oficial de Partido Finalizado (TV Broadcast Overlay)
  socket.on('match_finished', (record) => {
    if (concludedTournament) concludedTournament.textContent = record.tournament || 'TORNEO DE FÚTBOL';
    if (concludedLogo1) concludedLogo1.src = record.team1.logo || '/assets/team-local.svg';
    if (concludedName1) concludedName1.textContent = record.team1.name;
    if (concludedScore1) concludedScore1.textContent = record.team1.score;

    if (concludedLogo2) concludedLogo2.src = record.team2.logo || '/assets/team-visita.svg';
    if (concludedName2) concludedName2.textContent = record.team2.name;
    if (concludedScore2) concludedScore2.textContent = record.team2.score;

    if (concludedPenaltiesPill && concludedPenaltiesScore) {
      if (record.penalties && (record.penalties.enabled || record.penalties.score1 > 0 || record.penalties.score2 > 0)) {
        concludedPenaltiesPill.style.display = 'inline-block';
        concludedPenaltiesScore.textContent = `${record.penalties.score1} - ${record.penalties.score2}`;
      } else {
        concludedPenaltiesPill.style.display = 'none';
      }
    }

    if (concludedWinnerTitle) {
      if (record.winnerName && record.winnerName !== 'Empate') {
        concludedWinnerTitle.textContent = `¡GANADOR: ${record.winnerName.toUpperCase()}!`;
      } else {
        concludedWinnerTitle.textContent = `¡RESULTADO: EMPATE!`;
      }
    }

    const btnTvDownloadPdf = document.getElementById('btnTvDownloadPdf');
    const btnTvDownloadXlsx = document.getElementById('btnTvDownloadXlsx');
    if (btnTvDownloadPdf && record.files && record.files.pdf) {
      btnTvDownloadPdf.href = record.files.pdf;
    }
    if (btnTvDownloadXlsx && record.files && record.files.xlsx) {
      btnTvDownloadXlsx.href = record.files.xlsx;
    }

    if (matchFinishedOverlay) {
      matchFinishedOverlay.style.display = 'flex';
    }
  });

  socket.on('match_reset', () => {
    if (matchFinishedOverlay) {
      matchFinishedOverlay.style.display = 'none';
    }
  });

  if (btnCloseConcluded) {
    btnCloseConcluded.addEventListener('click', () => {
      if (matchFinishedOverlay) {
        matchFinishedOverlay.style.display = 'none';
      }
    });
  }

  // Atajo 'Q' para ver código QR privado
  document.addEventListener('keydown', (e) => {
    if (e.key === 'q' || e.key === 'Q') {
      qrModal.style.display = qrModal.style.display === 'none' ? 'flex' : 'none';
    }
  });

  // Triple clic en el título de torneo
  let clickCount = 0;
  let clickTimer = null;
  tournamentName.addEventListener('click', () => {
    clickCount++;
    if (clickTimer) clearTimeout(clickTimer);
    if (clickCount >= 3) {
      qrModal.style.display = 'flex';
      clickCount = 0;
    } else {
      clickTimer = setTimeout(() => { clickCount = 0; }, 500);
    }
  });

  btnCloseQrModal.addEventListener('click', () => {
    qrModal.style.display = 'none';
  });

  qrModal.addEventListener('click', (e) => {
    if (e.target === qrModal) qrModal.style.display = 'none';
  });

  // Pantalla Completa
  btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => console.warn(e));
    } else {
      document.exitFullscreen();
    }
  });

  // Sonido
  btnToggleSound.addEventListener('click', () => {
    if (window.SoundEffects) {
      window.SoundEffects.init();
      window.SoundEffects.enabled = !window.SoundEffects.enabled;
      soundIcon.textContent = window.SoundEffects.enabled ? '🔊' : '🔇';
    }
  });

  // Desbloqueo universal de audio para cumplir con las políticas de autoplay
  function unlockAllAudio() {
    if (window.SoundEffects) window.SoundEffects.init();
    if (goalCelebrationAudio) {
      goalCelebrationAudio.play().then(() => {
        goalCelebrationAudio.pause();
      }).catch(() => {});
    }
    if (stadiumAmbianceAudio) {
      stadiumAmbianceAudio.play().then(() => {
        const shouldStayPlaying = crowdAmbianceConfig && (
          crowdAmbianceConfig.isPlaying === true || 
          (crowdAmbianceConfig.enabled && isTimerRunning && crowdAmbianceConfig.autoWithTimer !== false)
        );
        if (!shouldStayPlaying) {
          stadiumAmbianceAudio.pause();
        }
      }).catch(() => {});
    }
    if (audioUnlockBanner) audioUnlockBanner.style.display = 'none';
  }

  if (btnUnlockAudio) btnUnlockAudio.addEventListener('click', unlockAllAudio);
  if (audioUnlockBanner) audioUnlockBanner.addEventListener('click', unlockAllAudio);
  document.body.addEventListener('click', unlockAllAudio, { once: true });
  document.addEventListener('keydown', unlockAllAudio, { once: true });
  document.addEventListener('touchstart', unlockAllAudio, { once: true });
});
