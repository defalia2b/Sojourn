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

// Cek apakah booking milik user, status confirmed, dan checkout_date sudah lewat
$sql = "SELECT * FROM bookings WHERE id = ? AND user_id = ? AND status = 'confirmed'";
$stmt = $conn->prepare($sql);
$stmt->bind_param('si', $booking_id, $user_id);
$stmt->execute();
$result = $stmt->get_result();
if ($row = $result->fetch_assoc()) {
    $checkout_date = $row['checkout_date'];
    if (strtotime($checkout_date) > strtotime(date('Y-m-d'))) {
        echo json_encode(['success' => false, 'message' => 'Belum bisa menyelesaikan booking sebelum checkout date.']);
        $stmt->close();
        $conn->close();
        exit();
    }
    $stmt->close();
    // Update status ke finished
    $update = $conn->prepare("UPDATE bookings SET status = 'finished' WHERE id = ?");
    $update->bind_param('s', $booking_id);
    $update->execute();
    if ($update->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Booking selesai, Anda bisa memberi review.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Gagal update status booking.']);
    }
    $update->close();
    $conn->close();
    exit();
} else {
    echo json_encode(['success' => false, 'message' => 'Booking tidak ditemukan atau status tidak valid.']);
    $stmt->close();
    $conn->close();
    exit();
} 