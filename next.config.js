/** @type {import('next').NextConfig} */
const nextConfig = {
    // Firebase App Hosting 최적화
    output: 'standalone',
    
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
        // App Hosting에서 이미지 최적화
        unoptimized: false,
    },
    
    // 서버 외부 패키지 설정
    serverExternalPackages: [
        '@opentelemetry/winston-transport',
        '@opentelemetry/exporter-jaeger',
        '@opentelemetry/sdk-node',
        '@opentelemetry/instrumentation-winston'
    ],
    
    // Webpack 설정
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.externals.push({
                '@opentelemetry/winston-transport': 'commonjs @opentelemetry/winston-transport',
                '@opentelemetry/exporter-jaeger': 'commonjs @opentelemetry/exporter-jaeger'
            });
        }
        
        // 파일 크기 경고 제한 증가 (엑셀 라이브러리 등)
        config.performance = {
            ...config.performance,
            maxAssetSize: 1000000, // 1MB
            maxEntrypointSize: 1000000, // 1MB
        };
        
        return config;
    },
    
    // 실험적 기능
    experimental: {
        // App Hosting 최적화 - 이 설정은 더 이상 필요하지 않음
    },
};

export default nextConfig;
