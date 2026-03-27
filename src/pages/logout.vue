<template>
  <div class="flex items-center justify-center min-h-[60vh]">
    <div class="text-center">
      <div class="animate-pulse text-gray-600 mb-2">กำลังออกจากระบบ...</div>
      <div class="text-sm text-gray-500">โปรดรอสักครู่</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Use proxy to avoid CORS issues
const SUPABASE_EDGE_LOGOUT_URL = '/api/supabase/logout'

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0b3l1cmFhY25neXZnZHZ4dmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MDMxNDAsImV4cCI6MjA3NzM3MjQ2OX0.zbWnxWTFTwzjRurN6QUYEXEHqfRLtMSjBiPJF1S8UDU'

async function callLogout() {
  try {
    // Get refreshToken from localStorage (saved during login)
    const refreshToken = localStorage.getItem('refreshToken')
    
    if (!refreshToken) {
      // No token found, just redirect to login
      router.replace({ name: 'login' })
      return
    }

    await fetch(SUPABASE_EDGE_LOGOUT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ refreshToken }),
    })

    // Clear all auth-related data from localStorage
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('accessTokenExpiresAt')
    localStorage.removeItem('currentUser')
  } catch (e) {
    console.error('Logout error:', e)
    // Clear localStorage even if API call fails
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('accessTokenExpiresAt')
    localStorage.removeItem('currentUser')
  } finally {
    router.replace({ name: 'login' })
  }
}

onMounted(() => {
  callLogout()
})
</script>


