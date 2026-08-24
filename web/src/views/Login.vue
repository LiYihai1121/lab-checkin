<template>
  <div class="login-bg">
    <div class="login-shell">
      <section class="brand-panel">
        <div class="brand-mark">LC</div>
        <div class="eyebrow">LAB CHECK-IN SYSTEM</div>
        <h1>每一次进入，<br /><em>都有迹可循。</em></h1>
        <p>让实验室出入更清晰，让每一分钟投入都被准确记录。</p>
        <div class="brand-foot"><span class="status-dot"></span> 系统运行中 · 数据实时同步</div>
      </section>
      <el-card class="login-card">
        <div class="form-eyebrow">WELCOME BACK</div>
        <h2 class="login-title">登录工作台</h2>
        <p class="login-subtitle">使用你的实验室账号继续</p>
        <el-form ref="formRef" :model="form" :rules="rules" size="large" @keyup.enter="onSubmit">
          <el-form-item prop="username">
            <el-input v-model="form.username" placeholder="用户名" :prefix-icon="User" />
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" show-password placeholder="密码" :prefix-icon="Lock" />
          </el-form-item>
          <el-button type="primary" class="login-btn" :loading="loading" @click="onSubmit">进入系统</el-button>
        </el-form>
        <router-link class="forgot-link" to="/forgot-password">忘记密码？找回账号</router-link>
        <el-alert class="tip" type="info" :closable="false"
          title="默认管理员：admin / admin123，学生账号由管理员创建" />
      </el-card>
    </div>
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
  min-height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e8e2d6;
  background-image: radial-gradient(#b9aa92 0.7px, transparent 0.7px);
  background-size: 18px 18px;
}
.login-shell {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) 390px;
  width: min(900px, calc(100% - 40px));
  min-height: 500px;
  overflow: hidden;
  border: 1px solid rgba(16, 42, 44, 0.12);
  border-radius: 18px;
  box-shadow: 0 24px 70px rgba(39, 48, 41, 0.16);
}
.brand-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 56px;
  color: #f7f2e9;
  background: #163d3d;
}
.brand-mark {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  margin-bottom: 48px;
  border-radius: 14px;
  color: #163d3d;
  background: #f4c95d;
  font-weight: 800;
}
.eyebrow, .form-eyebrow {
  color: #f4c95d;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
}
.brand-panel h1 {
  margin: 16px 0;
  font-size: 42px;
  line-height: 1.2;
  letter-spacing: 0;
}
.brand-panel h1 em {
  color: #f4c95d;
  font-style: normal;
}
.brand-panel p {
  max-width: 300px;
  color: #b7ceca;
  line-height: 1.8;
}
.brand-foot {
  margin-top: 54px;
  color: #b7ceca;
  font-size: 12px;
}
.status-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 6px;
  border-radius: 50%;
  background: #8ed081;
}
.login-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: auto;
  padding: 40px 36px;
  border: 0;
  border-radius: 0;
  background: #fffdf8;
}
.login-title {
  margin: 12px 0 4px;
  color: #303133;
  font-size: 28px;
}
.login-subtitle {
  margin: 0 0 30px;
  color: #8b9a98;
}
.login-btn {
  width: 100%;
  height: 46px;
  border: 0;
  background: #e7795b;
}
.tip {
  margin-top: 16px;
}
.forgot-link {
  display: block;
  margin-top: 18px;
  color: #47716d;
  font-size: 13px;
  text-align: center;
  text-decoration: none;
}
.forgot-link:hover {
  color: #e7795b;
}
@media (max-width: 680px) {
  .login-bg {
    min-height: 100%;
    padding: 20px 0;
  }
  .login-shell {
    grid-template-columns: 1fr;
    width: min(390px, calc(100% - 28px));
  }
  .brand-panel {
    min-height: 230px;
    padding: 30px;
  }
  .brand-mark {
    margin-bottom: 24px;
  }
  .brand-panel h1 {
    font-size: 30px;
  }
  .brand-panel p, .brand-foot {
    display: none;
  }
}
</style>
