'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';

export default function ManageAdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    // fetchAdmins();
    setLoading(false); // For now, we'll just set loading to false
  }, [router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast.error('Semua field harus diisi');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Format email tidak valid');
      return;
    }

    setAdding(true);

    try {
      const response = await api.post('/api/v1/admin/signup', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password
      });

      if (response.data && response.data.statusCode === 200) {
        toast.success('Admin berhasil ditambahkan!');
        setShowAddModal(false);
        setFormData({ name: '', email: '', password: '' });
        // fetchAdmins(); // Refresh list if we have it
      } else {
        toast.error(response.data?.message || 'Gagal menambahkan admin');
      }
    } catch (error) {
      console.error('Error adding admin:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Sesi telah berakhir, silakan login kembali');
        localStorage.removeItem('jwt_token');
        router.push('/login');
      } else {
        toast.error('Terjadi kesalahan saat menambahkan admin');
      }
    } finally {
      setAdding(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setFormData({ name: '', email: '', password: '' });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">👨‍💼 Kelola Admin</h1>
            <p className="text-gray-600 mt-2">Tambahkan admin baru untuk sistem</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Tambah Admin</span>
          </button>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <span className="text-2xl">ℹ️</span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-2">Informasi Kelola Admin</h3>
              <ul className="text-blue-700 space-y-1 text-sm">
                <li>• Admin baru akan mendapat akses penuh ke sistem</li>
                <li>• Password minimal 6 karakter</li>
                <li>• Email harus unik dan valid</li>
                <li>• Admin baru dapat langsung login setelah dibuat</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Add Admin */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">➕ Tambah Admin Baru</h2>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleAddAdmin} className="space-y-4">
                  {/* Name Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      👤 Nama Lengkap
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-gray-900 bg-white placeholder-gray-400"
                      placeholder="Masukkan nama lengkap admin"
                      style={{ fontSize: '16px', color: '#1f2937' }}
                      required
                    />
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📧 Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-gray-900 bg-white placeholder-gray-400"
                      placeholder="admin@example.com"
                      style={{ fontSize: '16px', color: '#1f2937' }}
                      required
                    />
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🔒 Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-gray-900 bg-white placeholder-gray-400"
                      placeholder="Minimal 6 karakter"
                      style={{ fontSize: '16px', color: '#1f2937' }}
                      minLength="6"
                      required
                    />
                    <p className="text-sm text-gray-600 mt-1 font-medium">
                      💡 Password minimal 6 karakter
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 py-3 px-4 border-2 border-gray-400 text-gray-800 bg-gray-50 rounded-lg font-bold hover:bg-gray-100 transition-colors text-lg"
                      disabled={adding}
                      style={{ fontSize: '16px' }}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={adding}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-lg font-bold transition-colors flex items-center justify-center space-x-2 text-lg"
                      style={{ fontSize: '16px' }}
                    >
                      {adding ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <span>✅</span>
                          <span>Tambah Admin</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}