// =============================================================
// FILE: frontend/src/utils/formatPrice.js
// =============================================================
// Purpose:
//   Format a listing's price for display. Amounts are stored in
//   minor units (cents) in the listing's own currency. Currency
//   conversion is a display concern only (spec §2).
// =============================================================

const SYMBOLS = { KES: 'KSh', USD: '$' };

export function formatPrice(amountMinor, currency = 'KES') {
  if (amountMinor == null || Number.isNaN(amountMinor)) return '—';
  const major = amountMinor / 100;
  const symbol = SYMBOLS[currency] || currency;
  const locale = currency === 'KES' ? 'en-KE' : 'en-US';
  return `${symbol} ${major.toLocaleString(locale, { maximumFractionDigits: 0 })}`;
}

export function formatPriceConverted({
  amountMinor,
  originalCurrency,
  displayCurrency,
  rate,
  approximate = true,
}) {
  const primary = formatPrice(amountMinor, originalCurrency);

  if (originalCurrency === displayCurrency || !rate) {
    return { primary, secondary: null };
  }

  const convertedMajor = (amountMinor / 100) * rate;
  const symbol = SYMBOLS[displayCurrency] || displayCurrency;
  const locale = displayCurrency === 'KES' ? 'en-KE' : 'en-US';
  const converted = `${symbol} ${convertedMajor.toLocaleString(locale, {
    maximumFractionDigits: 0,
  })}`;

  return {
    primary,
    secondary: approximate ? `≈ ${converted}` : converted,
  };
}

// =============================================================
// END OF FILE: frontend/src/utils/formatPrice.js
// =============================================================