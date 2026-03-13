import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/use-store";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, AlertCircle, Plus } from "lucide-react";

interface PathaoStore {
  store_id: number;
  store_name: string;
  store_address: string;
}

interface CityZoneArea {
  id: number;
  name: string;
}

export default function DashboardCourier() {
  const { store } = useStore();
  const { toast } = useToast();

  // Connection state
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [pathaoStoreId, setPathaoStoreId] = useState<number | null>(null);

  // Credentials
  const [creds, setCreds] = useState({
    client_id: "",
    client_secret: "",
    username: "",
    password: "",
  });

  // Store creation
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [creatingStore, setCreatingStore] = useState(false);
  const [pathaoStores, setPathaoStores] = useState<PathaoStore[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [storeForm, setStoreForm] = useState({
    name: "",
    contact_name: "",
    contact_number: "",
    secondary_contact: "",
    address: "",
    city_id: 0,
    zone_id: 0,
    area_id: 0,
  });

  // Location data
  const [cities, setCities] = useState<CityZoneArea[]>([]);
  const [zones, setZones] = useState<CityZoneArea[]>([]);
  const [areas, setAreas] = useState<CityZoneArea[]>([]);

  useEffect(() => {
    if (!store) return;
    checkConnection();
  }, [store]);

  const checkConnection = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("courier_settings" as any)
      .select("*")
      .eq("store_id", store!.id)
      .eq("provider", "pathao")
      .maybeSingle();

    if (data && (data as any).access_token) {
      setConnected(true);
      setPathaoStoreId((data as any).pathao_store_id);
      setCreds({
        client_id: (data as any).client_id || "",
        client_secret: (data as any).client_secret || "",
        username: (data as any).client_email || "",
        password: "",
      });
    }
    setLoading(false);
  };

  const handleConnect = async () => {
    if (!creds.client_id || !creds.client_secret || !creds.username || !creds.password) {
      toast({ title: "All fields required", variant: "destructive" });
      return;
    }
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("pathao-proxy", {
        body: {
          action: "issue-token",
          store_id: store!.id,
          ...creds,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setConnected(true);
      toast({ title: "Connected to Pathao!", description: "Your courier account is now linked." });
      checkConnection();
    } catch (err: any) {
      toast({ title: "Connection failed", description: err.message, variant: "destructive" });
    }
    setConnecting(false);
  };

  const fetchCities = async () => {
    const { data } = await supabase.functions.invoke("pathao-proxy", {
      body: { action: "get-cities", store_id: store!.id },
    });
    if (data?.data?.data) setCities(data.data.data.map((c: any) => ({ id: c.city_id, name: c.city_name })));
  };

  const fetchZones = async (cityId: number) => {
    setZones([]);
    setAreas([]);
    const { data } = await supabase.functions.invoke("pathao-proxy", {
      body: { action: "get-zones", store_id: store!.id, city_id: cityId },
    });
    if (data?.data?.data) setZones(data.data.data.map((z: any) => ({ id: z.zone_id, name: z.zone_name })));
  };

  const fetchAreas = async (zoneId: number) => {
    setAreas([]);
    const { data } = await supabase.functions.invoke("pathao-proxy", {
      body: { action: "get-areas", store_id: store!.id, zone_id: zoneId },
    });
    if (data?.data?.data) setAreas(data.data.data.map((a: any) => ({ id: a.area_id, name: a.area_name })));
  };

  const fetchPathaoStores = async () => {
    setLoadingStores(true);
    const { data } = await supabase.functions.invoke("pathao-proxy", {
      body: { action: "get-stores", store_id: store!.id },
    });
    if (data?.data?.data) {
      setPathaoStores(data.data.data.map((s: any) => ({
        store_id: s.store_id,
        store_name: s.store_name,
        store_address: s.store_address,
      })));
    }
    setLoadingStores(false);
  };

  const handleSelectPathaoStore = async (psId: number) => {
    await supabase
      .from("courier_settings" as any)
      .update({ pathao_store_id: psId } as any)
      .eq("store_id", store!.id)
      .eq("provider", "pathao");
    setPathaoStoreId(psId);
    toast({ title: "Pathao store selected!" });
  };

  const handleCreateStore = async () => {
    if (!storeForm.name || !storeForm.contact_name || !storeForm.contact_number || !storeForm.address || !storeForm.city_id || !storeForm.zone_id || !storeForm.area_id) {
      toast({ title: "All required fields must be filled", variant: "destructive" });
      return;
    }
    setCreatingStore(true);
    try {
      const { data, error } = await supabase.functions.invoke("pathao-proxy", {
        body: { action: "create-store", store_id: store!.id, ...storeForm },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Pathao store created!" });
      setShowStoreForm(false);
      checkConnection();
      fetchPathaoStores();
    } catch (err: any) {
      toast({ title: "Failed to create store", description: err.message, variant: "destructive" });
    }
    setCreatingStore(false);
  };

  const inputClass =
    "h-10 w-full rounded-lg bg-background px-3 text-sm border border-input outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground";
  const selectClass =
    "h-10 w-full rounded-lg bg-background px-3 text-sm border border-input outline-none focus:ring-2 focus:ring-primary/20 transition-all";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl text-foreground mb-6">Courier Integration</h1>

      {/* Connection Status */}
      <div className="bg-card rounded-xl store-shadow p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-3 h-3 rounded-full ${connected ? "bg-green-500" : "bg-yellow-500"}`} />
          <h2 className="font-heading font-semibold text-base text-foreground">
            Pathao Courier {connected ? "— Connected" : "— Not Connected"}
          </h2>
        </div>

        {!connected ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter your Pathao API credentials to enable automated courier dispatch.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Client ID</label>
                <input
                  placeholder="Client ID"
                  value={creds.client_id}
                  onChange={(e) => setCreds({ ...creds, client_id: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Client Secret</label>
                <input
                  type="password"
                  placeholder="Client Secret"
                  value={creds.client_secret}
                  onChange={(e) => setCreds({ ...creds, client_secret: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                <input
                  type="email"
                  placeholder="Pathao account email"
                  value={creds.username}
                  onChange={(e) => setCreds({ ...creds, username: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Password</label>
                <input
                  type="password"
                  placeholder="Pathao account password"
                  value={creds.password}
                  onChange={(e) => setCreds({ ...creds, password: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="h-10 px-6 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Connect to Pathao
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="w-4 h-4 text-green-500" />
            Your Pathao account is connected and tokens are being managed automatically.
          </div>
        )}
      </div>

      {/* Pathao Store Setup */}
      {connected && (
        <div className="bg-card rounded-xl store-shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-base text-foreground">Pathao Store</h2>
            {pathaoStoreId && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                Store ID: {pathaoStoreId}
              </span>
            )}
          </div>

          {!pathaoStoreId && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0" />
              <p className="text-sm text-yellow-700">
                You need to select or create a Pathao store before dispatching orders.
              </p>
            </div>
          )}

          {/* Existing stores */}
          <div className="mb-4">
            <button
              onClick={fetchPathaoStores}
              disabled={loadingStores}
              className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
            >
              {loadingStores ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Load existing Pathao stores
            </button>
            {pathaoStores.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {pathaoStores.map((ps) => (
                  <button
                    key={ps.store_id}
                    onClick={() => handleSelectPathaoStore(ps.store_id)}
                    className={`flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${
                      pathaoStoreId === ps.store_id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-sm text-foreground">{ps.store_name}</p>
                      <p className="text-xs text-muted-foreground">{ps.store_address}</p>
                    </div>
                    {pathaoStoreId === ps.store_id && <Check className="w-4 h-4 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Create new store */}
          {!showStoreForm ? (
            <button
              onClick={() => {
                setShowStoreForm(true);
                if (cities.length === 0) fetchCities();
              }}
              className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <Plus className="w-4 h-4" />
              Create new Pathao store
            </button>
          ) : (
            <div className="mt-4 space-y-3 p-4 rounded-xl border border-border bg-muted/20">
              <h3 className="font-heading font-semibold text-sm text-foreground">New Pathao Store</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Store Name *</label>
                  <input
                    placeholder="My Store"
                    value={storeForm.name}
                    onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Contact Name *</label>
                  <input
                    placeholder="John Doe"
                    value={storeForm.contact_name}
                    onChange={(e) => setStoreForm({ ...storeForm, contact_name: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Contact Number *</label>
                  <input
                    placeholder="01XXXXXXXXX"
                    value={storeForm.contact_number}
                    onChange={(e) => setStoreForm({ ...storeForm, contact_number: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Secondary Contact</label>
                  <input
                    placeholder="Optional"
                    value={storeForm.secondary_contact}
                    onChange={(e) => setStoreForm({ ...storeForm, secondary_contact: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Address *</label>
                <input
                  placeholder="Full store address"
                  value={storeForm.address}
                  onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">City *</label>
                  <select
                    value={storeForm.city_id}
                    onChange={(e) => {
                      const cityId = Number(e.target.value);
                      setStoreForm({ ...storeForm, city_id: cityId, zone_id: 0, area_id: 0 });
                      if (cityId) fetchZones(cityId);
                    }}
                    className={selectClass}
                  >
                    <option value={0}>Select city</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Zone *</label>
                  <select
                    value={storeForm.zone_id}
                    onChange={(e) => {
                      const zoneId = Number(e.target.value);
                      setStoreForm({ ...storeForm, zone_id: zoneId, area_id: 0 });
                      if (zoneId) fetchAreas(zoneId);
                    }}
                    className={selectClass}
                    disabled={zones.length === 0}
                  >
                    <option value={0}>Select zone</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Area *</label>
                  <select
                    value={storeForm.area_id}
                    onChange={(e) => setStoreForm({ ...storeForm, area_id: Number(e.target.value) })}
                    className={selectClass}
                    disabled={areas.length === 0}
                  >
                    <option value={0}>Select area</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleCreateStore}
                  disabled={creatingStore}
                  className="h-9 px-5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {creatingStore ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Store
                </button>
                <button
                  onClick={() => setShowStoreForm(false)}
                  className="h-9 px-5 rounded-lg bg-muted text-muted-foreground font-semibold text-sm hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
