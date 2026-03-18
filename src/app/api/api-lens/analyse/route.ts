import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/server'
import { checkGenerationLimit } from '@/lib/subscriptions/checkGenerationLimit'
import { hasFeature } from '@/lib/subscriptions/hasFeature'
import { recordGenerationUsage } from '@/lib/subscriptions/recordGenerationUsage'
import { lensRatelimit } from '@/lib/ratelimit'

const MAX_PROMPT_LENGTH = 4000

const SYSTEM_PROMPT = `You are an API documentation and architecture expert.
Given an OpenAPI spec, Swagger file, or plain-text description of API endpoints, produce:
1. A structured list of endpoints with method, path, summary, description, parameters, and responses
2. A service architecture diagram showing which services own which endpoints

Output ONLY valid JSON matching this schema exactly:
{
  "services": [
    {
      "id": string,
      "name": string,
      "kind": "service" | "database" | "queue" | "cache" | "external" | "gateway",
      "technology": string | null,
      "endpoints": [
        {
          "id": string,
          "method": "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD",
          "path": string,
          "summary": string,
          "description": string,
          "tags": string[],
          "parameters": [
            { "name": string, "in": "query" | "path" | "header" | "body", "required": boolean, "type": string, "description": string }
          ],
          "requestBody": { "contentType": string, "schema": string } | null,
          "responses": [
            { "status": number, "description": string, "schema": string | null }
          ]
        }
      ],
      "position": { "x": number, "y": number }
    }
  ],
  "connections": [
    { "id": string, "source": string, "target": string, "label": string }
  ]
}

LAYOUT RULES:
- Place services in a logical left-to-right flow (clients → gateways → services → databases)
- Start x at 100, increment by 250. y starts at 100, increment by 200 for each row
- Max 3 services per row

If given a plain-text description instead of a spec, infer the endpoints from context.
Ensure all endpoint IDs are unique. Service IDs should be simple slugs like "auth-service".`

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const canUseApiLens = await hasFeature(user.id, 'api_lens')
  if (!canUseApiLens) {
    return NextResponse.json({ error: 'feature_not_available', feature: 'api_lens' }, { status: 403 })
  }

  const usage = await checkGenerationLimit(user.id)
  if (!usage.allowed) {
    return NextResponse.json(
      { error: 'generation_limit_reached', plan: usage.plan, limit: usage.limit },
      { status: 403 }
    )
  }

  try {
    const { success } = await lensRatelimit.limit(user.id)
    if (!success) {
      return NextResponse.json({ error: 'rate_limit_exceeded' }, { status: 429 })
    }
  } catch (err) {
    // Redis unavailable — fail open, log to Sentry
    Sentry.captureException(err, { tags: { context: 'ratelimit' } })
  }

  const body = await request.json() as { spec?: unknown; prompt?: unknown }
  const rawInput = body.spec ?? body.prompt

  if (typeof rawInput !== 'string') {
    return NextResponse.json({ error: 'invalid_prompt' }, { status: 400 })
  }
  if (rawInput.trim().length === 0) {
    return NextResponse.json({ error: 'empty_prompt' }, { status: 400 })
  }
  if (rawInput.length > MAX_PROMPT_LENGTH) {
    return NextResponse.json(
      { error: 'prompt_too_long', max: MAX_PROMPT_LENGTH, received: rawInput.length },
      { status: 400 }
    )
  }

  const input = rawInput

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 60_000,
    maxRetries: 0,
  })

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 4000,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: input },
      ],
    })

    const text = completion.choices[0]?.message?.content
    if (!text) throw new Error('No content')
    const parsed = JSON.parse(text)
    await recordGenerationUsage({
      userId: user.id,
      diagramType: 'api_lens',
      tokensUsed: completion.usage?.total_tokens ?? null,
    })
    return NextResponse.json(parsed)
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: 'api-lens' },
      extra: { userId: user.id },
    })
    return NextResponse.json({ error: 'Failed to analyse API spec' }, { status: 500 })
  }
}
