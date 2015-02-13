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

orangee._loadDailymotionApi = function() {
  window.dmAsyncInit = function() {
    //DM.init({apiKey: 'your app id', status: true, cookie: true});
    orangee.debug("onYouTubeIframeAPIReady");
    orangee._dailymotionReady = true;
    $(document).trigger("oge-dailymotionready");
  };
  var e = document.createElement('script'); e.async = true;
  e.src = 'http://api.dmcdn.net/all.js';
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(e, s);
};

orangee._findYoutubeId = function(urlString) {
  if (window.url('domain', urlString) === "youtube.com") {
    return window.url('?v', urlString);
  } else if (window.url('domain', urlString) === "youtu.be") {
    return window.url('file', urlString);
  }

  return null;
};

orangee._findDailymotionId = function(urlString) {
  return window.url('file', urlString);
};

orangee.ytplayer = function _OrangeeJSYTPlayer() {
  this.player = null;
  this.support_translate = false;
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
  var vid = orangee._findYoutubeId(url);
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
    e.setAttribute("class", div.getAttribute("class"));
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


orangee.dmplayer = function _OrangeeJSDMplayer() {
  this.player = null;
  this.support_translate = false;
};

orangee.dmplayer.prototype.play = function() {
  this.player.play();
};

orangee.dmplayer.prototype.pause = function() {
  this.player.pause();
};

orangee.dmplayer.prototype.stop = function() {
  this.player.pause();
};

orangee.dmplayer.prototype.currentTime = function() {
   return this.player.currentTime;
};

orangee.dmplayer.prototype.seek = function(second) {
   return this.player.seek(second);
};

orangee.dmplayer.prototype.load = function(url, startSeconds, divid, options) {
  var vid = orangee._findDailymotionId(url);
  startSeconds = Math.round(startSeconds);

  if (this.player) {
    orangee.debug("orangee.dmplayer#load");
    this.player.load(vid);
  } else {
    orangee.debug("orangee.dmplayer#load new iframe");

    var div = document.getElementById(divid);

    this.player = new DM.player(div, {video: vid, params: {autoplay: (options['autoplay'] || 0)}});

    if (options['onplaying']) {
      this.player.addEventListener("playing", options['onplaying']);
    }
    if (options['onpause']) {
      this.player.addEventListener("pause", options['onpause']);
    }
    if (options['onend']) {
      this.player.addEventListener("ended", options['onend']);
    }
  }

  var self = this;
  this.player.addEventListener("canplay",function() { 
    self.player.currentTime = startSeconds;
  });
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
  this.support_translate = true;
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
    this.video.setAttribute("class", div.getAttribute("class"));
    this.video.setAttribute("poster", div.getAttribute("poster"));
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
    self.video.currentTime = startSeconds;
  });
};



orangee.videoplayer = function(options) {
  this.playlist = [];
  this.currentIndex = 0;
  this.currentplayer = null;
  this.connectplayer = null;//this player is special, other players can not coexist
  this.div = null;
  this.device = null;
  options = options || {};
  this.support_youtube = (typeof(options['youtube']) != 'undefined') ? options['youtube'] : true;
  this.support_dailymotion = (typeof(options['dailymotion']) != 'undefined') ? options['dailymotion'] : true;
  this.support_samsung = (typeof(options['samsung']) != 'undefined') ? options['samsung'] : false;
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
  orangee.disableScreenSaver();
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
  orangee.enableScreenSaver();
};

orangee.videoplayer.prototype.stop = function() {
  if (this.connectplayer) {
    this.connectplayer.stop();
  } else {
    this.currentplayer.stop();
  }
  this.playing = false;
  orangee.enableScreenSaver();
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
    if (this.currentplayer.support_translate && this.translate_url) {
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
      if (this.currentplayer.support_translate && this.translate_url) {
        var self= this;
        this.translate_url(url, function(err, new_url) {
          self.currentplayer.load(new_url, startSeconds, self.divid, self.options);
        });
      } else {
        this.currentplayer.load(url, startSeconds, this.divid, this.options);
      }
    }
  }.bind(this));
};

orangee.videoplayer.prototype._buildPlayer = function(url, callback) {
  if (orangee.PLATFORM === 'samsung' && this.support_samsung) {
    if (null == this.currentplayer || this.currentplayer.constructor.name != orangee.samsungplayer.name) {
      this.currentplayer = new orangee.samsungplayer();
      callback();
    }
  } else if (this.support_youtube && (url.indexOf('youtube.com') > -1 || url.indexOf('youtu.be') > -1)) {
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
  } else if (this.support_dailymotion && url.indexOf('dailymotion.com') > -1) {
    if (null == this.currentplayer || this.currentplayer.constructor.name != orangee.dmplayer.name) {
      if (orangee._dailymotionReady) {
        this.currentplayer = new orangee.dmplayer();
        callback();
      } else {
        $(document).on('oge-dailymotionready', function() {
          orangee.debug('oge-dailymotionready');
          this.currentplayer = new orangee.dmplayer();
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

    orangee.debug(oauthRedirectURL);
    orangee.debug(logoutRedirectURL);

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
(function(root, $) {
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
              } /*else if (orangee.KEYS[event.keyCode] === 'exit') {
                orangee._samsungWidgetAPI.blockNavigation(event);
                orangee._samsungWidgetAPI.sendReturnEvent();
              }*/
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
}(window, $));

/*! iScroll v5.1.2 ~ (c) 2008-2014 Matteo Spinelli ~ http://cubiq.org/license */
(function (window, document, Math) {
var rAF = window.requestAnimationFrame	||
	window.webkitRequestAnimationFrame	||
	window.mozRequestAnimationFrame		||
	window.oRequestAnimationFrame		||
	window.msRequestAnimationFrame		||
	function (callback) { window.setTimeout(callback, 1000 / 60); };

var utils = (function () {
	var me = {};

	var _elementStyle = document.createElement('div').style;
	var _vendor = (function () {
		var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
			transform,
			i = 0,
			l = vendors.length;

		for ( ; i < l; i++ ) {
			transform = vendors[i] + 'ransform';
			if ( transform in _elementStyle ) return vendors[i].substr(0, vendors[i].length-1);
		}

		return false;
	})();

	function _prefixStyle (style) {
		if ( _vendor === false ) return false;
		if ( _vendor === '' ) return style;
		return _vendor + style.charAt(0).toUpperCase() + style.substr(1);
	}

	me.getTime = Date.now || function getTime () { return new Date().getTime(); };

	me.extend = function (target, obj) {
		for ( var i in obj ) {
			target[i] = obj[i];
		}
	};

	me.addEvent = function (el, type, fn, capture) {
		el.addEventListener(type, fn, !!capture);
	};

	me.removeEvent = function (el, type, fn, capture) {
		el.removeEventListener(type, fn, !!capture);
	};

	me.prefixPointerEvent = function (pointerEvent) {
		return window.MSPointerEvent ? 
			'MSPointer' + pointerEvent.charAt(9).toUpperCase() + pointerEvent.substr(10):
			pointerEvent;
	};

	me.momentum = function (current, start, time, lowerMargin, wrapperSize, deceleration) {
		var distance = current - start,
			speed = Math.abs(distance) / time,
			destination,
			duration;

		deceleration = deceleration === undefined ? 0.0006 : deceleration;

		destination = current + ( speed * speed ) / ( 2 * deceleration ) * ( distance < 0 ? -1 : 1 );
		duration = speed / deceleration;

		if ( destination < lowerMargin ) {
			destination = wrapperSize ? lowerMargin - ( wrapperSize / 2.5 * ( speed / 8 ) ) : lowerMargin;
			distance = Math.abs(destination - current);
			duration = distance / speed;
		} else if ( destination > 0 ) {
			destination = wrapperSize ? wrapperSize / 2.5 * ( speed / 8 ) : 0;
			distance = Math.abs(current) + destination;
			duration = distance / speed;
		}

		return {
			destination: Math.round(destination),
			duration: duration
		};
	};

	var _transform = _prefixStyle('transform');

	me.extend(me, {
		hasTransform: _transform !== false,
		hasPerspective: _prefixStyle('perspective') in _elementStyle,
		hasTouch: 'ontouchstart' in window,
		hasPointer: window.PointerEvent || window.MSPointerEvent, // IE10 is prefixed
		hasTransition: _prefixStyle('transition') in _elementStyle
	});

	// This should find all Android browsers lower than build 535.19 (both stock browser and webview)
	me.isBadAndroid = /Android /.test(window.navigator.appVersion) && !(/Chrome\/\d/.test(window.navigator.appVersion));

	me.extend(me.style = {}, {
		transform: _transform,
		transitionTimingFunction: _prefixStyle('transitionTimingFunction'),
		transitionDuration: _prefixStyle('transitionDuration'),
		transitionDelay: _prefixStyle('transitionDelay'),
		transformOrigin: _prefixStyle('transformOrigin')
	});

	me.hasClass = function (e, c) {
		var re = new RegExp("(^|\\s)" + c + "(\\s|$)");
		return re.test(e.className);
	};

	me.addClass = function (e, c) {
		if ( me.hasClass(e, c) ) {
			return;
		}

		var newclass = e.className.split(' ');
		newclass.push(c);
		e.className = newclass.join(' ');
	};

	me.removeClass = function (e, c) {
		if ( !me.hasClass(e, c) ) {
			return;
		}

		var re = new RegExp("(^|\\s)" + c + "(\\s|$)", 'g');
		e.className = e.className.replace(re, ' ');
	};

	me.offset = function (el) {
		var left = -el.offsetLeft,
			top = -el.offsetTop;

		// jshint -W084
		while (el = el.offsetParent) {
			left -= el.offsetLeft;
			top -= el.offsetTop;
		}
		// jshint +W084

		return {
			left: left,
			top: top
		};
	};

	me.preventDefaultException = function (el, exceptions) {
		for ( var i in exceptions ) {
			if ( exceptions[i].test(el[i]) ) {
				return true;
			}
		}

		return false;
	};

	me.extend(me.eventType = {}, {
		touchstart: 1,
		touchmove: 1,
		touchend: 1,

		mousedown: 2,
		mousemove: 2,
		mouseup: 2,

		pointerdown: 3,
		pointermove: 3,
		pointerup: 3,

		MSPointerDown: 3,
		MSPointerMove: 3,
		MSPointerUp: 3
	});

	me.extend(me.ease = {}, {
		quadratic: {
			style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
			fn: function (k) {
				return k * ( 2 - k );
			}
		},
		circular: {
			style: 'cubic-bezier(0.1, 0.57, 0.1, 1)',	// Not properly "circular" but this looks better, it should be (0.075, 0.82, 0.165, 1)
			fn: function (k) {
				return Math.sqrt( 1 - ( --k * k ) );
			}
		},
		back: {
			style: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
			fn: function (k) {
				var b = 4;
				return ( k = k - 1 ) * k * ( ( b + 1 ) * k + b ) + 1;
			}
		},
		bounce: {
			style: '',
			fn: function (k) {
				if ( ( k /= 1 ) < ( 1 / 2.75 ) ) {
					return 7.5625 * k * k;
				} else if ( k < ( 2 / 2.75 ) ) {
					return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;
				} else if ( k < ( 2.5 / 2.75 ) ) {
					return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;
				} else {
					return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;
				}
			}
		},
		elastic: {
			style: '',
			fn: function (k) {
				var f = 0.22,
					e = 0.4;

				if ( k === 0 ) { return 0; }
				if ( k == 1 ) { return 1; }

				return ( e * Math.pow( 2, - 10 * k ) * Math.sin( ( k - f / 4 ) * ( 2 * Math.PI ) / f ) + 1 );
			}
		}
	});

	me.tap = function (e, eventName) {
		var ev = document.createEvent('Event');
		ev.initEvent(eventName, true, true);
		ev.pageX = e.pageX;
		ev.pageY = e.pageY;
		e.target.dispatchEvent(ev);
	};

	me.click = function (e) {
		var target = e.target,
			ev;

		if ( !(/(SELECT|INPUT|TEXTAREA)/i).test(target.tagName) ) {
			ev = document.createEvent('MouseEvents');
			ev.initMouseEvent('click', true, true, e.view, 1,
				target.screenX, target.screenY, target.clientX, target.clientY,
				e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
				0, null);

			ev._constructed = true;
			target.dispatchEvent(ev);
		}
	};

	return me;
})();

function IScroll (el, options) {
	this.wrapper = typeof el == 'string' ? document.querySelector(el) : el;
	this.scroller = this.wrapper.children[0];
	this.scrollerStyle = this.scroller.style;		// cache style for better performance

	this.options = {

		resizeScrollbars: true,

		mouseWheelSpeed: 20,

		snapThreshold: 0.334,

// INSERT POINT: OPTIONS 

		startX: 0,
		startY: 0,
		scrollY: true,
		directionLockThreshold: 5,
		momentum: true,

		bounce: true,
		bounceTime: 600,
		bounceEasing: '',

		preventDefault: true,
		preventDefaultException: { tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT)$/ },

		HWCompositing: true,
		useTransition: true,
		useTransform: true
	};

	for ( var i in options ) {
		this.options[i] = options[i];
	}

	// Normalize options
	this.translateZ = this.options.HWCompositing && utils.hasPerspective ? ' translateZ(0)' : '';

	this.options.useTransition = utils.hasTransition && this.options.useTransition;
	this.options.useTransform = utils.hasTransform && this.options.useTransform;

	this.options.eventPassthrough = this.options.eventPassthrough === true ? 'vertical' : this.options.eventPassthrough;
	this.options.preventDefault = !this.options.eventPassthrough && this.options.preventDefault;

	// If you want eventPassthrough I have to lock one of the axes
	this.options.scrollY = this.options.eventPassthrough == 'vertical' ? false : this.options.scrollY;
	this.options.scrollX = this.options.eventPassthrough == 'horizontal' ? false : this.options.scrollX;

	// With eventPassthrough we also need lockDirection mechanism
	this.options.freeScroll = this.options.freeScroll && !this.options.eventPassthrough;
	this.options.directionLockThreshold = this.options.eventPassthrough ? 0 : this.options.directionLockThreshold;

	this.options.bounceEasing = typeof this.options.bounceEasing == 'string' ? utils.ease[this.options.bounceEasing] || utils.ease.circular : this.options.bounceEasing;

	this.options.resizePolling = this.options.resizePolling === undefined ? 60 : this.options.resizePolling;

	if ( this.options.tap === true ) {
		this.options.tap = 'tap';
	}

	if ( this.options.shrinkScrollbars == 'scale' ) {
		this.options.useTransition = false;
	}

	this.options.invertWheelDirection = this.options.invertWheelDirection ? -1 : 1;

// INSERT POINT: NORMALIZATION

	// Some defaults	
	this.x = 0;
	this.y = 0;
	this.directionX = 0;
	this.directionY = 0;
	this._events = {};

// INSERT POINT: DEFAULTS

	this._init();
	this.refresh();

	this.scrollTo(this.options.startX, this.options.startY);
	this.enable();
}

IScroll.prototype = {
	version: '5.1.2',

	_init: function () {
		this._initEvents();

		if ( this.options.scrollbars || this.options.indicators ) {
			this._initIndicators();
		}

		if ( this.options.mouseWheel ) {
			this._initWheel();
		}

		if ( this.options.snap ) {
			this._initSnap();
		}

		if ( this.options.keyBindings ) {
			this._initKeys();
		}

// INSERT POINT: _init

	},

	destroy: function () {
		this._initEvents(true);

		this._execEvent('destroy');
	},

	_transitionEnd: function (e) {
		if ( e.target != this.scroller || !this.isInTransition ) {
			return;
		}

		this._transitionTime();
		if ( !this.resetPosition(this.options.bounceTime) ) {
			this.isInTransition = false;
			this._execEvent('scrollEnd');
		}
	},

	_start: function (e) {
		// React to left mouse button only
		if ( utils.eventType[e.type] != 1 ) {
			if ( e.button !== 0 ) {
				return;
			}
		}

		if ( !this.enabled || (this.initiated && utils.eventType[e.type] !== this.initiated) ) {
			return;
		}

		if ( this.options.preventDefault && !utils.isBadAndroid && !utils.preventDefaultException(e.target, this.options.preventDefaultException) ) {
			e.preventDefault();
		}

		var point = e.touches ? e.touches[0] : e,
			pos;

		this.initiated	= utils.eventType[e.type];
		this.moved		= false;
		this.distX		= 0;
		this.distY		= 0;
		this.directionX = 0;
		this.directionY = 0;
		this.directionLocked = 0;

		this._transitionTime();

		this.startTime = utils.getTime();

		if ( this.options.useTransition && this.isInTransition ) {
			this.isInTransition = false;
			pos = this.getComputedPosition();
			this._translate(Math.round(pos.x), Math.round(pos.y));
			this._execEvent('scrollEnd');
		} else if ( !this.options.useTransition && this.isAnimating ) {
			this.isAnimating = false;
			this._execEvent('scrollEnd');
		}

		this.startX    = this.x;
		this.startY    = this.y;
		this.absStartX = this.x;
		this.absStartY = this.y;
		this.pointX    = point.pageX;
		this.pointY    = point.pageY;

		this._execEvent('beforeScrollStart');
	},

	_move: function (e) {
		if ( !this.enabled || utils.eventType[e.type] !== this.initiated ) {
			return;
		}

		if ( this.options.preventDefault ) {	// increases performance on Android? TODO: check!
			e.preventDefault();
		}

		var point		= e.touches ? e.touches[0] : e,
			deltaX		= point.pageX - this.pointX,
			deltaY		= point.pageY - this.pointY,
			timestamp	= utils.getTime(),
			newX, newY,
			absDistX, absDistY;

		this.pointX		= point.pageX;
		this.pointY		= point.pageY;

		this.distX		+= deltaX;
		this.distY		+= deltaY;
		absDistX		= Math.abs(this.distX);
		absDistY		= Math.abs(this.distY);

		// We need to move at least 10 pixels for the scrolling to initiate
		if ( timestamp - this.endTime > 300 && (absDistX < 10 && absDistY < 10) ) {
			return;
		}

		// If you are scrolling in one direction lock the other
		if ( !this.directionLocked && !this.options.freeScroll ) {
			if ( absDistX > absDistY + this.options.directionLockThreshold ) {
				this.directionLocked = 'h';		// lock horizontally
			} else if ( absDistY >= absDistX + this.options.directionLockThreshold ) {
				this.directionLocked = 'v';		// lock vertically
			} else {
				this.directionLocked = 'n';		// no lock
			}
		}

		if ( this.directionLocked == 'h' ) {
			if ( this.options.eventPassthrough == 'vertical' ) {
				e.preventDefault();
			} else if ( this.options.eventPassthrough == 'horizontal' ) {
				this.initiated = false;
				return;
			}

			deltaY = 0;
		} else if ( this.directionLocked == 'v' ) {
			if ( this.options.eventPassthrough == 'horizontal' ) {
				e.preventDefault();
			} else if ( this.options.eventPassthrough == 'vertical' ) {
				this.initiated = false;
				return;
			}

			deltaX = 0;
		}

		deltaX = this.hasHorizontalScroll ? deltaX : 0;
		deltaY = this.hasVerticalScroll ? deltaY : 0;

		newX = this.x + deltaX;
		newY = this.y + deltaY;

		// Slow down if outside of the boundaries
		if ( newX > 0 || newX < this.maxScrollX ) {
			newX = this.options.bounce ? this.x + deltaX / 3 : newX > 0 ? 0 : this.maxScrollX;
		}
		if ( newY > 0 || newY < this.maxScrollY ) {
			newY = this.options.bounce ? this.y + deltaY / 3 : newY > 0 ? 0 : this.maxScrollY;
		}

		this.directionX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
		this.directionY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;

		if ( !this.moved ) {
			this._execEvent('scrollStart');
		}

		this.moved = true;

		this._translate(newX, newY);

/* REPLACE START: _move */

		if ( timestamp - this.startTime > 300 ) {
			this.startTime = timestamp;
			this.startX = this.x;
			this.startY = this.y;
		}

/* REPLACE END: _move */

	},

	_end: function (e) {
		if ( !this.enabled || utils.eventType[e.type] !== this.initiated ) {
			return;
		}

		if ( this.options.preventDefault && !utils.preventDefaultException(e.target, this.options.preventDefaultException) ) {
			e.preventDefault();
		}

		var point = e.changedTouches ? e.changedTouches[0] : e,
			momentumX,
			momentumY,
			duration = utils.getTime() - this.startTime,
			newX = Math.round(this.x),
			newY = Math.round(this.y),
			distanceX = Math.abs(newX - this.startX),
			distanceY = Math.abs(newY - this.startY),
			time = 0,
			easing = '';

		this.isInTransition = 0;
		this.initiated = 0;
		this.endTime = utils.getTime();

		// reset if we are outside of the boundaries
		if ( this.resetPosition(this.options.bounceTime) ) {
			return;
		}

		this.scrollTo(newX, newY);	// ensures that the last position is rounded

		// we scrolled less than 10 pixels
		if ( !this.moved ) {
			if ( this.options.tap ) {
				utils.tap(e, this.options.tap);
			}

			if ( this.options.click ) {
				utils.click(e);
			}

			this._execEvent('scrollCancel');
			return;
		}

		if ( this._events.flick && duration < 200 && distanceX < 100 && distanceY < 100 ) {
			this._execEvent('flick');
			return;
		}

		// start momentum animation if needed
		if ( this.options.momentum && duration < 300 ) {
			momentumX = this.hasHorizontalScroll ? utils.momentum(this.x, this.startX, duration, this.maxScrollX, this.options.bounce ? this.wrapperWidth : 0, this.options.deceleration) : { destination: newX, duration: 0 };
			momentumY = this.hasVerticalScroll ? utils.momentum(this.y, this.startY, duration, this.maxScrollY, this.options.bounce ? this.wrapperHeight : 0, this.options.deceleration) : { destination: newY, duration: 0 };
			newX = momentumX.destination;
			newY = momentumY.destination;
			time = Math.max(momentumX.duration, momentumY.duration);
			this.isInTransition = 1;
		}


		if ( this.options.snap ) {
			var snap = this._nearestSnap(newX, newY);
			this.currentPage = snap;
			time = this.options.snapSpeed || Math.max(
					Math.max(
						Math.min(Math.abs(newX - snap.x), 1000),
						Math.min(Math.abs(newY - snap.y), 1000)
					), 300);
			newX = snap.x;
			newY = snap.y;

			this.directionX = 0;
			this.directionY = 0;
			easing = this.options.bounceEasing;
		}

// INSERT POINT: _end

		if ( newX != this.x || newY != this.y ) {
			// change easing function when scroller goes out of the boundaries
			if ( newX > 0 || newX < this.maxScrollX || newY > 0 || newY < this.maxScrollY ) {
				easing = utils.ease.quadratic;
			}

			this.scrollTo(newX, newY, time, easing);
			return;
		}

		this._execEvent('scrollEnd');
	},

	_resize: function () {
		var that = this;

		clearTimeout(this.resizeTimeout);

		this.resizeTimeout = setTimeout(function () {
			that.refresh();
		}, this.options.resizePolling);
	},

	resetPosition: function (time) {
		var x = this.x,
			y = this.y;

		time = time || 0;

		if ( !this.hasHorizontalScroll || this.x > 0 ) {
			x = 0;
		} else if ( this.x < this.maxScrollX ) {
			x = this.maxScrollX;
		}

		if ( !this.hasVerticalScroll || this.y > 0 ) {
			y = 0;
		} else if ( this.y < this.maxScrollY ) {
			y = this.maxScrollY;
		}

		if ( x == this.x && y == this.y ) {
			return false;
		}

		this.scrollTo(x, y, time, this.options.bounceEasing);

		return true;
	},

	disable: function () {
		this.enabled = false;
	},

	enable: function () {
		this.enabled = true;
	},

	refresh: function () {
		var rf = this.wrapper.offsetHeight;		// Force reflow

		this.wrapperWidth	= this.wrapper.clientWidth;
		this.wrapperHeight	= this.wrapper.clientHeight;

/* REPLACE START: refresh */

		this.scrollerWidth	= this.scroller.offsetWidth;
		this.scrollerHeight	= this.scroller.offsetHeight;

		this.maxScrollX		= this.wrapperWidth - this.scrollerWidth;
		this.maxScrollY		= this.wrapperHeight - this.scrollerHeight;

/* REPLACE END: refresh */

		this.hasHorizontalScroll	= this.options.scrollX && this.maxScrollX < 0;
		this.hasVerticalScroll		= this.options.scrollY && this.maxScrollY < 0;

		if ( !this.hasHorizontalScroll ) {
			this.maxScrollX = 0;
			this.scrollerWidth = this.wrapperWidth;
		}

		if ( !this.hasVerticalScroll ) {
			this.maxScrollY = 0;
			this.scrollerHeight = this.wrapperHeight;
		}

		this.endTime = 0;
		this.directionX = 0;
		this.directionY = 0;

		this.wrapperOffset = utils.offset(this.wrapper);

		this._execEvent('refresh');

		this.resetPosition();

// INSERT POINT: _refresh

	},

	on: function (type, fn) {
		if ( !this._events[type] ) {
			this._events[type] = [];
		}

		this._events[type].push(fn);
	},

	off: function (type, fn) {
		if ( !this._events[type] ) {
			return;
		}

		var index = this._events[type].indexOf(fn);

		if ( index > -1 ) {
			this._events[type].splice(index, 1);
		}
	},

	_execEvent: function (type) {
		if ( !this._events[type] ) {
			return;
		}

		var i = 0,
			l = this._events[type].length;

		if ( !l ) {
			return;
		}

		for ( ; i < l; i++ ) {
			this._events[type][i].apply(this, [].slice.call(arguments, 1));
		}
	},

	scrollBy: function (x, y, time, easing) {
		x = this.x + x;
		y = this.y + y;
		time = time || 0;

		this.scrollTo(x, y, time, easing);
	},

	scrollTo: function (x, y, time, easing) {
		easing = easing || utils.ease.circular;

		this.isInTransition = this.options.useTransition && time > 0;

		if ( !time || (this.options.useTransition && easing.style) ) {
			this._transitionTimingFunction(easing.style);
			this._transitionTime(time);
			this._translate(x, y);
		} else {
			this._animate(x, y, time, easing.fn);
		}
	},

	scrollToElement: function (el, time, offsetX, offsetY, easing) {
		el = el.nodeType ? el : this.scroller.querySelector(el);

		if ( !el ) {
			return;
		}

		var pos = utils.offset(el);

		pos.left -= this.wrapperOffset.left;
		pos.top  -= this.wrapperOffset.top;

		// if offsetX/Y are true we center the element to the screen
		if ( offsetX === true ) {
			offsetX = Math.round(el.offsetWidth / 2 - this.wrapper.offsetWidth / 2);
		}
		if ( offsetY === true ) {
			offsetY = Math.round(el.offsetHeight / 2 - this.wrapper.offsetHeight / 2);
		}

		pos.left -= offsetX || 0;
		pos.top  -= offsetY || 0;

		pos.left = pos.left > 0 ? 0 : pos.left < this.maxScrollX ? this.maxScrollX : pos.left;
		pos.top  = pos.top  > 0 ? 0 : pos.top  < this.maxScrollY ? this.maxScrollY : pos.top;

		time = time === undefined || time === null || time === 'auto' ? Math.max(Math.abs(this.x-pos.left), Math.abs(this.y-pos.top)) : time;

		this.scrollTo(pos.left, pos.top, time, easing);
	},

	_transitionTime: function (time) {
		time = time || 0;

		this.scrollerStyle[utils.style.transitionDuration] = time + 'ms';

		if ( !time && utils.isBadAndroid ) {
			this.scrollerStyle[utils.style.transitionDuration] = '0.001s';
		}


		if ( this.indicators ) {
			for ( var i = this.indicators.length; i--; ) {
				this.indicators[i].transitionTime(time);
			}
		}


// INSERT POINT: _transitionTime

	},

	_transitionTimingFunction: function (easing) {
		this.scrollerStyle[utils.style.transitionTimingFunction] = easing;


		if ( this.indicators ) {
			for ( var i = this.indicators.length; i--; ) {
				this.indicators[i].transitionTimingFunction(easing);
			}
		}


// INSERT POINT: _transitionTimingFunction

	},

	_translate: function (x, y) {
		if ( this.options.useTransform ) {

/* REPLACE START: _translate */

			this.scrollerStyle[utils.style.transform] = 'translate(' + x + 'px,' + y + 'px)' + this.translateZ;

/* REPLACE END: _translate */

		} else {
			x = Math.round(x);
			y = Math.round(y);
			this.scrollerStyle.left = x + 'px';
			this.scrollerStyle.top = y + 'px';
		}

		this.x = x;
		this.y = y;


	if ( this.indicators ) {
		for ( var i = this.indicators.length; i--; ) {
			this.indicators[i].updatePosition();
		}
	}


// INSERT POINT: _translate

	},

	_initEvents: function (remove) {
		var eventType = remove ? utils.removeEvent : utils.addEvent,
			target = this.options.bindToWrapper ? this.wrapper : window;

		eventType(window, 'orientationchange', this);
		eventType(window, 'resize', this);

		if ( this.options.click ) {
			eventType(this.wrapper, 'click', this, true);
		}

		if ( !this.options.disableMouse ) {
			eventType(this.wrapper, 'mousedown', this);
			eventType(target, 'mousemove', this);
			eventType(target, 'mousecancel', this);
			eventType(target, 'mouseup', this);
		}

		if ( utils.hasPointer && !this.options.disablePointer ) {
			eventType(this.wrapper, utils.prefixPointerEvent('pointerdown'), this);
			eventType(target, utils.prefixPointerEvent('pointermove'), this);
			eventType(target, utils.prefixPointerEvent('pointercancel'), this);
			eventType(target, utils.prefixPointerEvent('pointerup'), this);
		}

		if ( utils.hasTouch && !this.options.disableTouch ) {
			eventType(this.wrapper, 'touchstart', this);
			eventType(target, 'touchmove', this);
			eventType(target, 'touchcancel', this);
			eventType(target, 'touchend', this);
		}

		eventType(this.scroller, 'transitionend', this);
		eventType(this.scroller, 'webkitTransitionEnd', this);
		eventType(this.scroller, 'oTransitionEnd', this);
		eventType(this.scroller, 'MSTransitionEnd', this);
	},

	getComputedPosition: function () {
		var matrix = window.getComputedStyle(this.scroller, null),
			x, y;

		if ( this.options.useTransform ) {
			matrix = matrix[utils.style.transform].split(')')[0].split(', ');
			x = +(matrix[12] || matrix[4]);
			y = +(matrix[13] || matrix[5]);
		} else {
			x = +matrix.left.replace(/[^-\d.]/g, '');
			y = +matrix.top.replace(/[^-\d.]/g, '');
		}

		return { x: x, y: y };
	},

	_initIndicators: function () {
		var interactive = this.options.interactiveScrollbars,
			customStyle = typeof this.options.scrollbars != 'string',
			indicators = [],
			indicator;

		var that = this;

		this.indicators = [];

		if ( this.options.scrollbars ) {
			// Vertical scrollbar
			if ( this.options.scrollY ) {
				indicator = {
					el: createDefaultScrollbar('v', interactive, this.options.scrollbars),
					interactive: interactive,
					defaultScrollbars: true,
					customStyle: customStyle,
					resize: this.options.resizeScrollbars,
					shrink: this.options.shrinkScrollbars,
					fade: this.options.fadeScrollbars,
					listenX: false
				};

				this.wrapper.appendChild(indicator.el);
				indicators.push(indicator);
			}

			// Horizontal scrollbar
			if ( this.options.scrollX ) {
				indicator = {
					el: createDefaultScrollbar('h', interactive, this.options.scrollbars),
					interactive: interactive,
					defaultScrollbars: true,
					customStyle: customStyle,
					resize: this.options.resizeScrollbars,
					shrink: this.options.shrinkScrollbars,
					fade: this.options.fadeScrollbars,
					listenY: false
				};

				this.wrapper.appendChild(indicator.el);
				indicators.push(indicator);
			}
		}

		if ( this.options.indicators ) {
			// TODO: check concat compatibility
			indicators = indicators.concat(this.options.indicators);
		}

		for ( var i = indicators.length; i--; ) {
			this.indicators.push( new Indicator(this, indicators[i]) );
		}

		// TODO: check if we can use array.map (wide compatibility and performance issues)
		function _indicatorsMap (fn) {
			for ( var i = that.indicators.length; i--; ) {
				fn.call(that.indicators[i]);
			}
		}

		if ( this.options.fadeScrollbars ) {
			this.on('scrollEnd', function () {
				_indicatorsMap(function () {
					this.fade();
				});
			});

			this.on('scrollCancel', function () {
				_indicatorsMap(function () {
					this.fade();
				});
			});

			this.on('scrollStart', function () {
				_indicatorsMap(function () {
					this.fade(1);
				});
			});

			this.on('beforeScrollStart', function () {
				_indicatorsMap(function () {
					this.fade(1, true);
				});
			});
		}


		this.on('refresh', function () {
			_indicatorsMap(function () {
				this.refresh();
			});
		});

		this.on('destroy', function () {
			_indicatorsMap(function () {
				this.destroy();
			});

			delete this.indicators;
		});
	},

	_initWheel: function () {
		utils.addEvent(this.wrapper, 'wheel', this);
		utils.addEvent(this.wrapper, 'mousewheel', this);
		utils.addEvent(this.wrapper, 'DOMMouseScroll', this);

		this.on('destroy', function () {
			utils.removeEvent(this.wrapper, 'wheel', this);
			utils.removeEvent(this.wrapper, 'mousewheel', this);
			utils.removeEvent(this.wrapper, 'DOMMouseScroll', this);
		});
	},

	_wheel: function (e) {
		if ( !this.enabled ) {
			return;
		}

		e.preventDefault();
		e.stopPropagation();

		var wheelDeltaX, wheelDeltaY,
			newX, newY,
			that = this;

		if ( this.wheelTimeout === undefined ) {
			that._execEvent('scrollStart');
		}

		// Execute the scrollEnd event after 400ms the wheel stopped scrolling
		clearTimeout(this.wheelTimeout);
		this.wheelTimeout = setTimeout(function () {
			that._execEvent('scrollEnd');
			that.wheelTimeout = undefined;
		}, 400);

		if ( 'deltaX' in e ) {
			wheelDeltaX = -e.deltaX;
			wheelDeltaY = -e.deltaY;
		} else if ( 'wheelDeltaX' in e ) {
			wheelDeltaX = e.wheelDeltaX / 120 * this.options.mouseWheelSpeed;
			wheelDeltaY = e.wheelDeltaY / 120 * this.options.mouseWheelSpeed;
		} else if ( 'wheelDelta' in e ) {
			wheelDeltaX = wheelDeltaY = e.wheelDelta / 120 * this.options.mouseWheelSpeed;
		} else if ( 'detail' in e ) {
			wheelDeltaX = wheelDeltaY = -e.detail / 3 * this.options.mouseWheelSpeed;
		} else {
			return;
		}

		wheelDeltaX *= this.options.invertWheelDirection;
		wheelDeltaY *= this.options.invertWheelDirection;

		if ( !this.hasVerticalScroll ) {
			wheelDeltaX = wheelDeltaY;
			wheelDeltaY = 0;
		}

		if ( this.options.snap ) {
			newX = this.currentPage.pageX;
			newY = this.currentPage.pageY;

			if ( wheelDeltaX > 0 ) {
				newX--;
			} else if ( wheelDeltaX < 0 ) {
				newX++;
			}

			if ( wheelDeltaY > 0 ) {
				newY--;
			} else if ( wheelDeltaY < 0 ) {
				newY++;
			}

			this.goToPage(newX, newY);

			return;
		}

		newX = this.x + Math.round(this.hasHorizontalScroll ? wheelDeltaX : 0);
		newY = this.y + Math.round(this.hasVerticalScroll ? wheelDeltaY : 0);

		if ( newX > 0 ) {
			newX = 0;
		} else if ( newX < this.maxScrollX ) {
			newX = this.maxScrollX;
		}

		if ( newY > 0 ) {
			newY = 0;
		} else if ( newY < this.maxScrollY ) {
			newY = this.maxScrollY;
		}

		this.scrollTo(newX, newY, 0);

// INSERT POINT: _wheel
	},

	_initSnap: function () {
		this.currentPage = {};

		if ( typeof this.options.snap == 'string' ) {
			this.options.snap = this.scroller.querySelectorAll(this.options.snap);
		}

		this.on('refresh', function () {
			var i = 0, l,
				m = 0, n,
				cx, cy,
				x = 0, y,
				stepX = this.options.snapStepX || this.wrapperWidth,
				stepY = this.options.snapStepY || this.wrapperHeight,
				el;

			this.pages = [];

			if ( !this.wrapperWidth || !this.wrapperHeight || !this.scrollerWidth || !this.scrollerHeight ) {
				return;
			}

			if ( this.options.snap === true ) {
				cx = Math.round( stepX / 2 );
				cy = Math.round( stepY / 2 );

				while ( x > -this.scrollerWidth ) {
					this.pages[i] = [];
					l = 0;
					y = 0;

					while ( y > -this.scrollerHeight ) {
						this.pages[i][l] = {
							x: Math.max(x, this.maxScrollX),
							y: Math.max(y, this.maxScrollY),
							width: stepX,
							height: stepY,
							cx: x - cx,
							cy: y - cy
						};

						y -= stepY;
						l++;
					}

					x -= stepX;
					i++;
				}
			} else {
				el = this.options.snap;
				l = el.length;
				n = -1;

				for ( ; i < l; i++ ) {
					if ( i === 0 || el[i].offsetLeft <= el[i-1].offsetLeft ) {
						m = 0;
						n++;
					}

					if ( !this.pages[m] ) {
						this.pages[m] = [];
					}

					x = Math.max(-el[i].offsetLeft, this.maxScrollX);
					y = Math.max(-el[i].offsetTop, this.maxScrollY);
					cx = x - Math.round(el[i].offsetWidth / 2);
					cy = y - Math.round(el[i].offsetHeight / 2);

					this.pages[m][n] = {
						x: x,
						y: y,
						width: el[i].offsetWidth,
						height: el[i].offsetHeight,
						cx: cx,
						cy: cy
					};

					if ( x > this.maxScrollX ) {
						m++;
					}
				}
			}

			this.goToPage(this.currentPage.pageX || 0, this.currentPage.pageY || 0, 0);

			// Update snap threshold if needed
			if ( this.options.snapThreshold % 1 === 0 ) {
				this.snapThresholdX = this.options.snapThreshold;
				this.snapThresholdY = this.options.snapThreshold;
			} else {
				this.snapThresholdX = Math.round(this.pages[this.currentPage.pageX][this.currentPage.pageY].width * this.options.snapThreshold);
				this.snapThresholdY = Math.round(this.pages[this.currentPage.pageX][this.currentPage.pageY].height * this.options.snapThreshold);
			}
		});

		this.on('flick', function () {
			var time = this.options.snapSpeed || Math.max(
					Math.max(
						Math.min(Math.abs(this.x - this.startX), 1000),
						Math.min(Math.abs(this.y - this.startY), 1000)
					), 300);

			this.goToPage(
				this.currentPage.pageX + this.directionX,
				this.currentPage.pageY + this.directionY,
				time
			);
		});
	},

	_nearestSnap: function (x, y) {
		if ( !this.pages.length ) {
			return { x: 0, y: 0, pageX: 0, pageY: 0 };
		}

		var i = 0,
			l = this.pages.length,
			m = 0;

		// Check if we exceeded the snap threshold
		if ( Math.abs(x - this.absStartX) < this.snapThresholdX &&
			Math.abs(y - this.absStartY) < this.snapThresholdY ) {
			return this.currentPage;
		}

		if ( x > 0 ) {
			x = 0;
		} else if ( x < this.maxScrollX ) {
			x = this.maxScrollX;
		}

		if ( y > 0 ) {
			y = 0;
		} else if ( y < this.maxScrollY ) {
			y = this.maxScrollY;
		}

		for ( ; i < l; i++ ) {
			if ( x >= this.pages[i][0].cx ) {
				x = this.pages[i][0].x;
				break;
			}
		}

		l = this.pages[i].length;

		for ( ; m < l; m++ ) {
			if ( y >= this.pages[0][m].cy ) {
				y = this.pages[0][m].y;
				break;
			}
		}

		if ( i == this.currentPage.pageX ) {
			i += this.directionX;

			if ( i < 0 ) {
				i = 0;
			} else if ( i >= this.pages.length ) {
				i = this.pages.length - 1;
			}

			x = this.pages[i][0].x;
		}

		if ( m == this.currentPage.pageY ) {
			m += this.directionY;

			if ( m < 0 ) {
				m = 0;
			} else if ( m >= this.pages[0].length ) {
				m = this.pages[0].length - 1;
			}

			y = this.pages[0][m].y;
		}

		return {
			x: x,
			y: y,
			pageX: i,
			pageY: m
		};
	},

	goToPage: function (x, y, time, easing) {
		easing = easing || this.options.bounceEasing;

		if ( x >= this.pages.length ) {
			x = this.pages.length - 1;
		} else if ( x < 0 ) {
			x = 0;
		}

		if ( y >= this.pages[x].length ) {
			y = this.pages[x].length - 1;
		} else if ( y < 0 ) {
			y = 0;
		}

		var posX = this.pages[x][y].x,
			posY = this.pages[x][y].y;

		time = time === undefined ? this.options.snapSpeed || Math.max(
			Math.max(
				Math.min(Math.abs(posX - this.x), 1000),
				Math.min(Math.abs(posY - this.y), 1000)
			), 300) : time;

		this.currentPage = {
			x: posX,
			y: posY,
			pageX: x,
			pageY: y
		};

		this.scrollTo(posX, posY, time, easing);
	},

	next: function (time, easing) {
		var x = this.currentPage.pageX,
			y = this.currentPage.pageY;

		x++;

		if ( x >= this.pages.length && this.hasVerticalScroll ) {
			x = 0;
			y++;
		}

		this.goToPage(x, y, time, easing);
	},

	prev: function (time, easing) {
		var x = this.currentPage.pageX,
			y = this.currentPage.pageY;

		x--;

		if ( x < 0 && this.hasVerticalScroll ) {
			x = 0;
			y--;
		}

		this.goToPage(x, y, time, easing);
	},

	_initKeys: function (e) {
		// default key bindings
		var keys = {
			pageUp: 33,
			pageDown: 34,
			end: 35,
			home: 36,
			left: 37,
			up: 38,
			right: 39,
			down: 40
		};
		var i;

		// if you give me characters I give you keycode
		if ( typeof this.options.keyBindings == 'object' ) {
			for ( i in this.options.keyBindings ) {
				if ( typeof this.options.keyBindings[i] == 'string' ) {
					this.options.keyBindings[i] = this.options.keyBindings[i].toUpperCase().charCodeAt(0);
				}
			}
		} else {
			this.options.keyBindings = {};
		}

		for ( i in keys ) {
			this.options.keyBindings[i] = this.options.keyBindings[i] || keys[i];
		}

		utils.addEvent(window, 'keydown', this);

		this.on('destroy', function () {
			utils.removeEvent(window, 'keydown', this);
		});
	},

	_key: function (e) {
		if ( !this.enabled ) {
			return;
		}

		var snap = this.options.snap,	// we are using this alot, better to cache it
			newX = snap ? this.currentPage.pageX : this.x,
			newY = snap ? this.currentPage.pageY : this.y,
			now = utils.getTime(),
			prevTime = this.keyTime || 0,
			acceleration = 0.250,
			pos;

		if ( this.options.useTransition && this.isInTransition ) {
			pos = this.getComputedPosition();

			this._translate(Math.round(pos.x), Math.round(pos.y));
			this.isInTransition = false;
		}

		this.keyAcceleration = now - prevTime < 200 ? Math.min(this.keyAcceleration + acceleration, 50) : 0;

		switch ( e.keyCode ) {
			case this.options.keyBindings.pageUp:
				if ( this.hasHorizontalScroll && !this.hasVerticalScroll ) {
					newX += snap ? 1 : this.wrapperWidth;
				} else {
					newY += snap ? 1 : this.wrapperHeight;
				}
				break;
			case this.options.keyBindings.pageDown:
				if ( this.hasHorizontalScroll && !this.hasVerticalScroll ) {
					newX -= snap ? 1 : this.wrapperWidth;
				} else {
					newY -= snap ? 1 : this.wrapperHeight;
				}
				break;
			case this.options.keyBindings.end:
				newX = snap ? this.pages.length-1 : this.maxScrollX;
				newY = snap ? this.pages[0].length-1 : this.maxScrollY;
				break;
			case this.options.keyBindings.home:
				newX = 0;
				newY = 0;
				break;
			case this.options.keyBindings.left:
				newX += snap ? -1 : 5 + this.keyAcceleration>>0;
				break;
			case this.options.keyBindings.up:
				newY += snap ? 1 : 5 + this.keyAcceleration>>0;
				break;
			case this.options.keyBindings.right:
				newX -= snap ? -1 : 5 + this.keyAcceleration>>0;
				break;
			case this.options.keyBindings.down:
				newY -= snap ? 1 : 5 + this.keyAcceleration>>0;
				break;
			default:
				return;
		}

		if ( snap ) {
			this.goToPage(newX, newY);
			return;
		}

		if ( newX > 0 ) {
			newX = 0;
			this.keyAcceleration = 0;
		} else if ( newX < this.maxScrollX ) {
			newX = this.maxScrollX;
			this.keyAcceleration = 0;
		}

		if ( newY > 0 ) {
			newY = 0;
			this.keyAcceleration = 0;
		} else if ( newY < this.maxScrollY ) {
			newY = this.maxScrollY;
			this.keyAcceleration = 0;
		}

		this.scrollTo(newX, newY, 0);

		this.keyTime = now;
	},

	_animate: function (destX, destY, duration, easingFn) {
		var that = this,
			startX = this.x,
			startY = this.y,
			startTime = utils.getTime(),
			destTime = startTime + duration;

		function step () {
			var now = utils.getTime(),
				newX, newY,
				easing;

			if ( now >= destTime ) {
				that.isAnimating = false;
				that._translate(destX, destY);

				if ( !that.resetPosition(that.options.bounceTime) ) {
					that._execEvent('scrollEnd');
				}

				return;
			}

			now = ( now - startTime ) / duration;
			easing = easingFn(now);
			newX = ( destX - startX ) * easing + startX;
			newY = ( destY - startY ) * easing + startY;
			that._translate(newX, newY);

			if ( that.isAnimating ) {
				rAF(step);
			}
		}

		this.isAnimating = true;
		step();
	},
	handleEvent: function (e) {
		switch ( e.type ) {
			case 'touchstart':
			case 'pointerdown':
			case 'MSPointerDown':
			case 'mousedown':
				this._start(e);
				break;
			case 'touchmove':
			case 'pointermove':
			case 'MSPointerMove':
			case 'mousemove':
				this._move(e);
				break;
			case 'touchend':
			case 'pointerup':
			case 'MSPointerUp':
			case 'mouseup':
			case 'touchcancel':
			case 'pointercancel':
			case 'MSPointerCancel':
			case 'mousecancel':
				this._end(e);
				break;
			case 'orientationchange':
			case 'resize':
				this._resize();
				break;
			case 'transitionend':
			case 'webkitTransitionEnd':
			case 'oTransitionEnd':
			case 'MSTransitionEnd':
				this._transitionEnd(e);
				break;
			case 'wheel':
			case 'DOMMouseScroll':
			case 'mousewheel':
				this._wheel(e);
				break;
			case 'keydown':
				this._key(e);
				break;
			case 'click':
				if ( !e._constructed ) {
					e.preventDefault();
					e.stopPropagation();
				}
				break;
		}
	}
};
function createDefaultScrollbar (direction, interactive, type) {
	var scrollbar = document.createElement('div'),
		indicator = document.createElement('div');

	if ( type === true ) {
		scrollbar.style.cssText = 'position:absolute;z-index:9999';
		indicator.style.cssText = '-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;position:absolute;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.9);border-radius:3px';
	}

	indicator.className = 'iScrollIndicator';

	if ( direction == 'h' ) {
		if ( type === true ) {
			scrollbar.style.cssText += ';height:7px;left:2px;right:2px;bottom:0';
			indicator.style.height = '100%';
		}
		scrollbar.className = 'iScrollHorizontalScrollbar';
	} else {
		if ( type === true ) {
			scrollbar.style.cssText += ';width:7px;bottom:2px;top:2px;right:1px';
			indicator.style.width = '100%';
		}
		scrollbar.className = 'iScrollVerticalScrollbar';
	}

	scrollbar.style.cssText += ';overflow:hidden';

	if ( !interactive ) {
		scrollbar.style.pointerEvents = 'none';
	}

	scrollbar.appendChild(indicator);

	return scrollbar;
}

function Indicator (scroller, options) {
	this.wrapper = typeof options.el == 'string' ? document.querySelector(options.el) : options.el;
	this.wrapperStyle = this.wrapper.style;
	this.indicator = this.wrapper.children[0];
	this.indicatorStyle = this.indicator.style;
	this.scroller = scroller;

	this.options = {
		listenX: true,
		listenY: true,
		interactive: false,
		resize: true,
		defaultScrollbars: false,
		shrink: false,
		fade: false,
		speedRatioX: 0,
		speedRatioY: 0
	};

	for ( var i in options ) {
		this.options[i] = options[i];
	}

	this.sizeRatioX = 1;
	this.sizeRatioY = 1;
	this.maxPosX = 0;
	this.maxPosY = 0;

	if ( this.options.interactive ) {
		if ( !this.options.disableTouch ) {
			utils.addEvent(this.indicator, 'touchstart', this);
			utils.addEvent(window, 'touchend', this);
		}
		if ( !this.options.disablePointer ) {
			utils.addEvent(this.indicator, utils.prefixPointerEvent('pointerdown'), this);
			utils.addEvent(window, utils.prefixPointerEvent('pointerup'), this);
		}
		if ( !this.options.disableMouse ) {
			utils.addEvent(this.indicator, 'mousedown', this);
			utils.addEvent(window, 'mouseup', this);
		}
	}

	if ( this.options.fade ) {
		this.wrapperStyle[utils.style.transform] = this.scroller.translateZ;
		this.wrapperStyle[utils.style.transitionDuration] = utils.isBadAndroid ? '0.001s' : '0ms';
		this.wrapperStyle.opacity = '0';
	}
}

Indicator.prototype = {
	handleEvent: function (e) {
		switch ( e.type ) {
			case 'touchstart':
			case 'pointerdown':
			case 'MSPointerDown':
			case 'mousedown':
				this._start(e);
				break;
			case 'touchmove':
			case 'pointermove':
			case 'MSPointerMove':
			case 'mousemove':
				this._move(e);
				break;
			case 'touchend':
			case 'pointerup':
			case 'MSPointerUp':
			case 'mouseup':
			case 'touchcancel':
			case 'pointercancel':
			case 'MSPointerCancel':
			case 'mousecancel':
				this._end(e);
				break;
		}
	},

	destroy: function () {
		if ( this.options.interactive ) {
			utils.removeEvent(this.indicator, 'touchstart', this);
			utils.removeEvent(this.indicator, utils.prefixPointerEvent('pointerdown'), this);
			utils.removeEvent(this.indicator, 'mousedown', this);

			utils.removeEvent(window, 'touchmove', this);
			utils.removeEvent(window, utils.prefixPointerEvent('pointermove'), this);
			utils.removeEvent(window, 'mousemove', this);

			utils.removeEvent(window, 'touchend', this);
			utils.removeEvent(window, utils.prefixPointerEvent('pointerup'), this);
			utils.removeEvent(window, 'mouseup', this);
		}

		if ( this.options.defaultScrollbars ) {
			this.wrapper.parentNode.removeChild(this.wrapper);
		}
	},

	_start: function (e) {
		var point = e.touches ? e.touches[0] : e;

		e.preventDefault();
		e.stopPropagation();

		this.transitionTime();

		this.initiated = true;
		this.moved = false;
		this.lastPointX	= point.pageX;
		this.lastPointY	= point.pageY;

		this.startTime	= utils.getTime();

		if ( !this.options.disableTouch ) {
			utils.addEvent(window, 'touchmove', this);
		}
		if ( !this.options.disablePointer ) {
			utils.addEvent(window, utils.prefixPointerEvent('pointermove'), this);
		}
		if ( !this.options.disableMouse ) {
			utils.addEvent(window, 'mousemove', this);
		}

		this.scroller._execEvent('beforeScrollStart');
	},

	_move: function (e) {
		var point = e.touches ? e.touches[0] : e,
			deltaX, deltaY,
			newX, newY,
			timestamp = utils.getTime();

		if ( !this.moved ) {
			this.scroller._execEvent('scrollStart');
		}

		this.moved = true;

		deltaX = point.pageX - this.lastPointX;
		this.lastPointX = point.pageX;

		deltaY = point.pageY - this.lastPointY;
		this.lastPointY = point.pageY;

		newX = this.x + deltaX;
		newY = this.y + deltaY;

		this._pos(newX, newY);

// INSERT POINT: indicator._move

		e.preventDefault();
		e.stopPropagation();
	},

	_end: function (e) {
		if ( !this.initiated ) {
			return;
		}

		this.initiated = false;

		e.preventDefault();
		e.stopPropagation();

		utils.removeEvent(window, 'touchmove', this);
		utils.removeEvent(window, utils.prefixPointerEvent('pointermove'), this);
		utils.removeEvent(window, 'mousemove', this);

		if ( this.scroller.options.snap ) {
			var snap = this.scroller._nearestSnap(this.scroller.x, this.scroller.y);

			var time = this.options.snapSpeed || Math.max(
					Math.max(
						Math.min(Math.abs(this.scroller.x - snap.x), 1000),
						Math.min(Math.abs(this.scroller.y - snap.y), 1000)
					), 300);

			if ( this.scroller.x != snap.x || this.scroller.y != snap.y ) {
				this.scroller.directionX = 0;
				this.scroller.directionY = 0;
				this.scroller.currentPage = snap;
				this.scroller.scrollTo(snap.x, snap.y, time, this.scroller.options.bounceEasing);
			}
		}

		if ( this.moved ) {
			this.scroller._execEvent('scrollEnd');
		}
	},

	transitionTime: function (time) {
		time = time || 0;
		this.indicatorStyle[utils.style.transitionDuration] = time + 'ms';

		if ( !time && utils.isBadAndroid ) {
			this.indicatorStyle[utils.style.transitionDuration] = '0.001s';
		}
	},

	transitionTimingFunction: function (easing) {
		this.indicatorStyle[utils.style.transitionTimingFunction] = easing;
	},

	refresh: function () {
		this.transitionTime();

		if ( this.options.listenX && !this.options.listenY ) {
			this.indicatorStyle.display = this.scroller.hasHorizontalScroll ? 'block' : 'none';
		} else if ( this.options.listenY && !this.options.listenX ) {
			this.indicatorStyle.display = this.scroller.hasVerticalScroll ? 'block' : 'none';
		} else {
			this.indicatorStyle.display = this.scroller.hasHorizontalScroll || this.scroller.hasVerticalScroll ? 'block' : 'none';
		}

		if ( this.scroller.hasHorizontalScroll && this.scroller.hasVerticalScroll ) {
			utils.addClass(this.wrapper, 'iScrollBothScrollbars');
			utils.removeClass(this.wrapper, 'iScrollLoneScrollbar');

			if ( this.options.defaultScrollbars && this.options.customStyle ) {
				if ( this.options.listenX ) {
					this.wrapper.style.right = '8px';
				} else {
					this.wrapper.style.bottom = '8px';
				}
			}
		} else {
			utils.removeClass(this.wrapper, 'iScrollBothScrollbars');
			utils.addClass(this.wrapper, 'iScrollLoneScrollbar');

			if ( this.options.defaultScrollbars && this.options.customStyle ) {
				if ( this.options.listenX ) {
					this.wrapper.style.right = '2px';
				} else {
					this.wrapper.style.bottom = '2px';
				}
			}
		}

		var r = this.wrapper.offsetHeight;	// force refresh

		if ( this.options.listenX ) {
			this.wrapperWidth = this.wrapper.clientWidth;
			if ( this.options.resize ) {
				this.indicatorWidth = Math.max(Math.round(this.wrapperWidth * this.wrapperWidth / (this.scroller.scrollerWidth || this.wrapperWidth || 1)), 8);
				this.indicatorStyle.width = this.indicatorWidth + 'px';
			} else {
				this.indicatorWidth = this.indicator.clientWidth;
			}

			this.maxPosX = this.wrapperWidth - this.indicatorWidth;

			if ( this.options.shrink == 'clip' ) {
				this.minBoundaryX = -this.indicatorWidth + 8;
				this.maxBoundaryX = this.wrapperWidth - 8;
			} else {
				this.minBoundaryX = 0;
				this.maxBoundaryX = this.maxPosX;
			}

			this.sizeRatioX = this.options.speedRatioX || (this.scroller.maxScrollX && (this.maxPosX / this.scroller.maxScrollX));	
		}

		if ( this.options.listenY ) {
			this.wrapperHeight = this.wrapper.clientHeight;
			if ( this.options.resize ) {
				this.indicatorHeight = Math.max(Math.round(this.wrapperHeight * this.wrapperHeight / (this.scroller.scrollerHeight || this.wrapperHeight || 1)), 8);
				this.indicatorStyle.height = this.indicatorHeight + 'px';
			} else {
				this.indicatorHeight = this.indicator.clientHeight;
			}

			this.maxPosY = this.wrapperHeight - this.indicatorHeight;

			if ( this.options.shrink == 'clip' ) {
				this.minBoundaryY = -this.indicatorHeight + 8;
				this.maxBoundaryY = this.wrapperHeight - 8;
			} else {
				this.minBoundaryY = 0;
				this.maxBoundaryY = this.maxPosY;
			}

			this.maxPosY = this.wrapperHeight - this.indicatorHeight;
			this.sizeRatioY = this.options.speedRatioY || (this.scroller.maxScrollY && (this.maxPosY / this.scroller.maxScrollY));
		}

		this.updatePosition();
	},

	updatePosition: function () {
		var x = this.options.listenX && Math.round(this.sizeRatioX * this.scroller.x) || 0,
			y = this.options.listenY && Math.round(this.sizeRatioY * this.scroller.y) || 0;

		if ( !this.options.ignoreBoundaries ) {
			if ( x < this.minBoundaryX ) {
				if ( this.options.shrink == 'scale' ) {
					this.width = Math.max(this.indicatorWidth + x, 8);
					this.indicatorStyle.width = this.width + 'px';
				}
				x = this.minBoundaryX;
			} else if ( x > this.maxBoundaryX ) {
				if ( this.options.shrink == 'scale' ) {
					this.width = Math.max(this.indicatorWidth - (x - this.maxPosX), 8);
					this.indicatorStyle.width = this.width + 'px';
					x = this.maxPosX + this.indicatorWidth - this.width;
				} else {
					x = this.maxBoundaryX;
				}
			} else if ( this.options.shrink == 'scale' && this.width != this.indicatorWidth ) {
				this.width = this.indicatorWidth;
				this.indicatorStyle.width = this.width + 'px';
			}

			if ( y < this.minBoundaryY ) {
				if ( this.options.shrink == 'scale' ) {
					this.height = Math.max(this.indicatorHeight + y * 3, 8);
					this.indicatorStyle.height = this.height + 'px';
				}
				y = this.minBoundaryY;
			} else if ( y > this.maxBoundaryY ) {
				if ( this.options.shrink == 'scale' ) {
					this.height = Math.max(this.indicatorHeight - (y - this.maxPosY) * 3, 8);
					this.indicatorStyle.height = this.height + 'px';
					y = this.maxPosY + this.indicatorHeight - this.height;
				} else {
					y = this.maxBoundaryY;
				}
			} else if ( this.options.shrink == 'scale' && this.height != this.indicatorHeight ) {
				this.height = this.indicatorHeight;
				this.indicatorStyle.height = this.height + 'px';
			}
		}

		this.x = x;
		this.y = y;

		if ( this.scroller.options.useTransform ) {
			this.indicatorStyle[utils.style.transform] = 'translate(' + x + 'px,' + y + 'px)' + this.scroller.translateZ;
		} else {
			this.indicatorStyle.left = x + 'px';
			this.indicatorStyle.top = y + 'px';
		}
	},

	_pos: function (x, y) {
		if ( x < 0 ) {
			x = 0;
		} else if ( x > this.maxPosX ) {
			x = this.maxPosX;
		}

		if ( y < 0 ) {
			y = 0;
		} else if ( y > this.maxPosY ) {
			y = this.maxPosY;
		}

		x = this.options.listenX ? Math.round(x / this.sizeRatioX) : this.scroller.x;
		y = this.options.listenY ? Math.round(y / this.sizeRatioY) : this.scroller.y;

		this.scroller.scrollTo(x, y);
	},

	fade: function (val, hold) {
		if ( hold && !this.visible ) {
			return;
		}

		clearTimeout(this.fadeTimeout);
		this.fadeTimeout = null;

		var time = val ? 250 : 500,
			delay = val ? 0 : 300;

		val = val ? '1' : '0';

		this.wrapperStyle[utils.style.transitionDuration] = time + 'ms';

		this.fadeTimeout = setTimeout((function (val) {
			this.wrapperStyle.opacity = val;
			this.visible = +val;
		}).bind(this, val), delay);
	}
};

IScroll.utils = utils;

if ( typeof module != 'undefined' && module.exports ) {
	module.exports = IScroll;
} else {
	window.IScroll = IScroll;
}

})(window, document, Math);
//fgnass.github.com/spin.js#v2.0.1
!function(a,b){"object"==typeof exports?module.exports=b():"function"==typeof define&&define.amd?define(b):a.Spinner=b()}(this,function(){"use strict";function a(a,b){var c,d=document.createElement(a||"div");for(c in b)d[c]=b[c];return d}function b(a){for(var b=1,c=arguments.length;c>b;b++)a.appendChild(arguments[b]);return a}function c(a,b,c,d){var e=["opacity",b,~~(100*a),c,d].join("-"),f=.01+c/d*100,g=Math.max(1-(1-a)/b*(100-f),a),h=j.substring(0,j.indexOf("Animation")).toLowerCase(),i=h&&"-"+h+"-"||"";return l[e]||(m.insertRule("@"+i+"keyframes "+e+"{0%{opacity:"+g+"}"+f+"%{opacity:"+a+"}"+(f+.01)+"%{opacity:1}"+(f+b)%100+"%{opacity:"+a+"}100%{opacity:"+g+"}}",m.cssRules.length),l[e]=1),e}function d(a,b){var c,d,e=a.style;for(b=b.charAt(0).toUpperCase()+b.slice(1),d=0;d<k.length;d++)if(c=k[d]+b,void 0!==e[c])return c;return void 0!==e[b]?b:void 0}function e(a,b){for(var c in b)a.style[d(a,c)||c]=b[c];return a}function f(a){for(var b=1;b<arguments.length;b++){var c=arguments[b];for(var d in c)void 0===a[d]&&(a[d]=c[d])}return a}function g(a,b){return"string"==typeof a?a:a[b%a.length]}function h(a){this.opts=f(a||{},h.defaults,n)}function i(){function c(b,c){return a("<"+b+' xmlns="urn:schemas-microsoft.com:vml" class="spin-vml">',c)}m.addRule(".spin-vml","behavior:url(#default#VML)"),h.prototype.lines=function(a,d){function f(){return e(c("group",{coordsize:k+" "+k,coordorigin:-j+" "+-j}),{width:k,height:k})}function h(a,h,i){b(m,b(e(f(),{rotation:360/d.lines*a+"deg",left:~~h}),b(e(c("roundrect",{arcsize:d.corners}),{width:j,height:d.width,left:d.radius,top:-d.width>>1,filter:i}),c("fill",{color:g(d.color,a),opacity:d.opacity}),c("stroke",{opacity:0}))))}var i,j=d.length+d.width,k=2*j,l=2*-(d.width+d.length)+"px",m=e(f(),{position:"absolute",top:l,left:l});if(d.shadow)for(i=1;i<=d.lines;i++)h(i,-2,"progid:DXImageTransform.Microsoft.Blur(pixelradius=2,makeshadow=1,shadowopacity=.3)");for(i=1;i<=d.lines;i++)h(i);return b(a,m)},h.prototype.opacity=function(a,b,c,d){var e=a.firstChild;d=d.shadow&&d.lines||0,e&&b+d<e.childNodes.length&&(e=e.childNodes[b+d],e=e&&e.firstChild,e=e&&e.firstChild,e&&(e.opacity=c))}}var j,k=["webkit","Moz","ms","O"],l={},m=function(){var c=a("style",{type:"text/css"});return b(document.getElementsByTagName("head")[0],c),c.sheet||c.styleSheet}(),n={lines:12,length:7,width:5,radius:10,rotate:0,corners:1,color:"#000",direction:1,speed:1,trail:100,opacity:.25,fps:20,zIndex:2e9,className:"spinner",top:"50%",left:"50%",position:"absolute"};h.defaults={},f(h.prototype,{spin:function(b){this.stop();{var c=this,d=c.opts,f=c.el=e(a(0,{className:d.className}),{position:d.position,width:0,zIndex:d.zIndex});d.radius+d.length+d.width}if(e(f,{left:d.left,top:d.top}),b&&b.insertBefore(f,b.firstChild||null),f.setAttribute("role","progressbar"),c.lines(f,c.opts),!j){var g,h=0,i=(d.lines-1)*(1-d.direction)/2,k=d.fps,l=k/d.speed,m=(1-d.opacity)/(l*d.trail/100),n=l/d.lines;!function o(){h++;for(var a=0;a<d.lines;a++)g=Math.max(1-(h+(d.lines-a)*n)%l*m,d.opacity),c.opacity(f,a*d.direction+i,g,d);c.timeout=c.el&&setTimeout(o,~~(1e3/k))}()}return c},stop:function(){var a=this.el;return a&&(clearTimeout(this.timeout),a.parentNode&&a.parentNode.removeChild(a),this.el=void 0),this},lines:function(d,f){function h(b,c){return e(a(),{position:"absolute",width:f.length+f.width+"px",height:f.width+"px",background:b,boxShadow:c,transformOrigin:"left",transform:"rotate("+~~(360/f.lines*k+f.rotate)+"deg) translate("+f.radius+"px,0)",borderRadius:(f.corners*f.width>>1)+"px"})}for(var i,k=0,l=(f.lines-1)*(1-f.direction)/2;k<f.lines;k++)i=e(a(),{position:"absolute",top:1+~(f.width/2)+"px",transform:f.hwaccel?"translate3d(0,0,0)":"",opacity:f.opacity,animation:j&&c(f.opacity,f.trail,l+k*f.direction,f.lines)+" "+1/f.speed+"s linear infinite"}),f.shadow&&b(i,e(h("#000","0 0 4px #000"),{top:"2px"})),b(d,b(i,h(g(f.color,k),"0 0 1px rgba(0,0,0,.1)")));return d},opacity:function(a,b,c){b<a.childNodes.length&&(a.childNodes[b].style.opacity=c)}});var o=e(a("group"),{behavior:"url(#default#VML)"});return!d(o,"transform")&&o.adj?i():j=d(o,"animation"),h});
window.url = (function() {
    function isNumeric(arg) {
      return !isNaN(parseFloat(arg)) && isFinite(arg);
    }
    
    return function(arg, url) {
        var _ls = url || window.location.toString();

        if (!arg) { return _ls; }
        else { arg = arg.toString(); }

        if (_ls.substring(0,2) === '//') { _ls = 'http:' + _ls; }
        else if (_ls.split('://').length === 1) { _ls = 'http://' + _ls; }

        url = _ls.split('/');
        var _l = {auth:''}, host = url[2].split('@');

        if (host.length === 1) { host = host[0].split(':'); }
        else { _l.auth = host[0]; host = host[1].split(':'); }

        _l.protocol=url[0];
        _l.hostname=host[0];
        _l.port=(host[1] || ((_l.protocol.split(':')[0].toLowerCase() === 'https') ? '443' : '80'));
        _l.pathname=( (url.length > 3 ? '/' : '') + url.slice(3, url.length).join('/').split('?')[0].split('#')[0]);
        var _p = _l.pathname;

        if (_p.charAt(_p.length-1) === '/') { _p=_p.substring(0, _p.length-1); }
        var _h = _l.hostname, _hs = _h.split('.'), _ps = _p.split('/');

        if (arg === 'hostname') { return _h; }
        else if (arg === 'domain') {
            if (/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/.test(_h)) { return _h; }
            return _hs.slice(-2).join('.'); 
        }
        //else if (arg === 'tld') { return _hs.slice(-1).join('.'); }
        else if (arg === 'sub') { return _hs.slice(0, _hs.length - 2).join('.'); }
        else if (arg === 'port') { return _l.port; }
        else if (arg === 'protocol') { return _l.protocol.split(':')[0]; }
        else if (arg === 'auth') { return _l.auth; }
        else if (arg === 'user') { return _l.auth.split(':')[0]; }
        else if (arg === 'pass') { return _l.auth.split(':')[1] || ''; }
        else if (arg === 'path') { return _l.pathname; }
        else if (arg.charAt(0) === '.')
        {
            arg = arg.substring(1);
            if(isNumeric(arg)) {arg = parseInt(arg, 10); return _hs[arg < 0 ? _hs.length + arg : arg-1] || ''; }
        }
        else if (isNumeric(arg)) { arg = parseInt(arg, 10); return _ps[arg < 0 ? _ps.length + arg : arg] || ''; }
        else if (arg === 'file') { return _ps.slice(-1)[0]; }
        else if (arg === 'filename') { return _ps.slice(-1)[0].split('.')[0]; }
        else if (arg === 'fileext') { return _ps.slice(-1)[0].split('.')[1] || ''; }
        else if (arg.charAt(0) === '?' || arg.charAt(0) === '#')
        {
            var params = _ls, param = null;

            if(arg.charAt(0) === '?') { params = (params.split('?')[1] || '').split('#')[0]; }
            else if(arg.charAt(0) === '#') { params = (params.split('#')[1] || ''); }

            if(!arg.charAt(1)) { return params; }

            arg = arg.substring(1);
            params = params.split('&');

            for(var i=0,ii=params.length; i<ii; i++)
            {
                param = params[i].split('=');
                if(param[0] === arg) { return param[1] || ''; }
            }

            return null;
        }

        return '';
    };
})();

if(typeof jQuery !== 'undefined') {
    jQuery.extend({
        url: function(arg, url) { return window.url(arg, url); }
    });
}
/*! Lazy Load 1.9.1 - MIT license - Copyright 2010-2013 Mika Tuupola */
!function(a,b,c,d){var e=a(b);a.fn.lazyload=function(f){function g(){var b=0;i.each(function(){var c=a(this);if(!j.skip_invisible||c.is(":visible"))if(a.abovethetop(this,j)||a.leftofbegin(this,j));else if(a.belowthefold(this,j)||a.rightoffold(this,j)){if(++b>j.failure_limit)return!1}else c.trigger("appear"),b=0})}var h,i=this,j={threshold:0,failure_limit:0,event:"scroll",effect:"show",container:b,data_attribute:"original",skip_invisible:!0,appear:null,load:null,placeholder:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXYzh8+PB/AAffA0nNPuCLAAAAAElFTkSuQmCC"};return f&&(d!==f.failurelimit&&(f.failure_limit=f.failurelimit,delete f.failurelimit),d!==f.effectspeed&&(f.effect_speed=f.effectspeed,delete f.effectspeed),a.extend(j,f)),h=j.container===d||j.container===b?e:a(j.container),0===j.event.indexOf("scroll")&&h.bind(j.event,function(){return g()}),this.each(function(){var b=this,c=a(b);b.loaded=!1,(c.attr("src")===d||c.attr("src")===!1)&&c.is("img")&&c.attr("src",j.placeholder),c.one("appear",function(){if(!this.loaded){if(j.appear){var d=i.length;j.appear.call(b,d,j)}a("<img />").bind("load",function(){var d=c.attr("data-"+j.data_attribute);c.hide(),c.is("img")?c.attr("src",d):c.css("background-image","url('"+d+"')"),c[j.effect](j.effect_speed),b.loaded=!0;var e=a.grep(i,function(a){return!a.loaded});if(i=a(e),j.load){var f=i.length;j.load.call(b,f,j)}}).attr("src",c.attr("data-"+j.data_attribute))}}),0!==j.event.indexOf("scroll")&&c.bind(j.event,function(){b.loaded||c.trigger("appear")})}),e.bind("resize",function(){g()}),/(?:iphone|ipod|ipad).*os 5/gi.test(navigator.appVersion)&&e.bind("pageshow",function(b){b.originalEvent&&b.originalEvent.persisted&&i.each(function(){a(this).trigger("appear")})}),a(c).ready(function(){g()}),this},a.belowthefold=function(c,f){var g;return g=f.container===d||f.container===b?(b.innerHeight?b.innerHeight:e.height())+e.scrollTop():a(f.container).offset().top+a(f.container).height(),g<=a(c).offset().top-f.threshold},a.rightoffold=function(c,f){var g;return g=f.container===d||f.container===b?e.width()+e.scrollLeft():a(f.container).offset().left+a(f.container).width(),g<=a(c).offset().left-f.threshold},a.abovethetop=function(c,f){var g;return g=f.container===d||f.container===b?e.scrollTop():a(f.container).offset().top,g>=a(c).offset().top+f.threshold+a(c).height()},a.leftofbegin=function(c,f){var g;return g=f.container===d||f.container===b?e.scrollLeft():a(f.container).offset().left,g>=a(c).offset().left+f.threshold+a(c).width()},a.inviewport=function(b,c){return!(a.rightoffold(b,c)||a.leftofbegin(b,c)||a.belowthefold(b,c)||a.abovethetop(b,c))},a.extend(a.expr[":"],{"below-the-fold":function(b){return a.belowthefold(b,{threshold:0})},"above-the-top":function(b){return!a.belowthefold(b,{threshold:0})},"right-of-screen":function(b){return a.rightoffold(b,{threshold:0})},"left-of-screen":function(b){return!a.rightoffold(b,{threshold:0})},"in-viewport":function(b){return a.inviewport(b,{threshold:0})},"above-the-fold":function(b){return!a.belowthefold(b,{threshold:0})},"right-of-fold":function(b){return a.rightoffold(b,{threshold:0})},"left-of-fold":function(b){return!a.rightoffold(b,{threshold:0})}})}(jQuery,window,document);
// MarionetteJS (Backbone.Marionette)
// ----------------------------------
// v2.2.0
//
// Copyright (c)2014 Derick Bailey, Muted Solutions, LLC.
// Distributed under MIT license
//
// http://marionettejs.com


/*!
 * Includes BabySitter
 * https://github.com/marionettejs/backbone.babysitter/
 *
 * Includes Wreqr
 * https://github.com/marionettejs/backbone.wreqr/
 */



!function(a,b){if("function"==typeof define&&define.amd)define(["backbone","underscore"],function(c,d){return a.Marionette=b(a,c,d)});else if("undefined"!=typeof exports){var c=require("backbone"),d=require("underscore");module.exports=b(a,c,d)}else a.Marionette=b(a,a.Backbone,a._)}(this,function(a,b,c){"use strict";!function(a,b){var c=a.ChildViewContainer;return a.ChildViewContainer=function(a,b){var c=function(a){this._views={},this._indexByModel={},this._indexByCustom={},this._updateLength(),b.each(a,this.add,this)};b.extend(c.prototype,{add:function(a,b){var c=a.cid;return this._views[c]=a,a.model&&(this._indexByModel[a.model.cid]=c),b&&(this._indexByCustom[b]=c),this._updateLength(),this},findByModel:function(a){return this.findByModelCid(a.cid)},findByModelCid:function(a){var b=this._indexByModel[a];return this.findByCid(b)},findByCustom:function(a){var b=this._indexByCustom[a];return this.findByCid(b)},findByIndex:function(a){return b.values(this._views)[a]},findByCid:function(a){return this._views[a]},remove:function(a){var c=a.cid;return a.model&&delete this._indexByModel[a.model.cid],b.any(this._indexByCustom,function(a,b){return a===c?(delete this._indexByCustom[b],!0):void 0},this),delete this._views[c],this._updateLength(),this},call:function(a){this.apply(a,b.tail(arguments))},apply:function(a,c){b.each(this._views,function(d){b.isFunction(d[a])&&d[a].apply(d,c||[])})},_updateLength:function(){this.length=b.size(this._views)}});var d=["forEach","each","map","find","detect","filter","select","reject","every","all","some","any","include","contains","invoke","toArray","first","initial","rest","last","without","isEmpty","pluck"];return b.each(d,function(a){c.prototype[a]=function(){var c=b.values(this._views),d=[c].concat(b.toArray(arguments));return b[a].apply(b,d)}}),c}(a,b),a.ChildViewContainer.VERSION="0.1.4",a.ChildViewContainer.noConflict=function(){return a.ChildViewContainer=c,this},a.ChildViewContainer}(b,c),function(a,b){var c=a.Wreqr,d=a.Wreqr={};return a.Wreqr.VERSION="1.3.1",a.Wreqr.noConflict=function(){return a.Wreqr=c,this},d.Handlers=function(a,b){var c=function(a){this.options=a,this._wreqrHandlers={},b.isFunction(this.initialize)&&this.initialize(a)};return c.extend=a.Model.extend,b.extend(c.prototype,a.Events,{setHandlers:function(a){b.each(a,function(a,c){var d=null;b.isObject(a)&&!b.isFunction(a)&&(d=a.context,a=a.callback),this.setHandler(c,a,d)},this)},setHandler:function(a,b,c){var d={callback:b,context:c};this._wreqrHandlers[a]=d,this.trigger("handler:add",a,b,c)},hasHandler:function(a){return!!this._wreqrHandlers[a]},getHandler:function(a){var b=this._wreqrHandlers[a];if(b)return function(){var a=Array.prototype.slice.apply(arguments);return b.callback.apply(b.context,a)}},removeHandler:function(a){delete this._wreqrHandlers[a]},removeAllHandlers:function(){this._wreqrHandlers={}}}),c}(a,b),d.CommandStorage=function(){var c=function(a){this.options=a,this._commands={},b.isFunction(this.initialize)&&this.initialize(a)};return b.extend(c.prototype,a.Events,{getCommands:function(a){var b=this._commands[a];return b||(b={command:a,instances:[]},this._commands[a]=b),b},addCommand:function(a,b){var c=this.getCommands(a);c.instances.push(b)},clearCommands:function(a){var b=this.getCommands(a);b.instances=[]}}),c}(),d.Commands=function(a){return a.Handlers.extend({storageType:a.CommandStorage,constructor:function(b){this.options=b||{},this._initializeStorage(this.options),this.on("handler:add",this._executeCommands,this);var c=Array.prototype.slice.call(arguments);a.Handlers.prototype.constructor.apply(this,c)},execute:function(a,b){a=arguments[0],b=Array.prototype.slice.call(arguments,1),this.hasHandler(a)?this.getHandler(a).apply(this,b):this.storage.addCommand(a,b)},_executeCommands:function(a,c,d){var e=this.storage.getCommands(a);b.each(e.instances,function(a){c.apply(d,a)}),this.storage.clearCommands(a)},_initializeStorage:function(a){var c,d=a.storageType||this.storageType;c=b.isFunction(d)?new d:d,this.storage=c}})}(d),d.RequestResponse=function(a){return a.Handlers.extend({request:function(){var a=arguments[0],b=Array.prototype.slice.call(arguments,1);return this.hasHandler(a)?this.getHandler(a).apply(this,b):void 0}})}(d),d.EventAggregator=function(a,b){var c=function(){};return c.extend=a.Model.extend,b.extend(c.prototype,a.Events),c}(a,b),d.Channel=function(){var c=function(b){this.vent=new a.Wreqr.EventAggregator,this.reqres=new a.Wreqr.RequestResponse,this.commands=new a.Wreqr.Commands,this.channelName=b};return b.extend(c.prototype,{reset:function(){return this.vent.off(),this.vent.stopListening(),this.reqres.removeAllHandlers(),this.commands.removeAllHandlers(),this},connectEvents:function(a,b){return this._connect("vent",a,b),this},connectCommands:function(a,b){return this._connect("commands",a,b),this},connectRequests:function(a,b){return this._connect("reqres",a,b),this},_connect:function(a,c,d){if(c){d=d||this;var e="vent"===a?"on":"setHandler";b.each(c,function(c,f){this[a][e](f,b.bind(c,d))},this)}}}),c}(d),d.radio=function(a){var c=function(){this._channels={},this.vent={},this.commands={},this.reqres={},this._proxyMethods()};b.extend(c.prototype,{channel:function(a){if(!a)throw new Error("Channel must receive a name");return this._getChannel(a)},_getChannel:function(b){var c=this._channels[b];return c||(c=new a.Channel(b),this._channels[b]=c),c},_proxyMethods:function(){b.each(["vent","commands","reqres"],function(a){b.each(d[a],function(b){this[a][b]=e(this,a,b)},this)},this)}});var d={vent:["on","off","trigger","once","stopListening","listenTo","listenToOnce"],commands:["execute","setHandler","setHandlers","removeHandler","removeAllHandlers"],reqres:["request","setHandler","setHandlers","removeHandler","removeAllHandlers"]},e=function(a,b,c){return function(d){var e=a._getChannel(d)[b],f=Array.prototype.slice.call(arguments,1);return e[c].apply(e,f)}};return new c}(d),a.Wreqr}(b,c);var d=a.Marionette,e=b.Marionette={};e.VERSION="2.2.0",e.noConflict=function(){return a.Marionette=d,this},b.Marionette=e,e.Deferred=b.$.Deferred;var f=Array.prototype.slice;e.extend=b.Model.extend,e.getOption=function(a,b){if(a&&b){var c;return c=a.options&&void 0!==a.options[b]?a.options[b]:a[b]}},e.proxyGetOption=function(a){return e.getOption(this,a)},e.normalizeMethods=function(a){var b={};return c.each(a,function(a,d){c.isFunction(a)||(a=this[a]),a&&(b[d]=a)},this),b},e.normalizeUIString=function(a,b){return a.replace(/@ui\.[a-zA-Z_$0-9]*/g,function(a){return b[a.slice(4)]})},e.normalizeUIKeys=function(a,b){return"undefined"!=typeof a?(a=c.clone(a),c.each(c.keys(a),function(c){var d=e.normalizeUIString(c,b);d!==c&&(a[d]=a[c],delete a[c])}),a):void 0},e.normalizeUIValues=function(a,b){return"undefined"!=typeof a?(c.each(a,function(d,f){c.isString(d)&&(a[f]=e.normalizeUIString(d,b))}),a):void 0},e.actAsCollection=function(a,b){var d=["forEach","each","map","find","detect","filter","select","reject","every","all","some","any","include","contains","invoke","toArray","first","initial","rest","last","without","isEmpty","pluck"];c.each(d,function(d){a[d]=function(){var a=c.values(c.result(this,b)),e=[a].concat(c.toArray(arguments));return c[d].apply(c,e)}})},e.triggerMethod=function(a){function b(a,b,c){return c.toUpperCase()}var d,e=/(^|:)(\w)/gi,f="on"+a.replace(e,b),g=this[f];return c.isFunction(g)&&(d=g.apply(this,c.tail(arguments))),c.isFunction(this.trigger)&&this.trigger.apply(this,arguments),d},e.triggerMethodOn=function(a,b){var d,f=c.tail(arguments,2);return d=c.isFunction(a.triggerMethod)?a.triggerMethod:e.triggerMethod,d.apply(a,[b].concat(f))},e.MonitorDOMRefresh=function(a){function d(a){a._isShown=!0,f(a)}function e(a){a._isRendered=!0,f(a)}function f(a){a._isShown&&a._isRendered&&g(a)&&c.isFunction(a.triggerMethod)&&a.triggerMethod("dom:refresh")}function g(c){return b.$.contains(a,c.el)}return function(a){a.listenTo(a,"show",function(){d(a)}),a.listenTo(a,"render",function(){e(a)})}}(document.documentElement),function(a){function b(b,d,e,f){var g=f.split(/\s+/);c.each(g,function(c){var f=b[c];if(!f)throw new a.Error('Method "'+c+'" was configured as an event handler, but does not exist.');b.listenTo(d,e,f)})}function d(a,b,c,d){a.listenTo(b,c,d)}function e(a,b,d,e){var f=e.split(/\s+/);c.each(f,function(c){var e=a[c];a.stopListening(b,d,e)})}function f(a,b,c,d){a.stopListening(b,c,d)}function g(b,d,e,f,g){if(d&&e){if(!c.isFunction(e)&&!c.isObject(e))throw new a.Error({message:"Bindings must be an object or function.",url:"marionette.functions.html#marionettebindentityevents"});c.isFunction(e)&&(e=e.call(b)),c.each(e,function(a,e){c.isFunction(a)?f(b,d,e,a):g(b,d,e,a)})}}a.bindEntityEvents=function(a,c,e){g(a,c,e,d,b)},a.unbindEntityEvents=function(a,b,c){g(a,b,c,f,e)},a.proxyBindEntityEvents=function(b,c){return a.bindEntityEvents(this,b,c)},a.proxyUnbindEntityEvents=function(b,c){return a.unbindEntityEvents(this,b,c)}}(e);var g=["description","fileName","lineNumber","name","message","number"];return e.Error=e.extend.call(Error,{urlRoot:"http://marionettejs.com/docs/"+e.VERSION+"/",constructor:function(a,b){c.isObject(a)?(b=a,a=b.message):b||(b={});var d=Error.call(this,a);c.extend(this,c.pick(d,g),c.pick(b,g)),this.captureStackTrace(),b.url&&(this.url=this.urlRoot+b.url)},captureStackTrace:function(){Error.captureStackTrace&&Error.captureStackTrace(this,e.Error)},toString:function(){return this.name+": "+this.message+(this.url?" See: "+this.url:"")}}),e.Error.extend=e.extend,e.Callbacks=function(){this._deferred=e.Deferred(),this._callbacks=[]},c.extend(e.Callbacks.prototype,{add:function(a,b){var d=c.result(this._deferred,"promise");this._callbacks.push({cb:a,ctx:b}),d.then(function(c){b&&(c.context=b),a.call(c.context,c.options)})},run:function(a,b){this._deferred.resolve({options:a,context:b})},reset:function(){var a=this._callbacks;this._deferred=e.Deferred(),this._callbacks=[],c.each(a,function(a){this.add(a.cb,a.ctx)},this)}}),e.Controller=function(a){this.options=a||{},c.isFunction(this.initialize)&&this.initialize(this.options)},e.Controller.extend=e.extend,c.extend(e.Controller.prototype,b.Events,{destroy:function(){var a=f.call(arguments);return this.triggerMethod.apply(this,["before:destroy"].concat(a)),this.triggerMethod.apply(this,["destroy"].concat(a)),this.stopListening(),this.off(),this},triggerMethod:e.triggerMethod,getOption:e.proxyGetOption}),e.Object=function(a){this.options=c.extend({},c.result(this,"options"),a),this.initialize.apply(this,arguments)},e.Object.extend=e.extend,c.extend(e.Object.prototype,{initialize:function(){},destroy:function(){this.triggerMethod("before:destroy"),this.triggerMethod("destroy"),this.stopListening()},triggerMethod:e.triggerMethod,getOption:e.proxyGetOption,bindEntityEvents:e.proxyBindEntityEvents,unbindEntityEvents:e.proxyUnbindEntityEvents}),c.extend(e.Object.prototype,b.Events),e.Region=function(a){if(this.options=a||{},this.el=this.getOption("el"),this.el=this.el instanceof b.$?this.el[0]:this.el,!this.el)throw new e.Error({name:"NoElError",message:'An "el" must be specified for a region.'});if(this.$el=this.getEl(this.el),this.initialize){var c=f.apply(arguments);this.initialize.apply(this,c)}},c.extend(e.Region,{buildRegion:function(a,b){if(c.isString(a))return this._buildRegionFromSelector(a,b);if(a.selector||a.el||a.regionClass)return this._buildRegionFromObject(a,b);if(c.isFunction(a))return this._buildRegionFromRegionClass(a);throw new e.Error({message:"Improper region configuration type.",url:"marionette.region.html#region-configuration-types"})},_buildRegionFromSelector:function(a,b){return new b({el:a})},_buildRegionFromObject:function(a,d){var e=a.regionClass||d,f=c.omit(a,"selector","regionClass");a.selector&&!f.el&&(f.el=a.selector);var g=new e(f);return a.parentEl&&(g.getEl=function(d){if(c.isObject(d))return b.$(d);var e=a.parentEl;return c.isFunction(e)&&(e=e()),e.find(d)}),g},_buildRegionFromRegionClass:function(a){return new a}}),c.extend(e.Region.prototype,b.Events,{show:function(a,b){this._ensureElement();var d=b||{},f=a!==this.currentView,g=!!d.preventDestroy,h=!!d.forceShow,i=!!this.currentView,j=!g&&f,k=f||h;return i&&this.triggerMethod("before:swapOut",this.currentView),j&&this.empty(),k?(a.once("destroy",c.bind(this.empty,this)),a.render(),i&&this.triggerMethod("before:swap",a),this.triggerMethod("before:show",a),e.triggerMethodOn(a,"before:show"),i&&this.triggerMethod("swapOut",this.currentView),this.attachHtml(a),this.currentView=a,i&&this.triggerMethod("swap",a),this.triggerMethod("show",a),e.triggerMethodOn(a,"show"),this):this},_ensureElement:function(){if(c.isObject(this.el)||(this.$el=this.getEl(this.el),this.el=this.$el[0]),!this.$el||0===this.$el.length)throw new e.Error('An "el" '+this.$el.selector+" must exist in DOM")},getEl:function(a){return b.$(a)},attachHtml:function(a){this.el.innerHTML="",this.el.appendChild(a.el)},empty:function(){var a=this.currentView;if(a)return this.triggerMethod("before:empty",a),this._destroyView(),this.triggerMethod("empty",a),delete this.currentView,this},_destroyView:function(){var a=this.currentView;a.destroy&&!a.isDestroyed?a.destroy():a.remove&&a.remove()},attachView:function(a){return this.currentView=a,this},hasView:function(){return!!this.currentView},reset:function(){return this.empty(),this.$el&&(this.el=this.$el.selector),delete this.$el,this},getOption:e.proxyGetOption,triggerMethod:e.triggerMethod}),e.Region.extend=e.extend,e.RegionManager=function(a){var b=a.Controller.extend({constructor:function(b){this._regions={},a.Controller.call(this,b)},addRegions:function(a,b){c.isFunction(a)&&(a=a.apply(this,arguments));var d={};return c.each(a,function(a,e){c.isString(a)&&(a={selector:a}),a.selector&&(a=c.defaults({},a,b));var f=this.addRegion(e,a);d[e]=f},this),d},addRegion:function(b,c){var d;return d=c instanceof a.Region?c:a.Region.buildRegion(c,a.Region),this.triggerMethod("before:add:region",b,d),this._store(b,d),this.triggerMethod("add:region",b,d),d},get:function(a){return this._regions[a]},getRegions:function(){return c.clone(this._regions)},removeRegion:function(a){var b=this._regions[a];return this._remove(a,b),b},removeRegions:function(){var a=this.getRegions();return c.each(this._regions,function(a,b){this._remove(b,a)},this),a},emptyRegions:function(){var a=this.getRegions();return c.each(a,function(a){a.empty()},this),a},destroy:function(){return this.removeRegions(),a.Controller.prototype.destroy.apply(this,arguments)},_store:function(a,b){this._regions[a]=b,this._setLength()},_remove:function(a,b){this.triggerMethod("before:remove:region",a,b),b.empty(),b.stopListening(),delete this._regions[a],this._setLength(),this.triggerMethod("remove:region",a,b)},_setLength:function(){this.length=c.size(this._regions)}});return a.actAsCollection(b.prototype,"_regions"),b}(e),e.TemplateCache=function(a){this.templateId=a},c.extend(e.TemplateCache,{templateCaches:{},get:function(a){var b=this.templateCaches[a];return b||(b=new e.TemplateCache(a),this.templateCaches[a]=b),b.load()},clear:function(){var a,b=f.call(arguments),c=b.length;if(c>0)for(a=0;c>a;a++)delete this.templateCaches[b[a]];else this.templateCaches={}}}),c.extend(e.TemplateCache.prototype,{load:function(){if(this.compiledTemplate)return this.compiledTemplate;var a=this.loadTemplate(this.templateId);return this.compiledTemplate=this.compileTemplate(a),this.compiledTemplate},loadTemplate:function(a){var c=b.$(a).html();if(!c||0===c.length)throw new e.Error({name:"NoTemplateError",message:'Could not find template: "'+a+'"'});return c},compileTemplate:function(a){return c.template(a)}}),e.Renderer={render:function(a,b){if(!a)throw new e.Error({name:"TemplateNotFoundError",message:"Cannot render the template since its false, null or undefined."});var c;return(c="function"==typeof a?a:e.TemplateCache.get(a))(b)}},e.View=b.View.extend({constructor:function(a){c.bindAll(this,"render"),this.options=c.extend({},c.result(this,"options"),c.isFunction(a)?a.call(this):a),this._behaviors=e.Behaviors(this),b.View.apply(this,arguments),e.MonitorDOMRefresh(this),this.listenTo(this,"show",this.onShowCalled)},getTemplate:function(){return this.getOption("template")},serializeModel:function(a){return a.toJSON.apply(a,f.call(arguments,1))},mixinTemplateHelpers:function(a){a=a||{};var b=this.getOption("templateHelpers");return c.isFunction(b)&&(b=b.call(this)),c.extend(a,b)},normalizeUIKeys:function(a){var b=c.result(this,"ui"),d=c.result(this,"_uiBindings");return e.normalizeUIKeys(a,d||b)},normalizeUIValues:function(a){var b=c.result(this,"ui"),d=c.result(this,"_uiBindings");return e.normalizeUIValues(a,d||b)},configureTriggers:function(){if(this.triggers){var a={},b=this.normalizeUIKeys(c.result(this,"triggers"));return c.each(b,function(b,c){a[c]=this._buildViewTrigger(b)},this),a}},delegateEvents:function(a){return this._delegateDOMEvents(a),this.bindEntityEvents(this.model,this.getOption("modelEvents")),this.bindEntityEvents(this.collection,this.getOption("collectionEvents")),c.each(this._behaviors,function(a){a.bindEntityEvents(this.model,a.getOption("modelEvents")),a.bindEntityEvents(this.collection,a.getOption("collectionEvents"))},this),this},_delegateDOMEvents:function(a){var d=a||this.events;c.isFunction(d)&&(d=d.call(this)),d=this.normalizeUIKeys(d),c.isUndefined(a)&&(this.events=d);var e={},f=c.result(this,"behaviorEvents")||{},g=this.configureTriggers(),h=c.result(this,"behaviorTriggers")||{};c.extend(e,f,d,g,h),b.View.prototype.delegateEvents.call(this,e)},undelegateEvents:function(){var a=f.call(arguments);return b.View.prototype.undelegateEvents.apply(this,a),this.unbindEntityEvents(this.model,this.getOption("modelEvents")),this.unbindEntityEvents(this.collection,this.getOption("collectionEvents")),c.each(this._behaviors,function(a){a.unbindEntityEvents(this.model,a.getOption("modelEvents")),a.unbindEntityEvents(this.collection,a.getOption("collectionEvents"))},this),this},onShowCalled:function(){},_ensureViewIsIntact:function(){if(this.isDestroyed)throw new e.Error({name:"ViewDestroyedError",message:'View (cid: "'+this.cid+'") has already been destroyed and cannot be used.'})},destroy:function(){if(!this.isDestroyed){var a=f.call(arguments);return this.triggerMethod.apply(this,["before:destroy"].concat(a)),this.isDestroyed=!0,this.triggerMethod.apply(this,["destroy"].concat(a)),this.unbindUIElements(),this.remove(),c.invoke(this._behaviors,"destroy",a),this}},bindUIElements:function(){this._bindUIElements(),c.invoke(this._behaviors,this._bindUIElements)},_bindUIElements:function(){if(this.ui){this._uiBindings||(this._uiBindings=this.ui);var a=c.result(this,"_uiBindings");this.ui={},c.each(c.keys(a),function(b){var c=a[b];this.ui[b]=this.$(c)},this)}},unbindUIElements:function(){this._unbindUIElements(),c.invoke(this._behaviors,this._unbindUIElements)},_unbindUIElements:function(){this.ui&&this._uiBindings&&(c.each(this.ui,function(a,b){delete this.ui[b]},this),this.ui=this._uiBindings,delete this._uiBindings)},_buildViewTrigger:function(a){var b=c.isObject(a),d=c.defaults({},b?a:{},{preventDefault:!0,stopPropagation:!0}),e=b?d.event:a;return function(a){a&&(a.preventDefault&&d.preventDefault&&a.preventDefault(),a.stopPropagation&&d.stopPropagation&&a.stopPropagation());var b={view:this,model:this.model,collection:this.collection};this.triggerMethod(e,b)}},setElement:function(){var a=b.View.prototype.setElement.apply(this,arguments);return c.invoke(this._behaviors,"proxyViewProperties",this),a},triggerMethod:function(){var a=arguments,b=e.triggerMethod,d=b.apply(this,a);return c.each(this._behaviors,function(c){b.apply(c,a)}),d},normalizeMethods:e.normalizeMethods,getOption:e.proxyGetOption,bindEntityEvents:e.proxyBindEntityEvents,unbindEntityEvents:e.proxyUnbindEntityEvents}),e.ItemView=e.View.extend({constructor:function(){e.View.apply(this,arguments)},serializeData:function(){var a={};return this.model?a=c.partial(this.serializeModel,this.model).apply(this,arguments):this.collection&&(a={items:c.partial(this.serializeCollection,this.collection).apply(this,arguments)}),a},serializeCollection:function(a){return a.toJSON.apply(a,f.call(arguments,1))},render:function(){return this._ensureViewIsIntact(),this.triggerMethod("before:render",this),this._renderTemplate(),this.bindUIElements(),this.triggerMethod("render",this),this},_renderTemplate:function(){var a=this.getTemplate();if(a!==!1){if(!a)throw new e.Error({name:"UndefinedTemplateError",message:"Cannot render the template since it is null or undefined."});var b=this.serializeData();b=this.mixinTemplateHelpers(b);var c=e.Renderer.render(a,b,this);return this.attachElContent(c),this}},attachElContent:function(a){return this.$el.html(a),this},destroy:function(){return this.isDestroyed?void 0:e.View.prototype.destroy.apply(this,arguments)}}),e.CollectionView=e.View.extend({childViewEventPrefix:"childview",constructor:function(a){var d=a||{};if(this.sort=c.isUndefined(d.sort)?!0:d.sort,d.collection&&!(d.collection instanceof b.Collection))throw new e.Error("The Collection option passed to this view needs to be an instance of a Backbone.Collection");this.once("render",this._initialEvents),this._initChildViewStorage(),e.View.apply(this,arguments),this.initRenderBuffer()},initRenderBuffer:function(){this.elBuffer=document.createDocumentFragment(),this._bufferedChildren=[]},startBuffering:function(){this.initRenderBuffer(),this.isBuffering=!0},endBuffering:function(){this.isBuffering=!1,this._triggerBeforeShowBufferedChildren(),this.attachBuffer(this,this.elBuffer),this._triggerShowBufferedChildren(),this.initRenderBuffer()},_triggerBeforeShowBufferedChildren:function(){this._isShown&&c.each(this._bufferedChildren,c.partial(this._triggerMethodOnChild,"before:show"))},_triggerShowBufferedChildren:function(){this._isShown&&(c.each(this._bufferedChildren,c.partial(this._triggerMethodOnChild,"show")),this._bufferedChildren=[])},_triggerMethodOnChild:function(a,b){e.triggerMethodOn(b,a)},_initialEvents:function(){this.collection&&(this.listenTo(this.collection,"add",this._onCollectionAdd),this.listenTo(this.collection,"remove",this._onCollectionRemove),this.listenTo(this.collection,"reset",this.render),this.sort&&this.listenTo(this.collection,"sort",this._sortViews))},_onCollectionAdd:function(a){this.destroyEmptyView();var b=this.getChildView(a),c=this.collection.indexOf(a);this.addChild(a,b,c)},_onCollectionRemove:function(a){var b=this.children.findByModel(a);this.removeChildView(b),this.checkEmpty()},onShowCalled:function(){this.children.each(c.partial(this._triggerMethodOnChild,"show"))},render:function(){return this._ensureViewIsIntact(),this.triggerMethod("before:render",this),this._renderChildren(),this.triggerMethod("render",this),this},resortView:function(){this.render()},_sortViews:function(){var a=this.collection.find(function(a,b){var c=this.children.findByModel(a);return!c||c._index!==b},this);a&&this.resortView()},_renderChildren:function(){this.destroyEmptyView(),this.destroyChildren(),this.isEmpty(this.collection)?this.showEmptyView():(this.triggerMethod("before:render:collection",this),this.startBuffering(),this.showCollection(),this.endBuffering(),this.triggerMethod("render:collection",this))},showCollection:function(){var a;this.collection.each(function(b,c){a=this.getChildView(b),this.addChild(b,a,c)},this)},showEmptyView:function(){var a=this.getEmptyView();if(a&&!this._showingEmptyView){this.triggerMethod("before:render:empty"),this._showingEmptyView=!0;var c=new b.Model;this.addEmptyView(c,a),this.triggerMethod("render:empty")}},destroyEmptyView:function(){this._showingEmptyView&&(this.triggerMethod("before:remove:empty"),this.destroyChildren(),delete this._showingEmptyView,this.triggerMethod("remove:empty"))},getEmptyView:function(){return this.getOption("emptyView")},addEmptyView:function(a,b){var d=this.getOption("emptyViewOptions")||this.getOption("childViewOptions");c.isFunction(d)&&(d=d.call(this));var f=this.buildChildView(a,b,d);this.proxyChildEvents(f),this._isShown&&e.triggerMethodOn(f,"before:show"),this.children.add(f),this.renderChildView(f,-1),this._isShown&&e.triggerMethodOn(f,"show")},getChildView:function(){var a=this.getOption("childView");if(!a)throw new e.Error({name:"NoChildViewError",message:'A "childView" must be specified'});return a},addChild:function(a,b,d){var e=this.getOption("childViewOptions");c.isFunction(e)&&(e=e.call(this,a,d));var f=this.buildChildView(a,b,e);return this._updateIndices(f,!0,d),this._addChildView(f,d),f},_updateIndices:function(a,b,c){this.sort&&(b?(a._index=c,this.children.each(function(b){b._index>=a._index&&b._index++})):this.children.each(function(b){b._index>=a._index&&b._index--}))},_addChildView:function(a,b){this.proxyChildEvents(a),this.triggerMethod("before:add:child",a),this.children.add(a),this.renderChildView(a,b),this._isShown&&!this.isBuffering&&e.triggerMethodOn(a,"show"),this.triggerMethod("add:child",a)},renderChildView:function(a,b){return a.render(),this.attachHtml(this,a,b),a},buildChildView:function(a,b,d){var e=c.extend({model:a},d);return new b(e)},removeChildView:function(a){return a&&(this.triggerMethod("before:remove:child",a),a.destroy?a.destroy():a.remove&&a.remove(),this.stopListening(a),this.children.remove(a),this.triggerMethod("remove:child",a),this._updateIndices(a,!1)),a},isEmpty:function(){return!this.collection||0===this.collection.length},checkEmpty:function(){this.isEmpty(this.collection)&&this.showEmptyView()},attachBuffer:function(a,b){a.$el.append(b)},attachHtml:function(a,b,c){a.isBuffering?(a.elBuffer.appendChild(b.el),a._bufferedChildren.push(b)):a._insertBefore(b,c)||a._insertAfter(b)},_insertBefore:function(a,b){var c,d=this.sort&&b<this.children.length-1;return d&&(c=this.children.find(function(a){return a._index===b+1})),c?(c.$el.before(a.el),!0):!1},_insertAfter:function(a){this.$el.append(a.el)},_initChildViewStorage:function(){this.children=new b.ChildViewContainer},destroy:function(){return this.isDestroyed?void 0:(this.triggerMethod("before:destroy:collection"),this.destroyChildren(),this.triggerMethod("destroy:collection"),e.View.prototype.destroy.apply(this,arguments))},destroyChildren:function(){var a=this.children.map(c.identity);return this.children.each(this.removeChildView,this),this.checkEmpty(),a},proxyChildEvents:function(a){var b=this.getOption("childViewEventPrefix");this.listenTo(a,"all",function(){var d=f.call(arguments),e=d[0],g=this.normalizeMethods(c.result(this,"childEvents"));d[0]=b+":"+e,d.splice(1,0,a),"undefined"!=typeof g&&c.isFunction(g[e])&&g[e].apply(this,d.slice(1)),this.triggerMethod.apply(this,d)},this)}}),e.CompositeView=e.CollectionView.extend({constructor:function(){e.CollectionView.apply(this,arguments)},_initialEvents:function(){this.collection&&(this.listenTo(this.collection,"add",this._onCollectionAdd),this.listenTo(this.collection,"remove",this._onCollectionRemove),this.listenTo(this.collection,"reset",this._renderChildren),this.sort&&this.listenTo(this.collection,"sort",this._sortViews))},getChildView:function(){var a=this.getOption("childView")||this.constructor;if(!a)throw new e.Error({name:"NoChildViewError",message:'A "childView" must be specified'});return a},serializeData:function(){var a={};return this.model&&(a=c.partial(this.serializeModel,this.model).apply(this,arguments)),a},render:function(){return this._ensureViewIsIntact(),this.isRendered=!0,this.resetChildViewContainer(),this.triggerMethod("before:render",this),this._renderTemplate(),this._renderChildren(),this.triggerMethod("render",this),this},_renderChildren:function(){this.isRendered&&e.CollectionView.prototype._renderChildren.call(this)},_renderTemplate:function(){var a={};a=this.serializeData(),a=this.mixinTemplateHelpers(a),this.triggerMethod("before:render:template");var b=this.getTemplate(),c=e.Renderer.render(b,a,this);this.attachElContent(c),this.bindUIElements(),this.triggerMethod("render:template")},attachElContent:function(a){return this.$el.html(a),this},attachBuffer:function(a,b){var c=this.getChildViewContainer(a);c.append(b)},_insertAfter:function(a){var b=this.getChildViewContainer(this);b.append(a.el)},getChildViewContainer:function(a){if("$childViewContainer"in a)return a.$childViewContainer;var b,d=e.getOption(a,"childViewContainer");if(d){var f=c.isFunction(d)?d.call(a):d;if(b="@"===f.charAt(0)&&a.ui?a.ui[f.substr(4)]:a.$(f),b.length<=0)throw new e.Error({name:"ChildViewContainerMissingError",message:'The specified "childViewContainer" was not found: '+a.childViewContainer})}else b=a.$el;return a.$childViewContainer=b,b},resetChildViewContainer:function(){this.$childViewContainer&&delete this.$childViewContainer}}),e.LayoutView=e.ItemView.extend({regionClass:e.Region,constructor:function(a){a=a||{},this._firstRender=!0,this._initializeRegions(a),e.ItemView.call(this,a)},render:function(){return this._ensureViewIsIntact(),this._firstRender?this._firstRender=!1:this._reInitializeRegions(),e.ItemView.prototype.render.apply(this,arguments)},destroy:function(){return this.isDestroyed?this:(this.regionManager.destroy(),e.ItemView.prototype.destroy.apply(this,arguments))},addRegion:function(a,b){this.triggerMethod("before:region:add",a);var c={};return c[a]=b,this._buildRegions(c)[a]},addRegions:function(a){return this.regions=c.extend({},this.regions,a),this._buildRegions(a)},removeRegion:function(a){return this.triggerMethod("before:region:remove",a),delete this.regions[a],this.regionManager.removeRegion(a)},getRegion:function(a){return this.regionManager.get(a)},getRegions:function(){return this.regionManager.getRegions()},_buildRegions:function(a){var b=this,c={regionClass:this.getOption("regionClass"),parentEl:function(){return b.$el}};return this.regionManager.addRegions(a,c)},_initializeRegions:function(a){var b;this._initRegionManager(),b=c.isFunction(this.regions)?this.regions(a):this.regions||{};var d=this.getOption.call(a,"regions");c.isFunction(d)&&(d=d.call(this,a)),c.extend(b,d),b=this.normalizeUIValues(b),this.addRegions(b)},_reInitializeRegions:function(){this.regionManager.emptyRegions(),this.regionManager.each(function(a){a.reset()})},getRegionManager:function(){return new e.RegionManager},_initRegionManager:function(){this.regionManager=this.getRegionManager(),this.listenTo(this.regionManager,"before:add:region",function(a){this.triggerMethod("before:add:region",a)}),this.listenTo(this.regionManager,"add:region",function(a,b){this[a]=b,this.triggerMethod("add:region",a,b)}),this.listenTo(this.regionManager,"before:remove:region",function(a){this.triggerMethod("before:remove:region",a)}),this.listenTo(this.regionManager,"remove:region",function(a,b){delete this[a],this.triggerMethod("remove:region",a,b)})}}),e.Behavior=function(a,b){function c(b,c){this.view=c,this.defaults=a.result(this,"defaults")||{},this.options=a.extend({},this.defaults,b),this.$=function(){return this.view.$.apply(this.view,arguments)},this.initialize.apply(this,arguments)}return a.extend(c.prototype,b.Events,{initialize:function(){},destroy:function(){this.stopListening()},proxyViewProperties:function(a){this.$el=a.$el,this.el=a.el},triggerMethod:e.triggerMethod,getOption:e.proxyGetOption,bindEntityEvents:e.proxyBindEntityEvents,unbindEntityEvents:e.proxyUnbindEntityEvents}),c.extend=e.extend,c}(c,b),e.Behaviors=function(a,b){function c(a,d){return b.isObject(a.behaviors)?(d=c.parseBehaviors(a,d||b.result(a,"behaviors")),c.wrap(a,d,b.keys(e)),d):{}}function d(a,c){this._view=a,this._viewUI=b.result(a,"ui"),this._behaviors=c,this._triggers={}}var e={behaviorTriggers:function(a,b){var c=new d(this,b);return c.buildBehaviorTriggers()},behaviorEvents:function(c,d){var e={},f=b.result(this,"ui");return b.each(d,function(c,d){var g={},h=b.clone(b.result(c,"events"))||{},i=b.result(c,"ui"),j=b.extend({},f,i);h=a.normalizeUIKeys(h,j),b.each(b.keys(h),function(a){var e=new Array(d+2).join(" "),f=a+e,i=b.isFunction(h[a])?h[a]:c[h[a]];g[f]=b.bind(i,c)}),e=b.extend(e,g)}),e}};
return b.extend(c,{behaviorsLookup:function(){throw new a.Error({message:"You must define where your behaviors are stored.",url:"marionette.behaviors.html#behaviorslookup"})},getBehaviorClass:function(a,d){return a.behaviorClass?a.behaviorClass:b.isFunction(c.behaviorsLookup)?c.behaviorsLookup.apply(this,arguments)[d]:c.behaviorsLookup[d]},parseBehaviors:function(a,d){return b.chain(d).map(function(d,e){var f=c.getBehaviorClass(d,e),g=new f(d,a),h=c.parseBehaviors(a,b.result(g,"behaviors"));return[g].concat(h)}).flatten().value()},wrap:function(a,c,d){b.each(d,function(d){a[d]=b.partial(e[d],a[d],c)})}}),b.extend(d.prototype,{buildBehaviorTriggers:function(){return b.each(this._behaviors,this._buildTriggerHandlersForBehavior,this),this._triggers},_buildTriggerHandlersForBehavior:function(c,d){var e=b.extend({},this._viewUI,b.result(c,"ui")),f=b.clone(b.result(c,"triggers"))||{};f=a.normalizeUIKeys(f,e),b.each(f,b.partial(this._setHandlerForBehavior,c,d),this)},_setHandlerForBehavior:function(a,b,c,d){var e=d.replace(/^\S+/,function(a){return a+".behaviortriggers"+b});this._triggers[e]=this._view._buildViewTrigger(c)}}),c}(e,c),e.AppRouter=b.Router.extend({constructor:function(a){b.Router.apply(this,arguments),this.options=a||{};var c=this.getOption("appRoutes"),d=this._getController();this.processAppRoutes(d,c),this.on("route",this._processOnRoute,this)},appRoute:function(a,b){var c=this._getController();this._addAppRoute(c,a,b)},_processOnRoute:function(a,b){var d=c.invert(this.getOption("appRoutes"))[a];c.isFunction(this.onRoute)&&this.onRoute(a,d,b)},processAppRoutes:function(a,b){if(b){var d=c.keys(b).reverse();c.each(d,function(c){this._addAppRoute(a,c,b[c])},this)}},_getController:function(){return this.getOption("controller")},_addAppRoute:function(a,b,d){var f=a[d];if(!f)throw new e.Error('Method "'+d+'" was not found on the controller');this.route(b,d,c.bind(f,a))},getOption:e.proxyGetOption}),e.Application=function(a){this.options=a,this._initializeRegions(a),this._initCallbacks=new e.Callbacks,this.submodules={},c.extend(this,a),this._initChannel(),this.initialize.apply(this,arguments)},c.extend(e.Application.prototype,b.Events,{initialize:function(){},execute:function(){this.commands.execute.apply(this.commands,arguments)},request:function(){return this.reqres.request.apply(this.reqres,arguments)},addInitializer:function(a){this._initCallbacks.add(a)},start:function(a){this.triggerMethod("before:start",a),this._initCallbacks.run(a,this),this.triggerMethod("start",a)},addRegions:function(a){return this._regionManager.addRegions(a)},emptyRegions:function(){return this._regionManager.emptyRegions()},removeRegion:function(a){return this._regionManager.removeRegion(a)},getRegion:function(a){return this._regionManager.get(a)},getRegions:function(){return this._regionManager.getRegions()},module:function(a,b){var c=e.Module.getClass(b),d=f.call(arguments);return d.unshift(this),c.create.apply(c,d)},getRegionManager:function(){return new e.RegionManager},_initializeRegions:function(a){var b=c.isFunction(this.regions)?this.regions(a):this.regions||{};this._initRegionManager();var d=e.getOption(a,"regions");return c.isFunction(d)&&(d=d.call(this,a)),c.extend(b,d),this.addRegions(b),this},_initRegionManager:function(){this._regionManager=this.getRegionManager(),this.listenTo(this._regionManager,"before:add:region",function(a){this.triggerMethod("before:add:region",a)}),this.listenTo(this._regionManager,"add:region",function(a,b){this[a]=b,this.triggerMethod("add:region",a,b)}),this.listenTo(this._regionManager,"before:remove:region",function(a){this.triggerMethod("before:remove:region",a)}),this.listenTo(this._regionManager,"remove:region",function(a,b){delete this[a],this.triggerMethod("remove:region",a,b)})},_initChannel:function(){this.channelName=c.result(this,"channelName")||"global",this.channel=c.result(this,"channel")||b.Wreqr.radio.channel(this.channelName),this.vent=c.result(this,"vent")||this.channel.vent,this.commands=c.result(this,"commands")||this.channel.commands,this.reqres=c.result(this,"reqres")||this.channel.reqres},triggerMethod:e.triggerMethod,getOption:e.proxyGetOption}),e.Application.extend=e.extend,e.Module=function(a,b,d){this.moduleName=a,this.options=c.extend({},this.options,d),this.initialize=d.initialize||this.initialize,this.submodules={},this._setupInitializersAndFinalizers(),this.app=b,c.isFunction(this.initialize)&&this.initialize(a,b,this.options)},e.Module.extend=e.extend,c.extend(e.Module.prototype,b.Events,{startWithParent:!0,initialize:function(){},addInitializer:function(a){this._initializerCallbacks.add(a)},addFinalizer:function(a){this._finalizerCallbacks.add(a)},start:function(a){this._isInitialized||(c.each(this.submodules,function(b){b.startWithParent&&b.start(a)}),this.triggerMethod("before:start",a),this._initializerCallbacks.run(a,this),this._isInitialized=!0,this.triggerMethod("start",a))},stop:function(){this._isInitialized&&(this._isInitialized=!1,this.triggerMethod("before:stop"),c.each(this.submodules,function(a){a.stop()}),this._finalizerCallbacks.run(void 0,this),this._initializerCallbacks.reset(),this._finalizerCallbacks.reset(),this.triggerMethod("stop"))},addDefinition:function(a,b){this._runModuleDefinition(a,b)},_runModuleDefinition:function(a,d){if(a){var f=c.flatten([this,this.app,b,e,b.$,c,d]);a.apply(this,f)}},_setupInitializersAndFinalizers:function(){this._initializerCallbacks=new e.Callbacks,this._finalizerCallbacks=new e.Callbacks},triggerMethod:e.triggerMethod}),c.extend(e.Module,{create:function(a,b,d){var e=a,g=f.call(arguments);g.splice(0,3),b=b.split(".");var h=b.length,i=[];return i[h-1]=d,c.each(b,function(b,c){var f=e;e=this._getModule(f,b,a,d),this._addModuleDefinition(f,e,i[c],g)},this),e},_getModule:function(a,b,d,e){var f=c.extend({},e),g=this.getClass(e),h=a[b];return h||(h=new g(b,d,f),a[b]=h,a.submodules[b]=h),h},getClass:function(a){var b=e.Module;return a?a.prototype instanceof b?a:a.moduleClass||b:b},_addModuleDefinition:function(a,b,c,d){var e=this._getDefine(c),f=this._getStartWithParent(c,b);e&&b.addDefinition(e,d),this._addStartWithParent(a,b,f)},_getStartWithParent:function(a,b){var d;return c.isFunction(a)&&a.prototype instanceof e.Module?(d=b.constructor.prototype.startWithParent,c.isUndefined(d)?!0:d):c.isObject(a)?(d=a.startWithParent,c.isUndefined(d)?!0:d):!0},_getDefine:function(a){return!c.isFunction(a)||a.prototype instanceof e.Module?c.isObject(a)?a.define:null:a},_addStartWithParent:function(a,b,c){b.startWithParent=b.startWithParent&&c,b.startWithParent&&!b.startWithParentIsConfigured&&(b.startWithParentIsConfigured=!0,a.addInitializer(function(a){b.startWithParent&&b.start(a)}))}}),e});
//# sourceMappingURL=backbone.marionette.map
/*
  backbone.paginator 2.0.0
  http://github.com/backbone-paginator/backbone.paginator

  Copyright (c) 2013 Jimmy Yuen Ho Wong and contributors
  Licensed under the MIT @license.
*/
!function(a){if("object"==typeof exports)module.exports=a(require("underscore"),require("backbone"));else if("function"==typeof define&&define.amd)define(["underscore","backbone"],a);else if("undefined"!=typeof _&&"undefined"!=typeof Backbone){var b=Backbone.PageableCollection,c=a(_,Backbone);Backbone.PageableCollection.noConflict=function(){return Backbone.PageableCollection=b,c}}}(function(a,b){"use strict";function c(b,c){if(!a.isNumber(b)||a.isNaN(b)||!a.isFinite(b)||~~b!==b)throw new TypeError("`"+c+"` must be a finite integer");return b}function d(a){for(var b,c,d,e,f={},g=decodeURIComponent,h=a.split("&"),i=0,j=h.length;j>i;i++){var k=h[i];b=k.split("="),c=b[0],d=b[1]||!0,c=g(c),d=g(d),e=f[c],o(e)?e.push(d):f[c]=e?[e,d]:d}return f}function e(a,b,c){var d=a._events[b];if(d&&d.length){var e=d[d.length-1],f=e.callback;e.callback=function(){try{f.apply(this,arguments),c()}catch(a){throw a}finally{e.callback=f}}}else c()}var f=a.extend,g=a.omit,h=a.clone,i=a.each,j=a.pick,k=a.contains,l=a.isEmpty,m=a.pairs,n=a.invert,o=a.isArray,p=a.isFunction,q=a.isObject,r=a.keys,s=a.isUndefined,t=Math.ceil,u=Math.floor,v=Math.max,w=b.Collection.prototype,x=/[\s'"]/g,y=/[<>\s'"]/g,z=b.PageableCollection=b.Collection.extend({state:{firstPage:1,lastPage:null,currentPage:null,pageSize:25,totalPages:null,totalRecords:null,sortKey:null,order:-1},mode:"server",queryParams:{currentPage:"page",pageSize:"per_page",totalPages:"total_pages",totalRecords:"total_entries",sortKey:"sort_by",order:"order",directions:{"-1":"asc",1:"desc"}},constructor:function(a,b){w.constructor.apply(this,arguments),b=b||{};var c=this.mode=b.mode||this.mode||A.mode,d=f({},A.queryParams,this.queryParams,b.queryParams||{});d.directions=f({},A.queryParams.directions,this.queryParams.directions,d.directions||{}),this.queryParams=d;var e=this.state=f({},A.state,this.state,b.state||{});e.currentPage=null==e.currentPage?e.firstPage:e.currentPage,o(a)||(a=a?[a]:[]),a=a.slice(),"server"==c||null!=e.totalRecords||l(a)||(e.totalRecords=a.length),this.switchMode(c,f({fetch:!1,resetState:!1,models:a},b));var g=b.comparator;if(e.sortKey&&!g&&this.setSorting(e.sortKey,e.order,b),"server"!=c){var i=this.fullCollection;g&&b.full&&(this.comparator=null,i.comparator=g),b.full&&i.sort(),a&&!l(a)&&(this.reset(a,f({silent:!0},b)),this.getPage(e.currentPage),a.splice.apply(a,[0,a.length].concat(this.models)))}this._initState=h(this.state)},_makeFullCollection:function(a,c){var d,e,f,g=["url","model","sync","comparator"],h=this.constructor.prototype,i={};for(d=0,e=g.length;e>d;d++)f=g[d],s(h[f])||(i[f]=h[f]);var j=new(b.Collection.extend(i))(a,c);for(d=0,e=g.length;e>d;d++)f=g[d],this[f]!==h[f]&&(j[f]=this[f]);return j},_makeCollectionEventHandler:function(a,b){return function(c,d,g,j){var k=a._handlers;i(r(k),function(c){var d=k[c];a.off(c,d),b.off(c,d)});var l=h(a.state),m=l.firstPage,n=0===m?l.currentPage:l.currentPage-1,o=l.pageSize,p=n*o,q=p+o;if("add"==c){var u,v,w,x,j=j||{};if(g==b)v=b.indexOf(d),v>=p&&q>v&&(x=a,u=w=v-p);else{u=a.indexOf(d),v=p+u,x=b;var w=s(j.at)?v:j.at+p}if(j.onRemove||(++l.totalRecords,delete j.onRemove),a.state=a._checkState(l),x){x.add(d,f({},j||{},{at:w}));var y=u>=o?d:!s(j.at)&&q>w&&a.length>o?a.at(o):null;y&&e(g,c,function(){a.remove(y,{onAdd:!0})})}}if("remove"==c)if(j.onAdd)delete j.onAdd;else{if(--l.totalRecords){var z=l.totalPages=t(l.totalRecords/o);l.lastPage=0===m?z-1:z||m,l.currentPage>z&&(l.currentPage=l.lastPage)}else l.totalRecords=null,l.totalPages=null;a.state=a._checkState(l);var A,B=j.index;g==a?((A=b.at(q))?e(a,c,function(){a.push(A,{onRemove:!0})}):!a.length&&l.totalRecords&&a.reset(b.models.slice(p-o,q-o),f({},j,{parse:!1})),b.remove(d)):B>=p&&q>B&&((A=b.at(q-1))&&e(a,c,function(){a.push(A,{onRemove:!0})}),a.remove(d),!a.length&&l.totalRecords&&a.reset(b.models.slice(p-o,q-o),f({},j,{parse:!1})))}if("reset"==c)if(j=g,g=d,g==a&&null==j.from&&null==j.to){var C=b.models.slice(0,p),D=b.models.slice(p+a.models.length);b.reset(C.concat(a.models).concat(D),j)}else g==b&&((l.totalRecords=b.models.length)||(l.totalRecords=null,l.totalPages=null),"client"==a.mode&&(l.lastPage=l.currentPage=l.firstPage),a.state=a._checkState(l),a.reset(b.models.slice(p,q),f({},j,{parse:!1})));"sort"==c&&(j=g,g=d,g===b&&a.reset(b.models.slice(p,q),f({},j,{parse:!1}))),i(r(k),function(c){var d=k[c];i([a,b],function(a){a.on(c,d);var b=a._events[c]||[];b.unshift(b.pop())})})}},_checkState:function(a){var b=this.mode,d=this.links,e=a.totalRecords,f=a.pageSize,g=a.currentPage,h=a.firstPage,i=a.totalPages;if(null!=e&&null!=f&&null!=g&&null!=h&&("infinite"==b?d:!0)){if(e=c(e,"totalRecords"),f=c(f,"pageSize"),g=c(g,"currentPage"),h=c(h,"firstPage"),1>f)throw new RangeError("`pageSize` must be >= 1");if(i=a.totalPages=t(e/f),0>h||h>1)throw new RangeError("`firstPage must be 0 or 1`");if(a.lastPage=0===h?v(0,i-1):i||h,"infinite"==b){if(!d[g+""])throw new RangeError("No link found for page "+g)}else if(h>g||i>0&&(h?g>i:g>=i))throw new RangeError("`currentPage` must be firstPage <= currentPage "+(h?">":">=")+" totalPages if "+h+"-based. Got "+g+".")}return a},setPageSize:function(a,b){a=c(a,"pageSize"),b=b||{first:!1};var d=this.state,e=t(d.totalRecords/a),h=e?v(d.firstPage,u(e*d.currentPage/d.totalPages)):d.firstPage;return d=this.state=this._checkState(f({},d,{pageSize:a,currentPage:b.first?d.firstPage:h,totalPages:e})),this.getPage(d.currentPage,g(b,["first"]))},switchMode:function(b,c){if(!k(["server","client","infinite"],b))throw new TypeError('`mode` must be one of "server", "client" or "infinite"');c=c||{fetch:!0,resetState:!0};var d=this.state=c.resetState?h(this._initState):this._checkState(f({},this.state));this.mode=b;var e,j=this,l=this.fullCollection,m=this._handlers=this._handlers||{};if("server"==b||l)"server"==b&&l&&(i(r(m),function(a){e=m[a],j.off(a,e),l.off(a,e)}),delete this._handlers,this._fullComparator=l.comparator,delete this.fullCollection);else{l=this._makeFullCollection(c.models||[],c),l.pageableCollection=this,this.fullCollection=l;var n=this._makeCollectionEventHandler(this,l);i(["add","remove","reset","sort"],function(b){m[b]=e=a.bind(n,{},b),j.on(b,e),l.on(b,e)}),l.comparator=this._fullComparator}if("infinite"==b)for(var o=this.links={},p=d.firstPage,q=t(d.totalRecords/d.pageSize),s=0===p?v(0,q-1):q||p,u=d.firstPage;s>=u;u++)o[u]=this.url;else this.links&&delete this.links;return c.fetch?this.fetch(g(c,"fetch","resetState")):this},hasPreviousPage:function(){var a=this.state,b=a.currentPage;return"infinite"!=this.mode?b>a.firstPage:!!this.links[b-1]},hasNextPage:function(){var a=this.state,b=this.state.currentPage;return"infinite"!=this.mode?b<a.lastPage:!!this.links[b+1]},getFirstPage:function(a){return this.getPage("first",a)},getPreviousPage:function(a){return this.getPage("prev",a)},getNextPage:function(a){return this.getPage("next",a)},getLastPage:function(a){return this.getPage("last",a)},getPage:function(a,b){var d=this.mode,e=this.fullCollection;b=b||{fetch:!1};var h=this.state,i=h.firstPage,j=h.currentPage,k=h.lastPage,m=h.pageSize,n=a;switch(a){case"first":n=i;break;case"prev":n=j-1;break;case"next":n=j+1;break;case"last":n=k;break;default:n=c(a,"index")}this.state=this._checkState(f({},h,{currentPage:n})),b.from=j,b.to=n;var o=(0===i?n:n-1)*m,p=e&&e.length?e.models.slice(o,o+m):[];return"client"!=d&&("infinite"!=d||l(p))||b.fetch?("infinite"==d&&(b.url=this.links[n]),this.fetch(g(b,"fetch"))):(this.reset(p,g(b,"fetch")),this)},getPageByOffset:function(a,b){if(0>a)throw new RangeError("`offset must be > 0`");a=c(a);var d=u(a/this.state.pageSize);return 0!==this.state.firstPage&&d++,d>this.state.lastPage&&(d=this.state.lastPage),this.getPage(d,b)},sync:function(a,c,d){var e=this;if("infinite"==e.mode){var g=d.success,h=e.state.currentPage;d.success=function(a,b,c){var i=e.links,j=e.parseLinks(a,f({xhr:c},d));j.first&&(i[e.state.firstPage]=j.first),j.prev&&(i[h-1]=j.prev),j.next&&(i[h+1]=j.next),g&&g(a,b,c)}}return(w.sync||b.sync).call(e,a,c,d)},parseLinks:function(a,b){var c={},d=b.xhr.getResponseHeader("Link");if(d){var e=["first","prev","next"];i(d.split(","),function(a){var b=a.split(";"),d=b[0].replace(y,""),f=b.slice(1);i(f,function(a){var b=a.split("="),f=b[0].replace(x,""),g=b[1].replace(x,"");"rel"==f&&k(e,g)&&(c[g]=d)})})}return c},parse:function(a,b){var c=this.parseState(a,h(this.queryParams),h(this.state),b);return c&&(this.state=this._checkState(f({},this.state,c))),this.parseRecords(a,b)},parseState:function(b,c,d){if(b&&2===b.length&&q(b[0])&&o(b[1])){var e=h(d),f=b[0];return i(m(g(c,"directions")),function(b){var c=b[0],d=b[1],g=f[d];s(g)||a.isNull(g)||(e[c]=f[d])}),f.order&&(e.order=1*n(c.directions)[f.order]),e}},parseRecords:function(a){return a&&2===a.length&&q(a[0])&&o(a[1])?a[1]:a},fetch:function(a){a=a||{};var b=this._checkState(this.state),c=this.mode;"infinite"!=c||a.url||(a.url=this.links[b.currentPage]);var e=a.data||{},i=a.url||this.url||"";p(i)&&(i=i.call(this));var k=i.indexOf("?");-1!=k&&(f(e,d(i.slice(k+1))),i=i.slice(0,k)),a.url=i,a.data=e;var l,n,o,q,t="client"==this.mode?j(this.queryParams,"sortKey","order"):g(j(this.queryParams,r(A.queryParams)),"directions"),u=m(t),v=h(this);for(l=0;l<u.length;l++)n=u[l],o=n[0],q=n[1],q=p(q)?q.call(v):q,null!=b[o]&&null!=q&&(e[q]=b[o]);if(b.sortKey&&b.order){var x=p(t.order)?t.order.call(v):t.order;e[x]=this.queryParams.directions[b.order+""]}else b.sortKey||delete e[t.order];var y=m(g(this.queryParams,r(A.queryParams)));for(l=0;l<y.length;l++)n=y[l],q=n[1],q=p(q)?q.call(v):q,null!=q&&(e[n[0]]=q);if("server"!=c){var z=this,B=this.fullCollection,C=a.success;return a.success=function(b,d,e){e=e||{},s(a.silent)?delete e.silent:e.silent=a.silent;var g=b.models;"client"==c?B.reset(g,e):(B.add(g,f({at:B.length},f(e,{parse:!1}))),z.trigger("reset",z,e)),C&&C(b,d,e)},w.fetch.call(this,f({},a,{silent:!0}))}return w.fetch.call(this,a)},_makeComparator:function(a,b,c){var d=this.state;return a=a||d.sortKey,b=b||d.order,a&&b?(c||(c=function(a,b){return a.get(b)}),function(d,e){var f,g=c(d,a),h=c(e,a);return 1===b&&(f=g,g=h,h=f),g===h?0:h>g?-1:1}):void 0},setSorting:function(a,b,c){var d=this.state;d.sortKey=a,d.order=b=b||d.order;var e=this.fullCollection,g=!1,h=!1;a||(g=h=!0);var i=this.mode;c=f({side:"client"==i?i:"server",full:!0},c);var j=this._makeComparator(a,b,c.sortValue),k=c.full,l=c.side;return"client"==l?k?(e&&(e.comparator=j),g=!0):(this.comparator=j,h=!0):"server"!=l||k||(this.comparator=j),g&&(this.comparator=null),h&&e&&(e.comparator=null),this}}),A=z.prototype;return z});
// Backbone.Select, v1.2.8
// Copyright (c) 2014 Michael Heim
//           (c) 2013 Derick Bailey, Muted Solutions, LLC.
// Distributed under MIT license
// http://github.com/hashchange/backbone.select


!function(Backbone,_){"use strict";function a(a,b){f(a,b),a.selected&&b.select(a,{_silentReselect:!0,_externalEvent:"add"})}function b(a,b,d){c(a,b,_.extend({},d,{_externalEvent:"remove"}))}function c(a,b,c){a._pickyCollections&&(a._pickyCollections=_.without(a._pickyCollections,b._pickyCid)),a.selected&&(a._pickyCollections&&0===a._pickyCollections.length?b.deselect(a,c):b.deselect(a,_.extend({},c,{_skipModelCall:!0})))}function d(a,b){var d,e,g=_.find(b.previousModels,function(a){return a.selected});g&&c(g,a,{_silentLocally:!0}),_.each(b.previousModels,function(b){b._pickyCollections&&(b._pickyCollections=_.without(b._pickyCollections,a._pickyCid))}),a.each(function(b){f(b,a)}),d=a.filter(function(a){return a.selected}),e=_.initial(d),e.length&&_.each(e,function(a){a.deselect()}),d.length&&a.select(_.last(d),{silent:!0})}function e(a,b){var d,e=_.filter(b.previousModels,function(a){return a.selected});e&&_.each(e,function(b){c(b,a,{_silentLocally:!0})}),_.each(b.previousModels,function(b){b._pickyCollections&&(b._pickyCollections=_.without(b._pickyCollections,a._pickyCid))}),a.each(function(b){f(b,a)}),d=a.filter(function(a){return a.selected}),d.length&&_.each(d,function(b){a.select(b,{silent:!0})})}function f(a,b){a._pickyCollections||(a._pickyCollections=[]),a._pickyCollections.push(b._pickyCid)}function g(a){a.each(function(b){c(b,a,{_silentLocally:!0})})}function h(a){return _.omit(a,"_silentLocally","_externalEvent")}function i(a){return _.omit(a,"_silentLocally","_silentReselect","_skipModelCall","_processedBy","_eventQueue","_eventQueueAppendOnly")}function j(a){function b(a,b){c[b]=a}var c=[];return _.each(a,b),c}function k(a){return a||(a={}),a._processedBy||(a._processedBy={}),a._eventQueue||(a._eventQueue=[]),a}function l(a,b,c){var d=a._eventQueueAppendOnly||a._eventQueue;d.push({actor:b,triggerArgs:c})}function m(a){var b,c;if(a._eventQueue.length&&(b=_.every(a._processedBy,function(a){return a.done})))for(n(a._eventQueue);a._eventQueue.length;)c=a._eventQueue.pop(),c.actor.trigger.apply(c.actor,c.triggerArgs)}function n(a){var b={};_.each(a,function(a,c){var d,e,f,g=a.actor,h=a.triggerArgs[0];"Backbone.Select.Many"===g._pickyType&&"reselect:any"!==h&&(d=b[g._pickyCid],d||(d=b[g._pickyCid]={actor:g,indexes:[],merged:{selected:[],deselected:[],options:{}}}),d.indexes.push(c),e=a.triggerArgs[1],f=a.triggerArgs[3],d.merged.selected=d.merged.selected.concat(e.selected),d.merged.deselected=d.merged.deselected.concat(e.deselected),_.extend(d.merged.options,f))}),b=_.filter(b,function(a){return a.indexes.length>1});var c=_.flatten(_.pluck(b,"indexes"));c.sort(function(a,b){return a-b}),_.each(c,function(b,c){a.splice(b-c,1)}),_.each(b,function(b){a.push({actor:b.actor,triggerArgs:["select:some",{selected:b.merged.selected,deselected:b.merged.deselected},b.actor,b.merged.options]})})}function o(a,b){b.select=function(){var c=b.select;return function(d){return d instanceof Backbone.Model?c.apply(b,arguments):a.apply(b,arguments)}}()}function p(a){a.trigger=function(){var b=a.trigger;return function(a){if(q(a)){var c=s(a),d="on"+c.replace(/(^|:)(\w)/gi,r),e=this[d];_.isFunction(e)&&e.apply(this,_.tail(arguments))}return b.apply(this,arguments),this}}()}function q(a){return/^([rd]e)?select(ed)?($|:)/.test(a)}function r(a,b,c){return c.toUpperCase()}function s(a){return"ed"===a.slice(-2)?a=a.slice(0,-2):(":one"===a.slice(-4)||":any"===a.slice(-4))&&(a=a.slice(0,-4)),a}var t={};t.One=function(){},_.extend(t.One.prototype,{_pickyType:"Backbone.Select.One",select:function(a,b){var c=a&&this.selected===a?a:void 0;b=k(b),b._processedBy[this._pickyCid]||(c||(this.deselect(void 0,_.extend(_.omit(b,"_silentLocally","_processedBy","_eventQueue"),{_eventQueueAppendOnly:b._eventQueue})),this.selected=a),b._processedBy[this._pickyCid]={done:!1},b._processedBy[this.selected.cid]||this.selected.select(h(b)),b.silent||b._silentLocally||(c?b._silentReselect||l(b,this,["reselect:one",a,this,i(b)]):l(b,this,["select:one",a,this,i(b)])),b._processedBy[this._pickyCid].done=!0,m(b))},deselect:function(a,b){b=k(b),b._processedBy[this._pickyCid]||this.selected&&(a=a||this.selected,this.selected===a&&(b._processedBy[this._pickyCid]={done:!1},delete this.selected,b._skipModelCall||a.deselect(h(b)),b.silent||b._silentLocally||l(b,this,["deselect:one",a,this,i(b)]),b._processedBy[this._pickyCid].done=!0,m(b)))},close:function(){g(this),this.stopListening()}}),t.Many=function(){},_.extend(t.Many.prototype,{_pickyType:"Backbone.Select.Many",select:function(a,b){var c=j(this.selected),d=this.selected[a.cid]?[a]:[];b=k(b),d.length&&b._processedBy[this._pickyCid]||(d.length||(this.selected[a.cid]=a,this.selectedLength=_.size(this.selected)),b._processedBy[this._pickyCid]={done:!1},b._processedBy[a.cid]||a.select(h(b)),u(this,c,b,d),b._processedBy[this._pickyCid].done=!0,m(b))},deselect:function(a,b){var c=j(this.selected);b=k(b),b._processedBy[this._pickyCid]||this.selected[a.cid]&&(b._processedBy[this._pickyCid]={done:!1},delete this.selected[a.cid],this.selectedLength=_.size(this.selected),b._skipModelCall||a.deselect(h(b)),u(this,c,b),b._processedBy[this._pickyCid].done=!0,m(b))},selectAll:function(a){var b=j(this.selected),c=[];a||(a={}),this.selectedLength=0,this.each(function(b){this.selectedLength++,this.selected[b.cid]&&c.push(b),this.select(b,_.extend({},a,{_silentLocally:!0}))},this),a=k(a),u(this,b,a,c),a._processedBy[this._pickyCid]?a._processedBy[this._pickyCid].done=!0:a._processedBy[this._pickyCid]={done:!0},m(a)},deselectAll:function(a){var b;0!==this.selectedLength&&(b=j(this.selected),a||(a={}),this.each(function(b){b.selected&&this.selectedLength--,this.deselect(b,_.extend({},a,{_silentLocally:!0}))},this),this.selectedLength=0,a=k(a),u(this,b,a),a._processedBy[this._pickyCid]?a._processedBy[this._pickyCid].done=!0:a._processedBy[this._pickyCid]={done:!0},m(a))},selectNone:function(a){this.deselectAll(a)},toggleSelectAll:function(a){this.selectedLength===this.length?this.deselectAll(a):this.selectAll(a)},close:function(){g(this),this.stopListening()}}),t.Me=function(){},_.extend(t.Me.prototype,{_pickyType:"Backbone.Select.Me",select:function(a){var b=this.selected;a=k(a),a._processedBy[this.cid]||(a._processedBy[this.cid]={done:!1},this.selected=!0,this._pickyCollections?this.trigger("_selected",this,h(a)):this.collection&&(a._processedBy[this.collection._pickyCid]||this.collection.select(this,h(a))),a.silent||a._silentLocally||(b?a._silentReselect||l(a,this,["reselected",this,i(a)]):l(a,this,["selected",this,i(a)])),a._processedBy[this.cid].done=!0,m(a))},deselect:function(a){a=k(a),a._processedBy[this.cid]||this.selected&&(a._processedBy[this.cid]={done:!1},this.selected=!1,this._pickyCollections?this.trigger("_deselected",this,h(a)):this.collection&&this.collection.deselect(this,h(a)),a.silent||a._silentLocally||l(a,this,["deselected",this,i(a)]),a._processedBy[this.cid].done=!0,m(a))},toggleSelected:function(a){this.selected?this.deselect(a):this.select(a)}}),t.Me.applyTo=function(a){if(!_.isObject(a))throw new Error("The host object is undefined or not an object.");_.extend(a,new Backbone.Select.Me),p(a)},t.One.applyTo=function(c,e,g){var h;if(!_.isObject(c))throw new Error("The host object is undefined or not an object.");if(arguments.length<2)throw new Error("The `models` parameter has not been passed to Select.One.applyTo. Its value can be undefined if no models are passed in during instantiation, but even so, it must be provided.");if(!(_.isArray(e)||_.isUndefined(e)||_.isNull(e)))throw new Error("The `models` parameter is not of the correct type. It must be either an array of models, or be undefined. (Null is acceptable, too).");h=c.select,_.extend(c,new Backbone.Select.One),c._pickyCid=_.uniqueId("singleSelect"),p(c),o(h,c),g&&g.enableModelSharing&&(_.each(e||[],function(a){f(a,c),a.selected&&(c.selected&&c.selected.deselect(),c.selected=a)}),c.listenTo(c,"_selected",c.select),c.listenTo(c,"_deselected",c.deselect),c.listenTo(c,"reset",d),c.listenTo(c,"add",a),c.listenTo(c,"remove",b),c._modelSharingEnabled=!0)},t.Many.applyTo=function(c,d,g){var h;if(!_.isObject(c))throw new Error("The host object is undefined or not an object.");if(arguments.length<2)throw new Error("The `models` parameter has not been passed to Select.One.applyTo. Its value can be undefined if no models are passed in during instantiation, but even so, it must be provided.");if(!(_.isArray(d)||_.isUndefined(d)||_.isNull(d)))throw new Error("The `models` parameter is not of the correct type. It must be either an array of models, or be undefined. (Null is acceptable, too).");h=c.select,_.extend(c,new Backbone.Select.Many),c._pickyCid=_.uniqueId("multiSelect"),c.selected={},p(c),o(h,c),g&&g.enableModelSharing&&(_.each(d||[],function(a){f(a,c),a.selected&&(c.selected[a.cid]=a)}),c.listenTo(c,"_selected",c.select),c.listenTo(c,"_deselected",c.deselect),c.listenTo(c,"reset",e),c.listenTo(c,"add",a),c.listenTo(c,"remove",b),c._modelSharingEnabled=!0)};var u=function(a,b,c,d){function e(a,b,c){function d(a){return b.get(a)||c[a]}return _.map(a,d)}if(!c.silent&&!c._silentLocally){var f,g=a.selectedLength,h=a.length,j=_.keys(b),k=_.keys(a.selected),m=_.difference(k,j),n=_.difference(j,k),o=g===j.length&&0===m.length&&0===n.length;if(d&&d.length&&!c._silentReselect&&l(c,a,["reselect:any",d,a,i(c)]),!o)return f={selected:e(m,a,b),deselected:e(n,a,b)},g===h?void l(c,a,["select:all",f,a,i(c)]):0===g?void l(c,a,["select:none",f,a,i(c)]):g>0&&h>g?void l(c,a,["select:some",f,a,i(c)]):void 0}};Backbone.Select=t}(Backbone,_);
//# sourceMappingURL=backbone.select.min.map
/*! Backbone.Mutators - v0.4.4
------------------------------
Build @ 2014-12-02
Documentation and Full License Available at:
http://asciidisco.github.com/Backbone.Mutators/index.html
git://github.com/asciidisco/Backbone.Mutators.git
Copyright (c) 2014 Sebastian Golasch <public@asciidisco.com>

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the

Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.*/
!function(a,b,c){"use strict";"object"==typeof exports?module.exports=b(require("underscore"),require("backbone")):"function"==typeof define&&define.amd?define(["underscore","backbone"],function(d,e){return d=d===c?a._:d,e=e===c?a.Backbone:e,a.returnExportsGlobal=b(d,e,a)}):a.returnExportsGlobal=b(a._,a.Backbone)}(this,function(a,b,c,d){"use strict";b=b===d?c.Backbone:b,a=a===d?c._:a;var e=function(){},f=b.Model.prototype.get,g=b.Model.prototype.set,h=b.Model.prototype.toJSON;return e.prototype.mutators={},e.prototype.get=function(b){var c=this.mutators!==d;return c===!0&&a.isFunction(this.mutators[b])===!0?this.mutators[b].call(this):c===!0&&a.isObject(this.mutators[b])===!0&&a.isFunction(this.mutators[b].get)===!0?this.mutators[b].get.call(this):f.call(this,b)},e.prototype.set=function(b,c,e){var f=this.mutators!==d,h=null,i=null;return h=g.call(this,b,c,e),a.isObject(b)||null===b?(i=b,e=c):(i={},i[b]=c),f===!0&&a.isObject(this.mutators[b])===!0&&(a.isFunction(this.mutators[b].set)===!0?h=this.mutators[b].set.call(this,b,i[b],e,a.bind(g,this)):a.isFunction(this.mutators[b])&&(h=this.mutators[b].call(this,b,i[b],e,a.bind(g,this)))),f===!0&&a.isObject(i)&&a.each(i,a.bind(function(b,c){if(a.isObject(this.mutators[c])===!0){var f=this.mutators[c];a.isFunction(f.set)&&(f=f.set),a.isFunction(f)&&((e===d||a.isObject(e)===!0&&e.silent!==!0&&e.mutators!==d&&e.mutators.silent!==!0)&&this.trigger("mutators:set:"+c),f.call(this,c,b,e,a.bind(g,this)))}},this)),h},e.prototype.toJSON=function(b){var c,d,e=h.call(this);return a.each(this.mutators,a.bind(function(f,g){a.isObject(this.mutators[g])===!0&&a.isFunction(this.mutators[g].get)?(c=a.has(b||{},"emulateHTTP"),d=this.mutators[g].transient,c&&d||(e[g]=a.bind(this.mutators[g].get,this)())):a.isFunction(this.mutators[g])&&(e[g]=a.bind(this.mutators[g],this)())},this)),e},e.prototype.escape=function(b){var c=this.get(b);return a.escape(null==c?"":""+c)},a.extend(b.Model.prototype,e.prototype),b.Mutators=e,e});
'use strict';

Orangee.Application = Marionette.Application.extend({
  typeName: "Orangee.Application",
  initialize: function() {
    //orangee.debug("Orangee.Application#initialize");
    orangee.init();
    if (this.getOption('youtube')) {
      orangee._loadYoutubeApi();
    }
    if (this.getOption('dailymotion')) {
      orangee._loadDailymotionApi();
    }
  },
});

Orangee.Controller = Marionette.Controller.extend({
  typeName: "Orangee.Controller",
});

Orangee.Router = Backbone.Marionette.AppRouter.extend({
  typeName: "Orangee.Router",
});

Orangee.Model = Backbone.Model.extend({
  typeName: "Orangee.Model",
  initialize: function() {
    // Applies the mixin:
    Backbone.Select.Me.applyTo(this);
  },
  toJSON: function() {
    //http://stackoverflow.com/questions/15298449/cannot-get-the-cid-of-the-model-while-rendering-a-backbone-collection-over-a-tem
    var json = Backbone.Model.prototype.toJSON.apply(this, arguments);
    json.cid = this.cid;
    return json;
  },
});

Orangee.XMLModel = Orangee.Model.extend({
  typeName: "Orangee.XMLModel",
  fetch: function(options) {
    options = options || {};
    options.dataType = "html";
    return Backbone.Model.prototype.fetch.apply(this, arguments);
  },
  parse: function(xml) {
    return orangee.xml2json(xml);
  },
});

//http://jaketrent.com/post/backbone-inheritance/
Orangee.Collection = Backbone.PageableCollection.extend({
  typeName: "Orangee.Collection",
  model: Orangee.Model,
  initialize: function(models, options) {
    // Applies the mixin:
    Backbone.Select.One.applyTo(this, models, options);
    this.currentPosition = 0;
  },
  selectPrev: function(offset) {
    this.currentPosition -= (offset || 1);
    if (this.currentPosition < 0) {
      //this.currentPosition = 0;
      this.currentPosition += (offset || 1);
      return;
    }
    this.select(this.at(this.currentPosition));
  },
  selectNext: function(offset) {
    this.currentPosition += (offset || 1);
    if (this.currentPosition >= this.length) {
      //this.currentPosition = this.length - 1;
      this.currentPosition -= (offset || 1);
      return;
    }
    this.select(this.at(this.currentPosition));
  },
  selectModel: function(model) {
    this.currentPosition = this.indexOf(model);
    this.select(model);
  },
});

Orangee.XMLCollection = Orangee.Collection.extend({
  typeName: "Orangee.XMLCollection",
  fetch: function(options) {
    options = options || {};
    //options.dataType = "html";
    options.dataType = "text";
    return Backbone.Collection.prototype.fetch.apply(this, arguments);
  },
});

Orangee.OPMLCollection = Orangee.XMLCollection.extend({
  typeName: "Orangee.OPMLCollection",
  parse:function(xml) {
    //orangee.debug(xml);
    //var response = {data: json.opml.body.outline.map(function(x) {return {name: x._title, standardPic: x._img, url: x._url}})}
    var json = orangee.xml2json(xml);
    return json.opml.body.outline;
  },
});

Orangee.RSSItemModel = Orangee.Model.extend({
  typeName: "Orangee.RSSItemModel",
  mutators: {
    thumbnail_url: function() {
      if (this.get("thumbnail")) {
        return this.get("thumbnail")._url;
      } else if (this.collection) {
        return this.collection.thumbnail_url;
      } else {
        return null;
      }
    },
  },
});

Orangee.RSSCollection = Orangee.XMLCollection.extend({
  typeName: "Orangee.RSSCollection",
  model: Orangee.RSSItemModel,
  parse: function(xml) {
    var json = orangee.xml2json(xml);
    if (json.rss.channel.image) {
      var image = json.rss.channel.image;
      if (_.isArray(image)) {
        image = image[0];
      }
      this.thumbnail_url = image.url || image._href;
    }
    return _.filter(json.rss.channel.item, function(x) {return x.enclosure;});
  },
});

Orangee.CSVCollection = Orangee.XMLCollection.extend({
  typeName: "Orangee.CSVCollection",
  parse:function(csv) {
    var lines=csv.split("\n");
    var result = [];
    for(var i=1;i<lines.length;i++) {
      if (lines[i].length > 0 && lines[i][0] != '#' && lines[i][0] != " ") {
	      var currentline = [];
        if (lines[i].indexOf(',') >= 0) {
          currentline = lines[i].split(",");
        } else {
          currentline = lines[i].split(/[ ]+/);
        }
        var obj = {};
        if (currentline[0].toLowerCase().indexOf('http') == 0) {
          obj['_title'] = null;
          obj['_url'] = currentline[0] ? currentline[0].trim() : null;
          obj['_img'] = currentline[1] ? currentline[1].trim() : null;
        } else {
          obj['_title'] = currentline[0] ? currentline[0].trim() : null;
          obj['_url'] = currentline[1] ? currentline[1].trim() : null;
          obj['_img'] = currentline[2] ? currentline[2].trim() : null;
        }

        if (!obj['_url'] || obj['_url'].trim().length == 0) {
          continue;
        }

        if (!obj['_img']) {
          var ytid = orangee._findYoutubeId(obj['_url']);
          if (ytid) {
            obj['_img'] = "http://i.ytimg.com/vi/" + ytid + "/mqdefault.jpg";
          }
        }

        result.push(obj);
      }
    }
    return result;
  },
});



'use strict';

orangee.scroller = IScroll;
//orangee.sidemenu = Snap;
orangee.spinner = Spinner;

Marionette.Behaviors.behaviorsLookup = function() {
  return window;
}

var OrangeeHotKeysBehavior = Marionette.Behavior.extend({
  typeName: "OrangeeHotKeysBehavior",
  onRender: function() {
    if (this.view.keyEvents) {
      HotKeys.bind(this.view.keyEvents, this.view, this.view.cid);
    }
  },
  onDestroy: function() {
    if (this.view.keyEvents) {
      orangee.debug("OrangeeHotKeysBehavior#onDestroy");
      HotKeys.unbind(this.view.keyEvents, this.view, this.view.cid);
    }
  },
});

var OrangeeScrollerBehavior = Marionette.Behavior.extend({
  typeName: "OrangeeScrollerBehavior",
  onShow: function() {
    orangee.debug("OrangeeScrollerBehavior#onShow");
    orangee.debug(this.view.getOption('scroll'));
    //orangee.debug(this.el.parentNode.parentNode);
    //orangee.debug(this.el);
    this.view.scroller = new orangee.scroller(this.el, this.view.getOption('scroll'));
    //http://stackoverflow.com/questions/11924711/how-to-make-iscroll-and-lazy-load-jquery-plugins-work-together
    //http://www.cnblogs.com/MartinLi841538513/articles/3663638.html
    //http://blog.rodneyrehm.de/archives/32-Updating-to-iScroll-5.html
    this.view.scroller.on("scrollEnd", function() {
      this.$el.trigger('scroll');
    }.bind(this));
    this.view.collection.selectModel(this.view.collection.at(this.view.collection.currentPosition));
    //orangee.debug(this.view);
  },
  onDestroy: function() {
    orangee.debug("OrangeeScrollerBehavior#onDestroy");
    if (this.view.scroller) {
      this.view.scroller.destroy();
      this.view.scroller = null;
    }
  },
});

var OrangeeLazyloadBehavior = Marionette.Behavior.extend({
  typeName: "OrangeeLazyloadBehavior",
  onShow: function() {
    this.view.$("img.lazy").lazyload({
      effect : "fadeIn",
      threshold : 400,
    });
  },
});

var OrangeeNoExtraDivBehavior = Marionette.Behavior.extend({
  typeName: "OrangeeNoExtraDivBehavior",
  //http://stackoverflow.com/questions/14656068/turning-off-div-wrap-for-backbone-marionette-itemview
  onRender: function () {
    //orangee.debug("OrangeeNoExtraDivBehavior#onRender");
    // Get rid of that pesky wrapping-div.
    // Assumes 1 child element present in template.
    var children = this.$el.children();
    if (children.length == 0) {
      //template is string (no html tag). Can not remove div in this case.
      return;
    }

    this.$el = this.$el.children();
    // Unwrap the element to prevent infinitely 
    // nesting elements during re-render.
    this.$el.unwrap();
    this.view.setElement(this.$el);
  },
});

Orangee.ItemView = Marionette.ItemView.extend({
  typeName: "Orangee.ItemView",
  behaviors: {
    OrangeeHotKeysBehavior: {},
    OrangeeNoExtraDivBehavior: {},
  },
  initialize: function(options) {
    //orangee.debug("Orangee.ItemView#initialize");
    options = options || {};
    this.collectionView = options.collectionView;
  },
});

Orangee.CompositeView = Marionette.CompositeView.extend({
  typeName: "Orangee.CompositeView",
  behaviors: {
    OrangeeHotKeysBehavior: {},
    OrangeeNoExtraDivBehavior: {},
  },
  childViewOptions: function() {
    return {collectionView: this};
  },
});

Orangee.SpinnerView = Marionette.ItemView.extend({
  typeName: "Orangee.SpinnerView",
  template: false,
  opts: {
    lines: 13, // The number of lines to draw
    length: 20, // The length of each line
    width: 10, // The line thickness
    radius: 30, // The radius of the inner circle
    corners: 1, // Corner roundness (0..1)
    rotate: 0, // The rotation offset
    direction: 1, // 1: clockwise, -1: counterclockwise
    color: '#000', // #rgb or #rrggbb or array of colors
    speed: 1, // Rounds per second
    trail: 60, // Afterglow percentage
    shadow: false, // Whether to render a shadow
    hwaccel: false, // Whether to use hardware acceleration
    className: 'spinner', // The CSS class to assign to the spinner
    zIndex: 2e9, // The z-index (defaults to 2000000000)
    top: '50%', // Top position relative to parent
    left: '50%' // Left position relative to parent
  },
  onShow: function() {
    this.spinner = new orangee.spinner(this.getOption('opts')).spin(this.el);
  },
  onDestroy: function() {
    this.spinner.stop();
  },
});

Orangee.VideoView = Orangee.ItemView.extend({
  typeName: "Orangee.VideoView",
  onShow: function() {
    orangee.debug("Orangee.VideoView#onShow");
    //orangee.debug(this.getOption('player'));
    this.videoplayer = new orangee.videoplayer({
      youtube: this.getOption('youtube'),
      dailymotion: this.getOption('dailymotion'),
      translate_url: (typeof(OrangeeJSPlugin) != 'undefined') ? OrangeeJSPlugin : null,
    });
    var onplaying = this.getOption('onPlaying');
    var onpause = this.getOption('onPause');
    var onend = this.getOption('onEnd');
    var startSeconds = this.getOption('startSeconds');
    this.videoplayer.load(this.collection.toJSON(),
                          this.getOption('divid'),
                          _.extend({
                            onplaying: onplaying ? onplaying.bind(this) : onplaying,
                            onpause: onpause ? onpause.bind(this): onpause,
                            onend:  onend ? onend.bind(this) : onend,
                          }, this.getOption('playerVars')),
                          this.collection.currentPosition,
                          startSeconds);
  },
  keyEvents: {
    'right': 'onKeyRight',
    'fastforward': 'onKeyRight',
    'left' : 'onKeyLeft',
    'rewind': 'onKeyRight',
    'play' : 'onKeyPlay',
    'pause' : 'onKeyPause',
    'stop' : 'onKeyPause',
  },
  onKeyPlay: function() {
    orangee.debug('Orangee.VideoView#onKeyPlay');
    this.videoplayer.togglePlay();
  },
  onKeyPause: function() {
    orangee.debug('Orangee.VideoView#onKeyPause');
    this.videoplayer.pause();
  },
  onKeyRight: function() {
    orangee.debug('Orangee.VideoView#onKeyRight');
    this.videoplayer.seek(60);
  },
  onKeyLeft: function() {
    orangee.debug('Orangee.VideoView#onKeyLeft');
    this.videoplayer.seek(-60);
  },
});

Orangee.ScrollItemView = Orangee.ItemView.extend({
  typeName: "Orangee.ScrollItemView",
  events: {
    'click': 'onClick',
    'mouseover': 'onMouseOver',
  },
  modelEvents: {
    'selected': 'onSelect',
    'deselected': 'onDeselect',
    'clicked': 'onClick',
    'oge:keyentered': 'onKeyEnter',
  },
  onClick: function() {
    orangee.debug('Orangee.ScrollItemView#onClick');
  },
  onKeyEnter: function() {
    orangee.debug('Orangee.ScrollItemView#onKeyEnter');
    this.onClick();
    var links = this.$('a');
    if (links.length > 0) {
      var firstlink = this.$('a')[0];
      orangee.debug(firstlink);
      Backbone.history.navigate(firstlink.href.split('#')[1], {trigger: true});
    }
  },
  onMouseOver: function() {
    //orangee.debug('Orangee.ScrollItemView#onMouseOver');
    this.model.collection.selectModel(this.model);
  },
  onSelect: function(model) {
    //orangee.debug('Orangee.ScrollItemView#onSelect');
    //this.$(':first-child').addClass('active');
    this.$el.addClass('active');
  },
  onDeselect: function(model) {
    //orangee.debug('Orangee.ScrollItemView#onDeselect');
    //this.$(':first-child').removeClass('active');
    this.$el.removeClass('active');
  },
});

Orangee.ScrollView = Orangee.CompositeView.extend({
  typeName: "Orangee.ScrollView",
  behaviors: {
    OrangeeHotKeysBehavior: {},
    OrangeeNoExtraDivBehavior: {},
    OrangeeScrollerBehavior: {},
    OrangeeLazyloadBehavior: {},
  },
  childViewContainer: "ul",
  options: {
    scroll: {
      //click: true,
      mouseWheel: true,
      scrollbars: true,
      //keyBindings: true,
    },
  },
  numberOfColumns: 1,
  keyEvents: {
    'enter': 'onKeyEnter',
    'up': 'onKeyUp',
    'down' : 'onKeyDown',
    'left' : 'onKeyLeft',
    'right': 'onKeyRight',
  },
  onKeyEnter: function() {
    orangee.debug('Orangee.GridView#onKeyEnter');
    this.collection.selected.trigger('oge:keyentered');
  },
  onKeyLeft: function() {
    if (this.numberOfColumns > 1) {
      orangee.debug('Orangee.ScrollView#onKeyLeft');
      this.collection.selectPrev();
    }
  },
  onKeyRight: function() {
    if (this.numberOfColumns > 1) {
      orangee.debug('Orangee.ScrollView#onKeyRight');
      this.collection.selectNext();
    }
  },
  onKeyUp: function() {
    orangee.debug('Orangee.ScrollView#onKeyUp');
    orangee.debug(this.children);
    this.collection.selectPrev(this.numberOfColumns);
    var selectedChildView = this.children.findByIndex(this.collection.currentPosition);
    this.scroller.scrollToElement(selectedChildView.el);
  },
  onKeyDown: function() {
    orangee.debug('Orangee.ScrollView#onKeyDown');
    orangee.debug(this.children);
    this.collection.selectNext(this.numberOfColumns);
    var selectedChildView = this.children.findByIndex(this.collection.currentPosition);
    this.scroller.scrollToElement(selectedChildView.el);
  },
});

Orangee.HorizontalScrollView = Orangee.ScrollView.extend({
  typeName: "Orangee.HorizontalScrollView",
  options: {
    scroll: {
      mouseWheel: true,
      scrollX: true,
      scrollY: false,
    },
  },
});


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

orangee.hasNetwork = function() {
  if (navigator.connection) {
    //https://github.com/apache/cordova-plugin-network-information/blob/master/doc/index.md
    return navigator.connection.type != Connection.NONE
  } else {
    //do not know, just return true
    return true;
  }
};

orangee.disableScreenSaver = function() {
};

orangee.enableScreenSaver = function() {
};
