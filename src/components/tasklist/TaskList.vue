<script setup lang="ts">
import type { Task, TaskStats } from '@/types/task'
import TaskCard from './TaskCard.vue'

defineProps<{
  tasks: Task[]
  stats: TaskStats
}>()

defineEmits<{
  'update:task': [id: number, updates: Partial<Task>]
  'delete:task': [id: number]
  'toggle:subtask': [taskId: number, subtaskId: number]
  'update:status': [id: number, status: Task['status']]
}>()
</script>

<template>
  <VCard elevation="2">
    <VCardTitle class="text-h5 font-weight-bold text-grey-darken-3 pa-6 pb-0">
      รายการงาน
    </VCardTitle>
    
    <VCardText class="pa-6">
      <div v-if="tasks.length === 0" class="text-center py-12">
        <VIcon
          icon="tabler-clipboard-list"
          size="64"
          color="grey-lighten-2"
          class="mb-4"
        />
        <h3 class="text-h6 font-weight-medium text-grey-darken-1 mb-2">
          ยังไม่มีงานในระบบ
        </h3>
        <p class="text-body-2 text-grey-darken-1">
          เริ่มต้นด้วยการเพิ่มงานใหม่
        </p>
      </div>
      
      <div v-else>
        <TaskCard
          v-for="task in tasks"
          :key="task.id"
          :task="task"
          @update:task="$emit('update:task', task.id, $event)"
          @delete:task="$emit('delete:task', $event)"
          @toggle:subtask="$emit('toggle:subtask', $event.taskId, $event.subtaskId)"
          @update:status="$emit('update:status', task.id, $event)"
        />
      </div>
    </VCardText>
  </VCard>
</template>
