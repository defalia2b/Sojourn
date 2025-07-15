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

$sql = "SELECT b.*, h.name AS hotel_name, h.image AS hotel_image, h.location AS hotel_location FROM bookings b JOIN hotels h ON b.hotel_id = h.id WHERE b.user_id = ? ORDER BY b.checkin_date DESC";

$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $user_id);
$stmt->execute();
$result = $stmt->get_result();

$bookings = [];
while ($row = $result->fetch_assoc()) {
    $bookings[] = [
        'id' => $row['id'],
        'hotel_id' => $row['hotel_id'],
        'hotel_name' => $row['hotel_name'],
        'hotel_image' => $row['hotel_image'],
        'hotel_location' => $row['hotel_location'],
        'room_type' => isset($row['room_type']) ? $row['room_type'] : '-',
        'guests' => isset($row['guests']) ? $row['guests'] : 1,
        'check_in' => $row['checkin_date'],
        'check_out' => $row['checkout_date'],
        'total_price' => $row['total_price'],
        'status' => isset($row['status']) ? $row['status'] : 'confirmed',
    ];
}

$stmt->close();
$conn->close();

echo json_encode(['success' => true, 'bookings' => $bookings]); 