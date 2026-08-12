<template>
  <div class="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
    <main class="max-w-3xl mx-auto px-6 py-12">
      <h1 class="text-3xl font-semibold mb-2">Privacy notice</h1>
      <p class="text-sm text-zinc-600 dark:text-zinc-400 mb-8">Last updated: 12 August 2026</p>

      <!-- Anything a lawyer must supply is marked, rather than invented. -->
      <div class="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 mb-8 text-sm text-amber-900 dark:text-amber-200">
        <p class="font-medium">Pending legal review</p>
        <p class="mt-1">
          The data inventory below is accurate and maintained against the code. The
          controller identity, legal bases, retention periods and complaint route
          are marked <strong>[TO BE COMPLETED]</strong> and must be filled in by the
          project before this page is presented as the operative policy.
        </p>
      </div>

      <section class="space-y-3 mb-10">
        <h2 class="text-xl font-semibold">Who processes your data</h2>
        <p class="leading-7 text-zinc-700 dark:text-zinc-300">
          WiseFood is a research platform. Controller: <strong>[TO BE COMPLETED]</strong>.
          Contact for data protection questions: <strong>[TO BE COMPLETED]</strong>.
          Legal basis for the processing described here: <strong>[TO BE COMPLETED]</strong>
          (consent is recorded in-product when you first sign in).
        </p>
      </section>

      <section class="space-y-4 mb-10">
        <h2 class="text-xl font-semibold">What we store, and why</h2>
        <p class="leading-7 text-zinc-700 dark:text-zinc-300">
          Everything below is stored per household member, keyed to an internal id.
          You can see and change all of it from
          <ULink to="/my-profile" class="text-primary-600 dark:text-primary-400 hover:underline">your profile</ULink>.
        </p>

        <div class="overflow-x-auto">
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr class="text-left border-b border-zinc-200 dark:border-zinc-800">
                <th class="py-2 pr-4 font-semibold">Data</th>
                <th class="py-2 pr-4 font-semibold">Why</th>
                <th class="py-2 font-semibold">How to remove it</th>
              </tr>
            </thead>
            <tbody class="align-top">
              <tr
                v-for="row in inventory"
                :key="row.data"
                class="border-b border-zinc-100 dark:border-zinc-900"
              >
                <td class="py-3 pr-4 font-medium">{{ row.data }}</td>
                <td class="py-3 pr-4 text-zinc-700 dark:text-zinc-300">{{ row.why }}</td>
                <td class="py-3 text-zinc-700 dark:text-zinc-300">{{ row.removal }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="space-y-3 mb-10">
        <h2 class="text-xl font-semibold">Nothing is learned about you silently</h2>
        <p class="leading-7 text-zinc-700 dark:text-zinc-300">
          When a conversation suggests a lasting preference — a dislike, an
          allergy, a health goal — WiseFood asks before storing it. Declining is
          remembered too, so you are not asked again. Every stored fact carries the
          app it came from, the date, and what you said that led to it, and can be
          corrected or deleted individually.
        </p>
      </section>

      <section class="space-y-3 mb-10">
        <h2 class="text-xl font-semibold">Language models</h2>
        <p class="leading-7 text-zinc-700 dark:text-zinc-300">
          Answers, meal plans and recipe adaptations are produced with the help of
          third-party language models, which receive the parts of your profile
          relevant to the request. Each request is logged for debugging and cost
          tracking. <strong>Your data is not used to train models.</strong> Model
          provider and processing location: <strong>[TO BE COMPLETED]</strong>.
        </p>
        <p class="leading-7 text-zinc-700 dark:text-zinc-300">
          Nutrition answers are general information from published sources — dietary
          guidelines and scientific literature — and are not individualised medical
          or dietetic advice.
        </p>
      </section>

      <section class="space-y-3 mb-10">
        <h2 class="text-xl font-semibold">Guest sessions</h2>
        <p class="leading-7 text-zinc-700 dark:text-zinc-300">
          You can use WiseFood without registering. A guest session is a sandbox
          with its own household, isolated from every other user, and it is deleted
          automatically when it expires. You can also erase it immediately with
          “Erase my data now” in the guest banner.
        </p>
      </section>

      <section class="space-y-3 mb-10">
        <h2 class="text-xl font-semibold">Deleting your data</h2>
        <p class="leading-7 text-zinc-700 dark:text-zinc-300">
          Your profile page offers three scopes: delete one profile, delete the
          whole household with every profile in it, or delete your account and
          everything stored under it. All three take effect immediately.
        </p>
        <p class="leading-7 text-zinc-700 dark:text-zinc-300">
          Two things survive account deletion. The first is the dated note that you
          accepted these terms, including its version and the IP address it came
          from — the evidence that the processing which already happened was
          permitted; once the account is gone it refers to an identifier that no
          longer identifies a person. The second is the model request logs in our
          observability system, which are keyed to an internal member id and are not
          currently reached by the deletion flow. Retention periods and the erasure
          route for both: <strong>[TO BE COMPLETED]</strong>.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold">Your rights</h2>
        <p class="leading-7 text-zinc-700 dark:text-zinc-300">
          You can access, correct and delete your data directly in the product, as
          described above. For a copy of your data in portable form, for objections
          or restrictions, or to complain to a supervisory authority, see
          <strong>[TO BE COMPLETED]</strong>.
        </p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Privacy' })

/**
 * Kept in step with what the code actually stores — the profile page shows the
 * same inventory next to the controls that act on it.
 */
const inventory = [
  {
    data: 'Account and sign-in',
    why: 'To let you sign in and to keep your household separate from everyone else’s.',
    removal: 'Delete account.'
  },
  {
    data: 'Household and members',
    why: 'So a plan can satisfy everyone eating, not just you.',
    removal: 'Delete a profile, the household, or the account.'
  },
  {
    data: 'Profile details: age group, dietary groups, allergies, likes and dislikes, nutrition targets',
    why: 'Allergies and diets filter recipes out entirely; the rest shapes ranking.',
    removal: 'Edit or clear any field on your profile page.'
  },
  {
    data: 'Remembered facts, with their provenance',
    why: 'So you do not have to repeat yourself between apps and sessions.',
    removal: 'Edit or forget each one individually in “What WiseFood remembers”.'
  },
  {
    data: 'Meal plans, favorites, adapted recipes, saved articles',
    why: 'To show you what you planned and saved, and to avoid repeating rejected dishes.',
    removal: 'Removed with the profile they belong to.'
  },
  {
    data: 'Conversations in FoodChat, and Q&A sessions in FoodScholar',
    why: 'To keep context within a conversation and let you return to it.',
    removal: 'Chat threads are deleted with the profile; Q&A sessions expire on their own.'
  },
  {
    data: 'Model request logs (prompt, response, tokens, cost, latency)',
    why: 'Debugging, cost control and measuring answer quality.',
    removal: 'Held in our observability system, keyed to your member id. These are NOT removed by account deletion today. Retention period and erasure route: [TO BE COMPLETED].'
  },
  {
    data: 'Consent record: date, version, IP address',
    why: 'Evidence that we were permitted to process your data.',
    removal: 'Retained after account deletion, in a form that no longer identifies you.'
  }
]
</script>
