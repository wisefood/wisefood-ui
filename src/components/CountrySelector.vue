<template>
  <div class="mb-3">
    <label class="form-label">Country (EU)</label>
    <select
      id="select-countries"
      ref="countrySelectEl"
      class="form-select"
      tabindex="-1"
    >
    </select>
  </div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import TomSelect from "tom-select";

type CountryOption = {
  value: string;
  text: string;
  customProperties: string;
};

type RenderData = { customProperties?: string; text: string };

const flagIcon = (countryCode: string) =>
  `<span class="flag flag-xs flag-country-${countryCode}"></span>`;

const EU_COUNTRIES: CountryOption[] = [
  { value: "at", text: "Austria", customProperties: flagIcon("at") },
  { value: "be", text: "Belgium", customProperties: flagIcon("be") },
  { value: "bg", text: "Bulgaria", customProperties: flagIcon("bg") },
  { value: "hr", text: "Croatia", customProperties: flagIcon("hr") },
  { value: "cy", text: "Cyprus", customProperties: flagIcon("cy") },
  { value: "cz", text: "Czech Republic", customProperties: flagIcon("cz") },
  { value: "dk", text: "Denmark", customProperties: flagIcon("dk") },
  { value: "ee", text: "Estonia", customProperties: flagIcon("ee") },
  { value: "fi", text: "Finland", customProperties: flagIcon("fi") },
  { value: "fr", text: "France", customProperties: flagIcon("fr") },
  { value: "de", text: "Germany", customProperties: flagIcon("de") },
  { value: "gr", text: "Greece", customProperties: flagIcon("gr") },
  { value: "hu", text: "Hungary", customProperties: flagIcon("hu") },
  { value: "ie", text: "Ireland", customProperties: flagIcon("ie") },
  { value: "it", text: "Italy", customProperties: flagIcon("it") },
  { value: "lv", text: "Latvia", customProperties: flagIcon("lv") },
  { value: "lt", text: "Lithuania", customProperties: flagIcon("lt") },
  { value: "lu", text: "Luxembourg", customProperties: flagIcon("lu") },
  { value: "mt", text: "Malta", customProperties: flagIcon("mt") },
  { value: "nl", text: "Netherlands", customProperties: flagIcon("nl") },
  { value: "pl", text: "Poland", customProperties: flagIcon("pl") },
  { value: "pt", text: "Portugal", customProperties: flagIcon("pt") },
  { value: "ro", text: "Romania", customProperties: flagIcon("ro") },
  { value: "rs", text: "Serbia", customProperties: flagIcon("rs") },
  { value: "sk", text: "Slovakia", customProperties: flagIcon("sk") },
  { value: "si", text: "Slovenia", customProperties: flagIcon("si") },
  { value: "es", text: "Spain", customProperties: flagIcon("es") },
  { value: "se", text: "Sweden", customProperties: flagIcon("se") },
];

const countrySelectEl = ref<HTMLSelectElement | null>(null);
let countrySelector: TomSelect | null = null;

onMounted(() => {
  if (!countrySelectEl.value) return;

  countrySelector = new TomSelect(countrySelectEl.value, {
    options: EU_COUNTRIES,
    valueField: "value",
    labelField: "text",
    searchField: ["text", "value"],
    placeholder: "Select your country",
    maxOptions: EU_COUNTRIES.length,
    allowEmptyOption: false,
    dropdownParent: "body",
    render: {
      item: (data: RenderData, escape: (input: string) => string) => {
        if (data.customProperties) {
          return `<div><span class="dropdown-item-indicator">${data.customProperties}</span>${escape(
            data.text
          )}</div>`;
        }
        return `<div>${escape(data.text)}</div>`;
      },
      option: (data: RenderData, escape: (input: string) => string) => {
        if (data.customProperties) {
          return `<div><span class="dropdown-item-indicator">${data.customProperties}</span>${escape(
            data.text
          )}</div>`;
        }
        return `<div>${escape(data.text)}</div>`;
      },
    },
  });
});

onBeforeUnmount(() => {
  countrySelector?.destroy();
  countrySelector = null;
});
</script>

<style scoped>
/* Override TomSelect wrapper to remove Tabler form-select styling */
.ts-wrapper.form-select {
  padding: 0 !important;
  height: auto !important;
  background: transparent !important;
  border: none !important;
}

/* Style the actual control to match Tabler */
.ts-wrapper .ts-control {
  min-height: calc(1.4285714286em + 0.875rem + 2px);
  padding: 0.4375rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.4285714286;
  color: #232e3c;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 5px;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

/* Add dropdown arrow to single select */
.ts-wrapper.single .ts-control {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23232e3c' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 16px 12px;
  padding-right: 2.5rem;
}

/* Keep input visible and functional */
.ts-wrapper.single .ts-control {
  cursor: text;
}

/* Show selected item but allow input to overlay it */
.ts-wrapper.single .ts-control .item {
  position: absolute;
  left: 0.75rem;
  pointer-events: none;
}

/* Make input overlay the selected item */
.ts-wrapper.single .ts-control input {
  position: relative !important;
  z-index: 1;
  background: transparent;
}

/* Hide the item when user is typing */
.ts-wrapper.single.input-active .ts-control .item {
  opacity: 0;
}

/* Show placeholder when no selection */
.ts-wrapper.single:not(.has-items) .ts-control input::placeholder {
  opacity: 1;
}

/* Focus states */
.ts-wrapper .ts-control:hover,
.ts-wrapper.focus .ts-control,
.ts-wrapper.dropdown-active .ts-control {
  border-color: #90b5e2;
  outline: 0;
}

.ts-wrapper.focus .ts-control,
.ts-wrapper.dropdown-active .ts-control {
  box-shadow: 0 0 0 0.25rem rgba(4, 85, 164, 0.25);
}

/* Input styling inside control */
.ts-wrapper .ts-control input {
  color: #232e3c;
  font-size: 0.875rem;
}

.ts-wrapper .ts-control input::placeholder {
  color: #626976;
  opacity: 1;
}

/* Remove default TomSelect caret */
.ts-wrapper.single .ts-control::after {
  display: none !important;
}

/* Dropdown styling - FIXED: prevent page expansion */
.ts-dropdown {
  position: fixed !important;
  margin-top: 4px;
  border: 1px solid #e5e7eb;
  border-radius: 5px;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  background: #ffffff;
  z-index: 1050;
  max-height: 300px !important;
  overflow-y: auto !important;
  overflow-x: hidden;
}

/* Ensure dropdown doesn't cause layout shift */
.ts-wrapper.dropdown-active {
  position: relative;
}

.ts-dropdown .option {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: #232e3c;
  cursor: pointer;
}

.ts-dropdown .option.active {
  background-color: #f4f6fa;
  color: #0455a4;
}

.ts-dropdown .option:hover {
  background-color: #f4f6fa;
}

.ts-dropdown .dropdown-item-indicator {
  margin-right: 0.5rem;
  display: inline-block;
  vertical-align: middle;
}

/* Hide the original select element completely */
select#select-countries {
  display: none !important;
}

/* Ensure selected value shows in input */
.ts-wrapper.single.has-items .ts-control input {
  width: 100% !important;
}
</style>