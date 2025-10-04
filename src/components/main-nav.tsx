
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Settings,
  BrainCircuit,
  BookOpenCheck,
  Users,
  Inbox,
  Library,
  Award,
  Swords,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { Separator } from "./ui/separator"
import { Button } from "./ui/button"

export function MainNav() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">UstaadGPT</span>
        </Link>
      </SidebarHeader>
      <Separator />
      <SidebarMenu className="mt-4">
        <NavItem
          href="/dashboard"
          isActive={isActive("/dashboard")}
          icon={<LayoutDashboard size={20} />}
          title="Dashboard"
        />
        <NavItem
          href="/study"
          isActive={isActive("/study")}
          icon={<BookOpenCheck size={20} />}
          title="Study"
        />
        <NavItem
          href="/my-books"
          isActive={pathname.startsWith("/my-books")}
          icon={<Library size={20} />}
          title="My Books"
        />
         <NavItem
          href="/achievements"
          isActive={isActive("/achievements")}
          icon={<Award size={20} />}
          title="Achievements"
        />
        <NavItem
          href="/challenges"
          isActive={pathname.startsWith("/challenges")}
          icon={<Swords size={20} />}
          title="Challenges"
        />
        <NavItem
          href="/friends"
          isActive={isActive("/friends")}
          icon={<Users size={20} />}
          title="Friends"
        />
         <NavItem
          href="/inbox"
          isActive={isActive("/inbox")}
          icon={<Inbox size={20} />}
          title="Inbox"
        />
        <NavItem
          href="/settings"
          isActive={isActive("/settings")}
          icon={<Settings size={20} />}
          title="Settings"
        />
      </SidebarMenu>
    </>
  )
}

function NavItem({
  href,
  isActive,
  icon,
  title,
}: {
  href: string
  isActive: boolean
  icon: React.ReactNode
  title: string
}) {
  return (
    <SidebarMenuItem>
      <Link href={href} passHref>
        <Button
            variant={isActive ? "secondary" : "ghost"}
            className="w-full justify-start h-auto py-3 px-4"
        >
          <div className="flex items-center gap-4">
              {icon}
              <span className="font-semibold text-base">{title}</span>
          </div>
        </Button>
      </Link>
    </SidebarMenuItem>
  )
}
