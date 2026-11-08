# ARCHIVO 001 — La Conexión Perdida

Experiencia web interactiva tipo escape room: ocho protocolos técnicos, ocho fragmentos y una
transmisión que solo se reconstruye al final.

> El contenido del mensaje final es privado. No publiques capturas de la pantalla de cierre ni el
> texto de `src/data/config.ts` en el README, en issues o en redes.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · Framer Motion · Lucide React · Zustand · LocalStorage.

## Requisitos

- Node.js 20 o superior
- npm 10 o superior

## Ejecutar en local

```bash
npm install
npm run dev
```

La aplicación queda en `http://localhost:5173`.

## Build de producción

```bash
npm run build
npm run preview
```

## Pruebas

```bash
npm test          # unitarias + partida completa en navegador
npm run test:unit # contratos de lógica, datos y persistencia (Node)
npm run test:e2e  # build + preview + Playwright
```

Las pruebas viven en `tests/` y no usan framework: un helper de aserciones por capa mantiene el
número de dependencias bajo. Detalle en [`tests/README.md`](tests/README.md).

- `tests/unit` recalcula las ocho respuestas **desde el contenido publicado** (Caesar, binario,
  compuertas, patrón, Morse, Polibio, Vigenère), verifica que la ruta mínima del grafo sea única
  (Dijkstra contra fuerza bruta) y cubre el saneamiento del estado persistido.
- `tests/e2e` juega la partida completa contra el build de producción: respuestas incorrectas,
  pistas, topología, ruta subóptima, persistencia tras recargar, animación de reconstrucción,
  revelación final y reinicio. Además comprueba que el mensaje no esté en el DOM antes de tiempo.

Requiere Google Chrome en `/usr/bin/google-chrome` (o `CHROME_PATH`).

## Estructura

```
src/
├── components/     piezas reutilizables (Terminal, StatusBar, ProgressBar, HintPanel…)
├── data/           puzzles.ts (los ocho protocolos) y config.ts (copy personal)
├── features/       mecanismos interactivos: grafo de red, compuertas, Polibio, Morse
├── lib/            funciones puras: validación y topología de red (Dijkstra)
├── screens/        una pantalla por fase del flujo
├── store/          estado de partida, persistencia y saneamiento
└── types.ts        Phase, PuzzleId, PuzzleDefinition, GameState

tests/
├── unit/           contratos de lógica, datos y persistencia
└── e2e/            partida completa y layout en navegador
```

Regla de dependencia: `screens → store → data/lib`. `lib` no importa React; solo el store toca
LocalStorage.

## Estado

| Fase | Estado |
|---|---|
| BOOT → ACCESS → BRIEFING → DASHBOARD | funcional |
| Protocolos 01, 02, 03, 04, 06, 07 y 08 | funcional, respuesta por texto validada |
| Protocolo 05 — NETWORK ROUTING | funcional, grafo interactivo con Dijkstra, costo acumulado y nodos rojos |
| Apoyos interactivos (tabla de verdad, matriz de Polibio, tabla Morse) | funcional |
| Pistas progresivas (3 niveles) | funcional |
| Persistencia y saneamiento del estado | funcional |
| DATA RECOVERY | drag & drop, botones de posición y validación de secuencia |
| Animación de reconstrucción y FINAL TRANSMISSION | funcional, revelación progresiva |
| Pruebas automatizadas (`npm test`) | 97 unitarias · 63 de partida completa · 29 de layout |
| Deploy en Vercel | pendiente de credenciales |

## Deploy en Vercel

El repositorio incluye `vercel.json` con el preset de Vite, el build y el output ya fijados.

```bash
npx vercel        # preview
npx vercel --prod # producción
```

1. Alternativa por dashboard: sube el repositorio a GitHub e impórtalo en Vercel.
2. Framework preset: **Vite**. Build command `npm run build`, output directory `dist`.
3. Sin variables de entorno: la partida vive completa en el cliente.

## Documentación

La fuente de verdad del proyecto vive en el vault de Obsidian, no en este repositorio:
`10_Projects/Archivo 001/` (spec, SDD, design y comentarios).
