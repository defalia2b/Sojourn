-- Script untuk memperbarui database Sojourn yang sudah ada
-- Jalankan script ini jika database sudah ada dan perlu menambahkan kolom baru

USE sojourn_db;

-- Menambahkan kolom guests dan special_requests ke tabel bookings jika belum ada
ALTER TABLE `bookings` 
ADD COLUMN IF NOT EXISTS `guests` INT NOT NULL DEFAULT 1 COMMENT 'Jumlah tamu' AFTER `total_price`,
ADD COLUMN IF NOT EXISTS `special_requests` TEXT COMMENT 'Permintaan khusus dari tamu' AFTER `guests`;

-- Memperbarui data yang sudah ada dengan nilai default
UPDATE `bookings` SET `guests` = 1 WHERE `guests` IS NULL;

-- Menambahkan index untuk optimasi query
CREATE INDEX IF NOT EXISTS idx_bookings_guests ON `bookings` (`guests`);
CREATE INDEX IF NOT EXISTS idx_bookings_special_requests ON `bookings` (`special_requests`(100));

-- Menampilkan pesan sukses
SELECT 'Database berhasil diperbarui!' as status; 