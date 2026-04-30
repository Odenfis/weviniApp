import React, { useState, useEffect } from 'react';
import {
  Search,
  Package,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface InventoryItem {
  id_saldo: number;
  id_producto: number;
  id_almacen: number;
  lote: string | null;
  fecha_vencimiento: string | null;
  unidad: string | null;
  stock_actual: number;
  stock_reservado: number;
  costo_promedio: number;
  ultima_actualizacion: string;
  producto_nombre?: string;
  almacen_nombre?: string;
}

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      // Assuming there's an endpoint for saldos that joins products and warehouses
      const res = await fetch('http://localhost:3001/api/saldos');
      const data = await res.json();
      setInventory(data);
    } catch (err) {
      console.error('Error fetching inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventory.filter(item =>
    (item.producto_nombre?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     item.almacen_nombre?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-12 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-bg-main min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-text-main/10">
        <div>
          <span className="text-xs tracking-[0.3em] font-bold uppercase mb-2 block opacity-50">Stock Control</span>
           <h1 className="text-6xl font-black text-text-main leading-tight tracking-tighter">Inventario de Saldos.</h1>
        </div>
      </div>

      <div className="space-y-8 pt-8 border-t border-text-main/10">
        <div className="flex items-center justify-between">
           <h3 className="text-4xl font-bold text-text-main">Existencias Actuales.</h3>
          <div className="relative shrink-0">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-text-main/30 w-3 h-3" />
            <input
              type="text"
              placeholder="Buscar producto o almacén..."
              className="pl-6 pr-4 py-2 bg-transparent border-b border-text-main/10 text-xs uppercase tracking-widest focus:border-text-main outline-none transition-all placeholder:text-text-main/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
           <div className="flex justify-center py-20 font-medium text-text-main/60">Cargando existencias...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="border-b-2 border-primary text-xs font-black uppercase tracking-[0.3em] text-primary">
                 <tr>
                   <th className="px-6 py-6 text-xs font-black uppercase tracking-[0.3em]">Producto</th>
                   <th className="px-6 py-6 text-xs font-black uppercase tracking-[0.3em]">Almacén</th>
                   <th className="px-6 py-6 text-xs font-black uppercase tracking-[0.3em]">Unidad</th>
                   <th className="px-6 py-6 text-right text-xs font-black uppercase tracking-[0.3em]">Stock Actual</th>
                   <th className="px-6 py-6 text-right text-xs font-black uppercase tracking-[0.3em]">Reservado</th>
                   <th className="px-6 py-6 text-right text-xs font-black uppercase tracking-[0.3em]">Costo Prom.</th>
                 </tr>
               </thead>
              <tbody className="divide-y divide-text-main/5 text-sm">
                {filteredInventory.map((item) => (
                  <tr key={item.id_saldo} className="hover:bg-primary hover:text-bg-main transition-all cursor-pointer group">
                     <td className="px-6 py-6 font-bold text-lg">{item.producto_nombre || 'N/A'}</td>
                    <td className="px-6 py-6 text-sm uppercase opacity-60 group-hover:opacity-100">{item.almacen_nombre || 'N/A'}</td>
                    <td className="px-6 py-6 text-sm uppercase font-bold text-primary group-hover:opacity-100">{item.unidad || '---'}</td>
                     <td className="px-6 py-6 text-right font-black text-xl text-primary">{item.stock_actual.toFixed(0)}</td>
                     <td className="px-6 py-6 text-right font-bold text-xl">{item.stock_reservado.toFixed(2)}</td>
                     <td className="px-6 py-6 text-right font-bold text-xl">${item.costo_promedio.toFixed(2)}</td>
                  </tr>
                ))}
                {filteredInventory.length === 0 && (
                  <tr>
                     <td colSpan={6} className="px-6 py-20 text-center font-medium text-text-main/60">
                      No se encontraron registros de stock.
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
