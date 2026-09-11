const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');

/**
 * Genera una planilla Excel estructurada del partido
 * @param {Object} match Datos completos del partido
 * @param {string} filePath Ruta absoluta de salida .xlsx
 */
function generateMatchExcel(match, filePath) {
  const wb = XLSX.utils.book_new();

  const minutesPlayed = Math.floor((match.timer ? match.timer.seconds : 0) / 60);
  const secondsPlayed = (match.timer ? match.timer.seconds : 0) % 60;

  const rows = [
    ['ACTA OFICIAL DE PARTIDO - REPORTE DE ENCUENTRO'],
    ['MARCADOR DIGITAL DE FÚTBOL EN TIEMPO REAL'],
    [],
    ['INFORMACIÓN GENERAL'],
    ['Torneo / Competencia:', match.tournament || 'IES NUEVO HORIZONTE'],
    ['Cancha / Pista de Juego:', (match.courtName || 'Cancha 1').toUpperCase()],
    ['Fecha y Hora de Finalización:', match.dateFormatted || new Date().toLocaleString('es-AR')],
    ['Estado del Encuentro:', 'FINALIZADO'],
    ['Tiempo de Juego Transcurrido:', `${minutesPlayed} min ${secondsPlayed} seg`],
    ['Tiempo Añadido (Extra Time):', `+${(match.timer && match.timer.extraTime) || 0} min`],
    ['Periodo Final:', (match.timer && match.timer.period) || 'Finalizado'],
    [],
    ['RESULTADO FINAL'],
    ['Equipo Local', 'Goles Local', 'Goles Visita', 'Equipo Visita', 'Resultado'],
    [
      match.team1.name,
      match.team1.score,
      match.team2.score,
      match.team2.name,
      match.winnerName ? `Ganador: ${match.winnerName}` : 'Empate'
    ],
    []
  ];

  // Si hubo penales o se configuraron
  const p = match.penalties;
  if (p && (p.enabled || p.score1 > 0 || p.score2 > 0 || p.winner)) {
    rows.push(['DEFINICIÓN POR TIROS PENALES (REGLAMENTO FIFA)']);
    rows.push(['Marcador de Penales:', `${p.score1} - ${p.score2}`]);
    rows.push(['Ganador por Penales:', p.winnerName || (p.winner ? match[p.winner].name : 'No definido')]);
    rows.push([]);
    rows.push(['Tiro Nro.', `Ejecución: ${match.team1.name}`, `Ejecución: ${match.team2.name}`]);

    const maxShots = Math.max(p.team1.length, p.team2.length);
    const translateState = (s) => {
      if (s === 'scored') return 'GOL (✓)';
      if (s === 'missed') return 'FALLÓ (✗)';
      return 'No ejecutado';
    };

    for (let i = 0; i < maxShots; i++) {
      rows.push([
        `Tiro ${i + 1}`,
        translateState(p.team1[i]),
        translateState(p.team2[i])
      ]);
    }
    rows.push([]);
  }

  // Sección de firmas
  rows.push(['PLANILLA OFICIAL DE FIRMAS Y VALIDEZ']);
  rows.push(['Firma Árbitro Principal:', '________________________________________']);
  rows.push([`Firma Capitán (${match.team1.name}):`, '________________________________________']);
  rows.push([`Firma Capitán (${match.team2.name}):`, '________________________________________']);
  rows.push([]);
  rows.push(['Generado automáticamente por el Sistema de Marcador de Fútbol Local']);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Ancho de columnas
  ws['!cols'] = [
    { wch: 30 },
    { wch: 26 },
    { wch: 26 },
    { wch: 26 },
    { wch: 28 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Acta Oficial');
  XLSX.writeFile(wb, filePath);
  return filePath;
}

/**
 * Genera un reporte PDF con diseño vectorial profesional
 * @param {Object} match Datos completos del partido
 * @param {string} filePath Ruta absoluta de salida .pdf
 */
function generateMatchPdf(match, filePath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const contentWidth = 515;

      // 1. Barra Superior del Torneo (Dark Navy Header)
      doc.rect(40, 40, contentWidth, 65).fill('#0f172a');
      
      // Acento de color
      doc.rect(40, 40, 6, 65).fill('#38bdf8');

      doc.fillColor('#fbbf24').fontSize(17).font('Helvetica-Bold')
         .text('ACTA OFICIAL DE PARTIDO', 58, 52);

      const tournamentAndCourt = `${match.tournament || 'IES NUEVO HORIZONTE'}${match.courtName ? ' • ' + match.courtName.toUpperCase() : ''}`;
      doc.fillColor('#94a3b8').fontSize(11).font('Helvetica')
         .text(tournamentAndCourt.toUpperCase(), 58, 76, { width: 330, ellipsis: true });

      doc.fillColor('#cbd5e1').fontSize(9).font('Helvetica')
         .text(match.dateFormatted || new Date().toLocaleString('es-AR'), 300, 64, { width: 245, align: 'right' });

      // Embed logo del torneo si es PNG o JPG raster
      if (match.tournamentLogo) {
        try {
          const relPath = match.tournamentLogo.startsWith('/') ? match.tournamentLogo.slice(1) : match.tournamentLogo;
          let logoDiskPath = path.join(__dirname, relPath);
          if (!fs.existsSync(logoDiskPath)) {
            logoDiskPath = path.join(__dirname, 'public', relPath);
          }
          const ext = path.extname(logoDiskPath).toLowerCase();
          if (fs.existsSync(logoDiskPath) && (ext === '.png' || ext === '.jpg' || ext === '.jpeg')) {
            doc.image(logoDiskPath, 495, 46, { fit: [48, 48], align: 'center', valign: 'center' });
          }
        } catch (e) {}
      }

      // 2. Placa Central de Marcador (Scoreboard Card)
      const scoreCardY = 125;
      doc.rect(40, scoreCardY, contentWidth, 110).fillAndStroke('#f8fafc', '#cbd5e1');

      // Nombre Local
      doc.fillColor('#0f172a').fontSize(15).font('Helvetica-Bold')
         .text(match.team1.name, 50, scoreCardY + 22, { width: 175, align: 'center' });

      // Goles Local
      doc.fillColor('#0284c7').fontSize(44).font('Helvetica-Bold')
         .text(String(match.team1.score), 50, scoreCardY + 45, { width: 175, align: 'center' });

      // Separador VS
      doc.fillColor('#64748b').fontSize(22).font('Helvetica-Bold')
         .text('VS', 245, scoreCardY + 40, { width: 65, align: 'center' });

      // Goles Visita
      doc.fillColor('#e11d48').fontSize(44).font('Helvetica-Bold')
         .text(String(match.team2.score), 330, scoreCardY + 45, { width: 175, align: 'center' });

      // Nombre Visita
      doc.fillColor('#0f172a').fontSize(15).font('Helvetica-Bold')
         .text(match.team2.name, 330, scoreCardY + 22, { width: 175, align: 'center' });

      // 3. Franja Inferior de Resultado y Ganador
      let winnerBannerText = 'RESULTADO: EMPATE';
      let bannerColor = '#475569';

      if (match.winnerName && match.winnerName !== 'Empate') {
        winnerBannerText = `🏆 GANADOR DEL ENCUENTRO: ${match.winnerName.toUpperCase()}`;
        bannerColor = '#0f172a';
      }

      doc.rect(40, scoreCardY + 110, contentWidth, 26).fill(bannerColor);
      doc.fillColor('#f8fafc').fontSize(11).font('Helvetica-Bold')
         .text(winnerBannerText, 40, scoreCardY + 117, { width: contentWidth, align: 'center' });

      // 4. Detalles del Encuentro
      let currentY = scoreCardY + 155;
      doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Detalles del Encuentro', 45, currentY);
      currentY += 18;

      const minutesPlayed = Math.floor((match.timer ? match.timer.seconds : 0) / 60);
      const secondsPlayed = (match.timer ? match.timer.seconds : 0) % 60;

      const details = [
        ['Cancha / Pista de Juego:', (match.courtName || 'Cancha 1').toUpperCase()],
        ['Estado:', 'FINALIZADO (Tiempo Reglamentario cumplido)'],
        ['Tiempo de Juego Transcurrido:', `${minutesPlayed} minutos y ${secondsPlayed} segundos`],
        ['Tiempo Añadido (Extra Time):', `+${(match.timer && match.timer.extraTime) || 0} minutos`],
        ['Periodo al momento de cierre:', (match.timer && match.timer.period) || 'Finalizado']
      ];

      doc.fontSize(9.5);
      details.forEach(([lbl, val]) => {
        doc.fillColor('#475569').font('Helvetica-Bold').text(lbl, 45, currentY, { width: 190 });
        doc.fillColor('#0f172a').font('Helvetica').text(val, 240, currentY, { width: 300 });
        currentY += 16;
      });

      // 5. Definición por Penales si aplica
      const p = match.penalties;
      if (p && (p.enabled || p.score1 > 0 || p.score2 > 0 || p.winner)) {
        currentY += 12;
        doc.rect(40, currentY, contentWidth, 24).fill('#0284c7');
        doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold')
           .text(`DEFINICIÓN POR TIROS PENALES (${p.score1} - ${p.score2})`, 48, currentY + 6);
        currentY += 28;

        if (p.winnerName) {
          doc.fillColor('#059669').fontSize(10).font('Helvetica-Bold')
             .text(`Equipo Ganador por Penales: ${p.winnerName}`, 48, currentY);
          currentY += 16;
        }

        // Tabla de ejecuciones
        const maxShots = Math.max(p.team1.length, p.team2.length);
        doc.rect(40, currentY, contentWidth, 18).fill('#e2e8f0');
        doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold');
        doc.text('Tiro #', 48, currentY + 4, { width: 70 });
        doc.text(match.team1.name, 130, currentY + 4, { width: 180 });
        doc.text(match.team2.name, 320, currentY + 4, { width: 180 });
        currentY += 18;

        const translateState = (s) => {
          if (s === 'scored') return 'GOL  [✓]';
          if (s === 'missed') return 'FALLÓ  [✗]';
          return '—';
        };

        for (let i = 0; i < maxShots; i++) {
          const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
          doc.rect(40, currentY, contentWidth, 16).fill(bg);

          doc.fillColor('#64748b').fontSize(9).font('Helvetica')
             .text(`Penal ${i + 1}`, 48, currentY + 3, { width: 70 });

          const s1 = p.team1[i];
          doc.fillColor(s1 === 'scored' ? '#16a34a' : (s1 === 'missed' ? '#dc2626' : '#94a3b8'))
             .font('Helvetica-Bold')
             .text(translateState(s1), 130, currentY + 3, { width: 180 });

          const s2 = p.team2[i];
          doc.fillColor(s2 === 'scored' ? '#16a34a' : (s2 === 'missed' ? '#dc2626' : '#94a3b8'))
             .font('Helvetica-Bold')
             .text(translateState(s2), 320, currentY + 3, { width: 180 });

          currentY += 16;
        }
      }

      // 6. Planilla de Firmas Oficiales
      const signY = 705;
      doc.rect(40, signY - 15, contentWidth, 1).fill('#cbd5e1');

      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold');

      // Árbitro
      doc.text('________________________________', 45, signY + 30, { width: 150, align: 'center' });
      doc.text('Firma Árbitro Principal', 45, signY + 45, { width: 150, align: 'center' });

      // Capitán 1
      doc.text('________________________________', 215, signY + 30, { width: 160, align: 'center' });
      doc.text(`Firma Capitán (${match.team1.name.substring(0, 16)})`, 215, signY + 45, { width: 160, align: 'center' });

      // Capitán 2
      doc.text('________________________________', 395, signY + 30, { width: 160, align: 'center' });
      doc.text(`Firma Capitán (${match.team2.name.substring(0, 16)})`, 395, signY + 45, { width: 160, align: 'center' });

      // 7. Pie de Página
      doc.fillColor('#94a3b8').fontSize(7.5).font('Helvetica')
         .text('Planilla oficial generada automáticamente por Marcador de Fútbol Digital • Sistema 100% Local y Privado', 40, 785, { width: contentWidth, align: 'center' });

      doc.end();
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateMatchExcel,
  generateMatchPdf
};
