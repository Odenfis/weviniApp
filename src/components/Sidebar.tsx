import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  List,
  Settings,
  PlusCircle,
  LogOut,
  HelpCircle,
  Egg,
  Users,
  Package
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ currentView, setView, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Panel de Control', icon: LayoutDashboard },
    { id: 'products', label: 'Productos', icon: Egg },
    { id: 'inventory', label: 'Inventario', icon: Package },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'suppliers', label: 'Proveedores', icon: Users },
    { id: 'pos', label: 'Punto de Venta', icon: ShoppingCart },
    { id: 'catalog', label: 'Catálogo', icon: List },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <nav className="fixed left-0 top-0 h-screen w-64 border-r border-text-main/10 bg-bg-main flex flex-col py-12 z-50">
      <div className="px-8 mb-16 flex flex-col gap-2">
        <div className="w-10 h-10 rounded-full border border-text-main flex items-center justify-center mb-4">
          <Egg className="w-5 h-5" />
        </div>
        <div className="space-y-1">
           <h1 className="text-2xl font-black leading-tight tracking-tight">Empresa Wevini</h1>
          <div className="h-[1px] w-12 bg-text-main/30"></div>
          <p className="text-xs uppercase tracking-[0.2em] font-bold opacity-50">Precisión Logística</p>

        </div>
      </div>

      <div className="px-4 mb-12">
        <button className="w-full border border-text-main text-text-main rounded-full py-3 px-4 text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-bg-main transition-all flex justify-center items-center gap-2">
          <PlusCircle className="w-4 h-4" />
          Nuevo Registro
        </button>

      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-3 cursor-pointer transition-all duration-300 group relative",
              currentView === item.id
                ? "text-text-main"
                : "text-text-main/40 hover:text-text-main"
            )}
          >
            <item.icon className={cn(
              "w-4 h-4 transition-transform group-hover:scale-110",
              currentView === item.id ? "opacity-100" : "opacity-40 group-hover:opacity-100"
            )} />
            <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap">{item.label}</span>

            {currentView === item.id && (
              <motion.div
                layoutId="active-nav"
                className="absolute left-0 w-1 h-4 bg-primary"
              />
            )}
          </button>
        ))}
      </div>

      <div className="px-6 mt-auto pt-8 border-t border-text-main/10 space-y-2">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-4 py-2 text-error hover:bg-error/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em]">Cerrar Sesión</span>
        </button>
        <button className="w-full flex items-center gap-4 px-4 py-2 text-text-main/50 hover:text-text-main transition-all">
          <HelpCircle className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Soporte</span>
        </button>
        <div className="px-4 pt-4">
          <p className="text-[10px] uppercase tracking-[0.2em] opacity-30 font-bold">© 2026 Sedimcorp Web</p>
        </div>
      </div>

    </nav>
  );
}
