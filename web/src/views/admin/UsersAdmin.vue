<template>
  <el-card>
    <div class="toolbar">
      <el-input v-model="keyword" placeholder="搜索用户名 / 姓名" clearable style="width: 220px"
        @keyup.enter="load(1)" />
      <el-button type="primary" :icon="Search" @click="load(1)">查询</el-button>
      <el-button type="success" :icon="Plus" @click="openAdd">新增用户</el-button>
    </div>

    <el-table :data="list" stripe v-loading="tableLoading">
      <el-table-column prop="username" label="用户名" width="160" />
      <el-table-column prop="name" label="姓名" width="140" />
      <el-table-column label="角色" width="100">
        <template #default="{ row }">
          <el-tag :type="row.role === 'admin' ? 'danger' : 'primary'">
            {{ row.role === 'admin' ? '管理员' : '学生' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180" />
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="warning" @click="resetPwd(row)">重置密码</el-button>
          <el-button size="small" type="info" :loading="codeLoadingId === row.id" @click="issueResetCode(row)">生成找回码</el-button>
          <el-button size="small" type="danger" :disabled="row.id === store.user?.id"
            @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination class="pager" background layout="total, prev, pager, next"
      :total="total" :page-size="pageSize" :current-page="page" @current-change="load" />
  </el-card>

  <!-- 新增/编辑弹窗 -->
  <el-dialog v-model="dialog.visible" :title="dialog.isEdit ? '编辑用户' : '新增用户'" width="420px">
    <el-form ref="dialogFormRef" :model="dialog.form" :rules="dialogRules" label-width="80px">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="dialog.form.username" :disabled="dialog.isEdit" placeholder="2-20 位字母数字下划线" />
      </el-form-item>
      <el-form-item label="姓名" prop="name">
        <el-input v-model="dialog.form.name" />
      </el-form-item>
      <el-form-item label="角色" prop="role">
        <el-select v-model="dialog.form.role" style="width: 100%">
          <el-option label="学生" value="student" />
          <el-option label="管理员" value="admin" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="!dialog.isEdit" label="初始密码" prop="password">
        <el-input v-model="dialog.form.password" placeholder="至少 6 位" show-password />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialog.visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
    </template>
  </el-dialog>

  <!-- 重置密码弹窗 -->
  <el-dialog v-model="pwdDialog.visible" title="重置密码" width="380px">
    <el-input v-model="pwdDialog.password" placeholder="新密码（至少 6 位）" show-password @keyup.enter="onResetPwd" />
    <template #footer>
      <el-button @click="pwdDialog.visible = false">取消</el-button>
      <el-button type="primary" :loading="pwdSaving" @click="onResetPwd">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { h, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search } from '@element-plus/icons-vue';
import request from '../../api/request';
import { useUserStore } from '../../stores/user';

const store = useUserStore();
const list = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const keyword = ref('');
const tableLoading = ref(false);
const saving = ref(false);
const pwdSaving = ref(false);
const codeLoadingId = ref(null);

const dialogFormRef = ref();
const dialog = reactive({
  visible: false,
  isEdit: false,
  id: null,
  form: { username: '', name: '', role: 'student', password: '' }
});
const dialogRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { pattern: /^[A-Za-z0-9_]{2,20}$/, message: '用户名需为 2-20 位字母、数字或下划线', trigger: 'blur' }
  ],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  password: [
    { required: true, message: '请输入初始密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ]
};
const pwdDialog = reactive({ visible: false, id: null, password: '' });

async function load(p = page.value) {
  page.value = p;
  tableLoading.value = true;
  try {
    const data = await request.get('/users', { params: { page: p, pageSize: pageSize.value, keyword: keyword.value } });
    list.value = data.list;
    total.value = data.total;
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    tableLoading.value = false;
  }
}

function openAdd() {
  dialog.isEdit = false;
  dialog.id = null;
  Object.assign(dialog.form, { username: '', name: '', role: 'student', password: '' });
  dialog.visible = true;
}

function openEdit(row) {
  dialog.isEdit = true;
  dialog.id = row.id;
  Object.assign(dialog.form, { username: row.username, name: row.name, role: row.role, password: '' });
  dialog.visible = true;
}

async function onSave() {
  const valid = await dialogFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    if (dialog.isEdit) {
      await request.put(`/users/${dialog.id}`, { name: dialog.form.name, role: dialog.form.role });
      ElMessage.success('保存成功');
    } else {
      await request.post('/users', dialog.form);
      ElMessage.success('创建成功');
    }
    dialog.visible = false;
    load(dialog.isEdit ? page.value : 1);
  } finally {
    saving.value = false;
  }
}

function resetPwd(row) {
  pwdDialog.id = row.id;
  pwdDialog.password = '';
  pwdDialog.visible = true;
}

async function onResetPwd() {
  if (pwdDialog.password.length < 6) return ElMessage.warning('密码至少 6 位');
  pwdSaving.value = true;
  try {
    await request.put(`/users/${pwdDialog.id}`, { password: pwdDialog.password });
    ElMessage.success('密码已重置');
    pwdDialog.visible = false;
  } finally {
    pwdSaving.value = false;
  }
}

async function issueResetCode(row) {
  if (codeLoadingId.value) return;
  codeLoadingId.value = row.id;
  try {
    const data = await request.post(`/users/${row.id}/password-reset-token`);
    // 用 VNode 渲染多行内容（alert 默认按纯文本处理 \n 不换行）
    await ElMessageBox.alert(
      h('div', null, [
        h('p', { style: 'margin:0 0 6px' }, `找回码：${data.code}`),
        h('p', { style: 'margin:0 0 6px' }, `有效期至：${data.expiresAt}`),
        h('p', { style: 'margin:0' }, `请将找回码安全地交给 ${row.name}。`)
      ]),
      '找回码已生成',
      { confirmButtonText: '知道了' }
    );
  } finally {
    codeLoadingId.value = null;
  }
}

async function onDelete(row) {
  const ok = await ElMessageBox.confirm(`确认删除用户「${row.name}」？其签到记录将一并删除。`, '警告', { type: 'warning' })
    .then(() => true)
    .catch(() => false);
  if (!ok) return;
  await request.delete(`/users/${row.id}`);
  ElMessage.success('删除成功');
  // 删除当前页最后一条后回退一页，避免停留在空页
  if (list.value.length === 1 && page.value > 1) {
    load(page.value - 1);
  } else {
    load(page.value);
  }
}

onMounted(() => load(1));
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.pager {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
