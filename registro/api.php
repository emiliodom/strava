<?php
// api.php — registro de comidas: sube foto + descripción, lista y sirve fotos. Todo con token.
// Las fotos se guardan en Cloudinary si hay credenciales (recomendado); si no, en disco local.
declare(strict_types=1);
header('X-Content-Type-Options: nosniff');
// Almacén persistente, FUERA de public_html (Hostinger borra public_html en cada deploy).
// Orden: 1) variable MISTRAVA_STORE si está definida; 2) carpeta 'mistrava-store' a la par
// de public_html (auto-detectada subiendo por el árbol); 3) __DIR__ (desarrollo local).
function mistrava_store(): string {
  $env = (string)(getenv('MISTRAVA_STORE') ?: ($_SERVER['MISTRAVA_STORE'] ?? ''));
  if ($env !== '') return rtrim($env, '/');
  $p = __DIR__;
  for ($i = 0; $i < 8; $i++) {
    if (basename($p) === 'public_html') return dirname($p) . '/mistrava-store';
    $padre = dirname($p);
    if ($padre === $p) break;            // llegamos a la raíz del sistema
    $p = $padre;
  }
  return __DIR__;                        // local: todo junto como hasta ahora
}
$store = mistrava_store();
$cfg = @include $store . '/config.php';
$token = is_array($cfg) ? (string)($cfg['token'] ?? '') : '';
$dir = $store . '/datos';
if (!is_dir($dir)) @mkdir($dir, 0775, true);
$indice = $dir . '/indice.json';

function salir(int $c, array $d): never { http_response_code($c); header('Content-Type: application/json; charset=utf-8'); echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }

/* ---------- Cloudinary (opcional) ----------
   Credenciales desde mistrava-store/.env (un KEY=VALUE por línea) o el entorno.
   El secreto se queda en el servidor: la firma de cada subida se calcula aquí. */
function env_store(string $store): array {
  $out = []; $f = $store . '/.env';
  if (is_file($f)) foreach (file($f, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $l) {
    if ($l === '' || $l[0] === '#') continue;
    if (preg_match('/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/', $l, $m)) $out[$m[1]] = trim($m[2], " \t\"'");
  }
  return $out;
}
function cloud_cfg(string $store): ?array {
  $e = env_store($store);
  $g = fn(string $k): string => (string)($e[$k] ?? (getenv($k) ?: ''));
  $cloud = $g('CLOUDINARY_CLOUD_NAME'); $key = $g('CLOUDINARY_API_KEY'); $secret = $g('CLOUDINARY_API_SECRET');
  if ($cloud === '' || $key === '' || $secret === '') return null;
  return ['cloud' => $cloud, 'key' => $key, 'secret' => $secret, 'folder' => $g('CLOUDINARY_FOLDER') ?: 'mistrava/comidas'];
}
function cloud_firma(array $params, string $secret): string {
  ksort($params);
  $pares = [];
  foreach ($params as $k => $v) { if ($v === '' || $v === null) continue; $pares[] = $k . '=' . $v; }
  return sha1(implode('&', $pares) . $secret);
}
function cloud_subir(array $cfg, string $archivo, string $id): array {
  if (!function_exists('curl_init')) throw new RuntimeException('cURL no está disponible en este PHP.');
  $firmables = ['folder' => $cfg['folder'], 'public_id' => $id, 'timestamp' => time()];
  $post = $firmables + ['api_key' => $cfg['key'], 'signature' => cloud_firma($firmables, $cfg['secret']), 'file' => new CURLFile($archivo)];
  $ch = curl_init("https://api.cloudinary.com/v1_1/{$cfg['cloud']}/image/upload");
  curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $post, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 30]);
  $resp = curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); $err = curl_error($ch); curl_close($ch);
  if ($resp === false) throw new RuntimeException('conexión: ' . $err);
  $j = json_decode((string)$resp, true);
  if ($code >= 300 || !is_array($j) || empty($j['secure_url'])) throw new RuntimeException('HTTP ' . $code . ': ' . (($j['error']['message'] ?? '') ?: substr((string)$resp, 0, 200)));
  return ['url' => (string)$j['secure_url'], 'public_id' => (string)$j['public_id']];
}
function cloud_borrar(array $cfg, string $public_id): void {
  if (!function_exists('curl_init')) return;
  $firmables = ['public_id' => $public_id, 'timestamp' => time()];
  $post = $firmables + ['api_key' => $cfg['key'], 'signature' => cloud_firma($firmables, $cfg['secret'])];
  $ch = curl_init("https://api.cloudinary.com/v1_1/{$cfg['cloud']}/image/destroy");
  curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $post, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20]);
  curl_exec($ch); curl_close($ch);
}
$cloud = cloud_cfg($store);

if ($token === '' || strlen($token) < 12) salir(500, ['error' => 'Falta registro/config.php con un token de al menos 12 caracteres.']);
$dado = $_SERVER['HTTP_X_TOKEN'] ?? ($_GET['t'] ?? '');
if (!hash_equals($token, (string)$dado)) { usleep(400000); salir(401, ['error' => 'Token incorrecto.']); }

$lista = is_file($indice) ? (json_decode((string)file_get_contents($indice), true) ?: []) : [];
$accion = $_GET['accion'] ?? 'lista';

if ($accion === 'lista') salir(200, ['entradas' => $lista]);

if ($accion === 'foto') {
  $id = preg_replace('/[^a-z0-9]/', '', (string)($_GET['id'] ?? ''));
  $e = null; foreach ($lista as $x) { if (($x['id'] ?? '') === $id) { $e = $x; break; } }
  if ($e && !empty($e['url'])) { header('Location: ' . $e['url'], true, 302); exit; }   // Cloudinary
  $f = "$dir/$id.jpg";
  if ($id === '' || !is_file($f)) salir(404, ['error' => 'No existe.']);
  header('Content-Type: image/jpeg'); header('Cache-Control: private, max-age=86400'); readfile($f); exit;
}

if ($accion === 'borrar' && $_SERVER['REQUEST_METHOD'] === 'POST') {
  $id = preg_replace('/[^a-z0-9]/', '', (string)($_POST['id'] ?? ''));
  $e = null; foreach ($lista as $x) { if (($x['id'] ?? '') === $id) { $e = $x; break; } }
  if ($e && !empty($e['public_id']) && $cloud) cloud_borrar($cloud, (string)$e['public_id']);
  @unlink("$dir/$id.jpg");
  $lista = array_values(array_filter($lista, fn($x) => ($x['id'] ?? '') !== $id));
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
  $entrada = ['id' => $id, 'fecha' => $fecha, 'hora' => $hora, 'comida' => $comida, 'desc' => $desc, 'foto' => false];
  $tiene = isset($_FILES['foto']) && $_FILES['foto']['error'] === UPLOAD_ERR_OK;
  if ($tiene) {
    if ($_FILES['foto']['size'] > 8 * 1024 * 1024) salir(400, ['error' => 'Foto de más de 8 MB.']);
    $info = @getimagesize($_FILES['foto']['tmp_name']);
    if (!$info || !in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) salir(400, ['error' => 'Sólo JPG, PNG o WebP.']);
    $entrada['foto'] = true;
    if ($cloud) {
      try { $sub = cloud_subir($cloud, $_FILES['foto']['tmp_name'], $id); }
      catch (Throwable $ex) { salir(502, ['error' => 'No se pudo subir a Cloudinary (' . $ex->getMessage() . ').']); }
      $entrada['url'] = $sub['url']; $entrada['public_id'] = $sub['public_id'];
    } elseif (!move_uploaded_file($_FILES['foto']['tmp_name'], "$dir/$id.jpg")) {
      salir(500, ['error' => 'No se pudo guardar.']);
    }
  } elseif ($desc === '') salir(400, ['error' => 'Pon una foto o una descripción.']);
  $lista[] = $entrada;
  file_put_contents($indice, json_encode($lista, JSON_UNESCAPED_UNICODE), LOCK_EX);
  salir(200, ['ok' => true, 'id' => $id, 'url' => $entrada['url'] ?? null]);
}
salir(400, ['error' => 'Acción no válida.']);
