import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '../stores/user';

const routes = [
  { path: '/login', component: () => import('../views/Login.vue') },
  { path: '/forgot-password', component: () => import('../views/ForgotPassword.vue') },
  {
    path: '/',
    component: () => import('../components/Layout.vue'),
    children: [
      { path: '', redirect: '/checkin' },
      { path: 'checkin', component: () => import('../views/Checkin.vue'), meta: { title: '签到签退' } },
      { path: 'my-records', component: () => import('../views/MyRecords.vue'), meta: { title: '我的记录' } },
      {
        path: 'admin/dashboard',
        component: () => import('../views/admin/Dashboard.vue'),
        meta: { title: '统计看板', adminOnly: true }
      },
      {
        path: 'admin/qrcode',
        component: () => import('../views/admin/QrCodeView.vue'),
        meta: { title: '签到二维码', adminOnly: true }
      },
      {
        path: 'admin/records',
        component: () => import('../views/admin/RecordsAdmin.vue'),
        meta: { title: '记录管理', adminOnly: true }
      },
      {
        path: 'admin/users',
        component: () => import('../views/admin/UsersAdmin.vue'),
        meta: { title: '用户管理', adminOnly: true }
      },
      { path: ':pathMatch(.*)*', component: () => import('../views/NotFound.vue'), meta: { title: '页面不存在' } }
    ]
  }
];

const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach((to) => {
  const store = useUserStore();
  const isPublicRoute = to.path === '/login' || to.path === '/forgot-password';
  if (!isPublicRoute && !store.isLoggedIn) {
    // 记录目标路径，登录成功后跳回；扫码进入的 code 参数也在 fullPath 中保留
    return { path: '/login', query: { redirect: to.fullPath } };
  }
  if (to.path === '/login' && store.isLoggedIn) return store.isAdmin ? '/admin/dashboard' : '/checkin';
  if (to.meta.adminOnly && !store.isAdmin) return '/checkin';
});

export default router;
