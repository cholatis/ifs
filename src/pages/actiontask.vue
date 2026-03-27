<template>
  <div>
    <VSnackbar v-model="toast.visible" :color="toast.type === 'success' ? 'success' : 'error'" location="top end" timeout="3000">
      {{ toast.message }}
    </VSnackbar>

    <VContainer class="py-8">
      <VCard class="mb-6" elevation="2">
        <VCardText class="d-flex align-center justify-space-between py-6">
          <div>
            <div class="text-h4 font-weight-bold">{{ uiText.appTitle }}</div>
            <div class="text-body-2 text-medium-emphasis mt-1">จัดการงานและ Action Tasks อย่างเป็นระบบ</div>
          </div>
          <VBtn color="primary" @click="showAddTaskModal = true">{{ uiText.addTaskButton }}</VBtn>
        </VCardText>
      </VCard>

      <VRow class="mb-6" dense>
        <VCol cols="12" md="3">
          <VCard elevation="2" class="pa-6 d-flex align-center">
            <VAvatar color="primary" variant="tonal" class="me-3">📋</VAvatar>
            <div>
              <div class="text-caption text-medium-emphasis">งานหลักทั้งหมด</div>
              <div class="text-h5 font-weight-bold">{{ stats.totalParentTasks }}</div>
            </div>
          </VCard>
        </VCol>
        <VCol cols="12" md="3">
          <VCard elevation="2" class="pa-6 d-flex align-center">
            <VAvatar color="success" variant="tonal" class="me-3">⚡</VAvatar>
            <div>
              <div class="text-caption text-medium-emphasis">Action Tasks</div>
              <div class="text-h5 text-success">{{ stats.totalActionTasks }}</div>
            </div>
          </VCard>
        </VCol>
        <VCol cols="12" md="3">
          <VCard elevation="2" class="pa-6 d-flex align-center">
            <VAvatar color="warning" variant="tonal" class="me-3">⏱️</VAvatar>
            <div>
              <div class="text-caption text-medium-emphasis">ชั่วโมงรวม</div>
              <div class="text-h5 text-warning">{{ stats.totalHours }}</div>
            </div>
          </VCard>
        </VCol>
        <VCol cols="12" md="3">
          <VCard elevation="2" class="pa-6 d-flex align-center">
            <VAvatar color="secondary" variant="tonal" class="me-3">✅</VAvatar>
            <div>
              <div class="text-caption text-medium-emphasis">เสร็จแล้ว</div>
              <div class="text-h5 text-secondary">{{ stats.completedActions }}</div>
            </div>
          </VCard>
        </VCol>
      </VRow>

      <VCard class="mb-6" elevation="2">
        <VCardText>
          <VRow align="center" dense>
            <VCol cols="12" md="4">
              <div class="text-caption text-medium-emphasis mb-1">กรองตามผู้รับผิดชอบ</div>
              <VSelect :items="employeeSelectOptions" v-model="filters.person" variant="outlined" density="comfortable" :loading="loadingEmployees" />
            </VCol>
            <VCol cols="12" md="4">
              <div class="text-caption text-medium-emphasis mb-1">กรองตามสถานะ</div>
              <VSelect :items="[
                { title: 'ทั้งหมด', value: 'all' },
                { title: 'กำลังดำเนินการ', value: 'in-progress' },
                { title: 'เสร็จแล้ว', value: 'complete' },
              ]" v-model="filters.status" variant="outlined" density="comfortable" />
            </VCol>
            <VCol cols="12" md="4" class="d-flex justify-end">
              <VBtn color="error" variant="tonal" @click="confirmClearAllVisible = true">🗑️ ล้างข้อมูลทั้งหมด</VBtn>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>

      <VCard elevation="2">
        <VCardTitle class="text-h6 font-weight-bold">รายการงาน</VCardTitle>
        <VCardText>
          <div v-if="loadingActionTasks" class="text-center py-12">
            <VProgressCircular indeterminate color="primary" class="mb-4" />
            <div class="text-body-1 text-medium-emphasis">กำลังโหลดข้อมูล...</div>
          </div>
          <div v-else-if="filteredParentTasks.length === 0" class="text-center py-12">
            <VIcon icon="tabler-clipboard-list" size="64" color="grey-lighten-2" class="mb-4" />
            <div class="text-h6 text-grey-darken-1 mb-1">ยังไม่มีงานในระบบ</div>
            <div class="text-body-2 text-medium-emphasis">เริ่มต้นด้วยการเพิ่มงานใหม่</div>
          </div>
          <div v-else class="d-flex flex-column gap-4">
            <VCard v-for="parentTask in filteredParentTasks" :key="parentTask.__backendId || parentTask.id" variant="outlined">
              <VCardText>
                <div class="d-flex justify-space-between align-start mb-2">
                  <div class="flex-grow-1">
                    <div class="d-flex align-center mb-2">
                      <VChip color="primary" variant="tonal" class="me-2">{{ parentTask.parent_task_id }}</VChip>
                      <div class="text-subtitle-1 font-weight-semibold">{{ parentTask.title }}</div>
                    </div>
                    <div v-if="parentTask.description" class="text-body-2 text-medium-emphasis mb-2">{{ parentTask.description }}</div>
                    <div class="d-flex flex-wrap gap-2">
                      <VChip color="secondary" variant="tonal" size="small">📅 {{ formatDate(parentTask.due_date) }}</VChip>
                      <VChip color="success" variant="tonal" size="small">👤 {{ parentTask.assign_person }}</VChip>
                      <VChip color="warning" variant="tonal" size="small">⏱️ {{ getTotalHours(parentTask.parent_task_id) }} ชั่วโมง</VChip>
                      <VChip color="primary" variant="tonal" size="small">📝 {{ getActions(parentTask.parent_task_id).length }} Actions</VChip>
                    </div>
                  </div>
                  <div class="d-flex gap-2">
                    <VBtn color="error" variant="tonal" @click="deleteItem(parentTask.__backendId || '')">🗑️</VBtn>
                  </div>
                </div>

                <div v-if="getActions(parentTask.parent_task_id).length > 0" class="mt-2 pt-2">
                  <div class="text-subtitle-2 text-medium-emphasis mb-2">
                    Action Tasks ({{ getCompletedActionsCount(parentTask.parent_task_id) }}/{{ getActions(parentTask.parent_task_id).length }} เสร็จแล้ว)
                  </div>
                  <div class="d-flex flex-column" style="gap: 8px; max-height: 260px; overflow-y: auto;">
                    <div v-for="action in getActions(parentTask.parent_task_id)" :key="action.__backendId || action.id" class="d-flex align-center justify-space-between rounded border pa-3">
                      <div class="flex-grow-1">
                        <div class="d-flex align-center mb-1">
                          <div class="text-body-1 font-weight-medium me-2">{{ action.title }}</div>
                          <VChip :color="action.status === 'complete' ? 'success' : 'warning'" size="x-small" class="text-capitalize" variant="tonal">
                            {{ action.status === 'complete' ? '✅ เสร็จแล้ว' : '⏳ กำลังดำเนินการ' }}
                          </VChip>
                        </div>
                        <div v-if="action.description" class="text-body-2 text-medium-emphasis mb-1">{{ action.description }}</div>
                        <div class="text-caption text-medium-emphasis d-flex align-center flex-wrap" style="gap:8px;">
                          <span>⏱️ {{ action.hours }} ชั่วโมง</span>
                          <span>📅 {{ formatDate(action.created_at?.split('T')[0] || '') }}</span>
                          <VChip 
                            v-if="action.postflag" 
                            color="success" 
                            size="x-small" 
                            variant="tonal"
                          >
                            📤 ส่ง Microsoft Graph แล้ว
                          </VChip>
                          <VChip 
                            v-else 
                            color="grey" 
                            size="x-small" 
                            variant="tonal"
                          >
                            ⏳ ยังไม่ได้ส่ง
                          </VChip>
                        </div>
                      </div>
                      <div class="d-flex align-center ms-4" style="gap:8px;">
                        <VSelect :items="[
                          { title: 'กำลังดำเนินการ', value: 'in-progress' },
                          { title: 'เสร็จแล้ว', value: 'complete' },
                        ]" :model-value="action.status" density="comfortable" hide-details variant="outlined" style="max-width: 180px;" @update:model-value="(v:any)=>updateActionStatus(action.__backendId || '', v)" />
                        <VBtn 
                          v-if="!action.postflag"
                          color="primary" 
                          variant="text" 
                          @click="postAction(action.__backendId || '')"
                        >
                          📤
                        </VBtn>
                        <VChip 
                          v-else
                          color="success" 
                          size="small" 
                          variant="tonal"
                        >
                          ✅ ส่งแล้ว
                        </VChip>
                        <VBtn color="error" variant="text" @click="deleteItem(action.__backendId || '')">🗑️</VBtn>
                      </div>
                    </div>
                  </div>
                </div>
              </VCardText>
            </VCard>
          </div>
        </VCardText>
      </VCard>
    </VContainer>

    <VDialog v-model="showAddTaskModal" max-width="560" persistent>
      <VCard>
        <VCardTitle class="text-h6 font-weight-bold">เพิ่มงานหลักใหม่</VCardTitle>
        <VCardText>
          <VForm @submit.prevent="addParentTask">
            <VAutocomplete
              v-model="searchTaskQuery"
              :items="searchTaskResults"
              :loading="searchTaskLoading"
              label="ค้นหางาน (Search Task)"
              placeholder="พิมพ์อย่างน้อย 3 ตัวอักษร"
              variant="outlined"
              density="comfortable"
              item-title="display"
              item-value="id"
              return-object
              clearable
              class="mb-4"
              @update:search="handleSearchTask"
              @update:model-value="handleSelectSearchTask"
              prepend-inner-icon="tabler-search"
            >
              <template #item="{ props: itemProps, item }">
                <VListItem v-bind="itemProps">
                  <template #prepend>
                    <VIcon icon="tabler-file-text" color="primary" class="me-2" />
                  </template>
                  <VListItemTitle>{{ item.raw.task_name }}</VListItemTitle>
                  <VListItemSubtitle v-if="item.raw.parent_project_code">{{ item.raw.parent_project_code }}</VListItemSubtitle>
                </VListItem>
              </template>
            </VAutocomplete>
            <VTextField v-model.trim="parentForm.title" label="ชื่องาน" required variant="outlined" class="mb-4" />
            <VTextField v-model.trim="parentForm.project_name" label="โปรเจกต์ (Project)" variant="outlined" class="mb-4" readonly />
            <VTextarea v-model.trim="parentForm.description" label="รายละเอียด" rows="3" variant="outlined" class="mb-4" />
            <VTextField v-model="parentForm.due_date" label="กำหนดส่ง" type="date" required variant="outlined" class="mb-4" />
            <VAutocomplete
              v-model="selectedAssignee"
              :items="employees.map(e => ({ 
                title: `${e.full_name} (${e.employee_code})`, 
                value: e.full_name,
                employee: e 
              }))"
              :loading="loadingEmployees"
              label="ผู้รับผิดชอบ"
              variant="outlined"
              class="mb-4"
              clearable
              density="comfortable"
              return-object
              @update:model-value="handleSelectAssignee"
            />
            <VSelect
              v-if="selectedSearchPlanId"
              v-model="parentForm.bucket_id"
              :items="bucketSelectOptions"
              :loading="loadingBuckets"
              label="Bucket"
              variant="outlined"
              class="mb-4"
              clearable
              density="comfortable"
            />
            <div class="text-subtitle-2 mb-2">ชั่วโมงที่ใช้ (Hour Use)</div>
            <VBtnToggle v-model="parentForm.hour_use" divided class="mb-4" mandatory density="comfortable" :loading="loadingHours">
              <VBtn v-for="hour in hourOptions" :key="hour.label" :value="hour.label" size="small" style="min-width: 40px; padding: 0 8px;">{{ hour.hr }}</VBtn>
            </VBtnToggle>
          </VForm>
        </VCardText>
        <VCardActions>
          <VBtn color="grey" variant="outlined" @click="closeAddTaskModal">ยกเลิก</VBtn>
          <VBtn color="primary" @click="addParentTask">เพิ่มงาน</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VDialog v-model="showAddActionModal" max-width="560" persistent>
      <VCard>
        <VCardTitle class="text-h6 font-weight-bold">เพิ่ม Action Task</VCardTitle>
        <VCardText>
          <VForm @submit.prevent="addActionTask">
            <VTextField v-model.trim="actionForm.title" label="ชื่อ Action Task" required variant="outlined" class="mb-4" />
            <VTextarea v-model.trim="actionForm.description" label="รายละเอียด" rows="2" variant="outlined" class="mb-4" />
            <div class="text-subtitle-2 mb-2">จำนวนชั่วโมงที่ทำ</div>
            <VBtnToggle v-model="actionForm.hours" divided class="mb-4" mandatory>
              <VBtn v-for="h in hourOptions" :key="h" :value="h">{{ h }}</VBtn>
            </VBtnToggle>
            <VSelect v-model="actionForm.status" :items="[
              { title: 'กำลังดำเนินการ', value: 'in-progress' },
              { title: 'เสร็จแล้ว', value: 'complete' },
            ]" required variant="outlined" />
          </VForm>
        </VCardText>
        <VCardActions>
          <VBtn color="grey" variant="outlined" @click="closeAddActionModal">ยกเลิก</VBtn>
          <VBtn color="success" @click="addActionTask">เพิ่ม Action</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VDialog v-model="confirmClearAllVisible" max-width="520">
      <VCard>
        <VCardTitle class="text-h6 font-weight-bold">ยืนยันการลบข้อมูล</VCardTitle>
        <VCardText>คุณต้องการลบข้อมูลทั้งหมดใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้</VCardText>
        <VCardActions>
          <VBtn color="grey" variant="outlined" @click="confirmClearAllVisible = false">ยกเลิก</VBtn>
          <VBtn color="error" @click="confirmClearAll">ลบทั้งหมด</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VDialog v-model="showGraphLoginModal" max-width="600" persistent>
      <VCard>
        <VCardTitle class="text-h6 font-weight-bold">🔐 Microsoft Graph Authentication</VCardTitle>
        <VCardText>
          <div class="text-body-2 text-error mb-4">
            Token สำหรับ Microsoft Graph API หมดอายุแล้ว กรุณาลงชื่อเข้าใช้เพื่อรับ token ใหม่
          </div>

          <!-- Step 1: Get Device Code -->
          <div v-if="deviceCodeStep === 1" class="text-center">
            <VBtn
              color="primary"
              block
              size="large"
              class="mb-4"
              @click="getDeviceCode"
              :loading="deviceCodeLoading"
            >
              <VIcon icon="tabler-brand-microsoft" class="me-2" />
              Button Login
            </VBtn>
            <div v-if="deviceCodeError" class="text-error text-body-2 mt-2">
              {{ deviceCodeError }}
            </div>
          </div>

          <!-- Step 2: Display Verification URI and User Code -->
          <div v-if="deviceCodeStep === 2" class="mb-4">
            <div class="text-body-1 font-weight-bold mb-3">กรุณาไปที่ลิงก์ด้านล่างและป้อนรหัส:</div>
            <div class="mb-3">
              <div class="text-caption text-medium-emphasis mb-1">Link:</div>
              <a :href="verificationUri" target="_blank" class="text-primary text-decoration-underline">
                {{ verificationUri }}
              </a>
            </div>
            <div class="mb-3">
              <div class="text-caption text-medium-emphasis mb-1">User_code:</div>
              <VChip color="primary" size="large" class="text-h6 font-weight-bold">
                {{ userCode }}
              </VChip>
            </div>
            <div class="text-caption text-medium-emphasis mb-4">
              ⏱️ รหัสจะหมดอายุใน {{ Math.floor(deviceCodeExpiresIn / 60) }} นาที
            </div>
            <VBtn
              color="success"
              block
              size="large"
              @click="getAccessToken"
            >
              <VIcon icon="tabler-key" class="me-2" />
              Button Get Token
            </VBtn>
          </div>

          <!-- Step 3: Polling for Access Token -->
          <div v-if="deviceCodeStep === 3" class="text-center">
            <div class="text-body-1 mb-4">
              กำลังรอการยืนยันจาก Microsoft...
            </div>
            <VProgressCircular indeterminate color="primary" size="64" class="mb-4" />
            <div class="text-caption text-medium-emphasis mb-4">
              กรุณาไปที่ลิงก์และป้อนรหัส <strong>{{ userCode }}</strong> ที่ Microsoft
            </div>
            <div class="text-caption text-medium-emphasis mb-2">
              <a :href="verificationUri" target="_blank" class="text-primary text-decoration-underline">
                {{ verificationUri }}
              </a>
            </div>
            <div v-if="accessTokenError" class="text-error text-body-2 mt-4">
              {{ accessTokenError }}
            </div>
            <VBtn
              v-if="accessTokenError"
              color="primary"
              variant="outlined"
              class="mt-4"
              @click="getAccessToken"
            >
              ลองอีกครั้ง
            </VBtn>
          </div>

          <!-- Loading Indicator -->
          <div v-if="deviceCodeLoading || accessTokenLoading" class="text-center mt-4">
            <VProgressCircular indeterminate color="primary" />
          </div>
        </VCardText>
        <VCardActions>
          <VBtn color="grey" variant="outlined" @click="cancelGraphLogin">ยกเลิก</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'

definePage({ meta: { layout: 'default' } })

type ActionStatus = 'in-progress' | 'complete'

interface BaseItem {
  id: string
  __backendId?: string
  parent_task_id: string
  title: string
  description?: string
  due_date?: string
  assign_person?: string
  assignee_code?: string
  assignee_name?: string
  type: 'parent' | 'action'
  hours?: number
  status?: ActionStatus
  created_at: string
  plan_id?: string
  bucket_id?: string
  hour_label?: string
  teamuuid?: string
  postflag?: boolean
}

interface ParentTask extends BaseItem {
  type: 'parent'
  hours: number
  status: 'in-progress'
}

interface ActionTask extends BaseItem {
  type: 'action'
  hours: number
  status: ActionStatus
}

interface SearchTaskResult {
  id: string
  task_id?: string | null
  ref_task_id?: string | null
  task_name: string
  parent_project_code: string | null
  plan_id?: string | null
  display: string
}

interface Employee {
  employee_code: string
  full_name: string
  teamuuid?: string
}

interface Bucket {
  bucket_id: string
  bucket_name: string
}

interface Hour {
  hr: string
  label: string
}

interface ApiActionTask {
  actiontask_id: string
  task_id: string
  task_name: string
  actiontask_name: string
  status: string
  due_date?: string
  assignee_code?: string
  assignee_name?: string
  hour_use?: number
  hour_label?: string
  plan_id?: string
  bucket_id?: string
  bucket_name?: string
  parent_project_code?: string
  teamuuid?: string
  postflag?: boolean
}

declare global {
  interface Window {
    elementSdk?: {
      init: (config: unknown) => Promise<void>
    }
    dataSdk?: {
      init: (handler: { onDataChanged: (data: BaseItem[]) => void }) => Promise<{ isOk: boolean }>
      create: (item: Partial<BaseItem>) => Promise<{ isOk: boolean }>
      update: (item: BaseItem) => Promise<{ isOk: boolean }>
      delete: (item: BaseItem) => Promise<{ isOk: boolean }>
    }
  }
}

const allData = ref<BaseItem[]>([])

const defaultConfig = {
  app_title: '📋 Task Action Management',
  add_task_button: '➕ เพิ่มงานใหม่',
}

const uiText = reactive({
  appTitle: defaultConfig.app_title,
  addTaskButton: defaultConfig.add_task_button,
})

const filters = reactive({
  person: 'all',
  status: 'all',
})

const showAddTaskModal = ref(false)
const showAddActionModal = ref(false)
const confirmClearAllVisible = ref(false)

// Microsoft Graph Login Modal - Device Code Flow
const showGraphLoginModal = ref(false)
const graphLoginLoading = ref(false)
const pendingPostAction = ref<{ backendId: string } | null>(null)

// Device Code Flow State
const deviceCodeStep = ref<1 | 2 | 3>(1)
const deviceCode = ref('')
const userCode = ref('')
const verificationUri = ref('')
const deviceCodeExpiresIn = ref(900) // seconds
const deviceCodeInterval = ref(5) // seconds
const deviceCodeLoading = ref(false)
const deviceCodeError = ref('')
const accessTokenLoading = ref(false)
const accessTokenError = ref('')
const tokenPollingTimer = ref<number | undefined>()

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0]
}

const parentForm = reactive({
  title: '',
  description: '',
  due_date: getTodayDateString(),
  assign_person: '',
  teamuuid: '' as string,
  project_name: '',
  hour_use: '' as string,
  bucket_id: '',
})

const actionForm = reactive({
  parent_task_id: '',
  title: '',
  description: '',
  hours: undefined as number | undefined,
  status: 'in-progress' as ActionStatus,
})

const toast = reactive({
  visible: false,
  message: 'การดำเนินการสำเร็จ!',
  type: 'success' as 'success' | 'error',
  timer: undefined as number | undefined,
})

// Employee functionality
const employees = ref<Employee[]>([])
const loadingEmployees = ref(false)

// Bucket functionality
const buckets = ref<Bucket[]>([])
const loadingBuckets = ref(false)

// Hour functionality
const hours = ref<Hour[]>([])
const loadingHours = ref(false)

// Loading state for action tasks
const loadingActionTasks = ref(false)

// Search Task functionality
const searchTaskQuery = ref('')
const searchTaskResults = ref<SearchTaskResult[]>([])
const searchTaskLoading = ref(false)
const searchTaskTimer = ref<number | undefined>()
const selectedSearchTaskId = ref<string | null>(null)
const selectedSearchRefTaskId = ref<string | null>(null)
const selectedSearchPlanId = ref<string | null>(null)
const selectedAssignee = ref<{ employee?: Employee; value?: string } | null>(null)

const EDGE_SEARCH_URL = '/api/supabase/searchtask'
const EDGE_EMPLOYEE_URL = '/api/supabase/ListEmployee'
const EDGE_LIST_BUCKET_BY_PLAN_URL = '/api/supabase/listbucketbyplan'
const EDGE_LIST_HOUR_URL = '/api/supabase/listhour'
const EDGE_ACTIONTASK_URL = '/api/supabase/ListActionTask'
const EDGE_CREATE_ACTIONTASK_URL = '/api/supabase/createactiontask'
const EDGE_UPDATE_STATUS_URL = '/api/supabase/updatestatusaction'
const EDGE_DELETE_ACTION_URL = '/api/supabase/deleteaction'
const EDGE_UPDATE_POST_FLAG_URL = '/api/supabase/UpdatePostFlag'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Microsoft Graph API Configuration
const GRAPH_API_URL = 'https://graph.microsoft.com/v1.0/planner/tasks'
// Token can be updated from localStorage or environment variable

const DEFAULT_GRAPH_AUTH_TOKEN = process.env.AZURE_TOKEN
const GRAPH_PLAN_ID = 'Gb-5fv9s30ShBpVYF66rrMkAAplC'
const GRAPH_BUCKET_ID = 'aLnqCSgURUa6qZI1165j1ckAKouz'
const GRAPH_ASSIGNMENT_USER_ID = '4c0ffdbf-f9db-43fe-8ad9-16f1d6ef0367'

// Get token from localStorage or use default
const getGraphAuthToken = () => {
  return localStorage.getItem('graph_auth_token') || DEFAULT_GRAPH_AUTH_TOKEN
}

// Microsoft OAuth Configuration - Device Code Flow
const MS_TENANT_ID = '2057d5b3-62eb-4c74-90a7-0a7fc73f460b'
const MS_CLIENT_ID = '625a7da2-7b29-4d7d-aba9-ff809dc674c3'
const MS_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET
const MS_SCOPES = 'offline_access https://graph.microsoft.com/.default'

// Edge Function URLs for Device Code Flow
const EDGE_MS_LOGIN_URL = '/api/supabase/mslogin'
const EDGE_MS_GET_TOKEN_URL = '/api/supabase/msgettoken'

// Device Code Flow Functions
async function getDeviceCode() {
  deviceCodeLoading.value = true
  deviceCodeError.value = ''
  
  try {
    const res = await fetch(EDGE_MS_LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        tenant_id: MS_TENANT_ID,
        client_id: MS_CLIENT_ID,
        scope: MS_SCOPES,
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(errorText || `HTTP ${res.status}`)
    }

    const data = await res.json()
    
    // Check for error in response
    if (data.error) {
      throw new Error(data.error_description || data.error)
    }

    // Store device code data
    deviceCode.value = data.device_code || ''
    userCode.value = data.user_code || ''
    verificationUri.value = data.verification_uri || 'https://microsoft.com/devicelogin'
    deviceCodeExpiresIn.value = data.expires_in || 900
    deviceCodeInterval.value = data.interval || 5

    // Move to step 2
    deviceCodeStep.value = 2
  } catch (e) {
    console.error('Get device code error:', e)
    deviceCodeError.value = e instanceof Error ? e.message : 'เกิดข้อผิดพลาดในการขอ Device Code'
  } finally {
    deviceCodeLoading.value = false
  }
}

async function getAccessToken() {
  if (!deviceCode.value) {
    accessTokenError.value = 'ไม่พบ Device Code กรุณากด Button Login อีกครั้ง'
    return
  }

  // Move to step 3
  deviceCodeStep.value = 3
  accessTokenLoading.value = true
  accessTokenError.value = ''

  // Start polling for token
  const pollForToken = async (): Promise<void> => {
    try {
      const res = await fetch(EDGE_MS_GET_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          device_code: deviceCode.value,
          tenant_id: MS_TENANT_ID,
          client_id: MS_CLIENT_ID,
          client_secret: MS_CLIENT_SECRET,
        }),
      })

      const data = await res.json()

      // Check for error
      if (data.error) {
        // If authorization_pending, continue polling
        if (data.error === 'authorization_pending') {
          // Schedule next poll
          tokenPollingTimer.value = window.setTimeout(pollForToken, deviceCodeInterval.value * 1000)
          return
        }
        // Other errors: show and stop
        throw new Error(data.error_description || data.error)
      }

      // Success: got access token
      if (data.access_token) {
        // Save token to localStorage
        localStorage.setItem('graph_auth_token', data.access_token)
        
        // Also save refresh token if available
        if (data.refresh_token) {
          localStorage.setItem('graph_refresh_token', data.refresh_token)
        }

        showToast('ลงชื่อเข้าใช้สำเร็จ! Token ถูกบันทึกแล้ว', 'success')
        
        // Close modal and reset state
        closeMicrosoftModal()
        
        // Retry pending post action if any
        if (pendingPostAction.value) {
          setTimeout(() => {
            postAction(pendingPostAction.value!.backendId)
          }, 500)
        }
      } else {
        throw new Error('ไม่พบ access_token ใน response')
      }
    } catch (e) {
      console.error('Get access token error:', e)
      accessTokenError.value = e instanceof Error ? e.message : 'เกิดข้อผิดพลาดในการรับ Token'
      accessTokenLoading.value = false
    }
  }

  // Start polling
  await pollForToken()
}

function openMicrosoftModal() {
  showGraphLoginModal.value = true
  deviceCodeStep.value = 1
  // Reset state
  deviceCode.value = ''
  userCode.value = ''
  verificationUri.value = ''
  deviceCodeError.value = ''
  accessTokenError.value = ''
}

function closeMicrosoftModal() {
  // Stop polling if active
  if (tokenPollingTimer.value) {
    clearTimeout(tokenPollingTimer.value)
    tokenPollingTimer.value = undefined
  }
  
  showGraphLoginModal.value = false
  pendingPostAction.value = null
  graphLoginLoading.value = false
  deviceCodeStep.value = 1
  deviceCodeLoading.value = false
  accessTokenLoading.value = false
}

function cancelGraphLogin() {
  closeMicrosoftModal()
}

const handleSearchTask = async (keyword: string | null) => {
  if (searchTaskTimer.value) {
    clearTimeout(searchTaskTimer.value)
  }

  const query = keyword?.trim() || ''
  if (query.length < 3) {
    searchTaskResults.value = []
    return
  }

  searchTaskLoading.value = true
  searchTaskTimer.value = window.setTimeout(async () => {
    try {
      const res = await fetch(EDGE_SEARCH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ keyword: query }),
      })
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      const results = Array.isArray(data?.results) ? data.results : []
      searchTaskResults.value = results.map((r: any, index: number) => ({
        id: `${r.task_id || ''}_${r.ref_task_id || 'null'}_${index}_${Date.now()}`,
        task_id: r.task_id ?? null,
        ref_task_id: r.ref_task_id ?? null,
        task_name: r.task_name || '',
        parent_project_code: r.parent_project_code || null,
        plan_id: r.plan_id ?? null,
        display: `${r.task_name}${r.parent_project_code ? ` - ${r.parent_project_code}` : ''}`,
      }))
    } catch (e) {
      console.error(e)
      searchTaskResults.value = []
    } finally {
      searchTaskLoading.value = false
    }
  }, 300)
}

const handleSelectSearchTask = async (item: SearchTaskResult | null) => {
  if (!item) return
  parentForm.title = item.task_name
  // parent_task_id will be generated automatically from title in addParentTask
  if (item.parent_project_code) {
    parentForm.project_name = item.parent_project_code
  }
  selectedSearchTaskId.value = item.task_id ?? null
  selectedSearchRefTaskId.value = item.ref_task_id ?? null
  selectedSearchPlanId.value = item.plan_id ?? null
  
  // Load buckets if plan_id is available
  if (item.plan_id) {
    await loadBucketsByPlan(item.plan_id)
  } else {
    buckets.value = []
    parentForm.bucket_id = ''
  }
}

const handleSelectAssignee = (item: { employee?: Employee; value?: string } | null) => {
  selectedAssignee.value = item
  
  if (!item) {
    parentForm.assign_person = ''
    parentForm.teamuuid = ''
    return
  }
  
  // If item has employee object, use it
  if (item.employee) {
    parentForm.assign_person = item.employee.full_name
    parentForm.teamuuid = item.employee.teamuuid || ''
  } else if (item.value) {
    // Fallback: find employee by full_name
    const employee = employees.value.find(e => e.full_name === item.value)
    if (employee) {
      parentForm.assign_person = employee.full_name
      parentForm.teamuuid = employee.teamuuid || ''
    } else {
      parentForm.assign_person = item.value
      parentForm.teamuuid = ''
    }
  }
}

async function loadEmployees() {
  loadingEmployees.value = true
  try {
    const res = await fetch(EDGE_EMPLOYEE_URL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })
    if (!res.ok) throw new Error('Failed to load employees')
    const data = await res.json()
    employees.value = Array.isArray(data?.employees) ? data.employees : []
  } catch (e) {
    console.error('Error loading employees:', e)
    employees.value = []
  } finally {
    loadingEmployees.value = false
  }
}

async function loadBucketsByPlan(planId: string | null) {
  if (!planId) {
    buckets.value = []
    return
  }

  loadingBuckets.value = true
  try {
    const res = await fetch(EDGE_LIST_BUCKET_BY_PLAN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ plan_id: planId }),
    })
    if (!res.ok) throw new Error('Failed to load buckets')
    const data = await res.json()
    buckets.value = Array.isArray(data?.buckets) ? data.buckets : []
  } catch (e) {
    console.error('Error loading buckets:', e)
    buckets.value = []
  } finally {
    loadingBuckets.value = false
  }
}

async function loadHours() {
  loadingHours.value = true
  try {
    const res = await fetch(EDGE_LIST_HOUR_URL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })
    if (!res.ok) throw new Error('Failed to load hours')
    const data = await res.json()
    hours.value = Array.isArray(data?.hours) ? data.hours : []
  } catch (e) {
    console.error('Error loading hours:', e)
    hours.value = []
  } finally {
    loadingHours.value = false
  }
}

function normalizeStatus(status: string): ActionStatus {
  if (status === 'complete' || status === 'เสร็จแล้ว') return 'complete'
  return 'in-progress'
}

async function loadActionTasks() {
  loadingActionTasks.value = true
  try {
    // Map filter to API params
    let assigneeCode = 'ALL'
    if (filters.person !== 'all') {
      // Find employee by full_name to get employee_code
      const employee = employees.value.find(emp => emp.full_name === filters.person)
      assigneeCode = employee ? employee.employee_code : 'ALL'
    }

    let statusParam = 'ALL'
    if (filters.status === 'complete') {
      statusParam = 'complete'
    } else if (filters.status === 'in-progress') {
      statusParam = 'not start'
    }

    const res = await fetch(EDGE_ACTIONTASK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        assignee_code: assigneeCode,
        status: statusParam,
      }),
    })
    
    if (!res.ok) {
      const errorText = await res.text()
      let errorMessage = `Failed to load action tasks: HTTP ${res.status} ${res.statusText}`
      
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.error || errorJson.message || errorMessage
      } catch {
        errorMessage = errorText || errorMessage
      }
      
      console.error('ListActionTask API Error:', {
        status: res.status,
        statusText: res.statusText,
        url: EDGE_ACTIONTASK_URL,
        payload: {
          assignee_code: assigneeCode,
          status: statusParam,
        },
        error: errorText,
      })
      
      throw new Error(errorMessage)
    }
    
    const data = await res.json()
    const apiActionTasks: ApiActionTask[] = Array.isArray(data?.actiontasks) ? data.actiontasks : []

    // Debug: Log API response to check if required fields exist
    if (apiActionTasks.length > 0) {
      console.log('API ActionTasks Sample (from EDGE_ACTIONTASK_URL):', {
        actiontask_id: apiActionTasks[0].actiontask_id,
        assignee_name: apiActionTasks[0].assignee_name,
        assignee_code: apiActionTasks[0].assignee_code,
        hour_label: apiActionTasks[0].hour_label,
        plan_id: apiActionTasks[0].plan_id,
        bucket_id: apiActionTasks[0].bucket_id,
        teamuuid: apiActionTasks[0].teamuuid,
        postflag: apiActionTasks[0].postflag,
        full_data: apiActionTasks[0],
      })
    }

    // Transform API data to internal structure
    const taskMap = new Map<string, {
      parent: ParentTask
      actions: ActionTask[]
    }>()

    for (const apiTask of apiActionTasks) {
      const taskId = apiTask.task_id
      
      // Get or create parent task
      if (!taskMap.has(taskId)) {
        const parentTask: ParentTask = {
          id: `parent_${taskId}`,
          __backendId: taskId,
          parent_task_id: taskId,
          title: apiTask.task_name || '',
          description: '',
          due_date: apiTask.due_date || '',
          assign_person: apiTask.assignee_name || apiTask.assignee_code || '',
          type: 'parent',
          hours: 0, // Will be calculated from actions
          status: 'in-progress',
          created_at: new Date().toISOString(),
        }
        taskMap.set(taskId, { parent: parentTask, actions: [] })
      }

      // Create action task
      const actionTask: ActionTask = {
        id: `action_${apiTask.actiontask_id}`,
        __backendId: apiTask.actiontask_id,
        parent_task_id: taskId,
        title: apiTask.actiontask_name || '',
        description: '',
        due_date: apiTask.due_date || '',
        assign_person: apiTask.assignee_name || apiTask.assignee_code || '',
        assignee_code: apiTask.assignee_code,
        assignee_name: apiTask.assignee_name,
        type: 'action',
        hours: apiTask.hour_use || 0,
        status: normalizeStatus(apiTask.status),
        created_at: new Date().toISOString(),
        plan_id: apiTask.plan_id,
        bucket_id: apiTask.bucket_id,
        hour_label: apiTask.hour_label,
        teamuuid: apiTask.teamuuid,
        postflag: apiTask.postflag || false,
      }
      taskMap.get(taskId)!.actions.push(actionTask)
    }

    // Calculate total hours for each parent task
    const allItems: BaseItem[] = []
    for (const { parent, actions } of taskMap.values()) {
      parent.hours = actions.reduce((sum, a) => sum + parseFloat(String(a.hours || 0)), 0)
      allItems.push(parent)
      allItems.push(...actions)
    }

    allData.value = allItems
  } catch (e) {
    console.error('Error loading action tasks:', e)
    allData.value = []
  } finally {
    loadingActionTasks.value = false
  }
}

function showToast(message: string, type: 'success' | 'error' = 'success') {
  toast.message = message
  toast.type = type
  toast.visible = true
  window.clearTimeout(toast.timer)
  toast.timer = window.setTimeout(() => {
    toast.visible = false
  }, 3000)
}

function formatDate(dateString?: string) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('th-TH')
}

const parentTasks = computed<ParentTask[]>(() =>
  allData.value.filter((i) => i.type === 'parent') as ParentTask[]
)

const actionTasks = computed<ActionTask[]>(() =>
  allData.value.filter((i) => i.type === 'action') as ActionTask[]
)

const stats = computed(() => {
  const totalParentTasks = parentTasks.value.length
  const totalActionTasks = actionTasks.value.length
  const totalHours = actionTasks.value.reduce((sum, a) => sum + parseFloat(String(a.hours || 0)), 0)
  const completedActions = actionTasks.value.filter((a) => a.status === 'complete').length
  return { totalParentTasks, totalActionTasks, totalHours, completedActions }
})

const employeeSelectOptions = computed(() => {
  const options = [{ title: 'ทั้งหมด', value: 'all' }]
  for (const emp of employees.value) {
    options.push({
      title: `${emp.full_name} (${emp.employee_code})`,
      value: emp.full_name,
    })
  }
  return options
})

const bucketSelectOptions = computed(() => {
  return buckets.value.map(bucket => ({
    title: bucket.bucket_name,
    value: bucket.bucket_id,
  }))
})

const hourOptions = computed(() => {
  return hours.value.map(hour => ({
    hr: hour.hr,
    label: hour.label,
  }))
})

function getActions(parentId: string) {
  return actionTasks.value
    .filter((a) => a.parent_task_id === parentId)
    .slice()
}

function getTotalHours(parentId: string) {
  return getActions(parentId).reduce((sum, a) => sum + parseFloat(String(a.hours || 0)), 0)
}

function getCompletedActionsCount(parentId: string) {
  return getActions(parentId).filter((a) => a.status === 'complete').length
}

const filteredParentTasks = computed<ParentTask[]>(() => {
  // Since filtering is done at API level, just return all parent tasks
  // But we still sort them
  return parentTasks.value.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
})

function closeAddTaskModal() {
  showAddTaskModal.value = false
  parentForm.title = ''
  parentForm.description = ''
  parentForm.due_date = getTodayDateString()
  parentForm.assign_person = ''
  parentForm.teamuuid = ''
  parentForm.project_name = ''
  parentForm.hour_use = ''
  parentForm.bucket_id = ''
  searchTaskQuery.value = ''
  searchTaskResults.value = []
  selectedSearchTaskId.value = null
  selectedSearchRefTaskId.value = null
  selectedSearchPlanId.value = null
  selectedAssignee.value = null
  buckets.value = []
}

function openAddAction(parentTaskId: string) {
  actionForm.parent_task_id = parentTaskId
  actionForm.title = ''
  actionForm.description = ''
  actionForm.hours = undefined
  actionForm.status = 'in-progress'
  showAddActionModal.value = true
}

function closeAddActionModal() {
  showAddActionModal.value = false
  actionForm.parent_task_id = ''
  actionForm.title = ''
  actionForm.description = ''
  actionForm.hours = undefined
  actionForm.status = 'in-progress'
}

async function addParentTask() {
  const currentRecordCount = allData.value.length
  if (currentRecordCount >= 999) {
    showToast('ถึงขีดจำกัดสูงสุด 999 รายการแล้ว กรุณาลบข้อมูลบางส่วนก่อน', 'error')
    return
  }

  const hourUseLabel = parentForm.hour_use
  if (!hourUseLabel || hourUseLabel === '') {
    showToast('กรุณาเลือกชั่วโมงที่ใช้', 'error')
    return
  }

  // Generate unique parent_task_id from title + timestamp
  const timestamp = Date.now()
  const parentTaskId = selectedSearchTaskId.value || `${parentForm.title}_${timestamp}`

  // No duplicate parent_task_id validation per request

  // Try creating via Edge Function as requested
  try {
    let assigneeCode = 'ALL'
    let assigneeName = parentForm.assign_person || ''
    const emp = employees.value.find(e => e.full_name === assigneeName)
    if (emp) assigneeCode = emp.employee_code

    // Find hour value from label for fallback
    const selectedHour = hours.value.find(h => h.label === hourUseLabel)
    console.log(selectedHour)
    const hourUseValue = selectedHour ? parseFloat(selectedHour.hr) : 0
    const hourLabel = selectedHour.label

    // Find bucket name from bucket_id
    const selectedBucket = buckets.value.find(b => b.bucket_id === parentForm.bucket_id)
    const bucketName = selectedBucket ? selectedBucket.bucket_name : undefined
    console.log(selectedBucket)
    console.log(selectedSearchPlanId.value)

    const payload = {
      task_id: parentTaskId, // using generated id if backend doesn't supply one from search
      actiontask_name: parentForm.description || parentForm.title,
      status: 'not start',
      due_date: parentForm.due_date,
      assignee_code: assigneeCode,
      hour_use: hourUseValue, // Send as number
      hour_label: hourLabel, // Send as "X hours" format
      plan_id: selectedSearchPlanId.value,
      bucket_id: selectedBucket.bucket_id,
      bucket_name: selectedBucket.bucket_name,
      parent_project_code: parentForm.project_name || undefined,
      created_by_user_id: undefined,
      is_active: true,
      assignee_name: assigneeName || undefined,
      teamuuid: parentForm.teamuuid || undefined,
    }

    const res = await fetch(EDGE_CREATE_ACTIONTASK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) throw new Error('Create action task failed')
    await res.json()
    closeAddTaskModal()
    showToast('เพิ่มงานหลักสำเร็จ!')
    await loadActionTasks()
    return
  } catch (e) {
    console.warn('Edge createactiontask failed, fallback to local/dataSdk:', e)
  }

  // Fallback: update via dataSdk if available, else only local UI
  const newTask: ParentTask = {
    id: `parent_${timestamp}`,
    parent_task_id: parentTaskId,
    title: parentForm.title,
    description: parentForm.description,
    due_date: parentForm.due_date,
    assign_person: parentForm.assign_person,
    type: 'parent',
    hours: hourUseValue,
    status: 'in-progress',
    created_at: new Date().toISOString(),
  }

  const sdk = window.dataSdk
  if (sdk) {
    const result = await sdk.create(newTask)
    if (result.isOk) {
      closeAddTaskModal()
      showToast('เพิ่มงานหลักสำเร็จ!')
      return
    }
  }
  // Pure local fallback
  allData.value = [...allData.value, newTask]
  closeAddTaskModal()
  showToast('เพิ่มงานหลักสำเร็จ!')
}

async function addActionTask() {
  const currentRecordCount = allData.value.length
  if (currentRecordCount >= 999) {
    showToast('ถึงขีดจำกัดสูงสุด 999 รายการแล้ว กรุณาลบข้อมูลบางส่วนก่อน', 'error')
    return
  }

  const hours = actionForm.hours
  if (!hours) {
    showToast('กรุณาเลือกจำนวนชั่วโมง', 'error')
    return
  }

  // Prepare payload for Edge Function
  // Find parent task info
  const parent = parentTasks.value.find(p => p.parent_task_id === actionForm.parent_task_id)
  // Map assignee (prefer parent's assign_person => code from employees)
  let assigneeName = parent?.assign_person || ''
  let assigneeCode = ''
  const emp = employees.value.find(e => e.full_name === assigneeName)
  if (emp) assigneeCode = emp.employee_code

  // Map status to API expected values
  const apiStatus = actionForm.status === 'complete' ? 'complete' : 'not start'

  const payload = {
    task_id: actionForm.parent_task_id,
    actiontask_name: actionForm.description || actionForm.title,
    status: apiStatus,
    due_date: parent?.due_date || new Date().toISOString().split('T')[0],
    assignee_code: assigneeCode || 'ALL',
    hour_use: hours,
    parent_project_code: undefined,
    created_by_user_id: undefined,
    is_active: true,
    assignee_name: assigneeName || undefined,
  }

  try {
    const res = await fetch(EDGE_CREATE_ACTIONTASK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Create action task failed')
    // Optionally read response
    await res.json()
    closeAddActionModal()
    showToast('เพิ่ม Action Task สำเร็จ!')
    // Refresh list from API to reflect new item
    await loadActionTasks()
  } catch (e) {
    console.error('Error creating action task:', e)
    showToast('เกิดข้อผิดพลาดในการเพิ่ม Action Task', 'error')
  }
}

async function updateActionStatus(actionBackendId: string, newStatus: ActionStatus) {
  const action = allData.value.find((i) => i.__backendId === actionBackendId)
  if (!action) return

  // Map UI status to API value
  const apiStatus = newStatus === 'complete' ? 'complete' : 'inprogress'

  try {
    const res = await fetch(EDGE_UPDATE_STATUS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ actiontask_id: actionBackendId, status: apiStatus }),
    })
    if (!res.ok) throw new Error('Failed to update status')
    // Update local state
    action.status = newStatus
    showToast('อัปเดตสถานะสำเร็จ!')
  } catch (e) {
    console.error('Update status error:', e)
    showToast('เกิดข้อผิดพลาดในการอัปเดต', 'error')
  }
}

async function postAction(backendId: string) {
  const action = allData.value.find((i) => i.__backendId === backendId)
  if (!action || action.type !== 'action') {
    showToast('ไม่พบ Action Task', 'error')
    return
  }

  // Debug: Log action data including teamuuid
  console.log('Action Task Data for Microsoft Graph:', {
    plan_id: action.plan_id,
    bucket_id: action.bucket_id,
    hour_label: action.hour_label,
    assignee_code: action.assignee_code,
    assignee_name: action.assignee_name,
    teamuuid: action.teamuuid,
  })

  try {
    // Format due_date to ISO format with time
    let dueDateTime = '2025-11-15T00:00:00Z' // default
    if (action.due_date) {
      const date = new Date(action.due_date)
      if (!isNaN(date.getTime())) {
        // Set to end of day in UTC
        date.setUTCHours(0, 0, 0, 0)
        dueDateTime = date.toISOString()
      }
    }

    // Get plan_id and bucket_id from actiontask (required, no fallback)
    const planId = action.plan_id
    const bucketId = action.bucket_id
    console.log(action.plan_id)

    // Convert hour_label to appliedCategories
    // hour_label in database is already "category1", "category2", etc.
    // Use it directly as appliedCategories
    let appliedCategories: Record<string, boolean> = {}
    if (action.hour_label) {
      // hour_label is already in category format (e.g., "category1", "category2")
      // Normalize to lowercase and use directly
      const categoryName = action.hour_label.trim().toLowerCase()
      // Validate it's a valid category format (category1-25)
      if (categoryName.match(/^category\d+$/)) {
        appliedCategories[categoryName] = true
      } else {
        // If format is invalid, default to category1
        console.warn('Invalid hour_label format:', action.hour_label, '- Using category1')
        appliedCategories.category1 = true
      }
    } else {
      // Default to category1 if no hour_label
      console.warn('No hour_label found - Using category1')
      appliedCategories.category1 = true
    }

    // Get assignee UUID from teamuuid (preferred) or assignee_code
    // teamuuid is the UUID for Microsoft Graph API assignments
    let assigneeUuid = GRAPH_ASSIGNMENT_USER_ID // default fallback
    
    if (action.teamuuid) {
      // Use teamuuid if available (from ListActionTask API)
      assigneeUuid = action.teamuuid
    } else if (action.assignee_code) {
      // Fallback: Check if assignee_code is already a UUID format
      if (action.assignee_code.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        assigneeUuid = action.assignee_code
      } else {
        // If assignee_code is employee_code (like "GEC372"), use fallback
        console.warn('assignee_code is not a UUID format and no teamuuid found:', action.assignee_code, '- Using fallback UUID')
      }
    } else {
      console.warn('Action Task does not have teamuuid or assignee_code - Using fallback UUID')
    }

    

    // Prepare payload for Microsoft Graph API
    const payload = {
      planId: planId,
      bucketId: bucketId,
      title: action.title || 'Action Task',
      appliedCategories: appliedCategories,
      percentComplete: 100, // Not started (as per curl example)
      dueDateTime: dueDateTime,
      assignments: {
        [assigneeUuid]: {
          '@odata.type': '#microsoft.graph.plannerAssignment',
          orderHint: ' !'
        }
      }
    }

    // Log payload before sending to GRAPH_API_URL
    console.log('=== Sending to GRAPH_API_URL ===')
    console.log('URL:', GRAPH_API_URL)
    console.log('Payload:', JSON.stringify(payload, null, 2))
    console.log('Payload (Object):', payload)

    const authToken = getGraphAuthToken()
    const res = await fetch(GRAPH_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const errorText = await res.text()
      let errorMessage = `HTTP ${res.status}: ${res.statusText}`
      let errorCode = ''
      
      try {
        const errorJson = JSON.parse(errorText)
        errorCode = errorJson.error?.code || ''
        errorMessage = errorJson.error?.message || errorJson.message || errorMessage
        
        // Special handling for token expiration - show login modal
        if (res.status === 401 && (errorCode === 'InvalidAuthenticationToken' || errorMessage.includes('expired'))) {
          // Store the action to retry after login
          pendingPostAction.value = { backendId }
          // Show login modal with device code flow
          openMicrosoftModal()
          return
        }
      } catch {
        errorMessage = errorText || errorMessage
      }
      
      console.error('Graph API Error:', {
        status: res.status,
        statusText: res.statusText,
        errorCode,
        body: errorText,
        payload
      })
      
      showToast(`เกิดข้อผิดพลาด: ${errorMessage}`, 'error')
      return
    }

    const result = await res.json()
    console.log('Graph API Success:', result)
    
    // Update postflag after successful post to Microsoft Graph
    await updatePostFlag(backendId)
    
    showToast('Post Action Task ไปยัง Microsoft Planner สำเร็จ!', 'success')
  } catch (e) {
    console.error('Post action error:', e)
    const errorMessage = e instanceof Error ? e.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
    showToast(`เกิดข้อผิดพลาดในการ Post: ${errorMessage}`, 'error')
  }
}

async function updatePostFlag(actiontaskId: string) {
  try {
    const res = await fetch(EDGE_UPDATE_POST_FLAG_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ 
        actiontask_id: actiontaskId,
        postflag: 1
      }),
    })
    
    if (!res.ok) {
      const errorText = await res.text()
      console.error('UpdatePostFlag error:', errorText)
      return
    }
    
    const data = await res.json()
    console.log('UpdatePostFlag success:', data)
    
    // Update local state
    const action = allData.value.find((i) => i.__backendId === actiontaskId)
    if (action) {
      action.postflag = true
    }
  } catch (e) {
    console.error('UpdatePostFlag error:', e)
  }
}

async function deleteItem(backendId: string) {
  const item = allData.value.find((i) => i.__backendId === backendId)
  if (!item) return
  // If deleting action task, call Edge Function
  if (item.type === 'action') {
    try {
      const res = await fetch(EDGE_DELETE_ACTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ actiontask_id: backendId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.error) throw new Error(data?.error || 'Delete failed')
      // remove locally
      allData.value = allData.value.filter((i) => i.__backendId !== backendId)
      showToast('ลบ Action Task แล้ว')
      return
    } catch (e) {
      console.error('Delete action error:', e)
      showToast('เกิดข้อผิดพลาดในการลบ', 'error')
      return
    }
  }

  const sdk = window.dataSdk
  if (!sdk) {
    console.error('dataSdk not available')
    return
  }

  if (item.type === 'parent') {
    const related = allData.value.filter(
      (a) => a.type === 'action' && a.parent_task_id === item.parent_task_id
    )
    for (const a of related) {
      await sdk.delete(a)
    }
  }

  const result = await sdk.delete(item)
  if (result.isOk) {
    showToast(item.type === 'parent' ? 'ลบงานหลักและ Action Tasks ที่เกี่ยวข้องแล้ว' : 'ลบ Action Task แล้ว')
  } else {
    showToast('เกิดข้อผิดพลาดในการลบ', 'error')
  }
}

async function confirmClearAll() {
  const sdk = window.dataSdk
  if (!sdk) {
    console.error('dataSdk not available')
    confirmClearAllVisible.value = false
    return
  }
  for (const item of allData.value) {
    await sdk.delete(item)
  }
  confirmClearAllVisible.value = false
  showToast('ลบข้อมูลทั้งหมดเรียบร้อยแล้ว')
}

function noop() {}

const elementConfig = {
  defaultConfig: defaultConfig,
  onConfigChange: async (config: Record<string, string>) => {
    uiText.appTitle = config.app_title || defaultConfig.app_title
    uiText.addTaskButton = config.add_task_button || defaultConfig.add_task_button
  },
  mapToCapabilities: (_config: unknown) => ({
    recolorables: [],
    borderables: [],
    fontEditable: undefined,
    fontSizeable: undefined,
  }),
  mapToEditPanelValues: (config: Record<string, string>) =>
    new Map<string, string>([
      ['app_title', config.app_title || defaultConfig.app_title],
      ['add_task_button', config.add_task_button || defaultConfig.add_task_button],
    ]),
}

const dataHandler = {
  onDataChanged(data: BaseItem[]) {
    allData.value = data
  },
}

async function initializeApp() {
  try {
    if (window.elementSdk) {
      await window.elementSdk.init(elementConfig)
    }
    if (window.dataSdk) {
      const result = await window.dataSdk.init(dataHandler)
      if (!result.isOk) {
        console.error('Failed to initialize data SDK')
      }
    }
  } catch (e) {
    console.error('Failed to initialize app:', e)
  }
}

watch([() => filters.person, () => filters.status], () => {
  loadActionTasks()
}, { immediate: false })

onMounted(() => {
  initializeApp()
  loadEmployees()
  loadHours()
  loadActionTasks()
  
  // Device Code Flow doesn't require callback handling
  // Token is retrieved via polling after user enters code on Microsoft website
})
</script>

<style scoped>
</style>







