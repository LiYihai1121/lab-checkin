<template>
  <el-container class="layout">
    <el-aside width="200px" class="aside">
      <div class="logo">🧪 实验室签到</div>
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
        <span class="title">{{ $route.meta.title || '' }}</span>
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
  background: #001529;
}
.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-size: 17px;
  font-weight: 600;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e8e8e8;
  background: #fff;
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
  background: #f5f7fa;
}
.el-menu {
  border-right: none;
}
</style>
