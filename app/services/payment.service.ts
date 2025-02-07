import api from '@/app/config/axios.config';
import type { 
  PaymentSummary, 
  PaymentHistory, 
  PaymentRequest, 
  PaymentResponse 
} from './payment.types';

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
      const response = await api.get(`/api/students/payments/summary/${tenantId}`);
      
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
      const response = await api.get(`/api/students/payments/history/${tenantId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  }

  async submitPayment(tenantId: string, payment: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await api.post(`/api/students/payments/submit/${tenantId}`, payment);
      
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
}

export const PaymentService = new PaymentServiceClass();