<?php
header('Content-Type: application/json');

// Koneksi ke database
$host = 'localhost';
$user = 'root';
$pass = '';
$db = 'sojourn_db';
$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Koneksi database gagal']);
    exit();
}

// Ambil data dari POST
$name = $_POST['name'] ?? '';
$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';

if (!$name || !$email || !$password) {
    echo json_encode(['success' => false, 'message' => 'Data tidak lengkap']);
    exit();
}

// Simpan ke database
$stmt = $conn->prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
$stmt->bind_param('sss', $name, $email, $password);
if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Registrasi berhasil']);
} else {
    echo json_encode(['success' => false, 'message' => 'Registrasi gagal: ' . $conn->error]);
}
$stmt->close();
$conn->close(); 