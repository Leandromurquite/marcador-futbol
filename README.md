# ⚽ Marcador de Fútbol en Tiempo Real (PC/TV + Control Remoto Móvil)

Sistema web profesional para transmisión y control de marcadores de fútbol en tiempo real. Diseñado para proyectar en monitores, televisores o pantallas LED en canchas deportivas y operarlo de forma privada y segura desde cualquier teléfono celular (iPhone / Android) vía Wi-Fi o Hotspot móvil.

---

## 📋 Características Principales

- 📱 **Control Remoto Móvil Privado**: Maneja goles, reloj, periodos, penales y sonidos desde el celular sin que los espectadores vean el panel de control ni las direcciones IP.
- 🔒 **Seguridad con PIN**: Pantalla de bloqueo con teclado numérico para que solo los árbitros o administradores autorizados puedan controlar el partido.
- 🎙️ **Narraciones Reales de Mariano Closs (100% Locales, Sin IA - Exclusivamente Goles)**:
  - Rotación aleatoria de relatos auténticos de gol (*"¡Cántalo, cántalo, Gol!"*, *"¡Messi lo hizo, Gol!"*, *"¡Golazo de Enzo Fernández!"*, *"¡Y lo va a ganar!"*, *"¡Benzemaaa Gol!"*).
  - Soundboard en vivo en el celular para lanzar los 5 gritos de gol en cualquier momento.
- 🏟️ **Ambiente de Hinchada en Vivo (Marcador y Celular)**:
  - Sonido ambiental de estadio con cantos y aliento continuo que puedes encender o pausar en cualquier momento, o sincronizar automáticamente con el cronómetro de juego.
  - Suena en vivo tanto en la pantalla del marcador como en el altavoz del celular del operador.
  - Control de volumen (0% a 100%) y botón de encendido/pausa inmediato.
- 🎺 **Botonera de Cánticos de Hinchada en Vivo**:
  - Lanzamiento instantáneo de cánticos populares de cancha: *"¡Jugadores, la concha de su madre, a ver si ponen huevos que no juegan con nadie!"*, *"¡Muchachos, ahora nos volvimos a ilusionar!"*, *"¡Esta es la banda loca de la Argentina!"*, *"¡Dale, dale Bo!"* y ovaciones de tribuna (reproducibles al instante desde el celular y en la pantalla).
- 🌤️ **6 Fondos Climáticos para Canchas al Aire Libre**:
  - 🌙 **Noche**: Iluminación de estadio clásico.
  - ☀️ **Soleado**: Alta luminosidad y contraste para evitar el lavado por luz solar.
  - ⛅ **Nublado**: Tonalidades mate antirreflejo.
  - 🌅 **Atardecer**: Atmósfera crepuscular dorada.
  - 🌱 **Césped**: Textura de pasto deportivo y líneas de cancha.
  - ⚡ **Alto Contraste Solar**: Fondo 100% negro puro con dígitos LED amarillo neón y verde eléctrico para máxima legibilidad bajo sol directo a mediodía.
- ⚽ **Único Tablero de Penales Oficial FIFA (Ubicado Debajo del Marcador)**:
  - Panel oficial de transmisión broadcast con 5 tiros numerados para cada equipo ubicado estratégicamente debajo de las placas de goles y nombres (sin marcadores duplicados).
  - Control de turnos alternos estrictos (bloquea tiros fuera de turno con aviso sonoro y toast).
  - Sorteo inicial de quién patea primero.
  - Detección matemática de ganador antes del 5to tiro si ya no hay alcance posible.
  - Muerte súbita automática en caso de empate a 5.
- ⏱️ **Cronómetro de 12 Minutos Oficial y Adaptable**:
  - Configurado a **12 minutos por tiempo** (Oficial para torneos de cancha / Fútbol 5), con saltos rápidos a 00:00 (1T), 12:00 (2T) y 24:00 (Fin).
  - Presets de cambio rápido a 15, 20, 25, 30 o 45 minutos o minutos libres personalizados.
- 🏁 **Terminar Partido y Generación de Reportes Oficiales (PDF y Excel .xlsx)**:
  - Al pulsar el botón dedicado **🏁 Terminar Partido**, se detiene el reloj y se generan al instante las actas oficiales del encuentro.
  - **Planilla Excel (.xlsx)**: Hoja estructurada con datos del torneo, fecha, resultado final, duración, desglose tiro por tiro de penales y firmas oficiales.
  - **Acta PDF Oficial**: Vectorial con diseño de alta calidad listo para imprimir o enviar por WhatsApp/correo, con placa de resultado, detalle y firmas de árbitro y capitanes.
  - **Descarga Inmediata**: Botones de descarga directa en el celular del árbitro y en la pantalla principal.
  - **Historial Completo**: Registro histórico persistente en el servidor para consultar y descargar actas de partidos anteriores en cualquier momento.
- 📷 **Personalización Total**: Carga escudos, nombres y colores de ambos clubes directamente desde el celular o la computadora.

---

## 📱 Guía Técnica: Cómo Ejecutar y Conectar desde el Celular

Para usar tu celular como control remoto del marcador, sigue estos sencillos pasos:

### 1. Requisito de Red
Tanto la **computadora (marcador)** como el **celular (control remoto)** deben estar conectados a la **misma red**:
- La misma red **Wi-Fi** del club, casa o cancha.
- **O bien, Zona Wi-Fi portátil / Compartir Datos (Hotspot)**: Si estás en una cancha sin Wi-Fi, activa la *Zona Wi-Fi* de tu celular y conecta la computadora a ella.

### 2. Iniciar el Servidor en la Computadora

Abre la terminal (PowerShell, CMD o Git Bash) en la carpeta del proyecto y ejecuta el comando principal:

```bash
node server.js
```

*(O si prefieres npm: `npm.cmd start` o `npm start`)*
La consola mostrará una salida como esta:
`	ext
======================================================
       ⚽ MARCADOR DE FÚTBOL EN TIEMPO REAL ⚽        
======================================================
💻 PANTALLA DEL MARCADOR (PC/TV): http://localhost:3000
📱 CONTROL REMOTO PRIVADO:        http://192.168.1.50:3000/control
🔑 PIN DE ACCESO CELULAR:         1234
======================================================
`

### 3. Abrir el Control en el Celular
Hay dos formas fáciles:

1. **Escaneando el Código QR**:
   - En la computadora, pulsa la tecla **Q** en el teclado (o haz triple clic en el título del torneo). Aparecerá el código QR en pantalla.
   - Apunta la cámara de tu celular al código QR y ábrelo en tu navegador móvil (Chrome, Safari, etc.).
2. **Escribiendo la dirección IP**:
   - Abre el navegador de tu celular y escribe la dirección que apareció en la consola, por ejemplo:
     http://192.168.1.50:3000/control (reemplaza con la IP que muestre tu terminal).

### 4. Desbloqueo por PIN de Seguridad
1. Al ingresar en el celular, verás la pantalla de bloqueo de árbitro.
2. Ingresa el PIN por defecto: **1234**.
3. ¡Listo! Ya tienes el control total del marcador en la palma de tu mano.

> 🔒 **Cambiar el PIN**: Puedes cambiar el PIN en cualquier momento desde la pestaña **Configuración** en el control remoto.

---

## 🛠️ Solución de Problemas de Conexión en el Celular

Si el navegador del celular dice *"No se puede conectar"* o *"Página no disponible"*:

1. **Verificar que ambos estén en la misma red Wi-Fi**:
   - Si la computadora está en red 5GHz y el celular en 2.4GHz del mismo router, usualmente funciona, pero algunas configuraciones aíslan dispositivos. Conéctalos a la misma banda.
2. **Permitir Node.js en el Firewall de Windows**:
   - Abre la ventana de búsqueda de Windows y escribe *Permitir una aplicación a través del Firewall de Windows*.
   - Busca Node.js JavaScript Runtime y asegúrate de que las casillas **Privada** y **Pública** estén marcadas.
   - O abre PowerShell como Administrador y ejecuta:
     `powershell
     New-NetFirewallRule -DisplayName "Marcador Futbol Port 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
     `

---

## 🏗️ Arquitectura y Tecnologías

- **Backend**: [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)
- **Comunicación en Tiempo Real**: [Socket.io](https://socket.io/) (WebSockets bidireccionales con sincronización inferior a 10ms)
- **Frontend Marcador y Control**: HTML5 semántico, CSS3 moderno con variables CSS y Flexbox/Grid, JavaScript Vanilla ES6+ (sin frameworks pesados para garantizar carga instantánea en cualquier celular).
- **Audio Engine**: Integración con Web Audio API y reproductor HTML5 de clips MP3 auténticos almacenados localmente.
- **Códigos QR Dinámicos**: Generación automática con biblioteca `qrcode`.
- **Motor de Reportes Excel y PDF**: Generación 100% local con `xlsx` (SheetJS) y `pdfkit` (documentos vectoriales profesionales sin dependencias externas ni nube).

---

## 📦 Instalación y Configuración Inicial

Si descargas o clonas el proyecto en otra computadora:

`ash
# 1. Clonar el repositorio
git clone https://github.com/Leandromurquite/marcador-futbol.git
cd marcador-futbol

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor
node server.js
`

---

## ⌨️ Atajos de Teclado en la Pantalla del Marcador

| Tecla | Acción |
| :---: | :--- |
| Q | Mostrar / Ocultar Código QR de acceso privado para celulares |
| F11 | Pantalla Completa (Full Screen para TV o proyector) |

---

## 📄 Licencia

Este proyecto es de código abierto bajo la licencia MIT.
