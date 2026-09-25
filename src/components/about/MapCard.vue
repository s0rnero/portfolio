<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Map as LeafletMap } from 'leaflet'
import { contact } from '@/data/portfolio'

const CALI_CENTER: [number, number] = [3.4516, -76.532]
const CALI_BOUNDS: [[number, number], [number, number]] = [
  [3.36, -76.575],
  [3.49, -76.455],
]
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

const PIN_COLOR = '#995CD0'
const PIN_SIZE: [number, number] = [30, 42]
const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${PIN_SIZE[0]}" height="${PIN_SIZE[1]}" viewBox="0 0 24 34">
<path d="M12 0C5.373 0 0 5.373 0 12c0 9.5 12 22 12 22s12-12.5 12-22C24 5.373 18.627 0 12 0z" fill="${PIN_COLOR}" stroke="#4c1d95" stroke-width="0.75"/>
<circle cx="12" cy="12" r="4.5" fill="#ffffff"/>
</svg>`
const { t, locale } = useI18n()

const mapContainer = ref<HTMLElement | null>(null)
const now = ref(new Date())

const timeFormatter = computed(
  () =>
    new Intl.DateTimeFormat(locale.value === 'en' ? 'en-US' : 'es-CO', {
      timeZone: 'America/Bogota',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }),
)
const hourFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'America/Bogota',
  hour: '2-digit',
  hourCycle: 'h23',
})

const localTime = computed(() => timeFormatter.value.format(now.value))
const isNight = computed(() => {
  const hour = Number(hourFormatter.format(now.value))
  return hour < 6 || hour >= 18
})

let map: LeafletMap | null = null
let clock: number | null = null
let resizeObserver: ResizeObserver | null = null
let hasFitted = false

const fitCity = () => {
  if (!map) return
  map.fitBounds(CALI_BOUNDS, { padding: [8, 8] })
}

onMounted(async () => {
  const container = mapContainer.value
  if (!container) return

  const L = await import('leaflet')
  await import('leaflet/dist/leaflet.css')

  map = L.map(container, {
    zoomControl: true,
    attributionControl: false,
    minZoom: 3,
    worldCopyJump: true,
    scrollWheelZoom: false,
  })

  L.control.attribution({ prefix: false }).addTo(map)

  L.tileLayer(TILE_URL, {
    maxZoom: 19,
    attribution: TILE_ATTRIBUTION,
    detectRetina: true,
    crossOrigin: true,
  }).addTo(map)

  L.marker(CALI_CENTER, {
    icon: L.divIcon({
      className: 'cali-pin',
      html: PIN_SVG,
      iconSize: PIN_SIZE,
      iconAnchor: [PIN_SIZE[0] / 2, PIN_SIZE[1]],
    }),
    title: 'Cali',
  }).addTo(map)

  resizeObserver = new ResizeObserver(() => {
    if (!map) return
    map.invalidateSize()
    if (!hasFitted && container.clientWidth > 0 && container.clientHeight > 0) {
      hasFitted = true
      fitCity()
    }
  })
  resizeObserver.observe(container)

  clock = window.setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onBeforeUnmount(() => {
  if (clock !== null) {
    window.clearInterval(clock)
    clock = null
  }
  resizeObserver?.disconnect()
  resizeObserver = null
  map?.remove()
  map = null
})
</script>

<template>
  <k-card
    v-effect="{ type: 'spotlight', size: 77 }"
    class="cali-map-card backdrop-blur-sm"
    variant="transparent"
    rounded
  >
    <template #title>
      <h2 class="flex items-center gap-2 font-bold">
        <k-icon name="mdi:map-marker" aria-hidden="true" />
        {{ t('about.mapTitle') }}
      </h2>
    </template>
    <div class="cali-map-body flex flex-col gap-4">
      <div class="cali-map-wrap">
        <div
          :aria-label="t('about.mapTitle')"
          ref="mapContainer"
          class="cali-map h-full w-full overflow-hidden rounded-lg"
          role="region"
        />
        <k-button
          :aria-label="t('about.mapRecenter')"
          class="cali-recenter absolute top-2 right-2 rounded-xl bg-white/85 shadow-sm hover:bg-white dark:bg-black/70"
          icon="mdi:crosshairs-gps"
          size="lg"
          type="button"
          hover
          icon-only
          text
          @click="fitCity"
        />
      </div>
      <p class="flex flex-wrap items-center gap-2 text-neutral-700 dark:text-neutral-300">
        <span>{{ contact.location }}</span>
        <k-icon
          :name="isNight ? 'mdi:weather-night' : 'mdi:white-balance-sunny'"
          aria-hidden="true"
        />
        <span>{{ localTime }}</span>
        <span class="sr-only">{{ t('about.timeAria') }}</span>
      </p>
    </div>
  </k-card>
</template>
