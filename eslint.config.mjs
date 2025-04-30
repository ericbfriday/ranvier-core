import antfu from '@antfu/eslint-config'

export default antfu({
    type: 'app',
    stylistic: {
        indent: 4,
        quotes: 'single'
    },
    typescript: {
      // config: './tsconfig.json', // disabled for now to prevent type-aware rules from being more of a headache.
      overrides: {
        'ts/consistent-type-definitions': ['error', 'interface']
      }
    },
    jsonc: true,
    yaml: true,
    ignores: ['**/fixtures'],
},
{
  // Without `files`, they are general rules for all files
  rules: {
    'style/semi': ['error', 'always'],
  },
})
// .override(
//     'antfu/imports',
//     {
//       rules: {
//         'import/order': ['error', { 'newlines-between': 'always' }],
//       }
//     }
//   )
