<script setup lang="ts">
import type { Task, Subtask } from '@/types/task'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  'submit': [taskData: Omit<Task, 'id' | 'createdAt' | 'progress'>]
  'close': []
}>()

const form = ref({
  title: '',
  description: '',
  priority: 'medium' as Task['priority'],
  deadline: ''
})

const currentSubtasks = ref<Subtask[]>([])
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
  const taskData: Omit<Task, 'id' | 'createdAt' | 'progress'> = {
    title: form.value.title,
    description: form.value.description || undefined,
    priority: form.value.priority,
    status: 'todo',
    deadline: form.value.deadline || undefined,
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
      <VCardTitle class="text-2xl font-bold text-gray-800">
        เพิ่มงานใหม่
      </VCardTitle>
      
      <VCardText>
        <VForm @submit.prevent="handleSubmit">
          <VTextField
            v-model="form.title"
            label="ชื่องาน"
            placeholder="ระบุชื่องาน"
            required
            variant="outlined"
            class="mb-4"
          />
          
          <VTextarea
            v-model="form.description"
            label="รายละเอียด"
            placeholder="รายละเอียดงาน (ไม่บังคับ)"
            rows="3"
            variant="outlined"
            class="mb-4"
          />
          
          <VSelect
            v-model="form.priority"
            label="ความสำคัญ"
            :items="[
              { title: 'ต่ำ', value: 'low' },
              { title: 'ปานกลาง', value: 'medium' },
              { title: 'สูง', value: 'high' }
            ]"
            variant="outlined"
            class="mb-4"
          />
          
          <VTextField
            v-model="form.deadline"
            label="กำหนดส่ง"
            type="date"
            variant="outlined"
            class="mb-4"
          />
          
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">งานย่อย (Subtasks)</label>
            <div class="space-y-2 mb-3">
              <div
                v-for="subtask in currentSubtasks"
                :key="subtask.id"
                class="flex items-center gap-2 p-2 bg-gray-50 rounded"
              >
                <span class="text-sm flex-1">{{ subtask.title }}</span>
                <VBtn
                  type="button"
                  color="error"
                  variant="text"
                  size="small"
                  @click="removeSubtask(subtask.id)"
                >
                  ✕
                </VBtn>
              </div>
            </div>
            <div class="flex gap-2">
              <VTextField
                v-model="newSubtaskTitle"
                placeholder="เพิ่มงานย่อย..."
                variant="outlined"
                density="compact"
                class="flex-1"
                @keypress="handleKeyPress"
              />
              <VBtn
                type="button"
                color="success"
                @click="addSubtask"
                class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                ➕
              </VBtn>
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
          ยกเลิก
        </VBtn>
        <VBtn
          color="primary"
          @click="handleSubmit"
          class="flex-1"
        >
          เพิ่มงาน
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>



