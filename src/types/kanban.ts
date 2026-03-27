export interface KanbanTask {
  id: number
  title: string
  description?: string
  priority: 'high' | 'medium' | 'low'
  assignee?: string
  status: 'todo' | 'inprogress' | 'review' | 'done'
  deadline?: string
  progress: number
  createdAt: Date
  subtasks?: KanbanSubtask[]
}

export interface KanbanSubtask {
  id: number
  title: string
  completed: boolean
}

export interface KanbanStats {
  total: number
  completed: number
  inProgress: number
  efficiency: number
}

export interface KanbanFilters {
  priority: string
  assignee: string
  search: string
}

export interface KanbanColumn {
  id: string
  title: string
  description: string
  color: string
  tasks: KanbanTask[]
}
