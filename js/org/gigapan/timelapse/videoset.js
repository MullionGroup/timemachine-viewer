//======================================================================================================================
// Class for managing timelapse videosets.
//
// Dependencies:
// * org.gigapan.Util
//
// Authors:
// * Randy Sarget (randy.sargent@gmail.com)
// * Paul Dille (pdille@andrew.cmu.edu)
// * Chris Bartley (bartley@cmu.edu)
//======================================================================================================================

//======================================================================================================================
// VERIFY NAMESPACE
//======================================================================================================================
// Create the global symbol "org" if it doesn't exist.  Throw an error if it does exist but is not an object.
var org;
if (!org)
   {
   org = {};
   }
else
   {
   if (typeof org != "object")
      {
      var orgExistsMessage = "Error: failed to create org namespace: org already exists and is not an object";
      alert(orgExistsMessage);
      throw new Error(orgExistsMessage);
      }
   }

// Repeat the creation and type-checking for the next level
if (!org.gigapan)
   {
   org.gigapan = {};
   }
else
   {
   if (typeof org.gigapan != "object")
      {
      var orgGigapanExistsMessage = "Error: failed to create org.gigapan namespace: org.gigapan already exists and is not an object";
      alert(orgGigapanExistsMessage);
      throw new Error(orgGigapanExistsMessage);
      }
   }

// Repeat the creation and type-checking for the next level
if (!org.gigapan.timelapse)
   {
   org.gigapan.timelapse = {};
   }
else
   {
   if (typeof org.gigapan.timelapse != "object")
      {
      var orgGigapanTimelapseExistsMessage = "Error: failed to create org.gigapan.timelapse namespace: org.gigapan.timelapse already exists and is not an object";
      alert(orgGigapanTimelapseExistsMessage);
      throw new Error(orgGigapanTimelapseExistsMessage);
      }
   }
//======================================================================================================================

//======================================================================================================================
// DEPENDECIES
//======================================================================================================================
if (!org.gigapan.Util)
   {
   var noUtilMsg = "The org.gigapan.Util library is required by org.gigapan.timelapse.Videoset";
   alert(noUtilMsg);
   throw new Error(noUtilMsg);
   }
//======================================================================================================================

//======================================================================================================================
// CODE
//======================================================================================================================
(function()
   {
      var UTIL = org.gigapan.Util;

      org.gigapan.timelapse.Videoset = function(videoDivName)
         {
            var videoDiv = document.getElementById(videoDivName);
            var isStatusLoggingEnabled = false;
            var activeVideos = {};
            var inactiveVideos = {};
            var playbackRate = 1;
            var id = 0;
            var fps = 25;
            var areNativeVideoControlsVisible = false;
            var duration = 0;
            var isCacheDisabled = false;
            var advancing = false;
            var paused = true;
            var stalled = false;
            var timeOffset = 0;
            var logInterval = null;
            var syncInterval = null;
            var syncListeners = [];
            var garbageCollectionInterval = null;
            var perfInitialSeeks = 0;
            var perfTimeCorrections = [];
            var perfTimeTweaks = 0;
            var perfTimeSeeks = 0;
            var perfAdded = 0;
            var syncIntervalTime = 0.2; // in seconds
            var leader = 0;

            ////////////////////////////////////////////////////////////////////////////////////////////////////////////
            //
            // Public methods
            //

            this.setStatusLoggingEnabled = function(enable)
               {
                  enable = !!enable;  // make true or false
                  UTIL.log("videoset logging status: " + enable);
                  if (isStatusLoggingEnabled == enable)
                     {
                     return;
                     }
                  isStatusLoggingEnabled = enable;
                  if (enable)
                     {
                     logInterval = setInterval(this.writeStatusToLog, 500);
                     }
                  else
                     {
                     clearInterval(logInterval);
                     }
               };

            this.setNativeVideoControlsEnabled = function(enable)
               {
                  areNativeVideoControlsVisible = !!enable;  // make true or false

                  for (var videoId1 in activeVideos)
                     {
                     var v1 = activeVideos[videoId1];
                     enable ? v1.setAttribute('controls', true) : v1.removeAttribute('controls');
                     }

                  for (var videoId2 in inactiveVideos)
                     {
                     var v2 = inactiveVideos[videoId2];
                     enable ? v2.setAttribute('controls', true) : v2.removeAttribute('controls');
                     }
               };

            this.addSyncListener = function(listener)
               {
                  if (listener && typeof(listener) == "function")
                     {
                     syncListeners.push(listener);
                     }
               };

            this.removeSyncListener = function(listener)
               {
                  if (listener && typeof(listener) == "function")
                     {
                     for (var i = 0; i < syncListeners.length; i++)
                        {
                        if (listener == syncListeners[i])
                           {
                           syncListeners.splice(i, 1);
                           return;
                           }
                        }
                     }
               };

            this.setFps = function(newFps)
               {
                  fps = newFps;
               };

            this.getFps = function()
               {
                  return fps;
               };

            this.setLeader = function(newLeader)
               {
                  var currentTime = _getCurrentTime();
                  leader = newLeader;
                  _seek(currentTime);
               };

            this.getLeader = function()
               {
                  return leader;
               };

            this.getActiveVideos = function()
               {
                  return activeVideos;
               };

            this.getInactiveVideos = function()
               {
                  return inactiveVideos;
               };

            this.resetPerf = function()
               {
                  perfInitialSeeks = 0;
                  perfAdded = 0;
                  perfTimeCorrections = [];
                  perfTimeTweaks = 0;
                  perfTimeSeeks = 0;
               };

            var getPerf = function()
               {
                  var perf = "Videos added: " + perfAdded;
                  perf += "; initial seeks: " + perfInitialSeeks;
                  perf += "; # time correction seeks: " + perfTimeSeeks;
                  perf += "; # time correction tweaks: " + perfTimeTweaks;
                  perf += "; Corrections: ";
                  for (var i = 0; i < perfTimeCorrections.length; i++)
                     {
                     if (i) perf += ",";
                     perf += perfTimeCorrections[i].toFixed(4);
                     }
                  return perf;
               };
               
            var showSpinner = function()
               {
                  UTIL.log("showSpinner");
                  $('<div/>', {
                     id: "overlay3",
                     "class": "spinnerOverlay"
							    }).prependTo('#timelapse_container');
							    
                  $('<img/>', {
                     id: "spinner",
                     src: "images/spinner.gif",
                     alt: "spinner",
                     title: "Buffering..."
                  }).appendTo('#overlay3');
                  
                  $('.spinnerOverlay').css("top", $("#timelapse_container").height()/2 - $("#spinner").height()/2 + "px");
                  $('.spinnerOverlay').css("left", $("#timelapse_container").width()/2 - $("#spinner").width()/2 + "px");
                  $('#spinner').bind('dragstart', function(event) { event.preventDefault(); });
               };
               
            var hideSpinner = function()
               {
                  UTIL.log("hideSpinner");
                  $('.spinnerOverlay').remove();
               };
               
            ///////////////////////////
            // Add and remove videos
            //

            this.addVideo = function(src, geometry, videoBeingReplaced, onloadCallback)
               {
                  perfAdded++;
                  id++;
                  if (isCacheDisabled)
                     {
                     src += "?nocache=" + UTIL.getCurrentTimeInSecs() + "." + id;
                     }
                  UTIL.log("video(" + id + ") added from " + src + " at left=" + geometry.left + ",top=" + geometry.top + ", w=" + geometry.width + ",h=" + geometry.height + "; replace=" + videoBeingReplaced);

                  var video = document.createElement('video');
                  video.id = id;
                  video.active = true;
                  video.ready = false;
                  if (typeof videoBeingReplaced != 'undefined' && videoBeingReplaced != null)
                     {
                     video.videoBeingReplaced = videoBeingReplaced;
                     }
                  if (typeof onloadCallback == 'function')
                     {
                     video.onloadCallback = onloadCallback;
                     }
                  //UTIL.log(getVideoSummaryAsString(video));
                  video.setAttribute('src', src);
                  //UTIL.log("set src successfully");
                  if (areNativeVideoControlsVisible)
                     {
                     video.setAttribute('controls', true);
                     }
                  video.setAttribute('preload', true);
                  this.repositionVideo(video, geometry);
                  video.defaultPlaybackRate = video.playbackRate = playbackRate;
                  video.load();
                  video.style.display = 'inline';
                  video.style.position = 'absolute';
                  activeVideos[video.id] = video;
                  videoDiv.appendChild(video);
                  video.addEventListener('loadedmetadata', videoLoadedMetadata, false);
                  video.addEventListener('seeked', videoSeeked, false);
                  video.bwLastTime = UTIL.getCurrentTimeInSecs();
                  video.bwLastBuf = 0;
                  video.bandwidth = 0;
                  return video;
               };

            this.repositionVideo = function(video, geometry)
               {
                  //UTIL.log("video(" + video.id + ") reposition to left=" + geometry.left + ",top=" + geometry.top + ", w=" + geometry.width + ",h=" + geometry.height + "; ready="+video.ready);
                  // toFixed prevents going to scientific notation when close to zero;  this confuses the DOM
                  video.style.left = geometry.left.toFixed(4) - (video.ready ? 0 : 100000);
                  video.style.top = geometry.top.toFixed(4);

                  video.style.width = geometry.width;
                  video.style.height = geometry.height;
               };

            var garbageCollect = function()
               {
               var numInactiveVideos = 0;
               var idsOfVideosToDelete = [];
               for (var videoId in inactiveVideos)
                  {
                  numInactiveVideos++;
                  var candidate = inactiveVideos[videoId];
                  if (candidate.readyState >= 4 && !candidate.seeking)
                     {
                     idsOfVideosToDelete[idsOfVideosToDelete.length] = candidate.id;
                     }
                  else
                     {
                     UTIL.log("### NOT garbage collecting video ["+candidate.id+"] because readyState=["+candidate.readyState+"] and/or seeking=["+candidate.seeking+"]");
                     }
                  }

               if (numInactiveVideos == 0)
                  {
                  // shutdown the garbage collection timeout if there are no more inactive videos
                  clearInterval(garbageCollectionInterval);
                  garbageCollectionInterval = null;
                  UTIL.log("Stopped garbage collection");
                  }
               else
                  {
                  for (var i = 0; i < idsOfVideosToDelete.length; i++)
                     {
                     var id = idsOfVideosToDelete[i];
                     UTIL.log("garbage collecting video [" + id + "]");
                     var videoElement = document.getElementById(id);
                     if (videoElement)
                        {
                        videoDiv.removeChild(inactiveVideos[id]);
                        }
                     delete inactiveVideos[id];
                     }
                  }
               };

            var _deleteVideo = function(video)
               {
                  UTIL.log("video(" + video.id + ") delete");
                  video.active = false;
                  video.pause();
                  //UTIL.log(getVideoSummaryAsString(video));
                  video.removeAttribute('src');
                  //UTIL.log(getVideoSummaryAsString(video));
                  video.style.display = 'none';
                  //UTIL.log(getVideoSummaryAsString(video));
                  delete activeVideos[video.id];
                  inactiveVideos[video.id] = video;

                  if (garbageCollectionInterval == null)
                     {
                     garbageCollectionInterval = window.setInterval(garbageCollect, 100);
                     UTIL.log("Started garbage collection");
                     }
               };
            this.deleteVideo = _deleteVideo;

            ///////////////////////////
            // Time controls
            //

            var _isPaused = function()
               {
                  return paused;
               };

            this.isPaused = _isPaused;

            var _updateVideoAdvance = function()
               {
                 //UTIL.log("_updateVideoAdvance");
                 if (!advancing && !(paused || stalled))
                    {
                       //UTIL.log("resume advance");
                       // Resume advancing
                       var time = _getCurrentTime();
                       advancing = true;
                       _seek(time);

                       for (var videoId in activeVideos)
                          {
                          UTIL.log("video(" + videoId + ") play");
                          activeVideos[videoId].play();
                          }

                    }
                 else if (advancing && (paused || stalled))
                    {
                       //UTIL.log("stop advance");
                       // Stop advancing
                       var time = _getCurrentTime();
                       advancing = false;

                       for (var videoId in activeVideos)
                          {
                          UTIL.log("video(" + videoId + ") pause");
                          activeVideos[videoId].pause();
                          }

                       _seek(time);
                    }
                 else
                    {
                       UTIL.log("advance = " + !(paused || stalled));
                    }
               };
                    
            var _pause = function()
               {
                  if (!paused)
                     {
                     UTIL.log("videoset pause");
                     clearInterval(syncInterval);
                     paused = true;
                     _updateVideoAdvance();
                     unstall();
                     }
               };

            this.pause = _pause;

            this.play = function()
               {
                  if (paused)
                     {
                     UTIL.log("videoset play");
                     paused = false;
                     _updateVideoAdvance();
                     syncInterval = setInterval(sync, syncIntervalTime*1000);
                     }
               };

            this.getPlaybackRate = function()
               {
                  return playbackRate;
               };

            this.setPlaybackRate = function(rate)
               {
                  if (rate != playbackRate)
                     {
                     var t = _getCurrentTime();
                     playbackRate = rate;
                     _seek(t);
                     for (var videoId in activeVideos)
                        {
                        activeVideos[videoId].defaultPlaybackRate = activeVideos[videoId].playbackRate = rate;
                        }
                     }
               };

            var _seek = function(new_time)
               {
                  // Chrome workaround: always seek 1/4 frame in from beginning of frame to ensure video displays correct frame #
                  // Requires h.264 videos to be encoded with no B-frames
                  new_time = (Math.round(new_time * fps) + .25) / fps;
                  if (new_time != _getCurrentTime())
                     {
                     //UTIL.log("_getCurrentTime() was " + _getCurrentTime());
                     timeOffset = new_time - UTIL.getCurrentTimeInSecs() * (advancing ? playbackRate : 0);
                     //console.log("seek: timeOffset is " + timeOffset + ", frame " + timeOffset * 25);
                     //UTIL.log("_getCurrentTime() now " + _getCurrentTime());
                     sync(0.0);
                     }
               };
            this.seek = _seek;

            var _getCurrentTime = function()
               {
                  return timeOffset + UTIL.getCurrentTimeInSecs() * (advancing ? playbackRate : 0);
               };
            this.getCurrentTime = _getCurrentTime;

            ////////////////////////////////////////////////////////////////////////////////////////////////////////////
            //
            // Private methods
            //

            // This seems to get called pretty late in the game
            var videoLoadedMetadata = function(event)
               {
                  var video = event.target;
                  if (!video.active)
                     {
                     //UTIL.log("video(" + video.id + ") videoLoadedMetadata after deactivation!");
                     return;
                     }
                  if (!duration)
                     {
                     duration = video.duration;
                     }
                  UTIL.log("video(" + video.id + ") videoLoadedMetadata; seek to " + _getCurrentTime());
                  perfInitialSeeks++;
                  video.currentTime = leader+_getCurrentTime();
                  if (advancing)
                     {
                     video.play();
                     }
               };

            var _makeVideoVisible = function(video, callingFunction)
               {
               video.ready = true;
               video.style.left = parseFloat(video.style.left) + 100000;

               var error = video.currentTime - leader - _getCurrentTime();
               UTIL.log("_makeVideoVisible("+callingFunction+"): id=["+video.id+"] ready=["+video.ready+"] readyState=["+video.readyState+"] networkState=["+video.networkState+"] error=["+error+"]");

               // delete video which is being replaced, following the chain until we get to a null
               var videoToDelete = video.videoBeingReplaced;
               while (videoToDelete)
                  {
                  var nextVideoToDelete = videoToDelete.videoBeingReplaced;
                  videoToDelete.videoBeingReplaced = null;  // mark this as null to prevent multiple deletes
                  _deleteVideo(videoToDelete);
                  videoToDelete = nextVideoToDelete;
                  }

               // notify onload listener by calling the callback, if any
               if (video.onloadCallback)
                  {
                  try
                     {
                     video.onloadCallback();
                     }
                  catch(e)
                     {
                     UTIL.error(e.name + " while calling callback function for onload of video ["+video.src+"]: " + e.message, e);
                     }
                  }
               };

            var videoSeeked = function(event)
               {
               var video = event.target;

               if (!video.ready)
                  {
                  var checkVideoReadyState = function()
                     {
                     video.isWaitingOnReadyState = true;
                     if (video.readyState >= 3)
                        {
                        video.isWaitingOnReadyState = false;

                        _makeVideoVisible(video, "seek");
                        }
                     else
                        {
                        window.setTimeout(checkVideoReadyState, 10);
                        }
                     };

                  if (!video.isWaitingOnReadyState)
                     {
                     checkVideoReadyState();
                     }
                  }
               };

            // Call periodically, when video is running
            this.writeStatusToLog = function()
               {
                  var msg = "video status:";
                  for (var videoId1 in activeVideos)
                     {
                     msg += " " + getVideoSummaryAsString(activeVideos[videoId1]);
                     }
                  for (var videoId2 in inactiveVideos)
                     {
                     msg += " " + getVideoSummaryAsString(inactiveVideos[videoId2]);
                     }
                  UTIL.log(msg);
               };

            var getVideoSummaryAsString = function(video)
               {
                  var summary = video.id.toString();
                  summary += ":A=" + (video.active ? "y" : "n");
                  summary += ";N=" + video.networkState;
                  summary += ";R=" + video.readyState;
                  summary += ";P=" + (video.paused ? "y" : "n");
                  summary += ";S=" + (video.seeking ? "y" : "n");
                  summary += ";T=" + video.currentTime.toFixed(3);
                  summary += ";B=" + dumpTimerange(video.buffered);
                  summary += ";P=" + dumpTimerange(video.played);
                  summary += ";E=" + (video.error ? "y" : "n");
                  return summary;
               };

            var dumpTimerange = function(timerange)
               {
                  var ret = "{";
                  for (var i = 0; i < timerange.length; i++)
                     {
                     ret += timerange.start(i).toFixed(3) + "-" + timerange.end(i).toFixed(3);
                     }
                  ret += "}";
                  return ret;
               };

            var updateStallState = function()
               {
                 var nstalled = 0;
                  for (var videoId in activeVideos)
                     {
                     var video = activeVideos[videoId];
                     if (video.ready && video.readyState <= 2) nstalled++;
                     }
                 if (stalled && nstalled == 0) {
                   unstall();
                 } else if (!stalled && nstalled > 0) {
                   stall();
                 } else if (stalled) {
                   UTIL.log("Still stalled...");
                 }
               };

            var stall = function () {
               if (stalled) return;
               UTIL.log("Video stalling...");
               stalled = true;
               showSpinner();
               _updateVideoAdvance();
            };

            var unstall = function () {
               if (!stalled) return;
               UTIL.log("Video unstalled...");
               stalled = false;
               hideSpinner();
               _updateVideoAdvance();
            };

            var updateVideoBandwidth = function(video)
               {
                  var newTime = UTIL.getCurrentTimeInSecs();
                  var b = video.buffered;
                  var newBufferPosition = (b && b.length) ? b.end(b.length-1) : 0;
                  UTIL.log("newTime " + newTime + " video.bwLastTime " + video.bwLastTime);
                  var deltaTime = newTime - video.bwLastTime;
                  UTIL.log("newBufferPosition " + newBufferPosition + " video.bwLastBuf " + video.bwLastBuf);
                  var deltaBuffer = newBufferPosition - video.bwLastBuf;
                  video.bwLastTime = newTime;
                  video.bwLastBuf = newBufferPosition;
                  video.bandwidth = (deltaTime==0) ? 0 : deltaBuffer / deltaTime;
                  UTIL.log("bandwidth is " + video.bandwidth);
               };

            var sync = function(errorThreshold)
               {
                  //UTIL.log("sync");
                  if (errorThreshold == undefined)
                     {
                     errorThreshold = UTIL.isChrome() ? 0.005 : 0.04;
                     }

                  var t = _getCurrentTime();
                  if (t < 0)
                     {
                     _pause();
                     _seek(0);
                     return;
                     }
                  else if (t > duration)
                     {
                     _pause();
                     _seek(duration);
                     return;
                     }

                  //updateStallState();
                  //if (stalled) return;
                  
                  var ready_stats=[[],[],[],[],[]];
                  var not_ready_stats=[[],[],[],[],[]];
                  for (var videoId in activeVideos)
                     {
                     var video = activeVideos[videoId];
                     updateVideoBandwidth(video);
                     var error = video.currentTime - leader - t;
                     (video.ready ? ready_stats : not_ready_stats)[video.readyState].push(video.bandwidth.toFixed(0));
                     if (video.readyState >= 1 && Math.abs(error) > errorThreshold)
                        {  // HAVE_METADATA=1
                        perfTimeCorrections.push(error);
                        var rateTweak = 1 - error / syncIntervalTime;
                        if (!advancing || rateTweak < .25 || rateTweak > 2)
                           {
                           perfTimeSeeks++;
                           //UTIL.log("current time " + video.currentTime);
                           //UTIL.log("leader " + leader);
                           UTIL.log("Time correction: seeking video(" + videoId + ") from " + (video.currentTime-leader) + " to " + t + " (error=" + error + ", state=" + video.readyState + ")");
                           video.currentTime = leader + t + errorThreshold * .5; // seek ahead slightly
                           }
                        else
                           {
                           perfTimeTweaks++;
                           UTIL.log("Time correction: tweaking video(" + videoId + ") from " + (video.currentTime-leader) + " to " + t + " (error=" + error + ", rate=" + rateTweak + ", state=" + video.readyState + ")");
                           // Speed or slow video so that we'll be even by the next sync interval
                           video.playbackRate = playbackRate * rateTweak;
                           }
                        }
                     else
                        {
                        if (video.playbackRate != playbackRate) video.playbackRate = playbackRate;
                        //video.playbackRate = playbackRate;
                        if (!video.ready && video.readyState >= 3)
                           {
                           _makeVideoVisible(video, "sync");
                           }
                        }
                     }
                  var inactive_stats=[[],[],[],[],[]];
                  for (var videoId in inactiveVideos)
                     {
                     var video = inactiveVideos[videoId];
                     updateVideoBandwidth(video);
                     inactive_stats[video.readyState].push(video.bandwidth.toFixed(0));
                     }

                  UTIL.log("video readyStates.  ready: " + ready_stats.join('|') + "; not ready: " + not_ready_stats.join('|') + "; inactive: " + inactive_stats.join('|'));
                  for (var i = 0; i < syncListeners.length; i++)
                     {
                     try
                        {
                        syncListeners[i](t);
                        }
                     catch(e)
                        {
                        UTIL.error(e.name + " while executing videoset sync listener handler: " + e.message, e);
                        }
                     }
               };

            ////////////////////////////////////////////////////////////////////////////////////////////////////////////
            //
            // Constructor code
            //

            UTIL.log('Videoset() constructor');

            this.setStatusLoggingEnabled(false);
               
         };
   })();
