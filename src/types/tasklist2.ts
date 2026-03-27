export interface Subtask {
  id: number
  title: string
  completed: boolean
}

export type TaskPriority = 'high' | 'medium' | 'low'
export type TaskStatus = 'todo' | 'in-progress' | 'completed'

export interface Task {
  id: number
  task_id?: string // Backend task_id from API
  title: string
  description?: string
  project_name?: string
  assignee?: string
  owner?: string
  assigner_code?: string
  priority: TaskPriority
  status: TaskStatus
  deadline?: string
  start_date?: string
  progress: number
  createdAt: Date
  subtasks?: Subtask[]
}

export interface Stats {
  total: number
  completed: number
  inProgress: number
  highPriority: number
}

export interface Filters {
  status: 'all' | TaskStatus
  priority: 'all' | TaskPriority
  sortBy: 'created' | 'priority' | 'deadline' | 'progress'
  project?: 'all' | string
  assigner?: 'all' | string
}


