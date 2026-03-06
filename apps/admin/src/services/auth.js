const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_ROLE_KEY = 'admin_role';
export function getAdminToken() {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
}
export function setAdminToken(token) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
}
export function getAdminRole() {
    return localStorage.getItem(ADMIN_ROLE_KEY);
}
export function setAdminRole(role) {
    localStorage.setItem(ADMIN_ROLE_KEY, role);
}
export function isSuper() {
    return getAdminRole() === 'SUPER';
}
export function clearAdminToken() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_ROLE_KEY);
}
