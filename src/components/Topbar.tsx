import React from 'react';
import { Search, Bell, Settings, User } from 'lucide-react';

interface TopbarProps {
  user: any;
}

export default function Topbar({ user }: TopbarProps) {
  return (
    <header className="h-16 px-8 border-b border-ink/10 bg-paper flex items-center justify-between sticky top-0 z-40">
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 w-3 h-3 group-focus-within:text-ink transition-colors" />
           <input 
             type="text" 
             placeholder="Search resources..."
             className="w-full pl-10 pr-4 py-2 bg-transparent border-b border-ink/10 rounded-none text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-ink transition-all placeholder:opacity-30"
           />

        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="text-ink/60 hover:text-ink relative transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-ink rounded-full border border-paper"></span>
        </button>
        <button className="text-ink/60 hover:text-ink transition-colors">
          <Settings className="w-4 h-4" />
        </button>
        <div className="ml-4 pl-4 border-l border-ink/10 flex items-center gap-4">
           <div className="text-right hidden sm:block">
             <p className="text-sm font-bold text-ink leading-tight uppercase tracking-widest">
               {user?.nombre_cuenta || 'Usuario'}
             </p>
              <p className="text-xs font-medium text-text-muted">
               {user?.rol || ' Invitado'}
             </p>
           </div>

          <div className="w-10 h-10 rounded-full border border-ink/20 flex items-center justify-center p-0.5">
            <div className="w-full h-full rounded-full bg-ink/5 flex items-center justify-center">
              <User className="w-4 h-4 text-ink/40" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
