import axios from 'axios';
import type { AxiosRequestConfig, AxiosInstance } from 'axios';
import { ElMessage } from 'element-plus';
import router from '../router';
import { useUserStore } from '../stores/user';

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** silent: true 时由调用方自行处理错误提示（如轮询场景） */
    silent?: boolean;
  }
}

/** 响应拦截器统一剥壳后返回响应体，因此按响应体形状对外暴露泛型 */
interface RequestInstance {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T = any>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  put<T = any>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

const instance: AxiosInstance = axios.create({ baseURL: '/api', timeout: 10000 });

instance.interceptors.request.use((config) => {
  const store = useUserStore();
  if (store.token) {
    config.headers.Authorization = `Bearer ${store.token}`;
  }
  return config;
});

// 并发请求同时 401 时只提示并跳转一次
let redirectingToLogin = false;

instance.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const isNetworkError = !err.response;
    const msg = isNetworkError
      ? '无法连接服务器，请检查后端服务或网络连接'
      : err.response.data?.message || err.message || '请求失败';
    if (err.response?.status === 401 && router.currentRoute.value.path !== '/login') {
      useUserStore().logout();
      if (!redirectingToLogin) {
        redirectingToLogin = true;
        ElMessage.error('登录已过期，请重新登录');
        router.push('/login').finally(() => {
          redirectingToLogin = false;
        });
      }
    } else if (!err.config?.silent) {
      // silent: true 时由调用方自行处理错误提示（如轮询场景）
      ElMessage.error(msg);
    }
    return Promise.reject(err);
  }
);

const request = instance as unknown as RequestInstance;

export default request;
