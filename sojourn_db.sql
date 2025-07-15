-- --------------------------------------------------------
-- BAGIAN 1: PEMBUATAN DATABASE
-- --------------------------------------------------------

CREATE DATABASE IF NOT EXISTS sojourn_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sojourn_db;

-- --------------------------------------------------------
-- BAGIAN 2: TABEL PENGGUNA (USERS)
-- Tabel ini akan menyimpan data registrasi dan login.
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- BAGIAN 3: TABEL HOTEL (HOTELS)
-- Tabel utama untuk data hotel.
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `hotels` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `location` VARCHAR(255),
    `price` INT,
    `rating` DECIMAL(2, 1),
    `image` TEXT,
    `description` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- BAGIAN 4: TABEL FASILITAS (FACILITIES)
-- Tabel master untuk semua jenis fasilitas yang ada.
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `facilities` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- BAGIAN 5: TABEL PENGHUBUNG HOTEL & FASILITAS (HOTEL_FACILITIES)
-- Tabel ini mengelola hubungan Many-to-Many.
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `hotel_facilities` (
    `hotel_id` INT,
    `facility_id` INT,
    PRIMARY KEY (`hotel_id`, `facility_id`),
    FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`facility_id`) REFERENCES `facilities`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- BAGIAN 6: TABEL PEMESANAN (BOOKINGS)
-- Tabel untuk mencatat setiap transaksi pemesanan.
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `bookings` (
    `id` VARCHAR(50) PRIMARY KEY, -- Contoh: SOJ-1672531200000
    `user_id` INT NOT NULL,
    `hotel_id` INT NOT NULL,
    `checkin_date` DATE NOT NULL,
    `checkout_date` DATE NOT NULL,
    `total_price` INT NOT NULL,
    `booking_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- BAGIAN 7: MENGISI DATA AWAL (SEEDING) - DIPERBAIKI
-- Mengisi tabel `hotels` dan `facilities` dengan data sample
-- --------------------------------------------------------

-- Menghapus data lama dengan cara yang aman (jika ada)
-- Urutan penghapusan: dari tabel child ke parent untuk menghindari constraint error
DELETE FROM `bookings`;
DELETE FROM `hotel_facilities`;
DELETE FROM `facilities`;
DELETE FROM `hotels`;
DELETE FROM `users`;

-- Reset AUTO_INCREMENT untuk memastikan ID dimulai dari 1
ALTER TABLE `users` AUTO_INCREMENT = 1;
ALTER TABLE `hotels` AUTO_INCREMENT = 1;
ALTER TABLE `facilities` AUTO_INCREMENT = 1;

-- Mengisi tabel `hotels`
INSERT INTO `hotels` (`id`, `name`, `location`, `price`, `rating`, `image`, `description`) VALUES
(1, 'The Ritz-Carlton', 'Jakarta', 2500000, 4.9, 'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1925&auto=format&fit=crop', 'Nikmati kemewahan tak tertandingi di jantung kota Jakarta. The Ritz-Carlton menawarkan layanan bintang lima dengan pemandangan kota yang memukau dan fasilitas kelas dunia.'),
(2, 'GH Universal Hotel', 'Bandung', 1200000, 4.8, 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=2070&auto=format&fit=crop', 'Dengan arsitektur bergaya Eropa klasik, GH Universal Hotel memberikan pengalaman menginap yang unik di kota Bandung. Cocok untuk liburan keluarga dan perjalanan bisnis.'),
(3, 'The Anvaya Beach Resort', 'Bali', 1800000, 4.9, 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=2070&auto=format&fit=crop', 'Terletak di tepi pantai Kuta yang ikonik, The Anvaya Beach Resort adalah surga tropis yang sempurna untuk relaksasi dan menikmati keindahan matahari terbenam Bali.'),
(4, 'Hotel Indonesia Kempinski', 'Jakarta', 3250000, 5.0, 'https://images.unsplash.com/photo-1542314831-068cd1dbb563?q=80&w=2070&auto=format&fit=crop', 'Sebagai landmark bersejarah Jakarta, hotel ini menawarkan kemewahan modern yang berpadu dengan pesona klasik Indonesia, terletak strategis di Bundaran HI.'),
(5, 'The Langham, Jakarta', 'Jakarta', 4100000, 4.9, 'https://images.unsplash.com/photo-1625244724120-130a0e5d44c6?q=80&w=2070&auto=format&fit=crop', 'Menawarkan pemandangan kota yang spektakuler dari kamar-kamar mewahnya, The Langham adalah ikon baru kemewahan di distrik bisnis Sudirman.');

-- Mengisi tabel `facilities` dengan fasilitas umum hotel
INSERT INTO `facilities` (`id`, `name`) VALUES
(1, 'WiFi Gratis'),
(2, 'Kolam Renang'),
(3, 'Pusat Kebugaran'),
(4, 'Spa & Wellness'),
(5, 'Restaurant'),
(6, 'Bar'),
(7, 'Room Service 24 Jam'),
(8, 'Parkir Gratis'),
(9, 'AC'),
(10, 'TV Kabel'),
(11, 'Laundry'),
(12, 'Business Center'),
(13, 'Meeting Room'),
(14, 'Airport Shuttle'),
(15, 'Concierge Service');

-- Mengisi tabel `hotel_facilities` untuk menghubungkan hotel dengan fasilitas
INSERT INTO `hotel_facilities` (`hotel_id`, `facility_id`) VALUES
-- The Ritz-Carlton (hotel_id = 1)
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 9), (1, 10), (1, 11), (1, 12), (1, 13), (1, 14), (1, 15),
-- GH Universal Hotel (hotel_id = 2)
(2, 1), (2, 2), (2, 3), (2, 5), (2, 7), (2, 8), (2, 9), (2, 10), (2, 11), (2, 12),
-- The Anvaya Beach Resort (hotel_id = 3)
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6), (3, 7), (3, 8), (3, 9), (3, 10), (3, 11), (3, 14),
-- Hotel Indonesia Kempinski (hotel_id = 4)
(4, 1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6), (4, 7), (4, 9), (4, 10), (4, 11), (4, 12), (4, 13), (4, 14), (4, 15),
-- The Langham, Jakarta (hotel_id = 5)
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6), (5, 7), (5, 9), (5, 10), (5, 11), (5, 12), (5, 13), (5, 14), (5, 15);

-- Menambahkan contoh user untuk testing
INSERT INTO `users` (`name`, `email`, `password`) VALUES
('John Doe', 'john@example.com', '$2y$10$example_hashed_password_here'),
('Jane Smith', 'jane@example.com', '$2y$10$example_hashed_password_here'),
('Admin User', 'admin@sojourn.com', '$2y$10$example_hashed_password_here');

-- --------------------------------------------------------
-- BAGIAN 8: INDEXES UNTUK OPTIMASI PERFORMA
-- --------------------------------------------------------

-- Index untuk pencarian hotel berdasarkan lokasi dan harga
CREATE INDEX idx_hotels_location ON `hotels` (`location`);
CREATE INDEX idx_hotels_price ON `hotels` (`price`);
CREATE INDEX idx_hotels_rating ON `hotels` (`rating`);

-- Index untuk pencarian booking berdasarkan user dan tanggal
CREATE INDEX idx_bookings_user_id ON `bookings` (`user_id`);
CREATE INDEX idx_bookings_hotel_id ON `bookings` (`hotel_id`);
CREATE INDEX idx_bookings_checkin_date ON `bookings` (`checkin_date`);
CREATE INDEX idx_bookings_checkout_date ON `bookings` (`checkout_date`);

-- Index untuk pencarian berdasarkan email user
CREATE INDEX idx_users_email ON `users` (`email`);

-- --------------------------------------------------------
-- SELESAI: Database siap digunakan
-- --------------------------------------------------------

-- SOJOURN DATABASE MODIFICATION SCRIPT --

-- Tahap 1: Memodifikasi tabel 'hotels'
-- Menambahkan kolom untuk bintang hotel (1-5) dan ketersediaan kamar.
-- Asumsi: Kolom 'name' dan 'price' sudah ada di tabel 'hotels'.

ALTER TABLE `hotels`
ADD COLUMN `star_rating` TINYINT(1) NOT NULL DEFAULT 3 COMMENT 'Rating bintang hotel dari 1 sampai 5' AFTER `name`,
ADD COLUMN `availability` INT NOT NULL DEFAULT 0 COMMENT 'Jumlah total kamar yang tersedia' AFTER `price`;

-- Tahap 2: Membuat tabel 'reviews' baru
-- Tabel ini akan menyimpan semua ulasan yang diberikan oleh pengguna untuk setiap hotel.

CREATE TABLE `reviews` (
       `id` INT AUTO_INCREMENT PRIMARY KEY,
       `hotel_id` INT NOT NULL,
       `user_id` INT NOT NULL,
       `rating` TINYINT NOT NULL COMMENT 'Rating dari pengguna, skala 1-10',
       `comment` TEXT,
       `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE CASCADE,
       FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tahap 3: Membuat tabel 'room_types' baru
-- Tabel ini akan menyimpan berbagai tipe kamar yang tersedia di setiap hotel.

CREATE TABLE `room_types` (
      `id` INT AUTO_INCREMENT PRIMARY KEY,
      `hotel_id` INT NOT NULL,
      `name` VARCHAR(255) NOT NULL COMMENT 'Nama tipe kamar, contoh: Deluxe, Standard, Suite',
      `price` DECIMAL(10, 2) NOT NULL COMMENT 'Harga per malam untuk tipe kamar ini',
      `availability` INT NOT NULL DEFAULT 0 COMMENT 'Jumlah kamar yang tersedia untuk tipe ini',
      `image_gallery` TEXT COMMENT 'Menyimpan URL gambar galeri, dipisahkan koma',
      FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Menghapus data ulasan lama untuk menghindari duplikasi jika skrip dijalankan ulang
DELETE FROM `reviews`;

-- Reset AUTO_INCREMENT untuk memastikan ID dimulai dari 1
ALTER TABLE `reviews` AUTO_INCREMENT = 1;

-- Mengisi tabel `reviews` dengan berbagai macam ulasan
INSERT INTO `reviews` (`hotel_id`, `user_id`, `rating`, `comment`, `created_at`) VALUES
-- Ulasan untuk The Ritz-Carlton (hotel_id = 1)
(1, 1, 10, 'Pengalaman menginap yang luar biasa! Pelayanannya sempurna, kamarnya sangat mewah dan bersih. Pemandangan dari kamar sangat menakjubkan. Pasti akan kembali lagi.', '2024-05-10 14:30:00'),
(1, 2, 8, 'Hotel yang sangat bagus di lokasi strategis. Fasilitas gym dan kolam renangnya terbaik. Makanannya enak, meskipun harganya sedikit mahal. Secara keseluruhan sangat memuaskan.', '2024-06-22 11:15:00'),
(1, 3, 9, 'Sebagai seorang pebisnis, saya sangat menghargai fasilitas business center dan kecepatan WiFi di sini. Semuanya efisien dan berkelas. Sangat direkomendasikan untuk perjalanan bisnis.', '2024-07-01 09:00:00'),

-- Ulasan untuk GH Universal Hotel (hotel_id = 2)
(2, 1, 7, 'Arsitektur hotelnya unik dan indah, serasa di Eropa. Kamarnya nyaman, tapi beberapa perabotan terlihat sedikit usang. Cocok untuk liburan keluarga dengan budget menengah.', '2024-04-15 18:45:00'),
(2, 2, 5, 'Lokasinya agak jauh dari pusat kota Bandung. Proses check-in cukup lama dan stafnya kurang ramah. Kolam renangnya juga terlalu ramai saat akhir pekan. Pengalaman yang biasa saja.', '2024-05-20 16:00:00'),

-- Ulasan untuk The Anvaya Beach Resort (hotel_id = 3)
(3, 2, 10, 'Surga di Bali! Akses langsung ke pantai, kolam renang yang luas, dan suasana resort yang sangat menenangkan. Staf sangat ramah dan membantu. Sarapan paginya sangat beragam dan lezat. Sempurna!', '2024-07-05 12:30:00'),
(3, 1, 9, 'Tempat yang sempurna untuk bersantai. Spa-nya sangat direkomendasikan. Kamar dengan pemandangan laut benar-benar sepadan dengan harganya. Sedikit ramai, tapi itu wajar untuk lokasi di Kuta.', '2024-06-18 20:10:00'),
(3, 3, 8, 'Resort yang indah dengan fasilitas lengkap. Sangat menikmati waktu di sini. Hanya saja, layanan kamar pada malam hari sedikit lambat. Selain itu, semuanya bagus.', '2024-07-11 22:05:00'),

-- Ulasan untuk Hotel Indonesia Kempinski (hotel_id = 4)
(4, 3, 10, 'Ikon kemewahan sejati di Jakarta. Semuanya terasa sempurna, dari lobi yang megah hingga kamar yang elegan. Pelayanan personal yang diberikan staf tidak ada duanya. Lokasi di Bundaran HI adalah nilai tambah yang luar biasa.', '2024-03-25 08:55:00'),
(4, 1, 9, 'Menginap di sini untuk acara kantor. Ruang meeting sangat representatif dan teknologinya canggih. Makanan saat coffee break juga sangat berkualitas. Sangat berkesan.', '2024-06-28 13:00:00'),

-- Ulasan untuk The Langham, Jakarta (hotel_id = 5)
(5, 2, 9, 'Hotel baru yang sangat mewah dengan desain interior yang menawan. Pemandangan dari rooftop bar-nya adalah yang terbaik di Jakarta. Sedikit mahal, tapi Anda mendapatkan kualitas yang sepadan.', '2024-07-02 19:20:00'),
(5, 1, 4, 'Check-in sangat lambat, menunggu hampir satu jam. AC di kamar saya juga tidak berfungsi dengan baik pada malam pertama. Untuk hotel sekelas ini, pengalaman saya di bawah ekspektasi.', '2024-07-10 15:00:00'),
(5, 3, 7, 'Secara umum hotel ini bagus. Kamarnya luas dan tempat tidurnya sangat nyaman. Namun, pilihan menu sarapannya kurang bervariasi dibandingkan hotel bintang lima lainnya.', '2024-06-12 10:00:00'),

-- Ulasan tanpa komentar
(2, 3, 6, NULL, '2024-05-30 11:00:00'),
(4, 2, 10, NULL, '2024-07-08 17:00:00');


-- Menambahkan data contoh untuk tabel room_types
-- Semua tipe kamar akan menggunakan gambar 'img/hotel_room/1.png'

-- Hotel 1
INSERT INTO `room_types` (`hotel_id`, `name`, `price`, `availability`, `image_gallery`) VALUES
(1, 'Kamar Standard', 500000.00, 10, 'img/hotel_room/1.png'),
(1, 'Kamar Deluxe', 750000.00, 8, 'img/hotel_room/1.png'),
(1, 'Suite Junior', 1200000.00, 5, 'img/hotel_room/1.png');

-- Hotel 2
INSERT INTO `room_types` (`hotel_id`, `name`, `price`, `availability`, `image_gallery`) VALUES
(2, 'Kamar Twin', 650000.00, 12, 'img/hotel_room/1.png'),
(2, 'Kamar King', 850000.00, 6, 'img/hotel_room/1.png'),
(2, 'Suite Keluarga', 1500000.00, 4, 'img/hotel_room/1.png');

-- Hotel 3
INSERT INTO `room_types` (`hotel_id`, `name`, `price`, `availability`, `image_gallery`) VALUES
(3, 'Kamar Superior', 800000.00, 15, 'img/hotel_room/1.png'),
(3, 'Kamar Deluxe Pemandangan Kota', 1100000.00, 7, 'img/hotel_room/1.png'),
(3, 'Suite Eksekutif', 1800000.00, 3, 'img/hotel_room/1.png');

-- Hotel 4
INSERT INTO `room_types` (`hotel_id`, `name`, `price`, `availability`, `image_gallery`) VALUES
(4, 'Kamar Standard Queen', 550000.00, 20, 'img/hotel_room/1.png'),
(4, 'Kamar Deluxe King', 900000.00, 10, 'img/hotel_room/1.png'),
(4, 'Suite Presidential', 2500000.00, 2, 'img/hotel_room/1.png');

-- Hotel 5
INSERT INTO `room_types` (`hotel_id`, `name`, `price`, `availability`, `image_gallery`) VALUES
(5, 'Kamar Single', 450000.00, 8, 'img/hotel_room/1.png'),
(5, 'Kamar Double', 700000.00, 12, 'img/hotel_room/1.png'),
(5, 'Kamar Keluarga', 1300000.00, 0, 'img/hotel_room/1.png');

ALTER TABLE `bookings` ADD COLUMN `status` VARCHAR(20) NOT NULL DEFAULT 'confirmed' AFTER `total_price`; 