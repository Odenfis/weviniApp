import React, { useState } from 'react';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [credentials, setCredentials] = useState({ nombre_cuenta: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLoginSuccess(data.user);
      } else {
        setError(data.message || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="max-w-md w-full bg-bg-main rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-text-main">Bienvenido</h1>
          <p className="text-base text-text-muted mt-2">Ingresa tus credenciales para continuar</p>
        </div>
        
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-medium text-text-main/70 mb-1">Nombre de Cuenta</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-text-main/20 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all text-base"
              value={credentials.nombre_cuenta}
              onChange={(e) => setCredentials({ ...credentials, nombre_cuenta: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-text-main/70 mb-1">Contraseña</label>
            <input 
              type="password" 
              className="w-full px-4 py-2 border border-text-main/20 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all text-base"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              required
            />
          </div>

          {error && (
            <div className="p-3 text-sm text-error bg-error/10 border border-error/20 rounded-lg">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-bg-main font-semibold rounded-lg transition-colors disabled:bg-text-muted text-sm"
          >
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
