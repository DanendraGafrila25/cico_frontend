'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('MAHASISWA');
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      let endpoint = '';
      let redirectPath = '';

      if (selectedRole === 'ADMIN') {
        endpoint = '/api/v1/admin/login';
        redirectPath = '/admin/dashboard';
      } else if (selectedRole === 'MAHASISWA') {
        endpoint = '/api/v1/mahasiswa/login';
        redirectPath = '/mahasiswa/home';
      }

      const response = await api.post(endpoint, {
        email,
        password,
      });

      const { token, ...userData } = response.data.data;
      
      // Simpan token dan user data ke localStorage
      localStorage.setItem('jwt_token', token);
      localStorage.setItem('user_data', JSON.stringify(userData));
      
      router.push(redirectPath);
    } catch (err) {
      console.error('Login failed:', err.response ? err.response.data : err.message);
      const errorMessage = err.response?.data?.message || 'Login gagal. Periksa kembali email dan password Anda.';
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Selamat Datang</h1>
          <p className="text-gray-600">Silakan login untuk melanjutkan</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Role Selection */}
          <div className="mb-8">
            <p className="text-sm font-medium text-gray-700 mb-4 text-center">Pilih Role</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole('MAHASISWA')}
                className={`py-3 px-4 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  selectedRole === 'MAHASISWA'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
                }`}
              >
                Mahasiswa
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('ADMIN')}
                className={`py-3 px-4 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  selectedRole === 'ADMIN'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
                }`}
              >
                Admin
              </button>
            </div>
          </div>
          
          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
                <div className="font-medium">Login Gagal</div>
                <div className="mt-1">{error}</div>
              </div>
            )}
            
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Alamat Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="contoh@email.com"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white text-gray-900 placeholder-gray-500"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Kata Sandi
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Masukkan kata sandi"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full py-3 px-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              Masuk
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Sistem Check-in Check-out
          </p>
        </div>
      </div>
    </div>
  );
}
