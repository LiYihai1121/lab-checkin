/** 只允许站内相对路径回跳，防开放重定向（// 与外部协议均拒绝） */
export function safeRedirect(target: unknown): string {
  return typeof target === 'string' && target.startsWith('/') && !target.startsWith('//') ? target : '';
}
