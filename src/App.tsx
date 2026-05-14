import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './views/Dashboard';
import Products from './views/Products';
import Inventory from './views/Inventory';
import Customers from './views/Customers';
import Suppliers from './views/Suppliers';
import POS from './views/POS';
import Catalog from './views/Catalog';
import Configuration from './views/Configuration';
import SalesReport from './views/SalesReport';
import Login from './views/Login';
import LicenseLock from './components/LicenseLock';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [isLicenseExpired, setIsLicenseExpired] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }

    const handleLicenseExpired = () => {
      setIsLicenseExpired(true);
    };

    window.addEventListener('license-expired', handleLicenseExpired);
    return () => window.removeEventListener('license-expired', handleLicenseExpired);
  }, []);

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (isLicenseExpired) {
    return <LicenseLock />;
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'products': return <Products />;
      case 'inventory': return <Inventory />;
      case 'customers': return <Customers />;
      case 'suppliers': return <Suppliers />;
      case 'pos': return <POS />;
      case 'catalog': return <Catalog />;
      case 'reports-sales': return <SalesReport />;
      case 'configuration': return <Configuration />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar currentView={currentView} setView={setCurrentView} onLogout={handleLogout} />
      
      <main className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        <Topbar user={user} />
        <div className={`flex-1 ${currentView === 'pos' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {renderView()}
        </div>
      </main>
    </div>
  );
}

