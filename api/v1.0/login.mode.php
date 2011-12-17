<?php

/* GET - GET - GET - GET - GET - GET - GET - GET - GET - GET - GET - GET - GET */

if ($api->method == "GET")
{
	// If no user is logged in --> 401 Unauthorized
	if (!$api->isLoggedIn()) $api->sendStatus(401);
	
	$accountsTable = $api->getMySQLTable("accounts");
	$sql = "SELECT `userID`, `username`, `email`, `name` FROM `{$accountsTable}` WHERE `userID` = " . $_SESSION['userID'];
	$result = mysql_query($sql);
	$row = mysql_fetch_assoc($result);
	
	echo json_encode($row);
}

/* POST - POST - POST - POST - POST - POST - POST - POST - POST - POST - POST */

else if ($api->method == "POST")
{
	// If a parameter is missing --> 400 Bad Request
	if (!isset($api->params['username'], $api->params['password'])) $api->sendStatus(400);
	
	// If you are already logged in --> 418 I'm a teapot
	if ($api->isLoggedIn()) $api->sendStatus(423, "You are already logged in!");
	
	$accountsTable = $api->getMySQLTable("accounts");
	$sql = "SELECT userID FROM `{$accountsTable}` WHERE `username` = '" 
			. mysql_real_escape_string($api->params['username']) . "' AND `password` = '" 
			. md5(mysql_real_escape_string($api->params['password'])) . "'";
	$result = mysql_query($sql);
	$count = mysql_num_rows($result);
	$row = mysql_fetch_assoc($result);
	
	// If less/more than one user is returned --> 401 Unauthorized
	if ($count != 1) $api->sendStatus(401);
	
	$_SESSION['userID'] = $row['userID'];
	
	$api->sendStatus(200);
}

else
{
	$api->sendStatus(405);
}