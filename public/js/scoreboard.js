// Lógica de Pantalla del Marcador (TV / PC / Transmisión)
document.addEventListener('DOMContentLoaded', () => {
  const socket = io();

  // Elementos del DOM
  const tournamentName = document.getElementById('tournamentName');
  const tournamentLogo = document.getElementById('tournamentLogo');
  const courtsStageWrapper = document.getElementById('courtsStageWrapper');
  const btnViewDual = document.getElementById('btnViewDual');
  const btnViewCancha1 = document.getElementById('btnViewCancha1');
  const btnViewCancha2 = document.getElementById('btnViewCancha2');

  // Mapeo completo de ambas canchas
  const courts = {
    cancha1: {
      key: 'cancha1',
      title: document.getElementById('courtTitle1'),
      cardTeam1: document.getElementById('cardC1Team1'),
      nameTeam1: document.getElementById('nameC1Team1'),
      logoTeam1: document.getElementById('logoC1Team1'),
      scoreTeam1: document.getElementById('scoreC1Team1'),
      accentTeam1: document.getElementById('accentC1Team1'),
      turnTagTeam1: document.getElementById('turnTagC1Team1'),

      cardTeam2: document.getElementById('cardC1Team2'),
      nameTeam2: document.getElementById('nameC1Team2'),
      logoTeam2: document.getElementById('logoC1Team2'),
      scoreTeam2: document.getElementById('scoreC1Team2'),
      accentTeam2: document.getElementById('accentC1Team2'),
      turnTagTeam2: document.getElementById('turnTagC1Team2'),

      periodBadge: document.getElementById('periodBadge1'),
      timerDisplay: document.getElementById('timerDisplay1'),
      timerMinutes: document.getElementById('timerMinutes1'),
      timerSeconds: document.getElementById('timerSeconds1'),
      extraTimeBadge: document.getElementById('extraTimeBadge1'),
      extraMinutes: document.getElementById('extraMinutes1'),
      timerStatusText: document.getElementById('timerStatusText1'),

      penaltyBoard: document.getElementById('penaltyBoard1'),
      penStatusLine: document.getElementById('penStatusLine1'),
      penAggregateScore: document.getElementById('penAggregateScore1'),
      penRowTeam1: document.getElementById('penRowC1Team1'),
      penAccent1: document.getElementById('penAccentC1Team1'),
      penLogo1: document.getElementById('penLogoC1Team1'),
      penName1: document.getElementById('penNameC1Team1'),
      penKickerTag1: document.getElementById('penKickerTagC1Team1'),
      penShotsStrip1: document.getElementById('penShotsStripC1Team1'),
      penScore1: document.getElementById('penScoreC1Team1'),

      penRowTeam2: document.getElementById('penRowC1Team2'),
      penAccent2: document.getElementById('penAccentC1Team2'),
      penLogo2: document.getElementById('penLogoC1Team2'),
      penName2: document.getElementById('penNameC1Team2'),
      penKickerTag2: document.getElementById('penKickerTagC1Team2'),
      penShotsStrip2: document.getElementById('penShotsStripC1Team2'),
      penScore2: document.getElementById('penScoreC1Team2'),

      penWinnerBanner: document.getElementById('penWinnerBanner1'),
      penWinnerMsg: document.getElementById('penWinnerMsg1'),
      penWinnerSub: document.getElementById('penWinnerSub1'),

      isRunning: false,
      seconds: 0
    },

    cancha2: {
      key: 'cancha2',
      title: document.getElementById('courtTitle2'),
      cardTeam1: document.getElementById('cardC2Team1'),
      nameTeam1: document.getElementById('nameC2Team1'),
      logoTeam1: document.getElementById('logoC2Team1'),
      scoreTeam1: document.getElementById('scoreC2Team1'),
      accentTeam1: document.getElementById('accentC2Team1'),
      turnTagTeam1: document.getElementById('turnTagC2Team1'),

      cardTeam2: document.getElementById('cardC2Team2'),
      nameTeam2: document.getElementById('nameC2Team2'),
      logoTeam2: document.getElementById('logoC2Team2'),
      scoreTeam2: document.getElementById('scoreC2Team2'),
      accentTeam2: document.getElementById('accentC2Team2'),
      turnTagTeam2: document.getElementById('turnTagC2Team2'),

      periodBadge: document.getElementById('periodBadge2'),
      timerDisplay: document.getElementById('timerDisplay2'),
      timerMinutes: document.getElementById('timerMinutes2'),
      timerSeconds: document.getElementById('timerSeconds2'),
      extraTimeBadge: document.getElementById('extraTimeBadge2'),
      extraMinutes: document.getElementById('extraMinutes2'),
      timerStatusText: document.getElementById('timerStatusText2'),

      penaltyBoard: document.getElementById('penaltyBoard2'),
      penStatusLine: document.getElementById('penStatusLine2'),
      penAggregateScore: document.getElementById('penAggregateScore2'),
      penRowTeam1: document.getElementById('penRowC2Team1'),
      penAccent1: document.getElementById('penAccentC2Team1'),
      penLogo1: document.getElementById('penLogoC2Team1'),
      penName1: document.getElementById('penNameC2Team1'),
      penKickerTag1: document.getElementById('penKickerTagC2Team1'),
      penShotsStrip1: document.getElementById('penShotsStripC2Team1'),
      penScore1: document.getElementById('penScoreC2Team1'),

      penRowTeam2: document.getElementById('penRowC2Team2'),
      penAccent2: document.getElementById('penAccentC2Team2'),
      penLogo2: document.getElementById('penLogoC2Team2'),
      penName2: document.getElementById('penNameC2Team2'),
      penKickerTag2: document.getElementById('penKickerTagC2Team2'),
      penShotsStrip2: document.getElementById('penShotsStripC2Team2'),
      penScore2: document.getElementById('penScoreC2Team2'),

      penWinnerBanner: document.getElementById('penWinnerBanner2'),
      penWinnerMsg: document.getElementById('penWinnerMsg2'),
      penWinnerSub: document.getElementById('penWinnerSub2'),

      isRunning: false,
      seconds: 0
    }
  };

  function getCourtEl(cKey) {
    return (cKey === 'cancha2' || cKey === '2') ? courts.cancha2 : courts.cancha1;
  }

  // Modo de pantalla TV
  let currentViewMode = 'dual';

  function applyViewMode(mode) {
    if (!mode) return;
    currentViewMode = mode;
    if (courtsStageWrapper) {
      courtsStageWrapper.className = `courts-stage-wrapper mode-${mode}`;
    }
    if (btnViewDual) btnViewDual.classList.toggle('active', mode === 'dual');
    if (btnViewCancha1) btnViewCancha1.classList.toggle('active', mode === 'cancha1');
    if (btnViewCancha2) btnViewCancha2.classList.toggle('active', mode === 'cancha2');
  }

  if (btnViewDual) {
    btnViewDual.addEventListener('click', () => {
      applyViewMode('dual');
      socket.emit('set_view_mode', { mode: 'dual' });
    });
  }
  if (btnViewCancha1) {
    btnViewCancha1.addEventListener('click', () => {
      applyViewMode('cancha1');
      socket.emit('set_view_mode', { mode: 'cancha1' });
    });
  }
  if (btnViewCancha2) {
    btnViewCancha2.addEventListener('click', () => {
      applyViewMode('cancha2');
      socket.emit('set_view_mode', { mode: 'cancha2' });
    });
  }

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
  const goalCourtBadge = document.getElementById('goalCourtBadge');
  const goalTeamLogo = document.getElementById('goalTeamLogo');
  const goalTeamName = document.getElementById('goalTeamName');
  const goalScorePill = document.getElementById('goalScorePill');

  // Overlay de Partido Concluido (TV)
  const matchFinishedOverlay = document.getElementById('matchFinishedOverlay');
  const concludedCourtBadge = document.getElementById('concludedCourtBadge');
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

  let goalTimeout = null;
  let currentGoalAudio = { type: 'closs_random', customUrl: '/assets/sounds/closs-cantalo.mp3' };

  // Audio continuo de Hinchada
  const stadiumAmbianceAudio = document.getElementById('stadiumAmbianceAudio');
  let crowdAmbianceConfig = { enabled: true, isPlaying: false, autoWithTimer: true, volume: 0.35 };

  // Audio dedicado para celebración de gol
  const goalCelebrationAudio = document.getElementById('goalCelebrationAudio');

  // Banner flotante de activación de audio
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

  // Formatear segundos a MM:SS para una cancha
  function updateCourtTimer(cKey, totalSecs) {
    const c = getCourtEl(cKey);
    c.seconds = totalSecs;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (c.timerMinutes) c.timerMinutes.textContent = String(mins).padStart(2, '0');
    if (c.timerSeconds) c.timerSeconds.textContent = String(secs).padStart(2, '0');
  }

  function setCourtTimerRunningState(cKey, running) {
    const c = getCourtEl(cKey);
    c.isRunning = !!running;
    if (c.timerDisplay) {
      c.timerDisplay.classList.toggle('timer-paused', !c.isRunning);
      c.timerDisplay.classList.toggle('running', c.isRunning);
    }
    if (c.timerStatusText) {
      c.timerStatusText.textContent = c.isRunning ? 'EN JUEGO' : 'PAUSADO';
      c.timerStatusText.style.color = c.isRunning ? '#38bdf8' : '#94a3b8';
    }
    updateCrowdAmbiance();
  }

  function updateCourtPeriod(cKey, period) {
    const c = getCourtEl(cKey);
    if (c.periodBadge) c.periodBadge.textContent = period || '1T';
  }

  function updateCourtExtraTime(cKey, mins) {
    const c = getCourtEl(cKey);
    if (!c.extraTimeBadge) return;
    if (mins && mins > 0) {
      if (c.extraMinutes) c.extraMinutes.textContent = mins;
      c.extraTimeBadge.style.display = 'inline-flex';
    } else {
      c.extraTimeBadge.style.display = 'none';
    }
  }

  // Renderizar la tira principal numerada (1 a 5+) en el panel de transmisión
  function renderNumberedShotsStrip(stripEl, shotsArray, isKickingTurn) {
    if (!stripEl || !shotsArray) return;
    stripEl.innerHTML = '';
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

  function updateCourtPenaltiesUI(cKey, penalties) {
    const c = getCourtEl(cKey);
    if (!penalties) return;
    const show = penalties.enabled;

    if (c.penaltyBoard) c.penaltyBoard.style.display = show ? 'flex' : 'none';

    if (show) {
      if (c.penName1 && c.nameTeam1) c.penName1.textContent = c.nameTeam1.textContent.trim();
      if (c.penLogo1 && c.logoTeam1) c.penLogo1.src = c.logoTeam1.src;
      if (c.penScore1) c.penScore1.textContent = penalties.score1 || 0;
      if (c.penAccent1 && c.accentTeam1) c.penAccent1.style.background = c.accentTeam1.style.background;

      if (c.penName2 && c.nameTeam2) c.penName2.textContent = c.nameTeam2.textContent.trim();
      if (c.penLogo2 && c.logoTeam2) c.penLogo2.src = c.logoTeam2.src;
      if (c.penScore2) c.penScore2.textContent = penalties.score2 || 0;
      if (c.penAccent2 && c.accentTeam2) c.penAccent2.style.background = c.accentTeam2.style.background;

      if (c.penAggregateScore) {
        c.penAggregateScore.textContent = `${penalties.score1 || 0} - ${penalties.score2 || 0}`;
      }

      const roundNum = penalties.currentRound || 1;
      const isTeam1Turn = penalties.currentTurn === 'team1';
      const isTeam2Turn = penalties.currentTurn === 'team2';

      if (c.penStatusLine) {
        if (penalties.isFinished) {
          c.penStatusLine.textContent = 'SERIE FINALIZADA • ¡HAY GANADOR!';
        } else {
          const roundText = roundNum <= 5 ? `RONDA ${roundNum} DE 5` : `MUERTE SÚBITA (TIRO ${roundNum})`;
          const kickerName = isTeam1Turn ? (c.nameTeam1.textContent.trim().toUpperCase()) : (isTeam2Turn ? (c.nameTeam2.textContent.trim().toUpperCase()) : 'FINALIZADO');
          c.penStatusLine.textContent = `${roundText} • TURNO DE: ${kickerName} ⚡`;
        }
      }

      if (c.penRowTeam1) {
        c.penRowTeam1.classList.toggle('kicking-turn', isTeam1Turn);
        c.penRowTeam1.classList.toggle('team-winner', penalties.isFinished && penalties.winner === 'team1');
      }
      if (c.penRowTeam2) {
        c.penRowTeam2.classList.toggle('kicking-turn', isTeam2Turn);
        c.penRowTeam2.classList.toggle('team-winner', penalties.isFinished && penalties.winner === 'team2');
      }
      if (c.penKickerTag1) c.penKickerTag1.style.display = isTeam1Turn ? 'inline-block' : 'none';
      if (c.penKickerTag2) c.penKickerTag2.style.display = isTeam2Turn ? 'inline-block' : 'none';

      renderNumberedShotsStrip(c.penShotsStrip1, penalties.team1, isTeam1Turn);
      renderNumberedShotsStrip(c.penShotsStrip2, penalties.team2, isTeam2Turn);

      if (c.cardTeam1) c.cardTeam1.classList.toggle('kicking-turn', isTeam1Turn);
      if (c.cardTeam2) c.cardTeam2.classList.toggle('kicking-turn', isTeam2Turn);
      if (c.turnTagTeam1) c.turnTagTeam1.style.display = isTeam1Turn ? 'inline-flex' : 'none';
      if (c.turnTagTeam2) c.turnTagTeam2.style.display = isTeam2Turn ? 'inline-flex' : 'none';

      if (penalties.isFinished && penalties.winner) {
        const winnerName = penalties.winnerName || (penalties.winner === 'team1' ? c.nameTeam1.textContent : c.nameTeam2.textContent);
        if (c.penWinnerMsg) c.penWinnerMsg.textContent = `¡GANADOR POR PENALES: ${winnerName}!`;
        if (c.penWinnerSub) c.penWinnerSub.textContent = `Serie finalizada (${penalties.score1} a ${penalties.score2}) • ¡Clasificado / Campeón!`;
        if (c.penWinnerBanner) c.penWinnerBanner.style.display = 'flex';

        if (c.cardTeam1) c.cardTeam1.classList.toggle('team-winner', penalties.winner === 'team1');
        if (c.cardTeam2) c.cardTeam2.classList.toggle('team-winner', penalties.winner === 'team2');
      } else {
        if (c.penWinnerBanner) c.penWinnerBanner.style.display = 'none';
        if (c.cardTeam1) c.cardTeam1.classList.remove('team-winner');
        if (c.cardTeam2) c.cardTeam2.classList.remove('team-winner');
      }
    } else {
      if (c.penWinnerBanner) c.penWinnerBanner.style.display = 'none';
      if (c.turnTagTeam1) c.turnTagTeam1.style.display = 'none';
      if (c.turnTagTeam2) c.turnTagTeam2.style.display = 'none';
      if (c.cardTeam1) c.cardTeam1.classList.remove('kicking-turn', 'team-winner');
      if (c.cardTeam2) c.cardTeam2.classList.remove('kicking-turn', 'team-winner');
    }
  }

  // Sincronizar cancha individual
  function renderCourt(cKey, courtState) {
    if (!courtState) return;
    const c = getCourtEl(cKey);

    if (c.title && courtState.name) c.title.textContent = courtState.name.toUpperCase();

    // Equipo 1
    if (c.nameTeam1) c.nameTeam1.textContent = courtState.team1.name || 'EQUIPO LOCAL';
    if (c.logoTeam1) c.logoTeam1.src = courtState.team1.logo || '/assets/team-local.svg';
    if (c.scoreTeam1) c.scoreTeam1.textContent = courtState.team1.score;
    if (courtState.team1.color && c.accentTeam1) {
      c.accentTeam1.style.background = courtState.team1.color;
      c.accentTeam1.style.boxShadow = `0 0 16px ${courtState.team1.color}`;
    }

    // Equipo 2
    if (c.nameTeam2) c.nameTeam2.textContent = courtState.team2.name || 'EQUIPO VISITA';
    if (c.logoTeam2) c.logoTeam2.src = courtState.team2.logo || '/assets/team-visita.svg';
    if (c.scoreTeam2) c.scoreTeam2.textContent = courtState.team2.score;
    if (courtState.team2.color && c.accentTeam2) {
      c.accentTeam2.style.background = courtState.team2.color;
      c.accentTeam2.style.boxShadow = `0 0 16px ${courtState.team2.color}`;
    }

    // Cronómetro y periodo
    if (courtState.timer) {
      updateCourtTimer(cKey, courtState.timer.seconds);
      setCourtTimerRunningState(cKey, courtState.timer.isRunning);
      updateCourtPeriod(cKey, courtState.timer.period);
      updateCourtExtraTime(cKey, courtState.timer.extraTime);
    }

    // Penales
    if (courtState.penalties) {
      updateCourtPenaltiesUI(cKey, courtState.penalties);
    }
  }

  // Sincronizar estado completo
  function renderState(state) {
    if (!state) return;

    if (tournamentName) tournamentName.textContent = state.tournament || 'IES NUEVO HORIZONTE';
    if (tournamentLogo) {
      tournamentLogo.src = state.tournamentLogo || '/assets/tournament-default.png';
    }
    if (state.goalAudio) currentGoalAudio = state.goalAudio;

    if (state.viewMode) {
      applyViewMode(state.viewMode);
    }

    if (state.cancha1) renderCourt('cancha1', state.cancha1);
    if (state.cancha2) renderCourt('cancha2', state.cancha2);

    if (state.theme) applyTheme(state.theme);

    if (state.crowdAmbiance) {
      crowdAmbianceConfig = state.crowdAmbiance;
      updateCrowdAmbiance();
    }
  }

  function animateScoreNumber(el) {
    if (!el) return;
    el.classList.remove('score-bump');
    void el.offsetWidth;
    el.classList.add('score-bump');
  }

  function updateCrowdAmbiance() {
    if (!stadiumAmbianceAudio) return;
    const anyRunning = courts.cancha1.isRunning || courts.cancha2.isRunning;
    const shouldPlay = crowdAmbianceConfig && (
      crowdAmbianceConfig.isPlaying === true || 
      (crowdAmbianceConfig.enabled && anyRunning && crowdAmbianceConfig.autoWithTimer !== false)
    );
    if (shouldPlay) {
      stadiumAmbianceAudio.volume = (typeof crowdAmbianceConfig.volume === 'number') ? crowdAmbianceConfig.volume : 0.35;
      if (stadiumAmbianceAudio.paused) {
        const p = stadiumAmbianceAudio.play();
        if (p !== undefined) {
          p.then(() => {
            if (audioUnlockBanner) audioUnlockBanner.style.display = 'none';
          }).catch((err) => {
            console.warn('Autoplay bloqueado en pantalla:', err);
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

  // Celebración de gol (Audio real sin IA con indicador de Cancha)
  function showGoalCelebration(data) {
    if (goalTimeout) clearTimeout(goalTimeout);

    const cKey = (data && (data.cancha === 'cancha2' || data.cancha === '2')) ? 'cancha2' : 'cancha1';
    const cName = data.courtName || (cKey === 'cancha2' ? 'CANCHA 2' : 'CANCHA 1');

    if (goalCourtBadge) goalCourtBadge.textContent = `🏟️ ${cName.toUpperCase()}`;
    if (goalTeamLogo) goalTeamLogo.src = data.teamLogo || '/assets/team-local.svg';
    if (goalTeamName) goalTeamName.textContent = data.teamName || 'EQUIPO';
    if (goalScorePill) goalScorePill.textContent = `${data.score1} - ${data.score2}`;

    goalOverlay.style.display = 'flex';

    // Atenuar hinchada durante el relato de gol
    if (stadiumAmbianceAudio && !stadiumAmbianceAudio.paused) {
      stadiumAmbianceAudio.volume = Math.max(0.05, (crowdAmbianceConfig.volume || 0.35) * 0.15);
      setTimeout(() => {
        const anyRunning = courts.cancha1.isRunning || courts.cancha2.isRunning;
        if (stadiumAmbianceAudio && anyRunning && crowdAmbianceConfig.enabled) {
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

  // =========================================================================
  // WEBSOCKETS LISTENERS
  // =========================================================================
  socket.on('sync_state', (state) => renderState(state));

  socket.on('view_mode_updated', (data) => {
    if (data && data.viewMode) applyViewMode(data.viewMode);
  });

  socket.on('timer_tick', (data) => {
    if (data.cancha1) {
      updateCourtTimer('cancha1', data.cancha1.seconds);
      setCourtTimerRunningState('cancha1', data.cancha1.isRunning);
    }
    if (data.cancha2) {
      updateCourtTimer('cancha2', data.cancha2.seconds);
      setCourtTimerRunningState('cancha2', data.cancha2.isRunning);
    }
    if (data.cancha && data.cancha !== 'both' && typeof data.seconds === 'number') {
      updateCourtTimer(data.cancha, data.seconds);
      setCourtTimerRunningState(data.cancha, data.isRunning);
    }
  });

  socket.on('timer_state', (data) => {
    const cKey = data.cancha || 'cancha1';
    if (typeof data.seconds === 'number') updateCourtTimer(cKey, data.seconds);
    if (typeof data.isRunning === 'boolean') setCourtTimerRunningState(cKey, data.isRunning);
    if (data.cancha1) {
      updateCourtTimer('cancha1', data.cancha1.seconds);
      setCourtTimerRunningState('cancha1', data.cancha1.isRunning);
    }
    if (data.cancha2) {
      updateCourtTimer('cancha2', data.cancha2.seconds);
      setCourtTimerRunningState('cancha2', data.cancha2.isRunning);
    }
  });

  socket.on('score_updated', (data) => {
    const cKey = data.cancha || 'cancha1';
    const c = getCourtEl(cKey);
    if (data.team === 'team1' && c.scoreTeam1) {
      c.scoreTeam1.textContent = data.score;
      animateScoreNumber(c.scoreTeam1);
    } else if (data.team === 'team2' && c.scoreTeam2) {
      c.scoreTeam2.textContent = data.score;
      animateScoreNumber(c.scoreTeam2);
    }
  });

  socket.on('goal_celebration', (data) => {
    showGoalCelebration(data);
  });

  socket.on('goal_audio_updated', (audio) => {
    currentGoalAudio = audio;
  });

  socket.on('period_updated', (data) => {
    const cKey = data.cancha || 'cancha1';
    updateCourtPeriod(cKey, data.period);
    if (typeof data.seconds === 'number') updateCourtTimer(cKey, data.seconds);
    if (typeof data.isRunning === 'boolean') setCourtTimerRunningState(cKey, data.isRunning);
    if (data.penalties) updateCourtPenaltiesUI(cKey, data.penalties);
  });

  socket.on('penalties_updated', (data) => {
    const cKey = data.cancha || 'cancha1';
    const penalties = data.penalties || data;
    updateCourtPenaltiesUI(cKey, penalties);
  });

  socket.on('extra_time_updated', (data) => {
    const cKey = data.cancha || 'cancha1';
    updateCourtExtraTime(cKey, data.extraTime);
  });

  socket.on('teams_updated', (state) => renderState(state));

  socket.on('play_sound', (data) => {
    if (!window.SoundEffects) return;
    if (data.sound === 'whistle_short') window.SoundEffects.playWhistleShort();
    else if (data.sound === 'whistle_long') window.SoundEffects.playWhistleLong();
    else if (data.sound === 'goal_horn') window.SoundEffects.playGoalHorn();
  });

  socket.on('theme_updated', (data) => {
    if (data && data.theme) applyTheme(data.theme);
  });

  socket.on('play_sound_clip', (data) => {
    if (data && data.url && window.SoundEffects) {
      window.SoundEffects.playGoal(data.url);
    }
  });

  socket.on('stop_sound_clip', () => {
    if (window.SoundEffects) window.SoundEffects.stopAudio();
  });

  socket.on('crowd_ambiance_updated', (cfg) => {
    if (cfg) {
      crowdAmbianceConfig = cfg;
      if (stadiumAmbianceAudio) {
        if (typeof cfg.volume === 'number') stadiumAmbianceAudio.volume = cfg.volume;
        if (cfg.soundUrl && !stadiumAmbianceAudio.src.endsWith(cfg.soundUrl)) {
          stadiumAmbianceAudio.src = cfg.soundUrl;
        }
      }
      updateCrowdAmbiance();
    }
  });

  // Evento Oficial de Partido Finalizado (TV Broadcast Overlay con identificación de cancha)
  socket.on('match_finished', (record) => {
    if (concludedCourtBadge) {
      concludedCourtBadge.textContent = `🏟️ ${(record.courtName || record.courtKey || 'CANCHA 1').toUpperCase()}`;
    }
    if (concludedTournament) concludedTournament.textContent = record.tournament || 'IES NUEVO HORIZONTE';
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
    const courtParam = record.courtKey || 'cancha1';
    if (btnTvDownloadPdf) {
      btnTvDownloadPdf.href = record.files && record.files.pdf ? record.files.pdf : `/api/report/pdf?cancha=${courtParam}`;
    }
    if (btnTvDownloadXlsx) {
      btnTvDownloadXlsx.href = record.files && record.files.xlsx ? record.files.xlsx : `/api/report/excel?cancha=${courtParam}`;
    }

    if (matchFinishedOverlay) {
      matchFinishedOverlay.style.display = 'flex';
    }
  });

  socket.on('match_reset', () => {
    if (matchFinishedOverlay) matchFinishedOverlay.style.display = 'none';
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
