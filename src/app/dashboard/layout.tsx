import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { QuickAddFab } from '@/components/layout/quick-add-fab'
import { CommandPalette } from '@/components/layout/command-palette'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <Sidebar user={user} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} />
        <main
          className="flex-1 overflow-y-auto p-4 md:p-8"
          style={{ backgroundColor: 'var(--bg)' }}
        >
          <div className="mx-auto max-w-[1400px]">{children}</div>
        </main>
      </div>
      <QuickAddFab />
      <CommandPalette />
    </div>
  )
}
