<template>
  <div class="relative h-full min-h-[32rem] sm:min-h-[42rem]">
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(255,255,255,0.5),rgba(255,255,255,0)_62%)] dark:bg-[radial-gradient(circle_at_50%_48%,rgba(255,255,255,0.04),rgba(255,255,255,0)_62%)]" />

    <div
      v-if="loadError"
      class="relative flex min-h-[32rem] items-center justify-center sm:min-h-[42rem]"
    >
      <div class="rounded-full bg-white/55 px-4 py-2 text-sm text-[#3c332a] shadow-[0_14px_36px_rgba(70,46,30,0.12)] backdrop-blur-xl dark:bg-white/10 dark:text-stone-200 dark:shadow-[0_18px_36px_rgba(0,0,0,0.28)]">
        {{ loadError }}
      </div>
    </div>

    <div
      v-else
      ref="frameRef"
      class="relative min-h-[32rem] select-none touch-none overflow-hidden cursor-grab active:cursor-grabbing sm:min-h-[42rem]"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerUp"
      @pointerleave="handlePointerLeave"
      @wheel.prevent="handleWheel"
    >
      <div
        ref="svgHost"
        class="europe-guides-map-host h-full min-h-[32rem] transition-opacity duration-300 sm:min-h-[42rem]"
        :class="isReady ? 'opacity-100' : 'opacity-0'"
      />

      <div
        v-if="!isReady"
        class="absolute inset-0 flex items-center justify-center"
      >
        <div class="rounded-full bg-white/55 px-4 py-2 text-sm text-[#3c332a] shadow-[0_14px_36px_rgba(70,46,30,0.12)] backdrop-blur-xl dark:bg-white/10 dark:text-stone-200 dark:shadow-[0_18px_36px_rgba(0,0,0,0.28)]">
          Loading map
        </div>
      </div>

      <div class="absolute right-0 top-0 z-10 flex items-center gap-2">
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-full bg-white/50 text-[#173f35] shadow-[0_14px_32px_rgba(70,46,30,0.12)] backdrop-blur-xl transition-colors hover:bg-white/65 dark:bg-white/10 dark:text-stone-100 dark:shadow-[0_16px_34px_rgba(0,0,0,0.28)] dark:hover:bg-white/16"
          aria-label="Zoom in"
          @click="zoomBy(1.18)"
        >
          <UIcon name="i-lucide-plus" class="h-4 w-4" />
        </button>

        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-full bg-white/50 text-[#173f35] shadow-[0_14px_32px_rgba(70,46,30,0.12)] backdrop-blur-xl transition-colors hover:bg-white/65 dark:bg-white/10 dark:text-stone-100 dark:shadow-[0_16px_34px_rgba(0,0,0,0.28)] dark:hover:bg-white/16"
          aria-label="Zoom out"
          @click="zoomBy(1 / 1.18)"
        >
          <UIcon name="i-lucide-minus" class="h-4 w-4" />
        </button>

        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-full bg-white/50 text-[#173f35] shadow-[0_14px_32px_rgba(70,46,30,0.12)] backdrop-blur-xl transition-colors hover:bg-white/65 dark:bg-white/10 dark:text-stone-100 dark:shadow-[0_16px_34px_rgba(0,0,0,0.28)] dark:hover:bg-white/16"
          aria-label="Reset map"
          @click="resetView"
        >
          <UIcon name="i-lucide-rotate-ccw" class="h-4 w-4" />
        </button>
      </div>

      <div
        v-if="tooltip.visible"
        class="pointer-events-none absolute z-10 w-48 rounded-[1.4rem] bg-white/94 px-3 py-2 shadow-[0_18px_40px_rgba(70,46,30,0.16)] backdrop-blur-xl dark:bg-black/82 dark:shadow-[0_20px_42px_rgba(0,0,0,0.38)]"
        :style="tooltipStyle"
      >
        <p class="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#7a6657] dark:text-stone-500">
          {{ tooltip.eyebrow }}
        </p>
        <p class="mt-1 text-sm font-semibold text-[#241d16] dark:text-stone-100">
          {{ tooltip.label }}
        </p>
        <p class="mt-1 text-xs leading-5 text-[#5f5146] dark:text-stone-300">
          {{ tooltip.facts }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import europeSvgMarkup from '~/assets/foodscholar/guides/europe-countries-outline-iso-coded-plain.svg?raw'
import { euCountryCodes, getCountryByCode } from '~/utils/countries'
import { getRegionPresentation, type GuidesCatalogRegionSummary } from '~/utils/guidesCatalog'

interface ViewBoxRect {
  x: number
  y: number
  width: number
  height: number
}

interface TooltipState {
  visible: boolean
  x: number
  y: number
  eyebrow: string
  label: string
  facts: string
}

const SVG_CANVAS = {
  x: 0,
  y: 0,
  width: 646.36719,
  height: 654.76562
} as const

const EU_CODES = new Set(euCountryCodes.map(code => code.toLowerCase()))
const COVERAGE_COLORS = ['#eadfce', '#dfc4a7', '#d4a07c', '#b97755', '#91523a']
const preparedSvgMarkup = europeSvgMarkup
  .replace(/<\?xml[\s\S]*?\?>\s*/, '')
  .replace(
    /<svg\b/,
    `<svg class="europe-guides-map-svg" viewBox="${SVG_CANVAS.x} ${SVG_CANVAS.y} ${SVG_CANVAS.width} ${SVG_CANVAS.height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Interactive Europe map"`
  )

const props = defineProps<{
  regions: GuidesCatalogRegionSummary[]
  selectedRegionCode?: string | null
}>()

const emit = defineEmits<{
  (event: 'update:selectedRegionCode', value: string | null): void
}>()

const frameRef = ref<HTMLElement | null>(null)
const svgHost = ref<HTMLElement | null>(null)
const svgElement = ref<SVGSVGElement | null>(null)
const isReady = ref(false)
const loadError = ref<string | null>(null)
const tooltip = reactive<TooltipState>({
  visible: false,
  x: 0,
  y: 0,
  eyebrow: '',
  label: '',
  facts: ''
})

const selectedCode = computed(() => props.selectedRegionCode?.toUpperCase() || null)
const regionByCode = computed<Record<string, GuidesCatalogRegionSummary>>(() => {
  return Object.fromEntries(
    props.regions.map(region => [getRegionPresentation(region.region).value.toUpperCase(), region])
  )
})
const guideCountRange = computed(() => {
  const counts = props.regions.map(region => region.guideCount).filter(count => count > 0)

  return {
    min: counts.length ? Math.min(...counts) : 0,
    max: counts.length ? Math.max(...counts) : 0
  }
})
const tooltipStyle = computed(() => ({
  left: `${tooltip.x}px`,
  top: `${tooltip.y}px`,
  transform: 'translate(-50%, calc(-100% - 14px))'
}))

const countryPaths = new Map<string, SVGPathElement>()
const dragState = reactive({
  pointerId: null as number | null,
  startPoint: null as { x: number, y: number } | null,
  startClientPoint: null as { x: number, y: number } | null,
  startViewBox: null as ViewBoxRect | null,
  pressedRegionCode: null as string | null,
  moved: false
})

let baseViewBox: ViewBoxRect | null = null
let boundsViewBox: ViewBoxRect | null = null
let currentViewBox: ViewBoxRect | null = null
let animationFrame = 0
let resizeObserver: ResizeObserver | null = null

function cloneRect(rect: ViewBoxRect) {
  return { ...rect }
}

function expandRect(rect: ViewBoxRect, factor: number) {
  const paddingX = rect.width * factor
  const paddingY = rect.height * factor

  return {
    x: rect.x - paddingX,
    y: rect.y - paddingY,
    width: rect.width + paddingX * 2,
    height: rect.height + paddingY * 2
  }
}

function fitRectToAspect(rect: ViewBoxRect, aspectRatio: number) {
  const centerX = rect.x + rect.width / 2
  const centerY = rect.y + rect.height / 2
  let width = rect.width
  let height = rect.height

  if (width / height > aspectRatio) {
    height = width / aspectRatio
  } else {
    width = height * aspectRatio
  }

  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height
  }
}

function getFrameAspectRatio() {
  const frame = frameRef.value
  if (!frame) {
    return 1
  }

  return frame.clientWidth / Math.max(frame.clientHeight, 1)
}

function getUnionRect(paths: SVGPathElement[]) {
  const boxes = paths.map(path => path.getBBox())
  const minX = Math.min(...boxes.map(box => box.x))
  const minY = Math.min(...boxes.map(box => box.y))
  const maxX = Math.max(...boxes.map(box => box.x + box.width))
  const maxY = Math.max(...boxes.map(box => box.y + box.height))

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

function applyViewBox(rect: ViewBoxRect) {
  if (!svgElement.value) {
    return
  }

  currentViewBox = cloneRect(rect)
  svgElement.value.setAttribute('viewBox', `${rect.x} ${rect.y} ${rect.width} ${rect.height}`)
}

function stopAnimation() {
  if (!animationFrame) {
    return
  }

  cancelAnimationFrame(animationFrame)
  animationFrame = 0
}

function animateToViewBox(target: ViewBoxRect, duration = 280) {
  stopAnimation()

  const start = cloneRect(currentViewBox || target)
  const targetRect = cloneRect(target)

  if (duration <= 0) {
    applyViewBox(targetRect)
    return
  }

  const startedAt = performance.now()

  const step = (now: number) => {
    const progress = Math.min(1, (now - startedAt) / duration)
    const eased = 1 - (1 - progress) ** 3

    applyViewBox({
      x: start.x + (targetRect.x - start.x) * eased,
      y: start.y + (targetRect.y - start.y) * eased,
      width: start.width + (targetRect.width - start.width) * eased,
      height: start.height + (targetRect.height - start.height) * eased
    })

    if (progress < 1) {
      animationFrame = requestAnimationFrame(step)
      return
    }

    animationFrame = 0
  }

  animationFrame = requestAnimationFrame(step)
}

function clampViewBox(rect: ViewBoxRect) {
  if (!baseViewBox || !boundsViewBox) {
    return rect
  }

  const aspectRatio = baseViewBox.width / baseViewBox.height
  const minWidth = baseViewBox.width * 0.12
  const maxWidth = boundsViewBox.width
  const width = Math.min(maxWidth, Math.max(minWidth, rect.width))
  const height = width / aspectRatio
  const minX = boundsViewBox.x
  const minY = boundsViewBox.y
  const maxX = boundsViewBox.x + boundsViewBox.width - width
  const maxY = boundsViewBox.y + boundsViewBox.height - height

  return {
    x: maxX < minX ? boundsViewBox.x + (boundsViewBox.width - width) / 2 : Math.min(maxX, Math.max(minX, rect.x)),
    y: maxY < minY ? boundsViewBox.y + (boundsViewBox.height - height) / 2 : Math.min(maxY, Math.max(minY, rect.y)),
    width,
    height
  }
}

function getCoverageColor(guideCount: number) {
  const { min, max } = guideCountRange.value

  if (max <= min) {
    return COVERAGE_COLORS[2]
  }

  const ratio = (guideCount - min) / (max - min)
  const index = Math.max(0, Math.min(COVERAGE_COLORS.length - 1, Math.round(ratio * (COVERAGE_COLORS.length - 1))))
  return COVERAGE_COLORS[index]
}

function syncCountryStyles() {
  countryPaths.forEach((path, lowerCode) => {
    if (!EU_CODES.has(lowerCode)) {
      path.style.display = 'none'
      return
    }

    const code = lowerCode.toUpperCase()
    const region = regionByCode.value[code]
    const isSelected = selectedCode.value === code
    const isActive = Boolean(region)

    path.style.display = ''
    path.dataset.interactive = isActive ? 'true' : 'false'
    path.dataset.selected = isSelected ? 'true' : 'false'
    path.style.cursor = isActive ? 'pointer' : 'default'
    path.style.fill = isSelected
      ? '#173f35'
      : isActive
        ? getCoverageColor(region.guideCount)
        : '#f3eee8'
    path.style.stroke = isSelected
      ? '#0d241f'
      : isActive
        ? 'rgba(96, 73, 57, 0.58)'
        : 'rgba(96, 73, 57, 0.22)'
    path.style.strokeWidth = isSelected ? '1.65' : isActive ? '1.08' : '0.95'
    path.style.opacity = isActive ? '1' : '0.78'
  })
}

function syncBaseViewBox() {
  const euPaths = [...countryPaths.entries()]
    .filter(([code]) => EU_CODES.has(code))
    .map(([, path]) => path)

  if (!euPaths.length) {
    baseViewBox = {
      x: SVG_CANVAS.x,
      y: SVG_CANVAS.y,
      width: SVG_CANVAS.width,
      height: SVG_CANVAS.height
    }
    boundsViewBox = cloneRect(baseViewBox)
    applyViewBox(baseViewBox)
    return
  }

  const aspectRatio = getFrameAspectRatio()
  const union = getUnionRect(euPaths)
  const fitted = fitRectToAspect(expandRect(union, 0.12), aspectRatio)

  baseViewBox = fitted
  boundsViewBox = expandRect(fitted, 0.04)
  applyViewBox(currentViewBox ? clampViewBox(currentViewBox) : fitted)
}

function getFocusRectForRegion(code: string) {
  const path = countryPaths.get(code.toLowerCase())
  if (!path || !baseViewBox) {
    return baseViewBox
  }

  const bbox = path.getBBox()
  const aspectRatio = baseViewBox.width / baseViewBox.height
  const centerX = bbox.x + bbox.width / 2
  const centerY = bbox.y + bbox.height / 2
  const sizeRatio = Math.max(
    bbox.width / baseViewBox.width,
    bbox.height / baseViewBox.height
  )
  const minWidthRatio = sizeRatio < 0.05 ? 0.2 : sizeRatio < 0.12 ? 0.26 : 0.32
  const targetWidth = Math.min(
    baseViewBox.width * 0.54,
    Math.max(
      bbox.width * 1.65,
      bbox.height * aspectRatio * 1.65,
      baseViewBox.width * minWidthRatio
    )
  )
  const targetHeight = targetWidth / aspectRatio

  return clampViewBox({
    x: centerX - targetWidth / 2,
    y: centerY - targetHeight / 2,
    width: targetWidth,
    height: targetHeight
  })
}

function focusRegion(code: string | null, animate = true) {
  const target = code ? getFocusRectForRegion(code) : baseViewBox

  if (!target) {
    return
  }

  if (animate) {
    animateToViewBox(target, code ? 320 : 260)
    return
  }

  stopAnimation()
  applyViewBox(target)
}

function getSvgPointFromClient(clientX: number, clientY: number) {
  if (!svgElement.value) {
    return null
  }

  const ctm = svgElement.value.getScreenCTM()
  if (!ctm) {
    return null
  }

  const point = svgElement.value.createSVGPoint()
  point.x = clientX
  point.y = clientY
  return point.matrixTransform(ctm.inverse())
}

function zoomBy(multiplier: number, anchor?: { x: number, y: number } | null, animate = true) {
  if (!currentViewBox || !baseViewBox) {
    return
  }

  const focalPoint = anchor || {
    x: currentViewBox.x + currentViewBox.width / 2,
    y: currentViewBox.y + currentViewBox.height / 2
  }
  const aspectRatio = baseViewBox.width / baseViewBox.height
  const width = currentViewBox.width / multiplier
  const height = width / aspectRatio
  const relativeX = (focalPoint.x - currentViewBox.x) / currentViewBox.width
  const relativeY = (focalPoint.y - currentViewBox.y) / currentViewBox.height

  const nextRect = clampViewBox({
    x: focalPoint.x - width * relativeX,
    y: focalPoint.y - height * relativeY,
    width,
    height
  })

  if (animate) {
    animateToViewBox(nextRect, 180)
    return
  }

  stopAnimation()
  applyViewBox(nextRect)
}

function hideTooltip() {
  tooltip.visible = false
}

function updateTooltipForCode(code: string, clientX: number, clientY: number) {
  const region = regionByCode.value[code]
  const country = getCountryByCode(code)
  const frameRect = frameRef.value?.getBoundingClientRect()
  const localX = clientX - (frameRect?.left || 0)
  const localY = clientY - (frameRect?.top || 0)
  const clampedX = frameRect ? Math.min(Math.max(localX, 96), frameRect.width - 96) : localX
  const clampedY = frameRect ? Math.min(Math.max(localY, 68), frameRect.height - 28) : localY
  const facts = region
    ? [
        `${region.guideCount.toLocaleString()} guide${region.guideCount === 1 ? '' : 's'}`,
        region.guidelineCount !== null ? `${region.guidelineCount.toLocaleString()} rule${region.guidelineCount === 1 ? '' : 's'}` : null
      ].filter(Boolean).join(' · ')
    : 'No catalog records yet'

  tooltip.visible = true
  tooltip.x = clampedX
  tooltip.y = clampedY
  tooltip.eyebrow = region ? 'Coverage' : 'Unlisted'
  tooltip.label = region?.label || country?.name || code
  tooltip.facts = facts
}

function getPathFromEventTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return null
  }

  const path = target instanceof SVGPathElement ? target : target.closest('path[id]')
  return path instanceof SVGPathElement ? path : null
}

function findRegionCodeFromEventTarget(target: EventTarget | null) {
  const path = getPathFromEventTarget(target)
  if (!path) {
    return null
  }

  const lowerCode = path.id.toLowerCase()
  if (!EU_CODES.has(lowerCode)) {
    return null
  }

  return lowerCode.toUpperCase()
}

function selectRegion(code: string | null) {
  if (code === selectedCode.value) {
    focusRegion(code)
    return
  }

  focusRegion(code)
  emit('update:selectedRegionCode', code)
}

function handlePointerDown(event: PointerEvent) {
  if (
    event.button !== 0
    || !frameRef.value
    || !currentViewBox
    || (event.target instanceof Element && event.target.closest('button'))
  ) {
    return
  }

  const point = getSvgPointFromClient(event.clientX, event.clientY)
  if (!point) {
    return
  }

  dragState.pointerId = event.pointerId
  dragState.startPoint = { x: point.x, y: point.y }
  dragState.startClientPoint = { x: event.clientX, y: event.clientY }
  dragState.startViewBox = cloneRect(currentViewBox)
  dragState.pressedRegionCode = findRegionCodeFromEventTarget(event.target)
  dragState.moved = false
  hideTooltip()
  frameRef.value.setPointerCapture(event.pointerId)
}

function handlePointerMove(event: PointerEvent) {
  if (dragState.pointerId === event.pointerId && dragState.startPoint && dragState.startClientPoint && dragState.startViewBox) {
    const point = getSvgPointFromClient(event.clientX, event.clientY)
    if (!point) {
      return
    }

    const deltaX = dragState.startPoint.x - point.x
    const deltaY = dragState.startPoint.y - point.y
    const movement = Math.hypot(
      event.clientX - dragState.startClientPoint.x,
      event.clientY - dragState.startClientPoint.y
    )

    if (movement > 5) {
      dragState.moved = true
    }

    stopAnimation()
    applyViewBox(clampViewBox({
      x: dragState.startViewBox.x + deltaX,
      y: dragState.startViewBox.y + deltaY,
      width: dragState.startViewBox.width,
      height: dragState.startViewBox.height
    }))
    return
  }

  const code = findRegionCodeFromEventTarget(event.target)
  if (!code) {
    hideTooltip()
    return
  }

  updateTooltipForCode(code, event.clientX, event.clientY)
}

function handlePointerUp(event: PointerEvent) {
  if (!frameRef.value || dragState.pointerId !== event.pointerId) {
    return
  }

  const pressedRegionCode = dragState.pressedRegionCode
  const shouldSelect = !dragState.moved && Boolean(pressedRegionCode && regionByCode.value[pressedRegionCode])

  if (frameRef.value.hasPointerCapture(event.pointerId)) {
    frameRef.value.releasePointerCapture(event.pointerId)
  }

  dragState.pointerId = null
  dragState.startPoint = null
  dragState.startClientPoint = null
  dragState.startViewBox = null
  dragState.pressedRegionCode = null

  if (shouldSelect && pressedRegionCode) {
    selectRegion(pressedRegionCode)
  }

  window.setTimeout(() => {
    dragState.moved = false
  }, 0)
}

function handlePointerLeave() {
  if (dragState.pointerId !== null) {
    return
  }

  hideTooltip()
}

function handleWheel(event: WheelEvent) {
  event.preventDefault()

  const anchor = getSvgPointFromClient(event.clientX, event.clientY)
  if (!anchor) {
    return
  }

  zoomBy(event.deltaY < 0 ? 1.14 : 1 / 1.14, anchor, false)
}

function resetView() {
  hideTooltip()

  if (selectedCode.value === null) {
    focusRegion(null)
    return
  }

  selectRegion(null)
}

function destroyMap() {
  stopAnimation()
  hideTooltip()
  countryPaths.clear()
  svgElement.value = null
  currentViewBox = null
  baseViewBox = null
  boundsViewBox = null

  if (svgHost.value) {
    svgHost.value.innerHTML = ''
  }
}

async function initializeMap() {
  if (!svgHost.value) {
    return
  }

  isReady.value = false
  loadError.value = null

  try {
    destroyMap()

    svgHost.value.innerHTML = preparedSvgMarkup
    await nextTick()

    const svg = svgHost.value.querySelector('svg')
    if (!(svg instanceof SVGSVGElement)) {
      throw new Error('The Europe SVG could not be rendered.')
    }

    svgElement.value = svg

    svg.querySelectorAll<SVGPathElement>('path[id]').forEach((path) => {
      countryPaths.set(path.id.toLowerCase(), path)
    })

    syncBaseViewBox()
    syncCountryStyles()
    focusRegion(selectedCode.value, false)
    isReady.value = true
  } catch (error) {
    console.error('[EuropeGuidesMap] Failed to initialize the SVG map:', error)
    loadError.value = 'Map unavailable'
    destroyMap()
    isReady.value = false
  }
}

onMounted(async () => {
  resizeObserver = new ResizeObserver(() => {
    syncBaseViewBox()
    focusRegion(selectedCode.value, false)
  })

  if (frameRef.value) {
    resizeObserver.observe(frameRef.value)
  }

  await initializeMap()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  destroyMap()
})

watch(
  () => `${Object.keys(regionByCode.value).sort().join('|')}::${props.regions.map(region => `${region.region}-${region.guideCount}-${region.guidelineCount}`).join('|')}`,
  async () => {
    if (!svgElement.value) {
      await initializeMap()
      return
    }

    syncCountryStyles()
    syncBaseViewBox()
    focusRegion(selectedCode.value, false)
  }
)

watch(
  selectedCode,
  (code) => {
    if (!svgElement.value) {
      return
    }

    syncCountryStyles()
    focusRegion(code)
  }
)
</script>

<style scoped>
.europe-guides-map-host :deep(svg) {
  width: 100%;
  height: 100%;
}

.europe-guides-map-host :deep(path) {
  vector-effect: non-scaling-stroke;
  transition: fill 180ms ease, stroke 180ms ease, opacity 180ms ease, filter 180ms ease;
}

.europe-guides-map-host :deep(path[data-interactive="true"]) {
  cursor: pointer;
}

.europe-guides-map-host :deep(path[data-interactive="true"]:hover) {
  filter: saturate(1.04) brightness(0.96);
}

.europe-guides-map-host :deep(path[data-selected="true"]) {
  filter: drop-shadow(0 10px 18px rgba(23, 63, 53, 0.22));
}
</style>
