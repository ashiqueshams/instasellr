import { useState } from "react";
import { sampleProducts, sampleOrders, sampleStore, Product } from "@/data/sampleData";
import { Plus, Trash2, Package, ShoppingCart, DollarSign, Link2, ExternalLink, Copy, LayoutDashboard, Settings, X, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NavLink, useLocation, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Products", icon: Package, path: "/dashboard/products" },
  { label: "Orders", icon: ShoppingCart, path: "/dashboard/orders" },
  { label: "Settings", icon: Settings, path: "/dashboard/settings" },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-60 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-5 border-b border-border">
          <h2 className="font-heading font-bold text-lg text-foreground">StoreSaaS</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Dashboard</p>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
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
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
