"use client";

import qs from "query-string";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useMutation } from '@tanstack/react-query';

import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { useMediaQuery } from "@/hooks/use-media-query";

export const SearchInput = () => {
  const [value, setValue] = useState("");
  const debouncedValue = useDebounce(value);
  const isMobile = useMediaQuery("(max-width: 640px)");

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentCategoryId = searchParams.get("categoryId");
  const currentPriceRange = searchParams.get("priceRange");
  const currentSortBy = searchParams.get("sortBy");
  
  // Using useMutation instead of useEffect for handling URL updates
  const { mutate: updateSearchParams } = useMutation({
    mutationFn: (searchValue: string) => {
      const url = qs.stringifyUrl({
        url: pathname,
        query: {
          categoryId: currentCategoryId,
          title: searchValue,
          priceRange: currentPriceRange,
          sortBy: currentSortBy
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
  }, [debouncedValue, currentCategoryId, currentPriceRange, currentSortBy, updateSearchParams]);

  return (
    <div className="relative w-full max-w-[250px] xs:max-w-[280px] sm:max-w-none sm:w-[300px]">
      <Search
        className="h-4 w-4 absolute top-3 left-3 text-slate-600"
      />
      <Input
        onChange={(e) => setValue(e.target.value)}
        value={value}
        className="w-full pl-9 rounded-full bg-slate-100 focus-visible:ring-slate-200 touch-target"
        placeholder={isMobile ? "Search..." : "Search for a course"}
      />
    </div>
  )
}