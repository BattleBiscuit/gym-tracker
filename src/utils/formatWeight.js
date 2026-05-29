export function formatWeight(weight, unit) {
  if (weight === 0 || weight === null || weight === undefined) return 'BW'
  if (weight < 0) return `BW${weight}${unit || 'kg'}`  // e.g. BW-10kg (assisted)
  return `${weight}${unit || 'kg'}`
}

// Resolves effective weight for analytics: BW + value when value <= 0
export function resolveWeight(weight, unit, bodyweightKg) {
  if (weight === null || weight === undefined) return bodyweightKg || 0
  if (weight <= 0) return (bodyweightKg || 0) + weight
  return weight
}
