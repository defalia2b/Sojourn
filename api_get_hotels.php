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
        $hotels[] = $row;
    }
}
echo json_encode(['success' => true, 'hotels' => $hotels]);
$stmt->close();
$conn->close(); 