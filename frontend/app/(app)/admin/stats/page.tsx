'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { TrendingUp, DollarSign, Zap, ShoppingCart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { statsApi, StatsSummary, RevenuePoint, TokenPoint } from '@/lib/api/admin.service';

type Granularity = 'day' | 'week' | 'month';
type Range = '7d' | '30d' | '90d' | 'custom';

const RANGES: { label: string; value: Range }[] = [
  { label: '7 ngày', value: '7d' },
  { label: '30 ngày', value: '30d' },
  { label: '90 ngày', value: '90d' },
  { label: 'Tùy chọn', value: 'custom' },
];

const GRAN: { label: string; value: Granularity }[] = [
  { label: 'Theo ngày', value: 'day' },
  { label: 'Theo tuần', value: 'week' },
  { label: 'Theo tháng', value: 'month' },
];

function fmt(n: number) { return new Intl.NumberFormat('vi-VN').format(n); }
function fmtK(n: number) { return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n); }

function rangeToFromTo(range: Range, customFrom: string, customTo: string): [string, string] {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  if (range === 'custom') return [customFrom, customTo];
  const from = new Date(to);
  from.setDate(from.getDate() - (range === '7d' ? 7 : range === '30d' ? 30 : 90));
  from.setHours(0, 0, 0, 0);
  return [from.toISOString(), to.toISOString()];
}

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub?: string; icon: any; color: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 flex items-start gap-3">
      <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="size-4 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label, type }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover shadow-md px-3 py-2 text-sm space-y-1">
      <p className="font-medium text-xs text-muted-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{type === 'revenue' ? `${fmtK(p.value)}đ` : fmtK(p.value)}</span>
        </p>
      ))}
    </div>
  );
};

export default function StatsPage() {
  const [range, setRange] = useState<Range>('30d');
  const [gran, setGran] = useState<Granularity>('day');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([]);
  const [tokenData, setTokenData] = useState<TokenPoint[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const [from, to] = rangeToFromTo(range, customFrom, customTo);
    if (!from || !to) return;
    setLoading(true);
    try {
      const [s, r, t] = await Promise.all([
        statsApi.summary(from, to),
        statsApi.revenue(from, to, gran),
        statsApi.tokens(from, to),
      ]);
      setSummary(s);
      setRevenueData(r.map(d => ({
        ...d,
        period: new Date(d.period).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: gran === 'month' ? '2-digit' : undefined }),
      })));
      setTokenData(t.map(d => ({
        ...d,
        hour: new Date(d.hour).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
      })));
    } catch (e) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  }, [range, gran, customFrom, customTo]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Thống kê & Doanh thu</h1>
          <p className="text-sm text-muted-foreground">Doanh thu và lượng token tiêu thụ theo thời gian</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Range */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {RANGES.map(r => (
              <button key={r.value} onClick={() => setRange(r.value)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${range === r.value ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                {r.label}
              </button>
            ))}
          </div>

          {/* Custom date */}
          {range === 'custom' && (
            <div className="flex items-center gap-1.5 text-sm">
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                className="border rounded-md px-2 py-1 h-8 text-sm bg-background" />
              <span className="text-muted-foreground">—</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                className="border rounded-md px-2 py-1 h-8 text-sm bg-background" />
            </div>
          )}

          {/* Granularity */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {GRAN.map(g => (
              <button key={g.value} onClick={() => setGran(g.value)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${gran === g.value ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Doanh thu" value={summary ? `${fmtK(summary.revenue)}đ` : '—'}
          sub={summary ? `${fmt(summary.orders)} đơn` : undefined}
          icon={DollarSign} color="bg-emerald-500" />
        <StatCard label="Số đơn" value={summary ? fmt(summary.orders) : '—'}
          icon={ShoppingCart} color="bg-blue-500" />
        <StatCard label="Token Input" value={summary ? fmtK(summary.inputTokens) : '—'}
          icon={Zap} color="bg-violet-500" />
        <StatCard label="Token Output" value={summary ? fmtK(summary.outputTokens) : '—'}
          sub={summary ? `Tổng: ${fmtK(summary.inputTokens + summary.outputTokens)}` : undefined}
          icon={TrendingUp} color="bg-orange-500" />
      </div>

      {/* Revenue chart */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h2 className="font-semibold text-sm">Doanh thu theo thời gian</h2>
        {revenueData.length === 0 && !loading ? (
          <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">Chưa có dữ liệu</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={48} />
              <Tooltip content={<CustomTooltip type="revenue" />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }} />
              <Bar dataKey="revenue" name="Doanh thu" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Token chart */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Token tiêu thụ theo khung giờ</h2>
          <span className="text-xs text-muted-foreground">Input + Output</span>
        </div>
        {tokenData.length === 0 && !loading ? (
          <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">Chưa có dữ liệu token</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={tokenData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={48} />
              <Tooltip content={<CustomTooltip type="token" />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="input" name="Input" fill="#8b5cf6" radius={[3, 3, 0, 0]} maxBarSize={32} stackId="a" />
              <Bar dataKey="output" name="Output" fill="#f97316" radius={[3, 3, 0, 0]} maxBarSize={32} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
