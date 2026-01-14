const H5_TOKEN_KEY = 'h5_token';
export function getH5Token() {
    return localStorage.getItem(H5_TOKEN_KEY);
}
export function setH5Token(token) {
    localStorage.setItem(H5_TOKEN_KEY, token);
}
export function clearH5Token() {
    localStorage.removeItem(H5_TOKEN_KEY);
}
