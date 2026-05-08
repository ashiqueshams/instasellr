import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Star, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Store } from "@/data/sampleData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  review_text: string;
  created_at: string;
  owner_response: string | null;
  owner_response_at: string | null;
}

function StarRow({ rating, size = 14, interactive = false, onChange }: { rating: number; size?: number; interactive?: boolean; onChange?: (n: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(s)}
          className={interactive ? "cursor-pointer" : "cursor-default"}
        >
          <Star size={size} className={s <= rating ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"} />
        </button>
      ))}
    </div>
  );
}

export default function StorefrontReviews() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!slug) return;
    const { data: s } = await supabase.from("stores").select("*").eq("slug", slug).maybeSingle();
    if (!s) { setLoading(false); return; }
    setStore(s as any);
    const { data } = await (supabase
      .from("reviews" as any)
      .select("id,customer_name,rating,review_text,created_at,owner_response,owner_response_at,is_visible")
      .eq("store_id", s.id)
      .eq("is_visible", true)
      .order("created_at", { ascending: false }) as any);
    setReviews((data || []) as Review[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [slug]);

  const stats = useMemo(() => {
    if (reviews.length === 0) return { avg: 0, total: 0, dist: [0, 0, 0, 0, 0] };
    const dist = [0, 0, 0, 0, 0];
    let sum = 0;
    reviews.forEach((r) => { dist[r.rating - 1]++; sum += r.rating; });
    return { avg: sum / reviews.length, total: reviews.length, dist };
  }, [reviews]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    if (rating === 0) return toast.error("Select a rating");
    if (!name.trim() || !email.trim()) return toast.error("Name & email required");
    setSubmitting(true);
    const { error } = await (supabase.from("reviews").insert({
      store_id: store.id,
      customer_name: name.trim(),
      customer_email: email.trim(),
      rating,
      review_text: text.trim(),
    }) as any);
    if (error) toast.error("Failed to submit");
    else {
      toast.success("Review submitted! Pending business approval.");
      setShowForm(false); setName(""); setEmail(""); setRating(0); setText("");
    }
    setSubmitting(false);
  };

  const timeAgo = (d: string) => {
    const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    if (days < 1) return "Today";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  };

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  if (!store) return <div className="min-h-screen bg-white flex items-center justify-center text-sm">Store not found</div>;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[480px] mx-auto px-5 py-8">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate(`/store/${slug}`)} className="w-8 h-8 rounded-full bg-card flex items-center justify-center hover:bg-muted">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h1 className="font-heading font-bold text-xl">Ratings & Reviews</h1>
        </div>

        <div className="flex gap-6 items-start mb-6">
          <div className="text-center">
            <p className="text-5xl font-bold leading-none">{stats.avg > 0 ? stats.avg.toFixed(1) : "—"}</p>
            <p className="text-[11px] text-muted-foreground mt-1">out of 5</p>
            {stats.total > 0 && <p className="text-[11px] text-muted-foreground">{stats.total} Rating{stats.total !== 1 ? "s" : ""}</p>}
          </div>
          <div className="flex-1 flex flex-col gap-1">
            {[5, 4, 3, 2, 1].map((s) => {
              const pct = stats.total > 0 ? (stats.dist[s - 1] / stats.total) * 100 : 0;
              return (
                <div key={s} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-right text-muted-foreground">{s}</span>
                  <Star size={10} className="fill-yellow-400 text-yellow-400 shrink-0" />
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm font-medium mb-4"
          style={{ color: store.accent_color || "#ff4545" }}
        >
          {showForm ? "Cancel" : "Write a Review"}
        </button>

        {showForm && (
          <form onSubmit={submit} className="bg-muted/30 rounded-2xl p-4 flex flex-col gap-3 border border-border/50 mb-5">
            <div>
              <p className="text-sm font-medium mb-1">Your Rating</p>
              <StarRow rating={rating} size={28} interactive onChange={setRating} />
            </div>
            <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
            <Input type="email" placeholder="Your email (not shown)" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
            <Textarea placeholder="Share your experience…" value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={1000} />
            <Button type="submit" disabled={submitting} className="rounded-xl" style={{ backgroundColor: store.accent_color || "#ff4545" }}>
              {submitting ? "Submitting…" : "Submit Review"}
            </Button>
          </form>
        )}

        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No reviews yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.map((r) => (
              <div key={r.id} className="bg-muted/30 rounded-2xl p-4 border border-border/50">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-sm">{r.customer_name}</p>
                  <span className="text-[11px] text-muted-foreground">{timeAgo(r.created_at)}</span>
                </div>
                <StarRow rating={r.rating} size={13} />
                {r.review_text && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{r.review_text}</p>}
                {r.owner_response && (
                  <div className="mt-3 pl-3 border-l-2 border-border">
                    <p className="text-[11px] font-semibold mb-0.5">Developer Response</p>
                    {r.owner_response_at && <span className="text-[10px] text-muted-foreground">{timeAgo(r.owner_response_at)}</span>}
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{r.owner_response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
