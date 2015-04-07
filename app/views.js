var BindingView = SmartTV.ItemView.extend({
  typeName: "BindingView",
  template: "#bindingTmpl",
  onRender: function() {
    var token = new DeviceToken(this.model.get('code'));
    (function worker() {
      smarttv.log("try to get device token ...");
      token.fetch({
        success: function() {
          var t = token.get('token');
          if (t) {
            smarttv.storage.set("device_token", t);
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

var OPMLItemView = SmartTV.ScrollItemView.extend({
  typeName: "OPMLItemView",
  template: '#opmlItemTmpl',
});

var OPMLView = SmartTV.ScrollView.extend({
  typeName: "OPMLView",
  childView: OPMLItemView,
  template: '#opmlTmpl',
  onShow: function() {
    this.numberOfColumns = Math.floor(this.$el.width()/this.$('li').width());
    smarttv.debug("numberOfColumns=" + this.numberOfColumns);
    //smarttv.debug(this.children);
  },
});

var RSSItemView = SmartTV.ScrollItemView.extend({
  typeName: "RSSItemView",
  template: '#rssItemTmpl',
});

var RSSView = OPMLView.extend({
  typeName: "RSSView",
  childView: RSSItemView,
});

var CSVItemView = SmartTV.ScrollItemView.extend({
  typeName: "CSVItemView",
  template: '#csvItemTmpl',
});

var CSVView = OPMLView.extend({
  typeName: "CSVView",
  childView: CSVItemView,
});

var HeaderView = SmartTV.ItemView.extend({
  typeName: "HeaderView",
  template: '#headerTmpl',
  keyEvents: {
    'back': 'onKeyBack',
  },
  onKeyBack: function() {
    if (Backbone.history.fragment != "") {
      Backbone.history.history.back();
    } else {
      smarttv.exit();
    }
  },
});

var ErrorView = SmartTV.ItemView.extend({
  typeName: "ErrorView",
  template: '#errorTmpl',
});

var HtmlView = SmartTV.ScrollView.extend({
  typeName: "HtmlView",
  template: '#htmlTmpl',
  keyEvents: {
    'up': 'onKeyUp',
    'down': 'onKeyDown',
  },
  onKeyUp: function() {
    this.scrollBy(0, 100);
  },
  onKeyDown: function() {
    this.scrollBy(0, -100);
  },
});

var PlayerView = SmartTV.VideoView.extend({
  typeName: "PlayerView",
  template: '#playerTmpl',
  options: {
    youtube: false,
    dailymotion: false,
    divid: 'myvideo',
    autoplay: true,
  },
  onRender: function() {
    $(".navbar").hide();
    //this.oldheight = $(".oge-fullscreenvideo").css('top');
    //$(".oge-fullscreenvideo").css('top', 0);
    //return SmartTV.VideoView.prototype.onRender.apply(this, arguments);
  },
  onDestroy: function() {
    //$(".oge-fullscreenvideo").css('top', this.oldheight);
    $(".navbar").show();
    return SmartTV.VideoView.prototype.onDestroy.apply(this, arguments);
  },
  onEnd: function() {
    Backbone.history.history.back();
  },
  /*onError: function() {
    Backbone.history.navigate("error", {trigger: true});
  },*/
  onEnter: function() {
    this.videoplayer.togglePlay();
  },
});


