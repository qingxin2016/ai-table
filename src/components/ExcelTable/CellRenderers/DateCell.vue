<template>
  <div class="date-cell">
    <input
      v-if="isEditing"
      ref="input"
      type="date"
      class="cell-input"
      :value="value"
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
  name: 'DateCell',
  props: {
    value: {
      type: String,
      default: ''
    },
    isEditing: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    formattedValue() {
      if (!this.value) return '';
      try {
        const date = new Date(this.value);
        if (isNaN(date.getTime())) return this.value;
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch (e) {
        return this.value;
      }
    }
  },
  methods: {
    handleInput(event) {
      this.$emit('update', event.target.value);
    },
    handleBlur() {
      this.$emit('blur');
    },
    focus() {
      this.$nextTick(() => {
        if (this.$refs.input) {
          this.$refs.input.focus();
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
.date-cell {
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
  background: transparent;
}

.cell-content {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  white-space: nowrap;
  cursor: cell;
  padding: 0;
  background: transparent;
}
</style>

