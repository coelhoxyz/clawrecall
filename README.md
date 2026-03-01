# clawmemory

3-tier memory and context management for AI agents.

[![npm version](https://img.shields.io/npm/v/clawmemory.svg)](https://www.npmjs.com/package/clawmemory)

## Install

```bash
npm install clawmemory
```

## Quick Start

```ts
import { ClawMemory } from 'clawmemory'

const memory = new ClawMemory({
  dbPath: './data/memory.db',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
})

memory.addMessage('user-123', { role: 'user', content: 'I prefer dark mode' })
memory.setTier('user-123', 'permanent', 'User prefers dark mode.')

const ctx = memory.buildContext('user-123')
// ctx.systemPrompt  — tier summaries as system instructions
// ctx.messages       — recent history within token budget
// ctx.tokenUsage     — { tiers, history, total }

memory.close()
```

## API

| Method | Signature | Description |
|--------|-----------|-------------|
| `addMessage` | `(conversationId, { role, content })` | Store a message in conversation history |
| `buildContext` | `(conversationId) => BuiltContext` | Build optimized context within token budget |
| `setTier` | `(conversationId, tier, content)` | Set content for a memory tier |
| `getTiers` | `(conversationId) => { permanent, recent, decisions }` | Get all tier contents |
| `compact` | `(conversationId) => Promise<CompactionResult>` | Run AI-powered memory compaction |
| `close` | `()` | Close the database connection |

## Memory Tiers

| Tier | Budget | Purpose |
|------|--------|---------|
| `permanent` | Shared from `tiers` budget | Long-term facts, preferences, identity |
| `recent` | Shared from `tiers` budget | Summary of recent interactions |
| `decisions` | Shared from `tiers` budget | Key decisions and their rationale |

Tiers are injected into the system prompt. Message history is managed separately within its own token budget.

## Configuration

```ts
const memory = new ClawMemory({
  dbPath: './data/memory.db',       // SQLite database path
  anthropicApiKey: 'sk-...',        // Anthropic API key (for compaction)
  tokenBudget: {
    total: 8000,                    // Total token budget (default: 8000)
    tiers: 2000,                    // Budget for tier content (default: 2000)
    history: 6000,                  // Budget for message history (default: 6000)
  },
  compaction: {
    model: 'claude-haiku-4-5-20251001', // Model for compaction (default)
    windowDays: 7,                  // Days of messages to analyze (default: 7)
    maxDecisions: 5,                // Max decisions to retain (default: 5)
  },
})
```

## NanoClaw Integration

```ts
import { ClawMemory } from 'clawmemory'

const memory = new ClawMemory({
  dbPath: './data/nanoclaw-memory.db',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
})

function onMessage(groupId: string, userMessage: string) {
  memory.addMessage(groupId, { role: 'user', content: userMessage })
  const ctx = memory.buildContext(groupId)
  // Write ctx.systemPrompt to the group's CLAUDE.md
  // Pass ctx.messages as conversation history
  return ctx
}
```

## How Compaction Works

- Collects messages from the configured time window (default: 7 days).
- Sends current tier contents + recent messages to Claude for analysis.
- Claude produces updated summaries for permanent, recent, and decisions tiers.
- Processed messages are archived, keeping the active history lean.

Run compaction on a schedule (e.g., daily cron) to keep memory fresh and context windows small.

## License

MIT
