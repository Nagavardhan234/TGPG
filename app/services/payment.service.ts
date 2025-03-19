import api from '@/app/config/axios.config';
import type { 
  PaymentSummary, 
  PaymentHistory, 
  PaymentRequest, 
  PaymentResponse,
  PaymentStats
} from './payment.types';
import { ENDPOINTS } from '../constants/endpoints';

export interface TenantPayment {
  id: number;
  name: string;
  roomNumber: string;
  phoneNumber: string;
  totalDue: number;
  totalPaid: number;
  currentMonthPaid: number;
  monthlyRent: number;
  monthsElapsed: number;
  status: 'PAID' | 'UNPAID' | 'PARTIALLY_PAID' | 'OVERDUE';
  dueDate: string;
  overdueMonths: number;
  joinedDate: string;
}

export interface PaymentStats {
  totalRevenue: number;
  pendingPayments: number;
  monthlyRevenue: number;
  paymentDistribution: {
    paid: number;
    unpaid: number;
    partiallyPaid: number;
    overdue: number;
    total: number;
  };
  recentTransactions: Array<{
    id: number;
    tenantId: number;
    tenantName: string;
    amount: number;
    date: string;
    status: string;
  }>;
  tenantPayments: Array<{
    id: number;
    name: string;
    roomNumber: string;
    phoneNumber: string;
    totalDue: number;
    totalPaid: number;
    currentMonthPaid: number;
    monthlyRent: number;
    monthsElapsed: number;
    status: 'PAID' | 'UNPAID' | 'PARTIALLY_PAID' | 'OVERDUE';
    dueDate: string;
    overdueMonths: number;
    joinedDate: string;
  }>;
  totalCount: number;
}

export interface TenantPaymentHistory {
  totalExpected: number;
  totalPaid: number;
  totalDue: number;
  monthsElapsed: number;
  monthlyRent: number;
  monthlyPayments: Array<{
    month: string;
    year: number;
    monthlyRent: number;
    amountPaid: number;
    dueAmount: number;
    status: 'PAID' | 'UNPAID' | 'PARTIALLY_PAID' | 'OVERDUE';
    dueDate: string;
  }>;
}

class PaymentServiceClass {
  private validatePaymentSummary(data: any): data is PaymentSummary {
    if (!data) return false;
    
    // Check if data is wrapped in a success/data structure
    if (data.success && data.data) {
      data = data.data;
    }
    
    // Convert string values to numbers if needed
    const summary = {
      TotalRent: typeof data.TotalRent === 'string' ? parseFloat(data.TotalRent) : data.TotalRent,
      AmountPaid: typeof data.AmountPaid === 'string' ? parseFloat(data.AmountPaid) : data.AmountPaid,
      DaysUntilDue: typeof data.DaysUntilDue === 'string' ? parseInt(data.DaysUntilDue) : data.DaysUntilDue,
      LastPaymentDate: data.LastPaymentDate,
      Status: data.Status || 'PENDING'
    };
    
    // Validate the converted values
    if (typeof summary.TotalRent !== 'number' || isNaN(summary.TotalRent)) return false;
    if (typeof summary.AmountPaid !== 'number' || isNaN(summary.AmountPaid)) return false;
    if (typeof summary.DaysUntilDue !== 'number' || isNaN(summary.DaysUntilDue)) return false;
    if (typeof summary.Status !== 'string') return false;
    
    // Update the data object with converted values
    Object.assign(data, summary);
    
    return true;
  }

  async getPaymentSummary(tenantId: string): Promise<PaymentSummary> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    try {
      console.log('Fetching payment summary for tenant:', tenantId);
      const endpoint = ENDPOINTS.STUDENT_PAYMENT.SUMMARY(tenantId);
      const response = await api.get(endpoint);
      
      if (!this.validatePaymentSummary(response.data)) {
        console.error('Invalid data structure:', response.data);
        throw new Error('Invalid payment summary data received from server');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching payment summary:', error);
      throw error;
    }
  }

  async getPaymentHistory(tenantId: string): Promise<PaymentHistory[]> {
    try {
      const endpoint = ENDPOINTS.STUDENT_PAYMENT.HISTORY(tenantId);
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  }

  async submitPayment(tenantId: string, payment: PaymentRequest): Promise<PaymentResponse> {
    try {
      const endpoint = ENDPOINTS.STUDENT_PAYMENT.SUBMIT(tenantId);
      const response = await api.post(endpoint, payment);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Payment failed');
      }

      return response.data;
    } catch (error) {
      console.error('Error submitting payment:', error);
      throw error;
    }
  }

  async getPaymentProgress(tenantId: string): Promise<any> {
    try {
      const endpoint = ENDPOINTS.STUDENT_PAYMENT.PROGRESS(tenantId);
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment progress:', error);
      throw error;
    }
  }

  async getPaymentReceipt(tenantId: string, receiptNumber: string): Promise<any> {
    try {
      const endpoint = ENDPOINTS.STUDENT_PAYMENT.RECEIPT(tenantId, receiptNumber);
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment receipt:', error);
      throw error;
    }
  }

  static validateTransactionId(transactionId: string, method: 'UPI' | 'BANK_TRANSFER'): boolean {
    switch (method) {
      case 'UPI':
        // Must be UTR- followed by 10-16 alphanumeric characters
        return /^UTR-[A-Za-z0-9]{10,16}$/i.test(transactionId);
      case 'BANK_TRANSFER':
        // Must be BANK- followed by 10-18 alphanumeric characters
        return /^BANK-[A-Za-z0-9]{10,18}$/i.test(transactionId);
      default:
        return false;
    }
  }

  async getPaymentStats(pgId: number | string): Promise<PaymentStats> {
    try {
      console.log('Fetching payment stats for PG:', pgId);
      const endpoint = ENDPOINTS.PG_PAYMENT.STATS(pgId);
      const response = await api.get(endpoint);
      const data = response.data;

      if (!data || !data.success) {
        throw new Error(data?.message || 'Failed to fetch payment stats');
      }

      const stats = data.data || {};
      return {
        totalRevenue: stats.totalRevenue || 0,
        pendingPayments: stats.pendingPayments || 0,
        monthlyRevenue: stats.monthlyRevenue || 0,
        paymentDistribution: {
          paid: stats.paymentDistribution?.paid || 0,
          unpaid: stats.paymentDistribution?.unpaid || 0,
          partiallyPaid: stats.paymentDistribution?.partiallyPaid || 0,
          overdue: stats.paymentDistribution?.overdue || 0,
          total: stats.paymentDistribution?.total || 0,
        },
        recentTransactions: stats.recentTransactions?.map((transaction: any) => ({
          id: transaction.id,
          tenantId: transaction.tenantId,
          tenantName: transaction.tenantName,
          amount: transaction.amount,
          date: transaction.date,
          status: transaction.status,
        })) || [],
        tenantPayments: stats.tenantPayments?.map((tenant: any) => ({
          id: tenant.id,
          name: tenant.name,
          roomNumber: tenant.roomNumber,
          phoneNumber: tenant.phoneNumber,
          totalDue: tenant.totalDue,
          totalPaid: tenant.totalPaid,
          currentMonthPaid: tenant.currentMonthPaid,
          monthlyRent: tenant.monthlyRent,
          monthsElapsed: tenant.monthsElapsed,
          status: tenant.status,
          dueDate: tenant.dueDate,
          overdueMonths: tenant.overdueMonths,
          joinedDate: tenant.joinedDate,
        })) || [],
        totalCount: stats.totalCount || 0,
      };
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      throw error;
    }
  }

  private transformTenantPayments(data: any[]): TenantPayment[] {
    return data.map(tenant => ({
      id: tenant.id,
      name: tenant.name,
      roomNumber: tenant.roomNumber,
      phoneNumber: tenant.phoneNumber,
      totalDue: tenant.totalDue || 0,
      totalPaid: tenant.totalPaid || 0,
      currentMonthPaid: tenant.currentMonthPaid || 0,
      monthlyRent: tenant.monthlyRent || 0,
      monthsElapsed: tenant.monthsElapsed || 0,
      status: tenant.status || 'UNPAID',
      dueDate: tenant.dueDate,
      overdueMonths: tenant.overdueMonths || 0,
      joinedDate: tenant.joinedDate
    }));
  }

  async getTenantPayments(pgId: number | string): Promise<TenantPayment[]> {
    try {
      console.log('Fetching tenant payments for PG:', pgId);
      const response = await api.get(`${ENDPOINTS.PG_PAYMENT.STATS(pgId)}`);
      
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to fetch tenant payments');
      }

      return this.transformTenantPayments(response.data.data.tenantPayments || []);
    } catch (error) {
      console.error('Error fetching tenant payments:', error);
      throw error;
    }
  }

  private calculatePaymentStatus(paid: number, total: number, dueDate: string): TenantPayment['status'] {
    const isDueExpired = new Date(dueDate) < new Date();
    
    if (paid >= total) return 'PAID';
    if (paid === 0 && isDueExpired) return 'OVERDUE';
    if (paid === 0) return 'UNPAID';
    if (paid < total) return isDueExpired ? 'OVERDUE' : 'PARTIALLY_PAID';
    
    return 'UNPAID';
  }

  async sendPaymentReminder(tenantId: number): Promise<void> {
    try {
      await api.post(`${ENDPOINTS.PG_PAYMENT.SEND_REMINDER}/${tenantId}`);
    } catch (error) {
      console.error('Error sending payment reminder:', error);
      throw error;
    }
  }

  async getTenantPaymentHistory(tenantId: string): Promise<TenantPaymentHistory> {
    try {
      console.log('Fetching tenant payment history:', tenantId);
      const endpoint = ENDPOINTS.PG_PAYMENT.TENANT_HISTORY(tenantId);
      const response = await api.get(endpoint);
      
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to fetch tenant payment history');
      }

      const data = response.data.data;
      return {
        totalExpected: data.totalExpected || 0,
        totalPaid: data.totalPaid || 0,
        totalDue: data.totalDue || 0,
        monthsElapsed: data.monthsElapsed || 0,
        monthlyRent: data.monthlyRent || 0,
        monthlyPayments: Array.isArray(data.monthlyPayments) ? data.monthlyPayments : []
      };
    } catch (error) {
      console.error('Error fetching tenant payment history:', error);
      throw error;
    }
  }
}

export const paymentService = new PaymentServiceClass();