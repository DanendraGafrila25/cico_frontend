'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import MahasiswaLayout from '@/components/MahasiswaLayout';
import { toast, Toaster } from 'react-hot-toast';

export default function MahasiswaHomePage() {
  const [studentData, setStudentData] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkInNotes, setCheckInNotes] = useState('');
  const [checkOutNotes, setCheckOutNotes] = useState('');
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Refs for textarea to handle input properly
  const checkInNotesRef = useRef(null);
  const checkOutNotesRef = useRef(null);
  
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('jwt_token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    // Call API to get fresh data only once when component mounts
    fetchStudentData();
  }, []); // Empty dependency array to run only once

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const response = await api.get('/api/v1/mahasiswa/profile', {
        params: {
          startdate: today,
          enddate: today
        }
      });
      
      if (response.data.statusCode === 200 && response.data.data) {
        const apiStudentData = {
          studentId: response.data.data.studentId,
          studentName: response.data.data.studentName,
          nim: response.data.data.nim
        };
        
        setStudentData(apiStudentData);
        
        localStorage.setItem('user_data', JSON.stringify(apiStudentData));
        window.dispatchEvent(new Event('studentDataUpdated'));
        
        if (response.data.data.attendanceData && response.data.data.attendanceData.length > 0) {
          const todayAttendance = response.data.data.attendanceData[0];
          setAttendanceStatus(todayAttendance);
        } else {
          setAttendanceStatus(null);
        }
      }
    } catch (error) {
      setAttendanceStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const checkTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const response = await api.get('/api/v1/mahasiswa/profile', {
        params: {
          startdate: today,
          enddate: today
        }
      });
      
      if (response.data.statusCode === 200 && response.data.data) {
        if (response.data.data.attendanceData && response.data.data.attendanceData.length > 0) {
          const todayAttendance = response.data.data.attendanceData[0];
          setAttendanceStatus(todayAttendance);
        } else {
          setAttendanceStatus(null);
        }
      }
    } catch (error) {
      setAttendanceStatus(null);
    }
  };

  const handleCheckIn = async () => {
    if (!studentData) return;
    
    setCheckingIn(true);
    try {
      const response = await api.post('/api/v1/mahasiswa/checkin', {
        notesCheckin: checkInNotes
      });
      
      if (response.data.statusCode === 200) {
        toast.success('Check-in berhasil!');
        setCheckInNotes('');
        setShowCheckInModal(false);
        // Reset textarea value
        if (checkInNotesRef.current) {
          checkInNotesRef.current.value = '';
        }
        // Refresh attendance status
        checkTodayAttendance();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Gagal melakukan check-in';
      toast.error(errorMessage);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!studentData) return;
    
    setCheckingOut(true);
    try {
      const response = await api.post('/api/v1/mahasiswa/checkout', {
        notesCheckout: checkOutNotes
      });
      
      if (response.data.statusCode === 200) {
        toast.success('Check-out berhasil!');
        setCheckOutNotes('');
        setShowCheckOutModal(false);
        // Reset textarea value
        if (checkOutNotesRef.current) {
          checkOutNotesRef.current.value = '';
        }
        // Refresh attendance status
        checkTodayAttendance();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Gagal melakukan check-out';
      toast.error(errorMessage);
    } finally {
      setCheckingOut(false);
    }
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

  const getCurrentTime = () => {
    return currentTime.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getCurrentDate = () => {
    return currentTime.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status, isLate) => {
    if (status === 'HADIR' || status === 'TEPAT_WAKTU') {
      return (
        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
          isLate ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
        }`}>
          {isLate ? 'Hadir (Terlambat)' : 'Hadir Tepat Waktu'}
        </span>
      );
    } else if (status === 'TERLAMBAT') {
      return (
        <span className="px-4 py-2 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
          Terlambat
        </span>
      );
    }
    return (
      <span className="px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-800">
        Belum Check-in
      </span>
    );
  };

  // Event handlers with uncontrolled component approach to prevent input reversal
  const handleCheckInNotesChange = useCallback((e) => {
    const value = e.target.value;
    setCheckInNotes(value);
    // Also update the ref value to ensure consistency
    if (checkInNotesRef.current) {
      checkInNotesRef.current.value = value;
    }
  }, []);

  const handleCheckOutNotesChange = useCallback((e) => {
    const value = e.target.value;
    setCheckOutNotes(value);
    // Also update the ref value to ensure consistency
    if (checkOutNotesRef.current) {
      checkOutNotesRef.current.value = value;
    }
  }, []);

  const handleCloseCheckInModal = useCallback(() => {
    setShowCheckInModal(false);
    setCheckInNotes('');
    // Reset textarea value
    if (checkInNotesRef.current) {
      checkInNotesRef.current.value = '';
    }
  }, []);

  const handleCloseCheckOutModal = useCallback(() => {
    setShowCheckOutModal(false);
    setCheckOutNotes('');
    // Reset textarea value
    if (checkOutNotesRef.current) {
      checkOutNotesRef.current.value = '';
    }
  }, []);

  // Modal Component for Check-in
  const CheckInModal = () => {
    if (!showCheckInModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">📍 Check-in Hari Ini</h3>
          <p className="text-gray-700 mb-6 text-lg">
            Silakan masukkan catatan untuk check-in hari ini (opsional):
          </p>
          
          <textarea
            ref={checkInNotesRef}
            defaultValue={checkInNotes}
            onChange={handleCheckInNotesChange}
            placeholder="Contoh: Hari ini saya akan mengerjakan tugas project web development dan melakukan pembelajaran tentang React.js..."
            className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 mb-8 text-gray-800 text-base leading-relaxed resize-none"
            rows="6"
            autoFocus
            style={{ 
              minHeight: '120px',
              fontSize: '16px',
              lineHeight: '1.5'
            }}
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            dir="ltr"
            key={`checkin-${showCheckInModal}`}
          />
          
          <div className="flex space-x-4">
            <button
              onClick={handleCloseCheckInModal}
              className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-lg"
            >
              Batal
            </button>
            <button
              onClick={handleCheckIn}
              disabled={checkingIn}
              className="flex-1 px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 text-lg"
            >
              {checkingIn ? 'Memproses...' : 'Check-in Sekarang'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Modal Component for Check-out
  const CheckOutModal = () => {
    if (!showCheckOutModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">🚪 Check-out Hari Ini</h3>
          <p className="text-gray-700 mb-6 text-lg">
            Silakan masukkan catatan untuk check-out hari ini (opsional):
          </p>
          
          <textarea
            ref={checkOutNotesRef}
            defaultValue={checkOutNotes}
            onChange={handleCheckOutNotesChange}
            placeholder="Contoh: Hari ini saya telah menyelesaikan tugas project web development, mempelajari konsep React hooks, dan melakukan testing pada aplikasi..."
            className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 mb-8 text-gray-800 text-base leading-relaxed resize-none"
            rows="6"
            autoFocus
            style={{ 
              minHeight: '120px',
              fontSize: '16px',
              lineHeight: '1.5'
            }}
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            dir="ltr"
            key={`checkout-${showCheckOutModal}`}
          />
          
          <div className="flex space-x-4">
            <button
              onClick={handleCloseCheckOutModal}
              className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-lg"
            >
              Batal
            </button>
            <button
              onClick={handleCheckOut}
              disabled={checkingOut}
              className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 text-lg"
            >
              {checkingOut ? 'Memproses...' : 'Check-out Sekarang'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <MahasiswaLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-xl font-semibold text-gray-700">Memuat data...</p>
          </div>
        </div>
      </MahasiswaLayout>
    );
  }

  return (
    <MahasiswaLayout>
      <Toaster position="top-right" />
      <CheckInModal />
      <CheckOutModal />
      
      {/* Header Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 shadow-xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2 text-white">Dashboard Mahasiswa</h1>
            <p className="text-white text-lg mb-4">{studentData?.studentName || studentData?.name || 'Mahasiswa'}</p>
            <div className="bg-white bg-opacity-30 rounded-xl p-4 inline-block border border-white border-opacity-30">
              <p className="text-xl font-semibold text-black drop-shadow-lg">{getCurrentDate()}</p>
              <p className="text-3xl font-bold text-black ">{getCurrentTime()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">👤 Informasi Profil</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-2xl mb-2">🎓</div>
              <p className="text-sm text-gray-600">NIM</p>
              <p className="text-lg font-bold text-blue-600">{studentData?.nim || '-'}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-2xl mb-2">📝</div>
              <p className="text-sm text-gray-600">Nama</p>
              <p className="text-lg font-bold text-green-600">{studentData?.studentName || '-'}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <div className="text-2xl mb-2">📱</div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-lg font-bold text-purple-600">Aktif</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Status Today */}
      <div className="mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Status Kehadiran Hari Ini</h3>
          
          {attendanceStatus ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-700">Status:</span>
                {getStatusBadge(attendanceStatus.status, attendanceStatus.late)}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="text-center">
                    <div className="text-2xl mb-2">✅</div>
                    <p className="text-sm text-gray-600">Check-in</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatTime(attendanceStatus.checkinTime)}
                    </p>
                    {attendanceStatus.notesCheckin && (
                      <p className="text-xs text-gray-500 mt-2">"{attendanceStatus.notesCheckin}"</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="text-center">
                    <div className="text-2xl mb-2">🚪</div>
                    <p className="text-sm text-gray-600">Check-out</p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatTime(attendanceStatus.checkoutTime)}
                    </p>
                    {attendanceStatus.notesCheckout && (
                      <p className="text-xs text-gray-500 mt-2">"{attendanceStatus.notesCheckout}"</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-xl text-gray-700 mb-2">Belum ada kehadiran hari ini</p>
              <p className="text-gray-600">Silakan lakukan check-in terlebih dahulu</p>
            </div>
          )}
        </div>
      </div>

      {/* Check-in/Check-out Actions */}
      <div className="mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">🎯 Aksi Kehadiran</h3>
          
          {attendanceStatus ? (
            attendanceStatus.checkinTime && attendanceStatus.checkoutTime ? (
              // Both check-in and check-out completed
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✅</div>
                <p className="text-xl text-green-700 font-semibold mb-2">Kehadiran hari ini sudah selesai</p>
                <p className="text-gray-600">Terima kasih atas dedikasi Anda hari ini!</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="text-center">
                      <div className="text-2xl mb-2">✅</div>
                      <p className="text-sm text-gray-600">Check-in</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatTime(attendanceStatus.checkinTime)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="text-center">
                      <div className="text-2xl mb-2">🚪</div>
                      <p className="text-sm text-gray-600">Check-out</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatTime(attendanceStatus.checkoutTime)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : attendanceStatus.checkinTime && !attendanceStatus.checkoutTime ? (
              // Only check-in completed, show check-out button
              <div className="text-center">
                <div className="text-6xl mb-4">⏰</div>
                <p className="text-xl text-blue-700 font-semibold mb-2">Sudah Check-in</p>
                <p className="text-gray-600 mb-6">Check-in pada: {formatTime(attendanceStatus.checkinTime)}</p>
                
                <button
                  onClick={() => setShowCheckOutModal(true)}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🚪</span>
                    <span>Check-out Sekarang</span>
                  </div>
                </button>
              </div>
            ) : null
          ) : (
            // No attendance record, show check-in button
            <div className="text-center">
              <div className="text-6xl mb-4">📍</div>
              <p className="text-xl text-gray-800 font-semibold mb-2">Belum Check-in Hari Ini</p>
              <p className="text-gray-600 mb-6">Silakan lakukan check-in untuk memulai hari kerja Anda</p>
              
              <button
                onClick={() => setShowCheckInModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold text-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">📍</span>
                  <span>Check-in Sekarang</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

     
    </MahasiswaLayout>
  );
}
