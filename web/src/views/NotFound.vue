<template>
  <div class="notfound">
    <div class="code">404</div>
    <p class="text">页面不存在或已被移除</p>
    <el-button type="primary" @click="router.replace('/')">返回首页</el-button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<style scoped>
.notfound {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 80px 0;
}
.code {
  color: var(--lab-line, #e5ded2);
  font-size: 96px;
  font-weight: 800;
  line-height: 1;
}
.text {
  margin: 0 0 8px;
  color: var(--lab-muted, #7e8985);
}
</style>
