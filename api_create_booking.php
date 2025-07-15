<?php
header('Content-Type: application/json');

$host = 'localhost';
$user = 'root';
$pass = '';
$db = 'sojourn_db';
$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Koneksi database gagal']);
    exit();
}

$user_id = $_POST['user_id'] ?? '';
$hotel_id = $_POST['hotel_id'] ?? '';
$checkin_date = $_POST['check_in_date'] ?? '';
$checkout_date = $_POST['check_out_date'] ?? '';
$total_price = $_POST['total_price'] ?? '';

if (!$user_id || !$hotel_id || !$checkin_date || !$checkout_date || !$total_price) {
    echo json_encode(['success' => false, 'message' => 'Data tidak lengkap']);
    exit();
}

$booking_id = 'SOJ-' . round(microtime(true) * 1000);
// Validasi tanggal check-in dan check-out
if ($checkin_date >= $checkout_date) {
    echo json_encode(['success' => false, 'message' => 'Tanggal check-out harus setelah check-in']);
    exit();
}
$stmt = $conn->prepare('INSERT INTO bookings (id, user_id, hotel_id, checkin_date, checkout_date, total_price, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
$status = 'confirmed';
$stmt->bind_param('siissis', $booking_id, $user_id, $hotel_id, $checkin_date, $checkout_date, $total_price, $status);
if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Booking berhasil', 'booking_id' => $booking_id]);
} else {
    echo json_encode(['success' => false, 'message' => 'Booking gagal: ' . $conn->error]);
}
$stmt->close();
$conn->close(); 