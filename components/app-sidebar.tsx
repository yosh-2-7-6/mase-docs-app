"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import {
  ChevronUp,
  Home,
  FileCheck,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  RefreshCw,
  Palette,
  Sun,
  Moon,
  Laptop,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

// Menu items for the main navigation
const mainNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Mase Checker",
    url: "/dashboard/mase-checker",
    icon: FileCheck,
  },
  {
    title: "Mase Generator",
    url: "/dashboard/mase-generator",
    icon: FileText,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [user, setUser] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    fetchUser()
    setMounted(true)
  }, [])

  const getThemeIcon = () => {
    if (!mounted) return <Palette className="mr-2 size-4" />
    switch (theme) {
      case "light":
        return <Sun className="mr-2 size-4" />
      case "dark":
        return <Moon className="mr-2 size-4" />
      default:
        return <Laptop className="mr-2 size-4" />
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/sign-in")
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <FileText className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Mase Docs</span>
                  <span className="text-xs text-muted-foreground">Document Generation</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    {loading ? (
                      <RefreshCw className="size-4 animate-spin" />
                    ) : (
                      <span className="text-xs font-semibold">
                        {user?.email?.charAt(0).toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">
                      {loading ? "Loading..." : (user?.email || "User")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {loading ? "" : "Account"}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-popper-anchor-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/billing" className="cursor-pointer">
                    <CreditCard className="mr-2 size-4" />
                    Billing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="cursor-pointer">
                    <Settings className="mr-2 size-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="cursor-pointer">
                    {getThemeIcon()}
                    Theme
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem 
                      onClick={() => setTheme("light")} 
                      className="cursor-pointer"
                    >
                      <Sun className="mr-2 size-4" />
                      Light
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setTheme("dark")} 
                      className="cursor-pointer"
                    >
                      <Moon className="mr-2 size-4" />
                      Dark
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setTheme("system")} 
                      className="cursor-pointer"
                    >
                      <Laptop className="mr-2 size-4" />
                      System
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 size-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}