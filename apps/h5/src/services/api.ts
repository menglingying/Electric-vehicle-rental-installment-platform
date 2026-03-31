import { http } from './http';

export type Product = {
  id: string;
  name: string;
  coverUrl: string;
  images?: string[];
  rentPerCycle: number;
  categoryId?: string;
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
  asignSerialNo?: string;
  asignAuthResult?: string;
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
  const { data } = await http.post('/h5/auth/request-code', { phone });
  return data as { message: string; devFixedCode?: string; expireMinutes?: number };
}

export async function login(phone: string, code: string) {
  const { data } = await http.post('/h5/auth/login', { phone, code });
  return data as { token: string };
}

export async function listProducts() {
  const { data } = await http.get('/h5/products');
  return data as Product[];
}

export async function listProductsByCategory(categoryId: string) {
  const { data } = await http.get('/h5/products', { params: { categoryId } });
  return data as Product[];
}

export async function getProduct(id: string) {
  const { data } = await http.get(`/h5/products/${id}`);
  return data as Product;
}

export type CategoryNode = {
  id: string;
  name: string;
  level: number;
  children?: CategoryNode[];
};

export async function listCategoryTree() {
  const { data } = await http.get('/h5/categories/tree');
  return data as CategoryNode[];
}

export type DictItem = { code: string; label: string };

export async function listDictItems(dictCode: string) {
  const { data } = await http.get(`/common/dicts/${dictCode}`);
  return data as DictItem[];
}

export type RegionItem = { code: string; name: string };

export async function listRegions(parentCode?: string) {
  const { data } = await http.get('/common/regions', { params: { parentCode } });
  return data as RegionItem[];
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

export async function updateOrder(orderId: string, payload: {
  periods: number;
  cycleDays: number;
  depositRatio: number;
  batteryOption?: string;
  repaymentMethod?: string;
}) {
  const { data } = await http.put(`/h5/orders/${orderId}`, payload);
  return data as Order;
}

export async function listOrders() {
  const { data } = await http.get('/h5/orders');
  return data as Order[];
}

export async function getOrder(id: string, options?: { bypassCache?: boolean }) {
  const params = options?.bypassCache ? { t: Date.now() } : undefined;
  const { data } = await http.get(`/h5/orders/${id}`, { params });
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

export async function syncContractStatus(orderId: string) {
  const { data } = await http.post(`/h5/contracts/${orderId}/sync`);
  return data as { synced: boolean; status?: string; reason?: string };
}

export async function startPayment(orderId: string) {
  const { data } = await http.post(`/h5/orders/${orderId}/payment/start`);
  return data as PaymentIntent;
}

export async function startAsignAuth(orderId: string) {
  const { data } = await http.post(`/h5/orders/${orderId}/asign-auth`);
  return data as { authUrl: string; serialNo?: string };
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
  contactName: string;
  contactPhone: string;
  contactRelation: string;
  contactName2: string;
  contactPhone2: string;
  contactRelation2: string;
  contactName3: string;
  contactPhone3: string;
  contactRelation3: string;
  employmentStatus: string;
  employmentName: string;
  incomeRangeCode: string;
  homeProvinceCode: string;
  homeCityCode: string;
  homeDistrictCode: string;
  homeAddressDetail: string;
}) {
  const { data } = await http.post(`/h5/orders/${orderId}/kyc`, kycData);
  return data;
}

export async function getNotarySignUrl(orderId: string) {
  const { data } = await http.get(`/h5/notary/${orderId}/sign-url`);
  return data as { signUrl: string };
}
