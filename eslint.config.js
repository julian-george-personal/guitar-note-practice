import js from '@eslint/js'
import ts from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

export default ts.config(
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // TypeScript: allow `any` and unused vars with underscore prefix
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // JS: no-unused-vars handled by TS rule above
      'no-unused-vars': 'off',
      // Too strict: setState in effects is a legitimate React pattern
      'react-hooks/set-state-in-effect': 'off',
      // Too strict: calling check() during render to avoid an extra useEffect is intentional
      'react-hooks/refs': 'off',
    },
  },
  {
    ignores: ['dist/', 'node_modules/'],
  },
)
