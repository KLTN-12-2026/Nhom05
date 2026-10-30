const FLY_HEIGHT_RATIO = 0.82;
const FLY_DURATION = 1000;
const READER_DELAY = 3000;

function createElement(styles = {}) {
    const element = document.createElement('div');
    Object.assign(element.style, styles);
    return element;
}

function createPageContent(book) {
    const content = createElement({
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem',
        position: 'relative',
        zIndex: '2',
        fontFamily: "'Playfair Display', serif",
    });

    const author = document.createElement('p');
    author.textContent = book?.author ? `Một tác phẩm của ${book.author}` : 'Tác phẩm tuyển chọn';
    Object.assign(author.style, {
        fontStyle: 'italic',
        color: '#8E3038',
        fontSize: '1.05rem',
        marginBottom: '10px',
        opacity: '0',
        transform: 'translateY(15px)',
        animation: 'bookTransitionFloat 1.2s ease-out 0.3s forwards',
    });

    const title = document.createElement('h2');
    title.textContent = book?.bookName || book?.title || 'Không Gian Đọc Sách';
    Object.assign(title.style, {
        fontWeight: '800',
        color: '#6F252C',
        fontSize: '2.1rem',
        marginBottom: '16px',
        lineHeight: '1.2',
        letterSpacing: '-0.5px',
        textShadow: '1px 1px 3px rgba(0,0,0,0.08)',
        opacity: '0',
        filter: 'blur(8px)',
        transform: 'scale(0.95)',
        animation: 'bookTransitionFade 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) 0.7s forwards',
    });

    const line = createElement({
        height: '2px',
        width: '0',
        background: '#8E3038',
        margin: '0 auto 20px',
        opacity: '0',
        animation: 'bookTransitionLine 1s ease-out 1.2s forwards',
    });

    const quote = document.createElement('p');
    const desc = book?.description ? book.description.trim() : '';
    quote.textContent = desc.length > 120 
        ? `"${desc.substring(0, 120)}..."` 
        : (desc || '"Sách là ngọn đèn sáng bất diệt của trí tuệ con người..."');
    Object.assign(quote.style, {
        fontSize: '0.92rem',
        color: '#6E6D7A',
        fontStyle: 'italic',
        maxWidth: '85%',
        lineHeight: '1.7',
        opacity: '0',
        transform: 'translateY(15px)',
        animation: 'bookTransitionFloat 1.2s ease-out 1.8s forwards',
    });

    const loading = createElement({
        marginTop: '28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        opacity: '0',
        transform: 'translateY(15px)',
        animation: 'bookTransitionFloat 1.2s ease-out 2.4s forwards',
    });
    const spinner = document.createElement('span');
    spinner.textContent = '◌';
    Object.assign(spinner.style, {
        fontFamily: 'sans-serif',
        fontSize: '1.8rem',
        color: '#8E3038',
        marginBottom: '6px',
        animation: 'bookTransitionSpin 1s linear infinite',
    });
    const loadingText = document.createElement('span');
    loadingText.textContent = 'Đang mở không gian đọc...';
    Object.assign(loadingText.style, {
        fontFamily: "'Outfit', sans-serif",
        fontSize: '0.72rem',
        color: '#8E3038',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        fontWeight: '800',
    });

    loading.append(spinner, loadingText);
    content.append(author, title, line, quote, loading);
    return content;
}

function addTransitionStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes bookTransitionFade {
            from { opacity: 0; filter: blur(8px); transform: scale(0.95); }
            to { opacity: 1; filter: blur(0); transform: scale(1); }
        }
        @keyframes bookTransitionFloat {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bookTransitionLine {
            from { width: 0; opacity: 0; }
            to { width: 50px; opacity: 1; }
        }
        @keyframes bookTransitionSpin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
    return style;
}

function applyPageThickness(pages, side) {
    const shadows = side === 'right'
        ? [
            'inset 18px 0 30px rgba(0,0,0,0.08)',
            '1px 1px 0 #f7dce3', '2px 2px 0 #f1cbd6',
            '3px 3px 0 #f7dce3', '4px 4px 0 #f1cbd6',
            '5px 5px 0 #f7dce3', '6px 6px 0 #f1cbd6',
            '7px 7px 0 #f7dce3', '8px 8px 0 #eebfcd',
            '10px 10px 0 #e7b4c4', '12px 12px 0 #79243f',
            '28px 28px 50px rgba(0,0,0,0.28)',
        ]
        : [
            'inset -18px 0 30px rgba(0,0,0,0.08)',
            '-1px 1px 0 #f7dce3', '-2px 2px 0 #f1cbd6',
            '-3px 3px 0 #f7dce3', '-4px 4px 0 #f1cbd6',
            '-5px 5px 0 #f7dce3', '-6px 6px 0 #f1cbd6',
            '-7px 7px 0 #f7dce3', '-8px 8px 0 #eebfcd',
            '-10px 10px 0 #e7b4c4', '-12px 12px 0 #79243f',
            '-28px 28px 50px rgba(0,0,0,0.25)',
        ];
    pages.style.boxShadow = shadows.join(', ');
}

export function openBookReaderTransition({ bookCard, coverUrl, book, onComplete }) {
    if (!bookCard) {
        onComplete();
        return;
    }

    const rect = bookCard.getBoundingClientRect();
    // Giữ nguyên tỷ lệ tự nhiên của bìa sách (tránh bị bóp méo hình ảnh)
    const naturalRatio = (rect.height > 0 && rect.width > 0) ? (rect.width / rect.height) : (2 / 3);

    // Tính toán kích thước tối đa đảm bảo cả 2 trang mở ra đều lọt trọn trong màn hình
    const maxTargetHeight = Math.min(window.innerHeight * FLY_HEIGHT_RATIO, 660);
    const maxPageWidth = Math.min((window.innerWidth - 64) / 2, 450);

    let targetHeight = maxTargetHeight;
    let targetWidth = targetHeight * naturalRatio;
    if (targetWidth > maxPageWidth) {
        targetWidth = maxPageWidth;
        targetHeight = targetWidth / naturalRatio;
    }

    const isDarkTheme = document.documentElement.classList.contains('dark');
    const pageColor = isDarkTheme ? '#111210' : '#FAF7F2';
    const overlayColor = isDarkTheme ? 'rgba(17, 18, 16, 0.97)' : 'rgba(250, 247, 242, 0.97)';

    const overlay = createElement({
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        zIndex: '999999',
        pointerEvents: 'none',
        perspective: '2500px',
        background: 'rgba(250, 247, 242, 0)',
        backdropFilter: 'blur(0px)',
        WebkitBackdropFilter: 'blur(0px)',
        transition: 'all 1s ease',
    });

    const animatedBook = createElement({
        position: 'absolute',
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        transition: 'all 1s cubic-bezier(0.64, 0, 0.35, 1)',
        transformStyle: 'preserve-3d',
    });

    const pages = createElement({
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        background: pageColor,
        borderRadius: '2px 14px 14px 2px',
        boxShadow: 'inset 10px 0 20px rgba(0,0,0,0.03), 2px 2px 0 #E8E2D5, 4px 4px 0 #DFD7C7, 15px 15px 40px rgba(0,0,0,0.15)',
        zIndex: '1',
        borderRight: '1px solid #E8E2D5',
        borderTop: '1px solid #FAF7F2',
        borderBottom: '1px solid #DFD7C7',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'box-shadow 0.9s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.9s ease',
    });

    const coverWrapper = createElement({
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        transformOrigin: 'left center',
        transition: 'transform 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
        transformStyle: 'preserve-3d',
        zIndex: '2',
    });

    // Bìa trước: Sử dụng backgroundSize: 'cover' và 'center' để giữ chuẩn tỷ lệ hình ảnh bìa sách không bị bóp méo
    const coverFront = createElement({
        position: 'absolute',
        inset: '0',
        backgroundImage: `url("${coverUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        borderRadius: '2px 14px 14px 2px',
        boxShadow: '2px 0 10px rgba(0,0,0,0.15)',
        overflow: 'hidden',
    });

    // Gáy và hiệu ứng đổ bóng chiều sâu cho bìa trước
    const coverSpineShadow = createElement({
        position: 'absolute',
        left: '0',
        top: '0',
        bottom: '0',
        width: '24px',
        background: 'linear-gradient(to right, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)',
        pointerEvents: 'none',
        borderRadius: '2px 0 0 2px',
    });
    coverFront.appendChild(coverSpineShadow);

    const coverBack = createElement({
        position: 'absolute',
        inset: '0',
        background: pageColor,
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
        borderRadius: '14px 2px 2px 14px',
        boxShadow: 'inset -15px 0 25px rgba(0,0,0,0.05)',
        borderLeft: '1px solid #E8E2D5',
        borderTop: '1px solid #FAF7F2',
        borderBottom: '1px solid #DFD7C7',
    });

    const leftGradient = createElement({
        position: 'absolute',
        right: '0',
        top: '0',
        bottom: '0',
        width: '28px',
        background: 'linear-gradient(to left, rgba(142,48,56,0.14) 0%, rgba(142,48,56,0.04) 55%, transparent 100%)',
        pointerEvents: 'none',
        borderRadius: '0 2px 2px 0',
    });

    coverBack.append(leftGradient, createPageContent(book));
    coverWrapper.append(coverFront, coverBack);

    pages.append(createElement({
        position: 'absolute',
        left: '0',
        top: '0',
        bottom: '0',
        width: '28px',
        background: 'linear-gradient(to right, rgba(142,48,56,0.14) 0%, rgba(142,48,56,0.04) 55%, transparent 100%)',
        pointerEvents: 'none',
        borderRadius: '2px 0 0 2px',
    }));
    pages.append(createPageContent(book));

    animatedBook.append(pages, coverWrapper);
    overlay.appendChild(animatedBook);

    const transitionStyles = addTransitionStyles();
    document.body.appendChild(overlay);
    bookCard.style.opacity = '0';
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
        animatedBook.style.top = `${(window.innerHeight - targetHeight) / 2}px`;
        animatedBook.style.left = `${window.innerWidth / 2}px`;
        animatedBook.style.width = `${targetWidth}px`;
        animatedBook.style.height = `${targetHeight}px`;
        overlay.style.backdropFilter = 'blur(16px)';
        overlay.style.WebkitBackdropFilter = 'blur(16px)';
        overlay.style.background = overlayColor;
    });

    window.setTimeout(() => {
        coverWrapper.style.transform = 'rotateY(-180deg)';
        overlay.style.background = overlayColor;
        applyPageThickness(pages, 'right');
        applyPageThickness(coverBack, 'left');
    }, FLY_DURATION);

    window.setTimeout(() => {
        sessionStorage.setItem('halm-reader-book', JSON.stringify(book || {}));
        transitionStyles.remove();
        overlay.remove();
        bookCard.style.opacity = '';
        document.body.style.overflow = '';
        onComplete();
    }, FLY_DURATION + READER_DELAY);
}
