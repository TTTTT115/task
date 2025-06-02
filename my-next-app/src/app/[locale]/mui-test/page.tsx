'use client';
import * as React from 'react';
import Button from '@mui/material/Button';
import {useTranslations} from 'next-intl';
import Link from 'next/link';

export default function MuiTestPage() {
  const t = useTranslations('MuiTestPage');
  const g = useTranslations('Greeting'); // For a return link

  return (
    <div style={{ padding: '20px' }}>
      <h1>{t('title')}</h1>
      <Button variant="contained" color="primary">
        {t('buttonText')}
      </Button>
      <p style={{ marginTop: '20px' }}>{t('translatedMessage')}</p>
      <div style={{ marginTop: '30px' }}>
        <Link href="/">
          &larr; Back to Home ({g('hello')})
        </Link>
      </div>
    </div>
  );
}
