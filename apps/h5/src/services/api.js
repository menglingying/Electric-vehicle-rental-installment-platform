import { http } from './http';
export async function requestLoginCode(phone) {
    const { data } = await http.post('/h5/auth/request-code', { phone });
    return data;
}
export async function login(phone, code) {
    const { data } = await http.post('/h5/auth/login', { phone, code });
    return data;
}
export async function listProducts() {
    const { data } = await http.get('/h5/products');
    return data;
}
export async function listProductsByCategory(categoryId) {
    const { data } = await http.get('/h5/products', { params: { categoryId } });
    return data;
}
export async function getProduct(id) {
    const { data } = await http.get(`/h5/products/${id}`);
    return data;
}
export async function listCategoryTree() {
    const { data } = await http.get('/h5/categories/tree');
    return data;
}
export async function listDictItems(dictCode) {
    const { data } = await http.get(`/common/dicts/${dictCode}`);
    return data;
}
export async function listRegions(parentCode) {
    const { data } = await http.get('/common/regions', { params: { parentCode } });
    return data;
}
export async function createOrder(payload) {
    const { data } = await http.post('/h5/orders', payload);
    return data;
}
export async function listOrders() {
    const { data } = await http.get('/h5/orders');
    return data;
}
export async function getOrder(id, options) {
    const params = options?.bypassCache ? { t: Date.now() } : undefined;
    const { data } = await http.get(`/h5/orders/${id}`, { params });
    return data;
}
export async function startContract(orderId) {
    const { data } = await http.post(`/h5/contracts/${orderId}/start`);
    return data;
}
export async function getContract(orderId) {
    const { data } = await http.get(`/h5/contracts/${orderId}`);
    return data;
}
export async function startPayment(orderId) {
    const { data } = await http.post(`/h5/orders/${orderId}/payment/start`);
    return data;
}
export async function startAsignAuth(orderId) {
    const { data } = await http.post(`/h5/orders/${orderId}/asign-auth`);
    return data;
}
export async function uploadKycImage(file) {
    const form = new FormData();
    form.append('file', file);
    const { data } = await http.post('/h5/upload', form);
    return data;
}
export async function submitKyc(orderId, kycData) {
    const { data } = await http.post(`/h5/orders/${orderId}/kyc`, kycData);
    return data;
}
export async function getNotarySignUrl(orderId) {
    const { data } = await http.get(`/h5/notary/${orderId}/sign-url`);
    return data;
}
