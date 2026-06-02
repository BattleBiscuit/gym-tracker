import { describe, it, expect } from 'vitest'
import { formatWeight, resolveWeight } from '@/utils/formatWeight.js'

describe('formatWeight', () => {
  it('shows 0kg for weight=0 non-bodyweight', () => {
    expect(formatWeight(0, false)).toBe('0kg')
  })

  it('shows 0kg for null non-bodyweight', () => {
    expect(formatWeight(null, false)).toBe('0kg')
  })

  it('shows kg value for normal weight', () => {
    expect(formatWeight(80, false)).toBe('80kg')
  })

  it('shows BW for isBodyweight=true weight=0', () => {
    expect(formatWeight(0, true)).toBe('BW')
  })

  it('shows BW+10kg for weighted bodyweight', () => {
    expect(formatWeight(10, true)).toBe('BW+10kg')
  })

  it('shows BW-10kg for assisted', () => {
    expect(formatWeight(-10, true)).toBe('BW-10kg')
  })
})

describe('resolveWeight', () => {
  it('returns weight directly for non-BW', () => {
    expect(resolveWeight(80, false, 75)).toBe(80)
  })

  it('returns bodyweight for BW set with 0 offset', () => {
    expect(resolveWeight(0, true, 80)).toBe(80)
  })

  it('returns bodyweight + offset for weighted BW', () => {
    expect(resolveWeight(10, true, 80)).toBe(90)
  })

  it('returns bodyweight - assistance for assisted BW', () => {
    expect(resolveWeight(-15, true, 80)).toBe(65)
  })

  it('returns 0 for null weight non-BW', () => {
    expect(resolveWeight(null, false, 80)).toBe(0)
  })
})
