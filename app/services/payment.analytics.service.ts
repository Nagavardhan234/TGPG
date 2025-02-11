import api from '@/app/config/axios.config';
import { ENDPOINTS } from '@/app/constants/endpoints';
import { PaymentAnalytics, PaymentChartData, PaymentAnalyticsResponse } from '@/app/types/payment.types';
import Color from 'color';

class PaymentAnalyticsService {
  private readonly colors = {
    paid: '#4CAF50',    // Green
    unpaid: '#FFA726',  // Orange
    overdue: '#F44336'  // Red
  };

  async getAnalytics(pgId: string | number): Promise<PaymentAnalytics> {
    try {
      console.log('Fetching payment analytics for PG:', pgId);
      const response = await api.get<PaymentAnalyticsResponse>(ENDPOINTS.PG_PAYMENT.STATS(pgId));
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch payment analytics');
      }

      // Transform the data to match the expected format
      const data = response.data.data;
      return {
        paymentDistribution: {
          paid: data.paymentDistribution?.paid || 0,
          unpaid: data.paymentDistribution?.unpaid || 0,
          partiallyPaid: data.paymentDistribution?.partiallyPaid || 0,
          overdue: data.paymentDistribution?.overdue || 0
        },
        totalRevenue: data.totalRevenue || 0,
        monthlyRevenue: data.monthlyRevenue || 0,
        pendingPayments: data.pendingPayments || 0,
        paidCount: data.paymentDistribution?.paid || 0,
        unpaidCount: data.paymentDistribution?.unpaid || 0,
        overdueCount: data.paymentDistribution?.overdue || 0,
        partiallyPaidCount: data.paymentDistribution?.partiallyPaid || 0,
        collectionEfficiency: data.collectionEfficiency || 0,
        earlyPaymentCount: data.earlyPaymentCount || 0,
        paymentMethods: data.paymentMethods || []
      };
    } catch (error) {
      console.error('Error fetching payment analytics:', error);
      throw error;
    }
  }

  transformToChartData(analytics: PaymentAnalytics): PaymentChartData[] {
    if (!analytics || !analytics.paymentDistribution) {
      return [];
    }

    const distribution = analytics.paymentDistribution;
    const total = (distribution.paid || 0) + 
                  (distribution.unpaid || 0) + 
                  (distribution.partiallyPaid || 0) + 
                  (distribution.overdue || 0);

    return [
      {
        label: 'Paid',
        value: distribution.paid || 0,
        count: distribution.paid || 0,
        total: total,
        color: '#4CAF50',
        glowColor: Color('#4CAF50').alpha(0.4).toString()
      },
      {
        label: 'Partially Paid',
        value: distribution.partiallyPaid || 0,
        count: distribution.partiallyPaid || 0,
        total: total,
        color: '#42A5F5',
        glowColor: Color('#42A5F5').alpha(0.4).toString()
      },
      {
        label: 'Unpaid',
        value: distribution.unpaid || 0,
        count: distribution.unpaid || 0,
        total: total,
        color: '#FFA726',
        glowColor: Color('#FFA726').alpha(0.4).toString()
      },
      {
        label: 'Overdue',
        value: distribution.overdue || 0,
        count: distribution.overdue || 0,
        total: total,
        color: '#F44336',
        glowColor: Color('#F44336').alpha(0.4).toString()
      }
    ];
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getCollectionEfficiency(analytics: PaymentAnalytics): string {
    return `${(analytics.collectionEfficiency * 100).toFixed(1)}%`;
  }

  getEarlyPaymentStats(analytics: PaymentAnalytics): {
    count: number;
    percentage: string;
  } {
    const percentage = (analytics.earlyPaymentCount / analytics.paidCount) * 100;
    return {
      count: analytics.earlyPaymentCount,
      percentage: `${percentage.toFixed(1)}%`
    };
  }

  getMonthlyTrendData(analytics: PaymentAnalytics) {
    return analytics.monthlyTrend.map(month => ({
      month: month.month,
      total: month.paid + month.unpaid + month.overdue,
      paid: month.paid,
      unpaid: month.unpaid,
      overdue: month.overdue,
      paidPercentage: (month.paid / (month.paid + month.unpaid + month.overdue)) * 100
    }));
  }

  getPaymentMethodDistribution(analytics: PaymentAnalytics): {
    labels: string[];
    data: number[];
    colors: string[];
  } {
    const methods = Object.entries(analytics.paymentMethods);
    return {
      labels: methods.map(([method]) => method),
      data: methods.map(([_, value]) => value),
      colors: methods.map(() => Color(this.colors.paid).rotate(Math.random() * 360).hex())
    };
  }
}

export const paymentAnalyticsService = new PaymentAnalyticsService(); 