import { defineConfig } from 'astro/config';
import { webcore } from 'webcoreui/integration';

export default defineConfig({
  site: 'https://www.teamrespawntv.com',
  integrations: [webcore()],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler'
        }
      }
    }
  }
});
