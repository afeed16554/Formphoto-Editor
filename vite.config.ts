import { defineConfig, Plugin } from 'vite';

/**
 * Provides a safe empty module shim for optional WebGPU subpath imports inside xrblocks
 * so production builds produce 100% self-contained bundles with zero bare specifiers on GitHub Pages.
 */
function webgpuOptionalShimPlugin(): Plugin {
  const virtualIds = new Set([
    '@pmndrs/uikit/webgpu',
    'three/webgpu',
    'three/tsl',
  ]);
  return {
    name: 'webgpu-optional-shim',
    resolveId(id) {
      if (virtualIds.has(id)) {
        return `\0virtual:${id}`;
      }
      return null;
    },
    load(id) {
      if (id.startsWith('\0virtual:')) {
        return 'export default {};';
      }
      return null;
    },
  };
}

export default defineConfig({
  // Relative base path ensures assets load properly on GitHub Pages (https://user.github.io/repo/)
  // as well as root domains on Vercel, Netlify, Cloudflare Pages, or custom servers.
  base: './',
  plugins: [webgpuOptionalShimPlugin()],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  esbuild: {
    target: 'esnext',
  },
  optimizeDeps: {
    exclude: ['xrblocks'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
