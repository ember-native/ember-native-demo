/**
 * Debugging:
 *   https://eslint.org/docs/latest/use/configure/debug
 *  ----------------------------------------------------
 *
 *   Print a file's calculated configuration
 *
 *     npx eslint --print-config path/to/file.js
 *
 *   Inspecting the config
 *
 *     npx eslint --inspect-config
 *
 */
import globals from 'globals';
import js from '@eslint/js';

import ts from 'typescript-eslint';

import ember from 'eslint-plugin-ember/recommended';

import eslintConfigPrettier from 'eslint-config-prettier';
import qunit from 'eslint-plugin-qunit';
import n from 'eslint-plugin-n';

import babelParser from '@babel/eslint-parser';

import emberNativeGlobals from 'ember-native/utils/eslint/ember-native';

const parserOptions = {
    esm: {
        js: {
            ecmaFeatures: { modules: true },
            ecmaVersion: 'latest',
            requireConfigFile: false,
            babelOptions: {
              babelrc: false,
              configFile: false,
            },
        },
        ts: {
            projectService: true,
            tsconfigRootDir: import.meta.dirname,
            requireConfigFile: false,
            babelOptions: {
              babelrc: false,
              configFile: false,
            },
        },
    },
};

export default ts.config(
    js.configs.recommended,
    ember.configs.base,
    ember.configs.gjs,
    ember.configs.gts,
    eslintConfigPrettier,
    /**
     * Ignores must be in their own object
     * https://eslint.org/docs/latest/use/configure/ignore
     */
    {
        ignores: ['dist/', 'node_modules/', 'coverage/', '!**/.*', 'hooks/', 'platforms', 'App_Resources', 'references.d.ts', 'nativescript.config.ts'],
    },
    /**
     * https://eslint.org/docs/latest/use/configure/configuration-files#configuring-linter-options
     */
    {
        linterOptions: {
            reportUnusedDisableDirectives: 'error',
        },
    },
    {
        languageOptions: {
            globals: {
                ...emberNativeGlobals.emberNativeGlobals,
            }
        },
    },
    {
        files: ['**/*.js'],
        languageOptions: {
            parser: babelParser,
        },
    },
    {
        files: ['**/*.{js,gjs}'],
        languageOptions: {
            parserOptions: parserOptions.esm.js,
            globals: {
                ...globals.browser,
                ...emberNativeGlobals.emberNativeGlobals
            },
        },
    },
    {
        files: ['**/*.{ts,gts}'],
        languageOptions: {
            parser: ember.parser,
            parserOptions: parserOptions.esm.ts,
        },
        extends: [...ts.configs.recommendedTypeChecked, ember.configs.gts],
        rules: {
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
        }
    },
    {
        files: ['tests/**/*-test.{js,gjs,ts,gts}'],
        plugins: {
            qunit,
        },
    },
    /**
     * CJS node files
     */
    {
        files: [
            '**/*.cjs',
            'config/**/*.js',
            'testem.js',
            'testem*.js',
            '.prettierrc.js',
            '.stylelintrc.js',
            '.template-lintrc.js',
            'ember-cli-build.js',
            'webpack.config.js',
            'karma.conf.js',
        ],
        plugins: {
            n,
        },

        languageOptions: {
            sourceType: 'script',
            ecmaVersion: 'latest',
            globals: {
                ...globals.node,
            },
        },
    },
    /**
     * ESM node files
     */
    {
        files: ['**/*.mjs'],
        plugins: {
            n,
        },

        languageOptions: {
            sourceType: 'module',
            ecmaVersion: 'latest',
            parserOptions: parserOptions.esm.js,
            globals: {
                ...globals.node,
            },
        },
    },
);
