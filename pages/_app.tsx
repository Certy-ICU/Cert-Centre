import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { IntlProvider } from 'react-intl';
import en from '../messages/en.json';
import es from '../messages/es.json';
import { ClerkProvider } from '@clerk/nextjs';
import { ToastProvider } from '@/components/providers/toaster-provider';
import { ConfettiProvider } from '@/components/providers/confetti-provider';
import QueryProvider from '@/components/providers/query-provider';

const messages = {
  en,
  es,
};

export default function App({ Component, pageProps }: AppProps) {
  const { locale } = useRouter();
  const currentLocale = locale || 'en';

  return (
    <ClerkProvider>
      <IntlProvider locale={currentLocale} messages={messages[currentLocale as keyof typeof messages]}>
        <QueryProvider>
          <ConfettiProvider />
          <ToastProvider />
          <Component {...pageProps} />
        </QueryProvider>
      </IntlProvider>
    </ClerkProvider>
  );
} 