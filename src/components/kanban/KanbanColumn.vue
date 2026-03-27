<script setup lang="ts">
import type { KanbanColumn } from '@/types/kanban'
import KanbanTaskCard from './KanbanTaskCard.vue'

const props = defineProps<{
  column: KanbanColumn
  isCollapsed: boolean
}>()

defineEmits<{
  'move:task': [taskId: number, newStatus: string]
  'delete:task': [taskId: number]
  'toggle:subtask': [taskId: number, subtaskId: number]
}>()

const getColumnIcon = (columnId: string) => {
  switch (columnId) {
    case 'todo': return 'tabler-clipboard-list'
    case 'inprogress': return 'tabler-clock'
    case 'review': return 'tabler-eye'
    case 'done': return 'tabler-check'
    default: return 'tabler-list'
  }
}
</script>

<template>
  <VCard class="h-100" elevation="2">
    <!-- Column Header -->
    <VCardText 
      :class="`pa-4 text-white`"
      :style="`background: linear-gradient(135deg, var(--v-theme-${column.color}) 0%, var(--v-theme-${column.color}-darken-1) 100%);`"
    >
      <div class="d-flex align-center">
        <VIcon 
          :icon="getColumnIcon(column.id)"
          size="20"
          class="me-2"
        />
        <div>
          <h2 class="text-h6 font-weight-semibold mb-0">{{ column.title }}</h2>
          <p class="text-caption opacity-90 mb-0">{{ column.description }}</p>
        </div>
      </div>
    </VCardText>
    
    <!-- Column Content -->
    <VCardText 
      class="pa-4 kanban-column" 
      :style="isCollapsed ? 'min-height: 60px;' : 'min-height: 400px;'"
    >
      <!-- Collapsed View -->
      <div v-if="isCollapsed" class="text-center py-2">
        <div class="d-flex align-center justify-center">
          <VIcon
            :icon="getColumnIcon(column.id)"
            size="20"
            class="me-2"
          />
          <span class="text-h6 font-weight-medium">{{ column.tasks.length }}</span>
          <span class="text-body-2 text-grey-darken-1 ms-1">tasks</span>
        </div>
      </div>
      
      <!-- Expanded View -->
      <div v-else>
        <div v-if="column.tasks.length === 0" class="text-center py-8">
          <VIcon
            icon="tabler-clipboard-list"
            size="48"
            color="grey-lighten-2"
            class="mb-3"
          />
          <p class="text-body-2 text-grey-darken-1 mb-0">
            No tasks in this column
          </p>
        </div>
        
        <div v-else class="d-flex flex-column gap-3">
          <KanbanTaskCard
            v-for="task in column.tasks"
            :key="task.id"
            :task="task"
            @move:task="$emit('move:task', $event.taskId, $event.newStatus)"
            @delete:task="$emit('delete:task', $event)"
            @toggle:subtask="$emit('toggle:subtask', $event.taskId, $event.subtaskId)"
          />
        </div>
      </div>
    </VCardText>
  </VCard>
</template>

<style scoped>
.kanban-column {
  transition: all 0.3s ease;
  overflow: hidden;
}

.kanban-column.drag-over {
  background-color: rgba(var(--v-theme-primary), 0.1);
  border: 2px dashed rgb(var(--v-theme-primary));
}

/* Smooth collapse/expand animation */
.kanban-column {
  transition: min-height 0.3s ease, padding 0.3s ease;
}
</style>
