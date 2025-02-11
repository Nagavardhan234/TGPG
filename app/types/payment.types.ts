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

export interface PaymentChartData {
  label: string;
  value: number;
  count: number;
  total: number;
  color: string;
  glowColor: string;
}

export interface PaymentDistribution {
  paid: number;
  unpaid: number;
  partiallyPaid: number;
  overdue: number;
}

export interface PaymentAnalytics {
  paymentDistribution: PaymentDistribution;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
  paidCount: number;
  unpaidCount: number;
  overdueCount: number;
  partiallyPaidCount: number;
  collectionEfficiency: number;
  earlyPaymentCount: number;
  paymentMethods: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
}

export interface PaymentAnalyticsResponse {
  success: boolean;
  data?: PaymentAnalytics;
  message?: string;
}

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
    status: 'SUCCESS' | 'PENDING' | 'FAILED';
    date: string;
  }>;
} 