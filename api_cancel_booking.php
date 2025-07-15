<?php
session_start();
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

// Cek apakah user sudah login
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$user_id = $_SESSION['user_id'];

// Ambil booking_id dari POST
$data = json_decode(file_get_contents('php://input'), true);
$booking_id = isset($data['booking_id']) ? intval($data['booking_id']) : 0;

if (!$booking_id) {
    echo json_encode(['success' => false, 'message' => 'Booking ID tidak valid']);
    exit;
}

// Update status booking menjadi 'cancelled' jika milik user dan masih confirmed
$sql = "UPDATE bookings SET status = 'cancelled' WHERE id = ? AND user_id = ? AND status = 'confirmed'";
$stmt = $conn->prepare($sql);
$stmt->bind_param('ii', $booking_id, $user_id);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    echo json_encode(['success' => true, 'message' => 'Pemesanan berhasil dibatalkan']);
} else {
    echo json_encode(['success' => false, 'message' => 'Gagal membatalkan pemesanan. Pastikan pemesanan milik Anda dan masih aktif.']);
}

$stmt->close();
$conn->close(); 