/**
 * HALMBOOK EDITORIAL - CINEMATIC HELICOPTER & 3D CLOTH FLAG ANIMATION
 * Phục vụ đồng bộ hiệu ứng 2 máy bay trực thăng kéo cờ & kéo header
 * trên toàn bộ các màn hình (Trang Chủ, Cá Nhân, Hạng Thành Viên, Tủ Sách, ...)
 */

// Shaders mô phỏng sóng vải điều hòa đa tần số & ánh sáng lụa điện ảnh
const flagVertexShader = `
    uniform float uTime;
    uniform float uSpeed;
    uniform float uWaveAmp;
    uniform float uWaveFreq;
    uniform float uIsSmallFlag;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vWaveDepth;

    void main() {
        vUv = uv;
        float s = (uIsSmallFlag > 0.5) ? (1.0 - uv.x) : uv.x;
        float ampFactor = pow(clamp(s, 0.0, 1.0), 1.35) * uWaveAmp;
        float t = uTime * uSpeed;
        
        float wave1 = sin(s * uWaveFreq * 6.28318 - t * 4.2 + uv.y * 1.5);
        float wave2 = sin(s * uWaveFreq * 11.5 - t * 6.8 - uv.y * 2.2 + 1.25) * 0.45;
        float wave3 = sin(s * uWaveFreq * 18.0 - t * 9.5 + uv.y * 3.1 + 2.5) * 0.22;
        float flutter = sin(s * 28.0 - t * 14.0) * pow(clamp(s, 0.0, 1.0), 2.5) * 0.15;
        
        float totalWave = (wave1 + wave2 + wave3 + flutter) * ampFactor;
        
        vec3 displacedPos = position;
        displacedPos.z += totalWave;
        displacedPos.x -= (uIsSmallFlag > 0.5 ? -1.0 : 1.0) * pow(clamp(s, 0.0, 1.0), 1.8) * abs(totalWave) * 0.12;
        displacedPos.y += sin(s * 7.0 - t * 3.5) * ampFactor * 0.15 * (uv.y - 0.5);
        
        vWaveDepth = totalWave;
        vPosition = (modelMatrix * vec4(displacedPos, 1.0)).xyz;
        
        float dZds = (
            cos(s * uWaveFreq * 6.28318 - t * 4.2 + uv.y * 1.5) * uWaveFreq * 6.28318 +
            cos(s * uWaveFreq * 11.5 - t * 6.8 - uv.y * 2.2 + 1.25) * uWaveFreq * 11.5 * 0.45 +
            cos(s * uWaveFreq * 18.0 - t * 9.5 + uv.y * 3.1 + 2.5) * uWaveFreq * 18.0 * 0.22
        ) * ampFactor;
        
        float dZdy = (
            cos(s * uWaveFreq * 6.28318 - t * 4.2 + uv.y * 1.5) * 1.5 -
            cos(s * uWaveFreq * 11.5 - t * 6.8 - uv.y * 2.2 + 1.25) * 2.2 * 0.45 +
            cos(s * uWaveFreq * 18.0 - t * 9.5 + uv.y * 3.1 + 2.5) * 3.1 * 0.22
        ) * ampFactor;
        
        vec3 tangentX = vec3(1.0, 0.0, (uIsSmallFlag > 0.5 ? -1.0 : 1.0) * dZds);
        vec3 tangentY = vec3(0.0, 1.0, dZdy);
        vec3 computedNormal = normalize(cross(tangentX, tangentY));
        
        vNormal = normalize(normalMatrix * computedNormal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPos, 1.0);
    }
`;

const flagFragmentShader = `
    uniform sampler2D uTexture;
    uniform float uOpacity;
    uniform vec3 uLightDir;
    uniform vec3 uLightColor;
    uniform vec3 uAmbientColor;
    uniform float uIsSmallFlag;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vWaveDepth;

    void main() {
        vec4 texColor = texture2D(uTexture, vUv);
        vec3 N = normalize(vNormal);
        if (!gl_FrontFacing) N = -N;
        
        vec3 L = normalize(uLightDir);
        vec3 V = normalize(-vPosition);
        vec3 H = normalize(L + V);
        
        float diff = max(dot(N, L), 0.0);
        float wrapDiff = pow(diff * 0.65 + 0.35, 1.4);
        float spec = pow(max(dot(N, H), 0.0), 18.0) * 0.38;
        float foldShadow = clamp(0.72 + 0.28 * sin(vWaveDepth * 2.5), 0.45, 1.0);
        
        vec3 ambient = uAmbientColor * texColor.rgb;
        vec3 diffuse = uLightColor * texColor.rgb * wrapDiff * foldShadow;
        vec3 specular = vec3(1.0, 0.95, 0.85) * spec;
        
        vec3 finalRgb = ambient + diffuse + specular;
        if (uIsSmallFlag < 0.5) {
            float luminance = dot(finalRgb, vec3(0.299, 0.587, 0.114));
            finalRgb = mix(finalRgb, vec3(luminance), 0.08);
        }
        
        gl_FragColor = vec4(finalRgb, texColor.a * uOpacity);
    }
`;

// Tạo Texture Quốc kỳ Việt Nam sắc nét tỷ lệ 2:3 từ HTML5 Canvas
export function createVietnamFlagCanvasTexture(width, height, isRightHoist) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Nền đỏ chuẩn cờ Tổ quốc Việt Nam (#DA251D)
    ctx.fillStyle = '#DA251D';
    ctx.fillRect(0, 0, width, height);

    let flagWidth = width;
    let starCenterX = width / 2;
    const starCenterY = height / 2;

    if (isRightHoist) {
        const sleeveW = Math.round(width * 0.038);
        flagWidth = width - sleeveW;
        starCenterX = flagWidth / 2;

        // Nẹp viền trắng ngà ở mép phải (nơi nối cáp tời trực thăng)
        ctx.fillStyle = '#F4F1EA';
        ctx.fillRect(flagWidth, 0, sleeveW, height);

        // Mắt khuy xỏ cáp
        ctx.fillStyle = '#8B4A3C';
        ctx.beginPath();
        ctx.arc(flagWidth + sleeveW / 2, height * 0.16, sleeveW * 0.28, 0, Math.PI * 2);
        ctx.arc(flagWidth + sleeveW / 2, height * 0.84, sleeveW * 0.28, 0, Math.PI * 2);
        ctx.fill();
    }

    // Ngôi sao vàng năm cánh chuẩn tọa độ hình học
    const R = height * 0.32;
    const r = R * Math.sin(18 * Math.PI / 180) / Math.sin(54 * Math.PI / 180);

    ctx.save();
    ctx.translate(starCenterX, starCenterY);
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const outerAngle = (-90 + i * 72) * Math.PI / 180;
        const ox = R * Math.cos(outerAngle);
        const oy = R * Math.sin(outerAngle);
        if (i === 0) ctx.moveTo(ox, oy);
        else ctx.lineTo(ox, oy);

        const innerAngle = (-54 + i * 72) * Math.PI / 180;
        const ix = r * Math.cos(innerAngle);
        const iy = r * Math.sin(innerAngle);
        ctx.lineTo(ix, iy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    return canvas;
}

const airplaneAnimationState = {
    isRunning: false,
    speedMultiplier: 1.0,
    lastTime: 0,
    elapsedTime: 0,
    flagClothTime: 0,
    animFrameId: null,
    durationPhase1: 5.8,  // Trực thăng 1 bay tiếp cận, đẩy Header bằng luồng gió cánh quạt
    durationPause: 1.6,   // Chờ 1.6s khi Header đang ở ngoài màn hình
    durationPhase2: 4.8,  // Trực thăng 2 xuất hiện từ bên phải kéo Header trở về chậm rãi, đầm chắc
    canvasCtx: null,
    smokeParticles: [],
    smallFlagObj: null
};

// Đảm bảo Three.js được tải
function ensureThreeLoaded(callback) {
    if (window.THREE) {
        callback?.();
        return;
    }
    const existing = document.querySelector('script[data-three-loader]');
    if (existing) {
        existing.addEventListener('load', () => callback?.(), { once: true });
        return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.async = true;
    script.dataset.threeLoader = 'true';
    script.onload = () => callback?.();
    document.head.appendChild(script);
}

// Khởi tạo mô phỏng vải WebGL Cờ Nhỏ (trên trực thăng)
function initSmallFlagCloth(canvasEl, flagW, flagH) {
    if (!window.THREE) {
        // Fallback vẽ cờ 2D trực tiếp nếu Three.js chưa sẵn sàng
        try {
            const ctx2d = canvasEl.getContext('2d');
            const texCanvas = createVietnamFlagCanvasTexture(flagW, flagH, true);
            if (ctx2d && texCanvas) {
                ctx2d.drawImage(texCanvas, 0, 0, flagW, flagH);
            }
        } catch (_) {}
        return null;
    }

    try {
        const THREE = window.THREE;
        const canvasTex = createVietnamFlagCanvasTexture(512, 341, true);
        const texture = new THREE.CanvasTexture(canvasTex);
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        const geometry = new THREE.PlaneGeometry(flagW, flagH, 36, 22);
        const uniforms = {
            uTime: { value: 0.0 },
            uSpeed: { value: 1.0 },
            uWaveAmp: { value: 9.5 },
            uWaveFreq: { value: 1.5 },
            uIsSmallFlag: { value: 1.0 },
            uTexture: { value: texture },
            uOpacity: { value: 1.0 },
            uLightDir: { value: new THREE.Vector3(0.6, 0.8, 1.0).normalize() },
            uLightColor: { value: new THREE.Color(1.0, 0.95, 0.88) },
            uAmbientColor: { value: new THREE.Color(0.42, 0.38, 0.35) }
        };

        const material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: flagVertexShader,
            fragmentShader: flagFragmentShader,
            transparent: true,
            side: THREE.DoubleSide
        });

        const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, alpha: true, antialias: true });
        renderer.setSize(flagW, flagH, false);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setClearColor(0x000000, 0);

        const camera = new THREE.OrthographicCamera(-flagW / 2, flagW / 2, flagH / 2, -flagH / 2, 0.1, 500);
        camera.position.set(0, 0, 100);
        camera.lookAt(0, 0, 0);

        const scene = new THREE.Scene();
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        return { renderer, scene, camera, mesh, uniforms, texture };
    } catch (e) {
        console.warn('Small flag WebGL init fallback:', e);
        return null;
    }
}

// Quản lý hệ thống hạt khói / vệt khí chân thực (Particle Smoke System)
function initSmokeCanvas() {
    const canvas = document.getElementById('airplane-effects-canvas');
    if (!canvas) return null;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    airplaneAnimationState.smokeParticles = [];
    const ctx = canvas.getContext('2d');
    airplaneAnimationState.canvasCtx = ctx;
    return ctx;
}

function emitSmokeParticle(x, y) {
    if (airplaneAnimationState.smokeParticles.length > 70) return;
    airplaneAnimationState.smokeParticles.push({
        x: x,
        y: y,
        vx: -0.5 + (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.5,
        radius: 5 + Math.random() * 3,
        maxRadius: 28 + Math.random() * 14,
        alpha: 0.55,
        life: 0,
        maxLife: 1.6 + Math.random() * 0.5
    });
}

function updateAndDrawSmoke(dt) {
    const ctx = airplaneAnimationState.canvasCtx;
    if (!ctx) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const particles = airplaneAnimationState.smokeParticles;
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
            particles.splice(i, 1);
            continue;
        }
        const progress = p.life / p.maxLife;
        p.x += p.vx;
        p.y += p.vy;
        const currentR = p.radius + (p.maxRadius - p.radius) * Math.sin(progress * Math.PI * 0.5);
        const currentAlpha = p.alpha * (1 - progress);

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentR);
        grad.addColorStop(0, `rgba(255, 255, 255, ${currentAlpha * 0.9})`);
        grad.addColorStop(0.35, `rgba(248, 245, 238, ${currentAlpha * 0.55})`);
        grad.addColorStop(0.7, `rgba(235, 230, 220, ${currentAlpha * 0.22})`);
        grad.addColorStop(1, `rgba(225, 220, 210, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentR, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Tạo mô hình Trực thăng 1
function createPlane1WithFlagElement() {
    const wrapper = document.createElement('div');
    wrapper.id = 'airplane-entity-1';
    wrapper.className = 'airplane-entity';

    const isMobile = window.innerWidth < 640;
    const flagW = isMobile ? 84 : 108;
    const flagH = isMobile ? 56 : 72;
    const cableW = isMobile ? 28 : 36;

    wrapper.innerHTML = `
        <div style="display:flex;align-items:center;position:relative;">
            <!-- Lá cờ nhỏ Việt Nam WebGL 3D -->
            <div class="airplane-flag-canvas" style="width:${flagW}px;height:${flagH}px;">
                <canvas id="small-flag-webgl-canvas" width="${flagW}" height="${flagH}" style="width:${flagW}px;height:${flagH}px;display:block;border-radius:2px;box-shadow:0 6px 20px rgba(0,0,0,0.3);"></canvas>
            </div>

            <!-- Dây cáp tời nối -->
            <svg width="${cableW}" height="28" viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-left:-2px;margin-right:-4px;">
                <path d="M 0,5 L 12,14 M 0,23 L 12,14" stroke="#85817A" stroke-width="1.6"/>
                <line x1="12" y1="14" x2="36" y2="14" stroke="#85817A" stroke-width="2" stroke-dasharray="4,2"/>
            </svg>

            <!-- Trực thăng 1 (Hướng Mũi Sang PHẢI) -->
            <svg width="124" height="52" viewBox="0 0 124 52" fill="none" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;filter:drop-shadow(0 6px 14px rgba(0,0,0,0.26));">
                <defs>
                    <linearGradient id="heliBody1" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#E2DBD0"/>
                        <stop offset="50%" stop-color="#F7F4EC"/>
                        <stop offset="100%" stop-color="#FFFFFF"/>
                    </linearGradient>
                    <linearGradient id="cockpitGlass1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#8B4A3C" stop-opacity="0.95"/>
                        <stop offset="60%" stop-color="#4A1E18" stop-opacity="0.92"/>
                        <stop offset="100%" stop-color="#1F1D1A" stop-opacity="0.95"/>
                    </linearGradient>
                </defs>
                
                <!-- Càng hạ cánh (Landing Skids) -->
                <line x1="44" y1="38" x2="50" y2="47" stroke="#4A4742" stroke-width="2"/>
                <line x1="74" y1="38" x2="80" y2="47" stroke="#4A4742" stroke-width="2"/>
                <path d="M 32,47 L 92,47 C 96,47 99,44 101,41" stroke="#242321" stroke-width="2.8" stroke-linecap="round"/>
                
                <!-- Cần đuôi (Tail Boom) -->
                <path d="M 54,23 L 14,19 L 10,13 L 8,13 L 8,26 L 14,24 L 54,32 Z" fill="#E2DBD0" stroke="#8B4A3C" stroke-width="1.2"/>
                <path d="M 14,21 L 52,26" stroke="#D4AF37" stroke-width="2.2"/>
                
                <!-- Cánh đứng đuôi và cánh quạt đuôi quay liên tục -->
                <polygon points="12,13 6,2 2,2 8,24" fill="#8B4A3C"/>
                <g transform="translate(5, 5)">
                    <ellipse cx="0" cy="0" rx="1.5" ry="9" fill="rgba(212, 175, 55, 0.4)" class="airplane-propeller"/>
                    <line x1="0" y1="-9" x2="0" y2="9" stroke="#D4AF37" stroke-width="1.8" class="airplane-propeller"/>
                    <circle cx="0" cy="0" r="1.8" fill="#8B4A3C"/>
                </g>

                <!-- Thân buồng lái trực thăng hướng sang PHẢI -->
                <path d="M 48,16 C 60,16 88,18 96,24 C 102,28 102,34 94,37 C 82,40 56,40 46,36 C 42,34 40,24 48,16 Z" fill="url(#heliBody1)" stroke="#8B4A3C" stroke-width="1.4"/>
                
                <!-- Kính buồng lái -->
                <path d="M 78,19 C 88,20 95,23 98,27 C 98,31 94,34 86,34 L 78,34 Z" fill="url(#cockpitGlass1)"/>
                <path d="M 80,21 C 87,22 92,25 94,28" stroke="#FAF8F5" stroke-width="1" stroke-linecap="round" opacity="0.75"/>
                
                <!-- Dải sọc nhận diện thương hiệu HALMBOOK -->
                <path d="M 46,28 C 62,29 76,29 88,32" stroke="#D4AF37" stroke-width="2" stroke-linecap="round"/>
                
                <!-- Trục cánh quạt chính và Cánh quạt chính quay liên tục -->
                <rect x="64" y="8" width="4" height="8" fill="#33312E"/>
                <g transform="translate(66, 8)">
                    <ellipse cx="0" cy="0" rx="48" ry="4" fill="rgba(212, 175, 55, 0.28)"/>
                    <g class="airplane-propeller">
                        <line x1="-48" y1="0" x2="48" y2="0" stroke="#D4AF37" stroke-width="2.4" stroke-linecap="round"/>
                        <line x1="0" y1="-3" x2="0" y2="3" stroke="#FAF8F5" stroke-width="2" stroke-linecap="round"/>
                    </g>
                    <circle cx="0" cy="0" r="3.2" fill="#8B4A3C" stroke="#D4AF37" stroke-width="0.8"/>
                </g>

                <!-- Móc tời kéo cờ phía sau -->
                <circle cx="10" cy="24" r="2.6" fill="#D4AF37" stroke="#8B4A3C" stroke-width="1.2"/>
            </svg>
        </div>
    `;
    return wrapper;
}

// Tạo mô hình Trực thăng 2 (Trực thăng cứu hộ kéo Header)
function createPlane2TugElement() {
    const wrapper = document.createElement('div');
    wrapper.id = 'airplane-entity-2';
    wrapper.className = 'airplane-entity';
    wrapper.innerHTML = `
        <div style="display:flex;align-items:center;position:relative;">
            <!-- Trực thăng cứu hộ 2 (Hướng mũi sang trái, tông obsidian & vàng kim) -->
            <svg width="124" height="52" viewBox="0 0 124 52" fill="none" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;filter:drop-shadow(0 6px 14px rgba(0,0,0,0.28));">
                <defs>
                    <linearGradient id="heliBody2" x1="100%" y1="0%" x2="0%" y2="0%">
                        <stop offset="0%" stop-color="#1F1D1A"/>
                        <stop offset="50%" stop-color="#3A3732"/>
                        <stop offset="100%" stop-color="#4F4A43"/>
                    </linearGradient>
                    <linearGradient id="cockpitGlass2" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#8B4A3C" stop-opacity="0.9"/>
                        <stop offset="50%" stop-color="#D4AF37" stop-opacity="0.85"/>
                        <stop offset="100%" stop-color="#FAF8F5" stop-opacity="0.95"/>
                    </linearGradient>
                </defs>
                
                <!-- Càng hạ cánh -->
                <line x1="80" y1="38" x2="74" y2="47" stroke="#4A4742" stroke-width="2"/>
                <line x1="50" y1="38" x2="44" y2="47" stroke="#4A4742" stroke-width="2"/>
                <path d="M 92,47 L 32,47 C 28,47 25,44 23,41" stroke="#D4AF37" stroke-width="2.8" stroke-linecap="round"/>
                
                <!-- Cần đuôi vươn về bên phải -->
                <path d="M 70,23 L 110,19 L 114,13 L 116,13 L 116,26 L 110,24 L 70,32 Z" fill="#2E2C28" stroke="#D4AF37" stroke-width="1.2"/>
                <path d="M 110,21 L 72,26" stroke="#D4AF37" stroke-width="2.2"/>
                
                <!-- Cánh đứng đuôi và cánh quạt đuôi quay liên tục -->
                <polygon points="112,13 118,2 122,2 116,24" fill="#8B4A3C"/>
                <g transform="translate(119, 5)">
                    <ellipse cx="0" cy="0" rx="1.5" ry="9" fill="rgba(212, 175, 55, 0.4)" class="airplane-propeller"/>
                    <line x1="0" y1="-9" x2="0" y2="9" stroke="#D4AF37" stroke-width="1.8" class="airplane-propeller"/>
                    <circle cx="0" cy="0" r="1.8" fill="#D4AF37"/>
                </g>

                <!-- Thân buồng lái trực thăng cứu hộ hướng TRÁI -->
                <path d="M 76,16 C 64,16 36,18 28,24 C 22,28 22,34 30,37 C 42,40 68,40 78,36 C 82,34 84,24 76,16 Z" fill="url(#heliBody2)" stroke="#D4AF37" stroke-width="1.4"/>
                
                <!-- Kính buồng lái -->
                <path d="M 46,19 C 36,20 29,23 26,27 C 26,31 30,34 38,34 L 46,34 Z" fill="url(#cockpitGlass2)"/>
                <path d="M 44,21 C 37,22 32,25 30,28" stroke="#FFF" stroke-width="1" stroke-linecap="round" opacity="0.8"/>
                
                <!-- Sọc nhận diện cứu hộ vàng kim -->
                <path d="M 78,28 C 62,29 48,29 36,32" stroke="#D4AF37" stroke-width="2" stroke-linecap="round"/>
                
                <!-- Trục cánh quạt chính và Cánh quạt chính -->
                <rect x="56" y="8" width="4" height="8" fill="#D4AF37"/>
                <g transform="translate(58, 8)">
                    <ellipse cx="0" cy="0" rx="48" ry="4" fill="rgba(212, 175, 55, 0.3)"/>
                    <g class="airplane-propeller">
                        <line x1="-48" y1="0" x2="48" y2="0" stroke="#D4AF37" stroke-width="2.4" stroke-linecap="round"/>
                        <line x1="0" y1="-3" x2="0" y2="3" stroke="#FAF8F5" stroke-width="2" stroke-linecap="round"/>
                    </g>
                    <circle cx="0" cy="0" r="3.2" fill="#8B4A3C" stroke="#D4AF37" stroke-width="0.8"/>
                </g>

                <!-- Móc tời kéo Header -->
                <circle cx="114" cy="24" r="2.6" fill="#D4AF37" stroke="#FFF" stroke-width="1.2"/>
            </svg>

            <!-- Dây cáp tời kéo Header -->
            <svg width="50" height="14" viewBox="0 0 50 14" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-left:-2px;">
                <line x1="0" y1="7" x2="50" y2="7" stroke="#D4AF37" stroke-width="2.2" stroke-dasharray="5,2"/>
            </svg>
        </div>
    `;
    return wrapper;
}

// Click khoảng trống Header: Tăng tốc x5 hoàn toàn âm thầm
function handleHeaderSpeedupClick(e) {
    if (!airplaneAnimationState.isRunning) return;
    const interactive = e.target.closest('button, a, input, form, select, textarea, [role="button"], #search-dropdown, #avatar-dropdown-menu, #search-expand-box, .group\\/cat');
    if (interactive) return;

    if (airplaneAnimationState.speedMultiplier < 5.0) {
        airplaneAnimationState.speedMultiplier = 5.0;
    }
}

// Dọn dẹp và khôi phục an toàn
export function resetAirplaneAnimation() {
    if (airplaneAnimationState.animFrameId) {
        cancelAnimationFrame(airplaneAnimationState.animFrameId);
        airplaneAnimationState.animFrameId = null;
    }

    if (airplaneAnimationState.smallFlagObj) {
        const sObj = airplaneAnimationState.smallFlagObj;
        try {
            sObj.mesh?.geometry?.dispose?.();
            sObj.mesh?.material?.dispose?.();
            if (sObj.texture) sObj.texture.dispose();
            sObj.renderer?.dispose?.();
        } catch (_) {}
        airplaneAnimationState.smallFlagObj = null;
    }

    const stage = document.getElementById('airplane-stage-layer');
    if (stage) {
        const canvas = document.getElementById('airplane-effects-canvas');
        stage.innerHTML = '';
        if (canvas) {
            stage.appendChild(canvas);
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    const headerWrapper = document.getElementById('header-content-wrapper');
    if (headerWrapper) {
        headerWrapper.style.transform = '';
        headerWrapper.style.transition = '';
    }

    const navbar = document.getElementById('navbar');
    if (navbar) {
        navbar.removeEventListener('click', handleHeaderSpeedupClick);
    }

    airplaneAnimationState.isRunning = false;
    airplaneAnimationState.speedMultiplier = 1.0;
    airplaneAnimationState.elapsedTime = 0;
    airplaneAnimationState.flagClothTime = 0;
    airplaneAnimationState.smokeParticles = [];
}

// Kích hoạt hoạt cảnh trực thăng điện ảnh
export function triggerAirplaneBannerAnimation(event) {
    if (event) {
        event.preventDefault?.();
        event.stopPropagation?.();
    }

    if (airplaneAnimationState.isRunning) return;

    const stage = document.getElementById('airplane-stage-layer');
    const headerWrapper = document.getElementById('header-content-wrapper');
    const navbar = document.getElementById('navbar');
    if (!stage || !headerWrapper || !navbar) return;

    // Tải trước Three.js
    ensureThreeLoaded();

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    resetAirplaneAnimation();
    airplaneAnimationState.isRunning = true;
    airplaneAnimationState.speedMultiplier = 1.0;
    airplaneAnimationState.elapsedTime = 0;
    airplaneAnimationState.flagClothTime = 0;
    airplaneAnimationState.lastTime = performance.now();

    initSmokeCanvas();
    navbar.addEventListener('click', handleHeaderSpeedupClick);

    const plane1 = createPlane1WithFlagElement();
    stage.appendChild(plane1);
    let plane2 = null;

    const screenWidth = window.innerWidth;
    const isMobile = screenWidth < 640;
    const flagW = isMobile ? 84 : 108;
    const flagH = isMobile ? 56 : 72;
    const cableW = isMobile ? 28 : 36;
    const planeW = 124;
    const plane1TotalWidth = flagW + cableW + planeW;

    const smallFlagCanvas = plane1.querySelector('#small-flag-webgl-canvas');
    if (smallFlagCanvas) {
        airplaneAnimationState.smallFlagObj = initSmallFlagCloth(smallFlagCanvas, flagW, flagH);
    }

    const contactGap = 20;
    const plane1StartX = -plane1TotalWidth - 60;
    const totalShiftDistance = prefersReducedMotion ? 0 : (screenWidth + 120);

    const d1 = airplaneAnimationState.durationPhase1; // 5.8s
    const dPause = airplaneAnimationState.durationPause; // 1.6s
    const d2 = airplaneAnimationState.durationPhase2; // 4.8s
    const totalDuration = d1 + dPause + d2; // 12.2s

    function tick(currentTime) {
        if (!airplaneAnimationState.isRunning) return;

        const rawDelta = (currentTime - airplaneAnimationState.lastTime) / 1000;
        airplaneAnimationState.lastTime = currentTime;

        const delta = Math.min(rawDelta, 0.1) * airplaneAnimationState.speedMultiplier;
        airplaneAnimationState.elapsedTime += delta;
        airplaneAnimationState.flagClothTime += delta;

        const elapsed = airplaneAnimationState.elapsedTime;
        const clothTime = airplaneAnimationState.flagClothTime;
        const speed = airplaneAnimationState.speedMultiplier;

        // Render sóng vải WebGL
        if (airplaneAnimationState.smallFlagObj) {
            const sObj = airplaneAnimationState.smallFlagObj;
            sObj.uniforms.uTime.value = clothTime;
            sObj.uniforms.uSpeed.value = speed;
            sObj.renderer.render(sObj.scene, sObj.camera);
        }

        updateAndDrawSmoke(delta);

        // GIAI ĐOẠN 1: Trực thăng 1 đẩy Header
        if (elapsed < d1) {
            const progress1 = Math.min(elapsed / d1, 1);
            const contactP = 0.12;

            let headerShift = 0;
            let plane1X = 0;

            if (progress1 < contactP) {
                const np = progress1 / contactP;
                const easeApproach = Math.sin(np * Math.PI * 0.5);
                plane1X = plane1StartX + ((-plane1TotalWidth - contactGap) - plane1StartX) * easeApproach;

                if (np > 0.5) {
                    const vibeP = (np - 0.5) / 0.5;
                    headerShift = Math.sin(vibeP * Math.PI * 6) * 1.2 * vibeP;
                }
            } else {
                const norm = (progress1 - contactP) / (1 - contactP);
                const pushEased = Math.pow(norm, 1.75);
                headerShift = pushEased * totalShiftDistance;
                plane1X = headerShift - plane1TotalWidth - contactGap;
            }

            const altitudeY = Math.sin(progress1 * Math.PI * 4) * 3;
            plane1.style.transform = `translate3d(${plane1X}px, calc(-50% + ${altitudeY}px), 0)`;
            headerWrapper.style.transform = `translate3d(${headerShift}px, 0, 0)`;

            if (progress1 < 0.95 && Math.random() < 0.6) {
                const exhaustX = plane1X + flagW + cableW + 56;
                emitSmokeParticle(exhaustX, 44 + altitudeY);
            }
        } 
        // GIAI ĐOẠN 2: Chờ 1.6s
        else if (elapsed < d1 + dPause) {
            if (plane1.parentNode) {
                plane1.remove();
            }
            headerWrapper.style.transform = `translate3d(${totalShiftDistance}px, 0, 0)`;
        } 
        // GIAI ĐOẠN 3: Trực thăng 2 kéo Header trở lại
        else if (elapsed < totalDuration) {
            if (plane1.parentNode) plane1.remove();

            if (!plane2) {
                plane2 = createPlane2TugElement();
                stage.appendChild(plane2);
            }

            const progress2 = Math.min((elapsed - (d1 + dPause)) / d2, 1);
            const easeOutCubic = 1 - Math.pow(1 - progress2, 3);
            const currentShift = (1 - easeOutCubic) * totalShiftDistance;
            headerWrapper.style.transform = `translate3d(${currentShift}px, 0, 0)`;

            const plane2X = currentShift - 170;
            const altitudeY2 = Math.sin(progress2 * Math.PI * 3) * 3;
            plane2.style.transform = `translate3d(${plane2X}px, calc(-50% + ${altitudeY2}px), 0)`;

            if (progress2 < 0.85 && Math.random() < 0.5) {
                emitSmokeParticle(plane2X + 68, 44 + altitudeY2);
            }

            if (progress2 > 0.85) {
                const fadeProgress = (progress2 - 0.85) / 0.15;
                plane2.style.opacity = String(1 - fadeProgress);
            } else {
                plane2.style.opacity = '1';
            }
        } 
        // KẾT THÚC
        else {
            resetAirplaneAnimation();
            return;
        }

        airplaneAnimationState.animFrameId = requestAnimationFrame(tick);
    }

    airplaneAnimationState.animFrameId = requestAnimationFrame(tick);
}

// Gắn toàn cục
if (typeof window !== 'undefined') {
    window.triggerAirplaneBannerAnimation = triggerAirplaneBannerAnimation;
    window.triggerVietnamFlagAnimation = triggerAirplaneBannerAnimation;
    window.addEventListener('pagehide', resetAirplaneAnimation);
    window.addEventListener('beforeunload', resetAirplaneAnimation);
}
