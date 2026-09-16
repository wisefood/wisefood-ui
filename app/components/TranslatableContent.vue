<template>
  <!-- translate="yes" re-enables machine translation inside the layout root,
       which is translate="no". Per the HTML spec the attribute is inherited,
       so wrapping a region here is the only way content becomes translatable
       and the hand-written interface translations are never touched.

       Wrap settled TEXT only. Google Translate swaps text nodes in place and
       Vue holds references to them, so what matters is whether Vue will later
       replace those same nodes. Toggling a class or an attribute on an
       ancestor is fine — the recipe instructions carry a click handler and are
       safe — but a list that streams, filters, re-sorts or re-keys its items
       will throw NotFoundError on the next patch. Do not wrap search results
       or a streaming answer. See composables/useGoogleTranslate.ts. -->
  <div translate="yes">
    <slot />
  </div>
</template>
