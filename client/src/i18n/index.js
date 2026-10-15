import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en/translation.json';
import taTranslation from './locales/ta/translation.json';
import hiTranslation from './locales/hi/translation.json';

const resources = {
  en: { translation: enTranslation },
  ta: { translation: taTranslation },
  hi: { translation: hiTranslation },
};

// Retrieve saved language from localStorage (or default to 'en')
const savedLanguage = typeof window !== 'undefined'
  ? localStorage.getItem('user_language') || 'en'
  : 'en';

// Validate allowed languages
const initialLanguage = ['en', 'ta', 'hi'].includes(savedLanguage) ? savedLanguage : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'en',
    supportedLngs: ['en', 'ta', 'hi'],
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

// Set document lang attribute
if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLanguage;
}

// When language changes, update document.documentElement.lang and localStorage
i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
    // Set class on body for language-specific font styling if needed
    document.body.setAttribute('data-lang', lng);
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem('user_language', lng);
  }
});

export default i18n;
