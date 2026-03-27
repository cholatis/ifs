import type { KanbanColumn, KanbanFilters, KanbanStats, KanbanSubtask, KanbanTask } from '@/types/kanban'
import { computed, ref } from 'vue'

export const useKanban = () => {
  const tasks = ref<KanbanTask[]>([])
  const taskIdCounter = ref(1)
  const subtaskIdCounter = ref(1)
  const filters = ref<KanbanFilters>({
    priority: '',
    assignee: '',
    search: ''
  })
  const showDashboard = ref(false)
  const isCollapsed = ref(false)

  // Calculate progress from subtasks
  const calculateProgress = (subtasks: KanbanSubtask[]): number => {
    if (!subtasks || subtasks.length === 0) return 0
    const completed = subtasks.filter(st => st.completed).length
    return Math.round((completed / subtasks.length) * 100)
  }

  // Sample data initialization
  const initializeSampleData = () => {
    const sampleTasks: KanbanTask[] = [
      {
        id: taskIdCounter.value++,
        title: "Design new landing page",
        description: "Create wireframes and mockups for the new product landing page",
        priority: "high",
        assignee: "Sarah Chen",
        status: "todo",
        deadline: "2024-01-15",
        progress: 0,
        createdAt: new Date(),
        subtasks: [
          { id: subtaskIdCounter.value++, title: "Research design trends", completed: false },
          { id: subtaskIdCounter.value++, title: "Create wireframes", completed: false },
          { id: subtaskIdCounter.value++, title: "Design mockups", completed: false }
        ]
      },
      {
        id: taskIdCounter.value++,
        title: "Implement user authentication",
        description: "Set up login and registration functionality",
        priority: "medium",
        assignee: "Mike Johnson",
        status: "inprogress",
        deadline: "2024-01-20",
        progress: 33,
        createdAt: new Date(),
        subtasks: [
          { id: subtaskIdCounter.value++, title: "Setup auth service", completed: true },
          { id: subtaskIdCounter.value++, title: "Create login form", completed: false },
          { id: subtaskIdCounter.value++, title: "Create registration form", completed: false }
        ]
      },
      {
        id: taskIdCounter.value++,
        title: "Write API documentation",
        description: "Document all REST API endpoints",
        priority: "low",
        assignee: "Alex Kim",
        status: "review",
        deadline: "2024-01-25",
        progress: 50,
        createdAt: new Date(),
        subtasks: [
          { id: subtaskIdCounter.value++, title: "Document user endpoints", completed: true },
          { id: subtaskIdCounter.value++, title: "Document auth endpoints", completed: false }
        ]
      },
      {
        id: taskIdCounter.value++,
        title: "Fix mobile responsive issues",
        description: "Resolve layout problems on mobile devices",
        priority: "high",
        assignee: "Sarah Chen",
        status: "done",
        deadline: "2024-01-10",
        progress: 100,
        createdAt: new Date(),
        subtasks: [
          { id: subtaskIdCounter.value++, title: "Fix header layout", completed: true },
          { id: subtaskIdCounter.value++, title: "Fix navigation menu", completed: true },
          { id: subtaskIdCounter.value++, title: "Test on various devices", completed: true }
        ]
      }
    ]

    // Calculate initial progress for each task
    tasks.value = sampleTasks.map(task => ({
      ...task,
      progress: task.subtasks ? calculateProgress(task.subtasks) : 0
    }))
  }

  // Add new task
  const addTask = (taskData: Omit<KanbanTask, 'id' | 'createdAt'>) => {
    const newTask: KanbanTask = {
      id: taskIdCounter.value++,
      ...taskData,
      createdAt: new Date()
    }
    
    tasks.value.push(newTask)
  }

  // Update task
  const updateTask = (id: number, updates: Partial<KanbanTask>) => {
    const taskIndex = tasks.value.findIndex(t => t.id === id)
    if (taskIndex !== -1) {
      tasks.value[taskIndex] = { ...tasks.value[taskIndex], ...updates }
    }
  }

  // Delete task
  const deleteTask = (id: number) => {
    tasks.value = tasks.value.filter(t => t.id !== id)
  }

  // Move task to different status
  const moveTask = (taskId: number, newStatus: KanbanTask['status']) => {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      task.status = newStatus
    }
  }

  // Toggle subtask
  const toggleSubtask = (taskId: number, subtaskId: number) => {
    const task = tasks.value.find(t => t.id === taskId)
    if (task && task.subtasks) {
      const subtask = task.subtasks.find(st => st.id === subtaskId)
      if (subtask) {
        subtask.completed = !subtask.completed
        task.progress = calculateProgress(task.subtasks)
      }
    }
  }

  // Filter tasks based on current filters
  const isTaskVisible = (task: KanbanTask) => {
    if (filters.value.priority && task.priority !== filters.value.priority) return false
    if (filters.value.assignee && task.assignee !== filters.value.assignee) return false
    if (filters.value.search && !task.title.toLowerCase().includes(filters.value.search.toLowerCase())) return false
    return true
  }

  // Get filtered tasks by status
  const getTasksByStatus = (status: KanbanTask['status']) => {
    return tasks.value.filter(task => task.status === status && isTaskVisible(task))
  }

  // Kanban columns configuration
  const columns = computed<KanbanColumn[]>(() => [
    {
      id: 'todo',
      title: 'To Do',
      description: 'Tasks ready to start',
      color: 'primary',
      tasks: getTasksByStatus('todo')
    },
    {
      id: 'inprogress',
      title: 'In Progress',
      description: 'Currently being worked on',
      color: 'warning',
      tasks: getTasksByStatus('inprogress')
    },
    {
      id: 'review',
      title: 'Review',
      description: 'Awaiting feedback',
      color: 'info',
      tasks: getTasksByStatus('review')
    },
    {
      id: 'done',
      title: 'Done',
      description: 'Completed tasks',
      color: 'success',
      tasks: getTasksByStatus('done')
    }
  ])

  // Statistics
  const stats = computed<KanbanStats>(() => {
    const total = tasks.value.length
    const completed = tasks.value.filter(t => t.status === 'done').length
    const inProgress = tasks.value.filter(t => t.status === 'inprogress').length
    const efficiency = total > 0 ? Math.round((completed / total) * 100) : 0

    return { total, completed, inProgress, efficiency }
  })

  // Get unique assignees
  const assignees = computed(() => {
    return [...new Set(tasks.value.map(task => task.assignee).filter(Boolean))]
  })

  // Update filters
  const updateFilters = (newFilters: Partial<KanbanFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  // Toggle dashboard
  const toggleDashboard = () => {
    showDashboard.value = !showDashboard.value
  }

  // Toggle collapse/expand
  const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value
  }

  return {
    tasks,
    filters,
    showDashboard,
    isCollapsed,
    columns,
    stats,
    assignees,
    initializeSampleData,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    toggleSubtask,
    updateFilters,
    toggleDashboard,
    toggleCollapse,
    calculateProgress
  }
}
