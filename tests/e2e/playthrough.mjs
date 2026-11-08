/**
 * End-to-end functional playthrough against a production build.
 * Requires the preview server (see tests/e2e/run.mjs).
 */
import { chromium } from 'playwright-core'

const BASE = process.env.BASE_URL ?? 'http://localhost:5199'
const CHROME = process.env.CHROME_PATH ?? '/usr/bin/google-chrome'

const FRAGMENTS = ['ENTRE', 'MILLONES', 'DE', 'CONEXIONES', 'SIEMPRE', 'ELEGIRÍA', 'LA', 'NUESTRA']
const ANSWERS = ['entre', 'MILLONES', 'de', 'conexiones', 'siempre', 'elegiría', 'LA', 'nuestra']
const FINAL_MESSAGE = 'Entre millones de conexiones, siempre elegiría la nuestra'

const OPTIMAL = [
  ['S', 'I', 2],
  ['I', 'E1', 2],
  ['E1', 'M', 2],
  ['M', 'P', 2],
  ['P', 'R', 2],
  ['R', 'E2', 2],
  ['E2', 'FIN', 1],
]

const SUBOPTIMAL = [
  ['S', 'A', 1],
  ['A', 'M', 8],
  ['M', 'P', 2],
  ['P', 'D', 1],
  ['D', 'E2', 8],
  ['E2', 'FIN', 1],
]

let failures = 0
let total = 0

function check(name, condition) {
  total += 1
  if (condition) {
    console.log(`ok   ${name}`)
  } else {
    failures += 1
    console.log(`FAIL ${name}`)
  }
}

const bodyText = async (page) => (await page.locator('body').innerText()).replace(/\u00a0/g, ' ')
const has = (haystack, needle) => haystack.toLowerCase().includes(needle.toLowerCase())
const link = (page, from, to, cost) =>
  page.locator(`[aria-label="Enlace ${from} a ${to}, costo ${cost}"]`)

const walk = async (page, steps) => {
  for (const [from, to, cost] of steps) {
    await link(page, from, to, cost).click()
  }
}

const browser = await chromium.launch({ executablePath: CHROME })
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await context.newPage()

const errors = []
page.on('pageerror', (error) => errors.push(String(error)))
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text())
})

await page.goto(BASE, { waitUntil: 'networkidle' })

/* BOOT -------------------------------------------------------------------- */
await page.waitForSelector('text=TRANSMISSION NOT FOUND', { timeout: 15000 })
check('boot shows the SDD line', has(await bodyText(page), 'TRANSMISSION NOT FOUND'))
await page.getByRole('button', { name: /iniciar investigación/i }).click()

/* ACCESS ------------------------------------------------------------------ */
check('access has no code input', (await page.locator('input').count()) === 0)
check('access announces the anomaly', has(await bodyText(page), 'Ocho protocolos contienen'))
await page.getByRole('button', { name: /aceptar misión/i }).click()

/* BRIEFING ---------------------------------------------------------------- */
check('briefing lists the last protocol', has(await bodyText(page), 'VIGENERE CIPHER'))
check('briefing does not leak the final message', !has(await bodyText(page), FINAL_MESSAGE))
await page.getByRole('button', { name: /abrir dashboard/i }).click()

/* DASHBOARD --------------------------------------------------------------- */
const dash = await bodyText(page)
check('dashboard starts at 0/8', has(dash, '00 / 08'))
check('unsolved fragments are hidden', (dash.match(/—/g) ?? []).length >= 8)
check(
  'final transmission is disabled, not hidden',
  await page.getByRole('button', { name: /final transmission/i }).isDisabled(),
)
check('data recovery is disabled before 8/8', await page.getByRole('button', { name: /data recovery/i }).isDisabled())

/* PROTOCOL 01: text, hints, empty and wrong input ------------------------- */
await page.getByRole('button', { name: /continue protocol 01/i }).click()
const hintPanel = await bodyText(page)
check('hints start hidden', !has(hintPanel, 'H → E'))
check('the answer is not printed in the protocol body', !/\bENTRE\b/i.test(hintPanel))

const input = page.getByLabel('Response')
await input.fill('   ')
await page.getByRole('button', { name: /validar/i }).click()
check('empty input is not treated as wrong', has(await bodyText(page), 'Escribe una respuesta'))
await input.fill('incorrecta')
await page.getByRole('button', { name: /validar/i }).click()
check('wrong answer is rejected', has(await bodyText(page), 'Respuesta incorrecta'))
check('the protocol stays open after a wrong answer', (await page.getByLabel('Response').count()) === 1)

await page.getByRole('button', { name: /^request$/i }).click()
await page.getByRole('button', { name: /^request$/i }).click()
await page.getByRole('button', { name: /^request$/i }).click()
const hinted = await bodyText(page)
check('level 1 hint is revealed on request', has(hinted, 'cifrado de sustitución'))
check('level 3 hint reveals the mechanism', has(hinted, 'H → E, Q → N, W → T'))
check('hint levels are marked as consumed', (hinted.match(/CONSUMED/gi) ?? []).length === 3)
check('there is no fourth hint button', (await page.getByRole('button', { name: /^request$/i }).count()) === 0)

await input.fill(ANSWERS[0])
await page.getByRole('button', { name: /validar/i }).click()
check('protocol 01 accepts its answer', has(await bodyText(page), FRAGMENTS[0]))
await page.getByRole('button', { name: /volver al dashboard/i }).click()

/* PROTOCOL 02 ------------------------------------------------------------- */
await page.getByRole('button', { name: /continue protocol 02/i }).click()
await page.getByLabel('Response').fill(ANSWERS[1])
await page.getByRole('button', { name: /validar/i }).click()
check('protocol 02 accepts its answer', has(await bodyText(page), FRAGMENTS[1]))
await page.getByRole('button', { name: /volver al dashboard/i }).click()

/* PROTOCOL 03: logic gate reference --------------------------------------- */
await page.getByRole('button', { name: /continue protocol 03/i }).click()
check('logic gates render the truth-table reference', has(await bodyText(page), 'Tabla de verdad'))
await page.getByLabel('Response').fill(ANSWERS[2])
await page.getByRole('button', { name: /validar/i }).click()
check('protocol 03 accepts its answer', has(await bodyText(page), FRAGMENTS[2]))
await page.getByRole('button', { name: /volver al dashboard/i }).click()

/* PERSISTENCE MID GAME ---------------------------------------------------- */
await page.reload({ waitUntil: 'networkidle' })
const resumed = await bodyText(page)
check('progress survives a reload', has(resumed, '03 / 08'))
check('solved fragments survive a reload', has(resumed, FRAGMENTS[0]) && has(resumed, FRAGMENTS[2]))
check(
  'the next protocol is the fourth one',
  (await page.getByRole('button', { name: /continue protocol 04/i }).count()) === 1,
)

/* PROTOCOL 04 ------------------------------------------------------------- */
await page.getByRole('button', { name: /continue protocol 04/i }).click()
await page.getByLabel('Response').fill(ANSWERS[3])
await page.getByRole('button', { name: /validar/i }).click()
check('protocol 04 accepts its answer', has(await bodyText(page), FRAGMENTS[3]))
await page.getByRole('button', { name: /volver al dashboard/i }).click()

/* PROTOCOL 05: topology only ---------------------------------------------- */
await page.getByRole('button', { name: /continue protocol 05/i }).click()
check('routing has no response field', (await page.getByLabel('Response').count()) === 0)
check('routing marks three red nodes', (await page.locator('svg circle[fill="#ef4444"]').count()) === 3)
check(
  'routing labels the red nodes R, E2 and D',
  (await page.locator('svg text', { hasText: /^R$/ }).count()) >= 1 &&
    (await page.locator('svg text', { hasText: /^E2$/ }).count()) >= 1 &&
    (await page.locator('svg text', { hasText: /^D$/ }).count()) >= 1,
)

await walk(page, SUBOPTIMAL)
check('suboptimal route accumulates cost 21', has(await bodyText(page), '21'))
await page.getByRole('button', { name: /confirmar ruta/i }).click()
check('suboptimal route is rejected', has(await bodyText(page), 'Existe una ruta de menor costo'))

await page.getByRole('button', { name: /^reiniciar$/i }).click()
check('route reset returns to S', !has(await bodyText(page), 'S → I'))

await walk(page, OPTIMAL)
check('optimal route accumulates cost 13', has(await bodyText(page), '13'))
await page.getByRole('button', { name: /confirmar ruta/i }).click()
check('optimal route recovers the fragment', has(await bodyText(page), FRAGMENTS[4]))
await page.getByRole('button', { name: /volver al dashboard/i }).click()

/* PROTOCOL 06: morse reference -------------------------------------------- */
await page.getByRole('button', { name: /continue protocol 06/i }).click()
check('morse reference table is available', has(await bodyText(page), 'Tabla Morse de consulta'))
await page.getByLabel('Response').fill(ANSWERS[5])
await page.getByRole('button', { name: /validar/i }).click()
check('protocol 06 accepts its answer', has(await bodyText(page), FRAGMENTS[5]))
await page.getByRole('button', { name: /volver al dashboard/i }).click()

/* PROTOCOL 07: polybius selection ----------------------------------------- */
await page.getByRole('button', { name: /continue protocol 07/i }).click()
await page.getByRole('button', { name: 'Letra L, fila 3, columna 1' }).click()
await page.getByRole('button', { name: 'Letra A, fila 1, columna 1' }).click()
check('polybius selection builds LA', has(await bodyText(page), 'Selección: LA'))
await page.getByRole('button', { name: /usar selección/i }).click()
check(
  'polybius selection fills the response',
  (await page.getByLabel('Response').inputValue()) === 'LA',
)
await page.getByRole('button', { name: /validar/i }).click()
check('protocol 07 accepts its answer', has(await bodyText(page), FRAGMENTS[6]))
await page.getByRole('button', { name: /volver al dashboard/i }).click()

/* PROTOCOL 08: recovered red nodes and key --------------------------------- */
await page.getByRole('button', { name: /continue protocol 08/i }).click()
const vigenere = await bodyText(page)
check('protocol 08 shows the three recovered nodes', has(vigenere, 'Nodos recuperados'))
check('protocol 08 shows the recovered key', has(vigenere, 'Clave') && has(vigenere, 'RED'))
await page.getByLabel('Response').fill(ANSWERS[7])
await page.getByRole('button', { name: /validar/i }).click()
check('protocol 08 accepts its answer', has(await bodyText(page), FRAGMENTS[7]))
await page.getByRole('button', { name: /volver al dashboard/i }).click()

/* DASHBOARD 8/8 ----------------------------------------------------------- */
const complete = await bodyText(page)
check('dashboard reports 8/8', has(complete, '08 / 08'))
check('all eight fragments are recovered', FRAGMENTS.every((word) => has(complete, word)))
check('the final message is still hidden', !has(complete, FINAL_MESSAGE))
check('data recovery unlocks at 8/8', await page.getByRole('button', { name: /data recovery/i }).isEnabled())
check(
  'final transmission stays disabled until the message is rebuilt',
  await page.getByRole('button', { name: /final transmission/i }).isDisabled(),
)

/* DATA RECOVERY ----------------------------------------------------------- */
await page.getByRole('button', { name: /^data recovery$/i }).click()
check('recovery asks to rebuild the transmission', has(await bodyText(page), 'Reconstruir la transmisión'))
check('the final message is not in the recovery screen', !has(await bodyText(page), FINAL_MESSAGE))
await page.getByRole('button', { name: /confirmar secuencia/i }).click()
check('a wrong order is rejected', has(await bodyText(page), 'Secuencia incorrecta'))
check('the final message is still hidden after a wrong order', !has(await bodyText(page), FINAL_MESSAGE))

for (let target = 0; target < FRAGMENTS.length; target += 1) {
  for (let guard = 0; guard < 8; guard += 1) {
    const labels = await page
      .getByRole('button', { name: /^Subir / })
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-label')))
    const position = labels.indexOf(`Subir ${FRAGMENTS[target]}`)
    if (position <= target) break
    await page.getByRole('button', { name: `Subir ${FRAGMENTS[target]}` }).click()
  }
}
check('eight fragments are listed', (await page.getByRole('listitem').count()) === 8)
check('the final message is not visible while ordering', !has(await bodyText(page), FINAL_MESSAGE))

await page.getByRole('button', { name: /confirmar secuencia/i }).click()
check('the reconstruction animation starts', has(await bodyText(page), 'Reconstructing transmission'))

/* FINAL ------------------------------------------------------------------- */
await page.waitForSelector('text=TRANSMISSION RESTORED', { timeout: 20000 })
const final = await bodyText(page)
check('the final message is revealed', has(final, FINAL_MESSAGE))
check('the closing message is shown', has(final, 'vale la pena conservar'))
check('the archive closes', has(final, 'END OF ARCHIVE 001'))

await page.reload({ waitUntil: 'networkidle' })
check('the final screen survives a reload', has(await bodyText(page), 'TRANSMISSION RESTORED'))

/* RESET ------------------------------------------------------------------- */
await page.getByRole('button', { name: /reiniciar partida/i }).click()
check('the reset dialog opens', (await page.getByRole('dialog').count()) === 1)
await page.getByRole('button', { name: /^cancelar$/i }).click()
check('cancelling keeps the final screen', has(await bodyText(page), 'TRANSMISSION RESTORED'))

await page.getByRole('button', { name: /reiniciar partida/i }).click()
await page.getByRole('button', { name: /^reiniciar$/i }).click()
await page.waitForSelector('text=TRANSMISSION NOT FOUND', { timeout: 15000 })
check('confirming the reset returns to boot', has(await bodyText(page), 'TRANSMISSION NOT FOUND'))
await page.reload({ waitUntil: 'networkidle' })
await page.waitForSelector('text=TRANSMISSION NOT FOUND', { timeout: 15000 })
check('the reset survives a reload', has(await bodyText(page), 'TRANSMISSION NOT FOUND'))

check('no console or page errors', errors.length === 0)
if (errors.length > 0) console.log(errors.join('\n'))

await browser.close()
console.log(failures === 0 ? `\nALL PASS (${total} checks)` : `\n${failures} FAILURE(S)`)
process.exit(failures === 0 ? 0 : 1)
