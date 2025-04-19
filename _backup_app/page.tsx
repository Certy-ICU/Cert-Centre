import { redirect } from 'next/navigation'

// Force static generation 
export const dynamic = 'force-static'
// Disable all client-side components in this route
export const runtime = 'nodejs'

export default function Home() {
  redirect('/en')
} 