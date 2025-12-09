<?php
// api-proxy.php

// 1. Configuración de seguridad (Opcional pero recomendado)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// 2. Define tu Clave de API de GNews (¡oculta del frontend!)
// IMPORTANTE: NO uses la clave de GNews en el .env de React, úsala aquí.
$gnews_api_key = "3cfd08bc2fdcf982ec047ca6d998187a";

// 3. Obtener la consulta del cliente React (ej: "q=tecnologia")
$query = isset($_GET['q']) ? $_GET['q'] : 'global'; // Usa 'global' como valor por defecto

// 4. Construir la URL completa de GNews
$gnews_url = "https://gnews.io/api/v4/search?q=" . urlencode($query) . "&token=" . $gnews_api_key;

// 5. Realizar la solicitud de servidor a servidor (Usando cURL, muy común en PHP)
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $gnews_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// 6. Devolver la respuesta al cliente React
http_response_code($http_code);
echo $response;

?>