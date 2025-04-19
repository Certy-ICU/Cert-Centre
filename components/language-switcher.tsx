'use client';

import Link from "next/link";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Check, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Locale {
  name: string;
  code: string;
}

const locales: Locale[] = [
  { name: "English", code: "en" },
  { name: "Español", code: "es" },
];

export const LanguageSwitcher = () => {
  const locale = useLocale();
  
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
          const isActive = locale === lang.code;
          
          return (
            <DropdownMenuItem 
              key={lang.code} 
              className="cursor-pointer"
              asChild
            >
              <Link href={`/${lang.code}`} className="flex items-center justify-between w-full">
                {lang.name}
                {isActive && <Check className="h-4 w-4 ml-2" />}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 