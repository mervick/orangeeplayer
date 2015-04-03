'use strict';

var MyController = SmartTV.Controller.extend({
  typeName: "MyController",
  index: function() {
    app.header.show(new HeaderView());

    //this.video("http://www.quirksmode.org/html5/videos/big_buck_bunny.mp4");
    var device_token = smarttv.storage.get("device_token");
    if (!device_token || device_token === "") {
      Backbone.history.navigate("binding", {trigger: true});
    } else {
      Airbrake.onload = function(client) {
        Airbrake.addParams({device_token: device_token, version: orangee.APPVERSION, platform: smarttv.PLATFORM});
      }
      this._index(device_token);
    }
  },
  _index: function(device_token) {
    app.content.show(new SmartTV.SpinnerView());
    (new Subscriptions(device_token)).fetch({
      success: function(collection) {
        app.content.show(new OPMLView({collection: collection}));
      },
      error: function() {
        Backbone.history.navigate("error", {trigger: true});
      },
    });
  },
  binding: function() {
    (new LinkCode()).fetch({
      success: function(model) {
        app.content.show(new BindingView({model: model}));
      },
      error: function() {
        Backbone.history.navigate("error", {trigger: true});
      },
    });
  },
  album: function(url) {
    smarttv.debug(url);
    app.content.show(new SmartTV.SpinnerView());
    if (/\.opml$/.test(url)) {
      this._opml(url);
    } else if (/\.csv$/.test(url) ||
               /\.txt$/.test(url) ) {
      this._csv(url);
    } else {
      this._rss(url);
    }
  },
  _opml: function(url) {
    (new Albums(url)).fetch({
      success: function(collection) {
        smarttv.log(collection);
        app.content.show(new OPMLView({collection: collection}));
      },
      error: function() {
        Backbone.history.navigate("error", {trigger: true});
      },
    });
  },
  _rss: function(url) {
    (new Videos(url)).fetch({
      success: function(collection) {
        smarttv.log(collection);
        app.content.show(new RSSView({collection: collection}));
      },
      error: function() {
        Backbone.history.navigate("error", {trigger: true});
      },
    });
  },
  _csv: function(url) {
    (new CSVVideos(url)).fetch({
      success: function(collection) {
        smarttv.log(collection);
        app.content.show(new CSVView({collection: collection}));
      },
      error: function() {
        Backbone.history.navigate("error", {trigger: true});
      },
    });
  },
  video: function(url) {
    smarttv.debug(url);
    var collection = new SmartTV.Collection([{url: url}]);
    app.content.show(new PlayerView({collection: collection}));
  },
  html: function(cid) {
    var desc = app.content.currentView.collection.selected.get('description');
    var model = new SmartTV.Model({html: desc});
    app.content.show(new HtmlView({model: model}));
  },
  error: function(msg) {
     app.content.show(new ErrorView());
  },
});

var MyRouter = SmartTV.Router.extend({
  typeName: "MyRouter",
  appRoutes: {
    "": "index",
    "binding": "binding",
    "error": "error",
    "album/:url": "album",
    "video/:url": "video",
    "html/:cid": "html",
  },
});

var app = new SmartTV.Application({
  options: {
    debug_enabled: true,
    youtube_api: false,//smarttv.PLATFORM != 'samsung',
    dailymotion_api: false,
  },
  regions: {
    header: "#header",
    content: "#content",
  },
  router: new MyRouter({controller: new MyController()}),
});

