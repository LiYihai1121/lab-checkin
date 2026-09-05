import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import 'element-plus/dist/index.css';
import App from './App.vue';
import router from './router';
import { applyEnvIdentity } from './config/env';

// 应用环境标识：标题、控制台横幅（非生产）随构建模式区分三大环境
applyEnvIdentity();

// 图标按需在各组件中显式导入，不再全量注册
createApp(App).use(createPinia()).use(router).use(ElementPlus, { locale: zhCn }).mount('#app');
