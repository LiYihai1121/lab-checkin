import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

// 在 node 环境中模拟 localStorage（store 初始化与持久化都依赖它）
const mem = {};
vi.stubGlobal('localStorage', {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => {
    mem[k] = String(v);
  },
  removeItem: (k) => {
    delete mem[k];
  }
});

const { useUserStore } = await import('../src/stores/user.js');

describe('useUserStore', () => {
  beforeEach(() => {
    for (const key of Object.keys(mem)) delete mem[key];
    setActivePinia(createPinia());
  });

  it('setAuth 写入状态并持久化到 localStorage', () => {
    const store = useUserStore();
    store.setAuth('tok-1', { id: 1, username: 'u', role: 'student' });
    expect(store.token).toBe('tok-1');
    expect(store.isLoggedIn).toBe(true);
    expect(store.isAdmin).toBe(false);
    expect(JSON.parse(mem.user)).toEqual({ id: 1, username: 'u', role: 'student' });
    expect(mem.token).toBe('tok-1');
  });

  it('新建实例（模拟刷新页面）后从 localStorage 恢复登录态', () => {
    const store = useUserStore();
    store.setAuth('tok-2', { id: 2, username: 'a', role: 'admin' });
    setActivePinia(createPinia()); // 模拟页面刷新后的全新 store
    const reloaded = useUserStore();
    expect(reloaded.token).toBe('tok-2');
    expect(reloaded.isLoggedIn).toBe(true);
    expect(reloaded.isAdmin).toBe(true);
  });

  it('localStorage 中 user 字段损坏时清理并按未登录处理，不抛异常', () => {
    mem.token = 'tok-3';
    mem.user = '{"role": "admin"'; // 残缺 JSON
    setActivePinia(createPinia());
    const store = useUserStore();
    expect(store.user).toBeNull();
    expect(store.isLoggedIn).toBe(true); // token 仍有效，等待 /auth/me 自愈
    expect(store.isAdmin).toBe(false);
    expect(mem.user).toBeUndefined(); // 损坏数据已被清理
  });

  it('logout 清空状态与持久化数据', () => {
    const store = useUserStore();
    store.setAuth('tok-4', { id: 3, username: 'b', role: 'admin' });
    store.logout();
    expect(store.token).toBe('');
    expect(store.user).toBeNull();
    expect(store.isLoggedIn).toBe(false);
    expect(mem.token).toBeUndefined();
    expect(mem.user).toBeUndefined();
  });
});
