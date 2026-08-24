<template>
  <el-card>
    <div class="toolbar">
      <el-input v-model="keyword" placeholder="搜索用户名 / 姓名" clearable style="width: 220px"
        @keyup.enter="load(1)" />
      <el-button type="primary" :icon="Search" @click="load(1)">查询</el-button>
      <el-button type="success" :icon="Plus" @click="openAdd">新增用户</el-button>
    </div>

    <el-table :data="list" stripe>
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
          <el-button size="small" type="info" @click="issueResetCode(row)">生成找回码</el-button>
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
    <el-form :model="dialog.form" label-width="80px">
      <el-form-item label="用户名">
        <el-input v-model="dialog.form.username" :disabled="dialog.isEdit" placeholder="2-20 位字母数字下划线" />
      </el-form-item>
      <el-form-item label="姓名">
        <el-input v-model="dialog.form.name" />
      </el-form-item>
      <el-form-item label="角色">
        <el-select v-model="dialog.form.role" style="width: 100%">
          <el-option label="学生" value="student" />
          <el-option label="管理员" value="admin" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="!dialog.isEdit" label="初始密码">
        <el-input v-model="dialog.form.password" placeholder="至少 6 位" show-password />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialog.visible = false">取消</el-button>
      <el-button type="primary" @click="onSave">保存</el-button>
    </template>
  </el-dialog>

  <!-- 重置密码弹窗 -->
  <el-dialog v-model="pwdDialog.visible" title="重置密码" width="380px">
    <el-input v-model="pwdDialog.password" placeholder="新密码（至少 6 位）" show-password />
    <template #footer>
      <el-button @click="pwdDialog.visible = false">取消</el-button>
      <el-button type="primary" @click="onResetPwd">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
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

const dialog = reactive({
  visible: false,
  isEdit: false,
  id: null,
  form: { username: '', name: '', role: 'student', password: '' }
});
const pwdDialog = reactive({ visible: false, id: null, password: '' });

async function load(p = page.value) {
  page.value = p;
  const data = await request.get('/users', { params: { page: p, pageSize: pageSize.value, keyword: keyword.value } });
  list.value = data.list;
  total.value = data.total;
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
  if (dialog.isEdit) {
    await request.put(`/users/${dialog.id}`, { name: dialog.form.name, role: dialog.form.role });
    ElMessage.success('保存成功');
  } else {
    await request.post('/users', dialog.form);
    ElMessage.success('创建成功');
  }
  dialog.visible = false;
  load(dialog.isEdit ? page.value : 1);
}

function resetPwd(row) {
  pwdDialog.id = row.id;
  pwdDialog.password = '';
  pwdDialog.visible = true;
}

async function onResetPwd() {
  if (pwdDialog.password.length < 6) return ElMessage.warning('密码至少 6 位');
  await request.put(`/users/${pwdDialog.id}`, { password: pwdDialog.password });
  ElMessage.success('密码已重置');
  pwdDialog.visible = false;
}

async function issueResetCode(row) {
  const data = await request.post(`/users/${row.id}/password-reset-token`);
  await ElMessageBox.alert(
    `找回码：${data.code}\n有效期至：${data.expiresAt}\n请将找回码安全地交给 ${row.name}。`,
    '找回码已生成',
    { confirmButtonText: '知道了' }
  );
}

async function onDelete(row) {
  await ElMessageBox.confirm(`确认删除用户「${row.name}」？其签到记录将一并删除。`, '警告', { type: 'warning' })
    .catch(() => Promise.reject());
  await request.delete(`/users/${row.id}`);
  ElMessage.success('删除成功');
  load(page.value);
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
