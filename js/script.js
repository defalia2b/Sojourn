// FUNGSI GLOBAL DI LUAR
let currentUser = null;
window.navigate = function(pageId, data = null) {
    if (window.location.hash !== '#' + pageId) {
        window.location.hash = '#' + pageId;
    }
    if (data !== null) {
        window._navigateData = data;
    } else {
        window._navigateData = null;
    }
};

window.handleLogout = function() {
    const userName = currentUser?.name || '';
    currentUser = null;
    sessionStorage.removeItem('sojournUser');
    alert(`Anda telah berhasil logout, ${userName}.`);
    window.location.href = window.location.pathname; // Redirect ke halaman utama setelah logout
};

window.switchAuthForm = function(formType) {
    if (window.location.hash !== '#' + formType) {
        window.location.hash = '#' + formType;
    } else {
        showPageBasedOnURL();
    }
    document.getElementById('login-form-container').classList.add('hidden');
    document.getElementById('register-form-container').classList.add('hidden');
    document.getElementById('forgot-form-container').classList.add('hidden');
    document.getElementById(formType + '-form-container').classList.remove('hidden');
};

document.addEventListener('DOMContentLoaded', () => {

    // --- Inisialisasi currentUser dari sessionStorage jika ada ---
    const userStr = sessionStorage.getItem('sojournUser');
    if (userStr) {
        try {
            currentUser = JSON.parse(userStr);
        } catch (e) {
            currentUser = null;
        }
    } else {
        currentUser = null;
    }
    updateHeaderUI();

    // --- App State ---
    // const allHotels = [ ... ]; // DIHAPUS, digantikan dengan hasil fetch API
    let allHotels = [];
    let allFacilitiesOptions = ['Kolam Renang', 'WiFi Gratis', 'Parkir', 'Restoran', 'Spa', 'Pusat Kebugaran'];
    let currentSort = '';

    // --- Helpers ---
    const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

    function getRatingLabel(rating) {
        if (rating >= 9) return 'Luar Biasa';
        if (rating >= 8) return 'Sangat Baik';
        if (rating >= 6.5) return 'Baik';
        if (rating >= 5) return 'Cukup';
        if (rating > 0) return 'Buruk';
        return '-';
    }

    // --- API Communication Functions ---
    async function fetchHotels() {
        try {
            const response = await fetch('api_get_hotels.php');
            if (!response.ok) throw new Error('Gagal mengambil data hotel');
            const data = await response.json();
            allHotels = data.hotels || [];
        } catch (err) {
            alert('Gagal mengambil data hotel.');
            allHotels = [];
        }
    }

    async function apiLogin(email, password) {
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        const response = await fetch('api_login.php', {
            method: 'POST',
            body: formData
        });
        return response.json();
    }

    async function apiRegister(name, email, password) {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('password', password);
        const response = await fetch('api_register.php', {
            method: 'POST',
            body: formData
        });
        return response.json();
    }

    async function apiCreateBooking(bookingData) {
        const formData = new FormData();
        Object.entries(bookingData).forEach(([key, value]) => formData.append(key, value));
        const response = await fetch('api_create_booking.php', {
            method: 'POST',
            body: formData
        });
        return response.json();
    }

    // Tambahkan fungsi ambil fasilitas dari API
    async function fetchFacilities() {
        try {
            const response = await fetch('api_get_facilities.php');
            const data = await response.json();
            if (data.success && Array.isArray(data.facilities)) {
                return data.facilities.map(f => f.name);
            }
            return [];
        } catch (err) {
            return [];
        }
    }

    // --- Navigation Logic & STATE ---
    // window.navigate = (pageId, data = null) => { // HAPUS deklarasi ini dari dalam blok
    //     // Update the URL hash for client-side routing
    //     if (window.location.hash !== '#' + pageId) {
    //         window.location.hash = '#' + pageId;
    //     }
    //     // Optionally store data for detail/booking/confirmation
    //     if (data !== null) {
    //         window._navigateData = data;
    //     } else {
    //         window._navigateData = null;
    //     }
    // };

    // --- Client-side Routing: Show Page Based on URL Hash ---
    function showPageBasedOnURL() {
        // Jika data hotel belum siap, jangan render page lain dulu
        if (!allHotels || allHotels.length === 0) {
            document.querySelectorAll('.page-content').forEach(page => page.classList.add('hidden'));
            // Optional: tampilkan pesan loading di salah satu div jika mau
            return;
        }
        const hash = window.location.hash || '#home';
        const pageId = hash.replace('#', '');
        // Hide all pages
        document.querySelectorAll('.page-content').forEach(page => page.classList.add('hidden'));
        const header = document.getElementById('main-header');
        const footer = document.getElementById('main-footer');
        // Hide header/footer for login/register/forgot page
        if (pageId === 'login' || pageId === 'register' || pageId === 'forgot') {
            header.classList.add('hidden');
            footer.classList.add('hidden');
        } else {
            header.classList.remove('hidden');
            footer.classList.remove('hidden');
        }
        // Render and show the correct page or form
        if (pageId === 'home') {
            renderHomePage();
        } else if (pageId === 'search') {
            renderSearchResultsPage(window._navigateData || {});
        } else if (pageId === 'detail') {
            renderHotelDetails(window._navigateData);
        } else if (pageId === 'booking') {
            showBookingForm(window._navigateData);
        } else if (pageId === 'confirmation') {
            renderConfirmation(window._navigateData);
        } else if (pageId === 'team') {
            // Tidak perlu render khusus, cukup tampilkan section
            // Jangan navigate('home') di sini
        } else if (pageId === 'history') {
            fetchAndRenderBookings();
        } else {
            // Jangan navigate('home') otomatis!
            // Biarkan hash tetap, tampilkan page kosong jika id tidak dikenali
        }
        // Show the page div
        const pageDiv = document.getElementById(pageId + '-page');
        if (pageDiv) {
            pageDiv.classList.remove('hidden');
        }
        window.scrollTo(0, 0);
        updateHeaderUI();
    }

    // Listen for hash changes
    window.addEventListener('hashchange', showPageBasedOnURL);

    // --- User Authentication Logic (LOGIN/REGISTER/LOGOUT) ---
    function updateHeaderUI() {
        const authContainer = document.getElementById('auth-button-container');
        if (currentUser) {
            authContainer.innerHTML = `
                <div class="flex items-center gap-4">
                    <button onclick="navigate('history'); event.preventDefault();" class="flex items-center gap-2 bg-brand-green text-white px-5 py-2 rounded-full shadow-md font-semibold hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400">
                        <svg xmlns='http://www.w3.org/2000/svg' class='w-5 h-5 mr-1' fill='none' viewBox='0 0 24 24' stroke='currentColor' stroke-width='2'>
                            <path stroke-linecap='round' stroke-linejoin='round' d='M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' />
                        </svg>
                        Pemesanan Saya
                    </button>
                    <span class="font-semibold text-brand-grey">Halo, ${currentUser.name.split(' ')[0]}</span>
                    <button onclick="handleLogout()" class="bg-red-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-red-600 transition-colors">Logout</button>
                </div>
            `;
        } else {
            authContainer.innerHTML = `
                <button onclick="navigate('login')" class="bg-brand-green text-white px-6 py-2 rounded-full font-semibold hover:bg-opacity-90 transition-colors">Login</button>
            `;
        }
    }

    function handleRegister(event) {
        event.preventDefault();
        const name = event.target.elements.name.value;
        const email = event.target.elements.email.value;
        const password = event.target.elements.password.value;
        if (!name || !email || !password) {
            alert('Harap isi semua kolom.');
            return;
        }
        apiRegister(name, email, password).then(result => {
            if (result.success) {
                alert('Registrasi berhasil! Silakan login.');
                switchAuthForm('login');
            } else {
                alert(result.message || 'Registrasi gagal.');
            }
        }).catch(() => {
            alert('Registrasi gagal.');
        });
    }

    function handleLogin(event) {
        event.preventDefault();
        const email = event.target.elements.email.value;
        const password = event.target.elements.password.value;
        apiLogin(email, password).then(result => {
            if (result.success && result.user) {
                currentUser = result.user;
                sessionStorage.setItem('sojournUser', JSON.stringify(result.user));
                alert(`Selamat datang kembali, ${currentUser.name}!`);
                updateHeaderUI();
                navigate('home');
            } else {
                alert(result.message || 'Email atau password salah.');
            }
        }).catch(() => {
            alert('Login gagal.');
        });
    }

    // --- Content Render Funciton ---
    
    function renderHotelCard(hotel) {
        // Fasilitas utama (maks 3), sisanya +n
        const maxShow = 3;
        const fasilitas = hotel.facilities || [];
        const shown = fasilitas.slice(0, maxShow);
        const moreCount = fasilitas.length - maxShow;
        let fasilitasHTML = shown.map(f => `<span class='bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full mr-1'>${f}</span>`).join('');
        if (moreCount > 0) {
            fasilitasHTML += `<span class='bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-1 rounded-full cursor-pointer relative more-facilities-tag' title='${fasilitas.slice(maxShow).join(', ')}'>+${moreCount}</span>`;
        }
        // Ambil harga termurah dari room_types
        let minRoomPrice = null;
        if (hotel.room_types && hotel.room_types.length > 0) {
            minRoomPrice = Math.min(...hotel.room_types.map(rt => parseFloat(rt.price)));
        }
        // Ambil gambar utama hotel
        const mainImage = hotel.image || (hotel.room_types && hotel.room_types[0] && hotel.room_types[0].image_gallery ? hotel.room_types[0].image_gallery.split(',')[0].trim() : '');
        // Ambil rating dari review (presisi 1) dan label huruf capitalize
        function capitalize(str) {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        }
        const avgRating = hotel.avg_review_rating !== null && hotel.avg_review_rating !== undefined ? hotel.avg_review_rating.toFixed(1) : '-';
        const ratingLabel = hotel.avg_review_rating !== null && hotel.avg_review_rating !== undefined ? capitalize(getRatingLabel(hotel.avg_review_rating)) : '-';
        return `
            <div class="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer" onclick="navigate('detail', ${hotel.id})">
                <img src="${mainImage}" class="w-full h-56 object-cover" alt="Gambar ${hotel.name}">
                <div class="p-6 flex flex-col gap-2">
                    <p class="text-sm text-brand-grey mb-1">${hotel.location}</p>
                    <h3 class="text-xl font-bold text-brand-black mb-2">${hotel.name}</h3>
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex flex-col items-start">
                            <span class="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Mulai dari</span>
                            <span class="text-2xl font-bold text-brand-green leading-tight">${minRoomPrice !== null ? formatCurrency(minRoomPrice) : '-'}</span>
                            <span class="text-xs text-brand-grey font-normal">/ malam</span>
                        </div>
                        <div class="flex flex-col items-end ml-4">
                            <span class="font-bold text-brand-black text-lg">
                                <svg class="inline w-5 h-5 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
                                ${avgRating}
                            </span>
                            <span class="text-xs text-brand-green font-semibold">${ratingLabel}</span>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-1 mt-3">${fasilitasHTML}</div>
                </div>
            </div>
        `;
    }
    
    function renderSearchBar(containerId, initialQuery = '') {
        const container = document.getElementById(containerId);
        container.classList.add('search-bar-card'); // Tambahkan class card modern
        // State untuk tamu
        let guestState = {
            dewasa: 2,
            anak: 0,
            kamar: 1
        };
        function getGuestLabel() {
            return `${guestState.dewasa} Dewasa, ${guestState.anak} Anak, ${guestState.kamar} Kamar`;
        }
        container.innerHTML = `
            <div class="search-bar-grid">
                <div class="search-field">
                    <label>Lokasi</label>
                    <input type="text" id="${containerId}-location" value="${initialQuery}" placeholder="Cari kota atau hotel...">
                </div>
                <div class="search-field">
                    <label>Check-in</label>
                    <input type="date" class="form-input-date">
                </div>
                <div class="search-field">
                    <label>Check-out</label>
                    <input type="date" class="form-input-date">
                </div>
                <div class="search-field" style="position:relative;">
                    <label>Tamu</label>
                    <button type="button" id="${containerId}-guests-label" class="form-input text-left w-full flex items-center justify-between" style="cursor:pointer;">
                        <span id="${containerId}-guests-label-text">${getGuestLabel()}</span>
                        <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                    </button>
                    <div id="${containerId}-guests-dropdown" class="guests-dropdown" style="display:none;position:absolute;z-index:20;left:0;top:100%;background:#fff;border:1px solid #E5E7EB;border-radius:0.75rem;box-shadow:0 4px 24px 0 rgba(36,171,112,0.08),0 1.5px 6px 0 rgba(0,0,0,0.04);padding:1rem;width:260px;min-width:220px;">
                        <div class="flex items-center justify-between mb-2">
                            <span>Dewasa</span>
                            <div class="flex items-center gap-2">
                                <button type="button" id="${containerId}-dewasa-minus" class="guest-btn">-</button>
                                <input type="number" id="${containerId}-dewasa" min="1" max="10" value="2" class="guest-input">
                                <button type="button" id="${containerId}-dewasa-plus" class="guest-btn">+</button>
                            </div>
                        </div>
                        <div class="flex items-center justify-between mb-2">
                            <span>Anak</span>
                            <div class="flex items-center gap-2">
                                <button type="button" id="${containerId}-anak-minus" class="guest-btn">-</button>
                                <input type="number" id="${containerId}-anak" min="0" max="10" value="0" class="guest-input">
                                <button type="button" id="${containerId}-anak-plus" class="guest-btn">+</button>
                            </div>
                        </div>
                        <div class="flex items-center justify-between">
                            <span>Kamar</span>
                            <div class="flex items-center gap-2">
                                <button type="button" id="${containerId}-kamar-minus" class="guest-btn">-</button>
                                <input type="number" id="${containerId}-kamar" min="1" max="10" value="1" class="guest-input">
                                <button type="button" id="${containerId}-kamar-plus" class="guest-btn">+</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <button id="${containerId}-button" class="search-button-main">Cari</button>
        `;
        // Dropdown logic
        const labelBtn = document.getElementById(`${containerId}-guests-label`);
        const dropdown = document.getElementById(`${containerId}-guests-dropdown`);
        const labelText = document.getElementById(`${containerId}-guests-label-text`);
        labelBtn.onclick = (e) => {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        };
        function closeDropdown(e) {
            if (!dropdown.contains(e.target) && e.target !== labelBtn) {
                dropdown.style.display = 'none';
            }
        }
        document.addEventListener('mousedown', closeDropdown);
        // Dewasa
        const dewasaInput = document.getElementById(`${containerId}-dewasa`);
        document.getElementById(`${containerId}-dewasa-minus`).onclick = () => {
            if (guestState.dewasa > 1) guestState.dewasa--;
            dewasaInput.value = guestState.dewasa;
            labelText.textContent = getGuestLabel();
        };
        document.getElementById(`${containerId}-dewasa-plus`).onclick = () => {
            if (guestState.dewasa < 10) guestState.dewasa++;
            dewasaInput.value = guestState.dewasa;
            labelText.textContent = getGuestLabel();
        };
        dewasaInput.oninput = () => {
            let val = parseInt(dewasaInput.value) || 1;
            if (val < 1) val = 1;
            if (val > 10) val = 10;
            guestState.dewasa = val;
            dewasaInput.value = val;
            labelText.textContent = getGuestLabel();
        };
        // Anak
        const anakInput = document.getElementById(`${containerId}-anak`);
        document.getElementById(`${containerId}-anak-minus`).onclick = () => {
            if (guestState.anak > 0) guestState.anak--;
            anakInput.value = guestState.anak;
            labelText.textContent = getGuestLabel();
        };
        document.getElementById(`${containerId}-anak-plus`).onclick = () => {
            if (guestState.anak < 10) guestState.anak++;
            anakInput.value = guestState.anak;
            labelText.textContent = getGuestLabel();
        };
        anakInput.oninput = () => {
            let val = parseInt(anakInput.value) || 0;
            if (val < 0) val = 0;
            if (val > 10) val = 10;
            guestState.anak = val;
            anakInput.value = val;
            labelText.textContent = getGuestLabel();
        };
        // Kamar
        const kamarInput = document.getElementById(`${containerId}-kamar`);
        document.getElementById(`${containerId}-kamar-minus`).onclick = () => {
            if (guestState.kamar > 1) guestState.kamar--;
            kamarInput.value = guestState.kamar;
            labelText.textContent = getGuestLabel();
        };
        document.getElementById(`${containerId}-kamar-plus`).onclick = () => {
            if (guestState.kamar < 10) guestState.kamar++;
            kamarInput.value = guestState.kamar;
            labelText.textContent = getGuestLabel();
        };
        kamarInput.oninput = () => {
            let val = parseInt(kamarInput.value) || 1;
            if (val < 1) val = 1;
            if (val > 10) val = 10;
            guestState.kamar = val;
            kamarInput.value = val;
            labelText.textContent = getGuestLabel();
        };
        // Bersihkan event saat container dihapus
        container._cleanupGuestDropdown = () => {
            document.removeEventListener('mousedown', closeDropdown);
        };
        // Tombol cari
        document.getElementById(`${containerId}-button`).onclick = () => {
            const query = document.getElementById(`${containerId}-location`).value;
            // Kirim data guestState jika ingin filter berdasarkan tamu
            navigate('search', { query, guests: { ...guestState } });
        };
    }

    function renderHomePage() {
        document.getElementById('popular-hotels-container').innerHTML = allHotels.slice(0, 3).map(renderHotelCard).join('');
        renderSearchBar('home-search-bar');
    }

    function renderSearchResultsPage(data = {}) {
        const query = data.query || '';
        // Tambahkan wrapper container agar lebar search bar konsisten seperti di home
        const searchPageBar = document.getElementById('search-page-bar');
        searchPageBar.innerHTML = '<div class="container mx-auto px-4"><div id="search-page-bar-inner" class="bg-white p-6 rounded-2xl shadow-xl"></div></div>';
        renderSearchBar('search-page-bar-inner', query);
        setupFilters(); // Pindahkan ke sini
        applyFilters();
    }
    
    async function renderHotelDetails(hotelId) {
        // Ambil detail hotel dari API detail
        const response = await fetch(`api_get_hotel_detail.php?hotel_id=${hotelId}`);
        const data = await response.json();
        if (!data.success) { navigate('home'); return; }
        const hotel = data.hotel;
        // Galeri foto: ambil dari image_gallery semua tipe kamar, fallback ke hotel.image
        let gallery = [];
        if (hotel.room_types && hotel.room_types.length > 0) {
            hotel.room_types.forEach(rt => {
                if (rt.image_gallery) {
                    gallery = gallery.concat(rt.image_gallery.split(',').map(img => img.trim()).filter(Boolean));
                }
            });
        }
        if (gallery.length === 0 && hotel.image) gallery = [hotel.image];
        // Harga mulai
        let minRoomPrice = null;
        if (hotel.room_types && hotel.room_types.length > 0) {
            minRoomPrice = Math.min(...hotel.room_types.map(rt => parseFloat(rt.price)));
        }
        // Fasilitas
        const fasilitasHTML = hotel.facilities.map(f => `<span class='bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full mr-1 mb-1 inline-block'>${f.name}</span>`).join('');
        // Tipe kamar - Modern Card Grid
        let roomTypes = hotel.room_types ? [...hotel.room_types] : [];
        // Pisahkan yang sold out
        const availableRooms = roomTypes.filter(rt => parseInt(rt.availability) > 0);
        const soldOutRooms = roomTypes.filter(rt => parseInt(rt.availability) === 0);
        // Gabungkan, yang sold out di belakang
        const sortedRooms = [...availableRooms, ...soldOutRooms];
        const roomTypesHTML = sortedRooms.length > 0 ?
            `<div class='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>` +
            sortedRooms.map(rt => {
                const isSoldOut = parseInt(rt.availability) === 0;
                const images = rt.image_gallery ? rt.image_gallery.split(',').slice(0, 1).map(img => `<img src='${img.trim()}' class='w-28 h-20 object-cover rounded-lg mx-auto mb-2'>`).join('') : '';
                return `
                <div class='bg-white border rounded-2xl shadow-md p-4 flex flex-col items-center relative ${isSoldOut ? 'opacity-60' : 'hover:shadow-xl transition-shadow duration-300'}'>
                    ${images || `<div class='w-28 h-20 bg-gray-200 rounded-lg flex items-center justify-center mb-2 text-gray-400'>No Image</div>`}
                    <div class='font-bold text-lg text-center mb-1'>${rt.name}</div>
                    <div class='text-brand-green font-semibold mb-1 text-center'>${formatCurrency(rt.price)}</div>
                    <div class='text-xs text-gray-500 mb-2 text-center'>Tersedia: ${rt.availability}</div>
                    <button class='w-full py-2 rounded-lg font-semibold mt-2 ${isSoldOut ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-brand-green text-white hover:bg-green-700'}' ${isSoldOut ? 'disabled' : `onclick=\"navigate('booking', {hotelId: ${hotel.id}, roomTypeId: ${rt.id}})\"`}>${isSoldOut ? 'Sold Out' : 'Pesan'}</button>
                </div>
                `;
            }).join('') + `</div>`
            : '<div class="text-gray-400">Tidak ada tipe kamar tersedia.</div>';
        // Ulasan
        function capitalize(str) {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        }
        const avgRating = hotel.avg_review_rating !== null && hotel.avg_review_rating !== undefined ? parseFloat(hotel.avg_review_rating).toFixed(1) : '-';
        const reviewCount = hotel.review_count || 0;
        const ratingLabel = hotel.avg_review_rating !== null && hotel.avg_review_rating !== undefined ? capitalize(getRatingLabel(hotel.avg_review_rating)) : '-';
        // Star rating
        const starHTML = `<span class='text-yellow-500'>${'★'.repeat(hotel.star_rating)}</span>`;
        // Render
        document.getElementById('hotel-detail-content').innerHTML = `
            <button onclick="navigate('search')" class="mb-8 bg-gray-200 text-gray-800 px-4 py-2 rounded-full font-semibold hover:bg-gray-300">&larr; Kembali ke Pencarian</button>
            <div class="bg-white rounded-2xl shadow-lg p-8">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div>
                        <!-- Galeri Foto -->
                        <div class="mb-4">
                            <img src="${gallery[0]}" class="w-full h-72 object-cover rounded-xl mb-2 shadow" alt="Foto utama hotel">
                            <div class="flex gap-2">
                                ${gallery.slice(1,5).map(img => `<img src="${img}" class="w-20 h-14 object-cover rounded shadow">`).join('')}
                            </div>
                        </div>
                    </div>
                    <div>
                        <!-- Info Utama -->
                        <h1 class="text-4xl font-bold text-brand-black mb-2">${hotel.name}</h1>
                        <div class="flex items-center gap-3 mb-2">${starHTML}</div>
                        <div class="flex flex-col items-start mb-4">
                            <span class="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Mulai dari</span>
                            <span class="text-3xl font-bold text-brand-green leading-tight">${minRoomPrice ? formatCurrency(minRoomPrice) : '-'}</span>
                            <span class="text-xs text-brand-grey font-normal">/ malam</span>
                        </div>
                        <div class="text-gray-600 mb-2">${hotel.location || '-'}</div>
                        <!-- Ulasan -->
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-lg font-bold text-brand-black">${avgRating}</span>
                            <span class="text-gray-500">/ 10</span>
                            <span class="text-xs text-brand-green font-semibold ml-1">${ratingLabel}</span>
                            <span class="text-gray-500">(${reviewCount} ulasan)</span>
                            <button class="text-brand-green underline ml-2" onclick="showAllReviews(${hotel.id})">Lihat semua ulasan</button>
                        </div>
                        <!-- Fasilitas -->
                        <div class="mb-2"><h3 class="font-semibold mb-1">Fasilitas</h3>${fasilitasHTML}</div>
                    </div>
                </div>
                <!-- Deskripsi & Alamat -->
                <div class="mt-8">
                    <h3 class="font-semibold mb-2">Deskripsi</h3>
                    <div class="mb-4 text-gray-700">${hotel.description || '-'}</div>
                    <h3 class="font-semibold mb-2">Alamat</h3>
                    <div class="mb-4 text-gray-700">${hotel.location || '-'}</div>
                </div>
                <!-- Tipe Kamar -->
                <div class="mt-8">
                    <h3 class="font-semibold mb-2">Tipe Kamar</h3>
                    ${roomTypesHTML}
                </div>
            </div>
        `;
    }

    function renderAuthForms() {
        document.getElementById('login-form-container').innerHTML = `<h2 class="text-2xl font-bold text-center">Selamat Datang Kembali!</h2><p class="text-center text-brand-grey mt-2 mb-6">Silakan masuk ke akun Anda.</p><form id="login-form" class="space-y-4"><input name="email" type="email" placeholder="Alamat Email" required class="form-input"><div><input name="password" type="password" placeholder="Password" required class="form-input"><a href="#" onclick="switchAuthForm('forgot'); event.preventDefault();" class="text-sm text-brand-green hover:underline block text-right mt-1">Lupa password?</a></div><button type="submit" class="w-full bg-brand-green text-white py-3 rounded-lg font-semibold">Masuk</button></form><p class="text-center text-sm mt-6">Belum punya akun? <a href="#" onclick="switchAuthForm('register'); event.preventDefault();" class="font-medium text-brand-green hover:underline">Daftar</a></p>`;
        document.getElementById('register-form-container').innerHTML = `<h2 class="text-2xl font-bold text-center">Buat Akun Baru</h2><p class="text-center text-brand-grey mt-2 mb-6">Mulai perjalanan Anda.</p><form id="register-form" class="space-y-4"><input name="name" type="text" placeholder="Nama Lengkap" required class="form-input"><input name="email" type="email" placeholder="Alamat Email" required class="form-input"><input name="password" type="password" placeholder="Password" required class="form-input"><button type="submit" class="w-full bg-brand-green text-white py-3 rounded-lg font-semibold">Daftar</button></form><p class="text-center text-sm mt-6">Sudah punya akun? <a href="#" onclick="switchAuthForm('login'); event.preventDefault();" class="font-medium text-brand-green hover:underline">Masuk</a></p>`;
        document.getElementById('forgot-form-container').innerHTML = `<h2 class="text-2xl font-bold text-center">Lupa Password</h2><p class="text-center text-brand-grey mt-2 mb-6">Fitur ini belum tersedia.</p><p class="text-center text-sm mt-6"><a href="#" onclick="switchAuthForm('login'); event.preventDefault();" class="font-medium text-brand-green hover:underline">Kembali ke Login</a></p>`;
        
        // Adding listener event onto the form after being rendered
        document.getElementById('login-form').addEventListener('submit', handleLogin);
        document.getElementById('register-form').addEventListener('submit', handleRegister);
    }

    function showBookingForm(navigateData) {
        // Mendukung pemanggilan: showBookingForm(hotelId) atau showBookingForm({hotelId, roomTypeId})
        let hotelId, roomTypeId;
        if (typeof navigateData === 'object' && navigateData !== null) {
            hotelId = navigateData.hotelId || navigateData.hotel_id || navigateData;
            roomTypeId = navigateData.roomTypeId || navigateData.room_type_id;
        } else {
            hotelId = navigateData;
        }
        if (!currentUser) {
            alert('Anda harus login terlebih dahulu untuk memesan hotel.');
            navigate('login');
            return;
        }
        const hotel = allHotels.find(h => h.id == hotelId);
        let selectedRoom = null;
        if (roomTypeId && hotel && hotel.room_types) {
            selectedRoom = hotel.room_types.find(rt => rt.id == roomTypeId);
        }
        let totalNights = 1;
        let totalPrice = (selectedRoom ? selectedRoom.price : hotel.price) * 1.1;
        document.getElementById('booking-form-content').innerHTML = `
            <div class="lg:col-span-2">
                <h3 class="text-2xl font-bold text-brand-black mb-6">Isi Data Pemesanan</h3>
                <form id="booking-form" class="bg-white p-8 rounded-2xl shadow-lg space-y-4">
                    <div><label class="font-semibold">Nama Lengkap</label><input type="text" value="${currentUser.name}" required class="form-input mt-1 bg-gray-100" readonly></div>
                    <div><label class="font-semibold">Alamat Email</label><input type="email" value="${currentUser.email}" required class="form-input mt-1 bg-gray-100" readonly></div>
                    <div class="grid grid-cols-2 gap-4">
                        <div><label class="font-semibold">Tanggal Check-in</label><input type="date" id="checkin-date" required class="form-input mt-1"></div>
                        <div><label class="font-semibold">Tanggal Check-out</label><input type="date" id="checkout-date" required class="form-input mt-1"></div>
                    </div>
                    <div><label class="font-semibold">Jumlah Tamu</label><input type="number" name="guests" value="1" min="1" max="5" required class="form-input mt-1"></div>
                    <button type="submit" class="w-full bg-brand-green text-white py-3 rounded-lg font-bold text-lg mt-4">Lanjutkan ke Pembayaran</button>
                </form>
            </div>
            <div class="lg:col-span-1">
                <h3 class="text-2xl font-bold text-brand-black mb-6">Ringkasan Pesanan</h3>
                <div class="bg-white p-6 rounded-2xl shadow-lg">
                    <img src="${selectedRoom && selectedRoom.image_gallery ? selectedRoom.image_gallery.split(',')[0].trim() : hotel.image}" class="w-full h-40 object-cover rounded-lg mb-4">
                    <h4 class="text-xl font-bold">${hotel.name}</h4>
                    <p class="text-brand-grey">${hotel.location}</p>
                    ${selectedRoom ? `<div class='mt-2 mb-2'><span class='font-semibold'>Tipe Kamar:</span> ${selectedRoom.name}</div>` : ''}
                    <div class="border-t my-4"></div>
                    <div class="flex justify-between"><p>Harga per malam</p><p class="font-semibold" id="harga-per-malam">${formatCurrency(selectedRoom ? selectedRoom.price : hotel.price)}</p></div>
                    <div class="flex justify-between mt-2"><p>Pajak & Layanan (10%)</p><p class="font-semibold" id="pajak">${formatCurrency((selectedRoom ? selectedRoom.price : hotel.price) * 0.1)}</p></div>
                    <div class="flex justify-between mt-2"><p>Jumlah Malam</p><p class="font-semibold" id="jumlah-malam">${totalNights}</p></div>
                    <div class="border-t my-4"></div>
                    <div class="flex justify-between text-xl font-bold"><p>Total</p><p id="total-harga">${formatCurrency(totalPrice)}</p></div>
                </div>
            </div>
        `;
        // Update harga otomatis saat tanggal diubah
        const checkinInput = document.getElementById('checkin-date');
        const checkoutInput = document.getElementById('checkout-date');
        function updateSummary() {
            const checkin = checkinInput.value;
            const checkout = checkoutInput.value;
            let nights = 1;
            if (checkin && checkout) {
                const d1 = new Date(checkin);
                const d2 = new Date(checkout);
                nights = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
                if (nights < 1) nights = 1;
            }
            totalNights = nights;
            totalPrice = (selectedRoom ? selectedRoom.price : hotel.price) * totalNights * 1.1;
            document.getElementById('jumlah-malam').textContent = totalNights;
            document.getElementById('total-harga').textContent = formatCurrency(totalPrice);
        }
        checkinInput.addEventListener('change', updateSummary);
        checkoutInput.addEventListener('change', updateSummary);
        document.getElementById('booking-form').addEventListener('submit', (e) => handleBooking(e, hotel.id, totalNights, totalPrice));
    }

    function handleBooking(event, hotelId, totalNights, totalPrice) {
        event.preventDefault();
        const hotel = allHotels.find(h => h.id == hotelId);
        const checkin = event.target.elements['checkin-date'].value;
        const checkout = event.target.elements['checkout-date'].value;
        const guests = event.target.elements['guests'].value;
        // Validasi tanggal
        if (!checkin || !checkout) {
            alert('Tanggal check-in dan check-out harus diisi.');
            return;
        }
        const d1 = new Date(checkin);
        const d2 = new Date(checkout);
        if (d2 <= d1) {
            alert('Tanggal check-out harus setelah check-in.');
            return;
        }
        const bookingData = {
            user_id: currentUser.id,
            hotel_id: hotel.id,
            check_in_date: checkin,
            check_out_date: checkout,
            total_price: Math.round(totalPrice),
            guests
        };
        apiCreateBooking(bookingData).then(result => {
            if (result.success) {
                const bookingInfo = {
                    hotelName: hotel.name,
                    checkin,
                    checkout,
                    totalPrice: formatCurrency(totalPrice),
                    bookingId: result.booking_id || `SOJ-${Date.now()}`
                };
                navigate('confirmation', bookingInfo);
            } else {
                alert(result.message || 'Pemesanan gagal.');
            }
        }).catch(() => {
            alert('Pemesanan gagal.');
        });
    }

    function renderConfirmation(bookingData) {
        document.getElementById('confirmation-content').innerHTML = `
            <svg class="w-24 h-24 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <h1 class="text-4xl font-bold text-brand-black mt-4">Pemesanan Berhasil!</h1>
            <p class="text-lg text-brand-grey mt-2">Terima kasih, ${currentUser.name}. Pesanan Anda telah kami konfirmasi.</p>
            <div class="bg-white p-8 rounded-2xl shadow-lg max-w-2xl mx-auto mt-8 text-left space-y-3">
                <h3 class="text-xl font-bold text-center mb-4">Detail Pesanan</h3>
                <div><strong>ID Booking:</strong> ${bookingData.bookingId}</div>
                <div><strong>Hotel:</strong> ${bookingData.hotelName}</div>
                <div><strong>Check-in:</strong> ${bookingData.checkin}</div>
                <div><strong>Check-out:</strong> ${bookingData.checkout}</div>
                <div class="border-t pt-3 mt-3 font-bold text-lg flex justify-between"><span>Total Pembayaran:</span><span>${bookingData.totalPrice}</span></div>
            </div>
            <button onclick="navigate('home')" class="mt-8 bg-brand-green text-white px-8 py-3 rounded-full font-semibold hover:bg-opacity-90">Kembali ke Halaman Utama</button>
        `;
    }

    function renderSortDropdown() {
        const container = document.getElementById('sort-dropdown-container');
        container.innerHTML = `
            <label class="font-semibold mr-2">Urutkan:</label>
            <select id="sort-dropdown" class="form-input">
                <option value="">Default</option>
                <option value="price_desc">Harga Tertinggi</option>
                <option value="price_asc">Harga Terendah</option>
                <option value="popularity">Popularitas</option>
                <option value="rating_desc">Rating Pengguna</option>
            </select>
        `;
        document.getElementById('sort-dropdown').value = currentSort;
        document.getElementById('sort-dropdown').addEventListener('change', (e) => {
            currentSort = e.target.value;
            applyFilters();
        });
    }

    function applyFilters() {
        const query = (document.getElementById('search-page-bar-location')?.value || '').toLowerCase();
        const priceMin = parseInt(document.getElementById('price-min-input').value) || 0;
        const priceMax = parseInt(document.getElementById('price-max-input').value) || 100000000;
        const checkedStars = [...document.querySelectorAll('#star-filter-options input:checked')].map(el => parseInt(el.value));
        const checkedFacilities = [...document.querySelectorAll('#facility-filter-options input:checked')].map(el => el.value);
        
        let filteredHotels = allHotels.filter(hotel => {
            const queryMatch = !query || hotel.location.toLowerCase().includes(query) || hotel.name.toLowerCase().includes(query);
            const priceMatch = hotel.price >= priceMin && hotel.price <= priceMax;
            const starMatch = checkedStars.length === 0 || checkedStars.includes(hotel.star_rating); // pastikan pakai star_rating
            const facilityMatch = checkedFacilities.length === 0 || checkedFacilities.every(fac => hotel.facilities.includes(fac));
            return queryMatch && priceMatch && starMatch && facilityMatch;
        });

        // Sorting
        if (currentSort === 'price_asc') {
            filteredHotels.sort((a, b) => a.price - b.price);
        } else if (currentSort === 'price_desc') {
            filteredHotels.sort((a, b) => b.price - a.price);
        } else if (currentSort === 'popularity') {
            filteredHotels.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
        } else if (currentSort === 'rating_desc') {
            filteredHotels.sort((a, b) => (b.avg_review_rating || 0) - (a.avg_review_rating || 0));
        }

        document.getElementById('search-results-list').innerHTML = filteredHotels.length > 0 ? filteredHotels.map(renderHotelCard).join('') : `<p class="text-center text-brand-grey col-span-full">Tidak ada hotel yang cocok dengan kriteria Anda.</p>`;
        document.getElementById('search-results-count').textContent = `Menemukan ${filteredHotels.length} hotel`;
    }

    // Ubah setupFilters menjadi async dan ambil fasilitas dari API
    async function setupFilters() {
        // Harga min/maks dari data hotel
        const prices = allHotels.map(h => h.price);
        const minPrice = Math.min(...prices, 0);
        const maxPrice = 20000000;
        const priceSlider = document.getElementById('price-range-slider');
        const priceMinInput = document.getElementById('price-min-input');
        const priceMaxInput = document.getElementById('price-max-input');
        const priceMinLabel = document.getElementById('price-min-label');
        const priceMaxLabel = document.getElementById('price-max-label');
        // Inisialisasi noUiSlider dua arah
        if (priceSlider.noUiSlider) priceSlider.noUiSlider.destroy();
        noUiSlider.create(priceSlider, {
            start: [minPrice, maxPrice],
            connect: true,
            step: 10000,
            range: {
                'min': minPrice,
                'max': maxPrice
            },
            format: {
                to: value => Math.round(value),
                from: value => Number(value)
            }
        });
        // Set nilai awal input
        priceMinInput.value = minPrice;
        priceMaxInput.value = maxPrice;
        priceMinLabel.textContent = formatCurrency(minPrice);
        priceMaxLabel.textContent = formatCurrency(maxPrice) + '+';
        // Sinkronisasi slider -> input
        priceSlider.noUiSlider.on('update', function(values, handle) {
            const min = Math.round(values[0]);
            const max = Math.round(values[1]);
            priceMinInput.value = min;
            priceMaxInput.value = max;
            priceMinLabel.textContent = formatCurrency(min);
            priceMaxLabel.textContent = formatCurrency(max) + '+';
        });
        priceSlider.noUiSlider.on('change', function() {
            applyFilters();
        });
        // Sinkronisasi input -> slider
        priceMinInput.addEventListener('change', function() {
            let min = parseInt(priceMinInput.value) || minPrice;
            let max = parseInt(priceMaxInput.value) || maxPrice;
            if (min > max) min = max;
            priceSlider.noUiSlider.set([min, max]);
            applyFilters();
        });
        priceMaxInput.addEventListener('change', function() {
            let min = parseInt(priceMinInput.value) || minPrice;
            let max = parseInt(priceMaxInput.value) || maxPrice;
            if (max < min) max = min;
            priceSlider.noUiSlider.set([min, max]);
            applyFilters();
        });
        // Ambil fasilitas dari API
        allFacilitiesOptions = await fetchFacilities();
        const starContainer = document.getElementById('star-filter-options');
        starContainer.innerHTML = [5, 4, 3, 2, 1].map(star => `<label class="flex items-center"><input type="checkbox" value="${star}" class="h-5 w-5 rounded border-gray-300 text-brand-green"><span class="ml-3 text-brand-grey">${star} Bintang</span></label>`).join('');
        starContainer.addEventListener('change', applyFilters);
        const facilityContainer = document.getElementById('facility-filter-options');
        facilityContainer.innerHTML = allFacilitiesOptions.map(f => `<label class="flex items-center"><input type="checkbox" value="${f}" class="h-5 w-5 rounded border-gray-300 text-brand-green"><span class="ml-3 text-brand-grey">${f}</span></label>`).join('');
        facilityContainer.addEventListener('change', applyFilters);
        renderSortDropdown();
    }

    function showAllReviews(hotelId) {
        // Buat modal overlay
        let modal = document.getElementById('reviews-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'reviews-modal';
            modal.className = 'fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50';
            modal.innerHTML = `<div class='bg-white rounded-xl shadow-lg max-w-2xl w-full p-8 relative'>
                <button id='close-reviews-modal' class='absolute top-2 right-2 text-gray-500 hover:text-red-500 text-2xl'>&times;</button>
                <h2 class='text-2xl font-bold mb-4'>Semua Ulasan</h2>
                <div id='reviews-list'>Memuat ulasan...</div>
            </div>`;
            document.body.appendChild(modal);
            document.getElementById('close-reviews-modal').onclick = () => modal.remove();
        } else {
            modal.style.display = 'flex';
        }
        // Fetch reviews
        fetch(`api_get_reviews.php?hotel_id=${hotelId}`)
            .then(res => res.json())
            .then(data => {
                const list = document.getElementById('reviews-list');
                if (!data.success || !data.reviews || data.reviews.length === 0) {
                    list.innerHTML = '<div class="text-gray-400">Belum ada ulasan untuk hotel ini.</div>';
                    return;
                }
                list.innerHTML = data.reviews.map(r => `
                    <div class='border-b py-3'>
                        <div class='flex items-center gap-2 mb-1'>
                            <span class='font-bold text-brand-black'>${r.user_name}</span>
                            <span class='text-yellow-500'>${'★'.repeat(Math.round(r.rating/2))}${'☆'.repeat(5-Math.round(r.rating/2))}</span>
                            <span class='text-xs text-gray-500'>${parseFloat(r.rating).toFixed(1)}/10</span>
                            <span class='text-xs text-brand-green font-semibold ml-1'>${getRatingLabel(r.rating)}</span>
                            <span class='text-xs text-gray-400 ml-2'>${new Date(r.created_at).toLocaleDateString('id-ID')}</span>
                        </div>
                        <div class='text-gray-700'>${r.comment || '-'}</div>
                    </div>
                `).join('');
            });
    }
    window.showAllReviews = showAllReviews;

    // --- Riwayat Pemesanan ---
    async function fetchAndRenderBookings() {
        console.log('fetchAndRenderBookings called');
        const bookingListDiv = document.getElementById('booking-list');
        bookingListDiv.innerHTML = '<div class="text-center">Memuat riwayat pemesanan...</div>';
        // Ambil daftar hotel yang sudah direview user login
        window.userReviewedHotels = {};
        let uid = currentUser && currentUser.id;
        if (uid) {
            try {
                const reviewedRes = await fetch('api_get_reviews.php?user_id=' + uid);
                const reviewedData = await reviewedRes.json();
                if (reviewedData.success && reviewedData.reviews) {
                    reviewedData.reviews.forEach(r => {
                        window.userReviewedHotels[r.hotel_id] = true;
                    });
                }
            } catch (e) {}
        }
        try {
            const response = await fetch('api_get_my_bookings.php', { credentials: 'include' });
            const data = await response.json();
            if (!data.success) throw new Error(data.message || 'Gagal mengambil data pemesanan');
            const bookings = data.bookings || [];
            if (bookings.length === 0) {
                bookingListDiv.innerHTML = '<div class="text-center">Belum ada riwayat pemesanan.</div>';
                return;
            }
            bookingListDiv.innerHTML = '';
            bookings.forEach(booking => {
                const card = document.createElement('div');
                card.className = 'bg-white rounded-lg shadow p-6 mb-4 flex flex-col gap-2';
                // Hitung jumlah hari
                let daysText = '';
                if (booking.check_in && booking.check_out) {
                    const d1 = new Date(booking.check_in);
                    const d2 = new Date(booking.check_out);
                    const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
                    if (!isNaN(diff) && diff > 0) {
                        daysText = diff + ' hari';
                    }
                }
                let actionButtons = '';
                const today = new Date().toISOString().slice(0, 10);
                // Cek apakah user sudah review hotel ini
                let sudahReview = false;
                if (window.userReviewedHotels && window.userReviewedHotels[booking.hotel_id]) {
                    sudahReview = true;
                }
                if (booking.status === 'confirmed') {
                    if (booking.check_out && booking.check_out <= today) {
                        actionButtons += `<button class="btn-finish-booking bg-blue-500 text-white px-4 py-2 rounded mt-2" data-booking-id="${booking.id}">Selesaikan</button>`;
                    } else {
                        actionButtons += `<button class="btn-cancel-booking bg-red-500 text-white px-4 py-2 rounded mt-2" data-booking-id="${booking.id}">Batalkan Pemesanan</button>`;
                    }
                } else if (booking.status === 'finished') {
                    if (sudahReview) {
                        actionButtons += `<span class="inline-block bg-gray-200 text-gray-600 px-4 py-2 rounded mt-2 font-semibold">Sudah Review</span>`;
                    } else {
                        actionButtons += `<button class="btn-review-booking bg-green-600 text-white px-4 py-2 rounded mt-2" data-hotel-id="${booking.hotel_id}" data-booking-id="${booking.id}">Beri Review</button>`;
                    }
                }
                card.innerHTML = `
                    <img src="${booking.hotel_image || 'img/hotels/default.png'}" alt="${booking.hotel_name}" class="w-20 h-20 object-cover rounded-lg border">
                    <div class="font-bold text-lg">${booking.hotel_name}</div>
                    <div class="text-sm text-gray-500">${daysText}${daysText && booking.guests ? ' | ' : ''}${booking.room_type && booking.room_type !== '-' ? booking.room_type : ''}${booking.guests ? (daysText ? '' : '') + (booking.room_type && booking.room_type !== '-' ? ' | ' : '') + booking.guests + ' tamu' : ''}</div>
                    <div class="text-sm">Check-in: <b>${booking.check_in || '-'}</b></div>
                    <div class="text-sm">Check-out: <b>${booking.check_out || '-'}</b></div>
                    <div class="text-sm">Total Harga: <b>${formatCurrency(booking.total_price)}</b></div>
                    <div class="text-sm">Status: <span class="font-semibold ${booking.status === 'cancelled' ? 'text-red-500' : 'text-green-600'}">${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span></div>
                    ${actionButtons}
                `;
                bookingListDiv.appendChild(card);
            });
            // Handle cancel
            document.querySelectorAll('.btn-cancel-booking').forEach(btn => {
                btn.onclick = async function() {
                    const bookingId = this.getAttribute('data-booking-id');
                    if (!confirm('Yakin ingin membatalkan pemesanan ini?')) return;
                    const res = await fetch('api_cancel_booking.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ booking_id: bookingId })
                    });
                    fetchAndRenderBookings();
                };
            });
            // Handle finish
            document.querySelectorAll('.btn-finish-booking').forEach(btn => {
                btn.onclick = async function() {
                    const bookingId = this.getAttribute('data-booking-id');
                    if (!confirm('Sudah selesai menginap? Tandai selesai agar bisa review.')) return;
                    const res = await fetch('api_finish_booking.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ booking_id: bookingId })
                    });
                    fetchAndRenderBookings();
                };
            });
            // Handle review
            document.querySelectorAll('.btn-review-booking').forEach(btn => {
                btn.onclick = function() {
                    const hotelId = this.getAttribute('data-hotel-id');
                    // Panggil modal/tampilan review, pastikan hanya bisa review jika status finished
                    showReviewModal(hotelId);
                };
            });
        } catch (err) {
            bookingListDiv.innerHTML = '<div class="text-center text-red-500">Gagal memuat riwayat pemesanan.</div>';
        }
    }

    function showReviewModal(hotelId) {
        // Cek jika modal sudah ada, hapus dulu
        let oldModal = document.getElementById('review-modal');
        if (oldModal) oldModal.remove();
        // Buat modal
        const modal = document.createElement('div');
        modal.id = 'review-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50';
        modal.innerHTML = `
          <div class="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
            <button id="close-review-modal" class="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-2xl">&times;</button>
            <h2 class="text-2xl font-bold mb-4">Beri Review</h2>
            <form id="review-form" class="space-y-4">
              <div>
                <label class="block font-semibold mb-1">Rating</label>
                <div class="flex items-center gap-3">
                  <input type="range" min="1" max="10" value="8" name="rating" id="review-rating-slider" class="w-full accent-green-600" />
                  <span id="review-rating-value" class="text-lg font-bold text-brand-green">8</span>
                </div>
                <div class="text-xs text-gray-500 mt-1">Geser untuk memilih rating (1 = buruk, 10 = sempurna)</div>
              </div>
              <div>
                <label class="block font-semibold mb-1">Komentar</label>
                <textarea name="comment" rows="3" class="form-input w-full" placeholder="Tulis pengalaman Anda..."></textarea>
              </div>
              <button type="submit" class="w-full bg-brand-green text-white py-3 rounded-lg font-bold text-lg">Kirim Review</button>
            </form>
          </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('close-review-modal').onclick = () => modal.remove();
        // Slider rating update
        const slider = document.getElementById('review-rating-slider');
        const valueLabel = document.getElementById('review-rating-value');
        slider.oninput = function() {
            valueLabel.textContent = this.value;
        };
        document.getElementById('review-form').onsubmit = async function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const rating = slider.value;
            const comment = formData.get('comment');
            const res = await fetch('api_submit_review.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hotel_id: hotelId, rating, comment })
            });
            const data = await res.json();
            alert(data.message || (data.success ? 'Review berhasil dikirim!' : 'Gagal mengirim review.'));
            modal.remove();
            fetchAndRenderBookings();
        };
    }

    window.showHistoryPage = function() {
        // Sembunyikan semua page
        document.querySelectorAll('.page-content, .page').forEach(page => page.classList.add('hidden'));
        // Tampilkan history-page
        const historyPage = document.getElementById('history-page');
        if (historyPage) historyPage.classList.remove('hidden');
        fetchAndRenderBookings();
        window.location.hash = '#history';
    };

    // Update header/menu agar link "Pemesanan Saya" hanya muncul saat login
    function updateHeaderUI() {
        const authContainer = document.getElementById('auth-button-container');
        const navHistory = document.getElementById('nav-history');
        if (currentUser) {
            authContainer.innerHTML = `
                <div class="flex items-center gap-4">
                    <button onclick="navigate('history'); event.preventDefault();" class="flex items-center gap-2 bg-brand-green text-white px-5 py-2 rounded-full shadow-md font-semibold hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400">
                        <svg xmlns='http://www.w3.org/2000/svg' class='w-5 h-5 mr-1' fill='none' viewBox='0 0 24 24' stroke='currentColor' stroke-width='2'>
                            <path stroke-linecap='round' stroke-linejoin='round' d='M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' />
                        </svg>
                        Pemesanan Saya
                    </button>
                    <span class="font-semibold text-brand-grey">Halo, ${currentUser.name.split(' ')[0]}</span>
                    <button onclick="handleLogout()" class="bg-red-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-red-600 transition-colors">Logout</button>
                </div>
            `;
            if (navHistory) navHistory.style.display = '';
        } else {
            authContainer.innerHTML = `
                <button onclick="navigate('login')" class="bg-brand-green text-white px-6 py-2 rounded-full font-semibold hover:bg-opacity-90 transition-colors">Login</button>
            `;
            if (navHistory) navHistory.style.display = 'none';
        }
    }

    function handleRegister(event) {
        event.preventDefault();
        const name = event.target.elements.name.value;
        const email = event.target.elements.email.value;
        const password = event.target.elements.password.value;
        if (!name || !email || !password) {
            alert('Harap isi semua kolom.');
            return;
        }
        apiRegister(name, email, password).then(result => {
            if (result.success) {
                alert('Registrasi berhasil! Silakan login.');
                switchAuthForm('login');
            } else {
                alert(result.message || 'Registrasi gagal.');
            }
        }).catch(() => {
            alert('Registrasi gagal.');
        });
    }

    function handleLogin(event) {
        event.preventDefault();
        const email = event.target.elements.email.value;
        const password = event.target.elements.password.value;
        apiLogin(email, password).then(result => {
            if (result.success && result.user) {
                currentUser = result.user;
                sessionStorage.setItem('sojournUser', JSON.stringify(result.user));
                alert(`Selamat datang kembali, ${currentUser.name}!`);
                updateHeaderUI();
                navigate('home');
            } else {
                alert(result.message || 'Email atau password salah.');
            }
        }).catch(() => {
            alert('Login gagal.');
        });
    }

    // --- App Inisiation ---
    async function initApp() {
        // Checking login session when app is initialized
        const loggedInUser = sessionStorage.getItem('sojournUser');
        if (loggedInUser) {
            currentUser = JSON.parse(loggedInUser);
        }
        await fetchHotels(); // Ambil data hotel dari API
        renderAuthForms();
        updateHeaderUI();
        showPageBasedOnURL(); // Show the correct page on load
        // Setelah ambil bookings, fetch daftar hotel yang sudah direview user
        // window.userReviewedHotels = {}; // HAPUS dari sini
    }

    initApp(); // Run the app
});
