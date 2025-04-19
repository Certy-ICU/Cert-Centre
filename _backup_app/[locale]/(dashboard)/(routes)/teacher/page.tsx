import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/components/language-switcher'

export default function TeacherDashboardPage() {
  const t = useTranslations('Courses')
  
  return (
    <div className="p-6">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <h1 className="text-2xl font-bold mb-4">{t('title')} - Teacher Mode</h1>
    </div>
  )
} 