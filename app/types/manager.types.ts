export interface Step {
  title: string;
  subtitle: string;
  icon: string;
}

export interface RoomType {
  type: string;
  count: number;
  price: string;
}

export interface PGDetails {
  name: string;
  address: string;
  amenities: string[];
  roomTypes: RoomType[];
}

export interface PaymentDetails {
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  includeCharges: boolean;
}

export interface ValidationError {
  field?: string;
  message: string;
}

export interface ValidationInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  icon?: string;
  [key: string]: any;
}
