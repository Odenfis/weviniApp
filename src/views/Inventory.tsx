import React, { useState, useEffect } from 'react';
import {
  Search,
  Package,
  AlertCircle,
  Pencil
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
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [adjustmentValue, setAdjustmentValue] = useState<string>('0');
  const [operation, setOperation] = useState<'add' | 'subtract'>('add');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/saldos');
      const data = await res.json();
      setInventory(data);
    } catch (err) {
      console.error('Error fetching inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (item: InventoryItem) => {
    setEditingItem(item);
    setAdjustmentValue('0');
    setOperation('add');
  };

  const handleUpdateStock = async () => {
    if (!editingItem) return;
    const value = parseFloat(adjustmentValue);
    if (isNaN(value)) return;

    const finalAdjustment = operation === 'add' ? value : -value;

    try {
      const res = await fetch(`http://localhost:3001/api/saldos/${editingItem.id_saldo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ajuste_stock: finalAdjustment }),
      });
      if (res.ok) {
        setEditingItem(null);
        fetchInventory();
      } else {
        alert('Error updating stock');
      }
    } catch (err) {
      console.error('Error updating stock:', err);
      alert('Error updating stock');
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
           <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-text-main leading-tight tracking-tighter">Inventario de Saldos.</h1>
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
                     <th className="px-6 py-6 text-xs font-black uppercase tracking-[0.3em] text-orange-600">Unidad</th>
                     <th className="px-6 py-6 text-right text-xs font-black uppercase tracking-[0.3em] text-orange-600">Stock Actual</th>
                    <th className="px-6 py-6 text-right text-xs font-black uppercase tracking-[0.3em]">Reservado</th>
                    <th className="px-6 py-6 text-right text-xs font-black uppercase tracking-[0.3em]">Costo Prom.</th>
                    <th className="px-6 py-6 text-center text-xs font-black uppercase tracking-[0.3em]">Acciones</th>
                  </tr>
                </thead>
               <tbody className="divide-y divide-text-main/5 text-sm">
                 {filteredInventory.map((item) => (
                   <tr key={item.id_saldo} className="hover:bg-primary hover:text-bg-main transition-all group">
                      <td className="px-6 py-6 font-bold text-lg">{item.producto_nombre || 'N/A'}</td>
                     <td className="px-6 py-6 text-sm uppercase opacity-60 group-hover:opacity-100">{item.almacen_nombre || 'N/A'}</td>
                      <td className="px-6 py-6 text-sm uppercase font-bold text-orange-600 group-hover:opacity-100">{item.unidad || '---'}</td>
                       <td className="px-6 py-6 text-right font-black text-xl text-orange-600">{item.stock_actual.toFixed(0)}</td>
                      <td className="px-6 py-6 text-right font-bold text-xl">{item.stock_reservado.toFixed(2)}</td>
                      <td className="px-6 py-6 text-right font-bold text-xl">${item.costo_promedio.toFixed(2)}</td>
                      <td className="px-6 py-6 text-center">
                        <button 
                          onClick={() => handleEditClick(item)}
                          className="p-2 rounded-full hover:bg-text-main/10 text-text-main group-hover:text-bg-main transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                   </tr>
                 ))}
                 {filteredInventory.length === 0 && (
                   <tr>
                      <td colSpan={7} className="px-6 py-20 text-center font-medium text-text-main/60">
                       No se encontraron registros de stock.
                      </td>
                   </tr>
                 )}
               </tbody>

            </table>
          </div>
        )}
      </div>

      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-text-main/20 backdrop-blur-sm animate-in fade-in duration-300">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-bg-main p-8 rounded-2xl shadow-2xl border border-text-main/10 w-full max-w-md space-y-6"
          >
            <div>
              <h2 className="text-2xl font-black text-text-main">Ajustar Stock</h2>
              <p className="text-sm text-text-main/60 uppercase tracking-widest mt-1">{editingItem.producto_nombre}</p>
            </div>

            <div className="space-y-4">
              <div className="flex p-1 bg-surface rounded-lg border border-text-main/10">
                <button 
                  onClick={() => setOperation('add')}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-all",
                    operation === 'add' ? "bg-primary text-bg-main shadow-sm" : "text-text-main/60 hover:text-text-main"
                  )}
                >
                  Aumentar (+)
                </button>
                <button 
                  onClick={() => setOperation('subtract')}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-all",
                    operation === 'subtract' ? "bg-primary text-bg-main shadow-sm" : "text-text-main/60 hover:text-text-main"
                  )}
                >
                  Disminuir (-)
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-tighter opacity-50">Cantidad a Ajustar</label>
                <input 
                  type="number" 
                  value={adjustmentValue}
                  onChange={(e) => setAdjustmentValue(e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-text-main/10 rounded-lg text-xl font-bold focus:border-primary outline-none transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setEditingItem(null)}
                className="flex-1 px-4 py-3 rounded-lg font-bold text-sm uppercase tracking-widest hover:bg-text-main/5 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleUpdateStock}
                className="flex-1 px-4 py-3 rounded-lg bg-primary text-bg-main font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Guardar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
