/**
 * E2E orchestrator: builds the app, serves the production bundle with
 * `vite preview`, runs every suite against it and tears the server down.
 *
 * Usage: node tests/e2e/run.mjs [--skip-build] [--suite playthrough|responsive]
 */
import { spawn, spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..', '..')
const port = Number(process.env.PORT ?? 5199)
const baseUrl = `http://localhost:${port}`
const args = process.argv.slice(2)
const skipBuild = args.includes('--skip-build')
const suiteIndex = args.indexOf('--suite')
const only = suiteIndex >= 0 ? args[suiteIndex + 1] : null

const SUITES = ['playthrough', 'responsive'].filter((name) => !only || name === only)

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: 'inherit',
    ...options,
  })
  if (result.status !== 0) {
    throw new Error(`${command} ${commandArgs.join(' ')} exited with ${result.status}`)
  }
}

async function waitForServer(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      /* not ready yet */
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250))
  }
  throw new Error(`preview server did not answer on ${url}`)
}

if (!skipBuild) {
  console.log('> building production bundle')
  run('npm', ['run', 'build'])
}

console.log(`> starting preview on ${baseUrl}`)
const server = spawn('npm', ['run', 'preview', '--', '--port', String(port), '--strictPort'], {
  cwd: root,
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: true,
})

server.stdout.on('data', () => {})
server.stderr.on('data', (chunk) => process.stderr.write(chunk))

const shutdown = () => {
  if (server.pid === undefined) return
  try {
    process.kill(-server.pid, 'SIGTERM')
  } catch {
    /* already gone */
  }
}
process.on('exit', shutdown)
process.on('SIGINT', () => {
  shutdown()
  process.exit(130)
})

let failed = false
try {
  await waitForServer(baseUrl)
  for (const suite of SUITES) {
    console.log(`\n> running ${suite}`)
    try {
      run(process.execPath, [resolve(here, `${suite}.mjs`)], {
        env: { ...process.env, BASE_URL: baseUrl },
      })
    } catch (error) {
      failed = true
      console.error(String(error.message ?? error))
    }
  }
} finally {
  shutdown()
}

process.exit(failed ? 1 : 0)
