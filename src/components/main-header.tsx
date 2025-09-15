import { SidebarTrigger } from "@/components/ui/sidebar"
import { UserNav } from "@/components/user-nav"

export function MainHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
        <div className="md:hidden">
            <SidebarTrigger />
        </div>
      <div className="flex-1" />
      <UserNav />
    </header>
  )
}
