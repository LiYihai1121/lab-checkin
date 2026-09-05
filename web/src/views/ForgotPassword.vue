<template>
  <div class="recovery-bg">
    <el-card class="recovery-card">
      <router-link class="back-link" to="/login">← 返回登录</router-link>
      <div class="recovery-mark">?</div>
      <div class="eyebrow">ACCOUNT RECOVERY</div>
      <h1>忘记密码</h1>
      <p class="lead">你的账号由实验室管理员统一管理。</p>

      <div class="steps">
        <div class="step active"><span>01</span><div><b>联系管理员</b><small>说明需要恢复的账号</small></div></div>
        <div class="step"><span>02</span><div><b>重置密码</b><small>管理员在用户管理中操作</small></div></div>
        <div class="step"><span>03</span><div><b>重新登录</b><small>使用新密码进入系统</small></div></div>
      </div>

      <el-alert
        title="请先联系管理员获取一次性找回码，找回码 15 分钟内有效。"
        type="info"
        :closable="false"
        show-icon
      />
      <el-form ref="formRef" class="recovery-form" :model="form" :rules="rules" @keyup.enter="onSubmit">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" />
        </el-form-item>
        <el-form-item prop="resetCode">
          <el-input v-model="form.resetCode" placeholder="管理员提供的 12 位找回码" maxlength="12" />
        </el-form-item>
        <el-form-item prop="newPassword">
          <el-input v-model="form.newPassword" type="password" show-password placeholder="新密码（至少 6 位）" />
        </el-form-item>
        <el-button class="login-btn" type="primary" :loading="loading" @click="onSubmit">重置密码</el-button>
      </el-form>
      <el-button class="back-button" link @click="router.push('/login')">返回登录</el-button>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { useRouter } from 'vue-router';
import request from '../api/request';

const router = useRouter();
const formRef = ref<FormInstance>();
const loading = ref(false);
const form = reactive({ username: '', resetCode: '', newPassword: '' });
const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  resetCode: [{ required: true, message: '请输入找回码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码至少 6 位', trigger: 'blur' }
  ]
};

async function onSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  loading.value = true;
  try {
    await request.post('/auth/password/reset', form);
    ElMessage.success('密码重置成功，请使用新密码登录');
    router.push('/login');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.recovery-bg {
  min-height: 100%;
  display: grid;
  place-items: center;
  padding: 24px;
  box-sizing: border-box;
  background: #e8e2d6;
  background-image: radial-gradient(#b9aa92 0.7px, transparent 0.7px);
  background-size: 18px 18px;
}
.recovery-card {
  width: min(440px, 100%);
  padding: 30px 34px;
  border: 0;
  border-radius: 16px;
  background: #fffdf8;
  box-shadow: 0 24px 70px rgba(39, 48, 41, 0.16);
}
.back-link {
  color: #6c7e79;
  font-size: 13px;
  text-decoration: none;
}
.recovery-mark {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  margin: 34px 0 22px;
  border-radius: 14px;
  color: #163d3d;
  background: #f4c95d;
  font-size: 24px;
  font-weight: 800;
}
.eyebrow {
  color: #e7795b;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.8px;
}
h1 {
  margin: 10px 0 6px;
  color: #163d3d;
  font-size: 30px;
}
.lead {
  margin: 0 0 28px;
  color: #87928d;
}
.steps {
  display: grid;
  gap: 14px;
  margin-bottom: 26px;
}
.step {
  display: flex;
  align-items: center;
  gap: 14px;
  color: #a5ada7;
}
.step span {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #eeeae1;
  font-size: 11px;
  font-weight: 800;
}
.step.active {
  color: #163d3d;
}
.step.active span {
  color: #163d3d;
  background: #f4c95d;
}
.step b, .step small {
  display: block;
}
.step b {
  font-size: 14px;
}
.step small {
  margin-top: 3px;
  color: #9ca6a0;
  font-size: 12px;
}
.login-btn {
  width: 100%;
  height: 44px;
  margin-top: 22px;
  border: 0;
  background: #e7795b;
}
.recovery-form {
  margin-top: 20px;
}
.back-button {
  display: block;
  margin: 12px auto 0;
}
@media (max-width: 480px) {
  .recovery-card {
    padding: 26px 22px;
  }
}
</style>
