<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'

import TheExperience from './components/TheExperience.vue'
</script>

<template>
  <main class="landing">
    <section class="hero-copy">
      <p class="eyebrow">National Freight Network</p>
      <h1>Truck hauling live cargo routes</h1>
      <p class="subtitle">
        Real-time shipping visibility for your fleet. Keep cargo safe, on time, and always moving.
      </p>
    </section>

    <section class="hero-canvas">
      <TresCanvas clear-color="#c9ebff" window-size>
        <TheExperience />
      </TresCanvas>
    </section>
  </main>
</template>