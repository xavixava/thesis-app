<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

// 1. Imports
import { ref } from 'vue'

// 2. Computed properties
const title = ref('Key Rollover System')
</script>

<template>
  <!-- Semantic HTML with proper ARIA labels -->
  <div class="min-h-screen bg-dark-bg text-dark-text">
    <header class="bg-dark-surface shadow-sm border-b border-dark-border" role="banner">
      <nav class="container mx-auto px-4 py-4" role="navigation" aria-label="Main navigation">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-8">
            <h1 class="text-2xl font-bold text-dark-text">{{ title }}</h1>

            <div class="hidden md:flex space-x-6">
              <RouterLink
                to="/"
                class="text-dark-muted hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                active-class="text-primary-400 bg-dark-bg"
              >
                Dashboard
              </RouterLink>
              <RouterLink
                to="/devices"
                class="text-dark-muted hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                active-class="text-primary-400 bg-dark-bg"
              >
                Devices
              </RouterLink>
              <RouterLink
                to="/ca"
                class="text-dark-muted hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                active-class="text-primary-400 bg-dark-bg"
              >
                Connectivity Associations
              </RouterLink>
              <RouterLink
                to="/anysec"
                class="text-dark-muted hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                active-class="text-primary-400 bg-dark-bg"
              >
                ANYsec
              </RouterLink>
            </div>
          </div>
        </div>
      </nav>
    </header>

    <!-- Main content area -->
    <main class="container mx-auto px-4 py-8" role="main">
      <!-- Main router view -->
      <RouterView />
    </main>

    <!-- Footer -->
    <footer class="bg-dark-surface border-t border-dark-border mt-auto" role="contentinfo">
      <div class="container mx-auto px-4 py-6">
        <p class="text-center text-dark-muted text-sm">
          © 2024 Key Rollover System. Built with Vue.js + Tailwind CSS.
        </p>
      </div>
    </footer>
  </div>
</template>
