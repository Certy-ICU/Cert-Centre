"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import qs from "query-string";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export const SearchFilters = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentTitle = searchParams.get("title") || "";
  const currentCategoryId = searchParams.get("categoryId") || "";
  const currentPriceRange = searchParams.get("priceRange") || "all";
  const currentSortBy = searchParams.get("sortBy") || "recent";
  
  const updateSearchParams = (name: string, value: string) => {
    const url = qs.stringifyUrl({
      url: pathname,
      query: {
        title: currentTitle,
        categoryId: currentCategoryId,
        priceRange: name === "priceRange" ? value : currentPriceRange,
        sortBy: name === "sortBy" ? value : currentSortBy,
      }
    }, { skipEmptyString: true, skipNull: true });
    
    router.push(url);
  };
  
  return (
    <div className="flex flex-wrap gap-4 items-center">
      <div>
        <Select
          value={currentPriceRange}
          onValueChange={(value) => updateSearchParams("priceRange", value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Price Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Prices</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="low">$0-$50</SelectItem>
            <SelectItem value="medium">$50-$100</SelectItem>
            <SelectItem value="high">$100+</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Select
          value={currentSortBy}
          onValueChange={(value) => updateSearchParams("sortBy", value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="priceAsc">Price: Low to High</SelectItem>
            <SelectItem value="priceDesc">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}; 