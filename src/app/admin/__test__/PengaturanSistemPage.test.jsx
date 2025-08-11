import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// MOCK SEMUA DEPENDENCIES DENGAN PATH RELATIF
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock api dengan path relatif
jest.mock('../../../lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock AdminLayout dengan path relatif
jest.mock('../../../components/AdminLayout', () => {
  return function MockAdminLayout({ children }) {
    return (
      <div data-testid="admin-layout">
        {children}
      </div>
    );
  };
});

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
  Toaster: () => <div data-testid="toaster" />,
}));

// Import setelah mock - SEMUANYA PAKAI PATH RELATIF
import { useRouter } from 'next/navigation';
import PengaturanSistemPage from '../settings/page';
import api from '../../../lib/api';
import { toast } from 'react-hot-toast';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('PengaturanSistemPage', () => {
  const mockRouterPush = jest.fn();

  beforeEach(() => {
    useRouter.mockReturnValue({
      push: mockRouterPush,
    });
    
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should redirect to login when no token is present', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      render(<PengaturanSistemPage />);
      
      expect(mockRouterPush).toHaveBeenCalledWith('/admin/login');
    });

    it('should fetch settings when token is present', async () => {
      localStorageMock.getItem.mockReturnValue('mock-token');
      
      api.get.mockResolvedValueOnce({
        data: {
          statusCode: 200,
          data: {
            defaultCheckInTime: '08:00',
            defaultCheckOutTime: '17:00',
            checkInLateToleranceMinutes: '15'
          }
        }
      });

      render(<PengaturanSistemPage />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/system-settings');
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state while fetching settings', () => {
      localStorageMock.getItem.mockReturnValue('mock-token');
      
      api.get.mockImplementation(() => new Promise(() => {}));

      render(<PengaturanSistemPage />);

      expect(screen.getByText('Memuat pengaturan sistem...')).toBeInTheDocument();
    });
  });

  describe('Settings Form', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue('mock-token');
    });

    it('should render form with loaded data', async () => {
      api.get.mockResolvedValue({
        data: {
          statusCode: 200,
          data: {
            defaultCheckInTime: '08:00',
            defaultCheckOutTime: '17:00',
            checkInLateToleranceMinutes: '15'
          }
        }
      });

      render(<PengaturanSistemPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('08:00')).toBeInTheDocument();
        expect(screen.getByDisplayValue('17:00')).toBeInTheDocument();
        expect(screen.getByDisplayValue('15')).toBeInTheDocument();
      });
    });

    it('should handle form submission successfully', async () => {
      api.get.mockResolvedValue({
        data: {
          statusCode: 200,
          data: {
            defaultCheckInTime: '08:00',
            defaultCheckOutTime: '17:00',
            checkInLateToleranceMinutes: '15'
          }
        }
      });

      api.put.mockResolvedValue({
        data: { statusCode: 200 }
      });

      render(<PengaturanSistemPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('08:00')).toBeInTheDocument();
      });

      const checkinInput = screen.getByDisplayValue('08:00');
      fireEvent.change(checkinInput, { target: { value: '09:00' } });

      const submitButton = screen.getByText('Simpan Pengaturan');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/api/v1/admin/system-settings', {
          defaultCheckInTime: '09:00',
          defaultCheckOutTime: '17:00',
          checkInLateToleranceMinutes: '15'
        });
      });

      expect(toast.success).toHaveBeenCalledWith('Pengaturan sistem berhasil diperbarui');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue('mock-token');
    });

    it('should handle API fetch error', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      render(<PengaturanSistemPage />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Gagal memuat pengaturan sistem');
      });
    });

    it('should handle submit error with custom message', async () => {
      api.get.mockResolvedValue({
        data: {
          statusCode: 200,
          data: {
            defaultCheckInTime: '08:00',
            defaultCheckOutTime: '17:00',
            checkInLateToleranceMinutes: '15'
          }
        }
      });

      api.put.mockRejectedValue({
        response: {
          data: { message: 'Server error' }
        }
      });

      render(<PengaturanSistemPage />);

      await waitFor(() => {
        expect(screen.getByText('Simpan Pengaturan')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Simpan Pengaturan');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Server error');
      });
    });

    it('should handle 401 unauthorized error', async () => {
      api.get.mockRejectedValue({
        response: { status: 401 }
      });

      render(<PengaturanSistemPage />);

      await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith('/admin/login');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('jwt_token');
      });
    });
  });
});