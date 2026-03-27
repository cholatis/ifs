<script setup lang="ts">
import Header from '@/components/tasklist2/Header.vue'
import StatsDashboard from '@/components/tasklist2/StatsDashboard.vue'
import Filters from '@/components/tasklist2/Filters.vue'
import TaskList from '@/components/tasklist2/TaskList.vue'
import AddTaskModal from '@/components/tasklist2/AddTaskModal.vue'
import ImportModal from '@/components/tasklist2/ImportModal.vue'

import { useTasklist2 } from '@/composables/useTasklist2'
import { nextTick } from 'vue'
import { useExcel } from '@/composables/useExcel'

definePage({
  meta: { layout: 'default' },
})

const {
  tasks,
  filteredTasks,
  stats,
  filters,
  loadFromApi,
  addTask,
  updateTask,
  deleteTask,
  toggleSubtask,
  clearAll,
  updateFilters,
} = useTasklist2()

const { importFromFile, importRawRows } = useExcel()

const showAdd = ref(false)
const showImport = ref(false)
const showPreview = ref(false)
const previewRows = ref<any[]>([])
const previewVersion = ref(0)
const isProcessing = ref(false)
const meEmployeeCode = ref<string>('')

// Project filter data
const projects = ref<Array<{ project_code: string; project_name: string }>>([])
const loadingProjects = ref(false)
const EDGE_PROJECT_URL = '/api/supabase/ListProject'
const projectItems = computed(() => [{ title: 'ทั้งหมด', value: 'all' }, ...projects.value.map(p => ({ title: p.project_name, value: p.project_name }))])

const loadProjects = async () => {
  loadingProjects.value = true
  try {
    const res = await fetch(EDGE_PROJECT_URL, {
      method: 'GET',
      headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    })
    const data = await res.json().catch(() => ({}))
    projects.value = Array.isArray(data?.projects) ? data.projects : []
  } catch (e) {
    console.error('Failed to load projects', e)
    projects.value = []
  } finally {
    loadingProjects.value = false
  }
}

// Edge URLs
const EDGE_GETME_URL = '/api/supabase/getME'
const EDGE_CREATE_TASK_URL = '/api/supabase/createtask'
const EDGE_EMPLOYEE_URL = '/api/supabase/ListEmployee'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1bW55Y2Vrb3J5c3ppeGl0d3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3OTY0NjksImV4cCI6MjA3NzM3MjQ2OX0.6MEy4-37qan-MTaNNBywZ8eAkNXHJ1ZBjebHBJDHZW4'
const editingTaskId = ref<number | null>(null)
// Track external task_id from imported sheets to ensure uniqueness across imports in this session
const importedExternalIds = new Set<number>()

onMounted(() => { loadFromApi(); loadProjects() })

// Employee (assigner) filter data
const employees = ref<Array<{ employee_code: string; full_name: string }>>([])
const loadingEmployees = ref(false)
const employeeItems = computed(() => [{ title: 'ทั้งหมด', value: 'all' }, ...employees.value.map(e => ({ title: `${e.full_name} (${e.employee_code})`, value: e.employee_code }))])

const loadEmployees = async () => {
  loadingEmployees.value = true
  try {
    const res = await fetch(EDGE_EMPLOYEE_URL, {
      method: 'GET',
      headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    })
    const data = await res.json().catch(() => ({}))
    employees.value = Array.isArray(data?.employees) ? data.employees : []
  } catch (e) {
    console.error('Failed to load employees', e)
    employees.value = []
  } finally {
    loadingEmployees.value = false
  }
}

onMounted(() => { loadEmployees() })

const handleImport = async (fileParam: any) => {
  try {
    console.log('[Import] start', fileParam)
    const file = Array.isArray(fileParam) ? fileParam[0] : fileParam
    if (!file) return
    // Read RAW rows so we can map real headers from the file
    const rawRows = await importRawRows(file as File)
    const list = Array.isArray(rawRows) ? rawRows : []
    console.log('[Import] rows read:', Array.isArray(rawRows) ? rawRows.length : 0)

    // Normalize header keys (UPPERCASE/spacing/alternate names)
    const pick = (row: any, candidates: string[]) => {
      if (!row || typeof row !== 'object') return ''
      const keyMap: Record<string, any> = {}
      for (const k of Object.keys(row)) {
        keyMap[k] = row[k]
        keyMap[k.toLowerCase()] = row[k]
        keyMap[k.replace(/\s+/g, '').toLowerCase()] = row[k]
      }
      for (const c of candidates) {
        const v = keyMap[c] ?? keyMap[c.toLowerCase()] ?? keyMap[c.replace(/\s+/g, '').toLowerCase()]
        if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim()
      }
      return ''
    }

    // Force reactive refresh
    previewRows.value = []
    await nextTick()
    previewRows.value = list.map((r: any) => ({
      task_name: pick(r, ['task_name', 'TASK_NAME', 'title', 'TITLE', 'Task Name']),
      task_description: pick(r, ['task_description', 'TASK_DESCRIPTION', 'description', 'DESCRIPTION', 'Task Description']),
      priority: pick(r, ['priority', 'PRIORITY']),
      status: pick(r, ['status', 'STATUS', 'task_status', 'TASK_STATUS']),
      due_date: pick(r, ['due_date', 'DUE_DATE', 'deadline', 'DEADLINE']),
      start_date: pick(r, ['start_date', 'START_DATE', 'start date', 'START DATE']),
      assignee_code: pick(r, ['assignee_code', 'ASSIGNEE_CODE']),
      assignee_name: pick(r, ['assignee_name', 'ASSIGNEE_NAME']),
      parent_project_code: pick(r, ['parent_project_code', 'PARENT_PROJECT_CODE', 'project', 'PROJECT']),
    }))
    console.log('[Import] previewRows prepared:', previewRows.value)

    showImport.value = false
    showPreview.value = true
    previewVersion.value++
  } catch (e: any) {
    console.error('[Import] error', e)
  }
}

const fetchMe = async (): Promise<string> => {
  try {
    const tokenValue = localStorage.getItem('refreshToken') || ''
    const res = await fetch(EDGE_GETME_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ token_value: tokenValue }),
    })
    const data = await res.json()
    return data?.user?.employee_code || ''
  } catch (e) {
    console.error('getME error', e)
    return ''
  }
}

const processImport = async () => {
  console.log('[Process] clicked, previewRows:', previewRows.value)
  isProcessing.value = true
  try {
    meEmployeeCode.value = await fetchMe()
    console.log('[Process] meEmployeeCode:', meEmployeeCode.value)

    for (const r of previewRows.value) {
      const normalizedStatus = String(r.status || '')
        .trim()
        .toLowerCase()
      const apiStatus = normalizedStatus === 'complete' ? 'complete' : 'not start'
      const apiDueDate = r.due_date ? `${String(r.due_date).split('T')[0]}T17:00:00Z` : undefined
      // Format start_date as YYYY-MM-DD (not ISO with time)
      const formatDateOnly = (d?: string): string | undefined => {
        if (!d) return undefined
        try {
          const dt = new Date(d)
          if (isNaN(dt.getTime())) return undefined
          return dt.toISOString().split('T')[0] // Returns YYYY-MM-DD
        } catch {
          return undefined
        }
      }
      const apiStartDate = formatDateOnly(r.start_date)

      const payload: any = {
        task_name: r.task_name,
        task_description: r.task_description,
        priority_level: r.priority,
        status: apiStatus,
        due_date: apiDueDate,
        start_date: apiStartDate || null,
        assigner_code: meEmployeeCode.value || undefined,
        assignee_code: r.assignee_code || undefined,
        current_owner_code: r.assignee_code || undefined,
        current_owner_name: r.assignee_name || undefined,
        parent_project_code: r.parent_project_code || undefined,
        ref_task_id: null,
        created_by_user_id: meEmployeeCode.value || undefined,
        is_active: true,
      }

      try {
        const resp = await fetch(EDGE_CREATE_TASK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(payload),
        })
        if (!resp.ok) {
          const text = await resp.text().catch(() => '')
          console.error('createtask error', resp.status, text, payload)
        }
        else {
          console.log('[Process] createtask success')
        }
      } catch (e) {
        console.error('createtask error', e)
      }
    }

    // refresh list
    await loadFromApi()
    showPreview.value = false
  } finally {
    isProcessing.value = false
  }
}

const handleExport = async () => {
  try {
    // Download template file
    const templatePath = '/workload_template.xlsx'
    const response = await fetch(templatePath)
    if (!response.ok) {
      throw new Error('Failed to fetch template file')
    }
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'workload_template.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    showToastMessage('ดาวน์โหลด Template สำเร็จ', 'success')
  } catch (e: any) {
    console.error('Error downloading template:', e)
    showToastMessage('เกิดข้อผิดพลาดในการดาวน์โหลด Template', 'error')
  }
}

const handleTaskSubmit = (task: any) => {
  if (editingTaskId.value !== null) {
    updateTask(editingTaskId.value, task)
    editingTaskId.value = null
  } else {
    addTask(task)
  }
  showAdd.value = false
}

const handleEditTask = (taskId: number) => {
  editingTaskId.value = taskId
  showAdd.value = true
}

const toastMessage = ref('')
const toastColor = ref<'success' | 'error'>('success')
const showToast = ref(false)

const showToastMessage = (message: string, color: 'success' | 'error' = 'success') => {
  toastMessage.value = message
  toastColor.value = color
  showToast.value = true
}

const handleDeleteTask = async (taskId: number) => {
  try {
    await deleteTask(taskId)
    showToastMessage('ลบงานสำเร็จ', 'success')
    // Refresh list to ensure consistency
    await loadFromApi()
  } catch (e: any) {
    console.error('Error deleting task:', e)
    showToastMessage(e?.message || 'เกิดข้อผิดพลาดในการลบงาน', 'error')
  }
}

// Apply additional project & assigner filters (UI-level) on top of composable's filteredTasks
const filteredTasksByProject = computed(() => {
  const currentFilters: any = (filters as unknown as { value: any }).value || {}
  const project = currentFilters.project || 'all'
  const assigner = currentFilters.assigner || 'all'
  return filteredTasks.value.filter(t => {
    const okProject = !project || project === 'all' ? true : t.project_name === project
    const okAssigner = !assigner || assigner === 'all' ? true : t.assigner_code === assigner
    return okProject && okAssigner
  })
})
</script>

<template>
  <div>
    <Header @import="showImport = true" @export="handleExport" @add-task="showAdd = true" />
    <StatsDashboard :stats="stats" />
    <Filters 
      :filters="filters" 
      :project-items="projectItems" 
      :loading-projects="loadingProjects"
      :employee-items="employeeItems"
      :loading-employees="loadingEmployees"
      @update:filters="updateFilters" 
      @clear="clearAll" 
    />
    <TaskList :tasks="filteredTasksByProject" @update:status="(id, s) => updateTask(id, { status: s })" @delete="handleDeleteTask" @toggle:subtask="(id, sid) => toggleSubtask(id, sid)" @edit="handleEditTask" />

    <AddTaskModal 
      v-model:show="showAdd" 
      :task="editingTaskId !== null ? tasks.find(t => t.id === editingTaskId) : undefined"
      @submit="handleTaskSubmit"
      @close="editingTaskId = null"
    />
    <ImportModal v-model:show="showImport" @import:file="handleImport" @import="handleImport" />

  <!-- Preview Modal -->
  <VDialog v-model="showPreview" max-width="1600">
    <VCard style="overflow: auto;">
      <VCardTitle class="text-h6">ตรวจสอบข้อมูลก่อนนำเข้า</VCardTitle>
      <VCardText>
        <div style="overflow-x: auto;">
        <VTable :key="previewVersion" density="comfortable" class="text-caption" style="min-width: 1200px; white-space: nowrap;">
          <thead>
            <tr>
              <th>#</th>
              <th>task_name</th>
              <th>task_description</th>
              <th>priority</th>
              <th>status</th>
              <th>start_date</th>
              <th>due_date</th>
              <th>assignee_code</th>
              <th>assignee_name</th>
              <th>parent_project_code</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, idx) in previewRows" :key="idx">
              <td>{{ idx + 1 }}</td>
              <td>{{ r.task_name }}</td>
              <td>{{ r.task_description }}</td>
              <td>{{ r.priority }}</td>
              <td>{{ r.status }}</td>
              <td>{{ r.start_date }}</td>
              <td>{{ r.due_date }}</td>
              <td>{{ r.assignee_code }}</td>
              <td>{{ r.assignee_name }}</td>
              <td>{{ r.parent_project_code }}</td>
            </tr>
          </tbody>
        </VTable>
        </div>
      </VCardText>
      <VCardActions>
        <VBtn variant="outlined" color="grey" @click="showPreview = false">ยกเลิก</VBtn>
        <VBtn color="primary" :loading="isProcessing" @click="processImport">Process</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Toast Notification -->
  <VSnackbar v-model="showToast" :color="toastColor" :timeout="3000" location="top">
    {{ toastMessage }}
    <template #actions>
      <VBtn variant="text" @click="showToast = false">ปิด</VBtn>
    </template>
  </VSnackbar>
  </div>
</template>


