<template>
  <div>
    <VSnackbar v-model="toast.visible" :color="toast.color" :timeout="3000" location="top end">
      {{ toast.message }}
    </VSnackbar>

    <VContainer class="py-4" style="max-width: 1400px;">
      <VCard class="mb-4" elevation="2">
        <VCardText>
          <div class="d-flex align-center justify-space-between flex-wrap gap-2 mb-4">
            <div class="text-h5 font-weight-bold">{{ uiConfig.dashboard_title }}</div>
            <div class="d-flex align-center gap-2 flex-wrap">
              <VSelect
                v-model="currentWeeksCount"
                :items="weeksOptions"
                variant="outlined"
                density="compact"
                hide-details
                style="max-width: 150px;"
                @update:model-value="updateWeeksView"
              />
            </div>
          </div>
          <div class="d-flex align-center gap-2 flex-wrap">
            <VTextField v-model="searchFromDate" label="From Date" type="date" variant="outlined" density="compact"
              style="max-width: 180px;" />
            <VTextField v-model="searchToDate" label="To Date" type="date" variant="outlined" density="compact"
              style="max-width: 180px;" />
            <VBtn color="primary" @click="searchByDateRange" :loading="isSearching">
              <VIcon start icon="tabler-search" />
              Search
            </VBtn>
          </div>
        </VCardText>
      </VCard>
      <VCard elevation="2">
        <div style="overflow-x: auto;">
          <div class="schedule-grid">
            <div class="weeks-header">
              <div class="resource-header-cell">Resources</div>
              <div class="weeks-header-grid" :style="{ gridTemplateColumns: `repeat(${weeks.length}, minmax(140px, 1fr))` }">
                <div v-for="week in weeks" :key="week.number" class="week-header">
                  <div class="week-header-month">{{ week.monthYear }}</div>
                  <div class="week-header-week">{{ week.label }}</div>
                  <div class="week-header-dates">
                    {{ formatDateShort(week.startDate) }} - {{ formatDateShort(week.endDate) }}
                  </div>
                </div>
              </div>
            </div>
            <div class="schedule-rows">
              <div v-for="resource in resources" :key="resource" class="schedule-row">
                <div class="resource-name-cell">
                  <VAvatar color="primary" size="32" class="me-2">
                    {{ resource.charAt(3) }}
                  </VAvatar>
                  <span>{{ getResourceDisplayName(resource) }}</span>
                </div>
                <div
                  class="schedule-cells-grid"
                  :style="{ gridTemplateColumns: `repeat(${weeks.length}, minmax(140px, 1fr))` }"
                >
                  <div
                    v-for="week in weeks"
                    :key="`${resource}-${week.number}`"
                    class="schedule-cell"
                    @click="openQuickAdd(resource, week)"
                  >
                    <div class="workload-blocks-container">
                      <VTooltip v-for="item in getWorkloadItems(resource, week.number)" :key="item.id">
                        <template #activator="{ props: tooltipProps }">
                          <div v-bind="tooltipProps" class="workload-block" @click.stop="editWorkload(item)">
                            <div class="workload-project-name">{{ item.tasks_total || 0 }} Tasks</div>
                            <div class="workload-task-name">{{ item.hours_total || 0 }} Hours</div>
                            <div v-if="item.tasks_done !== undefined || item.tasks_in_progress !== undefined || item.tasks_open !== undefined" class="workload-status">
                              <span v-if="item.tasks_done">Done: {{ item.tasks_done }}</span>
                              <span v-if="item.tasks_in_progress">In Progress: {{ item.tasks_in_progress }}</span>
                              <span v-if="item.tasks_open">Open: {{ item.tasks_open }}</span>
                            </div>
                          </div>
                        </template>
                        <template #default>
                          <div class="tooltip-content">
                            <div v-for="(line, index) in getWorkloadTooltipLines(item)" :key="index">{{ line }}</div>
                          </div>
                        </template>
                      </VTooltip>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </VCard>
    </VContainer>

    <!-- New Item Modal -->
    <VDialog v-model="showNewItemModal" max-width="500" persistent>
      <VCard>
        <VCardTitle class="text-h6 font-weight-bold">Add New Workload Item</VCardTitle>
        <VCardText>
          <VForm @submit.prevent="addNewItem">
            <VSelect
              v-model="newItemForm.resource"
              :items="resourceOptions"
              label="Resource"
              variant="outlined"
              class="mb-4"
              required
            />
            <VSelect
              v-model="newItemForm.week"
              :items="weekSelectOptions"
              label="Week"
              variant="outlined"
              class="mb-4"
              required
            />
            <VTextField
              v-model.number="newItemForm.count"
              type="number"
              label="Task Count"
              variant="outlined"
              min="1"
              max="3"
              placeholder="1-3 tasks"
              class="mb-4"
              required
            />
            <VSelect
              v-model="newItemForm.status"
              :items="statusOptions"
              label="Status"
              variant="outlined"
              required
            />
          </VForm>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="outlined" @click="closeNewItemModal">Cancel</VBtn>
          <VBtn color="primary" @click="addNewItem">Add Item</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Add Widget Modal -->
    <VDialog v-model="showAddWidgetModal" max-width="500">
      <VCard>
        <VCardTitle class="text-h6 font-weight-bold">Add Dashboard Widget</VCardTitle>
        <VCardText>
          <div class="d-flex flex-column gap-2">
            <VBtn variant="outlined" justify="start" @click="addWidget('stats')">
              📊 Workload Statistics
            </VBtn>
            <VBtn variant="outlined" justify="start" @click="addWidget('calendar')">
              📅 Calendar View
            </VBtn>
            <VBtn variant="outlined" justify="start" @click="addWidget('team')">
              👥 Team Overview
            </VBtn>
          </div>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="outlined" @click="showAddWidgetModal = false">Close</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Search Modal -->
    <VDialog v-model="showSearchModal" max-width="500">
      <VCard>
        <VCardTitle class="text-h6 font-weight-bold">Search Workloads</VCardTitle>
        <VCardText>
          <VTextField
            v-model="searchQuery"
            label="Search"
            placeholder="Search by resource, week, or status..."
            variant="outlined"
            class="mb-4"
            @keyup.enter="performSearch"
          />
          <div style="max-height: 300px; overflow-y: auto;">
            <div v-if="searchResults.length === 0" class="text-center pa-8 text-medium-emphasis">
              No results found
            </div>
            <VCard
              v-for="item in searchResults"
              :key="item.id"
              variant="outlined"
              class="mb-2"
            >
              <VCardText>
                <div class="font-weight-bold">{{ item.resource }} - W{{ item.week }}</div>
                <div class="text-caption text-medium-emphasis">
                  {{ item.count }} tasks ({{ item.status }})
                </div>
              </VCardText>
            </VCard>
          </div>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn color="primary" @click="performSearch">Search</VBtn>
          <VBtn variant="outlined" @click="showSearchModal = false">Close</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Person Modal -->
    <VDialog v-model="showPersonModal" max-width="500">
      <VCard>
        <VCardTitle class="text-h6 font-weight-bold">Manage Resources</VCardTitle>
        <VCardText>
          <div class="mb-4">
            <h3 class="mb-2">Current Resources:</h3>
            <VCard
              v-for="resource in resources"
              :key="resource"
              variant="tonal"
              class="mb-2"
            >
              <VCardText class="pa-2">
                👤 {{ resource }}
              </VCardText>
            </VCard>
          </div>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="outlined" @click="showPersonModal = false">Close</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'

definePage({ meta: { layout: 'default' } })

interface Week {
  number: number
  label: string
  startDate: Date
  endDate: Date
  monthYear: string
}

interface WorkloadItem {
  id: number
  resource: string
  resource_name?: string
  week: number
  count: number
  status: 'completed' | 'overloaded' | 'empty'
  tasks_total?: number
  hours_total?: number
  tasks_open?: number
  tasks_in_progress?: number
  tasks_done?: number
  tooltip_by_status?: Record<string, { hours: number; tasks: number }>
  tooltip_by_status_raw?: Array<{ hours: number; tasks: number; status: string }>
  __backendId?: string
}

interface DashboardConfig {
  dashboard_title: string
  new_item_button: string
  add_widget_button: string
}

declare global {
  interface Window {
    elementSdk?: {
      init: (config: unknown) => Promise<void>
    }
    dataSdk?: {
      init: (handler: { onDataChanged: (data: WorkloadItem[]) => void }) => Promise<{ isOk: boolean }>
      create: (item: Partial<WorkloadItem>) => Promise<{ isOk: boolean }>
      update: (item: WorkloadItem) => Promise<{ isOk: boolean }>
      delete: (item: WorkloadItem) => Promise<{ isOk: boolean }>
    }
  }
}

const defaultConfig: DashboardConfig = {
  dashboard_title: 'Workload Dashboard',
  new_item_button: '➕ New Item',
  add_widget_button: '📊 Add Widget',
}

const uiConfig = reactive<DashboardConfig>({ ...defaultConfig })

const workloadData = ref<WorkloadItem[]>([])
const currentWeeksCount = ref<number>(12)
const weeksStartDate = ref<Date | null>(null)
const filterActive = ref<boolean>(false)

const showNewItemModal = ref(false)
const showAddWidgetModal = ref(false)
const showSearchModal = ref(false)
const showPersonModal = ref(false)

const searchQuery = ref('')
const searchResults = ref<WorkloadItem[]>([])
const searchFromDate = ref('')
const searchToDate = ref('')
const isSearching = ref(false)

const resources = ref<string[]>(['Mr A', 'Mr B'])

const newItemForm = reactive({
  resource: '',
  week: null as number | null,
  count: 1,
  status: '' as WorkloadItem['status'] | '',
})

const toast = reactive({
  visible: false,
  message: '',
  color: 'success' as 'success' | 'error' | 'info' | 'warning',
})

const weeksOptions = [
  { title: '8 Weeks', value: 8 },
  { title: '12 Weeks', value: 12 },
  { title: '16 Weeks', value: 16 },
  { title: '20 Weeks', value: 20 },
]

const resourceOptions = computed(() => [
  { title: 'Select Resource', value: '' },
  ...resources.value.map(r => ({ title: r, value: r })),
])

const statusOptions = [
  { title: 'Select Status', value: '' },
  { title: 'Completed', value: 'completed' },
  { title: 'Overloaded', value: 'overloaded' },
  { title: 'Empty Slot', value: 'empty' },
]

function generateWeeks(count: number): Week[] {
  const weeks: Week[] = []
  const startDate = weeksStartDate.value || new Date()

  for (let i = 0; i < count; i++) {
    const weekStartDate = new Date(startDate)
    weekStartDate.setDate(startDate.getDate() + (i * 7))

    const dayOfWeek = weekStartDate.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(weekStartDate)
    monday.setDate(weekStartDate.getDate() + mondayOffset)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    const weekNumber = getWeekNumber(monday)

    weeks.push({
      number: weekNumber,
      label: `W${weekNumber}`,
      startDate: monday,
      endDate: sunday,
      monthYear: monday.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    })
  }

  return weeks
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

const weeks = computed(() => generateWeeks(currentWeeksCount.value))

const weekSelectOptions = computed(() => [
  { title: 'Select Week', value: null },
  ...weeks.value.map(w => ({ title: w.label, value: w.number })),
])

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
}

function getWorkload(resource: string, week: number): WorkloadItem | undefined {
  return workloadData.value.find(item => item.resource === resource && item.week === week)
}

function getWorkloadItems(resource: string, week: number): WorkloadItem[] {
  return workloadData.value.filter(item => item.resource === resource && item.week === week)
}

function getResourceDisplayName(resource: string): string {
  const item = workloadData.value.find(item => item.resource === resource)
  return item?.resource_name || resource
}

function getWorkloadTooltipLines(item: WorkloadItem): string[] {
  const parts: string[] = []
  
  // Add basic info
  if (item.resource_name) {
    parts.push(`${item.resource_name} (${item.resource})`)
  } else {
    parts.push(item.resource)
  }
  parts.push(`Week ${item.week}`)
  
  // Add tooltip by status if available (prioritize tooltip_by_status)
  if (item.tooltip_by_status && Object.keys(item.tooltip_by_status).length > 0) {
    parts.push('')
    const statusOrder = ['not start', 'inprogress', 'complete']
    const statusParts: string[] = []
    
    // Process statuses in order
    for (const status of statusOrder) {
      if (item.tooltip_by_status[status]) {
        const data = item.tooltip_by_status[status]
        const statusLabel = status === 'complete' ? 'Complete' : 
                           status === 'inprogress' ? 'In Progress' : 
                           status === 'not start' ? 'Not Started' : 
                           status.charAt(0).toUpperCase() + status.slice(1)
        statusParts.push(`${statusLabel}: ${data.tasks} tasks, ${data.hours} hours`)
      }
    }
    
    // Add any remaining statuses not in the order
    for (const [status, data] of Object.entries(item.tooltip_by_status)) {
      if (!statusOrder.includes(status)) {
        const statusLabel = status.charAt(0).toUpperCase() + status.slice(1).replace(/([A-Z])/g, ' $1').trim()
        statusParts.push(`${statusLabel}: ${data.tasks} tasks, ${data.hours} hours`)
      }
    }
    
    parts.push(...statusParts)
  } else if (item.tooltip_by_status_raw && item.tooltip_by_status_raw.length > 0) {
    parts.push('')
    const statusParts: string[] = []
    for (const statusItem of item.tooltip_by_status_raw) {
      const statusLabel = statusItem.status === 'complete' ? 'Complete' : 
                         statusItem.status === 'inprogress' ? 'In Progress' : 
                         statusItem.status === 'not start' ? 'Not Started' : 
                         statusItem.status.charAt(0).toUpperCase() + statusItem.status.slice(1)
      statusParts.push(`${statusLabel}: ${statusItem.tasks} tasks, ${statusItem.hours} hours`)
    }
    parts.push(...statusParts)
  } else {
    // Fallback to basic info
    parts.push('')
    if (item.tasks_total !== undefined) {
      parts.push(`${item.tasks_total} tasks`)
    }
    if (item.hours_total !== undefined) {
      parts.push(`${item.hours_total} hours`)
    }
  }
  
  return parts
}

function getBadgeColor(status: WorkloadItem['status']): string {
  switch (status) {
    case 'completed':
      return 'primary'
    case 'overloaded':
      return 'error'
    case 'empty':
      return 'grey'
    default:
      return 'grey'
  }
}

function getWorkloadTooltip(resource: string, week: number): string {
  const workload = getWorkload(resource, week)
  if (!workload) return ''
  return `${workload.resource} - W${workload.week}: ${workload.count} tasks (${workload.status})`
}

function loadSampleData() {
  const weeksList = generateWeeks(currentWeeksCount.value)
  workloadData.value = [
    { id: 1, resource: 'Mr A', week: weeksList[0].number, count: 2, status: 'completed' },
    { id: 2, resource: 'Mr A', week: weeksList[1].number, count: 3, status: 'overloaded' },
    { id: 3, resource: 'Mr A', week: weeksList[3].number, count: 1, status: 'empty' },
    { id: 4, resource: 'Mr B', week: weeksList[0].number, count: 1, status: 'completed' },
    { id: 5, resource: 'Mr B', week: weeksList[2].number, count: 3, status: 'overloaded' },
    { id: 6, resource: 'Mr B', week: weeksList[4].number, count: 2, status: 'completed' },
  ]
}

function openQuickAdd(resource: string, week: Week) {
  newItemForm.resource = resource
  newItemForm.week = week.number
  showNewItemModal.value = true
}

function closeNewItemModal() {
  showNewItemModal.value = false
  newItemForm.resource = ''
  newItemForm.week = null
  newItemForm.count = 1
  newItemForm.status = ''
}

async function addNewItem() {
  if (!newItemForm.resource || !newItemForm.week || !newItemForm.status) {
    showToast('Please fill all required fields', 'error')
    return
  }

  const existingIndex = workloadData.value.findIndex(
    item => item.resource === newItemForm.resource && item.week === newItemForm.week
  )

  const newItem: WorkloadItem = {
    id: Date.now(),
    resource: newItemForm.resource,
    week: newItemForm.week,
    count: newItemForm.count,
    status: newItemForm.status as WorkloadItem['status'],
  }

  if (existingIndex >= 0) {
    workloadData.value[existingIndex] = newItem
    const sdk = window.dataSdk
    if (sdk && workloadData.value[existingIndex].__backendId) {
      await sdk.update(workloadData.value[existingIndex])
    }
  } else {
    workloadData.value.push(newItem)
    const sdk = window.dataSdk
    if (sdk) {
      const result = await sdk.create(newItem)
      if (result.isOk) {
        // Backend ID will be set by onDataChanged
      }
    }
  }

  closeNewItemModal()
  showToast('Workload item added successfully!', 'success')
}

function editWorkload(workload: WorkloadItem) {
  newItemForm.resource = workload.resource
  newItemForm.week = workload.week
  newItemForm.count = workload.count
  newItemForm.status = workload.status
  showNewItemModal.value = true
}

function updateWeeksView() {
  // Weeks are computed, so they update automatically
}

function toggleFilter() {
  filterActive.value = !filterActive.value
  showToast(filterActive.value ? 'Filter activated' : 'Filter deactivated', 'info')
}

function goToToday() {
  showToast('Jumped to current week', 'info')
}

function addWidget(type: string) {
  const widgetNames: Record<string, string> = {
    stats: 'Workload Statistics',
    calendar: 'Calendar View',
    team: 'Team Overview',
  }
  showToast(`${widgetNames[type]} widget added!`, 'success')
  showAddWidgetModal.value = false
}

function performSearch() {
  const query = searchQuery.value.toLowerCase()
  searchResults.value = workloadData.value.filter(
    item =>
      item.resource.toLowerCase().includes(query) ||
      item.status.toLowerCase().includes(query) ||
      `w${item.week}`.includes(query)
  )
}

// Convert year_week_label (e.g., "2025-W48") to week number
function parseWeekNumber(yearWeekLabel: string): number {
  const match = yearWeekLabel.match(/W(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

// Get Monday of current week
function getMondayOfCurrentWeek(): Date {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)
  return monday
}

// Format date as YYYY-MM-DD
function formatDateForInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Initialize default dates
function initializeDefaultDates() {
  const monday = getMondayOfCurrentWeek()
  const toDate = new Date(monday)
  toDate.setDate(monday.getDate() + 15)

  searchFromDate.value = formatDateForInput(monday)
  searchToDate.value = formatDateForInput(toDate)
}

async function searchByDateRange(silent: boolean = false) {
  if (!searchFromDate.value || !searchToDate.value) {
    if (!silent) {
      showToast('Please select both From Date and To Date', 'error')
    }
    return
  }

  isSearching.value = true
  try {
    const EDGE_LIST_ACTION_URL = '/api/supabase/ListActionbyDate'
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1bW55Y2Vrb3J5c3ppeGl0d3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3OTY0NjksImV4cCI6MjA3NzM3MjQ2OX0.6MEy4-37qan-MTaNNBywZ8eAkNXHJ1ZBjebHBJDHZW4'

    const response = await fetch(EDGE_LIST_ACTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        from_date: searchFromDate.value,
        to_date: searchToDate.value,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch action data')
    }

    const data = await response.json()
    const results = Array.isArray(data?.results) ? data.results : []

    // Convert API results to WorkloadItem[]
    const mappedItems: WorkloadItem[] = []
    const uniqueResources = new Set<string>()

    let itemIdCounter = Date.now()

    for (const item of results) {
      const resource = item.assignee_code || ''
      const resourceName = item.assignee_name || ''
      const weekNumber = parseWeekNumber(item.year_week_label || '')

      if (resource && weekNumber > 0) {
        uniqueResources.add(resource)
        mappedItems.push({
          id: itemIdCounter++,
          resource: resource,
          resource_name: resourceName,
          week: weekNumber,
          count: item.tasks_total || 0,
          status: 'completed', // Default status
          tasks_total: item.tasks_total || 0,
          hours_total: item.hours_total || 0,
          tasks_open: item.tasks_open || 0,
          tasks_in_progress: item.tasks_in_progress || 0,
          tasks_done: item.tasks_done || 0,
          tooltip_by_status: item.tooltip_by_status || undefined,
          tooltip_by_status_raw: item.tooltip_by_status_raw || undefined,
        })
      }
    }

    // Update workload data
    workloadData.value = mappedItems

    // Update resources list
    resources.value = Array.from(uniqueResources).sort()

    // Update weeks view based on date range
    const fromDate = new Date(searchFromDate.value)
    const toDate = new Date(searchToDate.value)

    // Set start date for weeks generation
    weeksStartDate.value = fromDate

    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))
    const weeksCount = Math.ceil(daysDiff / 7)
    currentWeeksCount.value = Math.max(8, Math.min(weeksCount + 2, 20))

    if (!silent) {
      showToast(`Found ${mappedItems.length} workload items`, 'success')
    }
  } catch (error: any) {
    console.error('Error searching by date range:', error)
    if (!silent) {
      showToast(error?.message || 'Failed to search workload data', 'error')
    }
  } finally {
    isSearching.value = false
  }
}

function showToast(message: string, color: 'success' | 'error' | 'info' | 'warning' = 'success') {
  toast.message = message
  toast.color = color
  toast.visible = true
}

const elementConfig = {
  defaultConfig,
  onConfigChange: async (config: DashboardConfig) => {
    uiConfig.dashboard_title = config.dashboard_title || defaultConfig.dashboard_title
    uiConfig.new_item_button = config.new_item_button || defaultConfig.new_item_button
    uiConfig.add_widget_button = config.add_widget_button || defaultConfig.add_widget_button
  },
  mapToCapabilities: () => ({
    recolorables: [],
    borderables: [],
    fontEditable: undefined,
    fontSizeable: undefined,
  }),
  mapToEditPanelValues: (config: DashboardConfig) =>
    new Map<string, string>([
      ['dashboard_title', config.dashboard_title || defaultConfig.dashboard_title],
      ['new_item_button', config.new_item_button || defaultConfig.new_item_button],
      ['add_widget_button', config.add_widget_button || defaultConfig.add_widget_button],
    ]),
}

const dataHandler = {
  onDataChanged(data: WorkloadItem[]) {
    workloadData.value = data
  },
}

async function initializeApp() {
  try {
    // Initialize default dates
    initializeDefaultDates()

    if (window.elementSdk) {
      await window.elementSdk.init(elementConfig)
    }
    if (window.dataSdk) {
      const result = await window.dataSdk.init(dataHandler)
      if (!result.isOk) {
        console.error('Failed to initialize data SDK')
      }
    }

    // Load data based on default date range (silent mode - no toast)
    await searchByDateRange(true)

    // Keep loadSampleData as fallback if searchByDateRange doesn't return data
    // loadSampleData()
  } catch (error) {
    console.error('Failed to initialize app:', error)
  }
}

onMounted(() => {
  initializeApp()
})
</script>

<style scoped>
.schedule-grid {
  display: grid;
  grid-template-columns: 200px 1fr;
  grid-template-rows: auto 1fr;
  min-width: 800px;
}

.weeks-header {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: 200px 1fr;
  gap: 1px;
  background-color: rgb(var(--v-theme-surface));
  padding: 1px;
}

.resource-header-cell {
  background: rgb(var(--v-theme-surface));
  padding: 0.75rem;
  text-align: center;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  border-bottom: 2px solid rgb(var(--v-theme-primary));
  display: flex;
  align-items: center;
  justify-content: center;
}

.weeks-header-grid {
  display: grid;
  gap: 1px;
}

.week-header {
  background: rgb(var(--v-theme-surface));
  padding: 0.75rem;
  text-align: center;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  border-bottom: 2px solid rgb(var(--v-theme-primary));
  min-width: 140px;
}

.week-header-month {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-primary));
  margin-bottom: 0.25rem;
}

.week-header-week {
  font-size: 0.75rem;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 0.25rem;
}

.week-header-dates {
  font-size: 0.625rem;
  color: rgb(var(--v-theme-on-surface-variant));
  line-height: 1.2;
}

.schedule-rows {
  display: grid;
  grid-column: 1 / -1;
  gap: 1px;
  background-color: rgb(var(--v-theme-surface));
  padding: 1px;
}

.schedule-row {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1px;
}

.resource-name-cell {
  background: rgb(var(--v-theme-surface));
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.75rem;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  border-right: 1px solid rgb(var(--v-theme-outline-variant));
}

.schedule-cells-grid {
  display: grid;
  gap: 1px;
}

.schedule-cell {
  background: rgb(var(--v-theme-surface));
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.schedule-cell:hover {
  background-color: rgb(var(--v-theme-surface-variant));
}

.workload-badge {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.workload-badge:hover {
  transform: scale(1.1);
}

.workload-blocks-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  min-height: 60px;
}

.workload-block {
  background-color: #E3F2FD;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid rgba(25, 118, 210, 0.2);
}

.workload-block:hover {
  background-color: #BBDEFB;
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.workload-project-name {
  font-weight: 600;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 4px;
  line-height: 1.2;
}

.workload-task-name {
  font-size: 0.75rem;
  color: rgb(var(--v-theme-on-surface));
  font-weight: 500;
  line-height: 1.2;
  margin-bottom: 4px;
}

.workload-status {
  font-size: 0.625rem;
  color: rgb(var(--v-theme-on-surface-variant));
  line-height: 1.2;
  margin-top: 4px;
}

.workload-status span {
  display: block;
  margin-bottom: 2px;
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
}

.tooltip-content div {
  line-height: 1.4;
}
</style>

