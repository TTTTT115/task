import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig: NextConfig = {
  // reactStrictMode: true, // It's good to have this, but ensure it's not causing issues.
};

export default withNextIntl(nextConfig);
