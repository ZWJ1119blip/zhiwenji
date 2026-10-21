import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), imageProxyPlugin()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    // 商汤日日新（SenseNova）API 代理：解决浏览器跨域（CORS）问题
    // 前端请求 /api/sensenova/v1/images/generations
    //   → 转发至 https://token.sensenova.cn/v1/images/generations
    proxy: {
      '/api/sensenova': {
        target: 'https://token.sensenova.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sensenova/, ''),
      },
    },
  },
});

/**
 * 同源图片代理插件：/api/img?url=<encoded>
 * 商汤返回的图片位于外部 CDN，浏览器跨域加载会污染 canvas（html2canvas 截图空白）。
 * 经本代理转为同源响应后，截图/合成均不再受 CORS 限制。
 */
function imageProxyPlugin() {
  return {
    name: 'zhiwenji-image-proxy',
    configureServer(server) {
      server.middlewares.use('/api/img', async (req, res) => {
        const target = new URL(req.url, 'http://localhost').searchParams.get('url');
        if (!target) {
          res.statusCode = 400;
          res.end('missing url');
          return;
        }
        try {
          const upstream = await fetch(target);
          if (!upstream.ok) throw new Error(`upstream ${upstream.status}`);
          const buffer = Buffer.from(await upstream.arrayBuffer());
          res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/png');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          res.end(buffer);
        } catch (err) {
          console.error('[image-proxy]', err);
          res.statusCode = 502;
          res.end('image proxy error');
        }
      });
    },
  };
}
