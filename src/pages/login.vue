<script setup lang="ts">
import AuthProvider from '@/views/pages/authentication/AuthProvider.vue'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import authV2LoginIllustrationBorderedDark from '@images/pages/auth-v2-login-illustration-bordered-dark.png'
import authV2LoginIllustrationBorderedLight from '@images/pages/auth-v2-login-illustration-bordered-light.png'
import authV2LoginIllustrationDark from '@images/pages/auth-v2-login-illustration-dark.png'
import authV2LoginIllustrationLight from '@images/pages/auth-v2-login-illustration-light.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'

definePage({
  meta: {
    layout: 'blank',
    public: true,
  },
})

const form = ref({
  email: '',
  password: '',
  remember: false,
})

const isPasswordVisible = ref(false)

const authThemeImg = useGenerateImageVariant(
  authV2LoginIllustrationLight,
  authV2LoginIllustrationDark,
  authV2LoginIllustrationBorderedLight,
  authV2LoginIllustrationBorderedDark,
  true)

const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

// Supabase Edge Function login endpoint + keys (move to env for production)
// Use proxy to avoid CORS issues
const SUPABASE_EDGE_LOGIN_URL = '/api/supabase/login'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0b3l1cmFhY25neXZnZHZ4dmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MDMxNDAsImV4cCI6MjA3NzM3MjQ2OX0.zbWnxWTFTwzjRurN6QUYEXEHqfRLtMSjBiPJF1S8UDU'

const isSubmitting = ref(false)
const errorMessage = ref('')
const router = useRouter()

// Password Change Dialog
const isPasswordChangeDialogVisible = ref(false)
const isChangeSubmitting = ref(false)
const changeErrorMessage = ref('')
const changeSuccessMessage = ref('')
const newPasswordForm = ref({
  newPassword: '',
  confirmPassword: '',
})

const handleLogin = async () => {
  errorMessage.value = ''
  isSubmitting.value = true
  try {
    // Basic client-side validation
    if (!form.value.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
      errorMessage.value = 'Please enter a valid email'
      return
    }
    if (!form.value.password || form.value.password.length < 6) {
      errorMessage.value = 'Password must be at least 6 characters'
      return
    }

    // Bypass login for cholatis@gec.co.th
    if (form.value.email === 'cholatis@gec.co.th') {
      const mockData = {
        accessToken: 'mock-access-token-bypass',
        refreshToken: 'mock-refresh-token-bypass',
        expiresIn: 3600 * 24, // 24 hours
        user: {
          id: 'bypass-user-id',
          email: 'cholatis@gec.co.th',
          user_metadata: {
            full_name: 'Cholatis GEC',
            avatar_url: '',
          },
          role: 'authenticated',
        },
      }

      localStorage.setItem('accessToken', mockData.accessToken)
      localStorage.setItem('refreshToken', mockData.refreshToken)
      localStorage.setItem('accessTokenExpiresAt', String(Date.now() + mockData.expiresIn * 1000))
      localStorage.setItem('currentUser', JSON.stringify(mockData.user))

      // Also set cookie for useApi
      document.cookie = `accessToken=${mockData.accessToken}; path=/; max-age=${mockData.expiresIn}`

      router.push('/main')
      
      return
    }

    const res = await fetch(SUPABASE_EDGE_LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email: form.value.email, password: form.value.password }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok || (data && data.error) || typeof data?.accessToken !== 'string' || !data.accessToken) {
      errorMessage.value = data?.error || 'Login failed'
      return
    }

    // Persist tokens
    localStorage.setItem('accessToken', data.accessToken)
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)
    if (data.expiresIn) localStorage.setItem('accessTokenExpiresAt', String(Date.now() + data.expiresIn * 1000))
    if (data.user) localStorage.setItem('currentUser', JSON.stringify(data.user))

    // Check if password change is required
    if (data.requiresPasswordChange) {
      isPasswordChangeDialogVisible.value = true
      return
    }

    // Redirect to main page
    router.push('/main')
  } catch (err) {
    errorMessage.value = 'Network error'
  } finally {
    isSubmitting.value = false
  }
}

const SUPABASE_CHANGE_PASSWORD_URL = '/api/supabase/change-password'

const handleChangePassword = async () => {
  if (newPasswordForm.value.newPassword !== newPasswordForm.value.confirmPassword) {
    changeErrorMessage.value = 'Passwords do not match'
    return
  }
  if (newPasswordForm.value.newPassword.length < 8) {
    changeErrorMessage.value = 'Password must be at least 8 characters'
    return
  }

  isChangeSubmitting.value = true
  changeErrorMessage.value = ''
  changeSuccessMessage.value = ''

  try {
    const res = await fetch(SUPABASE_CHANGE_PASSWORD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ 
        email: form.value.email, 
        newPassword: newPasswordForm.value.newPassword 
      }),
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      changeErrorMessage.value = data.error || 'Failed to update password'
    } else {
      changeSuccessMessage.value = 'Password updated! Redirecting...'
      setTimeout(() => {
        isPasswordChangeDialogVisible.value = false
        router.push('/main')
      }, 2000)
    }
  } catch (err) {
    changeErrorMessage.value = 'Network error'
  } finally {
    isChangeSubmitting.value = false
  }
}
</script>

<template>
  <a href="javascript:void(0)">
    <div class="auth-logo d-flex align-center gap-x-3">
      <VNodeRenderer :nodes="themeConfig.app.logo" />
      <h1 class="auth-title">
        {{ themeConfig.app.title }}
      </h1>
    </div>
  </a>

  <VRow
    no-gutters
    class="auth-wrapper bg-surface"
  >
    <VCol
      md="8"
      class="d-none d-md-flex"
    >
      <div class="position-relative bg-background w-100 me-0">
        <div
          class="d-flex align-center justify-center w-100 h-100"
          style="padding-inline: 6.25rem;"
        >
          <VImg
            max-width="613"
            :src="authThemeImg"
            class="auth-illustration mt-16 mb-2"
          />
        </div>

        <img
          class="auth-footer-mask flip-in-rtl"
          :src="authThemeMask"
          alt="auth-footer-mask"
          height="280"
          width="100"
        >
      </div>
    </VCol>

    <VCol
      cols="12"
      md="4"
      class="auth-card-v2 d-flex align-center justify-center"
    >
      <VCard
        flat
        :max-width="500"
        class="mt-12 mt-sm-0 pa-6"
      >
        <VCardText>
          <h4 class="text-h4 mb-1">
            Welcome to <span class="text-capitalize">{{ themeConfig.app.title }}</span>! 👋🏻
          </h4>
          <p class="mb-0">
            Please sign-in to your account and start the adventure
          </p>
        </VCardText>
        <VCardText>
          <VAlert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            {{ errorMessage }}
          </VAlert>
          <VForm @submit.prevent="handleLogin">
            <VRow>
              <!-- email -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.email"
                  autofocus
                  label="Email or Username"
                  type="email"
                  placeholder="johndoe@email.com"
                />
              </VCol>

              <!-- password -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.password"
                  label="Password"
                  placeholder="············"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  autocomplete="password"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />

                <div class="d-flex align-center flex-wrap justify-space-between my-6">
                  <VCheckbox
                    v-model="form.remember"
                    label="Remember me"
                  />
                  <a
                    class="text-primary"
                    href="javascript:void(0)"
                  >
                    Forgot Password?
                  </a>
                </div>

                <VBtn
                  block
                  type="submit"
                  :loading="isSubmitting"
                  :disabled="isSubmitting"
                >
                  Login
                </VBtn>
              </VCol>

              <!-- create account -->
              <VCol
                cols="12"
                class="text-body-1 text-center"
              >
                <span class="d-inline-block">
                  New on our platform?
                </span>
                <a
                  class="text-primary ms-1 d-inline-block text-body-1"
                  href="javascript:void(0)"
                >
                  Create an account
                </a>
              </VCol>

              <VCol
                cols="12"
                class="d-flex align-center"
              >
                <VDivider />
                <span class="mx-4">or</span>
                <VDivider />
              </VCol>

              <!-- auth providers -->
              <VCol
                cols="12"
                class="text-center"
              >
                <AuthProvider />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <!-- Password Change Dialog -->
  <VDialog
    v-model="isPasswordChangeDialogVisible"
    persistent
    max-width="500"
  >
    <VCard title="Change Password Required">
      <VCardText>
        <p>Please set a permanent password for your account.</p>
        
        <VAlert
          v-if="changeErrorMessage"
          type="error"
          variant="tonal"
          class="mb-4"
        >
          {{ changeErrorMessage }}
        </VAlert>

        <VAlert
          v-if="changeSuccessMessage"
          type="success"
          variant="tonal"
          class="mb-4"
        >
          {{ changeSuccessMessage }}
        </VAlert>

        <VForm @submit.prevent="handleChangePassword">
          <AppTextField
            v-model="newPasswordForm.newPassword"
            label="New Password"
            type="password"
            placeholder="············"
            class="mb-4"
          />
          <AppTextField
            v-model="newPasswordForm.confirmPassword"
            label="Confirm New Password"
            type="password"
            placeholder="············"
            class="mb-6"
          />
          
          <div class="d-flex justify-end gap-x-4">
            <VBtn
              color="secondary"
              variant="tonal"
              @click="isPasswordChangeDialogVisible = false"
            >
              Cancel
            </VBtn>
            <VBtn
              type="submit"
              :loading="isChangeSubmitting"
              :disabled="isChangeSubmitting"
            >
              Update Password
            </VBtn>
          </div>
        </VForm>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";
</style>
