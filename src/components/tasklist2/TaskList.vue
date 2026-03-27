<script setup lang="ts">
import type { Task } from '@/types/tasklist2'
import TaskCard from './TaskCard.vue'

defineProps<{ tasks: Task[] }>()
const emit = defineEmits<{ 'update:status': [taskId: number, status: string], 'delete': [taskId: number], 'toggle:subtask': [taskId: number, subtaskId: number], 'edit': [taskId: number] }>()
</script>

<template>
  <VCard elevation="2">
    <VCardTitle class="text-h6 font-weight-bold pa-6 pb-0">รายการงาน</VCardTitle>
    <VCardText class="pa-6">
      <div v-if="!tasks.length" class="text-center py-12">
        <VIcon icon="tabler-clipboard-list" size="64" color="grey-lighten-2" class="mb-4" />
        <div class="text-h6 text-grey-darken-1 mb-1">ยังไม่มีงานในระบบ</div>
        <div class="text-body-2 text-grey-darken-1">เริ่มต้นด้วยการเพิ่มงานใหม่หรือ import จาก Excel</div>
      </div>
      <div v-else>
        <TaskCard v-for="t in tasks" :key="t.id" :task="t" @update:status="s => emit('update:status', t.id, s)" @delete="emit('delete', t.id)" @toggle:subtask="sid => emit('toggle:subtask', t.id, sid)" @edit="emit('edit', t.id)" />
      </div>
    </VCardText>
  </VCard>
</template>



