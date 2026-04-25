import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Trash2, Server, Zap, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface LlmSettings {
  api_url: string;
  model: string;
  has_custom_key: boolean;
}

export function LlmSettingsCard() {
  const [settings, setSettings] = useState<LlmSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [apiUrl, setApiUrl] = useState("");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await supabase.functions.invoke("admin-llm-settings", {
        method: "GET",
      });
      if (res.error) throw res.error;
      const data = res.data as LlmSettings;
      setSettings(data);
      setApiUrl(data.api_url || "");
      setModel(data.model || "");
      setApiKey("");
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setTestResult(null);
    try {
      const body: Record<string, string> = { api_url: apiUrl, model };
      if (apiKey.trim()) {
        body.api_key = apiKey;
      }
      const res = await supabase.functions.invoke("admin-llm-settings", {
        method: "POST",
        body,
      });
      if (res.error) throw res.error;
      toast({ title: "Gespeichert" });
      setApiKey("");
      await fetchSettings();
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleClearKey = async () => {
    setClearing(true);
    setTestResult(null);
    try {
      const res = await supabase.functions.invoke("admin-llm-settings", {
        method: "POST",
        body: { api_url: "", model: "", clear_key: true },
      });
      if (res.error) throw res.error;
      toast({ title: "API-Key gelöscht", description: "Es wird wieder der Standard-Provider verwendet." });
      setApiUrl("");
      setModel("");
      setApiKey("");
      await fetchSettings();
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    } finally {
      setClearing(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await supabase.functions.invoke("admin-llm-settings", {
        method: "POST",
        body: { test_connection: true },
      });
      if (res.error) throw res.error;
      const data = res.data as { success: boolean; error?: string; reply?: string; model?: string };
      if (data.success) {
        setTestResult({
          success: true,
          message: `Verbindung erfolgreich! Modell: ${data.model || "unbekannt"} — Antwort: "${data.reply}"`,
        });
      } else {
        setTestResult({ success: false, message: data.error || "Unbekannter Fehler" });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-muted-foreground" />
          <CardTitle>LLM-Einstellungen</CardTitle>
        </div>
        <CardDescription>
          Eigenen KI-Provider konfigurieren (z.B. OpenRouter). Wenn leer, wird der integrierte Standard-Provider verwendet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="llm-api-url">API URL</Label>
          <Input
            id="llm-api-url"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://openrouter.ai/api/v1/chat/completions"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="llm-model">Modell</Label>
          <Input
            id="llm-model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="anthropic/claude-sonnet-4"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="llm-api-key">API Key</Label>
          <Input
            id="llm-api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={settings?.has_custom_key ? "••••••••" : "sk-..."}
          />
          {settings?.has_custom_key && (
            <p className="text-xs text-muted-foreground">
              Ein Key ist hinterlegt. Leer lassen, um den bestehenden zu behalten.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Speichern
          </Button>
          {settings?.has_custom_key && (
            <>
              <Button variant="outline" onClick={handleTest} disabled={testing}>
                {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                Verbindung testen
              </Button>
              <Button variant="outline" onClick={handleClearKey} disabled={clearing}>
                {clearing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Key löschen
              </Button>
            </>
          )}
        </div>

        {testResult && (
          <div
            className={`flex items-start gap-2 rounded-md border p-3 text-sm ${
              testResult.success
                ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
