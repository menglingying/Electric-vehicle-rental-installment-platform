import { http } from './http';

export type Product = {
  id: string;
  name: string;
  coverUrl: string;
  images?: string[];
  rentPerCycle: number;
  tags: string[];
  frameConfig?: string;
  batteryConfig?: string;
  rentWithoutBattery?: number;
  rentWithBattery?: number;
};

export type Order = {
  id: string;
  status:
    | 'PENDING_REVIEW'
    | 'ACTIVE'
    | 'DELIVERED'
    | 'IN_USE'
    | 'RETURNED'
    | 'REJECTED'
    | 'CLOSED'
    | 'SETTLED';
  productId: string;
  productName: string;
  periods: number;
  cycleDays: number;
  depositRatio: number;
  batteryOption?: string;
  repaymentMethod?: string;
  kycCompleted?: boolean;
  createdAt: string;
};

export type Contract = {
  id: string;
  orderId: string;
  status: 'SIGNING' | 'SIGNED' | 'FAILED';
  signUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type PaymentIntent = {
  id: string;
  orderId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  cashierUrl: string;
  createdAt: string;
  updatedAt: string;
};

export async function requestLoginCode(phone: string) {
  return http.post('/h5/auth/request-code', { phone });
}

export async function login(phone: string, code: string) {
  const { data } = await http.post('/h5/auth/login', { phone, code });
  return data as { token: string };
}

export async function listProducts() {
  const { data } = await http.get('/h5/products');
  return data as Product[];
}

export async function getProduct(id: string) {
  const { data } = await http.get(`/h5/products/${id}`);
  return data as Product;
}

export async function createOrder(payload: {
  productId: string;
  periods: number;
  cycleDays: number;
  depositRatio: number;
  batteryOption?: string;
  repaymentMethod?: string;
}) {
  const { data } = await http.post('/h5/orders', payload);
  return data as Order;
}

export async function listOrders() {
  const { data } = await http.get('/h5/orders');
  return data as Order[];
}

export async function getOrder(id: string) {
  const { data } = await http.get(`/h5/orders/${id}`);
  return data as any;
}

export async function startContract(orderId: string) {
  const { data } = await http.post(`/h5/contracts/${orderId}/start`);
  return data as Contract;
}

export async function getContract(orderId: string) {
  const { data } = await http.get(`/h5/contracts/${orderId}`);
  return data as Contract | null;
}

export async function startPayment(orderId: string) {
  const { data } = await http.post(`/h5/orders/${orderId}/payment/start`);
  return data as PaymentIntent;
}

export async function uploadKycImage(file: File) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await http.post('/h5/upload', form);
  return data as { url: string };
}

export async function submitKyc(orderId: string, kycData: {
  idCardFront: string;
  idCardBack: string;
  facePhoto: string;
  realName: string;
  idCardNumber: string;
  occupation?: string;
  company?: string;
  workCity?: string;
  residenceAddress?: string;
  residenceDuration?: string;
  contactName: string;
  contactPhone: string;
  contactRelation: string;
}) {
  const { data } = await http.post(`/h5/orders/${orderId}/kyc`, kycData);
  return data;
}
