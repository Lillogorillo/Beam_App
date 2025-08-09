import { translations } from '../i18n/translations';

type TranslationPath = string;

export const useTranslation = () => {
  const t = (path: TranslationPath, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    let value: unknown = translations;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        console.warn(`Translation key not found: ${path}`);
        return path; // Return the key if translation not found
      }
    }
    
    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string: ${path}`);
      return path;
    }
    
    // Replace parameters in the translation
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, key) => {
        return params[key]?.toString() || match;
      });
    }
    
    return value;
  };

  return { t };
};


