const { resolve } = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        'home/index': resolve(__dirname, 'home/index.html'),
        'home/css/style': resolve(__dirname, 'home/css/style.css'),
        'home/css/animation': resolve(__dirname, 'home/css/animation.css'),
        'game/index': resolve(__dirname, 'game/index.html'),
        'game/css/style': resolve(__dirname, 'game/css/style.css'),
      },
    }
  }
})