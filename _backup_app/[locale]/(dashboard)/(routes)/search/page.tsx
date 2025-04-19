import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/components/language-switcher'

export default function SearchPage() {
  const t = useTranslations('Navbar')
  
  return (
    <div className="p-6">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <h1 className="text-2xl font-bold mb-4">{t('search')}</h1>
    </div>
  )
} 