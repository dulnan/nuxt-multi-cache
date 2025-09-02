<template>
  <div id="time">{{ time }}</div>
  <div id="cookie">{{ cookie }}</div>
  <button type="button" id="login" @click="login">Login</button>
  <button type="button" id="logout" @click="logout">Logout</button>
</template>

<script setup lang="ts">
import { useState, useRouteCache, useCookie } from '#imports'

const time = useState('currentTime', () => {
  return new Date().toISOString()
})

useRouteCache((helper) => {
  helper
    .setMaxAge('10m')
    .setStaleIfError('10m')
    .allowStaleWhileRevalidate()
    .setCacheable()
})

const cookie = useCookie('COOKIE_KEY_SESSION_TOKEN')

function login() {
  cookie.value = 'my session'
}

function logout() {
  cookie.value = ''
}
</script>
