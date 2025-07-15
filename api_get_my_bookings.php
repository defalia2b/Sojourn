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

$sql = "SELECT b.*, h.name AS hotel_name, h.image AS hotel_image, h.location AS hotel_location, h.star_rating FROM bookings b JOIN hotels h ON b.hotel_id = h.id WHERE b.user_id = ? ORDER BY b.booking_date DESC";

$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $user_id);
$stmt->execute();
$result = $stmt->get_result();

$bookings = [];
while ($row = $result->fetch_assoc()) {
    // Hitung jumlah malam
    $checkin = new DateTime($row['checkin_date']);
    $checkout = new DateTime($row['checkout_date']);
    $nights = $checkin->diff($checkout)->days;
    
    // Format status untuk tampilan
    $status_display = '';
    $status_color = '';
    switch($row['status']) {
        case 'confirmed':
            $status_display = 'Dikonfirmasi';
            $status_color = 'green';
            break;
        case 'cancelled':
            $status_display = 'Dibatalkan';
            $status_color = 'red';
            break;
        case 'finished':
            $status_display = 'Selesai';
            $status_color = 'blue';
            break;
        default:
            $status_display = 'Dikonfirmasi';
            $status_color = 'green';
    }
    
    $bookings[] = [
        'id' => $row['id'],
        'hotel_id' => $row['hotel_id'],
        'hotel_name' => $row['hotel_name'],
        'hotel_image' => $row['hotel_image'],
        'hotel_location' => $row['hotel_location'],
        'star_rating' => $row['star_rating'],
        'guests' => isset($row['guests']) ? $row['guests'] : 1,
        'special_requests' => isset($row['special_requests']) ? $row['special_requests'] : '',
        'check_in' => $row['checkin_date'],
        'check_out' => $row['checkout_date'],
        'nights' => $nights,
        'total_price' => $row['total_price'],
        'status' => $row['status'],
        'status_display' => $status_display,
        'status_color' => $status_color,
        'booking_date' => $row['booking_date']
    ];
}

$stmt->close();
$conn->close();

echo json_encode(['success' => true, 'bookings' => $bookings]); 