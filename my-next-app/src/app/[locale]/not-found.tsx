'use client';

import Link from 'next/link';
import {useTranslations} from 'next-intl';

export default function NotFound() {
  const t = useTranslations('NotFound');

  return (
    <div style={{ textAlign: 'center', marginTop: '50px', padding: '20px' }}>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
      <Link href="/">
        {t('goHome')}
      </Link>
    </div>
  );
}
