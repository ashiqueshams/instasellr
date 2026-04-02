import { useState, useEffect, useMemo } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Store } from "@/data/sampleData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Review {
  id: string;
  store_id: string;
  customer_name: string;
  customer_email: string;
  rating: number;
  review_text: string;
  created_at: string;
  owner_response?: string | null;
  owner_response_at?: string | null;
}

interface ReviewsSectionProps {
  store: Store;
}

function StarRating({ rating, size = 16, interactive = false, onChange }: {
  rating: number;
  size?: number;
  interactive?: boolean;
  onChange?: (r: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          className={interactive ? "cursor-pointer" : "cursor-default"}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onChange?.(star)}
        >
          <Star
            size={size}
            className={`transition-colors ${
              star <= (hover || rating)
                ? "fill-yellow-400 text-yellow-400"
                : "fill-muted text-muted"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-3 text-right text-muted-foreground">{star}</span>
      <Star size={10} className="fill-yellow-400 text-yellow-400 shrink-0" />
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ReviewsSection({ store }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");

  useEffect(() => {
    const fetchReviews = async () => {
      const { data } = await supabase
        .from("reviews" as any)
        .select("*")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false }) as any;
      setReviews(data || []);
    };
    fetchReviews();
  }, [store.id]);

  const stats = useMemo(() => {
    if (reviews.length === 0) return { avg: 0, total: 0, dist: [0, 0, 0, 0, 0] };
    const dist = [0, 0, 0, 0, 0];
    let sum = 0;
    reviews.forEach((r) => { dist[r.rating - 1]++; sum += r.rating; });
    return { avg: sum / reviews.length, total: reviews.length, dist };
  }, [reviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { toast.error("Please select a rating"); return; }
    if (!name.trim()) { toast.error("Please enter your name"); return; }
    if (!email.trim()) { toast.error("Please enter your email"); return; }

    setSubmitting(true);
    const { error } = await (supabase.from("reviews" as any).insert({
      store_id: store.id,
      customer_name: name.trim(),
      customer_email: email.trim(),
      rating,
      review_text: text.trim(),
    }) as any);

    if (error) {
      toast.error("Failed to submit review");
    } else {
      toast.success("Review submitted!");
      setShowForm(false);
      setName(""); setEmail(""); setRating(0); setText("");
      // Refresh
      const { data } = await (supabase.from("reviews" as any).select("*").eq("store_id", store.id).order("created_at", { ascending: false }) as any);
      setReviews(data || []);
    }
    setSubmitting(false);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days < 1) return "Today";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-lg">Ratings & Reviews</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm font-medium"
          style={{ color: store.accent_color }}
        >
          {showForm ? "Cancel" : "Write a Review"}
        </button>
      </div>

      {/* Summary */}
      <div className="flex gap-6 items-start">
        <div className="text-center">
          <p className="text-5xl font-bold leading-none">{stats.avg > 0 ? stats.avg.toFixed(1) : "—"}</p>
          <p className="text-[11px] text-muted-foreground mt-1">out of 5</p>
          {stats.total > 0 && (
            <p className="text-[11px] text-muted-foreground">{stats.total} Rating{stats.total !== 1 ? "s" : ""}</p>
          )}
        </div>
        <div className="flex-1 flex flex-col gap-1">
          {[5, 4, 3, 2, 1].map((s) => (
            <RatingBar key={s} star={s} count={stats.dist[s - 1]} total={stats.total} />
          ))}
        </div>
      </div>

      {/* Write Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-muted/30 rounded-2xl p-4 flex flex-col gap-3 border border-border/50">
          <div>
            <p className="text-sm font-medium mb-1">Your Rating</p>
            <StarRating rating={rating} size={28} interactive onChange={setRating} />
          </div>
          <Input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            required
          />
          <Input
            type="email"
            placeholder="Your email (not shown publicly)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={255}
            required
          />
          <Textarea
            placeholder="Share your experience…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            rows={3}
          />
          <Button
            type="submit"
            disabled={submitting}
            className="rounded-xl"
            style={{ backgroundColor: store.accent_color }}
          >
            {submitting ? "Submitting…" : "Submit Review"}
          </Button>
        </form>
      )}

      {/* Review Cards */}
      {reviews.length > 0 ? (
        <div className="flex flex-col gap-3">
          {reviews.slice(0, 5).map((review) => (
            <div key={review.id} className="bg-muted/30 rounded-2xl p-4 border border-border/50">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-sm">{review.customer_name}</p>
                <span className="text-[11px] text-muted-foreground">{timeAgo(review.created_at)}</span>
              </div>
              <StarRating rating={review.rating} size={13} />
              {review.review_text && (
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{review.review_text}</p>
              )}
            </div>
          ))}
          {reviews.length > 5 && (
            <p className="text-xs text-center text-muted-foreground">
              Showing 5 of {reviews.length} reviews
            </p>
          )}
        </div>
      ) : !showForm && (
        <p className="text-sm text-muted-foreground text-center py-4">No reviews yet. Be the first!</p>
      )}
    </div>
  );
}
