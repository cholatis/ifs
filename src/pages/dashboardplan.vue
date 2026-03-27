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
              <VSelect v-model="currentWeeksCount" :items="weeksOptions" variant="outlined" density="compact"
                hide-details style="max-width: 150px;" @update:model-value="updateWeeksView" />
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
              <div class="weeks-header-grid"
                :style="{ gridTemplateColumns: `repeat(${weeks.length}, minmax(140px, 1fr))` }">
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
                  <span>{{ resource }}</span>
                </div>
                <div class="schedule-cells-grid"
                  :style="{ gridTemplateColumns: `repeat(${weeks.length}, minmax(140px, 1fr))` }">
                  <div v-for="week in weeks" :key="`${resource}-${week.number}`" class="schedule-cell"
                    @click="openQuickAdd(resource, week)">
                    <div class="workload-blocks-container">
                      <div v-for="item in getWorkloadItems(resource, week.number)" :key="item.id" class="workload-block"
                        @click.stop="editWorkload(item)">
                        <div class="workload-project-name">{{ item.project_name }}</div>
                        <div class="workload-task-name">{{ item.task_name }}</div>
                      </div>
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
        <VCardTitle class="text-h6 font-weight-bold">{{ editingItem ? 'Edit Workload Item' : 'Add New Workload Item' }}
        </VCardTitle>
        <VCardText>
          <VForm @submit.prevent="addNewItem">
            <VSelect v-model="newItemForm.resource" :items="resourceOptions" label="Resource" variant="outlined"
              class="mb-4" required />
            <VSelect v-model="newItemForm.week" :items="weekSelectOptions" label="Week" variant="outlined" class="mb-4"
              required />
            <VTextField v-model.trim="newItemForm.project_name" label="Project Name" variant="outlined" class="mb-4"
              required />
            <VTextField v-model.trim="newItemForm.task_name" label="Task Name" variant="outlined" required />
          </VForm>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="outlined" @click="closeNewItemModal">Cancel</VBtn>
          <VBtn color="primary" @click="addNewItem">{{ editingItem ? 'Update Item' : 'Add Item' }}</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref, watch } from 'vue'

  definePage({ meta: { layout: 'default' } })

  /**
   * @typedef {Object} Week
   * @property {number} number
   * @property {string} label
   * @property {Date} startDate
   * @property {Date} endDate
   * @property {string} monthYear
   */

  /**
   * @typedef {Object} WorkloadItem
   * @property {number} id
   * @property {string} resource
   * @property {number} week
   * @property {string} project_name
   * @property {string} task_name
   * @property {string} [__backendId]
   */

  /**
   * @typedef {Object} DashboardConfig
   * @property {string} dashboard_title
   * @property {string} new_item_button
   * @property {string} add_widget_button
   */

  /**
   * @typedef {Object} ElementSdk
   * @property {(config: unknown) => Promise<void>} init
   */

  /**
   * @typedef {Object} DataSdk
   * @property {(handler: { onDataChanged: (data: WorkloadItem[]) => void }) => Promise<{ isOk: boolean }>} init
   * @property {(item: Partial<WorkloadItem>) => Promise<{ isOk: boolean }>} create
   * @property {(item: WorkloadItem) => Promise<{ isOk: boolean }>} update
   * @property {(item: WorkloadItem) => Promise<{ isOk: boolean }>} delete
   */

  /**
   * @typedef {Window & {
   *   elementSdk?: ElementSdk
   *   dataSdk?: DataSdk
   * }} DashboardWindow
   */

  const dashboardWindow = /** @type {DashboardWindow} */ (window)

  /** @type {DashboardConfig} */
  const defaultConfig = {
    dashboard_title: 'Workload Dashboard',
    new_item_button: '➕ New Item',
    add_widget_button: '📊 Add Widget',
  }

  const uiConfig = reactive(/** @type {DashboardConfig} */({ ...defaultConfig }))

  const workloadData = ref(/** @type {WorkloadItem[]} */([]))
  const currentWeeksCount = ref(12)
  const weeksStartDate = ref(/** @type {Date | null} */(null)) // Start date for generating weeks

  const showNewItemModal = ref(false)
  const editingItem = ref(/** @type {WorkloadItem | null} */(null))

  const searchFromDate = ref('')
  const searchToDate = ref('')
  const isSearching = ref(false)

  const resources = ref(/** @type {string[]} */(['Mr A', 'Mr B']))

  const newItemForm = reactive({
    resource: '',
    week: /** @type {number | null} */ (null),
    project_name: '',
    task_name: '',
  })

  const toast = reactive(
    /** @type {{ visible: boolean; message: string; color: 'success' | 'error' | 'info' | 'warning' }} */({
      visible: false,
      message: '',
      color: 'success',
    }),
  )

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


  /**
   * @param {number} count
   * @returns {Week[]}
   */
  function generateWeeks(count) {
    const weeks = /** @type {Week[]} */ ([])
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

  /**
   * @param {Date} date
   * @returns {number}
   */
  function getWeekNumber(date) {
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

  /**
   * @param {Date} date
   * @returns {string}
   */
  function formatDateShort(date) {
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
  }

  /**
   * @param {string} resource
   * @param {number} week
   * @returns {WorkloadItem[]}
   */
  function getWorkloadItems(resource, week) {
    return workloadData.value.filter(item => item.resource === resource && item.week === week)
  }

  function loadSampleData() {
    const weeksList = generateWeeks(currentWeeksCount.value)
    workloadData.value = [
      { id: 1, resource: 'Mr A', week: weeksList[0].number, project_name: 'wexczv', task_name: 'adsfqwe' },
      { id: 2, resource: 'Mr A', week: weeksList[1].number, project_name: 'Project2', task_name: 'Task 2' },
      { id: 3, resource: 'Mr A', week: weeksList[1].number, project_name: 'Project 3', task_name: 'Task3' },
      { id: 4, resource: 'Mr B', week: weeksList[0].number, project_name: 'Project1', task_name: 'Task1' },
    ]
  }

  /**
   * @param {string} resource
   * @param {Week} week
   */
  function openQuickAdd(resource, week) {
    newItemForm.resource = resource
    newItemForm.week = week.number
    showNewItemModal.value = true
  }

  function closeNewItemModal() {
    showNewItemModal.value = false
    editingItem.value = null
    newItemForm.resource = ''
    newItemForm.week = null
    newItemForm.project_name = ''
    newItemForm.task_name = ''
  }

  async function addNewItem() {
    if (!newItemForm.resource || !newItemForm.week || !newItemForm.project_name || !newItemForm.task_name) {
      showToast('Please fill all required fields', 'error')
      return
    }

    const sdk = dashboardWindow.dataSdk

    if (editingItem.value) {
      // Update existing item
      /** @type {WorkloadItem} */
      const updatedItem = {
        ...editingItem.value,
        resource: newItemForm.resource,
        week: newItemForm.week,
        project_name: newItemForm.project_name,
        task_name: newItemForm.task_name,
      }

      const index = workloadData.value.findIndex(item => editingItem.value && item.id === editingItem.value.id)
      if (index >= 0) {
        workloadData.value[index] = updatedItem
      }

      if (sdk && updatedItem.__backendId) {
        await sdk.update(updatedItem)
      }

      showToast('Workload item updated successfully!', 'success')
    } else {
      // Create new item
      /** @type {WorkloadItem} */
      const newItem = {
        id: Date.now(),
        resource: newItemForm.resource,
        week: newItemForm.week,
        project_name: newItemForm.project_name,
        task_name: newItemForm.task_name,
      }

      workloadData.value.push(newItem)

      if (sdk) {
        const result = await sdk.create(newItem)
        if (result.isOk) {
          // Backend ID will be set by onDataChanged
        }
      }

      showToast('Workload item added successfully!', 'success')
    }

    closeNewItemModal()
  }

  /**
   * @param {WorkloadItem} workload
   */
  function editWorkload(workload) {
    editingItem.value = workload
    newItemForm.resource = workload.resource
    newItemForm.week = workload.week
    newItemForm.project_name = workload.project_name
    newItemForm.task_name = workload.task_name
    showNewItemModal.value = true
  }

  function updateWeeksView() {
    // Weeks are computed, so they update automatically
  }

  // Convert year_week_label (e.g., "2025-W48") to week number
  /**
   * @param {string} yearWeekLabel
   * @returns {number}
   */
  function parseWeekNumber(yearWeekLabel) {
    const match = yearWeekLabel.match(/W(\d+)/)
    return match ? parseInt(match[1], 10) : 0
  }

  /**
   * @param {boolean} [silent=false]
   */
  async function searchByDateRange(silent = false) {
    if (!searchFromDate.value || !searchToDate.value) {
      if (!silent) {
        showToast('Please select both From Date and To Date', 'error')
      }
      return
    }

    isSearching.value = true
    try {
      const EDGE_LIST_PLAN_URL = '/api/supabase/ListPlanbyDate'
      const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1bW55Y2Vrb3J5c3ppeGl0d3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3OTY0NjksImV4cCI6MjA3NzM3MjQ2OX0.6MEy4-37qan-MTaNNBywZ8eAkNXHJ1ZBjebHBJDHZW4'

      const response = await fetch(EDGE_LIST_PLAN_URL, {
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
        throw new Error('Failed to fetch plan data')
      }

      const data = await response.json()
      const results = Array.isArray(data?.results) ? data.results : []

      // Convert API results to WorkloadItem[]
      const mappedItems = /** @type {WorkloadItem[]} */ ([])
      const uniqueResources = /** @type {Set<string>} */ (new Set())

      let itemIdCounter = Date.now()

      for (const item of results) {
        const resource = item.assignee_code || ''
        const projectName = item.parent_project_code || ''
        const taskName = item.task_name || ''
        const weekNumber = parseWeekNumber(item.year_week_label || '')

        if (resource && weekNumber > 0) {
          uniqueResources.add(resource)
          mappedItems.push({
            id: itemIdCounter++,
            resource: resource,
            week: weekNumber,
            project_name: projectName,
            task_name: taskName,
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
      currentWeeksCount.value = Math.max(8, Math.min(weeksCount + 2, 20)) // Add buffer, max 20 weeks

      if (!silent) {
        showToast(`Found ${mappedItems.length} workload items`, 'success')
      }
    } catch (error) {
      console.error('Error searching by date range:', error)
      if (!silent) {
        showToast(error?.message || 'Failed to search workload data', 'error')
      }
    } finally {
      isSearching.value = false
    }
  }

  /**
   * @param {string} message
   * @param {'success' | 'error' | 'info' | 'warning'} [color='success']
   */
  function showToast(message, color = 'success') {
    toast.message = message
    toast.color = color
    toast.visible = true
  }

  const elementConfig = {
    defaultConfig,
    /**
     * @param {DashboardConfig} config
     */
    onConfigChange: async config => {
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
    /**
     * @param {DashboardConfig} config
     * @returns {Map<string, string>}
     */
    mapToEditPanelValues: config =>
      new Map([
        ['dashboard_title', config.dashboard_title || defaultConfig.dashboard_title],
        ['new_item_button', config.new_item_button || defaultConfig.new_item_button],
        ['add_widget_button', config.add_widget_button || defaultConfig.add_widget_button],
      ]),
  }

  const dataHandler = {
    /**
     * @param {WorkloadItem[]} data
     */
    onDataChanged(data) {
      workloadData.value = data
    },
  }

  /**
   * Get Monday of current week
   * @returns {Date}
   */
  function getMondayOfCurrentWeek() {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // If Sunday (0), go back 6 days, otherwise go to Monday
    const monday = new Date(today)
    monday.setDate(today.getDate() + mondayOffset)
    monday.setHours(0, 0, 0, 0) // Set to start of day
    return monday
  }

  /**
   * Format date as YYYY-MM-DD
   * @param {Date} date
   * @returns {string}
   */
  function formatDateForInput(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Initialize default dates
  function initializeDefaultDates() {
    const monday = getMondayOfCurrentWeek()
    const toDate = new Date(monday)
    toDate.setDate(monday.getDate() + 15) // Add 15 days

    searchFromDate.value = formatDateForInput(monday)
    searchToDate.value = formatDateForInput(toDate)
  }

  async function initializeApp() {
    try {
      // Initialize default dates
      initializeDefaultDates()

      if (dashboardWindow.elementSdk) {
        await dashboardWindow.elementSdk.init(elementConfig)
      }
      if (dashboardWindow.dataSdk) {
        const result = await dashboardWindow.dataSdk.init(dataHandler)
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
    color: rgb(var(--v-theme-on-surface));
    font-weight: 600;
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
  }
</style>
