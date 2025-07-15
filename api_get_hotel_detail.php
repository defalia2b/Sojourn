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

$hotel_id = isset($_GET['hotel_id']) ? intval($_GET['hotel_id']) : 0;
if (!$hotel_id) {
    echo json_encode(['success' => false, 'message' => 'hotel_id wajib diisi']);
    exit();
}
// Ambil data hotel
$stmt = $conn->prepare('SELECT * FROM hotels WHERE id = ?');
$stmt->bind_param('i', $hotel_id);
$stmt->execute();
$result = $stmt->get_result();
if (!$result || $result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Hotel tidak ditemukan']);
    exit();
}
$hotel = $result->fetch_assoc();
$stmt->close();
// Ambil fasilitas (array objek)
$facilities = [];
$f_sql = 'SELECT f.id, f.name FROM hotel_facilities hf JOIN facilities f ON hf.facility_id = f.id WHERE hf.hotel_id = ?';
$f_stmt = $conn->prepare($f_sql);
$f_stmt->bind_param('i', $hotel_id);
$f_stmt->execute();
$f_result = $f_stmt->get_result();
while ($f_row = $f_result->fetch_assoc()) {
    $facilities[] = $f_row;
}
$f_stmt->close();
// Ambil tipe kamar (array objek)
$room_types = [];
$r_sql = 'SELECT id, name, price, availability, image_gallery FROM room_types WHERE hotel_id = ?';
$r_stmt = $conn->prepare($r_sql);
$r_stmt->bind_param('i', $hotel_id);
$r_stmt->execute();
$r_result = $r_stmt->get_result();
while ($r_row = $r_result->fetch_assoc()) {
    $room_types[] = $r_row;
}
$r_stmt->close();
// (Opsional) Ambil rating rata-rata dan jumlah review dari reviews
$avg_rating = null;
$review_count = 0;
$review_sql = 'SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE hotel_id = ?';
$review_stmt = $conn->prepare($review_sql);
$review_stmt->bind_param('i', $hotel_id);
$review_stmt->execute();
$review_result = $review_stmt->get_result();
if ($review_row = $review_result->fetch_assoc()) {
    $avg_rating = $review_row['avg_rating'] ? round($review_row['avg_rating'], 2) : null;
    $review_count = $review_row['review_count'] ? intval($review_row['review_count']) : 0;
}
$review_stmt->close();
$hotel['facilities'] = $facilities;
$hotel['room_types'] = $room_types;
$hotel['avg_review_rating'] = $avg_rating;
$hotel['review_count'] = $review_count;
echo json_encode(['success' => true, 'hotel' => $hotel]);
$conn->close(); 