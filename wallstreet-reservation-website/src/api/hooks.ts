import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================

export interface TimeSlot {
  time: string;
  displayTime: string;
  rate: number;
  available: boolean;
  period: 'morning' | 'evening';
}

export interface BookingForm {
  name: string;
  email: string;
  contact: string;
  date: string;
  timeSlot: {
    time: string;
    displayTime: string;
    rate: number;
    period: 'morning' | 'evening';
  };
}

export interface Booking {
  transactions: any;
  id: string;
  customerName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  duration: string;
  paymentMethod: string;
  totalAmount: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt: string;
}

export interface BookingStats {
  totalBookings: number;
  todayBookings: number;
  totalRevenue: number;
  pendingBookings: number;
}

// ============================================
// Auth Hooks
// ============================================

export function useLogin() {
  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const { data } = await apiClient.post('/auth/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('isAdminLoggedIn', 'true');
      localStorage.setItem('adminSession', JSON.stringify({
        username: data.user.username,
        loginTime: new Date().toISOString()
      }));
      toast.success('Login successful!');
      return;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Login failed');
      return;
    }
  });
}

// ============================================
// Booking Hooks
// ============================================

export function useAvailableSlots(date: string | undefined) {
  return useQuery({
    queryKey: ['slots', date],
    queryFn: async () => {
      if (!date) return [];
      const { data } = await apiClient.get<TimeSlot[]>(`/bookings/slots?date=${date}`);
      return data;
    },
    enabled: !!date, // Only run if date is provided
  });
}

export function useCreateBooking() {
  return useMutation({
    mutationFn: async (bookingData: BookingForm) => {
      const { data } = await apiClient.post('/bookings', bookingData);
      return data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create booking');
      return;
    }
  });
}

export function useInitiatePayment() {
  return useMutation({
    mutationFn: async (paymentData: { amount: number; booking: BookingForm }) => {
      const { data } = await apiClient.post('/payments/initiate', paymentData);
      return data;
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, '_blank', 'noopener,noreferrer');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Payment initiation failed');
    }
  });
}

// ============================================
// Admin Hooks
// ============================================

export function useBookings() {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const { data } = await apiClient.get<Booking[]>('/bookings');
      return data;
    },
  });
}

export function useBookingStats() {
  return useQuery({
    queryKey: ['bookingStats'],
    queryFn: async () => {
      const { data } = await apiClient.get<BookingStats>('/bookings/stats');
      return data;
    },
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'confirmed' | 'cancelled' }) => {
      const { data } = await apiClient.patch(`/bookings/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookingStats'] });
      toast.success('Booking status updated!');
      return;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update booking');
      return;
    }
  });
}

export function useDeleteBooking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/bookings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookingStats'] });
      toast.success('Booking deleted!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete booking');
    }
  });
}

// ============================================
// Payment Confirmation (Admin)
// ============================================

export function useConfirmPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId: string) => {
      const { data } = await apiClient.post(`/payments/${transactionId}/confirm`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookingStats'] });
      toast.success('Payment confirmed and email sent!');
      return;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to confirm payment');
      return;
    }
  });
}

export function useDownloadReceipt() {
  return useMutation({
    mutationFn: async (transactionId: string) => {
      const response = await apiClient.get(`/payments/${transactionId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    },
    onSuccess: (blob, transactionId) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt_${transactionId}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Receipt downloaded!');
      return;
    },
    onError: (error: any) => {
      toast.error('Failed to download receipt');
      return;
    }
  });
}

export function useDeleteReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId: string) => {
      await apiClient.delete(`/payments/${transactionId}/delete-receipt`);
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Receipt deleted!');
      return;
    },
    onError: (error: any) => {
      toast.error('Failed to delete receipt');
      return;
    }
  });
}