import type { Filters, Stats, Subtask, Task, TaskPriority } from '@/types/tasklist2'
import { computed, ref } from 'vue'

export function useTasklist2() {
  const tasks = ref<Task[]>([])
  const filters = ref<Filters>({ status: 'all', priority: 'all', sortBy: 'created' })

  const taskIdCounter = ref(1)
  const subtaskIdCounter = ref(1)

  const calculateProgress = (subtasks?: Subtask[]): number => {
    if (!subtasks || subtasks.length === 0) return 0
    const done = subtasks.filter(s => s.completed).length
    return Math.round((done / subtasks.length) * 100)
  }

  const updateTaskStatusFromProgress = (task: Task) => {
    if (task.progress === 100) task.status = 'completed'
    else if (task.progress > 0) task.status = 'in-progress'
    else task.status = 'todo'
  }

  // ---- API integration ----
  const EDGE_LIST_URL = '/api/supabase/ListAllTask'
  const EDGE_CREATE_URL = '/api/supabase/createtask'
  const EDGE_DELETE_URL = '/api/supabase/deletetask'
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1bW55Y2Vrb3J5c3ppeGl0d3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3OTY0NjksImV4cCI6MjA3NzM3MjQ2OX0.6MEy4-37qan-MTaNNBywZ8eAkNXHJ1ZBjebHBJDHZW4'

  const normalizePriority = (p?: string): TaskPriority => {
    const s = (p || '').toLowerCase()
    if (s.includes('high') || s.includes('สูง')) return 'high'
    if (s.includes('low') || s.includes('ต่ำ')) return 'low'
    return 'medium'
  }

  const normalizeStatus = (s?: string): 'todo' | 'in-progress' | 'completed' => {
    const v = (s || '').toLowerCase()
    if (v.includes('not') || v.includes('start')) return 'todo'
    if (v.includes('progress') || v.includes('doing')) return 'in-progress'
    if (v.includes('done') || v.includes('complete')) return 'completed'
    return 'todo'
  }

  const loadFromApi = async () => {
    try {
      const res = await fetch(EDGE_LIST_URL, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      })
      if (!res.ok) throw new Error('Failed to fetch tasks')
      const data = await res.json()
      const incoming = Array.isArray(data?.tasks) ? data.tasks : []

      // Helper to normalize date fields (handle null, undefined, or ISO strings)
      const normalizeDate = (date: any): string | undefined => {
        if (!date || date === null) return undefined
        // If already in YYYY-MM-DD format, return as is
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return date
        }
        // If ISO string, extract YYYY-MM-DD
        if (typeof date === 'string' && date.includes('T')) {
          return date.split('T')[0]
        }
        return undefined
      }

      const mapped: Task[] = incoming.map((t: any) => ({
        id: taskIdCounter.value++,
        task_id: t.task_id, // Store backend task_id
        title: t.task_name,
        description: t.task_description || undefined,
        project_name: t.parent_project_code || undefined,
        assignee: t.assignee_code || undefined,
        owner: t.current_owner_name || t.current_owner_code || t.assignee_code || undefined,
        assigner_code: t.assigner_code || undefined,
        priority: normalizePriority(t.priority_level),
        status: normalizeStatus(t.status),
        deadline: normalizeDate(t.due_date),
        start_date: normalizeDate(t.start_date),
        createdAt: t.created_time ? new Date(t.created_time) : new Date(),
        progress: 0,
        subtasks: [],
      }))

      tasks.value = mapped
    } catch (e) {
      // fallback to empty or keep existing
      console.error(e)
      if (!tasks.value.length) tasks.value = []
    }
  }

  const toEdgeDate = (d?: string): string | undefined => {
    if (!d) return undefined
    // Convert YYYY-MM-DD to ISO Zulu midnight
    try {
      const dt = new Date(d)
      if (isNaN(dt.getTime())) return undefined
      return new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0)).toISOString()
    } catch {
      return undefined
    }
  }

  const createTaskInApi = async (payload: Omit<Task, 'id' | 'createdAt'>): Promise<any | null> => {
    try {
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

      const body = {
        task_name: payload.title,
        task_description: payload.description ?? '',
        priority_level: payload.priority,
        status: 'not start',
        due_date: toEdgeDate(payload.deadline) ?? null,
        start_date: formatDateOnly(payload.start_date) ?? null,
        assigner_code: payload.owner ?? null,
        assignee_code: payload.assignee ?? null,
        current_owner_code: payload.owner ?? payload.assignee ?? null,
        current_owner_name: payload.owner ?? null,
        parent_project_code: payload.project_name ?? null,
        ref_task_id: null,
        created_by_user_id: payload.owner ?? null,
        is_active: true,
      }
      const res = await fetch(EDGE_CREATE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to create task')
      const data = await res.json()
      return data?.task ?? null
    } catch (e) {
      console.error(e)
      return null
    }
  }

  const addTask = async (data: Omit<Task, 'id' | 'createdAt'>) => {
    // Create main task via API
    const created = await createTaskInApi(data)
    const task: Task = {
      ...data,
      id: taskIdCounter.value++,
      task_id: created?.task_id, // Store backend task_id from API
      createdAt: created?.created_time ? new Date(created.created_time) : new Date(),
    }
    task.progress = calculateProgress(task.subtasks)
    updateTaskStatusFromProgress(task)
    tasks.value.push(task)

    // Create subtasks as child tasks if any
    if (Array.isArray(data.subtasks) && data.subtasks.length) {
      for (const st of data.subtasks) {
        try {
          const stBody = {
            task_name: st.title,
            task_description: '',
            priority_level: data.priority,
            status: st.completed ? 'complete' : 'not start',
            due_date: toEdgeDate(data.deadline) ?? null,
            assigner_code: data.owner ?? null,
            assignee_code: data.assignee ?? null,
            current_owner_code: data.owner ?? data.assignee ?? null,
            current_owner_name: data.owner ?? null,
            parent_project_code: data.project_name ?? null,
            ref_task_id: created?.task_id ?? null,
            created_by_user_id: data.owner ?? null,
            is_active: true,
          }
          await fetch(EDGE_CREATE_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify(stBody),
          })
        } catch (e) {
          console.error('Failed to create subtask', e)
        }
      }
    }
  }

  const updateTask = (taskId: number, patch: Partial<Task>) => {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return
    Object.assign(task, patch)
    if (patch.subtasks) {
      task.progress = calculateProgress(task.subtasks)
      updateTaskStatusFromProgress(task)
    }
  }

  const deleteTask = async (taskId: number) => {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return

    // If task has backend task_id, call API to delete
    if (task.task_id) {
      try {
        const res = await fetch(EDGE_DELETE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ task_id: task.task_id }),
        })
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to delete task')
        }
        const data = await res.json()
        if (!data.success) {
          throw new Error(data.error || 'Delete failed')
        }
      } catch (e) {
        console.error('Error deleting task:', e)
        // Show error to user or handle as needed
        throw e
      }
    }

    // Remove from local state
    tasks.value = tasks.value.filter(t => t.id !== taskId)
  }

  const toggleSubtask = (taskId: number, subtaskId: number) => {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task || !task.subtasks) return
    const st = task.subtasks.find(s => s.id === subtaskId)
    if (!st) return
    st.completed = !st.completed
    task.progress = calculateProgress(task.subtasks)
    updateTaskStatusFromProgress(task)
  }

  const addSubtask = (taskId: number, title: string) => {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return
    if (!task.subtasks) task.subtasks = []
    task.subtasks.push({ id: subtaskIdCounter.value++, title, completed: false })
    task.progress = calculateProgress(task.subtasks)
    updateTaskStatusFromProgress(task)
  }

  const removeSubtask = (taskId: number, subtaskId: number) => {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task || !task.subtasks) return
    task.subtasks = task.subtasks.filter(s => s.id !== subtaskId)
    task.progress = calculateProgress(task.subtasks)
    updateTaskStatusFromProgress(task)
  }

  const filteredTasks = computed(() => {
    let out = [...tasks.value]
    if (filters.value.status !== 'all') out = out.filter(t => t.status === filters.value.status)
    if (filters.value.priority !== 'all') out = out.filter(t => t.priority === filters.value.priority)

    switch (filters.value.sortBy) {
      case 'priority': {
        const order: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 }
        out.sort((a, b) => order[b.priority] - order[a.priority])
        break
      }
      case 'deadline':
        out.sort((a, b) => {
          if (!a.deadline && !b.deadline) return 0
          if (!a.deadline) return 1
          if (!b.deadline) return -1
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        })
        break
      case 'progress':
        out.sort((a, b) => b.progress - a.progress)
        break
      case 'created':
      default:
        out.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    }
    return out
  })

  const stats = computed<Stats>(() => {
    const total = tasks.value.length
    const completed = tasks.value.filter(t => t.status === 'completed').length
    const inProgress = tasks.value.filter(t => t.status === 'in-progress').length
    const highPriority = tasks.value.filter(t => t.priority === 'high').length
    return { total, completed, inProgress, highPriority }
  })

  const clearAll = () => {
    tasks.value = []
    taskIdCounter.value = 1
    subtaskIdCounter.value = 1
  }

  const updateFilters = (patch: Partial<Filters>) => {
    filters.value = { ...filters.value, ...patch }
  }

  return {
    // state
    tasks,
    filters,
    filteredTasks,
    stats,
    // init
    initializeSampleData: () => {},
    loadFromApi,
    // mutations
    addTask,
    updateTask,
    deleteTask,
    toggleSubtask,
    addSubtask,
    removeSubtask,
    clearAll,
    // filters
    updateFilters,
  }
}



