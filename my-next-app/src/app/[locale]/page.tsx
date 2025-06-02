'use client';
import Image from "next/image"; // Assuming Image component is used
import {useTranslations} from 'next-intl';
import Link from 'next/link'; // Assuming Link component is used

export default function Home() {
  const t = useTranslations('Greeting');
  const tMuiPage = useTranslations('MuiTestPage'); // For the link text

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <div className="text-center sm:text-left">
          <h1 className="text-4xl font-bold mb-4">{t('hello')}</h1>
          <p className="text-lg mb-2">{t('welcome')}</p>
          <p className="text-md mb-6">
            This page demonstrates basic internationalization with next-intl.
          </p>
          <Link href="/mui-test" className="text-blue-500 hover:underline text-lg">
            Go to: {tMuiPage('title')}
          </Link>
        </div>
        {/* Rest of the template content can go here if needed */}
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        {/* Footer links from template can be added here if needed */}
        <p>Internationalized Footer Example</p>
      </footer>
    </div>
  );
}
