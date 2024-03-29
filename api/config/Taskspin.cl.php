<?php

class Taskspin
{
	private $settings;
	private $errors;
	private $mysqlConnection;
	private $mysqlDB;
	public $method;
	public $version;
	public $params;
	
//-- LIFECYCLE
	
	function __construct($settings, $errors)
	{
		$this->settings = $settings;
		$this->errors = $errors;
		$this->connectToDatabase();
		$this->mode = explode("/", $_GET['mode']); unset($_GET['mode']);
		$this->version = $_GET['version']; unset($_GET['version']);
		$this->method = $_SERVER['REQUEST_METHOD'];
		$this->parseParams();
	}
	
	function __destruct()
	{
		mysql_close($this->mysqlConnection);
	}
	
	function isLoggedIn()
	{
		return isset($_SESSION['userID']);
	}
	
//-- DATABASE
	
	function connectToDatabase()
	{
		$this->mysqlConnection = mysql_connect($this->settings['mysql']['server'], $this->settings['mysql']['username'], $this->settings['mysql']['password']) or die ($this->errors['mysql']['db-connect']);
		$this->mysqlDB = mysql_select_db($this->settings['mysql']['database']) or die ($this->errors['mysql']['db-select']);
	}
	
	function getMySQLTable($table)
	{
		return $this->settings['mysql']['table-prefix'] . $this->settings['mysql']['tables'][$table];
	}
	
//-- PARAMETERS
	
	function parseParams()
	{
		switch ($this->method)
		{
			case "GET":
				$this->params = $_GET;
				break;
			case "POST":
				$this->params = $_POST;
				break;
			case "PUT":
			case "DELETE":
				$paramString = "";
				$data = fopen("php://input", "r");
				while ($dataSlice = fread($data, 1024))
				{
					$paramString .= $dataSlice;
				}
				fclose($data);
				if ($paramString != "")
				{
					$keyAndValue = explode("&", $paramString);
					foreach ($keyAndValue as $kv)
					{
						$slices = explode("=", $kv);
						$this->params[$slices[0]] = $slices[1];
					}
				}
				break;
		}
	}
	
	function sendStatus($code, $message=" ")
	{
		if (strpos($message, " ") == -1) header("HTTP/1.0 {$code} " . $this->errors['status'][$code][$message]);
		else header("HTTP/1.0 " . $code . " " . $message);
		die();
	}
}