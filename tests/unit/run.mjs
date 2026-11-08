/**
 * Bundles the TypeScript unit checks with esbuild (the app itself is bundled by
 * Vite, which does not expose a Node-friendly loader) and runs them.
 */
import { build } from 'esbuild'
import { mkdir, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const outfile = resolve(here, '..', '.build', 'unit.mjs')

await mkdir(dirname(outfile), { recursive: true })
await rm(outfile, { force: true })

// The store is browser-first: give Node a localStorage so the persist
// middleware runs exactly as it does in the browser instead of warning.
const memory = new Map()
globalThis.window = {
  localStorage: {
    getItem: (key) => (memory.has(key) ? memory.get(key) : null),
    setItem: (key, value) => memory.set(key, String(value)),
    removeItem: (key) => memory.delete(key),
    clear: () => memory.clear(),
    key: (index) => [...memory.keys()][index] ?? null,
    get length() {
      return memory.size
    },
  },
}

await build({
  entryPoints: [resolve(here, 'index.ts')],
  outfile,
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  logLevel: 'warning',
})

await import(pathToFileURL(outfile).href)
