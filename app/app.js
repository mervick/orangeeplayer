'use strict';
var App = new Marionette.Application();

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
  /*toJSON: function() {
    //http://stackoverflow.com/questions/15298449/cannot-get-the-cid-of-the-model-while-rendering-a-backbone-collection-over-a-tem
    var json = Backbone.Model.prototype.toJSON.apply(this, arguments);
    json.cid = this.cid;
    return json;
  },*/
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

var Videos = Orangee.RSSCollection.extend({
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
});

var SubalbumItemView = Orangee.ItemView.extend({
  template: '#subindexTmpl',
});

var SubalbumView = Orangee.CollectionView.extend({
  childView: SubalbumItemView,
});

var PhotoView = Orangee.ItemView.extend({
  template: '#itemTmpl',
});

var MyRouter = Backbone.Marionette.AppRouter.extend({
  routes: {
    "": "index",
    "binding": "binding",
    "subalbum/:url": "subalbum",
  },
  index: function(){
     var device_token = orangee.storage.get("device_token");
     (new Subscriptions(device_token)).fetch({
      success: function(collection) {
        App.content.show(new AlbumView({collection: collection}));
      },
    });
  },
  binding: function() {
    (new LinkCode()).fetch({
      success: function(model) {
        App.content.show(new BindingView({model: model}));
      },
    });
  },
  subalbum: function(url) {
    orangee.debug(url);
    (new Videos(url)).fetch({
      success: function(collection) {
        orangee.log(collection);
        App.content.show(new SubalbumView({collection: collection}));
      },
    });
  },
});

App.addRegions({
  content: "#main",
});

App.init = function(options){
  orangee.debug_enabled = true;
  new MyRouter();
  Backbone.history.start();

  /*
  $("#loading").spin({}).hide();
  $('#loading').ajaxStart(function(){ $(this).fadeIn(); });
  $('#loading').ajaxComplete(function(){ $(this).fadeOut(); });
  */

  var device_token = orangee.storage.get("device_token");
  orangee.debug(device_token);
  if (!device_token) {
    Backbone.history.navigate("binding", {trigger: true});
  } else {
    Backbone.history.navigate("", {trigger: true});
  }
};

