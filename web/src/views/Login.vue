<template>
  <div class="login-bg">
    <el-card class="login-card">
      <h2 class="login-title">🧪 实验室签到系统</h2>
      <el-form ref="formRef" :model="form" :rules="rules" size="large" @keyup.enter="onSubmit">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" :prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="密码" :prefix-icon="Lock" />
        </el-form-item>
        <el-button type="primary" class="login-btn" :loading="loading" @click="onSubmit">登 录</el-button>
      </el-form>
      <el-alert class="tip" type="info" :closable="false"
        title="默认管理员：admin / admin123，学生账号由管理员创建" />
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';
import request from '../api/request';
import { useUserStore } from '../stores/user';

const router = useRouter();
const route = useRoute();
const store = useUserStore();
const formRef = ref();
const loading = ref(false);
const form = reactive({ username: '', password: '' });
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
};

async function onSubmit() {
  await formRef.value.validate().catch(() => Promise.reject());
  loading.value = true;
  try {
    const data = await request.post('/auth/login', form);
    store.setAuth(data.token, data.user);
    ElMessage.success(`欢迎，${data.user.name}`);
    if (route.query.redirect) {
      router.push(String(route.query.redirect));
    } else {
      router.push(data.user.role === 'admin' ? '/admin/dashboard' : '/checkin');
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-bg {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1f6feb 0%, #6db3f2 100%);
}
.login-card {
  width: 380px;
  padding: 12px 8px;
}
.login-title {
  text-align: center;
  margin: 8px 0 24px;
  color: #303133;
}
.login-btn {
  width: 100%;
}
.tip {
  margin-top: 16px;
}
</style>
