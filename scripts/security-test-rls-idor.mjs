#!/usr/bin/env node
/**
 * Security test: RLS/data isolation + IDOR for Next.js app at http://localhost:3000
 * Uses Supabase auth to get session, then in-memory cookie store to build Cookie header for app requests.
 *
 * Run from flowmapr dir with: node --env-file=.env.local scripts/security-test-rls-idor.mjs
 * Requires: app running at http://localhost:3000, User A and User B accounts exist.
 */

import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

const BASE = 'http://localhost:3000'
const USER_A = { email: 'fedorovaalinavl@gmail.com', password: '616265' }
const USER_B = { email: 'fedorovaalinavl@hotmail.com', password: '616265zzz' }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY (use --env-file=.env.local)')
  process.exit(1)
}

// In-memory cookie store for SSR client so we can capture cookies after setSession
let cookieStore = []

function getAll() {
  return Promise.resolve(cookieStore.map(({ name, value }) => ({ name, value })))
}

function setAll(cookies) {
  cookieStore = cookies.filter((c) => c.value).map(({ name, value }) => ({ name, value }))
  return Promise.resolve()
}

async function getSessionForUser(email, password) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Login failed for ${email}: ${error.message}`)
  return data.session
}

async function getCookieHeaderForSession(session) {
  cookieStore = []
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => getAll(),
      setAll: (cookies) => setAll(cookies),
    },
  })
  await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  })
  return cookieStore.map((c) => `${c.name}=${encodeURIComponent(c.value)}`).join('; ')
}

function extractDiagramIdsFromHtml(html) {
  const ids = new Set()
  const hrefRe = /href="\/(?:diagram|sequence|api-lens)\/([a-f0-9-]+)"/gi
  let m
  while ((m = hrefRe.exec(html)) !== null) ids.add(m[1])
  const dataIdRe = /data-(?:diagram-)?id="([a-f0-9-]+)"/gi
  while ((m = dataIdRe.exec(html)) !== null) ids.add(m[1])
  return [...ids]
}

async function fetchWithCookies(url, cookieHeader, options = {}) {
  const res = await fetch(url, {
    redirect: 'manual',
    headers: { Cookie: cookieHeader, ...options.headers },
    ...options,
  })
  return res
}

async function main() {
  const report = {
    userACapturedDiagramId: null,
    userACapturedRoute: null,
    userBCanSeeUserADiagramInWorkspace: null,
    directUrlAccessResult: null,
    scenario1Pass: null,
    scenario2Pass: null,
    evidence: { urls: [], snippets: [] },
  }

  console.log('--- Security test: RLS + IDOR ---\n')

  // 1) Login as User A
  console.log('1) Logging in as User A...')
  let sessionA
  try {
    sessionA = await getSessionForUser(USER_A.email, USER_A.password)
  } catch (e) {
    console.error(e.message)
    report.evidence.snippets.push(`User A login failed: ${e.message}`)
    report.scenario1Pass = false
    report.scenario2Pass = false
    printReport(report)
    process.exit(1)
  }
  const cookieA = await getCookieHeaderForSession(sessionA)

  // 2) Navigate to workspace (follow redirect to project page) and capture diagram id
  console.log('2) Fetching User A workspace (follow redirects to project)...')
  let res = await fetchWithCookies(`${BASE}/workspace`, cookieA)
  let finalUrl = res.url || `${BASE}/workspace`
  let html = ''
  if (res.redirected) {
    finalUrl = res.url
    res = await fetchWithCookies(finalUrl, cookieA)
  }
  if (res.ok) html = await res.text()
  else {
    report.evidence.snippets.push(`User A workspace response: ${res.status} ${res.statusText}`)
  }

  const projectMatch = finalUrl.match(/\/workspace\/project\/([a-f0-9-]+)/)
  const projectId = projectMatch ? projectMatch[1] : null
  report.evidence.urls.push(`User A workspace: ${finalUrl}`)

  const diagramIds = extractDiagramIdsFromHtml(html)
  if (diagramIds.length === 0) {
    report.evidence.snippets.push('No diagram links found in User A workspace HTML; checking for "diagram" or "Recent" in body.')
    const lower = html.toLowerCase()
    if (lower.includes('recent') || lower.includes('diagram')) {
      report.evidence.snippets.push('Page contains "diagram" or "recent" but no /diagram/<id> links found.')
    }
  }

  report.userACapturedDiagramId = diagramIds[0] || null
  report.userACapturedRoute = report.userACapturedDiagramId ? `/diagram/${report.userACapturedDiagramId}` : null

  if (!report.userACapturedDiagramId) {
    console.log('   No diagram ID found in User A workspace. Checking /workspace response...')
    report.evidence.snippets.push(`User A final URL: ${finalUrl}, status: ${res.status}`)
    report.scenario1Pass = false
    report.scenario2Pass = false
    printReport(report)
    process.exit(0)
  }

  console.log(`   Captured diagram id: ${report.userACapturedDiagramId}, route: ${report.userACapturedRoute}`)

  // 3) Logout (optional for cookie-based; we will use a new session for User B)
  // 4) Login as User B
  console.log('4) Logging in as User B...')
  let sessionB
  try {
    sessionB = await getSessionForUser(USER_B.email, USER_B.password)
  } catch (e) {
    console.error(e.message)
    report.evidence.snippets.push(`User B login failed: ${e.message}`)
    report.scenario1Pass = false
    report.scenario2Pass = false
    printReport(report)
    process.exit(1)
  }
  const cookieB = await getCookieHeaderForSession(sessionB)

  // 5) User B workspace: verify User A's diagram id is not visible
  console.log('5) Fetching User B workspace...')
  res = await fetchWithCookies(`${BASE}/workspace`, cookieB)
  finalUrl = res.url || `${BASE}/workspace`
  if (res.redirected) {
    finalUrl = res.url
    res = await fetchWithCookies(finalUrl, cookieB)
  }
  html = res.ok ? await res.text() : ''
  report.evidence.urls.push(`User B workspace: ${finalUrl}`)

  const diagramIdsUserB = extractDiagramIdsFromHtml(html)
  const userBCanSeeUserADiagram = diagramIdsUserB.includes(report.userACapturedDiagramId)
  report.userBCanSeeUserADiagramInWorkspace = userBCanSeeUserADiagram
  report.scenario1Pass = !userBCanSeeUserADiagram
  report.evidence.snippets.push(
    `User B diagram ids on workspace: ${diagramIdsUserB.length} total; User A id present: ${userBCanSeeUserADiagram}`
  )

  console.log(`   User B can see User A diagram in workspace: ${userBCanSeeUserADiagram} (expect false) -> Scenario 1: ${report.scenario1Pass ? 'PASS' : 'FAIL'}`)

  // 6) IDOR: User B directly opens /diagram/<UserA_id>
  console.log('6) As User B, opening /diagram/<UserA_id>...')
  const diagramUrl = `${BASE}/diagram/${report.userACapturedDiagramId}`
  res = await fetchWithCookies(diagramUrl, cookieB)
  const status = res.status
  const idorHtml = res.ok ? await res.text() : await res.text().catch(() => '')
  const redirected = res.redirected
  const location = res.headers.get('location') || ''

  const accessDenied = status === 404 || status === 403 || (status === 302 && (location.includes('login') || location.includes('workspace')))
  const noUserAData = !idorHtml.includes(USER_A.email) && !idorHtml.includes(report.userACapturedDiagramId) || status !== 200

  report.directUrlAccessResult = {
    status,
    redirected,
    location: location || null,
    accessDeniedOrRedirect: accessDenied,
    userADataNotVisible: status !== 200 || noUserAData,
  }
  report.scenario2Pass = accessDenied || (status !== 200 && noUserAData)
  report.evidence.urls.push(`IDOR request: ${diagramUrl}`)
  report.evidence.snippets.push(
    `Direct /diagram/<UserA_id> as User B: status=${status}, redirect=${redirected}, location=${location || 'none'}`
  )
  if (status === 200) {
    report.evidence.snippets.push(`Body contains User A email: ${idorHtml.includes(USER_A.email)}; contains diagram id: ${idorHtml.includes(report.userACapturedDiagramId)}`)
  }

  console.log(`   Result: status=${status}, redirected=${redirected}, access denied/redirect: ${accessDenied} -> Scenario 2: ${report.scenario2Pass ? 'PASS' : 'FAIL'}`)

  printReport(report)
}

function printReport(r) {
  console.log('\n========== REPORT ==========')
  console.log('User A captured diagram id:', r.userACapturedDiagramId)
  console.log('User A captured route:', r.userACapturedRoute)
  console.log('User B can see User A diagram in workspace:', r.userBCanSeeUserADiagramInWorkspace === true ? 'yes' : 'no')
  console.log('Direct URL access (as User B):', JSON.stringify(r.directUrlAccessResult, null, 2))
  console.log('Scenario 1 (RLS/data isolation):', r.scenario1Pass ? 'PASS' : 'FAIL')
  console.log('Scenario 2 (IDOR):', r.scenario2Pass ? 'PASS' : 'FAIL')
  console.log('\nEvidence URLs:', r.evidence.urls.join('\n'))
  console.log('Evidence snippets:', r.evidence.snippets.join('\n'))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
