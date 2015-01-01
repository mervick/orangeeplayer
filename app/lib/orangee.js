'use strict';

var orangee = {};
var Orangee = {};

orangee.xml2json = function(xml) {
  var x2js = new X2JS();
  return x2js.xml_str2json(xml);
};

orangee.log = function(s) {
  if (orangee.PLATFORM != 'samsung') {
    console.log(s);
  } else {
    alert(s);
  }
};

orangee.debug = function(s) {
  if (orangee.debug_enabled) {
    orangee.log(s);
  }
};

//https://developers.google.com/youtube/iframe_api_reference
orangee._loadYoutubeApi = function() {
  window.onYouTubeIframeAPIReady = function() {
    orangee.debug("onYouTubeIframeAPIReady");
    orangee._youtubeReady = true;
    $(document).trigger("oge-youtubeready");
  };

  var tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
};

//it is better to wait until onYouTubePlayerAPIReady(playerId)
orangee.ytplayer = function _OrangeeJSYTPlayer() {
  this.player = null;
};

orangee.ytplayer.prototype.play = function() {
  this.player.playVideo();
};

orangee.ytplayer.prototype.pause = function() {
  this.player.pauseVideo();
};

orangee.ytplayer.prototype.stop = function() {
  this.player.stopVideo();
};

orangee.ytplayer.prototype.currentTime = function() {
   return this.player.getCurrentTime();
};

orangee.ytplayer.prototype.seek = function(second) {
   return this.player.seekTo(second, true);
};

orangee.ytplayer.prototype.load = function(url, startSeconds, divid, options) {
  var vid = url.split('watch?v=')[1];
  startSeconds = Math.round(startSeconds);// youtube api only takes positive integer

  if (this.player) {
    orangee.debug("orangee.ytplayer#load cueVideoById");
    this.player.cueVideoById(vid, startSeconds);
  } else {
    orangee.debug("orangee.ytplayer#load new iframe");
    var e = document.createElement("iframe");
    //e.width =  options['width'] || '100%'; //viewportwidth will not not consider the size of scroll bar
    //e.height = options['height'] || '100%';
    e.setAttribute("frameborder", 0);
    e.src = "https://www.youtube.com/embed/" + vid + "?enablejsapi=1&fs=0&autohide=0&iv_load_policy=3&rel=0&showinfo=0&start=" +startSeconds;
    if (typeof(options['playsinline']) != 'undefined') {
      e.src += "&playsinline=" + options['playsinline'];
    }
    if (typeof(options['autoplay']) != 'undefined') {
      e.src += "&autoplay=" + options['autoplay'];
    }
    if (typeof(options['controls']) != 'undefined') {
      e.src += "&controls=" + options['controls'];
    }
    /*
    playerVars: {
        'html5': 1,
        'start': startSeconds,
        'autoplay':  options['autoplay'] || 0,
        'playsinline': options['playsinline'] || 0,
        'controls': options['controls'] || 1,
        'fs': options['fs'] || 0,
        'autohide': 0,
        'enablejsapi': 1,
        'iv_load_policy': 3,
        'rel': 0,
        'showinfo': 0,
        'hd': 1
      },*/

    e.id = divid;
    var div = document.getElementById(divid);
    div.parentNode.replaceChild(e, div);

    this.player = new YT.Player(divid, {
      events: {
        /*'onReady': function() {
        },
        'onError': function() {
        },*/
       // does not work on file://
        'onStateChange': function(event) {
          orangee.debug("onStateChange");
          if (event.data == YT.PlayerState.PLAYING && options['onplaying']) {
            options['onplaying']();
          } else if (event.data == YT.PlayerState.PAUSED && options['onpause']) {
            options['onpause']();
          } else if (event.data == YT.PlayerState.ENDED && options['onend']) {
            options['onend']();
          //} else if (event.data == YT.PlayerState.CUED && options['onready']) {
          //  options['onready']();
          }
          /*
           YT.PlayerState.ENDED
           YT.PlayerState.PLAYING
           YT.PlayerState.PAUSED
           YT.PlayerState.BUFFERING
           YT.PlayerState.CUED
           */
        }
      }
    });
  }
};


orangee.connectplayer = function(device) {
  this.device = device;
  this.launchSession = null;
};

orangee.connectplayer.init = function() {
  ConnectSDK.discoveryManager.setCapabilityFilters([
    new ConnectSDK.CapabilityFilter(["MediaPlayer.Display.Video", "MediaControl.Pause"]),
    new ConnectSDK.CapabilityFilter(["Launcher.YouTube.Params"])
  ]);
  //ConnectSDK.discoveryManager.setPairingLevel(ConnectSDK.PairingLevel.ON);
  ConnectSDK.discoveryManager.startDiscovery();
};

orangee.connectplayer.showDevicePicker = function() {
  return ConnectSDK.discoveryManager.pickDevice();
};

orangee.connectplayer.prototype.isReady = function() {
  return this.device.isReady();
};

orangee.connectplayer.prototype.play = function(device) {
  this.device.getMediaControl().play();
};

orangee.connectplayer.prototype.stop = function(device) {
  //this.device.getMediaControl().stop();
  // on lg, have to close youtube app to launch a new one
  if (this.launchSession) {
    this.launchSession.close();
    this.launchSession = null;
  }
  //this.device.getKeyControl().home();
};

orangee.connectplayer.prototype.pause = function(device) {
  this.device.getMediaControl().pause();
  //this.device.KeyControl().ok();
};

orangee.connectplayer.prototype.currentTime = function() {
  return this.device.getMediaControl().getPosition();
};

orangee.connectplayer.prototype.seek = function(second) {
  this.device.getMediaControl().seek(second * 1000);
};

orangee.connectplayer.prototype.load = function(url, startSeconds, divid, options) {
  var self = this;
  if (this.device && this.device.isReady()) {
    var ytid = url.indexOf('youtube.com') > -1 ? url.split('watch?v=')[1] : null;
    var command;
    if (ytid) {
      command = this.device.getLauncher().launchYouTube(ytid + "&t=" + startSeconds).success(function(launchSession) {
        self.launchSession = launchSession;
      });
    } else {
      command = this.device.getMediaPlayer().playMedia(url, "video/mp4").success(function(launchSession) {
        self.launchSession = launchSession;
      });
    }
    command.success(function() {
      self.device.getMediaControl().subscribePlayState().success(function(state) {
        /*
        "unknown"
        "idle"
        "playing"
        "paused"
        "buffering"
        "finished"
        */
        if (state === 'playing' && options['onplaying']) {
          options['onplaying']();
        } else if (state === 'paused' && options['onpause']) {
          options['onpause']();
        } else if (state === 'finished' && options['onend']) {
          options['onend']();
        }
      });
    }).error(function(e) {
      console.log("Launched failed:" + e.message());
    });
  }
};


orangee.html5player = function _OrangeeJSHTML5Player() {
  this.video = null;
};

orangee.html5player.prototype.play = function() {
  this.video.play();
};

orangee.html5player.prototype.pause = function() {
  this.video.pause();
};

orangee.html5player.prototype.stop = function() {
  this.video.pause();
  this.video.src="";
};

orangee.html5player.prototype.currentTime = function() {
  return this.video.currentTime;
};

orangee.html5player.prototype.seek = function(second) {
  this.video.currentTime = second;
};

orangee.html5player.prototype.load = function(url, startSeconds, divid, options) {
  orangee.debug(url);
  if (orangee.PLATFORM === 'samsung' && url.match(/\.m3u8$/) && !url.match(/COMPONENT=HLS$/)) {
    url = url + "?|COMPONENT=HLS";
  }

  if (this.video == null) {
    this.video = document.createElement("video");
    this.video.controls = true;
    //this.video.width = options['width'] || '100%';
    if ((options['playsinline'] || 0) == 1) {
      this.video.setAttribute("webkit-playsinline", "");
    }
    if ((options['autoplay'] || 0) == 1) {
      this.video.autoplay = true;
    }
    this.video.id = divid;

    var div = document.getElementById(divid);
    div.parentNode.replaceChild(this.video, div);

    if (options['onplaying']) {
      this.video.addEventListener("playing", options['onplaying']);
    }
    if (options['onpause']) {
      this.video.addEventListener("pause", options['onpause']);
    }
    if (options['onend']) {
      this.video.addEventListener("ended", options['onend']);
    }
  }
  this.video.src = url;
  this.video.load();
  var self = this;
  this.video.addEventListener("canplay",function() { 
    self.video.currentTime = startSeconds;}
  );
};



orangee.videoplayer = function(options) {
  this.playlist = [];
  this.currentIndex = 0;
  this.currentplayer = null;
  this.connectplayer = null;//this player is special, other players can not coexist
  this.div = null;
  this.device = null;
  options = options || {};
  this.support_youtube = (typeof(options['youtube']) != 'undefined') ? options['youtube'] : 1;
  this.support_samsung = (typeof(options['samsung']) != 'undefined') ? options['samsung'] : 0;
  this.translate_url = options['translate_url'];
  this.playing = false;
};

orangee.videoplayer.prototype.play = function() {
  if (this.connectplayer) {
    var url = this.playlist[this.currentIndex]['url'];
    this.connectplayer.load(url, 0, this.divid, this.options);
  } else if (this.device) {
    this.connectplayer = new orangee.connectplayer(this.device);
    var url = this.playlist[this.currentIndex]['url'];
    this.connectplayer.load(url, 0, this.divid, this.options);
  } else {
    this.currentplayer.play();
  }
  this.playing = true;
};

orangee.videoplayer.prototype.togglePlay = function() {
  if (this.playing) {
    this.pause();
  } else {
    this.play();
  }
};

orangee.videoplayer.prototype.pause = function() {
  if (this.connectplayer) {
    this.connectplayer.pause();
  } else {
    this.currentplayer.pause();
  }
  this.playing = false;
};

orangee.videoplayer.prototype.stop = function() {
  if (this.connectplayer) {
    this.connectplayer.stop();
  } else {
    this.currentplayer.stop();
  }
  this.playing = false;
};

orangee.videoplayer.prototype.currentTime = function() {
  if (this.connectplayer) {
    return this.connectplayer.currentTime();
  } else {
    return this.currentplayer.currentTime();
  }
};

orangee.videoplayer.prototype.seek = function(second) {
  if (this.connectplayer) {
    return this.connectplayer.seek(second);
  } else {
    return this.currentplayer.seek(second);
  }
};

orangee.videoplayer.prototype.currentVideo = function() {
  return this.playlist[this.currentIndex];
};

orangee.videoplayer.prototype.next = function() {
  currentIndex++;
  if (currentIndex >= this.playlist.length) {
    currentIndex = this.playlist.length - 1;
  }
  this.switchVideo(currentIndex);
};

orangee.videoplayer.prototype.prev = function() {
  currentIndex--;
  if (currentIndex < 0) {
    currentIndex = 0;
  }
  this.switchVideo(currentIndex);
};

orangee.videoplayer.prototype.load = function(playlist, divid, options, index, startSeconds) {
  this.playlist = playlist;
  this.divid = divid;
  this.options = options || {};
  this.currentIndex = (typeof index !== 'undefined') ? index : 0;
  startSeconds = (typeof startSeconds !== 'undefined') ? startSeconds : 0;

  var url = this.playlist[this.currentIndex]['url'];
  this._buildPlayer(url, function() {
    if (this.translate_url) {
      var self= this;
      this.translate_url(url, function(err, new_url) {
        self.currentplayer.load(new_url, startSeconds, self.divid, self.options);
      });
    } else {
      this.currentplayer.load(url, startSeconds, this.divid, this.options);
    }
  }.bind(this));
};

orangee.videoplayer.prototype.switchVideo = function(index) {
  this.currentIndex = index;
  var startSeconds = 0;
  
  var url = this.playlist[this.currentIndex]['url'];
  this._buildPlayer(url, function() {
    if (this.device) {
      if (!this.connectplayer) {
        this.connectplayer = new orangee.connectplayer(this.device);
      }
      this.connectplayer.load(url, startSeconds, this.divid, this.options);
      //beamed video always play automatically
    } else {
      if (this.translate_url) {
        url = this.translate_url(url);
      }
      this.currentplayer.load(url, startSeconds, this.divid, this.options);
    }
  }.bind(this));
};

orangee.videoplayer.prototype._buildPlayer = function(url, callback) {
  if (orangee.PLATFORM === 'samsung' && this.support_samsung != 0) {
    if (null == this.currentplayer || this.currentplayer.constructor.name != orangee.samsungplayer.name) {
      this.currentplayer = new orangee.samsungplayer();
      callback();
    }
  } else if (this.support_youtube == 1 && url.indexOf('youtube.com') > -1) {
    if (null == this.currentplayer || this.currentplayer.constructor.name != orangee.ytplayer.name) {
      if (orangee._youtubeReady) {
        this.currentplayer = new orangee.ytplayer();
        callback();
      } else {
        $(document).on('oge-youtubeready', function() {
          orangee.debug('oge-youtubeready');
          this.currentplayer = new orangee.ytplayer();
          callback();
        }.bind(this));
      }
    }
  } else {
    if (null == this.currentplayer || this.currentplayer.constructor.name != orangee.html5player.name){
      this.currentplayer = new orangee.html5player();
      callback();
    }
  }
};

orangee.videoplayer.prototype.init_connectsdk = function() {
  orangee.connectplayer.init();
};

orangee.videoplayer.prototype.showDevicePicker = function(callback) {
  var self = this;
  orangee.connectplayer.showDevicePicker().success(function(device) {
    self.device = device;
    device.connect();
    if (typeof callback === "function") {
      callback(device);
    }
  });
};

orangee.videoplayer.prototype.disconnect = function() {
  if (this.connectplayer) {
    this.connectplayer = null;
  }
  if (this.device) {
    this.device.disconnect();
    this.device = null;
  }
};

/**
 * OpenFB is a micro-library that lets you integrate your JavaScript application with Facebook.
 * OpenFB works for both BROWSER-BASED apps and CORDOVA/PHONEGAP apps.
 * This library has no dependency: You don't need (and shouldn't use) the Facebook SDK with this library. Whe running in
 * Cordova, you also don't need the Facebook Cordova plugin. There is also no dependency on jQuery.
 * OpenFB allows you to login to Facebook and execute any Facebook Graph API request.
 * @author Christophe Coenraets @ccoenraets
 * @version 0.4
 */
var openFB = (function () {

    var FB_LOGIN_URL = 'https://www.facebook.com/dialog/oauth',
        FB_LOGOUT_URL = 'https://www.facebook.com/logout.php',

        // By default we store fbtoken in sessionStorage. This can be overridden in init()
        tokenStore = window.sessionStorage,

        fbAppId,

        context = window.location.pathname.substring(0, window.location.pathname.indexOf("/",2)),

        baseURL = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '') + context,

        oauthRedirectURL = baseURL + '/oauthcallback.html',

        logoutRedirectURL = baseURL + '/logoutcallback.html',

        // Because the OAuth login spans multiple processes, we need to keep the login callback function as a variable
        // inside the module instead of keeping it local within the login function.
        loginCallback,

        // Indicates if the app is running inside Cordova
        runningInCordova,

        // Used in the exit event handler to identify if the login has already been processed elsewhere (in the oauthCallback function)
        loginProcessed;

    console.log(oauthRedirectURL);
    console.log(logoutRedirectURL);

    document.addEventListener("deviceready", function () {
        runningInCordova = true;
    }, false);

    /**
     * Initialize the OpenFB module. You must use this function and initialize the module with an appId before you can
     * use any other function.
     * @param params - init paramters
     *  appId: The id of the Facebook app,
     *  tokenStore: The store used to save the Facebook token. Optional. If not provided, we use sessionStorage.
     */
    function init(params) {
        if (params.appId) {
            fbAppId = params.appId;
        } else {
            throw 'appId parameter not set in init()';
        }

        if (params.tokenStore) {
            tokenStore = params.tokenStore;
        }
    }

    /**
     * Checks if the user has logged in with openFB and currently has a session api token.
     * @param callback the function that receives the loginstatus
     */
    function getLoginStatus(callback) {
        var token = tokenStore['fbtoken'],
            loginStatus = {};
        if (token) {
            loginStatus.status = 'connected';
            loginStatus.authResponse = {token: token};
        } else {
            loginStatus.status = 'unknown';
        }
        if (callback) callback(loginStatus);
    }

    /**
     * Login to Facebook using OAuth. If running in a Browser, the OAuth workflow happens in a a popup window.
     * If running in Cordova container, it happens using the In-App Browser. Don't forget to install the In-App Browser
     * plugin in your Cordova project: cordova plugins add org.apache.cordova.inappbrowser.
     *
     * @param callback - Callback function to invoke when the login process succeeds
     * @param options - options.scope: The set of Facebook permissions requested
     * @returns {*}
     */
    function login(callback, options) {

        var loginWindow,
            startTime,
            scope = '';

        if (!fbAppId) {
            return callback({status: 'unknown', error: 'Facebook App Id not set.'});
        }

        // Inappbrowser load start handler: Used when running in Cordova only
        function loginWindow_loadStartHandler(event) {
            var url = event.url;
            if (url.indexOf("access_token=") > 0 || url.indexOf("error=") > 0) {
                // When we get the access token fast, the login window (inappbrowser) is still opening with animation
                // in the Cordova app, and trying to close it while it's animating generates an exception. Wait a little...
                var timeout = 600 - (new Date().getTime() - startTime);
                setTimeout(function () {
                    loginWindow.close();
                }, timeout > 0 ? timeout : 0);
                oauthCallback(url);
            }
        }

        // Inappbrowser exit handler: Used when running in Cordova only
        function loginWindow_exitHandler() {
            console.log('exit and remove listeners');
            // Handle the situation where the user closes the login window manually before completing the login process
            deferredLogin.reject({error: 'user_cancelled', error_description: 'User cancelled login process', error_reason: "user_cancelled"});
            loginWindow.removeEventListener('loadstop', loginWindow_loadStartHandler);
            loginWindow.removeEventListener('exit', loginWindow_exitHandler);
            loginWindow = null;
            console.log('done removing listeners');
        }

        if (options && options.scope) {
            scope = options.scope;
        }

        loginCallback = callback;
        loginProcessed = false;

//        logout();

        if (runningInCordova) {
            oauthRedirectURL = "https://www.facebook.com/connect/login_success.html";
        }

        startTime = new Date().getTime();
        loginWindow = window.open(FB_LOGIN_URL + '?client_id=' + fbAppId + '&redirect_uri=' + oauthRedirectURL +
            '&response_type=token&scope=' + scope, '_blank', 'location=no');

        // If the app is running in Cordova, listen to URL changes in the InAppBrowser until we get a URL with an access_token or an error
        if (runningInCordova) {
            loginWindow.addEventListener('loadstart', loginWindow_loadStartHandler);
            loginWindow.addEventListener('exit', loginWindow_exitHandler);
        }
        // Note: if the app is running in the browser the loginWindow dialog will call back by invoking the
        // oauthCallback() function. See oauthcallback.html for details.

    }

    /**
     * Called either by oauthcallback.html (when the app is running the browser) or by the loginWindow loadstart event
     * handler defined in the login() function (when the app is running in the Cordova/PhoneGap container).
     * @param url - The oautchRedictURL called by Facebook with the access_token in the querystring at the ned of the
     * OAuth workflow.
     */
    function oauthCallback(url) {
        // Parse the OAuth data received from Facebook
        var queryString,
            obj;

        loginProcessed = true;
        if (url.indexOf("access_token=") > 0) {
            queryString = url.substr(url.indexOf('#') + 1);
            obj = parseQueryString(queryString);
            tokenStore['fbtoken'] = obj['access_token'];
            if (loginCallback) loginCallback({status: 'connected', authResponse: {token: obj['access_token']}});
        } else if (url.indexOf("error=") > 0) {
            queryString = url.substring(url.indexOf('?') + 1, url.indexOf('#'));
            obj = parseQueryString(queryString);
            if (loginCallback) loginCallback({status: 'not_authorized', error: obj.error});
        } else {
            if (loginCallback) loginCallback({status: 'not_authorized'});
        }
    }

    /**
     * Logout from Facebook, and remove the token.
     * IMPORTANT: For the Facebook logout to work, the logoutRedirectURL must be on the domain specified in "Site URL" in your Facebook App Settings
     *
     */
    function logout(callback) {
        var logoutWindow,
            token = tokenStore['fbtoken'];

        /* Remove token. Will fail silently if does not exist */
        tokenStore.removeItem('fbtoken');

        if (token) {
            logoutWindow = window.open(FB_LOGOUT_URL + '?access_token=' + token + '&next=' + logoutRedirectURL, '_blank', 'location=no');
            if (runningInCordova) {
                setTimeout(function() {
                    logoutWindow.close();
                }, 700);
            }
        }

        if (callback) {
            callback();
        }

    }

    /**
     * Lets you make any Facebook Graph API request.
     * @param obj - Request configuration object. Can include:
     *  method:  HTTP method: GET, POST, etc. Optional - Default is 'GET'
     *  path:    path in the Facebook graph: /me, /me.friends, etc. - Required
     *  params:  queryString parameters as a map - Optional
     *  success: callback function when operation succeeds - Optional
     *  error:   callback function when operation fails - Optional
     */
    function api(obj) {

        var method = obj.method || 'GET',
            params = obj.params || {},
            xhr = new XMLHttpRequest(),
            url;

        params['access_token'] = tokenStore['fbtoken'];

        url = 'https://graph.facebook.com' + obj.path + '?' + toQueryString(params);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    if (obj.success) obj.success(JSON.parse(xhr.responseText));
                } else {
                    var error = xhr.responseText ? JSON.parse(xhr.responseText).error : {message: 'An error has occurred'};
                    if (obj.error) obj.error(error);
                }
            }
        };

        xhr.open(method, url, true);
        xhr.send();
    }

    /**
     * Helper function to de-authorize the app
     * @param success
     * @param error
     * @returns {*}
     */
    function revokePermissions(success, error) {
        return api({method: 'DELETE',
            path: '/me/permissions',
            success: function () {
                tokenStore['fbtoken'] = undefined;
                success();
            },
            error: error});
    }

    function parseQueryString(queryString) {
        var qs = decodeURIComponent(queryString),
            obj = {},
            params = qs.split('&');
        params.forEach(function (param) {
            var splitter = param.split('=');
            obj[splitter[0]] = splitter[1];
        });
        return obj;
    }

    function toQueryString(obj) {
        var parts = [];
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                parts.push(encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]));
            }
        }
        return parts.join("&");
    }

    // The public API
    return {
        init: init,
        login: login,
        logout: logout,
        revokePermissions: revokePermissions,
        api: api,
        oauthCallback: oauthCallback,
        getLoginStatus: getLoginStatus
    }

}());
function X2JS(v){var q="1.1.5";v=v||{};h();r();function h(){if(v.escapeMode===undefined){v.escapeMode=true;}v.attributePrefix=v.attributePrefix||"_";v.arrayAccessForm=v.arrayAccessForm||"none";v.emptyNodeForm=v.emptyNodeForm||"text";if(v.enableToStringFunc===undefined){v.enableToStringFunc=true;}v.arrayAccessFormPaths=v.arrayAccessFormPaths||[];if(v.skipEmptyTextNodesForObj===undefined){v.skipEmptyTextNodesForObj=true;}if(v.stripWhitespaces===undefined){v.stripWhitespaces=true;}v.datetimeAccessFormPaths=v.datetimeAccessFormPaths||[];}var g={ELEMENT_NODE:1,TEXT_NODE:3,CDATA_SECTION_NODE:4,COMMENT_NODE:8,DOCUMENT_NODE:9};function r(){function x(z){var y=String(z);if(y.length===1){y="0"+y;}return y;}if(typeof String.prototype.trim!=="function"){String.prototype.trim=function(){return this.replace(/^\s+|^\n+|(\s|\n)+$/g,"");};}if(typeof Date.prototype.toISOString!=="function"){Date.prototype.toISOString=function(){return this.getUTCFullYear()+"-"+x(this.getUTCMonth()+1)+"-"+x(this.getUTCDate())+"T"+x(this.getUTCHours())+":"+x(this.getUTCMinutes())+":"+x(this.getUTCSeconds())+"."+String((this.getUTCMilliseconds()/1000).toFixed(3)).slice(2,5)+"Z";};}}function t(x){var y=x.localName;if(y==null){y=x.baseName;}if(y==null||y==""){y=x.nodeName;}return y;}function o(x){return x.prefix;}function p(x){if(typeof(x)=="string"){return x.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;").replace(/\//g,"&#x2F;");}else{return x;}}function j(x){return x.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#x27;/g,"'").replace(/&#x2F;/g,"/");}function l(B,y,A){switch(v.arrayAccessForm){case"property":if(!(B[y] instanceof Array)){B[y+"_asArray"]=[B[y]];}else{B[y+"_asArray"]=B[y];}break;}if(!(B[y] instanceof Array)&&v.arrayAccessFormPaths.length>0){var x=0;for(;x<v.arrayAccessFormPaths.length;x++){var z=v.arrayAccessFormPaths[x];if(typeof z==="string"){if(z==A){break;}}else{if(z instanceof RegExp){if(z.test(A)){break;}}else{if(typeof z==="function"){if(z(B,y,A)){break;}}}}}if(x!=v.arrayAccessFormPaths.length){B[y]=[B[y]];}}}function a(C){var A=C.split(/[-T:+Z]/g);var B=new Date(A[0],A[1]-1,A[2]);var z=A[5].split(".");B.setHours(A[3],A[4],z[0]);if(z.length>1){B.setMilliseconds(z[1]);}if(A[6]&&A[7]){var y=A[6]*60+Number(A[7]);var x=/\d\d-\d\d:\d\d$/.test(C)?"-":"+";y=0+(x=="-"?-1*y:y);B.setMinutes(B.getMinutes()-y-B.getTimezoneOffset());}else{if(C.indexOf("Z",C.length-1)!==-1){B=new Date(Date.UTC(B.getFullYear(),B.getMonth(),B.getDate(),B.getHours(),B.getMinutes(),B.getSeconds(),B.getMilliseconds()));}}return B;}function n(A,y,z){if(v.datetimeAccessFormPaths.length>0){var B=z.split(".#")[0];var x=0;for(;x<v.datetimeAccessFormPaths.length;x++){var C=v.datetimeAccessFormPaths[x];if(typeof C==="string"){if(C==B){break;}}else{if(C instanceof RegExp){if(C.test(B)){break;}}else{if(typeof C==="function"){if(C(obj,y,B)){break;}}}}}if(x!=v.datetimeAccessFormPaths.length){return a(A);}else{return A;}}else{return A;}}function w(z,E){if(z.nodeType==g.DOCUMENT_NODE){var F=new Object;var x=z.childNodes;for(var G=0;G<x.length;G++){var y=x.item(G);if(y.nodeType==g.ELEMENT_NODE){var D=t(y);F[D]=w(y,D);}}return F;}else{if(z.nodeType==g.ELEMENT_NODE){var F=new Object;F.__cnt=0;var x=z.childNodes;for(var G=0;G<x.length;G++){var y=x.item(G);var D=t(y);if(y.nodeType!=g.COMMENT_NODE){F.__cnt++;if(F[D]==null){F[D]=w(y,E+"."+D);l(F,D,E+"."+D);}else{if(F[D]!=null){if(!(F[D] instanceof Array)){F[D]=[F[D]];l(F,D,E+"."+D);}}(F[D])[F[D].length]=w(y,E+"."+D);}}}for(var A=0;A<z.attributes.length;A++){var B=z.attributes.item(A);F.__cnt++;F[v.attributePrefix+B.name]=B.value;}var C=o(z);if(C!=null&&C!=""){F.__cnt++;F.__prefix=C;}if(F["#text"]!=null){F.__text=F["#text"];if(F.__text instanceof Array){F.__text=F.__text.join("\n");}if(v.escapeMode){F.__text=j(F.__text);}if(v.stripWhitespaces){F.__text=F.__text.trim();}delete F["#text"];if(v.arrayAccessForm=="property"){delete F["#text_asArray"];}F.__text=n(F.__text,D,E+"."+D);}if(F["#cdata-section"]!=null){F.__cdata=F["#cdata-section"];delete F["#cdata-section"];if(v.arrayAccessForm=="property"){delete F["#cdata-section_asArray"];}}if(F.__cnt==1&&F.__text!=null){F=F.__text;}else{if(F.__cnt==0&&v.emptyNodeForm=="text"){F="";}else{if(F.__cnt>1&&F.__text!=null&&v.skipEmptyTextNodesForObj){if((v.stripWhitespaces&&F.__text=="")||(F.__text.trim()=="")){delete F.__text;}}}}delete F.__cnt;if(v.enableToStringFunc&&(F.__text!=null||F.__cdata!=null)){F.toString=function(){return(this.__text!=null?this.__text:"")+(this.__cdata!=null?this.__cdata:"");};}return F;}else{if(z.nodeType==g.TEXT_NODE||z.nodeType==g.CDATA_SECTION_NODE){return z.nodeValue;}}}}function m(E,B,D,y){var A="<"+((E!=null&&E.__prefix!=null)?(E.__prefix+":"):"")+B;if(D!=null){for(var C=0;C<D.length;C++){var z=D[C];var x=E[z];if(v.escapeMode){x=p(x);}A+=" "+z.substr(v.attributePrefix.length)+"='"+x+"'";}}if(!y){A+=">";}else{A+="/>";}return A;}function i(y,x){return"</"+(y.__prefix!=null?(y.__prefix+":"):"")+x+">";}function s(y,x){return y.indexOf(x,y.length-x.length)!==-1;}function u(y,x){if((v.arrayAccessForm=="property"&&s(x.toString(),("_asArray")))||x.toString().indexOf(v.attributePrefix)==0||x.toString().indexOf("__")==0||(y[x] instanceof Function)){return true;}else{return false;}}function k(z){var y=0;if(z instanceof Object){for(var x in z){if(u(z,x)){continue;}y++;}}return y;}function b(z){var y=[];if(z instanceof Object){for(var x in z){if(x.toString().indexOf("__")==-1&&x.toString().indexOf(v.attributePrefix)==0){y.push(x);}}}return y;}function f(y){var x="";if(y.__cdata!=null){x+="<![CDATA["+y.__cdata+"]]>";}if(y.__text!=null){if(v.escapeMode){x+=p(y.__text);}else{x+=y.__text;}}return x;}function c(y){var x="";if(y instanceof Object){x+=f(y);}else{if(y!=null){if(v.escapeMode){x+=p(y);}else{x+=y;}}}return x;}function e(z,B,A){var x="";if(z.length==0){x+=m(z,B,A,true);}else{for(var y=0;y<z.length;y++){x+=m(z[y],B,b(z[y]),false);x+=d(z[y]);x+=i(z[y],B);}}return x;}function d(D){var x="";var B=k(D);if(B>0){for(var A in D){if(u(D,A)){continue;}var z=D[A];var C=b(z);if(z==null||z==undefined){x+=m(z,A,C,true);}else{if(z instanceof Object){if(z instanceof Array){x+=e(z,A,C);}else{if(z instanceof Date){x+=m(z,A,C,false);x+=z.toISOString();x+=i(z,A);}else{var y=k(z);if(y>0||z.__text!=null||z.__cdata!=null){x+=m(z,A,C,false);x+=d(z);x+=i(z,A);}else{x+=m(z,A,C,true);}}}}else{x+=m(z,A,C,false);x+=c(z);x+=i(z,A);}}}}x+=c(D);return x;}this.parseXmlString=function(z){var B=window.ActiveXObject||"ActiveXObject" in window;if(z===undefined){return null;}var A;if(window.DOMParser){var C=new window.DOMParser();var x=null;if(!B){try{x=C.parseFromString("INVALID","text/xml").childNodes[0].namespaceURI;}catch(y){x=null;}}try{A=C.parseFromString(z,"text/xml");if(x!=null&&A.getElementsByTagNameNS(x,"parsererror").length>0){A=null;}}catch(y){A=null;}}else{if(z.indexOf("<?")==0){z=z.substr(z.indexOf("?>")+2);}A=new ActiveXObject("Microsoft.XMLDOM");A.async="false";A.loadXML(z);}return A;};this.asArray=function(x){if(x instanceof Array){return x;}else{return[x];}};this.toXmlDateTime=function(x){if(x instanceof Date){return x.toISOString();}else{if(typeof(x)==="number"){return new Date(x).toISOString();}else{return null;}}};this.asDateTime=function(x){if(typeof(x)=="string"){return a(x);}else{return x;}};this.xml2json=function(x){return w(x);};this.xml_str2json=function(x){var y=this.parseXmlString(x);if(y!=null){return this.xml2json(y);}else{return null;}};this.json2xml_str=function(x){return d(x);};this.json2xml=function(y){var x=this.json2xml_str(y);return this.parseXmlString(x);};this.getVersion=function(){return q;};}
//https://raw.githubusercontent.com/Puppets/marionette-cookbook/master/recipes/hotkeys/util.js
;(function(root, $) {
   var valid_modifiers = ['alt', 'ctrl', 'meta', 'shift'];

    var eventsNamespace = {};

    var keyMatches = function(e, key) {
        return String.fromCharCode(e.which).toLowerCase() == key
            || orangee.KEYS[e.which] == key;
    };

    var modifierMatches = function(e, modifiers) {
        var hasModifier = function(m) {
            return e[m + 'Key'];
        };

        return _.chain(modifiers)
                .intersection(valid_modifiers)
                .all(hasModifier)
                .value();
    };

    var matches = function(e, key, modifiers) {
        return keyMatches(e, key)
            && modifierMatches(e, modifiers);
    };

    var buildHandler = function(key, modifiers, callback) {
        return function(e) {
            if (/textarea|select/i.test(e.target.nodeName) || e.target.type === "text") {
                return;
            }

            if (matches(e, key, modifiers)) {
                e.stopPropagation();
                e.preventDefault();
                callback(arguments);
            }
        };
    };

    var bind = function(events, context, namespace) {
        _.each(events, function(method, trigger) {
            if (_.isFunction(context[method])) {
                var parts = trigger.split(/\s*\+\s*/),
                    key = _.last(parts),
                    modifiers = _.initial(parts),
                    callback = _.bind(context[method], context);

                    if (eventsNamespace[namespace]) {
                      eventsNamespace[namespace].push(buildHandler(key, modifiers, callback));
                    } else {
                      eventsNamespace[namespace] = [buildHandler(key, modifiers, callback)];
                    }
            }
        });
        return context;
    };

    var unbind = function (events, context, namespace) {
        delete eventsNamespace[namespace];
    };

    var onKeydown = function() {
        _.each(eventsNamespace, function(namespace) {
          _.each(namespace, function(callback) {
            if (orangee.PLATFORM === 'samsung') {
              if (orangee.KEYS[event.keyCode] === 'back') {
                orangee._samsungWidgetAPI.blockNavigation(event);//does not work with keyup
              } else if (orangee.KEYS[event.keyCode] === 'exit') {
                orangee._samsungWidgetAPI.blockNavigation(event);
                orangee._samsungWidgetAPI.sendReturnEvent();
              }
            }
            callback(event);
          });
        });
    };

    $(document).on('keydown', onKeydown);
    //<a href="javascript:void(0);" id="orangeeKeyboardAnchor" onkeydown="HotKeys.onKeydown();"></a>
    //document.getElementById("orangeeKeyboardAnchor").focus();

    root.HotKeys = {
        'bind': bind,
        'unbind': unbind,
        //'onKeydown': onKeydown,
    };
}(window, $))

//http://stackoverflow.com/questions/4692245/html5-local-storage-fallback-solutions
orangee.storage = {
    localStoreSupport: function() {
        try {
            return 'localStorage' in window && window['localStorage'] !== null;
        } catch (e) {
            return false;
        }
    },
    set: function(name,value,days) {
        if (days) {
            var date = new Date();
            date.setTime(date.getTime()+(days*24*60*60*1000));
            var expires = "; expires="+date.toGMTString();
        }
        else {
            var expires = "";
        }
        if( this.localStoreSupport() ) {
            localStorage.setItem(name, value);
        }
        else {
            document.cookie = name+"="+value+expires+"; path=/";
        }
    },
    get: function(name) {
        if( this.localStoreSupport() ) {
            var ret = localStorage.getItem(name);
            //console.log(typeof ret);
            switch (ret) {
              case 'true': 
                  return true;
              case 'false':
                  return false;
              default:
                  return ret;
            }
        }
        else {
            var nameEQ = name + "=";
            var ca = document.cookie.split(';');
            for(var i=0;i < ca.length;i++) {
                var c = ca[i];
                while (c.charAt(0)==' ') c = c.substring(1,c.length);
                if (c.indexOf(nameEQ) == 0) {
                    var ret = c.substring(nameEQ.length,c.length);
                    switch (ret) {
                      case 'true': 
                          return true;
                      case 'false':
                          return false;
                      default:
                          return ret;
                    }
                }
            }
            return null;
        }
    },
    del: function(name) {
        if( this.localStoreSupport() ) {
            localStorage.removeItem(name);
        }
        else {
            this.set(name,"",-1);
        }
    }
};

orangee.PLATFORM = "html5";

//http://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
orangee.KEYS = {
  13: 'enter',
  37: 'left',
  39: 'right',
  38: 'up',
  40: 'down',
  32: 'play',
  27: 'back',
};

/*
    KEY_TOOLS:1,
    KEY_MUTE:1,
    KEY_RETURN:27,
    KEY_UP:38,
    KEY_DOWN:40,
    KEY_LEFT:37,
    KEY_RIGHT:39,
    KEY_WHEELDOWN:1,
    KEY_WHEELUP:1,
    KEY_ENTER:13,
    KEY_INFO:1,
    KEY_EXIT:27,
    KEY_RED:65,
    KEY_GREEN:66,
    KEY_YELLOW:67,
    KEY_BLUE:68,
    KEY_INFOLINK:1,
    KEY_RW:1,
    KEY_PAUSE:32,
    KEY_FF:1,
    KEY_PLAY:32,
    KEY_STOP:32,
    KEY_1:49,
    KEY_2:50,
    KEY_3:51,
    KEY_4:52,
    KEY_5:53,
    KEY_6:54,
    KEY_7:55,
    KEY_8:56,
    KEY_9:57,
    KEY_0:48,
    KEY_EMPTY:32,
    KEY_PRECH:1,
    KEY_SOURCE:1,
    KEY_CHLIST:1,
    KEY_MENU:112,//f1
    KEY_WLINK:1,
    KEY_CC:1,
    KEY_CONTENT:1,
    KEY_FAVCH:1,
    KEY_REC:1,
    KEY_EMODE:1,
    KEY_DMA:1,
    KEY_PANEL_CH_UP:1,
    KEY_PANEL_CH_DOWN:1,
    KEY_PANEL_VOL_UP:1,
    KEY_PANEL_VOL_DOWN:1,
    KEY_PANEL_ENTER:1,
    KEY_PANEL_SOURCE:1,
    KEY_PANEL_MENU:1,
    KEY_PANEL_POWER:1
*/

orangee.init = function(callback) {
};

