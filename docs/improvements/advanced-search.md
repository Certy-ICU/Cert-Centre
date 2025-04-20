# Implementing Advanced Search

This guide details steps to enhance the search functionality in the LMS, adding features like filtering, sorting, and potentially more sophisticated search logic.

## 1. Refine Existing Search API ✅

The search implementation has been enhanced in `app/(dashboard)/(routes)/search/page.tsx` and `actions/get-courses.ts` to provide the following functionality:

- **Enhanced API Query**: Modified the Prisma query in `getCourses` action to accept additional parameters:
    - **Category Filter** ✅: Filter courses by `categoryId` (already implemented)
    - **Price Filter** ✅: Added options to filter by price range:
      - Free courses (`price === 0`)
      - Paid courses (`price > 0`)
      - Low-priced courses (`0 < price <= 50`)
      - Medium-priced courses (`50 < price <= 100`)
      - High-priced courses (`price > 100`)
    - **Sorting** ✅: Implemented sorting options
      - By recency (newest first) - default
      - By oldest first
      - By price (low to high)
      - By price (high to low)

```typescript
// Implementation in actions/get-courses.ts
switch (priceRange) {
  case 'free':
    where.price = 0;
    break;
  case 'paid':
    where.price = { gt: 0 };
    break;
  case 'low':
    where.price = { gt: 0, lte: 50 };
    break;
  // ... additional price ranges
}

// Sorting implementation
switch (sortBy) {
  case 'recent':
    orderBy = { createdAt: "desc" };
    break;
  case 'oldest':
    orderBy = { createdAt: "asc" };
    break;
  // ... additional sorting options
}
```

## 2. Updated Frontend Search UI ✅

- **Created `SearchFilters` Component** ✅: Added a new component at `app/(dashboard)/(routes)/search/_components/filters.tsx` with:
    - Dropdown for price range filtering (All, Free, Paid, $0-$50, $50-$100, $100+)
    - Dropdown for sorting options (Most Recent, Oldest First, Price: Low to High, Price: High to Low)

- **Updated Search Page** ✅: Modified `app/(dashboard)/(routes)/search/page.tsx` to include the new filters component and pass the filter parameters to the `getCourses` function.

- **Updated URL Parameters** ✅: All components (search input, category selector, filter dropdowns) now preserve the other search parameters when updating their own parameter.

## 3. Enhanced Database Indexing ✅

- **Added Prisma Indexes** ✅: Updated `schema.prisma` with appropriate indexes for all fields used in filtering and sorting:
  
  ```prisma
  model Course {
    // ... existing fields
    
    @@index([categoryId])  // Already existed
    @@index([price])       // Added for price filtering/sorting
    @@index([createdAt])   // Added for sorting by creation date
    @@fulltext([title])    // Already existed
  }
  ```

## 4. Future Improvements (Not Yet Implemented) 🔄

### Consider Advanced Search Logic

- **Tagging System**: 
    - Add a `Tag` model to `schema.prisma` with a many-to-many relation to `Course`
    - Update the UI for teachers to add tags to courses
    - Modify the search API to allow filtering by tags

- **Weighted Search**: For more relevance-based sorting, consider moving beyond basic full-text search
    - Explore Prisma's relevance scoring if available for MySQL
    - Look into dedicated search engines for more complex requirements

- **Dedicated Search Engine**:
    - Consider integrating with Algolia, Elasticsearch, or similar for:
      - Typo tolerance
      - Faceting (dynamic filtering based on results)
      - Custom ranking algorithms
      - Synonyms handling
      - Better performance for large datasets

### Enhance UI/UX

- **Filter Pills/Chips**: Display active filters as removable pills/chips
- **Mobile Optimization**: Ensure the filter UI works well on smaller screens
- **Filter Persistence**: Save user filter preferences in local storage
- **Results Count**: Display the number of courses matching the current filters

## 5. Testing ✅

Testing for the implemented features has been completed, including:
- Various combinations of search queries, filters, and sorting options
- Verification that results accurately match the selected criteria
- URL parameter updates
- Parameter persistence when navigating between pages or reloading 