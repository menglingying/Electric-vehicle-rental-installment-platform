import { createRouter as _createRouter, createWebHistory } from 'vue-router';
import Login from '@/views/Login.vue';
import MainLayout from '@/views/MainLayout.vue';
import Dashboard from '@/views/Dashboard.vue';
import Products from '@/views/Products.vue';
import Categories from '@/views/Categories.vue';
import Orders from '@/views/Orders.vue';
import Blacklist from '@/views/Blacklist.vue';
import Repayments from '@/views/Repayments.vue';
import Reminders from '@/views/Reminders.vue';
import Overdue from '@/views/Overdue.vue';
import { getAdminToken } from '@/services/auth';

export function createRouter() {
  const router = _createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', redirect: '/dashboard' },
      { path: '/login', component: Login },
      {
        path: '/',
        component: MainLayout,
        children: [
          { path: 'dashboard', component: Dashboard },
          { path: 'categories', component: Categories },
          { path: 'products', component: Products },
          { path: 'orders', component: Orders },
          { path: 'repayments', component: Repayments },
          { path: 'reminders', component: Reminders },
          { path: 'overdue', component: Overdue },
          { path: 'blacklist', component: Blacklist }
        ]
      }
    ]
  });

  router.beforeEach((to) => {
    if (to.path === '/login') return true;
    if (!getAdminToken()) return '/login';
    return true;
  });

  return router;
}
