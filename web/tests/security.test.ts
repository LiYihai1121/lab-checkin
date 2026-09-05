import { describe, it, expect } from 'vitest';
import { safeRedirect } from '../src/utils/security';

describe('safeRedirect 登录回跳白名单', () => {
  it('允许站内相对路径', () => {
    expect(safeRedirect('/checkin')).toBe('/checkin');
    expect(safeRedirect('/admin/users')).toBe('/admin/users');
    expect(safeRedirect('/my-records?page=2&start=2026-01-01')).toBe('/my-records?page=2&start=2026-01-01');
  });

  it('拒绝协议相对地址与外部地址', () => {
    expect(safeRedirect('//evil.com')).toBe('');
    expect(safeRedirect('//evil.com/path')).toBe('');
    expect(safeRedirect('https://evil.com/phish')).toBe('');
    expect(safeRedirect('http://localhost:3000/api')).toBe('');
  });

  it('拒绝非字符串与危险协议', () => {
    expect(safeRedirect(undefined)).toBe('');
    expect(safeRedirect(null)).toBe('');
    expect(safeRedirect(123)).toBe('');
    expect(safeRedirect({})).toBe('');
    expect(safeRedirect('javascript:alert(1)')).toBe('');
    expect(safeRedirect('data:text/html,<script>')).toBe('');
  });
});
