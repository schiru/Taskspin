<?php

/* GET - GET - GET - GET - GET - GET - GET - GET - GET - GET - GET - GET - GET */

if ($api->method == "GET")
{
	
}

/* POST - POST - POST - POST - POST - POST - POST - POST - POST - POST - POST */

else if ($api->method == "POST")
{
	
}

else
{
	$api->sendStatus(403, 'wrong-method');
}