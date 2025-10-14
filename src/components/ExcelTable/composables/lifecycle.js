/**
 * 生命周期钩子模块
 * 定义组件生命周期相关的方法
 */
export function useLifecycle() {
    return {
        mounted() {
            document.addEventListener('mouseup', this.handleMouseUp);
            document.addEventListener('mousemove', this.handleMouseMove);
            document.addEventListener('keydown', this.handleKeyDown);
            this.createFillTooltip();
            this.initializeColumnWidths();
            this.initializeVirtualScroll();
            this.updateHeaderCheckbox();
        },

        updated() {
            this.updateHeaderCheckbox();
        },

        beforeUnmount() {
            document.removeEventListener('mouseup', this.handleMouseUp);
            document.removeEventListener('mousemove', this.handleMouseMove);
            document.removeEventListener('keydown', this.handleKeyDown);
            if (this.fillTooltip) {
                document.body.removeChild(this.fillTooltip);
            }

            // 清理虚拟滚动相关监听器
            const container = document.querySelector('.excel-table-container');
            if (container) {
                container.removeEventListener('scroll', this.handleScroll);
            }
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
            }
        }
    }
}

