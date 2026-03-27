import type { Subtask, Task, TaskFilters, TaskStats } from '@/types/task'
import { computed, ref } from 'vue'

export const useTasks = () => {
  const tasks = ref<Task[]>([])
  const taskIdCounter = ref(1)
  const subtaskIdCounter = ref(1)
  const filters = ref<TaskFilters>({
    status: 'all',
    priority: 'all',
    sortBy: 'created'
  })

  // Sample data initialization
  const initializeSampleData = () => {
    const sampleTasks: Task[] = [
      {
        id: taskIdCounter.value++,
        title: "ออกแบบ UI/UX สำหรับแอปพลิเคชันใหม่",
        description: "สร้าง wireframe และ mockup สำหรับแอปพลิเคชันมือถือ",
        priority: "high",
        status: "in-progress",
        progress: 60,
        deadline: "2024-01-15",
        createdAt: new Date("2024-01-01"),
        subtasks: [
          { id: subtaskIdCounter.value++, title: "วิเคราะห์ความต้องการผู้ใช้", completed: true },
          { id: subtaskIdCounter.value++, title: "สร้าง User Journey Map", completed: true },
          { id: subtaskIdCounter.value++, title: "ออกแบบ Wireframe", completed: true },
          { id: subtaskIdCounter.value++, title: "สร้าง Mockup หน้าหลัก", completed: false },
          { id: subtaskIdCounter.value++, title: "ออกแบบ Icon และ Graphics", completed: false }
        ]
      },
      {
        id: taskIdCounter.value++,
        title: "เขียนเอกสารคู่มือการใช้งาน",
        description: "จัดทำคู่มือการใช้งานระบบสำหรับผู้ใช้งาน",
        priority: "medium",
        status: "todo",
        progress: 0,
        deadline: "2024-01-20",
        createdAt: new Date("2024-01-02"),
        subtasks: [
          { id: subtaskIdCounter.value++, title: "เขียนบทนำและภาพรวม", completed: false },
          { id: subtaskIdCounter.value++, title: "จัดทำคู่มือการติดตั้ง", completed: false },
          { id: subtaskIdCounter.value++, title: "เขียนคู่มือการใช้งานพื้นฐาน", completed: false },
          { id: subtaskIdCounter.value++, title: "สร้าง FAQ", completed: false }
        ]
      },
      {
        id: taskIdCounter.value++,
        title: "ทดสอบระบบและแก้ไข bug",
        description: "ทำการทดสอบและแก้ไขปัญหาที่พบ",
        priority: "high",
        status: "todo",
        progress: 0,
        deadline: "2024-01-18",
        createdAt: new Date("2024-01-03"),
        subtasks: [
          { id: subtaskIdCounter.value++, title: "ทดสอบ Unit Testing", completed: false },
          { id: subtaskIdCounter.value++, title: "ทดสอบ Integration Testing", completed: false },
          { id: subtaskIdCounter.value++, title: "ทดสอบ User Acceptance", completed: false }
        ]
      }
    ]

    tasks.value = sampleTasks
  }

  // Calculate progress from subtasks
  const calculateProgress = (subtasks: Subtask[]): number => {
    if (!subtasks || subtasks.length === 0) return 0
    const completed = subtasks.filter(st => st.completed).length
    return Math.round((completed / subtasks.length) * 100)
  }

  // Update task status based on progress
  const updateTaskStatusFromProgress = (task: Task) => {
    if (task.progress === 100) {
      task.status = 'completed'
    } else if (task.progress > 0) {
      task.status = 'in-progress'
    } else {
      task.status = 'todo'
    }
  }

  // Add new task
  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'progress'>) => {
    const newTask: Task = {
      id: taskIdCounter.value++,
      ...taskData,
      progress: taskData.subtasks ? calculateProgress(taskData.subtasks) : 0,
      createdAt: new Date()
    }
    
    if (newTask.subtasks && newTask.subtasks.length > 0) {
      updateTaskStatusFromProgress(newTask)
    }
    
    tasks.value.push(newTask)
  }

  // Update task
  const updateTask = (id: number, updates: Partial<Task>) => {
    const taskIndex = tasks.value.findIndex(t => t.id === id)
    if (taskIndex !== -1) {
      tasks.value[taskIndex] = { ...tasks.value[taskIndex], ...updates }
    }
  }

  // Delete task
  const deleteTask = (id: number) => {
    tasks.value = tasks.value.filter(t => t.id !== id)
  }

  // Toggle subtask
  const toggleSubtask = (taskId: number, subtaskId: number) => {
    const task = tasks.value.find(t => t.id === taskId)
    if (task && task.subtasks) {
      const subtask = task.subtasks.find(st => st.id === subtaskId)
      if (subtask) {
        subtask.completed = !subtask.completed
        task.progress = calculateProgress(task.subtasks)
        updateTaskStatusFromProgress(task)
      }
    }
  }

  // Update task status
  const updateTaskStatus = (id: number, status: Task['status']) => {
    const task = tasks.value.find(t => t.id === id)
    if (task) {
      task.status = status
      if (status === 'completed') {
        task.progress = 100
      }
    }
  }

  // Filtered and sorted tasks
  const filteredTasks = computed(() => {
    let filtered = tasks.value

    if (filters.value.status !== 'all') {
      filtered = filtered.filter(task => task.status === filters.value.status)
    }

    if (filters.value.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === filters.value.priority)
    }

    return getSortedTasks(filtered)
  })

  // Sort tasks
  const getSortedTasks = (tasksToSort: Task[]) => {
    return [...tasksToSort].sort((a, b) => {
      switch (filters.value.sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        case 'deadline':
          if (!a.deadline && !b.deadline) return 0
          if (!a.deadline) return 1
          if (!b.deadline) return -1
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        case 'progress':
          return b.progress - a.progress
        case 'created':
        default:
          return b.createdAt.getTime() - a.createdAt.getTime()
      }
    })
  }

  // Statistics
  const stats = computed<TaskStats>(() => {
    const total = tasks.value.length
    const completed = tasks.value.filter(t => t.status === 'completed').length
    const inProgress = tasks.value.filter(t => t.status === 'in-progress').length
    const highPriority = tasks.value.filter(t => t.priority === 'high').length

    return { total, completed, inProgress, highPriority }
  })

  // Update filters
  const updateFilters = (newFilters: Partial<TaskFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  return {
    tasks,
    filters,
    filteredTasks,
    stats,
    initializeSampleData,
    addTask,
    updateTask,
    deleteTask,
    toggleSubtask,
    updateTaskStatus,
    updateFilters,
    calculateProgress
  }
}



