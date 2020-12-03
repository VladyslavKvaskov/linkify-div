<?php
  ini_set('display_errors', 1);
  ini_set('display_startup_errors', 1);
  error_reporting(E_ALL);
  $json = [];

  header("Access-Control-Allow-Origin: *");
  header('Content-Type: application/json');

  if(!empty($_REQUEST['links']) && isset($_REQUEST['links'])){
    $urls = json_decode($_REQUEST['links']);
    $arrContextOptions=array(
      'ssl'=>array(
          'verify_peer'=>false,
          'verify_peer_name'=>false,

      ),
      'http'=>array(
        'header' => "Accept-language: en\r\n" . "User-Agent: {$_SERVER["HTTP_USER_AGENT"]}\r\n"
      ),
    );

    for($i = 0; $i < count($urls); $i++){
      $obj['favicon'] = null;
      $obj['title'] = null;
      $obj['description'] = null;
      $obj['host'] = null;
      $obj['original_url'] = $urls[$i];
      $obj['not_found'] = false;

      [$url,] = explode('?', $urls[$i]);
      $url = $url[strlen($url) - 1] !== '/' ? $url . '/' : $url;
      $url_info = parse_url($url);
      $obj['host'] = $url_info['host'];

      $favicon = @file_get_contents($url . 'favicon.ico', false, stream_context_create($arrContextOptions));
      if(!empty($favicon)){
        $obj['favicon'] = $url . 'favicon.ico';
      }

      $html = @file_get_contents($url, false, stream_context_create($arrContextOptions));

      if(!empty($html)){
        if(empty($favicon)){
          $gicon = @file_get_contents('https://www.google.com/s2/favicons?domain=' . $url, false, stream_context_create($arrContextOptions));
          $obj['favicon'] = 'https://www.google.com/s2/favicons?domain=' . $url;
        }

        $title = parseTitle($html);
        if(!empty($title)){
          $obj['title'] = $title;
        }
        $description = parseDescription($html);
        if(!empty($description)){
          $obj['description'] = $description;
        }
      }
      else{
        if(empty($obj['favicon'])){
          $obj['not_found'] = true;
        }
      }

      $json[] = $obj;
    }
  }

  function parseTitle($html) {
    $title = preg_match('/<title[^>]*>(.*?)<\/title>/ims', $html, $match) ? $match[1] : null;
    return $title;
  }

  function parseDescription($html) {
    $matches = array();
    preg_match('/<meta.*?name=("|\').*description("|\').*?content=("|\')([^"]+)("|\')/i', $html, $matches);
    if (count($matches) > 4) {
      return trim($matches[4]);
    }
    preg_match('/<meta.*?content=("|\')([^"]+)("|\').*?name=("|\').*description("|\')/i', $html, $matches);
    if (count($matches) > 2) {
      return trim($matches[2]);
    }

    return null;
  }

  print_r(json_encode($json));
?>
