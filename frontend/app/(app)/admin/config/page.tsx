'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Check, X, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/lib/api/client';

interface SystemConfig { id: string; key: string; value: string; name: string; description: string | null; updatedAt: string; }

async function fetchConfigs(): Promise<SystemConfig[]> {
  return apiClient.get<SystemConfig[]>('/admin/system-config').then(r => r.data);
}

export default function SystemConfigPage() {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => { fetchConfigs().then(setConfigs).catch(e => toast.error(e.message)); }, []);

  function startEdit(c: SystemConfig) {
    setEditing(p => ({ ...p, [c.id]: c.value }));
  }

  function cancelEdit(id: string) {
    setEditing(p => { const n = { ...p }; delete n[id]; return n; });
  }

  async function save(id: string) {
    setSaving(id);
    try {
      const updated = await apiClient.patch<SystemConfig>(`/admin/system-config/${id}`, { value: editing[id] }).then(r => r.data);
      setConfigs(cs => cs.map(c => c.id === id ? updated : c));
      cancelEdit(id);
      toast.success('Đã lưu');
    } catch (e) { toast.error((e as Error).message); }
    finally { setSaving(null); }
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings2 className="size-6" /> Cấu hình hệ thống
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Các tham số vận hành của hệ thống</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-card divide-y">
        {configs.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">Chưa có cấu hình nào</div>
        )}
        {configs.map(c => {
          const isEditing = c.id in editing;
          return (
            <div key={c.id} className="p-5 flex items-start gap-4">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{c.name}</p>
                  <Badge variant="outline" className="font-mono text-xs">{c.key}</Badge>
                </div>
                {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                <p className="text-xs text-muted-foreground/60">
                  Cập nhật: {new Date(c.updatedAt).toLocaleString('vi-VN')}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isEditing ? (
                  <>
                    <Input
                      value={editing[c.id]}
                      onChange={e => setEditing(p => ({ ...p, [c.id]: e.target.value }))}
                      className="w-40 h-8 text-sm font-mono"
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') save(c.id); if (e.key === 'Escape') cancelEdit(c.id); }}
                    />
                    <Button size="icon" variant="ghost" className="size-8 text-green-600 hover:text-green-700"
                      disabled={saving === c.id} onClick={() => save(c.id)}>
                      <Check className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="size-8 text-muted-foreground"
                      onClick={() => cancelEdit(c.id)}>
                      <X className="size-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{c.value}</code>
                    <Button size="icon" variant="ghost" className="size-8" onClick={() => startEdit(c)}>
                      <Pencil className="size-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
