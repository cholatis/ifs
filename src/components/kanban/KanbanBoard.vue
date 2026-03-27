<script setup lang="ts">
import type { KanbanColumn } from '@/types/kanban'
import KanbanColumnComponent from './KanbanColumn.vue'

defineProps<{
  columns: KanbanColumn[]
  isCollapsed: boolean
}>()

const emit = defineEmits<{
  'move:task': [taskId: number, newStatus: string]
  'delete:task': [taskId: number]
  'toggle:subtask': [taskId: number, subtaskId: number]
}>()

// Drag and drop functionality
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'move'
}

const handleDrop = (event: DragEvent, columnId: string) => {
  event.preventDefault()
  const taskId = parseInt(event.dataTransfer!.getData('text/plain'))
  emit('move:task', taskId, columnId)
}
</script>

<template>
  <VRow>
    <VCol
      v-for="column in columns"
      :key="column.id"
      cols="12"
      sm="6"
      md="3"
      @dragover="handleDragOver"
      @drop="handleDrop($event, column.id)"
    >
      <KanbanColumnComponent
        :column="column"
        :is-collapsed="isCollapsed"
        @move:task="$emit('move:task', $event.taskId, $event.newStatus)"
        @delete:task="$emit('delete:task', $event)"
        @toggle:subtask="$emit('toggle:subtask', $event.taskId, $event.subtaskId)"
      />
    </VCol>
  </VRow>
</template>
