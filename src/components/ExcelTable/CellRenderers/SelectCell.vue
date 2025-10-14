<template>
  <div class="select-cell">
    <select
      v-if="isEditing"
      ref="select"
      class="cell-select"
      :value="value"
      @change="handleChange"
      @blur="handleBlur"
      @click.stop
      @mousedown.stop
    >
      <option value="">请选择</option>
      <option 
        v-for="option in options" 
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
    <span v-else class="cell-content" :style="cellStyle">
      {{ displayValue }}
    </span>
  </div>
</template>

<script>
export default {
  name: 'SelectCell',
  props: {
    value: {
      type: String,
      default: ''
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
  computed: {
    displayValue() {
      const option = this.options.find(opt => opt.value === this.value);
      return option ? option.label : this.value;
    },
    cellStyle() {
      if (!this.isEditing && this.value) {
        const option = this.options.find(opt => opt.value === this.value);
        if (option && option.color) {
          return {
            backgroundColor: option.color
          };
        }
      }
      return {};
    }
  },
  methods: {
    handleChange(event) {
      this.$emit('update', event.target.value);
      this.$emit('blur');
    },
    handleBlur() {
      this.$emit('blur');
    },
    focus() {
      this.$nextTick(() => {
        if (this.$refs.select) {
          this.$refs.select.focus();
        }
      });
    }
  },
  watch: {
    isEditing(newVal) {
      if (newVal) {
        this.focus();
      }
    }
  }
}
</script>

<style scoped>
.select-cell {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  background: transparent;
}

.cell-select {
  width: 100%;
  flex: 1;
  height: 100%;
  border: none;
  outline: 1px solid #1890ff;
  padding: 0;
  font-family: inherit;
  font-size: inherit;
  box-sizing: border-box;
  background: white;
  cursor: pointer;
}

.cell-content {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  white-space: nowrap;
  cursor: cell;
  padding: 0;
  box-sizing: border-box;
  transition: background-color 0.2s;
}
</style>

