"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, BrainCircuit, LayoutDashboard, Settings } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarGroupLabel,
  SidebarGroup,
  SidebarGroupContent,
  SidebarFooter
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

export function MainNav() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">UstaadGPT</span>
        </div>
      </SidebarHeader>
      <Separator />
      <SidebarGroup>
        <SidebarGroupLabel>Menu</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/dashboard" passHref legacyBehavior>
                <SidebarMenuButton asChild isActive={isActive('/dashboard')} tooltip="Dashboard">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/study" passHref legacyBehavior>
                <SidebarMenuButton asChild isActive={isActive('/study')} tooltip="Study Zone">
                  <BookOpen />
                  <span>Study Zone</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/settings" passHref legacyBehavior>
                <SidebarMenuButton asChild isActive={isActive('/settings')} tooltip="Settings">
                  <Settings />
                  <span>Settings</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarFooter className="mt-auto">
        <p className="text-xs text-muted-foreground">© 2024 UstaadGPT</p>
      </SidebarFooter>
    </>
  )
}
