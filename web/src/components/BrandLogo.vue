<template>
  <div class="brand-logo" :class="{ compact }" aria-label="电子实验室">
    <span class="logo-symbol" aria-hidden="true">
      <i class="node node-one"></i>
      <i class="node node-two"></i>
      <i class="node node-three"></i>
      <i class="trace trace-one"></i>
      <i class="trace trace-two"></i>
    </span>
    <span class="logo-copy">
      <strong>电子实验室</strong>
      <small v-if="!compact">E-LAB CHECK-IN</small>
    </span>
  </div>
</template>

<script setup>
defineProps({
  compact: Boolean
});
</script>

<style scoped>
.brand-logo {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  color: #f7f2e9;
}
.logo-symbol {
  position: relative;
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  overflow: hidden;
  border: 1px solid rgba(244, 201, 93, 0.45);
  border-radius: 12px;
  background: #173f3f;
}
.node,
.trace {
  position: absolute;
  display: block;
}
.node {
  z-index: 1;
  width: 6px;
  height: 6px;
  border: 2px solid #173f3f;
  border-radius: 50%;
  background: #f4c95d;
  box-shadow: 0 0 0 2px rgba(244, 201, 93, 0.2);
}
.node-one { top: 8px; left: 8px; }
.node-two { top: 22px; left: 22px; }
.node-three { top: 8px; right: 7px; }
.trace {
  height: 2px;
  transform-origin: left center;
  background: #f4c95d;
}
.trace-one { top: 12px; left: 13px; width: 17px; transform: rotate(34deg); }
.trace-two { top: 26px; left: 27px; width: 12px; transform: rotate(-50deg); }
.logo-copy {
  display: grid;
  gap: 3px;
  white-space: nowrap;
}
.logo-copy strong {
  color: #fffdf8;
  font-size: 16px;
  line-height: 1;
  letter-spacing: 1px;
}
.logo-copy small {
  color: #8eaaa8;
  font-size: 9px;
  letter-spacing: 1.5px;
}
.brand-logo.compact .logo-symbol {
  width: 34px;
  height: 34px;
  border-radius: 10px;
}
.brand-logo.compact .logo-copy strong {
  font-size: 14px;
}
</style>
