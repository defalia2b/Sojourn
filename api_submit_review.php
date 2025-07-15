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
$data = json_decode(file_get_contents('php://input'), true);
$hotel_id = isset($data['hotel_id']) ? intval($data['hotel_id']) : 0;
$rating = isset($data['rating']) ? intval($data['rating']) : 0;
$comment = isset($data['comment']) ? trim($data['comment']) : '';

if (!$hotel_id || $rating < 1 || $rating > 10) {
    echo json_encode(['success' => false, 'message' => 'Data tidak valid']);
    exit();
}
// Cek apakah user punya booking status finished untuk hotel ini
$sql = "SELECT COUNT(*) as cnt FROM bookings WHERE user_id = ? AND hotel_id = ? AND status = 'finished'";
$stmt = $conn->prepare($sql);
$stmt->bind_param('ii', $user_id, $hotel_id);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();
if ($row['cnt'] == 0) {
    echo json_encode(['success' => false, 'message' => 'Anda hanya bisa review setelah selesai menginap di hotel ini.']);
    $stmt->close();
    $conn->close();
    exit();
}
$stmt->close();
// Cek apakah user sudah pernah review hotel ini
$cek = $conn->prepare('SELECT COUNT(*) as cnt FROM reviews WHERE hotel_id = ? AND user_id = ?');
$cek->bind_param('ii', $hotel_id, $user_id);
$cek->execute();
$cekres = $cek->get_result();
$cekrow = $cekres->fetch_assoc();
if ($cekrow['cnt'] > 0) {
    echo json_encode(['success' => false, 'message' => 'Anda sudah pernah memberi review untuk hotel ini.']);
    $cek->close();
    $conn->close();
    exit();
}
$cek->close();
// Simpan review
$insert = $conn->prepare('INSERT INTO reviews (hotel_id, user_id, rating, comment) VALUES (?, ?, ?, ?)');
$insert->bind_param('iiis', $hotel_id, $user_id, $rating, $comment);
if ($insert->execute()) {
    echo json_encode(['success' => true, 'message' => 'Review berhasil dikirim!']);
} else {
    echo json_encode(['success' => false, 'message' => 'Gagal menyimpan review.']);
}
$insert->close();
$conn->close(); 