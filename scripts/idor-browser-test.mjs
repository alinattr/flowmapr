#!/usr/bin/env node
/**
 * Page-level IDOR test in browser.
 * 1) Open /login, sign in as User B.
 * 2) Navigate to /diagram/<userA_diagram_id>.
 * 3) Report URL, what is rendered, and whether User A content is visible.
 */
import { chromium } from 'playwright'

const BASE = 'http://localhost:3000'
const USER_B = { email: 'fedorovaalinavl@hotmail.com', password: '616265zzz' }
const USER_A_DIAGRAM_ID = '31a4033b-ec99-4d60-a4f1-f38920a05a0e'
const DIAGRAM_URL = `${BASE}/diagram/${USER_A_DIAGRAM_ID}`

async function main() {
  const report = {
    finalUrl: null,
    status: null,
    rendered: null, // 404 page | redirect | forbidden text | actual diagram
    userADiagramTitleOrContentVisible: null,
    idorPass: null,
    evidenceSnippets: [],
  }

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // 1) Open /login and sign in as User B
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 15000 })
    report.evidenceSnippets.push(`Login page loaded: ${page.url()}`)

    await page.locator('#email').fill(USER_B.email)
    await page.locator('#password').fill(USER_B.password)
    await page.getByRole('button', { name: /log in/i }).click()

    await page.waitForURL((u) => u.pathname !== '/login', { timeout: 10000 })
    report.evidenceSnippets.push(`After login: ${page.url()}`)

    // 2) Navigate directly to User A's diagram
    const resp = await page.goto(DIAGRAM_URL, { waitUntil: 'domcontentloaded', timeout: 15000 })
    report.status = resp.status()
    report.finalUrl = page.url()

    await page.waitForLoadState('domcontentloaded')

    const title = await page.title()
    const bodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '')
    const has404 = bodyText.includes('404') || bodyText.includes('Not Found') || title.toLowerCase().includes('not found')
    const hasForbidden = bodyText.includes('Forbidden') || bodyText.includes('403') || bodyText.includes('access denied')
    const redirectedToLogin = report.finalUrl.includes('/login')
    const hasDiagramCanvas = await page.locator('[data-diagram-canvas], [class*="DiagramCanvas"], [class*="react-flow"]').count() > 0
    const hasDiagramTitle = await page.locator('input[placeholder*="title"], [data-diagram-title], h1').first().innerText().catch(() => '')

    if (redirectedToLogin) report.rendered = 'redirect (to login)'
    else if (has404) report.rendered = '404 page'
    else if (hasForbidden) report.rendered = 'forbidden text'
    else if (hasDiagramCanvas || (bodyText && bodyText.length > 200 && !has404)) report.rendered = 'actual diagram'
    else report.rendered = 'other'

    report.evidenceSnippets.push(`Page title: "${title}"`)
    const snippet = bodyText.slice(0, 500).replace(/\s+/g, ' ').trim()
    report.evidenceSnippets.push(`Body snippet (first 500 chars): ${snippet || '(empty)'}`)

    // User A content = we don't know exact title; if we see a diagram with content, it could be User A's (IDOR fail) or empty (OK)
    report.userADiagramTitleOrContentVisible = report.rendered === 'actual diagram' && report.status === 200
    report.idorPass = !report.userADiagramTitleOrContentVisible && (report.status === 404 || redirectedToLogin || has404 || hasForbidden)
  } catch (e) {
    report.evidenceSnippets.push(`Error: ${e.message}`)
    report.idorPass = false
  } finally {
    await browser.close()
  }

  // Print report
  console.log('=== IDOR evidence report ===')
  console.log('Final URL:', report.finalUrl)
  console.log('Response status:', report.status)
  console.log('Rendered:', report.rendered)
  console.log('User A diagram title/content visible:', report.userADiagramTitleOrContentVisible)
  console.log('IDOR pass:', report.idorPass)
  console.log('Evidence:', report.evidenceSnippets.join(' | '))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
