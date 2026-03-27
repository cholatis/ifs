<script setup lang="ts">
import type { Task } from '@/types/tasklist2'

const props = defineProps<{ task: Task }>()
const emit = defineEmits<{ 'update:status': [status: string], 'delete': [], 'toggle:subtask': [subtaskId: number], 'edit': [] }>()

const getStatusColor = (s: string) => s === 'completed' ? 'success' : s === 'in-progress' ? 'warning' : 'grey'
const getPriorityText = (p: string) => p === 'high' ? 'สูง' : p === 'medium' ? 'ปานกลาง' : 'ต่ำ'
const isOverdue = (d?: string) => !!d && new Date(d) < new Date() && new Date(d).toDateString() !== new Date().toDateString()
const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('th-TH') : ''
</script>

<template>
  <VCard class="mb-4 task-card" elevation="2" :class="`priority-${task.priority}`">
    <VCardText class="pa-4">
      <!-- บรรทัดที่ 1: Status, Project Info, Action Buttons -->
      <div class="d-flex justify-space-between align-center mb-3">
        <div class="d-flex align-center flex-wrap gap-2 flex-grow-1">
          <!-- Status Chips -->
          <VChip :color="getStatusColor(task.status)" size="small" class="me-1">
            {{ task.status === 'todo' ? 'รอดำเนินการ' : task.status === 'in-progress' ? 'กำลังดำเนินการ' : 'เสร็จแล้ว' }}
          </VChip>
          <VChip v-if="isOverdue(task.deadline)" color="error" size="small" class="me-1">เกินกำหนด</VChip>
          
          <!-- Project Info -->
          <VChip v-if="task.project_name" color="primary" variant="tonal" size="small" prepend-icon="tabler-folder" class="me-1">
            {{ task.project_name }}
          </VChip>
          <VChip v-if="task.assignee" color="success" variant="tonal" size="small" prepend-icon="tabler-user" class="me-1">
            ผู้รับผิดชอบ: {{ task.assignee }}
          </VChip>
          <VChip v-if="task.owner" color="secondary" variant="tonal" size="small" prepend-icon="tabler-id" class="me-1">
            เจ้าของงาน: {{ task.owner }}
          </VChip>
        </div>
        
        <!-- Action Buttons -->
        <div class="d-flex gap-1">
          <VBtn color="primary" variant="text" size="small" prepend-icon="tabler-edit" @click="$emit('edit')">แก้ไข</VBtn>
          <VBtn color="error" variant="text" size="small" prepend-icon="tabler-trash" @click="$emit('delete')">ลบ</VBtn>
        </div>
      </div>

      <!-- บรรทัดที่ 2: Details, Progress, Status Dropdown -->
      <div class="d-flex align-center gap-3 flex-wrap">
        <!-- Details Section -->
        <div class="d-flex align-center gap-2 flex-grow-1">
          <VChip color="info" variant="tonal" size="small">ความสำคัญ: {{ getPriorityText(task.priority) }}</VChip>
          <VChip v-if="task.deadline" color="primary" variant="tonal" size="small" prepend-icon="tabler-calendar">
            {{ formatDate(task.deadline) }}
          </VChip>
        </div>

        <!-- Progress Section -->
        <div class="d-flex align-center gap-2" style="min-width: 200px;">
          <span class="text-caption text-grey-darken-1">ความคืบหน้า</span>
          <VProgressLinear :model-value="task.progress" color="primary" height="6" rounded style="flex: 1; max-width: 120px;" />
          <span class="text-caption font-weight-medium text-grey-darken-2" style="min-width: 35px;">{{ task.progress }}%</span>
        </div>

        <!-- Status Dropdown -->
        <VSelect 
          :model-value="task.status" 
          :items="[
            { title: 'รอดำเนินการ', value: 'todo' },
            { title: 'กำลังดำเนินการ', value: 'in-progress' },
            { title: 'เสร็จแล้ว', value: 'completed' }
          ]" 
          density="compact" 
          variant="outlined" 
          hide-details
          style="min-width: 150px;"
          @update:model-value="$emit('update:status', $event)" 
        />
      </div>

      <!-- Subtasks (Collapsible - Optional) -->
      <div v-if="task.subtasks?.length" class="mt-3">
        <VExpansionPanels variant="accordion" density="compact">
          <VExpansionPanel>
            <VExpansionPanelTitle>
              <span class="text-caption">งานย่อย ({{ task.subtasks.filter(s => s.completed).length }}/{{ task.subtasks.length }})</span>
            </VExpansionPanelTitle>
            <VExpansionPanelText>
              <div class="subtasks-container">
                <div v-for="st in task.subtasks" :key="st.id" class="d-flex align-center pa-2 rounded border mb-2">
                  <VCheckbox :model-value="st.completed" @update:model-value="$emit('toggle:subtask', st.id)" color="primary" class="me-2" />
                  <span class="text-body-2 flex-grow-1" :class="st.completed ? 'text-decoration-line-through text-grey' : 'text-grey-darken-2'">{{ st.title }}</span>
                  <VIcon v-if="st.completed" icon="tabler-check" color="success" size="16" />
                </div>
              </div>
            </VExpansionPanelText>
          </VExpansionPanel>
        </VExpansionPanels>
      </div>
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



