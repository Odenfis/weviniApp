import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  MoreVertical,
  Package,
  X,
  Save,
  Trash2,
  PlusCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Unit {
  id_unidad: number;
  codigo: string;
  nombre: string;
}

interface ProductClass {
  id_clase: number;
  codigo: string;
  nombre: string;
}

interface Product {
  id_producto: number;
  id_clase: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  id_unidad_compra: number;
  id_unidad_venta: number;
  factor_conversion: number;
  unidades_por_plancha: number;
  planchas_por_jaba: number;
  precio_costo: number;
  precio_venta_base: number;
  stock_minimo: number;
  activo: number;
  clase_nombre?: string;
  unidad_compra_nombre?: string;
  unidad_venta_nombre?: string;
}

interface ProductPrice {
  id_precio: number;
  id_producto: number;
  presentacion: string;
  cantidad_base: number;
  precio_venta: number;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [classes, setClasses] = useState<ProductClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productPrices, setProductPrices] = useState<ProductPrice[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [prodRes, unitRes, classRes] = await Promise.all([
        fetch('http://localhost:3001/api/productos?all=true'),
        fetch('http://localhost:3001/api/unidades'),
        fetch('http://localhost:3001/api/clases')
      ]);
      setProducts(await prodRes.json());
      setUnits(await unitRes.json());
      setClasses(await classRes.json());
    } catch (err) {
      console.error('Error fetching initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrices = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:3001/api/productos/${id}/precios`);
      setProductPrices(await res.json());
    } catch (err) {
      console.error('Error fetching prices:', err);
    }
  };

  const openEditModal = async (product: Product) => {
    setEditingProduct(product);
    await fetchPrices(product.id_producto);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setProductPrices([]);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (productData: any) => {
    try {
      const url = editingProduct
        ? `http://localhost:3001/api/productos/${editingProduct.id_producto}`
        : 'http://localhost:3001/api/productos';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (res.ok) {
        await fetchInitialData();
        setIsModalOpen(false);
      } else {
        const errData = await res.json();
        alert(errData.detail || 'Error al guardar el producto');
      }
    } catch (err) {
      alert('Error de conexión con el servidor');
    }
  };

  const filteredProducts = products.filter(p =>
    p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.codigo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-12 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-bg-main min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-text-main/10">
        <div>
          <span className="text-xs tracking-[0.3em] font-bold uppercase mb-2 block opacity-50">Product Management</span>
           <h1 className="text-6xl font-black text-text-main leading-tight tracking-tighter">Maestro de Productos.</h1>
        </div>
        <div className="flex gap-4">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-3 px-6 py-2 bg-primary text-bg-main rounded-full text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-xl"
          >
            <Plus className="w-3 h-3" />
            Nuevo Producto
          </button>
        </div>
      </div>

      <div className="space-y-8 pt-8 border-t border-text-main/10">
        <div className="flex items-center justify-between">
           <h3 className="text-4xl font-bold text-text-main">Cartera de Productos.</h3>
          <div className="relative shrink-0">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-text-main/30 w-3 h-3" />
            <input
              type="text"
              placeholder="Buscar código o nombre..."
              className="pl-6 pr-4 py-2 bg-transparent border-b border-text-main/10 text-xs uppercase tracking-widest focus:border-text-main outline-none transition-all placeholder:text-text-main/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
           <div className="flex justify-center py-20 font-medium text-text-main/60">Cargando catálogo...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="border-b-2 border-primary text-xs font-black uppercase tracking-[0.3em] text-primary">
                 <tr>
                   <th className="px-6 py-6 text-xs font-black uppercase tracking-[0.3em]">Código</th>
                   <th className="px-6 py-6 text-xs font-black uppercase tracking-[0.3em]">Producto</th>
                   <th className="px-6 py-6 text-xs font-black uppercase tracking-[0.3em]">Clase</th>
                   <th className="px-6 py-6 text-right text-xs font-black uppercase tracking-[0.3em]">Costo</th>
                   <th className="px-6 py-6 text-right text-xs font-black uppercase tracking-[0.3em]">Venta Base</th>
                   <th className="px-6 py-6 text-xs font-black uppercase tracking-[0.3em]">Estado</th>
                   <th className="px-6 py-6 text-center text-xs font-black uppercase tracking-[0.3em]">Acciones</th>
                 </tr>
               </thead>
              <tbody className="divide-y divide-text-main/5 text-sm">
                {filteredProducts.map((product) => (
                  <tr key={product.id_producto} className="hover:bg-primary hover:text-bg-main transition-all cursor-pointer group">
                    <td className="px-6 py-6 font-bold text-sm uppercase tracking-widest">{product.codigo}</td>
                     <td className="px-6 py-6 font-bold text-lg">{product.nombre}</td>
                    <td className="px-6 py-6 text-sm uppercase opacity-60 group-hover:opacity-100">{product.clase_nombre}</td>
                     <td className="px-6 py-6 text-right font-bold text-xl">${product.precio_costo.toFixed(2)}</td>
                     <td className="px-6 py-6 text-right font-bold text-xl">${product.precio_venta_base.toFixed(2)}</td>
                    <td className="px-6 py-6">
                      <span className={cn(
                        "text-xs font-bold uppercase tracking-widest border px-3 py-1 rounded-full",
                        product.activo
                          ? "border-success text-success"
                          : "border-error text-error"
                      )}>
                        {product.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <button
                        onClick={() => openEditModal(product)}
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
          <ProductModal
            product={editingProduct}
            units={units}
            classes={classes}
            prices={productPrices}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveProduct}
            onPriceChange={setProductPrices}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductModal({ product, units, classes, prices, onClose, onSave, onPriceChange }: any) {
  const [formData, setFormData] = useState({
    id_clase: product?.id_clase || '',
    codigo: product?.codigo || '',
    nombre: product?.nombre || '',
    descripcion: product?.descripcion || '',
    id_unidad_compra: product?.id_unidad_compra || '',
    id_unidad_venta: product?.id_unidad_venta || '',
    factor_conversion: product?.factor_conversion || 1,
    unidades_por_plancha: product?.unidades_por_plancha || '',
    planchas_por_jaba: product?.planchas_por_jaba || '',
    precio_costo: product?.precio_costo || 0,
    precio_venta_base: product?.precio_venta_base || 0,
    stock_minimo: product?.stock_minimo || 0,
    activo: product?.activo ?? 1,
  });

  const [localPrices, setLocalPrices] = useState([...(prices || [])]);

  const addPriceRow = () => {
    setLocalPrices([...localPrices, { id_precio: 0, presentacion: '', cantidad_base: 1, precio_venta: 0 }]);
  };

  const updatePriceRow = (index: number, field: string, value: any) => {
    const newPrices = [...localPrices];
    newPrices[index] = { ...newPrices[index], [field]: value };
    setLocalPrices(newPrices);
  };

  const removePriceRow = (index: number) => {
    setLocalPrices(localPrices.filter((_, i) => i !== index));
  };

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
              {product ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <p className="text-xs uppercase tracking-widest text-text-main/40">Configuración Técnica de Inventario</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface rounded-full transition-colors">
            <X className="w-6 h-6 text-text-main" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-12">
          {/* SECCIÓN GENERAL */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-text-main/30 border-b border-text-main/5 pb-2">Identificación</h4>
              <div className="space-y-4">
                <FormInput
                  label="Código"
                  value={formData.codigo}
                  onChange={(v) => setFormData({ ...formData, codigo: v })}
                  required
                />
                <FormInput
                  label="Nombre"
                  value={formData.nombre}
                  onChange={(v) => setFormData({ ...formData, nombre: v })}
                  required
                />
                <FormInput
                  label="Descripción"
                  value={formData.descripcion}
                  onChange={(v) => setFormData({ ...formData, descripcion: v })}
                />
              </div>
            </div>

            <div className="md:col-span-1 space-y-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-text-main/30 border-b border-text-main/5 pb-2">Clasificación</h4>
              <div className="space-y-4">
                <FormSelect
                  label="Clase"
                  options={classes}
                  value={formData.id_clase}
                  onChange={(v) => setFormData({ ...formData, id_clase: parseInt(v) })}
                  required
                />
                <div className="flex items-center gap-3 py-4">
                  <input
                    type="checkbox"
                    checked={formData.activo === 1}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked ? 1 : 0 })}
                    className="w-4 h-4 accent-primary"
                  />
                  <label className="text-xs font-bold uppercase tracking-widest text-text-main">Producto Activo</label>
                </div>
              </div>
            </div>

            <div className="md:col-span-1 space-y-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-text-main/30 border-b border-text-main/5 pb-2">Finanzas & Stock</h4>
              <div className="space-y-4">
                <FormInput
                  label="Precio Costo"
                  type="number"
                  value={formData.precio_costo}
                  onChange={(v) => setFormData({ ...formData, precio_costo: parseFloat(v) })}
                />
                <FormInput
                  label="Venta Base"
                  type="number"
                  value={formData.precio_venta_base}
                  onChange={(v) => setFormData({ ...formData, precio_venta_base: parseFloat(v) })}
                />
                <FormInput
                  label="Stock Mínimo"
                  type="number"
                  value={formData.stock_minimo}
                  onChange={(v) => setFormData({ ...formData, stock_minimo: parseFloat(v) })}
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN LOGÍSTICA */}
          <div className="space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-text-main/30 border-b border-text-main/5 pb-2">Logística de Unidades</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <FormSelect
                label="Unidad Compra"
                options={units}
                value={formData.id_unidad_compra}
                onChange={(v) => setFormData({ ...formData, id_unidad_compra: parseInt(v) })}
                required
              />
              <FormSelect
                label="Unidad Venta"
                options={units}
                value={formData.id_unidad_venta}
                onChange={(v) => setFormData({ ...formData, id_unidad_venta: parseInt(v) })}
                required
              />
              <FormInput
                label="Factor Conversión"
                type="number"
                value={formData.factor_conversion}
                onChange={(v) => setFormData({ ...formData, factor_conversion: parseFloat(v) })}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Und x Plancha"
                  type="number"
                  value={formData.unidades_por_plancha}
                  onChange={(v) => setFormData({ ...formData, unidades_por_plancha: parseInt(v) })}
                />
                <FormInput
                  label="Planchas x Jaba"
                  type="number"
                  value={formData.planchas_por_jaba}
                  onChange={(v) => setFormData({ ...formData, planchas_por_jaba: parseInt(v) })}
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN PRECIOS */}
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-text-main/5 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-text-main/30">Presentaciones de Precio</h4>
              <button
                onClick={addPriceRow}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-main hover:underline"
              >
                <PlusCircle className="w-3 h-3" />
                Agregar Presentación
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-xs font-bold uppercase tracking-widest opacity-40">
                  <tr>
                    <th className="pb-4 px-2">Presentación</th>
                    <th className="pb-4 px-2 w-32">Cant. Base</th>
                    <th className="pb-4 px-2 w-32">Precio Venta</th>
                    <th className="pb-4 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="space-y-4">
                  {localPrices.map((price, idx) => (
                    <tr key={idx} className="group">
                      <td className="py-2 px-2">
                        <input
                          className="w-full bg-transparent border-b border-text-main/10 text-base outline-none focus:border-text-main transition-all"
                          value={price.presentacion}
                          onChange={(e) => updatePriceRow(idx, 'presentacion', e.target.value)}
                          placeholder="Ej: Bolsa 25 und"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          className="w-full bg-transparent border-b border-text-main/10 text-base outline-none focus:border-text-main transition-all"
                          value={price.cantidad_base}
                          onChange={(e) => updatePriceRow(idx, 'cantidad_base', parseFloat(e.target.value))}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          className="w-full bg-transparent border-b border-text-main/10 text-base outline-none focus:border-text-main transition-all"
                          value={price.precio_venta}
                          onChange={(e) => updatePriceRow(idx, 'precio_venta', parseFloat(e.target.value))}
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => removePriceRow(idx)}
                          className="p-1 text-error hover:text-error/80 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {localPrices.length === 0 && (
                    <tr>
                       <td colSpan={4} className="py-8 text-center font-medium text-text-main/60 text-xs">No hay presentaciones definidas</td>
                    </tr>
                  )}
                </tbody>
              </table>
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
            Guardar Producto
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function FormInput({ label, value, onChange, type = 'text', required = false }: any) {
  return (
    <div className="group">
      <label className="block text-xs font-bold text-text-main/40 uppercase tracking-widest mb-1 group-focus-within:text-text-main transition-colors">
        {label} {required && <span className="text-error">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
         className="w-full bg-transparent border-b border-text-main/10 py-1 text-lg font-bold outline-none focus:border-text-main transition-all"
      />
    </div>
  );
}

function FormSelect({ label, options, value, onChange, required = false }: any) {
  return (
    <div className="group">
      <label className="block text-xs font-bold text-text-main/40 uppercase tracking-widest mb-1 group-focus-within:text-text-main transition-colors">
        {label} {required && <span className="text-error">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
         className="w-full bg-transparent border-b border-text-main/10 py-1 text-lg font-bold outline-none focus:border-text-main transition-all appearance-none cursor-pointer"
      >
        <option value="">Seleccione...</option>
        {options.map((opt: any) => (
          <option key={opt.id_unidad || opt.id_clase} value={opt.id_unidad || opt.id_clase}>
            {opt.nombre} {opt.codigo && `(${opt.codigo})`}
          </option>
        ))}
      </select>
    </div>
  );
}
