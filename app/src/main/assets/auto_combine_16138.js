define('components/lift/lift.js', function(require, exports, module){ /*
 * 返回顶部组件
*/
var timer;
var fadeoutTimer;
var preScrollY;

var init = function () {
  var $lift = $('<div id="J_lift" class="lift"></div>');
  var $body = $('body');
  $body.append($lift);
  $(window).on('scroll.lift', function() {
    if(!timer) {
      timer = setTimeout(function() {
        var scrollY = window.scrollY;
        var isScrollUp = preScrollY - scrollY;
        preScrollY = scrollY;
        clearTimeout(timer);
        console.log('scrollY', isScrollUp, timer);
        timer = null;
        if(scrollY > 1740 && isScrollUp > 0) {
          $lift.show();
          clearTimeout(fadeoutTimer);
          fadeoutTimer = setTimeout(function() {
            $lift.hide();
            clearTimeout(fadeoutTimer);
            fadeoutTimer = null;
          }, 2000);
        }
      }, 200);
    }
  });
  $lift.on('click', function() {
    $body.addClass('lift-animate');
    window.scrollTo(0, 0);
    var scrollAnimate = setTimeout(function() {
      $body.removeClass('lift-animate');
      clearTimeout(scrollAnimate);
      scrollAnimate = null;
    }, 1000);
    $lift.hide();
  });
};

exports.init = init; 
});
;define('components/list-panel/list-panel.js', function(require, exports, module){ /**
 * 列表组件panel
 * @param {}   :
 **** @param {Array} list 数组
 */

function panel(str) {
  var contain = this.contain = document.createElement('div');
  contain.className = 'list-pannel';
  var domHeader = document.createElement('h4');
  domHeader.innerHTML = str;
  contain.appendChild(domHeader);
  var content = this.content = document.createElement('ul');
  content.className = "list-pannel-con";
  contain.appendChild(content);
}

function createPanel(str) {
  return new panel(str);
}

module.exports = {
  createPanel: createPanel
}

 
});
;define('components/recommend/recommend.js', function(require, exports, module){ /**
 * 推荐位组件，diff的判断是根据title，title不同，更新
 * @param {Dom} contain  dom钩子:
 **** @param {Array} list 数组
 */

var query = require('assets/js/module/query.js');
var tpl = "<div class=\"recommend-img-col{{displayType}}\"><img class=\"J_lazyload lazyload J_exposure\" width=\"163\" height=\"99\" data-src=\"{{bannerUrl}}\" data-link-title=\"{{title}}\" data-relatedid=\"{{relatedId}}\" data-type=\"{{featuredType}}\" data-link=\"{{link}}\" data-pname=\"{{packageName}}\" data-digest=\"{{digest}}\"  data-expid=\"{{experimentalId}}\" data-ad=\"{{ads}}\"  data-index=\"{{$index}}\" data-external=\"{{external}}\" data-position=\"{{position}}\" data-uid=\"{{uid}}\" data-rid=\"{{rid}}\"></div>\r\n";
if (isInstantData) {
  tpl = tpl.replace(/([\s\S]*)(<\/div>)/g, function(s0, s1, s2) {
    return s1 + "<div class=\"statistics\" data-pos=\"{{pos}}\" data-stattype=\"{{statType}}\" data-mark=\"{{mark}}\">\r\n\t{{index}}\r\n\t{{tapAmount}}\r\n\t{{downAmount}}\r\n\t{{covertRate}}\r\n</div>" + s2;
  });
}

var _render = require('assets/js/module/render.js');
var tap = require('assets/js/module/tap.js');
var createReqQuery = require('assets/js/createReqQuery.js');
var posPrefix = "recommend";

var render = function(contain, list, diff) {
  if (diff) {
    var newContain = document.createElement('div');
    _render({
      contain: newContain,
      tpl: tpl,
      list: list
    });
    var $newElems = $(newContain).find('img');
    var $oldElems = $(contain).find('img');
    $newElems.each(function(i, elem) {
      var $elem = $(elem);
      var newTitle = $elem.data('uid');
      var $oldElem = $oldElems.eq(i);
      var oldTitle = $oldElem.data('uid');
      if (newTitle !== oldTitle) {
        $oldElem.replaceWith($elem);
      }
    });
    newContain = null;
  } else {
    _render({
      contain: contain,
      tpl: tpl,
      list: list
    });
    tap.on(contain);
    contain.addEventListener('tap', handTap);
  }
}

function handTap(e) {
  var target = e.target;
  var tagName = target.tagName.toLowerCase();
  var dataset = target.dataset;

  var reqQuery = createReqQuery({
    elem: target,
    posPrefix: posPrefix
  });

  var id = dataset.relatedid;
  var type = dataset.type;

  var _ref = 'subject/';
  var catId = query.get('catid') || '';

  // 类型1：，类型2：，类型3：活动
  switch (type) {
    // 应用
    case '1':
      if (catId) {
        _ref = _ref + '-1_' + catId;
      } else {
        _ref = 'subject/-1_-1';
      }
      reqQuery.extra_params.refs = ajaxData.refs + '-detail/' + id;
      var detailOpt = $.extend(reqQuery, {
        url: 'mimarket://details?appId=' + id,
        ref: _ref,
        launchMode: loadDetailMethod
      });
      market.loadPage(JSON.stringify(detailOpt));
      break;
      // 专题
    case '2':
      var url = PROTOCOL + 'subject.html';
      url = query.add(url, {
        id: id,
        catid: catId
      });
      url = query.add(url, reqQuery.extra_params);
      var detailOpt = $.extend(reqQuery, {
        url: url
      });
      market.loadPage(JSON.stringify(detailOpt));
      break;
    case '3':
      var url = query.add(dataset.link, reqQuery.extra_params);
      var detailOpt = $.extend(reqQuery, {
        url: url,
        external: dataset.external || false
      });
      market.loadPage(JSON.stringify(detailOpt));
      break;
  }
  e.stopPropagation();
}
exports.render = render;
 
});
;define('components/rec-words/rec-words.js', function(require, exports, module){ /**
 * 推荐词组件
 * @param {Dom} contain  dom钩子:
 **** @param {Array} list 数组
 */

var query = require('assets/js/module/query.js');
var tpl = "<a class=\"radius-btn J_exposure\" href=\"javascript:;\" data-index=\"{{$index}}\" data-link-title=\"{{title}}\" data-link=\"{{link}}\" data-rid=\"{{rid}}\">{{title}}</a>\r\n";
var _render = require('assets/js/module/render.js');
var afterActive = require('assets/js/global.js').afterActive;
var createReqQuery = require('assets/js/createReqQuery.js');
var posPrefix = "recWords";

var render = function(contain, list) {
  _render({
    contain: contain,
    tpl: tpl,
    list: list
  });
  contain.addEventListener('click', handTap);
}
function handTap(e) {
  afterActive(function() {
    var target = e.target;
    var dataset = target.dataset;
    var reqQuery = createReqQuery({
      elem: target,
      posPrefix: posPrefix
    });
    var detailOpt = $.extend(reqQuery, {
      url: query.add(dataset.link, reqQuery.extra_params)
    });
    market.loadPage(JSON.stringify(detailOpt));
    e.stopPropagation();
  });
}

exports.render = render; 
});
;define('assets/js/module/number.js', function(require, exports, module){ // 对整数进行补齐处理
var pad = function(num, length) {
  var pre = "";
  var string = String(num);
  if (string.length < length) {
    pre = (new Array(length - string.length + 1)).join('0');
  }
  return pre + string;
}

exports.pad = pad; 
});
;define('assets/js/module/date.js', function(require, exports, module){ var _local = {
  zh: {
    monday: '星期一',
    tuesday: '星期二',
    wednesday: '星期三',
    thursday: '星期四',
    friday: '星期五',
    saturday: '星期六',
    sunday: '星期日',
    today: '今天',
    yesterday: '昨天',
    dateFormate: 'MM月dd日'
  },
  en: {
    monday: 'Mon',
    tuesday: 'Tues',
    wednesday: 'Wed',
    thursday: 'Thur',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun',
    today: 'Today',
    yesterday: 'Yesterday',
    dateFormate: 'MM/dd'
  }
}

_local = _local[lang];

var pad = require('assets/js/module/number.js').pad;

/**
 * 格式化日期
 * @param {Boolean} timestamp 时间戳
 * @param {String} pattern 匹配的正则
 */
var format = function (timestamp, pattern) {
  var source = new Date(timestamp);
  function replacer(patternPart, result) {
      pattern = pattern.replace(patternPart, result);
  }
   
  var year    = source.getFullYear(),
      month   = source.getMonth() + 1,
      date2   = source.getDate(),
      hours   = source.getHours(),
      minutes = source.getMinutes(),
      seconds = source.getSeconds();

  replacer(/yyyy/g, pad(year, 4));
  replacer(/yy/g, pad(parseInt(year.toString().slice(2), 10), 2));
  replacer(/MM/g, pad(month, 2));
  replacer(/M/g, month);
  replacer(/dd/g, pad(date2, 2));
  replacer(/d/g, date2);

  replacer(/HH/g, pad(hours, 2));
  replacer(/H/g, hours);
  replacer(/hh/g, pad(hours % 12, 2));
  replacer(/h/g, hours % 12);
  replacer(/mm/g, pad(minutes, 2));
  replacer(/m/g, minutes);
  replacer(/ss/g, pad(seconds, 2));
  replacer(/s/g, seconds);

  return pattern;
};

/*
* 时间轴格式化
*/
var formatTimeline = function(time) {
  var now = Date.now();
  var dateStr = "";
  var timDiff = now - time;
  if(timDiff < 86400000) {
    // 如果小于1天
    dateStr = _local.today;
  } else if(172800000 > timDiff > 86400000) {
    // 如果小于2天大于1天
    dateStr = _local.yesterday;
  } else {
    dateStr = format(time, _local.dateFormate);
  }
  return dateStr;
};

/*
* 星期数字格式化
*/
var formatWeek = function(timestamp) {
  var chinese = {
    '0': _local.sunday,
    '1': _local.monday,
    '2': _local.tuesday,
    '3': _local.wednesday,
    '4': _local.thursday,
    '5': _local.friday,
    '6': _local.saturday
  }
  var day = new Date(timestamp).getDay();
  return chinese[day];
}

/*
* 倒计时格式化
*/
var formatCountDown = function(timestamp, pattern) {
  timestamp = parseInt(timestamp / 1000, 10);
  function replacer(patternPart, result) {
      pattern = pattern.replace(patternPart, result);
  }
  var day = Math.floor(timestamp / 86400);
  var hour = Math.floor((timestamp - day * 86400) / 3600);
  var minute = Math.floor((timestamp - day * 86400 - hour * 3600) / 60);
  var second = Math.floor(timestamp - day * 86400 - hour * 3600 - minute * 60);

  replacer(/dd/g, pad(day, 2));
  replacer(/d/g, day);
  replacer(/HH/g, pad(hour, 2));
  replacer(/H/g, hour);
  replacer(/mm/g, pad(minute, 2));
  replacer(/m/g, minute);
  replacer(/ss/g, pad(second, 2));
  replacer(/s/g, second);

  return pattern;
}

module.exports = {
  format: format,
  formatTimeline: formatTimeline,
  formatWeek: formatWeek,
  formatCountDown: formatCountDown
};
 
});
;define('components/cabinet/cabinet.js', function(require, exports, module){ /**
* 橱窗，render：四格橱窗，renderTop置顶橱窗
*/
var tpl = "<!-- <div id=\"J_cabinet\" class=\"cabinet cf\"> -->\r\n<div class=\"cabinet-list cabinet-list-{{position}}\">\r\n  <div class=\"cabinet-list-desc fl\">\r\n    <h3 class=\"ellipsis\" style=\"color: {{titleColor}}\">{{title}}</h3>\r\n    <p class=\"ellipsis\">{{desc}}</p>\r\n  </div>\r\n  <div class=\"cabinet-list-img fr\"><img class=\"J_lazyload lazyload\" data-src=\"{{src}}\" width=\"60\" height=\"60\"></div>\r\n  <div class=\"cabinet-date {{isHide}}\" style=\"background-color: {{dateColor}}\">\r\n    <p>{{formateDate}}</p>\r\n    <p>{{formateWeek}}</p>\r\n  </div>\r\n  <div class=\"touch\" data-link=\"{{link}}\" data-title=\"{{title}}\" data-index=\"{{$index}}\"><div class=\"touch-active\"></div></div>\r\n</div>\r\n<!-- </div> -->";
var tplTop = "<!-- <div class=\"cabinet-top\"> -->\r\n<div class=\"cabinet-top-wrap\">\r\n  <span class=\"icon-arrow\"></span><div class=\"cabinet-list-img\"><img class=\"J_lazyload lazyload\" data-src=\"{{src}}\" width=\"44\" height=\"44\"></div><div class=\"cabinet-top-desc\">\r\n    <h3 class=\"ellipsis\" style=\"color: {{titleColor}}\">{{title}}</h3>\r\n    <p>\r\n      <span class=\"ellipsis\">{{desc}}</span>\r\n      <span class=\"J_countDown\" class=\"cabinet-top-countdown\"></span>\r\n    </p>\r\n  </div>\r\n</div>\r\n<div class=\"touch\" data-link=\"{{link}}\" data-title=\"{{title}}\" data-index=\"win0-0\"><div class=\"touch-active\"></div></div>\r\n<!-- </div> -->\r\n";
var _render = require('assets/js/module/render.js');
var query = require('assets/js/module/query.js');
var dom = require('assets/js/module/dom.js');
var date = require('assets/js/module/date.js');
var tap = require('assets/js/module/tap.js');
var posPrefix = 'win';

var _local = {
  zh: {
    date: 'M月d日'
  },
  en: {
    date: 'MM/dd'
  }
}

_local = _local[lang];

var render = function(opt){
  opt = $.extend({
    tpl: tpl
  }, opt);
  var list = opt.list;
  var now = new Date().getTime();
  list.forEach(function(elem, i) {
    if(elem.type === 'calendar') {
      elem.formateDate = date.format(now, _local.date);
      elem.formateWeek = date.formatWeek(now);
    } else {
      elem.isHide = 'hide';
    }
  });
  _render(opt);

  var contain = opt.contain;
  contain.dataset.contentid = opt.contentId;
  tap.on(contain);
  contain.addEventListener('tap', handTap);
};
  
/**
* 置顶橱窗
*/
var renderTop = function(opt){
  opt = $.extend({
    tpl: tplTop
  }, opt);
  var list = opt.list;
  _render(opt);

  var contain = opt.contain;
  contain.dataset.contentid = opt.contentId;
  tap.on(contain);
  contain.addEventListener('tap', handTap);

  var deadline = opt.deadline;
  var now = opt.now;
  var domCountDown = contain.getElementsByClassName('J_countDown')[0];

  if(deadline) {
    updateTime(deadline - now);

    var itv = setInterval(function() {
      now += 1000;
      var diffTime = deadline - now;
      if(diffTime >= 0) {
        updateTime(diffTime);
      } else {
        contain.classList.add('hide');
        clearInterval(itv)
        contain.removeEventListener('tap', handTap);
      }
    }, 1000);
  }

  function updateTime(diffTime) {
    if(opt.type !== 'countdown') {
      return;
    }
    var day = Math.floor(diffTime / 86400000);
    if(day <= 1) {
      day = '';
    } else {
      day = day + '天';
    }
    domCountDown.textContent = day + date.formatCountDown(diffTime, 'HH:mm:ss');
  }
};

function handTap(e) {
  var refs = ajaxData.refs;
  var extraParams = {
    refs: refs,
    h5: h5
  };
  var dataset = e.target.dataset;
  var url = query.add(dataset.link, 'refs', refs);
  var index = dataset.index;
  var pos = posPrefix + index;
  extraParams.pos = pos;
  console.log('refPosition,extraParams,url', index, extraParams, url);
  console.log('contentid', e.currentTarget.dataset.contentid);
  url = query.add(url, 'pos', pos);
  market.loadPage(JSON.stringify({
    url: url,
    title: dataset.title,
    refPosition: index,
    ref: 'win/' + e.currentTarget.dataset.contentid,
    extra_params: extraParams
  }));
}

module.exports = {
  render: render,
  renderTop: renderTop
}
 
});
;define('components/menu/menu.js', function(require, exports, module){ var tpl = "<div class=\"J_menu J_exposure menu-wrap ellipsis\" data-uid=\"{{uid}}\" data-link-title=\"{{title}}\" data-link=\"{{url}}\" data-external=\"{{external}}\" data-index=\"{{$index}}\" data-rid=\"{{rid}}\">\r\n  <div class=\"menu-img\"><img class=\"J_lazyload lazyload\" data-src=\"{{icon}}\" width=\"35\" height=\"35\"></div>\r\n  <span style='color: {{color}}'>{{title}}</span>\r\n</div>\r\n";
if (isInstantData) {
  tpl = tpl.replace(/([\s\S]*)(<\/div>)/g, function(s0, s1, s2) {
    return s1 + "<div class=\"statistics\" data-pos=\"{{pos}}\" data-stattype=\"{{statType}}\" data-mark=\"{{mark}}\">\r\n\t{{index}}\r\n\t{{tapAmount}}\r\n\t{{downAmount}}\r\n\t{{covertRate}}\r\n</div>" + s2;
  });
}

var _render = require('assets/js/module/render.js');
var query = require('assets/js/module/query.js');
var createReqQuery = require('assets/js/createReqQuery.js');
var posPrefix = 'menu';

var render = function(opt) {
  opt = $.extend({
    tpl: tpl
  }, opt);
  var contain = opt.contain;
  if (opt.diff) {
    var newContain = document.createElement('div');
    opt.contain = newContain;
    _render(opt);
    var $newElems = $(newContain).find('.J_menu');
    var $oldElems = $(contain).find('.J_menu');
    $newElems.each(function(i, elem) {
      var $elem = $(elem);
      var newPname = $elem.data('uid');
      var $oldElem = $oldElems.eq(i);
      if ($oldElem.length !== 0) {
        if (newPname !== $oldElem.data('uid')) {
          $oldElem.replaceWith($elem);
        }
      } else {
        $oldContain.append($newContain.find('.menu-wrap').slice(i));
        return false;
      }
    });
    newContain = null;
  } else {
    _render(opt);
    $(contain).on('click', '.J_menu', handTap)
  }

}

function handTap(e) {
  var dataset = this.dataset;
  var reqQuery = createReqQuery({
    elem: this,
    posPrefix: posPrefix
  });
  var url = query.add(dataset.link, reqQuery.extra_params);
  var detailOpt = $.extend(reqQuery, {
    url: url,
    external: dataset.external || false
  });
  market.loadPage(JSON.stringify(detailOpt));
}

exports.render = render;
 
});
;define('components/rec-app-desc/rec-app-desc.js', function(require, exports, module){ var dom = require('assets/js/module/dom.js');
var query = require('assets/js/module/query.js');
var device = require('assets/js/device.js');

var wrapTpl = "<div class=\"rec-app-desc-title tap cf\" data-index=\"{{position}}\" data-position=\"{{position}}\" data-link=\"{{barLink}}\" data-link-title=\"{{barLinkTitle}}\">\r\n  <span class=\"rec-app-desc-name card-font-left fl\">{{barTitle}}</span>\r\n\t<div class=\"rec-app-desc-more card-font-right fr\">\r\n    <span>{{more}}</span><span class=\"icon-arrow\"></span>\r\n  </div>\r\n</div>\r\n<div class=\"rec-app-desc-wrap tap\" data-index=\"{{position}}\" data-position=\"{{position}}\" data-link=\"{{artLink}}\" data-link-title=\"{{artLinkTitle}}\">\r\n  <div class=\"rec-app-desc-banner\"><img class=\"J_lazyload lazyload\" width=\"100%\" height=\"100%\" data-src=\"{{banner}}\"></div>\r\n  <div class=\"rec-app-desc-art\">\r\n    <p class=\"rec-app-desc-art-title\">{{artTitle}}</p>\r\n    <p class=\"rec-app-desc-art-contend\">{{artContent}}</p>\r\n  </div>\r\n</div>\r\n";
var appTpl = "<li>\r\n  <div class=\"applist-item\">\r\n    <div class=\"tap J_exposure\" data-index=\"{{$index}}\" data-expid=\"{{experimentalId}}\" data-pname=\"{{packageName}}\" data-link-title=\"{{displayName}}\"  data-digest=\"{{digest}}\" data-ad=\"{{ads}}\" data-position=\"{{position}}\" data-appid=\"{{id}}\" data-rid=\"{{rid}}\" data-outertraceid=\"{{outerTraceId}}\">\r\n      <div class=\"applist-wrap c{{id}}\">\r\n        <div class=\"applist-rank\">{{$rankIndex}}</div><div class=\"applist-img\"><img class=\"J_lazyload lazyload\" data-src=\"{{icon}}\" width=\"52\" height=\"52\"></div><div class=\"applist-wrap-des\">\r\n          <h3 class=\"ellipsis\">{{displayName}}</h3>\r\n          <div class=\"applist-wrap-flex-item\">\r\n            <div class=\"icon-star icon-star{{ratingScore}}\">\r\n              <div class=\"icon-star icon-star-light\"></div>\r\n            </div>\r\n          </div>\r\n          <p class=\"applist-info-bottom\">\r\n            <span class=\"ellipsis\">{{level1CategoryName}}</span>\r\n            <span>{{apkSize}} M</span>\r\n            {{ad-flag}}\r\n          </p>\r\n        </div>\r\n      </div>\r\n    </div>\r\n    <div class=\"J_btnInstall install-btn\" data-pname=\"{{packageName}}\">\r\n  <button type=\"button\" data-pname=\"{{packageName}}\" class=\"touch J_install\" data-appid=\"{{id}}\" data-installed=\"\" data-index=\"{{$index}}\" data-expid=\"{{experimentalId}}\" data-digest=\"{{digest}}\" data-ad=\"{{ads}}\" data-position=\"{{position}}\" data-link-title=\"{{displayName}}\" data-outertraceid=\"{{outerTraceId}}\"></button>\r\n  <div class=\"install-btn-display\">\r\n    <span class=\"J_appProgress install-progress\"></span>\r\n    <span class=\"J_appStatusProgress\">{{status}}</span>\r\n  </div>\r\n</div>\r\n  </div>\r\n</li>"
var _render = require('assets/js/module/render.js');
var tap = require('assets/js/module/tap.js');
var createReqQuery = require('assets/js/createReqQuery.js');
var posPrefix = "recAppDesc";
var refs = ajaxData.refs;

wrapTpl = wrapTpl.replace(/{{more}}/g, local[lang].more);

var render = function(opt, msg) {
  var list = [msg];
  console.log("msg", msg)
  var domRoot = opt.contain;
  var domContent = document.createElement('div');
  domContent.className = "rec-app-desc card-both";
  var _opt = {
    contain: domContent,
    tpl: wrapTpl,
    list: list
  };
  _render(_opt);
  tap.on(domContent);
  $(domContent).on('tap', '.tap', locationToContent);

  // 渲染APP应用
  var domApp = document.createElement('ul');
  domApp.className = "applist";
  var optApp = {
    contain: domApp,
    tpl: appTpl,
    list: list[0].listApp
  };
  _render(optApp);
  tap.on(domApp);
  $(domApp).on('tap', '.tap,.J_install', locationToApp);
  device.checkAppsStatus(domApp, optApp.list);
  domContent.appendChild(domApp);

  domRoot.appendChild(domContent);
}

// 标题、文章跳转统一处理逻辑
function locationToContent(e) {
  var dataset = this.dataset;
  var reqQuery = createReqQuery({
    elem: this,
    posPrefix: posPrefix,
    newRef: true
  });
  var detailOpt = $.extend(reqQuery, {
    url: query.add(dataset.link, reqQuery.extra_params),
    title: dataset.linkTitle,
    launchMode: loadDetailMethod
  });
  console.log(detailOpt);
  market.loadPage(JSON.stringify(detailOpt));
}


// 相关应用处理逻辑
function locationToApp(e) {
  var dataset = this.dataset;
  var pName = dataset.pname;
  var appId = dataset.appid;
  var reqQuery = createReqQuery({
    elem: this,
    posPrefix: posPrefix,
    newRef: true
  });

  if (this.tagName.toLowerCase() === 'button') {
    if (this.disabled) return;
    if (dataset.installed !== 'true') {
      var installOpt = $.extend(reqQuery, {
        pName: pName,
        appId: appId
      });
      device.install(installOpt);
    } else {
      market.openApp(JSON.stringify({
        pName: pName
      }));
    }
  } else {

    reqQuery.extra_params.refs = ajaxData.refs + '-detail/' + appId;
    var detailOpt = $.extend(reqQuery, {
      url: 'mimarket://details?appId=' + appId,
      title: dataset.linkTitle,
      launchMode: loadDetailMethod
    })
    market.loadPage(JSON.stringify(detailOpt));
  }
  e.stopPropagation();
}

exports.render = render;
 
});
;define('assets/js/module/replacer.js', function(require, exports, module){ /**
 * 简单的模板引擎，会把{{}}里面的内容替换，返替换的回字符串
 ** @param {String} contain dom容器
 ** @param {Array} obj render的对象
 */
var replacer = function(tpl, obj) {
  var str = tpl.replace(/{{([^{}]+)}}/g, function(s0, s1) {
    // 如是是0，会转换为空
    var val = obj[s1];
    if(val !== undefined) {
      val = val.toString();
    } else {
      val = '';
    }
    return val;
  });
  return str;
};

return replacer; 
});
;define('components/rec-apps/rec-apps.js', function(require, exports, module){ /**
 * 推荐多个应用组件
 * @require "assets/css/list.css"
 * @param {Dom} contain  dom钩子:
 **** @param {Array} list 数组
 */
var query = require('assets/js/module/query.js');
var tpl = "<li>\r\n  <div class=\"rec-apps-info\">\r\n    <div class=\"tap J_exposure\" data-index=\"{{$index}}\" data-expid=\"{{experimentalId}}\" data-pname=\"{{packageName}}\" data-link-title=\"{{displayName}}\"  data-digest=\"{{digest}}\" data-ad=\"{{ads}}\" data-position=\"{{position}}\" data-appid=\"{{id}}\" data-rid=\"{{rid}}\">\r\n      <div class=\"icon-placeholder\"><img class=\"J_lazyload lazyload\" data-src=\"{{icon}}\" width=\"60\" height=\"60\"></div>\r\n      <h3 class=\"ellipsis\">{{displayName}}</h3>\r\n      <div class=\"icon-star icon-star{{ratingScore}}\">\r\n        <div class=\"icon-star icon-star-light\"></div>\r\n      </div>\r\n    </div>\r\n    <div class=\"J_btnInstall install-btn\" data-pname=\"{{packageName}}\">\r\n  <button type=\"button\" data-pname=\"{{packageName}}\" class=\"touch J_install\" data-appid=\"{{id}}\" data-installed=\"\" data-index=\"{{$index}}\" data-expid=\"{{experimentalId}}\" data-digest=\"{{digest}}\" data-ad=\"{{ads}}\" data-position=\"{{position}}\" data-link-title=\"{{displayName}}\" data-outertraceid=\"{{outerTraceId}}\"></button>\r\n  <div class=\"install-btn-display\">\r\n    <span class=\"J_appProgress install-progress\"></span>\r\n    <span class=\"J_appStatusProgress\">{{status}}</span>\r\n  </div>\r\n</div>\r\n  </div>\r\n</li>";
var wrapTpl = "<div class=\"J_recApps rec-apps card-both\" data-ref=\"ref\">\r\n  <h3 class=\"rec-apps-header tap cf\" data-link=\"{{link}}\" data-link-title=\"{{linkTitle}}\" data-index=\"{{index}}\">\r\n  \t<div class=\"rec-apps-title card-font-left fl\">{{title}}</div>\r\n    <div class=\"rec-apps-more fr\">\r\n      <span class=\"card-font-right\">{{more}}</span><span class=\"icon-arrow\"></span>\r\n    </div>\r\n  </h3>\r\n</div>\r\n";
var wrapTitleTpl = "<div class=\"J_recApps rec-apps card-both\" data-ref=\"{{ref}}\">\r\n  <h3 class=\"rec-apps-header\">\r\n    <div class=\"rec-apps-title card-font-left\">{{title}}</div>\r\n  </h3>\r\n</div>\r\n";
var _render = require('assets/js/module/render.js');
var replacer = require('assets/js/module/replacer.js');
var tap = require('assets/js/module/tap.js');
var device = require('assets/js/device.js');
var createReqQuery = require('assets/js/createReqQuery.js');
var posPrefix = "recApps";
// diff标志位
var isRecAppsUpdate = false;

var render = function(opt, msg) {
  var contain = opt.contain;
  var listApp = msg.listApp;
  var _opt = {
    tpl: tpl,
    list: listApp
  }
  if (opt.diff && !isRecAppsUpdate) {
    var newContain = renderDom(_opt, msg);
    var oldContain = contain.querySelector('.rec-apps');
    var $newContain = $(newContain);
    var $oldContain = $(oldContain);
    var $newTitle = $newContain.find('h3');
    var $oldTitle = $oldContain.find('h3');
    if ($newTitle.outerHTML !== $oldTitle.outerHTML) {
      $oldTitle.replaceWith($newTitle);
    }
    var $newElems = $newContain.find('li');
    var $oldElems = $oldContain.find('li');
    $newElems.each(function(i, elem) {
      var $elem = $(elem);
      var newPname = $elem.find('.touch').data('pname');
      var $oldElem = $oldElems.eq(i);

      if ($oldElem.length !== 0) {
        if (newPname !== $oldElem.find('.touch').data('pname')) {
          $oldElem.replaceWith($elem);
        }
      } else {
        $oldContain.append($newContain.find('li').slice(i));
        return false;
      }
      newContain = null;
    });
    isRecAppsUpdate = true;
  } else {
    var domWrap = renderDom(_opt, msg);
    tap.on(domWrap);
    $(domWrap).on('tap', '.tap,.J_install', locationToApp);
    contain.appendChild(domWrap);
  }

  device.checkAppsStatus(contain, listApp);
}

function renderDom(opt, msg) {
  msg.more = local[lang].more;
  console.log("msg.link", msg);
  if (msg.link) {
    var $wrap = $(replacer(wrapTpl, msg));
  } else {
    var $wrap = $(replacer(wrapTitleTpl, msg));
  }
  var domList = opt.contain = document.createElement('ul');
  _render(opt);
  $wrap.append(domList);

  return $wrap[0];
}

function locationToApp(e) {
  var dataset = this.dataset;
  var pName = dataset.pname;
  var appId = dataset.appid;
  var tagName = this.tagName.toLowerCase();
  var customRef = $(this).closest('.J_recApps').data('ref');
  var reqQuery = createReqQuery({
    elem: this,
    posPrefix: posPrefix,
    newRef: true,
    customRef: customRef
  });

  if (tagName === 'button') {
    var disabled = this.disabled;
    console.log(this);
    if (disabled) return;
    if (dataset.installed !== 'true') {
      var installOpt = $.extend(reqQuery, {
        pName: pName,
        appId: appId
      });
      device.install(installOpt);
    } else {
      market.openApp(JSON.stringify({
        pName: pName
      }));
    }
    e.stopPropagation();
  } else if (tagName === 'h3') {
    var detailOpt = $.extend(reqQuery, {
      url: query.add(dataset.link, reqQuery.extra_params)
    });
    market.loadPage(JSON.stringify(detailOpt));
  } else {

    // 增加detail区分
    reqQuery.extra_params.refs = ajaxData.refs + '-detail/' + appId;
    var detailOpt = $.extend(reqQuery, {
      url: 'mimarket://details?appId=' + appId,
      title: dataset.linkTitle,
      launchMode: loadDetailMethod
    });
    market.loadPage(JSON.stringify(detailOpt));
  }
  e.stopPropagation();
}

exports.render = render;
 
});
;define('components/rec-app/rec-app.js', function(require, exports, module){ /**
 * 单个应用组件推荐
 * @require components/install-btn/install-btn.css
 * @param {Dom} contain  dom钩子:
 **** @param {Array} list 数组
 */

var query = require('assets/js/module/query.js');
var tpl = "\r\n<div class=\"rec-app-banner J_exposure\" style=\"background-image:url({{bannerUrl}});\" data-pname=\"{{packageName}}\" data-appid=\"{{id}}\" data-index=\"{{$index}}\" data-expid=\"{{experimentalId}}\" data-digest=\"{{digest}}\" data-ad=\"{{ads}}\" data-position=\"{{position}}\" data-link-title=\"{{displayName}}\" data-appid=\"{{id}}\" data-rid=\"{{rid}}\">\r\n  <div class=\"J_btnInstall install-btn\" data-pname=\"{{packageName}}\">\r\n  <button type=\"button\" data-pname=\"{{packageName}}\" class=\"touch J_install\" data-appid=\"{{id}}\" data-installed=\"\" data-index=\"{{$index}}\" data-expid=\"{{experimentalId}}\" data-digest=\"{{digest}}\" data-ad=\"{{ads}}\" data-position=\"{{position}}\" data-link-title=\"{{displayName}}\" data-outertraceid=\"{{outerTraceId}}\"></button>\r\n  <div class=\"install-btn-display\">\r\n    <span class=\"J_appProgress install-progress\"></span>\r\n    <span class=\"J_appStatusProgress\">{{status}}</span>\r\n  </div>\r\n</div>\r\n</div>\r\n";
var _render = require('assets/js/module/render.js');
var tap = require('assets/js/module/tap.js');
var device = require('assets/js/device.js');
var createReqQuery = require('assets/js/createReqQuery.js');
var posPrefix = "recApp";

var render = function(opt, msg) {
  var contain = opt.contain;
  var domRec = document.createElement('div');
  domRec.className = 'rec-app card-both';

  _render({
    contain: domRec,
    tpl: tpl,
    list: [msg]
  });

  tap.on(domRec);
  domRec.addEventListener('tap', locationToApp);

  contain.appendChild(domRec);
  device.checkAppsStatus(domRec, [msg]);
}

function locationToApp(e) {
  var target = e.target;
  var tagName = target.tagName.toLowerCase();
  var dataset = target.dataset;
  var appId = dataset.appid;

  var reqQuery = createReqQuery({
    elem: target,
    posPrefix: posPrefix,
    newRef: true
  });

  var pName = dataset.pname;
  if (tagName === 'button') {
    var disabled = target.disabled;
    if (disabled || !pName) {
      return;
    }
    var installed = dataset.installed;
    if (installed !== 'true') {
      var installOpt = $.extend(reqQuery, {
        pName: pName,
        appId: appId
      });
      device.install(installOpt);
    } else {
      market.openApp(JSON.stringify({
        pName: pName
      }));
    }
    e.stopPropagation();
  } else {
    // 增加detail区分
    reqQuery.extra_params.refs = ajaxData.refs + '-detail/' + appId;
    var detailOpt = $.extend(reqQuery, {
      url: 'mimarket://details?appId=' + appId,
      launchMode: loadDetailMethod
    });
    market.loadPage(JSON.stringify(detailOpt));
  }
}

exports.render = render;
 
});
;define('components/rec-ad/rec-ad.js', function(require, exports, module){ /**
 * @param {dom} contain 容器
 * @param {string} tpl 模板
 * @param {Array} list 数据
 * @param {Number} buffer 延迟dom的高度，不传不开启延迟dom
 */

var device = require('assets/js/device.js');
var tpl = "\r\n<li>\r\n  <div class=\"tap J_exposure\" data-index=\"{{$index}}\" data-expid=\"{{experimentalId}}\" data-pname=\"{{packageName}}\" data-link-title=\"{{displayName}}\" data-appid=\"{{id}}\" data-digest=\"{{digest}}\" data-ad=\"{{ads}}\" data-position=\"{{position}}\" data-rid=\"{{rid}}\">\r\n    <div id=\"{{id}}\" class=\"applist-wrap\">\r\n      <div class=\"applist-rank\"><span class=\"ad-rank\">AD</span></div><div class=\"applist-img\"><img class=\"J_lazyload lazyload\" data-src=\"{{icon}}\" width=\"52\" height=\"52\"></div><div class=\"applist-wrap-des\">\r\n        <h3 class=\"ellipsis\">{{displayName}}</h3>\r\n        <div class=\"applist-wrap-flex-item\">\r\n          <div class=\"icon-star icon-star{{ratingScore}}\">\r\n            <div class=\"icon-star icon-star-light\"></div>\r\n          </div>\r\n        </div>\r\n        <p class=\"applist-info-bottom\">\r\n          <span class=\"ellipsis\">{{level1CategoryName}}</span>\r\n          <span>{{apkSize}} M</span>\r\n        </p>\r\n      </div>\r\n      <div class=\"J_btnInstall install-btn\" data-pname=\"{{packageName}}\">\r\n  <button type=\"button\" data-pname=\"{{packageName}}\" class=\"touch J_install\" data-appid=\"{{id}}\" data-installed=\"\" data-index=\"{{$index}}\" data-expid=\"{{experimentalId}}\" data-digest=\"{{digest}}\" data-ad=\"{{ads}}\" data-position=\"{{position}}\" data-link-title=\"{{displayName}}\" data-outertraceid=\"{{outerTraceId}}\"></button>\r\n  <div class=\"install-btn-display\">\r\n    <span class=\"J_appProgress install-progress\"></span>\r\n    <span class=\"J_appStatusProgress\">{{status}}</span>\r\n  </div>\r\n</div>\r\n    </div>\r\n  </div>\r\n</li>\r\n"
var _render = require('assets/js/module/render.js');
var lazyload = require('assets/js/module/lazyLoad.js');
var domLazy = require('assets/js/module/domLazy.js').domLazy;
var tap = require('assets/js/module/tap.js');
var createReqQuery = require('assets/js/createReqQuery.js');

device.registerAppStatus();

var render = function(opt, msg, type) {
  var contain = opt.contain;
  var domUl = document.createElement('ul');
  domUl.className = 'applist';
  _render({
    contain: domUl,
    tpl: tpl,
    list: msg.listApp
  });
  tap.on(domUl);
  $(domUl).on('tap', '.tap,.J_install', (function(type) {
    var posPrefix = type;
    return function(e) {
      var dataset = this.dataset;
      var pName = dataset.pname;
      var appId = dataset.appid;
      var reqQuery = createReqQuery({
        elem: this,
        posPrefix: posPrefix,
        newRef: true
      });

      if (this.tagName.toLowerCase() === 'button') {
        var disabled = this.disabled;
        if (this.disabled) return;
        if (dataset.installed !== 'true') {
          var installOpt = $.extend(reqQuery, {
            pName: pName,
            appId: appId
          });
          device.install(installOpt);
        } else {
          market.openApp(JSON.stringify({
            pName: pName
          }));
        }
        e.stopPropagation();
      } else {
        // 增加detail区分
        reqQuery.extra_params.refs = ajaxData.refs + '-detail/' + appId;
        var detailOpt = $.extend(reqQuery, {
          url: 'mimarket://details?appId=' + appId,
          launchMode: loadDetailMethod
        })
        market.loadPage(JSON.stringify(detailOpt));
      }
    }
  })(type));
  contain.appendChild(domUl);
  device.checkAppsStatus(contain, msg.listApp);
}

exports.render = render;
 
});
;define('components/hot-words/hot-words.js', function(require, exports, module){ /**
 * 热词组件
 * @param {Dom} contain  dom钩子:
 **** @param {Array} list 数组
 */

var tpl = "<li class=\"{{color}} J_exposure\" data-action=\"{{action}}\" data-link=\"{{key}}\" data-rid=\"{{rid}}\">{{key}}</li>";
var _render = require('assets/js/module/render.js');
var cListPanel = require('components/list-panel/list-panel.js');
var HOT_SUGGESTION_ACTION = 'hotSuggestion';

var _local = {
  zh: {
    searchHotWord: '搜索热词'
  },
  en: {
    searchHotWord: 'Popular'
  }
};
_local = _local[lang];

/*
 * 热词推荐
 */
var hotWordsPanel = cListPanel.createPanel(_local.searchHotWord);

var render = function(contain, msg) {
  var hotWords = msg.suggestion.map(function(elem, i) {
    var num = Math.floor(10 * Math.random() / 2);
    console.log(num);
    switch (num) {
      case 0:
        color = 'hotword-orange';
        break;
      case 1:
        color = 'hotword-green';
        break;
      case 2:
        color = 'hotword-gray';
        break;
      case 3:
        color = 'hotword-blue';
        break;
      case 4:
        color = 'hotword-red';
        break;
      default:
        color = 'hotword-red';
        break;
    }
    return {
      key: elem,
      color: color,
      action: HOT_SUGGESTION_ACTION
    }
  });
  _render({
    contain: hotWordsPanel.content,
    tpl: "<li class=\"{{color}} J_exposure\" data-action=\"{{action}}\" data-link=\"{{key}}\" data-rid=\"{{rid}}\">{{key}}</li>",
    list: hotWords
  });
  hotWordsPanel.content.classList.add('hot-words');
  contain.appendChild(hotWordsPanel.contain);
}

exports.render = render;
 
});
;define('components/card-applist/card-applist.js', function(require, exports, module){ /**
 * 卡片式applist,带title
 */
/**
 * @require components/app-list/app-list.css
 */
var device = require('assets/js/device.js');
var createReqQuery = require('assets/js/createReqQuery.js');
var tplWithBrief = "<li>\r\n  <div class=\"applist-item\">\r\n    <div class=\"tap J_exposure\" data-index=\"{{$index}}\" data-expid=\"{{experimentalId}}\" data-pname=\"{{packageName}}\" data-link-title=\"{{displayName}}\"  data-digest=\"{{digest}}\" data-ad=\"{{ads}}\" data-position=\"{{position}}\" data-appid=\"{{id}}\" data-rid=\"{{rid}}\" data-outertraceid=\"{{outerTraceId}}\">\r\n      <div class=\"applist-wrap c{{id}}\">\r\n        <div class=\"applist-rank\">{{$rankIndex}}</div>\r\n        <div class=\"applist-img\"><img class=\"J_lazyload lazyload\" data-src=\"{{icon}}\" width=\"52\" height=\"52\"></div><div class=\"applist-wrap-des\">\r\n          <h3 class=\"ellipsis\">{{displayName}}</h3>\r\n          <div class=\"applist-wrap-flex-item\">\r\n            <div class=\"applist-info\">\r\n              <div class=\"icon-star icon-star{{ratingScore}}\">\r\n                <div class=\"icon-star icon-star-light\"></div>\r\n              </div>\r\n              <span class=\"ellipsis\">{{level1CategoryName}}</span>\r\n              <span class=\"applit-delimit\">|</span>\r\n              <span>{{apkSize}} M</span>\r\n              {{ad-flag}}\r\n            </div>\r\n          </div>\r\n          <p class=\"applist-brief ellipsis\">{{briefShow}}</p>\r\n        </div>\r\n      </div>\r\n    </div>\r\n    <div class=\"J_btnInstall install-btn\" data-pname=\"{{packageName}}\">\r\n  <button type=\"button\" data-pname=\"{{packageName}}\" class=\"touch J_install\" data-appid=\"{{id}}\" data-installed=\"\" data-index=\"{{$index}}\" data-expid=\"{{experimentalId}}\" data-digest=\"{{digest}}\" data-ad=\"{{ads}}\" data-position=\"{{position}}\" data-link-title=\"{{displayName}}\" data-outertraceid=\"{{outerTraceId}}\"></button>\r\n  <div class=\"install-btn-display\">\r\n    <span class=\"J_appProgress install-progress\"></span>\r\n    <span class=\"J_appStatusProgress\">{{status}}</span>\r\n  </div>\r\n</div>\r\n  </div>\r\n</li>\r\n\r\n";
var _render = require('assets/js/module/render.js');
var tap = require('assets/js/module/tap.js');
var cListPanel = require('components/list-panel/list-panel.js');

device.registerAppStatus();
var posPrefix = 'recZone';

var render = function(opt, list, title) {
  var hotWordsPanel = cListPanel.createPanel(title);
  var domUl = hotWordsPanel.content;
  domUl.className = 'applist';
  _render({
    contain: domUl,
    tpl: tplWithBrief,
    list: list
  });
  opt.contain.appendChild(hotWordsPanel.contain);

  tap.on(domUl);
  $(domUl).on('tap', '.tap,.J_install', handTap);

  device.checkAppsStatus(domUl, list);
}

function handTap(e) {
  var dataset = this.dataset;
  var pName = dataset.pname;
  var reqQuery = createReqQuery({
    elem: this,
    posPrefix: posPrefix,
    newRef: true
  });

  if (this.tagName.toLowerCase() === 'button') {
    if (this.disabled) return;
    if (dataset.installed !== 'true') {
      var installOpt = $.extend(reqQuery, {
        pName: pName,
        appId: dataset.appid
      });
      device.install(installOpt);
    } else {
      market.openApp(JSON.stringify({
        pName: pName
      }));
    }
  } else {
    reqQuery.extra_params.refs = ajaxData.refs + '-detail/' + pName;
    var detailOpt = $.extend(reqQuery, {
      url: 'mimarket://details?appId=' + dataset.appid,
      title: dataset.linkTitle,
      launchMode: loadDetailMethod
    })
    market.loadPage(JSON.stringify(detailOpt));
  }
  e.stopPropagation();
}

exports.render = render;
 
});
;define('components/nav/nav.js', function(require, exports, module){ var tpl = "<div class=\"J_navItem J_exposure nav-item\" data-link-title=\"{{linkTitle}}\" data-link=\"{{url}}\" data-external=\"{{external}}\" data-index=\"{{$index}}\" style=\"background-color: {{color}}\" data-rid=\"{{rid}}\">\r\n  <img src=\"{{icon}}\" width=\"23\" height=\"23\"><span>{{title}}</span>\r\n</div>";

var _render = require('assets/js/module/render.js');
var query = require('assets/js/module/query.js');
var createReqQuery = require('assets/js/createReqQuery.js');
var posPrefix = 'nav';

var render = function(opt, msg) {
  var contain = opt.contain;
  var domNav = document.createElement('div');
  domNav.className = 'nav';
  _render({
    contain: domNav,
    list: msg.menu,
    tpl: tpl
  });
  contain.appendChild(domNav);
  $(contain).on('click', '.J_navItem', handTap)
}

function handTap(e) {
  var dataset = this.dataset;
  var reqQuery = createReqQuery({
    elem: this,
    posPrefix: posPrefix,
    newRef: true
  });
  var url = query.add(dataset.link, reqQuery.extra_params);
  var detailOpt = $.extend(reqQuery, {
    url: url,
    external: dataset.external || false
  });
  market.loadPage(JSON.stringify(detailOpt));
}

exports.render = render;
 
});
;define('assets/js/module/carousel-loop.js', function(require, exports, module){ /** 
 * @name carouse-loop.js
 * @required zepto.js
 * @description 只接受固定宽度的slide
 * @param {String} slide 滚动的slide
 * @param {String} controlContain 切换按钮
 * @param {String} slideContain 父容器
 * @param {Int} num 目前的slide序号
 */
var CarouselLoop = function(opt) {
  var me = this;
  // slide选择器
  me.slide;
  // 控制器
  me.$controlItems;
  // 轮播
  me.$slides;
  // 轮播坐标轴
  me.direction;
  // 轮播方向
  me.orientation;
  // 轮播动画时间
  me.speed;
  // 当前slide
  me.curSlide;
  // 前一个slide
  me.prevSlide;
  // 下一个slide
  me.nextSlide;
  // slide对象宽度
  me.slideWidth;
  // slide对象高度
  me.slideHeight;
  // 正坐标轴位移距离（right\down）
  me.positiveDistance;
  // 负坐标轴位移距离（left\top）
  me.negtiveDistance;
  // 水平touchMove距离
  me.detalX;
  // 竖直touchMove距离
  me.detalY;
  // slides个数
  me.slidesCount;
  // 最后一个slide对象坐标
  me.lastIndex;
  // 是否初始化自动轮播
  me.initAuto;
  // 自动轮播定时器
  me.timer;
  // 自动轮播方向
  me.autoOrientation;
  // 自动轮播delay时间
  me.autoDelayTime;
  // slide对象是否是img
  me.slideIsImg;
  // img缓存
  me.imgCache;
  // 已加载img数
  me.loadImgCount;

  setTimeout(function() {
    me.init(opt);
  }, 0);
};

CarouselLoop.prototype.init = function(opt) {
  opt = $.extend({
    slide: '.J_slide',
    controlContain: '.J_carouselControl',
    slideContain: '.J_carouselCon'
  }, opt);
  var me = this;
  me.slide = opt.slide;
  var contain = opt.contain || document;
  var direction = opt.direction;
  var usePagination = opt.usePagination;
  var autoOrientation = opt.autoOrientation;
  var speed = opt.speed;
  // 轮播方向（默认水平方向）
  me.direction = direction = direction ? direction : 'horizontal';
  // 是否需要翻页提示 （默认false）
  me.usePagination = usePagination = usePagination ? usePagination : false;
  // 轮播时间（默认200ms）
  me.speed = speed ? speed : 200;
  // 自动轮播方向
  autoOrientation = me.autoOrientation = autoOrientation ? autoOrientation : 'left';
  // slide对象是否是img
  var slideIsImg = me.slideIsImg = opt.slideIsImg;
  // 轮播slideContain容器
  var $slideContain = me.$slideContain = $(contain).find(opt.slideContain);
  // 轮播对象
  var $slides = me.$slides = $slideContain.find(opt.slide);
  console.log('$slides', $slides);
  // slide总数
  var slidesCount = me.slidesCount = $slides.length;
  // slide列表最后一个坐标
  var lastIndex = me.lastIndex = slidesCount - 1;
  var imgCache = me.imgCache = [];
  me.initAuto = false;
  me.loadImgCount = 0;

  // 轮播对象不足2个，不启动轮播
  if (slidesCount < 2) { return; }

  // 设定slide滑动距离，坐标轴正向为正
  var positiveDistance;
  var negtiveDistance;
  if (direction === 'horizontal') {
    var slideWidth = me.slideWidth = $slides.eq(0).width();
    positiveDistance = me.positiveDistance = slideWidth;
    negtiveDistance = me.negtiveDistance = 0 - slideWidth;
  } else {
    var slideHeight = me.slideHeight = $slides.eq(0).height();
    positiveDistance = me.positiveDistance = slideHeight;
    negtiveDistance = me.negtiveDistance = 0 - slideHeight;    
  }

  // 缓存slide中img的信息, 并加载img
  if (slideIsImg) {
    var $img;
    var uid;
    $slides.each(function(i, item) {
      $img = $(item).find('img');
      uid = $img.data('uid');
      imgCache[uid] = {
        $img: $img,
        isLoad: false,
        isLoading: false        
      };
    });
    me.loadImg();
  }

  // 初始化slide项,slides数小于3个特殊处理(前后都是同一对象)
  me.curSlide = 0;
  if (slidesCount > 2) {
    me.prevSlide = lastIndex;
    me.nextSlide = 1;
  } else {
    me.prevSlide = 1;
    me.nextSlide = 1;
  }

  // 生成控制器
  if (usePagination) {
    var $controlContain = $(contain).find(opt.controlContain);
    var controlItems = '';
    $slides.each(function(i, elem) {
      controlItems += '<span class="J_carouselIndex" data-index="' + i + '"></span>';
    });
    var $controlItems = me.$controlItems = $(controlItems);
    // 考虑diff替换
    $controlContain.html(me.$controlItems);
    $controlItems.eq(me.curSlide).addClass('selected');
  }

  // 初始化轮播列表
  var cssClass;
  $slides.each(function(i, elem) {
    if (i === me.prevSlide) {
      // 只有两个且自动轮播方向左或上的时候，prevSlide置于坐标轴正侧
      if (slidesCount === 2 && (autoOrientation === 'left' || autoOrientation === 'up')) {
        cssClass = me.createCss(direction, positiveDistance, false);
      } else {
        cssClass = me.createCss(direction, negtiveDistance, false);
      }
    } else if (i === me.curSlide) {
      cssClass = me.createCss(direction, 0, false);
    } else {
      cssClass = me.createCss(direction, positiveDistance, false);
    }

    $(elem).css(cssClass);
  });

  // 若没有禁止touch，初始化touch事件 
  if (!opt.forbidTouch) {
    me.initTouch();
  }
}

// 遍历所有img，并加载
CarouselLoop.prototype.loadImg = function() {
  var me = this;
  var imgCache = me.imgCache;
  var $slides = me.$slides;
  var slidesCount = me.slidesCount;
  for(var key in imgCache) {
    me.load(imgCache[key]);
  }
};
CarouselLoop.prototype.load = function(imgCache) {
  var me = this;
  var $img = imgCache.$img;
  if (!imgCache.isLoad && !imgCache.isLoading) {
    var handler = function(img, imgCache) {
      return function(e) {
        me.loadImgCount++;
        $img.attr('src', e.currentTarget.src);
        $img.removeClass('carousel-loop');
        imgCache.isLoad = true;
        imgCache.isLoading = false;
        imgCache = $img = null;
      }
    }($img, imgCache);
    var handlerErr = function(imgCache) {
      return function() {
        console.log('error', imgCache);
        imgCache.isLoading = false;
        imgCache = null;
      }
    }(imgCache);
    imgCache.isLoading = true;
    var _img = new Image();
    _img.src = $img.data('src');
    _img.onload = handler;
    _img.onerror = handlerErr;      
  };
}

// 初始化touch事件
CarouselLoop.prototype.initTouch = function() {
  var me = this;
  // 点击时候的X坐标
  var touchStartPageX;
  // 点击时候的Y坐标
  var touchStartPageY;
  // 当前触控事件X坐标位移距离
  var detalX;
  // 当前触控事件Y坐标位移距离
  var detalY;

  // 判断用户手势行为
  var startTime;
  var isHorizontal;
  var isJudged; // 每次touch只需判断一次用户滑动意向
  var started = false; // touch事件调用标识，防止多指误操作

  // 缓存滑动时前后关联对象
  var staticSlide;
  var staticSlideDistance;
  var moveSlide;
  var moveSlideDistance;

  var $slideContain = me.$slideContain;
  var positiveDistance = me.positiveDistance;
  var negtiveDistance = me.negtiveDistance;
  var orientation;
  $slideContain.off();

  $slideContain.on('touchstart', function(e) {
    if (started) {
      return;
    }
    // 禁止native滚动影响该区域
    market.interceptSlideEvent();
    console.log("touchstart")
    me.stopCarousel();
    started = true;
    isHorizontal = false;
    isJudged = true;
    startTime = Date.now();
    var touches = e.touches[0];
    touchStartPageX = touches.pageX;
    touchStartPageY = touches.pageY;
  });

  $slideContain.on('touchmove', function(e) {
    if (!started) {
      return;
    }

    // 队列有可能被修改，$slides实时读取
    var $slides = me.$slides;
    var slidesCount = me.slidesCount;

    // 前5毫秒，先判断用户是否垂直滚动
    if (isJudged && Date.now() - startTime > 5) {
      isJudged = false;
      var touches = e.touches[0];
      detalX = touches.pageX - touchStartPageX;
      detalY = touches.pageY - touchStartPageY;
      if (Math.abs(detalX) > Math.abs(detalY)) {
        isHorizontal = true;
      } else {
        isHorizontal = false;
      }
      console.log("isHorizontal", isHorizontal);
    }

    if (isHorizontal) {
      e.preventDefault();
      me.detalX = detalX = e.touches[0].pageX - touchStartPageX;
      if (detalX > 0) {
        orientation = me.orientation = 'right';
      } else {
        orientation = me.orientation = 'left';
      }
    } else {
      me.detalY = detalY = e.touches[0].pageY - touchStartPageY;
      if (detalY > 0) {
        orientation = me.orientation = 'down';
      } else {
        orientation = me.orientation = 'up';
      }
    }

    if (orientation === 'right' || orientation === 'down') {
      if(slidesCount > 2) {
        staticSlide = me.nextSlide;
      } else {
        staticSlide = '';
      }
      moveSlide = me.prevSlide;
      staticSlideDistance = positiveDistance;
      moveSlideDistance = detalX + negtiveDistance;      
    } else {
      if(slidesCount > 2) {
        staticSlide = me.prevSlide;
      } else {
        staticSlide = '';
      }
      moveSlide = me.nextSlide;
      staticSlideDistance = negtiveDistance;
      moveSlideDistance = detalX + positiveDistance;      
    }

    // 目前只有水平方向支持跟手动画
    if (isHorizontal) {
      // 只保证目标对象及前后三个对象滑动
      $slides.each(function(i, elem) {
        if (i === staticSlide) {
          $(elem).css({
            "-webkit-transform": 'translate3d(' + staticSlideDistance + 'px, 0px, 0px)',
            "-webkit-transition": 'none'
          });            
        } else if (i === me.curSlide) {
          console.log(elem)
          $(elem).css({
            "-webkit-transform": 'translate3d(' + detalX + 'px, 0px, 0px)',
            "-webkit-transition": 'none'  
          }); 
        } else if (i === moveSlide) {
          $(elem).css({
            "-webkit-transform": 'translate3d(' + moveSlideDistance + 'px, 0px, 0px)',
            "-webkit-transition": 'none'
          });            
        }
      });      
    }
  });

  $slideContain.on('touchend touchcancel', function(e) {
    started = false;
    if (isHorizontal) {
      if (me.slidesCount > 2) {
        me.setSlideParam(orientation);
      } else {
        me.setSlideParamFor2(orientation);
      }
    }
    // 本次动画执行后，再重启自动轮播
    setTimeout(function(){
      me.initAuto && me.autoCarousel(me.autoOrientation, me.autoDelayTime);
    }, me.speed);
  });
}

/*设置滑动前后关系*/
CarouselLoop.prototype.setSlideParam = function(orientation) {
  var me = this;
  var oldPrevSlide = me.prevSlide;
  var oldCurSlide = me.curSlide;
  var oldNextSlide = me.nextSlide;
  var lastIndex = me.lastIndex;
  if (orientation === 'right' || orientation === 'down') {
    // 若到达起点，进行循环
    if (oldPrevSlide === 0) {
      me.prevSlide = lastIndex;
    } else {
      me.prevSlide = oldPrevSlide - 1;
    }
    me.curSlide = oldPrevSlide;
    me.nextSlide = oldCurSlide;
  } else {
    me.prevSlide = oldCurSlide;
    me.curSlide = oldNextSlide;
    // 若到达终点，进行循环
    if (oldNextSlide === lastIndex) {
      me.nextSlide = 0;
    } else {
      me.nextSlide = oldNextSlide + 1;
    }
  }
  me.goto(orientation);
};

/*设置只有两个对象的滑动前后关系*/
CarouselLoop.prototype.setSlideParamFor2 = function(orientation) {
  var me = this;
  var oldPrevSlide = me.prevSlide;
  var oldCurSlide = me.curSlide;
  var autoOrientation = me.autoOrientation;
  // 只有两个轮播对象时，前后任一即可
  me.curSlide = oldPrevSlide;
  me.nextSlide = me.prevSlide = oldCurSlide;

  me.goto(orientation);
};

CarouselLoop.prototype.goto = function(orientation) {
  var me = this;
  var prevSlide = me.prevSlide;
  var curSlide = me.curSlide;
  var nextSlide = me.nextSlide;
  if (orientation === 'right' || orientation === 'down') {
    me.doSlide(curSlide, nextSlide, prevSlide, me.positiveDistance, me.negtiveDistance);
  } else {
    me.doSlide(curSlide, prevSlide, nextSlide, me.negtiveDistance, me.positiveDistance);
  }
  if (me.usePagination) {
    me.$controlItems.removeClass('selected').eq(curSlide).addClass('selected');
  }
}

// 执行轮播动画
CarouselLoop.prototype.doSlide = function(targetDom, followDom, laterDom, followTranslate, laterTranslate) {
  var me = this;
  var direction = me.direction;
  var speed = me.speed;
  var autoOrientation = me.autoOrientation;
  var $slides = me.$slides;
  $slides.each(function(i, elem) {
    $(elem).off('webkitTransitionEnd transitionEnd');
  });
  $slides.eq(targetDom).css(me.createCss(direction, 0, true, speed));
  $slides.eq(followDom).css(me.createCss(direction, followTranslate, true, speed));
  $slides.eq(targetDom).on('webkitTransitionEnd transitionEnd', function() {
    $slides.eq(laterDom).css(me.createCss(direction, laterTranslate, false, speed));
    // 只有两个轮播对象，轮播后重置位置（为确保自动轮播正常）
    if (me.slidesCount === 2) {
      if (autoOrientation === 'right' || autoOrientation === 'down') {
        $slides.eq(me.prevSlide).css(me.createCss(me.direction, me.negtiveDistance, false));
      } else {
        $slides.eq(me.prevSlide).css(me.createCss(me.direction, me.positiveDistance, false));
      }      
    }
  });

  // 判断是否还需要加载图片
  if (me.slideIsImg && (me.loadImgCount < me.slidesCount)) {
    me.loadImg();
  }
}
// 生成slide所需css
CarouselLoop.prototype.createCss = function(direction, distance, needTransition, speed) {
  var slideCss;
  var transformCss;
  var transitionCss;
  if (direction === 'horizontal') {
    transformCss = {
      '-webkit-transform': 'translate3d(' + distance + 'px, 0px, 0px)',
      'transform': 'translate3d(' + distance + 'px, 0px, 0px)',
    };
  } else {
    transformCss = {
      '-webkit-transform': 'translate3d(0px, ' + distance + 'px, 0px)',
      'transform': 'translate3d(0px, ' + distance + 'px, 0px)',
    };    
  }
  if (needTransition) {
    transitionCss = {
      '-webkit-transition': '-webkit-transform ' + speed + 'ms ease-out',
      'transition': '-webkit-transform ' + speed + 'ms ease-out'
    }; 
  } else {
    transitionCss = {
      '-webkit-transition': 'none',
      'transition': 'none'
    };
  }
  slideCss = $.extend(transformCss, transitionCss);

  return slideCss;
}

// 启动自动轮播
CarouselLoop.prototype.autoCarousel = function(orientation, time) {
  var me = this;
  if (me.timer) { return; }
  if (!me.initAuto) {
    me.initAuto = true;
    me.autoOrientation = orientation;
    me.autoDelayTime = time;
  };
  me.timer = setInterval(function() {
    if (me.slidesCount > 2) {
      me.setSlideParam(orientation);
    } else {
      me.setSlideParamFor2(orientation);
    }
  }, time);
}

// 重置slide参数
CarouselLoop.prototype.resetSlide = function() {
  var me = this;
  // 轮播对象
  var $slides = me.$slides = me.$slideContain.find(me.slide);
  // slide总数
  var slidesCount = me.slidesCount = $slides.length;
  // slide列表最后一个坐标
  me.lastIndex = slidesCount - 1;
}

// 停止自动轮播
CarouselLoop.prototype.stopCarousel = function() {
  var me = this;
  var timer = me.timer;
  if (timer) {
    clearInterval(timer);
    me.timer = null;
  }
}

function carouselLoop(opt) {
  return new CarouselLoop(opt);
}

module.exports = carouselLoop;
 
});
;define('components/carousel-recommend/carousel-recommend.js', function(require, exports, module){ /**
 * 推荐位组件，diff的判断是根据title，title不同，更新
 * @param {Dom} contain  dom钩子:
 **** @param {Array} list 数组
 */
var carouselLoop = require('assets/js/module/carousel-loop.js');
var query = require('assets/js/module/query.js');
var wrapTpl = "<div class=\"J_carouselWrap carousel-recommend\">\r\n  <div class=\"J_carouselCon carousel-recommend-con\">\r\n  </div>\r\n  <nav class=\"J_carouselControl carousel-recommend-nav\">\r\n  </nav>\r\n</div>";
var tpl = "<div class=\"J_slide carousel-recommend-img\"><img class=\"J_carouselLoop carousel-loop\" width=\"360\" height=\"160\" data-src=\"{{bannerUrl}}\" data-link-title=\"{{title}}\" data-relatedid=\"{{relatedId}}\" data-type=\"{{featuredType}}\" data-link=\"{{link}}\" data-pname=\"{{packageName}}\" data-digest=\"{{digest}}\"  data-expid=\"{{experimentalId}}\" data-ad=\"{{ads}}\"  data-index=\"{{$index}}\" data-external=\"{{external}}\" data-position=\"{{position}}\" data-uid=\"{{uid}}\" data-rid=\"{{rid}}\"></div>";

var _render = require('assets/js/module/render.js');
var tap = require('assets/js/module/tap.js');
var createReqQuery = require('assets/js/createReqQuery.js');
var posPrefix = "carouselRecommend";
var bannerCarousel;

var render = function(opt, data) {
  var contain = opt.contain;
  var list = data.topfeaturedList;

  if (opt.diff) {
    var carouselFragment = document.createDocumentFragment();
    $(carouselFragment).append(wrapTpl);
    var newContain = carouselFragment.querySelector('.J_carouselCon');
    var carouselWrap1 = carouselFragment.querySelector('.J_carouselWrap');
    _render({
      contain: newContain,
      tpl: tpl,
      list: list
    });
    var $newElems = $(newContain).find('img');
    var $oldContain = $(contain).find('.J_carouselWrap');
    var $oldElems = $oldContain.find('img');
    $newElems.each(function(i, elem) {
      var $elem = $(elem);
      var newUid = $elem.data('uid');
      var $oldElem = $oldElems.eq(i);
      if ($oldElem.length !== 0) {
        if (newUid !== $oldElem.data('uid')) {
          $oldElem.replaceWith($elem);
        }
      } else {
        $oldContain.append($(newContain).find('.J_slide').slice(i));
        return false;
      }
    });
    newContain = null;

    bannerCarousel.stopCarousel();
    bannerCarousel.init({
      contain: $oldContain[0],
      direction: 'horizontal',
      speed: 500,
      usePagination: true,
      autoOrientation: 'left',
      slideIsImg: true
    });
    bannerCarousel.autoCarousel('left', 5000);      
  } else {
    var carouselFragment = document.createDocumentFragment();
    $(carouselFragment).append(wrapTpl);
    var carouselCon = carouselFragment.querySelector('.J_carouselCon');
    var carouselWrap = carouselFragment.querySelector('.J_carouselWrap');
    _render({
      contain: carouselCon,
      tpl: tpl,
      list: list
    });
    contain.appendChild(carouselFragment);

    bannerCarousel = carouselLoop({
      contain: carouselWrap,
      direction: 'horizontal',
      speed: 500,
      usePagination: true,
      autoOrientation: 'left',
      slideIsImg: true
    });
    bannerCarousel.autoCarousel('left', 5000);

    var carouselTimer;
    var win = window;

    $(win).off('scroll.onBannerCarousel').on('scroll.onBannerCarousel', function() {
      if (carouselTimer) { return; }
      carouselTimer = setTimeout(function() {
        carouselTimer = null;
        if (win.scrollY > 415) {
          bannerCarousel && bannerCarousel.stopCarousel();
        } else {
          bannerCarousel && bannerCarousel.autoCarousel('left', 5000)
        }
      }, 100);       
    });

    tap.on(contain);
    contain.addEventListener('tap', handTap);
    // 判断是否处于当前页面状态
    globle.registerViewStatus(registerViewStatusCb);
  }
}

function registerViewStatusCb(status) {
  console.log("bannerViewStatus", status);
  if (status) {
    bannerCarousel && bannerCarousel.autoCarousel('left', 5000);
  } else {
    bannerCarousel && bannerCarousel.stopCarousel();
  }
}

function handTap(e) {
  var target = e.target;
  var tagName = target.tagName.toLowerCase();
  var dataset = target.dataset;

  var reqQuery = createReqQuery({
    elem: target,
    posPrefix: posPrefix
  });

  var id = dataset.relatedid;
  var type = dataset.type;

  var _ref = 'subject/';
  var catId = query.get('catid') || '';

  // 类型1：，类型2：，类型3：活动
  switch (type) {
    // 应用
    case '1':
      if (catId) {
        _ref = _ref + '-1_' + catId;
      } else {
        _ref = 'subject/-1_-1';
      }
      reqQuery.extra_params.refs = ajaxData.refs + '-detail/' + id;
      var detailOpt = $.extend(reqQuery, {
        url: 'mimarket://details?appId=' + id,
        ref: _ref,
        launchMode: loadDetailMethod
      });
      market.loadPage(JSON.stringify(detailOpt));
      break;
      // 专题
    case '2':
      var url = PROTOCOL + 'subject.html';
      url = query.add(url, {
        id: id,
        catid: catId
      });
      url = query.add(url, reqQuery.extra_params);
      var detailOpt = $.extend(reqQuery, {
        url: url
      });
      market.loadPage(JSON.stringify(detailOpt));
      break;
    case '3':
      var url = query.add(dataset.link, reqQuery.extra_params);
      var detailOpt = $.extend(reqQuery, {
        url: url,
        external: dataset.external || false
      });
      market.loadPage(JSON.stringify(detailOpt));
      break;
  }
  e.stopPropagation();
}
exports.render = render;
 
});
;define('components/chart/chart.js', function(require, exports, module){ // 引入echarts
var chartJs = document.createElement("script");
// chartJs.src = "http://echarts.baidu.com/build/dist/echarts-all.js";
chartJs.src = "http://resource.xiaomi.net/apm/echarts-all.js";
var sc = document.getElementsByTagName("script")[0]; 
sc.parentNode.insertBefore(chartJs, sc);

var dom = require('assets/js/module/dom.js');
var tpl = "<div id=\"J_chartContain\" class=\"chart\" style=\"height:400px\"></div>\r\n<!-- 背景层 -->\r\n<div id=\"J_chartOverlay\" class=\"chart-overlay\"></div>\r\n";
var initChart = false;
var myChart;
var chartContain; dom.id('J_chartContain')
function render(msg, chartTitle) {
	// chart初始化
	if (!initChart) {
		var contain = document.createElement("div");
		contain.setAttribute("id", "J_chart");
		contain.className = "hide";
		contain.innerHTML = tpl;
		document.getElementsByTagName("body")[0].appendChild(contain);
		chartContain = dom.id('J_chartContain');
		
		dom.id('J_chartOverlay').addEventListener('click', function(){
			contain.className = "hide";
			// 删除图像
			myChart.dispose();
		}, false);

		initChart = true;	
	}
	myChart = echarts.init(chartContain);

	var option = {
		title: {
			text: chartTitle,
		  x: "center",
		  y: 30,
		  textStyle: {
		  	 fontSize: 14
		  }
		},
	  backgroundColor: "#fff",
	  color: ['#ff6225', '#acd9f7', '#ffd3fd'],
	  grid: {
			x: 60,
			x2: 10,
			y2: 70
		},
    tooltip : {
      trigger: 'axis'
    },
    legend: {
      data:['今天','昨天','7天前']
    },
    xAxis : [
      {
        type : 'category',
        boundaryGap : false,
        axisTick: {
        	interval: 0
        },
        axisLabel: {
        	interval: 1,
        	rotate: 40
        },
        data : msg.categories
      }
    ],
    yAxis : [
      {
        type : 'value'
      }
    ],
    series : msg.series
	};

	// 为echarts对象加载数据，并显示图像
	myChart.setOption(option);
	dom.id("J_chart").className = "";
}

exports.render = render;
 
});
;define('components/mingle-list/mingle-list.js', function(require, exports, module){ /**
 * 混合列表，此处的diff更新只会涉及第一个section
 */
var device = require('assets/js/device.js');
var cAppList = require('components/app-list/app-list.js');
var cRecommend = require('components/recommend/recommend.js');
var cRecWords = require('components/rec-words/rec-words.js');
var cCabinet = require('components/cabinet/cabinet.js');
var DomLazy = require('assets/js/module/domLazy.js');
var cMenu = require('components/menu/menu.js');
var recAppDesc = require('components/rec-app-desc/rec-app-desc.js');
var cRecApps = require('components/rec-apps/rec-apps.js');
var cRecApp = require('components/rec-app/rec-app.js');
var cRecAd = require('components/rec-ad/rec-ad.js');
var cHotWords = require('components/hot-words/hot-words.js');
var cCardApplist = require('components/card-applist/card-applist.js');
var cNav = require('components/nav/nav.js');
var cCarouselRec = require('components/carousel-recommend/carousel-recommend.js');

// diff标志位
var isRecUpdate = false;
var isMenuUpdate = false;
var isAppUpdate = false;
var isCabinetUpdate = false;

if (isInstantData) {
  var cChart = require('components/chart/chart.js');
  var request = require('assets/js/request.js');
  var optStat = {
    url: HOST + 'getstormdata',
    callBack: function(msg) {
      cChart.render(msg, "点击量统计");
    }
  }
}
/**
 * @param {Array} 
 */
var timer;
var domLazyCache = {};

function render(opt) {
  var rootContain = opt.contain;
  var contain;
  if (opt.diff) {
    contain = opt.contain = opt.contain.querySelector('section');
    rendGroup(opt);
  } else {
    contain = opt.contain = document.createElement('section');
    // A/B test
    contain.dataset.sid = opt.sid;
    contain.className = 'J_feed';
    rendGroup(opt);
    rootContain.appendChild(contain);
  }
  opt.rendedCb && opt.rendedCb();
  var lazyLoad = opt.lazyLoad;
  lazyLoad.update(opt.fadeIn);
  var exposure = opt.exposure;
  exposure.update();
  opt.diff = false;

  if (opt.buffer) {
    // 确保页面数据已经准备好
    var timer = setTimeout(function() {
      var renderCb = function(cache) {
        rendGroup(cache);
        cache.rended = true;
        lazyLoad.update();
        exposure.update();
      };
      var clearCb = function(cache, cacheTop, cacheBottom) {
        var _contain = cache.contain;
        _contain.style.height = cache.height + 'px';
        _contain.innerHTML = '';
        cache.rended = false;
        var cacheList = cache.list;
        cacheList.forEach(function(elem, i) {
          if (elem.type === 'listApp') {
            device.clearMemory(elem.data.listApp);
          }
        });
        lazyLoad.clearMemory(cacheTop, cacheBottom);
        exposure.clearMemory(cacheTop, cacheBottom);
      };
      var pageIndex = opt.pageIndex || 'default';
      if (domLazyCache[pageIndex]) {
        var domLazy = domLazyCache[pageIndex];
      } else {
        var domLazy = domLazyCache[pageIndex] = new DomLazy({
          renderCb: renderCb,
          clearCb: clearCb,
          contain: opt.domLazyContain
        });
      }
      domLazy.add(opt);
    }, 0)
  }
}

function rendGroup(opt) {
  var list = opt.list;
  list.forEach(function(elem, i) {
    switch (elem.type) {
      case 'listApp':
        createAppList(opt, elem.data.listApp);
        break;
      case 'recZone':
        cCardApplist.render(opt, elem.data.listApp, elem.data.title);
        break;
      case 'window':
        createCabinet(opt, elem.data);
        break;
      case 'recommend':
        createRec(opt, elem.data);
        break;
      case 'menu':
        createMenu(opt, elem.data);
        break;
      case 'nav':
        cNav.render(opt, elem.data);
        break;
      case 'tmpWindow':
        createTmpWin(opt, elem.data);
        break;
      case 'recWords':
        createRecWords(opt, elem.data);
        break;
      case 'recAppDesc':
        recAppDesc.render(opt, elem.data);
        break;
      case 'recApps':
        cRecApps.render(opt, elem.data);
        break;
      case 'recApp':
        cRecApp.render(opt, elem.data);
        break;
      case 'hotSuggestion':
        cHotWords.render(opt.contain, elem.data);
        break;
      case 'adApp':
      case 'cptApp':
        cRecAd.render(opt, elem.data, elem.type);
        break;
      case 'carouselRecommend':
        cCarouselRec.render(opt, elem.data);
        break;
    }
  })
}

function createAppList(opt, list) {
  var _opt = $.extend(true, {}, opt);
  var contain = opt.contain;
  _opt.list = list;
  _opt.buffer = ''; //子列表不做domlazy
  if (opt.diff && !isAppUpdate) {
    // 只会对第一个做diff操作
    _opt.contain = contain.querySelector('.applist');
    cAppList.render(_opt);
    isAppUpdate = true;
  } else {
    var domUl = document.createElement('ul');
    domUl.className = 'applist';
    _opt.contain = domUl;
    cAppList.render(_opt);

    // 实时数据展示区绑定事件
    if (isInstantData) {
      $(domUl).find("li").on("touchstart", ".statistics", function(e) {
        e.stopPropagation();
      }).on("click", ".statistics", function(e) {
        optStat.data = {
          pos: this.dataset.pos,
          statType: "index",
          mark: "default"
        };
        request.getJSON(optStat);
      });
    }
    contain.appendChild(domUl);
  }
}



function createCabinet(opt, msg) {
  var _opt = $.extend(true, {}, opt);
  _opt.list = msg.window;
  _opt.now = msg.timestamp;
  _opt.contentId = msg.contentId;

  var domCabinet = opt.contain.querySelector('.cabinet');
  if (opt.diff && !isCabinetUpdate && domCabinet) {
    // 只会对第一个做diff操作
    var cacheCabinetId = domCabinet.dataset.contentid;
    _opt.contain = domCabinet;
    if (cacheCabinetId != msg.contentId) {
      cCabinet.render(_opt);
      isCabinetUpdate = true;
    }
  } else {
    var domCabinet = document.createElement('div');
    domCabinet.className = 'cabinet cf card-both';
    _opt.contain = domCabinet;
    cCabinet.render(_opt);
    opt.contain.appendChild(domCabinet);
  }
}

function createRec(opt, msg) {
  var contain = opt.contain;
  if (opt.diff && !isRecUpdate) {
    cRecommend.render(contain.querySelector('.recommend'), msg.topfeaturedList, true);
    isRecUpdate = true;
  } else {
    var domRec = document.createElement('div');
    domRec.className = 'recommend cf card-both';
    cRecommend.render(domRec, msg.topfeaturedList);

    if (isInstantData) {
      $(domRec).on("click", ".statistics", function(e) {
        optStat.data = {
          pos: this.dataset.pos,
          statType: "index-banner",
          mark: "default"
        };
        request.getJSON(optStat);
        e.stopPropagation();
      })
    }
    contain.appendChild(domRec);
  }
}

function createMenu(opt, msg) {
  var contain = opt.contain;
  if (opt.diff && !isMenuUpdate) {
    cMenu.render({
      contain: contain.querySelector('.menu'),
      list: msg.menu,
      diff: true
    });
    isMenuUpdate = true;
  } else {
    var domMenu = document.createElement('div');
    domMenu.className = 'menu card';
    cMenu.render({
      contain: domMenu,
      list: msg.menu
    });

    if (isInstantData) {
      $(domMenu).find(".menu-wrap").on("click", ".statistics", function(e) {
        var data = this.dataset;
        optStat.data = {
          pos: -1,
          statType: data.stattype,
          mark: "default"
        };
        if (data.mark) {
          optStat.data.mark = data.mark;
        }
        request.getJSON(optStat);
        e.stopPropagation();
      })
    }
    contain.appendChild(domMenu);
  }
}


function createTmpWin(opt, msg) {
  var content = msg.tmpWindow;
  var deadline = content.deadline;
  var now = msg.timestamp;
  // 有返回值，并且有效时间在5秒内才加载倒计时
  if (deadline - now < 5000) {
    return;
  }
  content.src = msg.thumbnail + 'webp/l88q80/' + content.icon;
  var domTopCabinet = document.createElement('div');
  domTopCabinet.className = 'cabinet-top';
  cCabinet.renderTop({
    contain: domTopCabinet,
    list: [content],
    deadline: deadline,
    type: content.type,
    now: now,
    contentId: content.contentId
  });
  opt.contain.appendChild(domTopCabinet);
}

function createRecWords(opt, msg) {
  var contain = opt.contain;
  var domRec = document.createElement('div');
  domRec.className = 'rec-word card-both';
  cRecWords.render(domRec, msg.words);
  contain.appendChild(domRec);
}


exports.render = render;
 
});
;define('components/search-bar/search-bar.js', function(require, exports, module){ var dom = require('assets/js/module/dom.js');
var tpl = "<div id=\"J_searchWrap\" class=\"search\">\r\n\t<ul id=\"J_searchTip\" class=\"J_carouselCon search-queue\">\r\n\t\t<li class=\"J_slide ellipsis\">发现更多好玩的应用、游戏</li>\r\n\t</ul>\t\t\r\n</div>";
var _render = require('assets/js/module/render.js');
var request = require('assets/js/request.js');
var carouselLoop = require('assets/js/module/carousel-loop.js');

var domUl;
var hotWordCarousel;
var defaultRemoved = false;
var win = window;
var $win = $(win);
var $searchBar;

var render = function(opt) {
  var domContain = opt.contain;
  domContain.innerHTML = tpl;
  $searchBar = $(domContain);
  domUl = dom.id("J_searchTip");
  domUl.addEventListener('click', handClick);
  searchBarScroll();
  // 请求获取“关键词”
  request.getJSON({
    // url: HOST + 'search/hotword',
    url: 'http://10.235.151.32/mock/hotword.json',
    data: ajaxData,
    callBack: function(msg) {
      queueCarousel(msg.extraHotWords);
    }
  });
};

function handClick(e) {
  var keyword = e.target.dataset.keyword;
  if (!keyword) {
    keyword = '';
  }
  // 兼容老版本ref
  market.loadPage(JSON.stringify({
    url: 'mimarket://search?ref=' + ajaxData.refs + '&h=' + keyword,
    type: 2,
    ref: ajaxData.refs
  }));
}

// 搜索框关键词轮播功能
function queueCarousel(list) {
  if (!list || !list.length) { return; }
  var tpl = '<li class="J_slide ellipsis" data-keyword="{{keyword}}">{{description}}</li>'
  var domQueue = document.createDocumentFragment();
  _render({
    tpl: tpl,
    contain: domQueue,
    list: list
  });
  domUl.innerHTML += domQueue.innerHTML;
  domQueue = null;

  var allLi = domUl.querySelectorAll('li');
  var firstLi = allLi[0];
  var liHeight = firstLi.offsetHeight;
  
  hotWordCarousel = carouselLoop({
    contain: document.querySelector('#J_searchWrap'),
    direction: 'vertical',
    autoOrientation: 'up',
    forbidTouch: true,
    usePagination: false,
    speed: 500
  });

  // 缺省轮播对象单独动画，执行后从队列中删除
  setTimeout(function(){
    $(firstLi).css({
      '-webkit-transform': 'translate3d(0px, -' + liHeight + 'px, 0px)',
      'transform': 'translate3d(0px, -' + liHeight + 'px, 0px)',
      '-webkit-transition': '-webkit-transform 500ms ease-out',
      'transition': '-webkit-transform 500ms ease-out'
    });
    $(allLi[1]).css({
      '-webkit-transform': 'translate3d(0px, 0px, 0px)',
      'transform': 'translate3d(0px, 0px, 0px)',
      '-webkit-transition': '-webkit-transform 500ms ease-out',
      'transition': '-webkit-transform 500ms ease-out'
    });
    $(firstLi).on('webkitTransitionEnd transitionEnd', function() {
      domUl.removeChild(firstLi);
      hotWordCarousel && hotWordCarousel.resetSlide();
      hotWordCarousel && hotWordCarousel.autoCarousel('up', 4000);
      defaultRemoved = true;
      // 判断是否处于当前页面状态
      globle.registerViewStatus(registerViewStatusCb);
    });
  } , 4000);
}

function registerViewStatusCb(status) {
  console.log("viewStatus", status);
  if (status) {
    hotWordCarousel && hotWordCarousel.autoCarousel('up', 4000);
  } else {
    hotWordCarousel && hotWordCarousel.stopCarousel();
  }
}

// 搜索框滚动动效
function searchBarScroll() {
  var currY = 0;
  var prevY = 0;
  var timer;
  $win.off('scroll.onSearchBar').on('scroll.onSearchBar', function() {
    if (timer) { return; }
    timer = setTimeout(function() {
      timer = null;
      currY = win.scrollY;
      var isScrollUp = currY - prevY;
      // 考虑体验效果，滚动距离小于2px不触发动画
      if (Math.abs(isScrollUp) > 2) {
        // 为保证顶端不留白，滚动大于54px触发动画
        if (isScrollUp > 0) {
          $searchBar.addClass("search-underline");
          if (currY >= 54) {
            $searchBar.removeClass("search-fadedown").addClass("search-fadeup");
            if (defaultRemoved && hotWordCarousel) {
              hotWordCarousel.stopCarousel();
            }
          }
        }
        if (isScrollUp <= 0) {
          $searchBar.removeClass("search-fadeup").addClass("search-fadedown");
          // 恢复轮播
          if (defaultRemoved && hotWordCarousel) {
            hotWordCarousel && hotWordCarousel.autoCarousel('up', 4000);
          }
        }
      }
      // 搜索框重新置顶后,重置class
      if (currY === 0) {
        $searchBar.removeClass("search-underline");
      }
      prevY = currY;
    }, 100);  
  });
}


module.exports = {
  render: render
}
 
});
;define('views/index/index.js', function(require, exports, module){ require('assets/js/global.js');
var dom = require('assets/js/module/dom.js');
// 统计信息
window.ref = 'featured';
ajaxData.refs = 'index';

var request = require('assets/js/request.js');
var scrollReq = require('assets/js/scrollRequest.js');

var LazyLoad = require('assets/js/module/lazyLoad.js');
var lazyLoad = new LazyLoad();
var Exposure = require('assets/js/module/exposure.js');
var exposure = new Exposure();
var cLoad = require('components/load/load.js');
var load = cLoad('#J_load', 'fixBottom');
var cLift = require('components/lift/lift.js');

var formateMingleList = require('assets/js/formate/mingleList.js');
var cMingleList = require('components/mingle-list/mingle-list.js');
var domMingle = dom.id('J_mingleList');

// search-bar
var cSearch = require('components/search-bar/search-bar.js');
cSearch.render({
  contain: dom.id('J_searchBar')
});

var opt = {
  // url: HOST + 'featured?combine=1&stamp=0',
  url: 'https://sec.resource.xiaomi.net/apm/feature.json',
  data: ajaxData,
  load: load,
  callBack: renderFirstView
};

// 实时数据不需加载缓存
var isCache = false;
if (!isInstantData) {
  var vIndex = localStorage.getItem('v-index13');
  if (vIndex) {
    isCache = true;
    renderMingleList(JSON.parse(vIndex), false, false, false);
  } else {
    load.changePositon('middle');
  }
}



// 获取精品列表
setTimeout(function() {
  request.getJSON(opt);
}, 0);

/*
 * 第一屏分五次渲染
 */
function renderFirstView(msg) {
  var secRenderList = msg.list.splice(3);
  // 实时数据不需diff
  if (isInstantData) {
    addData2Search(msg);
    renderMingleList(msg, false);
  } else {
    localStorage.setItem('v-index12', JSON.stringify(msg));
    renderMingleList(msg, isCache, true);
  }

  setTimeout(function() {
    var thirdRenderList = secRenderList.splice(5);
    var fourthRenderList = thirdRenderList.splice(5);
    var fifthRenderList = fourthRenderList.splice(5);

    var secData = $.extend(true, {}, msg);
    secData.list = secRenderList;
    updateMingleList(secData);

    var thirdData = $.extend(true, {}, msg);
    thirdData.list = thirdRenderList;
    updateMingleList(thirdData);

    var fourthData = $.extend(true, {}, msg);
    fourthData.list = fourthRenderList;
    updateMingleList(fourthData);

    var fifthData = $.extend(true, {}, msg);
    fifthData.list = fifthRenderList;
    updateMingleList(fifthData);
    initFeed();
  }, 0)
}

// 渲染无限流
function renderMingleList(msg, diff, recount, fadeIn) {
  var list = formateMingleList(msg, recount);
  cMingleList.render({
    contain: domMingle,
    list: list,
    buffer: false,
    diff: diff,
    sid: msg.sid,
    lazyLoad: lazyLoad,
    exposure: exposure,
    briefShow: true,
    fadeIn: fadeIn
  });
}

function updateMingleList(msg) {
  var list = formateMingleList(msg);
  cMingleList.render({
    contain: domMingle,
    list: list,
    buffer: 3000,
    sid: msg.sid,
    lazyLoad: lazyLoad,
    exposure: exposure,
    briefShow: true
  });
  ajaxData.page++;
}

function initFeed() {
  opt.url = HOST + 'feed?stamp=0';
  opt.callBack = updateMingleList;
  ajaxData.page = 0;
  var scrollBottomEvent = require('assets/js/scrollBottomEvent.js');
  scrollBottomEvent(function() {
    scrollReq(opt);
  }, {});
  cLift.init();
}

// 首页搜索框中添加实时数据
if (isInstantData) {
  var cChart = require('components/chart/chart.js');

  function addData2Search(msg) {
    var clickAmountDom = document.createElement("div");
    clickAmountDom.className = "statistics";
    clickAmountDom.innerHTML = '<p>点击量：' + msg.searchCount + '</p><p>转化率：' + msg.searchCtr + '</p>';

    var pvDom = document.createElement("div");
    pvDom.className = "statistics statistics-right";
    pvDom.innerHTML = '<p>总PV：' + msg.totalPv + '</p><p>H5 PV：' + msg.h5Pv + '</p>';

    clickAmountDom.addEventListener('click', function(e) {
      request.getJSON({
        url: HOST + 'getstormdata',
        data: {
          pos: -1,
          statType: 'main_search',
          mark: 'default'
        },
        callBack: function(msg) {
          cChart.render(msg, "PV统计");
        }
      });
      e.stopPropagation();
    });

    pvDom.addEventListener('click', function(e) {
      request.getJSON({
        url: HOST + 'getstormdata',
        data: {
          pos: -1,
          statType: 'index',
          mark: 'featured'
        },
        callBack: function(msg) {
          cChart.render(msg, "PV统计");
        }
      });
      e.stopPropagation();
    });

    var searchWrap = dom.id('J_searchWrap');
    searchWrap.appendChild(clickAmountDom);
    searchWrap.appendChild(pvDom);
  }
}
 
});