<template>
  <div class="relative h-full min-h-[18rem] sm:min-h-[42rem]">
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(255,255,255,0.5),rgba(255,255,255,0)_62%)] dark:bg-[radial-gradient(circle_at_50%_48%,rgba(255,255,255,0.04),rgba(255,255,255,0)_62%)]" />

    <div
      v-if="loadError"
      class="relative flex min-h-[18rem] sm:min-h-[42rem] items-center justify-center"
    >
      <div class="rounded-full bg-white/55 px-4 py-2 text-sm text-[#3c332a] shadow-[0_14px_36px_rgba(70,46,30,0.12)] backdrop-blur-xl dark:bg-white/10 dark:text-stone-200 dark:shadow-[0_18px_36px_rgba(0,0,0,0.28)]">
        {{ loadError }}
      </div>
    </div>

    <div
      v-else
      ref="frameRef"
      class="relative min-h-[18rem] sm:min-h-[42rem] select-none overflow-hidden cursor-grab active:cursor-grabbing"
      :class="exploring ? 'touch-none' : 'touch-pan-y'"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerCancel"
      @pointerleave="handlePointerLeave"
      @wheel.prevent="handleWheel"
    >
      <div
        ref="svgHost"
        class="europe-guides-map-host h-full min-h-[18rem] sm:min-h-[42rem] transition-opacity duration-300"
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

      <!-- Touch only. While the page may scroll over the map a finger can
           select a region but not pan or pinch it; this hands the gestures
           to the map until Done. -->
      <button
        v-if="isReady"
        type="button"
        class="absolute left-0 top-0 z-10 hidden h-10 items-center gap-1.5 rounded-full bg-white/70 px-3.5 text-xs font-semibold text-[#173f35] shadow-[0_14px_32px_rgba(70,46,30,0.14)] backdrop-blur-xl transition-colors any-pointer-coarse:flex dark:bg-white/12 dark:text-stone-100"
        :class="exploring ? 'ring-2 ring-[#173f35]/30 dark:ring-white/30' : ''"
        :aria-pressed="exploring"
        @click="exploring = !exploring"
      >
        <UIcon :name="exploring ? 'i-lucide-check' : 'i-lucide-move'" class="h-4 w-4" />
        {{ exploring ? $t('guidelines.map.done') : $t('guidelines.map.explore') }}
      </button>

      <div v-if="!props.hideControls" class="absolute right-0 top-0 z-10 flex items-center gap-2">
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

      <transition
        enter-active-class="transition-opacity duration-300"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-300"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showHintChip && isReady"
          class="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-white/70 px-3.5 py-1.5 text-xs font-medium text-[#173f35] shadow-[0_14px_32px_rgba(70,46,30,0.14)] backdrop-blur-xl dark:bg-white/12 dark:text-stone-100"
        >
          <UIcon :name="isCoarsePointer ? 'i-lucide-pointer' : 'i-lucide-mouse-pointer-click'" class="h-3.5 w-3.5" />
          {{ isCoarsePointer ? $t('guidelines.map.hintTap') : $t('guidelines.map.hintClick') }}
        </div>
      </transition>

      <!-- The facts the hover tooltip carries, for the pointers that cannot
           hover: shown for the selected region, in the hint's place. -->
      <div
        v-if="selectedFacts && !hasHover && isReady"
        class="pointer-events-none absolute bottom-4 left-1/2 z-10 max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-[1.4rem] bg-white/94 px-4 py-2 text-center shadow-[0_18px_40px_rgba(70,46,30,0.16)] backdrop-blur-xl dark:bg-black/82 dark:shadow-[0_20px_42px_rgba(0,0,0,0.38)]"
      >
        <p class="text-sm font-semibold text-[#241d16] dark:text-stone-100">
          {{ selectedFacts.label }}
        </p>
        <p class="mt-0.5 text-xs leading-5 text-[#5f5146] dark:text-stone-300">
          {{ selectedFacts.facts }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useViewport } from '~/composables/useViewport'
import europeSvgUrl from '~/assets/foodscholar/guides/europe-countries-outline-iso-coded-plain.svg?url'
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
let preparedSvgMarkup: string | null = null

const props = defineProps<{
  regions: GuidesCatalogRegionSummary[]
  selectedRegionCode?: string | null
  hideControls?: boolean
  viewPadding?: number
  showHint?: boolean
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

const { hasHover, isCoarsePointer } = useViewport()

/**
 * Whether a finger may pan and pinch the map.
 *
 * Off, the page scrolls over the map and a finger can only tap a region; on,
 * the map takes every touch gesture until Done. A map that took the touches
 * from the start was a page that could not be scrolled past it.
 */
const exploring = ref(false)

const selectedCode = computed(() => props.selectedRegionCode?.toUpperCase() || null)
const showHintChip = computed(() => Boolean(props.showHint) && !selectedCode.value)
const selectedFacts = computed(() => selectedCode.value ? describeRegion(selectedCode.value) : null)
const viewPadding = computed(() => {
  if (typeof props.viewPadding !== 'number') {
    return 0.12
  }

  return Math.min(0.3, Math.max(0, props.viewPadding))
})
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
  moved: false,
  scaleX: 1,
  scaleY: 1
})

// A touch that is not exploring: a press that becomes a selection on release
// unless the finger travelled, in which case the page was being scrolled.
const tapState = reactive({
  pointerId: null as number | null,
  start: null as { x: number, y: number } | null,
  pressedRegionCode: null as string | null
})

// Every captured pointer, so a second finger can turn a drag into a pinch.
const activePointers = new Map<number, { x: number, y: number }>()
const pinchState = reactive({
  active: false,
  startDistance: 0,
  startMidpoint: null as { x: number, y: number } | null,
  startViewBox: null as ViewBoxRect | null,
  anchor: null as { x: number, y: number } | null
})

let baseViewBox: ViewBoxRect | null = null
let boundsViewBox: ViewBoxRect | null = null
let currentViewBox: ViewBoxRect | null = null
let animationFrame = 0
let resizeObserver: ResizeObserver | null = null
let dragRafId = 0
let pendingDragRect: ViewBoxRect | null = null

async function loadPreparedSvgMarkup() {
  if (preparedSvgMarkup) {
    return preparedSvgMarkup
  }

  const response = await fetch(europeSvgUrl)
  if (!response.ok) {
    throw new Error(`Failed to load Europe SVG: ${response.status}`)
  }

  preparedSvgMarkup = (await response.text())
    .replace(/<\?xml[\s\S]*?\?>\s*/, '')
    .replace(
      /<svg\b/,
      `<svg class="europe-guides-map-svg" viewBox="${SVG_CANVAS.x} ${SVG_CANVAS.y} ${SVG_CANVAS.width} ${SVG_CANVAS.height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Interactive Europe map"`
    )

  return preparedSvgMarkup
}

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
  const fitted = fitRectToAspect(expandRect(union, viewPadding.value), aspectRatio)

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

/** What the map knows about a region: the tooltip's words, and the caption's. */
function describeRegion(code: string) {
  const region = regionByCode.value[code]
  const country = getCountryByCode(code)
  const facts = region
    ? [
        `${region.guideCount.toLocaleString()} guide${region.guideCount === 1 ? '' : 's'}`,
        region.guidelineCount !== null ? `${region.guidelineCount.toLocaleString()} rule${region.guidelineCount === 1 ? '' : 's'}` : null
      ].filter(Boolean).join(' · ')
    : 'No catalog records yet'

  return {
    eyebrow: region ? 'Coverage' : 'Unlisted',
    label: region?.label || country?.name || code,
    facts
  }
}

function updateTooltipForCode(code: string, clientX: number, clientY: number) {
  const frameRect = frameRef.value?.getBoundingClientRect()
  const localX = clientX - (frameRect?.left || 0)
  const localY = clientY - (frameRect?.top || 0)
  const clampedX = frameRect ? Math.min(Math.max(localX, 96), frameRect.width - 96) : localX
  const clampedY = frameRect ? Math.min(Math.max(localY, 68), frameRect.height - 28) : localY
  const description = describeRegion(code)

  tooltip.visible = true
  tooltip.x = clampedX
  tooltip.y = clampedY
  tooltip.eyebrow = description.eyebrow
  tooltip.label = description.label
  tooltip.facts = description.facts
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

function resetTapState() {
  tapState.pointerId = null
  tapState.start = null
  tapState.pressedRegionCode = null
}

function releasePointer(pointerId: number) {
  activePointers.delete(pointerId)
  if (frameRef.value?.hasPointerCapture(pointerId)) {
    frameRef.value.releasePointerCapture(pointerId)
  }
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

  // A finger on a map that is not being explored is a tap, never a drag: the
  // page keeps its scroll, and the region is selected on release.
  if (event.pointerType === 'touch' && !exploring.value) {
    tapState.pointerId = event.pointerId
    tapState.start = { x: event.clientX, y: event.clientY }
    tapState.pressedRegionCode = findRegionCodeFromEventTarget(event.target)
    return
  }

  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
  frameRef.value.setPointerCapture(event.pointerId)

  if (activePointers.size === 2) {
    beginPinch()
    return
  }

  const point = getSvgPointFromClient(event.clientX, event.clientY)
  if (!point) {
    return
  }

  const frameRect = frameRef.value.getBoundingClientRect()
  const scaleX = frameRect.width > 0 ? currentViewBox.width / frameRect.width : 1
  const scaleY = frameRect.height > 0 ? currentViewBox.height / frameRect.height : 1

  dragState.pointerId = event.pointerId
  dragState.startPoint = { x: point.x, y: point.y }
  dragState.startClientPoint = { x: event.clientX, y: event.clientY }
  dragState.startViewBox = cloneRect(currentViewBox)
  dragState.pressedRegionCode = findRegionCodeFromEventTarget(event.target)
  dragState.moved = false
  dragState.scaleX = scaleX
  dragState.scaleY = scaleY
  hideTooltip()
}

/**
 * A second finger: the drag in progress ends and the two fingers zoom the
 * view about the point between them, which stays under them as they spread.
 */
function beginPinch() {
  const [first, second] = [...activePointers.values()]
  if (!first || !second || !currentViewBox) {
    return
  }

  if (dragRafId) {
    cancelAnimationFrame(dragRafId)
    dragRafId = 0
  }
  pendingDragRect = null
  dragState.pointerId = null
  dragState.startPoint = null
  dragState.startClientPoint = null
  dragState.startViewBox = null
  dragState.pressedRegionCode = null

  const midpoint = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }
  const anchor = getSvgPointFromClient(midpoint.x, midpoint.y)
  if (!anchor) {
    return
  }

  stopAnimation()
  hideTooltip()
  pinchState.active = true
  pinchState.startDistance = Math.hypot(first.x - second.x, first.y - second.y) || 1
  pinchState.startMidpoint = midpoint
  pinchState.startViewBox = cloneRect(currentViewBox)
  pinchState.anchor = { x: anchor.x, y: anchor.y }
}

function updatePinch() {
  const [first, second] = [...activePointers.values()]
  const start = pinchState.startViewBox
  const anchor = pinchState.anchor
  const startMidpoint = pinchState.startMidpoint
  if (!first || !second || !start || !anchor || !startMidpoint || !frameRef.value) {
    return
  }

  const distance = Math.hypot(first.x - second.x, first.y - second.y) || 1
  const width = start.width * (pinchState.startDistance / distance)
  const height = width * (start.height / start.width)
  const frameRect = frameRef.value.getBoundingClientRect()
  const unitsPerPixel = frameRect.width > 0 ? width / frameRect.width : 1
  const midpoint = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }
  const relativeX = (anchor.x - start.x) / start.width
  const relativeY = (anchor.y - start.y) / start.height

  pendingDragRect = clampViewBox({
    x: anchor.x - width * relativeX - (midpoint.x - startMidpoint.x) * unitsPerPixel,
    y: anchor.y - height * relativeY - (midpoint.y - startMidpoint.y) * unitsPerPixel,
    width,
    height
  })

  if (!dragRafId) {
    dragRafId = requestAnimationFrame(() => {
      dragRafId = 0
      if (pendingDragRect) {
        stopAnimation()
        applyViewBox(pendingDragRect)
        pendingDragRect = null
      }
    })
  }
}

function endPinch() {
  if (dragRafId) {
    cancelAnimationFrame(dragRafId)
    dragRafId = 0
  }
  if (pendingDragRect) {
    applyViewBox(pendingDragRect)
    pendingDragRect = null
  }
  pinchState.active = false
  pinchState.startMidpoint = null
  pinchState.startViewBox = null
  pinchState.anchor = null
}

function handlePointerMove(event: PointerEvent) {
  if (pinchState.active && activePointers.has(event.pointerId)) {
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    updatePinch()
    return
  }

  if (dragState.pointerId === event.pointerId && dragState.startClientPoint && dragState.startViewBox) {
    const clientDx = event.clientX - dragState.startClientPoint.x
    const clientDy = event.clientY - dragState.startClientPoint.y
    const movement = Math.hypot(clientDx, clientDy)

    if (movement > 5) {
      dragState.moved = true
    }

    pendingDragRect = clampViewBox({
      x: dragState.startViewBox.x - clientDx * dragState.scaleX,
      y: dragState.startViewBox.y - clientDy * dragState.scaleY,
      width: dragState.startViewBox.width,
      height: dragState.startViewBox.height
    })

    if (!dragRafId) {
      dragRafId = requestAnimationFrame(() => {
        dragRafId = 0
        if (pendingDragRect) {
          stopAnimation()
          applyViewBox(pendingDragRect)
          pendingDragRect = null
        }
      })
    }
    return
  }

  // No hover tooltip under a finger: the caption below the map carries the
  // facts once a region is selected.
  if (event.pointerType === 'touch') {
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
  if (tapState.pointerId === event.pointerId) {
    const start = tapState.start
    const code = tapState.pressedRegionCode
    const travelled = start ? Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10 : true
    resetTapState()
    hideTooltip()
    if (!travelled && code && regionByCode.value[code]) {
      selectRegion(code)
    }
    return
  }

  if (activePointers.has(event.pointerId)) {
    releasePointer(event.pointerId)
  }

  // The pinch ends with the first finger to lift, and the other finger is
  // done too rather than turning into a drag from a stale start.
  if (pinchState.active) {
    endPinch()
    return
  }

  if (!frameRef.value || dragState.pointerId !== event.pointerId) {
    return
  }

  const pressedRegionCode = dragState.pressedRegionCode
  const shouldSelect = !dragState.moved && Boolean(pressedRegionCode && regionByCode.value[pressedRegionCode])

  if (dragRafId) {
    cancelAnimationFrame(dragRafId)
    dragRafId = 0
  }
  if (pendingDragRect) {
    applyViewBox(pendingDragRect)
    pendingDragRect = null
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

/** The browser took the gesture, a scroll usually: whatever was pressed is not a tap. */
function handlePointerCancel(event: PointerEvent) {
  if (tapState.pointerId === event.pointerId) {
    resetTapState()
    hideTooltip()
    return
  }
  if (dragState.pointerId === event.pointerId) {
    dragState.moved = true
  }
  handlePointerUp(event)
}

function handlePointerLeave() {
  if (dragState.pointerId !== null || pinchState.active) {
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
  if (dragRafId) {
    cancelAnimationFrame(dragRafId)
    dragRafId = 0
  }
  pendingDragRect = null
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

    svgHost.value.innerHTML = await loadPreparedSvgMarkup()
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
