import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/hooks/use-store";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage } from "@/lib/imageUpload";
import { Loader2, X, ImageIcon, Upload } from "lucide-react";

const FONT_OPTIONS = [
  { label: "Syne", value: "Syne" },
  { label: "Inter", value: "Inter" },
  { label: "Space Grotesk", value: "Space Grotesk" },
  { label: "DM Sans", value: "DM Sans" },
  { label: "Playfair Display", value: "Playfair Display" },
  { label: "Outfit", value: "Outfit" },
  { label: "Plus Jakarta Sans", value: "Plus Jakarta Sans" },
  { label: "Bebas Neue", value: "Bebas Neue" },
  { label: "Poppins", value: "Poppins" },
  { label: "Manrope", value: "Manrope" },
];

const BODY_FONT_OPTIONS = [
  { label: "Manrope", value: "Manrope" },
  { label: "Inter", value: "Inter" },
  { label: "DM Sans", value: "DM Sans" },
  { label: "Outfit", value: "Outfit" },
  { label: "Plus Jakarta Sans", value: "Plus Jakarta Sans" },
  { label: "Poppins", value: "Poppins" },
  { label: "Space Grotesk", value: "Space Grotesk" },
];

const LAYOUT_OPTIONS = [
  { label: "List", value: "list" },
  { label: "Grid", value: "grid" },
];

const THEME_OPTIONS = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

const BANNER_MODE_OPTIONS = [
  { label: "Strip", value: "strip", desc: "Small banner at the top" },
  { label: "Full Page", value: "fullpage", desc: "Banner covers the entire background" },
];

const CARD_STYLE_OPTIONS = [
  { label: "Card", value: "card", desc: "Classic card with shadow" },
  { label: "Pill", value: "pill", desc: "Rounded pill buttons" },
  { label: "Outlined", value: "outlined", desc: "Border-only boxes" },
];

const SOCIAL_POSITION_OPTIONS = [
  { label: "Below Avatar", value: "header" },
  { label: "Below Products", value: "below_products" },
];

export default function DashboardSettings() {
  const { toast } = useToast();
  const { store, loading, setStore } = useStore();
   const [form, setForm] = useState({
     name: "",
     bio: "",
     avatar_initials: "",
     slug: "",
     accent_color: "#ff4545",
     font_heading: "Syne",
     font_body: "Manrope",
     layout: "list",
     theme: "light",
     background_color: "",
     banner_mode: "strip",
     card_style: "card",
     social_position: "below_products",
      text_color: "",
      x: "",
     instagram: "",
     youtube: "",
     tiktok: "",
      linkedin: "",
      facebook: "",
   });
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [footerFile, setFooterFile] = useState<File | null>(null);
  const [footerPreview, setFooterPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const footerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!store) return;
    setForm({
      name: store.name,
      bio: store.bio,
      avatar_initials: store.avatar_initials,
      slug: store.slug,
      accent_color: store.accent_color,
      font_heading: store.font_heading || "Syne",
       font_body: store.font_body || "Manrope",
       layout: store.layout || "list",
       theme: store.theme || "light",
       background_color: store.background_color || "",
       banner_mode: store.banner_mode || "strip",
       card_style: store.card_style || "card",
       social_position: store.social_position || "below_products",
        text_color: store.text_color || "",
        x: store.social_links?.x || "",
       instagram: store.social_links?.instagram || "",
       youtube: store.social_links?.youtube || "",
       tiktok: store.social_links?.tiktok || "",
       linkedin: store.social_links?.linkedin || "",
       facebook: store.social_links?.facebook || "",
     });
    setLogoPreview(store.logo_url || null);
    setBannerPreview(store.banner_url || null);
    setFooterPreview(store.footer_image_url || null);
  }, [store]);

  const handleImageFile = (file: File, setter: (f: File) => void, previewSetter: (s: string) => void) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Max 5MB", variant: "destructive" });
      return;
    }
    setter(file);
    previewSetter(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!store) return;
    setSaving(true);

    let logoUrl = logoPreview;
    let bannerUrl = bannerPreview;
    let footerUrl = footerPreview;

    if (logoFile) {
      const url = await uploadImage(logoFile, `logos/${store.id}`);
      if (url) logoUrl = url;
    }
    if (bannerFile) {
      const url = await uploadImage(bannerFile, `banners/${store.id}`);
      if (url) bannerUrl = url;
    }
    if (footerFile) {
      const url = await uploadImage(footerFile, `footers/${store.id}`);
      if (url) footerUrl = url;
    }

    const { error } = await supabase
      .from("stores")
      .update({
        name: form.name,
        bio: form.bio,
        avatar_initials: form.avatar_initials,
        slug: form.slug,
        accent_color: form.accent_color,
        font_heading: form.font_heading,
        font_body: form.font_body,
        layout: form.layout,
        logo_url: logoUrl,
        banner_url: bannerUrl,
        theme: form.theme,
        background_color: form.background_color || null,
        social_links: {
          x: form.x || undefined,
          instagram: form.instagram || undefined,
          youtube: form.youtube || undefined,
          tiktok: form.tiktok || undefined,
          linkedin: form.linkedin || undefined,
          facebook: form.facebook || undefined,
        },
      } as any)
      .eq("id", store.id);

    // Update new fields separately (may not be in types yet)
     await (supabase.from("stores").update({
        banner_mode: form.banner_mode,
        card_style: form.card_style,
        social_position: form.social_position,
        footer_image_url: footerUrl,
        text_color: form.text_color || null,
      } as any).eq("id", store.id) as any);

    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Settings saved!", description: "Your store has been updated." });
      setStore({
        ...store,
        name: form.name,
        bio: form.bio,
        avatar_initials: form.avatar_initials,
        slug: form.slug,
        accent_color: form.accent_color,
        font_heading: form.font_heading,
        font_body: form.font_body,
        layout: form.layout,
        logo_url: logoUrl,
        banner_url: bannerUrl,
        theme: form.theme,
        background_color: form.background_color || null,
        banner_mode: form.banner_mode,
         card_style: form.card_style,
         social_position: form.social_position,
         footer_image_url: footerUrl,
          text_color: form.text_color || null,
          social_links: { x: form.x, instagram: form.instagram, youtube: form.youtube, tiktok: form.tiktok, linkedin: form.linkedin, facebook: form.facebook },
       });
      setLogoFile(null);
      setBannerFile(null);
      setFooterFile(null);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const inputClass =
    "h-11 rounded-lg bg-background px-3.5 text-[16px] sm:text-sm font-body border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-shadow placeholder:text-muted-foreground w-full";

  const selectClass =
    "h-11 rounded-lg bg-background px-3 text-[16px] sm:text-sm font-body border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-shadow w-full appearance-none cursor-pointer";

  const ToggleGroup = ({ options, value, onChange, columns = 2 }: { options: { label: string; value: string; desc?: string }[]; value: string; onChange: (v: string) => void; columns?: number }) => (
    <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`h-10 rounded-lg text-sm font-body font-medium transition-all ${value === o.value ? "bg-primary text-primary-foreground" : "bg-background border border-border text-muted-foreground hover:text-foreground"}`}
          title={o.desc}
        >
          {o.label}
        </button>
      ))}
    </div>
  );

  const ImageUpload = ({ preview, onRemove, onUpload, inputRef, label, shape = "rect" }: any) => (
    <div>
      <label className="text-xs text-muted-foreground font-body mb-1.5 block">{label}</label>
      {preview ? (
        <div className="border border-border rounded-lg p-3">
          <div className="relative">
            <img src={preview} alt={label} className={`${shape === "circle" ? "w-12 h-12 rounded-full" : "w-full h-24 rounded-lg"} object-cover`} />
            <button onClick={onRemove} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} className="w-full border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-1.5 hover:border-primary/40 hover:bg-primary/5 transition-colors">
          <Upload className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Upload image (max 5MB)</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-xl">
      <h1 className="font-heading font-bold text-2xl text-foreground mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="bg-card rounded-xl p-5 store-shadow space-y-4">
          <p className="font-heading font-semibold text-sm text-foreground">Basic Info</p>
          <div>
            <label className="text-xs text-muted-foreground font-body mb-1 block">Store Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-body mb-1 block">Bio</label>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="rounded-lg bg-background px-3.5 py-3 text-[16px] sm:text-sm font-body border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-shadow placeholder:text-muted-foreground w-full resize-none h-20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground font-body mb-1 block">Avatar Initials</label>
              <input value={form.avatar_initials} maxLength={2} onChange={(e) => setForm({ ...form, avatar_initials: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body mb-1 block">Store URL Slug</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Storefront Style */}
        <div className="bg-card rounded-xl p-5 store-shadow space-y-4">
          <p className="font-heading font-semibold text-sm text-foreground">Storefront Style</p>

          <div>
            <label className="text-xs text-muted-foreground font-body mb-1.5 block">Banner Mode</label>
            <ToggleGroup options={BANNER_MODE_OPTIONS} value={form.banner_mode} onChange={(v) => setForm({ ...form, banner_mode: v })} />
            <p className="text-xs text-muted-foreground mt-1.5">
              {form.banner_mode === "fullpage" ? "Your banner image becomes the full-page background — great for immersive storefronts." : "Banner shows as a small strip at the top of your store."}
            </p>
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-body mb-1.5 block">Product Card Style</label>
            <ToggleGroup options={CARD_STYLE_OPTIONS} value={form.card_style} onChange={(v) => setForm({ ...form, card_style: v })} columns={3} />
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-body mb-1.5 block">Social Icons Position</label>
            <ToggleGroup options={SOCIAL_POSITION_OPTIONS} value={form.social_position} onChange={(v) => setForm({ ...form, social_position: v })} />
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-body mb-1.5 block">Product Layout</label>
            <ToggleGroup options={LAYOUT_OPTIONS} value={form.layout} onChange={(v) => setForm({ ...form, layout: v })} />
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-body mb-1.5 block">Theme</label>
            <ToggleGroup options={THEME_OPTIONS} value={form.theme} onChange={(v) => setForm({ ...form, theme: v })} />
          </div>
        </div>

        {/* Colors */}
        <div className="bg-card rounded-xl p-5 store-shadow space-y-4">
          <p className="font-heading font-semibold text-sm text-foreground">Colors</p>

          <div>
            <label className="text-xs text-muted-foreground font-body mb-1 block">Primary Color</label>
            <p className="text-[11px] text-muted-foreground mb-1.5">Used for buttons, borders, progress bar, etc.</p>
            <div className="flex items-center gap-2">
              <input type="color" value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} className="w-11 h-11 rounded-lg border border-border cursor-pointer" />
              <input value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} className={inputClass} />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-body mb-1 block">Text Color</label>
            <p className="text-[11px] text-muted-foreground mb-1.5">Used for all texts</p>
            <div className="flex items-center gap-2">
              <input type="color" value={form.text_color || "#1a1a1a"} onChange={(e) => setForm({ ...form, text_color: e.target.value })} className="w-11 h-11 rounded-lg border border-border cursor-pointer" />
              <input value={form.text_color} placeholder="#1a1a1a" onChange={(e) => setForm({ ...form, text_color: e.target.value })} className={inputClass} />
              {form.text_color && (
                <button onClick={() => setForm({ ...form, text_color: "" })} className="text-xs text-muted-foreground hover:text-destructive">Clear</button>
              )}
            </div>
          </div>

           <div>
             <label className="text-xs text-muted-foreground font-body mb-1 block">Background Color</label>
             <p className="text-[11px] text-muted-foreground mb-1.5">Used for the background</p>
             <div className="flex items-center gap-2">
               <input type="color" value={form.background_color || "#f5f4f0"} onChange={(e) => setForm({ ...form, background_color: e.target.value })} className="w-11 h-11 rounded-lg border border-border cursor-pointer" />
               <input value={form.background_color} placeholder="#f5f4f0" onChange={(e) => setForm({ ...form, background_color: e.target.value })} className={inputClass} />
               {form.background_color && (
                 <button onClick={() => setForm({ ...form, background_color: "" })} className="text-xs text-muted-foreground hover:text-destructive">Clear</button>
               )}
             </div>
           </div>
           <p className="text-[11px] text-muted-foreground">Primary color is also used for bundle cards and social links.</p>
         </div>

        {/* Typography */}
        <div className="bg-card rounded-xl p-5 store-shadow space-y-4">
          <p className="font-heading font-semibold text-sm text-foreground">Typography</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground font-body mb-1 block">Heading Font</label>
              <select value={form.font_heading} onChange={(e) => setForm({ ...form, font_heading: e.target.value })} className={selectClass} style={{ fontFamily: form.font_heading }}>
                {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body mb-1 block">Body Font</label>
              <select value={form.font_body} onChange={(e) => setForm({ ...form, font_body: e.target.value })} className={selectClass} style={{ fontFamily: form.font_body }}>
                {BODY_FONT_OPTIONS.map((f) => <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-card rounded-xl p-5 store-shadow space-y-4">
          <p className="font-heading font-semibold text-sm text-foreground">Images</p>

          <ImageUpload
            preview={logoPreview}
            onRemove={() => { setLogoPreview(null); setLogoFile(null); }}
            onUpload={(f: File) => handleImageFile(f, setLogoFile, setLogoPreview)}
            inputRef={logoInputRef}
            label="Logo (replaces initials avatar)"
            shape="circle"
          />
          <input ref={logoInputRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0], setLogoFile, setLogoPreview)} className="hidden" />

          <ImageUpload
            preview={bannerPreview}
            onRemove={() => { setBannerPreview(null); setBannerFile(null); }}
            onUpload={(f: File) => handleImageFile(f, setBannerFile, setBannerPreview)}
            inputRef={bannerInputRef}
            label={form.banner_mode === "fullpage" ? "Banner (used as full page background)" : "Banner (header strip)"}
          />
          <input ref={bannerInputRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0], setBannerFile, setBannerPreview)} className="hidden" />

          <ImageUpload
            preview={footerPreview}
            onRemove={() => { setFooterPreview(null); setFooterFile(null); }}
            onUpload={(f: File) => handleImageFile(f, setFooterFile, setFooterPreview)}
            inputRef={footerInputRef}
            label="Footer Image (shown at the bottom of your store)"
          />
          <input ref={footerInputRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0], setFooterFile, setFooterPreview)} className="hidden" />
        </div>

        {/* Social Links */}
        <div className="bg-card rounded-xl p-5 store-shadow space-y-4">
          <p className="font-heading font-semibold text-sm text-foreground">Social Links</p>
          {(["x", "instagram", "youtube", "tiktok", "linkedin", "facebook"] as const).map((key) => (
            <div key={key}>
              <label className="text-xs text-muted-foreground font-body mb-1 block capitalize">{key === "x" ? "X (Twitter)" : key}</label>
              <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={`https://${key}.com/...`} className={inputClass} />
            </div>
          ))}
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-11 w-full rounded-lg bg-primary text-primary-foreground font-heading font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Settings
        </button>
      </div>
    </div>
  );
}
