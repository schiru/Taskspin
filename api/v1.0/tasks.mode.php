<?php

/* GET - GET - GET - GET - GET - GET - GET - GET - GET - GET - GET - GET - GET */

if ($api->method == "GET")
{
	// If no user is logged in --> 401 Unauthorized
	if (!$api->isLoggedIn()) $api->sendStatus(401);
	
	$tasksTable = $api->getMySQLTable("tasks");
	$tasklistsTable = $api->getMySQLTable("tasklists");
	$sql = "SELECT t.taskID, t.content, t.dueDate, t.finished, t.parent, t.order, t.belongsTo, tl.tasklistID
		FROM {$tasksTable} AS t
		JOIN {$tasklistsTable} AS tl ON tl.tasklistID = t.belongsTo
		WHERE tl.owner = " . $_SESSION['userID'];
	$result = mysql_query($sql);
	$tasks = array();
	while($row = mysql_fetch_assoc($result)) $tasks[] = $row;
	echo json_encode($tasks);
}

/* POST - POST - POST - POST - POST - POST - POST - POST - POST - POST - POST */

else if ($api->method == "POST")
{
	// If a parameter is missing --> 400 Bad Request
	if (!isset($api->params['content'], $api->params['dueTo'], 
			   $api->params['parent'], $api->params['order'], 
			   $api->params['tasklistID'])) $api->sendStatus(400);
	
	$tasksTable = $api->getMySQLTable("tasks");
	$sql = "INSERT INTO `{$tasksTable}` (taskID, belongsTo";
	$sql2 = ") VALUES (NULL, " . $_SESSION['userID'];
	foreach ($api->params as $key => $value)
	{
		$sql .= ", " . $key;
		$sql2 .= ", " . $value;
	}
	$sql .= $sql2 . ")";
	echo $sql;
	
	/*$result = mysql_query($sql);
	$count = mysql_num_rows($result);
	$row = mysql_fetch_assoc($result);
	
	// If less/more than one user is returned --> 401 Unauthorized
	if ($count != 1) $api->sendStatus(401);
	
	$_SESSION['userID'] = $row['userID'];
	
	$api->sendStatus(200);*/
}

else
{
	$api->sendStatus(405);
}