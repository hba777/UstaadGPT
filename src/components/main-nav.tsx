
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
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Separator } from "./ui/separator"
import { Button } from "./ui/button"

export function MainNav() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname.startsWith(path)

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
          href="/my-books"
          isActive={isActive("/my-books")}
          icon={<Library size={20} />}
          title="My Books"
          description="Review your saved books"
        />
         <NavItem
          href="/achievements"
          isActive={isActive("/achievements")}
          icon={<Award size={20} />}
          title="Achievements"
          description="View your earned badges"
        />
        <NavItem
          href="/challenges"
          isActive={isActive("/challenges")}
          icon={<Swords size={20} />}
          title="Challenges"
          description="Take on quiz challenges"
        />
        <NavItem
          href="/friends"
          isActive={isActive("/friends")}
          icon={<Users size={20} />}
          title="Friends"
          description="Find users & view leaderboard"
        />
         <NavItem
          href="/inbox"
          isActive={isActive("/inbox")}
          icon={<Inbox size={20} />}
          title="Inbox"
          description="Manage your friend requests"
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
        <div
          className={cn(
            "h-auto w-full justify-start p-3 relative rounded-md flex items-center group",
            isActive ? "bg-secondary" : "hover:bg-accent/50"
          )}
        >
          <div
            className={cn(
              "mr-4 flex h-10 w-10 items-center justify-center rounded-lg",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {icon}
          </div>
          <div className="flex flex-col items-start">
            <span className={cn("font-semibold", isActive && "text-secondary-foreground")}>{title}</span>
            {description && (
              <span className={cn("text-xs text-muted-foreground", isActive && "text-secondary-foreground/80")}>
                {description}
              </span>
            )}
          </div>
          {isActive && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
          )}
        </div>
      </Link>
    </SidebarMenuItem>
  )
}
