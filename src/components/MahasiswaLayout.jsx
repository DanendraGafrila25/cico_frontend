'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Komponen Sidebar untuk Mahasiswa
function Sidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname();
  
  const menuItems = [
    {
      href: '/mahasiswa/home',
      icon: '🏠',
      label: 'Dashboard',
      active: pathname === '/mahasiswa/home'
    },
    {
      href: '/mahasiswa/history',
      icon: '📋',
      label: 'Riwayat Kehadiran',
      active: pathname === '/mahasiswa/history'
    }
  ];

  return (
    <>
      {/* Overlay untuk mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white shadow-xl z-30 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 w-64
      `}>
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Menu Mahasiswa</h2>
          
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${item.active 
                    ? 'bg-blue-100 text-blue-700 shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                  }
                `}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}

// Komponen Navbar untuk Mahasiswa
function Navbar({ sidebarOpen, setSidebarOpen }) {
  const router = useRouter();
  const [studentData, setStudentData] = useState(null);

  useEffect(() => {
    // Get student data from localStorage and set up listener for updates
    const updateStudentData = () => {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          setStudentData(JSON.parse(userData));
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    };

    // Initial load
    updateStudentData();

    // Listen for storage changes (when localStorage is updated from other components)
    window.addEventListener('storage', updateStudentData);
    
    // Custom event listener for manual updates
    window.addEventListener('studentDataUpdated', updateStudentData);

    return () => {
      window.removeEventListener('storage', updateStudentData);
      window.removeEventListener('studentDataUpdated', updateStudentData);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('student_id');
    router.push('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg h-16 fixed top-0 right-0 left-0 z-50">
      <div className="flex justify-between items-center px-6 py-4 h-full">
        <div className="flex items-center space-x-4">
          {/* Menu Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200 lg:hidden"
          >
            <div className="w-5 h-5 flex flex-col justify-between">
              <span className="h-0.5 w-full bg-white rounded"></span>
              <span className="h-0.5 w-full bg-white rounded"></span>
              <span className="h-0.5 w-full bg-white rounded"></span>
            </div>
          </button>

          <div className="text-2xl font-bold text-white">
            📚 CICO Mahasiswa
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Student Info */}
          <div className="flex items-center space-x-3 bg-white bg-opacity-20 rounded-full px-4 py-2">
            <div className="w-8 h-8 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">👤</span>
            </div>
            <div className="text-sm text-white">
              <p className="font-semibold text-blue-600">{studentData?.studentName || 'Mahasiswa'}</p>
              <p className="text-blue-100 text-blue-600">
                {studentData?.nim ? `NIM: ${studentData.nim}` : ''}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 font-semibold text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

// Komponen utama MahasiswaLayout
export default function MahasiswaLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="pt-16 lg:pl-64">
        <main className="p-6 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
