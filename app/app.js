'use strict';
var app = new Orangee.Application({
  youtube: false,//orangee.PLATFORM != 'samsung',
  dailymotion: false,
  regions: {
    header: "#header",
    content: "#content",
  },
});

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
    });
  },
  binding: function() {
    (new LinkCode()).fetch({
      success: function(model) {
        app.content.show(new BindingView({model: model}));
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
    });
  },
  _rss: function(url) {
    (new Videos(url)).fetch({
      success: function(collection) {
        orangee.log(collection);
        app.content.show(new RSSView({collection: collection}));
      },
    });
  },
  _csv: function(url) {
    (new CSVVideos(url)).fetch({
      success: function(collection) {
        orangee.log(collection);
        app.content.show(new CSVView({collection: collection}));
      },
    });
  },
  video: function(url) {
    orangee.debug(url);
    //"http://www.quirksmode.org/html5/videos/big_buck_bunny.mp4"
    var collection = new Orangee.Collection([{url: url}]);
    app.content.show(new PlayerView({collection: collection}));
  },
});

var MyRouter = Orangee.Router.extend({
  typeName: "MyRouter",
  appRoutes: {
    "": "index",
    "binding": "binding",
    "album/:url": "album",
    "video/:url": "video",
  },
});

app.on("before:start", function(options) {
  orangee.debug_enabled = true;
});

app.on("start", function(options){
  new MyRouter({controller: new MyController()});
  Backbone.history.start();
});

