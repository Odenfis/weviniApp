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
  Package,
  FileText,
  ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ currentView, setView, onLogout }: SidebarProps) {
  const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({});

  const toggleMenu = (id: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const menuItems = [
    { id: 'dashboard', label: 'Panel de Control', icon: LayoutDashboard },
    { id: 'products', label: 'Productos', icon: Egg },
    { id: 'inventory', label: 'Inventario', icon: Package },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'suppliers', label: 'Proveedores', icon: Users },
    { id: 'pos', label: 'Punto de Venta', icon: ShoppingCart },
    { id: 'catalog', label: 'Catálogo', icon: List },
    { 
      id: 'reports', 
      label: 'Reportes', 
      icon: FileText, 
      children: [
        { id: 'reports-sales', label: 'Ventas', icon: FileText }
      ] 
    },
    { id: 'configuration', label: 'Configuración', icon: Settings },
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
          <React.Fragment key={item.id}>
            <button
              onClick={() => item.children ? toggleMenu(item.id) : setView(item.id)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 cursor-pointer transition-all duration-300 group relative",
                currentView === item.id || item.children?.some(child => currentView === child.id)
                  ? "text-text-main"
                  : "text-text-main/40 hover:text-text-main"
              )}
            >
              <div className="flex items-center gap-4">
                <item.icon className={cn(
                  "w-4 h-4 transition-transform group-hover:scale-110",
                  (currentView === item.id || item.children?.some(child => currentView === child.id)) ? "opacity-100" : "opacity-40 group-hover:opacity-100"
                )} />
                <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap">{item.label}</span>
              </div>

              {item.children && (
                <ChevronDown className={cn(
                  "w-3 h-3 transition-transform duration-300",
                  openMenus[item.id] ? "rotate-180" : "rotate-0"
                )} />
              )}

              {(currentView === item.id || (item.children && item.children.some(child => currentView === child.id))) && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute left-0 w-1 h-4 bg-primary"
                />
              )}
            </button>

            {item.children && openMenus[item.id] && (
              <div className="mt-1 ml-8 space-y-1 border-l border-text-main/10 pl-2">
                {item.children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setView(child.id)}
                    className={cn(
                      "w-full flex items-center gap-4 px-4 py-2 cursor-pointer transition-all duration-300 group relative",
                      currentView === child.id
                        ? "text-text-main"
                        : "text-text-main/40 hover:text-text-main"
                    )}
                  >
                    <child.icon className={cn(
                      "w-3 h-3 transition-transform group-hover:scale-110",
                      currentView === child.id ? "opacity-100" : "opacity-40 group-hover:opacity-100"
                    )} />
                    <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">{child.label}</span>
                    
                    {currentView === child.id && (
                      <motion.div
                        layoutId="active-nav-child"
                        className="absolute left-[-13px] w-1 h-3 bg-primary"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </React.Fragment>
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
