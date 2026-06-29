'use client';

import { useEffect, useState } from 'react';
import { useConfirm } from '@/hooks/use-confirm';
import { toast } from 'sonner';
import { Copy, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { nineRouterApi, NineRouterKey } from '@/lib/api/admin.service';

export default function KeysPage() {
  const { confirm, ConfirmDialog } = useConfirm();
  const [keys, setKeys] = useState<NineRouterKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [newKey, setNewKey] = useState<NineRouterKey | null>(null);

  const load = () => {
    setLoading(true);
    nineRouterApi.list().then(setKeys).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await nineRouterApi.create(name);
      setNewKey(created);
      setName('');
      setDialog(false);
      load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  }

  async function handleToggle(k: NineRouterKey) {
    try {
      await nineRouterApi.update(k.id, !k.isActive);
      toast.success(k.isActive ? 'Đã tắt key' : 'Đã bật key');
      load();
    } catch (e) { toast.error((e as Error).message); }
  }

  async function handleDelete(k: NineRouterKey) {
    if (!await confirm({ title: 'Xoá API Key', description: `Xoá key "${k.name}"?\nHành động này không thể hoàn tác.`, confirmLabel: 'Xoá key' })) return;
    try { await nineRouterApi.remove(k.id); toast.success('Đã xoá'); load(); }
    catch (e) { toast.error((e as Error).message); }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Đã copy');
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">API Keys — 9Router</h1>
          <p className="text-sm text-muted-foreground">{keys.length} keys</p>
        </div>
        <Button size="sm" onClick={() => setDialog(true)}>
          <Plus className="size-4 mr-1" /> Tạo key
        </Button>
      </div>

      {/* Vừa tạo xong → hiện key để copy */}
      {newKey && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
          <p className="text-sm font-medium text-amber-900">Key mới tạo — copy ngay, sẽ không hiện lại</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-white border px-3 py-1.5 text-sm font-mono break-all">{newKey.key}</code>
            <Button size="sm" variant="outline" onClick={() => copy(newKey.key)}><Copy className="size-4" /></Button>
          </div>
          <Button size="sm" variant="ghost" className="text-xs" onClick={() => setNewKey(null)}>Đóng</Button>
        </div>
      )}

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên</TableHead>
              <TableHead>Key (ẩn)</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Đang tải...</TableCell></TableRow>
            )}
            {!loading && keys.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Chưa có key nào</TableCell></TableRow>
            )}
            {keys.map(k => (
              <TableRow key={k.id}>
                <TableCell className="font-medium">{k.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-muted-foreground">{k.key?.slice(0, 12)}••••••••</code>
                    <Button variant="ghost" size="icon" className="size-6" onClick={() => copy(k.key)}>
                      <Copy className="size-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={k.isActive ? 'default' : 'secondary'}>
                    {k.isActive ? 'Hoạt động' : 'Tắt'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => handleToggle(k)}>
                      {k.isActive ? <ToggleRight className="size-4 text-primary" /> : <ToggleLeft className="size-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => handleDelete(k)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialog} onOpenChange={o => !o && setDialog(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Tạo API key mới</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-1">
              <Label>Tên key</Label>
              <Input required placeholder="VD: Nhân viên Nguyễn Văn A" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialog(false)}>Huỷ</Button>
              <Button type="submit" disabled={saving}>Tạo</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {ConfirmDialog}
    </div>
  );
}
