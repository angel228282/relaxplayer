contextMenu=new Class({options:{selector:".contextmenu",className:".protoMenu",pageOffset:25,title:false,marktarget:true},initialize:function(a){this.setOptions(a);this.cont=new Element("div",{"class":this.options.className});if(this.options.title){this.cont.adopt(new Element("div",{"class":"title"}).setHTML(this.options.title))}this.options.menuItems.each(function(c){var b=(c.icon)?"url("+imgpath+c.icon+".gif)":"url("+imgpath+"clean.gif)";this.cont.adopt(c.separator?new Element("div",{"class":"separator"}):new Element("a",{styles:{backgroundImage:b},href:"#",title:c.name,"class":c.disabled?"disabled":""}).addEvent("click",this.onClick.bindWithEvent(this,[c.callback])).setHTML(c.name))}.bind(this));this.cont.style.display="none";$(document.body).adopt(this.cont);document.addEvents({click:this.hide.bind(this),contextmenu:this.hide.bind(this)});$(this.options.selector).addEvent(window.opera?"mousedown":"contextmenu",function(b){this.show(b)}.bind(this))},hide:function(){this.cont.style.display="none";if(this.marked){this.marked.className=this.marked.className.replace(" hover","");current_row=this.marked;this.marked=false}},show:function(c){e=new Event(c);if(window.opera&&!e.rightClick){return}e.cancelBubble=true;e.stop();if(this.marked){this.marked.className=this.marked.className.replace(" hover","")}if((this.options.marktarget)&&(e.target.tagName=="TD")){this.marked=e.target.parentNode;this.marked.className+=" hover"}var a=this.cont.getCoordinates(),b={height:window.getHeight(),width:window.getWidth(),top:window.getScrollTop(),cW:a.width,cH:a.height};if(b.width==0){b.width=document.body.offsetWidth;b.height=document.body.offsetHeight}this.cont.setStyles({left:((e.page.x+b.cW+this.options.pageOffset)>b.width?(b.width-b.cW-this.options.pageOffset):e.page.x),top:((e.page.y-b.top+b.cH)>b.height&&(e.page.y-b.top)>b.cH?(e.page.y-b.cH):e.page.y)});this.cont.style.display="block"},onClick:function(b,a){if(a&&!b.target.hasClass("disabled")){this.hide()}a()}});contextMenu.implement(new Options());window.addEvent("domready",function(){var c=[{name:language.menu_play_current,icon:"playback",callback:function(){controllRemote("play",$(current_row).attributes.plid.nodeValue,true,"playback")}},{name:language.menu_up,icon:"up",callback:function(){current_element="playlist";handleKeys(null,"up")}},{name:language.menu_down,icon:"down",callback:function(){current_element="playlist";handleKeys(null,"down")}},{separator:true},{name:language.menu_select,icon:"select",callback:function(){toggleSelected("playlist",false)}},{name:language.menu_deselect,icon:"deselect",callback:function(){toggleSelected("playlist",true)}},{name:language.menu_rem_selected,icon:"cut",callback:function(){removeSelected()}},{separator:true},{name:language.menu_radio,icon:"radio",callback:function(){addStream()}},{name:language.menu_savepl,icon:"save",callback:function(){savePlaylist()}},{name:language.menu_clear_old,icon:"clean",callback:function(){removeOld()}},{name:language.menu_clear,icon:"delete",callback:function(){controllRemote("clear","",true,"playlist")}}];var b=new contextMenu({selector:"playlist",className:"ccmenu",fade:false,title:language.playlist,menuItems:c});var d=[{name:language.menu_select,icon:"select",callback:function(){toggleSelected("tracklist",false)}},{name:language.menu_deselect,icon:"deselect",callback:function(){toggleSelected("tracklist",true)}},{separator:true},{name:language.menu_append,icon:"append",callback:function(){addSelected()}},{separator:true}];var a=new contextMenu({selector:"tracklist",className:"ccmenu",fade:false,title:language.tab_tracks,menuItems:d})});