<script setup lang="ts">
import type { Task } from '@/types/tasklist2'
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps<{ show: boolean, task?: Task }>()
const emit = defineEmits<{ 'update:show': [v: boolean], 'submit': [task: Omit<Task, 'id' | 'createdAt'>], 'close': [] }>()

const show = computed({ get: () => props.show, set: v => emit('update:show', v) })

const isEditMode = computed(() => !!props.task)

const form = ref({ title: '', description: '', project_name: '', assignee: '', owner: '', priority: 'medium' as const, deadline: '', start_date: '' })
const projectItems = ref<{ title: string, value: string }[]>([])
const employeeItems = ref<{ title: string, value: string }[]>([])
const subtasks = ref<{ id: number, title: string, completed: boolean }[]>([])
const nextId = ref(1)
const newSubtask = ref('')

const reset = () => {
  form.value = { title: '', description: '', project_name: '', assignee: '', owner: '', priority: 'medium', deadline: '', start_date: '' }
  subtasks.value = []
  nextId.value = 1
  newSubtask.value = ''
}

// Load task data when editing
watch(() => props.task, (task) => {
  if (task) {
    form.value = {
      title: task.title,
      description: task.description || '',
      project_name: task.project_name || '',
      assignee: task.assignee || '',
      owner: task.owner || task.assignee || '',
      priority: task.priority,
      deadline: task.deadline || '',
      start_date: task.start_date || '',
    }
    subtasks.value = task.subtasks ? [...task.subtasks] : []
    // Find max subtask ID to continue numbering
    if (subtasks.value.length > 0) {
      nextId.value = Math.max(...subtasks.value.map(s => s.id)) + 1
    } else {
      nextId.value = 1
    }
  }
}, { immediate: true })

// Load project list from Edge Function
const EDGE_PROJECT_URL = '/api/supabase/ListProject'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1bW55Y2Vrb3J5c3ppeGl0d3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3OTY0NjksImV4cCI6MjA3NzM3MjQ2OX0.6MEy4-37qan-MTaNNBywZ8eAkNXHJ1ZBjebHBJDHZW4'

const loadProjects = async () => {
  try {
    const res = await fetch(EDGE_PROJECT_URL, {
      headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    })
    if (!res.ok) return
    const data = await res.json()
    const projects = Array.isArray(data?.projects) ? data.projects : []
    projectItems.value = projects.map((p: any) => ({ title: p.project_name, value: p.project_name }))
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => loadProjects())

// Load employee list for assignee/owner
const EDGE_EMP_URL = '/api/supabase/ListEmployee'

const loadEmployees = async () => {
  try {
    const res = await fetch(EDGE_EMP_URL, {
      headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    })
    if (!res.ok) return
    const data = await res.json()
    const employees = Array.isArray(data?.employees) ? data.employees : []
    employeeItems.value = employees.map((e: any) => ({ title: `${e.full_name} (${e.employee_code})`, value: e.employee_code }))
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => loadEmployees())

// If owner not set, follow assignee by default
watch(() => form.value.assignee, v => {
  if (!form.value.owner) form.value.owner = v
})

const addSubtask = () => {
  const t = newSubtask.value.trim()
  if (!t) return
  subtasks.value.push({ id: nextId.value++, title: t, completed: false })
  newSubtask.value = ''
}
const removeSubtask = (id: number) => { subtasks.value = subtasks.value.filter(s => s.id !== id) }

const onSubmit = () => {
  const task: Omit<Task, 'id' | 'createdAt'> = {
    title: form.value.title,
    description: form.value.description || undefined,
    project_name: form.value.project_name || undefined,
    assignee: form.value.assignee || undefined,
    owner: (form.value.owner || form.value.assignee) || undefined,
    priority: form.value.priority,
    status: isEditMode.value ? props.task!.status : 'todo',
    deadline: form.value.deadline || undefined,
    start_date: form.value.start_date || undefined,
    progress: isEditMode.value ? props.task!.progress : 0,
    subtasks: subtasks.value.length ? [...subtasks.value] : undefined,
  }
  emit('submit', task)
  reset()
}

const close = () => { 
  show.value = false
  reset()
  emit('close') 
}
</script>

<template>
  <VDialog v-model="show" max-width="560" persistent>
    <VCard>
      <VCardTitle class="text-h6 font-weight-bold">{{ isEditMode ? 'แก้ไขงาน' : 'เพิ่มงานใหม่' }}</VCardTitle>
      <VCardText>
        <VForm @submit.prevent="onSubmit">
          <VTextField v-model="form.title" label="ชื่องาน" required variant="outlined" class="mb-4" />
          <VSelect :items="projectItems" v-model="form.project_name" label="โปรเจกต์" variant="outlined" class="mb-4" :loading="!projectItems.length" />
          <VRow class="mb-1" dense>
            <VCol cols="12" md="6">
              <VAutocomplete :items="employeeItems" v-model="form.assignee" label="ผู้รับผิดชอบ (Assignee)" variant="outlined" :loading="!employeeItems.length" />
            </VCol>
            <VCol cols="12" md="6">
              <VAutocomplete :items="employeeItems" v-model="form.owner" label="เจ้าของงาน (Owner)" variant="outlined" :loading="!employeeItems.length" />
            </VCol>
          </VRow>
          <VTextarea v-model="form.description" label="รายละเอียด" rows="3" variant="outlined" class="mb-4" />
          <VSelect v-model="form.priority" label="ความสำคัญ" :items="[
            { title: 'ต่ำ', value: 'low' },
            { title: 'ปานกลาง', value: 'medium' },
            { title: 'สูง', value: 'high' }
          ]" variant="outlined" class="mb-4" />
          <VTextField v-model="form.start_date" label="วันที่เริ่มงาน" type="date" variant="outlined" class="mb-4" />
          <VTextField v-model="form.deadline" label="กำหนดส่ง" type="date" variant="outlined" class="mb-4" />

          <div class="mb-2 text-subtitle-2">งานย่อย (Subtasks)</div>
          <div class="d-flex gap-2 mb-3">
            <VTextField v-model="newSubtask" label="เพิ่มงานย่อย" variant="outlined" density="compact" hide-details class="flex-grow-1" @keypress.enter.prevent="addSubtask" />
            <VBtn color="primary" variant="tonal" :disabled="!newSubtask.trim()" @click="addSubtask">เพิ่ม</VBtn>
          </div>
          <div v-if="subtasks.length">
            <div v-for="st in subtasks" :key="st.id" class="d-flex align-center pa-2 rounded border mb-2">
              <span class="text-body-2 flex-grow-1">{{ st.title }}</span>
              <VBtn color="error" variant="text" icon="tabler-x" size="small" @click="removeSubtask(st.id)" />
            </div>
          </div>
        </VForm>
      </VCardText>
      <VCardActions>
        <VBtn color="grey" variant="outlined" @click="close">ยกเลิก</VBtn>
        <VBtn color="primary" @click="onSubmit">{{ isEditMode ? 'บันทึกการแก้ไข' : 'เพิ่มงาน' }}</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
  
</template>



