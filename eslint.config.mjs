import antfu from '@antfu/eslint-config';

export default antfu({
    type: 'app',
    stylistic: {
        indent: 4,
        quotes: 'single',
    },
    typescript: {
        // config: './tsconfig.json', // disabled for now to prevent type-aware rules from being more of a headache.
        overrides: {
            'ts/consistent-type-definitions': ['error', 'interface'],
            'ts/no-unsafe-function-type': 'warn',
            'ts/no-require-imports': 'warn',
            'ts/no-unsafe-function-type': 'warn',
            'ts/no-redeclare': 'warn',
        },
    },
    jsonc: true,
    yaml: true,
    ignores: ['**/fixtures', '**/test'],
}, {
    // Without `files`, they are general rules for all files
    rules: {
        'style/semi': ['error', 'always'],
        'no-console': 'off',
        'unused-imports/no-unused-imports': 'off',
        'unused-imports/no-unused-vars': 'off',
        'jsdoc/check-param-names': 'off',
        'new-cap': 'off',
        'no-restricted-globals': 'warn',
        'unicorn/prefer-number-properties': 'warn',
        'no-cond-assign': 'warn',
        'node/prefer-global/process': 'warn',
        'node/no-path-concat': 'warn',
        'no-dupe-keys': 'warn',
        'no-prototype-builtins': 'warn',
        'no-useless-call': 1,
        'no-var': 1,

    },
});
// .override(
//     'antfu/imports',
//     {
//       rules: {
//         'import/order': ['error', { 'newlines-between': 'always' }],
//       }
//     }
//   )
