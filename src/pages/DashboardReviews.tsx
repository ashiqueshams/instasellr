import { useState, useEffect } from "react";
import { Star, MessageSquare, Send, Eye, EyeOff } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Review {
  id: string;
  store_id: string;
  customer_name: string;
  customer_email: string;
  rating: number;
  review_text: string;
  created_at: string;
  owner_response: string | null;
  owner_response_at: string | null;
  is_visible: boolean;
}

export default function DashboardReviews() {
  const { store, loading: storeLoading } = useStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!store) return;
    const fetch = async () => {
      const { data } = await (supabase
        .from("reviews")
        .select("*")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false }) as any);
      setReviews(data || []);
      setLoading(false);
    };
    fetch();
  }, [store]);

  const handleRespond = async (reviewId: string) => {
    if (!responseText.trim()) return;
    setSubmitting(true);
    const { error } = await (supabase
      .from("reviews")
      .update({
        owner_response: responseText.trim(),
        owner_response_at: new Date().toISOString(),
      })
      .eq("id", reviewId) as any);

    if (error) {
      toast.error("Failed to submit response");
    } else {
      toast.success("Response posted!");
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, owner_response: responseText.trim(), owner_response_at: new Date().toISOString() }
            : r
        )
      );
      setRespondingTo(null);
      setResponseText("");
    }
    setSubmitting(false);
  };

  if (storeLoading || loading) {
    return <p className="text-muted-foreground text-sm p-6">Loading reviews…</p>;
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-heading font-bold mb-1">Reviews</h1>
      <p className="text-muted-foreground text-sm mb-6">
        {reviews.length} review{reviews.length !== 1 ? "s" : ""} · Average: {avgRating} ★
      </p>

      {reviews.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No reviews yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm">{review.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{review.customer_email}</p>
                </div>
                <div className="text-right">
                  <div className="flex gap-0.5 justify-end">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        className={s <= review.rating ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-muted/40 border border-border">
                {review.is_visible ? <Eye className="w-3.5 h-3.5 text-foreground" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                <span className="text-xs flex-1">{review.is_visible ? "Visible on storefront reviews page" : "Hidden from storefront"}</span>
                <Switch
                  checked={review.is_visible}
                  onCheckedChange={async (val) => {
                    const { error } = await (supabase.from("reviews").update({ is_visible: val } as any).eq("id", review.id) as any);
                    if (error) { toast.error("Failed to update"); return; }
                    setReviews((prev) => prev.map((r) => r.id === review.id ? { ...r, is_visible: val } : r));
                  }}
                />
              </div>

              {review.review_text && (
                <p className="text-sm text-foreground mb-3">{review.review_text}</p>
              )}

              {review.owner_response && (
                <div className="bg-muted/50 rounded-lg p-3 border-l-2 border-primary mb-2">
                  <p className="text-[11px] font-semibold text-foreground mb-1">Your Response</p>
                  <p className="text-sm text-muted-foreground">{review.owner_response}</p>
                  {review.owner_response_at && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(review.owner_response_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {!review.owner_response && respondingTo !== review.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => { setRespondingTo(review.id); setResponseText(""); }}
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-1" />
                  Respond
                </Button>
              )}

              {respondingTo === review.id && (
                <div className="flex flex-col gap-2 mt-2">
                  <Textarea
                    placeholder="Write your response…"
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    rows={3}
                    maxLength={1000}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setRespondingTo(null)}>Cancel</Button>
                    <Button
                      size="sm"
                      disabled={submitting || !responseText.trim()}
                      onClick={() => handleRespond(review.id)}
                    >
                      <Send className="w-3.5 h-3.5 mr-1" />
                      {submitting ? "Posting…" : "Post Response"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
