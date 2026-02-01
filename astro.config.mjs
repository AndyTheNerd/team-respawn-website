import { defineConfig } from 'astro/config';
import { webcore } from 'webcoreui/integration';

export default defineConfig({
  site: 'https://www.teamrespawn.net',
  integrations: [webcore()],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler'
        }
      }
    },
    resolve: {
      alias: {
        '@blocks': '/src/blocks'
      }
    }
  }
});
