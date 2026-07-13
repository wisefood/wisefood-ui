<template>
  <div class="min-h-screen bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <!-- Header -->
    <RecipesRecipeWranglerHeader :back-to="backLink.to" :back-label="backLink.label" />

    <!-- Loading State -->
    <div v-if="loading && !regionReloading" class="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div class="animate-pulse space-y-6">
        <div class="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4"></div>
        <div class="aspect-video bg-zinc-200 dark:bg-zinc-700 rounded-2xl"></div>
        <div class="space-y-3">
          <div class="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full"></div>
          <div class="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-5/6"></div>
          <div class="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-4/6"></div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-center">
      <UIcon name="i-lucide-alert-circle" class="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h2 class="text-2xl font-bold text-zinc-900 dark:text-white mb-2">{{ t('recipeWrangler.detail.failedToLoad') }}</h2>
      <p class="text-zinc-600 dark:text-zinc-400 mb-6">{{ error }}</p>
      <UButton @click="loadRecipe" color="primary">
        {{ t('recipeWrangler.results.tryAgain') }}
      </UButton>
    </div>

    <!-- Recipe Content -->
    <main v-else-if="recipe" class="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8 py-4 sm:py-10">
      <!-- Hero Section with Image -->
      <div class="mb-8 sm:mb-10">
        <!-- Image -->
        <div v-if="recipeImageUrl" class="relative aspect-[16/7] sm:aspect-[16/6] rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-xl mb-6">
          <img
            :src="recipeImageUrl"
            :alt="recipe.title"
            class="w-full h-full object-cover"
            referrerpolicy="no-referrer"
            @error="handleImageError"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

          <!-- Title Overlay on Image -->
          <div class="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
            <h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white mb-3 drop-shadow-lg">
              {{ recipe.title }}
            </h1>

            <!-- Meta Info -->
            <div class="flex flex-wrap items-center gap-3 sm:gap-4 text-white/90">
              <div v-if="recipe.duration" class="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <UIcon name="i-lucide-clock" class="w-4 h-4" />
                <span class="text-xs sm:text-sm font-medium">{{ recipe.duration }} {{ t('recipeWrangler.recipe.minuteShort') }}</span>
              </div>
              <div v-if="recipe.serves" class="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <UIcon name="i-lucide-users" class="w-4 h-4" />
                <span class="text-xs sm:text-sm font-medium">{{ recipe.serves }} {{ t('recipeWrangler.recipe.servings', recipe.serves) }}</span>
              </div>
              <NuxtLink
                v-if="recipe.source"
                :to="recipe.source_id ? `/recipe-wrangler/collections/${encodeURIComponent(recipe.source_id)}` : undefined"
                :class="recipe.source_id ? 'hover:bg-white/30 transition-colors cursor-pointer' : ''"
                class="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full"
              >
                <UIcon name="i-lucide-database" class="w-4 h-4" />
                <span class="text-xs sm:text-sm font-medium">Source: {{ recipe.source }}</span>
                <UIcon v-if="recipe.source_id" name="i-lucide-arrow-up-right" class="w-3 h-3 opacity-75" />
              </NuxtLink>
            </div>
          </div>
        </div>
        <div v-else class="mb-6">
          <h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-zinc-900 dark:text-white mb-4">
            {{ recipe.title }}
          </h1>
          <!-- Meta Info for no-image case -->
          <div class="flex flex-wrap items-center gap-3 sm:gap-4 text-zinc-600 dark:text-zinc-400">
            <div v-if="recipe.duration" class="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
              <UIcon name="i-lucide-clock" class="w-4 h-4 text-brandg-600 dark:text-brandg-400" />
              <span class="text-xs sm:text-sm font-medium">{{ recipe.duration }} {{ t('recipeWrangler.recipe.minuteShort') }}</span>
            </div>
            <div v-if="recipe.serves" class="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
              <UIcon name="i-lucide-users" class="w-4 h-4 text-brandg-600 dark:text-brandg-400" />
              <span class="text-xs sm:text-sm font-medium">{{ recipe.serves }} {{ t('recipeWrangler.recipe.servings', recipe.serves) }}</span>
            </div>
            <NuxtLink
              v-if="recipe.source"
              :to="recipe.source_id ? `/recipe-wrangler/collections/${encodeURIComponent(recipe.source_id)}` : undefined"
              :class="recipe.source_id ? 'hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer' : ''"
              class="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full"
            >
              <UIcon name="i-lucide-database" class="w-4 h-4 text-brandg-600 dark:text-brandg-400" />
              <span class="text-xs sm:text-sm font-medium">Source: {{ recipe.source }}</span>
              <UIcon v-if="recipe.source_id" name="i-lucide-arrow-up-right" class="w-3 h-3 text-brandg-500 dark:text-brandg-400" />
            </NuxtLink>
            <div class="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
              <UIcon name="i-lucide-award" class="w-4 h-4 text-brandg-600 dark:text-brandg-400" />
              <span class="text-xs sm:text-sm font-medium">Nutri-Score {{ nutriScoreGrade || 'N/A' }}</span>
            </div>
          </div>
        </div>

        <!-- Tags + Nutri-Score strip + Sustainability bar -->
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 justify-between">
          <!-- Dish types -->
          <div v-if="dishTypeChips.length" class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Dish</span>
            <span
              v-for="chip in dishTypeChips"
              :key="`dish-${chip.value}`"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brandg-50 dark:bg-brandg-900/40 text-brandg-700 dark:text-brandg-200 border border-brandg-200 dark:border-brandg-700"
            >
              <UIcon :name="chip.icon" class="w-3 h-3" />
              {{ chip.label }}
            </span>
          </div>

          <!-- Tags -->
          <div v-if="displayRecipeTags.length" class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Tags</span>
            <span
              v-for="(tag, idx) in displayRecipeTags"
              :key="`tag-${tag.raw}-${idx}`"
              class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-brandg-100/70 dark:bg-brandg-900/40 text-brandg-800 dark:text-brandg-200 border border-brandg-200 dark:border-brandg-700"
            >
              {{ tag.label }}
            </span>
          </div>

          <!-- Divider -->
          <div v-if="displayRecipeTags.length" class="h-4 w-px bg-zinc-300 dark:bg-zinc-600 hidden sm:block"></div>

          <!-- Nutri-Score mini strip -->
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Nutri-Score</span>
            <div class="flex gap-0.5">
              <span
                v-for="grade in ['A', 'B', 'C', 'D', 'E']"
                :key="grade"
                :class="[
                  'flex items-center justify-center font-black text-white text-xs rounded-sm transition-all select-none',
                  nutriScoreGrade === grade ? 'w-7 h-7 opacity-100 ring-2 ring-offset-1 ring-zinc-400/50 dark:ring-zinc-500/50' : 'w-5 h-6 opacity-40',
                  getNutriScoreColorBg(grade)
                ]"
              >{{ grade }}</span>
            </div>
            <UTooltip v-if="nutriBreakdown" text="How was this score calculated?">
              <button
                type="button"
                @click="showNutriScoreDetails = true"
                class="flex items-center justify-center w-4 h-4 rounded-full text-zinc-400 dark:text-zinc-500 hover:text-brandg-600 dark:hover:text-brandg-400 transition-colors cursor-pointer"
              >
                <UIcon name="i-lucide-circle-help" class="w-4 h-4" />
              </button>
            </UTooltip>
          </div>

          <!-- Divider -->
          <div v-if="sustainabilityLevel" class="h-5 w-px bg-zinc-300 dark:bg-zinc-600 hidden sm:block"></div>

          <!-- Sustainability progress bar (hidden when no footprint data) -->
          <UTooltip
            v-if="sustainabilityLevel"
            :text="t('recipeWrangler.detail.sustainability.perServing', { value: formatNumber(sustainabilityPerServing) })"
          >
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-leaf" class="w-3.5 h-3.5 text-brandg-500 dark:text-brandg-400 flex-shrink-0" />
              <span class="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {{ t('recipeWrangler.detail.sustainability.label') }}
              </span>
              <div class="w-24 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div
                  :class="['h-full bg-gradient-to-r rounded-full', sustainabilityLevel.barClass]"
                  :style="{ width: `${sustainabilityLevel.pct}%` }"
                ></div>
              </div>
              <span :class="['text-xs font-medium', sustainabilityLevel.textClass]">
                {{ t(`recipeWrangler.detail.sustainability.levels.${sustainabilityLevel.key}`) }}
              </span>
            </div>
          </UTooltip>

          <!-- Action buttons -->
          <div class="ml-auto flex items-center gap-2">
            <NuxtLink
              v-if="recipe && recipe.recipe_id && authStore.hasAnyRole(['expert', 'admin'])"
              :to="`/console/assets/recipes/${encodeURIComponent(recipe.recipe_id)}`"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all"
            >
              <UIcon name="i-lucide-pencil" class="w-4 h-4 text-brandg-600 dark:text-brandg-400" />
              <span class="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                {{ t('recipeWrangler.recipe.editInConsole') }}
              </span>
            </NuxtLink>

            <!-- Save button -->
            <button
              v-if="recipe"
              @click="toggleFavorite"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all"
            >
              <UIcon
                name="i-lucide-heart"
                :class="['w-4 h-4 transition-colors', isFavorite ? 'text-red-500 fill-red-500' : 'text-zinc-500 dark:text-zinc-400']"
              />
              <span class="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                {{ isFavorite ? t('recipeWrangler.recipe.saved') : t('recipeWrangler.recipe.save') }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Improve nudge for low Nutri-Score recipes -->
      <div
        v-if="showImproveNudge"
        class="mb-6 rounded-2xl border border-brandg-200 dark:border-brandg-700 bg-gradient-to-r from-brandg-50 to-brandg-100 dark:from-brandg-900/30 dark:to-brandg-900/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3"
      >
        <div class="flex items-start gap-3 flex-1 min-w-0">
          <span
            :class="['w-9 h-9 rounded-lg flex items-center justify-center text-base font-black text-white flex-shrink-0', getNutriScoreColorBg(nutriScoreGrade || '')]"
          >
            {{ nutriScoreGrade }}
          </span>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-zinc-900 dark:text-white">
              {{ t('recipeWrangler.detail.adaptation.nudgeTitle') }}
            </p>
            <p class="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
              {{ nudgeTopSuggestion || t('recipeWrangler.detail.adaptation.nudgeSubtitle') }}
            </p>
          </div>
        </div>
        <button
          type="button"
          @click="openAdaptModal"
          class="flex-shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-brandg-600 hover:bg-brandg-700 text-white transition-colors"
        >
          <UIcon name="i-lucide-sparkles" class="w-4 h-4" />
          {{ t('recipeWrangler.detail.adaptation.nudgeCta') }}
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
        <!-- Main Content (Left Column) -->
        <div class="lg:col-span-3 space-y-6 sm:space-y-8">

          <!-- Nutrition Information -->
          <section class="bg-white dark:bg-zinc-800 rounded-3xl p-8 sm:p-10 border border-zinc-200 dark:border-zinc-700 shadow-lg">
            <div class="flex items-center justify-between mb-3 gap-3 flex-wrap">
              <h2 class="text-xl font-claude text-zinc-900 dark:text-white flex items-center gap-3">
                <UIcon name="i-lucide-activity" class="w-7 h-7 text-brandg-600 dark:text-brandg-400" />
                {{ t('recipeWrangler.detail.nutritionalInfo') }}
              </h2>
              <div class="flex items-center gap-2 flex-wrap">
                <!-- Region switcher -->
                <div class="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/40 p-1 gap-1">
                  <button
                    v-for="region in SUPPORTED_REGIONS"
                    :key="region"
                    type="button"
                    :disabled="regionReloading"
                    @click="changeRegion(region)"
                    :class="[
                      'px-3 py-1 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50',
                      selectedRegion === region
                        ? 'bg-brandg-500 text-white'
                        : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    ]"
                  >
                    {{ region }}
                  </button>
                </div>
                <button
                  @click="toggleNutrientView"
                  class="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brandg-50 to-brandg-100 dark:from-brandg-900/30 dark:to-brandg-800/30 border border-brandg-200 dark:border-brandg-700 hover:from-brandg-100 hover:to-brandg-200 dark:hover:from-brandg-900/50 dark:hover:to-brandg-800/50 transition-all group"
                >
                  <UIcon
                    :name="showRadarChart ? 'i-lucide-layout-grid' : 'i-lucide-radar'"
                    class="w-5 h-5 text-brandg-600 dark:text-brandg-400 group-hover:scale-110 transition-transform"
                  />
                  <span class="text-sm font-medium text-brandg-700 dark:text-brandg-300">
                    {{ showRadarChart ? t('recipeWrangler.detail.gridView') : t('recipeWrangler.detail.chartView') }}
                  </span>
                </button>
              </div>
            </div>
            <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-8">{{ t('recipeWrangler.detail.perServing') }} · <span class="italic">{{
              selectedRegion === 'HU'
                ? 'Based on the Hungarian Food Composition Table'
                : selectedRegion === 'IE'
                  ? 'Based on the Irish Food Composition Table'
                  : 'Based on the USDA Food Composition Table'
            }}</span></p>

            <!-- Animated Container for View Switching -->
            <div class="relative overflow-hidden">
              <!-- Grid View -->
              <Transition
                enter-active-class="transition-all duration-500 ease-out"
                enter-from-class="opacity-0 scale-95"
                enter-to-class="opacity-100 scale-100"
                leave-active-class="transition-all duration-500 ease-out absolute inset-0"
                leave-from-class="opacity-100 scale-100"
                leave-to-class="opacity-0 scale-95"
              >
                <div v-if="!showRadarChart" class="space-y-6">
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div class="rounded-xl bg-zinc-50 dark:bg-white/4 p-4 sm:p-5">
                      <div class="flex items-center gap-1.5 mb-2">
                        <UIcon name="i-lucide-flame" class="w-4 h-4 text-brand-500 dark:text-brand-400" />
                        <p class="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{{ t('recipeWrangler.detail.calories') }}</p>
                      </div>
                      <p class="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
                        {{ formatMetric(summaryCaloriesPerServing, 0) }}
                      </p>
                    </div>

                    <div class="rounded-xl bg-zinc-50 dark:bg-white/4 p-4 sm:p-5">
                      <div class="flex items-center gap-1.5 mb-2">
                        <UIcon name="i-lucide-dumbbell" class="w-4 h-4 text-brandg-500 dark:text-brandg-400" />
                        <p class="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{{ t('recipeWrangler.detail.protein') }}</p>
                      </div>
                      <p class="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
                        {{ formatMetricWithUnit(summaryProteinPerServing, 1, 'g') }}
                      </p>
                    </div>

                    <div class="rounded-xl bg-zinc-50 dark:bg-white/4 p-4 sm:p-5">
                      <div class="flex items-center gap-1.5 mb-2">
                        <UIcon name="i-lucide-wheat" class="w-4 h-4 text-brandp-400 dark:text-brandp-300" />
                        <p class="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{{ t('recipeWrangler.detail.carbs') }}</p>
                      </div>
                      <p class="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
                        {{ formatMetricWithUnit(summaryCarbsPerServing, 1, 'g') }}
                      </p>
                    </div>

                    <div class="rounded-xl bg-zinc-50 dark:bg-white/4 p-4 sm:p-5">
                      <div class="flex items-center gap-1.5 mb-2">
                        <UIcon name="i-lucide-droplet" class="w-4 h-4 text-terracotta dark:text-orange-400" />
                        <p class="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{{ t('recipeWrangler.detail.fat') }}</p>
                      </div>
                      <p class="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
                        {{ formatMetricWithUnit(summaryFatPerServing, 1, 'g') }}
                      </p>
                    </div>
                  </div>

                  <!-- Additional Nutrition -->
                  <div class="grid grid-cols-3 gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <div class="rounded-lg bg-zinc-50 dark:bg-white/4 px-3 py-3">
                      <div class="flex items-center gap-1.5 mb-1.5">
                        <UIcon name="i-lucide-leaf" class="w-3.5 h-3.5 text-brandg-500 dark:text-brandg-400" />
                        <p class="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Fiber</p>
                      </div>
                      <p class="text-lg font-bold text-zinc-900 dark:text-white">
                        {{ formatMetricWithUnit(summaryFiberPerServing, 1, 'g') }}
                      </p>
                    </div>
                    <div class="rounded-lg bg-zinc-50 dark:bg-white/4 px-3 py-3">
                      <div class="flex items-center gap-1.5 mb-1.5">
                        <UIcon name="i-lucide-candy" class="w-3.5 h-3.5 text-brand-400 dark:text-brand-300" />
                        <p class="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Sugar</p>
                      </div>
                      <p class="text-lg font-bold text-zinc-900 dark:text-white">
                        {{ formatMetricWithUnit(summarySugarPerServing, 1, 'g') }}
                      </p>
                    </div>
                    <div class="rounded-lg bg-zinc-50 dark:bg-white/4 px-3 py-3">
                      <div class="flex items-center gap-1.5 mb-1.5">
                        <UIcon name="i-lucide-droplets" class="w-3.5 h-3.5 text-brandp-400 dark:text-brandp-300" />
                        <p class="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Sodium</p>
                      </div>
                      <p class="text-lg font-bold text-zinc-900 dark:text-white">
                        {{ formatMetricWithUnit(summarySodiumPerServing, 0, 'mg') }}
                      </p>
                    </div>
                  </div>
                </div>
              </Transition>

              <!-- Radar Chart View -->
              <Transition
                enter-active-class="transition-all duration-500 ease-out"
                enter-from-class="opacity-0 scale-95"
                enter-to-class="opacity-100 scale-100"
                leave-active-class="transition-all duration-500 ease-out absolute inset-0"
                leave-from-class="opacity-100 scale-100"
                leave-to-class="opacity-0 scale-95"
              >
                <div v-if="showRadarChart" class="py-4">
                  <NutrientRadarChart
                    :calories="toNumber(summaryCaloriesPerServing)"
                    :protein="toNumber(summaryProteinPerServing)"
                    :carbs="toNumber(summaryCarbsPerServing)"
                    :fat="toNumber(summaryFatPerServing)"
                    :fiber="toNumber(summaryFiberPerServing)"
                    :sugar="toNumber(summarySugarPerServing)"
                    :sodium="toNumber(summarySodiumPerServing)"
                  />
                </div>
              </Transition>
            </div>

            <div
              v-if="displayNutrientRows.length"
              class="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-700"
            >
              <button
                type="button"
                @click="showAllNutrients = !showAllNutrients"
                class="w-full flex items-center justify-between gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-3 bg-zinc-50/70 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <div class="text-left">
                  <h3 class="text-base font-semibold text-zinc-900 dark:text-white">
                    Detailed Nutrition
                  </h3>
                  <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {{ showAllNutrients ? 'Hide full nutrient list' : 'Show full nutrient list' }}
                  </p>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-200/80 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                    Per serving
                  </span>
                  <UIcon
                    :name="showAllNutrients ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                    class="w-5 h-5 text-zinc-600 dark:text-zinc-300"
                  />
                </div>
              </button>

              <Transition
                enter-active-class="transition-all duration-300 ease-out"
                enter-from-class="opacity-0 -translate-y-1"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-1"
              >
                <div
                  v-if="showAllNutrients"
                  class="mt-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700 shadow-sm bg-white/60 dark:bg-zinc-900/30"
                >
                  <table class="min-w-full text-sm">
                    <thead class="bg-zinc-50/90 dark:bg-zinc-900/70">
                      <tr>
                        <th class="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-zinc-300">
                          Nutrient
                        </th>
                        <th class="px-4 py-3 text-right font-semibold text-zinc-700 dark:text-zinc-300">
                          Amount / serving
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(nutrient, index) in displayNutrientRows"
                        :key="`${nutrient.nutrient_code || nutrient.nutrient_name || 'n'}-${index}`"
                        class="border-t border-zinc-200/80 dark:border-zinc-700 odd:bg-transparent even:bg-zinc-50/45 dark:even:bg-zinc-800/35"
                      >
                        <td class="px-4 py-2.5 text-zinc-800 dark:text-zinc-200 font-medium">
                          {{ nutrient.display_label }}
                        </td>
                        <td class="px-4 py-2 text-right font-medium text-zinc-900 dark:text-white">
                          {{ formatNutrientAmount(nutrient.amount_per_serving, nutrient.unit_name, nutrient) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Transition>
            </div>

            <div class="mt-6">
              <button
                v-if="(!showProfilingDetails || profilingLoading) && profilingDetailRows.length === 0"
                type="button"
                @click="toggleNutritionProfilingDetails"
                :disabled="profilingLoading"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <UIcon
                  :name="profilingLoading ? 'i-lucide-loader-2' : 'i-lucide-microscope'"
                  :class="['w-4 h-4', profilingLoading ? 'animate-spin' : '']"
                />
                <span>{{ profilingLoading ? 'Loading profiling data…' : 'Load ingredient profiling' }}</span>
              </button>
              <p
                v-if="profilingError"
                class="mt-2 text-xs text-red-600 dark:text-red-400"
              >
                {{ profilingError }}
              </p>
            </div>

          </section>

          <!-- Instructions -->
          <section class="bg-white dark:bg-zinc-800 rounded-3xl p-8 sm:p-10 border border-zinc-200 dark:border-zinc-700 shadow-lg">
            <h2 class="text-xl font-claude text-zinc-900 dark:text-white mb-8 flex items-center gap-3">
              <UIcon name="i-lucide-chef-hat" class="w-7 h-7 text-brandg-600 dark:text-brandg-400" />
              {{ t('recipeWrangler.detail.instructions') }}
            </h2>

            <ol class="space-y-6">
              <li
                v-for="(instruction, index) in recipe.instructions"
                :key="index"
                @click="toggleInstruction(index)"
                class="flex gap-5 group cursor-pointer"
              >
                <div
                  :class="[
                    'flex-shrink-0 w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-base shadow-md transition-all',
                    checkedInstructions[index]
                      ? 'bg-zinc-400 dark:bg-zinc-600 group-hover:scale-100'
                      : 'bg-gradient-to-br from-brandg-500 to-brandg-600 dark:from-brandg-600 dark:to-brandg-700 group-hover:scale-110'
                  ]"
                >
                  <UIcon
                    v-if="checkedInstructions[index]"
                    name="i-lucide-check"
                    class="w-5 h-5"
                  />
                  <span v-else>{{ index + 1 }}</span>
                </div>
                <p
                  :class="[
                    'flex-1 text-base leading-relaxed pt-2 transition-all',
                    checkedInstructions[index]
                      ? 'line-through text-zinc-400 dark:text-zinc-600'
                      : 'text-zinc-700 dark:text-zinc-300'
                  ]"
                >
                  {{ instruction }}
                </p>
              </li>
            </ol>
          </section>
        </div>

        <!-- Sidebar (Right Column) -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Ingredients -->
          <section class="bg-white dark:bg-zinc-800 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-700 shadow-lg sticky top-24 z-0">
            <div class="mb-8 flex items-center justify-between gap-3">
              <h2 class="text-xl font-claude text-zinc-900 dark:text-white flex items-center gap-3">
                <UIcon name="i-lucide-shopping-basket" class="w-7 h-7 text-brandg-600 dark:text-brandg-400" />
                {{ t('recipeWrangler.detail.ingredients') }}
              </h2>
              <UTooltip :text="t('recipeWrangler.detail.adaptation.action')">
                <button
                  type="button"
                  @click="openAdaptModal"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-brandg-50 dark:bg-brandg-900/30 text-brandg-700 dark:text-brandg-300 border border-brandg-200 dark:border-brandg-700 hover:bg-brandg-100 dark:hover:bg-brandg-900/50 transition-colors"
                >
                  <UIcon name="i-lucide-sparkles" class="w-3.5 h-3.5" />
                  {{ t('recipeWrangler.detail.adaptation.improve') }}
                </button>
              </UTooltip>
            </div>

            <!-- Saved adapted version indicator -->
            <div
              v-if="savedAdaptation"
              class="mb-4 rounded-xl border border-brandg-200 dark:border-brandg-700 bg-brandg-50 dark:bg-brandg-900/20 px-3 py-2.5"
            >
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-bookmark-check" class="w-4 h-4 text-brandg-600 dark:text-brandg-400 flex-shrink-0" />
                <p class="text-xs text-brandg-800 dark:text-brandg-200 flex-1 min-w-0 truncate">
                  {{ t('recipeWrangler.detail.adaptation.savedBanner') }}
                  <span class="font-semibold">{{ savedAdaptation.title }}</span>
                </p>
                <button
                  type="button"
                  :disabled="adaptRemoveBusy"
                  @click="removeAdaptedRecipe"
                  class="flex-shrink-0 text-xs font-medium text-brandg-700 dark:text-brandg-300 underline hover:text-brandg-900 dark:hover:text-brandg-100 disabled:opacity-50 transition-colors"
                >
                  {{ t('recipeWrangler.detail.adaptation.remove') }}
                </button>
              </div>
              <p class="text-[10px] text-brandg-700/80 dark:text-brandg-300/80 mt-1 ml-6">
                {{ t('recipeWrangler.detail.adaptation.savedNote') }}
              </p>
            </div>

            <ul class="space-y-1">
              <li
                v-for="(ingredient, index) in recipe.ingredients"
                :key="index"
                class="rounded-xl transition-colors"
                :class="expandedIngredient === index ? 'bg-zinc-50 dark:bg-zinc-700/30' : ''"
              >
                <!-- Main ingredient row -->
                <div
                  class="flex items-start gap-4 group cursor-pointer px-2 py-3"
                  @click="toggleIngredient(index)"
                >
                  <div
                    :class="[
                      'w-6 h-6 rounded-md border-2 border-brandg-500 dark:border-brandg-400 mt-0.5 flex-shrink-0 flex items-center justify-center transition-all',
                      checkedIngredients[index] ? 'bg-brandg-500 dark:bg-brandg-400' : 'group-hover:bg-brandg-100 dark:group-hover:bg-brandg-900/30'
                    ]"
                  >
                    <UIcon
                      v-if="checkedIngredients[index]"
                      name="i-lucide-check"
                      class="w-4 h-4 text-white"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p :class="[
                      'font-medium text-base transition-all',
                      checkedIngredients[index]
                        ? 'line-through text-zinc-400 dark:text-zinc-600'
                        : 'text-zinc-900 dark:text-white'
                    ]">
                      {{ ingredient.name }}
                    </p>
                    <p v-if="ingredient.measurement" :class="[
                      'text-sm mt-0.5 transition-all',
                      checkedIngredients[index]
                        ? 'line-through text-zinc-400 dark:text-zinc-600'
                        : 'text-zinc-500 dark:text-zinc-400'
                    ]">
                      {{ ingredient.measurement }}
                    </p>
                    <!-- Profiling summary pill (visible when loaded, not expanded) -->
                    <div
                      v-if="showProfilingDetails && profilingFor(ingredient.name) && expandedIngredient !== index"
                      class="mt-1.5 flex items-center gap-1.5 flex-wrap"
                    >
                      <span
                        v-if="profilingFor(ingredient.name)?.weight_g || weightDetailFor(ingredient.name)?.weight_grams"
                        class="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-brandg-100 dark:bg-brandg-900/30 text-brandg-700 dark:text-brandg-300"
                      >
                        <UIcon name="i-lucide-weight" class="w-2.5 h-2.5" />
                        {{ formatNumber(profilingFor(ingredient.name)?.weight_g || weightDetailFor(ingredient.name)?.weight_grams) }}g
                      </span>
                    </div>
                  </div>
                  <!-- Ingredient substitution trigger -->
                  <UTooltip :text="t('recipeWrangler.detail.substitution.action')">
                    <button
                      type="button"
                      @click.stop="openSubstituteModal(ingredient.name)"
                      class="flex-shrink-0 mt-0.5 p-1 rounded-md text-zinc-300 dark:text-zinc-600 hover:text-brandg-600 dark:hover:text-brandg-400 hover:bg-brandg-50 dark:hover:bg-brandg-900/20 transition-colors"
                      :aria-label="t('recipeWrangler.detail.substitution.action')"
                    >
                      <UIcon name="i-lucide-repeat-2" class="w-3.5 h-3.5" />
                    </button>
                  </UTooltip>
                  <!-- Expand toggle for profiling (only when data is loaded) -->
                  <button
                    v-if="showProfilingDetails && profilingFor(ingredient.name)"
                    type="button"
                    @click.stop="expandedIngredient = expandedIngredient === index ? null : index"
                    class="flex-shrink-0 mt-0.5 p-1 rounded-md text-zinc-400 dark:text-zinc-500 hover:text-brandg-600 dark:hover:text-brandg-400 hover:bg-brandg-50 dark:hover:bg-brandg-900/20 transition-colors"
                  >
                    <UIcon
                      :name="expandedIngredient === index ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                      class="w-3.5 h-3.5"
                    />
                  </button>
                </div>

                <!-- Profiling detail accordion -->
                <Transition
                  enter-active-class="transition-all duration-200 ease-out"
                  enter-from-class="opacity-0 -translate-y-1"
                  enter-to-class="opacity-100 translate-y-0"
                  leave-active-class="transition-all duration-150 ease-in"
                  leave-from-class="opacity-100 translate-y-0"
                  leave-to-class="opacity-0 -translate-y-1"
                >
                  <div
                    v-if="showProfilingDetails && expandedIngredient === index && profilingFor(ingredient.name)"
                    class="px-3 pb-3"
                  >
                    <div class="rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3 space-y-2.5">
                      <!-- Weight row -->
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Weight used</span>
                        <span class="font-mono text-xs font-semibold text-brandg-700 dark:text-brandg-300">
                          {{ formatNumber(profilingFor(ingredient.name)?.weight_g || weightDetailFor(ingredient.name)?.weight_grams) }} g
                        </span>
                      </div>
                      <!-- Parsed qty -->
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Parsed qty</span>
                        <span class="font-mono text-xs text-zinc-700 dark:text-zinc-300">
                          {{ profilingFor(ingredient.name)?.parsed_quantity || weightDetailFor(ingredient.name)?.parsed_quantity || '—' }}
                          {{ profilingFor(ingredient.name)?.parsed_unit || weightDetailFor(ingredient.name)?.parsed_unit || '' }}
                          <span v-if="weightDetailFor(ingredient.name)?.quantity_inferred || weightDetailFor(ingredient.name)?.unit_inferred" class="ml-1 text-amber-500">
                            <UIcon name="i-lucide-zap" class="w-2.5 h-2.5 inline" />
                          </span>
                        </span>
                      </div>
                      <!-- Match source -->
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Match source</span>
                        <span :class="[
                          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border',
                          getMatchSourceStyle(String(profilingFor(ingredient.name)?.weight_source || profilingFor(ingredient.name)?.nutrition_match_source || weightDetailFor(ingredient.name)?.match_type || ''))
                        ]">
                          <UIcon :name="getMatchSourceIcon(String(profilingFor(ingredient.name)?.weight_source || profilingFor(ingredient.name)?.nutrition_match_source || weightDetailFor(ingredient.name)?.match_type || ''))" class="w-2.5 h-2.5" />
                          {{ getWeightSourceLabel(String(profilingFor(ingredient.name)?.weight_source || profilingFor(ingredient.name)?.nutrition_match_source || weightDetailFor(ingredient.name)?.match_type || '')) }}
                        </span>
                      </div>
                      <!-- Matched ingredient -->
                      <div class="flex items-start justify-between gap-2">
                        <span class="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-0.5 shrink-0">Matched to</span>
                        <span class="text-xs text-zinc-700 dark:text-zinc-300 text-right">
                          {{ profilingFor(ingredient.name)?.matched_nutritional_ingredient || profilingFor(ingredient.name)?.weight_match || '—' }}
                        </span>
                      </div>
                      <!-- Nutrition source -->
                      <div class="flex items-start justify-between gap-2">
                        <span class="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-0.5 shrink-0">Source</span>
                        <span class="text-xs text-zinc-600 dark:text-zinc-400 text-right">
                          {{ formatNutritionSourceLabel(profilingFor(ingredient.name)?.nutrition_source || profilingFor(ingredient.name)?.source_nutrition || profilingFor(ingredient.name)?.source) }}
                        </span>
                      </div>
                      <!-- Similarity -->
                      <div
                        v-if="profilingFor(ingredient.name)?.similarity !== null && profilingFor(ingredient.name)?.similarity !== undefined"
                        class="flex items-center justify-between gap-2"
                      >
                        <span class="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Similarity</span>
                        <span :class="[
                          'font-mono text-xs font-semibold',
                          Number(profilingFor(ingredient.name)?.similarity) >= 0.85 ? 'text-brandg-600 dark:text-brandg-400' :
                          Number(profilingFor(ingredient.name)?.similarity) >= 0.6 ? 'text-amber-600 dark:text-amber-400' :
                          'text-red-600 dark:text-red-400'
                        ]">
                          {{ (Number(profilingFor(ingredient.name)?.similarity) * 100).toFixed(0) }}%
                        </span>
                      </div>
                      <!-- USDA ID -->
                      <div v-if="profilingFor(ingredient.name)?.canonical_food_id || weightDetailFor(ingredient.name)?.usda_id" class="flex items-center justify-between gap-2">
                        <span class="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">USDA ID</span>
                        <span class="font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                          #{{ profilingFor(ingredient.name)?.canonical_food_id || weightDetailFor(ingredient.name)?.usda_id }}
                        </span>
                      </div>
                      <!-- Per-ingredient macros (protein / carbs / fat) -->
                      <div
                        v-if="profilingFor(ingredient.name)?.protein_g !== undefined || profilingFor(ingredient.name)?.carbs_g !== undefined || profilingFor(ingredient.name)?.fat_g !== undefined"
                        class="pt-2 border-t border-zinc-200 dark:border-zinc-700 grid grid-cols-3 gap-2"
                      >
                        <div class="text-center">
                          <p class="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Protein</p>
                          <p class="font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300">{{ formatNumber(profilingFor(ingredient.name)?.protein_g) }}g</p>
                        </div>
                        <div class="text-center">
                          <p class="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Carbs</p>
                          <p class="font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300">{{ formatNumber(profilingFor(ingredient.name)?.carbs_g) }}g</p>
                        </div>
                        <div class="text-center">
                          <p class="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Fat</p>
                          <p class="font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300">{{ formatNumber(profilingFor(ingredient.name)?.fat_g) }}g</p>
                        </div>
                      </div>
                      <!-- Error -->
                      <div v-if="weightDetailFor(ingredient.name)?.error" class="pt-1 border-t border-red-200 dark:border-red-800">
                        <p class="text-[10px] font-semibold uppercase tracking-wider text-red-400 mb-0.5">Error</p>
                        <p class="text-xs text-red-600 dark:text-red-400">{{ weightDetailFor(ingredient.name)?.error }}</p>
                      </div>
                    </div>
                  </div>
                </Transition>
              </li>
            </ul>
          </section>
        </div>
      </div>

      <UModal v-model:open="showNutriScoreDetails" :ui="{ content: 'max-w-3xl' }">
        <template #content>
          <div class="p-6 sm:p-7 bg-white dark:bg-zinc-900">
            <div class="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 class="text-xl font-semibold text-zinc-900 dark:text-white">
                  Nutri-Score Calculation
                </h3>
                <p class="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Based on per-100g nutrient values for this recipe.
                </p>
              </div>
              <span class="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                {{ nutriScoreGrade || 'N/A' }}
              </span>
            </div>

            <div v-if="nutriBreakdown" class="space-y-6">
              <div class="text-sm text-zinc-700 dark:text-zinc-200">
                Final score:
                <span class="font-semibold">{{ nutriBreakdown.score }}</span>
                =
                <span class="text-red-600 dark:text-red-400 font-semibold">Negative {{ nutriBreakdown.negative_points.total }}</span>
                -
                <span class="text-green-700 dark:text-green-400 font-semibold">Positive {{ nutriBreakdown.positive_points.applied_total }}</span>
              </div>

              <div>
                <h4 class="text-base font-semibold text-red-600 dark:text-red-400 mb-3">
                  Negative points: {{ nutriBreakdown.negative_points.total }}/40
                </h4>
                <div class="space-y-3">
                  <div
                    v-for="item in negativePointItems"
                    :key="`neg-${item.key}`"
                    class="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3"
                  >
                    <div class="flex items-center justify-between text-sm mb-1">
                      <span class="font-medium text-zinc-800 dark:text-zinc-100">{{ item.label }}</span>
                      <span class="text-zinc-600 dark:text-zinc-300">{{ item.points }}/{{ item.max }}</span>
                    </div>
                    <div class="flex gap-1 mb-1">
                      <span
                        v-for="idx in item.max"
                        :key="`neg-${item.key}-${idx}`"
                        :class="[
                          'h-2 w-3 rounded-sm',
                          idx <= item.points ? 'bg-red-500' : 'bg-zinc-300 dark:bg-zinc-700'
                        ]"
                      />
                    </div>
                    <p class="text-xs text-zinc-500 dark:text-zinc-400">
                      {{ item.displayValue }}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 class="text-base font-semibold text-green-700 dark:text-green-400 mb-3">
                  Positive points: {{ nutriBreakdown.positive_points.applied_total }}/15
                </h4>
                <div class="space-y-3">
                  <div
                    v-for="item in positivePointItems"
                    :key="`pos-${item.key}`"
                    class="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3"
                  >
                    <div class="flex items-center justify-between text-sm mb-1">
                      <span class="font-medium text-zinc-800 dark:text-zinc-100">{{ item.label }}</span>
                      <span class="text-zinc-600 dark:text-zinc-300">{{ item.points }}/{{ item.max }}</span>
                    </div>
                    <div class="flex gap-1 mb-1">
                      <span
                        v-for="idx in item.max"
                        :key="`pos-${item.key}-${idx}`"
                        :class="[
                          'h-2 w-3 rounded-sm',
                          idx <= item.points ? 'bg-green-600' : 'bg-zinc-300 dark:bg-zinc-700'
                        ]"
                      />
                    </div>
                    <p class="text-xs text-zinc-500 dark:text-zinc-400">
                      {{ item.displayValue }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="text-sm text-zinc-600 dark:text-zinc-300">
              Detailed Nutri-Score breakdown is not available for this recipe yet.
            </div>
          </div>
        </template>
      </UModal>

      <UModal v-model:open="showSubstituteModal" :ui="{ content: 'max-w-xl' }">
        <template #content>
          <div class="p-6 sm:p-7 bg-white dark:bg-zinc-900">
            <div class="flex items-start justify-between gap-3 mb-5">
              <div>
                <h3 class="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <UIcon name="i-lucide-repeat-2" class="w-5 h-5 text-brandg-600 dark:text-brandg-400" />
                  {{ t('recipeWrangler.detail.substitution.title') }}
                </h3>
                <p class="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  {{ t('recipeWrangler.detail.substitution.subtitle') }}
                </p>
              </div>
            </div>

            <!-- Loading -->
            <div v-if="substituteLoading" class="py-10 flex flex-col items-center gap-3">
              <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-brandg-500 animate-spin" />
              <p class="text-sm text-zinc-600 dark:text-zinc-400">
                {{ t('recipeWrangler.detail.substitution.loading') }}
              </p>
            </div>

            <!-- Error -->
            <div v-else-if="substituteError" class="py-6">
              <div class="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 flex items-start gap-3">
                <UIcon name="i-lucide-triangle-alert" class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p class="text-sm text-amber-800 dark:text-amber-200">
                  {{ substituteError }}
                </p>
              </div>
              <button
                type="button"
                @click="loadSubstitute"
                class="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brandg-600 hover:bg-brandg-700 text-white transition-colors"
              >
                <UIcon name="i-lucide-rotate-cw" class="w-4 h-4" />
                {{ t('recipeWrangler.detail.substitution.retry') }}
              </button>
            </div>

            <!-- Result -->
            <div v-else-if="substituteResult" class="space-y-5">
              <!-- Swap card -->
              <div class="rounded-2xl border border-zinc-200 dark:border-zinc-700 p-4">
                <div class="flex items-center justify-between gap-3">
                  <div class="flex-1 min-w-0 text-center">
                    <p class="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
                      {{ t('recipeWrangler.detail.substitution.original') }}
                    </p>
                    <p class="font-medium text-zinc-500 dark:text-zinc-400 line-through truncate">
                      {{ substituteResult.original_ingredient }}
                    </p>
                  </div>
                  <UIcon name="i-lucide-arrow-right" class="w-5 h-5 text-brandg-500 flex-shrink-0" />
                  <div class="flex-1 min-w-0 text-center">
                    <p class="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
                      {{ t('recipeWrangler.detail.substitution.substitute') }}
                    </p>
                    <p class="font-semibold text-brandg-700 dark:text-brandg-300 truncate">
                      {{ substituteResult.substitute }}
                    </p>
                  </div>
                </div>
                <div class="mt-3 flex justify-center">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700">
                    <UIcon
                      :name="substituteResult.substitution_source === 'graph_direct' ? 'i-lucide-database' : 'i-lucide-network'"
                      class="w-2.5 h-2.5"
                    />
                    {{ substitutionSourceLabel }}
                  </span>
                </div>
              </div>

              <!-- Nutrition impact -->
              <div v-if="substituteProfileAvailable && (substituteImpactRows.length || substituteNutriGrade)">
                <h4 class="text-sm font-semibold text-zinc-800 dark:text-zinc-100 mb-1">
                  {{ t('recipeWrangler.detail.substitution.nutritionImpact') }}
                </h4>
                <p class="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                  {{ t('recipeWrangler.detail.substitution.perServingNote') }}
                </p>
                <div v-if="substituteNutriGrade" class="flex items-center gap-3 mb-3">
                  <span class="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                    {{ t('recipeWrangler.detail.substitution.nutriScore') }}
                  </span>
                  <span
                    :class="['w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold text-white', getNutriScoreColorBg(nutriScoreGrade || '')]"
                  >
                    {{ nutriScoreGrade || '—' }}
                  </span>
                  <UIcon name="i-lucide-arrow-right" class="w-4 h-4 text-zinc-400" />
                  <span
                    :class="['w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold text-white', getNutriScoreColorBg(substituteNutriGrade)]"
                  >
                    {{ substituteNutriGrade }}
                  </span>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div
                    v-for="row in substituteImpactRows"
                    :key="row.key"
                    class="rounded-lg border border-zinc-200 dark:border-zinc-700 p-2.5 text-center"
                  >
                    <p class="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      {{ row.label }}
                    </p>
                    <p class="font-mono text-xs mt-1 text-zinc-500 dark:text-zinc-400 line-through">
                      {{ row.before !== null ? `${formatNumber(row.before)}${row.unit}` : '—' }}
                    </p>
                    <p class="font-mono text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                      {{ formatNumber(row.after) }}{{ row.unit }}
                    </p>
                  </div>
                </div>
              </div>
              <div v-else class="rounded-lg bg-zinc-50 dark:bg-zinc-800 p-3">
                <p class="text-xs text-zinc-500 dark:text-zinc-400">
                  {{ t('recipeWrangler.detail.substitution.profilingUnavailable') }}
                </p>
              </div>

              <!-- Other candidates -->
              <div v-if="otherSubstituteCandidates.length">
                <h4 class="text-sm font-semibold text-zinc-800 dark:text-zinc-100 mb-2">
                  {{ t('recipeWrangler.detail.substitution.otherOptions') }}
                </h4>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="candidate in otherSubstituteCandidates"
                    :key="candidate"
                    class="px-2.5 py-1 rounded-full text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                  >
                    {{ candidate }}
                  </span>
                </div>
              </div>

              <p class="text-xs text-zinc-400 dark:text-zinc-500 flex items-start gap-1.5">
                <UIcon name="i-lucide-info" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                {{ t('recipeWrangler.detail.substitution.note') }}
              </p>
            </div>
          </div>
        </template>
      </UModal>

      <UModal v-model:open="showAdaptModal" :ui="{ content: 'max-w-2xl' }">
        <template #content>
          <div class="p-6 sm:p-7 bg-white dark:bg-zinc-900">
            <div class="mb-5">
              <h3 class="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <UIcon name="i-lucide-sparkles" class="w-5 h-5 text-brandg-600 dark:text-brandg-400" />
                {{ t('recipeWrangler.detail.adaptation.title') }}
              </h3>
              <p class="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                {{ t('recipeWrangler.detail.adaptation.subtitle') }}
              </p>
            </div>

            <!-- Mode tabs -->
            <div class="flex flex-wrap gap-2 mb-5">
              <button
                v-for="mode in adaptModes"
                :key="mode.value"
                type="button"
                :disabled="adaptLoading"
                @click="setAdaptMode(mode.value)"
                :class="[
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  adaptMode === mode.value
                    ? 'bg-brandg-600 text-white border-brandg-600'
                    : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-brandg-400',
                  adaptLoading ? 'opacity-60 cursor-not-allowed' : ''
                ]"
              >
                <UIcon :name="mode.icon" class="w-3.5 h-3.5" />
                {{ mode.label }}
              </button>
            </div>

            <!-- Loading -->
            <div v-if="adaptLoading" class="py-10 flex flex-col items-center gap-3">
              <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-brandg-500 animate-spin" />
              <p class="text-sm text-zinc-600 dark:text-zinc-400">
                {{ t('recipeWrangler.detail.adaptation.loading') }}
              </p>
            </div>

            <!-- Error -->
            <div v-else-if="adaptError" class="py-6">
              <div class="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 flex items-start gap-3">
                <UIcon name="i-lucide-triangle-alert" class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p class="text-sm text-amber-800 dark:text-amber-200">
                  {{ adaptError }}
                </p>
              </div>
              <button
                type="button"
                @click="loadAdaptSuggestions"
                class="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brandg-600 hover:bg-brandg-700 text-white transition-colors"
              >
                <UIcon name="i-lucide-rotate-cw" class="w-4 h-4" />
                {{ t('recipeWrangler.detail.adaptation.retry') }}
              </button>
            </div>

            <!-- Result -->
            <div v-else-if="adaptResult" class="space-y-4">
              <!-- Context line -->
              <div v-if="adaptContextLine" class="rounded-lg bg-zinc-50 dark:bg-zinc-800 p-3 flex items-start gap-2">
                <UIcon name="i-lucide-crosshair" class="w-4 h-4 text-brandg-600 dark:text-brandg-400 flex-shrink-0 mt-0.5" />
                <p class="text-xs text-zinc-600 dark:text-zinc-300">
                  {{ adaptContextLine }}
                  <span v-if="adaptResult.current_nutri_score" class="ml-1">
                    {{ t('recipeWrangler.detail.adaptation.currentScore') }}
                    <span class="font-semibold">{{ formatAdaptGrade(adaptResult.current_nutri_score) }}</span>
                  </span>
                </p>
              </div>

              <!-- Empty -->
              <div v-if="!adaptResult.suggestions.length" class="py-6 text-center">
                <p class="text-sm text-zinc-500 dark:text-zinc-400">
                  {{ t('recipeWrangler.detail.adaptation.empty') }}
                </p>
              </div>

              <!-- Suggestion cards -->
              <div
                v-for="suggestion in adaptResult.suggestions"
                :key="`${suggestion.rank}-${suggestion.substitute_name || suggestion.original_ingredient}`"
                class="rounded-2xl border border-zinc-200 dark:border-zinc-700 p-4 space-y-2.5"
              >
                <p class="font-semibold text-zinc-900 dark:text-white text-sm">
                  {{ suggestion.explanation?.headline }}
                </p>

                <!-- Swap / reduce line -->
                <div v-if="suggestion.action === 'reduce'" class="text-sm text-zinc-700 dark:text-zinc-200">
                  <span class="font-medium">{{ suggestion.original_ingredient }}</span>:
                  <span class="font-mono">{{ formatNumber(suggestion.reduced_from_weight_g) }}g</span>
                  <UIcon name="i-lucide-arrow-right" class="w-3.5 h-3.5 inline mx-1 text-brandg-500" />
                  <span class="font-mono font-semibold text-brandg-700 dark:text-brandg-300">{{ formatNumber(suggestion.reduced_to_weight_g) }}g</span>
                </div>
                <div v-else class="flex items-center gap-2 text-sm min-w-0">
                  <span class="line-through text-zinc-500 dark:text-zinc-400 truncate">{{ suggestion.original_ingredient }}</span>
                  <UIcon name="i-lucide-arrow-right" class="w-4 h-4 text-brandg-500 flex-shrink-0" />
                  <span class="font-semibold text-brandg-700 dark:text-brandg-300 truncate">{{ suggestion.substitute_name }}</span>
                </div>

                <p class="text-sm text-zinc-600 dark:text-zinc-400">
                  {{ suggestion.explanation?.reason }}
                </p>

                <!-- Metric chips -->
                <div class="flex flex-wrap items-center gap-1.5">
                  <span
                    v-if="formatAdaptGrade(suggestion.simulated_nutri_score)"
                    class="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  >
                    {{ t('recipeWrangler.detail.adaptation.newScore') }}
                    <span
                      :class="['w-4 h-4 rounded-sm flex items-center justify-center text-[10px] font-bold text-white', getNutriScoreColorBg(formatAdaptGrade(suggestion.simulated_nutri_score))]"
                    >
                      {{ formatAdaptGrade(suggestion.simulated_nutri_score) }}
                    </span>
                  </span>
                  <span
                    v-if="suggestion.nutri_score_points_saved"
                    class="text-[10px] font-medium px-1.5 py-0.5 rounded bg-brandg-100 dark:bg-brandg-900/30 text-brandg-700 dark:text-brandg-300"
                  >
                    −{{ suggestion.nutri_score_points_saved }} {{ t('recipeWrangler.detail.adaptation.points') }}
                  </span>
                  <span
                    v-if="suggestion.co2e_reduction_pct"
                    class="text-[10px] font-medium px-1.5 py-0.5 rounded bg-brandg-100 dark:bg-brandg-900/30 text-brandg-700 dark:text-brandg-300"
                  >
                    −{{ formatNumber(suggestion.co2e_reduction_pct) }}% CO2e
                  </span>
                  <span
                    v-if="suggestion.reduction_pct"
                    class="text-[10px] font-medium px-1.5 py-0.5 rounded bg-brandg-100 dark:bg-brandg-900/30 text-brandg-700 dark:text-brandg-300"
                  >
                    −{{ Math.round((suggestion.reduction_pct || 0) * 100) }}%
                  </span>
                  <span
                    v-if="typeof suggestion.flavor_similarity === 'number'"
                    class="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  >
                    {{ Math.round(suggestion.flavor_similarity * 100) }}% {{ t('recipeWrangler.detail.adaptation.flavorMatch') }}
                  </span>
                </div>

                <!-- Allergen warning -->
                <p
                  v-if="suggestion.introduces_allergen"
                  class="text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5"
                >
                  <UIcon name="i-lucide-triangle-alert" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  {{ t('recipeWrangler.detail.adaptation.allergenWarning') }}
                  {{ (suggestion.new_allergens || []).join(', ') }}
                </p>

                <!-- Explanation warning -->
                <p v-if="suggestion.explanation?.warning" class="text-xs text-amber-600 dark:text-amber-400">
                  {{ suggestion.explanation.warning }}
                </p>

                <!-- LLM justification -->
                <p
                  v-if="suggestion.llm_justification"
                  class="text-xs italic text-zinc-500 dark:text-zinc-400 border-l-2 border-brandg-300 dark:border-brandg-700 pl-2"
                >
                  {{ suggestion.llm_justification }}
                </p>

                <!-- Save adapted recipe -->
                <div
                  v-if="currentMemberId"
                  class="pt-2.5 border-t border-zinc-100 dark:border-zinc-700/50 flex items-center justify-between gap-2"
                >
                  <p v-if="adaptSaveError" class="text-xs text-red-500 dark:text-red-400 truncate">
                    {{ adaptSaveError }}
                  </p>
                  <p v-else class="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                    {{ savedAdaptation
                      ? t('recipeWrangler.detail.adaptation.saveHintReplace')
                      : t('recipeWrangler.detail.adaptation.saveHint') }}
                  </p>
                  <button
                    type="button"
                    :disabled="adaptSavingRank !== null"
                    @click="saveAdaptedRecipe(suggestion)"
                    class="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brandg-600 hover:bg-brandg-700 disabled:opacity-60 text-white transition-colors"
                  >
                    <UIcon
                      :name="adaptSavingRank === suggestion.rank ? 'i-lucide-loader-2' : 'i-lucide-bookmark-plus'"
                      :class="['w-3.5 h-3.5', adaptSavingRank === suggestion.rank ? 'animate-spin' : '']"
                    />
                    {{ t('recipeWrangler.detail.adaptation.save') }}
                  </button>
                </div>
              </div>

              <p class="text-xs text-zinc-400 dark:text-zinc-500 flex items-start gap-1.5">
                <UIcon name="i-lucide-info" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                {{ t('recipeWrangler.detail.adaptation.note') }}
              </p>
            </div>
          </div>
        </template>
      </UModal>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useRecipes } from '~/composables/useRecipes'
import { useRecipeStore } from '~/stores/recipe'
import { useHouseholdStore } from '~/stores/household'
import { useAuthStore } from '~/stores/auth'
import recipeApi from '~/services/recipeApi'
import memberAdaptedRecipesApi from '~/services/memberAdaptedRecipesApi'
import type {
  PipelineTraceWeightDetail,
  Recipe,
  RecipeAdaptMode,
  RecipeAdaptSuggestion,
  RecipeAdaptSuggestionsResult,
  RecipeIngredient,
  RecipeNutrient,
  RecipeNutritionProfilingDetail,
  RecipeProfileResult,
  RecipeSubstituteResult
} from '~/services/recipeApi'
import type { AdaptedRecipeNutrition, MemberAdaptedRecipe } from '~/services/memberAdaptedRecipesApi'
import { formatDishTypeLabel, getDishTypeIcon, normalizeDishTypes } from '~/utils/dishTypes'

definePageMeta({
  middleware: ['auth', 'profile']
})
const { t } = useI18n()

// ============================================================================
// Route & Stores
// ============================================================================
const route = useRoute()
const router = useRouter()
const { currentRecipe, loading, error, fetchRecipe } = useRecipes()
const recipeStore = useRecipeStore()
const householdStore = useHouseholdStore()
const authStore = useAuthStore()

const backLink = computed(() => {
  const prev = router.options.history.state.back as string | undefined
  if (prev && prev.startsWith('/recipe-wrangler/compare')) {
    return { to: '/recipe-wrangler/compare', label: t('recipeWrangler.backToCompare') }
  }
  if (prev && prev === '/dashboard') {
    return { to: '/dashboard', label: t('recipeWrangler.backToDashboard') }
  }
  return { to: '/recipe-wrangler', label: t('recipeWrangler.backToRecipes') }
})

// ============================================================================
// State
// ============================================================================
const SUPPORTED_REGIONS = ['IE', 'HU', 'US'] as const
type SupportedRegion = typeof SUPPORTED_REGIONS[number]

const resolveRegion = (raw: string | null | undefined): SupportedRegion => {
  const upper = String(raw || '').toUpperCase() as SupportedRegion
  return SUPPORTED_REGIONS.includes(upper) ? upper : 'US'
}

const selectedRegion = ref<SupportedRegion>(
  resolveRegion(householdStore.currentHousehold?.region)
)

const checkedIngredients = ref<Record<number, boolean>>({})
const checkedInstructions = ref<Record<number, boolean>>({})
const showRadarChart = ref(false)
const showAllNutrients = ref(false)
const showNutriScoreDetails = ref(false)
const showProfilingDetails = ref(false)
const expandedIngredient = ref<number | null>(null)
const profilingLoading = ref(false)
const profilingError = ref<string | null>(null)
const regionReloading = ref(false)
const profilingResult = ref<RecipeProfileResult | null>(null)
const imageLoadFailed = ref(false)

// --- Ingredient substitution ---
const showSubstituteModal = ref(false)
const substituteLoading = ref(false)
const substituteError = ref<string | null>(null)
const substituteResult = ref<RecipeSubstituteResult | null>(null)
const substituteTarget = ref<string>('')

// --- Recipe adaptation (improvement suggestions) ---
const showAdaptModal = ref(false)
const adaptMode = ref<RecipeAdaptMode>('nutrition')
const adaptLoading = ref(false)
const adaptError = ref<string | null>(null)
const adaptResults = ref<Partial<Record<RecipeAdaptMode, RecipeAdaptSuggestionsResult>>>({})

// --- Saved adapted recipe (owner-scoped, per household member) ---
const savedAdaptation = ref<MemberAdaptedRecipe | null>(null)
const adaptSavingRank = ref<number | null>(null)
const adaptSaveError = ref<string | null>(null)
const adaptRemoveBusy = ref(false)

type NutriPointItem = {
  points: number
  max: number
  value_per_100g: number
  unit: string
}

type NutriBreakdown = {
  score: number
  negative_points: {
    total: number
    items: Record<string, NutriPointItem>
  }
  positive_points: {
    total: number
    applied_total: number
    items: Record<string, NutriPointItem>
  }
}

// ============================================================================
// Computed
// ============================================================================
const recipeId = computed(() => {
  const raw = String(route.params.id || '')
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
})
const normalizeRecipeImageUrl = (url?: string | null): string | null => {
  const normalized = String(url || '').trim()
  if (!normalized) return null
  if (normalized.startsWith('http://')) {
    return `https://${normalized.slice('http://'.length)}`
  }
  return normalized
}
const recipe = computed(() => currentRecipe.value)
const recipeImageUrl = computed(() => {
  const imageUrl = normalizeRecipeImageUrl(recipe.value?.image_url)
  if (!imageUrl || imageLoadFailed.value) return null
  return imageUrl
})
const isFavorite = computed(() => recipe.value ? recipeStore.isFavorite(recipe.value.recipe_id) : false)
const nutriBreakdown = computed<NutriBreakdown | null>(() => {
  const raw = recipe.value?.nutri_score_breakdown
  if (!raw || typeof raw !== 'object') return null
  return raw as NutriBreakdown
})
// Prefer the backend's letter grade: the numeric nutri_score is ambiguous
// (real Nutri-Score points on some paths, a 0-1 quality ordinal on others),
// so deriving the grade from it misclassifies most recipes as A/B.
const nutriScoreGrade = computed(() => getNutriScoreGrade(
  recipe.value?.nutri_score_label
  ?? recipe.value?.nutri_score_raw
  ?? recipe.value?.nutri_score
))

// --- Sustainability (kg CO2e per serving, from the stored profiling trace) ---
const sustainabilityPerServing = computed<number | null>(() => {
  const direct = toNullableNumber(recipe.value?.total_sustainability_per_serving)
  if (direct !== null) return direct
  const total = toNullableNumber(recipe.value?.total_sustainability)
  const serves = toNullableNumber(recipe.value?.serves)
  if (total !== null && serves && serves > 0) return total / serves
  return null
})

type SustainabilityLevel = {
  key: 'excellent' | 'good' | 'moderate' | 'high'
  pct: number
  barClass: string
  textClass: string
}

// Meal-footprint bands (kg CO2e per serving): <0.5 excellent, <1 good,
// <2 moderate, >=2 high. Bar fill reads as "more = better".
const sustainabilityLevel = computed<SustainabilityLevel | null>(() => {
  const kg = sustainabilityPerServing.value
  if (kg === null) return null
  if (kg < 0.5) {
    return { key: 'excellent', pct: 90, barClass: 'from-brandg-400 to-brandg-600', textClass: 'text-brandg-600 dark:text-brandg-400' }
  }
  if (kg < 1.0) {
    return { key: 'good', pct: 70, barClass: 'from-brandg-400 to-brandg-600', textClass: 'text-brandg-600 dark:text-brandg-400' }
  }
  if (kg < 2.0) {
    return { key: 'moderate', pct: 45, barClass: 'from-amber-400 to-amber-500', textClass: 'text-amber-600 dark:text-amber-400' }
  }
  return { key: 'high', pct: 20, barClass: 'from-red-400 to-red-500', textClass: 'text-red-600 dark:text-red-400' }
})
const formatPer100 = (value: number, unit: string): string => {
  const safe = Number.isFinite(value) ? value : 0
  const digits = unit === 'kJ' || unit === 'mg' ? 0 : 1
  return `${safe.toFixed(digits)} ${unit} per 100g`
}
const negativePointItems = computed(() => {
  const items = nutriBreakdown.value?.negative_points?.items || {}
  return [
    { key: 'energy', label: 'Energy', ...(items['energy'] || { points: 0, max: 10, value_per_100g: 0, unit: 'kJ' }) },
    { key: 'sugar', label: 'Sugar', ...(items['sugar'] || { points: 0, max: 10, value_per_100g: 0, unit: 'g' }) },
    { key: 'saturated_fats', label: 'Saturated fat', ...(items['saturated_fats'] || { points: 0, max: 10, value_per_100g: 0, unit: 'g' }) },
    { key: 'sodium', label: 'Sodium', ...(items['sodium'] || { points: 0, max: 10, value_per_100g: 0, unit: 'mg' }) }
  ].map((item) => ({
    ...item,
    displayValue: formatPer100(item.value_per_100g, item.unit)
  }))
})
const positivePointItems = computed(() => {
  const items = nutriBreakdown.value?.positive_points?.items || {}
  return [
    { key: 'protein', label: 'Protein', ...(items['protein'] || { points: 0, max: 5, value_per_100g: 0, unit: 'g' }) },
    { key: 'fiber', label: 'Fiber', ...(items['fiber'] || { points: 0, max: 5, value_per_100g: 0, unit: 'g' }) },
    { key: 'fruit_percentage', label: 'Fruits, vegetables, legumes & nuts', ...(items['fruit_percentage'] || { points: 0, max: 5, value_per_100g: 0, unit: '%' }) }
  ].map((item) => ({
    ...item,
    displayValue: item.unit === '%'
      ? `${Number.isFinite(item.value_per_100g) ? item.value_per_100g.toFixed(1) : '0.0'}% of recipe weight`
      : formatPer100(item.value_per_100g, item.unit)
  }))
})
const tagLabelMap: Record<string, string> = {
  dairy_free: 'Dairy Free',
  nut_free: 'Nut Free',
  gluten_free: 'Gluten Free',
  egg_free: 'Egg Free',
  soy_free: 'Soy Free',
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  pescatarian: 'Pescatarian',
  low_sodium: 'Low Sodium',
  low_sugar: 'Low Sugar',
  low_fat: 'Low Fat',
  high_protein: 'High Protein',
  high_fiber: 'High Fiber'
}
const toFriendlyTagLabel = (tag: string): string => {
  const key = tag.trim().toLowerCase()
  if (tagLabelMap[key]) return tagLabelMap[key]
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((part) => part ? `${part[0]?.toUpperCase() || ''}${part.slice(1)}` : part)
    .join(' ')
}
const recipeTags = computed<string[]>(() => {
  const raw = recipe.value?.tags
  if (!Array.isArray(raw)) return []
  const unique = new Set<string>()
  for (const tag of raw) {
    const text = String(tag || '').trim()
    if (!text) continue
    unique.add(text)
  }
  return Array.from(unique)
})
const dishTypeChips = computed(() =>
  normalizeDishTypes(recipe.value?.dish_types).map(value => ({
    value,
    label: formatDishTypeLabel(value),
    icon: getDishTypeIcon(value)
  }))
)
const displayRecipeTags = computed<Array<{ raw: string; label: string }>>(() => {
  return recipeTags.value.map((raw) => ({
    raw,
    label: toFriendlyTagLabel(raw)
  }))
})
const nutrientRows = computed<RecipeNutrient[]>(() => {
  const nutrients = recipe.value?.nutrients
  if (!Array.isArray(nutrients)) return []
  return nutrients.filter((nutrient) => nutrient && (nutrient.nutrient_name || nutrient.nutrient_code))
})
const nutrientLabelMap: Record<string, string> = {
  energy_kcal: 'Calories',
  protein_g: 'Protein',
  carbohydrate_g: 'Carbohydrates',
  carbs_g: 'Carbohydrates',
  fat_g: 'Total Fat',
  saturated_fat_g: 'Saturated Fat',
  monounsaturated_fat_g: 'Monounsaturated Fat',
  polyunsaturated_fat_g: 'Polyunsaturated Fat',
  trans_fat_g: 'Trans Fat',
  fibre_g: 'Dietary Fiber',
  fiber_g: 'Dietary Fiber',
  sugar_g: 'Total Sugars',
  sodium_mg: 'Sodium',
  potassium_mg: 'Potassium',
}
const nutrientSortOrder: Record<string, number> = {
  energy_kcal: 1,
  protein_g: 2,
  carbohydrate_g: 3,
  carbs_g: 3,
  fat_g: 4,
  saturated_fat_g: 5,
  fibre_g: 6,
  fiber_g: 6,
  sugar_g: 7,
  sodium_mg: 8,
}
const toNutrientKey = (nutrient: RecipeNutrient): string => {
  return String(nutrient.nutrient_name || nutrient.nutrient_code || '')
    .trim()
    .toLowerCase()
}
const toFriendlyNutrientLabel = (nutrient: RecipeNutrient): string => {
  const key = toNutrientKey(nutrient)
  if (nutrientLabelMap[key]) return nutrientLabelMap[key]
  const fallback = String(nutrient.nutrient_name || nutrient.nutrient_code || 'Nutrient')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return fallback
    .split(' ')
    .map((part) => part ? `${part[0]?.toUpperCase() || ''}${part.slice(1).toLowerCase()}` : part)
    .join(' ')
}
const inferNutrientUnit = (nutrient: RecipeNutrient): string | null => {
  const key = toNutrientKey(nutrient)
  if (key.endsWith('_mg')) return 'mg'
  if (key.endsWith('_g')) return 'g'
  if (key.includes('energy') || key.includes('kcal')) return 'kcal'
  return null
}
const displayNutrientRows = computed<Array<RecipeNutrient & { display_label: string }>>(() => {
  return nutrientRows.value
    .filter((nutrient) => {
      const key = toNutrientKey(nutrient)
      return key !== 'cholesterol_mg' && key !== 'cholesterol'
    })
    .map((nutrient) => ({
      ...nutrient,
      display_label: toFriendlyNutrientLabel(nutrient)
    }))
    .sort((a, b) => {
      const aOrder = nutrientSortOrder[toNutrientKey(a)] ?? 99
      const bOrder = nutrientSortOrder[toNutrientKey(b)] ?? 99
      if (aOrder !== bOrder) return aOrder - bOrder
      return String(a.display_label).localeCompare(String(b.display_label))
    })
})
const getNutrientAmountByKeys = (keys: string[]): number | null => {
  if (!keys.length) return null
  const normalizedKeys = new Set(keys.map((key) => key.trim().toLowerCase()))

  const totalsPerServing = recipe.value?.total_nutrients_per_serving
  if (totalsPerServing && typeof totalsPerServing === 'object' && !Array.isArray(totalsPerServing)) {
    for (const [rawKey, rawValue] of Object.entries(totalsPerServing)) {
      const key = String(rawKey || '').trim().toLowerCase()
      if (!normalizedKeys.has(key)) continue
      if (rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue)) {
        const dict = rawValue as Record<string, unknown>
        const nested = toNullableNumber(
          dict.value ?? dict.nutrient_value ?? dict.amount
        )
        if (nested !== null) return nested
      }
      const direct = toNullableNumber(rawValue)
      if (direct !== null) return direct
    }
  }

  const totals = recipe.value?.total_nutrients
  if (totals && typeof totals === 'object' && !Array.isArray(totals)) {
    for (const [rawKey, rawValue] of Object.entries(totals)) {
      const key = String(rawKey || '').trim().toLowerCase()
      if (!normalizedKeys.has(key)) continue
      if (rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue)) {
        const dict = rawValue as Record<string, unknown>
        const nested = toNullableNumber(
          dict.value ?? dict.nutrient_value ?? dict.amount
        )
        if (nested !== null) return nested
      }
      const direct = toNullableNumber(rawValue)
      if (direct !== null) return direct
    }
  }

  for (const nutrient of nutrientRows.value) {
    const key = toNutrientKey(nutrient)
    if (!normalizedKeys.has(key)) continue
    const value = toNullableNumber(nutrient.amount_per_serving)
    if (value !== null) return value
  }
  return null
}
const summaryCaloriesPerServing = computed<number | null>(() => {
  const direct = toNullableNumber(recipe.value?.total_kcal_per_serving)
  if (direct !== null) return direct
  return getNutrientAmountByKeys(['energy_kcal', 'energy', 'energy (kcal)', 'energy, kcal', 'calories'])
})
const summaryProteinPerServing = computed<number | null>(() => {
  const direct = toNullableNumber(recipe.value?.total_protein_g_per_serving)
  if (direct !== null) return direct
  return getNutrientAmountByKeys(['protein_g', 'protein'])
})
const summaryCarbsPerServing = computed<number | null>(() => {
  const direct = toNullableNumber(recipe.value?.total_carbs_g_per_serving)
  if (direct !== null) return direct
  return getNutrientAmountByKeys(['carbohydrate_g', 'carbs_g', 'carbohydrate', 'carbohydrate, by difference', 'carbs'])
})
const summaryFatPerServing = computed<number | null>(() => {
  const direct = toNullableNumber(recipe.value?.total_fat_g_per_serving)
  if (direct !== null) return direct
  return getNutrientAmountByKeys(['fat_g', 'fat', 'total lipid (fat)', 'total fat'])
})
const summaryFiberPerServing = computed<number | null>(() => {
  const direct = toNullableNumber(recipe.value?.total_fiber_g_per_serving)
  if (direct !== null) return direct
  return getNutrientAmountByKeys(['fibre_g', 'fiber_g', 'fiber', 'dietary fiber', 'fiber, total dietary'])
})
const summarySugarPerServing = computed<number | null>(() => {
  const direct = toNullableNumber(recipe.value?.total_sugar_g_per_serving)
  if (direct !== null) return direct
  return getNutrientAmountByKeys(['sugar_g', 'sugars, total', 'sugars, total including nlea', 'sugars, total nlea', 'sugar'])
})
const summarySodiumPerServing = computed<number | null>(() => {
  const direct = toNullableNumber(recipe.value?.total_sodium_mg_per_serving)
  if (direct !== null) return direct
  return getNutrientAmountByKeys(['sodium_mg', 'sodium, na', 'sodium'])
})
const profilingDetailRows = computed<RecipeNutritionProfilingDetail[]>(() => {
  const stored = recipe.value?.nutrition_profiling_details
  if (Array.isArray(stored) && stored.length > 0) return stored
  return []
})
const profilingIngredientRows = computed<Array<Record<string, unknown>>>(() => {
  if (profilingDetailRows.value.length > 0) {
    return profilingDetailRows.value as Array<Record<string, unknown>>
  }
  const fromTrace = profilingResult.value?.pipeline_trace?.profiling?.ingredients
  if (Array.isArray(fromTrace) && fromTrace.length > 0) return fromTrace
  const ingredients = profilingResult.value?.ingredients
  return Array.isArray(ingredients) ? ingredients : []
})
const profilingWeightDetails = computed<PipelineTraceWeightDetail[]>(() => {
  if (profilingDetailRows.value.length > 0) return []
  return profilingResult.value?.pipeline_trace?.weight_calculation?.details || []
})

// Profiling arrays arrive from the backend in a different order than
// `recipe.ingredients` (details are sorted by contribution; ingredients are
// alphabetical). Match by normalized ingredient name instead of positional
// index so each row lines up with the correct source ingredient.
const normalizeIngredientKey = (value: unknown): string =>
  String(value ?? '').trim().toLowerCase()
const profilingRowsByName = computed<Record<string, Record<string, unknown>>>(() => {
  const out: Record<string, Record<string, unknown>> = {}
  for (const row of profilingIngredientRows.value) {
    const key = normalizeIngredientKey((row as { name?: unknown; ingredient?: unknown }).name
      ?? (row as { ingredient?: unknown }).ingredient)
    if (key && !out[key]) out[key] = row
  }
  return out
})
const weightDetailsByName = computed<Record<string, PipelineTraceWeightDetail>>(() => {
  const out: Record<string, PipelineTraceWeightDetail> = {}
  for (const row of profilingWeightDetails.value) {
    const key = normalizeIngredientKey(row.name)
    if (key && !out[key]) out[key] = row
  }
  return out
})
const profilingFor = (name: string): Record<string, unknown> | undefined =>
  profilingRowsByName.value[normalizeIngredientKey(name)]
const weightDetailFor = (name: string): PipelineTraceWeightDetail | undefined =>
  weightDetailsByName.value[normalizeIngredientKey(name)]
const matchedWeightCount = computed(
  () => {
    if (profilingDetailRows.value.length > 0) {
      return profilingDetailRows.value.filter((row) => row.weight_g !== null && row.weight_g !== undefined && row.weight_g !== '').length
    }
    return profilingResult.value?.pipeline_trace?.weight_calculation?.matched_count || 0
  }
)
const unmatchedWeightCount = computed(
  () => {
    if (profilingDetailRows.value.length > 0) {
      return profilingDetailRows.value.length - matchedWeightCount.value
    }
    return profilingResult.value?.pipeline_trace?.weight_calculation?.unmatched_count || 0
  }
)

useHead({
  title: computed(() => {
    if (!recipe.value) return t('recipeWrangler.title')
    return `${recipe.value.title} - ${t('recipeWrangler.title')}`
  })
})

// ============================================================================
// Methods
// ============================================================================
const loadRecipe = async () => {
  try {
    // Reset checkboxes
    checkedIngredients.value = {}
    checkedInstructions.value = {}
    showAllNutrients.value = false
    showNutriScoreDetails.value = false
    imageLoadFailed.value = false
    // Substitution + adaptation results are region-dependent
    showSubstituteModal.value = false
    substituteResult.value = null
    substituteError.value = null
    showAdaptModal.value = false
    adaptResults.value = {}
    adaptError.value = null
    savedAdaptation.value = null
    adaptSaveError.value = null

    await fetchRecipe(recipeId.value, { region: selectedRegion.value })
    if (recipe.value) {
      recipeStore.addToRecentlyViewed(recipe.value.recipe_id)
      recipeStore.cacheRecipe(recipe.value)
      if (profilingDetailRows.value.length > 0) {
        showProfilingDetails.value = true
      }
      // Owner-scoped extras: the member's saved adaptation of this recipe,
      // and (for low Nutri-Score recipes) prefetched improvement suggestions
      // so the nudge can surface the top one.
      void loadSavedAdaptation()
      if (showImproveNudge.value) {
        void loadAdaptSuggestions()
      }
    }
  } catch (err) {
    console.error('Failed to load recipe:', err)
  }
}

const toggleFavorite = () => {
  if (recipe.value) {
    recipeStore.toggleFavorite(recipe.value.recipe_id)
  }
}

const toggleIngredient = (index: number) => {
  checkedIngredients.value[index] = !checkedIngredients.value[index]
}

const toggleInstruction = (index: number) => {
  checkedInstructions.value[index] = !checkedInstructions.value[index]
}

const toggleNutrientView = () => {
  showRadarChart.value = !showRadarChart.value
}

const changeRegion = async (region: SupportedRegion) => {
  if (region === selectedRegion.value) return
  selectedRegion.value = region
  regionReloading.value = true
  try {
    await loadRecipe()
  } finally {
    regionReloading.value = false
  }
}

const buildRecipeProfilingInput = (value: Recipe): string => {
  const title = value.title ? `${value.title}\n` : ''
  const ingredients = (value.ingredients || [])
    .map((item) => `${item.measurement || ''} ${item.name || ''}`.trim())
    .filter(Boolean)
  const instructions = (value.instructions || []).filter((step) => String(step || '').trim().length > 0)
  const serves = value.serves ? `Serves: ${value.serves}` : ''
  return [
    title.trim(),
    ingredients.length ? `Ingredients:\n${ingredients.join('\n')}` : '',
    instructions.length ? `Instructions:\n${instructions.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}` : '',
    serves
  ].filter(Boolean).join('\n\n')
}

const toggleNutritionProfilingDetails = async () => {
  showProfilingDetails.value = !showProfilingDetails.value
  if (!showProfilingDetails.value) return
  if (profilingDetailRows.value.length > 0) return
  if (profilingResult.value || profilingLoading.value) return
  if (!recipe.value) return

  profilingLoading.value = true
  profilingError.value = null
  try {
    const rawRecipe = buildRecipeProfilingInput(recipe.value)
    profilingResult.value = await recipeApi.analyzeRecipe(rawRecipe, 'US')
  } catch (err: unknown) {
    const e = err as { data?: { detail?: string }; message?: string }
    profilingError.value = String(e?.data?.detail || e?.message || 'Failed to profile nutrition details')
  } finally {
    profilingLoading.value = false
  }
}

const loadSubstitute = async () => {
  if (!recipe.value || !substituteTarget.value) return
  substituteLoading.value = true
  substituteError.value = null
  substituteResult.value = null
  try {
    substituteResult.value = await recipeApi.substituteIngredient(
      recipe.value.recipe_id,
      substituteTarget.value,
      selectedRegion.value
    )
  } catch (err: unknown) {
    const e = err as { data?: { detail?: string }, message?: string }
    substituteError.value = String(
      e?.data?.detail || e?.message || t('recipeWrangler.detail.substitution.error')
    )
  } finally {
    substituteLoading.value = false
  }
}

const openSubstituteModal = (ingredientName: string) => {
  substituteTarget.value = ingredientName
  showSubstituteModal.value = true
  void loadSubstitute()
}

const substituteProfile = computed<Record<string, unknown> | null>(() => {
  const profile = substituteResult.value?.modified_recipe_profile
  if (!profile || typeof profile !== 'object') return null
  return profile as Record<string, unknown>
})

const substituteProfileAvailable = computed(() =>
  !!substituteProfile.value
  && String(substituteProfile.value.status || '') !== 'profiling_unavailable'
)

const lookupSubstituteTotal = (metricParts: string[]): number | null => {
  const totals = substituteProfile.value?.profiling_totals
  if (!totals || typeof totals !== 'object' || Array.isArray(totals)) return null
  for (const [key, value] of Object.entries(totals as Record<string, unknown>)) {
    if (!metricParts.every(part => key.includes(part))) continue
    const parsed = toNullableNumber(value)
    if (parsed !== null) return parsed
  }
  return null
}

const substituteNutriGrade = computed<string | null>(() => {
  const ns = substituteProfile.value?.nutri_score
  if (!ns || typeof ns !== 'object' || Array.isArray(ns)) return null
  const raw = (ns as Record<string, unknown>).nutri_score
  if (!raw) return null
  return String(raw).replace('Nutriscore_', '')
})

const substituteImpactRows = computed(() => {
  if (!substituteProfileAvailable.value) return []
  const rows = [
    { key: 'calories', label: t('recipeWrangler.detail.calories'), before: summaryCaloriesPerServing.value, after: lookupSubstituteTotal(['energy_kcal', 'per_serving']), unit: 'kcal' },
    { key: 'protein', label: t('recipeWrangler.detail.protein'), before: summaryProteinPerServing.value, after: lookupSubstituteTotal(['protein_g', 'per_serving']), unit: 'g' },
    { key: 'carbs', label: t('recipeWrangler.detail.carbs'), before: summaryCarbsPerServing.value, after: lookupSubstituteTotal(['carbohydrate_g', 'per_serving']), unit: 'g' },
    { key: 'fat', label: t('recipeWrangler.detail.fat'), before: summaryFatPerServing.value, after: lookupSubstituteTotal(['fat_g', 'per_serving']), unit: 'g' }
  ]
  return rows.filter(row => row.after !== null)
})

const otherSubstituteCandidates = computed<string[]>(() => {
  const best = String(substituteResult.value?.substitute || '').trim().toLowerCase()
  const seen = new Set<string>()
  const out: string[] = []
  for (const candidate of substituteResult.value?.candidates || []) {
    const text = String(candidate || '').trim()
    const key = text.toLowerCase()
    if (!text || key === best || seen.has(key)) continue
    seen.add(key)
    out.push(text)
    if (out.length >= 6) break
  }
  return out
})

const substitutionSourceLabel = computed(() => {
  const source = substituteResult.value?.substitution_source
  if (source === 'graph_direct') return t('recipeWrangler.detail.substitution.sourceCurated')
  if (source === 'foodon_taxonomy') return t('recipeWrangler.detail.substitution.sourceTaxonomy')
  return String(source || '')
})

const adaptModes = computed(() => ([
  { value: 'nutrition' as RecipeAdaptMode, label: t('recipeWrangler.detail.adaptation.modeNutrition'), icon: 'i-lucide-heart-pulse' },
  { value: 'sustainability' as RecipeAdaptMode, label: t('recipeWrangler.detail.adaptation.modeSustainability'), icon: 'i-lucide-leaf' },
  { value: 'reduce_quantity' as RecipeAdaptMode, label: t('recipeWrangler.detail.adaptation.modeReduce'), icon: 'i-lucide-minimize-2' }
]))

const adaptResult = computed(() => adaptResults.value[adaptMode.value] || null)

const formatAdaptGrade = (raw?: string | null): string =>
  String(raw || '').replace('Nutriscore_', '')

const adaptContextLine = computed(() => {
  const result = adaptResult.value
  if (!result?.offending_ingredient) return ''
  const pct = formatNumber(result.offending_ingredient_contribution_pct)
  if (result.mode === 'sustainability') {
    return t('recipeWrangler.detail.adaptation.contextSustainability', {
      ingredient: result.offending_ingredient,
      pct
    })
  }
  return t('recipeWrangler.detail.adaptation.contextNutrition', {
    ingredient: result.offending_ingredient,
    pct,
    nutrient: result.target_nutrient_label || result.target_nutrient || t('recipeWrangler.detail.adaptation.targetFallback')
  })
})

const loadAdaptSuggestions = async () => {
  if (!recipe.value) return
  const mode = adaptMode.value
  adaptLoading.value = true
  adaptError.value = null
  try {
    const result = await recipeApi.getAdaptSuggestions(recipe.value.recipe_id, {
      region: selectedRegion.value,
      mode,
      maxSwaps: 3,
      useLlm: true
    })
    adaptResults.value = { ...adaptResults.value, [mode]: result }
  } catch (err: unknown) {
    const e = err as { data?: { detail?: string }, message?: string }
    adaptError.value = String(
      e?.data?.detail || e?.message || t('recipeWrangler.detail.adaptation.error')
    )
  } finally {
    adaptLoading.value = false
  }
}

const openAdaptModal = () => {
  showAdaptModal.value = true
  if (!adaptResult.value && !adaptLoading.value) void loadAdaptSuggestions()
}

const setAdaptMode = (mode: RecipeAdaptMode) => {
  if (adaptLoading.value || mode === adaptMode.value) return
  adaptMode.value = mode
  adaptError.value = null
  if (!adaptResults.value[mode]) void loadAdaptSuggestions()
}

// --- Improve nudge (low Nutri-Score recipes) ---
const showImproveNudge = computed(() =>
  nutriScoreGrade.value === 'D' || nutriScoreGrade.value === 'E'
)

const nudgeTopSuggestion = computed(() => {
  const top = adaptResults.value.nutrition?.suggestions?.[0]
  const headline = top?.explanation?.headline || ''
  if (!headline) return ''
  const grade = formatAdaptGrade(top?.simulated_nutri_score)
  if (grade) {
    return t('recipeWrangler.detail.adaptation.nudgeSuggestion', { headline, grade })
  }
  return headline
})

// --- Save / remove the adapted recipe (owner-scoped) ---
const currentMemberId = computed(() => householdStore.currentMember?.id || null)

const loadSavedAdaptation = async () => {
  const memberId = currentMemberId.value
  if (!memberId || !recipe.value) return
  try {
    savedAdaptation.value = await memberAdaptedRecipesApi.getAdaptedRecipe(
      memberId, recipe.value.recipe_id
    )
  } catch {
    savedAdaptation.value = null // 404 — nothing saved for this recipe
  }
}

const buildAdaptedIngredients = (suggestion: RecipeAdaptSuggestion): RecipeIngredient[] => {
  const target = String(suggestion.original_ingredient || '').trim().toLowerCase()
  return (recipe.value?.ingredients || []).map((ing) => {
    if (String(ing.name || '').trim().toLowerCase() !== target) {
      return { name: ing.name, measurement: ing.measurement }
    }
    if (suggestion.action === 'reduce' && suggestion.reduced_to_weight_g) {
      return { name: ing.name, measurement: `${formatNumber(suggestion.reduced_to_weight_g)} g` }
    }
    if (suggestion.substitute_name) {
      return { name: suggestion.substitute_name, measurement: ing.measurement }
    }
    return { name: ing.name, measurement: ing.measurement }
  })
}

const saveAdaptedRecipe = async (suggestion: RecipeAdaptSuggestion) => {
  const memberId = currentMemberId.value
  if (!memberId || !recipe.value || adaptSavingRank.value !== null) return
  adaptSaveError.value = null
  adaptSavingRank.value = suggestion.rank
  try {
    // Post-swap nutrition in the shape FoodChat meal cards consume. Swaps get
    // exact totals from the simulate endpoint; on failure (or for 'reduce')
    // fall back to the suggestion's own simulated grade.
    let nutrition: AdaptedRecipeNutrition = {
      nutri_score_label: formatAdaptGrade(suggestion.simulated_nutri_score) || null
    }
    let simulation: Record<string, unknown> | null = null
    if (suggestion.action !== 'reduce' && suggestion.substitute_name) {
      try {
        simulation = await recipeApi.adaptSimulate(recipe.value.recipe_id, {
          region: selectedRegion.value,
          originalIngredient: suggestion.original_ingredient,
          substituteIngredient: suggestion.substitute_name
        }) as Record<string, unknown>
        const totals = (simulation.simulated_total_nutrients_per_serving || {}) as Record<string, unknown>
        nutrition = {
          kcal: toNullableNumber(totals.energy_kcal),
          protein_g: toNullableNumber(totals.protein_g),
          carbs_g: toNullableNumber(totals.carbs_g),
          fat_g: toNullableNumber(totals.fat_g),
          nutri_score_label: formatAdaptGrade(String(simulation.simulated_nutri_score || ''))
            || nutrition.nutri_score_label
        }
      } catch {
        simulation = null
      }
    }

    const title = `${recipe.value.title} ${t('recipeWrangler.detail.adaptation.adaptedSuffix')}`
    savedAdaptation.value = await memberAdaptedRecipesApi.saveAdaptedRecipe(
      memberId,
      recipe.value.recipe_id,
      title,
      {
        mode: adaptResult.value?.mode || adaptMode.value,
        action: suggestion.action,
        original_ingredient: suggestion.original_ingredient,
        substitute_ingredient: suggestion.substitute_name || null,
        reduction_pct: suggestion.reduction_pct ?? null,
        ingredients: buildAdaptedIngredients(suggestion),
        nutrition,
        region: selectedRegion.value,
        suggestion: {
          headline: suggestion.explanation?.headline || '',
          reason: suggestion.explanation?.reason || ''
        },
        base: {
          title: recipe.value.title,
          image_url: recipe.value.image_url,
          nutri_score_label: nutriScoreGrade.value || null
        }
      }
    )
  } catch (err: unknown) {
    const e = err as { message?: string }
    adaptSaveError.value = e?.message || t('recipeWrangler.detail.adaptation.saveError')
  } finally {
    adaptSavingRank.value = null
  }
}

const removeAdaptedRecipe = async () => {
  const memberId = currentMemberId.value
  if (!memberId || !recipe.value || adaptRemoveBusy.value) return
  adaptRemoveBusy.value = true
  try {
    await memberAdaptedRecipesApi.removeAdaptedRecipe(memberId, recipe.value.recipe_id)
    savedAdaptation.value = null
  } catch (err) {
    console.error('Failed to remove adapted recipe:', err)
  } finally {
    adaptRemoveBusy.value = false
  }
}

const toNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

const toNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    const parsed = Number(trimmed)
    if (Number.isFinite(parsed)) return parsed
    const match = trimmed.match(/-?\d+(?:\.\d+)?/)
    if (match) {
      const fromToken = Number(match[0])
      if (Number.isFinite(fromToken)) return fromToken
    }
  }
  return null
}

const formatNumber = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '0'
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return '0'
  return n.toFixed(2)
}

const formatMetric = (value: unknown, digits: number): string => {
  if (value === null || value === undefined || value === '') return '-'
  return toNumber(value).toFixed(digits)
}

const formatMetricWithUnit = (value: unknown, digits: number, unit: string): string => {
  const formatted = formatMetric(value, digits)
  if (formatted === '-') return '—'
  return `${formatted}${unit}`
}

const formatNutrientAmount = (
  value: unknown,
  unit?: string | null,
  nutrient?: RecipeNutrient
): string => {
  if (value === null || value === undefined || value === '') return '—'
  const amount = toNumber(value)
  const formatted = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2)
  const effectiveUnit = unit || (nutrient ? inferNutrientUnit(nutrient) : null)
  return effectiveUnit ? `${formatted} ${effectiveUnit}` : formatted
}

const getWeightSourceLabel = (matchType?: string | null): string => {
  const normalized = String(matchType || '').toLowerCase()
  if (!normalized) return 'N/A'
  if (normalized.includes('direct') || normalized.includes('portion')) return 'USDA portion table'
  if (normalized.includes('embedding')) return 'USDA embedding match'
  if (normalized.includes('llm')) return 'AI Generated (LLM Fallback)'
  if (normalized.includes('density')) return 'Density fallback'
  return matchType || 'N/A'
}

const getMatchSourceIcon = (matchType?: string | null): string => {
  const normalized = String(matchType || '').toLowerCase()
  if (normalized.includes('direct') || normalized.includes('portion')) return 'i-lucide-database'
  if (normalized.includes('embedding')) return 'i-lucide-sparkles'
  if (normalized.includes('llm')) return 'i-lucide-bot'
  if (normalized.includes('density')) return 'i-lucide-flask-conical'
  return 'i-lucide-circle-help'
}

const getMatchSourceStyle = (matchType?: string | null): string => {
  const normalized = String(matchType || '').toLowerCase()
  if (normalized.includes('direct') || normalized.includes('portion'))
    return 'bg-brandg-50 dark:bg-brandg-900/30 text-brandg-700 dark:text-brandg-300 border-brandg-200 dark:border-brandg-700'
  if (normalized.includes('embedding'))
    return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700'
  if (normalized.includes('llm'))
    return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700'
  if (normalized.includes('density'))
    return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700'
  return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
}

const formatNutritionSourceLabel = (source?: unknown): string => {
  const text = String(source || '').trim()
  if (!text) return 'USDA FoodData Central'
  const normalized = text.toLowerCase()
  if (
    normalized.includes('groq llm fallback') ||
    normalized.includes('groq_llm_fallback') ||
    normalized.includes('usda_llm_fallback') ||
    normalized.includes('llm_fallback')
  ) {
    return 'USDA Nutrients (AI Generated (LLM Fallback))'
  }
  return text.replace(/groq\s+llm\s+fallback/gi, 'AI Generated (LLM Fallback)')
}

const getNutriScoreColorBg = (grade: string): string => {
  const colors = {
    A: 'bg-[#038141]', // Dark green (official Nutri-Score color)
    B: 'bg-[#85BB2F]', // Light green
    C: 'bg-[#FECB02]', // Yellow
    D: 'bg-[#EE8100]', // Orange
    E: 'bg-[#E63E11]' // Red
  }
  return colors[grade as keyof typeof colors] || 'bg-zinc-400'
}

const getNutriScoreArrowColor = (grade: string): string => {
  const colors = {
    A: 'border-t-[#038141]',
    B: 'border-t-[#85BB2F]',
    C: 'border-t-[#FECB02]',
    D: 'border-t-[#EE8100]',
    E: 'border-t-[#E63E11]'
  }
  return colors[grade as keyof typeof colors] || 'border-t-zinc-400'
}

const getNutriScoreDescription = (grade: string): string => {
  const descriptions: Record<string, string> = {
    A: t('recipeWrangler.detail.nutriScoreDescriptions.A'),
    B: t('recipeWrangler.detail.nutriScoreDescriptions.B'),
    C: t('recipeWrangler.detail.nutriScoreDescriptions.C'),
    D: t('recipeWrangler.detail.nutriScoreDescriptions.D'),
    E: t('recipeWrangler.detail.nutriScoreDescriptions.E')
  }
  return descriptions[grade] || t('recipeWrangler.detail.nutriScoreDescriptions.unknown')
}

const getNutriScoreTooltip = (grade: string): string => {
  const tooltips: Record<string, string> = {
    A: t('recipeWrangler.detail.nutriScoreTooltips.A'),
    B: t('recipeWrangler.detail.nutriScoreTooltips.B'),
    C: t('recipeWrangler.detail.nutriScoreTooltips.C'),
    D: t('recipeWrangler.detail.nutriScoreTooltips.D'),
    E: t('recipeWrangler.detail.nutriScoreTooltips.E')
  }
  return tooltips[grade] || t('recipeWrangler.detail.nutriScoreTooltips.unknown')
}

const handleImageError = (event: Event) => {
  event.preventDefault()
  imageLoadFailed.value = true
}

// ============================================================================
// Lifecycle
// ============================================================================
onMounted(async () => {
  recipeStore.initialize()
  try {
    await householdStore.initialize()
    selectedRegion.value = resolveRegion(householdStore.currentHousehold?.region)
  } catch {
    // fall back to default US
  }
  loadRecipe()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');

@font-face {
  font-family: 'ClaudeDisplay';
  src: url('https://assets-proxy.anthropic.com/claude-ai/v2/assets/v1/c66fc489e-C-BHYa_K.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

.font-serif {
  font-family: 'Cormorant Garamond', Georgia, serif;
}

.font-claude {
  font-family: 'ClaudeDisplay', 'Cormorant Garamond', Georgia, serif;
  font-weight: normal;
}
</style>
