import { useEffect, useState } from 'react';
import { AlertCircle, Package, TrendingDown, Clock, ArrowRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { dashboardAPI } from '../utils/api';

interface KPI {
  totalProducts: number;
  lowStock: number;
  outOfStock: number;
  pendingReceipts: number;
  pendingDeliveries: number;
  pendingTransfers: number;
}

export default function Dashboard() {
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const response = await dashboardAPI.getKPIs();
        setKpis(response.data);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, []);

  const KPICard = ({ icon: Icon, title, value, color }: any) => (
    <div className={`${color} rounded-lg p-6 text-white shadow-lg hover:shadow-xl transition transform hover:-translate-y-1`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-90">{title}</p>
          <p className="text-3xl font-bold mt-2">{loading ? '...' : value}</p>
        </div>
        <Icon size={32} className="opacity-75" />
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome to StockMaster - Inventory Management System</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <KPICard
              icon={Package}
              title="Total Products"
              value={kpis?.totalProducts || 0}
              color="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <KPICard
              icon={AlertCircle}
              title="Low Stock Items"
              value={kpis?.lowStock || 0}
              color="bg-gradient-to-br from-yellow-500 to-yellow-600"
            />
            <KPICard
              icon={TrendingDown}
              title="Out of Stock"
              value={kpis?.outOfStock || 0}
              color="bg-gradient-to-br from-red-500 to-red-600"
            />
            <KPICard
              icon={Clock}
              title="Pending Receipts"
              value={kpis?.pendingReceipts || 0}
              color="bg-gradient-to-br from-green-500 to-green-600"
            />
            <KPICard
              icon={ArrowRight}
              title="Pending Deliveries"
              value={kpis?.pendingDeliveries || 0}
              color="bg-gradient-to-br from-purple-500 to-purple-600"
            />
            <KPICard
              icon={Clock}
              title="Pending Transfers"
              value={kpis?.pendingTransfers || 0}
              color="bg-gradient-to-br from-indigo-500 to-indigo-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition">
                  + Create Receipt
                </button>
                <button className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-medium transition">
                  + Create Delivery
                </button>
                <button className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-medium transition">
                  + Create Transfer
                </button>
                <button className="w-full text-left px-4 py-3 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg font-medium transition">
                  + Create Adjustment
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">System Status</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">API Connection</span>
                  <span className="text-green-600 font-semibold">Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Database Status</span>
                  <span className="text-green-600 font-semibold">Healthy</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Last Updated</span>
                  <span className="text-gray-700 font-semibold">Just now</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
