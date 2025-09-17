"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Settings,
  BrainCircuit,
  BookOpenCheck,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "./ui/button"

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
      <SidebarMenu className="mt-4">
        <NavItem
          href="/dashboard"
          isActive={isActive("/dashboard")}
          icon={<LayoutDashboard size={20} />}
          title="Dashboard"
          description="Overview & Analytics"
        />
        <NavItem
          href="/study"
          isActive={isActive("/study")}
          icon={<BookOpenCheck size={20} />}
          title="Study"
          description="Generate notes & quizzes"
        />
        <NavItem
          href="/friends"
          isActive={isActive("/friends")}
          icon={<Users size={20} />}
          title="Friends"
          description="Find and connect with users"
        />
        <NavItem
          href="/settings"
          isActive={isActive("/settings")}
          icon={<Settings size={20} />}
          title="Settings"
          description="Manage account & preferences"
        />
      </SidebarMenu>
      <SidebarFooter className="mt-auto">
        <p className="text-xs text-muted-foreground">© 2024 UstaadGPT</p>
      </SidebarFooter>
    </>
  )
}

function NavItem({
  href,
  isActive,
  icon,
  title,
  description,
}: {
  href: string
  isActive: boolean
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <SidebarMenuItem>
      <Link href={href} passHref>
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className={cn("h-auto w-full justify-start p-3")}
          asChild
        >
          <div className="flex items-center w-full">
            <div
              className={cn(
                "mr-4 flex h-10 w-10 items-center justify-center rounded-lg",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted-foreground/20 text-muted-foreground"
              )}
            >
              {icon}
            </div>
            <div className="flex flex-col items-start">
              <span className="font-semibold">{title}</span>
              {description && (
                <span className="text-xs text-muted-foreground">
                  {description}
                </span>
              )}
            </div>
            {isActive && (
              <span className="ml-auto h-2 w-2 rounded-full bg-primary" />
            )}
          </div>
        </Button>
      </Link>
    </SidebarMenuItem>
  )
}
