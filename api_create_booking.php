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
$checkin_date = $_POST['checkin_date'] ?? '';
$checkout_date = $_POST['checkout_date'] ?? '';
$total_price = $_POST['total_price'] ?? '';
$guests = $_POST['guests'] ?? 1;
$special_requests = $_POST['special_requests'] ?? '';

if (!$user_id || !$hotel_id || !$checkin_date || !$checkout_date || !$total_price) {
    echo json_encode(['success' => false, 'message' => 'Data tidak lengkap']);
    exit();
}

// Validasi jumlah tamu
if ($guests < 1 || $guests > 6) {
    echo json_encode(['success' => false, 'message' => 'Jumlah tamu harus antara 1-6 orang']);
    exit();
}

$booking_id = 'SOJ-' . round(microtime(true) * 1000);

// Validasi tanggal check-in dan check-out
if ($checkin_date >= $checkout_date) {
    echo json_encode(['success' => false, 'message' => 'Tanggal check-out harus setelah check-in']);
    exit();
}

// Validasi tanggal check-in tidak boleh di masa lalu
$today = date('Y-m-d');
if ($checkin_date < $today) {
    echo json_encode(['success' => false, 'message' => 'Tanggal check-in tidak boleh di masa lalu']);
    exit();
}

$stmt = $conn->prepare('INSERT INTO bookings (id, user_id, hotel_id, checkin_date, checkout_date, total_price, guests, special_requests, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
$status = 'confirmed';
$stmt->bind_param('siississs', $booking_id, $user_id, $hotel_id, $checkin_date, $checkout_date, $total_price, $guests, $special_requests, $status);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true, 
        'message' => 'Booking berhasil dibuat', 
        'booking_id' => $booking_id,
        'details' => [
            'hotel_id' => $hotel_id,
            'checkin_date' => $checkin_date,
            'checkout_date' => $checkout_date,
            'guests' => $guests,
            'total_price' => $total_price,
            'special_requests' => $special_requests
        ]
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Booking gagal: ' . $conn->error]);
}

$stmt->close();
$conn->close(); 