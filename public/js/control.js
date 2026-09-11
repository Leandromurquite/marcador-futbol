// Lógica del Control Remoto Móvil
document.addEventListener('DOMContentLoaded', () => {
  const socket = io();

  // Vibración táctil si el celular lo soporta
  function haptic(ms = 40) {
    if (navigator.vibrate) {
      try { navigator.vibrate(ms); } catch (e) {}
    }
  }

  // =========================================================================
  // SISTEMA DE SEGURIDAD: BLOQUEO POR PIN
  // =========================================================================
  const pinLockScreen = document.getElementById('pinLockScreen');
  const appMainContainer = document.getElementById('appMainContainer');
  const pinCircles = document.querySelectorAll('.pin-circle');
  const pinErrorMsg = document.getElementById('pinErrorMsg');
  const btnPinClear = document.getElementById('btnPinClear');
  const btnPinDelete = document.getElementById('btnPinDelete');
  const btnLockApp = document.getElementById('btnLockApp');

  let enteredPin = '';

  function unlockApp() {
    sessionStorage.setItem('control_auth', 'true');
    pinLockScreen.style.display = 'none';
    appMainContainer.style.display = 'block';
  }

  function lockApp() {
    sessionStorage.removeItem('control_auth');
    enteredPin = '';
    updatePinDisplay();
    pinErrorMsg.textContent = '';
    pinLockScreen.style.display = 'flex';
    appMainContainer.style.display = 'none';
  }

  if (sessionStorage.getItem('control_auth') === 'true') {
    unlockApp();
  }

  function updatePinDisplay() {
    pinCircles.forEach((circle, idx) => {
      if (idx < enteredPin.length) {
        circle.classList.add('filled');
      } else {
        circle.classList.remove('filled');
      }
    });
  }

  async function submitPin() {
    try {
      const res = await fetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: enteredPin })
      });
      const data = await res.json();
      if (data.valid) {
        haptic(80);
        unlockApp();
      } else {
        haptic([50, 50, 50]);
        pinErrorMsg.textContent = 'PIN Incorrecto. Intenta de nuevo.';
        enteredPin = '';
        updatePinDisplay();
      }
    } catch (e) {
      pinErrorMsg.textContent = 'Error al verificar PIN.';
      enteredPin = '';
      updatePinDisplay();
    }
  }

  document.querySelectorAll('.pin-key[data-num]').forEach(key => {
    key.addEventListener('click', () => {
      haptic(25);
      if (enteredPin.length < 8) {
        enteredPin += key.dataset.num;
        updatePinDisplay();
        pinErrorMsg.textContent = '';

        if (enteredPin.length === 4) {
          submitPin();
        }
      }
    });
  });

  btnPinDelete.addEventListener('click', () => {
    haptic(20);
    enteredPin = enteredPin.slice(0, -1);
    updatePinDisplay();
    pinErrorMsg.textContent = '';
  });

  btnPinClear.addEventListener('click', () => {
    haptic(20);
    enteredPin = '';
    updatePinDisplay();
    pinErrorMsg.textContent = '';
  });

  btnLockApp.addEventListener('click', () => {
    haptic(40);
    lockApp();
  });

  // =========================================================================
  // ESTADO Y ELEMENTOS
  // =========================================================================
  let currentState = null;
  let currentSeconds = 0;
  let isTimerRunning = false;
  let currentHalfMinutes = 12;
  let uploadedTournamentLogo = null;
  let uploadedLogo1 = null;
  let uploadedLogo2 = null;
  let uploadedCustomAudio = null;

  // Audio local en el dispositivo del control remoto (para que suene en el celular al tocar)
  const localCrowdAudio = new Audio('/assets/sounds/ambiente-estadio-continuo.mp3');
  localCrowdAudio.loop = true;
  localCrowdAudio.volume = 0.35;

  function playLocalClip(url) {
    if (!url) return;
    try {
      if (window.SoundEffects) {
        window.SoundEffects.playAudioFile(url);
      } else {
        const audio = new Audio(url);
        audio.play().catch(e => console.log('Local audio:', e));
      }
    } catch (e) {
      console.warn('Local play error:', e);
    }
  }

  const statusIndicator = document.querySelector('.status-indicator');
  const statusLabel = document.getElementById('statusLabel');

  // Pestañas
  const tabBtnLive = document.getElementById('tabBtnLive');
  const tabBtnTeams = document.getElementById('tabBtnTeams');
  const tabLive = document.getElementById('tabLive');
  const tabTeams = document.getElementById('tabTeams');

  // Mini Marcador
  const miniTournamentBar = document.getElementById('miniTournamentBar');
  const miniTournamentLogo = document.getElementById('miniTournamentLogo');
  const miniTournamentName = document.getElementById('miniTournamentName');
  const miniLogo1 = document.getElementById('miniLogo1');
  const miniName1 = document.getElementById('miniName1');
  const miniScore1 = document.getElementById('miniScore1');
  const miniLogo2 = document.getElementById('miniLogo2');
  const miniName2 = document.getElementById('miniName2');
  const miniScore2 = document.getElementById('miniScore2');
  const miniPeriod = document.getElementById('miniPeriod');
  const miniTimer = document.getElementById('miniTimer');
  const miniExtra = document.getElementById('miniExtra');

  // Goles
  const ctrlName1 = document.getElementById('ctrlName1');
  const ctrlScore1 = document.getElementById('ctrlScore1');
  const btnAddGoal1 = document.getElementById('btnAddGoal1');
  const btnMinusGoal1 = document.getElementById('btnMinusGoal1');
  const btnZeroGoal1 = document.getElementById('btnZeroGoal1');

  const ctrlName2 = document.getElementById('ctrlName2');
  const ctrlScore2 = document.getElementById('ctrlScore2');
  const btnAddGoal2 = document.getElementById('btnAddGoal2');
  const btnMinusGoal2 = document.getElementById('btnMinusGoal2');
  const btnZeroGoal2 = document.getElementById('btnZeroGoal2');

  // Cronómetro
  const ctrlTimerDisplay = document.getElementById('ctrlTimerDisplay');
  const btnTimerToggle = document.getElementById('btnTimerToggle');
  const timerToggleIcon = document.getElementById('timerToggleIcon');
  const timerToggleText = document.getElementById('timerToggleText');
  const btnResetTimer = document.getElementById('btnResetTimer');
  const btnPlusMinute = document.getElementById('btnPlusMinute');
  const btnMinusMinute = document.getElementById('btnMinusMinute');
  const btnJumpStart = document.getElementById('btnJumpStart');
  const btnJumpHalf = document.getElementById('btnJumpHalf');
  const btnJumpEnd = document.getElementById('btnJumpEnd');

  // Periodos y Tiempo Extra (+1 y -1)
  const periodButtons = document.querySelectorAll('.btn-period');
  const displayCurrentExtra = document.getElementById('displayCurrentExtra');
  const btnExtraMinus = document.getElementById('btnExtraMinus');
  const btnExtraPlus = document.getElementById('btnExtraPlus');
  let currentExtraMinutes = 0;

  // Tanda de Penales (Plegable en Celular)
  const penaltyControlBody = document.getElementById('penaltyControlBody');
  const btnTogglePenaltiesView = document.getElementById('btnTogglePenaltiesView');
  const penTvStatusBadge = document.getElementById('penTvStatusBadge');
  let isPenaltiesExpandedOnMobile = false;
  const btnStopCurrentAudio = document.getElementById('btnStopCurrentAudio');
  const ctrlWinnerAlert = document.getElementById('ctrlWinnerAlert');
  const ctrlWinnerAlertTitle = document.getElementById('ctrlWinnerAlertTitle');
  const ctrlWinnerAlertSubtitle = document.getElementById('ctrlWinnerAlertSubtitle');
  const ctrlPenaltyBannerScore = document.getElementById('ctrlPenaltyBannerScore');

  const ctrlTurnBanner = document.getElementById('ctrlTurnBanner');
  const ctrlTurnText = document.getElementById('ctrlTurnText');
  const ctrlPenErrorToast = document.getElementById('ctrlPenErrorToast');
  const ctrlPenErrorMsg = document.getElementById('ctrlPenErrorMsg');
  const btnClosePenToast = document.getElementById('btnClosePenToast');

  const penBoxTeam1 = document.getElementById('penBoxTeam1');
  const penName1 = document.getElementById('penName1');
  const penTurnTag1 = document.getElementById('penTurnTag1');
  const penScore1 = document.getElementById('penScore1');
  const ctrlDots1 = document.getElementById('ctrlDots1');
  const btnPenGoal1 = document.getElementById('btnPenGoal1');
  const btnPenMiss1 = document.getElementById('btnPenMiss1');
  const btnPenPost1 = document.getElementById('btnPenPost1');
  const btnPenUndo1 = document.getElementById('btnPenUndo1');

  const penBoxTeam2 = document.getElementById('penBoxTeam2');
  const penName2 = document.getElementById('penName2');
  const penTurnTag2 = document.getElementById('penTurnTag2');
  const penScore2 = document.getElementById('penScore2');
  const ctrlDots2 = document.getElementById('ctrlDots2');
  const btnPenGoal2 = document.getElementById('btnPenGoal2');
  const btnPenMiss2 = document.getElementById('btnPenMiss2');
  const btnPenPost2 = document.getElementById('btnPenPost2');
  const btnPenUndo2 = document.getElementById('btnPenUndo2');
  const btnPenUndoGlobal = document.getElementById('btnPenUndoGlobal');
  const btnResetPenalties = document.getElementById('btnResetPenalties');

  // Sorteo de Penales
  const ctrlCoinTossBar = document.getElementById('ctrlCoinTossBar');
  const btnCoinTossTeam1 = document.getElementById('btnCoinTossTeam1');
  const btnCoinTossTeam2 = document.getElementById('btnCoinTossTeam2');

  // Temas y Clima de Cancha
  const themeButtons = document.querySelectorAll('.btn-theme-select');

  // Soundboard Mariano Closs y Cánticos
  const soundboardButtons = document.querySelectorAll('.btn-soundboard-clip');

  // Ambiente Continuo de Hinchada
  const btnToggleCrowd = document.getElementById('btnToggleCrowd');
  const crowdToggleIcon = document.getElementById('crowdToggleIcon');
  const crowdToggleText = document.getElementById('crowdToggleText');
  const rangeCrowdVolume = document.getElementById('rangeCrowdVolume');
  const crowdVolumeDisplay = document.getElementById('crowdVolumeDisplay');

  // Sonidos
  const btnSoundWhistleShort = document.getElementById('btnSoundWhistleShort');
  const btnSoundWhistleLong = document.getElementById('btnSoundWhistleLong');
  const btnSoundGoalHorn = document.getElementById('btnSoundGoalHorn');
  const btnResetAllMatch = document.getElementById('btnResetAllMatch');

  // Finalizar Partido Oficial y Modal de Reportes
  const btnFinishMatch = document.getElementById('btnFinishMatch');
  const modalMatchFinished = document.getElementById('modalMatchFinished');
  const finishedModalTournament = document.getElementById('finishedModalTournament');
  const finishedTeam1Name = document.getElementById('finishedTeam1Name');
  const finishedScore1 = document.getElementById('finishedScore1');
  const finishedTeam2Name = document.getElementById('finishedTeam2Name');
  const finishedScore2 = document.getElementById('finishedScore2');
  const finishedPenaltiesNote = document.getElementById('finishedPenaltiesNote');
  const finishedPenaltiesScore = document.getElementById('finishedPenaltiesScore');
  const finishedWinnerBanner = document.getElementById('finishedWinnerBanner');
  const finishedWinnerText = document.getElementById('finishedWinnerText');
  const btnDownloadPdf = document.getElementById('btnDownloadPdf');
  const btnDownloadXlsx = document.getElementById('btnDownloadXlsx');
  const btnDirectPdf = document.getElementById('btnDirectPdf');
  const btnDirectXlsx = document.getElementById('btnDirectXlsx');
  const btnModalResetMatch = document.getElementById('btnModalResetMatch');
  const btnModalCloseFinished = document.getElementById('btnModalCloseFinished');
  const matchHistoryList = document.getElementById('matchHistoryList');
  const btnRefreshHistory = document.getElementById('btnRefreshHistory');

  // Banner de Celebración de Gol en Celular
  const mobileGoalBanner = document.getElementById('mobileGoalBanner');
  const mobileGoalTitle = document.getElementById('mobileGoalTitle');
  const mobileGoalSubtitle = document.getElementById('mobileGoalSubtitle');
  let mobileGoalTimeout = null;

  function showMobileGoalToast(teamName, s1, s2) {
    if (!mobileGoalBanner) return;
    if (mobileGoalTimeout) clearTimeout(mobileGoalTimeout);
    if (mobileGoalTitle) mobileGoalTitle.textContent = `¡GOOOOOOL! (${s1} - ${s2})`;
    if (mobileGoalSubtitle) mobileGoalSubtitle.textContent = `Anotó: ${teamName}`;
    mobileGoalBanner.style.display = 'flex';
    mobileGoalTimeout = setTimeout(() => {
      mobileGoalBanner.style.display = 'none';
    }, 4500);
  }

  // Formulario Equipos y Audios
  const formTeamsConfig = document.getElementById('formTeamsConfig');
  const inputTournament = document.getElementById('inputTournament');
  const previewTournamentLogo = document.getElementById('previewTournamentLogo');
  const fileTournamentLogo = document.getElementById('fileTournamentLogo');
  const btnTriggerUploadTournament = document.getElementById('btnTriggerUploadTournament');
  const btnResetTournamentLogo = document.getElementById('btnResetTournamentLogo');
  const feedbackTournamentLogo = document.getElementById('feedbackTournamentLogo');
  const inputTeam1Name = document.getElementById('inputTeam1Name');
  const inputTeam1Color = document.getElementById('inputTeam1Color');
  const team1ColorLabel = document.getElementById('team1ColorLabel');
  const previewTeam1Logo = document.getElementById('previewTeam1Logo');
  const fileTeam1Logo = document.getElementById('fileTeam1Logo');
  const btnTriggerUpload1 = document.getElementById('btnTriggerUpload1');
  const feedbackTeam1 = document.getElementById('feedbackTeam1');

  const inputTeam2Name = document.getElementById('inputTeam2Name');
  const inputTeam2Color = document.getElementById('inputTeam2Color');
  const team2ColorLabel = document.getElementById('team2ColorLabel');
  const previewTeam2Logo = document.getElementById('previewTeam2Logo');
  const fileTeam2Logo = document.getElementById('fileTeam2Logo');
  const btnTriggerUpload2 = document.getElementById('btnTriggerUpload2');
  const feedbackTeam2 = document.getElementById('feedbackTeam2');

  // Audios de Gol
  const audioRadioClossRandom = document.getElementById('audioRadioClossRandom');
  const audioRadioClossCantalo = document.getElementById('audioRadioClossCantalo');
  const audioRadioClossEstadio = document.getElementById('audioRadioClossEstadio');
  const audioRadioClossBenzema = document.getElementById('audioRadioClossBenzema');
  const audioRadioHorn = document.getElementById('audioRadioHorn');
  const audioRadioCustom = document.getElementById('audioRadioCustom');
  const customAudioNameDisplay = document.getElementById('customAudioNameDisplay');
  const fileCustomAudio = document.getElementById('fileCustomAudio');
  const btnTriggerAudioUpload = document.getElementById('btnTriggerAudioUpload');
  const feedbackAudioUpload = document.getElementById('feedbackAudioUpload');

  // Duración del Partido
  const durationPresetButtons = document.querySelectorAll('.btn-duration-preset');
  const inputHalfDuration = document.getElementById('inputHalfDuration');
  const btnApplyDuration = document.getElementById('btnApplyDuration');

  // Cambio de PIN
  const inputNewPin = document.getElementById('inputNewPin');
  const btnChangePin = document.getElementById('btnChangePin');
  const feedbackPin = document.getElementById('feedbackPin');

  // Conexión
  socket.on('connect', () => {
    statusIndicator.classList.add('online');
    statusLabel.textContent = 'Conectado al servidor';
  });

  socket.on('disconnect', () => {
    statusIndicator.classList.remove('online');
    statusLabel.textContent = 'Desconectado (reintentando...)';
  });

  // Pestañas
  tabBtnLive.addEventListener('click', () => {
    haptic(20);
    tabBtnLive.classList.add('active');
    tabBtnTeams.classList.remove('active');
    tabLive.style.display = 'block';
    tabTeams.style.display = 'none';
  });

  tabBtnTeams.addEventListener('click', () => {
    haptic(20);
    tabBtnTeams.classList.add('active');
    tabBtnLive.classList.remove('active');
    tabTeams.style.display = 'block';
    tabLive.style.display = 'none';
  });

  // Actualizar Botones de Salto de Tiempo
  function updateJumpButtons(halfMins) {
    currentHalfMinutes = halfMins || 12;
    const halfSecs = currentHalfMinutes * 60;
    const fullSecs = halfSecs * 2;

    btnJumpStart.dataset.setSec = 0;
    btnJumpStart.textContent = `00:00 (1T)`;

    btnJumpHalf.dataset.setSec = halfSecs;
    btnJumpHalf.textContent = `${String(currentHalfMinutes).padStart(2, '0')}:00 (2T)`;

    btnJumpEnd.dataset.setSec = fullSecs;
    btnJumpEnd.textContent = `${String(currentHalfMinutes * 2).padStart(2, '0')}:00 (Fin)`;

    inputHalfDuration.value = currentHalfMinutes;
    durationPresetButtons.forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.min) === currentHalfMinutes);
    });
  }

  function showPenaltyError(message) {
    if (ctrlPenErrorMsg) {
      ctrlPenErrorMsg.textContent = message || 'No se puede hacer el gol, falta que el otro equipo ejecute el tiro penal';
    }
    if (ctrlPenErrorToast) {
      ctrlPenErrorToast.style.display = 'flex';
      clearTimeout(window.penToastTimeout);
      window.penToastTimeout = setTimeout(() => {
        ctrlPenErrorToast.style.display = 'none';
      }, 5000);
    }
    haptic(80);
    if (window.SoundEffects) {
      window.SoundEffects.playWhistleShort();
    }
  }

  if (btnClosePenToast) {
    btnClosePenToast.addEventListener('click', () => {
      ctrlPenErrorToast.style.display = 'none';
    });
  }

  // Renderizar las 5 bolitas interactivas con control de turnos
  function renderInteractivePenaltyDots(containerEl, teamKey, shotsArray) {
    containerEl.innerHTML = '';
    shotsArray.forEach((state, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `ctrl-dot ${state}`;
      dot.dataset.idx = index;
      dot.title = `Tiro ${index + 1}: ${state}`;

      dot.addEventListener('click', () => {
        haptic(30);

        if (currentState && currentState.penalties) {
          const p = currentState.penalties;
          if (p.isFinished && state === 'pending') {
            showPenaltyError(`La serie de penales ya finalizó. ¡${p.winnerName} es el ganador!`);
            return;
          }
        }

        let nextState = 'pending';
        if (state === 'pending') nextState = 'scored';
        else if (state === 'scored') nextState = 'missed';
        else if (state === 'missed') nextState = 'pending';

        socket.emit('set_penalty_shot', {
          team: teamKey,
          index: index,
          state: nextState
        });
      });

      containerEl.appendChild(dot);
    });
  }

  // Actualizar UI de Penales con Turnos y Declaración de Ganador
  function updatePenaltiesUI(penalties) {
    if (!penalties) return;
    if (currentState) {
      currentState.penalties = penalties;
    } else {
      currentState = { penalties };
    }

    penScore1.textContent = penalties.score1 || 0;
    penScore2.textContent = penalties.score2 || 0;
    ctrlPenaltyBannerScore.textContent = `${penalties.score1 || 0} - ${penalties.score2 || 0}`;

    const isPenEnabled = !!penalties.enabled;
    btnTogglePenaltiesView.classList.toggle('active', isPenEnabled);
    btnTogglePenaltiesView.textContent = isPenEnabled ? '🙈 Ocultar de Pantalla TV' : '👁️ Mostrar en Pantalla TV';
    if (penTvStatusBadge) {
      penTvStatusBadge.classList.toggle('active', isPenEnabled);
      penTvStatusBadge.textContent = isPenEnabled ? '📺 En Pantalla TV: MOSTRANDO' : '📺 En Pantalla TV: OCULTO';
    }

    // Banner de turno y resaltado de cajas
    const roundNum = penalties.currentRound || 1;
    if (penalties.isFinished) {
      if (ctrlTurnBanner) ctrlTurnBanner.style.display = 'none';
      penBoxTeam1.classList.remove('kicking-turn', 'waiting-turn');
      penBoxTeam2.classList.remove('kicking-turn', 'waiting-turn');
      if (penTurnTag1) penTurnTag1.style.display = 'none';
      if (penTurnTag2) penTurnTag2.style.display = 'none';
    } else {
      if (ctrlTurnBanner) {
        ctrlTurnBanner.style.display = 'flex';
        const activeName = penalties.currentTurn === 'team1' ? penName1.textContent : penName2.textContent;
        const roundText = roundNum <= 5 ? `Ronda ${roundNum} de 5` : `Muerte Súbita`;
        ctrlTurnText.textContent = `TURNO DE PATEAR: ${activeName.trim().toUpperCase()} (${roundText})`;
      }

      if (penalties.currentTurn === 'team1') {
        penBoxTeam1.classList.add('kicking-turn');
        penBoxTeam1.classList.remove('waiting-turn');
        penBoxTeam2.classList.remove('kicking-turn');
        penBoxTeam2.classList.add('waiting-turn');

        if (penTurnTag1) {
          penTurnTag1.textContent = '🎯 PATEANDO AHORA';
          penTurnTag1.classList.add('active');
          penTurnTag1.style.display = 'inline-block';
        }
        if (penTurnTag2) {
          penTurnTag2.textContent = '⏳ ESPERA SU TURNO';
          penTurnTag2.classList.remove('active');
          penTurnTag2.style.display = 'inline-block';
        }
      } else if (penalties.currentTurn === 'team2') {
        penBoxTeam2.classList.add('kicking-turn');
        penBoxTeam2.classList.remove('waiting-turn');
        penBoxTeam1.classList.remove('kicking-turn');
        penBoxTeam1.classList.add('waiting-turn');

        if (penTurnTag2) {
          penTurnTag2.textContent = '🎯 PATEANDO AHORA';
          penTurnTag2.classList.add('active');
          penTurnTag2.style.display = 'inline-block';
        }
        if (penTurnTag1) {
          penTurnTag1.textContent = '⏳ ESPERA SU TURNO';
          penTurnTag1.classList.remove('active');
          penTurnTag1.style.display = 'inline-block';
        }
      }
    }

    // Alerta de Ganador cuando termina la serie matemáticamente
    if (penalties.isFinished && penalties.winner) {
      const winnerName = penalties.winnerName || (penalties.winner === 'team1' ? ctrlName1.textContent : ctrlName2.textContent);
      ctrlWinnerAlertTitle.textContent = `🏆 ¡GANADOR POR PENALES: ${winnerName}!`;
      ctrlWinnerAlertSubtitle.textContent = `Serie finalizada (${penalties.score1} a ${penalties.score2}). Ya no hay más penales que patear.`;
      ctrlWinnerAlert.style.display = 'flex';

      if (penalties.winner === 'team1') {
        penBoxTeam1.classList.add('team-winner');
        penBoxTeam2.classList.remove('team-winner');
      } else {
        penBoxTeam2.classList.add('team-winner');
        penBoxTeam1.classList.remove('team-winner');
      }
    } else {
      ctrlWinnerAlert.style.display = 'none';
      penBoxTeam1.classList.remove('team-winner');
      penBoxTeam2.classList.remove('team-winner');
    }

    // Sorteo de primer pateador (solo visible antes de iniciar la tanda)
    const taken1 = (penalties.team1 || []).filter(s => s !== 'pending').length;
    const taken2 = (penalties.team2 || []).filter(s => s !== 'pending').length;
    if (ctrlCoinTossBar) {
      if (taken1 === 0 && taken2 === 0 && !penalties.isFinished) {
        ctrlCoinTossBar.style.display = 'flex';
        if (btnCoinTossTeam1) btnCoinTossTeam1.classList.toggle('active', (penalties.firstKicker || 'team1') === 'team1');
        if (btnCoinTossTeam2) btnCoinTossTeam2.classList.toggle('active', penalties.firstKicker === 'team2');
      } else {
        ctrlCoinTossBar.style.display = 'none';
      }
    }

    renderInteractivePenaltyDots(ctrlDots1, 'team1', penalties.team1);
    renderInteractivePenaltyDots(ctrlDots2, 'team2', penalties.team2);
  }

  // Renderizar estado general
  function updateUI(state) {
    if (!state) return;
    currentState = state;

    // Nombres completos
    miniName1.textContent = state.team1.name;
    miniScore1.textContent = state.team1.score;
    miniLogo1.src = state.team1.logo || '/assets/team-local.svg';
    ctrlName1.textContent = state.team1.name;
    ctrlScore1.textContent = state.team1.score;
    penName1.textContent = state.team1.name;

    miniName2.textContent = state.team2.name;
    miniScore2.textContent = state.team2.score;
    miniLogo2.src = state.team2.logo || '/assets/team-visita.svg';
    ctrlName2.textContent = state.team2.name;
    ctrlScore2.textContent = state.team2.score;
    penName2.textContent = state.team2.name;

    // Actualizar selector de tema/clima
    if (state.theme && themeButtons) {
      themeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === state.theme);
      });
    }

    if (state.timer) {
      updateTimer(state.timer.seconds);
      setTimerButtonState(state.timer.isRunning);
      updatePeriodButtons(state.timer.period);
      updateExtraButtons(state.timer.extraTime);
    }

    if (state.halfDurationMinutes) {
      updateJumpButtons(state.halfDurationMinutes);
    }

    if (state.penalties) {
      updatePenaltiesUI(state.penalties);
    }

    if (state.crowdAmbiance) {
      updateCrowdUI(state.crowdAmbiance);
    }

    if (state.goalAudio) {
      if (state.goalAudio.type === 'closs_random') {
        if (audioRadioClossRandom) audioRadioClossRandom.checked = true;
      } else if (state.goalAudio.type === 'closs_fixed' || state.goalAudio.type === 'closs') {
        const clip = state.goalAudio.selectedClip || state.goalAudio.customUrl || '';
        if (clip.includes('mariano-closs-gol')) {
          if (audioRadioClossBenzema) audioRadioClossBenzema.checked = true;
        } else if (clip.includes('closs-gol-messi')) {
          const r = document.getElementById('audioRadioClossMessi');
          if (r) r.checked = true;
        } else if (clip.includes('closs-gol-enzo')) {
          const r = document.getElementById('audioRadioClossEnzo');
          if (r) r.checked = true;
        } else if (clip.includes('closs-lo-va-a-ganar')) {
          const r = document.getElementById('audioRadioClossGanar');
          if (r) r.checked = true;
        } else {
          if (audioRadioClossCantalo) audioRadioClossCantalo.checked = true;
        }
      } else if (state.goalAudio.type === 'horn') {
        if (audioRadioHorn) audioRadioHorn.checked = true;
      } else {
        if (audioRadioCustom) audioRadioCustom.checked = true;
        if (state.goalAudio.name && customAudioNameDisplay) customAudioNameDisplay.textContent = state.goalAudio.name;
      }
    }

    if (state.tournamentLogo) {
      uploadedTournamentLogo = state.tournamentLogo;
    }
    if (miniTournamentName) miniTournamentName.textContent = state.tournament || 'TORNEO DE FÚTBOL';
    if (miniTournamentLogo) miniTournamentLogo.src = state.tournamentLogo || '/assets/tournament-default.png';
    if (previewTournamentLogo) previewTournamentLogo.src = state.tournamentLogo || '/assets/tournament-default.png';
    if (document.activeElement !== inputTournament) inputTournament.value = state.tournament || '';
    if (document.activeElement !== inputTeam1Name) {
      inputTeam1Name.value = state.team1.name || '';
      inputTeam1Color.value = state.team1.color || '#00d2ff';
      team1ColorLabel.textContent = (state.team1.color || '#00d2ff').toUpperCase();
      previewTeam1Logo.src = state.team1.logo || '/assets/team-local.svg';
    }
    if (document.activeElement !== inputTeam2Name) {
      inputTeam2Name.value = state.team2.name || '';
      inputTeam2Color.value = state.team2.color || '#ff3366';
      team2ColorLabel.textContent = (state.team2.color || '#ff3366').toUpperCase();
      previewTeam2Logo.src = state.team2.logo || '/assets/team-visita.svg';
    }
  }

  function updateTimer(secs) {
    currentSeconds = secs;
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    miniTimer.textContent = formatted;
    ctrlTimerDisplay.textContent = formatted;
  }

  function setTimerButtonState(running) {
    isTimerRunning = running;
    if (running) {
      btnTimerToggle.classList.add('running');
      timerToggleIcon.textContent = '⏸';
      timerToggleText.textContent = 'PAUSAR CRONÓMETRO';
    } else {
      btnTimerToggle.classList.remove('running');
      timerToggleIcon.textContent = '▶';
      timerToggleText.textContent = 'INICIAR CRONÓMETRO';
    }
  }

  function updatePeriodButtons(period) {
    miniPeriod.textContent = period || '1T';
    periodButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.period === period);
    });

    // Auto-plegado / auto-despliegue de penales en el celular
    if (period === 'Penales') {
      setPenaltiesMobileExpansion(true);
    } else {
      setPenaltiesMobileExpansion(false);
    }
  }

  function updateExtraButtons(mins) {
    currentExtraMinutes = Math.max(0, Math.min(60, parseInt(mins) || 0));
    if (displayCurrentExtra) displayCurrentExtra.textContent = `+${currentExtraMinutes}'`;

    if (miniExtra) {
      if (currentExtraMinutes > 0) {
        miniExtra.textContent = `+${currentExtraMinutes}'`;
        miniExtra.style.display = 'inline-block';
      } else {
        miniExtra.style.display = 'none';
      }
    }
  }

  function setPenaltiesMobileExpansion(expanded) {
    isPenaltiesExpandedOnMobile = !!expanded;
    if (penaltyControlBody) {
      penaltyControlBody.style.display = isPenaltiesExpandedOnMobile ? 'block' : 'none';
    }
    if (btnTogglePenaltiesView) {
      btnTogglePenaltiesView.textContent = isPenaltiesExpandedOnMobile ? '🙈 Plegar del Celular' : '👁️ Desplegar en Celular';
      btnTogglePenaltiesView.classList.toggle('active', isPenaltiesExpandedOnMobile);
    }
    if (penTvStatusBadge) {
      penTvStatusBadge.textContent = isPenaltiesExpandedOnMobile ? '📱 Celular: Visible' : '📱 Celular: Plegado';
      penTvStatusBadge.style.background = isPenaltiesExpandedOnMobile ? 'rgba(56, 189, 248, 0.2)' : 'rgba(148, 163, 184, 0.15)';
      penTvStatusBadge.style.color = isPenaltiesExpandedOnMobile ? '#38bdf8' : '#94a3b8';
    }
  }

  function updateCrowdUI(crowd) {
    if (!crowd) return;
    if (currentState) currentState.crowdAmbiance = crowd;
    const isPlaying = !!crowd.isPlaying;
    if (btnToggleCrowd) {
      btnToggleCrowd.classList.toggle('active', isPlaying);
      if (crowdToggleIcon) crowdToggleIcon.textContent = isPlaying ? '⏸' : '▶';
      if (crowdToggleText) crowdToggleText.textContent = isPlaying ? 'Pausar Hinchada' : 'Activar Hinchada';
    }
    if (rangeCrowdVolume && typeof crowd.volume === 'number') {
      const pct = Math.round(crowd.volume * 100);
      rangeCrowdVolume.value = pct;
      if (crowdVolumeDisplay) crowdVolumeDisplay.textContent = `${pct}%`;
      localCrowdAudio.volume = crowd.volume;
    }
    if (isPlaying) {
      if (localCrowdAudio.paused) {
        localCrowdAudio.play().catch(() => {});
      }
    } else {
      if (!localCrowdAudio.paused) {
        localCrowdAudio.pause();
      }
    }
  }

  // Socket Events
  socket.on('sync_state', (state) => updateUI(state));
  socket.on('crowd_ambiance_updated', (cfg) => {
    if (currentState) {
      currentState.crowdAmbiance = cfg;
    }
    updateCrowdUI(cfg);
  });
  socket.on('timer_tick', (data) => {
    updateTimer(data.seconds);
    setTimerButtonState(data.isRunning);
  });
  socket.on('timer_state', (data) => {
    updateTimer(data.seconds);
    setTimerButtonState(data.isRunning);
  });
  socket.on('score_updated', (data) => updateUI(data.state));
  socket.on('goal_celebration', (data) => {
    if (data && data.goalAudio && data.goalAudio.customUrl) {
      playLocalClip(data.goalAudio.customUrl);
    }
    haptic(140);
    showMobileGoalToast(data.teamName || 'EQUIPO', data.score1, data.score2);
  });
  socket.on('period_updated', (data) => {
    updatePeriodButtons(data.period);
    if (typeof data.seconds === 'number') updateTimer(data.seconds);
    if (typeof data.isRunning === 'boolean') setTimerButtonState(data.isRunning);
    if (data.penalties) updatePenaltiesUI(data.penalties);
  });
  socket.on('penalties_updated', (penalties) => {
    if (currentState) {
      currentState.penalties = penalties;
    } else {
      currentState = { penalties };
    }
    updatePenaltiesUI(penalties);
  });
  socket.on('penalty_turn_error', (data) => showPenaltyError(data.message));
  socket.on('extra_time_updated', (data) => updateExtraButtons(data.extraTime));
  socket.on('teams_updated', (state) => updateUI(state));
  socket.on('half_duration_updated', (data) => updateJumpButtons(data.halfDurationMinutes));

  // Partido Finalizado y Generación de Reportes
  socket.on('match_finished', (record) => {
    haptic([70, 70, 100]);
    if (finishedModalTournament) finishedModalTournament.textContent = record.tournament || 'TORNEO DE FÚTBOL';
    if (finishedTeam1Name) finishedTeam1Name.textContent = record.team1.name;
    if (finishedScore1) finishedScore1.textContent = record.team1.score;
    if (finishedTeam2Name) finishedTeam2Name.textContent = record.team2.name;
    if (finishedScore2) finishedScore2.textContent = record.team2.score;

    if (finishedPenaltiesNote && finishedPenaltiesScore) {
      if (record.penalties && (record.penalties.enabled || record.penalties.score1 > 0 || record.penalties.score2 > 0)) {
        finishedPenaltiesNote.style.display = 'block';
        finishedPenaltiesScore.textContent = `${record.penalties.score1} - ${record.penalties.score2}`;
      } else {
        finishedPenaltiesNote.style.display = 'none';
      }
    }

    if (finishedWinnerText) {
      if (record.winnerName && record.winnerName !== 'Empate') {
        finishedWinnerText.textContent = `🏆 ¡GANADOR: ${record.winnerName.toUpperCase()}!`;
      } else {
        finishedWinnerText.textContent = `🤝 ¡RESULTADO: EMPATE!`;
      }
    }

    if (btnDownloadPdf && record.files && record.files.pdf) {
      btnDownloadPdf.href = record.files.pdf;
    }
    if (btnDownloadXlsx && record.files && record.files.xlsx) {
      btnDownloadXlsx.href = record.files.xlsx;
    }
    if (btnDirectPdf && record.files && record.files.pdf) {
      btnDirectPdf.href = record.files.pdf;
    }
    if (btnDirectXlsx && record.files && record.files.xlsx) {
      btnDirectXlsx.href = record.files.xlsx;
    }

    if (modalMatchFinished) {
      modalMatchFinished.style.display = 'flex';
    }

    loadHistory();
  });

  // ACCIONES GOLES CON AUDIO REAL EN CELULAR Y PANTALLA
  btnAddGoal1.addEventListener('click', () => {
    haptic(80);
    const clip = currentState?.goalAudio?.selectedClip || currentState?.goalAudio?.customUrl || '/assets/sounds/closs-cantalo.mp3';
    playLocalClip(clip);
    showMobileGoalToast(ctrlName1.textContent, (parseInt(ctrlScore1.textContent) || 0) + 1, parseInt(ctrlScore2.textContent) || 0);
    socket.emit('update_score', { team: 'team1', delta: 1 });
  });
  btnMinusGoal1.addEventListener('click', () => {
    haptic(30);
    socket.emit('update_score', { team: 'team1', delta: -1 });
  });
  btnZeroGoal1.addEventListener('click', () => {
    haptic(30);
    socket.emit('update_score', { team: 'team1', score: 0 });
  });

  btnAddGoal2.addEventListener('click', () => {
    haptic(80);
    const clip = currentState?.goalAudio?.selectedClip || currentState?.goalAudio?.customUrl || '/assets/sounds/closs-cantalo.mp3';
    playLocalClip(clip);
    showMobileGoalToast(ctrlName2.textContent, parseInt(ctrlScore1.textContent) || 0, (parseInt(ctrlScore2.textContent) || 0) + 1);
    socket.emit('update_score', { team: 'team2', delta: 1 });
  });
  btnMinusGoal2.addEventListener('click', () => {
    haptic(30);
    socket.emit('update_score', { team: 'team2', delta: -1 });
  });
  btnZeroGoal2.addEventListener('click', () => {
    haptic(30);
    socket.emit('update_score', { team: 'team2', score: 0 });
  });

  // ACCIONES PENALES CON CONTROL DE TURNOS
  function handlePenaltyAction(team, action, reason = null) {
    if (action === 'undo') {
      socket.emit('quick_penalty_action', { team, action: 'undo' });
      return;
    }
    if (currentState && currentState.penalties) {
      const p = currentState.penalties;
      if (p.isFinished) {
        showPenaltyError(`La serie de penales ya finalizó. ¡${p.winnerName} es el ganador!`);
        return;
      }
    }
    // Enviar directamente al servidor; el servidor tiene la autoridad oficial y valida turnos
    socket.emit('quick_penalty_action', { team, action, reason });
  }

  btnTogglePenaltiesView.addEventListener('click', () => {
    haptic(40);
    const currentlyEnabled = !!(currentState && currentState.penalties && currentState.penalties.enabled);
    const nextVal = !currentlyEnabled;
    socket.emit('toggle_penalties_visibility', { enabled: nextVal });
  });

  // Sorteo de Penales (Quién patea primero)
  if (btnCoinTossTeam1) {
    btnCoinTossTeam1.addEventListener('click', () => {
      haptic(30);
      socket.emit('set_first_kicker', { team: 'team1' });
    });
  }
  if (btnCoinTossTeam2) {
    btnCoinTossTeam2.addEventListener('click', () => {
      haptic(30);
      socket.emit('set_first_kicker', { team: 'team2' });
    });
  }

  btnPenGoal1.addEventListener('click', () => {
    haptic(40);
    const clip = currentState?.goalAudio?.selectedClip || currentState?.goalAudio?.customUrl || '/assets/sounds/closs-cantalo.mp3';
    playLocalClip(clip);
    handlePenaltyAction('team1', 'scored');
  });
  btnPenMiss1.addEventListener('click', () => {
    haptic(40);
    handlePenaltyAction('team1', 'missed', 'wide');
  });
  if (btnPenPost1) {
    btnPenPost1.addEventListener('click', () => {
      haptic(40);
      handlePenaltyAction('team1', 'missed', 'post');
    });
  }
  btnPenUndo1.addEventListener('click', () => {
    haptic(30);
    handlePenaltyAction('team1', 'undo');
  });

  btnPenGoal2.addEventListener('click', () => {
    haptic(40);
    const clip = currentState?.goalAudio?.selectedClip || currentState?.goalAudio?.customUrl || '/assets/sounds/closs-cantalo.mp3';
    playLocalClip(clip);
    handlePenaltyAction('team2', 'scored');
  });
  btnPenMiss2.addEventListener('click', () => {
    haptic(40);
    handlePenaltyAction('team2', 'missed', 'wide');
  });
  if (btnPenPost2) {
    btnPenPost2.addEventListener('click', () => {
      haptic(40);
      handlePenaltyAction('team2', 'missed', 'post');
    });
  }
  btnPenUndo2.addEventListener('click', () => {
    haptic(30);
    handlePenaltyAction('team2', 'undo');
  });

  if (btnPenUndoGlobal) {
    btnPenUndoGlobal.addEventListener('click', () => {
      haptic(30);
      socket.emit('quick_penalty_action', { team: 'team1', action: 'undo' });
    });
  }

  // Selector de Tema / Clima Exterior
  if (themeButtons) {
    themeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        haptic(30);
        const theme = btn.dataset.theme;
        themeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        socket.emit('set_theme', { theme });
      });
    });
  }

  // Selector de Categorías de Sonido (Pestañas Pills)
  const soundCatPills = document.querySelectorAll('.sound-cat-pill');
  const soundCatPanels = document.querySelectorAll('.sound-cat-panel');

  if (soundCatPills.length > 0) {
    soundCatPills.forEach(pill => {
      pill.addEventListener('click', () => {
        haptic(25);
        const cat = pill.dataset.soundCat;
        soundCatPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        soundCatPanels.forEach(panel => {
          if (cat === 'goals' && panel.id === 'soundCatPanelGoals') panel.style.display = 'block';
          else if (cat === 'chants' && panel.id === 'soundCatPanelChants') panel.style.display = 'block';
          else if (cat === 'fx' && panel.id === 'soundCatPanelFx') panel.style.display = 'block';
          else panel.style.display = 'none';
        });
      });
    });
  }

  // Soundboard en Vivo (Disparar clips auténticos en directo en pantalla y celular)
  document.querySelectorAll('.btn-soundboard-clip').forEach(btn => {
    btn.addEventListener('click', () => {
      haptic(50);
      const clip = btn.dataset.clip;
      if (clip) {
        btn.classList.add('active');
        setTimeout(() => btn.classList.remove('active'), 400);
        playLocalClip(clip);
        socket.emit('play_sound_clip', { url: clip });
      }
    });
  });

  // Hinchada de Fondo Continua (Toggle Inmediato y Volumen)
  if (btnToggleCrowd) {
    btnToggleCrowd.addEventListener('click', () => {
      haptic(30);
      const isCurrentlyPlaying = currentState && currentState.crowdAmbiance && currentState.crowdAmbiance.isPlaying;
      const nextPlaying = !isCurrentlyPlaying;

      if (nextPlaying) {
        localCrowdAudio.volume = (currentState && currentState.crowdAmbiance && typeof currentState.crowdAmbiance.volume === 'number') ? currentState.crowdAmbiance.volume : 0.35;
        localCrowdAudio.play().catch(err => console.log('Reproducción en celular:', err));
      } else {
        localCrowdAudio.pause();
      }

      socket.emit('set_crowd_ambiance', {
        enabled: true,
        isPlaying: nextPlaying
      });
    });
  }

  if (rangeCrowdVolume) {
    rangeCrowdVolume.addEventListener('input', (e) => {
      const vol = parseInt(e.target.value, 10) / 100;
      if (crowdVolumeDisplay) crowdVolumeDisplay.textContent = `${e.target.value}%`;
      socket.emit('set_crowd_ambiance', { volume: vol });
    });
  }

  btnResetPenalties.addEventListener('click', () => {
    haptic(40);
    if (confirm('¿Reiniciar la tanda de penales a 0-0?')) {
      socket.emit('reset_penalties');
    }
  });

  // CRONÓMETRO
  btnTimerToggle.addEventListener('click', () => {
    haptic(40);
    socket.emit('timer_toggle');
  });

  btnResetTimer.addEventListener('click', () => {
    haptic(40);
    socket.emit('timer_reset');
  });

  btnPlusMinute.addEventListener('click', () => {
    haptic(30);
    socket.emit('timer_set', { seconds: currentSeconds + 60 });
  });

  btnMinusMinute.addEventListener('click', () => {
    haptic(30);
    socket.emit('timer_set', { seconds: Math.max(0, currentSeconds - 60) });
  });

  [btnJumpStart, btnJumpHalf, btnJumpEnd].forEach(btn => {
    btn.addEventListener('click', () => {
      haptic(30);
      const secs = parseInt(btn.dataset.setSec);
      socket.emit('timer_set', { seconds: secs });
    });
  });

  // PERIODOS
  periodButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      haptic(30);
      const p = btn.dataset.period;
      socket.emit('set_period', { period: p, autoSetTime: true });
    });
  });

  // TIEMPO EXTRA (+1 / -1 CONTROL DIRECTO)
  if (btnExtraMinus) {
    btnExtraMinus.addEventListener('click', () => {
      haptic(35);
      const nextVal = Math.max(0, currentExtraMinutes - 1);
      updateExtraButtons(nextVal);
      socket.emit('set_extra_time', { minutes: nextVal });
    });
  }

  if (btnExtraPlus) {
    btnExtraPlus.addEventListener('click', () => {
      haptic(35);
      const nextVal = Math.min(60, currentExtraMinutes + 1);
      updateExtraButtons(nextVal);
      socket.emit('set_extra_time', { minutes: nextVal });
    });
  }

  // TANDA DE PENALES (PLEGABLE EN EL CELULAR)
  if (btnTogglePenaltiesView) {
    btnTogglePenaltiesView.addEventListener('click', () => {
      haptic(35);
      setPenaltiesMobileExpansion(!isPenaltiesExpandedOnMobile);
    });
  }

  // SONIDOS
  btnSoundWhistleShort.addEventListener('click', () => {
    haptic(40);
    if (window.SoundEffects) window.SoundEffects.playWhistleShort();
    socket.emit('play_sound', { sound: 'whistle_short' });
  });

  btnSoundWhistleLong.addEventListener('click', () => {
    haptic(40);
    if (window.SoundEffects) window.SoundEffects.playWhistleLong();
    socket.emit('play_sound', { sound: 'whistle_long' });
  });

  btnSoundGoalHorn.addEventListener('click', () => {
    haptic(80);
    const selectedType = document.querySelector('input[name="goalAudioType"]:checked').value;
    socket.emit('goal_celebration', {
      teamKey: 'team1',
      teamName: ctrlName1.textContent,
      teamLogo: previewTeam1Logo.src,
      score1: parseInt(ctrlScore1.textContent) || 0,
      score2: parseInt(ctrlScore2.textContent) || 0,
      goalAudio: {
        type: selectedType,
        customUrl: uploadedCustomAudio || (currentState && currentState.goalAudio ? currentState.goalAudio.customUrl : null)
      }
    });
  });

  if (btnStopCurrentAudio) {
    btnStopCurrentAudio.addEventListener('click', () => {
      haptic(40);
      if (window.SoundEffects) {
        window.SoundEffects.stopAudio();
      }
      socket.emit('stop_sound_clip');
    });
  }

  // FINALIZAR PARTIDO OFICIAL Y GENERAR PLANILLAS EXCEL Y PDF
  if (btnFinishMatch) {
    btnFinishMatch.addEventListener('click', () => {
      haptic(60);
      const ok = confirm(
        "⚠️ ¿Confirmar finalización del partido?\n\n" +
        "Al presionar Aceptar:\n" +
        "• Se detendrá el cronómetro oficial en el tiempo actual.\n" +
        "• El periodo cambiará a 'Finalizado'.\n" +
        "• Se generará y guardará automáticamente el acta en PDF y planilla en Excel (.xlsx).\n" +
        "• Podrás descargar ambos archivos de inmediato en tu celular o PC."
      );
      if (ok) {
        socket.emit('finish_match');
      }
    });
  }

  if (btnModalCloseFinished) {
    btnModalCloseFinished.addEventListener('click', () => {
      if (modalMatchFinished) modalMatchFinished.style.display = 'none';
    });
  }

  if (btnModalResetMatch) {
    btnModalResetMatch.addEventListener('click', () => {
      if (confirm('¿Deseas reiniciar e iniciar un nuevo partido desde 0-0?')) {
        socket.emit('reset_match');
        if (modalMatchFinished) modalMatchFinished.style.display = 'none';
      }
    });
  }

  // Cargar Historial de Partidos Archivados
  async function loadHistory() {
    if (!matchHistoryList) return;
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      if (data && data.success && data.history && data.history.length > 0) {
        matchHistoryList.innerHTML = data.history.map(m => `
          <div class="history-item">
            <div class="history-item-top">
              <span class="history-item-tournament">${m.tournament || 'TORNEO'}</span>
              <span class="history-item-date">${m.dateFormatted || ''}</span>
            </div>
            <div class="history-item-matchup">
              <span>${m.team1.name}</span>
              <span class="history-item-scores">${m.team1.score} - ${m.team2.score}</span>
              <span>${m.team2.name}</span>
            </div>
            ${m.penalties && (m.penalties.enabled || m.penalties.score1 > 0 || m.penalties.score2 > 0) ? `
              <div style="font-size:0.75rem; color:#38bdf8; font-weight:700;">Penales: ${m.penalties.score1} - ${m.penalties.score2}</div>
            ` : ''}
            <div class="history-item-winner">
              ${m.winnerName ? (m.winnerName === 'Empate' ? '🤝 Empate' : `🏆 Ganador: ${m.winnerName}`) : ''}
            </div>
            <div class="history-item-downloads">
              <a href="${m.files.pdf}" target="_blank" download class="btn-history-dl pdf">📄 Descargar PDF</a>
              <a href="${m.files.xlsx}" target="_blank" download class="btn-history-dl xlsx">📊 Planilla Excel</a>
            </div>
          </div>
        `).join('');
      } else {
        matchHistoryList.innerHTML = '<div class="history-empty">No hay partidos finalizados aún. Al presionar "Terminar Partido", se guardarán aquí automáticamente.</div>';
      }
    } catch (e) {
      matchHistoryList.innerHTML = '<div class="history-empty">Error al cargar historial.</div>';
    }
  }

  if (btnRefreshHistory) {
    btnRefreshHistory.addEventListener('click', () => {
      haptic(30);
      loadHistory();
    });
  }

  if (tabBtnTeams) {
    tabBtnTeams.addEventListener('click', () => {
      loadHistory();
    });
  }

  // REINICIO COMPLETO
  btnResetAllMatch.addEventListener('click', () => {
    haptic(80);
    if (confirm('¿Estás seguro de reiniciar todo el partido a 0-0 y el reloj a 00:00?')) {
      socket.emit('reset_match');
    }
  });

  // DURACIÓN DEL PARTIDO
  durationPresetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      haptic(30);
      const mins = parseInt(btn.dataset.min);
      socket.emit('set_half_duration', { minutes: mins });
      updateJumpButtons(mins);
    });
  });

  btnApplyDuration.addEventListener('click', () => {
    haptic(30);
    const mins = parseInt(inputHalfDuration.value);
    if (mins && mins > 0) {
      socket.emit('set_half_duration', { minutes: mins });
      updateJumpButtons(mins);
      alert(`Duración fijada en ${mins} minutos por tiempo.`);
    }
  });

  // SUBIDA DE AUDIO REAL DE MARIANO CLOSS (MP3)
  btnTriggerAudioUpload.addEventListener('click', () => fileCustomAudio.click());

  fileCustomAudio.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      feedbackAudioUpload.textContent = 'Subiendo archivo de audio...';
      const formData = new FormData();
      formData.append('audio', file);

      try {
        const res = await fetch('/api/upload-audio', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success && data.url) {
          uploadedCustomAudio = data.url;
          audioRadioCustom.checked = true;
          customAudioNameDisplay.textContent = `Archivo: ${data.filename || file.name}`;
          feedbackAudioUpload.textContent = '✓ Audio de Mariano Closs cargado exitosamente. Sonará en cada gol.';

          socket.emit('set_goal_audio', {
            type: 'custom',
            customUrl: data.url,
            name: `Mariano Closs: ${data.filename || file.name}`
          });
        } else {
          feedbackAudioUpload.textContent = 'Error al subir el archivo de audio.';
        }
      } catch (err) {
        feedbackAudioUpload.textContent = 'Error de conexión.';
      }
    }
  });

  document.querySelectorAll('input[name="goalAudioType"]').forEach(r => {
    r.addEventListener('change', () => {
      const type = r.value;
      let url = null;
      let selectedClip = null;
      let name = 'Audio de Mariano Closs';

      if (type === 'closs_random') {
        url = '/assets/sounds/closs-cantalo.mp3';
        selectedClip = '/assets/sounds/closs-cantalo.mp3';
        name = 'Mariano Closs (Aleatorio - Variar Relatos)';
      } else if (type === 'closs_cantalo') {
        url = '/assets/sounds/closs-cantalo.mp3';
        selectedClip = '/assets/sounds/closs-cantalo.mp3';
        name = 'Mariano Closs: "¡Cántalo, cántalo, Gol!"';
      } else if (type === 'closs_benzema') {
        url = '/assets/sounds/mariano-closs-gol.mp3';
        selectedClip = '/assets/sounds/mariano-closs-gol.mp3';
        name = 'Mariano Closs: "¡Benzemaaa Gol!"';
      } else if (type === 'closs_messi') {
        url = '/assets/sounds/closs-gol-messi.mp3';
        selectedClip = '/assets/sounds/closs-gol-messi.mp3';
        name = 'Mariano Closs: "¡Messi lo hizo, Gol!"';
      } else if (type === 'closs_enzo') {
        url = '/assets/sounds/closs-gol-enzo.mp3';
        selectedClip = '/assets/sounds/closs-gol-enzo.mp3';
        name = 'Mariano Closs: "¡Golazo de Enzo Fernández!"';
      } else if (type === 'closs_ganar') {
        url = '/assets/sounds/closs-lo-va-a-ganar.mp3';
        selectedClip = '/assets/sounds/closs-lo-va-a-ganar.mp3';
        name = 'Mariano Closs: "¡Y lo va a ganar, Gol!"';
      } else if (type === 'horn') {
        url = null;
        selectedClip = null;
        name = 'Bocina de Estadio';
      } else {
        url = uploadedCustomAudio || (currentState && currentState.goalAudio ? currentState.goalAudio.customUrl : null);
        selectedClip = url;
        name = customAudioNameDisplay ? customAudioNameDisplay.textContent : 'Audio Personalizado';
      }

      socket.emit('set_goal_audio', {
        type: type.startsWith('closs') ? (type === 'closs_random' ? 'closs_random' : 'closs_fixed') : type,
        customUrl: url,
        selectedClip: selectedClip,
        name: name
      });
    });
  });

  // SUBIDA DE LOGOS
  btnTriggerUpload1.addEventListener('click', () => fileTeam1Logo.click());
  btnTriggerUpload2.addEventListener('click', () => fileTeam2Logo.click());

  async function uploadLogo(file, feedbackEl, previewEl) {
    if (!file) return null;
    feedbackEl.textContent = 'Subiendo escudo...';
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const res = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.url) {
        previewEl.src = data.url;
        feedbackEl.textContent = '✓ Escudo cargado correctamente';
        return data.url;
      } else {
        feedbackEl.textContent = 'Error al subir imagen';
      }
    } catch (e) {
      feedbackEl.textContent = 'Error de conexión';
    }
    return null;
  }

  fileTeam1Logo.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = await uploadLogo(file, feedbackTeam1, previewTeam1Logo);
      if (url) uploadedLogo1 = url;
    }
  });

  fileTeam2Logo.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = await uploadLogo(file, feedbackTeam2, previewTeam2Logo);
      if (url) uploadedLogo2 = url;
    }
  });

  // SUBIDA Y RESTAURACIÓN DE LOGO DEL TORNEO
  if (btnTriggerUploadTournament && fileTournamentLogo) {
    btnTriggerUploadTournament.addEventListener('click', () => fileTournamentLogo.click());

    fileTournamentLogo.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        const url = await uploadLogo(file, feedbackTournamentLogo, previewTournamentLogo);
        if (url) {
          uploadedTournamentLogo = url;
          if (miniTournamentLogo) miniTournamentLogo.src = url;
          socket.emit('update_teams', { tournamentLogo: url });
        }
      }
    });
  }

  if (btnResetTournamentLogo) {
    btnResetTournamentLogo.addEventListener('click', () => {
      haptic(30);
      uploadedTournamentLogo = '/assets/tournament-default.png';
      if (previewTournamentLogo) previewTournamentLogo.src = uploadedTournamentLogo;
      if (miniTournamentLogo) miniTournamentLogo.src = uploadedTournamentLogo;
      if (feedbackTournamentLogo) feedbackTournamentLogo.textContent = '✓ Restaurado logo predeterminado';
      socket.emit('update_teams', { tournamentLogo: uploadedTournamentLogo });
    });
  }

  // Selector de Color
  inputTeam1Color.addEventListener('input', (e) => {
    team1ColorLabel.textContent = e.target.value.toUpperCase();
  });
  inputTeam2Color.addEventListener('input', (e) => {
    team2ColorLabel.textContent = e.target.value.toUpperCase();
  });

  // CAMBIAR PIN
  btnChangePin.addEventListener('click', () => {
    const pinVal = inputNewPin.value.trim();
    if (pinVal.length >= 4) {
      socket.emit('set_pin', { pin: pinVal });
      feedbackPin.textContent = `✓ PIN actualizado a: ${pinVal}`;
      inputNewPin.value = '';
    } else {
      feedbackPin.textContent = 'El PIN debe tener al menos 4 caracteres.';
    }
  });

  // GUARDAR EQUIPOS Y CONFIGURACIÓN COMPLETA
  formTeamsConfig.addEventListener('submit', (e) => {
    e.preventDefault();
    haptic(50);

    const radioEl = document.querySelector('input[name="goalAudioType"]:checked');
    const selectedAudioType = radioEl ? radioEl.value : 'closs_random';
    let audioPayload = {
      type: 'closs_random',
      customUrl: '/assets/sounds/closs-cantalo.mp3',
      selectedClip: '/assets/sounds/closs-cantalo.mp3',
      name: 'Mariano Closs (Aleatorio - Variar Relatos)'
    };

    if (selectedAudioType === 'closs_cantalo') {
      audioPayload = { type: 'closs_fixed', customUrl: '/assets/sounds/closs-cantalo.mp3', selectedClip: '/assets/sounds/closs-cantalo.mp3', name: 'Mariano Closs: "¡Cántalo, cántalo, Gol!"' };
    } else if (selectedAudioType === 'closs_benzema') {
      audioPayload = { type: 'closs_fixed', customUrl: '/assets/sounds/mariano-closs-gol.mp3', selectedClip: '/assets/sounds/mariano-closs-gol.mp3', name: 'Mariano Closs: "¡Benzemaaa Gol!"' };
    } else if (selectedAudioType === 'closs_messi') {
      audioPayload = { type: 'closs_fixed', customUrl: '/assets/sounds/closs-gol-messi.mp3', selectedClip: '/assets/sounds/closs-gol-messi.mp3', name: 'Mariano Closs: "¡Messi lo hizo, Gol!"' };
    } else if (selectedAudioType === 'closs_enzo') {
      audioPayload = { type: 'closs_fixed', customUrl: '/assets/sounds/closs-gol-enzo.mp3', selectedClip: '/assets/sounds/closs-gol-enzo.mp3', name: 'Mariano Closs: "¡Golazo de Enzo Fernández!"' };
    } else if (selectedAudioType === 'closs_ganar') {
      audioPayload = { type: 'closs_fixed', customUrl: '/assets/sounds/closs-lo-va-a-ganar.mp3', selectedClip: '/assets/sounds/closs-lo-va-a-ganar.mp3', name: 'Mariano Closs: "¡Y lo va a ganar, Gol!"' };
    } else if (selectedAudioType === 'horn') {
      audioPayload = { type: 'horn', customUrl: null, selectedClip: null, name: 'Bocina de Estadio' };
    } else if (selectedAudioType === 'custom') {
      const url = uploadedCustomAudio || (currentState && currentState.goalAudio ? currentState.goalAudio.customUrl : null);
      audioPayload = { type: 'custom', customUrl: url, selectedClip: url, name: customAudioNameDisplay ? customAudioNameDisplay.textContent : 'Audio Personalizado' };
    }

    const updatedData = {
      tournament: inputTournament.value.trim() || 'TORNEO DE FÚTBOL',
      tournamentLogo: uploadedTournamentLogo || (currentState ? currentState.tournamentLogo : '/assets/tournament-default.png'),
      team1: {
        name: inputTeam1Name.value.trim() || 'LOCAL',
        shortName: (inputTeam1Name.value.trim() || 'LOC').substring(0, 3).toUpperCase(),
        color: inputTeam1Color.value
      },
      team2: {
        name: inputTeam2Name.value.trim() || 'VISITA',
        shortName: (inputTeam2Name.value.trim() || 'VIS').substring(0, 3).toUpperCase(),
        color: inputTeam2Color.value
      }
    };

    if (uploadedLogo1) updatedData.team1.logo = uploadedLogo1;
    if (uploadedLogo2) updatedData.team2.logo = uploadedLogo2;

    socket.emit('update_teams', updatedData);
    socket.emit('set_goal_audio', audioPayload);

    alert('¡Configuración guardada con éxito!');
    tabBtnLive.click();
  });
});
