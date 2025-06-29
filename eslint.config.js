import { defineConfig } from 'eslint/config'
import xoBrowser from 'eslint-config-xo/browser'

export default defineConfig([
  ...xoBrowser,
  {
    files: ['**/*.js'],
    rules: {
      '@stylistic/semi': ['error', 'never']
    }
  }
])
