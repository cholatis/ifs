import type { Subtask, Task } from '@/types/tasklist2'

export function useExcel() {
  // Return raw rows from sheet 'Tasks' without normalization
  const importRawRows = async (file: File): Promise<any[]> => {
    const XLSX = await import(/* @vite-ignore */ 'xlsx').catch(() => null as any)
    if (!XLSX) throw new Error('Missing dependency: xlsx. Please install it with: pnpm add xlsx')

    const data = await file.arrayBuffer()
    const workbook = XLSX.read(new Uint8Array(data), { type: 'array' })
    const sheet = workbook.Sheets['Tasks']
    if (!sheet) throw new Error('ไม่พบ Sheet "Tasks" ในไฟล์ Excel')
    const rows: any[] = XLSX.utils.sheet_to_json(sheet)
    return rows || []
  }
  const importFromFile = async (file: File): Promise<Task[]> => {
    const XLSX = await import(/* @vite-ignore */ 'xlsx').catch(() => null as any)
    if (!XLSX) throw new Error('Missing dependency: xlsx. Please install it with: pnpm add xlsx')

    const data = await file.arrayBuffer()
    const workbook = XLSX.read(new Uint8Array(data), { type: 'array' })
    const sheet = workbook.Sheets['Tasks']
    if (!sheet) throw new Error('ไม่พบ Sheet "Tasks" ในไฟล์ Excel')

    const rows: any[] = XLSX.utils.sheet_to_json(sheet)
    if (!rows.length) return []

    const mainTasks = rows.filter(r => !r.parent_task_id)
    const subtaskRows = rows.filter(r => r.parent_task_id)

    const taskMap = new Map<number, Task>()
    const tasks: Task[] = []

    mainTasks.forEach((row, idx) => {
      const id = Number(row.task_id ?? idx + 1)
      const task: Task = {
        id,
        title: String(row.title ?? `งานที่ ${idx + 1}`),
        description: row.description ? String(row.description) : undefined,
        priority: ['high', 'medium', 'low'].includes(row.priority) ? row.priority : 'medium',
        status: ['todo', 'in-progress', 'completed'].includes(row.status) ? row.status : 'todo',
        deadline: row.deadline ? formatDateForInput(row.deadline) : undefined,
        createdAt: new Date(),
        subtasks: [],
        progress: 0,
      }
      tasks.push(task)
      taskMap.set(id, task)
    })

    subtaskRows.forEach(row => {
      const parent = taskMap.get(Number(row.parent_task_id))
      if (!parent) return
      const subtask: Subtask = {
        id: Number(row.task_id ?? Math.random() * 1e6),
        title: String(row.title ?? 'งานย่อย'),
        completed: row.completed === true || row.completed === 1 || String(row.completed).toLowerCase() === 'true',
      }
      parent.subtasks!.push(subtask)
    })

    tasks.forEach(task => {
      task.progress = calculateProgress(task.subtasks)
      if (task.progress === 100) task.status = 'completed'
      else if (task.progress > 0) task.status = 'in-progress'
      else task.status = 'todo'
    })

    return tasks
  }

  const exportToFile = async (tasks: Task[], filename = `workload_${new Date().toISOString().slice(0,10)}.xlsx`) => {
    const XLSX = await import(/* @vite-ignore */ 'xlsx').catch(() => null as any)
    if (!XLSX) throw new Error('Missing dependency: xlsx. Please install it with: pnpm add xlsx')

    const rows: any[] = []
    tasks.forEach(task => {
      rows.push({
        task_id: task.id,
        title: task.title,
        description: task.description ?? '',
        parent_task_id: '',
        priority: task.priority,
        status: task.status,
        deadline: task.deadline ?? '',
        completed: '',
        progress: task.progress,
      })
      task.subtasks?.forEach(st => {
        rows.push({
          task_id: st.id,
          title: st.title,
          description: '',
          parent_task_id: task.id,
          priority: '',
          status: '',
          deadline: '',
          completed: st.completed,
          progress: '',
        })
      })
    })

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, 'Tasks')
    XLSX.writeFile(wb, filename)
  }

  const calculateProgress = (subtasks?: Subtask[]) => {
    if (!subtasks || subtasks.length === 0) return 0
    const done = subtasks.filter(s => s.completed).length
    return Math.round((done / subtasks.length) * 100)
  }

  const formatDateForInput = (val: any): string | undefined => {
    try {
      let d: Date
      if (typeof val === 'number') d = new Date((val - 25569) * 86400 * 1000)
      else d = new Date(val)
      return d.toISOString().split('T')[0]
    } catch {
      return undefined
    }
  }

  return { importFromFile, importRawRows, exportToFile }
}



