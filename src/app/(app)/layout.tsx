"use client"

import { MainHeader } from '@/components/main-header'
import { MainNav } from '@/components/main-nav'
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { useAuthContext } from '@/context/AuthContext'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuthContext()

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <MainNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <MainHeader />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
