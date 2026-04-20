import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        include: [
            'sfcc/tests/**/*.spec.js',
            'deposco/tests/**/*.spec.js'
        ],
        testTimeout: 60000,
        retry: 0
    }
});
