<script setup lang="ts">
import { onMounted } from 'vue'
import { useTasks } from '@/composables/useTasks'
import TaskListHeader from '@/components/tasklist/TaskListHeader.vue'
import StatsDashboard from '@/components/tasklist/StatsDashboard.vue'
import TaskFilters from '@/components/tasklist/TaskFilters.vue'
import TaskList from '@/components/tasklist/TaskList.vue'
import AddTaskModal from '@/components/tasklist/AddTaskModal.vue'

definePage({
  meta: {
    layout: 'default',
  },
})

const {
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
  updateFilters
} = useTasks()

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
    <TaskListHeader @add-task="handleAddTask" />

    <!-- Stats Dashboard -->
    <StatsDashboard :stats="stats" />

    <!-- Filter and Sort -->
    <TaskFilters 
      :filters="filters" 
      @update:filters="updateFilters" 
    />

    <!-- Tasks List -->
    <TaskList 
      :tasks="filteredTasks"
      :stats="stats"
      @update:task="updateTask"
      @delete:task="deleteTask"
      @toggle:subtask="toggleSubtask"
      @update:status="updateTaskStatus"
    />

    <!-- Add Task Modal -->
    <AddTaskModal 
      v-model:show="showAddTaskModal"
      @submit="handleTaskSubmit"
      @close="handleCloseModal"
    />
  </div>
</template>

<style scoped>
/* Component-specific styles can be added here if needed */
</style>
