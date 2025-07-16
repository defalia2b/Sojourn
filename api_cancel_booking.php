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
    exit();
}

$user_id = $_SESSION['user_id'];

// Ambil booking_id dari POST (support JSON and form)
$data = json_decode(file_get_contents('php://input'), true);
if ($data && isset($data['booking_id'])) {
    $booking_id = $data['booking_id'];
} else {
    $booking_id = isset($_POST['booking_id']) ? $_POST['booking_id'] : '';
}
$booking_id = trim($booking_id);
if (!$booking_id) {
    echo json_encode(['success' => false, 'message' => 'Booking ID tidak valid']);
    exit();
}

// Update status booking menjadi 'cancelled' jika milik user dan masih confirmed
$sql = "UPDATE bookings SET status = 'cancelled' WHERE id = ? AND user_id = ? AND status = 'confirmed'";
$stmt = $conn->prepare($sql);
$stmt->bind_param('si', $booking_id, $user_id);
$stmt->execute();

// Log for debugging
error_log("Cancel booking attempt - Booking ID: $booking_id, User ID: $user_id, Affected rows: " . $stmt->affected_rows);

if ($stmt->affected_rows > 0) {
    echo json_encode(['success' => true, 'message' => 'Pemesanan berhasil dibatalkan']);
} else {
    // Check if booking exists and get more details for debugging
    $check_sql = "SELECT id, user_id, status FROM bookings WHERE id = ?";
    $check_stmt = $conn->prepare($check_sql);
    $check_stmt->bind_param('s', $booking_id);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();
    
    if ($check_result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Pemesanan tidak ditemukan']);
    } else {
        $booking = $check_result->fetch_assoc();
        if ($booking['user_id'] != $user_id) {
            echo json_encode(['success' => false, 'message' => 'Pemesanan bukan milik Anda']);
        } else if ($booking['status'] !== 'confirmed') {
            echo json_encode(['success' => false, 'message' => 'Pemesanan sudah tidak aktif (status: ' . $booking['status'] . ')']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Gagal membatalkan pemesanan. Pastikan pemesanan milik Anda dan masih aktif.']);
        }
    }
    $check_stmt->close();
}

$stmt->close();
$conn->close(); 