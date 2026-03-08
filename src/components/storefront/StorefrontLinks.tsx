import { Store } from "@/data/sampleData";

interface StoreLink {
  id: string;
  label: string;
  url: string;
  position: number;
  is_active: boolean;
}

interface StorefrontLinksProps {
  links: StoreLink[];
  store: Store;
}

export default function StorefrontLinks({ links, store }: StorefrontLinksProps) {
  if (links.length === 0) return null;

  const textColor = store.text_color || undefined;
  const borderColor = store.accent_color || store.text_color || undefined;

  return (
    <div className="flex flex-col gap-3 w-full">
      {links.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-14 rounded-xl border-2 flex items-center justify-center text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            borderColor: borderColor,
            color: textColor,
            fontFamily: `'${store.font_body}', sans-serif`,
          }}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
