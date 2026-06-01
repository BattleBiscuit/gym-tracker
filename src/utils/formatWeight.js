// Display weight — pass isBodyweight to get BW/BW+10kg/BW-10kg format
export function formatWeight(weight, isBodyweight) {
  if (isBodyweight) {
    if (!weight) return 'BW'
    if (weight > 0) return `BW+${weight}kg`
    return `BW${weight}kg`   // negative: BW-10kg
  }
  if (weight === null || weight === undefined || weight === 0) return '0kg'
  return `${weight}kg`
}

// Resolves actual kg value for analytics
export function resolveWeight(weight, isBodyweight, bodyweightKg) {
  if (isBodyweight) return (bodyweightKg || 0) + (weight || 0)
  return weight || 0
}
