'use strict';
var app = new Orangee.Application({youtube: orangee.PLATFORM != 'samsung'});

var LinkCode = Orangee.XMLModel.extend({
  url: "http://www.orangee.tv/getLinkingCode",
  parse: function(xml) {
    var json = orangee.xml2json(xml);
    return {code: json.apiResponse.linkingCode.toString()};
  }
});

var DeviceToken = Orangee.XMLModel.extend({
  initialize: function(link_code) {
    this.link_code = link_code;
  },
  url: function() {
    return "http://www.orangee.tv/validateLinkingCode?code=" + this.link_code;
  },
  parse: function(xml) {
    orangee.debug(xml);
    var json = orangee.xml2json(xml);
    var status = json.apiResponse.status.toString();
    if (status === 'success') {
      var device_token = json.apiResponse.deviceToken.toString();
      orangee.storage.set('device_token', device_token);
      $.ajaxSetup({
        headers: {'x-roku-reserved-dev-id' : device_token}
      });
      return {token: device_token};
    } else {
      return {};
    }
  }
});

var Subscription = Orangee.Model.extend({
});

var Subscriptions = Orangee.OPMLCollection.extend({
  model: Subscription,
  initialize: function(device_token) {
    this.device_token = device_token;
    Orangee.OPMLCollection.prototype.initialize.apply(this);
  },
  url: function() {
    return "http://api.orangee.tv/getSubscription?token=" + this.device_token;
  },
});

var Video = Orangee.Model.extend({
});

var Videos = Orangee.RSSCollection.extend({
  model: Video,
  initialize: function(url) {
    this.link = url;
    Orangee.OPMLCollection.prototype.initialize.apply(this);
  },
  url: function() {
    return "http://proxy.orangee.tv/proxy?url=" + this.link;
  },
});

var BindingView = Orangee.ItemView.extend({
  template: "#bindingTmpl",
  onRender: function() {
    var token = new DeviceToken(this.model.get('code'));
    (function worker() {
      orangee.log("try to get device token ...");
      token.fetch({
        success: function() {
          var t = token.get('token'); 
          if (t) {
            orangee.storage.set("device_token", t);
            Backbone.history.navigate("", {trigger: true});
          } else {
            setTimeout(worker, 3*5000);
          }
        },
        error: function() {
          setTimeout(worker, 3*5000);
        },
      });
    })();
  },
});

var AlbumItemView = Orangee.ScrollItemView.extend({
  template: '#indexTmpl',
});

var AlbumView = Orangee.ScrollView.extend({
  childView: AlbumItemView,
  template: '#gridTmpl',
  onShow: function() {
    this.numberOfColumns = Math.floor(this.$el.width()/this.$('li').width());
    orangee.debug("numberOfColumns=" + this.numberOfColumns);
    //orangee.debug(this.children);
  },
});

var SubalbumItemView = Orangee.ScrollItemView.extend({
  template: '#subindexTmpl',
});

var SubalbumView = AlbumView.extend({
  childView: SubalbumItemView,
});

var HeaderView = Orangee.ItemView.extend({
  template: '#headerTmpl',
  keyEvents: {
    'back': 'onKeyBack',
  },
  onKeyBack: function() {
    Backbone.history.history.back();
  },
});

var VideoView =  Orangee.VideoView.extend({
  template: '#videoTmpl',
  divid: 'myvideo',
  playerVars: {
    autoplay: 1,
  },
  onRender: function() {
    $(".navbar").hide();
    //this.oldheight = $(".oge-fullscreenvideo").css('top');
    //$(".oge-fullscreenvideo").css('top', 0);
    //return Orangee.VideoView.prototype.onRender.apply(this, arguments);
  },
  onDestroy: function() {
    //$(".oge-fullscreenvideo").css('top', this.oldheight);
    $(".navbar").show();
    //return Orangee.VideoView.prototype.onDestroy.apply(this, arguments);
  },
  onEnd: function() {
    Backbone.history.history.back();
  },
});

var MyRouter = Backbone.Marionette.AppRouter.extend({
  routes: {
    "": "index",
    //"binding": "_binding",
    "album/:url": "album",
    "subalbum/:url": "subalbum",
  },
  index: function(){
    app.header.show(new HeaderView());

    var device_token = orangee.storage.get("device_token");
    if (!device_token) {
      this._binding();
    } else {
      this._index(device_token);
    }
  },
  _index: function(device_token) {
    app.content.show(new Orangee.SpinnerView());
    (new Subscriptions(device_token)).fetch({
      success: function(collection) {
        app.content.show(new AlbumView({collection: collection}));
      },
    });
  },
  _binding: function() {
    (new LinkCode()).fetch({
      success: function(model) {
        app.content.show(new BindingView({model: model}));
      },
    });
  },
  album: function(url) {
    orangee.debug(url);
    app.content.show(new Orangee.SpinnerView());
    (new Videos(url)).fetch({
      success: function(collection) {
        orangee.log(collection);
        app.content.show(new SubalbumView({collection: collection}));
      },
    });
  },
  subalbum: function(url) {
    orangee.debug(url);
    var collection = new Orangee.Collection([{url: url}]);
    app.content.show(new VideoView({collection: collection}));
  },
  test: function() {
    orangee.debug("test");
    var collection = new Orangee.Collection([{url: "http://www.quirksmode.org/html5/videos/big_buck_bunny.mp4"}]);
    app.content.show(new VideoView({collection: collection}));
  },
});

app.addRegions({
  header: "#header",
  content: "#content",
});

app.on("start", function(options){
  orangee.debug_enabled = true;
  new MyRouter();
  Backbone.history.start();
});

