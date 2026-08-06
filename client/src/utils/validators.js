// validators.js

export function isEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isNotEmpty(value) {
  return value != null && value.trim() !== '';
}

export function isNumber(value) {
  return !isNaN(Number(value));
}
