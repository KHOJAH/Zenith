export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  flag: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'JOD', symbol: 'JD', name: 'Jordanian Dinar', flag: '🇯🇴' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', flag: '🇸🇦' },
  { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar', flag: '🇰🇼' },
  { code: 'QAR', symbol: 'QR', name: 'Qatari Riyal', flag: '🇶🇦' },
  { code: 'BHD', symbol: 'BD', name: 'Bahraini Dinar', flag: '🇧🇭' },
  { code: 'OMR', symbol: 'RO', name: 'Omani Rial', flag: '🇴🇲' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', flag: '🇪🇬' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', flag: '🇭🇰' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', flag: '🇰🇷' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso', flag: '🇲🇽' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', flag: '🇸🇪' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', flag: '🇳🇴' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone', flag: '🇩🇰' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', flag: '🇹🇷' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', flag: '🇵🇱' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', flag: '🇹🇭' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', flag: '🇮🇩' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', flag: '🇲🇾' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', flag: '🇵🇭' },
  { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', flag: '🇮🇱' },
  { code: 'CLP', symbol: 'CLP$', name: 'Chilean Peso', flag: '🇨🇱' },
  { code: 'COP', symbol: 'COL$', name: 'Colombian Peso', flag: '🇨🇴' },
  { code: 'ARS', symbol: 'ARS$', name: 'Argentine Peso', flag: '🇦🇷' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', flag: '🇨🇿' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', flag: '🇭🇺' },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu', flag: '🇷🇴' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', flag: '🇻🇳' },
];

export function getCurrencyInfo(code: string): CurrencyInfo {
  const found = CURRENCIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
  return found || { code, symbol: code, name: code, flag: '🌐' };
}

// Exchange rates relative to 1 USD base
export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  JOD: 0.709,
  AED: 3.6725,
  SAR: 3.75,
  KWD: 0.307,
  QAR: 3.64,
  BHD: 0.376,
  OMR: 0.385,
  EGP: 48.5,
  CAD: 1.36,
  AUD: 1.52,
  JPY: 155.0,
  CHF: 0.90,
  CNY: 7.23,
  INR: 83.5,
  SGD: 1.35,
  NZD: 1.64,
  HKD: 7.82,
  KRW: 1375.0,
  BRL: 5.45,
  MXN: 18.2,
  SEK: 10.6,
  NOK: 10.8,
  DKK: 6.87,
  TRY: 32.8,
  ZAR: 18.5,
  PLN: 3.98,
  THB: 36.7,
  IDR: 16250.0,
  MYR: 4.71,
  PHP: 58.6,
  ILS: 3.72,
  CLP: 935.0,
  COP: 4120.0,
  ARS: 900.0,
  CZK: 23.2,
  HUF: 365.0,
  RON: 4.58,
  VND: 25400.0,
};

export function convertCurrency(
  amount: number,
  fromCode: string = 'USD',
  toCode: string = 'USD'
): number {
  if (!amount || amount === 0) return 0;
  const from = (fromCode || 'USD').toUpperCase();
  const to = (toCode || 'USD').toUpperCase();
  if (from === to) return amount;

  const rateFrom = EXCHANGE_RATES[from] || 1;
  const rateTo = EXCHANGE_RATES[to] || 1;

  // Convert to USD base first, then to target currency
  const inUSD = amount / rateFrom;
  const result = inUSD * rateTo;
  return Math.round(result * 100) / 100;
}

