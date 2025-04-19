"use client";

import qs from "query-string";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useMutation } from '@tanstack/react-query';

import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";

export const SearchInput = () => {
  const [value, setValue] = useState("")
  const debouncedValue = useDebounce(value);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentCategoryId = searchParams.get("categoryId");
  
  // Using useMutation instead of useEffect for handling URL updates
  const { mutate: updateSearchParams } = useMutation({
    mutationFn: (searchValue: string) => {
      const url = qs.stringifyUrl({
        url: pathname,
        query: {
          categoryId: currentCategoryId,
          title: searchValue,
        }
      }, { skipEmptyString: true, skipNull: true });
      
      router.push(url);
      // Return a resolved promise since React Query expects a Promise
      return Promise.resolve();
    },
    // No need for onSuccess/onError callbacks for this simple case
  });

  // Watch for changes to debounced value and trigger the mutation
  useEffect(() => {
    if (debouncedValue !== undefined) {
      updateSearchParams(debouncedValue);
    }
  }, [debouncedValue, currentCategoryId, updateSearchParams]);

  return (
    <div className="relative">
      <Search
        className="h-4 w-4 absolute top-3 left-3 text-slate-600"
      />
      <Input
        onChange={(e) => setValue(e.target.value)}
        value={value}
        className="w-full max-w-[250px] sm:max-w-none sm:w-[300px] pl-9 rounded-full bg-slate-100 focus-visible:ring-slate-200"
        placeholder="Search for a course"
      />
    </div>
  )
}