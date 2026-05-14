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
import { apiFetch } from '../lib/api';

export default function POS() {
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [saldos, setSaldos] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [posConfig, setPosConfig] = useState<any>(null);
  const [docType, setDocType] = useState(1); // 1: Boleta, 2: Factura
  const [saleType, setSaleType] = useState(1); // 1: Contado, 2: Crédito
  const [observations, setObservations] = useState('');
  const [isTaxEnabled, setIsTaxEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showMixedPaymentModal, setShowMixedPaymentModal] = useState(false);
  const [mixedPayment, setMixedPayment] = useState({ contado: '', yape: '' });
  const [pendingProduct, setPendingProduct] = useState<any>(null);
  const [presentations, setPresentations] = useState<any[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // 1. Carga de Productos
      try {
        const prodRes = await apiFetch('/api/productos').then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        });
        setProducts(Array.isArray(prodRes) ? prodRes : []);
      } catch (err) {
        console.error('❌ Error cargando Productos:', err);
      }
 
      // 2. Carga de Almacenes
      let loadedWarehouses = [];
      try {
        const wareRes = await apiFetch('/api/almacenes').then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        });
        loadedWarehouses = Array.isArray(wareRes) ? wareRes : [];
        setWarehouses(loadedWarehouses);
      } catch (err) {
        console.error('❌ Error cargando Almacenes:', err);
      }
 
      // 3. Carga de Clientes
      let loadedCustomers = [];
      try {
        const custRes = await apiFetch('/api/clientes?all=true').then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        });
        loadedCustomers = Array.isArray(custRes) ? custRes : [];
        setCustomers(loadedCustomers);
      } catch (err) {
        console.error('❌ Error cargando Clientes:', err);
      }
 
       // 4. Carga de Saldos
       try {
         const salRes = await apiFetch('/api/saldos').then(res => {
           if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
           return res.json();
         });
         setSaldos(Array.isArray(salRes) ? salRes : []);
       } catch (err) {
         console.error('❌ Error cargando Saldos:', err);
       }
  
       // 5. Carga de Formas de Pago (Tabla 5)
       try {
         const payRes = await apiFetch('/api/tablas/5').then(res => {
           if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
           return res.json();
         });
         setPaymentMethods(Array.isArray(payRes) ? payRes : []);
       } catch (err) {
         console.error('❌ Error cargando Formas de Pago:', err);
       }

       // 6. Carga de Configuración POS Automático
        try {
          const confRes = await apiFetch('/api/config/pos').then(res => res.json());
          setPosConfig(confRes);
          if (confRes && confRes.automatico) {
            const defaultCustomer = loadedCustomers.find(c => c.id_cliente === confRes.id_cliente);
            const defaultWarehouse = loadedWarehouses.find(w => w.id_almacen === confRes.id_almacen);
            
            if (defaultCustomer) setSelectedCustomer(defaultCustomer);
            if (defaultWarehouse) setSelectedWarehouse(defaultWarehouse);
          }
        } catch (err) {
         console.error('❌ Error cargando Configuración POS:', err);
       }
  
    } catch (err) {
      console.error('❌ Error crítico en loadInitialData:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = async (product: any) => {
    console.log('Product selected:', product);
    setPendingProduct(product);
    try {
      const res = await apiFetch(`/api/productos/${product.id_producto}/presentaciones`);
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
      const existing = prev.find(item => item.id_precio === priceData.id_precio);
      if (existing) {
        return prev.map(item => (item.id_precio === priceData.id_precio) ? { ...item, qty: item.qty + 1 } : item);
      }

       return [...prev, {
         id_producto: priceData.id_producto,
         id_precio: priceData.id_precio,
         name: priceData.Nombre,
         priceMap: presentations.reduce((acc, p) => {
           acc[p.presentacion] = { price: p.precio_venta, cost: p.precio_compra, code: p.codigo_unidad, base: p.cantidad_base };
           return acc;
         }, {} as any),
         selectedPresentation: priceData.presentacion,
         selectedPrice: priceData.precio_venta,
         selectedCost: priceData.precio_compra,
         selectedUnitCode: priceData.codigo_unidad,
         unidades: priceData.cantidad_base || 0,
         qty: 1
       }];
    });
    setShowPriceModal(false);
    setPendingProduct(null);
  };

  const removeFromCart = (id_precio: number) => {
    setCart(prev => prev.filter(item => item.id_precio !== id_precio));
  };

  const updateQty = (id_precio: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id_precio === id_precio) {
        const newQty = Math.max(1, item.qty + delta);
        const base = item.priceMap?.[item.selectedPresentation]?.base || 1;
        return { ...item, qty: newQty, unidades: newQty * base };
      }
      return item;
    }));
  };

  const updateUnits = (id_precio: number, value: number) => {
    setCart(prev => prev.map(item => {
      if (item.id_precio === id_precio) {
        return { ...item, unidades: Math.max(0, value) };
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
    if (item.unidades !== undefined && item.unidades !== null) {
      return item.unidades;
    }
    return item.qty * (item.priceMap?.[item.selectedPresentation]?.base || 1);
  };

  const isStockInsufficient = (item: any, warehouse: any, cart: any[]) => {
    if (!warehouse) return false;
    const saldo = saldos?.find((s: any) => s.id_producto === item.id_producto && s.id_almacen === warehouse.id_almacen);
    if (!saldo) return true; // No saldo record means no stock

    // Calculate total demand for this product across the whole cart
    const totalRequestedUnits = cart
      .filter((i: any) => i.id_producto === item.id_producto)
      .reduce((sum: number, i: any) => sum + calculateTotalRequestedInUnits(i), 0);

    const stockActual = saldo.stock_actual || 0;
    const stockUnit = saldo.Unidad || 'UNIDADES';

    // Convert stock to units for a fair comparison
    const pBase = getBaseFactor(item.priceMap, 'PLANCHA');
    const stockInUnits = stockUnit.toUpperCase() === 'PLANCHAS' 
      ? stockActual * pBase 
      : stockActual;

    return totalRequestedUnits > stockInUnits;
  };

  const subtotal = cart.reduce((acc, item) => acc + calculateItemTotal(item), 0);
  const igv = isTaxEnabled ? subtotal * 0.18 : 0;
  const total = subtotal + igv;

  const executeSale = async (paymentDetails?: any) => {
    if (!selectedCustomer || !selectedWarehouse) {
      alert('Please select a customer and warehouse');
      return;
    }

    try {
      // Stock check for confirmation
      let insufficientStock = false;
      cart.forEach(item => {
        if (isStockInsufficient(item, selectedWarehouse, cart)) {
          insufficientStock = true;
        }
      });

      if (insufficientStock) {
        alert("❌ ERROR: FALTA DE SALDOS\nAlgunos productos no tienen stock suficiente en el almacén seleccionado. La venta ha sido bloqueada.");
        return;
      }

      if (cart.some(item => item.unidades === 0)) {
        const missingUnitsItem = cart.find(item => item.unidades === 0);
        alert(`❌ ERROR: ESPECIFIQUE UNIDADES\nEl producto "${missingUnitsItem?.name}" no tiene cantidad de unidades especificada.`);
        return;
      }

      const docRes = await apiFetch('/api/ventas/next-doc').then(res => res.json());
      const nextDoc = docRes.nextCode;

      const saleDetails: any[] = [];

      cart.forEach(item => {
        const { unidades, qty, selectedPrice, selectedCost } = item;

        const unitFactura = (item.selectedUnitCode || 'UND').padEnd(10, ' ');
        const unitSaldos = 'UNIDADES';
        const stockQuantity = unidades;

        saleDetails.push({
          id_producto: item.id_producto,
          unidad_factura: unitFactura,
          unidad_saldos: unitSaldos,
          cantidad_venta: qty,
          unidades_vendidas: stockQuantity,
          cantidad_stock: stockQuantity,
          precio_unitario: selectedPrice,
          descuento: 0,
          subtotal: qty * selectedPrice,
          costo_unitario: selectedCost
        });
      });

      const isPaidMethod = [1, 2, 3, 5].includes(saleType);
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
         monto_pagado: isPaidMethod ? total : 0,
         saldo: isPaidMethod ? 0 : total,
         estado: isPaidMethod ? 'PAGADO' : 'PENDIENTE',
         observaciones: observations,
         detalles: saleDetails,
         pagos: paymentDetails ? [
           { forma_pago: 1, monto: parseFloat(paymentDetails.contado) || 0 },
           { forma_pago: 2, monto: parseFloat(paymentDetails.yape) || 0 }
         ].filter(p => p.monto > 0) : null
       };

      const res = await apiFetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });

       if (res.ok) {
         alert('Venta realizada correctamente!');
         setCart([]);
         
         if (posConfig?.automatico) {
           setSelectedCustomer(customers.find(c => c.id_cliente === posConfig.id_cliente));
           setSelectedWarehouse(warehouses.find(w => w.id_almacen === posConfig.id_almacen));
         } else {
           setSelectedCustomer(null);
           setSelectedWarehouse(null);
         }
         
         setObservations('');
         setShowMixedPaymentModal(false);
       } else {
        const err = await res.json();
        alert(`Error: ${err.message}\n\nDetail: ${err.detail || 'N/A'}\nSQL Error: ${err.sqlError || 'N/A'}`);
      }
    } catch (err) {
      console.error('Sale error:', err);
      alert('An unexpected error occurred');
    }
  };

  const finalizeSale = async () => {
    if (saleType === 5) {
      setShowMixedPaymentModal(true);
    } else {
      await executeSale();
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

          <div className="p-4 border-b border-text-main/10 space-y-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-4xl font-black text-text-main">Ticket Activo</h3>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{cart.length} Items</span>
            </div>
 
 
            <div className="grid grid-cols-1 gap-2">
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

              <div className="grid grid-cols-2 gap-2">
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
                   {paymentMethods.length > 0 ? (
                     paymentMethods.map(method => (
                       <option key={method.n_numero} value={method.n_numero}>
                         {method.c_describe}
                       </option>
                     ))
                   ) : (
                     <>
                       <option value={1}>Contado</option>
                       <option value={2}>Crédito</option>
                     </>
                   )}
                 </select>
               </div>
              </div>
            </div>
 
            <div className="flex items-center justify-between p-3 border border-text-main/10 rounded-lg bg-white/50 mt-2">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-text-main">Cargar IGV (18%)</span>
                <span className="text-[8px] opacity-40 font-medium">Activar impuesto sobre la venta</span>
              </div>
              <button 
                onClick={() => setIsTaxEnabled(!isTaxEnabled)}
                className={cn(
                  "relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none",
                  isTaxEnabled ? "bg-primary" : "bg-text-main/20"
                )}
              >
                <motion.div 
                  animate={{ x: isTaxEnabled ? 20 : 2 }}
                  className="absolute top-1 w-3 h-3 bg-bg-main rounded-full shadow-sm" 
                />
              </button>
            </div>
 
            <div className="relative mt-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-text-main block mb-1">Observaciones</span>
               <textarea
                 className="w-full p-2 text-xs font-bold uppercase tracking-widest border border-text-main/10 rounded-lg bg-transparent focus:outline-none focus:border-primary resize-none text-text-main"
                 rows={1}
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
                    key={item.id_precio}
                    item={item}
                    onRemove={removeFromCart}
                    onUpdateQty={updateQty}
                    onUpdateUnits={updateUnits}
                    saldos={saldos}
                    selectedWarehouse={selectedWarehouse}
                    isStockInsufficient={(i, w) => isStockInsufficient(i, w, cart)}
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
                cart.some(item => isStockInsufficient(item, selectedWarehouse, cart)) ||
                cart.some(item => item.unidades === 0)
              }
            >
              {(!selectedCustomer || !selectedWarehouse || cart.some(item => isStockInsufficient(item, selectedWarehouse, cart)) || cart.some(item => item.unidades === 0)) 
                ? ( !selectedCustomer ? "SELECCIONE CLIENTE" : !selectedWarehouse ? "SELECCIONE ALMACÉN" : cart.some(item => isStockInsufficient(item, selectedWarehouse, cart)) ? "STOCK INSUFICIENTE" : "ESPECIFIQUE UNIDADES" )
                : "REALIZAR PAGO"
              } <CreditCard className="w-3 h-3" />
            </button>
            {(!selectedCustomer || !selectedWarehouse) && (
              <p className="text-center text-[9px] font-bold uppercase opacity-40 mt-2">
                {!selectedCustomer ? "⚠️ Seleccione un cliente para continuar" : !selectedWarehouse ? "⚠️ Seleccione un almacén para validar stock" : ""}
              </p>
            )}
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

        {showMixedPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text-main/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-bg-main border border-text-main/10 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-text-main/10 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-text-main">Pago Mixto</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Distribución del Monto</p>
                </div>
                <button onClick={() => setShowMixedPaymentModal(false)} className="p-2 hover:bg-text-main/5 rounded-full transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-main block mb-1">Monto Contado</label>
                    <button 
                      onClick={() => {
                        const half = Math.round((total / 2) * 100) / 100;
                        setMixedPayment({ contado: half, yape: Math.round((total - half) * 100) / 100 });
                      }}
                      className="text-[8px] font-bold uppercase text-primary hover:underline mb-1"
                    >
                      Dividir 50/50
                    </button>
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      className="w-full p-3 text-lg font-bold border border-text-main/10 rounded-xl bg-transparent focus:outline-none focus:border-primary text-text-main"
                      value={mixedPayment.contado === 0 ? '' : mixedPayment.contado}
                       onChange={(e) => {
                         const val = parseFloat(e.target.value) || 0;
                         setMixedPayment({ 
                           contado: val, 
                           yape: Math.round(Math.max(0, total - val) * 100) / 100 
                         });
                       }}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-main block mb-1">Monto Yape</label>
                    <input
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      className="w-full p-3 text-lg font-bold border border-text-main/10 rounded-xl bg-transparent focus:outline-none focus:border-primary text-text-main"
                      value={mixedPayment.yape === 0 ? '' : mixedPayment.yape}
                       onChange={(e) => {
                         const val = parseFloat(e.target.value) || 0;
                         setMixedPayment({ 
                           yape: val, 
                           contado: Math.round(Math.max(0, total - val) * 100) / 100 
                         });
                       }}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-text-main/10 space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest opacity-60">
                    <span>Suma Actual:</span>
                    <span>S/ {(Number(mixedPayment.contado) + Number(mixedPayment.yape)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                    <span>Total a Pagar:</span>
                    <span>S/ {total.toFixed(2)}</span>
                  </div>
                   <div className={cn(
                     "text-center text-[10px] font-black uppercase tracking-widest p-1 rounded-lg",
                     Math.abs((Number(mixedPayment.contado) + Number(mixedPayment.yape)) - total) < 0.01 ? "bg-green-500/20 text-green-500" : "bg-error-500/20 text-error"
                   )}>
                     {Math.abs((Number(mixedPayment.contado) + Number(mixedPayment.yape)) - total) < 0.01 ? "✅ Monto Correcto" : `❌ Diferencia: S/ ${(total - (Number(mixedPayment.contado) + Number(mixedPayment.yape))).toFixed(2)}`}
                   </div>
                </div>

                 <button
                   onClick={() => executeSale(mixedPayment)}
                   disabled={Math.abs((Number(mixedPayment.contado) + Number(mixedPayment.yape)) - total) >= 0.01}
                   className="w-full py-4 bg-primary text-bg-main rounded-full text-[10px] font-black uppercase tracking-[0.4em] hover:opacity-90 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                  Confirmar Pago
                </button>
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

function CartItem({ item, onRemove, onUpdateQty, onUpdateUnits, saldos, selectedWarehouse, isStockInsufficient }: any) {
  const itemTotal = (item: any) => {
    return item.selectedPrice * item.qty;
  };
  
   const insufficient = isStockInsufficient(item, selectedWarehouse);
   const missingQty = item.unidades === 0;
   const saldo = saldos?.find((s: any) => s.id_producto === item.id_producto && s.id_almacen === selectedWarehouse?.id_almacen);
   const stock = saldo?.stock_actual || 0;
   const stockUnit = saldo?.Unidad || 'UNIDADES';
 
   return (
     <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="group border-b border-text-main/10 pb-6 mb-6 last:border-b-0 last:mb-0">
       <div className="flex justify-between items-start mb-2">
         <div>
           <h5 className="text-xl font-bold uppercase tracking-widest text-text-main">{item.name}</h5>
            <p className="text-sm font-medium opacity-70">
              {`${item.selectedPresentation} • S/ ${item.selectedPrice.toFixed(2)}`}
            </p>
         </div>
         <div className="flex items-center gap-4">
            {(() => {
              if (!selectedWarehouse) {
                return <span className="text-[10px] font-bold uppercase opacity-30">Seleccione Almacén</span>;
              }
              if (!saldo) {
                return <span className="text-[10px] font-bold uppercase opacity-30">Sin registro</span>;
              }
              return (
                <span className={cn("text-[10px] font-bold uppercase", insufficient ? "text-error animate-pulse" : "opacity-30")}>
                  {insufficient ? `❌ STOCK INSUFICIENTE (${stock} ${stockUnit})` : `Stock: ${stock} ${stockUnit}`}
                </span>
              );
            })()}
            <button
              onClick={() => onRemove(item.id_precio)}
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
                onClick={() => onUpdateQty(item.id_precio, -1)}
                className="text-text-main/40 hover:text-text-main transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-[11px] font-bold min-w-[20px] text-center">{item.qty}</span>
              <button
                onClick={() => onUpdateQty(item.id_precio, 1)}
                className="text-text-main/40 hover:text-text-main transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
             <div className="flex items-center gap-3 border border-text-main/10 rounded-full px-5 py-1.5 bg-white">
               <span className="text-[9px] font-bold uppercase opacity-40">UNIDADES</span>
               <input
                 type="number"
                 onFocus={(e) => e.target.select()}
                 className={cn(
                   "w-14 text-center text-[11px] font-bold focus:outline-none bg-transparent",
                   missingQty && "text-error"
                 )}
                 value={item.unidades}
                 onChange={(e) => onUpdateUnits(item.id_precio, parseInt(e.target.value) || 0)}
               />
             </div>
          </div>
          <span className="text-xl font-bold">S/ {itemTotal(item).toFixed(2)}</span>
        </div>
      </motion.div>
    );
  }
