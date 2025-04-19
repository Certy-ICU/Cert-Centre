import { Suspense } from 'react';
import { processUserVisit } from '@/lib/actions/streaks';

// Server Component that processes user visits and updates streaks
async function StreakUpdater() {
  // This will only run on the server
  await processUserVisit();
  // Return null as this component doesn't render anything visible
  return null;
}

// Client wrapper with Suspense to prevent blocking rendering
export default function StreakProcessor() {
  return (
    <Suspense fallback={null}>
      <StreakUpdater />
    </Suspense>
  );
} 