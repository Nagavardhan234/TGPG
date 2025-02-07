export type PaymentMethod = 'UPI' | 'BANK_TRANSFER' | 'CASH';

export interface PaymentSummary {
  TotalRent: number;
  AmountPaid: number;
  DaysUntilDue: number;
  LastPaymentDate?: string;
  Status: 'PAID' | 'PENDING' | 'OVERDUE';
}

export interface PaymentHistory {
  id: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  transactionId?: string;
}

export interface PaymentRequest {
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    amount: number;
    date: string;
    status: string;
  };
}