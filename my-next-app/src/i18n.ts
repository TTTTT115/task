import {getRequestConfig} from 'next-intl/server';

export const locales = ['en', 'ja'] as const;
export type Locale = typeof locales[number];

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (typeof locale !== 'string' || !isValidLocale(locale)) {
    throw new Error(`Invalid or missing locale: ${locale}`);
  }

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
    locale: locale // Ensure locale is returned
  };
});
