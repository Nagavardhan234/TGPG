type PaymentMethod = 'UPI' | 'BANK_TRANSFER' | 'CASH';

export const validateTransactionId = (method: PaymentMethod, transactionId: string): boolean => {
  if (!transactionId) return false;
  
  switch (method) {
    case 'UPI':
      // Must be UTR- followed by 10-16 alphanumeric characters
      return /^UTR-[A-Za-z0-9]{10,16}$/i.test(transactionId);
    case 'BANK_TRANSFER':
      // Must be BANK- followed by 10-18 alphanumeric characters
      return /^BANK-[A-Za-z0-9]{10,18}$/i.test(transactionId);
    default:
      return true; // For CASH, no validation needed
  }
};

export const validateAmount = (amount: string): boolean => {
  const numAmount = parseFloat(amount);
  return !isNaN(numAmount) && numAmount > 0;
};

export const validatePaymentInput = (
  method: PaymentMethod,
  amount: string,
  transactionId?: string
): { isValid: boolean; error?: string } => {
  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    return {
      isValid: false,
      error: 'Please enter a valid amount greater than 0'
    };
  }

  if ((method === 'UPI' || method === 'BANK_TRANSFER') && !transactionId) {
    return {
      isValid: false,
      error: `Transaction ID is required for ${method} payments`
    };
  }

  if (transactionId && !validateTransactionId(method, transactionId)) {
    const format = method === 'UPI' 
      ? 'UTR- followed by 10-16 alphanumeric characters (e.g., UTR-1234567890ABC)'
      : 'BANK- followed by 10-18 alphanumeric characters';
    
    return {
      isValid: false,
      error: `Invalid ${method} transaction ID format. Must be ${format}`
    };
  }

  return { isValid: true };
}; 