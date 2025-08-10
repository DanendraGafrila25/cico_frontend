'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { toast, Toaster } from 'react-hot-toast';

export default function KelolaMahasiswaPage() {
  const [mahasiswa, setMahasiswa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('studentName');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPage: 1, pageSize: 10, totalData: 0 }); // Backend uses 1-based pagination
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMahasiswa, setEditingMahasiswa] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form state for add/edit
  const [formData, setFormData] = useState({
    studentName: '',
    email: '',
    nim: '',
    password: ''
  });

  // Efek untuk memuat data saat URL berubah
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      router.push('/login');
      return;
    }

    const search = searchParams.get('student_name') || '';
    const sort = searchParams.get('sortBy') || 'studentName';
    const page = parseInt(searchParams.get('page')) || 1; // Backend uses 1-based pagination
    const size = parseInt(searchParams.get('size')) || 10;

    setSearchTerm(search);
    setSortBy(sort);
    setPagination(prev => ({ ...prev, currentPage: page, pageSize: size }));

    fetchMahasiswa(search, sort, page, size);
  }, [searchParams, router]);

  // Fungsi utama untuk mengambil data mahasiswa
  const fetchMahasiswa = async (search, sort, page, size) => {
    setLoading(true);
    try {
      // Gunakan API yang benar sesuai dengan dokumentasi
      const response = await api.get('/api/v1/admin/list_all_mahasiswa', {
        params: {
          student_name: search,
          sortBy: sort,
          page: page, // Backend expects 1-based pagination
          size: size,
        },
      });
      
      const { data, totalData, totalPage, currentPage, pageSize } = response.data.data;
      setMahasiswa(data);
      setPagination({ currentPage, totalPage, pageSize, totalData });
      
    } catch (error) {
      console.error('Error fetching mahasiswa:', error);
      toast.error('Gagal memuat data mahasiswa');
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('jwt_token');
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateURL = (search, sort, page, size) => {
    const params = new URLSearchParams();
    if (search) params.set('student_name', search);
    if (sort) params.set('sortBy', sort);
    params.set('page', page.toString()); // Always set page parameter
    params.set('size', size.toString()); // Always set size parameter
    
    const newURL = params.toString() ? `?${params.toString()}` : '';
    router.push(`/admin/mahasiswa${newURL}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateURL(searchTerm, sortBy, 1, pagination.pageSize); // Reset to page 1 for search
  };

  const handleSort = (field) => {
    // Simple sort toggle - since backend doesn't support sortDir, we'll just use the field
    updateURL(searchTerm, field, pagination.currentPage, pagination.pageSize);
  };

  const handlePageChange = (newPage) => {
    updateURL(searchTerm, sortBy, newPage, pagination.pageSize);
  };

  const handlePageSizeChange = (newSize) => {
    updateURL(searchTerm, sortBy, 1, newSize); // Reset to page 1 when changing size
  };

  const handleAddMahasiswa = async (e) => {
    e.preventDefault();
    try {
      // API endpoint yang benar sesuai dokumentasi
      const response = await api.post('/api/v1/admin/add-mahasiswa', formData);
      if (response.data.statusCode === 201) {
        toast.success('Mahasiswa berhasil ditambahkan');
        setShowAddModal(false);
        setFormData({ studentName: '', email: '', nim: '', password: '' });
        fetchMahasiswa(searchTerm, sortBy, pagination.currentPage, pagination.pageSize);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menambahkan mahasiswa');
    }
  };

  const handleEditMahasiswa = async (e) => {
    e.preventDefault();
    try {
      // API endpoint yang benar sesuai dokumentasi
      // Jangan kirim password jika kosong
      const updateData = {
        studentName: formData.studentName,
        nim: formData.nim,
        email: formData.email
      };
      
      // Hanya tambahkan password jika diisi
      if (formData.password.trim()) {
        updateData.password = formData.password;
      }
      
      const response = await api.put(`/api/v1/admin/edit-mahasiswa/${editingMahasiswa.studentId}`, updateData);
      if (response.data.statusCode === 200) {
        toast.success('Mahasiswa berhasil diperbarui');
        setEditingMahasiswa(null);
        setFormData({ studentName: '', email: '', nim: '', password: '' });
        fetchMahasiswa(searchTerm, sortBy, pagination.currentPage, pagination.pageSize);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal memperbarui mahasiswa');
    }
  };

  const handleDeleteMahasiswa = async (id) => {
    try {
      // API endpoint yang benar sesuai dokumentasi
      const response = await api.delete(`/api/v1/admin/mahasiswa/${id}`);
      if (response.data.statusCode === 200) {
        toast.success('Mahasiswa berhasil dihapus');
        setDeleteConfirm(null);
        fetchMahasiswa(searchTerm, sortBy, pagination.currentPage, pagination.pageSize);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menghapus mahasiswa');
    }
  };

  const openEditModal = (mhs) => {
    setEditingMahasiswa(mhs);
    setFormData({
      studentName: mhs.studentName,
      email: mhs.email,
      nim: mhs.nim,
      password: '' // Jangan set password lama
    });
    setShowAddModal(true);
  };
  
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-xl font-semibold text-gray-700">Memuat data mahasiswa...</p>
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
          <h1 className="text-4xl font-bold mb-2">Kelola Mahasiswa</h1>
          <p className="text-blue-100 text-lg">Manajemen data mahasiswa sistem</p>
        </div>
      </div>

      {/* Search and Add Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari berdasarkan nama mahasiswa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pr-12 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                🔍
              </button>
            </div>
          </form>
          
          <button
            onClick={() => { setShowAddModal(true); setEditingMahasiswa(null); }}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-semibold"
          >
            + Tambah Mahasiswa
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-4 text-left font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('nim')}
                >
                  NIM {sortBy === 'nim' && '↑'}
                </th>
                <th 
                  className="px-6 py-4 text-left font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('studentName')}
                >
                  Nama {sortBy === 'studentName' && '↑'}
                </th>
                <th 
                  className="px-6 py-4 text-left font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('email')}
                >
                  Email {sortBy === 'email' && '↑'}
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mahasiswa.length > 0 ? (
                mahasiswa.map((mhs) => (
                  <tr key={mhs.studentId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{mhs.nim}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{mhs.studentName}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{mhs.email}</td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => router.push(`/admin/mahasiswa/${mhs.studentId}/history`)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200"
                      >
                        Riwayat
                      </button>
                      <button
                        onClick={() => openEditModal(mhs)}
                        className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors duration-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(mhs)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    Tidak ada data mahasiswa ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination and Page Size Controls */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Page Size Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Tampilkan:</span>
              <select
                value={pagination.pageSize}
                onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                className="px-3 py-2 bg-white border-2 border-gray-300 rounded-lg text-sm text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm font-medium text-gray-700">per halaman</span>
            </div>

            {/* Page Info */}
            <div className="text-sm text-gray-700">
              Menampilkan {Math.min((pagination.currentPage - 1) * pagination.pageSize + 1, pagination.totalData)} - {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalData)} dari {pagination.totalData} data
            </div>

            {/* Page Navigation */}
            {pagination.totalPage > 1 && (
              <div className="flex items-center space-x-1">
                {/* First Page */}
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.currentPage === 1}
                  className="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Halaman Pertama"
                >
                  ««
                </button>

                {/* Previous Page */}
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ‹ Prev
                </button>

                {/* Page Numbers */}
                {(() => {
                  const currentPage = pagination.currentPage;
                  const totalPages = pagination.totalPage;
                  const pages = [];
                  
                  // Always show first page
                  if (currentPage > 3) {
                    pages.push(
                      <button
                        key={1}
                        onClick={() => handlePageChange(1)}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 font-medium"
                      >
                        1
                      </button>
                    );
                    if (currentPage > 4) {
                      pages.push(<span key="dots1" className="px-2 text-gray-500">...</span>);
                    }
                  }

                  // Show pages around current page
                  for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => handlePageChange(i)}
                        className={`px-3 py-1 text-sm rounded font-medium transition-colors ${
                          i === currentPage
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }

                  // Always show last page
                  if (currentPage < totalPages - 2) {
                    if (currentPage < totalPages - 3) {
                      pages.push(<span key="dots2" className="px-2 text-gray-500">...</span>);
                    }
                    pages.push(
                      <button
                        key={totalPages}
                        onClick={() => handlePageChange(totalPages)}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 font-medium"
                      >
                        {totalPages}
                      </button>
                    );
                  }

                  return pages;
                })()}

                {/* Next Page */}
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.totalPage}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next ›
                </button>

                {/* Last Page */}
                <button
                  onClick={() => handlePageChange(pagination.totalPage)}
                  disabled={pagination.currentPage >= pagination.totalPage}
                  className="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Halaman Terakhir"
                >
                  »»
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingMahasiswa) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              {editingMahasiswa ? 'Edit Mahasiswa' : 'Tambah Mahasiswa'}
            </h3>
            <form onSubmit={editingMahasiswa ? handleEditMahasiswa : handleAddMahasiswa} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">NIM</label>
                <input
                  type="text"
                  value={formData.nim}
                  onChange={(e) => setFormData({...formData, nim: e.target.value})}
                  required
                  placeholder="Masukkan NIM mahasiswa"
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama</label>
                <input
                  type="text"
                  value={formData.studentName}
                  onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                  required
                  placeholder="Masukkan nama lengkap mahasiswa"
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  placeholder="contoh@email.com"
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                />
              </div>
              {!editingMahasiswa && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    placeholder="Masukkan password untuk mahasiswa"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                  />
                </div>
              )}
              {editingMahasiswa && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password Baru (kosongkan jika tidak diubah)</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Masukkan password baru (opsional)"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                  />
                </div>
              )}
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingMahasiswa(null);
                    setFormData({ studentName: '', email: '', nim: '', password: '' });
                  }}
                  className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors duration-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                >
                  {editingMahasiswa ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Konfirmasi Hapus</h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus mahasiswa <strong>{deleteConfirm.studentName}</strong>? 
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors duration-200"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteMahasiswa(deleteConfirm.studentId)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}