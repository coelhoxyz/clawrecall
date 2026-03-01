import type { ClawDatabase } from './db'
import type { TierName } from './types'

export interface TierContents {
  permanent: string
  recent: string
  decisions: string
}

export class TiersStore {
  constructor(private db: ClawDatabase) {}

  set(conversationId: string, tier: TierName, content: string): void {
    this.db.prepare(
      `INSERT INTO tiers (conversation_id, tier, content, updated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(conversation_id, tier)
       DO UPDATE SET content = excluded.content, updated_at = datetime('now')`
    ).run(conversationId, tier, content)
  }

  getAll(conversationId: string): TierContents {
    const rows = this.db.prepare(
      'SELECT tier, content FROM tiers WHERE conversation_id = ?'
    ).all(conversationId) as { tier: TierName; content: string }[]

    const result: TierContents = { permanent: '', recent: '', decisions: '' }
    for (const row of rows) {
      result[row.tier] = row.content
    }
    return result
  }

  setAll(conversationId: string, contents: TierContents): void {
    const upsert = this.db.prepare(
      `INSERT INTO tiers (conversation_id, tier, content, updated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(conversation_id, tier)
       DO UPDATE SET content = excluded.content, updated_at = datetime('now')`
    )

    const transaction = this.db.transaction(() => {
      upsert.run(conversationId, 'permanent', contents.permanent)
      upsert.run(conversationId, 'recent', contents.recent)
      upsert.run(conversationId, 'decisions', contents.decisions)
    })

    transaction()
  }
}
