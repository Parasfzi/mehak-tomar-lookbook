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
                    </div>
                `;
                bookContainer.appendChild(coverPage);

                let pageNum = 1;

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
                            <div class="page-number">${pageNum}</div>
                            <button class="back-to-cover-btn">Cover</button>
                          </div>
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

                            galleryHTML += `
                                <a href="${img.imageUrl}" class="masonry-item" data-pswp-width="${w}" data-pswp-height="${h}" target="_blank">
                                  <img src="${img.imageUrl}" alt="${style.title} Portrait" loading="lazy" />
                                </a>
                            `;
                        });
                        rightPage.innerHTML = `
                          <div class="page-content">
                            <div class="masonry-gallery" id="gallery-${style.slug}">
                              ${galleryHTML}
                            </div>
                            <div class="page-number">${pageNum}</div>
                          </div>
                        `;
                        bookContainer.appendChild(rightPage);
                        pageNum++;
                    }
                }

                // Ensure even number of pages for the book format 
                // (StPageFlip prefers even number of total pages)
                if (bookContainer.children.length % 2 !== 0) {
                    const emptyPage = document.createElement('div');
                    emptyPage.className = 'page';
                    emptyPage.innerHTML = `<div class="page-content"></div><div class="page-number">${pageNum}</div><button class="back-to-cover-btn">Cover</button>`;
                    bookContainer.appendChild(emptyPage);
                }
            }

            // 3. Init StPageFlip
            // Calculate responsive dimensions
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            // Responsive dimensions: 1 page width and height
            let bookWidth = 0;
            let bookHeight = vh * 0.85; // 85% of screen height

            if (vw >= 768) {
                // Desktop: Book should be wide enough for spread but not clip
                bookWidth = Math.min(vw * 0.45, 600);
            } else {
                // Mobile: Book should fill width
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
                mobileScrollSupport: true,
                usePortrait: true, // Auto-switches to single page on narrow screens
                flippingTime: 1000,
                swipeDistance: 30
            });

            pageFlip.loadFromHTML(document.querySelectorAll('.page'));

            // Show nav buttons on desktop
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

    // Open Lookbook transition
    openBookBtn.addEventListener('click', async () => {
        openBookBtn.style.pointerEvents = 'none';
        openBookBtn.innerHTML = '<span class="btn-text">Opening...</span>';

        // Start fetching data in background only if not already initialized
        if (!pageFlip) {
            await initLookbook();
        }

        // Transition
        loaderView.style.display = 'flex';
        // force reflow
        void loaderView.offsetWidth;
        loaderView.classList.add('fade-out');
        bookContainer.classList.remove('hidden');

        setTimeout(() => {
            loaderView.style.display = 'none';
        }, 1000); // 1s matches CSS transition
    });

    // Navigation Button events
    prevBtn.addEventListener('click', () => {
        if (pageFlip) pageFlip.flipPrev();
    });

    nextBtn.addEventListener('click', () => {
        if (pageFlip) pageFlip.flipNext();
    });

    // Close lookbook / Back to cover
    document.addEventListener('click', (e) => {
        if (e.target.closest('.back-to-cover-btn')) {
            loaderView.style.display = 'flex';
            // force reflow
            void loaderView.offsetWidth;
            loaderView.classList.remove('fade-out');

            // Hide nav buttons
            prevBtn.classList.add('hidden');
            nextBtn.classList.add('hidden');

            setTimeout(() => {
                bookContainer.classList.add('hidden');
                openBookBtn.style.pointerEvents = 'auto';
                openBookBtn.innerHTML = '<span class="btn-text">Open Portfolio</span>';
                if (pageFlip) {
                    pageFlip.turnToPage(0); // reset book to start
                }
            }, 1000);
        }
    });

});
