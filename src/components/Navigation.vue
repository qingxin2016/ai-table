<template>
  <nav class="navigation">
    <div class="nav-container">
      <div class="nav-brand">
        <router-link to="/" class="brand-link">
          <span class="brand-icon">📊</span>
          <span class="brand-text">Table & Editor</span>
        </router-link>
      </div>
      
      <div class="nav-links">
        <router-link 
          to="/" 
          class="nav-link"
          :class="{ active: $route.name === 'home' }"
        >
          <span class="nav-icon">🏠</span>
          <span class="nav-text">Ai表格</span>
        </router-link>
        
        <router-link 
          to="/editor" 
          class="nav-link"
          :class="{ active: $route.name === 'editor' }"
        >
          <span class="nav-icon">✏️</span>
          <span class="nav-text">Ai编辑器</span>
        </router-link>
        
        <router-link 
          to="/about" 
          class="nav-link"
          :class="{ active: $route.name === 'about' }"
        >
          <span class="nav-icon">ℹ️</span>
          <span class="nav-text">关于</span>
        </router-link>
      </div>
      
      <!-- 移动端菜单按钮 -->
      <button 
        class="mobile-menu-btn"
        @click="toggleMobileMenu"
        :class="{ active: showMobileMenu }"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
    
    <!-- 移动端菜单 -->
    <div class="mobile-menu" :class="{ show: showMobileMenu }">
      <router-link 
        to="/" 
        class="mobile-nav-link"
        @click="closeMobileMenu"
      >
        <span class="nav-icon">🏠</span>
        <span class="nav-text">Ai表格</span>
      </router-link>
      
      <router-link 
        to="/editor" 
        class="mobile-nav-link"
        @click="closeMobileMenu"
      >
        <span class="nav-icon">✏️</span>
        <span class="nav-text">Ai编辑器</span>
      </router-link>
      
      <router-link 
        to="/about" 
        class="mobile-nav-link"
        @click="closeMobileMenu"
      >
        <span class="nav-icon">ℹ️</span>
        <span class="nav-text">关于</span>
      </router-link>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'Navigation',
  data() {
    return {
      showMobileMenu: false,
    }
  },
  methods: {
    toggleMobileMenu() {
      this.showMobileMenu = !this.showMobileMenu
    },
    closeMobileMenu() {
      this.showMobileMenu = false
    },
  },
  mounted() {
    // 点击外部关闭移动端菜单
    document.addEventListener('click', (e) => {
      if (!this.$el.contains(e.target)) {
        this.showMobileMenu = false
      }
    })
  },
}
</script>

<style scoped>
.navigation {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
}

.nav-brand {
  flex-shrink: 0;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: white;
  font-weight: 700;
  font-size: 1.2em;
  transition: all 0.3s ease;
}

.brand-link:hover {
  transform: scale(1.05);
}

.brand-icon {
  font-size: 1.5em;
}

.brand-text {
  font-family: 'Arial', sans-serif;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.9);
  border-radius: 6px;
  transition: all 0.3s ease;
  font-weight: 500;
  position: relative;
  overflow: hidden;
}

.nav-link::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.nav-link:hover::before {
  left: 100%;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  transform: translateY(-1px);
}

.nav-link.active {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.nav-icon {
  font-size: 1.1em;
}

.nav-text {
  font-size: 14px;
}

.mobile-menu-btn {
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
}

.mobile-menu-btn span {
  width: 100%;
  height: 2px;
  background: white;
  border-radius: 1px;
  transition: all 0.3s ease;
  transform-origin: center;
}

.mobile-menu-btn.active span:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.mobile-menu-btn.active span:nth-child(2) {
  opacity: 0;
}

.mobile-menu-btn.active span:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -6px);
}

.mobile-menu {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-10px);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.mobile-menu.show {
  transform: translateY(0);
  opacity: 1;
  visibility: visible;
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  font-weight: 500;
}

.mobile-nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  padding-left: 30px;
}

.mobile-nav-link:last-child {
  border-bottom: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-container {
    padding: 0 15px;
  }
  
  .nav-links {
    display: none;
  }
  
  .mobile-menu-btn {
    display: flex;
  }
  
  .mobile-menu {
    display: block;
  }
  
  .brand-text {
    display: none;
  }
}

@media (max-width: 480px) {
  .nav-container {
    height: 50px;
  }
  
  .brand-link {
    font-size: 1em;
  }
  
  .brand-icon {
    font-size: 1.3em;
  }
}

/* 路由过渡动画 */
.router-link-active {
  color: white !important;
}

/* 悬浮效果 */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-2px); }
}

.nav-link:hover {
  animation: float 0.6s ease-in-out;
}
</style>
