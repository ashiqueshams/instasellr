import { Search, Bell, ExternalLink } from "lucide-react";
import { useStore } from "@/hooks/use-store";

interface Props {
  onSearchClick?: () => void;
}

export default function DashboardTopBar({ onSearchClick }: Props) {
  const { store } = useStore();
  const storeUrl = store ? `/store/${store.slug}` : "#";

  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <a
          href={storeUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-border bg-card text-sm font-body font-medium text-foreground hover:bg-muted transition-colors"
        >
          View store
          <ExternalLink className="w-3.5 h-3.5 opacity-60" />
        </a>
        <button
          onClick={onSearchClick}
          aria-label="Search"
          className="w-9 h-9 rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors"
        >
          <Search className="w-4.5 h-4.5" />
        </button>
        <button
          aria-label="Notifications"
          className="relative w-9 h-9 rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors"
        >
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />
        </button>
      </div>
    </div>
  );
}
