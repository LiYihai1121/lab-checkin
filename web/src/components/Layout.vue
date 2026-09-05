<template>
  <el-container class="layout">
    <el-aside width="220px" class="aside">
      <BrandLogo compact />
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
        <div class="header-heading">
          <div class="kicker">LAB CHECK-IN / {{ store.isAdmin ? 'ADMIN' : 'STUDENT' }}</div>
          <span class="title">{{ $route.meta.title || '' }}</span>
          <el-tag v-if="!appEnv.isProduction" :type="appEnv.tag" size="small" effect="plain" class="env-tag">
            {{ appEnv.label }}
          </el-tag>
        </div>
        <el-dropdown class="account-menu" @command="onCommand">
          <span class="user-info">
            {{ store.user?.name }}（{{ store.isAdmin ? '管理员' : '学生' }}）
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="password">修改密码</el-dropdown-item>
              <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>
      <el-main class="main"><router-view /></el-main>
    </el-container>

    <!-- 修改密码弹窗 -->
    <el-dialog v-model="pwdDialog.visible" title="修改密码" width="400px">
      <el-form ref="pwdFormRef" :model="pwdDialog" :rules="pwdRules" label-width="100px"
        @keyup.enter="onChangePwd">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="pwdDialog.oldPassword" type="password" show-password placeholder="输入当前密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="pwdDialog.newPassword" type="password" show-password placeholder="至少 6 位" />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input v-model="pwdDialog.confirmPassword" type="password" show-password placeholder="再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="pwdSaving" @click="onChangePwd">确认修改</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import type { Component } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { ArrowDown, DataAnalysis, Document, Postcard, Tickets, User as UserIcon, AlarmClock } from '@element-plus/icons-vue';
import request from '../api/request';
import { useUserStore } from '../stores/user';
import { appEnv } from '../config/env';
import BrandLogo from './BrandLogo.vue';

const store = useUserStore();
const router = useRouter();

interface MenuItem {
  path: string;
  label: string;
  icon: Component;
}

const studentMenus: MenuItem[] = [
  { path: '/checkin', label: '签到签退', icon: AlarmClock },
  { path: '/my-records', label: '我的记录', icon: Tickets }
];
const adminMenus: MenuItem[] = [
  { path: '/admin/dashboard', label: '统计看板', icon: DataAnalysis },
  { path: '/admin/qrcode', label: '签到二维码', icon: Postcard },
  { path: '/admin/records', label: '记录管理', icon: Document },
  { path: '/admin/users', label: '用户管理', icon: UserIcon }
];
const menus = computed(() => (store.isAdmin ? adminMenus : studentMenus));

function onCommand(cmd: string) {
  if (cmd === 'logout') {
    store.logout();
    ElMessage.success('已退出登录');
    router.push('/login');
  } else if (cmd === 'password') {
    openPwdDialog();
  }
}

// ---- 修改密码 ----
const pwdFormRef = ref<FormInstance>();
const pwdSaving = ref(false);
const pwdDialog = reactive({ visible: false, oldPassword: '', newPassword: '', confirmPassword: '' });
const pwdRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码至少 6 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== pwdDialog.newPassword) callback(new Error('两次输入的密码不一致'));
        else callback();
      },
      trigger: 'blur'
    }
  ]
};

function openPwdDialog() {
  Object.assign(pwdDialog, { visible: true, oldPassword: '', newPassword: '', confirmPassword: '' });
}

async function onChangePwd() {
  const valid = await pwdFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  pwdSaving.value = true;
  try {
    const data = await request.put('/auth/password', {
      oldPassword: pwdDialog.oldPassword,
      newPassword: pwdDialog.newPassword
    });
    ElMessage.success(data.message || '密码修改成功');
    pwdDialog.visible = false;
  } finally {
    pwdSaving.value = false;
  }
}

// 会话自愈：拉取最新用户信息，避免本地缓存的姓名/角色过期（401 由拦截器统一登出）
onMounted(async () => {
  try {
    const data = await request.get('/auth/me', { silent: true });
    if (data.user) store.setUser(data.user);
  } catch {
    // 静默失败即可
  }
});
</script>

<style scoped>
.layout {
  height: 100%;
}
.aside {
  background: #102a2c;
  padding: 0 16px;
  box-shadow: 8px 0 24px rgba(16, 42, 44, 0.08);
}
.aside :deep(.brand-logo) {
  height: 68px;
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
  border-bottom: 1px solid #e5ded2;
  min-height: 76px;
  height: auto;
  padding: 0 30px;
  background: rgba(255, 253, 248, 0.9);
  backdrop-filter: blur(12px);
}
.header-heading {
  min-width: 0;
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
.env-tag {
  margin-left: 10px;
  vertical-align: 2px;
}
.user-info {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  outline: none;
  padding: 8px 12px;
  border: 1px solid #e5ded2;
  border-radius: 20px;
  color: #52615c;
  background: #fffdf8;
  font-size: 13px;
}
.main {
  background: transparent;
  padding: 30px 34px 42px;
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
  .aside :deep(.brand-logo) {
    justify-content: center;
  }
  .aside :deep(.brand-logo .logo-copy),
  .nav-caption,
  .aside :deep(.el-menu-item span) {
    display: none;
  }
  .main {
    padding: 20px 14px;
  }
  .header {
    padding: 0 16px;
  }
}
</style>
