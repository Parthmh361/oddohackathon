import { useEffect, useState } from 'react';
import { User, Mail, Shield } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { authAPI } from '../utils/api';

interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  role: string;
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authAPI.getProfile();
        setProfile(response.data);
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-1">Manage your account settings</p>
          </div>

          <div className="max-w-2xl">
            {loading ? (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 mt-4">Loading profile...</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-32"></div>
                  <div className="px-6 pb-6">
                    <div className="flex items-end gap-4 -mt-16 mb-6">
                      <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                        <User size={48} className="text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{profile?.fullName}</h2>
                        <p className="text-gray-600">{profile?.role}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                        <Mail size={20} className="text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Email Address</p>
                          <p className="font-semibold text-gray-900">{profile?.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                        <Shield size={20} className="text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Role</p>
                          <p className="font-semibold text-gray-900">
                            {profile?.role === 'warehouse_staff' ? 'Warehouse Staff' : 'Inventory Manager'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Security</h3>
                  <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                    Change Password
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
