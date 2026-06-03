import { describe, it, expect } from 'vitest'

// Directly parse the schema file to verify version order
// This runs in CI and catches out-of-order declarations before they reach users
describe('DB schema version order', () => {
  it('all version declarations are in strictly ascending order', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const content = fs.readFileSync(
      path.resolve(__dirname, '../db/schema.js'),
      'utf-8'
    )

    const versions = [...content.matchAll(/db\.version\((\d+)\)/g)]
      .map(m => Number(m[1]))

    expect(versions.length).toBeGreaterThan(0)

    for (let i = 1; i < versions.length; i++) {
      expect(versions[i]).toBeGreaterThan(versions[i - 1],
        `Version ${versions[i]} at position ${i + 1} must be greater than ${versions[i - 1]} at position ${i}`
      )
    }
  })
})
