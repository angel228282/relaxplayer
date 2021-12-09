<?php

class config
{
    public $version = "1.0.0";
    public $admin_name = "admin";
    public $admin_pass = "d41d8cd98f00b204e9800998ecf8427e";
    public $host = "127.0.0.1";
    public $port = "6600";
    public $pass = "";
    public $output = "1";
    public $template = "default";
    public $language = "en";
    public $volume = 100;
    public $repeat = false;
    public $random = false;
    public $fade = 5;
    public $rights = array( // anonymous userrights
        "add_songs" => "selected",
        "start_playing" => "selected",
        "pause_playing" => "selected",
        "set_volume" => "selected",
        "controll_playlist" => "selected",
        "controll_player" => "selected",
        "admin_relaxx" => "",
        "admin_mpd" => ""
    );
    public $plcolumns = "Pos:Artist:Title:Album:Genre:Time";
    public $trcolumns = "Artist:Title:Genre:Time";
    public $configfile = "/config/config.php";

    /* save constructor */
    public function configload($cfile)
    {
        if (!file_exists($cfile)) {$this->save($cfile);}
        $version = $this->version;
        $xml = simplexml_load_file($cfile);
        $class = json_decode(json_encode((array) $xml), true);
        //while (list($key, $val) = each($class)) {
        foreach ($class as $key => $val) {
            if (is_array($val)) {
                foreach ($val as $array_key => $array_val) {$this->{$key}[$array_key] = $xml->$key->$array_key;}
            } else if (isset($xml->$key)) {$this->$key = $xml->$key;}
        }
        if (trim($this->pass == "")) {$this->pass = null;}
        // rewrite config if version changed
        if ($version != $this->version) {
            $this->version = $version;
            $this->save($cfile);
        }
        return true;
    }

    /* get postvars into object-data */
    public function getPost()
    {
        global $_POST;
        $class = json_decode(json_encode((array) $_POST), true);
        //   while (list($key, $val) = each($class)) {
        foreach ($class as $key => $val) {
            if (is_array($val)) {
                /* handle multiple selects */
                foreach ($val as $array_key => $array_val) {$this->{$key}[$array_key] = "";}
                foreach ($_POST[$key] as $array_key => $array_val) {$this->{$key}[$array_val] = "selected";}
            } else if (isset($_POST[$key]) && ($_POST[$key] != "PASSWORD")) {
                $this->$key = $_POST[$key];
            }

        }
        if ($_POST['admin_pass'] != "PASSWORD") {
            $this->admin_pass = md5($this->admin_pass);
        }

    }

    /* get or set the MPS output */
    public function controllOutput($action, $value)
    {

    }

    /* save config to xml */
    public function save($cfile)
    {
        $handle = fopen($cfile, 'w');
        if ($handle === false) {
            echo "Error: I can not open " . $cfile . " fo write. please make shure, that the config directory and the file are writable.";
            die();
        }
        fwrite($handle, "<?xml version='1.0' standalone='yes'?>\n<config>\n");
        $class = get_class_vars("config");
        // while (list($key, $val) = each($class)) {
        foreach ($class as $key => $val) {
            if (is_array($val)) {
                fwrite($handle, "<" . $key . ">\n");
                foreach ($this->$key as $array_key => $array_val) {fwrite($handle, "<" . $array_key . ">" . $array_val . "</" . $array_key . ">\n");}
                fwrite($handle, "</" . $key . ">\n");
            } else {
                fwrite($handle, "<" . $key . ">" . $this->$key . "</" . $key . ">\n");
            }
        }
        fwrite($handle, "</config>\n");
        fclose($handle);
        chmod($cfile, 0600);
        return true;
    }

    /* print admin form */
    public function edit()
    {
        global $lng;
        echo "<h1>" . $lng->adm_settings . "</h1>";
        echo "<form id='login' name='login' action='" . $_SERVER['PHP_SELF'] . "' method='post'>" .
        "<div style='display:block; overflow:none; height:320px'><div id='dirTabs'><ul class='mootabs_title'>" .
        "<li title='Tglobal'>global</li>" .
        "<li title='Trelaxx'>relaxx</li>" .
        "</ul><div id='Tglobal' class='mootabs_panel' style='height:280px'>" .
        "<fieldset><legend>MPD</legend><table>" .
        "<tr><th>MPD Host<td><input name='host' value='" . $this->host . "'>" .
        "<tr><th>MPD Port<td><input name='port' value='" . $this->port . "'>" .
        "<tr><th>MPD Password<td><input name='pass' type='password' value='PASSWORD'>" .
        "<tr><th>" . $lng->output . "<td><select id='outputSelect' name='output' size='2' onchange='toggleOutput()' multiple><option>error no output</option></select>" .
        "</table></fieldset>" .
        "<fieldset><legend>RelaXX - " . $lng->administrator . "</legend><table>" .
        "<tr><th>" . $lng->administrator . "<td><input name='admin_name' value='" . $this->admin_name . "'>" .
        "<tr><th>" . $lng->password . "<td><input name='admin_pass' type='password' value='PASSWORD'>" .
        "</table></fieldset>" .
        "</div><div id='Trelaxx' class='mootabs_panel' style='height:280px'>" .
        "<fieldset><legend>RelaXX - " . $lng->config . "</legend><table>" .
        "<tr><th>" . $lng->adm_template . "<td><select name='template'>";
        foreach ($this->getSubdirs("./templates/") as $key => $val) {
            echo "<option value='" . $val . "' ";
            if ($this->template == $val) {
                echo "selected";
            }

            echo ">" . $val . "</option>";
        }
        echo "</select><tr><th>" . $lng->adm_language . "<td><select name='language'>";
        foreach ($this->getSubdirs("./include/lang/") as $key => $val) {
            echo "<option value='" . $val . "' ";
            if ($this->language == $val) {
                echo "selected";
            }

            echo ">" . $val . "</option>";
        }
        echo "</select><tr><th>" . $lng->adm_rights . "<td><select name='rights[]' size='5'   multiple>";
        foreach ($this->rights as $key => $val) {echo "<option value='$key' $val>" . $key . "</option>";}
        echo "</select>" .
        "<tr><th>Playlist columns<td><input name='plcolumns' value='" . $this->plcolumns . "'>" .
        "<tr><th>Songlist columns<td><input name='trcolumns' value='" . $this->trcolumns . "'>" .
        "</table></fieldset></div></div></div>" .
        "<div style='margin:5px;float:left; display:block;'>" .
        "<button type='submit' class='positive' />" . $lng->save . "</button>" .
        "<button class='negative' onclick='closeAndReload();'/>" . $lng->close . "</button>" .
        "</div><div style='float:right;display:inline;margin:5px;'><button onclick='updateDatabase(); return false;' style='background-image: url(./images/warning.gif);'>" . $lng->adm_updatedb . "</button></div></form>";
    }

    /* get availiable templates and languages */
    public function getSubdirs($path)
    {
        $values = array();
        if (is_dir($path)) {
            if ($dh = opendir($path)) {
                while (($file = readdir($dh)) !== false) {
                    if ((filetype($path . $file) == "dir") && ($file != ".") && ($file != "..")) {
                        array_push($values, $file);
                    }

                }
                closedir($dh);
            }
        }
        return $values;
    }

    /* get availiable templates and languages : returns true or false*/
    public function checkRights($context)
    {
         return true;
    }

    public function loadToArray($cfile)
    {
        $xml = simplexml_load_file($cfile);
        $array = json_decode(json_encode((array) $xml), true);
        foreach ($array as $key => $val) {$config[$key] = $val;}
        foreach ($config as $key => $val) { if(empty($val)) { $config[$key] = null; } }
        foreach ($config["rights"] as $key => $val) { if(empty($val)) { $config["rights"][$key] = null; } }
        return $config;
    }
}
?>