<template>
  <el-container class="layout">
    <el-aside width="220px" class="aside">
      <div class="logo"><span class="logo-mark">LC</span><span>实验室签到</span></div>
      <div class="nav-caption">{{ store.isAdmin ? '管理工作台' : '我的实验室' }}</div>
      <el-menu :default-active="$route.path" router background-color="#001529" text-color="#a6adb4"
        active-text-color="#ffffff">
        <el-menu-item v-for="m in menus" :key="m.path" :index="m.path">
          <el-icon><component :is="m.icon" /></el-icon>
          <span>{{ m.label }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div>
          <div class="kicker">LAB CHECK-IN / {{ store.isAdmin ? 'ADMIN' : 'STUDENT' }}</div>
          <span class="title">{{ $route.meta.title || '' }}</span>
        </div>
        <el-dropdown @command="onCommand">
          <span class="user-info">
            {{ store.user?.name }}（{{ store.isAdmin ? '管理员' : '学生' }}）
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>
      <el-main class="main"><router-view /></el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowDown } from '@element-plus/icons-vue';
import { useUserStore } from '../stores/user';

const store = useUserStore();
const router = useRouter();

const studentMenus = [
  { path: '/checkin', label: '签到签退', icon: 'AlarmClock' },
  { path: '/my-records', label: '我的记录', icon: 'Tickets' }
];
const adminMenus = [
  { path: '/admin/dashboard', label: '统计看板', icon: 'DataAnalysis' },
  { path: '/admin/qrcode', label: '签到二维码', icon: 'Postcard' },
  { path: '/admin/records', label: '记录管理', icon: 'Document' },
  { path: '/admin/users', label: '用户管理', icon: 'User' }
];
const menus = computed(() => (store.isAdmin ? adminMenus : studentMenus));

function onCommand(cmd) {
  if (cmd === 'logout') {
    store.logout();
    ElMessage.success('已退出登录');
    router.push('/login');
  }
}
</script>

<style scoped>
.layout {
  height: 100%;
}
.aside {
  background: #102a2c;
  padding: 0 12px;
}
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0;
}
.logo-mark {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  color: #102a2c;
  background: #f4c95d;
  font-size: 12px;
  font-weight: 800;
}
.nav-caption {
  padding: 12px 12px 8px;
  color: #8eaaa8;
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e8e8e8;
  min-height: 76px;
  height: auto;
  background: #fffdf8;
}
.kicker {
  margin-bottom: 4px;
  color: #8b9a98;
  font-size: 10px;
  letter-spacing: 1.5px;
  font-weight: 700;
}
.title {
  font-size: 16px;
  font-weight: 600;
}
.user-info {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  outline: none;
}
.main {
  background: #f4f1ea;
  padding: 28px 32px;
}
.el-menu {
  border-right: none;
  background: transparent;
}
.el-menu-item {
  margin: 4px 0;
  border-radius: 9px;
}
.el-menu-item.is-active {
  background: #1d4847;
}
@media (max-width: 720px) {
  .aside {
    width: 72px !important;
    padding: 0 8px;
  }
  .logo {
    justify-content: center;
  }
  .logo > span:last-child,
  .nav-caption,
  .aside :deep(.el-menu-item span) {
    display: none;
  }
  .main {
    padding: 20px 14px;
  }
}
</style>
