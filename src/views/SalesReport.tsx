import React, { useState, useEffect } from 'react';
import {
  Search,
  FileText,
  Download,
  FileSpreadsheet,
  Calendar,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { apiFetch } from '../lib/api';

interface SaleReportItem {
  id_venta: number;
  nombre_cliente: string;
  tipo_venta_nombre: string;
  fecha_venta: string;
  total: number;
  monto_pagado: number;
  estado: string;
}

export default function SalesReport() {
  const [sales, setSales] = useState<SaleReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (startDate) query.append('fecha_inicio', startDate);
      if (endDate) query.append('fecha_fin', endDate);
      
      const res = await apiFetch(`http://localhost:3001/api/reportes/ventas?${query.toString()}`);
      const data = await res.json();
      setSales(data);
    } catch (err) {
      console.error('Error fetching sales report:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const setPreset = (type: 'today' | 'yesterday' | 'month') => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (type === 'today') {
      // Today is already set by default
    } else if (type === 'yesterday') {
      start.setDate(now.getDate() - 1);
      end.setDate(now.getDate() - 1);
    } else if (type === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
    // We can't call fetchSales immediately because state updates are async
    // But we can just let the user click "Filtrar" or we can use a useEffect
    // However, to be responsive, we'll trigger fetch manually if we pass values
  };

  const handlePresetClick = (type: 'today' | 'yesterday' | 'month') => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (type === 'today') {
      // already today
    } else if (type === 'yesterday') {
      start.setDate(now.getDate() - 1);
      end.setDate(now.getDate() - 1);
    } else if (type === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const s = formatDate(start);
    const e = formatDate(end);
    setStartDate(s);
    setEndDate(e);

    // Fetch with these new values immediately
    setLoading(true);
    const query = new URLSearchParams();
    query.append('fecha_inicio', s);
    query.append('fecha_fin', e);
    apiFetch(`http://localhost:3001/api/reportes/ventas?${query.toString()}`)
      .then(res => res.json())
      .then(data => {
        setSales(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    fetchSales();
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    const query = new URLSearchParams();
    if (startDate) query.append('fecha_inicio', startDate);
    if (endDate) query.append('fecha_fin', endDate);

    const url = `http://localhost:3001/api/reportes/ventas/export/${format}?${query.toString()}`;
    window.open(url, '_blank');
  };

  const filteredSales = sales.filter(sale =>
    sale.nombre_cliente.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sale.id_venta.toString().includes(searchQuery) ||
    sale.estado.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-12 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-bg-main min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-text-main/10">
        <div>
          <span className="text-xs tracking-[0.3em] font-bold uppercase mb-2 block opacity-50">Analysis & Reports</span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-text-main leading-tight tracking-tighter">Reporte de Ventas.</h1>
        </div>
      </div>

      <div className="space-y-8 pt-8 border-t border-text-main/10">
        {/* Filtros y Acciones */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-surface/50 p-6 rounded-2xl border border-text-main/5">
          <div className="flex flex-wrap items-center gap-6">
            {/* Quick Presets */}
            <div className="flex items-center gap-1 p-1 bg-text-main/5 rounded-full border border-text-main/5">
              {['today', 'yesterday', 'month'].map((type) => (
                <button
                  key={type}
                  onClick={() => handlePresetClick(type as any)}
                  className={cn(
                    "px-3 py-1 text-[10px] font-bold uppercase tracking-tighter rounded-full transition-all",
                    type === 'today' && startDate === formatDate(new Date()) 
                      ? "bg-primary text-bg-main" 
                      : "text-text-main/60 hover:text-text-main hover:bg-text-main/10"
                  )}
                >
                  {type === 'today' ? 'Hoy' : type === 'yesterday' ? 'Ayer' : 'Este Mes'}
                </button>
              ))}
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-text-main/40" />
                <input 
                  type="date" 
                  className="px-3 py-2 bg-transparent border-b border-text-main/10 text-xs uppercase tracking-widest focus:border-primary outline-none transition-all"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold opacity-30">AL</span>
                <input 
                  type="date" 
                  className="px-3 py-2 bg-transparent border-b border-text-main/10 text-xs uppercase tracking-widest focus:border-primary outline-none transition-all"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 text-text-main/60 hover:text-text-main text-xs font-bold uppercase tracking-widest transition-all"
            >
              <X className="w-3 h-3" />
              Limpiar
            </button>
            <button 
              onClick={fetchSales}
              className="px-6 py-2 bg-primary text-bg-main text-xs font-bold uppercase tracking-widest rounded-full hover:opacity-90 transition-all"
            >
              Filtrar
            </button>
            <div className="w-px h-6 bg-text-main/10 mx-1" />
            <button 
              onClick={() => handleExport('excel')}
              className="flex items-center gap-2 px-4 py-2 border border-text-main/20 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-bg-main transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </button>
            <button 
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 px-4 py-2 border border-text-main/20 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-bg-main transition-all"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-4xl font-bold text-text-main">Detalle de Transacciones.</h3>
          <div className="relative shrink-0">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-text-main/30 w-3 h-3" />
            <input
              type="text"
              placeholder="Buscar por cliente, ID o estado..."
              className="pl-6 pr-4 py-2 bg-transparent border-b border-text-main/10 text-xs uppercase tracking-widest focus:border-text-main outline-none transition-all placeholder:text-text-main/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 font-medium text-text-main/60">Cargando datos del reporte...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b-2 border-primary text-xs font-black uppercase tracking-[0.3em] text-primary">
                <tr>
                  <th className="px-6 py-6">ID Venta</th>
                  <th className="px-6 py-6">Cliente</th>
                  <th className="px-6 py-6">Tipo Pago</th>
                  <th className="px-6 py-6">Fecha</th>
                  <th className="px-6 py-6 text-right">Total</th>
                  <th className="px-6 py-6 text-right">Pagado</th>
                  <th className="px-6 py-6 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-text-main/5 text-sm">
                {filteredSales.map((sale) => (
                  <tr key={sale.id_venta} className="hover:bg-primary hover:text-bg-main transition-all group">
                    <td className="px-6 py-6 font-bold">#{sale.id_venta}</td>
                    <td className="px-6 py-6 font-bold text-lg">{sale.nombre_cliente}</td>
                    <td className="px-6 py-6 text-xs uppercase font-bold opacity-60 group-hover:opacity-100">{sale.tipo_venta_nombre}</td>
                    <td className="px-6 py-6 opacity-60 group-hover:opacity-100">
                      {new Date(sale.fecha_venta).toLocaleDateString('es-PE')}
                    </td>
                    <td className="px-6 py-6 text-right font-black text-xl">${sale.total.toFixed(2)}</td>
                    <td className="px-6 py-6 text-right font-bold text-xl">${sale.monto_pagado.toFixed(2)}</td>
                    <td className="px-6 py-6 text-center">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        sale.estado === 'PAGADO' ? "bg-success/10 text-success" : "bg-orange-500/10 text-orange-600"
                      )}>
                        {sale.estado}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center font-medium text-text-main/60">
                      No se encontraron ventas para los criterios seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
