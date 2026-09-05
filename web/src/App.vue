<template>
  <router-view />
</template>

<style>
:root {
  color-scheme: light;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  --lab-ink: #173d3d;
  --lab-deep: #102a2c;
  --lab-coral: #e7795b;
  --lab-yellow: #f4c95d;
  --lab-paper: #fffdf8;
  --lab-surface: #f4f1ea;
  --lab-line: #e5ded2;
  --lab-muted: #7e8985;
  background: var(--lab-surface);
}

html,
body,
#app {
  height: 100%;
  margin: 0;
}
body {
  min-width: 320px;
  color: #1f2937;
  background: var(--lab-surface);
  background-image:
    linear-gradient(rgba(255, 253, 248, 0.45) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 253, 248, 0.45) 1px, transparent 1px);
  background-size: 28px 28px;
  -webkit-font-smoothing: antialiased;
}

.el-card {
  border: 1px solid var(--lab-line);
  border-radius: 12px;
  background: rgba(255, 253, 248, 0.92);
  box-shadow: 0 12px 32px rgba(39, 48, 41, 0.06);
}
.el-card__header {
  border-bottom-color: var(--lab-line);
  color: var(--lab-ink);
}
.el-button--primary {
  --el-button-bg-color: var(--lab-coral);
  --el-button-border-color: var(--lab-coral);
  --el-button-hover-bg-color: #cf664c;
  --el-button-hover-border-color: #cf664c;
}
.el-input__wrapper,
.el-textarea__inner,
.el-select__wrapper {
  border-radius: 8px;
  box-shadow: 0 0 0 1px var(--lab-line) inset;
}
.el-input__wrapper.is-focus,
.el-select__wrapper.is-focused {
  box-shadow: 0 0 0 1px var(--lab-coral) inset;
}
.el-table {
  --el-table-header-bg-color: #f8f4eb;
  --el-table-row-hover-bg-color: #fff8e7;
  --el-table-border-color: var(--lab-line);
  --el-table-text-color: #344744;
  --el-table-header-text-color: #6d7d77;
  background: transparent;
}
.el-table tr,
.el-table th.el-table__cell,
.el-table td.el-table__cell {
  background: transparent;
}
.el-pagination {
  --el-pagination-button-bg-color: #fffdf8;
  --el-pagination-hover-color: var(--lab-coral);
}
</style>
