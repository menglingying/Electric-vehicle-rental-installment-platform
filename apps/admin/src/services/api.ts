import { http } from './http';

export type Product = {
  id: string;
  name: string;
  coverUrl?: string;
  images?: string[];
  rentPerCycle: number;
  categoryId?: string;
  tags: string[];
  frameConfig?: string;
  batteryConfig?: string;
  rentWithoutBattery?: number;
  rentWithBattery?: number;
};

export type CategoryNode = {
  id: string;
  parentId?: string;
  name: string;
  level: number;
  status: number;
  sort: number;
  children?: CategoryNode[];
};

export type Order = {
  id: string;
  status: string;
  phone: string;
  realName?: string;
  productName: string;
  periods: number;
  cycleDays: number;
  createdAt: string;
};

export type ReminderItem = {
  id: string;
  orderId: string;
  phone: string;
  productName: string;
  period: number;
  dueDate: string;
  amount: number;
};

export type Contract = {
  id: string;
  orderId: string;
  contractType?: string;
  provider?: string;
  contractNo?: string;
  templateId?: string;
  status?: string;
  signUrl?: string;
  fileUrl?: string;
  signedAt?: string;
  signedBy?: string;
  meta?: string;
  notaryCertUrl?: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function adminLogin(username: string, password: string) {
  const { data } = await http.post('/admin/auth/login', { username, password });
  return data as { token: string };
}

export async function listProducts() {
  const { data } = await http.get('/admin/products');
  return data as Product[];
}

export async function upsertProduct(payload: Partial<Product> & { name: string; rentPerCycle: number; categoryId: string }) {
  const { data } = await http.post('/admin/products', payload);
  return data as Product;
}

export async function deleteProduct(id: string) {
  await http.delete(`/admin/products/${encodeURIComponent(id)}`);
}

export async function uploadProductImage(file: File) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await http.post('/admin/uploads', form);
  return data as { url: string };
}

export async function listOrders() {
  const { data } = await http.get('/admin/orders');
  return data as Order[];
}

export async function listContracts(type?: string) {
  const { data } = await http.get('/admin/contracts', { params: type ? { type } : undefined });
  return data as Contract[];
}

export async function getContract(orderId: string) {
  const { data } = await http.get(`/admin/contracts/${orderId}`);
  return data as Contract | null;
}

export async function prepareContract(orderId: string, payload: { contractNo?: string; templateId?: string; productFrameNo?: string }) {
  const { data } = await http.post(`/admin/contracts/${orderId}/prepare`, payload);
  return data as Contract;
}

export async function markContractSigned(orderId: string, payload: { signedBy?: string }) {
  const { data } = await http.post(`/admin/contracts/${orderId}/mark-signed`, payload);
  return data as Contract;
}

export async function uploadContractPdf(file: File) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await http.post('/admin/contracts/upload', form);
  return data as { url: string };
}

export async function downloadContractFile(orderId: string) {
  const { data } = await http.post(`/admin/contracts/${orderId}/download`);
  return data as Contract;
}

export async function upsertManualContract(payload: {
  id?: string;
  contractNo?: string;
  orderNo?: string;
  productName?: string;
  renterName?: string;
  renterIdNumber?: string;
  renterPhone?: string;
  leaseStart?: string;
  leaseEnd?: string;
  periods?: number;
  cycleDays?: number;
  rentPerPeriod?: number;
  depositRatio?: number;
  signedAt?: string;
  signedBy?: string;
  status?: string;
  fileUrl?: string;
  remark?: string;
}) {
  const { data } = await http.post('/admin/contracts/manual', payload);
  return data as Contract;
}

export async function applyNotary(orderId: string) {
  const { data } = await http.post(`/admin/notary/${orderId}/apply`);
  return data as any;
}

export async function refreshNotary(orderId: string) {
  const { data } = await http.post(`/admin/notary/${orderId}/refresh`);
  return data as any;
}

export async function fetchNotaryCertUrl(orderId: string) {
  const { data } = await http.post(`/admin/notary/${orderId}/cert-url`);
  return data as { url: string };
}

export async function getNotarySignUrl(orderId: string) {
  const { data } = await http.get(`/admin/notary/${orderId}/sign-url`);
  return data as { signUrl: string };
}

export async function getOrderDetail(orderId: string) {
  const { data } = await http.get(`/admin/orders/${orderId}`);
  return data as any;
}

export async function approveOrder(orderId: string) {
  const { data } = await http.post(`/admin/orders/${orderId}/approve`);
  return data;
}

export async function rejectOrder(orderId: string, reason: string) {
  const { data } = await http.post(`/admin/orders/${orderId}/reject`, { reason });
  return data;
}

export async function deliverOrder(orderId: string) {
  const { data } = await http.post(`/admin/orders/${orderId}/deliver`);
  return data;
}

export async function pickupOrder(orderId: string) {
  const { data } = await http.post(`/admin/orders/${orderId}/pickup`);
  return data;
}

export async function returnOrder(orderId: string) {
  const { data } = await http.post(`/admin/orders/${orderId}/return`);
  return data;
}

export async function settleOrder(orderId: string) {
  const { data } = await http.post(`/admin/orders/${orderId}/settle`);
  return data;
}

export async function closeOrder(orderId: string) {
  const { data } = await http.post(`/admin/orders/${orderId}/close`);
  return data;
}

export async function deleteOrder(orderId: string) {
  const { data } = await http.delete(`/admin/orders/${orderId}`);
  return data;
}

export async function resetOrderForTest(orderId: string) {
  const { data } = await http.post(`/admin/orders/${orderId}/reset-for-test`);
  return data;
}

export async function adjustOrderPrice(orderId: string, payload: {
  rentPerPeriod: number;
  periods: number;
  cycleDays: number;
  reason: string;
}) {
  const { data } = await http.post(`/admin/orders/${orderId}/price-adjust`, payload);
  return data;
}

export async function getRepayments(orderId: string) {
  const { data } = await http.get('/admin/repayments', { params: { orderId } });
  return data as any;
}

export async function markPeriodPaid(orderId: string, period: number) {
  const { data } = await http.post(`/admin/orders/${orderId}/repayments/${period}/mark-paid`);
  return data;
}

export async function listReminders(kind: 'due_today' | 'due_soon' | 'all') {
  const { data } = await http.get('/admin/reminders', { params: { kind } });
  return data as ReminderItem[];
}

export async function sendSms(phone: string, content: string) {
  const { data } = await http.post('/admin/sms/send', { phone, content });
  return data as any;
}

export async function listSmsRecords() {
  const { data } = await http.get('/admin/sms/records');
  return data as any[];
}

export async function listOverdue(tier: '1-3' | '3-10' | '10-30' | '30+' | 'all') {
  const { data } = await http.get('/admin/overdue', { params: { tier } });
  return data as any[];
}

export async function sendReminderSms(ids: string[]) {
  const { data } = await http.post('/admin/reminders/send', { ids });
  return data as { total: number; success: number; fail: number; results: any[] };
}

export type OverdueSendItem = { orderId: string; period: number; amount: number; overdueDays: number };

export async function sendOverdueSms(items: OverdueSendItem[]) {
  const { data } = await http.post('/admin/overdue/send', { items });
  return data as { total: number; success: number; fail: number; results: any[] };
}

export async function listBlacklist() {
  const { data } = await http.get('/admin/blacklist');
  return data as { phone: string; reason: string; createdAt: string }[];
}

export async function addBlacklist(phone: string, reason: string) {
  const { data } = await http.post('/admin/blacklist', { phone, reason });
  return data;
}

export async function removeBlacklist(phone: string) {
  const { data } = await http.delete(`/admin/blacklist/${encodeURIComponent(phone)}`);
  return data;
}

export async function listCategories() {
  const { data } = await http.get('/admin/categories/tree');
  return data as CategoryNode[];
}

export async function upsertCategory(payload: {
  id?: string;
  parentId?: string;
  name: string;
  sort?: number;
  status?: number;
}) {
  const { data } = await http.post('/admin/categories', payload);
  return data as CategoryNode;
}

export async function deleteCategory(id: string) {
  await http.delete(`/admin/categories/${encodeURIComponent(id)}`);
}
