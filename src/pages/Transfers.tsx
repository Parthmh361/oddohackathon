import { useEffect, useState } from 'react';
import { Plus, Eye, CheckCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { transfersAPI } from '../utils/api';

interface Transfer {
  id: number;
  transferNumber: string;
  fromWarehouseId: number;
  toWarehouseId: number;
  status: string;
  createdAt: string;
}

export default function Transfers() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransfers();
  }, [status]);

  const fetchTransfers = async () => {
    try {
      const response = await transfersAPI.getAll({ status: status || undefined });
      setTransfers(response.data);
    } catch (err) {
      console.error('Error fetching transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      waiting: 'bg-yellow-100 text-yellow-800',
      ready: 'bg-blue-100 text-blue-800',
      done: 'bg-green-100 text-green-800',
      canceled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Internal Transfers</h1>
              <p className="text-gray-600 mt-1">Move stock between warehouses</p>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
              <Plus size={20} /> New Transfer
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6 flex gap-2">
              {['', 'draft', 'waiting', 'ready', 'done'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    status === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {s || 'All'}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Transfer #</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">From Warehouse</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">To Warehouse</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : transfers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        No transfers found
                      </td>
                    </tr>
                  ) : (
                    transfers.map((transfer) => (
                      <tr key={transfer.id} className="border-b hover:bg-gray-50 transition">
                        <td className="py-3 px-4 font-semibold text-gray-900">{transfer.transferNumber}</td>
                        <td className="py-3 px-4 text-gray-900">Warehouse {transfer.fromWarehouseId}</td>
                        <td className="py-3 px-4 text-gray-900">Warehouse {transfer.toWarehouseId}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transfer.status)}`}>
                            {transfer.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(transfer.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button className="text-blue-600 hover:text-blue-700">
                              <Eye size={18} />
                            </button>
                            {transfer.status !== 'done' && (
                              <button className="text-green-600 hover:text-green-700">
                                <CheckCircle size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
