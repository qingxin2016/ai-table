/**
 * 虚拟滚动模块
 * 处理大数据量时的虚拟滚动功能
 */
export function useVirtualScroll() {
    return {
        // 初始化虚拟滚动
        initializeVirtualScroll() {
            this.$nextTick(() => {
                const container = document.querySelector('.excel-table-container');
                if (container) {
                    this.containerHeight = container.clientHeight;
                    this.visibleRowCount = Math.ceil(this.containerHeight / this.rowHeight) + 2;

                    // 添加滚动事件监听
                    container.addEventListener('scroll', this.handleScroll);

                    // 使用 ResizeObserver 监听容器尺寸变化
                    if (typeof ResizeObserver !== 'undefined') {
                        this.resizeObserver = new ResizeObserver(() => {
                            this.containerHeight = container.clientHeight;
                            this.visibleRowCount = Math.ceil(this.containerHeight / this.rowHeight) + 2;
                        });
                        this.resizeObserver.observe(container);
                    }
                }
            });
        },

        // 处理滚动事件
        handleScroll(event) {
            if (this.enableVirtualScroll) {
                this.scrollTop = event.target.scrollTop;
            }
        }
    }
}
