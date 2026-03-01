import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as { plantuml?: string }
  const plantuml = body.plantuml ?? ''
  if (!plantuml.trim()) return NextResponse.json({ error: 'No PlantUML provided' }, { status: 400 })

  // Forward to PlantUML server for rendering
  try {
    const encoded = Buffer.from(plantuml).toString('base64url')
    const url = `https://www.plantuml.com/plantuml/svg/${encoded}`
    return NextResponse.json({ url })
  } catch {
    return NextResponse.json({ error: 'Failed to convert PlantUML' }, { status: 500 })
  }
}
