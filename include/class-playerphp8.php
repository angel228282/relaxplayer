<?php
class player
{
    public $data;
    public $error;

    public function __construct(
        string $data = '', string $error = ''
    ) {
        $this->data = $data;
        $this->error = $error;
    }

    public function xxDirectory()
    {
        require_once 'include/lib-mpd.php';
        $config = explode(";", $_SESSION['relaxx_hostdata'], 3);
        if (count($config) < 3) {$config[2] = null;}
        $MPD = Net_MPD::factory('Database', $config[0], $config[1], $config[2]);
        if ($MPD->isCommand('lsinfo')) {$this->data = $MPD->getInfo(""); $this->error = 'Connection ready!';}
        echo "<div style='margin:0px;padding:0px;display:block;width:auto;'><ul id='treemenu' class='treelist'>";
        echo "<li class='' id='treeroot' onclick='refreshTracklist(\"\",\"/\");'>/</li>";
        if (isset($this->data['directory'])) {
            echo "<ul>";
            foreach ($this->data['directory'] as $entry) {
                // look for subdirs in every entry
                $subdata = $MPD->getInfo($entry);
                // select dirs with subdirs with a class tag
                $class = (isset($subdata['directory'])) ? "" : "empty";
                $dval = str_replace(" ", "&nbsp;", $entry);
                $dval = strtr($dval, "-)(", ".][");
                echo "<li class='" . $class . "' onclick='getDir(event);' title='" . urlencode($entry) . "'>" . $dval . "</li>";
            }
            echo "</ul>";
        }
        echo "</ul></div>";
    }

    public function xxPlaylistform($listcount = 7)
    {
        global $lng;
        global $config;
        $configs = explode(";", $_SESSION['relaxx_hostdata'], 3);
        if (count($configs) < 3) {$configs[2] = null;}
        $MPD = Net_MPD::factory('Playlist', $configs[0], $configs[1], $configs[2]);
        $status = $MPD->getPlaylists();
         foreach ($status as $entry) {
             $list .= '<option onclick=\'refreshTracklist("listPlaylistInfo","'.$entry.'")\' value="'.$entry.'" >'.$entry.'</option>';
         }
        echo "<h1>" . $lng->tab_playlists . "</h1>";
        echo "<table class='normTable' style='width:auto'><tr><td>";
        echo "<select id='playlistSelect' name=''  size='" . $listcount . "'>".$list."</select>";
        $icon = "templates/" . $config["template"] . "/images/append.gif";
        echo "</td><td valign=top><button onclick='controllRemote(\"loadPlaylist\",$(\"playlistSelect\").value,true,\"playlist\")' style='width:9em;background-image:url(" . $icon . ");'>" . $lng->pl_append . "</button><br />";
        $icon = "templates/" . $config["template"] . "/images/replace.gif";
        echo "<button onclick='controllRemote(\"clear\",\"\",true,\"playlist\"); controllRemote(\"loadPlaylist\",$(\"playlistSelect\").value,true,\"playlist\")' style='width:9em;background-image:url(" . $icon . ");'>" . $lng->pl_replace . "</button><br />";
        $icon = "templates/" . $config["template"] . "/images/delete.gif";
        echo "<button onclick='controllRemote(\"deletePlaylist\",$(\"playlistSelect\",true).value,false,\"playlist\"); loadPlaylists();' style='width:9em;background-image:url(" . $icon . ");'>" . $lng->pl_delete . "</button><br />";
        $icon = "templates/" . $config["template"] . "/images/save.gif";
        echo "<button onclick='savePlaylist();' style='width:9em;background-image:url(" . $icon . ");'>" . $lng->pl_save . "</button></td></tr></table>";
    }
    public function xxSearchform()
    {
        global $lng, $config;
        echo "<h1>" . $lng->tab_search . "</h1>";
        echo "<form action='#' onsubmit='if (this.search.value!=\"\") refreshTracklist(\"search\",this); return false;' >";
        echo "<table class='normTable' style='width:auto'><tr><td>" . $lng->search_for . "<br />" .
        "<input id='searchField' name='search' value=''/><tr><td>" .
        $lng->search_in . "<br /><select id='searchTarget' name='target' ><option value='any' standard>" . $lng->any .
        "<option value='artist'>" . $lng->artist .
        "<option value='title'>" . $lng->title .
        "<option value='genre'>" . $lng->genre .
        "<option value='date'>" . $lng->date .
        "<option value='filename'>" . $lng->file .
        "<option value='comment'>" . $lng->comment . "</select><br />";
        $icon = "templates/" . $config["template"] . "/images/search.gif";
        echo "<tr><td><br/><button type='submit' style='background-image: url(" . $icon . ");'>" . $lng->tab_search . "</button></table></form></p>";
    }
    public function xxMenu($aspect = "vert")
    {
        global $lng;
        echo "<a id='menu_login' class='menu' href='#' onclick='loginOut(false); return false;'>"
            . (($_SESSION['relaxx'] == 'anonymous') ? $lng->login : $lng->logout) . "</a>";
        echo "<a class='menu' href='#' onclick='doAdmin(this);return false;'>" . $lng->config . "</a>";
    }

    public function xxPlayerButtons()
    {
        global $lng;
        global $config;
        echo "<a href='#' class='player' onClick='controllRemote(\"prevSong\",\"\",true,\"playback\");return false;'><img class='button' src='" . "templates/" . $config["template"] . "/images/previous.gif' title='" . $lng->previous . "'/></a>";
        echo "<a href='#' class='player' onClick='controllRemote(\"stop\",\"\",true,\"playback\");return false;'><img class='button'  src='" . "templates/" . $config["template"] . "/images/stop.gif' title='" . $lng->stop . "' /></a>";
        echo "<a href='#' class='player' onClick='togglePlay();return false;'><img  class='button' src='" . "templates/" . $config["template"] . "/images/play.gif' id='play_button' title='" . $lng->play . "' /></a>";
        echo "<a href='#' class='player' onClick='controllRemote(\"nextSong\",\"\",true,\"playback\");return false;'><img class='button' src='" . "templates/" . $config["template"] . "/images/next.gif' title='" . $lng->next . "' /></a>";
    }

    public function xxPlayposSlider()
    {
        echo "<div id='playpos'><div id='plposKnob' class='knob'></div></div>";
    }

    public function xxVolumeSlider()
    {
        echo "<div id='volume'><div id='volKnob' class='knob'></div></div>";
    }
}
?>