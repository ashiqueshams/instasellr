import { useState } from "react";
import { Package, ShoppingCart, LayoutDashboard, Settings, LogOut, Menu, X, Layers, Link2, Truck } from "lucide-react";
import { NavLink, useLocation, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import OrderNotification from "@/components/OrderNotification";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Products", icon: Package, path: "/dashboard/products" },
  { label: "Bundles", icon: Layers, path: "/dashboard/bundles" },
  { label: "Links", icon: Link2, path: "/dashboard/links" },
  { label: "Orders", icon: ShoppingCart, path: "/dashboard/orders" },
  { label: "Delivery", icon: Truck, path: "/dashboard/delivery" },
  { label: "Settings", icon: Settings, path: "/dashboard/settings" },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-card border-b border-border flex items-center justify-between px-4 h-14 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-foreground hover:bg-muted transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="font-heading font-bold text-base text-foreground">StoreSaaS</h2>
        <div className="w-10" />
      </header>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 z-50 w-64 bg-card border-r border-border flex flex-col shrink-0
          transition-transform duration-250 ease-out
          md:static md:translate-x-0 md:w-60
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-lg text-foreground">StoreSaaS</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Dashboard</p>
          </div>
          <button
            onClick={closeSidebar}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted md:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 h-10 rounded-lg text-sm font-body font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 h-10 rounded-lg text-sm font-body font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        <div className="p-4 sm:p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
