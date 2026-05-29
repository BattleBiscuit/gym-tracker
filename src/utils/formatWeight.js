export function formatWeight(weight, unit) {
  if (weight === 0 || weight === null || weight === undefined) return 'BW'
  return `${weight}${unit || 'kg'}`
}
