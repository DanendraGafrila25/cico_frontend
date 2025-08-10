'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { toast, Toaster } from 'react-hot-toast';

export default function LaporanKehadiranPage() {
  const [laporanData, setLaporanData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [studentName, setStudentName] = useState('');
  const [sortBy, setSortBy] = useState('studentName');
  const [pagination, setPagination] = useState({ currentPage: 0, totalPage: 1, pageSize: 10, totalData: 0 });
  const [summary, setSummary] = useState({
    totalKehadiran: 0,
    tepatWaktu: 0,
    terlambat: 0,
    belumCheckin: 0
  });
  
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    // Set default date range (last 7 days)
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(sevenDaysAgo.toISOString().split('T')[0]);

    fetchLaporanData(sevenDaysAgo.toISOString().split('T')[0], today.toISOString().split('T')[0], '', 'studentName', 0, 10);
  }, [router]);

  const fetchLaporanData = async (start, end, student_name = '', sort_by = 'studentName', page = 0, size = 10) => {
    try {
      setLoading(true);
      
      // Fetch all students first
      const allStudentsResponse = await api.get('/api/v1/admin/list_all_mahasiswa', {
        params: {
          page: 0,
          size: 1000 // Get all students
        }
      });
      
      // Fetch attendance data
      const attendanceResponse = await api.get('/api/v1/admin/list_checkin_mahasiswa', {
        params: {
          student_name: student_name,
          startdate: start,
          enddate: end,
          sortBy: sort_by,
          page: 0,
          size: 1000 // Get all attendance records
        }
      });
      
      if (allStudentsResponse.data.statusCode === 200 && attendanceResponse.data.statusCode === 200) {
        const allStudents = allStudentsResponse.data.data.data;
        const attendanceData = attendanceResponse.data.data.data;
        
        // Create a map of students with attendance data
        const attendanceMap = new Map();
        attendanceData.forEach(record => {
          const key = `${record.studentId}_${record.attendanceData?.attendanceDate}`;
          attendanceMap.set(key, record);
        });
        
        // Generate date range
        const dateRange = [];
        const startDateObj = new Date(start);
        const endDateObj = new Date(end);
        
        for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
          dateRange.push(new Date(d).toISOString().split('T')[0]);
        }
        
        // Create complete data including students who haven't checked in
        const completeData = [];
        
        allStudents.forEach(student => {
          if (!student_name || student.studentName.toLowerCase().includes(student_name.toLowerCase())) {
            dateRange.forEach(date => {
              const key = `${student.studentId}_${date}`;
              const attendanceRecord = attendanceMap.get(key);
              
              if (attendanceRecord) {
                completeData.push(attendanceRecord);
              } else {
                // Student didn't check in on this date
                completeData.push({
                  studentId: student.studentId,
                  studentName: student.studentName,
                  nim: student.nim,
                  email: student.email,
                  attendanceDate: date, // Add date for display
                  attendanceData: null // No attendance data means they didn't check in
                });
              }
            });
          }
        });
        
        // Apply sorting
        completeData.sort((a, b) => {
          if (sort_by === 'studentName') {
            return a.studentName.localeCompare(b.studentName);
          }
          return 0;
        });
        
        // Apply pagination
        const startIndex = page * size;
        const endIndex = startIndex + size;
        const paginatedData = completeData.slice(startIndex, endIndex);
        
        setLaporanData(paginatedData);
        setPagination({ 
          currentPage: page, 
          totalPage: Math.ceil(completeData.length / size), 
          pageSize: size, 
          totalData: completeData.length 
        });
        calculateSummary(completeData);
      }
    } catch (error) {
      console.error('Error fetching laporan data:', error);
      toast.error('Gagal memuat laporan kehadiran');
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('jwt_token');
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (data) => {
    const summary = {
      totalKehadiran: data.length,
      tepatWaktu: data.filter(item => 
        item.attendanceData && (
          (item.attendanceData.status === 'HADIR' && !item.attendanceData.late) ||
          item.attendanceData.status === 'TEPAT_WAKTU'
        )
      ).length,
      terlambat: data.filter(item => 
        item.attendanceData && (
          item.attendanceData.late === true || 
          item.attendanceData.status === 'TERLAMBAT'
        )
      ).length,
      belumCheckin: data.filter(item => 
        !item.attendanceData || 
        (item.attendanceData && (
          item.attendanceData.status === 'ALPHA' || 
          !item.attendanceData.status
        ))
      ).length
    };
    setSummary(summary);
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchLaporanData(startDate, endDate, studentName, sortBy, 0, pagination.pageSize);
  };

  const handlePageChange = (newPage) => {
    fetchLaporanData(startDate, endDate, studentName, sortBy, newPage, pagination.pageSize);
  };

  const handlePageSizeChange = (newSize) => {
    fetchLaporanData(startDate, endDate, studentName, sortBy, 0, newSize);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (attendanceData) => {
    if (!attendanceData) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
          Belum Check-in
        </span>
      );
    }

    const { status, late } = attendanceData;
    
    if (status === 'TEPAT_WAKTU') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
          Tepat Waktu
        </span>
      );
    } else if (status === 'TERLAMBAT') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
          Terlambat
        </span>
      );
    } else if (status === 'HADIR') {
      if (late) {
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
            Hadir (Terlambat)
          </span>
        );
      } else {
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
            Hadir
          </span>
        );
      }
    } else if (status === 'ALPHA') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
          Alpha
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
          {status || 'Belum Check-in'}
        </span>
      );
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-xl font-semibold text-gray-700">Memuat laporan kehadiran...</p>
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
          <h1 className="text-4xl font-bold mb-2">Laporan Kehadiran</h1>
          <p className="text-blue-100 text-lg">Laporan kehadiran mahasiswa lengkap</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">📊</div>
          <h3 className="text-lg font-bold text-gray-800">Total Kehadiran</h3>
          <p className="text-3xl font-bold text-blue-600">{summary.totalKehadiran}</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">✅</div>
          <h3 className="text-lg font-bold text-gray-800">Tepat Waktu</h3>
          <p className="text-3xl font-bold text-green-600">{summary.tepatWaktu}</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">⏰</div>
          <h3 className="text-lg font-bold text-gray-800">Terlambat</h3>
          <p className="text-3xl font-bold text-yellow-600">{summary.terlambat}</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">❌</div>
          <h3 className="text-lg font-bold text-gray-800">Belum Check-in</h3>
          <p className="text-3xl font-bold text-gray-600">{summary.belumCheckin}</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Filter Laporan Kehadiran</h2>
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <form onSubmit={handleFilterSubmit} className="flex flex-col md:flex-row gap-4 items-end flex-1">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Mahasiswa</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Cari berdasarkan nama..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
              />
            </div>
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
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">Data Kehadiran</h3>
          <p className="text-gray-600">Periode: {formatDate(startDate)} - {formatDate(endDate)}</p>
        </div>
        
        {laporanData.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-xl text-gray-500">Tidak ada data kehadiran</p>
            <p className="text-gray-400">pada rentang tanggal yang dipilih</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">Tanggal</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">NIM</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">Nama</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">Check-in</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">Check-out</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {laporanData.map((record, index) => (
                  <tr key={`${record.studentId}_${record.attendanceData?.attendanceDate || record.attendanceDate}_${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(record.attendanceData?.attendanceDate || record.attendanceDate)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {record.nim}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {record.studentName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatTime(record.attendanceData?.checkinTime)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatTime(record.attendanceData?.checkoutTime)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {getStatusBadge(record.attendanceData)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={record.attendanceData?.notesCheckin}>
                        {record.attendanceData?.notesCheckin || '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination and Page Size Controls */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Page Size Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Tampilkan:</span>
              <select
                value={pagination.pageSize}
                onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-700">per halaman</span>
            </div>

            {/* Page Info */}
            <div className="text-sm text-gray-700">
              Menampilkan {Math.min(pagination.currentPage * pagination.pageSize + 1, pagination.totalData)} - {Math.min((pagination.currentPage + 1) * pagination.pageSize, pagination.totalData)} dari {pagination.totalData} data
            </div>

            {/* Page Navigation */}
            {pagination.totalPage > 1 && (
              <div className="flex items-center space-x-1">
                {/* First Page */}
                <button
                  onClick={() => handlePageChange(0)}
                  disabled={pagination.currentPage === 0}
                  className="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Halaman Pertama"
                >
                  ««
                </button>

                {/* Previous Page */}
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 0}
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
                  if (currentPage > 2) {
                    pages.push(
                      <button
                        key={0}
                        onClick={() => handlePageChange(0)}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        1
                      </button>
                    );
                    if (currentPage > 3) {
                      pages.push(<span key="dots1" className="px-2 text-gray-500">...</span>);
                    }
                  }

                  // Show pages around current page
                  for (let i = Math.max(0, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => handlePageChange(i)}
                        className={`px-3 py-1 text-sm rounded ${
                          i === currentPage
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {i + 1}
                      </button>
                    );
                  }

                  // Always show last page
                  if (currentPage < totalPages - 3) {
                    if (currentPage < totalPages - 4) {
                      pages.push(<span key="dots2" className="px-2 text-gray-500">...</span>);
                    }
                    pages.push(
                      <button
                        key={totalPages - 1}
                        onClick={() => handlePageChange(totalPages - 1)}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
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
                  disabled={pagination.currentPage >= pagination.totalPage - 1}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next ›
                </button>

                {/* Last Page */}
                <button
                  onClick={() => handlePageChange(pagination.totalPage - 1)}
                  disabled={pagination.currentPage >= pagination.totalPage - 1}
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
