import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Copy, Check, Sparkles, MessageSquare } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Settings {
  id?: string;
  store_id: string;
  enabled: boolean;
  meta_page_id: string | null;
  meta_page_access_token: string | null;
  instagram_business_id: string | null;
  webhook_verify_token: string | null;
  tone: string;
  default_language: string;
  greeting_message: string | null;
  fallback_message: string | null;
  auto_reply_dms: boolean;
  auto_reply_story_replies: boolean;
  auto_reply_comments: boolean;
  auto_thank_story_mentions: boolean;
  comment_filter_questions_only: boolean;
  escalation_threshold: number;
  brain_enabled: boolean;
  recovery_enabled: boolean;
  recovery_delay_hours: number;
}

interface DiscountRules {
  id?: string;
  store_id: string;
  is_active: boolean;
  max_discount_percent: number;
  min_order_value: number;
  trigger_signals: string[];
  max_uses_per_customer: number;
}

interface Playbook {
  id: string;
  version: number;
  summary: string;
  strategy: any;
  sample_size: number;
  generated_at: string;
}

const defaults = (storeId: string): Settings => ({
  store_id: storeId,
  enabled: false,
  meta_page_id: "",
  meta_page_access_token: "",
  instagram_business_id: "",
  webhook_verify_token: null,
  tone: "friendly",
  default_language: "auto",
  greeting_message: "Assalamu alaikum! Kemon achen? Ki janen chan? 💕",
  fallback_message: "Apu ektu wait korun, amader team ekhuni reply dibe! 💕",
  auto_reply_dms: true,
  auto_reply_story_replies: true,
  auto_reply_comments: true,
  auto_thank_story_mentions: false,
  comment_filter_questions_only: true,
  escalation_threshold: 0.6,
  brain_enabled: true,
  recovery_enabled: false,
  recovery_delay_hours: 4,
});

const discountDefaults = (storeId: string): DiscountRules => ({
  store_id: storeId,
  is_active: false,
  max_discount_percent: 10,
  min_order_value: 0,
  trigger_signals: ["price_objection", "about_to_leave"],
  max_uses_per_customer: 1,
});

const ALL_TRIGGERS = [
  { id: "price_objection", label: "Price objection (customer says it's expensive)" },
  { id: "about_to_leave", label: "About to leave (silent / hesitant)" },
  { id: "repeat_customer", label: "Repeat customer" },
  { id: "high_value_cart", label: "High-value cart" },
];

export default function DashboardChatbot() {
  const { store } = useStore();
  const [s, setS] = useState<Settings | null>(null);
  const [rules, setRules] = useState<DiscountRules | null>(null);
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [retraining, setRetraining] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // test panel
  const [testInput, setTestInput] = useState("price?");
  const [testImageUrl, setTestImageUrl] = useState("");
  const [testRunning, setTestRunning] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    if (!store) return;
    (async () => {
      const [{ data: setData }, { data: ruleData }, { data: pbData }] = await Promise.all([
        supabase.from("chatbot_settings").select("*").eq("store_id", store.id).maybeSingle(),
        supabase.from("chatbot_discount_rules").select("*").eq("store_id", store.id).maybeSingle(),
        supabase.from("chatbot_playbook").select("*").eq("store_id", store.id).eq("is_active", true).order("version", { ascending: false }).limit(1).maybeSingle(),
      ]);
      setS(setData ? (setData as any) : defaults(store.id));
      setRules(ruleData ? (ruleData as any) : discountDefaults(store.id));
      setPlaybook(pbData as any);
      setLoading(false);
    })();
  }, [store]);

  const save = async () => {
    if (!s || !store) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("chatbot_settings")
      .upsert({ ...s, store_id: store.id }, { onConflict: "store_id" })
      .select()
      .single();
    if (rules) {
      await supabase
        .from("chatbot_discount_rules")
        .upsert({ ...rules, store_id: store.id }, { onConflict: "store_id" });
    }
    setSaving(false);
    if (error) toast.error(error.message);
    else { setS(data as any); toast.success("Settings saved"); }
  };

  const retrain = async () => {
    if (!store) return;
    setRetraining(true);
    const { error } = await supabase.functions.invoke("chatbot-learn", { body: { store_id: store.id } });
    setRetraining(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Retraining started — refresh in a moment");
    const { data: pbData } = await supabase.from("chatbot_playbook").select("*").eq("store_id", store.id).eq("is_active", true).order("version", { ascending: false }).limit(1).maybeSingle();
    setPlaybook(pbData as any);
  };

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-messenger-webhook`;
  const copyWebhook = async () => {
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const runTest = async () => {
    if (!store) return;
    setTestRunning(true);
    setTestResult(null);
    const { data, error } = await supabase.functions.invoke("chatbot-reply", {
      body: {
        store_id: store.id,
        text: testInput,
        image_urls: testImageUrl ? [testImageUrl] : [],
        source: "dm",
      },
    });
    setTestRunning(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setTestResult(data);
  };

  if (loading || !s) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Chatbot</h1>
          <p className="text-sm text-muted-foreground">
            Auto-reply to Instagram & Facebook DMs, story replies and comments — in Bangla, English or Benglish.
          </p>
        </div>
        <Link to="/dashboard/chatbot/faqs">
          <Button variant="outline" size="sm">Manage FAQs</Button>
        </Link>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="meta">Meta Connection</TabsTrigger>
          <TabsTrigger value="rules">Auto-engage Rules</TabsTrigger>
          <TabsTrigger value="test"><Sparkles className="h-3.5 w-3.5 mr-1" />Test the bot</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bot status</CardTitle>
              <CardDescription>Master switch. Replies stop entirely when off.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <Label>Enable chatbot</Label>
              <Switch checked={s.enabled} onCheckedChange={(v) => setS({ ...s, enabled: v })} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Voice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select value={s.tone} onValueChange={(v) => setS({ ...s, tone: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">Friendly (apu/bhai, light emoji)</SelectItem>
                      <SelectItem value="casual">Casual Benglish shop owner</SelectItem>
                      <SelectItem value="formal">Formal Bangla</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default language</Label>
                  <Select value={s.default_language} onValueChange={(v) => setS({ ...s, default_language: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto (match customer)</SelectItem>
                      <SelectItem value="bn">Bangla script</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="benglish">Benglish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fallback message (sent when bot escalates to human)</Label>
                <Textarea
                  value={s.fallback_message ?? ""}
                  onChange={(e) => setS({ ...s, fallback_message: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Greeting message (optional, used for first-time DMs)</Label>
                <Textarea
                  value={s.greeting_message ?? ""}
                  onChange={(e) => setS({ ...s, greeting_message: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meta connection */}
        <TabsContent value="meta" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Webhook URL</CardTitle>
              <CardDescription>Paste this into your Meta App → Webhooks → Page/Instagram subscription.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input value={webhookUrl} readOnly className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={copyWebhook}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Verify token (paste in Meta webhook setup)</Label>
                <Input value={s.webhook_verify_token ?? "(saved after first save)"} readOnly className="font-mono text-xs" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Page credentials</CardTitle>
              <CardDescription>From your Meta Developer App dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Facebook Page ID</Label>
                <Input value={s.meta_page_id ?? ""} onChange={(e) => setS({ ...s, meta_page_id: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Instagram Business Account ID</Label>
                <Input value={s.instagram_business_id ?? ""} onChange={(e) => setS({ ...s, instagram_business_id: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Page Access Token (long-lived)</Label>
                <Input
                  type="password"
                  value={s.meta_page_access_token ?? ""}
                  onChange={(e) => setS({ ...s, meta_page_access_token: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Stored privately in your store settings. Used only by the webhook to send replies.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules */}
        <TabsContent value="rules" className="space-y-3">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <RuleRow
                label="Auto-reply to DMs"
                desc="Direct messages in your IG/FB inbox."
                checked={s.auto_reply_dms}
                onChange={(v) => setS({ ...s, auto_reply_dms: v })}
              />
              <RuleRow
                label="Auto-reply to story replies"
                desc="When a customer replies to your IG story."
                checked={s.auto_reply_story_replies}
                onChange={(v) => setS({ ...s, auto_reply_story_replies: v })}
              />
              <RuleRow
                label="Auto-reply to comments (public + private DM)"
                desc="Replies publicly on the post and DMs the full answer."
                checked={s.auto_reply_comments}
                onChange={(v) => setS({ ...s, auto_reply_comments: v })}
              />
              <RuleRow
                label="Comment filter — questions/keywords only"
                desc="Skip emojis, 'nice', spam. Reply only when comment looks like a real question."
                checked={s.comment_filter_questions_only}
                onChange={(v) => setS({ ...s, comment_filter_questions_only: v })}
              />
              <RuleRow
                label="Auto-thank story mentions"
                desc="Send a quick thank-you DM when someone tags your account in their story."
                checked={s.auto_thank_story_mentions}
                onChange={(v) => setS({ ...s, auto_thank_story_mentions: v })}
              />
              <div className="space-y-2 pt-2">
                <Label>Confidence threshold ({Math.round(s.escalation_threshold * 100)}%)</Label>
                <input
                  type="range"
                  min={0.3}
                  max={0.95}
                  step={0.05}
                  value={s.escalation_threshold}
                  onChange={(e) => setS({ ...s, escalation_threshold: Number(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Below this, the bot stays silent and marks the conversation "Needs Human" in the Inbox.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test */}
        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Test the bot</CardTitle>
              <CardDescription>
                Try messages here without sending anything to Meta. Works even before Meta approval.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Customer message</Label>
                <Textarea
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="price? / koto / দাম কত / Dhaka delivery koto?"
                />
              </div>
              <div className="space-y-2">
                <Label>Optional: customer screenshot URL</Label>
                <Input
                  value={testImageUrl}
                  onChange={(e) => setTestImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <Button onClick={runTest} disabled={testRunning}>
                {testRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                Run test
              </Button>

              {testResult && (
                <div className="mt-4 rounded-lg border bg-muted/40 p-4 space-y-3">
                  <div className="text-sm whitespace-pre-wrap"><strong>Reply:</strong> {testResult.reply || "(empty)"}</div>
                  {testResult.public_comment_reply && (
                    <div className="text-sm"><strong>Public comment:</strong> {testResult.public_comment_reply}</div>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline">lang: {testResult.detected_language}</Badge>
                    <Badge variant="outline">intent: {testResult.intent}</Badge>
                    <Badge variant="outline">confidence: {Math.round((testResult.confidence ?? 0) * 100)}%</Badge>
                    {testResult.should_escalate && <Badge variant="destructive">Needs Human</Badge>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end sticky bottom-4">
        <Button onClick={save} disabled={saving} size="lg" className="shadow-lg">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save settings
        </Button>
      </div>
    </div>
  );
}

function RuleRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <Label className="text-sm">{label}</Label>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
