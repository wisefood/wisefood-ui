<template>
  <div class="min-h-screen bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <!-- Header -->
    <div class="border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div class="flex items-center justify-between">
          <NuxtLink
            to="/recipe-wrangler"
            class="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-brandg-600 dark:hover:text-brandg-400 transition-colors"
          >
            <UIcon name="i-lucide-arrow-left" class="w-5 h-5" />
            <span class="text-sm font-medium">Back to Recipes</span>
          </NuxtLink>
          <button
            v-if="recipe"
            @click="toggleFavorite"
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all"
          >
            <UIcon
              :name="isFavorite ? 'i-lucide-heart' : 'i-lucide-heart'"
              :class="[
                'w-5 h-5 transition-colors',
                isFavorite ? 'text-red-500 fill-red-500' : 'text-zinc-600 dark:text-zinc-300'
              ]"
            />
            <span class="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              {{ isFavorite ? 'Saved' : 'Save' }}
            </span>
          </button>
        </div>
        <div class="mt-3 sm:mt-4">
          <h1 class="text-2xl sm:text-3xl md:text-4xl font-light text-zinc-900 dark:text-white tracking-tight">
            <span class="font-serif italic text-brandg-500 dark:text-brandg-400 text-3xl sm:text-4xl md:text-5xl">RecipeWrangler</span>
          </h1>
          <p class="mt-2 text-sm sm:text-base text-zinc-600 dark:text-zinc-300 font-light">
            Discover personalized recipes tailored to your nutritional goals
          </p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
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
    <div v-else-if="error" class="max-w-5xl mx-auto px-4 sm:px-6 py-12 text-center">
      <UIcon name="i-lucide-alert-circle" class="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h2 class="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Failed to load recipe</h2>
      <p class="text-zinc-600 dark:text-zinc-400 mb-6">{{ error }}</p>
      <UButton @click="loadRecipe" color="primary">
        Try Again
      </UButton>
    </div>

    <!-- Recipe Content -->
    <main v-else-if="recipe" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
      <!-- Hero Section with Image -->
      <div class="mb-8 sm:mb-10">
        <!-- Image -->
        <div v-if="recipe.image_url" class="relative aspect-[16/7] sm:aspect-[16/6] rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-xl mb-6">
          <img
            :src="recipe.image_url"
            :alt="recipe.title"
            class="w-full h-full object-cover"
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
                <span class="text-xs sm:text-sm font-medium">{{ recipe.duration }} min</span>
              </div>
              <div v-if="recipe.serves" class="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <UIcon name="i-lucide-users" class="w-4 h-4" />
                <span class="text-xs sm:text-sm font-medium">{{ recipe.serves }} {{ recipe.serves === 1 ? 'serving' : 'servings' }}</span>
              </div>
              <div v-if="recipe.source" class="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <UIcon name="i-lucide-database" class="w-4 h-4" />
                <span class="text-xs sm:text-sm font-medium">Source: {{ recipe.source }}</span>
              </div>
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
              <span class="text-xs sm:text-sm font-medium">{{ recipe.duration }} min</span>
            </div>
            <div v-if="recipe.serves" class="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
              <UIcon name="i-lucide-users" class="w-4 h-4 text-brandg-600 dark:text-brandg-400" />
              <span class="text-xs sm:text-sm font-medium">{{ recipe.serves }} {{ recipe.serves === 1 ? 'serving' : 'servings' }}</span>
            </div>
            <div v-if="recipe.source" class="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
              <UIcon name="i-lucide-database" class="w-4 h-4 text-brandg-600 dark:text-brandg-400" />
              <span class="text-xs sm:text-sm font-medium">Source: {{ recipe.source }}</span>
            </div>
            <div class="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
              <UIcon name="i-lucide-award" class="w-4 h-4 text-brandg-600 dark:text-brandg-400" />
              <span class="text-xs sm:text-sm font-medium">Nutri-Score {{ getNutriScoreGrade(toNumber(recipe.nutri_score)) }}</span>
            </div>
          </div>
        </div>

        <div v-if="displayRecipeTags.length" class="flex flex-wrap items-center gap-2 mt-2">
          <span class="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Tags</span>
          <span
            v-for="(tag, idx) in displayRecipeTags"
            :key="`tag-${tag.raw}-${idx}`"
            class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-brandg-100/70 dark:bg-brandg-900/40 text-brandg-800 dark:text-brandg-200 border border-brandg-200 dark:border-brandg-700"
          >
            {{ tag.label }}
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <!-- Main Content (Left Column) -->
        <div class="lg:col-span-2 space-y-10 sm:space-y-12">

          <!-- Nutrition Information -->
          <section class="bg-white dark:bg-zinc-800 rounded-3xl p-8 sm:p-10 border border-zinc-200 dark:border-zinc-700 shadow-lg">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-3xl font-serif font-semibold text-zinc-900 dark:text-white flex items-center gap-3">
                <UIcon name="i-lucide-activity" class="w-7 h-7 text-brandg-600 dark:text-brandg-400" />
                Nutritional Information
              </h2>
              <button
                @click="toggleNutrientView"
                class="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brandg-50 to-brandg-100 dark:from-brandg-900/30 dark:to-brandg-800/30 border border-brandg-200 dark:border-brandg-700 hover:from-brandg-100 hover:to-brandg-200 dark:hover:from-brandg-900/50 dark:hover:to-brandg-800/50 transition-all group"
              >
                <UIcon
                  :name="showRadarChart ? 'i-lucide-layout-grid' : 'i-lucide-radar'"
                  class="w-5 h-5 text-brandg-600 dark:text-brandg-400 group-hover:scale-110 transition-transform"
                />
                <span class="text-sm font-medium text-brandg-700 dark:text-brandg-300">
                  {{ showRadarChart ? 'Grid View' : 'Chart View' }}
                </span>
              </button>
            </div>
            <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-8">Per serving · <span class="italic">Based on the USDA Food Composition Table</span></p>
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
                <div v-if="!showRadarChart" class="space-y-8">
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                    <div class="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-800 hover:shadow-md transition-shadow">
                      <div class="flex items-center gap-2 mb-3">
                        <UIcon name="i-lucide-flame" class="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        <p class="text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">Calories</p>
                      </div>
                      <p class="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white">
                        {{ formatMetric(summaryCaloriesPerServing, 0) }}
                      </p>
                    </div>

                    <div class="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow">
                      <div class="flex items-center gap-2 mb-3">
                        <UIcon name="i-lucide-dumbbell" class="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        <p class="text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">Protein</p>
                      </div>
                      <p class="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white">
                        {{ formatMetricWithUnit(summaryProteinPerServing, 1, 'g') }}
                      </p>
                    </div>

                    <div class="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 hover:shadow-md transition-shadow">
                      <div class="flex items-center gap-2 mb-3">
                        <UIcon name="i-lucide-wheat" class="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        <p class="text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">Carbs</p>
                      </div>
                      <p class="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white">
                        {{ formatMetricWithUnit(summaryCarbsPerServing, 1, 'g') }}
                      </p>
                    </div>

                    <div class="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800 hover:shadow-md transition-shadow">
                      <div class="flex items-center gap-2 mb-3">
                        <UIcon name="i-lucide-droplet" class="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        <p class="text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">Fat</p>
                      </div>
                      <p class="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white">
                        {{ formatMetricWithUnit(summaryFatPerServing, 1, 'g') }}
                      </p>
                    </div>
                  </div>

                  <!-- Additional Nutrition -->
                  <div class="pt-8 border-t border-zinc-200 dark:border-zinc-700">
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div class="rounded-xl border border-emerald-200/80 dark:border-emerald-800/70 bg-emerald-50/70 dark:bg-emerald-900/15 p-4">
                        <div class="flex items-center gap-2 mb-2">
                          <UIcon name="i-lucide-leaf" class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <p class="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">Fiber</p>
                        </div>
                        <p class="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                          {{ formatMetricWithUnit(summaryFiberPerServing, 1, 'g') }}
                        </p>
                      </div>
                      <div class="rounded-xl border border-pink-200/80 dark:border-pink-800/70 bg-pink-50/70 dark:bg-pink-900/15 p-4">
                        <div class="flex items-center gap-2 mb-2">
                          <UIcon name="i-lucide-candy" class="w-4 h-4 text-pink-600 dark:text-pink-400" />
                          <p class="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">Sugar</p>
                        </div>
                        <p class="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                          {{ formatMetricWithUnit(summarySugarPerServing, 1, 'g') }}
                        </p>
                      </div>
                      <div class="rounded-xl border border-cyan-200/80 dark:border-cyan-800/70 bg-cyan-50/70 dark:bg-cyan-900/15 p-4">
                        <div class="flex items-center gap-2 mb-2">
                          <UIcon name="i-lucide-droplets" class="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                          <p class="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">Sodium</p>
                        </div>
                        <p class="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                          {{ formatMetricWithUnit(summarySodiumPerServing, 0, 'mg') }}
                        </p>
                      </div>
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
                type="button"
                @click="toggleNutritionProfilingDetails"
                :disabled="profilingLoading"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <UIcon
                  :name="profilingLoading ? 'i-lucide-loader-2' : 'i-lucide-calculator'"
                  :class="['w-4 h-4', profilingLoading ? 'animate-spin' : '']"
                />
                <span>{{ showProfilingDetails ? 'Hide Nutrition Profiling Details' : 'Nutrition Profiling Details' }}</span>
              </button>
              <p
                v-if="profilingError"
                class="mt-2 text-xs text-red-600 dark:text-red-400"
              >
                {{ profilingError }}
              </p>
            </div>

            <div
              v-if="showProfilingDetails && (profilingIngredientRows.length || profilingWeightDetails.length)"
              class="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-700"
            >
              <div class="flex flex-wrap items-center gap-4 mb-4">
                <h3 class="text-lg font-semibold text-zinc-900 dark:text-white">
                  Nutrition Profiling Calculation Details
                </h3>
                <p class="text-xs text-zinc-600 dark:text-zinc-300">
                  Weight matched: {{ matchedWeightCount }} | Unmatched: {{ unmatchedWeightCount }}
                </p>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div
                  v-for="(item, idx) in profilingIngredientRows"
                  :key="`${item.ingredient || item.name || 'ingredient'}-${idx}`"
                  class="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 bg-zinc-50 dark:bg-zinc-800/40"
                >
                  <p class="text-sm font-semibold text-zinc-900 dark:text-white">
                    {{ item.ingredient || item.name || 'Unknown ingredient' }}
                  </p>
                  <p class="text-xs text-zinc-600 dark:text-zinc-300 mt-1">
                    Quantity parsed: {{ item.parsed_quantity || profilingWeightDetails[idx]?.parsed_quantity || 'N/A' }}
                    {{ item.parsed_unit || profilingWeightDetails[idx]?.parsed_unit || '' }}
                    <span v-if="item.measurement_raw || profilingWeightDetails[idx]?.measurement_raw">
                      (raw: {{ item.measurement_raw || profilingWeightDetails[idx]?.measurement_raw }})
                    </span>
                  </p>
                  <p class="text-xs text-zinc-600 dark:text-zinc-300">
                    Weight used: {{ formatNumber(item.weight_g || profilingWeightDetails[idx]?.weight_grams) }} g
                  </p>
                  <p class="text-xs text-zinc-600 dark:text-zinc-300">
                    Weight match type/source:
                    {{ getWeightSourceLabel(item.weight_source || item.nutrition_match_source || profilingWeightDetails[idx]?.match_type) }}
                    <span v-if="item.canonical_food_id || profilingWeightDetails[idx]?.usda_id">
                      (USDA ID: {{ item.canonical_food_id || profilingWeightDetails[idx]?.usda_id }})
                    </span>
                  </p>
                  <p class="text-xs text-zinc-600 dark:text-zinc-300">
                    Matched nutrition ingredient: {{ item.matched_nutritional_ingredient || item.weight_match || 'N/A' }}
                  </p>
                  <p class="text-xs text-zinc-600 dark:text-zinc-300">
                    Nutrition source: {{ formatNutritionSourceLabel(item.nutrition_source || item.source_nutrition || item.source) }}
                  </p>
                  <p
                    v-if="item.similarity !== null && item.similarity !== undefined"
                    class="text-xs text-zinc-600 dark:text-zinc-300"
                  >
                    Match similarity: {{ formatNumber(item.similarity) }}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <!-- Instructions -->
          <section class="bg-white dark:bg-zinc-800 rounded-3xl p-8 sm:p-10 border border-zinc-200 dark:border-zinc-700 shadow-lg">
            <h2 class="text-3xl font-serif font-semibold text-zinc-900 dark:text-white mb-8 flex items-center gap-3">
              <UIcon name="i-lucide-chef-hat" class="w-7 h-7 text-brandg-600 dark:text-brandg-400" />
              Instructions
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
        <div class="space-y-8">
          <!-- Nutri-Score Display -->
          <section class="bg-white dark:bg-zinc-800 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-700 shadow-lg relative">
            <h3 class="text-xl font-semibold text-zinc-900 dark:text-white mb-6 flex items-center gap-3">
              <UIcon name="i-lucide-award" class="w-6 h-6 text-brandg-600 dark:text-brandg-400" />
              Nutri-Score
            </h3>

            <!-- Nutri-Score Label (Official Design) -->
            <div class="flex flex-col items-center">
              <p class="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Nutritional Quality</p>
              <div class="flex gap-1 relative">
                <div
                  v-for="(grade, idx) in ['A', 'B', 'C', 'D', 'E']"
                  :key="grade"
                  :class="[
                    'relative flex items-center justify-center font-black text-white transition-all',
                    getNutriScoreGrade(toNumber(recipe.nutri_score)) === grade
                      ? 'w-16 h-20 text-3xl z-10'
                      : 'w-12 h-16 text-xl opacity-50',
                    idx === 0 ? 'rounded-l-full' : '',
                    idx === 4 ? 'rounded-r-full' : '',
                    getNutriScoreColorBg(grade)
                  ]"
                >
                  <span class="relative z-10">{{ grade }}</span>
                  <!-- Arrow pointer for active grade -->
                  <div
                    v-if="getNutriScoreGrade(toNumber(recipe.nutri_score)) === grade"
                    :class="[
                      'absolute -bottom-3 w-0 h-0',
                      'border-l-[12px] border-l-transparent',
                      'border-r-[12px] border-r-transparent',
                      'border-t-[12px]',
                      getNutriScoreArrowColor(grade),
                      // Adjust position for edge grades (A and E)
                      idx === 0 ? 'left-1/2 translate-x-1' : '',
                      idx === 4 ? 'right-1/2 -translate-x-1' : '',
                      idx !== 0 && idx !== 4 ? 'left-1/2 -translate-x-1/2' : ''
                    ]"
                  ></div>
                </div>
              </div>
              <p class="text-sm text-zinc-600 dark:text-zinc-400 mt-6 text-center">
                {{ getNutriScoreDescription(getNutriScoreGrade(toNumber(recipe.nutri_score))) }}
              </p>
              <button
                type="button"
                @click="showNutriScoreDetails = true"
                class="mt-5 inline-flex items-center gap-2 text-sm font-medium text-brandg-700 dark:text-brandg-300 hover:text-brandg-800 dark:hover:text-brandg-200"
              >
                <UIcon name="i-lucide-circle-help" class="w-4 h-4" />
                <span>How was this score calculated?</span>
              </button>
            </div>
          </section>

          <!-- Environmental Impact -->
          <section class="bg-gradient-to-br from-brandg-50 to-brandg-100 dark:from-brandg-900/20 dark:to-brandg-800/20 rounded-3xl p-8 border border-brandg-200 dark:border-brandg-800 shadow-lg relative">
            <h3 class="text-xl font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-3">
              <UIcon name="i-lucide-leaf" class="w-6 h-6 text-brandg-600 dark:text-brandg-400" />
              Environmental Impact
            </h3>
            <p class="text-sm text-zinc-600 dark:text-zinc-300 mb-6">
              Sustainability score based on ingredient sourcing and preparation methods.
            </p>
            <div class="flex items-center gap-3">
              <div class="flex-1 h-3 bg-brandg-200 dark:bg-brandg-900/50 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-brandg-500 to-brandg-600 dark:from-brandg-600 dark:to-brandg-700 rounded-full" style="width: 75%"></div>
              </div>
              <span class="text-base font-bold text-brandg-700 dark:text-brandg-400">Good</span>
            </div>
          </section>

          <!-- Ingredients -->
          <section class="bg-white dark:bg-zinc-800 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-700 shadow-lg sticky top-24 z-0">
            <h2 class="text-2xl font-serif font-semibold text-zinc-900 dark:text-white mb-6 flex items-center gap-3">
              <UIcon name="i-lucide-shopping-basket" class="w-6 h-6 text-brandg-600 dark:text-brandg-400" />
              Ingredients
            </h2>

            <ul class="space-y-4">
              <li
                v-for="(ingredient, index) in recipe.ingredients"
                :key="index"
                @click="toggleIngredient(index)"
                class="flex items-start gap-4 group cursor-pointer"
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
                <div class="flex-1">
                  <p :class="[
                    'font-medium text-base transition-all',
                    checkedIngredients[index]
                      ? 'line-through text-zinc-400 dark:text-zinc-600'
                      : 'text-zinc-900 dark:text-white'
                  ]">
                    {{ ingredient.name }}
                  </p>
                  <p v-if="ingredient.measurement" :class="[
                    'text-sm mt-1 transition-all',
                    checkedIngredients[index]
                      ? 'line-through text-zinc-400 dark:text-zinc-600'
                      : 'text-zinc-500 dark:text-zinc-400'
                  ]">
                    {{ ingredient.measurement }}
                  </p>
                </div>
              </li>
            </ul>
          </section>
        </div>
      </div>

      <UModal v-model:open="showNutriScoreDetails" :ui="{ width: 'max-w-3xl' }">
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
                {{ getNutriScoreGrade(toNumber(recipe?.nutri_score)) }}
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
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useRecipes } from '~/composables/useRecipes'
import { useRecipeStore } from '~/stores/recipe'
import recipeApi from '~/services/recipeApi'
import type {
  PipelineTraceWeightDetail,
  Recipe,
  RecipeNutrient,
  RecipeNutritionProfilingDetail,
  RecipeProfileResult
} from '~/services/recipeApi'

definePageMeta({
  middleware: ['auth', 'profile']
})

// ============================================================================
// Route & Stores
// ============================================================================
const route = useRoute()
const { currentRecipe, loading, error, fetchRecipe } = useRecipes()
const recipeStore = useRecipeStore()

// ============================================================================
// State
// ============================================================================
const checkedIngredients = ref<Record<number, boolean>>({})
const checkedInstructions = ref<Record<number, boolean>>({})
const showRadarChart = ref(false)
const showAllNutrients = ref(false)
const showNutriScoreDetails = ref(false)
const showProfilingDetails = ref(false)
const profilingLoading = ref(false)
const profilingError = ref<string | null>(null)
const profilingResult = ref<RecipeProfileResult | null>(null)

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
const recipe = computed(() => currentRecipe.value)
const isFavorite = computed(() => recipe.value ? recipeStore.isFavorite(recipe.value.recipe_id) : false)
const nutriBreakdown = computed<NutriBreakdown | null>(() => {
  const raw = recipe.value?.nutri_score_breakdown
  if (!raw || typeof raw !== 'object') return null
  return raw as NutriBreakdown
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

    await fetchRecipe(recipeId.value)
    if (recipe.value) {
      recipeStore.addToRecentlyViewed(recipe.value.recipe_id)
      recipeStore.cacheRecipe(recipe.value)

      // Set page title
      useHead({
        title: `${recipe.value.title} - RecipeWrangler`
      })
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

const getNutriScoreGrade = (score: number): string => {
  if (score <= 0) return 'A'
  if (score <= 2) return 'B'
  if (score <= 10) return 'C'
  if (score <= 18) return 'D'
  return 'E'
}

const getNutriScoreColorBg = (grade: string): string => {
  const colors = {
    'A': 'bg-[#038141]',  // Dark green (official Nutri-Score color)
    'B': 'bg-[#85BB2F]',  // Light green
    'C': 'bg-[#FECB02]',  // Yellow
    'D': 'bg-[#EE8100]',  // Orange
    'E': 'bg-[#E63E11]'   // Red
  }
  return colors[grade as keyof typeof colors] || 'bg-zinc-400'
}

const getNutriScoreArrowColor = (grade: string): string => {
  const colors = {
    'A': 'border-t-[#038141]',
    'B': 'border-t-[#85BB2F]',
    'C': 'border-t-[#FECB02]',
    'D': 'border-t-[#EE8100]',
    'E': 'border-t-[#E63E11]'
  }
  return colors[grade as keyof typeof colors] || 'border-t-zinc-400'
}

const getNutriScoreDescription = (grade: string): string => {
  const descriptions = {
    'A': 'Excellent nutritional quality',
    'B': 'Good nutritional quality',
    'C': 'Average nutritional quality',
    'D': 'Poor nutritional quality',
    'E': 'Low nutritional quality'
  }
  return descriptions[grade as keyof typeof descriptions] || 'Unknown'
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}

// ============================================================================
// Lifecycle
// ============================================================================
onMounted(() => {
  loadRecipe()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');

.font-serif {
  font-family: 'Cormorant Garamond', Georgia, serif;
}
</style>
