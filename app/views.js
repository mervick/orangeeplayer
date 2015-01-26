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
            setTimeout(worker, 2*5000);
          }
        },
        error: function() {
          setTimeout(worker, 2*5000);
        },
      });
    })();
  },
});

var OpmlItemView = Orangee.ScrollItemView.extend({
  template: '#opmlItemTmpl',
});

var OpmlView = Orangee.ScrollView.extend({
  childView: OpmlItemView,
  template: '#opmlTmpl',
  onShow: function() {
    this.numberOfColumns = Math.floor(this.$el.width()/this.$('li').width());
    orangee.debug("numberOfColumns=" + this.numberOfColumns);
    //orangee.debug(this.children);
  },
});

var RssItemView = Orangee.ScrollItemView.extend({
  template: '#rssItemTmpl',
});

var RssView = OpmlView.extend({
  childView: RssItemView,
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

var PlayerView =  Orangee.VideoView.extend({
  template: '#playerTmpl',
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


