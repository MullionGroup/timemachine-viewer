// @license
// Redistribution and use in source and binary forms ...

// Class containing various (static) generic utility methods.
//
// Dependencies: None
//
// Copyright 2011 Carnegie Mellon University. All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
//    conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list
//    of conditions and the following disclaimer in the documentation and/or other materials
//    provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY CARNEGIE MELLON UNIVERSITY ''AS IS'' AND ANY EXPRESS OR IMPLIED
// WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL CARNEGIE MELLON UNIVERSITY OR
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
// ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
// NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
// ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
// The views and conclusions contained in the software and documentation are those of the
// authors and should not be interpreted as representing official policies, either expressed
// or implied, of Carnegie Mellon University.
//
// Authors:
// Chris Bartley (bartley@cmu.edu)
// Paul Dille (pdille@andrew.cmu.edu)
// Randy Sargent (randy.sargent@cs.cmu.edu)

"use strict";

//
// VERIFY NAMESPACE
//
// Create the global symbol "org" if it doesn't exist.  Throw an error if it does exist but is not an object.
var org;

if (!org) {
  org = {};
} else {
  if ( typeof org != "object") {
    var orgExistsMessage = "Error: failed to create org namespace: org already exists and is not an object";
    alert(orgExistsMessage);
    throw new Error(orgExistsMessage);
  }
}

// Repeat the creation and type-checking for the next level
if (!org.gigapan) {
  org.gigapan = {};
} else {
  if ( typeof org.gigapan != "object") {
    var orgGigapanExistsMessage = "Error: failed to create org.gigapan namespace: org.gigapan already exists and is not an object";
    alert(orgGigapanExistsMessage);
    throw new Error(orgGigapanExistsMessage);
  }
}
//

//
// CODE
//
(function() {
  var isChromeUserAgent = navigator.userAgent.match(/Chrome/) != null;
  // The Chrome user agent actually has the word "Safari" in it too!
  var isSafariUserAgent = navigator.userAgent.match(/Safari/) != null && !isChromeUserAgent;
  var isMSIEUserAgent = navigator.userAgent.match(/MSIE|Trident/) != null;
  var matchIEVersion = navigator.userAgent.match(/MSIE\s([\d]+)/);
  var isIE9UserAgent = (isMSIEUserAgent && matchIEVersion && matchIEVersion[1] == 9);
  var isFirefoxUserAgent = navigator.userAgent.match(/Firefox/) != null;
  var isOperaLegacyUserAgent = typeof (window.opera) !== "undefined";
  var isOperaUserAgent = navigator.userAgent.match(/OPR/) != null;
  var isChromeOS = navigator.userAgent.match(/CrOS/) != null;
  var mediaType = ".mp4";
  var viewerType = (isSafariUserAgent || isChromeOS) ? "video" : "canvas";

  //0 == none
  //1 == errors only
  //2 == verbose (everything)
  var loggingLevel = 1;

  org.gigapan.Util = function() {
  };

  org.gigapan.Util.setLoggingLevel = function(newLevel) {
    if (newLevel < 0 || newLevel > 2)
      newLevel = 1;
    loggingLevel = newLevel;
  };

  org.gigapan.Util.isMobile = function() {
    return (navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i));
  };

  org.gigapan.Util.browserSupported = function() {
    var v = document.createElement('video');
    var canPlay = false;
    // We do not support mobile devices (Android, iOS, etc) due to OS limitations
    if (org.gigapan.Util.isMobile())
      return canPlay;
    // Check if video tag is supported and that the browser supports WebM
    canPlay = !!(v.canPlayType && v.canPlayType('video/webm; codecs="vp8"').replace(/no/, ''));
    if (canPlay) {
      canPlay = true;
      mediaType = ".webm";
    } else {
      // Check if video tag is supported and that the browser supports H.264
      canPlay = !!(v.canPlayType && v.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"').replace(/no/, ''));
      if (canPlay) {
        canPlay = true;
        mediaType = ".mp4";
      }
    }
    return canPlay;
  };

  org.gigapan.Util.isChrome = function() {
    return isChromeUserAgent;
  };

  org.gigapan.Util.isSafari = function() {
    return isSafariUserAgent;
  };

  org.gigapan.Util.isIE = function() {
    return isMSIEUserAgent;
  };

  org.gigapan.Util.isFirefox = function() {
    return isFirefoxUserAgent;
  };

  org.gigapan.Util.isIE9 = function() {
    return isIE9UserAgent;
  };

  org.gigapan.Util.isOperaLegacy = function() {
    return isOperaLegacyUserAgent;
  };

  org.gigapan.Util.isOpera = function() {
    return isOperaUserAgent;
  };

  org.gigapan.Util.getMediaType = function() {
    return mediaType;
  };

  org.gigapan.Util.setMediaType = function(type) {
    if (type != ".mp4" && type != ".webm")
      return;
    mediaType = type;
  };

  org.gigapan.Util.getViewerType = function() {
    return viewerType;
  };

  org.gigapan.Util.setViewerType = function(type) {
    if (type != "canvas" && type != "video")
      return;
    viewerType = type;
  };

  org.gigapan.Util.playbackRateSupported = function() {
    var video = document.createElement("video");
    return !!video.playbackRate;
  };

  org.gigapan.Util.isNumber = function(n) {
    // Code taken from http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
    // Added check to ensure that the value being checked is defined
    return ( typeof (n) !== 'undefined') && !isNaN(parseFloat(n)) && isFinite(n);
  };

  org.gigapan.Util.log = function(str, logType) {
    if ( typeof (console) == 'undefined' || console == null)
      return;
    var now = (new Date()).getTime();
    if (loggingLevel >= 2 || (loggingLevel == 1 && logType && logType == 1)) {
      console.log(org.gigapan.Util.convertTimeToMinsSecsString(now) + ": " + str);
    }
  };

  org.gigapan.Util.error = function(str) {
    org.gigapan.Util.log('*ERROR: ' + str, 1);
  };

  org.gigapan.Util.convertTimeToMinsSecsString = function(t) {
    var mins = ("0" + Math.floor((t / 60000) % 60)).substr(-2);
    var secs = ("0" + ((t / 1000) % 60).toFixed(3)).substr(-6);
    return mins + ":" + secs;
  };

  org.gigapan.Util.dumpObject = function(obj) {
    if ( typeof obj != 'object') {
      return obj;
    }
    var ret = '{';
    for (var property in obj) {
      if (ret != '{') {
        ret += ',';
      }
      ret += property + ':' + obj[property];
    }
    ret += '}';
    return ret;
  };

  org.gigapan.Util.getCurrentTimeInSecs = function() {
    return 0.001 * (new Date()).getTime();
  };

  org.gigapan.Util.formatTime = function(theTime, willShowMillis, willShowHours) {
    var t = parseFloat(theTime.toFixed(3));
    var hours = Math.floor(t / 3600);
    var minutes = Math.floor(t / 60) - (hours * 60);
    var seconds = Math.floor(t - (hours * 3600) - (minutes * 60));
    var millis = Math.floor(parseFloat((t - Math.floor(t)).toFixed(2)) * 100);

    var hoursStr = '' + hours;
    var minutesStr = '' + minutes;
    var secondsStr = '' + seconds;
    var millisStr = '' + millis;
    if (hours < 10) {
      hoursStr = "0" + hoursStr;
    }
    if (minutes < 10) {
      minutesStr = "0" + minutesStr;
    }
    if (seconds < 10) {
      secondsStr = "0" + secondsStr;
    }
    if (millis < 10) {
      millisStr = "0" + millisStr;
    }

    return ( willShowHours ? hoursStr + ':' : '') + minutesStr + ":" + secondsStr + ( willShowMillis ? "." + millisStr : '');
  };

  // Wrapper for ajax calls
  org.gigapan.Util.ajax = function(dataType, rootPath, path, callback) {
    var ajaxUrl = rootPath + path;
    var doNormalAjax = false;

    // Check that there is a global cache object
    if ( typeof (cached_ajax) !== "undefined") {
      if ( typeof (cached_ajax[ajaxUrl]) === "undefined") {
        // If the key does not include the absolute dataset URL,
        // perhaps it is relative and in the form of "./foo.bar"
        ajaxUrl = "./" + path;
        if ( typeof (cached_ajax[ajaxUrl]) === "undefined") {
          // Lastly, remove rootPath from path and try again.
          ajaxUrl = path.substr(path.indexOf(rootPath) + 1);
          if ( typeof (cached_ajax[ajaxUrl]) === "undefined") {
            doNormalAjax = true;
          }
        }
      }

      if (!doNormalAjax) {
        callback(cached_ajax[ajaxUrl]);
        return;
      }
    }

    // Nothing cached, so do an actual request
    ajaxUrl = rootPath + path;
    $.ajax({
      dataType: dataType,
      url: ajaxUrl,
      success: function(data) {
        if (data)
          callback(data);
      },
      error: function() {
        org.gigapan.Util.error("Error loading file from path [" + ajaxUrl + "]");
        return;
      }
    });
  };

  org.gigapan.Util.htmlForTextWithEmbeddedNewlines = function(text) {
    if (text === undefined)
      return;
    var htmls = [];
    var lines = text.split(/\n/);
    var className = "";
    for (var i = 0; i < lines.length; i++) {
      if (i == 0)
        className = "captureTimeMain";
      else
        className = "captureTimeSub" + i;
      htmls.push(jQuery(document.createElement('div')).html("<div class=\"" + className + "\">" + lines[i]).html() + "</div>");
    }
    return htmls.join("");
  };

  org.gigapan.Util.unpackVars = function(str) {
    var keyvals = str.split('&');
    var vars = {};

    if (keyvals.length == 1 && keyvals[0] == "")
      return null;

    for (var i = 0; i < keyvals.length; i++) {
      var keyval = keyvals[i].split('=');
      vars[keyval[0]] = keyval[1];
    }
    return vars;
  };

  // Note: Hash variables may contain potentially unsafe user-inputted data.
  // Caution must be taken when working with these values.
  org.gigapan.Util.getUnsafeHashVars = function() {
    var hashSource = "";
    var hashIframe = "";
    // TODO: link to our page on the time machine website
    hashSource = window.location.hash.slice(1);
    try {
      hashIframe = window.top.location.hash.slice(1);
    } catch(e) {
    }
    return org.gigapan.Util.unpackVars(hashSource + "&" + hashIframe);
  };

  // Select an element in jQuery selectable
  org.gigapan.Util.selectSelectableElements = function($selectableContainer, $elementsToSelect, autoScroll) {
    if ($selectableContainer.length == 0)
      return;
    // Add unselecting class to all elements in the styleboard canvas except the ones to select
    $(".ui-selected", $selectableContainer).not($elementsToSelect).removeClass("ui-selected").addClass("ui-unselecting");
    // Add ui-selecting class to the elements to select
    $elementsToSelect.not(".ui-selected").addClass("ui-selecting");
    // Refresh the selectable to prevent errors
    $selectableContainer.selectable('refresh');
    // Trigger the mouse stop event (this will select all .ui-selecting elements, and deselect all .ui-unselecting elements)
    $selectableContainer.data("uiSelectable")._mouseStop(null);
    // Scroll to the position
    if (autoScroll == true) {
      var $selectableContainerParent = $selectableContainer.parent();
      $selectableContainerParent.scrollLeft(Math.round($elementsToSelect.position().left - $selectableContainerParent.width() / 3));
    }
  };

  // Select an element in jQuery sortable
  org.gigapan.Util.selectSortableElements = function($sortableContainer, $elementsToSelect, autoScroll) {
    if ($sortableContainer.length == 0)
      return;
    // Add unselecting class to all elements in the styleboard canvas except the ones to select
    var $unselectedItems = $(".ui-selected", $sortableContainer).not($elementsToSelect).removeClass("ui-selected");
    for (var i = 0; i < $unselectedItems.length; i++)
      org.gigapan.Util.changeBackgroundColorOpacity($unselectedItems[i], 0);
    // Add ui-selecting class to the elements to select
    var $selectedItems = $elementsToSelect.not(".ui-selected").addClass("ui-selected");
    for (var i = 0; i < $selectedItems.length; i++)
      org.gigapan.Util.changeBackgroundColorOpacity($selectedItems[i], 0.15);
    // Refresh the selectable to prevent errors
    $sortableContainer.sortable('refresh');
    // Scroll to the position
    if (autoScroll == true) {
      var $sortableContainerParent = $sortableContainer.parent();
      $sortableContainerParent.scrollLeft(Math.round($elementsToSelect.position().left - $sortableContainerParent.width() / 3));
    }
  };

  org.gigapan.Util.changeBackgroundColorOpacity = function(element, opacity) {
    var $element = $(element);
    // Get the original color
    var tagColor = element.style.backgroundColor;
    var rgb = tagColor.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),.*\)$/);
    // Restore the original color
    var colorStr = "rgba(" + rgb[1] + "," + rgb[2] + "," + rgb[3] + "," + opacity + ")";
    if ($element.hasClass("snaplapse_keyframe_list_item"))
      $element.find(".keyframe_table").css("background-color", colorStr);
  };

  org.gigapan.Util.getRootAppURL = function() {
    var tmpURL = $('script[src*="util.js"]').attr("src");
    return tmpURL.substr(0, tmpURL.indexOf("js/"));
  }

  org.gigapan.Util.addGoogleAnalyticEvent = function(category, action, label) {
    var settings, isGoogleAnalyticEventTrackingEnabled;
    if ( typeof timelapse != "undefined") {
      settings = timelapse.getSettings();
      if ( typeof settings != "undefined")
        isGoogleAnalyticEventTrackingEnabled = ( typeof (settings["isGoogleAnalyticEventTrackingEnabled"]) == "undefined") ? false : settings["isGoogleAnalyticEventTrackingEnabled"];
    }
    if ( typeof (ga) != "undefined" && isGoogleAnalyticEventTrackingEnabled)
      ga('send', 'event', category, action, label);
  };
})();
