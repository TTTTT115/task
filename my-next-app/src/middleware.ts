import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n'; // Import locales

export default createMiddleware({
  locales,
  defaultLocale: 'en', // Assuming 'en' is the default
  localePrefix: 'as-needed', // Optional: adds prefix only when not default
  localeDetection: true, // Enables automatic locale detection
  pathnames: { // Optional: for localized pathnames
    '/': '/',
    '/mui-test': '/mui-test'
  }
});

export const config = {
  // Match only internationalized pathnames
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
