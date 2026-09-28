const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

export const formatPrice = (amount: number) => clp.format(amount);

export const discountPercent = (price: number, compareAt: number | null) =>
  compareAt && compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;

const SMALL_WORDS = new Set([
  'de',
  'del',
  'la',
  'las',
  'el',
  'los',
  'y',
  'e',
  'o',
  'u',
  'en',
  'con',
  'para',
  'por',
  'a',
]);

/**
 * Many catalog titles are typed in ALL CAPS. Display them in title case (formatting only;
 * size tokens like "1.5" or codes like "A22" stay as they are).
 */
export function displayTitle(title: string): string {
  const letters = title.replace(/[^a-záéíóúñü]/gi, '');
  const upper = letters.replace(/[^A-ZÁÉÍÓÚÑÜ]/g, '');
  if (letters.length === 0 || upper.length / letters.length < 0.7) return title.trim();
  return title
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,]\s*$/, '')
    .split(' ')
    .map((word, i) => {
      if (/\d/.test(word)) return word;
      const lower = word.toLowerCase();
      if (i > 0 && SMALL_WORDS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}
