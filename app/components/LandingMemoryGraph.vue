<script setup lang="ts">
type MemoryNode = { id: string; label: string; type: string };
type MemoryEdge = { source: string; target: string; relation: string };
type MemoryGraph = { nodes: MemoryNode[]; edges: MemoryEdge[] };

defineProps<{
  graph: MemoryGraph;
}>();
</script>

<template>
  <WaitlistMemoryGraph3D :graph="graph" />
</template>
