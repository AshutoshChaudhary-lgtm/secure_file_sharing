import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Share2, 
  Users, 
  Upload, 
  Settings
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const location = useLocation();

  const sidebarLinks = [
    {
      title: "Home",
      icon: Home,
      href: "/",
    },
    {
      title: "Shared",
      icon: Share2,
      href: "/shared",
    },
    {
      title: "Friends",
      icon: Users,
      href: "/friends",
    },
  ];

  const isActiveLink = (href: string) => {
    // For home link, match exact path or /files path (which redirects to home)
    if (href === "/" && (location.pathname === "/" || location.pathname === "/files")) {
      return true;
    }
    // For other links, check if pathname starts with the href
    return href !== "/" && location.pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-[#333333] bg-sidebar transition-all duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex flex-col space-y-6 p-6 pt-20"> {/* Added pt-20 to move content down below navbar */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-black"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight">FileFlow</span>
          </Link>
        </div>
        
        <div className="space-y-1">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 border-[#333333] hover:bg-[#333333]"
            asChild
          >
            <Link to="/upload">
              <Upload className="h-4 w-4" />
              Upload Files
            </Link>
          </Button>
        </div>
        
        <nav className="flex-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 mb-2">
            Navigation
          </div>
          <div className="space-y-1">
            {sidebarLinks.map((link) => (
              <Button
                key={link.href}
                variant={isActiveLink(link.href) ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2",
                  isActiveLink(link.href) && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
                asChild
              >
                <Link to={link.href}>
                  <link.icon className="h-4 w-4" />
                  {link.title}
                </Link>
              </Button>
            ))}
          </div>
        </nav>
        
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 mb-2">
            Settings
          </div>
          <Button variant="ghost" className="w-full justify-start gap-2" asChild>
            <Link to="/settings">
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
        
        <div className="mt-auto pt-4">
          <div className="rounded-lg bg-[#222222] p-4">
            <div className="mb-2 text-sm font-medium">Storage</div>
            <div className="mb-2 h-2 rounded-full bg-[#333333]">
              <div className="h-full w-1/2 rounded-full bg-white"></div>
            </div>
            <div className="text-xs text-sidebar-foreground/70">
              5 GB of 10 GB used
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
