import type { Metadata } from 'next'
import './globals.css'
import AppHeader from '@/components/AppHeader'
import FloatingMenu from '@/components/FloatingMenu'

export const metadata: Metadata = {
  title: 'READ TO EVOLUTION - 本から育つ一輪の花',
  description: '読書レビュー × 学習管理OS',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <AppHeader />
        {children}
        <FloatingMenu />
      </body>
    </html>
  )
}
