export const fmtRs = (n: number) =>
  '₹' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

export const fmtNum = (n: number, d = 1) => Number(n).toFixed(d)

export const avg = (arr: number[]) =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0

export const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)

export const getScoreColor = (s: number) =>
  s >= 75 ? '#22C55E' : s >= 50 ? '#F59E0B' : '#EF4444'

export const getBattColor = (pct: number) =>
  pct > 50 ? '#22C55E' : pct > 25 ? '#F59E0B' : '#EF4444'
