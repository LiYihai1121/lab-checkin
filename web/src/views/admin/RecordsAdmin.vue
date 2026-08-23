<template>
  <el-card>
    <div class="toolbar">
      <el-date-picker v-model="range" type="daterange" range-separator="至" start-placeholder="开始日期"
        end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 260px" />
      <el-input v-model="keyword" placeholder="用户名 / 姓名" clearable style="width: 200px"
        @keyup.enter="load(1)" />
      <el-button type="primary" :icon="Search" @click="load(1)">查询</el-button>
    </div>

    <el-table :data="list" stripe>
      <el-table-column prop="name" label="姓名" width="120" />
      <el-table-column prop="username" label="用户名" width="140" />
      <el-table-column prop="checkin_time" label="签到时间" width="180" />
      <el-table-column prop="checkout_time" label="签退时间" width="180">
        <template #default="{ row }">{{ row.checkout_time || '—' }}</template>
      </el-table-column>
      <el-table-column label="时长（分钟）" width="110">
        <template #default="{ row }">{{ row.duration_minutes ?? '—' }}</template>
      </el-table-column>
      <el-table-column label="状态">
        <template #default="{ row }">
          <el-tag :type="row.status === 'checked_in' ? 'success' : 'info'">
            {{ row.status === 'checked_in' ? '进行中' : '已完成' }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination class="pager" background layout="total, prev, pager, next"
      :total="total" :page-size="pageSize" :current-page="page" @current-change="load" />
  </el-card>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { Search } from '@element-plus/icons-vue';
import request from '../../api/request';

const list = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const keyword = ref('');
const range = ref(null);

async function load(p = page.value) {
  page.value = p;
  const data = await request.get('/records/all', {
    params: {
      page: p,
      pageSize: pageSize.value,
      keyword: keyword.value,
      start: range.value?.[0],
      end: range.value?.[1]
    }
  });
  list.value = data.list;
  total.value = data.total;
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
