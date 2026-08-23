import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '../router';
import { useUserStore } from '../stores/user';

const request = axios.create({ baseURL: '/api', timeout: 10000 });

request.interceptors.request.use((config) => {
  const store = useUserStore();
  if (store.token) config.headers.Authorization = `Bearer ${store.token}`;
  return config;
});

request.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.message || err.message || '请求失败';
    if (err.response?.status === 401 && router.currentRoute.value.path !== '/login') {
      useUserStore().logout();
      ElMessage.error('登录已过期，请重新登录');
      router.push('/login');
    } else {
      ElMessage.error(msg);
    }
    return Promise.reject(err);
  }
);

export default request;
