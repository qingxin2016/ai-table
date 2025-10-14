<template>
  <div class="number-cell">
    <input
      v-if="isEditing"
      ref="input"
      type="text"
      class="cell-input"
      :value="editValue"
      @input="handleInput"
      @blur="handleBlur"
      @click.stop
      @mousedown.stop
      @dblclick.stop
    />
    <span v-else class="cell-content">
      {{ formattedValue }}
    </span>
  </div>
</template>

<script>
export default {
  name: 'NumberCell',
  props: {
    value: {
      type: [String, Number],
      default: ''
    },
    isEditing: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      editValue: ''
    }
  },
  computed: {
    formattedValue() {
      if (this.value === '' || this.value === null || this.value === undefined) {
        return '';
      }
      const num = parseFloat(this.value);
      if (isNaN(num)) {
        return this.value;
      }
      // 千分位格式化
      return num.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
    }
  },
  methods: {
    handleInput(event) {
      this.editValue = event.target.value;
      // 只允许输入数字、小数点和负号
      const value = event.target.value.replace(/[^\d.-]/g, '');
      this.$emit('update', value);
    },
    handleBlur() {
      this.$emit('blur');
    },
    focus() {
      this.$nextTick(() => {
        if (this.$refs.input) {
          this.$refs.input.focus();
          this.$refs.input.select();
        }
      });
    }
  },
  watch: {
    isEditing(newVal) {
      if (newVal) {
        this.editValue = this.value;
        this.focus();
      }
    }
  }
}
</script>

<style scoped>
.number-cell {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  background: transparent;
}

.cell-input {
  width: 100%;
  flex: 1;
  height: 100%;
  border: none;
  outline: 1px solid #1890ff;
  padding: 0;
  font-family: inherit;
  font-size: inherit;
  box-sizing: border-box;
  text-align: right;
  background: transparent;
}

.cell-content {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  height: 100%;
  white-space: nowrap;
  cursor: cell;
  padding: 0;
  text-align: right;
  font-variant-numeric: tabular-nums;
  background: transparent;
}
</style>

