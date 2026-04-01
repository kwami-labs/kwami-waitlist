<script setup lang="ts">
defineProps<{
  progress: number;
}>();
</script>

<template>
  <WaitlistPhone :progress="progress" />
</template>
