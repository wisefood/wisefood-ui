<template>
    <div class="response-container p-3 rounded border bg-transparent">
        <div v-html="formattedResponse" class="response-text mb-2"></div>

        <div v-if="facts && facts.length" class="facts-section mt-2">
            <div
                v-for="(fact, index) in facts.slice(0, 2)"
                :key="index"
                class="fact-box alert alert-info p-2 mb-2"
            >
                {{ fact }}
            </div>
        </div>

        <div v-if="references && references.length" class="references-section mt-2">
            <small class="text-muted">
                <em>References:</em>
                <ul class="list-unstyled mb-0">
                    <li v-for="(reference, index) in references" :key="index">
                        <em>{{ reference }}</em>
                    </li>
                </ul>
            </small>
        </div>
    </div>
</template>

<script>
import DOMPurify from "dompurify";
import { marked } from "marked";

export default {
    name: "ChatResponse",
    props: {
        response: {
            type: String,
            required: true,
        },
        facts: {
            type: Array,
            default: () => [],
        },
        references: {
            type: Array,
            default: () => [],
        },
    },
    computed: {
        formattedResponse() {
            // Render Markdown and sanitize the resulting HTML
            const rawHtml = marked(this.response);
            return DOMPurify.sanitize(rawHtml);
        },
    },
};
</script>

<style scoped>
.response-container {
    max-width: 100%;
    word-wrap: break-word;
}

.response-text {
    font-size: 1rem;
    line-height: 1.5;
}

.fact-box {
    font-size: 0.875rem;
}

.references-section {
    font-size: 0.75rem;
}
</style>