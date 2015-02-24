'use strict';

var MyController = Orangee.Controller.extend({
  typeName: "MyController",
  index: function() {
    app.header.show(new HeaderView());

    var device_token = orangee.storage.get("device_token");
    if (!device_token || device_token === "") {
      Backbone.history.navigate("binding", {trigger: true});
    } else {
      this._index(device_token);
    }
  },
  _index: function(device_token) {
    app.content.show(new Orangee.SpinnerView());
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
    orangee.debug(url);
    app.content.show(new Orangee.SpinnerView());
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
        orangee.log(collection);
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
        orangee.log(collection);
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
        orangee.log(collection);
        app.content.show(new CSVView({collection: collection}));
      },
      error: function() {
        Backbone.history.navigate("error", {trigger: true});
      },
    });
  },
  video: function(url) {
    orangee.debug(url);
    //"http://www.quirksmode.org/html5/videos/big_buck_bunny.mp4"
    var collection = new Orangee.Collection([{url: url}]);
    app.content.show(new PlayerView({collection: collection}));
  },
  error: function(msg) {
     app.content.show(new ErrorView());
  },
});

var MyRouter = Orangee.Router.extend({
  typeName: "MyRouter",
  appRoutes: {
    "": "index",
    "binding": "binding",
    "error": "error",
    "album/:url": "album",
    "video/:url": "video",
  },
});

var app = new Orangee.Application({
  options: {
    debug_enabled: true,
    youtube_api: false,//orangee.PLATFORM != 'samsung',
    dailymotion_api: false,
  },
  regions: {
    header: "#header",
    content: "#content",
  },
  router: new MyRouter({controller: new MyController()}),
});

