-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 16, 2025 at 08:48 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sojourn_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` varchar(50) NOT NULL,
  `user_id` int(11) NOT NULL,
  `hotel_id` int(11) NOT NULL,
  `checkin_date` date NOT NULL,
  `checkout_date` date NOT NULL,
  `total_price` int(11) NOT NULL,
  `guests` int(11) NOT NULL DEFAULT 1 COMMENT 'Jumlah tamu',
  `special_requests` text DEFAULT NULL COMMENT 'Permintaan khusus dari tamu',
  `status` enum('confirmed','cancelled','finished') NOT NULL DEFAULT 'confirmed',
  `booking_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `user_id`, `hotel_id`, `checkin_date`, `checkout_date`, `total_price`, `guests`, `special_requests`, `status`, `booking_date`) VALUES
('SOJ-1752600138432', 1, 2, '2025-07-16', '2025-07-18', 2640000, 1, NULL, 'confirmed', '2025-07-15 17:22:18'),
('SOJ-1752614796255', 1, 1, '2025-07-16', '2025-07-17', 2750000, 1, NULL, 'confirmed', '2025-07-15 21:26:36'),
('SOJ-1752614879347', 1, 2, '2025-07-16', '2025-07-17', 1320000, 1, NULL, 'cancelled', '2025-07-15 21:27:59'),
('SOJ-1752616252037', 1, 3, '2025-07-16', '2025-07-19', 3630000, 1, NULL, 'cancelled', '2025-07-15 21:50:52'),
('SOJ-1752623999225', 1, 1, '2025-07-18', '2025-07-19', 825000, 1, '', 'cancelled', '2025-07-15 23:59:59'),
('SOJ-1752624566516', 1, 1, '2025-07-16', '2025-07-17', 550000, 1, '', 'cancelled', '2025-07-16 00:09:26');

-- --------------------------------------------------------

--
-- Table structure for table `facilities`
--

CREATE TABLE `facilities` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `facilities`
--

INSERT INTO `facilities` (`id`, `name`) VALUES
(9, 'AC'),
(14, 'Airport Shuttle'),
(6, 'Bar'),
(12, 'Business Center'),
(15, 'Concierge Service'),
(2, 'Kolam Renang'),
(11, 'Laundry'),
(13, 'Meeting Room'),
(8, 'Parkir Gratis'),
(3, 'Pusat Kebugaran'),
(5, 'Restaurant'),
(7, 'Room Service 24 Jam'),
(4, 'Spa & Wellness'),
(10, 'TV Kabel'),
(1, 'WiFi Gratis');

-- --------------------------------------------------------

--
-- Table structure for table `hotels`
--

CREATE TABLE `hotels` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `star_rating` tinyint(1) NOT NULL DEFAULT 3 COMMENT 'Rating bintang hotel dari 1 sampai 5',
  `location` varchar(255) DEFAULT NULL,
  `price` int(11) DEFAULT NULL,
  `availability` int(11) NOT NULL DEFAULT 0 COMMENT 'Jumlah total kamar yang tersedia',
  `rating` decimal(2,1) DEFAULT NULL,
  `image` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hotels`
--

INSERT INTO `hotels` (`id`, `name`, `star_rating`, `location`, `price`, `availability`, `rating`, `image`, `description`, `latitude`, `longitude`) VALUES
(1, 'The Ritz-Carlton', 3, 'Jakarta', 2500000, 0, 4.9, 'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1925&auto=format&fit=crop', 'Nikmati kemewahan tak tertandingi di jantung kota Jakarta. The Ritz-Carlton menawarkan layanan bintang lima dengan pemandangan kota yang memukau dan fasilitas kelas dunia.', -6.20880000, 106.84560000),
(2, 'GH Universal Hotel', 3, 'Bandung', 1200000, 0, 4.8, 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=2070&auto=format&fit=crop', 'Dengan arsitektur bergaya Eropa klasik, GH Universal Hotel memberikan pengalaman menginap yang unik di kota Bandung. Cocok untuk liburan keluarga dan perjalanan bisnis.', -6.91750000, 107.61910000),
(3, 'The Anvaya Beach Resort', 3, 'Bali', 1800000, 0, 4.9, 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=2070&auto=format&fit=crop', 'Terletak di tepi pantai Kuta yang ikonik, The Anvaya Beach Resort adalah surga tropis yang sempurna untuk relaksasi dan menikmati keindahan matahari terbenam Bali.', -8.71930000, 115.16850000),
(4, 'Hotel Indonesia Kempinski', 3, 'Jakarta', 3250000, 0, 5.0, 'img/hotels/kempinski.png', 'Sebagai landmark bersejarah Jakarta, hotel ini menawarkan kemewahan modern yang berpadu dengan pesona klasik Indonesia, terletak strategis di Bundaran HI.', -6.20880000, 106.84560000),
(5, 'The Langham, Jakarta', 3, 'Jakarta', 4100000, 0, 4.9, 'img/hotels/langham.jpg', 'Menawarkan pemandangan kota yang spektakuler dari kamar-kamar mewahnya, The Langham adalah ikon baru kemewahan di distrik bisnis Sudirman.', -6.20880000, 106.84560000);

-- --------------------------------------------------------

--
-- Table structure for table `hotel_facilities`
--

CREATE TABLE `hotel_facilities` (
  `hotel_id` int(11) NOT NULL,
  `facility_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hotel_facilities`
--

INSERT INTO `hotel_facilities` (`hotel_id`, `facility_id`) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5),
(1, 6),
(1, 7),
(1, 9),
(1, 10),
(1, 11),
(1, 12),
(1, 13),
(1, 14),
(1, 15),
(2, 1),
(2, 2),
(2, 3),
(2, 5),
(2, 7),
(2, 8),
(2, 9),
(2, 10),
(2, 11),
(2, 12),
(3, 1),
(3, 2),
(3, 3),
(3, 4),
(3, 5),
(3, 6),
(3, 7),
(3, 8),
(3, 9),
(3, 10),
(3, 11),
(3, 14),
(4, 1),
(4, 2),
(4, 3),
(4, 4),
(4, 5),
(4, 6),
(4, 7),
(4, 9),
(4, 10),
(4, 11),
(4, 12),
(4, 13),
(4, 14),
(4, 15),
(5, 1),
(5, 2),
(5, 3),
(5, 4),
(5, 5),
(5, 6),
(5, 7),
(5, 9),
(5, 10),
(5, 11),
(5, 12),
(5, 13),
(5, 14),
(5, 15);

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `hotel_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `rating` tinyint(4) NOT NULL COMMENT 'Rating dari pengguna, skala 1-10',
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`id`, `hotel_id`, `user_id`, `rating`, `comment`, `created_at`) VALUES
(1, 1, 1, 10, 'Pengalaman menginap yang luar biasa! Pelayanannya sempurna, kamarnya sangat mewah dan bersih. Pemandangan dari kamar sangat menakjubkan. Pasti akan kembali lagi.', '2024-05-10 07:30:00'),
(2, 1, 2, 8, 'Hotel yang sangat bagus di lokasi strategis. Fasilitas gym dan kolam renangnya terbaik. Makanannya enak, meskipun harganya sedikit mahal. Secara keseluruhan sangat memuaskan.', '2024-06-22 04:15:00'),
(3, 1, 3, 9, 'Sebagai seorang pebisnis, saya sangat menghargai fasilitas business center dan kecepatan WiFi di sini. Semuanya efisien dan berkelas. Sangat direkomendasikan untuk perjalanan bisnis.', '2024-07-01 02:00:00'),
(4, 2, 1, 7, 'Arsitektur hotelnya unik dan indah, serasa di Eropa. Kamarnya nyaman, tapi beberapa perabotan terlihat sedikit usang. Cocok untuk liburan keluarga dengan budget menengah.', '2024-04-15 11:45:00'),
(5, 2, 2, 5, 'Lokasinya agak jauh dari pusat kota Bandung. Proses check-in cukup lama dan stafnya kurang ramah. Kolam renangnya juga terlalu ramai saat akhir pekan. Pengalaman yang biasa saja.', '2024-05-20 09:00:00'),
(6, 3, 2, 10, 'Surga di Bali! Akses langsung ke pantai, kolam renang yang luas, dan suasana resort yang sangat menenangkan. Staf sangat ramah dan membantu. Sarapan paginya sangat beragam dan lezat. Sempurna!', '2024-07-05 05:30:00'),
(7, 3, 1, 9, 'Tempat yang sempurna untuk bersantai. Spa-nya sangat direkomendasikan. Kamar dengan pemandangan laut benar-benar sepadan dengan harganya. Sedikit ramai, tapi itu wajar untuk lokasi di Kuta.', '2024-06-18 13:10:00'),
(8, 3, 3, 8, 'Resort yang indah dengan fasilitas lengkap. Sangat menikmati waktu di sini. Hanya saja, layanan kamar pada malam hari sedikit lambat. Selain itu, semuanya bagus.', '2024-07-11 15:05:00'),
(9, 4, 3, 10, 'Ikon kemewahan sejati di Jakarta. Semuanya terasa sempurna, dari lobi yang megah hingga kamar yang elegan. Pelayanan personal yang diberikan staf tidak ada duanya. Lokasi di Bundaran HI adalah nilai tambah yang luar biasa.', '2024-03-25 01:55:00'),
(10, 4, 1, 9, 'Menginap di sini untuk acara kantor. Ruang meeting sangat representatif dan teknologinya canggih. Makanan saat coffee break juga sangat berkualitas. Sangat berkesan.', '2024-06-28 06:00:00'),
(11, 5, 2, 9, 'Hotel baru yang sangat mewah dengan desain interior yang menawan. Pemandangan dari rooftop bar-nya adalah yang terbaik di Jakarta. Sedikit mahal, tapi Anda mendapatkan kualitas yang sepadan.', '2024-07-02 12:20:00'),
(12, 5, 1, 4, 'Check-in sangat lambat, menunggu hampir satu jam. AC di kamar saya juga tidak berfungsi dengan baik pada malam pertama. Untuk hotel sekelas ini, pengalaman saya di bawah ekspektasi.', '2024-07-10 08:00:00'),
(13, 5, 3, 7, 'Secara umum hotel ini bagus. Kamarnya luas dan tempat tidurnya sangat nyaman. Namun, pilihan menu sarapannya kurang bervariasi dibandingkan hotel bintang lima lainnya.', '2024-06-12 03:00:00'),
(14, 2, 3, 6, NULL, '2024-05-30 04:00:00'),
(15, 4, 2, 10, NULL, '2024-07-08 10:00:00'),
(16, 2, 1, 10, 'temboknya tipis', '2025-07-15 22:47:58');

-- --------------------------------------------------------

--
-- Table structure for table `room_types`
--

CREATE TABLE `room_types` (
  `id` int(11) NOT NULL,
  `hotel_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL COMMENT 'Nama tipe kamar, contoh: Deluxe, Standard, Suite',
  `price` decimal(10,2) NOT NULL COMMENT 'Harga per malam untuk tipe kamar ini',
  `availability` int(11) NOT NULL DEFAULT 0 COMMENT 'Jumlah kamar yang tersedia untuk tipe ini',
  `image_gallery` text DEFAULT NULL COMMENT 'Menyimpan URL gambar galeri, dipisahkan koma'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `room_types`
--

INSERT INTO `room_types` (`id`, `hotel_id`, `name`, `price`, `availability`, `image_gallery`) VALUES
(1, 1, 'Kamar Standard', 500000.00, 10, 'img/hotel_room/1.png'),
(2, 1, 'Kamar Deluxe', 750000.00, 8, 'img/hotel_room/1.png'),
(3, 1, 'Suite Junior', 1200000.00, 5, 'img/hotel_room/1.png'),
(4, 2, 'Kamar Twin', 650000.00, 12, 'img/hotel_room/1.png'),
(5, 2, 'Kamar King', 850000.00, 6, 'img/hotel_room/1.png'),
(6, 2, 'Suite Keluarga', 1500000.00, 4, 'img/hotel_room/1.png'),
(7, 3, 'Kamar Superior', 800000.00, 15, 'img/hotel_room/1.png'),
(8, 3, 'Kamar Deluxe Pemandangan Kota', 1100000.00, 7, 'img/hotel_room/1.png'),
(9, 3, 'Suite Eksekutif', 1800000.00, 3, 'img/hotel_room/1.png'),
(10, 4, 'Kamar Standard Queen', 550000.00, 20, 'img/hotel_room/1.png'),
(11, 4, 'Kamar Deluxe King', 900000.00, 10, 'img/hotel_room/1.png'),
(12, 4, 'Suite Presidential', 2500000.00, 2, 'img/hotel_room/1.png'),
(13, 5, 'Kamar Single', 450000.00, 8, 'img/hotel_room/1.png'),
(14, 5, 'Kamar Double', 700000.00, 12, 'img/hotel_room/1.png'),
(15, 5, 'Kamar Keluarga', 1300000.00, 0, 'img/hotel_room/1.png');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `created_at`) VALUES
(1, 'John Doe', 'john@example.com', '123', '2025-07-15 16:24:31'),
(2, 'Jane Smith', 'jane@example.com', '123', '2025-07-15 16:24:31'),
(3, 'Admin User', 'admin@sojourn.com', '123', '2025-07-15 16:24:31');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_bookings_user_id` (`user_id`),
  ADD KEY `idx_bookings_hotel_id` (`hotel_id`),
  ADD KEY `idx_bookings_checkin_date` (`checkin_date`),
  ADD KEY `idx_bookings_checkout_date` (`checkout_date`),
  ADD KEY `idx_bookings_guests` (`guests`),
  ADD KEY `idx_bookings_special_requests` (`special_requests`(100));

--
-- Indexes for table `facilities`
--
ALTER TABLE `facilities`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `hotels`
--
ALTER TABLE `hotels`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_hotels_location` (`location`),
  ADD KEY `idx_hotels_price` (`price`),
  ADD KEY `idx_hotels_rating` (`rating`);

--
-- Indexes for table `hotel_facilities`
--
ALTER TABLE `hotel_facilities`
  ADD PRIMARY KEY (`hotel_id`,`facility_id`),
  ADD KEY `facility_id` (`facility_id`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hotel_id` (`hotel_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `room_types`
--
ALTER TABLE `room_types`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hotel_id` (`hotel_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `facilities`
--
ALTER TABLE `facilities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `hotels`
--
ALTER TABLE `hotels`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `room_types`
--
ALTER TABLE `room_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `hotel_facilities`
--
ALTER TABLE `hotel_facilities`
  ADD CONSTRAINT `hotel_facilities_ibfk_1` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `hotel_facilities_ibfk_2` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `room_types`
--
ALTER TABLE `room_types`
  ADD CONSTRAINT `room_types_ibfk_1` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
