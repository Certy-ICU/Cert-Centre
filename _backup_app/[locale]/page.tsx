'use client';

import Link from 'next/link'
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function LocaleHomePage() {
  const t = useTranslations('HomePage');
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
        <p className="text-xl mb-8">{t('description')}</p>
        <Link 
          href="dashboard" 
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-md transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
} 