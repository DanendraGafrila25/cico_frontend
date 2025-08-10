'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { toast, Toaster } from 'react-hot-toast';

export default function RiwayatMahasiswaPage() {
  const [mahasiswa, setMahasiswa] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPage: 1, pageSize: 10, totalData: 0 }); // Frontend uses 1-based, backend uses 0-based (converted in API calls)
  
  const router = useRouter();
  const params = useParams();
  const studentId = params.id;

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const defaultEndDate = today.toISOString().split('T')[0];
    const defaultStartDate = thirtyDaysAgo.toISOString().split('T')[0];
    
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);

    // Fetch student data and attendance history
    if (studentId) {
      fetchStudentData();
      fetchAttendanceHistory(defaultStartDate, defaultEndDate);
    }
  }, [router, studentId]);

  const fetchStudentData = async () => {
    try {
      // Menggunakan endpoint yang benar untuk mengambil data mahasiswa berdasarkan ID
      const response = await api.get(`/api/v1/admin/mahasiswa/detail/${studentId}`);
      if (response.data.statusCode === 200) {
        setMahasiswa(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      
      // Jika endpoint tersebut tidak ada, coba ambil dari list mahasiswa
      try {
        const listResponse = await api.get('/api/v1/admin/list_all_mahasiswa', {
          params: {
            page: 1,
            size: 1000 // Ambil semua untuk mencari yang sesuai
          }
        });
        
        if (listResponse.data.statusCode === 200) {
          const students = listResponse.data.data.data;
          const student = students.find(s => s.studentId.toString() === studentId.toString());
          if (student) {
            setMahasiswa(student);
          } else {
            toast.error('Data mahasiswa tidak ditemukan');
          }
        }
      } catch (listError) {
        console.error('Error fetching student from list:', listError);
        toast.error('Gagal memuat data mahasiswa');
      }
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('jwt_token');
        router.push('/login');
      }
    }
  };

  const fetchAttendanceHistory = async (start = startDate, end = endDate, page = 1, size = 10) => {
    setLoading(true);
    
    try {
      // Gunakan endpoint yang benar sesuai dengan Postman
      const response = await api.get('/api/v1/admin/list_attendance_mahasiswa', {
        params: {
          student_id: parseInt(studentId), // Parameter yang benar dari Postman
          startdate: start,
          enddate: end,
          page: page - 1, // Convert 1-based to 0-based untuk backend
          size: size
        }
      });
      
      if (response.data.statusCode === 200) {
        const { data, totalData, totalPage, currentPage, pageSize } = response.data.data;
        setAttendanceHistory(data || []);
        // Convert 0-based currentPage dari backend ke 1-based untuk frontend
        setPagination({ 
          currentPage: currentPage + 1, 
          totalPage, 
          pageSize, 
          totalData 
        });
      }
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      toast.error('Gagal memuat riwayat kehadiran');
      setAttendanceHistory([]); // Set empty array on error
      setPagination({ currentPage: 1, totalPage: 1, pageSize: 10, totalData: 0 });
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('jwt_token');
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = (e) => {
    e.preventDefault();
    fetchAttendanceHistory(startDate, endDate, 1, pagination.pageSize); // Reset to page 1 when filtering
  };

  const handlePageChange = (newPage) => {
    fetchAttendanceHistory(startDate, endDate, newPage, pagination.pageSize);
  };

  const handlePageSizeChange = (newSize) => {
    fetchAttendanceHistory(startDate, endDate, 1, newSize); // Reset to page 1 when changing size
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    
    // Handle format "2025-05-23 07:30:00.0"
    try {
      // Jika timeString sudah berisi tanggal dan waktu, ekstrak waktu saja
      if (timeString.includes(' ')) {
        const timePart = timeString.split(' ')[1];
        // Hapus milliseconds jika ada
        const cleanTime = timePart.split('.')[0];
        const [hours, minutes] = cleanTime.split(':');
        return `${hours}:${minutes}`;
      }
      
      // Jika format lain, coba parse sebagai Date
      return new Date(timeString).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString || '-';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      // Handle format "2025-05-23"
      if (dateString.includes('-') && !dateString.includes(' ')) {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      
      // Jika format lain, coba parse sebagai Date
      return new Date(dateString).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString || '-';
    }
  };

  const getStatusBadge = (status, isLate) => {
    if (status === 'HADIR') {
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          isLate ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
        }`}>
          {isLate ? 'Hadir (Terlambat)' : 'Hadir'}
        </span>
      );
    } else if (status === 'TERLAMBAT') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
          Terlambat
        </span>
      );
    } else if (status === 'ALPHA') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
          Alpha
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
        {status || 'Tidak Diketahui'}
      </span>
    );
  };

  if (loading && !mahasiswa) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-xl font-semibold text-gray-700">Memuat data riwayat kehadiran...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      
      {/* Header with Student Info */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Riwayat Kehadiran</h1>
              {mahasiswa && (
                <div className="text-blue-100 text-lg space-y-1">
                  <p><strong>Nama:</strong> {mahasiswa.studentName}</p>
                  <p><strong>NIM:</strong> {mahasiswa.nim}</p>
                  <p><strong>Email:</strong> {mahasiswa.email}</p>
                </div>
              )}
            </div>
            <button
              onClick={() => router.push('/admin/mahasiswa')}
              className="px-6 py-3 bg-white text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
            >
              ← Kembali ke Daftar Mahasiswa
            </button>
          </div>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Filter Berdasarkan Tanggal</h2>
        <form onSubmit={handleDateFilter} className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal Mulai</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal Akhir</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
              required
            />
          </div>
          <button
            type="submit"
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
          >
            🔍 Filter Data
          </button>
        </form>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">Riwayat Kehadiran</h3>
          <p className="text-gray-600 mt-1">Total: {pagination.totalData} record</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-900">Tanggal</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900">Check-in</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900">Check-out</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900">Catatan Check-in</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900">Catatan Check-out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-500">Memuat data...</p>
                  </td>
                </tr>
              ) : attendanceHistory.length > 0 ? (
                attendanceHistory.map((record, index) => (
                  <tr key={record.attendanceData?.attendanceId || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(record.attendanceData?.attendanceDate)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatTime(record.attendanceData?.checkinTime)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatTime(record.attendanceData?.checkoutTime)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(record.attendanceData?.status, record.attendanceData?.late)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={record.attendanceData?.notesCheckin}>
                        {record.attendanceData?.notesCheckin || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={record.attendanceData?.notesCheckout}>
                        {record.attendanceData?.notesCheckout || '-'}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    Tidak ada data kehadiran dalam rentang tanggal ini.
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
    </AdminLayout>
  );
}