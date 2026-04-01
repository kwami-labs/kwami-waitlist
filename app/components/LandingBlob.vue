<script setup lang="ts">
defineProps<{
  phoneProgress?: number;
}>();
</script>

<template>
  <WaitlistBlob :phone-progress="phoneProgress" />
</template>
