import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Check, Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Locale {
  name: string;
  code: string;
}

const locales: Locale[] = [
  { name: 'English', code: 'en' },
  { name: 'Español', code: 'es' },
];

export default function LanguageSwitcher() {
  const router = useRouter();
  const { pathname, asPath, query } = router;
  
  const handleLanguageChange = (locale: string) => {
    router.push({ pathname, query }, asPath, { locale });
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-5 w-5" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((lang) => {
          const isActive = router.locale === lang.code;
          
          return (
            <DropdownMenuItem 
              key={lang.code} 
              className="cursor-pointer"
              onClick={() => handleLanguageChange(lang.code)}
            >
              <div className="flex items-center justify-between w-full">
                {lang.name}
                {isActive && <Check className="h-4 w-4 ml-2" />}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 