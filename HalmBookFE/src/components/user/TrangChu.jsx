import { useEffect, useRef, useState } from "react";
import logo from "@/assets/images/logo.png";
import axiosInstance from "@/services/axiosClient";
import UserLayout from "./layout/UserLayout";

// Chỉnh số px này để thay đổi cỡ chữ tin nhắn trong khung chat AI.
const CHAT_MESSAGE_FONT_SIZE = "16px";

function applyImageFallback(event, fallbackSrc) {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied) return;

  image.dataset.fallbackApplied = "true";
  image.src = fallbackSrc;
}

const PAGE_STYLES = [
  "",
  "        /* ========================================================",
  "           TYPOGRAPHY & CSS VARIABLES (STRICTLY 3 FONTS)",
  "           ======================================================== */",
  "        :root {",
  "            --font-display: \"Inter\", sans-serif;",
  "            --font-ui: \"Inter\", sans-serif;",
  "            --font-metadata: \"Roboto\", sans-serif;",
  "            --font-editorial: \"Open Sans\", sans-serif;",
  "        }",
  "",
  "        html {",
  "            scroll-behavior: smooth;",
  "        }",
  "",
  "        body {",
  "            font-family: var(--font-ui);",
  "            background-color: #F7F4EE;",
  "            color: #1E1F1D;",
  "            overflow-x: hidden;",
  "            -webkit-font-smoothing: antialiased;",
  "            transition: background-color 0.4s ease, color 0.4s ease;",
  "        }",
  "",
  "        /* Chapter Flash Cue (subtle vignette flash when flipping) */",
  "        #chapter-flip-cue {",
  "            position: fixed;",
  "            inset: 0;",
  "            pointer-events: none;",
  "            z-index: 9999;",
  "            opacity: 0;",
  "            background: radial-gradient(circle at center, transparent 40%, rgba(142,48,56,0.08) 100%);",
  "            transition: opacity 0.4s ease;",
  "        }",
  "        .dark #chapter-flip-cue {",
  "            background: radial-gradient(circle at center, transparent 40%, rgba(212,175,55,0.06) 100%);",
  "        }",
  "        #chapter-flip-cue.is-active {",
  "            opacity: 1;",
  "        }",
  "",
  "        .dark body {",
  "            background-color: #111210;",
  "            color: #EDE9DF;",
  "        }",
  "",
  "        .font-display-hero {",
  "            font-family: var(--font-display);",
  "            font-weight: 900;",
  "            letter-spacing: -0.03em;",
  "        }",
  "",
  "        .font-editorial-body {",
  "            font-family: var(--font-editorial);",
  "            line-height: 1.75;",
  "        }",
  "",
  "        .font-metadata-spec {",
  "            font-family: var(--font-metadata);",
  "        }",
  "",
  "        /* Subtle paper grain texture overlay */",
  "        .paper-grain {",
  "            background-image: radial-gradient(rgba(30, 31, 29, 0.04) 1px, transparent 1px);",
  "            background-size: 28px 28px;",
  "        }",
  "        .dark .paper-grain {",
  "            background-image: radial-gradient(rgba(237, 233, 223, 0.04) 1px, transparent 1px);",
  "            background-size: 28px 28px;",
  "        }",
  "",
  "        /* Starry sky overlay for dark mode */",
  "        #starry-background {",
  "            position: fixed;",
  "            top: 0;",
  "            left: 0;",
  "            width: 100%;",
  "            height: 100%;",
  "            pointer-events: none;",
  "            z-index: 1;",
  "            opacity: 0;",
  "            transition: opacity 0.6s ease;",
  "        }",
  "        .dark #starry-background {",
  "            opacity: 1;",
  "        }",
  "        .star {",
  "            position: absolute;",
  "            background-color: #fff;",
  "            border-radius: 50%;",
  "            pointer-events: none;",
  "        }",
  "        @keyframes starTwinkle {",
  "            0%, 100% { opacity: 0.2; transform: scale(0.8); }",
  "            50% { opacity: 0.9; transform: scale(1.3); }",
  "        }",
  "",
  "        /* HALMBOOK Editorial Header Styles */",
  "        .font-nunito {",
  "            font-family: 'Nunito', sans-serif;",
  "        }",
  "",
  "        .header-transition {",
  "            transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), padding 0.3s ease, background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;",
  "        }",
  "",
  "        /* HALMBOOK Chromatic Header - Hòa quyện đa sắc, chuyển tầng mượt mà và đồng nhất */",
  "        #navbar {",
  "            background: linear-gradient(",
  "                90deg, ",
  "                #EBE3D5 0%,        /* Bên trái: màu đậm hơn (warm parchment & amber-wine tint) */",
  "                #F2EDE3 12%,       /* Chuyển tầng mượt mà */",
  "                #FAF7F2 26%,       /* Bên trái nhạt dần (airy luminous cream) */",
  "                #F8F5EE 38%,       /* Nhẹ nhàng thanh thoát */",
  "                #ECE3D0 50%,       /* Ở giữa lại đậm (warm gold-parchment depth) */",
  "                #E8DECB 54%,       /* Điểm nhấn đậm trung tâm */",
  "                #F6F2E8 68%,       /* Chuyển tiếp dịu lại */",
  "                #FAF7F2 78%,       /* Êm dịu */",
  "                #EFE7D8 88%,       /* Ánh ấm chuyển dần */",
  "                #EBE2D2 100%       /* Bên phải: hòa quyện tông ấm đồng nhất */",
  "            ) !important;",
  "            backdrop-filter: blur(16px);",
  "            -webkit-backdrop-filter: blur(16px);",
  "            border-bottom: 1px solid rgba(220, 212, 198, 0.7) !important;",
  "            color: #242321;",
  "            box-shadow: 0 4px 20px -4px rgba(36, 35, 33, 0.05) !important;",
  "            transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), padding 0.3s ease, background 0.4s ease, border-color 0.3s ease, box-shadow 0.3s ease;",
  "            will-change: transform;",
  "            position: fixed;",
  "            top: 0;",
  "            width: 100%;",
  "        }",
  "",
  "        /* Lớp hòa quyện đa sắc tăng cường (Chromatic Blend Layers) */",
  "        #navbar::before {",
  "            content: '';",
  "            position: absolute;",
  "            inset: 0;",
  "            pointer-events: none;",
  "            z-index: 0;",
  "            background: ",
  "                /* Bên trái đậm hơn với sắc đỏ rượu vang và hổ phách trầm */",
  "                radial-gradient(ellipse 460px 100% at 0% 50%, rgba(139, 74, 60, 0.12) 0%, rgba(212, 175, 55, 0.08) 50%, transparent 80%),",
  "                /* Ở giữa đậm với ánh hoàng kim quý phái */",
  "                radial-gradient(ellipse 380px 100% at 50% 50%, rgba(212, 175, 55, 0.15) 0%, rgba(139, 74, 60, 0.06) 60%, transparent 80%),",
  "                /* Bên phải hòa quyện hổ phách và đỏ rượu */",
  "                radial-gradient(ellipse 400px 100% at 100% 50%, rgba(212, 175, 55, 0.15) 0%, rgba(139, 74, 60, 0.08) 55%, transparent 80%);",
  "            transition: opacity 0.4s ease;",
  "        }",
  "",
  "        /* Seamless blended bottom edge transition (Đường viền đáy hòa quyện đa sắc liền mạch) */",
  "        #navbar::after {",
  "            content: '';",
  "            position: absolute;",
  "            bottom: -1px;",
  "            left: 0;",
  "            right: 0;",
  "            height: 1px;",
  "            background: linear-gradient(90deg, ",
  "                rgba(139, 74, 60, 0.5) 0%, ",
  "                rgba(212, 175, 55, 0.35) 15%, ",
  "                rgba(230, 225, 216, 0.7) 28%, ",
  "                rgba(212, 175, 55, 0.55) 50%, ",
  "                rgba(139, 74, 60, 0.45) 54%, ",
  "                rgba(230, 225, 216, 0.7) 75%, ",
  "                rgba(212, 175, 55, 0.5) 100%",
  "            );",
  "            pointer-events: none;",
  "            z-index: 1;",
  "        }",
  "",
  "        #navbar.nav-hidden {",
  "            transform: translateY(-100%) !important;",
  "        }",
  "",
  "        .dark #navbar {",
  "            background: linear-gradient(",
  "                90deg, ",
  "                #251618 0%,        /* Bên trái: màu đậm hơn (rich obsidian wine-dark tone) */",
  "                #1e1616 12%,       /* Chuyển tiếp mượt */",
  "                #131411 26%,       /* Nhạt dần (deep smooth obsidian dark) */",
  "                #10110F 38%,       /* Êm dịu */",
  "                #261F14 50%,       /* Ở giữa lại đậm (rich obsidian amber-gold tone) */",
  "                #221A11 54%,       /* Đậm nét ánh kim trầm */",
  "                #161714 68%,       /* Chuyển tiếp dịu lại */",
  "                #111210 78%,       /* Êm dịu */",
  "                #1E1815 88%,       /* Ánh ấm chuyển dần */",
  "                #241518 100%       /* Bên phải: hòa quyện tông trầm đồng nhất */",
  "            ) !important;",
  "            backdrop-filter: blur(16px);",
  "            -webkit-backdrop-filter: blur(16px);",
  "            border-bottom: 1px solid rgba(56, 52, 44, 0.7) !important;",
  "            color: #EDE9DF;",
  "            box-shadow: 0 4px 25px -4px rgba(0, 0, 0, 0.6) !important;",
  "        }",
  "",
  "        .dark #navbar::before {",
  "            background: ",
  "                radial-gradient(ellipse 460px 100% at 0% 50%, rgba(139, 74, 60, 0.28) 0%, rgba(212, 175, 55, 0.15) 50%, transparent 80%),",
  "                radial-gradient(ellipse 380px 100% at 50% 50%, rgba(212, 175, 55, 0.22) 0%, rgba(139, 74, 60, 0.12) 60%, transparent 80%),",
  "                radial-gradient(ellipse 400px 100% at 100% 50%, rgba(212, 175, 55, 0.25) 0%, rgba(139, 74, 60, 0.18) 55%, transparent 80%);",
  "        }",
  "",
  "        .dark #navbar::after {",
  "            background: linear-gradient(90deg, ",
  "                rgba(139, 74, 60, 0.6) 0%, ",
  "                rgba(212, 175, 55, 0.45) 15%, ",
  "                rgba(44, 46, 41, 0.8) 28%, ",
  "                rgba(212, 175, 55, 0.65) 50%, ",
  "                rgba(139, 74, 60, 0.55) 54%, ",
  "                rgba(44, 46, 41, 0.8) 75%, ",
  "                rgba(212, 175, 55, 0.6) 100%",
  "            );",
  "        }",
  "",
  "        /* Functional label font sizing (+2px: 10px -> 12px) */",
  "        #navbar .icon-text {",
  "            font-size: 12px !important;",
  "            line-height: 1.25 !important;",
  "        }",
  "",
  "        /* Hover colors matching HALMBOOK wine / gold palette */",
  "        #navbar .group:hover .nav-text,",
  "        #navbar .group:hover .icon-text,",
  "        #navbar .nav-text:hover,",
  "        #navbar button:hover .nav-text {",
  "            color: #8B4A3C !important;",
  "        }",
  "",
  "        .dark #navbar .group:hover .nav-text,",
  "        .dark #navbar .group:hover .icon-text,",
  "        .dark #navbar .nav-text:hover,",
  "        .dark #navbar button:hover .nav-text {",
  "            color: #D4AF37 !important;",
  "        }",
  "",
  "        /* ========================================================",
  "           HOẠT CẢNH MÁY BAY KÉO CỜ VIỆT NAM TRÊN HEADER",
  "           ======================================================== */",
  "        #airplane-stage-layer {",
  "            position: fixed;",
  "            inset: 0;",
  "            width: 100vw;",
  "            height: 100vh;",
  "            overflow: hidden;",
  "            pointer-events: none;",
  "            z-index: 1;",
  "        }",
  "",
  "        #airplane-effects-canvas {",
  "            position: absolute;",
  "            inset: 0;",
  "            width: 100%;",
  "            height: 100%;",
  "            pointer-events: none;",
  "        }",
  "",
  "        #header-content-wrapper {",
  "            will-change: transform;",
  "            transform-origin: left center;",
  "            position: relative;",
  "            z-index: 20;",
  "        }",
  "",
  "        .airplane-entity {",
  "            position: absolute;",
  "            top: 48px;",
  "            transform: translateY(-50%);",
  "            display: flex;",
  "            align-items: center;",
  "            pointer-events: none;",
  "            user-select: none;",
  "            z-index: 1;",
  "            filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.28));",
  "            will-change: transform;",
  "        }",
  "",
  "        /* WebGL 3D Cloth Simulation Container */",
  "        .airplane-flag-canvas {",
  "            position: relative;",
  "            transform-origin: right center;",
  "            will-change: transform;",
  "            overflow: visible;",
  "        }",
  "",
  "        /* Propeller & Rotor spin blur */",
  "        .airplane-propeller {",
  "            transform-box: fill-box;",
  "            transform-origin: center;",
  "            animation: aeroPropSpin 0.05s linear infinite;",
  "        }",
  "",
  "        @keyframes aeroPropSpin {",
  "            0% { transform: rotate(0deg); }",
  "            100% { transform: rotate(360deg); }",
  "        }",
  "",
  "        @media (prefers-reduced-motion: reduce) {",
  "            .airplane-flag-canvas {",
  "                animation: none !important;",
  "            }",
  "            .airplane-propeller {",
  "                animation: none !important;",
  "            }",
  "        }",
  "",
  "        /* ========================================================",
  "           EDITORIAL BROADCAST & HERO PRESENTATION",
  "           ======================================================== */",
  "",
  "        .hero-broadcast {",
  "            width: 100%;",
  "            height: 100%;",
  "            /* Adjust these two values to control the banner's responsive height. */",
  "            min-height: 100vh;",
  "            max-height: 120vh;",
  "            margin: 0;",
  "            border: none;",
  "            border-radius: 0;",
  "            overflow: hidden;",
  "            background: transparent;",
  "            box-shadow: none;",
  "            display: flex;",
  "            flex-direction: column;",
  "            justify-content: space-between;",
  "            position: relative;",
  "            transition: background 0.4s ease;",
  "        }",
  "        /* Ambient luminous color aura */",
  "        .hero-broadcast::before {",
  "            content: '';",
  "            position: absolute;",
  "            inset: 0;",
  "            background: radial-gradient(circle at 82% 40%, rgba(212,175,55,0.12) 0%, transparent 55%),",
  "                        radial-gradient(circle at 18% 70%, rgba(142,48,56,0.1) 0%, transparent 60%);",
  "            pointer-events: none;",
  "            z-index: 1;",
  "        }",
  "        .hero-broadcast::after {",
  "            display: none;",
  "        }",
  "        /* Dark mode: Deep seamless harmony with night-bg (#111210) */",
  "        .dark .hero-broadcast {",
  "            background: transparent;",
  "            border: none;",
  "            box-shadow: none;",
  "        }",
  "        .dark .hero-broadcast::before {",
  "            background: radial-gradient(circle at 80% 40%, rgba(212,175,55,0.1) 0%, transparent 55%),",
  "                        radial-gradient(circle at 18% 75%, rgba(142,48,56,0.15) 0%, transparent 60%);",
  "        }",
  "        .dark .hero-broadcast::after {",
  "            display: none;",
  "        }",
  "        .hero-broadcast-viewport {",
  "            position: relative;",
  "            flex: 1;",
  "            min-height: 0;",
  "            overflow: hidden;",
  "            z-index: 3;",
  "        }",
  "        .hero-broadcast-slide {",
  "            position: absolute;",
  "            inset: 0;",
  "            display: grid;",
  "            grid-template-columns: 1fr;",
  "            gap: 24px;",
  "            align-items: center;",
  "            padding: 28px clamp(20px, 4vw, 64px);",
  "            opacity: 0;",
  "            transform: translateY(16px);",
  "            pointer-events: none;",
  "            transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);",
  "        }",
  "        @media (min-width: 900px) {",
  "            .hero-broadcast-slide {",
  "                /* The first track controls banner copy width; the second holds the book cards. */",
  "                grid-template-columns: minmax(0, 1.35fr) minmax(0, 0.65fr);",
  "                gap: clamp(32px, 5vw, 72px);",
  "                padding: 32px clamp(32px, 5vw, 80px);",
  "            }",
  "        }",
  "        .hero-broadcast-slide.is-active {",
  "            opacity: 1;",
  "            transform: translateY(0);",
  "            pointer-events: auto;",
  "        }",
  "        .hero-broadcast-books {",
  "            display: flex;",
  "            align-items: center;",
  "            justify-content: center;",
  "            gap: 18px;",
  "            perspective: 1200px;",
  "        }",
  "        .hero-broadcast-book-card {",
  "            position: relative;",
  "            width: 120px;",
  "            height: 175px;",
  "            border-radius: 10px;",
  "            overflow: hidden;",
  "            box-shadow: 0 16px 32px rgba(0,0,0,0.38), 0 3px 8px rgba(0,0,0,0.2);",
  "            transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease;",
  "            transform-style: preserve-3d;",
  "            background: #2a141a;",
  "            flex-shrink: 0;",
  "            border: 1px solid rgba(255,255,255,0.25);",
  "        }",
  "        @media (min-width: 640px) {",
  "            .hero-broadcast-book-card {",
  "                width: 135px;",
  "                height: 195px;",
  "            }",
  "        }",
  "        @media (min-width: 1280px) {",
  "            .hero-broadcast-book-card {",
  "                width: 155px;",
  "                height: 220px;",
  "            }",
  "        }",
  "        .hero-broadcast-book-card:hover {",
  "            transform: translateY(-8px) scale(1.05) rotateY(-5deg);",
  "            box-shadow: 0 24px 45px rgba(0,0,0,0.5);",
  "        }",
  "        .hero-broadcast-book-card img {",
  "            width: 100%;",
  "            height: 100%;",
  "            object-fit: cover;",
  "            display: block;",
  "        }",
  "        .hero-broadcast-book-card .card-badge {",
  "            position: absolute;",
  "            top: 8px;",
  "            left: 8px;",
  "            padding: 2px 8px;",
  "            font-size: 9px;",
  "            font-weight: 800;",
  "            letter-spacing: 0.1em;",
  "            text-transform: uppercase;",
  "            border-radius: 4px;",
  "            background: rgba(142,48,56,0.95);",
  "            color: #fff;",
  "            backdrop-filter: blur(4px);",
  "            box-shadow: 0 2px 6px rgba(0,0,0,0.3);",
  "        }",
  "        .hero-broadcast-controls {",
  "            display: flex;",
  "            align-items: center;",
  "            justify-content: space-between;",
  "            padding: 10px clamp(20px, 4vw, 64px);",
  "            border: none;",
  "            background: transparent;",
  "            position: relative;",
  "            z-index: 4;",
  "        }",
  "        .dark .hero-broadcast-controls {",
  "            border: none;",
  "            background: transparent;",
  "        }",
  "        .hero-broadcast-controls button[data-broadcast-prev],",
  "        .hero-broadcast-controls button[data-broadcast-next] {",
  "            width: 34px;",
  "            height: 34px;",
  "            display: grid;",
  "            place-items: center;",
  "            border-radius: 50%;",
  "            border: 1px solid rgba(142,48,56,0.25);",
  "            background: rgba(255,255,255,0.75);",
  "            color: #1E1F1D;",
  "            font-size: 18px;",
  "            font-weight: bold;",
  "            cursor: pointer;",
  "            transition: all 0.2s ease;",
  "        }",
  "        .dark .hero-broadcast-controls button[data-broadcast-prev],",
  "        .dark .hero-broadcast-controls button[data-broadcast-next] {",
  "            border-color: rgba(212,175,55,0.3);",
  "            background: rgba(255,255,255,0.08);",
  "            color: #EDE9DF;",
  "        }",
  "        .hero-broadcast-controls button:hover {",
  "            transform: scale(1.1);",
  "            background: #8E3038;",
  "            color: #fff;",
  "            border-color: #8E3038;",
  "        }",
  "        .dark .hero-broadcast-controls button:hover {",
  "            background: #D4AF37;",
  "            color: #111210;",
  "            border-color: #D4AF37;",
  "        }",
  "        .hero-broadcast-dots {",
  "            display: flex;",
  "            gap: 8px;",
  "            align-items: center;",
  "        }",
  "        .hero-broadcast-dots button {",
  "            width: 8px;",
  "            height: 8px;",
  "            padding: 0;",
  "            border: 0;",
  "            border-radius: 50%;",
  "            background: rgba(0,0,0,0.2);",
  "            cursor: pointer;",
  "            transition: all 0.25s ease;",
  "        }",
  "        .dark .hero-broadcast-dots button {",
  "            background: rgba(255,255,255,0.25);",
  "        }",
  "        .hero-broadcast-dots button[aria-current=\"true\"] {",
  "            width: 26px;",
  "            border-radius: 999px;",
  "            background: #8E3038;",
  "        }",
  "        .dark .hero-broadcast-dots button[aria-current=\"true\"] {",
  "            background: #D4AF37;",
  "        }",
  "        @media (max-width:639px) { .floating-book-stage { min-height:390px; } .floating-book { transform:scale(.88); } .hero-broadcast-slide { grid-template-columns:1fr; gap:11px; } .hero-broadcast-art { height:118px; font-size:31px; } .hero-broadcast-books { gap:10px; } .hero-broadcast-book-card { width:82px; height:118px; } }",
  "",
  "        /* ========================================================",
  "           CHAPTER 2 — FULL-VIEWPORT CINEMATIC BOOK REVEAL",
  "           ======================================================== */",
  "        .ch2-viewport-scene {",
  "            position: relative;",
  "            width: 100vw;",
  "            isolation: isolate;",
  "            left: 50%;",
  "            right: 50%;",
  "            margin-left: -50vw;",
  "            margin-right: -50vw;",
  "            min-height: auto;",
  "            perspective: 2200px;",
  "            perspective-origin: 50% 50%;",
  "            overflow-x: clip;",
  "            overflow-y: visible;",
  "        }",
  "",
  "        .ch2-book-assembly-spread {",
  "            position: relative;",
  "            width: 100%;",
  "            max-width: 1180px;",
  "            margin: 0 auto;",
  "            transform-style: preserve-3d;",
  "        }",
  "",
  "        /* Deep editorial rich book wings */",
  "        .ch2-wing {",
  "            position: relative;",
  "            transform-style: preserve-3d;",
  "            will-change: transform, opacity;",
  "            border-radius: 14px;",
  "            box-shadow: 0 30px 70px -15px rgba(0, 0, 0, 0.28), 0 10px 25px -5px rgba(0, 0, 0, 0.15);",
  "        }",
  "        .dark .ch2-wing {",
  "            box-shadow: 0 35px 80px -15px rgba(0, 0, 0, 0.7), 0 12px 30px -5px rgba(0, 0, 0, 0.5);",
  "        }",
  "",
  "        /* Left wing: Royal Wine & Gold hardcover spread harmonizing with brand identity */",
  "        .ch2-wing-left {",
  "            background: linear-gradient(145deg, #3E1217 0%, #5C1B23 45%, #7D262F 80%, #320E12 100%);",
  "            border: 1px solid rgba(212, 175, 55, 0.45);",
  "            color: #EDE9DF;",
  "            border-top-right-radius: 3px;",
  "            border-bottom-right-radius: 3px;",
  "        }",
  "        .ch2-wing-left::after {",
  "            content: '';",
  "            position: absolute;",
  "            top: 0;",
  "            right: 0;",
  "            width: 48px;",
  "            height: 100%;",
  "            background: linear-gradient(to left, rgba(0, 0, 0, 0.5), transparent);",
  "            pointer-events: none;",
  "            border-radius: 0 3px 3px 0;",
  "        }",
  "",
  "        /* Right wing: Warm amber/wine-accented paper spread */",
  "        .ch2-wing-right {",
  "            background: linear-gradient(145deg, #FAF7EE 0%, #F5EFE0 60%, #EFE8D6 100%);",
  "            border: 1px solid rgba(212, 175, 55, 0.35);",
  "            color: #1E1F1D;",
  "            border-top-left-radius: 3px;",
  "            border-bottom-left-radius: 3px;",
  "        }",
  "        .dark .ch2-wing-right {",
  "            background: linear-gradient(145deg, #20242B 0%, #1B1E24 60%, #15181D 100%);",
  "            color: #EDE9DF;",
  "            border-color: rgba(212, 175, 55, 0.25);",
  "        }",
  "        .ch2-wing-right::after {",
  "            content: '';",
  "            position: absolute;",
  "            top: 0;",
  "            left: 0;",
  "            width: 48px;",
  "            height: 100%;",
  "            background: linear-gradient(to right, rgba(0, 0, 0, 0.3), transparent);",
  "            pointer-events: none;",
  "            border-radius: 3px 0 0 3px;",
  "        }",
  "",
  "        /* Center Spine Hinge Bar */",
  "        .ch2-spine-hinge {",
  "            position: absolute;",
  "            top: 0;",
  "            bottom: 0;",
  "            left: 50%;",
  "            width: 14px;",
  "            margin-left: -7px;",
  "            background: linear-gradient(90deg, #0d131f 0%, #303746 40%, #D4AF37 50%, #303746 60%, #0d131f 100%);",
  "            box-shadow: inset 0 0 8px rgba(0,0,0,0.8), 0 0 15px rgba(0,0,0,0.4);",
  "            z-index: 30;",
  "            border-radius: 3px;",
  "            opacity: 0;",
  "            transition: opacity 0.4s ease;",
  "        }",
  "",
  "        /* ========================================================",
  "           SCROLL SCENES TRANSITIONS & KEYFRAMES",
  "           ======================================================== */",
  "        .shelf-scroll-row {",
  "            scrollbar-width: none;",
  "            -ms-overflow-style: none;",
  "        }",
  "        .shelf-scroll-row::-webkit-scrollbar {",
  "            display: none;",
  "            width: 0;",
  "            height: 0;",
  "        }",
  "        .shelf-scroll-row {",
  "            padding-top: 1rem;",
  "            padding-bottom: 1rem;",
  "        }",
  "        .book-card-item {",
  "            position: relative;",
  "            z-index: 1;",
  "        }",
  "        .book-card-item:hover {",
  "            z-index: 20;",
  "        }",
  "        .book-hover-popup {",
  "            position: fixed;",
  "            z-index: 10000;",
  "            width: min(300px, calc(100vw - 24px));",
  "            padding: 14px;",
  "            border: 1px solid rgba(142, 48, 56, 0.28);",
  "            border-radius: 14px;",
  "            background: rgba(255, 254, 250, 0.98);",
  "            color: #1E1F1D;",
  "            box-shadow: 0 18px 45px rgba(30, 31, 29, 0.22);",
  "            pointer-events: none;",
  "            opacity: 0;",
  "            transform: translateY(5px);",
  "            transition: opacity 0.16s ease, transform 0.16s ease;",
  "        }",
  "        .book-hover-popup.is-visible {",
  "            opacity: 1;",
  "            transform: translateY(0);",
  "        }",
  "        .dark .book-hover-popup {",
  "            border-color: rgba(212, 175, 55, 0.35);",
  "            background: rgba(32, 34, 30, 0.98);",
  "            color: #EDE9DF;",
  "            box-shadow: 0 18px 45px rgba(0, 0, 0, 0.5);",
  "        }",
  "        .book-hover-popup__title {",
  "            margin: 0 0 3px;",
  "            font-weight: 800;",
  "            line-height: 1.3;",
  "        }",
  "        .book-hover-popup__author, .book-hover-popup__meta {",
  "            color: #66645E;",
  "            font-size: 12px;",
  "        }",
  "        .dark .book-hover-popup__author, .dark .book-hover-popup__meta {",
  "            color: #96938B;",
  "        }",
  "        .book-hover-popup__description {",
  "            display: -webkit-box;",
  "            margin: 10px 0 0;",
  "            overflow: hidden;",
  "            color: #66645E;",
  "            font-size: 12px;",
  "            line-height: 1.5;",
  "            -webkit-box-orient: vertical;",
  "            -webkit-line-clamp: 3;",
  "        }",
  "        .dark .book-hover-popup__description { color: #B8B5AC; }",
  "",
  "        /* ========================================================",
  "           CHAPTER 03 & 04 — DISTINCT EDITORIAL TRANSITIONS",
  "           Chapter 3: Elegant upward perspective reveal",
  "           Chapter 4: Smooth horizontal panoramic unfold",
  "           ======================================================== */",
  "        .ch3-page-stage {",
  "            perspective: 1200px;",
  "        }",
  "        .ch3-page-leaf {",
  "            position: relative;",
  "            transform-style: preserve-3d;",
  "            will-change: transform, opacity;",
  "        }",
  "",
  "        .ch4-page-stage {",
  "            perspective: 1400px;",
  "        }",
  "        .ch4-page-leaf {",
  "            position: relative;",
  "            transform-style: preserve-3d;",
  "            will-change: transform, opacity;",
  "        }",
  "",
  "        #trending-section #trending-cat-nav {",
  "            scrollbar-width: none;",
  "        }",
  "        #trending-section #trending-cat-nav::-webkit-scrollbar {",
  "            display: none;",
  "        }",
  "        #trending-section #trending-cat-nav .trending-cat-btn.is-active {",
  "            background-color: #8E3038;",
  "            color: #FFFEFA;",
  "            border-color: #8E3038;",
  "        }",
  "        .dark #trending-section #trending-cat-nav .trending-cat-btn.is-active {",
  "            background-color: #B8860B;",
  "            color: #111210;",
  "            border-color: #B8860B;",
  "        }",
  "        #trending-section #trending-shelf {",
  "            gap: 1.25rem;",
  "        }",
  "",
  "        /* Trending Shelf: Exactly 4 cards visible on desktop (no 4.5 book overflow) */",
  "        @media (min-width: 1024px) {",
  "            #trending-shelf > div {",
  "                flex: 0 0 calc((100% - (3 * 1.25rem)) / 4) !important;",
  "                width: calc((100% - (3 * 1.25rem)) / 4) !important;",
  "                max-width: calc((100% - (3 * 1.25rem)) / 4) !important;",
  "            }",
  "        }",
  "",
  "        /* Children, Literature & Selfgrowth Shelves: Exactly 6 cards visible (no overflow fraction) */",
  "        @media (min-width: 1280px) {",
  "            #children-shelf > div,",
  "            #literature-shelf > div,",
  "            #selfgrowth-shelf > div,",
  "            #science-shelf > div,",
  "            #business-shelf > div,",
  "            #history-shelf > div,",
  "            #philosophy-shelf > div,",
  "            #artlifestyle-shelf > div,",
  "            #biography-shelf > div {",
  "                flex: 0 0 calc((100% - (5 * 1.25rem)) / 6) !important;",
  "                width: calc((100% - (5 * 1.25rem)) / 6) !important;",
  "                max-width: calc((100% - (5 * 1.25rem)) / 6) !important;",
  "            }",
  "        }",
  "        @media (min-width: 1024px) and (max-width: 1279px) {",
  "            #children-shelf > div,",
  "            #literature-shelf > div,",
  "            #selfgrowth-shelf > div,",
  "            #science-shelf > div,",
  "            #business-shelf > div,",
  "            #history-shelf > div,",
  "            #philosophy-shelf > div,",
  "            #artlifestyle-shelf > div,",
  "            #biography-shelf > div {",
  "                flex: 0 0 calc((100% - (4 * 1.25rem)) / 5) !important;",
  "                width: calc((100% - (4 * 1.25rem)) / 5) !important;",
  "                max-width: calc((100% - (4 * 1.25rem)) / 5) !important;",
  "            }",
  "        }",
  "",
  "        /* Topic Shelf: Exactly 3 cards visible per row with horizontal scrolling */",
  "        @media (min-width: 1024px) {",
  "            #topic-shelf > div {",
  "                flex: 0 0 calc((100% - (2 * 1.5rem)) / 3) !important;",
  "                width: calc((100% - (2 * 1.5rem)) / 3) !important;",
  "                max-width: calc((100% - (2 * 1.5rem)) / 3) !important;",
  "            }",
  "        }",
  "        @media (min-width: 640px) and (max-width: 1023px) {",
  "            #topic-shelf > div {",
  "                flex: 0 0 calc((100% - 1.5rem) / 2) !important;",
  "                width: calc((100% - 1.5rem) / 2) !important;",
  "                max-width: calc((100% - 1.5rem) / 2) !important;",
  "            }",
  "        }",
  "        @media (max-width: 639px) {",
  "            #topic-shelf > div {",
  "                flex: 0 0 85% !important;",
  "                width: 85% !important;",
  "                max-width: 85% !important;",
  "            }",
  "        }",
  "",
  "",
  "        /* ========================================================",
  "           SEAMLESS CHAPTER AMBIENT HARMONY & 4-CORNER CHROMATIC AURAS",
  "           Triệt tiêu phân mảng/phân bảng - Hòa quyện liền mạch toàn trang",
  "           ======================================================== */",
  "        .chapter-ambient-wrapper {",
  "            position: relative;",
  "            isolation: isolate;",
  "        }",
  "",
  "        /* Seamless borderless transition between chapters */",
  "        .chapter-divider {",
  "            border: none !important;",
  "            border-top: none !important;",
  "            border-bottom: none !important;",
  "        }",
  "        .dark .chapter-divider {",
  "            border: none !important;",
  "            border-top: none !important;",
  "            border-bottom: none !important;",
  "        }",
  "",
  "        /* 4-Corner Chromatic Aura - Pattern A (Top: Wine/Gold | Bottom: Gold/Wine) */",
  "        .ambient-glow-a::before {",
  "            content: '';",
  "            position: absolute;",
  "            inset: 0;",
  "            pointer-events: none;",
  "            z-index: 0;",
  "            background: ",
  "                radial-gradient(ellipse 480px 380px at 0% 0%, rgba(142, 48, 56, 0.08) 0%, transparent 70%),",
  "                radial-gradient(ellipse 480px 380px at 100% 0%, rgba(212, 175, 55, 0.08) 0%, transparent 70%),",
  "                radial-gradient(ellipse 480px 380px at 0% 100%, rgba(212, 175, 55, 0.08) 0%, transparent 70%),",
  "                radial-gradient(ellipse 480px 380px at 100% 100%, rgba(142, 48, 56, 0.08) 0%, transparent 70%);",
  "            transition: opacity 0.4s ease;",
  "        }",
  "        .dark .ambient-glow-a::before {",
  "            background: ",
  "                radial-gradient(ellipse 540px 420px at 0% 0%, rgba(142, 48, 56, 0.17) 0%, transparent 72%),",
  "                radial-gradient(ellipse 540px 420px at 100% 0%, rgba(212, 175, 55, 0.14) 0%, transparent 72%),",
  "                radial-gradient(ellipse 540px 420px at 0% 100%, rgba(212, 175, 55, 0.14) 0%, transparent 72%),",
  "                radial-gradient(ellipse 540px 420px at 100% 100%, rgba(142, 48, 56, 0.17) 0%, transparent 72%);",
  "        }",
  "",
  "        /* 4-Corner Chromatic Aura - Pattern B (Top: Gold/Wine | Bottom: Wine/Gold) ",
  "           Seamlessly matches Pattern A's bottom corners */",
  "        .ambient-glow-b::before {",
  "            content: '';",
  "            position: absolute;",
  "            inset: 0;",
  "            pointer-events: none;",
  "            z-index: 0;",
  "            background: ",
  "                radial-gradient(ellipse 480px 380px at 0% 0%, rgba(212, 175, 55, 0.08) 0%, transparent 70%),",
  "                radial-gradient(ellipse 480px 380px at 100% 0%, rgba(142, 48, 56, 0.08) 0%, transparent 70%),",
  "                radial-gradient(ellipse 480px 380px at 0% 100%, rgba(142, 48, 56, 0.08) 0%, transparent 70%),",
  "                radial-gradient(ellipse 480px 380px at 100% 100%, rgba(212, 175, 55, 0.08) 0%, transparent 70%);",
  "            transition: opacity 0.4s ease;",
  "        }",
  "        .dark .ambient-glow-b::before {",
  "            background: ",
  "                radial-gradient(ellipse 540px 420px at 0% 0%, rgba(212, 175, 55, 0.14) 0%, transparent 72%),",
  "                radial-gradient(ellipse 540px 420px at 100% 0%, rgba(142, 48, 56, 0.17) 0%, transparent 72%),",
  "                radial-gradient(ellipse 540px 420px at 0% 100%, rgba(142, 48, 56, 0.17) 0%, transparent 72%),",
  "                radial-gradient(ellipse 540px 420px at 100% 100%, rgba(212, 175, 55, 0.14) 0%, transparent 72%);",
  "        }",
  "",
  "        /* Publisher Marquee Track */",
  "        .publisher-marquee {",
  "            display: flex;",
  "            width: max-content;",
  "            animation: marquee 35s linear infinite;",
  "        }",
  "        .publisher-marquee:hover {",
  "            animation-play-state: paused;",
  "        }",
  "        @keyframes marquee {",
  "            0% { transform: translateX(0); }",
  "            100% { transform: translateX(-50%); }",
  "        }",
  "",
  "",
  "        /* Accessibility: Reduced Motion */",
  "        @media (prefers-reduced-motion: reduce) {",
  "            * {",
  "                animation-duration: 0.001s !important;",
  "                transition-duration: 0.001s !important;",
  "            }",
  "            .publisher-marquee {",
  "                animation: none !important;",
  "                flex-wrap: wrap;",
  "                justify-content: center;",
  "            }",
  "        }",
  "    "
].join("\n");


const PAGE_SCRIPT = [
  "",
  "        // Force scroll to top on reload immediately",
  "        if ('scrollRestoration' in history) {",
  "            history.scrollRestoration = 'manual';",
  "        }",
  "        window.scrollTo(0, 0);",
  "",
  "        // TODO(API): Populate these arrays from database GET responses before rendering shelves and search.",
  "        const libraryCatalog = {",
  "            trending: [],",
  "            children: [],",
  "            literature: [],",
  "            selfgrowth: [],",
  "            science: [],",
  "            business: [],",
  "            history: [],",
  "            philosophy: [],",
  "            artlifestyle: [],",
  "            biography: []",
  "        };",
  "",

  "        // Render helper for book cards",
  "        function renderBookCard(book) {",
  "            const bookId = book.id || book.book_id || '';",
  "            const bookTitle = book.title || book.bookName || 'Tác phẩm';",
  "            const bookCover = book.img || book.img_url || '/logo.png';",
  "            const bookAuthor = book.author || 'HALM BOOK';",
  "            const bookRating = book.rating || '5.0';",
  "            const bookPrice = book.price ? (Number(book.price).toLocaleString('vi-VN') + ' đ') : '';",
  "            return `",
  "                <div class=\"book-card-item w-40 sm:w-48 lg:w-[210px] xl:w-[220px] shrink-0 snap-start p-3 rounded-xl bg-paper dark:bg-night-card border border-paper-border dark:border-night-border group flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-300 shadow-sm\" data-book-id=\"${encodeURIComponent(bookId)}\" data-book-title=\"${encodeURIComponent(bookTitle)}\" data-book-author=\"${encodeURIComponent(bookAuthor)}\" data-book-rating=\"${encodeURIComponent(bookRating)}\" data-book-price=\"${encodeURIComponent(bookPrice)}\" data-book-description=\"${encodeURIComponent(book.desc || 'Chưa có mô tả cho tác phẩm này.')}\">",
  "                    <div class=\"relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-night-card shadow-md mb-3\">",
  "                        <img src=\"${bookCover}\" alt=\"${bookTitle}\" class=\"w-full h-full object-cover group-hover:scale-105 transition-transform duration-500\" loading=\"lazy\" onerror=\"this.onerror=null;this.src='/logo.png';\">",
  "                        <div class=\"font-metadata-spec absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] text-gold font-bold flex items-center gap-0.5\">",
  "                            <i class=\"ph-fill ph-star\"></i> ${bookRating}",
  "                        </div>",
  "                    </div>",
  "                    <div class=\"space-y-1\">",
  "                        <h4 class=\"font-display font-bold text-sm text-ink dark:text-night-text line-clamp-1 group-hover:text-wine dark:group-hover:text-gold transition-colors\" title=\"${bookTitle}\">",
  "                            ${bookTitle}",
  "                        </h4>",
  "                        <p class=\"font-metadata-spec text-xs text-ink-muted dark:text-night-muted line-clamp-1\">",
  "                            ${bookAuthor}",
  "                        </p>",
  "                        ${bookPrice ? `<p class=\"font-metadata-spec text-[11px] font-bold text-wine dark:text-gold pt-0.5\">${bookPrice}</p>` : ''}",
  "                    </div>",
  "                    <div class=\"pt-3 mt-3 border-t border-paper-border/70 dark:border-night-border/70 flex items-center justify-between\">",
  "                        <a href=\"/chitietsach/${bookId}\" class=\"font-metadata-spec text-xs font-bold text-wine dark:text-gold hover:underline\">",
  "                            Chi tiết",
  "                        </a>",
  "                        <a href=\"/chitietsach/${bookId}\" class=\"w-7 h-7 rounded-full bg-paper-200 dark:bg-night-border hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-ink flex items-center justify-center text-xs transition-colors\" title=\"Chi tiết sách\">",
  "                            <i class=\"ph-bold ph-book-open\"></i>",
  "                        </a>",
  "                    </div>",
  "                </div>",
  "            `;",
  "        }",
  "",
  "        function bindBookHoverPopups() {",
  "            let popup = document.getElementById('book-hover-popup');",
  "            if (!popup) {",
  "                popup = document.createElement('div');",
  "                popup.id = 'book-hover-popup';",
  "                popup.className = 'book-hover-popup';",
  "                popup.innerHTML = '<p class=\"book-hover-popup__title\"></p><p class=\"book-hover-popup__author\"></p><p class=\"book-hover-popup__meta\"></p><p class=\"book-hover-popup__description\"></p>';",
  "                document.body.appendChild(popup);",
  "            }",
  "            const title = popup.querySelector('.book-hover-popup__title');",
  "            const author = popup.querySelector('.book-hover-popup__author');",
  "            const meta = popup.querySelector('.book-hover-popup__meta');",
  "            const description = popup.querySelector('.book-hover-popup__description');",
  "            const hidePopup = () => popup.classList.remove('is-visible');",
  "            document.querySelectorAll('.book-card-item:not([data-hover-bound])').forEach((card) => {",
  "                card.dataset.hoverBound = 'true';",
  "                card.addEventListener('mouseenter', () => {",
  "                    title.textContent = decodeURIComponent(card.dataset.bookTitle || 'Tác phẩm');",
  "                    author.textContent = `Tác giả: ${decodeURIComponent(card.dataset.bookAuthor || 'HALM BOOK')}`;",
  "                    const rating = decodeURIComponent(card.dataset.bookRating || '5.0');",
  "                    const price = decodeURIComponent(card.dataset.bookPrice || '');",
  "                    meta.textContent = `Đánh giá: ${rating}${price ? ` • ${price}` : ''}`;",
  "                    description.textContent = decodeURIComponent(card.dataset.bookDescription || 'Chưa có mô tả cho tác phẩm này.');",
  "                    const rect = card.getBoundingClientRect();",
  "                    const popupWidth = 300;",
  "                    const gap = 14;",
  "                    const left = rect.right + popupWidth + gap <= window.innerWidth",
  "                        ? rect.right + gap",
  "                        : Math.max(12, rect.left - popupWidth - gap);",
  "                    const top = Math.max(12, Math.min(Math.max(12, rect.top), window.innerHeight - 190));",
  "                    popup.style.left = `${left}px`;",
  "                    popup.style.top = `${top}px`;",
  "                    popup.classList.add('is-visible');",
  "                });",
  "                card.addEventListener('mouseleave', hidePopup);",
  "            });",
  "        }",
  "",
  "        // Render discovery end-of-shelf card (revealed when reaching last book)",
  "        function renderDiscoveryCard(categoryName, topicKey, iconName = 'ph-arrow-right') {",
  "            return `",
  "                <div class=\"shelf-discovery-card w-40 sm:w-48 lg:w-[210px] xl:w-[220px] shrink-0 snap-start p-5 rounded-xl border border-dashed border-wine/40 dark:border-gold/40 bg-paper-surface/70 dark:bg-night-surface/70 hover:border-wine dark:hover:border-gold hover:bg-wine/5 dark:hover:bg-gold/5 group flex flex-col items-center justify-between text-center transition-all duration-300 shadow-sm cursor-pointer\" onclick=\"filterTopic('${topicKey}')\" role=\"button\" aria-label=\"Khám phá ${categoryName}\">",
  "                    <div class=\"w-full flex justify-end\">",
  "                        <span class=\"font-metadata-spec text-[9px] font-bold text-wine dark:text-gold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-wine/10 dark:bg-gold/15\">",
  "                            Hết Danh Mục",
  "                        </span>",
  "                    </div>",
  "                    <div class=\"my-auto py-2 flex flex-col items-center\">",
  "                        <div class=\"w-14 h-14 rounded-full bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-wine group-hover:text-white dark:group-hover:bg-gold dark:group-hover:text-night-bg transition-all duration-300 shadow-sm\">",
  "                            <i class=\"ph-bold ${iconName} text-2xl\"></i>",
  "                        </div>",
  "                        <h4 class=\"font-display font-black text-sm sm:text-base text-ink dark:text-night-text group-hover:text-wine dark:group-hover:text-gold transition-colors leading-snug mb-1.5 px-1\">",
  "                            ${categoryName}",
  "                        </h4>",
  "                        <p class=\"font-metadata-spec text-[11px] text-ink-muted dark:text-night-muted\">",
  "                            Xem trọn bộ tác phẩm",
  "                        </p>",
  "                    </div>",
  "                    <div class=\"pt-3 w-full border-t border-paper-border/70 dark:border-night-border/70 flex items-center justify-center gap-1.5 text-xs font-bold text-wine dark:text-gold font-metadata-spec\">",
  "                        <span>Khám phá ngay</span>",
  "                        <i class=\"ph-bold ph-arrow-right group-hover:translate-x-1 transition-transform\"></i>",
  "                    </div>",
  "                </div>",
  "            `;",
  "        }",
  "",
  "        // Horizontal shelf scroll",
  "        function scrollShelf(shelfId, offset) {",
  "            const el = document.getElementById(shelfId);",
  "            if (el) el.scrollBy({ left: offset, behavior: 'smooth' });",
  "        }",
  "",
  "        // Scroll precisely by 1 book card step",
  "        function scrollShelfByCard(shelfId, direction) {",
  "            const el = document.getElementById(shelfId);",
  "            if (!el) return;",
  "            const firstCard = el.querySelector('[data-book-id]') || el.firstElementChild;",
  "            const computedStyle = window.getComputedStyle(el);",
  "            const gap = parseFloat(computedStyle.gap) || 20;",
  "            const cardWidth = firstCard ? (firstCard.offsetWidth + gap) : 230;",
  "            el.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });",
  "        }",
  "",
  "        // Category filter scroll",
  "        function filterTopic(topicKey) {",
  "            const shelf = document.getElementById('topic-section') || document.getElementById('trending-section');",
  "            if (shelf) shelf.scrollIntoView({ behavior: 'smooth' });",
  "        }",
  "",
  "        // Live Search Handler",
  "        function handleSearch() {",
  "            const input = document.getElementById('header-search-input');",
  "            const query = input ? input.value.trim().toLowerCase() : '';",
  "            if (!query) return;",
  "",
  "            const allBooks = Array.from(new Map([",
  "                ...libraryCatalog.trending,",
  "                ...libraryCatalog.children,",
  "                ...libraryCatalog.literature,",
  "                ...libraryCatalog.selfgrowth,",
  "                ...(libraryCatalog.science || []),",
  "                ...(libraryCatalog.business || []),",
  "                ...(libraryCatalog.history || []),",
  "                ...(libraryCatalog.philosophy || []),",
  "                ...(libraryCatalog.artlifestyle || []),",
  "                ...(libraryCatalog.biography || [])",
  "            ].map(book => [book.id || `${book.title}-${book.author}`, book])).values());",
  "            const found = allBooks.find(b => b.title.toLowerCase().includes(query) || b.author.toLowerCase().includes(query));",
  "            if (found) {",
  "                window.location.href = `../book-detail.html?id=${found.id}`;",
  "            } else {",
  "                window.location.href = `#trending-section`;",
  "            }",
  "        }",
  "",
  "        function clearSearch() {",
  "            const input = document.getElementById('header-search-input');",
  "            const clearBtn = document.getElementById('clear-search-btn');",
  "            const dropdown = document.getElementById('search-dropdown');",
  "            if (input) input.value = '';",
  "            if (clearBtn) clearBtn.classList.add('hidden');",
  "            if (dropdown) dropdown.classList.add('hidden');",
  "        }",
  "",
  "        // DOM Initialization",
  "        (() => {",
  "            // Guarantee page always starts strictly at the top on reload",
  "            if (!window.location.hash) {",
  "                window.scrollTo(0, 0);",
  "            }",
  "",
  "            // 1. Render Catalog Shelves",
  "            const trendingContainer = document.getElementById('trending-shelf');",
  "            const trendingCatNav = document.getElementById('trending-cat-nav');",
  "            const trendingCatMatch = {",
  "                all: () => true,",
  "                'van-hoc': (book) => book.category_id === 1 || /văn học|tiểu thuyết|truyện|nhật ánh|hoa nở|chuyện tình/i.test((book.title || '') + ' ' + (book.author || '') + ' ' + (book.desc || '')),",
  "                'thieu-nhi': (book) => book.category_id === 2 || /thiếu nhi|tuổi thơ|dế mèn|hoàng tử|alice|cổ tích|tô hoài/i.test((book.title || '') + ' ' + (book.author || '')),",
  "                'ky-nang': (book) => book.category_id === 3 || /kỹ năng|phát triển|sống|thói quen|đắc nhân|carnegie|tư duy/i.test((book.title || '') + ' ' + (book.author || '')),",
  "                'kinh-dien': (book) => book.category_id === 1 || /kinh điển|hoàng tử|đắc nhân|epictetus|exupéry/i.test((book.title || '') + ' ' + (book.author || ''))",
  "            };",
  "            let isTrendingInitialRender = true;",
  "            function renderTrendingShelf(catKey) {",
  "                const targetShelf = document.getElementById('trending-shelf');",
  "                if (!targetShelf) return;",
  "                const list = (libraryCatalog.trending || []).filter(trendingCatMatch[catKey] || trendingCatMatch.all);",
  "                const books = list.length ? list : (libraryCatalog.trending || []);",
  "                targetShelf.innerHTML = books.map(renderBookCard).join('') + (books.length ? renderDiscoveryCard('Toàn Bộ Sách Thịnh Hành', 'all', 'ph-fire') : '');",
  "                bindBookHoverPopups();",
  "                if (!isTrendingInitialRender && typeof gsap !== 'undefined') {",
  "                    const cards = Array.from(targetShelf.children).slice(0, 6);",
  "                    gsap.fromTo(cards,",
  "                        { y: 24, opacity: 0, scale: 0.95 },",
  "                        { y: 0, opacity: 1, scale: 1, stagger: 0.05, duration: 0.42, ease: 'power2.out', clearProps: 'transform' }",
  "                    );",
  "                }",
  "            }",
  "            window.renderTrendingShelf = renderTrendingShelf;",
  "            renderTrendingShelf('all');",
  "            isTrendingInitialRender = false;",
  "            if (trendingCatNav) {",
  "                trendingCatNav.querySelectorAll('.trending-cat-btn').forEach((btn) => {",
  "                    btn.addEventListener('click', () => {",
  "                        trendingCatNav.querySelectorAll('.trending-cat-btn').forEach((el) => el.classList.remove('is-active'));",
  "                        btn.classList.add('is-active');",
  "                        renderTrendingShelf(btn.getAttribute('data-cat') || 'all');",
  "                    });",
  "                });",
  "            }",
  "            function renderAllShelves() {",
  "                if (typeof window.renderTrendingShelf === 'function') {",
  "                    window.renderTrendingShelf('all');",
  "                }",
  "                const childrenContainer = document.getElementById('children-shelf');",
  "                if (childrenContainer && libraryCatalog.children && libraryCatalog.children.length) {",
  "                    childrenContainer.innerHTML = libraryCatalog.children.map(renderBookCard).join('') + renderDiscoveryCard('Kho Sách Thiếu Nhi', 'thieu-nhi', 'ph-balloon');",
  "                }",
  "                const literatureContainer = document.getElementById('literature-shelf');",
  "                if (literatureContainer && libraryCatalog.literature && libraryCatalog.literature.length) {",
  "                    literatureContainer.innerHTML = libraryCatalog.literature.map(renderBookCard).join('') + renderDiscoveryCard('Kho Văn Học & Tiểu Thuyết', 'van-hoc', 'ph-feather');",
  "                }",
  "                const selfgrowthShelf = document.getElementById('selfgrowth-shelf') || document.getElementById('selfgrowth-grid');",
  "                if (selfgrowthShelf && libraryCatalog.selfgrowth && libraryCatalog.selfgrowth.length) {",
  "                    selfgrowthShelf.innerHTML = libraryCatalog.selfgrowth.map(renderBookCard).join('') + renderDiscoveryCard('Kho Sách Kỹ Năng', 'phat-trien', 'ph-brain');",
  "                }",
  "                const shelfList = [",
  "                    { id: 'science-shelf', books: libraryCatalog.science, name: 'Khoa Học & Vũ Trụ', key: 'khoa-hoc', icon: 'ph-planet' },",
  "                    { id: 'business-shelf', books: libraryCatalog.business, name: 'Kinh Tế & Khởi Nghiệp', key: 'kinh-doanh', icon: 'ph-briefcase' },",
  "                    { id: 'history-shelf', books: libraryCatalog.history, name: 'Lịch Sử & Văn Hóa', key: 'lich-su', icon: 'ph-hourglass-high' },",
  "                    { id: 'philosophy-shelf', books: libraryCatalog.philosophy, name: 'Tâm Lý & Triết Học', key: 'van-hoc', icon: 'ph-compass' },",
  "                    { id: 'artlifestyle-shelf', books: libraryCatalog.artlifestyle, name: 'Nghệ Thuật & Lối Sống', key: 'van-hoc', icon: 'ph-palette' },",
  "                    { id: 'biography-shelf', books: libraryCatalog.biography, name: 'Hồi Ký & Danh Nhân', key: 'van-hoc', icon: 'ph-user-focus' }",
  "                ];",
  "                shelfList.forEach(item => {",
  "                    const el = document.getElementById(item.id);",
  "                    if (el && item.books && item.books.length) {",
  "                        el.innerHTML = item.books.map(renderBookCard).join('') + renderDiscoveryCard(item.name, item.key, item.icon);",
  "                    }",
  "                });",
  "                bindBookHoverPopups();",
  "            }",
  "            window.renderAllShelves = renderAllShelves;",
  "            function categorizeAndPopulateShelves(booksList) {",
  "                if (!Array.isArray(booksList) || !booksList.length) return;",
  "                libraryCatalog.trending = [...booksList];",
  "                libraryCatalog.children = [];",
  "                libraryCatalog.literature = [];",
  "                libraryCatalog.selfgrowth = [];",
  "                libraryCatalog.science = [];",
  "                libraryCatalog.business = [];",
  "                libraryCatalog.history = [];",
  "                libraryCatalog.philosophy = [];",
  "                libraryCatalog.artlifestyle = [];",
  "                libraryCatalog.biography = [];",
  "                const matchKw = (b, regex) => {",
  "                    const str = ((b.title || '') + ' ' + (b.author || '') + ' ' + (b.desc || '')).toLowerCase();",
  "                    return regex.test(str);",
  "                };",
  "                booksList.forEach((book, idx) => {",
  "                    let assigned = false;",
  "                    const cId = book.category_id;",
  "                    if (cId === 1 || matchKw(book, /văn học|tiểu thuyết|truyện|nhật ánh|hoa nở|chuyện tình/i)) {",
  "                        libraryCatalog.literature.push(book); assigned = true;",
  "                    }",
  "                    if (cId === 2 || matchKw(book, /thiếu nhi|tuổi thơ|dế mèn|hoàng tử|alice|cổ tích|tô hoài/i)) {",
  "                        libraryCatalog.children.push(book); assigned = true;",
  "                    }",
  "                    if (cId === 3 || matchKw(book, /kỹ năng|phát triển|sống|thói quen|đắc nhân|carnegie|tư duy/i)) {",
  "                        libraryCatalog.selfgrowth.push(book); assigned = true;",
  "                    }",
  "                    if (cId === 4 || matchKw(book, /khoa học|vũ trụ|thiên văn|vật lý|công nghệ|toán/i)) {",
  "                        libraryCatalog.science.push(book); assigned = true;",
  "                    }",
  "                    if (cId === 5 || matchKw(book, /kinh tế|kinh doanh|khởi nghiệp|tài chính|đầu tư|graham|tiền/i)) {",
  "                        libraryCatalog.business.push(book); assigned = true;",
  "                    }",
  "                    if (cId === 6 || matchKw(book, /lịch sử|văn hóa|sử việt|chiến tranh|thế giới/i)) {",
  "                        libraryCatalog.history.push(book); assigned = true;",
  "                    }",
  "                    if (cId === 7 || matchKw(book, /triết học|tâm lý|nhận thức|ý thức|epictetus/i)) {",
  "                        libraryCatalog.philosophy.push(book); assigned = true;",
  "                    }",
  "                    if (cId === 8 || matchKw(book, /nghệ thuật|lối sống|hội họa|âm nhạc|nhiếp ảnh|thẩm mỹ/i)) {",
  "                        libraryCatalog.artlifestyle.push(book); assigned = true;",
  "                    }",
  "                    if (cId === 9 || matchKw(book, /tiểu sử|hồi ký|danh nhân|tự truyện/i)) {",
  "                        libraryCatalog.biography.push(book); assigned = true;",
  "                    }",
  "                    if (!assigned) {",
  "                        const targetKeys = ['literature', 'children', 'selfgrowth', 'science', 'business', 'history', 'philosophy', 'artlifestyle', 'biography'];",
  "                        libraryCatalog[targetKeys[idx % targetKeys.length]].push(book);",
  "                    }",
  "                });",
  "                const shelfKeys = ['children', 'literature', 'selfgrowth', 'science', 'business', 'history', 'philosophy', 'artlifestyle', 'biography'];",
  "                shelfKeys.forEach((key, i) => {",
  "                    if (libraryCatalog[key].length === 0 && booksList.length > 0) {",
  "                        libraryCatalog[key] = [booksList[i % booksList.length]];",
  "                    }",
  "                });",
  "                renderAllShelves();",
  "            }",
  "            window.populateShelvesWithBooks = categorizeAndPopulateShelves;",
  "            window.addEventListener('halm-books-loaded', function(e) {",
  "                categorizeAndPopulateShelves(e.detail);",
  "            });",
  "            if (window.__HALM_BOOKS__ && window.__HALM_BOOKS__.length) {",
  "                categorizeAndPopulateShelves(window.__HALM_BOOKS__);",
  "            }",
  "            renderAllShelves();",
  "",
  "            // 2. Starry Sky for Dark Mode",
  "            const starryBg = document.getElementById('starry-background');",
  "            function initStars() {",
  "                if (!starryBg) return;",
  "                starryBg.innerHTML = '';",
  "                const count = window.innerWidth > 768 ? 140 : 60;",
  "                for (let i = 0; i < count; i++) {",
  "                    const star = document.createElement('div');",
  "                    star.className = 'star';",
  "                    star.style.left = Math.floor(Math.random() * window.innerWidth) + 'px';",
  "                    star.style.top = Math.floor(Math.random() * window.innerHeight) + 'px';",
  "                    const size = Math.random() * 1.5 + 0.8;",
  "                    star.style.width = size + 'px';",
  "                    star.style.height = size + 'px';",
  "                    const duration = Math.random() * 3.5 + 2.5;",
  "                    const delay = Math.random() * 4;",
  "                    star.style.animation = `starTwinkle ${duration}s ease-in-out ${delay}s infinite`;",
  "                    starryBg.appendChild(star);",
  "                }",
  "            }",
  "            window.initStars = initStars;",
  "            setTimeout(initStars, 150);",
  "            window.addEventListener('resize', () => {",
  "                if (document.documentElement.classList.contains('dark')) initStars();",
  "            });",
  "            window.addEventListener('halm-theme-change', (e) => {",
  "                if (e.detail?.isDark) initStars();",
  "            });",
  "",
  "            // 3. Smart Header Scroll Behavior (Hide on scroll down, show on scroll up)",
  "            const navbar = document.getElementById('navbar');",
  "            let lastNavbarScrollY = window.scrollY;",
  "            const scrollDeltaThreshold = 8; // Threshold to prevent jitter on micro-scrolls",
  "",
  "            window.addEventListener('scroll', () => {",
  "                if (!navbar) return;",
  "                const currentScrollY = window.scrollY;",
  "",
  "                // Dynamic subtle padding adjustment",
  "                if (currentScrollY > 25) {",
  "                    navbar.classList.add('py-2.5');",
  "                    navbar.classList.remove('py-3.5');",
  "                } else {",
  "                    navbar.classList.remove('py-2.5');",
  "                    navbar.classList.add('py-3.5');",
  "                }",
  "",
  "                // If any dropdown menu is open, do not hide navbar",
  "                const isAvatarOpen = !document.getElementById('avatar-dropdown-menu')?.classList.contains('hidden');",
  "                const isMobileOpen = !document.getElementById('mobile-drawer')?.classList.contains('hidden');",
  "                if (isAvatarOpen || isMobileOpen) {",
  "                    navbar.classList.remove('nav-hidden');",
  "                    lastNavbarScrollY = currentScrollY;",
  "                    return;",
  "                }",
  "",
  "                // Near top of page (< 70px) -> always reveal navbar",
  "                if (currentScrollY <= 70) {",
  "                    navbar.classList.remove('nav-hidden');",
  "                    lastNavbarScrollY = currentScrollY;",
  "                    return;",
  "                }",
  "",
  "                // Scrolling Down -> Hide Header",
  "                if (currentScrollY > lastNavbarScrollY + scrollDeltaThreshold) {",
  "                    navbar.classList.add('nav-hidden');",
  "                }",
  "                // Scrolling Up -> Show Header",
  "                else if (currentScrollY < lastNavbarScrollY - scrollDeltaThreshold) {",
  "                    navbar.classList.remove('nav-hidden');",
  "                }",
  "",
  "                lastNavbarScrollY = Math.max(0, currentScrollY);",
  "            }, { passive: true });",
  "",
  "            // Dark mode is managed by UserLayout so React remains the single source of truth.",
  "",
  "            // Category navigation button scroll",
  "            const catNavBtn = document.getElementById('category-nav-btn');",
  "            if (catNavBtn) {",
  "                catNavBtn.addEventListener('click', () => {",
  "                    const trendSec = document.getElementById('trending-section');",
  "                    if (trendSec) trendSec.scrollIntoView({ behavior: 'smooth' });",
  "                });",
  "            }",
  "",
  "            // Mobile search helper",
  "            window.handleMobileSearch = function() {",
  "                const mobileInput = document.getElementById('mobile-search-input');",
  "                const headerInput = document.getElementById('header-search-input');",
  "                if (mobileInput && headerInput) {",
  "                    headerInput.value = mobileInput.value;",
  "                    handleSearch();",
  "                }",
  "            };",
  "",
  "            // Avatar Menu Dropdown Controller",
  "            window.toggleAvatarMenu = function(e) {",
  "                if (e) e.stopPropagation();",
  "                const menu = document.getElementById('avatar-dropdown-menu');",
  "                const caret = document.getElementById('avatar-caret-icon');",
  "                if (!menu) return;",
  "                const isHidden = menu.classList.contains('hidden');",
  "                if (isHidden) {",
  "                    menu.classList.remove('hidden');",
  "                    if (caret) caret.style.transform = 'rotate(180deg)';",
  "                } else {",
  "                    menu.classList.add('hidden');",
  "                    if (caret) caret.style.transform = '';",
  "                }",
  "            };",
  "",
  "            window.closeAvatarMenu = function() {",
  "                const menu = document.getElementById('avatar-dropdown-menu');",
  "                const caret = document.getElementById('avatar-caret-icon');",
  "                if (menu) menu.classList.add('hidden');",
  "                if (caret) caret.style.transform = '';",
  "            };",
  "",
  "            // Search Box Expand/Collapse Controller",
  "            window.toggleSearchBox = function(e) {",
  "                if (e) e.stopPropagation();",
  "                const box = document.getElementById('search-expand-box');",
  "                const input = document.getElementById('header-search-input');",
  "                if (!box) return;",
  "                const isHidden = box.classList.contains('hidden');",
  "                if (isHidden) {",
  "                    box.classList.remove('hidden');",
  "                    if (input) {",
  "                        setTimeout(() => input.focus(), 60);",
  "                    }",
  "                } else {",
  "                    box.classList.add('hidden');",
  "                }",
  "            };",
  "",
  "            window.closeSearchBox = function() {",
  "                const box = document.getElementById('search-expand-box');",
  "                if (box) box.classList.add('hidden');",
  "            };",
  "",
  "            document.addEventListener('click', (e) => {",
  "                const wrapper = document.getElementById('avatar-menu-wrapper');",
  "                if (wrapper && !wrapper.contains(e.target)) {",
  "                    closeAvatarMenu();",
  "                }",
  "                const searchContainer = document.getElementById('search-container');",
  "                if (searchContainer && !searchContainer.contains(e.target)) {",
  "                    closeSearchBox();",
  "                }",
  "            });",
  "",
  "            document.addEventListener('keydown', (e) => {",
  "                if (e.key === 'Escape') {",
  "                    closeAvatarMenu();",
  "                    closeSearchBox();",
  "                }",
  "            });",
  "",
  "            // ========================================================",
  "            // HALMBOOK EDITORIAL — HOẠT CẢNH MÁY BAY KÉO CỜ TRÊN HEADER",
  "            // ========================================================",
  "            // ========================================================",
  "            // HALMBOOK EDITORIAL — HOẠT CẢNH MÁY BAY KÉO CỜ TRÊN HEADER",
  "            // ========================================================",
  "            // HALMBOOK CINEMATIC TWO-LAYER CLOTH FLAG SIMULATION",
  "            // Hệ thống mô phỏng sóng vải điện ảnh 2 lớp (Three.js WebGL Mesh)",
  "            // ========================================================",
  "",
  "            // 1. Shaders mô phỏng sóng vải điều hòa đa tần số & ánh sáng lụa điện ảnh",
  "            const flagVertexShader = `",
  "                uniform float uTime;",
  "                uniform float uSpeed;",
  "                uniform float uWaveAmp;",
  "                uniform float uWaveFreq;",
  "                uniform float uIsSmallFlag;",
  "",
  "                varying vec2 vUv;",
  "                varying vec3 vNormal;",
  "                varying vec3 vPosition;",
  "                varying float vWaveDepth;",
  "",
  "                void main() {",
  "                    vUv = uv;",
  "                    // s: 0 tại điểm neo cố định (hoist), 1 tại mép tự do bay trong gió (fly)",
  "                    float s = (uIsSmallFlag > 0.5) ? (1.0 - uv.x) : uv.x;",
  "                    // Biên độ tăng dần phi tuyến tính từ điểm neo",
  "                    float ampFactor = pow(clamp(s, 0.0, 1.0), 1.35) * uWaveAmp;",
  "                    float t = uTime * uSpeed;",
  "                    ",
  "                    // Sóng lan truyền đa tần số (Harmonic multi-frequency traveling waves)",
  "                    float wave1 = sin(s * uWaveFreq * 6.28318 - t * 4.2 + uv.y * 1.5);",
  "                    float wave2 = sin(s * uWaveFreq * 11.5 - t * 6.8 - uv.y * 2.2 + 1.25) * 0.45;",
  "                    float wave3 = sin(s * uWaveFreq * 18.0 - t * 9.5 + uv.y * 3.1 + 2.5) * 0.22;",
  "                    float flutter = sin(s * 28.0 - t * 14.0) * pow(clamp(s, 0.0, 1.0), 2.5) * 0.15;",
  "                    ",
  "                    float totalWave = (wave1 + wave2 + wave3 + flutter) * ampFactor;",
  "                    ",
  "                    vec3 displacedPos = position;",
  "                    displacedPos.z += totalWave;",
  "                    // Co vải theo trục X khi lượn sóng (bảo toàn độ dài bề mặt)",
  "                    displacedPos.x -= (uIsSmallFlag > 0.5 ? -1.0 : 1.0) * pow(clamp(s, 0.0, 1.0), 1.8) * abs(totalWave) * 0.12;",
  "                    // Nhấp nhô nhẹ trục Y ở mép tự do",
  "                    displacedPos.y += sin(s * 7.0 - t * 3.5) * ampFactor * 0.15 * (uv.y - 0.5);",
  "                    ",
  "                    vWaveDepth = totalWave;",
  "                    vPosition = (modelMatrix * vec4(displacedPos, 1.0)).xyz;",
  "                    ",
  "                    // Vector pháp tuyến giải tích (Analytical Normals) cho ánh sáng chân thực",
  "                    float dZds = (",
  "                        cos(s * uWaveFreq * 6.28318 - t * 4.2 + uv.y * 1.5) * uWaveFreq * 6.28318 +",
  "                        cos(s * uWaveFreq * 11.5 - t * 6.8 - uv.y * 2.2 + 1.25) * uWaveFreq * 11.5 * 0.45 +",
  "                        cos(s * uWaveFreq * 18.0 - t * 9.5 + uv.y * 3.1 + 2.5) * uWaveFreq * 18.0 * 0.22",
  "                    ) * ampFactor;",
  "                    ",
  "                    float dZdy = (",
  "                        cos(s * uWaveFreq * 6.28318 - t * 4.2 + uv.y * 1.5) * 1.5 -",
  "                        cos(s * uWaveFreq * 11.5 - t * 6.8 - uv.y * 2.2 + 1.25) * 2.2 * 0.45 +",
  "                        cos(s * uWaveFreq * 18.0 - t * 9.5 + uv.y * 3.1 + 2.5) * 3.1 * 0.22",
  "                    ) * ampFactor;",
  "                    ",
  "                    vec3 tangentX = vec3(1.0, 0.0, (uIsSmallFlag > 0.5 ? -1.0 : 1.0) * dZds);",
  "                    vec3 tangentY = vec3(0.0, 1.0, dZdy);",
  "                    vec3 computedNormal = normalize(cross(tangentX, tangentY));",
  "                    ",
  "                    vNormal = normalize(normalMatrix * computedNormal);",
  "                    gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPos, 1.0);",
  "                }",
  "            `;",
  "",
  "            const flagFragmentShader = `",
  "                uniform sampler2D uTexture;",
  "                uniform float uOpacity;",
  "                uniform vec3 uLightDir;",
  "                uniform vec3 uLightColor;",
  "                uniform vec3 uAmbientColor;",
  "                uniform float uIsSmallFlag;",
  "",
  "                varying vec2 vUv;",
  "                varying vec3 vNormal;",
  "                varying vec3 vPosition;",
  "                varying float vWaveDepth;",
  "",
  "                void main() {",
  "                    vec4 texColor = texture2D(uTexture, vUv);",
  "                    vec3 N = normalize(vNormal);",
  "                    if (!gl_FrontFacing) N = -N;",
  "                    ",
  "                    vec3 L = normalize(uLightDir);",
  "                    vec3 V = normalize(-vPosition);",
  "                    vec3 H = normalize(L + V);",
  "                    ",
  "                    // Chiếu sáng khuếch tán Lambert bọc mềm (Half-Lambert wrap lighting)",
  "                    float diff = max(dot(N, L), 0.0);",
  "                    float wrapDiff = pow(diff * 0.65 + 0.35, 1.4);",
  "                    // Ánh lụa óng Blinn-Phong (Silk sheen specular)",
  "                    float spec = pow(max(dot(N, H), 0.0), 18.0) * 0.38;",
  "                    // Chiều sâu bóng đổ nếp gấp (Fold ambient shadow)",
  "                    float foldShadow = clamp(0.72 + 0.28 * sin(vWaveDepth * 2.5), 0.45, 1.0);",
  "                    ",
  "                    vec3 ambient = uAmbientColor * texColor.rgb;",
  "                    vec3 diffuse = uLightColor * texColor.rgb * wrapDiff * foldShadow;",
  "                    vec3 specular = vec3(1.0, 0.95, 0.85) * spec;",
  "                    ",
  "                    vec3 finalRgb = ambient + diffuse + specular;",
  "                    if (uIsSmallFlag < 0.5) {",
  "                        float luminance = dot(finalRgb, vec3(0.299, 0.587, 0.114));",
  "                        finalRgb = mix(finalRgb, vec3(luminance), 0.08);",
  "                    }",
  "                    ",
  "                    gl_FragColor = vec4(finalRgb, texColor.a * uOpacity);",
  "                }",
  "            `;",
  "",
  "            // 2. Tạo Texture Quốc kỳ Việt Nam sắc nét tỷ lệ 2:3 từ HTML5 Canvas",
  "            function createVietnamFlagCanvasTexture(width, height, isRightHoist) {",
  "                const canvas = document.createElement('canvas');",
  "                canvas.width = width;",
  "                canvas.height = height;",
  "                const ctx = canvas.getContext('2d');",
  "                if (!ctx) return null;",
  "",
  "                // Nền đỏ chuẩn cờ Tổ quốc Việt Nam (#DA251D)",
  "                ctx.fillStyle = '#DA251D';",
  "                ctx.fillRect(0, 0, width, height);",
  "",
  "                let flagWidth = width;",
  "                let starCenterX = width / 2;",
  "                const starCenterY = height / 2;",
  "",
  "                if (isRightHoist) {",
  "                    const sleeveW = Math.round(width * 0.038);",
  "                    flagWidth = width - sleeveW;",
  "                    starCenterX = flagWidth / 2;",
  "",
  "                    // Nẹp viền trắng ngà ở mép phải (nơi nối cáp tời trực thăng)",
  "                    ctx.fillStyle = '#F4F1EA';",
  "                    ctx.fillRect(flagWidth, 0, sleeveW, height);",
  "",
  "                    // Mắt khuy xỏ cáp",
  "                    ctx.fillStyle = '#8B4A3C';",
  "                    ctx.beginPath();",
  "                    ctx.arc(flagWidth + sleeveW / 2, height * 0.16, sleeveW * 0.28, 0, Math.PI * 2);",
  "                    ctx.arc(flagWidth + sleeveW / 2, height * 0.84, sleeveW * 0.28, 0, Math.PI * 2);",
  "                    ctx.fill();",
  "                }",
  "",
  "                // Ngôi sao vàng năm cánh chuẩn tọa độ hình học",
  "                const R = height * 0.32;",
  "                const r = R * Math.sin(18 * Math.PI / 180) / Math.sin(54 * Math.PI / 180);",
  "",
  "                ctx.save();",
  "                ctx.translate(starCenterX, starCenterY);",
  "                ctx.fillStyle = '#FFFF00';",
  "                ctx.beginPath();",
  "                for (let i = 0; i < 5; i++) {",
  "                    const outerAngle = (-90 + i * 72) * Math.PI / 180;",
  "                    const ox = R * Math.cos(outerAngle);",
  "                    const oy = R * Math.sin(outerAngle);",
  "                    if (i === 0) ctx.moveTo(ox, oy);",
  "                    else ctx.lineTo(ox, oy);",
  "",
  "                    const innerAngle = (-54 + i * 72) * Math.PI / 180;",
  "                    const ix = r * Math.cos(innerAngle);",
  "                    const iy = r * Math.sin(innerAngle);",
  "                    ctx.lineTo(ix, iy);",
  "                }",
  "                ctx.closePath();",
  "                ctx.fill();",
  "                ctx.restore();",
  "",
  "                return canvas;",
  "            }",
  "",
  "            // 3. Quản lý trạng thái hoạt cảnh",
  "            const airplaneAnimationState = {",
  "                isRunning: false,",
  "                speedMultiplier: 1.0,",
  "                lastTime: 0,",
  "                elapsedTime: 0,",
  "                flagClothTime: 0,",
  "                animFrameId: null,",
  "                durationPhase1: 5.8,  // Trực thăng 1 bay tiếp cận, đẩy Header bằng luồng gió cánh quạt",
  "                durationPause: 1.6,   // Chờ 1.6s (trong khoảng 1–2s) khi Header đang ở ngoài màn hình",
  "                durationPhase2: 4.8,  // Trực thăng 2 xuất hiện từ bên phải kéo Header trở về chậm rãi, đầm chắc",
  "                canvasCtx: null,",
  "                smokeParticles: [],",
  "                smallFlagObj: null",
  "            };",
  "",
  "            // Khởi tạo mô phỏng vải WebGL Cờ Nhỏ (trên trực thăng)",
  "            function initSmallFlagCloth(canvasEl, flagW, flagH) {",
  "                if (!window.THREE) return null;",
  "                try {",
  "                    const canvasTex = createVietnamFlagCanvasTexture(512, 341, true);",
  "                    const texture = new THREE.CanvasTexture(canvasTex);",
  "                    texture.wrapS = THREE.ClampToEdgeWrapping;",
  "                    texture.wrapT = THREE.ClampToEdgeWrapping;",
  "",
  "                    const geometry = new THREE.PlaneGeometry(flagW, flagH, 36, 22);",
  "                    const uniforms = {",
  "                        uTime: { value: 0.0 },",
  "                        uSpeed: { value: 1.0 },",
  "                        uWaveAmp: { value: 9.5 },",
  "                        uWaveFreq: { value: 1.5 },",
  "                        uIsSmallFlag: { value: 1.0 },",
  "                        uTexture: { value: texture },",
  "                        uOpacity: { value: 1.0 },",
  "                        uLightDir: { value: new THREE.Vector3(0.6, 0.8, 1.0).normalize() },",
  "                        uLightColor: { value: new THREE.Color(1.0, 0.95, 0.88) },",
  "                        uAmbientColor: { value: new THREE.Color(0.42, 0.38, 0.35) }",
  "                    };",
  "",
  "                    const material = new THREE.ShaderMaterial({",
  "                        uniforms: uniforms,",
  "                        vertexShader: flagVertexShader,",
  "                        fragmentShader: flagFragmentShader,",
  "                        transparent: true,",
  "                        side: THREE.DoubleSide",
  "                    });",
  "",
  "                    const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, alpha: true, antialias: true });",
  "                    renderer.setSize(flagW, flagH, false);",
  "                    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));",
  "                    renderer.setClearColor(0x000000, 0);",
  "",
  "                    const camera = new THREE.OrthographicCamera(-flagW / 2, flagW / 2, flagH / 2, -flagH / 2, 0.1, 500);",
  "                    camera.position.set(0, 0, 100);",
  "                    camera.lookAt(0, 0, 0);",
  "",
  "                    const scene = new THREE.Scene();",
  "                    const mesh = new THREE.Mesh(geometry, material);",
  "                    scene.add(mesh);",
  "",
  "                    return { renderer, scene, camera, mesh, uniforms, texture };",
  "                } catch (e) {",
  "                    console.warn('Small flag WebGL init fallback:', e);",
  "                    return null;",
  "                }",
  "            }",
  "",
  "            // Quản lý hệ thống hạt khói / vệt khí chân thực (Particle Smoke System)",
  "            function initSmokeCanvas() {",
  "                const canvas = document.getElementById('airplane-effects-canvas');",
  "                if (!canvas) return null;",
  "                canvas.width = window.innerWidth;",
  "                canvas.height = window.innerHeight;",
  "                airplaneAnimationState.smokeParticles = [];",
  "                const ctx = canvas.getContext('2d');",
  "                airplaneAnimationState.canvasCtx = ctx;",
  "                return ctx;",
  "            }",
  "",
  "            function emitSmokeParticle(x, y) {",
  "                if (airplaneAnimationState.smokeParticles.length > 70) return;",
  "                airplaneAnimationState.smokeParticles.push({",
  "                    x: x,",
  "                    y: y,",
  "                    vx: -0.5 + (Math.random() - 0.5) * 0.4,",
  "                    vy: (Math.random() - 0.5) * 0.5,",
  "                    radius: 5 + Math.random() * 3,",
  "                    maxRadius: 28 + Math.random() * 14,",
  "                    alpha: 0.55,",
  "                    life: 0,",
  "                    maxLife: 1.6 + Math.random() * 0.5",
  "                });",
  "            }",
  "",
  "            function updateAndDrawSmoke(dt) {",
  "                const ctx = airplaneAnimationState.canvasCtx;",
  "                if (!ctx) return;",
  "                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);",
  "",
  "                const particles = airplaneAnimationState.smokeParticles;",
  "                for (let i = particles.length - 1; i >= 0; i--) {",
  "                    const p = particles[i];",
  "                    p.life += dt;",
  "                    if (p.life >= p.maxLife) {",
  "                        particles.splice(i, 1);",
  "                        continue;",
  "                    }",
  "                    const progress = p.life / p.maxLife;",
  "                    p.x += p.vx;",
  "                    p.y += p.vy;",
  "                    const currentR = p.radius + (p.maxRadius - p.radius) * Math.sin(progress * Math.PI * 0.5);",
  "                    const currentAlpha = p.alpha * (1 - progress);",
  "",
  "                    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentR);",
  "                    grad.addColorStop(0, `rgba(255, 255, 255, ${currentAlpha * 0.9})`);",
  "                    grad.addColorStop(0.35, `rgba(248, 245, 238, ${currentAlpha * 0.55})`);",
  "                    grad.addColorStop(0.7, `rgba(235, 230, 220, ${currentAlpha * 0.22})`);",
  "                    grad.addColorStop(1, `rgba(225, 220, 210, 0)`);",
  "",
  "                    ctx.fillStyle = grad;",
  "                    ctx.beginPath();",
  "                    ctx.arc(p.x, p.y, currentR, 0, Math.PI * 2);",
  "                    ctx.fill();",
  "                }",
  "            }",
  "",
  "            // Tạo mô hình Trực thăng 1 (Chi tiết cabin, càng đáp skids, cần đuôi, cánh quạt chính & đuôi quay liên tục, mũi hướng sang PHẢI, kéo Cờ WebGL 3D)",
  "            function createPlane1WithFlagElement() {",
  "                const wrapper = document.createElement('div');",
  "                wrapper.id = 'airplane-entity-1';",
  "                wrapper.className = 'airplane-entity';",
  "",
  "                const isMobile = window.innerWidth < 640;",
  "                // Lá cờ dài ngang, chiều cao thấp hơn và chuẩn tỉ lệ 2:3 (108x72 desktop, 84x56 mobile - không bị cắt viền trên)",
  "                const flagW = isMobile ? 84 : 108;",
  "                const flagH = isMobile ? 56 : 72;",
  "                const cableW = isMobile ? 28 : 36;",
  "",
  "                wrapper.innerHTML = `",
  "                    <div style=\"display:flex;align-items:center;position:relative;\">",
  "                        <!-- 1. Lá cờ nhỏ Việt Nam (Mô phỏng vải WebGL 3D thực thụ, trải dài tự nhiên sau trực thăng) -->",
  "                        <div class=\"airplane-flag-canvas\" style=\"width:${flagW}px;height:${flagH}px;\">",
  "                            <canvas id=\"small-flag-webgl-canvas\" width=\"${flagW}\" height=\"${flagH}\" style=\"width:${flagW}px;height:${flagH}px;display:block;border-radius:2px;box-shadow:0 6px 20px rgba(0,0,0,0.3);\"></canvas>",
  "                        </div>",
  "",
  "                        <!-- 2. Dây cáp tời nối từ cọc cờ sang móc đuôi trực thăng phía trước -->",
  "                        <svg width=\"${cableW}\" height=\"28\" viewBox=\"0 0 36 28\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" style=\"margin-left:-2px;margin-right:-4px;\">",
  "                            <!-- Dây chữ V nối 2 mắt nẹp cọc cờ bên trái -->",
  "                            <path d=\"M 0,5 L 12,14 M 0,23 L 12,14\" stroke=\"#85817A\" stroke-width=\"1.6\"/>",
  "                            <!-- Dây cáp chịu lực thẳng nối vào móc đuôi trực thăng bên phải -->",
  "                            <line x1=\"12\" y1=\"14\" x2=\"36\" y2=\"14\" stroke=\"#85817A\" stroke-width=\"2\" stroke-dasharray=\"4,2\"/>",
  "                        </svg>",
  "",
  "                        <!-- 3. Trực thăng 1 (Hướng Mũi Sang PHẢI -> Dẫn đầu hành trình bay từ Trái qua Phải) -->",
  "                        <svg width=\"124\" height=\"52\" viewBox=\"0 0 124 52\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" style=\"overflow:visible;filter:drop-shadow(0 6px 14px rgba(0,0,0,0.26));\">",
  "                            <defs>",
  "                                <linearGradient id=\"heliBody1\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"0%\">",
  "                                    <stop offset=\"0%\" stop-color=\"#E2DBD0\"/>",
  "                                    <stop offset=\"50%\" stop-color=\"#F7F4EC\"/>",
  "                                    <stop offset=\"100%\" stop-color=\"#FFFFFF\"/>",
  "                                </linearGradient>",
  "                                <linearGradient id=\"cockpitGlass1\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">",
  "                                    <stop offset=\"0%\" stop-color=\"#8B4A3C\" stop-opacity=\"0.95\"/>",
  "                                    <stop offset=\"60%\" stop-color=\"#4A1E18\" stop-opacity=\"0.92\"/>",
  "                                    <stop offset=\"100%\" stop-color=\"#1F1D1A\" stop-opacity=\"0.95\"/>",
  "                                </linearGradient>",
  "                            </defs>",
  "                            ",
  "                            <!-- Càng hạ cánh (Landing Skids trực thăng) -->",
  "                            <line x1=\"44\" y1=\"38\" x2=\"50\" y2=\"47\" stroke=\"#4A4742\" stroke-width=\"2\"/>",
  "                            <line x1=\"74\" y1=\"38\" x2=\"80\" y2=\"47\" stroke=\"#4A4742\" stroke-width=\"2\"/>",
  "                            <path d=\"M 32,47 L 92,47 C 96,47 99,44 101,41\" stroke=\"#242321\" stroke-width=\"2.8\" stroke-linecap=\"round\"/>",
  "                            ",
  "                            <!-- Cần đuôi (Tail Boom) vươn về phía sau bên trái -->",
  "                            <path d=\"M 54,23 L 14,19 L 10,13 L 8,13 L 8,26 L 14,24 L 54,32 Z\" fill=\"#E2DBD0\" stroke=\"#8B4A3C\" stroke-width=\"1.2\"/>",
  "                            <path d=\"M 14,21 L 52,26\" stroke=\"#D4AF37\" stroke-width=\"2.2\"/>",
  "                            ",
  "                            <!-- Cánh đứng đuôi và cánh quạt đuôi quay liên tục (Tail fin & Tail rotor) -->",
  "                            <polygon points=\"12,13 6,2 2,2 8,24\" fill=\"#8B4A3C\"/>",
  "                            <g transform=\"translate(5, 5)\">",
  "                                <ellipse cx=\"0\" cy=\"0\" rx=\"1.5\" ry=\"9\" fill=\"rgba(212, 175, 55, 0.4)\" class=\"airplane-propeller\"/>",
  "                                <line x1=\"0\" y1=\"-9\" x2=\"0\" y2=\"9\" stroke=\"#D4AF37\" stroke-width=\"1.8\" class=\"airplane-propeller\"/>",
  "                                <circle cx=\"0\" cy=\"0\" r=\"1.8\" fill=\"#8B4A3C\"/>",
  "                            </g>",
  "",
  "                            <!-- Thân buồng lái trực thăng (Cabin / Fuselage hướng sang PHẢI) -->",
  "                            <path d=\"M 48,16 C 60,16 88,18 96,24 C 102,28 102,34 94,37 C 82,40 56,40 46,36 C 42,34 40,24 48,16 Z\" fill=\"url(#heliBody1)\" stroke=\"#8B4A3C\" stroke-width=\"1.4\"/>",
  "                            ",
  "                            <!-- Kính buồng lái trực thăng (Cockpit Glass hướng PHẢI) -->",
  "                            <path d=\"M 78,19 C 88,20 95,23 98,27 C 98,31 94,34 86,34 L 78,34 Z\" fill=\"url(#cockpitGlass1)\"/>",
  "                            <path d=\"M 80,21 C 87,22 92,25 94,28\" stroke=\"#FAF8F5\" stroke-width=\"1\" stroke-linecap=\"round\" opacity=\"0.75\"/>",
  "                            ",
  "                            <!-- Dải sọc nhận diện thương hiệu HALMBOOK hoàng kim & đỏ rượu -->",
  "                            <path d=\"M 46,28 C 62,29 76,29 88,32\" stroke=\"#D4AF37\" stroke-width=\"2\" stroke-linecap=\"round\"/>",
  "                            ",
  "                            <!-- Trục cánh quạt chính và Cánh quạt chính quay liên tục (Main Rotor Mast & Spinning Blades) -->",
  "                            <rect x=\"64\" y=\"8\" width=\"4\" height=\"8\" fill=\"#33312E\"/>",
  "                            <g transform=\"translate(66, 8)\">",
  "                                <ellipse cx=\"0\" cy=\"0\" rx=\"48\" ry=\"4\" fill=\"rgba(212, 175, 55, 0.28)\"/>",
  "                                <g class=\"airplane-propeller\">",
  "                                    <line x1=\"-48\" y1=\"0\" x2=\"48\" y2=\"0\" stroke=\"#D4AF37\" stroke-width=\"2.4\" stroke-linecap=\"round\"/>",
  "                                    <line x1=\"0\" y1=\"-3\" x2=\"0\" y2=\"3\" stroke=\"#FAF8F5\" stroke-width=\"2\" stroke-linecap=\"round\"/>",
  "                                </g>",
  "                                <circle cx=\"0\" cy=\"0\" r=\"3.2\" fill=\"#8B4A3C\" stroke=\"#D4AF37\" stroke-width=\"0.8\"/>",
  "                            </g>",
  "",
  "                            <!-- Móc tời kéo cờ phía sau trực thăng (bên Trái) -->",
  "                            <circle cx=\"10\" cy=\"24\" r=\"2.6\" fill=\"#D4AF37\" stroke=\"#8B4A3C\" stroke-width=\"1.2\"/>",
  "                        </svg>",
  "                    </div>",
  "                `;",
  "                return wrapper;",
  "            }",
  "",
  "            // Tạo mô hình Trực thăng 2 (Trực thăng cứu hộ / Kéo tời công suất cao hướng sang TRÁI)",
  "            function createPlane2TugElement() {",
  "                const wrapper = document.createElement('div');",
  "                wrapper.id = 'airplane-entity-2';",
  "                wrapper.className = 'airplane-entity';",
  "                wrapper.innerHTML = `",
  "                    <div style=\"display:flex;align-items:center;position:relative;\">",
  "                        <!-- Trực thăng cứu hộ 2 (Hướng mũi sang trái, tông obsidian & vàng kim) -->",
  "                        <svg width=\"124\" height=\"52\" viewBox=\"0 0 124 52\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" style=\"overflow:visible;filter:drop-shadow(0 6px 14px rgba(0,0,0,0.28));\">",
  "                            <defs>",
  "                                <linearGradient id=\"heliBody2\" x1=\"100%\" y1=\"0%\" x2=\"0%\" y2=\"0%\">",
  "                                    <stop offset=\"0%\" stop-color=\"#1F1D1A\"/>",
  "                                    <stop offset=\"50%\" stop-color=\"#3A3732\"/>",
  "                                    <stop offset=\"100%\" stop-color=\"#4F4A43\"/>",
  "                                </linearGradient>",
  "                                <linearGradient id=\"cockpitGlass2\" x1=\"100%\" y1=\"0%\" x2=\"0%\" y2=\"100%\">",
  "                                    <stop offset=\"0%\" stop-color=\"#8B4A3C\" stop-opacity=\"0.9\"/>",
  "                                    <stop offset=\"50%\" stop-color=\"#D4AF37\" stop-opacity=\"0.85\"/>",
  "                                    <stop offset=\"100%\" stop-color=\"#FAF8F5\" stop-opacity=\"0.95\"/>",
  "                                </linearGradient>",
  "                            </defs>",
  "                            ",
  "                            <!-- Càng hạ cánh (Landing Skids trực thăng cứu hộ) -->",
  "                            <line x1=\"80\" y1=\"38\" x2=\"74\" y2=\"47\" stroke=\"#4A4742\" stroke-width=\"2\"/>",
  "                            <line x1=\"50\" y1=\"38\" x2=\"44\" y2=\"47\" stroke=\"#4A4742\" stroke-width=\"2\"/>",
  "                            <path d=\"M 92,47 L 32,47 C 28,47 25,44 23,41\" stroke=\"#D4AF37\" stroke-width=\"2.8\" stroke-linecap=\"round\"/>",
  "                            ",
  "                            <!-- Cần đuôi (Tail Boom) vươn về bên phải -->",
  "                            <path d=\"M 70,23 L 110,19 L 114,13 L 116,13 L 116,26 L 110,24 L 70,32 Z\" fill=\"#2E2C28\" stroke=\"#D4AF37\" stroke-width=\"1.2\"/>",
  "                            <path d=\"M 110,21 L 72,26\" stroke=\"#D4AF37\" stroke-width=\"2.2\"/>",
  "                            ",
  "                            <!-- Cánh đứng đuôi và cánh quạt đuôi quay liên tục (Tail fin & Tail rotor hướng PHẢI) -->",
  "                            <polygon points=\"112,13 118,2 122,2 116,24\" fill=\"#8B4A3C\"/>",
  "                            <g transform=\"translate(119, 5)\">",
  "                                <ellipse cx=\"0\" cy=\"0\" rx=\"1.5\" ry=\"9\" fill=\"rgba(212, 175, 55, 0.4)\" class=\"airplane-propeller\"/>",
  "                                <line x1=\"0\" y1=\"-9\" x2=\"0\" y2=\"9\" stroke=\"#D4AF37\" stroke-width=\"1.8\" class=\"airplane-propeller\"/>",
  "                                <circle cx=\"0\" cy=\"0\" r=\"1.8\" fill=\"#D4AF37\"/>",
  "                            </g>",
  "",
  "                            <!-- Thân buồng lái trực thăng cứu hộ (Cabin / Fuselage hướng sang TRÁI) -->",
  "                            <path d=\"M 76,16 C 64,16 36,18 28,24 C 22,28 22,34 30,37 C 42,40 68,40 78,36 C 82,34 84,24 76,16 Z\" fill=\"url(#heliBody2)\" stroke=\"#D4AF37\" stroke-width=\"1.4\"/>",
  "                            ",
  "                            <!-- Kính buồng lái trực thăng cứu hộ (Cockpit Glass hướng TRÁI) -->",
  "                            <path d=\"M 46,19 C 36,20 29,23 26,27 C 26,31 30,34 38,34 L 46,34 Z\" fill=\"url(#cockpitGlass2)\"/>",
  "                            <path d=\"M 44,21 C 37,22 32,25 30,28\" stroke=\"#FFF\" stroke-width=\"1\" stroke-linecap=\"round\" opacity=\"0.8\"/>",
  "                            ",
  "                            <!-- Sọc nhận diện cứu hộ vàng kim nổi bật -->",
  "                            <path d=\"M 78,28 C 62,29 48,29 36,32\" stroke=\"#D4AF37\" stroke-width=\"2\" stroke-linecap=\"round\"/>",
  "                            ",
  "                            <!-- Trục cánh quạt chính và Cánh quạt chính (Main Rotor Mast & Spinning Blades) -->",
  "                            <rect x=\"56\" y=\"8\" width=\"4\" height=\"8\" fill=\"#D4AF37\"/>",
  "                            <g transform=\"translate(58, 8)\">",
  "                                <ellipse cx=\"0\" cy=\"0\" rx=\"48\" ry=\"4\" fill=\"rgba(212, 175, 55, 0.3)\"/>",
  "                                <g class=\"airplane-propeller\">",
  "                                    <line x1=\"-48\" y1=\"0\" x2=\"48\" y2=\"0\" stroke=\"#D4AF37\" stroke-width=\"2.4\" stroke-linecap=\"round\"/>",
  "                                    <line x1=\"0\" y1=\"-3\" x2=\"0\" y2=\"3\" stroke=\"#FAF8F5\" stroke-width=\"2\" stroke-linecap=\"round\"/>",
  "                                </g>",
  "                                <circle cx=\"0\" cy=\"0\" r=\"3.2\" fill=\"#8B4A3C\" stroke=\"#D4AF37\" stroke-width=\"0.8\"/>",
  "                            </g>",
  "",
  "                            <!-- Móc tời kéo Header chịu tải ở đuôi bên phải -->",
  "                            <circle cx=\"114\" cy=\"24\" r=\"2.6\" fill=\"#D4AF37\" stroke=\"#FFF\" stroke-width=\"1.2\"/>",
  "                        </svg>",
  "",
  "                        <!-- Dây cáp tời căng nối trực tiếp kéo Header -->",
  "                        <svg width=\"50\" height=\"14\" viewBox=\"0 0 50 14\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" style=\"margin-left:-2px;\">",
  "                            <line x1=\"0\" y1=\"7\" x2=\"50\" y2=\"7\" stroke=\"#D4AF37\" stroke-width=\"2.2\" stroke-dasharray=\"5,2\"/>",
  "                        </svg>",
  "                    </div>",
  "                `;",
  "                return wrapper;",
  "            }",
  "",
  "            // Click khoảng trống Header: Tăng tốc x5 hoàn toàn âm thầm (Không toast, không badge)",
  "            function handleHeaderSpeedupClick(e) {",
  "                if (!airplaneAnimationState.isRunning) return;",
  "                // Bỏ qua nếu bấm vào các control tương tác",
  "                const interactive = e.target.closest('button, a, input, form, select, textarea, [role=\"button\"], #search-dropdown, #avatar-dropdown-menu, #search-expand-box, .group\\\\/cat');",
  "                if (interactive) return;",
  "",
  "                // Tăng tốc x5 phần chuyển động còn lại một cách âm thầm",
  "                if (airplaneAnimationState.speedMultiplier < 5.0) {",
  "                    airplaneAnimationState.speedMultiplier = 5.0;",
  "                }",
  "            }",
  "",
  "            // Dọn dẹp và khôi phục an toàn",
  "            function resetAirplaneAnimation() {",
  "                if (airplaneAnimationState.animFrameId) {",
  "                    cancelAnimationFrame(airplaneAnimationState.animFrameId);",
  "                    airplaneAnimationState.animFrameId = null;",
  "                }",
  "",
  "                // Dọn dẹp Three.js Cờ Nhỏ",
  "                if (airplaneAnimationState.smallFlagObj) {",
  "                    const sObj = airplaneAnimationState.smallFlagObj;",
  "                    try {",
  "                        sObj.mesh.geometry.dispose();",
  "                        sObj.mesh.material.dispose();",
  "                        if (sObj.texture) sObj.texture.dispose();",
  "                        sObj.renderer.dispose();",
  "                    } catch (e) {}",
  "                    airplaneAnimationState.smallFlagObj = null;",
  "                }",
  "",
  "                const stage = document.getElementById('airplane-stage-layer');",
  "                if (stage) {",
  "                    const canvas = document.getElementById('airplane-effects-canvas');",
  "                    stage.innerHTML = '';",
  "                    if (canvas) {",
  "                        stage.appendChild(canvas);",
  "                        const ctx = canvas.getContext('2d');",
  "                        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);",
  "                    }",
  "                }",
  "",
  "                const headerWrapper = document.getElementById('header-content-wrapper');",
  "                if (headerWrapper) {",
  "                    headerWrapper.style.transform = '';",
  "                    headerWrapper.style.transition = '';",
  "                }",
  "",
  "                const navbar = document.getElementById('navbar');",
  "                if (navbar) {",
  "                    navbar.removeEventListener('click', handleHeaderSpeedupClick);",
  "                }",
  "",
  "                airplaneAnimationState.isRunning = false;",
  "                airplaneAnimationState.speedMultiplier = 1.0;",
  "                airplaneAnimationState.elapsedTime = 0;",
  "                airplaneAnimationState.flagClothTime = 0;",
  "                airplaneAnimationState.smokeParticles = [];",
  "            }",
  "",
  "            // Hàm kích hoạt chính",
  "            window.triggerAirplaneBannerAnimation = function(event) {",
  "                if (event) {",
  "                    event.preventDefault();",
  "                    event.stopPropagation();",
  "                }",
  "",
  "                // Chặn kích hoạt trùng khi đang chạy",
  "                if (airplaneAnimationState.isRunning) {",
  "                    return;",
  "                }",
  "",
  "                const stage = document.getElementById('airplane-stage-layer');",
  "                const headerWrapper = document.getElementById('header-content-wrapper');",
  "                const navbar = document.getElementById('navbar');",
  "                if (!stage || !headerWrapper || !navbar) return;",
  "",
  "                // Kiểm tra prefers-reduced-motion",
  "                const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;",
  "",
  "                // Chuẩn bị trạng thái ban đầu",
  "                resetAirplaneAnimation();",
  "                airplaneAnimationState.isRunning = true;",
  "                airplaneAnimationState.speedMultiplier = 1.0;",
  "                airplaneAnimationState.elapsedTime = 0;",
  "                airplaneAnimationState.flagClothTime = 0;",
  "                airplaneAnimationState.lastTime = performance.now();",
  "",
  "                // Khởi tạo Canvas khói",
  "                initSmokeCanvas();",
  "",
  "                // Lắng nghe click khoảng trống trên navbar để tăng tốc x5 âm thầm",
  "                navbar.addEventListener('click', handleHeaderSpeedupClick);",
  "",
  "                // Khởi tạo Trực thăng 1",
  "                const plane1 = createPlane1WithFlagElement();",
  "                stage.appendChild(plane1);",
  "                let plane2 = null;",
  "",
  "                const screenWidth = window.innerWidth;",
  "                const isMobile = screenWidth < 640;",
  "                const flagW = isMobile ? 84 : 108;",
  "                const flagH = isMobile ? 56 : 72;",
  "                const cableW = isMobile ? 28 : 36;",
  "                const planeW = 124;",
  "                const plane1TotalWidth = flagW + cableW + planeW; // ~268px",
  "",
  "                // Khởi tạo mô phỏng vải WebGL điện ảnh cho Cờ Nhỏ trên trực thăng",
  "                const smallFlagCanvas = plane1.querySelector('#small-flag-webgl-canvas');",
  "                if (smallFlagCanvas) {",
  "                    airplaneAnimationState.smallFlagObj = initSmallFlagCloth(smallFlagCanvas, flagW, flagH);",
  "                }",
  "",
  "                // Thông số khoảng cách & luồng gió:",
  "                // Mũi trực thăng luôn giữ khoảng đệm luồng gió 20px phía sau mép trái Header",
  "                const contactGap = 20;",
  "                const plane1StartX = -plane1TotalWidth - 60; // Xuất phát hoàn toàn ngoài màn hình bên trái",
  "                const totalShiftDistance = prefersReducedMotion ? 0 : (screenWidth + 120);",
  "",
  "                const d1 = airplaneAnimationState.durationPhase1; // 5.8s (tiếp cận và đẩy bằng luồng gió)",
  "                const dPause = airplaneAnimationState.durationPause; // 1.6s",
  "                const d2 = airplaneAnimationState.durationPhase2; // 4.8s (kéo chậm rãi hơn)",
  "                const totalDuration = d1 + dPause + d2; // 12.2s (hoặc 2.4s khi x5)",
  "",
  "                function tick(currentTime) {",
  "                    if (!airplaneAnimationState.isRunning) return;",
  "",
  "                    const rawDelta = (currentTime - airplaneAnimationState.lastTime) / 1000;",
  "                    airplaneAnimationState.lastTime = currentTime;",
  "                    // Clamp delta an toàn khi chuyển tab",
  "                    const delta = Math.min(rawDelta, 0.1) * airplaneAnimationState.speedMultiplier;",
  "                    airplaneAnimationState.elapsedTime += delta;",
  "                    airplaneAnimationState.flagClothTime += delta;",
  "",
  "                    const elapsed = airplaneAnimationState.elapsedTime;",
  "                    const clothTime = airplaneAnimationState.flagClothTime;",
  "                    const speed = airplaneAnimationState.speedMultiplier;",
  "",
  "                    // 1. Đồng bộ Render sóng vải WebGL cho Cờ Nhỏ trên trực thăng",
  "                    if (airplaneAnimationState.smallFlagObj) {",
  "                        const sObj = airplaneAnimationState.smallFlagObj;",
  "                        sObj.uniforms.uTime.value = clothTime;",
  "                        sObj.uniforms.uSpeed.value = speed;",
  "                        sObj.renderer.render(sObj.scene, sObj.camera);",
  "                    }",
  "",
  "                    // Cập nhật và vẽ các hạt khói mềm mại",
  "                    updateAndDrawSmoke(delta);",
  "",
  "                    // ----------------------------------------------------",
  "                    // GIAI ĐOẠN 1: Trực thăng 1 tiếp cận từ bên trái, dùng luồng gió cánh quạt đẩy Header rời khỏi màn hình",
  "                    // Trực thăng luôn ở PHÍA SAU Header, tốc độ hai đối tượng gắn kết đồng bộ 100%",
  "                    // ----------------------------------------------------",
  "                    if (elapsed < d1) {",
  "                        const progress1 = Math.min(elapsed / d1, 1);",
  "                        const contactP = 0.12; // 12% đầu: bay tiếp cận mép trái Header",
  "",
  "                        let headerShift = 0;",
  "                        let plane1X = 0;",
  "",
  "                        if (progress1 < contactP) {",
  "                            // Giai đoạn tiếp cận: Trực thăng lướt từ ngoài màn hình đến sát mép trái Header",
  "                            const np = progress1 / contactP;",
  "                            const easeApproach = Math.sin(np * Math.PI * 0.5);",
  "                            plane1X = plane1StartX + ((-plane1TotalWidth - contactGap) - plane1StartX) * easeApproach;",
  "",
  "                            // Gió cánh quạt bắt đầu tác động: Header rung vi mô rất nhẹ (tần số cao, biên độ cực nhỏ <1.2px)",
  "                            if (np > 0.5) {",
  "                                const vibeP = (np - 0.5) / 0.5;",
  "                                headerShift = Math.sin(vibeP * Math.PI * 6) * 1.2 * vibeP;",
  "                            }",
  "                        } else {",
  "                            // Giai đoạn đẩy đồng bộ: Header tăng tốc mượt mà và trực thăng bám sát phía sau đẩy Header",
  "                            const norm = (progress1 - contactP) / (1 - contactP);",
  "                            // Easing tăng tốc tự nhiên, êm ái",
  "                            const pushEased = Math.pow(norm, 1.75);",
  "                            headerShift = pushEased * totalShiftDistance;",
  "",
  "                            // Vị trí trực thăng được tính trực tiếp từ vị trí Header, luôn giữ khoảng cách cố định phía sau Header",
  "                            plane1X = headerShift - plane1TotalWidth - contactGap;",
  "                        }",
  "",
  "                        // Dao động cao độ khí động học nhẹ nhàng",
  "                        const altitudeY = Math.sin(progress1 * Math.PI * 4) * 3;",
  "                        plane1.style.transform = `translate3d(${plane1X}px, calc(-50% + ${altitudeY}px), 0)`;",
  "                        headerWrapper.style.transform = `translate3d(${headerShift}px, 0, 0)`;",
  "",
  "                        // Nhả khói tuabin từ động cơ trực thăng 1",
  "                        if (progress1 < 0.95 && Math.random() < 0.6) {",
  "                            const exhaustX = plane1X + flagW + cableW + 56;",
  "                            emitSmokeParticle(exhaustX, 44 + altitudeY);",
  "                        }",
  "                    } ",
  "                    // ----------------------------------------------------",
  "                    // GIAI ĐOẠN 2: CHỜ 1–2 GIÂY (1.6s) trong khi Header vẫn đang biến mất hoàn toàn",
  "                    // ----------------------------------------------------",
  "                    else if (elapsed < d1 + dPause) {",
  "                        // Trực thăng 1 và cờ đã bay qua xong, kết thúc và xóa khỏi DOM",
  "                        if (plane1.parentNode) {",
  "                            plane1.remove();",
  "                        }",
  "                        // Giữ Header ở trạng thái hoàn toàn biến mất khỏi màn hình",
  "                        headerWrapper.style.transform = `translate3d(${totalShiftDistance}px, 0, 0)`;",
  "                    } ",
  "                    // ----------------------------------------------------",
  "                    // GIAI ĐOẠN 3: Trực thăng 2 xuất hiện từ bên phải, bay qua kéo Header trở về chậm rãi, êm ái",
  "                    // ----------------------------------------------------",
  "                    else if (elapsed < totalDuration) {",
  "                        if (plane1.parentNode) plane1.remove();",
  "",
  "                        if (!plane2) {",
  "                            plane2 = createPlane2TugElement();",
  "                            stage.appendChild(plane2);",
  "                        }",
  "",
  "                        const progress2 = Math.min((elapsed - (d1 + dPause)) / d2, 1);",
  "                        // Easing tự nhiên, giảm tốc êm ái ở cuối (ease-out cubic)",
  "                        const easeOutCubic = 1 - Math.pow(1 - progress2, 3);",
  "",
  "                        // Header trở về từ ngoài màn hình (totalShiftDistance) về chính xác 0px",
  "                        const currentShift = (1 - easeOutCubic) * totalShiftDistance;",
  "                        headerWrapper.style.transform = `translate3d(${currentShift}px, 0, 0)`;",
  "",
  "                        // Trực thăng cứu hộ 2 bay từ bên phải qua bên trái, nối dây tời kéo Header hồi vị",
  "                        const plane2X = currentShift - 170;",
  "                        const altitudeY2 = Math.sin(progress2 * Math.PI * 3) * 3;",
  "                        plane2.style.transform = `translate3d(${plane2X}px, calc(-50% + ${altitudeY2}px), 0)`;",
  "",
  "                        // Nhả khói tuabin từ trực thăng cứu hộ 2",
  "                        if (progress2 < 0.85 && Math.random() < 0.5) {",
  "                            emitSmokeParticle(plane2X + 68, 44 + altitudeY2);",
  "                        }",
  "",
  "                        // Khi Header chạm về đúng vị trí (cuối hành trình), trực thăng 2 tách tời và mờ dần thoát đi",
  "                        if (progress2 > 0.85) {",
  "                            const fadeProgress = (progress2 - 0.85) / 0.15;",
  "                            plane2.style.opacity = String(1 - fadeProgress);",
  "                        } else {",
  "                            plane2.style.opacity = '1';",
  "                        }",
  "                    } ",
  "                    // ----------------------------------------------------",
  "                    // HOÀN TẤT VÀ KHÔI PHỤC TOÀN DIỆN",
  "                    // ----------------------------------------------------",
  "                    else {",
  "                        resetAirplaneAnimation();",
  "                        return;",
  "                    }",
  "",
  "                    airplaneAnimationState.animFrameId = requestAnimationFrame(tick);",
  "                }",
  "",
  "                airplaneAnimationState.animFrameId = requestAnimationFrame(tick);",
  "            };",
  "",
  "            // Khôi phục an toàn khi rời trang",
  "            window.addEventListener('pagehide', resetAirplaneAnimation);",
  "            window.addEventListener('beforeunload', resetAirplaneAnimation);",
  "",
  "            // Backward compatibility alias",
  "            window.triggerVietnamFlagAnimation = window.triggerAirplaneBannerAnimation;",
  "",
  "            // 5. Mobile Drawer Menu Toggle",
  "            // The shared React header owns the mobile drawer state.",
  "",
  "            // 6. Live Search Autocomplete",
  "            const searchInput = document.getElementById('header-search-input');",
  "            const clearBtn = document.getElementById('clear-search-btn');",
  "            const searchDropdown = document.getElementById('search-dropdown');",
  "",
  "            if (searchInput && searchDropdown) {",
  "                const getAllBooksList = () => {",
  "                    return Array.from(new Map([",
  "                        ...(libraryCatalog.trending || []),",
  "                        ...(libraryCatalog.children || []),",
  "                        ...(libraryCatalog.literature || []),",
  "                        ...(libraryCatalog.selfgrowth || []),",
  "                        ...(libraryCatalog.science || []),",
  "                        ...(libraryCatalog.business || []),",
  "                        ...(libraryCatalog.history || []),",
  "                        ...(libraryCatalog.philosophy || []),",
  "                        ...(libraryCatalog.artlifestyle || []),",
  "                        ...(libraryCatalog.biography || [])",
  "                    ].map(book => [book.id || `${book.title}-${book.author}`, book])).values());",
  "                };",
  "",
  "                searchInput.addEventListener('input', (e) => {",
  "                    const val = e.target.value.trim().toLowerCase();",
  "                    if (!val) {",
  "                        if (clearBtn) clearBtn.classList.add('hidden');",
  "                        searchDropdown.classList.add('hidden');",
  "                        return;",
  "                    }",
  "                    if (clearBtn) clearBtn.classList.remove('hidden');",
  "",
  "                    const matches = getAllBooksList().filter(b => (b.title || '').toLowerCase().includes(val) || (b.author || '').toLowerCase().includes(val)).slice(0, 5);",
  "                    if (matches.length > 0) {",
  "                        searchDropdown.innerHTML = matches.map(b => `",
  "                            <a href=\"/chitietsach/${b.id}\" class=\"flex items-center gap-3 p-2 rounded-lg hover:bg-paper-200 dark:hover:bg-night-card transition-colors\">",
  "                                <img src=\"${b.img || '/logo.png'}\" class=\"w-8 h-12 object-cover rounded shrink-0\" onerror=\"this.onerror=null;this.src='/logo.png';\">",
  "                                <div class=\"overflow-hidden\">",
  "                                    <div class=\"font-display text-xs font-bold text-ink dark:text-night-text truncate\">${b.title}</div>",
  "                                    <div class=\"font-metadata-spec text-[10px] text-ink-muted dark:text-night-muted truncate\">${b.author}</div>",
  "                                </div>",
  "                            </a>",
  "                        `).join('');",
  "                        searchDropdown.classList.remove('hidden');",
  "                    } else {",
  "                        searchDropdown.innerHTML = `<div class=\"p-3 text-xs text-ink-muted text-center font-metadata-spec\">Không tìm thấy sách phù hợp</div>`;",
  "                        searchDropdown.classList.remove('hidden');",
  "                    }",
  "                });",
  "",
  "                const initialSearch = new URLSearchParams(window.location.search).get('search');",
  "                if (initialSearch) {",
  "                    searchInput.value = initialSearch;",
  "                    searchInput.dispatchEvent(new Event('input', { bubbles: true }));",
  "                }",
  "",
  "                document.addEventListener('click', (e) => {",
  "                    if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {",
  "                        searchDropdown.classList.add('hidden');",
  "                    }",
  "                });",
  "            }",
  "",
  "            // ========================================================",
  "            // 7. CINEMATIC SCROLL MOTION CHOREOGRAPHY (GSAP & SCROLL)",
  "            // ========================================================",
  "            // CHAPTER 1: broadcast timer",
  "            window.initBroadcastCarousel = function() {",
  "                const broadcast = document.getElementById('hero-broadcast');",
  "                if (!broadcast) return;",
  "                const slides = [...broadcast.querySelectorAll('.hero-broadcast-slide')];",
  "                const dots = broadcast.querySelector('.hero-broadcast-dots');",
  "                const prev = broadcast.querySelector('[data-broadcast-prev]');",
  "                const next = broadcast.querySelector('[data-broadcast-next]');",
  "                if (!slides.length || !dots) return;",
  "",
  "                if (broadcast._carouselTimer) {",
  "                    clearInterval(broadcast._carouselTimer);",
  "                }",
  "                dots.innerHTML = '';",
  "                let index = 0, paused = false;",
  "",
  "                slides.forEach((_, i) => {",
  "                    const b = document.createElement('button');",
  "                    b.type = 'button';",
  "                    b.setAttribute('aria-label', `Chọn slide ${i + 1}`);",
  "                    b.addEventListener('click', () => { show(i); start(); });",
  "                    dots.appendChild(b);",
  "                });",
  "",
  "                const show = (i) => {",
  "                    index = (i + slides.length) % slides.length;",
  "                    slides.forEach((s, n) => s.classList.toggle('is-active', n === index));",
  "                    [...dots.children].forEach((b, n) => b.setAttribute('aria-current', String(n === index)));",
  "                };",
  "",
  "                const start = () => {",
  "                    clearInterval(broadcast._carouselTimer);",
  "                    if (!paused) broadcast._carouselTimer = setInterval(() => show(index + 1), 3500);",
  "                };",
  "",
  "                if (prev && !prev._bound) {",
  "                    prev._bound = true;",
  "                    prev.addEventListener('click', () => { show(index - 1); start(); });",
  "                }",
  "                if (next && !next._bound) {",
  "                    next._bound = true;",
  "                    next.addEventListener('click', () => { show(index + 1); start(); });",
  "                }",
  "",
  "                if (!broadcast._boundHover) {",
  "                    broadcast._boundHover = true;",
  "                    broadcast.addEventListener('mouseenter', () => {",
  "                        paused = true;",
  "                        clearInterval(broadcast._carouselTimer);",
  "                    });",
  "                    broadcast.addEventListener('mouseleave', () => {",
  "                        paused = false;",
  "                        start();",
  "                    });",
  "                }",
  "",
  "                show(0);",
  "                start();",
  "            };",
  "            window.initBroadcastCarousel();",
  "            // CHAPTER 02: FULL-VIEWPORT CINEMATIC REVEAL (Two wings book assembly)",
  "            // Speed reduced from Level 4 down to Level 3 for a calmer, smoother, more visible assembly",
  "            if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {",
  "                gsap.registerPlugin(ScrollTrigger);",
  "",
  "                const ch2Timeline = gsap.timeline({",
  "                    scrollTrigger: {",
  "                        trigger: '#about-section',",
  "                        start: 'top 95%',",
  "                        end: 'bottom 35%',",
  "                        scrub: 1.3",
  "                    }",
  "                });",
  "",
  "                // Phase 1 -> 2: Wings glide in with realistic perspective from deep off-screen margins",
  "                // Duration proportionally adjusted from 0.45s to 0.58s (smoother, Level 3 speed)",
  "                ch2Timeline.addLabel('phase-1-entry', 0);",
  "                ch2Timeline.fromTo('#about-half-left',",
  "                    {",
  "                        x: '-50vw',",
  "                        rotateY: -32,",
  "                        transformOrigin: 'right center',",
  "                        opacity: 0,",
  "                    },",
  "                    {",
  "                        x: 0,",
  "                        rotateY: 0,",
  "                        opacity: 1,",
  "                        duration: 0.58,",
  "                        ease: 'power2.out',",
  "                    },",
  "                    'phase-1-entry'",
  "                );",
  "",
  "                ch2Timeline.fromTo('#about-half-right',",
  "                    {",
  "                        x: '50vw',",
  "                        rotateY: 32,",
  "                        transformOrigin: 'left center',",
  "                        opacity: 0,",
  "                    },",
  "                    {",
  "                        x: 0,",
  "                        rotateY: 0,",
  "                        opacity: 1,",
  "                        duration: 0.58,",
  "                        ease: 'power2.out',",
  "                    },",
  "                    'phase-1-entry'",
  "                );",
  "",
  "                // Phase 2: hold the closed, aligned geometry long enough to observe the lock.",
  "                ch2Timeline.addLabel('phase-2-convergence', 'phase-1-entry+=0.58');",
  "                ch2Timeline.to(['#about-half-left', '#about-half-right'], {",
  "                    duration: 0.32,",
  "                    x: 0,",
  "                    rotateY: 0,",
  "                    ease: 'power1.inOut'",
  "                }, 'phase-2-convergence');",
  "",
  "                // Phase 3: The Golden Spine Hinge locks into place at convergence",
  "                ch2Timeline.fromTo('#ch2-spine-hinge',",
  "                    { opacity: 0, scaleY: 0.7 },",
  "                    { opacity: 1, scaleY: 1, ease: 'power1.inOut' },",
  "                    0.45",
  "                );",
  "",
  "                // Phase 4 & 5: Inner content settles firmly into clear legible reading mode",
  "                ch2Timeline.fromTo('#about-half-left .space-y-6',",
  "                    { y: 25, opacity: 0.8 },",
  "                    { y: 0, opacity: 1, ease: 'power1.out' },",
  "                    0.65",
  "                );",
  "                ch2Timeline.fromTo('#about-half-right .space-y-6',",
  "                    { y: 25, opacity: 0.8 },",
  "                    { y: 0, opacity: 1, ease: 'power1.out' },",
  "                    0.65",
  "                );",
  "",
  "                // ========================================================",
  "                // CHAPTER 03: ELEGANT EDITORIAL UNVEIL (Light & Soothing)",
  "                // Distinct effect 1: Gentle vertical page-rise with slight tilt + 3 World pillars soft cascade",
  "                // ========================================================",
  "                gsap.fromTo('#ch3-page-leaf',",
  "                    { y: 35, rotateX: 6, opacity: 0.65 },",
  "                    {",
  "                        y: 0,",
  "                        rotateX: 0,",
  "                        opacity: 1,",
  "                        ease: 'power2.out',",
  "                        scrollTrigger: {",
  "                            trigger: '#values-section',",
  "                            start: 'top 85%',",
  "                            end: 'top 45%',",
  "                            scrub: 1",
  "                        }",
  "                    }",
  "                );",
  "",
  "                // Three Worlds: Elegant staggered entrance with reliable finish (nhanh hơn một chút theo yêu cầu)",
  "                gsap.fromTo(['#val-world-1', '#val-world-2', '#val-world-3'], ",
  "                    { y: 30, opacity: 0 },",
  "                    {",
  "                        y: 0,",
  "                        opacity: 1,",
  "                        stagger: 0.08,",
  "                        duration: 0.48,",
  "                        ease: 'power2.out',",
  "                        scrollTrigger: {",
  "                            trigger: '#values-assemble-grid',",
  "                            start: 'top 92%',",
  "                            toggleActions: 'play none none none'",
  "                        }",
  "                    }",
  "                );",
  "",
  "                // ========================================================",
  "                // AUTONOMOUS SCROLL ENTRANCE ANIMATIONS (HALMBOOK EDITORIAL MOTION)",
  "                // - Alternating Shelf Animations (Type A: Fade-Up vs Type B: Fade-In + Horizontal Drift)",
  "                // - Breakers (02, 03, 04): Staggered Cards (01 -> 02 -> 03) + Header Choreography",
  "                // - Triggered on Scroll into view, zero conflict with hover, smooth easing",
  "                // ========================================================",
  "                const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;",
  "",
  "                if (!isReducedMotion) {",
  "                    // Helper to animate book shelves with prominent alternating styles (Type A vs Type B)",
  "                    function initShelfEntrance(sectionId, headerId, contentId, type) {",
  "                        const section = document.querySelector(sectionId);",
  "                        const header = document.querySelector(headerId);",
  "                        const content = document.querySelector(contentId);",
  "                        if (!section || !header || !content) return;",
  "",
  "                        const headerLeft = header.firstElementChild;",
  "                        const headerRight = header.children.length > 1 ? header.lastElementChild : null;",
  "",
  "                        // Identify shelf cards and spotlight card (if any)",
  "                        let shelfRow = content;",
  "                        let spotlightCard = null;",
  "",
  "                        if (content.id === 'trending-shelf-combo') {",
  "                            spotlightCard = content.firstElementChild;",
  "                            shelfRow = content.querySelector('#trending-shelf') || content;",
  "                        }",
  "",
  "                        // Grab the visible book cards to stagger (up to 8 cards for optimal rhythm)",
  "                        const cards = shelfRow ? Array.from(shelfRow.children).slice(0, 8) : [];",
  "",
  "                        const tl = gsap.timeline({",
  "                            scrollTrigger: {",
  "                                trigger: section,",
  "                                start: 'top 80%',",
  "                                toggleActions: 'play none none none'",
  "                            }",
  "                        });",
  "",
  "                        if (type === 'A') {",
  "                            // ====================================================",
  "                            // KIỂU A: THĂNG HOA CHIỀU DỌC & LÀN SÓNG TRỒI KỆ (VERTICAL CASCADE)",
  "                            // Tiêu đề dâng lên dứt khoát -> Thẻ sách trồi lên lần lượt theo làn sóng",
  "                            // ====================================================",
  "                            if (headerLeft) {",
  "                                tl.fromTo(headerLeft,",
  "                                    { y: 36, opacity: 0 },",
  "                                    { y: 0, opacity: 1, duration: 0.55, ease: 'power2.out', clearProps: 'transform' }",
  "                                );",
  "                            }",
  "                            if (headerRight) {",
  "                                tl.fromTo(headerRight,",
  "                                    { y: 26, opacity: 0 },",
  "                                    { y: 0, opacity: 1, duration: 0.50, ease: 'power2.out', clearProps: 'transform' },",
  "                                    '-=0.36'",
  "                                );",
  "                            }",
  "",
  "                            // Special handling for trending section category tabs",
  "                            if (sectionId === '#trending-section') {",
  "                                const catNav = section.querySelector('#trending-cat-nav');",
  "                                if (catNav) {",
  "                                    tl.fromTo(catNav,",
  "                                        { y: 20, opacity: 0 },",
  "                                        { y: 0, opacity: 1, duration: 0.45, ease: 'power2.out', clearProps: 'transform' },",
  "                                        '-=0.32'",
  "                                    );",
  "                                }",
  "                            }",
  "",
  "                            // If there is a spotlight card on the left (e.g. Trending)",
  "                            if (spotlightCard) {",
  "                                tl.fromTo(spotlightCard,",
  "                                    { y: 44, opacity: 0, scale: 0.93 },",
  "                                    {",
  "                                        y: 0,",
  "                                        opacity: 1,",
  "                                        scale: 1,",
  "                                        duration: 0.60,",
  "                                        ease: 'power2.out',",
  "                                        clearProps: 'transform',",
  "                                        onStart: function() { if (spotlightCard) spotlightCard.style.transition = 'none'; },",
  "                                        onComplete: function() { if (spotlightCard) spotlightCard.style.transition = ''; }",
  "                                    },",
  "                                    '-=0.28'",
  "                                );",
  "                            }",
  "",
  "                            // Staggered wave elevation for book cards",
  "                            if (cards.length) {",
  "                                tl.fromTo(cards,",
  "                                    { y: 52, opacity: 0, scale: 0.92 },",
  "                                    {",
  "                                        y: 0,",
  "                                        opacity: 1,",
  "                                        scale: 1,",
  "                                        stagger: 0.07,",
  "                                        duration: 0.62,",
  "                                        ease: 'power2.out',",
  "                                        clearProps: 'transform',",
  "                                        onStart: function() { cards.forEach(c => { if (c) c.style.transition = 'none'; }); },",
  "                                        onComplete: function() { cards.forEach(c => { if (c) c.style.transition = ''; }); }",
  "                                    },",
  "                                    spotlightCard ? '-=0.42' : '-=0.35'",
  "                                );",
  "                            } else {",
  "                                tl.fromTo(content,",
  "                                    { y: 35, opacity: 0 },",
  "                                    { y: 0, opacity: 1, duration: 0.55, ease: 'power2.out', clearProps: 'transform' },",
  "                                    '-=0.35'",
  "                                );",
  "                            }",
  "",
  "                        } else {",
  "                            // ====================================================",
  "                            // KIỂU B: DÒNG CHẢY NGANG ĐỐI XỨNG & PERSPECTIVE STREAM (LATERAL FLOW)",
  "                            // Header hội tụ 2 cánh -> Thẻ sách lướt nối tiếp từ phải sang trái",
  "                            // ====================================================",
  "                            if (headerLeft) {",
  "                                tl.fromTo(headerLeft,",
  "                                    { x: -48, opacity: 0 },",
  "                                    { x: 0, opacity: 1, duration: 0.56, ease: 'power3.out', clearProps: 'transform' }",
  "                                );",
  "                            }",
  "                            if (headerRight) {",
  "                                tl.fromTo(headerRight,",
  "                                    { x: 48, opacity: 0 },",
  "                                    { x: 0, opacity: 1, duration: 0.56, ease: 'power3.out', clearProps: 'transform' },",
  "                                    '-=0.40'",
  "                                );",
  "                            }",
  "",
  "                            // Lateral stream glide for book cards",
  "                            if (cards.length) {",
  "                                tl.fromTo(cards,",
  "                                    { x: 68, opacity: 0, scale: 0.94 },",
  "                                    {",
  "                                        x: 0,",
  "                                        opacity: 1,",
  "                                        scale: 1,",
  "                                        stagger: 0.075,",
  "                                        duration: 0.65,",
  "                                        ease: 'power3.out',",
  "                                        clearProps: 'transform',",
  "                                        onStart: function() { cards.forEach(c => { if (c) c.style.transition = 'none'; }); },",
  "                                        onComplete: function() { cards.forEach(c => { if (c) c.style.transition = ''; }); }",
  "                                    },",
  "                                    '-=0.38'",
  "                                );",
  "                            } else {",
  "                                tl.fromTo(content,",
  "                                    { x: 38, opacity: 0 },",
  "                                    { x: 0, opacity: 1, duration: 0.58, ease: 'power3.out', clearProps: 'transform' },",
  "                                    '-=0.38'",
  "                                );",
  "                            }",
  "                        }",
  "                    }",
  "",
  "                    // 1. Sách thịnh hành -> Kiểu A (Thăng hoa Chiều dọc & Làn sóng trồi kệ)",
  "                    initShelfEntrance('#trending-section', '#trending-header', '#trending-shelf-combo', 'A');",
  "",
  "                    // 2. Thế giới tuổi thơ -> Kiểu B (Dòng chảy Ngang Đối xứng & Drift Stream)",
  "                    initShelfEntrance('#children-section', '#children-header', '#children-shelf', 'B');",
  "",
  "                    // 3. Văn học & Tiểu thuyết -> Kiểu A (Thăng hoa Chiều dọc & Làn sóng trồi kệ)",
  "                    initShelfEntrance('#literature-section', '#literature-header', '#literature-shelf', 'A');",
  "",
  "                    // 4. Kỹ năng & Phát triển -> Kiểu B (Dòng chảy Ngang Đối xứng & Drift Stream)",
  "                    initShelfEntrance('#selfgrowth-section', '#selfgrowth-header', '#selfgrowth-shelf', 'B');",
  "",
  "                    // Background accent \"GROW\" for selfgrowth section",
  "                    const growWord = document.querySelector('#selfgrowth-section span.text-\\\\[18vw\\\\]');",
  "                    if (growWord) {",
  "                        gsap.fromTo(growWord,",
  "                            { scale: 0.88, opacity: 0 },",
  "                            {",
  "                                scale: 1,",
  "                                opacity: 0.7,",
  "                                duration: 0.8,",
  "                                ease: 'power2.out',",
  "                                scrollTrigger: {",
  "                                    trigger: '#selfgrowth-section',",
  "                                    start: 'top 85%',",
  "                                    toggleActions: 'play none none none'",
  "                                }",
  "                            }",
  "                        );",
  "                    }",
  "",
  "                    // ========================================================",
  "                    // BREAKER 02: KHÔNG GIAN ĐỘC BẢN & CỘNG ĐỒNG",
  "                    // Sequenced Header: Label -> Title -> Divider -> Description",
  "                    // Staggered Cards: 01 -> 02 -> 03 (Stagger ~140ms, Duration ~550ms, Smooth Easing)",
  "                    // ========================================================",
  "                    const spaceSection = document.querySelector('#reading-space-section');",
  "                    if (spaceSection) {",
  "                        const spaceTl = gsap.timeline({",
  "                            scrollTrigger: {",
  "                                trigger: spaceSection,",
  "                                start: 'top 82%',",
  "                                toggleActions: 'play none none none'",
  "                            }",
  "                        });",
  "",
  "                        spaceTl.fromTo('#space-header-label',",
  "                            { y: 14, opacity: 0 },",
  "                            { y: 0, opacity: 1, duration: 0.42, ease: 'power2.out', clearProps: 'transform' }",
  "                        );",
  "                        spaceTl.fromTo('#space-header-title',",
  "                            { y: 18, opacity: 0 },",
  "                            { y: 0, opacity: 1, duration: 0.48, ease: 'power2.out', clearProps: 'transform' },",
  "                            '-=0.28'",
  "                        );",
  "                        spaceTl.fromTo('#space-header-divider',",
  "                            { scaleX: 0, opacity: 0 },",
  "                            { scaleX: 1, opacity: 1, duration: 0.38, ease: 'power2.out', clearProps: 'transform' },",
  "                            '-=0.25'",
  "                        );",
  "                        spaceTl.fromTo('#space-header-desc',",
  "                            { y: 14, opacity: 0 },",
  "                            { y: 0, opacity: 1, duration: 0.42, ease: 'power2.out', clearProps: 'transform' },",
  "                            '-=0.22'",
  "                        );",
  "",
  "                        const spaceCards = [",
  "                            document.querySelector('#space-card-1'),",
  "                            document.querySelector('#space-card-2'),",
  "                            document.querySelector('#space-card-3')",
  "                        ].filter(Boolean);",
  "",
  "                        if (spaceCards.length) {",
  "                            spaceTl.fromTo(spaceCards,",
  "                                { y: 28, opacity: 0 },",
  "                                {",
  "                                    y: 0,",
  "                                    opacity: 1,",
  "                                    stagger: 0.14,",
  "                                    duration: 0.55,",
  "                                    ease: 'power2.out',",
  "                                    clearProps: 'transform',",
  "                                    onStart: function() {",
  "                                        spaceCards.forEach(c => { if (c) c.style.transition = 'none'; });",
  "                                    },",
  "                                    onComplete: function() {",
  "                                        spaceCards.forEach(c => { if (c) c.style.transition = ''; });",
  "                                    }",
  "                                },",
  "                                '-=0.15'",
  "                            );",
  "                        }",
  "                    }",
  "",
  "                    // 5. Khoa học & Công nghệ -> Kiểu A (Thăng hoa Chiều dọc & Làn sóng trồi kệ)",
  "                    initShelfEntrance('#science-section', '#science-header', '#science-shelf', 'A');",
  "",
  "                    // 6. Kinh tế & Khởi nghiệp -> Kiểu B (Dòng chảy Ngang Đối xứng & Drift Stream)",
  "                    initShelfEntrance('#business-section', '#business-header', '#business-shelf', 'B');",
  "",
  "                    // ========================================================",
  "                    // BREAKER 03: HÀNH TRÌNH TRI THỨC (20 Phút Mỗi Ngày)",
  "                    // Sequenced Header + Staggered Cards (01 -> 02 -> 03)",
  "                    // ========================================================",
  "                    const habitSection = document.querySelector('#habit-section');",
  "                    if (habitSection) {",
  "                        const habitTl = gsap.timeline({",
  "                            scrollTrigger: {",
  "                                trigger: habitSection,",
  "                                start: 'top 82%',",
  "                                toggleActions: 'play none none none'",
  "                            }",
  "                        });",
  "",
  "                        habitTl.fromTo('#habit-header-label',",
  "                            { y: 14, opacity: 0 },",
  "                            { y: 0, opacity: 1, duration: 0.42, ease: 'power2.out', clearProps: 'transform' }",
  "                        );",
  "                        habitTl.fromTo('#habit-header-title',",
  "                            { y: 18, opacity: 0 },",
  "                            { y: 0, opacity: 1, duration: 0.48, ease: 'power2.out', clearProps: 'transform' },",
  "                            '-=0.28'",
  "                        );",
  "                        habitTl.fromTo('#habit-header-divider',",
  "                            { scaleX: 0, opacity: 0 },",
  "                            { scaleX: 1, opacity: 1, duration: 0.38, ease: 'power2.out', clearProps: 'transform' },",
  "                            '-=0.25'",
  "                        );",
  "                        habitTl.fromTo('#habit-header-desc',",
  "                            { y: 14, opacity: 0 },",
  "                            { y: 0, opacity: 1, duration: 0.42, ease: 'power2.out', clearProps: 'transform' },",
  "                            '-=0.22'",
  "                        );",
  "",
  "                        const habitCards = [",
  "                            document.querySelector('#habit-card-1'),",
  "                            document.querySelector('#habit-card-2'),",
  "                            document.querySelector('#habit-card-3')",
  "                        ].filter(Boolean);",
  "",
  "                        if (habitCards.length) {",
  "                            habitTl.fromTo(habitCards,",
  "                                { y: 28, opacity: 0 },",
  "                                {",
  "                                    y: 0,",
  "                                    opacity: 1,",
  "                                    stagger: 0.14,",
  "                                    duration: 0.55,",
  "                                    ease: 'power2.out',",
  "                                    clearProps: 'transform',",
  "                                    onStart: function() {",
  "                                        habitCards.forEach(c => { if (c) c.style.transition = 'none'; });",
  "                                    },",
  "                                    onComplete: function() {",
  "                                        habitCards.forEach(c => { if (c) c.style.transition = ''; });",
  "                                    }",
  "                                },",
  "                                '-=0.15'",
  "                            );",
  "                        }",
  "                    }",
  "",
  "                    // 7. Lịch sử & Văn hóa -> Kiểu A (Thăng hoa Chiều dọc & Làn sóng trồi kệ)",
  "                    initShelfEntrance('#history-section', '#history-header', '#history-shelf', 'A');",
  "",
  "                    // 8. Tâm lý & Triết học -> Kiểu B (Dòng chảy Ngang Đối xứng & Drift Stream)",
  "                    initShelfEntrance('#philosophy-section', '#philosophy-header', '#philosophy-shelf', 'B');",
  "",
  "                    // ========================================================",
  "                    // BREAKER 04: TRẢI NGHIỆM THÔNG MINH (Kỷ Nguyên Số)",
  "                    // Sequenced Header + Staggered Cards (01 -> 02 -> 03)",
  "                    // ========================================================",
  "                    const smartSection = document.querySelector('#smartreading-section');",
  "                    if (smartSection) {",
  "                        const smartTl = gsap.timeline({",
  "                            scrollTrigger: {",
  "                                trigger: smartSection,",
  "                                start: 'top 82%',",
  "                                toggleActions: 'play none none none'",
  "                            }",
  "                        });",
  "",
  "                        smartTl.fromTo('#smart-header-label',",
  "                            { y: 14, opacity: 0 },",
  "                            { y: 0, opacity: 1, duration: 0.42, ease: 'power2.out', clearProps: 'transform' }",
  "                        );",
  "                        smartTl.fromTo('#smart-header-title',",
  "                            { y: 18, opacity: 0 },",
  "                            { y: 0, opacity: 1, duration: 0.48, ease: 'power2.out', clearProps: 'transform' },",
  "                            '-=0.28'",
  "                        );",
  "                        smartTl.fromTo('#smart-header-divider',",
  "                            { scaleX: 0, opacity: 0 },",
  "                            { scaleX: 1, opacity: 1, duration: 0.38, ease: 'power2.out', clearProps: 'transform' },",
  "                            '-=0.25'",
  "                        );",
  "                        smartTl.fromTo('#smart-header-desc',",
  "                            { y: 14, opacity: 0 },",
  "                            { y: 0, opacity: 1, duration: 0.42, ease: 'power2.out', clearProps: 'transform' },",
  "                            '-=0.22'",
  "                        );",
  "",
  "                        const smartCards = [",
  "                            document.querySelector('#smart-card-1'),",
  "                            document.querySelector('#smart-card-2'),",
  "                            document.querySelector('#smart-card-3')",
  "                        ].filter(Boolean);",
  "",
  "                        if (smartCards.length) {",
  "                            smartTl.fromTo(smartCards,",
  "                                { y: 28, opacity: 0 },",
  "                                {",
  "                                    y: 0,",
  "                                    opacity: 1,",
  "                                    stagger: 0.14,",
  "                                    duration: 0.55,",
  "                                    ease: 'power2.out',",
  "                                    clearProps: 'transform',",
  "                                    onStart: function() {",
  "                                        smartCards.forEach(c => { if (c) c.style.transition = 'none'; });",
  "                                    },",
  "                                    onComplete: function() {",
  "                                        smartCards.forEach(c => { if (c) c.style.transition = ''; });",
  "                                    }",
  "                                },",
  "                                '-=0.15'",
  "                            );",
  "                        }",
  "                    }",
  "",
  "                    // 9. Nghệ thuật & Lối sống -> Kiểu A (Thăng hoa Chiều dọc & Làn sóng trồi kệ)",
  "                    initShelfEntrance('#artlifestyle-section', '#artlifestyle-header', '#artlifestyle-shelf', 'A');",
  "",
  "                    // 10. Hồi ký & Danh nhân -> Kiểu B (Dòng chảy Ngang Đối xứng & Drift Stream)",
  "                    initShelfEntrance('#biography-section', '#biography-header', '#biography-shelf', 'B');",
  "",
  "                    // 11. Chủ đề cảm hứng -> Kiểu A (Thăng hoa Chiều dọc & Làn sóng trồi kệ)",
  "                    initShelfEntrance('#topic-section', '#topic-header', '#topic-shelf', 'A');",
  "",
  "                    // 12. Lời mời khám phá (Final Invitation) -> Gentle Elevation & Settle",
  "                    const invEl = document.querySelector('#invitation-content');",
  "                    if (invEl) {",
  "                        gsap.fromTo(invEl,",
  "                            { y: 24, opacity: 0 },",
  "                            {",
  "                                y: 0,",
  "                                opacity: 1,",
  "                                duration: 0.58,",
  "                                ease: 'power2.out',",
  "                                clearProps: 'transform',",
  "                                scrollTrigger: {",
  "                                    trigger: '#invitation-section',",
  "                                    start: 'top 85%',",
  "                                    toggleActions: 'play none none none'",
  "                                }",
  "                            }",
  "                        );",
  "                    }",
  "",
  "                    // 13. Đối tác xuất bản (Publishers Marquee Section) -> Soft Fade",
  "                    const pubEl = document.querySelector('#publishers-content');",
  "                    if (pubEl) {",
  "                        gsap.fromTo(pubEl,",
  "                            { y: 20, opacity: 0 },",
  "                            {",
  "                                y: 0,",
  "                                opacity: 1,",
  "                                duration: 0.55,",
  "                                ease: 'power2.out',",
  "                                clearProps: 'transform',",
  "                                scrollTrigger: {",
  "                                    trigger: '#publishers-section',",
  "                                    start: 'top 88%',",
  "                                    toggleActions: 'play none none none'",
  "                                }",
  "                            }",
  "                        );",
  "                    }",
  "                }",
  "",
  "                // Re-calculate all scroll trigger start/end positions accurately",
  "                ScrollTrigger.refresh();",
  "            }",
  "",
  "            // ========================================================",
  "            // 7B. READER SETTINGS CONTROLLER & AUTO FLIP ENGINE",
  "            // Distinctly flips between chapters when enabled; allows free scrolling when disabled",
  "            // ========================================================",
  "            const settingsModal = document.getElementById('settings-modal');",
  "            const modalAutoScrollToggle = document.getElementById('modal-auto-scroll-toggle');",
  "            const modalAutoScrollBadge = document.getElementById('modal-auto-scroll-badge');",
  "",
  "            function getAutoChapterScrollPreference() {",
  "                const stored = localStorage.getItem('halmbook_auto_chapter_scroll');",
  "                // Default is TRUE (BẬT)",
  "                return stored === null ? true : stored === 'true';",
  "            }",
  "",
  "            function syncAllAutoScrollUI(isEnabled) {",
  "                // Header Avatar dropdown switch & Mobile switch",
  "                const headerSwitch = document.getElementById('header-autoscroll-switch');",
  "                const mobileSwitch = document.getElementById('mobile-autoscroll-switch');",
  "",
  "                if (headerSwitch) headerSwitch.checked = isEnabled;",
  "                if (mobileSwitch) mobileSwitch.checked = isEnabled;",
  "",
  "                // Modal switch & badge",
  "                if (modalAutoScrollToggle) modalAutoScrollToggle.checked = isEnabled;",
  "                if (modalAutoScrollBadge) {",
  "                    if (isEnabled) {",
  "                        modalAutoScrollBadge.textContent = 'Đang Bật (Mặc định)';",
  "                        modalAutoScrollBadge.className = 'font-bold text-wine dark:text-gold uppercase tracking-wider';",
  "                    } else {",
  "                        modalAutoScrollBadge.textContent = 'Đang Tắt (Cuộn tự do)';",
  "                        modalAutoScrollBadge.className = 'font-bold text-gray-500 dark:text-night-muted uppercase tracking-wider';",
  "                    }",
  "                }",
  "            }",
  "",
  "            function syncSettingsModalUI(isEnabled) {",
  "                syncAllAutoScrollUI(isEnabled);",
  "            }",
  "",
  "            window.handleHeaderAutoScrollSwitch = function(checked) {",
  "                localStorage.setItem('halmbook_auto_chapter_scroll', String(checked));",
  "                syncAllAutoScrollUI(checked);",
  "                if (window.updateChapterFlippingState) {",
  "                    window.updateChapterFlippingState(checked);",
  "                }",
  "            };",
  "",
  "            window.toggleHeaderAutoScroll = function() {",
  "                const current = getAutoChapterScrollPreference();",
  "                window.handleHeaderAutoScrollSwitch(!current);",
  "            };",
  "",
  "            window.openSettingsModal = function() {",
  "                if (!settingsModal) return;",
  "                syncAllAutoScrollUI(getAutoChapterScrollPreference());",
  "                settingsModal.classList.remove('hidden');",
  "                settingsModal.classList.add('flex');",
  "            };",
  "",
  "            window.closeSettingsModal = function() {",
  "                if (!settingsModal) return;",
  "                settingsModal.classList.add('hidden');",
  "                settingsModal.classList.remove('flex');",
  "            };",
  "",
  "            if (settingsModal) {",
  "                settingsModal.addEventListener('click', (e) => {",
  "                    if (e.target === settingsModal) closeSettingsModal();",
  "                });",
  "            }",
  "",
  "            window.handleModalAutoScrollToggle = function(checked) {",
  "                window.handleHeaderAutoScrollSwitch(checked);",
  "            };",
  "",
  "            (function setupSmartChapterFlipping() {",
  "                const chapterSelectors = [",
  "                    '#chapter-0-broadcast',",
  "                    '#about-section',",
  "                    '#trending-section',",
  "                    '#children-section',",
  "                    '#values-section',",
  "                    '#literature-section',",
  "                    '#selfgrowth-section',",
  "                    '#reading-space-section',",
  "                    '#science-section',",
  "                    '#business-section',",
  "                    '#habit-section',",
  "                    '#history-section',",
  "                    '#philosophy-section',",
  "                    '#smartreading-section',",
  "                    '#artlifestyle-section',",
  "                    '#biography-section',",
  "                    '#topic-section',",
  "                    '#invitation-section',",
  "                    '#publishers-section'",
  "                ];",
  "",
  "                const chapterEls = chapterSelectors",
  "                    .map(sel => document.querySelector(sel))",
  "                    .filter(el => Boolean(el));",
  "",
  "                if (!chapterEls.length) return;",
  "",
  "                const flipCue = document.getElementById('chapter-flip-cue');",
  "                let isFlipping = false;",
  "                let flipFallbackTimer = null;",
  "                let touchStartY = 0;",
  "                let isListenersBound = false;",
  "",
  "                function getCurrentChapterIndex() {",
  "                    const scrollY = window.scrollY;",
  "                    const navbar = document.getElementById('navbar');",
  "                    const chapterMarker = scrollY + Math.min((navbar?.offsetHeight || 0) + 16, window.innerHeight * 0.2);",
  "                    let activeIndex = 0;",
  "",
  "                    for (let i = 0; i < chapterEls.length; i++) {",
  "                        const top = chapterEls[i].getBoundingClientRect().top + scrollY;",
  "                        if (chapterMarker >= top - 20) {",
  "                            activeIndex = i;",
  "                        }",
  "                    }",
  "                    return activeIndex;",
  "                }",
  "",
  "                function finishChapterFlip() {",
  "                    if (!isFlipping) return;",
  "                    isFlipping = false;",
  "                    clearTimeout(flipFallbackTimer);",
  "                }",
  "",
  "                function flipToChapter(targetIndex) {",
  "                    if (targetIndex < 0 || targetIndex >= chapterEls.length || isFlipping) return;",
  "                    isFlipping = true;",
  "                    clearTimeout(flipFallbackTimer);",
  "",
  "                    // Show subtle visual transition cue",
  "                    if (flipCue) {",
  "                        flipCue.classList.add('is-active');",
  "                        setTimeout(() => flipCue.classList.remove('is-active'), 400);",
  "                    }",
  "",
  "                    const targetEl = chapterEls[targetIndex];",
  "                    const requestedTop = targetIndex === 0 ? 0 : (targetEl.getBoundingClientRect().top + window.scrollY);",
  "                    const maxScrollTop = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);",
  "                    const targetTop = Math.max(0, Math.min(requestedTop, maxScrollTop));",
  "                    const scrollDistance = Math.abs(window.scrollY - targetTop);",
  "",
  "                    window.scrollTo({",
  "                        top: targetTop,",
  "                        behavior: 'smooth'",
  "                    });",
  "",
  "                    // Keep input locked until smooth scrolling actually ends; retain a fallback for older browsers.",
  "                    flipFallbackTimer = setTimeout(finishChapterFlip, Math.min(1800, Math.max(700, scrollDistance / 1.5 + 300)));",
  "                }",
  "",
  "                function onChapterScrollEnd() {",
  "                    finishChapterFlip();",
  "                }",
  "",
  "                function shouldIgnoreScrollTarget(target) {",
  "                    const chatWin = document.getElementById('chat-window');",
  "                    if (chatWin && chatWin.contains(target)) return true;",
  "                    const searchDrop = document.getElementById('search-dropdown');",
  "                    if (searchDrop && !searchDrop.classList.contains('hidden') && searchDrop.contains(target)) return true;",
  "                    const setModal = document.getElementById('settings-modal');",
  "                    return Boolean(setModal && !setModal.classList.contains('hidden') && setModal.contains(target));",
  "                }",
  "",
  "                // Handle Wheel Event with Intent Threshold",
  "                function onSmartWheel(e) {",
  "                    // Do not hijack scrolling inside interactive popups, chat window or settings modal",
  "                    if (shouldIgnoreScrollTarget(e.target)) return;",
  "",
  "                    // Require deliberate scroll intent (delta threshold > 18px for snappy response)",
  "                    if (Math.abs(e.deltaY) < 18) return;",
  "",
  "                    if (isFlipping) {",
  "                        e.preventDefault();",
  "                        return;",
  "                    }",
  "",
  "                    const currentIndex = getCurrentChapterIndex();",
  "                    if (e.deltaY > 0) {",
  "                        // Scrolling Down -> Flip forward to next chapter",
  "                        if (currentIndex < chapterEls.length - 1) {",
  "                            e.preventDefault();",
  "                            flipToChapter(currentIndex + 1);",
  "                        }",
  "                    } else if (e.deltaY < 0) {",
  "                        // Scrolling Up -> Flip backward to previous chapter",
  "                        if (currentIndex > 0) {",
  "                            e.preventDefault();",
  "                            flipToChapter(currentIndex - 1);",
  "                        }",
  "                    }",
  "                }",
  "",
  "                // Handle Mobile / Touch Gestures",
  "                function onSmartTouchStart(e) {",
  "                    if (shouldIgnoreScrollTarget(e.target)) {",
  "                        touchStartY = 0;",
  "                        return;",
  "                    }",
  "                    if (e.touches && e.touches[0]) {",
  "                        touchStartY = e.touches[0].clientY;",
  "                    }",
  "                }",
  "",
  "                function onSmartTouchMove(e) {",
  "                    if (!touchStartY || !e.touches || !e.touches[0]) return;",
  "                    if (shouldIgnoreScrollTarget(e.target)) return;",
  "                    const deltaY = touchStartY - e.touches[0].clientY;",
  "                    if (Math.abs(deltaY) < 45) return;",
  "",
  "                    const currentIndex = getCurrentChapterIndex();",
  "                    const targetIndex = deltaY > 0 ? currentIndex + 1 : currentIndex - 1;",
  "                    if (targetIndex >= 0 && targetIndex < chapterEls.length) {",
  "                        e.preventDefault();",
  "                        touchStartY = 0;",
  "                        flipToChapter(targetIndex);",
  "                    }",
  "                }",
  "",
  "                function onSmartTouchEnd() {",
  "                    touchStartY = 0;",
  "                }",
  "",
  "                function bindListeners() {",
  "                    if (isListenersBound) return;",
  "                    window.addEventListener('wheel', onSmartWheel, { passive: false });",
  "                    window.addEventListener('touchstart', onSmartTouchStart, { passive: true });",
  "                    window.addEventListener('touchmove', onSmartTouchMove, { passive: false });",
  "                    window.addEventListener('touchend', onSmartTouchEnd, { passive: true });",
  "                    window.addEventListener('scrollend', onChapterScrollEnd);",
  "                    isListenersBound = true;",
  "                }",
  "",
  "                function unbindListeners() {",
  "                    if (!isListenersBound) return;",
  "                    window.removeEventListener('wheel', onSmartWheel);",
  "                    window.removeEventListener('touchstart', onSmartTouchStart);",
  "                    window.removeEventListener('touchmove', onSmartTouchMove);",
  "                    window.removeEventListener('touchend', onSmartTouchEnd);",
  "                    window.removeEventListener('scrollend', onChapterScrollEnd);",
  "                    clearTimeout(flipFallbackTimer);",
  "                    finishChapterFlip();",
  "                    if (flipCue) flipCue.classList.remove('is-active');",
  "                    isListenersBound = false;",
  "                }",
  "",
  "                // Global updater hooked directly to settings switch",
  "                window.updateChapterFlippingState = function(isEnabled) {",
  "                    if (typeof isEnabled === 'undefined') {",
  "                        isEnabled = getAutoChapterScrollPreference();",
  "                    }",
  "                    if (isEnabled) {",
  "                        bindListeners();",
  "                    } else {",
  "                        unbindListeners();",
  "                    }",
  "                };",
  "",
  "                // Initialize state upon page load",
  "                const initialPref = getAutoChapterScrollPreference();",
  "                window.updateChapterFlippingState(initialPref);",
  "                syncAllAutoScrollUI(initialPref);",
  "            })();",
  "",
  "            // Ensure window always rests at the top on full reload / page show",
  "            window.addEventListener('pageshow', function(e) {",
  "                if (!window.location.hash) {",
  "                    window.scrollTo(0, 0);",
  "                }",
  "            });",
  "            window.addEventListener('beforeunload', function() {",
  "                window.scrollTo(0, 0);",
  "            });",
  "",
  "        })();"
].join("\n");
const TAILWIND_CDN = "https://cdn.tailwindcss.com";
const PAGE_SCRIPTS = ["https://unpkg.com/@phosphor-icons/web", "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js", "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js", "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"];

export default function Test() {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window.initBroadcastCarousel === "function") {
        window.initBroadcastCarousel();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.title = "HALM BOOK \u2014 Kh\u00f4ng Gian \u0110\u1ecdc S\u00e1ch Tr\u1ef1c Tuy\u1ebfn & Tr\u1ee3 L\u00fd AI";
    document.documentElement.lang = "vi";
    document.documentElement.classList.add("scroll-smooth");

    [
      ["description", "HALM BOOK - N\u1ec1n t\u1ea3ng \u0111\u1ecdc s\u00e1ch tr\u1ef1c tuy\u1ebfn cao c\u1ea5p t\u00edch h\u1ee3p AI Chatbot. Tr\u1ea3i nghi\u1ec7m cu\u1ed9n trang \u0111i\u1ec7n \u1ea3nh v\u00e0 k\u1ec7 s\u00e1ch t\u01b0\u01a1ng t\u00e1c."],
      ["viewport", "width=device-width, initial-scale=1.0"],
    ].forEach(([name, content]) => {
      let meta = document.head.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    });

    const cache = window.__HALM_BOOK_SCRIPT_CACHE__ || (window.__HALM_BOOK_SCRIPT_CACHE__ = {});
    const loadScript = (src) => {
      if (cache[src]) return cache[src];
      cache[src] = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.async = false;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Kh?ng th? t?i th? vi?n: ${src}`));
        document.head.appendChild(script);
      });
      return cache[src];
    };


    const initializePage = async () => {
      window.tailwind = window.tailwind || {};
      window.tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            fontFamily: {
              sans: ['var(--font-ui)', 'sans-serif'],
              display: ['var(--font-display)', 'sans-serif'],
              metadata: ['var(--font-metadata)', 'sans-serif'],
              editorial: ['var(--font-editorial)', 'sans-serif'],
              nunito: ['Nunito', 'sans-serif'],
            },
            colors: {
              paper: {
                50: '#FAF8F5',
                100: '#F5F2EB',
                200: '#EAE5D9',
                DEFAULT: '#F7F4EE',
                surface: '#FFFEFA',
                border: '#E3DDD0',
              },
              ink: {
                50: '#F5F5F4',
                300: '#A8A6A1',
                muted: '#66645E',
                DEFAULT: '#1E1F1D',
                pure: '#111210',
              },
              wine: {
                DEFAULT: '#8E3038',
                light: '#A83B46',
                dark: '#6F252C',
              },
              gold: {
                DEFAULT: '#B8860B',
                light: '#D4AF37',
              },
              night: {
                DEFAULT: '#111210',
                bg: '#111210',
                surface: '#181916',
                card: '#20221E',
                border: '#2C2E29',
                text: '#EDE9DF',
                muted: '#96938B',
              }
            }
          }
        }
      };
      await loadScript(TAILWIND_CDN);
      if (window.tailwind?.refresh) {
        window.tailwind.refresh();
      }
      await Promise.all(PAGE_SCRIPTS.map(loadScript));
      if (!window.__HALM_BOOK_APP_INITIALIZED__) {
        const pageScript = document.createElement("script");
        pageScript.textContent = PAGE_SCRIPT;
        document.body.appendChild(pageScript);
        window.__HALM_BOOK_APP_INITIALIZED__ = true;
      }
    };

    initializePage().catch((error) => {
      console.error("Unable to initialize HALM BOOK page:", error);
    });
  }, []);

  // 1. State quản lý chat
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [books, setBooks] = useState([]);
  const [isBooksLoading, setIsBooksLoading] = useState(true);
  const [booksError, setBooksError] = useState("");
  const [pageNumber, setPageNumber] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const chatRequestRef = useRef(null);
  const chatRequestIdRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();

    const fetchBooks = async () => {
      try {
        setIsBooksLoading(true);
        setBooksError("");

        // Truyền pageNumber/page để BE lấy đúng dữ liệu theo trang
        const response = await axiosInstance.get("/api/home/books", {
          params: {
            pageNumber: 0,
            page: 0,
            pageSize: 50,
            size: 50,
          },
          signal: controller.signal,
        });
        const payload = response.data;

        // Bóc tách dữ liệu mảng sách từ Spring Data Page (payload.content) hoặc mảng thông thường
        const rawBooks = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.content)
            ? payload.content
            : Array.isArray(payload?.data)
              ? payload.data
              : Array.isArray(payload?.books)
                ? payload.books
                : [];

        if (payload?.totalPages !== undefined) {
          setTotalPages(payload.totalPages);
        }
        if (payload?.totalElements !== undefined) {
          setTotalElements(payload.totalElements);
        }

        // Chuẩn hóa trường dữ liệu đồng bộ giữa BookDto (BE) và Template (FE)
        const normalizedBooks = rawBooks.map((item, idx) => ({
          ...item,
          id: item.book_id || item.id || `book-${idx}`,
          title: item.bookName || item.title || "Tác phẩm",
          author: item.author || "HALM BOOK",
          img: item.img_url || item.img || "/logo.png",
          desc: item.description || item.desc || "",
          price: item.rent_price !== undefined ? item.rent_price : (item.price || 0),
          category_id: item.category_id,
          rating: item.rating || "5.0",
        }));

        setBooks(normalizedBooks);

        // Kích hoạt ngay hàm render đổ sách lên kệ nếu script DOM đã sẵn sàng
        if (typeof window.populateShelvesWithBooks === "function") {
          window.populateShelvesWithBooks(normalizedBooks);
        }
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error("Lỗi lấy danh sách sách trang chủ:", error);
        setBooksError(
          error.response?.data?.message ||
            error.message ||
            "Không thể tải danh sách sách.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsBooksLoading(false);
        }
      }
    };

    fetchBooks();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    window.__HALM_BOOKS__ = books;
    window.dispatchEvent(new CustomEvent("halm-books-loaded", {
      detail: books,
    }));
    if (typeof window.populateShelvesWithBooks === "function") {
      window.populateShelvesWithBooks(books);
    }
  }, [books]);

  useEffect(() => () => {
    chatRequestIdRef.current += 1;
    chatRequestRef.current?.abort();
  }, []);

  useEffect(() => {
    const handleThemeChange = (e) => {
      if (window.tailwind?.refresh) {
        window.tailwind.refresh();
      }
      if (e.detail?.isDark) {
        window.initStars?.();
      }
    };
    window.addEventListener("halm-theme-change", handleThemeChange);
    return () => window.removeEventListener("halm-theme-change", handleThemeChange);
  }, []);

  const handleSendMessage = async (text = inputText) => {
    const message = text.trim();
    if (!message || chatRequestRef.current) return;

    const requestId = ++chatRequestIdRef.current;
    const controller = new AbortController();
    chatRequestRef.current = controller;
    setMessages((previous) => [...previous, { sender: "user", text: message }]);
    setInputText("");
    setIsLoading(true);

   try {
      const currentToken = sessionStorage.getItem("token") || localStorage.getItem("token");
      
      // Khai báo cấu hình mặc định tường minh
      const config = {
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json"
        }
      };

      // 2. Chỉ gắn Header bảo mật khi thực sự cầm Token trong tay
      if (currentToken) {
        config.headers["Authorization"] = `Bearer ${currentToken}`;
      } else {
        console.warn("CẢNH BÁO: Không tìm thấy Token! Yêu cầu này chắc chắn sẽ bị Backend trả về 401.");
      }

      //
      const response = await axiosInstance.post(
        "/api/chat",
        { message: message },
        config
      );

      const reply = response.data?.reply;
      
      if (typeof reply !== "string" || !reply.trim()) {
        throw new Error("Chat API trả về dữ liệu không hợp lệ.");
      }

      if (requestId === chatRequestIdRef.current) {
        setMessages((previous) => [...previous, { sender: "bot", text: reply }]);
      }
      
    } catch (error) {
      if (controller.signal.aborted) return;
      
      const errorMessage = error.response?.status === 401
        ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
        : "Xin lỗi, hiện chưa thể kết nối với trợ lý. Vui lòng thử lại.";

      if (error.response?.status !== 401) {
          console.error("Lỗi gọi API Chat:", error);
      }

      if (requestId === chatRequestIdRef.current) {
        setMessages((previous) => [
          ...previous,
          { sender: "bot", text: errorMessage },
        ]);
      }
    } finally {
      if (requestId === chatRequestIdRef.current) {
        chatRequestRef.current = null;
        setIsLoading(false);
      }
    }
  };

  const handleClearChat = () => {
    chatRequestIdRef.current += 1;
    chatRequestRef.current?.abort();
    chatRequestRef.current = null;
    setIsLoading(false);
    setMessages([]);
    setInputText("");
  };

  const openChatbot = (prefillMessage) => {
    setIsOpen(true);
    if (prefillMessage) handleSendMessage(prefillMessage);
  };
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Nunito:wght@400;600;700;800;900&family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600&family=Roboto:wght@300;400;500;700;900&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      <style>{PAGE_STYLES}</style>
      <UserLayout className="selection:bg-wine selection:text-white" onOpenChatbot={openChatbot}>


        {/* Subtle Vignette Flash Cue during Chapter Flipping */}
        <div id="chapter-flip-cue" aria-hidden="true"></div>

        {/* Starry background in Dark Mode */}
        <div id="starry-background"></div>

        {/* ======================================================= */}
        {/* 1. PHẦN HEADER (THANH ĐIỀU HƯỚNG) - HALMBOOK EDITORIAL  */}
        {/* ======================================================= */}
        <main className="flex-grow pt-0">
          {isBooksLoading && (
            <div className="sr-only" role="status" aria-live="polite">
              Đang tải danh sách sách...
            </div>
          )}
          {booksError && (
            <div className="sr-only" role="alert">
              {booksError}
            </div>
          )}

          <section id="chapter-0-broadcast" className="chapter-ambient-wrapper ambient-glow-a bg-paper dark:bg-night-bg transition-colors">
            <div id="hero-broadcast" className="hero-broadcast pt-[76px]">
              <div className="hero-broadcast-viewport">
                {[
                  {
                    eyebrow: "HALM BOOK · KHÔNG GIAN ĐỌC SÁCH",
                    title: "Mở ra thế giới mới",
                    description: "Khám phá những cuốn sách truyền cảm hứng, mở rộng tri thức và tìm thấy hành trình đọc dành riêng cho bạn.",
                    action: "Khám phá thư viện",
                    actionLink: "#trending-section",
                    icon: "ph-books",
                    books: [
                      { title: "Văn học", subtitle: "NHỮNG CÂU CHUYỆN ĐỂ ĐỜI", color: "linear-gradient(145deg,#6e2530,#b75c42)" },
                      { title: "Tri thức", subtitle: "MỞ RỘNG TẦM NHÌN", color: "linear-gradient(145deg,#1f4051,#6f9b93)" },
                      { title: "Phát triển", subtitle: "MỖI NGÀY TỐT HƠN", color: "linear-gradient(145deg,#946525,#dfb95f)" },
                    ],
                  },
                  {
                    eyebrow: "TUYỂN CHỌN DÀNH CHO BẠN",
                    title: "Một cuốn sách, ngàn cảm hứng",
                    description: "Từ văn học, thiếu nhi đến khoa học và phát triển bản thân — bắt đầu với chủ đề khiến bạn tò mò nhất.",
                    action: "Tìm sách yêu thích",
                    actionLink: "#trending-section",
                    icon: "ph-sparkle",
                    books: [
                      { title: "Tuổi thơ", subtitle: "NUÔI DƯỠNG TRÍ TƯỞNG TƯỢNG", color: "linear-gradient(145deg,#315b54,#7fac82)" },
                      { title: "Khám phá", subtitle: "CHẠM ĐẾN CHÂN TRỜI MỚI", color: "linear-gradient(145deg,#344b77,#8293c1)" },
                      { title: "Sáng tạo", subtitle: "Ý TƯỞNG BẮT ĐẦU TỪ ĐÂY", color: "linear-gradient(145deg,#783d67,#c17ca2)" },
                    ],
                  },
                  {
                    eyebrow: "ĐỒNG HÀNH CÙNG TRỢ LÝ AI",
                    title: "Tìm đúng cuốn sách cho bạn",
                    description: "Chia sẻ điều bạn quan tâm, trợ lý HALM BOOK sẽ cùng bạn khám phá những lựa chọn phù hợp.",
                    action: "Trò chuyện cùng AI",
                    actionLink: "#",
                    icon: "ph-chat-circle-dots",
                    books: [
                      { title: "Gợi ý", subtitle: "ĐÚNG GU · ĐÚNG CHỦ ĐỀ", color: "linear-gradient(145deg,#57376e,#987ab6)" },
                      { title: "Khám phá", subtitle: "ĐỌC THEO CÁCH CỦA BẠN", color: "linear-gradient(145deg,#83412f,#d08b60)" },
                      { title: "Bắt đầu", subtitle: "HÀNH TRÌNH ĐỌC MỚI", color: "linear-gradient(145deg,#305762,#70a6a1)" },
                    ],
                  },
                  {
                    eyebrow: "HỘI VIÊN & ĐẶC QUYỀN VIP",
                    title: "Nâng tầm trải nghiệm đọc",
                    description: "Tích lũy Khoai Tây mỗi ngày, mở khóa kho sách độc bản, mượn sách không giới hạn và thăng hạng thành viên danh giá.",
                    action: "Khám phá đặc quyền",
                    actionLink: "/hang",
                    icon: "ph-crown",
                    books: [
                      { title: "Khoai Tây", subtitle: "TÍCH ĐIỂM ĐỔI QUÀ", color: "linear-gradient(145deg,#946525,#d4af37)" },
                      { title: "Cấp Bậc", subtitle: "LỘ TRÌNH 5 HẠNG", color: "linear-gradient(145deg,#8e3038,#c15c5c)" },
                      { title: "Đặc Quyền", subtitle: "ƯU ĐÃI KHÔNG GIỚI HẠN", color: "linear-gradient(145deg,#1f4e38,#529a6e)" },
                    ],
                  },
                  {
                    eyebrow: "TỦ SÁCH CÁ NHÂN & GIA HẠN",
                    title: "Không gian đọc của riêng bạn",
                    description: "Theo dõi tiến độ đọc, lưu giữ trích dẫn sâu sắc, quản lý thời hạn thuê sách và gia hạn tiện lợi ngay trong tầm tay.",
                    action: "Vào tủ sách của tôi",
                    actionLink: "/tusachcn",
                    icon: "ph-book-bookmark",
                    books: [
                      { title: "Đang đọc", subtitle: "TIẾP TỤC HÀNH TRÌNH", color: "linear-gradient(145deg,#1f4051,#4a90e2)" },
                      { title: "Gia hạn", subtitle: "LINH HOẠT VỚI KHOAI", color: "linear-gradient(145deg,#5e2a84,#9b51e0)" },
                      { title: "Trích dẫn", subtitle: "LƯU TRỮ TRÍ TUỆ", color: "linear-gradient(145deg,#844722,#e67e22)" },
                    ],
                  },
                ].map((slide, index) => (
                  <article key={slide.title} className={`hero-broadcast-slide ${index === 0 ? "is-active" : ""}`}>
                    <div className="relative z-10 space-y-5 text-center lg:text-left">
                      <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 font-metadata-spec text-[10px] font-bold tracking-[0.2em] text-wine dark:text-gold">
                        <i className={`ph-bold ${slide.icon}`}></i>{slide.eyebrow}
                      </span>
                      <div>
                        <h1 className="font-display-hero text-3xl font-black leading-tight text-ink dark:text-night-text sm:text-4xl lg:text-6xl">
                          {slide.title}
                          <span className="mt-1 block text-wine dark:text-gold">Cùng HALM BOOK</span>
                        </h1>
                        <p className="font-editorial-body mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-ink-muted dark:text-night-muted sm:text-base lg:mx-0 lg:text-lg">
                          {slide.description}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                        {slide.icon === "ph-chat-circle-dots" ? (
                          <button type="button" onClick={() => openChatbot("Tôi muốn được gợi ý sách phù hợp với sở thích.")} className="rounded-full bg-wine px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md transition hover:-translate-y-0.5 hover:bg-wine-dark">
                            {slide.action}<i className="ph-bold ph-arrow-up-right ml-2"></i>
                          </button>
                        ) : (
                          <a href={slide.actionLink} className="rounded-full bg-wine px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md transition hover:-translate-y-0.5 hover:bg-wine-dark">
                            {slide.action}<i className="ph-bold ph-arrow-right ml-2"></i>
                          </a>
                        )}
                        <span className="font-metadata-spec text-xs font-semibold text-ink-muted dark:text-night-muted">
                          <i className="ph-fill ph-star mr-1 text-gold"></i>Đọc theo cách của riêng bạn
                        </span>
                      </div>
                    </div>
                    <div className="hero-broadcast-books relative z-10" aria-label="Các chủ đề sách nổi bật">
                      {slide.books.map((book, bookIndex) => (
                        <a
                          key={book.title}
                          href={slide.actionLink}
                          className="hero-broadcast-book-card flex flex-col items-center justify-center p-2.5 text-center text-white"
                          style={{ background: book.color }}
                          aria-label={`Khám phá sách chủ đề ${book.title}`}
                        >
                          <span className="card-badge">{bookIndex === 0 ? "Nổi bật" : "Khám phá"}</span>
                          <i className={`ph-bold ${slide.icon} mb-2 text-3xl text-[#F5D77F] sm:text-4xl`}></i>
                          <span className="font-display text-sm font-black leading-tight sm:text-base">{book.title}</span>
                          <span className="mt-2 text-[7px] font-bold leading-tight tracking-[0.12em] text-white/75 sm:text-[8px]">{book.subtitle}</span>
                        </a>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
              <div className="hero-broadcast-controls">
                <button type="button" data-broadcast-prev aria-label="Banner trước"><i className="ph-bold ph-caret-left"></i></button>
                <div className="flex items-center gap-4">
                  <div className="hero-broadcast-dots" aria-label="Chọn banner"></div>
                  <span className="hidden font-metadata-spec text-[10px] font-bold tracking-[0.18em] text-ink-muted dark:text-night-muted sm:inline">HALM BOOK · ĐỌC & KHÁM PHÁ</span>
                </div>
                <button type="button" data-broadcast-next aria-label="Banner tiếp theo"><i className="ph-bold ph-caret-right"></i></button>
              </div>
            </div>
          </section>

          {/* ========================================================
             CHƯƠNG 02 — FULL-VIEWPORT CINEMATIC BOOK REVEAL
             Theme: “Không chỉ là đọc sách. Là mở ra một thế giới mới.”
             Visual Hook: FULL-VIEWPORT BOOK CONVERGENCE & SPREAD
             ======================================================== */}
          <section id="about-section" className="chapter-ambient-wrapper ambient-glow-b chapter-divider pt-6 pb-8 lg:pt-8 lg:pb-10 relative bg-paper dark:bg-night-bg overflow-x-clip transition-colors">

            <br />
            {/* Chapter Header (Centered, elegant) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mb-6 sm:mb-8">
              <div className="flex items-center justify-center gap-3">
                <span className="px-3.5 py-1.5 rounded-full bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold font-metadata-spec font-bold text-xs tracking-[0.25em] uppercase">
                  KHAI MỞ KHÔNG GIAN ĐỌC
                </span>
              </div>
            </div>

            {/* FULL-VIEWPORT 3D BOOK STAGE */}
            <div className="ch2-viewport-scene flex items-center justify-center px-0 sm:px-4">
              <div id="about-converge-stage" className="ch2-book-assembly-spread">

                {/* Center Spine Hinge */}
                <div id="ch2-spine-hinge" className="ch2-spine-hinge hidden md:block"></div>

                {/* Two Wings Assembly Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-0 relative z-10 items-stretch">

                  {/* Left Wing: Deep Cobalt Editorial Hardcover (Enters from viewport-left) */}
                  <div id="about-half-left" className="ch2-wing ch2-wing-left p-8 sm:p-12 lg:p-14 flex flex-col justify-between relative overflow-hidden">
                    {/* Subtle Book Cloth Texture Overlay */}
                    <div className="absolute inset-0 opacity-15 pointer-events-none paper-grain"></div>

                    <div className="relative z-10 space-y-6">
                      {/* Chapter Badge */}
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/40 bg-gold/10 text-gold font-metadata-spec text-[11px] font-bold uppercase tracking-widest">
                        <i className="ph-bold ph-book-open"></i>
                        <span>KHÁM PHÁ TRI THỨC</span>
                      </div>

                      {/* Main Headline */}
                      <h2 className="font-display-hero text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-white leading-[1.15] tracking-tight">
                        Không chỉ là đọc sách.<br />
                        <span
                          className="block text-[#F5D77F]"
                          style={{ textWrap: "balance", textShadow: "0 2px 12px rgba(0, 0, 0, 0.45)" }}
                        >
                          Là mở ra một thế giới mới.
                        </span>
                      </h2>

                      {/* Editorial Paragraph */}
                      <p className="font-editorial-body text-sm sm:text-base text-white/85 leading-relaxed max-w-lg">
                        HALM BOOK mang đến không gian đọc sách trực tuyến cao cấp, giúp bạn tiếp cận tri thức tuyển chọn, tìm kiếm những đầu sách phù hợp và đồng hành cùng trợ lý AI thông minh trong suốt hành trình đọc.
                      </p>

                      {/* Quote Plaque */}
                      <div className="pt-2">
                        <blockquote className="border-l-2 border-gold/70 pl-4 py-1 text-xs sm:text-sm text-white/75 font-editorial-body italic">
                          “Mỗi cuốn sách là một con tàu đưa ta vượt qua đại dương tri thức mà không cần rời khỏi bàn đọc.”
                        </blockquote>
                      </div>
                    </div>

                    {/* Footer Spec Bar */}
                    <div className="relative z-10 pt-8 mt-6 border-t border-white/15 flex items-center justify-between text-xs font-metadata-spec text-white/60">
                      <span>HALM EDITORIAL • 2026</span>
                      <span className="text-gold font-bold">TRANG 02</span>
                    </div>
                  </div>

                  {/* Right Wing: Editorial Reading Experience (Enters from viewport-right) */}
                  <div id="about-half-right" className="ch2-wing ch2-wing-right p-8 sm:p-12 lg:p-14 flex flex-col justify-between relative overflow-hidden">
                    <div className="relative z-10 space-y-6">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-wine/30 dark:border-gold/30 bg-wine/5 dark:bg-gold/10 text-wine dark:text-gold font-metadata-spec text-[11px] font-bold uppercase tracking-widest">
                        <i className="ph-bold ph-sparkle"></i>
                        <span>TRẢI NGHIỆM ĐỒNG HÀNH</span>
                      </div>

                      {/* Editorial Imagery Window */}
                      <div className="relative rounded-2xl overflow-hidden aspect-[16/10] shadow-xl border border-paper-border dark:border-night-border bg-night-card">
                        <img src="https://images.unsplash.com/photo-1507842229451-7f01be7fe7ab?q=80&w=800&auto=format&fit=crop" alt="Trải nghiệm đọc HALM BOOK" className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" onError={(event) => applyImageFallback(event, '/logo.png')} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"></div>
                        <div className="absolute bottom-4 inset-x-5 text-white">
                          <span className="font-metadata-spec text-[10px] tracking-widest uppercase font-bold text-gold">KHÔNG GIAN TĨNH LẶNG</span>
                          <h4 className="font-display font-bold text-base sm:text-lg">Nuôi dưỡng tình yêu văn hóa đọc</h4>
                        </div>
                      </div>

                      {/* Supporting Body Copy */}
                      <p className="font-editorial-body text-xs sm:text-sm text-ink-muted dark:text-night-muted leading-relaxed">
                        Từ những trang sách đầu tiên đến các chủ đề chuyên sâu, mỗi trải nghiệm đều hướng đến sự thuận tiện, trực quan và cảm hứng đọc bền bỉ trên mọi thiết bị.
                      </p>
                    </div>

                    {/* Footer Spec Bar */}
                    <div className="relative z-10 pt-8 mt-6 border-t border-paper-border/60 dark:border-night-border/60 flex items-center justify-between text-xs font-metadata-spec text-ink-muted dark:text-night-muted">
                      <span className="font-bold text-wine dark:text-gold">HALM BOOK PLATFORM</span>
                      <span>TRANG 03</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </section>


          {/* ========================================================
             SECTION 04 — SÁCH THỊNH HÀNH
             Theme: “Những cuốn sách đang được quan tâm.”
             Visual Hook: GIANT BOOKSHELF ASSEMBLY (Hội tụ kệ sách từ hai bên)
             ======================================================== */}
          <section id="trending-section" className="chapter-ambient-wrapper ambient-glow-a chapter-divider pt-8 pb-6 lg:pt-10 lg:pb-7 bg-paper dark:bg-night-bg transition-colors overflow-hidden">
            <div className="ch4-page-stage">
              <div id="ch4-page-leaf" className="ch4-page-leaf">
                <div className="w-[96%] max-w-[96vw] mx-auto relative z-10">

                  <div id="trending-header" className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
                    <div>
                      <span className="font-metadata-spec text-xs sm:text-sm font-extrabold tracking-[0.28em] text-wine dark:text-gold uppercase block mb-1">
                        SÁCH THỊNH HÀNH
                      </span>
                      <h2 className="font-display-hero text-2xl sm:text-3xl lg:text-4xl font-black text-ink dark:text-night-text leading-tight">
                        NHỮNG CUỐN SÁCH ĐANG ĐƯỢC QUAN TÂM
                      </h2>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={(event) => { window.scrollShelfByCard('trending-shelf', -1) }} className="w-9 h-9 rounded-full border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-card flex items-center justify-center text-ink dark:text-night-text transition-colors" aria-label="Cuộn lùi 1 sách" title="Lùi 1 sách">
                        <i className="ph-bold ph-caret-left"></i>
                      </button>
                      <button onClick={(event) => { window.scrollShelfByCard('trending-shelf', 1) }} className="w-9 h-9 rounded-full border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-card flex items-center justify-center text-ink dark:text-night-text transition-colors" aria-label="Cuộn tiến 1 sách" title="Tiến 1 sách">
                        <i className="ph-bold ph-caret-right"></i>
                      </button>
                    </div>
                  </div>

                  <nav id="trending-cat-nav" className="flex items-center gap-2.5 overflow-x-auto pb-1 mb-6" aria-label="Danh mục sách thịnh hành">
                    <button type="button" className="trending-cat-btn is-active shrink-0 px-4 py-2 rounded-full border border-paper-border dark:border-night-border bg-paper dark:bg-night-card text-xs font-metadata-spec font-semibold text-ink dark:text-night-text transition-colors" data-cat="all">Tất cả</button>
                    <button type="button" className="trending-cat-btn shrink-0 px-4 py-2 rounded-full border border-paper-border dark:border-night-border bg-paper dark:bg-night-card text-xs font-metadata-spec font-semibold text-ink dark:text-night-text transition-colors" data-cat="van-hoc">Văn học</button>
                    <button type="button" className="trending-cat-btn shrink-0 px-4 py-2 rounded-full border border-paper-border dark:border-night-border bg-paper dark:bg-night-card text-xs font-metadata-spec font-semibold text-ink dark:text-night-text transition-colors" data-cat="thieu-nhi">Thiếu nhi</button>
                    <button type="button" className="trending-cat-btn shrink-0 px-4 py-2 rounded-full border border-paper-border dark:border-night-border bg-paper dark:bg-night-card text-xs font-metadata-spec font-semibold text-ink dark:text-night-text transition-colors" data-cat="ky-nang">Kỹ năng</button>
                    <button type="button" className="trending-cat-btn shrink-0 px-4 py-2 rounded-full border border-paper-border dark:border-night-border bg-paper dark:bg-night-card text-xs font-metadata-spec font-semibold text-ink dark:text-night-text transition-colors" data-cat="kinh-dien">Kinh điển</button>
                  </nav>

                  {/* Spotlight + Horizontal Shelf Combo */}
                  <div id="trending-shelf-combo" className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch mb-2">

                    {/* TODO(API): Populate this shelf from the database-backed trending-books endpoint. */}
                    <div className="lg:col-span-12 relative min-w-0 flex items-center">
                      <div id="trending-shelf" className="shelf-scroll-row flex gap-4 sm:gap-5 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth w-full">
                        {/* Populated by JS */}
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            </div>
          </section>


          {/* ========================================================
             SECTION 05 — SÁCH THIẾU NHI
             Theme: “Nuôi dưỡng trí tưởng tượng từ những trang đầu tiên.”
             Visual Hook: PAGE UNFOLDING (Trang sách mở tỏa ra hai bên)
             ======================================================== */}
          <section id="children-section" className="chapter-ambient-wrapper ambient-glow-b chapter-divider pt-8 pb-6 lg:pt-10 lg:pb-7 bg-paper dark:bg-night-bg transition-colors overflow-hidden">
            <div className="ch4-page-stage">
              <div id="ch5-page-leaf" className="ch4-page-leaf">
                <div className="w-[96%] max-w-[96vw] mx-auto">

                  <div id="children-header" className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start mb-6">
                    <div className="lg:col-span-8 space-y-2 sm:space-y-2.5">
                      <span className="font-metadata-spec text-xs sm:text-sm font-extrabold tracking-[0.28em] text-wine dark:text-gold uppercase block">
                        THẾ GIỚI TUỔI THƠ
                      </span>
                      <h2 className="font-display-hero text-2xl sm:text-3xl lg:text-4xl font-black text-ink dark:text-night-text leading-tight">
                        NUÔI DƯỠNG TRÍ TƯỞNG TƯỢNG TỪ TRANG ĐẦU TIÊN
                      </h2>
                      <p className="font-metadata-spec text-xs sm:text-sm font-bold uppercase tracking-wider text-wine dark:text-gold pt-0.5">
                        NHỮNG CÂU CHUYỆN NHỎ — MỞ RA NHỮNG CHÂN TRỜI LỚN
                      </p>
                    </div>

                    <div className="lg:col-span-4 flex flex-col justify-between">
                      <div className="p-5 rounded-xl border-l-4 border-wine dark:border-gold bg-paper dark:bg-night-card font-editorial-body italic text-sm text-ink-muted dark:text-night-muted shadow-sm">
                        “Mỗi trang sách tuổi thơ là một chiếc chìa khóa diệu kỳ gieo vào tâm hồn con trẻ hạt mầm của lòng dũng cảm, sự thấu cảm và ước mơ không giới hạn.”
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-3">
                        <button onClick={(event) => { window.scrollShelfByCard('children-shelf', -1) }} className="w-9 h-9 rounded-full border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-card flex items-center justify-center text-ink dark:text-night-text transition-colors" aria-label="Cuộn lùi 1 sách" title="Lùi 1 sách">
                          <i className="ph-bold ph-caret-left"></i>
                        </button>
                        <button onClick={(event) => { window.scrollShelfByCard('children-shelf', 1) }} className="w-9 h-9 rounded-full border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-card flex items-center justify-center text-ink dark:text-night-text transition-colors" aria-label="Cuộn tiến 1 sách" title="Tiến 1 sách">
                          <i className="ph-bold ph-caret-right"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Children's Shelf Horizontal Row */}
                  <div id="children-shelf" className="shelf-scroll-row flex gap-5 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth">
                    {/* Populated by JS */}
                  </div>

                </div>
              </div>
            </div>
          </section>


          {/* ========================================================
             SECTION 03 — GIÁ TRỊ CỐT LÕI
             Theme: “Một không gian đọc. Nhiều cách khám phá.”
             Visual Hook: THREE WORLDS ASSEMBLE (3 khối tiến vào từ 3 hướng)
             ======================================================== */}
          <section id="values-section" className="chapter-ambient-wrapper ambient-glow-a chapter-divider pt-6 pb-6 lg:pt-7 lg:pb-7 bg-paper dark:bg-night-bg transition-colors overflow-hidden">
            <div className="ch3-page-stage">
              <div id="ch3-page-leaf" className="ch3-page-leaf">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                  <div className="text-center max-w-3xl mx-auto mb-8 lg:mb-10 space-y-3">
                    <span className="font-metadata-spec text-xs font-bold tracking-[0.25em] text-wine dark:text-gold uppercase">
                      GIÁ TRỊ CỐT LÕI
                    </span>
                    <h2 className="font-display-hero text-3xl sm:text-4xl lg:text-5xl font-black text-ink dark:text-night-text">
                      MỘT KHÔNG GIAN ĐỌC.<br />
                      <span className="text-wine dark:text-gold">NHIỀU CÁCH KHÁM PHÁ.</span>
                    </h2>
                    <p className="font-editorial-body text-base sm:text-lg text-ink-muted dark:text-night-muted">
                      Ba trụ cột trải nghiệm hợp nhất thành một tổng thể liền mạch giúp bạn khai phóng sức mạnh tri thức.
                    </p>
                  </div>

                  {/* THREE WORLDS ASSEMBLE GRID */}
                  <div id="values-assemble-grid" className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* World 01: Enters from Left */}
                    <div id="val-world-1" className="p-8 rounded-2xl bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border shadow-sm hover:-translate-y-2 transition-all duration-500 group flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-metadata-spec text-3xl font-black text-wine dark:text-gold transition-colors">01</span>
                          <div className="w-12 h-12 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i className="ph-bold ph-books text-2xl"></i>
                          </div>
                        </div>
                        <h3 className="font-display font-black text-xl text-ink dark:text-night-text">Khám phá dễ dàng</h3>
                        <p className="font-editorial-body text-sm text-ink-muted dark:text-night-muted leading-relaxed">
                          Tìm kiếm và khám phá sách theo danh mục, chủ đề và những lựa chọn phù hợp với nhu cầu đọc của từng cá nhân.
                        </p>
                      </div>
                      <div className="pt-6 border-t border-paper-border/60 dark:border-night-border/60 mt-6 flex items-center text-xs font-bold text-wine dark:text-gold">
                        <span>Tìm kiếm & Bộ lọc</span>
                        <i className="ph-bold ph-arrow-right ml-1 group-hover:translate-x-1 transition-transform"></i>
                      </div>
                    </div>

                    {/* World 02: Enters from Top/Back */}
                    <div id="val-world-2" className="p-8 rounded-2xl bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border shadow-sm hover:-translate-y-2 transition-all duration-500 group flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-metadata-spec text-3xl font-black text-wine dark:text-gold transition-colors">02</span>
                          <div className="w-12 h-12 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i className="ph-bold ph-eye text-2xl"></i>
                          </div>
                        </div>
                        <h3 className="font-display font-black text-xl text-ink dark:text-night-text">Đọc theo cách của bạn</h3>
                        <p className="font-editorial-body text-sm text-ink-muted dark:text-night-muted leading-relaxed">
                          Tiếp cận nội dung sách và theo dõi hành trình đọc trong phạm vi các tính năng mà hệ thống hỗ trợ.
                        </p>
                      </div>
                      <div className="pt-6 border-t border-paper-border/60 dark:border-night-border/60 mt-6 flex items-center text-xs font-bold text-wine dark:text-gold">
                        <span>Theo dõi & Lưu trữ</span>
                        <i className="ph-bold ph-arrow-right ml-1 group-hover:translate-x-1 transition-transform"></i>
                      </div>
                    </div>

                    {/* World 03: Enters from Right */}
                    <div id="val-world-3" className="p-8 rounded-2xl bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border shadow-sm hover:-translate-y-2 transition-all duration-500 group flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-metadata-spec text-3xl font-black text-wine dark:text-gold transition-colors">03</span>
                          <div className="w-12 h-12 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i className="ph-bold ph-sparkle text-2xl"></i>
                          </div>
                        </div>
                        <h3 className="font-display font-black text-xl text-ink dark:text-night-text">Đồng hành cùng AI</h3>
                        <p className="font-editorial-body text-sm text-ink-muted dark:text-night-muted leading-relaxed">
                          Sử dụng chatbot AI để hỗ trợ khám phá thông tin và trao đổi về nội dung sách theo khả năng thực tế của hệ thống.
                        </p>
                      </div>
                      <div className="pt-6 border-t border-paper-border/60 dark:border-night-border/60 mt-6 flex items-center text-xs font-bold text-wine dark:text-gold">
                        <span>Trợ lý thông minh</span>
                        <i className="ph-bold ph-arrow-right ml-1 group-hover:translate-x-1 transition-transform"></i>
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            </div>
          </section>


          {/* ========================================================
             SECTION 06 — VĂN HỌC VÀ TIỂU THUYẾT
             Theme: “Bước vào những thế giới chưa từng biết.”
             Visual Hook: CINEMATIC DEPTH SHIFT (Chuyển động đa tầng chiều sâu)
             ======================================================== */}
          <section id="literature-section" className="chapter-ambient-wrapper ambient-glow-b chapter-divider pt-8 pb-6 lg:pt-10 lg:pb-7 bg-paper dark:bg-night-bg transition-colors overflow-hidden">
            <div className="ch3-page-stage">
              <div id="ch6-page-leaf" className="ch3-page-leaf">
                <div className="w-[96%] max-w-[96vw] mx-auto">

                  <div id="literature-header" className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start mb-6">
                    <div className="lg:col-span-8 space-y-2 sm:space-y-2.5">
                      <span className="font-metadata-spec text-xs sm:text-sm font-extrabold tracking-[0.28em] text-wine dark:text-gold uppercase block">
                        VĂN HỌC & TIỂU THUYẾT
                      </span>
                      <h2 className="font-display-hero text-2xl sm:text-3xl lg:text-4xl font-black text-ink dark:text-night-text leading-tight">
                        BƯỚC VÀO NHỮNG THẾ GIỚI CHƯA TỪNG BIẾT
                      </h2>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-semibold">
                        <span className="px-3.5 py-1.5 rounded-full bg-paper-200 dark:bg-night-card text-ink dark:text-night-text border border-paper-border dark:border-night-border font-metadata-spec">Tiểu Thuyết Kinh Điển &amp; Đương Đại</span>
                        <span className="px-3.5 py-1.5 rounded-full bg-paper-200 dark:bg-night-card text-ink dark:text-night-text border border-paper-border dark:border-night-border font-metadata-spec">Truyện Ngắn, Thơ &amp; Tản Văn Tuyển Chọn</span>
                      </div>
                    </div>

                    <div className="lg:col-span-4 flex flex-col justify-between">
                      <div className="p-5 rounded-xl border-l-4 border-wine dark:border-gold bg-paper dark:bg-night-card font-editorial-body italic text-sm text-ink-muted dark:text-night-muted shadow-sm">
                        “Đôi khi, một cuốn sách không mang đến câu trả lời. Nó giúp chúng ta đặt ra những câu hỏi tốt hơn và thấu cảm sâu sắc hơn với từng phận đời.”
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-3">
                        <button onClick={(event) => { window.scrollShelfByCard('literature-shelf', -1) }} className="w-9 h-9 rounded-full border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-card flex items-center justify-center text-ink dark:text-night-text transition-colors" aria-label="Cuộn lùi 1 sách" title="Lùi 1 sách">
                          <i className="ph-bold ph-caret-left"></i>
                        </button>
                        <button onClick={(event) => { window.scrollShelfByCard('literature-shelf', 1) }} className="w-9 h-9 rounded-full border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-card flex items-center justify-center text-ink dark:text-night-text transition-colors" aria-label="Cuộn tiến 1 sách" title="Tiến 1 sách">
                          <i className="ph-bold ph-caret-right"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Literature Horizontal Shelf */}
                  <div id="literature-shelf" className="shelf-scroll-row flex gap-5 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth">
                    {/* Populated by JS */}
                  </div>

                </div>
              </div>
            </div>
          </section>


          {/* ========================================================
             SECTION 07 — PHÁT TRIỂN BẢN THÂN, KỸ NĂNG VÀ KINH DOANH
             Theme: “Đọc để hiểu hơn. Học để tiến xa hơn.”
             Visual Hook: TYPOGRAPHY EXPANSION ("GROW" phóng to làm mask)
             ======================================================== */}
          <section id="selfgrowth-section" className="chapter-ambient-wrapper ambient-glow-a chapter-divider pt-8 pb-6 lg:pt-10 lg:pb-7 bg-paper dark:bg-night-bg transition-colors relative overflow-hidden">
            <div className="ch4-page-stage">
              <div id="ch7-page-leaf" className="ch4-page-leaf">
                {/* Giant Outline Typography "GROW" in background as structural mask */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
                  <span className="font-display font-black text-[18vw] text-paper-200 dark:text-night-border/40 tracking-tighter opacity-70 leading-none">
                    GROW
                  </span>
                </div>

                <div className="w-[96%] max-w-[96vw] mx-auto relative z-10">

                  <div id="selfgrowth-header" className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start mb-6">
                    <div className="lg:col-span-8 space-y-2 sm:space-y-2.5">
                      <span className="font-metadata-spec text-xs sm:text-sm font-extrabold tracking-[0.28em] text-wine dark:text-gold uppercase block">
                        KỸ NĂNG & PHÁT TRIỂN
                      </span>
                      <h2 className="font-display-hero text-2xl sm:text-3xl lg:text-4xl font-black text-ink dark:text-night-text leading-tight">
                        ĐỌC ĐỂ HIỂU HƠN. HỌC ĐỂ TIẾN XA HƠN.
                      </h2>

                      {/* Filter category pills: Chia 2-trong-1 gọn gàng thay vì 4 cái rời rạc */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-semibold">
                        <span className="px-3.5 py-1.5 rounded-full bg-paper-200 dark:bg-night-card text-ink dark:text-night-text border border-paper-border dark:border-night-border font-metadata-spec hover:border-wine dark:hover:border-gold transition-colors">Tư Duy & Kỹ Năng Giao Tiếp</span>
                        <span className="px-3.5 py-1.5 rounded-full bg-paper-200 dark:bg-night-card text-ink dark:text-night-text border border-paper-border dark:border-night-border font-metadata-spec hover:border-wine dark:hover:border-gold transition-colors">Kinh Doanh, Quản Trị & Tài Chính</span>
                      </div>
                    </div>

                    {/* Editorial Quote Box & Nav Controls */}
                    <div className="lg:col-span-4 flex flex-col justify-between">
                      <div className="p-5 rounded-xl border-l-4 border-wine dark:border-gold bg-paper dark:bg-night-card font-editorial-body italic text-sm text-ink-muted dark:text-night-muted shadow-sm">
                        “Tri thức chỉ thực sự tạo nên bước ngoặt khi được soi sáng qua tư duy phản biện và chuyển hóa thành thói quen hành động kỷ luật mỗi ngày.”
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-3">
                        <button onClick={(event) => { window.scrollShelfByCard('selfgrowth-shelf', -1) }} className="w-9 h-9 rounded-full border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-card flex items-center justify-center text-ink dark:text-night-text transition-colors" aria-label="Cuộn lùi 1 sách" title="Lùi 1 sách">
                          <i className="ph-bold ph-caret-left"></i>
                        </button>
                        <button onClick={(event) => { window.scrollShelfByCard('selfgrowth-shelf', 1) }} className="w-9 h-9 rounded-full border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-card flex items-center justify-center text-ink dark:text-night-text transition-colors" aria-label="Cuộn tiến 1 sách" title="Tiến 1 sách">
                          <i className="ph-bold ph-caret-right"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Self-Growth Horizontal Shelf: 1 hàng ngang duy nhất hiển thị đúng 6 sách */}
                  <div id="selfgrowth-shelf" className="shelf-scroll-row flex gap-5 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth">
                    {/* Populated by JS */}
                  </div>

                </div>
              </div>
            </div>
          </section>



          {/* ========================================================
             BREAKER 02 — KHÔNG GIAN ĐỘC BẢN & CỘNG ĐỒNG ĐỌC
             Theme: “Nơi văn hóa đọc trở thành phong cách sống.”
             Visual Hook: THREE LIVING PILLARS
             ======================================================== */}
          <section id="reading-space-section" className="chapter-ambient-wrapper ambient-glow-b chapter-divider pt-6 pb-6 lg:pt-7 lg:pb-7 bg-paper dark:bg-night-bg transition-colors overflow-hidden">
            <div className="ch3-page-stage">
              <div id="ch-space-page-leaf" className="ch3-page-leaf">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                  <div className="text-center max-w-3xl mx-auto mb-8 lg:mb-10 space-y-3">
                    <span id="space-header-label" className="font-metadata-spec text-xs font-bold tracking-[0.25em] text-wine dark:text-gold uppercase block">
                      KHÔNG GIAN ĐỘC BẢN & CỘNG ĐỒNG
                    </span>
                    <h2 id="space-header-title" className="font-display-hero text-3xl sm:text-4xl lg:text-5xl font-black text-ink dark:text-night-text">
                      PHONG CÁCH SỐNG.<br />
                      <span className="text-wine dark:text-gold">KẾT NỐI ĐỒNG ĐIỆU.</span>
                    </h2>
                    <div id="space-header-divider" className="w-16 h-0.5 mx-auto bg-wine/30 dark:bg-gold/40 my-3 rounded-full origin-center"></div>
                    <p id="space-header-desc" className="font-editorial-body text-base sm:text-lg text-ink-muted dark:text-night-muted">
                      Nuôi dưỡng trải nghiệm đọc tinh tế trong từng khoảnh khắc tĩnh lặng và sẻ chia.
                    </p>
                  </div>

                  <div id="space-grid" className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Pillar 01 */}
                    <div id="space-card-1" className="breaker-card p-8 rounded-2xl bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border shadow-sm hover:-translate-y-2 hover:shadow-lg transition-all duration-500 group flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-metadata-spec text-3xl font-black text-wine dark:text-gold transition-colors">01</span>
                          <div className="w-12 h-12 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i className="ph-bold ph-coffee text-2xl"></i>
                          </div>
                        </div>
                        <h3 className="font-display font-black text-xl text-ink dark:text-night-text">Góc Đọc Thư Thái</h3>
                        <p className="font-editorial-body text-sm text-ink-muted dark:text-night-muted leading-relaxed">
                          Tối ưu hóa phông chữ, chế độ đọc ban đêm dịu mắt cùng âm thanh tĩnh lặng giúp bạn hoàn toàn hòa mình vào từng trang sách.
                        </p>
                      </div>
                      <div className="pt-6 border-t border-paper-border/60 dark:border-night-border/60 mt-6 flex items-center text-xs font-bold text-wine dark:text-gold">
                        <span>Không gian tập trung</span>
                        <i className="ph-bold ph-arrow-right ml-1 group-hover:translate-x-1 transition-transform"></i>
                      </div>
                    </div>

                    {/* Pillar 02 */}
                    <div id="space-card-2" className="breaker-card p-8 rounded-2xl bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border shadow-sm hover:-translate-y-2 hover:shadow-lg transition-all duration-500 group flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-metadata-spec text-3xl font-black text-wine dark:text-gold transition-colors">02</span>
                          <div className="w-12 h-12 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i className="ph-bold ph-chats-circle text-2xl"></i>
                          </div>
                        </div>
                        <h3 className="font-display font-black text-xl text-ink dark:text-night-text">CLB Sách & Đối Thoại</h3>
                        <p className="font-editorial-body text-sm text-ink-muted dark:text-night-muted leading-relaxed">
                          Tham gia những buổi bàn luận sâu sắc về các tác phẩm lớn cùng những độc giả chung niềm đam mê tri thức.
                        </p>
                      </div>
                      <div className="pt-6 border-t border-paper-border/60 dark:border-night-border/60 mt-6 flex items-center text-xs font-bold text-wine dark:text-gold">
                        <span>Giao lưu & Chia sẻ</span>
                        <i className="ph-bold ph-arrow-right ml-1 group-hover:translate-x-1 transition-transform"></i>
                      </div>
                    </div>

                    {/* Pillar 03 */}
                    <div id="space-card-3" className="breaker-card p-8 rounded-2xl bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border shadow-sm hover:-translate-y-2 hover:shadow-lg transition-all duration-500 group flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-metadata-spec text-3xl font-black text-wine dark:text-gold transition-colors">03</span>
                          <div className="w-12 h-12 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i className="ph-bold ph-crown text-2xl"></i>
                          </div>
                        </div>
                        <h3 className="font-display font-black text-xl text-ink dark:text-night-text">Tuyển Tập Giới Hạn</h3>
                        <p className="font-editorial-body text-sm text-ink-muted dark:text-night-muted leading-relaxed">
                          Tiếp cận những ấn bản bìa cứng giới hạn, thủ bút tác giả và tài liệu nghiên cứu chuyên sâu độc quyền tại HALM.
                        </p>
                      </div>
                      <div className="pt-6 border-t border-paper-border/60 dark:border-night-border/60 mt-6 flex items-center text-xs font-bold text-wine dark:text-gold">
                        <span>Ấn bản đặc biệt</span>
                        <i className="ph-bold ph-arrow-right ml-1 group-hover:translate-x-1 transition-transform"></i>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </section>


          {/* ========================================================
             SECTION — KHOA HỌC & CÔNG NGHỆ
             ======================================================== */}
          <section id="science-section" className="chapter-ambient-wrapper ambient-glow-a chapter-divider pt-8 pb-6 lg:pt-10 lg:pb-7 bg-paper dark:bg-night-bg transition-colors overflow-hidden">
            <div className="ch4-page-stage">
              <div id="ch-science-leaf" className="ch4-page-leaf">
                <div className="w-[96%] max-w-[96vw] mx-auto">

                  <div id="science-header" className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start mb-6">
                    <div className="lg:col-span-8 space-y-2 sm:space-y-2.5">
                      <span className="font-metadata-spec text-xs sm:text-sm font-extrabold tracking-[0.28em] text-wine dark:text-gold uppercase block">
                        KHOA HỌC & CÔNG NGHỆ
                      </span>
                      <h2 className="font-display-hero text-2xl sm:text-3xl lg:text-4xl font-black text-ink dark:text-night-text leading-tight">
                        KHÁM PHÁ VŨ TRỤ. KHAI PHÓNG TƯ DUY KỸ THUẬT.
                      </h2>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-semibold">
                        <span className="px-3.5 py-1.5 rounded-full bg-paper-200 dark:bg-night-card text-ink dark:text-night-text border border-paper-border dark:border-night-border font-metadata-spec">Vật Lý & Vũ Trụ</span>
                        <span className="px-3.5 py-1.5 rounded-full bg-paper-200 dark:bg-night-card text-ink dark:text-night-text border border-paper-border dark:border-night-border font-metadata-spec">Trí Tuệ Nhân Tạo & Lập Trình</span>
                      </div>
                    </div>

                    <div className="lg:col-span-4 flex flex-col justify-between">
                      <div className="p-5 rounded-xl border-l-4 border-wine dark:border-gold bg-paper dark:bg-night-card font-editorial-body italic text-sm text-ink-muted dark:text-night-muted shadow-sm">
                        “Khoa học không chỉ là kho tàng kiến thức; nó là một thái độ hoài nghi lành mạnh và lòng say mê khám phá chân lý vô tận.”
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-3">
                        <button onClick={(event) => { window.scrollShelfByCard('science-shelf', -1) }} className="w-9 h-9 rounded-full border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-card flex items-center justify-center text-ink dark:text-night-text transition-colors" aria-label="Cuộn lùi 1 sách" title="Lùi 1 sách">
                          <i className="ph-bold ph-caret-left"></i>
                        </button>
                        <button onClick={(event) => { window.scrollShelfByCard('science-shelf', 1) }} className="w-9 h-9 rounded-full border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-card flex items-center justify-center text-ink dark:text-night-text transition-colors" aria-label="Cuộn tiến 1 sách" title="Tiến 1 sách">
                          <i className="ph-bold ph-caret-right"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div id="science-shelf" className="shelf-scroll-row flex gap-5 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth">
                    {/* Populated by JS */}
                  </div>

                </div>
              </div>
            </div>
          </section>


          {/* ========================================================
             SECTION — KINH TẾ & KHỞI NGHIỆP
             ======================================================== */}
          <section id="business-section" className="chapter-ambient-wrapper ambient-glow-b chapter-divider pt-8 pb-6 lg:pt-10 lg:pb-7 bg-paper dark:bg-night-bg transition-colors overflow-hidden">
            <div className="ch4-page-stage">
              <div id="ch-business-leaf" className="ch4-page-leaf">
                <div className="w-[96%] max-w-[96vw] mx-auto">

                  <div id="business-header" className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start mb-6">
                    <div className="lg:col-span-8 space-y-2 sm:space-y-2.5">
                      <span className="font-metadata-spec text-xs sm:text-sm font-extrabold tracking-[0.28em] text-wine dark:text-gold uppercase block">
                        KINH TẾ & KHỞI NGHIỆP
                      </span>
                      <h2 className="font-display-hero text-2xl sm:text-3xl lg:text-4xl font-black text-ink dark:text-night-text leading-tight">
                        CHIẾN LƯỢC KINH DOANH. BẢN LĨNH DẪN ĐẦU THỊ TRƯỜNG.
                      </h2>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-semibold">
                        <span className="px-3.5 py-1.5 rounded-full bg-paper-200 dark:bg-night-card text-ink dark:text-night-text border border-paper-border dark:border-night-border font-metadata-spec">Chiến Lược & Khởi Nghiệp</span>
                        <span className="px-3.5 py-1.5 rounded-full bg-paper-200 dark:bg-night-card text-ink dark:text-night-text border border-paper-border dark:border-night-border font-metadata-spec">Đầu Tư & Tài Chính Toàn Cầu</span>
                      </div>
                    </div>

                    <div className="lg:col-span-4 flex flex-col justify-between">
                      <div className="p-5 rounded-xl border-l-4 border-wine dark:border-gold bg-paper dark:bg-night-card font-editorial-body italic text-sm text-ink-muted dark:text-night-muted shadow-sm">
                        “Thành công thương trường không đến từ vận may ngẫu nhiên, mà bắt nguồn từ tư duy chiến lược kiên định và khả năng thích ứng linh hoạt.”
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-3">
                        <button onClick={(event) => { window.scrollShelfByCard('business-shelf', -1) }} className="w-9 h-9 rounded-full border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-card flex items-center justify-center text-ink dark:text-night-text transition-colors" aria-label="Cuộn lùi 1 sách" title="Lùi 1 sách">
                          <i className="ph-bold ph-caret-left"></i>
                        </button>
                        <button onClick={(event) => { window.scrollShelfByCard('business-shelf', 1) }} className="w-9 h-9 rounded-full border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-card flex items-center justify-center text-ink dark:text-night-text transition-colors" aria-label="Cuộn tiến 1 sách" title="Tiến 1 sách">
                          <i className="ph-bold ph-caret-right"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div id="business-shelf" className="shelf-scroll-row flex gap-5 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth">
                    {/* Populated by JS */}
                  </div>

                </div>
              </div>
            </div>
          </section>


          {/* ========================================================
             BREAKER 03 — HÀNH TRÌNH TRI THỨC & THÓI QUEN ĐỌC
             Theme: “3 bước xây dựng thói quen đọc bền vững.”
             Visual Hook: THREE STEP RITUAL
             ======================================================== */}
          <section id="habit-section" className="chapter-ambient-wrapper ambient-glow-a chapter-divider pt-6 pb-6 lg:pt-7 lg:pb-7 bg-paper dark:bg-night-bg transition-colors overflow-hidden">
            <div className="ch3-page-stage">
              <div id="ch-habit-page-leaf" className="ch3-page-leaf">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                  <div className="text-center max-w-3xl mx-auto mb-8 lg:mb-10 space-y-3">
                    <span id="habit-header-label" className="font-metadata-spec text-xs font-bold tracking-[0.25em] text-wine dark:text-gold uppercase block">
                      HÀNH TRÌNH TRI THỨC
                    </span>
                    <h2 id="habit-header-title" className="font-display-hero text-3xl sm:text-4xl lg:text-5xl font-black text-ink dark:text-night-text">
                      20 PHÚT MỖI NGÀY.<br />
                      <span className="text-wine dark:text-gold">MỘT ĐỜI THÔNG TUỆ.</span>
                    </h2>
                    <div id="habit-header-divider" className="w-16 h-0.5 mx-auto bg-wine/30 dark:bg-gold/40 my-3 rounded-full origin-center"></div>
                    <p id="habit-header-desc" className="font-editorial-body text-base sm:text-lg text-ink-muted dark:text-night-muted max-w-2xl mx-auto leading-relaxed">
                      Ba nguyên lý đơn giản giúp bạn biến việc đọc thành một thói quen tự nhiên không&nbsp;thể&nbsp;thiếu.
                    </p>
                  </div>

                  <div id="habit-grid" className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Step 01 */}
                    <div id="habit-card-1" className="breaker-card p-8 rounded-2xl bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border shadow-sm hover:-translate-y-2 hover:shadow-lg transition-all duration-500 group flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-metadata-spec text-3xl font-black text-wine dark:text-gold transition-colors">01</span>
                          <div className="w-12 h-12 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i className="ph-bold ph-timer text-2xl"></i>
                          </div>
                        </div>
                        <h3 className="font-display font-black text-xl text-ink dark:text-night-text">Khởi Đầu Nhỏ Bền Bỉ</h3>
                        <p className="font-editorial-body text-sm text-ink-muted dark:text-night-muted leading-relaxed">
                          Đặt mục tiêu chỉ 10 đến 15 trang mỗi buổi sáng hoặc trước khi ngủ. Tính đều đặn quan trọng hơn tốc độ lật trang.
                        </p>
                      </div>
                      <div className="pt-6 border-t border-paper-border/60 dark:border-night-border/60 mt-6 flex items-center text-xs font-bold text-wine dark:text-gold">
                        <span>Kỷ luật vi mô</span>
                        <i className="ph-bold ph-arrow-right ml-1 group-hover:translate-x-1 transition-transform"></i>
                      </div>
                    </div>

                    {/* Step 02 */}
                    <div id="habit-card-2" className="breaker-card p-8 rounded-2xl bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border shadow-sm hover:-translate-y-2 hover:shadow-lg transition-all duration-500 group flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-metadata-spec text-3xl font-black text-wine dark:text-gold transition-colors">02</span>
                          <div className="w-12 h-12 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i className="ph-bold ph-highlighter text-2xl"></i>
                          </div>
                        </div>
                        <h3 className="font-display font-black text-xl text-ink dark:text-night-text">Ghi Chú & Đối Thoại</h3>
                        <p className="font-editorial-body text-sm text-ink-muted dark:text-night-muted leading-relaxed">
                          Đánh dấu những câu văn rung động, ghi chép phản tư để biến góc nhìn của tác giả thành vốn sống của chính bạn.
                        </p>
                      </div>
                      <div className="pt-6 border-t border-paper-border/60 dark:border-night-border/60 mt-6 flex items-center text-xs font-bold text-wine dark:text-gold">
                        <span>Chuyển hóa tri thức</span>
                        <i className="ph-bold ph-arrow-right ml-1 group-hover:translate-x-1 transition-transform"></i>
                      </div>
                    </div>

                    {/* Step 03 */}
                    <div id="habit-card-3" className="breaker-card p-8 rounded-2xl bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border shadow-sm hover:-translate-y-2 hover:shadow-lg transition-all duration-500 group flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-metadata-spec text-3xl font-black text-wine dark:text-gold transition-colors">03</span>
                          <div className="w-12 h-12 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i className="ph-bold ph-compass text-2xl"></i>
                          </div>
                        </div>
                        <h3 className="font-display font-black text-xl text-ink dark:text-night-text">Mở Rộng Vòng Đọc</h3>
                        <p className="font-editorial-body text-sm text-ink-muted dark:text-night-muted leading-relaxed">
                          Đừng chỉ đọc một thể loại yêu thích. Luân phiên giữa văn học, khoa học, triết học để xây dựng tư duy đa chiều.
                        </p>
                      </div>
                      <div className="pt-6 border-t border-paper-border/60 dark:border-night-border/60 mt-6 flex items-center text-xs font-bold text-wine dark:text-gold">
                        <span>Tư duy liên ngành</span>
                        <i className="ph-bold ph-arrow-right ml-1 group-hover:translate-x-1 transition-transform"></i>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </section>


          {/* ========================================================
             SECTION — LỊCH SỬ & VĂN HÓA
             ======================================================== */}
          <section id="history-section" className="chapter-ambient-wrapper ambient-glow-b chapter-divider pt-8 pb-6 lg:pt-10 lg:pb-7 bg-paper dark:bg-night-bg transition-colors overflow-hidden">
            <div className="ch4-page-stage">
              <div id="ch-history-leaf" className="ch4-page-leaf">
                <div className="w-[96%] max-w-[96vw] mx-auto">

                  <div id="history-header" className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start mb-6">
                    <div className="lg:col-span-8 space-y-2 sm:space-y-2.5">
                      <span className="font-metadata-spec text-xs sm:text-sm font-extrabold tracking-[0.28em] text-wine dark:text-gold uppercase block">
                        LỊCH SỬ & VĂN HÓA
                      </span>
                      <h2 className="font-display-hero text-2xl sm:text-3xl lg:text-4xl font-black leading-tight">
                        <span className="text-ink dark:text-night-text block">DÒNG THỜI GIAN VẠN NIÊN</span>
                        <span className="text-wine dark:text-gold block whitespace-nowrap">BÀI HỌC TỪ CÁC NỀN VĂN MINH</span>
                      </h2>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-semibold">
                        <span className="px-3.5 py-1.5 rounded-full bg-paper-200 dark:bg-night-card text-ink dark:text-night-text border border-paper-border dark:border-night-border font-metadata-spec">Sử Việt Hào Hùng</span>
                        <span className="px-3.5 py-1.5 rounded-full bg-paper-200 dark:bg-night-card text-ink dark:text-night-text border border-paper-border dark:border-night-border font-metadata-spec">Văn Minh Thế Giới</span>
                      </div>
                    </div>

                    <div className="lg:col-span-4 flex flex-col justify-between">
                      <div className="p-5 rounded-xl border-l-4 border-wine dark:border-gold bg-paper dark:bg-night-card font-editorial-body italic text-sm text-ink-muted dark:text-night-muted shadow-sm">
                        “Ai không hiểu được quá khứ sẽ phải chịu số phận lặp lại những sai lầm của chính tiền nhân.”
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-3">
                        <button onClick={(event) => { window.scrollShelfByCard('history-shelf', -1) }} className="w-9 h-9 rounded-full border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-card flex items-center justify-center text-ink dark:text-night-text transition-colors" aria-label="Cuộn lùi 1 sách" title="Lùi 1 sách">
                          <i className="ph-bold ph-caret-left"></i>
                        </button>
                        <button onClick={(event) => { window.scrollShelfByCard('history-shelf', 1) }} className="w-9 h-9 rounded-full border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-card flex items-center justify-center text-ink dark:text-night-text transition-colors" aria-label="Cuộn tiến 1 sách" title="Tiến 1 sách">
                          <i className="ph-bold ph-caret-right"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div id="history-shelf" className="shelf-scroll-row flex gap-5 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth">
                    {/* Populated by JS */}
                  </div>

                </div>
              </div>
            </div>
          </section>


          {/* ========================================================
             SECTION — TÂM LÝ & TRIẾT HỌC
             ======================================================== */}
          <section id="philosophy-section" className="chapter-ambient-wrapper ambient-glow-a chapter-divider pt-8 pb-6 lg:pt-10 lg:pb-7 bg-paper dark:bg-night-bg transition-colors overflow-hidden">
            <div className="ch4-page-stage">
              <div id="ch-philosophy-leaf" className="ch4-page-leaf">
                <div className="w-[96%] max-w-[96vw] mx-auto">

                  <div id="philosophy-header" className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start mb-6">
                    <div className="lg:col-span-8 space-y-2 sm:space-y-2.5">
                      <span className="font-metadata-spec text-xs sm:text-sm font-extrabold tracking-[0.28em] text-wine dark:text-gold uppercase block">
                        TÂM LÝ & TRIẾT HỌC
                      </span>
                      <h2 className="font-display-hero text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-black text-ink dark:text-night-text leading-tight lg:whitespace-nowrap">
                        THẤU HIỂU NỘI TÂM - CHIÊM NGHIỆM LẼ SỐNG TỰ TẠI
                      </h2>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-semibold">
                        <span className="px-3.5 py-1.5 rounded-full bg-paper-200 dark:bg-night-card text-ink dark:text-night-text border border-paper-border dark:border-night-border font-metadata-spec">Tâm Lý Học Hành Vi</span>
                        <span className="px-3.5 py-1.5 rounded-full bg-paper-200 dark:bg-night-card text-ink dark:text-night-text border border-paper-border dark:border-night-border font-metadata-spec">Chủ Nghĩa Khắc Kỷ & Triết Lý Phương Đông</span>
                      </div>
                    </div>

                    <div className="lg:col-span-4 flex flex-col justify-between">
                      <div className="p-5 rounded-xl border-l-4 border-wine dark:border-gold bg-paper dark:bg-night-card font-editorial-body italic text-sm text-ink-muted dark:text-night-muted shadow-sm">
                        “Không phải những sự việc bên ngoài làm chúng ta phiền muộn, mà chính là cách chúng ta phán xét và nhìn nhận về chúng.”
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-3">
                        <button onClick={(event) => { window.scrollShelfByCard('philosophy-shelf', -1) }} className="w-9 h-9 rounded-full border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-card flex items-center justify-center text-ink dark:text-night-text transition-colors" aria-label="Cuộn lùi 1 sách" title="Lùi 1 sách">
                          <i className="ph-bold ph-caret-left"></i>
                        </button>
                        <button onClick={(event) => { window.scrollShelfByCard('philosophy-shelf', 1) }} className="w-9 h-9 rounded-full border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-card flex items-center justify-center text-ink dark:text-night-text transition-colors" aria-label="Cuộn tiến 1 sách" title="Tiến 1 sách">
                          <i className="ph-bold ph-caret-right"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div id="philosophy-shelf" className="shelf-scroll-row flex gap-5 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth">
                    {/* Populated by JS */}
                  </div>

                </div>
              </div>
            </div>
          </section>


          {/* ========================================================
             BREAKER 04 — TRẢI NGHIỆM ĐỌC SÁCH THÔNG MINH
             Theme: “Công nghệ nâng tầm tri thức cổ điển.”
             Visual Hook: THREE DIGITAL READING INNOVATIONS
             ======================================================== */}
          <section id="smartreading-section" className="chapter-ambient-wrapper ambient-glow-b chapter-divider pt-6 pb-6 lg:pt-7 lg:pb-7 bg-paper dark:bg-night-bg transition-colors overflow-hidden">
            <div className="ch3-page-stage">
              <div id="ch-smart-page-leaf" className="ch3-page-leaf">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                  <div className="text-center max-w-3xl mx-auto mb-8 lg:mb-10 space-y-3">
                    <span id="smart-header-label" className="font-metadata-spec text-xs font-bold tracking-[0.25em] text-wine dark:text-gold uppercase block">
                      TRẢI NGHIỆM THÔNG MINH
                    </span>
                    <h2 id="smart-header-title" className="font-display-hero text-3xl sm:text-4xl lg:text-5xl font-black text-ink dark:text-night-text">
                      KỶ NGUYÊN SỐ.<br />
                      <span className="text-wine dark:text-gold">ĐỌC SÂU & TIỆN ÍCH.</span>
                    </h2>
                    <div id="smart-header-divider" className="w-16 h-0.5 mx-auto bg-wine/30 dark:bg-gold/40 my-3 rounded-full origin-center"></div>
                    <p id="smart-header-desc" className="font-editorial-body text-base sm:text-lg text-ink-muted dark:text-night-muted">
                      Hệ thống công cụ hỗ trợ đọc sách tiên tiến giúp tối ưu hóa thời gian và khả năng tiếp thu tri thức.
                    </p>
                  </div>

                  <div id="smart-grid" className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Tech 01 */}
                    <div id="smart-card-1" className="breaker-card p-8 rounded-2xl bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border shadow-sm hover:-translate-y-2 hover:shadow-lg transition-all duration-500 group flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-metadata-spec text-3xl font-black text-wine dark:text-gold transition-colors">01</span>
                          <div className="w-12 h-12 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i className="ph-bold ph-lightning text-2xl"></i>
                          </div>
                        </div>
                        <h3 className="font-display font-black text-xl text-ink dark:text-night-text">Tóm Tắt Ý Tưởng 5 Phút</h3>
                        <p className="font-editorial-body text-sm text-ink-muted dark:text-night-muted leading-relaxed">
                          Nắm bắt nhanh cấu trúc luận điểm then chốt của tác phẩm trước khi bắt đầu hành trình đọc chi tiết từng chương.
                        </p>
                      </div>
                      <div className="pt-6 border-t border-paper-border/60 dark:border-night-border/60 mt-6 flex items-center text-xs font-bold text-wine dark:text-gold">
                        <span>Đọc tinh gọn</span>
                        <i className="ph-bold ph-arrow-right ml-1 group-hover:translate-x-1 transition-transform"></i>
                      </div>
                    </div>

                    {/* Tech 02 */}
                    <div id="smart-card-2" className="breaker-card p-8 rounded-2xl bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border shadow-sm hover:-translate-y-2 hover:shadow-lg transition-all duration-500 group flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-metadata-spec text-3xl font-black text-wine dark:text-gold transition-colors">02</span>
                          <div className="w-12 h-12 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i className="ph-bold ph-headphones text-2xl"></i>
                          </div>
                        </div>
                        <h3 className="font-display font-black text-xl text-ink dark:text-night-text">Sách Nói Truyền Cảm</h3>
                        <p className="font-editorial-body text-sm text-ink-muted dark:text-night-muted leading-relaxed">
                          Thưởng thức phiên bản audio studio chất lượng cao đồng bộ tiến trình mượt mà giữa điện thoại, máy tính bảng và web.
                        </p>
                      </div>
                      <div className="pt-6 border-t border-paper-border/60 dark:border-night-border/60 mt-6 flex items-center text-xs font-bold text-wine dark:text-gold">
                        <span>Lắng nghe mọi nơi</span>
                        <i className="ph-bold ph-arrow-right ml-1 group-hover:translate-x-1 transition-transform"></i>
                      </div>
                    </div>

                    {/* Tech 03 */}
                    <div id="smart-card-3" className="breaker-card p-8 rounded-2xl bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border shadow-sm hover:-translate-y-2 hover:shadow-lg transition-all duration-500 group flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-metadata-spec text-3xl font-black text-wine dark:text-gold transition-colors">03</span>
                          <div className="w-12 h-12 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i className="ph-bold ph-note-pencil text-2xl"></i>
                          </div>
                        </div>
                        <h3 className="font-display font-black text-xl text-ink dark:text-night-text">Sổ Tay Trích Dẫn & AI</h3>
                        <p className="font-editorial-body text-sm text-ink-muted dark:text-night-muted leading-relaxed">
                          Tự động gom trích dẫn yêu thích vào sổ tay số, dễ dàng truy vấn ý tưởng qua trợ lý thông minh theo ngữ cảnh.
                        </p>
                      </div>
                      <div className="pt-6 border-t border-paper-border/60 dark:border-night-border/60 mt-6 flex items-center text-xs font-bold text-wine dark:text-gold">
                        <span>Kho lưu trữ cá nhân</span>
                        <i className="ph-bold ph-arrow-right ml-1 group-hover:translate-x-1 transition-transform"></i>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </section>


          {/* ========================================================
             SECTION — NGHỆ THUẬT & LỐI SỐNG
             ======================================================== */}
          <section id="artlifestyle-section" className="chapter-ambient-wrapper ambient-glow-a chapter-divider pt-8 pb-6 lg:pt-10 lg:pb-7 bg-paper dark:bg-night-bg transition-colors overflow-hidden">
            <div className="ch4-page-stage">
              <div id="ch-artlifestyle-leaf" className="ch4-page-leaf">
                <div className="w-[96%] max-w-[96vw] mx-auto">

                  <div id="artlifestyle-header" className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start mb-6">
                    <div className="lg:col-span-8 space-y-2 sm:space-y-2.5">
                      <span className="font-metadata-spec text-xs sm:text-sm font-extrabold tracking-[0.28em] text-wine dark:text-gold uppercase block">
                        NGHỆ THUẬT & LỐI SỐNG
                      </span>
                      <h2 className="font-display-hero text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-black text-ink dark:text-night-text leading-tight">
                        THẨM MỸ TINH BẢN. TẬN HƯỞNG NGHỆ THUẬT SỐNG ĐẸP.
                      </h2>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-semibold">
                        <span className="px-3.5 py-1.5 rounded-full bg-paper-200 dark:bg-night-card text-ink dark:text-night-text border border-paper-border dark:border-night-border font-metadata-spec">Hội Họa, Kiến Trúc & Nhiếp Ảnh</span>
                        <span className="px-3.5 py-1.5 rounded-full bg-paper-200 dark:bg-night-card text-ink dark:text-night-text border border-paper-border dark:border-night-border font-metadata-spec">Lối Sống Tối Giản & Trà Đạo</span>
                      </div>
                    </div>

                    <div className="lg:col-span-4 flex flex-col justify-between">
                      <div className="p-5 rounded-xl border-l-4 border-wine dark:border-gold bg-paper dark:bg-night-card font-editorial-body italic text-sm text-ink-muted dark:text-night-muted shadow-sm">
                        “Nghệ thuật rửa sạch khỏi tâm hồn lớp bụi bặm thường nhật của cuộc sống và đánh thức mỹ cảm thuần khiết.”
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-3">
                        <button onClick={(event) => { window.scrollShelfByCard('artlifestyle-shelf', -1) }} className="w-9 h-9 rounded-full border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-card flex items-center justify-center text-ink dark:text-night-text transition-colors" aria-label="Cuộn lùi 1 sách" title="Lùi 1 sách">
                          <i className="ph-bold ph-caret-left"></i>
                        </button>
                        <button onClick={(event) => { window.scrollShelfByCard('artlifestyle-shelf', 1) }} className="w-9 h-9 rounded-full border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-card flex items-center justify-center text-ink dark:text-night-text transition-colors" aria-label="Cuộn tiến 1 sách" title="Tiến 1 sách">
                          <i className="ph-bold ph-caret-right"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div id="artlifestyle-shelf" className="shelf-scroll-row flex gap-5 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth">
                    {/* Populated by JS */}
                  </div>

                </div>
              </div>
            </div>
          </section>


          {/* ========================================================
             SECTION — HỒI KÝ & DANH NHÂN
             ======================================================== */}
          <section id="biography-section" className="chapter-ambient-wrapper ambient-glow-b chapter-divider pt-8 pb-6 lg:pt-10 lg:pb-7 bg-paper dark:bg-night-bg transition-colors overflow-hidden">
            <div className="ch4-page-stage">
              <div id="ch-biography-leaf" className="ch4-page-leaf">
                <div className="w-[96%] max-w-[96vw] mx-auto">

                  <div id="biography-header" className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start mb-6">
                    <div className="lg:col-span-8 space-y-2 sm:space-y-2.5">
                      <span className="font-metadata-spec text-xs sm:text-sm font-extrabold tracking-[0.28em] text-wine dark:text-gold uppercase block">
                        HỒI KÝ & DANH NHÂN
                      </span>
                      <h2 className="font-display-hero text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-black text-ink dark:text-night-text leading-tight">
                        CHÂN DUNG NHỮNG CUỘC ĐỜI LỚN TẠO NÊN LỊCH SỬ.
                      </h2>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-semibold">
                        <span className="px-3.5 py-1.5 rounded-full bg-paper-200 dark:bg-night-card text-ink dark:text-night-text border border-paper-border dark:border-night-border font-metadata-spec">Danh Nhân Thế Giới</span>
                        <span className="px-3.5 py-1.5 rounded-full bg-paper-200 dark:bg-night-card text-ink dark:text-night-text border border-paper-border dark:border-night-border font-metadata-spec">Tự Truyện & Hồi Ký Xúc Động</span>
                      </div>
                    </div>

                    <div className="lg:col-span-4 flex flex-col justify-between">
                      <div className="p-5 rounded-xl border-l-4 border-wine dark:border-gold bg-paper dark:bg-night-card font-editorial-body italic text-sm text-ink-muted dark:text-night-muted shadow-sm">
                        “Đọc một cuốn hồi ký là sống thêm một cuộc đời, học từ những vết thương và thắp sáng khát vọng từ những ngọn hải đăng của nhân loại.”
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-3">
                        <button onClick={(event) => { window.scrollShelfByCard('biography-shelf', -1) }} className="w-9 h-9 rounded-full border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-card flex items-center justify-center text-ink dark:text-night-text transition-colors" aria-label="Cuộn lùi 1 sách" title="Lùi 1 sách">
                          <i className="ph-bold ph-caret-left"></i>
                        </button>
                        <button onClick={(event) => { window.scrollShelfByCard('biography-shelf', 1) }} className="w-9 h-9 rounded-full border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-card flex items-center justify-center text-ink dark:text-night-text transition-colors" aria-label="Cuộn tiến 1 sách" title="Tiến 1 sách">
                          <i className="ph-bold ph-caret-right"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div id="biography-shelf" className="shelf-scroll-row flex gap-5 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth">
                    {/* Populated by JS */}
                  </div>

                </div>
              </div>
            </div>
          </section>


          {/* ========================================================
             CHỦ ĐỀ CẢM HỨNG (CAROUSEL SHELF — 1 HÀNG 3 THẺ)
             Theme: “Hôm nay, bạn muốn khám phá điều gì?”
             Visual Hook: SINGLE ROW HORIZONTAL CAROUSEL (3 thẻ / hàng với nút bấm)
             ======================================================== */}
          <section id="topic-section" className="chapter-ambient-wrapper ambient-glow-a chapter-divider pt-8 pb-8 lg:pt-10 lg:pb-10 bg-paper dark:bg-night-bg transition-colors overflow-hidden">
            <div className="ch3-page-stage">
              <div id="ch8-page-leaf" className="ch3-page-leaf">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                  <div id="topic-header" className="flex flex-col md:flex-row md:items-end justify-between mb-8 lg:mb-10 gap-4">
                    <div className="space-y-2">
                      <span className="font-metadata-spec text-xs font-bold tracking-[0.25em] text-wine dark:text-gold uppercase block">
                        CHỦ ĐỀ CẢM HỨNG
                      </span>
                      <h2 className="font-display-hero text-3xl sm:text-4xl lg:text-5xl font-black text-ink dark:text-night-text">
                        HÔM NAY, BẠN MUỐN KHÁM PHÁ ĐIỀU GÌ?
                      </h2>
                      <p className="font-editorial-body text-base sm:text-lg text-ink-muted dark:text-night-muted">
                        Một chủ đề, một câu hỏi hoặc một mối quan tâm có thể mở ra cả một hành trình đọc mới.
                      </p>
                    </div>

                    {/* Carousel Controls for 3-cards row */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={(event) => { window.scrollShelfByCard('topic-shelf', -1) }} className="w-10 h-10 rounded-full border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-card flex items-center justify-center text-ink dark:text-night-text transition-colors shadow-sm" aria-label="Chủ đề trước" title="Chủ đề trước">
                        <i className="ph-bold ph-caret-left text-lg"></i>
                      </button>
                      <button onClick={(event) => { window.scrollShelfByCard('topic-shelf', 1) }} className="w-10 h-10 rounded-full border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-card flex items-center justify-center text-ink dark:text-night-text transition-colors shadow-sm" aria-label="Chủ đề tiếp theo" title="Chủ đề tiếp theo">
                        <i className="ph-bold ph-caret-right text-lg"></i>
                      </button>
                    </div>
                  </div>

                  {/* 6 Topic Cards styled in 1 Horizontal Shelf (Displays exactly 3 per view on desktop) */}
                  <div id="topic-shelf" className="shelf-scroll-row flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth">

                    {/* Topic 1 */}
                    <div onClick={(event) => { window.filterTopic('van-hoc') }} className="shrink-0 snap-start cursor-pointer p-8 rounded-2xl bg-paper dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all group flex flex-col justify-between min-h-[230px]">
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold text-wine dark:text-gold mb-3 font-metadata-spec">
                          <span>CHỦ ĐỀ 01</span>
                          <i className="ph-bold ph-feather text-lg"></i>
                        </div>
                        <h3 className="font-display font-black text-2xl text-ink dark:text-night-text group-hover:text-wine dark:group-hover:text-gold transition-colors mb-2">
                          Văn Học & Truyện Dài
                        </h3>
                        <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted leading-relaxed">
                          Những tác phẩm văn học kinh điển, truyện ngắn và tiểu thuyết giàu giá trị nhân văn.
                        </p>
                      </div>
                      <div className="pt-4 border-t border-paper-border/60 dark:border-night-border/60 flex items-center justify-between text-xs font-bold text-ink dark:text-night-muted font-metadata-spec">
                        <span>Khám phá sách</span>
                        <i className="ph-bold ph-arrow-right group-hover:translate-x-1 transition-transform"></i>
                      </div>
                    </div>

                    {/* Topic 2 */}
                    <div onClick={(event) => { window.filterTopic('thieu-nhi') }} className="shrink-0 snap-start cursor-pointer p-8 rounded-2xl bg-paper dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all group flex flex-col justify-between min-h-[230px]">
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold text-wine dark:text-gold mb-3 font-metadata-spec">
                          <span>CHỦ ĐỀ 02</span>
                          <i className="ph-bold ph-balloon text-lg"></i>
                        </div>
                        <h3 className="font-display font-black text-2xl text-ink dark:text-night-text group-hover:text-wine dark:group-hover:text-gold transition-colors mb-2">
                          Thiếu Nhi & Tuổi Thơ
                        </h3>
                        <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted leading-relaxed">
                          Truyện cổ tích thế giới, ngụ ngôn, phiêu lưu và những bài học bồi dưỡng tâm hồn thơ trẻ.
                        </p>
                      </div>
                      <div className="pt-4 border-t border-paper-border/60 dark:border-night-border/60 flex items-center justify-between text-xs font-bold text-ink dark:text-night-muted font-metadata-spec">
                        <span>Khám phá sách</span>
                        <i className="ph-bold ph-arrow-right group-hover:translate-x-1 transition-transform"></i>
                      </div>
                    </div>

                    {/* Topic 3 */}
                    <div onClick={(event) => { window.filterTopic('phat-trien') }} className="shrink-0 snap-start cursor-pointer p-8 rounded-2xl bg-paper dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all group flex flex-col justify-between min-h-[230px]">
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold text-wine dark:text-gold mb-3 font-metadata-spec">
                          <span>CHỦ ĐỀ 03</span>
                          <i className="ph-bold ph-brain text-lg"></i>
                        </div>
                        <h3 className="font-display font-black text-2xl text-ink dark:text-night-text group-hover:text-wine dark:group-hover:text-gold transition-colors mb-2">
                          Phát Triển Bản Thân
                        </h3>
                        <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted leading-relaxed">
                          Rèn luyện thói quen tốt, tư duy phản biện, kỹ năng sống và làm chủ cảm xúc cá nhân.
                        </p>
                      </div>
                      <div className="pt-4 border-t border-paper-border/60 dark:border-night-border/60 flex items-center justify-between text-xs font-bold text-ink dark:text-night-muted font-metadata-spec">
                        <span>Khám phá sách</span>
                        <i className="ph-bold ph-arrow-right group-hover:translate-x-1 transition-transform"></i>
                      </div>
                    </div>

                    {/* Topic 4 */}
                    <div onClick={(event) => { window.filterTopic('kinh-doanh') }} className="shrink-0 snap-start cursor-pointer p-8 rounded-2xl bg-paper dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all group flex flex-col justify-between min-h-[230px]">
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold text-wine dark:text-gold mb-3 font-metadata-spec">
                          <span>CHỦ ĐỀ 04</span>
                          <i className="ph-bold ph-briefcase text-lg"></i>
                        </div>
                        <h3 className="font-display font-black text-2xl text-ink dark:text-night-text group-hover:text-wine dark:group-hover:text-gold transition-colors mb-2">
                          Kinh Doanh & Quản Trị
                        </h3>
                        <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted leading-relaxed">
                          Phương pháp quản trị, chiến lược khởi nghiệp, bán hàng và tư duy của các nhà lãnh đạo xuất sắc.
                        </p>
                      </div>
                      <div className="pt-4 border-t border-paper-border/60 dark:border-night-border/60 flex items-center justify-between text-xs font-bold text-ink dark:text-night-muted font-metadata-spec">
                        <span>Khám phá sách</span>
                        <i className="ph-bold ph-arrow-right group-hover:translate-x-1 transition-transform"></i>
                      </div>
                    </div>

                    {/* Topic 5 */}
                    <div onClick={(event) => { window.filterTopic('khoa-hoc') }} className="shrink-0 snap-start cursor-pointer p-8 rounded-2xl bg-paper dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all group flex flex-col justify-between min-h-[230px]">
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold text-wine dark:text-gold mb-3 font-metadata-spec">
                          <span>CHỦ ĐỀ 05</span>
                          <i className="ph-bold ph-planet text-lg"></i>
                        </div>
                        <h3 className="font-display font-black text-2xl text-ink dark:text-night-text group-hover:text-wine dark:group-hover:text-gold transition-colors mb-2">
                          Khoa Học & Vũ Trụ
                        </h3>
                        <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted leading-relaxed">
                          Khám phá thế giới tự nhiên, vật lý thiên văn, sinh học và các phát kiến làm thay đổi nhân loại.
                        </p>
                      </div>
                      <div className="pt-4 border-t border-paper-border/60 dark:border-night-border/60 flex items-center justify-between text-xs font-bold text-ink dark:text-night-muted font-metadata-spec">
                        <span>Khám phá sách</span>
                        <i className="ph-bold ph-arrow-right group-hover:translate-x-1 transition-transform"></i>
                      </div>
                    </div>

                    {/* Topic 6 */}
                    <div onClick={(event) => { window.filterTopic('lich-su') }} className="shrink-0 snap-start cursor-pointer p-8 rounded-2xl bg-paper dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all group flex flex-col justify-between min-h-[230px]">
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold text-wine dark:text-gold mb-3 font-metadata-spec">
                          <span>CHỦ ĐỀ 06</span>
                          <i className="ph-bold ph-hourglass-high text-lg"></i>
                        </div>
                        <h3 className="font-display font-black text-2xl text-ink dark:text-night-text group-hover:text-wine dark:group-hover:text-gold transition-colors mb-2">
                          Lịch Sử & Văn Hóa
                        </h3>
                        <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted leading-relaxed">
                          Những dấu mốc lịch sử hào hùng, phong tục tập quán và các nền văn minh cổ đại trên thế giới.
                        </p>
                      </div>
                      <div className="pt-4 border-t border-paper-border/60 dark:border-night-border/60 flex items-center justify-between text-xs font-bold text-ink dark:text-night-muted font-metadata-spec">
                        <span>Khám phá sách</span>
                        <i className="ph-bold ph-arrow-right group-hover:translate-x-1 transition-transform"></i>
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            </div>
          </section>

          {/* ========================================================
             LỜI MỜI KHÁM PHÁ, ĐỐI TÁC VÀ FOOTER
             Theme: “Cuốn sách tiếp theo của bạn đang chờ.”
             Visual Hook: FINAL ASSEMBLY & SEAMLESS PARTNERS
             ======================================================== */}

          {/* A. Lời mời khám phá */}
          <section id="invitation-section" className="chapter-ambient-wrapper ambient-glow-a chapter-divider pt-8 pb-8 lg:pt-10 lg:pb-10 bg-paper dark:bg-night-bg text-center transition-colors">
            <div id="invitation-content" className="max-w-4xl mx-auto px-4 sm:px-6">
              <span className="font-metadata-spec text-xs font-bold tracking-[0.25em] text-wine dark:text-gold uppercase block mb-2.5">
                LỜI MỜI KHÁM PHÁ
              </span>
              <h2 className="font-display-hero text-3xl sm:text-4xl lg:text-5xl font-black text-ink dark:text-night-text leading-tight">
                CUỐN SÁCH TIẾP THEO CỦA BẠN<br />
                <span className="text-wine dark:text-gold">ĐANG CHỜ ĐƯỢC MỞ RA.</span>
              </h2>
              <p className="font-editorial-body text-base sm:text-lg text-ink-muted dark:text-night-muted max-w-2xl mx-auto mt-3.5 leading-relaxed">
                Bắt đầu hành trình khám phá tri thức cùng HALM BOOK. Mở ra trang sách yêu thích hoặc trò chuyện cùng trợ lý AI thông minh để tìm thấy chân trời mới.
              </p>
              <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="#trending-section" className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-wine hover:bg-wine-dark text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all">
                  Bắt đầu khám phá
                </a>
                <a href="#chapter-0-broadcast" className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-surface text-ink dark:text-night-text font-bold text-xs uppercase tracking-wider transition-all">
                  Khám phá thư viện
                </a>
              </div>
            </div>
          </section>

          {/* B. Khu vực đối tác Nhà xuất bản */}
          <section id="publishers-section" className="chapter-ambient-wrapper ambient-glow-b py-10 lg:py-12 bg-paper dark:bg-night-bg overflow-hidden transition-colors" aria-label="Các nhà xuất bản đối tác">
            <div id="publishers-content" className="max-w-7xl mx-auto px-4 sm:px-6 mb-6 text-center">
              <h3 className="font-display font-black text-xl sm:text-2xl text-ink dark:text-night-text uppercase tracking-wide">
                ĐỒNG HÀNH CÙNG NHỮNG NGƯỜI LAN TỎA TRI THỨC
              </h3>
              <p className="font-editorial-body text-xs sm:text-sm text-ink-muted dark:text-night-muted mt-1 max-w-xl mx-auto">
                HALM BOOK hướng đến việc xây dựng một không gian đọc trực tuyến thuận tiện, nơi độc giả có thể khám phá sách và tiếp cận tri thức.
              </p>
            </div>

            {/* Smooth Infinite Publisher Marquee */}
            <div className="w-full overflow-hidden py-4">
              <div className="publisher-marquee flex items-center">
                {/* Group 1 */}
                <div className="flex items-center shrink-0 space-x-16 px-8">
                  <div className="h-16 w-48 flex items-center justify-center opacity-85 hover:opacity-100 transition-opacity">
                    <img src="/logo.png" alt="HALM Partner" className="max-h-12 max-w-full object-contain filter dark:brightness-125" onError={(event) => applyImageFallback(event, '/logo.png')} />
                  </div>
                  <div className="h-16 w-48 flex items-center justify-center opacity-85 hover:opacity-100 transition-opacity">
                    <img src="/logo.png" alt="HALM Partner" className="max-h-12 max-w-full object-contain filter dark:brightness-125" onError={(event) => applyImageFallback(event, '/logo.png')} />
                  </div>
                  <div className="h-16 w-48 flex items-center justify-center opacity-85 hover:opacity-100 transition-opacity">
                    <img src="/logo.png" alt="HALM Publishing" className="max-h-12 max-w-full object-contain" onError={(event) => applyImageFallback(event, '/logo.png')} />
                  </div>
                  <div className="h-16 w-48 flex items-center justify-center opacity-85 hover:opacity-100 transition-opacity">
                    <img src="/logo.png" alt="HALM Partner" className="max-h-12 max-w-full object-contain filter dark:brightness-125" onError={(event) => applyImageFallback(event, '/logo.png')} />
                  </div>
                  <div className="h-16 w-48 flex items-center justify-center opacity-85 hover:opacity-100 transition-opacity">
                    <img src="/logo.png" alt="HALM Partner" className="max-h-12 max-w-full object-contain filter dark:brightness-125" onError={(event) => applyImageFallback(event, '/logo.png')} />
                  </div>
                </div>
                {/* Group 2 for seamless loop */}
                <div className="flex items-center shrink-0 space-x-16 px-8" aria-hidden="true">
                  <div className="h-16 w-48 flex items-center justify-center opacity-85 hover:opacity-100 transition-opacity">
                    <img src="/logo.png" alt="HALM Partner" className="max-h-12 max-w-full object-contain filter dark:brightness-125" onError={(event) => applyImageFallback(event, '/logo.png')} />
                  </div>
                  <div className="h-16 w-48 flex items-center justify-center opacity-85 hover:opacity-100 transition-opacity">
                    <img src="/logo.png" alt="HALM Partner" className="max-h-12 max-w-full object-contain filter dark:brightness-125" onError={(event) => applyImageFallback(event, '/logo.png')} />
                  </div>
                  <div className="h-16 w-48 flex items-center justify-center opacity-85 hover:opacity-100 transition-opacity">
                    <img src="/logo.png" alt="HALM Publishing" className="max-h-12 max-w-full object-contain" onError={(event) => applyImageFallback(event, '/logo.png')} />
                  </div>
                  <div className="h-16 w-48 flex items-center justify-center opacity-85 hover:opacity-100 transition-opacity">
                    <img src="/logo.png" alt="HALM Partner" className="max-h-12 max-w-full object-contain filter dark:brightness-125" onError={(event) => applyImageFallback(event, '/logo.png')} />
                  </div>
                  <div className="h-16 w-48 flex items-center justify-center opacity-85 hover:opacity-100 transition-opacity">
                    <img src="/logo.png" alt="HALM Partner" className="max-h-12 max-w-full object-contain filter dark:brightness-125" onError={(event) => applyImageFallback(event, '/logo.png')} />
                  </div>
                </div>
              </div>
            </div>
          </section>

        </main>

        {/* ======================================================= */}
        {/* 2. PHẦN FOOTER (CHÂN TRANG) - VERSION 2                 */}
        {/* ======================================================= */}



        {/* ========================================================
         CHATBOT AI WIDGET (BẢO TOÀN TOÀN BỘ CHỨC NĂNG)
         ======================================================== */}
        <div id="chatbot-container" className="fixed bottom-6 right-10 z-50">

          {/* 1. ĐIỀU KIỆN HIỂN THỊ CỬA SỔ CHAT */}
          {isOpen && (
            <div id="chat-window" className="w-110 bg-[#181916] rounded-xl shadow-2xl overflow-hidden flex flex-col mb-16 border border-night-border h-140">

              {/* Header */}
              <div className="bg-gradient-to-r from-wine to-wine-light text-white px-5 py-3.5 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center"><i className="ph-bold ph-sparkle"></i></span>
                  <div>
                    <p className="font-bold text-[16px]">Trợ lý HALM BOOK</p>
                    <p className="text-[12px] text-white/75">Tư vấn sách cùng bạn</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <button onClick={handleClearChat} className="hover:text-gold transition-colors" aria-label="Xóa hội thoại">
                    <i className="ph-bold ph-arrows-clockwise text-lg"></i>
                  </button>
                  {/* Nút đóng chat */}
                  <button onClick={() => setIsOpen(false)} className="hover:text-gold transition-colors">
                    <i className="ph-bold ph-x text-lg"></i>
                  </button>
                </div>
              </div>

              {/* Body Message Thread */}
              <div
                className="flex-grow overflow-y-auto p-4 flex flex-col relative space-y-3"
                style={{ fontSize: CHAT_MESSAGE_FONT_SIZE }}
              >

                {/* Nếu chưa có tin nhắn nào -> Hiện Welcome View */}
                {messages.length === 0 && (
                  <div id="chat-welcome" className="text-center py-6 space-y-3">
                    <div className="mx-auto w-17 h-17 rounded-full bg-wine/20 text-gold flex items-center justify-center">
                      <i className="ph-bold ph-sparkle text-xl"></i>
                    </div>
                    <p className="text-white font-bold">Xin chào! Tôi có thể giúp gì?</p>

                    <div className="space-y-2 pt-2 text-left font-metadata-spec">
                      {/* Bắt sự kiện bấm vào câu hỏi gợi ý */}
                      <button onClick={() => handleSendMessage("Gợi ý sách phát triển bản thân?")} className="suggestion-btn w-full p-2.5 rounded-xl bg-night-card hover:bg-night-border border border-night-border text-xs text-white flex items-center justify-between transition-colors">
                        <span>Gợi ý sách phát triển bản thân?</span>
                        <i className="ph-bold ph-arrow-right text-gold"></i>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. RENDER VÒNG LẶP TIN NHẮN */}
                {messages.map((msg, index) => (
                  <div key={index} className={`max-w-[85%] p-3 rounded-xl ${msg.sender === 'user' ? 'bg-wine text-white self-end rounded-tr-sm' : 'bg-night-card text-gray-200 border border-night-border self-start rounded-tl-sm'}`}>
                    {msg.text}
                  </div>
                ))}

                {/* Hiệu ứng loading khi chờ API */}
                {isLoading && <div className="text-gray-400 text-[10px] italic self-start">AI đang suy nghĩ...</div>}
              </div>

              {/* 3. KHU VỰC NHẬP LIỆU */}
              <div className="p-3 bg-[#141512] border-t border-night-border shrink-0">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} // Gửi khi ấn Enter
                    disabled={isLoading}
                    placeholder="Nhập câu hỏi của bạn..."
                    className="w-full bg-night-card text-white placeholder-night-muted text-xs rounded-xl pl-3.5 pr-10 py-3 border border-night-border focus:outline-none focus:border-wine transition-colors font-metadata-spec"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={isLoading || !inputText.trim()}
                    className="absolute right-2 text-gold hover:text-white p-1.5 transition-colors"
                    aria-label="Gửi tin nhắn"
                  >
                    <i className="ph-bold ph-paper-plane-tilt text-lg"></i>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. NÚT KÍCH HOẠT CHAT BONG BÓNG */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-14 h-14 rounded-full bg-wine hover:bg-wine-dark text-white p-1 shadow-2xl flex items-center justify-center transition-transform hover:scale-105 absolute bottom-0 right-0"
          >
            <img src={logo} alt="Chatbot" className="w-full h-full rounded-full object-cover" />
          </button>
        </div>

        {/* ========================================================
         MODAL: CÀI ĐẶT TRẢI NGHIỆM ĐỘC GIẢ (EDITORIAL SETTINGS)
         ======================================================== */}
        <div id="settings-modal" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm hidden items-center justify-center p-4">
          <div className="bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-paper-border dark:border-night-border">
              <div className="flex items-center gap-2 text-wine dark:text-gold font-display font-black text-base">
                <i className="ph-bold ph-gear text-xl"></i>
                <span>Cài Đặt Trải Nghiệm</span>
              </div>
              <button type="button" onClick={(event) => { window.closeSettingsModal() }} className="text-ink-muted hover:text-ink dark:hover:text-white transition-colors" aria-label="Đóng cài đặt">
                <i className="ph-bold ph-x text-lg"></i>
              </button>
            </div>

            <div className="space-y-4">
              {/* Option: Cuộn theo từng mục */}
              <div className="p-4 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="font-display font-bold text-sm text-ink dark:text-night-text block">Cuộn theo từng mục</span>
                    <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted leading-relaxed">
                      Tự động chuyển đến từng khu vực nội dung khi cuộn.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                    <input type="checkbox" id="modal-auto-scroll-toggle" className="sr-only peer" defaultChecked onChange={(event) => { window.handleModalAutoScrollToggle(event.currentTarget.checked) }} />
                    <div className="w-12 h-6 bg-paper-200 dark:bg-night-card peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-night-text after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wine dark:peer-checked:bg-gold border border-paper-border dark:border-night-border transition-colors"></div>
                  </label>
                </div>
                <div className="pt-2 border-t border-paper-border/60 dark:border-night-border/60 flex items-center justify-between text-[11px] font-metadata-spec">
                  <span className="text-ink-muted dark:text-night-muted">Trạng thái:</span>
                  <span id="modal-auto-scroll-badge" className="font-bold text-wine dark:text-gold uppercase tracking-wider">Đang Bật (Mặc định)</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-wine/5 dark:bg-gold/10 border border-wine/20 dark:border-gold/25 flex items-start gap-2.5 text-xs text-ink dark:text-night-text font-editorial-body">
                <i className="ph-bold ph-info text-wine dark:text-gold text-base shrink-0 mt-0.5"></i>
                <span>Khi tắt, bạn có thể cuộn trang tự do bình thường theo tốc độ mong muốn. Hiệu ứng hoạt ảnh và hiển thị sách vẫn được bảo toàn.</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-paper-border dark:border-night-border">
              <a href="../settings.html" className="text-xs font-metadata-spec font-bold text-wine dark:text-gold hover:underline flex items-center gap-1">
                <span>Xem trang Cài đặt tài khoản</span>
                <i className="ph-bold ph-arrow-up-right text-[11px]"></i>
              </a>
              <button type="button" onClick={(event) => { window.closeSettingsModal() }} className="px-5 py-2 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold transition-colors shadow-sm">
                Xong
              </button>
            </div>
          </div>
        </div>
      </UserLayout>
    </>
  );
}