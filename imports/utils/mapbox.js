import mapboxgl from 'mapbox-gl';
import * as _ from 'underscore';
import * as L from 'leaflet';

const token = 'MAPBOX_TOKEN';

const MapBox = {

  maps: {},

  _callbacks: {},

  _created: new ReactiveVar(false),

  _ready(name, map) {
    _.each(this._callbacks[name], function(cb) {
      if (_.isFunction(cb)) {
        cb(map);
      }
    });
  },

  ready(name, cb) {
    if (!this._callbacks[name]) {
      this._callbacks[name] = [];
    }
    // make sure we run the callback only once
    // as the tilesloaded event will also run after initial load
    this._callbacks[name].push(_.once(cb));
    //     this._callbacks[name].push(cb);
  },

  // add a marker given our formatted marker data object
  addMarker(name, marker) {
    if (this.maps[name]) {
      let map = this.maps[name].instance;
      let markers = this.maps[name].markers;

      markers.push(marker);
      marker.addTo(map);
    }
  },

  addMarkers(name) {
    if (this.maps[name]) {
      const map = this.maps[name].instance;
      for (var i = 0; i < this.maps[name].markers.length; i++) {
        const marker = this.maps[name].markers[i];
        marker.addTo(map);
      }
    }
  },

  addPolyline(name, coords, options) {
    let map = this.maps[name].instance;
    let polylines = this.maps[name].polylines;

    polylines.push(options.name);

    map.addSource(options.name, {
      'type': 'geojson',
      'data': {
        'type': 'Feature',
        'properties': {},
        'geometry': {
          'type': 'LineString',
          'coordinates': coords,
        }
      }
    });

    map.addLayer({
      'id': options.name,
      'type': 'line',
      'source': options.name,
      'layout': {
        'line-join': 'round',
        'line-cap': 'round'
      },
      'paint': {
        'line-color': options.color,
        'line-width': options.weight,
      }
    });
  },

  //clear all markers
  clearMarkers(name) {
    if (this.maps[name]) {
      for (var i = 0; i < this.maps[name].markers.length; i++) {
        const marker = this.maps[name].markers[i];
        marker.remove();
      }
      this.maps[name].markers = [];
    }
  },

  clearPolylines(name) {
    if (this.maps[name]) {
      const map = this.maps[name].instance;
      console.log(this.maps[name].polylines);
      for (var i = 0; i < this.maps[name].polylines.length; i++) {
        const polyline = this.maps[name].polylines[i];
        console.log(polyline);
        if (map.getLayer(polyline)) {
          console.log('removing layer', polyline);
          map.removeLayer(polyline);
        }
        if (map.getSource(polyline)) {
          console.log('removing source', polyline);
          map.removeSource(polyline);
        }
      }
      this.maps[name].polylines = [];
    }
  },

  options(options) {
    var self = this;
    return function() {
      if (self.loaded())
        return options();
    };
  },

  get(name) {
    return this.maps[name];
  },

  _create(name, options) {
    var self = this;
    self.maps[name] = {
      instance: options.instance,
      options: options.options,
      markers: [],
      polylines: [],
      infoWindows: [],
      bounds: L.LatLngBounds(),
    };

    options.instance.on('load', function() {
      self._ready(name, self.maps[name]);
    });
    self._created.set(true);
  },

  created() {
    return this._created.get();
  },

  create(options) {
    // default to Map
    const type = options.type ? options.type : 'Map';

    let defaults = {
      zoom: 5,
      pitch: 0,
      bearing: 0,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [14.9706, 50.3785],
      showNavigation: false,
    };
    _.extend(defaults, options.options);

    mapboxgl.accessToken = token;
    var map = new mapboxgl.Map({
      container: options.element,
      style: defaults.style, // https://docs.mapbox.com/api/maps/styles/#mapbox-styles
      center: defaults.center, // starting position [lng, lat]
      zoom: defaults.zoom, // starting zoom
      pitch: defaults.pitch,
      bearing: defaults.bearing,
      trackResize: true,
      preserveDrawingBuffer: true,
      scrollZoom: Meteor.isCordoba ? false : true,
      attributionControl: false,
    }).addControl(
      new mapboxgl.AttributionControl({
        compact: true // reduces the copyright attributions view
      })
    );

    map.addControl(new mapboxgl.FullscreenControl());
    var nav = new mapboxgl.NavigationControl();
    map.addControl(nav, 'top-left');

    if (!options.showNavigation) {
      map.removeControl(nav);
    }

    if (defaults.style === 'mapbox://styles/mapbox/satellite-v9') {
      map.on('load', function() {
        map.resize();
        map.addSource('mapbox-dem', {
          'type': 'raster-dem',
          'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
          'tileSize': 512,
          'maxzoom': 14
        });
        map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
        map.addLayer({
          'id': 'sky',
          'type': 'sky',
          'paint': {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 90.0],
            'sky-atmosphere-sun-intensity': 15
          }
        });
      });
    }

    this._create(options.name, {
      type: type,
      instance: map,
      options: options.options
    });

  },

  destroy(name) {
    const self = this;

    self.maps[name].instance.remove();
    self.maps = _.omit(self.maps, name);
    self._callbacks = _.omit(self._callbacks, name);
    self._created.set(false);
  },

  setZoom(name, zoom) {
    this.maps[name].setZoom = zoom;
    //map.setOptions(options);
  },

  resetBounds(name, coordinates) {
    if (this.maps[name]) {
      let map = this.maps[name].instance;

      // Pass the first coordinates in the LineString to `lngLatBounds` &
      // wrap each coordinate pair in `extend` to include them in the bounds
      // result. A variation of this technique could be applied to zooming
      // to the bounds of multiple Points or Polygon geomteries - it just
      // requires wrapping all the coordinates with the extend method.
      var bounds = coordinates.reduce(function(bounds, coord) {
        return bounds.extend(coord);
      }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

      map.fitBounds(bounds, {
        padding: 25,
        duration: 1800,
        pitch: 0,
        bearing: 0,
        curve: 1,
        // this animation is considered essential with respect to prefers-reduced-motion
        essential: true
      });
    }
  },

  flyTo(name, options) {
    if (this.maps[name]) {
      const map = this.maps[name].instance;
      const coordinates = options.coordinates;
      const center = coordinates[Math.floor(coordinates.length / 2)];

      console.log(options, center);

      map.flyTo({
        center,
        duration: 4500,
        pitch: options.pitch || 0,
        bearing: options.bearing || 0,
        curve: 1,
        zoom: options.zoom || 10,
        essential: true,
        speed: 0.5,
        animate: true,
      });
    }
  },

  fitBounds(name, options) {
    if (this.maps[name]) {
      const map = this.maps[name].instance;
      const coordinates = options.coordinates;
      // Pass the first coordinates in the LineString to `lngLatBounds` &
      // wrap each coordinate pair in `extend` to include them in the bounds
      // result. A variation of this technique could be applied to zooming
      // to the bounds of multiple Points or Polygon geomteries - it just
      // requires wrapping all the coordinates with the extend method.
      const bounds = coordinates.reduce(function(bounds, coord) {
        return bounds.extend(coord);
      }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

      // map.setPitch(60);

      map.fitBounds(bounds, {
        padding: 25,
        duration: 5000,
        speed: 0.8,
        pitch: options.pitch,
        bearing: options.bearing,
        curve: 1,
        linear: false,
        easing(t) {
          return t;
        },
        // this animation is considered essential with respect to prefers-reduced-motion
        essential: true
      });
    }
  },
};

export default MapBox;