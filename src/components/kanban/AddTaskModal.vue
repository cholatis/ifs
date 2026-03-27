<script setup lang="ts">
import type { KanbanTask, KanbanSubtask } from '@/types/kanban'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  'submit': [taskData: Omit<KanbanTask, 'id' | 'createdAt'>]
  'close': []
}>()

const form = ref({
  title: '',
  description: '',
  priority: 'medium' as KanbanTask['priority'],
  assignee: '',
  deadline: ''
})

const currentSubtasks = ref<KanbanSubtask[]>([])
const subtaskIdCounter = ref(1)
const newSubtaskTitle = ref('')

const show = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

const addSubtask = () => {
  const title = newSubtaskTitle.value.trim()
  if (title) {
    currentSubtasks.value.push({
      id: subtaskIdCounter.value++,
      title: title,
      completed: false
    })
    newSubtaskTitle.value = ''
  }
}

const removeSubtask = (subtaskId: number) => {
  currentSubtasks.value = currentSubtasks.value.filter(st => st.id !== subtaskId)
}

const handleSubmit = () => {
  const taskData: Omit<KanbanTask, 'id' | 'createdAt'> = {
    title: form.value.title,
    description: form.value.description || undefined,
    priority: form.value.priority,
    assignee: form.value.assignee || undefined,
    deadline: form.value.deadline || undefined,
    status: 'todo',
    progress: 0,
    subtasks: currentSubtasks.value.length > 0 ? [...currentSubtasks.value] : undefined
  }
  
  emit('submit', taskData)
  resetForm()
}

const resetForm = () => {
  form.value = {
    title: '',
    description: '',
    priority: 'medium',
    assignee: '',
    deadline: ''
  }
  currentSubtasks.value = []
  newSubtaskTitle.value = ''
}

const handleClose = () => {
  show.value = false
  resetForm()
  emit('close')
}

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    addSubtask()
  }
}
</script>

<template>
  <VDialog v-model="show" max-width="500" persistent>
    <VCard>
      <VCardTitle class="text-h5 font-weight-bold text-grey-darken-3">
        ➕ Add New Task
      </VCardTitle>
      
      <VCardText>
        <VForm @submit.prevent="handleSubmit">
          <VTextField
            v-model="form.title"
            label="Task Title"
            placeholder="Enter task title"
            required
            variant="outlined"
            class="mb-4"
          />
          
          <VTextarea
            v-model="form.description"
            label="Description"
            placeholder="Task description (optional)"
            rows="3"
            variant="outlined"
            class="mb-4"
          />
          
          <VSelect
            v-model="form.priority"
            label="Priority"
            :items="[
              { title: '🟢 Low Priority', value: 'low' },
              { title: '🟡 Medium Priority', value: 'medium' },
              { title: '🔴 High Priority', value: 'high' }
            ]"
            variant="outlined"
            class="mb-4"
          />
          
          <VTextField
            v-model="form.assignee"
            label="Assignee"
            placeholder="Assign to team member"
            variant="outlined"
            class="mb-4"
          />
          
          <VTextField
            v-model="form.deadline"
            label="Deadline"
            type="date"
            variant="outlined"
            class="mb-4"
          />
          
          <!-- Subtasks Section -->
          <div class="mt-4">
            <h4 class="text-subtitle-1 font-weight-medium text-grey-darken-2 mb-3">
              งานย่อย (Subtasks)
            </h4>
            
            <!-- Add Subtask -->
            <div class="d-flex gap-2 mb-3">
              <VTextField
                v-model="newSubtaskTitle"
                label="เพิ่มงานย่อย"
                variant="outlined"
                density="compact"
                hide-details
                @keypress="handleKeyPress"
                class="flex-grow-1"
              />
              <VBtn
                color="primary"
                variant="tonal"
                @click="addSubtask"
                :disabled="!newSubtaskTitle.trim()"
              >
                เพิ่ม
              </VBtn>
            </div>
            
            <!-- Subtasks List -->
            <div v-if="currentSubtasks.length > 0" class="subtasks-list">
              <div
                v-for="subtask in currentSubtasks"
                :key="subtask.id"
                class="d-flex align-center pa-2 rounded border mb-2"
              >
                <span class="text-body-2 flex-grow-1">{{ subtask.title }}</span>
                <VBtn
                  color="error"
                  variant="text"
                  size="small"
                  icon="tabler-x"
                  @click="removeSubtask(subtask.id)"
                />
              </div>
            </div>
          </div>
        </VForm>
      </VCardText>
      
      <VCardActions>
        <VBtn
          color="grey"
          variant="outlined"
          @click="handleClose"
          class="flex-1"
        >
          Cancel
        </VBtn>
        <VBtn
          color="primary"
          @click="handleSubmit"
          class="flex-1"
        >
          Add Task
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
