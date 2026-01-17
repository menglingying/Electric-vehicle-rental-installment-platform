import { http } from './http';
export async function adminLogin(username, password) {
    const { data } = await http.post('/admin/auth/login', { username, password });
    return data;
}
export async function listProducts() {
    const { data } = await http.get('/admin/products');
    return data;
}
export async function upsertProduct(payload) {
    const { data } = await http.post('/admin/products', payload);
    return data;
}
export async function deleteProduct(id) {
    await http.delete(`/admin/products/${encodeURIComponent(id)}`);
}
export async function uploadProductImage(file) {
    const form = new FormData();
    form.append('file', file);
    const { data } = await http.post('/admin/uploads', form);
    return data;
}
export async function listOrders() {
    const { data } = await http.get('/admin/orders');
    return data;
}
export async function getOrderDetail(orderId) {
    const { data } = await http.get(`/admin/orders/${orderId}`);
    return data;
}
export async function approveOrder(orderId) {
    const { data } = await http.post(`/admin/orders/${orderId}/approve`);
    return data;
}
export async function rejectOrder(orderId, reason) {
    const { data } = await http.post(`/admin/orders/${orderId}/reject`, { reason });
    return data;
}
export async function deliverOrder(orderId) {
    const { data } = await http.post(`/admin/orders/${orderId}/deliver`);
    return data;
}
export async function pickupOrder(orderId) {
    const { data } = await http.post(`/admin/orders/${orderId}/pickup`);
    return data;
}
export async function returnOrder(orderId) {
    const { data } = await http.post(`/admin/orders/${orderId}/return`);
    return data;
}
export async function settleOrder(orderId) {
    const { data } = await http.post(`/admin/orders/${orderId}/settle`);
    return data;
}
export async function closeOrder(orderId) {
    const { data } = await http.post(`/admin/orders/${orderId}/close`);
    return data;
}
export async function adjustOrderPrice(orderId, payload) {
    const { data } = await http.post(`/admin/orders/${orderId}/price-adjust`, payload);
    return data;
}
export async function getRepayments(orderId) {
    const { data } = await http.get('/admin/repayments', { params: { orderId } });
    return data;
}
export async function markPeriodPaid(orderId, period) {
    const { data } = await http.post(`/admin/orders/${orderId}/repayments/${period}/mark-paid`);
    return data;
}
export async function listReminders(kind) {
    const { data } = await http.get('/admin/reminders', { params: { kind } });
    return data;
}
export async function sendSms(phone, content) {
    const { data } = await http.post('/admin/sms/send', { phone, content });
    return data;
}
export async function listSmsRecords() {
    const { data } = await http.get('/admin/sms/records');
    return data;
}
export async function listOverdue(tier) {
    const { data } = await http.get('/admin/overdue', { params: { tier } });
    return data;
}
export async function sendReminderSms(ids) {
    const { data } = await http.post('/admin/reminders/send', { ids });
    return data;
}
export async function sendOverdueSms(items) {
    const { data } = await http.post('/admin/overdue/send', { items });
    return data;
}
export async function listBlacklist() {
    const { data } = await http.get('/admin/blacklist');
    return data;
}
export async function addBlacklist(phone, reason) {
    const { data } = await http.post('/admin/blacklist', { phone, reason });
    return data;
}
export async function removeBlacklist(phone) {
    const { data } = await http.delete(`/admin/blacklist/${encodeURIComponent(phone)}`);
    return data;
}
export async function listCategories() {
    const { data } = await http.get('/admin/categories/tree');
    return data;
}
export async function upsertCategory(payload) {
    const { data } = await http.post('/admin/categories', payload);
    return data;
}
export async function deleteCategory(id) {
    await http.delete(`/admin/categories/${encodeURIComponent(id)}`);
}
