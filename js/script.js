document.addEventListener('DOMContentLoaded', () => {

    // --- App State ---
    let currentUser = null;

    // --- Dummy Data as Initial Showcase ---
    const allHotels = [
        { id: 1, name: 'The Ritz-Carlton', location: 'Jakarta', price: 2500000, rating: 4.9, image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1925&auto=format&fit=crop', facilities: ['Kolam Renang', 'WiFi Gratis', 'Spa', 'Parkir', 'Restoran'], description: 'Nikmati kemewahan tak tertandingi di jantung kota Jakarta. The Ritz-Carlton menawarkan layanan bintang lima dengan pemandangan kota yang memukau dan fasilitas kelas dunia.' },
        { id: 2, name: 'GH Universal Hotel', location: 'Bandung', price: 1200000, rating: 4.8, image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=2070&auto=format&fit=crop', facilities: ['Kolam Renang', 'WiFi Gratis', 'Parkir', 'Restoran'], description: 'Dengan arsitektur bergaya Eropa klasik, GH Universal Hotel memberikan pengalaman menginap yang unik di kota Bandung. Cocok untuk liburan keluarga dan perjalanan bisnis.' },
        { id: 3, name: 'The Anvaya Beach Resort', location: 'Bali', price: 1800000, rating: 4.9, image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=2070&auto=format&fit=crop', facilities: ['Kolam Renang', 'WiFi Gratis', 'Spa', 'Pusat Kebugaran'], description: 'Terletak di tepi pantai Kuta yang ikonik, The Anvaya Beach Resort adalah surga tropis yang sempurna untuk relaksasi dan menikmati keindahan matahari terbenam Bali.' },
        { id: 4, name: 'Hotel Indonesia Kempinski', location: 'Jakarta', price: 3250000, rating: 5.0, facilities: ['Kolam Renang', 'WiFi Gratis', 'Spa', 'Pusat Kebugaran'] , image: 'https://images.unsplash.com/photo-1542314831-068cd1dbb563?q=80&w=2070&auto=format&fit=crop', description: 'Sebagai landmark bersejarah Jakarta, hotel ini menawarkan kemewahan modern yang berpadu dengan pesona klasik Indonesia, terletak strategis di Bundaran HI.'},
        { id: 5, name: 'The Langham, Jakarta', location: 'Jakarta', price: 4100000, rating: 4.9, facilities: ['Kolam Renang', 'Pusat Kebugaran', 'Restoran', 'Spa'], image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=2070&auto=format&fit=crop', description: 'The Langham, Jakarta mendefinisikan kembali arti kemewahan dengan layanan personal yang luar biasa, santapan adiboga, dan fasilitas kesehatan yang canggih.' },
    ];
    const allFacilitiesOptions = ['Kolam Renang', 'WiFi Gratis', 'Parkir', 'Restoran', 'Spa', 'Pusat Kebugaran'];

    // --- Helpers ---
    const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

    // --- Navigation Logic & STATE ---
    window.navigate = (pageId, data = null) => {
        document.querySelectorAll('.page-content').forEach(page => page.classList.add('hidden'));
        const header = document.getElementById('main-header');
        const footer = document.getElementById('main-footer');
        
        if (pageId === 'login') {
            header.classList.add('hidden');
            footer.classList.add('hidden');
        } else {
            header.classList.remove('hidden');
            footer.classList.remove('hidden');
        }

        if (pageId === 'search') renderSearchResultsPage(data);
        if (pageId === 'detail') renderHotelDetails(data);
        if (pageId === 'booking') showBookingForm(data);
        if (pageId === 'confirmation') renderConfirmation(data);

        document.getElementById(pageId + '-page').classList.remove('hidden');
        window.scrollTo(0, 0);
    };

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
        const users = JSON.parse(localStorage.getItem('sojournUsers')) || [];
        const userExists = users.some(user => user.email === email);
        if (userExists) {
            alert('Email sudah terdaftar. Silakan gunakan email lain.');
            return;
        }
        users.push({ name, email, password });
        localStorage.setItem('sojournUsers', JSON.stringify(users));
        alert('Registrasi berhasil! Silakan login.');
        switchAuthForm('login');
    }

    function handleLogin(event) {
        event.preventDefault();
        const email = event.target.elements.email.value;
        const password = event.target.elements.password.value;
        const users = JSON.parse(localStorage.getItem('sojournUsers')) || [];
        const foundUser = users.find(user => user.email === email && user.password === password);
        if (foundUser) {
            currentUser = foundUser;
            sessionStorage.setItem('sojournUser', JSON.stringify(foundUser));
            alert(`Selamat datang kembali, ${currentUser.name}!`);
            updateHeaderUI();
            navigate('home');
        } else {
            alert('Email atau password salah.');
        }
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
        document.getElementById('login-form-container').classList.add('hidden');
        document.getElementById('register-form-container').classList.add('hidden');
        document.getElementById('forgot-form-container').classList.add('hidden');
        document.getElementById(formType + '-form-container').classList.remove('hidden');
    };
    
    // --- Content Render Funciton ---
    
    function renderHotelCard(hotel) {
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
                    <input type="text" value="2 tamu, 1 kamar">
                </div>
            </div>
            <button id="${containerId}-button" class="search-button-main">Cari</button>
        `;
        document.getElementById(`${containerId}-button`).onclick = () => {
            const query = document.getElementById(`${containerId}-location`).value;
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
    
    function renderHotelDetails(hotelId) {
        const hotel = allHotels.find(h => h.id === hotelId);
        if (!hotel) { navigate('home'); return; }
        document.getElementById('hotel-detail-content').innerHTML = `
            <button onclick="navigate('search')" class="mb-8 bg-gray-200 text-gray-800 px-4 py-2 rounded-full font-semibold hover:bg-gray-300">&larr; Kembali ke Pencarian</button>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div><img src="${hotel.image}" alt="${hotel.name}" class="w-full h-auto object-cover rounded-2xl shadow-lg"></div>
                <div>
                    <h1 class="text-4xl font-bold text-brand-black">${hotel.name}</h1>
                    <p class="text-lg text-brand-grey mt-2">${hotel.location}</p>
                    <div class="flex items-center gap-2 text-yellow-500 mt-4"><svg class="w-6 h-6 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg><span class="text-2xl font-bold text-brand-black">${hotel.rating}</span></div>
                    <p class="text-brand-grey mt-6 leading-relaxed">${hotel.description}</p>
                    <h3 class="text-xl font-bold text-brand-black mt-6 mb-3">Fasilitas Unggulan</h3>
                    <div class="flex flex-wrap gap-3">${hotel.facilities.map(f => `<span class="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">${f}</span>`).join('')}</div>
                    <div class="mt-8 bg-gray-100 p-6 rounded-lg">
                        <p class="text-3xl font-bold text-brand-green">${formatCurrency(hotel.price)}<span class="text-lg font-normal text-brand-grey"> / malam</span></p>
                        <button onclick="navigate('booking', ${hotel.id})" class="mt-4 w-full bg-brand-green text-white py-4 rounded-lg font-bold text-lg hover:bg-opacity-90">Pesan Sekarang</button>
                    </div>
                </div>
            </div>
        `;
    }

    function renderAuthForms() {
        document.getElementById('login-form-container').innerHTML = `<h2 class="text-2xl font-bold text-center">Selamat Datang Kembali!</h2><p class="text-center text-brand-grey mt-2 mb-6">Silakan masuk ke akun Anda.</p><form id="login-form" class="space-y-4"><input name="email" type="email" placeholder="Alamat Email" required class="form-input"><div><input name="password" type="password" placeholder="Password" required class="form-input"><a href="#" onclick="switchAuthForm('forgot')" class="text-sm text-brand-green hover:underline block text-right mt-1">Lupa password?</a></div><button type="submit" class="w-full bg-brand-green text-white py-3 rounded-lg font-semibold">Masuk</button></form><p class="text-center text-sm mt-6">Belum punya akun? <a href="#" onclick="switchAuthForm('register')" class="font-medium text-brand-green hover:underline">Daftar</a></p>`;
        document.getElementById('register-form-container').innerHTML = `<h2 class="text-2xl font-bold text-center">Buat Akun Baru</h2><p class="text-center text-brand-grey mt-2 mb-6">Mulai perjalanan Anda.</p><form id="register-form" class="space-y-4"><input name="name" type="text" placeholder="Nama Lengkap" required class="form-input"><input name="email" type="email" placeholder="Alamat Email" required class="form-input"><input name="password" type="password" placeholder="Password" required class="form-input"><button type="submit" class="w-full bg-brand-green text-white py-3 rounded-lg font-semibold">Daftar</button></form><p class="text-center text-sm mt-6">Sudah punya akun? <a href="#" onclick="switchAuthForm('login')" class="font-medium text-brand-green hover:underline">Masuk</a></p>`;
        document.getElementById('forgot-form-container').innerHTML = `<h2 class="text-2xl font-bold text-center">Lupa Password</h2><p class="text-center text-brand-grey mt-2 mb-6">Fitur ini belum tersedia.</p><p class="text-center text-sm mt-6"><a href="#" onclick="switchAuthForm('login')" class="font-medium text-brand-green hover:underline">Kembali ke Login</a></p>`;
        
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
        const hotel = allHotels.find(h => h.id === hotelId);
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
                    <div><label class="font-semibold">Jumlah Tamu</label><input type="number" value="1" min="1" max="5" required class="form-input mt-1"></div>
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
                    <div class="flex justify-between"><p>Harga per malam</p><p class="font-semibold">${formatCurrency(hotel.price)}</p></div>
                    <div class="flex justify-between mt-2"><p>Pajak & Layanan (10%)</p><p class="font-semibold">${formatCurrency(hotel.price * 0.1)}</p></div>
                    <div class="border-t my-4"></div>
                    <div class="flex justify-between text-xl font-bold"><p>Total</p><p>${formatCurrency(hotel.price * 1.1)}</p></div>
                </div>
            </div>
        `;
        document.getElementById('booking-form').addEventListener('submit', (e) => handleBooking(e, hotel.id));
    }

    function handleBooking(event, hotelId) {
        event.preventDefault();
        const hotel = allHotels.find(h => h.id === hotelId);
        const bookingData = { hotelName: hotel.name, checkin: event.target.elements['checkin-date'].value, checkout: event.target.elements['checkout-date'].value, totalPrice: formatCurrency(hotel.price * 1.1), bookingId: `SOJ-${Date.now()}` };
        navigate('confirmation', bookingData);
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

    function applyFilters() {
        const query = (document.getElementById('search-page-bar-location')?.value || '').toLowerCase();
        const price = parseInt(document.getElementById('price-range-slider').value);
        const checkedStars = [...document.querySelectorAll('#star-filter-options input:checked')].map(el => parseInt(el.value));
        const checkedFacilities = [...document.querySelectorAll('#facility-filter-options input:checked')].map(el => el.value);
        
        const filteredHotels = allHotels.filter(hotel => {
            const queryMatch = !query || hotel.location.toLowerCase().includes(query) || hotel.name.toLowerCase().includes(query);
            const priceMatch = hotel.price <= price;
            const starMatch = checkedStars.length === 0 || checkedStars.includes(Math.floor(hotel.rating));
            const facilityMatch = checkedFacilities.length === 0 || checkedFacilities.every(fac => hotel.facilities.includes(fac));
            return queryMatch && priceMatch && starMatch && facilityMatch;
        });

        document.getElementById('search-results-list').innerHTML = filteredHotels.length > 0 ? filteredHotels.map(renderHotelCard).join('') : `<p class="text-center text-brand-grey col-span-full">Tidak ada hotel yang cocok dengan kriteria Anda.</p>`;
        document.getElementById('search-results-count').textContent = `Menemukan ${filteredHotels.length} hotel`;
    }

    function setupFilters() {
        const priceSlider = document.getElementById('price-range-slider');
        const priceMaxDisplay = document.getElementById('price-max-display');
        priceMaxDisplay.textContent = formatCurrency(priceSlider.value);
        priceSlider.addEventListener('input', (e) => { priceMaxDisplay.textContent = formatCurrency(e.target.value); applyFilters(); });
        
        const starContainer = document.getElementById('star-filter-options');
        starContainer.innerHTML = [5, 4, 3, 2, 1].map(star => `<label class="flex items-center"><input type="checkbox" value="${star}" class="h-5 w-5 rounded border-gray-300 text-brand-green"><span class="ml-3 text-brand-grey">${star} Bintang</span></label>`).join('');
        starContainer.addEventListener('change', applyFilters);

        const facilityContainer = document.getElementById('facility-filter-options');
        facilityContainer.innerHTML = allFacilitiesOptions.map(f => `<label class="flex items-center"><input type="checkbox" value="${f}" class="h-5 w-5 rounded border-gray-300 text-brand-green"><span class="ml-3 text-brand-grey">${f}</span></label>`).join('');
        facilityContainer.addEventListener('change', applyFilters);
    }

    // --- App Inisiation ---
    function initApp() {
        // Checking login session when app is initialized
        const loggedInUser = sessionStorage.getItem('sojournUser');
        if (loggedInUser) {
            currentUser = JSON.parse(loggedInUser);
        }
        
        // Render all dynamic contents
        renderHomePage();
        renderAuthForms();
        setupFilters();
        
        // Showing the first page and update the UI header
        navigate('home');
        updateHeaderUI();
    }

    initApp(); // Run the app
});
