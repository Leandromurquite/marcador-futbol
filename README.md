# ⚽ Marcador de Fútbol en Tiempo Real (Local + Control Remoto Móvil)

Sistema profesional de marcador de fútbol para proyectar en pantallas, televisores o monitores y controlarlo de manera remota y segura desde cualquier teléfono celular (iPhone / Android) sin que el público vea los enlaces ni pueda modificar nada.

---

## 🚀 Cómo iniciar el marcador

### Opción 1: Un solo clic (Recomendado en Windows)
Haz doble clic sobre el archivo **`iniciar-marcador.bat`**.
Se abrirá automáticamente el marcador en tu navegador y mostrará el código QR privado y tu PIN en la consola.

### Opción 2: Desde la terminal
```bash
cd c:\Users\murqu\Downloads\marcador-futbol
node server.js
```

---

## 🔒 Privacidad y Acceso Seguro del Celular

1. **Pantalla Pública Limpia**: El enlace y código QR fueron retirados de la vista pública en la pantalla del marcador. El público no verá ninguna dirección IP.
2. **Acceso Privado para el Árbitro/Admin**:
   - Escanea el código QR que se muestra en la **consola negra de tu PC** al arrancar.
   - O presiona la tecla **`Q`** en el teclado de tu computadora para ver el QR privado temporalmente.
3. **Bloqueo por PIN de Seguridad**:
   - Al entrar al enlace desde el celular (`http://<tu-ip>:3000/control`), se solicitará un PIN.
   - El PIN por defecto es: **`1234`**.
   - Puedes cambiarlo en cualquier momento desde la pestaña *Configuración* en tu celular.

---

## 🌟 Nuevas Funcionalidades Incluidas

- 🎙️ **Audio de Gol estilo Mariano Closs**: Relato apasionado y enérgico (*"¡Cántalo, cántalo, cántalo, GOOOOL!"*) al anotar cada gol, combinado con ovación y bocina de estadio.
- 📁 **Sube tu propio MP3 de gol**: En la pestaña *Configuración* del celular o PC, puedes subir cualquier archivo de audio grabado o descargado para que suene exactamente como tú quieras.
- ⏱️ **Duración de Partido Configurable**: Ajusta cuántos minutos dura cada tiempo (15 min para Fútbol 5, 20 min, 25 min para Fútbol 7, 30 min para Fútbol 8, 45 min para Fútbol 11, o cualquier número personalizado). Los botones de salto de tiempo se adaptan automáticamente.
- ⚽ **Tanda de Penales (5 Bolitas por Equipo)**:
  - En la pantalla grande de TV aparecen 5 bolitas LED debajo de cada equipo: ⚪ Pendiente, 🟢 Gol (verde con tilde), 🔴 Falló (roja con X).
  - En el celular puedes marcar goles y fallos con un toque, o tocar directamente cualquiera de las 5 bolitas para cambiar su estado.
  - Soporte de muerte súbita (agrega más bolitas automáticamente si empatan los 5 primeros tiros).
