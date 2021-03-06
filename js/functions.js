var IEsucks = "onclick='markRows(event,this)' onmouseover='activateRow(event,this)'onmouseout='deactivateRow(this)'";
var testcounter = 0;
var oldStatus = new Object;
var popInfo = null;
var popAdm = new Object;
var current_row = false;
var current_element = false;
var last_marked = false;
var pingTimer = null;
var infoTimer = null;
var trackSort = null;
var current_dir = null;

function initPlayer() {
    makeTracklist();
    myTabs = new mootabs("dirTabs", {
        height: "100%",
        width: "100%"
    });
    refreshTracklist("", "/");
    playPos = new Slider($("playpos"), $("plposKnob"), {
        steps: 100,
        mode: "horizontal",
        onComplete: function(a) {
            if (oldStatus.time) {
                pos = Math.round(a * (oldStatus.time.split(":")[1] / 100));
                controllRemote("seekId&id=" + oldStatus.song, pos, true, "playback")
            }
        }
    }).set(0);
    volPos = new Slider($("volume"), $("volKnob"), {
        steps: 100,
        mode: "horizontal",
        onComplete: function(a) {
            if (oldStatus.volume) {
                controllRemote("setVolume", a, true, "playback")
            }
        }
    }).set(0);
    makePlaylist();
    loadPlaylists();
    keyKTarget = window.ie ? document : window;
    keyKTarget.addEvent("keydown", function(a) {
        handleKeys(a, false)
    });
    current_dir = $$("#treemenu li")[0];
    popInfo = new Element("div");
    $(document.body).adopt(popInfo);
    popInfo.addClass("tipbox");
    popAdm.closed = true;
    $("playlist").addEvent("mouseover", function() {
        selectElement("playlist")
    });
    $("playlist").addEvent("mouseout", function() {
        current_element = null
    });
    $("tracklist").addEvent("mouseover", function() {
        selectElement("tracklist")
    });
    $("tracklist").addEvent("mouseout", function() {
        current_element = null
    })
}

function makePlaylist() {
    plHeader = "<table id='plTable' class='dataTable' cellspacing='0'><thead><tr>";
    plcolumns.each(function(b) {
        b = b.charAt(0).toLowerCase() + b.substring(1);
        plHeader += "<th axis='" + (b == "pos" ? "number" : "string") + "'>" + language[b] + "</th>"
    });
    plHeader += "</tr></thead><tbody>";
    $("playlist").innerHTML = "<div class='tableContainer' id='plContainer'></div>";
    $("plContainer").innerHTML = plHeader + "<tr id='pl0'><td colspan='0' onmouseover='current_row=false' align='center'>" + language.loading + "</td></tr></tbody></table>";
    nSize = $("playlist").getSize();
    $("plContainer").setStyle("height", nSize.size.y);
    var a = new tableSort("plTable", 0);
    oldStatus.playlist = "0";
    pingMPD()
}

function makeTracklist() {
    trackHeader = "<table id='trackTable' class='dataTable' cellspacing='0'><thead><tr>";
    trcolumns.each(function(a) {
        a = a.charAt(0).toLowerCase() + a.substring(1);
        trackHeader += "<th axis='string'>" + language[a] + "</th>"
    });
    trackHeader += "</tr></thead><tbody>";
    $("tracklist").innerHTML = "<div class='tableContainer' id='trackContainer'>" + trackHeader + "</tbody></table></div>";
    nSize = $("tracklist").getSize();
    $("trackContainer").setStyle("height", nSize.size.y);
    trackSort = new tableSort("trackTable", 0)
}

function pingMPD(b) {
    clearTimeout(pingTimer);
    url = "include/controller-ping.php?value=" + oldStatus.playlist;
    var a = new Json.Remote(url, {
        onComplete: function(c) {
            if (c.error) {
                modalBox("<h3>Error</h3><p>" + language.error_connect + "</p>", true)
            } else {
                refreshPlaylist(c);
                setPlayerStatus(c.status);
                oldStatus = c.status;
                pingTimer = setTimeout("pingMPD()", 1000)
            }
        }
    }).send()
}

function getDir(b) {
    b.cancelBubble = true;
    if (b.stopPropagation) {
        b.stopPropagation()
    }
    dNode = b.target || b.srcElement;
    if (dNode.className.search(/empty/) == -1) {
        dChild = dNode.nextSibling;
        if ((!dChild) || (dChild.tagName != "UL")) {
            var a = new Element("ul");
            dNode.parentNode.insertBefore(a, dNode.nextSibling);
            dChild = dNode.nextSibling;
            new Ajax("include/controller-database.php?action=extendTree&dir=" + dNode.title, {
                method: "get",
                update: dChild
            }).request();
            dNode.className = "selected open"
        } else {
            if (dNode.className.search(/open/) != -1) {
                dChild.className = "closed";
                dNode.className = "selected"
            } else {
                dChild.className = "open";
                dNode.className = "selected open"
            }
        }
    } else {
        dNode.className = "empty selected"
    }
    if (current_dir != dNode) {
        refreshTracklist("", dNode.title);
        current_dir.className = current_dir.className.replace("selected", "")
    }
    current_dir = dNode
}

function refreshTracklist(b, c) {
    console.log(c);
    switch (b) {
        case "search":
            url = "include/controller-database.php?" + Object.toQueryString({
                action: b,
                type: c.target.value,
                search: c.search.value
            });
            break;
        case "listPlaylistInfo":
            url = "include/controller-playlist.php?" + Object.toQueryString({
                action: b,
                value: c
            });
            break;
        default:
            url = "include/controller-database.php?action=directory&dir=" + c
    }
    var a = new Json.Remote(url, {
        onComplete: function(e) {
            var d = "";
            i = 0;
            if (e.file) {
                e.file.each(function(f) {
                    rclass = (i % 2) ? "odd" : "even";
                    i++;
                    if ((!f.Artist) && (!f.Title)) {
                        f = buildTag(f)
                    }
                    d += '<tr id="' + encodeURIComponent(f.file) + "\" class='" + rclass + '\'  ondblclick=\'controllRemote("addSong",this.id,true,"playlist");\' ' + IEsucks + " >";
                    trcolumns.each(function(g) {
                        if (f[g]) {
                            d += "<td>" + ((g == "Time") ? convertTime(f[g]) : f[g]) + "</td>"
                        } else {
                            d += "<td></td>"
                        }
                    });
                    d += "</tr>"
                })
            } else {
                d += "<tr id='0' class='even'><td colspan='" + (trcolumns.length + 1) + "' onmouseover='current_row=false' align='center'>" + language.error_nofiles + "</td></tr>"
            }
            newBody = new Element("div").setHTML("<table><tbody>" + d + "</tbody></table>");
            $("trackTable").replaceChild(newBody.firstChild.firstChild, $("trackTable").lastChild);
            recalcTable("tracklist");
            trackSort.reset(0)
        }
    }).send()
}

function refreshPlaylist(b) {
    plStatus = b.status;
    plChanges = b.playlist;
    if ((plStatus.playlistlength == oldStatus.playlistlength) && (!plChanges)) {
        return
    }
    oldStatus.playlistlength = parseInt(oldStatus.playlistlength);
    plStatus.playlistlength = parseInt(plStatus.playlistlength);
    tBody = $$("#plTable tbody")[0];
    if (plStatus.playlistlength == 0) {
        newBody = new Element("div").setHTML("<table><tbody><tr id='pl0' class='even' onmouseover='current_row=false'><td colspan='" + (plcolumns.length + 1) + "' align='center'>" + language.error_notracks + "</td></tr></tbody></table>");
        $("plTable").replaceChild(newBody.firstChild.firstChild, $("plTable").lastChild);
        current_row = false
    } else {
        if (plChanges) {
            a = 0;
            plChanges.file.each(function(c) {
                rclass = (a % 2) ? "odd" : "even";
                newRow = makePlaylistRow(c, rclass);
                $("pl" + c.Pos) ? tBody.replaceChild(newRow, $("pl" + c.Pos)) : tBody.appendChild(newRow);
                a++
            });
            lastTrack = plChanges.file.pop();
            if ((plStatus.playlistlength - 1) == lastTrack.Pos) {
                n = tBody.childNodes.length;
                for (var a = 0; a < n; ++a) {
                    if ((a > lastTrack.Pos) && $("pl" + a)) {
                        tBody.removeChild($("pl" + a))
                    }
                }
            }
        } else {
            if ((oldStatus.playlistlength > plStatus.playlistlength) && (plStatus.playlistlength != 0)) {
                for (a = plStatus.playlistlength; a < oldStatus.playlistlength; a++) {
                    if ($("pl" + a)) {
                        tBody.removeChild($("pl" + a))
                    }
                }
            }
        }
    }
    a = 0;
    $$("#plTable tBody tr").each(function(c) {
        c.className = (a % 2) ? c.className.replace("odd", "even") : c.className.replace("even", "odd");
        a++
    });
    oldStatus.songid = -1;
    recalcTable("playlist")
}

function recalcTable(a) {
    newSize = $(a).getSize();
    container = $(a).firstChild;
    container.setStyle("width", newSize.size.x);
    container.setStyle("height", $(a).clientHeight);
    table = $$("#" + a + " table")[0];
    if (window.gecko) {
        container.setStyle("overflow", "hidden");
        table.setStyle("width", newSize.size.x);
        if (table.lastChild.scrollHeight >= (newSize.size.y - 20)) {
            border = (a == "playlist") ? 5 : 0;
            table.lastChild.setStyle("height", (newSize.size.y - table.firstChild.getSize().size.y - border))
        } else {
            table.lastChild.setStyle("height", "auto")
        }
    } else {
        if (window.ie) {
            container.setStyle("height", $(a).clientHeight);
            scrollMargin = (container.scrollHeight >= container.offsetHeight) ? (container.offsetWidth - container.clientWidth) : 0;
            table.setStyles("width:" + (newSize.size.x - scrollMargin) + "px;")
        }
    }
}

function makePlaylistRow(a, c) {
    if ((!a.Artist) && (!a.Title)) {
        a = buildTag(a)
    }
    var b = new Element("div");
    row = "<table><tr id='pl" + a.Pos + "' plid='" + a.Id + "' class='" + c + '\'  ondblclick=\'controllRemote("play",this.attributes["plid"].nodeValue,true,"playback");\' ' + IEsucks + " >";
    plcolumns.each(function(d) {
        if (a[d]) {
            if (d == "Time") {
                row += "<td>" + convertTime(a[d]) + "</td>"
            } else {
                if (d == "Pos") {
                    row += "<td style='padding-left:15px;'>" + a[d] + "</td>"
                } else {
                    row += "<td>" + a[d] + "</td>"
                }
            }
        } else {
            row += "<td></td>"
        }
    });
    b.innerHTML = row + "</tr></table>";
    return b.getElementsByTagName("tr")[0]
}

function buildTag(a) {
    if (!a.Time) {
        if (a.Name) {
            a.Title = a.Name
        }
        if (!a.Title) {
            a.Title = a.file
        }
        a.Time = "stream"
    } else {
        var b = a.file.substr(a.file.lastIndexOf("/") + 1);
        n = b.indexOf("-");
        if (n) {
            a.Artist = b.substr(0, n - 1)
        }
        a.Title = b.substr(n + 1)
    }
    return a
}

function markRows(a, c) {
    $(c.id).toggleClass("marked");
    if ((a.shiftKey) && (c.parentNode == last_marked.parentNode)) {
        rows = $$("#" + current_element + " table tbody tr");
        found = false;
        for (var b = 0; b < rows.length; ++b) {
            if ((rows[b].id == c.id) || (rows[b].id == last_marked.id)) {
                rows[b].addClass("marked");
                if (found) {
                    return
                } else {
                    found = true
                }
            } else {
                if (found) {
                    rows[b].addClass("marked")
                }
            }
        }
    }
    last_marked = c
}

function activateRow(a, b) {
    testcounter++;
    current_row = b.id;
    b.mousex = a.clientX;
    b.mousey = a.clientY;
    if (window.ie) {
        b.className += " hover"
    }
    infoTimer = showFileinfo.delay(2000);
    $(current_row).addListener("mousemove", delayPopUp)
}

function deactivateRow(a) {
    infoTimer = $clear(infoTimer);
    if (current_row) {
        $(current_row).removeListener("mousemove", delayPopUp);
        current_row = false
    }
    if (window.ie) {
        a.className = a.className.replace(" hover", "")
    }
    popInfo.style.display = "none"
}

function delayPopUp(a) {
    this.mousex = a.clientX;
    this.mousey = a.clientY
}

function showFileinfo() {
    if (current_row) {
        popInfo.setStyles({
            top: $(current_row).mousey - 20,
            left: $(current_row).mousex + 20
        });
        $(current_row).removeListener("mousemove", delayPopUp);
        if (current_element == "tracklist") {
            popFileinfo($(current_row).id)
        } else {
            if (current_element == "playlist") {
                var a = new Json.Remote("include/controller-playlist.php?action=getPlaylistInfo&value=" + parseInt($(current_row).id.substr(2)), {
                    method: "get",
                    async: "false",
                    onComplete: function(b) {
                        popFileinfo(b[0].file, b[0].Name)
                    }
                }).send()
            }
        }
    }
}

function popFileinfo(a, c) {
    popInfo.innerHTML = "";
    var d = unescape(decodeURI(a));
    if (d.substr(4, 3) == "://") {
        popInfo.innerHTML += "<div style='background-image: url(" + imgpath + "radio.gif)'>" + c + "</div><div style='background-image: url(" + imgpath + "url-info.gif)'>" + d + "</div>"
    } else {
        d = d.split("/");
        for (var b = 0; b < (d.length - 1); b++) {
            popInfo.innerHTML += "<div>" + d[b] + "</div>"
        }
        popInfo.innerHTML += "<div style='background-image: url(" + imgpath + "song-info.gif); border-bottom: 0px;'>" + d[d.length - 1] + "</div>"
    }
    popInfo.style.display = "block"
}

function handleKeys(b, d) {
    if (current_element == "input") {
        return
    }
    var e = (!d) ? new Event(b) : {
        key: d
    };
    if ((e.control) && (e.key == "a")) {
        e.stop()
    }
    if ((current_row) && (current_element == "playlist")) {
        plid = $(current_row).getAttribute("plid");
        plpos = parseInt($(current_row).id.substr(2));
        switch (e.key) {
            case "delete":
                removeSelected();
                break;
            case "up":
                if (plpos > 0) {
                    controllRemote("moveSong", plpos + ":" + (plpos - 1), true, "playlist")
                }
                case "down":
                    if (plpos < (oldStatus.playlistlength - 1)) {
                        controllRemote("moveSong", plpos + ":" + (plpos + 1), true, "playlist")
                    }
                    break;
                case "p":
                    controllRemote("play", $(current_row).getAttribute("plid"), true, "playback");
                    break
        }
    }
    switch (e.key) {
        case "esc":
            if ($("infobox").style.display == "block") {
                $("infobox").style.display = "none"
            }
            if ((current_element == "playlist") || (current_element == "tracklist")) {
                toggleSelected(current_element, true)
            }
            break;
        case "b":
            if ((current_row) && (current_element == "tracklist")) {
                var a = new Ajax("include/controller-plugin.php?plugin=audioplayer&filename=" + $(current_row).id + "&title=" + encodeURIComponent($(current_row).childNodes[0].innerHTML + " &bull; " + $(current_row).childNodes[1].innerHTML), {
                    method: "get",
                    async: "false",
                    onComplete: function(f) {
                        modalBox(f, false, 350, 80)
                    }
                }).request()
            }
            break;
        case "1":
            controllRemote("prevSong", "", true, "playback");
            break;
        case "2":
            togglePlay();
            break;
        case "3":
            controllRemote("nextSong", "", true, "playback");
            break;
        case "r":
            addStream();
            break;
        case "q":
            vol = Math.abs(oldStatus.volume) - 5;
            controllRemote("setVolume", vol, true, "playback");
            break;
        case "w":
            vol = Math.abs(oldStatus.volume) + 5;
            controllRemote("setVolume", vol, true, "playback");
            break;
        case "c":
            if (current_element == "playlist") {
                controllRemote("clear", "", true, "playlist")
            }
            break;
        case "o":
            removeOld();
            break;
        case "n":
            savePlaylist();
            break;
        case "d":
            if ((current_element == "playlist") || (current_element == "tracklist")) {
                toggleSelected(current_element, true)
            }
            break;
        case "s":
        case "a":
            if ((current_element == "playlist") || (current_element == "tracklist")) {
                toggleSelected(current_element, false)
            }
            break;
        case "i":
            if ((current_row) && (current_element == "tracklist")) {
                modalBox("<h1>" + language.file + "</h1><p align='left'>" + unescape(decodeURI($(current_row).id)) + "</p>", true)
            } else {
                if ((plpos) && (current_element == "playlist")) {
                    var c = new Json.Remote("include/controller-playlist.php?action=getPlaylistInfo&value=" + plpos, {
                        method: "get",
                        async: "false",
                        onComplete: function(f) {
                            modalBox("<h1>" + language.file + "</h1><p align='left'>" + unescape(decodeURI(f[0].file)) + "</p>", true)
                        }
                    }).send()
                }
            }
            break;
        case "space":
            if ((current_row) && (current_element == "tracklist")) {
                addSelected()
            }
            break
    }
}

function controllRemote(d, c, e, a) {
    clearTimeout(pingTimer);
    clearTimeout(infoTimer);
    url = "include/controller-" + a + ".php?action=" + d + "&value=";
    url += ("addSong") ? c : encodeURI(c);
    var b = new Json.Remote(url, {
        method: "get",
        async: "false",
        onComplete: function(f) {
            if (f == "error") {
                error = (adminName == "anonymous") ? language.error_allowed : language.error_mpd;
                modalBox("<h3>Error</h3><p>" + error + "</p>", true)
            } else {
                if (e) {
                    pingMPD()
                }
            }
        }
    }).send()
}

function toggleStatus(a) {
    value = (a.className.search(/marked/g) == -1) ? 1 : 0;
    controllRemote(a.id, value, true, "playback")
}

function togglePlay() {
    if (oldStatus.playlistlength > 0) {
        songId = (!oldStatus.songid) ? $("pl0").getAttribute("plid") : oldStatus.songid;
        action = ((!oldStatus.songid) || (oldStatus.state == "stop")) ? "continue" : "pause";
        controllRemote(action, songId, true, "playback")
    }
}

function setCrossfade(b) {
    var a = (b) ? Math.abs(oldStatus.xfade) + 1 : Math.abs(oldStatus.xfade - 1);
    if (a > 20) {
        a = 20
    }
    controllRemote("setCrossfade", a, true, "playback")
}

function addSelected() {
    i = 0;
    $$("#trackTable tbody tr").each(function(a) {
        if (a.className.search("marked") != -1) {
            i++;
            controllRemote("addSong", a.id, false, "playlist");
            $(a).removeClass("marked")
        }
    });
    if (i == 0) {
        controllRemote("addSong", $(current_row).id, false, "playlist")
    }
    pingMPD();
    return i
}

function removeSelected() {
    var a = "";
    $$("#plTable tbody tr").each(function(b) {
        if (b.className.search(/marked/) != -1) {
            a += b.getAttribute("plid") + ":"
        }
    });
    if ((current_row) && (a == "")) {
        a = $(current_row).getAttribute("plid")
    }
    controllRemote("deleteSong", a, false, "playlist");
    pingTimer = setTimeout("pingMPD()", 1000)
}

function removeOld() {
    clearTimeout(pingTimer);
    var a = "";
    $$("#plTable tbody tr").each(function(b) {
        if (parseInt(b.id.substr(2)) < oldStatus.song) {
            a += b.getAttribute("plid") + ":"
        }
    });
    controllRemote("deleteSong", a, false, "playlist");
    pingTimer = setTimeout("pingMPD()", 1000)
}

function toggleSelected(a, b) {
    $$("#" + a + " div table tbody tr").each(function(c) {
        b ? $(c).removeClass("marked") : $(c).addClass("marked")
    })
}

function selectElement(a) {
    if ($("infobox").style.display != "block" && popAdm.closed) {
        $(a).focus();
        $("searchField").blur();
        $("playlistSelect").blur();
        current_element = a
    }
}

function loadPlaylists() {
     return true; 
}

function savePlaylist() {
    modalBox("<h1>" + language.pl_save + "</h1><br /><form id='newPlaylist' action='index.php' method='get'><table class='normTable'><tr><th>" + language.name + "<td><input name='plName' style='width:300px' onclick='this.focus();' onkeydown='current_element=\"input\"'/><tr><td><td><button type='submit' class='positive' />" + language.save + "</button>&nbsp;<button type='reset' class='negative' />" + language.cancel + "</button></table></form>", false);
    $("newPlaylist").addEvent("submit", function(a) {
        new Event(a).stop();
        $("infobox").style.display = "none";
        if (this.plName.value != "") {
            controllRemote("savePlaylist", this.plName.value, false, "playlist");
            loadPlaylists()
        }
    });
    $("newPlaylist").addEvent("reset", function(a) {
        $("infobox").style.display = "none"
    })
}

function addStream() {
    modalBox("<h1>" + language.dialog_radio + "</h1><br/><form id='addURL' action='index.php' method='get'><table class='normTable' style='width:300px'><tr><th width=50>" + language.url + "<td><input name='stream' value='http://' style='width:300px' onclick='this.focus();' onkeydown='current_element=\"input\"'/><tr><td> <td><div style='text-align:right; font-size:10px'>(pls,m3u,asx,xspf,mp3,ogg,url:port)</div><tr><td> <td><button type='submit' class='positive' />" + language.add + "</button>&nbsp;<button type='reset' class='negative' />" + language.cancel + "</button></table></form>", false);
    $("addURL").addEvent("submit", function(b) {
        new Event(b).stop();
        $("infobox").style.display = "none";
        if (this.stream.value != "") {
            url = "include/controller-netradio.php?playlist=" + escape(this.stream.value);
            var a = new Json.Remote(url, {
                onComplete: function(c) {
                    if (!c.error) {
                        controllRemote("addSong", c.url, true, "playlist");
                        loadPlaylists()
                    }
                }
            }).send()
        }
    });
    $("addURL").addEvent("reset", function(a) {
        $("infobox").style.display = "none"
    })
}

function setPlayerStatus(c, b) {
    if ((c.songid != oldStatus.songid) || (!oldStatus.songid)) {
        if (c.playlistlength == 0) {
            $("trackinfo").innerHTML = language.error_notracks
        } else {
            if ($("pl" + c.song)) {
                plTrack = $("pl" + c.song).childNodes;
                trInfo = "# " + c.song + " ... " + language.artist + ": " + plTrack[1].innerHTML + " ... " + language.title + ": " + plTrack[2].innerHTML + " ... " + language.album + ": " + plTrack[3].innerHTML + "... ";
                $("trackinfo").innerHTML = trInfo;
                document.title = "#" + c.song + " : " + plTrack[1].innerHTML + " : " + plTrack[2].innerHTML + " : RelaXX";
                document.title = document.title.replace("&amp;", "&")
            } else {
                $("trackinfo").innerHTML = language.error_notracks;
                document.title = language.error_notracks + " : RelaXX"
            }
            if ($("pl" + oldStatus.song)) {
                $("pl" + oldStatus.song).className = $("pl" + oldStatus.song).className.replace(" playing", "");
                $("pl" + oldStatus.song).childNodes[0].className = ""
            }
            if ($("pl" + c.song)) {
                $("pl" + c.song).className += " playing";
                $("pl" + c.song).childNodes[0].className = "playing"
            }
        }
        $("trackinfo").direction = "right";
        $("trackinfo").direction = "left"
    }
    if ((c.state != oldStatus.state) || (!oldStatus.state)) {
        if (c.state == "play") {
            $("play_button").src = $("play_button").src.replace("play.gif", "pause.gif")
        } else {
            $("play_button").src = $("play_button").src.replace("pause.gif", "play.gif")
        }
    }
    if ((c.random != oldStatus.random) || (!oldStatus.random)) {
        (c.random == 1) ? $("random").addClass("marked"): $("random").removeClass("marked")
    }
    if ((c.repeat != oldStatus.repeat) || (!oldStatus.repeat)) {
        (c.repeat == 1) ? $("repeat").addClass("marked"): $("repeat").removeClass("marked")
    }
    if (c.state == "play") {
        var a = c.time;
        a = a.split(":");
        pos = playPos.toPosition(Math.round((a[0] / a[1]) * 100));
        if ((pos != playPos.step) && (a[1] > 0)) {
            playPos.knob.setStyle(playPos.p, pos)
        }
        if (a[1] == 0) {
            $("remaining").firstChild.nodeValue = "+ " + convertTime(a[0])
        } else {
            $("remaining").firstChild.nodeValue = "- " + convertTime((a[1] - a[0])) + " | " + convertTime(a[1])
        }
    }
    if ((c.volume != oldStatus.volume) || (!oldStatus.volume)) {
        volPos.knob.setStyle(volPos.p, volPos.toPosition(c.volume))
    }
    if ((c.xfade != oldStatus.xfade) || (!oldStatus.xfade)) {
        $("xfade").firstChild.nodeValue = c.xfade
    }
}

function loginOut(openConfig) {
    if (adminName == "anonymous") {
        modalBox("<h1>" + language.login + "</h1><form id='login' action='include/controller-admin.php?openConfig=" + openConfig + "' method='get'><table class='normTable'><tr><th>" + language.username + "<td><input name='admin' value='admin' onclick='this.focus();' onkeydown='current_element=\"input\"'/><br /><tr><th>" + language.password + "<td><input name='password' type='password' onclick='this.focus();' onkeydown='current_element=\"input\"'/><br /><tr><td><td><button type='submit' class='positive' />" + language.login + "</button>&nbsp;<button type='reset' class='negative' />" + language.cancel + "</button></table></form>", false);
        $("login").addEvent("submit", function(e) {
            new Event(e).stop();
            this.send({
                onComplete: function(response) {
                    $("infobox").style.display = "none";
                    var jsonObj = eval(response);
                    if (jsonObj.error) {
                        modalBox("<h3>" + language.error + "</h3><p>" + language.error_password + "</p>", true)
                    } else {
                        adminName = jsonObj.user;
                        $("menu_login").innerHTML = language.logout;
                        (jsonObj.openConfig == "true") ? doAdmin(): modalBox("<h1>" + language.login + "</h1><p>" + language.success_login + "</p>", true)
                    }
                }
            })
        });
        $("login").addEvent("reset", function(e) {
            $("infobox").style.display = "none"
        })
    } else {
        request = new Json.Remote("include/controller-admin.php", {
            onComplete: function() {
                adminName = "anonymous";
                $("menu_login").innerHTML = language.login;
                modalBox("<h1>" + language.logout + "</h1><p>" + language.success_logout + "</p>", true)
            }
        }).send()
    }
}

function doAdmin() {
    if (adminName == "anonymous") {
        loginOut(true)
    } else {
        popAdm = window.open("admin.php", "Administration", "width=400,height=400,scrollbars=1,resizable=1");
        if (popAdm) {
            if (popAdm.opener == null) {
                popAdm.opener = self
            }
        }
    }
}

function convertTime(a) {
    if (Number(a)) {
        m = parseInt(a / 60);
        s = Math.abs(a % 60);
        h = parseInt(m / 60);
        if (h > 0) {
            m = Math.abs(m % 60)
        }
        return (a < 0 ? "-" : "") + (h > 0 ? h + ":" : "") + (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s)
    } else {
        return a
    }
}

function showStats() {
    url = "include/controller-common.php?action=getStatsResponse";
    var a = new Json.Remote(url, {
        method: "get",
        async: "false",
        onComplete: function(b) {
            modalBox(b.text, true)
        }
    }).send()
}

function aboutRelaxx() {
    modalBox("<h1>relaXXPlayer</h1><img src='./images/relaxx.png' align='right' /><p align='left'>version: " + version + " &copy; 2009 <br>Brought to you by Dirk Hoeschen<br>Web: <a href='http://relaxx.sourceforge.net'>relaxx.sourceforge.net</a></p>", true)
}

function modalBox(d, c, b, a) {
    if (!b) {
        b = 490
    }
    if (!a) {
        a = 170
    }
    Wwidth = window.getWidth();
    Wheight = window.getHeight();
    if (Wwidth == 0) {
        Wwidth = document.body.offsetWidth;
        Wheight = document.body.offsetHeight
    }
    $("infobox_content").innerHTML = d;
    $("infobox").style.top = Math.round((Wheight / 2) - (a / 2)) + "px";
    $("infobox").style.left = Math.round((Wwidth / 2) - (b / 2)) + "px";
    $("infobox").style.height = a + "px";
    $("infobox").style.width = b + "px";
    $("infobox_close").style.display = (c == false) ? "none" : "block";
    $("infobox").style.display = "block"
};