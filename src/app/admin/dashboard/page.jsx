'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import AdminLayout from '@/components/AdminLayout';

export default function AdminDashboard() {
  const [summaryData, setSummaryData] = useState(null);
  const router = useRouter();

  // useEffect untuk memeriksa otentikasi saat halaman dimuat
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // useEffect untuk memuat data ringkasan dari API
  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        const response = await api.get('/api/v1/admin/resume_checkin');
        setSummaryData(response.data.data);
      } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        toast.error('Gagal memuat data ringkasan.');
        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('jwt_token');
            router.push('/login');
        }
      }
    };

    fetchSummaryData();
  }, [router]);

  if (!summaryData) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-xl font-semibold text-gray-700">Memuat data dashboard...</p>
            <p className="text-sm text-gray-500 mt-2">Mohon tunggu sebentar</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const { totalMahasiswa, totalCheckin, totalTelatCheckin, totalBelumCheckin } = summaryData;
  const onTimeCheckin = totalCheckin - totalTelatCheckin;

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      
      {/* Header Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">Dashboard Admin</h1>
            <p className="text-blue-100 text-lg">Sistem Check-in Check-out Mahasiswa</p>
            <div className="mt-4 text-sm opacity-90">
              {new Date().toLocaleDateString('id-ID', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Total Mahasiswa Card */}
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">👥</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-800">Mahasiswa</p>
              </div>
            </div>
            <div className="text-center mt-6">
              <p className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                {totalMahasiswa}
              </p>
              <p className="text-gray-500 mt-2">mahasiswa terdaftar</p>
            </div>
          </div>
        </div>

        {/* Kehadiran Card */}
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">📊</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-500">Resume</p>
                <p className="text-2xl font-bold text-gray-800">Checkin</p>
              </div>
            </div>
            
            {totalCheckin !== undefined && totalCheckin !== null ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 rounded-xl p-4 border-l-4 border-green-500">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {onTimeCheckin}
                      </p>
                      <p className="text-sm text-green-700 font-medium">Tepat Waktu</p>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 rounded-xl p-4 border-l-4 border-red-500">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">
                        {totalTelatCheckin}
                      </p>
                      <p className="text-sm text-red-700 font-medium">Terlambat</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-500">
                    <div className="flex justify-between items-center">
                        <span className="text-blue-700 font-medium">Belum Check-in</span>
                        <span className="text-2xl font-bold text-blue-800">
                            {totalBelumCheckin}
                        </span>
                    </div>
                </div>
                
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📅</div>
                <p className="text-gray-500 text-lg">Belum ada data kehadiran</p>
                <p className="text-gray-400 text-sm mt-1">untuk hari ini</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}