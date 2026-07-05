import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { networkInterfaces } from 'os'

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'lan-ip-middleware',
      configureServer(server) {
        server.middlewares.use('/__lan_ip', (req, res) => {
          var address = server.httpServer.address()
          var port = address.port
          var ip = null
          var interfaces = networkInterfaces()
          for (var name in interfaces) {
            for (var iface of interfaces[name]) {
              if (iface.family === 'IPv4' && !iface.internal) {
                ip = iface.address
                break
              }
            }
            if (ip) break
          }
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ip: ip || 'localhost', port: port }))
        })
      }
    }
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3000
  }
})
