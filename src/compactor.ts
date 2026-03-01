import Anthropic from '@anthropic-ai/sdk'
import type { Message } from './types'
import type { TierContents } from './tiers'

export function buildCompactionPrompt(
  currentTiers: TierContents,
  recentMessages: Message[],
  maxDecisions: number
): string {
  const messagesText = recentMessages
    .map(m => `[${m.role}]: ${m.content}`)
    .join('\n')

  return `You are a memory compaction system. Rewrite the agent's memory into exactly 3 sections.

CURRENT MEMORY:
## Permanent
${currentTiers.permanent || '(empty)'}

## Recent
${currentTiers.recent || '(empty)'}

## Decisions
${currentTiers.decisions || '(empty)'}

RECENT MESSAGES:
${messagesText || '(no recent messages)'}

INSTRUCTIONS:
Rewrite the memory with these exact 3 markdown sections:
- ## Permanent — stable facts about the user (preferences, profile, rules). Keep only what is confirmed true. Max 100 words.
- ## Recent — summary of recent conversations. Focus on what matters for future context. Max 200 words.
- ## Decisions — the ${maxDecisions} most important recent decisions or conclusions. Numbered list.

Output ONLY the 3 sections, no other text.`
}

export function parseCompactionResponse(response: string): TierContents {
  const sections: TierContents = { permanent: '', recent: '', decisions: '' }

  const tierPatterns: [keyof TierContents, RegExp][] = [
    ['permanent', /## Permanent\n([\s\S]*?)(?=## |$)/i],
    ['recent', /## Recent\n([\s\S]*?)(?=## |$)/i],
    ['decisions', /## Decisions\n([\s\S]*?)(?=## |$)/i],
  ]

  for (const [tier, pattern] of tierPatterns) {
    const match = response.match(pattern)
    if (match) {
      sections[tier] = match[1].trim()
    }
  }

  return sections
}

export async function runCompaction(
  client: Anthropic,
  model: string,
  currentTiers: TierContents,
  recentMessages: Message[],
  maxDecisions: number
): Promise<TierContents> {
  const prompt = buildCompactionPrompt(currentTiers, recentMessages, maxDecisions)

  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('')

  return parseCompactionResponse(text)
}
