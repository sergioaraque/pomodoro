# FocusNature 🌿 — Pomodoro App

Temporizador Pomodoro con temas naturales animados, login y sincronización en la nube con Supabase.

## Estructura del proyecto

```
focusnature/
├── server.js              
├── package.json
│
├── public/                 ← Frontend servido estáticamente
│   ├── index.html          ← HTML principal (sin lógica)
│   ├── styles.css          ← Todos los estilos y animaciones
│   └── src/js/
│       ├── app.js          ← Punto de entrada, conecta todos los módulos
│       ├── config.js       ← Configuración compartida (tiempos, etc.)
│       ├── timer.js        ← Lógica del cronómetro (bug de transición corregido)
│       ├── db.js           ← Capa de datos Supabase (auth, tasks, sessions)
│       ├── ui.js           ← Renderizado DOM y eventos
│       ├── sound.js        ← Notificaciones de audio
│       └── creatures.js    ← Animaciones de criaturas por tema
```

## Puesta en marcha

### 1. Instalar dependencias

```bash
npm install

npm start

npm run dev
```

## Temas disponibles

| Tema | Criaturas |
|------|-----------|
| 🌊 Mar | Peces, medusas, algas, burbujas |
| 🌿 Prado | Mariposas, abejas, flores |
| 🏔️ Montaña | Águilas, copos de nieve, pinos |
| 🌲 Bosque nocturno | Luciérnagas, búho, árboles |
