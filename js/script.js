document.addEventListener('DOMContentLoaded', () => {

    // --- App State ---
    let currentUser = null;

    // --- Dummy Data as Initial Showcase ---
    // const allHotels = [ ... ]; // DIHAPUS, digantikan dengan hasil fetch API
    let allHotels = [];
    const allFacilitiesOptions = ['Kolam Renang', 'WiFi Gratis', 'Parkir', 'Restoran', 'Spa', 'Pusat Kebugaran'];
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

    // --- Navigation Logic & STATE ---
    window.navigate = (pageId, data = null) => {
        // Update the URL hash for client-side routing
        if (window.location.hash !== '#' + pageId) {
            window.location.hash = '#' + pageId;
        }
        // Optionally store data for detail/booking/confirmation
        if (data !== null) {
            window._navigateData = data;
        } else {
            window._navigateData = null;
        }
    };

    // --- Client-side Routing: Show Page Based on URL Hash ---
    function showPageBasedOnURL() {
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
        } 
        // Special handling for login/register/forgot forms
        if (pageId === 'login' || pageId === 'register' || pageId === 'forgot') {
            renderAuthForms();
            // Show the correct form
            document.getElementById('login-form-container').classList.add('hidden');
            document.getElementById('register-form-container').classList.add('hidden');
            document.getElementById('forgot-form-container').classList.add('hidden');
            document.getElementById(pageId + '-form-container').classList.remove('hidden');
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

    window.handleLogout = () => {
        const userName = currentUser.name;
        currentUser = null;
        sessionStorage.removeItem('sojournUser');
        alert(`Anda telah berhasil logout, ${userName}.`);
        updateHeaderUI();
        navigate('home');
    };

    window.switchAuthForm = (formType) => {
        // Update hash to reflect the form type
        if (window.location.hash !== '#' + formType) {
            window.location.hash = '#' + formType;
        } else {
            // If hash is already correct, force update the UI
            showPageBasedOnURL();
        }
        document.getElementById('login-form-container').classList.add('hidden');
        document.getElementById('register-form-container').classList.add('hidden');
        document.getElementById('forgot-form-container').classList.add('hidden');
        document.getElementById(formType + '-form-container').classList.remove('hidden');
    };
    
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
        return `
            <div class="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer" onclick="navigate('detail', ${hotel.id})">
                <img src="${hotel.image}" class="w-full h-56 object-cover" alt="Gambar ${hotel.name}">
                <div class="p-6">
                    <p class="text-sm text-brand-grey">${hotel.location}</p>
                    <h3 class="text-xl font-bold text-brand-black mt-1">${hotel.name}</h3>
                    <div class="flex justify-between items-center mt-4">
                        <p class="text-lg font-semibold text-brand-green">${formatCurrency(hotel.price)} <span class="text-sm font-normal text-brand-grey">/ malam</span></p>
                        <div class="flex items-center gap-1 text-yellow-500">
                            <svg class="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
                            <span class="font-bold text-brand-black">${hotel.rating}</span>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-1 mt-3">${fasilitasHTML}</div>
                </div>
            </div>
        `;
    }
    
    function renderSearchBar(containerId, initialQuery = '') {
        const container = document.getElementById(containerId);
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
                <div class="search-field">
                    <label>Tamu</label>
                    <div class="flex items-center gap-2">
                        <button type="button" id="${containerId}-guests-minus" class="bg-gray-200 px-2 py-1 rounded text-lg font-bold">-</button>
                        <input type="number" id="${containerId}-guests" value="2" min="1" max="10" class="form-input w-16 text-center" style="appearance: textfield;">
                        <button type="button" id="${containerId}-guests-plus" class="bg-gray-200 px-2 py-1 rounded text-lg font-bold">+</button>
                    </div>
                </div>
            </div>
            <button id="${containerId}-button" class="search-button-main">Cari</button>
        `;
        // Tambahkan event untuk + dan -
        const guestsInput = document.getElementById(`${containerId}-guests`);
        document.getElementById(`${containerId}-guests-minus`).onclick = () => {
            let val = parseInt(guestsInput.value) || 1;
            if (val > 1) guestsInput.value = val - 1;
        };
        document.getElementById(`${containerId}-guests-plus`).onclick = () => {
            let val = parseInt(guestsInput.value) || 1;
            if (val < 10) guestsInput.value = val + 1;
        };
        guestsInput.addEventListener('input', () => {
            let val = parseInt(guestsInput.value) || 1;
            if (val < 1) guestsInput.value = 1;
            if (val > 10) guestsInput.value = 10;
        });
        document.getElementById(`${containerId}-button`).onclick = () => {
            const query = document.getElementById(`${containerId}-location`).value;
            // Bisa tambahkan pengambilan jumlah tamu jika ingin filter berdasarkan tamu
            navigate('search', { query });
        };
    }

    function renderHomePage() {
        document.getElementById('popular-hotels-container').innerHTML = allHotels.slice(0, 3).map(renderHotelCard).join('');
        renderSearchBar('home-search-bar');
    }

    function renderSearchResultsPage(data = {}) {
        const query = data.query || '';
        renderSearchBar('search-page-bar', query);
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
        // Tipe kamar
        const roomTypesHTML = hotel.room_types && hotel.room_types.length > 0 ? hotel.room_types.map(rt => `
            <div class='border rounded-xl p-4 flex flex-col md:flex-row gap-4 mb-4 bg-white'>
                <div class='flex-1'>
                    <div class='flex gap-2 mb-2'>
                        ${(rt.image_gallery ? rt.image_gallery.split(',').slice(0,2).map(img => `<img src='${img.trim()}' class='w-24 h-16 object-cover rounded-lg'>`).join('') : '')}
                    </div>
                    <div class='font-bold text-lg mb-1'>${rt.name}</div>
                    <div class='text-brand-green font-semibold mb-1'>${formatCurrency(rt.price)}</div>
                    <div class='text-xs text-gray-500 mb-1'>Tersedia: ${rt.availability}</div>
                </div>
            </div>
        `).join('') : '<div class="text-gray-400">Tidak ada tipe kamar tersedia.</div>';
        // Ulasan
        const avgRating = hotel.avg_review_rating ? parseFloat(hotel.avg_review_rating).toFixed(1) : '-';
        const reviewCount = hotel.review_count || 0;
        const ratingLabel = hotel.avg_review_rating ? getRatingLabel(hotel.avg_review_rating) : '-';
        // Star rating
        const starHTML = `<span class='text-yellow-500'>${'★'.repeat(hotel.star_rating)}${'☆'.repeat(5-hotel.star_rating)}</span>`;
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
                        <div class="flex items-center gap-3 mb-2">${starHTML} <span class="text-gray-500">(${hotel.star_rating} bintang)</span></div>
                        <div class="text-brand-green text-2xl font-bold mb-2">${minRoomPrice ? formatCurrency(minRoomPrice) : '-'} <span class="text-base font-normal text-brand-grey">/ malam</span></div>
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

    function showBookingForm(hotelId) {
        if (!currentUser) {
            alert('Anda harus login terlebih dahulu untuk memesan hotel.');
            navigate('login');
            return;
        }
        const hotel = allHotels.find(h => h.id == hotelId);
        let totalNights = 1;
        let totalPrice = hotel.price * 1.1;
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
                    <img src="${hotel.image}" class="w-full h-40 object-cover rounded-lg mb-4">
                    <h4 class="text-xl font-bold">${hotel.name}</h4>
                    <p class="text-brand-grey">${hotel.location}</p>
                    <div class="border-t my-4"></div>
                    <div class="flex justify-between"><p>Harga per malam</p><p class="font-semibold" id="harga-per-malam">${formatCurrency(hotel.price)}</p></div>
                    <div class="flex justify-between mt-2"><p>Pajak & Layanan (10%)</p><p class="font-semibold" id="pajak">${formatCurrency(hotel.price * 0.1)}</p></div>
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
            totalPrice = hotel.price * totalNights * 1.1;
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

    function setupFilters() {
        // Harga min/maks dari data hotel
        const prices = allHotels.map(h => h.price);
        const minPrice = Math.min(...prices, 0);
        const maxPrice = Math.max(...prices, 10000000);
        const priceSlider = document.getElementById('price-range-slider');
        const priceMinInput = document.getElementById('price-min-input');
        const priceMaxInput = document.getElementById('price-max-input');
        const priceMinLabel = document.getElementById('price-min-label');
        const priceMaxLabel = document.getElementById('price-max-label');
        // Set default value
        priceSlider.min = minPrice;
        priceSlider.max = maxPrice;
        priceSlider.value = maxPrice;
        priceMinInput.value = minPrice;
        priceMaxInput.value = maxPrice;
        priceMinLabel.textContent = formatCurrency(minPrice);
        priceMaxLabel.textContent = formatCurrency(maxPrice) + '+';
        // Sinkronisasi slider dan input manual
        priceSlider.addEventListener('input', (e) => {
            priceMaxInput.value = e.target.value;
            applyFilters();
        });
        priceMinInput.addEventListener('input', (e) => {
            if (parseInt(e.target.value) > parseInt(priceMaxInput.value)) {
                priceMinInput.value = priceMaxInput.value;
            }
            applyFilters();
        });
        priceMaxInput.addEventListener('input', (e) => {
            if (parseInt(e.target.value) < parseInt(priceMinInput.value)) {
                priceMaxInput.value = priceMinInput.value;
            }
            priceSlider.value = priceMaxInput.value;
            applyFilters();
        });
        
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

    // --- App Inisiation ---
    async function initApp() {
        // Checking login session when app is initialized
        const loggedInUser = sessionStorage.getItem('sojournUser');
        if (loggedInUser) {
            currentUser = JSON.parse(loggedInUser);
        }
        await fetchHotels(); // Ambil data hotel dari API
        renderHomePage();
        renderAuthForms();
        setupFilters();
        updateHeaderUI();
        showPageBasedOnURL(); // Show the correct page on load
    }

    initApp(); // Run the app
});
