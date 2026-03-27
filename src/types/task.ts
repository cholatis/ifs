export interface Task {
  id: number
  title: string
  description?: string
  priority: 'high' | 'medium' | 'low'
  status: 'todo' | 'in-progress' | 'completed'
  progress: number
  deadline?: string
  createdAt: Date
  subtasks?: Subtask[]
}

export interface Subtask {
  id: number
  title: string
  completed: boolean
}

export interface TaskStats {
  total: number
  completed: number
  inProgress: number
  highPriority: number
}

export interface TaskFilters {
  status: string
  priority: string
  sortBy: string
}



