/**
 * Layout checks across the target viewports: no page-level horizontal
 * overflow, readable inputs (>=16px prevents iOS focus zoom) and the routing
 * topology scrolls inside its own panel instead of pushing the page.
 */
import { chromium } from 'playwright-core'

const BASE = process.env.BASE_URL ?? 'http://localhost:5199'
const CHROME = process.env.CHROME_PATH ?? '/usr/bin/google-chrome'

const VIEWPORTS = [
  { name: 'phone 390', width: 390, height: 844 },
  { name: 'tablet 768', width: 768, height: 1024 },
  { name: 'laptop 1024', width: 1024, height: 768 },
  { name: 'desktop 1280', width: 1280, height: 900 },
]

const PUZZLE_IDS = [
  'caesar',
  'binary',
  'logic-gates',
  'pattern',
  'routing',
  'morse',
  'polybius',
  'vigenere',
]

const seeded = (solvedCount, phase = 'dashboard') => ({
  state: {
    version: 1,
    phase,
    startedAt: '2026-11-06T00:00:00.000Z',
    solved: PUZZLE_IDS.slice(0, solvedCount),
    hintsUsed: Object.fromEntries(PUZZLE_IDS.map((id) => [id, 0])),
    keyRed: solvedCount > 4 ? 'RED' : null,
    finalOrder: null,
    finalRevealed: false,
  },
  version: 1,
})

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

const browser = await chromium.launch({ executablePath: CHROME })

for (const viewport of VIEWPORTS) {
  const context = await browser.newContext({ viewport })
  const page = await context.newPage()

  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForSelector('text=TRANSMISSION NOT FOUND', { timeout: 15000 })

  const overflow = async (label) => {
    const metrics = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      inner: window.innerWidth,
    }))
    check(`${viewport.name} · ${label} has no horizontal overflow`, metrics.scroll <= metrics.inner + 1)
  }

  await overflow('boot')

  await page.getByRole('button', { name: /iniciar investigación/i }).click()
  await overflow('access')

  await page.getByRole('button', { name: /aceptar misión/i }).click()
  await overflow('briefing')

  await page.getByRole('button', { name: /abrir dashboard/i }).click()
  await overflow('dashboard')

  await page.getByRole('button', { name: /continue protocol 01/i }).click()
  await overflow('protocol 01')

  if (viewport.width < 640) {
    const fontSize = await page
      .getByLabel('Response')
      .evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))
    check(
      `${viewport.name} · the response field is at least 16px (${fontSize}px)`,
      fontSize >= 16,
    )
  }

  await page.getByLabel('Response').focus()
  const focusedOverflow = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    inner: window.innerWidth,
  }))
  check(
    `${viewport.name} · focusing the response field does not widen the page`,
    focusedOverflow.scroll <= focusedOverflow.inner + 1,
  )

  await context.close()
}

/* Routing topology: it is allowed to scroll inside its panel, never the page. */
for (const viewport of [{ name: 'phone 390', width: 390, height: 844 }, { name: 'desktop 1280', width: 1280, height: 900 }]) {
  const context = await browser.newContext({ viewport })
  await context.addInitScript((state) => {
    window.localStorage.setItem('archivo-001:state:v1', JSON.stringify(state))
  }, seeded(4))
  const page = await context.newPage()
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /continue protocol 05/i }).click()

  const metrics = await page.evaluate(() => {
    const scroller = [...document.querySelectorAll('div')].find((element) => {
      const style = getComputedStyle(element)
      return style.overflowX === 'auto' && element.querySelector('svg')
    })
    return {
      pageScroll: document.documentElement.scrollWidth,
      inner: window.innerWidth,
      graphScrolls: scroller ? scroller.scrollWidth > scroller.clientWidth : false,
    }
  })

  check(`${viewport.name} · routing does not widen the page`, metrics.pageScroll <= metrics.inner + 1)
  if (viewport.width < 640) {
    check(`${viewport.name} · the topology scrolls inside its panel`, metrics.graphScrolls)
  }

  await context.close()
}

/* Final screen: the longest copy must still fit. */
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await context.addInitScript((state) => {
    window.localStorage.setItem('archivo-001:state:v1', JSON.stringify(state))
  }, {
    state: {
      version: 1,
      phase: 'final',
      startedAt: '2026-11-06T00:00:00.000Z',
      solved: PUZZLE_IDS,
      hintsUsed: Object.fromEntries(PUZZLE_IDS.map((id) => [id, 0])),
      keyRed: 'RED',
      finalOrder: PUZZLE_IDS,
      finalRevealed: true,
    },
    version: 1,
  })
  const page = await context.newPage()
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForSelector('text=TRANSMISSION RESTORED', { timeout: 15000 })
  const metrics = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    inner: window.innerWidth,
  }))
  check('phone 390 · final screen has no horizontal overflow', metrics.scroll <= metrics.inner + 1)
  await context.close()
}

await browser.close()
console.log(failures === 0 ? `\nALL PASS (${total} checks)` : `\n${failures} FAILURE(S)`)
process.exit(failures === 0 ? 0 : 1)
