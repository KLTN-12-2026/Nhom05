import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './js/db.js';
import './js/admin-nav.js';

const loadedScripts = new Map();
const loadedStylesheets = new Set();

const ADMIN_STYLESHEETS = [
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&family=Inter:wght@400;500;600;700;800;900&display=swap',
  'https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css',
  'https://unpkg.com/@phosphor-icons/web@2.1.1/src/bold/style.css',
  'https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css',
  'https://unpkg.com/@phosphor-icons/web@2.1.1/src/duotone/style.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

const ADMIN_TAILWIND_CONFIG = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        'brand-blue': '#2563eb',
        slate: {
          850: '#152033',
          950: '#0b1329',
        }
      },
      fontFamily: {
        sans: ['Roboto', 'Inter', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      }
    }
  }
};

function loadExternalStylesheet(href) {
  if (loadedStylesheets.has(href) || document.querySelector(`link[href="${href}"]`)) {
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
  loadedStylesheets.add(href);
}

function loadExternalScript(src, id) {
  const cacheKey = id || src;
  if (loadedScripts.has(cacheKey)) {
    return loadedScripts.get(cacheKey);
  }

  const promise = new Promise((resolve, reject) => {
    if (id && document.getElementById(id)) {
      resolve();
      return;
    }
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    if (id) script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Không thể tải script quản trị: ${src}`));
    document.head.appendChild(script);
  });

  loadedScripts.set(cacheKey, promise);
  return promise;
}

export function useLegacyAdminPage(pageName, pageCode, needsChart = false) {
  const navigate = useNavigate();

  useEffect(() => {
    let disposed = false;
    window.__HALM_ADMIN_NAVIGATE__ = navigate;
    window.__HALM_ADMIN_REACT__ = true;

    async function initializePage() {
      // 1. Đảm bảo nạp đầy đủ Phosphor Icons, FontAwesome và Google Fonts cho Admin
      ADMIN_STYLESHEETS.forEach(loadExternalStylesheet);

      // 2. Nạp Tailwind CDN kèm cấu hình Admin
      if (!window.tailwind) {
        window.tailwind = {
          config: ADMIN_TAILWIND_CONFIG
        };
      } else if (!window.tailwind.config || !window.tailwind.config.theme?.extend?.colors?.['brand-blue']) {
        window.tailwind.config = ADMIN_TAILWIND_CONFIG;
      }

      try {
        await loadExternalScript('https://cdn.tailwindcss.com', 'admin-tailwind-cdn');
      } catch (err) {
        console.warn('Lỗi khi nạp Tailwind CDN:', err);
      }

      // 3. Nạp Chart.js nếu trang yêu cầu biểu đồ
      if (needsChart && !window.Chart) {
        await loadExternalScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js', 'admin-chartjs');
      }

      if (disposed) return;

      window.__HALM_ADMIN_PAGE__ = pageName;

      try {
        if (typeof window.renderAdminLayout === 'function') {
          window.renderAdminLayout();
        }
        if (pageCode && pageCode.trim()) {
          window.eval(pageCode);
        }
        document.dispatchEvent(new Event('DOMContentLoaded'));

        // Yêu cầu Tailwind CDN quét lại DOM để áp dụng styles cho các element vừa tạo
        if (window.tailwind && typeof window.tailwind.refresh === 'function') {
          window.tailwind.refresh();
        }
      } catch (error) {
        console.error(`Không thể khởi tạo trang quản trị ${pageName}.`, error);
      }

      // Smooth reveal chống FOUC
      requestAnimationFrame(() => {
        document.querySelectorAll('.admin-page-root').forEach(el => el.classList.add('admin-ready'));
      });
      setTimeout(() => {
        document.querySelectorAll('.admin-page-root').forEach(el => el.classList.add('admin-ready'));
      }, 80);
    }

    initializePage();

    return () => {
      disposed = true;
    };
  }, [pageName, pageCode, needsChart, navigate]);
}
