'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import MahasiswaLayout from '@/components/MahasiswaLayout';
import { toast, Toaster } from 'react-hot-toast';

export default function MahasiswaHistoryPage() {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalData: 0,
    pageSize: 10
  });
  
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('jwt_token');
    const userData = localStorage.getItem('user_data');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    // Set default dates to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    
    // Initial fetch with default dates
    fetchHistory(thirtyDaysAgo.toISOString().split('T')[0], today.toISOString().split('T')[0], 0, 10); // Start from page 0
  }, [router]);

  const fetchHistory = async (start, end, page, size) => {
    try {
      setLoading(true);
      
      const response = await api.get('/api/v1/mahasiswa/history', {
        params: {
          startDate: start,
          endDate: end,
          page: page,
          size: size
        }
      });
      
      if (response.data.statusCode === 200) {
        const { data } = response.data;
        setHistoryData(data.historyData || []);
        setPagination({
          currentPage: data.currentPage + 1, // Backend uses 0-based, frontend uses 1-based
          totalPages: data.totalPage,
          totalData: data.totalData,
          pageSize: data.pageSize
        });
      }
    } catch (error) {
      toast.error('Gagal memuat riwayat kehadiran');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    if (startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        toast.error('Tanggal mulai tidak boleh lebih dari tanggal selesai');
        return;
      }
      fetchHistory(startDate, endDate, 0, pagination.pageSize); // Start from page 0
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchHistory(startDate, endDate, newPage - 1, pagination.pageSize); // Convert to 0-based
    }
  };

  const handlePageSizeChange = (newSize) => {
    fetchHistory(startDate, endDate, 0, newSize); // Reset to first page (0-based)
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    
    try {
      if (timeString.includes(' ')) {
        const timePart = timeString.split(' ')[1];
        const cleanTime = timePart.split('.')[0];
        const [hours, minutes] = cleanTime.split(':');
        return `${hours}:${minutes}`;
      }
      
      return new Date(timeString).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return timeString || '-';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getStatusBadge = (status, isLate) => {
    if (status === 'HADIR' || status === 'TEPAT_WAKTU') {
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          isLate ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
        }`}>
          {isLate ? 'Terlambat' : 'Tepat Waktu'}
        </span>
      );
    } else if (status === 'TERLAMBAT') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
          Terlambat
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
        Tidak Hadir
      </span>
    );
  };

  return (
    <MahasiswaLayout>
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
          <h1 className="text-3xl font-bold mb-2">📋 Riwayat Kehadiran</h1>
          <p className="text-blue-100">Lihat riwayat kehadiran Anda</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-6">🔍 Filter Riwayat Kehadiran</h3>
        
        <form onSubmit={handleFilterSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                📅 Tanggal Mulai
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 font-medium"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {startDate && `📌 ${new Date(startDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                📅 Tanggal Selesai
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 font-medium"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {endDate && `📌 ${new Date(endDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
              </p>
            </div>
            
            <div className="flex flex-col justify-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Memuat Data...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span className="mr-2">🔍</span>
                    Tampilkan Riwayat
                  </div>
                )}
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                💡 Pilih rentang tanggal untuk melihat riwayat kehadiran
              </p>
            </div>
          </div>
        </form>
      </div>

      {/* Results Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="text-xl font-bold text-gray-800">📊 Hasil Pencarian</h3>
          
          {/* Page Size Selector */}
          <div className="flex items-center space-x-3 bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
            <span className="text-sm text-blue-800 font-semibold">Tampilkan:</span>
            <select
              value={pagination.pageSize}
              onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
              className="border-2 border-blue-300 rounded-lg px-3 py-2 text-sm font-bold bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-blue-800"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-blue-800 font-semibold">data per halaman</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-xl font-semibold text-gray-700">Memuat data...</p>
            </div>
          </div>
        ) : historyData.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tanggal</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Check-in</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Check-out</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Durasi</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {historyData.map((attendance, index) => (
                    <tr key={attendance.attendanceId || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDate(attendance.attendanceDate)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatTime(attendance.checkinTime)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatTime(attendance.checkoutTime)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {attendance.duration || '-'}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(attendance.status, attendance.late)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="space-y-1">
                          {attendance.notesCheckin && (
                            <p className="text-green-600">
                              <span className="font-medium">In:</span> {attendance.notesCheckin}
                            </p>
                          )}
                          {attendance.notesCheckout && (
                            <p className="text-blue-600">
                              <span className="font-medium">Out:</span> {attendance.notesCheckout}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {historyData.map((attendance, index) => (
                <div key={attendance.attendanceId || index} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-gray-800">
                      {formatDate(attendance.attendanceDate)}
                    </h4>
                    {getStatusBadge(attendance.status, attendance.late)}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Check-in</p>
                      <p className="font-semibold text-green-600">
                        {formatTime(attendance.checkinTime)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Check-out</p>
                      <p className="font-semibold text-blue-600">
                        {formatTime(attendance.checkoutTime)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Durasi</p>
                      <p className="font-semibold text-purple-600">
                        {attendance.duration || '-'}
                      </p>
                    </div>
                  </div>
                  
                  {(attendance.notesCheckin || attendance.notesCheckout) && (
                    <div className="border-t pt-3 space-y-1">
                      {attendance.notesCheckin && (
                        <p className="text-xs text-green-600">
                          <span className="font-medium">Catatan Check-in:</span> {attendance.notesCheckin}
                        </p>
                      )}
                      {attendance.notesCheckout && (
                        <p className="text-xs text-blue-600">
                          <span className="font-medium">Catatan Check-out:</span> {attendance.notesCheckout}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              {/* Info tentang data yang ditampilkan */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <div className="text-base font-bold text-green-800">
                    📊 Menampilkan data ke-{((pagination.currentPage - 1) * pagination.pageSize) + 1} sampai ke-{Math.min(pagination.currentPage * pagination.pageSize, pagination.totalData)} dari total {pagination.totalData} data kehadiran
                  </div>
                  <div className="text-green-600 mt-2 font-medium">
                    📅 Periode: {new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} s/d {new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
                
                {/* Page info yang lebih jelas */}
                <div className="bg-blue-100 border-2 border-blue-300 px-6 py-3 rounded-xl">
                  <div className="text-lg font-bold text-blue-800">
                    📄 Halaman <span className="text-2xl text-blue-600">{pagination.currentPage}</span> dari <span className="text-xl">{pagination.totalPages}</span>
                  </div>
                </div>
              </div>
              
              {/* Navigation buttons */}
              <div className="flex justify-center items-center space-x-4">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage <= 1}
                  className="flex items-center px-6 py-3 bg-white border-2 border-gray-300 rounded-xl text-base font-bold hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                >
                  <span className="mr-2 text-lg">←</span>
                  HALAMAN SEBELUMNYA
                </button>
                
                {/* Page numbers */}
                <div className="flex items-center space-x-2">
                  {pagination.totalPages <= 5 ? (
                    // Show all pages if 5 or less
                    [...Array(pagination.totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => handlePageChange(i + 1)}
                        className={`px-4 py-3 text-lg font-bold rounded-xl transition-all shadow-md border-2 ${
                          pagination.currentPage === i + 1
                            ? 'bg-blue-600 text-white border-blue-600 transform scale-110'
                            : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))
                  ) : (
                    // Show page numbers with ellipsis for more than 5 pages
                    <>
                      {pagination.currentPage > 3 && (
                        <>
                          <button
                            onClick={() => handlePageChange(1)}
                            className="px-4 py-3 text-lg font-bold rounded-xl transition-all shadow-md border-2 bg-white text-blue-600 border-blue-300 hover:bg-blue-50"
                          >
                            1
                          </button>
                          <span className="text-gray-400 font-bold text-lg">...</span>
                        </>
                      )}
                      
                      {[...Array(5)].map((_, i) => {
                        const pageNum = pagination.currentPage - 2 + i;
                        if (pageNum > 0 && pageNum <= pagination.totalPages) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-4 py-3 text-lg font-bold rounded-xl transition-all shadow-md border-2 ${
                                pagination.currentPage === pageNum
                                  ? 'bg-blue-600 text-white border-blue-600 transform scale-110'
                                  : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                        return null;
                      })}
                      
                      {pagination.currentPage < pagination.totalPages - 2 && (
                        <>
                          <span className="text-gray-400 font-bold text-lg">...</span>
                          <button
                            onClick={() => handlePageChange(pagination.totalPages)}
                            className="px-4 py-3 text-lg font-bold rounded-xl transition-all shadow-md border-2 bg-white text-blue-600 border-blue-300 hover:bg-blue-50"
                          >
                            {pagination.totalPages}
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
                
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.totalPages}
                  className="flex items-center px-6 py-3 bg-white border-2 border-gray-300 rounded-xl text-base font-bold hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                >
                  HALAMAN SELANJUTNYA
                  <span className="ml-2 text-lg">→</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-xl text-gray-500 mb-2">Tidak ada data kehadiran</p>
            <p className="text-gray-400">Silakan ubah filter tanggal atau mulai melakukan check-in</p>
          </div>
        )}
      </div>
    </MahasiswaLayout>
  );
}
