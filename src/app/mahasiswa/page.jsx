'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MahasiswaPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('jwt_token');
    
    if (!token) {
      // No token, redirect to login
      router.replace('/login');
    } else {
      // Token exists, redirect to mahasiswa home
      router.replace('/mahasiswa/home');
    }
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">CICO Mahasiswa</h1>
        <p className="text-gray-600">Memverifikasi akses...</p>
      </div>
    </div>
  );
}
