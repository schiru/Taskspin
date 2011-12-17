<?php

// BUG: mode can be overriden
session_start();

require_once "../config/config.inc.php";
require_once "../config/errors.inc.php";
require_once "../config/Taskspin.cl.php";

$api = new Taskspin($settings, $errors);

if (file_exists($api->mode[0] . ".mode.php"))
{
	require $api->mode[0] . ".mode.php";
}
else
{
	header ("HTTP/1.0 404 Not Found");
}