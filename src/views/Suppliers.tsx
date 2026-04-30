import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  MoreVertical,
  X,
  Save,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Supplier {
  id_proveedor: number;
  codigo: string;
  razon_social: string;
  nombre_comercial: string;
  ruc: string;
  telefono: string;
  celular: string;
  email: string;
  contacto: string;
  direccion: string;
  ciudad: string;
  dias_pago: number;
  saldo_acreedor: number;
  activo: number;
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [nextCode, setNextCode] = useState<string>('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/suppliers?all=true');
      const data = await res.json();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const openCreateModal = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/suppliers/next-code');
      const { nextCode } = await res.json();
      setNextCode(nextCode.toString());
    } catch (err) {
      console.error('Error fetching next code:', err);
      setNextCode('');
    }
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const handleSaveSupplier = async (supplierData: any) => {
    try {
      const url = editingSupplier
        ? `http://localhost:3001/api/suppliers/${editingSupplier.id_proveedor}`
        : 'http://localhost:3001/api/suppliers';
      const method = editingSupplier ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierData),
      });

      if (res.ok) {
        await fetchSuppliers();
        setIsModalOpen(false);
      } else {
        const errData = await res.json();
        alert(errData.detail || 'Error al guardar el proveedor');
      }
    } catch (err) {
      alert('Error de conexión con el servidor');
    }
  };

  const filteredSuppliers = suppliers.filter(s => {
    const search = searchQuery.toLowerCase();
    return (
      (s.razon_social || '').toLowerCase().includes(search) ||
      (s.codigo || '').toLowerCase().includes(search) ||
      (s.ruc || '').toLowerCase().includes(search)
    );
  });

  return (
    <div className="p-12 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-bg-main min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-text-main/10">
        <div>
          <span className="text-xs tracking-[0.3em] font-bold uppercase mb-2 block opacity-50">Supplier Management</span>
           <h1 className="text-6xl font-black text-text-main leading-tight tracking-tighter">Maestro de Proveedores.</h1>
        </div>
        <div className="flex gap-4">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-3 px-6 py-2 bg-primary text-bg-main rounded-full text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-xl"
          >
            <Plus className="w-3 h-3" />
            Nuevo Proveedor
          </button>
        </div>
      </div>

      <div className="space-y-8 pt-8 border-t border-text-main/10">
        <div className="flex items-center justify-between">
           <h3 className="text-4xl font-bold text-text-main">Cartera de Proveedores.</h3>
          <div className="relative shrink-0">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-text-main/30 w-3 h-3" />
            <input
              type="text"
              placeholder="Buscar código, RUC o razón social..."
              className="pl-6 pr-4 py-2 bg-transparent border-b border-text-main/10 text-xs uppercase tracking-widest focus:border-text-main outline-none transition-all placeholder:text-text-main/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
           <div className="flex justify-center py-20 font-medium text-text-main/60">Cargando proveedores...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="border-b-2 border-primary text-xs font-black uppercase tracking-[0.3em] text-primary">
                 <tr>
                   <th className="px-6 py-6 text-xs font-black uppercase tracking-[0.3em]">Código</th>
                   <th className="px-6 py-6 text-xs font-black uppercase tracking-[0.3em]">Razón Social</th>
                   <th className="px-6 py-6 text-xs font-black uppercase tracking-[0.3em]">Nombre Comercial</th>
                   <th className="px-6 py-6 text-xs font-black uppercase tracking-[0.3em]">RUC</th>
                   <th className="px-6 py-6 text-xs font-black uppercase tracking-[0.3em]">Estado</th>
                   <th className="px-6 py-6 text-center text-xs font-black uppercase tracking-[0.3em]">Acciones</th>
                 </tr>
               </thead>
              <tbody className="divide-y divide-text-main/5 text-sm">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id_proveedor} className="hover:bg-primary hover:text-bg-main transition-all cursor-pointer group">
                    <td className="px-6 py-6 font-bold text-sm uppercase tracking-widest">{supplier.codigo}</td>
                     <td className="px-6 py-6 font-bold text-lg">{supplier.razon_social}</td>
                     <td className="px-6 py-6 font-medium text-lg opacity-80">{supplier.nombre_comercial}</td>
                    <td className="px-6 py-6 text-sm uppercase opacity-60 group-hover:opacity-100">{supplier.ruc}</td>
                    <td className="px-6 py-6">
                      <span className={cn(
                        "text-xs font-bold uppercase tracking-widest border px-3 py-1 rounded-full",
                        supplier.activo
                          ? "border-success text-success"
                          : "border-error text-error"
                      )}>
                        {supplier.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <button
                        onClick={() => openEditModal(supplier)}
                        className="text-text-main/30 group-hover:text-bg-main transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

       <AnimatePresence>
          {isModalOpen && (
            <SupplierModal
              supplier={editingSupplier}
              nextCode={nextCode}
              onClose={() => setIsModalOpen(false)}
              onSave={handleSaveSupplier}
            />
          )}
        </AnimatePresence>

    </div>
  );
}

function SupplierModal({ supplier, nextCode, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    codigo: supplier?.codigo || nextCode || '',
    razon_social: supplier?.razon_social || '',
    nombre_comercial: supplier?.nombre_comercial || '',
    ruc: supplier?.ruc || '',
    telefono: supplier?.telefono || '',
    celular: supplier?.celular || '',
    email: supplier?.email || '',
    contacto: supplier?.contacto || '',
    direccion: supplier?.direccion || '',
    ciudad: supplier?.ciudad || '',
    dias_pago: supplier?.dias_pago || 0,
    saldo_acreedor: supplier?.saldo_acreedor || 0,
    activo: supplier?.activo ?? 1,
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-text-main/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-bg-main w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl shadow-2xl border border-text-main/10"
      >
        <div className="p-8 border-b border-text-main/10 flex justify-between items-center bg-white">
          <div>
             <h2 className="text-3xl font-bold text-text-main">
              {supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </h2>
            <p className="text-xs uppercase tracking-widest text-text-main/40">Información Maestra de Proveedor</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface rounded-full transition-colors">
            <X className="w-6 h-6 text-text-main" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-text-main/30 border-b border-text-main/5 pb-2">Identificación</h4>
              <div className="space-y-4">
                  <FormInput
                    label="Código"
                    value={formData.codigo}
                    onChange={(v) => setFormData({ ...formData, codigo: v })}
                    required
                    readOnly={!supplier}
                  />

                <FormInput
                  label="Razón Social"
                  value={formData.razon_social}
                  onChange={(v) => setFormData({ ...formData, razon_social: v })}
                  required
                />
                <FormInput
                  label="RUC"
                  value={formData.ruc}
                  onChange={(v) => setFormData({ ...formData, ruc: v })}
                />
              </div>
            </div>

            <div className="md:col-span-1 space-y-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-text-main/30 border-b border-text-main/5 pb-2">Detalles Comerciales</h4>
              <div className="space-y-4">
                <FormInput
                  label="Nombre Comercial"
                  value={formData.nombre_comercial}
                  onChange={(v) => setFormData({ ...formData, nombre_comercial: v })}
                />
                <FormInput
                  label="Persona de Contacto"
                  value={formData.contacto}
                  onChange={(v) => setFormData({ ...formData, contacto: v })}
                />
                <div className="flex items-center gap-3 py-4">
                  <input
                    type="checkbox"
                    checked={formData.activo === 1}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked ? 1 : 0 })}
                    className="w-4 h-4 accent-primary"
                  />
                  <label className="text-xs font-bold uppercase tracking-widest text-text-main">Proveedor Activo</label>
                </div>
              </div>
            </div>

            <div className="md:col-span-1 space-y-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-text-main/30 border-b border-text-main/5 pb-2">Finanzas</h4>
              <div className="space-y-4">
                <FormInput
                  label="Días de Pago"
                  type="number"
                  value={formData.dias_pago}
                  onChange={(v) => setFormData({ ...formData, dias_pago: parseInt(v) })}
                />
                <FormInput
                  label="Saldo Acreedor"
                  type="number"
                  value={formData.saldo_acreedor}
                  onChange={(v) => setFormData({ ...formData, saldo_acreedor: parseFloat(v) })}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-text-main/30 border-b border-text-main/5 pb-2">Contacto</h4>
              <div className="grid grid-cols-1 gap-4">
                <FormInput
                  label="Teléfono"
                  value={formData.telefono}
                  onChange={(v) => setFormData({ ...formData, telefono: v })}
                />
                <FormInput
                  label="Celular"
                  value={formData.celular}
                  onChange={(v) => setFormData({ ...formData, celular: v })}
                />
                <FormInput
                  label="Email"
                  value={formData.email}
                  onChange={(v) => setFormData({ ...formData, email: v })}
                />
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-text-main/30 border-b border-text-main/5 pb-2">Ubicación</h4>
              <div className="grid grid-cols-1 gap-4">
                <FormInput
                  label="Dirección"
                  value={formData.direccion}
                  onChange={(v) => setFormData({ ...formData, direccion: v })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <FormInput
                      label="Ciudad"
                      value={formData.ciudad}
                      onChange={(v) => setFormData({ ...formData, ciudad: v })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-text-main/10 bg-white flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 text-xs font-bold uppercase tracking-widest text-text-main/40 hover:text-text-main transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(formData)}
            className="flex items-center gap-3 px-8 py-2 bg-primary text-bg-main rounded-full text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg"
          >
            <Save className="w-3 h-3" />
            Guardar Proveedor
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function FormInput({ label, value, onChange, type = 'text', required = false, readOnly = false }: any) {
  return (
    <div className="group">
      <label className="block text-xs font-bold text-text-main/40 uppercase tracking-widest mb-1 group-focus-within:text-text-main transition-colors">
        {label} {required && <span className="text-error">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        className={cn(
           "w-full bg-transparent border-b border-text-main/10 py-1 text-lg font-bold outline-none focus:border-text-main transition-all",
          readOnly ? "bg-surface opacity-100 font-bold text-text-main cursor-not-allowed" : ""
        )}
      />
    </div>
  );
}
