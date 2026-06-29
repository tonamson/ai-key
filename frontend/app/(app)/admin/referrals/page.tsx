'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowDownLeft, ArrowUpRight, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/lib/api/client';
import { WalletTransaction, adminUserApi, AdminUser } from '@/lib/api/admin.service';

const f = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

interface TxWithUser extends WalletTransaction { user?: { id: string; name: string; email: string }; }

const TYPE_LABEL: Record<string, string> = {
  commission: 'Hoa hồng',
  spend: 'Chi tiêu',
  admin_add: 'Admin nạp',
  admin_sub: 'Admin trừ',
};

const TYPE_COLOR: Record<string, string> = {
  commission: 'text-green-600 dark:text-green-400',
  admin_add: 'text-green-600 dark:text-green-400',
  spend: 'text-red-500',
  admin_sub: 'text-red-500',
};

export default function AdminReferralsPage() {
  const [txs, setTxs] = useState<TxWithUser[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filterUser, setFilterUser] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminUserApi.list({ page: 1, limit: 200 }).then(r => setUsers(Array.isArray(r) ? r : (r as any).data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = filterUser ? `?userId=${filterUser}` : '';
    apiClient.get<TxWithUser[]>(`/admin/wallet${params}`)
      .then(r => setTxs(r.data))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [filterUser]);

  const filtered = search
    ? txs.filter(tx =>
        tx.user?.name.toLowerCase().includes(search.toLowerCase()) ||
        tx.user?.email.toLowerCase().includes(search.toLowerCase()) ||
        TYPE_LABEL[tx.type]?.includes(search))
    : txs;

  const totalCommission = txs.filter(t => t.type === 'commission').reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lịch sử hoa hồng & ví</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Tổng hoa hồng đã phát sinh: <strong className="text-primary">{f(totalCommission)}đ</strong>
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Tìm theo tên, email..." className="pl-9"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select
          className="h-9 rounded-md border bg-background px-3 text-sm min-w-48"
          value={filterUser}
          onChange={e => setFilterUser(e.target.value)}
        >
          <option value="">Tất cả user</option>
          {(users ?? []).map(u => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}
        </select>
        {(filterUser || search) && (
          <button onClick={() => { setFilterUser(''); setSearch(''); }}
            className="h-9 px-3 rounded-md border text-sm flex items-center gap-1.5 hover:bg-muted">
            <X className="size-3.5" /> Xóa lọc
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Thời gian</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Loại</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Mô tả</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Số tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && (
                <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">Đang tải...</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">Không có giao dịch nào</td></tr>
              )}
              {filtered.map(tx => {
                const isCredit = Number(tx.amount) > 0;
                return (
                  <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{tx.user?.name ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">{tx.user?.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-xs ${TYPE_COLOR[tx.type] ?? ''}`}>
                        {isCredit
                          ? <ArrowDownLeft className="size-3 mr-1" />
                          : <ArrowUpRight className="size-3 mr-1" />}
                        {TYPE_LABEL[tx.type] ?? tx.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{tx.description ?? '—'}</td>
                    <td className={`px-4 py-3 text-right font-semibold tabular-nums ${TYPE_COLOR[tx.type] ?? ''}`}>
                      {isCredit ? '+' : ''}{f(Number(tx.amount))}đ
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
