// FUNGSI GLOBAL DI LUAR
let currentUser = null;

// Global function untuk cancel booking
window.cancelBooking = async function(bookingId) {
    console.log('cancelBooking called with bookingId:', bookingId);
    if (!confirm('Yakin ingin membatalkan pemesanan ini?')) return;
    
    try {
        const response = await fetch('api_cancel_booking.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking_id: bookingId })
        });
        const result = await response.json();
        console.log('Cancel booking result:', result);
        
        if (result.success) {
            alert('Pemesanan berhasil dibatalkan.');
            // Refresh booking list
            if (window.location.hash === '#history') {
                fetchAndRenderBookings();
            }
        } else {
            alert(result.message || 'Gagal membatalkan pemesanan.');
        }
    } catch (error) {
        console.error('Error canceling booking:', error);
        alert('Terjadi kesalahan saat membatalkan pemesanan.');
    }
};

// Global function untuk continue payment (jika diperlukan)
window.continuePayment = function(bookingId) {
    alert('Fitur pembayaran sedang dalam pengembangan.');
    // Implementasi pembayaran bisa ditambahkan di sini
};

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
        // Cleanup map if navigating away from detail page
        if (window.location.hash !== '#detail' && window.currentMap) {
            cleanupMap();
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
    
    // Cleanup map when navigating away from detail page
    function cleanupMap() {
        if (window.currentMap) {
            window.currentMap.remove();
            window.currentMap = null;
        }
    }

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
        
        // Galeri foto: gunakan hotel.image sebagai foto utama, lalu tambahkan dari image_gallery semua tipe kamar
        let gallery = [];
        // Tambahkan hotel.image sebagai foto utama jika ada
        if (hotel.image) {
            gallery.push(hotel.image);
        }
        // Tambahkan gambar dari room_types
        if (hotel.room_types && hotel.room_types.length > 0) {
            hotel.room_types.forEach(rt => {
                if (rt.image_gallery) {
                    gallery = gallery.concat(rt.image_gallery.split(',').map(img => img.trim()).filter(Boolean));
                }
            });
        }
        // Jika tidak ada gambar sama sekali, gunakan placeholder
        if (gallery.length === 0) {
            gallery = ['https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop'];
        }
        
        // Harga mulai
        let minRoomPrice = null;
        if (hotel.room_types && hotel.room_types.length > 0) {
            minRoomPrice = Math.min(...hotel.room_types.map(rt => parseFloat(rt.price)));
        }
        
        // Fasilitas
        const fasilitasHTML = hotel.facilities.map(f => `<span class='bg-green-100 text-green-800 text-xs font-semibold px-3 py-2 rounded-full mr-2 mb-2 inline-block'>${f.name}</span>`).join('');
        
        // Tipe kamar - Modern Card Grid
        let roomTypes = hotel.room_types ? [...hotel.room_types] : [];
        // Pisahkan yang sold out
        const availableRooms = roomTypes.filter(rt => parseInt(rt.availability) > 0);
        const soldOutRooms = roomTypes.filter(rt => parseInt(rt.availability) === 0);
        // Gabungkan, yang sold out di belakang
        const sortedRooms = [...availableRooms, ...soldOutRooms];
        const roomTypesHTML = sortedRooms.length > 0 ?
            `<div class='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>` +
            sortedRooms.map(rt => {
                const isSoldOut = parseInt(rt.availability) === 0;
                const images = rt.image_gallery ? rt.image_gallery.split(',').slice(0, 1).map(img => `<img src='${img.trim()}' class='w-full h-48 object-cover rounded-t-xl'>`).join('') : '';
                return `
                <div class='bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ${isSoldOut ? 'opacity-60' : ''}'>
                    ${images || `<div class='w-full h-48 bg-gray-200 rounded-t-xl flex items-center justify-center text-gray-400'><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg></div>`}
                    <div class='p-6'>
                        <div class='font-bold text-xl text-gray-900 mb-2'>${rt.name}</div>
                        <div class='text-brand-green font-bold text-2xl mb-3'>${formatCurrency(rt.price)}</div>
                        <div class='text-sm text-gray-600 mb-4'>Tersedia: ${rt.availability} kamar</div>
                        <button class='w-full py-3 rounded-lg font-semibold transition-colors duration-200 ${isSoldOut ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-brand-green text-white hover:bg-green-700'}' ${isSoldOut ? 'disabled' : `onclick=\"navigate('booking', {hotelId: ${hotel.id}, roomTypeId: ${rt.id}})\"`}>${isSoldOut ? 'Sold Out' : 'Pesan Sekarang'}</button>
                    </div>
                </div>
                `;
            }).join('') + `</div>`
            : '<div class="text-gray-400 text-center py-8">Tidak ada tipe kamar tersedia.</div>';
        
        // Ulasan
        function capitalize(str) {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        }
        const avgRating = hotel.avg_review_rating !== null && hotel.avg_review_rating !== undefined ? parseFloat(hotel.avg_review_rating).toFixed(1) : '-';
        const reviewCount = hotel.review_count || 0;
        const ratingLabel = hotel.avg_review_rating !== null && hotel.avg_review_rating !== undefined ? capitalize(getRatingLabel(hotel.avg_review_rating)) : '-';
        
        // Star rating
        const starHTML = `<span class='text-yellow-500 text-xl'>${'★'.repeat(hotel.star_rating)}</span>`;
        
        // Render modern hotel detail page
        document.getElementById('hotel-detail-content').innerHTML = `
            <!-- Breadcrumb -->
            <nav class="mb-8">
                <button onclick="navigate('search')" class="text-gray-600 hover:text-brand-green transition-colors duration-200 flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                    Kembali ke Pencarian
                </button>
            </nav>

            <!-- Hotel Header Section -->
            <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
                <!-- Hero Image Gallery -->
                <div class="relative h-96 bg-gray-200">
                    ${gallery.length > 0 ? `
                        <img src="${gallery[0]}" class="w-full h-full object-cover" alt="${hotel.name}">
                        <div class="absolute bottom-4 left-4 right-4 flex gap-2">
                            ${gallery.slice(1, 5).map(img => `<img src="${img}" class="w-16 h-12 object-cover rounded-lg border-2 border-white shadow-md">`).join('')}
                        </div>
                    ` : `
                        <div class="w-full h-full flex items-center justify-center text-gray-400">
                            <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                    `}
                </div>
                
                <!-- Hotel Info Header -->
                <div class="p-8">
                    <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-3">
                                ${starHTML}
                                <span class="text-gray-600">${hotel.star_rating} Bintang</span>
                            </div>
                            <h1 class="text-4xl font-bold text-gray-900 mb-3">${hotel.name}</h1>
                            <div class="flex items-center gap-4 text-gray-600 mb-4">
                                <div class="flex items-center gap-1">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    </svg>
                                    <span>${hotel.location || 'Lokasi tidak tersedia'}</span>
                                </div>
                            </div>
                            
                            <!-- Rating & Reviews -->
                            <div class="flex items-center gap-4 mb-6">
                                <div class="flex items-center gap-2">
                                    <div class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                                        ${avgRating}/10
                                    </div>
                                    <span class="text-sm text-gray-600">${ratingLabel}</span>
                                    <span class="text-sm text-gray-500">(${reviewCount} ulasan)</span>
                                </div>
                                <button class="text-brand-green hover:text-green-700 text-sm font-medium underline" onclick="showAllReviews(${hotel.id})">
                                    Lihat semua ulasan
                                </button>
                            </div>
                        </div>
                        
                        <!-- Price Card -->
                        <div class="bg-gray-50 rounded-xl p-6 lg:w-80">
                            <div class="text-center">
                                <div class="text-sm text-gray-600 mb-1">Mulai dari</div>
                                <div class="text-3xl font-bold text-brand-green mb-2">${minRoomPrice ? formatCurrency(minRoomPrice) : '-'}</div>
                                <div class="text-sm text-gray-500 mb-4">per malam</div>
                                <button onclick="document.getElementById('room-types-section').scrollIntoView({behavior: 'smooth'})" class="w-full bg-brand-green text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200">
                                    Lihat Kamar Tersedia
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Content Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Left Column - Main Content -->
                <div class="lg:col-span-2 space-y-8">
                    <!-- Description -->
                    <div class="bg-white rounded-2xl shadow-lg p-8">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4">Tentang Hotel</h2>
                        <div class="text-gray-700 leading-relaxed">
                            ${hotel.description || 'Deskripsi hotel tidak tersedia.'}
                        </div>
                    </div>

                    <!-- Facilities -->
                    <div class="bg-white rounded-2xl shadow-lg p-8">
                        <h2 class="text-2xl font-bold text-gray-900 mb-6">Fasilitas Hotel</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            ${hotel.facilities.length > 0 ? fasilitasHTML : '<p class="text-gray-500">Fasilitas tidak tersedia.</p>'}
                        </div>
                    </div>

                    <!-- Room Types -->
                    <div id="room-types-section" class="bg-white rounded-2xl shadow-lg p-8">
                        <h2 class="text-2xl font-bold text-gray-900 mb-6">Tipe Kamar</h2>
                        ${roomTypesHTML}
                    </div>
                </div>

                <!-- Right Column - Sidebar -->
                <div class="space-y-6">
                    <!-- Map -->
                    <div class="bg-white rounded-2xl shadow-lg p-6">
                        <h3 class="text-xl font-bold text-gray-900 mb-4">Lokasi</h3>
                        <div id="hotel-map" class="w-full h-64 rounded-xl border"></div>
                        <div class="mt-4 text-sm text-gray-600">
                            <div class="flex items-start gap-2">
                                <svg class="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                                <span>${hotel.location || 'Alamat tidak tersedia'}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Quick Info -->
                    <div class="bg-white rounded-2xl shadow-lg p-6">
                        <h3 class="text-xl font-bold text-gray-900 mb-4">Informasi Cepat</h3>
                        <div class="space-y-3">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                                <span class="text-sm text-gray-700">Reservasi Instan</span>
                            </div>
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                                <span class="text-sm text-gray-700">Check-in 24 Jam</span>
                            </div>
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                    <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                                <span class="text-sm text-gray-700">Pembayaran Aman</span>
                            </div>
                        </div>
                    </div>

                    <!-- Contact Info -->
                    <div class="bg-white rounded-2xl shadow-lg p-6">
                        <h3 class="text-xl font-bold text-gray-900 mb-4">Kontak</h3>
                        <div class="space-y-3">
                            <div class="flex items-center gap-3">
                                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                                </svg>
                                <span class="text-sm text-gray-700">+62 21 1234 5678</span>
                            </div>
                            <div class="flex items-center gap-3">
                                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                </svg>
                                <span class="text-sm text-gray-700">info@${hotel.name.toLowerCase().replace(/\s+/g, '')}.com</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Setelah render konten detail hotel
        if (hotel.latitude && hotel.longitude && document.getElementById('hotel-map')) {
            try {
                // Pastikan elemen map ada dan kosong
                const mapElement = document.getElementById('hotel-map');
                if (mapElement) {
                    // Bersihkan konten map terlebih dahulu
                    mapElement.innerHTML = '';
                    
                    // Hapus instance map lama jika ada
                    if (window.currentMap) {
                        window.currentMap.remove();
                    }
                    
                    // Inisialisasi peta Leaflet dengan konfigurasi yang lebih baik
                    const map = L.map('hotel-map', {
                        zoomControl: true,
                        scrollWheelZoom: false,
                        doubleClickZoom: false,
                        boxZoom: false,
                        keyboard: false,
                        dragging: true,
                        touchZoom: true
                    }).setView([parseFloat(hotel.latitude), parseFloat(hotel.longitude)], 15);
                    
                    // Simpan referensi map untuk cleanup nanti
                    window.currentMap = map;
                    
                    // Tambahkan tile layer dengan konfigurasi yang lebih stabil
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                        maxZoom: 18,
                        minZoom: 3
                    }).addTo(map);
                    
                    // Tambahkan marker dengan styling yang lebih baik
                    const marker = L.marker([parseFloat(hotel.latitude), parseFloat(hotel.longitude)], {
                        title: hotel.name
                    }).addTo(map);
                    
                    // Bind popup dengan styling yang lebih baik
                    marker.bindPopup(`<b>${hotel.name}</b>`, {
                        closeButton: true,
                        autoClose: false
                    }).openPopup();
                    
                    // Trigger resize event untuk memastikan map render dengan benar
                    setTimeout(() => {
                        map.invalidateSize();
                    }, 100);
                }
            } catch (error) {
                console.error('Error initializing map:', error);
                // Tampilkan pesan error atau fallback
                const mapElement = document.getElementById('hotel-map');
                if (mapElement) {
                    mapElement.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500">Peta tidak dapat dimuat</div>';
                }
            }
        } else {
            // Jika tidak ada koordinat, tampilkan pesan
            const mapElement = document.getElementById('hotel-map');
            if (mapElement) {
                mapElement.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500">Lokasi tidak tersedia</div>';
            }
        }
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
        
        // Set tanggal minimum untuk check-in (hari ini)
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        document.getElementById('booking-form-content').innerHTML = `
            <div class="lg:col-span-2">
                <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <!-- Header Booking -->
                    <div class="bg-gradient-to-r from-brand-green to-green-600 text-white p-6">
                        <h3 class="text-2xl font-bold mb-2">Lengkapi Data Pemesanan</h3>
                        <p class="text-green-100">Pastikan semua informasi terisi dengan benar</p>
                    </div>
                    
                    <!-- Form Content -->
                    <div class="p-8">
                        <form id="booking-form" class="space-y-6">
                            <!-- Informasi Tamu -->
                            <div class="border-b border-gray-200 pb-6">
                                <h4 class="text-lg font-semibold text-brand-black mb-4 flex items-center">
                                    <svg class="w-5 h-5 mr-2 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                    </svg>
                                    Informasi Tamu
                                </h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
                                        <input type="text" value="${currentUser.name}" required class="form-input bg-gray-50 border-gray-300" readonly>
                                        <p class="text-xs text-gray-500 mt-1">Data diambil dari profil Anda</p>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                        <input type="email" value="${currentUser.email}" required class="form-input bg-gray-50 border-gray-300" readonly>
                                    </div>
                                </div>
                            </div>

                            <!-- Tanggal Menginap -->
                            <div class="border-b border-gray-200 pb-6">
                                <h4 class="text-lg font-semibold text-brand-black mb-4 flex items-center">
                                    <svg class="w-5 h-5 mr-2 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                    Tanggal Menginap
                                </h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Check-in</label>
                                        <input type="date" id="checkin-date" name="checkin-date" required class="form-input" min="${today}">
                                        <p class="text-xs text-gray-500 mt-1">Check-in mulai pukul 14:00</p>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Check-out</label>
                                        <input type="date" id="checkout-date" name="checkout-date" required class="form-input" min="${tomorrow}">
                                        <p class="text-xs text-gray-500 mt-1">Check-out hingga pukul 12:00</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Jumlah Tamu -->
                            <div class="border-b border-gray-200 pb-6">
                                <h4 class="text-lg font-semibold text-brand-black mb-4 flex items-center">
                                    <svg class="w-5 h-5 mr-2 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                    </svg>
                                    Jumlah Tamu
                                </h4>
                                <div class="flex items-center space-x-4">
                                    <label class="block text-sm font-medium text-gray-700">Dewasa & Anak-anak:</label>
                                    <div class="flex items-center border border-gray-300 rounded-lg">
                                        <button type="button" id="guest-decrease" class="px-3 py-2 text-gray-600 hover:text-brand-green transition-colors">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                                            </svg>
                                        </button>
                                        <input type="number" name="guests" value="1" min="1" max="6" required class="w-16 text-center border-0 focus:ring-0">
                                        <button type="button" id="guest-increase" class="px-3 py-2 text-gray-600 hover:text-brand-green transition-colors">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <p class="text-xs text-gray-500 mt-2">Maksimal 6 tamu per kamar</p>
                            </div>

                            <!-- Special Requests -->
                            <div>
                                <h4 class="text-lg font-semibold text-brand-black mb-4 flex items-center">
                                    <svg class="w-5 h-5 mr-2 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                    Permintaan Khusus (Opsional)
                                </h4>
                                <textarea name="special_requests" rows="3" placeholder="Contoh: Kamar dengan pemandangan kota, tempat tidur tambahan, atau permintaan khusus lainnya..." class="form-input resize-none"></textarea>
                            </div>
                            
                            <!-- Tombol Booking -->
                            <div class="pt-6">
                                <button type="submit" id="booking-submit-btn" class="w-full bg-brand-green text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-colors duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-200">
                                    <div class="flex items-center justify-center">
                                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                                        </svg>
                                        Lanjutkan ke Pembayaran
                                    </div>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            
            <div class="lg:col-span-1">
                <!-- Ringkasan Pesanan -->
                <div class="bg-white rounded-2xl shadow-lg overflow-hidden sticky top-24">
                    <div class="bg-gradient-to-r from-brand-green to-green-600 text-white p-6">
                        <h3 class="text-xl font-bold mb-2">Ringkasan Pesanan</h3>
                        <p class="text-green-100">Detail biaya dan informasi</p>
                    </div>
                    
                    <div class="p-6">
                        <!-- Hotel Info -->
                        <div class="flex items-start space-x-4 mb-6">
                            <img src="${selectedRoom && selectedRoom.image_gallery ? selectedRoom.image_gallery.split(',')[0].trim() : hotel.image}" class="w-20 h-20 object-cover rounded-lg flex-shrink-0">
                            <div class="flex-1">
                                <h4 class="font-bold text-lg text-brand-black">${hotel.name}</h4>
                                <p class="text-brand-grey text-sm">${hotel.location}</p>
                                ${selectedRoom ? `<p class="text-brand-green font-medium text-sm mt-1">${selectedRoom.name}</p>` : ''}
                            </div>
                        </div>

                        <!-- Detail Biaya -->
                        <div class="space-y-3 mb-6">
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600">Harga per malam</span>
                                <span class="font-semibold" id="harga-per-malam">${formatCurrency(selectedRoom ? selectedRoom.price : hotel.price)}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600">Jumlah malam</span>
                                <span class="font-semibold" id="jumlah-malam">${totalNights}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600">Subtotal</span>
                                <span class="font-semibold" id="subtotal">${formatCurrency((selectedRoom ? selectedRoom.price : hotel.price) * totalNights)}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600">Pajak & Layanan (10%)</span>
                                <span class="font-semibold" id="pajak">${formatCurrency((selectedRoom ? selectedRoom.price : hotel.price) * totalNights * 0.1)}</span>
                            </div>
                            <div class="border-t pt-3">
                                <div class="flex justify-between items-center text-lg font-bold text-brand-black">
                                    <span>Total Pembayaran</span>
                                    <span id="total-harga">${formatCurrency(totalPrice)}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Informasi Penting -->
                        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <h5 class="font-semibold text-blue-800 mb-2 flex items-center">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                Informasi Penting
                            </h5>
                            <ul class="text-sm text-blue-700 space-y-1">
                                <li>• Pembayaran aman dengan enkripsi SSL</li>
                                <li>• Pembatalan gratis hingga 24 jam sebelum check-in</li>
                                <li>• Konfirmasi booking akan dikirim via email</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Update harga otomatis saat tanggal diubah
        const checkinInput = document.getElementById('checkin-date');
        const checkoutInput = document.getElementById('checkout-date');
        const guestInput = document.querySelector('input[name="guests"]');
        const guestDecrease = document.getElementById('guest-decrease');
        const guestIncrease = document.getElementById('guest-increase');

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
            const subtotal = (selectedRoom ? selectedRoom.price : hotel.price) * totalNights;
            const tax = subtotal * 0.1;
            totalPrice = subtotal + tax;
            
            document.getElementById('jumlah-malam').textContent = totalNights;
            document.getElementById('subtotal').textContent = formatCurrency(subtotal);
            document.getElementById('pajak').textContent = formatCurrency(tax);
            document.getElementById('total-harga').textContent = formatCurrency(totalPrice);
        }

        // Event listeners
        checkinInput.addEventListener('change', updateSummary);
        checkoutInput.addEventListener('change', updateSummary);
        
        // Guest counter
        guestDecrease.addEventListener('click', () => {
            const currentValue = parseInt(guestInput.value);
            if (currentValue > 1) {
                guestInput.value = currentValue - 1;
            }
        });
        
        guestIncrease.addEventListener('click', () => {
            const currentValue = parseInt(guestInput.value);
            if (currentValue < 6) {
                guestInput.value = currentValue + 1;
            }
        });

        // Set default dates
        checkinInput.value = today;
        checkoutInput.value = tomorrow;
        updateSummary();

        // Add event listener to the booking form
        const bookingForm = document.getElementById('booking-form');
        console.log('Booking form found:', bookingForm);
        
        if (bookingForm) {
            // Simple event listener
            bookingForm.onsubmit = (e) => {
                console.log('Form onsubmit triggered!');
                e.preventDefault();
                
                // Get form data directly
                const formData = new FormData(bookingForm);
                const checkin = formData.get('checkin-date') || '';
                const checkout = formData.get('checkout-date') || '';
                const guests = formData.get('guests') || '1';
                const specialRequests = formData.get('special_requests') || '';
                
                console.log('Form data from FormData:', { checkin, checkout, guests, specialRequests });
                
                // Call handleBooking with form data
                handleBookingWithData(e, hotel.id, totalNights, totalPrice, checkin, checkout, guests, specialRequests);
            };
        }
    }

    function handleBookingWithData(event, hotelId, totalNights, totalPrice, checkin, checkout, guests, specialRequests) {
        console.log('handleBookingWithData called with:', { hotelId, totalNights, totalPrice, checkin, checkout, guests, specialRequests });
        console.log('allHotels:', allHotels);
        const hotel = allHotels.find(h => h.id == hotelId);
        console.log('Found hotel:', hotel);
        
        if (!hotel) {
            alert('Hotel tidak ditemukan.');
            return;
        }
        
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
        
        // Validasi jumlah tamu
        if (guests < 1 || guests > 6) {
            alert('Jumlah tamu harus antara 1-6 orang.');
            return;
        }
        
        const bookingData = {
            user_id: currentUser.id,
            hotel_id: hotel.id,
            checkin_date: checkin,
            checkout_date: checkout,
            total_price: Math.round(totalPrice),
            guests,
            special_requests: specialRequests
        };
        
        // Tampilkan loading state
        const submitButton = event.target.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = `
            <div class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses Pemesanan...
            </div>
        `;
        submitButton.disabled = true;
        
        console.log('Sending booking data:', bookingData);
        apiCreateBooking(bookingData).then(result => {
            console.log('Booking API result:', result);
            if (result.success) {
                const bookingInfo = {
                    hotelName: hotel.name,
                    checkin,
                    checkout,
                    totalPrice: formatCurrency(totalPrice),
                    bookingId: result.booking_id || `SOJ-${Date.now()}`,
                    guests,
                    specialRequests
                };
                navigate('confirmation', bookingInfo);
            } else {
                alert(result.message || 'Pemesanan gagal.');
                // Reset button
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
            }
        }).catch((error) => {
            console.error('Booking API error:', error);
            alert('Pemesanan gagal.');
            // Reset button
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        });
    }

    function handleBooking(event, hotelId, totalNights, totalPrice) {
        event.preventDefault();
        console.log('handleBooking called with:', { hotelId, totalNights, totalPrice });
        console.log('allHotels:', allHotels);
        const hotel = allHotels.find(h => h.id == hotelId);
        console.log('Found hotel:', hotel);
        
        if (!hotel) {
            alert('Hotel tidak ditemukan.');
            return;
        }
        
        // Get form values with fallback
        const checkinElement = event.target.elements['checkin-date'];
        const checkoutElement = event.target.elements['checkout-date'];
        const guestsElement = event.target.elements['guests'];
        const specialRequestsElement = event.target.elements['special_requests'];
        
        const checkin = checkinElement ? checkinElement.value : '';
        const checkout = checkoutElement ? checkoutElement.value : '';
        const guests = guestsElement ? guestsElement.value : '1';
        const specialRequests = specialRequestsElement ? specialRequestsElement.value : '';
        
        console.log('Form data:', { checkin, checkout, guests, specialRequests });
        console.log('Form elements:', event.target.elements);
        console.log('Checkin element:', event.target.elements['checkin-date']);
        console.log('Checkout element:', event.target.elements['checkout-date']);
        console.log('Guests element:', event.target.elements['guests']);
        
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
        
        // Validasi jumlah tamu
        if (guests < 1 || guests > 6) {
            alert('Jumlah tamu harus antara 1-6 orang.');
            return;
        }
        
        const bookingData = {
            user_id: currentUser.id,
            hotel_id: hotel.id,
            checkin_date: checkin,
            checkout_date: checkout,
            total_price: Math.round(totalPrice),
            guests,
            special_requests: specialRequests
        };
        
        // Tampilkan loading state
        const submitButton = event.target.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = `
            <div class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses Pemesanan...
            </div>
        `;
        submitButton.disabled = true;
        
        console.log('Sending booking data:', bookingData);
        apiCreateBooking(bookingData).then(result => {
            console.log('Booking API result:', result);
            if (result.success) {
                const bookingInfo = {
                    hotelName: hotel.name,
                    checkin,
                    checkout,
                    totalPrice: formatCurrency(totalPrice),
                    bookingId: result.booking_id || `SOJ-${Date.now()}`,
                    guests,
                    specialRequests
                };
                navigate('confirmation', bookingInfo);
            } else {
                alert(result.message || 'Pemesanan gagal.');
                // Reset button
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
            }
        }).catch((error) => {
            console.error('Booking API error:', error);
            alert('Pemesanan gagal.');
            // Reset button
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        });
    }

    function renderConfirmation(bookingData) {
        document.getElementById('confirmation-content').innerHTML = `
            <div class="max-w-4xl mx-auto">
                <!-- Success Header -->
                <div class="text-center mb-8">
                    <div class="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                        <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h1 class="text-4xl font-bold text-brand-black mb-2">Pemesanan Berhasil!</h1>
                    <p class="text-lg text-brand-grey">Terima kasih, ${currentUser.name}. Pesanan Anda telah kami konfirmasi.</p>
                </div>

                <!-- Booking Details Card -->
                <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
                    <div class="bg-gradient-to-r from-brand-green to-green-600 text-white p-6">
                        <h2 class="text-2xl font-bold mb-2">Detail Pemesanan</h2>
                        <p class="text-green-100">Booking ID: ${bookingData.bookingId}</p>
                    </div>
                    
                    <div class="p-8">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <!-- Hotel Information -->
                            <div>
                                <h3 class="text-lg font-semibold text-brand-black mb-4 flex items-center">
                                    <svg class="w-5 h-5 mr-2 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                    </svg>
                                    Informasi Hotel
                                </h3>
                                <div class="space-y-3">
                                    <div>
                                        <span class="text-gray-600 text-sm">Hotel</span>
                                        <p class="font-semibold text-brand-black">${bookingData.hotelName}</p>
                                    </div>
                                    <div class="grid grid-cols-2 gap-4">
                                        <div>
                                            <span class="text-gray-600 text-sm">Check-in</span>
                                            <p class="font-semibold text-brand-black">${bookingData.checkin}</p>
                                        </div>
                                        <div>
                                            <span class="text-gray-600 text-sm">Check-out</span>
                                            <p class="font-semibold text-brand-black">${bookingData.checkout}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <span class="text-gray-600 text-sm">Jumlah Tamu</span>
                                        <p class="font-semibold text-brand-black">${bookingData.guests} orang</p>
                                    </div>
                                    ${bookingData.specialRequests ? `
                                    <div>
                                        <span class="text-gray-600 text-sm">Permintaan Khusus</span>
                                        <p class="text-brand-black">${bookingData.specialRequests}</p>
                                    </div>
                                    ` : ''}
                                </div>
                            </div>

                            <!-- Payment Information -->
                            <div>
                                <h3 class="text-lg font-semibold text-brand-black mb-4 flex items-center">
                                    <svg class="w-5 h-5 mr-2 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                                    </svg>
                                    Informasi Pembayaran
                                </h3>
                                <div class="space-y-3">
                                    <div class="flex justify-between items-center">
                                        <span class="text-gray-600">Total Pembayaran</span>
                                        <span class="text-2xl font-bold text-brand-black">${bookingData.totalPrice}</span>
                                    </div>
                                    <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <h4 class="font-semibold text-green-800 mb-2 flex items-center">
                                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                            Pembayaran Berhasil
                                        </h4>
                                        <p class="text-sm text-green-700">Pembayaran telah diproses dan diterima oleh sistem kami.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Next Steps -->
                <div class="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
                    <h3 class="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Langkah Selanjutnya
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="flex items-start space-x-3">
                            <div class="bg-blue-100 rounded-full p-2">
                                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                </svg>
                            </div>
                            <div>
                                <h4 class="font-semibold text-blue-800">Email Konfirmasi</h4>
                                <p class="text-sm text-blue-700">Konfirmasi booking akan dikirim ke email Anda dalam beberapa menit.</p>
                            </div>
                        </div>
                        <div class="flex items-start space-x-3">
                            <div class="bg-blue-100 rounded-full p-2">
                                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <div>
                                <h4 class="font-semibold text-blue-800">Check-in</h4>
                                <p class="text-sm text-blue-700">Check-in tersedia mulai pukul 14:00 pada tanggal yang dipilih.</p>
                            </div>
                        </div>
                        <div class="flex items-start space-x-3">
                            <div class="bg-blue-100 rounded-full p-2">
                                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"></path>
                                </svg>
                            </div>
                            <div>
                                <h4 class="font-semibold text-blue-800">Riwayat Booking</h4>
                                <p class="text-sm text-blue-700">Lihat semua pemesanan Anda di halaman riwayat booking.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <button onclick="navigate('history')" class="bg-brand-green text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"></path>
                        </svg>
                        Lihat Riwayat Booking
                    </button>
                    <button onclick="navigate('home')" class="bg-gray-100 text-brand-black px-8 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                        Kembali ke Halaman Utama
                    </button>
                </div>
            </div>
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
        if (!currentUser) {
            navigate('login');
            return;
        }
        
        const bookingListDiv = document.getElementById('booking-list');
        bookingListDiv.innerHTML = `
            <div class="col-span-full text-center py-8">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <svg class="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                </div>
                <p class="text-gray-600">Memuat riwayat pemesanan...</p>
            </div>
        `;
        
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
                bookingListDiv.innerHTML = `
                    <div class="col-span-full text-center py-12">
                        <div class="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                            <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"></path>
                            </svg>
                        </div>
                        <h3 class="text-xl font-semibold text-gray-600 mb-2">Belum ada pemesanan</h3>
                        <p class="text-gray-500 mb-6">Anda belum memiliki riwayat pemesanan hotel.</p>
                        <button onclick="navigate('search')" class="bg-brand-green text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors">
                            <svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                            Mulai Pencarian Hotel
                        </button>
                    </div>
                `;
                return;
            }
            
            bookingListDiv.innerHTML = bookings.map(booking => `
                <div class="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    <div class="relative">
                        <img src="${booking.hotel_image || 'img/hotels/default.png'}" class="w-full h-48 object-cover">
                        <div class="absolute top-4 right-4">
                            <span class="bg-${booking.status_color}-100 text-${booking.status_color}-800 px-3 py-1 rounded-full text-sm font-semibold">
                                ${booking.status_display}
                            </span>
                        </div>
                        <div class="absolute bottom-4 left-4">
                            <div class="flex items-center bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                                </svg>
                                <span class="text-sm font-semibold">${booking.star_rating || 5}</span>
                            </div>
                        </div>
                    </div>
                    <div class="p-6">
                        <div class="mb-4">
                            <h3 class="text-xl font-bold text-brand-black mb-1">${booking.hotel_name}</h3>
                            <p class="text-brand-grey text-sm flex items-center">
                                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                                ${booking.hotel_location}
                            </p>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div class="bg-gray-50 rounded-lg p-3">
                                <div class="flex items-center mb-1">
                                    <svg class="w-4 h-4 mr-2 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                    <span class="text-sm font-medium text-gray-600">Check-in</span>
                                </div>
                                <p class="font-semibold text-brand-black">${booking.checkin}</p>
                            </div>
                            <div class="bg-gray-50 rounded-lg p-3">
                                <div class="flex items-center mb-1">
                                    <svg class="w-4 h-4 mr-2 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                    <span class="text-sm font-medium text-gray-600">Check-out</span>
                                </div>
                                <p class="font-semibold text-brand-black">${booking.checkout}</p>
                            </div>
                        </div>
                        
                        <div class="space-y-2 mb-4">
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600">Jumlah Tamu:</span>
                                <span class="font-semibold">${booking.guests} orang</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600">Durasi:</span>
                                <span class="font-semibold">${booking.nights} malam</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600">Total Pembayaran:</span>
                                <span class="font-bold text-lg text-brand-black">${formatCurrency(booking.total_price)}</span>
                            </div>
                        </div>
                        
                        ${booking.special_requests ? `
                        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                            <div class="flex items-start">
                                <svg class="w-4 h-4 mr-2 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                <div>
                                    <p class="text-sm font-medium text-blue-800 mb-1">Permintaan Khusus</p>
                                    <p class="text-sm text-blue-700">${booking.special_requests}</p>
                                </div>
                            </div>
                        </div>
                        ` : ''}
                        
                        <div class="flex gap-2">
                            <button onclick="navigate('detail', ${booking.hotel_id})" class="flex-1 bg-brand-green text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                </svg>
                                Lihat Hotel
                            </button>
                            ${booking.status === 'confirmed' ? `
                            <button onclick="cancelBooking('${booking.id}')" class="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors flex items-center justify-center">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                                Batalkan
                            </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
            
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
                    showReviewModal(hotelId);
                };
            });
            
        } catch (err) {
            bookingListDiv.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                        <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-red-600 mb-2">Gagal memuat data</h3>
                    <p class="text-gray-500">Terjadi kesalahan saat memuat riwayat pemesanan.</p>
                </div>
            `;
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
