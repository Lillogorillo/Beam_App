import { translations } from '../i18n/translations';

type TranslationPath = string;

export const useTranslation = () => {
  const isRecord = (val: unknown): val is Record<string, unknown> => {
    return typeof val === 'object' && val !== null;
  };

  const t = (path: TranslationPath, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    let value: unknown = translations;

    for (const key of keys) {
      if (isRecord(value) && Object.prototype.hasOwnProperty.call(value, key)) {
        value = (value as Record<string, unknown>)[key];
      } else {
        console.warn(`Translation key not found: ${path}`);
        return path;
      }
    }

    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string: ${path}`);
      return path;
    }

    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, key) => {
        return params[key]?.toString() || match;
      });
    }

    return value;
  };

  return { t };
};


