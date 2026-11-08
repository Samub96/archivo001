/**
 * Single normalization contract for every answer in the game.
 * Spec: trim, collapse inner spaces, lowercase, strip diacritics.
 * Comparison is exact after normalization.
 */
export const normalize = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')

export const hasAnswer = (value: string): boolean => normalize(value).length > 0

export const matchesAnswer = (value: string, canonical: string): boolean =>
  hasAnswer(value) && normalize(value) === normalize(canonical)
