import './globals.css'

export const metadata = {
  title: 'Loading...',
  description: 'Please wait...',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
