import React, { useState, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  UserPlus,
  X,
  Minus,
  Plus,
  CreditCard,
  Wallet,
  ArrowRight,
  PlusCircle,
  Package,
  Trash2,
  ShoppingBag,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function POS() {
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [saldos, setSaldos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [docType, setDocType] = useState(1); // 1: Boleta, 2: Factura
  const [saleType, setSaleType] = useState(1); // 1: Contado, 2: Crédito
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<any>(null);
  const [presentations, setPresentations] = useState<any[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [prodRes, wareRes, custRes, salRes] = await Promise.all([
        fetch('/api/productos').then(res => res.json()),
        fetch('/api/almacenes').then(res => res.json()),
        fetch('/api/clientes?all=true').then(res => res.json()),
        fetch('/api/saldos').then(res => res.json()),
      ]);
      setProducts(prodRes);
      setWarehouses(wareRes);
      setCustomers(custRes);
      setSaldos(salRes);
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = async (product: any) => {
    console.log('Product selected:', product);
    setPendingProduct(product);
    try {
      const res = await fetch(`/api/productos/${product.id_producto}/presentaciones`);
      const data = await res.json();
      console.log('Presentations fetched:', data);
      setPresentations(data);
      setShowPriceModal(true);
    } catch (err) {
      console.error('Error fetching presentations:', err);
    }
  };

  const addSelectedPresentation = (priceData: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id_producto === priceData.id_producto && item.selectedPresentation === priceData.presentacion);
      if (existing) {
        return prev.map(item => (item.id_producto === priceData.id_producto && item.selectedPresentation === priceData.presentacion) ? { ...item, qty: item.qty + 1 } : item);
      }

      return [...prev, {
        id_producto: priceData.id_producto,
        name: priceData.Nombre,
        priceMap: presentations.reduce((acc, p) => {
          acc[p.presentacion] = { price: p.precio_venta, cost: p.precio_compra, code: p.codigo_unidad, base: p.cantidad_base };
          return acc;
        }, {} as any),
        selectedPresentation: priceData.presentacion,
        selectedPrice: priceData.precio_venta,
        selectedCost: priceData.precio_compra,
        selectedUnitCode: priceData.codigo_unidad,
        planchas: 0,
        unidades: 0,
        qty: 1
      }];
    });
    setShowPriceModal(false);
    setPendingProduct(null);
  };

  const removeFromCart = (id_producto: number, presentation: string) => {
    setCart(prev => prev.filter(item => !(item.id_producto === id_producto && item.selectedPresentation === presentation)));
  };

  const updateQty = (id_producto: number, presentation: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id_producto === id_producto && item.selectedPresentation === presentation) {
        return { ...item, qty: Math.max(1, item.qty + delta) };
      }
      return item;
    }));
  };

  const updateCombinedQty = (id_producto: number, field: 'planchas' | 'unidades', value: number) => {
    setCart(prev => prev.map(item => {
      if (item.id_producto === id_producto) {
        return { ...item, [field]: Math.max(0, value) };
      }
      return item;
    }));
  };

  const calculateItemTotal = (item: any) => {
    return item.selectedPrice * item.qty;
  };

  const getBaseFactor = (priceMap: any, searchKey: string) => {
    if (!priceMap) return 1;
    if (priceMap[searchKey]) return priceMap[searchKey].base;
    
    const key = Object.keys(priceMap).find(k => k.toUpperCase().includes(searchKey.toUpperCase()));
    return key ? priceMap[key].base : 1;
  };

  const calculateTotalRequestedInUnits = (item: any) => {
    const pBase = getBaseFactor(item.priceMap, 'PLANCHA');
    const uBase = getBaseFactor(item.priceMap, 'UNIDAD');
    const gBase = item.priceMap?.[item.selectedPresentation]?.base || 1;

    if (item.planchas > 0 || item.unidades > 0) {
      return (item.planchas * pBase) + (item.unidades * uBase);
    }
    return item.qty * gBase;
  };

  const isStockInsufficient = (item: any, warehouse: any) => {
    if (!warehouse) return false;
    const saldo = saldos?.find((s: any) => s.id_producto === item.id_producto && s.id_almacen === warehouse.id_almacen);
    if (!saldo) return true; // No saldo record means no stock

    const requestedUnits = calculateTotalRequestedInUnits(item);
    const stockActual = saldo.stock_actual || 0;
    const stockUnit = saldo.Unidad || 'UNIDADES';

    // Convert stock to units for a fair comparison
    const pBase = getBaseFactor(item.priceMap, 'PLANCHA');
    const stockInUnits = stockUnit.toUpperCase() === 'PLANCHAS' 
      ? stockActual * pBase 
      : stockActual;

    return requestedUnits > stockInUnits;
  };

  const subtotal = cart.reduce((acc, item) => acc + calculateItemTotal(item), 0);
  const igv = subtotal * 0.18;
  const total = subtotal + igv;

  const finalizeSale = async () => {
    if (!selectedCustomer || !selectedWarehouse) {
      alert('Please select a customer and warehouse');
      return;
    }

    try {
      // Stock check for confirmation
      let insufficientStock = false;
      cart.forEach(item => {
        if (isStockInsufficient(item, selectedWarehouse)) {
          insufficientStock = true;
        }
      });

      if (insufficientStock) {
        alert("❌ ERROR: FALTA DE SALDOS\nAlgunos productos no tienen stock suficiente en el almacén seleccionado. La venta ha sido bloqueada.");
        return;
      }

      const docRes = await fetch('/api/ventas/next-doc').then(res => res.json());
      const nextDoc = docRes.nextCode;

      const saleDetails: any[] = [];

      cart.forEach(item => {
        const { planchas, unidades, priceMap, qty, selectedPrice, selectedCost } = item;

        // Determine the units for both financial and inventory records
        // Use the actual unit code for the invoice
        const unitFactura = (item.selectedUnitCode || 'UND').padEnd(10, ' ');

        // Determine which inventory unit to deduct from based on the quantity type used
        let unitSaldos = 'UNIDADES';
        if (planchas > 0) {
          unitSaldos = 'PLANCHAS';
        } else if (unidades > 0) {
          unitSaldos = 'UNIDADES';
        } else {
          const productSaldo = saldos?.find((s: any) => s.id_producto === item.id_producto && s.id_almacen === selectedWarehouse?.id_almacen);
          unitSaldos = productSaldo?.Unidad || 'UNIDADES';
        }

        // Calculate stock quantity to deduct
        const pBase = priceMap['PLANCHA']?.base || 1;
        const uBase = priceMap['UNIDAD']?.base || 1;
        const gBase = priceMap[item.selectedPresentation]?.base || 1;

        const stockQuantity = (planchas > 0) ? planchas :
          (unidades > 0) ? unidades :
            (qty * gBase);

        saleDetails.push({
          id_producto: item.id_producto,
          unidad_factura: unitFactura,   // FK match for invoice
          unidad_saldos: unitSaldos,     // Match for inventory
          cantidad_venta: qty,           // Financial quantity
          cantidad_stock: stockQuantity, // Inventory quantity
          precio_unitario: selectedPrice,
          descuento: 0,
          subtotal: qty * selectedPrice,
          costo_unitario: selectedCost
        });
      });

      const saleData = {
        id_cliente: selectedCustomer.id_cliente,
        id_almacen: selectedWarehouse.id_almacen,
        numero_doc: nextDoc,
        tipo_doc: docType,
        tipo_venta: saleType,
        subtotal: subtotal,
        descuento: 0,
        igv: igv,
        total: total,
        monto_pagado: saleType === 1 ? total : 0,
        saldo: saleType === 2 ? total : 0,
        estado: saleType === 1 ? 'PAGADO' : 'PENDIENTE',
        observaciones: observations,
        detalles: saleDetails
      };

      const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });

      if (res.ok) {
        alert('Venta realizada correctamente!');
        setCart([]);
        setSelectedCustomer(null);
        setSelectedWarehouse(null);
        setObservations('');
      } else {
        const err = await res.json();
        alert('Error: ' + err.message);
      }
    } catch (err) {
      console.error('Sale error:', err);
      alert('An unexpected error occurred');
    }
  };

  const filteredProducts = products.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-main">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full animate-in fade-in duration-700 bg-bg-main overflow-hidden">
        {/* LEFT PANEL: TICKET */}
        <div className="w-[800px] border-r border-text-main/10 flex flex-col bg-bg-main relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-text-main opacity-10"></div>

          <div className="p-5 border-b border-text-main/10 space-y-3">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-4xl font-black text-text-main">Ticket Activo</h3>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{cart.length} Items</span>
            </div>


            <div className="grid grid-cols-1 gap-3">
              <div className="relative">
                <span className="text-[9px] font-black uppercase tracking-widest text-text-main block mb-1">Seleccionar Cliente</span>
                <select
                  className="w-full p-2 text-xs font-bold uppercase tracking-widest border border-text-main/10 rounded-lg appearance-none bg-transparent focus:outline-none focus:border-primary text-text-main"
                  value={selectedCustomer?.id_cliente || ''}
                  onChange={(e) => setSelectedCustomer(customers.find(c => c.id_cliente === parseInt(e.target.value)))}
                >
                  <option value="">Seleccione Cliente...</option>
                  {customers.map(c => (
                    <option key={c.id_cliente} value={c.id_cliente}>{c.razon_social} ({c.codigo})</option>
                  ))}
                </select>
              </div>


              <div className="relative">
                <span className="text-[9px] font-black uppercase tracking-widest text-text-main block mb-1">Seleccione Almacén</span>
                <select
                  className="w-full p-2 text-xs font-bold uppercase tracking-widest border border-text-main/10 rounded-lg appearance-none bg-transparent focus:outline-none focus:border-primary text-text-main"
                  value={selectedWarehouse?.id_almacen || ''}
                  onChange={(e) => setSelectedWarehouse(warehouses.find(w => w.id_almacen === parseInt(e.target.value)))}
                >
                  <option value="">Seleccione almacén...</option>
                  {warehouses.map(w => (
                    <option key={w.id_almacen} value={w.id_almacen}>{w.nombre}</option>
                  ))}
                </select>
              </div>

            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="text-[9px] font-black uppercase tracking-widest text-text-main block mb-1">Tipo Documento</span>
                <select
                  className="w-full p-2 text-xs font-bold uppercase tracking-widest border border-text-main/10 rounded-lg appearance-none bg-transparent focus:outline-none focus:border-primary text-text-main"
                  value={docType}
                  onChange={(e) => setDocType(parseInt(e.target.value))}
                >
                  <option value={1}>Boleta</option>
                  <option value={2}>Factura</option>
                </select>
              </div>

              <div className="relative">
                <span className="text-[9px] font-black uppercase tracking-widest text-text-main block mb-1">Tipo Pago</span>
                <select
                  className="w-full p-2 text-xs font-bold uppercase tracking-widest border border-text-main/10 rounded-lg appearance-none bg-transparent focus:outline-none focus:border-primary text-text-main"
                  value={saleType}
                  onChange={(e) => setSaleType(parseInt(e.target.value))}
                >
                  <option value={1}>Contado</option>
                  <option value={2}>Crédito</option>
                </select>
              </div>

            </div>

            <div className="relative">
              <span className="text-[9px] font-black uppercase tracking-widest text-text-main block mb-1">Observaciones</span>
              <textarea
                className="w-full p-2 text-xs font-bold uppercase tracking-widest border border-text-main/10 rounded-lg bg-transparent focus:outline-none focus:border-primary resize-none text-text-main"
                rows={2}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Agregar observación..."
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence initial={false}>
              {cart.map(item => (
                <CartItem
                  key={item.id_producto}
                  item={item}
                  onRemove={removeFromCart}
                  onUpdateQty={updateQty}
                  onUpdateCombinedQty={updateCombinedQty}
                  saldos={saldos}
                  selectedWarehouse={selectedWarehouse}
                  isStockInsufficient={isStockInsufficient}
                />
              ))}
            </AnimatePresence>

            {cart.length === 0 && (
              <div className="pt-12 flex flex-col items-center gap-4 opacity-20">
                <div className="w-12 h-12 rounded-full border border-text-main flex items-center justify-center font-bold">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest">Ticket Vacío</p>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-text-main/10 bg-bg-main space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Subtotal</span>
                <span className="text-xl font-bold">S/ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Tax (IGV 18%)</span>
                <span className="text-xl font-bold">S/ {igv.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-text-main flex justify-between items-baseline">
                <span className="text-[11px] font-bold uppercase tracking-[0.3em]">Total</span>
                <span className="text-4xl font-black text-text-main tracking-tighter">S/ {total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={finalizeSale}
              className="w-full py-5 bg-primary text-bg-main rounded-full text-[10px] font-black uppercase tracking-[0.4em] hover:opacity-90 transition-all shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
               disabled={
                 cart.length === 0 ||
                 !selectedWarehouse ||
                 cart.some(item => isStockInsufficient(item, selectedWarehouse))
               }
            >
              REALIZAR PAGO <CreditCard className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: CATALOG */}
        <div className="flex-1 overflow-y-auto p-12 space-y-16">
          <div className="flex justify-between items-end pb-8 border-b border-text-main/10">
            <div>
              <span className="text-[10px] tracking-[0.4em] font-bold uppercase mb-2 block opacity-50">Terminal de Pago</span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-text-main leading-tight tracking-tighter">Pago Digital.</h1>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 opacity-40" />
              <input
                type="text"
                placeholder="Buscar producto o cod..."
                className="w-full pl-9 pr-4 py-2 text-[11px] font-bold uppercase tracking-widest border border-text-main/10 rounded-full focus:outline-none focus:border-primary transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id_producto} product={product} onAdd={() => handleProductSelect(product)} />
            ))}
          </div>
        </div>
      </div>

      {/* PRICE SELECTION MODAL */}
      <AnimatePresence>
        {showPriceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text-main/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-bg-main border border-text-main/10 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-text-main/10 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-text-main">{pendingProduct?.nombre}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Seleccione Presentación</p>
                </div>
                <button onClick={() => setShowPriceModal(false)} className="p-2 hover:bg-text-main/5 rounded-full transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-8 grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto">
                {presentations.map((p) => (
                  <button
                    key={p.id_precio}
                    onClick={() => addSelectedPresentation(p)}
                    className="flex items-center justify-between p-4 border border-text-main/10 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group text-left"
                  >
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest block">{p.presentacion}</span>
                      <span className="text-[10px] opacity-40">Base: {p.cantidad_base} units</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold group-hover:text-primary transition-colors">S/ {p.precio_venta.toFixed(2)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function ProductCard({ product, onAdd }: any) {
  return (
    <div className="group border border-text-main/5 bg-white p-4 flex flex-row items-center gap-6 hover:border-text-main transition-all relative overflow-hidden">
      <div className="bg-text-main/5 w-16 h-16 flex-shrink-0 flex items-center justify-center p-2 transition-transform group-hover:scale-95 duration-500">
        <Package className="w-6 h-6 text-text-main/10 group-hover:text-text-main/30 transition-all" />
      </div>
      <div className="flex-1">
        <h4 className="text-lg font-bold text-text-main mb-1">{product.nombre}.</h4>
        <div className="flex items-baseline gap-4">
          <span className="text-[9px] font-bold uppercase tracking-widest opacity-30">{product.codigo}</span>
          <span className="text-xs font-medium opacity-80">Múltiples precios</span>
        </div>
      </div>
      <button
        onClick={onAdd}
        className="border border-orange-200 bg-orange-50 text-orange-600 rounded-full px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all"
      >
        Seleccionar Presentación
      </button>
    </div>
  );
}

function CartItem({ item, onRemove, onUpdateQty, onUpdateCombinedQty, saldos, selectedWarehouse, isStockInsufficient }: any) {
  const itemTotal = (item: any) => {
    return item.selectedPrice * item.qty;
  };
  
  const insufficient = isStockInsufficient(item, selectedWarehouse);
  const saldo = saldos?.find((s: any) => s.id_producto === item.id_producto && s.id_almacen === selectedWarehouse?.id_almacen);
  const stock = saldo?.stock_actual || 0;
  const stockUnit = saldo?.Unidad || 'UNIDADES';

  const isHuevoPardo = item.name?.toUpperCase().includes('PARDOS') || item.name?.toUpperCase().includes('PARDO');
  const onlyPlanchas = isHuevoPardo;
  const onlyUnidades = !isHuevoPardo;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="group border-b border-text-main/10 pb-6 mb-6 last:border-b-0 last:mb-0">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h5 className="text-xl font-bold uppercase tracking-widest text-text-main">{item.name}</h5>
          <p className="text-sm font-medium opacity-70">
            {item.planchas > 0 || item.unidades > 0
              ? 'Combined Quantities'
              : `${item.selectedPresentation} • S/ ${item.selectedPrice.toFixed(2)}`}
          </p>
        </div>
        <div className="flex items-center gap-4">
           {(() => {
             return (
               <span className={cn("text-[10px] font-bold uppercase", insufficient ? "text-error animate-pulse" : "opacity-30")}>
                 {insufficient ? `❌ STOCK INSUFICIENTE (${stock} ${stockUnit})` : `Stock: ${stock} ${stockUnit}`}
               </span>
             );
           })()}
          <button
            onClick={() => onRemove(item.id_producto, item.selectedPresentation)}
            className="text-text-main/20 hover:text-text-main transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 border border-text-main/10 rounded-full px-4 py-1 bg-white">
            <button
              onClick={() => onUpdateQty(item.id_producto, item.selectedPresentation, -1)}
              className="text-text-main/40 hover:text-text-main transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-[11px] font-bold min-w-[20px] text-center">{item.qty}</span>
            <button
              onClick={() => onUpdateQty(item.id_producto, item.selectedPresentation, 1)}
              className="text-text-main/40 hover:text-text-main transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center gap-2 border border-text-main/10 rounded-full px-4 py-1 bg-white">
            <span className="text-[9px] font-bold uppercase opacity-40">PLANCHAS</span>
            <input
              type="number"
              disabled={onlyUnidades}
              className={cn(
                "w-10 text-center text-[11px] font-bold focus:outline-none bg-transparent",
                onlyUnidades && "opacity-30 cursor-not-allowed"
              )}
              value={item.planchas}
              onChange={(e) => onUpdateCombinedQty(item.id_producto, 'planchas', parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="flex items-center gap-2 border border-text-main/10 rounded-full px-4 py-1 bg-white">
            <span className="text-[9px] font-bold uppercase opacity-40">UNIDADES</span>
            <input
              type="number"
              disabled={onlyPlanchas}
              className={cn(
                "w-10 text-center text-[11px] font-bold focus:outline-none bg-transparent",
                onlyPlanchas && "opacity-30 cursor-not-allowed"
              )}
              value={item.unidades}
              onChange={(e) => onUpdateCombinedQty(item.id_producto, 'unidades', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
        <span className="text-xl font-bold">S/ {itemTotal(item).toFixed(2)}</span>
      </div>
    </motion.div>
  );
}
