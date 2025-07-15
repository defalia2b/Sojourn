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

$sql = 'SELECT * FROM hotels';
$result = $conn->query($sql);
$hotels = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $hotels[] = $row;
    }
}
echo json_encode(['success' => true, 'hotels' => $hotels]);
$conn->close(); 