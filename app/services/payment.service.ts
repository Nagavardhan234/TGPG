import api from '@/app/config/axios.config';
import type { 
  PaymentSummary, 
  PaymentHistory, 
  PaymentRequest, 
  PaymentResponse 
} from './payment.types';
import { ENDPOINTS } from '../constants/endpoints';

export interface PaymentStats {
  totalRevenue: number;
  pendingPayments: number;
  monthlyRevenue: number;
  paymentDistribution: {
    paid: number;
    unpaid: number;
    overdue: number;
  };
  recentTransactions: Array<{
    id: number;
    studentName: string;
    amount: number;
    status: 'PAID' | 'PENDING' | 'FAILED';
    date: string;
  }>;
}

export interface TenantPayment {
  id: number;
  name: string;
  roomNumber: string;
  phoneNumber: string;
  totalRent: number;
  paidAmount: number;
  dueDate: string;
  status: 'PAID' | 'UNPAID' | 'PARTIALLY_PAID' | 'OVERDUE';
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
      Status: data.Status
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
      const response = await api.get(ENDPOINTS.STUDENT_PAYMENT.SUMMARY(tenantId));
      
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
      const response = await api.get(ENDPOINTS.STUDENT_PAYMENT.HISTORY(tenantId));
      return response.data;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  }

  async submitPayment(tenantId: string, payment: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await api.post(ENDPOINTS.STUDENT_PAYMENT.SUBMIT(tenantId), payment);
      
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
      const response = await api.get(`/api/students/payments/progress/${tenantId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment progress:', error);
      throw error;
    }
  }

  async getPaymentReceipt(tenantId: string, receiptNumber: string): Promise<any> {
    try {
      const response = await api.get(
        `/api/students/payments/receipt/${tenantId}/${receiptNumber}`
      );
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
      const response = await api.get(ENDPOINTS.PG_PAYMENT.STATS(pgId));
      
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to fetch payment statistics');
      }

      return this.transformPaymentStats(response.data.data);
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      throw error;
    }
  }

  private transformPaymentStats(data: any): PaymentStats {
    return {
      totalRevenue: data.totalRevenue || 0,
      pendingPayments: data.pendingPayments || 0,
      monthlyRevenue: data.monthlyRevenue || 0,
      paymentDistribution: {
        paid: data.paymentDistribution?.paid || 0,
        unpaid: data.paymentDistribution?.unpaid || 0,
        overdue: data.paymentDistribution?.overdue || 0
      },
      recentTransactions: (data.recentTransactions || []).map((transaction: any) => ({
        id: transaction.id,
        studentName: transaction.studentName,
        amount: transaction.amount,
        status: transaction.status,
        date: transaction.date
      }))
    };
  }

  async getTenantPayments(pgId: number | string): Promise<TenantPayment[]> {
    try {
      console.log('Fetching tenant payments for PG:', pgId);
      const response = await api.get(`${ENDPOINTS.PG_PAYMENT.TENANT_PAYMENTS(pgId)}`);
      
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to fetch tenant payments');
      }

      return this.transformTenantPayments(response.data.data);
    } catch (error) {
      console.error('Error fetching tenant payments:', error);
      throw error;
    }
  }

  private transformTenantPayments(data: any[]): TenantPayment[] {
    return data.map(tenant => ({
      id: tenant.id,
      name: tenant.name,
      roomNumber: tenant.roomNumber,
      phoneNumber: tenant.phoneNumber,
      totalRent: tenant.totalRent,
      paidAmount: tenant.paidAmount,
      dueDate: tenant.dueDate,
      status: this.calculatePaymentStatus(tenant.paidAmount, tenant.totalRent, tenant.dueDate)
    }));
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
}

export const paymentService = new PaymentServiceClass();