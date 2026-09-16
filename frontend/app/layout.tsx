import '../styles/globals.css';

export const metadata = {
  title: 'NHAI Tender Automation System',
  description: 'Query vectorization and management system for NHAI tenders',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
