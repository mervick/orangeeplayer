'use strict';

var LinkCode = SmartTV.XMLModel.extend({
  typeName: 'LinkCode',
  url: "http://www.orangee.tv/getLinkingCode",
  parse: function(xml) {
    var json = smarttv.xml2json(xml);
    return {code: json.apiResponse.linkingCode.toString()};
  }
});

var DeviceToken = SmartTV.XMLModel.extend({
  typeName: 'DeviceToken',
  initialize: function(link_code) {
    this.link_code = link_code;
  },
  url: function() {
    return "http://www.orangee.tv/validateLinkingCode?code=" + this.link_code;
  },
  parse: function(xml) {
    smarttv.debug(xml);
    var json = smarttv.xml2json(xml);
    var status = json.apiResponse.status.toString();
    if (status === 'success') {
      var device_token = json.apiResponse.deviceToken.toString();
      smarttv.storage.set('device_token', device_token);
      return {token: device_token};
    } else {
      return {};
    }
  }
});

var Subscriptions = SmartTV.OPMLCollection.extend({
  typeName: "Subscriptions",
  initialize: function(device_token) {
    this.device_token = device_token;
    SmartTV.OPMLCollection.prototype.initialize.apply(this);
  },
  url: function() {
    return "http://api.orangee.tv/getSubscription?token=" + this.device_token;
  },
});

var Albums = SmartTV.OPMLCollection.extend({
  typeName: "Albums",
  initialize: function(url) {
    this.link = url;
    SmartTV.OPMLCollection.prototype.initialize.apply(this);
  },
  url: function() {
    if (smarttv.PLATFORM === 'samsung') {
      return this.link;
    } else {
      return "http://proxy.orangee.tv/proxy?url=" + encodeURIComponent(this.link);
    }
  },
});

var Videos = SmartTV.RSSCollection.extend({
  typeName: "Videos",
  initialize: function(url) {
    this.link = url;
    SmartTV.OPMLCollection.prototype.initialize.apply(this);
  },
  url: function() {
    if (smarttv.PLATFORM === 'samsung') {
      return this.link;
    } else {
      return "http://proxy.orangee.tv/proxy?url=" + encodeURIComponent(this.link);
    }
  },
});

var CSVVideos = SmartTV.CSVCollection.extend({
  typeName: "CSVVideos",
  initialize: function(url) {
    this.link = url;
    SmartTV.CSVCollection.prototype.initialize.apply(this);
  },
  url: function() {
    if (smarttv.PLATFORM === 'samsung') {
      return this.link;
    } else {
      return "http://proxy.orangee.tv/proxy?url=" + encodeURIComponent(this.link);
    }
  },
});

