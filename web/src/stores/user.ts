import { defineStore } from 'pinia';

/** localStorage 中缓存的用户信息（登录接口返回的完整用户对象） */
export interface StoredUser {
  id?: number;
  username?: string;
  name?: string;
  role?: 'student' | 'admin';
  [key: string]: unknown;
}

/** localStorage 可能被用户或插件写坏，解析失败时清理并按未登录处理 */
function loadStoredUser(): StoredUser | null {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null') as StoredUser | null;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
}

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: loadStoredUser(),
  }),
  getters: {
    isLoggedIn: (s) => !!s.token,
    isAdmin: (s) => s.user?.role === 'admin',
  },
  actions: {
    setAuth(token: string, user: StoredUser) {
      this.token = token;
      this.user = user;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    setUser(user: StoredUser) {
      this.user = user;
      localStorage.setItem('user', JSON.stringify(user));
    },
    logout() {
      this.token = '';
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
});
