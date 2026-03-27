<script setup lang="ts">
import { onMounted } from 'vue'
import { useKanban } from '@/composables/useKanban'
import KanbanHeader from '@/components/kanban/KanbanHeader.vue'
import KanbanDashboard from '@/components/kanban/KanbanDashboard.vue'
import KanbanFilters from '@/components/kanban/KanbanFilters.vue'
import KanbanBoard from '@/components/kanban/KanbanBoard.vue'
import AddTaskModal from '@/components/kanban/AddTaskModal.vue'

definePage({
  meta: {
    layout: 'default',
  },
})

const {
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
  toggleCollapse
} = useKanban()

const showAddTaskModal = ref(false)

const handleAddTask = () => {
  showAddTaskModal.value = true
}

const handleCloseModal = () => {
  showAddTaskModal.value = false
}

const handleTaskSubmit = (taskData: any) => {
  addTask(taskData)
  handleCloseModal()
}

onMounted(() => {
  initializeSampleData()
})
</script>

<template>
  <div>
    <!-- Header -->
    <KanbanHeader 
      :is-collapsed="isCollapsed"
      @add-task="handleAddTask"
      @toggle-dashboard="toggleDashboard"
      @toggle-collapse="toggleCollapse"
    />

    <!-- Dashboard Section -->
    <KanbanDashboard 
      v-if="showDashboard"
      :stats="stats"
    />

    <!-- Filters and Controls -->
    <KanbanFilters 
      :filters="filters"
      :assignees="assignees"
      @update:filters="updateFilters"
    />

    <!-- Kanban Board -->
    <KanbanBoard 
      :columns="columns"
      :is-collapsed="isCollapsed"
      @move:task="moveTask"
      @delete:task="deleteTask"
      @toggle:subtask="toggleSubtask"
    />

    <!-- Add Task Modal -->
    <AddTaskModal 
      v-model:show="showAddTaskModal"
      @submit="handleTaskSubmit"
      @close="handleCloseModal"
    />
  </div>
</template>
