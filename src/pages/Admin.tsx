import { useState, useEffect, useCallback } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUsage } from "@/features/chat/hooks/useUsage";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users, Shield, BarChart3, Loader2, Save } from "lucide-react";
import { LlmSettingsCard } from "@/features/admin/components/LlmSettingsCard";
import { toast } from "@/hooks/use-toast";

interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  role: string;
  message_count: number;
  max_messages: number;
  created_at: string;
  last_sign_in_at: string | null;
}

interface PendingEdit {
  role?: string;
  max_messages?: number;
}

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: usageLoading } = useUsage();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, PendingEdit>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await supabase.functions.invoke("admin-users", {
        method: "GET",
      });

      if (res.error) throw res.error;
      setUsers(res.data || []);
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin && !usageLoading) fetchUsers();
  }, [isAdmin, usageLoading, fetchUsers]);

  const handleEdit = (userId: string, field: string, value: string | number) => {
    setEdits((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: value },
    }));
  };

  const handleSave = async (userId: string) => {
    const edit = edits[userId];
    if (!edit) return;

    setSaving(userId);
    try {
      const res = await supabase.functions.invoke("admin-users", {
        method: "PATCH",
        body: { user_id: userId, ...edit },
      });
      if (res.error) throw res.error;

      toast({ title: "Gespeichert" });
      setEdits((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  if (authLoading || usageLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const totalMessages = users.reduce((sum, u) => sum + u.message_count, 0);

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Admin-Dashboard</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Nutzer</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{totalUsers}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{adminCount}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Nachrichten gesamt</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{totalMessages}</div></CardContent>
          </Card>
        </div>

        {/* User Table */}
        <Card>
          <CardHeader>
            <CardTitle>Benutzerverwaltung</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead>Verbrauch</TableHead>
                    <TableHead>Limit</TableHead>
                    <TableHead>Letzter Login</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => {
                    const edit = edits[u.id];
                    const currentRole = edit?.role ?? u.role;
                    const currentMax = edit?.max_messages ?? u.max_messages;
                    const hasChanges = !!edit;

                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.display_name || "–"}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{u.email}</TableCell>
                        <TableCell>
                          <Select
                            value={currentRole}
                            onValueChange={(v) => handleEdit(u.id, "role", v)}
                          >
                            <SelectTrigger className="w-[100px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.message_count >= u.max_messages && u.role !== "admin" ? "destructive" : "secondary"}>
                            {u.message_count}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="w-[80px] h-8"
                            value={currentMax}
                            onChange={(e) => handleEdit(u.id, "max_messages", parseInt(e.target.value) || 0)}
                          />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("de-DE") : "–"}
                        </TableCell>
                        <TableCell>
                          {hasChanges && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleSave(u.id)}
                              disabled={saving === u.id}
                            >
                              {saving === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        {/* LLM Settings */}
        <LlmSettingsCard />
      </div>
    </MainLayout>
  );
}
