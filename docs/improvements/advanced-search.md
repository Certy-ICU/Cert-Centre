# Implementing Advanced Search

This guide details steps to enhance the search functionality in the LMS, adding features like filtering, sorting, and potentially more sophisticated search logic.

## 1. Refine Existing Search API

The current search seems to be implemented in `app/(dashboard)/(routes)/search/page.tsx` using Prisma's full-text search capabilities on the `Course` model (`@@fulltext([title])` in `schema.prisma`).

- **Review API Endpoint**: Identify the API route handling the search query (likely fetching data in the Search page component or via a dedicated API route in `app/api/`).
- **Add Filters**: Modify the Prisma query in the API route/server component to accept additional parameters for filtering.
    - **Category Filter**: Allow filtering courses by `categoryId`.
    - **Price Filter**: Add options to filter by price range (e.g., free, paid tiers).
    - **Published Status**: Allow filtering by `isPublished` (especially relevant for teacher views).

  ```typescript
  // Example Prisma query modification (in API route or Server Component)
  import { PrismaClient } from '@prisma/client';
  const prisma = new PrismaClient();

  async function searchCourses(query: string, categoryId?: string, price?: string /* ... other filters */) {
    const courses = await prisma.course.findMany({
      where: {
        isPublished: true, // Assuming general search shows only published
        title: {
          search: query, // Using full-text search
        },
        categoryId: categoryId ? categoryId : undefined,
        // Add more filter conditions based on parameters
        price: price === 'free' ? 0 : (price === 'paid' ? { gt: 0 } : undefined),
      },
      include: {
        category: true,
        chapters: {
          where: {
            isPublished: true,
          },
          select: {
            id: true,
          }
        },
        purchases: {
          where: {
            // Potentially filter purchases based on logged-in user if needed
          }
        }
      },
      orderBy: {
        // Add sorting options later
        createdAt: 'desc',
      }
    });
    return courses;
  }
  ```

- **Add Sorting**: Implement sorting options (e.g., relevance, newest, price, popularity).
    - Modify the Prisma query to include `orderBy` based on input parameters.
    - Popularity might require tracking view counts or enrollment numbers (adding new fields to the `Course` model).

## 2. Update Frontend Search UI

- **Modify `components/search-input.tsx`**: Enhance this component or create new components to include filter and sort controls.
    - Add dropdowns or multi-select components (using Shadcn UI) for categories, price ranges, etc.
    - Add a dropdown for sorting options.
- **Update State Management**: Manage the state for the search query, selected filters, and sorting options in the search page component (`app/(dashboard)/(routes)/search/page.tsx`).
- **Trigger Search**: Modify the search trigger logic (`useEffect` in `search-input.tsx` or similar) to include the selected filters and sort parameters when fetching data.
- **Update URL Params**: Use `useRouter` and `useSearchParams` to reflect the search query, filters, and sort options in the URL for shareability and browser history.

## 3. Consider Advanced Search Logic (Optional)

- **Tagging System**: Implement a tagging system for courses.
    - Add a `Tag` model to `schema.prisma` with a many-to-many relation to `Course`.
    - Update the UI for teachers to add tags to courses.
    - Modify the search API to allow filtering by tags.
- **Weighted Search**: For more relevance-based sorting, consider moving beyond basic full-text search.
    - Explore Prisma's relevance scoring if available for MySQL or look into dedicated search engines.
- **Dedicated Search Engine (e.g., Algolia, Elasticsearch)**:
    - **Benefits**: Offers more advanced features like typo tolerance, faceting (dynamic filtering based on results), custom ranking, synonyms, and better performance for large datasets.
    - **Implementation**: Requires setting up the search engine, indexing course data from Prisma (using webhooks or batch jobs), and replacing the Prisma search query with API calls to the search engine.

## 4. Enhance Database Indexing

- **Review Prisma Schema**: Ensure appropriate database indexes are defined in `schema.prisma` for all fields used in filtering and sorting (e.g., `categoryId`, `price`, `createdAt`). Prisma adds indexes for relation fields (`@@index([categoryId])`), but you might need manual indexes for other filterable/sortable fields.

  ```prisma
  // prisma/schema.prisma
  model Course {
    // ... existing fields
    price Float?
    createdAt DateTime @default(now())

    @@index([categoryId])
    @@index([price])      // Add index for price filtering/sorting
    @@index([createdAt])  // Add index for sorting by creation date
    @@fulltext([title])
  }
  ```
- **Apply Migrations**: Run `npx prisma db push` or `npx prisma migrate dev` after adding indexes.

## 5. Testing

- Test various combinations of search queries, filters, and sorting options.
- Verify that the results are accurate and match the selected criteria.
- Test performance with a reasonable amount of course data.
- Ensure URL parameters update correctly and reloading the page with parameters restores the search state. 