import { useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Package,
  Inbox,
  Truck,
  Shuffle,
  Settings,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const menuItems = [
    { label: 'Dashboard', icon: BarChart3, path: '/' },
    { label: 'Products', icon: Package, path: '/products' },
    { label: 'Receipts', icon: Inbox, path: '/receipts' },
    { label: 'Deliveries', icon: Truck, path: '/deliveries' },
    { label: 'Transfers', icon: Shuffle, path: '/transfers' },
    { label: 'Adjustments', icon: BarChart3, path: '/adjustments' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
    window.location.reload();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 lg:hidden bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white w-64 transition-transform duration-300 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:relative z-40`}
      >
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold">StockMaster</h1>
          <p className="text-sm text-slate-400">Inventory System</p>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700 space-y-2">
          <button
            onClick={() => {
              navigate('/profile');
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              isActive('/profile')
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <User size={20} />
            <div className="text-left">
              <div className="text-sm font-medium">{user.fullName}</div>
              <div className="text-xs text-slate-400">{user.email}</div>
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-red-600 hover:text-white transition"
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
