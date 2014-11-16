//your script here
'use strict';
var app = new Marionette.Application();

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
  toJSON: function() {
    //http://stackoverflow.com/questions/15298449/cannot-get-the-cid-of-the-model-while-rendering-a-backbone-collection-over-a-tem
    var json = Backbone.Model.prototype.toJSON.apply(this, arguments);
    json.cid = this.cid;
    return json;
  },
});

var Subscriptions = Orangee.OPMLCollection.extend({
  model: Subscription,
  initialize: function(device_token) {
    this.device_token = device_token;
  },
  url: function() {
    return "http://api.orangee.tv/getSubscription?token=" + this.device_token;
  },
});

var Videos = Orangee.RSSCollection.extend({
  initialize: function(url) {
    this.url = url;
  },
  url: function() {
    return "http://proxy.orangee.tv/proxy?url=" + escape(this.url);
  },
});

var BindingView = Orangee.ItemView.extend({
  el: "#main",
  template: "#bindingTmpl",
  onRender: function() {
    var token = new DeviceToken(code.get('code'));
    (function worker() {
      orangee.log("try to get device token ...");
      token.fetch({
        success: function() {
          var t = token.get('token'); 
          if (t) {
            orangee.storage.set("device_token", t);
            (new Subscriptions(t)).fetch();
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

var AlbumItemView = Orangee.ItemView.extend({
  template: '#indexTmpl',
});

var AlbumView = Orangee.CollectionView.extend({
  el: "#main",
  childView: AlbumItemView,
});

app.init = function(options){
  orangee.debug_enabled = true;
  Backbone.history.start();

  /*
  $("#loading").spin({}).hide();
  $('#loading').ajaxStart(function(){ $(this).fadeIn(); });
  $('#loading').ajaxComplete(function(){ $(this).fadeOut(); });
  */

  var device_token = orangee.storage.get("device_token");
  orangee.debug(device_token);
  if (!device_token) {
    (new LinkCode()).fetch({
      success: function(model) {
        new BindingView({model: code}).render();
      },
    });
  } else {
    (new Subscriptions(device_token)).fetch({
      success: function(collection) {
        new AlbumView({collection: collection}).render();
      },
    });
  }
};

