<?php
/* ----------------------------------------------  /
/  Relax Player                                    /
/  AJAX Controller for MPD Common functions		  */
 session_start();
 ini_set('default_mimetype','text/javascript');
 header("Content-type: text/javascript;  charset=utf-8");

function format_time($t,$f=':') // t = seconds, f = separator
{
  return sprintf("%02d%s%02d%s%02d", floor($t/3600), $f, ($t/60)%60, $f, $t%60);
}
 // read config
   require_once("class-config.php");
   $newconfig = new config();
   $config = $newconfig->loadToArray("../config/config.php");
   $host =  $config["host"];
   $port =  $config["port"];
   $pass =  $config["pass"];

   $lng = simplexml_load_file("../include/lang/".$config["language"]."/lang.xml");
   // include MPD-lib and connect
   require_once 'lib-mpd.php';
   $MPD = Net_MPD::factory('Common', $host, intval($port), $pass);
   if (!$MPD->connect()) die();

   $status["error"] = true;

   // switch ond action
   switch($_GET['action'])
	{
		case 'getStats':
             $status =  $MPD->runCommand('stats');
             $status["current_song"] =  $MPD->runCommand('currentsong');
             $status["songs"] = 1;
             echo json_encode($status);
  		     break;

		case 'getCommands':
			 $status = ($MPD->isCommand('commands')) ? $MPD->getCommands() : 'error';
             echo json_encode($status);
  		     break;

		case 'getStatsResponse':
             $status =  $MPD->runCommand('stats');
             $status["current_song"] =  $MPD->runCommand('currentsong');
             //print_r($status["current_song"]);
             $status["text"] = "<h1>".$lng->dialog_info."</h1><div><b>".$lng->now_playing.": </b>".$status["current_song"]["file"][0]["Artist"]." - ".$status["current_song"]["file"][0]["Title"]. " (".$status["current_song"]["file"][0]["Album"]. ")<br>".$lng->genre.": ".$status["current_song"]["file"][0]["Genre"]." <br>".$lng->date.": ".$status["current_song"]["file"][0]["Date"]."<br><b>Adatbázis</b><br>Számok: ".$status["stats"]["songs"]."dal - Előadók: ".$status["stats"]["artists"]." - Albumok: ".$status["stats"]["albums"]."<br>Lejátszási idő (hh:mm:ss): ".format_time($status["stats"]["db_playtime"])."<br>Utolsó Frissítés: ".date("Y.m.d H:i:s", $status["stats"]["db_update"])."<br>Autdj Fut: ".format_time($status["stats"]["uptime"])." </div>";


             echo json_encode($status);
  		     break;


	}

?>