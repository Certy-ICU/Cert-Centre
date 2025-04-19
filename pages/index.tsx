import { FormattedMessage, useIntl } from 'react-intl';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import LanguageSwitcher from '@/components/language-switcher-pages';

const inter = Inter({ subsets: ['latin'] });

export default function Home() {
  const intl = useIntl();

  return (
    <main className={`flex min-h-screen flex-col items-center justify-center p-4 ${inter.className}`}>
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          <FormattedMessage id="HomePage.title" defaultMessage="Welcome to Cert Centre" />
        </h1>
        <p className="text-xl mb-8">
          <FormattedMessage id="HomePage.description" defaultMessage="Your gateway to limitless learning." />
        </p>
        <Link href="/dashboard" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-md transition-colors">
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
} 