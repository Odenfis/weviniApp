import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Download,
  Calendar,
  ArrowRight,
  Package,
  ShoppingCart as CartIcon,
  CircleAlert
} from 'lucide-react';
import { cn } from '../lib/utils';
import { apiFetch } from '../lib/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const salesData = [
  { name: 'Lun', value: 2400 },
  { name: 'Mar', value: 1398 },
  { name: 'Mié', value: 9800 },
  { name: 'Jue', value: 3908 },
  { name: 'Vie', value: 4800 },
  { name: 'Sáb', value: 3800 },
  { name: 'Dom', value: 4300 },
];

const inventoryData = [
  { name: 'Rosado', value: 60, color: '#3b82f6' },
  { name: 'Pardo', value: 38, color: '#92400e' },
  { name: 'Quiñado', value: 2, color: '#ef4444' },
];

export default function Dashboard() {
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salesRes, kpisRes] = await Promise.all([
          apiFetch('/api/ventas/recent'),
          apiFetch('/api/dashboard/kpis')
        ]);

        if (salesRes.ok) {
          const salesData = await salesRes.json();
          setRecentSales(salesData);
        }
        if (kpisRes.ok) {
          const kpisData = await kpisRes.json();
          setKpis(kpisData);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(val);
  
  const formatNumber = (val: number) => 
    new Intl.NumberFormat('es-PE').format(val);

  return (
    <div className="p-12 space-y-12 animate-in fade-in duration-700 bg-bg-main min-h-full">
      <div className="flex justify-between items-end pb-8 border-b border-text-main/10">
        <div>
          <span className="text-[10px] tracking-[0.4em] font-bold uppercase mb-2 block opacity-50">Resumen operativo — Mayo 2026</span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-text-main leading-tight tracking-tighter">Resumen General</h1>
        </div>
        <button className="flex items-center gap-4 px-6 py-3 border border-text-main text-text-main rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-primary hover:text-bg-main transition-all">
          <Download className="w-3 h-3" />
          Exportar Reporte
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <MetricCard
          title="Ventas Mensuales"
          value={kpis ? formatCurrency(kpis.ventas_mensuales) : '---'}
          unit="PEN"
          trend="Current month total"
          positive
          icon={CartIcon}
        />
        <MetricCard
          title="Saldo Caja"
          value={kpis ? formatCurrency(kpis.saldo_caja) : '---'}
          unit="PEN"
          trend="Available in cash"
          neutral
          icon={Package}
        />
        <MetricCard
          title="Saldo Banco"
          value={kpis ? formatCurrency(kpis.saldo_banco) : '---'}
          unit="PEN"
          trend="Available in bank"
          neutral
          icon={Package}
        />
        <MetricCard
          title="Stock Huevo Quiñado"
          value={kpis ? formatNumber(kpis.stock_quinado) : '---'}
          unit="UNITS"
          trend="Damaged egg stock"
          negative
          icon={CircleAlert}
          alert
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 border-t border-text-main/10 pt-10">
          <div className="flex justify-between items-baseline mb-12">
            <h3 className="text-2xl font-bold text-text-main">Sales Trends.</h3>
            <div className="flex items-center gap-2 border-b border-text-main pb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Metric:</span>
              <select className="text-[10px] font-bold uppercase tracking-widest bg-transparent border-none focus:ring-0 p-0 cursor-pointer">
                <option>Volume (Plates)</option>
                <option>Revenue (S/)</option>
              </select>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(15, 23, 42, 0.05)" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#0F172A', fontWeight: 700, letterSpacing: '0.1em' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#0F172A', opacity: 0.4 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#F8FAFC', border: '1px solid #0F172A', borderRadius: '0px', boxShadow: 'none' }}
                />
                <Area type="monotone" dataKey="value" stroke="#0F172A" strokeWidth={1} fill="#0F172A" fillOpacity={0.03} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border-l border-text-main/10 pl-10">
          <h3 className="text-2xl font-bold text-text-main mb-12">Distribution.</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="#F8FAFC"
                  strokeWidth={2}
                >
                  {inventoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#0F172A' : index === 1 ? 'rgba(15, 23, 42, 0.4)' : 'rgba(15, 23, 42, 0.1)'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-6 mt-12">
            {inventoryData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: idx === 0 ? '#0F172A' : idx === 1 ? 'rgba(15, 23, 42, 0.4)' : 'rgba(15, 23, 42, 0.1)' }}></div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{item.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-[1px] w-12 bg-text-main/10 group-hover:w-24 transition-all"></div>
                  <span className="text-xs font-bold">{item.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-10">
        <div className="flex justify-between items-baseline mb-12">
          <h3 className="text-4xl font-bold text-text-main">Ventas Recientes.</h3>
          <button className="text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2 border-b border-text-main">
            Archive View <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-text-main/10 text-xs font-bold uppercase tracking-[0.3em] opacity-40">
              <tr>
                <th className="px-6 py-4">ID Venta</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-text-main/5">
              {recentSales.length > 0 ? (
                recentSales.map((sale) => (
                  <OrderRow
                    key={sale.id_venta}
                    id={sale.id_venta}
                    client={sale.razon_social}
                    date={new Date(sale.fecha_venta).toLocaleString('es-PE', {
                      month: 'short',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    qty={`S/ ${sale.total.toFixed(2)}`}
                    status={sale.estado}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-xs opacity-40 font-bold uppercase tracking-widest">
                    No hay ventas recientes registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, unit, trend, positive, icon: Icon, alert }: any) {
  return (
    <div className={cn(
      "border-l border-text-main/20 pl-6 space-y-4 py-2 group hover:border-text-main transition-all",
      alert && "bg-error/5"
    )}>
      <div className="flex justify-between items-baseline">
        <h4 className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-40">{title}</h4>
        <span className="text-[8px] font-bold tracking-widest opacity-30">{unit}</span>
      </div>
      <div>
        <span className={cn("text-3xl font-bold tracking-tighter", alert ? "text-error" : "text-text-main")}>{value}</span>
      </div>
      <div className={cn(
        "text-[9px] font-bold uppercase tracking-widest opacity-60 flex items-center gap-2"
      )}>
        <div className={cn("w-1 h-1 rounded-full", positive ? "bg-success" : alert ? "bg-error" : "bg-text-main/30")}></div>
        <span>{trend}</span>
      </div>
    </div>
  );
}

function OrderRow({ id, client, date, qty, status }: any) {
  const isPaid = status?.toUpperCase() === 'PAGADO';
  
  return (
    <tr className="hover:bg-primary hover:text-bg-main transition-all cursor-pointer group">
      <td className="px-6 py-6 font-bold text-xs tracking-widest uppercase">#{id}</td>
      <td className="px-6 py-6 text-sm font-medium">{client}</td>
      <td className="px-6 py-6 text-xs opacity-50 uppercase tracking-widest">{date}</td>
      <td className="px-6 py-6 text-sm font-bold tracking-widest">{qty}</td>
      <td className="px-6 py-6 text-right">
        <span className={cn(
          "text-[11px] font-bold uppercase tracking-[0.3em] border px-3 py-1 rounded-full transition-all",
          isPaid
            ? "border-success text-success group-hover:border-bg-main group-hover:text-bg-main"
            : "border-text-main/30 text-text-main/60 group-hover:border-bg-main group-hover:text-bg-main"
        )}>
          {status}
        </span>
      </td>
    </tr>
  );
}

