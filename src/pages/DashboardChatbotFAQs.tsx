import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "@/hooks/use-store";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface FAQ {
  id: string;
  store_id: string;
  question: string;
  answer: string;
  keywords: string[] | null;
  language: string;
  position: number;
  is_active: boolean;
}

export default function DashboardChatbotFAQs() {
  const { store } = useStore();
  const [items, setItems] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!store) return;
    const { data } = await supabase
      .from("chatbot_faqs")
      .select("*")
      .eq("store_id", store.id)
      .order("position");
    setItems((data ?? []) as any);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  const addNew = async () => {
    if (!store) return;
    const { data, error } = await supabase
      .from("chatbot_faqs")
      .insert({
        store_id: store.id,
        question: "New question",
        answer: "Answer here",
        position: items.length,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setItems([...items, data as any]);
  };

  const update = async (id: string, patch: Partial<FAQ>) => {
    setItems(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };
  const persist = async (item: FAQ) => {
    const { error } = await supabase.from("chatbot_faqs").update({
      question: item.question,
      answer: item.answer,
      keywords: item.keywords,
      language: item.language,
      is_active: item.is_active,
    }).eq("id", item.id);
    if (error) toast.error(error.message);
    else toast.success("Saved");
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("chatbot_faqs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems(items.filter((i) => i.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/chatbot">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-heading font-bold">FAQs</h1>
            <p className="text-sm text-muted-foreground">
              Q&A pairs the bot uses on top of your product catalog and delivery rules.
            </p>
          </div>
        </div>
        <Button onClick={addNew}><Plus className="h-4 w-4" /> Add FAQ</Button>
      </div>

      {items.length === 0 && (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
          No FAQs yet. Add common questions like "Cash on delivery available?" or "Return policy".
        </CardContent></Card>
      )}

      <div className="space-y-3">
        {items.map((f) => (
          <Card key={f.id}>
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch checked={f.is_active} onCheckedChange={(v) => update(f.id, { is_active: v })} />
                  <span className="text-xs text-muted-foreground">{f.is_active ? "Active" : "Disabled"}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(f.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Question</Label>
                <Input value={f.question} onChange={(e) => update(f.id, { question: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Answer</Label>
                <Textarea
                  value={f.answer}
                  onChange={(e) => update(f.id, { answer: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Keywords (comma separated)</Label>
                  <Input
                    value={(f.keywords ?? []).join(", ")}
                    onChange={(e) => update(f.id, { keywords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                    placeholder="cod, cash on delivery, dhaka"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={f.language} onValueChange={(v) => update(f.id, { language: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Any</SelectItem>
                      <SelectItem value="bn">Bangla</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="benglish">Benglish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button size="sm" onClick={() => persist(f)}>Save</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
