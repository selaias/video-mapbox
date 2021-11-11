import { Meteor } from 'meteor/meteor';
import $ from 'jquery';
import * as _ from 'underscore';
import * as L from 'leaflet';
import mapboxgl from 'mapbox-gl';
import CCapture from 'ccapture.js-npmfixed';

import MapBox from '/imports/utils/mapbox.js';

import html2canvas from '/imports/utils/html2canvas.js';
import './mapbox.html';


let intervalId;
let loaded_coordinates = [];
let animatedMarker;
let polys = [];

const polyline = "wl{iDinaqOcAmAS}@JmASwAmAw@}@uAo@eB}@m@aAyAaEgEo@eAq@u@Ss@o@_AMyAqAwAk@{@Co@y@qB{AuCa@g@s@wA_@g@_@{BLu@nB}AJYGyBNa@jCq@~@wARsBp@kBYaCF{ERwBlGoI|GkHlDwAjBaBtAg@N_@E_B@[lAoAD_@kA{Fd@_FxDwFjGmDz@sC^kEx@wDAAdDHbBdCnA]lAqEzC}CpAg@lBVpBdAlDe@|AXp@~@fA\\lBJzBgAxAcBb@S|An@t@M`BaCdD_DQcDdAu@zAd@l@o@k@iDRa@x@NXQ^}Cb@aC@gDOsIbAiMdBsXd@oMVkJr@yJ{@oDd@iCKgCxD}HtBmPdA{BPKh@JROV{@z@iAZkAdAgBn@uBrB}A~DeE`DcBbBiCpBeEbB_CvEaClEuG`D_EHQNiCpAaDR]JGTE^a@ZAXWb@kA`@eBlBgElBoFnDyNzAuBOcDeC}Gg@}FWOsAcDiCoDcABgFfBwC_A}A_CgDqA_@a@y@yCi@m@kA]eAOg@Ai@Li@A_@M_AFoAImA@wAXc@OqAt@wATiAD{Af@mAX{Bz@_FhAyIq@i@De@b@CHBV[tAy@rC_GrHqFxBeDW{An@a@@GDc@CKBcBzA";

Template.mapboxVideo.onCreated(function() {

});

Template.mapboxVideo.onRendered(function() {
  MapBox.create({
    name: 'animationMap',
    element: 'map',
    options: {
      center: [14.9706, 50.3785],
      zoom: 5,
      pitch: 0,
      bearing: 0,
      style: 'mapbox://styles/mapbox/satellite-v9',
    }
  });

  var qualityValueSpan = document.getElementById('qualityValue');
  var qualityInput = document.getElementById('quality');
  qualityValueSpan.innerHTML = qualityInput.value;
  qualityInput.addEventListener('change', function(e) {
    qualityValueSpan.innerHTML = e.target.value;
  });

  var frameRateValueSpan = document.getElementById('frameRateValue');
  var frameRateInput = document.getElementById('frameRate');
  frameRateValueSpan.innerHTML = frameRateInput.value;
  frameRateInput.addEventListener('change', function(e) {
    frameRateValueSpan.innerHTML = e.target.value;
  });

  var intervalValueSpan = document.getElementById('intervalValue');
  var intervalInput = document.getElementById('interval');
  intervalValueSpan.innerHTML = intervalInput.value + 'ms';
  intervalInput.addEventListener('change', function(e) {
    intervalValueSpan.innerHTML = e.target.value + ' ms';
  });

  var zoomValueSpan = document.getElementById('zoomValue');
  var zoomInput = document.getElementById('zoom');
  zoomValueSpan.innerHTML = 'Zoom Level ::' + zoomInput.value;
  zoomInput.addEventListener('change', function(e) {
    zoomValueSpan.innerHTML = 'Zoom Level ::' + e.target.value;
  });


  var animateLabel = document.getElementById('animateLabel');
  var animateValue = document.getElementById('animate');
  animateLabel.innerHTML = animateValue.checked ? 'Yes' : 'No';
  animateValue.addEventListener('change', function(e) {
    animateLabel.innerHTML = e.target.checked ? 'Yes' : 'No';
  });

  var animateMarkerLabel = document.getElementById('animateMarkerLabel');
  var animateMarkerValue = document.getElementById('animateMarker');
  animateMarkerLabel.innerHTML = animateMarkerValue.checked ? 'Yes' : 'No';
  animateMarkerValue.addEventListener('change', function(e) {
    animateMarkerLabel.innerHTML = e.target.checked ? 'Yes' : 'No';
  });
  const map = MapBox.maps['animationMap'].instance;

  map.on('load', () => {

    let points;
    let routePoints;

    const name = 'polyline';
    const isAnimated = true;

    let polyOptions = {
      color: '#f6201d',
      weight: 6,
      name,
    };

    const stravaPath = {
      distance: 8000,
      //start_latlng: result.start_latlng,
      //end_latlng: result.end_latlng,
      polyline: polyline,
      map: map,
      name: 'animationMap',
      polyOptions,
    };

    let poly = loadPolyline(stravaPath);
    polys.push({ name, poly, isAnimated, });

    // the below causes maximum call stack size exceeded 
    // as array can be too big
    // loaded_coordinates.push(...poly);
    for (const x of poly) loaded_coordinates.push(x);


    //Once everything is loadaded (polylines, markers) fitBounds
    // MapBox.fitBounds('animationMap', loaded_coordinates);
    const middlePoint = loaded_coordinates[Math.floor(loaded_coordinates.length / 2)];
    const zoom = Number(document.getElementById('zoom').value);
    const pitch = Number(document.getElementById('pitch').value);
    const bearing = Number(document.getElementById('bearing').value);

    map.flyTo({
      center: middlePoint,
      zoom,
      pitch,
      bearing,
      essential: true,
      speed: 0.5,
      curve: 1, // change the speed at which it zooms out
      animate: true,
    });

  });
});

Template.mapboxVideo.helpers({
  isMapLoaded() {
    // return ReactiveDataSource.get('RouteMapLoaded');
    return true;
  },
  interval() {
    let intervalValueSpan = document.getElementById('intervalValue');
    if (intervalValueSpan) {
      intervalValueSpan.innerHTML = 20 + ' ms';
    }
    return 100;
  },
  zoom() {
    let zoomValueSpan = $('#zoomValue');
    if (zoomValueSpan) {
      zoomValueSpan.text(8);
    }
    return 10;
  },
  bearing() {
    return 50;
  },
  pitch() {
    return 70;
  },
  step() {
    return 1;
  },
  isAnimateChecked() {
    let animateLabel = document.getElementById('animateLabel');
    if (animateLabel) {
      animateLabel.innerHTML = 'Yes';
    }
    return 'checked';
  },
  isAnimateMarkerChecked() {
    let animateMarkerLabel = document.getElementById('animateMarkerLabel');
    if (animateMarkerLabel) {
      animateMarkerLabel.innerHTML = 'Yes';
    }
    return 'checked';
  },
  imageUrl() {
    return '/img/TeamUmbaliUser.png';
  },
});

Template.mapboxVideo.events({
  'click #applyButton' (event, template) {
    event.preventDefault();
    event.stopPropagation();

    const zoom = Number(document.getElementById('zoom').value);
    const pitch = Number(document.getElementById('pitch').value);
    const bearing = Number(document.getElementById('bearing').value);

    const map = MapBox.maps['animationMap'].instance;

    // map.setPitch(pitch);
    // map.setZoom(zoom);
    // map.setBearing(bearing);

    map.panTo(map.getCenter(), {
      bearing,
      pitch,
      zoom,
      animate: true,
      essential: true,
    });

  },
  'click #animateButton' (event, template) {
    event.preventDefault();
    event.stopPropagation();

    let animateButton = document.querySelector('button#animateButton');

    if (animateButton.textContent === 'Animate') {
      animateButton.textContent = 'Stop';
    }
    else {
      if (intervalId) {
        Meteor.clearInterval(intervalId);
        // animatedMarker.remove();
        intervalId = null;
      }
      animateButton.textContent = 'Animate';
      return;
    }

    var easingFunctions = {
      easeIn(t) {
        return t;
      },
      // start slow and gradually increase speed
      easeInCubic(t) {
        return t * t * t;
      },
      // start fast with a long, slow wind-down
      easeOutQuint(t) {
        return 1 - Math.pow(1 - t, 5);
      },
      // slow start and finish with fast middle
      easeInOutCirc(t) {
        return t < 0.5 ?
          (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2 :
          (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
      },
      // fast start with a "bounce" at the end
      easeOutBounce(t) {
        var n1 = 7.5625;
        var d1 = 2.75;

        if (t < 1 / d1) {
          return n1 * t * t;
        }
        else if (t < 2 / d1) {
          return n1 * (t -= 1.5 / d1) * t + 0.75;
        }
        else if (t < 2.5 / d1) {
          return n1 * (t -= 2.25 / d1) * t + 0.9375;
        }
        else {
          return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
      }
    };

    var easingInput = document.getElementById('easing');
    var easingFn =
      easingFunctions[
        easingInput.options[easingInput.selectedIndex].value
      ];
    var animateValue = document.getElementById('animate');
    var isMapAnimated = animateValue.checked;

    var animatedMarkerValue = document.getElementById('animateMarker');
    var isMarkerAnimated = animatedMarkerValue.checked;

    // var videoValue = document.getElementById('video');
    var isVideoChecked = false; //videoValue.checked;

    var interval = Number(document.getElementById('interval').value);
    var zoom = Number(document.getElementById('zoom').value);
    var pitch = Number(document.getElementById('pitch').value);
    var bearing = Number(document.getElementById('bearing').value);
    var step = Number(document.getElementById('step').value);
    var quality = Number(document.getElementById('quality').value);
    var frameRate = Number(document.getElementById('frameRate').value);

    let animationOptions = {
      pitch,
      bearing,
      easing: easingFn,
      isMapAnimated,
      isMarkerAnimated,
      zoom,
      interval,
      step,
      essential: true,
      isVideoChecked,
      quality,
      frameRate,
    };

    let coveredDistance = 8000;
    let fullDistance = 8000;

    let iconUrl =Meteor.absoluteUrl() + '/img/TeamUmbaliUser.png';

    let el = document.createElement('div');
    el.className = 'marker-avatar';
    el.style.backgroundImage = 'url(' + iconUrl + ')';
    el.width = '25px';
    el.height = '25px';

    // add marker to map
    animatedMarker = new mapboxgl.Marker(el);

    if (coveredDistance < fullDistance) {
      coveredDistance = fullDistance;
    }

    Meteor.setTimeout(function() {
      intervalId = videoAnimationCapture('animationMap', polys, fullDistance, coveredDistance, animatedMarker, animationOptions);
    }, 3000);
  },
});

Template.mapboxVideo.onDestroyed(function() {
  if (intervalId) {
    Meteor.clearInterval(intervalId);
  }
  if (MapBox.maps['animationMap']) {
    MapBox.destroy('animationMap');
  }
});

const defaultOptions = (options) => {
  if (typeof options === 'number') {
    // Legacy
    options = {
      precision: options
    };
  }
  else {
    options = options || {};
  }

  options.precision = options.precision || 5;
  options.factor = options.factor || Math.pow(10, options.precision);
  options.dimension = options.dimension || 2;
  return options;
};

const PolylineUtil = {
  encode: function(points, options) {
    options = defaultOptions(options);

    var flatPoints = [];
    for (var i = 0, len = points.length; i < len; ++i) {
      var point = points[i];

      if (options.dimension === 2) {
        flatPoints.push(point.lat || point[0]);
        flatPoints.push(point.lng || point[1]);
      }
      else {
        for (var dim = 0; dim < options.dimension; ++dim) {
          flatPoints.push(point[dim]);
        }
      }
    }

    return this.encodeDeltas(flatPoints, options);
  },

  decode: function(encoded, options) {
    options = defaultOptions(options);

    var flatPoints = this.decodeDeltas(encoded, options);

    var points = [];
    for (var i = 0, len = flatPoints.length; i + (options.dimension - 1) < len;) {
      var point = [];

      for (var dim = 0; dim < options.dimension; ++dim) {
        point.push(flatPoints[i++]);
      }

      points.push(point);
    }

    return points;
  },

  encodeDeltas: function(numbers, options) {
    options = defaultOptions(options);

    var lastNumbers = [];

    for (var i = 0, len = numbers.length; i < len;) {
      for (var d = 0; d < options.dimension; ++d, ++i) {
        var num = numbers[i].toFixed(options.precision);
        var delta = num - (lastNumbers[d] || 0);
        lastNumbers[d] = num;

        numbers[i] = delta;
      }
    }

    return this.encodeFloats(numbers, options);
  },

  decodeDeltas: function(encoded, options) {
    options = defaultOptions(options);

    var lastNumbers = [];

    var numbers = this.decodeFloats(encoded, options);
    for (var i = 0, len = numbers.length; i < len;) {
      for (var d = 0; d < options.dimension; ++d, ++i) {
        numbers[i] = Math.round((lastNumbers[d] = numbers[i] + (lastNumbers[d] || 0)) * options.factor) / options.factor;
      }
    }

    return numbers;
  },

  encodeFloats: function(numbers, options) {
    options = defaultOptions(options);

    for (var i = 0, len = numbers.length; i < len; ++i) {
      numbers[i] = Math.round(numbers[i] * options.factor);
    }

    return this.encodeSignedIntegers(numbers);
  },

  decodeFloats: function(encoded, options) {
    options = defaultOptions(options);

    var numbers = this.decodeSignedIntegers(encoded);
    for (var i = 0, len = numbers.length; i < len; ++i) {
      numbers[i] /= options.factor;
    }

    return numbers;
  },

  encodeSignedIntegers: function(numbers) {
    for (var i = 0, len = numbers.length; i < len; ++i) {
      var num = numbers[i];
      numbers[i] = (num < 0) ? ~(num << 1) : (num << 1);
    }

    return this.encodeUnsignedIntegers(numbers);
  },

  decodeSignedIntegers: function(encoded) {
    var numbers = this.decodeUnsignedIntegers(encoded);

    for (var i = 0, len = numbers.length; i < len; ++i) {
      var num = numbers[i];
      numbers[i] = (num & 1) ? ~(num >> 1) : (num >> 1);
    }

    return numbers;
  },

  encodeUnsignedIntegers: function(numbers) {
    var encoded = '';
    for (var i = 0, len = numbers.length; i < len; ++i) {
      encoded += this.encodeUnsignedInteger(numbers[i]);
    }
    return encoded;
  },

  decodeUnsignedIntegers: function(encoded) {
    var numbers = [];

    var current = 0;
    var shift = 0;

    for (var i = 0, len = encoded.length; i < len; ++i) {
      var b = encoded.charCodeAt(i) - 63;

      current |= (b & 0x1f) << shift;

      if (b < 0x20) {
        numbers.push(current);
        current = 0;
        shift = 0;
      }
      else {
        shift += 5;
      }
    }

    return numbers;
  },

  encodeSignedInteger: function(num) {
    num = (num < 0) ? ~(num << 1) : (num << 1);
    return this.encodeUnsignedInteger(num);
  },

  // This function is very similar to Google's, but I added
  // some stuff to deal with the double slash issue.
  encodeUnsignedInteger: function(num) {
    var value, encoded = '';
    while (num >= 0x20) {
      value = (0x20 | (num & 0x1f)) + 63;
      encoded += (String.fromCharCode(value));
      num >>= 5;
    }
    value = num + 63;
    encoded += (String.fromCharCode(value));

    return encoded;
  }
};

const videoAnimationCapture = (name, polys, fullDistance, coveredDistance, marker, animationOptions) => {
  let defaults = {
    pitch: 40,
    bearing: 0,
    easing: function(t) { return t },
    isMapAnimated: false,
    isMarkerAnimated: false,
    essential: true,
    zoom: 10,
    step: 20,
    interval: 20,
    isVideoChecked: false,
    quality: 100,
    frameRate: 60,
  };

  defaults = _.extend(defaults, animationOptions);

  const map = MapBox.get(name).instance;
  let recordedBlobs;
  let capturer;
  let doRecordVideo = defaults.isVideoChecked;

  const canvas = map.getCanvas();
  const video = document.querySelector('video');

  const recordButton = document.querySelector('button#record');
  const playButton = document.querySelector('button#play');
  const downloadButton = document.querySelector('button#download');
  recordButton.onclick = toggleRecording;
  playButton.onclick = play;
  downloadButton.onclick = download;

  function toggleRecording() {
    if (recordButton.textContent === 'Start Recording') {
      console.log('Video recording started!');
      startRecording();
    }
    else {
      stopRecording();
      console.log('Video recording stopped!');
      recordButton.textContent = 'Start Recording';
      playButton.disabled = false;
      downloadButton.disabled = false;
    }
  }

  function startRecording() {
    const videoOptions = {
      format: 'webm',
      quality: defaults.quality,
      framerate: defaults.frameRate,
      verbose: true,
    };

    console.log('VideoOptions', videoOptions);

    capturer = new CCapture(videoOptions);
    doRecordVideo = true;
    recordButton.textContent = 'Stop Recording';
    playButton.disabled = true;
    downloadButton.disabled = true;
    capturer.start();
    console.log('CCapture started');
  }

  function stopRecording() {
    doRecordVideo = false;
    capturer.stop();
    // capturer.save();
    capturer.save(function(blob) {
      recordedBlobs = blob;
      video.src = window.URL.createObjectURL(blob);
      console.log('Recorded Blobs: ', blob);
    });

    video.controls = true;
  }

  function play() {
    video.play();
  }

  function download() {
    const blob = recordedBlobs;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'animation.webm';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }

  let polyToAnimate = _.find(polys, function(p) {
    return p.isAnimated === true;
  });

  const pathLength = polyToAnimate.poly.length;
  const ratio = Number((coveredDistance / fullDistance) * 100, 2);
  const pointsRatio = Number(pathLength * (ratio / 100), 0);

  const step = defaults.step; //Number((pathLength / 50) / 10, 0);
  // save full coordinate list for later
  let coordinates = polyToAnimate.poly;

  // start by showing just the first coordinate
  let coords = [coordinates[0]];
  const firstPoint = coordinates[0];
  const lastPoint = coordinates[pathLength - 1];
  const middlePoint = coordinates[Math.floor(pathLength / 2)];

  console.log(`Map :: ${polyToAnimate.name} 
    Points :: ${pathLength} 
    Distance :: ${fullDistance} 
    Covered :: ${coveredDistance} 
    Ratio :: ${ratio} 
    PointsRatio :: ${pointsRatio}
    Step :: ${step}`);

  if (map.getLayer('trace')) {
    map.removeLayer('trace');
  }
  if (map.getSource('trace')) {
    map.removeSource('trace');
  }

  let route = {
    "type": "FeatureCollection",
    "features": [{
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": coords,
      }
    }]
  };

  // add it to the map
  map.addSource('trace', { type: 'geojson', data: route });
  map.addLayer({
    'id': 'trace',
    'type': 'line',
    'source': 'trace',
    'paint': {
      'line-color': '#4b549c',
      'line-opacity': 1,
      'line-width': 5
    }
  });

  let point = {
    'type': 'FeatureCollection',
    'features': [{
      'type': 'Feature',
      'properties': {},
      'geometry': {
        'type': 'Point',
        'coordinates': firstPoint,
      }
    }]
  };


  // setup the viewport
  map.setPitch(defaults.pitch);
  map.setBearing(defaults.bearing);

  if (defaults.isVideoChecked) {
    startRecording();
  }

  if (defaults.isMarkerAnimated) {
    addMarkerPoint(firstPoint);
    // marker.setLngLat(firstPoint);
    // MapBox.addMarker(name, marker);
  }
  if (defaults.isMapAnimated) {
    map.flyTo({
      center: firstPoint,
      zoom: defaults.zoom,
      essential: true,
      speed: 0.5,
      curve: 1, // change the speed at which it zooms out
      animate: true,
      easing: defaults.easing,
    });
  }

  // on a regular basis, add more coordinates from the saved list and update the map
  let i = 0;
  let timer = Meteor.setInterval(function() {
    if (i < coordinates.length && i < pointsRatio) {
      route.features[0].geometry.coordinates.push(
        coordinates[i]
      );
      map.getSource('trace').setData(route);

      if (defaults.isMarkerAnimated) {
        if (map.getSource('point')) {
          point.features[0].geometry.coordinates = coordinates[i];
          map.getSource('point').setData(point);
        }
      }

      // if camera follows
      if (defaults.isMapAnimated) {
        map.panTo(coordinates[i], {
          curve: 1,
          bearing: defaults.bearing,
          pitch: defaults.pitch,
          easing: defaults.easing,
          // zoom: defaults.zoom,
          animate: true,
          essential: true,
        });
      }
      //if animate the Marker
      // if (defaults.isMarkerAnimated) {
      //   marker.setLngLat(coordinates[i]);
      // }

      if (doRecordVideo) {
        capturer.capture(canvas);
      }
      i = i + step;
    }
    else {
      Meteor.clearInterval(timer);
      // marker.setLngLat(lastPoint);

      // if (!defaults.isMarkerAnimated) {
      //   MapBox.addMarker(name, marker);
      // }

      map.flyTo({
        center: middlePoint,
        zoom: defaults.zoom,
        pitch: defaults.pitch,
        bearing: defaults.bearing,
        essential: true,
        speed: 0.5,
        curve: 1, // change the speed at which it zooms out
        animate: true,
        easing: defaults.easing,
      });

      if (doRecordVideo) {
        Meteor.setTimeout(function() {
          toggleRecording();
        }, 3000);
      }
    }
  }, defaults.interval);

  return timer;
};

const addMarkerPoint = (firstPoint) => {
  const map = MapBox.maps['animationMap'].instance;

  if (map.getLayer('point')) {
    map.removeLayer('point');
  }

  if (map.getSource('point')) {
    map.removeSource('point');
  }

  html2canvas(document.getElementById('original'), { allowTaint: true, useCORS: true, backgroundColor: "rgba(0,0,0,0)" }).then(canvas => {
    const imgUrl = canvas.toDataURL();

    let point = {
      'type': 'FeatureCollection',
      'features': [{
        'type': 'Feature',
        'properties': {},
        'geometry': {
          'type': 'Point',
          'coordinates': firstPoint,
        }
      }]
    };

    map.loadImage(
      imgUrl,
      function(error, image) {
        if (error) throw error;

        // if (map.hasImage('marker')) map.removeImage('marker');
        if (!map.hasImage('marker')) {
          map.addImage('marker', image);
        }

        map.addSource('point', {
          'type': 'geojson',
          'data': point
        });
        map.addLayer({
          'id': 'point',
          'type': 'symbol',
          'source': 'point',
          'layout': {
            'icon-image': 'marker',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true
          }
        });
      });
  }).catch(e => {
    console.log(e);
  });
};

const loadPolyline = (options) => {
  let defaults = {
    color: '#4b549c',
    weight: 4,
    name: 'route',
  };
  let decodePath = PolylineUtil.decode(options.polyline);
  let polyOptions = _.extend(defaults, options.polyOptions);

  let coords = [];

  decodePath.forEach(c => {
    if (c[0] && c[1]) {
      let lnglat = [c[1], c[0]];
      coords.push(lnglat);
    }
  });

  MapBox.addPolyline(options.name, coords, polyOptions);

  return coords;
};
