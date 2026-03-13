document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('mt_admin_token');
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');

    // Elements
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');

    // Styles Elements
    const stylesList = document.getElementById('styles-list');
    const addStyleBtn = document.getElementById('add-style-btn');
    const styleFormContainer = document.getElementById('style-form-container');
    const saveStyleBtn = document.getElementById('save-style-btn');
    const cancelStyleBtn = document.getElementById('cancel-style-btn');

    // Modals
    const editStyleModal = document.getElementById('edit-style-modal');
    const manageImagesModal = document.getElementById('manage-images-modal');
    const closeModals = document.querySelectorAll('.close-modal');

    // Mobile Menu Elements
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const sidebarLinks = document.querySelectorAll('.nav-links a');

    let currentStyles = [];
    let sortableStyles;
    let sortableImages;
    let activeStyleId = null;

    // Init
    if (token) {
        verifyToken(token);
    }

    // --- Auth Logic ---
    async function verifyToken(token) {
        try {
            const res = await fetch('/api/auth/verify', {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                showDashboard();
            } else {
                localStorage.removeItem('mt_admin_token');
            }
        } catch (err) {
            console.error(err);
            localStorage.removeItem('mt_admin_token');
        }
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('mt_admin_token', data.token);
                showDashboard();
            } else {
                loginError.textContent = data.msg;
            }
        } catch (err) {
            loginError.textContent = 'Login failed';
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('mt_admin_token');
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
    });

    function showDashboard() {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        loadStyles();
    }

    // --- Mobile Menu Interaction ---
    function toggleMobileMenu() {
        sidebar.classList.toggle('active');
    }

    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    sidebarOverlay.addEventListener('click', toggleMobileMenu);

    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (sidebar.classList.contains('active')) {
                toggleMobileMenu();
            }
        });
    });

    // --- Styles Logic ---
    async function loadStyles() {
        try {
            const res = await fetch('/api/styles');
            currentStyles = await res.json();
            renderStyles();
        } catch (err) {
            console.error('Error loading styles:', err);
        }
    }

    function renderStyles() {
        stylesList.innerHTML = '';
        currentStyles.forEach(style => {
            const li = document.createElement('li');
            li.className = 'style-item';
            li.dataset.id = style._id;
            li.innerHTML = `
        <div class="style-info">
          <h4>${style.title}</h4>
          <p>/${style.slug}</p>
        </div>
        <div class="style-actions">
          <button class="btn btn-outline edit-style-btn" data-id="${style._id}">Edit</button>
          <button class="btn btn-primary manage-imgs-btn" data-id="${style._id}" data-title="${style.title}">Images</button>
          <button class="btn btn-outline delete-style-btn" data-id="${style._id}">Delete</button>
        </div>
      `;
            stylesList.appendChild(li);
        });

        initStyleSortable();
        attachStyleListeners();
    }

    function initStyleSortable() {
        if (sortableStyles) sortableStyles.destroy();
        sortableStyles = new Sortable(stylesList, {
            animation: 150,
            onEnd: async function () {
                const items = stylesList.querySelectorAll('.style-item');
                const orderDetails = Array.from(items).map((item, index) => ({
                    id: item.dataset.id,
                    order: index
                }));

                await fetch('/api/styles/reorder/batch', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': localStorage.getItem('mt_admin_token')
                    },
                    body: JSON.stringify({ orderDetails })
                });
            }
        });
    }

    addStyleBtn.addEventListener('click', () => {
        styleFormContainer.classList.remove('hidden');
        addStyleBtn.classList.add('hidden');
    });

    cancelStyleBtn.addEventListener('click', () => {
        styleFormContainer.classList.add('hidden');
        addStyleBtn.classList.remove('hidden');
        document.getElementById('new-style-title').value = '';
        document.getElementById('new-style-slug').value = '';
    });

    saveStyleBtn.addEventListener('click', async () => {
        const title = document.getElementById('new-style-title').value;
        const slug = document.getElementById('new-style-slug').value;

        if (!title || !slug) return alert('Title and slug required');

        try {
            const res = await fetch('/api/styles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('mt_admin_token')
                },
                body: JSON.stringify({ title, slug })
            });
            if (res.ok) {
                cancelStyleBtn.click();
                loadStyles();
            } else {
                const data = await res.json();
                alert(data.msg);
            }
        } catch (err) {
            console.error(err);
        }
    });

    function attachStyleListeners() {
        document.querySelectorAll('.edit-style-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const style = currentStyles.find(s => s._id === id);
                if (style) {
                    document.getElementById('edit-style-id').value = style._id;
                    document.getElementById('edit-style-title').value = style.title;
                    document.getElementById('edit-style-slug').value = style.slug;
                    editStyleModal.classList.remove('hidden');
                }
            });
        });

        document.querySelectorAll('.delete-style-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (!confirm('Are you sure? This deletes the style and ALL its images.')) return;
                const id = e.target.dataset.id;
                try {
                    await fetch(`/api/styles/${id}`, {
                        method: 'DELETE',
                        headers: { 'x-auth-token': localStorage.getItem('mt_admin_token') }
                    });
                    loadStyles();
                } catch (err) { console.error(err); }
            });
        });

        document.querySelectorAll('.manage-imgs-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                activeStyleId = e.target.dataset.id;
                const title = e.target.dataset.title;
                document.getElementById('manage-images-title').innerText = `Images: ${title}`;
                manageImagesModal.classList.remove('hidden');
                loadImages(activeStyleId);
            });
        });
    }

    // --- Edit Style Modal Save ---
    document.getElementById('save-edit-style-btn').addEventListener('click', async () => {
        const id = document.getElementById('edit-style-id').value;
        const title = document.getElementById('edit-style-title').value;
        const slug = document.getElementById('edit-style-slug').value;

        try {
            const res = await fetch(`/api/styles/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('mt_admin_token')
                },
                body: JSON.stringify({ title, slug })
            });
            if (res.ok) {
                editStyleModal.classList.add('hidden');
                loadStyles();
            } else {
                const data = await res.json();
                alert(data.msg);
            }
        } catch (err) { console.error(err); }
    });

    // --- Close Modals ---
    closeModals.forEach(btn => {
        btn.addEventListener('click', () => {
            editStyleModal.classList.add('hidden');
            manageImagesModal.classList.add('hidden');
            activeStyleId = null;
        });
    });

    // --- Images Logic ---
    const imagesGrid = document.getElementById('images-grid');
    const uploadInput = document.getElementById('image-upload-input');
    const triggerUploadBtn = document.getElementById('trigger-upload-btn');
    const uploadProgress = document.getElementById('upload-progress');

    async function loadImages(styleId) {
        imagesGrid.innerHTML = 'Loading...';
        try {
            // Find style slug to use public endpoint OR create an admin endpoint. Using public slug endpoint:
            const style = currentStyles.find(s => s._id === styleId);
            const res = await fetch(`/api/styles/${style.slug}/images`);
            const images = await res.json();
            renderImages(images);
        } catch (err) {
            console.error(err);
            imagesGrid.innerHTML = 'Error loading images';
        }
    }

    function renderImages(images) {
        imagesGrid.innerHTML = '';
        images.forEach(img => {
            const div = document.createElement('div');
            div.className = 'image-card';
            div.dataset.id = img._id;
            div.innerHTML = `
        <img src="${img.imageUrl}" alt="Portrait">
        <div class="image-actions">
          <button class="btn-icon delete-img-btn" data-id="${img._id}">X</button>
        </div>
      `;
            imagesGrid.appendChild(div);
        });

        initImageSortable();

        document.querySelectorAll('.delete-img-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const btn = e.currentTarget;
                if (!confirm('Delete this image?')) return;
                const id = btn.dataset.id;
                try {
                    const response = await fetch(`/api/images/${id}`, {
                        method: 'DELETE',
                        headers: { 'x-auth-token': localStorage.getItem('mt_admin_token') }
                    });
                    
                    if (response.ok) {
                        btn.closest('.image-card').remove();
                    } else {
                        const data = await response.json();
                        alert('Error deleting image: ' + (data.msg || 'Unknown error'));
                    }
                } catch (err) { 
                    console.error(err);
                    alert('Failed to connect to server for deletion.');
                }
            });
        });
    }

    function initImageSortable() {
        if (sortableImages) sortableImages.destroy();
        sortableImages = new Sortable(imagesGrid, {
            animation: 150,
            onEnd: async function () {
                const items = imagesGrid.querySelectorAll('.image-card');
                const orderDetails = Array.from(items).map((item, index) => ({
                    id: item.dataset.id,
                    order: index
                }));

                await fetch('/api/images/reorder/batch', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': localStorage.getItem('mt_admin_token')
                    },
                    body: JSON.stringify({ orderDetails })
                });
            }
        });
    }

    triggerUploadBtn.addEventListener('click', () => {
        uploadInput.click();
    });

    uploadInput.addEventListener('change', async (e) => {
        const files = e.target.files;
        if (!files.length) return;

        uploadProgress.classList.remove('hidden');

        for (let i = 0; i < files.length; i++) {
            const formData = new FormData();
            formData.append('image', files[i]);
            formData.append('styleId', activeStyleId);

            try {
                await fetch('/api/images/upload', {
                    method: 'POST',
                    headers: { 'x-auth-token': localStorage.getItem('mt_admin_token') },
                    body: formData
                });
            } catch (err) {
                console.error('Upload failed for file', i);
            }
        }

        uploadProgress.classList.add('hidden');
        uploadInput.value = ''; // Reset
        loadImages(activeStyleId);
    });

});
