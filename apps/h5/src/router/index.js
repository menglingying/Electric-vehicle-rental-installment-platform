import { createRouter as _createRouter, createWebHistory } from 'vue-router';
import Login from '@/views/Login.vue';
import Products from '@/views/Products.vue';
import ProductDetail from '@/views/ProductDetail.vue';
import Orders from '@/views/Orders.vue';
import OrderDetail from '@/views/OrderDetail.vue';
import OrderKyc from '@/views/OrderKyc.vue';
import OrderEdit from '@/views/OrderEdit.vue';
import { getH5Token } from '@/services/auth';
export function createRouter() {
    const router = _createRouter({
        history: createWebHistory(),
        routes: [
            { path: '/', redirect: '/products' },
            { path: '/login', component: Login },
            { path: '/products', component: Products },
            { path: '/products/:id', component: ProductDetail },
            { path: '/orders', component: Orders },
            { path: '/orders/:id', component: OrderDetail },
            { path: '/orders/:id/kyc', component: OrderKyc },
            { path: '/orders/:id/edit', component: OrderEdit }
        ]
    });
    router.beforeEach((to) => {
        const publicPaths = new Set(['/login']);
        if (publicPaths.has(to.path))
            return true;
        if (!getH5Token())
            return { path: '/login', query: { redirect: to.fullPath } };
        return true;
    });
    return router;
}
