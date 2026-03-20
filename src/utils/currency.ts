import countryCurrencyData from '../data/country-by-currency-code.json'

export interface CurrencyInfo {
  code: string
  symbol: string
  name: string
}

// Build country → currency code map from the JSON (case-insensitive keys)
const COUNTRY_CURRENCY_MAP: Record<string, string> = {}
for (const entry of countryCurrencyData as { country: string; currency_code: string | null }[]) {
  if (entry.country && entry.currency_code) {
    COUNTRY_CURRENCY_MAP[entry.country.toLowerCase()] = entry.currency_code
  }
}

export const CURRENCY_INFO: Record<string, CurrencyInfo> = {
  PKR: { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  THB: { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  TRY: { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  EGP: { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
  SAR: { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  QAR: { code: 'QAR', symbol: 'QR', name: 'Qatari Riyal' },
  MYR: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  IDR: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  MXN: { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  CHF: { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  RUB: { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  CZK: { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  PLN: { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  HUF: { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
  BDT: { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  LKR: { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee' },
  NPR: { code: 'NPR', symbol: 'Rs', name: 'Nepalese Rupee' },
  NOK: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  DKK: { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  HKD: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  ILS: { code: 'ILS', symbol: '₪', name: 'Israeli Shekel' },
  PHP: { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  VND: { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  BGN: { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev' },
  RON: { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
  UAH: { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia' },
}

// Fallback static rates (USD base) — used when live fetch fails
const STATIC_USD_RATES: Record<string, number> = {
  USD: 1, PKR: 278, GBP: 0.79, EUR: 0.92, JPY: 150, AED: 3.67,
  INR: 83, AUD: 1.53, CAD: 1.36, CNY: 7.24, SGD: 1.34, THB: 35,
  TRY: 32, EGP: 48, SAR: 3.75, QAR: 3.64, MYR: 4.72, IDR: 15600,
  KRW: 1330, BRL: 5.0, MXN: 17.2, ZAR: 18.5, CHF: 0.9, NZD: 1.63,
  RUB: 90, CZK: 23, PLN: 4.0, HUF: 360, BDT: 110, LKR: 310,
  NPR: 133, NOK: 10.5, SEK: 10.3, DKK: 6.9, HKD: 7.8, ILS: 3.7,
  PHP: 56, VND: 24500, BGN: 1.8, RON: 4.6, UAH: 38,
}

/** Return the currency code for a country name (case-insensitive), or null. */
export function getCurrencyForCountry(country: string): string | null {
  if (!country) return null
  const key = country.toLowerCase().trim()
  return COUNTRY_CURRENCY_MAP[key] ?? null
}

/** Convert amount using static fallback rates (USD as bridge). */
export function convertAmountStatic(amount: number, from: string, to: string): number | null {
  const fromRate = STATIC_USD_RATES[from]
  const toRate = STATIC_USD_RATES[to]
  if (!fromRate || !toRate) return null
  return Math.round((amount / fromRate) * toRate)
}

/** Fetch live rates from exchangerate-api.com (free, no key needed for v4). */
export async function fetchLiveRates(baseCurrency: string): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`)
    if (!res.ok) return null
    const data = await res.json()
    return data.rates ?? null
  } catch {
    return null
  }
}

/** Format a number with currency symbol and thousands separator. */
export function formatAmount(amount: number, currencyCode: string): string {
  const info = CURRENCY_INFO[currencyCode]
  const symbol = info?.symbol ?? (currencyCode + ' ')
  const formatted = amount.toLocaleString('en-US', { maximumFractionDigits: 0 })
  return `${symbol}${formatted}`
}
