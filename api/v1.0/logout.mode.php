<?php

/* GET - GET - GET - GET - GET - GET - GET - GET - GET - GET - GET - GET - GET */

if ($api->method == "GET")
{
	// If no user is logged in --> 401 Unauthorized
	if (!$api->isLoggedIn()) $api->sendStatus(401);
	
	session_unset();
}

else
{
	$api->sendStatus(405);
}