// formatCurrency.js

export function formatCurrency(amount, currency = 'INR') {
  return amount.toLocaleString('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  });
}
