/** @type {import('next').NextConfig} */
const nextConfig = {
    // Firebase App Hosting 최적화 - standalone 제거
    // output: 'standalone',
    
    // 빌드 최적화
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    
    // 이미지 최적화
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'placehold.co',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'ecimg.cafe24img.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'firebasestorage.googleapis.com',
                port: '',
                pathname: '/**',
            },
        ],
        unoptimized: false,
    },
    
    // 서버 외부 패키지 설정 (Firebase App Hosting용)
    serverExternalPackages: [
        'xlsx',
        'jsbarcode'
    ],
    
    // CSS 최적화
    experimental: {
        optimizeCss: true,
    },
};

module.exports = nextConfig;
