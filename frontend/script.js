import PhotoSwipeLightbox from 'https://unpkg.com/photoswipe@5.2.2/dist/photoswipe-lightbox.esm.js';

document.addEventListener('DOMContentLoaded', async () => {
    const loaderView = document.getElementById('loader-view');
    const openBookBtn = document.getElementById('open-book-btn');
    const bookContainer = document.getElementById('book');
    const loadingSpinner = document.getElementById('loading-spinner');

    // Nav Buttons
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');

    let pageFlip;

    // Initialize Lightbox
    const lightbox = new PhotoSwipeLightbox({
        gallery: '.masonry-gallery',
        children: 'a',
        pswpModule: () => import('https://unpkg.com/photoswipe@5.2.2/dist/photoswipe.esm.js'),
        bgOpacity: 0.9,
        padding: { top: 20, bottom: 20, left: 20, right: 20 }
    });
    lightbox.init();

    async function initLookbook() {
        loadingSpinner.classList.remove('hidden');

        try {
            // 1. Fetch Styles
            const res = await fetch('/api/styles');
            const styles = await res.json();

            if (styles.length === 0) {
                // No styles defined
                bookContainer.innerHTML = '<div class="page"><div class="page-content"><h2 class="page-title">Coming Soon</h2></div></div>';
            } else {
                // 2. Fetch images for each style and build pages
                bookContainer.innerHTML = '';

                // Add an elegant hard front cover
                const coverPage = document.createElement('div');
                coverPage.className = 'page page-cover';
                coverPage.setAttribute('data-density', 'hard');
                coverPage.innerHTML = `
                    <div class="page-content" style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; border: 1px solid rgba(201, 169, 110, 0.2); background: linear-gradient(135deg, #111 0%, #0a0a0a 100%);">
                        <div style="font-size: 0.8rem; letter-spacing: 4px; color: var(--gold); margin-bottom: 2rem; text-transform: uppercase;">Mehak Tomar</div>
                        <h1 class="page-title" style="font-size: 4rem; margin-bottom: 0;">Lookbook</h1>
                        <div style="width: 50px; height: 1px; background: var(--gold); margin: 2rem auto;"></div>
                        <div style="font-size: 0.9rem; letter-spacing: 2px; color: var(--text-muted); text-transform: uppercase;">Cinematic Portraits</div>
                        
                        <!-- Mobile Swipe Hint inside Book -->
                        <div class="mobile-swipe-hint">
                            <span class="swipe-arrow">←</span>
                            <span class="swipe-text">Swipe to Browse</span>
                            <span class="swipe-arrow">→</span>
                        </div>
                    </div>
                    <div class="page-number">0</div>
                `;
                bookContainer.appendChild(coverPage);

                let pageNum = 1;

                const isMobile = window.innerWidth < 768;

                for (const style of styles) {
                    const imgRes = await fetch(`/api/styles/${style.slug}/images`);
                    const images = await imgRes.json();

                    if (images.length > 0) {
                        // Create Left Page (Title & Info)
                        const leftPage = document.createElement('div');
                        leftPage.className = 'page';
                        leftPage.innerHTML = `
                            <div class="page-content style-content" style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%;">
                                <div style="font-size: 0.8rem; letter-spacing: 4px; color: var(--gold); margin-bottom: 2rem; text-transform: uppercase;">Mehak Tomar</div>
                                <h2 class="page-title" style="font-size: 3.5rem; margin-bottom: 2rem;">${style.title}</h2>
                                <div style="width: 30px; height: 1px; background: var(--gold); margin: 0 auto 2rem auto;"></div>
                                <div style="font-size: 0.8rem; letter-spacing: 2px; color: var(--text-muted); text-transform: uppercase;">Style: ${style.slug}</div>
                                <button class="back-to-cover-btn">Cover</button>
                            </div>
                            <div class="page-number">${pageNum}</div>
                        `;
                        bookContainer.appendChild(leftPage);
                        pageNum++;

                        // Create Right Page (Images Gallery)
                        const rightPage = document.createElement('div');
                        rightPage.className = 'page';
                        let galleryHTML = '';
                        images.forEach(img => {
                            let w = 1200, h = 1600;
                            if (img.aspectRatio === '1:1') { w = 1200; h = 1200; }
                            if (img.aspectRatio === '9:16') { w = 900; h = 1600; }
                            if (img.aspectRatio === '4:5') { w = 1000; h = 1250; }

                            // OPTIMIZATION: Resize images for mobile browsers using Cloudinary transformations
                            let optimizedUrl = img.imageUrl;
                            if (isMobile && optimizedUrl.includes('upload/')) {
                                optimizedUrl = optimizedUrl.replace('upload/', 'upload/w_800,c_limit,q_auto,f_auto/');
                            }

                            galleryHTML += `
                                <a href="${img.imageUrl}" class="masonry-item" data-pswp-width="${w}" data-pswp-height="${h}" target="_blank">
                                    <img src="${optimizedUrl}" alt="${style.title} Portrait" loading="lazy" />
                                </a>
                            `;
                        });
                        rightPage.innerHTML = `
                            <div class="page-content">
                                <div class="masonry-gallery" id="gallery-${style.slug}">
                                    ${galleryHTML}
                                </div>
                            </div>
                            <div class="page-number">${pageNum}</div>
                        `;
                        bookContainer.appendChild(rightPage);
                        pageNum++;
                    }
                }

                if (bookContainer.children.length % 2 !== 0) {
                    const emptyPage = document.createElement('div');
                    emptyPage.className = 'page';
                    emptyPage.innerHTML = `<div class="page-content"></div><div class="page-number">${pageNum}</div><button class="back-to-cover-btn">Cover</button>`;
                    bookContainer.appendChild(emptyPage);
                }
            }

            const vw = window.innerWidth;
            const vh = window.innerHeight;

            let bookWidth = 0;
            let bookHeight = vh * 0.85;

            if (vw >= 768) {
                bookWidth = Math.min(vw * 0.45, 600);
            } else {
                bookWidth = vw * 0.95;
            }

            pageFlip = new St.PageFlip(bookContainer, {
                width: bookWidth,
                height: bookHeight,
                size: "stretch",
                minWidth: 300,
                maxWidth: 1000,
                minHeight: 400,
                maxHeight: 1500,
                drawShadow: true,
                maxShadowOpacity: 0.8,
                showCover: true,
                mobileScrollSupport: false, // Disable to prevent browser gesture interference
                usePortrait: true,
                flippingTime: 800, // Faster flip for mobile snappiness
                swipeDistance: 30
            });

            pageFlip.loadFromHTML(document.querySelectorAll('.page'));

            if (vw >= 768) {
                prevBtn.classList.remove('hidden');
                nextBtn.classList.remove('hidden');
            }

        } catch (error) {
            console.error('Error initializing lookbook:', error);
        } finally {
            loadingSpinner.classList.add('hidden');
        }
    }

    openBookBtn.addEventListener('click', async () => {
        openBookBtn.style.pointerEvents = 'none';
        openBookBtn.innerHTML = '<span class="btn-text">Opening...</span>';

        if (!pageFlip) {
            await initLookbook();
        }

        loaderView.style.display = 'flex';
        void loaderView.offsetWidth;
        loaderView.classList.add('fade-out');
        bookContainer.classList.remove('hidden');

        setTimeout(() => {
            loaderView.style.display = 'none';
        }, 1000);
    });

    prevBtn.addEventListener('click', () => {
        if (pageFlip) pageFlip.flipPrev();
    });

    nextBtn.addEventListener('click', () => {
        if (pageFlip) pageFlip.flipNext();
    });

    document.addEventListener('click', (e) => {
        if (e.target.closest('.back-to-cover-btn')) {
            loaderView.style.display = 'flex';
            void loaderView.offsetWidth;
            loaderView.classList.remove('fade-out');

            prevBtn.classList.add('hidden');
            nextBtn.classList.add('hidden');

            setTimeout(() => {
                bookContainer.classList.add('hidden');
                openBookBtn.style.pointerEvents = 'auto';
                openBookBtn.innerHTML = '<span class="btn-text">Open Portfolio</span>';
                if (pageFlip) {
                    pageFlip.turnToPage(0);
                }
            }, 1000);
        }
    });

    // --- Custom Cursor Logic (Option 1) ---
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');

    let mouseX = 0;
    let mouseY = 0;
    let outlineX = 0;
    let outlineY = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        cursorDot.style.left = mouseX + 'px';
        cursorDot.style.top = mouseY + 'px';

        const target = e.target;
        const isInteractive = target.closest('button, a, .page-item, .nav-btn, .image-card, [role="button"]');
        if (isInteractive) {
            document.body.classList.add('cursor-hover');
        } else {
            document.body.classList.remove('cursor-hover');
        }
    });

    function animateCursor() {
        const lerpFactor = 0.15;
        outlineX += (mouseX - outlineX) * lerpFactor;
        outlineY += (mouseY - outlineY) * lerpFactor;

        cursorOutline.style.left = outlineX + 'px';
        cursorOutline.style.top = outlineY + 'px';

        requestAnimationFrame(animateCursor);
    }
    animateCursor();

});
