"use client"

import { MainHeader } from '@/components/main-header'
import { MainNav } from '@/components/main-nav'
import { StreakAnimation } from '@/components/streak-animation'
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import withAuth from '@/components/withAuth'

function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
        <StreakAnimation />
      </SidebarInset>
    </SidebarProvider>
  )
}

export default withAuth(AppLayout);
