'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { TrendingUp, DollarSign, Zap, ShoppingCart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { statsApi, StatsSummary, RevenuePoint, TokenPoint } from '@/lib/api/admin.service';

type Preset = '7d' | '30d' | 'monthly' | 'custom';

const PRESETS: { label: string; value: Preset }[] = [
  { label: '7 ngày gần nhất', value: '7d' },
  { label: '30 ngày gần nhất', value: '30d' },
  { label: 'Theo tháng', value: 'monthly' },
  { label: 'Tùy chọn', value: 'custom' },
];

function fmt(n: number) { return new Intl.NumberFormat('vi-VN').format(n); }
function fmtK(n: number) { return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n); }

function presetToParams(preset: Preset, customFrom: string, customTo: string): { from: string; to: string; granularity: 'day' | 'month' } | null {
  if (preset === 'custom') {
    if (!customFrom || !customTo) return null;
    return { from: new Date(customFrom).toISOString(), to: new Date(customTo + 'T23:59:59').toISOString(), granularity: 'day' };
  }
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  if (preset === 'monthly') {
    const from = new Date(to);
    from.setMonth(from.getMonth() - 11);
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
    return { from: from.toISOString(), to: to.toISOString(), granularity: 'month' };
  }
  const from = new Date(to);
  from.setDate(from.getDate() - (preset === '7d' ? 7 : 30));
  from.setHours(0, 0, 0, 0);
  return { from: from.toISOString(), to: to.toISOString(), granularity: 'day' };
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
    <div style={{ background: '#0B1F3A', border: '1px solid #14485F', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
      <p style={{ color: '#78A8B8', fontSize: 11, marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: <span style={{ fontWeight: 600, color: '#EEF4FF' }}>{type === 'revenue' ? `${fmtK(p.value)}đ` : fmtK(p.value)}</span>
        </p>
      ))}
    </div>
  );
};

export default function StatsPage() {
  const [preset, setPreset] = useState<Preset>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([]);
  const [tokenData, setTokenData] = useState<TokenPoint[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const params = presetToParams(preset, customFrom, customTo);
    if (!params) return;
    const { from, to, granularity } = params;
    setLoading(true);
    try {
      const [s, r, t] = await Promise.all([
        statsApi.summary(from, to),
        statsApi.revenue(from, to, granularity),
        statsApi.tokens(from, to),
      ]);
      setSummary(s);
      setRevenueData(r.map(d => ({
        ...d,
        period: new Date(d.period).toLocaleDateString('vi-VN', {
          day: granularity === 'day' ? '2-digit' : undefined,
          month: '2-digit',
          year: granularity === 'month' ? '2-digit' : undefined,
        }),
      })));
      setTokenData(t.map(d => ({
        ...d,
        hour: new Date(d.hour).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
      })));
    } catch (e) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  }, [preset, customFrom, customTo]);

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
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {PRESETS.map(p => (
              <button key={p.value} onClick={() => setPreset(p.value)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${preset === p.value ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                {p.label}
              </button>
            ))}
          </div>
          {preset === 'custom' && (
            <div className="flex items-center gap-1.5 text-sm">
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                className="border rounded-md px-2 py-1 h-8 text-sm bg-background" />
              <span className="text-muted-foreground">—</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                className="border rounded-md px-2 py-1 h-8 text-sm bg-background" />
            </div>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Doanh thu" value={summary ? `${fmtK(summary.revenue)}đ` : '—'}
          sub={summary ? `${fmt(summary.orders)} đơn` : undefined}
          icon={DollarSign} color="bg-emerald-500" />
        <StatCard label="Số đơn" value={summary ? fmt(summary.orders) : '—'}
          icon={ShoppingCart} color="bg-primary" />
        <StatCard label="Token Input" value={summary ? fmtK(summary.inputTokens) : '—'}
          icon={Zap} color="bg-amber-500" />
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
              <CartesianGrid strokeDasharray="3 3" stroke="#14485F" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#78A8B8' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: '#78A8B8' }} axisLine={false} tickLine={false} width={48} />
              <Tooltip content={<CustomTooltip type="revenue" />} cursor={{ fill: '#1485FF', opacity: 0.1 }} />
              <Bar dataKey="revenue" name="Doanh thu" fill="#1485FF" radius={[4, 4, 0, 0]} maxBarSize={48} />
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
              <CartesianGrid strokeDasharray="3 3" stroke="#14485F" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#78A8B8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: '#78A8B8' }} axisLine={false} tickLine={false} width={48} />
              <Tooltip content={<CustomTooltip type="token" />} cursor={{ fill: '#1485FF', opacity: 0.1 }} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#78A8B8' }} />
              <Bar dataKey="input" name="Input" fill="#8b5cf6" radius={[3, 3, 0, 0]} maxBarSize={32} stackId="a" />
              <Bar dataKey="output" name="Output" fill="#f97316" radius={[3, 3, 0, 0]} maxBarSize={32} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
