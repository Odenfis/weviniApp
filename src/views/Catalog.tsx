import React from 'react';
import { 
  Plus, 
  Edit3, 
  Eye,
  Info,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Catalog() {
  const categories = [
    {
      id: 1,
      name: 'Huevo Rosado',
      status: 'Series Extra 01',
      statusColor: 'green',
      formats: [
        { name: 'Bandeja (30 u)', price: 15.50 },
        { name: 'Media Bandeja (15 u)', price: 8.00 },
        { name: 'Kilogramo (kg)', price: 7.20 },
        { name: 'Unidad', price: 0.60 },
      ],
    },
    {
      id: 2,
      name: 'Huevo Pardo',
      status: 'Standard Series',
      statusColor: 'amber',
      formats: [
        { name: 'Bandeja (30 u)', price: 14.50 },
        { name: 'Kilogramo (kg)', price: 6.80 },
        { name: 'Unidad', price: 0.50 },
        { name: 'Bolsa (50 u)', price: 23.00 },
      ],
    },
    {
      id: 3,
      name: 'Huevo Quiñado',
      status: 'Restricted Batch',
      statusColor: 'red',
      formats: [
        { name: 'Kilogramo (kg)', price: 4.50 },
        { name: 'Bandeja (30 u)', price: 9.00 },
      ],
      info: 'Specifically curated for wholesale bakery entities and high-volume industrial processing.',
    },
  ];

  return (
    <div className="p-12 space-y-16 animate-in fade-in duration-700 bg-bg-main min-h-screen">
      <div className="flex justify-between items-end pb-8 border-b border-text-main/10">
        <div>
          <span className="text-[10px] tracking-[0.4em] font-bold uppercase mb-2 block opacity-50">Master Product Index</span>
           <h1 className="text-6xl font-black text-text-main leading-tight tracking-tighter">Product Lines.</h1>
        </div>
        <button className="flex items-center gap-4 px-6 py-3 bg-primary text-bg-main rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-xl">
          <Plus className="w-3 h-3" />
          Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {categories.map((cat) => (
          <div key={cat.id} className="group flex flex-col gap-8 p-10 border border-text-main/5 bg-white hover:border-text-main transition-all relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-text-main/3 -translate-y-1/2 translate-x-1/2 rotate-45 group-hover:bg-text-main/5 transition-colors"></div>
            
            <div className="flex justify-between items-start relative z-10">
              <div>
                 <h3 className="text-4xl font-bold text-text-main">{cat.name}.</h3>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-30 mt-2">{cat.status} — Volume 0{cat.id}</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-text-main/30 hover:text-text-main transition-colors border border-text-main/10 rounded-full">
                  <Edit3 className="w-3 h-3" />
                </button>
                <button className="p-2 text-text-main/30 hover:text-text-main transition-colors border border-text-main/10 rounded-full">
                  <Eye className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-6 relative z-10">
              <h4 className="text-[9px] font-bold uppercase tracking-[0.4em] opacity-40 pb-4 border-b border-text-main/5">Pricing Tiers</h4>
              <div className="space-y-4">
                {cat.formats.map((format) => (
                  <div key={format.name} className="flex justify-between items-baseline group/row">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-text-main/50 group-hover/row:text-text-main transition-colors">{format.name}</span>
                    <div className="flex-1 mx-4 border-b border-dotted border-text-main/10"></div>
                     <span className="text-xl font-bold text-text-main">S/ {format.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {cat.info && (
              <div className="p-6 bg-text-main/2 border-l-2 border-text-main/20 flex gap-4 relative z-10">
                <Info className="w-4 h-4 text-text-main opacity-30 shrink-0" />
                 <p className="text-[10px] font-medium text-text-main/80 leading-relaxed">{cat.info}</p>
              </div>
            )}

            <div className="pt-8 border-t border-text-main/5 flex justify-between items-center relative z-10">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", cat.statusColor === 'green' ? 'bg-success' : 'bg-error')}></div>
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 capitalize">{cat.statusColor === 'green' ? 'Available' : 'Inventory Alert'}</span>
              </div>
              <button className="text-[9px] font-bold uppercase tracking-widest text-text-main/60 group-hover:text-text-main flex items-center gap-2 transition-all">
                Access Stock Data <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-20 pb-12 opacity-30 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.5em]">Wevini Private Catalog — Restricted Access</p>
        <div className="mt-4 h-[1px] w-24 bg-text-main mx-auto opacity-50"></div>
      </div>
    </div>
  );
}
