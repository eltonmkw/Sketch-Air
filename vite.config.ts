import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode, isPreview }) => {
    // TESTING is read by Node, never exposed as a browser-controlled bypass.
    // Builds always resolve the real service, even with TESTING=true or --mode test.
    const testing = command === 'serve' && !isPreview && mode !== 'production'
      && process.env.NODE_ENV !== 'production' && process.env.TESTING === 'true';
    return {
      server: {
        port: 3000,
        host: testing ? '127.0.0.1' : '0.0.0.0',
      },
      plugins: [react(), ...(testing ? [{
        name: 'local-testing-notice',
        transformIndexHtml: () => [{
          tag: 'aside',
          attrs: { role: 'note', style: 'position:fixed;bottom:0;left:0;z-index:9999;background:#fef3c7;color:#1e293b;padding:4px 8px;font:12px sans-serif' },
          children: 'TESTING: dummy key only. Google connection is mocked; generation is disabled.',
          injectTo: 'body' as const,
        }],
      }] : [])],
      base: './',
      resolve: {
        alias: [
          ...(testing ? [{
            find: /^\.{1,2}\/services\/geminiService$/,
            replacement: path.resolve(__dirname, 'tests/mocks/geminiService.ts'),
          }] : []),
          { find: '@', replacement: path.resolve(__dirname, '.') },
        ],
      }
    };
});
