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
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
$hotel_id = isset($_GET['hotel_id']) ? intval($_GET['hotel_id']) : 0;
if ($user_id) {
    $sql = 'SELECT r.id, r.user_id, r.hotel_id, u.name as user_name, r.rating, r.comment, r.created_at FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.user_id = ? ORDER BY r.created_at DESC';
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $user_id);
} else if ($hotel_id) {
    $sql = 'SELECT r.id, r.user_id, r.hotel_id, u.name as user_name, r.rating, r.comment, r.created_at FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.hotel_id = ? ORDER BY r.created_at DESC';
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $hotel_id);
} else {
    echo json_encode(['success' => false, 'message' => 'hotel_id atau user_id wajib diisi']);
    exit();
}
$stmt->execute();
$result = $stmt->get_result();
$reviews = [];
while ($row = $result->fetch_assoc()) {
    $reviews[] = $row;
}
$stmt->close();
$conn->close();
echo json_encode(['success' => true, 'reviews' => $reviews]); 