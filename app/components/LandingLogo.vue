<script setup lang="ts">
withDefaults(
  defineProps<{
    width?: string;
  }>(),
  { width: '110px' },
);
</script>

<template>
  <WaitlistLogo :width="width" />
</template>
