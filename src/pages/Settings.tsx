import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { warehouseAPI } from '../utils/api';

interface Warehouse {
  id: number;
  name: string;
  location: string;
}

export default function Settings() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', location: '' });

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await warehouseAPI.getAll();
      setWarehouses(response.data);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await warehouseAPI.create(formData);
      setFormData({ name: '', location: '' });
      setShowForm(false);
      fetchWarehouses();
    } catch (err) {
      console.error('Error creating warehouse:', err);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Configure your inventory system</p>
          </div>

          <div className="max-w-4xl">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Warehouses</h2>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                >
                  <Plus size={20} /> Add Warehouse
                </button>
              </div>

              {showForm && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Warehouse Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Main Warehouse"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Building A, Floor 2"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
                      >
                        Create Warehouse
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="space-y-3">
                {loading ? (
                  <div className="text-center text-gray-500 py-8">Loading...</div>
                ) : warehouses.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">No warehouses yet</div>
                ) : (
                  warehouses.map((warehouse) => (
                    <div
                      key={warehouse.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                      <div>
                        <h3 className="font-semibold text-gray-900">{warehouse.name}</h3>
                        <p className="text-sm text-gray-600">{warehouse.location || 'No location'}</p>
                      </div>
                      <button className="text-red-600 hover:text-red-700 transition">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">System Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900">Low Stock Alert Threshold</h3>
                    <p className="text-sm text-gray-600">Notify when stock falls below this level</p>
                  </div>
                  <input
                    type="number"
                    defaultValue="10"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900">Enable Email Notifications</h3>
                    <p className="text-sm text-gray-600">Get alerts via email</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
