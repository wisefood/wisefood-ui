<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <!-- Header -->
    <RecipesRecipeWranglerHeader back-to="/dashboard" :back-label="t('recipeWrangler.backToDashboard')" />

    <!-- Page tab switcher -->
    <div class="border-b border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 flex justify-center">
        <div class="flex gap-0">
          <button
            type="button"
            :class="[
              'px-5 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'search'
                ? 'border-brandg-500 text-brandg-600 dark:text-brandg-400'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            ]"
            @click="activeTab = 'search'"
          >
            <span class="flex items-center gap-1.5">
              <UIcon name="i-lucide-search" class="w-3.5 h-3.5" />
              Recipe Search
            </span>
          </button>
          <button
            type="button"
            :class="[
              'px-5 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'analyze'
                ? 'border-brandg-500 text-brandg-600 dark:text-brandg-400'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            ]"
            @click="activeTab = 'analyze'"
          >
            <span class="flex items-center gap-1.5">
              <UIcon name="i-lucide-flask-conical" class="w-3.5 h-3.5" />
              Analyze Recipe
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-12">
      <!-- Search Bar -->
      <section v-if="activeTab === 'search'" class="mb-8 sm:mb-12">
        <div class="max-w-2xl mx-auto">
          <div ref="searchBoxRef" class="relative">
            <UIcon name="i-lucide-search" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-zinc-400" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('recipeWrangler.search.placeholder')"
              class="w-full pl-11 sm:pl-12 pr-12 sm:pr-16 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brandg-500 text-sm sm:text-base"
              @input="handleSearchInput"
              @focus="handleSearchInput"
              @keydown.enter.prevent="handleSearchEnter"
              @keydown.down.prevent="handleSearchArrowDown"
              @keydown.up.prevent="handleSearchArrowUp"
              @keydown.esc.prevent="clearAutocomplete"
            />
            <button
              type="button"
              @click="performSearch"
              :disabled="!searchQuery.trim() || loading"
              class="absolute right-2 top-1/2 -translate-y-1/2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-brandg-500 hover:bg-brandg-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white text-sm font-medium transition-colors disabled:cursor-not-allowed"
            >
              <UIcon v-if="loading" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
              <UIcon v-else name="i-lucide-search" class="w-4 h-4" />
            </button>

            <div
              v-if="showAutocomplete && (autocompleteSuggestions.length > 0 || autocompleteLoading)"
              class="absolute left-0 right-0 mt-2 z-20 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg overflow-hidden"
            >
              <div v-if="autocompleteLoading" class="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                Loading suggestions...
              </div>
              <template v-else>
                <button
                  v-for="(suggestion, suggestionIndex) in autocompleteSuggestions"
                  :key="suggestion.recipe_id || suggestion.title"
                  type="button"
                  @mousedown.prevent="selectSuggestion(suggestion)"
                  :class="[
                    'w-full text-left px-4 py-2.5 text-sm transition-colors',
                    activeAutocompleteIndex === suggestionIndex
                      ? 'bg-brandg-50 text-brandg-700 dark:bg-brandg-900/30 dark:text-brandg-200'
                      : 'text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                  ]"
                >
                  {{ suggestion.title }}
                </button>
              </template>
            </div>
          </div>

          <!-- Recent Searches -->
          <div v-if="recipeStore.searchHistory.length > 0 && !searchQuery" class="mt-3 flex flex-wrap gap-2">
            <span class="text-xs text-zinc-500 dark:text-zinc-400 w-full mb-1">{{ t('recipeWrangler.search.recentSearches') }}</span>
            <button
              v-for="query in recipeStore.recentSearches.slice(0, 5)"
              :key="query"
              type="button"
              @click="searchQuery = query; performSearch()"
              class="px-3 py-1 rounded-full text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-brandg-600 dark:hover:text-brandg-400 transition-colors"
            >
              {{ query }}
            </button>
          </div>
        </div>
      </section>

      <!-- Recipe Analyzer -->
      <section v-if="activeTab === 'analyze'" class="mb-8 sm:mb-12">
        <div class="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/70 p-5 sm:p-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-white">
                AI Recipe Analyzer
              </h2>
              <p class="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                Paste recipe text to see nutrient totals and detailed ingredient-level calculation matches.
              </p>
            </div>
          </div>

          <div class="mt-4">
            <textarea
              v-model="analysisInput"
              rows="5"
              placeholder="Garlic Butter Shrimp&#10;Ingredients: 200g shrimp, 2 tbsp butter..."
              class="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brandg-500"
            />
          </div>

          <div class="mt-4 flex items-center gap-3">
            <button
              type="button"
              @click="runRecipeAnalysis"
              :disabled="analysisLoading || !analysisInput.trim()"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brandg-500 hover:bg-brandg-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white text-sm font-medium transition-colors disabled:cursor-not-allowed"
            >
              <UIcon v-if="analysisLoading" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
              <UIcon v-else name="i-lucide-flask-conical" class="w-4 h-4" />
              <span>{{ analysisLoading ? 'Analyzing...' : 'Analyze Recipe' }}</span>
            </button>

            <button
              v-if="analysisResult"
              type="button"
              @click="showCalculationDetails = !showCalculationDetails"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-sm font-medium transition-colors"
            >
              <UIcon name="i-lucide-calculator" class="w-4 h-4" />
              <span>{{ showCalculationDetails ? 'Hide Calculation Details' : 'Show Calculation Details' }}</span>
            </button>
          </div>

          <p v-if="analysisError" class="mt-4 text-sm text-red-600 dark:text-red-400">
            {{ analysisError }}
          </p>

          <div v-if="analysisResult" class="mt-6">
            <h3 class="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-white mb-3">
              Analysis Results: {{ analysisResult.title }}
            </h3>
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div class="rounded-xl border border-brand-200 dark:border-brand-800 p-3 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/20 dark:to-brand-800/20">
                <p class="text-sm text-brand-700 dark:text-brand-300">Calories / serving</p>
                <p class="text-xl font-semibold text-zinc-900 dark:text-white">{{ analyzedCalories }}</p>
              </div>
              <div class="rounded-xl border border-brandg-200 dark:border-brandg-800 p-3 bg-gradient-to-br from-brandg-50 to-brandg-100 dark:from-brandg-900/20 dark:to-brandg-800/20">
                <p class="text-sm text-brandg-700 dark:text-brandg-300">Protein / serving</p>
                <p class="text-xl font-semibold text-zinc-900 dark:text-white">{{ analyzedProtein }} g</p>
              </div>
              <div class="rounded-xl border border-brandp-200 dark:border-brandp-800 p-3 bg-gradient-to-br from-brandp-50 to-brandp-100 dark:from-brandp-900/20 dark:to-brandp-800/20">
                <p class="text-sm text-brandp-700 dark:text-brandp-300">Carbs / serving</p>
                <p class="text-xl font-semibold text-zinc-900 dark:text-white">{{ analyzedCarbs }} g</p>
              </div>
              <div class="rounded-xl border border-brand-200 dark:border-brandg-800 p-3 bg-gradient-to-br from-brand-50 to-brandg-50 dark:from-brand-900/20 dark:to-brandg-900/20">
                <p class="text-sm text-brand-700 dark:text-brandg-300">Fat / serving</p>
                <p class="text-xl font-semibold text-zinc-900 dark:text-white">{{ analyzedFat }} g</p>
              </div>
            </div>
            <div class="mt-3 rounded-xl border border-zinc-200 dark:border-zinc-700 p-3 bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-between">
              <div>
                <p class="text-sm text-zinc-500 dark:text-zinc-400">Nutri-Score</p>
                <p class="text-sm text-zinc-600 dark:text-zinc-300">Calculated from analyzed nutrition totals.</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sm text-zinc-500 dark:text-zinc-400">Color:</span>
                <span :class="nutriScoreBadgeClass">{{ nutriScoreGrade }}</span>
              </div>
            </div>

            <div
              v-if="showCalculationDetails"
              class="mt-5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden"
            >
              <!-- Panel header -->
              <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60">
                <div class="flex items-center gap-3">
                  <div class="p-2 rounded-lg bg-brandg-100 dark:bg-brandg-900/40">
                    <UIcon name="i-lucide-microscope" class="w-4 h-4 text-brandg-600 dark:text-brandg-400" />
                  </div>
                  <div>
                    <h4 class="text-sm font-semibold text-zinc-900 dark:text-white leading-tight">Nutrition Profiling Pipeline</h4>
                    <p class="text-xs text-zinc-500 dark:text-zinc-400">
                      Source:
                      <a :href="nutritionSourceUrl" target="_blank" rel="noopener noreferrer" class="text-brandg-600 dark:text-brandg-400 hover:underline">{{ nutritionSourceLabel }}</a>
                      · Nutri-Score:
                      <a href="https://nutriscore.blog/2022/12/25/spreadsheet-to-calculate-the-updated-version-of-the-nutri-score/" target="_blank" rel="noopener noreferrer" class="text-brandg-600 dark:text-brandg-400 hover:underline">reference</a>
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brandg-100 dark:bg-brandg-900/40 text-brandg-700 dark:text-brandg-300 border border-brandg-200 dark:border-brandg-700">
                    <span class="w-1.5 h-1.5 rounded-full bg-brandg-500"></span>
                    {{ matchedWeightCount }} matched
                  </span>
                  <span v-if="unmatchedWeightCount > 0" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700">
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    {{ unmatchedWeightCount }} unmatched
                  </span>
                </div>
              </div>

              <!-- Unified table -->
              <div v-if="analysisIngredientRows.length" class="p-5">
                <div class="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-sm">
                  <div class="overflow-x-auto">
                    <table class="min-w-full text-xs">
                      <thead>
                        <tr class="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-700">
                          <th class="px-4 py-3 text-left font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap w-8"></th>
                          <th class="px-4 py-3 text-left font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">#</th>
                          <th class="px-4 py-3 text-left font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">Ingredient</th>
                          <th class="px-4 py-3 text-left font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">Parsed Qty · Unit</th>
                          <th class="px-4 py-3 text-right font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">Weight (g)</th>
                          <th class="px-4 py-3 text-right font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">kcal/100g</th>
                          <th class="px-4 py-3 text-right font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">Protein/100g</th>
                          <th class="px-4 py-3 text-right font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">Carbs/100g</th>
                          <th class="px-4 py-3 text-right font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">Fat/100g</th>
                          <th class="px-4 py-3 text-right font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">CO₂</th>
                        </tr>
                      </thead>
                      <tbody>
                        <template v-for="(item, idx) in analysisIngredientRows" :key="`row-${idx}`">
                          <!-- Primary row -->
                          <tr
                            @click="analysisExpandedRow = analysisExpandedRow === idx ? null : idx"
                            :class="[
                              'cursor-pointer transition-colors border-t border-zinc-100 dark:border-zinc-800',
                              analysisWeightDetails[idx]?.error
                                ? 'bg-red-50/40 dark:bg-red-900/10 hover:bg-red-50/70 dark:hover:bg-red-900/20'
                                : analysisExpandedRow === idx
                                  ? 'bg-brandg-50/60 dark:bg-brandg-900/15'
                                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                            ]"
                          >
                            <td class="pl-3 pr-1 py-3 w-8">
                              <UIcon
                                :name="analysisExpandedRow === idx ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                                class="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform"
                              />
                            </td>
                            <td class="px-4 py-3 text-zinc-400 dark:text-zinc-600 font-mono">{{ idx + 1 }}</td>
                            <td class="px-4 py-3 font-semibold text-zinc-900 dark:text-white whitespace-nowrap max-w-[200px] truncate" :title="String(item.ingredient || item.name || '')">
                              {{ item.ingredient || item.name || '—' }}
                            </td>
                            <td class="px-4 py-3 whitespace-nowrap">
                              <span v-if="analysisWeightDetails[idx]?.parsed_quantity" class="inline-flex items-center gap-1">
                                <span class="font-semibold text-zinc-900 dark:text-white">{{ analysisWeightDetails[idx]?.parsed_quantity }}</span>
                                <span class="text-zinc-500 dark:text-zinc-400">{{ analysisWeightDetails[idx]?.parsed_unit || '' }}</span>
                              </span>
                              <span v-else class="text-zinc-400">—</span>
                            </td>
                            <td class="px-4 py-3 text-right font-mono font-semibold whitespace-nowrap">
                              <span :class="item.weight_g != null ? 'text-brandg-700 dark:text-brandg-300' : 'text-zinc-400'">
                                {{ item.weight_g != null ? formatNumber(item.weight_g) + ' g' : (analysisWeightDetails[idx]?.weight_grams != null ? formatNumber(analysisWeightDetails[idx]?.weight_grams) + ' g' : '—') }}
                              </span>
                            </td>
                            <td class="px-4 py-3 text-right font-mono text-zinc-700 dark:text-zinc-300">{{ formatNumber(item.energy_kcal_per_100g) }}</td>
                            <td class="px-4 py-3 text-right font-mono text-zinc-700 dark:text-zinc-300">{{ formatNumber(item.protein_per_100g) }} g</td>
                            <td class="px-4 py-3 text-right font-mono text-zinc-700 dark:text-zinc-300">{{ formatNumber(item.carbs_per_100g) }} g</td>
                            <td class="px-4 py-3 text-right font-mono text-zinc-700 dark:text-zinc-300">{{ formatNumber(item.fat_per_100g) }} g</td>
                            <td class="px-4 py-3 text-right font-mono text-zinc-500 dark:text-zinc-400">{{ formatNumber(item.contribution) }}</td>
                          </tr>
                          <!-- Accordion detail row -->
                          <Transition
                            enter-active-class="transition-all duration-200 ease-out"
                            enter-from-class="opacity-0"
                            enter-to-class="opacity-100"
                            leave-active-class="transition-all duration-150 ease-in"
                            leave-from-class="opacity-100"
                            leave-to-class="opacity-0"
                          >
                            <tr v-if="analysisExpandedRow === idx" class="border-t-0">
                              <td colspan="10" class="px-0 py-0">
                                <div class="px-6 py-4 bg-zinc-50/80 dark:bg-zinc-800/30 border-b border-zinc-200 dark:border-zinc-700">
                                  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-3">
                                    <div>
                                      <p class="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">Raw Measurement</p>
                                      <p class="font-mono text-zinc-700 dark:text-zinc-300">{{ analysisWeightDetails[idx]?.measurement_raw || '—' }}</p>
                                    </div>
                                    <div>
                                      <p class="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">Match Source</p>
                                      <span v-if="analysisWeightDetails[idx]?.match_type" :class="[
                                        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border',
                                        getMatchSourceStyle(analysisWeightDetails[idx]?.match_type)
                                      ]">
                                        <UIcon :name="getMatchSourceIcon(analysisWeightDetails[idx]?.match_type)" class="w-3 h-3" />
                                        {{ getWeightSourceLabel(analysisWeightDetails[idx]?.match_type) }}
                                      </span>
                                      <span v-else class="text-zinc-400">—</span>
                                    </div>
                                    <div>
                                      <p class="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">USDA ID</p>
                                      <p class="font-mono text-zinc-600 dark:text-zinc-400">{{ analysisWeightDetails[idx]?.usda_id || '—' }}</p>
                                    </div>
                                    <div>
                                      <p class="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">Inferred</p>
                                      <div class="flex items-center gap-2">
                                        <span v-if="analysisWeightDetails[idx]?.quantity_inferred" class="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                          <UIcon name="i-lucide-zap" class="w-3 h-3" /> Qty
                                        </span>
                                        <span v-if="analysisWeightDetails[idx]?.unit_inferred" class="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                          <UIcon name="i-lucide-zap" class="w-3 h-3" /> Unit
                                        </span>
                                        <span v-if="!analysisWeightDetails[idx]?.quantity_inferred && !analysisWeightDetails[idx]?.unit_inferred" class="text-zinc-400">—</span>
                                      </div>
                                    </div>
                                    <div>
                                      <p class="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">Matched Nutrition</p>
                                      <p class="text-zinc-700 dark:text-zinc-300 truncate" :title="String(item.matched_nutritional_ingredient || '')">{{ item.matched_nutritional_ingredient || '—' }}</p>
                                    </div>
                                    <div>
                                      <p class="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">Matched Sustainability</p>
                                      <p class="text-zinc-700 dark:text-zinc-300 truncate" :title="String(item.matched_sustainability_ingredient || '')">{{ item.matched_sustainability_ingredient || '—' }}</p>
                                    </div>
                                    <div v-if="analysisWeightDetails[idx]?.error" class="col-span-2">
                                      <p class="text-[10px] font-semibold uppercase tracking-wider text-red-400 dark:text-red-500 mb-0.5">Error</p>
                                      <p class="text-red-600 dark:text-red-400">{{ analysisWeightDetails[idx]?.error }}</p>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </Transition>
                        </template>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Filters Sidebar Toggle -->
      <section v-if="activeTab === 'search'" class="mb-6 sm:mb-8">
        <div class="flex items-center justify-between">
          <h2 class="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white">
            {{ t('recipeWrangler.filters.title') }}
          </h2>
          <button
            @click="showFilters = !showFilters"
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-sm"
          >
            <UIcon name="i-lucide-sliders" class="w-4 h-4" />
            <span>{{ showFilters ? t('recipeWrangler.filters.hide') : t('recipeWrangler.filters.show') }}</span>
            <UIcon
              :name="showFilters ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              class="w-4 h-4"
            />
          </button>
        </div>

        <!-- Filters Component -->
        <div v-if="showFilters" class="mt-4">
          <RecipesRecipeFilters
            @filter-change="handleFilterChange"
            @quick-filter="handleQuickFilter"
            @sort-change="handleFilterChange"
          />
        </div>
      </section>

      <!-- Recipe Grid -->
      <section v-if="activeTab === 'search'" class="mb-12 sm:mb-16">
        <div class="flex items-center justify-between mb-6 sm:mb-8">
          <div class="flex items-center gap-3">
            <h2 class="text-2xl sm:text-3xl font-claude text-zinc-900 dark:text-white">
              <span v-if="!hasSearchAttempted">Search recipes to get started</span>
              <span v-else-if="loading">Searching...</span>
              <span v-else-if="error">Error loading recipes</span>
              <span v-else-if="!hasUserTriggeredSearch">Suggested recipes</span>
              <span v-else>{{ recipesCount }} Recipe{{ recipesCount !== 1 ? 's' : '' }} Found</span>
            </h2>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="recipeStore.compareCount > 0"
              @click="clearCompareSelection"
              class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-sm"
            >
              <UIcon name="i-lucide-x" class="w-4 h-4" />
              <span>Clear Compare</span>
            </button>
            <button
              v-if="recipeStore.compareCount >= 2"
              @click="navigateToCompare"
              class="flex items-center gap-2 px-4 py-2 rounded-lg bg-brandg-600 dark:bg-brandg-500 text-white hover:bg-brandg-700 dark:hover:bg-brandg-600 transition-colors text-sm font-medium shadow-md"
            >
              <UIcon name="i-lucide-git-compare" class="w-4 h-4" />
              <span>{{ t('recipeWrangler.compare') }} ({{ recipeStore.compareCount }})</span>
            </button>
            <button
              v-if="recipeStore.favorites.length > 0"
              @click="() => {}"
              class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-sm"
            >
              <UIcon name="i-lucide-heart" class="w-4 h-4 text-red-500" />
              <span class="hidden sm:inline">{{ recipeStore.favorites.length }}</span>
            </button>
          </div>
        </div>

        <!-- Error State -->
        <div
          v-if="hasSearchAttempted && error"
          class="p-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-center"
        >
          <UIcon name="i-lucide-alert-circle" class="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 class="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
            {{ t('recipeWrangler.results.error') }}
          </h3>
          <p class="text-sm text-red-600 dark:text-red-300 mb-4">{{ error }}</p>
          <UButton
            @click="performSearch"
            color="primary"
            variant="outline"
          >
            {{ t('recipeWrangler.results.tryAgain') }}
          </UButton>
        </div>

        <!-- Loading State -->
        <div v-else-if="hasSearchAttempted && loading" class="space-y-8">
          <!-- Cooking Animation - Clean, minimal container -->
          <div class="relative py-12 sm:py-16">
            <!-- SVG Cooking Animation Component -->
            <div class="flex items-center justify-center">
              <RecipesCookingAnimation />
            </div>

            <!-- Time estimate - subtle -->
            <div class="text-center mt-6">
              <p class="text-xs text-stone-400 dark:text-stone-500 tracking-wide">
                {{ t('recipeWrangler.loadingHint') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="hasSearchAttempted && !hasRecipes"
          class="text-center py-12"
        >
          <UIcon name="i-lucide-search-x" class="w-16 h-16 text-zinc-400 mx-auto mb-4" />
          <h3 class="text-xl font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            {{ t('recipeWrangler.results.noResults') }}
          </h3>
          <p class="text-zinc-500 dark:text-zinc-400 mb-6">
            {{ t('recipeWrangler.results.noResultsMessage') }}
          </p>
        </div>

        <!-- Recipe Cards Grid -->
        <div
          v-else-if="hasSearchAttempted"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
        >
          <div
            v-for="(recipe, index) in paginatedRecipes"
            :key="recipe.recipe_id || recipe.id || `recipe-${index}`"
            :class="[
              'rounded-xl transition-all',
              activeRecipeResultIndex === index
                ? 'ring-2 ring-brandg-500 ring-offset-2 ring-offset-transparent'
                : ''
            ]"
          >
            <RecipesRecipeCard
              :recipe="recipe"
            />
          </div>
        </div>

        <!-- Pre-search State -->
        <div
          v-else
          class="text-center py-12"
        >
          <UIcon name="i-lucide-search" class="w-16 h-16 text-zinc-400 mx-auto mb-4" />
          <h3 class="text-xl font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            Start with a query
          </h3>
          <p class="text-zinc-500 dark:text-zinc-400 mb-6">
            Enter a recipe query above to get personalized results.
          </p>
        </div>

        <!-- Pagination -->
        <div v-if="hasSearchAttempted && showPagination" class="mt-8 sm:mt-12 flex justify-center">
          <nav class="flex items-center gap-2" aria-label="Pagination">
            <!-- Previous Button -->
            <button
              @click="goToPage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              :aria-label="t('recipeWrangler.previousPage')"
            >
              <UIcon name="i-lucide-chevron-left" class="w-5 h-5" />
            </button>

            <!-- Page Numbers -->
            <div class="flex items-center gap-1">
              <!-- First page + ellipsis -->
              <template v-if="visiblePages.length && visiblePages[0] > 1">
                <button @click="goToPage(1)" class="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">1</button>
                <span v-if="visiblePages[0] > 2" class="px-2 text-zinc-500">…</span>
              </template>

              <!-- Sliding window -->
              <button
                v-for="page in visiblePages"
                :key="page"
                @click="goToPage(page)"
                :class="[
                  'px-4 py-2 rounded-lg border transition-colors',
                  page === currentPage
                    ? 'border-brandg-500 bg-brandg-500 text-white'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                ]"
              >
                {{ page }}
              </button>

              <!-- Ellipsis + last page -->
              <template v-if="visiblePages.length && visiblePages[visiblePages.length - 1] < totalPages">
                <span v-if="visiblePages[visiblePages.length - 1] < totalPages - 1" class="px-2 text-zinc-500">…</span>
                <button @click="goToPage(totalPages)" class="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">{{ totalPages }}</button>
              </template>

              <!-- Fallback when count endpoint hasn't resolved yet -->
              <span
                v-if="totalPages === 0 && searchMode === 'params'"
                class="px-4 py-2 rounded-lg border border-brandg-500 bg-brandg-500 text-white font-medium"
              >
                {{ currentPage }}
              </span>
            </div>

            <!-- Next Button -->
            <button
              @click="goToPage(currentPage + 1)"
              :disabled="isLastPage"
              class="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              :aria-label="t('recipeWrangler.nextPage')"
            >
              <UIcon name="i-lucide-chevron-right" class="w-5 h-5" />
            </button>
          </nav>
        </div>
      </section>

      <!-- Categories Section -->
      <section v-if="activeTab === 'search'" class="bg-gradient-to-br from-brandg-50 to-brandg-100 dark:from-brandg-900/20 dark:to-brandg-800/20 border border-brandg-200 dark:border-brandg-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12">
        <h2 class="text-2xl sm:text-3xl font-claude mb-6 sm:mb-8 text-zinc-900 dark:text-white">Browse by Category</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          <button
            v-for="category in categories"
            :key="category.name"
            @click="browseCategory(category)"
            :disabled="loading"
            class="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:bg-white dark:hover:bg-zinc-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-brandg-100 dark:bg-brandg-900/50 flex items-center justify-center mb-2 sm:mb-3 mx-auto">
              <UIcon :name="category.icon" class="w-5 h-5 sm:w-6 sm:h-6 text-brandg-600 dark:text-brandg-400" />
            </div>
            <h3 class="font-semibold text-zinc-900 dark:text-white text-xs sm:text-sm">{{ category.name }}</h3>
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRecipes } from '~/composables/useRecipes'
import { useRecipeStore } from '~/stores/recipe'
import { useI18n } from 'vue-i18n'
import { useHouseholdStore } from '~/stores/household'
import recipeApi from '~/services/recipeApi'
import type {
  PipelineTraceWeightDetail,
  RecipeAutocompleteSuggestion,
  RecipeParamSearchParams,
  RecipeProfileResult,
  RecipeSearchResult
} from '~/services/recipeApi'

const { t } = useI18n()

definePageMeta({
  middleware: ['auth']
})

useHead({
  title: 'RecipeWrangler'
})

useSeoMeta({
  description: computed(() => t('recipeWrangler.subtitle'))
})

// ============================================================================
// Composables & Stores
// ============================================================================
const { recipes, loading, error, searchRecipes, searchRecipesByParams, fetchRecipeCount, fetchRecipesByCategory, clearError, hasMore, totalRecipeCount } = useRecipes()
const recipeStore = useRecipeStore()
const householdStore = useHouseholdStore()

// ============================================================================
// State
// ============================================================================
const searchQuery = ref('')
const searchBoxRef = ref<HTMLElement | null>(null)
const autocompleteSuggestions = ref<RecipeAutocompleteSuggestion[]>([])
const autocompleteLoading = ref(false)
const showAutocomplete = ref(false)
const activeAutocompleteIndex = ref(-1)
const activeRecipeResultIndex = ref(-1)
const showFilters = ref(false)
const currentPage = ref(1)
const itemsPerPage = 12
const searchMode = ref<'nl' | 'params'>('nl')
const lastParamSearch = ref<RecipeParamSearchParams | null>(null)
const activeTab = ref<'search' | 'analyze'>('search')
const hasSearchAttempted = ref(false)
const hasUserTriggeredSearch = ref(false)
const analysisInput = ref('')
const analysisRegion = ref('IE')
const analysisLoading = ref(false)
const analysisError = ref<string | null>(null)
const analysisResult = ref<RecipeProfileResult | null>(null)
const showCalculationDetails = ref(false)
const analysisExpandedRow = ref<number | null>(null)
let autocompleteDebounceTimer: ReturnType<typeof setTimeout> | null = null

// ============================================================================
// Categories
// ============================================================================
const categories = computed(() => [
  { name: t('recipeWrangler.categories.pasta'), icon: 'i-lucide-soup', query: 'pasta' },
  { name: t('recipeWrangler.categories.salad'), icon: 'i-lucide-salad', query: 'salad' },
  { name: t('recipeWrangler.categories.soup'), icon: 'i-lucide-soup', query: 'soup' },
  { name: t('recipeWrangler.categories.breakfast'), icon: 'i-lucide-sunrise', query: 'breakfast' },
  { name: t('recipeWrangler.categories.dessert'), icon: 'i-lucide-cake', query: 'dessert' },
  { name: t('recipeWrangler.categories.snacks'), icon: 'i-lucide-cookie', query: 'snacks' },
  { name: t('recipeWrangler.categories.beverages'), icon: 'i-lucide-coffee', query: 'beverages' },
  { name: t('recipeWrangler.categories.quickMeals'), icon: 'i-lucide-zap', query: 'quick recipes' },
])

// ============================================================================
// Computed
// ============================================================================
const recipesCount = computed(() => recipes.value?.length || 0)

const hasRecipes = computed(() => recipesCount.value > 0)

const totalPages = computed(() => {
  if (searchMode.value === 'params') {
    return totalRecipeCount.value > 0 ? Math.ceil(totalRecipeCount.value / itemsPerPage) : 0
  }
  return Math.ceil(recipesCount.value / itemsPerPage)
})

const paginatedRecipes = computed(() => {
  if (!recipes.value) return []
  if (searchMode.value === 'params') return recipes.value
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return recipes.value.slice(start, end)
})

const visiblePages = computed(() => {
  if (totalPages.value === 0) return []
  const window = 2
  const start = Math.max(1, currentPage.value - window)
  const end = Math.min(totalPages.value, currentPage.value + window)
  const pages = []
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const showPagination = computed(() => {
  if (!hasRecipes.value) return false
  return totalPages.value > 1 || (searchMode.value === 'params' && (currentPage.value > 1 || hasMore.value))
})

const isLastPage = computed(() => {
  if (totalPages.value > 0) return currentPage.value === totalPages.value
  return !hasMore.value
})

const analysisTotals = computed(() => analysisResult.value?.profiling_totals || {})

const analysisIngredientRows = computed(() => {
  const fromTrace = analysisResult.value?.pipeline_trace?.profiling?.ingredients
  if (Array.isArray(fromTrace) && fromTrace.length > 0) {
    return fromTrace
  }
  return analysisResult.value?.ingredients || []
})

const analysisWeightDetails = computed<PipelineTraceWeightDetail[]>(() => {
  return analysisResult.value?.pipeline_trace?.weight_calculation?.details || []
})

const matchedWeightCount = computed(
  () => analysisResult.value?.pipeline_trace?.weight_calculation?.matched_count || 0
)
const unmatchedWeightCount = computed(
  () => analysisResult.value?.pipeline_trace?.weight_calculation?.unmatched_count || 0
)

const lookupTotal = (metricParts: string[]): number => {
  const entries = Object.entries(analysisTotals.value)
  for (const [key, value] of entries) {
    if (!metricParts.every((part) => key.includes(part))) continue
    if (typeof value !== 'number') continue
    return value
  }
  return 0
}

const analyzedCalories = computed(() => formatNumber(lookupTotal(['energy_kcal', 'per_serving'])))
const analyzedProtein = computed(() => formatNumber(lookupTotal(['protein_g', 'per_serving'])))
const analyzedCarbs = computed(() => formatNumber(lookupTotal(['carbohydrate_g', 'per_serving'])))
const analyzedFat = computed(() => formatNumber(lookupTotal(['fat_g', 'per_serving'])))
const nutriScoreRaw = computed(
  () => analysisResult.value?.nutri_score?.nutri_score || null
)
const nutriScoreGrade = computed(() => {
  if (!nutriScoreRaw.value) return 'N/A'
  return String(nutriScoreRaw.value).replace('Nutriscore_', '')
})
const nutriScoreColor = computed(
  () => analysisResult.value?.nutri_score_color || analysisResult.value?.nutri_score?.color || ''
)
const analysisNutritionSource = computed(() => String(
  analysisResult.value?.nutrition_source ||
  analysisResult.value?.pipeline_trace?.profiling?.source ||
  analysisResult.value?.source_nutrition ||
  ''
).toLowerCase())
const nutritionSourceUrl = computed(() => {
  return analysisNutritionSource.value.includes('usda')
    ? 'https://fdc.nal.usda.gov/'
    : 'https://irp-cdn.multiscreensite.com/46a7ad27/files/uploaded/Irish-Food-Portion-Sizes-Database.pdf'
})
const nutritionSourceLabel = computed(() => {
  return analysisNutritionSource.value.includes('usda')
    ? 'USDA FoodData Central'
    : 'Irish Composition Table'
})

const nutriScoreBadgeClass = computed(() => {
  const color = String(nutriScoreColor.value || '').toLowerCase()
  if (color.includes('dark green')) {
    return 'px-2 py-1 rounded-full text-xs font-semibold bg-green-800 text-white'
  }
  if (color.includes('green')) {
    return 'px-2 py-1 rounded-full text-xs font-semibold bg-green-600 text-white'
  }
  if (color.includes('yellow')) {
    return 'px-2 py-1 rounded-full text-xs font-semibold bg-yellow-400 text-zinc-900'
  }
  if (color.includes('orange')) {
    return 'px-2 py-1 rounded-full text-xs font-semibold bg-orange-500 text-white'
  }
  return 'px-2 py-1 rounded-full text-xs font-semibold bg-zinc-300 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
})

// ============================================================================
// Methods
// ============================================================================

const clearAutocomplete = () => {
  autocompleteSuggestions.value = []
  showAutocomplete.value = false
  activeAutocompleteIndex.value = -1
}

const fetchAutocompleteSuggestions = async (query: string) => {
  const normalizedQuery = query.trim()
  if (normalizedQuery.length < 2) {
    clearAutocomplete()
    return
  }

  autocompleteLoading.value = true
  try {
    const suggestions = await recipeApi.autocompleteRecipes(normalizedQuery, 8)
    if (searchQuery.value.trim() !== normalizedQuery) return
    autocompleteSuggestions.value = suggestions
    activeAutocompleteIndex.value = -1
    showAutocomplete.value = suggestions.length > 0
  } catch {
    clearAutocomplete()
  } finally {
    autocompleteLoading.value = false
  }
}

const handleSearchInput = () => {
  const query = searchQuery.value.trim()
  activeRecipeResultIndex.value = -1
  if (autocompleteDebounceTimer) {
    clearTimeout(autocompleteDebounceTimer)
    autocompleteDebounceTimer = null
  }
  if (query.length < 2) {
    clearAutocomplete()
    return
  }

  autocompleteDebounceTimer = setTimeout(() => {
    void fetchAutocompleteSuggestions(query)
  }, 220)
}

const resolveRecipeIdentifier = (recipe: Pick<RecipeSearchResult, 'recipe_id' | 'id'> | null | undefined) => {
  const recipeId = typeof recipe?.recipe_id === 'string' ? recipe.recipe_id.trim() : ''
  if (recipeId) {
    return recipeId
  }

  return typeof recipe?.id === 'string' ? recipe.id.trim() : ''
}

const openRecipeResult = async (recipe: RecipeSearchResult | null | undefined) => {
  const recipeId = resolveRecipeIdentifier(recipe)
  if (!recipeId) {
    return
  }

  clearAutocomplete()
  activeRecipeResultIndex.value = -1
  await navigateTo(`/recipe-wrangler/${encodeURIComponent(recipeId)}`)
}

const selectSuggestion = async (suggestion: RecipeAutocompleteSuggestion) => {
  searchQuery.value = suggestion.title
  clearAutocomplete()

  if (suggestion.recipe_id) {
    await navigateTo(`/recipe-wrangler/${encodeURIComponent(suggestion.recipe_id)}`)
    return
  }

  await performSearch({ openFirstResult: true })
}

const handleClickOutsideSearch = (event: MouseEvent) => {
  const target = event.target as Node | null
  if (!target) return
  if (searchBoxRef.value && !searchBoxRef.value.contains(target)) {
    showAutocomplete.value = false
  }
}

const handleSearchArrowDown = () => {
  if (showAutocomplete.value && autocompleteSuggestions.value.length > 0) {
    activeAutocompleteIndex.value = activeAutocompleteIndex.value < autocompleteSuggestions.value.length - 1
      ? activeAutocompleteIndex.value + 1
      : 0
    return
  }

  if (paginatedRecipes.value.length > 0) {
    activeRecipeResultIndex.value = activeRecipeResultIndex.value < paginatedRecipes.value.length - 1
      ? activeRecipeResultIndex.value + 1
      : 0
  }
}

const handleSearchArrowUp = () => {
  if (showAutocomplete.value && autocompleteSuggestions.value.length > 0) {
    activeAutocompleteIndex.value = activeAutocompleteIndex.value > 0
      ? activeAutocompleteIndex.value - 1
      : autocompleteSuggestions.value.length - 1
    return
  }

  if (paginatedRecipes.value.length > 0) {
    activeRecipeResultIndex.value = activeRecipeResultIndex.value > 0
      ? activeRecipeResultIndex.value - 1
      : paginatedRecipes.value.length - 1
  }
}

const handleSearchEnter = () => {
  if (showAutocomplete.value && autocompleteSuggestions.value.length > 0) {
    const nextSuggestion = autocompleteSuggestions.value[
      activeAutocompleteIndex.value >= 0 ? activeAutocompleteIndex.value : 0
    ]

    if (nextSuggestion) {
      void selectSuggestion(nextSuggestion)
      return
    }
  }

  const nextRecipe = paginatedRecipes.value[activeRecipeResultIndex.value]
  if (nextRecipe) {
    void openRecipeResult(nextRecipe)
    return
  }

  void performSearch()
}

/**
 * Analyze free-form recipe text with the profiling pipeline.
 */
const runRecipeAnalysis = async () => {
  if (activeTab.value !== 'analyze') return
  if (!analysisInput.value.trim()) return
  analysisLoading.value = true
  analysisError.value = null
  showCalculationDetails.value = false

  try {
    const result = await recipeApi.analyzeRecipe(analysisInput.value.trim(), analysisRegion.value)
    analysisResult.value = result
  } catch (err: unknown) {
    const e = err as { data?: { detail?: string }; message?: string }
    const detail = e?.data?.detail || e?.message || 'Failed to analyze recipe'
    analysisError.value = String(detail)
    analysisResult.value = null
  } finally {
    analysisLoading.value = false
  }
}

const formatNumber = (value: unknown): string => {
  if (value === null || value === undefined) return '0'
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return '0'
  return n.toFixed(2)
}

const getWeightSourceLabel = (matchType?: string | null): string => {
  const normalized = String(matchType || '').toLowerCase()
  if (!normalized) return 'N/A'
  if (normalized.includes('direct') || normalized.includes('portion')) return 'USDA portion table'
  if (normalized.includes('embedding')) return 'USDA embedding match'
  if (normalized.includes('llm')) return 'AI Generated (LLM)'
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

/**
 * Search recipes with natural language query
 */
const performSearch = async (options: { openFirstResult?: boolean } = {}) => {
  if (!searchQuery.value || searchQuery.value.trim() === '') return
  clearAutocomplete()
  hasUserTriggeredSearch.value = true
  hasSearchAttempted.value = true
  activeRecipeResultIndex.value = -1

  try {
    clearError()
    resetPagination()
    searchMode.value = 'nl'
    lastParamSearch.value = null
    const excludeAllergens = recipeStore.excludedAllergens

    await searchRecipes({
      question: searchQuery.value,
      exclude_allergens: excludeAllergens.length > 0 ? excludeAllergens : undefined
    }, false)

    recipeStore.addSearchQuery(searchQuery.value)

    if (options.openFirstResult) {
      const normalizedQuery = searchQuery.value.trim().toLowerCase()
      const exactMatch = recipes.value.find(recipe => recipe.title.trim().toLowerCase() === normalizedQuery)
      const nextRecipe = exactMatch || recipes.value[0]
      if (nextRecipe) {
        await openRecipeResult(nextRecipe)
      }
    }
  } catch (err) {
    console.error('Search failed:', err)
  }
}

/**
 * Reset to first page
 */
const resetPagination = () => {
  currentPage.value = 1
  activeRecipeResultIndex.value = -1
}

/**
 * Change page — for param_search mode re-fetches from server with offset
 */
const goToPage = async (page: number) => {
  currentPage.value = page
  activeRecipeResultIndex.value = -1

  if (searchMode.value === 'params' && lastParamSearch.value) {
    const offset = (page - 1) * itemsPerPage
    await searchRecipesByParams({ ...lastParamSearch.value, limit: itemsPerPage, offset }, false)
  }
}

/**
 * Browse recipes by category
 */
const browseCategory = async (category: { name: string; query: string }) => {
  hasUserTriggeredSearch.value = true
  hasSearchAttempted.value = true
  try {
    clearError()
    resetPagination()
    searchMode.value = 'nl'
    lastParamSearch.value = null
    searchQuery.value = category.query
    const excludeAllergens = recipeStore.excludedAllergens

    await fetchRecipesByCategory(
      category.query,
      excludeAllergens.length > 0 ? excludeAllergens : undefined,
      false
    )
  } catch (err) {
    console.error('Failed to load category:', err)
  }
}

/**
 * Handle filter changes
 */
const handleFilterChange = async () => {
  resetPagination()
  if (searchQuery.value) {
    await performSearch()
  } else if (lastParamSearch.value) {
    const excludeAllergens = recipeStore.excludedAllergens
    const updatedParams = {
      ...lastParamSearch.value,
      exclude_allergens: excludeAllergens.length > 0 ? excludeAllergens : undefined,
      offset: 0
    }
    lastParamSearch.value = updatedParams
    await searchRecipesByParams(updatedParams, false)
  }
}

/**
 * Handle quick filter selection
 */
const handleQuickFilter = async (filterType: string) => {
  hasUserTriggeredSearch.value = true
  hasSearchAttempted.value = true
  try {
    clearError()
    resetPagination()
    const excludeAllergens = recipeStore.excludedAllergens

    let query = ''
    switch (filterType) {
      case 'quick':
        query = 'quick recipes under 30 minutes'
        break
      case 'healthy':
        query = 'healthy nutritious recipes'
        break
      case 'vegetarian':
        query = 'vegetarian recipes'
        break
      case 'vegan':
        query = 'vegan recipes'
        break
      case 'low-calorie':
        query = 'low calorie recipes'
        break
      default:
        return
    }

    searchQuery.value = query
    searchMode.value = 'nl'
    lastParamSearch.value = null
    await searchRecipes({
      question: query,
      exclude_allergens: excludeAllergens.length > 0 ? excludeAllergens : undefined
    }, false)
  } catch (err) {
    console.error('Quick filter failed:', err)
  }
}

/**
 * Navigate to comparison page
 */
const navigateToCompare = () => {
  const ids = recipeStore.compareList
    .map(id => String(id || '').trim())
    .filter(Boolean)
    .slice(0, 4)

  navigateTo({
    path: '/recipe-wrangler/compare',
    query: ids.length > 0 ? { ids } : undefined
  })
}

const clearCompareSelection = () => {
  recipeStore.clearCompareList()
}

watch(() => paginatedRecipes.value.length, (nextLength) => {
  if (nextLength === 0) {
    activeRecipeResultIndex.value = -1
    return
  }

  if (activeRecipeResultIndex.value >= nextLength) {
    activeRecipeResultIndex.value = nextLength - 1
  }
})

// ============================================================================
// Lifecycle
// ============================================================================
onMounted(async () => {
  if (import.meta.client) {
    document.addEventListener('click', handleClickOutsideSearch)
  }

  // Initialize stores
  recipeStore.initialize()
  void (async () => {
    try {
      await householdStore.initialize()
      const userRegion = String(householdStore.currentHousehold?.region || '').trim().toUpperCase()
      if (userRegion) {
        analysisRegion.value = userRegion
      }
    } catch (err) {
      console.error('Failed to load household region:', err)
    }
  })()

  // Load an initial set of recipes on page open using param_search (supports server-side pagination).
  hasUserTriggeredSearch.value = false
  hasSearchAttempted.value = true
  try {
    clearError()
    resetPagination()
    const excludeAllergens = recipeStore.excludedAllergens
    const initialParams = {
      exclude_allergens: excludeAllergens.length > 0 ? excludeAllergens : undefined,
      limit: itemsPerPage,
      offset: 0
    }
    searchMode.value = 'params'
    lastParamSearch.value = initialParams
    await Promise.all([
      searchRecipesByParams(initialParams, false),
      fetchRecipeCount()
    ])
  } catch (err) {
    console.error('Failed to load initial random recipes:', err)
  }
})

onBeforeUnmount(() => {
  if (autocompleteDebounceTimer) {
    clearTimeout(autocompleteDebounceTimer)
    autocompleteDebounceTimer = null
  }
  if (import.meta.client) {
    document.removeEventListener('click', handleClickOutsideSearch)
  }
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
