'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { toast, Toaster } from 'react-hot-toast';

export default function AdminProfilePage() {
  const [profileData, setProfileData] = useState(null);
  const router = useRouter();

  // useEffect untuk memeriksa otentikasi saat halaman dimuat
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // useEffect untuk memuat data profil dari API
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await api.get('/api/v1/admin/profile');
        setProfileData(response.data.data);
      } catch (error) {
        console.error('Error fetching admin profile:', error);
        toast.error('Gagal memuat data profil.');
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('jwt_token');
          router.push('/login');
        }
      }
    };

    fetchProfileData();
  }, [router]);

  if (!profileData) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-xl font-semibold text-gray-700">Memuat data profil...</p>
            <p className="text-sm text-gray-500 mt-2">Mohon tunggu sebentar</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 transition-all duration-300">
        <div className="flex items-center justify-center mb-6">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-4xl text-white font-bold shadow-md">
            👤
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">{profileData.name}</h1>
        <p className="text-center text-sm font-medium text-gray-500 mb-8">Role: <span className="font-semibold text-indigo-600">{profileData.role}</span></p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
          <div className="p-6 bg-gray-50 rounded-xl shadow-inner">
            <p className="text-sm font-medium text-gray-500">Waktu Saat Ini</p>
            <p className="text-xl font-bold text-gray-800 mt-2">{profileData.time}</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-xl shadow-inner">
            <p className="text-sm font-medium text-gray-500">Status</p>
            <p className="text-xl font-bold text-green-600 mt-2">Aktif</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
