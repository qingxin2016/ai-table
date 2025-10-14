<template>
  <div class="tags-cell">
    <!-- 编辑模式 -->
    <div v-if="isEditing" class="tags-editor" @click.stop>
      <div class="tags-dropdown">
        <label 
          v-for="option in options" 
          :key="option.value"
          class="tag-option"
          :class="{ 'selected': isSelected(option.value) }"
        >
          <input 
            type="checkbox" 
            :checked="isSelected(option.value)"
            @change="toggleTag(option.value)"
          />
          <span 
            class="tag-preview" 
            :style="{ backgroundColor: option.color }"
          >
            {{ option.label }}
          </span>
        </label>
      </div>
      <div class="editor-actions">
        <button class="btn-confirm" @click="handleConfirm">确定</button>
        <button class="btn-cancel" @click="handleCancel">取消</button>
      </div>
    </div>
    
    <!-- 显示模式 -->
    <div v-else class="tags-display">
      <span 
        v-for="tag in displayTags" 
        :key="tag.value"
        class="tag-item"
        :style="{ backgroundColor: tag.color }"
        :title="tag.label"
      >
        {{ tag.label }}
      </span>
      <span v-if="displayTags.length === 0" class="empty-text">-</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TagsCell',
  props: {
    value: {
      type: [Array, String],
      default: () => []
    },
    isEditing: {
      type: Boolean,
      default: false
    },
    options: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      selectedTags: []
    }
  },
  computed: {
    displayTags() {
      const values = this.getValueArray();
      console.log('TagsCell - displayTags computed:', { 
        value: this.value, 
        valueType: typeof this.value,
        isArray: Array.isArray(this.value),
        values, 
        options: this.options 
      });
      
      if (!Array.isArray(this.options) || this.options.length === 0) {
        console.warn('TagsCell - options is not an array or empty:', this.options);
        return [];
      }
      
      const result = this.options.filter(opt => values.includes(opt.value));
      console.log('TagsCell - displayTags result:', result);
      return result;
    }
  },
  methods: {
    getValueArray() {
      if (Array.isArray(this.value)) {
        return this.value;
      }
      if (typeof this.value === 'string' && this.value) {
        // 支持逗号分隔的字符串
        return this.value.split(',').map(v => v.trim()).filter(Boolean);
      }
      return [];
    },
    
    isSelected(value) {
      return this.selectedTags.includes(value);
    },
    
    toggleTag(value) {
      const index = this.selectedTags.indexOf(value);
      if (index > -1) {
        this.selectedTags.splice(index, 1);
      } else {
        this.selectedTags.push(value);
      }
    },
    
    handleConfirm() {
      // 发送更新事件，传递数组
      console.log('TagsCell - handleConfirm:', this.selectedTags);
      this.$emit('update', [...this.selectedTags]);
      // 延迟触发 blur，确保数据更新完成
      this.$nextTick(() => {
        this.$emit('blur');
      });
    },
    
    handleCancel() {
      // 取消编辑，不更新
      this.$emit('blur');
    }
  },
  watch: {
    isEditing: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          // 进入编辑模式时，初始化选中状态
          this.selectedTags = [...this.getValueArray()];
        }
      }
    },
    value: {
      deep: true,
      handler(newVal) {
        // 当 value 变化时，强制更新显示
        this.$forceUpdate();
      }
    }
  }
}
</script>

<style scoped>
.tags-cell {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0;
}

.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 0;
  width: 100%;
  align-items: center;
  min-height: 100%;
  line-height: 1.5;
}

.tag-item {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 3px;
  font-size: 12px;
  color: #fff;
  white-space: nowrap;
  cursor: default;
  line-height: 1.3;
}

.empty-text {
  color: #999;
  font-style: italic;
  font-size: 12px;
}

.tags-editor {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  background: white;
  border: 1px solid #d4d4d4;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  max-width: 300px;
}

.tags-dropdown {
  max-height: 250px;
  overflow-y: auto;
  padding: 8px;
}

.tag-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 3px;
  transition: background-color 0.2s;
}

.tag-option:hover {
  background: #f5f5f5;
}

.tag-option.selected {
  background: #e8f4ff;
}

.tag-option input[type="checkbox"] {
  cursor: pointer;
}

.tag-preview {
  flex: 1;
  padding: 3px 10px;
  border-radius: 3px;
  font-size: 12px;
  color: #333;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.editor-actions {
  display: flex;
  gap: 8px;
  padding: 8px;
  border-top: 1px solid #e0e0e0;
  background: #f9f9f9;
}

.editor-actions button {
  flex: 1;
  padding: 6px 12px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-confirm {
  background: #0078d4;
  color: white;
}

.btn-confirm:hover {
  background: #005a9e;
}

.btn-cancel {
  background: #e0e0e0;
  color: #333;
}

.btn-cancel:hover {
  background: #d0d0d0;
}

/* 滚动条美化 */
.tags-dropdown::-webkit-scrollbar {
  width: 6px;
}

.tags-dropdown::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.tags-dropdown::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.tags-dropdown::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>

