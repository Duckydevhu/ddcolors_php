<?php
header('Content-Type: application/json');


if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['error' => 'Nincs fájl feltöltve!']);
    exit;
}

$file = $_FILES['image']['tmp_name'];
$mime = mime_content_type($file);


if ($mime === 'image/jpeg') {
    $img = imagecreatefromjpeg($file);
} elseif ($mime === 'image/png') {
    $img = imagecreatefrompng($file);
} elseif ($mime === 'image/webp') {
    $img = imagecreatefromwebp($file);
} else {
    echo json_encode(['error' => 'Csak JPG, PNG és WEBP támogatott!']);
    exit;
}

$thumbSize = 30;
$thumb = imagecreatetruecolor($thumbSize, $thumbSize);
imagecopyresampled($thumb, $img, 0, 0, 0, 0, $thumbSize, $thumbSize, imagesx($img), imagesy($img));


$colors = [];
for ($x = 0; $x < $thumbSize; $x++) {
    for ($y = 0; $y < $thumbSize; $y++) {
        $rgb = imagecolorat($thumb, $x, $y);
        $r = ($rgb >> 16) & 0xFF;
        $g = ($rgb >> 8) & 0xFF;
        $b = $rgb & 0xFF;
        
        
        $hex = sprintf("#%02x%02x%02x", $r, $g, $b);
        
        if (isset($colors[$hex])) {
            $colors[$hex]++;
        } else {
            $colors[$hex] = 1;
        }
    }
}


arsort($colors);


function colorDistance($hex1, $hex2) {
    $r1 = hexdec(substr($hex1, 1, 2)); $g1 = hexdec(substr($hex1, 3, 2)); $b1 = hexdec(substr($hex1, 5, 2));
    $r2 = hexdec(substr($hex2, 1, 2)); $g2 = hexdec(substr($hex2, 3, 2)); $b2 = hexdec(substr($hex2, 5, 2));
    
    return sqrt(pow($r1-$r2, 2) + pow($g1-$g2, 2) + pow($b1-$b2, 2));
}

$finalPalette = [];
foreach ($colors as $hex => $count) {
    $isUnique = true;
    foreach ($finalPalette as $existingHex) {
        if (colorDistance($hex, $existingHex) < 40) { 
            $isUnique = false;
            break;
        }
    }
    if ($isUnique) {
        $finalPalette[] = $hex;
    }
    if (count($finalPalette) >= 32) break; 
}


imagedestroy($img);
imagedestroy($thumb);


echo json_encode(['palette' => $finalPalette]);
?>