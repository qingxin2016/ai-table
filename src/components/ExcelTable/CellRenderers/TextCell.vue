<template>
  <div class="text-cell">
    <input
      v-if="isEditing"
      ref="input"
      type="text"
      class="cell-input"
      :value="value"
      @input="handleInput"
      @blur="handleBlur"
      @click.stop
      @mousedown.stop
      @dblclick.stop
    />
    <span v-else class="cell-content">
      {{ value }}
    </span>
  </div>
</template>

<script>
export default {
  name: 'TextCell',
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
          this.$refs.input.select();
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
.text-cell {
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
  white-space: pre-wrap;
  word-wrap: break-word;
  cursor: cell;
  padding: 0;
  background: transparent;
  line-height: 1.5;
}
</style>

