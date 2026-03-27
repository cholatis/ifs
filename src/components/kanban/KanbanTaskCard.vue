<script setup lang="ts">
import type { KanbanTask } from '@/types/kanban'

const props = defineProps<{
  task: KanbanTask
}>()

const emit = defineEmits<{
  'move:task': [taskId: number, newStatus: string]
  'delete:task': [taskId: number]
  'toggle:subtask': [taskId: number, subtaskId: number]
}>()

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'error'
    case 'medium': return 'warning'
    case 'low': return 'success'
    default: return 'grey'
  }
}

const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'high': return 'สูง'
    case 'medium': return 'ปานกลาง'
    case 'low': return 'ต่ำ'
    default: return ''
  }
}

const formatDate = (dateString?: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('th-TH')
}

const isOverdue = (deadline?: string) => {
  if (!deadline) return false
  return new Date(deadline) < new Date() && new Date(deadline).toDateString() !== new Date().toDateString()
}

const handleSubtaskToggle = (subtaskId: number) => {
  emit('toggle:subtask', props.task.id, subtaskId)
}

const handleDragStart = (event: DragEvent) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', props.task.id.toString())
    event.dataTransfer.effectAllowed = 'move'
  }
}

const handleDelete = () => {
  emit('delete:task', props.task.id)
}
</script>

<template>
  <VCard
    class="task-card cursor-move"
    elevation="1"
    draggable="true"
    @dragstart="handleDragStart"
    :class="`priority-${task.priority}`"
  >
    <VCardText class="pa-4">
      <!-- Header -->
      <div class="d-flex justify-space-between align-start mb-2">
        <div class="d-flex align-center gap-2">
          <VChip
            :color="getPriorityColor(task.priority)"
            size="small"
            class="me-2"
          >
            {{ getPriorityText(task.priority) }}
          </VChip>
          <h4 class="text-subtitle-2 font-weight-semibold text-grey-darken-3 mb-0">
            {{ task.title }}
          </h4>
          <VChip
            v-if="isOverdue(task.deadline)"
            color="error"
            size="small"
            class="ms-2"
          >
            เกินกำหนด
          </VChip>
        </div>
        <VBtn
          color="error"
          variant="text"
          size="x-small"
          icon="tabler-trash"
          @click="handleDelete"
        >
          ลบ
        </VBtn>
      </div>
      
      <p v-if="task.description" class="text-body-2 text-grey-darken-1 mb-3">
        {{ task.description }}
      </p>
      
      <!-- Status and Info Chips -->
      <div class="d-flex flex-wrap gap-2 mb-3">
        <VChip
          v-if="task.deadline"
          color="info"
          variant="tonal"
          size="small"
          prepend-icon="tabler-calendar"
        >
          {{ formatDate(task.deadline) }}
        </VChip>
        <VChip
          v-if="task.subtasks && task.subtasks.length > 0"
          color="success"
          variant="tonal"
          size="small"
          prepend-icon="tabler-list"
        >
          {{ task.subtasks.filter(st => st.completed).length }}/{{ task.subtasks.length }} งานย่อย
        </VChip>
        <VChip
          v-if="task.assignee"
          color="primary"
          variant="tonal"
          size="small"
          prepend-icon="tabler-user"
        >
          {{ task.assignee }}
        </VChip>
      </div>
      
      <!-- Subtasks -->
      <div v-if="task.subtasks && task.subtasks.length > 0" class="mb-3">
        <h5 class="text-caption font-weight-medium text-grey-darken-2 mb-2">
          งานย่อย (Subtasks)
        </h5>
        <div class="subtasks-container">
          <div
            v-for="subtask in task.subtasks"
            :key="subtask.id"
            class="d-flex align-center pa-2 rounded border mb-2"
          >
            <VCheckbox
              :model-value="subtask.completed"
              @update:model-value="handleSubtaskToggle(subtask.id)"
              color="primary"
              class="me-3"
            />
            <span 
              class="text-body-2 flex-grow-1"
              :class="subtask.completed ? 'text-decoration-line-through text-grey' : 'text-grey-darken-2'"
            >
              {{ subtask.title }}
            </span>
            <VIcon
              v-if="subtask.completed"
              icon="tabler-check"
              color="success"
              size="16"
            />
          </div>
        </div>
      </div>
      
      <!-- Progress Bar -->
      <div class="mb-3">
        <div class="d-flex justify-space-between align-center mb-1">
          <span class="text-caption text-grey-darken-1">
            ความคืบหน้า {{ task.subtasks && task.subtasks.length > 0 ? '(คำนวณจาก Subtasks)' : '' }}
          </span>
          <span class="text-caption font-weight-medium text-grey-darken-2">
            {{ task.progress }}%
          </span>
        </div>
        <VProgressLinear
          :model-value="task.progress"
          color="primary"
          height="6"
          rounded
        />
      </div>
    </VCardText>
  </VCard>
</template>

<style scoped>
.task-card {
  transition: all 0.2s ease;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.priority-high {
  border-left: 4px solid rgb(var(--v-theme-error));
}

.priority-medium {
  border-left: 4px solid rgb(var(--v-theme-warning));
}

.priority-low {
  border-left: 4px solid rgb(var(--v-theme-success));
}

.cursor-move {
  cursor: move;
}

.subtasks-container {
  max-height: 150px;
  overflow-y: auto;
}
</style>
