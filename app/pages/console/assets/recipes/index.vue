<template>
  <div>
    <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <UBreadcrumb
        :items="breadcrumbItems"
        class="mb-4"
      />

      <div class="flex flex-col gap-4 py-8 sm:flex-row sm:items-start sm:justify-between">
        <UPageHeader
          title="Recipes"
          :ui="{ root: 'relative py-0 border-b-0' }"
        />

        <UButton
          color="primary"
          icon="i-lucide-plus"
          class="self-start"
          @click="openCreateRecipeModal"
        >
          Add Recipe
        </UButton>
      </div>

      <UPageBody class="space-y-6">
        <UCard
          :ui="{ body: 'p-0', header: 'p-5 sm:p-6', footer: 'p-4 sm:px-6 sm:py-4' }"
          class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
        >
          <template #header>
            <div class="space-y-4">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                      Recipe Library
                    </h2>
                    <UBadge
                      color="neutral"
                      variant="outline"
                    >
                      {{ resultCountLabel }}
                    </UBadge>
                  </div>
                </div>

                <div class="ml-auto flex flex-wrap gap-2">
                  <UButton
                    color="neutral"
                    variant="outline"
                    size="sm"
                    icon="i-lucide-refresh-cw"
                    :loading="recipesLoading"
                    @click="refreshRecipes"
                  >
                    Sync
                  </UButton>
                  <UButton
                    color="neutral"
                    variant="ghost"
                    :disabled="recipesLoading || !hasActiveFilters"
                    @click="resetFilters"
                  >
                    Reset
                  </UButton>
                </div>
              </div>

              <div class="flex flex-col gap-3 xl:flex-row xl:items-center">
                <div
                  ref="searchBoxRef"
                  class="relative w-full min-w-0"
                >
                  <UInput
                    v-model="filters.q"
                    leading
                    leading-icon="i-lucide-search"
                    placeholder="Search by title, ingredient, cuisine, or a natural-language phrase"
                    class="w-full"
                    @update:model-value="handleSearchInput"
                    @focus="handleSearchFocus"
                    @keydown.enter.prevent="handleSearchEnter"
                    @keydown.down.prevent="handleSearchArrowDown"
                    @keydown.up.prevent="handleSearchArrowUp"
                    @keydown.esc.prevent="clearAutocomplete"
                  />

                  <div
                    v-if="showAutocomplete && (autocompleteSuggestions.length > 0 || autocompleteLoading)"
                    class="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-white/10 dark:bg-zinc-900"
                  >
                    <div
                      v-if="autocompleteLoading"
                      class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400"
                    >
                      Loading suggestions...
                    </div>

                    <template v-else>
                      <button
                        v-for="(suggestion, suggestionIndex) in autocompleteSuggestions"
                        :key="suggestion.recipe_id || suggestion.title"
                        type="button"
                        :class="[
                          'w-full px-4 py-2.5 text-left text-sm transition-colors',
                          activeAutocompleteIndex === suggestionIndex
                            ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200'
                            : 'text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-white/5'
                        ]"
                        @mousedown.prevent="selectSuggestion(suggestion)"
                      >
                        {{ suggestion.title }}
                      </button>
                    </template>
                  </div>
                </div>

                <div class="flex flex-none gap-2">
                  <UButton
                    color="primary"
                    icon="i-lucide-search"
                    :loading="recipesLoading"
                    @click="applyFilters"
                  >
                    Search
                  </UButton>
                </div>
              </div>
            </div>
          </template>

          <UAlert
            v-if="recipesError"
            color="error"
            variant="soft"
            icon="i-lucide-alert-circle"
            :title="recipesError"
            class="mx-5 mt-5 sm:mx-6"
          />

          <div class="overflow-x-auto">
            <UTable
              :data="recipes"
              :columns="recipeColumns"
              :loading="recipesLoading"
              sticky="header"
              :on-select="handleRecipeRowSelect"
              :ui="recipeTableUi"
              class="min-h-[28rem] min-w-[52rem]"
            >
              <template #title-cell="{ row }">
                <div
                  class="w-[30rem] max-w-[30rem] rounded-md px-1.5 py-0.5 transition-colors"
                  :class="isActiveRecipeRow(row.original)
                    ? 'bg-brand-50 dark:bg-brand-500/10'
                    : ''"
                >
                  <p class="truncate font-medium text-gray-900 dark:text-white">
                    {{ row.original.title }}
                  </p>
                  <p class="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
                    {{ compactRecipeMeta(row.original) }}
                  </p>
                </div>
              </template>

              <template #duration-cell="{ row }">
                <span class="text-sm text-gray-700 dark:text-gray-200">
                  {{ formatDuration(row.original.duration) }}
                </span>
              </template>

              <template #serves-cell="{ row }">
                <span class="text-sm text-gray-700 dark:text-gray-200">
                  {{ formatServes(row.original.serves) }}
                </span>
              </template>

              <template #nutri_score-cell="{ row }">
                <UBadge
                  color="neutral"
                  variant="outline"
                >
                  {{ formatNutriScore(row.original.nutri_score) }}
                </UBadge>
              </template>

              <template #actions-cell="{ row }">
                <div class="flex justify-end gap-2">
                  <UBadge
                    v-if="isActiveRecipeRow(row.original)"
                    color="primary"
                    variant="soft"
                  >
                    Selected
                  </UBadge>
                  <UButton
                    :color="isActiveRecipeRow(row.original) ? 'primary' : 'neutral'"
                    variant="ghost"
                    size="xs"
                    trailing-icon="i-lucide-arrow-right"
                    :disabled="!resolveRecipeIdentifier(row.original)"
                    @click.stop="openRecipe(row.original)"
                  >
                    Open
                  </UButton>
                </div>
              </template>

              <template #empty>
                <div class="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <UIcon
                    name="i-lucide-utensils-crossed"
                    class="h-8 w-8 text-gray-400"
                  />
                  <p class="mt-4 text-sm font-medium text-gray-900 dark:text-white">
                    No recipes match the current search.
                  </p>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Try a broader phrase, clear the search field, or create a new recipe from scratch.
                  </p>
                </div>
              </template>
            </UTable>
          </div>

          <template #footer>
            <div class="flex items-center justify-between gap-4">
              <p class="text-sm text-gray-600 dark:text-gray-300">
                {{ resultSummary }}
              </p>

              <!-- Pagination (param_search mode only) -->
              <nav v-if="!isNlSearch && (currentPage > 1 || hasMore)" class="flex items-center gap-1">
                <UButton
                  color="neutral"
                  variant="outline"
                  size="xs"
                  icon="i-lucide-chevron-left"
                  :disabled="currentPage === 1 || recipesLoading"
                  @click="goToPage(currentPage - 1)"
                />

                <template v-if="visiblePages.length">
                  <!-- First + ellipsis -->
                  <template v-if="visiblePages[0] > 1">
                    <UButton color="neutral" variant="outline" size="xs" :disabled="recipesLoading" @click="goToPage(1)">1</UButton>
                    <span v-if="visiblePages[0] > 2" class="px-1 text-xs text-gray-400">…</span>
                  </template>

                  <!-- Sliding window -->
                  <UButton
                    v-for="page in visiblePages"
                    :key="page"
                    :color="page === currentPage ? 'primary' : 'neutral'"
                    :variant="page === currentPage ? 'solid' : 'outline'"
                    size="xs"
                    :disabled="recipesLoading"
                    @click="goToPage(page)"
                  >
                    {{ page }}
                  </UButton>

                  <!-- Ellipsis + last -->
                  <template v-if="visiblePages[visiblePages.length - 1] < totalPages">
                    <span v-if="visiblePages[visiblePages.length - 1] < totalPages - 1" class="px-1 text-xs text-gray-400">…</span>
                    <UButton color="neutral" variant="outline" size="xs" :disabled="recipesLoading" @click="goToPage(totalPages)">{{ totalPages }}</UButton>
                  </template>
                </template>
                <span v-else class="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-200">
                  {{ currentPage }}
                </span>

                <UButton
                  color="neutral"
                  variant="outline"
                  size="xs"
                  icon="i-lucide-chevron-right"
                  :disabled="!hasMore && (totalPages === 0 || currentPage === totalPages) || recipesLoading"
                  @click="goToPage(currentPage + 1)"
                />
              </nav>
            </div>
          </template>
        </UCard>
      </UPageBody>
    </UPage>

    <UModal
      v-model:open="createModalOpen"
      :ui="{ content: 'w-[calc(100vw-2rem)] max-w-5xl' }"
    >
      <template #content>
        <UCard
          class="flex w-full max-h-[calc(100vh-2.5rem)] flex-col"
          :ui="{ body: 'min-h-0 flex-1 overflow-y-auto p-4 sm:p-5', footer: 'p-4 sm:p-5' }"
        >
          <template #header>
            <div class="flex items-start justify-between gap-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Add Recipe
              </h3>

              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-x"
                :disabled="createWizardBusy"
                @click="closeCreateRecipeModal"
              />
            </div>
          </template>

          <div class="space-y-5">
            <div class="grid gap-3 lg:grid-cols-3">
              <div
                v-for="item in createWizardSteps"
                :key="item.step"
                :class="[
                  'rounded-2xl border p-3.5 transition-colors',
                  item.step === createWizardStep
                    ? 'border-primary-300 bg-primary-50/70 dark:border-primary-400/60 dark:bg-primary-500/10'
                    : item.step < createWizardStep
                      ? 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-400/40 dark:bg-emerald-500/10'
                      : 'border-gray-200/80 bg-gray-50/70 dark:border-white/10 dark:bg-white/5'
                ]"
              >
                <div class="flex items-center gap-3">
                  <div
                    :class="[
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                      item.step === createWizardStep
                        ? 'bg-primary-600 text-white'
                        : item.step < createWizardStep
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-gray-200'
                    ]"
                  >
                    <UIcon
                      v-if="item.step < createWizardStep"
                      name="i-lucide-check"
                      class="h-4 w-4"
                    />
                    <span v-else>{{ item.step }}</span>
                  </div>

                  <div>
                    <p class="text-sm font-semibold text-gray-900 dark:text-white">
                      {{ item.title }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <UAlert
              v-if="createError"
              color="error"
              variant="soft"
              icon="i-lucide-alert-circle"
              :title="createError"
            />

            <template v-if="createWizardStep === 1">
              <div class="space-y-5">
                <div class="flex flex-wrap gap-2">
                  <UButton
                    type="button"
                    :color="createMode === 'manual' ? 'primary' : 'neutral'"
                    :variant="createMode === 'manual' ? 'solid' : 'outline'"
                    icon="i-lucide-pencil-line"
                    @click="setCreateMode('manual')"
                  >
                    Manual Entry
                  </UButton>
                  <UButton
                    type="button"
                    :color="createMode === 'analyze' ? 'primary' : 'neutral'"
                    :variant="createMode === 'analyze' ? 'solid' : 'outline'"
                    icon="i-lucide-flask-conical"
                    @click="setCreateMode('analyze')"
                  >
                    Analyze First
                  </UButton>
                </div>

                <UCard
                  v-if="createMode === 'analyze'"
                  :ui="{ body: 'p-4 sm:p-5' }"
                  class="border border-gray-200/70 bg-gray-50/60 shadow-sm dark:border-white/10 dark:bg-white/5"
                >
                  <div class="space-y-4">
                    <UFormField
                      label="Recipe Text"
                      required
                    >
                      <UTextarea
                        v-model="createAnalysisInput"
                        :rows="7"
                        placeholder="Paste a full recipe with ingredients and instructions"
                        class="w-full"
                      />
                    </UFormField>

                    <div class="flex flex-wrap items-center justify-end gap-3">
                      <UAlert
                        v-if="createAnalysisError"
                        color="error"
                        variant="soft"
                        icon="i-lucide-alert-circle"
                        :title="createAnalysisError"
                        class="min-w-0 flex-1"
                      />

                      <UButton
                        color="primary"
                        icon="i-lucide-flask-conical"
                        :loading="createAnalysisLoading"
                        :disabled="createAnalysisLoading || !createAnalysisInput.trim()"
                        @click="runCreateRecipeAnalysis"
                      >
                        Analyze Recipe
                      </UButton>
                    </div>

                    <div
                      v-if="createAnalysisResult"
                      class="grid gap-3 sm:grid-cols-3"
                    >
                      <div class="rounded-xl border border-gray-200/80 bg-white/90 px-4 py-3 dark:border-white/10 dark:bg-zinc-950/50">
                        <p class="text-[11px] uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                          Title
                        </p>
                        <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                          {{ createForm.title || createAnalysisResult.title || 'Untitled recipe' }}
                        </p>
                      </div>

                      <div class="rounded-xl border border-gray-200/80 bg-white/90 px-4 py-3 dark:border-white/10 dark:bg-zinc-950/50">
                        <p class="text-[11px] uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                          Ingredients
                        </p>
                        <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                          {{ createForm.ingredients.length }}
                        </p>
                      </div>

                      <div class="rounded-xl border border-gray-200/80 bg-white/90 px-4 py-3 dark:border-white/10 dark:bg-zinc-950/50">
                        <p class="text-[11px] uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                          Steps
                        </p>
                        <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                          {{ createForm.instructions.length }}
                        </p>
                      </div>
                    </div>
                  </div>
                </UCard>

                <UCard
                  :ui="{ body: 'p-4 sm:p-5' }"
                  class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
                >
                  <div class="space-y-4">
                    <div class="flex items-center justify-between gap-3">
                      <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
                        Recipe Basics
                      </h4>

                      <UBadge
                        v-if="createMode === 'analyze' && createHasFreshAnalysis"
                        color="success"
                        variant="soft"
                      >
                        Analysis Ready
                      </UBadge>
                    </div>

                    <UFormField
                      label="Recipe Title"
                      required
                    >
                      <UInput
                        v-model="createForm.title"
                        placeholder="e.g. Lemon herb roasted salmon"
                        class="w-full"
                      />
                    </UFormField>

                    <div class="grid gap-4 sm:grid-cols-3">
                      <UFormField
                        label="Region"
                        required
                      >
                        <UInput
                          v-model="createForm.region"
                          placeholder="e.g. US"
                          class="w-full"
                        />
                      </UFormField>

                      <UFormField
                        label="Duration"
                        required
                      >
                        <UInput
                          v-model="createForm.duration"
                          type="number"
                          min="1"
                          placeholder="e.g. 35"
                          class="w-full"
                        />
                      </UFormField>

                      <UFormField
                        label="Serves"
                        required
                      >
                        <UInput
                          v-model="createForm.serves"
                          type="number"
                          min="1"
                          placeholder="e.g. 4"
                          class="w-full"
                        />
                      </UFormField>
                    </div>
                  </div>
                </UCard>
              </div>
            </template>

            <template v-else-if="createWizardStep === 2">
              <div class="space-y-5">
                <UCard
                  :ui="{ body: 'p-4 sm:p-5', header: 'p-4 sm:p-5' }"
                  class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
                >
                  <template #header>
                    <div class="flex items-center justify-between gap-3">
                      <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
                        Ingredients
                      </h4>

                      <UBadge
                        color="neutral"
                        variant="outline"
                      >
                        {{ createForm.ingredients.length }}
                      </UBadge>
                    </div>
                  </template>

                  <ConsoleRecipesIngredientListEditor
                    :model-value="createForm.ingredients"
                    @update:model-value="value => createForm.ingredients = value"
                  />
                </UCard>

                <UCard
                  :ui="{ body: 'p-4 sm:p-5', header: 'p-4 sm:p-5' }"
                  class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
                >
                  <template #header>
                    <div class="flex items-center justify-between gap-3">
                      <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
                        Instructions
                      </h4>

                      <UBadge
                        color="neutral"
                        variant="outline"
                      >
                        {{ createForm.instructions.length }}
                      </UBadge>
                    </div>
                  </template>

                  <ConsoleRecipesInstructionStepsEditor
                    :model-value="createForm.instructions"
                    @update:model-value="value => createForm.instructions = value"
                  />
                </UCard>
              </div>
            </template>

            <template v-else>
              <div class="space-y-5">
                <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div class="rounded-xl border border-gray-200/80 bg-gray-50/80 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                    <p class="text-[11px] uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                      Recipe
                    </p>
                    <p class="mt-1 truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {{ createForm.title || 'Untitled recipe' }}
                    </p>
                  </div>

                  <div class="rounded-xl border border-gray-200/80 bg-gray-50/80 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                    <p class="text-[11px] uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                      Ingredients
                    </p>
                    <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                      {{ buildCreateIngredients().length }}
                    </p>
                  </div>

                  <div class="rounded-xl border border-gray-200/80 bg-gray-50/80 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                    <p class="text-[11px] uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                      Steps
                    </p>
                    <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                      {{ buildCreateInstructions().length }}
                    </p>
                  </div>

                  <div class="rounded-xl border border-gray-200/80 bg-gray-50/80 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                    <p class="text-[11px] uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                      Serves / Duration
                    </p>
                    <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                      {{ createForm.serves || '—' }} / {{ createForm.duration || '—' }} min
                    </p>
                  </div>
                </div>

                <div class="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                  <UCard
                    :ui="{ body: 'p-4 sm:p-5', header: 'p-4 sm:p-5' }"
                    class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
                  >
                    <template #header>
                      <div class="flex items-start justify-between gap-3">
                        <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
                          Recipe Image
                        </h4>

                        <UButton
                          type="button"
                          color="neutral"
                          variant="outline"
                          size="sm"
                          icon="i-lucide-upload"
                          :loading="createImageUploading"
                          @click="triggerCreateImageUpload"
                        >
                          Upload
                        </UButton>
                      </div>
                    </template>

                    <div class="space-y-4">
                      <input
                        :key="createImageInputKey"
                        ref="createImageInput"
                        type="file"
                        accept="image/png,image/jpeg"
                        class="hidden"
                        @change="handleCreateImageSelection"
                      >

                      <UFormField label="Image URL">
                        <UInput
                          v-model="createForm.imageUrl"
                          placeholder="https://..."
                          class="w-full"
                        />
                      </UFormField>

                      <UAlert
                        v-if="createImageError"
                        color="error"
                        variant="soft"
                        icon="i-lucide-alert-circle"
                        :title="createImageError"
                      />

                      <div class="overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-white/80 dark:border-white/10 dark:bg-zinc-950/40">
                        <img
                          v-if="createPreviewImageUrl"
                          :src="createPreviewImageUrl"
                          alt="Recipe preview"
                          class="aspect-[4/3] w-full object-cover"
                          referrerpolicy="no-referrer"
                        >
                        <div
                          v-else
                          class="flex aspect-[4/3] items-center justify-center px-4 text-center text-sm text-gray-500 dark:text-gray-400"
                        >
                          No image linked
                        </div>
                      </div>
                    </div>
                  </UCard>

                  <UCard
                    :ui="{ body: 'p-4 sm:p-5', header: 'p-4 sm:p-5' }"
                    class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
                  >
                    <template #header>
                      <div class="flex items-center justify-between gap-3">
                        <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
                          Tags & Allergens
                        </h4>
                        <UBadge v-if="createForm.nutrientsFromAnalysis" color="success" variant="soft" size="sm">
                          Auto-extracted
                        </UBadge>
                      </div>
                    </template>

                    <div class="space-y-5">
                      <!-- Tags token input -->
                      <UFormField label="Tags">
                        <div class="space-y-2">
                          <div class="flex gap-2">
                            <UInput
                              v-model="createForm.tagDraft"
                              placeholder="Type a tag and press Enter"
                              class="flex-1"
                              @keydown.enter.prevent="() => { const t = createForm.tagDraft.trim(); if (t && !createForm.tags.map(x => x.toLowerCase()).includes(t.toLowerCase())) createForm.tags.push(t); createForm.tagDraft = '' }"
                            />
                            <UButton type="button" color="neutral" variant="outline" icon="i-lucide-plus"
                              :disabled="!createForm.tagDraft.trim()"
                              @click="() => { const t = createForm.tagDraft.trim(); if (t && !createForm.tags.map(x => x.toLowerCase()).includes(t.toLowerCase())) createForm.tags.push(t); createForm.tagDraft = '' }"
                            />
                          </div>
                          <div v-if="createForm.tags.length" class="flex flex-wrap gap-1.5">
                            <span v-for="(tag, idx) in createForm.tags" :key="`ctag-${idx}`"
                              class="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:border-blue-700/40 dark:bg-blue-900/20 dark:text-blue-300"
                            >
                              {{ tag }}
                              <button type="button" class="ml-0.5 flex items-center justify-center rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800/40"
                                @click="createForm.tags.splice(idx, 1)"
                              >
                                <UIcon name="i-lucide-x" class="h-3 w-3" />
                              </button>
                            </span>
                          </div>
                          <p v-else class="text-xs text-gray-400 dark:text-gray-500">No tags added</p>
                        </div>
                      </UFormField>

                      <!-- Allergens token input -->
                      <UFormField label="Allergens">
                        <div class="space-y-2">
                          <div class="flex gap-2">
                            <UInput
                              v-model="createForm.allergenDraft"
                              placeholder="Type an allergen and press Enter"
                              class="flex-1"
                              @keydown.enter.prevent="() => { const a = createForm.allergenDraft.trim(); if (a && !createForm.allergens.map(x => x.toLowerCase()).includes(a.toLowerCase())) createForm.allergens.push(a); createForm.allergenDraft = '' }"
                            />
                            <UButton type="button" color="neutral" variant="outline" icon="i-lucide-plus"
                              :disabled="!createForm.allergenDraft.trim()"
                              @click="() => { const a = createForm.allergenDraft.trim(); if (a && !createForm.allergens.map(x => x.toLowerCase()).includes(a.toLowerCase())) createForm.allergens.push(a); createForm.allergenDraft = '' }"
                            />
                          </div>
                          <div v-if="createForm.allergens.length" class="flex flex-wrap gap-1.5">
                            <span v-for="(allergen, idx) in createForm.allergens" :key="`callergen-${idx}`"
                              class="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300"
                            >
                              {{ allergen }}
                              <button type="button" class="ml-0.5 flex items-center justify-center rounded-full p-0.5 hover:bg-amber-200 dark:hover:bg-amber-800/40"
                                @click="createForm.allergens.splice(idx, 1)"
                              >
                                <UIcon name="i-lucide-x" class="h-3 w-3" />
                              </button>
                            </span>
                          </div>
                          <p v-else class="text-xs text-gray-400 dark:text-gray-500">No allergens added</p>
                        </div>
                      </UFormField>
                    </div>
                  </UCard>
                </div>

                <!-- Nutrition card -->
                <UCard
                  :ui="{ body: 'p-4 sm:p-5', header: 'p-4 sm:p-5' }"
                  class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
                >
                  <template #header>
                    <div class="flex items-center justify-between gap-3">
                      <div>
                        <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
                          Nutrition <span class="font-normal text-gray-400">(per serving, optional)</span>
                        </h4>
                        <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {{ createForm.nutrientsFromAnalysis ? 'Pre-filled from analysis — review and adjust if needed. Providing values skips re-profiling on save.' : 'Leave blank to let the API auto-calculate from ingredients.' }}
                        </p>
                      </div>
                      <UBadge v-if="createForm.nutrientsFromAnalysis" color="success" variant="soft" size="sm">
                        From analysis
                      </UBadge>
                    </div>
                  </template>

                  <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <UFormField label="Energy (kcal)">
                      <UInput v-model="createForm.energy_kcal" type="number" min="0" step="0.01" placeholder="e.g. 450" class="w-full" />
                    </UFormField>
                    <UFormField label="Protein (g)">
                      <UInput v-model="createForm.protein_g" type="number" min="0" step="0.01" placeholder="e.g. 32" class="w-full" />
                    </UFormField>
                    <UFormField label="Carbs (g)">
                      <UInput v-model="createForm.carbohydrate_g" type="number" min="0" step="0.01" placeholder="e.g. 55" class="w-full" />
                    </UFormField>
                    <UFormField label="Fat (g)">
                      <UInput v-model="createForm.fat_g" type="number" min="0" step="0.01" placeholder="e.g. 18" class="w-full" />
                    </UFormField>
                    <UFormField label="Sugar (g)">
                      <UInput v-model="createForm.sugar_g" type="number" min="0" step="0.01" placeholder="e.g. 8" class="w-full" />
                    </UFormField>
                    <UFormField label="Saturated fat (g)">
                      <UInput v-model="createForm.saturated_fat_g" type="number" min="0" step="0.01" placeholder="e.g. 4" class="w-full" />
                    </UFormField>
                    <UFormField label="Sodium (mg)">
                      <UInput v-model="createForm.sodium_mg" type="number" min="0" step="0.01" placeholder="e.g. 600" class="w-full" />
                    </UFormField>
                    <UFormField label="Fibre (g)">
                      <UInput v-model="createForm.fibre_g" type="number" min="0" step="0.01" placeholder="e.g. 5" class="w-full" />
                    </UFormField>
                  </div>
                </UCard>
              </div>
            </template>
          </div>

          <template #footer>
            <div class="flex flex-wrap justify-end gap-3">
              <UButton
                color="neutral"
                variant="ghost"
                :disabled="createWizardBusy"
                @click="closeCreateRecipeModal"
              >
                Cancel
              </UButton>

              <UButton
                v-if="createWizardStep > 1"
                color="neutral"
                variant="ghost"
                :disabled="createWizardBusy"
                @click="goBackCreateWizard"
              >
                Back
              </UButton>

              <UButton
                color="primary"
                :loading="createPrimaryActionLoading"
                :disabled="createWizardBusy && !createPrimaryActionLoading"
                @click="handleCreateWizardPrimaryAction"
              >
                {{ createPrimaryActionLabel }}
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import type {
  CreateRecipeRequest,
  RecipeAutocompleteSuggestion,
  RecipeProfileResult,
  RecipeSearchResult
} from '~/services/recipeApi'
import recipeApi from '~/services/recipeApi'
import {
  buildConsoleRecipeRoutePath,
  normalizeRecipeImageUrl,
  resolveConsoleRecipeErrorMessage,
  resolveRecipeIdentifier
} from '~/utils/consoleRecipes'

type EditableIngredient = {
  name: string
  measurement: string
}

type CreateRecipeMode = 'manual' | 'analyze'

definePageMeta({
  layout: 'default'
})

useHead({
  title: 'Recipes'
})

useSeoMeta({
  description: 'Wisefood recipe management workspace for internal content operations'
})

const toast = useToast()
const router = useRouter()

const recipes = ref<RecipeSearchResult[]>([])
const recipesLoading = ref(false)
const recipesError = ref<string | null>(null)
const searchBoxRef = ref<HTMLElement | null>(null)
const autocompleteSuggestions = ref<RecipeAutocompleteSuggestion[]>([])
const autocompleteLoading = ref(false)
const showAutocomplete = ref(false)
const activeAutocompleteIndex = ref(-1)
const activeRecipeResultIndex = ref(-1)
let autocompleteDebounceTimer: ReturnType<typeof setTimeout> | null = null
let autocompleteRequestSequence = 0

const filters = reactive({
  q: ''
})

const itemsPerPage = 25
const currentPage = ref(1)
const totalCount = ref(0)
const hasMore = ref(false)
const isNlSearch = ref(false)

const createModalOpen = ref(false)
const createPending = ref(false)
const createError = ref<string | null>(null)
const createImageUploading = ref(false)
const createImageError = ref<string | null>(null)
const createImageInput = ref<HTMLInputElement | null>(null)
const createImageInputKey = ref(0)
const createWizardStep = ref(1)
const createMode = ref<CreateRecipeMode>('manual')
const createAnalysisInput = ref('')
const createAnalysisLoading = ref(false)
const createAnalysisError = ref<string | null>(null)
const createAnalysisResult = ref<RecipeProfileResult | null>(null)
const createAnalysisSignature = ref('')

const createForm = reactive({
  title: '',
  region: 'US',
  duration: '30',
  serves: '4',
  ingredients: [] as EditableIngredient[],
  instructions: [] as string[],
  imageUrl: '',
  tags: [] as string[],
  allergens: [] as string[],
  tagDraft: '',
  allergenDraft: '',
  // Nutrients — populated from analysis, editable by user
  protein_g: '',
  carbohydrate_g: '',
  fat_g: '',
  energy_kcal: '',
  sugar_g: '',
  saturated_fat_g: '',
  sodium_mg: '',
  fibre_g: '',
  nutrientsFromAnalysis: false
})

const recipeColumns = [
  { accessorKey: 'title', header: 'Recipe' },
  { accessorKey: 'duration', header: 'Duration' },
  { accessorKey: 'serves', header: 'Serves' },
  { accessorKey: 'nutri_score', header: 'Nutri-Score' },
  { id: 'actions', header: '', enableSorting: false }
]

const recipeTableUi = {
  th: 'px-3 py-2 text-xs',
  td: 'px-3 py-2 align-middle',
  tr: 'cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors'
}

const createWizardSteps = [
  {
    step: 1,
    title: 'Start'
  },
  {
    step: 2,
    title: 'Structure'
  },
  {
    step: 3,
    title: 'Finish'
  }
]

const breadcrumbItems = [
  {
    label: 'Console',
    icon: 'i-lucide-panel-top',
    to: '/console'
  },
  {
    label: 'Asset Manager',
    icon: 'i-lucide-folder-open',
    to: '/console/assets'
  },
  {
    label: 'Recipes',
    icon: 'i-lucide-utensils-crossed'
  }
]

const hasActiveFilters = computed(() => Boolean(filters.q.trim()))

const totalPages = computed(() => {
  if (isNlSearch.value || totalCount.value === 0) return 0
  return Math.ceil(totalCount.value / itemsPerPage)
})

const visiblePages = computed(() => {
  if (totalPages.value === 0) return []
  const win = 2
  const start = Math.max(1, currentPage.value - win)
  const end = Math.min(totalPages.value, currentPage.value + win)
  const pages = []
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const resultCountLabel = computed(() => {
  if (totalCount.value > 0 && !isNlSearch.value) {
    return `${totalCount.value.toLocaleString()} recipes`
  }
  return recipes.value.length === 1 ? '1 recipe shown' : `${recipes.value.length.toLocaleString()} recipes shown`
})

const resultSummary = computed(() => {
  if (recipesLoading.value) return 'Loading recipes...'
  if (!recipes.value.length) return 'No recipes are currently visible in the library view.'

  if (isNlSearch.value) {
    return `Showing ${recipes.value.length.toLocaleString()} results for "${filters.q.trim()}".`
  }

  const offset = (currentPage.value - 1) * itemsPerPage
  const from = offset + 1
  const to = offset + recipes.value.length
  const total = totalCount.value > 0 ? ` of ${totalCount.value.toLocaleString()}` : ''
  return `Showing ${from}–${to}${total} recipes.`
})

const createPreviewImageUrl = computed(() => normalizeRecipeImageUrl(createForm.imageUrl))
const createCurrentAnalysisSignature = computed(() => {
  return `${normalizeRecipeRegion(createForm.region)}::${createAnalysisInput.value.trim()}`
})
const createHasFreshAnalysis = computed(() => {
  return Boolean(createAnalysisResult.value && createAnalysisSignature.value === createCurrentAnalysisSignature.value)
})
const createWizardBusy = computed(() => {
  return createPending.value || createAnalysisLoading.value || createImageUploading.value
})
const createPrimaryActionLabel = computed(() => {
  if (createWizardStep.value === 1) {
    return createMode.value === 'analyze' && !createHasFreshAnalysis.value
      ? 'Analyze & Continue'
      : 'Continue'
  }

  if (createWizardStep.value === 2) {
    return 'Review Finish'
  }

  return 'Create Recipe'
})
const createPrimaryActionLoading = computed(() => {
  if (createWizardStep.value === 1) {
    return createAnalysisLoading.value
  }

  if (createWizardStep.value === 3) {
    return createPending.value
  }

  return false
})

function compactRecipeMeta(recipe: RecipeSearchResult) {
  const source = String(recipe.source || '').trim() || 'RecipeWrangler'
  const parts = [source]

  if (recipe.duration) {
    parts.push(`${recipe.duration} min`)
  }

  if (recipe.serves) {
    parts.push(`Serves ${recipe.serves}`)
  }

  return parts.join(' · ')
}

function formatDuration(value?: number | null) {
  return value ? `${value} min` : '—'
}

function formatServes(value?: number | null) {
  return value ? `${value}` : '—'
}

function formatNutriScore(value?: number | null) {
  return value === null || value === undefined ? '—' : String(value)
}

function resetCreateForm() {
  createWizardStep.value = 1
  createMode.value = 'manual'
  createForm.title = ''
  createForm.region = 'US'
  createForm.duration = '30'
  createForm.serves = '4'
  createForm.ingredients = [
    {
      measurement: '',
      name: ''
    }
  ]
  createForm.instructions = ['']
  createForm.imageUrl = ''
  createForm.tags = []
  createForm.allergens = []
  createForm.tagDraft = ''
  createForm.allergenDraft = ''
  createForm.protein_g = ''
  createForm.carbohydrate_g = ''
  createForm.fat_g = ''
  createForm.energy_kcal = ''
  createForm.sugar_g = ''
  createForm.saturated_fat_g = ''
  createForm.sodium_mg = ''
  createForm.fibre_g = ''
  createForm.nutrientsFromAnalysis = false
  createAnalysisInput.value = ''
  createAnalysisLoading.value = false
  createAnalysisError.value = null
  createAnalysisResult.value = null
  createAnalysisSignature.value = ''
  createError.value = null
  createImageError.value = null
  createImageInputKey.value += 1
}

function setCreateMode(mode: CreateRecipeMode) {
  createMode.value = mode
  createWizardStep.value = 1
  createError.value = null
  createAnalysisError.value = null
}

function normalizeRecipeRegion(value: string) {
  return String(value || '').trim().toUpperCase() || 'US'
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function compactText(value: unknown) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripListMarker(value: string) {
  return value
    .replace(/^(?:[-*•]\s+|\d+[).:-]?\s+)/, '')
    .trim()
}

function isIngredientsHeading(value: string) {
  return /^(?:ingredients?|what you need)\s*:?\s*$/i.test(value.trim())
}

function isInstructionsHeading(value: string) {
  return /^(?:instructions?|directions?|method|steps?|preparation)\s*:?\s*$/i.test(value.trim())
}

function isLikelySectionHeading(value: string) {
  const normalized = value.trim()
  if (!normalized || isIngredientsHeading(normalized) || isInstructionsHeading(normalized)) {
    return true
  }

  return /^[A-Za-z][A-Za-z/& -]{2,40}:$/.test(normalized)
}

function extractTitleFromRecipeText(rawRecipe: string) {
  const lines = String(rawRecipe || '')
    .split(/\r?\n/)
    .map(line => compactText(line))
    .filter(Boolean)

  return lines.find(line => !isIngredientsHeading(line) && !isInstructionsHeading(line)) || ''
}

function extractIngredientRowsFromRecipeText(rawRecipe: string): EditableIngredient[] {
  const lines = String(rawRecipe || '').split(/\r?\n/)
  const ingredients: EditableIngredient[] = []
  let collecting = false

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      continue
    }

    if (isIngredientsHeading(line)) {
      collecting = true
      continue
    }

    if (!collecting) {
      continue
    }

    if (isInstructionsHeading(line) || isLikelySectionHeading(line)) {
      break
    }

    const cleanedLine = stripListMarker(line)
    if (!cleanedLine) {
      continue
    }

    ingredients.push({
      measurement: '',
      name: cleanedLine
    })
  }

  return ingredients
}

function extractInstructionStepsFromRecipeText(rawRecipe: string): string[] {
  const lines = String(rawRecipe || '').split(/\r?\n/)
  const instructions: string[] = []
  let collecting = false

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      continue
    }

    if (isInstructionsHeading(line)) {
      collecting = true
      continue
    }

    if (!collecting) {
      continue
    }

    if (isIngredientsHeading(line) || isLikelySectionHeading(line)) {
      break
    }

    const cleanedLine = stripListMarker(line)
    if (cleanedLine) {
      instructions.push(cleanedLine)
    }
  }

  if (instructions.length > 0) {
    return instructions
  }

  return String(rawRecipe || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => /^\d+[).:-]?\s+/.test(line))
    .map(stripListMarker)
    .filter(Boolean)
}

function extractServesFromRecipeText(rawRecipe: string) {
  const match = String(rawRecipe || '').match(/\b(?:serves?|yield(?:s)?)\s*[:-]?\s*(\d{1,2})\b/i)
  if (!match) {
    return null
  }

  const parsed = Number.parseInt(match[1], 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function toPositiveWholeNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.round(value)
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value.trim(), 10)
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed
    }
  }

  return null
}

function buildCreateIngredientsFromAnalysis(result: RecipeProfileResult, rawRecipe: string) {
  const ingredientNames = Array.isArray(result.ingredient_names) ? result.ingredient_names : []
  const measurements = Array.isArray(result.measurements) ? result.measurements : []
  const ingredientRows: EditableIngredient[] = []
  const rowCount = Math.max(ingredientNames.length, measurements.length)

  for (let index = 0; index < rowCount; index += 1) {
    const name = compactText(ingredientNames[index])
    const measurement = compactText(measurements[index])

    if (!name && !measurement) {
      continue
    }

    ingredientRows.push({
      name,
      measurement
    })
  }

  if (ingredientRows.length > 0) {
    return ingredientRows
  }

  if (Array.isArray(result.ingredients)) {
    const derivedRows = result.ingredients
      .map((item) => {
        const record = asRecord(item)
        if (!record) {
          return null
        }

        return {
          name: compactText(record.ingredient ?? record.name ?? record.food ?? record.matched_nutritional_ingredient),
          measurement: compactText(record.measurement ?? record.measurement_raw ?? record.quantity)
        }
      })
      .filter((item): item is EditableIngredient => Boolean(item && (item.name || item.measurement)))

    if (derivedRows.length > 0) {
      return derivedRows
    }
  }

  return extractIngredientRowsFromRecipeText(rawRecipe)
}

function roundNutrient(value: number | undefined | null): string {
  if (value == null || !Number.isFinite(value)) return ''
  return String(Math.round(value * 100) / 100)
}

function applyCreateAnalysisToDraft(result: RecipeProfileResult) {
  const rawRecipe = createAnalysisInput.value
  const analyzedTitle = compactText(result.title) || extractTitleFromRecipeText(rawRecipe)
  const analyzedIngredients = buildCreateIngredientsFromAnalysis(result, rawRecipe)
  const analyzedInstructions = (Array.isArray(result.directions) && result.directions.length
    ? result.directions
    : Array.isArray(result.instructions)
      ? result.instructions
      : []
  ).map(step => compactText(step)).filter(Boolean)
    || extractInstructionStepsFromRecipeText(rawRecipe)
  const analyzedServes = toPositiveWholeNumber(result.serves) || extractServesFromRecipeText(rawRecipe)

  if (analyzedTitle) createForm.title = analyzedTitle
  if (analyzedIngredients.length > 0) createForm.ingredients = analyzedIngredients
  if (analyzedInstructions.length > 0) {
    createForm.instructions = analyzedInstructions
  } else if (!buildCreateInstructions().length) {
    createForm.instructions = ['']
  }
  if (analyzedServes) createForm.serves = String(analyzedServes)

  // Populate tags & allergens from analysis
  if (Array.isArray(result.tags) && result.tags.length) {
    createForm.tags = result.tags.map(t => String(t || '').trim()).filter(Boolean)
  }
  if (Array.isArray(result.allergens) && result.allergens.length) {
    createForm.allergens = result.allergens.map(a => String(a || '').trim()).filter(Boolean)
  }

  // Populate nutrients from profiling_totals
  const t = result.profiling_totals || {}
  const protein = t.total_protein_g_per_serving_usda ?? t.total_protein_g_usda
  const carbs = t.total_carbohydrate_g_per_serving_usda ?? t.total_carbohydrate_g_usda
  const fat = t.total_fat_g_per_serving_usda ?? t.total_fat_g_usda
  const kcal = t.total_energy_kcal_per_serving_usda ?? t.total_energy_kcal_usda
  const sugar = t.total_sugar_g_per_serving_usda ?? t.total_sugar_g_usda
  const satFat = t.total_saturated_fat_g_per_serving_usda ?? t.total_saturated_fat_g_usda
  const sodium = t.total_sodium_mg_per_serving_usda ?? t.total_sodium_mg_usda
  const fibre = t.total_fibre_g_per_serving_usda ?? t.total_fibre_g_usda

  createForm.protein_g = roundNutrient(protein)
  createForm.carbohydrate_g = roundNutrient(carbs)
  createForm.fat_g = roundNutrient(fat)
  createForm.energy_kcal = roundNutrient(kcal)
  createForm.sugar_g = roundNutrient(sugar)
  createForm.saturated_fat_g = roundNutrient(satFat)
  createForm.sodium_mg = roundNutrient(sodium)
  createForm.fibre_g = roundNutrient(fibre)
  createForm.nutrientsFromAnalysis = true
}

function clearAutocomplete() {
  autocompleteRequestSequence += 1

  if (autocompleteDebounceTimer) {
    clearTimeout(autocompleteDebounceTimer)
    autocompleteDebounceTimer = null
  }

  autocompleteSuggestions.value = []
  autocompleteLoading.value = false
  showAutocomplete.value = false
  activeAutocompleteIndex.value = -1
}

async function fetchAutocompleteSuggestions(query: string) {
  const normalizedQuery = query.trim()
  if (normalizedQuery.length < 2) {
    clearAutocomplete()
    return
  }

  const requestSequence = ++autocompleteRequestSequence
  autocompleteLoading.value = true
  autocompleteSuggestions.value = []
  showAutocomplete.value = true
  activeAutocompleteIndex.value = -1

  try {
    const suggestions = await recipeApi.autocompleteManagedRecipes(normalizedQuery, 8)
    if (requestSequence !== autocompleteRequestSequence) {
      return
    }

    if (filters.q.trim() !== normalizedQuery) {
      return
    }

    autocompleteSuggestions.value = suggestions
    showAutocomplete.value = suggestions.length > 0
  } catch {
    if (requestSequence === autocompleteRequestSequence) {
      clearAutocomplete()
    }
  } finally {
    if (requestSequence === autocompleteRequestSequence) {
      autocompleteLoading.value = false
    }
  }
}

function handleSearchInput() {
  const query = filters.q.trim()
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

function handleSearchFocus() {
  if (autocompleteSuggestions.value.length > 0 && filters.q.trim().length >= 2) {
    showAutocomplete.value = true
    return
  }

  handleSearchInput()
}

function handleSearchArrowDown() {
  if (showAutocomplete.value && autocompleteSuggestions.value.length > 0) {
    activeAutocompleteIndex.value = activeAutocompleteIndex.value < autocompleteSuggestions.value.length - 1
      ? activeAutocompleteIndex.value + 1
      : 0
    return
  }

  if (recipes.value.length > 0) {
    activeRecipeResultIndex.value = activeRecipeResultIndex.value < recipes.value.length - 1
      ? activeRecipeResultIndex.value + 1
      : 0
  }
}

function handleSearchArrowUp() {
  if (showAutocomplete.value && autocompleteSuggestions.value.length > 0) {
    activeAutocompleteIndex.value = activeAutocompleteIndex.value > 0
      ? activeAutocompleteIndex.value - 1
      : autocompleteSuggestions.value.length - 1
    return
  }

  if (recipes.value.length > 0) {
    activeRecipeResultIndex.value = activeRecipeResultIndex.value > 0
      ? activeRecipeResultIndex.value - 1
      : recipes.value.length - 1
  }
}

function handleClickOutsideSearch(event: MouseEvent) {
  const target = event.target as Node | null
  if (!target) {
    return
  }

  if (searchBoxRef.value && !searchBoxRef.value.contains(target)) {
    showAutocomplete.value = false
  }
}

async function loadRecipes(page = currentPage.value) {
  activeRecipeResultIndex.value = -1
  recipesLoading.value = true
  recipesError.value = null

  const query = filters.q.trim()
  const offset = (page - 1) * itemsPerPage

  try {
    const results = await recipeApi.searchManagedRecipes(query, itemsPerPage, query ? 0 : offset)
    recipes.value = results
    isNlSearch.value = Boolean(query)
    hasMore.value = !query && results.length === itemsPerPage
  } catch (error) {
    recipes.value = []
    hasMore.value = false
    recipesError.value = resolveConsoleRecipeErrorMessage(error, 'Failed to load recipes')
  } finally {
    recipesLoading.value = false
  }
}

async function goToPage(page: number) {
  currentPage.value = page
  await loadRecipes(page)
}

function refreshRecipes() {
  clearAutocomplete()
  return loadRecipes()
}

function applyFilters() {
  currentPage.value = 1
  clearAutocomplete()
  return loadRecipes(1)
}

function resetFilters() {
  filters.q = ''
  currentPage.value = 1
  clearAutocomplete()
  return loadRecipes(1)
}

async function selectSuggestion(suggestion: RecipeAutocompleteSuggestion) {
  filters.q = suggestion.title
  clearAutocomplete()

  if (suggestion.recipe_id) {
    await router.push(buildConsoleRecipeRoutePath(suggestion.recipe_id))
    return
  }

  await loadRecipes()
  const normalizedTitle = suggestion.title.trim().toLowerCase()
  const exactMatch = recipes.value.find(recipe => recipe.title.trim().toLowerCase() === normalizedTitle)
  const nextRecipe = exactMatch || recipes.value[0]
  if (nextRecipe) {
    await openRecipe(nextRecipe)
  }
}

function handleSearchEnter() {
  if (showAutocomplete.value && autocompleteSuggestions.value.length > 0) {
    const nextSuggestion = autocompleteSuggestions.value[
      activeAutocompleteIndex.value >= 0 ? activeAutocompleteIndex.value : 0
    ]

    if (nextSuggestion) {
      void selectSuggestion(nextSuggestion)
      return
    }
  }

  const nextRecipe = recipes.value[activeRecipeResultIndex.value]
  if (nextRecipe) {
    void openRecipe(nextRecipe)
    return
  }

  void applyFilters()
}

function openRecipe(recipe: RecipeSearchResult) {
  const recipeId = resolveRecipeIdentifier(recipe)
  if (!recipeId) {
    return
  }

  return router.push(buildConsoleRecipeRoutePath(recipeId))
}

function isActiveRecipeRow(recipe: RecipeSearchResult) {
  const activeRecipe = recipes.value[activeRecipeResultIndex.value]
  return Boolean(activeRecipe && resolveRecipeIdentifier(activeRecipe) === resolveRecipeIdentifier(recipe))
}

function handleRecipeRowSelect(_e: Event, row: { original: RecipeSearchResult }) {
  return openRecipe(row.original)
}

function openCreateRecipeModal() {
  resetCreateForm()
  createModalOpen.value = true
}

function closeCreateRecipeModal() {
  createModalOpen.value = false
  createError.value = null
  createImageError.value = null
}

function goBackCreateWizard() {
  if (createWizardStep.value > 1) {
    createWizardStep.value -= 1
  }
}

function triggerCreateImageUpload() {
  createImageInput.value?.click()
}

async function runCreateRecipeAnalysis() {
  const rawRecipe = createAnalysisInput.value.trim()
  if (!rawRecipe) {
    createAnalysisError.value = 'Recipe text is required.'
    return
  }

  createAnalysisLoading.value = true
  createAnalysisError.value = null

  try {
    const region = normalizeRecipeRegion(createForm.region)
    const result = await recipeApi.analyzeRecipe(rawRecipe, region)
    createAnalysisResult.value = result
    createAnalysisSignature.value = createCurrentAnalysisSignature.value
    applyCreateAnalysisToDraft(result)

    toast.add({
      title: 'Analysis loaded',
      description: 'Review the draft and adjust it before creating the recipe.',
      color: 'success'
    })
  } catch (error) {
    createAnalysisResult.value = null
    createAnalysisSignature.value = ''
    createAnalysisError.value = resolveConsoleRecipeErrorMessage(error, 'Failed to analyze recipe')
  } finally {
    createAnalysisLoading.value = false
  }
}

async function handleCreateImageSelection(event: Event) {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]

  if (!file) {
    return
  }

  createImageUploading.value = true
  createImageError.value = null

  try {
    const uploadedImage = await recipeApi.uploadManagedRecipeImage(file)
    createForm.imageUrl = uploadedImage.image_url

    toast.add({
      title: 'Image uploaded',
      description: 'The uploaded image is ready to be linked when you create the recipe.',
      color: 'success'
    })
  } catch (error) {
    createImageError.value = resolveConsoleRecipeErrorMessage(error, 'Failed to upload recipe image')
  } finally {
    createImageUploading.value = false
    createImageInputKey.value += 1
  }
}

function buildCreateIngredients() {
  return createForm.ingredients
    .map((ingredient) => {
      const measurement = ingredient.measurement.trim()
      const name = ingredient.name.trim()
      return [measurement, name].filter(Boolean).join(' ')
    })
    .filter(Boolean)
}

function buildCreateInstructions() {
  return createForm.instructions
    .map(step => step.trim())
    .filter(Boolean)
}

function parseRequiredPositiveInteger(value: string, label: string) {
  const parsed = Number.parseInt(value.trim(), 10)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive whole number.`)
  }

  return parsed
}

function validateCreateBasics() {
  const title = createForm.title.trim()
  const region = normalizeRecipeRegion(createForm.region)

  if (!title) {
    throw new Error('Recipe title is required.')
  }

  if (!region) {
    throw new Error('Region is required.')
  }

  return {
    title,
    region,
    duration: parseRequiredPositiveInteger(createForm.duration, 'Duration'),
    serves: parseRequiredPositiveInteger(createForm.serves, 'Serves')
  }
}

function validateCreateStructure() {
  const ingredients = buildCreateIngredients()
  const instructions = buildCreateInstructions()

  if (!ingredients.length) {
    throw new Error('Add at least one ingredient before continuing.')
  }

  if (!instructions.length) {
    throw new Error('Add at least one instruction before continuing.')
  }

  return {
    ingredients,
    instructions
  }
}

function parseOptionalFloat(value: string): number | undefined {
  const n = parseFloat(value)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

function buildCreatePayload(): CreateRecipeRequest {
  const basics = validateCreateBasics()
  const structure = validateCreateStructure()

  const payload: CreateRecipeRequest = {
    ...basics,
    ...structure,
    image_url: createForm.imageUrl.trim() || undefined,
    tags: createForm.tags.filter(Boolean),
    allergens: createForm.allergens.filter(Boolean),
  }

  // Only send nutrients if at least one is provided (API skips profiling when nutrients present)
  const protein = parseOptionalFloat(createForm.protein_g)
  const carbs = parseOptionalFloat(createForm.carbohydrate_g)
  const fat = parseOptionalFloat(createForm.fat_g)
  const kcal = parseOptionalFloat(createForm.energy_kcal)
  const sugar = parseOptionalFloat(createForm.sugar_g)
  const satFat = parseOptionalFloat(createForm.saturated_fat_g)
  const sodium = parseOptionalFloat(createForm.sodium_mg)
  const fibre = parseOptionalFloat(createForm.fibre_g)

  if ([protein, carbs, fat, kcal].some(v => v !== undefined)) {
    payload.protein_g = protein
    payload.carbohydrate_g = carbs
    payload.fat_g = fat
    payload.energy_kcal = kcal
    payload.sugar_g = sugar
    payload.saturated_fat_g = satFat
    payload.sodium_mg = sodium
    payload.fibre_g = fibre
  }

  return payload
}

async function ensureCreateAnalysisReady() {
  if (createMode.value !== 'analyze') {
    return true
  }

  if (createHasFreshAnalysis.value) {
    return true
  }

  await runCreateRecipeAnalysis()
  return createHasFreshAnalysis.value
}

async function handleCreateWizardPrimaryAction() {
  createError.value = null

  try {
    if (createWizardStep.value === 1) {
      const analysisReady = await ensureCreateAnalysisReady()
      if (!analysisReady) {
        return
      }

      validateCreateBasics()
      createWizardStep.value = 2
      return
    }

    if (createWizardStep.value === 2) {
      validateCreateStructure()
      createWizardStep.value = 3
      return
    }

    await createRecipeRecord()
  } catch (error) {
    createError.value = resolveConsoleRecipeErrorMessage(error, 'Failed to prepare recipe')
  }
}

async function createRecipeRecord() {
  createPending.value = true
  createError.value = null

  try {
    const payload = buildCreatePayload()
    const createdRecipe = await recipeApi.createManagedRecipe(payload)
    const recipeId = resolveRecipeIdentifier(createdRecipe)

    toast.add({
      title: 'Recipe created',
      description: `${createdRecipe.title} is ready for editing.`,
      color: 'success'
    })

    createModalOpen.value = false
    await loadRecipes()

    if (recipeId) {
      await router.push(buildConsoleRecipeRoutePath(recipeId))
    }
  } catch (error) {
    createError.value = resolveConsoleRecipeErrorMessage(error, 'Failed to create recipe')
  } finally {
    createPending.value = false
  }
}

onMounted(() => {
  resetCreateForm()
  if (import.meta.client) {
    document.addEventListener('click', handleClickOutsideSearch)
  }
  void Promise.all([
    loadRecipes(),
    recipeApi.getRecipeCount().then(n => { totalCount.value = n }).catch(() => {})
  ])
})

onBeforeUnmount(() => {
  clearAutocomplete()

  if (import.meta.client) {
    document.removeEventListener('click', handleClickOutsideSearch)
  }
})
</script>
