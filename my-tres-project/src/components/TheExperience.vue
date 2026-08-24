<script setup lang="ts">
import type { TresObject } from '@tresjs/core'
import { useLoop } from '@tresjs/core'
import { shallowRef } from 'vue'

const { onBeforeRender } = useLoop()

const truckRef = shallowRef<TresObject | null>(null)
const wheelFrontLeftRef = shallowRef<TresObject | null>(null)
const wheelFrontRightRef = shallowRef<TresObject | null>(null)
const wheelRearLeftRef = shallowRef<TresObject | null>(null)
const wheelRearRightRef = shallowRef<TresObject | null>(null)
const cargoRef = shallowRef<TresObject | null>(null)

onBeforeRender(({ elapsed }) => {
  const travelWidth = 24
  const speed = 2.8
  const x = ((elapsed * speed) % travelWidth) - travelWidth / 2

  if (truckRef.value) {
    truckRef.value.position.x = x
    truckRef.value.position.y = 0.15 + Math.sin(elapsed * 6) * 0.03
  }

  const wheelRotation = -(elapsed * speed * 3)

  if (wheelFrontLeftRef.value)
    wheelFrontLeftRef.value.rotation.z = wheelRotation
  if (wheelFrontRightRef.value)
    wheelFrontRightRef.value.rotation.z = wheelRotation
  if (wheelRearLeftRef.value)
    wheelRearLeftRef.value.rotation.z = wheelRotation
  if (wheelRearRightRef.value)
    wheelRearRightRef.value.rotation.z = wheelRotation

  if (cargoRef.value) {
    cargoRef.value.position.y = 0.9 + Math.sin(elapsed * 8) * 0.015
  }
})
</script>

<template>
  <TresPerspectiveCamera :position="[0, 4.2, 11]" :look-at="[0, 1, 0]" />
  <TresAmbientLight
    :intensity="0.75"
    color="white"
  />

  <TresDirectionalLight
    :position="[6, 8, 4]"
    :intensity="1.3"
    color="#fef6df"
  />
  <TresDirectionalLight
    :position="[-8, 3, -2]"
    :intensity="0.4"
    color="#b8d9ff"
  />

  <TresMesh :position="[0, -0.5, 0]" :rotation="[-Math.PI / 2, 0, 0]">
    <TresPlaneGeometry :args="[45, 18]" />
    <TresMeshStandardMaterial color="#6ca86f" />
  </TresMesh>

  <TresMesh :position="[0, 0.01, 0]" :rotation="[-Math.PI / 2, 0, 0]">
    <TresPlaneGeometry :args="[45, 3.8]" />
    <TresMeshStandardMaterial color="#2f3540" />
  </TresMesh>

  <TresGroup ref="truckRef" :position="[-8, 0.2, 0]">
    <TresMesh :position="[-0.3, 0.65, 0]">
      <TresBoxGeometry :args="[2.7, 0.9, 1.35]" />
      <TresMeshStandardMaterial color="#f2f4f8" />
    </TresMesh>

    <TresMesh :position="[-1.45, 0.9, 0]">
      <TresBoxGeometry :args="[0.95, 0.72, 1.2]" />
      <TresMeshStandardMaterial color="#1f7aff" />
    </TresMesh>

    <TresMesh :position="[-1.65, 1.03, 0.35]">
      <TresBoxGeometry :args="[0.4, 0.28, 0.42]" />
      <TresMeshStandardMaterial color="#b7e8ff" />
    </TresMesh>

    <TresMesh :position="[-1.65, 1.03, -0.35]">
      <TresBoxGeometry :args="[0.4, 0.28, 0.42]" />
      <TresMeshStandardMaterial color="#b7e8ff" />
    </TresMesh>

    <TresMesh :position="[1.1, 0.35, 0]">
      <TresBoxGeometry :args="[0.95, 0.26, 1.15]" />
      <TresMeshStandardMaterial color="#6f737a" />
    </TresMesh>

    <TresGroup ref="cargoRef" :position="[0.35, 0.9, 0]">
      <TresMesh :position="[0, 0, 0]">
        <TresBoxGeometry :args="[0.75, 0.5, 0.75]" />
        <TresMeshStandardMaterial color="#b7762f" />
      </TresMesh>
      <TresMesh :position="[0.85, 0, 0]">
        <TresBoxGeometry :args="[0.75, 0.5, 0.75]" />
        <TresMeshStandardMaterial color="#c98b41" />
      </TresMesh>
      <TresMesh :position="[0.42, 0.55, 0]">
        <TresBoxGeometry :args="[0.65, 0.42, 0.65]" />
        <TresMeshStandardMaterial color="#9f6328" />
      </TresMesh>
    </TresGroup>

    <TresMesh ref="wheelFrontLeftRef" :position="[-1.25, 0.12, 0.7]" :rotation="[Math.PI / 2, 0, 0]">
      <TresCylinderGeometry :args="[0.24, 0.24, 0.2, 20]" />
      <TresMeshStandardMaterial color="#13161c" />
    </TresMesh>
    <TresMesh ref="wheelFrontRightRef" :position="[-1.25, 0.12, -0.7]" :rotation="[Math.PI / 2, 0, 0]">
      <TresCylinderGeometry :args="[0.24, 0.24, 0.2, 20]" />
      <TresMeshStandardMaterial color="#13161c" />
    </TresMesh>
    <TresMesh ref="wheelRearLeftRef" :position="[1.3, 0.12, 0.7]" :rotation="[Math.PI / 2, 0, 0]">
      <TresCylinderGeometry :args="[0.24, 0.24, 0.2, 20]" />
      <TresMeshStandardMaterial color="#13161c" />
    </TresMesh>
    <TresMesh ref="wheelRearRightRef" :position="[1.3, 0.12, -0.7]" :rotation="[Math.PI / 2, 0, 0]">
      <TresCylinderGeometry :args="[0.24, 0.24, 0.2, 20]" />
      <TresMeshStandardMaterial color="#13161c" />
    </TresMesh>
  </TresGroup>
</template>