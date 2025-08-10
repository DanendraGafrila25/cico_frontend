'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import SockJS from 'sockjs-client';

// Komponen Navbar
function Navbar({ toggleSidebar, isSidebarOpen, notifications, clearNotifications, connectionStatus, showNotificationDropdown, toggleNotificationDropdown }) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    router.push('/login');
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 h-16 fixed top-0 right-0 left-0 z-50">
      <div className="flex justify-between items-center px-6 py-4 h-full">
        <div className="flex items-center space-x-4">
          <button 
            onClick={toggleSidebar}
            className="p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 border-2 border-gray-300 hover:border-blue-300 bg-white shadow-sm"
          >
            {isSidebarOpen ? (
              // X icon when sidebar is open
              <div className="w-6 h-6 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            ) : (
              // Hamburger icon when sidebar is closed
              <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                <div className="w-5 h-0.5 bg-current rounded"></div>
                <div className="w-5 h-0.5 bg-current rounded"></div>
                <div className="w-5 h-0.5 bg-current rounded"></div>
              </div>
            )}
          </button>
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Admin Dashboard
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notification Bell with Badge and WebSocket Status */}
          <div className="relative notification-dropdown">
            <button 
              onClick={toggleNotificationDropdown}
              className={`p-2 rounded-full transition-all duration-200 ${
                connectionStatus === 'connected' ? 'text-green-600 hover:text-green-700 hover:bg-green-50' :
                connectionStatus === 'connecting' ? 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50' :
                'text-red-600 hover:text-red-700 hover:bg-red-50'
              }`}
              title={`${notifications.length} notifikasi baru - ${
                connectionStatus === 'connected' ? 'WebSocket Terhubung' :
                connectionStatus === 'connecting' ? 'Menghubungkan...' :
                'WebSocket Terputus'
              }`}
            >
              <div className="w-6 h-6 flex items-center justify-center relative">
                🔔
                {/* WebSocket Status Indicator */}
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                  connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}></div>
                {/* Notification Count Badge */}
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </div>
            </button>
            
            {/* Notification Dropdown */}
            {showNotificationDropdown && (
              <div className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Notifikasi Real-time</h3>
                      <p className="text-sm text-gray-600">
                        {notifications.length > 0 ? `${notifications.length} notifikasi terbaru` : 'Belum ada notifikasi'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
                        connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {connectionStatus === 'connected' ? '🟢 Online' :
                         connectionStatus === 'connecting' ? '🟡 Connecting' :
                         '🔴 Offline'}
                      </div>
                      {notifications.length > 0 && (
                        <button
                          onClick={clearNotifications}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          Hapus Semua
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {notifications.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto">
                    <div className="divide-y divide-gray-100">
                  {notifications.slice(0, 5).map((notification, index) => (
                    <div key={notification.id || index} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                            notification.type === 'CHECKIN' ? 'bg-green-100 text-green-600' : 
                            notification.type === 'CHECKOUT' ? 'bg-blue-100 text-blue-600' : 
                            notification.type === 'LATE' ? 'bg-red-100 text-red-600' : 
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {notification.type === 'CHECKIN' ? '📍' : 
                             notification.type === 'CHECKOUT' ? '🚪' : 
                             notification.type === 'LATE' ? '⏰' : '📢'}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-900">
                              {notification.type === 'CHECKIN' ? 'Check-in Mahasiswa' :
                               notification.type === 'CHECKOUT' ? 'Check-out Mahasiswa' :
                               notification.type === 'LATE' ? 'Keterlambatan' : 'Notifikasi'}
                            </p>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              notification.data?.status === 'TEPAT_WAKTU' ? 'bg-green-100 text-green-700' :
                              notification.data?.status === 'TERLAMBAT' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {notification.data?.status || notification.type}
                            </span>
                          </div>
                          
                          {/* Student Info */}
                          {notification.data && (
                            <div className="mt-1">
                              <p className="text-sm font-medium text-gray-800">
                                {notification.data.studentName}
                              </p>
                              <p className="text-xs text-gray-500">
                                NIM: {notification.data.nim}
                              </p>
                            </div>
                          )}
                          
                          {/* Time and Notes */}
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-gray-600">
                              {notification.formattedTime || notification.timestamp}
                            </p>
                            {notification.data?.notes && (
                              <p className="text-xs text-gray-500 italic">
                                "{notification.data.notes}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {notifications.length > 5 && (
                  <div className="p-3 text-center border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      dan {notifications.length - 5} notifikasi lainnya...
                    </p>
                  </div>
                )}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="text-4xl mb-2">🔔</div>
                    <p className="text-gray-500 text-sm">Belum ada notifikasi baru</p>
                    <p className="text-gray-400 text-xs mt-1">
                      Notifikasi real-time akan muncul di sini
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Profile Section - Updated to be a link */}
          <button
            onClick={() => router.push('/admin/profile')} 
            className="flex items-center space-x-3 bg-gray-50 rounded-full px-4 py-2 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">👤</span>
            </div>
            <div className="text-sm">
              <p className="font-semibold text-gray-800">Administrator</p>
              <p className="text-gray-500 text-xs">Online</p>
            </div>
          </button>
        </div>
      </div>
    </nav>
  );
}

// Komponen Sidebar
function Sidebar({ isOpen }) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    router.push('/login');
  };

  return (
    <aside className={`
      ${isOpen ? 'w-72' : 'w-16'} 
      bg-gradient-to-b from-gray-900 to-gray-800 text-white 
      flex flex-col h-screen shadow-xl fixed left-0 top-0 z-30 
      transition-all duration-300 ease-in-out overflow-hidden
    `}>
      {/* Header */}
      <div className={`p-6 border-b border-gray-700 mt-16 ${isOpen ? 'block' : 'hidden'}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mx-auto mb-3 flex items-center justify-center">
            <span className="text-2xl">⚙️</span>
          </div>
          <h2 className="text-xl font-bold text-white">Menu Admin</h2>
          <p className="text-gray-300 text-sm mt-1">Panel Kontrol</p>
        </div>
      </div>
      
      {/* Icon only header when collapsed */}
      {!isOpen && (
        <div className="p-2 border-b border-gray-700 mt-16">
          <div className="flex justify-center">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-lg">⚙️</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation Menu */}
      <nav className="flex-1 p-2 space-y-2 overflow-y-auto">
        <a 
          href="/admin/dashboard" 
          className={`flex items-center ${isOpen ? 'space-x-3 p-3' : 'justify-center p-3'} rounded-xl hover:bg-gray-700 transition-all duration-200 group`}
          title={!isOpen ? 'Dashboard' : ''}
        >
          <span className="text-lg">📊</span>
          {isOpen && <span className="font-medium group-hover:text-blue-300">Dashboard</span>}
        </a>
    
        
        <a 
          href="/admin/mahasiswa" 
          className={`flex items-center ${isOpen ? 'space-x-3 p-3' : 'justify-center p-3'} rounded-xl hover:bg-gray-700 transition-all duration-200 group`}
          title={!isOpen ? 'Kelola Mahasiswa' : ''}
        >
          <span className="text-lg">👥</span>
          {isOpen && <span className="font-medium group-hover:text-blue-300">Kelola Mahasiswa</span>}
        </a>
        
        <a 
          href="/admin/laporan" 
          className={`flex items-center ${isOpen ? 'space-x-3 p-3' : 'justify-center p-3'} rounded-xl hover:bg-gray-700 transition-all duration-200 group`}
          title={!isOpen ? 'Laporan Kehadiran' : ''}
        >
          <span className="text-lg">📈</span>
          {isOpen && <span className="font-medium group-hover:text-blue-300">Laporan Kehadiran</span>}
        </a>

        <a 
          href="/admin/manage-admins" 
          className={`flex items-center ${isOpen ? 'space-x-3 p-3' : 'justify-center p-3'} rounded-xl hover:bg-gray-700 transition-all duration-200 group`}
          title={!isOpen ? 'Kelola Admin' : ''}
        >
          <span className="text-lg">👨‍💼</span>
          {isOpen && <span className="font-medium group-hover:text-blue-300">Kelola Admin</span>}
        </a>
        
        <a 
          href="/admin/settings" 
          className={`flex items-center ${isOpen ? 'space-x-3 p-3' : 'justify-center p-3'} rounded-xl hover:bg-gray-700 transition-all duration-200 group`}
          title={!isOpen ? 'Pengaturan Sistem' : ''}
        >
          <span className="text-lg">⚙️</span>
          {isOpen && <span className="font-medium group-hover:text-blue-300">Pengaturan Sistem</span>}
        </a>
      </nav>
      
      {/* Logout Section - Bottom */}
      <div className="p-2 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${isOpen ? 'space-x-3 p-3' : 'justify-center p-3'} bg-red-600 hover:bg-red-700 rounded-xl transition-all duration-200 group`}
          title={!isOpen ? 'Logout' : ''}
        >
          <span className="text-lg">🚪</span>
          {isOpen && <span className="font-semibold">Logout</span>}
        </button>
        
        {isOpen && (
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-400">© 2025 CICO System</p>
          </div>
        )}
      </div>
    </aside>
  );
}

// Komponen utama AdminLayout yang menerima `children`
export default function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default true agar sidebar terbuka
  const [notifications, setNotifications] = useState([]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [webSocket, setWebSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setShowNotificationDropdown(false);
  };

  const toggleNotificationDropdown = () => {
    setShowNotificationDropdown(!showNotificationDropdown);
  };

  // WebSocket Connection
  useEffect(() => {
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    let reconnectTimeout = null;

    const connectWebSocket = () => {
      // Check if backend is available first
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      
      try {
        setConnectionStatus('connecting');
        
        // Create SockJS connection to match backend configuration
        const socket = new SockJS(`${backendUrl}/ws`);
        
        socket.onopen = () => {
          console.log('WebSocket connected successfully');
          setConnectionStatus('connected');
          setWebSocket(socket);
          reconnectAttempts = 0; // Reset reconnect attempts on successful connection
          
          // Request browser notification permission
          if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
          }
        };

        socket.onmessage = (event) => {
          try {
            const notification = JSON.parse(event.data);
            
            // Create formatted notification based on backend data structure
            const newNotification = {
              ...notification,
              timestamp: new Date(notification.timestamp || new Date()).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              }),
              id: Date.now() + Math.random(),
              formattedTime: new Date(notification.timestamp || new Date()).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            };

            setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep max 50 notifications

            // Create browser notification with detailed info
            if (Notification.permission === 'granted') {
              let notificationTitle = 'CICO Admin';
              let notificationBody = notification.message;
              
              // Customize notification based on type and data
              if (notification.type === 'CHECKIN' && notification.data) {
                notificationTitle = '📍 Check-in Baru';
                notificationBody = `${notification.data.studentName} (${notification.data.nim}) telah check-in pada ${new Date(notification.data.checkinTime).toLocaleTimeString('id-ID')}`;
              } else if (notification.type === 'CHECKOUT' && notification.data) {
                notificationTitle = '🚪 Check-out Baru';
                notificationBody = `${notification.data.studentName} (${notification.data.nim}) telah check-out`;
              }
              
              new Notification(notificationTitle, {
                body: notificationBody,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: `cico-${notification.type}-${notification.data?.studentId || Date.now()}`
              });
            }
          } catch (error) {
            console.error('Error parsing notification:', error);
          }
        };

        socket.onerror = (error) => {
          console.warn('WebSocket connection failed - backend may not be running');
          setConnectionStatus('disconnected');
        };

        socket.onclose = (event) => {
          setConnectionStatus('disconnected');
          setWebSocket(null);
          
          // Only auto-reconnect if user is still logged in and we haven't exceeded max attempts
          if (localStorage.getItem('jwt_token') && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff, max 30s
            
            console.log(`WebSocket disconnected. Reconnecting in ${delay/1000}s (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
            
            reconnectTimeout = setTimeout(() => {
              connectWebSocket();
            }, delay);
          } else if (reconnectAttempts >= maxReconnectAttempts) {
            console.warn('Max WebSocket reconnection attempts reached. Please check if backend is running.');
          }
        };

      } catch (error) {
        console.error('Error initializing WebSocket:', error);
        setConnectionStatus('disconnected');
      }
    };

    // Check if user is authenticated
    const token = localStorage.getItem('jwt_token');
    if (token) {
      connectWebSocket();
    }

    // Cleanup on unmount
    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (webSocket) {
        webSocket.close();
      }
    };
  }, []); // Empty dependency array for mount/unmount only

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotificationDropdown && !event.target.closest('.notification-dropdown')) {
        setShowNotificationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotificationDropdown]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar 
        toggleSidebar={toggleSidebar} 
        isSidebarOpen={isSidebarOpen}
        notifications={notifications}
        clearNotifications={clearNotifications}
        connectionStatus={connectionStatus}
        showNotificationDropdown={showNotificationDropdown}
        toggleNotificationDropdown={toggleNotificationDropdown}
      />
      <Sidebar isOpen={isSidebarOpen} />
      
      {/* Overlay untuk mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      
      <div className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'lg:ml-72' : 'lg:ml-16'}`}>
        <main className="pt-16 p-6 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
