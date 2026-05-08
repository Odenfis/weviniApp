import React from 'react';
import { AlertCircle, Key } from 'lucide-react';
import { motion } from 'motion/react';

export default function LicenseLock() {
  return (
    <div className="fixed inset-0 z-[9999] bg-slate-100 flex items-center justify-center p-6 animate-in fade-in duration-500">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-lg w-full text-center space-y-8 p-16 rounded-[40px] bg-white shadow-xl border border-slate-200"
      >
        <div className="relative inline-block">
          <div className="bg-[#1a2b6d] p-6 rounded-full text-white mx-auto shadow-lg">
            <Key className="w-14 h-14" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-5xl font-black text-[#1a2b6d] tracking-tighter">Acceso Expirado</h1>
          <p className="text-[#1a2b6d]/60 font-bold uppercase tracking-[0.2em] text-xs">SISTEMA DE GESTIÓN WEVINI</p>
        </div>

        <div className="p-6 bg-orange-50 border border-orange-200 rounded-3xl flex items-start gap-4 text-left">
          <AlertCircle className="w-6 h-6 text-orange-400 shrink-0 mt-1" />
          <p className="text-orange-500 font-medium leading-relaxed">
            El periodo de acceso al software ha finalizado. Para continuar operando, por favor contacte con el soporte técnico para renovar su licencia.
          </p>
        </div>

        <div className="pt-4">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">CÓDIGO DE ERROR: LICENCIA EXPIRADA Sedimcorp</p>
        </div>
      </motion.div>
    </div>
  );
}

