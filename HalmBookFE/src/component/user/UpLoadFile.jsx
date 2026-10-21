import React, { useEffect } from 'react';

export default function UploadEndPage() {
  useEffect(() => {
    document.body.setAttribute('data-bot-page', 'upload');
    if (window.__uploadEndPageInitialized) return;
    window.__uploadEndPageInitialized = true;

    const scripts =   [
    {
      "src": "https://cdn.tailwindcss.com"
    },
    {
      "code": "\n        tailwind.config = {\n            darkMode: 'class',\n            theme: {\n                extend: {\n                    fontFamily: {\n                        sans: ['var(--font-ui)', 'sans-serif'],\n                        display: ['var(--font-display)', 'sans-serif'],\n                        metadata: ['var(--font-metadata)', 'sans-serif'],\n                        editorial: ['var(--font-editorial)', 'sans-serif'],\n                        nunito: ['Nunito', 'sans-serif'],\n                    },\n                    colors: {\n                        paper: {\n                            50: '#FAF8F5',\n                            100: '#F5F2EB',\n                            200: '#EAE5D9',\n                            DEFAULT: '#F7F4EE',\n                            surface: '#FFFEFA',\n                            border: '#E3DDD0',\n                        },\n                        ink: {\n                            50: '#F5F5F4',\n                            300: '#A8A6A1',\n                            muted: '#66645E',\n                            DEFAULT: '#1E1F1D',\n                            pure: '#111210',\n                        },\n                        wine: {\n                            DEFAULT: '#8B4A3C',\n                            light: '#A85747',\n                            dark: '#6F252C',\n                        },\n                        gold: {\n                            DEFAULT: '#D4AF37',\n                            light: '#E5C048',\n                            dark: '#B8860B',\n                        },\n                        night: {\n                            bg: '#111210',\n                            surface: '#181916',\n                            card: '#20221E',\n                            border: '#2C2E29',\n                            text: '#EDE9DF',\n                            muted: '#96938B',\n                        }\n                    }\n                }\n            }\n        };\n    "
    },
    {
      "code": "\n        // --- 1. DARK MODE TOGGLE ---\n        const themeToggleBtn = document.getElementById('theme-toggle');\n        const themeIcon = document.getElementById('theme-icon');\n\n        function initTheme() {\n            const isDark = localStorage.getItem('halm_theme') === 'dark' || \n                           (!localStorage.getItem('halm_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);\n            if (isDark) {\n                document.documentElement.classList.add('dark');\n                if (themeIcon) {\n                    themeIcon.classList.remove('ph-moon');\n                    themeIcon.classList.add('ph-sun');\n                }\n            } else {\n                document.documentElement.classList.remove('dark');\n                if (themeIcon) {\n                    themeIcon.classList.remove('ph-sun');\n                    themeIcon.classList.add('ph-moon');\n                }\n            }\n        }\n\n        if (themeToggleBtn) {\n            themeToggleBtn.addEventListener('click', () => {\n                const isDark = document.documentElement.classList.toggle('dark');\n                localStorage.setItem('halm_theme', isDark ? 'dark' : 'light');\n                if (themeIcon) {\n                    if (isDark) {\n                        themeIcon.classList.remove('ph-moon');\n                        themeIcon.classList.add('ph-sun');\n                    } else {\n                        themeIcon.classList.remove('ph-sun');\n                        themeIcon.classList.add('ph-moon');\n                    }\n                }\n            });\n        }\n        initTheme();\n\n        // --- 2. DROPDOWN AVATAR & MOBILE MENU ---\n        function toggleAvatarMenu(e) {\n            if (e) e.stopPropagation();\n            const menu = document.getElementById('avatar-dropdown-menu');\n            const caret = document.getElementById('avatar-caret-icon');\n            if (menu) {\n                menu.classList.toggle('hidden');\n                if (caret) caret.classList.toggle('rotate-180');\n            }\n        }\n\n        function closeAvatarMenu() {\n            const menu = document.getElementById('avatar-dropdown-menu');\n            const caret = document.getElementById('avatar-caret-icon');\n            if (menu) menu.classList.add('hidden');\n            if (caret) caret.classList.remove('rotate-180');\n        }\n\n        function toggleMobileMenu() {\n            const drawer = document.getElementById('mobile-drawer');\n            if (drawer) drawer.classList.toggle('hidden');\n        }\n\n        document.addEventListener('click', (e) => {\n            const wrapper = document.getElementById('avatar-menu-wrapper');\n            if (wrapper && !wrapper.contains(e.target)) {\n                closeAvatarMenu();\n            }\n        });\n\n        // --- 3. TOAST NOTIFICATION ---\n        let toastTimeout = null;\n        function showToast(title, message, isSuccess = true) {\n            const toast = document.getElementById('toast-notification');\n            const titleEl = document.getElementById('toast-title');\n            const msgEl = document.getElementById('toast-message');\n            const iconEl = document.getElementById('toast-icon');\n\n            if (!toast) return;\n            if (titleEl) titleEl.textContent = title;\n            if (msgEl) msgEl.textContent = message;\n\n            if (iconEl) {\n                iconEl.innerHTML = isSuccess ? '<i class=\"ph-bold ph-check text-xl\"></i>' : '<i class=\"ph-bold ph-warning text-xl\"></i>';\n            }\n\n            toast.classList.add('show');\n            clearTimeout(toastTimeout);\n            toastTimeout = setTimeout(() => {\n                toast.classList.remove('show');\n            }, 3500);\n        }\n\n        // --- 4. DRAG & DROP VÀ XỬ LÝ TỆP TẢI LÊN ---\n        const dropZone = document.getElementById('drop-zone');\n        const fileInput = document.getElementById('book-file-input');\n\n        function triggerFileInput() {\n            if (fileInput) fileInput.click();\n        }\n\n        if (dropZone) {\n            ['dragenter', 'dragover'].forEach(eventName => {\n                dropZone.addEventListener(eventName, (e) => {\n                    e.preventDefault();\n                    e.stopPropagation();\n                    dropZone.classList.add('dragover');\n                }, false);\n            });\n\n            ['dragleave', 'drop'].forEach(eventName => {\n                dropZone.addEventListener(eventName, (e) => {\n                    e.preventDefault();\n                    e.stopPropagation();\n                    dropZone.classList.remove('dragover');\n                }, false);\n            });\n\n            dropZone.addEventListener('drop', (e) => {\n                const dt = e.dataTransfer;\n                const files = dt.files;\n                if (files && files.length > 0) {\n                    processUploadedFile(files[0]);\n                }\n            });\n        }\n\n        function handleFileSelect(e) {\n            const files = e.target.files;\n            if (files && files.length > 0) {\n                processUploadedFile(files[0]);\n            }\n        }\n\n        let uploadInterval = null;\n        let activeUploadedFile = null;\n\n        function processUploadedFile(file) {\n            activeUploadedFile = file;\n            const progressContainer = document.getElementById('file-progress-container');\n            const nameDisplay = document.getElementById('file-name-display');\n            const sizeDisplay = document.getElementById('file-size-display');\n            const percentDisplay = document.getElementById('file-percent-display');\n            const progressBar = document.getElementById('upload-progress-bar');\n            const statusBadge = document.getElementById('file-status-badge');\n            const typeIcon = document.getElementById('file-type-icon');\n            const readNowBtn = document.getElementById('read-now-btn');\n\n            if (progressContainer) progressContainer.classList.remove('hidden');\n            if (readNowBtn) readNowBtn.classList.add('hidden');\n            if (nameDisplay) nameDisplay.textContent = file.name;\n\n            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);\n            if (sizeDisplay) sizeDisplay.textContent = `0 MB / ${fileSizeMB} MB`;\n\n            // Cập nhật icon theo đuôi file\n            const ext = file.name.split('.').pop().toLowerCase();\n            if (typeIcon) {\n                if (ext === 'pdf') typeIcon.innerHTML = '<i class=\"ph-bold ph-file-pdf\"></i>';\n                else if (ext === 'epub' || ext === 'mobi') typeIcon.innerHTML = '<i class=\"ph-bold ph-book-open\"></i>';\n                else if (ext === 'docx') typeIcon.innerHTML = '<i class=\"ph-bold ph-file-doc\"></i>';\n                else typeIcon.innerHTML = '<i class=\"ph-bold ph-file-text\"></i>';\n            }\n\n            // Mô phỏng tiến trình tải lên và tích hợp\n            let currentPercent = 0;\n            clearInterval(uploadInterval);\n            if (progressBar) progressBar.style.width = '0%';\n            if (statusBadge) {\n                statusBadge.textContent = 'Đang tích hợp vào hệ sinh thái...';\n                statusBadge.className = 'px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold';\n            }\n\n            uploadInterval = setInterval(() => {\n                currentPercent += Math.floor(Math.random() * 20) + 12;\n                if (currentPercent >= 100) {\n                    currentPercent = 100;\n                    clearInterval(uploadInterval);\n                    if (statusBadge) {\n                        statusBadge.textContent = 'Sẵn sàng đọc ngay';\n                        statusBadge.className = 'px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold';\n                    }\n                    if (readNowBtn) {\n                        readNowBtn.classList.remove('hidden');\n                        readNowBtn.onclick = () => openReaderModal(file.name, 1, 120, ext.toUpperCase());\n                    }\n                    // Thêm tệp vào danh sách thư viện\n                    addNewFileToLibrary(file.name, ext.toUpperCase(), fileSizeMB);\n                    showToast('Tải Tệp Thành Công', `Đã chuyển đổi \"${file.name}\" vào hệ sinh thái đọc.`);\n                }\n\n                if (progressBar) progressBar.style.width = currentPercent + '%';\n                if (percentDisplay) percentDisplay.textContent = currentPercent + '%';\n                const uploadedMB = ((fileSizeMB * currentPercent) / 100).toFixed(1);\n                if (sizeDisplay) sizeDisplay.textContent = `${uploadedMB} MB / ${fileSizeMB} MB`;\n            }, 100);\n        }\n\n        function cancelUploadedFile() {\n            clearInterval(uploadInterval);\n            activeUploadedFile = null;\n            const progressContainer = document.getElementById('file-progress-container');\n            const fileInput = document.getElementById('book-file-input');\n            if (progressContainer) progressContainer.classList.add('hidden');\n            if (fileInput) fileInput.value = '';\n            showToast('Đã Hủy Tệp', 'Đã hủy thao tác tải tệp.');\n        }\n\n        function loadSampleBook() {\n            const sampleName = 'Tri_Thuc_Va_Tu_Duy_Moi.epub';\n            processUploadedFile({\n                name: sampleName,\n                size: 8.5 * 1024 * 1024\n            });\n        }\n\n        // --- 5. THÊM TỆP VÀO THƯ VIỆN & THAO TÁC (ĐỌC TIẾP, ĐỔI TÊN, XÓA) ---\n        let fileCounter = 4;\n        function addNewFileToLibrary(fileName, format, sizeMB) {\n            const grid = document.getElementById('library-grid');\n            if (!grid) return;\n\n            const newId = 'file-' + (fileCounter++);\n            const cleanTitle = fileName.replace(/\\.[^/.]+$/, '').replace(/[_-]/g, ' ');\n\n            let iconClass = 'ph-file-pdf';\n            let iconBg = 'bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400';\n            if (format === 'EPUB' || format === 'MOBI') {\n                iconClass = 'ph-book-open';\n                iconBg = 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400';\n            } else if (format === 'DOCX') {\n                iconClass = 'ph-file-doc';\n                iconBg = 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400';\n            } else {\n                iconClass = 'ph-file-text';\n                iconBg = 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';\n            }\n\n            const itemHtml = `\n                <div class=\"library-item p-5 rounded-2xl bg-[#FAF8F5] dark:bg-[#20221E] border border-[#E3DDD0] dark:border-[#2C2E29] hover:border-[#8B4A3C] dark:hover:border-[#D4AF37] transition-all flex flex-col justify-between shadow-sm group\" data-status=\"reading\" data-id=\"${newId}\">\n                    <div>\n                        <div class=\"flex items-start justify-between gap-3 mb-3\">\n                            <div class=\"w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center text-xl font-bold shrink-0\">\n                                <i class=\"ph-bold ${iconClass}\"></i>\n                            </div>\n                            <span class=\"px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] shrink-0\">\n                                Mới Tải Lên\n                            </span>\n                        </div>\n\n                        <h3 class=\"font-display font-bold text-sm text-[#1E1F1D] dark:text-[#EDE9DF] leading-snug line-clamp-2 file-title\" title=\"${cleanTitle}\">\n                            ${cleanTitle}\n                        </h3>\n\n                        <div class=\"text-[11px] text-[#85817A] dark:text-[#96938B] mt-1 space-y-0.5\">\n                            <div>Định dạng: <strong>${format}</strong> • Dung lượng: <strong>${sizeMB} MB</strong></div>\n                            <div>Trạng thái: <strong>Sẵn sàng đọc trang 1</strong></div>\n                        </div>\n\n                        <div class=\"w-full bg-[#EAE5D9] dark:bg-[#2C2E29] rounded-full h-1.5 mt-3 overflow-hidden\">\n                            <div class=\"bg-[#8B4A3C] dark:bg-[#D4AF37] h-full rounded-full\" style=\"width: 5%;\"></div>\n                        </div>\n                    </div>\n\n                    <div class=\"mt-5 pt-3 border-t border-[#E3DDD0]/70 dark:border-[#2C2E29] flex items-center justify-between gap-2\">\n                        <button type=\"button\" onclick=\"openReaderModal('${cleanTitle}', 1, 120, '${format}');\" class=\"flex-1 py-2 px-3 rounded-xl bg-[#8B4A3C] hover:bg-[#6F252C] dark:bg-[#D4AF37] dark:hover:bg-[#B8860B] text-white dark:text-[#111210] font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer\">\n                            <i class=\"ph-bold ph-book-open\"></i>\n                            <span>Đọc Ngay</span>\n                        </button>\n                        \n                        <div class=\"flex items-center gap-1 shrink-0\">\n                            <button type=\"button\" onclick=\"renameFile('${newId}');\" class=\"p-2 rounded-lg hover:bg-[#EAE5D9] dark:hover:bg-[#2C2E29] text-[#85817A] hover:text-[#1E1F1D] dark:hover:text-[#EDE9DF] transition-colors cursor-pointer\" title=\"Đổi tên tệp\">\n                                <i class=\"ph-bold ph-pencil-simple text-sm\"></i>\n                            </button>\n                            <button type=\"button\" onclick=\"deleteFile('${newId}');\" class=\"p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-[#85817A] hover:text-red-600 transition-colors cursor-pointer\" title=\"Xóa khỏi không gian\">\n                                <i class=\"ph-bold ph-trash text-sm\"></i>\n                            </button>\n                        </div>\n                    </div>\n                </div>\n            `;\n\n            grid.insertAdjacentHTML('afterbegin', itemHtml);\n            updateLibraryCounter();\n        }\n\n        function renameFile(fileId) {\n            const card = document.querySelector(`[data-id=\"${fileId}\"]`);\n            if (!card) return;\n            const titleEl = card.querySelector('.file-title');\n            if (!titleEl) return;\n\n            const currentTitle = titleEl.textContent.trim();\n            const newTitle = prompt('Nhập tên mới cho tài liệu của bạn:', currentTitle);\n            if (newTitle && newTitle.trim()) {\n                titleEl.textContent = newTitle.trim();\n                titleEl.title = newTitle.trim();\n                showToast('Đã Đổi Tên', `Tài liệu đã được cập nhật thành \"${newTitle.trim()}\".`);\n            }\n        }\n\n        function deleteFile(fileId) {\n            const card = document.querySelector(`[data-id=\"${fileId}\"]`);\n            if (!card) return;\n            const titleEl = card.querySelector('.file-title');\n            const title = titleEl ? titleEl.textContent.trim() : 'tài liệu này';\n\n            if (confirm(`Bạn có chắc chắn muốn xóa \"${title}\" khỏi không gian đọc cá nhân?`)) {\n                card.remove();\n                updateLibraryCounter();\n                showToast('Đã Xóa Tệp', `Đã loại bỏ \"${title}\" khỏi danh sách.`);\n            }\n        }\n\n        function updateLibraryCounter() {\n            const items = document.querySelectorAll('.library-item');\n            const badge = document.getElementById('library-count-badge');\n            if (badge) badge.textContent = `${items.length} Tệp`;\n        }\n\n        // --- 6. TÌM KIẾM & BỘ LỌC TRẠNG THÁI ---\n        function filterByStatus(status, event) {\n            const buttons = document.querySelectorAll('.filter-btn');\n            buttons.forEach(b => {\n                b.classList.remove('active', 'bg-[#8B4A3C]', 'dark:bg-[#D4AF37]', 'text-white', 'dark:text-[#111210]');\n                b.classList.add('bg-[#FAF8F5]', 'dark:bg-[#20221E]', 'text-[#1E1F1D]', 'dark:text-[#EDE9DF]');\n            });\n\n            event.currentTarget.classList.add('active', 'bg-[#8B4A3C]', 'dark:bg-[#D4AF37]', 'text-white', 'dark:text-[#111210]');\n            event.target.classList.remove('bg-[#FAF8F5]', 'dark:bg-[#20221E]', 'text-[#1E1F1D]', 'dark:text-[#EDE9DF]');\n\n            const items = document.querySelectorAll('.library-item');\n            items.forEach(item => {\n                if (status === 'all' || item.getAttribute('data-status') === status) {\n                    item.classList.remove('hidden');\n                } else {\n                    item.classList.add('hidden');\n                }\n            });\n        }\n\n        function filterLibrary(keyword) {\n            const q = keyword.toLowerCase().trim();\n            const items = document.querySelectorAll('.library-item');\n            items.forEach(item => {\n                const title = item.querySelector('.file-title')?.textContent.toLowerCase() || '';\n                if (!q || title.includes(q)) {\n                    item.classList.remove('hidden');\n                } else {\n                    item.classList.add('hidden');\n                }\n            });\n        }\n\n        // --- 7. TRÌNH ĐỌC SÁCH THỰC THI (READER MODAL LOGIC) ---\n        let currentReadingPage = 52;\n        let totalReadingPages = 115;\n        let currentFontSize = 100;\n        let isBookmarked = false;\n\n        function openReaderModal(title, page, total, format) {\n            currentReadingPage = page || 1;\n            totalReadingPages = total || 100;\n            isBookmarked = false;\n\n            const modal = document.getElementById('reader-modal');\n            const titleEl = document.getElementById('reader-book-title');\n            const indicatorEl = document.getElementById('reader-page-indicator');\n            const counterEl = document.getElementById('bottom-page-counter');\n            const chapterTitle = document.getElementById('reader-chapter-title');\n\n            if (titleEl) titleEl.textContent = title;\n            if (indicatorEl) indicatorEl.textContent = `Trang ${currentReadingPage} / ${totalReadingPages} • Định dạng ${format || 'PDF'}`;\n            if (counterEl) counterEl.textContent = `Trang ${currentReadingPage} / ${totalReadingPages}`;\n            if (chapterTitle) chapterTitle.textContent = title;\n\n            updateBookmarkUI();\n            if (modal) {\n                modal.classList.remove('hidden');\n                document.body.style.overflow = 'hidden';\n            }\n        }\n\n        function closeReaderModal() {\n            const modal = document.getElementById('reader-modal');\n            if (modal) {\n                modal.classList.add('hidden');\n                document.body.style.overflow = '';\n            }\n        }\n\n        function changePage(delta) {\n            currentReadingPage += delta;\n            if (currentReadingPage < 1) currentReadingPage = 1;\n            if (currentReadingPage > totalReadingPages) currentReadingPage = totalReadingPages;\n\n            const counterEl = document.getElementById('bottom-page-counter');\n            const indicatorEl = document.getElementById('reader-page-indicator');\n            if (counterEl) counterEl.textContent = `Trang ${currentReadingPage} / ${totalReadingPages}`;\n            if (indicatorEl) indicatorEl.textContent = `Trang ${currentReadingPage} / ${totalReadingPages} • Chế độ xem chuẩn Editorial`;\n\n            const canvas = document.getElementById('reader-canvas');\n            if (canvas) canvas.scrollTop = 0;\n        }\n\n        function onSliderPageChange(val) {\n            currentReadingPage = parseInt(val, 10);\n            const counterEl = document.getElementById('bottom-page-counter');\n            const indicatorEl = document.getElementById('reader-page-indicator');\n            if (counterEl) counterEl.textContent = `Trang ${currentReadingPage} / ${totalReadingPages}`;\n            if (indicatorEl) indicatorEl.textContent = `Trang ${currentReadingPage} / ${totalReadingPages} • Chế độ xem chuẩn Editorial`;\n        }\n\n        function jumpToChapter(chNum) {\n            const chapterNames = [\n                'Chương I: Đặt Vấn Đề & Khởi Nguồn',\n                'Chương II: Lý Thuyết Hành Vi Ra Quyết Định',\n                'Chương III: Thực Nghiệm & Kết Quả Phân Tích',\n                'Chương IV: Ứng Dụng Trong Đời Sống Hiện Đại',\n                'Tổng Kết & Danh Mục Tài Liệu Tham Khảo'\n            ];\n            const chTitle = document.getElementById('reader-chapter-title');\n            if (chTitle && chapterNames[chNum - 1]) {\n                chTitle.textContent = chapterNames[chNum - 1];\n            }\n            currentReadingPage = chNum * 22;\n            changePage(0);\n            showToast('Chuyển Chương', `Đang đọc: ${chapterNames[chNum - 1]}`);\n        }\n\n        function adjustFontSize(delta) {\n            currentFontSize += delta * 10;\n            if (currentFontSize < 70) currentFontSize = 70;\n            if (currentFontSize > 150) currentFontSize = 150;\n\n            const label = document.getElementById('font-size-label');\n            const textContainer = document.getElementById('reader-paragraphs');\n            if (label) label.textContent = currentFontSize + '%';\n            if (textContainer) textContainer.style.fontSize = (currentFontSize / 100) * 1.1 + 'rem';\n        }\n\n        function setReaderTheme(mode) {\n            const canvas = document.getElementById('reader-canvas');\n            if (!canvas) return;\n            if (mode === 'white') {\n                canvas.style.backgroundColor = '#FFFFFF';\n                canvas.style.color = '#1E1F1D';\n            } else if (mode === 'sepia') {\n                canvas.style.backgroundColor = '#F4ECD8';\n                canvas.style.color = '#382B1E';\n            } else if (mode === 'dark') {\n                canvas.style.backgroundColor = '#181916';\n                canvas.style.color = '#EDE9DF';\n            }\n        }\n\n        function toggleBookmark() {\n            isBookmarked = !isBookmarked;\n            updateBookmarkUI();\n            if (isBookmarked) {\n                showToast('Đã Lưu Dấu Trang', `Đã đánh dấu Trang ${currentReadingPage}. Tiến độ được đồng bộ vào hệ thống.`);\n            } else {\n                showToast('Đã Bỏ Dấu Trang', 'Đã hủy đánh dấu trang này.');\n            }\n        }\n\n        function updateBookmarkUI() {\n            const icon = document.getElementById('bookmark-icon');\n            if (icon) {\n                if (isBookmarked) {\n                    icon.className = 'ph-fill ph-bookmark-simple text-lg text-[#8B4A3C] dark:text-[#D4AF37]';\n                } else {\n                    icon.className = 'ph-bold ph-bookmark-simple text-lg';\n                }\n            }\n        }\n    "
    },
    {
      "src": "notification.js"
    },
    {
      "src": "chatbot.js"
    },
    {
      "src": "header.js"
    },
    {
      "src": "chatbot.js"
    }
  ];
  const tailwindConfig = scripts.find((definition) => definition.code?.includes('tailwind.config ='));
  if (tailwindConfig) {
    window.tailwind = window.tailwind || {};
    const configScript = document.createElement('script');
    configScript.textContent = tailwindConfig.code;
    document.head.appendChild(configScript);
  }

  const loadScripts = async () => {
    for (const definition of scripts) {
      const script = document.createElement('script');
        if (definition.src) {
          script.src = definition.src;
          script.async = false;
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = () => reject(new Error('Unable to load ' + script.src));
            document.head.appendChild(script);
          });
        } else {
          script.textContent = definition.code;
          document.body.appendChild(script);
        }
      }
    };

    loadScripts().catch((error) => {
      console.error('Failed to initialize the upload page.', error);
    });
  }, []);

  return (
    <>
      <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>HALM BOOK — Không Gian Đọc & Trình Xử Lý Tệp Cá Nhân</title>
          <meta name="description" content="Tải tệp PDF, EPUB, DOCX cá nhân lên hệ sinh thái HALM BOOK để trải nghiệm trình đọc sách chuẩn xuất bản: đồng bộ tiến độ, chỉnh giao diện đọc, tóm tắt chương với AI PotatoBot." />
      
          {/* STRICT FONT SYSTEM: ONLY INTER, ROBOTO, OPEN SANS, NUNITO */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Nunito:wght@400;600;700;800;900&family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600&family=Roboto:wght@300;400;500;700;900&display=swap" rel="stylesheet" />
      
          {/* Tailwind CSS CDN */}
          
      
          {/* Icons: Phosphor Icons & Font Awesome */}
          <link rel="stylesheet" type="text/css" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/bold/style.css" />
          <link rel="stylesheet" type="text/css" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css" />
          <link rel="stylesheet" type="text/css" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css" />
          <link rel="stylesheet" type="text/css" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/duotone/style.css" />
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      
          
      
          <style dangerouslySetInnerHTML={{ __html: "\n        :root {\n            --font-display: \"Inter\", sans-serif;\n            --font-ui: \"Inter\", sans-serif;\n            --font-metadata: \"Roboto\", sans-serif;\n            --font-editorial: \"Open Sans\", sans-serif;\n        }\n\n        html {\n            scroll-behavior: smooth;\n        }\n\n        body {\n            font-family: var(--font-ui);\n            background-color: #F7F4EE;\n            color: #1E1F1D;\n            overflow-x: hidden;\n            -webkit-font-smoothing: antialiased;\n            transition: background-color 0.4s ease, color 0.4s ease;\n        }\n\n        .dark body {\n            background-color: #111210;\n            color: #EDE9DF;\n        }\n\n        .font-display-hero {\n            font-family: var(--font-display);\n            font-weight: 900;\n            letter-spacing: -0.03em;\n        }\n\n        .font-editorial-body {\n            font-family: var(--font-editorial);\n            line-height: 1.7;\n        }\n\n        .font-metadata-spec {\n            font-family: var(--font-metadata);\n        }\n\n        /* Paper grain texture */\n        .paper-grain {\n            background-image: radial-gradient(rgba(30, 31, 29, 0.04) 1px, transparent 1px);\n            background-size: 28px 28px;\n        }\n        .dark .paper-grain {\n            background-image: radial-gradient(rgba(237, 233, 223, 0.04) 1px, transparent 1px);\n            background-size: 28px 28px;\n        }\n\n        /* Starry sky overlay for dark mode */\n        #starry-background {\n            position: fixed;\n            top: 0;\n            left: 0;\n            width: 100%;\n            height: 100%;\n            pointer-events: none;\n            z-index: 1;\n            opacity: 0;\n            transition: opacity 0.6s ease;\n        }\n        .dark #starry-background {\n            opacity: 1;\n        }\n\n        /* Drag and Drop Zone */\n        .upload-dropzone {\n            border: 2px dashed rgba(139, 74, 60, 0.38);\n            background: rgba(255, 254, 250, 0.9);\n            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);\n        }\n        .dark .upload-dropzone {\n            border-color: rgba(212, 175, 55, 0.45);\n            background: rgba(32, 34, 30, 0.9);\n        }\n        .upload-dropzone.dragover {\n            border-color: #8B4A3C;\n            background: rgba(139, 74, 60, 0.08);\n            transform: scale(1.01);\n            box-shadow: 0 0 30px rgba(139, 74, 60, 0.25);\n        }\n        .dark .upload-dropzone.dragover {\n            border-color: #D4AF37;\n            background: rgba(212, 175, 55, 0.15);\n            box-shadow: 0 0 30px rgba(212, 175, 55, 0.3);\n        }\n\n        /* Toast Container */\n        #toast-notification {\n            position: fixed;\n            top: 24px;\n            right: 24px;\n            z-index: 9999;\n            transform: translateX(130%);\n            transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);\n        }\n        #toast-notification.show {\n            transform: translateX(0);\n        }\n\n        /* Reader View Custom Scrollbar */\n        .reader-scroll::-webkit-scrollbar {\n            width: 6px;\n        }\n        .reader-scroll::-webkit-scrollbar-thumb {\n            background-color: rgba(139, 74, 60, 0.25);\n            border-radius: 9999px;\n        }\n        .dark .reader-scroll::-webkit-scrollbar-thumb {\n            background-color: rgba(212, 175, 55, 0.3);\n        }\n    " }} />
      <div className="paper-grain relative min-h-screen flex flex-col">
        {/* Starry background in Dark Mode */}
            <div id="starry-background"></div>
        
            {/* Toast Notification */}
            <div id="toast-notification" className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-[#FFFEFA] dark:bg-[#181916] border border-[#8B4A3C]/30 dark:border-[#D4AF37]/40 shadow-2xl text-[#1E1F1D] dark:text-[#EDE9DF]">
                <div className="w-9 h-9 rounded-full bg-[#8B4A3C]/10 dark:bg-[#D4AF37]/20 flex items-center justify-center text-[#8B4A3C] dark:text-[#D4AF37] shrink-0" id="toast-icon">
                    <i className="ph-bold ph-check text-xl"></i>
                </div>
                <div>
                    <div className="font-display font-bold text-xs" id="toast-title">Thông Báo Hệ Sinh Thái</div>
                    <div className="font-editorial-body text-xs text-[#66645E] dark:text-[#96938B]" id="toast-message">Đã xử lý thao tác thành công.</div>
                </div>
            </div>
        
            {/* ========================================================
                 NAVBAR: HEADER CHUẨN HALM BOOK EDITORIAL
                 ======================================================== */}
            <header id="navbar" className="fixed top-0 inset-x-0 z-40 transition-all duration-300 py-3.5 border-b bg-[#FAF8F5]/95 dark:bg-[#111210]/95 backdrop-blur-md border-[#E3DDD0] dark:border-[#2C2E29]">
                <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-4 font-nunito">
                    
                    {/* 1. Logo & Thương Hiệu */}
                    <div className="flex items-center shrink-0">
                        <a href="home_end.html" className="flex items-center gap-2.5 group" aria-label="HALM BOOK Trang Chủ">
                            <img src="img/icon-removebg-preview.png" alt="Halm Book Logo" className="w-10 h-10 sm:w-11 sm:h-11 object-contain group-hover:rotate-[-6deg] group-hover:scale-105 transition-transform duration-300 origin-bottom-left" onError={(event) => { event.currentTarget.src='./image/LOGO HALM BOOK/logo.png' }} />
                            <div className="flex flex-col">
                                <span className="tracking-tight uppercase text-2xl sm:text-[26px] font-black text-[#8B4A3C] dark:text-[#EDE9DF] group-hover:text-[#6F252C] dark:group-hover:text-[#D4AF37] transition-all font-nunito leading-none">HALM BOOK</span>
                                <span className="font-metadata-spec text-[8.5px] sm:text-[9.5px] uppercase tracking-[0.28em] text-[#85817A] dark:text-[#96938B] font-extrabold mt-1">Tuyển Tập Tri Thức</span>
                            </div>
                        </a>
                    </div>
        
                    {/* 2. Khu Vực Giữa: Danh Mục Dropdown + Ô Tìm Kiếm Nhanh */}
                    <div className="flex-1 flex items-center justify-center gap-2.5 sm:gap-3 px-4 sm:px-6 lg:px-8 min-w-0 hidden sm:flex">
                        
                        {/* Nút Danh Mục Dropdown (Ổn định tuyệt đối, Không thanh cuộn, Bỏ Tất Cả) */}
                        <div className="relative shrink-0" id="category-nav-wrapper">
                            <button id="category-nav-btn" type="button" onClick={(event) => { window.toggleCategoryDropdown(event); }} className="flex items-center justify-center gap-1.5 text-[#8B4A3C] dark:text-[#E5A93C] transition-all px-3 sm:px-3.5 py-1.5 rounded-full border border-[#D4AF37] dark:border-[#E5A93C] bg-[#D4AF37]/15 dark:bg-[#E5A93C]/10 hover:bg-[#D4AF37]/25 dark:hover:bg-[#E5A93C]/20 shadow-sm cursor-pointer" aria-label="Danh mục sách" aria-expanded="false" title="Danh mục sách">
                                <i className="ph-bold ph-squares-four text-lg transition-colors"></i>
                                <span className="text-[13px] sm:text-[14px] font-bold hidden md:inline">Danh Mục</span>
                                <i className="ph-bold ph-caret-down text-[10px] transition-transform duration-200" id="category-caret-icon"></i>
                            </button>
                            {/* Dropdown Menu với Padding-Top Bridge (Không bị gián đoạn hover, 2 cột gọn gàng, 0 scrollbar) */}
                            <div id="category-dropdown-wrapper" className="opacity-0 pointer-events-none translate-y-2 absolute left-0 top-full pt-2.5 z-50 transition-all duration-200">
                                <div className="w-[460px] sm:w-[500px] bg-[#FFFEFA] dark:bg-[#181916] rounded-2xl shadow-2xl border border-[#E6E1D8] dark:border-[#2C2E29] p-3 font-nunito overflow-hidden">
                                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#85817A] dark:text-[#96938B] px-2.5 py-1.5 border-b border-[#E6E1D8]/60 dark:border-[#2C2E29] mb-2 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5"><i className="ph-bold ph-books text-wine dark:text-gold"></i> Tuyển Tập Tri Thức</span>
                                        <span className="text-[9px] font-bold text-wine dark:text-gold">10 Chủ Đề</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <a href="category_end.html?category=trending" onClick={(event) => { window.handleCategoryNav(event, 'trending') }} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-[#242321] dark:text-[#EDE9DF] hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors group/item">
                                            <i className="ph-bold ph-trend-up text-[#85817A] group-hover/item:text-[#8B4A3C] dark:group-hover/item:text-[#D4AF37] transition-colors text-sm shrink-0"></i>
                                            <span className="truncate">Sách Thịnh Hành</span>
                                        </a>
                                        <a href="category_end.html?category=business" onClick={(event) => { window.handleCategoryNav(event, 'business') }} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-[#242321] dark:text-[#EDE9DF] hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors group/item">
                                            <i className="ph-bold ph-chart-line text-[#85817A] group-hover/item:text-[#8B4A3C] dark:group-hover/item:text-[#D4AF37] transition-colors text-sm shrink-0"></i>
                                            <span className="truncate">Kinh Tế & Quản Trị</span>
                                        </a>
                                        <a href="category_end.html?category=children" onClick={(event) => { window.handleCategoryNav(event, 'children') }} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-[#242321] dark:text-[#EDE9DF] hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors group/item">
                                            <i className="ph-bold ph-sparkle text-[#85817A] group-hover/item:text-[#8B4A3C] dark:group-hover/item:text-[#D4AF37] transition-colors text-sm shrink-0"></i>
                                            <span className="truncate">Thế Giới Tuổi Thơ</span>
                                        </a>
                                        <a href="category_end.html?category=history" onClick={(event) => { window.handleCategoryNav(event, 'history') }} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-[#242321] dark:text-[#EDE9DF] hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors group/item">
                                            <i className="ph-bold ph-hourglass-high text-[#85817A] group-hover/item:text-[#8B4A3C] dark:group-hover/item:text-[#D4AF37] transition-colors text-sm shrink-0"></i>
                                            <span className="truncate">Lịch Sử & Xã Hội</span>
                                        </a>
                                        <a href="category_end.html?category=literature" onClick={(event) => { window.handleCategoryNav(event, 'literature') }} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-[#242321] dark:text-[#EDE9DF] hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors group/item">
                                            <i className="ph-bold ph-book-open text-[#85817A] group-hover/item:text-[#8B4A3C] dark:group-hover/item:text-[#D4AF37] transition-colors text-sm shrink-0"></i>
                                            <span className="truncate">Văn Học & Nghệ Thuật</span>
                                        </a>
                                        <a href="category_end.html?category=philosophy" onClick={(event) => { window.handleCategoryNav(event, 'philosophy') }} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-[#242321] dark:text-[#EDE9DF] hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors group/item">
                                            <i className="ph-bold ph-brain text-[#85817A] group-hover/item:text-[#8B4A3C] dark:group-hover/item:text-[#D4AF37] transition-colors text-sm shrink-0"></i>
                                            <span className="truncate">Triết Học & Tư Tưởng</span>
                                        </a>
                                        <a href="category_end.html?category=selfgrowth" onClick={(event) => { window.handleCategoryNav(event, 'selfgrowth') }} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-[#242321] dark:text-[#EDE9DF] hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors group/item">
                                            <i className="ph-bold ph-compass text-[#85817A] group-hover/item:text-[#8B4A3C] dark:group-hover/item:text-[#D4AF37] transition-colors text-sm shrink-0"></i>
                                            <span className="truncate">Phát Triển Bản Thân</span>
                                        </a>
                                        <a href="category_end.html?category=artlifestyle" onClick={(event) => { window.handleCategoryNav(event, 'artlifestyle') }} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-[#242321] dark:text-[#EDE9DF] hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors group/item">
                                            <i className="ph-bold ph-palette text-[#85817A] group-hover/item:text-[#8B4A3C] dark:group-hover/item:text-[#D4AF37] transition-colors text-sm shrink-0"></i>
                                            <span className="truncate">Nghệ Thuật & Phong Cách Sống</span>
                                        </a>
                                        <a href="category_end.html?category=science" onClick={(event) => { window.handleCategoryNav(event, 'science') }} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-[#242321] dark:text-[#EDE9DF] hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors group/item">
                                            <i className="ph-bold ph-atom text-[#85817A] group-hover/item:text-[#8B4A3C] dark:group-hover/item:text-[#D4AF37] transition-colors text-sm shrink-0"></i>
                                            <span className="truncate">Khoa Học & Công Nghệ</span>
                                        </a>
                                        <a href="category_end.html?category=biography" onClick={(event) => { window.handleCategoryNav(event, 'biography') }} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-[#242321] dark:text-[#EDE9DF] hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors group/item">
                                            <i className="ph-bold ph-user-focus text-[#85817A] group-hover/item:text-[#8B4A3C] dark:group-hover/item:text-[#D4AF37] transition-colors text-sm shrink-0"></i>
                                            <span className="truncate">Tiểu Sử & Hồi Ký</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
        
                        {/* Ô Tìm Kiếm Sách */}
                        <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl relative">
                            <div className="relative flex items-center w-full">
                                <i className="ph-bold ph-magnifying-glass absolute left-3.5 text-[#8B4A3C] dark:text-[#E5A93C] text-sm pointer-events-none"></i>
                                <input type="text" id="header-search-input" placeholder="Tìm tác phẩm, tác giả hoặc chủ đề..." onInput={(event) => { if(typeof window.handleSearch === 'function'){ window.handleSearch(event.currentTarget.value); } else if(window.handleGlobalHeaderSearch){ window.handleGlobalHeaderSearch(event.currentTarget.value); } }} className="w-full pl-9 pr-10 py-1.5 sm:py-2 rounded-full border border-[#D4AF37] dark:border-[#E5A93C] bg-[#FAF8F5]/90 dark:bg-[#181916]/90 focus:outline-none focus:border-[#8B4A3C] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 text-[#242321] dark:text-[#EDE9DF] placeholder-[#85817A] transition-all font-medium text-xs shadow-sm" autoComplete="off" />
                                <button type="button" id="clear-search-btn" className="hidden absolute right-3 text-[#85817A] hover:text-[#8B4A3C] dark:hover:text-[#E5A93C]" onClick={(event) => { if(typeof window.clearSearch === 'function'){ window.clearSearch(); } else if(window.clearGlobalHeaderSearch){ window.clearGlobalHeaderSearch(); } }}>
                                    <i className="ph-bold ph-x text-xs"></i>
                                </button>
                            </div>
                            {/* Live Search Popup */}
                            <div id="header-search-results" className="hidden absolute top-full mt-2 inset-x-0 bg-[#FFFEFA] dark:bg-[#181916] rounded-2xl shadow-2xl border border-[#E6E1D8] dark:border-[#2C2E29] p-2.5 z-50 max-h-80 overflow-y-auto font-nunito"></div>
                        </div>
                    </div>
        
                    {/* 3. Khu Vực Phải: Hành Động & Tài Khoản */}
                    <div className="flex items-center justify-end gap-2.5 sm:gap-3 lg:gap-3.5 shrink-0">
                        
                        {/* Nút Ưu Đãi */}
                        <a href="offers_end.html" id="header-offers-btn" className="flex items-center gap-1.5 py-1.5 px-3 sm:px-3.5 rounded-full border border-[#D4AF37] dark:border-[#E5A93C] text-[#8B4A3C] dark:text-[#E5A93C] bg-[#D4AF37]/15 dark:bg-[#E5A93C]/10 hover:bg-[#D4AF37]/25 dark:hover:bg-[#E5A93C]/20 transition-all group shrink-0 shadow-sm" title="Ưu đãi độc quyền" aria-label="Ưu đãi">
                            <i className="ph-bold ph-crown text-[16px] text-[#8B4A3C] dark:text-[#E5A93C] group-hover:scale-110 transition-transform"></i>
                            <span className="text-[13px] sm:text-[14px] font-bold tracking-wide">Ưu Đãi</span>
                            <span className="text-[8px] font-extrabold bg-[#8B4A3C] text-white px-1.5 py-0.5 rounded-full tracking-wider leading-none shadow-sm ml-0.5">HOT</span>
                        </a>
        
                        {/* Nút Tải Lên / Upload File (CHỈ ICON, KHÔNG CHỮ TẢI LÊN) */}
                        <a href="upload_end.html" id="header-upload-btn" className="flex items-center justify-center w-9 h-9 rounded-full border border-[#D4AF37] dark:border-[#E5A93C] text-[#8B4A3C] dark:text-[#E5A93C] bg-[#D4AF37]/15 dark:bg-[#E5A93C]/10 hover:bg-[#D4AF37]/25 dark:hover:bg-[#E5A93C]/20 transition-all shrink-0 shadow-sm group cursor-pointer" title="Tải lên tài liệu & Không gian đọc cá nhân" aria-label="Tải lên tài liệu">
                            <i className="ph-bold ph-cloud-arrow-up text-[18px] text-[#8B4A3C] dark:text-[#E5A93C] group-hover:scale-110 transition-transform"></i>
                        </a>
        
                        {/* Giỏ Hàng */}
                        <a href="cart_end.html" className="flex items-center justify-center w-9 h-9 rounded-full border border-[#D4AF37] dark:border-[#E5A93C] text-[#8B4A3C] dark:text-[#E5A93C] bg-[#D4AF37]/15 dark:bg-[#E5A93C]/10 hover:bg-[#D4AF37]/25 dark:hover:bg-[#E5A93C]/20 transition-all shrink-0 shadow-sm group relative" title="Giỏ Hàng" aria-label="Giỏ Hàng">
                            <i className="ph-bold ph-shopping-cart text-[18px] text-[#8B4A3C] dark:text-[#E5A93C] group-hover:scale-110 transition-transform"></i>
                            <span id="cart-badge-count" className="absolute -top-1 -right-1 w-4 h-4 bg-[#8B4A3C] text-white font-bold text-[9px] rounded-full flex items-center justify-center leading-none shadow-sm">1</span>
                        </a>
        
                        {/* Đổi Giao Diện Sáng / Tối */}
                        <button id="theme-toggle" type="button" className="flex items-center justify-center w-9 h-9 rounded-full border border-[#D4AF37] dark:border-[#E5A93C] text-[#8B4A3C] dark:text-[#E5A93C] bg-[#D4AF37]/15 dark:bg-[#E5A93C]/10 hover:bg-[#D4AF37]/25 dark:hover:bg-[#E5A93C]/20 transition-all shrink-0 shadow-sm group cursor-pointer" title="Đổi giao diện Sáng / Tối" aria-label="Đổi giao diện Sáng / Tối">
                            <i id="theme-icon" className="ph-bold ph-moon text-[18px] text-[#8B4A3C] dark:text-[#E5A93C] group-hover:scale-110 transition-transform"></i>
                        </button>
        
                        {/* Avatar Menu Dropdown */}
                        <div className="relative shrink-0" id="avatar-menu-wrapper">
                            <button id="avatar-menu-btn" type="button" onClick={(event) => { window.toggleAvatarMenu(event); }} className="flex items-center gap-1.5 p-0.5 rounded-full hover:ring-2 hover:ring-[#D4AF37] dark:hover:ring-[#E5A93C] transition-all focus:outline-none cursor-pointer" aria-haspopup="true" aria-expanded="false" title="Tài khoản & Thiết lập">
                                <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[#D4AF37] dark:border-[#E5A93C] bg-[#EAE5D9]">
                                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=HalmReader" alt="Avatar" className="w-full h-full object-cover" />
                                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#8B4A3C] rounded-full border border-[#F7F5F0] dark:border-[#111210]"></span>
                                </div>
                                <i className="ph-bold ph-caret-down text-xs text-[#8B4A3C] dark:text-[#E5A93C] transition-transform duration-200" id="avatar-caret-icon"></i>
                            </button>
        
                            {/* Avatar Dropdown Menu */}
                            <div id="avatar-dropdown" className="hidden absolute right-0 top-full mt-2 w-64 bg-[#FFFEFA] dark:bg-[#181916] rounded-2xl shadow-2xl border border-[#E6E1D8] dark:border-[#2C2E29] p-2 z-50 transition-all font-nunito">
                                <div className="p-3 border-b border-[#E6E1D8]/60 dark:border-[#2C2E29]">
                                    <p className="font-bold text-sm text-[#242321] dark:text-[#EDE9DF]">Độc Giả Tinh Hoa</p>
                                    <p className="text-xs text-[#85817A] dark:text-[#96938B]">docgia@halmbook.vn</p>
                                    <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold text-[#8B4A3C] dark:text-[#D4AF37] bg-[#8B4A3C]/10 dark:bg-[#D4AF37]/15 rounded-full">Hội viên Lão Nông</span>
                                </div>
                                <div className="py-1">
                                    <a href="profile_end.html" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#242321] dark:text-[#EDE9DF] hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors">
                                        <i className="ph-bold ph-user text-base text-[#85817A]"></i>
                                        <span>Hồ sơ cá nhân</span>
                                    </a>
                                    <a href="my-books_end.html" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#242321] dark:text-[#EDE9DF] hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors">
                                        <i className="ph-bold ph-books text-base text-[#85817A]"></i>
                                        <span>Tủ sách của tôi</span>
                                    </a>
                                    <a href="upload_end.html" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#242321] dark:text-[#EDE9DF] hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors">
                                        <i className="ph-bold ph-file-text text-base text-[#85817A]"></i>
                                        <span>Tệp cá nhân tải lên</span>
                                    </a>
                                    <a href="javascript:void(0)" onClick={(event) => { if(window.openNotificationModal) window.window.openNotificationModal(); else if(window.toggleNotificationModal) window.window.toggleNotificationModal(); else window.location.href='notification.html'; }} className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#242321] dark:text-[#EDE9DF] hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors">
                                        <div className="flex items-center gap-2.5">
                                            <i className="ph-bold ph-bell text-base text-[#85817A]"></i>
                                            <span>Thông Báo</span>
                                        </div>
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#8B4A3C] dark:bg-[#D4AF37] text-white dark:text-[#111210] rounded-full">2 mới</span>
                                    </a>
                                    <a href="change_profile_end.html" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#242321] dark:text-[#EDE9DF] hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors">
                                        <i className="ph-bold ph-gear text-base text-[#85817A]"></i>
                                        <span>Cài đặt & Tùy chọn</span>
                                    </a>
                                </div>
                                <div className="pt-1 border-t border-[#E6E1D8]/60 dark:border-[#2C2E29]">
                                    <a href="login.html" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                                        <i className="ph-bold ph-sign-out text-base"></i>
                                        <span>Đăng xuất</span>
                                    </a>
                                </div>
                            </div>
                        </div>
        
                        {/* Nút Mobile Menu */}
                        <button id="mobile-menu-btn" type="button" onClick={(event) => { window.toggleMobileMenu(); }} className="lg:hidden p-2 rounded-full border border-[#D4AF37] dark:border-[#E5A93C] text-[#8B4A3C] dark:text-[#E5A93C] bg-[#D4AF37]/15 dark:bg-[#E5A93C]/10 hover:bg-[#D4AF37]/25 dark:hover:bg-[#E5A93C]/20 transition-all shrink-0 cursor-pointer" aria-label="Mở Menu">
                            <i className="ph-bold ph-list text-xl"></i>
                        </button>
                    </div>
                </div>
        
                {/* Mobile Drawer Menu */}
                <div id="mobile-drawer" className="hidden lg:hidden px-5 py-4 bg-[#FAF8F5] dark:bg-[#111210] border-b border-[#E3DDD0] dark:border-[#2C2E29] space-y-3 font-nunito">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#85817A] dark:text-[#96938B] px-1">Danh Mục Sách</div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                        <a href="category_end.html?category=trending" onClick={(event) => { window.handleCategoryNav(event, 'trending') }} className="p-2 rounded-lg bg-[#FFFEFA] dark:bg-[#181916] border border-[#E6E1D8] dark:border-[#2C2E29] text-ink dark:text-night-text flex items-center gap-2">
                            <i className="ph-bold ph-trend-up text-wine dark:text-gold"></i> Thịnh Hành
                        </a>
                        <a href="category_end.html?category=business" onClick={(event) => { window.handleCategoryNav(event, 'business') }} className="p-2 rounded-lg bg-[#FFFEFA] dark:bg-[#181916] border border-[#E6E1D8] dark:border-[#2C2E29] text-ink dark:text-night-text flex items-center gap-2">
                            <i className="ph-bold ph-chart-line text-wine dark:text-gold"></i> Kinh Tế
                        </a>
                        <a href="category_end.html?category=children" onClick={(event) => { window.handleCategoryNav(event, 'children') }} className="p-2 rounded-lg bg-[#FFFEFA] dark:bg-[#181916] border border-[#E6E1D8] dark:border-[#2C2E29] text-ink dark:text-night-text flex items-center gap-2">
                            <i className="ph-bold ph-sparkle text-wine dark:text-gold"></i> Tuổi Thơ
                        </a>
                        <a href="category_end.html?category=history" onClick={(event) => { window.handleCategoryNav(event, 'history') }} className="p-2 rounded-lg bg-[#FFFEFA] dark:bg-[#181916] border border-[#E6E1D8] dark:border-[#2C2E29] text-ink dark:text-night-text flex items-center gap-2">
                            <i className="ph-bold ph-hourglass-high text-wine dark:text-gold"></i> Lịch Sử
                        </a>
                        <a href="category_end.html?category=literature" onClick={(event) => { window.handleCategoryNav(event, 'literature') }} className="p-2 rounded-lg bg-[#FFFEFA] dark:bg-[#181916] border border-[#E6E1D8] dark:border-[#2C2E29] text-ink dark:text-night-text flex items-center gap-2">
                            <i className="ph-bold ph-book-open text-wine dark:text-gold"></i> Văn Học
                        </a>
                        <a href="category_end.html?category=philosophy" onClick={(event) => { window.handleCategoryNav(event, 'philosophy') }} className="p-2 rounded-lg bg-[#FFFEFA] dark:bg-[#181916] border border-[#E6E1D8] dark:border-[#2C2E29] text-ink dark:text-night-text flex items-center gap-2">
                            <i className="ph-bold ph-brain text-wine dark:text-gold"></i> Triết Học
                        </a>
                        <a href="category_end.html?category=selfgrowth" onClick={(event) => { window.handleCategoryNav(event, 'selfgrowth') }} className="p-2 rounded-lg bg-[#FFFEFA] dark:bg-[#181916] border border-[#E6E1D8] dark:border-[#2C2E29] text-ink dark:text-night-text flex items-center gap-2">
                            <i className="ph-bold ph-compass text-wine dark:text-gold"></i> Phát Triển
                        </a>
                        <a href="category_end.html?category=artlifestyle" onClick={(event) => { window.handleCategoryNav(event, 'artlifestyle') }} className="p-2 rounded-lg bg-[#FFFEFA] dark:bg-[#181916] border border-[#E6E1D8] dark:border-[#2C2E29] text-ink dark:text-night-text flex items-center gap-2">
                            <i className="ph-bold ph-palette text-wine dark:text-gold"></i> Nghệ Thuật
                        </a>
                        <a href="category_end.html?category=science" onClick={(event) => { window.handleCategoryNav(event, 'science') }} className="p-2 rounded-lg bg-[#FFFEFA] dark:bg-[#181916] border border-[#E6E1D8] dark:border-[#2C2E29] text-ink dark:text-night-text flex items-center gap-2">
                            <i className="ph-bold ph-atom text-wine dark:text-gold"></i> Khoa Học
                        </a>
                        <a href="category_end.html?category=biography" onClick={(event) => { window.handleCategoryNav(event, 'biography') }} className="p-2 rounded-lg bg-[#FFFEFA] dark:bg-[#181916] border border-[#E6E1D8] dark:border-[#2C2E29] text-ink dark:text-night-text flex items-center gap-2">
                            <i className="ph-bold ph-user-focus text-wine dark:text-gold"></i> Tiểu Sử
                        </a>
                    </div>
                    <div className="pt-2 border-t border-[#E3DDD0] dark:border-[#2C2E29] flex flex-col gap-2 font-bold text-xs uppercase tracking-wider">
                        <a href="offers_end.html" className="py-2 text-ink dark:text-night-text hover:text-wine flex items-center gap-2"><i className="ph-bold ph-crown text-wine"></i> Ưu Đãi Độc Quyền</a>
                        <a href="upload_end.html" className="py-2 text-ink dark:text-night-text hover:text-wine flex items-center gap-2"><i className="ph-bold ph-cloud-arrow-up text-wine"></i> Tải Lên Tệp Riêng Tư</a>
                        <a href="cart_end.html" className="py-2 text-ink dark:text-night-text hover:text-wine flex items-center gap-2"><i className="ph-bold ph-shopping-cart text-wine"></i> Giỏ Hàng</a>
                        <a href="tiers_end.html" className="py-2 text-ink dark:text-night-text hover:text-wine flex items-center gap-2"><i className="ph-bold ph-medal text-wine"></i> Gói Hội Viên</a>
                        <button type="button" onClick={(event) => { if(window.openChatbot) window.window.openChatbot('Xin chào Trợ lý HALM BOOK!'); }} className="py-2 text-wine dark:text-gold flex items-center gap-2 text-left font-bold cursor-pointer"><i className="ph-bold ph-sparkle"></i> Trợ Lý Robot Khoai Tây AI</button>
                        <a href="profile_end.html" className="py-2 text-ink dark:text-night-text hover:text-wine flex items-center gap-2"><i className="ph-bold ph-user text-wine"></i> Tài Khoản Cá Nhân</a>
                    </div>
                </div>
            </header>
        
            {/* KHOẢNG ĐỆM HEADER */}
            <div className="h-20 sm:h-24"></div>
        
            {/* ========================================================
                 HERO SECTION: HỆ SINH THÁI ĐỌC TÀI LIỆU CÁ NHÂN
                 ======================================================== */}
            <section className="relative z-10 py-8 lg:py-10 px-4 sm:px-6 lg:px-8 max-w-[1520px] mx-auto w-full">
                <div className="text-center max-w-3xl mx-auto space-y-4">
                    
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8B4A3C]/10 dark:bg-[#D4AF37]/15 border border-[#8B4A3C]/30 dark:border-[#D4AF37]/30 text-[#8B4A3C] dark:text-[#D4AF37] text-xs font-bold tracking-wider uppercase font-metadata-spec">
                        <i className="ph-bold ph-book-open-text text-sm"></i>
                        <span>Trình Đọc & Không Gian Tài Liệu Cá Nhân</span>
                    </div>
        
                    <h1 className="font-display-hero text-3xl sm:text-4xl lg:text-5xl font-black text-[#1E1F1D] dark:text-[#EDE9DF] tracking-tight leading-tight">
                        Đưa Tệp Của Bạn Vào Hệ Sinh Thái HALM BOOK
                    </h1>
        
                    <p className="font-sans text-sm sm:text-base text-[#5A564F] dark:text-[#EDE9DF]/85 max-w-2xl mx-auto leading-relaxed font-medium">
                        Cùng HALM BOOK nâng tầm trải nghiệm đọc: Tự động ghi nhớ tiến độ, lật trang êm ái, tùy biến cỡ chữ và đọc tài liệu mượt mà trên mọi thiết bị.
                    </p>
        
                    {/* 4 Giá trị cốt lõi của Hệ Sinh Thái */}
                    <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                        <div className="p-3.5 rounded-2xl bg-[#FFFEFA] dark:bg-[#181916] border border-[#E3DDD0] dark:border-[#2C2E29] shadow-sm flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#8B4A3C]/10 dark:bg-[#D4AF37]/15 text-[#8B4A3C] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
                                <i className="ph-bold ph-device-mobile text-lg"></i>
                            </div>
                            <div>
                                <div className="font-bold text-xs text-[#1E1F1D] dark:text-[#EDE9DF]">Trình Đọc Chuẩn</div>
                                <div className="text-[10px] text-[#85817A] dark:text-[#96938B]">Lật trang, Dark Mode, Sepia</div>
                            </div>
                        </div>
        
                        <div className="p-3.5 rounded-2xl bg-[#FFFEFA] dark:bg-[#181916] border border-[#E3DDD0] dark:border-[#2C2E29] shadow-sm flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#8B4A3C]/10 dark:bg-[#D4AF37]/15 text-[#8B4A3C] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
                                <i className="ph-bold ph-bookmarks text-lg"></i>
                            </div>
                            <div>
                                <div className="font-bold text-xs text-[#1E1F1D] dark:text-[#EDE9DF]">Nhớ Tiến Độ</div>
                                <div className="text-[10px] text-[#85817A] dark:text-[#96938B]">Đọc tiếp đúng trang dở dang</div>
                            </div>
                        </div>
        
                        <div className="p-3.5 rounded-2xl bg-[#FFFEFA] dark:bg-[#181916] border border-[#E3DDD0] dark:border-[#2C2E29] shadow-sm flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#8B4A3C]/10 dark:bg-[#D4AF37]/15 text-[#8B4A3C] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
                                <i className="ph-bold ph-text-aa text-lg"></i>
                            </div>
                            <div>
                                <div className="font-bold text-xs text-[#1E1F1D] dark:text-[#EDE9DF]">Tùy Biến Đọc Sách</div>
                                <div className="text-[10px] text-[#85817A] dark:text-[#96938B]">Font chữ, cỡ chữ, căn lề</div>
                            </div>
                        </div>
        
                        <div className="p-3.5 rounded-2xl bg-[#FFFEFA] dark:bg-[#181916] border border-[#E3DDD0] dark:border-[#2C2E29] shadow-sm flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#8B4A3C]/10 dark:bg-[#D4AF37]/15 text-[#8B4A3C] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
                                <i className="ph-bold ph-lock-key text-lg"></i>
                            </div>
                            <div>
                                <div className="font-bold text-xs text-[#1E1F1D] dark:text-[#EDE9DF]">Bảo Mật Riêng Tư</div>
                                <div className="text-[10px] text-[#85817A] dark:text-[#96938B]">Chỉ mình bạn có quyền đọc</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        
            {/* ========================================================
                 MAIN INTERACTION: VÙNG KÉO THẢ TỆP & DANH SÁCH TÀI LIỆU
                 ======================================================== */}
            <main className="relative z-10 flex-grow px-4 sm:px-6 lg:px-8 max-w-[1520px] mx-auto w-full pb-16 space-y-10">
                
                {/* 1. VÙNG KÉO THẢ TỆP TRỰC DIỆN (DRAG & DROP ZONE) */}
                <section className="bg-[#FFFEFA] dark:bg-[#181916] p-6 sm:p-8 rounded-3xl border border-[#E3DDD0] dark:border-[#2C2E29] shadow-sm space-y-5">
                    
                    <div className="flex items-center justify-between pb-3 border-b border-[#E3DDD0]/70 dark:border-[#2C2E29]">
                        <div>
                            <h2 className="font-display font-black text-lg text-[#1E1F1D] dark:text-[#EDE9DF] flex items-center gap-2">
                                <i className="ph-bold ph-file-arrow-up text-[#8B4A3C] dark:text-[#D4AF37]"></i>
                                <span>Thêm Tệp Mới Vào Không Gian Đọc Của Bạn</span>
                            </h2>
                            <p className="text-xs text-[#85817A] dark:text-[#96938B] mt-0.5">
                                Hỗ trợ định dạng PDF, EPUB, MOBI, DOCX, TXT. Tự động chuyển đổi thành giao diện đọc sách chuyên nghiệp.
                            </p>
                        </div>
                        <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-[#8B4A3C]/10 dark:bg-[#D4AF37]/15 text-[#8B4A3C] dark:text-[#D4AF37] text-[11px] font-bold font-metadata-spec">
                            Tối đa 250MB / tệp
                        </span>
                    </div>
        
                    {/* Drag & Drop Box */}
                    <div className="upload-dropzone p-8 sm:p-12 rounded-3xl text-center relative cursor-pointer group" id="drop-zone" onClick={(event) => { window.triggerFileInput(); }}>
                        <input type="file" id="book-file-input" className="hidden" accept=".pdf,.epub,.mobi,.docx,.txt" onChange={(event) => { window.handleFileSelect(event); }} />
                        
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#8B4A3C]/10 dark:bg-[#D4AF37]/15 text-[#8B4A3C] dark:text-[#D4AF37] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <i className="ph-bold ph-cloud-arrow-up text-3xl sm:text-4xl" id="upload-icon-graphic"></i>
                        </div>
        
                        <h3 className="font-display font-black text-lg sm:text-xl text-[#1E1F1D] dark:text-[#EDE9DF] mb-1">
                            Kéo & Thả Tệp Sách / Tài Liệu Của Bạn Vào Đây
                        </h3>
                        
                        <p className="font-editorial-body text-xs sm:text-sm text-[#66645E] dark:text-[#96938B] max-w-md mx-auto mb-5">
                            Nhấp vào đây để chọn tệp từ máy tính hoặc kéo thả tệp trực tiếp. Tệp sẽ được chuyển hóa vào hệ sinh thái đọc riêng tư ngay tức thì.
                        </p>
        
                        <div className="flex items-center justify-center gap-3">
                            <button type="button" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#8B4A3C] hover:bg-[#6F252C] dark:bg-[#D4AF37] dark:hover:bg-[#B8860B] text-white dark:text-[#111210] font-bold text-xs sm:text-sm shadow-md transition-all">
                                <i className="ph-bold ph-folder-open text-base"></i>
                                <span>Chọn Tệp Từ Thiết Bị</span>
                            </button>
                            <button type="button" onClick={(event) => { event.stopPropagation(); window.loadSampleBook(); }} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#EAE5D9] dark:bg-[#2C2E29] hover:bg-[#E3DDD0] text-[#1E1F1D] dark:text-[#EDE9DF] font-bold text-xs transition-colors">
                                <i className="ph-bold ph-lightning"></i>
                                <span>Thử Đọc Tệp Mẫu</span>
                            </button>
                        </div>
                    </div>
        
                    {/* TIẾN TRÌNH TẢI TỆP (LIVE PROGRESS) */}
                    <div id="file-progress-container" className="hidden space-y-3 pt-2">
                        <div className="flex items-center justify-between text-xs font-bold text-[#85817A] dark:text-[#96938B] uppercase tracking-wider">
                            <span>Đang Tải & Tích Hợp Vào Hệ Sinh Thái</span>
                            <span id="file-status-badge" className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px]">Đang xử lý...</span>
                        </div>
        
                        <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#20221E] border border-[#E3DDD0] dark:border-[#2C2E29] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                <div className="w-12 h-12 rounded-xl bg-[#8B4A3C]/10 dark:bg-[#D4AF37]/20 flex items-center justify-center text-[#8B4A3C] dark:text-[#D4AF37] text-2xl font-black shrink-0" id="file-type-icon">
                                    <i className="ph-bold ph-file-pdf"></i>
                                </div>
        
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-xs sm:text-sm text-[#1E1F1D] dark:text-[#EDE9DF] truncate" id="file-name-display">Tai_Lieu_Khoa_Hoc.pdf</span>
                                        <span className="text-xs font-metadata-spec font-bold text-[#8B4A3C] dark:text-[#D4AF37]" id="file-percent-display">0%</span>
                                    </div>
        
                                    <div className="w-full bg-[#EAE5D9] dark:bg-[#2C2E29] rounded-full h-2 overflow-hidden mb-1.5">
                                        <div id="upload-progress-bar" className="bg-gradient-to-r from-[#8B4A3C] to-[#D4AF37] h-full rounded-full transition-all duration-200" style={{ width: "0%" }}></div>
                                    </div>
        
                                    <div className="flex items-center justify-between text-[10px] text-[#85817A] dark:text-[#96938B]">
                                        <span id="file-size-display">0 MB / 12.4 MB</span>
                                        <span id="file-speed-display">Tối ưu hóa dàn trang & mục lục...</span>
                                    </div>
                                </div>
                            </div>
        
                            {/* Nút Mở Đọc Liền Ngay Khi Tải Xong */}
                            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                                <button type="button" id="read-now-btn" className="hidden px-5 py-2.5 rounded-full bg-[#8B4A3C] hover:bg-[#6F252C] dark:bg-[#D4AF37] dark:hover:bg-[#B8860B] text-white dark:text-[#111210] font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
                                    <i className="ph-bold ph-book-open text-base"></i>
                                    <span>Mở Đọc Ngay</span>
                                </button>
                                <button type="button" onClick={(event) => { window.cancelUploadedFile(); }} className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-950/40 text-[#85817A] hover:text-red-600 transition-colors cursor-pointer" title="Hủy bỏ">
                                    <i className="ph-bold ph-trash text-base"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
        
                {/* 2. DANH SÁCH TỆP ĐÃ TẢI LÊN (KHO TÀI LIỆU CÁ NHÂN CỦA BẠN) */}
                <section className="bg-[#FFFEFA] dark:bg-[#181916] p-6 sm:p-8 rounded-3xl border border-[#E3DDD0] dark:border-[#2C2E29] shadow-sm space-y-6">
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3DDD0] dark:border-[#2C2E29]">
                        <div>
                            <h2 className="font-display font-black text-lg sm:text-xl text-[#1E1F1D] dark:text-[#EDE9DF] flex items-center gap-2.5">
                                <i className="ph-bold ph-books text-[#8B4A3C] dark:text-[#D4AF37]"></i>
                                <span>Tủ Tệp Cá Nhân Của Bạn</span>
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#8B4A3C]/10 dark:bg-[#D4AF37]/20 text-[#8B4A3C] dark:text-[#D4AF37] font-bold font-metadata-spec" id="library-count-badge">3 Tệp</span>
                            </h2>
                        </div>
        
                        {/* Bộ lọc nhanh */}
                        <div className="flex items-center gap-2 text-xs font-bold" id="filter-buttons">
                            <button type="button" onClick={(event) => { window.filterByStatus('all', event); }} className="filter-btn active px-3 py-1.5 rounded-xl bg-[#8B4A3C] dark:bg-[#D4AF37] text-white dark:text-[#111210] cursor-pointer">
                                Tất Cả
                            </button>
                            <button type="button" onClick={(event) => { window.filterByStatus('reading', event); }} className="filter-btn px-3 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#20221E] border border-[#E3DDD0] dark:border-[#2C2E29] text-[#1E1F1D] dark:text-[#EDE9DF] hover:border-[#8B4A3C] cursor-pointer">
                                Đang Đọc
                            </button>
                            <button type="button" onClick={(event) => { window.filterByStatus('completed', event); }} className="filter-btn px-3 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#20221E] border border-[#E3DDD0] dark:border-[#2C2E29] text-[#1E1F1D] dark:text-[#EDE9DF] hover:border-[#8B4A3C] cursor-pointer">
                                Đã Xong
                            </button>
                        </div>
                    </div>
        
                    {/* DANH SÁCH THẺ TÀI LIỆU */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="library-grid">
                        
                        {/* Tệp 1: Đang đọc dở */}
                        <div className="library-item p-5 rounded-2xl bg-[#FAF8F5] dark:bg-[#20221E] border border-[#E3DDD0] dark:border-[#2C2E29] hover:border-[#8B4A3C] dark:hover:border-[#D4AF37] transition-all flex flex-col justify-between shadow-sm group" data-status="reading" data-id="file-1">
                            <div>
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center text-xl font-bold shrink-0">
                                        <i className="ph-bold ph-file-pdf"></i>
                                    </div>
                                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-[10px] shrink-0">
                                        Đang đọc • 45%
                                    </span>
                                </div>
        
                                <h3 className="font-display font-bold text-sm text-[#1E1F1D] dark:text-[#EDE9DF] leading-snug line-clamp-2 file-title" title="Báo Cáo Nghiên Cứu Tâm Lý Học Hành Vi & Quyết Định">
                                    Báo Cáo Nghiên Cứu Tâm Lý Học Hành Vi & Quyết Định
                                </h3>
        
                                <div className="text-[11px] text-[#85817A] dark:text-[#96938B] mt-1 space-y-0.5">
                                    <div>Định dạng: <strong>PDF</strong> • Dung lượng: <strong>14.2 MB</strong></div>
                                    <div>Đã đọc đến: <strong>Trang 52 / 115</strong></div>
                                </div>
        
                                {/* Thanh tiến độ đọc */}
                                <div className="w-full bg-[#EAE5D9] dark:bg-[#2C2E29] rounded-full h-1.5 mt-3 overflow-hidden">
                                    <div className="bg-[#8B4A3C] dark:bg-[#D4AF37] h-full rounded-full" style={{ width: "45%" }}></div>
                                </div>
                            </div>
        
                            {/* Nút thao tác: Đọc tiếp, Tải về, Đổi tên, Xóa */}
                            <div className="mt-5 pt-3 border-t border-[#E3DDD0]/70 dark:border-[#2C2E29] flex items-center justify-between gap-2">
                                <button type="button" onClick={(event) => { window.openReaderModal('Báo Cáo Nghiên Cứu Tâm Lý Học Hành Vi & Quyết Định', 52, 115, 'PDF'); }} className="flex-1 py-2 px-3 rounded-xl bg-[#8B4A3C] hover:bg-[#6F252C] dark:bg-[#D4AF37] dark:hover:bg-[#B8860B] text-white dark:text-[#111210] font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer">
                                    <i className="ph-bold ph-play"></i>
                                    <span>Đọc Tiếp</span>
                                </button>
                                
                                <div className="flex items-center gap-1 shrink-0">
                                    <button type="button" onClick={(event) => { window.renameFile('file-1'); }} className="p-2 rounded-lg hover:bg-[#EAE5D9] dark:hover:bg-[#2C2E29] text-[#85817A] hover:text-[#1E1F1D] dark:hover:text-[#EDE9DF] transition-colors cursor-pointer" title="Đổi tên tệp">
                                        <i className="ph-bold ph-pencil-simple text-sm"></i>
                                    </button>
                                    <button type="button" onClick={(event) => { window.deleteFile('file-1'); }} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-[#85817A] hover:text-red-600 transition-colors cursor-pointer" title="Xóa khỏi không gian">
                                        <i className="ph-bold ph-trash text-sm"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
        
                        {/* Tệp 2: Đang đọc dở */}
                        <div className="library-item p-5 rounded-2xl bg-[#FAF8F5] dark:bg-[#20221E] border border-[#E3DDD0] dark:border-[#2C2E29] hover:border-[#8B4A3C] dark:hover:border-[#D4AF37] transition-all flex flex-col justify-between shadow-sm group" data-status="reading" data-id="file-2">
                            <div>
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl font-bold shrink-0">
                                        <i className="ph-bold ph-book-open"></i>
                                    </div>
                                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-[10px] shrink-0">
                                        Đang đọc • 80%
                                    </span>
                                </div>
        
                                <h3 className="font-display font-bold text-sm text-[#1E1F1D] dark:text-[#EDE9DF] leading-snug line-clamp-2 file-title" title="Tu_Duy_Phan_Bien_The_Ky_21.epub">
                                    Tư Duy Phản Biện Thời Đại Số (Bản Dịch Thô)
                                </h3>
        
                                <div className="text-[11px] text-[#85817A] dark:text-[#96938B] mt-1 space-y-0.5">
                                    <div>Định dạng: <strong>EPUB</strong> • Dung lượng: <strong>6.8 MB</strong></div>
                                    <div>Đã đọc đến: <strong>Chương 7 / Chương 9</strong></div>
                                </div>
        
                                <div className="w-full bg-[#EAE5D9] dark:bg-[#2C2E29] rounded-full h-1.5 mt-3 overflow-hidden">
                                    <div className="bg-[#8B4A3C] dark:bg-[#D4AF37] h-full rounded-full" style={{ width: "80%" }}></div>
                                </div>
                            </div>
        
                            <div className="mt-5 pt-3 border-t border-[#E3DDD0]/70 dark:border-[#2C2E29] flex items-center justify-between gap-2">
                                <button type="button" onClick={(event) => { window.openReaderModal('Tư Duy Phản Biện Thời Đại Số', 180, 225, 'EPUB'); }} className="flex-1 py-2 px-3 rounded-xl bg-[#8B4A3C] hover:bg-[#6F252C] dark:bg-[#D4AF37] dark:hover:bg-[#B8860B] text-white dark:text-[#111210] font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer">
                                    <i className="ph-bold ph-play"></i>
                                    <span>Đọc Tiếp</span>
                                </button>
                                
                                <div className="flex items-center gap-1 shrink-0">
                                    <button type="button" onClick={(event) => { window.renameFile('file-2'); }} className="p-2 rounded-lg hover:bg-[#EAE5D9] dark:hover:bg-[#2C2E29] text-[#85817A] hover:text-[#1E1F1D] dark:hover:text-[#EDE9DF] transition-colors cursor-pointer" title="Đổi tên tệp">
                                        <i className="ph-bold ph-pencil-simple text-sm"></i>
                                    </button>
                                    <button type="button" onClick={(event) => { window.deleteFile('file-2'); }} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-[#85817A] hover:text-red-600 transition-colors cursor-pointer" title="Xóa khỏi không gian">
                                        <i className="ph-bold ph-trash text-sm"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
        
                        {/* Tệp 3: Đã hoàn thành */}
                        <div className="library-item p-5 rounded-2xl bg-[#FAF8F5] dark:bg-[#20221E] border border-[#E3DDD0] dark:border-[#2C2E29] hover:border-[#8B4A3C] dark:hover:border-[#D4AF37] transition-all flex flex-col justify-between shadow-sm group" data-status="completed" data-id="file-3">
                            <div>
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-bold shrink-0">
                                        <i className="ph-bold ph-file-doc"></i>
                                    </div>
                                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] shrink-0">
                                        Đã đọc xong • 100%
                                    </span>
                                </div>
        
                                <h3 className="font-display font-bold text-sm text-[#1E1F1D] dark:text-[#EDE9DF] leading-snug line-clamp-2 file-title" title="Ghi Chép Khảo Cứu Địa Chí Thăng Long">
                                    Ghi Chép Khảo Cứu Địa Chí Thăng Long
                                </h3>
        
                                <div className="text-[11px] text-[#85817A] dark:text-[#96938B] mt-1 space-y-0.5">
                                    <div>Định dạng: <strong>DOCX</strong> • Dung lượng: <strong>3.1 MB</strong></div>
                                    <div>Trạng thái: <strong>Đã hoàn thành 100%</strong></div>
                                </div>
        
                                <div className="w-full bg-[#EAE5D9] dark:bg-[#2C2E29] rounded-full h-1.5 mt-3 overflow-hidden">
                                    <div className="bg-emerald-600 dark:bg-emerald-400 h-full rounded-full" style={{ width: "100%" }}></div>
                                </div>
                            </div>
        
                            <div className="mt-5 pt-3 border-t border-[#E3DDD0]/70 dark:border-[#2C2E29] flex items-center justify-between gap-2">
                                <button type="button" onClick={(event) => { window.openReaderModal('Ghi Chép Khảo Cứu Địa Chí Thăng Long', 1, 95, 'DOCX'); }} className="flex-1 py-2 px-3 rounded-xl bg-[#EAE5D9] hover:bg-[#8B4A3C] hover:text-white dark:bg-[#2C2E29] dark:hover:bg-[#D4AF37] dark:hover:text-[#111210] text-[#1E1F1D] dark:text-[#EDE9DF] font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer">
                                    <i className="ph-bold ph-arrow-counter-clockwise"></i>
                                    <span>Đọc Lại</span>
                                </button>
                                
                                <div className="flex items-center gap-1 shrink-0">
                                    <button type="button" onClick={(event) => { window.renameFile('file-3'); }} className="p-2 rounded-lg hover:bg-[#EAE5D9] dark:hover:bg-[#2C2E29] text-[#85817A] hover:text-[#1E1F1D] dark:hover:text-[#EDE9DF] transition-colors cursor-pointer" title="Đổi tên tệp">
                                        <i className="ph-bold ph-pencil-simple text-sm"></i>
                                    </button>
                                    <button type="button" onClick={(event) => { window.deleteFile('file-3'); }} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-[#85817A] hover:text-red-600 transition-colors cursor-pointer" title="Xóa khỏi không gian">
                                        <i className="ph-bold ph-trash text-sm"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        
            {/* ========================================================
                 MODAL TRÌNH ĐỌC SÁCH CHUẨN HALM BOOK (READER MODAL)
                 ======================================================== */}
            <div id="reader-modal" className="hidden fixed inset-0 z-50 flex flex-col bg-[#F7F4EE] dark:bg-[#111210] transition-colors">
                
                {/* Header trình đọc */}
                <div className="h-14 px-4 sm:px-6 bg-[#FFFEFA] dark:bg-[#181916] border-b border-[#E3DDD0] dark:border-[#2C2E29] flex items-center justify-between gap-4 shrink-0 shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                        <button type="button" onClick={(event) => { window.closeReaderModal(); }} className="p-2 rounded-xl hover:bg-[#EAE5D9] dark:hover:bg-[#2C2E29] text-[#1E1F1D] dark:text-[#EDE9DF] transition-colors cursor-pointer" title="Đóng trình đọc">
                            <i className="ph-bold ph-arrow-left text-lg"></i>
                        </button>
                        <div className="min-w-0">
                            <h3 className="font-display font-bold text-xs sm:text-sm text-[#1E1F1D] dark:text-[#EDE9DF] truncate" id="reader-book-title">
                                Tên Tài Liệu Đang Đọc
                            </h3>
                            <div className="text-[10px] text-[#85817A] dark:text-[#96938B]" id="reader-page-indicator">
                                Trang 52 / 115 • Chế độ xem chuẩn Editorial
                            </div>
                        </div>
                    </div>
        
                    {/* Các nút điều chỉnh đọc sách */}
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Chỉnh cỡ chữ */}
                        <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-xl bg-[#FAF8F5] dark:bg-[#20221E] border border-[#E3DDD0] dark:border-[#2C2E29] text-xs font-bold">
                            <button type="button" onClick={(event) => { adjustFontSize(-1); }} className="px-2 py-0.5 hover:text-[#8B4A3C] dark:hover:text-[#D4AF37]" title="Giảm cỡ chữ">A-</button>
                            <span className="text-[10px] text-[#85817A]" id="font-size-label">100%</span>
                            <button type="button" onClick={(event) => { adjustFontSize(1); }} className="px-2 py-0.5 hover:text-[#8B4A3C] dark:hover:text-[#D4AF37]" title="Tăng cỡ chữ">A+</button>
                        </div>
        
                        {/* Đổi màu giấy đọc: Trắng / Vàng Sepia / Tối */}
                        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#FAF8F5] dark:bg-[#20221E] border border-[#E3DDD0] dark:border-[#2C2E29]">
                            <button type="button" onClick={(event) => { window.setReaderTheme('white'); }} className="w-6 h-6 rounded-lg bg-white border border-gray-300 shadow-sm" title="Giấy trắng"></button>
                            <button type="button" onClick={(event) => { window.setReaderTheme('sepia'); }} className="w-6 h-6 rounded-lg bg-[#F4ECD8] border border-amber-300 shadow-sm" title="Giấy ngà bảo vệ mắt"></button>
                            <button type="button" onClick={(event) => { window.setReaderTheme('dark'); }} className="w-6 h-6 rounded-lg bg-[#181916] border border-gray-700 shadow-sm" title="Ban đêm"></button>
                        </div>
        
                        {/* Bookmark */}
                        <button type="button" onClick={(event) => { window.toggleBookmark(); }} className="p-2 rounded-xl hover:bg-[#EAE5D9] dark:hover:bg-[#2C2E29] text-[#1E1F1D] dark:text-[#EDE9DF] transition-colors cursor-pointer" id="bookmark-btn" title="Đánh dấu trang này">
                            <i className="ph-bold ph-bookmark-simple text-lg" id="bookmark-icon"></i>
                        </button>
        
                        {/* Trợ lý PotatoBot đọc cùng */}
                        <button type="button" onClick={(event) => { window.openChatbot('Tóm tắt ý chính của trang sách này giúp tôi!'); }} className="p-2 rounded-xl bg-[#8B4A3C]/10 dark:bg-[#D4AF37]/20 text-[#8B4A3C] dark:text-[#D4AF37] hover:opacity-80 transition-opacity cursor-pointer" title="Nhờ PotatoBot tóm tắt trang này">
                            <span className="text-base">🥔</span>
                        </button>
                    </div>
                </div>
        
                {/* Thân trình đọc */}
                <div className="flex-grow flex overflow-hidden relative">
                    
                    {/* Sidebar Mục Lục (Table of Contents) */}
                    <div className="hidden md:block w-64 bg-[#FFFEFA] dark:bg-[#181916] border-r border-[#E3DDD0] dark:border-[#2C2E29] p-4 overflow-y-auto reader-scroll shrink-0">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#85817A] dark:text-[#96938B] mb-3">Mục Lục Tự Động</div>
                        <div className="space-y-1 text-xs">
                            <button type="button" onClick={(event) => { window.jumpToChapter(1); }} className="w-full text-left p-2 rounded-lg bg-[#8B4A3C]/10 dark:bg-[#D4AF37]/15 text-[#8B4A3C] dark:text-[#D4AF37] font-bold">
                                Chương I: Đặt Vấn Đề & Khởi Nguồn
                            </button>
                            <button type="button" onClick={(event) => { window.jumpToChapter(2); }} className="w-full text-left p-2 rounded-lg hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] text-[#66645E] dark:text-[#96938B]">
                                Chương II: Lý Thuyết Hành Vi Ra Quyết Định
                            </button>
                            <button type="button" onClick={(event) => { window.jumpToChapter(3); }} className="w-full text-left p-2 rounded-lg hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] text-[#66645E] dark:text-[#96938B]">
                                Chương III: Thực Nghiệm & Kết Quả Phân Tích
                            </button>
                            <button type="button" onClick={(event) => { window.jumpToChapter(4); }} className="w-full text-left p-2 rounded-lg hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] text-[#66645E] dark:text-[#96938B]">
                                Chương IV: Ứng Dụng Trong Đời Sống Hiện Đại
                            </button>
                            <button type="button" onClick={(event) => { window.jumpToChapter(5); }} className="w-full text-left p-2 rounded-lg hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] text-[#66645E] dark:text-[#96938B]">
                                Tổng Kết & Danh Mục Tài Liệu Tham Khảo
                            </button>
                        </div>
                    </div>
        
                    {/* Vùng hiển thị trang sách (Book Content Canvas) */}
                    <div className="flex-1 overflow-y-auto reader-scroll p-6 sm:p-12 lg:p-16 flex justify-center" id="reader-canvas">
                        <div className="max-w-2xl w-full space-y-6 text-[#1E1F1D] dark:text-[#EDE9DF]" id="reader-text-container">
                            
                            <div className="text-center pb-6 border-b border-[#E3DDD0]/60 dark:border-[#2C2E29]">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#85817A] dark:text-[#96938B] font-metadata-spec">Hệ Sinh Thái Đọc HALM BOOK</span>
                                <h1 className="font-display font-black text-2xl sm:text-3xl mt-2 text-[#8B4A3C] dark:text-[#D4AF37]" id="reader-chapter-title">
                                    Chương I: Đặt Vấn Đề & Khởi Nguồn
                                </h1>
                            </div>
        
                            <div className="font-editorial-body text-base sm:text-lg space-y-5 leading-relaxed" id="reader-paragraphs">
                                <p>
                                    Khi con người bước vào kỷ nguyên của dữ liệu và thông tin đa tầng, khả năng tập trung sâu sắc trở thành một trong những tài sản trí tuệ quý giá nhất. Những nghiên cứu kéo dài qua nhiều thập kỷ đã chỉ ra rằng não bộ con người tiếp nhận tri thức bền vững nhất khi được tương tác trong một không gian tối giản, không bị phân tâm bởi các yếu tố gây xao nhãng.
                                </p>
                                <p>
                                    Việc số hóa một tài liệu thô không đơn thuần là chuyển đổi các dòng văn bản từ tệp tin sang màn hình hiển thị. Đó là quá trình tái cấu trúc không gian thị giác: khoảng cách giữa các con chữ, tỉ lệ lề hai bên, độ tương phản của trang giấy và nhịp điệu chuyển trang nhẹ nhàng. Tất cả những chi tiết tinh vi ấy hợp thành một trạng thái mà các nhà tâm lý học gọi là <em>"Dòng chảy đọc sâu" (Deep Reading Flow)</em>.
                                </p>
                                <p className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#20221E] border-l-4 border-[#8B4A3C] dark:border-[#D4AF37] italic text-sm text-[#66645E] dark:text-[#96938B]">
                                    "Một cuốn sách hay hay một tài liệu giá trị không đòi hỏi bạn phải đọc thật nhanh; nó đòi hỏi bạn có một không gian đủ tĩnh lặng để thấu hiểu đến tận cùng những điều tác giả gửi gắm."
                                </p>
                                <p>
                                    Tại HALM BOOK, chúng tôi tin rằng bất kỳ tệp tài liệu nào mà bạn tải lên đều xứng đáng được đối đãi như một ấn bản sách kinh điển. Mọi tiến độ đọc đều được bảo lưu, từng ghi chú đều được sắp xếp ngăn nắp, và bất cứ lúc nào bạn phân vân trước một đoạn văn khó, trợ lý PotatoBot luôn sẵn sàng hỗ trợ bạn tháo gỡ.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
        
                {/* Footer thanh điều hướng trang */}
                <div className="h-14 px-6 bg-[#FFFEFA] dark:bg-[#181916] border-t border-[#E3DDD0] dark:border-[#2C2E29] flex items-center justify-between shrink-0 font-nunito">
                    <button type="button" onClick={(event) => { window.changePage(-1); }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#20221E] hover:bg-[#8B4A3C] hover:text-white dark:hover:bg-[#D4AF37] dark:hover:text-[#111210] text-xs font-bold transition-all cursor-pointer">
                        <i className="ph-bold ph-caret-left"></i>
                        <span>Trang Trước</span>
                    </button>
        
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-[#85817A] dark:text-[#96938B]" id="bottom-page-counter">Trang 52 / 115</span>
                        <input type="range" min="1" max="115" defaultValue="52" onInput={(event) => { window.onSliderPageChange(event.currentTarget.value); }} className="w-32 sm:w-48 accent-[#8B4A3C] dark:accent-[#D4AF37] cursor-pointer" />
                    </div>
        
                    <button type="button" onClick={(event) => { window.changePage(1); }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#20221E] hover:bg-[#8B4A3C] hover:text-white dark:hover:bg-[#D4AF37] dark:hover:text-[#111210] text-xs font-bold transition-all cursor-pointer">
                        <span>Trang Sau</span>
                        <i className="ph-bold ph-caret-right"></i>
                    </button>
                </div>
            </div>
        
            {/* ========================================================
                 FOOTER CHUẨN HALM BOOK EDITORIAL
                 ======================================================== */}
            <footer className="mt-auto border-t border-[#E3DDD0] dark:border-[#2C2E29] bg-[#FAF8F5] dark:bg-[#111210] py-12 px-4 sm:px-6 lg:px-8 text-xs font-nunito">
                <div className="max-w-[1520px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <img src="img/icon-removebg-preview.png" alt="Logo" className="w-8 h-8 object-contain" onError={(event) => { event.currentTarget.src='./image/LOGO HALM BOOK/logo.png' }} />
                            <span className="font-black text-base text-[#8B4A3C] dark:text-[#EDE9DF]">HALM BOOK</span>
                        </div>
                        <p className="text-[#66645E] dark:text-[#96938B] leading-relaxed">
                            Hệ sinh thái đọc sách & tài liệu cá nhân cao cấp. Biến mọi tệp tin thô thành trải nghiệm đọc tinh hoa cùng trợ lý AI PotatoBot.
                        </p>
                        <div className="text-[11px] text-[#85817A] dark:text-[#96938B]">
                            © 2026 HALM BOOK Co. All rights reserved.
                        </div>
                    </div>
        
                    <div className="lg:pl-4">
                        <h3 className="text-[15px] sm:text-base font-extrabold uppercase tracking-wider leading-snug text-[#8B4A3C] dark:text-[#D4AF37] mb-4 pb-2 border-b border-[#E6E1D8] dark:border-[#2C2E29]">Thông Tin</h3>
                        <ul className="space-y-2.5 text-sm font-medium">
                            <li><a href="home_end.html#about-section" className="text-[#5A564F] dark:text-[#EDE9DF]/80 hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors flex items-center gap-2"><i className="ph-bold ph-caret-right text-xs text-[#8B4A3C] dark:text-[#D4AF37]"></i> Giới thiệu</a></li>
                            <li><a href="javascript:void(0)" onClick={(event) => { window.openChatbot('Tôi muốn liên hệ hỗ trợ độc giả'); }} className="text-[#5A564F] dark:text-[#EDE9DF]/80 hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors flex items-center gap-2"><i className="ph-bold ph-caret-right text-xs text-[#8B4A3C] dark:text-[#D4AF37]"></i> Liên hệ</a></li>
                            <li><a href="javascript:void(0)" className="text-[#5A564F] dark:text-[#EDE9DF]/80 hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors flex items-center gap-2"><i className="ph-bold ph-caret-right text-xs text-[#8B4A3C] dark:text-[#D4AF37]"></i> Giấy phép hoạt động</a></li>
                            <li><a href="javascript:void(0)" className="text-[#5A564F] dark:text-[#EDE9DF]/80 hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors flex items-center gap-2"><i className="ph-bold ph-caret-right text-xs text-[#8B4A3C] dark:text-[#D4AF37]"></i> Chính sách bảo mật</a></li>
                            <li><a href="javascript:void(0)" className="text-[#5A564F] dark:text-[#EDE9DF]/80 hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors flex items-center gap-2"><i className="ph-bold ph-caret-right text-xs text-[#8B4A3C] dark:text-[#D4AF37]"></i> Điều khoản dịch vụ</a></li>
                        </ul>
                    </div>
        
                    <div>
                        <h4 className="font-bold uppercase tracking-wider text-[#1E1F1D] dark:text-[#EDE9DF] mb-3">Khám Phá Sách</h4>
                        <ul className="space-y-2 text-[#66645E] dark:text-[#96938B]">
                            <li><a href="home_end.html" className="hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors">Kho sách kinh điển</a></li>
                            <li><a href="offers_end.html" className="hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors">Ưu đãi thuê sách</a></li>
                            <li><a href="tiers_end.html" className="hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors">Gói hội viên Lão Nông & Điền Chủ</a></li>
                            <li><a href="news_end.html" className="hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors">Tin tức xuất bản</a></li>
                        </ul>
                    </div>
        
                    <div className="space-y-3">
                        <h4 className="font-bold uppercase tracking-wider text-[#1E1F1D] dark:text-[#EDE9DF]">Hỗ Trợ Độc Giả</h4>
                        <p className="text-[#66645E] dark:text-[#96938B]">
                            Email hỗ trợ kỹ thuật: <strong className="text-[#8B4A3C] dark:text-[#D4AF37]">hotro@halmbook.vn</strong><br />
                            Hotline: <strong>1900 8892 (8:00 - 20:00)</strong>
                        </p>
                        <div className="flex items-center gap-3 text-lg text-[#85817A] dark:text-[#96938B]">
                            <a href="#" className="hover:text-[#8B4A3C] dark:hover:text-[#D4AF37]"><i className="ph-bold ph-facebook-logo"></i></a>
                            <a href="#" className="hover:text-[#8B4A3C] dark:hover:text-[#D4AF37]"><i className="ph-bold ph-youtube-logo"></i></a>
                            <a href="#" className="hover:text-[#8B4A3C] dark:hover:text-[#D4AF37]"><i className="ph-bold ph-telegram-logo"></i></a>
                        </div>
                    </div>
                </div>
            </footer>
        
            {/* ========================================================
                 JAVASCRIPT: TƯƠNG TÁC TẢI FILE, QUẢN LÝ TỆP & TRÌNH ĐỌC
                 ======================================================== */}
            
        
            {/* Trung Tâm Thông Báo Độc Lập HALM BOOK */}
            
        
            {/* Trợ Lý Ảo Robot Khoai Tây PotatoBot AI (Dây Leo, Lá Mầm, Hỏi 30s & Hover 3 Lần) */}
            
            {/* Master Header Controller & PotatoBot AI */}
      </div>
    </>
  );
}
