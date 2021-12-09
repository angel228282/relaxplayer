<?php
/* ----------------------------------------------  /
/  Relax Player                                    /
/                                                  /
/  AJAX controller for playback commands		   /
/  ---------------------------------------------- */
 session_start();
 
 ini_set('default_mimetype','text/javascript');
 header("Content-type: text/javascript;  charset=utf-8"); 
 
 if (isset($_SESSION['relaxx'])) {
   	
   // read config
   require_once("class-config.php");
   $newconfig = new config();
   $config = $newconfig->loadToArray("../config/config.php");
   $host =  $config["host"];
   $port =  $config["port"];
   $pass =  $config["pass"];

   // include MPD-lib and connect
   require_once 'lib-mpd.php';
   $MPD = Net_MPD::factory('Playback',  $host, intval($port), $pass);
   if (!$MPD->connect()) { echo json_encode('error'); die(); }
	
   $status = "success";
   
    // switch ond action
     switch($_GET['action'])
	    {
		case 'getCurrentSong':
			$status = ($MPD->isCommand('currentsong')) ? $MPD->getCurrentSong() : 'error';
    		 break;			
		case 'play':
			($newconfig->checkRights("controll_player") && $MPD->isCommand('playid')) ? $MPD->playid($_GET['value']) : $status = "error";
			break;		
		case 'continue':
			($newconfig->checkRights("start_playing")  && $MPD->isCommand('playid')) ? $MPD->playid($_GET['value']) : $status = "error";
			break;		
		case 'stop':
			($newconfig->checkRights("controll_player")  && $MPD->isCommand('stop')) ? $MPD->stop() : $status = "error";
			break;		
		case 'pause':
			($newconfig->checkRights("pause_playing") && $MPD->isCommand('pause')) ? $MPD->pause() : $status = "error";
			break;		
		case 'random':
			($newconfig->checkRights("controll_player") && $MPD->isCommand('random')) ? $MPD->random($_GET['value']) : $status = "error";
			break;		
		case 'repeat':
			($newconfig->checkRights("controll_player") && $MPD->isCommand('repeat')) ? $MPD->repeat($_GET['value']) : $status = "error";
			break;		
		case 'nextSong':
			($newconfig->checkRights("controll_player") && $MPD->isCommand('next')) ? $MPD->nextSong() : $status = "error";
			break;
		case 'prevSong':
			($newconfig->checkRights("controll_player") && $MPD->isCommand('previous')) ? $MPD->previousSong() : $status = "error";
			break;
		case 'seekId':
			($newconfig->checkRights("controll_player") && $MPD->isCommand('seek')) ? $MPD->seek($_GET['id'],$_GET['value']) : $status = "error";
			break;		
		case 'setVolume':
			($newconfig->checkRights("set_volume") && $MPD->isCommand('setvol')) ? $MPD->setVolume($_GET['value']) : $status = "error";
			break;		
		case 'setCrossfade':
			($newconfig->checkRights("controll_player") && $MPD->isCommand('crossfade')) ? $MPD->setCrossfade($_GET['value']) : $status = "error";			
			break;		
	}
	echo json_encode($status);
}
?>