<script setup lang="ts">
import type { Task } from '@/types/task'

const props = defineProps<{
  task: Task
}>()

const emit = defineEmits<{
  'update:task': [updates: Partial<Task>]
  'delete:task': [id: number]
  'toggle:subtask': [taskId: number, subtaskId: number]
  'update:status': [status: Task['status']]
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

const getStatusText = (status: string) => {
  switch (status) {
    case 'todo': return 'รอดำเนินการ'
    case 'in-progress': return 'กำลังดำเนินการ'
    case 'completed': return 'เสร็จแล้ว'
    default: return ''
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'todo': return 'grey'
    case 'in-progress': return 'warning'
    case 'completed': return 'success'
    default: return 'grey'
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

const handleStatusChange = (newStatus: string) => {
  emit('update:status', newStatus as Task['status'])
}

const handleDelete = () => {
  emit('delete:task', props.task.id)
}

const handleSubtaskToggle = (subtaskId: number) => {
  emit('toggle:subtask', props.task.id, subtaskId)
}
</script>

<template>
  <VCard 
    class="mb-4 task-card" 
    elevation="2"
    :class="`priority-${task.priority}`"
  >
    <VCardText class="pa-6">
      <!-- Header -->
      <div class="d-flex justify-space-between align-start mb-4">
        <div class="flex-grow-1">
          <div class="d-flex align-center mb-2">
            <VChip
              :color="getPriorityColor(task.priority)"
              size="small"
              class="me-2"
            >
              {{ getPriorityText(task.priority) }}
            </VChip>
            <h3 class="text-h6 font-weight-semibold text-grey-darken-3 mb-0">
              {{ task.title }}
            </h3>
            <VChip
              v-if="isOverdue(task.deadline)"
              color="error"
              size="small"
              class="ms-2"
            >
              เกินกำหนด
            </VChip>
          </div>
          
          <p v-if="task.description" class="text-body-2 text-grey-darken-1 mb-3">
            {{ task.description }}
          </p>
          
          <div class="d-flex flex-wrap gap-2 mb-3">
            <VChip
              :color="getStatusColor(task.status)"
              variant="tonal"
              size="small"
            >
              {{ getStatusText(task.status) }}
            </VChip>
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
          </div>
        </div>
        
        <VBtn
          color="error"
          variant="text"
          size="small"
          @click="handleDelete"
          prepend-icon="tabler-trash"
        >
          ลบ
        </VBtn>
      </div>
      
      <!-- Subtasks -->
      <div v-if="task.subtasks && task.subtasks.length > 0" class="mb-4">
        <h4 class="text-subtitle-2 font-weight-medium text-grey-darken-2 mb-3">
          งานย่อย (Subtasks)
        </h4>
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
      <div class="mb-4">
        <div class="d-flex justify-space-between align-center mb-2">
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
          height="8"
          rounded
        />
      </div>
      
      <!-- Status Selector -->
      <VSelect
        :model-value="task.status"
        @update:model-value="handleStatusChange"
        :items="[
          { title: 'รอดำเนินการ', value: 'todo' },
          { title: 'กำลังดำเนินการ', value: 'in-progress' },
          { title: 'เสร็จแล้ว', value: 'completed' }
        ]"
        variant="outlined"
        density="compact"
        hide-details
      />
    </VCardText>
  </VCard>
</template>

<style scoped>
.task-card {
  transition: all 0.3s ease;
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

.subtasks-container {
  max-height: 200px;
  overflow-y: auto;
}
</style>
