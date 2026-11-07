import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    three: ['three'],
                    r3f: ['@react-three/fiber', '@react-three/drei'],
                    vendor: ['react', 'react-dom', 'zustand', 'socket.io-client', 'lucide-react'],
                },
            },
        },
        chunkSizeWarningLimit: 800,
    },
    server: {
        port: 5173,
        proxy: {
            '/v1': {
                target: 'http://localhost:3300',
                changeOrigin: true,
            },
            '/socket.io': {
                target: 'http://localhost:3300',
                ws: true,
                changeOrigin: true,
            },
        },
    },
});
