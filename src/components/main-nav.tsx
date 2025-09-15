"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  LayoutGrid,
  BookCheck,
  BrainCog,
  Settings,
  HelpCircle,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarGroupLabel,
  SidebarGroup,
  SidebarGroupContent,
  SidebarFooter,
  SidebarMenuBadge,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { BrainCircuit } from "lucide-react"

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
        <SidebarGroupLabel>MAIN NAVIGATION</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/dashboard" passHref>
                <SidebarMenuButton
                  asChild
                  size="lg"
                  isActive={isActive("/dashboard")}
                  tooltip="Dashboard"
                >
                  <>
                    <LayoutDashboard />
                    <div className="flex flex-col">
                      <span>Dashboard</span>
                      <span className="text-xs text-muted-foreground">
                        Overview & Analytics
                      </span>
                    </div>
                  </>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/study" passHref>
                <SidebarMenuButton
                  asChild
                  size="lg"
                  isActive={isActive("/study")}
                  tooltip="Study Zone"
                >
                   <>
                    <LayoutGrid />
                    <div className="flex flex-col">
                      <span>Study Zone</span>
                       <span className="text-xs text-muted-foreground">
                        Summaries, Quizzes & more
                      </span>
                    </div>
                    {isActive("/study") && <SidebarMenuBadge />}
                  </>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg" disabled>
                <>
                  <BookCheck />
                   <div className="flex flex-col">
                    <span>In-depth Analysis</span>
                    <span className="text-xs text-muted-foreground">
                      Review of Classified Books
                    </span>
                  </div>
                </>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/settings" passHref>
                <SidebarMenuButton
                  asChild
                  size="lg"
                  isActive={isActive("/settings")}
                  tooltip="Settings"
                >
                  <>
                    <BrainCog />
                    <div className="flex flex-col">
                       <span>Model Settings</span>
                      <span className="text-xs text-muted-foreground">
                        AI Training & Settings
                      </span>
                    </div>
                  </>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>OTHER</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg" disabled>
                <>
                  <Settings />
                  <span>Admin Settings</span>
                </>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg" disabled>
                <>
                  <HelpCircle />
                  <span>Help & Support</span>
                </>
              </SidebarMenuButton>
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
