import React, { useState, useEffect } from 'react';
import { Save, Settings, User, Warehouse, ToggleLeft, ToggleRight } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Configuration() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [config, setConfig] = useState({
    id_cliente: '',
    id_almacen: '',
    automatico: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [custRes, wareRes, confRes] = await Promise.all([
        apiFetch('/api/clientes?all=true').then(res => res.json()),
        apiFetch('/api/almacenes').then(res => res.json()),
        apiFetch('/api/config/pos').then(res => res.json()),
      ]);

      setCustomers(Array.isArray(custRes) ? custRes : []);
      setWarehouses(Array.isArray(wareRes) ? wareRes : []);
      setConfig({
        id_cliente: confRes.id_cliente || '',
        id_almacen: confRes.id_almacen || '',
        automatico: !!confRes.automatico,
      });
    } catch (err) {
      console.error('Error loading configuration data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch('/api/config/pos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_cliente: config.id_cliente ? parseInt(config.id_cliente) : null,
          id_almacen: config.id_almacen ? parseInt(config.id_almacen) : null,
          automatico: config.automatico ? 1 : 0,
        }),
      });

      if (res.ok) {
        setMessage({ text: 'Configuración guardada exitosamente', type: 'success' });
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (err) {
      setMessage({ text: 'Error al guardar la configuración', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-main">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-bg-main p-8 animate-in fade-in duration-700 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-text-main tracking-tighter">Configuración del Sistema</h1>
            <p className="text-sm font-medium opacity-40">Ajustes globales para el punto de venta (POS)</p>
          </div>
          <Settings className="w-8 h-8 opacity-20" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-text-main/10 rounded-3xl p-8 space-y-8 backdrop-blur-sm"
        >
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-text-main flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              POS Automático
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-main opacity-50 flex items-center gap-2">
                  <User className="w-3 h-3" /> Cliente Predeterminado
                </label>
                <select
                  className="w-full p-3 text-xs font-bold uppercase tracking-widest border border-text-main/10 rounded-xl bg-transparent focus:outline-none focus:border-primary text-text-main"
                  value={config.id_cliente}
                  onChange={(e) => setConfig({ ...config, id_cliente: e.target.value })}
                >
                  <option value="">Ninguno (Manual)</option>
                  {customers.map(c => (
                    <option key={c.id_cliente} value={c.id_cliente}>{c.razon_social} ({c.codigo})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-main opacity-50 flex items-center gap-2">
                  <Warehouse className="w-3 h-3" /> Almacén Predeterminado
                </label>
                <select
                  className="w-full p-3 text-xs font-bold uppercase tracking-widest border border-text-main/10 rounded-xl bg-transparent focus:outline-none focus:border-primary text-text-main"
                  value={config.id_almacen}
                  onChange={(e) => setConfig({ ...config, id_almacen: e.target.value })}
                >
                  <option value="">Ninguno (Manual)</option>
                  {warehouses.map(w => (
                    <option key={w.id_almacen} value={w.id_almacen}>{w.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-text-main/10 rounded-2xl bg-white/5">
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-widest text-text-main">Activar POS Automático</span>
                <span className="text-[10px] opacity-40 font-medium">Si está activo, el sistema seleccionará automáticamente el cliente y almacén definidos arriba al abrir el POS.</span>
              </div>
              <button 
                onClick={() => setConfig({ ...config, automatico: !config.automatico })}
                className={cn(
                  "relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none",
                  config.automatico ? "bg-primary" : "bg-text-main/20"
                )}
              >
                <motion.div 
                  animate={{ x: config.automatico ? 24 : 4 }}
                  className="absolute top-1 w-4 h-4 bg-bg-main rounded-full shadow-sm" 
                />
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-text-main/10 flex items-center justify-between">
            {message && (
              <span className={cn(
                "text-xs font-bold uppercase tracking-widest",
                message.type === 'success' ? "text-green-500" : "text-error"
              )}>
                {message.text}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-primary text-bg-main rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-xl flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? "Guardando..." : <><Save className="w-3 h-3" /> Guardar Configuración</>}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
