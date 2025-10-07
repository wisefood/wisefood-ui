<template>
  <v-list-item
    :prepend-icon="fileIcon"
    :class="itemClasses"
    @click="handleClick"
    class="file-list-item"
  >
    <v-list-item-title :class="titleClasses" class="file-title">
      {{ fileName }}
    </v-list-item-title>
    <v-list-item-subtitle v-if="fileSize" class="file-subtitle">
      {{ fileSize }}
    </v-list-item-subtitle>

    <template v-slot:append v-if="showActions">
      <div class="d-flex file-actions">
        <v-btn
          v-if="downloadable"
          icon
          size="small"
          variant="text"
          @click.stop="handleDownload"
          class="file-action-btn download-btn"
        >
          <v-icon color="primary">mdi-download</v-icon>
        </v-btn>
        <v-btn
          v-if="deletable"
          icon
          size="small"
          variant="text"
          @click.stop="handleDelete"
          class="file-action-btn delete-btn"
        >
          <v-icon color="error">mdi-delete</v-icon>
        </v-btn>
      </div>
    </template>
  </v-list-item>
</template>

<script>
export default {
  name: "FileListItem",
  props: {
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: String,
      default: null,
    },
    fileType: {
      type: String,
      default: "file",
    },
    clickable: {
      type: Boolean,
      default: true,
    },
    downloadable: {
      type: Boolean,
      default: false,
    },
    deletable: {
      type: Boolean,
      default: false,
    },
    primary: {
      type: Boolean,
      default: false,
    },
    bordered: {
      type: Boolean,
      default: false,
    },
    elevated: {
      type: Boolean,
      default: false,
    },
    compact: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    fileIcon() {
      const icons = {
        pdf: "mdi-file-pdf-box",
        doc: "mdi-file-word-box",
        docx: "mdi-file-word-box",
        xls: "mdi-file-excel-box",
        xlsx: "mdi-file-excel-box",
        jpg: "mdi-file-image",
        jpeg: "mdi-file-image",
        png: "mdi-file-image",
        gif: "mdi-file-image",
        zip: "mdi-folder-zip",
        rar: "mdi-folder-zip",
        txt: "mdi-file-document",
        csv: "mdi-file-delimited",
        mp4: "mdi-file-video",
        mp3: "mdi-file-music",
        json: "mdi-code-json",
        xml: "mdi-file-xml",
        html: "mdi-language-html5",
        css: "mdi-language-css3",
        js: "mdi-language-javascript",
      };
      return icons[this.fileType.toLowerCase()] || "mdi-file";
    },
    itemClasses() {
      return [
        "file-list-item-base",
        {
          "file-clickable": this.clickable,
          "file-bordered": this.bordered,
          "file-primary": this.primary,
          "file-elevated": this.elevated,
          "file-compact": this.compact,
        },
      ];
    },
    titleClasses() {
      return [
        "file-title-base",
        {
          "file-title-primary": this.primary,
          "file-title-clickable": this.clickable,
        },
      ];
    },
    showActions() {
      return this.downloadable || this.deletable;
    },
  },
  methods: {
    handleClick() {
      if (this.clickable) {
        this.$emit("click", {
          fileName: this.fileName,
          fileType: this.fileType,
        });
      }
    },
    handleDownload() {
      this.$emit("download", {
        fileName: this.fileName,
        fileType: this.fileType,
      });
    },
    handleDelete() {
      this.$emit("delete", {
        fileName: this.fileName,
        fileType: this.fileType,
      });
    },
  },
};
</script>

<style scoped lang="css">
/* Base file list item styles */
.file-list-item {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 8px;
  margin: 2px 0;
}

.file-list-item-base {
  position: relative;
  overflow: hidden;
}

/* Clickable state */
.file-clickable {
  cursor: pointer;
}

.file-clickable:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
  transform: translateX(4px);
}

.file-clickable:active {
  transform: translateX(2px);
  background-color: rgba(var(--v-theme-primary), 0.1);
}

/* Bordered style */
.file-bordered {
  border: 2px solid rgba(var(--v-theme-primary), 0.2);
  border-radius: 12px;
  margin: 4px 0;
}

.file-bordered:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.15);
}

/* Primary style */
.file-primary {
  background: linear-gradient(
    45deg,
    rgba(var(--v-theme-primary), 0.1),
    rgba(var(--v-theme-primary), 0.05)
  );
  border-left: 4px solid rgb(var(--v-theme-primary));
}

/* Elevated style */
.file-elevated {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background-color: rgb(var(--v-theme-surface));
}

.file-elevated:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

/* Compact style */
.file-compact {
  min-height: 48px;
  padding: 8px 16px;
}

.file-compact .file-title {
  font-size: 0.875rem;
  line-height: 1.2;
}

.file-compact .file-subtitle {
  font-size: 0.75rem;
}

/* Title styles */
.file-title-base {
  font-weight: 500;
  transition: color 0.2s ease;
  word-break: break-word;
  line-height: 1.4;
}

.file-title-primary {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}

.file-title-clickable:hover {
  color: rgb(var(--v-theme-primary));
}

/* Subtitle styles */
.file-subtitle {
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 0.8rem;
  margin-top: 2px;
}

/* Action buttons container */
.file-actions {
  gap: 4px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.file-list-item:hover .file-actions {
  opacity: 1;
}

/* Action button styles */
.file-action-btn {
  border-radius: 50%;
  transition: all 0.2s ease;
  min-width: 32px !important;
  width: 32px;
  height: 32px;
}

.file-action-btn:hover {
  background-color: rgba(var(--v-theme-primary), 0.1);
  transform: scale(1.1);
}

.download-btn:hover {
  background-color: rgba(var(--v-theme-success), 0.1);
}

.delete-btn:hover {
  background-color: rgba(var(--v-theme-error), 0.1);
}

/* File type specific icon colors */
.file-list-item :deep(.v-icon) {
  transition: color 0.2s ease;
}
</style>
