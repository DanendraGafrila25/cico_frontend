'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { toast, Toaster } from 'react-hot-toast';

export default function PengaturanSistemPage() {
  const [settings, setSettings] = useState({
    jamCheckin: '',
    jamCheckout: '',
    toleransiKeterlambatan: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    fetchSettings();
  }, [router]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/admin/system-settings');
      
      if (response.data.statusCode === 200) {
        const data = response.data.data;
        setSettings({
          jamCheckin: data.defaultCheckInTime || '',
          jamCheckout: data.defaultCheckOutTime || '',
          toleransiKeterlambatan: parseInt(data.checkInLateToleranceMinutes) || 0
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Gagal memuat pengaturan sistem');
      if (error.response?.status === 401) {
        localStorage.removeItem('jwt_token');
        router.push('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Map frontend field names to backend field names
      const settingsPayload = {
        defaultCheckInTime: settings.jamCheckin,
        defaultCheckOutTime: settings.jamCheckout,
        checkInLateToleranceMinutes: settings.toleransiKeterlambatan.toString()
      };
      
      const response = await api.put('/api/v1/admin/system-settings', settingsPayload);
      
      if (response.data.statusCode === 200) {
        toast.success('Pengaturan sistem berhasil diperbarui');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error(error.response?.data?.message || 'Gagal memperbarui pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-xl font-semibold text-gray-700">Memuat pengaturan sistem...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl">
          <h1 className="text-4xl font-bold mb-2">Pengaturan Sistem</h1>
          <p className="text-blue-100 text-lg">Konfigurasi jam operasional dan toleransi keterlambatan</p>
        </div>
      </div>

      {/* Settings Form */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Jam Check-in */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🕐</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Jam Check-in</h3>
                  <p className="text-gray-600">Waktu mulai check-in harian</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Jam Check-in
                </label>
                <input
                  type="time"
                  value={settings.jamCheckin}
                  onChange={(e) => handleInputChange('jamCheckin', e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white text-gray-900"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Mahasiswa dapat mulai check-in pada waktu ini
                </p>
              </div>
            </div>

            {/* Jam Check-out */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🕕</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Jam Check-out</h3>
                  <p className="text-gray-600">Waktu mulai check-out harian</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Jam Check-out
                </label>
                <input
                  type="time"
                  value={settings.jamCheckout}
                  onChange={(e) => handleInputChange('jamCheckout', e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white text-gray-900"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Mahasiswa dapat mulai check-out pada waktu ini
                </p>
              </div>
            </div>

            {/* Toleransi Keterlambatan */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⏰</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Toleransi Keterlambatan</h3>
                  <p className="text-gray-600">Batas waktu toleransi check-in terlambat</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Toleransi (dalam menit)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={settings.toleransiKeterlambatan}
                    onChange={(e) => handleInputChange('toleransiKeterlambatan', parseInt(e.target.value))}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white text-gray-900"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                    menit
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Mahasiswa yang check-in dalam toleransi ini masih dianggap tepat waktu
                </p>
              </div>
            </div>

            {/* Current Settings Summary */}
            <div className="bg-blue-50 rounded-xl p-6 border-l-4 border-blue-500">
              <h4 className="font-bold text-blue-800 mb-3">Pengaturan Saat Ini:</h4>
              <div className="space-y-2 text-sm text-blue-700">
                <p>• Check-in dimulai: <strong>{settings.jamCheckin || 'Belum diatur'}</strong></p>
                <p>• Check-out dimulai: <strong>{settings.jamCheckout || 'Belum diatur'}</strong></p>
                <p>• Toleransi keterlambatan: <strong>{settings.toleransiKeterlambatan} menit</strong></p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-6">
              <button
                type="button"
                onClick={() => fetchSettings()}
                className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors duration-200 font-semibold"
                disabled={saving}
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`flex-1 px-6 py-3 text-white rounded-xl font-semibold transition-all duration-200 ${
                  saving 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:scale-105 active:scale-95'
                }`}
              >
                {saving ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Menyimpan...</span>
                  </div>
                ) : (
                  'Simpan Pengaturan'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">💡 Bantuan</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start space-x-3">
              <span className="text-blue-500 mt-1">•</span>
              <p><strong>Jam Check-in:</strong> Waktu dimana mahasiswa dapat mulai melakukan check-in harian</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-blue-500 mt-1">•</span>
              <p><strong>Jam Check-out:</strong> Waktu dimana mahasiswa dapat mulai melakukan check-out</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-blue-500 mt-1">•</span>
              <p><strong>Toleransi Keterlambatan:</strong> Batas waktu setelah jam check-in dimana mahasiswa masih dianggap tepat waktu</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-blue-500 mt-1">•</span>
              <p>Contoh: Jika jam check-in 08:00 dan toleransi 15 menit, maka check-in sampai 08:15 masih dianggap tepat waktu</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
