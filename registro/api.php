<?php
// api.php — registro de comidas: sube foto + descripción, lista y sirve fotos. Todo con token.
declare(strict_types=1);
header('X-Content-Type-Options: nosniff');
$cfg = @include __DIR__ . '/config.php';
$token = is_array($cfg) ? (string)($cfg['token'] ?? '') : '';
$dir = __DIR__ . '/datos';
$indice = $dir . '/indice.json';

function salir(int $c, array $d): never { http_response_code($c); header('Content-Type: application/json; charset=utf-8'); echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }

if ($token === '' || strlen($token) < 12) salir(500, ['error' => 'Falta registro/config.php con un token de al menos 12 caracteres.']);
$dado = $_SERVER['HTTP_X_TOKEN'] ?? ($_GET['t'] ?? '');
if (!hash_equals($token, (string)$dado)) { usleep(400000); salir(401, ['error' => 'Token incorrecto.']); }

$lista = is_file($indice) ? (json_decode((string)file_get_contents($indice), true) ?: []) : [];
$accion = $_GET['accion'] ?? 'lista';

if ($accion === 'lista') salir(200, ['entradas' => $lista]);

if ($accion === 'foto') {
  $id = preg_replace('/[^a-z0-9]/', '', (string)($_GET['id'] ?? ''));
  $f = "$dir/$id.jpg";
  if ($id === '' || !is_file($f)) salir(404, ['error' => 'No existe.']);
  header('Content-Type: image/jpeg'); header('Cache-Control: private, max-age=86400'); readfile($f); exit;
}

if ($accion === 'borrar' && $_SERVER['REQUEST_METHOD'] === 'POST') {
  $id = preg_replace('/[^a-z0-9]/', '', (string)($_POST['id'] ?? ''));
  $lista = array_values(array_filter($lista, fn($e) => $e['id'] !== $id));
  @unlink("$dir/$id.jpg");
  file_put_contents($indice, json_encode($lista, JSON_UNESCAPED_UNICODE), LOCK_EX);
  salir(200, ['ok' => true]);
}

if ($accion === 'subir' && $_SERVER['REQUEST_METHOD'] === 'POST') {
  $desc = trim((string)($_POST['desc'] ?? ''));
  $comida = in_array($_POST['comida'] ?? '', ['desayuno', 'almuerzo', 'cena', 'merienda', 'antes-entreno', 'despues-entreno', 'bebida'], true) ? $_POST['comida'] : 'comida';
  $fecha = preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)($_POST['fecha'] ?? '')) ? $_POST['fecha'] : date('Y-m-d');
  $hora = preg_match('/^\d{2}:\d{2}$/', (string)($_POST['hora'] ?? '')) ? $_POST['hora'] : date('H:i');
  if (mb_strlen($desc) > 500) salir(400, ['error' => 'Descripción demasiado larga (500 máx.).']);
  $id = date('YmdHis') . bin2hex(random_bytes(3));
  $tiene = isset($_FILES['foto']) && $_FILES['foto']['error'] === UPLOAD_ERR_OK;
  if ($tiene) {
    if ($_FILES['foto']['size'] > 8 * 1024 * 1024) salir(400, ['error' => 'Foto de más de 8 MB.']);
    $info = @getimagesize($_FILES['foto']['tmp_name']);
    if (!$info || !in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) salir(400, ['error' => 'Sólo JPG, PNG o WebP.']);
    if (!move_uploaded_file($_FILES['foto']['tmp_name'], "$dir/$id.jpg")) salir(500, ['error' => 'No se pudo guardar.']);
  } elseif ($desc === '') salir(400, ['error' => 'Pon una foto o una descripción.']);
  $lista[] = ['id' => $id, 'fecha' => $fecha, 'hora' => $hora, 'comida' => $comida, 'desc' => $desc, 'foto' => $tiene];
  file_put_contents($indice, json_encode($lista, JSON_UNESCAPED_UNICODE), LOCK_EX);
  salir(200, ['ok' => true, 'id' => $id]);
}
salir(400, ['error' => 'Acción no válida.']);
