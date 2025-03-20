import HelpersEslint from '@futurebrand/helpers-nextjs/plugins/eslint'

export default [
  ...HelpersEslint,
  {
    rules: {
      'eslint-comments/require-description': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/prefer-destructuring': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
]
