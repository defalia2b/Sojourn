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

// Ambil parameter filter & sorting
$min_price = isset($_GET['min_price']) ? intval($_GET['min_price']) : 0;
$max_price = isset($_GET['max_price']) ? intval($_GET['max_price']) : 100000000;
$star_rating = isset($_GET['star_rating']) ? intval($_GET['star_rating']) : 0;
$sort = isset($_GET['sort']) ? $_GET['sort'] : '';
$facility = isset($_GET['facility']) ? $_GET['facility'] : '';

// Query dasar
$sql = "SELECT h.*, h.star_rating, h.availability FROM hotels h WHERE h.price >= ? AND h.price <= ?";
$params = [$min_price, $max_price];
$types = 'ii';

if ($star_rating > 0) {
    $sql .= " AND h.star_rating = ?";
    $params[] = $star_rating;
    $types .= 'i';
}

// Sorting
if ($sort === 'price_asc') {
    $sql .= " ORDER BY h.price ASC";
} elseif ($sort === 'price_desc') {
    $sql .= " ORDER BY h.price DESC";
} elseif ($sort === 'rating_desc') {
    $sql .= " ORDER BY h.rating DESC";
} elseif ($sort === 'star_desc') {
    $sql .= " ORDER BY h.star_rating DESC";
} else {
    $sql .= " ORDER BY h.id ASC";
}

$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$result = $stmt->get_result();
$hotels = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        // Ambil fasilitas (array nama)
        $facilities = [];
        $hotel_id = $row['id'];
        $f_sql = "SELECT f.name FROM hotel_facilities hf JOIN facilities f ON hf.facility_id = f.id WHERE hf.hotel_id = ?";
        $f_stmt = $conn->prepare($f_sql);
        $f_stmt->bind_param('i', $hotel_id);
        $f_stmt->execute();
        $f_result = $f_stmt->get_result();
        while ($f_row = $f_result->fetch_assoc()) {
            $facilities[] = $f_row['name'];
        }
        $f_stmt->close();
        // Filter by facility if needed
        if ($facility && !in_array($facility, $facilities)) {
            continue;
        }
        $row['facilities'] = $facilities;
        // Ambil room_types (array objek)
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
        $row['room_types'] = $room_types;
        // Ambil rata-rata rating review dan jumlah review
        $review_sql = "SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE hotel_id = ?";
        $review_stmt = $conn->prepare($review_sql);
        $review_stmt->bind_param('i', $hotel_id);
        $review_stmt->execute();
        $review_result = $review_stmt->get_result();
        $review_data = $review_result->fetch_assoc();
        $row['avg_review_rating'] = $review_data['avg_rating'] ? round($review_data['avg_rating'], 1) : null;
        $row['review_count'] = $review_data['review_count'] ? intval($review_data['review_count']) : 0;
        $review_stmt->close();
        $hotels[] = $row;
    }
}
echo json_encode(['success' => true, 'hotels' => $hotels]);
$stmt->close();
$conn->close(); 