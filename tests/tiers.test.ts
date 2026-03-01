import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createDatabase, type ClawDatabase } from '../src/db'
import { TiersStore } from '../src/tiers'

describe('TiersStore', () => {
  let db: ClawDatabase
  let store: TiersStore

  beforeEach(() => {
    db = createDatabase(':memory:')
    store = new TiersStore(db)
  })

  afterEach(() => {
    db.close()
  })

  it('sets and gets a tier', () => {
    store.set('conv-1', 'permanent', 'User prefers PT-BR')
    const tiers = store.getAll('conv-1')
    expect(tiers.permanent).toBe('User prefers PT-BR')
  })

  it('upserts existing tier', () => {
    store.set('conv-1', 'permanent', 'old')
    store.set('conv-1', 'permanent', 'new')
    const tiers = store.getAll('conv-1')
    expect(tiers.permanent).toBe('new')
  })

  it('returns empty strings for missing tiers', () => {
    const tiers = store.getAll('conv-1')
    expect(tiers.permanent).toBe('')
    expect(tiers.recent).toBe('')
    expect(tiers.decisions).toBe('')
  })

  it('isolates conversations', () => {
    store.set('conv-1', 'permanent', 'one')
    store.set('conv-2', 'permanent', 'two')
    expect(store.getAll('conv-1').permanent).toBe('one')
    expect(store.getAll('conv-2').permanent).toBe('two')
  })

  it('setAll writes all tiers atomically', () => {
    store.setAll('conv-1', {
      permanent: 'facts',
      recent: 'summary',
      decisions: 'choices',
    })
    const tiers = store.getAll('conv-1')
    expect(tiers.permanent).toBe('facts')
    expect(tiers.recent).toBe('summary')
    expect(tiers.decisions).toBe('choices')
  })
})
