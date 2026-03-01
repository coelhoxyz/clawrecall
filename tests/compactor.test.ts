import { describe, it, expect } from 'vitest'
import { buildCompactionPrompt, parseCompactionResponse } from '../src/compactor'

describe('buildCompactionPrompt', () => {
  it('includes current tiers and messages in prompt', () => {
    const prompt = buildCompactionPrompt(
      { permanent: 'likes coffee', recent: 'talked about deploy', decisions: 'chose postgres' },
      [
        { role: 'user', content: 'lets use redis instead' },
        { role: 'assistant', content: 'ok, switching to redis' },
      ],
      5
    )
    expect(prompt).toContain('likes coffee')
    expect(prompt).toContain('lets use redis instead')
    expect(prompt).toContain('5')
  })
})

describe('parseCompactionResponse', () => {
  it('parses markdown with 3 tier sections', () => {
    const response = `## Permanent
User is a dev who likes coffee

## Recent
Discussed switching from postgres to redis for caching

## Decisions
1. Switch to redis for caching
2. Deploy on Cloudflare`

    const result = parseCompactionResponse(response)
    expect(result.permanent).toContain('coffee')
    expect(result.recent).toContain('redis')
    expect(result.decisions).toContain('Cloudflare')
  })

  it('handles missing sections gracefully', () => {
    const response = `## Permanent
Some facts`

    const result = parseCompactionResponse(response)
    expect(result.permanent).toContain('facts')
    expect(result.recent).toBe('')
    expect(result.decisions).toBe('')
  })
})
