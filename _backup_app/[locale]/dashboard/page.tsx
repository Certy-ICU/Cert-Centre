import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/components/language-switcher'

export default function DashboardPage() {
  const t = useTranslations('Courses')
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold">{t('inProgress')}</h2>
            <p>0 courses</p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold">{t('completed')}</h2>
            <p>0 courses</p>
          </div>
        </div>
      </div>
    </div>
  )
} 