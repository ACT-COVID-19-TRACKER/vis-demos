(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const moment = require('moment');
const mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');
const palette = require('google-palette');

mapboxgl.accessToken =
  "pk.eyJ1Ijoia2F0aHlyZWlkIiwiYSI6ImNrODgyMTN1ZjAwamQzbW1za3Qwa2VhM20ifQ.t2zzot1Qhgqf-EzMAhIFgQ";

const map = new mapboxgl.Map({
  container: "map", // container element id
  style: "mapbox://styles/mapbox/light-v10",
  center: [149.119, -35.28], // initial map center in [lon, lat]
  zoom: 15
});

map.addControl(new mapboxgl.NavigationControl());

// this function returns an array of 2-element [ts, "#color"] arrays
const calculateColorStops = (minTs, maxTs, numStops) => {
  const colors = palette('cb-BrBG', numStops);
  return colors.map((c, i) => [minTs+(maxTs-minTs)*(i/colors.length), `#${c}`]);
}

// c'mon mapbox, surely there's a better way to do this...
const createWidgets = (minTs, maxTs, numStops) => {
  // colour legend
  const table = document.getElementById("legend");
  table.innerHTML = ""; // remove existing legend, if present

  const swatches = document.createElement("tr");

  for (let stop of calculateColorStops(minTs, maxTs, numStops)) {
	const swatch = document.createElement("td");
	swatch.style.background = stop[1];
	swatch.innerHTML = moment(stop[0]).format("MMMM D");
	swatches.appendChild(swatch);
  }

  table.appendChild(swatches);

  const slider = document.getElementById("slider");
  slider.min = minTs;
  slider.max = maxTs;
  slider.value = minTs; // start at min value

  // TODO should debounce this...
  slider.addEventListener("input", function(e) {
	const ts = parseInt(e.target.value, 10);
	filterDotsInTimeWindow(ts, ts == minTs);
  });
};

const filterDotsInTimeWindow = (ts, reset) => {
  if (reset) {
	map.setFilter("track-and-trace", null);
	document.getElementById(
	  "time-window-centrepoint"
	).textContent = "all time";
  } else {
	const windowSize = 1 * 60 * 60 * 1000; // 2 hours total (ts +/- 1hr)

	map.setFilter("track-and-trace", [
	  "all",
	  [">", "time", ts - windowSize / 2],
	  ["<", "time", ts + windowSize / 2]
	]);

	// Set the label to the month
	document.getElementById(
	  "time-window-centrepoint"
	).textContent = moment(ts).format("h:mma ddd MMM D") + " (+/- 1hr)";
  }
};

const getTimeBounds = (geoJsonData) => {
  times = geoJsonData.features.map(f => f.properties.time);
  return [Math.min(...times), Math.max(...times)];
}

map.on("load", function() {
  // first, fetch the data
  // do this separately so we can set up the legend as well
  fetch("data/raw-data.geojson")
	.then(response => response.json())
	.then(geoData => {

	  const timeRange = getTimeBounds(geoData);
	  const numColorStops = 4;
	  const colorStops = calculateColorStops(timeRange[0], timeRange[1], numColorStops);

	  createWidgets(timeRange[0], timeRange[1], numColorStops);

	  // set up the map
	  map.addLayer({
		id: "track-and-trace",
		type: "circle",
		source: {
		  type: "geojson",
		  data: geoData
		},
		paint: {
		  "circle-radius": 7,
		  "circle-stroke-color": "white",
		  "circle-stroke-width": 1,
		  "circle-color": [
			"interpolate",
			["linear"],
			["get", "time"],
			...colorStops.flat() // don't get too clever, Ben...
		  ],
		  "circle-opacity": 0.8
		}
	  });
	});
});

},{"google-palette":2,"mapbox-gl/dist/mapbox-gl.js":3,"moment":4}],2:[function(require,module,exports){
/** @license
 *
 *     Colour Palette Generator script.
 *     Copyright (c) 2014 Google Inc.
 *
 *     Licensed under the Apache License, Version 2.0 (the "License"); you may
 *     not use this file except in compliance with the License.  You may
 *     obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing, software
 *     distributed under the License is distributed on an "AS IS" BASIS,
 *     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
 *     implied.  See the License for the specific language governing
 *     permissions and limitations under the License.
 *
 * Furthermore, ColorBrewer colour schemes are covered by the following:
 *
 *     Copyright (c) 2002 Cynthia Brewer, Mark Harrower, and
 *                        The Pennsylvania State University.
 *
 *     Licensed under the Apache License, Version 2.0 (the "License"); you may
 *     not use this file except in compliance with the License. You may obtain
 *     a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing, software
 *     distributed under the License is distributed on an "AS IS" BASIS,
 *     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
 *     implied. See the License for the specific language governing
 *     permissions and limitations under the License.
 *
 *     Redistribution and use in source and binary forms, with or without
 *     modification, are permitted provided that the following conditions are
 *     met:
 *
 *     1. Redistributions as source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *
 *     2. The end-user documentation included with the redistribution, if any,
 *     must include the following acknowledgment: "This product includes color
 *     specifications and designs developed by Cynthia Brewer
 *     (http://colorbrewer.org/)." Alternately, this acknowledgment may appear
 *     in the software itself, if and wherever such third-party
 *     acknowledgments normally appear.
 *
 *     4. The name "ColorBrewer" must not be used to endorse or promote products
 *     derived from this software without prior written permission. For written
 *     permission, please contact Cynthia Brewer at cbrewer@psu.edu.
 *
 *     5. Products derived from this software may not be called "ColorBrewer",
 *     nor may "ColorBrewer" appear in their name, without prior written
 *     permission of Cynthia Brewer.
 *
 * Furthermore, Solarized colour schemes are covered by the following:
 *
 *     Copyright (c) 2011 Ethan Schoonover
 *
 *     Permission is hereby granted, free of charge, to any person obtaining
 *     a copy of this software and associated documentation files (the
 *     "Software"), to deal in the Software without restriction, including
 *     without limitation the rights to use, copy, modify, merge, publish,
 *     distribute, sublicense, and/or sell copies of the Software, and to
 *     permit persons to whom the Software is furnished to do so, subject to
 *     the following conditions:
 *
 *     The above copyright notice and this permission notice shall be included
 *     in all copies or substantial portions of the Software.
 *
 *     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 *     OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 *     MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 *     NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 *     LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 *     OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 *     WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

'use strict';

var palette = (function() {

  var proto = Array.prototype;
  var slice = function(arr, opt_begin, opt_end) {
    return proto.slice.apply(arr, proto.slice.call(arguments, 1));
  };

  var extend = function(arr, arr2) {
    return proto.push.apply(arr, arr2);
  };

  var function_type = typeof function() {};

  var INF = 1000000000;  // As far as we're concerned, that's infinity. ;)


  /**
   * Generate a colour palette from given scheme.
   *
   * If scheme argument is not a function it is passed to palettes.listSchemes
   * function (along with the number argument).  This may result in an array
   * of more than one available scheme.  If that is the case, scheme at
   * opt_index position is taken.
   *
   * This allows using different palettes for different data without having to
   * name the schemes specifically, for example:
   *
   *     palette_for_foo = palette('sequential', 10, 0);
   *     palette_for_bar = palette('sequential', 10, 1);
   *     palette_for_baz = palette('sequential', 10, 2);
   *
   * @param {!palette.SchemeType|string|palette.Palette} scheme Scheme to
   *     generate palette for.  Either a function constructed with
   *     palette.Scheme object, or anything that palette.listSchemes accepts
   *     as name argument.
   * @param {number} number Number of colours to return.  If negative, absolute
   *     value is taken and colours will be returned in reverse order.
   * @param {number=} opt_index If scheme is a name of a group or an array and
   *     results in more than one scheme, index of the scheme to use.  The
   *     index wraps around.
   * @param {...*} varargs Additional arguments to pass to palette or colour
   *     generator (if the chosen scheme uses those).
   * @return {Array<string>} Array of abs(number) 'RRGGBB' strings or null if
   *     no matching scheme was found.
   */
  var palette = function(scheme, number, opt_index, varargs) {
    number |= 0;
    if (number == 0) {
      return [];
    }

    if (typeof scheme !== function_type) {
      var arr = palette.listSchemes(
          /** @type {string|palette.Palette} */ (scheme), number);
      if (!arr.length) {
        return null;
      }
      scheme = arr[(opt_index || 0) % arr.length];
    }

    var args = slice(arguments, 2);
    args[0] = number;
    return scheme.apply(scheme, args);
  };


  /**
   * Returns a callable colour scheme object.
   *
   * Just after being created, the scheme has no colour palettes and no way of
   * generating any, thus generate method will return null.  To turn scheme
   * into a useful object, addPalette, addPalettes or setColorFunction methods
   * need to be used.
   *
   * To generate a colour palette with given number colours using function
   * returned by this method, just call it with desired number of colours.
   *
   * Since this function *returns* a callable object, it must *not* be used
   * with the new operator.
   *
   * @param {string} name Name of the scheme.
   * @param {string|!Array<string>=} opt_groups A group name or list of
   *     groups the scheme should be categorised under.  Three typical groups
   *     to use are 'qualitative', 'sequential' and 'diverging', but any
   *     groups may be created.
   * @return {!palette.SchemeType} A colour palette generator function, which
   *     in addition has methods and properties like a regular object.  Think
   *     of it as a callable object.
   */
  palette.Scheme = function(name, opt_groups) {
    /**
     * A map from a number to a colour palettes with given number of colours.
     * @type {!Object<number, palette.Palette>}
     */
    var palettes = {};

    /**
     * The biggest palette in palettes map.
     * @type {number}
     */
    var palettes_max = 0;

    /**
     * The smallest palette in palettes map.
     * @type {number}
     */
    var palettes_min = INF;

    var makeGenerator = function() {
      if (arguments.length <= 1) {
        return self.color_func.bind(self);
      } else {
        var args = slice(arguments);
        return function(x) {
          args[0] = x;
          return self.color_func.apply(self, args);
        };
      }
    };

    /**
     * Generate a colour palette from the scheme.
     *
     * If there was a palette added with addPalette (or addPalettes) with
     * enough colours, that palette will be used.  Otherwise, if colour
     * function has been set using setColorFunction method, that function will
     * be used to generate the palette.  Otherwise null is returned.
     *
     * @param {number} number Number of colours to return.  If negative,
     *     absolute value is taken and colours will be returned in reverse
     *     order.
     * @param {...*} varargs Additional arguments to pass to palette or colour
     *     generator (if the chosen scheme uses those).
     */
    var self = function(number, varargs) {
      number |= 0;
      if (!number) {
        return [];
      }

      var _number = number;
      number = Math.abs(number);

      if (number <= palettes_max) {
        for (var i = Math.max(number, palettes_min); !(i in palettes); ++i) {
          /* nop */
        }
        var colors = palettes[i];
        if (i > number) {
          var take_head =
              'shrinking_takes_head' in colors ?
              colors.shrinking_takes_head : self.shrinking_takes_head;
          if (take_head) {
            colors = colors.slice(0, number);
            i = number;
          } else {
            return palette.generate(
                function(x) { return colors[Math.round(x)]; },
                _number, 0, colors.length - 1);
          }
        }
        colors = colors.slice();
        if (_number < 0) {
          colors.reverse();
        }
        return colors;

      } else if (self.color_func) {
        return palette.generate(makeGenerator.apply(self, arguments),
                                _number, 0, 1, self.color_func_cyclic);

      } else {
        return null;
      }
    };

    /**
     * The name of the palette.
     * @type {string}
     */
    self.scheme_name = name;

    /**
     * A list of groups the palette belongs to.
     * @type {!Array<string>}
     */
    self.groups = opt_groups ?
      typeof opt_groups === 'string' ? [opt_groups] : opt_groups : [];

    /**
     * The biggest palette this scheme can generate.
     * @type {number}
     */
    self.max = 0;

    /**
     * The biggest palette this scheme can generate that is colour-blind
     * friendly.
     * @type {number}
     */
    self.cbf_max = INF;


    /**
     * Adds a colour palette to the colour scheme.
     *
     * @param {palette.Palette} palette An array of 'RRGGBB' strings
     *     representing the palette to add.
     * @param {boolean=} opt_is_cbf Whether the palette is colourblind friendly.
     */
    self.addPalette = function(palette, opt_is_cbf) {
      var len = palette.length;
      if (len) {
        palettes[len] = palette;
        palettes_min = Math.min(palettes_min, len);
        palettes_max = Math.max(palettes_max, len);
        self.max = Math.max(self.max, len);
        if (!opt_is_cbf && len != 1) {
          self.cbf_max = Math.min(self.cbf_max, len - 1);
        }
      }
    };

    /**
     * Adds number of colour palettes to the colour scheme.
     *
     * @param {palette.PalettesList} palettes A map or an array of colour
     *     palettes to add.  If map, i.e.  object, is used, properties should
     *     use integer property names.
     * @param {number=} opt_max Size of the biggest palette in palettes set.
     *     If not set, palettes must have a length property which will be used.
     * @param {number=} opt_cbf_max Size of the biggest palette which is still
     *     colourblind friendly.  1 by default.
     */
    self.addPalettes = function(palettes, opt_max, opt_cbf_max) {
      opt_max = opt_max || palettes.length;
      for (var i = 0; i < opt_max; ++i) {
        if (i in palettes) {
          self.addPalette(palettes[i], true);
        }
      }
      self.cbf_max = Math.min(self.cbf_max, opt_cbf_max || 1);
    };

    /**
     * Enable shrinking palettes taking head of the list of colours.
     *
     * When user requests n-colour palette but the smallest palette added with
     * addPalette (or addPalettes) is m-colour one (where n < m), n colours
     * across the palette will be returned.  For example:
     *     var ex = palette.Scheme('ex');
     *     ex.addPalette(['000000', 'bcbcbc', 'ffffff']);
     *     var pal = ex(2);
     *     // pal == ['000000', 'ffffff']
     *
     * This works for palettes where the distance between colours is
     * correlated to distance in the palette array, which is true in gradients
     * such as the one above.
     *
     * To turn this feature off shrinkByTakingHead can be set to true either
     * for all palettes in the scheme (if opt_idx is not given) or for palette
     * with given number of colours only.  In general, setting the option for
     * given palette overwrites whatever has been set for the scheme.  The
     * default, as described above, is false.
     *
     * Alternatively, the feature can be enabled by setting shrinking_takes_head
     * property for the palette Array or the scheme object.
     *
     * For example, all of the below give equivalent results:
     *     var pal = ['ff0000', '00ff00', '0000ff'];
     *
     *     var ex = palette.Scheme('ex');
     *     ex.addPalette(pal);               // ex(2) == ['ff0000', '0000ff']
     *     ex.shrinkByTakingHead(true);      // ex(2) == ['ff0000', '00ff00']
     *
     *     ex = palette.Scheme('ex');
     *     ex.addPalette(pal);               // ex(2) == ['ff0000', '0000ff']
     *     ex.shrinkByTakingHead(true, 3);   // ex(2) == ['ff0000', '00ff00']
     *
     *     ex = palette.Scheme('ex');
     *     ex.addPalette(pal);
     *     ex.addPalette(pal);               // ex(2) == ['ff0000', '0000ff']
     *     pal.shrinking_takes_head = true;  // ex(2) == ['ff0000', '00ff00']
     *
     * @param {boolean} enabled Whether to enable or disable the “shrinking
     *     takes head” feature.  It is disabled by default.
     * @param {number=} opt_idx If given, the “shrinking takes head” option
     *     for palette with given number of colours is set.  If such palette
     *     does not exist, nothing happens.
     */
    self.shrinkByTakingHead = function(enabled, opt_idx) {
      if (opt_idx !== void(0)) {
        if (opt_idx in palettes) {
          palettes[opt_idx].shrinking_takes_head = !!enabled;
        }
      } else {
        self.shrinking_takes_head = !!enabled;
      }
    };

    /**
     * Sets a colour generation function of the colour scheme.
     *
     * The function must accept a singe number argument whose value can be from
     * 0.0 to 1.0, and return a colour as an 'RRGGBB' string.  This function
     * will be used when generating palettes, i.e. if 11-colour palette is
     * requested, this function will be called with arguments 0.0, 0.1, …, 1.0.
     *
     * If the palette generated by the function is colourblind friendly,
     * opt_is_cbf should be set to true.
     *
     * In some cases, it is not desirable to reach 1.0 when generating
     * a palette.  This happens for hue-rainbows where the 0–1 range corresponds
     * to a 0°–360° range in hues, and since hue at 0° is the same as at 360°,
     * it's desired to stop short the end of the range when generating
     * a palette.  To accomplish this, opt_cyclic should be set to true.
     *
     * @param {palette.ColorFunction} func A colour generator function.
     * @param {boolean=} opt_is_cbf Whether palette generate with the function
     *     is colour-blind friendly.
     * @param {boolean=} opt_cyclic Whether colour at 0.0 is the same as the
     *     one at 1.0.
     */
    self.setColorFunction = function(func, opt_is_cbf, opt_cyclic) {
      self.color_func = func;
      self.color_func_cyclic = !!opt_cyclic;
      self.max = INF;
      if (!opt_is_cbf && self.cbf_max === INF) {
        self.cbf_max = 1;
      }
    };

    self.color = function(x, varargs) {
      if (self.color_func) {
        return self.color_func.apply(this, arguments);
      } else {
        return null;
      }
    };

    return self;
  };


  /**
   * Creates a new palette.Scheme and initialises it by calling addPalettes
   * method with the rest of the arguments.
   *
   * @param {string} name Name of the scheme.
   * @param {string|!Array<string>} groups A group name or list of group
   *     names the scheme belongs to.
   * @param {!Object<number, palette.Palette>|!Array<palette.Palette>}
   *     palettes A map or an array of colour palettes to add.  If map, i.e.
   *     object, is used, properties should use integer property names.
   * @param {number=} opt_max Size of the biggest palette in palettes set.
   *     If not set, palettes must have a length property which will be used.
   * @param {number=} opt_cbf_max Size of the biggest palette which is still
   *     colourblind friendly.  1 by default.
   * @return {!palette.SchemeType} A colour palette generator function, which
   *     in addition has methods and properties like a regular object.  Think
   *     of it as a callable object.
   */
  palette.Scheme.fromPalettes = function(name, groups,
                                         palettes, opt_max, opt_cbf_max) {
    var scheme = palette.Scheme(name, groups);
    scheme.addPalettes.apply(scheme, slice(arguments, 2));
    return scheme;
  };


  /**
   * Creates a new palette.Scheme and initialises it by calling
   * setColorFunction method with the rest of the arguments.
   *
   * @param {string} name Name of the scheme.
   * @param {string|!Array<string>} groups A group name or list of group
   *     names the scheme belongs to.
   * @param {palette.ColorFunction} func A colour generator function.
   * @param {boolean=} opt_is_cbf Whether palette generate with the function
   *     is colour-blind friendly.
   * @param {boolean=} opt_cyclic Whether colour at 0.0 is the same as the
   *     one at 1.0.
   * @return {!palette.SchemeType} A colour palette generator function, which
   *     in addition has methods and properties like a regular object.  Think
   *     of it as a callable object.
   */
  palette.Scheme.withColorFunction = function(name, groups,
                                              func, opt_is_cbf, opt_cyclic) {
    var scheme = palette.Scheme(name, groups);
    scheme.setColorFunction.apply(scheme, slice(arguments, 2));
    return scheme;
  };


  /**
   * A map of registered schemes.  Maps a scheme or group name to a list of
   * scheme objects.  Property name is either 'n-<name>' for single scheme
   * names or 'g-<name>' for scheme group names.
   *
   * @type {!Object<string, !Array<!Object>>}
   */
  var registered_schemes = {};


  /**
   * Registers a new colour scheme.
   *
   * @param {!palette.SchemeType} scheme The scheme to add.
   */
  palette.register = function(scheme) {
    registered_schemes['n-' + scheme.scheme_name] = [scheme];
    scheme.groups.forEach(function(g) {
      (registered_schemes['g-' + g] =
       registered_schemes['g-' + g] || []).push(scheme);
    });
    (registered_schemes['g-all'] =
       registered_schemes['g-all'] || []).push(scheme);
  };


  /**
   * List all schemes that match given name and number of colours.
   *
   * name argument can be either a string or an array of strings.  In the
   * former case, the function acts as if the argument was an array with name
   * as a single argument (i.e. “palette.listSchemes('foo')” is exactly the same
   * as “palette.listSchemes(['foo'])”).
   *
   * Each name can be either name of a palette (e.g. 'tol-sq' for Paul Tol's
   * sequential palette), or a name of a group (e.g. 'sequential' for all
   * sequential palettes).  Name can therefore map to a single scheme or
   * several schemes.
   *
   * Furthermore, name can be suffixed with '-cbf' to indicate that only
   * schemes that are colourblind friendly should be returned.  For example,
   * 'rainbow' returns a HSV rainbow scheme, but because it is not colourblind
   * friendly, 'rainbow-cbf' returns no schemes.
   *
   * Some schemes may produce colourblind friendly palettes for some number of
   * colours.  For example ColorBrewer's Dark2 scheme is colourblind friendly
   * if no more than 3 colours are generated.  If opt_number is not specified,
   * 'qualitative-cbf' will include 'cb-Dark2' but if opt_number is given as,
   * say, 5 it won't.
   *
   * Name can also be 'all' which will return all registered schemes.
   * Naturally, 'all-cbf' will return all colourblind friendly schemes.
   *
   * Schemes are added to the library using palette.register.  Schemes are
   * created using palette.Scheme function.  By default, the following schemes
   * are available:
   *
   *     Name            Description
   *     --------------  -----------------------------------------------------
   *     tol             Paul Tol's qualitative scheme, cbf, max 12 colours.
   *     tol-dv          Paul Tol's diverging scheme, cbf.
   *     tol-sq          Paul Tol's sequential scheme, cbf.
   *     tol-rainbow     Paul Tol's qualitative scheme, cbf.
   *
   *     rainbow         A rainbow palette.
   *
   *     cb-YlGn         ColorBrewer sequential schemes.
   *     cb-YlGnBu
   *     cb-GnBu
   *     cb-BuGn
   *     cb-PuBuGn
   *     cb-PuBu
   *     cb-BuPu
   *     cb-RdPu
   *     cb-PuRd
   *     cb-OrRd
   *     cb-YlOrRd
   *     cb-YlOrBr
   *     cb-Purples
   *     cb-Blues
   *     cb-Greens
   *     cb-Oranges
   *     cb-Reds
   *     cb-Greys
   *
   *     cb-PuOr         ColorBrewer diverging schemes.
   *     cb-BrBG
   *     cb-PRGn
   *     cb-PiYG
   *     cb-RdBu
   *     cb-RdGy
   *     cb-RdYlBu
   *     cb-Spectral
   *     cb-RdYlGn
   *
   *     cb-Accent       ColorBrewer qualitative schemes.
   *     cb-Dark2
   *     cb-Paired
   *     cb-Pastel1
   *     cb-Pastel2
   *     cb-Set1
   *     cb-Set2
   *     cb-Set3
   *
   *     sol-base        Solarized base colours.
   *     sol-accent      Solarized accent colours.
   *
   * The following groups are also available by default:
   *
   *     Name            Description
   *     --------------  -----------------------------------------------------
   *     all             All registered schemes.
   *     sequential      All sequential schemes.
   *     diverging       All diverging schemes.
   *     qualitative     All qualitative schemes.
   *     cb-sequential   All ColorBrewer sequential schemes.
   *     cb-diverging    All ColorBrewer diverging schemes.
   *     cb-qualitative  All ColorBrewer qualitative schemes.
   *
   * You can read more about Paul Tol's palettes at http://www.sron.nl/~pault/.
   * You can read more about ColorBrewer at http://colorbrewer2.org.
   *
   * @param {string|!Array<string>} name A name of a colour scheme, of
   *     a group of colour schemes, or an array of any of those.
   * @param {number=} opt_number When requesting only colourblind friendly
   *     schemes, number of colours the scheme must provide generating such
   *     that the palette is still colourblind friendly.  2 by default.
   * @return {!Array<!palette.SchemeType>} An array of colour scheme objects
   *     matching the criteria.  Sorted by scheme name.
   */
  palette.listSchemes = function(name, opt_number) {
    if (!opt_number) {
      opt_number = 2;
    } else if (opt_number < 0) {
      opt_number = -opt_number;
    }

    var ret = [];
    (typeof name === 'string' ? [name] : name).forEach(function(n) {
      var cbf = n.substring(n.length - 4) === '-cbf';
      if (cbf) {
        n = n.substring(0, n.length - 4);
      }
      var schemes =
          registered_schemes['g-' + n] ||
          registered_schemes['n-' + n] ||
          [];
      for (var i = 0, scheme; (scheme = schemes[i]); ++i) {
        if ((cbf ? scheme.cbf : scheme.max) >= opt_number) {
          ret.push(scheme);
        }
      }
    });

    ret.sort(function(a, b) {
      return a.scheme_name >= b.scheme_name ?
        a.scheme_name > b.scheme_name ? 1 : 0 : -1;
    });
    return ret;
  };


  /**
   * Generates a palette using given colour generating function.
   *
   * The color_func callback must accept a singe number argument whose value
   * can vary from 0.0 to 1.0 (or in general from opt_start to opt_end), and
   * return a colour as an 'RRGGBB' string.  This function will be used when
   * generating palettes, i.e. if 11-colour palette is requested, this
   * function will be called with arguments 0.0, 0.1, …, 1.0.
   *
   * In some cases, it is not desirable to reach 1.0 when generating
   * a palette.  This happens for hue-rainbows where the 0–1 range corresponds
   * to a 0°–360° range in hues, and since hue at 0° is the same as at 360°,
   * it's desired to stop short the end of the range when generating
   * a palette.  To accomplish this, opt_cyclic should be set to true.
   *
   * opt_start and opt_end may be used to change the range the colour
   * generation function is called with.  opt_end may be less than opt_start
   * which will case to traverse the range in reverse.  Another way to reverse
   * the palette is requesting negative number of colours.  The two methods do
   * not always lead to the same results (especially if opt_cyclic is set).
   *
   * @param {palette.ColorFunction} color_func A colours generating callback
   *     function.
   * @param {number} number Number of colours to generate in the palette.  If
   *     number is negative, colours in the palette will be reversed.  If only
   *     one colour is requested, colour at opt_start will be returned.
   * @param {number=} opt_start Optional starting point for the palette
   *     generation function.  Zero by default.
   * @param {number=} opt_end Optional ending point for the palette generation
   *     function.  One by default.
   * @param {boolean=} opt_cyclic If true, function will assume colour at
   *     point opt_start is the same as one at opt_end.
   * @return {palette.Palette} An array of 'RRGGBB' colours.
   */
  palette.generate = function(color_func, number, opt_start, opt_end,
                              opt_cyclic) {
    if (Math.abs(number) < 1) {
      return [];
    }

    opt_start = opt_start === void(0) ? 0 : opt_start;
    opt_end = opt_end === void(0) ? 1 : opt_end;

    if (Math.abs(number) < 2) {
      return [color_func(opt_start)];
    }

    var i = Math.abs(number);
    var x = opt_start;
    var ret = [];
    var step = (opt_end - opt_start) / (opt_cyclic ? i : (i - 1));

    for (; --i >= 0; x += step) {
      ret.push(color_func(x));
    }
    if (number < 0) {
      ret.reverse();
    }
    return ret;
  };


  /**
   * Clamps value to [0, 1] range.
   * @param {number} v Number to limit value of.
   * @return {number} If v is inside of [0, 1] range returns v, otherwise
   *     returns 0 or 1 depending which side of the range v is closer to.
   */
  var clamp = function(v) {
    return v > 0 ? (v < 1 ? v : 1) : 0;
  };

  /**
   * Converts r, g, b triple into RRGGBB hex representation.
   * @param {number} r Red value of the colour in the range [0, 1].
   * @param {number} g Green value of the colour in the range [0, 1].
   * @param {number} b Blue value of the colour in the range [0, 1].
   * @return {string} A lower-case RRGGBB representation of the colour.
   */
  palette.rgbColor = function(r, g, b) {
    return [r, g, b].map(function(v) {
      v = Number(Math.round(clamp(v) * 255)).toString(16);
      return v.length == 1 ? '0' + v : v;
    }).join('');
  };

  /**
   * Converts a linear r, g, b triple into RRGGBB hex representation.
   * @param {number} r Linear red value of the colour in the range [0, 1].
   * @param {number} g Linear green value of the colour in the range [0, 1].
   * @param {number} b Linear blue value of the colour in the range [0, 1].
   * @return {string} A lower-case RRGGBB representation of the colour.
   */
  palette.linearRgbColor = function(r, g, b) {
    // http://www.brucelindbloom.com/index.html?Eqn_XYZ_to_RGB.html
    return [r, g, b].map(function(v) {
      v = clamp(v);
      if (v <= 0.0031308) {
        v = 12.92 * v;
      } else {
        v = 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
      }
      v = Number(Math.round(v * 255)).toString(16);
      return v.length == 1 ? '0' + v : v;
    }).join('');
  };

  /**
   * Converts an HSV colours to RRGGBB hex representation.
   * @param {number} h Hue in the range [0, 1].
   * @param {number=} opt_s Saturation in the range [0, 1].  One by default.
   * @param {number=} opt_v Value in the range [0, 1].  One by default.
   * @return {string} An RRGGBB representation of the colour.
   */
  palette.hsvColor = function(h, opt_s, opt_v) {
    h *= 6;
    var s = opt_s === void(0) ? 1 : clamp(opt_s);
    var v = opt_v === void(0) ? 1 : clamp(opt_v);
    var x = v * (1 - s * Math.abs(h % 2 - 1));
    var m = v * (1 - s);
    switch (Math.floor(h) % 6) {
    case 0: return palette.rgbColor(v, x, m);
    case 1: return palette.rgbColor(x, v, m);
    case 2: return palette.rgbColor(m, v, x);
    case 3: return palette.rgbColor(m, x, v);
    case 4: return palette.rgbColor(x, m, v);
    default: return palette.rgbColor(v, m, x);
    }
  };

  palette.register(palette.Scheme.withColorFunction(
    'rainbow', 'qualitative', palette.hsvColor, false, true));

  return palette;
})();


/** @typedef {function(number): string} */
palette.ColorFunction;

/** @typedef {!Array<string>} */
palette.Palette;

/** @typedef {!Object<number, palette.Palette>|!Array<palette.Palette>} */
palette.PalettesList;

/**
 * @typedef {
 *   function(number, ...?): Array<string>|
 *   {
 *     scheme_name: string,
 *     groups: !Array<string>,
 *     max: number,
 *     cbf_max: number,
 *     addPalette: function(!Array<string>, boolean=),
 *     addPalettes: function(palette.PalettesList, number=, number=),
 *     shrinkByTakingHead: function(boolean, number=),
 *     setColorFunction: function(palette.ColorFunction, boolean=, boolean=),
 *     color: function(number, ...?): ?string}}
 */
palette.SchemeType;


/* mpn65 palette start here. ************************************************/

/* The ‘mpn65’ palette is designed for systems which show many graphs which
   don’t have custom colour palettes chosen by humans or if number of necessary
   colours isn’t know a priori. */

(function() {
  var scheme = palette.Scheme.fromPalettes('mpn65', 'qualitative', [[
    'ff0029', '377eb8', '66a61e', '984ea3', '00d2d5', 'ff7f00', 'af8d00',
    '7f80cd', 'b3e900', 'c42e60', 'a65628', 'f781bf', '8dd3c7', 'bebada',
    'fb8072', '80b1d3', 'fdb462', 'fccde5', 'bc80bd', 'ffed6f', 'c4eaff',
    'cf8c00', '1b9e77', 'd95f02', 'e7298a', 'e6ab02', 'a6761d', '0097ff',
    '00d067', '000000', '252525', '525252', '737373', '969696', 'bdbdbd',
    'f43600', '4ba93b', '5779bb', '927acc', '97ee3f', 'bf3947', '9f5b00',
    'f48758', '8caed6', 'f2b94f', 'eff26e', 'e43872', 'd9b100', '9d7a00',
    '698cff', 'd9d9d9', '00d27e', 'd06800', '009f82', 'c49200', 'cbe8ff',
    'fecddf', 'c27eb6', '8cd2ce', 'c4b8d9', 'f883b0', 'a49100', 'f48800',
    '27d0df', 'a04a9b'
  ]]);
  scheme.shrinkByTakingHead(true);
  palette.register(scheme);
})();

/* Paul Tol's schemes start here. *******************************************/
/* See http://www.sron.nl/~pault/ */

(function() {
  var rgb = palette.rgbColor;

  /**
   * Calculates value of a polynomial at given point.
   * For example, poly(x, 1, 2, 3) calculates value of “1 + 2*x + 3*X²”.
   * @param {number} x Value to calculate polynomial for.
   * @param {...number} varargs Coefficients of the polynomial specified in
   *     the order of rising powers of x including constant as the first
   *     variable argument.
   */
  var poly = function(x, varargs) {
    var i = arguments.length - 1, n = arguments[i];
    while (i > 1) {
      n = n * x + arguments[--i];
    }
    return n;
  };

  /**
   * Calculate approximate value of error function with maximum error of 0.0005.
   * See <https://en.wikipedia.org/wiki/Error_function>.
   * @param {number} x Argument of the error function.
   * @return {number} Value of error function for x.
   */
  var erf = function(x) {
    // https://en.wikipedia.org/wiki/Error_function#Approximation_with_elementary_functions
    // This produces a maximum error of 0.0005 which is more then we need.  In
    // the worst case, that error is multiplied by four and then divided by two
    // before being multiplied by 255, so in the end, the error is multiplied by
    // 510 which produces 0.255 which is less than a single colour step.
    var y = poly(Math.abs(x), 1, 0.278393, 0.230389, 0.000972, 0.078108);
    y *= y; // y^2
    y *= y; // y^4
    y = 1 - 1 / y;
    return x < 0 ? -y : y;
  };

  palette.register(palette.Scheme.fromPalettes('tol', 'qualitative', [
    ['4477aa'],
    ['4477aa', 'cc6677'],
    ['4477aa', 'ddcc77', 'cc6677'],
    ['4477aa', '117733', 'ddcc77', 'cc6677'],
    ['332288', '88ccee', '117733', 'ddcc77', 'cc6677'],
    ['332288', '88ccee', '117733', 'ddcc77', 'cc6677', 'aa4499'],
    ['332288', '88ccee', '44aa99', '117733', 'ddcc77', 'cc6677', 'aa4499'],
    ['332288', '88ccee', '44aa99', '117733', '999933', 'ddcc77', 'cc6677',
     'aa4499'],
    ['332288', '88ccee', '44aa99', '117733', '999933', 'ddcc77', 'cc6677',
     '882255', 'aa4499'],
    ['332288', '88ccee', '44aa99', '117733', '999933', 'ddcc77', '661100',
     'cc6677', '882255', 'aa4499'],
    ['332288', '6699cc', '88ccee', '44aa99', '117733', '999933', 'ddcc77',
     '661100', 'cc6677', '882255', 'aa4499'],
    ['332288', '6699cc', '88ccee', '44aa99', '117733', '999933', 'ddcc77',
     '661100', 'cc6677', 'aa4466', '882255', 'aa4499']
  ], 12, 12));

  /**
   * Calculates a colour along Paul Tol's sequential colours axis.
   * See <http://www.sron.nl/~pault/colourschemes.pdf> figure 7 and equation 1.
   * @param {number} x Position of the colour on the axis in the [0, 1] range.
   * @return {string} An RRGGBB representation of the colour.
   */
  palette.tolSequentialColor = function(x) {
    return rgb(1 - 0.392 * (1 + erf((x - 0.869) / 0.255)),
               1.021 - 0.456 * (1 + erf((x - 0.527) / 0.376)),
               1 - 0.493 * (1 + erf((x - 0.272) / 0.309)));
  };

  palette.register(palette.Scheme.withColorFunction(
    'tol-sq', 'sequential', palette.tolSequentialColor, true));

  /**
   * Calculates a colour along Paul Tol's diverging colours axis.
   * See <http://www.sron.nl/~pault/colourschemes.pdf> figure 8 and equation 2.
   * @param {number} x Position of the colour on the axis in the [0, 1] range.
   * @return {string} An RRGGBB representation of the colour.
   */
  palette.tolDivergingColor = function(x) {
    var g = poly(x, 0.572, 1.524, -1.811) / poly(x, 1, -0.291, 0.1574);
    return rgb(poly(x, 0.235, -2.13, 26.92, -65.5, 63.5, -22.36),
               g * g,
               1 / poly(x, 1.579, -4.03, 12.92, -31.4, 48.6, -23.36));
  };

  palette.register(palette.Scheme.withColorFunction(
    'tol-dv', 'diverging', palette.tolDivergingColor, true));

  /**
   * Calculates a colour along Paul Tol's rainbow colours axis.
   * See <http://www.sron.nl/~pault/colourschemes.pdf> figure 13 and equation 3.
   * @param {number} x Position of the colour on the axis in the [0, 1] range.
   * @return {string} An RRGGBB representation of the colour.
   */
  palette.tolRainbowColor = function(x) {
    return rgb(poly(x, 0.472, -0.567, 4.05) / poly(x, 1, 8.72, -19.17, 14.1),
               poly(x, 0.108932, -1.22635, 27.284, -98.577, 163.3, -131.395,
                    40.634),
               1 / poly(x, 1.97, 3.54, -68.5, 243, -297, 125));
  };

  palette.register(palette.Scheme.withColorFunction(
    'tol-rainbow', 'qualitative', palette.tolRainbowColor, true));
})();


/* Solarized colour schemes start here. *************************************/
/* See http://ethanschoonover.com/solarized */

(function() {
  /*
   * Those are not really designed to be used in graphs, but we're keeping
   * them here in case someone cares.
   */
  palette.register(palette.Scheme.fromPalettes('sol-base', 'sequential', [
    ['002b36', '073642', '586e75', '657b83', '839496', '93a1a1', 'eee8d5',
     'fdf6e3']
  ], 1, 8));
  palette.register(palette.Scheme.fromPalettes('sol-accent', 'qualitative', [
    ['b58900', 'cb4b16', 'dc322f', 'd33682', '6c71c4', '268bd2', '2aa198',
     '859900']
  ]));
})();


/* ColorBrewer colour schemes start here. ***********************************/
/* See http://colorbrewer2.org/ */

(function() {
  var schemes = {
    YlGn: {
      type: 'sequential',
      cbf: 42,
      3: ['f7fcb9', 'addd8e', '31a354'],
      4: ['ffffcc', 'c2e699', '78c679', '238443'],
      5: ['ffffcc', 'c2e699', '78c679', '31a354', '006837'],
      6: ['ffffcc', 'd9f0a3', 'addd8e', '78c679', '31a354', '006837'],
      7: ['ffffcc', 'd9f0a3', 'addd8e', '78c679', '41ab5d', '238443',
          '005a32'],
      8: ['ffffe5', 'f7fcb9', 'd9f0a3', 'addd8e', '78c679', '41ab5d',
          '238443', '005a32'],
      9: ['ffffe5', 'f7fcb9', 'd9f0a3', 'addd8e', '78c679', '41ab5d',
          '238443', '006837', '004529']
    },
    YlGnBu: {
      type: 'sequential',
      cbf: 42,
      3: ['edf8b1', '7fcdbb', '2c7fb8'],
      4: ['ffffcc', 'a1dab4', '41b6c4', '225ea8'],
      5: ['ffffcc', 'a1dab4', '41b6c4', '2c7fb8', '253494'],
      6: ['ffffcc', 'c7e9b4', '7fcdbb', '41b6c4', '2c7fb8', '253494'],
      7: ['ffffcc', 'c7e9b4', '7fcdbb', '41b6c4', '1d91c0', '225ea8',
          '0c2c84'],
      8: ['ffffd9', 'edf8b1', 'c7e9b4', '7fcdbb', '41b6c4', '1d91c0',
          '225ea8', '0c2c84'],
      9: ['ffffd9', 'edf8b1', 'c7e9b4', '7fcdbb', '41b6c4', '1d91c0',
          '225ea8', '253494', '081d58']
    },
    GnBu: {
      type: 'sequential',
      cbf: 42,
      3: ['e0f3db', 'a8ddb5', '43a2ca'],
      4: ['f0f9e8', 'bae4bc', '7bccc4', '2b8cbe'],
      5: ['f0f9e8', 'bae4bc', '7bccc4', '43a2ca', '0868ac'],
      6: ['f0f9e8', 'ccebc5', 'a8ddb5', '7bccc4', '43a2ca', '0868ac'],
      7: ['f0f9e8', 'ccebc5', 'a8ddb5', '7bccc4', '4eb3d3', '2b8cbe',
          '08589e'],
      8: ['f7fcf0', 'e0f3db', 'ccebc5', 'a8ddb5', '7bccc4', '4eb3d3',
          '2b8cbe', '08589e'],
      9: ['f7fcf0', 'e0f3db', 'ccebc5', 'a8ddb5', '7bccc4', '4eb3d3',
          '2b8cbe', '0868ac', '084081']
    },
    BuGn: {
      type: 'sequential',
      cbf: 42,
      3: ['e5f5f9', '99d8c9', '2ca25f'],
      4: ['edf8fb', 'b2e2e2', '66c2a4', '238b45'],
      5: ['edf8fb', 'b2e2e2', '66c2a4', '2ca25f', '006d2c'],
      6: ['edf8fb', 'ccece6', '99d8c9', '66c2a4', '2ca25f', '006d2c'],
      7: ['edf8fb', 'ccece6', '99d8c9', '66c2a4', '41ae76', '238b45',
          '005824'],
      8: ['f7fcfd', 'e5f5f9', 'ccece6', '99d8c9', '66c2a4', '41ae76',
          '238b45', '005824'],
      9: ['f7fcfd', 'e5f5f9', 'ccece6', '99d8c9', '66c2a4', '41ae76',
          '238b45', '006d2c', '00441b']
    },
    PuBuGn: {
      type: 'sequential',
      cbf: 42,
      3: ['ece2f0', 'a6bddb', '1c9099'],
      4: ['f6eff7', 'bdc9e1', '67a9cf', '02818a'],
      5: ['f6eff7', 'bdc9e1', '67a9cf', '1c9099', '016c59'],
      6: ['f6eff7', 'd0d1e6', 'a6bddb', '67a9cf', '1c9099', '016c59'],
      7: ['f6eff7', 'd0d1e6', 'a6bddb', '67a9cf', '3690c0', '02818a',
          '016450'],
      8: ['fff7fb', 'ece2f0', 'd0d1e6', 'a6bddb', '67a9cf', '3690c0',
          '02818a', '016450'],
      9: ['fff7fb', 'ece2f0', 'd0d1e6', 'a6bddb', '67a9cf', '3690c0',
          '02818a', '016c59', '014636']
    },
    PuBu: {
      type: 'sequential',
      cbf: 42,
      3: ['ece7f2', 'a6bddb', '2b8cbe'],
      4: ['f1eef6', 'bdc9e1', '74a9cf', '0570b0'],
      5: ['f1eef6', 'bdc9e1', '74a9cf', '2b8cbe', '045a8d'],
      6: ['f1eef6', 'd0d1e6', 'a6bddb', '74a9cf', '2b8cbe', '045a8d'],
      7: ['f1eef6', 'd0d1e6', 'a6bddb', '74a9cf', '3690c0', '0570b0',
          '034e7b'],
      8: ['fff7fb', 'ece7f2', 'd0d1e6', 'a6bddb', '74a9cf', '3690c0',
          '0570b0', '034e7b'],
      9: ['fff7fb', 'ece7f2', 'd0d1e6', 'a6bddb', '74a9cf', '3690c0',
          '0570b0', '045a8d', '023858']
    },
    BuPu: {
      type: 'sequential',
      cbf: 42,
      3: ['e0ecf4', '9ebcda', '8856a7'],
      4: ['edf8fb', 'b3cde3', '8c96c6', '88419d'],
      5: ['edf8fb', 'b3cde3', '8c96c6', '8856a7', '810f7c'],
      6: ['edf8fb', 'bfd3e6', '9ebcda', '8c96c6', '8856a7', '810f7c'],
      7: ['edf8fb', 'bfd3e6', '9ebcda', '8c96c6', '8c6bb1', '88419d',
          '6e016b'],
      8: ['f7fcfd', 'e0ecf4', 'bfd3e6', '9ebcda', '8c96c6', '8c6bb1',
          '88419d', '6e016b'],
      9: ['f7fcfd', 'e0ecf4', 'bfd3e6', '9ebcda', '8c96c6', '8c6bb1',
          '88419d', '810f7c', '4d004b']
    },
    RdPu: {
      type: 'sequential',
      cbf: 42,
      3: ['fde0dd', 'fa9fb5', 'c51b8a'],
      4: ['feebe2', 'fbb4b9', 'f768a1', 'ae017e'],
      5: ['feebe2', 'fbb4b9', 'f768a1', 'c51b8a', '7a0177'],
      6: ['feebe2', 'fcc5c0', 'fa9fb5', 'f768a1', 'c51b8a', '7a0177'],
      7: ['feebe2', 'fcc5c0', 'fa9fb5', 'f768a1', 'dd3497', 'ae017e',
          '7a0177'],
      8: ['fff7f3', 'fde0dd', 'fcc5c0', 'fa9fb5', 'f768a1', 'dd3497',
          'ae017e', '7a0177'],
      9: ['fff7f3', 'fde0dd', 'fcc5c0', 'fa9fb5', 'f768a1', 'dd3497',
          'ae017e', '7a0177', '49006a']
    },
    PuRd: {
      type: 'sequential',
      cbf: 42,
      3: ['e7e1ef', 'c994c7', 'dd1c77'],
      4: ['f1eef6', 'd7b5d8', 'df65b0', 'ce1256'],
      5: ['f1eef6', 'd7b5d8', 'df65b0', 'dd1c77', '980043'],
      6: ['f1eef6', 'd4b9da', 'c994c7', 'df65b0', 'dd1c77', '980043'],
      7: ['f1eef6', 'd4b9da', 'c994c7', 'df65b0', 'e7298a', 'ce1256',
          '91003f'],
      8: ['f7f4f9', 'e7e1ef', 'd4b9da', 'c994c7', 'df65b0', 'e7298a',
          'ce1256', '91003f'],
      9: ['f7f4f9', 'e7e1ef', 'd4b9da', 'c994c7', 'df65b0', 'e7298a',
          'ce1256', '980043', '67001f']
    },
    OrRd: {
      type: 'sequential',
      cbf: 42,
      3: ['fee8c8', 'fdbb84', 'e34a33'],
      4: ['fef0d9', 'fdcc8a', 'fc8d59', 'd7301f'],
      5: ['fef0d9', 'fdcc8a', 'fc8d59', 'e34a33', 'b30000'],
      6: ['fef0d9', 'fdd49e', 'fdbb84', 'fc8d59', 'e34a33', 'b30000'],
      7: ['fef0d9', 'fdd49e', 'fdbb84', 'fc8d59', 'ef6548', 'd7301f',
          '990000'],
      8: ['fff7ec', 'fee8c8', 'fdd49e', 'fdbb84', 'fc8d59', 'ef6548',
          'd7301f', '990000'],
      9: ['fff7ec', 'fee8c8', 'fdd49e', 'fdbb84', 'fc8d59', 'ef6548',
          'd7301f', 'b30000', '7f0000']
    },
    YlOrRd: {
      type: 'sequential',
      cbf: 42,
      3: ['ffeda0', 'feb24c', 'f03b20'],
      4: ['ffffb2', 'fecc5c', 'fd8d3c', 'e31a1c'],
      5: ['ffffb2', 'fecc5c', 'fd8d3c', 'f03b20', 'bd0026'],
      6: ['ffffb2', 'fed976', 'feb24c', 'fd8d3c', 'f03b20', 'bd0026'],
      7: ['ffffb2', 'fed976', 'feb24c', 'fd8d3c', 'fc4e2a', 'e31a1c',
          'b10026'],
      8: ['ffffcc', 'ffeda0', 'fed976', 'feb24c', 'fd8d3c', 'fc4e2a',
          'e31a1c', 'b10026'],
      9: ['ffffcc', 'ffeda0', 'fed976', 'feb24c', 'fd8d3c', 'fc4e2a',
          'e31a1c', 'bd0026', '800026']
    },
    YlOrBr: {
      type: 'sequential',
      cbf: 42,
      3: ['fff7bc', 'fec44f', 'd95f0e'],
      4: ['ffffd4', 'fed98e', 'fe9929', 'cc4c02'],
      5: ['ffffd4', 'fed98e', 'fe9929', 'd95f0e', '993404'],
      6: ['ffffd4', 'fee391', 'fec44f', 'fe9929', 'd95f0e', '993404'],
      7: ['ffffd4', 'fee391', 'fec44f', 'fe9929', 'ec7014', 'cc4c02',
          '8c2d04'],
      8: ['ffffe5', 'fff7bc', 'fee391', 'fec44f', 'fe9929', 'ec7014',
          'cc4c02', '8c2d04'],
      9: ['ffffe5', 'fff7bc', 'fee391', 'fec44f', 'fe9929', 'ec7014',
          'cc4c02', '993404', '662506']
    },
    Purples: {
      type: 'sequential',
      cbf: 42,
      3: ['efedf5', 'bcbddc', '756bb1'],
      4: ['f2f0f7', 'cbc9e2', '9e9ac8', '6a51a3'],
      5: ['f2f0f7', 'cbc9e2', '9e9ac8', '756bb1', '54278f'],
      6: ['f2f0f7', 'dadaeb', 'bcbddc', '9e9ac8', '756bb1', '54278f'],
      7: ['f2f0f7', 'dadaeb', 'bcbddc', '9e9ac8', '807dba', '6a51a3',
          '4a1486'],
      8: ['fcfbfd', 'efedf5', 'dadaeb', 'bcbddc', '9e9ac8', '807dba',
          '6a51a3', '4a1486'],
      9: ['fcfbfd', 'efedf5', 'dadaeb', 'bcbddc', '9e9ac8', '807dba',
          '6a51a3', '54278f', '3f007d']
    },
    Blues: {
      type: 'sequential',
      cbf: 42,
      3: ['deebf7', '9ecae1', '3182bd'],
      4: ['eff3ff', 'bdd7e7', '6baed6', '2171b5'],
      5: ['eff3ff', 'bdd7e7', '6baed6', '3182bd', '08519c'],
      6: ['eff3ff', 'c6dbef', '9ecae1', '6baed6', '3182bd', '08519c'],
      7: ['eff3ff', 'c6dbef', '9ecae1', '6baed6', '4292c6', '2171b5',
          '084594'],
      8: ['f7fbff', 'deebf7', 'c6dbef', '9ecae1', '6baed6', '4292c6',
          '2171b5', '084594'],
      9: ['f7fbff', 'deebf7', 'c6dbef', '9ecae1', '6baed6', '4292c6',
          '2171b5', '08519c', '08306b']
    },
    Greens: {
      type: 'sequential',
      cbf: 42,
      3: ['e5f5e0', 'a1d99b', '31a354'],
      4: ['edf8e9', 'bae4b3', '74c476', '238b45'],
      5: ['edf8e9', 'bae4b3', '74c476', '31a354', '006d2c'],
      6: ['edf8e9', 'c7e9c0', 'a1d99b', '74c476', '31a354', '006d2c'],
      7: ['edf8e9', 'c7e9c0', 'a1d99b', '74c476', '41ab5d', '238b45',
          '005a32'],
      8: ['f7fcf5', 'e5f5e0', 'c7e9c0', 'a1d99b', '74c476', '41ab5d',
          '238b45', '005a32'],
      9: ['f7fcf5', 'e5f5e0', 'c7e9c0', 'a1d99b', '74c476', '41ab5d',
          '238b45', '006d2c', '00441b']
    },
    Oranges: {
      type: 'sequential',
      cbf: 42,
      3: ['fee6ce', 'fdae6b', 'e6550d'],
      4: ['feedde', 'fdbe85', 'fd8d3c', 'd94701'],
      5: ['feedde', 'fdbe85', 'fd8d3c', 'e6550d', 'a63603'],
      6: ['feedde', 'fdd0a2', 'fdae6b', 'fd8d3c', 'e6550d', 'a63603'],
      7: ['feedde', 'fdd0a2', 'fdae6b', 'fd8d3c', 'f16913', 'd94801',
          '8c2d04'],
      8: ['fff5eb', 'fee6ce', 'fdd0a2', 'fdae6b', 'fd8d3c', 'f16913',
          'd94801', '8c2d04'],
      9: ['fff5eb', 'fee6ce', 'fdd0a2', 'fdae6b', 'fd8d3c', 'f16913',
          'd94801', 'a63603', '7f2704']
    },
    Reds: {
      type: 'sequential',
      cbf: 42,
      3: ['fee0d2', 'fc9272', 'de2d26'],
      4: ['fee5d9', 'fcae91', 'fb6a4a', 'cb181d'],
      5: ['fee5d9', 'fcae91', 'fb6a4a', 'de2d26', 'a50f15'],
      6: ['fee5d9', 'fcbba1', 'fc9272', 'fb6a4a', 'de2d26', 'a50f15'],
      7: ['fee5d9', 'fcbba1', 'fc9272', 'fb6a4a', 'ef3b2c', 'cb181d',
          '99000d'],
      8: ['fff5f0', 'fee0d2', 'fcbba1', 'fc9272', 'fb6a4a', 'ef3b2c',
          'cb181d', '99000d'],
      9: ['fff5f0', 'fee0d2', 'fcbba1', 'fc9272', 'fb6a4a', 'ef3b2c',
          'cb181d', 'a50f15', '67000d']
    },
    Greys: {
      type: 'sequential',
      cbf: 42,
      3: ['f0f0f0', 'bdbdbd', '636363'],
      4: ['f7f7f7', 'cccccc', '969696', '525252'],
      5: ['f7f7f7', 'cccccc', '969696', '636363', '252525'],
      6: ['f7f7f7', 'd9d9d9', 'bdbdbd', '969696', '636363', '252525'],
      7: ['f7f7f7', 'd9d9d9', 'bdbdbd', '969696', '737373', '525252',
          '252525'],
      8: ['ffffff', 'f0f0f0', 'd9d9d9', 'bdbdbd', '969696', '737373',
          '525252', '252525'],
      9: ['ffffff', 'f0f0f0', 'd9d9d9', 'bdbdbd', '969696', '737373',
          '525252', '252525', '000000']
    },
    PuOr: {
      type: 'diverging',
      cbf: 42,
      3: ['f1a340', 'f7f7f7', '998ec3'],
      4: ['e66101', 'fdb863', 'b2abd2', '5e3c99'],
      5: ['e66101', 'fdb863', 'f7f7f7', 'b2abd2', '5e3c99'],
      6: ['b35806', 'f1a340', 'fee0b6', 'd8daeb', '998ec3', '542788'],
      7: ['b35806', 'f1a340', 'fee0b6', 'f7f7f7', 'd8daeb', '998ec3',
          '542788'],
      8: ['b35806', 'e08214', 'fdb863', 'fee0b6', 'd8daeb', 'b2abd2',
          '8073ac', '542788'],
      9: ['b35806', 'e08214', 'fdb863', 'fee0b6', 'f7f7f7', 'd8daeb',
          'b2abd2', '8073ac', '542788'],
      10: ['7f3b08', 'b35806', 'e08214', 'fdb863', 'fee0b6', 'd8daeb',
           'b2abd2', '8073ac', '542788', '2d004b'],
      11: ['7f3b08', 'b35806', 'e08214', 'fdb863', 'fee0b6', 'f7f7f7',
           'd8daeb', 'b2abd2', '8073ac', '542788', '2d004b']
    },
    BrBG: {
      type: 'diverging',
      cbf: 42,
      3: ['d8b365', 'f5f5f5', '5ab4ac'],
      4: ['a6611a', 'dfc27d', '80cdc1', '018571'],
      5: ['a6611a', 'dfc27d', 'f5f5f5', '80cdc1', '018571'],
      6: ['8c510a', 'd8b365', 'f6e8c3', 'c7eae5', '5ab4ac', '01665e'],
      7: ['8c510a', 'd8b365', 'f6e8c3', 'f5f5f5', 'c7eae5', '5ab4ac',
          '01665e'],
      8: ['8c510a', 'bf812d', 'dfc27d', 'f6e8c3', 'c7eae5', '80cdc1',
          '35978f', '01665e'],
      9: ['8c510a', 'bf812d', 'dfc27d', 'f6e8c3', 'f5f5f5', 'c7eae5',
          '80cdc1', '35978f', '01665e'],
      10: ['543005', '8c510a', 'bf812d', 'dfc27d', 'f6e8c3', 'c7eae5',
           '80cdc1', '35978f', '01665e', '003c30'],
      11: ['543005', '8c510a', 'bf812d', 'dfc27d', 'f6e8c3', 'f5f5f5',
           'c7eae5', '80cdc1', '35978f', '01665e', '003c30']
    },
    PRGn: {
      type: 'diverging',
      cbf: 42,
      3: ['af8dc3', 'f7f7f7', '7fbf7b'],
      4: ['7b3294', 'c2a5cf', 'a6dba0', '008837'],
      5: ['7b3294', 'c2a5cf', 'f7f7f7', 'a6dba0', '008837'],
      6: ['762a83', 'af8dc3', 'e7d4e8', 'd9f0d3', '7fbf7b', '1b7837'],
      7: ['762a83', 'af8dc3', 'e7d4e8', 'f7f7f7', 'd9f0d3', '7fbf7b',
          '1b7837'],
      8: ['762a83', '9970ab', 'c2a5cf', 'e7d4e8', 'd9f0d3', 'a6dba0',
          '5aae61', '1b7837'],
      9: ['762a83', '9970ab', 'c2a5cf', 'e7d4e8', 'f7f7f7', 'd9f0d3',
          'a6dba0', '5aae61', '1b7837'],
      10: ['40004b', '762a83', '9970ab', 'c2a5cf', 'e7d4e8', 'd9f0d3',
           'a6dba0', '5aae61', '1b7837', '00441b'],
      11: ['40004b', '762a83', '9970ab', 'c2a5cf', 'e7d4e8', 'f7f7f7',
           'd9f0d3', 'a6dba0', '5aae61', '1b7837', '00441b']
    },
    PiYG: {
      type: 'diverging',
      cbf: 42,
      3: ['e9a3c9', 'f7f7f7', 'a1d76a'],
      4: ['d01c8b', 'f1b6da', 'b8e186', '4dac26'],
      5: ['d01c8b', 'f1b6da', 'f7f7f7', 'b8e186', '4dac26'],
      6: ['c51b7d', 'e9a3c9', 'fde0ef', 'e6f5d0', 'a1d76a', '4d9221'],
      7: ['c51b7d', 'e9a3c9', 'fde0ef', 'f7f7f7', 'e6f5d0', 'a1d76a',
          '4d9221'],
      8: ['c51b7d', 'de77ae', 'f1b6da', 'fde0ef', 'e6f5d0', 'b8e186',
          '7fbc41', '4d9221'],
      9: ['c51b7d', 'de77ae', 'f1b6da', 'fde0ef', 'f7f7f7', 'e6f5d0',
          'b8e186', '7fbc41', '4d9221'],
      10: ['8e0152', 'c51b7d', 'de77ae', 'f1b6da', 'fde0ef', 'e6f5d0',
           'b8e186', '7fbc41', '4d9221', '276419'],
      11: ['8e0152', 'c51b7d', 'de77ae', 'f1b6da', 'fde0ef', 'f7f7f7',
           'e6f5d0', 'b8e186', '7fbc41', '4d9221', '276419']
    },
    RdBu: {
      type: 'diverging',
      cbf: 42,
      3: ['ef8a62', 'f7f7f7', '67a9cf'],
      4: ['ca0020', 'f4a582', '92c5de', '0571b0'],
      5: ['ca0020', 'f4a582', 'f7f7f7', '92c5de', '0571b0'],
      6: ['b2182b', 'ef8a62', 'fddbc7', 'd1e5f0', '67a9cf', '2166ac'],
      7: ['b2182b', 'ef8a62', 'fddbc7', 'f7f7f7', 'd1e5f0', '67a9cf',
          '2166ac'],
      8: ['b2182b', 'd6604d', 'f4a582', 'fddbc7', 'd1e5f0', '92c5de',
          '4393c3', '2166ac'],
      9: ['b2182b', 'd6604d', 'f4a582', 'fddbc7', 'f7f7f7', 'd1e5f0',
          '92c5de', '4393c3', '2166ac'],
      10: ['67001f', 'b2182b', 'd6604d', 'f4a582', 'fddbc7', 'd1e5f0',
           '92c5de', '4393c3', '2166ac', '053061'],
      11: ['67001f', 'b2182b', 'd6604d', 'f4a582', 'fddbc7', 'f7f7f7',
           'd1e5f0', '92c5de', '4393c3', '2166ac', '053061']
    },
    RdGy: {
      type: 'diverging',
      cbf: 42,
      3: ['ef8a62', 'ffffff', '999999'],
      4: ['ca0020', 'f4a582', 'bababa', '404040'],
      5: ['ca0020', 'f4a582', 'ffffff', 'bababa', '404040'],
      6: ['b2182b', 'ef8a62', 'fddbc7', 'e0e0e0', '999999', '4d4d4d'],
      7: ['b2182b', 'ef8a62', 'fddbc7', 'ffffff', 'e0e0e0', '999999',
          '4d4d4d'],
      8: ['b2182b', 'd6604d', 'f4a582', 'fddbc7', 'e0e0e0', 'bababa',
          '878787', '4d4d4d'],
      9: ['b2182b', 'd6604d', 'f4a582', 'fddbc7', 'ffffff', 'e0e0e0',
          'bababa', '878787', '4d4d4d'],
      10: ['67001f', 'b2182b', 'd6604d', 'f4a582', 'fddbc7', 'e0e0e0',
           'bababa', '878787', '4d4d4d', '1a1a1a'],
      11: ['67001f', 'b2182b', 'd6604d', 'f4a582', 'fddbc7', 'ffffff',
           'e0e0e0', 'bababa', '878787', '4d4d4d', '1a1a1a']
    },
    RdYlBu: {
      type: 'diverging',
      cbf: 42,
      3: ['fc8d59', 'ffffbf', '91bfdb'],
      4: ['d7191c', 'fdae61', 'abd9e9', '2c7bb6'],
      5: ['d7191c', 'fdae61', 'ffffbf', 'abd9e9', '2c7bb6'],
      6: ['d73027', 'fc8d59', 'fee090', 'e0f3f8', '91bfdb', '4575b4'],
      7: ['d73027', 'fc8d59', 'fee090', 'ffffbf', 'e0f3f8', '91bfdb',
          '4575b4'],
      8: ['d73027', 'f46d43', 'fdae61', 'fee090', 'e0f3f8', 'abd9e9',
          '74add1', '4575b4'],
      9: ['d73027', 'f46d43', 'fdae61', 'fee090', 'ffffbf', 'e0f3f8',
          'abd9e9', '74add1', '4575b4'],
      10: ['a50026', 'd73027', 'f46d43', 'fdae61', 'fee090', 'e0f3f8',
           'abd9e9', '74add1', '4575b4', '313695'],
      11: ['a50026', 'd73027', 'f46d43', 'fdae61', 'fee090', 'ffffbf',
           'e0f3f8', 'abd9e9', '74add1', '4575b4', '313695']
    },
    Spectral: {
      type: 'diverging',
      cbf: 0,
      3: ['fc8d59', 'ffffbf', '99d594'],
      4: ['d7191c', 'fdae61', 'abdda4', '2b83ba'],
      5: ['d7191c', 'fdae61', 'ffffbf', 'abdda4', '2b83ba'],
      6: ['d53e4f', 'fc8d59', 'fee08b', 'e6f598', '99d594', '3288bd'],
      7: ['d53e4f', 'fc8d59', 'fee08b', 'ffffbf', 'e6f598', '99d594',
          '3288bd'],
      8: ['d53e4f', 'f46d43', 'fdae61', 'fee08b', 'e6f598', 'abdda4',
          '66c2a5', '3288bd'],
      9: ['d53e4f', 'f46d43', 'fdae61', 'fee08b', 'ffffbf', 'e6f598',
          'abdda4', '66c2a5', '3288bd'],
      10: ['9e0142', 'd53e4f', 'f46d43', 'fdae61', 'fee08b', 'e6f598',
           'abdda4', '66c2a5', '3288bd', '5e4fa2'],
      11: ['9e0142', 'd53e4f', 'f46d43', 'fdae61', 'fee08b', 'ffffbf',
           'e6f598', 'abdda4', '66c2a5', '3288bd', '5e4fa2']
    },
    RdYlGn: {
      type: 'diverging',
      cbf: 0,
      3: ['fc8d59', 'ffffbf', '91cf60'],
      4: ['d7191c', 'fdae61', 'a6d96a', '1a9641'],
      5: ['d7191c', 'fdae61', 'ffffbf', 'a6d96a', '1a9641'],
      6: ['d73027', 'fc8d59', 'fee08b', 'd9ef8b', '91cf60', '1a9850'],
      7: ['d73027', 'fc8d59', 'fee08b', 'ffffbf', 'd9ef8b', '91cf60',
          '1a9850'],
      8: ['d73027', 'f46d43', 'fdae61', 'fee08b', 'd9ef8b', 'a6d96a',
          '66bd63', '1a9850'],
      9: ['d73027', 'f46d43', 'fdae61', 'fee08b', 'ffffbf', 'd9ef8b',
          'a6d96a', '66bd63', '1a9850'],
      10: ['a50026', 'd73027', 'f46d43', 'fdae61', 'fee08b', 'd9ef8b',
           'a6d96a', '66bd63', '1a9850', '006837'],
      11: ['a50026', 'd73027', 'f46d43', 'fdae61', 'fee08b', 'ffffbf',
           'd9ef8b', 'a6d96a', '66bd63', '1a9850', '006837']
    },
    Accent: {
      type: 'qualitative',
      cbf: 0,
      3: ['7fc97f', 'beaed4', 'fdc086'],
      4: ['7fc97f', 'beaed4', 'fdc086', 'ffff99'],
      5: ['7fc97f', 'beaed4', 'fdc086', 'ffff99', '386cb0'],
      6: ['7fc97f', 'beaed4', 'fdc086', 'ffff99', '386cb0', 'f0027f'],
      7: ['7fc97f', 'beaed4', 'fdc086', 'ffff99', '386cb0', 'f0027f',
          'bf5b17'],
      8: ['7fc97f', 'beaed4', 'fdc086', 'ffff99', '386cb0', 'f0027f',
          'bf5b17', '666666']
    },
    Dark2: {
      type: 'qualitative',
      cbf: 3,
      3: ['1b9e77', 'd95f02', '7570b3'],
      4: ['1b9e77', 'd95f02', '7570b3', 'e7298a'],
      5: ['1b9e77', 'd95f02', '7570b3', 'e7298a', '66a61e'],
      6: ['1b9e77', 'd95f02', '7570b3', 'e7298a', '66a61e', 'e6ab02'],
      7: ['1b9e77', 'd95f02', '7570b3', 'e7298a', '66a61e', 'e6ab02',
          'a6761d'],
      8: ['1b9e77', 'd95f02', '7570b3', 'e7298a', '66a61e', 'e6ab02',
          'a6761d', '666666']
    },
    Paired: {
      type: 'qualitative',
      cbf: 4,
      3: ['a6cee3', '1f78b4', 'b2df8a'],
      4: ['a6cee3', '1f78b4', 'b2df8a', '33a02c'],
      5: ['a6cee3', '1f78b4', 'b2df8a', '33a02c', 'fb9a99'],
      6: ['a6cee3', '1f78b4', 'b2df8a', '33a02c', 'fb9a99', 'e31a1c'],
      7: ['a6cee3', '1f78b4', 'b2df8a', '33a02c', 'fb9a99', 'e31a1c',
          'fdbf6f'],
      8: ['a6cee3', '1f78b4', 'b2df8a', '33a02c', 'fb9a99', 'e31a1c',
          'fdbf6f', 'ff7f00'],
      9: ['a6cee3', '1f78b4', 'b2df8a', '33a02c', 'fb9a99', 'e31a1c',
          'fdbf6f', 'ff7f00', 'cab2d6'],
      10: ['a6cee3', '1f78b4', 'b2df8a', '33a02c', 'fb9a99', 'e31a1c',
           'fdbf6f', 'ff7f00', 'cab2d6', '6a3d9a'],
      11: ['a6cee3', '1f78b4', 'b2df8a', '33a02c', 'fb9a99', 'e31a1c',
           'fdbf6f', 'ff7f00', 'cab2d6', '6a3d9a', 'ffff99'],
      12: ['a6cee3', '1f78b4', 'b2df8a', '33a02c', 'fb9a99', 'e31a1c',
           'fdbf6f', 'ff7f00', 'cab2d6', '6a3d9a', 'ffff99', 'b15928']
    },
    Pastel1: {
      type: 'qualitative',
      cbf: 0,
      3: ['fbb4ae', 'b3cde3', 'ccebc5'],
      4: ['fbb4ae', 'b3cde3', 'ccebc5', 'decbe4'],
      5: ['fbb4ae', 'b3cde3', 'ccebc5', 'decbe4', 'fed9a6'],
      6: ['fbb4ae', 'b3cde3', 'ccebc5', 'decbe4', 'fed9a6', 'ffffcc'],
      7: ['fbb4ae', 'b3cde3', 'ccebc5', 'decbe4', 'fed9a6', 'ffffcc',
          'e5d8bd'],
      8: ['fbb4ae', 'b3cde3', 'ccebc5', 'decbe4', 'fed9a6', 'ffffcc',
          'e5d8bd', 'fddaec'],
      9: ['fbb4ae', 'b3cde3', 'ccebc5', 'decbe4', 'fed9a6', 'ffffcc',
          'e5d8bd', 'fddaec', 'f2f2f2']
    },
    Pastel2: {
      type: 'qualitative',
      cbf: 0,
      3: ['b3e2cd', 'fdcdac', 'cbd5e8'],
      4: ['b3e2cd', 'fdcdac', 'cbd5e8', 'f4cae4'],
      5: ['b3e2cd', 'fdcdac', 'cbd5e8', 'f4cae4', 'e6f5c9'],
      6: ['b3e2cd', 'fdcdac', 'cbd5e8', 'f4cae4', 'e6f5c9', 'fff2ae'],
      7: ['b3e2cd', 'fdcdac', 'cbd5e8', 'f4cae4', 'e6f5c9', 'fff2ae',
          'f1e2cc'],
      8: ['b3e2cd', 'fdcdac', 'cbd5e8', 'f4cae4', 'e6f5c9', 'fff2ae',
          'f1e2cc', 'cccccc']
    },
    Set1: {
      type: 'qualitative',
      cbf: 0,
      3: ['e41a1c', '377eb8', '4daf4a'],
      4: ['e41a1c', '377eb8', '4daf4a', '984ea3'],
      5: ['e41a1c', '377eb8', '4daf4a', '984ea3', 'ff7f00'],
      6: ['e41a1c', '377eb8', '4daf4a', '984ea3', 'ff7f00', 'ffff33'],
      7: ['e41a1c', '377eb8', '4daf4a', '984ea3', 'ff7f00', 'ffff33',
          'a65628'],
      8: ['e41a1c', '377eb8', '4daf4a', '984ea3', 'ff7f00', 'ffff33',
          'a65628', 'f781bf'],
      9: ['e41a1c', '377eb8', '4daf4a', '984ea3', 'ff7f00', 'ffff33',
          'a65628', 'f781bf', '999999']
    },
    Set2: {
      type: 'qualitative',
      cbf: 3,
      3: ['66c2a5', 'fc8d62', '8da0cb'],
      4: ['66c2a5', 'fc8d62', '8da0cb', 'e78ac3'],
      5: ['66c2a5', 'fc8d62', '8da0cb', 'e78ac3', 'a6d854'],
      6: ['66c2a5', 'fc8d62', '8da0cb', 'e78ac3', 'a6d854', 'ffd92f'],
      7: ['66c2a5', 'fc8d62', '8da0cb', 'e78ac3', 'a6d854', 'ffd92f',
          'e5c494'],
      8: ['66c2a5', 'fc8d62', '8da0cb', 'e78ac3', 'a6d854', 'ffd92f',
          'e5c494', 'b3b3b3']
    },
    Set3: {
      type: 'qualitative',
      cbf: 0,
      3: ['8dd3c7', 'ffffb3', 'bebada'],
      4: ['8dd3c7', 'ffffb3', 'bebada', 'fb8072'],
      5: ['8dd3c7', 'ffffb3', 'bebada', 'fb8072', '80b1d3'],
      6: ['8dd3c7', 'ffffb3', 'bebada', 'fb8072', '80b1d3', 'fdb462'],
      7: ['8dd3c7', 'ffffb3', 'bebada', 'fb8072', '80b1d3', 'fdb462',
          'b3de69'],
      8: ['8dd3c7', 'ffffb3', 'bebada', 'fb8072', '80b1d3', 'fdb462',
          'b3de69', 'fccde5'],
      9: ['8dd3c7', 'ffffb3', 'bebada', 'fb8072', '80b1d3', 'fdb462',
          'b3de69', 'fccde5', 'd9d9d9'],
      10: ['8dd3c7', 'ffffb3', 'bebada', 'fb8072', '80b1d3', 'fdb462',
           'b3de69', 'fccde5', 'd9d9d9', 'bc80bd'],
      11: ['8dd3c7', 'ffffb3', 'bebada', 'fb8072', '80b1d3', 'fdb462',
           'b3de69', 'fccde5', 'd9d9d9', 'bc80bd', 'ccebc5'],
      12: ['8dd3c7', 'ffffb3', 'bebada', 'fb8072', '80b1d3', 'fdb462',
           'b3de69', 'fccde5', 'd9d9d9', 'bc80bd', 'ccebc5', 'ffed6f']
    }
  };

  for (var name in schemes) {
    var scheme = schemes[name];
    scheme = palette.Scheme.fromPalettes(
      'cb-' + name, [scheme.type, 'cb-' + scheme.type], scheme, 12, scheme.cbf);
    palette.register(scheme);
  }
})();

if(typeof module === "object" && module.exports) {
  module.exports = palette
}

},{}],3:[function(require,module,exports){
/* Mapbox GL JS is licensed under the 3-Clause BSD License. Full text of license: https://github.com/mapbox/mapbox-gl-js/blob/v1.9.0/LICENSE.txt */
(function (global, factory) {
typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
typeof define === 'function' && define.amd ? define(factory) :
(global = global || self, global.mapboxgl = factory());
}(this, (function () { 'use strict';

/* eslint-disable */

var shared, worker, mapboxgl;
// define gets called three times: one for each chunk. we rely on the order
// they're imported to know which is which
function define(_, chunk) {
if (!shared) {
    shared = chunk;
} else if (!worker) {
    worker = chunk;
} else {
    var workerBundleString = 'var sharedChunk = {}; (' + shared + ')(sharedChunk); (' + worker + ')(sharedChunk);'

    var sharedChunk = {};
    shared(sharedChunk);
    mapboxgl = chunk(sharedChunk);
    mapboxgl.workerUrl = window.URL.createObjectURL(new Blob([workerBundleString], { type: 'text/javascript' }));
}
}


define(["exports"],(function(t){"use strict";function e(t,e){return t(e={exports:{}},e.exports),e.exports}var r=n;function n(t,e,r,n){this.cx=3*t,this.bx=3*(r-t)-this.cx,this.ax=1-this.cx-this.bx,this.cy=3*e,this.by=3*(n-e)-this.cy,this.ay=1-this.cy-this.by,this.p1x=t,this.p1y=n,this.p2x=r,this.p2y=n;}n.prototype.sampleCurveX=function(t){return ((this.ax*t+this.bx)*t+this.cx)*t},n.prototype.sampleCurveY=function(t){return ((this.ay*t+this.by)*t+this.cy)*t},n.prototype.sampleCurveDerivativeX=function(t){return (3*this.ax*t+2*this.bx)*t+this.cx},n.prototype.solveCurveX=function(t,e){var r,n,i,a,o;for(void 0===e&&(e=1e-6),i=t,o=0;o<8;o++){if(a=this.sampleCurveX(i)-t,Math.abs(a)<e)return i;var s=this.sampleCurveDerivativeX(i);if(Math.abs(s)<1e-6)break;i-=a/s;}if((i=t)<(r=0))return r;if(i>(n=1))return n;for(;r<n;){if(a=this.sampleCurveX(i),Math.abs(a-t)<e)return i;t>a?r=i:n=i,i=.5*(n-r)+r;}return i},n.prototype.solve=function(t,e){return this.sampleCurveY(this.solveCurveX(t,e))};var i=a;function a(t,e){this.x=t,this.y=e;}function o(t,e,n,i){var a=new r(t,e,n,i);return function(t){return a.solve(t)}}a.prototype={clone:function(){return new a(this.x,this.y)},add:function(t){return this.clone()._add(t)},sub:function(t){return this.clone()._sub(t)},multByPoint:function(t){return this.clone()._multByPoint(t)},divByPoint:function(t){return this.clone()._divByPoint(t)},mult:function(t){return this.clone()._mult(t)},div:function(t){return this.clone()._div(t)},rotate:function(t){return this.clone()._rotate(t)},rotateAround:function(t,e){return this.clone()._rotateAround(t,e)},matMult:function(t){return this.clone()._matMult(t)},unit:function(){return this.clone()._unit()},perp:function(){return this.clone()._perp()},round:function(){return this.clone()._round()},mag:function(){return Math.sqrt(this.x*this.x+this.y*this.y)},equals:function(t){return this.x===t.x&&this.y===t.y},dist:function(t){return Math.sqrt(this.distSqr(t))},distSqr:function(t){var e=t.x-this.x,r=t.y-this.y;return e*e+r*r},angle:function(){return Math.atan2(this.y,this.x)},angleTo:function(t){return Math.atan2(this.y-t.y,this.x-t.x)},angleWith:function(t){return this.angleWithSep(t.x,t.y)},angleWithSep:function(t,e){return Math.atan2(this.x*e-this.y*t,this.x*t+this.y*e)},_matMult:function(t){var e=t[2]*this.x+t[3]*this.y;return this.x=t[0]*this.x+t[1]*this.y,this.y=e,this},_add:function(t){return this.x+=t.x,this.y+=t.y,this},_sub:function(t){return this.x-=t.x,this.y-=t.y,this},_mult:function(t){return this.x*=t,this.y*=t,this},_div:function(t){return this.x/=t,this.y/=t,this},_multByPoint:function(t){return this.x*=t.x,this.y*=t.y,this},_divByPoint:function(t){return this.x/=t.x,this.y/=t.y,this},_unit:function(){return this._div(this.mag()),this},_perp:function(){var t=this.y;return this.y=this.x,this.x=-t,this},_rotate:function(t){var e=Math.cos(t),r=Math.sin(t),n=r*this.x+e*this.y;return this.x=e*this.x-r*this.y,this.y=n,this},_rotateAround:function(t,e){var r=Math.cos(t),n=Math.sin(t),i=e.y+n*(this.x-e.x)+r*(this.y-e.y);return this.x=e.x+r*(this.x-e.x)-n*(this.y-e.y),this.y=i,this},_round:function(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}},a.convert=function(t){return t instanceof a?t:Array.isArray(t)?new a(t[0],t[1]):t};var s=o(.25,.1,.25,1);function u(t,e,r){return Math.min(r,Math.max(e,t))}function l(t,e,r){var n=r-e,i=((t-e)%n+n)%n+e;return i===e?r:i}function p(t){for(var e=[],r=arguments.length-1;r-- >0;)e[r]=arguments[r+1];for(var n=0,i=e;n<i.length;n+=1){var a=i[n];for(var o in a)t[o]=a[o];}return t}var c=1;function h(){return c++}function f(){return function t(e){return e?(e^16*Math.random()>>e/4).toString(16):([1e7]+-[1e3]+-4e3+-8e3+-1e11).replace(/[018]/g,t)}()}function y(t){return !!t&&/^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(t)}function d(t,e){t.forEach((function(t){e[t]&&(e[t]=e[t].bind(e));}));}function m(t,e){return -1!==t.indexOf(e,t.length-e.length)}function v(t,e,r){var n={};for(var i in t)n[i]=e.call(r||this,t[i],i,t);return n}function g(t,e,r){var n={};for(var i in t)e.call(r||this,t[i],i,t)&&(n[i]=t[i]);return n}function x(t){return Array.isArray(t)?t.map(x):"object"==typeof t&&t?v(t,x):t}var b={};function w(t){b[t]||("undefined"!=typeof console&&console.warn(t),b[t]=!0);}function _(t,e,r){return (r.y-t.y)*(e.x-t.x)>(e.y-t.y)*(r.x-t.x)}function A(t){for(var e=0,r=0,n=t.length,i=n-1,a=void 0,o=void 0;r<n;i=r++)e+=((o=t[i]).x-(a=t[r]).x)*(a.y+o.y);return e}function S(){return "undefined"!=typeof WorkerGlobalScope&&"undefined"!=typeof self&&self instanceof WorkerGlobalScope}function k(t){var e={};if(t.replace(/(?:^|(?:\s*\,\s*))([^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)(?:\=(?:([^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)|(?:\"((?:[^"\\]|\\.)*)\")))?/g,(function(t,r,n,i){var a=n||i;return e[r]=!a||a.toLowerCase(),""})),e["max-age"]){var r=parseInt(e["max-age"],10);isNaN(r)?delete e["max-age"]:e["max-age"]=r;}return e}var I=null;function z(t){if(null==I){var e=t.navigator?t.navigator.userAgent:null;I=!!t.safari||!(!e||!(/\b(iPad|iPhone|iPod)\b/.test(e)||e.match("Safari")&&!e.match("Chrome")));}return I}function C(t){try{var e=self[t];return e.setItem("_mapbox_test_",1),e.removeItem("_mapbox_test_"),!0}catch(t){return !1}}var M,T,E,P,B=self.performance&&self.performance.now?self.performance.now.bind(self.performance):Date.now.bind(Date),V=self.requestAnimationFrame||self.mozRequestAnimationFrame||self.webkitRequestAnimationFrame||self.msRequestAnimationFrame,F=self.cancelAnimationFrame||self.mozCancelAnimationFrame||self.webkitCancelAnimationFrame||self.msCancelAnimationFrame,D={now:B,frame:function(t){var e=V(t);return {cancel:function(){return F(e)}}},getImageData:function(t,e){void 0===e&&(e=0);var r=self.document.createElement("canvas"),n=r.getContext("2d");if(!n)throw new Error("failed to create canvas 2d context");return r.width=t.width,r.height=t.height,n.drawImage(t,0,0,t.width,t.height),n.getImageData(-e,-e,t.width+2*e,t.height+2*e)},resolveURL:function(t){return M||(M=self.document.createElement("a")),M.href=t,M.href},hardwareConcurrency:self.navigator.hardwareConcurrency||4,get devicePixelRatio(){return self.devicePixelRatio},get prefersReducedMotion(){return !!self.matchMedia&&(null==T&&(T=self.matchMedia("(prefers-reduced-motion: reduce)")),T.matches)}},L={API_URL:"https://api.mapbox.com",get EVENTS_URL(){return this.API_URL?0===this.API_URL.indexOf("https://api.mapbox.cn")?"https://events.mapbox.cn/events/v2":0===this.API_URL.indexOf("https://api.mapbox.com")?"https://events.mapbox.com/events/v2":null:null},FEEDBACK_URL:"https://apps.mapbox.com/feedback",REQUIRE_ACCESS_TOKEN:!0,ACCESS_TOKEN:null,MAX_PARALLEL_IMAGE_REQUESTS:16},R={supported:!1,testSupport:function(t){!O&&P&&(U?j(t):E=t);}},O=!1,U=!1;function j(t){var e=t.createTexture();t.bindTexture(t.TEXTURE_2D,e);try{if(t.texImage2D(t.TEXTURE_2D,0,t.RGBA,t.RGBA,t.UNSIGNED_BYTE,P),t.isContextLost())return;R.supported=!0;}catch(t){}t.deleteTexture(e),O=!0;}self.document&&((P=self.document.createElement("img")).onload=function(){E&&j(E),E=null,U=!0;},P.onerror=function(){O=!0,E=null;},P.src="data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAQAAAAfQ//73v/+BiOh/AAA=");var q="01",N=function(t,e){this._transformRequestFn=t,this._customAccessToken=e,this._createSkuToken();};function K(t){return 0===t.indexOf("mapbox:")}N.prototype._createSkuToken=function(){var t=function(){for(var t="",e=0;e<10;e++)t+="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(62*Math.random())];return {token:["1",q,t].join(""),tokenExpiresAt:Date.now()+432e5}}();this._skuToken=t.token,this._skuTokenExpiresAt=t.tokenExpiresAt;},N.prototype._isSkuTokenExpired=function(){return Date.now()>this._skuTokenExpiresAt},N.prototype.transformRequest=function(t,e){return this._transformRequestFn&&this._transformRequestFn(t,e)||{url:t}},N.prototype.normalizeStyleURL=function(t,e){if(!K(t))return t;var r=J(t);return r.path="/styles/v1"+r.path,this._makeAPIURL(r,this._customAccessToken||e)},N.prototype.normalizeGlyphsURL=function(t,e){if(!K(t))return t;var r=J(t);return r.path="/fonts/v1"+r.path,this._makeAPIURL(r,this._customAccessToken||e)},N.prototype.normalizeSourceURL=function(t,e){if(!K(t))return t;var r=J(t);return r.path="/v4/"+r.authority+".json",r.params.push("secure"),this._makeAPIURL(r,this._customAccessToken||e)},N.prototype.normalizeSpriteURL=function(t,e,r,n){var i=J(t);return K(t)?(i.path="/styles/v1"+i.path+"/sprite"+e+r,this._makeAPIURL(i,this._customAccessToken||n)):(i.path+=""+e+r,H(i))},N.prototype.normalizeTileURL=function(t,e){if(this._isSkuTokenExpired()&&this._createSkuToken(),t&&!K(t))return t;var r=J(t);r.path=r.path.replace(/(\.(png|jpg)\d*)(?=$)/,(D.devicePixelRatio>=2||512===e?"@2x":"")+(R.supported?".webp":"$1")),r.path=r.path.replace(/^.+\/v4\//,"/"),r.path="/v4"+r.path;var n=this._customAccessToken||function(t){for(var e=0,r=t;e<r.length;e+=1){var n=r[e].match(/^access_token=(.*)$/);if(n)return n[1]}return null}(r.params)||L.ACCESS_TOKEN;return L.REQUIRE_ACCESS_TOKEN&&n&&this._skuToken&&r.params.push("sku="+this._skuToken),this._makeAPIURL(r,n)},N.prototype.canonicalizeTileURL=function(t,e){var r=J(t);if(!r.path.match(/(^\/v4\/)/)||!r.path.match(/\.[\w]+$/))return t;var n="mapbox://tiles/";n+=r.path.replace("/v4/","");var i=r.params;return e&&(i=i.filter((function(t){return !t.match(/^access_token=/)}))),i.length&&(n+="?"+i.join("&")),n},N.prototype.canonicalizeTileset=function(t,e){for(var r=!!e&&K(e),n=[],i=0,a=t.tiles||[];i<a.length;i+=1){var o=a[i];Z(o)?n.push(this.canonicalizeTileURL(o,r)):n.push(o);}return n},N.prototype._makeAPIURL=function(t,e){var r="See https://www.mapbox.com/api-documentation/#access-tokens-and-token-scopes",n=J(L.API_URL);if(t.protocol=n.protocol,t.authority=n.authority,"/"!==n.path&&(t.path=""+n.path+t.path),!L.REQUIRE_ACCESS_TOKEN)return H(t);if(!(e=e||L.ACCESS_TOKEN))throw new Error("An API access token is required to use Mapbox GL. "+r);if("s"===e[0])throw new Error("Use a public access token (pk.*) with Mapbox GL, not a secret access token (sk.*). "+r);return t.params=t.params.filter((function(t){return -1===t.indexOf("access_token")})),t.params.push("access_token="+e),H(t)};var G=/^((https?:)?\/\/)?([^\/]+\.)?mapbox\.c(n|om)(\/|\?|$)/i;function Z(t){return G.test(t)}var X=/^(\w+):\/\/([^/?]*)(\/[^?]+)?\??(.+)?/;function J(t){var e=t.match(X);if(!e)throw new Error("Unable to parse URL object");return {protocol:e[1],authority:e[2],path:e[3]||"/",params:e[4]?e[4].split("&"):[]}}function H(t){var e=t.params.length?"?"+t.params.join("&"):"";return t.protocol+"://"+t.authority+t.path+e}function Y(t){if(!t)return null;var e=t.split(".");if(!e||3!==e.length)return null;try{return JSON.parse(decodeURIComponent(self.atob(e[1]).split("").map((function(t){return "%"+("00"+t.charCodeAt(0).toString(16)).slice(-2)})).join("")))}catch(t){return null}}var $=function(t){this.type=t,this.anonId=null,this.eventData={},this.queue=[],this.pendingRequest=null;};$.prototype.getStorageKey=function(t){var e,r=Y(L.ACCESS_TOKEN);return e=r&&r.u?self.btoa(encodeURIComponent(r.u).replace(/%([0-9A-F]{2})/g,(function(t,e){return String.fromCharCode(Number("0x"+e))}))):L.ACCESS_TOKEN||"",t?"mapbox.eventData."+t+":"+e:"mapbox.eventData:"+e},$.prototype.fetchEventData=function(){var t=C("localStorage"),e=this.getStorageKey(),r=this.getStorageKey("uuid");if(t)try{var n=self.localStorage.getItem(e);n&&(this.eventData=JSON.parse(n));var i=self.localStorage.getItem(r);i&&(this.anonId=i);}catch(t){w("Unable to read from LocalStorage");}},$.prototype.saveEventData=function(){var t=C("localStorage"),e=this.getStorageKey(),r=this.getStorageKey("uuid");if(t)try{self.localStorage.setItem(r,this.anonId),Object.keys(this.eventData).length>=1&&self.localStorage.setItem(e,JSON.stringify(this.eventData));}catch(t){w("Unable to write to LocalStorage");}},$.prototype.processRequests=function(t){},$.prototype.postEvent=function(t,e,r,n){var i=this;if(L.EVENTS_URL){var a=J(L.EVENTS_URL);a.params.push("access_token="+(n||L.ACCESS_TOKEN||""));var o={event:this.type,created:new Date(t).toISOString(),sdkIdentifier:"mapbox-gl-js",sdkVersion:"1.9.0",skuId:q,userId:this.anonId},s=e?p(o,e):o,u={url:H(a),headers:{"Content-Type":"text/plain"},body:JSON.stringify([s])};this.pendingRequest=wt(u,(function(t){i.pendingRequest=null,r(t),i.saveEventData(),i.processRequests(n);}));}},$.prototype.queueRequest=function(t,e){this.queue.push(t),this.processRequests(e);};var W,Q,tt=function(t){function e(){t.call(this,"map.load"),this.success={},this.skuToken="";}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.postMapLoadEvent=function(t,e,r,n){this.skuToken=r,(L.EVENTS_URL&&n||L.ACCESS_TOKEN&&Array.isArray(t)&&t.some((function(t){return K(t)||Z(t)})))&&this.queueRequest({id:e,timestamp:Date.now()},n);},e.prototype.processRequests=function(t){var e=this;if(!this.pendingRequest&&0!==this.queue.length){var r=this.queue.shift(),n=r.id,i=r.timestamp;n&&this.success[n]||(this.anonId||this.fetchEventData(),y(this.anonId)||(this.anonId=f()),this.postEvent(i,{skuToken:this.skuToken},(function(t){t||n&&(e.success[n]=!0);}),t));}},e}($),et=new(function(t){function e(e){t.call(this,"appUserTurnstile"),this._customAccessToken=e;}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.postTurnstileEvent=function(t,e){L.EVENTS_URL&&L.ACCESS_TOKEN&&Array.isArray(t)&&t.some((function(t){return K(t)||Z(t)}))&&this.queueRequest(Date.now(),e);},e.prototype.processRequests=function(t){var e=this;if(!this.pendingRequest&&0!==this.queue.length){this.anonId&&this.eventData.lastSuccess&&this.eventData.tokenU||this.fetchEventData();var r=Y(L.ACCESS_TOKEN),n=r?r.u:L.ACCESS_TOKEN,i=n!==this.eventData.tokenU;y(this.anonId)||(this.anonId=f(),i=!0);var a=this.queue.shift();if(this.eventData.lastSuccess){var o=new Date(this.eventData.lastSuccess),s=new Date(a),u=(a-this.eventData.lastSuccess)/864e5;i=i||u>=1||u<-1||o.getDate()!==s.getDate();}else i=!0;if(!i)return this.processRequests();this.postEvent(a,{"enabled.telemetry":!1},(function(t){t||(e.eventData.lastSuccess=a,e.eventData.tokenU=n);}),t);}},e}($)),rt=et.postTurnstileEvent.bind(et),nt=new tt,it=nt.postMapLoadEvent.bind(nt),at="mapbox-tiles",ot=500,st=50,ut=42e4;function lt(){self.caches&&!W&&(W=self.caches.open(at));}function pt(t){var e=t.indexOf("?");return e<0?t:t.slice(0,e)}var ct,ht=1/0;function ft(){return null==ct&&(ct=self.OffscreenCanvas&&new self.OffscreenCanvas(1,1).getContext("2d")&&"function"==typeof self.createImageBitmap),ct}var yt={Unknown:"Unknown",Style:"Style",Source:"Source",Tile:"Tile",Glyphs:"Glyphs",SpriteImage:"SpriteImage",SpriteJSON:"SpriteJSON",Image:"Image"};"function"==typeof Object.freeze&&Object.freeze(yt);var dt=function(t){function e(e,r,n){401===r&&Z(n)&&(e+=": you may have provided an invalid Mapbox access token. See https://www.mapbox.com/api-documentation/#access-tokens-and-token-scopes"),t.call(this,e),this.status=r,this.url=n,this.name=this.constructor.name,this.message=e;}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.toString=function(){return this.name+": "+this.message+" ("+this.status+"): "+this.url},e}(Error),mt=S()?function(){return self.worker&&self.worker.referrer}:function(){return ("blob:"===self.location.protocol?self.parent:self).location.href};var vt,gt,xt=function(t,e){if(!(/^file:/.test(r=t.url)||/^file:/.test(mt())&&!/^\w+:/.test(r))){if(self.fetch&&self.Request&&self.AbortController&&self.Request.prototype.hasOwnProperty("signal"))return function(t,e){var r,n=new self.AbortController,i=new self.Request(t.url,{method:t.method||"GET",body:t.body,credentials:t.credentials,headers:t.headers,referrer:mt(),signal:n.signal}),a=!1,o=!1,s=(r=i.url).indexOf("sku=")>0&&Z(r);"json"===t.type&&i.headers.set("Accept","application/json");var u=function(r,n,a){if(!o){if(r&&"SecurityError"!==r.message&&w(r),n&&a)return l(n);var u=Date.now();self.fetch(i).then((function(r){if(r.ok){var n=s?r.clone():null;return l(r,n,u)}return e(new dt(r.statusText,r.status,t.url))})).catch((function(t){20!==t.code&&e(new Error(t.message));}));}},l=function(r,n,s){("arrayBuffer"===t.type?r.arrayBuffer():"json"===t.type?r.json():r.text()).then((function(t){o||(n&&s&&function(t,e,r){if(lt(),W){var n={status:e.status,statusText:e.statusText,headers:new self.Headers};e.headers.forEach((function(t,e){return n.headers.set(e,t)}));var i=k(e.headers.get("Cache-Control")||"");i["no-store"]||(i["max-age"]&&n.headers.set("Expires",new Date(r+1e3*i["max-age"]).toUTCString()),new Date(n.headers.get("Expires")).getTime()-r<ut||function(t,e){if(void 0===Q)try{new Response(new ReadableStream),Q=!0;}catch(t){Q=!1;}Q?e(t.body):t.blob().then(e);}(e,(function(e){var r=new self.Response(e,n);lt(),W&&W.then((function(e){return e.put(pt(t.url),r)})).catch((function(t){return w(t.message)}));})));}}(i,n,s),a=!0,e(null,t,r.headers.get("Cache-Control"),r.headers.get("Expires")));})).catch((function(t){o||e(new Error(t.message));}));};return s?function(t,e){if(lt(),!W)return e(null);var r=pt(t.url);W.then((function(t){t.match(r).then((function(n){var i=function(t){if(!t)return !1;var e=new Date(t.headers.get("Expires")||0),r=k(t.headers.get("Cache-Control")||"");return e>Date.now()&&!r["no-cache"]}(n);t.delete(r),i&&t.put(r,n.clone()),e(null,n,i);})).catch(e);})).catch(e);}(i,u):u(null,null),{cancel:function(){o=!0,a||n.abort();}}}(t,e);if(S()&&self.worker&&self.worker.actor)return self.worker.actor.send("getResource",t,e,void 0,!0)}var r;return function(t,e){var r=new self.XMLHttpRequest;for(var n in r.open(t.method||"GET",t.url,!0),"arrayBuffer"===t.type&&(r.responseType="arraybuffer"),t.headers)r.setRequestHeader(n,t.headers[n]);return "json"===t.type&&(r.responseType="text",r.setRequestHeader("Accept","application/json")),r.withCredentials="include"===t.credentials,r.onerror=function(){e(new Error(r.statusText));},r.onload=function(){if((r.status>=200&&r.status<300||0===r.status)&&null!==r.response){var n=r.response;if("json"===t.type)try{n=JSON.parse(r.response);}catch(t){return e(t)}e(null,n,r.getResponseHeader("Cache-Control"),r.getResponseHeader("Expires"));}else e(new dt(r.statusText,r.status,t.url));},r.send(t.body),{cancel:function(){return r.abort()}}}(t,e)},bt=function(t,e){return xt(p(t,{type:"arrayBuffer"}),e)},wt=function(t,e){return xt(p(t,{method:"POST"}),e)};vt=[],gt=0;var _t=function(t,e){if(R.supported&&(t.headers||(t.headers={}),t.headers.accept="image/webp,*/*"),gt>=L.MAX_PARALLEL_IMAGE_REQUESTS){var r={requestParameters:t,callback:e,cancelled:!1,cancel:function(){this.cancelled=!0;}};return vt.push(r),r}gt++;var n=!1,i=function(){if(!n)for(n=!0,gt--;vt.length&&gt<L.MAX_PARALLEL_IMAGE_REQUESTS;){var t=vt.shift();t.cancelled||(t.cancel=_t(t.requestParameters,t.callback).cancel);}},a=bt(t,(function(t,r,n,a){i(),t?e(t):r&&(ft()?function(t,e){var r=new self.Blob([new Uint8Array(t)],{type:"image/png"});self.createImageBitmap(r).then((function(t){e(null,t);})).catch((function(t){e(new Error("Could not load image because of "+t.message+". Please make sure to use a supported image type such as PNG or JPEG. Note that SVGs are not supported."));}));}(r,e):function(t,e,r,n){var i=new self.Image,a=self.URL;i.onload=function(){e(null,i),a.revokeObjectURL(i.src);},i.onerror=function(){return e(new Error("Could not load image. Please make sure to use a supported image type such as PNG or JPEG. Note that SVGs are not supported."))};var o=new self.Blob([new Uint8Array(t)],{type:"image/png"});i.cacheControl=r,i.expires=n,i.src=t.byteLength?a.createObjectURL(o):"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAUAAarVyFEAAAAASUVORK5CYII=";}(r,e,n,a));}));return {cancel:function(){a.cancel(),i();}}};function At(t,e,r){r[t]&&-1!==r[t].indexOf(e)||(r[t]=r[t]||[],r[t].push(e));}function St(t,e,r){if(r&&r[t]){var n=r[t].indexOf(e);-1!==n&&r[t].splice(n,1);}}var kt=function(t,e){void 0===e&&(e={}),p(this,e),this.type=t;},It=function(t){function e(e,r){void 0===r&&(r={}),t.call(this,"error",p({error:e},r));}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(kt),zt=function(){};zt.prototype.on=function(t,e){return this._listeners=this._listeners||{},At(t,e,this._listeners),this},zt.prototype.off=function(t,e){return St(t,e,this._listeners),St(t,e,this._oneTimeListeners),this},zt.prototype.once=function(t,e){return this._oneTimeListeners=this._oneTimeListeners||{},At(t,e,this._oneTimeListeners),this},zt.prototype.fire=function(t,e){"string"==typeof t&&(t=new kt(t,e||{}));var r=t.type;if(this.listens(r)){t.target=this;for(var n=0,i=this._listeners&&this._listeners[r]?this._listeners[r].slice():[];n<i.length;n+=1)i[n].call(this,t);for(var a=0,o=this._oneTimeListeners&&this._oneTimeListeners[r]?this._oneTimeListeners[r].slice():[];a<o.length;a+=1){var s=o[a];St(r,s,this._oneTimeListeners),s.call(this,t);}var u=this._eventedParent;u&&(p(t,"function"==typeof this._eventedParentData?this._eventedParentData():this._eventedParentData),u.fire(t));}else t instanceof It&&console.error(t.error);return this},zt.prototype.listens=function(t){return this._listeners&&this._listeners[t]&&this._listeners[t].length>0||this._oneTimeListeners&&this._oneTimeListeners[t]&&this._oneTimeListeners[t].length>0||this._eventedParent&&this._eventedParent.listens(t)},zt.prototype.setEventedParent=function(t,e){return this._eventedParent=t,this._eventedParentData=e,this};var Ct={$version:8,$root:{version:{required:!0,type:"enum",values:[8]},name:{type:"string"},metadata:{type:"*"},center:{type:"array",value:"number"},zoom:{type:"number"},bearing:{type:"number",default:0,period:360,units:"degrees"},pitch:{type:"number",default:0,units:"degrees"},light:{type:"light"},sources:{required:!0,type:"sources"},sprite:{type:"string"},glyphs:{type:"string"},transition:{type:"transition"},layers:{required:!0,type:"array",value:"layer"}},sources:{"*":{type:"source"}},source:["source_vector","source_raster","source_raster_dem","source_geojson","source_video","source_image"],source_vector:{type:{required:!0,type:"enum",values:{vector:{}}},url:{type:"string"},tiles:{type:"array",value:"string"},bounds:{type:"array",value:"number",length:4,default:[-180,-85.051129,180,85.051129]},scheme:{type:"enum",values:{xyz:{},tms:{}},default:"xyz"},minzoom:{type:"number",default:0},maxzoom:{type:"number",default:22},attribution:{type:"string"},promoteId:{type:"promoteId"},"*":{type:"*"}},source_raster:{type:{required:!0,type:"enum",values:{raster:{}}},url:{type:"string"},tiles:{type:"array",value:"string"},bounds:{type:"array",value:"number",length:4,default:[-180,-85.051129,180,85.051129]},minzoom:{type:"number",default:0},maxzoom:{type:"number",default:22},tileSize:{type:"number",default:512,units:"pixels"},scheme:{type:"enum",values:{xyz:{},tms:{}},default:"xyz"},attribution:{type:"string"},"*":{type:"*"}},source_raster_dem:{type:{required:!0,type:"enum",values:{"raster-dem":{}}},url:{type:"string"},tiles:{type:"array",value:"string"},bounds:{type:"array",value:"number",length:4,default:[-180,-85.051129,180,85.051129]},minzoom:{type:"number",default:0},maxzoom:{type:"number",default:22},tileSize:{type:"number",default:512,units:"pixels"},attribution:{type:"string"},encoding:{type:"enum",values:{terrarium:{},mapbox:{}},default:"mapbox"},"*":{type:"*"}},source_geojson:{type:{required:!0,type:"enum",values:{geojson:{}}},data:{type:"*"},maxzoom:{type:"number",default:18},attribution:{type:"string"},buffer:{type:"number",default:128,maximum:512,minimum:0},tolerance:{type:"number",default:.375},cluster:{type:"boolean",default:!1},clusterRadius:{type:"number",default:50,minimum:0},clusterMaxZoom:{type:"number"},clusterProperties:{type:"*"},lineMetrics:{type:"boolean",default:!1},generateId:{type:"boolean",default:!1},promoteId:{type:"promoteId"}},source_video:{type:{required:!0,type:"enum",values:{video:{}}},urls:{required:!0,type:"array",value:"string"},coordinates:{required:!0,type:"array",length:4,value:{type:"array",length:2,value:"number"}}},source_image:{type:{required:!0,type:"enum",values:{image:{}}},url:{required:!0,type:"string"},coordinates:{required:!0,type:"array",length:4,value:{type:"array",length:2,value:"number"}}},layer:{id:{type:"string",required:!0},type:{type:"enum",values:{fill:{},line:{},symbol:{},circle:{},heatmap:{},"fill-extrusion":{},raster:{},hillshade:{},background:{}},required:!0},metadata:{type:"*"},source:{type:"string"},"source-layer":{type:"string"},minzoom:{type:"number",minimum:0,maximum:24},maxzoom:{type:"number",minimum:0,maximum:24},filter:{type:"filter"},layout:{type:"layout"},paint:{type:"paint"}},layout:["layout_fill","layout_line","layout_circle","layout_heatmap","layout_fill-extrusion","layout_symbol","layout_raster","layout_hillshade","layout_background"],layout_background:{visibility:{type:"enum",values:{visible:{},none:{}},default:"visible","property-type":"constant"}},layout_fill:{"fill-sort-key":{type:"number",expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},visibility:{type:"enum",values:{visible:{},none:{}},default:"visible","property-type":"constant"}},layout_circle:{"circle-sort-key":{type:"number",expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},visibility:{type:"enum",values:{visible:{},none:{}},default:"visible","property-type":"constant"}},layout_heatmap:{visibility:{type:"enum",values:{visible:{},none:{}},default:"visible","property-type":"constant"}},"layout_fill-extrusion":{visibility:{type:"enum",values:{visible:{},none:{}},default:"visible","property-type":"constant"}},layout_line:{"line-cap":{type:"enum",values:{butt:{},round:{},square:{}},default:"butt",expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"line-join":{type:"enum",values:{bevel:{},round:{},miter:{}},default:"miter",expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},"line-miter-limit":{type:"number",default:2,requires:[{"line-join":"miter"}],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"line-round-limit":{type:"number",default:1.05,requires:[{"line-join":"round"}],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"line-sort-key":{type:"number",expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},visibility:{type:"enum",values:{visible:{},none:{}},default:"visible","property-type":"constant"}},layout_symbol:{"symbol-placement":{type:"enum",values:{point:{},line:{},"line-center":{}},default:"point",expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"symbol-spacing":{type:"number",default:250,minimum:1,units:"pixels",requires:[{"symbol-placement":"line"}],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"symbol-avoid-edges":{type:"boolean",default:!1,expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"symbol-sort-key":{type:"number",expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},"symbol-z-order":{type:"enum",values:{auto:{},"viewport-y":{},source:{}},default:"auto",expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"icon-allow-overlap":{type:"boolean",default:!1,requires:["icon-image"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"icon-ignore-placement":{type:"boolean",default:!1,requires:["icon-image"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"icon-optional":{type:"boolean",default:!1,requires:["icon-image","text-field"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"icon-rotation-alignment":{type:"enum",values:{map:{},viewport:{},auto:{}},default:"auto",requires:["icon-image"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"icon-size":{type:"number",default:1,minimum:0,units:"factor of the original icon size",requires:["icon-image"],expression:{interpolated:!0,parameters:["zoom","feature"]},"property-type":"data-driven"},"icon-text-fit":{type:"enum",values:{none:{},width:{},height:{},both:{}},default:"none",requires:["icon-image","text-field"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"icon-text-fit-padding":{type:"array",value:"number",length:4,default:[0,0,0,0],units:"pixels",requires:["icon-image","text-field",{"icon-text-fit":["both","width","height"]}],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"icon-image":{type:"resolvedImage",tokens:!0,expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},"icon-rotate":{type:"number",default:0,period:360,units:"degrees",requires:["icon-image"],expression:{interpolated:!0,parameters:["zoom","feature"]},"property-type":"data-driven"},"icon-padding":{type:"number",default:2,minimum:0,units:"pixels",requires:["icon-image"],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"icon-keep-upright":{type:"boolean",default:!1,requires:["icon-image",{"icon-rotation-alignment":"map"},{"symbol-placement":["line","line-center"]}],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"icon-offset":{type:"array",value:"number",length:2,default:[0,0],requires:["icon-image"],expression:{interpolated:!0,parameters:["zoom","feature"]},"property-type":"data-driven"},"icon-anchor":{type:"enum",values:{center:{},left:{},right:{},top:{},bottom:{},"top-left":{},"top-right":{},"bottom-left":{},"bottom-right":{}},default:"center",requires:["icon-image"],expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},"icon-pitch-alignment":{type:"enum",values:{map:{},viewport:{},auto:{}},default:"auto",requires:["icon-image"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"text-pitch-alignment":{type:"enum",values:{map:{},viewport:{},auto:{}},default:"auto",requires:["text-field"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"text-rotation-alignment":{type:"enum",values:{map:{},viewport:{},auto:{}},default:"auto",requires:["text-field"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"text-field":{type:"formatted",default:"",tokens:!0,expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},"text-font":{type:"array",value:"string",default:["Open Sans Regular","Arial Unicode MS Regular"],requires:["text-field"],expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},"text-size":{type:"number",default:16,minimum:0,units:"pixels",requires:["text-field"],expression:{interpolated:!0,parameters:["zoom","feature"]},"property-type":"data-driven"},"text-max-width":{type:"number",default:10,minimum:0,units:"ems",requires:["text-field"],expression:{interpolated:!0,parameters:["zoom","feature"]},"property-type":"data-driven"},"text-line-height":{type:"number",default:1.2,units:"ems",requires:["text-field"],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"text-letter-spacing":{type:"number",default:0,units:"ems",requires:["text-field"],expression:{interpolated:!0,parameters:["zoom","feature"]},"property-type":"data-driven"},"text-justify":{type:"enum",values:{auto:{},left:{},center:{},right:{}},default:"center",requires:["text-field"],expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},"text-radial-offset":{type:"number",units:"ems",default:0,requires:["text-field"],"property-type":"data-driven",expression:{interpolated:!0,parameters:["zoom","feature"]}},"text-variable-anchor":{type:"array",value:"enum",values:{center:{},left:{},right:{},top:{},bottom:{},"top-left":{},"top-right":{},"bottom-left":{},"bottom-right":{}},requires:["text-field",{"symbol-placement":["point"]}],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"text-anchor":{type:"enum",values:{center:{},left:{},right:{},top:{},bottom:{},"top-left":{},"top-right":{},"bottom-left":{},"bottom-right":{}},default:"center",requires:["text-field",{"!":"text-variable-anchor"}],expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},"text-max-angle":{type:"number",default:45,units:"degrees",requires:["text-field",{"symbol-placement":["line","line-center"]}],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"text-writing-mode":{type:"array",value:"enum",values:{horizontal:{},vertical:{}},requires:["text-field",{"symbol-placement":["point"]}],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"text-rotate":{type:"number",default:0,period:360,units:"degrees",requires:["text-field"],expression:{interpolated:!0,parameters:["zoom","feature"]},"property-type":"data-driven"},"text-padding":{type:"number",default:2,minimum:0,units:"pixels",requires:["text-field"],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"text-keep-upright":{type:"boolean",default:!0,requires:["text-field",{"text-rotation-alignment":"map"},{"symbol-placement":["line","line-center"]}],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"text-transform":{type:"enum",values:{none:{},uppercase:{},lowercase:{}},default:"none",requires:["text-field"],expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},"text-offset":{type:"array",value:"number",units:"ems",length:2,default:[0,0],requires:["text-field",{"!":"text-radial-offset"}],expression:{interpolated:!0,parameters:["zoom","feature"]},"property-type":"data-driven"},"text-allow-overlap":{type:"boolean",default:!1,requires:["text-field"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"text-ignore-placement":{type:"boolean",default:!1,requires:["text-field"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"text-optional":{type:"boolean",default:!1,requires:["text-field","icon-image"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},visibility:{type:"enum",values:{visible:{},none:{}},default:"visible","property-type":"constant"}},layout_raster:{visibility:{type:"enum",values:{visible:{},none:{}},default:"visible","property-type":"constant"}},layout_hillshade:{visibility:{type:"enum",values:{visible:{},none:{}},default:"visible","property-type":"constant"}},filter:{type:"array",value:"*"},filter_operator:{type:"enum",values:{"==":{},"!=":{},">":{},">=":{},"<":{},"<=":{},in:{},"!in":{},all:{},any:{},none:{},has:{},"!has":{}}},geometry_type:{type:"enum",values:{Point:{},LineString:{},Polygon:{}}},function:{expression:{type:"expression"},stops:{type:"array",value:"function_stop"},base:{type:"number",default:1,minimum:0},property:{type:"string",default:"$zoom"},type:{type:"enum",values:{identity:{},exponential:{},interval:{},categorical:{}},default:"exponential"},colorSpace:{type:"enum",values:{rgb:{},lab:{},hcl:{}},default:"rgb"},default:{type:"*",required:!1}},function_stop:{type:"array",minimum:0,maximum:24,value:["number","color"],length:2},expression:{type:"array",value:"*",minimum:1},expression_name:{type:"enum",values:{let:{group:"Variable binding"},var:{group:"Variable binding"},literal:{group:"Types"},array:{group:"Types"},at:{group:"Lookup"},in:{group:"Lookup"},case:{group:"Decision"},match:{group:"Decision"},coalesce:{group:"Decision"},step:{group:"Ramps, scales, curves"},interpolate:{group:"Ramps, scales, curves"},"interpolate-hcl":{group:"Ramps, scales, curves"},"interpolate-lab":{group:"Ramps, scales, curves"},ln2:{group:"Math"},pi:{group:"Math"},e:{group:"Math"},typeof:{group:"Types"},string:{group:"Types"},number:{group:"Types"},boolean:{group:"Types"},object:{group:"Types"},collator:{group:"Types"},format:{group:"Types"},image:{group:"Types"},"number-format":{group:"Types"},"to-string":{group:"Types"},"to-number":{group:"Types"},"to-boolean":{group:"Types"},"to-rgba":{group:"Color"},"to-color":{group:"Types"},rgb:{group:"Color"},rgba:{group:"Color"},get:{group:"Lookup"},has:{group:"Lookup"},length:{group:"Lookup"},properties:{group:"Feature data"},"feature-state":{group:"Feature data"},"geometry-type":{group:"Feature data"},id:{group:"Feature data"},zoom:{group:"Zoom"},"heatmap-density":{group:"Heatmap"},"line-progress":{group:"Feature data"},accumulated:{group:"Feature data"},"+":{group:"Math"},"*":{group:"Math"},"-":{group:"Math"},"/":{group:"Math"},"%":{group:"Math"},"^":{group:"Math"},sqrt:{group:"Math"},log10:{group:"Math"},ln:{group:"Math"},log2:{group:"Math"},sin:{group:"Math"},cos:{group:"Math"},tan:{group:"Math"},asin:{group:"Math"},acos:{group:"Math"},atan:{group:"Math"},min:{group:"Math"},max:{group:"Math"},round:{group:"Math"},abs:{group:"Math"},ceil:{group:"Math"},floor:{group:"Math"},"==":{group:"Decision"},"!=":{group:"Decision"},">":{group:"Decision"},"<":{group:"Decision"},">=":{group:"Decision"},"<=":{group:"Decision"},all:{group:"Decision"},any:{group:"Decision"},"!":{group:"Decision"},within:{group:"Decision"},"is-supported-script":{group:"String"},upcase:{group:"String"},downcase:{group:"String"},concat:{group:"String"},"resolved-locale":{group:"String"}}},light:{anchor:{type:"enum",default:"viewport",values:{map:{},viewport:{}},"property-type":"data-constant",transition:!1,expression:{interpolated:!1,parameters:["zoom"]}},position:{type:"array",default:[1.15,210,30],length:3,value:"number","property-type":"data-constant",transition:!0,expression:{interpolated:!0,parameters:["zoom"]}},color:{type:"color","property-type":"data-constant",default:"#ffffff",expression:{interpolated:!0,parameters:["zoom"]},transition:!0},intensity:{type:"number","property-type":"data-constant",default:.5,minimum:0,maximum:1,expression:{interpolated:!0,parameters:["zoom"]},transition:!0}},paint:["paint_fill","paint_line","paint_circle","paint_heatmap","paint_fill-extrusion","paint_symbol","paint_raster","paint_hillshade","paint_background"],paint_fill:{"fill-antialias":{type:"boolean",default:!0,expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"fill-opacity":{type:"number",default:1,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"fill-color":{type:"color",default:"#000000",transition:!0,requires:[{"!":"fill-pattern"}],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"fill-outline-color":{type:"color",transition:!0,requires:[{"!":"fill-pattern"},{"fill-antialias":!0}],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"fill-translate":{type:"array",value:"number",length:2,default:[0,0],transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"fill-translate-anchor":{type:"enum",values:{map:{},viewport:{}},default:"map",requires:["fill-translate"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"fill-pattern":{type:"resolvedImage",transition:!0,expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"cross-faded-data-driven"}},"paint_fill-extrusion":{"fill-extrusion-opacity":{type:"number",default:1,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"fill-extrusion-color":{type:"color",default:"#000000",transition:!0,requires:[{"!":"fill-extrusion-pattern"}],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"fill-extrusion-translate":{type:"array",value:"number",length:2,default:[0,0],transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"fill-extrusion-translate-anchor":{type:"enum",values:{map:{},viewport:{}},default:"map",requires:["fill-extrusion-translate"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"fill-extrusion-pattern":{type:"resolvedImage",transition:!0,expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"cross-faded-data-driven"},"fill-extrusion-height":{type:"number",default:0,minimum:0,units:"meters",transition:!0,expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"fill-extrusion-base":{type:"number",default:0,minimum:0,units:"meters",transition:!0,requires:["fill-extrusion-height"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"fill-extrusion-vertical-gradient":{type:"boolean",default:!0,transition:!1,expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"}},paint_line:{"line-opacity":{type:"number",default:1,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"line-color":{type:"color",default:"#000000",transition:!0,requires:[{"!":"line-pattern"}],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"line-translate":{type:"array",value:"number",length:2,default:[0,0],transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"line-translate-anchor":{type:"enum",values:{map:{},viewport:{}},default:"map",requires:["line-translate"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"line-width":{type:"number",default:1,minimum:0,transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"line-gap-width":{type:"number",default:0,minimum:0,transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"line-offset":{type:"number",default:0,transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"line-blur":{type:"number",default:0,minimum:0,transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"line-dasharray":{type:"array",value:"number",minimum:0,transition:!0,units:"line widths",requires:[{"!":"line-pattern"}],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"cross-faded"},"line-pattern":{type:"resolvedImage",transition:!0,expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"cross-faded-data-driven"},"line-gradient":{type:"color",transition:!1,requires:[{"!":"line-dasharray"},{"!":"line-pattern"},{source:"geojson",has:{lineMetrics:!0}}],expression:{interpolated:!0,parameters:["line-progress"]},"property-type":"color-ramp"}},paint_circle:{"circle-radius":{type:"number",default:5,minimum:0,transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"circle-color":{type:"color",default:"#000000",transition:!0,expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"circle-blur":{type:"number",default:0,transition:!0,expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"circle-opacity":{type:"number",default:1,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"circle-translate":{type:"array",value:"number",length:2,default:[0,0],transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"circle-translate-anchor":{type:"enum",values:{map:{},viewport:{}},default:"map",requires:["circle-translate"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"circle-pitch-scale":{type:"enum",values:{map:{},viewport:{}},default:"map",expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"circle-pitch-alignment":{type:"enum",values:{map:{},viewport:{}},default:"viewport",expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"circle-stroke-width":{type:"number",default:0,minimum:0,transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"circle-stroke-color":{type:"color",default:"#000000",transition:!0,expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"circle-stroke-opacity":{type:"number",default:1,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"}},paint_heatmap:{"heatmap-radius":{type:"number",default:30,minimum:1,transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"heatmap-weight":{type:"number",default:1,minimum:0,transition:!1,expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"heatmap-intensity":{type:"number",default:1,minimum:0,transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"heatmap-color":{type:"color",default:["interpolate",["linear"],["heatmap-density"],0,"rgba(0, 0, 255, 0)",.1,"royalblue",.3,"cyan",.5,"lime",.7,"yellow",1,"red"],transition:!1,expression:{interpolated:!0,parameters:["heatmap-density"]},"property-type":"color-ramp"},"heatmap-opacity":{type:"number",default:1,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"}},paint_symbol:{"icon-opacity":{type:"number",default:1,minimum:0,maximum:1,transition:!0,requires:["icon-image"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"icon-color":{type:"color",default:"#000000",transition:!0,requires:["icon-image"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"icon-halo-color":{type:"color",default:"rgba(0, 0, 0, 0)",transition:!0,requires:["icon-image"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"icon-halo-width":{type:"number",default:0,minimum:0,transition:!0,units:"pixels",requires:["icon-image"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"icon-halo-blur":{type:"number",default:0,minimum:0,transition:!0,units:"pixels",requires:["icon-image"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"icon-translate":{type:"array",value:"number",length:2,default:[0,0],transition:!0,units:"pixels",requires:["icon-image"],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"icon-translate-anchor":{type:"enum",values:{map:{},viewport:{}},default:"map",requires:["icon-image","icon-translate"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"text-opacity":{type:"number",default:1,minimum:0,maximum:1,transition:!0,requires:["text-field"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"text-color":{type:"color",default:"#000000",transition:!0,overridable:!0,requires:["text-field"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"text-halo-color":{type:"color",default:"rgba(0, 0, 0, 0)",transition:!0,requires:["text-field"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"text-halo-width":{type:"number",default:0,minimum:0,transition:!0,units:"pixels",requires:["text-field"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"text-halo-blur":{type:"number",default:0,minimum:0,transition:!0,units:"pixels",requires:["text-field"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"text-translate":{type:"array",value:"number",length:2,default:[0,0],transition:!0,units:"pixels",requires:["text-field"],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"text-translate-anchor":{type:"enum",values:{map:{},viewport:{}},default:"map",requires:["text-field","text-translate"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"}},paint_raster:{"raster-opacity":{type:"number",default:1,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"raster-hue-rotate":{type:"number",default:0,period:360,transition:!0,units:"degrees",expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"raster-brightness-min":{type:"number",default:0,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"raster-brightness-max":{type:"number",default:1,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"raster-saturation":{type:"number",default:0,minimum:-1,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"raster-contrast":{type:"number",default:0,minimum:-1,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"raster-resampling":{type:"enum",values:{linear:{},nearest:{}},default:"linear",expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"raster-fade-duration":{type:"number",default:300,minimum:0,transition:!1,units:"milliseconds",expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"}},paint_hillshade:{"hillshade-illumination-direction":{type:"number",default:335,minimum:0,maximum:359,transition:!1,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"hillshade-illumination-anchor":{type:"enum",values:{map:{},viewport:{}},default:"viewport",expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"hillshade-exaggeration":{type:"number",default:.5,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"hillshade-shadow-color":{type:"color",default:"#000000",transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"hillshade-highlight-color":{type:"color",default:"#FFFFFF",transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"hillshade-accent-color":{type:"color",default:"#000000",transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"}},paint_background:{"background-color":{type:"color",default:"#000000",transition:!0,requires:[{"!":"background-pattern"}],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"background-pattern":{type:"resolvedImage",transition:!0,expression:{interpolated:!1,parameters:["zoom"]},"property-type":"cross-faded"},"background-opacity":{type:"number",default:1,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"}},transition:{duration:{type:"number",default:300,minimum:0,units:"milliseconds"},delay:{type:"number",default:0,minimum:0,units:"milliseconds"}},"property-type":{"data-driven":{type:"property-type"},"cross-faded":{type:"property-type"},"cross-faded-data-driven":{type:"property-type"},"color-ramp":{type:"property-type"},"data-constant":{type:"property-type"},constant:{type:"property-type"}},promoteId:{"*":{type:"string"}}},Mt=function(t,e,r,n){this.message=(t?t+": ":"")+r,n&&(this.identifier=n),null!=e&&e.__line__&&(this.line=e.__line__);};function Tt(t){var e=t.value;return e?[new Mt(t.key,e,"constants have been deprecated as of v8")]:[]}function Et(t){for(var e=[],r=arguments.length-1;r-- >0;)e[r]=arguments[r+1];for(var n=0,i=e;n<i.length;n+=1){var a=i[n];for(var o in a)t[o]=a[o];}return t}function Pt(t){return t instanceof Number||t instanceof String||t instanceof Boolean?t.valueOf():t}function Bt(t){if(Array.isArray(t))return t.map(Bt);if(t instanceof Object&&!(t instanceof Number||t instanceof String||t instanceof Boolean)){var e={};for(var r in t)e[r]=Bt(t[r]);return e}return Pt(t)}var Vt=function(t){function e(e,r){t.call(this,r),this.message=r,this.key=e;}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(Error),Ft=function(t,e){void 0===e&&(e=[]),this.parent=t,this.bindings={};for(var r=0,n=e;r<n.length;r+=1){var i=n[r];this.bindings[i[0]]=i[1];}};Ft.prototype.concat=function(t){return new Ft(this,t)},Ft.prototype.get=function(t){if(this.bindings[t])return this.bindings[t];if(this.parent)return this.parent.get(t);throw new Error(t+" not found in scope.")},Ft.prototype.has=function(t){return !!this.bindings[t]||!!this.parent&&this.parent.has(t)};var Dt={kind:"null"},Lt={kind:"number"},Rt={kind:"string"},Ot={kind:"boolean"},Ut={kind:"color"},jt={kind:"object"},qt={kind:"value"},Nt={kind:"collator"},Kt={kind:"formatted"},Gt={kind:"resolvedImage"};function Zt(t,e){return {kind:"array",itemType:t,N:e}}function Xt(t){if("array"===t.kind){var e=Xt(t.itemType);return "number"==typeof t.N?"array<"+e+", "+t.N+">":"value"===t.itemType.kind?"array":"array<"+e+">"}return t.kind}var Jt=[Dt,Lt,Rt,Ot,Ut,Kt,jt,Zt(qt),Gt];function Ht(t,e){if("error"===e.kind)return null;if("array"===t.kind){if("array"===e.kind&&(0===e.N&&"value"===e.itemType.kind||!Ht(t.itemType,e.itemType))&&("number"!=typeof t.N||t.N===e.N))return null}else{if(t.kind===e.kind)return null;if("value"===t.kind)for(var r=0,n=Jt;r<n.length;r+=1)if(!Ht(n[r],e))return null}return "Expected "+Xt(t)+" but found "+Xt(e)+" instead."}var Yt=e((function(t,e){var r={transparent:[0,0,0,0],aliceblue:[240,248,255,1],antiquewhite:[250,235,215,1],aqua:[0,255,255,1],aquamarine:[127,255,212,1],azure:[240,255,255,1],beige:[245,245,220,1],bisque:[255,228,196,1],black:[0,0,0,1],blanchedalmond:[255,235,205,1],blue:[0,0,255,1],blueviolet:[138,43,226,1],brown:[165,42,42,1],burlywood:[222,184,135,1],cadetblue:[95,158,160,1],chartreuse:[127,255,0,1],chocolate:[210,105,30,1],coral:[255,127,80,1],cornflowerblue:[100,149,237,1],cornsilk:[255,248,220,1],crimson:[220,20,60,1],cyan:[0,255,255,1],darkblue:[0,0,139,1],darkcyan:[0,139,139,1],darkgoldenrod:[184,134,11,1],darkgray:[169,169,169,1],darkgreen:[0,100,0,1],darkgrey:[169,169,169,1],darkkhaki:[189,183,107,1],darkmagenta:[139,0,139,1],darkolivegreen:[85,107,47,1],darkorange:[255,140,0,1],darkorchid:[153,50,204,1],darkred:[139,0,0,1],darksalmon:[233,150,122,1],darkseagreen:[143,188,143,1],darkslateblue:[72,61,139,1],darkslategray:[47,79,79,1],darkslategrey:[47,79,79,1],darkturquoise:[0,206,209,1],darkviolet:[148,0,211,1],deeppink:[255,20,147,1],deepskyblue:[0,191,255,1],dimgray:[105,105,105,1],dimgrey:[105,105,105,1],dodgerblue:[30,144,255,1],firebrick:[178,34,34,1],floralwhite:[255,250,240,1],forestgreen:[34,139,34,1],fuchsia:[255,0,255,1],gainsboro:[220,220,220,1],ghostwhite:[248,248,255,1],gold:[255,215,0,1],goldenrod:[218,165,32,1],gray:[128,128,128,1],green:[0,128,0,1],greenyellow:[173,255,47,1],grey:[128,128,128,1],honeydew:[240,255,240,1],hotpink:[255,105,180,1],indianred:[205,92,92,1],indigo:[75,0,130,1],ivory:[255,255,240,1],khaki:[240,230,140,1],lavender:[230,230,250,1],lavenderblush:[255,240,245,1],lawngreen:[124,252,0,1],lemonchiffon:[255,250,205,1],lightblue:[173,216,230,1],lightcoral:[240,128,128,1],lightcyan:[224,255,255,1],lightgoldenrodyellow:[250,250,210,1],lightgray:[211,211,211,1],lightgreen:[144,238,144,1],lightgrey:[211,211,211,1],lightpink:[255,182,193,1],lightsalmon:[255,160,122,1],lightseagreen:[32,178,170,1],lightskyblue:[135,206,250,1],lightslategray:[119,136,153,1],lightslategrey:[119,136,153,1],lightsteelblue:[176,196,222,1],lightyellow:[255,255,224,1],lime:[0,255,0,1],limegreen:[50,205,50,1],linen:[250,240,230,1],magenta:[255,0,255,1],maroon:[128,0,0,1],mediumaquamarine:[102,205,170,1],mediumblue:[0,0,205,1],mediumorchid:[186,85,211,1],mediumpurple:[147,112,219,1],mediumseagreen:[60,179,113,1],mediumslateblue:[123,104,238,1],mediumspringgreen:[0,250,154,1],mediumturquoise:[72,209,204,1],mediumvioletred:[199,21,133,1],midnightblue:[25,25,112,1],mintcream:[245,255,250,1],mistyrose:[255,228,225,1],moccasin:[255,228,181,1],navajowhite:[255,222,173,1],navy:[0,0,128,1],oldlace:[253,245,230,1],olive:[128,128,0,1],olivedrab:[107,142,35,1],orange:[255,165,0,1],orangered:[255,69,0,1],orchid:[218,112,214,1],palegoldenrod:[238,232,170,1],palegreen:[152,251,152,1],paleturquoise:[175,238,238,1],palevioletred:[219,112,147,1],papayawhip:[255,239,213,1],peachpuff:[255,218,185,1],peru:[205,133,63,1],pink:[255,192,203,1],plum:[221,160,221,1],powderblue:[176,224,230,1],purple:[128,0,128,1],rebeccapurple:[102,51,153,1],red:[255,0,0,1],rosybrown:[188,143,143,1],royalblue:[65,105,225,1],saddlebrown:[139,69,19,1],salmon:[250,128,114,1],sandybrown:[244,164,96,1],seagreen:[46,139,87,1],seashell:[255,245,238,1],sienna:[160,82,45,1],silver:[192,192,192,1],skyblue:[135,206,235,1],slateblue:[106,90,205,1],slategray:[112,128,144,1],slategrey:[112,128,144,1],snow:[255,250,250,1],springgreen:[0,255,127,1],steelblue:[70,130,180,1],tan:[210,180,140,1],teal:[0,128,128,1],thistle:[216,191,216,1],tomato:[255,99,71,1],turquoise:[64,224,208,1],violet:[238,130,238,1],wheat:[245,222,179,1],white:[255,255,255,1],whitesmoke:[245,245,245,1],yellow:[255,255,0,1],yellowgreen:[154,205,50,1]};function n(t){return (t=Math.round(t))<0?0:t>255?255:t}function i(t){return n("%"===t[t.length-1]?parseFloat(t)/100*255:parseInt(t))}function a(t){return (e="%"===t[t.length-1]?parseFloat(t)/100:parseFloat(t))<0?0:e>1?1:e;var e;}function o(t,e,r){return r<0?r+=1:r>1&&(r-=1),6*r<1?t+(e-t)*r*6:2*r<1?e:3*r<2?t+(e-t)*(2/3-r)*6:t}try{e.parseCSSColor=function(t){var e,s=t.replace(/ /g,"").toLowerCase();if(s in r)return r[s].slice();if("#"===s[0])return 4===s.length?(e=parseInt(s.substr(1),16))>=0&&e<=4095?[(3840&e)>>4|(3840&e)>>8,240&e|(240&e)>>4,15&e|(15&e)<<4,1]:null:7===s.length&&(e=parseInt(s.substr(1),16))>=0&&e<=16777215?[(16711680&e)>>16,(65280&e)>>8,255&e,1]:null;var u=s.indexOf("("),l=s.indexOf(")");if(-1!==u&&l+1===s.length){var p=s.substr(0,u),c=s.substr(u+1,l-(u+1)).split(","),h=1;switch(p){case"rgba":if(4!==c.length)return null;h=a(c.pop());case"rgb":return 3!==c.length?null:[i(c[0]),i(c[1]),i(c[2]),h];case"hsla":if(4!==c.length)return null;h=a(c.pop());case"hsl":if(3!==c.length)return null;var f=(parseFloat(c[0])%360+360)%360/360,y=a(c[1]),d=a(c[2]),m=d<=.5?d*(y+1):d+y-d*y,v=2*d-m;return [n(255*o(v,m,f+1/3)),n(255*o(v,m,f)),n(255*o(v,m,f-1/3)),h];default:return null}}return null};}catch(t){}})).parseCSSColor,$t=function(t,e,r,n){void 0===n&&(n=1),this.r=t,this.g=e,this.b=r,this.a=n;};$t.parse=function(t){if(t){if(t instanceof $t)return t;if("string"==typeof t){var e=Yt(t);if(e)return new $t(e[0]/255*e[3],e[1]/255*e[3],e[2]/255*e[3],e[3])}}},$t.prototype.toString=function(){var t=this.toArray(),e=t[1],r=t[2],n=t[3];return "rgba("+Math.round(t[0])+","+Math.round(e)+","+Math.round(r)+","+n+")"},$t.prototype.toArray=function(){var t=this.a;return 0===t?[0,0,0,0]:[255*this.r/t,255*this.g/t,255*this.b/t,t]},$t.black=new $t(0,0,0,1),$t.white=new $t(1,1,1,1),$t.transparent=new $t(0,0,0,0),$t.red=new $t(1,0,0,1);var Wt=function(t,e,r){this.sensitivity=t?e?"variant":"case":e?"accent":"base",this.locale=r,this.collator=new Intl.Collator(this.locale?this.locale:[],{sensitivity:this.sensitivity,usage:"search"});};Wt.prototype.compare=function(t,e){return this.collator.compare(t,e)},Wt.prototype.resolvedLocale=function(){return new Intl.Collator(this.locale?this.locale:[]).resolvedOptions().locale};var Qt=function(t,e,r,n,i){this.text=t,this.image=e,this.scale=r,this.fontStack=n,this.textColor=i;},te=function(t){this.sections=t;};te.fromString=function(t){return new te([new Qt(t,null,null,null,null)])},te.prototype.isEmpty=function(){return 0===this.sections.length||!this.sections.some((function(t){return 0!==t.text.length||t.image&&0!==t.image.name.length}))},te.factory=function(t){return t instanceof te?t:te.fromString(t)},te.prototype.toString=function(){return 0===this.sections.length?"":this.sections.map((function(t){return t.text})).join("")},te.prototype.serialize=function(){for(var t=["format"],e=0,r=this.sections;e<r.length;e+=1){var n=r[e];if(n.image)t.push(["image",n.image.name]);else{t.push(n.text);var i={};n.fontStack&&(i["text-font"]=["literal",n.fontStack.split(",")]),n.scale&&(i["font-scale"]=n.scale),n.textColor&&(i["text-color"]=["rgba"].concat(n.textColor.toArray())),t.push(i);}}return t};var ee=function(t){this.name=t.name,this.available=t.available;};function re(t,e,r,n){return "number"==typeof t&&t>=0&&t<=255&&"number"==typeof e&&e>=0&&e<=255&&"number"==typeof r&&r>=0&&r<=255?void 0===n||"number"==typeof n&&n>=0&&n<=1?null:"Invalid rgba value ["+[t,e,r,n].join(", ")+"]: 'a' must be between 0 and 1.":"Invalid rgba value ["+("number"==typeof n?[t,e,r,n]:[t,e,r]).join(", ")+"]: 'r', 'g', and 'b' must be between 0 and 255."}function ne(t){if(null===t)return !0;if("string"==typeof t)return !0;if("boolean"==typeof t)return !0;if("number"==typeof t)return !0;if(t instanceof $t)return !0;if(t instanceof Wt)return !0;if(t instanceof te)return !0;if(t instanceof ee)return !0;if(Array.isArray(t)){for(var e=0,r=t;e<r.length;e+=1)if(!ne(r[e]))return !1;return !0}if("object"==typeof t){for(var n in t)if(!ne(t[n]))return !1;return !0}return !1}function ie(t){if(null===t)return Dt;if("string"==typeof t)return Rt;if("boolean"==typeof t)return Ot;if("number"==typeof t)return Lt;if(t instanceof $t)return Ut;if(t instanceof Wt)return Nt;if(t instanceof te)return Kt;if(t instanceof ee)return Gt;if(Array.isArray(t)){for(var e,r=t.length,n=0,i=t;n<i.length;n+=1){var a=ie(i[n]);if(e){if(e===a)continue;e=qt;break}e=a;}return Zt(e||qt,r)}return jt}function ae(t){var e=typeof t;return null===t?"":"string"===e||"number"===e||"boolean"===e?String(t):t instanceof $t||t instanceof te||t instanceof ee?t.toString():JSON.stringify(t)}ee.prototype.toString=function(){return this.name},ee.fromString=function(t){return t?new ee({name:t,available:!1}):null},ee.prototype.serialize=function(){return ["image",this.name]};var oe=function(t,e){this.type=t,this.value=e;};oe.parse=function(t,e){if(2!==t.length)return e.error("'literal' expression requires exactly one argument, but found "+(t.length-1)+" instead.");if(!ne(t[1]))return e.error("invalid value");var r=t[1],n=ie(r),i=e.expectedType;return "array"!==n.kind||0!==n.N||!i||"array"!==i.kind||"number"==typeof i.N&&0!==i.N||(n=i),new oe(n,r)},oe.prototype.evaluate=function(){return this.value},oe.prototype.eachChild=function(){},oe.prototype.outputDefined=function(){return !0},oe.prototype.serialize=function(){return "array"===this.type.kind||"object"===this.type.kind?["literal",this.value]:this.value instanceof $t?["rgba"].concat(this.value.toArray()):this.value instanceof te?this.value.serialize():this.value};var se=function(t){this.name="ExpressionEvaluationError",this.message=t;};se.prototype.toJSON=function(){return this.message};var ue={string:Rt,number:Lt,boolean:Ot,object:jt},le=function(t,e){this.type=t,this.args=e;};le.parse=function(t,e){if(t.length<2)return e.error("Expected at least one argument.");var r,n=1,i=t[0];if("array"===i){var a,o;if(t.length>2){var s=t[1];if("string"!=typeof s||!(s in ue)||"object"===s)return e.error('The item type argument of "array" must be one of string, number, boolean',1);a=ue[s],n++;}else a=qt;if(t.length>3){if(null!==t[2]&&("number"!=typeof t[2]||t[2]<0||t[2]!==Math.floor(t[2])))return e.error('The length argument to "array" must be a positive integer literal',2);o=t[2],n++;}r=Zt(a,o);}else r=ue[i];for(var u=[];n<t.length;n++){var l=e.parse(t[n],n,qt);if(!l)return null;u.push(l);}return new le(r,u)},le.prototype.evaluate=function(t){for(var e=0;e<this.args.length;e++){var r=this.args[e].evaluate(t);if(!Ht(this.type,ie(r)))return r;if(e===this.args.length-1)throw new se("Expected value to be of type "+Xt(this.type)+", but found "+Xt(ie(r))+" instead.")}return null},le.prototype.eachChild=function(t){this.args.forEach(t);},le.prototype.outputDefined=function(){return this.args.every((function(t){return t.outputDefined()}))},le.prototype.serialize=function(){var t=this.type,e=[t.kind];if("array"===t.kind){var r=t.itemType;if("string"===r.kind||"number"===r.kind||"boolean"===r.kind){e.push(r.kind);var n=t.N;("number"==typeof n||this.args.length>1)&&e.push(n);}}return e.concat(this.args.map((function(t){return t.serialize()})))};var pe=function(t){this.type=Kt,this.sections=t;};pe.parse=function(t,e){if(t.length<2)return e.error("Expected at least one argument.");var r=t[1];if(!Array.isArray(r)&&"object"==typeof r)return e.error("First argument must be an image or text section.");for(var n=[],i=!1,a=1;a<=t.length-1;++a){var o=t[a];if(i&&"object"==typeof o&&!Array.isArray(o)){i=!1;var s=null;if(o["font-scale"]&&!(s=e.parse(o["font-scale"],1,Lt)))return null;var u=null;if(o["text-font"]&&!(u=e.parse(o["text-font"],1,Zt(Rt))))return null;var l=null;if(o["text-color"]&&!(l=e.parse(o["text-color"],1,Ut)))return null;var p=n[n.length-1];p.scale=s,p.font=u,p.textColor=l;}else{var c=e.parse(t[a],1,qt);if(!c)return null;var h=c.type.kind;if("string"!==h&&"value"!==h&&"null"!==h&&"resolvedImage"!==h)return e.error("Formatted text type must be 'string', 'value', 'image' or 'null'.");i=!0,n.push({content:c,scale:null,font:null,textColor:null});}}return new pe(n)},pe.prototype.evaluate=function(t){return new te(this.sections.map((function(e){var r=e.content.evaluate(t);return ie(r)===Gt?new Qt("",r,null,null,null):new Qt(ae(r),null,e.scale?e.scale.evaluate(t):null,e.font?e.font.evaluate(t).join(","):null,e.textColor?e.textColor.evaluate(t):null)})))},pe.prototype.eachChild=function(t){for(var e=0,r=this.sections;e<r.length;e+=1){var n=r[e];t(n.content),n.scale&&t(n.scale),n.font&&t(n.font),n.textColor&&t(n.textColor);}},pe.prototype.outputDefined=function(){return !1},pe.prototype.serialize=function(){for(var t=["format"],e=0,r=this.sections;e<r.length;e+=1){var n=r[e];t.push(n.content.serialize());var i={};n.scale&&(i["font-scale"]=n.scale.serialize()),n.font&&(i["text-font"]=n.font.serialize()),n.textColor&&(i["text-color"]=n.textColor.serialize()),t.push(i);}return t};var ce=function(t){this.type=Gt,this.input=t;};ce.parse=function(t,e){if(2!==t.length)return e.error("Expected two arguments.");var r=e.parse(t[1],1,Rt);return r?new ce(r):e.error("No image name provided.")},ce.prototype.evaluate=function(t){var e=this.input.evaluate(t),r=ee.fromString(e);return r&&t.availableImages&&(r.available=t.availableImages.indexOf(e)>-1),r},ce.prototype.eachChild=function(t){t(this.input);},ce.prototype.outputDefined=function(){return !1},ce.prototype.serialize=function(){return ["image",this.input.serialize()]};var he={"to-boolean":Ot,"to-color":Ut,"to-number":Lt,"to-string":Rt},fe=function(t,e){this.type=t,this.args=e;};fe.parse=function(t,e){if(t.length<2)return e.error("Expected at least one argument.");var r=t[0];if(("to-boolean"===r||"to-string"===r)&&2!==t.length)return e.error("Expected one argument.");for(var n=he[r],i=[],a=1;a<t.length;a++){var o=e.parse(t[a],a,qt);if(!o)return null;i.push(o);}return new fe(n,i)},fe.prototype.evaluate=function(t){if("boolean"===this.type.kind)return Boolean(this.args[0].evaluate(t));if("color"===this.type.kind){for(var e,r,n=0,i=this.args;n<i.length;n+=1){if(r=null,(e=i[n].evaluate(t))instanceof $t)return e;if("string"==typeof e){var a=t.parseColor(e);if(a)return a}else if(Array.isArray(e)&&!(r=e.length<3||e.length>4?"Invalid rbga value "+JSON.stringify(e)+": expected an array containing either three or four numeric values.":re(e[0],e[1],e[2],e[3])))return new $t(e[0]/255,e[1]/255,e[2]/255,e[3])}throw new se(r||"Could not parse color from value '"+("string"==typeof e?e:String(JSON.stringify(e)))+"'")}if("number"===this.type.kind){for(var o=null,s=0,u=this.args;s<u.length;s+=1){if(null===(o=u[s].evaluate(t)))return 0;var l=Number(o);if(!isNaN(l))return l}throw new se("Could not convert "+JSON.stringify(o)+" to number.")}return "formatted"===this.type.kind?te.fromString(ae(this.args[0].evaluate(t))):"resolvedImage"===this.type.kind?ee.fromString(ae(this.args[0].evaluate(t))):ae(this.args[0].evaluate(t))},fe.prototype.eachChild=function(t){this.args.forEach(t);},fe.prototype.outputDefined=function(){return this.args.every((function(t){return t.outputDefined()}))},fe.prototype.serialize=function(){if("formatted"===this.type.kind)return new pe([{content:this.args[0],scale:null,font:null,textColor:null}]).serialize();if("resolvedImage"===this.type.kind)return new ce(this.args[0]).serialize();var t=["to-"+this.type.kind];return this.eachChild((function(e){t.push(e.serialize());})),t};var ye=["Unknown","Point","LineString","Polygon"],de=function(){this.globals=null,this.feature=null,this.featureState=null,this.formattedSection=null,this._parseColorCache={},this.availableImages=null,this.canonical=null;};de.prototype.id=function(){return this.feature&&"id"in this.feature?this.feature.id:null},de.prototype.geometryType=function(){return this.feature?"number"==typeof this.feature.type?ye[this.feature.type]:this.feature.type:null},de.prototype.geometry=function(){return this.feature&&"geometry"in this.feature?this.feature.geometry:null},de.prototype.canonicalID=function(){return this.canonical},de.prototype.properties=function(){return this.feature&&this.feature.properties||{}},de.prototype.parseColor=function(t){var e=this._parseColorCache[t];return e||(e=this._parseColorCache[t]=$t.parse(t)),e};var me=function(t,e,r,n){this.name=t,this.type=e,this._evaluate=r,this.args=n;};me.prototype.evaluate=function(t){return this._evaluate(t,this.args)},me.prototype.eachChild=function(t){this.args.forEach(t);},me.prototype.outputDefined=function(){return !1},me.prototype.serialize=function(){return [this.name].concat(this.args.map((function(t){return t.serialize()})))},me.parse=function(t,e){var r,n=t[0],i=me.definitions[n];if(!i)return e.error('Unknown expression "'+n+'". If you wanted a literal array, use ["literal", [...]].',0);for(var a=Array.isArray(i)?i[0]:i.type,o=Array.isArray(i)?[[i[1],i[2]]]:i.overloads,s=o.filter((function(e){var r=e[0];return !Array.isArray(r)||r.length===t.length-1})),u=null,l=0,p=s;l<p.length;l+=1){var c=p[l],h=c[0],f=c[1];u=new Ge(e.registry,e.path,null,e.scope);for(var y=[],d=!1,m=1;m<t.length;m++){var v=t[m],g=Array.isArray(h)?h[m-1]:h.type,x=u.parse(v,1+y.length,g);if(!x){d=!0;break}y.push(x);}if(!d)if(Array.isArray(h)&&h.length!==y.length)u.error("Expected "+h.length+" arguments, but found "+y.length+" instead.");else{for(var b=0;b<y.length;b++){var w=Array.isArray(h)?h[b]:h.type,_=y[b];u.concat(b+1).checkSubtype(w,_.type);}if(0===u.errors.length)return new me(n,a,f,y)}}if(1===s.length)(r=e.errors).push.apply(r,u.errors);else{for(var A=(s.length?s:o).map((function(t){var e;return e=t[0],Array.isArray(e)?"("+e.map(Xt).join(", ")+")":"("+Xt(e.type)+"...)"})).join(" | "),S=[],k=1;k<t.length;k++){var I=e.parse(t[k],1+S.length);if(!I)return null;S.push(Xt(I.type));}e.error("Expected arguments of type "+A+", but found ("+S.join(", ")+") instead.");}return null},me.register=function(t,e){for(var r in me.definitions=e,e)t[r]=me;};var ve=function(t,e,r){this.type=Nt,this.locale=r,this.caseSensitive=t,this.diacriticSensitive=e;};ve.parse=function(t,e){if(2!==t.length)return e.error("Expected one argument.");var r=t[1];if("object"!=typeof r||Array.isArray(r))return e.error("Collator options argument must be an object.");var n=e.parse(void 0!==r["case-sensitive"]&&r["case-sensitive"],1,Ot);if(!n)return null;var i=e.parse(void 0!==r["diacritic-sensitive"]&&r["diacritic-sensitive"],1,Ot);if(!i)return null;var a=null;return r.locale&&!(a=e.parse(r.locale,1,Rt))?null:new ve(n,i,a)},ve.prototype.evaluate=function(t){return new Wt(this.caseSensitive.evaluate(t),this.diacriticSensitive.evaluate(t),this.locale?this.locale.evaluate(t):null)},ve.prototype.eachChild=function(t){t(this.caseSensitive),t(this.diacriticSensitive),this.locale&&t(this.locale);},ve.prototype.outputDefined=function(){return !1},ve.prototype.serialize=function(){var t={};return t["case-sensitive"]=this.caseSensitive.serialize(),t["diacritic-sensitive"]=this.diacriticSensitive.serialize(),this.locale&&(t.locale=this.locale.serialize()),["collator",t]};var ge=function(t,e){t&&(e?this.setSouthWest(t).setNorthEast(e):4===t.length?this.setSouthWest([t[0],t[1]]).setNorthEast([t[2],t[3]]):this.setSouthWest(t[0]).setNorthEast(t[1]));};ge.prototype.setNorthEast=function(t){return this._ne=t instanceof xe?new xe(t.lng,t.lat):xe.convert(t),this},ge.prototype.setSouthWest=function(t){return this._sw=t instanceof xe?new xe(t.lng,t.lat):xe.convert(t),this},ge.prototype.extend=function(t){var e,r,n=this._sw,i=this._ne;if(t instanceof xe)e=t,r=t;else{if(!(t instanceof ge))return Array.isArray(t)?4===t.length||t.every(Array.isArray)?this.extend(ge.convert(t)):this.extend(xe.convert(t)):this;if(r=t._ne,!(e=t._sw)||!r)return this}return n||i?(n.lng=Math.min(e.lng,n.lng),n.lat=Math.min(e.lat,n.lat),i.lng=Math.max(r.lng,i.lng),i.lat=Math.max(r.lat,i.lat)):(this._sw=new xe(e.lng,e.lat),this._ne=new xe(r.lng,r.lat)),this},ge.prototype.getCenter=function(){return new xe((this._sw.lng+this._ne.lng)/2,(this._sw.lat+this._ne.lat)/2)},ge.prototype.getSouthWest=function(){return this._sw},ge.prototype.getNorthEast=function(){return this._ne},ge.prototype.getNorthWest=function(){return new xe(this.getWest(),this.getNorth())},ge.prototype.getSouthEast=function(){return new xe(this.getEast(),this.getSouth())},ge.prototype.getWest=function(){return this._sw.lng},ge.prototype.getSouth=function(){return this._sw.lat},ge.prototype.getEast=function(){return this._ne.lng},ge.prototype.getNorth=function(){return this._ne.lat},ge.prototype.toArray=function(){return [this._sw.toArray(),this._ne.toArray()]},ge.prototype.toString=function(){return "LngLatBounds("+this._sw.toString()+", "+this._ne.toString()+")"},ge.prototype.isEmpty=function(){return !(this._sw&&this._ne)},ge.prototype.contains=function(t){var e=xe.convert(t),r=e.lng,n=e.lat,i=this._sw.lng<=r&&r<=this._ne.lng;return this._sw.lng>this._ne.lng&&(i=this._sw.lng>=r&&r>=this._ne.lng),this._sw.lat<=n&&n<=this._ne.lat&&i},ge.convert=function(t){return !t||t instanceof ge?t:new ge(t)};var xe=function(t,e){if(isNaN(t)||isNaN(e))throw new Error("Invalid LngLat object: ("+t+", "+e+")");if(this.lng=+t,this.lat=+e,this.lat>90||this.lat<-90)throw new Error("Invalid LngLat latitude value: must be between -90 and 90")};xe.prototype.wrap=function(){return new xe(l(this.lng,-180,180),this.lat)},xe.prototype.toArray=function(){return [this.lng,this.lat]},xe.prototype.toString=function(){return "LngLat("+this.lng+", "+this.lat+")"},xe.prototype.distanceTo=function(t){var e=Math.PI/180,r=this.lat*e,n=t.lat*e,i=Math.sin(r)*Math.sin(n)+Math.cos(r)*Math.cos(n)*Math.cos((t.lng-this.lng)*e);return 6371008.8*Math.acos(Math.min(i,1))},xe.prototype.toBounds=function(t){void 0===t&&(t=0);var e=360*t/40075017,r=e/Math.cos(Math.PI/180*this.lat);return new ge(new xe(this.lng-r,this.lat-e),new xe(this.lng+r,this.lat+e))},xe.convert=function(t){if(t instanceof xe)return t;if(Array.isArray(t)&&(2===t.length||3===t.length))return new xe(Number(t[0]),Number(t[1]));if(!Array.isArray(t)&&"object"==typeof t&&null!==t)return new xe(Number("lng"in t?t.lng:t.lon),Number(t.lat));throw new Error("`LngLatLike` argument must be specified as a LngLat instance, an object {lng: <lng>, lat: <lat>}, an object {lon: <lng>, lat: <lat>}, or an array of [<lng>, <lat>]")};var be=2*Math.PI*6371008.8;function we(t){return be*Math.cos(t*Math.PI/180)}function _e(t){return (180+t)/360}function Ae(t){return (180-180/Math.PI*Math.log(Math.tan(Math.PI/4+t*Math.PI/360)))/360}function Se(t,e){return t/we(e)}function ke(t){return 360/Math.PI*Math.atan(Math.exp((180-360*t)*Math.PI/180))-90}var Ie=function(t,e,r){void 0===r&&(r=0),this.x=+t,this.y=+e,this.z=+r;};Ie.fromLngLat=function(t,e){void 0===e&&(e=0);var r=xe.convert(t);return new Ie(_e(r.lng),Ae(r.lat),Se(e,r.lat))},Ie.prototype.toLngLat=function(){return new xe(360*this.x-180,ke(this.y))},Ie.prototype.toAltitude=function(){return this.z*we(ke(this.y))},Ie.prototype.meterInMercatorCoordinateUnits=function(){return 1/be*(t=ke(this.y),1/Math.cos(t*Math.PI/180));var t;};var ze=8192;function Ce(t,e){t[0]=Math.min(t[0],e[0]),t[1]=Math.min(t[1],e[1]),t[2]=Math.max(t[2],e[0]),t[3]=Math.max(t[3],e[1]);}function Me(t,e){return !(t[0]<=e[0]||t[2]>=e[2]||t[1]<=e[1]||t[3]>=e[3])}function Te(t,e){var r=Ie.fromLngLat({lng:t[0],lat:t[1]},0),n=Math.pow(2,e.z);return [Math.round(r.x*n*ze),Math.round(r.y*n*ze)]}function Ee(t,e,r){return e[1]>t[1]!=r[1]>t[1]&&t[0]<(r[0]-e[0])*(t[1]-e[1])/(r[1]-e[1])+e[0]}function Pe(t,e){for(var r,n,i,a,o,s,u,l=!1,p=0,c=e.length;p<c;p++)for(var h=e[p],f=0,y=h.length;f<y-1;f++){if((a=(r=t)[0]-(n=h[f])[0])*(u=r[1]-(i=h[f+1])[1])-(s=r[0]-i[0])*(o=r[1]-n[1])==0&&a*s<=0&&o*u<=0)return !1;Ee(t,h[f],h[f+1])&&(l=!l);}return l}function Be(t,e){for(var r=0;r<e.length;r++)if(Pe(t,e[r]))return !0;return !1}function Ve(t,e,r,n){var i=n[0]-r[0],a=n[1]-r[1];return ((t[0]-r[0])*a-i*(t[1]-r[1]))*((e[0]-r[0])*a-i*(e[1]-r[1]))<0}function Fe(t,e,r){for(var n=0,i=r;n<i.length;n+=1)for(var a=i[n],o=0;o<a.length-1;++o)if(0!=(c=[(p=a[o+1])[0]-(l=a[o])[0],p[1]-l[1]])[0]*(h=[(u=e)[0]-(s=t)[0],u[1]-s[1]])[1]-c[1]*h[0]&&Ve(s,u,l,p)&&Ve(l,p,s,u))return !0;var s,u,l,p,c,h;return !1}function De(t,e){for(var r=0;r<t.length;++r)if(!Pe(t[r],e))return !1;for(var n=0;n<t.length-1;++n)if(Fe(t[n],t[n+1],e))return !1;return !0}function Le(t,e){for(var r=0;r<e.length;r++)if(De(t,e[r]))return !0;return !1}function Re(t,e,r){for(var n=[],i=0;i<t.length;i++){for(var a=[],o=0;o<t[i].length;o++){var s=Te(t[i][o],r);Ce(e,s),a.push(s);}n.push(a);}return n}function Oe(t,e,r){for(var n=[],i=0;i<t.length;i++){var a=Re(t[i],e,r);n.push(a);}return n}var Ue=function(t,e){this.type=Ot,this.geojson=t,this.geometries=e;};function je(t){if(t instanceof me){if("get"===t.name&&1===t.args.length)return !1;if("feature-state"===t.name)return !1;if("has"===t.name&&1===t.args.length)return !1;if("properties"===t.name||"geometry-type"===t.name||"id"===t.name)return !1;if(/^filter-/.test(t.name))return !1}if(t instanceof Ue)return !1;var e=!0;return t.eachChild((function(t){e&&!je(t)&&(e=!1);})),e}function qe(t){if(t instanceof me&&"feature-state"===t.name)return !1;var e=!0;return t.eachChild((function(t){e&&!qe(t)&&(e=!1);})),e}function Ne(t,e){if(t instanceof me&&e.indexOf(t.name)>=0)return !1;var r=!0;return t.eachChild((function(t){r&&!Ne(t,e)&&(r=!1);})),r}Ue.parse=function(t,e){if(2!==t.length)return e.error("'within' expression requires exactly one argument, but found "+(t.length-1)+" instead.");if(ne(t[1])){var r=t[1];if("FeatureCollection"===r.type)for(var n=0;n<r.features.length;++n){var i=r.features[n].geometry.type;if("Polygon"===i||"MultiPolygon"===i)return new Ue(r,r.features[n].geometry)}else if("Feature"===r.type){var a=r.geometry.type;if("Polygon"===a||"MultiPolygon"===a)return new Ue(r,r.geometry)}else if("Polygon"===r.type||"MultiPolygon"===r.type)return new Ue(r,r)}return e.error("'within' expression requires valid geojson object that contains polygon geometry type.")},Ue.prototype.evaluate=function(t){if(null!=t.geometry()&&null!=t.canonicalID()){if("Point"===t.geometryType())return function(t,e){for(var r=[1/0,1/0,-1/0,-1/0],n=[1/0,1/0,-1/0,-1/0],i=t.canonicalID(),a=[i.x*ze,i.y*ze],o=[],s=0,u=t.geometry();s<u.length;s+=1)for(var l=0,p=u[s];l<p.length;l+=1){var c=p[l],h=[c.x+a[0],c.y+a[1]];Ce(r,h),o.push(h);}if("Polygon"===e.type){var f=Re(e.coordinates,n,i);if(!Me(r,n))return !1;for(var y=0,d=o;y<d.length;y+=1)if(!Pe(d[y],f))return !1}if("MultiPolygon"===e.type){var m=Oe(e.coordinates,n,i);if(!Me(r,n))return !1;for(var v=0,g=o;v<g.length;v+=1)if(!Be(g[v],m))return !1}return !0}(t,this.geometries);if("LineString"===t.geometryType())return function(t,e){for(var r=[1/0,1/0,-1/0,-1/0],n=[1/0,1/0,-1/0,-1/0],i=t.canonicalID(),a=[i.x*ze,i.y*ze],o=[],s=0,u=t.geometry();s<u.length;s+=1){for(var l=[],p=0,c=u[s];p<c.length;p+=1){var h=c[p],f=[h.x+a[0],h.y+a[1]];Ce(r,f),l.push(f);}o.push(l);}if("Polygon"===e.type){var y=Re(e.coordinates,n,i);if(!Me(r,n))return !1;for(var d=0,m=o;d<m.length;d+=1)if(!De(m[d],y))return !1}if("MultiPolygon"===e.type){var v=Oe(e.coordinates,n,i);if(!Me(r,n))return !1;for(var g=0,x=o;g<x.length;g+=1)if(!Le(x[g],v))return !1}return !0}(t,this.geometries)}return !1},Ue.prototype.eachChild=function(){},Ue.prototype.outputDefined=function(){return !0},Ue.prototype.serialize=function(){return ["within",this.geojson]};var Ke=function(t,e){this.type=e.type,this.name=t,this.boundExpression=e;};Ke.parse=function(t,e){if(2!==t.length||"string"!=typeof t[1])return e.error("'var' expression requires exactly one string literal argument.");var r=t[1];return e.scope.has(r)?new Ke(r,e.scope.get(r)):e.error('Unknown variable "'+r+'". Make sure "'+r+'" has been bound in an enclosing "let" expression before using it.',1)},Ke.prototype.evaluate=function(t){return this.boundExpression.evaluate(t)},Ke.prototype.eachChild=function(){},Ke.prototype.outputDefined=function(){return !1},Ke.prototype.serialize=function(){return ["var",this.name]};var Ge=function(t,e,r,n,i){void 0===e&&(e=[]),void 0===n&&(n=new Ft),void 0===i&&(i=[]),this.registry=t,this.path=e,this.key=e.map((function(t){return "["+t+"]"})).join(""),this.scope=n,this.errors=i,this.expectedType=r;};function Ze(t,e){for(var r,n=t.length-1,i=0,a=n,o=0;i<=a;)if((r=t[o=Math.floor((i+a)/2)])<=e){if(o===n||e<t[o+1])return o;i=o+1;}else{if(!(r>e))throw new se("Input is not a number.");a=o-1;}return 0}Ge.prototype.parse=function(t,e,r,n,i){return void 0===i&&(i={}),e?this.concat(e,r,n)._parse(t,i):this._parse(t,i)},Ge.prototype._parse=function(t,e){function r(t,e,r){return "assert"===r?new le(e,[t]):"coerce"===r?new fe(e,[t]):t}if(null!==t&&"string"!=typeof t&&"boolean"!=typeof t&&"number"!=typeof t||(t=["literal",t]),Array.isArray(t)){if(0===t.length)return this.error('Expected an array with at least one element. If you wanted a literal array, use ["literal", []].');var n=t[0];if("string"!=typeof n)return this.error("Expression name must be a string, but found "+typeof n+' instead. If you wanted a literal array, use ["literal", [...]].',0),null;var i=this.registry[n];if(i){var a=i.parse(t,this);if(!a)return null;if(this.expectedType){var o=this.expectedType,s=a.type;if("string"!==o.kind&&"number"!==o.kind&&"boolean"!==o.kind&&"object"!==o.kind&&"array"!==o.kind||"value"!==s.kind)if("color"!==o.kind&&"formatted"!==o.kind&&"resolvedImage"!==o.kind||"value"!==s.kind&&"string"!==s.kind){if(this.checkSubtype(o,s))return null}else a=r(a,o,e.typeAnnotation||"coerce");else a=r(a,o,e.typeAnnotation||"assert");}if(!(a instanceof oe)&&"resolvedImage"!==a.type.kind&&function t(e){if(e instanceof Ke)return t(e.boundExpression);if(e instanceof me&&"error"===e.name)return !1;if(e instanceof ve)return !1;if(e instanceof Ue)return !1;var r=e instanceof fe||e instanceof le,n=!0;return e.eachChild((function(e){n=r?n&&t(e):n&&e instanceof oe;})),!!n&&je(e)&&Ne(e,["zoom","heatmap-density","line-progress","accumulated","is-supported-script"])}(a)){var u=new de;try{a=new oe(a.type,a.evaluate(u));}catch(t){return this.error(t.message),null}}return a}return this.error('Unknown expression "'+n+'". If you wanted a literal array, use ["literal", [...]].',0)}return this.error(void 0===t?"'undefined' value invalid. Use null instead.":"object"==typeof t?'Bare objects invalid. Use ["literal", {...}] instead.':"Expected an array, but found "+typeof t+" instead.")},Ge.prototype.concat=function(t,e,r){var n="number"==typeof t?this.path.concat(t):this.path,i=r?this.scope.concat(r):this.scope;return new Ge(this.registry,n,e||null,i,this.errors)},Ge.prototype.error=function(t){for(var e=[],r=arguments.length-1;r-- >0;)e[r]=arguments[r+1];var n=""+this.key+e.map((function(t){return "["+t+"]"})).join("");this.errors.push(new Vt(n,t));},Ge.prototype.checkSubtype=function(t,e){var r=Ht(t,e);return r&&this.error(r),r};var Xe=function(t,e,r){this.type=t,this.input=e,this.labels=[],this.outputs=[];for(var n=0,i=r;n<i.length;n+=1){var a=i[n],o=a[1];this.labels.push(a[0]),this.outputs.push(o);}};function Je(t,e,r){return t*(1-r)+e*r}Xe.parse=function(t,e){if(t.length-1<4)return e.error("Expected at least 4 arguments, but found only "+(t.length-1)+".");if((t.length-1)%2!=0)return e.error("Expected an even number of arguments.");var r=e.parse(t[1],1,Lt);if(!r)return null;var n=[],i=null;e.expectedType&&"value"!==e.expectedType.kind&&(i=e.expectedType);for(var a=1;a<t.length;a+=2){var o=1===a?-1/0:t[a],s=t[a+1],u=a,l=a+1;if("number"!=typeof o)return e.error('Input/output pairs for "step" expressions must be defined using literal numeric values (not computed expressions) for the input values.',u);if(n.length&&n[n.length-1][0]>=o)return e.error('Input/output pairs for "step" expressions must be arranged with input values in strictly ascending order.',u);var p=e.parse(s,l,i);if(!p)return null;i=i||p.type,n.push([o,p]);}return new Xe(i,r,n)},Xe.prototype.evaluate=function(t){var e=this.labels,r=this.outputs;if(1===e.length)return r[0].evaluate(t);var n=this.input.evaluate(t);if(n<=e[0])return r[0].evaluate(t);var i=e.length;return n>=e[i-1]?r[i-1].evaluate(t):r[Ze(e,n)].evaluate(t)},Xe.prototype.eachChild=function(t){t(this.input);for(var e=0,r=this.outputs;e<r.length;e+=1)t(r[e]);},Xe.prototype.outputDefined=function(){return this.outputs.every((function(t){return t.outputDefined()}))},Xe.prototype.serialize=function(){for(var t=["step",this.input.serialize()],e=0;e<this.labels.length;e++)e>0&&t.push(this.labels[e]),t.push(this.outputs[e].serialize());return t};var He=Object.freeze({__proto__:null,number:Je,color:function(t,e,r){return new $t(Je(t.r,e.r,r),Je(t.g,e.g,r),Je(t.b,e.b,r),Je(t.a,e.a,r))},array:function(t,e,r){return t.map((function(t,n){return Je(t,e[n],r)}))}}),Ye=.95047,$e=1,We=1.08883,Qe=4/29,tr=6/29,er=3*tr*tr,rr=tr*tr*tr,nr=Math.PI/180,ir=180/Math.PI;function ar(t){return t>rr?Math.pow(t,1/3):t/er+Qe}function or(t){return t>tr?t*t*t:er*(t-Qe)}function sr(t){return 255*(t<=.0031308?12.92*t:1.055*Math.pow(t,1/2.4)-.055)}function ur(t){return (t/=255)<=.04045?t/12.92:Math.pow((t+.055)/1.055,2.4)}function lr(t){var e=ur(t.r),r=ur(t.g),n=ur(t.b),i=ar((.4124564*e+.3575761*r+.1804375*n)/Ye),a=ar((.2126729*e+.7151522*r+.072175*n)/$e);return {l:116*a-16,a:500*(i-a),b:200*(a-ar((.0193339*e+.119192*r+.9503041*n)/We)),alpha:t.a}}function pr(t){var e=(t.l+16)/116,r=isNaN(t.a)?e:e+t.a/500,n=isNaN(t.b)?e:e-t.b/200;return e=$e*or(e),r=Ye*or(r),n=We*or(n),new $t(sr(3.2404542*r-1.5371385*e-.4985314*n),sr(-.969266*r+1.8760108*e+.041556*n),sr(.0556434*r-.2040259*e+1.0572252*n),t.alpha)}function cr(t,e,r){var n=e-t;return t+r*(n>180||n<-180?n-360*Math.round(n/360):n)}var hr={forward:lr,reverse:pr,interpolate:function(t,e,r){return {l:Je(t.l,e.l,r),a:Je(t.a,e.a,r),b:Je(t.b,e.b,r),alpha:Je(t.alpha,e.alpha,r)}}},fr={forward:function(t){var e=lr(t),r=e.l,n=e.a,i=e.b,a=Math.atan2(i,n)*ir;return {h:a<0?a+360:a,c:Math.sqrt(n*n+i*i),l:r,alpha:t.a}},reverse:function(t){var e=t.h*nr,r=t.c;return pr({l:t.l,a:Math.cos(e)*r,b:Math.sin(e)*r,alpha:t.alpha})},interpolate:function(t,e,r){return {h:cr(t.h,e.h,r),c:Je(t.c,e.c,r),l:Je(t.l,e.l,r),alpha:Je(t.alpha,e.alpha,r)}}},yr=Object.freeze({__proto__:null,lab:hr,hcl:fr}),dr=function(t,e,r,n,i){this.type=t,this.operator=e,this.interpolation=r,this.input=n,this.labels=[],this.outputs=[];for(var a=0,o=i;a<o.length;a+=1){var s=o[a],u=s[1];this.labels.push(s[0]),this.outputs.push(u);}};function mr(t,e,r,n){var i=n-r,a=t-r;return 0===i?0:1===e?a/i:(Math.pow(e,a)-1)/(Math.pow(e,i)-1)}dr.interpolationFactor=function(t,e,n,i){var a=0;if("exponential"===t.name)a=mr(e,t.base,n,i);else if("linear"===t.name)a=mr(e,1,n,i);else if("cubic-bezier"===t.name){var o=t.controlPoints;a=new r(o[0],o[1],o[2],o[3]).solve(mr(e,1,n,i));}return a},dr.parse=function(t,e){var r=t[0],n=t[1],i=t[2],a=t.slice(3);if(!Array.isArray(n)||0===n.length)return e.error("Expected an interpolation type expression.",1);if("linear"===n[0])n={name:"linear"};else if("exponential"===n[0]){var o=n[1];if("number"!=typeof o)return e.error("Exponential interpolation requires a numeric base.",1,1);n={name:"exponential",base:o};}else{if("cubic-bezier"!==n[0])return e.error("Unknown interpolation type "+String(n[0]),1,0);var s=n.slice(1);if(4!==s.length||s.some((function(t){return "number"!=typeof t||t<0||t>1})))return e.error("Cubic bezier interpolation requires four numeric arguments with values between 0 and 1.",1);n={name:"cubic-bezier",controlPoints:s};}if(t.length-1<4)return e.error("Expected at least 4 arguments, but found only "+(t.length-1)+".");if((t.length-1)%2!=0)return e.error("Expected an even number of arguments.");if(!(i=e.parse(i,2,Lt)))return null;var u=[],l=null;"interpolate-hcl"===r||"interpolate-lab"===r?l=Ut:e.expectedType&&"value"!==e.expectedType.kind&&(l=e.expectedType);for(var p=0;p<a.length;p+=2){var c=a[p],h=a[p+1],f=p+3,y=p+4;if("number"!=typeof c)return e.error('Input/output pairs for "interpolate" expressions must be defined using literal numeric values (not computed expressions) for the input values.',f);if(u.length&&u[u.length-1][0]>=c)return e.error('Input/output pairs for "interpolate" expressions must be arranged with input values in strictly ascending order.',f);var d=e.parse(h,y,l);if(!d)return null;l=l||d.type,u.push([c,d]);}return "number"===l.kind||"color"===l.kind||"array"===l.kind&&"number"===l.itemType.kind&&"number"==typeof l.N?new dr(l,r,n,i,u):e.error("Type "+Xt(l)+" is not interpolatable.")},dr.prototype.evaluate=function(t){var e=this.labels,r=this.outputs;if(1===e.length)return r[0].evaluate(t);var n=this.input.evaluate(t);if(n<=e[0])return r[0].evaluate(t);var i=e.length;if(n>=e[i-1])return r[i-1].evaluate(t);var a=Ze(e,n),o=dr.interpolationFactor(this.interpolation,n,e[a],e[a+1]),s=r[a].evaluate(t),u=r[a+1].evaluate(t);return "interpolate"===this.operator?He[this.type.kind.toLowerCase()](s,u,o):"interpolate-hcl"===this.operator?fr.reverse(fr.interpolate(fr.forward(s),fr.forward(u),o)):hr.reverse(hr.interpolate(hr.forward(s),hr.forward(u),o))},dr.prototype.eachChild=function(t){t(this.input);for(var e=0,r=this.outputs;e<r.length;e+=1)t(r[e]);},dr.prototype.outputDefined=function(){return this.outputs.every((function(t){return t.outputDefined()}))},dr.prototype.serialize=function(){var t;t="linear"===this.interpolation.name?["linear"]:"exponential"===this.interpolation.name?1===this.interpolation.base?["linear"]:["exponential",this.interpolation.base]:["cubic-bezier"].concat(this.interpolation.controlPoints);for(var e=[this.operator,t,this.input.serialize()],r=0;r<this.labels.length;r++)e.push(this.labels[r],this.outputs[r].serialize());return e};var vr=function(t,e){this.type=t,this.args=e;};vr.parse=function(t,e){if(t.length<2)return e.error("Expectected at least one argument.");var r=null,n=e.expectedType;n&&"value"!==n.kind&&(r=n);for(var i=[],a=0,o=t.slice(1);a<o.length;a+=1){var s=e.parse(o[a],1+i.length,r,void 0,{typeAnnotation:"omit"});if(!s)return null;r=r||s.type,i.push(s);}var u=n&&i.some((function(t){return Ht(n,t.type)}));return new vr(u?qt:r,i)},vr.prototype.evaluate=function(t){for(var e,r=null,n=0,i=0,a=this.args;i<a.length&&(n++,(r=a[i].evaluate(t))&&r instanceof ee&&!r.available&&(e||(e=r.name),r=null,n===this.args.length&&(r=e)),null===r);i+=1);return r},vr.prototype.eachChild=function(t){this.args.forEach(t);},vr.prototype.outputDefined=function(){return this.args.every((function(t){return t.outputDefined()}))},vr.prototype.serialize=function(){var t=["coalesce"];return this.eachChild((function(e){t.push(e.serialize());})),t};var gr=function(t,e){this.type=e.type,this.bindings=[].concat(t),this.result=e;};gr.prototype.evaluate=function(t){return this.result.evaluate(t)},gr.prototype.eachChild=function(t){for(var e=0,r=this.bindings;e<r.length;e+=1)t(r[e][1]);t(this.result);},gr.parse=function(t,e){if(t.length<4)return e.error("Expected at least 3 arguments, but found "+(t.length-1)+" instead.");for(var r=[],n=1;n<t.length-1;n+=2){var i=t[n];if("string"!=typeof i)return e.error("Expected string, but found "+typeof i+" instead.",n);if(/[^a-zA-Z0-9_]/.test(i))return e.error("Variable names must contain only alphanumeric characters or '_'.",n);var a=e.parse(t[n+1],n+1);if(!a)return null;r.push([i,a]);}var o=e.parse(t[t.length-1],t.length-1,e.expectedType,r);return o?new gr(r,o):null},gr.prototype.outputDefined=function(){return this.result.outputDefined()},gr.prototype.serialize=function(){for(var t=["let"],e=0,r=this.bindings;e<r.length;e+=1){var n=r[e];t.push(n[0],n[1].serialize());}return t.push(this.result.serialize()),t};var xr=function(t,e,r){this.type=t,this.index=e,this.input=r;};xr.parse=function(t,e){if(3!==t.length)return e.error("Expected 2 arguments, but found "+(t.length-1)+" instead.");var r=e.parse(t[1],1,Lt),n=e.parse(t[2],2,Zt(e.expectedType||qt));return r&&n?new xr(n.type.itemType,r,n):null},xr.prototype.evaluate=function(t){var e=this.index.evaluate(t),r=this.input.evaluate(t);if(e<0)throw new se("Array index out of bounds: "+e+" < 0.");if(e>=r.length)throw new se("Array index out of bounds: "+e+" > "+(r.length-1)+".");if(e!==Math.floor(e))throw new se("Array index must be an integer, but found "+e+" instead.");return r[e]},xr.prototype.eachChild=function(t){t(this.index),t(this.input);},xr.prototype.outputDefined=function(){return !1},xr.prototype.serialize=function(){return ["at",this.index.serialize(),this.input.serialize()]};var br=function(t,e){this.type=Ot,this.needle=t,this.haystack=e;};br.parse=function(t,e){if(3!==t.length)return e.error("Expected 2 arguments, but found "+(t.length-1)+" instead.");var r,n=e.parse(t[1],1,qt),i=e.parse(t[2],2,qt);return n&&i?"boolean"!==(r=n.type).kind&&"string"!==r.kind&&"number"!==r.kind&&"null"!==r.kind&&"value"!==r.kind?e.error("Expected first argument to be of type boolean, string, number or null, but found "+Xt(n.type)+" instead"):new br(n,i):null},br.prototype.evaluate=function(t){var e=this.needle.evaluate(t),r=this.haystack.evaluate(t);if(null==e||!r)return !1;if(!function(t){return "boolean"==typeof t||"string"==typeof t||"number"==typeof t}(e))throw new se("Expected first argument to be of type boolean, string or number, but found "+Xt(ie(e))+" instead.");if(!function(t){return Array.isArray(t)||"string"==typeof t}(r))throw new se("Expected second argument to be of type array or string, but found "+Xt(ie(r))+" instead.");return r.indexOf(e)>=0},br.prototype.eachChild=function(t){t(this.needle),t(this.haystack);},br.prototype.outputDefined=function(){return !0},br.prototype.serialize=function(){return ["in",this.needle.serialize(),this.haystack.serialize()]};var wr=function(t,e,r,n,i,a){this.inputType=t,this.type=e,this.input=r,this.cases=n,this.outputs=i,this.otherwise=a;};wr.parse=function(t,e){if(t.length<5)return e.error("Expected at least 4 arguments, but found only "+(t.length-1)+".");if(t.length%2!=1)return e.error("Expected an even number of arguments.");var r,n;e.expectedType&&"value"!==e.expectedType.kind&&(n=e.expectedType);for(var i={},a=[],o=2;o<t.length-1;o+=2){var s=t[o],u=t[o+1];Array.isArray(s)||(s=[s]);var l=e.concat(o);if(0===s.length)return l.error("Expected at least one branch label.");for(var p=0,c=s;p<c.length;p+=1){var h=c[p];if("number"!=typeof h&&"string"!=typeof h)return l.error("Branch labels must be numbers or strings.");if("number"==typeof h&&Math.abs(h)>Number.MAX_SAFE_INTEGER)return l.error("Branch labels must be integers no larger than "+Number.MAX_SAFE_INTEGER+".");if("number"==typeof h&&Math.floor(h)!==h)return l.error("Numeric branch labels must be integer values.");if(r){if(l.checkSubtype(r,ie(h)))return null}else r=ie(h);if(void 0!==i[String(h)])return l.error("Branch labels must be unique.");i[String(h)]=a.length;}var f=e.parse(u,o,n);if(!f)return null;n=n||f.type,a.push(f);}var y=e.parse(t[1],1,qt);if(!y)return null;var d=e.parse(t[t.length-1],t.length-1,n);return d?"value"!==y.type.kind&&e.concat(1).checkSubtype(r,y.type)?null:new wr(r,n,y,i,a,d):null},wr.prototype.evaluate=function(t){var e=this.input.evaluate(t);return (ie(e)===this.inputType&&this.outputs[this.cases[e]]||this.otherwise).evaluate(t)},wr.prototype.eachChild=function(t){t(this.input),this.outputs.forEach(t),t(this.otherwise);},wr.prototype.outputDefined=function(){return this.outputs.every((function(t){return t.outputDefined()}))&&this.otherwise.outputDefined()},wr.prototype.serialize=function(){for(var t=this,e=["match",this.input.serialize()],r=[],n={},i=0,a=Object.keys(this.cases).sort();i<a.length;i+=1){var o=a[i];void 0===(c=n[this.cases[o]])?(n[this.cases[o]]=r.length,r.push([this.cases[o],[o]])):r[c][1].push(o);}for(var s=function(e){return "number"===t.inputType.kind?Number(e):e},u=0,l=r;u<l.length;u+=1){var p=l[u],c=p[0],h=p[1];e.push(1===h.length?s(h[0]):h.map(s)),e.push(this.outputs[outputIndex$1].serialize());}return e.push(this.otherwise.serialize()),e};var _r=function(t,e,r){this.type=t,this.branches=e,this.otherwise=r;};function Ar(t,e){return "=="===t||"!="===t?"boolean"===e.kind||"string"===e.kind||"number"===e.kind||"null"===e.kind||"value"===e.kind:"string"===e.kind||"number"===e.kind||"value"===e.kind}function Sr(t,e,r,n){return 0===n.compare(e,r)}function kr(t,e,r){var n="=="!==t&&"!="!==t;return function(){function i(t,e,r){this.type=Ot,this.lhs=t,this.rhs=e,this.collator=r,this.hasUntypedArgument="value"===t.type.kind||"value"===e.type.kind;}return i.parse=function(t,e){if(3!==t.length&&4!==t.length)return e.error("Expected two or three arguments.");var r=t[0],a=e.parse(t[1],1,qt);if(!a)return null;if(!Ar(r,a.type))return e.concat(1).error('"'+r+"\" comparisons are not supported for type '"+Xt(a.type)+"'.");var o=e.parse(t[2],2,qt);if(!o)return null;if(!Ar(r,o.type))return e.concat(2).error('"'+r+"\" comparisons are not supported for type '"+Xt(o.type)+"'.");if(a.type.kind!==o.type.kind&&"value"!==a.type.kind&&"value"!==o.type.kind)return e.error("Cannot compare types '"+Xt(a.type)+"' and '"+Xt(o.type)+"'.");n&&("value"===a.type.kind&&"value"!==o.type.kind?a=new le(o.type,[a]):"value"!==a.type.kind&&"value"===o.type.kind&&(o=new le(a.type,[o])));var s=null;if(4===t.length){if("string"!==a.type.kind&&"string"!==o.type.kind&&"value"!==a.type.kind&&"value"!==o.type.kind)return e.error("Cannot use collator to compare non-string types.");if(!(s=e.parse(t[3],3,Nt)))return null}return new i(a,o,s)},i.prototype.evaluate=function(i){var a=this.lhs.evaluate(i),o=this.rhs.evaluate(i);if(n&&this.hasUntypedArgument){var s=ie(a),u=ie(o);if(s.kind!==u.kind||"string"!==s.kind&&"number"!==s.kind)throw new se('Expected arguments for "'+t+'" to be (string, string) or (number, number), but found ('+s.kind+", "+u.kind+") instead.")}if(this.collator&&!n&&this.hasUntypedArgument){var l=ie(a),p=ie(o);if("string"!==l.kind||"string"!==p.kind)return e(i,a,o)}return this.collator?r(i,a,o,this.collator.evaluate(i)):e(i,a,o)},i.prototype.eachChild=function(t){t(this.lhs),t(this.rhs),this.collator&&t(this.collator);},i.prototype.outputDefined=function(){return !0},i.prototype.serialize=function(){var e=[t];return this.eachChild((function(t){e.push(t.serialize());})),e},i}()}_r.parse=function(t,e){if(t.length<4)return e.error("Expected at least 3 arguments, but found only "+(t.length-1)+".");if(t.length%2!=0)return e.error("Expected an odd number of arguments.");var r;e.expectedType&&"value"!==e.expectedType.kind&&(r=e.expectedType);for(var n=[],i=1;i<t.length-1;i+=2){var a=e.parse(t[i],i,Ot);if(!a)return null;var o=e.parse(t[i+1],i+1,r);if(!o)return null;n.push([a,o]),r=r||o.type;}var s=e.parse(t[t.length-1],t.length-1,r);return s?new _r(r,n,s):null},_r.prototype.evaluate=function(t){for(var e=0,r=this.branches;e<r.length;e+=1){var n=r[e],i=n[1];if(n[0].evaluate(t))return i.evaluate(t)}return this.otherwise.evaluate(t)},_r.prototype.eachChild=function(t){for(var e=0,r=this.branches;e<r.length;e+=1){var n=r[e],i=n[1];t(n[0]),t(i);}t(this.otherwise);},_r.prototype.outputDefined=function(){return this.branches.every((function(t){return t[1].outputDefined()}))&&this.otherwise.outputDefined()},_r.prototype.serialize=function(){var t=["case"];return this.eachChild((function(e){t.push(e.serialize());})),t};var Ir=kr("==",(function(t,e,r){return e===r}),Sr),zr=kr("!=",(function(t,e,r){return e!==r}),(function(t,e,r,n){return !Sr(0,e,r,n)})),Cr=kr("<",(function(t,e,r){return e<r}),(function(t,e,r,n){return n.compare(e,r)<0})),Mr=kr(">",(function(t,e,r){return e>r}),(function(t,e,r,n){return n.compare(e,r)>0})),Tr=kr("<=",(function(t,e,r){return e<=r}),(function(t,e,r,n){return n.compare(e,r)<=0})),Er=kr(">=",(function(t,e,r){return e>=r}),(function(t,e,r,n){return n.compare(e,r)>=0})),Pr=function(t,e,r,n,i){this.type=Rt,this.number=t,this.locale=e,this.currency=r,this.minFractionDigits=n,this.maxFractionDigits=i;};Pr.parse=function(t,e){if(3!==t.length)return e.error("Expected two arguments.");var r=e.parse(t[1],1,Lt);if(!r)return null;var n=t[2];if("object"!=typeof n||Array.isArray(n))return e.error("NumberFormat options argument must be an object.");var i=null;if(n.locale&&!(i=e.parse(n.locale,1,Rt)))return null;var a=null;if(n.currency&&!(a=e.parse(n.currency,1,Rt)))return null;var o=null;if(n["min-fraction-digits"]&&!(o=e.parse(n["min-fraction-digits"],1,Lt)))return null;var s=null;return n["max-fraction-digits"]&&!(s=e.parse(n["max-fraction-digits"],1,Lt))?null:new Pr(r,i,a,o,s)},Pr.prototype.evaluate=function(t){return new Intl.NumberFormat(this.locale?this.locale.evaluate(t):[],{style:this.currency?"currency":"decimal",currency:this.currency?this.currency.evaluate(t):void 0,minimumFractionDigits:this.minFractionDigits?this.minFractionDigits.evaluate(t):void 0,maximumFractionDigits:this.maxFractionDigits?this.maxFractionDigits.evaluate(t):void 0}).format(this.number.evaluate(t))},Pr.prototype.eachChild=function(t){t(this.number),this.locale&&t(this.locale),this.currency&&t(this.currency),this.minFractionDigits&&t(this.minFractionDigits),this.maxFractionDigits&&t(this.maxFractionDigits);},Pr.prototype.outputDefined=function(){return !1},Pr.prototype.serialize=function(){var t={};return this.locale&&(t.locale=this.locale.serialize()),this.currency&&(t.currency=this.currency.serialize()),this.minFractionDigits&&(t["min-fraction-digits"]=this.minFractionDigits.serialize()),this.maxFractionDigits&&(t["max-fraction-digits"]=this.maxFractionDigits.serialize()),["number-format",this.number.serialize(),t]};var Br=function(t){this.type=Lt,this.input=t;};Br.parse=function(t,e){if(2!==t.length)return e.error("Expected 1 argument, but found "+(t.length-1)+" instead.");var r=e.parse(t[1],1);return r?"array"!==r.type.kind&&"string"!==r.type.kind&&"value"!==r.type.kind?e.error("Expected argument of type string or array, but found "+Xt(r.type)+" instead."):new Br(r):null},Br.prototype.evaluate=function(t){var e=this.input.evaluate(t);if("string"==typeof e)return e.length;if(Array.isArray(e))return e.length;throw new se("Expected value to be of type string or array, but found "+Xt(ie(e))+" instead.")},Br.prototype.eachChild=function(t){t(this.input);},Br.prototype.outputDefined=function(){return !1},Br.prototype.serialize=function(){var t=["length"];return this.eachChild((function(e){t.push(e.serialize());})),t};var Vr={"==":Ir,"!=":zr,">":Mr,"<":Cr,">=":Er,"<=":Tr,array:le,at:xr,boolean:le,case:_r,coalesce:vr,collator:ve,format:pe,image:ce,in:br,interpolate:dr,"interpolate-hcl":dr,"interpolate-lab":dr,length:Br,let:gr,literal:oe,match:wr,number:le,"number-format":Pr,object:le,step:Xe,string:le,"to-boolean":fe,"to-color":fe,"to-number":fe,"to-string":fe,var:Ke,within:Ue};function Fr(t,e){var r=e[0],n=e[1],i=e[2],a=e[3];r=r.evaluate(t),n=n.evaluate(t),i=i.evaluate(t);var o=a?a.evaluate(t):1,s=re(r,n,i,o);if(s)throw new se(s);return new $t(r/255*o,n/255*o,i/255*o,o)}function Dr(t,e){return t in e}function Lr(t,e){var r=e[t];return void 0===r?null:r}function Rr(t){return {type:t}}function Or(t){return {result:"success",value:t}}function Ur(t){return {result:"error",value:t}}function jr(t){return "data-driven"===t["property-type"]||"cross-faded-data-driven"===t["property-type"]}function qr(t){return !!t.expression&&t.expression.parameters.indexOf("zoom")>-1}function Nr(t){return !!t.expression&&t.expression.interpolated}function Kr(t){return t instanceof Number?"number":t instanceof String?"string":t instanceof Boolean?"boolean":Array.isArray(t)?"array":null===t?"null":typeof t}function Gr(t){return "object"==typeof t&&null!==t&&!Array.isArray(t)}function Zr(t){return t}function Xr(t,e,r){return void 0!==t?t:void 0!==e?e:void 0!==r?r:void 0}function Jr(t,e,r,n,i){return Xr(typeof r===i?n[r]:void 0,t.default,e.default)}function Hr(t,e,r){if("number"!==Kr(r))return Xr(t.default,e.default);var n=t.stops.length;if(1===n)return t.stops[0][1];if(r<=t.stops[0][0])return t.stops[0][1];if(r>=t.stops[n-1][0])return t.stops[n-1][1];var i=Ze(t.stops.map((function(t){return t[0]})),r);return t.stops[i][1]}function Yr(t,e,r){var n=void 0!==t.base?t.base:1;if("number"!==Kr(r))return Xr(t.default,e.default);var i=t.stops.length;if(1===i)return t.stops[0][1];if(r<=t.stops[0][0])return t.stops[0][1];if(r>=t.stops[i-1][0])return t.stops[i-1][1];var a=Ze(t.stops.map((function(t){return t[0]})),r),o=function(t,e,r,n){var i=n-r,a=t-r;return 0===i?0:1===e?a/i:(Math.pow(e,a)-1)/(Math.pow(e,i)-1)}(r,n,t.stops[a][0],t.stops[a+1][0]),s=t.stops[a][1],u=t.stops[a+1][1],l=He[e.type]||Zr;if(t.colorSpace&&"rgb"!==t.colorSpace){var p=yr[t.colorSpace];l=function(t,e){return p.reverse(p.interpolate(p.forward(t),p.forward(e),o))};}return "function"==typeof s.evaluate?{evaluate:function(){for(var t=[],e=arguments.length;e--;)t[e]=arguments[e];var r=s.evaluate.apply(void 0,t),n=u.evaluate.apply(void 0,t);if(void 0!==r&&void 0!==n)return l(r,n,o)}}:l(s,u,o)}function $r(t,e,r){return "color"===e.type?r=$t.parse(r):"formatted"===e.type?r=te.fromString(r.toString()):"resolvedImage"===e.type?r=ee.fromString(r.toString()):Kr(r)===e.type||"enum"===e.type&&e.values[r]||(r=void 0),Xr(r,t.default,e.default)}me.register(Vr,{error:[{kind:"error"},[Rt],function(t,e){throw new se(e[0].evaluate(t))}],typeof:[Rt,[qt],function(t,e){return Xt(ie(e[0].evaluate(t)))}],"to-rgba":[Zt(Lt,4),[Ut],function(t,e){return e[0].evaluate(t).toArray()}],rgb:[Ut,[Lt,Lt,Lt],Fr],rgba:[Ut,[Lt,Lt,Lt,Lt],Fr],has:{type:Ot,overloads:[[[Rt],function(t,e){return Dr(e[0].evaluate(t),t.properties())}],[[Rt,jt],function(t,e){var r=e[1];return Dr(e[0].evaluate(t),r.evaluate(t))}]]},get:{type:qt,overloads:[[[Rt],function(t,e){return Lr(e[0].evaluate(t),t.properties())}],[[Rt,jt],function(t,e){var r=e[1];return Lr(e[0].evaluate(t),r.evaluate(t))}]]},"feature-state":[qt,[Rt],function(t,e){return Lr(e[0].evaluate(t),t.featureState||{})}],properties:[jt,[],function(t){return t.properties()}],"geometry-type":[Rt,[],function(t){return t.geometryType()}],id:[qt,[],function(t){return t.id()}],zoom:[Lt,[],function(t){return t.globals.zoom}],"heatmap-density":[Lt,[],function(t){return t.globals.heatmapDensity||0}],"line-progress":[Lt,[],function(t){return t.globals.lineProgress||0}],accumulated:[qt,[],function(t){return void 0===t.globals.accumulated?null:t.globals.accumulated}],"+":[Lt,Rr(Lt),function(t,e){for(var r=0,n=0,i=e;n<i.length;n+=1)r+=i[n].evaluate(t);return r}],"*":[Lt,Rr(Lt),function(t,e){for(var r=1,n=0,i=e;n<i.length;n+=1)r*=i[n].evaluate(t);return r}],"-":{type:Lt,overloads:[[[Lt,Lt],function(t,e){var r=e[1];return e[0].evaluate(t)-r.evaluate(t)}],[[Lt],function(t,e){return -e[0].evaluate(t)}]]},"/":[Lt,[Lt,Lt],function(t,e){var r=e[1];return e[0].evaluate(t)/r.evaluate(t)}],"%":[Lt,[Lt,Lt],function(t,e){var r=e[1];return e[0].evaluate(t)%r.evaluate(t)}],ln2:[Lt,[],function(){return Math.LN2}],pi:[Lt,[],function(){return Math.PI}],e:[Lt,[],function(){return Math.E}],"^":[Lt,[Lt,Lt],function(t,e){var r=e[1];return Math.pow(e[0].evaluate(t),r.evaluate(t))}],sqrt:[Lt,[Lt],function(t,e){return Math.sqrt(e[0].evaluate(t))}],log10:[Lt,[Lt],function(t,e){return Math.log(e[0].evaluate(t))/Math.LN10}],ln:[Lt,[Lt],function(t,e){return Math.log(e[0].evaluate(t))}],log2:[Lt,[Lt],function(t,e){return Math.log(e[0].evaluate(t))/Math.LN2}],sin:[Lt,[Lt],function(t,e){return Math.sin(e[0].evaluate(t))}],cos:[Lt,[Lt],function(t,e){return Math.cos(e[0].evaluate(t))}],tan:[Lt,[Lt],function(t,e){return Math.tan(e[0].evaluate(t))}],asin:[Lt,[Lt],function(t,e){return Math.asin(e[0].evaluate(t))}],acos:[Lt,[Lt],function(t,e){return Math.acos(e[0].evaluate(t))}],atan:[Lt,[Lt],function(t,e){return Math.atan(e[0].evaluate(t))}],min:[Lt,Rr(Lt),function(t,e){return Math.min.apply(Math,e.map((function(e){return e.evaluate(t)})))}],max:[Lt,Rr(Lt),function(t,e){return Math.max.apply(Math,e.map((function(e){return e.evaluate(t)})))}],abs:[Lt,[Lt],function(t,e){return Math.abs(e[0].evaluate(t))}],round:[Lt,[Lt],function(t,e){var r=e[0].evaluate(t);return r<0?-Math.round(-r):Math.round(r)}],floor:[Lt,[Lt],function(t,e){return Math.floor(e[0].evaluate(t))}],ceil:[Lt,[Lt],function(t,e){return Math.ceil(e[0].evaluate(t))}],"filter-==":[Ot,[Rt,qt],function(t,e){var r=e[0],n=e[1];return t.properties()[r.value]===n.value}],"filter-id-==":[Ot,[qt],function(t,e){var r=e[0];return t.id()===r.value}],"filter-type-==":[Ot,[Rt],function(t,e){var r=e[0];return t.geometryType()===r.value}],"filter-<":[Ot,[Rt,qt],function(t,e){var r=e[0],n=e[1],i=t.properties()[r.value],a=n.value;return typeof i==typeof a&&i<a}],"filter-id-<":[Ot,[qt],function(t,e){var r=e[0],n=t.id(),i=r.value;return typeof n==typeof i&&n<i}],"filter->":[Ot,[Rt,qt],function(t,e){var r=e[0],n=e[1],i=t.properties()[r.value],a=n.value;return typeof i==typeof a&&i>a}],"filter-id->":[Ot,[qt],function(t,e){var r=e[0],n=t.id(),i=r.value;return typeof n==typeof i&&n>i}],"filter-<=":[Ot,[Rt,qt],function(t,e){var r=e[0],n=e[1],i=t.properties()[r.value],a=n.value;return typeof i==typeof a&&i<=a}],"filter-id-<=":[Ot,[qt],function(t,e){var r=e[0],n=t.id(),i=r.value;return typeof n==typeof i&&n<=i}],"filter->=":[Ot,[Rt,qt],function(t,e){var r=e[0],n=e[1],i=t.properties()[r.value],a=n.value;return typeof i==typeof a&&i>=a}],"filter-id->=":[Ot,[qt],function(t,e){var r=e[0],n=t.id(),i=r.value;return typeof n==typeof i&&n>=i}],"filter-has":[Ot,[qt],function(t,e){return e[0].value in t.properties()}],"filter-has-id":[Ot,[],function(t){return null!==t.id()&&void 0!==t.id()}],"filter-type-in":[Ot,[Zt(Rt)],function(t,e){return e[0].value.indexOf(t.geometryType())>=0}],"filter-id-in":[Ot,[Zt(qt)],function(t,e){return e[0].value.indexOf(t.id())>=0}],"filter-in-small":[Ot,[Rt,Zt(qt)],function(t,e){var r=e[0];return e[1].value.indexOf(t.properties()[r.value])>=0}],"filter-in-large":[Ot,[Rt,Zt(qt)],function(t,e){var r=e[0],n=e[1];return function(t,e,r,n){for(;r<=n;){var i=r+n>>1;if(e[i]===t)return !0;e[i]>t?n=i-1:r=i+1;}return !1}(t.properties()[r.value],n.value,0,n.value.length-1)}],all:{type:Ot,overloads:[[[Ot,Ot],function(t,e){var r=e[1];return e[0].evaluate(t)&&r.evaluate(t)}],[Rr(Ot),function(t,e){for(var r=0,n=e;r<n.length;r+=1)if(!n[r].evaluate(t))return !1;return !0}]]},any:{type:Ot,overloads:[[[Ot,Ot],function(t,e){var r=e[1];return e[0].evaluate(t)||r.evaluate(t)}],[Rr(Ot),function(t,e){for(var r=0,n=e;r<n.length;r+=1)if(n[r].evaluate(t))return !0;return !1}]]},"!":[Ot,[Ot],function(t,e){return !e[0].evaluate(t)}],"is-supported-script":[Ot,[Rt],function(t,e){var r=t.globals&&t.globals.isSupportedScript;return !r||r(e[0].evaluate(t))}],upcase:[Rt,[Rt],function(t,e){return e[0].evaluate(t).toUpperCase()}],downcase:[Rt,[Rt],function(t,e){return e[0].evaluate(t).toLowerCase()}],concat:[Rt,Rr(qt),function(t,e){return e.map((function(e){return ae(e.evaluate(t))})).join("")}],"resolved-locale":[Rt,[Nt],function(t,e){return e[0].evaluate(t).resolvedLocale()}]});var Wr=function(t,e){this.expression=t,this._warningHistory={},this._evaluator=new de,this._defaultValue=e?function(t){return "color"===t.type&&Gr(t.default)?new $t(0,0,0,0):"color"===t.type?$t.parse(t.default)||null:void 0===t.default?null:t.default}(e):null,this._enumValues=e&&"enum"===e.type?e.values:null;};function Qr(t){return Array.isArray(t)&&t.length>0&&"string"==typeof t[0]&&t[0]in Vr}function tn(t,e){var r=new Ge(Vr,[],e?function(t){var e={color:Ut,string:Rt,number:Lt,enum:Rt,boolean:Ot,formatted:Kt,resolvedImage:Gt};return "array"===t.type?Zt(e[t.value]||qt,t.length):e[t.type]}(e):void 0),n=r.parse(t,void 0,void 0,void 0,e&&"string"===e.type?{typeAnnotation:"coerce"}:void 0);return n?Or(new Wr(n,e)):Ur(r.errors)}Wr.prototype.evaluateWithoutErrorHandling=function(t,e,r,n,i,a){return this._evaluator.globals=t,this._evaluator.feature=e,this._evaluator.featureState=r,this._evaluator.canonical=n,this._evaluator.availableImages=i||null,this._evaluator.formattedSection=a,this.expression.evaluate(this._evaluator)},Wr.prototype.evaluate=function(t,e,r,n,i,a){this._evaluator.globals=t,this._evaluator.feature=e||null,this._evaluator.featureState=r||null,this._evaluator.canonical=n,this._evaluator.availableImages=i||null,this._evaluator.formattedSection=a||null;try{var o=this.expression.evaluate(this._evaluator);if(null==o||"number"==typeof o&&o!=o)return this._defaultValue;if(this._enumValues&&!(o in this._enumValues))throw new se("Expected value to be one of "+Object.keys(this._enumValues).map((function(t){return JSON.stringify(t)})).join(", ")+", but found "+JSON.stringify(o)+" instead.");return o}catch(t){return this._warningHistory[t.message]||(this._warningHistory[t.message]=!0,"undefined"!=typeof console&&console.warn(t.message)),this._defaultValue}};var en=function(t,e){this.kind=t,this._styleExpression=e,this.isStateDependent="constant"!==t&&!qe(e.expression);};en.prototype.evaluateWithoutErrorHandling=function(t,e,r,n,i,a){return this._styleExpression.evaluateWithoutErrorHandling(t,e,r,n,i,a)},en.prototype.evaluate=function(t,e,r,n,i,a){return this._styleExpression.evaluate(t,e,r,n,i,a)};var rn=function(t,e,r,n){this.kind=t,this.zoomStops=r,this._styleExpression=e,this.isStateDependent="camera"!==t&&!qe(e.expression),this.interpolationType=n;};function nn(t,e){if("error"===(t=tn(t,e)).result)return t;var r=t.value.expression,n=je(r);if(!n&&!jr(e))return Ur([new Vt("","data expressions not supported")]);var i=Ne(r,["zoom"]);if(!i&&!qr(e))return Ur([new Vt("","zoom expressions not supported")]);var a=function t(e){var r=null;if(e instanceof gr)r=t(e.result);else if(e instanceof vr)for(var n=0,i=e.args;n<i.length&&!(r=t(i[n]));n+=1);else(e instanceof Xe||e instanceof dr)&&e.input instanceof me&&"zoom"===e.input.name&&(r=e);return r instanceof Vt?r:(e.eachChild((function(e){var n=t(e);n instanceof Vt?r=n:!r&&n?r=new Vt("",'"zoom" expression may only be used as input to a top-level "step" or "interpolate" expression.'):r&&n&&r!==n&&(r=new Vt("",'Only one zoom-based "step" or "interpolate" subexpression may be used in an expression.'));})),r)}(r);return a||i?a instanceof Vt?Ur([a]):a instanceof dr&&!Nr(e)?Ur([new Vt("",'"interpolate" expressions cannot be used with this property')]):Or(a?new rn(n?"camera":"composite",t.value,a.labels,a instanceof dr?a.interpolation:void 0):new en(n?"constant":"source",t.value)):Ur([new Vt("",'"zoom" expression may only be used as input to a top-level "step" or "interpolate" expression.')])}rn.prototype.evaluateWithoutErrorHandling=function(t,e,r,n,i,a){return this._styleExpression.evaluateWithoutErrorHandling(t,e,r,n,i,a)},rn.prototype.evaluate=function(t,e,r,n,i,a){return this._styleExpression.evaluate(t,e,r,n,i,a)},rn.prototype.interpolationFactor=function(t,e,r){return this.interpolationType?dr.interpolationFactor(this.interpolationType,t,e,r):0};var an=function(t,e){this._parameters=t,this._specification=e,Et(this,function t(e,r){var n,i,a,o="color"===r.type,s=e.stops&&"object"==typeof e.stops[0][0],u=s||!(s||void 0!==e.property),l=e.type||(Nr(r)?"exponential":"interval");if(o&&((e=Et({},e)).stops&&(e.stops=e.stops.map((function(t){return [t[0],$t.parse(t[1])]}))),e.default=$t.parse(e.default?e.default:r.default)),e.colorSpace&&"rgb"!==e.colorSpace&&!yr[e.colorSpace])throw new Error("Unknown color space: "+e.colorSpace);if("exponential"===l)n=Yr;else if("interval"===l)n=Hr;else if("categorical"===l){n=Jr,i=Object.create(null);for(var p=0,c=e.stops;p<c.length;p+=1){var h=c[p];i[h[0]]=h[1];}a=typeof e.stops[0][0];}else{if("identity"!==l)throw new Error('Unknown function type "'+l+'"');n=$r;}if(s){for(var f={},y=[],d=0;d<e.stops.length;d++){var m=e.stops[d],v=m[0].zoom;void 0===f[v]&&(f[v]={zoom:v,type:e.type,property:e.property,default:e.default,stops:[]},y.push(v)),f[v].stops.push([m[0].value,m[1]]);}for(var g=[],x=0,b=y;x<b.length;x+=1){var w=b[x];g.push([f[w].zoom,t(f[w],r)]);}var _={name:"linear"};return {kind:"composite",interpolationType:_,interpolationFactor:dr.interpolationFactor.bind(void 0,_),zoomStops:g.map((function(t){return t[0]})),evaluate:function(t,n){var i=t.zoom;return Yr({stops:g,base:e.base},r,i).evaluate(i,n)}}}if(u){var A="exponential"===l?{name:"exponential",base:void 0!==e.base?e.base:1}:null;return {kind:"camera",interpolationType:A,interpolationFactor:dr.interpolationFactor.bind(void 0,A),zoomStops:e.stops.map((function(t){return t[0]})),evaluate:function(t){return n(e,r,t.zoom,i,a)}}}return {kind:"source",evaluate:function(t,o){var s=o&&o.properties?o.properties[e.property]:void 0;return void 0===s?Xr(e.default,r.default):n(e,r,s,i,a)}}}(this._parameters,this._specification));};function on(t){var e=t.key,r=t.value,n=t.valueSpec||{},i=t.objectElementValidators||{},a=t.style,o=t.styleSpec,s=[],u=Kr(r);if("object"!==u)return [new Mt(e,r,"object expected, "+u+" found")];for(var l in r){var p=l.split(".")[0],c=n[p]||n["*"],h=void 0;if(i[p])h=i[p];else if(n[p])h=En;else if(i["*"])h=i["*"];else{if(!n["*"]){s.push(new Mt(e,r[l],'unknown property "'+l+'"'));continue}h=En;}s=s.concat(h({key:(e?e+".":e)+l,value:r[l],valueSpec:c,style:a,styleSpec:o,object:r,objectKey:l},r));}for(var f in n)i[f]||n[f].required&&void 0===n[f].default&&void 0===r[f]&&s.push(new Mt(e,r,'missing required property "'+f+'"'));return s}function sn(t){var e=t.value,r=t.valueSpec,n=t.style,i=t.styleSpec,a=t.key,o=t.arrayElementValidator||En;if("array"!==Kr(e))return [new Mt(a,e,"array expected, "+Kr(e)+" found")];if(r.length&&e.length!==r.length)return [new Mt(a,e,"array length "+r.length+" expected, length "+e.length+" found")];if(r["min-length"]&&e.length<r["min-length"])return [new Mt(a,e,"array length at least "+r["min-length"]+" expected, length "+e.length+" found")];var s={type:r.value,values:r.values};i.$version<7&&(s.function=r.function),"object"===Kr(r.value)&&(s=r.value);for(var u=[],l=0;l<e.length;l++)u=u.concat(o({array:e,arrayIndex:l,value:e[l],valueSpec:s,style:n,styleSpec:i,key:a+"["+l+"]"}));return u}function un(t){var e=t.key,r=t.value,n=t.valueSpec,i=Kr(r);return "number"===i&&r!=r&&(i="NaN"),"number"!==i?[new Mt(e,r,"number expected, "+i+" found")]:"minimum"in n&&r<n.minimum?[new Mt(e,r,r+" is less than the minimum value "+n.minimum)]:"maximum"in n&&r>n.maximum?[new Mt(e,r,r+" is greater than the maximum value "+n.maximum)]:[]}function ln(t){var e,r,n,i=t.valueSpec,a=Pt(t.value.type),o={},s="categorical"!==a&&void 0===t.value.property,u=!s,l="array"===Kr(t.value.stops)&&"array"===Kr(t.value.stops[0])&&"object"===Kr(t.value.stops[0][0]),p=on({key:t.key,value:t.value,valueSpec:t.styleSpec.function,style:t.style,styleSpec:t.styleSpec,objectElementValidators:{stops:function(t){if("identity"===a)return [new Mt(t.key,t.value,'identity function may not have a "stops" property')];var e=[],r=t.value;return e=e.concat(sn({key:t.key,value:r,valueSpec:t.valueSpec,style:t.style,styleSpec:t.styleSpec,arrayElementValidator:c})),"array"===Kr(r)&&0===r.length&&e.push(new Mt(t.key,r,"array must have at least one stop")),e},default:function(t){return En({key:t.key,value:t.value,valueSpec:i,style:t.style,styleSpec:t.styleSpec})}}});return "identity"===a&&s&&p.push(new Mt(t.key,t.value,'missing required property "property"')),"identity"===a||t.value.stops||p.push(new Mt(t.key,t.value,'missing required property "stops"')),"exponential"===a&&t.valueSpec.expression&&!Nr(t.valueSpec)&&p.push(new Mt(t.key,t.value,"exponential functions not supported")),t.styleSpec.$version>=8&&(u&&!jr(t.valueSpec)?p.push(new Mt(t.key,t.value,"property functions not supported")):s&&!qr(t.valueSpec)&&p.push(new Mt(t.key,t.value,"zoom functions not supported"))),"categorical"!==a&&!l||void 0!==t.value.property||p.push(new Mt(t.key,t.value,'"property" property is required')),p;function c(t){var e=[],a=t.value,s=t.key;if("array"!==Kr(a))return [new Mt(s,a,"array expected, "+Kr(a)+" found")];if(2!==a.length)return [new Mt(s,a,"array length 2 expected, length "+a.length+" found")];if(l){if("object"!==Kr(a[0]))return [new Mt(s,a,"object expected, "+Kr(a[0])+" found")];if(void 0===a[0].zoom)return [new Mt(s,a,"object stop key must have zoom")];if(void 0===a[0].value)return [new Mt(s,a,"object stop key must have value")];if(n&&n>Pt(a[0].zoom))return [new Mt(s,a[0].zoom,"stop zoom values must appear in ascending order")];Pt(a[0].zoom)!==n&&(n=Pt(a[0].zoom),r=void 0,o={}),e=e.concat(on({key:s+"[0]",value:a[0],valueSpec:{zoom:{}},style:t.style,styleSpec:t.styleSpec,objectElementValidators:{zoom:un,value:h}}));}else e=e.concat(h({key:s+"[0]",value:a[0],valueSpec:{},style:t.style,styleSpec:t.styleSpec},a));return Qr(Bt(a[1]))?e.concat([new Mt(s+"[1]",a[1],"expressions are not allowed in function stops.")]):e.concat(En({key:s+"[1]",value:a[1],valueSpec:i,style:t.style,styleSpec:t.styleSpec}))}function h(t,n){var s=Kr(t.value),u=Pt(t.value),l=null!==t.value?t.value:n;if(e){if(s!==e)return [new Mt(t.key,l,s+" stop domain type must match previous stop domain type "+e)]}else e=s;if("number"!==s&&"string"!==s&&"boolean"!==s)return [new Mt(t.key,l,"stop domain value must be a number, string, or boolean")];if("number"!==s&&"categorical"!==a){var p="number expected, "+s+" found";return jr(i)&&void 0===a&&(p+='\nIf you intended to use a categorical function, specify `"type": "categorical"`.'),[new Mt(t.key,l,p)]}return "categorical"!==a||"number"!==s||isFinite(u)&&Math.floor(u)===u?"categorical"!==a&&"number"===s&&void 0!==r&&u<r?[new Mt(t.key,l,"stop domain values must appear in ascending order")]:(r=u,"categorical"===a&&u in o?[new Mt(t.key,l,"stop domain values must be unique")]:(o[u]=!0,[])):[new Mt(t.key,l,"integer expected, found "+u)]}}function pn(t){var e=("property"===t.expressionContext?nn:tn)(Bt(t.value),t.valueSpec);if("error"===e.result)return e.value.map((function(e){return new Mt(""+t.key+e.key,t.value,e.message)}));var r=e.value.expression||e.value._styleExpression.expression;if("property"===t.expressionContext&&"text-font"===t.propertyKey&&!r.outputDefined())return [new Mt(t.key,t.value,'Invalid data expression for "'+t.propertyKey+'". Output values must be contained as literals within the expression.')];if("property"===t.expressionContext&&"layout"===t.propertyType&&!qe(r))return [new Mt(t.key,t.value,'"feature-state" data expressions are not supported with layout properties.')];if("filter"===t.expressionContext&&!qe(r))return [new Mt(t.key,t.value,'"feature-state" data expressions are not supported with filters.')];if(t.expressionContext&&0===t.expressionContext.indexOf("cluster")){if(!Ne(r,["zoom","feature-state"]))return [new Mt(t.key,t.value,'"zoom" and "feature-state" expressions are not supported with cluster properties.')];if("cluster-initial"===t.expressionContext&&!je(r))return [new Mt(t.key,t.value,"Feature data expressions are not supported with initial expression part of cluster properties.")]}return []}function cn(t){var e=t.key,r=t.value,n=t.valueSpec,i=[];return Array.isArray(n.values)?-1===n.values.indexOf(Pt(r))&&i.push(new Mt(e,r,"expected one of ["+n.values.join(", ")+"], "+JSON.stringify(r)+" found")):-1===Object.keys(n.values).indexOf(Pt(r))&&i.push(new Mt(e,r,"expected one of ["+Object.keys(n.values).join(", ")+"], "+JSON.stringify(r)+" found")),i}function hn(t){if(!0===t||!1===t)return !0;if(!Array.isArray(t)||0===t.length)return !1;switch(t[0]){case"has":return t.length>=2&&"$id"!==t[1]&&"$type"!==t[1];case"in":return t.length>=3&&("string"!=typeof t[1]||Array.isArray(t[2]));case"!in":case"!has":case"none":return !1;case"==":case"!=":case">":case">=":case"<":case"<=":return 3!==t.length||Array.isArray(t[1])||Array.isArray(t[2]);case"any":case"all":for(var e=0,r=t.slice(1);e<r.length;e+=1){var n=r[e];if(!hn(n)&&"boolean"!=typeof n)return !1}return !0;default:return !0}}an.deserialize=function(t){return new an(t._parameters,t._specification)},an.serialize=function(t){return {_parameters:t._parameters,_specification:t._specification}};var fn={type:"boolean",default:!1,transition:!1,"property-type":"data-driven",expression:{interpolated:!1,parameters:["zoom","feature"]}};function yn(t){if(null==t)return {filter:function(){return !0},needGeometry:!1};hn(t)||(t=mn(t));var e=tn(t,fn);if("error"===e.result)throw new Error(e.value.map((function(t){return t.key+": "+t.message})).join(", "));return {filter:function(t,r,n){return e.value.evaluate(t,r,{},n)},needGeometry:Array.isArray(t)&&0!==t.length&&"within"===t[0]}}function dn(t,e){return t<e?-1:t>e?1:0}function mn(t){if(!t)return !0;var e,r=t[0];return t.length<=1?"any"!==r:"=="===r?vn(t[1],t[2],"=="):"!="===r?bn(vn(t[1],t[2],"==")):"<"===r||">"===r||"<="===r||">="===r?vn(t[1],t[2],r):"any"===r?(e=t.slice(1),["any"].concat(e.map(mn))):"all"===r?["all"].concat(t.slice(1).map(mn)):"none"===r?["all"].concat(t.slice(1).map(mn).map(bn)):"in"===r?gn(t[1],t.slice(2)):"!in"===r?bn(gn(t[1],t.slice(2))):"has"===r?xn(t[1]):"!has"!==r||bn(xn(t[1]))}function vn(t,e,r){switch(t){case"$type":return ["filter-type-"+r,e];case"$id":return ["filter-id-"+r,e];default:return ["filter-"+r,t,e]}}function gn(t,e){if(0===e.length)return !1;switch(t){case"$type":return ["filter-type-in",["literal",e]];case"$id":return ["filter-id-in",["literal",e]];default:return e.length>200&&!e.some((function(t){return typeof t!=typeof e[0]}))?["filter-in-large",t,["literal",e.sort(dn)]]:["filter-in-small",t,["literal",e]]}}function xn(t){switch(t){case"$type":return !0;case"$id":return ["filter-has-id"];default:return ["filter-has",t]}}function bn(t){return ["!",t]}function wn(t){return hn(Bt(t.value))?pn(Et({},t,{expressionContext:"filter",valueSpec:{value:"boolean"}})):function t(e){var r=e.value,n=e.key;if("array"!==Kr(r))return [new Mt(n,r,"array expected, "+Kr(r)+" found")];var i,a=e.styleSpec,o=[];if(r.length<1)return [new Mt(n,r,"filter array must have at least 1 element")];switch(o=o.concat(cn({key:n+"[0]",value:r[0],valueSpec:a.filter_operator,style:e.style,styleSpec:e.styleSpec})),Pt(r[0])){case"<":case"<=":case">":case">=":r.length>=2&&"$type"===Pt(r[1])&&o.push(new Mt(n,r,'"$type" cannot be use with operator "'+r[0]+'"'));case"==":case"!=":3!==r.length&&o.push(new Mt(n,r,'filter array for operator "'+r[0]+'" must have 3 elements'));case"in":case"!in":r.length>=2&&"string"!==(i=Kr(r[1]))&&o.push(new Mt(n+"[1]",r[1],"string expected, "+i+" found"));for(var s=2;s<r.length;s++)i=Kr(r[s]),"$type"===Pt(r[1])?o=o.concat(cn({key:n+"["+s+"]",value:r[s],valueSpec:a.geometry_type,style:e.style,styleSpec:e.styleSpec})):"string"!==i&&"number"!==i&&"boolean"!==i&&o.push(new Mt(n+"["+s+"]",r[s],"string, number, or boolean expected, "+i+" found"));break;case"any":case"all":case"none":for(var u=1;u<r.length;u++)o=o.concat(t({key:n+"["+u+"]",value:r[u],style:e.style,styleSpec:e.styleSpec}));break;case"has":case"!has":i=Kr(r[1]),2!==r.length?o.push(new Mt(n,r,'filter array for "'+r[0]+'" operator must have 2 elements')):"string"!==i&&o.push(new Mt(n+"[1]",r[1],"string expected, "+i+" found"));}return o}(t)}function _n(t,e){var r=t.key,n=t.style,i=t.styleSpec,a=t.value,o=t.objectKey,s=i[e+"_"+t.layerType];if(!s)return [];var u=o.match(/^(.*)-transition$/);if("paint"===e&&u&&s[u[1]]&&s[u[1]].transition)return En({key:r,value:a,valueSpec:i.transition,style:n,styleSpec:i});var l,p=t.valueSpec||s[o];if(!p)return [new Mt(r,a,'unknown property "'+o+'"')];if("string"===Kr(a)&&jr(p)&&!p.tokens&&(l=/^{([^}]+)}$/.exec(a)))return [new Mt(r,a,'"'+o+'" does not support interpolation syntax\nUse an identity property function instead: `{ "type": "identity", "property": '+JSON.stringify(l[1])+" }`.")];var c=[];return "symbol"===t.layerType&&("text-field"===o&&n&&!n.glyphs&&c.push(new Mt(r,a,'use of "text-field" requires a style "glyphs" property')),"text-font"===o&&Gr(Bt(a))&&"identity"===Pt(a.type)&&c.push(new Mt(r,a,'"text-font" does not support identity functions'))),c.concat(En({key:t.key,value:a,valueSpec:p,style:n,styleSpec:i,expressionContext:"property",propertyType:e,propertyKey:o}))}function An(t){return _n(t,"paint")}function Sn(t){return _n(t,"layout")}function kn(t){var e=[],r=t.value,n=t.key,i=t.style,a=t.styleSpec;r.type||r.ref||e.push(new Mt(n,r,'either "type" or "ref" is required'));var o,s=Pt(r.type),u=Pt(r.ref);if(r.id)for(var l=Pt(r.id),p=0;p<t.arrayIndex;p++){var c=i.layers[p];Pt(c.id)===l&&e.push(new Mt(n,r.id,'duplicate layer id "'+r.id+'", previously used at line '+c.id.__line__));}if("ref"in r)["type","source","source-layer","filter","layout"].forEach((function(t){t in r&&e.push(new Mt(n,r[t],'"'+t+'" is prohibited for ref layers'));})),i.layers.forEach((function(t){Pt(t.id)===u&&(o=t);})),o?o.ref?e.push(new Mt(n,r.ref,"ref cannot reference another ref layer")):s=Pt(o.type):e.push(new Mt(n,r.ref,'ref layer "'+u+'" not found'));else if("background"!==s)if(r.source){var h=i.sources&&i.sources[r.source],f=h&&Pt(h.type);h?"vector"===f&&"raster"===s?e.push(new Mt(n,r.source,'layer "'+r.id+'" requires a raster source')):"raster"===f&&"raster"!==s?e.push(new Mt(n,r.source,'layer "'+r.id+'" requires a vector source')):"vector"!==f||r["source-layer"]?"raster-dem"===f&&"hillshade"!==s?e.push(new Mt(n,r.source,"raster-dem source can only be used with layer type 'hillshade'.")):"line"!==s||!r.paint||!r.paint["line-gradient"]||"geojson"===f&&h.lineMetrics||e.push(new Mt(n,r,'layer "'+r.id+'" specifies a line-gradient, which requires a GeoJSON source with `lineMetrics` enabled.')):e.push(new Mt(n,r,'layer "'+r.id+'" must specify a "source-layer"')):e.push(new Mt(n,r.source,'source "'+r.source+'" not found'));}else e.push(new Mt(n,r,'missing required property "source"'));return e=e.concat(on({key:n,value:r,valueSpec:a.layer,style:t.style,styleSpec:t.styleSpec,objectElementValidators:{"*":function(){return []},type:function(){return En({key:n+".type",value:r.type,valueSpec:a.layer.type,style:t.style,styleSpec:t.styleSpec,object:r,objectKey:"type"})},filter:wn,layout:function(t){return on({layer:r,key:t.key,value:t.value,style:t.style,styleSpec:t.styleSpec,objectElementValidators:{"*":function(t){return Sn(Et({layerType:s},t))}}})},paint:function(t){return on({layer:r,key:t.key,value:t.value,style:t.style,styleSpec:t.styleSpec,objectElementValidators:{"*":function(t){return An(Et({layerType:s},t))}}})}}}))}function In(t){var e=t.value,r=t.key,n=Kr(e);return "string"!==n?[new Mt(r,e,"string expected, "+n+" found")]:[]}var zn={promoteId:function(t){var e=t.key,r=t.value;if("string"===Kr(r))return In({key:e,value:r});var n=[];for(var i in r)n.push.apply(n,In({key:e+"."+i,value:r[i]}));return n}};function Cn(t){var e=t.value,r=t.key,n=t.styleSpec,i=t.style;if(!e.type)return [new Mt(r,e,'"type" is required')];var a,o=Pt(e.type);switch(o){case"vector":case"raster":case"raster-dem":return on({key:r,value:e,valueSpec:n["source_"+o.replace("-","_")],style:t.style,styleSpec:n,objectElementValidators:zn});case"geojson":if(a=on({key:r,value:e,valueSpec:n.source_geojson,style:i,styleSpec:n,objectElementValidators:zn}),e.cluster)for(var s in e.clusterProperties){var u=e.clusterProperties[s],l=u[0],p="string"==typeof l?[l,["accumulated"],["get",s]]:l;a.push.apply(a,pn({key:r+"."+s+".map",value:u[1],expressionContext:"cluster-map"})),a.push.apply(a,pn({key:r+"."+s+".reduce",value:p,expressionContext:"cluster-reduce"}));}return a;case"video":return on({key:r,value:e,valueSpec:n.source_video,style:i,styleSpec:n});case"image":return on({key:r,value:e,valueSpec:n.source_image,style:i,styleSpec:n});case"canvas":return [new Mt(r,null,"Please use runtime APIs to add canvas sources, rather than including them in stylesheets.","source.canvas")];default:return cn({key:r+".type",value:e.type,valueSpec:{values:["vector","raster","raster-dem","geojson","video","image"]},style:i,styleSpec:n})}}function Mn(t){var e=t.value,r=t.styleSpec,n=r.light,i=t.style,a=[],o=Kr(e);if(void 0===e)return a;if("object"!==o)return a.concat([new Mt("light",e,"object expected, "+o+" found")]);for(var s in e){var u=s.match(/^(.*)-transition$/);a=a.concat(u&&n[u[1]]&&n[u[1]].transition?En({key:s,value:e[s],valueSpec:r.transition,style:i,styleSpec:r}):n[s]?En({key:s,value:e[s],valueSpec:n[s],style:i,styleSpec:r}):[new Mt(s,e[s],'unknown property "'+s+'"')]);}return a}var Tn={"*":function(){return []},array:sn,boolean:function(t){var e=t.value,r=t.key,n=Kr(e);return "boolean"!==n?[new Mt(r,e,"boolean expected, "+n+" found")]:[]},number:un,color:function(t){var e=t.key,r=t.value,n=Kr(r);return "string"!==n?[new Mt(e,r,"color expected, "+n+" found")]:null===Yt(r)?[new Mt(e,r,'color expected, "'+r+'" found')]:[]},constants:Tt,enum:cn,filter:wn,function:ln,layer:kn,object:on,source:Cn,light:Mn,string:In,formatted:function(t){return 0===In(t).length?[]:pn(t)},resolvedImage:function(t){return 0===In(t).length?[]:pn(t)}};function En(t){var e=t.value,r=t.valueSpec,n=t.styleSpec;return r.expression&&Gr(Pt(e))?ln(t):r.expression&&Qr(Bt(e))?pn(t):r.type&&Tn[r.type]?Tn[r.type](t):on(Et({},t,{valueSpec:r.type?n[r.type]:r}))}function Pn(t){var e=t.value,r=t.key,n=In(t);return n.length?n:(-1===e.indexOf("{fontstack}")&&n.push(new Mt(r,e,'"glyphs" url must include a "{fontstack}" token')),-1===e.indexOf("{range}")&&n.push(new Mt(r,e,'"glyphs" url must include a "{range}" token')),n)}function Bn(t,e){void 0===e&&(e=Ct);var r=[];return r=r.concat(En({key:"",value:t,valueSpec:e.$root,styleSpec:e,style:t,objectElementValidators:{glyphs:Pn,"*":function(){return []}}})),t.constants&&(r=r.concat(Tt({key:"constants",value:t.constants,style:t,styleSpec:e}))),Vn(r)}function Vn(t){return [].concat(t).sort((function(t,e){return t.line-e.line}))}function Fn(t){return function(){for(var e=[],r=arguments.length;r--;)e[r]=arguments[r];return Vn(t.apply(this,e))}}Bn.source=Fn(Cn),Bn.light=Fn(Mn),Bn.layer=Fn(kn),Bn.filter=Fn(wn),Bn.paintProperty=Fn(An),Bn.layoutProperty=Fn(Sn);var Dn=Bn,Ln=Dn.light,Rn=Dn.paintProperty,On=Dn.layoutProperty;function Un(t,e){var r=!1;if(e&&e.length)for(var n=0,i=e;n<i.length;n+=1)t.fire(new It(new Error(i[n].message))),r=!0;return r}var jn=Nn,qn=3;function Nn(t,e,r){var n=this.cells=[];if(t instanceof ArrayBuffer){this.arrayBuffer=t;var i=new Int32Array(this.arrayBuffer);t=i[0],this.d=(e=i[1])+2*(r=i[2]);for(var a=0;a<this.d*this.d;a++){var o=i[qn+a],s=i[qn+a+1];n.push(o===s?null:i.subarray(o,s));}var u=i[qn+n.length+1];this.keys=i.subarray(i[qn+n.length],u),this.bboxes=i.subarray(u),this.insert=this._insertReadonly;}else{this.d=e+2*r;for(var l=0;l<this.d*this.d;l++)n.push([]);this.keys=[],this.bboxes=[];}this.n=e,this.extent=t,this.padding=r,this.scale=e/t,this.uid=0;var p=r/e*t;this.min=-p,this.max=t+p;}Nn.prototype.insert=function(t,e,r,n,i){this._forEachCell(e,r,n,i,this._insertCell,this.uid++),this.keys.push(t),this.bboxes.push(e),this.bboxes.push(r),this.bboxes.push(n),this.bboxes.push(i);},Nn.prototype._insertReadonly=function(){throw "Cannot insert into a GridIndex created from an ArrayBuffer."},Nn.prototype._insertCell=function(t,e,r,n,i,a){this.cells[i].push(a);},Nn.prototype.query=function(t,e,r,n,i){var a=this.min,o=this.max;if(t<=a&&e<=a&&o<=r&&o<=n&&!i)return Array.prototype.slice.call(this.keys);var s=[];return this._forEachCell(t,e,r,n,this._queryCell,s,{},i),s},Nn.prototype._queryCell=function(t,e,r,n,i,a,o,s){var u=this.cells[i];if(null!==u)for(var l=this.keys,p=this.bboxes,c=0;c<u.length;c++){var h=u[c];if(void 0===o[h]){var f=4*h;(s?s(p[f+0],p[f+1],p[f+2],p[f+3]):t<=p[f+2]&&e<=p[f+3]&&r>=p[f+0]&&n>=p[f+1])?(o[h]=!0,a.push(l[h])):o[h]=!1;}}},Nn.prototype._forEachCell=function(t,e,r,n,i,a,o,s){for(var u=this._convertToCellCoord(t),l=this._convertToCellCoord(e),p=this._convertToCellCoord(r),c=this._convertToCellCoord(n),h=u;h<=p;h++)for(var f=l;f<=c;f++){var y=this.d*f+h;if((!s||s(this._convertFromCellCoord(h),this._convertFromCellCoord(f),this._convertFromCellCoord(h+1),this._convertFromCellCoord(f+1)))&&i.call(this,t,e,r,n,y,a,o,s))return}},Nn.prototype._convertFromCellCoord=function(t){return (t-this.padding)/this.scale},Nn.prototype._convertToCellCoord=function(t){return Math.max(0,Math.min(this.d-1,Math.floor(t*this.scale)+this.padding))},Nn.prototype.toArrayBuffer=function(){if(this.arrayBuffer)return this.arrayBuffer;for(var t=this.cells,e=qn+this.cells.length+1+1,r=0,n=0;n<this.cells.length;n++)r+=this.cells[n].length;var i=new Int32Array(e+r+this.keys.length+this.bboxes.length);i[0]=this.extent,i[1]=this.n,i[2]=this.padding;for(var a=e,o=0;o<t.length;o++){var s=t[o];i[qn+o]=a,i.set(s,a),a+=s.length;}return i[qn+t.length]=a,i.set(this.keys,a),i[qn+t.length+1]=a+=this.keys.length,i.set(this.bboxes,a),a+=this.bboxes.length,i.buffer};var Kn=self.ImageData,Gn=self.ImageBitmap,Zn={};function Xn(t,e,r){void 0===r&&(r={}),Object.defineProperty(e,"_classRegistryKey",{value:t,writeable:!1}),Zn[t]={klass:e,omit:r.omit||[],shallow:r.shallow||[]};}for(var Jn in Xn("Object",Object),jn.serialize=function(t,e){var r=t.toArrayBuffer();return e&&e.push(r),{buffer:r}},jn.deserialize=function(t){return new jn(t.buffer)},Xn("Grid",jn),Xn("Color",$t),Xn("Error",Error),Xn("ResolvedImage",ee),Xn("StylePropertyFunction",an),Xn("StyleExpression",Wr,{omit:["_evaluator"]}),Xn("ZoomDependentExpression",rn),Xn("ZoomConstantExpression",en),Xn("CompoundExpression",me,{omit:["_evaluate"]}),Vr)Vr[Jn]._classRegistryKey||Xn("Expression_"+Jn,Vr[Jn]);function Hn(t){return t&&"undefined"!=typeof ArrayBuffer&&(t instanceof ArrayBuffer||t.constructor&&"ArrayBuffer"===t.constructor.name)}function Yn(t){return Gn&&t instanceof Gn}function $n(t,e){if(null==t||"boolean"==typeof t||"number"==typeof t||"string"==typeof t||t instanceof Boolean||t instanceof Number||t instanceof String||t instanceof Date||t instanceof RegExp)return t;if(Hn(t)||Yn(t))return e&&e.push(t),t;if(ArrayBuffer.isView(t)){var r=t;return e&&e.push(r.buffer),r}if(t instanceof Kn)return e&&e.push(t.data.buffer),t;if(Array.isArray(t)){for(var n=[],i=0,a=t;i<a.length;i+=1)n.push($n(a[i],e));return n}if("object"==typeof t){var o=t.constructor,s=o._classRegistryKey;if(!s)throw new Error("can't serialize object of unregistered class");var u=o.serialize?o.serialize(t,e):{};if(!o.serialize){for(var l in t)if(t.hasOwnProperty(l)&&!(Zn[s].omit.indexOf(l)>=0)){var p=t[l];u[l]=Zn[s].shallow.indexOf(l)>=0?p:$n(p,e);}t instanceof Error&&(u.message=t.message);}if(u.$name)throw new Error("$name property is reserved for worker serialization logic.");return "Object"!==s&&(u.$name=s),u}throw new Error("can't serialize object of type "+typeof t)}function Wn(t){if(null==t||"boolean"==typeof t||"number"==typeof t||"string"==typeof t||t instanceof Boolean||t instanceof Number||t instanceof String||t instanceof Date||t instanceof RegExp||Hn(t)||Yn(t)||ArrayBuffer.isView(t)||t instanceof Kn)return t;if(Array.isArray(t))return t.map(Wn);if("object"==typeof t){var e=t.$name||"Object",r=Zn[e].klass;if(!r)throw new Error("can't deserialize unregistered class "+e);if(r.deserialize)return r.deserialize(t);for(var n=Object.create(r.prototype),i=0,a=Object.keys(t);i<a.length;i+=1){var o=a[i];if("$name"!==o){var s=t[o];n[o]=Zn[e].shallow.indexOf(o)>=0?s:Wn(s);}}return n}throw new Error("can't deserialize object of type "+typeof t)}var Qn=function(){this.first=!0;};Qn.prototype.update=function(t,e){var r=Math.floor(t);return this.first?(this.first=!1,this.lastIntegerZoom=r,this.lastIntegerZoomTime=0,this.lastZoom=t,this.lastFloorZoom=r,!0):(this.lastFloorZoom>r?(this.lastIntegerZoom=r+1,this.lastIntegerZoomTime=e):this.lastFloorZoom<r&&(this.lastIntegerZoom=r,this.lastIntegerZoomTime=e),t!==this.lastZoom&&(this.lastZoom=t,this.lastFloorZoom=r,!0))};var ti={"Latin-1 Supplement":function(t){return t>=128&&t<=255},Arabic:function(t){return t>=1536&&t<=1791},"Arabic Supplement":function(t){return t>=1872&&t<=1919},"Arabic Extended-A":function(t){return t>=2208&&t<=2303},"Hangul Jamo":function(t){return t>=4352&&t<=4607},"Unified Canadian Aboriginal Syllabics":function(t){return t>=5120&&t<=5759},Khmer:function(t){return t>=6016&&t<=6143},"Unified Canadian Aboriginal Syllabics Extended":function(t){return t>=6320&&t<=6399},"General Punctuation":function(t){return t>=8192&&t<=8303},"Letterlike Symbols":function(t){return t>=8448&&t<=8527},"Number Forms":function(t){return t>=8528&&t<=8591},"Miscellaneous Technical":function(t){return t>=8960&&t<=9215},"Control Pictures":function(t){return t>=9216&&t<=9279},"Optical Character Recognition":function(t){return t>=9280&&t<=9311},"Enclosed Alphanumerics":function(t){return t>=9312&&t<=9471},"Geometric Shapes":function(t){return t>=9632&&t<=9727},"Miscellaneous Symbols":function(t){return t>=9728&&t<=9983},"Miscellaneous Symbols and Arrows":function(t){return t>=11008&&t<=11263},"CJK Radicals Supplement":function(t){return t>=11904&&t<=12031},"Kangxi Radicals":function(t){return t>=12032&&t<=12255},"Ideographic Description Characters":function(t){return t>=12272&&t<=12287},"CJK Symbols and Punctuation":function(t){return t>=12288&&t<=12351},Hiragana:function(t){return t>=12352&&t<=12447},Katakana:function(t){return t>=12448&&t<=12543},Bopomofo:function(t){return t>=12544&&t<=12591},"Hangul Compatibility Jamo":function(t){return t>=12592&&t<=12687},Kanbun:function(t){return t>=12688&&t<=12703},"Bopomofo Extended":function(t){return t>=12704&&t<=12735},"CJK Strokes":function(t){return t>=12736&&t<=12783},"Katakana Phonetic Extensions":function(t){return t>=12784&&t<=12799},"Enclosed CJK Letters and Months":function(t){return t>=12800&&t<=13055},"CJK Compatibility":function(t){return t>=13056&&t<=13311},"CJK Unified Ideographs Extension A":function(t){return t>=13312&&t<=19903},"Yijing Hexagram Symbols":function(t){return t>=19904&&t<=19967},"CJK Unified Ideographs":function(t){return t>=19968&&t<=40959},"Yi Syllables":function(t){return t>=40960&&t<=42127},"Yi Radicals":function(t){return t>=42128&&t<=42191},"Hangul Jamo Extended-A":function(t){return t>=43360&&t<=43391},"Hangul Syllables":function(t){return t>=44032&&t<=55215},"Hangul Jamo Extended-B":function(t){return t>=55216&&t<=55295},"Private Use Area":function(t){return t>=57344&&t<=63743},"CJK Compatibility Ideographs":function(t){return t>=63744&&t<=64255},"Arabic Presentation Forms-A":function(t){return t>=64336&&t<=65023},"Vertical Forms":function(t){return t>=65040&&t<=65055},"CJK Compatibility Forms":function(t){return t>=65072&&t<=65103},"Small Form Variants":function(t){return t>=65104&&t<=65135},"Arabic Presentation Forms-B":function(t){return t>=65136&&t<=65279},"Halfwidth and Fullwidth Forms":function(t){return t>=65280&&t<=65519}};function ei(t){for(var e=0,r=t;e<r.length;e+=1)if(ri(r[e].charCodeAt(0)))return !0;return !1}function ri(t){return !(746!==t&&747!==t&&(t<4352||!(ti["Bopomofo Extended"](t)||ti.Bopomofo(t)||ti["CJK Compatibility Forms"](t)&&!(t>=65097&&t<=65103)||ti["CJK Compatibility Ideographs"](t)||ti["CJK Compatibility"](t)||ti["CJK Radicals Supplement"](t)||ti["CJK Strokes"](t)||!(!ti["CJK Symbols and Punctuation"](t)||t>=12296&&t<=12305||t>=12308&&t<=12319||12336===t)||ti["CJK Unified Ideographs Extension A"](t)||ti["CJK Unified Ideographs"](t)||ti["Enclosed CJK Letters and Months"](t)||ti["Hangul Compatibility Jamo"](t)||ti["Hangul Jamo Extended-A"](t)||ti["Hangul Jamo Extended-B"](t)||ti["Hangul Jamo"](t)||ti["Hangul Syllables"](t)||ti.Hiragana(t)||ti["Ideographic Description Characters"](t)||ti.Kanbun(t)||ti["Kangxi Radicals"](t)||ti["Katakana Phonetic Extensions"](t)||ti.Katakana(t)&&12540!==t||!(!ti["Halfwidth and Fullwidth Forms"](t)||65288===t||65289===t||65293===t||t>=65306&&t<=65310||65339===t||65341===t||65343===t||t>=65371&&t<=65503||65507===t||t>=65512&&t<=65519)||!(!ti["Small Form Variants"](t)||t>=65112&&t<=65118||t>=65123&&t<=65126)||ti["Unified Canadian Aboriginal Syllabics"](t)||ti["Unified Canadian Aboriginal Syllabics Extended"](t)||ti["Vertical Forms"](t)||ti["Yijing Hexagram Symbols"](t)||ti["Yi Syllables"](t)||ti["Yi Radicals"](t))))}function ni(t){return !(ri(t)||function(t){return !!(ti["Latin-1 Supplement"](t)&&(167===t||169===t||174===t||177===t||188===t||189===t||190===t||215===t||247===t)||ti["General Punctuation"](t)&&(8214===t||8224===t||8225===t||8240===t||8241===t||8251===t||8252===t||8258===t||8263===t||8264===t||8265===t||8273===t)||ti["Letterlike Symbols"](t)||ti["Number Forms"](t)||ti["Miscellaneous Technical"](t)&&(t>=8960&&t<=8967||t>=8972&&t<=8991||t>=8996&&t<=9e3||9003===t||t>=9085&&t<=9114||t>=9150&&t<=9165||9167===t||t>=9169&&t<=9179||t>=9186&&t<=9215)||ti["Control Pictures"](t)&&9251!==t||ti["Optical Character Recognition"](t)||ti["Enclosed Alphanumerics"](t)||ti["Geometric Shapes"](t)||ti["Miscellaneous Symbols"](t)&&!(t>=9754&&t<=9759)||ti["Miscellaneous Symbols and Arrows"](t)&&(t>=11026&&t<=11055||t>=11088&&t<=11097||t>=11192&&t<=11243)||ti["CJK Symbols and Punctuation"](t)||ti.Katakana(t)||ti["Private Use Area"](t)||ti["CJK Compatibility Forms"](t)||ti["Small Form Variants"](t)||ti["Halfwidth and Fullwidth Forms"](t)||8734===t||8756===t||8757===t||t>=9984&&t<=10087||t>=10102&&t<=10131||65532===t||65533===t)}(t))}function ii(t){return t>=1424&&t<=2303||ti["Arabic Presentation Forms-A"](t)||ti["Arabic Presentation Forms-B"](t)}function ai(t,e){return !(!e&&ii(t)||t>=2304&&t<=3583||t>=3840&&t<=4255||ti.Khmer(t))}function oi(t){for(var e=0,r=t;e<r.length;e+=1)if(ii(r[e].charCodeAt(0)))return !0;return !1}var si=null,ui="unavailable",li=null,pi=function(t){si&&si(t);};function ci(){hi.fire(new kt("pluginStateChange",{pluginStatus:ui,pluginURL:li}));}var hi=new zt,fi=function(){return ui},yi=function(){if("deferred"!==ui||!li)throw new Error("rtl-text-plugin cannot be downloaded unless a pluginURL is specified");ui="loading",ci(),li&&bt({url:li},(function(t){t?pi(t):(ui="loaded",ci());}));},di={applyArabicShaping:null,processBidirectionalText:null,processStyledBidirectionalText:null,isLoaded:function(){return "loaded"===ui||null!=di.applyArabicShaping},isLoading:function(){return "loading"===ui},setState:function(t){ui=t.pluginStatus,li=t.pluginURL;},isParsed:function(){return null!=di.applyArabicShaping&&null!=di.processBidirectionalText&&null!=di.processStyledBidirectionalText},getPluginURL:function(){return li}},mi=function(t,e){this.zoom=t,e?(this.now=e.now,this.fadeDuration=e.fadeDuration,this.zoomHistory=e.zoomHistory,this.transition=e.transition):(this.now=0,this.fadeDuration=0,this.zoomHistory=new Qn,this.transition={});};mi.prototype.isSupportedScript=function(t){return function(t,e){for(var r=0,n=t;r<n.length;r+=1)if(!ai(n[r].charCodeAt(0),e))return !1;return !0}(t,di.isLoaded())},mi.prototype.crossFadingFactor=function(){return 0===this.fadeDuration?1:Math.min((this.now-this.zoomHistory.lastIntegerZoomTime)/this.fadeDuration,1)},mi.prototype.getCrossfadeParameters=function(){var t=this.zoom,e=t-Math.floor(t),r=this.crossFadingFactor();return t>this.zoomHistory.lastIntegerZoom?{fromScale:2,toScale:1,t:e+(1-e)*r}:{fromScale:.5,toScale:1,t:1-(1-r)*e}};var vi=function(t,e){this.property=t,this.value=e,this.expression=function(t,e){if(Gr(t))return new an(t,e);if(Qr(t)){var r=nn(t,e);if("error"===r.result)throw new Error(r.value.map((function(t){return t.key+": "+t.message})).join(", "));return r.value}var n=t;return "string"==typeof t&&"color"===e.type&&(n=$t.parse(t)),{kind:"constant",evaluate:function(){return n}}}(void 0===e?t.specification.default:e,t.specification);};vi.prototype.isDataDriven=function(){return "source"===this.expression.kind||"composite"===this.expression.kind},vi.prototype.possiblyEvaluate=function(t,e,r){return this.property.possiblyEvaluate(this,t,e,r)};var gi=function(t){this.property=t,this.value=new vi(t,void 0);};gi.prototype.transitioned=function(t,e){return new bi(this.property,this.value,e,p({},t.transition,this.transition),t.now)},gi.prototype.untransitioned=function(){return new bi(this.property,this.value,null,{},0)};var xi=function(t){this._properties=t,this._values=Object.create(t.defaultTransitionablePropertyValues);};xi.prototype.getValue=function(t){return x(this._values[t].value.value)},xi.prototype.setValue=function(t,e){this._values.hasOwnProperty(t)||(this._values[t]=new gi(this._values[t].property)),this._values[t].value=new vi(this._values[t].property,null===e?void 0:x(e));},xi.prototype.getTransition=function(t){return x(this._values[t].transition)},xi.prototype.setTransition=function(t,e){this._values.hasOwnProperty(t)||(this._values[t]=new gi(this._values[t].property)),this._values[t].transition=x(e)||void 0;},xi.prototype.serialize=function(){for(var t={},e=0,r=Object.keys(this._values);e<r.length;e+=1){var n=r[e],i=this.getValue(n);void 0!==i&&(t[n]=i);var a=this.getTransition(n);void 0!==a&&(t[n+"-transition"]=a);}return t},xi.prototype.transitioned=function(t,e){for(var r=new wi(this._properties),n=0,i=Object.keys(this._values);n<i.length;n+=1){var a=i[n];r._values[a]=this._values[a].transitioned(t,e._values[a]);}return r},xi.prototype.untransitioned=function(){for(var t=new wi(this._properties),e=0,r=Object.keys(this._values);e<r.length;e+=1){var n=r[e];t._values[n]=this._values[n].untransitioned();}return t};var bi=function(t,e,r,n,i){this.property=t,this.value=e,this.begin=i+n.delay||0,this.end=this.begin+n.duration||0,t.specification.transition&&(n.delay||n.duration)&&(this.prior=r);};bi.prototype.possiblyEvaluate=function(t,e,r){var n=t.now||0,i=this.value.possiblyEvaluate(t,e,r),a=this.prior;if(a){if(n>this.end)return this.prior=null,i;if(this.value.isDataDriven())return this.prior=null,i;if(n<this.begin)return a.possiblyEvaluate(t,e,r);var o=(n-this.begin)/(this.end-this.begin);return this.property.interpolate(a.possiblyEvaluate(t,e,r),i,function(t){if(t<=0)return 0;if(t>=1)return 1;var e=t*t,r=e*t;return 4*(t<.5?r:3*(t-e)+r-.75)}(o))}return i};var wi=function(t){this._properties=t,this._values=Object.create(t.defaultTransitioningPropertyValues);};wi.prototype.possiblyEvaluate=function(t,e){for(var r=new Si(this._properties),n=0,i=Object.keys(this._values);n<i.length;n+=1){var a=i[n];r._values[a]=this._values[a].possiblyEvaluate(t,e);}return r},wi.prototype.hasTransition=function(){for(var t=0,e=Object.keys(this._values);t<e.length;t+=1)if(this._values[e[t]].prior)return !0;return !1};var _i=function(t){this._properties=t,this._values=Object.create(t.defaultPropertyValues);};_i.prototype.getValue=function(t){return x(this._values[t].value)},_i.prototype.setValue=function(t,e){this._values[t]=new vi(this._values[t].property,null===e?void 0:x(e));},_i.prototype.serialize=function(){for(var t={},e=0,r=Object.keys(this._values);e<r.length;e+=1){var n=r[e],i=this.getValue(n);void 0!==i&&(t[n]=i);}return t},_i.prototype.possiblyEvaluate=function(t,e){for(var r=new Si(this._properties),n=0,i=Object.keys(this._values);n<i.length;n+=1){var a=i[n];r._values[a]=this._values[a].possiblyEvaluate(t,e);}return r};var Ai=function(t,e,r){this.property=t,this.value=e,this.parameters=r;};Ai.prototype.isConstant=function(){return "constant"===this.value.kind},Ai.prototype.constantOr=function(t){return "constant"===this.value.kind?this.value.value:t},Ai.prototype.evaluate=function(t,e,r,n){return this.property.evaluate(this.value,this.parameters,t,e,r,n)};var Si=function(t){this._properties=t,this._values=Object.create(t.defaultPossiblyEvaluatedValues);};Si.prototype.get=function(t){return this._values[t]};var ki=function(t){this.specification=t;};ki.prototype.possiblyEvaluate=function(t,e){return t.expression.evaluate(e)},ki.prototype.interpolate=function(t,e,r){var n=He[this.specification.type];return n?n(t,e,r):t};var Ii=function(t,e){this.specification=t,this.overrides=e;};Ii.prototype.possiblyEvaluate=function(t,e,r,n){return new Ai(this,"constant"===t.expression.kind||"camera"===t.expression.kind?{kind:"constant",value:t.expression.evaluate(e,null,{},r,n)}:t.expression,e)},Ii.prototype.interpolate=function(t,e,r){if("constant"!==t.value.kind||"constant"!==e.value.kind)return t;if(void 0===t.value.value||void 0===e.value.value)return new Ai(this,{kind:"constant",value:void 0},t.parameters);var n=He[this.specification.type];return n?new Ai(this,{kind:"constant",value:n(t.value.value,e.value.value,r)},t.parameters):t},Ii.prototype.evaluate=function(t,e,r,n,i,a){return "constant"===t.kind?t.value:t.evaluate(e,r,n,i,a)};var zi=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.possiblyEvaluate=function(t,e,r,n){if(void 0===t.value)return new Ai(this,{kind:"constant",value:void 0},e);if("constant"===t.expression.kind){var i=t.expression.evaluate(e,null,{},r,n),a="resolvedImage"===t.property.specification.type&&"string"!=typeof i?i.name:i,o=this._calculate(a,a,a,e);return new Ai(this,{kind:"constant",value:o},e)}if("camera"===t.expression.kind){var s=this._calculate(t.expression.evaluate({zoom:e.zoom-1}),t.expression.evaluate({zoom:e.zoom}),t.expression.evaluate({zoom:e.zoom+1}),e);return new Ai(this,{kind:"constant",value:s},e)}return new Ai(this,t.expression,e)},e.prototype.evaluate=function(t,e,r,n,i,a){if("source"===t.kind){var o=t.evaluate(e,r,n,i,a);return this._calculate(o,o,o,e)}return "composite"===t.kind?this._calculate(t.evaluate({zoom:Math.floor(e.zoom)-1},r,n),t.evaluate({zoom:Math.floor(e.zoom)},r,n),t.evaluate({zoom:Math.floor(e.zoom)+1},r,n),e):t.value},e.prototype._calculate=function(t,e,r,n){return n.zoom>n.zoomHistory.lastIntegerZoom?{from:t,to:e}:{from:r,to:e}},e.prototype.interpolate=function(t){return t},e}(Ii),Ci=function(t){this.specification=t;};Ci.prototype.possiblyEvaluate=function(t,e,r,n){if(void 0!==t.value){if("constant"===t.expression.kind){var i=t.expression.evaluate(e,null,{},r,n);return this._calculate(i,i,i,e)}return this._calculate(t.expression.evaluate(new mi(Math.floor(e.zoom-1),e)),t.expression.evaluate(new mi(Math.floor(e.zoom),e)),t.expression.evaluate(new mi(Math.floor(e.zoom+1),e)),e)}},Ci.prototype._calculate=function(t,e,r,n){return n.zoom>n.zoomHistory.lastIntegerZoom?{from:t,to:e}:{from:r,to:e}},Ci.prototype.interpolate=function(t){return t};var Mi=function(t){this.specification=t;};Mi.prototype.possiblyEvaluate=function(t,e,r,n){return !!t.expression.evaluate(e,null,{},r,n)},Mi.prototype.interpolate=function(){return !1};var Ti=function(t){for(var e in this.properties=t,this.defaultPropertyValues={},this.defaultTransitionablePropertyValues={},this.defaultTransitioningPropertyValues={},this.defaultPossiblyEvaluatedValues={},this.overridableProperties=[],t){var r=t[e];r.specification.overridable&&this.overridableProperties.push(e);var n=this.defaultPropertyValues[e]=new vi(r,void 0),i=this.defaultTransitionablePropertyValues[e]=new gi(r);this.defaultTransitioningPropertyValues[e]=i.untransitioned(),this.defaultPossiblyEvaluatedValues[e]=n.possiblyEvaluate({});}};Xn("DataDrivenProperty",Ii),Xn("DataConstantProperty",ki),Xn("CrossFadedDataDrivenProperty",zi),Xn("CrossFadedProperty",Ci),Xn("ColorRampProperty",Mi);var Ei=function(t){function e(e,r){if(t.call(this),this.id=e.id,this.type=e.type,this._featureFilter={filter:function(){return !0},needGeometry:!1},"custom"!==e.type&&(this.metadata=(e=e).metadata,this.minzoom=e.minzoom,this.maxzoom=e.maxzoom,"background"!==e.type&&(this.source=e.source,this.sourceLayer=e["source-layer"],this.filter=e.filter),r.layout&&(this._unevaluatedLayout=new _i(r.layout)),r.paint)){for(var n in this._transitionablePaint=new xi(r.paint),e.paint)this.setPaintProperty(n,e.paint[n],{validate:!1});for(var i in e.layout)this.setLayoutProperty(i,e.layout[i],{validate:!1});this._transitioningPaint=this._transitionablePaint.untransitioned();}}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getCrossfadeParameters=function(){return this._crossfadeParameters},e.prototype.getLayoutProperty=function(t){return "visibility"===t?this.visibility:this._unevaluatedLayout.getValue(t)},e.prototype.setLayoutProperty=function(t,e,r){void 0===r&&(r={}),null!=e&&this._validate(On,"layers."+this.id+".layout."+t,t,e,r)||("visibility"!==t?this._unevaluatedLayout.setValue(t,e):this.visibility=e);},e.prototype.getPaintProperty=function(t){return m(t,"-transition")?this._transitionablePaint.getTransition(t.slice(0,-"-transition".length)):this._transitionablePaint.getValue(t)},e.prototype.setPaintProperty=function(t,e,r){if(void 0===r&&(r={}),null!=e&&this._validate(Rn,"layers."+this.id+".paint."+t,t,e,r))return !1;if(m(t,"-transition"))return this._transitionablePaint.setTransition(t.slice(0,-"-transition".length),e||void 0),!1;var n=this._transitionablePaint._values[t],i="cross-faded-data-driven"===n.property.specification["property-type"],a=n.value.isDataDriven(),o=n.value;this._transitionablePaint.setValue(t,e),this._handleSpecialPaintPropertyUpdate(t);var s=this._transitionablePaint._values[t].value;return s.isDataDriven()||a||i||this._handleOverridablePaintPropertyUpdate(t,o,s)},e.prototype._handleSpecialPaintPropertyUpdate=function(t){},e.prototype._handleOverridablePaintPropertyUpdate=function(t,e,r){return !1},e.prototype.isHidden=function(t){return !!(this.minzoom&&t<this.minzoom)||!!(this.maxzoom&&t>=this.maxzoom)||"none"===this.visibility},e.prototype.updateTransitions=function(t){this._transitioningPaint=this._transitionablePaint.transitioned(t,this._transitioningPaint);},e.prototype.hasTransition=function(){return this._transitioningPaint.hasTransition()},e.prototype.recalculate=function(t,e){t.getCrossfadeParameters&&(this._crossfadeParameters=t.getCrossfadeParameters()),this._unevaluatedLayout&&(this.layout=this._unevaluatedLayout.possiblyEvaluate(t,e)),this.paint=this._transitioningPaint.possiblyEvaluate(t,e);},e.prototype.serialize=function(){var t={id:this.id,type:this.type,source:this.source,"source-layer":this.sourceLayer,metadata:this.metadata,minzoom:this.minzoom,maxzoom:this.maxzoom,filter:this.filter,layout:this._unevaluatedLayout&&this._unevaluatedLayout.serialize(),paint:this._transitionablePaint&&this._transitionablePaint.serialize()};return this.visibility&&(t.layout=t.layout||{},t.layout.visibility=this.visibility),g(t,(function(t,e){return !(void 0===t||"layout"===e&&!Object.keys(t).length||"paint"===e&&!Object.keys(t).length)}))},e.prototype._validate=function(t,e,r,n,i){return void 0===i&&(i={}),(!i||!1!==i.validate)&&Un(this,t.call(Dn,{key:e,layerType:this.type,objectKey:r,value:n,styleSpec:Ct,style:{glyphs:!0,sprite:!0}}))},e.prototype.is3D=function(){return !1},e.prototype.isTileClipped=function(){return !1},e.prototype.hasOffscreenPass=function(){return !1},e.prototype.resize=function(){},e.prototype.isStateDependent=function(){for(var t in this.paint._values){var e=this.paint.get(t);if(e instanceof Ai&&jr(e.property.specification)&&("source"===e.value.kind||"composite"===e.value.kind)&&e.value.isStateDependent)return !0}return !1},e}(zt),Pi={Int8:Int8Array,Uint8:Uint8Array,Int16:Int16Array,Uint16:Uint16Array,Int32:Int32Array,Uint32:Uint32Array,Float32:Float32Array},Bi=function(t,e){this._structArray=t,this._pos1=e*this.size,this._pos2=this._pos1/2,this._pos4=this._pos1/4,this._pos8=this._pos1/8;},Vi=function(){this.isTransferred=!1,this.capacity=-1,this.resize(0);};function Fi(t,e){void 0===e&&(e=1);var r=0,n=0;return {members:t.map((function(t){var i=Pi[t.type].BYTES_PER_ELEMENT,a=r=Di(r,Math.max(e,i)),o=t.components||1;return n=Math.max(n,i),r+=i*o,{name:t.name,type:t.type,components:o,offset:a}})),size:Di(r,Math.max(n,e)),alignment:e}}function Di(t,e){return Math.ceil(t/e)*e}Vi.serialize=function(t,e){return t._trim(),e&&(t.isTransferred=!0,e.push(t.arrayBuffer)),{length:t.length,arrayBuffer:t.arrayBuffer}},Vi.deserialize=function(t){var e=Object.create(this.prototype);return e.arrayBuffer=t.arrayBuffer,e.length=t.length,e.capacity=t.arrayBuffer.byteLength/e.bytesPerElement,e._refreshViews(),e},Vi.prototype._trim=function(){this.length!==this.capacity&&(this.capacity=this.length,this.arrayBuffer=this.arrayBuffer.slice(0,this.length*this.bytesPerElement),this._refreshViews());},Vi.prototype.clear=function(){this.length=0;},Vi.prototype.resize=function(t){this.reserve(t),this.length=t;},Vi.prototype.reserve=function(t){if(t>this.capacity){this.capacity=Math.max(t,Math.floor(5*this.capacity),128),this.arrayBuffer=new ArrayBuffer(this.capacity*this.bytesPerElement);var e=this.uint8;this._refreshViews(),e&&this.uint8.set(e);}},Vi.prototype._refreshViews=function(){throw new Error("_refreshViews() must be implemented by each concrete StructArray layout")};var Li=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.int16=new Int16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e){var r=this.length;return this.resize(r+1),this.emplace(r,t,e)},e.prototype.emplace=function(t,e,r){var n=2*t;return this.int16[n+0]=e,this.int16[n+1]=r,t},e}(Vi);Li.prototype.bytesPerElement=4,Xn("StructArrayLayout2i4",Li);var Ri=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.int16=new Int16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e,r,n){var i=this.length;return this.resize(i+1),this.emplace(i,t,e,r,n)},e.prototype.emplace=function(t,e,r,n,i){var a=4*t;return this.int16[a+0]=e,this.int16[a+1]=r,this.int16[a+2]=n,this.int16[a+3]=i,t},e}(Vi);Ri.prototype.bytesPerElement=8,Xn("StructArrayLayout4i8",Ri);var Oi=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.int16=new Int16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e,r,n,i,a){var o=this.length;return this.resize(o+1),this.emplace(o,t,e,r,n,i,a)},e.prototype.emplace=function(t,e,r,n,i,a,o){var s=6*t;return this.int16[s+0]=e,this.int16[s+1]=r,this.int16[s+2]=n,this.int16[s+3]=i,this.int16[s+4]=a,this.int16[s+5]=o,t},e}(Vi);Oi.prototype.bytesPerElement=12,Xn("StructArrayLayout2i4i12",Oi);var Ui=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.int16=new Int16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e,r,n,i,a){var o=this.length;return this.resize(o+1),this.emplace(o,t,e,r,n,i,a)},e.prototype.emplace=function(t,e,r,n,i,a,o){var s=4*t,u=8*t;return this.int16[s+0]=e,this.int16[s+1]=r,this.uint8[u+4]=n,this.uint8[u+5]=i,this.uint8[u+6]=a,this.uint8[u+7]=o,t},e}(Vi);Ui.prototype.bytesPerElement=8,Xn("StructArrayLayout2i4ub8",Ui);var ji=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.uint16=new Uint16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e,r,n,i,a,o,s,u,l){var p=this.length;return this.resize(p+1),this.emplace(p,t,e,r,n,i,a,o,s,u,l)},e.prototype.emplace=function(t,e,r,n,i,a,o,s,u,l,p){var c=9*t,h=18*t;return this.uint16[c+0]=e,this.uint16[c+1]=r,this.uint16[c+2]=n,this.uint16[c+3]=i,this.uint16[c+4]=a,this.uint16[c+5]=o,this.uint16[c+6]=s,this.uint16[c+7]=u,this.uint8[h+16]=l,this.uint8[h+17]=p,t},e}(Vi);ji.prototype.bytesPerElement=18,Xn("StructArrayLayout8ui2ub18",ji);var qi=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.int16=new Int16Array(this.arrayBuffer),this.uint16=new Uint16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e,r,n,i,a,o,s,u,l,p,c){var h=this.length;return this.resize(h+1),this.emplace(h,t,e,r,n,i,a,o,s,u,l,p,c)},e.prototype.emplace=function(t,e,r,n,i,a,o,s,u,l,p,c,h){var f=12*t;return this.int16[f+0]=e,this.int16[f+1]=r,this.int16[f+2]=n,this.int16[f+3]=i,this.uint16[f+4]=a,this.uint16[f+5]=o,this.uint16[f+6]=s,this.uint16[f+7]=u,this.int16[f+8]=l,this.int16[f+9]=p,this.int16[f+10]=c,this.int16[f+11]=h,t},e}(Vi);qi.prototype.bytesPerElement=24,Xn("StructArrayLayout4i4ui4i24",qi);var Ni=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.float32=new Float32Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e,r){var n=this.length;return this.resize(n+1),this.emplace(n,t,e,r)},e.prototype.emplace=function(t,e,r,n){var i=3*t;return this.float32[i+0]=e,this.float32[i+1]=r,this.float32[i+2]=n,t},e}(Vi);Ni.prototype.bytesPerElement=12,Xn("StructArrayLayout3f12",Ni);var Ki=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.uint32=new Uint32Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t){var e=this.length;return this.resize(e+1),this.emplace(e,t)},e.prototype.emplace=function(t,e){return this.uint32[1*t+0]=e,t},e}(Vi);Ki.prototype.bytesPerElement=4,Xn("StructArrayLayout1ul4",Ki);var Gi=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.int16=new Int16Array(this.arrayBuffer),this.uint32=new Uint32Array(this.arrayBuffer),this.uint16=new Uint16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e,r,n,i,a,o,s,u,l,p){var c=this.length;return this.resize(c+1),this.emplace(c,t,e,r,n,i,a,o,s,u,l,p)},e.prototype.emplace=function(t,e,r,n,i,a,o,s,u,l,p,c){var h=12*t,f=6*t;return this.int16[h+0]=e,this.int16[h+1]=r,this.int16[h+2]=n,this.int16[h+3]=i,this.int16[h+4]=a,this.int16[h+5]=o,this.uint32[f+3]=s,this.uint16[h+8]=u,this.uint16[h+9]=l,this.int16[h+10]=p,this.int16[h+11]=c,t},e}(Vi);Gi.prototype.bytesPerElement=24,Xn("StructArrayLayout6i1ul2ui2i24",Gi);var Zi=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.int16=new Int16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e,r,n,i,a){var o=this.length;return this.resize(o+1),this.emplace(o,t,e,r,n,i,a)},e.prototype.emplace=function(t,e,r,n,i,a,o){var s=6*t;return this.int16[s+0]=e,this.int16[s+1]=r,this.int16[s+2]=n,this.int16[s+3]=i,this.int16[s+4]=a,this.int16[s+5]=o,t},e}(Vi);Zi.prototype.bytesPerElement=12,Xn("StructArrayLayout2i2i2i12",Zi);var Xi=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.float32=new Float32Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e,r,n){var i=this.length;return this.resize(i+1),this.emplace(i,t,e,r,n)},e.prototype.emplace=function(t,e,r,n,i){var a=12*t,o=3*t;return this.uint8[a+0]=e,this.uint8[a+1]=r,this.float32[o+1]=n,this.float32[o+2]=i,t},e}(Vi);Xi.prototype.bytesPerElement=12,Xn("StructArrayLayout2ub2f12",Xi);var Ji=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.int16=new Int16Array(this.arrayBuffer),this.uint16=new Uint16Array(this.arrayBuffer),this.uint32=new Uint32Array(this.arrayBuffer),this.float32=new Float32Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e,r,n,i,a,o,s,u,l,p,c,h,f,y,d,m){var v=this.length;return this.resize(v+1),this.emplace(v,t,e,r,n,i,a,o,s,u,l,p,c,h,f,y,d,m)},e.prototype.emplace=function(t,e,r,n,i,a,o,s,u,l,p,c,h,f,y,d,m,v){var g=24*t,x=12*t,b=48*t;return this.int16[g+0]=e,this.int16[g+1]=r,this.uint16[g+2]=n,this.uint16[g+3]=i,this.uint32[x+2]=a,this.uint32[x+3]=o,this.uint32[x+4]=s,this.uint16[g+10]=u,this.uint16[g+11]=l,this.uint16[g+12]=p,this.float32[x+7]=c,this.float32[x+8]=h,this.uint8[b+36]=f,this.uint8[b+37]=y,this.uint8[b+38]=d,this.uint32[x+10]=m,this.int16[g+22]=v,t},e}(Vi);Ji.prototype.bytesPerElement=48,Xn("StructArrayLayout2i2ui3ul3ui2f3ub1ul1i48",Ji);var Hi=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.int16=new Int16Array(this.arrayBuffer),this.uint16=new Uint16Array(this.arrayBuffer),this.uint32=new Uint32Array(this.arrayBuffer),this.float32=new Float32Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e,r,n,i,a,o,s,u,l,p,c,h,f,y,d,m,v,g,x,b,w,_,A,S,k){var I=this.length;return this.resize(I+1),this.emplace(I,t,e,r,n,i,a,o,s,u,l,p,c,h,f,y,d,m,v,g,x,b,w,_,A,S,k)},e.prototype.emplace=function(t,e,r,n,i,a,o,s,u,l,p,c,h,f,y,d,m,v,g,x,b,w,_,A,S,k,I){var z=30*t,C=15*t;return this.int16[z+0]=e,this.int16[z+1]=r,this.int16[z+2]=n,this.int16[z+3]=i,this.int16[z+4]=a,this.int16[z+5]=o,this.int16[z+6]=s,this.int16[z+7]=u,this.uint16[z+8]=l,this.uint16[z+9]=p,this.uint16[z+10]=c,this.uint16[z+11]=h,this.uint16[z+12]=f,this.uint16[z+13]=y,this.uint16[z+14]=d,this.uint16[z+15]=m,this.uint16[z+16]=v,this.uint16[z+17]=g,this.uint16[z+18]=x,this.uint16[z+19]=b,this.uint16[z+20]=w,this.uint16[z+21]=_,this.uint32[C+11]=A,this.float32[C+12]=S,this.float32[C+13]=k,this.float32[C+14]=I,t},e}(Vi);Hi.prototype.bytesPerElement=60,Xn("StructArrayLayout8i14ui1ul3f60",Hi);var Yi=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.float32=new Float32Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t){var e=this.length;return this.resize(e+1),this.emplace(e,t)},e.prototype.emplace=function(t,e){return this.float32[1*t+0]=e,t},e}(Vi);Yi.prototype.bytesPerElement=4,Xn("StructArrayLayout1f4",Yi);var $i=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.int16=new Int16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e,r){var n=this.length;return this.resize(n+1),this.emplace(n,t,e,r)},e.prototype.emplace=function(t,e,r,n){var i=3*t;return this.int16[i+0]=e,this.int16[i+1]=r,this.int16[i+2]=n,t},e}(Vi);$i.prototype.bytesPerElement=6,Xn("StructArrayLayout3i6",$i);var Wi=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.uint32=new Uint32Array(this.arrayBuffer),this.uint16=new Uint16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e,r){var n=this.length;return this.resize(n+1),this.emplace(n,t,e,r)},e.prototype.emplace=function(t,e,r,n){var i=4*t;return this.uint32[2*t+0]=e,this.uint16[i+2]=r,this.uint16[i+3]=n,t},e}(Vi);Wi.prototype.bytesPerElement=8,Xn("StructArrayLayout1ul2ui8",Wi);var Qi=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.uint16=new Uint16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e,r){var n=this.length;return this.resize(n+1),this.emplace(n,t,e,r)},e.prototype.emplace=function(t,e,r,n){var i=3*t;return this.uint16[i+0]=e,this.uint16[i+1]=r,this.uint16[i+2]=n,t},e}(Vi);Qi.prototype.bytesPerElement=6,Xn("StructArrayLayout3ui6",Qi);var ta=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.uint16=new Uint16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e){var r=this.length;return this.resize(r+1),this.emplace(r,t,e)},e.prototype.emplace=function(t,e,r){var n=2*t;return this.uint16[n+0]=e,this.uint16[n+1]=r,t},e}(Vi);ta.prototype.bytesPerElement=4,Xn("StructArrayLayout2ui4",ta);var ea=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.uint16=new Uint16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t){var e=this.length;return this.resize(e+1),this.emplace(e,t)},e.prototype.emplace=function(t,e){return this.uint16[1*t+0]=e,t},e}(Vi);ea.prototype.bytesPerElement=2,Xn("StructArrayLayout1ui2",ea);var ra=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.float32=new Float32Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e){var r=this.length;return this.resize(r+1),this.emplace(r,t,e)},e.prototype.emplace=function(t,e,r){var n=2*t;return this.float32[n+0]=e,this.float32[n+1]=r,t},e}(Vi);ra.prototype.bytesPerElement=8,Xn("StructArrayLayout2f8",ra);var na=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.float32=new Float32Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e,r,n){var i=this.length;return this.resize(i+1),this.emplace(i,t,e,r,n)},e.prototype.emplace=function(t,e,r,n,i){var a=4*t;return this.float32[a+0]=e,this.float32[a+1]=r,this.float32[a+2]=n,this.float32[a+3]=i,t},e}(Vi);na.prototype.bytesPerElement=16,Xn("StructArrayLayout4f16",na);var ia=function(t){function e(){t.apply(this,arguments);}t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e;var r={anchorPointX:{configurable:!0},anchorPointY:{configurable:!0},x1:{configurable:!0},y1:{configurable:!0},x2:{configurable:!0},y2:{configurable:!0},featureIndex:{configurable:!0},sourceLayerIndex:{configurable:!0},bucketIndex:{configurable:!0},radius:{configurable:!0},signedDistanceFromAnchor:{configurable:!0},anchorPoint:{configurable:!0}};return r.anchorPointX.get=function(){return this._structArray.int16[this._pos2+0]},r.anchorPointY.get=function(){return this._structArray.int16[this._pos2+1]},r.x1.get=function(){return this._structArray.int16[this._pos2+2]},r.y1.get=function(){return this._structArray.int16[this._pos2+3]},r.x2.get=function(){return this._structArray.int16[this._pos2+4]},r.y2.get=function(){return this._structArray.int16[this._pos2+5]},r.featureIndex.get=function(){return this._structArray.uint32[this._pos4+3]},r.sourceLayerIndex.get=function(){return this._structArray.uint16[this._pos2+8]},r.bucketIndex.get=function(){return this._structArray.uint16[this._pos2+9]},r.radius.get=function(){return this._structArray.int16[this._pos2+10]},r.signedDistanceFromAnchor.get=function(){return this._structArray.int16[this._pos2+11]},r.anchorPoint.get=function(){return new i(this.anchorPointX,this.anchorPointY)},Object.defineProperties(e.prototype,r),e}(Bi);ia.prototype.size=24;var aa=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.get=function(t){return new ia(this,t)},e}(Gi);Xn("CollisionBoxArray",aa);var oa=function(t){function e(){t.apply(this,arguments);}t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e;var r={anchorX:{configurable:!0},anchorY:{configurable:!0},glyphStartIndex:{configurable:!0},numGlyphs:{configurable:!0},vertexStartIndex:{configurable:!0},lineStartIndex:{configurable:!0},lineLength:{configurable:!0},segment:{configurable:!0},lowerSize:{configurable:!0},upperSize:{configurable:!0},lineOffsetX:{configurable:!0},lineOffsetY:{configurable:!0},writingMode:{configurable:!0},placedOrientation:{configurable:!0},hidden:{configurable:!0},crossTileID:{configurable:!0},associatedIconIndex:{configurable:!0}};return r.anchorX.get=function(){return this._structArray.int16[this._pos2+0]},r.anchorY.get=function(){return this._structArray.int16[this._pos2+1]},r.glyphStartIndex.get=function(){return this._structArray.uint16[this._pos2+2]},r.numGlyphs.get=function(){return this._structArray.uint16[this._pos2+3]},r.vertexStartIndex.get=function(){return this._structArray.uint32[this._pos4+2]},r.lineStartIndex.get=function(){return this._structArray.uint32[this._pos4+3]},r.lineLength.get=function(){return this._structArray.uint32[this._pos4+4]},r.segment.get=function(){return this._structArray.uint16[this._pos2+10]},r.lowerSize.get=function(){return this._structArray.uint16[this._pos2+11]},r.upperSize.get=function(){return this._structArray.uint16[this._pos2+12]},r.lineOffsetX.get=function(){return this._structArray.float32[this._pos4+7]},r.lineOffsetY.get=function(){return this._structArray.float32[this._pos4+8]},r.writingMode.get=function(){return this._structArray.uint8[this._pos1+36]},r.placedOrientation.get=function(){return this._structArray.uint8[this._pos1+37]},r.placedOrientation.set=function(t){this._structArray.uint8[this._pos1+37]=t;},r.hidden.get=function(){return this._structArray.uint8[this._pos1+38]},r.hidden.set=function(t){this._structArray.uint8[this._pos1+38]=t;},r.crossTileID.get=function(){return this._structArray.uint32[this._pos4+10]},r.crossTileID.set=function(t){this._structArray.uint32[this._pos4+10]=t;},r.associatedIconIndex.get=function(){return this._structArray.int16[this._pos2+22]},Object.defineProperties(e.prototype,r),e}(Bi);oa.prototype.size=48;var sa=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.get=function(t){return new oa(this,t)},e}(Ji);Xn("PlacedSymbolArray",sa);var ua=function(t){function e(){t.apply(this,arguments);}t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e;var r={anchorX:{configurable:!0},anchorY:{configurable:!0},rightJustifiedTextSymbolIndex:{configurable:!0},centerJustifiedTextSymbolIndex:{configurable:!0},leftJustifiedTextSymbolIndex:{configurable:!0},verticalPlacedTextSymbolIndex:{configurable:!0},placedIconSymbolIndex:{configurable:!0},verticalPlacedIconSymbolIndex:{configurable:!0},key:{configurable:!0},textBoxStartIndex:{configurable:!0},textBoxEndIndex:{configurable:!0},verticalTextBoxStartIndex:{configurable:!0},verticalTextBoxEndIndex:{configurable:!0},iconBoxStartIndex:{configurable:!0},iconBoxEndIndex:{configurable:!0},verticalIconBoxStartIndex:{configurable:!0},verticalIconBoxEndIndex:{configurable:!0},featureIndex:{configurable:!0},numHorizontalGlyphVertices:{configurable:!0},numVerticalGlyphVertices:{configurable:!0},numIconVertices:{configurable:!0},numVerticalIconVertices:{configurable:!0},crossTileID:{configurable:!0},textBoxScale:{configurable:!0},textOffset0:{configurable:!0},textOffset1:{configurable:!0}};return r.anchorX.get=function(){return this._structArray.int16[this._pos2+0]},r.anchorY.get=function(){return this._structArray.int16[this._pos2+1]},r.rightJustifiedTextSymbolIndex.get=function(){return this._structArray.int16[this._pos2+2]},r.centerJustifiedTextSymbolIndex.get=function(){return this._structArray.int16[this._pos2+3]},r.leftJustifiedTextSymbolIndex.get=function(){return this._structArray.int16[this._pos2+4]},r.verticalPlacedTextSymbolIndex.get=function(){return this._structArray.int16[this._pos2+5]},r.placedIconSymbolIndex.get=function(){return this._structArray.int16[this._pos2+6]},r.verticalPlacedIconSymbolIndex.get=function(){return this._structArray.int16[this._pos2+7]},r.key.get=function(){return this._structArray.uint16[this._pos2+8]},r.textBoxStartIndex.get=function(){return this._structArray.uint16[this._pos2+9]},r.textBoxEndIndex.get=function(){return this._structArray.uint16[this._pos2+10]},r.verticalTextBoxStartIndex.get=function(){return this._structArray.uint16[this._pos2+11]},r.verticalTextBoxEndIndex.get=function(){return this._structArray.uint16[this._pos2+12]},r.iconBoxStartIndex.get=function(){return this._structArray.uint16[this._pos2+13]},r.iconBoxEndIndex.get=function(){return this._structArray.uint16[this._pos2+14]},r.verticalIconBoxStartIndex.get=function(){return this._structArray.uint16[this._pos2+15]},r.verticalIconBoxEndIndex.get=function(){return this._structArray.uint16[this._pos2+16]},r.featureIndex.get=function(){return this._structArray.uint16[this._pos2+17]},r.numHorizontalGlyphVertices.get=function(){return this._structArray.uint16[this._pos2+18]},r.numVerticalGlyphVertices.get=function(){return this._structArray.uint16[this._pos2+19]},r.numIconVertices.get=function(){return this._structArray.uint16[this._pos2+20]},r.numVerticalIconVertices.get=function(){return this._structArray.uint16[this._pos2+21]},r.crossTileID.get=function(){return this._structArray.uint32[this._pos4+11]},r.crossTileID.set=function(t){this._structArray.uint32[this._pos4+11]=t;},r.textBoxScale.get=function(){return this._structArray.float32[this._pos4+12]},r.textOffset0.get=function(){return this._structArray.float32[this._pos4+13]},r.textOffset1.get=function(){return this._structArray.float32[this._pos4+14]},Object.defineProperties(e.prototype,r),e}(Bi);ua.prototype.size=60;var la=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.get=function(t){return new ua(this,t)},e}(Hi);Xn("SymbolInstanceArray",la);var pa=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getoffsetX=function(t){return this.float32[1*t+0]},e}(Yi);Xn("GlyphOffsetArray",pa);var ca=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getx=function(t){return this.int16[3*t+0]},e.prototype.gety=function(t){return this.int16[3*t+1]},e.prototype.gettileUnitDistanceFromAnchor=function(t){return this.int16[3*t+2]},e}($i);Xn("SymbolLineVertexArray",ca);var ha=function(t){function e(){t.apply(this,arguments);}t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e;var r={featureIndex:{configurable:!0},sourceLayerIndex:{configurable:!0},bucketIndex:{configurable:!0}};return r.featureIndex.get=function(){return this._structArray.uint32[this._pos4+0]},r.sourceLayerIndex.get=function(){return this._structArray.uint16[this._pos2+2]},r.bucketIndex.get=function(){return this._structArray.uint16[this._pos2+3]},Object.defineProperties(e.prototype,r),e}(Bi);ha.prototype.size=8;var fa=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.get=function(t){return new ha(this,t)},e}(Wi);Xn("FeatureIndexArray",fa);var ya=Fi([{name:"a_pos",components:2,type:"Int16"}],4).members,da=function(t){void 0===t&&(t=[]),this.segments=t;};function ma(t,e){return 256*(t=u(Math.floor(t),0,255))+u(Math.floor(e),0,255)}da.prototype.prepareSegment=function(t,e,r,n){var i=this.segments[this.segments.length-1];return t>da.MAX_VERTEX_ARRAY_LENGTH&&w("Max vertices per segment is "+da.MAX_VERTEX_ARRAY_LENGTH+": bucket requested "+t),(!i||i.vertexLength+t>da.MAX_VERTEX_ARRAY_LENGTH||i.sortKey!==n)&&(i={vertexOffset:e.length,primitiveOffset:r.length,vertexLength:0,primitiveLength:0},void 0!==n&&(i.sortKey=n),this.segments.push(i)),i},da.prototype.get=function(){return this.segments},da.prototype.destroy=function(){for(var t=0,e=this.segments;t<e.length;t+=1){var r=e[t];for(var n in r.vaos)r.vaos[n].destroy();}},da.simpleSegment=function(t,e,r,n){return new da([{vertexOffset:t,primitiveOffset:e,vertexLength:r,primitiveLength:n,vaos:{},sortKey:0}])},da.MAX_VERTEX_ARRAY_LENGTH=Math.pow(2,16)-1,Xn("SegmentVector",da);var va=e((function(t){t.exports=function(t,e){var r,n,i,a,o,s,u,l;for(n=t.length-(r=3&t.length),i=e,o=3432918353,s=461845907,l=0;l<n;)u=255&t.charCodeAt(l)|(255&t.charCodeAt(++l))<<8|(255&t.charCodeAt(++l))<<16|(255&t.charCodeAt(++l))<<24,++l,i=27492+(65535&(a=5*(65535&(i=(i^=u=(65535&(u=(u=(65535&u)*o+(((u>>>16)*o&65535)<<16)&4294967295)<<15|u>>>17))*s+(((u>>>16)*s&65535)<<16)&4294967295)<<13|i>>>19))+((5*(i>>>16)&65535)<<16)&4294967295))+((58964+(a>>>16)&65535)<<16);switch(u=0,r){case 3:u^=(255&t.charCodeAt(l+2))<<16;case 2:u^=(255&t.charCodeAt(l+1))<<8;case 1:i^=u=(65535&(u=(u=(65535&(u^=255&t.charCodeAt(l)))*o+(((u>>>16)*o&65535)<<16)&4294967295)<<15|u>>>17))*s+(((u>>>16)*s&65535)<<16)&4294967295;}return i^=t.length,i=2246822507*(65535&(i^=i>>>16))+((2246822507*(i>>>16)&65535)<<16)&4294967295,i=3266489909*(65535&(i^=i>>>13))+((3266489909*(i>>>16)&65535)<<16)&4294967295,(i^=i>>>16)>>>0};})),ga=e((function(t){t.exports=function(t,e){for(var r,n=t.length,i=e^n,a=0;n>=4;)r=1540483477*(65535&(r=255&t.charCodeAt(a)|(255&t.charCodeAt(++a))<<8|(255&t.charCodeAt(++a))<<16|(255&t.charCodeAt(++a))<<24))+((1540483477*(r>>>16)&65535)<<16),i=1540483477*(65535&i)+((1540483477*(i>>>16)&65535)<<16)^(r=1540483477*(65535&(r^=r>>>24))+((1540483477*(r>>>16)&65535)<<16)),n-=4,++a;switch(n){case 3:i^=(255&t.charCodeAt(a+2))<<16;case 2:i^=(255&t.charCodeAt(a+1))<<8;case 1:i=1540483477*(65535&(i^=255&t.charCodeAt(a)))+((1540483477*(i>>>16)&65535)<<16);}return i=1540483477*(65535&(i^=i>>>13))+((1540483477*(i>>>16)&65535)<<16),(i^=i>>>15)>>>0};})),xa=va,ba=ga;xa.murmur3=va,xa.murmur2=ba;var wa=function(){this.ids=[],this.positions=[],this.indexed=!1;};wa.prototype.add=function(t,e,r,n){this.ids.push(Aa(t)),this.positions.push(e,r,n);},wa.prototype.getPositions=function(t){for(var e=Aa(t),r=0,n=this.ids.length-1;r<n;){var i=r+n>>1;this.ids[i]>=e?n=i:r=i+1;}for(var a=[];this.ids[r]===e;)a.push({index:this.positions[3*r],start:this.positions[3*r+1],end:this.positions[3*r+2]}),r++;return a},wa.serialize=function(t,e){var r=new Float64Array(t.ids),n=new Uint32Array(t.positions);return function t(e,r,n,i){if(!(n>=i)){for(var a=e[n+i>>1],o=n-1,s=i+1;;){do{o++;}while(e[o]<a);do{s--;}while(e[s]>a);if(o>=s)break;Sa(e,o,s),Sa(r,3*o,3*s),Sa(r,3*o+1,3*s+1),Sa(r,3*o+2,3*s+2);}t(e,r,n,s),t(e,r,s+1,i);}}(r,n,0,r.length-1),e&&e.push(r.buffer,n.buffer),{ids:r,positions:n}},wa.deserialize=function(t){var e=new wa;return e.ids=t.ids,e.positions=t.positions,e.indexed=!0,e};var _a=Math.pow(2,53)-1;function Aa(t){var e=+t;return !isNaN(e)&&e<=_a?e:xa(String(t))}function Sa(t,e,r){var n=t[e];t[e]=t[r],t[r]=n;}Xn("FeaturePositionMap",wa);var ka=function(t,e){this.gl=t.gl,this.location=e;},Ia=function(t){function e(e,r){t.call(this,e,r),this.current=0;}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.set=function(t){this.current!==t&&(this.current=t,this.gl.uniform1i(this.location,t));},e}(ka),za=function(t){function e(e,r){t.call(this,e,r),this.current=0;}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.set=function(t){this.current!==t&&(this.current=t,this.gl.uniform1f(this.location,t));},e}(ka),Ca=function(t){function e(e,r){t.call(this,e,r),this.current=[0,0];}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.set=function(t){t[0]===this.current[0]&&t[1]===this.current[1]||(this.current=t,this.gl.uniform2f(this.location,t[0],t[1]));},e}(ka),Ma=function(t){function e(e,r){t.call(this,e,r),this.current=[0,0,0];}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.set=function(t){t[0]===this.current[0]&&t[1]===this.current[1]&&t[2]===this.current[2]||(this.current=t,this.gl.uniform3f(this.location,t[0],t[1],t[2]));},e}(ka),Ta=function(t){function e(e,r){t.call(this,e,r),this.current=[0,0,0,0];}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.set=function(t){t[0]===this.current[0]&&t[1]===this.current[1]&&t[2]===this.current[2]&&t[3]===this.current[3]||(this.current=t,this.gl.uniform4f(this.location,t[0],t[1],t[2],t[3]));},e}(ka),Ea=function(t){function e(e,r){t.call(this,e,r),this.current=$t.transparent;}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.set=function(t){t.r===this.current.r&&t.g===this.current.g&&t.b===this.current.b&&t.a===this.current.a||(this.current=t,this.gl.uniform4f(this.location,t.r,t.g,t.b,t.a));},e}(ka),Pa=new Float32Array(16),Ba=function(t){function e(e,r){t.call(this,e,r),this.current=Pa;}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.set=function(t){if(t[12]!==this.current[12]||t[0]!==this.current[0])return this.current=t,void this.gl.uniformMatrix4fv(this.location,!1,t);for(var e=1;e<16;e++)if(t[e]!==this.current[e]){this.current=t,this.gl.uniformMatrix4fv(this.location,!1,t);break}},e}(ka);function Va(t){return [ma(255*t.r,255*t.g),ma(255*t.b,255*t.a)]}var Fa=function(t,e,r){this.value=t,this.uniformNames=e.map((function(t){return "u_"+t})),this.type=r;};Fa.prototype.setUniform=function(t,e,r){t.set(r.constantOr(this.value));},Fa.prototype.getBinding=function(t,e,r){return "color"===this.type?new Ea(t,e):new za(t,e)};var Da=function(t,e){this.uniformNames=e.map((function(t){return "u_"+t})),this.patternFrom=null,this.patternTo=null,this.pixelRatioFrom=1,this.pixelRatioTo=1;};Da.prototype.setConstantPatternPositions=function(t,e){this.pixelRatioFrom=e.pixelRatio,this.pixelRatioTo=t.pixelRatio,this.patternFrom=e.tlbr,this.patternTo=t.tlbr;},Da.prototype.setUniform=function(t,e,r,n){var i="u_pattern_to"===n?this.patternTo:"u_pattern_from"===n?this.patternFrom:"u_pixel_ratio_to"===n?this.pixelRatioTo:"u_pixel_ratio_from"===n?this.pixelRatioFrom:null;i&&t.set(i);},Da.prototype.getBinding=function(t,e,r){return "u_pattern"===r.substr(0,9)?new Ta(t,e):new za(t,e)};var La=function(t,e,r,n){this.expression=t,this.type=r,this.maxValue=0,this.paintVertexAttributes=e.map((function(t){return {name:"a_"+t,type:"Float32",components:"color"===r?2:1,offset:0}})),this.paintVertexArray=new n;};La.prototype.populatePaintArray=function(t,e,r,n,i){var a=this.paintVertexArray.length,o=this.expression.evaluate(new mi(0),e,{},n,[],i);this.paintVertexArray.resize(t),this._setPaintValue(a,t,o);},La.prototype.updatePaintArray=function(t,e,r,n){var i=this.expression.evaluate({zoom:0},r,n);this._setPaintValue(t,e,i);},La.prototype._setPaintValue=function(t,e,r){if("color"===this.type)for(var n=Va(r),i=t;i<e;i++)this.paintVertexArray.emplace(i,n[0],n[1]);else{for(var a=t;a<e;a++)this.paintVertexArray.emplace(a,r);this.maxValue=Math.max(this.maxValue,Math.abs(r));}},La.prototype.upload=function(t){this.paintVertexArray&&this.paintVertexArray.arrayBuffer&&(this.paintVertexBuffer&&this.paintVertexBuffer.buffer?this.paintVertexBuffer.updateData(this.paintVertexArray):this.paintVertexBuffer=t.createVertexBuffer(this.paintVertexArray,this.paintVertexAttributes,this.expression.isStateDependent));},La.prototype.destroy=function(){this.paintVertexBuffer&&this.paintVertexBuffer.destroy();};var Ra=function(t,e,r,n,i,a){this.expression=t,this.uniformNames=e.map((function(t){return "u_"+t+"_t"})),this.type=r,this.useIntegerZoom=n,this.zoom=i,this.maxValue=0,this.paintVertexAttributes=e.map((function(t){return {name:"a_"+t,type:"Float32",components:"color"===r?4:2,offset:0}})),this.paintVertexArray=new a;};Ra.prototype.populatePaintArray=function(t,e,r,n,i){var a=this.expression.evaluate(new mi(this.zoom),e,{},n,[],i),o=this.expression.evaluate(new mi(this.zoom+1),e,{},n,[],i),s=this.paintVertexArray.length;this.paintVertexArray.resize(t),this._setPaintValue(s,t,a,o);},Ra.prototype.updatePaintArray=function(t,e,r,n){var i=this.expression.evaluate({zoom:this.zoom},r,n),a=this.expression.evaluate({zoom:this.zoom+1},r,n);this._setPaintValue(t,e,i,a);},Ra.prototype._setPaintValue=function(t,e,r,n){if("color"===this.type)for(var i=Va(r),a=Va(n),o=t;o<e;o++)this.paintVertexArray.emplace(o,i[0],i[1],a[0],a[1]);else{for(var s=t;s<e;s++)this.paintVertexArray.emplace(s,r,n);this.maxValue=Math.max(this.maxValue,Math.abs(r),Math.abs(n));}},Ra.prototype.upload=function(t){this.paintVertexArray&&this.paintVertexArray.arrayBuffer&&(this.paintVertexBuffer&&this.paintVertexBuffer.buffer?this.paintVertexBuffer.updateData(this.paintVertexArray):this.paintVertexBuffer=t.createVertexBuffer(this.paintVertexArray,this.paintVertexAttributes,this.expression.isStateDependent));},Ra.prototype.destroy=function(){this.paintVertexBuffer&&this.paintVertexBuffer.destroy();},Ra.prototype.setUniform=function(t,e){var r=this.useIntegerZoom?Math.floor(e.zoom):e.zoom,n=u(this.expression.interpolationFactor(r,this.zoom,this.zoom+1),0,1);t.set(n);},Ra.prototype.getBinding=function(t,e,r){return new za(t,e)};var Oa=function(t,e,r,n,i,a,o){this.expression=t,this.type=r,this.useIntegerZoom=n,this.zoom=i,this.layerId=o,this.paintVertexAttributes=e.map((function(t){return {name:"a_"+t,type:"Uint16",components:4,offset:0}})),this.zoomInPaintVertexArray=new a,this.zoomOutPaintVertexArray=new a;};Oa.prototype.populatePaintArray=function(t,e,r){var n=this.zoomInPaintVertexArray.length;this.zoomInPaintVertexArray.resize(t),this.zoomOutPaintVertexArray.resize(t),this._setPaintValues(n,t,e.patterns&&e.patterns[this.layerId],r);},Oa.prototype.updatePaintArray=function(t,e,r,n,i){this._setPaintValues(t,e,r.patterns&&r.patterns[this.layerId],i);},Oa.prototype._setPaintValues=function(t,e,r,n){if(n&&r){var i=n[r.min],a=n[r.mid],o=n[r.max];if(i&&a&&o)for(var s=t;s<e;s++)this.zoomInPaintVertexArray.emplace(s,a.tl[0],a.tl[1],a.br[0],a.br[1],i.tl[0],i.tl[1],i.br[0],i.br[1],a.pixelRatio,i.pixelRatio),this.zoomOutPaintVertexArray.emplace(s,a.tl[0],a.tl[1],a.br[0],a.br[1],o.tl[0],o.tl[1],o.br[0],o.br[1],a.pixelRatio,o.pixelRatio);}},Oa.prototype.upload=function(t){this.zoomInPaintVertexArray&&this.zoomInPaintVertexArray.arrayBuffer&&this.zoomOutPaintVertexArray&&this.zoomOutPaintVertexArray.arrayBuffer&&(this.zoomInPaintVertexBuffer=t.createVertexBuffer(this.zoomInPaintVertexArray,this.paintVertexAttributes,this.expression.isStateDependent),this.zoomOutPaintVertexBuffer=t.createVertexBuffer(this.zoomOutPaintVertexArray,this.paintVertexAttributes,this.expression.isStateDependent));},Oa.prototype.destroy=function(){this.zoomOutPaintVertexBuffer&&this.zoomOutPaintVertexBuffer.destroy(),this.zoomInPaintVertexBuffer&&this.zoomInPaintVertexBuffer.destroy();};var Ua=function(t,e,r,n){this.binders={},this.layoutAttributes=n,this._buffers=[];var i=[];for(var a in t.paint._values)if(r(a)){var o=t.paint.get(a);if(o instanceof Ai&&jr(o.property.specification)){var s=qa(a,t.type),u=o.value,l=o.property.specification.type,p=o.property.useIntegerZoom,c=o.property.specification["property-type"],h="cross-faded"===c||"cross-faded-data-driven"===c;if("constant"===u.kind)this.binders[a]=h?new Da(u.value,s):new Fa(u.value,s,l),i.push("/u_"+a);else if("source"===u.kind||h){var f=Na(a,l,"source");this.binders[a]=h?new Oa(u,s,l,p,e,f,t.id):new La(u,s,l,f),i.push("/a_"+a);}else{var y=Na(a,l,"composite");this.binders[a]=new Ra(u,s,l,p,e,y),i.push("/z_"+a);}}}this.cacheKey=i.sort().join("");};Ua.prototype.getMaxValue=function(t){var e=this.binders[t];return e instanceof La||e instanceof Ra?e.maxValue:0},Ua.prototype.populatePaintArrays=function(t,e,r,n,i){for(var a in this.binders){var o=this.binders[a];(o instanceof La||o instanceof Ra||o instanceof Oa)&&o.populatePaintArray(t,e,r,n,i);}},Ua.prototype.setConstantPatternPositions=function(t,e){for(var r in this.binders){var n=this.binders[r];n instanceof Da&&n.setConstantPatternPositions(t,e);}},Ua.prototype.updatePaintArrays=function(t,e,r,n,i){var a=!1;for(var o in t)for(var s=0,u=e.getPositions(o);s<u.length;s+=1){var l=u[s],p=r.feature(l.index);for(var c in this.binders){var h=this.binders[c];if((h instanceof La||h instanceof Ra||h instanceof Oa)&&!0===h.expression.isStateDependent){var f=n.paint.get(c);h.expression=f.value,h.updatePaintArray(l.start,l.end,p,t[o],i),a=!0;}}}return a},Ua.prototype.defines=function(){var t=[];for(var e in this.binders){var r=this.binders[e];(r instanceof Fa||r instanceof Da)&&t.push.apply(t,r.uniformNames.map((function(t){return "#define HAS_UNIFORM_"+t})));}return t},Ua.prototype.getPaintVertexBuffers=function(){return this._buffers},Ua.prototype.getUniforms=function(t,e){var r=[];for(var n in this.binders){var i=this.binders[n];if(i instanceof Fa||i instanceof Da||i instanceof Ra)for(var a=0,o=i.uniformNames;a<o.length;a+=1){var s=o[a];if(e[s]){var u=i.getBinding(t,e[s],s);r.push({name:s,property:n,binding:u});}}}return r},Ua.prototype.setUniforms=function(t,e,r,n){for(var i=0,a=e;i<a.length;i+=1){var o=a[i],s=o.name,u=o.property;this.binders[u].setUniform(o.binding,n,r.get(u),s);}},Ua.prototype.updatePaintBuffers=function(t){for(var e in this._buffers=[],this.binders){var r=this.binders[e];if(t&&r instanceof Oa){var n=2===t.fromScale?r.zoomInPaintVertexBuffer:r.zoomOutPaintVertexBuffer;n&&this._buffers.push(n);}else(r instanceof La||r instanceof Ra)&&r.paintVertexBuffer&&this._buffers.push(r.paintVertexBuffer);}},Ua.prototype.upload=function(t){for(var e in this.binders){var r=this.binders[e];(r instanceof La||r instanceof Ra||r instanceof Oa)&&r.upload(t);}this.updatePaintBuffers();},Ua.prototype.destroy=function(){for(var t in this.binders){var e=this.binders[t];(e instanceof La||e instanceof Ra||e instanceof Oa)&&e.destroy();}};var ja=function(t,e,r,n){void 0===n&&(n=function(){return !0}),this.programConfigurations={};for(var i=0,a=e;i<a.length;i+=1){var o=a[i];this.programConfigurations[o.id]=new Ua(o,r,n,t);}this.needsUpload=!1,this._featureMap=new wa,this._bufferOffset=0;};function qa(t,e){return {"text-opacity":["opacity"],"icon-opacity":["opacity"],"text-color":["fill_color"],"icon-color":["fill_color"],"text-halo-color":["halo_color"],"icon-halo-color":["halo_color"],"text-halo-blur":["halo_blur"],"icon-halo-blur":["halo_blur"],"text-halo-width":["halo_width"],"icon-halo-width":["halo_width"],"line-gap-width":["gapwidth"],"line-pattern":["pattern_to","pattern_from","pixel_ratio_to","pixel_ratio_from"],"fill-pattern":["pattern_to","pattern_from","pixel_ratio_to","pixel_ratio_from"],"fill-extrusion-pattern":["pattern_to","pattern_from","pixel_ratio_to","pixel_ratio_from"]}[t]||[t.replace(e+"-","").replace(/-/g,"_")]}function Na(t,e,r){var n={color:{source:ra,composite:na},number:{source:Yi,composite:ra}},i=function(t){return {"line-pattern":{source:ji,composite:ji},"fill-pattern":{source:ji,composite:ji},"fill-extrusion-pattern":{source:ji,composite:ji}}[t]}(t);return i&&i[r]||n[e][r]}ja.prototype.populatePaintArrays=function(t,e,r,n,i,a){for(var o in this.programConfigurations)this.programConfigurations[o].populatePaintArrays(t,e,n,i,a);void 0!==e.id&&this._featureMap.add(e.id,r,this._bufferOffset,t),this._bufferOffset=t,this.needsUpload=!0;},ja.prototype.updatePaintArrays=function(t,e,r,n){for(var i=0,a=r;i<a.length;i+=1){var o=a[i];this.needsUpload=this.programConfigurations[o.id].updatePaintArrays(t,this._featureMap,e,o,n)||this.needsUpload;}},ja.prototype.get=function(t){return this.programConfigurations[t]},ja.prototype.upload=function(t){if(this.needsUpload){for(var e in this.programConfigurations)this.programConfigurations[e].upload(t);this.needsUpload=!1;}},ja.prototype.destroy=function(){for(var t in this.programConfigurations)this.programConfigurations[t].destroy();},Xn("ConstantBinder",Fa),Xn("CrossFadedConstantBinder",Da),Xn("SourceExpressionBinder",La),Xn("CrossFadedCompositeBinder",Oa),Xn("CompositeExpressionBinder",Ra),Xn("ProgramConfiguration",Ua,{omit:["_buffers"]}),Xn("ProgramConfigurationSet",ja);var Ka={min:-1*Math.pow(2,14),max:Math.pow(2,14)-1};function Ga(t){for(var e=ze/t.extent,r=t.loadGeometry(),n=0;n<r.length;n++)for(var i=r[n],a=0;a<i.length;a++){var o=i[a];o.x=Math.round(o.x*e),o.y=Math.round(o.y*e),(o.x<Ka.min||o.x>Ka.max||o.y<Ka.min||o.y>Ka.max)&&(w("Geometry exceeds allowed extent, reduce your vector tile buffer size"),o.x=u(o.x,Ka.min,Ka.max),o.y=u(o.y,Ka.min,Ka.max));}return r}function Za(t,e,r,n,i){t.emplaceBack(2*e+(n+1)/2,2*r+(i+1)/2);}var Xa=function(t){this.zoom=t.zoom,this.overscaling=t.overscaling,this.layers=t.layers,this.layerIds=this.layers.map((function(t){return t.id})),this.index=t.index,this.hasPattern=!1,this.layoutVertexArray=new Li,this.indexArray=new Qi,this.segments=new da,this.programConfigurations=new ja(ya,t.layers,t.zoom),this.stateDependentLayerIds=this.layers.filter((function(t){return t.isStateDependent()})).map((function(t){return t.id}));};function Ja(t,e){for(var r=0;r<t.length;r++)if(no(e,t[r]))return !0;for(var n=0;n<e.length;n++)if(no(t,e[n]))return !0;return !!Wa(t,e)}function Ha(t,e,r){return !!no(t,e)||!!to(e,t,r)}function Ya(t,e){if(1===t.length)return ro(e,t[0]);for(var r=0;r<e.length;r++)for(var n=e[r],i=0;i<n.length;i++)if(no(t,n[i]))return !0;for(var a=0;a<t.length;a++)if(ro(e,t[a]))return !0;for(var o=0;o<e.length;o++)if(Wa(t,e[o]))return !0;return !1}function $a(t,e,r){if(t.length>1){if(Wa(t,e))return !0;for(var n=0;n<e.length;n++)if(to(e[n],t,r))return !0}for(var i=0;i<t.length;i++)if(to(t[i],e,r))return !0;return !1}function Wa(t,e){if(0===t.length||0===e.length)return !1;for(var r=0;r<t.length-1;r++)for(var n=t[r],i=t[r+1],a=0;a<e.length-1;a++)if(Qa(n,i,e[a],e[a+1]))return !0;return !1}function Qa(t,e,r,n){return _(t,r,n)!==_(e,r,n)&&_(t,e,r)!==_(t,e,n)}function to(t,e,r){var n=r*r;if(1===e.length)return t.distSqr(e[0])<n;for(var i=1;i<e.length;i++)if(eo(t,e[i-1],e[i])<n)return !0;return !1}function eo(t,e,r){var n=e.distSqr(r);if(0===n)return t.distSqr(e);var i=((t.x-e.x)*(r.x-e.x)+(t.y-e.y)*(r.y-e.y))/n;return t.distSqr(i<0?e:i>1?r:r.sub(e)._mult(i)._add(e))}function ro(t,e){for(var r,n,i,a=!1,o=0;o<t.length;o++)for(var s=0,u=(r=t[o]).length-1;s<r.length;u=s++)(n=r[s]).y>e.y!=(i=r[u]).y>e.y&&e.x<(i.x-n.x)*(e.y-n.y)/(i.y-n.y)+n.x&&(a=!a);return a}function no(t,e){for(var r=!1,n=0,i=t.length-1;n<t.length;i=n++){var a=t[n],o=t[i];a.y>e.y!=o.y>e.y&&e.x<(o.x-a.x)*(e.y-a.y)/(o.y-a.y)+a.x&&(r=!r);}return r}function io(t,e,r){var n=r[0],i=r[2];if(t.x<n.x&&e.x<n.x||t.x>i.x&&e.x>i.x||t.y<n.y&&e.y<n.y||t.y>i.y&&e.y>i.y)return !1;var a=_(t,e,r[0]);return a!==_(t,e,r[1])||a!==_(t,e,r[2])||a!==_(t,e,r[3])}function ao(t,e,r){var n=e.paint.get(t).value;return "constant"===n.kind?n.value:r.programConfigurations.get(e.id).getMaxValue(t)}function oo(t){return Math.sqrt(t[0]*t[0]+t[1]*t[1])}function so(t,e,r,n,a){if(!e[0]&&!e[1])return t;var o=i.convert(e)._mult(a);"viewport"===r&&o._rotate(-n);for(var s=[],u=0;u<t.length;u++)s.push(t[u].sub(o));return s}Xa.prototype.populate=function(t,e,r){var n=this.layers[0],i=[],a=null;"circle"===n.type&&(a=n.layout.get("circle-sort-key"));for(var o=0,s=t;o<s.length;o+=1){var u=s[o],l=u.feature,p=u.id,c=u.index,h=u.sourceLayerIndex,f=this.layers[0]._featureFilter.needGeometry,y={type:l.type,id:p,properties:l.properties,geometry:f?Ga(l):[]};if(this.layers[0]._featureFilter.filter(new mi(this.zoom),y,r)){f||(y.geometry=Ga(l));var d=a?a.evaluate(y,{},r):void 0;i.push({id:p,properties:l.properties,type:l.type,sourceLayerIndex:h,index:c,geometry:y.geometry,patterns:{},sortKey:d});}}a&&i.sort((function(t,e){return t.sortKey-e.sortKey}));for(var m=0,v=i;m<v.length;m+=1){var g=v[m],x=g.geometry,b=g.index,w=g.sourceLayerIndex,_=t[b].feature;this.addFeature(g,x,b,r),e.featureIndex.insert(_,x,b,w,this.index);}},Xa.prototype.update=function(t,e,r){this.stateDependentLayers.length&&this.programConfigurations.updatePaintArrays(t,e,this.stateDependentLayers,r);},Xa.prototype.isEmpty=function(){return 0===this.layoutVertexArray.length},Xa.prototype.uploadPending=function(){return !this.uploaded||this.programConfigurations.needsUpload},Xa.prototype.upload=function(t){this.uploaded||(this.layoutVertexBuffer=t.createVertexBuffer(this.layoutVertexArray,ya),this.indexBuffer=t.createIndexBuffer(this.indexArray)),this.programConfigurations.upload(t),this.uploaded=!0;},Xa.prototype.destroy=function(){this.layoutVertexBuffer&&(this.layoutVertexBuffer.destroy(),this.indexBuffer.destroy(),this.programConfigurations.destroy(),this.segments.destroy());},Xa.prototype.addFeature=function(t,e,r,n){for(var i=0,a=e;i<a.length;i+=1)for(var o=0,s=a[i];o<s.length;o+=1){var u=s[o],l=u.x,p=u.y;if(!(l<0||l>=ze||p<0||p>=ze)){var c=this.segments.prepareSegment(4,this.layoutVertexArray,this.indexArray,t.sortKey),h=c.vertexLength;Za(this.layoutVertexArray,l,p,-1,-1),Za(this.layoutVertexArray,l,p,1,-1),Za(this.layoutVertexArray,l,p,1,1),Za(this.layoutVertexArray,l,p,-1,1),this.indexArray.emplaceBack(h,h+1,h+2),this.indexArray.emplaceBack(h,h+3,h+2),c.vertexLength+=4,c.primitiveLength+=2;}}this.programConfigurations.populatePaintArrays(this.layoutVertexArray.length,t,r,{},n);},Xn("CircleBucket",Xa,{omit:["layers"]});var uo,lo=new Ti({"circle-sort-key":new Ii(Ct.layout_circle["circle-sort-key"])}),po={paint:new Ti({"circle-radius":new Ii(Ct.paint_circle["circle-radius"]),"circle-color":new Ii(Ct.paint_circle["circle-color"]),"circle-blur":new Ii(Ct.paint_circle["circle-blur"]),"circle-opacity":new Ii(Ct.paint_circle["circle-opacity"]),"circle-translate":new ki(Ct.paint_circle["circle-translate"]),"circle-translate-anchor":new ki(Ct.paint_circle["circle-translate-anchor"]),"circle-pitch-scale":new ki(Ct.paint_circle["circle-pitch-scale"]),"circle-pitch-alignment":new ki(Ct.paint_circle["circle-pitch-alignment"]),"circle-stroke-width":new Ii(Ct.paint_circle["circle-stroke-width"]),"circle-stroke-color":new Ii(Ct.paint_circle["circle-stroke-color"]),"circle-stroke-opacity":new Ii(Ct.paint_circle["circle-stroke-opacity"])}),layout:lo},co="undefined"!=typeof Float32Array?Float32Array:Array;function ho(t,e,r){var n=e[0],i=e[1],a=e[2],o=e[3];return t[0]=r[0]*n+r[4]*i+r[8]*a+r[12]*o,t[1]=r[1]*n+r[5]*i+r[9]*a+r[13]*o,t[2]=r[2]*n+r[6]*i+r[10]*a+r[14]*o,t[3]=r[3]*n+r[7]*i+r[11]*a+r[15]*o,t}Math.hypot||(Math.hypot=function(){for(var t=arguments,e=0,r=arguments.length;r--;)e+=t[r]*t[r];return Math.sqrt(e)}),uo=new co(3),co!=Float32Array&&(uo[0]=0,uo[1]=0,uo[2]=0),function(){var t=new co(4);co!=Float32Array&&(t[0]=0,t[1]=0,t[2]=0,t[3]=0);}();var fo=(function(){var t=new co(2);co!=Float32Array&&(t[0]=0,t[1]=0);}(),function(t){function e(e){t.call(this,e,po);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.createBucket=function(t){return new Xa(t)},e.prototype.queryRadius=function(t){var e=t;return ao("circle-radius",this,e)+ao("circle-stroke-width",this,e)+oo(this.paint.get("circle-translate"))},e.prototype.queryIntersectsFeature=function(t,e,r,n,i,a,o,s){for(var u=so(t,this.paint.get("circle-translate"),this.paint.get("circle-translate-anchor"),a.angle,o),l=this.paint.get("circle-radius").evaluate(e,r)+this.paint.get("circle-stroke-width").evaluate(e,r),p="map"===this.paint.get("circle-pitch-alignment"),c=p?u:function(t,e){return t.map((function(t){return yo(t,e)}))}(u,s),h=p?l*o:l,f=0,y=n;f<y.length;f+=1)for(var d=0,m=y[f];d<m.length;d+=1){var v=m[d],g=p?v:yo(v,s),x=h,b=ho([],[v.x,v.y,0,1],s);if("viewport"===this.paint.get("circle-pitch-scale")&&"map"===this.paint.get("circle-pitch-alignment")?x*=b[3]/a.cameraToCenterDistance:"map"===this.paint.get("circle-pitch-scale")&&"viewport"===this.paint.get("circle-pitch-alignment")&&(x*=a.cameraToCenterDistance/b[3]),Ha(c,g,x))return !0}return !1},e}(Ei));function yo(t,e){var r=ho([],[t.x,t.y,0,1],e);return new i(r[0]/r[3],r[1]/r[3])}var mo=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(Xa);function vo(t,e,r,n){var i=e.width,a=e.height;if(n){if(n instanceof Uint8ClampedArray)n=new Uint8Array(n.buffer);else if(n.length!==i*a*r)throw new RangeError("mismatched image size")}else n=new Uint8Array(i*a*r);return t.width=i,t.height=a,t.data=n,t}function go(t,e,r){var n=e.width,i=e.height;if(n!==t.width||i!==t.height){var a=vo({},{width:n,height:i},r);xo(t,a,{x:0,y:0},{x:0,y:0},{width:Math.min(t.width,n),height:Math.min(t.height,i)},r),t.width=n,t.height=i,t.data=a.data;}}function xo(t,e,r,n,i,a){if(0===i.width||0===i.height)return e;if(i.width>t.width||i.height>t.height||r.x>t.width-i.width||r.y>t.height-i.height)throw new RangeError("out of range source coordinates for image copy");if(i.width>e.width||i.height>e.height||n.x>e.width-i.width||n.y>e.height-i.height)throw new RangeError("out of range destination coordinates for image copy");for(var o=t.data,s=e.data,u=0;u<i.height;u++)for(var l=((r.y+u)*t.width+r.x)*a,p=((n.y+u)*e.width+n.x)*a,c=0;c<i.width*a;c++)s[p+c]=o[l+c];return e}Xn("HeatmapBucket",mo,{omit:["layers"]});var bo=function(t,e){vo(this,t,1,e);};bo.prototype.resize=function(t){go(this,t,1);},bo.prototype.clone=function(){return new bo({width:this.width,height:this.height},new Uint8Array(this.data))},bo.copy=function(t,e,r,n,i){xo(t,e,r,n,i,1);};var wo=function(t,e){vo(this,t,4,e);};wo.prototype.resize=function(t){go(this,t,4);},wo.prototype.replace=function(t,e){e?this.data.set(t):this.data=t instanceof Uint8ClampedArray?new Uint8Array(t.buffer):t;},wo.prototype.clone=function(){return new wo({width:this.width,height:this.height},new Uint8Array(this.data))},wo.copy=function(t,e,r,n,i){xo(t,e,r,n,i,4);},Xn("AlphaImage",bo),Xn("RGBAImage",wo);var _o={paint:new Ti({"heatmap-radius":new Ii(Ct.paint_heatmap["heatmap-radius"]),"heatmap-weight":new Ii(Ct.paint_heatmap["heatmap-weight"]),"heatmap-intensity":new ki(Ct.paint_heatmap["heatmap-intensity"]),"heatmap-color":new Mi(Ct.paint_heatmap["heatmap-color"]),"heatmap-opacity":new ki(Ct.paint_heatmap["heatmap-opacity"])})};function Ao(t,e){for(var r=new Uint8Array(1024),n={},i=0,a=0;i<256;i++,a+=4){n[e]=i/255;var o=t.evaluate(n);r[a+0]=Math.floor(255*o.r/o.a),r[a+1]=Math.floor(255*o.g/o.a),r[a+2]=Math.floor(255*o.b/o.a),r[a+3]=Math.floor(255*o.a);}return new wo({width:256,height:1},r)}var So=function(t){function e(e){t.call(this,e,_o),this._updateColorRamp();}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.createBucket=function(t){return new mo(t)},e.prototype._handleSpecialPaintPropertyUpdate=function(t){"heatmap-color"===t&&this._updateColorRamp();},e.prototype._updateColorRamp=function(){this.colorRamp=Ao(this._transitionablePaint._values["heatmap-color"].value.expression,"heatmapDensity"),this.colorRampTexture=null;},e.prototype.resize=function(){this.heatmapFbo&&(this.heatmapFbo.destroy(),this.heatmapFbo=null);},e.prototype.queryRadius=function(){return 0},e.prototype.queryIntersectsFeature=function(){return !1},e.prototype.hasOffscreenPass=function(){return 0!==this.paint.get("heatmap-opacity")&&"none"!==this.visibility},e}(Ei),ko={paint:new Ti({"hillshade-illumination-direction":new ki(Ct.paint_hillshade["hillshade-illumination-direction"]),"hillshade-illumination-anchor":new ki(Ct.paint_hillshade["hillshade-illumination-anchor"]),"hillshade-exaggeration":new ki(Ct.paint_hillshade["hillshade-exaggeration"]),"hillshade-shadow-color":new ki(Ct.paint_hillshade["hillshade-shadow-color"]),"hillshade-highlight-color":new ki(Ct.paint_hillshade["hillshade-highlight-color"]),"hillshade-accent-color":new ki(Ct.paint_hillshade["hillshade-accent-color"])})},Io=function(t){function e(e){t.call(this,e,ko);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.hasOffscreenPass=function(){return 0!==this.paint.get("hillshade-exaggeration")&&"none"!==this.visibility},e}(Ei),zo=Fi([{name:"a_pos",components:2,type:"Int16"}],4).members,Co=To,Mo=To;function To(t,e,r){r=r||2;var n,i,a,o,s,u,l,p=e&&e.length,c=p?e[0]*r:t.length,h=Eo(t,0,c,r,!0),f=[];if(!h||h.next===h.prev)return f;if(p&&(h=function(t,e,r,n){var i,a,o,s=[];for(i=0,a=e.length;i<a;i++)(o=Eo(t,e[i]*n,i<a-1?e[i+1]*n:t.length,n,!1))===o.next&&(o.steiner=!0),s.push(qo(o));for(s.sort(Ro),i=0;i<s.length;i++)Oo(s[i],r),r=Po(r,r.next);return r}(t,e,h,r)),t.length>80*r){n=a=t[0],i=o=t[1];for(var y=r;y<c;y+=r)(s=t[y])<n&&(n=s),(u=t[y+1])<i&&(i=u),s>a&&(a=s),u>o&&(o=u);l=0!==(l=Math.max(a-n,o-i))?1/l:0;}return Bo(h,f,r,n,i,l),f}function Eo(t,e,r,n,i){var a,o;if(i===es(t,e,r,n)>0)for(a=e;a<r;a+=n)o=Wo(a,t[a],t[a+1],o);else for(a=r-n;a>=e;a-=n)o=Wo(a,t[a],t[a+1],o);return o&&Zo(o,o.next)&&(Qo(o),o=o.next),o}function Po(t,e){if(!t)return t;e||(e=t);var r,n=t;do{if(r=!1,n.steiner||!Zo(n,n.next)&&0!==Go(n.prev,n,n.next))n=n.next;else{if(Qo(n),(n=e=n.prev)===n.next)break;r=!0;}}while(r||n!==e);return e}function Bo(t,e,r,n,i,a,o){if(t){!o&&a&&function(t,e,r,n){var i=t;do{null===i.z&&(i.z=jo(i.x,i.y,e,r,n)),i.prevZ=i.prev,i.nextZ=i.next,i=i.next;}while(i!==t);i.prevZ.nextZ=null,i.prevZ=null,function(t){var e,r,n,i,a,o,s,u,l=1;do{for(r=t,t=null,a=null,o=0;r;){for(o++,n=r,s=0,e=0;e<l&&(s++,n=n.nextZ);e++);for(u=l;s>0||u>0&&n;)0!==s&&(0===u||!n||r.z<=n.z)?(i=r,r=r.nextZ,s--):(i=n,n=n.nextZ,u--),a?a.nextZ=i:t=i,i.prevZ=a,a=i;r=n;}a.nextZ=null,l*=2;}while(o>1)}(i);}(t,n,i,a);for(var s,u,l=t;t.prev!==t.next;)if(s=t.prev,u=t.next,a?Fo(t,n,i,a):Vo(t))e.push(s.i/r),e.push(t.i/r),e.push(u.i/r),Qo(t),t=u.next,l=u.next;else if((t=u)===l){o?1===o?Bo(t=Do(Po(t),e,r),e,r,n,i,a,2):2===o&&Lo(t,e,r,n,i,a):Bo(Po(t),e,r,n,i,a,1);break}}}function Vo(t){var e=t.prev,r=t,n=t.next;if(Go(e,r,n)>=0)return !1;for(var i=t.next.next;i!==t.prev;){if(No(e.x,e.y,r.x,r.y,n.x,n.y,i.x,i.y)&&Go(i.prev,i,i.next)>=0)return !1;i=i.next;}return !0}function Fo(t,e,r,n){var i=t.prev,a=t,o=t.next;if(Go(i,a,o)>=0)return !1;for(var s=i.x>a.x?i.x>o.x?i.x:o.x:a.x>o.x?a.x:o.x,u=i.y>a.y?i.y>o.y?i.y:o.y:a.y>o.y?a.y:o.y,l=jo(i.x<a.x?i.x<o.x?i.x:o.x:a.x<o.x?a.x:o.x,i.y<a.y?i.y<o.y?i.y:o.y:a.y<o.y?a.y:o.y,e,r,n),p=jo(s,u,e,r,n),c=t.prevZ,h=t.nextZ;c&&c.z>=l&&h&&h.z<=p;){if(c!==t.prev&&c!==t.next&&No(i.x,i.y,a.x,a.y,o.x,o.y,c.x,c.y)&&Go(c.prev,c,c.next)>=0)return !1;if(c=c.prevZ,h!==t.prev&&h!==t.next&&No(i.x,i.y,a.x,a.y,o.x,o.y,h.x,h.y)&&Go(h.prev,h,h.next)>=0)return !1;h=h.nextZ;}for(;c&&c.z>=l;){if(c!==t.prev&&c!==t.next&&No(i.x,i.y,a.x,a.y,o.x,o.y,c.x,c.y)&&Go(c.prev,c,c.next)>=0)return !1;c=c.prevZ;}for(;h&&h.z<=p;){if(h!==t.prev&&h!==t.next&&No(i.x,i.y,a.x,a.y,o.x,o.y,h.x,h.y)&&Go(h.prev,h,h.next)>=0)return !1;h=h.nextZ;}return !0}function Do(t,e,r){var n=t;do{var i=n.prev,a=n.next.next;!Zo(i,a)&&Xo(i,n,n.next,a)&&Yo(i,a)&&Yo(a,i)&&(e.push(i.i/r),e.push(n.i/r),e.push(a.i/r),Qo(n),Qo(n.next),n=t=a),n=n.next;}while(n!==t);return Po(n)}function Lo(t,e,r,n,i,a){var o=t;do{for(var s=o.next.next;s!==o.prev;){if(o.i!==s.i&&Ko(o,s)){var u=$o(o,s);return o=Po(o,o.next),u=Po(u,u.next),Bo(o,e,r,n,i,a),void Bo(u,e,r,n,i,a)}s=s.next;}o=o.next;}while(o!==t)}function Ro(t,e){return t.x-e.x}function Oo(t,e){if(e=function(t,e){var r,n=e,i=t.x,a=t.y,o=-1/0;do{if(a<=n.y&&a>=n.next.y&&n.next.y!==n.y){var s=n.x+(a-n.y)*(n.next.x-n.x)/(n.next.y-n.y);if(s<=i&&s>o){if(o=s,s===i){if(a===n.y)return n;if(a===n.next.y)return n.next}r=n.x<n.next.x?n:n.next;}}n=n.next;}while(n!==e);if(!r)return null;if(i===o)return r;var u,l=r,p=r.x,c=r.y,h=1/0;n=r;do{i>=n.x&&n.x>=p&&i!==n.x&&No(a<c?i:o,a,p,c,a<c?o:i,a,n.x,n.y)&&(u=Math.abs(a-n.y)/(i-n.x),Yo(n,t)&&(u<h||u===h&&(n.x>r.x||n.x===r.x&&Uo(r,n)))&&(r=n,h=u)),n=n.next;}while(n!==l);return r}(t,e)){var r=$o(e,t);Po(e,e.next),Po(r,r.next);}}function Uo(t,e){return Go(t.prev,t,e.prev)<0&&Go(e.next,t,t.next)<0}function jo(t,e,r,n,i){return (t=1431655765&((t=858993459&((t=252645135&((t=16711935&((t=32767*(t-r)*i)|t<<8))|t<<4))|t<<2))|t<<1))|(e=1431655765&((e=858993459&((e=252645135&((e=16711935&((e=32767*(e-n)*i)|e<<8))|e<<4))|e<<2))|e<<1))<<1}function qo(t){var e=t,r=t;do{(e.x<r.x||e.x===r.x&&e.y<r.y)&&(r=e),e=e.next;}while(e!==t);return r}function No(t,e,r,n,i,a,o,s){return (i-o)*(e-s)-(t-o)*(a-s)>=0&&(t-o)*(n-s)-(r-o)*(e-s)>=0&&(r-o)*(a-s)-(i-o)*(n-s)>=0}function Ko(t,e){return t.next.i!==e.i&&t.prev.i!==e.i&&!function(t,e){var r=t;do{if(r.i!==t.i&&r.next.i!==t.i&&r.i!==e.i&&r.next.i!==e.i&&Xo(r,r.next,t,e))return !0;r=r.next;}while(r!==t);return !1}(t,e)&&(Yo(t,e)&&Yo(e,t)&&function(t,e){var r=t,n=!1,i=(t.x+e.x)/2,a=(t.y+e.y)/2;do{r.y>a!=r.next.y>a&&r.next.y!==r.y&&i<(r.next.x-r.x)*(a-r.y)/(r.next.y-r.y)+r.x&&(n=!n),r=r.next;}while(r!==t);return n}(t,e)&&(Go(t.prev,t,e.prev)||Go(t,e.prev,e))||Zo(t,e)&&Go(t.prev,t,t.next)>0&&Go(e.prev,e,e.next)>0)}function Go(t,e,r){return (e.y-t.y)*(r.x-e.x)-(e.x-t.x)*(r.y-e.y)}function Zo(t,e){return t.x===e.x&&t.y===e.y}function Xo(t,e,r,n){var i=Ho(Go(t,e,r)),a=Ho(Go(t,e,n)),o=Ho(Go(r,n,t)),s=Ho(Go(r,n,e));return i!==a&&o!==s||!(0!==i||!Jo(t,r,e))||!(0!==a||!Jo(t,n,e))||!(0!==o||!Jo(r,t,n))||!(0!==s||!Jo(r,e,n))}function Jo(t,e,r){return e.x<=Math.max(t.x,r.x)&&e.x>=Math.min(t.x,r.x)&&e.y<=Math.max(t.y,r.y)&&e.y>=Math.min(t.y,r.y)}function Ho(t){return t>0?1:t<0?-1:0}function Yo(t,e){return Go(t.prev,t,t.next)<0?Go(t,e,t.next)>=0&&Go(t,t.prev,e)>=0:Go(t,e,t.prev)<0||Go(t,t.next,e)<0}function $o(t,e){var r=new ts(t.i,t.x,t.y),n=new ts(e.i,e.x,e.y),i=t.next,a=e.prev;return t.next=e,e.prev=t,r.next=i,i.prev=r,n.next=r,r.prev=n,a.next=n,n.prev=a,n}function Wo(t,e,r,n){var i=new ts(t,e,r);return n?(i.next=n.next,i.prev=n,n.next.prev=i,n.next=i):(i.prev=i,i.next=i),i}function Qo(t){t.next.prev=t.prev,t.prev.next=t.next,t.prevZ&&(t.prevZ.nextZ=t.nextZ),t.nextZ&&(t.nextZ.prevZ=t.prevZ);}function ts(t,e,r){this.i=t,this.x=e,this.y=r,this.prev=null,this.next=null,this.z=null,this.prevZ=null,this.nextZ=null,this.steiner=!1;}function es(t,e,r,n){for(var i=0,a=e,o=r-n;a<r;a+=n)i+=(t[o]-t[a])*(t[a+1]+t[o+1]),o=a;return i}function rs(t,e,r,n,i){!function t(e,r,n,i,a){for(;i>n;){if(i-n>600){var o=i-n+1,s=r-n+1,u=Math.log(o),l=.5*Math.exp(2*u/3),p=.5*Math.sqrt(u*l*(o-l)/o)*(s-o/2<0?-1:1);t(e,r,Math.max(n,Math.floor(r-s*l/o+p)),Math.min(i,Math.floor(r+(o-s)*l/o+p)),a);}var c=e[r],h=n,f=i;for(ns(e,n,r),a(e[i],c)>0&&ns(e,n,i);h<f;){for(ns(e,h,f),h++,f--;a(e[h],c)<0;)h++;for(;a(e[f],c)>0;)f--;}0===a(e[n],c)?ns(e,n,f):ns(e,++f,i),f<=r&&(n=f+1),r<=f&&(i=f-1);}}(t,e,r||0,n||t.length-1,i||is);}function ns(t,e,r){var n=t[e];t[e]=t[r],t[r]=n;}function is(t,e){return t<e?-1:t>e?1:0}function as(t,e){var r=t.length;if(r<=1)return [t];for(var n,i,a=[],o=0;o<r;o++){var s=A(t[o]);0!==s&&(t[o].area=Math.abs(s),void 0===i&&(i=s<0),i===s<0?(n&&a.push(n),n=[t[o]]):n.push(t[o]));}if(n&&a.push(n),e>1)for(var u=0;u<a.length;u++)a[u].length<=e||(rs(a[u],e,1,a[u].length-1,os),a[u]=a[u].slice(0,e));return a}function os(t,e){return e.area-t.area}function ss(t,e,r){for(var n=r.patternDependencies,i=!1,a=0,o=e;a<o.length;a+=1){var s=o[a].paint.get(t+"-pattern");s.isConstant()||(i=!0);var u=s.constantOr(null);u&&(i=!0,n[u.to]=!0,n[u.from]=!0);}return i}function us(t,e,r,n,i){for(var a=i.patternDependencies,o=0,s=e;o<s.length;o+=1){var u=s[o],l=u.paint.get(t+"-pattern").value;if("constant"!==l.kind){var p=l.evaluate({zoom:n-1},r,{},i.availableImages),c=l.evaluate({zoom:n},r,{},i.availableImages),h=l.evaluate({zoom:n+1},r,{},i.availableImages);c=c&&c.name?c.name:c,h=h&&h.name?h.name:h,a[p=p&&p.name?p.name:p]=!0,a[c]=!0,a[h]=!0,r.patterns[u.id]={min:p,mid:c,max:h};}}return r}To.deviation=function(t,e,r,n){var i=e&&e.length,a=Math.abs(es(t,0,i?e[0]*r:t.length,r));if(i)for(var o=0,s=e.length;o<s;o++)a-=Math.abs(es(t,e[o]*r,o<s-1?e[o+1]*r:t.length,r));var u=0;for(o=0;o<n.length;o+=3){var l=n[o]*r,p=n[o+1]*r,c=n[o+2]*r;u+=Math.abs((t[l]-t[c])*(t[p+1]-t[l+1])-(t[l]-t[p])*(t[c+1]-t[l+1]));}return 0===a&&0===u?0:Math.abs((u-a)/a)},To.flatten=function(t){for(var e=t[0][0].length,r={vertices:[],holes:[],dimensions:e},n=0,i=0;i<t.length;i++){for(var a=0;a<t[i].length;a++)for(var o=0;o<e;o++)r.vertices.push(t[i][a][o]);i>0&&r.holes.push(n+=t[i-1].length);}return r},Co.default=Mo;var ls=function(t){this.zoom=t.zoom,this.overscaling=t.overscaling,this.layers=t.layers,this.layerIds=this.layers.map((function(t){return t.id})),this.index=t.index,this.hasPattern=!1,this.patternFeatures=[],this.layoutVertexArray=new Li,this.indexArray=new Qi,this.indexArray2=new ta,this.programConfigurations=new ja(zo,t.layers,t.zoom),this.segments=new da,this.segments2=new da,this.stateDependentLayerIds=this.layers.filter((function(t){return t.isStateDependent()})).map((function(t){return t.id}));};ls.prototype.populate=function(t,e,r){this.hasPattern=ss("fill",this.layers,e);for(var n=this.layers[0].layout.get("fill-sort-key"),i=[],a=0,o=t;a<o.length;a+=1){var s=o[a],u=s.feature,l=s.id,p=s.index,c=s.sourceLayerIndex,h=this.layers[0]._featureFilter.needGeometry,f={type:u.type,id:l,properties:u.properties,geometry:h?Ga(u):[]};if(this.layers[0]._featureFilter.filter(new mi(this.zoom),f,r)){h||(f.geometry=Ga(u));var y=n?n.evaluate(f,{},r,e.availableImages):void 0;i.push({id:l,properties:u.properties,type:u.type,sourceLayerIndex:c,index:p,geometry:f.geometry,patterns:{},sortKey:y});}}n&&i.sort((function(t,e){return t.sortKey-e.sortKey}));for(var d=0,m=i;d<m.length;d+=1){var v=m[d],g=v.geometry,x=v.index,b=v.sourceLayerIndex;if(this.hasPattern){var w=us("fill",this.layers,v,this.zoom,e);this.patternFeatures.push(w);}else this.addFeature(v,g,x,r,{});e.featureIndex.insert(t[x].feature,g,x,b,this.index);}},ls.prototype.update=function(t,e,r){this.stateDependentLayers.length&&this.programConfigurations.updatePaintArrays(t,e,this.stateDependentLayers,r);},ls.prototype.addFeatures=function(t,e,r){for(var n=0,i=this.patternFeatures;n<i.length;n+=1){var a=i[n];this.addFeature(a,a.geometry,a.index,e,r);}},ls.prototype.isEmpty=function(){return 0===this.layoutVertexArray.length},ls.prototype.uploadPending=function(){return !this.uploaded||this.programConfigurations.needsUpload},ls.prototype.upload=function(t){this.uploaded||(this.layoutVertexBuffer=t.createVertexBuffer(this.layoutVertexArray,zo),this.indexBuffer=t.createIndexBuffer(this.indexArray),this.indexBuffer2=t.createIndexBuffer(this.indexArray2)),this.programConfigurations.upload(t),this.uploaded=!0;},ls.prototype.destroy=function(){this.layoutVertexBuffer&&(this.layoutVertexBuffer.destroy(),this.indexBuffer.destroy(),this.indexBuffer2.destroy(),this.programConfigurations.destroy(),this.segments.destroy(),this.segments2.destroy());},ls.prototype.addFeature=function(t,e,r,n,i){for(var a=0,o=as(e,500);a<o.length;a+=1){for(var s=o[a],u=0,l=0,p=s;l<p.length;l+=1)u+=p[l].length;for(var c=this.segments.prepareSegment(u,this.layoutVertexArray,this.indexArray),h=c.vertexLength,f=[],y=[],d=0,m=s;d<m.length;d+=1){var v=m[d];if(0!==v.length){v!==s[0]&&y.push(f.length/2);var g=this.segments2.prepareSegment(v.length,this.layoutVertexArray,this.indexArray2),x=g.vertexLength;this.layoutVertexArray.emplaceBack(v[0].x,v[0].y),this.indexArray2.emplaceBack(x+v.length-1,x),f.push(v[0].x),f.push(v[0].y);for(var b=1;b<v.length;b++)this.layoutVertexArray.emplaceBack(v[b].x,v[b].y),this.indexArray2.emplaceBack(x+b-1,x+b),f.push(v[b].x),f.push(v[b].y);g.vertexLength+=v.length,g.primitiveLength+=v.length;}}for(var w=Co(f,y),_=0;_<w.length;_+=3)this.indexArray.emplaceBack(h+w[_],h+w[_+1],h+w[_+2]);c.vertexLength+=u,c.primitiveLength+=w.length/3;}this.programConfigurations.populatePaintArrays(this.layoutVertexArray.length,t,r,i,n);},Xn("FillBucket",ls,{omit:["layers","patternFeatures"]});var ps=new Ti({"fill-sort-key":new Ii(Ct.layout_fill["fill-sort-key"])}),cs={paint:new Ti({"fill-antialias":new ki(Ct.paint_fill["fill-antialias"]),"fill-opacity":new Ii(Ct.paint_fill["fill-opacity"]),"fill-color":new Ii(Ct.paint_fill["fill-color"]),"fill-outline-color":new Ii(Ct.paint_fill["fill-outline-color"]),"fill-translate":new ki(Ct.paint_fill["fill-translate"]),"fill-translate-anchor":new ki(Ct.paint_fill["fill-translate-anchor"]),"fill-pattern":new zi(Ct.paint_fill["fill-pattern"])}),layout:ps},hs=function(t){function e(e){t.call(this,e,cs);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.recalculate=function(e,r){t.prototype.recalculate.call(this,e,r);var n=this.paint._values["fill-outline-color"];"constant"===n.value.kind&&void 0===n.value.value&&(this.paint._values["fill-outline-color"]=this.paint._values["fill-color"]);},e.prototype.createBucket=function(t){return new ls(t)},e.prototype.queryRadius=function(){return oo(this.paint.get("fill-translate"))},e.prototype.queryIntersectsFeature=function(t,e,r,n,i,a,o){return Ya(so(t,this.paint.get("fill-translate"),this.paint.get("fill-translate-anchor"),a.angle,o),n)},e.prototype.isTileClipped=function(){return !0},e}(Ei),fs=Fi([{name:"a_pos",components:2,type:"Int16"},{name:"a_normal_ed",components:4,type:"Int16"}],4).members,ys=ds;function ds(t,e,r,n,i){this.properties={},this.extent=r,this.type=0,this._pbf=t,this._geometry=-1,this._keys=n,this._values=i,t.readFields(ms,this,e);}function ms(t,e,r){1==t?e.id=r.readVarint():2==t?function(t,e){for(var r=t.readVarint()+t.pos;t.pos<r;){var n=e._keys[t.readVarint()],i=e._values[t.readVarint()];e.properties[n]=i;}}(r,e):3==t?e.type=r.readVarint():4==t&&(e._geometry=r.pos);}function vs(t){for(var e,r,n=0,i=0,a=t.length,o=a-1;i<a;o=i++)n+=((r=t[o]).x-(e=t[i]).x)*(e.y+r.y);return n}ds.types=["Unknown","Point","LineString","Polygon"],ds.prototype.loadGeometry=function(){var t=this._pbf;t.pos=this._geometry;for(var e,r=t.readVarint()+t.pos,n=1,a=0,o=0,s=0,u=[];t.pos<r;){if(a<=0){var l=t.readVarint();n=7&l,a=l>>3;}if(a--,1===n||2===n)o+=t.readSVarint(),s+=t.readSVarint(),1===n&&(e&&u.push(e),e=[]),e.push(new i(o,s));else{if(7!==n)throw new Error("unknown command "+n);e&&e.push(e[0].clone());}}return e&&u.push(e),u},ds.prototype.bbox=function(){var t=this._pbf;t.pos=this._geometry;for(var e=t.readVarint()+t.pos,r=1,n=0,i=0,a=0,o=1/0,s=-1/0,u=1/0,l=-1/0;t.pos<e;){if(n<=0){var p=t.readVarint();r=7&p,n=p>>3;}if(n--,1===r||2===r)(i+=t.readSVarint())<o&&(o=i),i>s&&(s=i),(a+=t.readSVarint())<u&&(u=a),a>l&&(l=a);else if(7!==r)throw new Error("unknown command "+r)}return [o,u,s,l]},ds.prototype.toGeoJSON=function(t,e,r){var n,i,a=this.extent*Math.pow(2,r),o=this.extent*t,s=this.extent*e,u=this.loadGeometry(),l=ds.types[this.type];function p(t){for(var e=0;e<t.length;e++){var r=t[e];t[e]=[360*(r.x+o)/a-180,360/Math.PI*Math.atan(Math.exp((180-360*(r.y+s)/a)*Math.PI/180))-90];}}switch(this.type){case 1:var c=[];for(n=0;n<u.length;n++)c[n]=u[n][0];p(u=c);break;case 2:for(n=0;n<u.length;n++)p(u[n]);break;case 3:for(u=function(t){var e=t.length;if(e<=1)return [t];for(var r,n,i=[],a=0;a<e;a++){var o=vs(t[a]);0!==o&&(void 0===n&&(n=o<0),n===o<0?(r&&i.push(r),r=[t[a]]):r.push(t[a]));}return r&&i.push(r),i}(u),n=0;n<u.length;n++)for(i=0;i<u[n].length;i++)p(u[n][i]);}1===u.length?u=u[0]:l="Multi"+l;var h={type:"Feature",geometry:{type:l,coordinates:u},properties:this.properties};return "id"in this&&(h.id=this.id),h};var gs=xs;function xs(t,e){this.version=1,this.name=null,this.extent=4096,this.length=0,this._pbf=t,this._keys=[],this._values=[],this._features=[],t.readFields(bs,this,e),this.length=this._features.length;}function bs(t,e,r){15===t?e.version=r.readVarint():1===t?e.name=r.readString():5===t?e.extent=r.readVarint():2===t?e._features.push(r.pos):3===t?e._keys.push(r.readString()):4===t&&e._values.push(function(t){for(var e=null,r=t.readVarint()+t.pos;t.pos<r;){var n=t.readVarint()>>3;e=1===n?t.readString():2===n?t.readFloat():3===n?t.readDouble():4===n?t.readVarint64():5===n?t.readVarint():6===n?t.readSVarint():7===n?t.readBoolean():null;}return e}(r));}function ws(t,e,r){if(3===t){var n=new gs(r,r.readVarint()+r.pos);n.length&&(e[n.name]=n);}}xs.prototype.feature=function(t){if(t<0||t>=this._features.length)throw new Error("feature index out of bounds");this._pbf.pos=this._features[t];var e=this._pbf.readVarint()+this._pbf.pos;return new ys(this._pbf,e,this.extent,this._keys,this._values)};var _s={VectorTile:function(t,e){this.layers=t.readFields(ws,{},e);},VectorTileFeature:ys,VectorTileLayer:gs},As=_s.VectorTileFeature.types,Ss=Math.pow(2,13);function ks(t,e,r,n,i,a,o,s){t.emplaceBack(e,r,2*Math.floor(n*Ss)+o,i*Ss*2,a*Ss*2,Math.round(s));}var Is=function(t){this.zoom=t.zoom,this.overscaling=t.overscaling,this.layers=t.layers,this.layerIds=this.layers.map((function(t){return t.id})),this.index=t.index,this.hasPattern=!1,this.layoutVertexArray=new Oi,this.indexArray=new Qi,this.programConfigurations=new ja(fs,t.layers,t.zoom),this.segments=new da,this.stateDependentLayerIds=this.layers.filter((function(t){return t.isStateDependent()})).map((function(t){return t.id}));};function zs(t,e){return t.x===e.x&&(t.x<0||t.x>ze)||t.y===e.y&&(t.y<0||t.y>ze)}Is.prototype.populate=function(t,e,r){this.features=[],this.hasPattern=ss("fill-extrusion",this.layers,e);for(var n=0,i=t;n<i.length;n+=1){var a=i[n],o=a.feature,s=a.id,u=a.index,l=a.sourceLayerIndex,p=this.layers[0]._featureFilter.needGeometry,c={type:o.type,id:s,properties:o.properties,geometry:p?Ga(o):[]};if(this.layers[0]._featureFilter.filter(new mi(this.zoom),c,r)){var h={id:s,sourceLayerIndex:l,index:u,geometry:p?c.geometry:Ga(o),properties:o.properties,type:o.type,patterns:{}};void 0!==o.id&&(h.id=o.id),this.hasPattern?this.features.push(us("fill-extrusion",this.layers,h,this.zoom,e)):this.addFeature(h,h.geometry,u,r,{}),e.featureIndex.insert(o,h.geometry,u,l,this.index,!0);}}},Is.prototype.addFeatures=function(t,e,r){for(var n=0,i=this.features;n<i.length;n+=1){var a=i[n];this.addFeature(a,a.geometry,a.index,e,r);}},Is.prototype.update=function(t,e,r){this.stateDependentLayers.length&&this.programConfigurations.updatePaintArrays(t,e,this.stateDependentLayers,r);},Is.prototype.isEmpty=function(){return 0===this.layoutVertexArray.length},Is.prototype.uploadPending=function(){return !this.uploaded||this.programConfigurations.needsUpload},Is.prototype.upload=function(t){this.uploaded||(this.layoutVertexBuffer=t.createVertexBuffer(this.layoutVertexArray,fs),this.indexBuffer=t.createIndexBuffer(this.indexArray)),this.programConfigurations.upload(t),this.uploaded=!0;},Is.prototype.destroy=function(){this.layoutVertexBuffer&&(this.layoutVertexBuffer.destroy(),this.indexBuffer.destroy(),this.programConfigurations.destroy(),this.segments.destroy());},Is.prototype.addFeature=function(t,e,r,n,i){for(var a=0,o=as(e,500);a<o.length;a+=1){for(var s=o[a],u=0,l=0,p=s;l<p.length;l+=1)u+=p[l].length;for(var c=this.segments.prepareSegment(4,this.layoutVertexArray,this.indexArray),h=0,f=s;h<f.length;h+=1){var y=f[h];if(0!==y.length&&!((P=y).every((function(t){return t.x<0}))||P.every((function(t){return t.x>ze}))||P.every((function(t){return t.y<0}))||P.every((function(t){return t.y>ze}))))for(var d=0,m=0;m<y.length;m++){var v=y[m];if(m>=1){var g=y[m-1];if(!zs(v,g)){c.vertexLength+4>da.MAX_VERTEX_ARRAY_LENGTH&&(c=this.segments.prepareSegment(4,this.layoutVertexArray,this.indexArray));var x=v.sub(g)._perp()._unit(),b=g.dist(v);d+b>32768&&(d=0),ks(this.layoutVertexArray,v.x,v.y,x.x,x.y,0,0,d),ks(this.layoutVertexArray,v.x,v.y,x.x,x.y,0,1,d),ks(this.layoutVertexArray,g.x,g.y,x.x,x.y,0,0,d+=b),ks(this.layoutVertexArray,g.x,g.y,x.x,x.y,0,1,d);var w=c.vertexLength;this.indexArray.emplaceBack(w,w+2,w+1),this.indexArray.emplaceBack(w+1,w+2,w+3),c.vertexLength+=4,c.primitiveLength+=2;}}}}if(c.vertexLength+u>da.MAX_VERTEX_ARRAY_LENGTH&&(c=this.segments.prepareSegment(u,this.layoutVertexArray,this.indexArray)),"Polygon"===As[t.type]){for(var _=[],A=[],S=c.vertexLength,k=0,I=s;k<I.length;k+=1){var z=I[k];if(0!==z.length){z!==s[0]&&A.push(_.length/2);for(var C=0;C<z.length;C++){var M=z[C];ks(this.layoutVertexArray,M.x,M.y,0,0,1,1,0),_.push(M.x),_.push(M.y);}}}for(var T=Co(_,A),E=0;E<T.length;E+=3)this.indexArray.emplaceBack(S+T[E],S+T[E+2],S+T[E+1]);c.primitiveLength+=T.length/3,c.vertexLength+=u;}}var P;this.programConfigurations.populatePaintArrays(this.layoutVertexArray.length,t,r,i,n);},Xn("FillExtrusionBucket",Is,{omit:["layers","features"]});var Cs={paint:new Ti({"fill-extrusion-opacity":new ki(Ct["paint_fill-extrusion"]["fill-extrusion-opacity"]),"fill-extrusion-color":new Ii(Ct["paint_fill-extrusion"]["fill-extrusion-color"]),"fill-extrusion-translate":new ki(Ct["paint_fill-extrusion"]["fill-extrusion-translate"]),"fill-extrusion-translate-anchor":new ki(Ct["paint_fill-extrusion"]["fill-extrusion-translate-anchor"]),"fill-extrusion-pattern":new zi(Ct["paint_fill-extrusion"]["fill-extrusion-pattern"]),"fill-extrusion-height":new Ii(Ct["paint_fill-extrusion"]["fill-extrusion-height"]),"fill-extrusion-base":new Ii(Ct["paint_fill-extrusion"]["fill-extrusion-base"]),"fill-extrusion-vertical-gradient":new ki(Ct["paint_fill-extrusion"]["fill-extrusion-vertical-gradient"])})},Ms=function(t){function e(e){t.call(this,e,Cs);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.createBucket=function(t){return new Is(t)},e.prototype.queryRadius=function(){return oo(this.paint.get("fill-extrusion-translate"))},e.prototype.is3D=function(){return !0},e.prototype.queryIntersectsFeature=function(t,e,r,n,a,o,s,u){var l=so(t,this.paint.get("fill-extrusion-translate"),this.paint.get("fill-extrusion-translate-anchor"),o.angle,s),p=this.paint.get("fill-extrusion-height").evaluate(e,r),c=this.paint.get("fill-extrusion-base").evaluate(e,r),h=function(t,e,r,n){for(var a=[],o=0,s=t;o<s.length;o+=1){var u=s[o],l=[u.x,u.y,0,1];ho(l,l,e),a.push(new i(l[0]/l[3],l[1]/l[3]));}return a}(l,u),f=function(t,e,r,n){for(var a=[],o=[],s=n[8]*e,u=n[9]*e,l=n[10]*e,p=n[11]*e,c=n[8]*r,h=n[9]*r,f=n[10]*r,y=n[11]*r,d=0,m=t;d<m.length;d+=1){for(var v=[],g=[],x=0,b=m[d];x<b.length;x+=1){var w=b[x],_=w.x,A=w.y,S=n[0]*_+n[4]*A+n[12],k=n[1]*_+n[5]*A+n[13],I=n[2]*_+n[6]*A+n[14],z=n[3]*_+n[7]*A+n[15],C=I+l,M=z+p,T=S+c,E=k+h,P=I+f,B=z+y,V=new i((S+s)/M,(k+u)/M);V.z=C/M,v.push(V);var F=new i(T/B,E/B);F.z=P/B,g.push(F);}a.push(v),o.push(g);}return [a,o]}(n,c,p,u);return function(t,e,r){var n=1/0;Ya(r,e)&&(n=Es(r,e[0]));for(var i=0;i<e.length;i++)for(var a=e[i],o=t[i],s=0;s<a.length-1;s++){var u=a[s],l=[u,a[s+1],o[s+1],o[s],u];Ja(r,l)&&(n=Math.min(n,Es(r,l)));}return n!==1/0&&n}(f[0],f[1],h)},e}(Ei);function Ts(t,e){return t.x*e.x+t.y*e.y}function Es(t,e){if(1===t.length){for(var r,n,i=0,a=e[i++];!r||a.equals(r);)if(!(r=e[i++]))return 1/0;for(;!n||a.equals(n)||r.equals(n);)if(!(n=e[i++]))return 1/0;var o=t[0],s=r.sub(a),u=n.sub(a),l=o.sub(a),p=Ts(s,s),c=Ts(s,u),h=Ts(u,u),f=Ts(l,s),y=Ts(l,u),d=p*h-c*c,m=(h*f-c*y)/d,v=(p*y-c*f)/d;return a.z*(1-m-v)+r.z*m+n.z*v}for(var g=1/0,x=0,b=e;x<b.length;x+=1)g=Math.min(g,b[x].z);return g}var Ps=Fi([{name:"a_pos_normal",components:2,type:"Int16"},{name:"a_data",components:4,type:"Uint8"}],4).members,Bs=_s.VectorTileFeature.types,Vs=Math.cos(Math.PI/180*37.5),Fs=Math.pow(2,14)/.5,Ds=function(t){this.zoom=t.zoom,this.overscaling=t.overscaling,this.layers=t.layers,this.layerIds=this.layers.map((function(t){return t.id})),this.index=t.index,this.hasPattern=!1,this.patternFeatures=[],this.layoutVertexArray=new Ui,this.indexArray=new Qi,this.programConfigurations=new ja(Ps,t.layers,t.zoom),this.segments=new da,this.stateDependentLayerIds=this.layers.filter((function(t){return t.isStateDependent()})).map((function(t){return t.id}));};Ds.prototype.populate=function(t,e,r){this.hasPattern=ss("line",this.layers,e);for(var n=this.layers[0].layout.get("line-sort-key"),i=[],a=0,o=t;a<o.length;a+=1){var s=o[a],u=s.feature,l=s.id,p=s.index,c=s.sourceLayerIndex,h=this.layers[0]._featureFilter.needGeometry,f={type:u.type,id:l,properties:u.properties,geometry:h?Ga(u):[]};if(this.layers[0]._featureFilter.filter(new mi(this.zoom),f,r)){h||(f.geometry=Ga(u));var y=n?n.evaluate(f,{},r):void 0;i.push({id:l,properties:u.properties,type:u.type,sourceLayerIndex:c,index:p,geometry:f.geometry,patterns:{},sortKey:y});}}n&&i.sort((function(t,e){return t.sortKey-e.sortKey}));for(var d=0,m=i;d<m.length;d+=1){var v=m[d],g=v.geometry,x=v.index,b=v.sourceLayerIndex;if(this.hasPattern){var w=us("line",this.layers,v,this.zoom,e);this.patternFeatures.push(w);}else this.addFeature(v,g,x,r,{});e.featureIndex.insert(t[x].feature,g,x,b,this.index);}},Ds.prototype.update=function(t,e,r){this.stateDependentLayers.length&&this.programConfigurations.updatePaintArrays(t,e,this.stateDependentLayers,r);},Ds.prototype.addFeatures=function(t,e,r){for(var n=0,i=this.patternFeatures;n<i.length;n+=1){var a=i[n];this.addFeature(a,a.geometry,a.index,e,r);}},Ds.prototype.isEmpty=function(){return 0===this.layoutVertexArray.length},Ds.prototype.uploadPending=function(){return !this.uploaded||this.programConfigurations.needsUpload},Ds.prototype.upload=function(t){this.uploaded||(this.layoutVertexBuffer=t.createVertexBuffer(this.layoutVertexArray,Ps),this.indexBuffer=t.createIndexBuffer(this.indexArray)),this.programConfigurations.upload(t),this.uploaded=!0;},Ds.prototype.destroy=function(){this.layoutVertexBuffer&&(this.layoutVertexBuffer.destroy(),this.indexBuffer.destroy(),this.programConfigurations.destroy(),this.segments.destroy());},Ds.prototype.addFeature=function(t,e,r,n,i){for(var a=this.layers[0].layout,o=a.get("line-join").evaluate(t,{}),s=a.get("line-cap"),u=a.get("line-miter-limit"),l=a.get("line-round-limit"),p=0,c=e;p<c.length;p+=1)this.addLine(c[p],t,o,s,u,l,r,n,i);},Ds.prototype.addLine=function(t,e,r,n,i,a,o,s,u){if(this.distance=0,this.scaledDistance=0,this.totalDistance=0,e.properties&&e.properties.hasOwnProperty("mapbox_clip_start")&&e.properties.hasOwnProperty("mapbox_clip_end")){this.clipStart=+e.properties.mapbox_clip_start,this.clipEnd=+e.properties.mapbox_clip_end;for(var l=0;l<t.length-1;l++)this.totalDistance+=t[l].dist(t[l+1]);this.updateScaledDistance();}for(var p="Polygon"===Bs[e.type],c=t.length;c>=2&&t[c-1].equals(t[c-2]);)c--;for(var h=0;h<c-1&&t[h].equals(t[h+1]);)h++;if(!(c<(p?3:2))){"bevel"===r&&(i=1.05);var f,y=this.overscaling<=16?15*ze/(512*this.overscaling):0,d=this.segments.prepareSegment(10*c,this.layoutVertexArray,this.indexArray),m=void 0,v=void 0,g=void 0,x=void 0;this.e1=this.e2=-1,p&&(x=t[h].sub(f=t[c-2])._unit()._perp());for(var b=h;b<c;b++)if(!(v=b===c-1?p?t[h+1]:void 0:t[b+1])||!t[b].equals(v)){x&&(g=x),f&&(m=f),f=t[b],x=v?v.sub(f)._unit()._perp():g;var w=(g=g||x).add(x);0===w.x&&0===w.y||w._unit();var _=g.x*x.x+g.y*x.y,A=w.x*x.x+w.y*x.y,S=0!==A?1/A:1/0,k=2*Math.sqrt(2-2*A),I=A<Vs&&m&&v,z=g.x*x.y-g.y*x.x>0;if(I&&b>h){var C=f.dist(m);if(C>2*y){var M=f.sub(f.sub(m)._mult(y/C)._round());this.updateDistance(m,M),this.addCurrentVertex(M,g,0,0,d),m=M;}}var T=m&&v,E=T?r:p?"butt":n;if(T&&"round"===E&&(S<a?E="miter":S<=2&&(E="fakeround")),"miter"===E&&S>i&&(E="bevel"),"bevel"===E&&(S>2&&(E="flipbevel"),S<i&&(E="miter")),m&&this.updateDistance(m,f),"miter"===E)w._mult(S),this.addCurrentVertex(f,w,0,0,d);else if("flipbevel"===E){if(S>100)w=x.mult(-1);else{var P=S*g.add(x).mag()/g.sub(x).mag();w._perp()._mult(P*(z?-1:1));}this.addCurrentVertex(f,w,0,0,d),this.addCurrentVertex(f,w.mult(-1),0,0,d);}else if("bevel"===E||"fakeround"===E){var B=-Math.sqrt(S*S-1),V=z?B:0,F=z?0:B;if(m&&this.addCurrentVertex(f,g,V,F,d),"fakeround"===E)for(var D=Math.round(180*k/Math.PI/20),L=1;L<D;L++){var R=L/D;if(.5!==R){var O=R-.5;R+=R*O*(R-1)*((1.0904+_*(_*(3.55645-1.43519*_)-3.2452))*O*O+(.848013+_*(.215638*_-1.06021)));}var U=x.sub(g)._mult(R)._add(g)._unit()._mult(z?-1:1);this.addHalfVertex(f,U.x,U.y,!1,z,0,d);}v&&this.addCurrentVertex(f,x,-V,-F,d);}else if("butt"===E)this.addCurrentVertex(f,w,0,0,d);else if("square"===E){var j=m?1:-1;this.addCurrentVertex(f,w,j,j,d);}else"round"===E&&(m&&(this.addCurrentVertex(f,g,0,0,d),this.addCurrentVertex(f,g,1,1,d,!0)),v&&(this.addCurrentVertex(f,x,-1,-1,d,!0),this.addCurrentVertex(f,x,0,0,d)));if(I&&b<c-1){var q=f.dist(v);if(q>2*y){var N=f.add(v.sub(f)._mult(y/q)._round());this.updateDistance(f,N),this.addCurrentVertex(N,x,0,0,d),f=N;}}}this.programConfigurations.populatePaintArrays(this.layoutVertexArray.length,e,o,u,s);}},Ds.prototype.addCurrentVertex=function(t,e,r,n,i,a){void 0===a&&(a=!1);var o=e.y*n-e.x,s=-e.y-e.x*n;this.addHalfVertex(t,e.x+e.y*r,e.y-e.x*r,a,!1,r,i),this.addHalfVertex(t,o,s,a,!0,-n,i),this.distance>Fs/2&&0===this.totalDistance&&(this.distance=0,this.addCurrentVertex(t,e,r,n,i,a));},Ds.prototype.addHalfVertex=function(t,e,r,n,i,a,o){var s=.5*this.scaledDistance;this.layoutVertexArray.emplaceBack((t.x<<1)+(n?1:0),(t.y<<1)+(i?1:0),Math.round(63*e)+128,Math.round(63*r)+128,1+(0===a?0:a<0?-1:1)|(63&s)<<2,s>>6);var u=o.vertexLength++;this.e1>=0&&this.e2>=0&&(this.indexArray.emplaceBack(this.e1,this.e2,u),o.primitiveLength++),i?this.e2=u:this.e1=u;},Ds.prototype.updateScaledDistance=function(){this.scaledDistance=this.totalDistance>0?(this.clipStart+(this.clipEnd-this.clipStart)*this.distance/this.totalDistance)*(Fs-1):this.distance;},Ds.prototype.updateDistance=function(t,e){this.distance+=t.dist(e),this.updateScaledDistance();},Xn("LineBucket",Ds,{omit:["layers","patternFeatures"]});var Ls=new Ti({"line-cap":new ki(Ct.layout_line["line-cap"]),"line-join":new Ii(Ct.layout_line["line-join"]),"line-miter-limit":new ki(Ct.layout_line["line-miter-limit"]),"line-round-limit":new ki(Ct.layout_line["line-round-limit"]),"line-sort-key":new Ii(Ct.layout_line["line-sort-key"])}),Rs={paint:new Ti({"line-opacity":new Ii(Ct.paint_line["line-opacity"]),"line-color":new Ii(Ct.paint_line["line-color"]),"line-translate":new ki(Ct.paint_line["line-translate"]),"line-translate-anchor":new ki(Ct.paint_line["line-translate-anchor"]),"line-width":new Ii(Ct.paint_line["line-width"]),"line-gap-width":new Ii(Ct.paint_line["line-gap-width"]),"line-offset":new Ii(Ct.paint_line["line-offset"]),"line-blur":new Ii(Ct.paint_line["line-blur"]),"line-dasharray":new Ci(Ct.paint_line["line-dasharray"]),"line-pattern":new zi(Ct.paint_line["line-pattern"]),"line-gradient":new Mi(Ct.paint_line["line-gradient"])}),layout:Ls},Os=new(function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.possiblyEvaluate=function(e,r){return r=new mi(Math.floor(r.zoom),{now:r.now,fadeDuration:r.fadeDuration,zoomHistory:r.zoomHistory,transition:r.transition}),t.prototype.possiblyEvaluate.call(this,e,r)},e.prototype.evaluate=function(e,r,n,i){return r=p({},r,{zoom:Math.floor(r.zoom)}),t.prototype.evaluate.call(this,e,r,n,i)},e}(Ii))(Rs.paint.properties["line-width"].specification);Os.useIntegerZoom=!0;var Us=function(t){function e(e){t.call(this,e,Rs);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype._handleSpecialPaintPropertyUpdate=function(t){"line-gradient"===t&&this._updateGradient();},e.prototype._updateGradient=function(){this.gradient=Ao(this._transitionablePaint._values["line-gradient"].value.expression,"lineProgress"),this.gradientTexture=null;},e.prototype.recalculate=function(e,r){t.prototype.recalculate.call(this,e,r),this.paint._values["line-floorwidth"]=Os.possiblyEvaluate(this._transitioningPaint._values["line-width"].value,e);},e.prototype.createBucket=function(t){return new Ds(t)},e.prototype.queryRadius=function(t){var e=t,r=js(ao("line-width",this,e),ao("line-gap-width",this,e)),n=ao("line-offset",this,e);return r/2+Math.abs(n)+oo(this.paint.get("line-translate"))},e.prototype.queryIntersectsFeature=function(t,e,r,n,a,o,s){var u=so(t,this.paint.get("line-translate"),this.paint.get("line-translate-anchor"),o.angle,s),l=s/2*js(this.paint.get("line-width").evaluate(e,r),this.paint.get("line-gap-width").evaluate(e,r)),p=this.paint.get("line-offset").evaluate(e,r);return p&&(n=function(t,e){for(var r=[],n=new i(0,0),a=0;a<t.length;a++){for(var o=t[a],s=[],u=0;u<o.length;u++){var l=o[u],p=o[u+1],c=0===u?n:l.sub(o[u-1])._unit()._perp(),h=u===o.length-1?n:p.sub(l)._unit()._perp(),f=c._add(h)._unit();f._mult(1/(f.x*h.x+f.y*h.y)),s.push(f._mult(e)._add(l));}r.push(s);}return r}(n,p*s)),function(t,e,r){for(var n=0;n<e.length;n++){var i=e[n];if(t.length>=3)for(var a=0;a<i.length;a++)if(no(t,i[a]))return !0;if($a(t,i,r))return !0}return !1}(u,n,l)},e.prototype.isTileClipped=function(){return !0},e}(Ei);function js(t,e){return e>0?e+2*t:t}var qs=Fi([{name:"a_pos_offset",components:4,type:"Int16"},{name:"a_data",components:4,type:"Uint16"},{name:"a_pixeloffset",components:4,type:"Int16"}],4),Ns=Fi([{name:"a_projected_pos",components:3,type:"Float32"}],4),Ks=(Fi([{name:"a_fade_opacity",components:1,type:"Uint32"}],4),Fi([{name:"a_placed",components:2,type:"Uint8"},{name:"a_shift",components:2,type:"Float32"}])),Gs=(Fi([{type:"Int16",name:"anchorPointX"},{type:"Int16",name:"anchorPointY"},{type:"Int16",name:"x1"},{type:"Int16",name:"y1"},{type:"Int16",name:"x2"},{type:"Int16",name:"y2"},{type:"Uint32",name:"featureIndex"},{type:"Uint16",name:"sourceLayerIndex"},{type:"Uint16",name:"bucketIndex"},{type:"Int16",name:"radius"},{type:"Int16",name:"signedDistanceFromAnchor"}]),Fi([{name:"a_pos",components:2,type:"Int16"},{name:"a_anchor_pos",components:2,type:"Int16"},{name:"a_extrude",components:2,type:"Int16"}],4)),Zs=Fi([{name:"a_pos",components:2,type:"Int16"},{name:"a_anchor_pos",components:2,type:"Int16"},{name:"a_extrude",components:2,type:"Int16"}],4);function Xs(t,e,r){return t.sections.forEach((function(t){t.text=function(t,e,r){var n=e.layout.get("text-transform").evaluate(r,{});return "uppercase"===n?t=t.toLocaleUpperCase():"lowercase"===n&&(t=t.toLocaleLowerCase()),di.applyArabicShaping&&(t=di.applyArabicShaping(t)),t}(t.text,e,r);})),t}Fi([{type:"Int16",name:"anchorX"},{type:"Int16",name:"anchorY"},{type:"Uint16",name:"glyphStartIndex"},{type:"Uint16",name:"numGlyphs"},{type:"Uint32",name:"vertexStartIndex"},{type:"Uint32",name:"lineStartIndex"},{type:"Uint32",name:"lineLength"},{type:"Uint16",name:"segment"},{type:"Uint16",name:"lowerSize"},{type:"Uint16",name:"upperSize"},{type:"Float32",name:"lineOffsetX"},{type:"Float32",name:"lineOffsetY"},{type:"Uint8",name:"writingMode"},{type:"Uint8",name:"placedOrientation"},{type:"Uint8",name:"hidden"},{type:"Uint32",name:"crossTileID"},{type:"Int16",name:"associatedIconIndex"}]),Fi([{type:"Int16",name:"anchorX"},{type:"Int16",name:"anchorY"},{type:"Int16",name:"rightJustifiedTextSymbolIndex"},{type:"Int16",name:"centerJustifiedTextSymbolIndex"},{type:"Int16",name:"leftJustifiedTextSymbolIndex"},{type:"Int16",name:"verticalPlacedTextSymbolIndex"},{type:"Int16",name:"placedIconSymbolIndex"},{type:"Int16",name:"verticalPlacedIconSymbolIndex"},{type:"Uint16",name:"key"},{type:"Uint16",name:"textBoxStartIndex"},{type:"Uint16",name:"textBoxEndIndex"},{type:"Uint16",name:"verticalTextBoxStartIndex"},{type:"Uint16",name:"verticalTextBoxEndIndex"},{type:"Uint16",name:"iconBoxStartIndex"},{type:"Uint16",name:"iconBoxEndIndex"},{type:"Uint16",name:"verticalIconBoxStartIndex"},{type:"Uint16",name:"verticalIconBoxEndIndex"},{type:"Uint16",name:"featureIndex"},{type:"Uint16",name:"numHorizontalGlyphVertices"},{type:"Uint16",name:"numVerticalGlyphVertices"},{type:"Uint16",name:"numIconVertices"},{type:"Uint16",name:"numVerticalIconVertices"},{type:"Uint32",name:"crossTileID"},{type:"Float32",name:"textBoxScale"},{type:"Float32",components:2,name:"textOffset"}]),Fi([{type:"Float32",name:"offsetX"}]),Fi([{type:"Int16",name:"x"},{type:"Int16",name:"y"},{type:"Int16",name:"tileUnitDistanceFromAnchor"}]);var Js={"!":"︕","#":"＃",$:"＄","%":"％","&":"＆","(":"︵",")":"︶","*":"＊","+":"＋",",":"︐","-":"︲",".":"・","/":"／",":":"︓",";":"︔","<":"︿","=":"＝",">":"﹀","?":"︖","@":"＠","[":"﹇","\\":"＼","]":"﹈","^":"＾",_:"︳","`":"｀","{":"︷","|":"―","}":"︸","~":"～","¢":"￠","£":"￡","¥":"￥","¦":"￤","¬":"￢","¯":"￣","–":"︲","—":"︱","‘":"﹃","’":"﹄","“":"﹁","”":"﹂","…":"︙","‧":"・","₩":"￦","、":"︑","。":"︒","〈":"︿","〉":"﹀","《":"︽","》":"︾","「":"﹁","」":"﹂","『":"﹃","』":"﹄","【":"︻","】":"︼","〔":"︹","〕":"︺","〖":"︗","〗":"︘","！":"︕","（":"︵","）":"︶","，":"︐","－":"︲","．":"・","：":"︓","；":"︔","＜":"︿","＞":"﹀","？":"︖","［":"﹇","］":"﹈","＿":"︳","｛":"︷","｜":"―","｝":"︸","｟":"︵","｠":"︶","｡":"︒","｢":"﹁","｣":"﹂"},Hs=24,Ys=function(t,e,r,n,i){var a,o,s=8*i-n-1,u=(1<<s)-1,l=u>>1,p=-7,c=r?i-1:0,h=r?-1:1,f=t[e+c];for(c+=h,a=f&(1<<-p)-1,f>>=-p,p+=s;p>0;a=256*a+t[e+c],c+=h,p-=8);for(o=a&(1<<-p)-1,a>>=-p,p+=n;p>0;o=256*o+t[e+c],c+=h,p-=8);if(0===a)a=1-l;else{if(a===u)return o?NaN:1/0*(f?-1:1);o+=Math.pow(2,n),a-=l;}return (f?-1:1)*o*Math.pow(2,a-n)},$s=function(t,e,r,n,i,a){var o,s,u,l=8*a-i-1,p=(1<<l)-1,c=p>>1,h=23===i?Math.pow(2,-24)-Math.pow(2,-77):0,f=n?0:a-1,y=n?1:-1,d=e<0||0===e&&1/e<0?1:0;for(e=Math.abs(e),isNaN(e)||e===1/0?(s=isNaN(e)?1:0,o=p):(o=Math.floor(Math.log(e)/Math.LN2),e*(u=Math.pow(2,-o))<1&&(o--,u*=2),(e+=o+c>=1?h/u:h*Math.pow(2,1-c))*u>=2&&(o++,u/=2),o+c>=p?(s=0,o=p):o+c>=1?(s=(e*u-1)*Math.pow(2,i),o+=c):(s=e*Math.pow(2,c-1)*Math.pow(2,i),o=0));i>=8;t[r+f]=255&s,f+=y,s/=256,i-=8);for(o=o<<i|s,l+=i;l>0;t[r+f]=255&o,f+=y,o/=256,l-=8);t[r+f-y]|=128*d;},Ws=Qs;function Qs(t){this.buf=ArrayBuffer.isView&&ArrayBuffer.isView(t)?t:new Uint8Array(t||0),this.pos=0,this.type=0,this.length=this.buf.length;}Qs.Varint=0,Qs.Fixed64=1,Qs.Bytes=2,Qs.Fixed32=5;var tu="undefined"==typeof TextDecoder?null:new TextDecoder("utf8");function eu(t){return t.type===Qs.Bytes?t.readVarint()+t.pos:t.pos+1}function ru(t,e,r){return r?4294967296*e+(t>>>0):4294967296*(e>>>0)+(t>>>0)}function nu(t,e,r){var n=e<=16383?1:e<=2097151?2:e<=268435455?3:Math.floor(Math.log(e)/(7*Math.LN2));r.realloc(n);for(var i=r.pos-1;i>=t;i--)r.buf[i+n]=r.buf[i];}function iu(t,e){for(var r=0;r<t.length;r++)e.writeVarint(t[r]);}function au(t,e){for(var r=0;r<t.length;r++)e.writeSVarint(t[r]);}function ou(t,e){for(var r=0;r<t.length;r++)e.writeFloat(t[r]);}function su(t,e){for(var r=0;r<t.length;r++)e.writeDouble(t[r]);}function uu(t,e){for(var r=0;r<t.length;r++)e.writeBoolean(t[r]);}function lu(t,e){for(var r=0;r<t.length;r++)e.writeFixed32(t[r]);}function pu(t,e){for(var r=0;r<t.length;r++)e.writeSFixed32(t[r]);}function cu(t,e){for(var r=0;r<t.length;r++)e.writeFixed64(t[r]);}function hu(t,e){for(var r=0;r<t.length;r++)e.writeSFixed64(t[r]);}function fu(t,e){return (t[e]|t[e+1]<<8|t[e+2]<<16)+16777216*t[e+3]}function yu(t,e,r){t[r]=e,t[r+1]=e>>>8,t[r+2]=e>>>16,t[r+3]=e>>>24;}function du(t,e){return (t[e]|t[e+1]<<8|t[e+2]<<16)+(t[e+3]<<24)}Qs.prototype={destroy:function(){this.buf=null;},readFields:function(t,e,r){for(r=r||this.length;this.pos<r;){var n=this.readVarint(),i=n>>3,a=this.pos;this.type=7&n,t(i,e,this),this.pos===a&&this.skip(n);}return e},readMessage:function(t,e){return this.readFields(t,e,this.readVarint()+this.pos)},readFixed32:function(){var t=fu(this.buf,this.pos);return this.pos+=4,t},readSFixed32:function(){var t=du(this.buf,this.pos);return this.pos+=4,t},readFixed64:function(){var t=fu(this.buf,this.pos)+4294967296*fu(this.buf,this.pos+4);return this.pos+=8,t},readSFixed64:function(){var t=fu(this.buf,this.pos)+4294967296*du(this.buf,this.pos+4);return this.pos+=8,t},readFloat:function(){var t=Ys(this.buf,this.pos,!0,23,4);return this.pos+=4,t},readDouble:function(){var t=Ys(this.buf,this.pos,!0,52,8);return this.pos+=8,t},readVarint:function(t){var e,r,n=this.buf;return e=127&(r=n[this.pos++]),r<128?e:(e|=(127&(r=n[this.pos++]))<<7,r<128?e:(e|=(127&(r=n[this.pos++]))<<14,r<128?e:(e|=(127&(r=n[this.pos++]))<<21,r<128?e:function(t,e,r){var n,i,a=r.buf;if(n=(112&(i=a[r.pos++]))>>4,i<128)return ru(t,n,e);if(n|=(127&(i=a[r.pos++]))<<3,i<128)return ru(t,n,e);if(n|=(127&(i=a[r.pos++]))<<10,i<128)return ru(t,n,e);if(n|=(127&(i=a[r.pos++]))<<17,i<128)return ru(t,n,e);if(n|=(127&(i=a[r.pos++]))<<24,i<128)return ru(t,n,e);if(n|=(1&(i=a[r.pos++]))<<31,i<128)return ru(t,n,e);throw new Error("Expected varint not more than 10 bytes")}(e|=(15&(r=n[this.pos]))<<28,t,this))))},readVarint64:function(){return this.readVarint(!0)},readSVarint:function(){var t=this.readVarint();return t%2==1?(t+1)/-2:t/2},readBoolean:function(){return Boolean(this.readVarint())},readString:function(){var t=this.readVarint()+this.pos,e=this.pos;return this.pos=t,t-e>=12&&tu?function(t,e,r){return tu.decode(t.subarray(e,r))}(this.buf,e,t):function(t,e,r){for(var n="",i=e;i<r;){var a,o,s,u=t[i],l=null,p=u>239?4:u>223?3:u>191?2:1;if(i+p>r)break;1===p?u<128&&(l=u):2===p?128==(192&(a=t[i+1]))&&(l=(31&u)<<6|63&a)<=127&&(l=null):3===p?(o=t[i+2],128==(192&(a=t[i+1]))&&128==(192&o)&&((l=(15&u)<<12|(63&a)<<6|63&o)<=2047||l>=55296&&l<=57343)&&(l=null)):4===p&&(o=t[i+2],s=t[i+3],128==(192&(a=t[i+1]))&&128==(192&o)&&128==(192&s)&&((l=(15&u)<<18|(63&a)<<12|(63&o)<<6|63&s)<=65535||l>=1114112)&&(l=null)),null===l?(l=65533,p=1):l>65535&&(l-=65536,n+=String.fromCharCode(l>>>10&1023|55296),l=56320|1023&l),n+=String.fromCharCode(l),i+=p;}return n}(this.buf,e,t)},readBytes:function(){var t=this.readVarint()+this.pos,e=this.buf.subarray(this.pos,t);return this.pos=t,e},readPackedVarint:function(t,e){if(this.type!==Qs.Bytes)return t.push(this.readVarint(e));var r=eu(this);for(t=t||[];this.pos<r;)t.push(this.readVarint(e));return t},readPackedSVarint:function(t){if(this.type!==Qs.Bytes)return t.push(this.readSVarint());var e=eu(this);for(t=t||[];this.pos<e;)t.push(this.readSVarint());return t},readPackedBoolean:function(t){if(this.type!==Qs.Bytes)return t.push(this.readBoolean());var e=eu(this);for(t=t||[];this.pos<e;)t.push(this.readBoolean());return t},readPackedFloat:function(t){if(this.type!==Qs.Bytes)return t.push(this.readFloat());var e=eu(this);for(t=t||[];this.pos<e;)t.push(this.readFloat());return t},readPackedDouble:function(t){if(this.type!==Qs.Bytes)return t.push(this.readDouble());var e=eu(this);for(t=t||[];this.pos<e;)t.push(this.readDouble());return t},readPackedFixed32:function(t){if(this.type!==Qs.Bytes)return t.push(this.readFixed32());var e=eu(this);for(t=t||[];this.pos<e;)t.push(this.readFixed32());return t},readPackedSFixed32:function(t){if(this.type!==Qs.Bytes)return t.push(this.readSFixed32());var e=eu(this);for(t=t||[];this.pos<e;)t.push(this.readSFixed32());return t},readPackedFixed64:function(t){if(this.type!==Qs.Bytes)return t.push(this.readFixed64());var e=eu(this);for(t=t||[];this.pos<e;)t.push(this.readFixed64());return t},readPackedSFixed64:function(t){if(this.type!==Qs.Bytes)return t.push(this.readSFixed64());var e=eu(this);for(t=t||[];this.pos<e;)t.push(this.readSFixed64());return t},skip:function(t){var e=7&t;if(e===Qs.Varint)for(;this.buf[this.pos++]>127;);else if(e===Qs.Bytes)this.pos=this.readVarint()+this.pos;else if(e===Qs.Fixed32)this.pos+=4;else{if(e!==Qs.Fixed64)throw new Error("Unimplemented type: "+e);this.pos+=8;}},writeTag:function(t,e){this.writeVarint(t<<3|e);},realloc:function(t){for(var e=this.length||16;e<this.pos+t;)e*=2;if(e!==this.length){var r=new Uint8Array(e);r.set(this.buf),this.buf=r,this.length=e;}},finish:function(){return this.length=this.pos,this.pos=0,this.buf.subarray(0,this.length)},writeFixed32:function(t){this.realloc(4),yu(this.buf,t,this.pos),this.pos+=4;},writeSFixed32:function(t){this.realloc(4),yu(this.buf,t,this.pos),this.pos+=4;},writeFixed64:function(t){this.realloc(8),yu(this.buf,-1&t,this.pos),yu(this.buf,Math.floor(t*(1/4294967296)),this.pos+4),this.pos+=8;},writeSFixed64:function(t){this.realloc(8),yu(this.buf,-1&t,this.pos),yu(this.buf,Math.floor(t*(1/4294967296)),this.pos+4),this.pos+=8;},writeVarint:function(t){(t=+t||0)>268435455||t<0?function(t,e){var r,n;if(t>=0?(r=t%4294967296|0,n=t/4294967296|0):(n=~(-t/4294967296),4294967295^(r=~(-t%4294967296))?r=r+1|0:(r=0,n=n+1|0)),t>=0x10000000000000000||t<-0x10000000000000000)throw new Error("Given varint doesn't fit into 10 bytes");e.realloc(10),function(t,e,r){r.buf[r.pos++]=127&t|128,t>>>=7,r.buf[r.pos++]=127&t|128,t>>>=7,r.buf[r.pos++]=127&t|128,t>>>=7,r.buf[r.pos++]=127&t|128,r.buf[r.pos]=127&(t>>>=7);}(r,0,e),function(t,e){var r=(7&t)<<4;e.buf[e.pos++]|=r|((t>>>=3)?128:0),t&&(e.buf[e.pos++]=127&t|((t>>>=7)?128:0),t&&(e.buf[e.pos++]=127&t|((t>>>=7)?128:0),t&&(e.buf[e.pos++]=127&t|((t>>>=7)?128:0),t&&(e.buf[e.pos++]=127&t|((t>>>=7)?128:0),t&&(e.buf[e.pos++]=127&t)))));}(n,e);}(t,this):(this.realloc(4),this.buf[this.pos++]=127&t|(t>127?128:0),t<=127||(this.buf[this.pos++]=127&(t>>>=7)|(t>127?128:0),t<=127||(this.buf[this.pos++]=127&(t>>>=7)|(t>127?128:0),t<=127||(this.buf[this.pos++]=t>>>7&127))));},writeSVarint:function(t){this.writeVarint(t<0?2*-t-1:2*t);},writeBoolean:function(t){this.writeVarint(Boolean(t));},writeString:function(t){t=String(t),this.realloc(4*t.length),this.pos++;var e=this.pos;this.pos=function(t,e,r){for(var n,i,a=0;a<e.length;a++){if((n=e.charCodeAt(a))>55295&&n<57344){if(!i){n>56319||a+1===e.length?(t[r++]=239,t[r++]=191,t[r++]=189):i=n;continue}if(n<56320){t[r++]=239,t[r++]=191,t[r++]=189,i=n;continue}n=i-55296<<10|n-56320|65536,i=null;}else i&&(t[r++]=239,t[r++]=191,t[r++]=189,i=null);n<128?t[r++]=n:(n<2048?t[r++]=n>>6|192:(n<65536?t[r++]=n>>12|224:(t[r++]=n>>18|240,t[r++]=n>>12&63|128),t[r++]=n>>6&63|128),t[r++]=63&n|128);}return r}(this.buf,t,this.pos);var r=this.pos-e;r>=128&&nu(e,r,this),this.pos=e-1,this.writeVarint(r),this.pos+=r;},writeFloat:function(t){this.realloc(4),$s(this.buf,t,this.pos,!0,23,4),this.pos+=4;},writeDouble:function(t){this.realloc(8),$s(this.buf,t,this.pos,!0,52,8),this.pos+=8;},writeBytes:function(t){var e=t.length;this.writeVarint(e),this.realloc(e);for(var r=0;r<e;r++)this.buf[this.pos++]=t[r];},writeRawMessage:function(t,e){this.pos++;var r=this.pos;t(e,this);var n=this.pos-r;n>=128&&nu(r,n,this),this.pos=r-1,this.writeVarint(n),this.pos+=n;},writeMessage:function(t,e,r){this.writeTag(t,Qs.Bytes),this.writeRawMessage(e,r);},writePackedVarint:function(t,e){e.length&&this.writeMessage(t,iu,e);},writePackedSVarint:function(t,e){e.length&&this.writeMessage(t,au,e);},writePackedBoolean:function(t,e){e.length&&this.writeMessage(t,uu,e);},writePackedFloat:function(t,e){e.length&&this.writeMessage(t,ou,e);},writePackedDouble:function(t,e){e.length&&this.writeMessage(t,su,e);},writePackedFixed32:function(t,e){e.length&&this.writeMessage(t,lu,e);},writePackedSFixed32:function(t,e){e.length&&this.writeMessage(t,pu,e);},writePackedFixed64:function(t,e){e.length&&this.writeMessage(t,cu,e);},writePackedSFixed64:function(t,e){e.length&&this.writeMessage(t,hu,e);},writeBytesField:function(t,e){this.writeTag(t,Qs.Bytes),this.writeBytes(e);},writeFixed32Field:function(t,e){this.writeTag(t,Qs.Fixed32),this.writeFixed32(e);},writeSFixed32Field:function(t,e){this.writeTag(t,Qs.Fixed32),this.writeSFixed32(e);},writeFixed64Field:function(t,e){this.writeTag(t,Qs.Fixed64),this.writeFixed64(e);},writeSFixed64Field:function(t,e){this.writeTag(t,Qs.Fixed64),this.writeSFixed64(e);},writeVarintField:function(t,e){this.writeTag(t,Qs.Varint),this.writeVarint(e);},writeSVarintField:function(t,e){this.writeTag(t,Qs.Varint),this.writeSVarint(e);},writeStringField:function(t,e){this.writeTag(t,Qs.Bytes),this.writeString(e);},writeFloatField:function(t,e){this.writeTag(t,Qs.Fixed32),this.writeFloat(e);},writeDoubleField:function(t,e){this.writeTag(t,Qs.Fixed64),this.writeDouble(e);},writeBooleanField:function(t,e){this.writeVarintField(t,Boolean(e));}};var mu=3;function vu(t,e,r){1===t&&r.readMessage(gu,e);}function gu(t,e,r){if(3===t){var n=r.readMessage(xu,{}),i=n.width,a=n.height,o=n.left,s=n.top,u=n.advance;e.push({id:n.id,bitmap:new bo({width:i+2*mu,height:a+2*mu},n.bitmap),metrics:{width:i,height:a,left:o,top:s,advance:u}});}}function xu(t,e,r){1===t?e.id=r.readVarint():2===t?e.bitmap=r.readBytes():3===t?e.width=r.readVarint():4===t?e.height=r.readVarint():5===t?e.left=r.readSVarint():6===t?e.top=r.readSVarint():7===t&&(e.advance=r.readVarint());}var bu=mu;function wu(t){for(var e=0,r=0,n=0,i=t;n<i.length;n+=1){var a=i[n];e+=a.w*a.h,r=Math.max(r,a.w);}t.sort((function(t,e){return e.h-t.h}));for(var o=[{x:0,y:0,w:Math.max(Math.ceil(Math.sqrt(e/.95)),r),h:1/0}],s=0,u=0,l=0,p=t;l<p.length;l+=1)for(var c=p[l],h=o.length-1;h>=0;h--){var f=o[h];if(!(c.w>f.w||c.h>f.h)){if(c.x=f.x,c.y=f.y,u=Math.max(u,c.y+c.h),s=Math.max(s,c.x+c.w),c.w===f.w&&c.h===f.h){var y=o.pop();h<o.length&&(o[h]=y);}else c.h===f.h?(f.x+=c.w,f.w-=c.w):c.w===f.w?(f.y+=c.h,f.h-=c.h):(o.push({x:f.x+c.w,y:f.y,w:f.w-c.w,h:c.h}),f.y+=c.h,f.h-=c.h);break}}return {w:s,h:u,fill:e/(s*u)||0}}var _u=1,Au=function(t,e){var r=e.pixelRatio,n=e.version,i=e.stretchX,a=e.stretchY,o=e.content;this.paddedRect=t,this.pixelRatio=r,this.stretchX=i,this.stretchY=a,this.content=o,this.version=n;},Su={tl:{configurable:!0},br:{configurable:!0},tlbr:{configurable:!0},displaySize:{configurable:!0}};Su.tl.get=function(){return [this.paddedRect.x+_u,this.paddedRect.y+_u]},Su.br.get=function(){return [this.paddedRect.x+this.paddedRect.w-_u,this.paddedRect.y+this.paddedRect.h-_u]},Su.tlbr.get=function(){return this.tl.concat(this.br)},Su.displaySize.get=function(){return [(this.paddedRect.w-2*_u)/this.pixelRatio,(this.paddedRect.h-2*_u)/this.pixelRatio]},Object.defineProperties(Au.prototype,Su);var ku=function(t,e){var r={},n={};this.haveRenderCallbacks=[];var i=[];this.addImages(t,r,i),this.addImages(e,n,i);var a=wu(i),o=new wo({width:a.w||1,height:a.h||1});for(var s in t){var u=t[s],l=r[s].paddedRect;wo.copy(u.data,o,{x:0,y:0},{x:l.x+_u,y:l.y+_u},u.data);}for(var p in e){var c=e[p],h=n[p].paddedRect,f=h.x+_u,y=h.y+_u,d=c.data.width,m=c.data.height;wo.copy(c.data,o,{x:0,y:0},{x:f,y:y},c.data),wo.copy(c.data,o,{x:0,y:m-1},{x:f,y:y-1},{width:d,height:1}),wo.copy(c.data,o,{x:0,y:0},{x:f,y:y+m},{width:d,height:1}),wo.copy(c.data,o,{x:d-1,y:0},{x:f-1,y:y},{width:1,height:m}),wo.copy(c.data,o,{x:0,y:0},{x:f+d,y:y},{width:1,height:m});}this.image=o,this.iconPositions=r,this.patternPositions=n;};ku.prototype.addImages=function(t,e,r){for(var n in t){var i=t[n],a={x:0,y:0,w:i.data.width+2*_u,h:i.data.height+2*_u};r.push(a),e[n]=new Au(a,i),i.hasRenderCallback&&this.haveRenderCallbacks.push(n);}},ku.prototype.patchUpdatedImages=function(t,e){for(var r in t.dispatchRenderCallbacks(this.haveRenderCallbacks),t.updatedImages)this.patchUpdatedImage(this.iconPositions[r],t.getImage(r),e),this.patchUpdatedImage(this.patternPositions[r],t.getImage(r),e);},ku.prototype.patchUpdatedImage=function(t,e,r){if(t&&e&&t.version!==e.version){t.version=e.version;var n=t.tl;r.update(e.data,void 0,{x:n[0],y:n[1]});}},Xn("ImagePosition",Au),Xn("ImageAtlas",ku);var Iu={horizontal:1,vertical:2,horizontalOnly:3},zu=-17,Cu=function(){this.scale=1,this.fontStack="",this.imageName=null;};Cu.forText=function(t,e){var r=new Cu;return r.scale=t||1,r.fontStack=e,r},Cu.forImage=function(t){var e=new Cu;return e.imageName=t,e};var Mu=function(){this.text="",this.sectionIndex=[],this.sections=[],this.imageSectionID=null;};function Tu(t,e,r,n,i,a,o,s,u,l,p,c,h,f,y,d){var m,v=Mu.fromFeature(t,i);c===Iu.vertical&&v.verticalizePunctuation();var g=di.processBidirectionalText,x=di.processStyledBidirectionalText;if(g&&1===v.sections.length){m=[];for(var b=0,w=g(v.toString(),Lu(v,l,a,e,n,f,y));b<w.length;b+=1){var _=w[b],A=new Mu;A.text=_,A.sections=v.sections;for(var S=0;S<_.length;S++)A.sectionIndex.push(0);m.push(A);}}else if(x){m=[];for(var k=0,I=x(v.text,v.sectionIndex,Lu(v,l,a,e,n,f,y));k<I.length;k+=1){var z=I[k],C=new Mu;C.text=z[0],C.sectionIndex=z[1],C.sections=v.sections,m.push(C);}}else m=function(t,e){for(var r=[],n=t.text,i=0,a=0,o=e;a<o.length;a+=1){var s=o[a];r.push(t.substring(i,s)),i=s;}return i<n.length&&r.push(t.substring(i,n.length)),r}(v,Lu(v,l,a,e,n,f,y));var M=[],T={positionedLines:M,text:v.toString(),top:p[1],bottom:p[1],left:p[0],right:p[0],writingMode:c,iconsInText:!1,verticalizable:!1};return function(t,e,r,n,i,a,o,s,u,l,p,c){for(var h=0,f=zu,y=0,d=0,m="right"===s?1:"left"===s?0:.5,v=0,g=0,x=i;g<x.length;g+=1){var b=x[g];b.trim();var w=b.getMaxScale(),_=(w-1)*Hs,A={positionedGlyphs:[],lineOffset:0};t.positionedLines[v]=A;var S=A.positionedGlyphs,k=0;if(b.length()){for(var I=0;I<b.length();I++){var z=b.getSection(I),C=b.getSectionIndex(I),M=b.getCharCode(I),T=0,E=null,P=null,B=null,V=Hs,F=!(u===Iu.horizontal||!p&&!ri(M)||p&&(Eu[M]||(K=M,ti.Arabic(K)||ti["Arabic Supplement"](K)||ti["Arabic Extended-A"](K)||ti["Arabic Presentation Forms-A"](K)||ti["Arabic Presentation Forms-B"](K))));if(z.imageName){var D=n[z.imageName];if(!D)continue;B=z.imageName,t.iconsInText=t.iconsInText||!0,P=D.paddedRect;var L=D.displaySize;z.scale=z.scale*Hs/c,T=_+(Hs-L[1]*z.scale),V=(E={width:L[0],height:L[1],left:_u,top:-bu,advance:F?L[1]:L[0]}).advance;var R=F?L[0]*z.scale-Hs*w:L[1]*z.scale-Hs*w;R>0&&R>k&&(k=R);}else{var O=r[z.fontStack],U=O&&O[M];if(U&&U.rect)P=U.rect,E=U.metrics;else{var j=e[z.fontStack],q=j&&j[M];if(!q)continue;E=q.metrics;}T=(w-z.scale)*Hs;}F?(t.verticalizable=!0,S.push({glyph:M,imageName:B,x:h,y:f+T,vertical:F,scale:z.scale,fontStack:z.fontStack,sectionIndex:C,metrics:E,rect:P}),h+=V*z.scale+l):(S.push({glyph:M,imageName:B,x:h,y:f+T,vertical:F,scale:z.scale,fontStack:z.fontStack,sectionIndex:C,metrics:E,rect:P}),h+=E.advance*z.scale+l);}0!==S.length&&(y=Math.max(h-l,y),Ou(S,0,S.length-1,m,k)),h=0;var N=a*w+k;A.lineOffset=Math.max(k,_),f+=N,d=Math.max(N,d),++v;}else f+=a,++v;}var K,G=f-zu,Z=Ru(o),X=Z.horizontalAlign,J=Z.verticalAlign;(function(t,e,r,n,i,a,o,s,u){var l,p=(e-r)*i;l=a!==o?-s*n-zu:(-n*u+.5)*o;for(var c=0,h=t;c<h.length;c+=1)for(var f=0,y=h[c].positionedGlyphs;f<y.length;f+=1){var d=y[f];d.x+=p,d.y+=l;}})(t.positionedLines,m,X,J,y,d,a,G,i.length),t.top+=-J*G,t.bottom=t.top+G,t.left+=-X*y,t.right=t.left+y;}(T,e,r,n,m,o,s,u,c,l,h,d),!function(t){for(var e=0,r=t;e<r.length;e+=1)if(0!==r[e].positionedGlyphs.length)return !1;return !0}(M)&&T}Mu.fromFeature=function(t,e){for(var r=new Mu,n=0;n<t.sections.length;n++){var i=t.sections[n];i.image?r.addImageSection(i):r.addTextSection(i,e);}return r},Mu.prototype.length=function(){return this.text.length},Mu.prototype.getSection=function(t){return this.sections[this.sectionIndex[t]]},Mu.prototype.getSectionIndex=function(t){return this.sectionIndex[t]},Mu.prototype.getCharCode=function(t){return this.text.charCodeAt(t)},Mu.prototype.verticalizePunctuation=function(){this.text=function(t){for(var e="",r=0;r<t.length;r++){var n=t.charCodeAt(r+1)||null,i=t.charCodeAt(r-1)||null;e+=n&&ni(n)&&!Js[t[r+1]]||i&&ni(i)&&!Js[t[r-1]]||!Js[t[r]]?t[r]:Js[t[r]];}return e}(this.text);},Mu.prototype.trim=function(){for(var t=0,e=0;e<this.text.length&&Eu[this.text.charCodeAt(e)];e++)t++;for(var r=this.text.length,n=this.text.length-1;n>=0&&n>=t&&Eu[this.text.charCodeAt(n)];n--)r--;this.text=this.text.substring(t,r),this.sectionIndex=this.sectionIndex.slice(t,r);},Mu.prototype.substring=function(t,e){var r=new Mu;return r.text=this.text.substring(t,e),r.sectionIndex=this.sectionIndex.slice(t,e),r.sections=this.sections,r},Mu.prototype.toString=function(){return this.text},Mu.prototype.getMaxScale=function(){var t=this;return this.sectionIndex.reduce((function(e,r){return Math.max(e,t.sections[r].scale)}),0)},Mu.prototype.addTextSection=function(t,e){this.text+=t.text,this.sections.push(Cu.forText(t.scale,t.fontStack||e));for(var r=this.sections.length-1,n=0;n<t.text.length;++n)this.sectionIndex.push(r);},Mu.prototype.addImageSection=function(t){var e=t.image?t.image.name:"";if(0!==e.length){var r=this.getNextImageSectionCharCode();r?(this.text+=String.fromCharCode(r),this.sections.push(Cu.forImage(e)),this.sectionIndex.push(this.sections.length-1)):w("Reached maximum number of images 6401");}else w("Can't add FormattedSection with an empty image.");},Mu.prototype.getNextImageSectionCharCode=function(){return this.imageSectionID?this.imageSectionID>=63743?null:++this.imageSectionID:(this.imageSectionID=57344,this.imageSectionID)};var Eu={9:!0,10:!0,11:!0,12:!0,13:!0,32:!0},Pu={};function Bu(t,e,r,n,i,a){if(e.imageName){var o=n[e.imageName];return o?o.displaySize[0]*e.scale*Hs/a+i:0}var s=r[e.fontStack],u=s&&s[t];return u?u.metrics.advance*e.scale+i:0}function Vu(t,e,r,n){var i=Math.pow(t-e,2);return n?t<e?i/2:2*i:i+Math.abs(r)*r}function Fu(t,e,r){var n=0;return 10===t&&(n-=1e4),r&&(n+=150),40!==t&&65288!==t||(n+=50),41!==e&&65289!==e||(n+=50),n}function Du(t,e,r,n,i,a){for(var o=null,s=Vu(e,r,i,a),u=0,l=n;u<l.length;u+=1){var p=l[u],c=Vu(e-p.x,r,i,a)+p.badness;c<=s&&(o=p,s=c);}return {index:t,x:e,priorBreak:o,badness:s}}function Lu(t,e,r,n,i,a,o){if("point"!==a)return [];if(!t)return [];for(var s,u=[],l=function(t,e,r,n,i,a){for(var o=0,s=0;s<t.length();s++){var u=t.getSection(s);o+=Bu(t.getCharCode(s),u,n,i,e,a);}return o/Math.max(1,Math.ceil(o/r))}(t,e,r,n,i,o),p=t.text.indexOf("​")>=0,c=0,h=0;h<t.length();h++){var f=t.getSection(h),y=t.getCharCode(h);if(Eu[y]||(c+=Bu(y,f,n,i,e,o)),h<t.length()-1){var d=!((s=y)<11904||!(ti["Bopomofo Extended"](s)||ti.Bopomofo(s)||ti["CJK Compatibility Forms"](s)||ti["CJK Compatibility Ideographs"](s)||ti["CJK Compatibility"](s)||ti["CJK Radicals Supplement"](s)||ti["CJK Strokes"](s)||ti["CJK Symbols and Punctuation"](s)||ti["CJK Unified Ideographs Extension A"](s)||ti["CJK Unified Ideographs"](s)||ti["Enclosed CJK Letters and Months"](s)||ti["Halfwidth and Fullwidth Forms"](s)||ti.Hiragana(s)||ti["Ideographic Description Characters"](s)||ti["Kangxi Radicals"](s)||ti["Katakana Phonetic Extensions"](s)||ti.Katakana(s)||ti["Vertical Forms"](s)||ti["Yi Radicals"](s)||ti["Yi Syllables"](s)));(Pu[y]||d||f.imageName)&&u.push(Du(h+1,c,l,u,Fu(y,t.getCharCode(h+1),d&&p),!1));}}return function t(e){return e?t(e.priorBreak).concat(e.index):[]}(Du(t.length(),c,l,u,0,!0))}function Ru(t){var e=.5,r=.5;switch(t){case"right":case"top-right":case"bottom-right":e=1;break;case"left":case"top-left":case"bottom-left":e=0;}switch(t){case"bottom":case"bottom-right":case"bottom-left":r=1;break;case"top":case"top-right":case"top-left":r=0;}return {horizontalAlign:e,verticalAlign:r}}function Ou(t,e,r,n,i){if(n||i)for(var a=t[r],o=(t[r].x+a.metrics.advance*a.scale)*n,s=e;s<=r;s++)t[s].x-=o,t[s].y+=i;}function Uu(t,e,r,n,i,a){var o,s=t.image;if(s.content){var u=s.content,l=s.pixelRatio||1;o=[u[0]/l,u[1]/l,s.displaySize[0]-u[2]/l,s.displaySize[1]-u[3]/l];}var p,c,h,f,y=e.left*a,d=e.right*a;"width"===r||"both"===r?(f=i[0]+y-n[3],c=i[0]+d+n[1]):c=(f=i[0]+(y+d-s.displaySize[0])/2)+s.displaySize[0];var m=e.top*a,v=e.bottom*a;return "height"===r||"both"===r?(p=i[1]+m-n[0],h=i[1]+v+n[2]):h=(p=i[1]+(m+v-s.displaySize[1])/2)+s.displaySize[1],{image:s,top:p,right:c,bottom:h,left:f,collisionPadding:o}}Pu[10]=!0,Pu[32]=!0,Pu[38]=!0,Pu[40]=!0,Pu[41]=!0,Pu[43]=!0,Pu[45]=!0,Pu[47]=!0,Pu[173]=!0,Pu[183]=!0,Pu[8203]=!0,Pu[8208]=!0,Pu[8211]=!0,Pu[8231]=!0;var ju=function(t){function e(e,r,n,i){t.call(this,e,r),this.angle=n,void 0!==i&&(this.segment=i);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.clone=function(){return new e(this.x,this.y,this.angle,this.segment)},e}(i);Xn("Anchor",ju);var qu=128;function Nu(t,e){var r=e.expression;if("constant"===r.kind)return {kind:"constant",layoutSize:r.evaluate(new mi(t+1))};if("source"===r.kind)return {kind:"source"};for(var n=r.zoomStops,i=r.interpolationType,a=0;a<n.length&&n[a]<=t;)a++;for(var o=a=Math.max(0,a-1);o<n.length&&n[o]<t+1;)o++;o=Math.min(n.length-1,o);var s=n[a],u=n[o];return "composite"===r.kind?{kind:"composite",minZoom:s,maxZoom:u,interpolationType:i}:{kind:"camera",minZoom:s,maxZoom:u,minSize:r.evaluate(new mi(s)),maxSize:r.evaluate(new mi(u)),interpolationType:i}}function Ku(t,e,r){var n=e.uSize,i=r.lowerSize;return "source"===t.kind?i/qu:"composite"===t.kind?Je(i/qu,r.upperSize/qu,e.uSizeT):n}function Gu(t,e){var r=0,n=0;if("constant"===t.kind)n=t.layoutSize;else if("source"!==t.kind){var i=t.interpolationType,a=i?u(dr.interpolationFactor(i,e,t.minZoom,t.maxZoom),0,1):0;"camera"===t.kind?n=Je(t.minSize,t.maxSize,a):r=a;}return {uSizeT:r,uSize:n}}var Zu=Object.freeze({__proto__:null,getSizeData:Nu,evaluateSizeForFeature:Ku,evaluateSizeForZoom:Gu,SIZE_PACK_FACTOR:qu});function Xu(t,e,r,n,i){if(void 0===e.segment)return !0;for(var a=e,o=e.segment+1,s=0;s>-r/2;){if(--o<0)return !1;s-=t[o].dist(a),a=t[o];}s+=t[o].dist(t[o+1]),o++;for(var u=[],l=0;s<r/2;){var p=t[o],c=t[o+1];if(!c)return !1;var h=t[o-1].angleTo(p)-p.angleTo(c);for(h=Math.abs((h+3*Math.PI)%(2*Math.PI)-Math.PI),u.push({distance:s,angleDelta:h}),l+=h;s-u[0].distance>n;)l-=u.shift().angleDelta;if(l>i)return !1;o++,s+=p.dist(c);}return !0}function Ju(t){for(var e=0,r=0;r<t.length-1;r++)e+=t[r].dist(t[r+1]);return e}function Hu(t,e,r){return t?.6*e*r:0}function Yu(t,e){return Math.max(t?t.right-t.left:0,e?e.right-e.left:0)}function $u(t,e,r,n,i,a){for(var o=Hu(r,i,a),s=Yu(r,n)*a,u=0,l=Ju(t)/2,p=0;p<t.length-1;p++){var c=t[p],h=t[p+1],f=c.dist(h);if(u+f>l){var y=(l-u)/f,d=Je(c.x,h.x,y),m=Je(c.y,h.y,y),v=new ju(d,m,h.angleTo(c),p);return v._round(),!o||Xu(t,v,s,o,e)?v:void 0}u+=f;}}function Wu(t,e,r,n,i,a,o,s,u){var l=Hu(n,a,o),p=Yu(n,i),c=p*o,h=0===t[0].x||t[0].x===u||0===t[0].y||t[0].y===u;return e-c<e/4&&(e=c+e/4),function t(e,r,n,i,a,o,s,u,l){for(var p=o/2,c=Ju(e),h=0,f=r-n,y=[],d=0;d<e.length-1;d++){for(var m=e[d],v=e[d+1],g=m.dist(v),x=v.angleTo(m);f+n<h+g;){var b=((f+=n)-h)/g,w=Je(m.x,v.x,b),_=Je(m.y,v.y,b);if(w>=0&&w<l&&_>=0&&_<l&&f-p>=0&&f+p<=c){var A=new ju(w,_,x,d);A._round(),i&&!Xu(e,A,o,i,a)||y.push(A);}}h+=g;}return u||y.length||s||(y=t(e,h/2,n,i,a,o,s,!0,l)),y}(t,h?e/2*s%e:(p/2+2*a)*o*s%e,e,l,r,c,h,!1,u)}var Qu=_u;function tl(t,e,r,n){var a=[],o=t.image,s=o.pixelRatio,u=o.paddedRect.w-2*Qu,l=o.paddedRect.h-2*Qu,p=t.right-t.left,c=t.bottom-t.top,h=o.stretchX||[[0,u]],f=o.stretchY||[[0,l]],y=function(t,e){return t+e[1]-e[0]},d=h.reduce(y,0),m=f.reduce(y,0),v=u-d,g=l-m,x=0,b=d,w=0,_=m,A=0,S=v,k=0,I=g;if(o.content&&n){var z=o.content;x=el(h,0,z[0]),w=el(f,0,z[1]),b=el(h,z[0],z[2]),_=el(f,z[1],z[3]),A=z[0]-x,k=z[1]-w,S=z[2]-z[0]-b,I=z[3]-z[1]-_;}var C=function(n,a,u,l){var h=nl(n.stretch-x,b,p,t.left),f=il(n.fixed-A,S,n.stretch,d),y=nl(a.stretch-w,_,c,t.top),v=il(a.fixed-k,I,a.stretch,m),g=nl(u.stretch-x,b,p,t.left),z=il(u.fixed-A,S,u.stretch,d),C=nl(l.stretch-w,_,c,t.top),M=il(l.fixed-k,I,l.stretch,m),T=new i(h,y),E=new i(g,y),P=new i(g,C),B=new i(h,C),V=new i(f/s,v/s),F=new i(z/s,M/s),D=e*Math.PI/180;if(D){var L=Math.sin(D),R=Math.cos(D),O=[R,-L,L,R];T._matMult(O),E._matMult(O),B._matMult(O),P._matMult(O);}var U=n.stretch+n.fixed,j=a.stretch+a.fixed;return {tl:T,tr:E,bl:B,br:P,tex:{x:o.paddedRect.x+Qu+U,y:o.paddedRect.y+Qu+j,w:u.stretch+u.fixed-U,h:l.stretch+l.fixed-j},writingMode:void 0,glyphOffset:[0,0],sectionIndex:0,pixelOffsetTL:V,pixelOffsetBR:F,minFontScaleX:S/s/p,minFontScaleY:I/s/c,isSDF:r}};if(n&&(o.stretchX||o.stretchY))for(var M=rl(h,v,d),T=rl(f,g,m),E=0;E<M.length-1;E++)for(var P=M[E],B=M[E+1],V=0;V<T.length-1;V++)a.push(C(P,T[V],B,T[V+1]));else a.push(C({fixed:0,stretch:-1},{fixed:0,stretch:-1},{fixed:0,stretch:u+1},{fixed:0,stretch:l+1}));return a}function el(t,e,r){for(var n=0,i=0,a=t;i<a.length;i+=1){var o=a[i];n+=Math.max(e,Math.min(r,o[1]))-Math.max(e,Math.min(r,o[0]));}return n}function rl(t,e,r){for(var n=[{fixed:-Qu,stretch:0}],i=0,a=t;i<a.length;i+=1){var o=a[i],s=o[0],u=o[1],l=n[n.length-1];n.push({fixed:s-l.stretch,stretch:l.stretch}),n.push({fixed:s-l.stretch,stretch:l.stretch+(u-s)});}return n.push({fixed:e+Qu,stretch:r}),n}function nl(t,e,r,n){return t/e*r+n}function il(t,e,r,n){return t-e*r/n}var al=function(t,e,r,n,a,o,s,u,l,p,c,h){var f=s.top*u-l,y=s.bottom*u+l,d=s.left*u-l,m=s.right*u+l,v=s.collisionPadding;if(v&&(d-=v[0]*u,f-=v[1]*u,m+=v[2]*u,y+=v[3]*u),this.boxStartIndex=t.length,p){var g=y-f,x=m-d;g>0&&(g=Math.max(10*u,g),this._addLineCollisionCircles(t,e,r,r.segment,x,g,n,a,o,c));}else{if(h){var b=new i(d,f),w=new i(m,f),_=new i(d,y),A=new i(m,y),S=h*Math.PI/180;b._rotate(S),w._rotate(S),_._rotate(S),A._rotate(S),d=Math.min(b.x,w.x,_.x,A.x),m=Math.max(b.x,w.x,_.x,A.x),f=Math.min(b.y,w.y,_.y,A.y),y=Math.max(b.y,w.y,_.y,A.y);}t.emplaceBack(r.x,r.y,d,f,m,y,n,a,o,0,0);}this.boxEndIndex=t.length;};al.prototype._addLineCollisionCircles=function(t,e,r,n,i,a,o,s,u,l){var p=a/2,c=Math.floor(i/p)||1,h=1+.4*Math.log(l)/Math.LN2,f=Math.floor(c*h/2),y=-a/2,d=r,m=n+1,v=y,g=-i/2,x=g-i/4;do{if(--m<0){if(v>g)return;m=0;break}v-=e[m].dist(d),d=e[m];}while(v>x);for(var b=e[m].dist(e[m+1]),w=-f;w<c+f;w++){var _=w*p,A=g+_;if(_<0&&(A+=_),_>i&&(A+=_-i),!(A<v)){for(;v+b<A;){if(v+=b,++m+1>=e.length)return;b=e[m].dist(e[m+1]);}var S=A-v,k=e[m],I=e[m+1].sub(k)._unit()._mult(S)._add(k)._round(),z=Math.abs(A-y)<p?0:.8*(A-y);t.emplaceBack(I.x,I.y,-a/2,-a/2,a/2,a/2,o,s,u,a/2,z);}}};var ol=function(t,e){if(void 0===t&&(t=[]),void 0===e&&(e=sl),this.data=t,this.length=this.data.length,this.compare=e,this.length>0)for(var r=(this.length>>1)-1;r>=0;r--)this._down(r);};function sl(t,e){return t<e?-1:t>e?1:0}function ul(t,e,r){void 0===e&&(e=1),void 0===r&&(r=!1);for(var n=1/0,a=1/0,o=-1/0,s=-1/0,u=t[0],l=0;l<u.length;l++){var p=u[l];(!l||p.x<n)&&(n=p.x),(!l||p.y<a)&&(a=p.y),(!l||p.x>o)&&(o=p.x),(!l||p.y>s)&&(s=p.y);}var c=Math.min(o-n,s-a),h=c/2,f=new ol([],ll);if(0===c)return new i(n,a);for(var y=n;y<o;y+=c)for(var d=a;d<s;d+=c)f.push(new pl(y+h,d+h,h,t));for(var m=function(t){for(var e=0,r=0,n=0,i=t[0],a=0,o=i.length,s=o-1;a<o;s=a++){var u=i[a],l=i[s],p=u.x*l.y-l.x*u.y;r+=(u.x+l.x)*p,n+=(u.y+l.y)*p,e+=3*p;}return new pl(r/e,n/e,0,t)}(t),v=f.length;f.length;){var g=f.pop();(g.d>m.d||!m.d)&&(m=g,r&&console.log("found best %d after %d probes",Math.round(1e4*g.d)/1e4,v)),g.max-m.d<=e||(f.push(new pl(g.p.x-(h=g.h/2),g.p.y-h,h,t)),f.push(new pl(g.p.x+h,g.p.y-h,h,t)),f.push(new pl(g.p.x-h,g.p.y+h,h,t)),f.push(new pl(g.p.x+h,g.p.y+h,h,t)),v+=4);}return r&&(console.log("num probes: "+v),console.log("best distance: "+m.d)),m.p}function ll(t,e){return e.max-t.max}function pl(t,e,r,n){this.p=new i(t,e),this.h=r,this.d=function(t,e){for(var r=!1,n=1/0,i=0;i<e.length;i++)for(var a=e[i],o=0,s=a.length,u=s-1;o<s;u=o++){var l=a[o],p=a[u];l.y>t.y!=p.y>t.y&&t.x<(p.x-l.x)*(t.y-l.y)/(p.y-l.y)+l.x&&(r=!r),n=Math.min(n,eo(t,l,p));}return (r?1:-1)*Math.sqrt(n)}(this.p,n),this.max=this.d+this.h*Math.SQRT2;}ol.prototype.push=function(t){this.data.push(t),this.length++,this._up(this.length-1);},ol.prototype.pop=function(){if(0!==this.length){var t=this.data[0],e=this.data.pop();return this.length--,this.length>0&&(this.data[0]=e,this._down(0)),t}},ol.prototype.peek=function(){return this.data[0]},ol.prototype._up=function(t){for(var e=this.data,r=this.compare,n=e[t];t>0;){var i=t-1>>1,a=e[i];if(r(n,a)>=0)break;e[t]=a,t=i;}e[t]=n;},ol.prototype._down=function(t){for(var e=this.data,r=this.compare,n=this.length>>1,i=e[t];t<n;){var a=1+(t<<1),o=e[a],s=a+1;if(s<this.length&&r(e[s],o)<0&&(a=s,o=e[s]),r(o,i)>=0)break;e[t]=o,t=a;}e[t]=i;};var cl=7,hl=Number.POSITIVE_INFINITY;function fl(t,e){return e[1]!==hl?function(t,e,r){var n=0,i=0;switch(e=Math.abs(e),r=Math.abs(r),t){case"top-right":case"top-left":case"top":i=r-cl;break;case"bottom-right":case"bottom-left":case"bottom":i=-r+cl;}switch(t){case"top-right":case"bottom-right":case"right":n=-e;break;case"top-left":case"bottom-left":case"left":n=e;}return [n,i]}(t,e[0],e[1]):function(t,e){var r=0,n=0;e<0&&(e=0);var i=e/Math.sqrt(2);switch(t){case"top-right":case"top-left":n=i-cl;break;case"bottom-right":case"bottom-left":n=-i+cl;break;case"bottom":n=-e+cl;break;case"top":n=e-cl;}switch(t){case"top-right":case"bottom-right":r=-i;break;case"top-left":case"bottom-left":r=i;break;case"left":r=e;break;case"right":r=-e;}return [r,n]}(t,e[0])}function yl(t){switch(t){case"right":case"top-right":case"bottom-right":return "right";case"left":case"top-left":case"bottom-left":return "left"}return "center"}var dl=255,ml=dl*qu;function vl(t,e,r,n,a,o,s,u,l,p,c,h,f,y,d){var m=function(t,e,r,n,a,o,s,u){for(var l=n.layout.get("text-rotate").evaluate(o,{})*Math.PI/180,p=[],c=0,h=e.positionedLines;c<h.length;c+=1)for(var f=h[c],y=0,d=f.positionedGlyphs;y<d.length;y+=1){var m=d[y];if(m.rect){var v=m.rect||{},g=bu+1,x=!0,b=1,w=0,_=(a||u)&&m.vertical,A=m.metrics.advance*m.scale/2;if(u&&e.verticalizable&&(w=f.lineOffset/2-(m.imageName?-(Hs-m.metrics.width*m.scale)/2:(m.scale-1)*Hs)),m.imageName){var S=s[m.imageName];x=S.sdf,g=_u/(b=S.pixelRatio);}var k=a?[m.x+A,m.y]:[0,0],I=a?[0,0]:[m.x+A+r[0],m.y+r[1]-w],z=[0,0];_&&(z=I,I=[0,0]);var C=(m.metrics.left-g)*m.scale-A+I[0],M=(-m.metrics.top-g)*m.scale+I[1],T=C+v.w*m.scale/b,E=M+v.h*m.scale/b,P=new i(C,M),B=new i(T,M),V=new i(C,E),F=new i(T,E);if(_){var D=new i(-A,A-zu),L=-Math.PI/2,R=Hs/2-A,O=new i(5-zu-R,-(m.imageName?R:0)),U=new(Function.prototype.bind.apply(i,[null].concat(z)));P._rotateAround(L,D)._add(O)._add(U),B._rotateAround(L,D)._add(O)._add(U),V._rotateAround(L,D)._add(O)._add(U),F._rotateAround(L,D)._add(O)._add(U);}if(l){var j=Math.sin(l),q=Math.cos(l),N=[q,-j,j,q];P._matMult(N),B._matMult(N),V._matMult(N),F._matMult(N);}var K=new i(0,0),G=new i(0,0);p.push({tl:P,tr:B,bl:V,br:F,tex:v,writingMode:e.writingMode,glyphOffset:k,sectionIndex:m.sectionIndex,isSDF:x,pixelOffsetTL:K,pixelOffsetBR:G,minFontScaleX:0,minFontScaleY:0});}}return p}(0,r,u,a,o,s,n,t.allowVerticalPlacement),v=t.textSizeData,g=null;"source"===v.kind?(g=[qu*a.layout.get("text-size").evaluate(s,{})])[0]>ml&&w(t.layerIds[0]+': Value for "text-size" is >= '+dl+'. Reduce your "text-size".'):"composite"===v.kind&&((g=[qu*y.compositeTextSizes[0].evaluate(s,{},d),qu*y.compositeTextSizes[1].evaluate(s,{},d)])[0]>ml||g[1]>ml)&&w(t.layerIds[0]+': Value for "text-size" is >= '+dl+'. Reduce your "text-size".'),t.addSymbols(t.text,m,g,u,o,s,p,e,l.lineStartIndex,l.lineLength,f,d);for(var x=0,b=c;x<b.length;x+=1)h[b[x]]=t.text.placedSymbolArray.length-1;return 4*m.length}function gl(t){for(var e in t)return t[e];return null}function xl(t,e,r,n){var i=t.compareText;if(e in i){for(var a=i[e],o=a.length-1;o>=0;o--)if(n.dist(a[o])<r)return !0}else i[e]=[];return i[e].push(n),!1}var bl=_s.VectorTileFeature.types,wl=[{name:"a_fade_opacity",components:1,type:"Uint8",offset:0}];function _l(t,e,r,n,i,a,o,s,u,l,p,c,h){var f=s?Math.min(ml,Math.round(s[0])):0,y=s?Math.min(ml,Math.round(s[1])):0;t.emplaceBack(e,r,Math.round(32*n),Math.round(32*i),a,o,(f<<1)+(u?1:0),y,16*l,16*p,256*c,256*h);}function Al(t,e,r){t.emplaceBack(e.x,e.y,r),t.emplaceBack(e.x,e.y,r),t.emplaceBack(e.x,e.y,r),t.emplaceBack(e.x,e.y,r);}function Sl(t){for(var e=0,r=t.sections;e<r.length;e+=1)if(oi(r[e].text))return !0;return !1}var kl=function(t){this.layoutVertexArray=new qi,this.indexArray=new Qi,this.programConfigurations=t,this.segments=new da,this.dynamicLayoutVertexArray=new Ni,this.opacityVertexArray=new Ki,this.placedSymbolArray=new sa;};kl.prototype.isEmpty=function(){return 0===this.layoutVertexArray.length&&0===this.indexArray.length&&0===this.dynamicLayoutVertexArray.length&&0===this.opacityVertexArray.length},kl.prototype.upload=function(t,e,r,n){this.isEmpty()||(r&&(this.layoutVertexBuffer=t.createVertexBuffer(this.layoutVertexArray,qs.members),this.indexBuffer=t.createIndexBuffer(this.indexArray,e),this.dynamicLayoutVertexBuffer=t.createVertexBuffer(this.dynamicLayoutVertexArray,Ns.members,!0),this.opacityVertexBuffer=t.createVertexBuffer(this.opacityVertexArray,wl,!0),this.opacityVertexBuffer.itemSize=1),(r||n)&&this.programConfigurations.upload(t));},kl.prototype.destroy=function(){this.layoutVertexBuffer&&(this.layoutVertexBuffer.destroy(),this.indexBuffer.destroy(),this.programConfigurations.destroy(),this.segments.destroy(),this.dynamicLayoutVertexBuffer.destroy(),this.opacityVertexBuffer.destroy());},Xn("SymbolBuffers",kl);var Il=function(t,e,r){this.layoutVertexArray=new t,this.layoutAttributes=e,this.indexArray=new r,this.segments=new da,this.collisionVertexArray=new Xi;};Il.prototype.upload=function(t){this.layoutVertexBuffer=t.createVertexBuffer(this.layoutVertexArray,this.layoutAttributes),this.indexBuffer=t.createIndexBuffer(this.indexArray),this.collisionVertexBuffer=t.createVertexBuffer(this.collisionVertexArray,Ks.members,!0);},Il.prototype.destroy=function(){this.layoutVertexBuffer&&(this.layoutVertexBuffer.destroy(),this.indexBuffer.destroy(),this.segments.destroy(),this.collisionVertexBuffer.destroy());},Xn("CollisionBuffers",Il);var zl=function(t){this.collisionBoxArray=t.collisionBoxArray,this.zoom=t.zoom,this.overscaling=t.overscaling,this.layers=t.layers,this.layerIds=this.layers.map((function(t){return t.id})),this.index=t.index,this.pixelRatio=t.pixelRatio,this.sourceLayerIndex=t.sourceLayerIndex,this.hasPattern=!1,this.hasRTLText=!1,this.sortKeyRanges=[];var e=this.layers[0]._unevaluatedLayout._values;this.textSizeData=Nu(this.zoom,e["text-size"]),this.iconSizeData=Nu(this.zoom,e["icon-size"]);var r=this.layers[0].layout,n=r.get("symbol-sort-key"),i=r.get("symbol-z-order");this.sortFeaturesByKey="viewport-y"!==i&&void 0!==n.constantOr(1),this.sortFeaturesByY=("viewport-y"===i||"auto"===i&&!this.sortFeaturesByKey)&&(r.get("text-allow-overlap")||r.get("icon-allow-overlap")||r.get("text-ignore-placement")||r.get("icon-ignore-placement")),"point"===r.get("symbol-placement")&&(this.writingModes=r.get("text-writing-mode").map((function(t){return Iu[t]}))),this.stateDependentLayerIds=this.layers.filter((function(t){return t.isStateDependent()})).map((function(t){return t.id})),this.sourceID=t.sourceID;};zl.prototype.createArrays=function(){this.text=new kl(new ja(qs.members,this.layers,this.zoom,(function(t){return /^text/.test(t)}))),this.icon=new kl(new ja(qs.members,this.layers,this.zoom,(function(t){return /^icon/.test(t)}))),this.glyphOffsetArray=new pa,this.lineVertexArray=new ca,this.symbolInstances=new la;},zl.prototype.calculateGlyphDependencies=function(t,e,r,n,i){for(var a=0;a<t.length;a++)if(e[t.charCodeAt(a)]=!0,(r||n)&&i){var o=Js[t.charAt(a)];o&&(e[o.charCodeAt(0)]=!0);}},zl.prototype.populate=function(t,e,r){var n=this.layers[0],i=n.layout,a=i.get("text-font"),o=i.get("text-field"),s=i.get("icon-image"),u=("constant"!==o.value.kind||o.value.value instanceof te&&!o.value.value.isEmpty()||o.value.value.toString().length>0)&&("constant"!==a.value.kind||a.value.value.length>0),l="constant"!==s.value.kind||!!s.value.value||Object.keys(s.parameters).length>0,p=i.get("symbol-sort-key");if(this.features=[],u||l){for(var c=e.iconDependencies,h=e.glyphDependencies,f=e.availableImages,y=new mi(this.zoom),d=0,m=t;d<m.length;d+=1){var v=m[d],g=v.feature,x=v.id,b=v.index,w=v.sourceLayerIndex,_=n._featureFilter.needGeometry,A={type:g.type,id:x,properties:g.properties,geometry:_?Ga(g):[]};if(n._featureFilter.filter(y,A,r)){_||(A.geometry=Ga(g));var S=void 0;if(u){var k=n.getValueAndResolveTokens("text-field",A,r,f),I=te.factory(k);Sl(I)&&(this.hasRTLText=!0),(!this.hasRTLText||"unavailable"===fi()||this.hasRTLText&&di.isParsed())&&(S=Xs(I,n,A));}var z=void 0;if(l){var C=n.getValueAndResolveTokens("icon-image",A,r,f);z=C instanceof ee?C:ee.fromString(C);}if(S||z){var M=this.sortFeaturesByKey?p.evaluate(A,{},r):void 0,T={id:x,text:S,icon:z,index:b,sourceLayerIndex:w,geometry:Ga(g),properties:g.properties,type:bl[g.type],sortKey:M};if(this.features.push(T),z&&(c[z.name]=!0),S){var E=a.evaluate(A,{},r).join(","),P="map"===i.get("text-rotation-alignment")&&"point"!==i.get("symbol-placement");this.allowVerticalPlacement=this.writingModes&&this.writingModes.indexOf(Iu.vertical)>=0;for(var B=0,V=S.sections;B<V.length;B+=1){var F=V[B];if(F.image)c[F.image.name]=!0;else{var D=ei(S.toString()),L=F.fontStack||E,R=h[L]=h[L]||{};this.calculateGlyphDependencies(F.text,R,P,this.allowVerticalPlacement,D);}}}}}}"line"===i.get("symbol-placement")&&(this.features=function(t){var e={},r={},n=[],i=0;function a(e){n.push(t[e]),i++;}function o(t,e,i){var a=r[t];return delete r[t],r[e]=a,n[a].geometry[0].pop(),n[a].geometry[0]=n[a].geometry[0].concat(i[0]),a}function s(t,r,i){var a=e[r];return delete e[r],e[t]=a,n[a].geometry[0].shift(),n[a].geometry[0]=i[0].concat(n[a].geometry[0]),a}function u(t,e,r){var n=r?e[0][e[0].length-1]:e[0][0];return t+":"+n.x+":"+n.y}for(var l=0;l<t.length;l++){var p=t[l],c=p.geometry,h=p.text?p.text.toString():null;if(h){var f=u(h,c),y=u(h,c,!0);if(f in r&&y in e&&r[f]!==e[y]){var d=s(f,y,c),m=o(f,y,n[d].geometry);delete e[f],delete r[y],r[u(h,n[m].geometry,!0)]=m,n[d].geometry=null;}else f in r?o(f,y,c):y in e?s(f,y,c):(a(l),e[f]=i-1,r[y]=i-1);}else a(l);}return n.filter((function(t){return t.geometry}))}(this.features)),this.sortFeaturesByKey&&this.features.sort((function(t,e){return t.sortKey-e.sortKey}));}},zl.prototype.update=function(t,e,r){this.stateDependentLayers.length&&(this.text.programConfigurations.updatePaintArrays(t,e,this.layers,r),this.icon.programConfigurations.updatePaintArrays(t,e,this.layers,r));},zl.prototype.isEmpty=function(){return 0===this.symbolInstances.length&&!this.hasRTLText},zl.prototype.uploadPending=function(){return !this.uploaded||this.text.programConfigurations.needsUpload||this.icon.programConfigurations.needsUpload},zl.prototype.upload=function(t){!this.uploaded&&this.hasDebugData()&&(this.textCollisionBox.upload(t),this.iconCollisionBox.upload(t),this.textCollisionCircle.upload(t),this.iconCollisionCircle.upload(t)),this.text.upload(t,this.sortFeaturesByY,!this.uploaded,this.text.programConfigurations.needsUpload),this.icon.upload(t,this.sortFeaturesByY,!this.uploaded,this.icon.programConfigurations.needsUpload),this.uploaded=!0;},zl.prototype.destroyDebugData=function(){this.textCollisionBox.destroy(),this.iconCollisionBox.destroy(),this.textCollisionCircle.destroy(),this.iconCollisionCircle.destroy();},zl.prototype.destroy=function(){this.text.destroy(),this.icon.destroy(),this.hasDebugData()&&this.destroyDebugData();},zl.prototype.addToLineVertexArray=function(t,e){var r=this.lineVertexArray.length;if(void 0!==t.segment){for(var n=t.dist(e[t.segment+1]),i=t.dist(e[t.segment]),a={},o=t.segment+1;o<e.length;o++)a[o]={x:e[o].x,y:e[o].y,tileUnitDistanceFromAnchor:n},o<e.length-1&&(n+=e[o+1].dist(e[o]));for(var s=t.segment||0;s>=0;s--)a[s]={x:e[s].x,y:e[s].y,tileUnitDistanceFromAnchor:i},s>0&&(i+=e[s-1].dist(e[s]));for(var u=0;u<e.length;u++){var l=a[u];this.lineVertexArray.emplaceBack(l.x,l.y,l.tileUnitDistanceFromAnchor);}}return {lineStartIndex:r,lineLength:this.lineVertexArray.length-r}},zl.prototype.addSymbols=function(t,e,r,n,i,a,o,s,u,l,p,c){for(var h=t.indexArray,f=t.layoutVertexArray,y=t.segments.prepareSegment(4*e.length,f,h,a.sortKey),d=this.glyphOffsetArray.length,m=y.vertexLength,v=this.allowVerticalPlacement&&o===Iu.vertical?Math.PI/2:0,g=a.text&&a.text.sections,x=0;x<e.length;x++){var b=e[x],w=b.tl,_=b.tr,A=b.bl,S=b.br,k=b.tex,I=b.pixelOffsetTL,z=b.pixelOffsetBR,C=b.minFontScaleX,M=b.minFontScaleY,T=b.glyphOffset,E=b.isSDF,P=b.sectionIndex,B=y.vertexLength,V=T[1];_l(f,s.x,s.y,w.x,V+w.y,k.x,k.y,r,E,I.x,I.y,C,M),_l(f,s.x,s.y,_.x,V+_.y,k.x+k.w,k.y,r,E,z.x,I.y,C,M),_l(f,s.x,s.y,A.x,V+A.y,k.x,k.y+k.h,r,E,I.x,z.y,C,M),_l(f,s.x,s.y,S.x,V+S.y,k.x+k.w,k.y+k.h,r,E,z.x,z.y,C,M),Al(t.dynamicLayoutVertexArray,s,v),h.emplaceBack(B,B+1,B+2),h.emplaceBack(B+1,B+2,B+3),y.vertexLength+=4,y.primitiveLength+=2,this.glyphOffsetArray.emplaceBack(T[0]),x!==e.length-1&&P===e[x+1].sectionIndex||t.programConfigurations.populatePaintArrays(f.length,a,a.index,{},c,g&&g[P]);}t.placedSymbolArray.emplaceBack(s.x,s.y,d,this.glyphOffsetArray.length-d,m,u,l,s.segment,r?r[0]:0,r?r[1]:0,n[0],n[1],o,0,!1,0,p);},zl.prototype._addCollisionDebugVertex=function(t,e,r,n,i,a){return e.emplaceBack(0,0),t.emplaceBack(r.x,r.y,n,i,Math.round(a.x),Math.round(a.y))},zl.prototype.addCollisionDebugVertices=function(t,e,r,n,a,o,s,u){var l=a.segments.prepareSegment(4,a.layoutVertexArray,a.indexArray),p=l.vertexLength,c=a.layoutVertexArray,h=a.collisionVertexArray,f=s.anchorX,y=s.anchorY;if(this._addCollisionDebugVertex(c,h,o,f,y,new i(t,e)),this._addCollisionDebugVertex(c,h,o,f,y,new i(r,e)),this._addCollisionDebugVertex(c,h,o,f,y,new i(r,n)),this._addCollisionDebugVertex(c,h,o,f,y,new i(t,n)),l.vertexLength+=4,u){var d=a.indexArray;d.emplaceBack(p,p+1,p+2),d.emplaceBack(p,p+2,p+3),l.primitiveLength+=2;}else{var m=a.indexArray;m.emplaceBack(p,p+1),m.emplaceBack(p+1,p+2),m.emplaceBack(p+2,p+3),m.emplaceBack(p+3,p),l.primitiveLength+=4;}},zl.prototype.addDebugCollisionBoxes=function(t,e,r,n){for(var i=t;i<e;i++){var a=this.collisionBoxArray.get(i),o=a.radius>0;this.addCollisionDebugVertices(a.x1,a.y1,a.x2,a.y2,o?n?this.textCollisionCircle:this.iconCollisionCircle:n?this.textCollisionBox:this.iconCollisionBox,a.anchorPoint,r,o);}},zl.prototype.generateCollisionDebugBuffers=function(){this.hasDebugData()&&this.destroyDebugData(),this.textCollisionBox=new Il(Zi,Gs.members,ta),this.iconCollisionBox=new Il(Zi,Gs.members,ta),this.textCollisionCircle=new Il(Zi,Zs.members,Qi),this.iconCollisionCircle=new Il(Zi,Zs.members,Qi);for(var t=0;t<this.symbolInstances.length;t++){var e=this.symbolInstances.get(t);this.addDebugCollisionBoxes(e.textBoxStartIndex,e.textBoxEndIndex,e,!0),this.addDebugCollisionBoxes(e.verticalTextBoxStartIndex,e.verticalTextBoxEndIndex,e,!0),this.addDebugCollisionBoxes(e.iconBoxStartIndex,e.iconBoxEndIndex,e,!1),this.addDebugCollisionBoxes(e.verticalIconBoxStartIndex,e.verticalIconBoxEndIndex,e,!1);}},zl.prototype._deserializeCollisionBoxesForSymbol=function(t,e,r,n,i,a,o,s,u){for(var l={},p=e;p<r;p++){var c=t.get(p);if(0===c.radius){l.textBox={x1:c.x1,y1:c.y1,x2:c.x2,y2:c.y2,anchorPointX:c.anchorPointX,anchorPointY:c.anchorPointY},l.textFeatureIndex=c.featureIndex;break}l.textCircles||(l.textCircles=[],l.textFeatureIndex=c.featureIndex),l.textCircles.push(c.anchorPointX,c.anchorPointY,c.radius,c.signedDistanceFromAnchor,1);}for(var h=n;h<i;h++){var f=t.get(h);if(0===f.radius){l.verticalTextBox={x1:f.x1,y1:f.y1,x2:f.x2,y2:f.y2,anchorPointX:f.anchorPointX,anchorPointY:f.anchorPointY},l.verticalTextFeatureIndex=f.featureIndex;break}}for(var y=a;y<o;y++){var d=t.get(y);if(0===d.radius){l.iconBox={x1:d.x1,y1:d.y1,x2:d.x2,y2:d.y2,anchorPointX:d.anchorPointX,anchorPointY:d.anchorPointY},l.iconFeatureIndex=d.featureIndex;break}}for(var m=s;m<u;m++){var v=t.get(m);if(0===v.radius){l.verticalIconBox={x1:v.x1,y1:v.y1,x2:v.x2,y2:v.y2,anchorPointX:v.anchorPointX,anchorPointY:v.anchorPointY},l.verticalIconFeatureIndex=v.featureIndex;break}}return l},zl.prototype.deserializeCollisionBoxes=function(t){this.collisionArrays=[];for(var e=0;e<this.symbolInstances.length;e++){var r=this.symbolInstances.get(e);this.collisionArrays.push(this._deserializeCollisionBoxesForSymbol(t,r.textBoxStartIndex,r.textBoxEndIndex,r.verticalTextBoxStartIndex,r.verticalTextBoxEndIndex,r.iconBoxStartIndex,r.iconBoxEndIndex,r.verticalIconBoxStartIndex,r.verticalIconBoxEndIndex));}},zl.prototype.hasTextData=function(){return this.text.segments.get().length>0},zl.prototype.hasIconData=function(){return this.icon.segments.get().length>0},zl.prototype.hasDebugData=function(){return this.textCollisionBox&&this.iconCollisionBox&&this.textCollisionCircle&&this.iconCollisionCircle},zl.prototype.hasTextCollisionBoxData=function(){return this.hasDebugData()&&this.textCollisionBox.segments.get().length>0},zl.prototype.hasIconCollisionBoxData=function(){return this.hasDebugData()&&this.iconCollisionBox.segments.get().length>0},zl.prototype.hasTextCollisionCircleData=function(){return this.hasDebugData()&&this.textCollisionCircle.segments.get().length>0},zl.prototype.hasIconCollisionCircleData=function(){return this.hasDebugData()&&this.iconCollisionCircle.segments.get().length>0},zl.prototype.addIndicesForPlacedSymbol=function(t,e){for(var r=t.placedSymbolArray.get(e),n=r.vertexStartIndex+4*r.numGlyphs,i=r.vertexStartIndex;i<n;i+=4)t.indexArray.emplaceBack(i,i+1,i+2),t.indexArray.emplaceBack(i+1,i+2,i+3);},zl.prototype.getSortedSymbolIndexes=function(t){if(this.sortedAngle===t&&void 0!==this.symbolInstanceIndexes)return this.symbolInstanceIndexes;for(var e=Math.sin(t),r=Math.cos(t),n=[],i=[],a=[],o=0;o<this.symbolInstances.length;++o){a.push(o);var s=this.symbolInstances.get(o);n.push(0|Math.round(e*s.anchorX+r*s.anchorY)),i.push(s.featureIndex);}return a.sort((function(t,e){return n[t]-n[e]||i[e]-i[t]})),a},zl.prototype.addToSortKeyRanges=function(t,e){var r=this.sortKeyRanges[this.sortKeyRanges.length-1];r&&r.sortKey===e?r.symbolInstanceEnd=t+1:this.sortKeyRanges.push({sortKey:e,symbolInstanceStart:t,symbolInstanceEnd:t+1});},zl.prototype.sortFeatures=function(t){var e=this;if(this.sortFeaturesByY&&this.sortedAngle!==t&&!(this.text.segments.get().length>1||this.icon.segments.get().length>1)){this.symbolInstanceIndexes=this.getSortedSymbolIndexes(t),this.sortedAngle=t,this.text.indexArray.clear(),this.icon.indexArray.clear(),this.featureSortOrder=[];for(var r=0,n=this.symbolInstanceIndexes;r<n.length;r+=1){var i=this.symbolInstances.get(n[r]);this.featureSortOrder.push(i.featureIndex),[i.rightJustifiedTextSymbolIndex,i.centerJustifiedTextSymbolIndex,i.leftJustifiedTextSymbolIndex].forEach((function(t,r,n){t>=0&&n.indexOf(t)===r&&e.addIndicesForPlacedSymbol(e.text,t);})),i.verticalPlacedTextSymbolIndex>=0&&this.addIndicesForPlacedSymbol(this.text,i.verticalPlacedTextSymbolIndex),i.placedIconSymbolIndex>=0&&this.addIndicesForPlacedSymbol(this.icon,i.placedIconSymbolIndex),i.verticalPlacedIconSymbolIndex>=0&&this.addIndicesForPlacedSymbol(this.icon,i.verticalPlacedIconSymbolIndex);}this.text.indexBuffer&&this.text.indexBuffer.updateData(this.text.indexArray),this.icon.indexBuffer&&this.icon.indexBuffer.updateData(this.icon.indexArray);}},Xn("SymbolBucket",zl,{omit:["layers","collisionBoxArray","features","compareText"]}),zl.MAX_GLYPHS=65535,zl.addDynamicAttributes=Al;var Cl=new Ti({"symbol-placement":new ki(Ct.layout_symbol["symbol-placement"]),"symbol-spacing":new ki(Ct.layout_symbol["symbol-spacing"]),"symbol-avoid-edges":new ki(Ct.layout_symbol["symbol-avoid-edges"]),"symbol-sort-key":new Ii(Ct.layout_symbol["symbol-sort-key"]),"symbol-z-order":new ki(Ct.layout_symbol["symbol-z-order"]),"icon-allow-overlap":new ki(Ct.layout_symbol["icon-allow-overlap"]),"icon-ignore-placement":new ki(Ct.layout_symbol["icon-ignore-placement"]),"icon-optional":new ki(Ct.layout_symbol["icon-optional"]),"icon-rotation-alignment":new ki(Ct.layout_symbol["icon-rotation-alignment"]),"icon-size":new Ii(Ct.layout_symbol["icon-size"]),"icon-text-fit":new ki(Ct.layout_symbol["icon-text-fit"]),"icon-text-fit-padding":new ki(Ct.layout_symbol["icon-text-fit-padding"]),"icon-image":new Ii(Ct.layout_symbol["icon-image"]),"icon-rotate":new Ii(Ct.layout_symbol["icon-rotate"]),"icon-padding":new ki(Ct.layout_symbol["icon-padding"]),"icon-keep-upright":new ki(Ct.layout_symbol["icon-keep-upright"]),"icon-offset":new Ii(Ct.layout_symbol["icon-offset"]),"icon-anchor":new Ii(Ct.layout_symbol["icon-anchor"]),"icon-pitch-alignment":new ki(Ct.layout_symbol["icon-pitch-alignment"]),"text-pitch-alignment":new ki(Ct.layout_symbol["text-pitch-alignment"]),"text-rotation-alignment":new ki(Ct.layout_symbol["text-rotation-alignment"]),"text-field":new Ii(Ct.layout_symbol["text-field"]),"text-font":new Ii(Ct.layout_symbol["text-font"]),"text-size":new Ii(Ct.layout_symbol["text-size"]),"text-max-width":new Ii(Ct.layout_symbol["text-max-width"]),"text-line-height":new ki(Ct.layout_symbol["text-line-height"]),"text-letter-spacing":new Ii(Ct.layout_symbol["text-letter-spacing"]),"text-justify":new Ii(Ct.layout_symbol["text-justify"]),"text-radial-offset":new Ii(Ct.layout_symbol["text-radial-offset"]),"text-variable-anchor":new ki(Ct.layout_symbol["text-variable-anchor"]),"text-anchor":new Ii(Ct.layout_symbol["text-anchor"]),"text-max-angle":new ki(Ct.layout_symbol["text-max-angle"]),"text-writing-mode":new ki(Ct.layout_symbol["text-writing-mode"]),"text-rotate":new Ii(Ct.layout_symbol["text-rotate"]),"text-padding":new ki(Ct.layout_symbol["text-padding"]),"text-keep-upright":new ki(Ct.layout_symbol["text-keep-upright"]),"text-transform":new Ii(Ct.layout_symbol["text-transform"]),"text-offset":new Ii(Ct.layout_symbol["text-offset"]),"text-allow-overlap":new ki(Ct.layout_symbol["text-allow-overlap"]),"text-ignore-placement":new ki(Ct.layout_symbol["text-ignore-placement"]),"text-optional":new ki(Ct.layout_symbol["text-optional"])}),Ml={paint:new Ti({"icon-opacity":new Ii(Ct.paint_symbol["icon-opacity"]),"icon-color":new Ii(Ct.paint_symbol["icon-color"]),"icon-halo-color":new Ii(Ct.paint_symbol["icon-halo-color"]),"icon-halo-width":new Ii(Ct.paint_symbol["icon-halo-width"]),"icon-halo-blur":new Ii(Ct.paint_symbol["icon-halo-blur"]),"icon-translate":new ki(Ct.paint_symbol["icon-translate"]),"icon-translate-anchor":new ki(Ct.paint_symbol["icon-translate-anchor"]),"text-opacity":new Ii(Ct.paint_symbol["text-opacity"]),"text-color":new Ii(Ct.paint_symbol["text-color"],{runtimeType:Ut,getOverride:function(t){return t.textColor},hasOverride:function(t){return !!t.textColor}}),"text-halo-color":new Ii(Ct.paint_symbol["text-halo-color"]),"text-halo-width":new Ii(Ct.paint_symbol["text-halo-width"]),"text-halo-blur":new Ii(Ct.paint_symbol["text-halo-blur"]),"text-translate":new ki(Ct.paint_symbol["text-translate"]),"text-translate-anchor":new ki(Ct.paint_symbol["text-translate-anchor"])}),layout:Cl},Tl=function(t){this.type=t.property.overrides?t.property.overrides.runtimeType:Dt,this.defaultValue=t;};Tl.prototype.evaluate=function(t){if(t.formattedSection){var e=this.defaultValue.property.overrides;if(e&&e.hasOverride(t.formattedSection))return e.getOverride(t.formattedSection)}return t.feature&&t.featureState?this.defaultValue.evaluate(t.feature,t.featureState):this.defaultValue.property.specification.default},Tl.prototype.eachChild=function(t){this.defaultValue.isConstant()||t(this.defaultValue.value._styleExpression.expression);},Tl.prototype.outputDefined=function(){return !1},Tl.prototype.serialize=function(){return null},Xn("FormatSectionOverride",Tl,{omit:["defaultValue"]});var El=function(t){function e(e){t.call(this,e,Ml);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.recalculate=function(e,r){if(t.prototype.recalculate.call(this,e,r),"auto"===this.layout.get("icon-rotation-alignment")&&(this.layout._values["icon-rotation-alignment"]="point"!==this.layout.get("symbol-placement")?"map":"viewport"),"auto"===this.layout.get("text-rotation-alignment")&&(this.layout._values["text-rotation-alignment"]="point"!==this.layout.get("symbol-placement")?"map":"viewport"),"auto"===this.layout.get("text-pitch-alignment")&&(this.layout._values["text-pitch-alignment"]=this.layout.get("text-rotation-alignment")),"auto"===this.layout.get("icon-pitch-alignment")&&(this.layout._values["icon-pitch-alignment"]=this.layout.get("icon-rotation-alignment")),"point"===this.layout.get("symbol-placement")){var n=this.layout.get("text-writing-mode");if(n){for(var i=[],a=0,o=n;a<o.length;a+=1){var s=o[a];i.indexOf(s)<0&&i.push(s);}this.layout._values["text-writing-mode"]=i;}else this.layout._values["text-writing-mode"]=["horizontal"];}this._setPaintOverrides();},e.prototype.getValueAndResolveTokens=function(t,e,r,n){var i=this.layout.get(t).evaluate(e,{},r,n),a=this._unevaluatedLayout._values[t];return a.isDataDriven()||Qr(a.value)||!i?i:function(t,e){return e.replace(/{([^{}]+)}/g,(function(e,r){return r in t?String(t[r]):""}))}(e.properties,i)},e.prototype.createBucket=function(t){return new zl(t)},e.prototype.queryRadius=function(){return 0},e.prototype.queryIntersectsFeature=function(){return !1},e.prototype._setPaintOverrides=function(){for(var t=0,r=Ml.paint.overridableProperties;t<r.length;t+=1){var n=r[t];if(e.hasPaintOverride(this.layout,n)){var i,a=this.paint.get(n),o=new Tl(a),s=new Wr(o,a.property.specification);i="constant"===a.value.kind||"source"===a.value.kind?new en("source",s):new rn("composite",s,a.value.zoomStops,a.value._interpolationType),this.paint._values[n]=new Ai(a.property,i,a.parameters);}}},e.prototype._handleOverridablePaintPropertyUpdate=function(t,r,n){return !(!this.layout||r.isDataDriven()||n.isDataDriven())&&e.hasPaintOverride(this.layout,t)},e.hasPaintOverride=function(t,e){var r=t.get("text-field"),n=Ml.paint.properties[e],i=!1,a=function(t){for(var e=0,r=t;e<r.length;e+=1)if(n.overrides&&n.overrides.hasOverride(r[e]))return void(i=!0)};if("constant"===r.value.kind&&r.value.value instanceof te)a(r.value.value.sections);else if("source"===r.value.kind){var o=function(t){i||(t instanceof oe&&ie(t.value)===Kt?a(t.value.sections):t instanceof pe?a(t.sections):t.eachChild(o));},s=r.value;s._styleExpression&&o(s._styleExpression.expression);}return i},e}(Ei),Pl={paint:new Ti({"background-color":new ki(Ct.paint_background["background-color"]),"background-pattern":new Ci(Ct.paint_background["background-pattern"]),"background-opacity":new ki(Ct.paint_background["background-opacity"])})},Bl=function(t){function e(e){t.call(this,e,Pl);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(Ei),Vl={paint:new Ti({"raster-opacity":new ki(Ct.paint_raster["raster-opacity"]),"raster-hue-rotate":new ki(Ct.paint_raster["raster-hue-rotate"]),"raster-brightness-min":new ki(Ct.paint_raster["raster-brightness-min"]),"raster-brightness-max":new ki(Ct.paint_raster["raster-brightness-max"]),"raster-saturation":new ki(Ct.paint_raster["raster-saturation"]),"raster-contrast":new ki(Ct.paint_raster["raster-contrast"]),"raster-resampling":new ki(Ct.paint_raster["raster-resampling"]),"raster-fade-duration":new ki(Ct.paint_raster["raster-fade-duration"])})},Fl=function(t){function e(e){t.call(this,e,Vl);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e}(Ei),Dl=function(t){function e(e){t.call(this,e,{}),this.implementation=e;}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.is3D=function(){return "3d"===this.implementation.renderingMode},e.prototype.hasOffscreenPass=function(){return void 0!==this.implementation.prerender},e.prototype.recalculate=function(){},e.prototype.updateTransitions=function(){},e.prototype.hasTransition=function(){},e.prototype.serialize=function(){},e.prototype.onAdd=function(t){this.implementation.onAdd&&this.implementation.onAdd(t,t.painter.context.gl);},e.prototype.onRemove=function(t){this.implementation.onRemove&&this.implementation.onRemove(t,t.painter.context.gl);},e}(Ei),Ll={circle:fo,heatmap:So,hillshade:Io,fill:hs,"fill-extrusion":Ms,line:Us,symbol:El,background:Bl,raster:Fl},Rl=self.HTMLImageElement,Ol=self.HTMLCanvasElement,Ul=self.HTMLVideoElement,jl=self.ImageData,ql=self.ImageBitmap,Nl=function(t,e,r,n){this.context=t,this.format=r,this.texture=t.gl.createTexture(),this.update(e,n);};Nl.prototype.update=function(t,e,r){var n=t.width,i=t.height,a=!(this.size&&this.size[0]===n&&this.size[1]===i||r),o=this.context,s=o.gl;if(this.useMipmap=Boolean(e&&e.useMipmap),s.bindTexture(s.TEXTURE_2D,this.texture),o.pixelStoreUnpackFlipY.set(!1),o.pixelStoreUnpack.set(1),o.pixelStoreUnpackPremultiplyAlpha.set(this.format===s.RGBA&&(!e||!1!==e.premultiply)),a)this.size=[n,i],t instanceof Rl||t instanceof Ol||t instanceof Ul||t instanceof jl||ql&&t instanceof ql?s.texImage2D(s.TEXTURE_2D,0,this.format,this.format,s.UNSIGNED_BYTE,t):s.texImage2D(s.TEXTURE_2D,0,this.format,n,i,0,this.format,s.UNSIGNED_BYTE,t.data);else{var u=r||{x:0,y:0},l=u.x,p=u.y;t instanceof Rl||t instanceof Ol||t instanceof Ul||t instanceof jl||ql&&t instanceof ql?s.texSubImage2D(s.TEXTURE_2D,0,l,p,s.RGBA,s.UNSIGNED_BYTE,t):s.texSubImage2D(s.TEXTURE_2D,0,l,p,n,i,s.RGBA,s.UNSIGNED_BYTE,t.data);}this.useMipmap&&this.isSizePowerOfTwo()&&s.generateMipmap(s.TEXTURE_2D);},Nl.prototype.bind=function(t,e,r){var n=this.context.gl;n.bindTexture(n.TEXTURE_2D,this.texture),r!==n.LINEAR_MIPMAP_NEAREST||this.isSizePowerOfTwo()||(r=n.LINEAR),t!==this.filter&&(n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MAG_FILTER,t),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,r||t),this.filter=t),e!==this.wrap&&(n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,e),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,e),this.wrap=e);},Nl.prototype.isSizePowerOfTwo=function(){return this.size[0]===this.size[1]&&Math.log(this.size[0])/Math.LN2%1==0},Nl.prototype.destroy=function(){this.context.gl.deleteTexture(this.texture),this.texture=null;};var Kl=function(t){var e=this;this._callback=t,this._triggered=!1,"undefined"!=typeof MessageChannel&&(this._channel=new MessageChannel,this._channel.port2.onmessage=function(){e._triggered=!1,e._callback();});};Kl.prototype.trigger=function(){var t=this;this._triggered||(this._triggered=!0,this._channel?this._channel.port1.postMessage(!0):setTimeout((function(){t._triggered=!1,t._callback();}),0));},Kl.prototype.remove=function(){delete this._channel,this._callback=function(){};};var Gl=function(t,e,r){this.target=t,this.parent=e,this.mapId=r,this.callbacks={},this.tasks={},this.taskQueue=[],this.cancelCallbacks={},d(["receive","process"],this),this.invoker=new Kl(this.process),this.target.addEventListener("message",this.receive,!1),this.globalScope=S()?t:self;};function Zl(t,e,r){var n=2*Math.PI*6378137/256/Math.pow(2,r);return [t*n-2*Math.PI*6378137/2,e*n-2*Math.PI*6378137/2]}Gl.prototype.send=function(t,e,r,n,i){var a=this;void 0===i&&(i=!1);var o=Math.round(1e18*Math.random()).toString(36).substring(0,10);r&&(this.callbacks[o]=r);var s=z(this.globalScope)?void 0:[];return this.target.postMessage({id:o,type:t,hasCallback:!!r,targetMapId:n,mustQueue:i,sourceMapId:this.mapId,data:$n(e,s)},s),{cancel:function(){r&&delete a.callbacks[o],a.target.postMessage({id:o,type:"<cancel>",targetMapId:n,sourceMapId:a.mapId});}}},Gl.prototype.receive=function(t){var e=t.data,r=e.id;if(r&&(!e.targetMapId||this.mapId===e.targetMapId))if("<cancel>"===e.type){delete this.tasks[r];var n=this.cancelCallbacks[r];delete this.cancelCallbacks[r],n&&n();}else S()||e.mustQueue?(this.tasks[r]=e,this.taskQueue.push(r),this.invoker.trigger()):this.processTask(r,e);},Gl.prototype.process=function(){if(this.taskQueue.length){var t=this.taskQueue.shift(),e=this.tasks[t];delete this.tasks[t],this.taskQueue.length&&this.invoker.trigger(),e&&this.processTask(t,e);}},Gl.prototype.processTask=function(t,e){var r=this;if("<response>"===e.type){var n=this.callbacks[t];delete this.callbacks[t],n&&(e.error?n(Wn(e.error)):n(null,Wn(e.data)));}else{var i=!1,a=z(this.globalScope)?void 0:[],o=e.hasCallback?function(e,n){i=!0,delete r.cancelCallbacks[t],r.target.postMessage({id:t,type:"<response>",sourceMapId:r.mapId,error:e?$n(e):null,data:$n(n,a)},a);}:function(t){i=!0;},s=null,u=Wn(e.data);if(this.parent[e.type])s=this.parent[e.type](e.sourceMapId,u,o);else if(this.parent.getWorkerSource){var l=e.type.split(".");s=this.parent.getWorkerSource(e.sourceMapId,l[0],u.source)[l[1]](u,o);}else o(new Error("Could not find function "+e.type));!i&&s&&s.cancel&&(this.cancelCallbacks[t]=s.cancel);}},Gl.prototype.remove=function(){this.invoker.remove(),this.target.removeEventListener("message",this.receive,!1);};var Xl=function(t,e,r){this.z=t,this.x=e,this.y=r,this.key=Yl(0,t,t,e,r);};Xl.prototype.equals=function(t){return this.z===t.z&&this.x===t.x&&this.y===t.y},Xl.prototype.url=function(t,e){var r,n,i,a,o,s=(n=this.y,i=this.z,a=Zl(256*(r=this.x),256*(n=Math.pow(2,i)-n-1),i),o=Zl(256*(r+1),256*(n+1),i),a[0]+","+a[1]+","+o[0]+","+o[1]),u=function(t,e,r){for(var n,i="",a=t;a>0;a--)i+=(e&(n=1<<a-1)?1:0)+(r&n?2:0);return i}(this.z,this.x,this.y);return t[(this.x+this.y)%t.length].replace("{prefix}",(this.x%16).toString(16)+(this.y%16).toString(16)).replace("{z}",String(this.z)).replace("{x}",String(this.x)).replace("{y}",String("tms"===e?Math.pow(2,this.z)-this.y-1:this.y)).replace("{quadkey}",u).replace("{bbox-epsg-3857}",s)},Xl.prototype.getTilePoint=function(t){var e=Math.pow(2,this.z);return new i((t.x*e-this.x)*ze,(t.y*e-this.y)*ze)},Xl.prototype.toString=function(){return this.z+"/"+this.x+"/"+this.y};var Jl=function(t,e){this.wrap=t,this.canonical=e,this.key=Yl(t,e.z,e.z,e.x,e.y);},Hl=function(t,e,r,n,i){this.overscaledZ=t,this.wrap=e,this.canonical=new Xl(r,+n,+i),this.key=Yl(e,t,r,n,i);};function Yl(t,e,r,n,i){(t*=2)<0&&(t=-1*t-1);var a=1<<r;return (a*a*t+a*i+n).toString(36)+r.toString(36)+e.toString(36)}Hl.prototype.equals=function(t){return this.overscaledZ===t.overscaledZ&&this.wrap===t.wrap&&this.canonical.equals(t.canonical)},Hl.prototype.scaledTo=function(t){var e=this.canonical.z-t;return t>this.canonical.z?new Hl(t,this.wrap,this.canonical.z,this.canonical.x,this.canonical.y):new Hl(t,this.wrap,t,this.canonical.x>>e,this.canonical.y>>e)},Hl.prototype.calculateScaledKey=function(t,e){var r=this.canonical.z-t;return t>this.canonical.z?Yl(this.wrap*+e,t,this.canonical.z,this.canonical.x,this.canonical.y):Yl(this.wrap*+e,t,t,this.canonical.x>>r,this.canonical.y>>r)},Hl.prototype.isChildOf=function(t){if(t.wrap!==this.wrap)return !1;var e=this.canonical.z-t.canonical.z;return 0===t.overscaledZ||t.overscaledZ<this.overscaledZ&&t.canonical.x===this.canonical.x>>e&&t.canonical.y===this.canonical.y>>e},Hl.prototype.children=function(t){if(this.overscaledZ>=t)return [new Hl(this.overscaledZ+1,this.wrap,this.canonical.z,this.canonical.x,this.canonical.y)];var e=this.canonical.z+1,r=2*this.canonical.x,n=2*this.canonical.y;return [new Hl(e,this.wrap,e,r,n),new Hl(e,this.wrap,e,r+1,n),new Hl(e,this.wrap,e,r,n+1),new Hl(e,this.wrap,e,r+1,n+1)]},Hl.prototype.isLessThan=function(t){return this.wrap<t.wrap||!(this.wrap>t.wrap)&&(this.overscaledZ<t.overscaledZ||!(this.overscaledZ>t.overscaledZ)&&(this.canonical.x<t.canonical.x||!(this.canonical.x>t.canonical.x)&&this.canonical.y<t.canonical.y))},Hl.prototype.wrapped=function(){return new Hl(this.overscaledZ,0,this.canonical.z,this.canonical.x,this.canonical.y)},Hl.prototype.unwrapTo=function(t){return new Hl(this.overscaledZ,t,this.canonical.z,this.canonical.x,this.canonical.y)},Hl.prototype.overscaleFactor=function(){return Math.pow(2,this.overscaledZ-this.canonical.z)},Hl.prototype.toUnwrapped=function(){return new Jl(this.wrap,this.canonical)},Hl.prototype.toString=function(){return this.overscaledZ+"/"+this.canonical.x+"/"+this.canonical.y},Hl.prototype.getTilePoint=function(t){return this.canonical.getTilePoint(new Ie(t.x-this.wrap,t.y))},Xn("CanonicalTileID",Xl),Xn("OverscaledTileID",Hl,{omit:["posMatrix"]});var $l=function(t,e,r){if(this.uid=t,e.height!==e.width)throw new RangeError("DEM tiles must be square");if(r&&"mapbox"!==r&&"terrarium"!==r)return w('"'+r+'" is not a valid encoding type. Valid types include "mapbox" and "terrarium".');this.stride=e.height;var n=this.dim=e.height-2;this.data=new Uint32Array(e.data.buffer),this.encoding=r||"mapbox";for(var i=0;i<n;i++)this.data[this._idx(-1,i)]=this.data[this._idx(0,i)],this.data[this._idx(n,i)]=this.data[this._idx(n-1,i)],this.data[this._idx(i,-1)]=this.data[this._idx(i,0)],this.data[this._idx(i,n)]=this.data[this._idx(i,n-1)];this.data[this._idx(-1,-1)]=this.data[this._idx(0,0)],this.data[this._idx(n,-1)]=this.data[this._idx(n-1,0)],this.data[this._idx(-1,n)]=this.data[this._idx(0,n-1)],this.data[this._idx(n,n)]=this.data[this._idx(n-1,n-1)];};$l.prototype.get=function(t,e){var r=new Uint8Array(this.data.buffer),n=4*this._idx(t,e);return ("terrarium"===this.encoding?this._unpackTerrarium:this._unpackMapbox)(r[n],r[n+1],r[n+2])},$l.prototype.getUnpackVector=function(){return "terrarium"===this.encoding?[256,1,1/256,32768]:[6553.6,25.6,.1,1e4]},$l.prototype._idx=function(t,e){if(t<-1||t>=this.dim+1||e<-1||e>=this.dim+1)throw new RangeError("out of range source coordinates for DEM data");return (e+1)*this.stride+(t+1)},$l.prototype._unpackMapbox=function(t,e,r){return (256*t*256+256*e+r)/10-1e4},$l.prototype._unpackTerrarium=function(t,e,r){return 256*t+e+r/256-32768},$l.prototype.getPixels=function(){return new wo({width:this.stride,height:this.stride},new Uint8Array(this.data.buffer))},$l.prototype.backfillBorder=function(t,e,r){if(this.dim!==t.dim)throw new Error("dem dimension mismatch");var n=e*this.dim,i=e*this.dim+this.dim,a=r*this.dim,o=r*this.dim+this.dim;switch(e){case-1:n=i-1;break;case 1:i=n+1;}switch(r){case-1:a=o-1;break;case 1:o=a+1;}for(var s=-e*this.dim,u=-r*this.dim,l=a;l<o;l++)for(var p=n;p<i;p++)this.data[this._idx(p,l)]=t.data[this._idx(p+s,l+u)];},Xn("DEMData",$l);var Wl=function(t){this._stringToNumber={},this._numberToString=[];for(var e=0;e<t.length;e++){var r=t[e];this._stringToNumber[r]=e,this._numberToString[e]=r;}};Wl.prototype.encode=function(t){return this._stringToNumber[t]},Wl.prototype.decode=function(t){return this._numberToString[t]};var Ql=function(t,e,r,n,i){this.type="Feature",this._vectorTileFeature=t,t._z=e,t._x=r,t._y=n,this.properties=t.properties,this.id=i;},tp={geometry:{configurable:!0}};tp.geometry.get=function(){return void 0===this._geometry&&(this._geometry=this._vectorTileFeature.toGeoJSON(this._vectorTileFeature._x,this._vectorTileFeature._y,this._vectorTileFeature._z).geometry),this._geometry},tp.geometry.set=function(t){this._geometry=t;},Ql.prototype.toJSON=function(){var t={geometry:this.geometry};for(var e in this)"_geometry"!==e&&"_vectorTileFeature"!==e&&(t[e]=this[e]);return t},Object.defineProperties(Ql.prototype,tp);var ep=function(){this.state={},this.stateChanges={},this.deletedStates={};};ep.prototype.updateState=function(t,e,r){var n=String(e);if(this.stateChanges[t]=this.stateChanges[t]||{},this.stateChanges[t][n]=this.stateChanges[t][n]||{},p(this.stateChanges[t][n],r),null===this.deletedStates[t])for(var i in this.deletedStates[t]={},this.state[t])i!==n&&(this.deletedStates[t][i]=null);else if(this.deletedStates[t]&&null===this.deletedStates[t][n])for(var a in this.deletedStates[t][n]={},this.state[t][n])r[a]||(this.deletedStates[t][n][a]=null);else for(var o in r)this.deletedStates[t]&&this.deletedStates[t][n]&&null===this.deletedStates[t][n][o]&&delete this.deletedStates[t][n][o];},ep.prototype.removeFeatureState=function(t,e,r){if(null!==this.deletedStates[t]){var n=String(e);if(this.deletedStates[t]=this.deletedStates[t]||{},r&&void 0!==e)null!==this.deletedStates[t][n]&&(this.deletedStates[t][n]=this.deletedStates[t][n]||{},this.deletedStates[t][n][r]=null);else if(void 0!==e)if(this.stateChanges[t]&&this.stateChanges[t][n])for(r in this.deletedStates[t][n]={},this.stateChanges[t][n])this.deletedStates[t][n][r]=null;else this.deletedStates[t][n]=null;else this.deletedStates[t]=null;}},ep.prototype.getState=function(t,e){var r=String(e),n=p({},(this.state[t]||{})[r],(this.stateChanges[t]||{})[r]);if(null===this.deletedStates[t])return {};if(this.deletedStates[t]){var i=this.deletedStates[t][e];if(null===i)return {};for(var a in i)delete n[a];}return n},ep.prototype.initializeTileState=function(t,e){t.setFeatureState(this.state,e);},ep.prototype.coalesceChanges=function(t,e){var r={};for(var n in this.stateChanges){this.state[n]=this.state[n]||{};var i={};for(var a in this.stateChanges[n])this.state[n][a]||(this.state[n][a]={}),p(this.state[n][a],this.stateChanges[n][a]),i[a]=this.state[n][a];r[n]=i;}for(var o in this.deletedStates){this.state[o]=this.state[o]||{};var s={};if(null===this.deletedStates[o])for(var u in this.state[o])s[u]={},this.state[o][u]={};else for(var l in this.deletedStates[o]){if(null===this.deletedStates[o][l])this.state[o][l]={};else for(var c=0,h=Object.keys(this.deletedStates[o][l]);c<h.length;c+=1)delete this.state[o][l][h[c]];s[l]=this.state[o][l];}r[o]=r[o]||{},p(r[o],s);}if(this.stateChanges={},this.deletedStates={},0!==Object.keys(r).length)for(var f in t)t[f].setFeatureState(r,e);};var rp=function(t,e){this.tileID=t,this.x=t.canonical.x,this.y=t.canonical.y,this.z=t.canonical.z,this.grid=new jn(ze,16,0),this.grid3D=new jn(ze,16,0),this.featureIndexArray=new fa,this.promoteId=e;};function np(t,e,r,n,i){return v(t,(function(t,a){var o=e instanceof Si?e.get(a):null;return o&&o.evaluate?o.evaluate(r,n,i):o}))}function ip(t){for(var e=1/0,r=1/0,n=-1/0,i=-1/0,a=0,o=t;a<o.length;a+=1){var s=o[a];e=Math.min(e,s.x),r=Math.min(r,s.y),n=Math.max(n,s.x),i=Math.max(i,s.y);}return {minX:e,minY:r,maxX:n,maxY:i}}function ap(t,e){return e-t}rp.prototype.insert=function(t,e,r,n,i,a){var o=this.featureIndexArray.length;this.featureIndexArray.emplaceBack(r,n,i);for(var s=a?this.grid3D:this.grid,u=0;u<e.length;u++){for(var l=e[u],p=[1/0,1/0,-1/0,-1/0],c=0;c<l.length;c++){var h=l[c];p[0]=Math.min(p[0],h.x),p[1]=Math.min(p[1],h.y),p[2]=Math.max(p[2],h.x),p[3]=Math.max(p[3],h.y);}p[0]<ze&&p[1]<ze&&p[2]>=0&&p[3]>=0&&s.insert(o,p[0],p[1],p[2],p[3]);}},rp.prototype.loadVTLayers=function(){return this.vtLayers||(this.vtLayers=new _s.VectorTile(new Ws(this.rawTileData)).layers,this.sourceLayerCoder=new Wl(this.vtLayers?Object.keys(this.vtLayers).sort():["_geojsonTileLayer"])),this.vtLayers},rp.prototype.query=function(t,e,r,n){var a=this;this.loadVTLayers();for(var o=t.params||{},s=ze/t.tileSize/t.scale,u=yn(o.filter),l=t.queryGeometry,p=t.queryPadding*s,c=ip(l),h=this.grid.query(c.minX-p,c.minY-p,c.maxX+p,c.maxY+p),f=ip(t.cameraQueryGeometry),y=this.grid3D.query(f.minX-p,f.minY-p,f.maxX+p,f.maxY+p,(function(e,r,n,a){return function(t,e,r,n,a){for(var o=0,s=t;o<s.length;o+=1){var u=s[o];if(e<=u.x&&r<=u.y&&n>=u.x&&a>=u.y)return !0}var l=[new i(e,r),new i(e,a),new i(n,a),new i(n,r)];if(t.length>2)for(var p=0,c=l;p<c.length;p+=1)if(no(t,c[p]))return !0;for(var h=0;h<t.length-1;h++)if(io(t[h],t[h+1],l))return !0;return !1}(t.cameraQueryGeometry,e-p,r-p,n+p,a+p)})),d=0,m=y;d<m.length;d+=1)h.push(m[d]);h.sort(ap);for(var v,g={},x=function(i){var p=h[i];if(p!==v){v=p;var c=a.featureIndexArray.get(p),f=null;a.loadMatchingFeature(g,c.bucketIndex,c.sourceLayerIndex,c.featureIndex,u,o.layers,o.availableImages,e,r,n,(function(e,r,n){return f||(f=Ga(e)),r.queryIntersectsFeature(l,e,n,f,a.z,t.transform,s,t.pixelPosMatrix)}));}},b=0;b<h.length;b++)x(b);return g},rp.prototype.loadMatchingFeature=function(t,e,r,n,i,a,o,s,u,l,p){var c=this.bucketLayerIDs[e];if(!a||function(t,e){for(var r=0;r<t.length;r++)if(e.indexOf(t[r])>=0)return !0;return !1}(a,c)){var h=this.sourceLayerCoder.decode(r),f=this.vtLayers[h].feature(n);if(i.filter(new mi(this.tileID.overscaledZ),f))for(var y=this.getId(f,h),d=0;d<c.length;d++){var m=c[d];if(!(a&&a.indexOf(m)<0)){var v=s[m];if(v){var g={};void 0!==y&&l&&(g=l.getState(v.sourceLayer||"_geojsonTileLayer",y));var x=u[m];x.paint=np(x.paint,v.paint,f,g,o),x.layout=np(x.layout,v.layout,f,g,o);var b=!p||p(f,v,g);if(b){var w=new Ql(f,this.z,this.x,this.y,y);w.layer=x;var _=t[m];void 0===_&&(_=t[m]=[]),_.push({featureIndex:n,feature:w,intersectionZ:b});}}}}}},rp.prototype.lookupSymbolFeatures=function(t,e,r,n,i,a,o,s){var u={};this.loadVTLayers();for(var l=yn(i),p=0,c=t;p<c.length;p+=1)this.loadMatchingFeature(u,r,n,c[p],l,a,o,s,e);return u},rp.prototype.hasLayer=function(t){for(var e=0,r=this.bucketLayerIDs;e<r.length;e+=1)for(var n=0,i=r[e];n<i.length;n+=1)if(t===i[n])return !0;return !1},rp.prototype.getId=function(t,e){var r=t.id;return this.promoteId&&"boolean"==typeof(r=t.properties["string"==typeof this.promoteId?this.promoteId:this.promoteId[e]])&&(r=Number(r)),r},Xn("FeatureIndex",rp,{omit:["rawTileData","sourceLayerCoder"]});var op=function(t,e){this.tileID=t,this.uid=h(),this.uses=0,this.tileSize=e,this.buckets={},this.expirationTime=null,this.queryPadding=0,this.hasSymbolBuckets=!1,this.hasRTLText=!1,this.dependencies={},this.expiredRequestCount=0,this.state="loading";};op.prototype.registerFadeDuration=function(t){var e=t+this.timeAdded;e<D.now()||this.fadeEndTime&&e<this.fadeEndTime||(this.fadeEndTime=e);},op.prototype.wasRequested=function(){return "errored"===this.state||"loaded"===this.state||"reloading"===this.state},op.prototype.loadVectorData=function(t,e,r){if(this.hasData()&&this.unloadVectorData(),this.state="loaded",t){for(var n in t.featureIndex&&(this.latestFeatureIndex=t.featureIndex,t.rawTileData?(this.latestRawTileData=t.rawTileData,this.latestFeatureIndex.rawTileData=t.rawTileData):this.latestRawTileData&&(this.latestFeatureIndex.rawTileData=this.latestRawTileData)),this.collisionBoxArray=t.collisionBoxArray,this.buckets=function(t,e){var r={};if(!e)return r;for(var n=function(){var t=a[i],n=t.layerIds.map((function(t){return e.getLayer(t)})).filter(Boolean);if(0!==n.length){t.layers=n,t.stateDependentLayerIds&&(t.stateDependentLayers=t.stateDependentLayerIds.map((function(t){return n.filter((function(e){return e.id===t}))[0]})));for(var o=0,s=n;o<s.length;o+=1)r[s[o].id]=t;}},i=0,a=t;i<a.length;i+=1)n();return r}(t.buckets,e.style),this.hasSymbolBuckets=!1,this.buckets){var i=this.buckets[n];if(i instanceof zl){if(this.hasSymbolBuckets=!0,!r)break;i.justReloaded=!0;}}if(this.hasRTLText=!1,this.hasSymbolBuckets)for(var a in this.buckets){var o=this.buckets[a];if(o instanceof zl&&o.hasRTLText){this.hasRTLText=!0,di.isLoading()||di.isLoaded()||"deferred"!==fi()||yi();break}}for(var s in this.queryPadding=0,this.buckets){var u=this.buckets[s];this.queryPadding=Math.max(this.queryPadding,e.style.getLayer(s).queryRadius(u));}t.imageAtlas&&(this.imageAtlas=t.imageAtlas),t.glyphAtlasImage&&(this.glyphAtlasImage=t.glyphAtlasImage);}else this.collisionBoxArray=new aa;},op.prototype.unloadVectorData=function(){for(var t in this.buckets)this.buckets[t].destroy();this.buckets={},this.imageAtlasTexture&&this.imageAtlasTexture.destroy(),this.imageAtlas&&(this.imageAtlas=null),this.glyphAtlasTexture&&this.glyphAtlasTexture.destroy(),this.latestFeatureIndex=null,this.state="unloaded";},op.prototype.getBucket=function(t){return this.buckets[t.id]},op.prototype.upload=function(t){for(var e in this.buckets){var r=this.buckets[e];r.uploadPending()&&r.upload(t);}var n=t.gl;this.imageAtlas&&!this.imageAtlas.uploaded&&(this.imageAtlasTexture=new Nl(t,this.imageAtlas.image,n.RGBA),this.imageAtlas.uploaded=!0),this.glyphAtlasImage&&(this.glyphAtlasTexture=new Nl(t,this.glyphAtlasImage,n.ALPHA),this.glyphAtlasImage=null);},op.prototype.prepare=function(t){this.imageAtlas&&this.imageAtlas.patchUpdatedImages(t,this.imageAtlasTexture);},op.prototype.queryRenderedFeatures=function(t,e,r,n,i,a,o,s,u,l){return this.latestFeatureIndex&&this.latestFeatureIndex.rawTileData?this.latestFeatureIndex.query({queryGeometry:n,cameraQueryGeometry:i,scale:a,tileSize:this.tileSize,pixelPosMatrix:l,transform:s,params:o,queryPadding:this.queryPadding*u},t,e,r):{}},op.prototype.querySourceFeatures=function(t,e){var r=this.latestFeatureIndex;if(r&&r.rawTileData){var n=r.loadVTLayers(),i=e?e.sourceLayer:"",a=n._geojsonTileLayer||n[i];if(a)for(var o=yn(e&&e.filter),s=this.tileID.canonical,u=s.z,l=s.x,p=s.y,c={z:u,x:l,y:p},h=0;h<a.length;h++){var f=a.feature(h);if(o.filter(new mi(this.tileID.overscaledZ),f)){var y=r.getId(f,i),d=new Ql(f,u,l,p,y);d.tile=c,t.push(d);}}}},op.prototype.hasData=function(){return "loaded"===this.state||"reloading"===this.state||"expired"===this.state},op.prototype.patternsLoaded=function(){return this.imageAtlas&&!!Object.keys(this.imageAtlas.patternPositions).length},op.prototype.setExpiryData=function(t){var e=this.expirationTime;if(t.cacheControl){var r=k(t.cacheControl);r["max-age"]&&(this.expirationTime=Date.now()+1e3*r["max-age"]);}else t.expires&&(this.expirationTime=new Date(t.expires).getTime());if(this.expirationTime){var n=Date.now(),i=!1;if(this.expirationTime>n)i=!1;else if(e)if(this.expirationTime<e)i=!0;else{var a=this.expirationTime-e;a?this.expirationTime=n+Math.max(a,3e4):i=!0;}else i=!0;i?(this.expiredRequestCount++,this.state="expired"):this.expiredRequestCount=0;}},op.prototype.getExpiryTimeout=function(){if(this.expirationTime)return this.expiredRequestCount?1e3*(1<<Math.min(this.expiredRequestCount-1,31)):Math.min(this.expirationTime-(new Date).getTime(),Math.pow(2,31)-1)},op.prototype.setFeatureState=function(t,e){if(this.latestFeatureIndex&&this.latestFeatureIndex.rawTileData&&0!==Object.keys(t).length){var r=this.latestFeatureIndex.loadVTLayers();for(var n in this.buckets)if(e.style.hasLayer(n)){var i=this.buckets[n],a=i.layers[0].sourceLayer||"_geojsonTileLayer",o=r[a],s=t[a];o&&s&&0!==Object.keys(s).length&&(i.update(s,o,this.imageAtlas&&this.imageAtlas.patternPositions||{}),e&&e.style&&(this.queryPadding=Math.max(this.queryPadding,e.style.getLayer(n).queryRadius(i))));}}},op.prototype.holdingForFade=function(){return void 0!==this.symbolFadeHoldUntil},op.prototype.symbolFadeFinished=function(){return !this.symbolFadeHoldUntil||this.symbolFadeHoldUntil<D.now()},op.prototype.clearFadeHold=function(){this.symbolFadeHoldUntil=void 0;},op.prototype.setHoldDuration=function(t){this.symbolFadeHoldUntil=D.now()+t;},op.prototype.setDependencies=function(t,e){for(var r={},n=0,i=e;n<i.length;n+=1)r[i[n]]=!0;this.dependencies[t]=r;},op.prototype.hasDependency=function(t,e){for(var r=0,n=t;r<n.length;r+=1){var i=this.dependencies[n[r]];if(i)for(var a=0,o=e;a<o.length;a+=1)if(i[o[a]])return !0}return !1};var sp=self.performance,up=function(t){this._marks={start:[t.url,"start"].join("#"),end:[t.url,"end"].join("#"),measure:t.url.toString()},sp.mark(this._marks.start);};up.prototype.finish=function(){sp.mark(this._marks.end);var t=sp.getEntriesByName(this._marks.measure);return 0===t.length&&(sp.measure(this._marks.measure,this._marks.start,this._marks.end),t=sp.getEntriesByName(this._marks.measure),sp.clearMarks(this._marks.start),sp.clearMarks(this._marks.end),sp.clearMeasures(this._marks.measure)),t},t.Actor=Gl,t.AlphaImage=bo,t.CanonicalTileID=Xl,t.CollisionBoxArray=aa,t.Color=$t,t.DEMData=$l,t.DataConstantProperty=ki,t.DictionaryCoder=Wl,t.EXTENT=ze,t.ErrorEvent=It,t.EvaluationParameters=mi,t.Event=kt,t.Evented=zt,t.FeatureIndex=rp,t.FillBucket=ls,t.FillExtrusionBucket=Is,t.ImageAtlas=ku,t.ImagePosition=Au,t.LineBucket=Ds,t.LngLat=xe,t.LngLatBounds=ge,t.MercatorCoordinate=Ie,t.ONE_EM=Hs,t.OverscaledTileID=Hl,t.Point=i,t.Point$1=i,t.Properties=Ti,t.Protobuf=Ws,t.RGBAImage=wo,t.RequestManager=N,t.RequestPerformance=up,t.ResourceType=yt,t.SegmentVector=da,t.SourceFeatureState=ep,t.StructArrayLayout1ui2=ea,t.StructArrayLayout2i4=Li,t.StructArrayLayout3ui6=Qi,t.StructArrayLayout4i8=Ri,t.SymbolBucket=zl,t.Texture=Nl,t.Tile=op,t.Transitionable=xi,t.Uniform1f=za,t.Uniform1i=Ia,t.Uniform2f=Ca,t.Uniform3f=Ma,t.Uniform4f=Ta,t.UniformColor=Ea,t.UniformMatrix4f=Ba,t.UnwrappedTileID=Jl,t.ValidationError=Mt,t.WritingMode=Iu,t.ZoomHistory=Qn,t.add=function(t,e,r){return t[0]=e[0]+r[0],t[1]=e[1]+r[1],t[2]=e[2]+r[2],t},t.addDynamicAttributes=Al,t.asyncAll=function(t,e,r){if(!t.length)return r(null,[]);var n=t.length,i=new Array(t.length),a=null;t.forEach((function(t,o){e(t,(function(t,e){t&&(a=t),i[o]=e,0==--n&&r(a,i);}));}));},t.bezier=o,t.bindAll=d,t.browser=D,t.cacheEntryPossiblyAdded=function(t){++ht>st&&(t.getActor().send("enforceCacheSizeLimit",ot),ht=0);},t.clamp=u,t.clearTileCache=function(t){var e=self.caches.delete(at);t&&e.catch(t).then((function(){return t()}));},t.clone=function(t){var e=new co(16);return e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[4]=t[4],e[5]=t[5],e[6]=t[6],e[7]=t[7],e[8]=t[8],e[9]=t[9],e[10]=t[10],e[11]=t[11],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15],e},t.clone$1=x,t.clone$2=function(t){var e=new co(3);return e[0]=t[0],e[1]=t[1],e[2]=t[2],e},t.config=L,t.create=function(){var t=new co(16);return co!=Float32Array&&(t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0),t[0]=1,t[5]=1,t[10]=1,t[15]=1,t},t.create$1=function(){var t=new co(9);return co!=Float32Array&&(t[1]=0,t[2]=0,t[3]=0,t[5]=0,t[6]=0,t[7]=0),t[0]=1,t[4]=1,t[8]=1,t},t.create$2=function(){var t=new co(4);return co!=Float32Array&&(t[1]=0,t[2]=0),t[0]=1,t[3]=1,t},t.createCommonjsModule=e,t.createExpression=tn,t.createLayout=Fi,t.createStyleLayer=function(t){return "custom"===t.type?new Dl(t):new Ll[t.type](t)},t.cross=function(t,e,r){var n=e[0],i=e[1],a=e[2],o=r[0],s=r[1],u=r[2];return t[0]=i*u-a*s,t[1]=a*o-n*u,t[2]=n*s-i*o,t},t.deepEqual=function t(e,r){if(Array.isArray(e)){if(!Array.isArray(r)||e.length!==r.length)return !1;for(var n=0;n<e.length;n++)if(!t(e[n],r[n]))return !1;return !0}if("object"==typeof e&&null!==e&&null!==r){if("object"!=typeof r)return !1;if(Object.keys(e).length!==Object.keys(r).length)return !1;for(var i in e)if(!t(e[i],r[i]))return !1;return !0}return e===r},t.dot=function(t,e){return t[0]*e[0]+t[1]*e[1]+t[2]*e[2]},t.dot$1=function(t,e){return t[0]*e[0]+t[1]*e[1]+t[2]*e[2]+t[3]*e[3]},t.ease=s,t.emitValidationErrors=Un,t.endsWith=m,t.enforceCacheSizeLimit=function(t){lt(),W&&W.then((function(e){e.keys().then((function(r){for(var n=0;n<r.length-t;n++)e.delete(r[n]);}));}));},t.evaluateSizeForFeature=Ku,t.evaluateSizeForZoom=Gu,t.evaluateVariableOffset=fl,t.evented=hi,t.extend=p,t.featureFilter=yn,t.filterObject=g,t.fromRotation=function(t,e){var r=Math.sin(e),n=Math.cos(e);return t[0]=n,t[1]=r,t[2]=0,t[3]=-r,t[4]=n,t[5]=0,t[6]=0,t[7]=0,t[8]=1,t},t.getAnchorAlignment=Ru,t.getAnchorJustification=yl,t.getArrayBuffer=bt,t.getImage=_t,t.getJSON=function(t,e){return xt(p(t,{type:"json"}),e)},t.getRTLTextPluginStatus=fi,t.getReferrer=mt,t.getVideo=function(t,e){var r,n,i=self.document.createElement("video");i.muted=!0,i.onloadstart=function(){e(null,i);};for(var a=0;a<t.length;a++){var o=self.document.createElement("source");r=t[a],n=void 0,(n=self.document.createElement("a")).href=r,(n.protocol!==self.document.location.protocol||n.host!==self.document.location.host)&&(i.crossOrigin="Anonymous"),o.src=t[a],i.appendChild(o);}return {cancel:function(){}}},t.identity=function(t){return t[0]=1,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=1,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=1,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t},t.invert=function(t,e){var r=e[0],n=e[1],i=e[2],a=e[3],o=e[4],s=e[5],u=e[6],l=e[7],p=e[8],c=e[9],h=e[10],f=e[11],y=e[12],d=e[13],m=e[14],v=e[15],g=r*s-n*o,x=r*u-i*o,b=r*l-a*o,w=n*u-i*s,_=n*l-a*s,A=i*l-a*u,S=p*d-c*y,k=p*m-h*y,I=p*v-f*y,z=c*m-h*d,C=c*v-f*d,M=h*v-f*m,T=g*M-x*C+b*z+w*I-_*k+A*S;return T?(t[0]=(s*M-u*C+l*z)*(T=1/T),t[1]=(i*C-n*M-a*z)*T,t[2]=(d*A-m*_+v*w)*T,t[3]=(h*_-c*A-f*w)*T,t[4]=(u*I-o*M-l*k)*T,t[5]=(r*M-i*I+a*k)*T,t[6]=(m*b-y*A-v*x)*T,t[7]=(p*A-h*b+f*x)*T,t[8]=(o*C-s*I+l*S)*T,t[9]=(n*I-r*C-a*S)*T,t[10]=(y*_-d*b+v*g)*T,t[11]=(c*b-p*_-f*g)*T,t[12]=(s*k-o*z-u*S)*T,t[13]=(r*z-n*k+i*S)*T,t[14]=(d*x-y*w-m*g)*T,t[15]=(p*w-c*x+h*g)*T,t):null},t.isChar=ti,t.isMapboxURL=K,t.keysDifference=function(t,e){var r=[];for(var n in t)n in e||r.push(n);return r},t.makeRequest=xt,t.mapObject=v,t.mercatorXfromLng=_e,t.mercatorYfromLat=Ae,t.mercatorZfromAltitude=Se,t.multiply=function(t,e,r){var n=e[0],i=e[1],a=e[2],o=e[3],s=e[4],u=e[5],l=e[6],p=e[7],c=e[8],h=e[9],f=e[10],y=e[11],d=e[12],m=e[13],v=e[14],g=e[15],x=r[0],b=r[1],w=r[2],_=r[3];return t[0]=x*n+b*s+w*c+_*d,t[1]=x*i+b*u+w*h+_*m,t[2]=x*a+b*l+w*f+_*v,t[3]=x*o+b*p+w*y+_*g,t[4]=(x=r[4])*n+(b=r[5])*s+(w=r[6])*c+(_=r[7])*d,t[5]=x*i+b*u+w*h+_*m,t[6]=x*a+b*l+w*f+_*v,t[7]=x*o+b*p+w*y+_*g,t[8]=(x=r[8])*n+(b=r[9])*s+(w=r[10])*c+(_=r[11])*d,t[9]=x*i+b*u+w*h+_*m,t[10]=x*a+b*l+w*f+_*v,t[11]=x*o+b*p+w*y+_*g,t[12]=(x=r[12])*n+(b=r[13])*s+(w=r[14])*c+(_=r[15])*d,t[13]=x*i+b*u+w*h+_*m,t[14]=x*a+b*l+w*f+_*v,t[15]=x*o+b*p+w*y+_*g,t},t.mvt=_s,t.normalize=function(t,e){var r=e[0],n=e[1],i=e[2],a=r*r+n*n+i*i;return a>0&&(a=1/Math.sqrt(a)),t[0]=e[0]*a,t[1]=e[1]*a,t[2]=e[2]*a,t},t.number=Je,t.offscreenCanvasSupported=ft,t.ortho=function(t,e,r,n,i,a,o){var s=1/(e-r),u=1/(n-i),l=1/(a-o);return t[0]=-2*s,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=-2*u,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=2*l,t[11]=0,t[12]=(e+r)*s,t[13]=(i+n)*u,t[14]=(o+a)*l,t[15]=1,t},t.parseGlyphPBF=function(t){return new Ws(t).readFields(vu,[])},t.pbf=Ws,t.performSymbolLayout=function(t,e,r,n,a,o,s){t.createArrays(),t.tilePixelRatio=ze/(512*t.overscaling),t.compareText={},t.iconsNeedLinear=!1;var u=t.layers[0].layout,l=t.layers[0]._unevaluatedLayout._values,p={};if("composite"===t.textSizeData.kind){var c=t.textSizeData,h=c.maxZoom;p.compositeTextSizes=[l["text-size"].possiblyEvaluate(new mi(c.minZoom),s),l["text-size"].possiblyEvaluate(new mi(h),s)];}if("composite"===t.iconSizeData.kind){var f=t.iconSizeData,y=f.maxZoom;p.compositeIconSizes=[l["icon-size"].possiblyEvaluate(new mi(f.minZoom),s),l["icon-size"].possiblyEvaluate(new mi(y),s)];}p.layoutTextSize=l["text-size"].possiblyEvaluate(new mi(t.zoom+1),s),p.layoutIconSize=l["icon-size"].possiblyEvaluate(new mi(t.zoom+1),s),p.textMaxSize=l["text-size"].possiblyEvaluate(new mi(18));for(var d=u.get("text-line-height")*Hs,m="map"===u.get("text-rotation-alignment")&&"point"!==u.get("symbol-placement"),v=u.get("text-keep-upright"),g=u.get("text-size"),x=function(){var o=_[b],l=u.get("text-font").evaluate(o,{},s).join(","),c=g.evaluate(o,{},s),h=p.layoutTextSize.evaluate(o,{},s),f=p.layoutIconSize.evaluate(o,{},s),y={horizontal:{},vertical:void 0},x=o.text,A=[0,0];if(x){var S=x.toString(),k=u.get("text-letter-spacing").evaluate(o,{},s)*Hs,I=function(t){for(var e=0,r=t;e<r.length;e+=1)if(n=r[e].charCodeAt(0),ti.Arabic(n)||ti["Arabic Supplement"](n)||ti["Arabic Extended-A"](n)||ti["Arabic Presentation Forms-A"](n)||ti["Arabic Presentation Forms-B"](n))return !1;var n;return !0}(S)?k:0,z=u.get("text-anchor").evaluate(o,{},s),C=u.get("text-variable-anchor");if(!C){var M=u.get("text-radial-offset").evaluate(o,{},s);A=M?fl(z,[M*Hs,hl]):u.get("text-offset").evaluate(o,{},s).map((function(t){return t*Hs}));}var T=m?"center":u.get("text-justify").evaluate(o,{},s),E=u.get("symbol-placement"),P="point"===E?u.get("text-max-width").evaluate(o,{},s)*Hs:0,B=function(){t.allowVerticalPlacement&&ei(S)&&(y.vertical=Tu(x,e,r,a,l,P,d,z,"left",I,A,Iu.vertical,!0,E,h,c));};if(!m&&C){for(var V="auto"===T?C.map((function(t){return yl(t)})):[T],F=!1,D=0;D<V.length;D++){var L=V[D];if(!y.horizontal[L])if(F)y.horizontal[L]=y.horizontal[0];else{var R=Tu(x,e,r,a,l,P,d,"center",L,I,A,Iu.horizontal,!1,E,h,c);R&&(y.horizontal[L]=R,F=1===R.positionedLines.length);}}B();}else{"auto"===T&&(T=yl(z));var O=Tu(x,e,r,a,l,P,d,z,T,I,A,Iu.horizontal,!1,E,h,c);O&&(y.horizontal[T]=O),B(),ei(S)&&m&&v&&(y.vertical=Tu(x,e,r,a,l,P,d,z,T,I,A,Iu.vertical,!1,E,h,c));}}var U=void 0,j=!1;if(o.icon&&o.icon.name){var q=n[o.icon.name];q&&(U=function(t,e,r){var n=Ru(r),i=e[0]-t.displaySize[0]*n.horizontalAlign,a=e[1]-t.displaySize[1]*n.verticalAlign;return {image:t,top:a,bottom:a+t.displaySize[1],left:i,right:i+t.displaySize[0]}}(a[o.icon.name],u.get("icon-offset").evaluate(o,{},s),u.get("icon-anchor").evaluate(o,{},s)),j=q.sdf,void 0===t.sdfIcons?t.sdfIcons=q.sdf:t.sdfIcons!==q.sdf&&w("Style sheet warning: Cannot mix SDF and non-SDF icons in one buffer"),q.pixelRatio!==t.pixelRatio?t.iconsNeedLinear=!0:0!==u.get("icon-rotate").constantOr(1)&&(t.iconsNeedLinear=!0));}var N=gl(y.horizontal)||y.vertical;t.iconsInText=!!N&&N.iconsInText,(N||U)&&function(t,e,r,n,a,o,s,u,l,p,c){var h=o.textMaxSize.evaluate(e,{});void 0===h&&(h=s);var f,y=t.layers[0].layout,d=y.get("icon-offset").evaluate(e,{},c),m=gl(r.horizontal),v=s/24,g=t.tilePixelRatio*v,x=t.tilePixelRatio*h/24,b=t.tilePixelRatio*u,_=t.tilePixelRatio*y.get("symbol-spacing"),A=y.get("text-padding")*t.tilePixelRatio,S=y.get("icon-padding")*t.tilePixelRatio,k=y.get("text-max-angle")/180*Math.PI,I="map"===y.get("text-rotation-alignment")&&"point"!==y.get("symbol-placement"),z="map"===y.get("icon-rotation-alignment")&&"point"!==y.get("symbol-placement"),C=y.get("symbol-placement"),M=_/2,T=y.get("icon-text-fit");n&&"none"!==T&&(t.allowVerticalPlacement&&r.vertical&&(f=Uu(n,r.vertical,T,y.get("icon-text-fit-padding"),d,v)),m&&(n=Uu(n,m,T,y.get("icon-text-fit-padding"),d,v)));var E=function(i,s){s.x<0||s.x>=ze||s.y<0||s.y>=ze||function(t,e,r,n,i,a,o,s,u,l,p,c,h,f,y,d,m,v,g,x,b,_,A,S){var k,I,z,C,M,T=t.addToLineVertexArray(e,r),E=0,P=0,B=0,V=0,F=-1,D=-1,L={},R=xa(""),O=0,U=0;if(void 0===s._unevaluatedLayout.getValue("text-radial-offset")?(O=(k=s.layout.get("text-offset").evaluate(b,{},S).map((function(t){return t*Hs})))[0],U=k[1]):(O=s.layout.get("text-radial-offset").evaluate(b,{},S)*Hs,U=hl),t.allowVerticalPlacement&&n.vertical){var j=s.layout.get("text-rotate").evaluate(b,{},S)+90;C=new al(u,r,e,l,p,c,n.vertical,h,f,y,t.overscaling,j),o&&(M=new al(u,r,e,l,p,c,o,m,v,y,t.overscaling,j));}if(i){var q=s.layout.get("icon-rotate").evaluate(b,{}),N="none"!==s.layout.get("icon-text-fit"),K=tl(i,q,A,N),G=o?tl(o,q,A,N):void 0;z=new al(u,r,e,l,p,c,i,m,v,!1,t.overscaling,q),E=4*K.length;var Z=t.iconSizeData,X=null;"source"===Z.kind?(X=[qu*s.layout.get("icon-size").evaluate(b,{})])[0]>ml&&w(t.layerIds[0]+': Value for "icon-size" is >= '+dl+'. Reduce your "icon-size".'):"composite"===Z.kind&&((X=[qu*_.compositeIconSizes[0].evaluate(b,{},S),qu*_.compositeIconSizes[1].evaluate(b,{},S)])[0]>ml||X[1]>ml)&&w(t.layerIds[0]+': Value for "icon-size" is >= '+dl+'. Reduce your "icon-size".'),t.addSymbols(t.icon,K,X,x,g,b,!1,e,T.lineStartIndex,T.lineLength,-1,S),F=t.icon.placedSymbolArray.length-1,G&&(P=4*G.length,t.addSymbols(t.icon,G,X,x,g,b,Iu.vertical,e,T.lineStartIndex,T.lineLength,-1,S),D=t.icon.placedSymbolArray.length-1);}for(var J in n.horizontal){var H=n.horizontal[J];if(!I){R=xa(H.text);var Y=s.layout.get("text-rotate").evaluate(b,{},S);I=new al(u,r,e,l,p,c,H,h,f,y,t.overscaling,Y);}var $=1===H.positionedLines.length;if(B+=vl(t,e,H,a,s,y,b,d,T,n.vertical?Iu.horizontal:Iu.horizontalOnly,$?Object.keys(n.horizontal):[J],L,F,_,S),$)break}n.vertical&&(V+=vl(t,e,n.vertical,a,s,y,b,d,T,Iu.vertical,["vertical"],L,D,_,S));var W=I?I.boxStartIndex:t.collisionBoxArray.length,Q=I?I.boxEndIndex:t.collisionBoxArray.length,tt=C?C.boxStartIndex:t.collisionBoxArray.length,et=C?C.boxEndIndex:t.collisionBoxArray.length,rt=z?z.boxStartIndex:t.collisionBoxArray.length,nt=z?z.boxEndIndex:t.collisionBoxArray.length,it=M?M.boxStartIndex:t.collisionBoxArray.length,at=M?M.boxEndIndex:t.collisionBoxArray.length;t.glyphOffsetArray.length>=zl.MAX_GLYPHS&&w("Too many glyphs being rendered in a tile. See https://github.com/mapbox/mapbox-gl-js/issues/2907"),void 0!==b.sortKey&&t.addToSortKeyRanges(t.symbolInstances.length,b.sortKey),t.symbolInstances.emplaceBack(e.x,e.y,L.right>=0?L.right:-1,L.center>=0?L.center:-1,L.left>=0?L.left:-1,L.vertical||-1,F,D,R,W,Q,tt,et,rt,nt,it,at,l,B,V,E,P,0,h,O,U);}(t,s,i,r,n,a,f,t.layers[0],t.collisionBoxArray,e.index,e.sourceLayerIndex,t.index,g,A,I,l,b,S,z,d,e,o,p,c);};if("line"===C)for(var P=0,B=function(t,e,r,n,a){for(var o=[],s=0;s<t.length;s++)for(var u=t[s],l=void 0,p=0;p<u.length-1;p++){var c=u[p],h=u[p+1];c.x<0&&h.x<0||(c.x<0?c=new i(0,c.y+(0-c.x)/(h.x-c.x)*(h.y-c.y))._round():h.x<0&&(h=new i(0,c.y+(0-c.x)/(h.x-c.x)*(h.y-c.y))._round()),c.y<0&&h.y<0||(c.y<0?c=new i(c.x+(0-c.y)/(h.y-c.y)*(h.x-c.x),0)._round():h.y<0&&(h=new i(c.x+(0-c.y)/(h.y-c.y)*(h.x-c.x),0)._round()),c.x>=n&&h.x>=n||(c.x>=n?c=new i(n,c.y+(n-c.x)/(h.x-c.x)*(h.y-c.y))._round():h.x>=n&&(h=new i(n,c.y+(n-c.x)/(h.x-c.x)*(h.y-c.y))._round()),c.y>=a&&h.y>=a||(c.y>=a?c=new i(c.x+(a-c.y)/(h.y-c.y)*(h.x-c.x),a)._round():h.y>=a&&(h=new i(c.x+(a-c.y)/(h.y-c.y)*(h.x-c.x),a)._round()),l&&c.equals(l[l.length-1])||o.push(l=[c]),l.push(h)))));}return o}(e.geometry,0,0,ze,ze);P<B.length;P+=1)for(var V=B[P],F=0,D=Wu(V,_,k,r.vertical||m,n,24,x,t.overscaling,ze);F<D.length;F+=1){var L=D[F];m&&xl(t,m.text,M,L)||E(V,L);}else if("line-center"===C)for(var R=0,O=e.geometry;R<O.length;R+=1){var U=O[R];if(U.length>1){var j=$u(U,k,r.vertical||m,n,24,x);j&&E(U,j);}}else if("Polygon"===e.type)for(var q=0,N=as(e.geometry,0);q<N.length;q+=1){var K=N[q],G=ul(K,16);E(K[0],new ju(G.x,G.y,0));}else if("LineString"===e.type)for(var Z=0,X=e.geometry;Z<X.length;Z+=1){var J=X[Z];E(J,new ju(J[0].x,J[0].y,0));}else if("Point"===e.type)for(var H=0,Y=e.geometry;H<Y.length;H+=1)for(var $=0,W=Y[H];$<W.length;$+=1){var Q=W[$];E([Q],new ju(Q.x,Q.y,0));}}(t,o,y,U,n,p,h,f,A,j,s);},b=0,_=t.features;b<_.length;b+=1)x();o&&t.generateCollisionDebugBuffers();},t.perspective=function(t,e,r,n,i){var a,o=1/Math.tan(e/2);return t[0]=o/r,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=o,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[11]=-1,t[12]=0,t[13]=0,t[15]=0,null!=i&&i!==1/0?(t[10]=(i+n)*(a=1/(n-i)),t[14]=2*i*n*a):(t[10]=-1,t[14]=-2*n),t},t.pick=function(t,e){for(var r={},n=0;n<e.length;n++){var i=e[n];i in t&&(r[i]=t[i]);}return r},t.plugin=di,t.polygonIntersectsPolygon=Ja,t.postMapLoadEvent=it,t.postTurnstileEvent=rt,t.potpack=wu,t.refProperties=["type","source","source-layer","minzoom","maxzoom","filter","layout"],t.register=Xn,t.registerForPluginStateChange=function(t){return t({pluginStatus:ui,pluginURL:li}),hi.on("pluginStateChange",t),t},t.rotate=function(t,e,r){var n=e[0],i=e[1],a=e[2],o=e[3],s=Math.sin(r),u=Math.cos(r);return t[0]=n*u+a*s,t[1]=i*u+o*s,t[2]=n*-s+a*u,t[3]=i*-s+o*u,t},t.rotateX=function(t,e,r){var n=Math.sin(r),i=Math.cos(r),a=e[4],o=e[5],s=e[6],u=e[7],l=e[8],p=e[9],c=e[10],h=e[11];return e!==t&&(t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t[12]=e[12],t[13]=e[13],t[14]=e[14],t[15]=e[15]),t[4]=a*i+l*n,t[5]=o*i+p*n,t[6]=s*i+c*n,t[7]=u*i+h*n,t[8]=l*i-a*n,t[9]=p*i-o*n,t[10]=c*i-s*n,t[11]=h*i-u*n,t},t.rotateZ=function(t,e,r){var n=Math.sin(r),i=Math.cos(r),a=e[0],o=e[1],s=e[2],u=e[3],l=e[4],p=e[5],c=e[6],h=e[7];return e!==t&&(t[8]=e[8],t[9]=e[9],t[10]=e[10],t[11]=e[11],t[12]=e[12],t[13]=e[13],t[14]=e[14],t[15]=e[15]),t[0]=a*i+l*n,t[1]=o*i+p*n,t[2]=s*i+c*n,t[3]=u*i+h*n,t[4]=l*i-a*n,t[5]=p*i-o*n,t[6]=c*i-s*n,t[7]=h*i-u*n,t},t.scale=function(t,e,r){var n=r[0],i=r[1],a=r[2];return t[0]=e[0]*n,t[1]=e[1]*n,t[2]=e[2]*n,t[3]=e[3]*n,t[4]=e[4]*i,t[5]=e[5]*i,t[6]=e[6]*i,t[7]=e[7]*i,t[8]=e[8]*a,t[9]=e[9]*a,t[10]=e[10]*a,t[11]=e[11]*a,t[12]=e[12],t[13]=e[13],t[14]=e[14],t[15]=e[15],t},t.scale$1=function(t,e,r){return t[0]=e[0]*r,t[1]=e[1]*r,t[2]=e[2]*r,t[3]=e[3]*r,t},t.scale$2=function(t,e,r){return t[0]=e[0]*r,t[1]=e[1]*r,t[2]=e[2]*r,t},t.setCacheLimits=function(t,e){ot=t,st=e;},t.setRTLTextPlugin=function(t,e,r){if(void 0===r&&(r=!1),"deferred"===ui||"loading"===ui||"loaded"===ui)throw new Error("setRTLTextPlugin cannot be called multiple times.");li=D.resolveURL(t),ui="deferred",si=e,ci(),r||yi();},t.sphericalToCartesian=function(t){var e=t[0],r=t[1],n=t[2];return r+=90,r*=Math.PI/180,n*=Math.PI/180,{x:e*Math.cos(r)*Math.sin(n),y:e*Math.sin(r)*Math.sin(n),z:e*Math.cos(n)}},t.sqrLen=function(t){var e=t[0],r=t[1];return e*e+r*r},t.styleSpec=Ct,t.sub=function(t,e,r){return t[0]=e[0]-r[0],t[1]=e[1]-r[1],t[2]=e[2]-r[2],t},t.symbolSize=Zu,t.transformMat3=function(t,e,r){var n=e[0],i=e[1],a=e[2];return t[0]=n*r[0]+i*r[3]+a*r[6],t[1]=n*r[1]+i*r[4]+a*r[7],t[2]=n*r[2]+i*r[5]+a*r[8],t},t.transformMat4=ho,t.translate=function(t,e,r){var n,i,a,o,s,u,l,p,c,h,f,y,d=r[0],m=r[1],v=r[2];return e===t?(t[12]=e[0]*d+e[4]*m+e[8]*v+e[12],t[13]=e[1]*d+e[5]*m+e[9]*v+e[13],t[14]=e[2]*d+e[6]*m+e[10]*v+e[14],t[15]=e[3]*d+e[7]*m+e[11]*v+e[15]):(i=e[1],a=e[2],o=e[3],s=e[4],u=e[5],l=e[6],p=e[7],c=e[8],h=e[9],f=e[10],y=e[11],t[0]=n=e[0],t[1]=i,t[2]=a,t[3]=o,t[4]=s,t[5]=u,t[6]=l,t[7]=p,t[8]=c,t[9]=h,t[10]=f,t[11]=y,t[12]=n*d+s*m+c*v+e[12],t[13]=i*d+u*m+h*v+e[13],t[14]=a*d+l*m+f*v+e[14],t[15]=o*d+p*m+y*v+e[15]),t},t.triggerPluginCompletionEvent=pi,t.uniqueId=h,t.validateCustomStyleLayer=function(t){var e=[],r=t.id;return void 0===r&&e.push({message:"layers."+r+': missing required property "id"'}),void 0===t.render&&e.push({message:"layers."+r+': missing required method "render"'}),t.renderingMode&&"2d"!==t.renderingMode&&"3d"!==t.renderingMode&&e.push({message:"layers."+r+': property "renderingMode" must be either "2d" or "3d"'}),e},t.validateLight=Ln,t.validateStyle=Dn,t.values=function(t){var e=[];for(var r in t)e.push(t[r]);return e},t.vectorTile=_s,t.version="1.9.0",t.warnOnce=w,t.webpSupported=R,t.window=self,t.wrap=l;}));

define(["./shared"],(function(e){"use strict";function t(e){var r=typeof e;if("number"===r||"boolean"===r||"string"===r||null==e)return JSON.stringify(e);if(Array.isArray(e)){for(var i="[",o=0,n=e;o<n.length;o+=1)i+=t(n[o])+",";return i+"]"}for(var a=Object.keys(e).sort(),s="{",l=0;l<a.length;l++)s+=JSON.stringify(a[l])+":"+t(e[a[l]])+",";return s+"}"}function r(r){for(var i="",o=0,n=e.refProperties;o<n.length;o+=1)i+="/"+t(r[n[o]]);return i}var i=function(e){this.keyCache={},e&&this.replace(e);};i.prototype.replace=function(e){this._layerConfigs={},this._layers={},this.update(e,[]);},i.prototype.update=function(t,i){for(var o=this,n=0,a=t;n<a.length;n+=1){var s=a[n];this._layerConfigs[s.id]=s;var l=this._layers[s.id]=e.createStyleLayer(s);l._featureFilter=e.featureFilter(l.filter),this.keyCache[s.id]&&delete this.keyCache[s.id];}for(var u=0,h=i;u<h.length;u+=1){var c=h[u];delete this.keyCache[c],delete this._layerConfigs[c],delete this._layers[c];}this.familiesBySource={};for(var p=0,f=function(e,t){for(var i={},o=0;o<e.length;o++){var n=t&&t[e[o].id]||r(e[o]);t&&(t[e[o].id]=n);var a=i[n];a||(a=i[n]=[]),a.push(e[o]);}var s=[];for(var l in i)s.push(i[l]);return s}(e.values(this._layerConfigs),this.keyCache);p<f.length;p+=1){var d=f[p].map((function(e){return o._layers[e.id]})),g=d[0];if("none"!==g.visibility){var m=g.source||"",v=this.familiesBySource[m];v||(v=this.familiesBySource[m]={});var y=g.sourceLayer||"_geojsonTileLayer",x=v[y];x||(x=v[y]=[]),x.push(d);}}};var o=function(t){var r={},i=[];for(var o in t){var n=t[o],a=r[o]={};for(var s in n){var l=n[+s];if(l&&0!==l.bitmap.width&&0!==l.bitmap.height){var u={x:0,y:0,w:l.bitmap.width+2,h:l.bitmap.height+2};i.push(u),a[s]={rect:u,metrics:l.metrics};}}}var h=e.potpack(i),c=new e.AlphaImage({width:h.w||1,height:h.h||1});for(var p in t){var f=t[p];for(var d in f){var g=f[+d];if(g&&0!==g.bitmap.width&&0!==g.bitmap.height){var m=r[p][d].rect;e.AlphaImage.copy(g.bitmap,c,{x:0,y:0},{x:m.x+1,y:m.y+1},g.bitmap);}}}this.image=c,this.positions=r;};e.register("GlyphAtlas",o);var n=function(t){this.tileID=new e.OverscaledTileID(t.tileID.overscaledZ,t.tileID.wrap,t.tileID.canonical.z,t.tileID.canonical.x,t.tileID.canonical.y),this.uid=t.uid,this.zoom=t.zoom,this.pixelRatio=t.pixelRatio,this.tileSize=t.tileSize,this.source=t.source,this.overscaling=this.tileID.overscaleFactor(),this.showCollisionBoxes=t.showCollisionBoxes,this.collectResourceTiming=!!t.collectResourceTiming,this.returnDependencies=!!t.returnDependencies,this.promoteId=t.promoteId;};function a(t,r,i){for(var o=new e.EvaluationParameters(r),n=0,a=t;n<a.length;n+=1)a[n].recalculate(o,i);}function s(t,r){var i=e.getArrayBuffer(t.request,(function(t,i,o,n){t?r(t):i&&r(null,{vectorTile:new e.vectorTile.VectorTile(new e.pbf(i)),rawData:i,cacheControl:o,expires:n});}));return function(){i.cancel(),r();}}n.prototype.parse=function(t,r,i,n,s){var l=this;this.status="parsing",this.data=t,this.collisionBoxArray=new e.CollisionBoxArray;var u=new e.DictionaryCoder(Object.keys(t.layers).sort()),h=new e.FeatureIndex(this.tileID,this.promoteId);h.bucketLayerIDs=[];var c,p,f,d,g={},m={featureIndex:h,iconDependencies:{},patternDependencies:{},glyphDependencies:{},availableImages:i},v=r.familiesBySource[this.source];for(var y in v){var x=t.layers[y];if(x){1===x.version&&e.warnOnce('Vector tile source "'+this.source+'" layer "'+y+'" does not use vector tile spec v2 and therefore may have some rendering errors.');for(var w=u.encode(y),S=[],I=0;I<x.length;I++){var M=x.feature(I),b=h.getId(M,y);S.push({feature:M,id:b,index:I,sourceLayerIndex:w});}for(var P=0,_=v[y];P<_.length;P+=1){var k=_[P],T=k[0];T.minzoom&&this.zoom<Math.floor(T.minzoom)||T.maxzoom&&this.zoom>=T.maxzoom||"none"!==T.visibility&&(a(k,this.zoom,i),(g[T.id]=T.createBucket({index:h.bucketLayerIDs.length,layers:k,zoom:this.zoom,pixelRatio:this.pixelRatio,overscaling:this.overscaling,collisionBoxArray:this.collisionBoxArray,sourceLayerIndex:w,sourceID:this.source})).populate(S,m,this.tileID.canonical),h.bucketLayerIDs.push(k.map((function(e){return e.id}))));}}}var C=e.mapObject(m.glyphDependencies,(function(e){return Object.keys(e).map(Number)}));Object.keys(C).length?n.send("getGlyphs",{uid:this.uid,stacks:C},(function(e,t){c||(c=e,p=t,O.call(l));})):p={};var D=Object.keys(m.iconDependencies);D.length?n.send("getImages",{icons:D,source:this.source,tileID:this.tileID,type:"icons"},(function(e,t){c||(c=e,f=t,O.call(l));})):f={};var L=Object.keys(m.patternDependencies);function O(){if(c)return s(c);if(p&&f&&d){var t=new o(p),r=new e.ImageAtlas(f,d);for(var n in g){var l=g[n];l instanceof e.SymbolBucket?(a(l.layers,this.zoom,i),e.performSymbolLayout(l,p,t.positions,f,r.iconPositions,this.showCollisionBoxes,this.tileID.canonical)):l.hasPattern&&(l instanceof e.LineBucket||l instanceof e.FillBucket||l instanceof e.FillExtrusionBucket)&&(a(l.layers,this.zoom,i),l.addFeatures(m,this.tileID.canonical,r.patternPositions));}this.status="done",s(null,{buckets:e.values(g).filter((function(e){return !e.isEmpty()})),featureIndex:h,collisionBoxArray:this.collisionBoxArray,glyphAtlasImage:t.image,imageAtlas:r,glyphMap:this.returnDependencies?p:null,iconMap:this.returnDependencies?f:null,glyphPositions:this.returnDependencies?t.positions:null});}}L.length?n.send("getImages",{icons:L,source:this.source,tileID:this.tileID,type:"patterns"},(function(e,t){c||(c=e,d=t,O.call(l));})):d={},O.call(this);};var l=function(e,t,r,i){this.actor=e,this.layerIndex=t,this.availableImages=r,this.loadVectorData=i||s,this.loading={},this.loaded={};};l.prototype.loadTile=function(t,r){var i=this,o=t.uid;this.loading||(this.loading={});var a=!!(t&&t.request&&t.request.collectResourceTiming)&&new e.RequestPerformance(t.request),s=this.loading[o]=new n(t);s.abort=this.loadVectorData(t,(function(t,n){if(delete i.loading[o],t||!n)return s.status="done",i.loaded[o]=s,r(t);var l=n.rawData,u={};n.expires&&(u.expires=n.expires),n.cacheControl&&(u.cacheControl=n.cacheControl);var h={};if(a){var c=a.finish();c&&(h.resourceTiming=JSON.parse(JSON.stringify(c)));}s.vectorTile=n.vectorTile,s.parse(n.vectorTile,i.layerIndex,i.availableImages,i.actor,(function(t,i){if(t||!i)return r(t);r(null,e.extend({rawTileData:l.slice(0)},i,u,h));})),i.loaded=i.loaded||{},i.loaded[o]=s;}));},l.prototype.reloadTile=function(e,t){var r=this,i=this.loaded,o=e.uid,n=this;if(i&&i[o]){var a=i[o];a.showCollisionBoxes=e.showCollisionBoxes;var s=function(e,i){var o=a.reloadCallback;o&&(delete a.reloadCallback,a.parse(a.vectorTile,n.layerIndex,r.availableImages,n.actor,o)),t(e,i);};"parsing"===a.status?a.reloadCallback=s:"done"===a.status&&(a.vectorTile?a.parse(a.vectorTile,this.layerIndex,this.availableImages,this.actor,s):s());}},l.prototype.abortTile=function(e,t){var r=this.loading,i=e.uid;r&&r[i]&&r[i].abort&&(r[i].abort(),delete r[i]),t();},l.prototype.removeTile=function(e,t){var r=this.loaded,i=e.uid;r&&r[i]&&delete r[i],t();};var u=e.window.ImageBitmap,h=function(){this.loaded={};};h.prototype.loadTile=function(t,r){var i=t.uid,o=t.encoding,n=t.rawImageData,a=u&&n instanceof u?this.getImageData(n):n,s=new e.DEMData(i,a,o);this.loaded=this.loaded||{},this.loaded[i]=s,r(null,s);},h.prototype.getImageData=function(t){this.offscreenCanvas&&this.offscreenCanvasContext||(this.offscreenCanvas=new OffscreenCanvas(t.width,t.height),this.offscreenCanvasContext=this.offscreenCanvas.getContext("2d")),this.offscreenCanvas.width=t.width,this.offscreenCanvas.height=t.height,this.offscreenCanvasContext.drawImage(t,0,0,t.width,t.height);var r=this.offscreenCanvasContext.getImageData(-1,-1,t.width+2,t.height+2);return this.offscreenCanvasContext.clearRect(0,0,this.offscreenCanvas.width,this.offscreenCanvas.height),new e.RGBAImage({width:r.width,height:r.height},r.data)},h.prototype.removeTile=function(e){var t=this.loaded,r=e.uid;t&&t[r]&&delete t[r];};var c={RADIUS:6378137,FLATTENING:1/298.257223563,POLAR_RADIUS:6356752.3142};function p(e){var t=0;if(e&&e.length>0){t+=Math.abs(f(e[0]));for(var r=1;r<e.length;r++)t-=Math.abs(f(e[r]));}return t}function f(e){var t,r,i,o,n,a,s=0,l=e.length;if(l>2){for(a=0;a<l;a++)a===l-2?(i=l-2,o=l-1,n=0):a===l-1?(i=l-1,o=0,n=1):(i=a,o=a+1,n=a+2),t=e[i],r=e[o],s+=(d(e[n][0])-d(t[0]))*Math.sin(d(r[1]));s=s*c.RADIUS*c.RADIUS/2;}return s}function d(e){return e*Math.PI/180}var g={geometry:function e(t){var r,i=0;switch(t.type){case"Polygon":return p(t.coordinates);case"MultiPolygon":for(r=0;r<t.coordinates.length;r++)i+=p(t.coordinates[r]);return i;case"Point":case"MultiPoint":case"LineString":case"MultiLineString":return 0;case"GeometryCollection":for(r=0;r<t.geometries.length;r++)i+=e(t.geometries[r]);return i}},ring:f};function m(e,t){return function(r){return e(r,t)}}function v(e,t){e[0]=y(e[0],t=!!t);for(var r=1;r<e.length;r++)e[r]=y(e[r],!t);return e}function y(e,t){return function(e){return g.ring(e)>=0}(e)===t?e:e.reverse()}var x=e.vectorTile.VectorTileFeature.prototype.toGeoJSON,w=function(t){this._feature=t,this.extent=e.EXTENT,this.type=t.type,this.properties=t.tags,"id"in t&&!isNaN(t.id)&&(this.id=parseInt(t.id,10));};w.prototype.loadGeometry=function(){if(1===this._feature.type){for(var t=[],r=0,i=this._feature.geometry;r<i.length;r+=1){var o=i[r];t.push([new e.Point$1(o[0],o[1])]);}return t}for(var n=[],a=0,s=this._feature.geometry;a<s.length;a+=1){for(var l=[],u=0,h=s[a];u<h.length;u+=1){var c=h[u];l.push(new e.Point$1(c[0],c[1]));}n.push(l);}return n},w.prototype.toGeoJSON=function(e,t,r){return x.call(this,e,t,r)};var S=function(t){this.layers={_geojsonTileLayer:this},this.name="_geojsonTileLayer",this.extent=e.EXTENT,this.length=t.length,this._features=t;};S.prototype.feature=function(e){return new w(this._features[e])};var I=e.vectorTile.VectorTileFeature,M=b;function b(e,t){this.options=t||{},this.features=e,this.length=e.length;}function P(e,t){this.id="number"==typeof e.id?e.id:void 0,this.type=e.type,this.rawGeometry=1===e.type?[e.geometry]:e.geometry,this.properties=e.tags,this.extent=t||4096;}b.prototype.feature=function(e){return new P(this.features[e],this.options.extent)},P.prototype.loadGeometry=function(){var t=this.rawGeometry;this.geometry=[];for(var r=0;r<t.length;r++){for(var i=t[r],o=[],n=0;n<i.length;n++)o.push(new e.Point$1(i[n][0],i[n][1]));this.geometry.push(o);}return this.geometry},P.prototype.bbox=function(){this.geometry||this.loadGeometry();for(var e=this.geometry,t=1/0,r=-1/0,i=1/0,o=-1/0,n=0;n<e.length;n++)for(var a=e[n],s=0;s<a.length;s++){var l=a[s];t=Math.min(t,l.x),r=Math.max(r,l.x),i=Math.min(i,l.y),o=Math.max(o,l.y);}return [t,i,r,o]},P.prototype.toGeoJSON=I.prototype.toGeoJSON;var _=T,k=M;function T(t){var r=new e.pbf;return function(e,t){for(var r in e.layers)t.writeMessage(3,C,e.layers[r]);}(t,r),r.finish()}function C(e,t){var r;t.writeVarintField(15,e.version||1),t.writeStringField(1,e.name||""),t.writeVarintField(5,e.extent||4096);var i={keys:[],values:[],keycache:{},valuecache:{}};for(r=0;r<e.length;r++)i.feature=e.feature(r),t.writeMessage(2,D,i);var o=i.keys;for(r=0;r<o.length;r++)t.writeStringField(3,o[r]);var n=i.values;for(r=0;r<n.length;r++)t.writeMessage(4,N,n[r]);}function D(e,t){var r=e.feature;void 0!==r.id&&t.writeVarintField(1,r.id),t.writeMessage(2,L,e),t.writeVarintField(3,r.type),t.writeMessage(4,E,r);}function L(e,t){var r=e.feature,i=e.keys,o=e.values,n=e.keycache,a=e.valuecache;for(var s in r.properties){var l=n[s];void 0===l&&(i.push(s),n[s]=l=i.length-1),t.writeVarint(l);var u=r.properties[s],h=typeof u;"string"!==h&&"boolean"!==h&&"number"!==h&&(u=JSON.stringify(u));var c=h+":"+u,p=a[c];void 0===p&&(o.push(u),a[c]=p=o.length-1),t.writeVarint(p);}}function O(e,t){return (t<<3)+(7&e)}function z(e){return e<<1^e>>31}function E(e,t){for(var r=e.loadGeometry(),i=e.type,o=0,n=0,a=r.length,s=0;s<a;s++){var l=r[s],u=1;1===i&&(u=l.length),t.writeVarint(O(1,u));for(var h=3===i?l.length-1:l.length,c=0;c<h;c++){1===c&&1!==i&&t.writeVarint(O(2,h-1));var p=l[c].x-o,f=l[c].y-n;t.writeVarint(z(p)),t.writeVarint(z(f)),o+=p,n+=f;}3===i&&t.writeVarint(O(7,1));}}function N(e,t){var r=typeof e;"string"===r?t.writeStringField(1,e):"boolean"===r?t.writeBooleanField(7,e):"number"===r&&(e%1!=0?t.writeDoubleField(3,e):e<0?t.writeSVarintField(6,e):t.writeVarintField(5,e));}function F(e,t,r,i){A(e,r,i),A(t,2*r,2*i),A(t,2*r+1,2*i+1);}function A(e,t,r){var i=e[t];e[t]=e[r],e[r]=i;}function J(e,t,r,i){var o=e-r,n=t-i;return o*o+n*n}_.fromVectorTileJs=T,_.fromGeojsonVt=function(e,t){t=t||{};var r={};for(var i in e)r[i]=new M(e[i].features,t),r[i].name=i,r[i].version=t.version,r[i].extent=t.extent;return T({layers:r})},_.GeoJSONWrapper=k;var Z=function(e){return e[0]},B=function(e){return e[1]},G=function(e,t,r,i,o){void 0===t&&(t=Z),void 0===r&&(r=B),void 0===i&&(i=64),void 0===o&&(o=Float64Array),this.nodeSize=i,this.points=e;for(var n=e.length<65536?Uint16Array:Uint32Array,a=this.ids=new n(e.length),s=this.coords=new o(2*e.length),l=0;l<e.length;l++)a[l]=l,s[2*l]=t(e[l]),s[2*l+1]=r(e[l]);!function e(t,r,i,o,n,a){if(!(n-o<=i)){var s=o+n>>1;!function e(t,r,i,o,n,a){for(;n>o;){if(n-o>600){var s=n-o+1,l=i-o+1,u=Math.log(s),h=.5*Math.exp(2*u/3),c=.5*Math.sqrt(u*h*(s-h)/s)*(l-s/2<0?-1:1);e(t,r,i,Math.max(o,Math.floor(i-l*h/s+c)),Math.min(n,Math.floor(i+(s-l)*h/s+c)),a);}var p=r[2*i+a],f=o,d=n;for(F(t,r,o,i),r[2*n+a]>p&&F(t,r,o,n);f<d;){for(F(t,r,f,d),f++,d--;r[2*f+a]<p;)f++;for(;r[2*d+a]>p;)d--;}r[2*o+a]===p?F(t,r,o,d):F(t,r,++d,n),d<=i&&(o=d+1),i<=d&&(n=d-1);}}(t,r,s,o,n,a%2),e(t,r,i,o,s-1,a+1),e(t,r,i,s+1,n,a+1);}}(a,s,i,0,a.length-1,0);};G.prototype.range=function(e,t,r,i){return function(e,t,r,i,o,n,a){for(var s,l,u=[0,e.length-1,0],h=[];u.length;){var c=u.pop(),p=u.pop(),f=u.pop();if(p-f<=a)for(var d=f;d<=p;d++)l=t[2*d+1],(s=t[2*d])>=r&&s<=o&&l>=i&&l<=n&&h.push(e[d]);else{var g=Math.floor((f+p)/2);l=t[2*g+1],(s=t[2*g])>=r&&s<=o&&l>=i&&l<=n&&h.push(e[g]);var m=(c+1)%2;(0===c?r<=s:i<=l)&&(u.push(f),u.push(g-1),u.push(m)),(0===c?o>=s:n>=l)&&(u.push(g+1),u.push(p),u.push(m));}}return h}(this.ids,this.coords,e,t,r,i,this.nodeSize)},G.prototype.within=function(e,t,r){return function(e,t,r,i,o,n){for(var a=[0,e.length-1,0],s=[],l=o*o;a.length;){var u=a.pop(),h=a.pop(),c=a.pop();if(h-c<=n)for(var p=c;p<=h;p++)J(t[2*p],t[2*p+1],r,i)<=l&&s.push(e[p]);else{var f=Math.floor((c+h)/2),d=t[2*f],g=t[2*f+1];J(d,g,r,i)<=l&&s.push(e[f]);var m=(u+1)%2;(0===u?r-o<=d:i-o<=g)&&(a.push(c),a.push(f-1),a.push(m)),(0===u?r+o>=d:i+o>=g)&&(a.push(f+1),a.push(h),a.push(m));}}return s}(this.ids,this.coords,e,t,r,this.nodeSize)};var Y={minZoom:0,maxZoom:16,radius:40,extent:512,nodeSize:64,log:!1,generateId:!1,reduce:null,map:function(e){return e}},R=function(e){this.options=$(Object.create(Y),e),this.trees=new Array(this.options.maxZoom+1);};function j(e,t,r,i,o){return {x:e,y:t,zoom:1/0,id:r,parentId:-1,numPoints:i,properties:o}}function V(e,t){var r=e.geometry.coordinates,i=r[1];return {x:q(r[0]),y:U(i),zoom:1/0,index:t,parentId:-1}}function X(e){return {type:"Feature",id:e.id,properties:W(e),geometry:{type:"Point",coordinates:[(i=e.x,360*(i-.5)),(t=e.y,r=(180-360*t)*Math.PI/180,360*Math.atan(Math.exp(r))/Math.PI-90)]}};var t,r,i;}function W(e){var t=e.numPoints,r=t>=1e4?Math.round(t/1e3)+"k":t>=1e3?Math.round(t/100)/10+"k":t;return $($({},e.properties),{cluster:!0,cluster_id:e.id,point_count:t,point_count_abbreviated:r})}function q(e){return e/360+.5}function U(e){var t=Math.sin(e*Math.PI/180),r=.5-.25*Math.log((1+t)/(1-t))/Math.PI;return r<0?0:r>1?1:r}function $(e,t){for(var r in t)e[r]=t[r];return e}function H(e){return e.x}function K(e){return e.y}function Q(e,t,r,i,o,n){var a=o-r,s=n-i;if(0!==a||0!==s){var l=((e-r)*a+(t-i)*s)/(a*a+s*s);l>1?(r=o,i=n):l>0&&(r+=a*l,i+=s*l);}return (a=e-r)*a+(s=t-i)*s}function ee(e,t,r,i){var o={id:void 0===e?null:e,type:t,geometry:r,tags:i,minX:1/0,minY:1/0,maxX:-1/0,maxY:-1/0};return function(e){var t=e.geometry,r=e.type;if("Point"===r||"MultiPoint"===r||"LineString"===r)te(e,t);else if("Polygon"===r||"MultiLineString"===r)for(var i=0;i<t.length;i++)te(e,t[i]);else if("MultiPolygon"===r)for(i=0;i<t.length;i++)for(var o=0;o<t[i].length;o++)te(e,t[i][o]);}(o),o}function te(e,t){for(var r=0;r<t.length;r+=3)e.minX=Math.min(e.minX,t[r]),e.minY=Math.min(e.minY,t[r+1]),e.maxX=Math.max(e.maxX,t[r]),e.maxY=Math.max(e.maxY,t[r+1]);}function re(e,t,r,i){if(t.geometry){var o=t.geometry.coordinates,n=t.geometry.type,a=Math.pow(r.tolerance/((1<<r.maxZoom)*r.extent),2),s=[],l=t.id;if(r.promoteId?l=t.properties[r.promoteId]:r.generateId&&(l=i||0),"Point"===n)ie(o,s);else if("MultiPoint"===n)for(var u=0;u<o.length;u++)ie(o[u],s);else if("LineString"===n)oe(o,s,a,!1);else if("MultiLineString"===n){if(r.lineMetrics){for(u=0;u<o.length;u++)oe(o[u],s=[],a,!1),e.push(ee(l,"LineString",s,t.properties));return}ne(o,s,a,!1);}else if("Polygon"===n)ne(o,s,a,!0);else{if("MultiPolygon"!==n){if("GeometryCollection"===n){for(u=0;u<t.geometry.geometries.length;u++)re(e,{id:l,geometry:t.geometry.geometries[u],properties:t.properties},r,i);return}throw new Error("Input data is not a valid GeoJSON object.")}for(u=0;u<o.length;u++){var h=[];ne(o[u],h,a,!0),s.push(h);}}e.push(ee(l,n,s,t.properties));}}function ie(e,t){t.push(ae(e[0])),t.push(se(e[1])),t.push(0);}function oe(e,t,r,i){for(var o,n,a=0,s=0;s<e.length;s++){var l=ae(e[s][0]),u=se(e[s][1]);t.push(l),t.push(u),t.push(0),s>0&&(a+=i?(o*u-l*n)/2:Math.sqrt(Math.pow(l-o,2)+Math.pow(u-n,2))),o=l,n=u;}var h=t.length-3;t[2]=1,function e(t,r,i,o){for(var n,a=o,s=i-r>>1,l=i-r,u=t[r],h=t[r+1],c=t[i],p=t[i+1],f=r+3;f<i;f+=3){var d=Q(t[f],t[f+1],u,h,c,p);if(d>a)n=f,a=d;else if(d===a){var g=Math.abs(f-s);g<l&&(n=f,l=g);}}a>o&&(n-r>3&&e(t,r,n,o),t[n+2]=a,i-n>3&&e(t,n,i,o));}(t,0,h,r),t[h+2]=1,t.size=Math.abs(a),t.start=0,t.end=t.size;}function ne(e,t,r,i){for(var o=0;o<e.length;o++){var n=[];oe(e[o],n,r,i),t.push(n);}}function ae(e){return e/360+.5}function se(e){var t=Math.sin(e*Math.PI/180),r=.5-.25*Math.log((1+t)/(1-t))/Math.PI;return r<0?0:r>1?1:r}function le(e,t,r,i,o,n,a,s){if(i/=t,n>=(r/=t)&&a<i)return e;if(a<r||n>=i)return null;for(var l=[],u=0;u<e.length;u++){var h=e[u],c=h.geometry,p=h.type,f=0===o?h.minX:h.minY,d=0===o?h.maxX:h.maxY;if(f>=r&&d<i)l.push(h);else if(!(d<r||f>=i)){var g=[];if("Point"===p||"MultiPoint"===p)ue(c,g,r,i,o);else if("LineString"===p)he(c,g,r,i,o,!1,s.lineMetrics);else if("MultiLineString"===p)pe(c,g,r,i,o,!1);else if("Polygon"===p)pe(c,g,r,i,o,!0);else if("MultiPolygon"===p)for(var m=0;m<c.length;m++){var v=[];pe(c[m],v,r,i,o,!0),v.length&&g.push(v);}if(g.length){if(s.lineMetrics&&"LineString"===p){for(m=0;m<g.length;m++)l.push(ee(h.id,p,g[m],h.tags));continue}"LineString"!==p&&"MultiLineString"!==p||(1===g.length?(p="LineString",g=g[0]):p="MultiLineString"),"Point"!==p&&"MultiPoint"!==p||(p=3===g.length?"Point":"MultiPoint"),l.push(ee(h.id,p,g,h.tags));}}}return l.length?l:null}function ue(e,t,r,i,o){for(var n=0;n<e.length;n+=3){var a=e[n+o];a>=r&&a<=i&&(t.push(e[n]),t.push(e[n+1]),t.push(e[n+2]));}}function he(e,t,r,i,o,n,a){for(var s,l,u=ce(e),h=0===o?de:ge,c=e.start,p=0;p<e.length-3;p+=3){var f=e[p],d=e[p+1],g=e[p+2],m=e[p+3],v=e[p+4],y=0===o?f:d,x=0===o?m:v,w=!1;a&&(s=Math.sqrt(Math.pow(f-m,2)+Math.pow(d-v,2))),y<r?x>r&&(l=h(u,f,d,m,v,r),a&&(u.start=c+s*l)):y>i?x<i&&(l=h(u,f,d,m,v,i),a&&(u.start=c+s*l)):fe(u,f,d,g),x<r&&y>=r&&(l=h(u,f,d,m,v,r),w=!0),x>i&&y<=i&&(l=h(u,f,d,m,v,i),w=!0),!n&&w&&(a&&(u.end=c+s*l),t.push(u),u=ce(e)),a&&(c+=s);}var S=e.length-3;f=e[S],d=e[S+1],g=e[S+2],(y=0===o?f:d)>=r&&y<=i&&fe(u,f,d,g),S=u.length-3,n&&S>=3&&(u[S]!==u[0]||u[S+1]!==u[1])&&fe(u,u[0],u[1],u[2]),u.length&&t.push(u);}function ce(e){var t=[];return t.size=e.size,t.start=e.start,t.end=e.end,t}function pe(e,t,r,i,o,n){for(var a=0;a<e.length;a++)he(e[a],t,r,i,o,n,!1);}function fe(e,t,r,i){e.push(t),e.push(r),e.push(i);}function de(e,t,r,i,o,n){var a=(n-t)/(i-t);return e.push(n),e.push(r+(o-r)*a),e.push(1),a}function ge(e,t,r,i,o,n){var a=(n-r)/(o-r);return e.push(t+(i-t)*a),e.push(n),e.push(1),a}function me(e,t){for(var r=[],i=0;i<e.length;i++){var o,n=e[i],a=n.type;if("Point"===a||"MultiPoint"===a||"LineString"===a)o=ve(n.geometry,t);else if("MultiLineString"===a||"Polygon"===a){o=[];for(var s=0;s<n.geometry.length;s++)o.push(ve(n.geometry[s],t));}else if("MultiPolygon"===a)for(o=[],s=0;s<n.geometry.length;s++){for(var l=[],u=0;u<n.geometry[s].length;u++)l.push(ve(n.geometry[s][u],t));o.push(l);}r.push(ee(n.id,a,o,n.tags));}return r}function ve(e,t){var r=[];r.size=e.size,void 0!==e.start&&(r.start=e.start,r.end=e.end);for(var i=0;i<e.length;i+=3)r.push(e[i]+t,e[i+1],e[i+2]);return r}function ye(e,t){if(e.transformed)return e;var r,i,o,n=1<<e.z,a=e.x,s=e.y;for(r=0;r<e.features.length;r++){var l=e.features[r],u=l.geometry,h=l.type;if(l.geometry=[],1===h)for(i=0;i<u.length;i+=2)l.geometry.push(xe(u[i],u[i+1],t,n,a,s));else for(i=0;i<u.length;i++){var c=[];for(o=0;o<u[i].length;o+=2)c.push(xe(u[i][o],u[i][o+1],t,n,a,s));l.geometry.push(c);}}return e.transformed=!0,e}function xe(e,t,r,i,o,n){return [Math.round(r*(e*i-o)),Math.round(r*(t*i-n))]}function we(e,t,r,i,o){for(var n=t===o.maxZoom?0:o.tolerance/((1<<t)*o.extent),a={features:[],numPoints:0,numSimplified:0,numFeatures:0,source:null,x:r,y:i,z:t,transformed:!1,minX:2,minY:1,maxX:-1,maxY:0},s=0;s<e.length;s++){a.numFeatures++,Se(a,e[s],n,o);var l=e[s].minX,u=e[s].minY,h=e[s].maxX,c=e[s].maxY;l<a.minX&&(a.minX=l),u<a.minY&&(a.minY=u),h>a.maxX&&(a.maxX=h),c>a.maxY&&(a.maxY=c);}return a}function Se(e,t,r,i){var o=t.geometry,n=t.type,a=[];if("Point"===n||"MultiPoint"===n)for(var s=0;s<o.length;s+=3)a.push(o[s]),a.push(o[s+1]),e.numPoints++,e.numSimplified++;else if("LineString"===n)Ie(a,o,e,r,!1,!1);else if("MultiLineString"===n||"Polygon"===n)for(s=0;s<o.length;s++)Ie(a,o[s],e,r,"Polygon"===n,0===s);else if("MultiPolygon"===n)for(var l=0;l<o.length;l++){var u=o[l];for(s=0;s<u.length;s++)Ie(a,u[s],e,r,!0,0===s);}if(a.length){var h=t.tags||null;if("LineString"===n&&i.lineMetrics){for(var c in h={},t.tags)h[c]=t.tags[c];h.mapbox_clip_start=o.start/o.size,h.mapbox_clip_end=o.end/o.size;}var p={geometry:a,type:"Polygon"===n||"MultiPolygon"===n?3:"LineString"===n||"MultiLineString"===n?2:1,tags:h};null!==t.id&&(p.id=t.id),e.features.push(p);}}function Ie(e,t,r,i,o,n){var a=i*i;if(i>0&&t.size<(o?a:i))r.numPoints+=t.length/3;else{for(var s=[],l=0;l<t.length;l+=3)(0===i||t[l+2]>a)&&(r.numSimplified++,s.push(t[l]),s.push(t[l+1])),r.numPoints++;o&&function(e,t){for(var r=0,i=0,o=e.length,n=o-2;i<o;n=i,i+=2)r+=(e[i]-e[n])*(e[i+1]+e[n+1]);if(r>0===t)for(i=0,o=e.length;i<o/2;i+=2){var a=e[i],s=e[i+1];e[i]=e[o-2-i],e[i+1]=e[o-1-i],e[o-2-i]=a,e[o-1-i]=s;}}(s,n),e.push(s);}}function Me(e,t){var r=(t=this.options=function(e,t){for(var r in t)e[r]=t[r];return e}(Object.create(this.options),t)).debug;if(r&&console.time("preprocess data"),t.maxZoom<0||t.maxZoom>24)throw new Error("maxZoom should be in the 0-24 range");if(t.promoteId&&t.generateId)throw new Error("promoteId and generateId cannot be used together.");var i=function(e,t){var r=[];if("FeatureCollection"===e.type)for(var i=0;i<e.features.length;i++)re(r,e.features[i],t,i);else re(r,"Feature"===e.type?e:{geometry:e},t);return r}(e,t);this.tiles={},this.tileCoords=[],r&&(console.timeEnd("preprocess data"),console.log("index: maxZoom: %d, maxPoints: %d",t.indexMaxZoom,t.indexMaxPoints),console.time("generate tiles"),this.stats={},this.total=0),(i=function(e,t){var r=t.buffer/t.extent,i=e,o=le(e,1,-1-r,r,0,-1,2,t),n=le(e,1,1-r,2+r,0,-1,2,t);return (o||n)&&(i=le(e,1,-r,1+r,0,-1,2,t)||[],o&&(i=me(o,1).concat(i)),n&&(i=i.concat(me(n,-1)))),i}(i,t)).length&&this.splitTile(i,0,0,0),r&&(i.length&&console.log("features: %d, points: %d",this.tiles[0].numFeatures,this.tiles[0].numPoints),console.timeEnd("generate tiles"),console.log("tiles generated:",this.total,JSON.stringify(this.stats)));}function be(e,t,r){return 32*((1<<e)*r+t)+e}function Pe(e,t){var r=e.tileID.canonical;if(!this._geoJSONIndex)return t(null,null);var i=this._geoJSONIndex.getTile(r.z,r.x,r.y);if(!i)return t(null,null);var o=new S(i.features),n=_(o);0===n.byteOffset&&n.byteLength===n.buffer.byteLength||(n=new Uint8Array(n)),t(null,{vectorTile:o,rawData:n.buffer});}R.prototype.load=function(e){var t=this.options,r=t.log,i=t.minZoom,o=t.maxZoom,n=t.nodeSize;r&&console.time("total time");var a="prepare "+e.length+" points";r&&console.time(a),this.points=e;for(var s=[],l=0;l<e.length;l++)e[l].geometry&&s.push(V(e[l],l));this.trees[o+1]=new G(s,H,K,n,Float32Array),r&&console.timeEnd(a);for(var u=o;u>=i;u--){var h=+Date.now();s=this._cluster(s,u),this.trees[u]=new G(s,H,K,n,Float32Array),r&&console.log("z%d: %d clusters in %dms",u,s.length,+Date.now()-h);}return r&&console.timeEnd("total time"),this},R.prototype.getClusters=function(e,t){var r=((e[0]+180)%360+360)%360-180,i=Math.max(-90,Math.min(90,e[1])),o=180===e[2]?180:((e[2]+180)%360+360)%360-180,n=Math.max(-90,Math.min(90,e[3]));if(e[2]-e[0]>=360)r=-180,o=180;else if(r>o){var a=this.getClusters([r,i,180,n],t),s=this.getClusters([-180,i,o,n],t);return a.concat(s)}for(var l=this.trees[this._limitZoom(t)],u=[],h=0,c=l.range(q(r),U(n),q(o),U(i));h<c.length;h+=1){var p=l.points[c[h]];u.push(p.numPoints?X(p):this.points[p.index]);}return u},R.prototype.getChildren=function(e){var t=this._getOriginId(e),r=this._getOriginZoom(e),i="No cluster with the specified id.",o=this.trees[r];if(!o)throw new Error(i);var n=o.points[t];if(!n)throw new Error(i);for(var a=this.options.radius/(this.options.extent*Math.pow(2,r-1)),s=[],l=0,u=o.within(n.x,n.y,a);l<u.length;l+=1){var h=o.points[u[l]];h.parentId===e&&s.push(h.numPoints?X(h):this.points[h.index]);}if(0===s.length)throw new Error(i);return s},R.prototype.getLeaves=function(e,t,r){var i=[];return this._appendLeaves(i,e,t=t||10,r=r||0,0),i},R.prototype.getTile=function(e,t,r){var i=this.trees[this._limitZoom(e)],o=Math.pow(2,e),n=this.options,a=n.radius/n.extent,s=(r-a)/o,l=(r+1+a)/o,u={features:[]};return this._addTileFeatures(i.range((t-a)/o,s,(t+1+a)/o,l),i.points,t,r,o,u),0===t&&this._addTileFeatures(i.range(1-a/o,s,1,l),i.points,o,r,o,u),t===o-1&&this._addTileFeatures(i.range(0,s,a/o,l),i.points,-1,r,o,u),u.features.length?u:null},R.prototype.getClusterExpansionZoom=function(e){for(var t=this._getOriginZoom(e)-1;t<=this.options.maxZoom;){var r=this.getChildren(e);if(t++,1!==r.length)break;e=r[0].properties.cluster_id;}return t},R.prototype._appendLeaves=function(e,t,r,i,o){for(var n=0,a=this.getChildren(t);n<a.length;n+=1){var s=a[n],l=s.properties;if(l&&l.cluster?o+l.point_count<=i?o+=l.point_count:o=this._appendLeaves(e,l.cluster_id,r,i,o):o<i?o++:e.push(s),e.length===r)break}return o},R.prototype._addTileFeatures=function(e,t,r,i,o,n){for(var a=0,s=e;a<s.length;a+=1){var l=t[s[a]],u=l.numPoints,h={type:1,geometry:[[Math.round(this.options.extent*(l.x*o-r)),Math.round(this.options.extent*(l.y*o-i))]],tags:u?W(l):this.points[l.index].properties},c=void 0;u?c=l.id:this.options.generateId?c=l.index:this.points[l.index].id&&(c=this.points[l.index].id),void 0!==c&&(h.id=c),n.features.push(h);}},R.prototype._limitZoom=function(e){return Math.max(this.options.minZoom,Math.min(e,this.options.maxZoom+1))},R.prototype._cluster=function(e,t){for(var r=[],i=this.options,o=i.reduce,n=i.radius/(i.extent*Math.pow(2,t)),a=0;a<e.length;a++){var s=e[a];if(!(s.zoom<=t)){s.zoom=t;for(var l=this.trees[t+1],u=l.within(s.x,s.y,n),h=s.numPoints||1,c=s.x*h,p=s.y*h,f=o&&h>1?this._map(s,!0):null,d=(a<<5)+(t+1)+this.points.length,g=0,m=u;g<m.length;g+=1){var v=l.points[m[g]];if(!(v.zoom<=t)){v.zoom=t;var y=v.numPoints||1;c+=v.x*y,p+=v.y*y,h+=y,v.parentId=d,o&&(f||(f=this._map(s,!0)),o(f,this._map(v)));}}1===h?r.push(s):(s.parentId=d,r.push(j(c/h,p/h,d,h,f)));}}return r},R.prototype._getOriginId=function(e){return e-this.points.length>>5},R.prototype._getOriginZoom=function(e){return (e-this.points.length)%32},R.prototype._map=function(e,t){if(e.numPoints)return t?$({},e.properties):e.properties;var r=this.points[e.index].properties,i=this.options.map(r);return t&&i===r?$({},i):i},Me.prototype.options={maxZoom:14,indexMaxZoom:5,indexMaxPoints:1e5,tolerance:3,extent:4096,buffer:64,lineMetrics:!1,promoteId:null,generateId:!1,debug:0},Me.prototype.splitTile=function(e,t,r,i,o,n,a){for(var s=[e,t,r,i],l=this.options,u=l.debug;s.length;){i=s.pop(),r=s.pop(),t=s.pop(),e=s.pop();var h=1<<t,c=be(t,r,i),p=this.tiles[c];if(!p&&(u>1&&console.time("creation"),p=this.tiles[c]=we(e,t,r,i,l),this.tileCoords.push({z:t,x:r,y:i}),u)){u>1&&(console.log("tile z%d-%d-%d (features: %d, points: %d, simplified: %d)",t,r,i,p.numFeatures,p.numPoints,p.numSimplified),console.timeEnd("creation"));var f="z"+t;this.stats[f]=(this.stats[f]||0)+1,this.total++;}if(p.source=e,o){if(t===l.maxZoom||t===o)continue;var d=1<<o-t;if(r!==Math.floor(n/d)||i!==Math.floor(a/d))continue}else if(t===l.indexMaxZoom||p.numPoints<=l.indexMaxPoints)continue;if(p.source=null,0!==e.length){u>1&&console.time("clipping");var g,m,v,y,x,w,S=.5*l.buffer/l.extent,I=.5-S,M=.5+S,b=1+S;g=m=v=y=null,x=le(e,h,r-S,r+M,0,p.minX,p.maxX,l),w=le(e,h,r+I,r+b,0,p.minX,p.maxX,l),e=null,x&&(g=le(x,h,i-S,i+M,1,p.minY,p.maxY,l),m=le(x,h,i+I,i+b,1,p.minY,p.maxY,l),x=null),w&&(v=le(w,h,i-S,i+M,1,p.minY,p.maxY,l),y=le(w,h,i+I,i+b,1,p.minY,p.maxY,l),w=null),u>1&&console.timeEnd("clipping"),s.push(g||[],t+1,2*r,2*i),s.push(m||[],t+1,2*r,2*i+1),s.push(v||[],t+1,2*r+1,2*i),s.push(y||[],t+1,2*r+1,2*i+1);}}},Me.prototype.getTile=function(e,t,r){var i=this.options,o=i.extent,n=i.debug;if(e<0||e>24)return null;var a=1<<e,s=be(e,t=(t%a+a)%a,r);if(this.tiles[s])return ye(this.tiles[s],o);n>1&&console.log("drilling down to z%d-%d-%d",e,t,r);for(var l,u=e,h=t,c=r;!l&&u>0;)u--,h=Math.floor(h/2),c=Math.floor(c/2),l=this.tiles[be(u,h,c)];return l&&l.source?(n>1&&console.log("found parent tile z%d-%d-%d",u,h,c),n>1&&console.time("drilling down"),this.splitTile(l.source,u,h,c,e,t,r),n>1&&console.timeEnd("drilling down"),this.tiles[s]?ye(this.tiles[s],o):null):null};var _e=function(t){function r(e,r,i,o){t.call(this,e,r,i,Pe),o&&(this.loadGeoJSON=o);}return t&&(r.__proto__=t),(r.prototype=Object.create(t&&t.prototype)).constructor=r,r.prototype.loadData=function(e,t){this._pendingCallback&&this._pendingCallback(null,{abandoned:!0}),this._pendingCallback=t,this._pendingLoadDataParams=e,this._state&&"Idle"!==this._state?this._state="NeedsLoadData":(this._state="Coalescing",this._loadData());},r.prototype._loadData=function(){var t=this;if(this._pendingCallback&&this._pendingLoadDataParams){var r=this._pendingCallback,i=this._pendingLoadDataParams;delete this._pendingCallback,delete this._pendingLoadDataParams;var o=!!(i&&i.request&&i.request.collectResourceTiming)&&new e.RequestPerformance(i.request);this.loadGeoJSON(i,(function(n,a){if(n||!a)return r(n);if("object"!=typeof a)return r(new Error("Input data given to '"+i.source+"' is not a valid GeoJSON object."));!function e(t,r){switch(t&&t.type||null){case"FeatureCollection":return t.features=t.features.map(m(e,r)),t;case"GeometryCollection":return t.geometries=t.geometries.map(m(e,r)),t;case"Feature":return t.geometry=e(t.geometry,r),t;case"Polygon":case"MultiPolygon":return function(e,t){return "Polygon"===e.type?e.coordinates=v(e.coordinates,t):"MultiPolygon"===e.type&&(e.coordinates=e.coordinates.map(m(v,t))),e}(t,r);default:return t}}(a,!0);try{t._geoJSONIndex=i.cluster?new R(function(t){var r=t.superclusterOptions,i=t.clusterProperties;if(!i||!r)return r;for(var o={},n={},a={accumulated:null,zoom:0},s={properties:null},l=Object.keys(i),u=0,h=l;u<h.length;u+=1){var c=h[u],p=i[c],f=p[0],d=e.createExpression(p[1]),g=e.createExpression("string"==typeof f?[f,["accumulated"],["get",c]]:f);o[c]=d.value,n[c]=g.value;}return r.map=function(e){s.properties=e;for(var t={},r=0,i=l;r<i.length;r+=1){var n=i[r];t[n]=o[n].evaluate(a,s);}return t},r.reduce=function(e,t){s.properties=t;for(var r=0,i=l;r<i.length;r+=1){var o=i[r];a.accumulated=e[o],e[o]=n[o].evaluate(a,s);}},r}(i)).load(a.features):function(e,t){return new Me(e,t)}(a,i.geojsonVtOptions);}catch(n){return r(n)}t.loaded={};var s={};if(o){var l=o.finish();l&&(s.resourceTiming={},s.resourceTiming[i.source]=JSON.parse(JSON.stringify(l)));}r(null,s);}));}},r.prototype.coalesce=function(){"Coalescing"===this._state?this._state="Idle":"NeedsLoadData"===this._state&&(this._state="Coalescing",this._loadData());},r.prototype.reloadTile=function(e,r){var i=this.loaded;return i&&i[e.uid]?t.prototype.reloadTile.call(this,e,r):this.loadTile(e,r)},r.prototype.loadGeoJSON=function(t,r){if(t.request)e.getJSON(t.request,r);else{if("string"!=typeof t.data)return r(new Error("Input data given to '"+t.source+"' is not a valid GeoJSON object."));try{return r(null,JSON.parse(t.data))}catch(e){return r(new Error("Input data given to '"+t.source+"' is not a valid GeoJSON object."))}}},r.prototype.removeSource=function(e,t){this._pendingCallback&&this._pendingCallback(null,{abandoned:!0}),t();},r.prototype.getClusterExpansionZoom=function(e,t){try{t(null,this._geoJSONIndex.getClusterExpansionZoom(e.clusterId));}catch(e){t(e);}},r.prototype.getClusterChildren=function(e,t){try{t(null,this._geoJSONIndex.getChildren(e.clusterId));}catch(e){t(e);}},r.prototype.getClusterLeaves=function(e,t){try{t(null,this._geoJSONIndex.getLeaves(e.clusterId,e.limit,e.offset));}catch(e){t(e);}},r}(l),ke=function(t){var r=this;this.self=t,this.actor=new e.Actor(t,this),this.layerIndexes={},this.availableImages={},this.workerSourceTypes={vector:l,geojson:_e},this.workerSources={},this.demWorkerSources={},this.self.registerWorkerSource=function(e,t){if(r.workerSourceTypes[e])throw new Error('Worker source with name "'+e+'" already registered.');r.workerSourceTypes[e]=t;},this.self.registerRTLTextPlugin=function(t){if(e.plugin.isParsed())throw new Error("RTL text plugin already registered.");e.plugin.applyArabicShaping=t.applyArabicShaping,e.plugin.processBidirectionalText=t.processBidirectionalText,e.plugin.processStyledBidirectionalText=t.processStyledBidirectionalText;};};return ke.prototype.setReferrer=function(e,t){this.referrer=t;},ke.prototype.setImages=function(e,t,r){this.availableImages[e]=t,r();},ke.prototype.setLayers=function(e,t,r){this.getLayerIndex(e).replace(t),r();},ke.prototype.updateLayers=function(e,t,r){this.getLayerIndex(e).update(t.layers,t.removedIds),r();},ke.prototype.loadTile=function(e,t,r){this.getWorkerSource(e,t.type,t.source).loadTile(t,r);},ke.prototype.loadDEMTile=function(e,t,r){this.getDEMWorkerSource(e,t.source).loadTile(t,r);},ke.prototype.reloadTile=function(e,t,r){this.getWorkerSource(e,t.type,t.source).reloadTile(t,r);},ke.prototype.abortTile=function(e,t,r){this.getWorkerSource(e,t.type,t.source).abortTile(t,r);},ke.prototype.removeTile=function(e,t,r){this.getWorkerSource(e,t.type,t.source).removeTile(t,r);},ke.prototype.removeDEMTile=function(e,t){this.getDEMWorkerSource(e,t.source).removeTile(t);},ke.prototype.removeSource=function(e,t,r){if(this.workerSources[e]&&this.workerSources[e][t.type]&&this.workerSources[e][t.type][t.source]){var i=this.workerSources[e][t.type][t.source];delete this.workerSources[e][t.type][t.source],void 0!==i.removeSource?i.removeSource(t,r):r();}},ke.prototype.loadWorkerSource=function(e,t,r){try{this.self.importScripts(t.url),r();}catch(e){r(e.toString());}},ke.prototype.syncRTLPluginState=function(t,r,i){try{e.plugin.setState(r);var o=e.plugin.getPluginURL();if(e.plugin.isLoaded()&&!e.plugin.isParsed()&&null!=o){this.self.importScripts(o);var n=e.plugin.isParsed();i(n?void 0:new Error("RTL Text Plugin failed to import scripts from "+o),n);}}catch(e){i(e.toString());}},ke.prototype.getAvailableImages=function(e){var t=this.availableImages[e];return t||(t=[]),t},ke.prototype.getLayerIndex=function(e){var t=this.layerIndexes[e];return t||(t=this.layerIndexes[e]=new i),t},ke.prototype.getWorkerSource=function(e,t,r){var i=this;return this.workerSources[e]||(this.workerSources[e]={}),this.workerSources[e][t]||(this.workerSources[e][t]={}),this.workerSources[e][t][r]||(this.workerSources[e][t][r]=new this.workerSourceTypes[t]({send:function(t,r,o){i.actor.send(t,r,o,e);}},this.getLayerIndex(e),this.getAvailableImages(e))),this.workerSources[e][t][r]},ke.prototype.getDEMWorkerSource=function(e,t){return this.demWorkerSources[e]||(this.demWorkerSources[e]={}),this.demWorkerSources[e][t]||(this.demWorkerSources[e][t]=new h),this.demWorkerSources[e][t]},ke.prototype.enforceCacheSizeLimit=function(t,r){e.enforceCacheSizeLimit(r);},"undefined"!=typeof WorkerGlobalScope&&void 0!==e.window&&e.window instanceof WorkerGlobalScope&&(e.window.worker=new ke(e.window)),ke}));

define(["./shared"],(function(t){"use strict";var e=t.createCommonjsModule((function(t){function e(t){return !!("undefined"!=typeof window&&"undefined"!=typeof document&&Array.prototype&&Array.prototype.every&&Array.prototype.filter&&Array.prototype.forEach&&Array.prototype.indexOf&&Array.prototype.lastIndexOf&&Array.prototype.map&&Array.prototype.some&&Array.prototype.reduce&&Array.prototype.reduceRight&&Array.isArray&&Function.prototype&&Function.prototype.bind&&Object.keys&&Object.create&&Object.getPrototypeOf&&Object.getOwnPropertyNames&&Object.isSealed&&Object.isFrozen&&Object.isExtensible&&Object.getOwnPropertyDescriptor&&Object.defineProperty&&Object.defineProperties&&Object.seal&&Object.freeze&&Object.preventExtensions&&"JSON"in window&&"parse"in JSON&&"stringify"in JSON&&function(){if(!("Worker"in window&&"Blob"in window&&"URL"in window))return !1;var t,e,i=new Blob([""],{type:"text/javascript"}),o=URL.createObjectURL(i);try{e=new Worker(o),t=!0;}catch(e){t=!1;}return e&&e.terminate(),URL.revokeObjectURL(o),t}()&&"Uint8ClampedArray"in window&&ArrayBuffer.isView&&(o=t&&t.failIfMajorPerformanceCaveat,void 0===i[o]&&(i[o]=function(t){var i=document.createElement("canvas"),o=Object.create(e.webGLContextAttributes);return o.failIfMajorPerformanceCaveat=t,i.probablySupportsContext?i.probablySupportsContext("webgl",o)||i.probablySupportsContext("experimental-webgl",o):i.supportsContext?i.supportsContext("webgl",o)||i.supportsContext("experimental-webgl",o):i.getContext("webgl",o)||i.getContext("experimental-webgl",o)}(o)),i[o]));var o;}t.exports?t.exports=e:window&&(window.mapboxgl=window.mapboxgl||{},window.mapboxgl.supported=e);var i={};e.webGLContextAttributes={antialias:!1,alpha:!0,stencil:!0,depth:!0};})),i={create:function(e,i,o){var r=t.window.document.createElement(e);return void 0!==i&&(r.className=i),o&&o.appendChild(r),r},createNS:function(e,i){return t.window.document.createElementNS(e,i)}},o=t.window.document.documentElement.style;function r(t){if(!o)return t[0];for(var e=0;e<t.length;e++)if(t[e]in o)return t[e];return t[0]}var a,n=r(["userSelect","MozUserSelect","WebkitUserSelect","msUserSelect"]);i.disableDrag=function(){o&&n&&(a=o[n],o[n]="none");},i.enableDrag=function(){o&&n&&(o[n]=a);};var s=r(["transform","WebkitTransform"]);i.setTransform=function(t,e){t.style[s]=e;};var l=!1;try{var c=Object.defineProperty({},"passive",{get:function(){l=!0;}});t.window.addEventListener("test",c,c),t.window.removeEventListener("test",c,c);}catch(t){l=!1;}i.addEventListener=function(t,e,i,o){void 0===o&&(o={}),t.addEventListener(e,i,"passive"in o&&l?o:o.capture);},i.removeEventListener=function(t,e,i,o){void 0===o&&(o={}),t.removeEventListener(e,i,"passive"in o&&l?o:o.capture);};var u=function(e){e.preventDefault(),e.stopPropagation(),t.window.removeEventListener("click",u,!0);};function h(t){var e=t.userImage;return !!(e&&e.render&&e.render())&&(t.data.replace(new Uint8Array(e.data.buffer)),!0)}i.suppressClick=function(){t.window.addEventListener("click",u,!0),t.window.setTimeout((function(){t.window.removeEventListener("click",u,!0);}),0);},i.mousePos=function(e,i){var o=e.getBoundingClientRect(),r=t.window.TouchEvent&&i instanceof t.window.TouchEvent?i.touches[0]:i;return new t.Point(r.clientX-o.left-e.clientLeft,r.clientY-o.top-e.clientTop)},i.touchPos=function(e,i){for(var o=e.getBoundingClientRect(),r=[],a="touchend"===i.type?i.changedTouches:i.touches,n=0;n<a.length;n++)r.push(new t.Point(a[n].clientX-o.left-e.clientLeft,a[n].clientY-o.top-e.clientTop));return r},i.mouseButton=function(e){return void 0!==t.window.InstallTrigger&&2===e.button&&e.ctrlKey&&t.window.navigator.platform.toUpperCase().indexOf("MAC")>=0?0:e.button},i.remove=function(t){t.parentNode&&t.parentNode.removeChild(t);};var p=function(e){function i(){e.call(this),this.images={},this.updatedImages={},this.callbackDispatchedThisFrame={},this.loaded=!1,this.requestors=[],this.patterns={},this.atlasImage=new t.RGBAImage({width:1,height:1}),this.dirty=!0;}return e&&(i.__proto__=e),(i.prototype=Object.create(e&&e.prototype)).constructor=i,i.prototype.isLoaded=function(){return this.loaded},i.prototype.setLoaded=function(t){if(this.loaded!==t&&(this.loaded=t,t)){for(var e=0,i=this.requestors;e<i.length;e+=1){var o=i[e];this._notify(o.ids,o.callback);}this.requestors=[];}},i.prototype.getImage=function(t){return this.images[t]},i.prototype.addImage=function(t,e){this._validate(t,e)&&(this.images[t]=e);},i.prototype._validate=function(e,i){var o=!0;return this._validateStretch(i.stretchX,i.data&&i.data.width)||(this.fire(new t.ErrorEvent(new Error('Image "'+e+'" has invalid "stretchX" value'))),o=!1),this._validateStretch(i.stretchY,i.data&&i.data.height)||(this.fire(new t.ErrorEvent(new Error('Image "'+e+'" has invalid "stretchY" value'))),o=!1),this._validateContent(i.content,i)||(this.fire(new t.ErrorEvent(new Error('Image "'+e+'" has invalid "content" value'))),o=!1),o},i.prototype._validateStretch=function(t,e){if(!t)return !0;for(var i=0,o=0,r=t;o<r.length;o+=1){var a=r[o];if(a[0]<i||a[1]<a[0]||e<a[1])return !1;i=a[1];}return !0},i.prototype._validateContent=function(t,e){return !(t&&(4!==t.length||t[0]<0||e.data.width<t[0]||t[1]<0||e.data.height<t[1]||t[2]<0||e.data.width<t[2]||t[3]<0||e.data.height<t[3]||t[2]<t[0]||t[3]<t[1]))},i.prototype.updateImage=function(t,e){e.version=this.images[t].version+1,this.images[t]=e,this.updatedImages[t]=!0;},i.prototype.removeImage=function(t){var e=this.images[t];delete this.images[t],delete this.patterns[t],e.userImage&&e.userImage.onRemove&&e.userImage.onRemove();},i.prototype.listImages=function(){return Object.keys(this.images)},i.prototype.getImages=function(t,e){var i=!0;if(!this.isLoaded())for(var o=0,r=t;o<r.length;o+=1)this.images[r[o]]||(i=!1);this.isLoaded()||i?this._notify(t,e):this.requestors.push({ids:t,callback:e});},i.prototype._notify=function(e,i){for(var o={},r=0,a=e;r<a.length;r+=1){var n=a[r];this.images[n]||this.fire(new t.Event("styleimagemissing",{id:n}));var s=this.images[n];s?o[n]={data:s.data.clone(),pixelRatio:s.pixelRatio,sdf:s.sdf,version:s.version,stretchX:s.stretchX,stretchY:s.stretchY,content:s.content,hasRenderCallback:Boolean(s.userImage&&s.userImage.render)}:t.warnOnce('Image "'+n+'" could not be loaded. Please make sure you have added the image with map.addImage() or a "sprite" property in your style. You can provide missing images by listening for the "styleimagemissing" map event.');}i(null,o);},i.prototype.getPixelSize=function(){var t=this.atlasImage;return {width:t.width,height:t.height}},i.prototype.getPattern=function(e){var i=this.patterns[e],o=this.getImage(e);if(!o)return null;if(i&&i.position.version===o.version)return i.position;if(i)i.position.version=o.version;else{var r={w:o.data.width+2,h:o.data.height+2,x:0,y:0},a=new t.ImagePosition(r,o);this.patterns[e]={bin:r,position:a};}return this._updatePatternAtlas(),this.patterns[e].position},i.prototype.bind=function(e){var i=e.gl;this.atlasTexture?this.dirty&&(this.atlasTexture.update(this.atlasImage),this.dirty=!1):this.atlasTexture=new t.Texture(e,this.atlasImage,i.RGBA),this.atlasTexture.bind(i.LINEAR,i.CLAMP_TO_EDGE);},i.prototype._updatePatternAtlas=function(){var e=[];for(var i in this.patterns)e.push(this.patterns[i].bin);var o=t.potpack(e),r=o.w,a=o.h,n=this.atlasImage;for(var s in n.resize({width:r||1,height:a||1}),this.patterns){var l=this.patterns[s].bin,c=l.x+1,u=l.y+1,h=this.images[s].data,p=h.width,d=h.height;t.RGBAImage.copy(h,n,{x:0,y:0},{x:c,y:u},{width:p,height:d}),t.RGBAImage.copy(h,n,{x:0,y:d-1},{x:c,y:u-1},{width:p,height:1}),t.RGBAImage.copy(h,n,{x:0,y:0},{x:c,y:u+d},{width:p,height:1}),t.RGBAImage.copy(h,n,{x:p-1,y:0},{x:c-1,y:u},{width:1,height:d}),t.RGBAImage.copy(h,n,{x:0,y:0},{x:c+p,y:u},{width:1,height:d});}this.dirty=!0;},i.prototype.beginFrame=function(){this.callbackDispatchedThisFrame={};},i.prototype.dispatchRenderCallbacks=function(t){for(var e=0,i=t;e<i.length;e+=1){var o=i[e];if(!this.callbackDispatchedThisFrame[o]){this.callbackDispatchedThisFrame[o]=!0;var r=this.images[o];h(r)&&this.updateImage(o,r);}}},i}(t.Evented),d=m,_=m,f=1e20;function m(t,e,i,o,r,a){this.fontSize=t||24,this.buffer=void 0===e?3:e,this.cutoff=o||.25,this.fontFamily=r||"sans-serif",this.fontWeight=a||"normal",this.radius=i||8;var n=this.size=this.fontSize+2*this.buffer;this.canvas=document.createElement("canvas"),this.canvas.width=this.canvas.height=n,this.ctx=this.canvas.getContext("2d"),this.ctx.font=this.fontWeight+" "+this.fontSize+"px "+this.fontFamily,this.ctx.textBaseline="middle",this.ctx.fillStyle="black",this.gridOuter=new Float64Array(n*n),this.gridInner=new Float64Array(n*n),this.f=new Float64Array(n),this.d=new Float64Array(n),this.z=new Float64Array(n+1),this.v=new Int16Array(n),this.middle=Math.round(n/2*(navigator.userAgent.indexOf("Gecko/")>=0?1.2:1));}function g(t,e,i,o,r,a,n){for(var s=0;s<e;s++){for(var l=0;l<i;l++)o[l]=t[l*e+s];for(v(o,r,a,n,i),l=0;l<i;l++)t[l*e+s]=r[l];}for(l=0;l<i;l++){for(s=0;s<e;s++)o[s]=t[l*e+s];for(v(o,r,a,n,e),s=0;s<e;s++)t[l*e+s]=Math.sqrt(r[s]);}}function v(t,e,i,o,r){i[0]=0,o[0]=-f,o[1]=+f;for(var a=1,n=0;a<r;a++){for(var s=(t[a]+a*a-(t[i[n]]+i[n]*i[n]))/(2*a-2*i[n]);s<=o[n];)s=(t[a]+a*a-(t[i[--n]]+i[n]*i[n]))/(2*a-2*i[n]);i[++n]=a,o[n]=s,o[n+1]=+f;}for(a=0,n=0;a<r;a++){for(;o[n+1]<a;)n++;e[a]=(a-i[n])*(a-i[n])+t[i[n]];}}m.prototype.draw=function(t){this.ctx.clearRect(0,0,this.size,this.size),this.ctx.fillText(t,this.buffer,this.middle);for(var e=this.ctx.getImageData(0,0,this.size,this.size),i=new Uint8ClampedArray(this.size*this.size),o=0;o<this.size*this.size;o++){var r=e.data[4*o+3]/255;this.gridOuter[o]=1===r?0:0===r?f:Math.pow(Math.max(0,.5-r),2),this.gridInner[o]=1===r?f:0===r?0:Math.pow(Math.max(0,r-.5),2);}for(g(this.gridOuter,this.size,this.size,this.f,this.d,this.v,this.z),g(this.gridInner,this.size,this.size,this.f,this.d,this.v,this.z),o=0;o<this.size*this.size;o++)i[o]=Math.max(0,Math.min(255,Math.round(255-255*((this.gridOuter[o]-this.gridInner[o])/this.radius+this.cutoff))));return i},d.default=_;var y=function(t,e){this.requestManager=t,this.localIdeographFontFamily=e,this.entries={};};y.prototype.setURL=function(t){this.url=t;},y.prototype.getGlyphs=function(e,i){var o=this,r=[];for(var a in e)for(var n=0,s=e[a];n<s.length;n+=1)r.push({stack:a,id:s[n]});t.asyncAll(r,(function(t,e){var i=t.stack,r=t.id,a=o.entries[i];a||(a=o.entries[i]={glyphs:{},requests:{}});var n=a.glyphs[r];if(void 0===n){if(n=o._tinySDF(a,i,r))return a.glyphs[r]=n,void e(null,{stack:i,id:r,glyph:n});var s=Math.floor(r/256);if(256*s>65535)e(new Error("glyphs > 65535 not supported"));else{var l=a.requests[s];l||(l=a.requests[s]=[],y.loadGlyphRange(i,s,o.url,o.requestManager,(function(t,e){if(e)for(var i in e)o._doesCharSupportLocalGlyph(+i)||(a.glyphs[+i]=e[+i]);for(var r=0,n=l;r<n.length;r+=1)(0,n[r])(t,e);delete a.requests[s];}))),l.push((function(t,o){t?e(t):o&&e(null,{stack:i,id:r,glyph:o[r]||null});}));}}else e(null,{stack:i,id:r,glyph:n});}),(function(t,e){if(t)i(t);else if(e){for(var o={},r=0,a=e;r<a.length;r+=1){var n=a[r],s=n.stack,l=n.id,c=n.glyph;(o[s]||(o[s]={}))[l]=c&&{id:c.id,bitmap:c.bitmap.clone(),metrics:c.metrics};}i(null,o);}}));},y.prototype._doesCharSupportLocalGlyph=function(e){return !!this.localIdeographFontFamily&&(t.isChar["CJK Unified Ideographs"](e)||t.isChar["Hangul Syllables"](e)||t.isChar.Hiragana(e)||t.isChar.Katakana(e))},y.prototype._tinySDF=function(e,i,o){var r=this.localIdeographFontFamily;if(r&&this._doesCharSupportLocalGlyph(o)){var a=e.tinySDF;if(!a){var n="400";/bold/i.test(i)?n="900":/medium/i.test(i)?n="500":/light/i.test(i)&&(n="200"),a=e.tinySDF=new y.TinySDF(24,3,8,.25,r,n);}return {id:o,bitmap:new t.AlphaImage({width:30,height:30},a.draw(String.fromCharCode(o))),metrics:{width:24,height:24,left:0,top:-8,advance:24}}}},y.loadGlyphRange=function(e,i,o,r,a){var n=256*i,s=n+255,l=r.transformRequest(r.normalizeGlyphsURL(o).replace("{fontstack}",e).replace("{range}",n+"-"+s),t.ResourceType.Glyphs);t.getArrayBuffer(l,(function(e,i){if(e)a(e);else if(i){for(var o={},r=0,n=t.parseGlyphPBF(i);r<n.length;r+=1){var s=n[r];o[s.id]=s;}a(null,o);}}));},y.TinySDF=d;var x=function(){this.specification=t.styleSpec.light.position;};x.prototype.possiblyEvaluate=function(e,i){return t.sphericalToCartesian(e.expression.evaluate(i))},x.prototype.interpolate=function(e,i,o){return {x:t.number(e.x,i.x,o),y:t.number(e.y,i.y,o),z:t.number(e.z,i.z,o)}};var b=new t.Properties({anchor:new t.DataConstantProperty(t.styleSpec.light.anchor),position:new x,color:new t.DataConstantProperty(t.styleSpec.light.color),intensity:new t.DataConstantProperty(t.styleSpec.light.intensity)}),w=function(e){function i(i){e.call(this),this._transitionable=new t.Transitionable(b),this.setLight(i),this._transitioning=this._transitionable.untransitioned();}return e&&(i.__proto__=e),(i.prototype=Object.create(e&&e.prototype)).constructor=i,i.prototype.getLight=function(){return this._transitionable.serialize()},i.prototype.setLight=function(e,i){if(void 0===i&&(i={}),!this._validate(t.validateLight,e,i))for(var o in e){var r=e[o];t.endsWith(o,"-transition")?this._transitionable.setTransition(o.slice(0,-"-transition".length),r):this._transitionable.setValue(o,r);}},i.prototype.updateTransitions=function(t){this._transitioning=this._transitionable.transitioned(t,this._transitioning);},i.prototype.hasTransition=function(){return this._transitioning.hasTransition()},i.prototype.recalculate=function(t){this.properties=this._transitioning.possiblyEvaluate(t);},i.prototype._validate=function(e,i,o){return (!o||!1!==o.validate)&&t.emitValidationErrors(this,e.call(t.validateStyle,t.extend({value:i,style:{glyphs:!0,sprite:!0},styleSpec:t.styleSpec})))},i}(t.Evented),E=function(t,e){this.width=t,this.height=e,this.nextRow=0,this.data=new Uint8Array(this.width*this.height),this.dashEntry={};};E.prototype.getDash=function(t,e){var i=t.join(",")+String(e);return this.dashEntry[i]||(this.dashEntry[i]=this.addDash(t,e)),this.dashEntry[i]},E.prototype.getDashRanges=function(t,e,i){var o=[],r=t.length%2==1?-t[t.length-1]*i:0,a=t[0]*i,n=!0;o.push({left:r,right:a,isDash:n,zeroLength:0===t[0]});for(var s=t[0],l=1;l<t.length;l++){var c=t[l];o.push({left:r=s*i,right:a=(s+=c)*i,isDash:n=!n,zeroLength:0===c});}return o},E.prototype.addRoundDash=function(t,e,i){for(var o=e/2,r=-i;r<=i;r++)for(var a=this.width*(this.nextRow+i+r),n=0,s=t[n],l=0;l<this.width;l++){l/s.right>1&&(s=t[++n]);var c=Math.abs(l-s.left),u=Math.abs(l-s.right),h=Math.min(c,u),p=void 0,d=r/i*(o+1);if(s.isDash){var _=o-Math.abs(d);p=Math.sqrt(h*h+_*_);}else p=o-Math.sqrt(h*h+d*d);this.data[a+l]=Math.max(0,Math.min(255,p+128));}},E.prototype.addRegularDash=function(t){for(var e=t.length-1;e>=0;--e){var i=t[e],o=t[e+1];i.zeroLength?t.splice(e,1):o&&o.isDash===i.isDash&&(o.left=i.left,t.splice(e,1));}var r=t[0],a=t[t.length-1];r.isDash===a.isDash&&(r.left=a.left-this.width,a.right=r.right+this.width);for(var n=this.width*this.nextRow,s=0,l=t[s],c=0;c<this.width;c++){c/l.right>1&&(l=t[++s]);var u=Math.abs(c-l.left),h=Math.abs(c-l.right),p=Math.min(u,h);this.data[n+c]=Math.max(0,Math.min(255,(l.isDash?p:-p)+128));}},E.prototype.addDash=function(e,i){var o=i?7:0,r=2*o+1;if(this.nextRow+r>this.height)return t.warnOnce("LineAtlas out of space"),null;for(var a=0,n=0;n<e.length;n++)a+=e[n];if(0!==a){var s=this.width/a,l=this.getDashRanges(e,this.width,s);i?this.addRoundDash(l,s,o):this.addRegularDash(l);}var c={y:(this.nextRow+o+.5)/this.height,height:2*o/this.height,width:a};return this.nextRow+=r,this.dirty=!0,c},E.prototype.bind=function(t){var e=t.gl;this.texture?(e.bindTexture(e.TEXTURE_2D,this.texture),this.dirty&&(this.dirty=!1,e.texSubImage2D(e.TEXTURE_2D,0,0,0,this.width,this.height,e.ALPHA,e.UNSIGNED_BYTE,this.data))):(this.texture=e.createTexture(),e.bindTexture(e.TEXTURE_2D,this.texture),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.REPEAT),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.REPEAT),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texImage2D(e.TEXTURE_2D,0,e.ALPHA,this.width,this.height,0,e.ALPHA,e.UNSIGNED_BYTE,this.data));};var T=function e(i,o){this.workerPool=i,this.actors=[],this.currentActor=0,this.id=t.uniqueId();for(var r=this.workerPool.acquire(this.id),a=0;a<r.length;a++){var n=new e.Actor(r[a],o,this.id);n.name="Worker "+a,this.actors.push(n);}};function I(e,i,o){var r=function(r,a){if(r)return o(r);if(a){var n=t.pick(t.extend(a,e),["tiles","minzoom","maxzoom","attribution","mapbox_logo","bounds","scheme","tileSize","encoding"]);a.vector_layers&&(n.vectorLayers=a.vector_layers,n.vectorLayerIds=n.vectorLayers.map((function(t){return t.id}))),n.tiles=i.canonicalizeTileset(n,e.url),o(null,n);}};return e.url?t.getJSON(i.transformRequest(i.normalizeSourceURL(e.url),t.ResourceType.Source),r):t.browser.frame((function(){return r(null,e)}))}T.prototype.broadcast=function(e,i,o){t.asyncAll(this.actors,(function(t,o){t.send(e,i,o);}),o=o||function(){});},T.prototype.getActor=function(){return this.currentActor=(this.currentActor+1)%this.actors.length,this.actors[this.currentActor]},T.prototype.remove=function(){this.actors.forEach((function(t){t.remove();})),this.actors=[],this.workerPool.release(this.id);},T.Actor=t.Actor;var C=function(e,i,o){this.bounds=t.LngLatBounds.convert(this.validateBounds(e)),this.minzoom=i||0,this.maxzoom=o||24;};C.prototype.validateBounds=function(t){return Array.isArray(t)&&4===t.length?[Math.max(-180,t[0]),Math.max(-90,t[1]),Math.min(180,t[2]),Math.min(90,t[3])]:[-180,-90,180,90]},C.prototype.contains=function(e){var i=Math.pow(2,e.z),o=Math.floor(t.mercatorXfromLng(this.bounds.getWest())*i),r=Math.floor(t.mercatorYfromLat(this.bounds.getNorth())*i),a=Math.ceil(t.mercatorXfromLng(this.bounds.getEast())*i),n=Math.ceil(t.mercatorYfromLat(this.bounds.getSouth())*i);return e.x>=o&&e.x<a&&e.y>=r&&e.y<n};var S=function(e){function i(i,o,r,a){if(e.call(this),this.id=i,this.dispatcher=r,this.type="vector",this.minzoom=0,this.maxzoom=22,this.scheme="xyz",this.tileSize=512,this.reparseOverscaled=!0,this.isTileClipped=!0,this._loaded=!1,t.extend(this,t.pick(o,["url","scheme","tileSize","promoteId"])),this._options=t.extend({type:"vector"},o),this._collectResourceTiming=o.collectResourceTiming,512!==this.tileSize)throw new Error("vector tile sources must have a tileSize of 512");this.setEventedParent(a);}return e&&(i.__proto__=e),(i.prototype=Object.create(e&&e.prototype)).constructor=i,i.prototype.load=function(){var e=this;this._loaded=!1,this.fire(new t.Event("dataloading",{dataType:"source"})),this._tileJSONRequest=I(this._options,this.map._requestManager,(function(i,o){e._tileJSONRequest=null,e._loaded=!0,i?e.fire(new t.ErrorEvent(i)):o&&(t.extend(e,o),o.bounds&&(e.tileBounds=new C(o.bounds,e.minzoom,e.maxzoom)),t.postTurnstileEvent(o.tiles,e.map._requestManager._customAccessToken),t.postMapLoadEvent(o.tiles,e.map._getMapId(),e.map._requestManager._skuToken,e.map._requestManager._customAccessToken),e.fire(new t.Event("data",{dataType:"source",sourceDataType:"metadata"})),e.fire(new t.Event("data",{dataType:"source",sourceDataType:"content"})));}));},i.prototype.loaded=function(){return this._loaded},i.prototype.hasTile=function(t){return !this.tileBounds||this.tileBounds.contains(t.canonical)},i.prototype.onAdd=function(t){this.map=t,this.load();},i.prototype.onRemove=function(){this._tileJSONRequest&&(this._tileJSONRequest.cancel(),this._tileJSONRequest=null);},i.prototype.serialize=function(){return t.extend({},this._options)},i.prototype.loadTile=function(e,i){var o=this.map._requestManager.normalizeTileURL(e.tileID.canonical.url(this.tiles,this.scheme)),r={request:this.map._requestManager.transformRequest(o,t.ResourceType.Tile),uid:e.uid,tileID:e.tileID,zoom:e.tileID.overscaledZ,tileSize:this.tileSize*e.tileID.overscaleFactor(),type:this.type,source:this.id,pixelRatio:t.browser.devicePixelRatio,showCollisionBoxes:this.map.showCollisionBoxes,promoteId:this.promoteId};function a(o,r){return delete e.request,e.aborted?i(null):o&&404!==o.status?i(o):(r&&r.resourceTiming&&(e.resourceTiming=r.resourceTiming),this.map._refreshExpiredTiles&&r&&e.setExpiryData(r),e.loadVectorData(r,this.map.painter),t.cacheEntryPossiblyAdded(this.dispatcher),i(null),void(e.reloadCallback&&(this.loadTile(e,e.reloadCallback),e.reloadCallback=null)))}r.request.collectResourceTiming=this._collectResourceTiming,e.actor&&"expired"!==e.state?"loading"===e.state?e.reloadCallback=i:e.request=e.actor.send("reloadTile",r,a.bind(this)):(e.actor=this.dispatcher.getActor(),e.request=e.actor.send("loadTile",r,a.bind(this)));},i.prototype.abortTile=function(t){t.request&&(t.request.cancel(),delete t.request),t.actor&&t.actor.send("abortTile",{uid:t.uid,type:this.type,source:this.id},void 0);},i.prototype.unloadTile=function(t){t.unloadVectorData(),t.actor&&t.actor.send("removeTile",{uid:t.uid,type:this.type,source:this.id},void 0);},i.prototype.hasTransition=function(){return !1},i}(t.Evented),P=function(e){function i(i,o,r,a){e.call(this),this.id=i,this.dispatcher=r,this.setEventedParent(a),this.type="raster",this.minzoom=0,this.maxzoom=22,this.roundZoom=!0,this.scheme="xyz",this.tileSize=512,this._loaded=!1,this._options=t.extend({type:"raster"},o),t.extend(this,t.pick(o,["url","scheme","tileSize"]));}return e&&(i.__proto__=e),(i.prototype=Object.create(e&&e.prototype)).constructor=i,i.prototype.load=function(){var e=this;this._loaded=!1,this.fire(new t.Event("dataloading",{dataType:"source"})),this._tileJSONRequest=I(this._options,this.map._requestManager,(function(i,o){e._tileJSONRequest=null,e._loaded=!0,i?e.fire(new t.ErrorEvent(i)):o&&(t.extend(e,o),o.bounds&&(e.tileBounds=new C(o.bounds,e.minzoom,e.maxzoom)),t.postTurnstileEvent(o.tiles),t.postMapLoadEvent(o.tiles,e.map._getMapId(),e.map._requestManager._skuToken),e.fire(new t.Event("data",{dataType:"source",sourceDataType:"metadata"})),e.fire(new t.Event("data",{dataType:"source",sourceDataType:"content"})));}));},i.prototype.loaded=function(){return this._loaded},i.prototype.onAdd=function(t){this.map=t,this.load();},i.prototype.onRemove=function(){this._tileJSONRequest&&(this._tileJSONRequest.cancel(),this._tileJSONRequest=null);},i.prototype.serialize=function(){return t.extend({},this._options)},i.prototype.hasTile=function(t){return !this.tileBounds||this.tileBounds.contains(t.canonical)},i.prototype.loadTile=function(e,i){var o=this,r=this.map._requestManager.normalizeTileURL(e.tileID.canonical.url(this.tiles,this.scheme),this.tileSize);e.request=t.getImage(this.map._requestManager.transformRequest(r,t.ResourceType.Tile),(function(r,a){if(delete e.request,e.aborted)e.state="unloaded",i(null);else if(r)e.state="errored",i(r);else if(a){o.map._refreshExpiredTiles&&e.setExpiryData(a),delete a.cacheControl,delete a.expires;var n=o.map.painter.context,s=n.gl;e.texture=o.map.painter.getTileTexture(a.width),e.texture?e.texture.update(a,{useMipmap:!0}):(e.texture=new t.Texture(n,a,s.RGBA,{useMipmap:!0}),e.texture.bind(s.LINEAR,s.CLAMP_TO_EDGE,s.LINEAR_MIPMAP_NEAREST),n.extTextureFilterAnisotropic&&s.texParameterf(s.TEXTURE_2D,n.extTextureFilterAnisotropic.TEXTURE_MAX_ANISOTROPY_EXT,n.extTextureFilterAnisotropicMax)),e.state="loaded",t.cacheEntryPossiblyAdded(o.dispatcher),i(null);}}));},i.prototype.abortTile=function(t,e){t.request&&(t.request.cancel(),delete t.request),e();},i.prototype.unloadTile=function(t,e){t.texture&&this.map.painter.saveTileTexture(t.texture),e();},i.prototype.hasTransition=function(){return !1},i}(t.Evented),z=function(e){function i(i,o,r,a){e.call(this,i,o,r,a),this.type="raster-dem",this.maxzoom=22,this._options=t.extend({type:"raster-dem"},o),this.encoding=o.encoding||"mapbox";}return e&&(i.__proto__=e),(i.prototype=Object.create(e&&e.prototype)).constructor=i,i.prototype.serialize=function(){return {type:"raster-dem",url:this.url,tileSize:this.tileSize,tiles:this.tiles,bounds:this.bounds,encoding:this.encoding}},i.prototype.loadTile=function(e,i){var o=this.map._requestManager.normalizeTileURL(e.tileID.canonical.url(this.tiles,this.scheme),this.tileSize);function r(t,o){t&&(e.state="errored",i(t)),o&&(e.dem=o,e.needsHillshadePrepare=!0,e.state="loaded",i(null));}e.request=t.getImage(this.map._requestManager.transformRequest(o,t.ResourceType.Tile),function(o,a){if(delete e.request,e.aborted)e.state="unloaded",i(null);else if(o)e.state="errored",i(o);else if(a){this.map._refreshExpiredTiles&&e.setExpiryData(a),delete a.cacheControl,delete a.expires;var n=t.window.ImageBitmap&&a instanceof t.window.ImageBitmap&&t.offscreenCanvasSupported()?a:t.browser.getImageData(a,1),s={uid:e.uid,coord:e.tileID,source:this.id,rawImageData:n,encoding:this.encoding};e.actor&&"expired"!==e.state||(e.actor=this.dispatcher.getActor(),e.actor.send("loadDEMTile",s,r.bind(this)));}}.bind(this)),e.neighboringTiles=this._getNeighboringTiles(e.tileID);},i.prototype._getNeighboringTiles=function(e){var i=e.canonical,o=Math.pow(2,i.z),r=(i.x-1+o)%o,a=0===i.x?e.wrap-1:e.wrap,n=(i.x+1+o)%o,s=i.x+1===o?e.wrap+1:e.wrap,l={};return l[new t.OverscaledTileID(e.overscaledZ,a,i.z,r,i.y).key]={backfilled:!1},l[new t.OverscaledTileID(e.overscaledZ,s,i.z,n,i.y).key]={backfilled:!1},i.y>0&&(l[new t.OverscaledTileID(e.overscaledZ,a,i.z,r,i.y-1).key]={backfilled:!1},l[new t.OverscaledTileID(e.overscaledZ,e.wrap,i.z,i.x,i.y-1).key]={backfilled:!1},l[new t.OverscaledTileID(e.overscaledZ,s,i.z,n,i.y-1).key]={backfilled:!1}),i.y+1<o&&(l[new t.OverscaledTileID(e.overscaledZ,a,i.z,r,i.y+1).key]={backfilled:!1},l[new t.OverscaledTileID(e.overscaledZ,e.wrap,i.z,i.x,i.y+1).key]={backfilled:!1},l[new t.OverscaledTileID(e.overscaledZ,s,i.z,n,i.y+1).key]={backfilled:!1}),l},i.prototype.unloadTile=function(t){t.demTexture&&this.map.painter.saveTileTexture(t.demTexture),t.fbo&&(t.fbo.destroy(),delete t.fbo),t.dem&&delete t.dem,delete t.neighboringTiles,t.state="unloaded",t.actor&&t.actor.send("removeDEMTile",{uid:t.uid,source:this.id});},i}(P),L=function(e){function i(i,o,r,a){e.call(this),this.id=i,this.type="geojson",this.minzoom=0,this.maxzoom=18,this.tileSize=512,this.isTileClipped=!0,this.reparseOverscaled=!0,this._removed=!1,this._loaded=!1,this.actor=r.getActor(),this.setEventedParent(a),this._data=o.data,this._options=t.extend({},o),this._collectResourceTiming=o.collectResourceTiming,this._resourceTiming=[],void 0!==o.maxzoom&&(this.maxzoom=o.maxzoom),o.type&&(this.type=o.type),o.attribution&&(this.attribution=o.attribution),this.promoteId=o.promoteId;var n=t.EXTENT/this.tileSize;this.workerOptions=t.extend({source:this.id,cluster:o.cluster||!1,geojsonVtOptions:{buffer:(void 0!==o.buffer?o.buffer:128)*n,tolerance:(void 0!==o.tolerance?o.tolerance:.375)*n,extent:t.EXTENT,maxZoom:this.maxzoom,lineMetrics:o.lineMetrics||!1,generateId:o.generateId||!1},superclusterOptions:{maxZoom:void 0!==o.clusterMaxZoom?Math.min(o.clusterMaxZoom,this.maxzoom-1):this.maxzoom-1,extent:t.EXTENT,radius:(o.clusterRadius||50)*n,log:!1,generateId:o.generateId||!1},clusterProperties:o.clusterProperties},o.workerOptions);}return e&&(i.__proto__=e),(i.prototype=Object.create(e&&e.prototype)).constructor=i,i.prototype.load=function(){var e=this;this.fire(new t.Event("dataloading",{dataType:"source"})),this._updateWorkerData((function(i){if(i)e.fire(new t.ErrorEvent(i));else{var o={dataType:"source",sourceDataType:"metadata"};e._collectResourceTiming&&e._resourceTiming&&e._resourceTiming.length>0&&(o.resourceTiming=e._resourceTiming,e._resourceTiming=[]),e.fire(new t.Event("data",o));}}));},i.prototype.onAdd=function(t){this.map=t,this.load();},i.prototype.setData=function(e){var i=this;return this._data=e,this.fire(new t.Event("dataloading",{dataType:"source"})),this._updateWorkerData((function(e){if(e)i.fire(new t.ErrorEvent(e));else{var o={dataType:"source",sourceDataType:"content"};i._collectResourceTiming&&i._resourceTiming&&i._resourceTiming.length>0&&(o.resourceTiming=i._resourceTiming,i._resourceTiming=[]),i.fire(new t.Event("data",o));}})),this},i.prototype.getClusterExpansionZoom=function(t,e){return this.actor.send("geojson.getClusterExpansionZoom",{clusterId:t,source:this.id},e),this},i.prototype.getClusterChildren=function(t,e){return this.actor.send("geojson.getClusterChildren",{clusterId:t,source:this.id},e),this},i.prototype.getClusterLeaves=function(t,e,i,o){return this.actor.send("geojson.getClusterLeaves",{source:this.id,clusterId:t,limit:e,offset:i},o),this},i.prototype._updateWorkerData=function(e){var i=this;this._loaded=!1;var o=t.extend({},this.workerOptions),r=this._data;"string"==typeof r?(o.request=this.map._requestManager.transformRequest(t.browser.resolveURL(r),t.ResourceType.Source),o.request.collectResourceTiming=this._collectResourceTiming):o.data=JSON.stringify(r),this.actor.send(this.type+".loadData",o,(function(t,r){i._removed||r&&r.abandoned||(i._loaded=!0,r&&r.resourceTiming&&r.resourceTiming[i.id]&&(i._resourceTiming=r.resourceTiming[i.id].slice(0)),i.actor.send(i.type+".coalesce",{source:o.source},null),e(t));}));},i.prototype.loaded=function(){return this._loaded},i.prototype.loadTile=function(e,i){var o=this,r=e.actor?"reloadTile":"loadTile";e.actor=this.actor,e.request=this.actor.send(r,{type:this.type,uid:e.uid,tileID:e.tileID,zoom:e.tileID.overscaledZ,maxZoom:this.maxzoom,tileSize:this.tileSize,source:this.id,pixelRatio:t.browser.devicePixelRatio,showCollisionBoxes:this.map.showCollisionBoxes,promoteId:this.promoteId},(function(t,a){return delete e.request,e.unloadVectorData(),e.aborted?i(null):t?i(t):(e.loadVectorData(a,o.map.painter,"reloadTile"===r),i(null))}));},i.prototype.abortTile=function(t){t.request&&(t.request.cancel(),delete t.request),t.aborted=!0;},i.prototype.unloadTile=function(t){t.unloadVectorData(),this.actor.send("removeTile",{uid:t.uid,type:this.type,source:this.id});},i.prototype.onRemove=function(){this._removed=!0,this.actor.send("removeSource",{type:this.type,source:this.id});},i.prototype.serialize=function(){return t.extend({},this._options,{type:this.type,data:this._data})},i.prototype.hasTransition=function(){return !1},i}(t.Evented),M=t.createLayout([{name:"a_pos",type:"Int16",components:2},{name:"a_texture_pos",type:"Int16",components:2}]),D=function(e){function i(t,i,o,r){e.call(this),this.id=t,this.dispatcher=o,this.coordinates=i.coordinates,this.type="image",this.minzoom=0,this.maxzoom=22,this.tileSize=512,this.tiles={},this._loaded=!1,this.setEventedParent(r),this.options=i;}return e&&(i.__proto__=e),(i.prototype=Object.create(e&&e.prototype)).constructor=i,i.prototype.load=function(e,i){var o=this;this._loaded=!1,this.fire(new t.Event("dataloading",{dataType:"source"})),this.url=this.options.url,t.getImage(this.map._requestManager.transformRequest(this.url,t.ResourceType.Image),(function(r,a){o._loaded=!0,r?o.fire(new t.ErrorEvent(r)):a&&(o.image=a,e&&(o.coordinates=e),i&&i(),o._finishLoading());}));},i.prototype.loaded=function(){return this._loaded},i.prototype.updateImage=function(t){var e=this;return this.image&&t.url?(this.options.url=t.url,this.load(t.coordinates,(function(){e.texture=null;})),this):this},i.prototype._finishLoading=function(){this.map&&(this.setCoordinates(this.coordinates),this.fire(new t.Event("data",{dataType:"source",sourceDataType:"metadata"})));},i.prototype.onAdd=function(t){this.map=t,this.load();},i.prototype.setCoordinates=function(e){var i=this;this.coordinates=e;var o=e.map(t.MercatorCoordinate.fromLngLat);this.tileID=function(e){for(var i=1/0,o=1/0,r=-1/0,a=-1/0,n=0,s=e;n<s.length;n+=1){var l=s[n];i=Math.min(i,l.x),o=Math.min(o,l.y),r=Math.max(r,l.x),a=Math.max(a,l.y);}var c=Math.max(r-i,a-o),u=Math.max(0,Math.floor(-Math.log(c)/Math.LN2)),h=Math.pow(2,u);return new t.CanonicalTileID(u,Math.floor((i+r)/2*h),Math.floor((o+a)/2*h))}(o),this.minzoom=this.maxzoom=this.tileID.z;var r=o.map((function(t){return i.tileID.getTilePoint(t)._round()}));return this._boundsArray=new t.StructArrayLayout4i8,this._boundsArray.emplaceBack(r[0].x,r[0].y,0,0),this._boundsArray.emplaceBack(r[1].x,r[1].y,t.EXTENT,0),this._boundsArray.emplaceBack(r[3].x,r[3].y,0,t.EXTENT),this._boundsArray.emplaceBack(r[2].x,r[2].y,t.EXTENT,t.EXTENT),this.boundsBuffer&&(this.boundsBuffer.destroy(),delete this.boundsBuffer),this.fire(new t.Event("data",{dataType:"source",sourceDataType:"content"})),this},i.prototype.prepare=function(){if(0!==Object.keys(this.tiles).length&&this.image){var e=this.map.painter.context,i=e.gl;for(var o in this.boundsBuffer||(this.boundsBuffer=e.createVertexBuffer(this._boundsArray,M.members)),this.boundsSegments||(this.boundsSegments=t.SegmentVector.simpleSegment(0,0,4,2)),this.texture||(this.texture=new t.Texture(e,this.image,i.RGBA),this.texture.bind(i.LINEAR,i.CLAMP_TO_EDGE)),this.tiles){var r=this.tiles[o];"loaded"!==r.state&&(r.state="loaded",r.texture=this.texture);}}},i.prototype.loadTile=function(t,e){this.tileID&&this.tileID.equals(t.tileID.canonical)?(this.tiles[String(t.tileID.wrap)]=t,t.buckets={},e(null)):(t.state="errored",e(null));},i.prototype.serialize=function(){return {type:"image",url:this.options.url,coordinates:this.coordinates}},i.prototype.hasTransition=function(){return !1},i}(t.Evented),A=function(e){function i(t,i,o,r){e.call(this,t,i,o,r),this.roundZoom=!0,this.type="video",this.options=i;}return e&&(i.__proto__=e),(i.prototype=Object.create(e&&e.prototype)).constructor=i,i.prototype.load=function(){var e=this;this._loaded=!1;var i=this.options;this.urls=[];for(var o=0,r=i.urls;o<r.length;o+=1)this.urls.push(this.map._requestManager.transformRequest(r[o],t.ResourceType.Source).url);t.getVideo(this.urls,(function(i,o){e._loaded=!0,i?e.fire(new t.ErrorEvent(i)):o&&(e.video=o,e.video.loop=!0,e.video.addEventListener("playing",(function(){e.map.triggerRepaint();})),e.map&&e.video.play(),e._finishLoading());}));},i.prototype.pause=function(){this.video&&this.video.pause();},i.prototype.play=function(){this.video&&this.video.play();},i.prototype.seek=function(e){if(this.video){var i=this.video.seekable;e<i.start(0)||e>i.end(0)?this.fire(new t.ErrorEvent(new t.ValidationError("sources."+this.id,null,"Playback for this video can be set only between the "+i.start(0)+" and "+i.end(0)+"-second mark."))):this.video.currentTime=e;}},i.prototype.getVideo=function(){return this.video},i.prototype.onAdd=function(t){this.map||(this.map=t,this.load(),this.video&&(this.video.play(),this.setCoordinates(this.coordinates)));},i.prototype.prepare=function(){if(!(0===Object.keys(this.tiles).length||this.video.readyState<2)){var e=this.map.painter.context,i=e.gl;for(var o in this.boundsBuffer||(this.boundsBuffer=e.createVertexBuffer(this._boundsArray,M.members)),this.boundsSegments||(this.boundsSegments=t.SegmentVector.simpleSegment(0,0,4,2)),this.texture?this.video.paused||(this.texture.bind(i.LINEAR,i.CLAMP_TO_EDGE),i.texSubImage2D(i.TEXTURE_2D,0,0,0,i.RGBA,i.UNSIGNED_BYTE,this.video)):(this.texture=new t.Texture(e,this.video,i.RGBA),this.texture.bind(i.LINEAR,i.CLAMP_TO_EDGE)),this.tiles){var r=this.tiles[o];"loaded"!==r.state&&(r.state="loaded",r.texture=this.texture);}}},i.prototype.serialize=function(){return {type:"video",urls:this.urls,coordinates:this.coordinates}},i.prototype.hasTransition=function(){return this.video&&!this.video.paused},i}(D),R=function(e){function i(i,o,r,a){e.call(this,i,o,r,a),o.coordinates?Array.isArray(o.coordinates)&&4===o.coordinates.length&&!o.coordinates.some((function(t){return !Array.isArray(t)||2!==t.length||t.some((function(t){return "number"!=typeof t}))}))||this.fire(new t.ErrorEvent(new t.ValidationError("sources."+i,null,'"coordinates" property must be an array of 4 longitude/latitude array pairs'))):this.fire(new t.ErrorEvent(new t.ValidationError("sources."+i,null,'missing required property "coordinates"'))),o.animate&&"boolean"!=typeof o.animate&&this.fire(new t.ErrorEvent(new t.ValidationError("sources."+i,null,'optional "animate" property must be a boolean value'))),o.canvas?"string"==typeof o.canvas||o.canvas instanceof t.window.HTMLCanvasElement||this.fire(new t.ErrorEvent(new t.ValidationError("sources."+i,null,'"canvas" must be either a string representing the ID of the canvas element from which to read, or an HTMLCanvasElement instance'))):this.fire(new t.ErrorEvent(new t.ValidationError("sources."+i,null,'missing required property "canvas"'))),this.options=o,this.animate=void 0===o.animate||o.animate;}return e&&(i.__proto__=e),(i.prototype=Object.create(e&&e.prototype)).constructor=i,i.prototype.load=function(){this._loaded=!0,this.canvas||(this.canvas=this.options.canvas instanceof t.window.HTMLCanvasElement?this.options.canvas:t.window.document.getElementById(this.options.canvas)),this.width=this.canvas.width,this.height=this.canvas.height,this._hasInvalidDimensions()?this.fire(new t.ErrorEvent(new Error("Canvas dimensions cannot be less than or equal to zero."))):(this.play=function(){this._playing=!0,this.map.triggerRepaint();},this.pause=function(){this._playing&&(this.prepare(),this._playing=!1);},this._finishLoading());},i.prototype.getCanvas=function(){return this.canvas},i.prototype.onAdd=function(t){this.map=t,this.load(),this.canvas&&this.animate&&this.play();},i.prototype.onRemove=function(){this.pause();},i.prototype.prepare=function(){var e=!1;if(this.canvas.width!==this.width&&(this.width=this.canvas.width,e=!0),this.canvas.height!==this.height&&(this.height=this.canvas.height,e=!0),!this._hasInvalidDimensions()&&0!==Object.keys(this.tiles).length){var i=this.map.painter.context,o=i.gl;for(var r in this.boundsBuffer||(this.boundsBuffer=i.createVertexBuffer(this._boundsArray,M.members)),this.boundsSegments||(this.boundsSegments=t.SegmentVector.simpleSegment(0,0,4,2)),this.texture?(e||this._playing)&&this.texture.update(this.canvas,{premultiply:!0}):this.texture=new t.Texture(i,this.canvas,o.RGBA,{premultiply:!0}),this.tiles){var a=this.tiles[r];"loaded"!==a.state&&(a.state="loaded",a.texture=this.texture);}}},i.prototype.serialize=function(){return {type:"canvas",coordinates:this.coordinates}},i.prototype.hasTransition=function(){return this._playing},i.prototype._hasInvalidDimensions=function(){for(var t=0,e=[this.canvas.width,this.canvas.height];t<e.length;t+=1){var i=e[t];if(isNaN(i)||i<=0)return !0}return !1},i}(D),k={vector:S,raster:P,"raster-dem":z,geojson:L,video:A,image:D,canvas:R},B=function(e,i,o,r){var a=new k[i.type](e,i,o,r);if(a.id!==e)throw new Error("Expected Source id to be "+e+" instead of "+a.id);return t.bindAll(["load","abort","unload","serialize","prepare"],a),a};function O(e,i){var o=t.identity([]);return t.translate(o,o,[1,1,0]),t.scale(o,o,[.5*e.width,.5*e.height,1]),t.multiply(o,o,e.calculatePosMatrix(i.toUnwrapped()))}function F(t,e,i,o,r,a){var n=function(t,e,i){if(t)for(var o=0,r=t;o<r.length;o+=1){var a=e[r[o]];if(a&&a.source===i&&"fill-extrusion"===a.type)return !0}else for(var n in e){var s=e[n];if(s.source===i&&"fill-extrusion"===s.type)return !0}return !1}(r&&r.layers,e,t.id),s=a.maxPitchScaleFactor(),l=t.tilesIn(o,s,n);l.sort(U);for(var c=[],u=0,h=l;u<h.length;u+=1){var p=h[u];c.push({wrappedTileID:p.tileID.wrapped().key,queryResults:p.tile.queryRenderedFeatures(e,i,t._state,p.queryGeometry,p.cameraQueryGeometry,p.scale,r,a,s,O(t.transform,p.tileID))});}var d=function(t){for(var e={},i={},o=0,r=t;o<r.length;o+=1){var a=r[o],n=a.queryResults,s=a.wrappedTileID,l=i[s]=i[s]||{};for(var c in n)for(var u=n[c],h=l[c]=l[c]||{},p=e[c]=e[c]||[],d=0,_=u;d<_.length;d+=1){var f=_[d];h[f.featureIndex]||(h[f.featureIndex]=!0,p.push(f));}}return e}(c);for(var _ in d)d[_].forEach((function(e){var i=e.feature,o=t.getFeatureState(i.layer["source-layer"],i.id);i.source=i.layer.source,i.layer["source-layer"]&&(i.sourceLayer=i.layer["source-layer"]),i.state=o;}));return d}function U(t,e){var i=t.tileID,o=e.tileID;return i.overscaledZ-o.overscaledZ||i.canonical.y-o.canonical.y||i.wrap-o.wrap||i.canonical.x-o.canonical.x}var N=function(t,e){this.max=t,this.onRemove=e,this.reset();};N.prototype.reset=function(){for(var t in this.data)for(var e=0,i=this.data[t];e<i.length;e+=1){var o=i[e];o.timeout&&clearTimeout(o.timeout),this.onRemove(o.value);}return this.data={},this.order=[],this},N.prototype.add=function(t,e,i){var o=this,r=t.wrapped().key;void 0===this.data[r]&&(this.data[r]=[]);var a={value:e,timeout:void 0};if(void 0!==i&&(a.timeout=setTimeout((function(){o.remove(t,a);}),i)),this.data[r].push(a),this.order.push(r),this.order.length>this.max){var n=this._getAndRemoveByKey(this.order[0]);n&&this.onRemove(n);}return this},N.prototype.has=function(t){return t.wrapped().key in this.data},N.prototype.getAndRemove=function(t){return this.has(t)?this._getAndRemoveByKey(t.wrapped().key):null},N.prototype._getAndRemoveByKey=function(t){var e=this.data[t].shift();return e.timeout&&clearTimeout(e.timeout),0===this.data[t].length&&delete this.data[t],this.order.splice(this.order.indexOf(t),1),e.value},N.prototype.getByKey=function(t){var e=this.data[t];return e?e[0].value:null},N.prototype.get=function(t){return this.has(t)?this.data[t.wrapped().key][0].value:null},N.prototype.remove=function(t,e){if(!this.has(t))return this;var i=t.wrapped().key,o=void 0===e?0:this.data[i].indexOf(e),r=this.data[i][o];return this.data[i].splice(o,1),r.timeout&&clearTimeout(r.timeout),0===this.data[i].length&&delete this.data[i],this.onRemove(r.value),this.order.splice(this.order.indexOf(i),1),this},N.prototype.setMaxSize=function(t){for(this.max=t;this.order.length>this.max;){var e=this._getAndRemoveByKey(this.order[0]);e&&this.onRemove(e);}return this},N.prototype.filter=function(t){var e=[];for(var i in this.data)for(var o=0,r=this.data[i];o<r.length;o+=1){var a=r[o];t(a.value)||e.push(a);}for(var n=0,s=e;n<s.length;n+=1){var l=s[n];this.remove(l.value.tileID,l);}};var Z=function(t,e,i){this.context=t;var o=t.gl;this.buffer=o.createBuffer(),this.dynamicDraw=Boolean(i),this.context.unbindVAO(),t.bindElementBuffer.set(this.buffer),o.bufferData(o.ELEMENT_ARRAY_BUFFER,e.arrayBuffer,this.dynamicDraw?o.DYNAMIC_DRAW:o.STATIC_DRAW),this.dynamicDraw||delete e.arrayBuffer;};Z.prototype.bind=function(){this.context.bindElementBuffer.set(this.buffer);},Z.prototype.updateData=function(t){var e=this.context.gl;this.context.unbindVAO(),this.bind(),e.bufferSubData(e.ELEMENT_ARRAY_BUFFER,0,t.arrayBuffer);},Z.prototype.destroy=function(){this.buffer&&(this.context.gl.deleteBuffer(this.buffer),delete this.buffer);};var q={Int8:"BYTE",Uint8:"UNSIGNED_BYTE",Int16:"SHORT",Uint16:"UNSIGNED_SHORT",Int32:"INT",Uint32:"UNSIGNED_INT",Float32:"FLOAT"},j=function(t,e,i,o){this.length=e.length,this.attributes=i,this.itemSize=e.bytesPerElement,this.dynamicDraw=o,this.context=t;var r=t.gl;this.buffer=r.createBuffer(),t.bindVertexBuffer.set(this.buffer),r.bufferData(r.ARRAY_BUFFER,e.arrayBuffer,this.dynamicDraw?r.DYNAMIC_DRAW:r.STATIC_DRAW),this.dynamicDraw||delete e.arrayBuffer;};j.prototype.bind=function(){this.context.bindVertexBuffer.set(this.buffer);},j.prototype.updateData=function(t){var e=this.context.gl;this.bind(),e.bufferSubData(e.ARRAY_BUFFER,0,t.arrayBuffer);},j.prototype.enableAttributes=function(t,e){for(var i=0;i<this.attributes.length;i++){var o=e.attributes[this.attributes[i].name];void 0!==o&&t.enableVertexAttribArray(o);}},j.prototype.setVertexAttribPointers=function(t,e,i){for(var o=0;o<this.attributes.length;o++){var r=this.attributes[o],a=e.attributes[r.name];void 0!==a&&t.vertexAttribPointer(a,r.components,t[q[r.type]],!1,this.itemSize,r.offset+this.itemSize*(i||0));}},j.prototype.destroy=function(){this.buffer&&(this.context.gl.deleteBuffer(this.buffer),delete this.buffer);};var V=function(t){this.gl=t.gl,this.default=this.getDefault(),this.current=this.default,this.dirty=!1;};V.prototype.get=function(){return this.current},V.prototype.set=function(t){},V.prototype.getDefault=function(){return this.default},V.prototype.setDefault=function(){this.set(this.default);};var G=function(e){function i(){e.apply(this,arguments);}return e&&(i.__proto__=e),(i.prototype=Object.create(e&&e.prototype)).constructor=i,i.prototype.getDefault=function(){return t.Color.transparent},i.prototype.set=function(t){var e=this.current;(t.r!==e.r||t.g!==e.g||t.b!==e.b||t.a!==e.a||this.dirty)&&(this.gl.clearColor(t.r,t.g,t.b,t.a),this.current=t,this.dirty=!1);},i}(V),W=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getDefault=function(){return 1},e.prototype.set=function(t){(t!==this.current||this.dirty)&&(this.gl.clearDepth(t),this.current=t,this.dirty=!1);},e}(V),X=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getDefault=function(){return 0},e.prototype.set=function(t){(t!==this.current||this.dirty)&&(this.gl.clearStencil(t),this.current=t,this.dirty=!1);},e}(V),H=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getDefault=function(){return [!0,!0,!0,!0]},e.prototype.set=function(t){var e=this.current;(t[0]!==e[0]||t[1]!==e[1]||t[2]!==e[2]||t[3]!==e[3]||this.dirty)&&(this.gl.colorMask(t[0],t[1],t[2],t[3]),this.current=t,this.dirty=!1);},e}(V),K=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getDefault=function(){return !0},e.prototype.set=function(t){(t!==this.current||this.dirty)&&(this.gl.depthMask(t),this.current=t,this.dirty=!1);},e}(V),Y=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getDefault=function(){return 255},e.prototype.set=function(t){(t!==this.current||this.dirty)&&(this.gl.stencilMask(t),this.current=t,this.dirty=!1);},e}(V),J=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getDefault=function(){return {func:this.gl.ALWAYS,ref:0,mask:255}},e.prototype.set=function(t){var e=this.current;(t.func!==e.func||t.ref!==e.ref||t.mask!==e.mask||this.dirty)&&(this.gl.stencilFunc(t.func,t.ref,t.mask),this.current=t,this.dirty=!1);},e}(V),Q=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getDefault=function(){var t=this.gl;return [t.KEEP,t.KEEP,t.KEEP]},e.prototype.set=function(t){var e=this.current;(t[0]!==e[0]||t[1]!==e[1]||t[2]!==e[2]||this.dirty)&&(this.gl.stencilOp(t[0],t[1],t[2]),this.current=t,this.dirty=!1);},e}(V),$=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getDefault=function(){return !1},e.prototype.set=function(t){if(t!==this.current||this.dirty){var e=this.gl;t?e.enable(e.STENCIL_TEST):e.disable(e.STENCIL_TEST),this.current=t,this.dirty=!1;}},e}(V),tt=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getDefault=function(){return [0,1]},e.prototype.set=function(t){var e=this.current;(t[0]!==e[0]||t[1]!==e[1]||this.dirty)&&(this.gl.depthRange(t[0],t[1]),this.current=t,this.dirty=!1);},e}(V),et=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getDefault=function(){return !1},e.prototype.set=function(t){if(t!==this.current||this.dirty){var e=this.gl;t?e.enable(e.DEPTH_TEST):e.disable(e.DEPTH_TEST),this.current=t,this.dirty=!1;}},e}(V),it=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getDefault=function(){return this.gl.LESS},e.prototype.set=function(t){(t!==this.current||this.dirty)&&(this.gl.depthFunc(t),this.current=t,this.dirty=!1);},e}(V),ot=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getDefault=function(){return !1},e.prototype.set=function(t){if(t!==this.current||this.dirty){var e=this.gl;t?e.enable(e.BLEND):e.disable(e.BLEND),this.current=t,this.dirty=!1;}},e}(V),rt=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getDefault=function(){var t=this.gl;return [t.ONE,t.ZERO]},e.prototype.set=function(t){var e=this.current;(t[0]!==e[0]||t[1]!==e[1]||this.dirty)&&(this.gl.blendFunc(t[0],t[1]),this.current=t,this.dirty=!1);},e}(V),at=function(e){function i(){e.apply(this,arguments);}return e&&(i.__proto__=e),(i.prototype=Object.create(e&&e.prototype)).constructor=i,i.prototype.getDefault=function(){return t.Color.transparent},i.prototype.set=function(t){var e=this.current;(t.r!==e.r||t.g!==e.g||t.b!==e.b||t.a!==e.a||this.dirty)&&(this.gl.blendColor(t.r,t.g,t.b,t.a),this.current=t,this.dirty=!1);},i}(V),nt=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getDefault=function(){return this.gl.FUNC_ADD},e.prototype.set=function(t){(t!==this.current||this.dirty)&&(this.gl.blendEquation(t),this.current=t,this.dirty=!1);},e}(V),st=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getDefault=function(){return !1},e.prototype.set=function(t){if(t!==this.current||this.dirty){var e=this.gl;t?e.enable(e.CULL_FACE):e.disable(e.CULL_FACE),this.current=t,this.dirty=!1;}},e}(V),lt=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getDefault=function(){return this.gl.BACK},e.prototype.set=function(t){(t!==this.current||this.dirty)&&(this.gl.cullFace(t),this.current=t,this.dirty=!1);},e}(V),ct=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getDefault=function(){return this.gl.CCW},e.prototype.set=function(t){(t!==this.current||this.dirty)&&(this.gl.frontFace(t),this.current=t,this.dirty=!1);},e}(V),ut=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getDefault=function(){return null},e.prototype.set=function(t){(t!==this.current||this.dirty)&&(this.gl.useProgram(t),this.current=t,this.dirty=!1);},e}(V),ht=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getDefault=function(){return this.gl.TEXTURE0},e.prototype.set=function(t){(t!==this.current||this.dirty)&&(this.gl.activeTexture(t),this.current=t,this.dirty=!1);},e}(V),pt=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getDefault=function(){var t=this.gl;return [0,0,t.drawingBufferWidth,t.drawingBufferHeight]},e.prototype.set=function(t){var e=this.current;(t[0]!==e[0]||t[1]!==e[1]||t[2]!==e[2]||t[3]!==e[3]||this.dirty)&&(this.gl.viewport(t[0],t[1],t[2],t[3]),this.current=t,this.dirty=!1);},e}(V),dt=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getDefault=function(){return null},e.prototype.set=function(t){if(t!==this.current||this.dirty){var e=this.gl;e.bindFramebuffer(e.FRAMEBUFFER,t),this.current=t,this.dirty=!1;}},e}(V),_t=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getDefault=function(){return null},e.prototype.set=function(t){if(t!==this.current||this.dirty){var e=this.gl;e.bindRenderbuffer(e.RENDERBUFFER,t),this.current=t,this.dirty=!1;}},e}(V),ft=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getDefault=function(){return null},e.prototype.set=function(t){if(t!==this.current||this.dirty){var e=this.gl;e.bindTexture(e.TEXTURE_2D,t),this.current=t,this.dirty=!1;}},e}(V),mt=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getDefault=function(){return null},e.prototype.set=function(t){if(t!==this.current||this.dirty){var e=this.gl;e.bindBuffer(e.ARRAY_BUFFER,t),this.current=t,this.dirty=!1;}},e}(V),gt=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getDefault=function(){return null},e.prototype.set=function(t){var e=this.gl;e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t),this.current=t,this.dirty=!1;},e}(V),vt=function(t){function e(e){t.call(this,e),this.vao=e.extVertexArrayObject;}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getDefault=function(){return null},e.prototype.set=function(t){this.vao&&(t!==this.current||this.dirty)&&(this.vao.bindVertexArrayOES(t),this.current=t,this.dirty=!1);},e}(V),yt=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getDefault=function(){return 4},e.prototype.set=function(t){if(t!==this.current||this.dirty){var e=this.gl;e.pixelStorei(e.UNPACK_ALIGNMENT,t),this.current=t,this.dirty=!1;}},e}(V),xt=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getDefault=function(){return !1},e.prototype.set=function(t){if(t!==this.current||this.dirty){var e=this.gl;e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,t),this.current=t,this.dirty=!1;}},e}(V),bt=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getDefault=function(){return !1},e.prototype.set=function(t){if(t!==this.current||this.dirty){var e=this.gl;e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,t),this.current=t,this.dirty=!1;}},e}(V),wt=function(t){function e(e,i){t.call(this,e),this.context=e,this.parent=i;}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.getDefault=function(){return null},e}(V),Et=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.setDirty=function(){this.dirty=!0;},e.prototype.set=function(t){if(t!==this.current||this.dirty){this.context.bindFramebuffer.set(this.parent);var e=this.gl;e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0),this.current=t,this.dirty=!1;}},e}(wt),Tt=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.set=function(t){if(t!==this.current||this.dirty){this.context.bindFramebuffer.set(this.parent);var e=this.gl;e.framebufferRenderbuffer(e.FRAMEBUFFER,e.DEPTH_ATTACHMENT,e.RENDERBUFFER,t),this.current=t,this.dirty=!1;}},e}(wt),It=function(t,e,i,o){this.context=t,this.width=e,this.height=i;var r=this.framebuffer=t.gl.createFramebuffer();this.colorAttachment=new Et(t,r),o&&(this.depthAttachment=new Tt(t,r));};It.prototype.destroy=function(){var t=this.context.gl,e=this.colorAttachment.get();if(e&&t.deleteTexture(e),this.depthAttachment){var i=this.depthAttachment.get();i&&t.deleteRenderbuffer(i);}t.deleteFramebuffer(this.framebuffer);};var Ct=function(t,e,i){this.func=t,this.mask=e,this.range=i;};Ct.ReadOnly=!1,Ct.ReadWrite=!0,Ct.disabled=new Ct(519,Ct.ReadOnly,[0,1]);var St=function(t,e,i,o,r,a){this.test=t,this.ref=e,this.mask=i,this.fail=o,this.depthFail=r,this.pass=a;};St.disabled=new St({func:519,mask:0},0,0,7680,7680,7680);var Pt=function(t,e,i){this.blendFunction=t,this.blendColor=e,this.mask=i;};Pt.Replace=[1,0],Pt.disabled=new Pt(Pt.Replace,t.Color.transparent,[!1,!1,!1,!1]),Pt.unblended=new Pt(Pt.Replace,t.Color.transparent,[!0,!0,!0,!0]),Pt.alphaBlended=new Pt([1,771],t.Color.transparent,[!0,!0,!0,!0]);var zt=function(t,e,i){this.enable=t,this.mode=e,this.frontFace=i;};zt.disabled=new zt(!1,1029,2305),zt.backCCW=new zt(!0,1029,2305);var Lt=function(t){this.gl=t,this.extVertexArrayObject=this.gl.getExtension("OES_vertex_array_object"),this.clearColor=new G(this),this.clearDepth=new W(this),this.clearStencil=new X(this),this.colorMask=new H(this),this.depthMask=new K(this),this.stencilMask=new Y(this),this.stencilFunc=new J(this),this.stencilOp=new Q(this),this.stencilTest=new $(this),this.depthRange=new tt(this),this.depthTest=new et(this),this.depthFunc=new it(this),this.blend=new ot(this),this.blendFunc=new rt(this),this.blendColor=new at(this),this.blendEquation=new nt(this),this.cullFace=new st(this),this.cullFaceSide=new lt(this),this.frontFace=new ct(this),this.program=new ut(this),this.activeTexture=new ht(this),this.viewport=new pt(this),this.bindFramebuffer=new dt(this),this.bindRenderbuffer=new _t(this),this.bindTexture=new ft(this),this.bindVertexBuffer=new mt(this),this.bindElementBuffer=new gt(this),this.bindVertexArrayOES=this.extVertexArrayObject&&new vt(this),this.pixelStoreUnpack=new yt(this),this.pixelStoreUnpackPremultiplyAlpha=new xt(this),this.pixelStoreUnpackFlipY=new bt(this),this.extTextureFilterAnisotropic=t.getExtension("EXT_texture_filter_anisotropic")||t.getExtension("MOZ_EXT_texture_filter_anisotropic")||t.getExtension("WEBKIT_EXT_texture_filter_anisotropic"),this.extTextureFilterAnisotropic&&(this.extTextureFilterAnisotropicMax=t.getParameter(this.extTextureFilterAnisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT)),this.extTextureHalfFloat=t.getExtension("OES_texture_half_float"),this.extTextureHalfFloat&&t.getExtension("OES_texture_half_float_linear"),this.extTimerQuery=t.getExtension("EXT_disjoint_timer_query");};Lt.prototype.setDefault=function(){this.unbindVAO(),this.clearColor.setDefault(),this.clearDepth.setDefault(),this.clearStencil.setDefault(),this.colorMask.setDefault(),this.depthMask.setDefault(),this.stencilMask.setDefault(),this.stencilFunc.setDefault(),this.stencilOp.setDefault(),this.stencilTest.setDefault(),this.depthRange.setDefault(),this.depthTest.setDefault(),this.depthFunc.setDefault(),this.blend.setDefault(),this.blendFunc.setDefault(),this.blendColor.setDefault(),this.blendEquation.setDefault(),this.cullFace.setDefault(),this.cullFaceSide.setDefault(),this.frontFace.setDefault(),this.program.setDefault(),this.activeTexture.setDefault(),this.bindFramebuffer.setDefault(),this.pixelStoreUnpack.setDefault(),this.pixelStoreUnpackPremultiplyAlpha.setDefault(),this.pixelStoreUnpackFlipY.setDefault();},Lt.prototype.setDirty=function(){this.clearColor.dirty=!0,this.clearDepth.dirty=!0,this.clearStencil.dirty=!0,this.colorMask.dirty=!0,this.depthMask.dirty=!0,this.stencilMask.dirty=!0,this.stencilFunc.dirty=!0,this.stencilOp.dirty=!0,this.stencilTest.dirty=!0,this.depthRange.dirty=!0,this.depthTest.dirty=!0,this.depthFunc.dirty=!0,this.blend.dirty=!0,this.blendFunc.dirty=!0,this.blendColor.dirty=!0,this.blendEquation.dirty=!0,this.cullFace.dirty=!0,this.cullFaceSide.dirty=!0,this.frontFace.dirty=!0,this.program.dirty=!0,this.activeTexture.dirty=!0,this.viewport.dirty=!0,this.bindFramebuffer.dirty=!0,this.bindRenderbuffer.dirty=!0,this.bindTexture.dirty=!0,this.bindVertexBuffer.dirty=!0,this.bindElementBuffer.dirty=!0,this.extVertexArrayObject&&(this.bindVertexArrayOES.dirty=!0),this.pixelStoreUnpack.dirty=!0,this.pixelStoreUnpackPremultiplyAlpha.dirty=!0,this.pixelStoreUnpackFlipY.dirty=!0;},Lt.prototype.createIndexBuffer=function(t,e){return new Z(this,t,e)},Lt.prototype.createVertexBuffer=function(t,e,i){return new j(this,t,e,i)},Lt.prototype.createRenderbuffer=function(t,e,i){var o=this.gl,r=o.createRenderbuffer();return this.bindRenderbuffer.set(r),o.renderbufferStorage(o.RENDERBUFFER,t,e,i),this.bindRenderbuffer.set(null),r},Lt.prototype.createFramebuffer=function(t,e,i){return new It(this,t,e,i)},Lt.prototype.clear=function(t){var e=t.color,i=t.depth,o=this.gl,r=0;e&&(r|=o.COLOR_BUFFER_BIT,this.clearColor.set(e),this.colorMask.set([!0,!0,!0,!0])),void 0!==i&&(r|=o.DEPTH_BUFFER_BIT,this.depthRange.set([0,1]),this.clearDepth.set(i),this.depthMask.set(!0)),o.clear(r);},Lt.prototype.setCullFace=function(t){!1===t.enable?this.cullFace.set(!1):(this.cullFace.set(!0),this.cullFaceSide.set(t.mode),this.frontFace.set(t.frontFace));},Lt.prototype.setDepthMode=function(t){t.func!==this.gl.ALWAYS||t.mask?(this.depthTest.set(!0),this.depthFunc.set(t.func),this.depthMask.set(t.mask),this.depthRange.set(t.range)):this.depthTest.set(!1);},Lt.prototype.setStencilMode=function(t){t.test.func!==this.gl.ALWAYS||t.mask?(this.stencilTest.set(!0),this.stencilMask.set(t.mask),this.stencilOp.set([t.fail,t.depthFail,t.pass]),this.stencilFunc.set({func:t.test.func,ref:t.ref,mask:t.test.mask})):this.stencilTest.set(!1);},Lt.prototype.setColorMode=function(e){t.deepEqual(e.blendFunction,Pt.Replace)?this.blend.set(!1):(this.blend.set(!0),this.blendFunc.set(e.blendFunction),this.blendColor.set(e.blendColor)),this.colorMask.set(e.mask);},Lt.prototype.unbindVAO=function(){this.extVertexArrayObject&&this.bindVertexArrayOES.set(null);};var Mt=function(e){function i(i,o,r){var a=this;e.call(this),this.id=i,this.dispatcher=r,this.on("data",(function(t){"source"===t.dataType&&"metadata"===t.sourceDataType&&(a._sourceLoaded=!0),a._sourceLoaded&&!a._paused&&"source"===t.dataType&&"content"===t.sourceDataType&&(a.reload(),a.transform&&a.update(a.transform));})),this.on("error",(function(){a._sourceErrored=!0;})),this._source=B(i,o,r,this),this._tiles={},this._cache=new N(0,this._unloadTile.bind(this)),this._timers={},this._cacheTimers={},this._maxTileCacheSize=null,this._loadedParentTiles={},this._coveredTiles={},this._state=new t.SourceFeatureState;}return e&&(i.__proto__=e),(i.prototype=Object.create(e&&e.prototype)).constructor=i,i.prototype.onAdd=function(t){this.map=t,this._maxTileCacheSize=t?t._maxTileCacheSize:null,this._source&&this._source.onAdd&&this._source.onAdd(t);},i.prototype.onRemove=function(t){this._source&&this._source.onRemove&&this._source.onRemove(t);},i.prototype.loaded=function(){if(this._sourceErrored)return !0;if(!this._sourceLoaded)return !1;if(!this._source.loaded())return !1;for(var t in this._tiles){var e=this._tiles[t];if("loaded"!==e.state&&"errored"!==e.state)return !1}return !0},i.prototype.getSource=function(){return this._source},i.prototype.pause=function(){this._paused=!0;},i.prototype.resume=function(){if(this._paused){var t=this._shouldReloadOnResume;this._paused=!1,this._shouldReloadOnResume=!1,t&&this.reload(),this.transform&&this.update(this.transform);}},i.prototype._loadTile=function(t,e){return this._source.loadTile(t,e)},i.prototype._unloadTile=function(t){if(this._source.unloadTile)return this._source.unloadTile(t,(function(){}))},i.prototype._abortTile=function(t){if(this._source.abortTile)return this._source.abortTile(t,(function(){}))},i.prototype.serialize=function(){return this._source.serialize()},i.prototype.prepare=function(t){for(var e in this._source.prepare&&this._source.prepare(),this._state.coalesceChanges(this._tiles,this.map?this.map.painter:null),this._tiles){var i=this._tiles[e];i.upload(t),i.prepare(this.map.style.imageManager);}},i.prototype.getIds=function(){return t.values(this._tiles).map((function(t){return t.tileID})).sort(Dt).map((function(t){return t.key}))},i.prototype.getRenderableIds=function(e){var i=this,o=[];for(var r in this._tiles)this._isIdRenderable(r,e)&&o.push(this._tiles[r]);return e?o.sort((function(e,o){var r=e.tileID,a=o.tileID,n=new t.Point(r.canonical.x,r.canonical.y)._rotate(i.transform.angle),s=new t.Point(a.canonical.x,a.canonical.y)._rotate(i.transform.angle);return r.overscaledZ-a.overscaledZ||s.y-n.y||s.x-n.x})).map((function(t){return t.tileID.key})):o.map((function(t){return t.tileID})).sort(Dt).map((function(t){return t.key}))},i.prototype.hasRenderableParent=function(t){var e=this.findLoadedParent(t,0);return !!e&&this._isIdRenderable(e.tileID.key)},i.prototype._isIdRenderable=function(t,e){return this._tiles[t]&&this._tiles[t].hasData()&&!this._coveredTiles[t]&&(e||!this._tiles[t].holdingForFade())},i.prototype.reload=function(){if(this._paused)this._shouldReloadOnResume=!0;else for(var t in this._cache.reset(),this._tiles)"errored"!==this._tiles[t].state&&this._reloadTile(t,"reloading");},i.prototype._reloadTile=function(t,e){var i=this._tiles[t];i&&("loading"!==i.state&&(i.state=e),this._loadTile(i,this._tileLoaded.bind(this,i,t,e)));},i.prototype._tileLoaded=function(e,i,o,r){if(r)return e.state="errored",void(404!==r.status?this._source.fire(new t.ErrorEvent(r,{tile:e})):this.update(this.transform));e.timeAdded=t.browser.now(),"expired"===o&&(e.refreshedUponExpiration=!0),this._setTileReloadTimer(i,e),"raster-dem"===this.getSource().type&&e.dem&&this._backfillDEM(e),this._state.initializeTileState(e,this.map?this.map.painter:null),this._source.fire(new t.Event("data",{dataType:"source",tile:e,coord:e.tileID}));},i.prototype._backfillDEM=function(t){for(var e=this.getRenderableIds(),i=0;i<e.length;i++){var o=e[i];if(t.neighboringTiles&&t.neighboringTiles[o]){var r=this.getTileByID(o);a(t,r),a(r,t);}}function a(t,e){t.needsHillshadePrepare=!0;var i=e.tileID.canonical.x-t.tileID.canonical.x,o=e.tileID.canonical.y-t.tileID.canonical.y,r=Math.pow(2,t.tileID.canonical.z),a=e.tileID.key;0===i&&0===o||Math.abs(o)>1||(Math.abs(i)>1&&(1===Math.abs(i+r)?i+=r:1===Math.abs(i-r)&&(i-=r)),e.dem&&t.dem&&(t.dem.backfillBorder(e.dem,i,o),t.neighboringTiles&&t.neighboringTiles[a]&&(t.neighboringTiles[a].backfilled=!0)));}},i.prototype.getTile=function(t){return this.getTileByID(t.key)},i.prototype.getTileByID=function(t){return this._tiles[t]},i.prototype._retainLoadedChildren=function(t,e,i,o){for(var r in this._tiles){var a=this._tiles[r];if(!(o[r]||!a.hasData()||a.tileID.overscaledZ<=e||a.tileID.overscaledZ>i)){for(var n=a.tileID;a&&a.tileID.overscaledZ>e+1;){var s=a.tileID.scaledTo(a.tileID.overscaledZ-1);(a=this._tiles[s.key])&&a.hasData()&&(n=s);}for(var l=n;l.overscaledZ>e;)if(t[(l=l.scaledTo(l.overscaledZ-1)).key]){o[n.key]=n;break}}}},i.prototype.findLoadedParent=function(t,e){if(t.key in this._loadedParentTiles){var i=this._loadedParentTiles[t.key];return i&&i.tileID.overscaledZ>=e?i:null}for(var o=t.overscaledZ-1;o>=e;o--){var r=t.scaledTo(o),a=this._getLoadedTile(r);if(a)return a}},i.prototype._getLoadedTile=function(t){var e=this._tiles[t.key];return e&&e.hasData()?e:this._cache.getByKey(t.wrapped().key)},i.prototype.updateCacheSize=function(t){var e=Math.ceil(t.width/this._source.tileSize)+1,i=Math.ceil(t.height/this._source.tileSize)+1,o=Math.floor(e*i*5),r="number"==typeof this._maxTileCacheSize?Math.min(this._maxTileCacheSize,o):o;this._cache.setMaxSize(r);},i.prototype.handleWrapJump=function(t){var e=Math.round((t-(void 0===this._prevLng?t:this._prevLng))/360);if(this._prevLng=t,e){var i={};for(var o in this._tiles){var r=this._tiles[o];r.tileID=r.tileID.unwrapTo(r.tileID.wrap+e),i[r.tileID.key]=r;}for(var a in this._tiles=i,this._timers)clearTimeout(this._timers[a]),delete this._timers[a];for(var n in this._tiles)this._setTileReloadTimer(n,this._tiles[n]);}},i.prototype.update=function(e){var o=this;if(this.transform=e,this._sourceLoaded&&!this._paused){var r;this.updateCacheSize(e),this.handleWrapJump(this.transform.center.lng),this._coveredTiles={},this.used?this._source.tileID?r=e.getVisibleUnwrappedCoordinates(this._source.tileID).map((function(e){return new t.OverscaledTileID(e.canonical.z,e.wrap,e.canonical.z,e.canonical.x,e.canonical.y)})):(r=e.coveringTiles({tileSize:this._source.tileSize,minzoom:this._source.minzoom,maxzoom:this._source.maxzoom,roundZoom:this._source.roundZoom,reparseOverscaled:this._source.reparseOverscaled}),this._source.hasTile&&(r=r.filter((function(t){return o._source.hasTile(t)})))):r=[];var a=e.coveringZoomLevel(this._source),n=Math.max(a-i.maxOverzooming,this._source.minzoom),s=Math.max(a+i.maxUnderzooming,this._source.minzoom),l=this._updateRetainedTiles(r,a);if(At(this._source.type)){for(var c={},u={},h=0,p=Object.keys(l);h<p.length;h+=1){var d=p[h],_=l[d],f=this._tiles[d];if(f&&!(f.fadeEndTime&&f.fadeEndTime<=t.browser.now())){var m=this.findLoadedParent(_,n);m&&(this._addTile(m.tileID),c[m.tileID.key]=m.tileID),u[d]=_;}}for(var g in this._retainLoadedChildren(u,a,s,l),c)l[g]||(this._coveredTiles[g]=!0,l[g]=c[g]);}for(var v in l)this._tiles[v].clearFadeHold();for(var y=0,x=t.keysDifference(this._tiles,l);y<x.length;y+=1){var b=x[y],w=this._tiles[b];w.hasSymbolBuckets&&!w.holdingForFade()?w.setHoldDuration(this.map._fadeDuration):w.hasSymbolBuckets&&!w.symbolFadeFinished()||this._removeTile(b);}this._updateLoadedParentTileCache();}},i.prototype.releaseSymbolFadeTiles=function(){for(var t in this._tiles)this._tiles[t].holdingForFade()&&this._removeTile(t);},i.prototype._updateRetainedTiles=function(t,e){for(var o={},r={},a=Math.max(e-i.maxOverzooming,this._source.minzoom),n=Math.max(e+i.maxUnderzooming,this._source.minzoom),s={},l=0,c=t;l<c.length;l+=1){var u=c[l],h=this._addTile(u);o[u.key]=u,h.hasData()||e<this._source.maxzoom&&(s[u.key]=u);}this._retainLoadedChildren(s,e,n,o);for(var p=0,d=t;p<d.length;p+=1){var _=d[p],f=this._tiles[_.key];if(!f.hasData()){if(e+1>this._source.maxzoom){var m=_.children(this._source.maxzoom)[0],g=this.getTile(m);if(g&&g.hasData()){o[m.key]=m;continue}}else{var v=_.children(this._source.maxzoom);if(o[v[0].key]&&o[v[1].key]&&o[v[2].key]&&o[v[3].key])continue}for(var y=f.wasRequested(),x=_.overscaledZ-1;x>=a;--x){var b=_.scaledTo(x);if(r[b.key])break;if(r[b.key]=!0,!(f=this.getTile(b))&&y&&(f=this._addTile(b)),f&&(o[b.key]=b,y=f.wasRequested(),f.hasData()))break}}}return o},i.prototype._updateLoadedParentTileCache=function(){for(var t in this._loadedParentTiles={},this._tiles){for(var e=[],i=void 0,o=this._tiles[t].tileID;o.overscaledZ>0;){if(o.key in this._loadedParentTiles){i=this._loadedParentTiles[o.key];break}e.push(o.key);var r=o.scaledTo(o.overscaledZ-1);if(i=this._getLoadedTile(r))break;o=r;}for(var a=0,n=e;a<n.length;a+=1)this._loadedParentTiles[n[a]]=i;}},i.prototype._addTile=function(e){var i=this._tiles[e.key];if(i)return i;(i=this._cache.getAndRemove(e))&&(this._setTileReloadTimer(e.key,i),i.tileID=e,this._state.initializeTileState(i,this.map?this.map.painter:null),this._cacheTimers[e.key]&&(clearTimeout(this._cacheTimers[e.key]),delete this._cacheTimers[e.key],this._setTileReloadTimer(e.key,i)));var o=Boolean(i);return o||(i=new t.Tile(e,this._source.tileSize*e.overscaleFactor()),this._loadTile(i,this._tileLoaded.bind(this,i,e.key,i.state))),i?(i.uses++,this._tiles[e.key]=i,o||this._source.fire(new t.Event("dataloading",{tile:i,coord:i.tileID,dataType:"source"})),i):null},i.prototype._setTileReloadTimer=function(t,e){var i=this;t in this._timers&&(clearTimeout(this._timers[t]),delete this._timers[t]);var o=e.getExpiryTimeout();o&&(this._timers[t]=setTimeout((function(){i._reloadTile(t,"expired"),delete i._timers[t];}),o));},i.prototype._removeTile=function(t){var e=this._tiles[t];e&&(e.uses--,delete this._tiles[t],this._timers[t]&&(clearTimeout(this._timers[t]),delete this._timers[t]),e.uses>0||(e.hasData()&&"reloading"!==e.state?this._cache.add(e.tileID,e,e.getExpiryTimeout()):(e.aborted=!0,this._abortTile(e),this._unloadTile(e))));},i.prototype.clearTiles=function(){for(var t in this._shouldReloadOnResume=!1,this._paused=!1,this._tiles)this._removeTile(t);this._cache.reset();},i.prototype.tilesIn=function(e,i,o){var r=this,a=[],n=this.transform;if(!n)return a;for(var s=o?n.getCameraQueryGeometry(e):e,l=e.map((function(t){return n.pointCoordinate(t)})),c=s.map((function(t){return n.pointCoordinate(t)})),u=this.getIds(),h=1/0,p=1/0,d=-1/0,_=-1/0,f=0,m=c;f<m.length;f+=1){var g=m[f];h=Math.min(h,g.x),p=Math.min(p,g.y),d=Math.max(d,g.x),_=Math.max(_,g.y);}for(var v=function(e){var o=r._tiles[u[e]];if(!o.holdingForFade()){var s=o.tileID,f=Math.pow(2,n.zoom-o.tileID.overscaledZ),m=i*o.queryPadding*t.EXTENT/o.tileSize/f,g=[s.getTilePoint(new t.MercatorCoordinate(h,p)),s.getTilePoint(new t.MercatorCoordinate(d,_))];if(g[0].x-m<t.EXTENT&&g[0].y-m<t.EXTENT&&g[1].x+m>=0&&g[1].y+m>=0){var v=l.map((function(t){return s.getTilePoint(t)})),y=c.map((function(t){return s.getTilePoint(t)}));a.push({tile:o,tileID:s,queryGeometry:v,cameraQueryGeometry:y,scale:f});}}},y=0;y<u.length;y++)v(y);return a},i.prototype.getVisibleCoordinates=function(t){for(var e=this,i=this.getRenderableIds(t).map((function(t){return e._tiles[t].tileID})),o=0,r=i;o<r.length;o+=1){var a=r[o];a.posMatrix=this.transform.calculatePosMatrix(a.toUnwrapped());}return i},i.prototype.hasTransition=function(){if(this._source.hasTransition())return !0;if(At(this._source.type))for(var e in this._tiles){var i=this._tiles[e];if(void 0!==i.fadeEndTime&&i.fadeEndTime>=t.browser.now())return !0}return !1},i.prototype.setFeatureState=function(t,e,i){this._state.updateState(t=t||"_geojsonTileLayer",e,i);},i.prototype.removeFeatureState=function(t,e,i){this._state.removeFeatureState(t=t||"_geojsonTileLayer",e,i);},i.prototype.getFeatureState=function(t,e){return this._state.getState(t=t||"_geojsonTileLayer",e)},i.prototype.setDependencies=function(t,e,i){var o=this._tiles[t];o&&o.setDependencies(e,i);},i.prototype.reloadTilesForDependencies=function(t,e){for(var i in this._tiles)this._tiles[i].hasDependency(t,e)&&this._reloadTile(i,"reloading");this._cache.filter((function(i){return !i.hasDependency(t,e)}));},i}(t.Evented);function Dt(t,e){var i=Math.abs(2*t.wrap)-+(t.wrap<0),o=Math.abs(2*e.wrap)-+(e.wrap<0);return t.overscaledZ-e.overscaledZ||o-i||e.canonical.y-t.canonical.y||e.canonical.x-t.canonical.x}function At(t){return "raster"===t||"image"===t||"video"===t}function Rt(){return new t.window.Worker(mr.workerUrl)}Mt.maxOverzooming=10,Mt.maxUnderzooming=3;var kt=function(){this.active={};};kt.prototype.acquire=function(t){if(!this.workers)for(this.workers=[];this.workers.length<kt.workerCount;)this.workers.push(new Rt);return this.active[t]=!0,this.workers.slice()},kt.prototype.release=function(t){delete this.active[t],0===Object.keys(this.active).length&&(this.workers.forEach((function(t){t.terminate();})),this.workers=null);};var Bt,Ot=Math.floor(t.browser.hardwareConcurrency/2);function Ft(e,i){var o={};for(var r in e)"ref"!==r&&(o[r]=e[r]);return t.refProperties.forEach((function(t){t in i&&(o[t]=i[t]);})),o}function Ut(t){t=t.slice();for(var e=Object.create(null),i=0;i<t.length;i++)e[t[i].id]=t[i];for(var o=0;o<t.length;o++)"ref"in t[o]&&(t[o]=Ft(t[o],e[t[o].ref]));return t}kt.workerCount=Math.max(Math.min(Ot,6),1);var Nt={setStyle:"setStyle",addLayer:"addLayer",removeLayer:"removeLayer",setPaintProperty:"setPaintProperty",setLayoutProperty:"setLayoutProperty",setFilter:"setFilter",addSource:"addSource",removeSource:"removeSource",setGeoJSONSourceData:"setGeoJSONSourceData",setLayerZoomRange:"setLayerZoomRange",setLayerProperty:"setLayerProperty",setCenter:"setCenter",setZoom:"setZoom",setBearing:"setBearing",setPitch:"setPitch",setSprite:"setSprite",setGlyphs:"setGlyphs",setTransition:"setTransition",setLight:"setLight"};function Zt(t,e,i){i.push({command:Nt.addSource,args:[t,e[t]]});}function qt(t,e,i){e.push({command:Nt.removeSource,args:[t]}),i[t]=!0;}function jt(t,e,i,o){qt(t,i,o),Zt(t,e,i);}function Vt(e,i,o){var r;for(r in e[o])if(e[o].hasOwnProperty(r)&&"data"!==r&&!t.deepEqual(e[o][r],i[o][r]))return !1;for(r in i[o])if(i[o].hasOwnProperty(r)&&"data"!==r&&!t.deepEqual(e[o][r],i[o][r]))return !1;return !0}function Gt(e,i,o,r,a,n){var s;for(s in i=i||{},e=e||{})e.hasOwnProperty(s)&&(t.deepEqual(e[s],i[s])||o.push({command:n,args:[r,s,i[s],a]}));for(s in i)i.hasOwnProperty(s)&&!e.hasOwnProperty(s)&&(t.deepEqual(e[s],i[s])||o.push({command:n,args:[r,s,i[s],a]}));}function Wt(t){return t.id}function Xt(t,e){return t[e.id]=e,t}var Ht=function(t,e,i){var o=this.boxCells=[],r=this.circleCells=[];this.xCellCount=Math.ceil(t/i),this.yCellCount=Math.ceil(e/i);for(var a=0;a<this.xCellCount*this.yCellCount;a++)o.push([]),r.push([]);this.circleKeys=[],this.boxKeys=[],this.bboxes=[],this.circles=[],this.width=t,this.height=e,this.xScale=this.xCellCount/t,this.yScale=this.yCellCount/e,this.boxUid=0,this.circleUid=0;};function Kt(e,i,o,r,a){var n=t.create();return i?(t.scale(n,n,[1/a,1/a,1]),o||t.rotateZ(n,n,r.angle)):t.multiply(n,r.labelPlaneMatrix,e),n}function Yt(e,i,o,r,a){if(i){var n=t.clone(e);return t.scale(n,n,[a,a,1]),o||t.rotateZ(n,n,-r.angle),n}return r.glCoordMatrix}function Jt(e,i){var o=[e.x,e.y,0,1];se(o,o,i);var r=o[3];return {point:new t.Point(o[0]/r,o[1]/r),signedDistanceFromCamera:r}}function Qt(t,e){var i=t[0]/t[3],o=t[1]/t[3];return i>=-e[0]&&i<=e[0]&&o>=-e[1]&&o<=e[1]}function $t(e,i,o,r,a,n,s,l){var c=r?e.textSizeData:e.iconSizeData,u=t.evaluateSizeForZoom(c,o.transform.zoom),h=[256/o.width*2+1,256/o.height*2+1],p=r?e.text.dynamicLayoutVertexArray:e.icon.dynamicLayoutVertexArray;p.clear();for(var d=e.lineVertexArray,_=r?e.text.placedSymbolArray:e.icon.placedSymbolArray,f=o.transform.width/o.transform.height,m=!1,g=0;g<_.length;g++){var v=_.get(g);if(v.hidden||v.writingMode===t.WritingMode.vertical&&!m)ne(v.numGlyphs,p);else{m=!1;var y=[v.anchorX,v.anchorY,0,1];if(t.transformMat4(y,y,i),Qt(y,h)){var x=.5+y[3]/o.transform.cameraToCenterDistance*.5,b=t.evaluateSizeForFeature(c,u,v),w=s?b*x:b/x,E=new t.Point(v.anchorX,v.anchorY),T=Jt(E,a).point,I={},C=ie(v,w,!1,l,i,a,n,e.glyphOffsetArray,d,p,T,E,I,f);m=C.useVertical,(C.notEnoughRoom||m||C.needsFlipping&&ie(v,w,!0,l,i,a,n,e.glyphOffsetArray,d,p,T,E,I,f).notEnoughRoom)&&ne(v.numGlyphs,p);}else ne(v.numGlyphs,p);}}r?e.text.dynamicLayoutVertexBuffer.updateData(p):e.icon.dynamicLayoutVertexBuffer.updateData(p);}function te(t,e,i,o,r,a,n,s,l,c,u,h){var p=s.glyphStartIndex+s.numGlyphs,d=s.lineStartIndex,_=s.lineStartIndex+s.lineLength,f=e.getoffsetX(s.glyphStartIndex),m=e.getoffsetX(p-1),g=re(t*f,i,o,r,a,n,s.segment,d,_,l,c,u,h);if(!g)return null;var v=re(t*m,i,o,r,a,n,s.segment,d,_,l,c,u,h);return v?{first:g,last:v}:null}function ee(e,i,o,r){return e===t.WritingMode.horizontal&&Math.abs(o.y-i.y)>Math.abs(o.x-i.x)*r?{useVertical:!0}:(e===t.WritingMode.vertical?i.y<o.y:i.x>o.x)?{needsFlipping:!0}:null}function ie(e,i,o,r,a,n,s,l,c,u,h,p,d,_){var f,m=i/24,g=e.lineOffsetX*m,v=e.lineOffsetY*m;if(e.numGlyphs>1){var y=e.glyphStartIndex+e.numGlyphs,x=e.lineStartIndex,b=e.lineStartIndex+e.lineLength,w=te(m,l,g,v,o,h,p,e,c,n,d,!1);if(!w)return {notEnoughRoom:!0};var E=Jt(w.first.point,s).point,T=Jt(w.last.point,s).point;if(r&&!o){var I=ee(e.writingMode,E,T,_);if(I)return I}f=[w.first];for(var C=e.glyphStartIndex+1;C<y-1;C++)f.push(re(m*l.getoffsetX(C),g,v,o,h,p,e.segment,x,b,c,n,d,!1));f.push(w.last);}else{if(r&&!o){var S=Jt(p,a).point,P=e.lineStartIndex+e.segment+1,z=new t.Point(c.getx(P),c.gety(P)),L=Jt(z,a),M=L.signedDistanceFromCamera>0?L.point:oe(p,z,S,1,a),D=ee(e.writingMode,S,M,_);if(D)return D}var A=re(m*l.getoffsetX(e.glyphStartIndex),g,v,o,h,p,e.segment,e.lineStartIndex,e.lineStartIndex+e.lineLength,c,n,d,!1);if(!A)return {notEnoughRoom:!0};f=[A];}for(var R=0,k=f;R<k.length;R+=1){var B=k[R];t.addDynamicAttributes(u,B.point,B.angle);}return {}}function oe(t,e,i,o,r){var a=Jt(t.add(t.sub(e)._unit()),r).point,n=i.sub(a);return i.add(n._mult(o/n.mag()))}function re(e,i,o,r,a,n,s,l,c,u,h,p,d){var _=r?e-i:e+i,f=_>0?1:-1,m=0;r&&(f*=-1,m=Math.PI),f<0&&(m+=Math.PI);for(var g=f>0?l+s:l+s+1,v=g,y=a,x=a,b=0,w=0,E=Math.abs(_);b+w<=E;){if((g+=f)<l||g>=c)return null;if(x=y,void 0===(y=p[g])){var T=new t.Point(u.getx(g),u.gety(g)),I=Jt(T,h);if(I.signedDistanceFromCamera>0)y=p[g]=I.point;else{var C=g-f;y=oe(0===b?n:new t.Point(u.getx(C),u.gety(C)),T,x,E-b+1,h);}}b+=w,w=x.dist(y);}var S=(E-b)/w,P=y.sub(x),z=P.mult(S)._add(x);return z._add(P._unit()._perp()._mult(o*f)),{point:z,angle:m+Math.atan2(y.y-x.y,y.x-x.x),tileDistance:d?{prevTileDistance:g-f===v?0:u.gettileUnitDistanceFromAnchor(g-f),lastSegmentViewportDistance:E-b}:null}}Ht.prototype.keysLength=function(){return this.boxKeys.length+this.circleKeys.length},Ht.prototype.insert=function(t,e,i,o,r){this._forEachCell(e,i,o,r,this._insertBoxCell,this.boxUid++),this.boxKeys.push(t),this.bboxes.push(e),this.bboxes.push(i),this.bboxes.push(o),this.bboxes.push(r);},Ht.prototype.insertCircle=function(t,e,i,o){this._forEachCell(e-o,i-o,e+o,i+o,this._insertCircleCell,this.circleUid++),this.circleKeys.push(t),this.circles.push(e),this.circles.push(i),this.circles.push(o);},Ht.prototype._insertBoxCell=function(t,e,i,o,r,a){this.boxCells[r].push(a);},Ht.prototype._insertCircleCell=function(t,e,i,o,r,a){this.circleCells[r].push(a);},Ht.prototype._query=function(t,e,i,o,r,a){if(i<0||t>this.width||o<0||e>this.height)return !r&&[];var n=[];if(t<=0&&e<=0&&this.width<=i&&this.height<=o){if(r)return !0;for(var s=0;s<this.boxKeys.length;s++)n.push({key:this.boxKeys[s],x1:this.bboxes[4*s],y1:this.bboxes[4*s+1],x2:this.bboxes[4*s+2],y2:this.bboxes[4*s+3]});for(var l=0;l<this.circleKeys.length;l++){var c=this.circles[3*l],u=this.circles[3*l+1],h=this.circles[3*l+2];n.push({key:this.circleKeys[l],x1:c-h,y1:u-h,x2:c+h,y2:u+h});}return a?n.filter(a):n}return this._forEachCell(t,e,i,o,this._queryCell,n,{hitTest:r,seenUids:{box:{},circle:{}}},a),r?n.length>0:n},Ht.prototype._queryCircle=function(t,e,i,o,r){var a=t-i,n=t+i,s=e-i,l=e+i;if(n<0||a>this.width||l<0||s>this.height)return !o&&[];var c=[];return this._forEachCell(a,s,n,l,this._queryCellCircle,c,{hitTest:o,circle:{x:t,y:e,radius:i},seenUids:{box:{},circle:{}}},r),o?c.length>0:c},Ht.prototype.query=function(t,e,i,o,r){return this._query(t,e,i,o,!1,r)},Ht.prototype.hitTest=function(t,e,i,o,r){return this._query(t,e,i,o,!0,r)},Ht.prototype.hitTestCircle=function(t,e,i,o){return this._queryCircle(t,e,i,!0,o)},Ht.prototype._queryCell=function(t,e,i,o,r,a,n,s){var l=n.seenUids,c=this.boxCells[r];if(null!==c)for(var u=this.bboxes,h=0,p=c;h<p.length;h+=1){var d=p[h];if(!l.box[d]){l.box[d]=!0;var _=4*d;if(t<=u[_+2]&&e<=u[_+3]&&i>=u[_+0]&&o>=u[_+1]&&(!s||s(this.boxKeys[d]))){if(n.hitTest)return a.push(!0),!0;a.push({key:this.boxKeys[d],x1:u[_],y1:u[_+1],x2:u[_+2],y2:u[_+3]});}}}var f=this.circleCells[r];if(null!==f)for(var m=this.circles,g=0,v=f;g<v.length;g+=1){var y=v[g];if(!l.circle[y]){l.circle[y]=!0;var x=3*y;if(this._circleAndRectCollide(m[x],m[x+1],m[x+2],t,e,i,o)&&(!s||s(this.circleKeys[y]))){if(n.hitTest)return a.push(!0),!0;var b=m[x],w=m[x+1],E=m[x+2];a.push({key:this.circleKeys[y],x1:b-E,y1:w-E,x2:b+E,y2:w+E});}}}},Ht.prototype._queryCellCircle=function(t,e,i,o,r,a,n,s){var l=n.circle,c=n.seenUids,u=this.boxCells[r];if(null!==u)for(var h=this.bboxes,p=0,d=u;p<d.length;p+=1){var _=d[p];if(!c.box[_]){c.box[_]=!0;var f=4*_;if(this._circleAndRectCollide(l.x,l.y,l.radius,h[f+0],h[f+1],h[f+2],h[f+3])&&(!s||s(this.boxKeys[_])))return a.push(!0),!0}}var m=this.circleCells[r];if(null!==m)for(var g=this.circles,v=0,y=m;v<y.length;v+=1){var x=y[v];if(!c.circle[x]){c.circle[x]=!0;var b=3*x;if(this._circlesCollide(g[b],g[b+1],g[b+2],l.x,l.y,l.radius)&&(!s||s(this.circleKeys[x])))return a.push(!0),!0}}},Ht.prototype._forEachCell=function(t,e,i,o,r,a,n,s){for(var l=this._convertToXCellCoord(t),c=this._convertToYCellCoord(e),u=this._convertToXCellCoord(i),h=this._convertToYCellCoord(o),p=l;p<=u;p++)for(var d=c;d<=h;d++)if(r.call(this,t,e,i,o,this.xCellCount*d+p,a,n,s))return},Ht.prototype._convertToXCellCoord=function(t){return Math.max(0,Math.min(this.xCellCount-1,Math.floor(t*this.xScale)))},Ht.prototype._convertToYCellCoord=function(t){return Math.max(0,Math.min(this.yCellCount-1,Math.floor(t*this.yScale)))},Ht.prototype._circlesCollide=function(t,e,i,o,r,a){var n=o-t,s=r-e,l=i+a;return l*l>n*n+s*s},Ht.prototype._circleAndRectCollide=function(t,e,i,o,r,a,n){var s=(a-o)/2,l=Math.abs(t-(o+s));if(l>s+i)return !1;var c=(n-r)/2,u=Math.abs(e-(r+c));if(u>c+i)return !1;if(l<=s||u<=c)return !0;var h=l-s,p=u-c;return h*h+p*p<=i*i};var ae=new Float32Array([-1/0,-1/0,0,-1/0,-1/0,0,-1/0,-1/0,0,-1/0,-1/0,0]);function ne(t,e){for(var i=0;i<t;i++){var o=e.length;e.resize(o+4),e.float32.set(ae,3*o);}}function se(t,e,i){var o=e[0],r=e[1];return t[0]=i[0]*o+i[4]*r+i[12],t[1]=i[1]*o+i[5]*r+i[13],t[3]=i[3]*o+i[7]*r+i[15],t}var le=function(t,e,i){void 0===e&&(e=new Ht(t.width+200,t.height+200,25)),void 0===i&&(i=new Ht(t.width+200,t.height+200,25)),this.transform=t,this.grid=e,this.ignoredGrid=i,this.pitchfactor=Math.cos(t._pitch)*t.cameraToCenterDistance,this.screenRightBoundary=t.width+100,this.screenBottomBoundary=t.height+100,this.gridRightBoundary=t.width+200,this.gridBottomBoundary=t.height+200;};function ce(t,e,i){t[e+4]=i?1:0;}function ue(e,i,o){return i*(t.EXTENT/(e.tileSize*Math.pow(2,o-e.tileID.overscaledZ)))}le.prototype.placeCollisionBox=function(t,e,i,o,r){var a=this.projectAndGetPerspectiveRatio(o,t.anchorPointX,t.anchorPointY),n=i*a.perspectiveRatio,s=t.x1*n+a.point.x,l=t.y1*n+a.point.y,c=t.x2*n+a.point.x,u=t.y2*n+a.point.y;return !this.isInsideGrid(s,l,c,u)||!e&&this.grid.hitTest(s,l,c,u,r)?{box:[],offscreen:!1}:{box:[s,l,c,u],offscreen:this.isOffscreen(s,l,c,u)}},le.prototype.approximateTileDistance=function(t,e,i,o,r){var a=t.lastSegmentViewportDistance*i;return t.prevTileDistance+a+((r?1:o/this.pitchfactor)-1)*a*Math.abs(Math.sin(e))},le.prototype.placeCollisionCircles=function(e,i,o,r,a,n,s,l,c,u,h,p,d){var _=[],f=this.projectAnchor(c,a.anchorX,a.anchorY),m=l/24,g=a.lineOffsetX*l,v=a.lineOffsetY*l,y=new t.Point(a.anchorX,a.anchorY),x=te(m,s,g,v,!1,Jt(y,u).point,y,a,n,u,{},!0),b=!1,w=!1,E=!0,T=f.perspectiveRatio*r,I=1/(r*o),C=0,S=0;x&&(C=this.approximateTileDistance(x.first.tileDistance,x.first.angle,I,f.cameraDistance,p),S=this.approximateTileDistance(x.last.tileDistance,x.last.angle,I,f.cameraDistance,p));for(var P=0;P<e.length;P+=5){var z=e[P],L=e[P+1],M=e[P+2],D=e[P+3];if(!x||D<-C||D>S)ce(e,P,!1);else{var A=this.projectPoint(c,z,L),R=M*T;if(_.length>0){var k=A.x-_[_.length-4],B=A.y-_[_.length-3];if(R*R*2>k*k+B*B&&P+8<e.length){var O=e[P+8];if(O>-C&&O<S){ce(e,P,!1);continue}}}_.push(A.x,A.y,R,P/5),ce(e,P,!0);var F=A.x-R,U=A.y-R,N=A.x+R,Z=A.y+R;if(E=E&&this.isOffscreen(F,U,N,Z),w=w||this.isInsideGrid(F,U,N,Z),!i&&this.grid.hitTestCircle(A.x,A.y,R,d)){if(!h)return {circles:[],offscreen:!1};b=!0;}}}return {circles:b||!w?[]:_,offscreen:E}},le.prototype.queryRenderedSymbols=function(e){if(0===e.length||0===this.grid.keysLength()&&0===this.ignoredGrid.keysLength())return {};for(var i=[],o=1/0,r=1/0,a=-1/0,n=-1/0,s=0,l=e;s<l.length;s+=1){var c=l[s],u=new t.Point(c.x+100,c.y+100);o=Math.min(o,u.x),r=Math.min(r,u.y),a=Math.max(a,u.x),n=Math.max(n,u.y),i.push(u);}for(var h={},p={},d=0,_=this.grid.query(o,r,a,n).concat(this.ignoredGrid.query(o,r,a,n));d<_.length;d+=1){var f=_[d],m=f.key;if(void 0===h[m.bucketInstanceId]&&(h[m.bucketInstanceId]={}),!h[m.bucketInstanceId][m.featureIndex]){var g=[new t.Point(f.x1,f.y1),new t.Point(f.x2,f.y1),new t.Point(f.x2,f.y2),new t.Point(f.x1,f.y2)];t.polygonIntersectsPolygon(i,g)&&(h[m.bucketInstanceId][m.featureIndex]=!0,void 0===p[m.bucketInstanceId]&&(p[m.bucketInstanceId]=[]),p[m.bucketInstanceId].push(m.featureIndex));}}return p},le.prototype.insertCollisionBox=function(t,e,i,o,r){(e?this.ignoredGrid:this.grid).insert({bucketInstanceId:i,featureIndex:o,collisionGroupID:r},t[0],t[1],t[2],t[3]);},le.prototype.insertCollisionCircles=function(t,e,i,o,r){for(var a=e?this.ignoredGrid:this.grid,n={bucketInstanceId:i,featureIndex:o,collisionGroupID:r},s=0;s<t.length;s+=4)a.insertCircle(n,t[s],t[s+1],t[s+2]);},le.prototype.projectAnchor=function(t,e,i){var o=[e,i,0,1];return se(o,o,t),{perspectiveRatio:.5+this.transform.cameraToCenterDistance/o[3]*.5,cameraDistance:o[3]}},le.prototype.projectPoint=function(e,i,o){var r=[i,o,0,1];return se(r,r,e),new t.Point((r[0]/r[3]+1)/2*this.transform.width+100,(-r[1]/r[3]+1)/2*this.transform.height+100)},le.prototype.projectAndGetPerspectiveRatio=function(e,i,o){var r=[i,o,0,1];return se(r,r,e),{point:new t.Point((r[0]/r[3]+1)/2*this.transform.width+100,(-r[1]/r[3]+1)/2*this.transform.height+100),perspectiveRatio:.5+this.transform.cameraToCenterDistance/r[3]*.5}},le.prototype.isOffscreen=function(t,e,i,o){return i<100||t>=this.screenRightBoundary||o<100||e>this.screenBottomBoundary},le.prototype.isInsideGrid=function(t,e,i,o){return i>=0&&t<this.gridRightBoundary&&o>=0&&e<this.gridBottomBoundary};var he=function(t,e,i,o){this.opacity=t?Math.max(0,Math.min(1,t.opacity+(t.placed?e:-e))):o&&i?1:0,this.placed=i;};he.prototype.isHidden=function(){return 0===this.opacity&&!this.placed};var pe=function(t,e,i,o,r){this.text=new he(t?t.text:null,e,i,r),this.icon=new he(t?t.icon:null,e,o,r);};pe.prototype.isHidden=function(){return this.text.isHidden()&&this.icon.isHidden()};var de=function(t,e,i){this.text=t,this.icon=e,this.skipFade=i;},_e=function(t,e,i,o,r){this.bucketInstanceId=t,this.featureIndex=e,this.sourceLayerIndex=i,this.bucketIndex=o,this.tileID=r;},fe=function(t){this.crossSourceCollisions=t,this.maxGroupID=0,this.collisionGroups={};};function me(e,i,o,r,a){var n=t.getAnchorAlignment(e),s=-(n.horizontalAlign-.5)*i,l=-(n.verticalAlign-.5)*o,c=t.evaluateVariableOffset(e,r);return new t.Point(s+c[0]*a,l+c[1]*a)}function ge(e,i,o,r,a,n){var s=e.x1,l=e.x2,c=e.y1,u=e.y2,h=e.anchorPointX,p=e.anchorPointY,d=new t.Point(i,o);return r&&d._rotate(a?n:-n),{x1:s+d.x,y1:c+d.y,x2:l+d.x,y2:u+d.y,anchorPointX:h,anchorPointY:p}}fe.prototype.get=function(t){if(this.crossSourceCollisions)return {ID:0,predicate:null};if(!this.collisionGroups[t]){var e=++this.maxGroupID;this.collisionGroups[t]={ID:e,predicate:function(t){return t.collisionGroupID===e}};}return this.collisionGroups[t]};var ve=function(t,e,i,o){this.transform=t.clone(),this.collisionIndex=new le(this.transform),this.placements={},this.opacities={},this.variableOffsets={},this.stale=!1,this.commitTime=0,this.fadeDuration=e,this.retainedQueryData={},this.collisionGroups=new fe(i),this.prevPlacement=o,o&&(o.prevPlacement=void 0),this.placedOrientations={};};function ye(t,e,i,o,r){t.emplaceBack(e?1:0,i?1:0,o||0,r||0),t.emplaceBack(e?1:0,i?1:0,o||0,r||0),t.emplaceBack(e?1:0,i?1:0,o||0,r||0),t.emplaceBack(e?1:0,i?1:0,o||0,r||0);}ve.prototype.getBucketParts=function(e,i,o,r){var a=o.getBucket(i),n=o.latestFeatureIndex;if(a&&n&&i.id===a.layerIds[0]){var s=o.collisionBoxArray,l=a.layers[0].layout,c=Math.pow(2,this.transform.zoom-o.tileID.overscaledZ),u=o.tileSize/t.EXTENT,h=this.transform.calculatePosMatrix(o.tileID.toUnwrapped()),p=Kt(h,"map"===l.get("text-pitch-alignment"),"map"===l.get("text-rotation-alignment"),this.transform,ue(o,1,this.transform.zoom));this.retainedQueryData[a.bucketInstanceId]=new _e(a.bucketInstanceId,n,a.sourceLayerIndex,a.index,o.tileID);var d={bucket:a,layout:l,posMatrix:h,textLabelPlaneMatrix:p,scale:c,textPixelRatio:u,holdingForFade:o.holdingForFade(),collisionBoxArray:s,partiallyEvaluatedTextSize:t.evaluateSizeForZoom(a.textSizeData,this.transform.zoom),collisionGroup:this.collisionGroups.get(a.sourceID)};if(r)for(var _=0,f=a.sortKeyRanges;_<f.length;_+=1){var m=f[_];e.push({sortKey:m.sortKey,symbolInstanceStart:m.symbolInstanceStart,symbolInstanceEnd:m.symbolInstanceEnd,parameters:d});}else e.push({symbolInstanceStart:0,symbolInstanceEnd:a.symbolInstances.length,parameters:d});}},ve.prototype.attemptAnchorPlacement=function(t,e,i,o,r,a,n,s,l,c,u,h,p,d,_){var f,m=[h.textOffset0,h.textOffset1],g=me(t,i,o,m,r),v=this.collisionIndex.placeCollisionBox(ge(e,g.x,g.y,a,n,this.transform.angle),u,s,l,c.predicate);if(!_||0!==this.collisionIndex.placeCollisionBox(ge(_,g.x,g.y,a,n,this.transform.angle),u,s,l,c.predicate).box.length)return v.box.length>0?(this.prevPlacement&&this.prevPlacement.variableOffsets[h.crossTileID]&&this.prevPlacement.placements[h.crossTileID]&&this.prevPlacement.placements[h.crossTileID].text&&(f=this.prevPlacement.variableOffsets[h.crossTileID].anchor),this.variableOffsets[h.crossTileID]={textOffset:m,width:i,height:o,anchor:t,textBoxScale:r,prevAnchor:f},this.markUsedJustification(p,t,h,d),p.allowVerticalPlacement&&(this.markUsedOrientation(p,d,h),this.placedOrientations[h.crossTileID]=d),{shift:g,placedGlyphBoxes:v}):void 0},ve.prototype.placeLayerBucketPart=function(e,i,o){var r=this,a=e.parameters,n=a.bucket,s=a.layout,l=a.posMatrix,c=a.textLabelPlaneMatrix,u=a.scale,h=a.textPixelRatio,p=a.holdingForFade,d=a.collisionBoxArray,_=a.partiallyEvaluatedTextSize,f=a.collisionGroup,m=s.get("text-optional"),g=s.get("icon-optional"),v=s.get("text-allow-overlap"),y=s.get("icon-allow-overlap"),x="map"===s.get("text-rotation-alignment"),b="map"===s.get("text-pitch-alignment"),w="none"!==s.get("icon-text-fit"),E="viewport-y"===s.get("symbol-z-order"),T=v&&(y||!n.hasIconData()||g),I=y&&(v||!n.hasTextData()||m);!n.collisionArrays&&d&&n.deserializeCollisionBoxes(d);var C=function(e,a){if(!i[e.crossTileID])if(p)r.placements[e.crossTileID]=new de(!1,!1,!1);else{var d,E=!1,C=!1,S=!0,P=null,z={box:null,offscreen:null},L={box:null,offscreen:null},M=null,D=null,A=0,R=0,k=0;a.textFeatureIndex&&(A=a.textFeatureIndex),a.verticalTextFeatureIndex&&(R=a.verticalTextFeatureIndex);var B=a.textBox;if(B){var O=function(i){var o=t.WritingMode.horizontal;if(n.allowVerticalPlacement&&!i&&r.prevPlacement){var a=r.prevPlacement.placedOrientations[e.crossTileID];a&&(r.placedOrientations[e.crossTileID]=a,r.markUsedOrientation(n,o=a,e));}return o},F=function(i,o){if(n.allowVerticalPlacement&&e.numVerticalGlyphVertices>0&&a.verticalTextBox)for(var r=0,s=n.writingModes;r<s.length&&(s[r]===t.WritingMode.vertical?(z=o(),L=z):z=i(),!(z&&z.box&&z.box.length));r+=1);else z=i();};if(s.get("text-variable-anchor")){var U=s.get("text-variable-anchor");if(r.prevPlacement&&r.prevPlacement.variableOffsets[e.crossTileID]){var N=r.prevPlacement.variableOffsets[e.crossTileID];U.indexOf(N.anchor)>0&&(U=U.filter((function(t){return t!==N.anchor}))).unshift(N.anchor);}var Z=function(t,i,o){for(var a=t.x2-t.x1,s=t.y2-t.y1,c=e.textBoxScale,u=w&&!y?i:null,p={box:[],offscreen:!1},d=v?2*U.length:U.length,_=0;_<d;++_){var m=r.attemptAnchorPlacement(U[_%U.length],t,a,s,c,x,b,h,l,f,_>=U.length,e,n,o,u);if(m&&(p=m.placedGlyphBoxes)&&p.box&&p.box.length){E=!0,P=m.shift;break}}return p};F((function(){return Z(B,a.iconBox,t.WritingMode.horizontal)}),(function(){var i=a.verticalTextBox;return n.allowVerticalPlacement&&!(z&&z.box&&z.box.length)&&e.numVerticalGlyphVertices>0&&i?Z(i,a.verticalIconBox,t.WritingMode.vertical):{box:null,offscreen:null}})),z&&(E=z.box,S=z.offscreen);var q=O(z&&z.box);if(!E&&r.prevPlacement){var j=r.prevPlacement.variableOffsets[e.crossTileID];j&&(r.variableOffsets[e.crossTileID]=j,r.markUsedJustification(n,j.anchor,e,q));}}else{var V=function(t,i){var o=r.collisionIndex.placeCollisionBox(t,v,h,l,f.predicate);return o&&o.box&&o.box.length&&(r.markUsedOrientation(n,i,e),r.placedOrientations[e.crossTileID]=i),o};F((function(){return V(B,t.WritingMode.horizontal)}),(function(){var i=a.verticalTextBox;return n.allowVerticalPlacement&&e.numVerticalGlyphVertices>0&&i?V(i,t.WritingMode.vertical):{box:null,offscreen:null}})),O(z&&z.box&&z.box.length);}}E=(d=z)&&d.box&&d.box.length>0,S=d&&d.offscreen;var G=a.textCircles;if(G){var W=n.text.placedSymbolArray.get(e.centerJustifiedTextSymbolIndex),X=t.evaluateSizeForFeature(n.textSizeData,_,W);M=r.collisionIndex.placeCollisionCircles(G,v,u,h,W,n.lineVertexArray,n.glyphOffsetArray,X,l,c,o,b,f.predicate),E=v||M.circles.length>0,S=S&&M.offscreen;}if(a.iconFeatureIndex&&(k=a.iconFeatureIndex),a.iconBox){var H=function(t){var e=w&&P?ge(t,P.x,P.y,x,b,r.transform.angle):t;return r.collisionIndex.placeCollisionBox(e,y,h,l,f.predicate)};C=L&&L.box&&L.box.length&&a.verticalIconBox?(D=H(a.verticalIconBox)).box.length>0:(D=H(a.iconBox)).box.length>0,S=S&&D.offscreen;}var K=m||0===e.numHorizontalGlyphVertices&&0===e.numVerticalGlyphVertices,Y=g||0===e.numIconVertices;K||Y?Y?K||(C=C&&E):E=C&&E:C=E=C&&E,E&&d&&d.box&&r.collisionIndex.insertCollisionBox(d.box,s.get("text-ignore-placement"),n.bucketInstanceId,L&&L.box&&R?R:A,f.ID),C&&D&&r.collisionIndex.insertCollisionBox(D.box,s.get("icon-ignore-placement"),n.bucketInstanceId,k,f.ID),E&&M&&r.collisionIndex.insertCollisionCircles(M.circles,s.get("text-ignore-placement"),n.bucketInstanceId,A,f.ID),r.placements[e.crossTileID]=new de(E||T,C||I,S||n.justReloaded),i[e.crossTileID]=!0;}};if(E)for(var S=n.getSortedSymbolIndexes(this.transform.angle),P=S.length-1;P>=0;--P){var z=S[P];C(n.symbolInstances.get(z),n.collisionArrays[z]);}else for(var L=e.symbolInstanceStart;L<e.symbolInstanceEnd;L++)C(n.symbolInstances.get(L),n.collisionArrays[L]);n.justReloaded=!1;},ve.prototype.markUsedJustification=function(e,i,o,r){var a;a=r===t.WritingMode.vertical?o.verticalPlacedTextSymbolIndex:{left:o.leftJustifiedTextSymbolIndex,center:o.centerJustifiedTextSymbolIndex,right:o.rightJustifiedTextSymbolIndex}[t.getAnchorJustification(i)];for(var n=0,s=[o.leftJustifiedTextSymbolIndex,o.centerJustifiedTextSymbolIndex,o.rightJustifiedTextSymbolIndex,o.verticalPlacedTextSymbolIndex];n<s.length;n+=1){var l=s[n];l>=0&&(e.text.placedSymbolArray.get(l).crossTileID=a>=0&&l!==a?0:o.crossTileID);}},ve.prototype.markUsedOrientation=function(e,i,o){for(var r=i===t.WritingMode.horizontal||i===t.WritingMode.horizontalOnly?i:0,a=i===t.WritingMode.vertical?i:0,n=0,s=[o.leftJustifiedTextSymbolIndex,o.centerJustifiedTextSymbolIndex,o.rightJustifiedTextSymbolIndex];n<s.length;n+=1)e.text.placedSymbolArray.get(s[n]).placedOrientation=r;o.verticalPlacedTextSymbolIndex&&(e.text.placedSymbolArray.get(o.verticalPlacedTextSymbolIndex).placedOrientation=a);},ve.prototype.commit=function(t){this.commitTime=t,this.zoomAtLastRecencyCheck=this.transform.zoom;var e=this.prevPlacement,i=!1;this.prevZoomAdjustment=e?e.zoomAdjustment(this.transform.zoom):0;var o=e?e.symbolFadeChange(t):1,r=e?e.opacities:{},a=e?e.variableOffsets:{},n=e?e.placedOrientations:{};for(var s in this.placements){var l=this.placements[s],c=r[s];c?(this.opacities[s]=new pe(c,o,l.text,l.icon),i=i||l.text!==c.text.placed||l.icon!==c.icon.placed):(this.opacities[s]=new pe(null,o,l.text,l.icon,l.skipFade),i=i||l.text||l.icon);}for(var u in r){var h=r[u];if(!this.opacities[u]){var p=new pe(h,o,!1,!1);p.isHidden()||(this.opacities[u]=p,i=i||h.text.placed||h.icon.placed);}}for(var d in a)this.variableOffsets[d]||!this.opacities[d]||this.opacities[d].isHidden()||(this.variableOffsets[d]=a[d]);for(var _ in n)this.placedOrientations[_]||!this.opacities[_]||this.opacities[_].isHidden()||(this.placedOrientations[_]=n[_]);i?this.lastPlacementChangeTime=t:"number"!=typeof this.lastPlacementChangeTime&&(this.lastPlacementChangeTime=e?e.lastPlacementChangeTime:t);},ve.prototype.updateLayerOpacities=function(t,e){for(var i={},o=0,r=e;o<r.length;o+=1){var a=r[o],n=a.getBucket(t);n&&a.latestFeatureIndex&&t.id===n.layerIds[0]&&this.updateBucketOpacities(n,i,a.collisionBoxArray);}},ve.prototype.updateBucketOpacities=function(e,i,o){var r=this;e.hasTextData()&&e.text.opacityVertexArray.clear(),e.hasIconData()&&e.icon.opacityVertexArray.clear(),e.hasIconCollisionBoxData()&&e.iconCollisionBox.collisionVertexArray.clear(),e.hasTextCollisionBoxData()&&e.textCollisionBox.collisionVertexArray.clear(),e.hasIconCollisionCircleData()&&e.iconCollisionCircle.collisionVertexArray.clear(),e.hasTextCollisionCircleData()&&e.textCollisionCircle.collisionVertexArray.clear();var a=e.layers[0].layout,n=new pe(null,0,!1,!1,!0),s=a.get("text-allow-overlap"),l=a.get("icon-allow-overlap"),c=a.get("text-variable-anchor"),u="map"===a.get("text-rotation-alignment"),h="map"===a.get("text-pitch-alignment"),p="none"!==a.get("icon-text-fit"),d=new pe(null,0,s&&(l||!e.hasIconData()||a.get("icon-optional")),l&&(s||!e.hasTextData()||a.get("text-optional")),!0);!e.collisionArrays&&o&&(e.hasIconCollisionBoxData()||e.hasIconCollisionCircleData()||e.hasTextCollisionBoxData()||e.hasTextCollisionCircleData())&&e.deserializeCollisionBoxes(o);for(var _=function(t,e,i){for(var o=0;o<e/4;o++)t.opacityVertexArray.emplaceBack(i);},f=function(o){var a=e.symbolInstances.get(o),s=a.numHorizontalGlyphVertices,l=a.numVerticalGlyphVertices,f=a.crossTileID,m=i[f],g=r.opacities[f];m?g=n:g||(r.opacities[f]=g=d),i[f]=!0;var v=a.numIconVertices>0,y=r.placedOrientations[a.crossTileID],x=y===t.WritingMode.vertical,b=y===t.WritingMode.horizontal||y===t.WritingMode.horizontalOnly;if(s>0||l>0){var w=Se(g.text);_(e.text,s,x?Pe:w),_(e.text,l,b?Pe:w);var E=g.text.isHidden();[a.rightJustifiedTextSymbolIndex,a.centerJustifiedTextSymbolIndex,a.leftJustifiedTextSymbolIndex].forEach((function(t){t>=0&&(e.text.placedSymbolArray.get(t).hidden=E||x?1:0);})),a.verticalPlacedTextSymbolIndex>=0&&(e.text.placedSymbolArray.get(a.verticalPlacedTextSymbolIndex).hidden=E||b?1:0);var T=r.variableOffsets[a.crossTileID];T&&r.markUsedJustification(e,T.anchor,a,y);var I=r.placedOrientations[a.crossTileID];I&&(r.markUsedJustification(e,"left",a,I),r.markUsedOrientation(e,I,a));}if(v){var C=Se(g.icon),S=!(p&&a.verticalPlacedIconSymbolIndex&&x);a.placedIconSymbolIndex>=0&&(_(e.icon,a.numIconVertices,S?C:Pe),e.icon.placedSymbolArray.get(a.placedIconSymbolIndex).hidden=g.icon.isHidden()),a.verticalPlacedIconSymbolIndex>=0&&(_(e.icon,a.numVerticalIconVertices,S?Pe:C),e.icon.placedSymbolArray.get(a.verticalPlacedIconSymbolIndex).hidden=g.icon.isHidden());}if(e.hasIconCollisionBoxData()||e.hasIconCollisionCircleData()||e.hasTextCollisionBoxData()||e.hasTextCollisionCircleData()){var P=e.collisionArrays[o];if(P){var z=new t.Point(0,0);if(P.textBox||P.verticalTextBox){var L=!0;if(c){var M=r.variableOffsets[f];M?(z=me(M.anchor,M.width,M.height,M.textOffset,M.textBoxScale),u&&z._rotate(h?r.transform.angle:-r.transform.angle)):L=!1;}P.textBox&&ye(e.textCollisionBox.collisionVertexArray,g.text.placed,!L||x,z.x,z.y),P.verticalTextBox&&ye(e.textCollisionBox.collisionVertexArray,g.text.placed,!L||b,z.x,z.y);}var D=Boolean(!b&&P.verticalIconBox);P.iconBox&&ye(e.iconCollisionBox.collisionVertexArray,g.icon.placed,D,p?z.x:0,p?z.y:0),P.verticalIconBox&&ye(e.iconCollisionBox.collisionVertexArray,g.icon.placed,!D,p?z.x:0,p?z.y:0);var A=P.textCircles;if(A&&e.hasTextCollisionCircleData())for(var R=0;R<A.length;R+=5)ye(e.textCollisionCircle.collisionVertexArray,g.text.placed,m||0===A[R+4]);}}},m=0;m<e.symbolInstances.length;m++)f(m);e.sortFeatures(this.transform.angle),this.retainedQueryData[e.bucketInstanceId]&&(this.retainedQueryData[e.bucketInstanceId].featureSortOrder=e.featureSortOrder),e.hasTextData()&&e.text.opacityVertexBuffer&&e.text.opacityVertexBuffer.updateData(e.text.opacityVertexArray),e.hasIconData()&&e.icon.opacityVertexBuffer&&e.icon.opacityVertexBuffer.updateData(e.icon.opacityVertexArray),e.hasIconCollisionBoxData()&&e.iconCollisionBox.collisionVertexBuffer&&e.iconCollisionBox.collisionVertexBuffer.updateData(e.iconCollisionBox.collisionVertexArray),e.hasTextCollisionBoxData()&&e.textCollisionBox.collisionVertexBuffer&&e.textCollisionBox.collisionVertexBuffer.updateData(e.textCollisionBox.collisionVertexArray),e.hasIconCollisionCircleData()&&e.iconCollisionCircle.collisionVertexBuffer&&e.iconCollisionCircle.collisionVertexBuffer.updateData(e.iconCollisionCircle.collisionVertexArray),e.hasTextCollisionCircleData()&&e.textCollisionCircle.collisionVertexBuffer&&e.textCollisionCircle.collisionVertexBuffer.updateData(e.textCollisionCircle.collisionVertexArray);},ve.prototype.symbolFadeChange=function(t){return 0===this.fadeDuration?1:(t-this.commitTime)/this.fadeDuration+this.prevZoomAdjustment},ve.prototype.zoomAdjustment=function(t){return Math.max(0,(this.transform.zoom-t)/1.5)},ve.prototype.hasTransitions=function(t){return this.stale||t-this.lastPlacementChangeTime<this.fadeDuration},ve.prototype.stillRecent=function(t,e){var i=this.zoomAtLastRecencyCheck===e?1-this.zoomAdjustment(e):1;return this.zoomAtLastRecencyCheck=e,this.commitTime+this.fadeDuration*i>t},ve.prototype.setStale=function(){this.stale=!0;};var xe=Math.pow(2,25),be=Math.pow(2,24),we=Math.pow(2,17),Ee=Math.pow(2,16),Te=Math.pow(2,9),Ie=Math.pow(2,8),Ce=Math.pow(2,1);function Se(t){if(0===t.opacity&&!t.placed)return 0;if(1===t.opacity&&t.placed)return 4294967295;var e=t.placed?1:0,i=Math.floor(127*t.opacity);return i*xe+e*be+i*we+e*Ee+i*Te+e*Ie+i*Ce+e}var Pe=0,ze=function(t){this._sortAcrossTiles="viewport-y"!==t.layout.get("symbol-z-order")&&void 0!==t.layout.get("symbol-sort-key").constantOr(1),this._currentTileIndex=0,this._currentPartIndex=0,this._seenCrossTileIDs={},this._bucketParts=[];};ze.prototype.continuePlacement=function(t,e,i,o,r){for(var a=this._bucketParts;this._currentTileIndex<t.length;)if(e.getBucketParts(a,o,t[this._currentTileIndex],this._sortAcrossTiles),this._currentTileIndex++,r())return !0;for(this._sortAcrossTiles&&(this._sortAcrossTiles=!1,a.sort((function(t,e){return t.sortKey-e.sortKey})));this._currentPartIndex<a.length;)if(e.placeLayerBucketPart(a[this._currentPartIndex],this._seenCrossTileIDs,i),this._currentPartIndex++,r())return !0;return !1};var Le=function(t,e,i,o,r,a,n){this.placement=new ve(t,r,a,n),this._currentPlacementIndex=e.length-1,this._forceFullPlacement=i,this._showCollisionBoxes=o,this._done=!1;};Le.prototype.isDone=function(){return this._done},Le.prototype.continuePlacement=function(e,i,o){for(var r=this,a=t.browser.now(),n=function(){var e=t.browser.now()-a;return !r._forceFullPlacement&&e>2};this._currentPlacementIndex>=0;){var s=i[e[this._currentPlacementIndex]],l=this.placement.collisionIndex.transform.zoom;if("symbol"===s.type&&(!s.minzoom||s.minzoom<=l)&&(!s.maxzoom||s.maxzoom>l)){if(this._inProgressLayer||(this._inProgressLayer=new ze(s)),this._inProgressLayer.continuePlacement(o[s.source],this.placement,this._showCollisionBoxes,s,n))return;delete this._inProgressLayer;}this._currentPlacementIndex--;}this._done=!0;},Le.prototype.commit=function(t){return this.placement.commit(t),this.placement};var Me=512/t.EXTENT/2,De=function(t,e,i){this.tileID=t,this.indexedSymbolInstances={},this.bucketInstanceId=i;for(var o=0;o<e.length;o++){var r=e.get(o),a=r.key;this.indexedSymbolInstances[a]||(this.indexedSymbolInstances[a]=[]),this.indexedSymbolInstances[a].push({crossTileID:r.crossTileID,coord:this.getScaledCoordinates(r,t)});}};De.prototype.getScaledCoordinates=function(e,i){var o=Me/Math.pow(2,i.canonical.z-this.tileID.canonical.z);return {x:Math.floor((i.canonical.x*t.EXTENT+e.anchorX)*o),y:Math.floor((i.canonical.y*t.EXTENT+e.anchorY)*o)}},De.prototype.findMatches=function(t,e,i){for(var o=this.tileID.canonical.z<e.canonical.z?1:Math.pow(2,this.tileID.canonical.z-e.canonical.z),r=0;r<t.length;r++){var a=t.get(r);if(!a.crossTileID){var n=this.indexedSymbolInstances[a.key];if(n)for(var s=this.getScaledCoordinates(a,e),l=0,c=n;l<c.length;l+=1){var u=c[l];if(Math.abs(u.coord.x-s.x)<=o&&Math.abs(u.coord.y-s.y)<=o&&!i[u.crossTileID]){i[u.crossTileID]=!0,a.crossTileID=u.crossTileID;break}}}}};var Ae=function(){this.maxCrossTileID=0;};Ae.prototype.generate=function(){return ++this.maxCrossTileID};var Re=function(){this.indexes={},this.usedCrossTileIDs={},this.lng=0;};Re.prototype.handleWrapJump=function(t){var e=Math.round((t-this.lng)/360);if(0!==e)for(var i in this.indexes){var o=this.indexes[i],r={};for(var a in o){var n=o[a];n.tileID=n.tileID.unwrapTo(n.tileID.wrap+e),r[n.tileID.key]=n;}this.indexes[i]=r;}this.lng=t;},Re.prototype.addBucket=function(t,e,i){if(this.indexes[t.overscaledZ]&&this.indexes[t.overscaledZ][t.key]){if(this.indexes[t.overscaledZ][t.key].bucketInstanceId===e.bucketInstanceId)return !1;this.removeBucketCrossTileIDs(t.overscaledZ,this.indexes[t.overscaledZ][t.key]);}for(var o=0;o<e.symbolInstances.length;o++)e.symbolInstances.get(o).crossTileID=0;this.usedCrossTileIDs[t.overscaledZ]||(this.usedCrossTileIDs[t.overscaledZ]={});var r=this.usedCrossTileIDs[t.overscaledZ];for(var a in this.indexes){var n=this.indexes[a];if(Number(a)>t.overscaledZ)for(var s in n){var l=n[s];l.tileID.isChildOf(t)&&l.findMatches(e.symbolInstances,t,r);}else{var c=n[t.scaledTo(Number(a)).key];c&&c.findMatches(e.symbolInstances,t,r);}}for(var u=0;u<e.symbolInstances.length;u++){var h=e.symbolInstances.get(u);h.crossTileID||(h.crossTileID=i.generate(),r[h.crossTileID]=!0);}return void 0===this.indexes[t.overscaledZ]&&(this.indexes[t.overscaledZ]={}),this.indexes[t.overscaledZ][t.key]=new De(t,e.symbolInstances,e.bucketInstanceId),!0},Re.prototype.removeBucketCrossTileIDs=function(t,e){for(var i in e.indexedSymbolInstances)for(var o=0,r=e.indexedSymbolInstances[i];o<r.length;o+=1)delete this.usedCrossTileIDs[t][r[o].crossTileID];},Re.prototype.removeStaleBuckets=function(t){var e=!1;for(var i in this.indexes){var o=this.indexes[i];for(var r in o)t[o[r].bucketInstanceId]||(this.removeBucketCrossTileIDs(i,o[r]),delete o[r],e=!0);}return e};var ke=function(){this.layerIndexes={},this.crossTileIDs=new Ae,this.maxBucketInstanceId=0,this.bucketsInCurrentPlacement={};};ke.prototype.addLayer=function(t,e,i){var o=this.layerIndexes[t.id];void 0===o&&(o=this.layerIndexes[t.id]=new Re);var r=!1,a={};o.handleWrapJump(i);for(var n=0,s=e;n<s.length;n+=1){var l=s[n],c=l.getBucket(t);c&&t.id===c.layerIds[0]&&(c.bucketInstanceId||(c.bucketInstanceId=++this.maxBucketInstanceId),o.addBucket(l.tileID,c,this.crossTileIDs)&&(r=!0),a[c.bucketInstanceId]=!0);}return o.removeStaleBuckets(a)&&(r=!0),r},ke.prototype.pruneUnusedLayers=function(t){var e={};for(var i in t.forEach((function(t){e[t]=!0;})),this.layerIndexes)e[i]||delete this.layerIndexes[i];};var Be=function(e,i){return t.emitValidationErrors(e,i&&i.filter((function(t){return "source.canvas"!==t.identifier})))},Oe=t.pick(Nt,["addLayer","removeLayer","setPaintProperty","setLayoutProperty","setFilter","addSource","removeSource","setLayerZoomRange","setLight","setTransition","setGeoJSONSourceData"]),Fe=t.pick(Nt,["setCenter","setZoom","setBearing","setPitch"]),Ue=function(){var e={},i=t.styleSpec.$version;for(var o in t.styleSpec.$root){var r,a=t.styleSpec.$root[o];if(a.required)null!=(r="version"===o?i:"array"===a.type?[]:{})&&(e[o]=r);}return e}(),Ne=function(e){function i(o,r){var a=this;void 0===r&&(r={}),e.call(this),this.map=o,this.dispatcher=new T((Bt||(Bt=new kt),Bt),this),this.imageManager=new p,this.imageManager.setEventedParent(this),this.glyphManager=new y(o._requestManager,r.localIdeographFontFamily),this.lineAtlas=new E(256,512),this.crossTileSymbolIndex=new ke,this._layers={},this._serializedLayers={},this._order=[],this.sourceCaches={},this.zoomHistory=new t.ZoomHistory,this._loaded=!1,this._availableImages=[],this._resetUpdates(),this.dispatcher.broadcast("setReferrer",t.getReferrer());var n=this;this._rtlTextPluginCallback=i.registerForPluginStateChange((function(e){n.dispatcher.broadcast("syncRTLPluginState",{pluginStatus:e.pluginStatus,pluginURL:e.pluginURL},(function(e,i){if(t.triggerPluginCompletionEvent(e),i&&i.every((function(t){return t})))for(var o in n.sourceCaches)n.sourceCaches[o].reload();}));})),this.on("data",(function(t){if("source"===t.dataType&&"metadata"===t.sourceDataType){var e=a.sourceCaches[t.sourceId];if(e){var i=e.getSource();if(i&&i.vectorLayerIds)for(var o in a._layers){var r=a._layers[o];r.source===i.id&&a._validateLayer(r);}}}}));}return e&&(i.__proto__=e),(i.prototype=Object.create(e&&e.prototype)).constructor=i,i.prototype.loadURL=function(e,i){var o=this;void 0===i&&(i={}),this.fire(new t.Event("dataloading",{dataType:"style"}));var r="boolean"==typeof i.validate?i.validate:!t.isMapboxURL(e);e=this.map._requestManager.normalizeStyleURL(e,i.accessToken);var a=this.map._requestManager.transformRequest(e,t.ResourceType.Style);this._request=t.getJSON(a,(function(e,i){o._request=null,e?o.fire(new t.ErrorEvent(e)):i&&o._load(i,r);}));},i.prototype.loadJSON=function(e,i){var o=this;void 0===i&&(i={}),this.fire(new t.Event("dataloading",{dataType:"style"})),this._request=t.browser.frame((function(){o._request=null,o._load(e,!1!==i.validate);}));},i.prototype.loadEmpty=function(){this.fire(new t.Event("dataloading",{dataType:"style"})),this._load(Ue,!1);},i.prototype._load=function(e,i){if(!i||!Be(this,t.validateStyle(e))){for(var o in this._loaded=!0,this.stylesheet=e,e.sources)this.addSource(o,e.sources[o],{validate:!1});e.sprite?this._loadSprite(e.sprite):this.imageManager.setLoaded(!0),this.glyphManager.setURL(e.glyphs);var r=Ut(this.stylesheet.layers);this._order=r.map((function(t){return t.id})),this._layers={},this._serializedLayers={};for(var a=0,n=r;a<n.length;a+=1){var s=n[a];(s=t.createStyleLayer(s)).setEventedParent(this,{layer:{id:s.id}}),this._layers[s.id]=s,this._serializedLayers[s.id]=s.serialize();}this.dispatcher.broadcast("setLayers",this._serializeLayers(this._order)),this.light=new w(this.stylesheet.light),this.fire(new t.Event("data",{dataType:"style"})),this.fire(new t.Event("style.load"));}},i.prototype._loadSprite=function(e){var i=this;this._spriteRequest=function(e,i,o){var r,a,n,s=t.browser.devicePixelRatio>1?"@2x":"",l=t.getJSON(i.transformRequest(i.normalizeSpriteURL(e,s,".json"),t.ResourceType.SpriteJSON),(function(t,e){l=null,n||(n=t,r=e,u());})),c=t.getImage(i.transformRequest(i.normalizeSpriteURL(e,s,".png"),t.ResourceType.SpriteImage),(function(t,e){c=null,n||(n=t,a=e,u());}));function u(){if(n)o(n);else if(r&&a){var e=t.browser.getImageData(a),i={};for(var s in r){var l=r[s],c=l.width,u=l.height,h=l.x,p=l.y,d=l.sdf,_=l.pixelRatio,f=l.stretchX,m=l.stretchY,g=l.content,v=new t.RGBAImage({width:c,height:u});t.RGBAImage.copy(e,v,{x:h,y:p},{x:0,y:0},{width:c,height:u}),i[s]={data:v,pixelRatio:_,sdf:d,stretchX:f,stretchY:m,content:g};}o(null,i);}}return {cancel:function(){l&&(l.cancel(),l=null),c&&(c.cancel(),c=null);}}}(e,this.map._requestManager,(function(e,o){if(i._spriteRequest=null,e)i.fire(new t.ErrorEvent(e));else if(o)for(var r in o)i.imageManager.addImage(r,o[r]);i.imageManager.setLoaded(!0),i._availableImages=i.imageManager.listImages(),i.dispatcher.broadcast("setImages",i._availableImages),i.fire(new t.Event("data",{dataType:"style"}));}));},i.prototype._validateLayer=function(e){var i=this.sourceCaches[e.source];if(i){var o=e.sourceLayer;if(o){var r=i.getSource();("geojson"===r.type||r.vectorLayerIds&&-1===r.vectorLayerIds.indexOf(o))&&this.fire(new t.ErrorEvent(new Error('Source layer "'+o+'" does not exist on source "'+r.id+'" as specified by style layer "'+e.id+'"')));}}},i.prototype.loaded=function(){if(!this._loaded)return !1;if(Object.keys(this._updatedSources).length)return !1;for(var t in this.sourceCaches)if(!this.sourceCaches[t].loaded())return !1;return !!this.imageManager.isLoaded()},i.prototype._serializeLayers=function(t){for(var e=[],i=0,o=t;i<o.length;i+=1){var r=this._layers[o[i]];"custom"!==r.type&&e.push(r.serialize());}return e},i.prototype.hasTransitions=function(){if(this.light&&this.light.hasTransition())return !0;for(var t in this.sourceCaches)if(this.sourceCaches[t].hasTransition())return !0;for(var e in this._layers)if(this._layers[e].hasTransition())return !0;return !1},i.prototype._checkLoaded=function(){if(!this._loaded)throw new Error("Style is not done loading")},i.prototype.update=function(e){if(this._loaded){var i=this._changed;if(this._changed){var o=Object.keys(this._updatedLayers),r=Object.keys(this._removedLayers);for(var a in (o.length||r.length)&&this._updateWorkerLayers(o,r),this._updatedSources){var n=this._updatedSources[a];"reload"===n?this._reloadSource(a):"clear"===n&&this._clearSource(a);}for(var s in this._updateTilesForChangedImages(),this._updatedPaintProps)this._layers[s].updateTransitions(e);this.light.updateTransitions(e),this._resetUpdates();}for(var l in this.sourceCaches)this.sourceCaches[l].used=!1;for(var c=0,u=this._order;c<u.length;c+=1){var h=this._layers[u[c]];h.recalculate(e,this._availableImages),!h.isHidden(e.zoom)&&h.source&&(this.sourceCaches[h.source].used=!0);}this.light.recalculate(e),this.z=e.zoom,i&&this.fire(new t.Event("data",{dataType:"style"}));}},i.prototype._updateTilesForChangedImages=function(){var t=Object.keys(this._changedImages);if(t.length){for(var e in this.sourceCaches)this.sourceCaches[e].reloadTilesForDependencies(["icons","patterns"],t);this._changedImages={};}},i.prototype._updateWorkerLayers=function(t,e){this.dispatcher.broadcast("updateLayers",{layers:this._serializeLayers(t),removedIds:e});},i.prototype._resetUpdates=function(){this._changed=!1,this._updatedLayers={},this._removedLayers={},this._updatedSources={},this._updatedPaintProps={},this._changedImages={};},i.prototype.setState=function(e){var i=this;if(this._checkLoaded(),Be(this,t.validateStyle(e)))return !1;(e=t.clone$1(e)).layers=Ut(e.layers);var o=function(e,i){if(!e)return [{command:Nt.setStyle,args:[i]}];var o=[];try{if(!t.deepEqual(e.version,i.version))return [{command:Nt.setStyle,args:[i]}];t.deepEqual(e.center,i.center)||o.push({command:Nt.setCenter,args:[i.center]}),t.deepEqual(e.zoom,i.zoom)||o.push({command:Nt.setZoom,args:[i.zoom]}),t.deepEqual(e.bearing,i.bearing)||o.push({command:Nt.setBearing,args:[i.bearing]}),t.deepEqual(e.pitch,i.pitch)||o.push({command:Nt.setPitch,args:[i.pitch]}),t.deepEqual(e.sprite,i.sprite)||o.push({command:Nt.setSprite,args:[i.sprite]}),t.deepEqual(e.glyphs,i.glyphs)||o.push({command:Nt.setGlyphs,args:[i.glyphs]}),t.deepEqual(e.transition,i.transition)||o.push({command:Nt.setTransition,args:[i.transition]}),t.deepEqual(e.light,i.light)||o.push({command:Nt.setLight,args:[i.light]});var r={},a=[];!function(e,i,o,r){var a;for(a in i=i||{},e=e||{})e.hasOwnProperty(a)&&(i.hasOwnProperty(a)||qt(a,o,r));for(a in i)i.hasOwnProperty(a)&&(e.hasOwnProperty(a)?t.deepEqual(e[a],i[a])||("geojson"===e[a].type&&"geojson"===i[a].type&&Vt(e,i,a)?o.push({command:Nt.setGeoJSONSourceData,args:[a,i[a].data]}):jt(a,i,o,r)):Zt(a,i,o));}(e.sources,i.sources,a,r);var n=[];e.layers&&e.layers.forEach((function(t){r[t.source]?o.push({command:Nt.removeLayer,args:[t.id]}):n.push(t);})),o=o.concat(a),function(e,i,o){i=i||[];var r,a,n,s,l,c,u,h=(e=e||[]).map(Wt),p=i.map(Wt),d=e.reduce(Xt,{}),_=i.reduce(Xt,{}),f=h.slice(),m=Object.create(null);for(r=0,a=0;r<h.length;r++)_.hasOwnProperty(n=h[r])?a++:(o.push({command:Nt.removeLayer,args:[n]}),f.splice(f.indexOf(n,a),1));for(r=0,a=0;r<p.length;r++)f[f.length-1-r]!==(n=p[p.length-1-r])&&(d.hasOwnProperty(n)?(o.push({command:Nt.removeLayer,args:[n]}),f.splice(f.lastIndexOf(n,f.length-a),1)):a++,o.push({command:Nt.addLayer,args:[_[n],c=f[f.length-r]]}),f.splice(f.length-r,0,n),m[n]=!0);for(r=0;r<p.length;r++)if(s=d[n=p[r]],l=_[n],!m[n]&&!t.deepEqual(s,l))if(t.deepEqual(s.source,l.source)&&t.deepEqual(s["source-layer"],l["source-layer"])&&t.deepEqual(s.type,l.type)){for(u in Gt(s.layout,l.layout,o,n,null,Nt.setLayoutProperty),Gt(s.paint,l.paint,o,n,null,Nt.setPaintProperty),t.deepEqual(s.filter,l.filter)||o.push({command:Nt.setFilter,args:[n,l.filter]}),t.deepEqual(s.minzoom,l.minzoom)&&t.deepEqual(s.maxzoom,l.maxzoom)||o.push({command:Nt.setLayerZoomRange,args:[n,l.minzoom,l.maxzoom]}),s)s.hasOwnProperty(u)&&"layout"!==u&&"paint"!==u&&"filter"!==u&&"metadata"!==u&&"minzoom"!==u&&"maxzoom"!==u&&(0===u.indexOf("paint.")?Gt(s[u],l[u],o,n,u.slice(6),Nt.setPaintProperty):t.deepEqual(s[u],l[u])||o.push({command:Nt.setLayerProperty,args:[n,u,l[u]]}));for(u in l)l.hasOwnProperty(u)&&!s.hasOwnProperty(u)&&"layout"!==u&&"paint"!==u&&"filter"!==u&&"metadata"!==u&&"minzoom"!==u&&"maxzoom"!==u&&(0===u.indexOf("paint.")?Gt(s[u],l[u],o,n,u.slice(6),Nt.setPaintProperty):t.deepEqual(s[u],l[u])||o.push({command:Nt.setLayerProperty,args:[n,u,l[u]]}));}else o.push({command:Nt.removeLayer,args:[n]}),c=f[f.lastIndexOf(n)+1],o.push({command:Nt.addLayer,args:[l,c]});}(n,i.layers,o);}catch(t){console.warn("Unable to compute style diff:",t),o=[{command:Nt.setStyle,args:[i]}];}return o}(this.serialize(),e).filter((function(t){return !(t.command in Fe)}));if(0===o.length)return !1;var r=o.filter((function(t){return !(t.command in Oe)}));if(r.length>0)throw new Error("Unimplemented: "+r.map((function(t){return t.command})).join(", ")+".");return o.forEach((function(t){"setTransition"!==t.command&&i[t.command].apply(i,t.args);})),this.stylesheet=e,!0},i.prototype.addImage=function(e,i){if(this.getImage(e))return this.fire(new t.ErrorEvent(new Error("An image with this name already exists.")));this.imageManager.addImage(e,i),this._availableImages=this.imageManager.listImages(),this._changedImages[e]=!0,this._changed=!0,this.fire(new t.Event("data",{dataType:"style"}));},i.prototype.updateImage=function(t,e){this.imageManager.updateImage(t,e);},i.prototype.getImage=function(t){return this.imageManager.getImage(t)},i.prototype.removeImage=function(e){if(!this.getImage(e))return this.fire(new t.ErrorEvent(new Error("No image with this name exists.")));this.imageManager.removeImage(e),this._availableImages=this.imageManager.listImages(),this._changedImages[e]=!0,this._changed=!0,this.fire(new t.Event("data",{dataType:"style"}));},i.prototype.listImages=function(){return this._checkLoaded(),this.imageManager.listImages()},i.prototype.addSource=function(e,i,o){var r=this;if(void 0===o&&(o={}),this._checkLoaded(),void 0!==this.sourceCaches[e])throw new Error("There is already a source with this ID");if(!i.type)throw new Error("The type property must be defined, but the only the following properties were given: "+Object.keys(i).join(", ")+".");if(!(["vector","raster","geojson","video","image"].indexOf(i.type)>=0&&this._validate(t.validateStyle.source,"sources."+e,i,null,o))){this.map&&this.map._collectResourceTiming&&(i.collectResourceTiming=!0);var a=this.sourceCaches[e]=new Mt(e,i,this.dispatcher);a.style=this,a.setEventedParent(this,(function(){return {isSourceLoaded:r.loaded(),source:a.serialize(),sourceId:e}})),a.onAdd(this.map),this._changed=!0;}},i.prototype.removeSource=function(e){if(this._checkLoaded(),void 0===this.sourceCaches[e])throw new Error("There is no source with this ID");for(var i in this._layers)if(this._layers[i].source===e)return this.fire(new t.ErrorEvent(new Error('Source "'+e+'" cannot be removed while layer "'+i+'" is using it.')));var o=this.sourceCaches[e];delete this.sourceCaches[e],delete this._updatedSources[e],o.fire(new t.Event("data",{sourceDataType:"metadata",dataType:"source",sourceId:e})),o.setEventedParent(null),o.clearTiles(),o.onRemove&&o.onRemove(this.map),this._changed=!0;},i.prototype.setGeoJSONSourceData=function(t,e){this._checkLoaded(),this.sourceCaches[t].getSource().setData(e),this._changed=!0;},i.prototype.getSource=function(t){return this.sourceCaches[t]&&this.sourceCaches[t].getSource()},i.prototype.addLayer=function(e,i,o){void 0===o&&(o={}),this._checkLoaded();var r=e.id;if(this.getLayer(r))this.fire(new t.ErrorEvent(new Error('Layer with id "'+r+'" already exists on this map')));else{var a;if("custom"===e.type){if(Be(this,t.validateCustomStyleLayer(e)))return;a=t.createStyleLayer(e);}else{if("object"==typeof e.source&&(this.addSource(r,e.source),e=t.clone$1(e),e=t.extend(e,{source:r})),this._validate(t.validateStyle.layer,"layers."+r,e,{arrayIndex:-1},o))return;a=t.createStyleLayer(e),this._validateLayer(a),a.setEventedParent(this,{layer:{id:r}}),this._serializedLayers[a.id]=a.serialize();}var n=i?this._order.indexOf(i):this._order.length;if(i&&-1===n)this.fire(new t.ErrorEvent(new Error('Layer with id "'+i+'" does not exist on this map.')));else{if(this._order.splice(n,0,r),this._layerOrderChanged=!0,this._layers[r]=a,this._removedLayers[r]&&a.source&&"custom"!==a.type){var s=this._removedLayers[r];delete this._removedLayers[r],s.type!==a.type?this._updatedSources[a.source]="clear":(this._updatedSources[a.source]="reload",this.sourceCaches[a.source].pause());}this._updateLayer(a),a.onAdd&&a.onAdd(this.map);}}},i.prototype.moveLayer=function(e,i){if(this._checkLoaded(),this._changed=!0,this._layers[e]){if(e!==i){var o=this._order.indexOf(e);this._order.splice(o,1);var r=i?this._order.indexOf(i):this._order.length;i&&-1===r?this.fire(new t.ErrorEvent(new Error('Layer with id "'+i+'" does not exist on this map.'))):(this._order.splice(r,0,e),this._layerOrderChanged=!0);}}else this.fire(new t.ErrorEvent(new Error("The layer '"+e+"' does not exist in the map's style and cannot be moved.")));},i.prototype.removeLayer=function(e){this._checkLoaded();var i=this._layers[e];if(i){i.setEventedParent(null);var o=this._order.indexOf(e);this._order.splice(o,1),this._layerOrderChanged=!0,this._changed=!0,this._removedLayers[e]=i,delete this._layers[e],delete this._serializedLayers[e],delete this._updatedLayers[e],delete this._updatedPaintProps[e],i.onRemove&&i.onRemove(this.map);}else this.fire(new t.ErrorEvent(new Error("The layer '"+e+"' does not exist in the map's style and cannot be removed.")));},i.prototype.getLayer=function(t){return this._layers[t]},i.prototype.hasLayer=function(t){return t in this._layers},i.prototype.setLayerZoomRange=function(e,i,o){this._checkLoaded();var r=this.getLayer(e);r?r.minzoom===i&&r.maxzoom===o||(null!=i&&(r.minzoom=i),null!=o&&(r.maxzoom=o),this._updateLayer(r)):this.fire(new t.ErrorEvent(new Error("The layer '"+e+"' does not exist in the map's style and cannot have zoom extent.")));},i.prototype.setFilter=function(e,i,o){void 0===o&&(o={}),this._checkLoaded();var r=this.getLayer(e);if(r){if(!t.deepEqual(r.filter,i))return null==i?(r.filter=void 0,void this._updateLayer(r)):void(this._validate(t.validateStyle.filter,"layers."+r.id+".filter",i,null,o)||(r.filter=t.clone$1(i),this._updateLayer(r)))}else this.fire(new t.ErrorEvent(new Error("The layer '"+e+"' does not exist in the map's style and cannot be filtered.")));},i.prototype.getFilter=function(e){return t.clone$1(this.getLayer(e).filter)},i.prototype.setLayoutProperty=function(e,i,o,r){void 0===r&&(r={}),this._checkLoaded();var a=this.getLayer(e);a?t.deepEqual(a.getLayoutProperty(i),o)||(a.setLayoutProperty(i,o,r),this._updateLayer(a)):this.fire(new t.ErrorEvent(new Error("The layer '"+e+"' does not exist in the map's style and cannot be styled.")));},i.prototype.getLayoutProperty=function(e,i){var o=this.getLayer(e);if(o)return o.getLayoutProperty(i);this.fire(new t.ErrorEvent(new Error("The layer '"+e+"' does not exist in the map's style.")));},i.prototype.setPaintProperty=function(e,i,o,r){void 0===r&&(r={}),this._checkLoaded();var a=this.getLayer(e);a?t.deepEqual(a.getPaintProperty(i),o)||(a.setPaintProperty(i,o,r)&&this._updateLayer(a),this._changed=!0,this._updatedPaintProps[e]=!0):this.fire(new t.ErrorEvent(new Error("The layer '"+e+"' does not exist in the map's style and cannot be styled.")));},i.prototype.getPaintProperty=function(t,e){return this.getLayer(t).getPaintProperty(e)},i.prototype.setFeatureState=function(e,i){this._checkLoaded();var o=e.source,r=e.sourceLayer,a=this.sourceCaches[o];if(void 0!==a){var n=a.getSource().type;"geojson"===n&&r?this.fire(new t.ErrorEvent(new Error("GeoJSON sources cannot have a sourceLayer parameter."))):"vector"!==n||r?(void 0===e.id&&this.fire(new t.ErrorEvent(new Error("The feature id parameter must be provided."))),a.setFeatureState(r,e.id,i)):this.fire(new t.ErrorEvent(new Error("The sourceLayer parameter must be provided for vector source types.")));}else this.fire(new t.ErrorEvent(new Error("The source '"+o+"' does not exist in the map's style.")));},i.prototype.removeFeatureState=function(e,i){this._checkLoaded();var o=e.source,r=this.sourceCaches[o];if(void 0!==r){var a=r.getSource().type,n="vector"===a?e.sourceLayer:void 0;"vector"!==a||n?i&&"string"!=typeof e.id&&"number"!=typeof e.id?this.fire(new t.ErrorEvent(new Error("A feature id is requred to remove its specific state property."))):r.removeFeatureState(n,e.id,i):this.fire(new t.ErrorEvent(new Error("The sourceLayer parameter must be provided for vector source types.")));}else this.fire(new t.ErrorEvent(new Error("The source '"+o+"' does not exist in the map's style.")));},i.prototype.getFeatureState=function(e){this._checkLoaded();var i=e.source,o=e.sourceLayer,r=this.sourceCaches[i];if(void 0!==r){if("vector"!==r.getSource().type||o)return void 0===e.id&&this.fire(new t.ErrorEvent(new Error("The feature id parameter must be provided."))),r.getFeatureState(o,e.id);this.fire(new t.ErrorEvent(new Error("The sourceLayer parameter must be provided for vector source types.")));}else this.fire(new t.ErrorEvent(new Error("The source '"+i+"' does not exist in the map's style.")));},i.prototype.getTransition=function(){return t.extend({duration:300,delay:0},this.stylesheet&&this.stylesheet.transition)},i.prototype.serialize=function(){return t.filterObject({version:this.stylesheet.version,name:this.stylesheet.name,metadata:this.stylesheet.metadata,light:this.stylesheet.light,center:this.stylesheet.center,zoom:this.stylesheet.zoom,bearing:this.stylesheet.bearing,pitch:this.stylesheet.pitch,sprite:this.stylesheet.sprite,glyphs:this.stylesheet.glyphs,transition:this.stylesheet.transition,sources:t.mapObject(this.sourceCaches,(function(t){return t.serialize()})),layers:this._serializeLayers(this._order)},(function(t){return void 0!==t}))},i.prototype._updateLayer=function(t){this._updatedLayers[t.id]=!0,t.source&&!this._updatedSources[t.source]&&"raster"!==this.sourceCaches[t.source].getSource().type&&(this._updatedSources[t.source]="reload",this.sourceCaches[t.source].pause()),this._changed=!0;},i.prototype._flattenAndSortRenderedFeatures=function(t){for(var e=this,i=function(t){return "fill-extrusion"===e._layers[t].type},o={},r=[],a=this._order.length-1;a>=0;a--){var n=this._order[a];if(i(n)){o[n]=a;for(var s=0,l=t;s<l.length;s+=1){var c=l[s][n];if(c)for(var u=0,h=c;u<h.length;u+=1)r.push(h[u]);}}}r.sort((function(t,e){return e.intersectionZ-t.intersectionZ}));for(var p=[],d=this._order.length-1;d>=0;d--){var _=this._order[d];if(i(_))for(var f=r.length-1;f>=0;f--){var m=r[f].feature;if(o[m.layer.id]<d)break;p.push(m),r.pop();}else for(var g=0,v=t;g<v.length;g+=1){var y=v[g][_];if(y)for(var x=0,b=y;x<b.length;x+=1)p.push(b[x].feature);}}return p},i.prototype.queryRenderedFeatures=function(e,i,o){i&&i.filter&&this._validate(t.validateStyle.filter,"queryRenderedFeatures.filter",i.filter,null,i);var r={};if(i&&i.layers){if(!Array.isArray(i.layers))return this.fire(new t.ErrorEvent(new Error("parameters.layers must be an Array."))),[];for(var a=0,n=i.layers;a<n.length;a+=1){var s=n[a],l=this._layers[s];if(!l)return this.fire(new t.ErrorEvent(new Error("The layer '"+s+"' does not exist in the map's style and cannot be queried for features."))),[];r[l.source]=!0;}}var c=[];for(var u in i.availableImages=this._availableImages,this.sourceCaches)i.layers&&!r[u]||c.push(F(this.sourceCaches[u],this._layers,this._serializedLayers,e,i,o));return this.placement&&c.push(function(t,e,i,o,r,a,n){for(var s={},l=a.queryRenderedSymbols(o),c=[],u=0,h=Object.keys(l).map(Number);u<h.length;u+=1)c.push(n[h[u]]);c.sort(U);for(var p=function(){var i=_[d],o=i.featureIndex.lookupSymbolFeatures(l[i.bucketInstanceId],e,i.bucketIndex,i.sourceLayerIndex,r.filter,r.layers,r.availableImages,t);for(var a in o){var n=s[a]=s[a]||[],c=o[a];c.sort((function(t,e){var o=i.featureSortOrder;if(o){var r=o.indexOf(t.featureIndex);return o.indexOf(e.featureIndex)-r}return e.featureIndex-t.featureIndex}));for(var u=0,h=c;u<h.length;u+=1)n.push(h[u]);}},d=0,_=c;d<_.length;d+=1)p();var f=function(e){s[e].forEach((function(o){var r=o.feature,a=i[t[e].source].getFeatureState(r.layer["source-layer"],r.id);r.source=r.layer.source,r.layer["source-layer"]&&(r.sourceLayer=r.layer["source-layer"]),r.state=a;}));};for(var m in s)f(m);return s}(this._layers,this._serializedLayers,this.sourceCaches,e,i,this.placement.collisionIndex,this.placement.retainedQueryData)),this._flattenAndSortRenderedFeatures(c)},i.prototype.querySourceFeatures=function(e,i){i&&i.filter&&this._validate(t.validateStyle.filter,"querySourceFeatures.filter",i.filter,null,i);var o=this.sourceCaches[e];return o?function(t,e){for(var i=t.getRenderableIds().map((function(e){return t.getTileByID(e)})),o=[],r={},a=0;a<i.length;a++){var n=i[a],s=n.tileID.canonical.key;r[s]||(r[s]=!0,n.querySourceFeatures(o,e));}return o}(o,i):[]},i.prototype.addSourceType=function(t,e,o){return i.getSourceType(t)?o(new Error('A source type called "'+t+'" already exists.')):(i.setSourceType(t,e),e.workerSourceURL?void this.dispatcher.broadcast("loadWorkerSource",{name:t,url:e.workerSourceURL},o):o(null,null))},i.prototype.getLight=function(){return this.light.getLight()},i.prototype.setLight=function(e,i){void 0===i&&(i={}),this._checkLoaded();var o=this.light.getLight(),r=!1;for(var a in e)if(!t.deepEqual(e[a],o[a])){r=!0;break}if(r){var n={now:t.browser.now(),transition:t.extend({duration:300,delay:0},this.stylesheet.transition)};this.light.setLight(e,i),this.light.updateTransitions(n);}},i.prototype._validate=function(e,i,o,r,a){return void 0===a&&(a={}),(!a||!1!==a.validate)&&Be(this,e.call(t.validateStyle,t.extend({key:i,style:this.serialize(),value:o,styleSpec:t.styleSpec},r)))},i.prototype._remove=function(){for(var e in this._request&&(this._request.cancel(),this._request=null),this._spriteRequest&&(this._spriteRequest.cancel(),this._spriteRequest=null),t.evented.off("pluginStateChange",this._rtlTextPluginCallback),this._layers)this._layers[e].setEventedParent(null);for(var i in this.sourceCaches)this.sourceCaches[i].clearTiles(),this.sourceCaches[i].setEventedParent(null);this.imageManager.setEventedParent(null),this.setEventedParent(null),this.dispatcher.remove();},i.prototype._clearSource=function(t){this.sourceCaches[t].clearTiles();},i.prototype._reloadSource=function(t){this.sourceCaches[t].resume(),this.sourceCaches[t].reload();},i.prototype._updateSources=function(t){for(var e in this.sourceCaches)this.sourceCaches[e].update(t);},i.prototype._generateCollisionBoxes=function(){for(var t in this.sourceCaches)this._reloadSource(t);},i.prototype._updatePlacement=function(e,i,o,r,a){void 0===a&&(a=!1);for(var n=!1,s=!1,l={},c=0,u=this._order;c<u.length;c+=1){var h=this._layers[u[c]];if("symbol"===h.type){if(!l[h.source]){var p=this.sourceCaches[h.source];l[h.source]=p.getRenderableIds(!0).map((function(t){return p.getTileByID(t)})).sort((function(t,e){return e.tileID.overscaledZ-t.tileID.overscaledZ||(t.tileID.isLessThan(e.tileID)?-1:1)}));}var d=this.crossTileSymbolIndex.addLayer(h,l[h.source],e.center.lng);n=n||d;}}if(this.crossTileSymbolIndex.pruneUnusedLayers(this._order),((a=a||this._layerOrderChanged||0===o)||!this.pauseablePlacement||this.pauseablePlacement.isDone()&&!this.placement.stillRecent(t.browser.now(),e.zoom))&&(this.pauseablePlacement=new Le(e,this._order,a,i,o,r,this.placement),this._layerOrderChanged=!1),this.pauseablePlacement.isDone()?this.placement.setStale():(this.pauseablePlacement.continuePlacement(this._order,this._layers,l),this.pauseablePlacement.isDone()&&(this.placement=this.pauseablePlacement.commit(t.browser.now()),s=!0),n&&this.pauseablePlacement.placement.setStale()),s||n)for(var _=0,f=this._order;_<f.length;_+=1){var m=this._layers[f[_]];"symbol"===m.type&&this.placement.updateLayerOpacities(m,l[m.source]);}return !this.pauseablePlacement.isDone()||this.placement.hasTransitions(t.browser.now())},i.prototype._releaseSymbolFadeTiles=function(){for(var t in this.sourceCaches)this.sourceCaches[t].releaseSymbolFadeTiles();},i.prototype.getImages=function(t,e,i){this.imageManager.getImages(e.icons,i),this._updateTilesForChangedImages();var o=this.sourceCaches[e.source];o&&o.setDependencies(e.tileID.key,e.type,e.icons);},i.prototype.getGlyphs=function(t,e,i){this.glyphManager.getGlyphs(e.stacks,i);},i.prototype.getResource=function(e,i,o){return t.makeRequest(i,o)},i}(t.Evented);Ne.getSourceType=function(t){return k[t]},Ne.setSourceType=function(t,e){k[t]=e;},Ne.registerForPluginStateChange=t.registerForPluginStateChange;var Ze=t.createLayout([{name:"a_pos",type:"Int16",components:2}]),qe=_i("#ifdef GL_ES\nprecision mediump float;\n#else\n#if !defined(lowp)\n#define lowp\n#endif\n#if !defined(mediump)\n#define mediump\n#endif\n#if !defined(highp)\n#define highp\n#endif\n#endif","#ifdef GL_ES\nprecision highp float;\n#else\n#if !defined(lowp)\n#define lowp\n#endif\n#if !defined(mediump)\n#define mediump\n#endif\n#if !defined(highp)\n#define highp\n#endif\n#endif\nvec2 unpack_float(const float packedValue) {int packedIntValue=int(packedValue);int v0=packedIntValue/256;return vec2(v0,packedIntValue-v0*256);}vec2 unpack_opacity(const float packedOpacity) {int intOpacity=int(packedOpacity)/2;return vec2(float(intOpacity)/127.0,mod(packedOpacity,2.0));}vec4 decode_color(const vec2 encodedColor) {return vec4(unpack_float(encodedColor[0])/255.0,unpack_float(encodedColor[1])/255.0\n);}float unpack_mix_vec2(const vec2 packedValue,const float t) {return mix(packedValue[0],packedValue[1],t);}vec4 unpack_mix_color(const vec4 packedColors,const float t) {vec4 minColor=decode_color(vec2(packedColors[0],packedColors[1]));vec4 maxColor=decode_color(vec2(packedColors[2],packedColors[3]));return mix(minColor,maxColor,t);}vec2 get_pattern_pos(const vec2 pixel_coord_upper,const vec2 pixel_coord_lower,const vec2 pattern_size,const float tile_units_to_pixels,const vec2 pos) {vec2 offset=mod(mod(mod(pixel_coord_upper,pattern_size)*256.0,pattern_size)*256.0+pixel_coord_lower,pattern_size);return (tile_units_to_pixels*pos+offset)/pattern_size;}"),je=_i("uniform vec4 u_color;uniform float u_opacity;void main() {gl_FragColor=u_color*u_opacity;\n#ifdef OVERDRAW_INSPECTOR\ngl_FragColor=vec4(1.0);\n#endif\n}","attribute vec2 a_pos;uniform mat4 u_matrix;void main() {gl_Position=u_matrix*vec4(a_pos,0,1);}"),Ve=_i("uniform vec2 u_pattern_tl_a;uniform vec2 u_pattern_br_a;uniform vec2 u_pattern_tl_b;uniform vec2 u_pattern_br_b;uniform vec2 u_texsize;uniform float u_mix;uniform float u_opacity;uniform sampler2D u_image;varying vec2 v_pos_a;varying vec2 v_pos_b;void main() {vec2 imagecoord=mod(v_pos_a,1.0);vec2 pos=mix(u_pattern_tl_a/u_texsize,u_pattern_br_a/u_texsize,imagecoord);vec4 color1=texture2D(u_image,pos);vec2 imagecoord_b=mod(v_pos_b,1.0);vec2 pos2=mix(u_pattern_tl_b/u_texsize,u_pattern_br_b/u_texsize,imagecoord_b);vec4 color2=texture2D(u_image,pos2);gl_FragColor=mix(color1,color2,u_mix)*u_opacity;\n#ifdef OVERDRAW_INSPECTOR\ngl_FragColor=vec4(1.0);\n#endif\n}","uniform mat4 u_matrix;uniform vec2 u_pattern_size_a;uniform vec2 u_pattern_size_b;uniform vec2 u_pixel_coord_upper;uniform vec2 u_pixel_coord_lower;uniform float u_scale_a;uniform float u_scale_b;uniform float u_tile_units_to_pixels;attribute vec2 a_pos;varying vec2 v_pos_a;varying vec2 v_pos_b;void main() {gl_Position=u_matrix*vec4(a_pos,0,1);v_pos_a=get_pattern_pos(u_pixel_coord_upper,u_pixel_coord_lower,u_scale_a*u_pattern_size_a,u_tile_units_to_pixels,a_pos);v_pos_b=get_pattern_pos(u_pixel_coord_upper,u_pixel_coord_lower,u_scale_b*u_pattern_size_b,u_tile_units_to_pixels,a_pos);}"),Ge=_i("varying vec3 v_data;\n#pragma mapbox: define highp vec4 color\n#pragma mapbox: define mediump float radius\n#pragma mapbox: define lowp float blur\n#pragma mapbox: define lowp float opacity\n#pragma mapbox: define highp vec4 stroke_color\n#pragma mapbox: define mediump float stroke_width\n#pragma mapbox: define lowp float stroke_opacity\nvoid main() {\n#pragma mapbox: initialize highp vec4 color\n#pragma mapbox: initialize mediump float radius\n#pragma mapbox: initialize lowp float blur\n#pragma mapbox: initialize lowp float opacity\n#pragma mapbox: initialize highp vec4 stroke_color\n#pragma mapbox: initialize mediump float stroke_width\n#pragma mapbox: initialize lowp float stroke_opacity\nvec2 extrude=v_data.xy;float extrude_length=length(extrude);lowp float antialiasblur=v_data.z;float antialiased_blur=-max(blur,antialiasblur);float opacity_t=smoothstep(0.0,antialiased_blur,extrude_length-1.0);float color_t=stroke_width < 0.01 ? 0.0 : smoothstep(antialiased_blur,0.0,extrude_length-radius/(radius+stroke_width));gl_FragColor=opacity_t*mix(color*opacity,stroke_color*stroke_opacity,color_t);\n#ifdef OVERDRAW_INSPECTOR\ngl_FragColor=vec4(1.0);\n#endif\n}","uniform mat4 u_matrix;uniform bool u_scale_with_map;uniform bool u_pitch_with_map;uniform vec2 u_extrude_scale;uniform lowp float u_device_pixel_ratio;uniform highp float u_camera_to_center_distance;attribute vec2 a_pos;varying vec3 v_data;\n#pragma mapbox: define highp vec4 color\n#pragma mapbox: define mediump float radius\n#pragma mapbox: define lowp float blur\n#pragma mapbox: define lowp float opacity\n#pragma mapbox: define highp vec4 stroke_color\n#pragma mapbox: define mediump float stroke_width\n#pragma mapbox: define lowp float stroke_opacity\nvoid main(void) {\n#pragma mapbox: initialize highp vec4 color\n#pragma mapbox: initialize mediump float radius\n#pragma mapbox: initialize lowp float blur\n#pragma mapbox: initialize lowp float opacity\n#pragma mapbox: initialize highp vec4 stroke_color\n#pragma mapbox: initialize mediump float stroke_width\n#pragma mapbox: initialize lowp float stroke_opacity\nvec2 extrude=vec2(mod(a_pos,2.0)*2.0-1.0);vec2 circle_center=floor(a_pos*0.5);if (u_pitch_with_map) {vec2 corner_position=circle_center;if (u_scale_with_map) {corner_position+=extrude*(radius+stroke_width)*u_extrude_scale;} else {vec4 projected_center=u_matrix*vec4(circle_center,0,1);corner_position+=extrude*(radius+stroke_width)*u_extrude_scale*(projected_center.w/u_camera_to_center_distance);}gl_Position=u_matrix*vec4(corner_position,0,1);} else {gl_Position=u_matrix*vec4(circle_center,0,1);if (u_scale_with_map) {gl_Position.xy+=extrude*(radius+stroke_width)*u_extrude_scale*u_camera_to_center_distance;} else {gl_Position.xy+=extrude*(radius+stroke_width)*u_extrude_scale*gl_Position.w;}}lowp float antialiasblur=1.0/u_device_pixel_ratio/(radius+stroke_width);v_data=vec3(extrude.x,extrude.y,antialiasblur);}"),We=_i("void main() {gl_FragColor=vec4(1.0);}","attribute vec2 a_pos;uniform mat4 u_matrix;void main() {gl_Position=u_matrix*vec4(a_pos,0,1);}"),Xe=_i("uniform highp float u_intensity;varying vec2 v_extrude;\n#pragma mapbox: define highp float weight\n#define GAUSS_COEF 0.3989422804014327\nvoid main() {\n#pragma mapbox: initialize highp float weight\nfloat d=-0.5*3.0*3.0*dot(v_extrude,v_extrude);float val=weight*u_intensity*GAUSS_COEF*exp(d);gl_FragColor=vec4(val,1.0,1.0,1.0);\n#ifdef OVERDRAW_INSPECTOR\ngl_FragColor=vec4(1.0);\n#endif\n}","uniform mat4 u_matrix;uniform float u_extrude_scale;uniform float u_opacity;uniform float u_intensity;attribute vec2 a_pos;varying vec2 v_extrude;\n#pragma mapbox: define highp float weight\n#pragma mapbox: define mediump float radius\nconst highp float ZERO=1.0/255.0/16.0;\n#define GAUSS_COEF 0.3989422804014327\nvoid main(void) {\n#pragma mapbox: initialize highp float weight\n#pragma mapbox: initialize mediump float radius\nvec2 unscaled_extrude=vec2(mod(a_pos,2.0)*2.0-1.0);float S=sqrt(-2.0*log(ZERO/weight/u_intensity/GAUSS_COEF))/3.0;v_extrude=S*unscaled_extrude;vec2 extrude=v_extrude*radius*u_extrude_scale;vec4 pos=vec4(floor(a_pos*0.5)+extrude,0,1);gl_Position=u_matrix*pos;}"),He=_i("uniform sampler2D u_image;uniform sampler2D u_color_ramp;uniform float u_opacity;varying vec2 v_pos;void main() {float t=texture2D(u_image,v_pos).r;vec4 color=texture2D(u_color_ramp,vec2(t,0.5));gl_FragColor=color*u_opacity;\n#ifdef OVERDRAW_INSPECTOR\ngl_FragColor=vec4(0.0);\n#endif\n}","uniform mat4 u_matrix;uniform vec2 u_world;attribute vec2 a_pos;varying vec2 v_pos;void main() {gl_Position=u_matrix*vec4(a_pos*u_world,0,1);v_pos.x=a_pos.x;v_pos.y=1.0-a_pos.y;}"),Ke=_i("varying float v_placed;varying float v_notUsed;void main() {float alpha=0.5;gl_FragColor=vec4(1.0,0.0,0.0,1.0)*alpha;if (v_placed > 0.5) {gl_FragColor=vec4(0.0,0.0,1.0,0.5)*alpha;}if (v_notUsed > 0.5) {gl_FragColor*=.1;}}","attribute vec2 a_pos;attribute vec2 a_anchor_pos;attribute vec2 a_extrude;attribute vec2 a_placed;attribute vec2 a_shift;uniform mat4 u_matrix;uniform vec2 u_extrude_scale;uniform float u_camera_to_center_distance;varying float v_placed;varying float v_notUsed;void main() {vec4 projectedPoint=u_matrix*vec4(a_anchor_pos,0,1);highp float camera_to_anchor_distance=projectedPoint.w;highp float collision_perspective_ratio=clamp(0.5+0.5*(u_camera_to_center_distance/camera_to_anchor_distance),0.0,4.0);gl_Position=u_matrix*vec4(a_pos,0.0,1.0);gl_Position.xy+=(a_extrude+a_shift)*u_extrude_scale*gl_Position.w*collision_perspective_ratio;v_placed=a_placed.x;v_notUsed=a_placed.y;}"),Ye=_i("uniform float u_overscale_factor;varying float v_placed;varying float v_notUsed;varying float v_radius;varying vec2 v_extrude;varying vec2 v_extrude_scale;void main() {float alpha=0.5;vec4 color=vec4(1.0,0.0,0.0,1.0)*alpha;if (v_placed > 0.5) {color=vec4(0.0,0.0,1.0,0.5)*alpha;}if (v_notUsed > 0.5) {color*=.2;}float extrude_scale_length=length(v_extrude_scale);float extrude_length=length(v_extrude)*extrude_scale_length;float stroke_width=15.0*extrude_scale_length/u_overscale_factor;float radius=v_radius*extrude_scale_length;float distance_to_edge=abs(extrude_length-radius);float opacity_t=smoothstep(-stroke_width,0.0,-distance_to_edge);gl_FragColor=opacity_t*color;}","attribute vec2 a_pos;attribute vec2 a_anchor_pos;attribute vec2 a_extrude;attribute vec2 a_placed;uniform mat4 u_matrix;uniform vec2 u_extrude_scale;uniform float u_camera_to_center_distance;varying float v_placed;varying float v_notUsed;varying float v_radius;varying vec2 v_extrude;varying vec2 v_extrude_scale;void main() {vec4 projectedPoint=u_matrix*vec4(a_anchor_pos,0,1);highp float camera_to_anchor_distance=projectedPoint.w;highp float collision_perspective_ratio=clamp(0.5+0.5*(u_camera_to_center_distance/camera_to_anchor_distance),0.0,4.0);gl_Position=u_matrix*vec4(a_pos,0.0,1.0);highp float padding_factor=1.2;gl_Position.xy+=a_extrude*u_extrude_scale*padding_factor*gl_Position.w*collision_perspective_ratio;v_placed=a_placed.x;v_notUsed=a_placed.y;v_radius=abs(a_extrude.y);v_extrude=a_extrude*padding_factor;v_extrude_scale=u_extrude_scale*u_camera_to_center_distance*collision_perspective_ratio;}"),Je=_i("uniform highp vec4 u_color;uniform sampler2D u_overlay;varying vec2 v_uv;void main() {vec4 overlay_color=texture2D(u_overlay,v_uv);gl_FragColor=mix(u_color,overlay_color,overlay_color.a);}","attribute vec2 a_pos;varying vec2 v_uv;uniform mat4 u_matrix;uniform float u_overlay_scale;void main() {v_uv=a_pos/8192.0;gl_Position=u_matrix*vec4(a_pos*u_overlay_scale,0,1);}"),Qe=_i("#pragma mapbox: define highp vec4 color\n#pragma mapbox: define lowp float opacity\nvoid main() {\n#pragma mapbox: initialize highp vec4 color\n#pragma mapbox: initialize lowp float opacity\ngl_FragColor=color*opacity;\n#ifdef OVERDRAW_INSPECTOR\ngl_FragColor=vec4(1.0);\n#endif\n}","attribute vec2 a_pos;uniform mat4 u_matrix;\n#pragma mapbox: define highp vec4 color\n#pragma mapbox: define lowp float opacity\nvoid main() {\n#pragma mapbox: initialize highp vec4 color\n#pragma mapbox: initialize lowp float opacity\ngl_Position=u_matrix*vec4(a_pos,0,1);}"),$e=_i("varying vec2 v_pos;\n#pragma mapbox: define highp vec4 outline_color\n#pragma mapbox: define lowp float opacity\nvoid main() {\n#pragma mapbox: initialize highp vec4 outline_color\n#pragma mapbox: initialize lowp float opacity\nfloat dist=length(v_pos-gl_FragCoord.xy);float alpha=1.0-smoothstep(0.0,1.0,dist);gl_FragColor=outline_color*(alpha*opacity);\n#ifdef OVERDRAW_INSPECTOR\ngl_FragColor=vec4(1.0);\n#endif\n}","attribute vec2 a_pos;uniform mat4 u_matrix;uniform vec2 u_world;varying vec2 v_pos;\n#pragma mapbox: define highp vec4 outline_color\n#pragma mapbox: define lowp float opacity\nvoid main() {\n#pragma mapbox: initialize highp vec4 outline_color\n#pragma mapbox: initialize lowp float opacity\ngl_Position=u_matrix*vec4(a_pos,0,1);v_pos=(gl_Position.xy/gl_Position.w+1.0)/2.0*u_world;}"),ti=_i("uniform vec2 u_texsize;uniform sampler2D u_image;uniform float u_fade;varying vec2 v_pos_a;varying vec2 v_pos_b;varying vec2 v_pos;\n#pragma mapbox: define lowp float opacity\n#pragma mapbox: define lowp vec4 pattern_from\n#pragma mapbox: define lowp vec4 pattern_to\nvoid main() {\n#pragma mapbox: initialize lowp float opacity\n#pragma mapbox: initialize mediump vec4 pattern_from\n#pragma mapbox: initialize mediump vec4 pattern_to\nvec2 pattern_tl_a=pattern_from.xy;vec2 pattern_br_a=pattern_from.zw;vec2 pattern_tl_b=pattern_to.xy;vec2 pattern_br_b=pattern_to.zw;vec2 imagecoord=mod(v_pos_a,1.0);vec2 pos=mix(pattern_tl_a/u_texsize,pattern_br_a/u_texsize,imagecoord);vec4 color1=texture2D(u_image,pos);vec2 imagecoord_b=mod(v_pos_b,1.0);vec2 pos2=mix(pattern_tl_b/u_texsize,pattern_br_b/u_texsize,imagecoord_b);vec4 color2=texture2D(u_image,pos2);float dist=length(v_pos-gl_FragCoord.xy);float alpha=1.0-smoothstep(0.0,1.0,dist);gl_FragColor=mix(color1,color2,u_fade)*alpha*opacity;\n#ifdef OVERDRAW_INSPECTOR\ngl_FragColor=vec4(1.0);\n#endif\n}","uniform mat4 u_matrix;uniform vec2 u_world;uniform vec2 u_pixel_coord_upper;uniform vec2 u_pixel_coord_lower;uniform vec3 u_scale;attribute vec2 a_pos;varying vec2 v_pos_a;varying vec2 v_pos_b;varying vec2 v_pos;\n#pragma mapbox: define lowp float opacity\n#pragma mapbox: define lowp vec4 pattern_from\n#pragma mapbox: define lowp vec4 pattern_to\n#pragma mapbox: define lowp float pixel_ratio_from\n#pragma mapbox: define lowp float pixel_ratio_to\nvoid main() {\n#pragma mapbox: initialize lowp float opacity\n#pragma mapbox: initialize mediump vec4 pattern_from\n#pragma mapbox: initialize mediump vec4 pattern_to\n#pragma mapbox: initialize lowp float pixel_ratio_from\n#pragma mapbox: initialize lowp float pixel_ratio_to\nvec2 pattern_tl_a=pattern_from.xy;vec2 pattern_br_a=pattern_from.zw;vec2 pattern_tl_b=pattern_to.xy;vec2 pattern_br_b=pattern_to.zw;float tileRatio=u_scale.x;float fromScale=u_scale.y;float toScale=u_scale.z;gl_Position=u_matrix*vec4(a_pos,0,1);vec2 display_size_a=(pattern_br_a-pattern_tl_a)/pixel_ratio_from;vec2 display_size_b=(pattern_br_b-pattern_tl_b)/pixel_ratio_to;v_pos_a=get_pattern_pos(u_pixel_coord_upper,u_pixel_coord_lower,fromScale*display_size_a,tileRatio,a_pos);v_pos_b=get_pattern_pos(u_pixel_coord_upper,u_pixel_coord_lower,toScale*display_size_b,tileRatio,a_pos);v_pos=(gl_Position.xy/gl_Position.w+1.0)/2.0*u_world;}"),ei=_i("uniform vec2 u_texsize;uniform float u_fade;uniform sampler2D u_image;varying vec2 v_pos_a;varying vec2 v_pos_b;\n#pragma mapbox: define lowp float opacity\n#pragma mapbox: define lowp vec4 pattern_from\n#pragma mapbox: define lowp vec4 pattern_to\nvoid main() {\n#pragma mapbox: initialize lowp float opacity\n#pragma mapbox: initialize mediump vec4 pattern_from\n#pragma mapbox: initialize mediump vec4 pattern_to\nvec2 pattern_tl_a=pattern_from.xy;vec2 pattern_br_a=pattern_from.zw;vec2 pattern_tl_b=pattern_to.xy;vec2 pattern_br_b=pattern_to.zw;vec2 imagecoord=mod(v_pos_a,1.0);vec2 pos=mix(pattern_tl_a/u_texsize,pattern_br_a/u_texsize,imagecoord);vec4 color1=texture2D(u_image,pos);vec2 imagecoord_b=mod(v_pos_b,1.0);vec2 pos2=mix(pattern_tl_b/u_texsize,pattern_br_b/u_texsize,imagecoord_b);vec4 color2=texture2D(u_image,pos2);gl_FragColor=mix(color1,color2,u_fade)*opacity;\n#ifdef OVERDRAW_INSPECTOR\ngl_FragColor=vec4(1.0);\n#endif\n}","uniform mat4 u_matrix;uniform vec2 u_pixel_coord_upper;uniform vec2 u_pixel_coord_lower;uniform vec3 u_scale;attribute vec2 a_pos;varying vec2 v_pos_a;varying vec2 v_pos_b;\n#pragma mapbox: define lowp float opacity\n#pragma mapbox: define lowp vec4 pattern_from\n#pragma mapbox: define lowp vec4 pattern_to\n#pragma mapbox: define lowp float pixel_ratio_from\n#pragma mapbox: define lowp float pixel_ratio_to\nvoid main() {\n#pragma mapbox: initialize lowp float opacity\n#pragma mapbox: initialize mediump vec4 pattern_from\n#pragma mapbox: initialize mediump vec4 pattern_to\n#pragma mapbox: initialize lowp float pixel_ratio_from\n#pragma mapbox: initialize lowp float pixel_ratio_to\nvec2 pattern_tl_a=pattern_from.xy;vec2 pattern_br_a=pattern_from.zw;vec2 pattern_tl_b=pattern_to.xy;vec2 pattern_br_b=pattern_to.zw;float tileZoomRatio=u_scale.x;float fromScale=u_scale.y;float toScale=u_scale.z;vec2 display_size_a=(pattern_br_a-pattern_tl_a)/pixel_ratio_from;vec2 display_size_b=(pattern_br_b-pattern_tl_b)/pixel_ratio_to;gl_Position=u_matrix*vec4(a_pos,0,1);v_pos_a=get_pattern_pos(u_pixel_coord_upper,u_pixel_coord_lower,fromScale*display_size_a,tileZoomRatio,a_pos);v_pos_b=get_pattern_pos(u_pixel_coord_upper,u_pixel_coord_lower,toScale*display_size_b,tileZoomRatio,a_pos);}"),ii=_i("varying vec4 v_color;void main() {gl_FragColor=v_color;\n#ifdef OVERDRAW_INSPECTOR\ngl_FragColor=vec4(1.0);\n#endif\n}","uniform mat4 u_matrix;uniform vec3 u_lightcolor;uniform lowp vec3 u_lightpos;uniform lowp float u_lightintensity;uniform float u_vertical_gradient;uniform lowp float u_opacity;attribute vec2 a_pos;attribute vec4 a_normal_ed;varying vec4 v_color;\n#pragma mapbox: define highp float base\n#pragma mapbox: define highp float height\n#pragma mapbox: define highp vec4 color\nvoid main() {\n#pragma mapbox: initialize highp float base\n#pragma mapbox: initialize highp float height\n#pragma mapbox: initialize highp vec4 color\nvec3 normal=a_normal_ed.xyz;base=max(0.0,base);height=max(0.0,height);float t=mod(normal.x,2.0);gl_Position=u_matrix*vec4(a_pos,t > 0.0 ? height : base,1);float colorvalue=color.r*0.2126+color.g*0.7152+color.b*0.0722;v_color=vec4(0.0,0.0,0.0,1.0);vec4 ambientlight=vec4(0.03,0.03,0.03,1.0);color+=ambientlight;float directional=clamp(dot(normal/16384.0,u_lightpos),0.0,1.0);directional=mix((1.0-u_lightintensity),max((1.0-colorvalue+u_lightintensity),1.0),directional);if (normal.y !=0.0) {directional*=((1.0-u_vertical_gradient)+(u_vertical_gradient*clamp((t+base)*pow(height/150.0,0.5),mix(0.7,0.98,1.0-u_lightintensity),1.0)));}v_color.r+=clamp(color.r*directional*u_lightcolor.r,mix(0.0,0.3,1.0-u_lightcolor.r),1.0);v_color.g+=clamp(color.g*directional*u_lightcolor.g,mix(0.0,0.3,1.0-u_lightcolor.g),1.0);v_color.b+=clamp(color.b*directional*u_lightcolor.b,mix(0.0,0.3,1.0-u_lightcolor.b),1.0);v_color*=u_opacity;}"),oi=_i("uniform vec2 u_texsize;uniform float u_fade;uniform sampler2D u_image;varying vec2 v_pos_a;varying vec2 v_pos_b;varying vec4 v_lighting;\n#pragma mapbox: define lowp float base\n#pragma mapbox: define lowp float height\n#pragma mapbox: define lowp vec4 pattern_from\n#pragma mapbox: define lowp vec4 pattern_to\n#pragma mapbox: define lowp float pixel_ratio_from\n#pragma mapbox: define lowp float pixel_ratio_to\nvoid main() {\n#pragma mapbox: initialize lowp float base\n#pragma mapbox: initialize lowp float height\n#pragma mapbox: initialize mediump vec4 pattern_from\n#pragma mapbox: initialize mediump vec4 pattern_to\n#pragma mapbox: initialize lowp float pixel_ratio_from\n#pragma mapbox: initialize lowp float pixel_ratio_to\nvec2 pattern_tl_a=pattern_from.xy;vec2 pattern_br_a=pattern_from.zw;vec2 pattern_tl_b=pattern_to.xy;vec2 pattern_br_b=pattern_to.zw;vec2 imagecoord=mod(v_pos_a,1.0);vec2 pos=mix(pattern_tl_a/u_texsize,pattern_br_a/u_texsize,imagecoord);vec4 color1=texture2D(u_image,pos);vec2 imagecoord_b=mod(v_pos_b,1.0);vec2 pos2=mix(pattern_tl_b/u_texsize,pattern_br_b/u_texsize,imagecoord_b);vec4 color2=texture2D(u_image,pos2);vec4 mixedColor=mix(color1,color2,u_fade);gl_FragColor=mixedColor*v_lighting;\n#ifdef OVERDRAW_INSPECTOR\ngl_FragColor=vec4(1.0);\n#endif\n}","uniform mat4 u_matrix;uniform vec2 u_pixel_coord_upper;uniform vec2 u_pixel_coord_lower;uniform float u_height_factor;uniform vec3 u_scale;uniform float u_vertical_gradient;uniform lowp float u_opacity;uniform vec3 u_lightcolor;uniform lowp vec3 u_lightpos;uniform lowp float u_lightintensity;attribute vec2 a_pos;attribute vec4 a_normal_ed;varying vec2 v_pos_a;varying vec2 v_pos_b;varying vec4 v_lighting;\n#pragma mapbox: define lowp float base\n#pragma mapbox: define lowp float height\n#pragma mapbox: define lowp vec4 pattern_from\n#pragma mapbox: define lowp vec4 pattern_to\n#pragma mapbox: define lowp float pixel_ratio_from\n#pragma mapbox: define lowp float pixel_ratio_to\nvoid main() {\n#pragma mapbox: initialize lowp float base\n#pragma mapbox: initialize lowp float height\n#pragma mapbox: initialize mediump vec4 pattern_from\n#pragma mapbox: initialize mediump vec4 pattern_to\n#pragma mapbox: initialize lowp float pixel_ratio_from\n#pragma mapbox: initialize lowp float pixel_ratio_to\nvec2 pattern_tl_a=pattern_from.xy;vec2 pattern_br_a=pattern_from.zw;vec2 pattern_tl_b=pattern_to.xy;vec2 pattern_br_b=pattern_to.zw;float tileRatio=u_scale.x;float fromScale=u_scale.y;float toScale=u_scale.z;vec3 normal=a_normal_ed.xyz;float edgedistance=a_normal_ed.w;vec2 display_size_a=(pattern_br_a-pattern_tl_a)/pixel_ratio_from;vec2 display_size_b=(pattern_br_b-pattern_tl_b)/pixel_ratio_to;base=max(0.0,base);height=max(0.0,height);float t=mod(normal.x,2.0);float z=t > 0.0 ? height : base;gl_Position=u_matrix*vec4(a_pos,z,1);vec2 pos=normal.x==1.0 && normal.y==0.0 && normal.z==16384.0\n? a_pos\n: vec2(edgedistance,z*u_height_factor);v_pos_a=get_pattern_pos(u_pixel_coord_upper,u_pixel_coord_lower,fromScale*display_size_a,tileRatio,pos);v_pos_b=get_pattern_pos(u_pixel_coord_upper,u_pixel_coord_lower,toScale*display_size_b,tileRatio,pos);v_lighting=vec4(0.0,0.0,0.0,1.0);float directional=clamp(dot(normal/16383.0,u_lightpos),0.0,1.0);directional=mix((1.0-u_lightintensity),max((0.5+u_lightintensity),1.0),directional);if (normal.y !=0.0) {directional*=((1.0-u_vertical_gradient)+(u_vertical_gradient*clamp((t+base)*pow(height/150.0,0.5),mix(0.7,0.98,1.0-u_lightintensity),1.0)));}v_lighting.rgb+=clamp(directional*u_lightcolor,mix(vec3(0.0),vec3(0.3),1.0-u_lightcolor),vec3(1.0));v_lighting*=u_opacity;}"),ri=_i("#ifdef GL_ES\nprecision highp float;\n#endif\nuniform sampler2D u_image;varying vec2 v_pos;uniform vec2 u_dimension;uniform float u_zoom;uniform float u_maxzoom;uniform vec4 u_unpack;float getElevation(vec2 coord,float bias) {vec4 data=texture2D(u_image,coord)*255.0;data.a=-1.0;return dot(data,u_unpack)/4.0;}void main() {vec2 epsilon=1.0/u_dimension;float a=getElevation(v_pos+vec2(-epsilon.x,-epsilon.y),0.0);float b=getElevation(v_pos+vec2(0,-epsilon.y),0.0);float c=getElevation(v_pos+vec2(epsilon.x,-epsilon.y),0.0);float d=getElevation(v_pos+vec2(-epsilon.x,0),0.0);float e=getElevation(v_pos,0.0);float f=getElevation(v_pos+vec2(epsilon.x,0),0.0);float g=getElevation(v_pos+vec2(-epsilon.x,epsilon.y),0.0);float h=getElevation(v_pos+vec2(0,epsilon.y),0.0);float i=getElevation(v_pos+vec2(epsilon.x,epsilon.y),0.0);float exaggeration=u_zoom < 2.0 ? 0.4 : u_zoom < 4.5 ? 0.35 : 0.3;vec2 deriv=vec2((c+f+f+i)-(a+d+d+g),(g+h+h+i)-(a+b+b+c))/ pow(2.0,(u_zoom-u_maxzoom)*exaggeration+19.2562-u_zoom);gl_FragColor=clamp(vec4(deriv.x/2.0+0.5,deriv.y/2.0+0.5,1.0,1.0),0.0,1.0);\n#ifdef OVERDRAW_INSPECTOR\ngl_FragColor=vec4(1.0);\n#endif\n}","uniform mat4 u_matrix;uniform vec2 u_dimension;attribute vec2 a_pos;attribute vec2 a_texture_pos;varying vec2 v_pos;void main() {gl_Position=u_matrix*vec4(a_pos,0,1);highp vec2 epsilon=1.0/u_dimension;float scale=(u_dimension.x-2.0)/u_dimension.x;v_pos=(a_texture_pos/8192.0)*scale+epsilon;}"),ai=_i("uniform sampler2D u_image;varying vec2 v_pos;uniform vec2 u_latrange;uniform vec2 u_light;uniform vec4 u_shadow;uniform vec4 u_highlight;uniform vec4 u_accent;\n#define PI 3.141592653589793\nvoid main() {vec4 pixel=texture2D(u_image,v_pos);vec2 deriv=((pixel.rg*2.0)-1.0);float scaleFactor=cos(radians((u_latrange[0]-u_latrange[1])*(1.0-v_pos.y)+u_latrange[1]));float slope=atan(1.25*length(deriv)/scaleFactor);float aspect=deriv.x !=0.0 ? atan(deriv.y,-deriv.x) : PI/2.0*(deriv.y > 0.0 ? 1.0 :-1.0);float intensity=u_light.x;float azimuth=u_light.y+PI;float base=1.875-intensity*1.75;float maxValue=0.5*PI;float scaledSlope=intensity !=0.5 ? ((pow(base,slope)-1.0)/(pow(base,maxValue)-1.0))*maxValue : slope;float accent=cos(scaledSlope);vec4 accent_color=(1.0-accent)*u_accent*clamp(intensity*2.0,0.0,1.0);float shade=abs(mod((aspect+azimuth)/PI+0.5,2.0)-1.0);vec4 shade_color=mix(u_shadow,u_highlight,shade)*sin(scaledSlope)*clamp(intensity*2.0,0.0,1.0);gl_FragColor=accent_color*(1.0-shade_color.a)+shade_color;\n#ifdef OVERDRAW_INSPECTOR\ngl_FragColor=vec4(1.0);\n#endif\n}","uniform mat4 u_matrix;attribute vec2 a_pos;attribute vec2 a_texture_pos;varying vec2 v_pos;void main() {gl_Position=u_matrix*vec4(a_pos,0,1);v_pos=a_texture_pos/8192.0;}"),ni=_i("uniform lowp float u_device_pixel_ratio;varying vec2 v_width2;varying vec2 v_normal;varying float v_gamma_scale;\n#pragma mapbox: define highp vec4 color\n#pragma mapbox: define lowp float blur\n#pragma mapbox: define lowp float opacity\nvoid main() {\n#pragma mapbox: initialize highp vec4 color\n#pragma mapbox: initialize lowp float blur\n#pragma mapbox: initialize lowp float opacity\nfloat dist=length(v_normal)*v_width2.s;float blur2=(blur+1.0/u_device_pixel_ratio)*v_gamma_scale;float alpha=clamp(min(dist-(v_width2.t-blur2),v_width2.s-dist)/blur2,0.0,1.0);gl_FragColor=color*(alpha*opacity);\n#ifdef OVERDRAW_INSPECTOR\ngl_FragColor=vec4(1.0);\n#endif\n}","\n#define scale 0.015873016\nattribute vec2 a_pos_normal;attribute vec4 a_data;uniform mat4 u_matrix;uniform mediump float u_ratio;uniform vec2 u_units_to_pixels;uniform lowp float u_device_pixel_ratio;varying vec2 v_normal;varying vec2 v_width2;varying float v_gamma_scale;varying highp float v_linesofar;\n#pragma mapbox: define highp vec4 color\n#pragma mapbox: define lowp float blur\n#pragma mapbox: define lowp float opacity\n#pragma mapbox: define mediump float gapwidth\n#pragma mapbox: define lowp float offset\n#pragma mapbox: define mediump float width\nvoid main() {\n#pragma mapbox: initialize highp vec4 color\n#pragma mapbox: initialize lowp float blur\n#pragma mapbox: initialize lowp float opacity\n#pragma mapbox: initialize mediump float gapwidth\n#pragma mapbox: initialize lowp float offset\n#pragma mapbox: initialize mediump float width\nfloat ANTIALIASING=1.0/u_device_pixel_ratio/2.0;vec2 a_extrude=a_data.xy-128.0;float a_direction=mod(a_data.z,4.0)-1.0;v_linesofar=(floor(a_data.z/4.0)+a_data.w*64.0)*2.0;vec2 pos=floor(a_pos_normal*0.5);mediump vec2 normal=a_pos_normal-2.0*pos;normal.y=normal.y*2.0-1.0;v_normal=normal;gapwidth=gapwidth/2.0;float halfwidth=width/2.0;offset=-1.0*offset;float inset=gapwidth+(gapwidth > 0.0 ? ANTIALIASING : 0.0);float outset=gapwidth+halfwidth*(gapwidth > 0.0 ? 2.0 : 1.0)+(halfwidth==0.0 ? 0.0 : ANTIALIASING);mediump vec2 dist=outset*a_extrude*scale;mediump float u=0.5*a_direction;mediump float t=1.0-abs(u);mediump vec2 offset2=offset*a_extrude*scale*normal.y*mat2(t,-u,u,t);vec4 projected_extrude=u_matrix*vec4(dist/u_ratio,0.0,0.0);gl_Position=u_matrix*vec4(pos+offset2/u_ratio,0.0,1.0)+projected_extrude;float extrude_length_without_perspective=length(dist);float extrude_length_with_perspective=length(projected_extrude.xy/gl_Position.w*u_units_to_pixels);v_gamma_scale=extrude_length_without_perspective/extrude_length_with_perspective;v_width2=vec2(outset,inset);}"),si=_i("uniform lowp float u_device_pixel_ratio;uniform sampler2D u_image;varying vec2 v_width2;varying vec2 v_normal;varying float v_gamma_scale;varying highp float v_lineprogress;\n#pragma mapbox: define lowp float blur\n#pragma mapbox: define lowp float opacity\nvoid main() {\n#pragma mapbox: initialize lowp float blur\n#pragma mapbox: initialize lowp float opacity\nfloat dist=length(v_normal)*v_width2.s;float blur2=(blur+1.0/u_device_pixel_ratio)*v_gamma_scale;float alpha=clamp(min(dist-(v_width2.t-blur2),v_width2.s-dist)/blur2,0.0,1.0);vec4 color=texture2D(u_image,vec2(v_lineprogress,0.5));gl_FragColor=color*(alpha*opacity);\n#ifdef OVERDRAW_INSPECTOR\ngl_FragColor=vec4(1.0);\n#endif\n}","\n#define MAX_LINE_DISTANCE 32767.0\n#define scale 0.015873016\nattribute vec2 a_pos_normal;attribute vec4 a_data;uniform mat4 u_matrix;uniform mediump float u_ratio;uniform lowp float u_device_pixel_ratio;uniform vec2 u_units_to_pixels;varying vec2 v_normal;varying vec2 v_width2;varying float v_gamma_scale;varying highp float v_lineprogress;\n#pragma mapbox: define lowp float blur\n#pragma mapbox: define lowp float opacity\n#pragma mapbox: define mediump float gapwidth\n#pragma mapbox: define lowp float offset\n#pragma mapbox: define mediump float width\nvoid main() {\n#pragma mapbox: initialize lowp float blur\n#pragma mapbox: initialize lowp float opacity\n#pragma mapbox: initialize mediump float gapwidth\n#pragma mapbox: initialize lowp float offset\n#pragma mapbox: initialize mediump float width\nfloat ANTIALIASING=1.0/u_device_pixel_ratio/2.0;vec2 a_extrude=a_data.xy-128.0;float a_direction=mod(a_data.z,4.0)-1.0;v_lineprogress=(floor(a_data.z/4.0)+a_data.w*64.0)*2.0/MAX_LINE_DISTANCE;vec2 pos=floor(a_pos_normal*0.5);mediump vec2 normal=a_pos_normal-2.0*pos;normal.y=normal.y*2.0-1.0;v_normal=normal;gapwidth=gapwidth/2.0;float halfwidth=width/2.0;offset=-1.0*offset;float inset=gapwidth+(gapwidth > 0.0 ? ANTIALIASING : 0.0);float outset=gapwidth+halfwidth*(gapwidth > 0.0 ? 2.0 : 1.0)+(halfwidth==0.0 ? 0.0 : ANTIALIASING);mediump vec2 dist=outset*a_extrude*scale;mediump float u=0.5*a_direction;mediump float t=1.0-abs(u);mediump vec2 offset2=offset*a_extrude*scale*normal.y*mat2(t,-u,u,t);vec4 projected_extrude=u_matrix*vec4(dist/u_ratio,0.0,0.0);gl_Position=u_matrix*vec4(pos+offset2/u_ratio,0.0,1.0)+projected_extrude;float extrude_length_without_perspective=length(dist);float extrude_length_with_perspective=length(projected_extrude.xy/gl_Position.w*u_units_to_pixels);v_gamma_scale=extrude_length_without_perspective/extrude_length_with_perspective;v_width2=vec2(outset,inset);}"),li=_i("uniform lowp float u_device_pixel_ratio;uniform vec2 u_texsize;uniform float u_fade;uniform mediump vec3 u_scale;uniform sampler2D u_image;varying vec2 v_normal;varying vec2 v_width2;varying float v_linesofar;varying float v_gamma_scale;varying float v_width;\n#pragma mapbox: define lowp vec4 pattern_from\n#pragma mapbox: define lowp vec4 pattern_to\n#pragma mapbox: define lowp float pixel_ratio_from\n#pragma mapbox: define lowp float pixel_ratio_to\n#pragma mapbox: define lowp float blur\n#pragma mapbox: define lowp float opacity\nvoid main() {\n#pragma mapbox: initialize mediump vec4 pattern_from\n#pragma mapbox: initialize mediump vec4 pattern_to\n#pragma mapbox: initialize lowp float pixel_ratio_from\n#pragma mapbox: initialize lowp float pixel_ratio_to\n#pragma mapbox: initialize lowp float blur\n#pragma mapbox: initialize lowp float opacity\nvec2 pattern_tl_a=pattern_from.xy;vec2 pattern_br_a=pattern_from.zw;vec2 pattern_tl_b=pattern_to.xy;vec2 pattern_br_b=pattern_to.zw;float tileZoomRatio=u_scale.x;float fromScale=u_scale.y;float toScale=u_scale.z;vec2 display_size_a=(pattern_br_a-pattern_tl_a)/pixel_ratio_from;vec2 display_size_b=(pattern_br_b-pattern_tl_b)/pixel_ratio_to;vec2 pattern_size_a=vec2(display_size_a.x*fromScale/tileZoomRatio,display_size_a.y);vec2 pattern_size_b=vec2(display_size_b.x*toScale/tileZoomRatio,display_size_b.y);float aspect_a=display_size_a.y/v_width;float aspect_b=display_size_b.y/v_width;float dist=length(v_normal)*v_width2.s;float blur2=(blur+1.0/u_device_pixel_ratio)*v_gamma_scale;float alpha=clamp(min(dist-(v_width2.t-blur2),v_width2.s-dist)/blur2,0.0,1.0);float x_a=mod(v_linesofar/pattern_size_a.x*aspect_a,1.0);float x_b=mod(v_linesofar/pattern_size_b.x*aspect_b,1.0);float y=0.5*v_normal.y+0.5;vec2 texel_size=1.0/u_texsize;vec2 pos_a=mix(pattern_tl_a*texel_size-texel_size,pattern_br_a*texel_size+texel_size,vec2(x_a,y));vec2 pos_b=mix(pattern_tl_b*texel_size-texel_size,pattern_br_b*texel_size+texel_size,vec2(x_b,y));vec4 color=mix(texture2D(u_image,pos_a),texture2D(u_image,pos_b),u_fade);gl_FragColor=color*alpha*opacity;\n#ifdef OVERDRAW_INSPECTOR\ngl_FragColor=vec4(1.0);\n#endif\n}","\n#define scale 0.015873016\n#define LINE_DISTANCE_SCALE 2.0\nattribute vec2 a_pos_normal;attribute vec4 a_data;uniform mat4 u_matrix;uniform vec2 u_units_to_pixels;uniform mediump float u_ratio;uniform lowp float u_device_pixel_ratio;varying vec2 v_normal;varying vec2 v_width2;varying float v_linesofar;varying float v_gamma_scale;varying float v_width;\n#pragma mapbox: define lowp float blur\n#pragma mapbox: define lowp float opacity\n#pragma mapbox: define lowp float offset\n#pragma mapbox: define mediump float gapwidth\n#pragma mapbox: define mediump float width\n#pragma mapbox: define lowp float floorwidth\n#pragma mapbox: define lowp vec4 pattern_from\n#pragma mapbox: define lowp vec4 pattern_to\n#pragma mapbox: define lowp float pixel_ratio_from\n#pragma mapbox: define lowp float pixel_ratio_to\nvoid main() {\n#pragma mapbox: initialize lowp float blur\n#pragma mapbox: initialize lowp float opacity\n#pragma mapbox: initialize lowp float offset\n#pragma mapbox: initialize mediump float gapwidth\n#pragma mapbox: initialize mediump float width\n#pragma mapbox: initialize lowp float floorwidth\n#pragma mapbox: initialize mediump vec4 pattern_from\n#pragma mapbox: initialize mediump vec4 pattern_to\n#pragma mapbox: initialize lowp float pixel_ratio_from\n#pragma mapbox: initialize lowp float pixel_ratio_to\nfloat ANTIALIASING=1.0/u_device_pixel_ratio/2.0;vec2 a_extrude=a_data.xy-128.0;float a_direction=mod(a_data.z,4.0)-1.0;float a_linesofar=(floor(a_data.z/4.0)+a_data.w*64.0)*LINE_DISTANCE_SCALE;vec2 pos=floor(a_pos_normal*0.5);mediump vec2 normal=a_pos_normal-2.0*pos;normal.y=normal.y*2.0-1.0;v_normal=normal;gapwidth=gapwidth/2.0;float halfwidth=width/2.0;offset=-1.0*offset;float inset=gapwidth+(gapwidth > 0.0 ? ANTIALIASING : 0.0);float outset=gapwidth+halfwidth*(gapwidth > 0.0 ? 2.0 : 1.0)+(halfwidth==0.0 ? 0.0 : ANTIALIASING);mediump vec2 dist=outset*a_extrude*scale;mediump float u=0.5*a_direction;mediump float t=1.0-abs(u);mediump vec2 offset2=offset*a_extrude*scale*normal.y*mat2(t,-u,u,t);vec4 projected_extrude=u_matrix*vec4(dist/u_ratio,0.0,0.0);gl_Position=u_matrix*vec4(pos+offset2/u_ratio,0.0,1.0)+projected_extrude;float extrude_length_without_perspective=length(dist);float extrude_length_with_perspective=length(projected_extrude.xy/gl_Position.w*u_units_to_pixels);v_gamma_scale=extrude_length_without_perspective/extrude_length_with_perspective;v_linesofar=a_linesofar;v_width2=vec2(outset,inset);v_width=floorwidth;}"),ci=_i("uniform lowp float u_device_pixel_ratio;uniform sampler2D u_image;uniform float u_sdfgamma;uniform float u_mix;varying vec2 v_normal;varying vec2 v_width2;varying vec2 v_tex_a;varying vec2 v_tex_b;varying float v_gamma_scale;\n#pragma mapbox: define highp vec4 color\n#pragma mapbox: define lowp float blur\n#pragma mapbox: define lowp float opacity\n#pragma mapbox: define mediump float width\n#pragma mapbox: define lowp float floorwidth\nvoid main() {\n#pragma mapbox: initialize highp vec4 color\n#pragma mapbox: initialize lowp float blur\n#pragma mapbox: initialize lowp float opacity\n#pragma mapbox: initialize mediump float width\n#pragma mapbox: initialize lowp float floorwidth\nfloat dist=length(v_normal)*v_width2.s;float blur2=(blur+1.0/u_device_pixel_ratio)*v_gamma_scale;float alpha=clamp(min(dist-(v_width2.t-blur2),v_width2.s-dist)/blur2,0.0,1.0);float sdfdist_a=texture2D(u_image,v_tex_a).a;float sdfdist_b=texture2D(u_image,v_tex_b).a;float sdfdist=mix(sdfdist_a,sdfdist_b,u_mix);alpha*=smoothstep(0.5-u_sdfgamma/floorwidth,0.5+u_sdfgamma/floorwidth,sdfdist);gl_FragColor=color*(alpha*opacity);\n#ifdef OVERDRAW_INSPECTOR\ngl_FragColor=vec4(1.0);\n#endif\n}","\n#define scale 0.015873016\n#define LINE_DISTANCE_SCALE 2.0\nattribute vec2 a_pos_normal;attribute vec4 a_data;uniform mat4 u_matrix;uniform mediump float u_ratio;uniform lowp float u_device_pixel_ratio;uniform vec2 u_patternscale_a;uniform float u_tex_y_a;uniform vec2 u_patternscale_b;uniform float u_tex_y_b;uniform vec2 u_units_to_pixels;varying vec2 v_normal;varying vec2 v_width2;varying vec2 v_tex_a;varying vec2 v_tex_b;varying float v_gamma_scale;\n#pragma mapbox: define highp vec4 color\n#pragma mapbox: define lowp float blur\n#pragma mapbox: define lowp float opacity\n#pragma mapbox: define mediump float gapwidth\n#pragma mapbox: define lowp float offset\n#pragma mapbox: define mediump float width\n#pragma mapbox: define lowp float floorwidth\nvoid main() {\n#pragma mapbox: initialize highp vec4 color\n#pragma mapbox: initialize lowp float blur\n#pragma mapbox: initialize lowp float opacity\n#pragma mapbox: initialize mediump float gapwidth\n#pragma mapbox: initialize lowp float offset\n#pragma mapbox: initialize mediump float width\n#pragma mapbox: initialize lowp float floorwidth\nfloat ANTIALIASING=1.0/u_device_pixel_ratio/2.0;vec2 a_extrude=a_data.xy-128.0;float a_direction=mod(a_data.z,4.0)-1.0;float a_linesofar=(floor(a_data.z/4.0)+a_data.w*64.0)*LINE_DISTANCE_SCALE;vec2 pos=floor(a_pos_normal*0.5);mediump vec2 normal=a_pos_normal-2.0*pos;normal.y=normal.y*2.0-1.0;v_normal=normal;gapwidth=gapwidth/2.0;float halfwidth=width/2.0;offset=-1.0*offset;float inset=gapwidth+(gapwidth > 0.0 ? ANTIALIASING : 0.0);float outset=gapwidth+halfwidth*(gapwidth > 0.0 ? 2.0 : 1.0)+(halfwidth==0.0 ? 0.0 : ANTIALIASING);mediump vec2 dist=outset*a_extrude*scale;mediump float u=0.5*a_direction;mediump float t=1.0-abs(u);mediump vec2 offset2=offset*a_extrude*scale*normal.y*mat2(t,-u,u,t);vec4 projected_extrude=u_matrix*vec4(dist/u_ratio,0.0,0.0);gl_Position=u_matrix*vec4(pos+offset2/u_ratio,0.0,1.0)+projected_extrude;float extrude_length_without_perspective=length(dist);float extrude_length_with_perspective=length(projected_extrude.xy/gl_Position.w*u_units_to_pixels);v_gamma_scale=extrude_length_without_perspective/extrude_length_with_perspective;v_tex_a=vec2(a_linesofar*u_patternscale_a.x/floorwidth,normal.y*u_patternscale_a.y+u_tex_y_a);v_tex_b=vec2(a_linesofar*u_patternscale_b.x/floorwidth,normal.y*u_patternscale_b.y+u_tex_y_b);v_width2=vec2(outset,inset);}"),ui=_i("uniform float u_fade_t;uniform float u_opacity;uniform sampler2D u_image0;uniform sampler2D u_image1;varying vec2 v_pos0;varying vec2 v_pos1;uniform float u_brightness_low;uniform float u_brightness_high;uniform float u_saturation_factor;uniform float u_contrast_factor;uniform vec3 u_spin_weights;void main() {vec4 color0=texture2D(u_image0,v_pos0);vec4 color1=texture2D(u_image1,v_pos1);if (color0.a > 0.0) {color0.rgb=color0.rgb/color0.a;}if (color1.a > 0.0) {color1.rgb=color1.rgb/color1.a;}vec4 color=mix(color0,color1,u_fade_t);color.a*=u_opacity;vec3 rgb=color.rgb;rgb=vec3(dot(rgb,u_spin_weights.xyz),dot(rgb,u_spin_weights.zxy),dot(rgb,u_spin_weights.yzx));float average=(color.r+color.g+color.b)/3.0;rgb+=(average-rgb)*u_saturation_factor;rgb=(rgb-0.5)*u_contrast_factor+0.5;vec3 u_high_vec=vec3(u_brightness_low,u_brightness_low,u_brightness_low);vec3 u_low_vec=vec3(u_brightness_high,u_brightness_high,u_brightness_high);gl_FragColor=vec4(mix(u_high_vec,u_low_vec,rgb)*color.a,color.a);\n#ifdef OVERDRAW_INSPECTOR\ngl_FragColor=vec4(1.0);\n#endif\n}","uniform mat4 u_matrix;uniform vec2 u_tl_parent;uniform float u_scale_parent;uniform float u_buffer_scale;attribute vec2 a_pos;attribute vec2 a_texture_pos;varying vec2 v_pos0;varying vec2 v_pos1;void main() {gl_Position=u_matrix*vec4(a_pos,0,1);v_pos0=(((a_texture_pos/8192.0)-0.5)/u_buffer_scale )+0.5;v_pos1=(v_pos0*u_scale_parent)+u_tl_parent;}"),hi=_i("uniform sampler2D u_texture;varying vec2 v_tex;varying float v_fade_opacity;\n#pragma mapbox: define lowp float opacity\nvoid main() {\n#pragma mapbox: initialize lowp float opacity\nlowp float alpha=opacity*v_fade_opacity;gl_FragColor=texture2D(u_texture,v_tex)*alpha;\n#ifdef OVERDRAW_INSPECTOR\ngl_FragColor=vec4(1.0);\n#endif\n}","const float PI=3.141592653589793;attribute vec4 a_pos_offset;attribute vec4 a_data;attribute vec4 a_pixeloffset;attribute vec3 a_projected_pos;attribute float a_fade_opacity;uniform bool u_is_size_zoom_constant;uniform bool u_is_size_feature_constant;uniform highp float u_size_t;uniform highp float u_size;uniform highp float u_camera_to_center_distance;uniform highp float u_pitch;uniform bool u_rotate_symbol;uniform highp float u_aspect_ratio;uniform float u_fade_change;uniform mat4 u_matrix;uniform mat4 u_label_plane_matrix;uniform mat4 u_coord_matrix;uniform bool u_is_text;uniform bool u_pitch_with_map;uniform vec2 u_texsize;varying vec2 v_tex;varying float v_fade_opacity;\n#pragma mapbox: define lowp float opacity\nvoid main() {\n#pragma mapbox: initialize lowp float opacity\nvec2 a_pos=a_pos_offset.xy;vec2 a_offset=a_pos_offset.zw;vec2 a_tex=a_data.xy;vec2 a_size=a_data.zw;float a_size_min=floor(a_size[0]*0.5);vec2 a_pxoffset=a_pixeloffset.xy;vec2 a_minFontScale=a_pixeloffset.zw/256.0;highp float segment_angle=-a_projected_pos[2];float size;if (!u_is_size_zoom_constant && !u_is_size_feature_constant) {size=mix(a_size_min,a_size[1],u_size_t)/128.0;} else if (u_is_size_zoom_constant && !u_is_size_feature_constant) {size=a_size_min/128.0;} else {size=u_size;}vec4 projectedPoint=u_matrix*vec4(a_pos,0,1);highp float camera_to_anchor_distance=projectedPoint.w;highp float distance_ratio=u_pitch_with_map ?\ncamera_to_anchor_distance/u_camera_to_center_distance :\nu_camera_to_center_distance/camera_to_anchor_distance;highp float perspective_ratio=clamp(0.5+0.5*distance_ratio,0.0,4.0);size*=perspective_ratio;float fontScale=u_is_text ? size/24.0 : size;highp float symbol_rotation=0.0;if (u_rotate_symbol) {vec4 offsetProjectedPoint=u_matrix*vec4(a_pos+vec2(1,0),0,1);vec2 a=projectedPoint.xy/projectedPoint.w;vec2 b=offsetProjectedPoint.xy/offsetProjectedPoint.w;symbol_rotation=atan((b.y-a.y)/u_aspect_ratio,b.x-a.x);}highp float angle_sin=sin(segment_angle+symbol_rotation);highp float angle_cos=cos(segment_angle+symbol_rotation);mat2 rotation_matrix=mat2(angle_cos,-1.0*angle_sin,angle_sin,angle_cos);vec4 projected_pos=u_label_plane_matrix*vec4(a_projected_pos.xy,0.0,1.0);gl_Position=u_coord_matrix*vec4(projected_pos.xy/projected_pos.w+rotation_matrix*(a_offset/32.0*max(a_minFontScale,fontScale)+a_pxoffset/16.0),0.0,1.0);v_tex=a_tex/u_texsize;vec2 fade_opacity=unpack_opacity(a_fade_opacity);float fade_change=fade_opacity[1] > 0.5 ? u_fade_change :-u_fade_change;v_fade_opacity=max(0.0,min(1.0,fade_opacity[0]+fade_change));}"),pi=_i("#define SDF_PX 8.0\nuniform bool u_is_halo;uniform sampler2D u_texture;uniform highp float u_gamma_scale;uniform lowp float u_device_pixel_ratio;uniform bool u_is_text;varying vec2 v_data0;varying vec3 v_data1;\n#pragma mapbox: define highp vec4 fill_color\n#pragma mapbox: define highp vec4 halo_color\n#pragma mapbox: define lowp float opacity\n#pragma mapbox: define lowp float halo_width\n#pragma mapbox: define lowp float halo_blur\nvoid main() {\n#pragma mapbox: initialize highp vec4 fill_color\n#pragma mapbox: initialize highp vec4 halo_color\n#pragma mapbox: initialize lowp float opacity\n#pragma mapbox: initialize lowp float halo_width\n#pragma mapbox: initialize lowp float halo_blur\nfloat EDGE_GAMMA=0.105/u_device_pixel_ratio;vec2 tex=v_data0.xy;float gamma_scale=v_data1.x;float size=v_data1.y;float fade_opacity=v_data1[2];float fontScale=u_is_text ? size/24.0 : size;lowp vec4 color=fill_color;highp float gamma=EDGE_GAMMA/(fontScale*u_gamma_scale);lowp float buff=(256.0-64.0)/256.0;if (u_is_halo) {color=halo_color;gamma=(halo_blur*1.19/SDF_PX+EDGE_GAMMA)/(fontScale*u_gamma_scale);buff=(6.0-halo_width/fontScale)/SDF_PX;}lowp float dist=texture2D(u_texture,tex).a;highp float gamma_scaled=gamma*gamma_scale;highp float alpha=smoothstep(buff-gamma_scaled,buff+gamma_scaled,dist);gl_FragColor=color*(alpha*opacity*fade_opacity);\n#ifdef OVERDRAW_INSPECTOR\ngl_FragColor=vec4(1.0);\n#endif\n}","const float PI=3.141592653589793;attribute vec4 a_pos_offset;attribute vec4 a_data;attribute vec4 a_pixeloffset;attribute vec3 a_projected_pos;attribute float a_fade_opacity;uniform bool u_is_size_zoom_constant;uniform bool u_is_size_feature_constant;uniform highp float u_size_t;uniform highp float u_size;uniform mat4 u_matrix;uniform mat4 u_label_plane_matrix;uniform mat4 u_coord_matrix;uniform bool u_is_text;uniform bool u_pitch_with_map;uniform highp float u_pitch;uniform bool u_rotate_symbol;uniform highp float u_aspect_ratio;uniform highp float u_camera_to_center_distance;uniform float u_fade_change;uniform vec2 u_texsize;varying vec2 v_data0;varying vec3 v_data1;\n#pragma mapbox: define highp vec4 fill_color\n#pragma mapbox: define highp vec4 halo_color\n#pragma mapbox: define lowp float opacity\n#pragma mapbox: define lowp float halo_width\n#pragma mapbox: define lowp float halo_blur\nvoid main() {\n#pragma mapbox: initialize highp vec4 fill_color\n#pragma mapbox: initialize highp vec4 halo_color\n#pragma mapbox: initialize lowp float opacity\n#pragma mapbox: initialize lowp float halo_width\n#pragma mapbox: initialize lowp float halo_blur\nvec2 a_pos=a_pos_offset.xy;vec2 a_offset=a_pos_offset.zw;vec2 a_tex=a_data.xy;vec2 a_size=a_data.zw;float a_size_min=floor(a_size[0]*0.5);vec2 a_pxoffset=a_pixeloffset.xy;highp float segment_angle=-a_projected_pos[2];float size;if (!u_is_size_zoom_constant && !u_is_size_feature_constant) {size=mix(a_size_min,a_size[1],u_size_t)/128.0;} else if (u_is_size_zoom_constant && !u_is_size_feature_constant) {size=a_size_min/128.0;} else {size=u_size;}vec4 projectedPoint=u_matrix*vec4(a_pos,0,1);highp float camera_to_anchor_distance=projectedPoint.w;highp float distance_ratio=u_pitch_with_map ?\ncamera_to_anchor_distance/u_camera_to_center_distance :\nu_camera_to_center_distance/camera_to_anchor_distance;highp float perspective_ratio=clamp(0.5+0.5*distance_ratio,0.0,4.0);size*=perspective_ratio;float fontScale=u_is_text ? size/24.0 : size;highp float symbol_rotation=0.0;if (u_rotate_symbol) {vec4 offsetProjectedPoint=u_matrix*vec4(a_pos+vec2(1,0),0,1);vec2 a=projectedPoint.xy/projectedPoint.w;vec2 b=offsetProjectedPoint.xy/offsetProjectedPoint.w;symbol_rotation=atan((b.y-a.y)/u_aspect_ratio,b.x-a.x);}highp float angle_sin=sin(segment_angle+symbol_rotation);highp float angle_cos=cos(segment_angle+symbol_rotation);mat2 rotation_matrix=mat2(angle_cos,-1.0*angle_sin,angle_sin,angle_cos);vec4 projected_pos=u_label_plane_matrix*vec4(a_projected_pos.xy,0.0,1.0);gl_Position=u_coord_matrix*vec4(projected_pos.xy/projected_pos.w+rotation_matrix*(a_offset/32.0*fontScale+a_pxoffset),0.0,1.0);float gamma_scale=gl_Position.w;vec2 fade_opacity=unpack_opacity(a_fade_opacity);float fade_change=fade_opacity[1] > 0.5 ? u_fade_change :-u_fade_change;float interpolated_fade_opacity=max(0.0,min(1.0,fade_opacity[0]+fade_change));v_data0=a_tex/u_texsize;v_data1=vec3(gamma_scale,size,interpolated_fade_opacity);}"),di=_i("#define SDF_PX 8.0\n#define SDF 1.0\n#define ICON 0.0\nuniform bool u_is_halo;uniform sampler2D u_texture;uniform sampler2D u_texture_icon;uniform highp float u_gamma_scale;uniform lowp float u_device_pixel_ratio;varying vec4 v_data0;varying vec4 v_data1;\n#pragma mapbox: define highp vec4 fill_color\n#pragma mapbox: define highp vec4 halo_color\n#pragma mapbox: define lowp float opacity\n#pragma mapbox: define lowp float halo_width\n#pragma mapbox: define lowp float halo_blur\nvoid main() {\n#pragma mapbox: initialize highp vec4 fill_color\n#pragma mapbox: initialize highp vec4 halo_color\n#pragma mapbox: initialize lowp float opacity\n#pragma mapbox: initialize lowp float halo_width\n#pragma mapbox: initialize lowp float halo_blur\nfloat fade_opacity=v_data1[2];if (v_data1.w==ICON) {vec2 tex_icon=v_data0.zw;lowp float alpha=opacity*fade_opacity;gl_FragColor=texture2D(u_texture_icon,tex_icon)*alpha;\n#ifdef OVERDRAW_INSPECTOR\ngl_FragColor=vec4(1.0);\n#endif\nreturn;}vec2 tex=v_data0.xy;float EDGE_GAMMA=0.105/u_device_pixel_ratio;float gamma_scale=v_data1.x;float size=v_data1.y;float fontScale=size/24.0;lowp vec4 color=fill_color;highp float gamma=EDGE_GAMMA/(fontScale*u_gamma_scale);lowp float buff=(256.0-64.0)/256.0;if (u_is_halo) {color=halo_color;gamma=(halo_blur*1.19/SDF_PX+EDGE_GAMMA)/(fontScale*u_gamma_scale);buff=(6.0-halo_width/fontScale)/SDF_PX;}lowp float dist=texture2D(u_texture,tex).a;highp float gamma_scaled=gamma*gamma_scale;highp float alpha=smoothstep(buff-gamma_scaled,buff+gamma_scaled,dist);gl_FragColor=color*(alpha*opacity*fade_opacity);\n#ifdef OVERDRAW_INSPECTOR\ngl_FragColor=vec4(1.0);\n#endif\n}","const float PI=3.141592653589793;attribute vec4 a_pos_offset;attribute vec4 a_data;attribute vec3 a_projected_pos;attribute float a_fade_opacity;uniform bool u_is_size_zoom_constant;uniform bool u_is_size_feature_constant;uniform highp float u_size_t;uniform highp float u_size;uniform mat4 u_matrix;uniform mat4 u_label_plane_matrix;uniform mat4 u_coord_matrix;uniform bool u_is_text;uniform bool u_pitch_with_map;uniform highp float u_pitch;uniform bool u_rotate_symbol;uniform highp float u_aspect_ratio;uniform highp float u_camera_to_center_distance;uniform float u_fade_change;uniform vec2 u_texsize;uniform vec2 u_texsize_icon;varying vec4 v_data0;varying vec4 v_data1;\n#pragma mapbox: define highp vec4 fill_color\n#pragma mapbox: define highp vec4 halo_color\n#pragma mapbox: define lowp float opacity\n#pragma mapbox: define lowp float halo_width\n#pragma mapbox: define lowp float halo_blur\nvoid main() {\n#pragma mapbox: initialize highp vec4 fill_color\n#pragma mapbox: initialize highp vec4 halo_color\n#pragma mapbox: initialize lowp float opacity\n#pragma mapbox: initialize lowp float halo_width\n#pragma mapbox: initialize lowp float halo_blur\nvec2 a_pos=a_pos_offset.xy;vec2 a_offset=a_pos_offset.zw;vec2 a_tex=a_data.xy;vec2 a_size=a_data.zw;float a_size_min=floor(a_size[0]*0.5);float is_sdf=a_size[0]-2.0*a_size_min;highp float segment_angle=-a_projected_pos[2];float size;if (!u_is_size_zoom_constant && !u_is_size_feature_constant) {size=mix(a_size_min,a_size[1],u_size_t)/128.0;} else if (u_is_size_zoom_constant && !u_is_size_feature_constant) {size=a_size_min/128.0;} else {size=u_size;}vec4 projectedPoint=u_matrix*vec4(a_pos,0,1);highp float camera_to_anchor_distance=projectedPoint.w;highp float distance_ratio=u_pitch_with_map ?\ncamera_to_anchor_distance/u_camera_to_center_distance :\nu_camera_to_center_distance/camera_to_anchor_distance;highp float perspective_ratio=clamp(0.5+0.5*distance_ratio,0.0,4.0);size*=perspective_ratio;float fontScale=size/24.0;highp float symbol_rotation=0.0;if (u_rotate_symbol) {vec4 offsetProjectedPoint=u_matrix*vec4(a_pos+vec2(1,0),0,1);vec2 a=projectedPoint.xy/projectedPoint.w;vec2 b=offsetProjectedPoint.xy/offsetProjectedPoint.w;symbol_rotation=atan((b.y-a.y)/u_aspect_ratio,b.x-a.x);}highp float angle_sin=sin(segment_angle+symbol_rotation);highp float angle_cos=cos(segment_angle+symbol_rotation);mat2 rotation_matrix=mat2(angle_cos,-1.0*angle_sin,angle_sin,angle_cos);vec4 projected_pos=u_label_plane_matrix*vec4(a_projected_pos.xy,0.0,1.0);gl_Position=u_coord_matrix*vec4(projected_pos.xy/projected_pos.w+rotation_matrix*(a_offset/32.0*fontScale),0.0,1.0);float gamma_scale=gl_Position.w;vec2 fade_opacity=unpack_opacity(a_fade_opacity);float fade_change=fade_opacity[1] > 0.5 ? u_fade_change :-u_fade_change;float interpolated_fade_opacity=max(0.0,min(1.0,fade_opacity[0]+fade_change));v_data0.xy=a_tex/u_texsize;v_data0.zw=a_tex/u_texsize_icon;v_data1=vec4(gamma_scale,size,interpolated_fade_opacity,is_sdf);}");function _i(t,e){var i=/#pragma mapbox: ([\w]+) ([\w]+) ([\w]+) ([\w]+)/g,o={};return {fragmentSource:t=t.replace(i,(function(t,e,i,r,a){return o[a]=!0,"define"===e?"\n#ifndef HAS_UNIFORM_u_"+a+"\nvarying "+i+" "+r+" "+a+";\n#else\nuniform "+i+" "+r+" u_"+a+";\n#endif\n":"\n#ifdef HAS_UNIFORM_u_"+a+"\n    "+i+" "+r+" "+a+" = u_"+a+";\n#endif\n"})),vertexSource:e=e.replace(i,(function(t,e,i,r,a){var n="float"===r?"vec2":"vec4",s=a.match(/color/)?"color":n;return o[a]?"define"===e?"\n#ifndef HAS_UNIFORM_u_"+a+"\nuniform lowp float u_"+a+"_t;\nattribute "+i+" "+n+" a_"+a+";\nvarying "+i+" "+r+" "+a+";\n#else\nuniform "+i+" "+r+" u_"+a+";\n#endif\n":"vec4"===s?"\n#ifndef HAS_UNIFORM_u_"+a+"\n    "+a+" = a_"+a+";\n#else\n    "+i+" "+r+" "+a+" = u_"+a+";\n#endif\n":"\n#ifndef HAS_UNIFORM_u_"+a+"\n    "+a+" = unpack_mix_"+s+"(a_"+a+", u_"+a+"_t);\n#else\n    "+i+" "+r+" "+a+" = u_"+a+";\n#endif\n":"define"===e?"\n#ifndef HAS_UNIFORM_u_"+a+"\nuniform lowp float u_"+a+"_t;\nattribute "+i+" "+n+" a_"+a+";\n#else\nuniform "+i+" "+r+" u_"+a+";\n#endif\n":"vec4"===s?"\n#ifndef HAS_UNIFORM_u_"+a+"\n    "+i+" "+r+" "+a+" = a_"+a+";\n#else\n    "+i+" "+r+" "+a+" = u_"+a+";\n#endif\n":"\n#ifndef HAS_UNIFORM_u_"+a+"\n    "+i+" "+r+" "+a+" = unpack_mix_"+s+"(a_"+a+", u_"+a+"_t);\n#else\n    "+i+" "+r+" "+a+" = u_"+a+";\n#endif\n"}))}}var fi=Object.freeze({__proto__:null,prelude:qe,background:je,backgroundPattern:Ve,circle:Ge,clippingMask:We,heatmap:Xe,heatmapTexture:He,collisionBox:Ke,collisionCircle:Ye,debug:Je,fill:Qe,fillOutline:$e,fillOutlinePattern:ti,fillPattern:ei,fillExtrusion:ii,fillExtrusionPattern:oi,hillshadePrepare:ri,hillshade:ai,line:ni,lineGradient:si,linePattern:li,lineSDF:ci,raster:ui,symbolIcon:hi,symbolSDF:pi,symbolTextAndIcon:di}),mi=function(){this.boundProgram=null,this.boundLayoutVertexBuffer=null,this.boundPaintVertexBuffers=[],this.boundIndexBuffer=null,this.boundVertexOffset=null,this.boundDynamicVertexBuffer=null,this.vao=null;};mi.prototype.bind=function(t,e,i,o,r,a,n,s){this.context=t;for(var l=this.boundPaintVertexBuffers.length!==o.length,c=0;!l&&c<o.length;c++)this.boundPaintVertexBuffers[c]!==o[c]&&(l=!0);t.extVertexArrayObject&&this.vao&&this.boundProgram===e&&this.boundLayoutVertexBuffer===i&&!l&&this.boundIndexBuffer===r&&this.boundVertexOffset===a&&this.boundDynamicVertexBuffer===n&&this.boundDynamicVertexBuffer2===s?(t.bindVertexArrayOES.set(this.vao),n&&n.bind(),r&&r.dynamicDraw&&r.bind(),s&&s.bind()):this.freshBind(e,i,o,r,a,n,s);},mi.prototype.freshBind=function(t,e,i,o,r,a,n){var s,l=t.numAttributes,c=this.context,u=c.gl;if(c.extVertexArrayObject)this.vao&&this.destroy(),this.vao=c.extVertexArrayObject.createVertexArrayOES(),c.bindVertexArrayOES.set(this.vao),s=0,this.boundProgram=t,this.boundLayoutVertexBuffer=e,this.boundPaintVertexBuffers=i,this.boundIndexBuffer=o,this.boundVertexOffset=r,this.boundDynamicVertexBuffer=a,this.boundDynamicVertexBuffer2=n;else{s=c.currentNumAttributes||0;for(var h=l;h<s;h++)u.disableVertexAttribArray(h);}e.enableAttributes(u,t);for(var p=0,d=i;p<d.length;p+=1)d[p].enableAttributes(u,t);a&&a.enableAttributes(u,t),n&&n.enableAttributes(u,t),e.bind(),e.setVertexAttribPointers(u,t,r);for(var _=0,f=i;_<f.length;_+=1){var m=f[_];m.bind(),m.setVertexAttribPointers(u,t,r);}a&&(a.bind(),a.setVertexAttribPointers(u,t,r)),o&&o.bind(),n&&(n.bind(),n.setVertexAttribPointers(u,t,r)),c.currentNumAttributes=l;},mi.prototype.destroy=function(){this.vao&&(this.context.extVertexArrayObject.deleteVertexArrayOES(this.vao),this.vao=null);};var gi=function(t,e,i,o,r){var a=t.gl;this.program=a.createProgram();var n=i?i.defines():[];r&&n.push("#define OVERDRAW_INSPECTOR;");var s=n.concat(qe.fragmentSource,e.fragmentSource).join("\n"),l=n.concat(qe.vertexSource,e.vertexSource).join("\n"),c=a.createShader(a.FRAGMENT_SHADER);if(a.isContextLost())this.failedToCreate=!0;else{a.shaderSource(c,s),a.compileShader(c),a.attachShader(this.program,c);var u=a.createShader(a.VERTEX_SHADER);if(a.isContextLost())this.failedToCreate=!0;else{a.shaderSource(u,l),a.compileShader(u),a.attachShader(this.program,u);for(var h=i?i.layoutAttributes:[],p=0;p<h.length;p++)a.bindAttribLocation(this.program,p,h[p].name);a.linkProgram(this.program),this.numAttributes=a.getProgramParameter(this.program,a.ACTIVE_ATTRIBUTES),this.attributes={};for(var d={},_=0;_<this.numAttributes;_++){var f=a.getActiveAttrib(this.program,_);f&&(this.attributes[f.name]=a.getAttribLocation(this.program,f.name));}for(var m=a.getProgramParameter(this.program,a.ACTIVE_UNIFORMS),g=0;g<m;g++){var v=a.getActiveUniform(this.program,g);v&&(d[v.name]=a.getUniformLocation(this.program,v.name));}this.fixedUniforms=o(t,d),this.binderUniforms=i?i.getUniforms(t,d):[];}}};function vi(t,e,i){var o=1/ue(i,1,e.transform.tileZoom),r=Math.pow(2,i.tileID.overscaledZ),a=i.tileSize*Math.pow(2,e.transform.tileZoom)/r,n=a*(i.tileID.canonical.x+i.tileID.wrap*r),s=a*i.tileID.canonical.y;return {u_image:0,u_texsize:i.imageAtlasTexture.size,u_scale:[o,t.fromScale,t.toScale],u_fade:t.t,u_pixel_coord_upper:[n>>16,s>>16],u_pixel_coord_lower:[65535&n,65535&s]}}gi.prototype.draw=function(t,e,i,o,r,a,n,s,l,c,u,h,p,d,_,f){var m,g=t.gl;if(!this.failedToCreate){for(var v in t.program.set(this.program),t.setDepthMode(i),t.setStencilMode(o),t.setColorMode(r),t.setCullFace(a),this.fixedUniforms)this.fixedUniforms[v].set(n[v]);d&&d.setUniforms(t,this.binderUniforms,h,{zoom:p});for(var y=(m={},m[g.LINES]=2,m[g.TRIANGLES]=3,m[g.LINE_STRIP]=1,m)[e],x=0,b=u.get();x<b.length;x+=1){var w=b[x],E=w.vaos||(w.vaos={});(E[s]||(E[s]=new mi)).bind(t,this,l,d?d.getPaintVertexBuffers():[],c,w.vertexOffset,_,f),g.drawElements(e,w.primitiveLength*y,g.UNSIGNED_SHORT,w.primitiveOffset*y*2);}}};var yi=function(e,i,o,r){var a=i.style.light,n=a.properties.get("position"),s=[n.x,n.y,n.z],l=t.create$1();"viewport"===a.properties.get("anchor")&&t.fromRotation(l,-i.transform.angle),t.transformMat3(s,s,l);var c=a.properties.get("color");return {u_matrix:e,u_lightpos:s,u_lightintensity:a.properties.get("intensity"),u_lightcolor:[c.r,c.g,c.b],u_vertical_gradient:+o,u_opacity:r}},xi=function(e,i,o,r,a,n,s){return t.extend(yi(e,i,o,r),vi(n,i,s),{u_height_factor:-Math.pow(2,a.overscaledZ)/s.tileSize/8})},bi=function(t){return {u_matrix:t}},wi=function(e,i,o,r){return t.extend(bi(e),vi(o,i,r))},Ei=function(t,e){return {u_matrix:t,u_world:e}},Ti=function(e,i,o,r,a){return t.extend(wi(e,i,o,r),{u_world:a})},Ii=function(e,i,o,r){var a,n,s=e.transform;if("map"===r.paint.get("circle-pitch-alignment")){var l=ue(o,1,s.zoom);a=!0,n=[l,l];}else a=!1,n=s.pixelsToGLUnits;return {u_camera_to_center_distance:s.cameraToCenterDistance,u_scale_with_map:+("map"===r.paint.get("circle-pitch-scale")),u_matrix:e.translatePosMatrix(i.posMatrix,o,r.paint.get("circle-translate"),r.paint.get("circle-translate-anchor")),u_pitch_with_map:+a,u_device_pixel_ratio:t.browser.devicePixelRatio,u_extrude_scale:n}},Ci=function(e,i){return {u_matrix:new t.UniformMatrix4f(e,i.u_matrix),u_camera_to_center_distance:new t.Uniform1f(e,i.u_camera_to_center_distance),u_pixels_to_tile_units:new t.Uniform1f(e,i.u_pixels_to_tile_units),u_extrude_scale:new t.Uniform2f(e,i.u_extrude_scale),u_overscale_factor:new t.Uniform1f(e,i.u_overscale_factor)}},Si=function(t,e,i){var o=ue(i,1,e.zoom),r=Math.pow(2,e.zoom-i.tileID.overscaledZ),a=i.tileID.overscaleFactor();return {u_matrix:t,u_camera_to_center_distance:e.cameraToCenterDistance,u_pixels_to_tile_units:o,u_extrude_scale:[e.pixelsToGLUnits[0]/(o*r),e.pixelsToGLUnits[1]/(o*r)],u_overscale_factor:a}},Pi=function(t,e,i){return void 0===i&&(i=1),{u_matrix:t,u_color:e,u_overlay:0,u_overlay_scale:i}},zi=function(t){return {u_matrix:t}},Li=function(t,e,i,o){return {u_matrix:t,u_extrude_scale:ue(e,1,i),u_intensity:o}},Mi=function(e,i,o){var r=o.paint.get("hillshade-shadow-color"),a=o.paint.get("hillshade-highlight-color"),n=o.paint.get("hillshade-accent-color"),s=o.paint.get("hillshade-illumination-direction")*(Math.PI/180);"viewport"===o.paint.get("hillshade-illumination-anchor")&&(s-=e.transform.angle);var l,c,u,h=!e.options.moving;return {u_matrix:e.transform.calculatePosMatrix(i.tileID.toUnwrapped(),h),u_image:0,u_latrange:(l=i.tileID,c=Math.pow(2,l.canonical.z),u=l.canonical.y,[new t.MercatorCoordinate(0,u/c).toLngLat().lat,new t.MercatorCoordinate(0,(u+1)/c).toLngLat().lat]),u_light:[o.paint.get("hillshade-exaggeration"),s],u_shadow:r,u_highlight:a,u_accent:n}},Di=function(e,i,o){var r=i.stride,a=t.create();return t.ortho(a,0,t.EXTENT,-t.EXTENT,0,0,1),t.translate(a,a,[0,-t.EXTENT,0]),{u_matrix:a,u_image:1,u_dimension:[r,r],u_zoom:e.overscaledZ,u_maxzoom:o,u_unpack:i.getUnpackVector()}},Ai=function(e,i,o){var r=e.transform;return {u_matrix:Fi(e,i,o),u_ratio:1/ue(i,1,r.zoom),u_device_pixel_ratio:t.browser.devicePixelRatio,u_units_to_pixels:[1/r.pixelsToGLUnits[0],1/r.pixelsToGLUnits[1]]}},Ri=function(e,i,o){return t.extend(Ai(e,i,o),{u_image:0})},ki=function(e,i,o,r){var a=e.transform,n=Oi(i,a);return {u_matrix:Fi(e,i,o),u_texsize:i.imageAtlasTexture.size,u_ratio:1/ue(i,1,a.zoom),u_device_pixel_ratio:t.browser.devicePixelRatio,u_image:0,u_scale:[n,r.fromScale,r.toScale],u_fade:r.t,u_units_to_pixels:[1/a.pixelsToGLUnits[0],1/a.pixelsToGLUnits[1]]}},Bi=function(e,i,o,r,a){var n=e.lineAtlas,s=Oi(i,e.transform),l="round"===o.layout.get("line-cap"),c=n.getDash(r.from,l),u=n.getDash(r.to,l),h=c.width*a.fromScale,p=u.width*a.toScale;return t.extend(Ai(e,i,o),{u_patternscale_a:[s/h,-c.height/2],u_patternscale_b:[s/p,-u.height/2],u_sdfgamma:n.width/(256*Math.min(h,p)*t.browser.devicePixelRatio)/2,u_image:0,u_tex_y_a:c.y,u_tex_y_b:u.y,u_mix:a.t})};function Oi(t,e){return 1/ue(t,1,e.tileZoom)}function Fi(t,e,i){return t.translatePosMatrix(e.tileID.posMatrix,e,i.paint.get("line-translate"),i.paint.get("line-translate-anchor"))}var Ui=function(t,e,i,o,r){return {u_matrix:t,u_tl_parent:e,u_scale_parent:i,u_buffer_scale:1,u_fade_t:o.mix,u_opacity:o.opacity*r.paint.get("raster-opacity"),u_image0:0,u_image1:1,u_brightness_low:r.paint.get("raster-brightness-min"),u_brightness_high:r.paint.get("raster-brightness-max"),u_saturation_factor:(n=r.paint.get("raster-saturation"),n>0?1-1/(1.001-n):-n),u_contrast_factor:(a=r.paint.get("raster-contrast"),a>0?1/(1-a):1+a),u_spin_weights:Ni(r.paint.get("raster-hue-rotate"))};var a,n;};function Ni(t){t*=Math.PI/180;var e=Math.sin(t),i=Math.cos(t);return [(2*i+1)/3,(-Math.sqrt(3)*e-i+1)/3,(Math.sqrt(3)*e-i+1)/3]}var Zi=function(t,e,i,o,r,a,n,s,l,c){var u=r.transform;return {u_is_size_zoom_constant:+("constant"===t||"source"===t),u_is_size_feature_constant:+("constant"===t||"camera"===t),u_size_t:e?e.uSizeT:0,u_size:e?e.uSize:0,u_camera_to_center_distance:u.cameraToCenterDistance,u_pitch:u.pitch/360*2*Math.PI,u_rotate_symbol:+i,u_aspect_ratio:u.width/u.height,u_fade_change:r.options.fadeDuration?r.symbolFadeChange:1,u_matrix:a,u_label_plane_matrix:n,u_coord_matrix:s,u_is_text:+l,u_pitch_with_map:+o,u_texsize:c,u_texture:0}},qi=function(e,i,o,r,a,n,s,l,c,u,h){var p=a.transform;return t.extend(Zi(e,i,o,r,a,n,s,l,c,u),{u_gamma_scale:r?Math.cos(p._pitch)*p.cameraToCenterDistance:1,u_device_pixel_ratio:t.browser.devicePixelRatio,u_is_halo:+h})},ji=function(e,i,o,r,a,n,s,l,c,u){return t.extend(qi(e,i,o,r,a,n,s,l,!0,c,!0),{u_texsize_icon:u,u_texture_icon:1})},Vi=function(t,e,i){return {u_matrix:t,u_opacity:e,u_color:i}},Gi=function(e,i,o,r,a,n){return t.extend(function(t,e,i,o){var r=i.imageManager.getPattern(t.from.toString()),a=i.imageManager.getPattern(t.to.toString()),n=i.imageManager.getPixelSize(),s=n.width,l=n.height,c=Math.pow(2,o.tileID.overscaledZ),u=o.tileSize*Math.pow(2,i.transform.tileZoom)/c,h=u*(o.tileID.canonical.x+o.tileID.wrap*c),p=u*o.tileID.canonical.y;return {u_image:0,u_pattern_tl_a:r.tl,u_pattern_br_a:r.br,u_pattern_tl_b:a.tl,u_pattern_br_b:a.br,u_texsize:[s,l],u_mix:e.t,u_pattern_size_a:r.displaySize,u_pattern_size_b:a.displaySize,u_scale_a:e.fromScale,u_scale_b:e.toScale,u_tile_units_to_pixels:1/ue(o,1,i.transform.tileZoom),u_pixel_coord_upper:[h>>16,p>>16],u_pixel_coord_lower:[65535&h,65535&p]}}(r,n,o,a),{u_matrix:e,u_opacity:i})},Wi={fillExtrusion:function(e,i){return {u_matrix:new t.UniformMatrix4f(e,i.u_matrix),u_lightpos:new t.Uniform3f(e,i.u_lightpos),u_lightintensity:new t.Uniform1f(e,i.u_lightintensity),u_lightcolor:new t.Uniform3f(e,i.u_lightcolor),u_vertical_gradient:new t.Uniform1f(e,i.u_vertical_gradient),u_opacity:new t.Uniform1f(e,i.u_opacity)}},fillExtrusionPattern:function(e,i){return {u_matrix:new t.UniformMatrix4f(e,i.u_matrix),u_lightpos:new t.Uniform3f(e,i.u_lightpos),u_lightintensity:new t.Uniform1f(e,i.u_lightintensity),u_lightcolor:new t.Uniform3f(e,i.u_lightcolor),u_vertical_gradient:new t.Uniform1f(e,i.u_vertical_gradient),u_height_factor:new t.Uniform1f(e,i.u_height_factor),u_image:new t.Uniform1i(e,i.u_image),u_texsize:new t.Uniform2f(e,i.u_texsize),u_pixel_coord_upper:new t.Uniform2f(e,i.u_pixel_coord_upper),u_pixel_coord_lower:new t.Uniform2f(e,i.u_pixel_coord_lower),u_scale:new t.Uniform3f(e,i.u_scale),u_fade:new t.Uniform1f(e,i.u_fade),u_opacity:new t.Uniform1f(e,i.u_opacity)}},fill:function(e,i){return {u_matrix:new t.UniformMatrix4f(e,i.u_matrix)}},fillPattern:function(e,i){return {u_matrix:new t.UniformMatrix4f(e,i.u_matrix),u_image:new t.Uniform1i(e,i.u_image),u_texsize:new t.Uniform2f(e,i.u_texsize),u_pixel_coord_upper:new t.Uniform2f(e,i.u_pixel_coord_upper),u_pixel_coord_lower:new t.Uniform2f(e,i.u_pixel_coord_lower),u_scale:new t.Uniform3f(e,i.u_scale),u_fade:new t.Uniform1f(e,i.u_fade)}},fillOutline:function(e,i){return {u_matrix:new t.UniformMatrix4f(e,i.u_matrix),u_world:new t.Uniform2f(e,i.u_world)}},fillOutlinePattern:function(e,i){return {u_matrix:new t.UniformMatrix4f(e,i.u_matrix),u_world:new t.Uniform2f(e,i.u_world),u_image:new t.Uniform1i(e,i.u_image),u_texsize:new t.Uniform2f(e,i.u_texsize),u_pixel_coord_upper:new t.Uniform2f(e,i.u_pixel_coord_upper),u_pixel_coord_lower:new t.Uniform2f(e,i.u_pixel_coord_lower),u_scale:new t.Uniform3f(e,i.u_scale),u_fade:new t.Uniform1f(e,i.u_fade)}},circle:function(e,i){return {u_camera_to_center_distance:new t.Uniform1f(e,i.u_camera_to_center_distance),u_scale_with_map:new t.Uniform1i(e,i.u_scale_with_map),u_pitch_with_map:new t.Uniform1i(e,i.u_pitch_with_map),u_extrude_scale:new t.Uniform2f(e,i.u_extrude_scale),u_device_pixel_ratio:new t.Uniform1f(e,i.u_device_pixel_ratio),u_matrix:new t.UniformMatrix4f(e,i.u_matrix)}},collisionBox:Ci,collisionCircle:Ci,debug:function(e,i){return {u_color:new t.UniformColor(e,i.u_color),u_matrix:new t.UniformMatrix4f(e,i.u_matrix),u_overlay:new t.Uniform1i(e,i.u_overlay),u_overlay_scale:new t.Uniform1f(e,i.u_overlay_scale)}},clippingMask:function(e,i){return {u_matrix:new t.UniformMatrix4f(e,i.u_matrix)}},heatmap:function(e,i){return {u_extrude_scale:new t.Uniform1f(e,i.u_extrude_scale),u_intensity:new t.Uniform1f(e,i.u_intensity),u_matrix:new t.UniformMatrix4f(e,i.u_matrix)}},heatmapTexture:function(e,i){return {u_matrix:new t.UniformMatrix4f(e,i.u_matrix),u_world:new t.Uniform2f(e,i.u_world),u_image:new t.Uniform1i(e,i.u_image),u_color_ramp:new t.Uniform1i(e,i.u_color_ramp),u_opacity:new t.Uniform1f(e,i.u_opacity)}},hillshade:function(e,i){return {u_matrix:new t.UniformMatrix4f(e,i.u_matrix),u_image:new t.Uniform1i(e,i.u_image),u_latrange:new t.Uniform2f(e,i.u_latrange),u_light:new t.Uniform2f(e,i.u_light),u_shadow:new t.UniformColor(e,i.u_shadow),u_highlight:new t.UniformColor(e,i.u_highlight),u_accent:new t.UniformColor(e,i.u_accent)}},hillshadePrepare:function(e,i){return {u_matrix:new t.UniformMatrix4f(e,i.u_matrix),u_image:new t.Uniform1i(e,i.u_image),u_dimension:new t.Uniform2f(e,i.u_dimension),u_zoom:new t.Uniform1f(e,i.u_zoom),u_maxzoom:new t.Uniform1f(e,i.u_maxzoom),u_unpack:new t.Uniform4f(e,i.u_unpack)}},line:function(e,i){return {u_matrix:new t.UniformMatrix4f(e,i.u_matrix),u_ratio:new t.Uniform1f(e,i.u_ratio),u_device_pixel_ratio:new t.Uniform1f(e,i.u_device_pixel_ratio),u_units_to_pixels:new t.Uniform2f(e,i.u_units_to_pixels)}},lineGradient:function(e,i){return {u_matrix:new t.UniformMatrix4f(e,i.u_matrix),u_ratio:new t.Uniform1f(e,i.u_ratio),u_device_pixel_ratio:new t.Uniform1f(e,i.u_device_pixel_ratio),u_units_to_pixels:new t.Uniform2f(e,i.u_units_to_pixels),u_image:new t.Uniform1i(e,i.u_image)}},linePattern:function(e,i){return {u_matrix:new t.UniformMatrix4f(e,i.u_matrix),u_texsize:new t.Uniform2f(e,i.u_texsize),u_ratio:new t.Uniform1f(e,i.u_ratio),u_device_pixel_ratio:new t.Uniform1f(e,i.u_device_pixel_ratio),u_image:new t.Uniform1i(e,i.u_image),u_units_to_pixels:new t.Uniform2f(e,i.u_units_to_pixels),u_scale:new t.Uniform3f(e,i.u_scale),u_fade:new t.Uniform1f(e,i.u_fade)}},lineSDF:function(e,i){return {u_matrix:new t.UniformMatrix4f(e,i.u_matrix),u_ratio:new t.Uniform1f(e,i.u_ratio),u_device_pixel_ratio:new t.Uniform1f(e,i.u_device_pixel_ratio),u_units_to_pixels:new t.Uniform2f(e,i.u_units_to_pixels),u_patternscale_a:new t.Uniform2f(e,i.u_patternscale_a),u_patternscale_b:new t.Uniform2f(e,i.u_patternscale_b),u_sdfgamma:new t.Uniform1f(e,i.u_sdfgamma),u_image:new t.Uniform1i(e,i.u_image),u_tex_y_a:new t.Uniform1f(e,i.u_tex_y_a),u_tex_y_b:new t.Uniform1f(e,i.u_tex_y_b),u_mix:new t.Uniform1f(e,i.u_mix)}},raster:function(e,i){return {u_matrix:new t.UniformMatrix4f(e,i.u_matrix),u_tl_parent:new t.Uniform2f(e,i.u_tl_parent),u_scale_parent:new t.Uniform1f(e,i.u_scale_parent),u_buffer_scale:new t.Uniform1f(e,i.u_buffer_scale),u_fade_t:new t.Uniform1f(e,i.u_fade_t),u_opacity:new t.Uniform1f(e,i.u_opacity),u_image0:new t.Uniform1i(e,i.u_image0),u_image1:new t.Uniform1i(e,i.u_image1),u_brightness_low:new t.Uniform1f(e,i.u_brightness_low),u_brightness_high:new t.Uniform1f(e,i.u_brightness_high),u_saturation_factor:new t.Uniform1f(e,i.u_saturation_factor),u_contrast_factor:new t.Uniform1f(e,i.u_contrast_factor),u_spin_weights:new t.Uniform3f(e,i.u_spin_weights)}},symbolIcon:function(e,i){return {u_is_size_zoom_constant:new t.Uniform1i(e,i.u_is_size_zoom_constant),u_is_size_feature_constant:new t.Uniform1i(e,i.u_is_size_feature_constant),u_size_t:new t.Uniform1f(e,i.u_size_t),u_size:new t.Uniform1f(e,i.u_size),u_camera_to_center_distance:new t.Uniform1f(e,i.u_camera_to_center_distance),u_pitch:new t.Uniform1f(e,i.u_pitch),u_rotate_symbol:new t.Uniform1i(e,i.u_rotate_symbol),u_aspect_ratio:new t.Uniform1f(e,i.u_aspect_ratio),u_fade_change:new t.Uniform1f(e,i.u_fade_change),u_matrix:new t.UniformMatrix4f(e,i.u_matrix),u_label_plane_matrix:new t.UniformMatrix4f(e,i.u_label_plane_matrix),u_coord_matrix:new t.UniformMatrix4f(e,i.u_coord_matrix),u_is_text:new t.Uniform1i(e,i.u_is_text),u_pitch_with_map:new t.Uniform1i(e,i.u_pitch_with_map),u_texsize:new t.Uniform2f(e,i.u_texsize),u_texture:new t.Uniform1i(e,i.u_texture)}},symbolSDF:function(e,i){return {u_is_size_zoom_constant:new t.Uniform1i(e,i.u_is_size_zoom_constant),u_is_size_feature_constant:new t.Uniform1i(e,i.u_is_size_feature_constant),u_size_t:new t.Uniform1f(e,i.u_size_t),u_size:new t.Uniform1f(e,i.u_size),u_camera_to_center_distance:new t.Uniform1f(e,i.u_camera_to_center_distance),u_pitch:new t.Uniform1f(e,i.u_pitch),u_rotate_symbol:new t.Uniform1i(e,i.u_rotate_symbol),u_aspect_ratio:new t.Uniform1f(e,i.u_aspect_ratio),u_fade_change:new t.Uniform1f(e,i.u_fade_change),u_matrix:new t.UniformMatrix4f(e,i.u_matrix),u_label_plane_matrix:new t.UniformMatrix4f(e,i.u_label_plane_matrix),u_coord_matrix:new t.UniformMatrix4f(e,i.u_coord_matrix),u_is_text:new t.Uniform1i(e,i.u_is_text),u_pitch_with_map:new t.Uniform1i(e,i.u_pitch_with_map),u_texsize:new t.Uniform2f(e,i.u_texsize),u_texture:new t.Uniform1i(e,i.u_texture),u_gamma_scale:new t.Uniform1f(e,i.u_gamma_scale),u_device_pixel_ratio:new t.Uniform1f(e,i.u_device_pixel_ratio),u_is_halo:new t.Uniform1i(e,i.u_is_halo)}},symbolTextAndIcon:function(e,i){return {u_is_size_zoom_constant:new t.Uniform1i(e,i.u_is_size_zoom_constant),u_is_size_feature_constant:new t.Uniform1i(e,i.u_is_size_feature_constant),u_size_t:new t.Uniform1f(e,i.u_size_t),u_size:new t.Uniform1f(e,i.u_size),u_camera_to_center_distance:new t.Uniform1f(e,i.u_camera_to_center_distance),u_pitch:new t.Uniform1f(e,i.u_pitch),u_rotate_symbol:new t.Uniform1i(e,i.u_rotate_symbol),u_aspect_ratio:new t.Uniform1f(e,i.u_aspect_ratio),u_fade_change:new t.Uniform1f(e,i.u_fade_change),u_matrix:new t.UniformMatrix4f(e,i.u_matrix),u_label_plane_matrix:new t.UniformMatrix4f(e,i.u_label_plane_matrix),u_coord_matrix:new t.UniformMatrix4f(e,i.u_coord_matrix),u_is_text:new t.Uniform1i(e,i.u_is_text),u_pitch_with_map:new t.Uniform1i(e,i.u_pitch_with_map),u_texsize:new t.Uniform2f(e,i.u_texsize),u_texsize_icon:new t.Uniform2f(e,i.u_texsize_icon),u_texture:new t.Uniform1i(e,i.u_texture),u_texture_icon:new t.Uniform1i(e,i.u_texture_icon),u_gamma_scale:new t.Uniform1f(e,i.u_gamma_scale),u_device_pixel_ratio:new t.Uniform1f(e,i.u_device_pixel_ratio),u_is_halo:new t.Uniform1i(e,i.u_is_halo)}},background:function(e,i){return {u_matrix:new t.UniformMatrix4f(e,i.u_matrix),u_opacity:new t.Uniform1f(e,i.u_opacity),u_color:new t.UniformColor(e,i.u_color)}},backgroundPattern:function(e,i){return {u_matrix:new t.UniformMatrix4f(e,i.u_matrix),u_opacity:new t.Uniform1f(e,i.u_opacity),u_image:new t.Uniform1i(e,i.u_image),u_pattern_tl_a:new t.Uniform2f(e,i.u_pattern_tl_a),u_pattern_br_a:new t.Uniform2f(e,i.u_pattern_br_a),u_pattern_tl_b:new t.Uniform2f(e,i.u_pattern_tl_b),u_pattern_br_b:new t.Uniform2f(e,i.u_pattern_br_b),u_texsize:new t.Uniform2f(e,i.u_texsize),u_mix:new t.Uniform1f(e,i.u_mix),u_pattern_size_a:new t.Uniform2f(e,i.u_pattern_size_a),u_pattern_size_b:new t.Uniform2f(e,i.u_pattern_size_b),u_scale_a:new t.Uniform1f(e,i.u_scale_a),u_scale_b:new t.Uniform1f(e,i.u_scale_b),u_pixel_coord_upper:new t.Uniform2f(e,i.u_pixel_coord_upper),u_pixel_coord_lower:new t.Uniform2f(e,i.u_pixel_coord_lower),u_tile_units_to_pixels:new t.Uniform1f(e,i.u_tile_units_to_pixels)}}};function Xi(t,e,i,o,r,a,n,s){for(var l=t.context,c=l.gl,u=t.useProgram(r?"collisionCircle":"collisionBox"),h=0;h<o.length;h++){var p=o[h],d=e.getTile(p),_=d.getBucket(i);if(_){var f=r?s?_.textCollisionCircle:_.iconCollisionCircle:s?_.textCollisionBox:_.iconCollisionBox;if(f){var m=p.posMatrix;0===a[0]&&0===a[1]||(m=t.translatePosMatrix(p.posMatrix,d,a,n)),u.draw(l,r?c.TRIANGLES:c.LINES,Ct.disabled,St.disabled,t.colorModeForRenderPass(),zt.disabled,Si(m,t.transform,d),i.id,f.layoutVertexBuffer,f.indexBuffer,f.segments,null,t.transform.zoom,null,null,f.collisionVertexBuffer);}}}}function Hi(t,e,i,o,r,a,n){Xi(t,e,i,o,!1,r,a,n),Xi(t,e,i,o,!0,r,a,n);}var Ki=t.identity(new Float32Array(16));function Yi(e,i,o,r,a,n){var s=t.getAnchorAlignment(e),l=-(s.horizontalAlign-.5)*i,c=-(s.verticalAlign-.5)*o,u=t.evaluateVariableOffset(e,r);return new t.Point((l/a+u[0])*n,(c/a+u[1])*n)}function Ji(e,i,o,r,a,n,s,l,c,u,h){var p=e.text.placedSymbolArray,d=e.text.dynamicLayoutVertexArray,_=e.icon.dynamicLayoutVertexArray,f={};d.clear();for(var m=0;m<p.length;m++){var g=p.get(m),v=g.hidden||!g.crossTileID||e.allowVerticalPlacement&&!g.placedOrientation?null:r[g.crossTileID];if(v){var y=new t.Point(g.anchorX,g.anchorY),x=Jt(y,o?l:s),b=.5+n.cameraToCenterDistance/x.signedDistanceFromCamera*.5,w=a.evaluateSizeForFeature(e.textSizeData,u,g)*b/t.ONE_EM;o&&(w*=e.tilePixelRatio/c);for(var E=Yi(v.anchor,v.width,v.height,v.textOffset,v.textBoxScale,w),T=o?Jt(y.add(E),s).point:x.point.add(i?E.rotate(-n.angle):E),I=e.allowVerticalPlacement&&g.placedOrientation===t.WritingMode.vertical?Math.PI/2:0,C=0;C<g.numGlyphs;C++)t.addDynamicAttributes(d,T,I);h&&g.associatedIconIndex>=0&&(f[g.associatedIconIndex]={shiftedAnchor:T,angle:I});}else ne(g.numGlyphs,d);}if(h){_.clear();for(var S=e.icon.placedSymbolArray,P=0;P<S.length;P++){var z=S.get(P);if(z.hidden)ne(z.numGlyphs,_);else{var L=f[P];if(L)for(var M=0;M<z.numGlyphs;M++)t.addDynamicAttributes(_,L.shiftedAnchor,L.angle);else ne(z.numGlyphs,_);}}e.icon.dynamicLayoutVertexBuffer.updateData(_);}e.text.dynamicLayoutVertexBuffer.updateData(d);}function Qi(t,e,i){return i.iconsInText&&e?"symbolTextAndIcon":t?"symbolSDF":"symbolIcon"}function $i(e,i,o,r,a,n,s,l,c,u,h,p){for(var d,_,f=e.context,m=f.gl,g=e.transform,v="map"===l,y="map"===c,x=v&&"point"!==o.layout.get("symbol-placement"),b=v&&!y&&!x,w=void 0!==o.layout.get("symbol-sort-key").constantOr(1),E=e.depthModeForSublayer(0,Ct.ReadOnly),T=o.layout.get("text-variable-anchor"),I=[],C=0,S=r;C<S.length;C+=1){var P=S[C],z=i.getTile(P),L=z.getBucket(o);if(L){var M=a?L.text:L.icon;if(M&&M.segments.get().length){var D=M.programConfigurations.get(o.id),A=a||L.sdfIcons,R=a?L.textSizeData:L.iconSizeData,k=y||0!==g.pitch;d||(d=e.useProgram(Qi(A,a,L),D),_=t.evaluateSizeForZoom(R,g.zoom));var B=void 0,O=[0,0],F=void 0,U=void 0,N=null,Z=void 0;if(a)F=z.glyphAtlasTexture,U=m.LINEAR,B=z.glyphAtlasTexture.size,L.iconsInText&&(O=z.imageAtlasTexture.size,N=z.imageAtlasTexture,Z=k||e.options.rotating||e.options.zooming||"composite"===R.kind||"camera"===R.kind?m.LINEAR:m.NEAREST);else{var q=1!==o.layout.get("icon-size").constantOr(0)||L.iconsNeedLinear;F=z.imageAtlasTexture,U=A||e.options.rotating||e.options.zooming||q||k?m.LINEAR:m.NEAREST,B=z.imageAtlasTexture.size;}var j=ue(z,1,e.transform.zoom),V=Kt(P.posMatrix,y,v,e.transform,j),G=Yt(P.posMatrix,y,v,e.transform,j),W=T&&L.hasTextData(),X="none"!==o.layout.get("icon-text-fit")&&W&&L.hasIconData();x&&$t(L,P.posMatrix,e,a,V,G,y,u);var H=e.translatePosMatrix(P.posMatrix,z,n,s),K=x||a&&T||X?Ki:V,Y=e.translatePosMatrix(G,z,n,s,!0),J=A&&0!==o.paint.get(a?"text-halo-width":"icon-halo-width").constantOr(1),Q={program:d,buffers:M,uniformValues:A?L.iconsInText?ji(R.kind,_,b,y,e,H,K,Y,B,O):qi(R.kind,_,b,y,e,H,K,Y,a,B,!0):Zi(R.kind,_,b,y,e,H,K,Y,a,B),atlasTexture:F,atlasTextureIcon:N,atlasInterpolation:U,atlasInterpolationIcon:Z,isSDF:A,hasHalo:J};if(w)for(var $=0,tt=M.segments.get();$<tt.length;$+=1){var et=tt[$];I.push({segments:new t.SegmentVector([et]),sortKey:et.sortKey,state:Q});}else I.push({segments:M.segments,sortKey:0,state:Q});}}}w&&I.sort((function(t,e){return t.sortKey-e.sortKey}));for(var it=0,ot=I;it<ot.length;it+=1){var rt=ot[it],at=rt.state;if(f.activeTexture.set(m.TEXTURE0),at.atlasTexture.bind(at.atlasInterpolation,m.CLAMP_TO_EDGE),at.atlasTextureIcon&&(f.activeTexture.set(m.TEXTURE1),at.atlasTextureIcon&&at.atlasTextureIcon.bind(at.atlasInterpolationIcon,m.CLAMP_TO_EDGE)),at.isSDF){var nt=at.uniformValues;at.hasHalo&&(nt.u_is_halo=1,to(at.buffers,rt.segments,o,e,at.program,E,h,p,nt)),nt.u_is_halo=0;}to(at.buffers,rt.segments,o,e,at.program,E,h,p,at.uniformValues);}}function to(t,e,i,o,r,a,n,s,l){var c=o.context;r.draw(c,c.gl.TRIANGLES,a,n,s,zt.disabled,l,i.id,t.layoutVertexBuffer,t.indexBuffer,e,i.paint,o.transform.zoom,t.programConfigurations.get(i.id),t.dynamicLayoutVertexBuffer,t.opacityVertexBuffer);}function eo(t,e,i,o,r,a,n){var s,l,c,u,h,p=t.context.gl,d=i.paint.get("fill-pattern"),_=d&&d.constantOr(1),f=i.getCrossfadeParameters();n?(l=_&&!i.getPaintProperty("fill-outline-color")?"fillOutlinePattern":"fillOutline",s=p.LINES):(l=_?"fillPattern":"fill",s=p.TRIANGLES);for(var m=0,g=o;m<g.length;m+=1){var v=g[m],y=e.getTile(v);if(!_||y.patternsLoaded()){var x=y.getBucket(i);if(x){var b=x.programConfigurations.get(i.id),w=t.useProgram(l,b);_&&(t.context.activeTexture.set(p.TEXTURE0),y.imageAtlasTexture.bind(p.LINEAR,p.CLAMP_TO_EDGE),b.updatePaintBuffers(f));var E=d.constantOr(null);if(E&&y.imageAtlas){var T=y.imageAtlas,I=T.patternPositions[E.to.toString()],C=T.patternPositions[E.from.toString()];I&&C&&b.setConstantPatternPositions(I,C);}var S=t.translatePosMatrix(v.posMatrix,y,i.paint.get("fill-translate"),i.paint.get("fill-translate-anchor"));if(n){u=x.indexBuffer2,h=x.segments2;var P=[p.drawingBufferWidth,p.drawingBufferHeight];c="fillOutlinePattern"===l&&_?Ti(S,t,f,y,P):Ei(S,P);}else u=x.indexBuffer,h=x.segments,c=_?wi(S,t,f,y):bi(S);w.draw(t.context,s,r,t.stencilModeForClipping(v),a,zt.disabled,c,i.id,x.layoutVertexBuffer,u,h,i.paint,t.transform.zoom,b);}}}}function io(t,e,i,o,r,a,n){for(var s=t.context,l=s.gl,c=i.paint.get("fill-extrusion-pattern"),u=c.constantOr(1),h=i.getCrossfadeParameters(),p=i.paint.get("fill-extrusion-opacity"),d=0,_=o;d<_.length;d+=1){var f=_[d],m=e.getTile(f),g=m.getBucket(i);if(g){var v=g.programConfigurations.get(i.id),y=t.useProgram(u?"fillExtrusionPattern":"fillExtrusion",v);u&&(t.context.activeTexture.set(l.TEXTURE0),m.imageAtlasTexture.bind(l.LINEAR,l.CLAMP_TO_EDGE),v.updatePaintBuffers(h));var x=c.constantOr(null);if(x&&m.imageAtlas){var b=m.imageAtlas,w=b.patternPositions[x.to.toString()],E=b.patternPositions[x.from.toString()];w&&E&&v.setConstantPatternPositions(w,E);}var T=t.translatePosMatrix(f.posMatrix,m,i.paint.get("fill-extrusion-translate"),i.paint.get("fill-extrusion-translate-anchor")),I=i.paint.get("fill-extrusion-vertical-gradient"),C=u?xi(T,t,I,p,f,h,m):yi(T,t,I,p);y.draw(s,s.gl.TRIANGLES,r,a,n,zt.backCCW,C,i.id,g.layoutVertexBuffer,g.indexBuffer,g.segments,i.paint,t.transform.zoom,v);}}}function oo(t,e,i,o,r,a){var n=t.context,s=n.gl,l=e.fbo;if(l){var c=t.useProgram("hillshade");n.activeTexture.set(s.TEXTURE0),s.bindTexture(s.TEXTURE_2D,l.colorAttachment.get());var u=Mi(t,e,i);c.draw(n,s.TRIANGLES,o,r,a,zt.disabled,u,i.id,t.rasterBoundsBuffer,t.quadTriangleIndexBuffer,t.rasterBoundsSegments);}}function ro(e,i,o,r,a,n,s){var l=e.context,c=l.gl,u=i.dem;if(u&&u.data){var h=u.dim,p=u.stride,d=u.getPixels();if(l.activeTexture.set(c.TEXTURE1),l.pixelStoreUnpackPremultiplyAlpha.set(!1),i.demTexture=i.demTexture||e.getTileTexture(p),i.demTexture){var _=i.demTexture;_.update(d,{premultiply:!1}),_.bind(c.NEAREST,c.CLAMP_TO_EDGE);}else i.demTexture=new t.Texture(l,d,c.RGBA,{premultiply:!1}),i.demTexture.bind(c.NEAREST,c.CLAMP_TO_EDGE);l.activeTexture.set(c.TEXTURE0);var f=i.fbo;if(!f){var m=new t.Texture(l,{width:h,height:h,data:null},c.RGBA);m.bind(c.LINEAR,c.CLAMP_TO_EDGE),(f=i.fbo=l.createFramebuffer(h,h,!0)).colorAttachment.set(m.texture);}l.bindFramebuffer.set(f.framebuffer),l.viewport.set([0,0,h,h]),e.useProgram("hillshadePrepare").draw(l,c.TRIANGLES,a,n,s,zt.disabled,Di(i.tileID,u,r),o.id,e.rasterBoundsBuffer,e.quadTriangleIndexBuffer,e.rasterBoundsSegments),i.needsHillshadePrepare=!1;}}function ao(e,i,o,r,a){var n=r.paint.get("raster-fade-duration");if(n>0){var s=t.browser.now(),l=(s-e.timeAdded)/n,c=i?(s-i.timeAdded)/n:-1,u=o.getSource(),h=a.coveringZoomLevel({tileSize:u.tileSize,roundZoom:u.roundZoom}),p=!i||Math.abs(i.tileID.overscaledZ-h)>Math.abs(e.tileID.overscaledZ-h),d=p&&e.refreshedUponExpiration?1:t.clamp(p?l:1-c,0,1);return e.refreshedUponExpiration&&l>=1&&(e.refreshedUponExpiration=!1),i?{opacity:1,mix:1-d}:{opacity:d,mix:0}}return {opacity:1,mix:0}}var no=new t.Color(1,0,0,1),so=new t.Color(0,1,0,1),lo=new t.Color(0,0,1,1),co=new t.Color(1,0,1,1),uo=new t.Color(0,1,1,1);function ho(t,e,i,o){_o(t,0,e+i/2,t.transform.width,i,o);}function po(t,e,i,o){_o(t,e-i/2,0,i,t.transform.height,o);}function _o(e,i,o,r,a,n){var s=e.context,l=s.gl;l.enable(l.SCISSOR_TEST),l.scissor(i*t.browser.devicePixelRatio,o*t.browser.devicePixelRatio,r*t.browser.devicePixelRatio,a*t.browser.devicePixelRatio),s.clear({color:n}),l.disable(l.SCISSOR_TEST);}function fo(e,i,o){var r=e.context,a=r.gl,n=o.posMatrix,s=e.useProgram("debug"),l=Ct.disabled,c=St.disabled,u=e.colorModeForRenderPass();r.activeTexture.set(a.TEXTURE0),e.emptyTexture.bind(a.LINEAR,a.CLAMP_TO_EDGE),s.draw(r,a.LINE_STRIP,l,c,u,zt.disabled,Pi(n,t.Color.red),"$debug",e.debugBuffer,e.tileBorderIndexBuffer,e.debugSegments);var h=i.getTileByID(o.key).latestRawTileData,p=Math.floor((h&&h.byteLength||0)/1024),d=i.getTile(o).tileSize,_=512/Math.min(d,512)*(o.overscaledZ/e.transform.zoom)*.5,f=o.canonical.toString();o.overscaledZ!==o.canonical.z&&(f+=" => "+o.overscaledZ),function(t,e){t.initDebugOverlayCanvas();var i=t.debugOverlayCanvas,o=t.context.gl,r=t.debugOverlayCanvas.getContext("2d");r.clearRect(0,0,i.width,i.height),r.shadowColor="white",r.shadowBlur=2,r.lineWidth=1.5,r.strokeStyle="white",r.textBaseline="top",r.font="bold 36px Open Sans, sans-serif",r.fillText(e,5,5),r.strokeText(e,5,5),t.debugOverlayTexture.update(i),t.debugOverlayTexture.bind(o.LINEAR,o.CLAMP_TO_EDGE);}(e,f+" "+p+"kb"),s.draw(r,a.TRIANGLES,l,c,Pt.alphaBlended,zt.disabled,Pi(n,t.Color.transparent,_),"$debug",e.debugBuffer,e.quadTriangleIndexBuffer,e.debugSegments);}var mo={symbol:function(e,i,o,r,a){if("translucent"===e.renderPass){var n=St.disabled,s=e.colorModeForRenderPass();o.layout.get("text-variable-anchor")&&function(e,i,o,r,a,n,s){for(var l=i.transform,c="map"===a,u="map"===n,h=0,p=e;h<p.length;h+=1){var d=p[h],_=r.getTile(d),f=_.getBucket(o);if(f&&f.text&&f.text.segments.get().length){var m=t.evaluateSizeForZoom(f.textSizeData,l.zoom),g=ue(_,1,i.transform.zoom),v=Kt(d.posMatrix,u,c,i.transform,g),y="none"!==o.layout.get("icon-text-fit")&&f.hasIconData();if(m){var x=Math.pow(2,l.zoom-_.tileID.overscaledZ);Ji(f,c,u,s,t.symbolSize,l,v,d.posMatrix,x,m,y);}}}}(r,e,o,i,o.layout.get("text-rotation-alignment"),o.layout.get("text-pitch-alignment"),a),0!==o.paint.get("icon-opacity").constantOr(1)&&$i(e,i,o,r,!1,o.paint.get("icon-translate"),o.paint.get("icon-translate-anchor"),o.layout.get("icon-rotation-alignment"),o.layout.get("icon-pitch-alignment"),o.layout.get("icon-keep-upright"),n,s),0!==o.paint.get("text-opacity").constantOr(1)&&$i(e,i,o,r,!0,o.paint.get("text-translate"),o.paint.get("text-translate-anchor"),o.layout.get("text-rotation-alignment"),o.layout.get("text-pitch-alignment"),o.layout.get("text-keep-upright"),n,s),i.map.showCollisionBoxes&&(Hi(e,i,o,r,o.paint.get("text-translate"),o.paint.get("text-translate-anchor"),!0),Hi(e,i,o,r,o.paint.get("icon-translate"),o.paint.get("icon-translate-anchor"),!1));}},circle:function(e,i,o,r){if("translucent"===e.renderPass){var a=o.paint.get("circle-opacity"),n=o.paint.get("circle-stroke-width"),s=o.paint.get("circle-stroke-opacity"),l=void 0!==o.layout.get("circle-sort-key").constantOr(1);if(0!==a.constantOr(1)||0!==n.constantOr(1)&&0!==s.constantOr(1)){for(var c=e.context,u=c.gl,h=e.depthModeForSublayer(0,Ct.ReadOnly),p=St.disabled,d=e.colorModeForRenderPass(),_=[],f=0;f<r.length;f++){var m=r[f],g=i.getTile(m),v=g.getBucket(o);if(v){var y=v.programConfigurations.get(o.id),x={programConfiguration:y,program:e.useProgram("circle",y),layoutVertexBuffer:v.layoutVertexBuffer,indexBuffer:v.indexBuffer,uniformValues:Ii(e,m,g,o)};if(l)for(var b=0,w=v.segments.get();b<w.length;b+=1){var E=w[b];_.push({segments:new t.SegmentVector([E]),sortKey:E.sortKey,state:x});}else _.push({segments:v.segments,sortKey:0,state:x});}}l&&_.sort((function(t,e){return t.sortKey-e.sortKey}));for(var T=0,I=_;T<I.length;T+=1){var C=I[T],S=C.state;S.program.draw(c,u.TRIANGLES,h,p,d,zt.disabled,S.uniformValues,o.id,S.layoutVertexBuffer,S.indexBuffer,C.segments,o.paint,e.transform.zoom,S.programConfiguration);}}}},heatmap:function(e,i,o,r){if(0!==o.paint.get("heatmap-opacity"))if("offscreen"===e.renderPass){var a=e.context,n=a.gl,s=St.disabled,l=new Pt([n.ONE,n.ONE],t.Color.transparent,[!0,!0,!0,!0]);!function(t,e,i){var o=t.gl;t.activeTexture.set(o.TEXTURE1),t.viewport.set([0,0,e.width/4,e.height/4]);var r=i.heatmapFbo;if(r)o.bindTexture(o.TEXTURE_2D,r.colorAttachment.get()),t.bindFramebuffer.set(r.framebuffer);else{var a=o.createTexture();o.bindTexture(o.TEXTURE_2D,a),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_S,o.CLAMP_TO_EDGE),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_T,o.CLAMP_TO_EDGE),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_MIN_FILTER,o.LINEAR),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_MAG_FILTER,o.LINEAR),r=i.heatmapFbo=t.createFramebuffer(e.width/4,e.height/4,!1),function t(e,i,o,r){var a=e.gl;a.texImage2D(a.TEXTURE_2D,0,a.RGBA,i.width/4,i.height/4,0,a.RGBA,e.extTextureHalfFloat?e.extTextureHalfFloat.HALF_FLOAT_OES:a.UNSIGNED_BYTE,null),r.colorAttachment.set(o),e.extTextureHalfFloat&&a.checkFramebufferStatus(a.FRAMEBUFFER)!==a.FRAMEBUFFER_COMPLETE&&(e.extTextureHalfFloat=null,r.colorAttachment.setDirty(),t(e,i,o,r));}(t,e,a,r);}}(a,e,o),a.clear({color:t.Color.transparent});for(var c=0;c<r.length;c++){var u=r[c];if(!i.hasRenderableParent(u)){var h=i.getTile(u),p=h.getBucket(o);if(p){var d=p.programConfigurations.get(o.id);e.useProgram("heatmap",d).draw(a,n.TRIANGLES,Ct.disabled,s,l,zt.disabled,Li(u.posMatrix,h,e.transform.zoom,o.paint.get("heatmap-intensity")),o.id,p.layoutVertexBuffer,p.indexBuffer,p.segments,o.paint,e.transform.zoom,d);}}}a.viewport.set([0,0,e.width,e.height]);}else"translucent"===e.renderPass&&(e.context.setColorMode(e.colorModeForRenderPass()),function(e,i){var o=e.context,r=o.gl,a=i.heatmapFbo;if(a){o.activeTexture.set(r.TEXTURE0),r.bindTexture(r.TEXTURE_2D,a.colorAttachment.get()),o.activeTexture.set(r.TEXTURE1);var n=i.colorRampTexture;n||(n=i.colorRampTexture=new t.Texture(o,i.colorRamp,r.RGBA)),n.bind(r.LINEAR,r.CLAMP_TO_EDGE),e.useProgram("heatmapTexture").draw(o,r.TRIANGLES,Ct.disabled,St.disabled,e.colorModeForRenderPass(),zt.disabled,function(e,i,o,r){var a=t.create();t.ortho(a,0,e.width,e.height,0,0,1);var n=e.context.gl;return {u_matrix:a,u_world:[n.drawingBufferWidth,n.drawingBufferHeight],u_image:0,u_color_ramp:1,u_opacity:i.paint.get("heatmap-opacity")}}(e,i),i.id,e.viewportBuffer,e.quadTriangleIndexBuffer,e.viewportSegments,i.paint,e.transform.zoom);}}(e,o));},line:function(e,i,o,r){if("translucent"===e.renderPass){var a=o.paint.get("line-opacity"),n=o.paint.get("line-width");if(0!==a.constantOr(1)&&0!==n.constantOr(1)){var s=e.depthModeForSublayer(0,Ct.ReadOnly),l=e.colorModeForRenderPass(),c=o.paint.get("line-dasharray"),u=o.paint.get("line-pattern"),h=u.constantOr(1),p=o.paint.get("line-gradient"),d=o.getCrossfadeParameters(),_=h?"linePattern":c?"lineSDF":p?"lineGradient":"line",f=e.context,m=f.gl,g=!0;if(p){f.activeTexture.set(m.TEXTURE0);var v=o.gradientTexture;if(!o.gradient)return;v||(v=o.gradientTexture=new t.Texture(f,o.gradient,m.RGBA)),v.bind(m.LINEAR,m.CLAMP_TO_EDGE);}for(var y=0,x=r;y<x.length;y+=1){var b=x[y],w=i.getTile(b);if(!h||w.patternsLoaded()){var E=w.getBucket(o);if(E){var T=E.programConfigurations.get(o.id),I=e.context.program.get(),C=e.useProgram(_,T),S=g||C.program!==I,P=u.constantOr(null);if(P&&w.imageAtlas){var z=w.imageAtlas,L=z.patternPositions[P.to.toString()],M=z.patternPositions[P.from.toString()];L&&M&&T.setConstantPatternPositions(L,M);}var D=h?ki(e,w,o,d):c?Bi(e,w,o,c,d):p?Ri(e,w,o):Ai(e,w,o);h?(f.activeTexture.set(m.TEXTURE0),w.imageAtlasTexture.bind(m.LINEAR,m.CLAMP_TO_EDGE),T.updatePaintBuffers(d)):c&&(S||e.lineAtlas.dirty)&&(f.activeTexture.set(m.TEXTURE0),e.lineAtlas.bind(f)),C.draw(f,m.TRIANGLES,s,e.stencilModeForClipping(b),l,zt.disabled,D,o.id,E.layoutVertexBuffer,E.indexBuffer,E.segments,o.paint,e.transform.zoom,T),g=!1;}}}}}},fill:function(e,i,o,r){var a=o.paint.get("fill-color"),n=o.paint.get("fill-opacity");if(0!==n.constantOr(1)){var s=e.colorModeForRenderPass(),l=o.paint.get("fill-pattern"),c=e.opaquePassEnabledForLayer()&&!l.constantOr(1)&&1===a.constantOr(t.Color.transparent).a&&1===n.constantOr(0)?"opaque":"translucent";if(e.renderPass===c){var u=e.depthModeForSublayer(1,"opaque"===e.renderPass?Ct.ReadWrite:Ct.ReadOnly);eo(e,i,o,r,u,s,!1);}if("translucent"===e.renderPass&&o.paint.get("fill-antialias")){var h=e.depthModeForSublayer(o.getPaintProperty("fill-outline-color")?2:0,Ct.ReadOnly);eo(e,i,o,r,h,s,!0);}}},"fill-extrusion":function(t,e,i,o){var r=i.paint.get("fill-extrusion-opacity");if(0!==r&&"translucent"===t.renderPass){var a=new Ct(t.context.gl.LEQUAL,Ct.ReadWrite,t.depthRangeFor3D);if(1!==r||i.paint.get("fill-extrusion-pattern").constantOr(1))io(t,e,i,o,a,St.disabled,Pt.disabled),io(t,e,i,o,a,t.stencilModeFor3D(),t.colorModeForRenderPass());else{var n=t.colorModeForRenderPass();io(t,e,i,o,a,St.disabled,n);}}},hillshade:function(t,e,i,o){if("offscreen"===t.renderPass||"translucent"===t.renderPass){for(var r=t.context,a=e.getSource().maxzoom,n=t.depthModeForSublayer(0,Ct.ReadOnly),s=t.colorModeForRenderPass(),l="translucent"===t.renderPass?t.stencilConfigForOverlap(o):[{},o],c=l[0],u=0,h=l[1];u<h.length;u+=1){var p=h[u],d=e.getTile(p);d.needsHillshadePrepare&&"offscreen"===t.renderPass?ro(t,d,i,a,n,St.disabled,s):"translucent"===t.renderPass&&oo(t,d,i,n,c[p.overscaledZ],s);}r.viewport.set([0,0,t.width,t.height]);}},raster:function(t,e,i,o){if("translucent"===t.renderPass&&0!==i.paint.get("raster-opacity")&&o.length)for(var r=t.context,a=r.gl,n=e.getSource(),s=t.useProgram("raster"),l=t.colorModeForRenderPass(),c=n instanceof D?[{},o]:t.stencilConfigForOverlap(o),u=c[0],h=c[1],p=h[h.length-1].overscaledZ,d=!t.options.moving,_=0,f=h;_<f.length;_+=1){var m=f[_],g=t.depthModeForSublayer(m.overscaledZ-p,1===i.paint.get("raster-opacity")?Ct.ReadWrite:Ct.ReadOnly,a.LESS),v=e.getTile(m),y=t.transform.calculatePosMatrix(m.toUnwrapped(),d);v.registerFadeDuration(i.paint.get("raster-fade-duration"));var x=e.findLoadedParent(m,0),b=ao(v,x,e,i,t.transform),w=void 0,E=void 0,T="nearest"===i.paint.get("raster-resampling")?a.NEAREST:a.LINEAR;r.activeTexture.set(a.TEXTURE0),v.texture.bind(T,a.CLAMP_TO_EDGE,a.LINEAR_MIPMAP_NEAREST),r.activeTexture.set(a.TEXTURE1),x?(x.texture.bind(T,a.CLAMP_TO_EDGE,a.LINEAR_MIPMAP_NEAREST),w=Math.pow(2,x.tileID.overscaledZ-v.tileID.overscaledZ),E=[v.tileID.canonical.x*w%1,v.tileID.canonical.y*w%1]):v.texture.bind(T,a.CLAMP_TO_EDGE,a.LINEAR_MIPMAP_NEAREST);var I=Ui(y,E||[0,0],w||1,b,i);n instanceof D?s.draw(r,a.TRIANGLES,g,St.disabled,l,zt.disabled,I,i.id,n.boundsBuffer,t.quadTriangleIndexBuffer,n.boundsSegments):s.draw(r,a.TRIANGLES,g,u[m.overscaledZ],l,zt.disabled,I,i.id,t.rasterBoundsBuffer,t.quadTriangleIndexBuffer,t.rasterBoundsSegments);}},background:function(t,e,i){var o=i.paint.get("background-color"),r=i.paint.get("background-opacity");if(0!==r){var a=t.context,n=a.gl,s=t.transform,l=s.tileSize,c=i.paint.get("background-pattern");if(!t.isPatternMissing(c)){var u=!c&&1===o.a&&1===r&&t.opaquePassEnabledForLayer()?"opaque":"translucent";if(t.renderPass===u){var h=St.disabled,p=t.depthModeForSublayer(0,"opaque"===u?Ct.ReadWrite:Ct.ReadOnly),d=t.colorModeForRenderPass(),_=t.useProgram(c?"backgroundPattern":"background"),f=s.coveringTiles({tileSize:l});c&&(a.activeTexture.set(n.TEXTURE0),t.imageManager.bind(t.context));for(var m=i.getCrossfadeParameters(),g=0,v=f;g<v.length;g+=1){var y=v[g],x=t.transform.calculatePosMatrix(y.toUnwrapped()),b=c?Gi(x,r,t,c,{tileID:y,tileSize:l},m):Vi(x,r,o);_.draw(a,n.TRIANGLES,p,h,d,zt.disabled,b,i.id,t.tileExtentBuffer,t.quadTriangleIndexBuffer,t.tileExtentSegments);}}}}},debug:function(t,e,i){for(var o=0;o<i.length;o++)fo(t,e,i[o]);},custom:function(t,e,i){var o=t.context,r=i.implementation;if("offscreen"===t.renderPass){var a=r.prerender;a&&(t.setCustomLayerDefaults(),o.setColorMode(t.colorModeForRenderPass()),a.call(r,o.gl,t.transform.customLayerMatrix()),o.setDirty(),t.setBaseState());}else if("translucent"===t.renderPass){t.setCustomLayerDefaults(),o.setColorMode(t.colorModeForRenderPass()),o.setStencilMode(St.disabled);var n="3d"===r.renderingMode?new Ct(t.context.gl.LEQUAL,Ct.ReadWrite,t.depthRangeFor3D):t.depthModeForSublayer(0,Ct.ReadOnly);o.setDepthMode(n),r.render(o.gl,t.transform.customLayerMatrix()),o.setDirty(),t.setBaseState(),o.bindFramebuffer.set(null);}}},go=function(t,e){this.context=new Lt(t),this.transform=e,this._tileTextures={},this.setup(),this.numSublayers=Mt.maxUnderzooming+Mt.maxOverzooming+1,this.depthEpsilon=1/Math.pow(2,16),this.crossTileSymbolIndex=new ke,this.gpuTimers={};};go.prototype.resize=function(e,i){if(this.width=e*t.browser.devicePixelRatio,this.height=i*t.browser.devicePixelRatio,this.context.viewport.set([0,0,this.width,this.height]),this.style)for(var o=0,r=this.style._order;o<r.length;o+=1)this.style._layers[r[o]].resize();},go.prototype.setup=function(){var e=this.context,i=new t.StructArrayLayout2i4;i.emplaceBack(0,0),i.emplaceBack(t.EXTENT,0),i.emplaceBack(0,t.EXTENT),i.emplaceBack(t.EXTENT,t.EXTENT),this.tileExtentBuffer=e.createVertexBuffer(i,Ze.members),this.tileExtentSegments=t.SegmentVector.simpleSegment(0,0,4,2);var o=new t.StructArrayLayout2i4;o.emplaceBack(0,0),o.emplaceBack(t.EXTENT,0),o.emplaceBack(0,t.EXTENT),o.emplaceBack(t.EXTENT,t.EXTENT),this.debugBuffer=e.createVertexBuffer(o,Ze.members),this.debugSegments=t.SegmentVector.simpleSegment(0,0,4,5);var r=new t.StructArrayLayout4i8;r.emplaceBack(0,0,0,0),r.emplaceBack(t.EXTENT,0,t.EXTENT,0),r.emplaceBack(0,t.EXTENT,0,t.EXTENT),r.emplaceBack(t.EXTENT,t.EXTENT,t.EXTENT,t.EXTENT),this.rasterBoundsBuffer=e.createVertexBuffer(r,M.members),this.rasterBoundsSegments=t.SegmentVector.simpleSegment(0,0,4,2);var a=new t.StructArrayLayout2i4;a.emplaceBack(0,0),a.emplaceBack(1,0),a.emplaceBack(0,1),a.emplaceBack(1,1),this.viewportBuffer=e.createVertexBuffer(a,Ze.members),this.viewportSegments=t.SegmentVector.simpleSegment(0,0,4,2);var n=new t.StructArrayLayout1ui2;n.emplaceBack(0),n.emplaceBack(1),n.emplaceBack(3),n.emplaceBack(2),n.emplaceBack(0),this.tileBorderIndexBuffer=e.createIndexBuffer(n);var s=new t.StructArrayLayout3ui6;s.emplaceBack(0,1,2),s.emplaceBack(2,1,3),this.quadTriangleIndexBuffer=e.createIndexBuffer(s),this.emptyTexture=new t.Texture(e,{width:1,height:1,data:new Uint8Array([0,0,0,0])},e.gl.RGBA);var l=this.context.gl;this.stencilClearMode=new St({func:l.ALWAYS,mask:0},0,255,l.ZERO,l.ZERO,l.ZERO);},go.prototype.clearStencil=function(){var e=this.context,i=e.gl;this.nextStencilID=1,this.currentStencilSource=void 0;var o=t.create();t.ortho(o,0,this.width,this.height,0,0,1),t.scale(o,o,[i.drawingBufferWidth,i.drawingBufferHeight,0]),this.useProgram("clippingMask").draw(e,i.TRIANGLES,Ct.disabled,this.stencilClearMode,Pt.disabled,zt.disabled,zi(o),"$clipping",this.viewportBuffer,this.quadTriangleIndexBuffer,this.viewportSegments);},go.prototype._renderTileClippingMasks=function(t,e){if(this.currentStencilSource!==t.source&&t.isTileClipped()&&e&&e.length){this.currentStencilSource=t.source;var i=this.context,o=i.gl;this.nextStencilID+e.length>256&&this.clearStencil(),i.setColorMode(Pt.disabled),i.setDepthMode(Ct.disabled);var r=this.useProgram("clippingMask");this._tileClippingMaskIDs={};for(var a=0,n=e;a<n.length;a+=1){var s=n[a],l=this._tileClippingMaskIDs[s.key]=this.nextStencilID++;r.draw(i,o.TRIANGLES,Ct.disabled,new St({func:o.ALWAYS,mask:0},l,255,o.KEEP,o.KEEP,o.REPLACE),Pt.disabled,zt.disabled,zi(s.posMatrix),"$clipping",this.tileExtentBuffer,this.quadTriangleIndexBuffer,this.tileExtentSegments);}}},go.prototype.stencilModeFor3D=function(){this.currentStencilSource=void 0,this.nextStencilID+1>256&&this.clearStencil();var t=this.nextStencilID++,e=this.context.gl;return new St({func:e.NOTEQUAL,mask:255},t,255,e.KEEP,e.KEEP,e.REPLACE)},go.prototype.stencilModeForClipping=function(t){var e=this.context.gl;return new St({func:e.EQUAL,mask:255},this._tileClippingMaskIDs[t.key],0,e.KEEP,e.KEEP,e.REPLACE)},go.prototype.stencilConfigForOverlap=function(t){var e,i=this.context.gl,o=t.sort((function(t,e){return e.overscaledZ-t.overscaledZ})),r=o[o.length-1].overscaledZ,a=o[0].overscaledZ-r+1;if(a>1){this.currentStencilSource=void 0,this.nextStencilID+a>256&&this.clearStencil();for(var n={},s=0;s<a;s++)n[s+r]=new St({func:i.GEQUAL,mask:255},s+this.nextStencilID,255,i.KEEP,i.KEEP,i.REPLACE);return this.nextStencilID+=a,[n,o]}return [(e={},e[r]=St.disabled,e),o]},go.prototype.colorModeForRenderPass=function(){var e=this.context.gl;return this._showOverdrawInspector?new Pt([e.CONSTANT_COLOR,e.ONE],new t.Color(1/8,1/8,1/8,0),[!0,!0,!0,!0]):"opaque"===this.renderPass?Pt.unblended:Pt.alphaBlended},go.prototype.depthModeForSublayer=function(t,e,i){if(!this.opaquePassEnabledForLayer())return Ct.disabled;var o=1-((1+this.currentLayer)*this.numSublayers+t)*this.depthEpsilon;return new Ct(i||this.context.gl.LEQUAL,e,[o,o])},go.prototype.opaquePassEnabledForLayer=function(){return this.currentLayer<this.opaquePassCutoff},go.prototype.render=function(e,i){var o=this;this.style=e,this.options=i,this.lineAtlas=e.lineAtlas,this.imageManager=e.imageManager,this.glyphManager=e.glyphManager,this.symbolFadeChange=e.placement.symbolFadeChange(t.browser.now()),this.imageManager.beginFrame();var r=this.style._order,a=this.style.sourceCaches;for(var n in a){var s=a[n];s.used&&s.prepare(this.context);}var l,c,u={},h={},p={};for(var d in a){var _=a[d];u[d]=_.getVisibleCoordinates(),h[d]=u[d].slice().reverse(),p[d]=_.getVisibleCoordinates(!0).reverse();}this.opaquePassCutoff=1/0;for(var f=0;f<r.length;f++)if(this.style._layers[r[f]].is3D()){this.opaquePassCutoff=f;break}this.renderPass="offscreen";for(var m=0,g=r;m<g.length;m+=1){var v=this.style._layers[g[m]];if(v.hasOffscreenPass()&&!v.isHidden(this.transform.zoom)){var y=h[v.source];("custom"===v.type||y.length)&&this.renderLayer(this,a[v.source],v,y);}}for(this.context.bindFramebuffer.set(null),this.context.clear({color:i.showOverdrawInspector?t.Color.black:t.Color.transparent,depth:1}),this.clearStencil(),this._showOverdrawInspector=i.showOverdrawInspector,this.depthRangeFor3D=[0,1-(e._order.length+2)*this.numSublayers*this.depthEpsilon],this.renderPass="opaque",this.currentLayer=r.length-1;this.currentLayer>=0;this.currentLayer--){var x=this.style._layers[r[this.currentLayer]],b=a[x.source],w=u[x.source];this._renderTileClippingMasks(x,w),this.renderLayer(this,b,x,w);}for(this.renderPass="translucent",this.currentLayer=0;this.currentLayer<r.length;this.currentLayer++){var E=this.style._layers[r[this.currentLayer]],T=a[E.source],I=("symbol"===E.type?p:h)[E.source];this._renderTileClippingMasks(E,u[E.source]),this.renderLayer(this,T,E,I);}this.options.showTileBoundaries&&(t.values(this.style._layers).forEach((function(t){t.source&&!t.isHidden(o.transform.zoom)&&(t.source!==(c&&c.id)&&(c=o.style.sourceCaches[t.source]),(!l||l.getSource().maxzoom<c.getSource().maxzoom)&&(l=c));})),l&&mo.debug(this,l,l.getVisibleCoordinates())),this.options.showPadding&&function(t){var e=t.transform.padding;ho(t,t.transform.height-(e.top||0),3,no),ho(t,e.bottom||0,3,so),po(t,e.left||0,3,lo),po(t,t.transform.width-(e.right||0),3,co);var i=t.transform.centerPoint;!function(t,e,i,o){_o(t,e-1,i-10,2,20,o),_o(t,e-10,i-1,20,2,o);}(t,i.x,t.transform.height-i.y,uo);}(this),this.context.setDefault();},go.prototype.renderLayer=function(t,e,i,o){i.isHidden(this.transform.zoom)||("background"===i.type||"custom"===i.type||o.length)&&(this.id=i.id,this.gpuTimingStart(i),mo[i.type](t,e,i,o,this.style.placement.variableOffsets),this.gpuTimingEnd());},go.prototype.gpuTimingStart=function(t){if(this.options.gpuTiming){var e=this.context.extTimerQuery,i=this.gpuTimers[t.id];i||(i=this.gpuTimers[t.id]={calls:0,cpuTime:0,query:e.createQueryEXT()}),i.calls++,e.beginQueryEXT(e.TIME_ELAPSED_EXT,i.query);}},go.prototype.gpuTimingEnd=function(){if(this.options.gpuTiming){var t=this.context.extTimerQuery;t.endQueryEXT(t.TIME_ELAPSED_EXT);}},go.prototype.collectGpuTimers=function(){var t=this.gpuTimers;return this.gpuTimers={},t},go.prototype.queryGpuTimers=function(t){var e={};for(var i in t){var o=t[i],r=this.context.extTimerQuery,a=r.getQueryObjectEXT(o.query,r.QUERY_RESULT_EXT)/1e6;r.deleteQueryEXT(o.query),e[i]=a;}return e},go.prototype.translatePosMatrix=function(e,i,o,r,a){if(!o[0]&&!o[1])return e;var n=a?"map"===r?this.transform.angle:0:"viewport"===r?-this.transform.angle:0;if(n){var s=Math.sin(n),l=Math.cos(n);o=[o[0]*l-o[1]*s,o[0]*s+o[1]*l];}var c=[a?o[0]:ue(i,o[0],this.transform.zoom),a?o[1]:ue(i,o[1],this.transform.zoom),0],u=new Float32Array(16);return t.translate(u,e,c),u},go.prototype.saveTileTexture=function(t){var e=this._tileTextures[t.size[0]];e?e.push(t):this._tileTextures[t.size[0]]=[t];},go.prototype.getTileTexture=function(t){var e=this._tileTextures[t];return e&&e.length>0?e.pop():null},go.prototype.isPatternMissing=function(t){if(!t)return !1;var e=this.imageManager.getPattern(t.from.toString()),i=this.imageManager.getPattern(t.to.toString());return !e||!i},go.prototype.useProgram=function(t,e){this.cache=this.cache||{};var i=""+t+(e?e.cacheKey:"")+(this._showOverdrawInspector?"/overdraw":"");return this.cache[i]||(this.cache[i]=new gi(this.context,fi[t],e,Wi[t],this._showOverdrawInspector)),this.cache[i]},go.prototype.setCustomLayerDefaults=function(){this.context.unbindVAO(),this.context.cullFace.setDefault(),this.context.activeTexture.setDefault(),this.context.pixelStoreUnpack.setDefault(),this.context.pixelStoreUnpackPremultiplyAlpha.setDefault(),this.context.pixelStoreUnpackFlipY.setDefault();},go.prototype.setBaseState=function(){var t=this.context.gl;this.context.cullFace.set(!1),this.context.viewport.set([0,0,this.width,this.height]),this.context.blendEquation.set(t.FUNC_ADD);},go.prototype.initDebugOverlayCanvas=function(){null==this.debugOverlayCanvas&&(this.debugOverlayCanvas=t.window.document.createElement("canvas"),this.debugOverlayCanvas.width=512,this.debugOverlayCanvas.height=512,this.debugOverlayTexture=new t.Texture(this.context,this.debugOverlayCanvas,this.context.gl.RGBA));},go.prototype.destroy=function(){this.emptyTexture.destroy(),this.debugOverlayTexture&&this.debugOverlayTexture.destroy();};var vo=function(t,e){this.points=t,this.planes=e;};vo.fromInvProjectionMatrix=function(e,i,o){var r=Math.pow(2,o),a=[[-1,1,-1,1],[1,1,-1,1],[1,-1,-1,1],[-1,-1,-1,1],[-1,1,1,1],[1,1,1,1],[1,-1,1,1],[-1,-1,1,1]].map((function(i){return t.transformMat4([],i,e)})).map((function(e){return t.scale$1([],e,1/e[3]/i*r)})),n=[[0,1,2],[6,5,4],[0,3,7],[2,1,5],[3,2,6],[0,4,5]].map((function(e){var i=t.sub([],a[e[0]],a[e[1]]),o=t.sub([],a[e[2]],a[e[1]]),r=t.normalize([],t.cross([],i,o)),n=-t.dot(r,a[e[1]]);return r.concat(n)}));return new vo(a,n)};var yo=function(e,i){this.min=e,this.max=i,this.center=t.scale$2([],t.add([],this.min,this.max),.5);};yo.prototype.quadrant=function(e){for(var i=[e%2==0,e<2],o=t.clone$2(this.min),r=t.clone$2(this.max),a=0;a<i.length;a++)o[a]=i[a]?this.min[a]:this.center[a],r[a]=i[a]?this.center[a]:this.max[a];return r[2]=this.max[2],new yo(o,r)},yo.prototype.distanceX=function(t){return Math.max(Math.min(this.max[0],t[0]),this.min[0])-t[0]},yo.prototype.distanceY=function(t){return Math.max(Math.min(this.max[1],t[1]),this.min[1])-t[1]},yo.prototype.intersects=function(e){for(var i=[[this.min[0],this.min[1],0,1],[this.max[0],this.min[1],0,1],[this.max[0],this.max[1],0,1],[this.min[0],this.max[1],0,1]],o=!0,r=0;r<e.planes.length;r++){for(var a=e.planes[r],n=0,s=0;s<i.length;s++)n+=t.dot$1(a,i[s])>=0;if(0===n)return 0;n!==i.length&&(o=!1);}if(o)return 2;for(var l=0;l<3;l++){for(var c=Number.MAX_VALUE,u=-Number.MAX_VALUE,h=0;h<e.points.length;h++){var p=e.points[h][l]-this.min[l];c=Math.min(c,p),u=Math.max(u,p);}if(u<0||c>this.max[l]-this.min[l])return 0}return 1};var xo=function(t,e,i,o){if(void 0===t&&(t=0),void 0===e&&(e=0),void 0===i&&(i=0),void 0===o&&(o=0),isNaN(t)||t<0||isNaN(e)||e<0||isNaN(i)||i<0||isNaN(o)||o<0)throw new Error("Invalid value for edge-insets, top, bottom, left and right must all be numbers");this.top=t,this.bottom=e,this.left=i,this.right=o;};xo.prototype.interpolate=function(e,i,o){return null!=i.top&&null!=e.top&&(this.top=t.number(e.top,i.top,o)),null!=i.bottom&&null!=e.bottom&&(this.bottom=t.number(e.bottom,i.bottom,o)),null!=i.left&&null!=e.left&&(this.left=t.number(e.left,i.left,o)),null!=i.right&&null!=e.right&&(this.right=t.number(e.right,i.right,o)),this},xo.prototype.getCenter=function(e,i){var o=t.clamp((this.left+e-this.right)/2,0,e),r=t.clamp((this.top+i-this.bottom)/2,0,i);return new t.Point(o,r)},xo.prototype.equals=function(t){return this.top===t.top&&this.bottom===t.bottom&&this.left===t.left&&this.right===t.right},xo.prototype.clone=function(){return new xo(this.top,this.bottom,this.left,this.right)},xo.prototype.toJSON=function(){return {top:this.top,bottom:this.bottom,left:this.left,right:this.right}};var bo=function(e,i,o,r,a){this.tileSize=512,this.maxValidLatitude=85.051129,this._renderWorldCopies=void 0===a||a,this._minZoom=e||0,this._maxZoom=i||22,this._minPitch=null==o?0:o,this._maxPitch=null==r?60:r,this.setMaxBounds(),this.width=0,this.height=0,this._center=new t.LngLat(0,0),this.zoom=0,this.angle=0,this._fov=.6435011087932844,this._pitch=0,this._unmodified=!0,this._edgeInsets=new xo,this._posMatrixCache={},this._alignedPosMatrixCache={};},wo={minZoom:{configurable:!0},maxZoom:{configurable:!0},minPitch:{configurable:!0},maxPitch:{configurable:!0},renderWorldCopies:{configurable:!0},worldSize:{configurable:!0},centerOffset:{configurable:!0},size:{configurable:!0},bearing:{configurable:!0},pitch:{configurable:!0},fov:{configurable:!0},zoom:{configurable:!0},center:{configurable:!0},padding:{configurable:!0},centerPoint:{configurable:!0},unmodified:{configurable:!0},point:{configurable:!0}};bo.prototype.clone=function(){var t=new bo(this._minZoom,this._maxZoom,this._minPitch,this.maxPitch,this._renderWorldCopies);return t.tileSize=this.tileSize,t.latRange=this.latRange,t.width=this.width,t.height=this.height,t._center=this._center,t.zoom=this.zoom,t.angle=this.angle,t._fov=this._fov,t._pitch=this._pitch,t._unmodified=this._unmodified,t._edgeInsets=this._edgeInsets.clone(),t._calcMatrices(),t},wo.minZoom.get=function(){return this._minZoom},wo.minZoom.set=function(t){this._minZoom!==t&&(this._minZoom=t,this.zoom=Math.max(this.zoom,t));},wo.maxZoom.get=function(){return this._maxZoom},wo.maxZoom.set=function(t){this._maxZoom!==t&&(this._maxZoom=t,this.zoom=Math.min(this.zoom,t));},wo.minPitch.get=function(){return this._minPitch},wo.minPitch.set=function(t){this._minPitch!==t&&(this._minPitch=t,this.pitch=Math.max(this.pitch,t));},wo.maxPitch.get=function(){return this._maxPitch},wo.maxPitch.set=function(t){this._maxPitch!==t&&(this._maxPitch=t,this.pitch=Math.min(this.pitch,t));},wo.renderWorldCopies.get=function(){return this._renderWorldCopies},wo.renderWorldCopies.set=function(t){void 0===t?t=!0:null===t&&(t=!1),this._renderWorldCopies=t;},wo.worldSize.get=function(){return this.tileSize*this.scale},wo.centerOffset.get=function(){return this.centerPoint._sub(this.size._div(2))},wo.size.get=function(){return new t.Point(this.width,this.height)},wo.bearing.get=function(){return -this.angle/Math.PI*180},wo.bearing.set=function(e){var i=-t.wrap(e,-180,180)*Math.PI/180;this.angle!==i&&(this._unmodified=!1,this.angle=i,this._calcMatrices(),this.rotationMatrix=t.create$2(),t.rotate(this.rotationMatrix,this.rotationMatrix,this.angle));},wo.pitch.get=function(){return this._pitch/Math.PI*180},wo.pitch.set=function(e){var i=t.clamp(e,this.minPitch,this.maxPitch)/180*Math.PI;this._pitch!==i&&(this._unmodified=!1,this._pitch=i,this._calcMatrices());},wo.fov.get=function(){return this._fov/Math.PI*180},wo.fov.set=function(t){t=Math.max(.01,Math.min(60,t)),this._fov!==t&&(this._unmodified=!1,this._fov=t/180*Math.PI,this._calcMatrices());},wo.zoom.get=function(){return this._zoom},wo.zoom.set=function(t){var e=Math.min(Math.max(t,this.minZoom),this.maxZoom);this._zoom!==e&&(this._unmodified=!1,this._zoom=e,this.scale=this.zoomScale(e),this.tileZoom=Math.floor(e),this.zoomFraction=e-this.tileZoom,this._constrain(),this._calcMatrices());},wo.center.get=function(){return this._center},wo.center.set=function(t){t.lat===this._center.lat&&t.lng===this._center.lng||(this._unmodified=!1,this._center=t,this._constrain(),this._calcMatrices());},wo.padding.get=function(){return this._edgeInsets.toJSON()},wo.padding.set=function(t){this._edgeInsets.equals(t)||(this._unmodified=!1,this._edgeInsets.interpolate(this._edgeInsets,t,1),this._calcMatrices());},wo.centerPoint.get=function(){return this._edgeInsets.getCenter(this.width,this.height)},bo.prototype.isPaddingEqual=function(t){return this._edgeInsets.equals(t)},bo.prototype.interpolatePadding=function(t,e,i){this._unmodified=!1,this._edgeInsets.interpolate(t,e,i),this._constrain(),this._calcMatrices();},bo.prototype.coveringZoomLevel=function(t){var e=(t.roundZoom?Math.round:Math.floor)(this.zoom+this.scaleZoom(this.tileSize/t.tileSize));return Math.max(0,e)},bo.prototype.getVisibleUnwrappedCoordinates=function(e){var i=[new t.UnwrappedTileID(0,e)];if(this._renderWorldCopies)for(var o=this.pointCoordinate(new t.Point(0,0)),r=this.pointCoordinate(new t.Point(this.width,0)),a=this.pointCoordinate(new t.Point(this.width,this.height)),n=this.pointCoordinate(new t.Point(0,this.height)),s=Math.floor(Math.min(o.x,r.x,a.x,n.x)),l=Math.floor(Math.max(o.x,r.x,a.x,n.x)),c=s-1;c<=l+1;c++)0!==c&&i.push(new t.UnwrappedTileID(c,e));return i},bo.prototype.coveringTiles=function(e){var i=this.coveringZoomLevel(e),o=i;if(void 0!==e.minzoom&&i<e.minzoom)return [];void 0!==e.maxzoom&&i>e.maxzoom&&(i=e.maxzoom);var r=t.MercatorCoordinate.fromLngLat(this.center),a=Math.pow(2,i),n=[a*r.x,a*r.y,0],s=vo.fromInvProjectionMatrix(this.invProjMatrix,this.worldSize,i),l=e.minzoom||0;this.pitch<=60&&this._edgeInsets.top<.1&&(l=i);var c=function(t){return {aabb:new yo([t*a,0,0],[(t+1)*a,a,0]),zoom:0,x:0,y:0,wrap:t,fullyVisible:!1}},u=[],h=[],p=i,d=e.reparseOverscaled?o:i;if(this._renderWorldCopies)for(var _=1;_<=3;_++)u.push(c(-_)),u.push(c(_));for(u.push(c(0));u.length>0;){var f=u.pop(),m=f.x,g=f.y,v=f.fullyVisible;if(!v){var y=f.aabb.intersects(s);if(0===y)continue;v=2===y;}var x=f.aabb.distanceX(n),b=f.aabb.distanceY(n),w=Math.max(Math.abs(x),Math.abs(b));if(f.zoom===p||w>3+(1<<p-f.zoom)-2&&f.zoom>=l)h.push({tileID:new t.OverscaledTileID(f.zoom===p?d:f.zoom,f.wrap,f.zoom,m,g),distanceSq:t.sqrLen([n[0]-.5-m,n[1]-.5-g])});else for(var E=0;E<4;E++){var T=(m<<1)+E%2,I=(g<<1)+(E>>1);u.push({aabb:f.aabb.quadrant(E),zoom:f.zoom+1,x:T,y:I,wrap:f.wrap,fullyVisible:v});}}return h.sort((function(t,e){return t.distanceSq-e.distanceSq})).map((function(t){return t.tileID}))},bo.prototype.resize=function(t,e){this.width=t,this.height=e,this.pixelsToGLUnits=[2/t,-2/e],this._constrain(),this._calcMatrices();},wo.unmodified.get=function(){return this._unmodified},bo.prototype.zoomScale=function(t){return Math.pow(2,t)},bo.prototype.scaleZoom=function(t){return Math.log(t)/Math.LN2},bo.prototype.project=function(e){var i=t.clamp(e.lat,-this.maxValidLatitude,this.maxValidLatitude);return new t.Point(t.mercatorXfromLng(e.lng)*this.worldSize,t.mercatorYfromLat(i)*this.worldSize)},bo.prototype.unproject=function(e){return new t.MercatorCoordinate(e.x/this.worldSize,e.y/this.worldSize).toLngLat()},wo.point.get=function(){return this.project(this.center)},bo.prototype.setLocationAtPoint=function(e,i){var o=this.pointCoordinate(i),r=this.pointCoordinate(this.centerPoint),a=this.locationCoordinate(e),n=new t.MercatorCoordinate(a.x-(o.x-r.x),a.y-(o.y-r.y));this.center=this.coordinateLocation(n),this._renderWorldCopies&&(this.center=this.center.wrap());},bo.prototype.locationPoint=function(t){return this.coordinatePoint(this.locationCoordinate(t))},bo.prototype.pointLocation=function(t){return this.coordinateLocation(this.pointCoordinate(t))},bo.prototype.locationCoordinate=function(e){return t.MercatorCoordinate.fromLngLat(e)},bo.prototype.coordinateLocation=function(t){return t.toLngLat()},bo.prototype.pointCoordinate=function(e){var i=[e.x,e.y,0,1],o=[e.x,e.y,1,1];t.transformMat4(i,i,this.pixelMatrixInverse),t.transformMat4(o,o,this.pixelMatrixInverse);var r=i[3],a=o[3],n=i[1]/r,s=o[1]/a,l=i[2]/r,c=o[2]/a,u=l===c?0:(0-l)/(c-l);return new t.MercatorCoordinate(t.number(i[0]/r,o[0]/a,u)/this.worldSize,t.number(n,s,u)/this.worldSize)},bo.prototype.coordinatePoint=function(e){var i=[e.x*this.worldSize,e.y*this.worldSize,0,1];return t.transformMat4(i,i,this.pixelMatrix),new t.Point(i[0]/i[3],i[1]/i[3])},bo.prototype.getBounds=function(){return (new t.LngLatBounds).extend(this.pointLocation(new t.Point(0,0))).extend(this.pointLocation(new t.Point(this.width,0))).extend(this.pointLocation(new t.Point(this.width,this.height))).extend(this.pointLocation(new t.Point(0,this.height)))},bo.prototype.getMaxBounds=function(){return this.latRange&&2===this.latRange.length&&this.lngRange&&2===this.lngRange.length?new t.LngLatBounds([this.lngRange[0],this.latRange[0]],[this.lngRange[1],this.latRange[1]]):null},bo.prototype.setMaxBounds=function(t){t?(this.lngRange=[t.getWest(),t.getEast()],this.latRange=[t.getSouth(),t.getNorth()],this._constrain()):(this.lngRange=null,this.latRange=[-this.maxValidLatitude,this.maxValidLatitude]);},bo.prototype.calculatePosMatrix=function(e,i){void 0===i&&(i=!1);var o=e.key,r=i?this._alignedPosMatrixCache:this._posMatrixCache;if(r[o])return r[o];var a=e.canonical,n=this.worldSize/this.zoomScale(a.z),s=a.x+Math.pow(2,a.z)*e.wrap,l=t.identity(new Float64Array(16));return t.translate(l,l,[s*n,a.y*n,0]),t.scale(l,l,[n/t.EXTENT,n/t.EXTENT,1]),t.multiply(l,i?this.alignedProjMatrix:this.projMatrix,l),r[o]=new Float32Array(l),r[o]},bo.prototype.customLayerMatrix=function(){return this.mercatorMatrix.slice()},bo.prototype._constrain=function(){if(this.center&&this.width&&this.height&&!this._constraining){this._constraining=!0;var e,i,o,r,a=-90,n=90,s=-180,l=180,c=this.size,u=this._unmodified;if(this.latRange){var h=this.latRange;a=t.mercatorYfromLat(h[1])*this.worldSize,e=(n=t.mercatorYfromLat(h[0])*this.worldSize)-a<c.y?c.y/(n-a):0;}if(this.lngRange){var p=this.lngRange;s=t.mercatorXfromLng(p[0])*this.worldSize,i=(l=t.mercatorXfromLng(p[1])*this.worldSize)-s<c.x?c.x/(l-s):0;}var d=this.point,_=Math.max(i||0,e||0);if(_)return this.center=this.unproject(new t.Point(i?(l+s)/2:d.x,e?(n+a)/2:d.y)),this.zoom+=this.scaleZoom(_),this._unmodified=u,void(this._constraining=!1);if(this.latRange){var f=d.y,m=c.y/2;f-m<a&&(r=a+m),f+m>n&&(r=n-m);}if(this.lngRange){var g=d.x,v=c.x/2;g-v<s&&(o=s+v),g+v>l&&(o=l-v);}void 0===o&&void 0===r||(this.center=this.unproject(new t.Point(void 0!==o?o:d.x,void 0!==r?r:d.y))),this._unmodified=u,this._constraining=!1;}},bo.prototype._calcMatrices=function(){if(this.height){var e=this.centerOffset;this.cameraToCenterDistance=.5/Math.tan(this._fov/2)*this.height;var i=Math.PI/2+this._pitch,o=this._fov*(.5+e.y/this.height),r=Math.sin(o)*this.cameraToCenterDistance/Math.sin(t.clamp(Math.PI-i-o,.01,Math.PI-.01)),a=this.point,n=a.x,s=a.y,l=1.01*(Math.cos(Math.PI/2-this._pitch)*r+this.cameraToCenterDistance),c=this.height/50,u=new Float64Array(16);t.perspective(u,this._fov,this.width/this.height,c,l),u[8]=2*-e.x/this.width,u[9]=2*e.y/this.height,t.scale(u,u,[1,-1,1]),t.translate(u,u,[0,0,-this.cameraToCenterDistance]),t.rotateX(u,u,this._pitch),t.rotateZ(u,u,this.angle),t.translate(u,u,[-n,-s,0]),this.mercatorMatrix=t.scale([],u,[this.worldSize,this.worldSize,this.worldSize]),t.scale(u,u,[1,1,t.mercatorZfromAltitude(1,this.center.lat)*this.worldSize,1]),this.projMatrix=u,this.invProjMatrix=t.invert([],this.projMatrix);var h=this.width%2/2,p=this.height%2/2,d=Math.cos(this.angle),_=Math.sin(this.angle),f=n-Math.round(n)+d*h+_*p,m=s-Math.round(s)+d*p+_*h,g=new Float64Array(u);if(t.translate(g,g,[f>.5?f-1:f,m>.5?m-1:m,0]),this.alignedProjMatrix=g,u=t.create(),t.scale(u,u,[this.width/2,-this.height/2,1]),t.translate(u,u,[1,-1,0]),this.labelPlaneMatrix=u,u=t.create(),t.scale(u,u,[1,-1,1]),t.translate(u,u,[-1,-1,0]),t.scale(u,u,[2/this.width,2/this.height,1]),this.glCoordMatrix=u,this.pixelMatrix=t.multiply(new Float64Array(16),this.labelPlaneMatrix,this.projMatrix),!(u=t.invert(new Float64Array(16),this.pixelMatrix)))throw new Error("failed to invert matrix");this.pixelMatrixInverse=u,this._posMatrixCache={},this._alignedPosMatrixCache={};}},bo.prototype.maxPitchScaleFactor=function(){if(!this.pixelMatrixInverse)return 1;var e=this.pointCoordinate(new t.Point(0,0)),i=[e.x*this.worldSize,e.y*this.worldSize,0,1];return t.transformMat4(i,i,this.pixelMatrix)[3]/this.cameraToCenterDistance},bo.prototype.getCameraPoint=function(){var e=Math.tan(this._pitch)*(this.cameraToCenterDistance||1);return this.centerPoint.add(new t.Point(0,e))},bo.prototype.getCameraQueryGeometry=function(e){var i=this.getCameraPoint();if(1===e.length)return [e[0],i];for(var o=i.x,r=i.y,a=i.x,n=i.y,s=0,l=e;s<l.length;s+=1){var c=l[s];o=Math.min(o,c.x),r=Math.min(r,c.y),a=Math.max(a,c.x),n=Math.max(n,c.y);}return [new t.Point(o,r),new t.Point(a,r),new t.Point(a,n),new t.Point(o,n),new t.Point(o,r)]},Object.defineProperties(bo.prototype,wo);var Eo=function(e){var i,o,r,a;this._hashName=e&&encodeURIComponent(e),t.bindAll(["_getCurrentHash","_onHashChange","_updateHash"],this),this._updateHash=(i=this._updateHashUnthrottled.bind(this),o=!1,r=null,a=function(){r=null,o&&(i(),r=setTimeout(a,300),o=!1);},function(){return o=!0,r||a(),r});};Eo.prototype.addTo=function(e){return this._map=e,t.window.addEventListener("hashchange",this._onHashChange,!1),this._map.on("moveend",this._updateHash),this},Eo.prototype.remove=function(){return t.window.removeEventListener("hashchange",this._onHashChange,!1),this._map.off("moveend",this._updateHash),clearTimeout(this._updateHash()),delete this._map,this},Eo.prototype.getHashString=function(e){var i=this._map.getCenter(),o=Math.round(100*this._map.getZoom())/100,r=Math.ceil((o*Math.LN2+Math.log(512/360/.5))/Math.LN10),a=Math.pow(10,r),n=Math.round(i.lng*a)/a,s=Math.round(i.lat*a)/a,l=this._map.getBearing(),c=this._map.getPitch(),u="";if(u+=e?"/"+n+"/"+s+"/"+o:o+"/"+s+"/"+n,(l||c)&&(u+="/"+Math.round(10*l)/10),c&&(u+="/"+Math.round(c)),this._hashName){var h=this._hashName,p=!1,d=t.window.location.hash.slice(1).split("&").map((function(t){var e=t.split("=")[0];return e===h?(p=!0,e+"="+u):t})).filter((function(t){return t}));return p||d.push(h+"="+u),"#"+d.join("&")}return "#"+u},Eo.prototype._getCurrentHash=function(){var e,i=this,o=t.window.location.hash.replace("#","");return this._hashName?(o.split("&").map((function(t){return t.split("=")})).forEach((function(t){t[0]===i._hashName&&(e=t);})),(e&&e[1]||"").split("/")):o.split("/")},Eo.prototype._onHashChange=function(){var t=this._getCurrentHash();if(t.length>=3&&!t.some((function(t){return isNaN(t)}))){var e=this._map.dragRotate.isEnabled()&&this._map.touchZoomRotate.isEnabled()?+(t[3]||0):this._map.getBearing();return this._map.jumpTo({center:[+t[2],+t[1]],zoom:+t[0],bearing:e,pitch:+(t[4]||0)}),!0}return !1},Eo.prototype._updateHashUnthrottled=function(){var e=this.getHashString();try{t.window.history.replaceState(t.window.history.state,"",e);}catch(t){}};var To=function(e){function o(o,r,a,n){void 0===n&&(n={});var s=i.mousePos(r.getCanvasContainer(),a),l=r.unproject(s);e.call(this,o,t.extend({point:s,lngLat:l,originalEvent:a},n)),this._defaultPrevented=!1,this.target=r;}e&&(o.__proto__=e),(o.prototype=Object.create(e&&e.prototype)).constructor=o;var r={defaultPrevented:{configurable:!0}};return o.prototype.preventDefault=function(){this._defaultPrevented=!0;},r.defaultPrevented.get=function(){return this._defaultPrevented},Object.defineProperties(o.prototype,r),o}(t.Event),Io=function(e){function o(o,r,a){var n=i.touchPos(r.getCanvasContainer(),a),s=n.map((function(t){return r.unproject(t)})),l=n.reduce((function(t,e,i,o){return t.add(e.div(o.length))}),new t.Point(0,0)),c=r.unproject(l);e.call(this,o,{points:n,point:l,lngLats:s,lngLat:c,originalEvent:a}),this._defaultPrevented=!1;}e&&(o.__proto__=e),(o.prototype=Object.create(e&&e.prototype)).constructor=o;var r={defaultPrevented:{configurable:!0}};return o.prototype.preventDefault=function(){this._defaultPrevented=!0;},r.defaultPrevented.get=function(){return this._defaultPrevented},Object.defineProperties(o.prototype,r),o}(t.Event),Co=function(t){function e(e,i,o){t.call(this,e,{originalEvent:o}),this._defaultPrevented=!1;}t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e;var i={defaultPrevented:{configurable:!0}};return e.prototype.preventDefault=function(){this._defaultPrevented=!0;},i.defaultPrevented.get=function(){return this._defaultPrevented},Object.defineProperties(e.prototype,i),e}(t.Event),So=function(e){this._map=e,this._el=e.getCanvasContainer(),this._delta=0,this._defaultZoomRate=.01,this._wheelZoomRate=1/450,t.bindAll(["_onWheel","_onTimeout","_onScrollFrame","_onScrollFinished"],this);};So.prototype.setZoomRate=function(t){this._defaultZoomRate=t;},So.prototype.setWheelZoomRate=function(t){this._wheelZoomRate=t;},So.prototype.isEnabled=function(){return !!this._enabled},So.prototype.isActive=function(){return !!this._active},So.prototype.isZooming=function(){return !!this._zooming},So.prototype.enable=function(t){this.isEnabled()||(this._enabled=!0,this._aroundCenter=t&&"center"===t.around);},So.prototype.disable=function(){this.isEnabled()&&(this._enabled=!1);},So.prototype.onWheel=function(e){if(this.isEnabled()){var i=e.deltaMode===t.window.WheelEvent.DOM_DELTA_LINE?40*e.deltaY:e.deltaY,o=t.browser.now(),r=o-(this._lastWheelEventTime||0);this._lastWheelEventTime=o,0!==i&&i%4.000244140625==0?this._type="wheel":0!==i&&Math.abs(i)<4?this._type="trackpad":r>400?(this._type=null,this._lastValue=i,this._timeout=setTimeout(this._onTimeout,40,e)):this._type||(this._type=Math.abs(r*i)<200?"trackpad":"wheel",this._timeout&&(clearTimeout(this._timeout),this._timeout=null,i+=this._lastValue)),e.shiftKey&&i&&(i/=4),this._type&&(this._lastWheelEvent=e,this._delta-=i,this.isActive()||this._start(e)),e.preventDefault();}},So.prototype._onTimeout=function(t){this._type="wheel",this._delta-=this._lastValue,this.isActive()||this._start(t);},So.prototype._start=function(e){if(this._delta){this._frameId&&(this._map._cancelRenderFrame(this._frameId),this._frameId=null),this._active=!0,this.isZooming()||(this._zooming=!0,this._map.fire(new t.Event("movestart",{originalEvent:e})),this._map.fire(new t.Event("zoomstart",{originalEvent:e}))),this._finishTimeout&&clearTimeout(this._finishTimeout);var o=i.mousePos(this._el,e);this._around=t.LngLat.convert(this._aroundCenter?this._map.getCenter():this._map.unproject(o)),this._aroundPoint=this._map.transform.locationPoint(this._around),this._frameId||(this._frameId=this._map._requestRenderFrame(this._onScrollFrame));}},So.prototype._onScrollFrame=function(){var e=this;if(this._frameId=null,this.isActive()){var i=this._map.transform;if(0!==this._delta){var o="wheel"===this._type&&Math.abs(this._delta)>4.000244140625?this._wheelZoomRate:this._defaultZoomRate,r=2/(1+Math.exp(-Math.abs(this._delta*o)));this._delta<0&&0!==r&&(r=1/r);var a="number"==typeof this._targetZoom?i.zoomScale(this._targetZoom):i.scale;this._targetZoom=Math.min(i.maxZoom,Math.max(i.minZoom,i.scaleZoom(a*r))),"wheel"===this._type&&(this._startZoom=i.zoom,this._easing=this._smoothOutEasing(200)),this._delta=0;}var n="number"==typeof this._targetZoom?this._targetZoom:i.zoom,s=this._startZoom,l=this._easing,c=!1;if("wheel"===this._type&&s&&l){var u=Math.min((t.browser.now()-this._lastWheelEventTime)/200,1),h=l(u);i.zoom=t.number(s,n,h),u<1?this._frameId||(this._frameId=this._map._requestRenderFrame(this._onScrollFrame)):c=!0;}else i.zoom=n,c=!0;i.setLocationAtPoint(this._around,this._aroundPoint),this._map.fire(new t.Event("move",{originalEvent:this._lastWheelEvent})),this._map.fire(new t.Event("zoom",{originalEvent:this._lastWheelEvent})),c&&(this._active=!1,this._finishTimeout=setTimeout((function(){e._zooming=!1,e._map.fire(new t.Event("zoomend",{originalEvent:e._lastWheelEvent})),e._map.fire(new t.Event("moveend",{originalEvent:e._lastWheelEvent})),delete e._targetZoom;}),200));}},So.prototype._smoothOutEasing=function(e){var i=t.ease;if(this._prevEase){var o=this._prevEase,r=(t.browser.now()-o.start)/o.duration,a=o.easing(r+.01)-o.easing(r),n=.27/Math.sqrt(a*a+1e-4)*.01,s=Math.sqrt(.0729-n*n);i=t.bezier(n,s,.25,1);}return this._prevEase={start:t.browser.now(),duration:e,easing:i},i};var Po=function(e,i){this._map=e,this._el=e.getCanvasContainer(),this._container=e.getContainer(),this._clickTolerance=i.clickTolerance||1,t.bindAll(["_onMouseMove","_onMouseUp","_onKeyDown"],this);};Po.prototype.isEnabled=function(){return !!this._enabled},Po.prototype.isActive=function(){return !!this._active},Po.prototype.enable=function(){this.isEnabled()||(this._enabled=!0);},Po.prototype.disable=function(){this.isEnabled()&&(this._enabled=!1);},Po.prototype.onMouseDown=function(e){this.isEnabled()&&e.shiftKey&&0===e.button&&(t.window.document.addEventListener("mousemove",this._onMouseMove,!1),t.window.document.addEventListener("keydown",this._onKeyDown,!1),t.window.document.addEventListener("mouseup",this._onMouseUp,!1),i.disableDrag(),this._startPos=this._lastPos=i.mousePos(this._el,e),this._active=!0);},Po.prototype._onMouseMove=function(t){var e=i.mousePos(this._el,t);if(!(this._lastPos.equals(e)||!this._box&&e.dist(this._startPos)<this._clickTolerance)){var o=this._startPos;this._lastPos=e,this._box||(this._box=i.create("div","mapboxgl-boxzoom",this._container),this._container.classList.add("mapboxgl-crosshair"),this._fireEvent("boxzoomstart",t));var r=Math.min(o.x,e.x),a=Math.max(o.x,e.x),n=Math.min(o.y,e.y),s=Math.max(o.y,e.y);i.setTransform(this._box,"translate("+r+"px,"+n+"px)"),this._box.style.width=a-r+"px",this._box.style.height=s-n+"px";}},Po.prototype._onMouseUp=function(e){if(0===e.button){var o=this._startPos,r=i.mousePos(this._el,e);this._finish(),i.suppressClick(),o.x===r.x&&o.y===r.y?this._fireEvent("boxzoomcancel",e):this._map.fitScreenCoordinates(o,r,this._map.getBearing(),{linear:!0}).fire(new t.Event("boxzoomend",{originalEvent:e}));}},Po.prototype._onKeyDown=function(t){27===t.keyCode&&(this._finish(),this._fireEvent("boxzoomcancel",t));},Po.prototype._finish=function(){this._active=!1,t.window.document.removeEventListener("mousemove",this._onMouseMove,!1),t.window.document.removeEventListener("keydown",this._onKeyDown,!1),t.window.document.removeEventListener("mouseup",this._onMouseUp,!1),this._container.classList.remove("mapboxgl-crosshair"),this._box&&(i.remove(this._box),this._box=null),i.enableDrag(),delete this._startPos,delete this._lastPos;},Po.prototype._fireEvent=function(e,i){return this._map.fire(new t.Event(e,{originalEvent:i}))};var zo=t.bezier(0,0,.25,1),Lo=function(e,i){this._map=e,this._el=i.element||e.getCanvasContainer(),this._state="disabled",this._button=i.button||"right",this._bearingSnap=i.bearingSnap||0,this._pitchWithRotate=!1!==i.pitchWithRotate,this._clickTolerance=i.clickTolerance||1,t.bindAll(["onMouseDown","_onMouseMove","_onMouseUp","_onBlur","_onDragFrame"],this);};Lo.prototype.isEnabled=function(){return "disabled"!==this._state},Lo.prototype.isActive=function(){return "active"===this._state},Lo.prototype.enable=function(){this.isEnabled()||(this._state="enabled");},Lo.prototype.disable=function(){if(this.isEnabled())switch(this._state){case"active":this._state="disabled",this._unbind(),this._deactivate(),this._fireEvent("rotateend"),this._pitchWithRotate&&this._fireEvent("pitchend"),this._fireEvent("moveend");break;case"pending":this._state="disabled",this._unbind();break;default:this._state="disabled";}},Lo.prototype.onMouseDown=function(e){if("enabled"===this._state){var o="touchstart"===e.type;if(o)this._startTime=Date.now();else if("right"===this._button){if(this._eventButton=i.mouseButton(e),e.altKey||e.metaKey)return;if(this._eventButton!==(e.ctrlKey?0:2))return}else{if(e.ctrlKey||0!==i.mouseButton(e))return;this._eventButton=0;}i.disableDrag(),o?(t.window.document.addEventListener("touchmove",this._onMouseMove,{capture:!0}),t.window.document.addEventListener("touchend",this._onMouseUp)):(t.window.document.addEventListener("mousemove",this._onMouseMove,{capture:!0}),t.window.document.addEventListener("mouseup",this._onMouseUp)),t.window.addEventListener("blur",this._onBlur),this._state="pending",this._inertia=[[t.browser.now(),this._map.getBearing()]],this._startPos=this._prevPos=this._lastPos=i.mousePos(this._el,e),this._center=this._map.transform.centerPoint,e.preventDefault();}},Lo.prototype._onMouseMove=function(t){var e=i.mousePos(this._el,t);this._lastPos.equals(e)||"pending"===this._state&&e.dist(this._startPos)<this._clickTolerance||(this._lastMoveEvent=t,this._lastPos=e,"pending"===this._state&&(this._state="active",this._fireEvent("rotatestart",t),this._fireEvent("movestart",t),this._pitchWithRotate&&this._fireEvent("pitchstart",t)),this._frameId||(this._frameId=this._map._requestRenderFrame(this._onDragFrame)));},Lo.prototype._onDragFrame=function(){this._frameId=null;var e=this._lastMoveEvent;if(e){var i=this._map.transform,o=this._prevPos,r=this._lastPos,a=i.bearing-.8*(o.x-r.x),n=i.pitch- -.5*(o.y-r.y),s=this._inertia,l=s[s.length-1];this._drainInertiaBuffer(),s.push([t.browser.now(),this._map._normalizeBearing(a,l[1])]);var c=i.bearing;if(i.bearing=a,this._pitchWithRotate){var u=i.pitch;i.pitch=n,i.pitch!==u&&this._fireEvent("pitch",e);}i.bearing!==c&&this._fireEvent("rotate",e),this._fireEvent("move",e),delete this._lastMoveEvent,this._prevPos=this._lastPos;}},Lo.prototype._onMouseUp=function(t){var e="touchend"===t.type;if(e&&this._startPos===this._lastPos&&Date.now()-this._startTime<300&&this._el.click(),e||i.mouseButton(t)===this._eventButton)switch(this._state){case"active":this._state="enabled",i.suppressClick(),this._unbind(),this._deactivate(),this._inertialRotate(t);break;case"pending":this._state="enabled",this._unbind();}},Lo.prototype._onBlur=function(t){switch(this._state){case"active":this._state="enabled",this._unbind(),this._deactivate(),this._fireEvent("rotateend",t),this._pitchWithRotate&&this._fireEvent("pitchend",t),this._fireEvent("moveend",t);break;case"pending":this._state="enabled",this._unbind();}},Lo.prototype._unbind=function(){t.window.document.removeEventListener("mousemove",this._onMouseMove,{capture:!0}),t.window.document.removeEventListener("mouseup",this._onMouseUp),t.window.document.removeEventListener("touchmove",this._onMouseMove,{capture:!0}),t.window.document.removeEventListener("touchend",this._onMouseUp),t.window.removeEventListener("blur",this._onBlur),i.enableDrag();},Lo.prototype._deactivate=function(){this._frameId&&(this._map._cancelRenderFrame(this._frameId),this._frameId=null),delete this._lastMoveEvent,delete this._startPos,delete this._prevPos,delete this._lastPos;},Lo.prototype._inertialRotate=function(t){var e=this;this._fireEvent("rotateend",t),this._drainInertiaBuffer();var i=this._map,o=i.getBearing(),r=this._inertia,a=function(){Math.abs(o)<e._bearingSnap?i.resetNorth({noMoveStart:!0},{originalEvent:t}):e._fireEvent("moveend",t),e._pitchWithRotate&&e._fireEvent("pitchend",t);};if(r.length<2)a();else{var n=r[0],s=r[r.length-1],l=i._normalizeBearing(o,r[r.length-2][1]),c=s[1]-n[1],u=c<0?-1:1,h=(s[0]-n[0])/1e3;if(0!==c&&0!==h){var p=Math.abs(c*(.25/h));p>180&&(p=180);var d=p/180;l+=u*p*(d/2),Math.abs(i._normalizeBearing(l,0))<this._bearingSnap&&(l=i._normalizeBearing(0,l)),i.rotateTo(l,{duration:1e3*d,easing:zo,noMoveStart:!0},{originalEvent:t});}else a();}},Lo.prototype._fireEvent=function(e,i){return this._map.fire(new t.Event(e,i?{originalEvent:i}:{}))},Lo.prototype._drainInertiaBuffer=function(){for(var e=this._inertia,i=t.browser.now();e.length>0&&i-e[0][0]>160;)e.shift();};var Mo={linearity:.3,easing:t.bezier(0,0,.3,1),maxSpeed:1400,deceleration:2500},Do=function(e,i){this._map=e,this._el=e.getCanvasContainer(),this._state="disabled",this._clickTolerance=i.clickTolerance||1,this._inertiaOptions=Mo,t.bindAll(["_onMove","_onMouseUp","_onTouchEnd","_onBlur","_onDragFrame"],this);};Do.prototype.isEnabled=function(){return "disabled"!==this._state},Do.prototype.isActive=function(){return "active"===this._state},Do.prototype.enable=function(e){this.isEnabled()||(this._el.classList.add("mapboxgl-touch-drag-pan"),this._state="enabled",this._inertiaOptions=t.extend(Mo,e));},Do.prototype.disable=function(){if(this.isEnabled())switch(this._el.classList.remove("mapboxgl-touch-drag-pan"),this._state){case"active":this._state="disabled",this._unbind(),this._deactivate(),this._fireEvent("dragend"),this._fireEvent("moveend");break;case"pending":this._state="disabled",this._unbind();break;default:this._state="disabled";}},Do.prototype.onMouseDown=function(e){"enabled"===this._state&&(e.ctrlKey||0!==i.mouseButton(e)||(i.addEventListener(t.window.document,"mousemove",this._onMove,{capture:!0}),i.addEventListener(t.window.document,"mouseup",this._onMouseUp),this._start(e)));},Do.prototype.onTouchStart=function(e){this.isEnabled()&&(e.touches&&e.touches.length>1&&("pending"===this._state||"active"===this._state)||(i.addEventListener(t.window.document,"touchmove",this._onMove,{capture:!0,passive:!1}),i.addEventListener(t.window.document,"touchend",this._onTouchEnd),this._start(e)));},Do.prototype._start=function(e){t.window.addEventListener("blur",this._onBlur),this._state="pending",this._startPos=this._mouseDownPos=this._prevPos=this._lastPos=i.mousePos(this._el,e),this._startTouch=this._lastTouch=t.window.TouchEvent&&e instanceof t.window.TouchEvent?i.touchPos(this._el,e):null,this._inertia=[[t.browser.now(),this._startPos]];},Do.prototype._touchesMatch=function(t,e){return !(!t||!e||t.length!==e.length)&&t.every((function(t,i){return e[i]===t}))},Do.prototype._onMove=function(e){e.preventDefault();var o=t.window.TouchEvent&&e instanceof t.window.TouchEvent?i.touchPos(this._el,e):null,r=i.mousePos(this._el,e);(o?this._touchesMatch(this._lastTouch,o):this._lastPos.equals(r))||"pending"===this._state&&r.dist(this._mouseDownPos)<this._clickTolerance||(this._lastMoveEvent=e,this._lastPos=r,this._lastTouch=o,this._drainInertiaBuffer(),this._inertia.push([t.browser.now(),this._lastPos]),"pending"===this._state&&(this._state="active",this._shouldStart=!0),this._frameId||(this._frameId=this._map._requestRenderFrame(this._onDragFrame)));},Do.prototype._onDragFrame=function(){this._frameId=null;var t=this._lastMoveEvent;if(t)if(this._map.touchZoomRotate.isActive())this._abort(t);else if(this._shouldStart&&(this._fireEvent("dragstart",t),this._fireEvent("movestart",t),this._shouldStart=!1),this.isActive()){var e=this._map.transform;e.setLocationAtPoint(e.pointLocation(this._prevPos),this._lastPos),this._fireEvent("drag",t),this._fireEvent("move",t),this._prevPos=this._lastPos,delete this._lastMoveEvent;}},Do.prototype._onMouseUp=function(t){if(0===i.mouseButton(t))switch(this._state){case"active":this._state="enabled",i.suppressClick(),this._unbind(),this._deactivate(),this._inertialPan(t);break;case"pending":this._state="enabled",this._unbind();}},Do.prototype._onTouchEnd=function(t){if(t.touches&&0!==t.touches.length)switch(this._state){case"pending":case"active":break;case"enabled":this.onTouchStart(t);}else switch(this._state){case"active":this._state="enabled",this._unbind(),this._deactivate(),this._inertialPan(t);break;case"pending":this._state="enabled",this._unbind();break;case"enabled":this._unbind();}},Do.prototype._abort=function(e){switch(this._state){case"active":this._state="enabled",this._shouldStart||(this._fireEvent("dragend",e),this._fireEvent("moveend",e)),this._unbind(),this._deactivate(),t.window.TouchEvent&&e instanceof t.window.TouchEvent&&e.touches.length>1&&i.addEventListener(t.window.document,"touchend",this._onTouchEnd);break;case"pending":this._state="enabled",this._unbind();break;case"enabled":this._unbind();}},Do.prototype._onBlur=function(t){this._abort(t);},Do.prototype._unbind=function(){i.removeEventListener(t.window.document,"touchmove",this._onMove,{capture:!0,passive:!1}),i.removeEventListener(t.window.document,"touchend",this._onTouchEnd),i.removeEventListener(t.window.document,"mousemove",this._onMove,{capture:!0}),i.removeEventListener(t.window.document,"mouseup",this._onMouseUp),i.removeEventListener(t.window,"blur",this._onBlur);},Do.prototype._deactivate=function(){this._frameId&&(this._map._cancelRenderFrame(this._frameId),this._frameId=null),delete this._lastMoveEvent,delete this._startPos,delete this._prevPos,delete this._mouseDownPos,delete this._lastPos,delete this._startTouch,delete this._lastTouch,delete this._shouldStart;},Do.prototype._inertialPan=function(t){this._fireEvent("dragend",t),this._drainInertiaBuffer();var e=this._inertia;if(e.length<2)this._fireEvent("moveend",t);else{var i=e[e.length-1],o=e[0],r=i[1].sub(o[1]),a=(i[0]-o[0])/1e3;if(0===a||i[1].equals(o[1]))this._fireEvent("moveend",t);else{var n=this._inertiaOptions,s=n.linearity,l=n.easing,c=n.maxSpeed,u=n.deceleration,h=r.mult(s/a),p=h.mag();p>c&&(p=c,h._unit()._mult(p));var d=p/(u*s),_=h.mult(-d/2);this._map.panBy(_,{duration:1e3*d,easing:l,noMoveStart:!0},{originalEvent:t});}}},Do.prototype._fireEvent=function(e,i){return this._map.fire(new t.Event(e,i?{originalEvent:i}:{}))},Do.prototype._drainInertiaBuffer=function(){for(var e=this._inertia,i=t.browser.now();e.length>0&&i-e[0][0]>160;)e.shift();};var Ao=function(e){this._map=e,this._el=e.getCanvasContainer(),t.bindAll(["_onKeyDown"],this);};function Ro(t){return t*(2-t)}Ao.prototype.isEnabled=function(){return !!this._enabled},Ao.prototype.enable=function(){this.isEnabled()||(this._el.addEventListener("keydown",this._onKeyDown,!1),this._enabled=!0);},Ao.prototype.disable=function(){this.isEnabled()&&(this._el.removeEventListener("keydown",this._onKeyDown),this._enabled=!1);},Ao.prototype._onKeyDown=function(t){if(!(t.altKey||t.ctrlKey||t.metaKey)){var e=0,i=0,o=0,r=0,a=0;switch(t.keyCode){case 61:case 107:case 171:case 187:e=1;break;case 189:case 109:case 173:e=-1;break;case 37:t.shiftKey?i=-1:(t.preventDefault(),r=-1);break;case 39:t.shiftKey?i=1:(t.preventDefault(),r=1);break;case 38:t.shiftKey?o=1:(t.preventDefault(),a=-1);break;case 40:t.shiftKey?o=-1:(a=1,t.preventDefault());break;default:return}var n=this._map,s=n.getZoom(),l={duration:300,delayEndEvents:500,easing:Ro,zoom:e?Math.round(s)+e*(t.shiftKey?2:1):s,bearing:n.getBearing()+15*i,pitch:n.getPitch()+10*o,offset:[100*-r,100*-a],center:n.getCenter()};n.easeTo(l,{originalEvent:t});}};var ko=function(e){this._map=e,t.bindAll(["_onDblClick","_onZoomEnd"],this);};ko.prototype.isEnabled=function(){return !!this._enabled},ko.prototype.isActive=function(){return !!this._active},ko.prototype.enable=function(){this.isEnabled()||(this._enabled=!0);},ko.prototype.disable=function(){this.isEnabled()&&(this._enabled=!1);},ko.prototype.onTouchStart=function(t){var e=this;if(this.isEnabled()&&!(t.points.length>1))if(this._tapped){var i=this._tappedPoint;if(i&&i.dist(t.points[0])<=30){t.originalEvent.preventDefault();var o=function(){e._tapped&&e._zoom(t),e._map.off("touchcancel",r),e._resetTapped();},r=function(){e._map.off("touchend",o),e._resetTapped();};this._map.once("touchend",o),this._map.once("touchcancel",r);}else this._resetTapped();}else this._tappedPoint=t.points[0],this._tapped=setTimeout((function(){e._tapped=null,e._tappedPoint=null;}),300);},ko.prototype._resetTapped=function(){clearTimeout(this._tapped),this._tapped=null,this._tappedPoint=null;},ko.prototype.onDblClick=function(t){this.isEnabled()&&(t.originalEvent.preventDefault(),this._zoom(t));},ko.prototype._zoom=function(t){this._active=!0,this._map.on("zoomend",this._onZoomEnd),this._map.zoomTo(this._map.getZoom()+(t.originalEvent.shiftKey?-1:1),{around:t.lngLat},t);},ko.prototype._onZoomEnd=function(){this._active=!1,this._map.off("zoomend",this._onZoomEnd);};var Bo=t.bezier(0,0,.15,1),Oo=function(e){this._map=e,this._el=e.getCanvasContainer(),t.bindAll(["_onMove","_onEnd","_onTouchFrame"],this);};Oo.prototype.isEnabled=function(){return !!this._enabled},Oo.prototype.enable=function(t){this.isEnabled()||(this._el.classList.add("mapboxgl-touch-zoom-rotate"),this._enabled=!0,this._aroundCenter=!!t&&"center"===t.around);},Oo.prototype.disable=function(){this.isEnabled()&&(this._el.classList.remove("mapboxgl-touch-zoom-rotate"),this._enabled=!1);},Oo.prototype.disableRotation=function(){this._rotationDisabled=!0;},Oo.prototype.enableRotation=function(){this._rotationDisabled=!1;},Oo.prototype.isActive=function(){return this.isEnabled()&&!!this._gestureIntent},Oo.prototype.onStart=function(e){if(this.isEnabled()&&2===e.touches.length){var o=i.mousePos(this._el,e.touches[0]),r=i.mousePos(this._el,e.touches[1]),a=o.add(r).div(2);this._startVec=o.sub(r),this._startAround=this._map.transform.pointLocation(a),this._gestureIntent=void 0,this._inertia=[],i.addEventListener(t.window.document,"touchmove",this._onMove,{passive:!1}),i.addEventListener(t.window.document,"touchend",this._onEnd);}},Oo.prototype._getTouchEventData=function(t){var e=i.mousePos(this._el,t.touches[0]),o=i.mousePos(this._el,t.touches[1]),r=e.sub(o);return {vec:r,center:e.add(o).div(2),scale:r.mag()/this._startVec.mag(),bearing:this._rotationDisabled?0:180*r.angleWith(this._startVec)/Math.PI}},Oo.prototype._onMove=function(e){if(2===e.touches.length){var i=this._getTouchEventData(e),o=i.vec,r=i.scale,a=i.bearing;if(!this._gestureIntent){var n=this._rotationDisabled&&1!==r||Math.abs(1-r)>.15;Math.abs(a)>10?this._gestureIntent="rotate":n&&(this._gestureIntent="zoom"),this._gestureIntent&&(this._map.fire(new t.Event(this._gestureIntent+"start",{originalEvent:e})),this._map.fire(new t.Event("movestart",{originalEvent:e})),this._startVec=o);}this._lastTouchEvent=e,this._frameId||(this._frameId=this._map._requestRenderFrame(this._onTouchFrame)),e.preventDefault();}},Oo.prototype._onTouchFrame=function(){this._frameId=null;var e=this._gestureIntent;if(e){var i=this._map.transform;this._startScale||(this._startScale=i.scale,this._startBearing=i.bearing);var o=this._getTouchEventData(this._lastTouchEvent),r=o.center,a=o.bearing,n=o.scale,s=i.pointLocation(r),l=i.locationPoint(s);"rotate"===e&&(i.bearing=this._startBearing+a),i.zoom=i.scaleZoom(this._startScale*n),i.setLocationAtPoint(this._startAround,l),this._map.fire(new t.Event(e,{originalEvent:this._lastTouchEvent})),this._map.fire(new t.Event("move",{originalEvent:this._lastTouchEvent})),this._drainInertiaBuffer(),this._inertia.push([t.browser.now(),n,r]);}},Oo.prototype._onEnd=function(e){i.removeEventListener(t.window.document,"touchmove",this._onMove,{passive:!1}),i.removeEventListener(t.window.document,"touchend",this._onEnd);var o=this._gestureIntent,r=this._startScale;if(this._frameId&&(this._map._cancelRenderFrame(this._frameId),this._frameId=null),delete this._gestureIntent,delete this._startScale,delete this._startBearing,delete this._lastTouchEvent,o){this._map.fire(new t.Event(o+"end",{originalEvent:e})),this._drainInertiaBuffer();var a=this._inertia,n=this._map;if(a.length<2)n.snapToNorth({},{originalEvent:e});else{var s=a[a.length-1],l=a[0],c=n.transform.scaleZoom(r*s[1]),u=n.transform.scaleZoom(r*l[1]),h=(s[0]-l[0])/1e3,p=s[2];if(0!==h&&c!==u){var d=.15*(c-u)/h;Math.abs(d)>2.5&&(d=d>0?2.5:-2.5);var _=1e3*Math.abs(d/(12*.15));n.easeTo({zoom:c+d*_/2e3,duration:_,easing:Bo,around:this._aroundCenter?n.getCenter():n.unproject(p),noMoveStart:!0},{originalEvent:e});}else n.snapToNorth({},{originalEvent:e});}}},Oo.prototype._drainInertiaBuffer=function(){for(var e=this._inertia,i=t.browser.now();e.length>2&&i-e[0][0]>160;)e.shift();};var Fo={scrollZoom:So,boxZoom:Po,dragRotate:Lo,dragPan:Do,keyboard:Ao,doubleClickZoom:ko,touchZoomRotate:Oo},Uo=function(e){function i(i,o){e.call(this),this._moving=!1,this._zooming=!1,this.transform=i,this._bearingSnap=o.bearingSnap,t.bindAll(["_renderFrameCallback"],this);}return e&&(i.__proto__=e),(i.prototype=Object.create(e&&e.prototype)).constructor=i,i.prototype.getCenter=function(){return new t.LngLat(this.transform.center.lng,this.transform.center.lat)},i.prototype.setCenter=function(t,e){return this.jumpTo({center:t},e)},i.prototype.panBy=function(e,i,o){return e=t.Point.convert(e).mult(-1),this.panTo(this.transform.center,t.extend({offset:e},i),o)},i.prototype.panTo=function(e,i,o){return this.easeTo(t.extend({center:e},i),o)},i.prototype.getZoom=function(){return this.transform.zoom},i.prototype.setZoom=function(t,e){return this.jumpTo({zoom:t},e),this},i.prototype.zoomTo=function(e,i,o){return this.easeTo(t.extend({zoom:e},i),o)},i.prototype.zoomIn=function(t,e){return this.zoomTo(this.getZoom()+1,t,e),this},i.prototype.zoomOut=function(t,e){return this.zoomTo(this.getZoom()-1,t,e),this},i.prototype.getBearing=function(){return this.transform.bearing},i.prototype.setBearing=function(t,e){return this.jumpTo({bearing:t},e),this},i.prototype.getPadding=function(){return this.transform.padding},i.prototype.setPadding=function(t,e){return this.jumpTo({padding:t},e),this},i.prototype.rotateTo=function(e,i,o){return this.easeTo(t.extend({bearing:e},i),o)},i.prototype.resetNorth=function(e,i){return this.rotateTo(0,t.extend({duration:1e3},e),i),this},i.prototype.resetNorthPitch=function(e,i){return this.easeTo(t.extend({bearing:0,pitch:0,duration:1e3},e),i),this},i.prototype.snapToNorth=function(t,e){return Math.abs(this.getBearing())<this._bearingSnap?this.resetNorth(t,e):this},i.prototype.getPitch=function(){return this.transform.pitch},i.prototype.setPitch=function(t,e){return this.jumpTo({pitch:t},e),this},i.prototype.cameraForBounds=function(e,i){return e=t.LngLatBounds.convert(e),this._cameraForBoxAndBearing(e.getNorthWest(),e.getSouthEast(),0,i)},i.prototype._cameraForBoxAndBearing=function(e,i,o,r){var a={top:0,bottom:0,right:0,left:0};if("number"==typeof(r=t.extend({padding:a,offset:[0,0],maxZoom:this.transform.maxZoom},r)).padding){var n=r.padding;r.padding={top:n,bottom:n,right:n,left:n};}r.padding=t.extend(a,r.padding);var s=this.transform,l=s.padding,c=s.project(t.LngLat.convert(e)),u=s.project(t.LngLat.convert(i)),h=c.rotate(-o*Math.PI/180),p=u.rotate(-o*Math.PI/180),d=new t.Point(Math.max(h.x,p.x),Math.max(h.y,p.y)),_=new t.Point(Math.min(h.x,p.x),Math.min(h.y,p.y)),f=d.sub(_),m=(s.width-(l.left+l.right+r.padding.left+r.padding.right))/f.x,g=(s.height-(l.top+l.bottom+r.padding.top+r.padding.bottom))/f.y;if(!(g<0||m<0)){var v=Math.min(s.scaleZoom(s.scale*Math.min(m,g)),r.maxZoom),y=t.Point.convert(r.offset),x=new t.Point(y.x+(r.padding.left-r.padding.right)/2,y.y+(r.padding.top-r.padding.bottom)/2).mult(s.scale/s.zoomScale(v));return {center:s.unproject(c.add(u).div(2).sub(x)),zoom:v,bearing:o}}t.warnOnce("Map cannot fit within canvas with the given bounds, padding, and/or offset.");},i.prototype.fitBounds=function(t,e,i){return this._fitInternal(this.cameraForBounds(t,e),e,i)},i.prototype.fitScreenCoordinates=function(e,i,o,r,a){return this._fitInternal(this._cameraForBoxAndBearing(this.transform.pointLocation(t.Point.convert(e)),this.transform.pointLocation(t.Point.convert(i)),o,r),r,a)},i.prototype._fitInternal=function(e,i,o){return e?(i=t.extend(e,i)).linear?this.easeTo(i,o):this.flyTo(i,o):this},i.prototype.jumpTo=function(e,i){this.stop();var o=this.transform,r=!1,a=!1,n=!1;return "zoom"in e&&o.zoom!==+e.zoom&&(r=!0,o.zoom=+e.zoom),void 0!==e.center&&(o.center=t.LngLat.convert(e.center)),"bearing"in e&&o.bearing!==+e.bearing&&(a=!0,o.bearing=+e.bearing),"pitch"in e&&o.pitch!==+e.pitch&&(n=!0,o.pitch=+e.pitch),null==e.padding||o.isPaddingEqual(e.padding)||(o.padding=e.padding),this.fire(new t.Event("movestart",i)).fire(new t.Event("move",i)),r&&this.fire(new t.Event("zoomstart",i)).fire(new t.Event("zoom",i)).fire(new t.Event("zoomend",i)),a&&this.fire(new t.Event("rotatestart",i)).fire(new t.Event("rotate",i)).fire(new t.Event("rotateend",i)),n&&this.fire(new t.Event("pitchstart",i)).fire(new t.Event("pitch",i)).fire(new t.Event("pitchend",i)),this.fire(new t.Event("moveend",i))},i.prototype.easeTo=function(e,i){var o=this;this.stop(),(!1===(e=t.extend({offset:[0,0],duration:500,easing:t.ease},e)).animate||!e.essential&&t.browser.prefersReducedMotion)&&(e.duration=0);var r=this.transform,a=this.getZoom(),n=this.getBearing(),s=this.getPitch(),l=this.getPadding(),c="zoom"in e?+e.zoom:a,u="bearing"in e?this._normalizeBearing(e.bearing,n):n,h="pitch"in e?+e.pitch:s,p="padding"in e?e.padding:r.padding,d=t.Point.convert(e.offset),_=r.centerPoint.add(d),f=r.pointLocation(_),m=t.LngLat.convert(e.center||f);this._normalizeCenter(m);var g,v,y=r.project(f),x=r.project(m).sub(y),b=r.zoomScale(c-a);return e.around&&(g=t.LngLat.convert(e.around),v=r.locationPoint(g)),this._zooming=c!==a,this._rotating=n!==u,this._pitching=h!==s,this._padding=!r.isPaddingEqual(p),this._prepareEase(i,e.noMoveStart),clearTimeout(this._easeEndTimeoutID),this._ease((function(e){if(o._zooming&&(r.zoom=t.number(a,c,e)),o._rotating&&(r.bearing=t.number(n,u,e)),o._pitching&&(r.pitch=t.number(s,h,e)),o._padding&&(r.interpolatePadding(l,p,e),_=r.centerPoint.add(d)),g)r.setLocationAtPoint(g,v);else{var f=r.zoomScale(r.zoom-a),m=c>a?Math.min(2,b):Math.max(.5,b),w=Math.pow(m,1-e),E=r.unproject(y.add(x.mult(e*w)).mult(f));r.setLocationAtPoint(r.renderWorldCopies?E.wrap():E,_);}o._fireMoveEvents(i);}),(function(){e.delayEndEvents?o._easeEndTimeoutID=setTimeout((function(){return o._afterEase(i)}),e.delayEndEvents):o._afterEase(i);}),e),this},i.prototype._prepareEase=function(e,i){this._moving=!0,i||this.fire(new t.Event("movestart",e)),this._zooming&&this.fire(new t.Event("zoomstart",e)),this._rotating&&this.fire(new t.Event("rotatestart",e)),this._pitching&&this.fire(new t.Event("pitchstart",e));},i.prototype._fireMoveEvents=function(e){this.fire(new t.Event("move",e)),this._zooming&&this.fire(new t.Event("zoom",e)),this._rotating&&this.fire(new t.Event("rotate",e)),this._pitching&&this.fire(new t.Event("pitch",e));},i.prototype._afterEase=function(e){var i=this._zooming,o=this._rotating,r=this._pitching;this._moving=!1,this._zooming=!1,this._rotating=!1,this._pitching=!1,this._padding=!1,i&&this.fire(new t.Event("zoomend",e)),o&&this.fire(new t.Event("rotateend",e)),r&&this.fire(new t.Event("pitchend",e)),this.fire(new t.Event("moveend",e));},i.prototype.flyTo=function(e,i){var o=this;if(!e.essential&&t.browser.prefersReducedMotion){var r=t.pick(e,["center","zoom","bearing","pitch","around"]);return this.jumpTo(r,i)}this.stop(),e=t.extend({offset:[0,0],speed:1.2,curve:1.42,easing:t.ease},e);var a=this.transform,n=this.getZoom(),s=this.getBearing(),l=this.getPitch(),c=this.getPadding(),u="zoom"in e?t.clamp(+e.zoom,a.minZoom,a.maxZoom):n,h="bearing"in e?this._normalizeBearing(e.bearing,s):s,p="pitch"in e?+e.pitch:l,d="padding"in e?e.padding:a.padding,_=a.zoomScale(u-n),f=t.Point.convert(e.offset),m=a.centerPoint.add(f),g=a.pointLocation(m),v=t.LngLat.convert(e.center||g);this._normalizeCenter(v);var y=a.project(g),x=a.project(v).sub(y),b=e.curve,w=Math.max(a.width,a.height),E=w/_,T=x.mag();if("minZoom"in e){var I=t.clamp(Math.min(e.minZoom,n,u),a.minZoom,a.maxZoom),C=w/a.zoomScale(I-n);b=Math.sqrt(C/T*2);}var S=b*b;function P(t){var e=(E*E-w*w+(t?-1:1)*S*S*T*T)/(2*(t?E:w)*S*T);return Math.log(Math.sqrt(e*e+1)-e)}function z(t){return (Math.exp(t)-Math.exp(-t))/2}function L(t){return (Math.exp(t)+Math.exp(-t))/2}var M=P(0),D=function(t){return L(M)/L(M+b*t)},A=function(t){return w*((L(M)*(z(e=M+b*t)/L(e))-z(M))/S)/T;var e;},R=(P(1)-M)/b;if(Math.abs(T)<1e-6||!isFinite(R)){if(Math.abs(w-E)<1e-6)return this.easeTo(e,i);var k=E<w?-1:1;R=Math.abs(Math.log(E/w))/b,A=function(){return 0},D=function(t){return Math.exp(k*b*t)};}return e.duration="duration"in e?+e.duration:1e3*R/("screenSpeed"in e?+e.screenSpeed/b:+e.speed),e.maxDuration&&e.duration>e.maxDuration&&(e.duration=0),this._zooming=!0,this._rotating=s!==h,this._pitching=p!==l,this._padding=!a.isPaddingEqual(d),this._prepareEase(i,!1),this._ease((function(e){var r=e*R,_=1/D(r);a.zoom=1===e?u:n+a.scaleZoom(_),o._rotating&&(a.bearing=t.number(s,h,e)),o._pitching&&(a.pitch=t.number(l,p,e)),o._padding&&(a.interpolatePadding(c,d,e),m=a.centerPoint.add(f));var g=1===e?v:a.unproject(y.add(x.mult(A(r))).mult(_));a.setLocationAtPoint(a.renderWorldCopies?g.wrap():g,m),o._fireMoveEvents(i);}),(function(){return o._afterEase(i)}),e),this},i.prototype.isEasing=function(){return !!this._easeFrameId},i.prototype.stop=function(){if(this._easeFrameId&&(this._cancelRenderFrame(this._easeFrameId),delete this._easeFrameId,delete this._onEaseFrame),this._onEaseEnd){var t=this._onEaseEnd;delete this._onEaseEnd,t.call(this);}return this},i.prototype._ease=function(e,i,o){!1===o.animate||0===o.duration?(e(1),i()):(this._easeStart=t.browser.now(),this._easeOptions=o,this._onEaseFrame=e,this._onEaseEnd=i,this._easeFrameId=this._requestRenderFrame(this._renderFrameCallback));},i.prototype._renderFrameCallback=function(){var e=Math.min((t.browser.now()-this._easeStart)/this._easeOptions.duration,1);this._onEaseFrame(this._easeOptions.easing(e)),e<1?this._easeFrameId=this._requestRenderFrame(this._renderFrameCallback):this.stop();},i.prototype._normalizeBearing=function(e,i){e=t.wrap(e,-180,180);var o=Math.abs(e-i);return Math.abs(e-360-i)<o&&(e-=360),Math.abs(e+360-i)<o&&(e+=360),e},i.prototype._normalizeCenter=function(t){var e=this.transform;if(e.renderWorldCopies&&!e.lngRange){var i=t.lng-e.center.lng;t.lng+=i>180?-360:i<-180?360:0;}},i}(t.Evented),No=function(e){void 0===e&&(e={}),this.options=e,t.bindAll(["_updateEditLink","_updateData","_updateCompact"],this);};No.prototype.getDefaultPosition=function(){return "bottom-right"},No.prototype.onAdd=function(t){var e=this.options&&this.options.compact;return this._map=t,this._container=i.create("div","mapboxgl-ctrl mapboxgl-ctrl-attrib"),this._innerContainer=i.create("div","mapboxgl-ctrl-attrib-inner",this._container),e&&this._container.classList.add("mapboxgl-compact"),this._updateAttributions(),this._updateEditLink(),this._map.on("styledata",this._updateData),this._map.on("sourcedata",this._updateData),this._map.on("moveend",this._updateEditLink),void 0===e&&(this._map.on("resize",this._updateCompact),this._updateCompact()),this._container},No.prototype.onRemove=function(){i.remove(this._container),this._map.off("styledata",this._updateData),this._map.off("sourcedata",this._updateData),this._map.off("moveend",this._updateEditLink),this._map.off("resize",this._updateCompact),this._map=void 0,this._attribHTML=void 0;},No.prototype._updateEditLink=function(){var e=this._editLink;e||(e=this._editLink=this._container.querySelector(".mapbox-improve-map"));var i=[{key:"owner",value:this.styleOwner},{key:"id",value:this.styleId},{key:"access_token",value:this._map._requestManager._customAccessToken||t.config.ACCESS_TOKEN}];if(e){var o=i.reduce((function(t,e,o){return e.value&&(t+=e.key+"="+e.value+(o<i.length-1?"&":"")),t}),"?");e.href=t.config.FEEDBACK_URL+"/"+o+(this._map._hash?this._map._hash.getHashString(!0):""),e.rel="noopener nofollow";}},No.prototype._updateData=function(t){!t||"metadata"!==t.sourceDataType&&"style"!==t.dataType||(this._updateAttributions(),this._updateEditLink());},No.prototype._updateAttributions=function(){if(this._map.style){var t=[];if(this.options.customAttribution&&(Array.isArray(this.options.customAttribution)?t=t.concat(this.options.customAttribution.map((function(t){return "string"!=typeof t?"":t}))):"string"==typeof this.options.customAttribution&&t.push(this.options.customAttribution)),this._map.style.stylesheet){var e=this._map.style.stylesheet;this.styleOwner=e.owner,this.styleId=e.id;}var i=this._map.style.sourceCaches;for(var o in i){var r=i[o];if(r.used){var a=r.getSource();a.attribution&&t.indexOf(a.attribution)<0&&t.push(a.attribution);}}t.sort((function(t,e){return t.length-e.length}));var n=(t=t.filter((function(e,i){for(var o=i+1;o<t.length;o++)if(t[o].indexOf(e)>=0)return !1;return !0}))).join(" | ");n!==this._attribHTML&&(this._attribHTML=n,t.length?(this._innerContainer.innerHTML=n,this._container.classList.remove("mapboxgl-attrib-empty")):this._container.classList.add("mapboxgl-attrib-empty"),this._editLink=null);}},No.prototype._updateCompact=function(){this._map.getCanvasContainer().offsetWidth<=640?this._container.classList.add("mapboxgl-compact"):this._container.classList.remove("mapboxgl-compact");};var Zo=function(){t.bindAll(["_updateLogo"],this),t.bindAll(["_updateCompact"],this);};Zo.prototype.onAdd=function(t){this._map=t,this._container=i.create("div","mapboxgl-ctrl");var e=i.create("a","mapboxgl-ctrl-logo");return e.target="_blank",e.rel="noopener nofollow",e.href="https://www.mapbox.com/",e.setAttribute("aria-label",this._map._getUIString("LogoControl.Title")),e.setAttribute("rel","noopener nofollow"),this._container.appendChild(e),this._container.style.display="none",this._map.on("sourcedata",this._updateLogo),this._updateLogo(),this._map.on("resize",this._updateCompact),this._updateCompact(),this._container},Zo.prototype.onRemove=function(){i.remove(this._container),this._map.off("sourcedata",this._updateLogo),this._map.off("resize",this._updateCompact);},Zo.prototype.getDefaultPosition=function(){return "bottom-left"},Zo.prototype._updateLogo=function(t){t&&"metadata"!==t.sourceDataType||(this._container.style.display=this._logoRequired()?"block":"none");},Zo.prototype._logoRequired=function(){if(this._map.style){var t=this._map.style.sourceCaches;for(var e in t)if(t[e].getSource().mapbox_logo)return !0;return !1}},Zo.prototype._updateCompact=function(){var t=this._container.children;if(t.length){var e=t[0];this._map.getCanvasContainer().offsetWidth<250?e.classList.add("mapboxgl-compact"):e.classList.remove("mapboxgl-compact");}};var qo=function(){this._queue=[],this._id=0,this._cleared=!1,this._currentlyRunning=!1;};qo.prototype.add=function(t){var e=++this._id;return this._queue.push({callback:t,id:e,cancelled:!1}),e},qo.prototype.remove=function(t){for(var e=this._currentlyRunning,i=0,o=e?this._queue.concat(e):this._queue;i<o.length;i+=1){var r=o[i];if(r.id===t)return void(r.cancelled=!0)}},qo.prototype.run=function(){var t=this._currentlyRunning=this._queue;this._queue=[];for(var e=0,i=t;e<i.length;e+=1){var o=i[e];if(!o.cancelled&&(o.callback(),this._cleared))break}this._cleared=!1,this._currentlyRunning=!1;},qo.prototype.clear=function(){this._currentlyRunning&&(this._cleared=!0),this._queue=[];};var jo={"FullscreenControl.Enter":"Enter fullscreen","FullscreenControl.Exit":"Exit fullscreen","GeolocateControl.FindMyLocation":"Find my location","GeolocateControl.LocationNotAvailable":"Location not available","LogoControl.Title":"Mapbox logo","NavigationControl.ResetBearing":"Reset bearing to north","NavigationControl.ZoomIn":"Zoom in","NavigationControl.ZoomOut":"Zoom out","ScaleControl.Feet":"ft","ScaleControl.Meters":"m","ScaleControl.Kilometers":"km","ScaleControl.Miles":"mi","ScaleControl.NauticalMiles":"nm"},Vo=t.window.HTMLImageElement,Go=t.window.HTMLElement,Wo=t.window.ImageBitmap,Xo=0,Ho=60,Ko={center:[0,0],zoom:0,bearing:0,pitch:0,minZoom:-2,maxZoom:22,minPitch:Xo,maxPitch:Ho,interactive:!0,scrollZoom:!0,boxZoom:!0,dragRotate:!0,dragPan:!0,keyboard:!0,doubleClickZoom:!0,touchZoomRotate:!0,bearingSnap:7,clickTolerance:3,hash:!1,attributionControl:!0,failIfMajorPerformanceCaveat:!1,preserveDrawingBuffer:!1,trackResize:!0,renderWorldCopies:!0,refreshExpiredTiles:!0,maxTileCacheSize:null,localIdeographFontFamily:"sans-serif",transformRequest:null,accessToken:null,fadeDuration:300,crossSourceCollisions:!0},Yo=function(o){function r(e){var r=this;if(null!=(e=t.extend({},Ko,e)).minZoom&&null!=e.maxZoom&&e.minZoom>e.maxZoom)throw new Error("maxZoom must be greater than or equal to minZoom");if(null!=e.minPitch&&null!=e.maxPitch&&e.minPitch>e.maxPitch)throw new Error("maxPitch must be greater than or equal to minPitch");if(null!=e.minPitch&&e.minPitch<Xo)throw new Error("minPitch must be greater than or equal to "+Xo);if(null!=e.maxPitch&&e.maxPitch>Ho)throw new Error("maxPitch must be less than or equal to "+Ho);var a=new bo(e.minZoom,e.maxZoom,e.minPitch,e.maxPitch,e.renderWorldCopies);if(o.call(this,a,e),this._interactive=e.interactive,this._maxTileCacheSize=e.maxTileCacheSize,this._failIfMajorPerformanceCaveat=e.failIfMajorPerformanceCaveat,this._preserveDrawingBuffer=e.preserveDrawingBuffer,this._antialias=e.antialias,this._trackResize=e.trackResize,this._bearingSnap=e.bearingSnap,this._refreshExpiredTiles=e.refreshExpiredTiles,this._fadeDuration=e.fadeDuration,this._crossSourceCollisions=e.crossSourceCollisions,this._crossFadingFactor=1,this._collectResourceTiming=e.collectResourceTiming,this._renderTaskQueue=new qo,this._controls=[],this._mapId=t.uniqueId(),this._locale=t.extend({},jo,e.locale),this._requestManager=new t.RequestManager(e.transformRequest,e.accessToken),"string"==typeof e.container){if(this._container=t.window.document.getElementById(e.container),!this._container)throw new Error("Container '"+e.container+"' not found.")}else{if(!(e.container instanceof Go))throw new Error("Invalid type: 'container' must be a String or HTMLElement.");this._container=e.container;}if(e.maxBounds&&this.setMaxBounds(e.maxBounds),t.bindAll(["_onWindowOnline","_onWindowResize","_contextLost","_contextRestored"],this),this._setupContainer(),this._setupPainter(),void 0===this.painter)throw new Error("Failed to initialize WebGL.");this.on("move",(function(){return r._update(!1)})),this.on("moveend",(function(){return r._update(!1)})),this.on("zoom",(function(){return r._update(!0)})),void 0!==t.window&&(t.window.addEventListener("online",this._onWindowOnline,!1),t.window.addEventListener("resize",this._onWindowResize,!1)),function(t,e){var o=t.getCanvasContainer(),r=null,a=!1,n=null;for(var s in Fo)t[s]=new Fo[s](t,e),e.interactive&&e[s]&&t[s].enable(e[s]);i.addEventListener(o,"mouseout",(function(e){t.fire(new To("mouseout",t,e));})),i.addEventListener(o,"mousedown",(function(r){a=!0,n=i.mousePos(o,r);var s=new To("mousedown",t,r);t.fire(s),s.defaultPrevented||(e.interactive&&!t.doubleClickZoom.isActive()&&t.stop(),t.boxZoom.onMouseDown(r),t.boxZoom.isActive()||t.dragPan.isActive()||t.dragRotate.onMouseDown(r),t.boxZoom.isActive()||t.dragRotate.isActive()||t.dragPan.onMouseDown(r));})),i.addEventListener(o,"mouseup",(function(e){var i=t.dragRotate.isActive();r&&!i&&t.fire(new To("contextmenu",t,r)),r=null,a=!1,t.fire(new To("mouseup",t,e));})),i.addEventListener(o,"mousemove",(function(e){if(!t.dragPan.isActive()&&!t.dragRotate.isActive()){for(var i=e.target;i&&i!==o;)i=i.parentNode;i===o&&t.fire(new To("mousemove",t,e));}})),i.addEventListener(o,"mouseover",(function(e){for(var i=e.target;i&&i!==o;)i=i.parentNode;i===o&&t.fire(new To("mouseover",t,e));})),i.addEventListener(o,"touchstart",(function(i){var o=new Io("touchstart",t,i);t.fire(o),o.defaultPrevented||(e.interactive&&t.stop(),t.boxZoom.isActive()||t.dragRotate.isActive()||t.dragPan.onTouchStart(i),t.touchZoomRotate.onStart(i),t.doubleClickZoom.onTouchStart(o));}),{passive:!1}),i.addEventListener(o,"touchmove",(function(e){t.fire(new Io("touchmove",t,e));}),{passive:!1}),i.addEventListener(o,"touchend",(function(e){t.fire(new Io("touchend",t,e));})),i.addEventListener(o,"touchcancel",(function(e){t.fire(new Io("touchcancel",t,e));})),i.addEventListener(o,"click",(function(r){var a=i.mousePos(o,r);(!n||a.equals(n)||a.dist(n)<e.clickTolerance)&&t.fire(new To("click",t,r));})),i.addEventListener(o,"dblclick",(function(e){var i=new To("dblclick",t,e);t.fire(i),i.defaultPrevented||t.doubleClickZoom.onDblClick(i);})),i.addEventListener(o,"contextmenu",(function(e){var i=t.dragRotate.isActive();a||i?a&&(r=e):t.fire(new To("contextmenu",t,e)),(t.dragRotate.isEnabled()||t.listens("contextmenu"))&&e.preventDefault();})),i.addEventListener(o,"wheel",(function(i){e.interactive&&t.stop();var o=new Co("wheel",t,i);t.fire(o),o.defaultPrevented||t.scrollZoom.onWheel(i);}),{passive:!1});}(this,e),this._hash=e.hash&&new Eo("string"==typeof e.hash&&e.hash||void 0).addTo(this),this._hash&&this._hash._onHashChange()||(this.jumpTo({center:e.center,zoom:e.zoom,bearing:e.bearing,pitch:e.pitch}),e.bounds&&(this.resize(),this.fitBounds(e.bounds,t.extend({},e.fitBoundsOptions,{duration:0})))),this.resize(),this._localIdeographFontFamily=e.localIdeographFontFamily,e.style&&this.setStyle(e.style,{localIdeographFontFamily:e.localIdeographFontFamily}),e.attributionControl&&this.addControl(new No({customAttribution:e.customAttribution})),this.addControl(new Zo,e.logoPosition),this.on("style.load",(function(){r.transform.unmodified&&r.jumpTo(r.style.stylesheet);})),this.on("data",(function(e){r._update("style"===e.dataType),r.fire(new t.Event(e.dataType+"data",e));})),this.on("dataloading",(function(e){r.fire(new t.Event(e.dataType+"dataloading",e));}));}o&&(r.__proto__=o),(r.prototype=Object.create(o&&o.prototype)).constructor=r;var a={showTileBoundaries:{configurable:!0},showPadding:{configurable:!0},showCollisionBoxes:{configurable:!0},showOverdrawInspector:{configurable:!0},repaint:{configurable:!0},vertices:{configurable:!0},version:{configurable:!0}};return r.prototype._getMapId=function(){return this._mapId},r.prototype.addControl=function(e,i){if(void 0===i&&e.getDefaultPosition&&(i=e.getDefaultPosition()),void 0===i&&(i="top-right"),!e||!e.onAdd)return this.fire(new t.ErrorEvent(new Error("Invalid argument to map.addControl(). Argument must be a control with onAdd and onRemove methods.")));var o=e.onAdd(this);this._controls.push(e);var r=this._controlPositions[i];return -1!==i.indexOf("bottom")?r.insertBefore(o,r.firstChild):r.appendChild(o),this},r.prototype.removeControl=function(e){if(!e||!e.onRemove)return this.fire(new t.ErrorEvent(new Error("Invalid argument to map.removeControl(). Argument must be a control with onAdd and onRemove methods.")));var i=this._controls.indexOf(e);return i>-1&&this._controls.splice(i,1),e.onRemove(this),this},r.prototype.resize=function(e){var i=this._containerDimensions(),o=i[0],r=i[1];return this._resizeCanvas(o,r),this.transform.resize(o,r),this.painter.resize(o,r),this.fire(new t.Event("movestart",e)).fire(new t.Event("move",e)).fire(new t.Event("resize",e)).fire(new t.Event("moveend",e)),this},r.prototype.getBounds=function(){return this.transform.getBounds()},r.prototype.getMaxBounds=function(){return this.transform.getMaxBounds()},r.prototype.setMaxBounds=function(e){return this.transform.setMaxBounds(t.LngLatBounds.convert(e)),this._update()},r.prototype.setMinZoom=function(t){if((t=null==t?-2:t)>=-2&&t<=this.transform.maxZoom)return this.transform.minZoom=t,this._update(),this.getZoom()<t&&this.setZoom(t),this;throw new Error("minZoom must be between -2 and the current maxZoom, inclusive")},r.prototype.getMinZoom=function(){return this.transform.minZoom},r.prototype.setMaxZoom=function(t){if((t=null==t?22:t)>=this.transform.minZoom)return this.transform.maxZoom=t,this._update(),this.getZoom()>t&&this.setZoom(t),this;throw new Error("maxZoom must be greater than the current minZoom")},r.prototype.getMaxZoom=function(){return this.transform.maxZoom},r.prototype.setMinPitch=function(t){if((t=null==t?Xo:t)<Xo)throw new Error("minPitch must be greater than or equal to "+Xo);if(t>=Xo&&t<=this.transform.maxPitch)return this.transform.minPitch=t,this._update(),this.getPitch()<t&&this.setPitch(t),this;throw new Error("minPitch must be between "+Xo+" and the current maxPitch, inclusive")},r.prototype.getMinPitch=function(){return this.transform.minPitch},r.prototype.setMaxPitch=function(t){if((t=null==t?Ho:t)>Ho)throw new Error("maxPitch must be less than or equal to "+Ho);if(t>=this.transform.minPitch)return this.transform.maxPitch=t,this._update(),this.getPitch()>t&&this.setPitch(t),this;throw new Error("maxPitch must be greater than the current minPitch")},r.prototype.getMaxPitch=function(){return this.transform.maxPitch},r.prototype.getRenderWorldCopies=function(){return this.transform.renderWorldCopies},r.prototype.setRenderWorldCopies=function(t){return this.transform.renderWorldCopies=t,this._update()},r.prototype.project=function(e){return this.transform.locationPoint(t.LngLat.convert(e))},r.prototype.unproject=function(e){return this.transform.pointLocation(t.Point.convert(e))},r.prototype.isMoving=function(){return this._moving||this.dragPan.isActive()||this.dragRotate.isActive()||this.scrollZoom.isActive()},r.prototype.isZooming=function(){return this._zooming||this.scrollZoom.isZooming()},r.prototype.isRotating=function(){return this._rotating||this.dragRotate.isActive()},r.prototype._createDelegatedListener=function(t,e,i){var o,r=this;if("mouseenter"===t||"mouseover"===t){var a=!1;return {layer:e,listener:i,delegates:{mousemove:function(o){var n=r.getLayer(e)?r.queryRenderedFeatures(o.point,{layers:[e]}):[];n.length?a||(a=!0,i.call(r,new To(t,r,o.originalEvent,{features:n}))):a=!1;},mouseout:function(){a=!1;}}}}if("mouseleave"===t||"mouseout"===t){var n=!1;return {layer:e,listener:i,delegates:{mousemove:function(o){(r.getLayer(e)?r.queryRenderedFeatures(o.point,{layers:[e]}):[]).length?n=!0:n&&(n=!1,i.call(r,new To(t,r,o.originalEvent)));},mouseout:function(e){n&&(n=!1,i.call(r,new To(t,r,e.originalEvent)));}}}}return {layer:e,listener:i,delegates:(o={},o[t]=function(t){var o=r.getLayer(e)?r.queryRenderedFeatures(t.point,{layers:[e]}):[];o.length&&(t.features=o,i.call(r,t),delete t.features);},o)}},r.prototype.on=function(t,e,i){if(void 0===i)return o.prototype.on.call(this,t,e);var r=this._createDelegatedListener(t,e,i);for(var a in this._delegatedListeners=this._delegatedListeners||{},this._delegatedListeners[t]=this._delegatedListeners[t]||[],this._delegatedListeners[t].push(r),r.delegates)this.on(a,r.delegates[a]);return this},r.prototype.once=function(t,e,i){if(void 0===i)return o.prototype.once.call(this,t,e);var r=this._createDelegatedListener(t,e,i);for(var a in r.delegates)this.once(a,r.delegates[a]);return this},r.prototype.off=function(t,e,i){var r=this;return void 0===i?o.prototype.off.call(this,t,e):(this._delegatedListeners&&this._delegatedListeners[t]&&function(o){for(var a=o[t],n=0;n<a.length;n++){var s=a[n];if(s.layer===e&&s.listener===i){for(var l in s.delegates)r.off(l,s.delegates[l]);return a.splice(n,1),r}}}(this._delegatedListeners),this)},r.prototype.queryRenderedFeatures=function(e,i){if(!this.style)return [];var o;if(void 0!==i||void 0===e||e instanceof t.Point||Array.isArray(e)||(i=e,e=void 0),i=i||{},(e=e||[[0,0],[this.transform.width,this.transform.height]])instanceof t.Point||"number"==typeof e[0])o=[t.Point.convert(e)];else{var r=t.Point.convert(e[0]),a=t.Point.convert(e[1]);o=[r,new t.Point(a.x,r.y),a,new t.Point(r.x,a.y),r];}return this.style.queryRenderedFeatures(o,i,this.transform)},r.prototype.querySourceFeatures=function(t,e){return this.style.querySourceFeatures(t,e)},r.prototype.setStyle=function(e,i){return !1!==(i=t.extend({},{localIdeographFontFamily:this._localIdeographFontFamily},i)).diff&&i.localIdeographFontFamily===this._localIdeographFontFamily&&this.style&&e?(this._diffStyle(e,i),this):(this._localIdeographFontFamily=i.localIdeographFontFamily,this._updateStyle(e,i))},r.prototype._getUIString=function(t){var e=this._locale[t];if(null==e)throw new Error("Missing UI string '"+t+"'");return e},r.prototype._updateStyle=function(t,e){return this.style&&(this.style.setEventedParent(null),this.style._remove()),t?(this.style=new Ne(this,e||{}),this.style.setEventedParent(this,{style:this.style}),"string"==typeof t?this.style.loadURL(t):this.style.loadJSON(t),this):(delete this.style,this)},r.prototype._lazyInitEmptyStyle=function(){this.style||(this.style=new Ne(this,{}),this.style.setEventedParent(this,{style:this.style}),this.style.loadEmpty());},r.prototype._diffStyle=function(e,i){var o=this;if("string"==typeof e){var r=this._requestManager.normalizeStyleURL(e),a=this._requestManager.transformRequest(r,t.ResourceType.Style);t.getJSON(a,(function(e,r){e?o.fire(new t.ErrorEvent(e)):r&&o._updateDiff(r,i);}));}else"object"==typeof e&&this._updateDiff(e,i);},r.prototype._updateDiff=function(e,i){try{this.style.setState(e)&&this._update(!0);}catch(o){t.warnOnce("Unable to perform style diff: "+(o.message||o.error||o)+".  Rebuilding the style from scratch."),this._updateStyle(e,i);}},r.prototype.getStyle=function(){if(this.style)return this.style.serialize()},r.prototype.isStyleLoaded=function(){return this.style?this.style.loaded():t.warnOnce("There is no style added to the map.")},r.prototype.addSource=function(t,e){return this._lazyInitEmptyStyle(),this.style.addSource(t,e),this._update(!0)},r.prototype.isSourceLoaded=function(e){var i=this.style&&this.style.sourceCaches[e];if(void 0!==i)return i.loaded();this.fire(new t.ErrorEvent(new Error("There is no source with ID '"+e+"'")));},r.prototype.areTilesLoaded=function(){var t=this.style&&this.style.sourceCaches;for(var e in t){var i=t[e]._tiles;for(var o in i){var r=i[o];if("loaded"!==r.state&&"errored"!==r.state)return !1}}return !0},r.prototype.addSourceType=function(t,e,i){return this._lazyInitEmptyStyle(),this.style.addSourceType(t,e,i)},r.prototype.removeSource=function(t){return this.style.removeSource(t),this._update(!0)},r.prototype.getSource=function(t){return this.style.getSource(t)},r.prototype.addImage=function(e,i,o){void 0===o&&(o={});var r=o.pixelRatio;void 0===r&&(r=1);var a=o.sdf;void 0===a&&(a=!1);var n=o.stretchX,s=o.stretchY,l=o.content;if(this._lazyInitEmptyStyle(),i instanceof Vo||Wo&&i instanceof Wo){var c=t.browser.getImageData(i);this.style.addImage(e,{data:new t.RGBAImage({width:c.width,height:c.height},c.data),pixelRatio:r,stretchX:n,stretchY:s,content:l,sdf:a,version:0});}else{if(void 0===i.width||void 0===i.height)return this.fire(new t.ErrorEvent(new Error("Invalid arguments to map.addImage(). The second argument must be an `HTMLImageElement`, `ImageData`, `ImageBitmap`, or object with `width`, `height`, and `data` properties with the same format as `ImageData`")));var u=i;this.style.addImage(e,{data:new t.RGBAImage({width:i.width,height:i.height},new Uint8Array(i.data)),pixelRatio:r,stretchX:n,stretchY:s,content:l,sdf:a,version:0,userImage:u}),u.onAdd&&u.onAdd(this,e);}},r.prototype.updateImage=function(e,i){var o=this.style.getImage(e);if(!o)return this.fire(new t.ErrorEvent(new Error("The map has no image with that id. If you are adding a new image use `map.addImage(...)` instead.")));var r=i instanceof Vo||Wo&&i instanceof Wo?t.browser.getImageData(i):i,a=r.width,n=r.height,s=r.data;return void 0===a||void 0===n?this.fire(new t.ErrorEvent(new Error("Invalid arguments to map.updateImage(). The second argument must be an `HTMLImageElement`, `ImageData`, `ImageBitmap`, or object with `width`, `height`, and `data` properties with the same format as `ImageData`"))):a!==o.data.width||n!==o.data.height?this.fire(new t.ErrorEvent(new Error("The width and height of the updated image must be that same as the previous version of the image"))):(o.data.replace(s,!(i instanceof Vo||Wo&&i instanceof Wo)),void this.style.updateImage(e,o))},r.prototype.hasImage=function(e){return e?!!this.style.getImage(e):(this.fire(new t.ErrorEvent(new Error("Missing required image id"))),!1)},r.prototype.removeImage=function(t){this.style.removeImage(t);},r.prototype.loadImage=function(e,i){t.getImage(this._requestManager.transformRequest(e,t.ResourceType.Image),i);},r.prototype.listImages=function(){return this.style.listImages()},r.prototype.addLayer=function(t,e){return this._lazyInitEmptyStyle(),this.style.addLayer(t,e),this._update(!0)},r.prototype.moveLayer=function(t,e){return this.style.moveLayer(t,e),this._update(!0)},r.prototype.removeLayer=function(t){return this.style.removeLayer(t),this._update(!0)},r.prototype.getLayer=function(t){return this.style.getLayer(t)},r.prototype.setLayerZoomRange=function(t,e,i){return this.style.setLayerZoomRange(t,e,i),this._update(!0)},r.prototype.setFilter=function(t,e,i){return void 0===i&&(i={}),this.style.setFilter(t,e,i),this._update(!0)},r.prototype.getFilter=function(t){return this.style.getFilter(t)},r.prototype.setPaintProperty=function(t,e,i,o){return void 0===o&&(o={}),this.style.setPaintProperty(t,e,i,o),this._update(!0)},r.prototype.getPaintProperty=function(t,e){return this.style.getPaintProperty(t,e)},r.prototype.setLayoutProperty=function(t,e,i,o){return void 0===o&&(o={}),this.style.setLayoutProperty(t,e,i,o),this._update(!0)},r.prototype.getLayoutProperty=function(t,e){return this.style.getLayoutProperty(t,e)},r.prototype.setLight=function(t,e){return void 0===e&&(e={}),this._lazyInitEmptyStyle(),this.style.setLight(t,e),this._update(!0)},r.prototype.getLight=function(){return this.style.getLight()},r.prototype.setFeatureState=function(t,e){return this.style.setFeatureState(t,e),this._update()},r.prototype.removeFeatureState=function(t,e){return this.style.removeFeatureState(t,e),this._update()},r.prototype.getFeatureState=function(t){return this.style.getFeatureState(t)},r.prototype.getContainer=function(){return this._container},r.prototype.getCanvasContainer=function(){return this._canvasContainer},r.prototype.getCanvas=function(){return this._canvas},r.prototype._containerDimensions=function(){var t=0,e=0;return this._container&&(t=this._container.clientWidth||400,e=this._container.clientHeight||300),[t,e]},r.prototype._detectMissingCSS=function(){"rgb(250, 128, 114)"!==t.window.getComputedStyle(this._missingCSSCanary).getPropertyValue("background-color")&&t.warnOnce("This page appears to be missing CSS declarations for Mapbox GL JS, which may cause the map to display incorrectly. Please ensure your page includes mapbox-gl.css, as described in https://www.mapbox.com/mapbox-gl-js/api/.");},r.prototype._setupContainer=function(){var t=this._container;t.classList.add("mapboxgl-map"),(this._missingCSSCanary=i.create("div","mapboxgl-canary",t)).style.visibility="hidden",this._detectMissingCSS();var e=this._canvasContainer=i.create("div","mapboxgl-canvas-container",t);this._interactive&&e.classList.add("mapboxgl-interactive"),this._canvas=i.create("canvas","mapboxgl-canvas",e),this._canvas.addEventListener("webglcontextlost",this._contextLost,!1),this._canvas.addEventListener("webglcontextrestored",this._contextRestored,!1),this._canvas.setAttribute("tabindex","0"),this._canvas.setAttribute("aria-label","Map");var o=this._containerDimensions();this._resizeCanvas(o[0],o[1]);var r=this._controlContainer=i.create("div","mapboxgl-control-container",t),a=this._controlPositions={};["top-left","top-right","bottom-left","bottom-right"].forEach((function(t){a[t]=i.create("div","mapboxgl-ctrl-"+t,r);}));},r.prototype._resizeCanvas=function(e,i){var o=t.browser.devicePixelRatio||1;this._canvas.width=o*e,this._canvas.height=o*i,this._canvas.style.width=e+"px",this._canvas.style.height=i+"px";},r.prototype._setupPainter=function(){var i=t.extend({},e.webGLContextAttributes,{failIfMajorPerformanceCaveat:this._failIfMajorPerformanceCaveat,preserveDrawingBuffer:this._preserveDrawingBuffer,antialias:this._antialias||!1}),o=this._canvas.getContext("webgl",i)||this._canvas.getContext("experimental-webgl",i);o?(this.painter=new go(o,this.transform),t.webpSupported.testSupport(o)):this.fire(new t.ErrorEvent(new Error("Failed to initialize WebGL")));},r.prototype._contextLost=function(e){e.preventDefault(),this._frame&&(this._frame.cancel(),this._frame=null),this.fire(new t.Event("webglcontextlost",{originalEvent:e}));},r.prototype._contextRestored=function(e){this._setupPainter(),this.resize(),this._update(),this.fire(new t.Event("webglcontextrestored",{originalEvent:e}));},r.prototype.loaded=function(){return !this._styleDirty&&!this._sourcesDirty&&!!this.style&&this.style.loaded()},r.prototype._update=function(t){return this.style?(this._styleDirty=this._styleDirty||t,this._sourcesDirty=!0,this.triggerRepaint(),this):this},r.prototype._requestRenderFrame=function(t){return this._update(),this._renderTaskQueue.add(t)},r.prototype._cancelRenderFrame=function(t){this._renderTaskQueue.remove(t);},r.prototype._render=function(){var e,i=this,o=0,r=this.painter.context.extTimerQuery;this.listens("gpu-timing-frame")&&(e=r.createQueryEXT(),r.beginQueryEXT(r.TIME_ELAPSED_EXT,e),o=t.browser.now()),this.painter.context.setDirty(),this.painter.setBaseState(),this._renderTaskQueue.run();var a=!1;if(this.style&&this._styleDirty){this._styleDirty=!1;var n=this.transform.zoom,s=t.browser.now();this.style.zoomHistory.update(n,s);var l=new t.EvaluationParameters(n,{now:s,fadeDuration:this._fadeDuration,zoomHistory:this.style.zoomHistory,transition:this.style.getTransition()}),c=l.crossFadingFactor();1===c&&c===this._crossFadingFactor||(a=!0,this._crossFadingFactor=c),this.style.update(l);}if(this.style&&this._sourcesDirty&&(this._sourcesDirty=!1,this.style._updateSources(this.transform)),this._placementDirty=this.style&&this.style._updatePlacement(this.painter.transform,this.showCollisionBoxes,this._fadeDuration,this._crossSourceCollisions),this.painter.render(this.style,{showTileBoundaries:this.showTileBoundaries,showOverdrawInspector:this._showOverdrawInspector,rotating:this.isRotating(),zooming:this.isZooming(),moving:this.isMoving(),fadeDuration:this._fadeDuration,showPadding:this.showPadding,gpuTiming:!!this.listens("gpu-timing-layer")}),this.fire(new t.Event("render")),this.loaded()&&!this._loaded&&(this._loaded=!0,this.fire(new t.Event("load"))),this.style&&(this.style.hasTransitions()||a)&&(this._styleDirty=!0),this.style&&!this._placementDirty&&this.style._releaseSymbolFadeTiles(),this.listens("gpu-timing-frame")){var u=t.browser.now()-o;r.endQueryEXT(r.TIME_ELAPSED_EXT,e),setTimeout((function(){var o=r.getQueryObjectEXT(e,r.QUERY_RESULT_EXT)/1e6;r.deleteQueryEXT(e),i.fire(new t.Event("gpu-timing-frame",{cpuTime:u,gpuTime:o}));}),50);}if(this.listens("gpu-timing-layer")){var h=this.painter.collectGpuTimers();setTimeout((function(){var e=i.painter.queryGpuTimers(h);i.fire(new t.Event("gpu-timing-layer",{layerTimes:e}));}),50);}return this._sourcesDirty||this._styleDirty||this._placementDirty||this._repaint?this.triggerRepaint():!this.isMoving()&&this.loaded()&&(this._fullyLoaded||(this._fullyLoaded=!0),this.fire(new t.Event("idle"))),this},r.prototype.remove=function(){this._hash&&this._hash.remove();for(var e=0,i=this._controls;e<i.length;e+=1)i[e].onRemove(this);this._controls=[],this._frame&&(this._frame.cancel(),this._frame=null),this._renderTaskQueue.clear(),this.painter.destroy(),this.setStyle(null),void 0!==t.window&&(t.window.removeEventListener("resize",this._onWindowResize,!1),t.window.removeEventListener("online",this._onWindowOnline,!1));var o=this.painter.context.gl.getExtension("WEBGL_lose_context");o&&o.loseContext(),Jo(this._canvasContainer),Jo(this._controlContainer),Jo(this._missingCSSCanary),this._container.classList.remove("mapboxgl-map"),this.fire(new t.Event("remove"));},r.prototype.triggerRepaint=function(){var e=this;this.style&&!this._frame&&(this._frame=t.browser.frame((function(t){e._frame=null,e._render();})));},r.prototype._onWindowOnline=function(){this._update();},r.prototype._onWindowResize=function(t){this._trackResize&&this.resize({originalEvent:t})._update();},a.showTileBoundaries.get=function(){return !!this._showTileBoundaries},a.showTileBoundaries.set=function(t){this._showTileBoundaries!==t&&(this._showTileBoundaries=t,this._update());},a.showPadding.get=function(){return !!this._showPadding},a.showPadding.set=function(t){this._showPadding!==t&&(this._showPadding=t,this._update());},a.showCollisionBoxes.get=function(){return !!this._showCollisionBoxes},a.showCollisionBoxes.set=function(t){this._showCollisionBoxes!==t&&(this._showCollisionBoxes=t,t?this.style._generateCollisionBoxes():this._update());},a.showOverdrawInspector.get=function(){return !!this._showOverdrawInspector},a.showOverdrawInspector.set=function(t){this._showOverdrawInspector!==t&&(this._showOverdrawInspector=t,this._update());},a.repaint.get=function(){return !!this._repaint},a.repaint.set=function(t){this._repaint!==t&&(this._repaint=t,this.triggerRepaint());},a.vertices.get=function(){return !!this._vertices},a.vertices.set=function(t){this._vertices=t,this._update();},r.prototype._setCacheLimits=function(e,i){t.setCacheLimits(e,i);},a.version.get=function(){return t.version},Object.defineProperties(r.prototype,a),r}(Uo);function Jo(t){t.parentNode&&t.parentNode.removeChild(t);}var Qo={showCompass:!0,showZoom:!0,visualizePitch:!1},$o=function(e){var o=this;this.options=t.extend({},Qo,e),this._container=i.create("div","mapboxgl-ctrl mapboxgl-ctrl-group"),this._container.addEventListener("contextmenu",(function(t){return t.preventDefault()})),this.options.showZoom&&(t.bindAll(["_setButtonTitle","_updateZoomButtons"],this),this._zoomInButton=this._createButton("mapboxgl-ctrl-zoom-in",(function(t){return o._map.zoomIn({},{originalEvent:t})})),i.create("span","mapboxgl-ctrl-icon",this._zoomInButton).setAttribute("aria-hidden",!0),this._zoomOutButton=this._createButton("mapboxgl-ctrl-zoom-out",(function(t){return o._map.zoomOut({},{originalEvent:t})})),i.create("span","mapboxgl-ctrl-icon",this._zoomOutButton).setAttribute("aria-hidden",!0)),this.options.showCompass&&(t.bindAll(["_rotateCompassArrow"],this),this._compass=this._createButton("mapboxgl-ctrl-compass",(function(t){o.options.visualizePitch?o._map.resetNorthPitch({},{originalEvent:t}):o._map.resetNorth({},{originalEvent:t});})),this._compassIcon=i.create("span","mapboxgl-ctrl-icon",this._compass),this._compassIcon.setAttribute("aria-hidden",!0));};function tr(e,i,o){if(e=new t.LngLat(e.lng,e.lat),i){var r=new t.LngLat(e.lng-360,e.lat),a=new t.LngLat(e.lng+360,e.lat),n=o.locationPoint(e).distSqr(i);o.locationPoint(r).distSqr(i)<n?e=r:o.locationPoint(a).distSqr(i)<n&&(e=a);}for(;Math.abs(e.lng-o.center.lng)>180;){var s=o.locationPoint(e);if(s.x>=0&&s.y>=0&&s.x<=o.width&&s.y<=o.height)break;e.lng>o.center.lng?e.lng-=360:e.lng+=360;}return e}$o.prototype._updateZoomButtons=function(){var t=this._map.getZoom();this._zoomInButton.disabled=t===this._map.getMaxZoom(),this._zoomOutButton.disabled=t===this._map.getMinZoom();},$o.prototype._rotateCompassArrow=function(){var t=this.options.visualizePitch?"scale("+1/Math.pow(Math.cos(this._map.transform.pitch*(Math.PI/180)),.5)+") rotateX("+this._map.transform.pitch+"deg) rotateZ("+this._map.transform.angle*(180/Math.PI)+"deg)":"rotate("+this._map.transform.angle*(180/Math.PI)+"deg)";this._compassIcon.style.transform=t;},$o.prototype.onAdd=function(t){return this._map=t,this.options.showZoom&&(this._setButtonTitle(this._zoomInButton,"ZoomIn"),this._setButtonTitle(this._zoomOutButton,"ZoomOut"),this._map.on("zoom",this._updateZoomButtons),this._updateZoomButtons()),this.options.showCompass&&(this._setButtonTitle(this._compass,"ResetBearing"),this.options.visualizePitch&&this._map.on("pitch",this._rotateCompassArrow),this._map.on("rotate",this._rotateCompassArrow),this._rotateCompassArrow(),this._handler=new Lo(t,{button:"left",element:this._compass,clickTolerance:t.dragRotate._clickTolerance}),i.addEventListener(this._compass,"mousedown",this._handler.onMouseDown),i.addEventListener(this._compass,"touchstart",this._handler.onMouseDown,{passive:!1}),this._handler.enable()),this._container},$o.prototype.onRemove=function(){i.remove(this._container),this.options.showZoom&&this._map.off("zoom",this._updateZoomButtons),this.options.showCompass&&(this.options.visualizePitch&&this._map.off("pitch",this._rotateCompassArrow),this._map.off("rotate",this._rotateCompassArrow),i.removeEventListener(this._compass,"mousedown",this._handler.onMouseDown),i.removeEventListener(this._compass,"touchstart",this._handler.onMouseDown,{passive:!1}),this._handler.disable(),delete this._handler),delete this._map;},$o.prototype._createButton=function(t,e){var o=i.create("button",t,this._container);return o.type="button",o.addEventListener("click",e),o},$o.prototype._setButtonTitle=function(t,e){var i=this._map._getUIString("NavigationControl."+e);t.title=i,t.setAttribute("aria-label",i);};var er={center:"translate(-50%,-50%)",top:"translate(-50%,0)","top-left":"translate(0,0)","top-right":"translate(-100%,0)",bottom:"translate(-50%,-100%)","bottom-left":"translate(0,-100%)","bottom-right":"translate(-100%,-100%)",left:"translate(0,-50%)",right:"translate(-100%,-50%)"};function ir(t,e,i){var o=t.classList;for(var r in er)o.remove("mapboxgl-"+i+"-anchor-"+r);o.add("mapboxgl-"+i+"-anchor-"+e);}var or,rr=function(e){function o(o,r){var a=this;if(e.call(this),(o instanceof t.window.HTMLElement||r)&&(o=t.extend({element:o},r)),t.bindAll(["_update","_onMove","_onUp","_addDragHandler","_onMapClick","_onKeyPress"],this),this._anchor=o&&o.anchor||"center",this._color=o&&o.color||"#3FB1CE",this._draggable=o&&o.draggable||!1,this._state="inactive",this._rotation=o&&o.rotation||0,this._rotationAlignment=o&&o.rotationAlignment||"auto",this._pitchAlignment=o&&o.pitchAlignment&&"auto"!==o.pitchAlignment?o.pitchAlignment:this._rotationAlignment,o&&o.element)this._element=o.element,this._offset=t.Point.convert(o&&o.offset||[0,0]);else{this._defaultMarker=!0,this._element=i.create("div"),this._element.setAttribute("aria-label","Map marker");var n=i.createNS("http://www.w3.org/2000/svg","svg");n.setAttributeNS(null,"display","block"),n.setAttributeNS(null,"height","41px"),n.setAttributeNS(null,"width","27px"),n.setAttributeNS(null,"viewBox","0 0 27 41");var s=i.createNS("http://www.w3.org/2000/svg","g");s.setAttributeNS(null,"stroke","none"),s.setAttributeNS(null,"stroke-width","1"),s.setAttributeNS(null,"fill","none"),s.setAttributeNS(null,"fill-rule","evenodd");var l=i.createNS("http://www.w3.org/2000/svg","g");l.setAttributeNS(null,"fill-rule","nonzero");var c=i.createNS("http://www.w3.org/2000/svg","g");c.setAttributeNS(null,"transform","translate(3.0, 29.0)"),c.setAttributeNS(null,"fill","#000000");for(var u=0,h=[{rx:"10.5",ry:"5.25002273"},{rx:"10.5",ry:"5.25002273"},{rx:"9.5",ry:"4.77275007"},{rx:"8.5",ry:"4.29549936"},{rx:"7.5",ry:"3.81822308"},{rx:"6.5",ry:"3.34094679"},{rx:"5.5",ry:"2.86367051"},{rx:"4.5",ry:"2.38636864"}];u<h.length;u+=1){var p=h[u],d=i.createNS("http://www.w3.org/2000/svg","ellipse");d.setAttributeNS(null,"opacity","0.04"),d.setAttributeNS(null,"cx","10.5"),d.setAttributeNS(null,"cy","5.80029008"),d.setAttributeNS(null,"rx",p.rx),d.setAttributeNS(null,"ry",p.ry),c.appendChild(d);}var _=i.createNS("http://www.w3.org/2000/svg","g");_.setAttributeNS(null,"fill",this._color);var f=i.createNS("http://www.w3.org/2000/svg","path");f.setAttributeNS(null,"d","M27,13.5 C27,19.074644 20.250001,27.000002 14.75,34.500002 C14.016665,35.500004 12.983335,35.500004 12.25,34.500002 C6.7499993,27.000002 0,19.222562 0,13.5 C0,6.0441559 6.0441559,0 13.5,0 C20.955844,0 27,6.0441559 27,13.5 Z"),_.appendChild(f);var m=i.createNS("http://www.w3.org/2000/svg","g");m.setAttributeNS(null,"opacity","0.25"),m.setAttributeNS(null,"fill","#000000");var g=i.createNS("http://www.w3.org/2000/svg","path");g.setAttributeNS(null,"d","M13.5,0 C6.0441559,0 0,6.0441559 0,13.5 C0,19.222562 6.7499993,27 12.25,34.5 C13,35.522727 14.016664,35.500004 14.75,34.5 C20.250001,27 27,19.074644 27,13.5 C27,6.0441559 20.955844,0 13.5,0 Z M13.5,1 C20.415404,1 26,6.584596 26,13.5 C26,15.898657 24.495584,19.181431 22.220703,22.738281 C19.945823,26.295132 16.705119,30.142167 13.943359,33.908203 C13.743445,34.180814 13.612715,34.322738 13.5,34.441406 C13.387285,34.322738 13.256555,34.180814 13.056641,33.908203 C10.284481,30.127985 7.4148684,26.314159 5.015625,22.773438 C2.6163816,19.232715 1,15.953538 1,13.5 C1,6.584596 6.584596,1 13.5,1 Z"),m.appendChild(g);var v=i.createNS("http://www.w3.org/2000/svg","g");v.setAttributeNS(null,"transform","translate(6.0, 7.0)"),v.setAttributeNS(null,"fill","#FFFFFF");var y=i.createNS("http://www.w3.org/2000/svg","g");y.setAttributeNS(null,"transform","translate(8.0, 8.0)");var x=i.createNS("http://www.w3.org/2000/svg","circle");x.setAttributeNS(null,"fill","#000000"),x.setAttributeNS(null,"opacity","0.25"),x.setAttributeNS(null,"cx","5.5"),x.setAttributeNS(null,"cy","5.5"),x.setAttributeNS(null,"r","5.4999962");var b=i.createNS("http://www.w3.org/2000/svg","circle");b.setAttributeNS(null,"fill","#FFFFFF"),b.setAttributeNS(null,"cx","5.5"),b.setAttributeNS(null,"cy","5.5"),b.setAttributeNS(null,"r","5.4999962"),y.appendChild(x),y.appendChild(b),l.appendChild(c),l.appendChild(_),l.appendChild(m),l.appendChild(v),l.appendChild(y),n.appendChild(l),this._element.appendChild(n),this._offset=t.Point.convert(o&&o.offset||[0,-14]);}this._element.classList.add("mapboxgl-marker"),this._element.addEventListener("dragstart",(function(t){t.preventDefault();})),this._element.addEventListener("mousedown",(function(t){t.preventDefault();})),this._element.addEventListener("focus",(function(){var t=a._map.getContainer();t.scrollTop=0,t.scrollLeft=0;})),ir(this._element,this._anchor,"marker"),this._popup=null;}return e&&(o.__proto__=e),(o.prototype=Object.create(e&&e.prototype)).constructor=o,o.prototype.addTo=function(t){return this.remove(),this._map=t,t.getCanvasContainer().appendChild(this._element),t.on("move",this._update),t.on("moveend",this._update),this.setDraggable(this._draggable),this._update(),this._map.on("click",this._onMapClick),this},o.prototype.remove=function(){return this._map&&(this._map.off("click",this._onMapClick),this._map.off("move",this._update),this._map.off("moveend",this._update),this._map.off("mousedown",this._addDragHandler),this._map.off("touchstart",this._addDragHandler),this._map.off("mouseup",this._onUp),this._map.off("touchend",this._onUp),this._map.off("mousemove",this._onMove),this._map.off("touchmove",this._onMove),delete this._map),i.remove(this._element),this._popup&&this._popup.remove(),this},o.prototype.getLngLat=function(){return this._lngLat},o.prototype.setLngLat=function(e){return this._lngLat=t.LngLat.convert(e),this._pos=null,this._popup&&this._popup.setLngLat(this._lngLat),this._update(),this},o.prototype.getElement=function(){return this._element},o.prototype.setPopup=function(t){if(this._popup&&(this._popup.remove(),this._popup=null,this._element.removeEventListener("keypress",this._onKeyPress),this._originalTabIndex||this._element.removeAttribute("tabindex")),t){if(!("offset"in t.options)){var e=Math.sqrt(Math.pow(13.5,2)/2);t.options.offset=this._defaultMarker?{top:[0,0],"top-left":[0,0],"top-right":[0,0],bottom:[0,-38.1],"bottom-left":[e,-1*(24.6+e)],"bottom-right":[-e,-1*(24.6+e)],left:[13.5,-24.6],right:[-13.5,-24.6]}:this._offset;}this._popup=t,this._lngLat&&this._popup.setLngLat(this._lngLat),this._originalTabIndex=this._element.getAttribute("tabindex"),this._originalTabIndex||this._element.setAttribute("tabindex","0"),this._element.addEventListener("keypress",this._onKeyPress);}return this},o.prototype._onKeyPress=function(t){var e=t.code,i=t.charCode||t.keyCode;"Space"!==e&&"Enter"!==e&&32!==i&&13!==i||this.togglePopup();},o.prototype._onMapClick=function(t){var e=t.originalEvent.target,i=this._element;this._popup&&(e===i||i.contains(e))&&this.togglePopup();},o.prototype.getPopup=function(){return this._popup},o.prototype.togglePopup=function(){var t=this._popup;return t?(t.isOpen()?t.remove():t.addTo(this._map),this):this},o.prototype._update=function(t){if(this._map){this._map.transform.renderWorldCopies&&(this._lngLat=tr(this._lngLat,this._pos,this._map.transform)),this._pos=this._map.project(this._lngLat)._add(this._offset);var e="";"viewport"===this._rotationAlignment||"auto"===this._rotationAlignment?e="rotateZ("+this._rotation+"deg)":"map"===this._rotationAlignment&&(e="rotateZ("+(this._rotation-this._map.getBearing())+"deg)");var o="";"viewport"===this._pitchAlignment||"auto"===this._pitchAlignment?o="rotateX(0deg)":"map"===this._pitchAlignment&&(o="rotateX("+this._map.getPitch()+"deg)"),t&&"moveend"!==t.type||(this._pos=this._pos.round()),i.setTransform(this._element,er[this._anchor]+" translate("+this._pos.x+"px, "+this._pos.y+"px) "+o+" "+e);}},o.prototype.getOffset=function(){return this._offset},o.prototype.setOffset=function(e){return this._offset=t.Point.convert(e),this._update(),this},o.prototype._onMove=function(e){this._pos=e.point.sub(this._positionDelta),this._lngLat=this._map.unproject(this._pos),this.setLngLat(this._lngLat),this._element.style.pointerEvents="none","pending"===this._state&&(this._state="active",this.fire(new t.Event("dragstart"))),this.fire(new t.Event("drag"));},o.prototype._onUp=function(){this._element.style.pointerEvents="auto",this._positionDelta=null,this._map.off("mousemove",this._onMove),this._map.off("touchmove",this._onMove),"active"===this._state&&this.fire(new t.Event("dragend")),this._state="inactive";},o.prototype._addDragHandler=function(t){this._element.contains(t.originalEvent.target)&&(t.preventDefault(),this._positionDelta=t.point.sub(this._pos).add(this._offset),this._state="pending",this._map.on("mousemove",this._onMove),this._map.on("touchmove",this._onMove),this._map.once("mouseup",this._onUp),this._map.once("touchend",this._onUp));},o.prototype.setDraggable=function(t){return this._draggable=!!t,this._map&&(t?(this._map.on("mousedown",this._addDragHandler),this._map.on("touchstart",this._addDragHandler)):(this._map.off("mousedown",this._addDragHandler),this._map.off("touchstart",this._addDragHandler))),this},o.prototype.isDraggable=function(){return this._draggable},o.prototype.setRotation=function(t){return this._rotation=t||0,this._update(),this},o.prototype.getRotation=function(){return this._rotation},o.prototype.setRotationAlignment=function(t){return this._rotationAlignment=t||"auto",this._update(),this},o.prototype.getRotationAlignment=function(){return this._rotationAlignment},o.prototype.setPitchAlignment=function(t){return this._pitchAlignment=t&&"auto"!==t?t:this._rotationAlignment,this._update(),this},o.prototype.getPitchAlignment=function(){return this._pitchAlignment},o}(t.Evented),ar={positionOptions:{enableHighAccuracy:!1,maximumAge:0,timeout:6e3},fitBoundsOptions:{maxZoom:15},trackUserLocation:!1,showAccuracyCircle:!0,showUserLocation:!0},nr=0,sr=!1,lr=function(e){function o(i){e.call(this),this.options=t.extend({},ar,i),t.bindAll(["_onSuccess","_onError","_onZoom","_finish","_setupUI","_updateCamera","_updateMarker"],this);}return e&&(o.__proto__=e),(o.prototype=Object.create(e&&e.prototype)).constructor=o,o.prototype.onAdd=function(e){var o;return this._map=e,this._container=i.create("div","mapboxgl-ctrl mapboxgl-ctrl-group"),o=this._setupUI,void 0!==or?o(or):void 0!==t.window.navigator.permissions?t.window.navigator.permissions.query({name:"geolocation"}).then((function(t){o(or="denied"!==t.state);})):o(or=!!t.window.navigator.geolocation),this._container},o.prototype.onRemove=function(){void 0!==this._geolocationWatchID&&(t.window.navigator.geolocation.clearWatch(this._geolocationWatchID),this._geolocationWatchID=void 0),this.options.showUserLocation&&this._userLocationDotMarker&&this._userLocationDotMarker.remove(),this.options.showAccuracyCircle&&this._accuracyCircleMarker&&this._accuracyCircleMarker.remove(),i.remove(this._container),this._map.off("zoom",this._onZoom),this._map=void 0,nr=0,sr=!1;},o.prototype._isOutOfMapMaxBounds=function(t){var e=this._map.getMaxBounds(),i=t.coords;return e&&(i.longitude<e.getWest()||i.longitude>e.getEast()||i.latitude<e.getSouth()||i.latitude>e.getNorth())},o.prototype._setErrorState=function(){switch(this._watchState){case"WAITING_ACTIVE":this._watchState="ACTIVE_ERROR",this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-active"),this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-active-error");break;case"ACTIVE_LOCK":this._watchState="ACTIVE_ERROR",this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-active"),this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-active-error"),this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-waiting");break;case"BACKGROUND":this._watchState="BACKGROUND_ERROR",this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-background"),this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-background-error"),this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-waiting");}},o.prototype._onSuccess=function(e){if(this._map){if(this._isOutOfMapMaxBounds(e))return this._setErrorState(),this.fire(new t.Event("outofmaxbounds",e)),this._updateMarker(),void this._finish();if(this.options.trackUserLocation)switch(this._lastKnownPosition=e,this._watchState){case"WAITING_ACTIVE":case"ACTIVE_LOCK":case"ACTIVE_ERROR":this._watchState="ACTIVE_LOCK",this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-waiting"),this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-active-error"),this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-active");break;case"BACKGROUND":case"BACKGROUND_ERROR":this._watchState="BACKGROUND",this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-waiting"),this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-background-error"),this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-background");}this.options.showUserLocation&&"OFF"!==this._watchState&&this._updateMarker(e),this.options.trackUserLocation&&"ACTIVE_LOCK"!==this._watchState||this._updateCamera(e),this.options.showUserLocation&&this._dotElement.classList.remove("mapboxgl-user-location-dot-stale"),this.fire(new t.Event("geolocate",e)),this._finish();}},o.prototype._updateCamera=function(e){var i=new t.LngLat(e.coords.longitude,e.coords.latitude),o=e.coords.accuracy,r=this._map.getBearing(),a=t.extend({bearing:r},this.options.fitBoundsOptions);this._map.fitBounds(i.toBounds(o),a,{geolocateSource:!0});},o.prototype._updateMarker=function(e){if(e){var i=new t.LngLat(e.coords.longitude,e.coords.latitude);this._accuracyCircleMarker.setLngLat(i).addTo(this._map),this._userLocationDotMarker.setLngLat(i).addTo(this._map),this._accuracy=e.coords.accuracy,this.options.showUserLocation&&this.options.showAccuracyCircle&&this._updateCircleRadius();}else this._userLocationDotMarker.remove(),this._accuracyCircleMarker.remove();},o.prototype._updateCircleRadius=function(){var t=this._map._container.clientHeight/2,e=this._map.unproject([0,t]),i=this._map.unproject([1,t]),o=e.distanceTo(i),r=Math.ceil(2*this._accuracy/o);this._circleElement.style.width=r+"px",this._circleElement.style.height=r+"px";},o.prototype._onZoom=function(){this.options.showUserLocation&&this.options.showAccuracyCircle&&this._updateCircleRadius();},o.prototype._onError=function(e){if(this._map){if(this.options.trackUserLocation)if(1===e.code){this._watchState="OFF",this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-waiting"),this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-active"),this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-active-error"),this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-background"),this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-background-error"),this._geolocateButton.disabled=!0;var i=this._map._getUIString("GeolocateControl.LocationNotAvailable");this._geolocateButton.title=i,this._geolocateButton.setAttribute("aria-label",i),void 0!==this._geolocationWatchID&&this._clearWatch();}else{if(3===e.code&&sr)return;this._setErrorState();}"OFF"!==this._watchState&&this.options.showUserLocation&&this._dotElement.classList.add("mapboxgl-user-location-dot-stale"),this.fire(new t.Event("error",e)),this._finish();}},o.prototype._finish=function(){this._timeoutId&&clearTimeout(this._timeoutId),this._timeoutId=void 0;},o.prototype._setupUI=function(e){var o=this;if(this._container.addEventListener("contextmenu",(function(t){return t.preventDefault()})),this._geolocateButton=i.create("button","mapboxgl-ctrl-geolocate",this._container),i.create("span","mapboxgl-ctrl-icon",this._geolocateButton).setAttribute("aria-hidden",!0),this._geolocateButton.type="button",!1===e){t.warnOnce("Geolocation support is not available so the GeolocateControl will be disabled.");var r=this._map._getUIString("GeolocateControl.LocationNotAvailable");this._geolocateButton.disabled=!0,this._geolocateButton.title=r,this._geolocateButton.setAttribute("aria-label",r);}else{var a=this._map._getUIString("GeolocateControl.FindMyLocation");this._geolocateButton.title=a,this._geolocateButton.setAttribute("aria-label",a);}this.options.trackUserLocation&&(this._geolocateButton.setAttribute("aria-pressed","false"),this._watchState="OFF"),this.options.showUserLocation&&(this._dotElement=i.create("div","mapboxgl-user-location-dot"),this._userLocationDotMarker=new rr(this._dotElement),this._circleElement=i.create("div","mapboxgl-user-location-accuracy-circle"),this._accuracyCircleMarker=new rr({element:this._circleElement,pitchAlignment:"map"}),this.options.trackUserLocation&&(this._watchState="OFF"),this._map.on("zoom",this._onZoom)),this._geolocateButton.addEventListener("click",this.trigger.bind(this)),this._setup=!0,this.options.trackUserLocation&&this._map.on("movestart",(function(e){e.geolocateSource||"ACTIVE_LOCK"!==o._watchState||e.originalEvent&&"resize"===e.originalEvent.type||(o._watchState="BACKGROUND",o._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-background"),o._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-active"),o.fire(new t.Event("trackuserlocationend")));}));},o.prototype.trigger=function(){if(!this._setup)return t.warnOnce("Geolocate control triggered before added to a map"),!1;if(this.options.trackUserLocation){switch(this._watchState){case"OFF":this._watchState="WAITING_ACTIVE",this.fire(new t.Event("trackuserlocationstart"));break;case"WAITING_ACTIVE":case"ACTIVE_LOCK":case"ACTIVE_ERROR":case"BACKGROUND_ERROR":nr--,sr=!1,this._watchState="OFF",this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-waiting"),this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-active"),this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-active-error"),this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-background"),this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-background-error"),this.fire(new t.Event("trackuserlocationend"));break;case"BACKGROUND":this._watchState="ACTIVE_LOCK",this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-background"),this._lastKnownPosition&&this._updateCamera(this._lastKnownPosition),this.fire(new t.Event("trackuserlocationstart"));}switch(this._watchState){case"WAITING_ACTIVE":this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-waiting"),this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-active");break;case"ACTIVE_LOCK":this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-active");break;case"ACTIVE_ERROR":this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-waiting"),this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-active-error");break;case"BACKGROUND":this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-background");break;case"BACKGROUND_ERROR":this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-waiting"),this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-background-error");}if("OFF"===this._watchState&&void 0!==this._geolocationWatchID)this._clearWatch();else if(void 0===this._geolocationWatchID){var e;this._geolocateButton.classList.add("mapboxgl-ctrl-geolocate-waiting"),this._geolocateButton.setAttribute("aria-pressed","true"),++nr>1?(e={maximumAge:6e5,timeout:0},sr=!0):(e=this.options.positionOptions,sr=!1),this._geolocationWatchID=t.window.navigator.geolocation.watchPosition(this._onSuccess,this._onError,e);}}else t.window.navigator.geolocation.getCurrentPosition(this._onSuccess,this._onError,this.options.positionOptions),this._timeoutId=setTimeout(this._finish,1e4);return !0},o.prototype._clearWatch=function(){t.window.navigator.geolocation.clearWatch(this._geolocationWatchID),this._geolocationWatchID=void 0,this._geolocateButton.classList.remove("mapboxgl-ctrl-geolocate-waiting"),this._geolocateButton.setAttribute("aria-pressed","false"),this.options.showUserLocation&&this._updateMarker(null);},o}(t.Evented),cr={maxWidth:100,unit:"metric"},ur=function(e){this.options=t.extend({},cr,e),t.bindAll(["_onMove","setUnit"],this);};function hr(t,e,i){var o=i&&i.maxWidth||100,r=t._container.clientHeight/2,a=t.unproject([0,r]),n=t.unproject([o,r]),s=a.distanceTo(n);if(i&&"imperial"===i.unit){var l=3.2808*s;l>5280?pr(e,o,l/5280,t._getUIString("ScaleControl.Miles")):pr(e,o,l,t._getUIString("ScaleControl.Feet"));}else i&&"nautical"===i.unit?pr(e,o,s/1852,t._getUIString("ScaleControl.NauticalMiles")):s>=1e3?pr(e,o,s/1e3,t._getUIString("ScaleControl.Kilometers")):pr(e,o,s,t._getUIString("ScaleControl.Meters"));}function pr(t,e,i,o){var r,a,n,s=(r=i,(a=Math.pow(10,(""+Math.floor(r)).length-1))*(n=(n=r/a)>=10?10:n>=5?5:n>=3?3:n>=2?2:n>=1?1:function(t){var e=Math.pow(10,Math.ceil(-Math.log(t)/Math.LN10));return Math.round(t*e)/e}(n)));t.style.width=e*(s/i)+"px",t.innerHTML=s+"&nbsp;"+o;}ur.prototype.getDefaultPosition=function(){return "bottom-left"},ur.prototype._onMove=function(){hr(this._map,this._container,this.options);},ur.prototype.onAdd=function(t){return this._map=t,this._container=i.create("div","mapboxgl-ctrl mapboxgl-ctrl-scale",t.getContainer()),this._map.on("move",this._onMove),this._onMove(),this._container},ur.prototype.onRemove=function(){i.remove(this._container),this._map.off("move",this._onMove),this._map=void 0;},ur.prototype.setUnit=function(t){this.options.unit=t,hr(this._map,this._container,this.options);};var dr=function(e){this._fullscreen=!1,e&&e.container&&(e.container instanceof t.window.HTMLElement?this._container=e.container:t.warnOnce("Full screen control 'container' must be a DOM element.")),t.bindAll(["_onClickFullscreen","_changeIcon"],this),"onfullscreenchange"in t.window.document?this._fullscreenchange="fullscreenchange":"onmozfullscreenchange"in t.window.document?this._fullscreenchange="mozfullscreenchange":"onwebkitfullscreenchange"in t.window.document?this._fullscreenchange="webkitfullscreenchange":"onmsfullscreenchange"in t.window.document&&(this._fullscreenchange="MSFullscreenChange");};dr.prototype.onAdd=function(e){return this._map=e,this._container||(this._container=this._map.getContainer()),this._controlContainer=i.create("div","mapboxgl-ctrl mapboxgl-ctrl-group"),this._checkFullscreenSupport()?this._setupUI():(this._controlContainer.style.display="none",t.warnOnce("This device does not support fullscreen mode.")),this._controlContainer},dr.prototype.onRemove=function(){i.remove(this._controlContainer),this._map=null,t.window.document.removeEventListener(this._fullscreenchange,this._changeIcon);},dr.prototype._checkFullscreenSupport=function(){return !!(t.window.document.fullscreenEnabled||t.window.document.mozFullScreenEnabled||t.window.document.msFullscreenEnabled||t.window.document.webkitFullscreenEnabled)},dr.prototype._setupUI=function(){var e=this._fullscreenButton=i.create("button","mapboxgl-ctrl-fullscreen",this._controlContainer);i.create("span","mapboxgl-ctrl-icon",e).setAttribute("aria-hidden",!0),e.type="button",this._updateTitle(),this._fullscreenButton.addEventListener("click",this._onClickFullscreen),t.window.document.addEventListener(this._fullscreenchange,this._changeIcon);},dr.prototype._updateTitle=function(){var t=this._getTitle();this._fullscreenButton.setAttribute("aria-label",t),this._fullscreenButton.title=t;},dr.prototype._getTitle=function(){return this._map._getUIString(this._isFullscreen()?"FullscreenControl.Exit":"FullscreenControl.Enter")},dr.prototype._isFullscreen=function(){return this._fullscreen},dr.prototype._changeIcon=function(){(t.window.document.fullscreenElement||t.window.document.mozFullScreenElement||t.window.document.webkitFullscreenElement||t.window.document.msFullscreenElement)===this._container!==this._fullscreen&&(this._fullscreen=!this._fullscreen,this._fullscreenButton.classList.toggle("mapboxgl-ctrl-shrink"),this._fullscreenButton.classList.toggle("mapboxgl-ctrl-fullscreen"),this._updateTitle());},dr.prototype._onClickFullscreen=function(){this._isFullscreen()?t.window.document.exitFullscreen?t.window.document.exitFullscreen():t.window.document.mozCancelFullScreen?t.window.document.mozCancelFullScreen():t.window.document.msExitFullscreen?t.window.document.msExitFullscreen():t.window.document.webkitCancelFullScreen&&t.window.document.webkitCancelFullScreen():this._container.requestFullscreen?this._container.requestFullscreen():this._container.mozRequestFullScreen?this._container.mozRequestFullScreen():this._container.msRequestFullscreen?this._container.msRequestFullscreen():this._container.webkitRequestFullscreen&&this._container.webkitRequestFullscreen();};var _r={closeButton:!0,closeOnClick:!0,className:"",maxWidth:"240px"},fr=function(e){function o(i){e.call(this),this.options=t.extend(Object.create(_r),i),t.bindAll(["_update","_onClose","remove"],this);}return e&&(o.__proto__=e),(o.prototype=Object.create(e&&e.prototype)).constructor=o,o.prototype.addTo=function(e){var i=this;return this._map=e,this.options.closeOnClick&&this._map.on("click",this._onClose),this.options.closeOnMove&&this._map.on("move",this._onClose),this._map.on("remove",this.remove),this._update(),this._trackPointer?(this._map.on("mousemove",(function(t){i._update(t.point);})),this._map.on("mouseup",(function(t){i._update(t.point);})),this._container&&this._container.classList.add("mapboxgl-popup-track-pointer"),this._map._canvasContainer.classList.add("mapboxgl-track-pointer")):this._map.on("move",this._update),this.fire(new t.Event("open")),this},o.prototype.isOpen=function(){return !!this._map},o.prototype.remove=function(){return this._content&&i.remove(this._content),this._container&&(i.remove(this._container),delete this._container),this._map&&(this._map.off("move",this._update),this._map.off("move",this._onClose),this._map.off("click",this._onClose),this._map.off("remove",this.remove),this._map.off("mousemove"),delete this._map),this.fire(new t.Event("close")),this},o.prototype.getLngLat=function(){return this._lngLat},o.prototype.setLngLat=function(e){return this._lngLat=t.LngLat.convert(e),this._pos=null,this._trackPointer=!1,this._update(),this._map&&(this._map.on("move",this._update),this._map.off("mousemove"),this._container&&this._container.classList.remove("mapboxgl-popup-track-pointer"),this._map._canvasContainer.classList.remove("mapboxgl-track-pointer")),this},o.prototype.trackPointer=function(){var t=this;return this._trackPointer=!0,this._pos=null,this._update(),this._map&&(this._map.off("move",this._update),this._map.on("mousemove",(function(e){t._update(e.point);})),this._map.on("drag",(function(e){t._update(e.point);})),this._container&&this._container.classList.add("mapboxgl-popup-track-pointer"),this._map._canvasContainer.classList.add("mapboxgl-track-pointer")),this},o.prototype.getElement=function(){return this._container},o.prototype.setText=function(e){return this.setDOMContent(t.window.document.createTextNode(e))},o.prototype.setHTML=function(e){var i,o=t.window.document.createDocumentFragment(),r=t.window.document.createElement("body");for(r.innerHTML=e;i=r.firstChild;)o.appendChild(i);return this.setDOMContent(o)},o.prototype.getMaxWidth=function(){return this._container&&this._container.style.maxWidth},o.prototype.setMaxWidth=function(t){return this.options.maxWidth=t,this._update(),this},o.prototype.setDOMContent=function(t){return this._createContent(),this._content.appendChild(t),this._update(),this},o.prototype.addClassName=function(t){this._container&&this._container.classList.add(t);},o.prototype.removeClassName=function(t){this._container&&this._container.classList.remove(t);},o.prototype.toggleClassName=function(t){if(this._container)return this._container.classList.toggle(t)},o.prototype._createContent=function(){this._content&&i.remove(this._content),this._content=i.create("div","mapboxgl-popup-content",this._container),this.options.closeButton&&(this._closeButton=i.create("button","mapboxgl-popup-close-button",this._content),this._closeButton.type="button",this._closeButton.setAttribute("aria-label","Close popup"),this._closeButton.innerHTML="&#215;",this._closeButton.addEventListener("click",this._onClose));},o.prototype._update=function(e){var o=this;if(this._map&&(this._lngLat||this._trackPointer)&&this._content&&(this._container||(this._container=i.create("div","mapboxgl-popup",this._map.getContainer()),this._tip=i.create("div","mapboxgl-popup-tip",this._container),this._container.appendChild(this._content),this.options.className&&this.options.className.split(" ").forEach((function(t){return o._container.classList.add(t)})),this._trackPointer&&this._container.classList.add("mapboxgl-popup-track-pointer")),this.options.maxWidth&&this._container.style.maxWidth!==this.options.maxWidth&&(this._container.style.maxWidth=this.options.maxWidth),this._map.transform.renderWorldCopies&&!this._trackPointer&&(this._lngLat=tr(this._lngLat,this._pos,this._map.transform)),!this._trackPointer||e)){var r=this._pos=this._trackPointer&&e?e:this._map.project(this._lngLat),a=this.options.anchor,n=function e(i){if(i){if("number"==typeof i){var o=Math.round(Math.sqrt(.5*Math.pow(i,2)));return {center:new t.Point(0,0),top:new t.Point(0,i),"top-left":new t.Point(o,o),"top-right":new t.Point(-o,o),bottom:new t.Point(0,-i),"bottom-left":new t.Point(o,-o),"bottom-right":new t.Point(-o,-o),left:new t.Point(i,0),right:new t.Point(-i,0)}}if(i instanceof t.Point||Array.isArray(i)){var r=t.Point.convert(i);return {center:r,top:r,"top-left":r,"top-right":r,bottom:r,"bottom-left":r,"bottom-right":r,left:r,right:r}}return {center:t.Point.convert(i.center||[0,0]),top:t.Point.convert(i.top||[0,0]),"top-left":t.Point.convert(i["top-left"]||[0,0]),"top-right":t.Point.convert(i["top-right"]||[0,0]),bottom:t.Point.convert(i.bottom||[0,0]),"bottom-left":t.Point.convert(i["bottom-left"]||[0,0]),"bottom-right":t.Point.convert(i["bottom-right"]||[0,0]),left:t.Point.convert(i.left||[0,0]),right:t.Point.convert(i.right||[0,0])}}return e(new t.Point(0,0))}(this.options.offset);if(!a){var s,l=this._container.offsetWidth,c=this._container.offsetHeight;s=r.y+n.bottom.y<c?["top"]:r.y>this._map.transform.height-c?["bottom"]:[],r.x<l/2?s.push("left"):r.x>this._map.transform.width-l/2&&s.push("right"),a=0===s.length?"bottom":s.join("-");}var u=r.add(n[a]).round();i.setTransform(this._container,er[a]+" translate("+u.x+"px,"+u.y+"px)"),ir(this._container,a,"popup");}},o.prototype._onClose=function(){this.remove();},o}(t.Evented),mr={version:t.version,supported:e,setRTLTextPlugin:t.setRTLTextPlugin,getRTLTextPluginStatus:t.getRTLTextPluginStatus,Map:Yo,NavigationControl:$o,GeolocateControl:lr,AttributionControl:No,ScaleControl:ur,FullscreenControl:dr,Popup:fr,Marker:rr,Style:Ne,LngLat:t.LngLat,LngLatBounds:t.LngLatBounds,Point:t.Point,MercatorCoordinate:t.MercatorCoordinate,Evented:t.Evented,config:t.config,get accessToken(){return t.config.ACCESS_TOKEN},set accessToken(e){t.config.ACCESS_TOKEN=e;},get baseApiUrl(){return t.config.API_URL},set baseApiUrl(e){t.config.API_URL=e;},get workerCount(){return kt.workerCount},set workerCount(t){kt.workerCount=t;},get maxParallelImageRequests(){return t.config.MAX_PARALLEL_IMAGE_REQUESTS},set maxParallelImageRequests(e){t.config.MAX_PARALLEL_IMAGE_REQUESTS=e;},clearStorage:function(e){t.clearTileCache(e);},workerUrl:""};return mr}));

//

return mapboxgl;

})));


},{}],4:[function(require,module,exports){
//! moment.js

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.moment = factory()
}(this, (function () { 'use strict';

    var hookCallback;

    function hooks () {
        return hookCallback.apply(null, arguments);
    }

    // This is done to register the method called with moment()
    // without creating circular dependencies.
    function setHookCallback (callback) {
        hookCallback = callback;
    }

    function isArray(input) {
        return input instanceof Array || Object.prototype.toString.call(input) === '[object Array]';
    }

    function isObject(input) {
        // IE8 will treat undefined and null as object if it wasn't for
        // input != null
        return input != null && Object.prototype.toString.call(input) === '[object Object]';
    }

    function isObjectEmpty(obj) {
        if (Object.getOwnPropertyNames) {
            return (Object.getOwnPropertyNames(obj).length === 0);
        } else {
            var k;
            for (k in obj) {
                if (obj.hasOwnProperty(k)) {
                    return false;
                }
            }
            return true;
        }
    }

    function isUndefined(input) {
        return input === void 0;
    }

    function isNumber(input) {
        return typeof input === 'number' || Object.prototype.toString.call(input) === '[object Number]';
    }

    function isDate(input) {
        return input instanceof Date || Object.prototype.toString.call(input) === '[object Date]';
    }

    function map(arr, fn) {
        var res = [], i;
        for (i = 0; i < arr.length; ++i) {
            res.push(fn(arr[i], i));
        }
        return res;
    }

    function hasOwnProp(a, b) {
        return Object.prototype.hasOwnProperty.call(a, b);
    }

    function extend(a, b) {
        for (var i in b) {
            if (hasOwnProp(b, i)) {
                a[i] = b[i];
            }
        }

        if (hasOwnProp(b, 'toString')) {
            a.toString = b.toString;
        }

        if (hasOwnProp(b, 'valueOf')) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function createUTC (input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, true).utc();
    }

    function defaultParsingFlags() {
        // We need to deep clone this object.
        return {
            empty           : false,
            unusedTokens    : [],
            unusedInput     : [],
            overflow        : -2,
            charsLeftOver   : 0,
            nullInput       : false,
            invalidMonth    : null,
            invalidFormat   : false,
            userInvalidated : false,
            iso             : false,
            parsedDateParts : [],
            meridiem        : null,
            rfc2822         : false,
            weekdayMismatch : false
        };
    }

    function getParsingFlags(m) {
        if (m._pf == null) {
            m._pf = defaultParsingFlags();
        }
        return m._pf;
    }

    var some;
    if (Array.prototype.some) {
        some = Array.prototype.some;
    } else {
        some = function (fun) {
            var t = Object(this);
            var len = t.length >>> 0;

            for (var i = 0; i < len; i++) {
                if (i in t && fun.call(this, t[i], i, t)) {
                    return true;
                }
            }

            return false;
        };
    }

    function isValid(m) {
        if (m._isValid == null) {
            var flags = getParsingFlags(m);
            var parsedParts = some.call(flags.parsedDateParts, function (i) {
                return i != null;
            });
            var isNowValid = !isNaN(m._d.getTime()) &&
                flags.overflow < 0 &&
                !flags.empty &&
                !flags.invalidMonth &&
                !flags.invalidWeekday &&
                !flags.weekdayMismatch &&
                !flags.nullInput &&
                !flags.invalidFormat &&
                !flags.userInvalidated &&
                (!flags.meridiem || (flags.meridiem && parsedParts));

            if (m._strict) {
                isNowValid = isNowValid &&
                    flags.charsLeftOver === 0 &&
                    flags.unusedTokens.length === 0 &&
                    flags.bigHour === undefined;
            }

            if (Object.isFrozen == null || !Object.isFrozen(m)) {
                m._isValid = isNowValid;
            }
            else {
                return isNowValid;
            }
        }
        return m._isValid;
    }

    function createInvalid (flags) {
        var m = createUTC(NaN);
        if (flags != null) {
            extend(getParsingFlags(m), flags);
        }
        else {
            getParsingFlags(m).userInvalidated = true;
        }

        return m;
    }

    // Plugins that add properties should also add the key here (null value),
    // so we can properly clone ourselves.
    var momentProperties = hooks.momentProperties = [];

    function copyConfig(to, from) {
        var i, prop, val;

        if (!isUndefined(from._isAMomentObject)) {
            to._isAMomentObject = from._isAMomentObject;
        }
        if (!isUndefined(from._i)) {
            to._i = from._i;
        }
        if (!isUndefined(from._f)) {
            to._f = from._f;
        }
        if (!isUndefined(from._l)) {
            to._l = from._l;
        }
        if (!isUndefined(from._strict)) {
            to._strict = from._strict;
        }
        if (!isUndefined(from._tzm)) {
            to._tzm = from._tzm;
        }
        if (!isUndefined(from._isUTC)) {
            to._isUTC = from._isUTC;
        }
        if (!isUndefined(from._offset)) {
            to._offset = from._offset;
        }
        if (!isUndefined(from._pf)) {
            to._pf = getParsingFlags(from);
        }
        if (!isUndefined(from._locale)) {
            to._locale = from._locale;
        }

        if (momentProperties.length > 0) {
            for (i = 0; i < momentProperties.length; i++) {
                prop = momentProperties[i];
                val = from[prop];
                if (!isUndefined(val)) {
                    to[prop] = val;
                }
            }
        }

        return to;
    }

    var updateInProgress = false;

    // Moment prototype object
    function Moment(config) {
        copyConfig(this, config);
        this._d = new Date(config._d != null ? config._d.getTime() : NaN);
        if (!this.isValid()) {
            this._d = new Date(NaN);
        }
        // Prevent infinite loop in case updateOffset creates new moment
        // objects.
        if (updateInProgress === false) {
            updateInProgress = true;
            hooks.updateOffset(this);
            updateInProgress = false;
        }
    }

    function isMoment (obj) {
        return obj instanceof Moment || (obj != null && obj._isAMomentObject != null);
    }

    function absFloor (number) {
        if (number < 0) {
            // -0 -> 0
            return Math.ceil(number) || 0;
        } else {
            return Math.floor(number);
        }
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            value = absFloor(coercedNumber);
        }

        return value;
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if ((dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    function warn(msg) {
        if (hooks.suppressDeprecationWarnings === false &&
                (typeof console !==  'undefined') && console.warn) {
            console.warn('Deprecation warning: ' + msg);
        }
    }

    function deprecate(msg, fn) {
        var firstTime = true;

        return extend(function () {
            if (hooks.deprecationHandler != null) {
                hooks.deprecationHandler(null, msg);
            }
            if (firstTime) {
                var args = [];
                var arg;
                for (var i = 0; i < arguments.length; i++) {
                    arg = '';
                    if (typeof arguments[i] === 'object') {
                        arg += '\n[' + i + '] ';
                        for (var key in arguments[0]) {
                            arg += key + ': ' + arguments[0][key] + ', ';
                        }
                        arg = arg.slice(0, -2); // Remove trailing comma and space
                    } else {
                        arg = arguments[i];
                    }
                    args.push(arg);
                }
                warn(msg + '\nArguments: ' + Array.prototype.slice.call(args).join('') + '\n' + (new Error()).stack);
                firstTime = false;
            }
            return fn.apply(this, arguments);
        }, fn);
    }

    var deprecations = {};

    function deprecateSimple(name, msg) {
        if (hooks.deprecationHandler != null) {
            hooks.deprecationHandler(name, msg);
        }
        if (!deprecations[name]) {
            warn(msg);
            deprecations[name] = true;
        }
    }

    hooks.suppressDeprecationWarnings = false;
    hooks.deprecationHandler = null;

    function isFunction(input) {
        return input instanceof Function || Object.prototype.toString.call(input) === '[object Function]';
    }

    function set (config) {
        var prop, i;
        for (i in config) {
            prop = config[i];
            if (isFunction(prop)) {
                this[i] = prop;
            } else {
                this['_' + i] = prop;
            }
        }
        this._config = config;
        // Lenient ordinal parsing accepts just a number in addition to
        // number + (possibly) stuff coming from _dayOfMonthOrdinalParse.
        // TODO: Remove "ordinalParse" fallback in next major release.
        this._dayOfMonthOrdinalParseLenient = new RegExp(
            (this._dayOfMonthOrdinalParse.source || this._ordinalParse.source) +
                '|' + (/\d{1,2}/).source);
    }

    function mergeConfigs(parentConfig, childConfig) {
        var res = extend({}, parentConfig), prop;
        for (prop in childConfig) {
            if (hasOwnProp(childConfig, prop)) {
                if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
                    res[prop] = {};
                    extend(res[prop], parentConfig[prop]);
                    extend(res[prop], childConfig[prop]);
                } else if (childConfig[prop] != null) {
                    res[prop] = childConfig[prop];
                } else {
                    delete res[prop];
                }
            }
        }
        for (prop in parentConfig) {
            if (hasOwnProp(parentConfig, prop) &&
                    !hasOwnProp(childConfig, prop) &&
                    isObject(parentConfig[prop])) {
                // make sure changes to properties don't modify parent config
                res[prop] = extend({}, res[prop]);
            }
        }
        return res;
    }

    function Locale(config) {
        if (config != null) {
            this.set(config);
        }
    }

    var keys;

    if (Object.keys) {
        keys = Object.keys;
    } else {
        keys = function (obj) {
            var i, res = [];
            for (i in obj) {
                if (hasOwnProp(obj, i)) {
                    res.push(i);
                }
            }
            return res;
        };
    }

    var defaultCalendar = {
        sameDay : '[Today at] LT',
        nextDay : '[Tomorrow at] LT',
        nextWeek : 'dddd [at] LT',
        lastDay : '[Yesterday at] LT',
        lastWeek : '[Last] dddd [at] LT',
        sameElse : 'L'
    };

    function calendar (key, mom, now) {
        var output = this._calendar[key] || this._calendar['sameElse'];
        return isFunction(output) ? output.call(mom, now) : output;
    }

    var defaultLongDateFormat = {
        LTS  : 'h:mm:ss A',
        LT   : 'h:mm A',
        L    : 'MM/DD/YYYY',
        LL   : 'MMMM D, YYYY',
        LLL  : 'MMMM D, YYYY h:mm A',
        LLLL : 'dddd, MMMM D, YYYY h:mm A'
    };

    function longDateFormat (key) {
        var format = this._longDateFormat[key],
            formatUpper = this._longDateFormat[key.toUpperCase()];

        if (format || !formatUpper) {
            return format;
        }

        this._longDateFormat[key] = formatUpper.replace(/MMMM|MM|DD|dddd/g, function (val) {
            return val.slice(1);
        });

        return this._longDateFormat[key];
    }

    var defaultInvalidDate = 'Invalid date';

    function invalidDate () {
        return this._invalidDate;
    }

    var defaultOrdinal = '%d';
    var defaultDayOfMonthOrdinalParse = /\d{1,2}/;

    function ordinal (number) {
        return this._ordinal.replace('%d', number);
    }

    var defaultRelativeTime = {
        future : 'in %s',
        past   : '%s ago',
        s  : 'a few seconds',
        ss : '%d seconds',
        m  : 'a minute',
        mm : '%d minutes',
        h  : 'an hour',
        hh : '%d hours',
        d  : 'a day',
        dd : '%d days',
        M  : 'a month',
        MM : '%d months',
        y  : 'a year',
        yy : '%d years'
    };

    function relativeTime (number, withoutSuffix, string, isFuture) {
        var output = this._relativeTime[string];
        return (isFunction(output)) ?
            output(number, withoutSuffix, string, isFuture) :
            output.replace(/%d/i, number);
    }

    function pastFuture (diff, output) {
        var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
        return isFunction(format) ? format(output) : format.replace(/%s/i, output);
    }

    var aliases = {};

    function addUnitAlias (unit, shorthand) {
        var lowerCase = unit.toLowerCase();
        aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
    }

    function normalizeUnits(units) {
        return typeof units === 'string' ? aliases[units] || aliases[units.toLowerCase()] : undefined;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (hasOwnProp(inputObject, prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    var priorities = {};

    function addUnitPriority(unit, priority) {
        priorities[unit] = priority;
    }

    function getPrioritizedUnits(unitsObj) {
        var units = [];
        for (var u in unitsObj) {
            units.push({unit: u, priority: priorities[u]});
        }
        units.sort(function (a, b) {
            return a.priority - b.priority;
        });
        return units;
    }

    function zeroFill(number, targetLength, forceSign) {
        var absNumber = '' + Math.abs(number),
            zerosToFill = targetLength - absNumber.length,
            sign = number >= 0;
        return (sign ? (forceSign ? '+' : '') : '-') +
            Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) + absNumber;
    }

    var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g;

    var localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g;

    var formatFunctions = {};

    var formatTokenFunctions = {};

    // token:    'M'
    // padded:   ['MM', 2]
    // ordinal:  'Mo'
    // callback: function () { this.month() + 1 }
    function addFormatToken (token, padded, ordinal, callback) {
        var func = callback;
        if (typeof callback === 'string') {
            func = function () {
                return this[callback]();
            };
        }
        if (token) {
            formatTokenFunctions[token] = func;
        }
        if (padded) {
            formatTokenFunctions[padded[0]] = function () {
                return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
            };
        }
        if (ordinal) {
            formatTokenFunctions[ordinal] = function () {
                return this.localeData().ordinal(func.apply(this, arguments), token);
            };
        }
    }

    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, '');
        }
        return input.replace(/\\/g, '');
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = '', i;
            for (i = 0; i < length; i++) {
                output += isFunction(array[i]) ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {
        if (!m.isValid()) {
            return m.localeData().invalidDate();
        }

        format = expandFormat(format, m.localeData());
        formatFunctions[format] = formatFunctions[format] || makeFormatFunction(format);

        return formatFunctions[format](m);
    }

    function expandFormat(format, locale) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return locale.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }

    var match1         = /\d/;            //       0 - 9
    var match2         = /\d\d/;          //      00 - 99
    var match3         = /\d{3}/;         //     000 - 999
    var match4         = /\d{4}/;         //    0000 - 9999
    var match6         = /[+-]?\d{6}/;    // -999999 - 999999
    var match1to2      = /\d\d?/;         //       0 - 99
    var match3to4      = /\d\d\d\d?/;     //     999 - 9999
    var match5to6      = /\d\d\d\d\d\d?/; //   99999 - 999999
    var match1to3      = /\d{1,3}/;       //       0 - 999
    var match1to4      = /\d{1,4}/;       //       0 - 9999
    var match1to6      = /[+-]?\d{1,6}/;  // -999999 - 999999

    var matchUnsigned  = /\d+/;           //       0 - inf
    var matchSigned    = /[+-]?\d+/;      //    -inf - inf

    var matchOffset    = /Z|[+-]\d\d:?\d\d/gi; // +00:00 -00:00 +0000 -0000 or Z
    var matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi; // +00 -00 +00:00 -00:00 +0000 -0000 or Z

    var matchTimestamp = /[+-]?\d+(\.\d{1,3})?/; // 123456789 123456789.123

    // any word (or two) characters or numbers including two/three word month in arabic.
    // includes scottish gaelic two word and hyphenated months
    var matchWord = /[0-9]{0,256}['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFF07\uFF10-\uFFEF]{1,256}|[\u0600-\u06FF\/]{1,256}(\s*?[\u0600-\u06FF]{1,256}){1,2}/i;

    var regexes = {};

    function addRegexToken (token, regex, strictRegex) {
        regexes[token] = isFunction(regex) ? regex : function (isStrict, localeData) {
            return (isStrict && strictRegex) ? strictRegex : regex;
        };
    }

    function getParseRegexForToken (token, config) {
        if (!hasOwnProp(regexes, token)) {
            return new RegExp(unescapeFormat(token));
        }

        return regexes[token](config._strict, config._locale);
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function unescapeFormat(s) {
        return regexEscape(s.replace('\\', '').replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
            return p1 || p2 || p3 || p4;
        }));
    }

    function regexEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    var tokens = {};

    function addParseToken (token, callback) {
        var i, func = callback;
        if (typeof token === 'string') {
            token = [token];
        }
        if (isNumber(callback)) {
            func = function (input, array) {
                array[callback] = toInt(input);
            };
        }
        for (i = 0; i < token.length; i++) {
            tokens[token[i]] = func;
        }
    }

    function addWeekParseToken (token, callback) {
        addParseToken(token, function (input, array, config, token) {
            config._w = config._w || {};
            callback(input, config._w, config, token);
        });
    }

    function addTimeToArrayFromToken(token, input, config) {
        if (input != null && hasOwnProp(tokens, token)) {
            tokens[token](input, config._a, config, token);
        }
    }

    var YEAR = 0;
    var MONTH = 1;
    var DATE = 2;
    var HOUR = 3;
    var MINUTE = 4;
    var SECOND = 5;
    var MILLISECOND = 6;
    var WEEK = 7;
    var WEEKDAY = 8;

    // FORMATTING

    addFormatToken('Y', 0, 0, function () {
        var y = this.year();
        return y <= 9999 ? '' + y : '+' + y;
    });

    addFormatToken(0, ['YY', 2], 0, function () {
        return this.year() % 100;
    });

    addFormatToken(0, ['YYYY',   4],       0, 'year');
    addFormatToken(0, ['YYYYY',  5],       0, 'year');
    addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

    // ALIASES

    addUnitAlias('year', 'y');

    // PRIORITIES

    addUnitPriority('year', 1);

    // PARSING

    addRegexToken('Y',      matchSigned);
    addRegexToken('YY',     match1to2, match2);
    addRegexToken('YYYY',   match1to4, match4);
    addRegexToken('YYYYY',  match1to6, match6);
    addRegexToken('YYYYYY', match1to6, match6);

    addParseToken(['YYYYY', 'YYYYYY'], YEAR);
    addParseToken('YYYY', function (input, array) {
        array[YEAR] = input.length === 2 ? hooks.parseTwoDigitYear(input) : toInt(input);
    });
    addParseToken('YY', function (input, array) {
        array[YEAR] = hooks.parseTwoDigitYear(input);
    });
    addParseToken('Y', function (input, array) {
        array[YEAR] = parseInt(input, 10);
    });

    // HELPERS

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    // HOOKS

    hooks.parseTwoDigitYear = function (input) {
        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    };

    // MOMENTS

    var getSetYear = makeGetSet('FullYear', true);

    function getIsLeapYear () {
        return isLeapYear(this.year());
    }

    function makeGetSet (unit, keepTime) {
        return function (value) {
            if (value != null) {
                set$1(this, unit, value);
                hooks.updateOffset(this, keepTime);
                return this;
            } else {
                return get(this, unit);
            }
        };
    }

    function get (mom, unit) {
        return mom.isValid() ?
            mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]() : NaN;
    }

    function set$1 (mom, unit, value) {
        if (mom.isValid() && !isNaN(value)) {
            if (unit === 'FullYear' && isLeapYear(mom.year()) && mom.month() === 1 && mom.date() === 29) {
                mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value, mom.month(), daysInMonth(value, mom.month()));
            }
            else {
                mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
            }
        }
    }

    // MOMENTS

    function stringGet (units) {
        units = normalizeUnits(units);
        if (isFunction(this[units])) {
            return this[units]();
        }
        return this;
    }


    function stringSet (units, value) {
        if (typeof units === 'object') {
            units = normalizeObjectUnits(units);
            var prioritized = getPrioritizedUnits(units);
            for (var i = 0; i < prioritized.length; i++) {
                this[prioritized[i].unit](units[prioritized[i].unit]);
            }
        } else {
            units = normalizeUnits(units);
            if (isFunction(this[units])) {
                return this[units](value);
            }
        }
        return this;
    }

    function mod(n, x) {
        return ((n % x) + x) % x;
    }

    var indexOf;

    if (Array.prototype.indexOf) {
        indexOf = Array.prototype.indexOf;
    } else {
        indexOf = function (o) {
            // I know
            var i;
            for (i = 0; i < this.length; ++i) {
                if (this[i] === o) {
                    return i;
                }
            }
            return -1;
        };
    }

    function daysInMonth(year, month) {
        if (isNaN(year) || isNaN(month)) {
            return NaN;
        }
        var modMonth = mod(month, 12);
        year += (month - modMonth) / 12;
        return modMonth === 1 ? (isLeapYear(year) ? 29 : 28) : (31 - modMonth % 7 % 2);
    }

    // FORMATTING

    addFormatToken('M', ['MM', 2], 'Mo', function () {
        return this.month() + 1;
    });

    addFormatToken('MMM', 0, 0, function (format) {
        return this.localeData().monthsShort(this, format);
    });

    addFormatToken('MMMM', 0, 0, function (format) {
        return this.localeData().months(this, format);
    });

    // ALIASES

    addUnitAlias('month', 'M');

    // PRIORITY

    addUnitPriority('month', 8);

    // PARSING

    addRegexToken('M',    match1to2);
    addRegexToken('MM',   match1to2, match2);
    addRegexToken('MMM',  function (isStrict, locale) {
        return locale.monthsShortRegex(isStrict);
    });
    addRegexToken('MMMM', function (isStrict, locale) {
        return locale.monthsRegex(isStrict);
    });

    addParseToken(['M', 'MM'], function (input, array) {
        array[MONTH] = toInt(input) - 1;
    });

    addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
        var month = config._locale.monthsParse(input, token, config._strict);
        // if we didn't find a month name, mark the date as invalid.
        if (month != null) {
            array[MONTH] = month;
        } else {
            getParsingFlags(config).invalidMonth = input;
        }
    });

    // LOCALES

    var MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/;
    var defaultLocaleMonths = 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_');
    function localeMonths (m, format) {
        if (!m) {
            return isArray(this._months) ? this._months :
                this._months['standalone'];
        }
        return isArray(this._months) ? this._months[m.month()] :
            this._months[(this._months.isFormat || MONTHS_IN_FORMAT).test(format) ? 'format' : 'standalone'][m.month()];
    }

    var defaultLocaleMonthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_');
    function localeMonthsShort (m, format) {
        if (!m) {
            return isArray(this._monthsShort) ? this._monthsShort :
                this._monthsShort['standalone'];
        }
        return isArray(this._monthsShort) ? this._monthsShort[m.month()] :
            this._monthsShort[MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'][m.month()];
    }

    function handleStrictParse(monthName, format, strict) {
        var i, ii, mom, llc = monthName.toLocaleLowerCase();
        if (!this._monthsParse) {
            // this is not used
            this._monthsParse = [];
            this._longMonthsParse = [];
            this._shortMonthsParse = [];
            for (i = 0; i < 12; ++i) {
                mom = createUTC([2000, i]);
                this._shortMonthsParse[i] = this.monthsShort(mom, '').toLocaleLowerCase();
                this._longMonthsParse[i] = this.months(mom, '').toLocaleLowerCase();
            }
        }

        if (strict) {
            if (format === 'MMM') {
                ii = indexOf.call(this._shortMonthsParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._longMonthsParse, llc);
                return ii !== -1 ? ii : null;
            }
        } else {
            if (format === 'MMM') {
                ii = indexOf.call(this._shortMonthsParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._longMonthsParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._longMonthsParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortMonthsParse, llc);
                return ii !== -1 ? ii : null;
            }
        }
    }

    function localeMonthsParse (monthName, format, strict) {
        var i, mom, regex;

        if (this._monthsParseExact) {
            return handleStrictParse.call(this, monthName, format, strict);
        }

        if (!this._monthsParse) {
            this._monthsParse = [];
            this._longMonthsParse = [];
            this._shortMonthsParse = [];
        }

        // TODO: add sorting
        // Sorting makes sure if one month (or abbr) is a prefix of another
        // see sorting in computeMonthsParse
        for (i = 0; i < 12; i++) {
            // make the regex if we don't have it already
            mom = createUTC([2000, i]);
            if (strict && !this._longMonthsParse[i]) {
                this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
                this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
            }
            if (!strict && !this._monthsParse[i]) {
                regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
                return i;
            } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
                return i;
            } else if (!strict && this._monthsParse[i].test(monthName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function setMonth (mom, value) {
        var dayOfMonth;

        if (!mom.isValid()) {
            // No op
            return mom;
        }

        if (typeof value === 'string') {
            if (/^\d+$/.test(value)) {
                value = toInt(value);
            } else {
                value = mom.localeData().monthsParse(value);
                // TODO: Another silent failure?
                if (!isNumber(value)) {
                    return mom;
                }
            }
        }

        dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
        return mom;
    }

    function getSetMonth (value) {
        if (value != null) {
            setMonth(this, value);
            hooks.updateOffset(this, true);
            return this;
        } else {
            return get(this, 'Month');
        }
    }

    function getDaysInMonth () {
        return daysInMonth(this.year(), this.month());
    }

    var defaultMonthsShortRegex = matchWord;
    function monthsShortRegex (isStrict) {
        if (this._monthsParseExact) {
            if (!hasOwnProp(this, '_monthsRegex')) {
                computeMonthsParse.call(this);
            }
            if (isStrict) {
                return this._monthsShortStrictRegex;
            } else {
                return this._monthsShortRegex;
            }
        } else {
            if (!hasOwnProp(this, '_monthsShortRegex')) {
                this._monthsShortRegex = defaultMonthsShortRegex;
            }
            return this._monthsShortStrictRegex && isStrict ?
                this._monthsShortStrictRegex : this._monthsShortRegex;
        }
    }

    var defaultMonthsRegex = matchWord;
    function monthsRegex (isStrict) {
        if (this._monthsParseExact) {
            if (!hasOwnProp(this, '_monthsRegex')) {
                computeMonthsParse.call(this);
            }
            if (isStrict) {
                return this._monthsStrictRegex;
            } else {
                return this._monthsRegex;
            }
        } else {
            if (!hasOwnProp(this, '_monthsRegex')) {
                this._monthsRegex = defaultMonthsRegex;
            }
            return this._monthsStrictRegex && isStrict ?
                this._monthsStrictRegex : this._monthsRegex;
        }
    }

    function computeMonthsParse () {
        function cmpLenRev(a, b) {
            return b.length - a.length;
        }

        var shortPieces = [], longPieces = [], mixedPieces = [],
            i, mom;
        for (i = 0; i < 12; i++) {
            // make the regex if we don't have it already
            mom = createUTC([2000, i]);
            shortPieces.push(this.monthsShort(mom, ''));
            longPieces.push(this.months(mom, ''));
            mixedPieces.push(this.months(mom, ''));
            mixedPieces.push(this.monthsShort(mom, ''));
        }
        // Sorting makes sure if one month (or abbr) is a prefix of another it
        // will match the longer piece.
        shortPieces.sort(cmpLenRev);
        longPieces.sort(cmpLenRev);
        mixedPieces.sort(cmpLenRev);
        for (i = 0; i < 12; i++) {
            shortPieces[i] = regexEscape(shortPieces[i]);
            longPieces[i] = regexEscape(longPieces[i]);
        }
        for (i = 0; i < 24; i++) {
            mixedPieces[i] = regexEscape(mixedPieces[i]);
        }

        this._monthsRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
        this._monthsShortRegex = this._monthsRegex;
        this._monthsStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
        this._monthsShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
    }

    function createDate (y, m, d, h, M, s, ms) {
        // can't just apply() to create a date:
        // https://stackoverflow.com/q/181348
        var date;
        // the date constructor remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0) {
            // preserve leap years using a full 400 year cycle, then reset
            date = new Date(y + 400, m, d, h, M, s, ms);
            if (isFinite(date.getFullYear())) {
                date.setFullYear(y);
            }
        } else {
            date = new Date(y, m, d, h, M, s, ms);
        }

        return date;
    }

    function createUTCDate (y) {
        var date;
        // the Date.UTC function remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0) {
            var args = Array.prototype.slice.call(arguments);
            // preserve leap years using a full 400 year cycle, then reset
            args[0] = y + 400;
            date = new Date(Date.UTC.apply(null, args));
            if (isFinite(date.getUTCFullYear())) {
                date.setUTCFullYear(y);
            }
        } else {
            date = new Date(Date.UTC.apply(null, arguments));
        }

        return date;
    }

    // start-of-first-week - start-of-year
    function firstWeekOffset(year, dow, doy) {
        var // first-week day -- which january is always in the first week (4 for iso, 1 for other)
            fwd = 7 + dow - doy,
            // first-week day local weekday -- which local weekday is fwd
            fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;

        return -fwdlw + fwd - 1;
    }

    // https://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
        var localWeekday = (7 + weekday - dow) % 7,
            weekOffset = firstWeekOffset(year, dow, doy),
            dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset,
            resYear, resDayOfYear;

        if (dayOfYear <= 0) {
            resYear = year - 1;
            resDayOfYear = daysInYear(resYear) + dayOfYear;
        } else if (dayOfYear > daysInYear(year)) {
            resYear = year + 1;
            resDayOfYear = dayOfYear - daysInYear(year);
        } else {
            resYear = year;
            resDayOfYear = dayOfYear;
        }

        return {
            year: resYear,
            dayOfYear: resDayOfYear
        };
    }

    function weekOfYear(mom, dow, doy) {
        var weekOffset = firstWeekOffset(mom.year(), dow, doy),
            week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1,
            resWeek, resYear;

        if (week < 1) {
            resYear = mom.year() - 1;
            resWeek = week + weeksInYear(resYear, dow, doy);
        } else if (week > weeksInYear(mom.year(), dow, doy)) {
            resWeek = week - weeksInYear(mom.year(), dow, doy);
            resYear = mom.year() + 1;
        } else {
            resYear = mom.year();
            resWeek = week;
        }

        return {
            week: resWeek,
            year: resYear
        };
    }

    function weeksInYear(year, dow, doy) {
        var weekOffset = firstWeekOffset(year, dow, doy),
            weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
        return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
    }

    // FORMATTING

    addFormatToken('w', ['ww', 2], 'wo', 'week');
    addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

    // ALIASES

    addUnitAlias('week', 'w');
    addUnitAlias('isoWeek', 'W');

    // PRIORITIES

    addUnitPriority('week', 5);
    addUnitPriority('isoWeek', 5);

    // PARSING

    addRegexToken('w',  match1to2);
    addRegexToken('ww', match1to2, match2);
    addRegexToken('W',  match1to2);
    addRegexToken('WW', match1to2, match2);

    addWeekParseToken(['w', 'ww', 'W', 'WW'], function (input, week, config, token) {
        week[token.substr(0, 1)] = toInt(input);
    });

    // HELPERS

    // LOCALES

    function localeWeek (mom) {
        return weekOfYear(mom, this._week.dow, this._week.doy).week;
    }

    var defaultLocaleWeek = {
        dow : 0, // Sunday is the first day of the week.
        doy : 6  // The week that contains Jan 6th is the first week of the year.
    };

    function localeFirstDayOfWeek () {
        return this._week.dow;
    }

    function localeFirstDayOfYear () {
        return this._week.doy;
    }

    // MOMENTS

    function getSetWeek (input) {
        var week = this.localeData().week(this);
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    function getSetISOWeek (input) {
        var week = weekOfYear(this, 1, 4).week;
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    // FORMATTING

    addFormatToken('d', 0, 'do', 'day');

    addFormatToken('dd', 0, 0, function (format) {
        return this.localeData().weekdaysMin(this, format);
    });

    addFormatToken('ddd', 0, 0, function (format) {
        return this.localeData().weekdaysShort(this, format);
    });

    addFormatToken('dddd', 0, 0, function (format) {
        return this.localeData().weekdays(this, format);
    });

    addFormatToken('e', 0, 0, 'weekday');
    addFormatToken('E', 0, 0, 'isoWeekday');

    // ALIASES

    addUnitAlias('day', 'd');
    addUnitAlias('weekday', 'e');
    addUnitAlias('isoWeekday', 'E');

    // PRIORITY
    addUnitPriority('day', 11);
    addUnitPriority('weekday', 11);
    addUnitPriority('isoWeekday', 11);

    // PARSING

    addRegexToken('d',    match1to2);
    addRegexToken('e',    match1to2);
    addRegexToken('E',    match1to2);
    addRegexToken('dd',   function (isStrict, locale) {
        return locale.weekdaysMinRegex(isStrict);
    });
    addRegexToken('ddd',   function (isStrict, locale) {
        return locale.weekdaysShortRegex(isStrict);
    });
    addRegexToken('dddd',   function (isStrict, locale) {
        return locale.weekdaysRegex(isStrict);
    });

    addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config, token) {
        var weekday = config._locale.weekdaysParse(input, token, config._strict);
        // if we didn't get a weekday name, mark the date as invalid
        if (weekday != null) {
            week.d = weekday;
        } else {
            getParsingFlags(config).invalidWeekday = input;
        }
    });

    addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
        week[token] = toInt(input);
    });

    // HELPERS

    function parseWeekday(input, locale) {
        if (typeof input !== 'string') {
            return input;
        }

        if (!isNaN(input)) {
            return parseInt(input, 10);
        }

        input = locale.weekdaysParse(input);
        if (typeof input === 'number') {
            return input;
        }

        return null;
    }

    function parseIsoWeekday(input, locale) {
        if (typeof input === 'string') {
            return locale.weekdaysParse(input) % 7 || 7;
        }
        return isNaN(input) ? null : input;
    }

    // LOCALES
    function shiftWeekdays (ws, n) {
        return ws.slice(n, 7).concat(ws.slice(0, n));
    }

    var defaultLocaleWeekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_');
    function localeWeekdays (m, format) {
        var weekdays = isArray(this._weekdays) ? this._weekdays :
            this._weekdays[(m && m !== true && this._weekdays.isFormat.test(format)) ? 'format' : 'standalone'];
        return (m === true) ? shiftWeekdays(weekdays, this._week.dow)
            : (m) ? weekdays[m.day()] : weekdays;
    }

    var defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_');
    function localeWeekdaysShort (m) {
        return (m === true) ? shiftWeekdays(this._weekdaysShort, this._week.dow)
            : (m) ? this._weekdaysShort[m.day()] : this._weekdaysShort;
    }

    var defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_');
    function localeWeekdaysMin (m) {
        return (m === true) ? shiftWeekdays(this._weekdaysMin, this._week.dow)
            : (m) ? this._weekdaysMin[m.day()] : this._weekdaysMin;
    }

    function handleStrictParse$1(weekdayName, format, strict) {
        var i, ii, mom, llc = weekdayName.toLocaleLowerCase();
        if (!this._weekdaysParse) {
            this._weekdaysParse = [];
            this._shortWeekdaysParse = [];
            this._minWeekdaysParse = [];

            for (i = 0; i < 7; ++i) {
                mom = createUTC([2000, 1]).day(i);
                this._minWeekdaysParse[i] = this.weekdaysMin(mom, '').toLocaleLowerCase();
                this._shortWeekdaysParse[i] = this.weekdaysShort(mom, '').toLocaleLowerCase();
                this._weekdaysParse[i] = this.weekdays(mom, '').toLocaleLowerCase();
            }
        }

        if (strict) {
            if (format === 'dddd') {
                ii = indexOf.call(this._weekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else if (format === 'ddd') {
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            }
        } else {
            if (format === 'dddd') {
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else if (format === 'ddd') {
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._minWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            }
        }
    }

    function localeWeekdaysParse (weekdayName, format, strict) {
        var i, mom, regex;

        if (this._weekdaysParseExact) {
            return handleStrictParse$1.call(this, weekdayName, format, strict);
        }

        if (!this._weekdaysParse) {
            this._weekdaysParse = [];
            this._minWeekdaysParse = [];
            this._shortWeekdaysParse = [];
            this._fullWeekdaysParse = [];
        }

        for (i = 0; i < 7; i++) {
            // make the regex if we don't have it already

            mom = createUTC([2000, 1]).day(i);
            if (strict && !this._fullWeekdaysParse[i]) {
                this._fullWeekdaysParse[i] = new RegExp('^' + this.weekdays(mom, '').replace('.', '\\.?') + '$', 'i');
                this._shortWeekdaysParse[i] = new RegExp('^' + this.weekdaysShort(mom, '').replace('.', '\\.?') + '$', 'i');
                this._minWeekdaysParse[i] = new RegExp('^' + this.weekdaysMin(mom, '').replace('.', '\\.?') + '$', 'i');
            }
            if (!this._weekdaysParse[i]) {
                regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (strict && format === 'dddd' && this._fullWeekdaysParse[i].test(weekdayName)) {
                return i;
            } else if (strict && format === 'ddd' && this._shortWeekdaysParse[i].test(weekdayName)) {
                return i;
            } else if (strict && format === 'dd' && this._minWeekdaysParse[i].test(weekdayName)) {
                return i;
            } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function getSetDayOfWeek (input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
        if (input != null) {
            input = parseWeekday(input, this.localeData());
            return this.add(input - day, 'd');
        } else {
            return day;
        }
    }

    function getSetLocaleDayOfWeek (input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
        return input == null ? weekday : this.add(input - weekday, 'd');
    }

    function getSetISODayOfWeek (input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }

        // behaves the same as moment#day except
        // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
        // as a setter, sunday should belong to the previous week.

        if (input != null) {
            var weekday = parseIsoWeekday(input, this.localeData());
            return this.day(this.day() % 7 ? weekday : weekday - 7);
        } else {
            return this.day() || 7;
        }
    }

    var defaultWeekdaysRegex = matchWord;
    function weekdaysRegex (isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysStrictRegex;
            } else {
                return this._weekdaysRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                this._weekdaysRegex = defaultWeekdaysRegex;
            }
            return this._weekdaysStrictRegex && isStrict ?
                this._weekdaysStrictRegex : this._weekdaysRegex;
        }
    }

    var defaultWeekdaysShortRegex = matchWord;
    function weekdaysShortRegex (isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysShortStrictRegex;
            } else {
                return this._weekdaysShortRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysShortRegex')) {
                this._weekdaysShortRegex = defaultWeekdaysShortRegex;
            }
            return this._weekdaysShortStrictRegex && isStrict ?
                this._weekdaysShortStrictRegex : this._weekdaysShortRegex;
        }
    }

    var defaultWeekdaysMinRegex = matchWord;
    function weekdaysMinRegex (isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysMinStrictRegex;
            } else {
                return this._weekdaysMinRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysMinRegex')) {
                this._weekdaysMinRegex = defaultWeekdaysMinRegex;
            }
            return this._weekdaysMinStrictRegex && isStrict ?
                this._weekdaysMinStrictRegex : this._weekdaysMinRegex;
        }
    }


    function computeWeekdaysParse () {
        function cmpLenRev(a, b) {
            return b.length - a.length;
        }

        var minPieces = [], shortPieces = [], longPieces = [], mixedPieces = [],
            i, mom, minp, shortp, longp;
        for (i = 0; i < 7; i++) {
            // make the regex if we don't have it already
            mom = createUTC([2000, 1]).day(i);
            minp = this.weekdaysMin(mom, '');
            shortp = this.weekdaysShort(mom, '');
            longp = this.weekdays(mom, '');
            minPieces.push(minp);
            shortPieces.push(shortp);
            longPieces.push(longp);
            mixedPieces.push(minp);
            mixedPieces.push(shortp);
            mixedPieces.push(longp);
        }
        // Sorting makes sure if one weekday (or abbr) is a prefix of another it
        // will match the longer piece.
        minPieces.sort(cmpLenRev);
        shortPieces.sort(cmpLenRev);
        longPieces.sort(cmpLenRev);
        mixedPieces.sort(cmpLenRev);
        for (i = 0; i < 7; i++) {
            shortPieces[i] = regexEscape(shortPieces[i]);
            longPieces[i] = regexEscape(longPieces[i]);
            mixedPieces[i] = regexEscape(mixedPieces[i]);
        }

        this._weekdaysRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
        this._weekdaysShortRegex = this._weekdaysRegex;
        this._weekdaysMinRegex = this._weekdaysRegex;

        this._weekdaysStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
        this._weekdaysShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
        this._weekdaysMinStrictRegex = new RegExp('^(' + minPieces.join('|') + ')', 'i');
    }

    // FORMATTING

    function hFormat() {
        return this.hours() % 12 || 12;
    }

    function kFormat() {
        return this.hours() || 24;
    }

    addFormatToken('H', ['HH', 2], 0, 'hour');
    addFormatToken('h', ['hh', 2], 0, hFormat);
    addFormatToken('k', ['kk', 2], 0, kFormat);

    addFormatToken('hmm', 0, 0, function () {
        return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2);
    });

    addFormatToken('hmmss', 0, 0, function () {
        return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2) +
            zeroFill(this.seconds(), 2);
    });

    addFormatToken('Hmm', 0, 0, function () {
        return '' + this.hours() + zeroFill(this.minutes(), 2);
    });

    addFormatToken('Hmmss', 0, 0, function () {
        return '' + this.hours() + zeroFill(this.minutes(), 2) +
            zeroFill(this.seconds(), 2);
    });

    function meridiem (token, lowercase) {
        addFormatToken(token, 0, 0, function () {
            return this.localeData().meridiem(this.hours(), this.minutes(), lowercase);
        });
    }

    meridiem('a', true);
    meridiem('A', false);

    // ALIASES

    addUnitAlias('hour', 'h');

    // PRIORITY
    addUnitPriority('hour', 13);

    // PARSING

    function matchMeridiem (isStrict, locale) {
        return locale._meridiemParse;
    }

    addRegexToken('a',  matchMeridiem);
    addRegexToken('A',  matchMeridiem);
    addRegexToken('H',  match1to2);
    addRegexToken('h',  match1to2);
    addRegexToken('k',  match1to2);
    addRegexToken('HH', match1to2, match2);
    addRegexToken('hh', match1to2, match2);
    addRegexToken('kk', match1to2, match2);

    addRegexToken('hmm', match3to4);
    addRegexToken('hmmss', match5to6);
    addRegexToken('Hmm', match3to4);
    addRegexToken('Hmmss', match5to6);

    addParseToken(['H', 'HH'], HOUR);
    addParseToken(['k', 'kk'], function (input, array, config) {
        var kInput = toInt(input);
        array[HOUR] = kInput === 24 ? 0 : kInput;
    });
    addParseToken(['a', 'A'], function (input, array, config) {
        config._isPm = config._locale.isPM(input);
        config._meridiem = input;
    });
    addParseToken(['h', 'hh'], function (input, array, config) {
        array[HOUR] = toInt(input);
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('hmm', function (input, array, config) {
        var pos = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos));
        array[MINUTE] = toInt(input.substr(pos));
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('hmmss', function (input, array, config) {
        var pos1 = input.length - 4;
        var pos2 = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos1));
        array[MINUTE] = toInt(input.substr(pos1, 2));
        array[SECOND] = toInt(input.substr(pos2));
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('Hmm', function (input, array, config) {
        var pos = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos));
        array[MINUTE] = toInt(input.substr(pos));
    });
    addParseToken('Hmmss', function (input, array, config) {
        var pos1 = input.length - 4;
        var pos2 = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos1));
        array[MINUTE] = toInt(input.substr(pos1, 2));
        array[SECOND] = toInt(input.substr(pos2));
    });

    // LOCALES

    function localeIsPM (input) {
        // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
        // Using charAt should be more compatible.
        return ((input + '').toLowerCase().charAt(0) === 'p');
    }

    var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i;
    function localeMeridiem (hours, minutes, isLower) {
        if (hours > 11) {
            return isLower ? 'pm' : 'PM';
        } else {
            return isLower ? 'am' : 'AM';
        }
    }


    // MOMENTS

    // Setting the hour should keep the time, because the user explicitly
    // specified which hour they want. So trying to maintain the same hour (in
    // a new timezone) makes sense. Adding/subtracting hours does not follow
    // this rule.
    var getSetHour = makeGetSet('Hours', true);

    var baseConfig = {
        calendar: defaultCalendar,
        longDateFormat: defaultLongDateFormat,
        invalidDate: defaultInvalidDate,
        ordinal: defaultOrdinal,
        dayOfMonthOrdinalParse: defaultDayOfMonthOrdinalParse,
        relativeTime: defaultRelativeTime,

        months: defaultLocaleMonths,
        monthsShort: defaultLocaleMonthsShort,

        week: defaultLocaleWeek,

        weekdays: defaultLocaleWeekdays,
        weekdaysMin: defaultLocaleWeekdaysMin,
        weekdaysShort: defaultLocaleWeekdaysShort,

        meridiemParse: defaultLocaleMeridiemParse
    };

    // internal storage for locale config files
    var locales = {};
    var localeFamilies = {};
    var globalLocale;

    function normalizeLocale(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // pick the locale from the array
    // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
    // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
    function chooseLocale(names) {
        var i = 0, j, next, locale, split;

        while (i < names.length) {
            split = normalizeLocale(names[i]).split('-');
            j = split.length;
            next = normalizeLocale(names[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                locale = loadLocale(split.slice(0, j).join('-'));
                if (locale) {
                    return locale;
                }
                if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return globalLocale;
    }

    function loadLocale(name) {
        var oldLocale = null;
        // TODO: Find a better way to register and load all the locales in Node
        if (!locales[name] && (typeof module !== 'undefined') &&
                module && module.exports) {
            try {
                oldLocale = globalLocale._abbr;
                var aliasedRequire = require;
                aliasedRequire('./locale/' + name);
                getSetGlobalLocale(oldLocale);
            } catch (e) {}
        }
        return locales[name];
    }

    // This function will load locale and then set the global locale.  If
    // no arguments are passed in, it will simply return the current global
    // locale key.
    function getSetGlobalLocale (key, values) {
        var data;
        if (key) {
            if (isUndefined(values)) {
                data = getLocale(key);
            }
            else {
                data = defineLocale(key, values);
            }

            if (data) {
                // moment.duration._locale = moment._locale = data;
                globalLocale = data;
            }
            else {
                if ((typeof console !==  'undefined') && console.warn) {
                    //warn user if arguments are passed but the locale could not be set
                    console.warn('Locale ' + key +  ' not found. Did you forget to load it?');
                }
            }
        }

        return globalLocale._abbr;
    }

    function defineLocale (name, config) {
        if (config !== null) {
            var locale, parentConfig = baseConfig;
            config.abbr = name;
            if (locales[name] != null) {
                deprecateSimple('defineLocaleOverride',
                        'use moment.updateLocale(localeName, config) to change ' +
                        'an existing locale. moment.defineLocale(localeName, ' +
                        'config) should only be used for creating a new locale ' +
                        'See http://momentjs.com/guides/#/warnings/define-locale/ for more info.');
                parentConfig = locales[name]._config;
            } else if (config.parentLocale != null) {
                if (locales[config.parentLocale] != null) {
                    parentConfig = locales[config.parentLocale]._config;
                } else {
                    locale = loadLocale(config.parentLocale);
                    if (locale != null) {
                        parentConfig = locale._config;
                    } else {
                        if (!localeFamilies[config.parentLocale]) {
                            localeFamilies[config.parentLocale] = [];
                        }
                        localeFamilies[config.parentLocale].push({
                            name: name,
                            config: config
                        });
                        return null;
                    }
                }
            }
            locales[name] = new Locale(mergeConfigs(parentConfig, config));

            if (localeFamilies[name]) {
                localeFamilies[name].forEach(function (x) {
                    defineLocale(x.name, x.config);
                });
            }

            // backwards compat for now: also set the locale
            // make sure we set the locale AFTER all child locales have been
            // created, so we won't end up with the child locale set.
            getSetGlobalLocale(name);


            return locales[name];
        } else {
            // useful for testing
            delete locales[name];
            return null;
        }
    }

    function updateLocale(name, config) {
        if (config != null) {
            var locale, tmpLocale, parentConfig = baseConfig;
            // MERGE
            tmpLocale = loadLocale(name);
            if (tmpLocale != null) {
                parentConfig = tmpLocale._config;
            }
            config = mergeConfigs(parentConfig, config);
            locale = new Locale(config);
            locale.parentLocale = locales[name];
            locales[name] = locale;

            // backwards compat for now: also set the locale
            getSetGlobalLocale(name);
        } else {
            // pass null for config to unupdate, useful for tests
            if (locales[name] != null) {
                if (locales[name].parentLocale != null) {
                    locales[name] = locales[name].parentLocale;
                } else if (locales[name] != null) {
                    delete locales[name];
                }
            }
        }
        return locales[name];
    }

    // returns locale data
    function getLocale (key) {
        var locale;

        if (key && key._locale && key._locale._abbr) {
            key = key._locale._abbr;
        }

        if (!key) {
            return globalLocale;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            locale = loadLocale(key);
            if (locale) {
                return locale;
            }
            key = [key];
        }

        return chooseLocale(key);
    }

    function listLocales() {
        return keys(locales);
    }

    function checkOverflow (m) {
        var overflow;
        var a = m._a;

        if (a && getParsingFlags(m).overflow === -2) {
            overflow =
                a[MONTH]       < 0 || a[MONTH]       > 11  ? MONTH :
                a[DATE]        < 1 || a[DATE]        > daysInMonth(a[YEAR], a[MONTH]) ? DATE :
                a[HOUR]        < 0 || a[HOUR]        > 24 || (a[HOUR] === 24 && (a[MINUTE] !== 0 || a[SECOND] !== 0 || a[MILLISECOND] !== 0)) ? HOUR :
                a[MINUTE]      < 0 || a[MINUTE]      > 59  ? MINUTE :
                a[SECOND]      < 0 || a[SECOND]      > 59  ? SECOND :
                a[MILLISECOND] < 0 || a[MILLISECOND] > 999 ? MILLISECOND :
                -1;

            if (getParsingFlags(m)._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                overflow = DATE;
            }
            if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
                overflow = WEEK;
            }
            if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
                overflow = WEEKDAY;
            }

            getParsingFlags(m).overflow = overflow;
        }

        return m;
    }

    // Pick the first defined of two or three arguments.
    function defaults(a, b, c) {
        if (a != null) {
            return a;
        }
        if (b != null) {
            return b;
        }
        return c;
    }

    function currentDateArray(config) {
        // hooks is actually the exported moment object
        var nowValue = new Date(hooks.now());
        if (config._useUTC) {
            return [nowValue.getUTCFullYear(), nowValue.getUTCMonth(), nowValue.getUTCDate()];
        }
        return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function configFromArray (config) {
        var i, date, input = [], currentDate, expectedWeekday, yearToUse;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            dayOfYearFromWeekInfo(config);
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear != null) {
            yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

            if (config._dayOfYear > daysInYear(yearToUse) || config._dayOfYear === 0) {
                getParsingFlags(config)._overflowDayOfYear = true;
            }

            date = createUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // Check for 24:00:00.000
        if (config._a[HOUR] === 24 &&
                config._a[MINUTE] === 0 &&
                config._a[SECOND] === 0 &&
                config._a[MILLISECOND] === 0) {
            config._nextDay = true;
            config._a[HOUR] = 0;
        }

        config._d = (config._useUTC ? createUTCDate : createDate).apply(null, input);
        expectedWeekday = config._useUTC ? config._d.getUTCDay() : config._d.getDay();

        // Apply timezone offset from input. The actual utcOffset can be changed
        // with parseZone.
        if (config._tzm != null) {
            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
        }

        if (config._nextDay) {
            config._a[HOUR] = 24;
        }

        // check for mismatching day of week
        if (config._w && typeof config._w.d !== 'undefined' && config._w.d !== expectedWeekday) {
            getParsingFlags(config).weekdayMismatch = true;
        }
    }

    function dayOfYearFromWeekInfo(config) {
        var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow;

        w = config._w;
        if (w.GG != null || w.W != null || w.E != null) {
            dow = 1;
            doy = 4;

            // TODO: We need to take the current isoWeekYear, but that depends on
            // how we interpret now (local, utc, fixed offset). So create
            // a now version of current config (take local/utc/offset flags, and
            // create now).
            weekYear = defaults(w.GG, config._a[YEAR], weekOfYear(createLocal(), 1, 4).year);
            week = defaults(w.W, 1);
            weekday = defaults(w.E, 1);
            if (weekday < 1 || weekday > 7) {
                weekdayOverflow = true;
            }
        } else {
            dow = config._locale._week.dow;
            doy = config._locale._week.doy;

            var curWeek = weekOfYear(createLocal(), dow, doy);

            weekYear = defaults(w.gg, config._a[YEAR], curWeek.year);

            // Default to current week.
            week = defaults(w.w, curWeek.week);

            if (w.d != null) {
                // weekday -- low day numbers are considered next week
                weekday = w.d;
                if (weekday < 0 || weekday > 6) {
                    weekdayOverflow = true;
                }
            } else if (w.e != null) {
                // local weekday -- counting starts from beginning of week
                weekday = w.e + dow;
                if (w.e < 0 || w.e > 6) {
                    weekdayOverflow = true;
                }
            } else {
                // default to beginning of week
                weekday = dow;
            }
        }
        if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
            getParsingFlags(config)._overflowWeeks = true;
        } else if (weekdayOverflow != null) {
            getParsingFlags(config)._overflowWeekday = true;
        } else {
            temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
            config._a[YEAR] = temp.year;
            config._dayOfYear = temp.dayOfYear;
        }
    }

    // iso 8601 regex
    // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
    var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;
    var basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;

    var tzRegex = /Z|[+-]\d\d(?::?\d\d)?/;

    var isoDates = [
        ['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/],
        ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/],
        ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/],
        ['GGGG-[W]WW', /\d{4}-W\d\d/, false],
        ['YYYY-DDD', /\d{4}-\d{3}/],
        ['YYYY-MM', /\d{4}-\d\d/, false],
        ['YYYYYYMMDD', /[+-]\d{10}/],
        ['YYYYMMDD', /\d{8}/],
        // YYYYMM is NOT allowed by the standard
        ['GGGG[W]WWE', /\d{4}W\d{3}/],
        ['GGGG[W]WW', /\d{4}W\d{2}/, false],
        ['YYYYDDD', /\d{7}/]
    ];

    // iso time formats and regexes
    var isoTimes = [
        ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/],
        ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/],
        ['HH:mm:ss', /\d\d:\d\d:\d\d/],
        ['HH:mm', /\d\d:\d\d/],
        ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/],
        ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/],
        ['HHmmss', /\d\d\d\d\d\d/],
        ['HHmm', /\d\d\d\d/],
        ['HH', /\d\d/]
    ];

    var aspNetJsonRegex = /^\/?Date\((\-?\d+)/i;

    // date from iso format
    function configFromISO(config) {
        var i, l,
            string = config._i,
            match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
            allowTime, dateFormat, timeFormat, tzFormat;

        if (match) {
            getParsingFlags(config).iso = true;

            for (i = 0, l = isoDates.length; i < l; i++) {
                if (isoDates[i][1].exec(match[1])) {
                    dateFormat = isoDates[i][0];
                    allowTime = isoDates[i][2] !== false;
                    break;
                }
            }
            if (dateFormat == null) {
                config._isValid = false;
                return;
            }
            if (match[3]) {
                for (i = 0, l = isoTimes.length; i < l; i++) {
                    if (isoTimes[i][1].exec(match[3])) {
                        // match[2] should be 'T' or space
                        timeFormat = (match[2] || ' ') + isoTimes[i][0];
                        break;
                    }
                }
                if (timeFormat == null) {
                    config._isValid = false;
                    return;
                }
            }
            if (!allowTime && timeFormat != null) {
                config._isValid = false;
                return;
            }
            if (match[4]) {
                if (tzRegex.exec(match[4])) {
                    tzFormat = 'Z';
                } else {
                    config._isValid = false;
                    return;
                }
            }
            config._f = dateFormat + (timeFormat || '') + (tzFormat || '');
            configFromStringAndFormat(config);
        } else {
            config._isValid = false;
        }
    }

    // RFC 2822 regex: For details see https://tools.ietf.org/html/rfc2822#section-3.3
    var rfc2822 = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|([+-]\d{4}))$/;

    function extractFromRFC2822Strings(yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr) {
        var result = [
            untruncateYear(yearStr),
            defaultLocaleMonthsShort.indexOf(monthStr),
            parseInt(dayStr, 10),
            parseInt(hourStr, 10),
            parseInt(minuteStr, 10)
        ];

        if (secondStr) {
            result.push(parseInt(secondStr, 10));
        }

        return result;
    }

    function untruncateYear(yearStr) {
        var year = parseInt(yearStr, 10);
        if (year <= 49) {
            return 2000 + year;
        } else if (year <= 999) {
            return 1900 + year;
        }
        return year;
    }

    function preprocessRFC2822(s) {
        // Remove comments and folding whitespace and replace multiple-spaces with a single space
        return s.replace(/\([^)]*\)|[\n\t]/g, ' ').replace(/(\s\s+)/g, ' ').replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    }

    function checkWeekday(weekdayStr, parsedInput, config) {
        if (weekdayStr) {
            // TODO: Replace the vanilla JS Date object with an indepentent day-of-week check.
            var weekdayProvided = defaultLocaleWeekdaysShort.indexOf(weekdayStr),
                weekdayActual = new Date(parsedInput[0], parsedInput[1], parsedInput[2]).getDay();
            if (weekdayProvided !== weekdayActual) {
                getParsingFlags(config).weekdayMismatch = true;
                config._isValid = false;
                return false;
            }
        }
        return true;
    }

    var obsOffsets = {
        UT: 0,
        GMT: 0,
        EDT: -4 * 60,
        EST: -5 * 60,
        CDT: -5 * 60,
        CST: -6 * 60,
        MDT: -6 * 60,
        MST: -7 * 60,
        PDT: -7 * 60,
        PST: -8 * 60
    };

    function calculateOffset(obsOffset, militaryOffset, numOffset) {
        if (obsOffset) {
            return obsOffsets[obsOffset];
        } else if (militaryOffset) {
            // the only allowed military tz is Z
            return 0;
        } else {
            var hm = parseInt(numOffset, 10);
            var m = hm % 100, h = (hm - m) / 100;
            return h * 60 + m;
        }
    }

    // date and time from ref 2822 format
    function configFromRFC2822(config) {
        var match = rfc2822.exec(preprocessRFC2822(config._i));
        if (match) {
            var parsedArray = extractFromRFC2822Strings(match[4], match[3], match[2], match[5], match[6], match[7]);
            if (!checkWeekday(match[1], parsedArray, config)) {
                return;
            }

            config._a = parsedArray;
            config._tzm = calculateOffset(match[8], match[9], match[10]);

            config._d = createUTCDate.apply(null, config._a);
            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);

            getParsingFlags(config).rfc2822 = true;
        } else {
            config._isValid = false;
        }
    }

    // date from iso format or fallback
    function configFromString(config) {
        var matched = aspNetJsonRegex.exec(config._i);

        if (matched !== null) {
            config._d = new Date(+matched[1]);
            return;
        }

        configFromISO(config);
        if (config._isValid === false) {
            delete config._isValid;
        } else {
            return;
        }

        configFromRFC2822(config);
        if (config._isValid === false) {
            delete config._isValid;
        } else {
            return;
        }

        // Final attempt, use Input Fallback
        hooks.createFromInputFallback(config);
    }

    hooks.createFromInputFallback = deprecate(
        'value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), ' +
        'which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are ' +
        'discouraged and will be removed in an upcoming major release. Please refer to ' +
        'http://momentjs.com/guides/#/warnings/js-date/ for more info.',
        function (config) {
            config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
        }
    );

    // constant that refers to the ISO standard
    hooks.ISO_8601 = function () {};

    // constant that refers to the RFC 2822 form
    hooks.RFC_2822 = function () {};

    // date from string and format string
    function configFromStringAndFormat(config) {
        // TODO: Move this to another part of the creation flow to prevent circular deps
        if (config._f === hooks.ISO_8601) {
            configFromISO(config);
            return;
        }
        if (config._f === hooks.RFC_2822) {
            configFromRFC2822(config);
            return;
        }
        config._a = [];
        getParsingFlags(config).empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var string = '' + config._i,
            i, parsedInput, tokens, token, skipped,
            stringLength = string.length,
            totalParsedInputLength = 0;

        tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
            // console.log('token', token, 'parsedInput', parsedInput,
            //         'regex', getParseRegexForToken(token, config));
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    getParsingFlags(config).unusedInput.push(skipped);
                }
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    getParsingFlags(config).empty = false;
                }
                else {
                    getParsingFlags(config).unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            }
            else if (config._strict && !parsedInput) {
                getParsingFlags(config).unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        getParsingFlags(config).charsLeftOver = stringLength - totalParsedInputLength;
        if (string.length > 0) {
            getParsingFlags(config).unusedInput.push(string);
        }

        // clear _12h flag if hour is <= 12
        if (config._a[HOUR] <= 12 &&
            getParsingFlags(config).bigHour === true &&
            config._a[HOUR] > 0) {
            getParsingFlags(config).bigHour = undefined;
        }

        getParsingFlags(config).parsedDateParts = config._a.slice(0);
        getParsingFlags(config).meridiem = config._meridiem;
        // handle meridiem
        config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR], config._meridiem);

        configFromArray(config);
        checkOverflow(config);
    }


    function meridiemFixWrap (locale, hour, meridiem) {
        var isPm;

        if (meridiem == null) {
            // nothing to do
            return hour;
        }
        if (locale.meridiemHour != null) {
            return locale.meridiemHour(hour, meridiem);
        } else if (locale.isPM != null) {
            // Fallback
            isPm = locale.isPM(meridiem);
            if (isPm && hour < 12) {
                hour += 12;
            }
            if (!isPm && hour === 12) {
                hour = 0;
            }
            return hour;
        } else {
            // this is not supposed to happen
            return hour;
        }
    }

    // date from string and array of format strings
    function configFromStringAndArray(config) {
        var tempConfig,
            bestMoment,

            scoreToBeat,
            i,
            currentScore;

        if (config._f.length === 0) {
            getParsingFlags(config).invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            tempConfig = copyConfig({}, config);
            if (config._useUTC != null) {
                tempConfig._useUTC = config._useUTC;
            }
            tempConfig._f = config._f[i];
            configFromStringAndFormat(tempConfig);

            if (!isValid(tempConfig)) {
                continue;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += getParsingFlags(tempConfig).charsLeftOver;

            //or tokens
            currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;

            getParsingFlags(tempConfig).score = currentScore;

            if (scoreToBeat == null || currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempConfig;
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    function configFromObject(config) {
        if (config._d) {
            return;
        }

        var i = normalizeObjectUnits(config._i);
        config._a = map([i.year, i.month, i.day || i.date, i.hour, i.minute, i.second, i.millisecond], function (obj) {
            return obj && parseInt(obj, 10);
        });

        configFromArray(config);
    }

    function createFromConfig (config) {
        var res = new Moment(checkOverflow(prepareConfig(config)));
        if (res._nextDay) {
            // Adding is smart enough around DST
            res.add(1, 'd');
            res._nextDay = undefined;
        }

        return res;
    }

    function prepareConfig (config) {
        var input = config._i,
            format = config._f;

        config._locale = config._locale || getLocale(config._l);

        if (input === null || (format === undefined && input === '')) {
            return createInvalid({nullInput: true});
        }

        if (typeof input === 'string') {
            config._i = input = config._locale.preparse(input);
        }

        if (isMoment(input)) {
            return new Moment(checkOverflow(input));
        } else if (isDate(input)) {
            config._d = input;
        } else if (isArray(format)) {
            configFromStringAndArray(config);
        } else if (format) {
            configFromStringAndFormat(config);
        }  else {
            configFromInput(config);
        }

        if (!isValid(config)) {
            config._d = null;
        }

        return config;
    }

    function configFromInput(config) {
        var input = config._i;
        if (isUndefined(input)) {
            config._d = new Date(hooks.now());
        } else if (isDate(input)) {
            config._d = new Date(input.valueOf());
        } else if (typeof input === 'string') {
            configFromString(config);
        } else if (isArray(input)) {
            config._a = map(input.slice(0), function (obj) {
                return parseInt(obj, 10);
            });
            configFromArray(config);
        } else if (isObject(input)) {
            configFromObject(config);
        } else if (isNumber(input)) {
            // from milliseconds
            config._d = new Date(input);
        } else {
            hooks.createFromInputFallback(config);
        }
    }

    function createLocalOrUTC (input, format, locale, strict, isUTC) {
        var c = {};

        if (locale === true || locale === false) {
            strict = locale;
            locale = undefined;
        }

        if ((isObject(input) && isObjectEmpty(input)) ||
                (isArray(input) && input.length === 0)) {
            input = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c._isAMomentObject = true;
        c._useUTC = c._isUTC = isUTC;
        c._l = locale;
        c._i = input;
        c._f = format;
        c._strict = strict;

        return createFromConfig(c);
    }

    function createLocal (input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, false);
    }

    var prototypeMin = deprecate(
        'moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/',
        function () {
            var other = createLocal.apply(null, arguments);
            if (this.isValid() && other.isValid()) {
                return other < this ? this : other;
            } else {
                return createInvalid();
            }
        }
    );

    var prototypeMax = deprecate(
        'moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/',
        function () {
            var other = createLocal.apply(null, arguments);
            if (this.isValid() && other.isValid()) {
                return other > this ? this : other;
            } else {
                return createInvalid();
            }
        }
    );

    // Pick a moment m from moments so that m[fn](other) is true for all
    // other. This relies on the function fn to be transitive.
    //
    // moments should either be an array of moment objects or an array, whose
    // first element is an array of moment objects.
    function pickBy(fn, moments) {
        var res, i;
        if (moments.length === 1 && isArray(moments[0])) {
            moments = moments[0];
        }
        if (!moments.length) {
            return createLocal();
        }
        res = moments[0];
        for (i = 1; i < moments.length; ++i) {
            if (!moments[i].isValid() || moments[i][fn](res)) {
                res = moments[i];
            }
        }
        return res;
    }

    // TODO: Use [].sort instead?
    function min () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isBefore', args);
    }

    function max () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isAfter', args);
    }

    var now = function () {
        return Date.now ? Date.now() : +(new Date());
    };

    var ordering = ['year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', 'millisecond'];

    function isDurationValid(m) {
        for (var key in m) {
            if (!(indexOf.call(ordering, key) !== -1 && (m[key] == null || !isNaN(m[key])))) {
                return false;
            }
        }

        var unitHasDecimal = false;
        for (var i = 0; i < ordering.length; ++i) {
            if (m[ordering[i]]) {
                if (unitHasDecimal) {
                    return false; // only allow non-integers for smallest unit
                }
                if (parseFloat(m[ordering[i]]) !== toInt(m[ordering[i]])) {
                    unitHasDecimal = true;
                }
            }
        }

        return true;
    }

    function isValid$1() {
        return this._isValid;
    }

    function createInvalid$1() {
        return createDuration(NaN);
    }

    function Duration (duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            quarters = normalizedInput.quarter || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || normalizedInput.isoWeek || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        this._isValid = isDurationValid(normalizedInput);

        // representation for dateAddRemove
        this._milliseconds = +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 1000 * 60 * 60; //using 1000 * 60 * 60 instead of 36e5 to avoid floating point rounding errors https://github.com/moment/moment/issues/2978
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days +
            weeks * 7;
        // It is impossible to translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months +
            quarters * 3 +
            years * 12;

        this._data = {};

        this._locale = getLocale();

        this._bubble();
    }

    function isDuration (obj) {
        return obj instanceof Duration;
    }

    function absRound (number) {
        if (number < 0) {
            return Math.round(-1 * number) * -1;
        } else {
            return Math.round(number);
        }
    }

    // FORMATTING

    function offset (token, separator) {
        addFormatToken(token, 0, 0, function () {
            var offset = this.utcOffset();
            var sign = '+';
            if (offset < 0) {
                offset = -offset;
                sign = '-';
            }
            return sign + zeroFill(~~(offset / 60), 2) + separator + zeroFill(~~(offset) % 60, 2);
        });
    }

    offset('Z', ':');
    offset('ZZ', '');

    // PARSING

    addRegexToken('Z',  matchShortOffset);
    addRegexToken('ZZ', matchShortOffset);
    addParseToken(['Z', 'ZZ'], function (input, array, config) {
        config._useUTC = true;
        config._tzm = offsetFromString(matchShortOffset, input);
    });

    // HELPERS

    // timezone chunker
    // '+10:00' > ['10',  '00']
    // '-1530'  > ['-15', '30']
    var chunkOffset = /([\+\-]|\d\d)/gi;

    function offsetFromString(matcher, string) {
        var matches = (string || '').match(matcher);

        if (matches === null) {
            return null;
        }

        var chunk   = matches[matches.length - 1] || [];
        var parts   = (chunk + '').match(chunkOffset) || ['-', 0, 0];
        var minutes = +(parts[1] * 60) + toInt(parts[2]);

        return minutes === 0 ?
          0 :
          parts[0] === '+' ? minutes : -minutes;
    }

    // Return a moment from input, that is local/utc/zone equivalent to model.
    function cloneWithOffset(input, model) {
        var res, diff;
        if (model._isUTC) {
            res = model.clone();
            diff = (isMoment(input) || isDate(input) ? input.valueOf() : createLocal(input).valueOf()) - res.valueOf();
            // Use low-level api, because this fn is low-level api.
            res._d.setTime(res._d.valueOf() + diff);
            hooks.updateOffset(res, false);
            return res;
        } else {
            return createLocal(input).local();
        }
    }

    function getDateOffset (m) {
        // On Firefox.24 Date#getTimezoneOffset returns a floating point.
        // https://github.com/moment/moment/pull/1871
        return -Math.round(m._d.getTimezoneOffset() / 15) * 15;
    }

    // HOOKS

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    hooks.updateOffset = function () {};

    // MOMENTS

    // keepLocalTime = true means only change the timezone, without
    // affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
    // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
    // +0200, so we adjust the time as needed, to be valid.
    //
    // Keeping the time actually adds/subtracts (one hour)
    // from the actual represented time. That is why we call updateOffset
    // a second time. In case it wants us to change the offset again
    // _changeInProgress == true case, then we have to adjust, because
    // there is no such time in the given timezone.
    function getSetOffset (input, keepLocalTime, keepMinutes) {
        var offset = this._offset || 0,
            localAdjust;
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        if (input != null) {
            if (typeof input === 'string') {
                input = offsetFromString(matchShortOffset, input);
                if (input === null) {
                    return this;
                }
            } else if (Math.abs(input) < 16 && !keepMinutes) {
                input = input * 60;
            }
            if (!this._isUTC && keepLocalTime) {
                localAdjust = getDateOffset(this);
            }
            this._offset = input;
            this._isUTC = true;
            if (localAdjust != null) {
                this.add(localAdjust, 'm');
            }
            if (offset !== input) {
                if (!keepLocalTime || this._changeInProgress) {
                    addSubtract(this, createDuration(input - offset, 'm'), 1, false);
                } else if (!this._changeInProgress) {
                    this._changeInProgress = true;
                    hooks.updateOffset(this, true);
                    this._changeInProgress = null;
                }
            }
            return this;
        } else {
            return this._isUTC ? offset : getDateOffset(this);
        }
    }

    function getSetZone (input, keepLocalTime) {
        if (input != null) {
            if (typeof input !== 'string') {
                input = -input;
            }

            this.utcOffset(input, keepLocalTime);

            return this;
        } else {
            return -this.utcOffset();
        }
    }

    function setOffsetToUTC (keepLocalTime) {
        return this.utcOffset(0, keepLocalTime);
    }

    function setOffsetToLocal (keepLocalTime) {
        if (this._isUTC) {
            this.utcOffset(0, keepLocalTime);
            this._isUTC = false;

            if (keepLocalTime) {
                this.subtract(getDateOffset(this), 'm');
            }
        }
        return this;
    }

    function setOffsetToParsedOffset () {
        if (this._tzm != null) {
            this.utcOffset(this._tzm, false, true);
        } else if (typeof this._i === 'string') {
            var tZone = offsetFromString(matchOffset, this._i);
            if (tZone != null) {
                this.utcOffset(tZone);
            }
            else {
                this.utcOffset(0, true);
            }
        }
        return this;
    }

    function hasAlignedHourOffset (input) {
        if (!this.isValid()) {
            return false;
        }
        input = input ? createLocal(input).utcOffset() : 0;

        return (this.utcOffset() - input) % 60 === 0;
    }

    function isDaylightSavingTime () {
        return (
            this.utcOffset() > this.clone().month(0).utcOffset() ||
            this.utcOffset() > this.clone().month(5).utcOffset()
        );
    }

    function isDaylightSavingTimeShifted () {
        if (!isUndefined(this._isDSTShifted)) {
            return this._isDSTShifted;
        }

        var c = {};

        copyConfig(c, this);
        c = prepareConfig(c);

        if (c._a) {
            var other = c._isUTC ? createUTC(c._a) : createLocal(c._a);
            this._isDSTShifted = this.isValid() &&
                compareArrays(c._a, other.toArray()) > 0;
        } else {
            this._isDSTShifted = false;
        }

        return this._isDSTShifted;
    }

    function isLocal () {
        return this.isValid() ? !this._isUTC : false;
    }

    function isUtcOffset () {
        return this.isValid() ? this._isUTC : false;
    }

    function isUtc () {
        return this.isValid() ? this._isUTC && this._offset === 0 : false;
    }

    // ASP.NET json date format regex
    var aspNetRegex = /^(\-|\+)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)(\.\d*)?)?$/;

    // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
    // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
    // and further modified to allow for strings containing both week and day
    var isoRegex = /^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/;

    function createDuration (input, key) {
        var duration = input,
            // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            diffRes;

        if (isDuration(input)) {
            duration = {
                ms : input._milliseconds,
                d  : input._days,
                M  : input._months
            };
        } else if (isNumber(input)) {
            duration = {};
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        } else if (!!(match = aspNetRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y  : 0,
                d  : toInt(match[DATE])                         * sign,
                h  : toInt(match[HOUR])                         * sign,
                m  : toInt(match[MINUTE])                       * sign,
                s  : toInt(match[SECOND])                       * sign,
                ms : toInt(absRound(match[MILLISECOND] * 1000)) * sign // the millisecond decimal point is included in the match
            };
        } else if (!!(match = isoRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y : parseIso(match[2], sign),
                M : parseIso(match[3], sign),
                w : parseIso(match[4], sign),
                d : parseIso(match[5], sign),
                h : parseIso(match[6], sign),
                m : parseIso(match[7], sign),
                s : parseIso(match[8], sign)
            };
        } else if (duration == null) {// checks for null or undefined
            duration = {};
        } else if (typeof duration === 'object' && ('from' in duration || 'to' in duration)) {
            diffRes = momentsDifference(createLocal(duration.from), createLocal(duration.to));

            duration = {};
            duration.ms = diffRes.milliseconds;
            duration.M = diffRes.months;
        }

        ret = new Duration(duration);

        if (isDuration(input) && hasOwnProp(input, '_locale')) {
            ret._locale = input._locale;
        }

        return ret;
    }

    createDuration.fn = Duration.prototype;
    createDuration.invalid = createInvalid$1;

    function parseIso (inp, sign) {
        // We'd normally use ~~inp for this, but unfortunately it also
        // converts floats to ints.
        // inp may be undefined, so careful calling replace on it.
        var res = inp && parseFloat(inp.replace(',', '.'));
        // apply sign while we're at it
        return (isNaN(res) ? 0 : res) * sign;
    }

    function positiveMomentsDifference(base, other) {
        var res = {};

        res.months = other.month() - base.month() +
            (other.year() - base.year()) * 12;
        if (base.clone().add(res.months, 'M').isAfter(other)) {
            --res.months;
        }

        res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

        return res;
    }

    function momentsDifference(base, other) {
        var res;
        if (!(base.isValid() && other.isValid())) {
            return {milliseconds: 0, months: 0};
        }

        other = cloneWithOffset(other, base);
        if (base.isBefore(other)) {
            res = positiveMomentsDifference(base, other);
        } else {
            res = positiveMomentsDifference(other, base);
            res.milliseconds = -res.milliseconds;
            res.months = -res.months;
        }

        return res;
    }

    // TODO: remove 'name' arg after deprecation is removed
    function createAdder(direction, name) {
        return function (val, period) {
            var dur, tmp;
            //invert the arguments, but complain about it
            if (period !== null && !isNaN(+period)) {
                deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period). ' +
                'See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.');
                tmp = val; val = period; period = tmp;
            }

            val = typeof val === 'string' ? +val : val;
            dur = createDuration(val, period);
            addSubtract(this, dur, direction);
            return this;
        };
    }

    function addSubtract (mom, duration, isAdding, updateOffset) {
        var milliseconds = duration._milliseconds,
            days = absRound(duration._days),
            months = absRound(duration._months);

        if (!mom.isValid()) {
            // No op
            return;
        }

        updateOffset = updateOffset == null ? true : updateOffset;

        if (months) {
            setMonth(mom, get(mom, 'Month') + months * isAdding);
        }
        if (days) {
            set$1(mom, 'Date', get(mom, 'Date') + days * isAdding);
        }
        if (milliseconds) {
            mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding);
        }
        if (updateOffset) {
            hooks.updateOffset(mom, days || months);
        }
    }

    var add      = createAdder(1, 'add');
    var subtract = createAdder(-1, 'subtract');

    function getCalendarFormat(myMoment, now) {
        var diff = myMoment.diff(now, 'days', true);
        return diff < -6 ? 'sameElse' :
                diff < -1 ? 'lastWeek' :
                diff < 0 ? 'lastDay' :
                diff < 1 ? 'sameDay' :
                diff < 2 ? 'nextDay' :
                diff < 7 ? 'nextWeek' : 'sameElse';
    }

    function calendar$1 (time, formats) {
        // We want to compare the start of today, vs this.
        // Getting start-of-today depends on whether we're local/utc/offset or not.
        var now = time || createLocal(),
            sod = cloneWithOffset(now, this).startOf('day'),
            format = hooks.calendarFormat(this, sod) || 'sameElse';

        var output = formats && (isFunction(formats[format]) ? formats[format].call(this, now) : formats[format]);

        return this.format(output || this.localeData().calendar(format, this, createLocal(now)));
    }

    function clone () {
        return new Moment(this);
    }

    function isAfter (input, units) {
        var localInput = isMoment(input) ? input : createLocal(input);
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(units) || 'millisecond';
        if (units === 'millisecond') {
            return this.valueOf() > localInput.valueOf();
        } else {
            return localInput.valueOf() < this.clone().startOf(units).valueOf();
        }
    }

    function isBefore (input, units) {
        var localInput = isMoment(input) ? input : createLocal(input);
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(units) || 'millisecond';
        if (units === 'millisecond') {
            return this.valueOf() < localInput.valueOf();
        } else {
            return this.clone().endOf(units).valueOf() < localInput.valueOf();
        }
    }

    function isBetween (from, to, units, inclusivity) {
        var localFrom = isMoment(from) ? from : createLocal(from),
            localTo = isMoment(to) ? to : createLocal(to);
        if (!(this.isValid() && localFrom.isValid() && localTo.isValid())) {
            return false;
        }
        inclusivity = inclusivity || '()';
        return (inclusivity[0] === '(' ? this.isAfter(localFrom, units) : !this.isBefore(localFrom, units)) &&
            (inclusivity[1] === ')' ? this.isBefore(localTo, units) : !this.isAfter(localTo, units));
    }

    function isSame (input, units) {
        var localInput = isMoment(input) ? input : createLocal(input),
            inputMs;
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(units) || 'millisecond';
        if (units === 'millisecond') {
            return this.valueOf() === localInput.valueOf();
        } else {
            inputMs = localInput.valueOf();
            return this.clone().startOf(units).valueOf() <= inputMs && inputMs <= this.clone().endOf(units).valueOf();
        }
    }

    function isSameOrAfter (input, units) {
        return this.isSame(input, units) || this.isAfter(input, units);
    }

    function isSameOrBefore (input, units) {
        return this.isSame(input, units) || this.isBefore(input, units);
    }

    function diff (input, units, asFloat) {
        var that,
            zoneDelta,
            output;

        if (!this.isValid()) {
            return NaN;
        }

        that = cloneWithOffset(input, this);

        if (!that.isValid()) {
            return NaN;
        }

        zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;

        units = normalizeUnits(units);

        switch (units) {
            case 'year': output = monthDiff(this, that) / 12; break;
            case 'month': output = monthDiff(this, that); break;
            case 'quarter': output = monthDiff(this, that) / 3; break;
            case 'second': output = (this - that) / 1e3; break; // 1000
            case 'minute': output = (this - that) / 6e4; break; // 1000 * 60
            case 'hour': output = (this - that) / 36e5; break; // 1000 * 60 * 60
            case 'day': output = (this - that - zoneDelta) / 864e5; break; // 1000 * 60 * 60 * 24, negate dst
            case 'week': output = (this - that - zoneDelta) / 6048e5; break; // 1000 * 60 * 60 * 24 * 7, negate dst
            default: output = this - that;
        }

        return asFloat ? output : absFloor(output);
    }

    function monthDiff (a, b) {
        // difference in months
        var wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month()),
            // b is in (anchor - 1 month, anchor + 1 month)
            anchor = a.clone().add(wholeMonthDiff, 'months'),
            anchor2, adjust;

        if (b - anchor < 0) {
            anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor - anchor2);
        } else {
            anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor2 - anchor);
        }

        //check for negative zero, return zero if negative zero
        return -(wholeMonthDiff + adjust) || 0;
    }

    hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';
    hooks.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]';

    function toString () {
        return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
    }

    function toISOString(keepOffset) {
        if (!this.isValid()) {
            return null;
        }
        var utc = keepOffset !== true;
        var m = utc ? this.clone().utc() : this;
        if (m.year() < 0 || m.year() > 9999) {
            return formatMoment(m, utc ? 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]' : 'YYYYYY-MM-DD[T]HH:mm:ss.SSSZ');
        }
        if (isFunction(Date.prototype.toISOString)) {
            // native implementation is ~50x faster, use it when we can
            if (utc) {
                return this.toDate().toISOString();
            } else {
                return new Date(this.valueOf() + this.utcOffset() * 60 * 1000).toISOString().replace('Z', formatMoment(m, 'Z'));
            }
        }
        return formatMoment(m, utc ? 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]' : 'YYYY-MM-DD[T]HH:mm:ss.SSSZ');
    }

    /**
     * Return a human readable representation of a moment that can
     * also be evaluated to get a new moment which is the same
     *
     * @link https://nodejs.org/dist/latest/docs/api/util.html#util_custom_inspect_function_on_objects
     */
    function inspect () {
        if (!this.isValid()) {
            return 'moment.invalid(/* ' + this._i + ' */)';
        }
        var func = 'moment';
        var zone = '';
        if (!this.isLocal()) {
            func = this.utcOffset() === 0 ? 'moment.utc' : 'moment.parseZone';
            zone = 'Z';
        }
        var prefix = '[' + func + '("]';
        var year = (0 <= this.year() && this.year() <= 9999) ? 'YYYY' : 'YYYYYY';
        var datetime = '-MM-DD[T]HH:mm:ss.SSS';
        var suffix = zone + '[")]';

        return this.format(prefix + year + datetime + suffix);
    }

    function format (inputString) {
        if (!inputString) {
            inputString = this.isUtc() ? hooks.defaultFormatUtc : hooks.defaultFormat;
        }
        var output = formatMoment(this, inputString);
        return this.localeData().postformat(output);
    }

    function from (time, withoutSuffix) {
        if (this.isValid() &&
                ((isMoment(time) && time.isValid()) ||
                 createLocal(time).isValid())) {
            return createDuration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
        } else {
            return this.localeData().invalidDate();
        }
    }

    function fromNow (withoutSuffix) {
        return this.from(createLocal(), withoutSuffix);
    }

    function to (time, withoutSuffix) {
        if (this.isValid() &&
                ((isMoment(time) && time.isValid()) ||
                 createLocal(time).isValid())) {
            return createDuration({from: this, to: time}).locale(this.locale()).humanize(!withoutSuffix);
        } else {
            return this.localeData().invalidDate();
        }
    }

    function toNow (withoutSuffix) {
        return this.to(createLocal(), withoutSuffix);
    }

    // If passed a locale key, it will set the locale for this
    // instance.  Otherwise, it will return the locale configuration
    // variables for this instance.
    function locale (key) {
        var newLocaleData;

        if (key === undefined) {
            return this._locale._abbr;
        } else {
            newLocaleData = getLocale(key);
            if (newLocaleData != null) {
                this._locale = newLocaleData;
            }
            return this;
        }
    }

    var lang = deprecate(
        'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
        function (key) {
            if (key === undefined) {
                return this.localeData();
            } else {
                return this.locale(key);
            }
        }
    );

    function localeData () {
        return this._locale;
    }

    var MS_PER_SECOND = 1000;
    var MS_PER_MINUTE = 60 * MS_PER_SECOND;
    var MS_PER_HOUR = 60 * MS_PER_MINUTE;
    var MS_PER_400_YEARS = (365 * 400 + 97) * 24 * MS_PER_HOUR;

    // actual modulo - handles negative numbers (for dates before 1970):
    function mod$1(dividend, divisor) {
        return (dividend % divisor + divisor) % divisor;
    }

    function localStartOfDate(y, m, d) {
        // the date constructor remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0) {
            // preserve leap years using a full 400 year cycle, then reset
            return new Date(y + 400, m, d) - MS_PER_400_YEARS;
        } else {
            return new Date(y, m, d).valueOf();
        }
    }

    function utcStartOfDate(y, m, d) {
        // Date.UTC remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0) {
            // preserve leap years using a full 400 year cycle, then reset
            return Date.UTC(y + 400, m, d) - MS_PER_400_YEARS;
        } else {
            return Date.UTC(y, m, d);
        }
    }

    function startOf (units) {
        var time;
        units = normalizeUnits(units);
        if (units === undefined || units === 'millisecond' || !this.isValid()) {
            return this;
        }

        var startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate;

        switch (units) {
            case 'year':
                time = startOfDate(this.year(), 0, 1);
                break;
            case 'quarter':
                time = startOfDate(this.year(), this.month() - this.month() % 3, 1);
                break;
            case 'month':
                time = startOfDate(this.year(), this.month(), 1);
                break;
            case 'week':
                time = startOfDate(this.year(), this.month(), this.date() - this.weekday());
                break;
            case 'isoWeek':
                time = startOfDate(this.year(), this.month(), this.date() - (this.isoWeekday() - 1));
                break;
            case 'day':
            case 'date':
                time = startOfDate(this.year(), this.month(), this.date());
                break;
            case 'hour':
                time = this._d.valueOf();
                time -= mod$1(time + (this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE), MS_PER_HOUR);
                break;
            case 'minute':
                time = this._d.valueOf();
                time -= mod$1(time, MS_PER_MINUTE);
                break;
            case 'second':
                time = this._d.valueOf();
                time -= mod$1(time, MS_PER_SECOND);
                break;
        }

        this._d.setTime(time);
        hooks.updateOffset(this, true);
        return this;
    }

    function endOf (units) {
        var time;
        units = normalizeUnits(units);
        if (units === undefined || units === 'millisecond' || !this.isValid()) {
            return this;
        }

        var startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate;

        switch (units) {
            case 'year':
                time = startOfDate(this.year() + 1, 0, 1) - 1;
                break;
            case 'quarter':
                time = startOfDate(this.year(), this.month() - this.month() % 3 + 3, 1) - 1;
                break;
            case 'month':
                time = startOfDate(this.year(), this.month() + 1, 1) - 1;
                break;
            case 'week':
                time = startOfDate(this.year(), this.month(), this.date() - this.weekday() + 7) - 1;
                break;
            case 'isoWeek':
                time = startOfDate(this.year(), this.month(), this.date() - (this.isoWeekday() - 1) + 7) - 1;
                break;
            case 'day':
            case 'date':
                time = startOfDate(this.year(), this.month(), this.date() + 1) - 1;
                break;
            case 'hour':
                time = this._d.valueOf();
                time += MS_PER_HOUR - mod$1(time + (this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE), MS_PER_HOUR) - 1;
                break;
            case 'minute':
                time = this._d.valueOf();
                time += MS_PER_MINUTE - mod$1(time, MS_PER_MINUTE) - 1;
                break;
            case 'second':
                time = this._d.valueOf();
                time += MS_PER_SECOND - mod$1(time, MS_PER_SECOND) - 1;
                break;
        }

        this._d.setTime(time);
        hooks.updateOffset(this, true);
        return this;
    }

    function valueOf () {
        return this._d.valueOf() - ((this._offset || 0) * 60000);
    }

    function unix () {
        return Math.floor(this.valueOf() / 1000);
    }

    function toDate () {
        return new Date(this.valueOf());
    }

    function toArray () {
        var m = this;
        return [m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second(), m.millisecond()];
    }

    function toObject () {
        var m = this;
        return {
            years: m.year(),
            months: m.month(),
            date: m.date(),
            hours: m.hours(),
            minutes: m.minutes(),
            seconds: m.seconds(),
            milliseconds: m.milliseconds()
        };
    }

    function toJSON () {
        // new Date(NaN).toJSON() === null
        return this.isValid() ? this.toISOString() : null;
    }

    function isValid$2 () {
        return isValid(this);
    }

    function parsingFlags () {
        return extend({}, getParsingFlags(this));
    }

    function invalidAt () {
        return getParsingFlags(this).overflow;
    }

    function creationData() {
        return {
            input: this._i,
            format: this._f,
            locale: this._locale,
            isUTC: this._isUTC,
            strict: this._strict
        };
    }

    // FORMATTING

    addFormatToken(0, ['gg', 2], 0, function () {
        return this.weekYear() % 100;
    });

    addFormatToken(0, ['GG', 2], 0, function () {
        return this.isoWeekYear() % 100;
    });

    function addWeekYearFormatToken (token, getter) {
        addFormatToken(0, [token, token.length], 0, getter);
    }

    addWeekYearFormatToken('gggg',     'weekYear');
    addWeekYearFormatToken('ggggg',    'weekYear');
    addWeekYearFormatToken('GGGG',  'isoWeekYear');
    addWeekYearFormatToken('GGGGG', 'isoWeekYear');

    // ALIASES

    addUnitAlias('weekYear', 'gg');
    addUnitAlias('isoWeekYear', 'GG');

    // PRIORITY

    addUnitPriority('weekYear', 1);
    addUnitPriority('isoWeekYear', 1);


    // PARSING

    addRegexToken('G',      matchSigned);
    addRegexToken('g',      matchSigned);
    addRegexToken('GG',     match1to2, match2);
    addRegexToken('gg',     match1to2, match2);
    addRegexToken('GGGG',   match1to4, match4);
    addRegexToken('gggg',   match1to4, match4);
    addRegexToken('GGGGG',  match1to6, match6);
    addRegexToken('ggggg',  match1to6, match6);

    addWeekParseToken(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function (input, week, config, token) {
        week[token.substr(0, 2)] = toInt(input);
    });

    addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
        week[token] = hooks.parseTwoDigitYear(input);
    });

    // MOMENTS

    function getSetWeekYear (input) {
        return getSetWeekYearHelper.call(this,
                input,
                this.week(),
                this.weekday(),
                this.localeData()._week.dow,
                this.localeData()._week.doy);
    }

    function getSetISOWeekYear (input) {
        return getSetWeekYearHelper.call(this,
                input, this.isoWeek(), this.isoWeekday(), 1, 4);
    }

    function getISOWeeksInYear () {
        return weeksInYear(this.year(), 1, 4);
    }

    function getWeeksInYear () {
        var weekInfo = this.localeData()._week;
        return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
    }

    function getSetWeekYearHelper(input, week, weekday, dow, doy) {
        var weeksTarget;
        if (input == null) {
            return weekOfYear(this, dow, doy).year;
        } else {
            weeksTarget = weeksInYear(input, dow, doy);
            if (week > weeksTarget) {
                week = weeksTarget;
            }
            return setWeekAll.call(this, input, week, weekday, dow, doy);
        }
    }

    function setWeekAll(weekYear, week, weekday, dow, doy) {
        var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy),
            date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);

        this.year(date.getUTCFullYear());
        this.month(date.getUTCMonth());
        this.date(date.getUTCDate());
        return this;
    }

    // FORMATTING

    addFormatToken('Q', 0, 'Qo', 'quarter');

    // ALIASES

    addUnitAlias('quarter', 'Q');

    // PRIORITY

    addUnitPriority('quarter', 7);

    // PARSING

    addRegexToken('Q', match1);
    addParseToken('Q', function (input, array) {
        array[MONTH] = (toInt(input) - 1) * 3;
    });

    // MOMENTS

    function getSetQuarter (input) {
        return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
    }

    // FORMATTING

    addFormatToken('D', ['DD', 2], 'Do', 'date');

    // ALIASES

    addUnitAlias('date', 'D');

    // PRIORITY
    addUnitPriority('date', 9);

    // PARSING

    addRegexToken('D',  match1to2);
    addRegexToken('DD', match1to2, match2);
    addRegexToken('Do', function (isStrict, locale) {
        // TODO: Remove "ordinalParse" fallback in next major release.
        return isStrict ?
          (locale._dayOfMonthOrdinalParse || locale._ordinalParse) :
          locale._dayOfMonthOrdinalParseLenient;
    });

    addParseToken(['D', 'DD'], DATE);
    addParseToken('Do', function (input, array) {
        array[DATE] = toInt(input.match(match1to2)[0]);
    });

    // MOMENTS

    var getSetDayOfMonth = makeGetSet('Date', true);

    // FORMATTING

    addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

    // ALIASES

    addUnitAlias('dayOfYear', 'DDD');

    // PRIORITY
    addUnitPriority('dayOfYear', 4);

    // PARSING

    addRegexToken('DDD',  match1to3);
    addRegexToken('DDDD', match3);
    addParseToken(['DDD', 'DDDD'], function (input, array, config) {
        config._dayOfYear = toInt(input);
    });

    // HELPERS

    // MOMENTS

    function getSetDayOfYear (input) {
        var dayOfYear = Math.round((this.clone().startOf('day') - this.clone().startOf('year')) / 864e5) + 1;
        return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
    }

    // FORMATTING

    addFormatToken('m', ['mm', 2], 0, 'minute');

    // ALIASES

    addUnitAlias('minute', 'm');

    // PRIORITY

    addUnitPriority('minute', 14);

    // PARSING

    addRegexToken('m',  match1to2);
    addRegexToken('mm', match1to2, match2);
    addParseToken(['m', 'mm'], MINUTE);

    // MOMENTS

    var getSetMinute = makeGetSet('Minutes', false);

    // FORMATTING

    addFormatToken('s', ['ss', 2], 0, 'second');

    // ALIASES

    addUnitAlias('second', 's');

    // PRIORITY

    addUnitPriority('second', 15);

    // PARSING

    addRegexToken('s',  match1to2);
    addRegexToken('ss', match1to2, match2);
    addParseToken(['s', 'ss'], SECOND);

    // MOMENTS

    var getSetSecond = makeGetSet('Seconds', false);

    // FORMATTING

    addFormatToken('S', 0, 0, function () {
        return ~~(this.millisecond() / 100);
    });

    addFormatToken(0, ['SS', 2], 0, function () {
        return ~~(this.millisecond() / 10);
    });

    addFormatToken(0, ['SSS', 3], 0, 'millisecond');
    addFormatToken(0, ['SSSS', 4], 0, function () {
        return this.millisecond() * 10;
    });
    addFormatToken(0, ['SSSSS', 5], 0, function () {
        return this.millisecond() * 100;
    });
    addFormatToken(0, ['SSSSSS', 6], 0, function () {
        return this.millisecond() * 1000;
    });
    addFormatToken(0, ['SSSSSSS', 7], 0, function () {
        return this.millisecond() * 10000;
    });
    addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
        return this.millisecond() * 100000;
    });
    addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
        return this.millisecond() * 1000000;
    });


    // ALIASES

    addUnitAlias('millisecond', 'ms');

    // PRIORITY

    addUnitPriority('millisecond', 16);

    // PARSING

    addRegexToken('S',    match1to3, match1);
    addRegexToken('SS',   match1to3, match2);
    addRegexToken('SSS',  match1to3, match3);

    var token;
    for (token = 'SSSS'; token.length <= 9; token += 'S') {
        addRegexToken(token, matchUnsigned);
    }

    function parseMs(input, array) {
        array[MILLISECOND] = toInt(('0.' + input) * 1000);
    }

    for (token = 'S'; token.length <= 9; token += 'S') {
        addParseToken(token, parseMs);
    }
    // MOMENTS

    var getSetMillisecond = makeGetSet('Milliseconds', false);

    // FORMATTING

    addFormatToken('z',  0, 0, 'zoneAbbr');
    addFormatToken('zz', 0, 0, 'zoneName');

    // MOMENTS

    function getZoneAbbr () {
        return this._isUTC ? 'UTC' : '';
    }

    function getZoneName () {
        return this._isUTC ? 'Coordinated Universal Time' : '';
    }

    var proto = Moment.prototype;

    proto.add               = add;
    proto.calendar          = calendar$1;
    proto.clone             = clone;
    proto.diff              = diff;
    proto.endOf             = endOf;
    proto.format            = format;
    proto.from              = from;
    proto.fromNow           = fromNow;
    proto.to                = to;
    proto.toNow             = toNow;
    proto.get               = stringGet;
    proto.invalidAt         = invalidAt;
    proto.isAfter           = isAfter;
    proto.isBefore          = isBefore;
    proto.isBetween         = isBetween;
    proto.isSame            = isSame;
    proto.isSameOrAfter     = isSameOrAfter;
    proto.isSameOrBefore    = isSameOrBefore;
    proto.isValid           = isValid$2;
    proto.lang              = lang;
    proto.locale            = locale;
    proto.localeData        = localeData;
    proto.max               = prototypeMax;
    proto.min               = prototypeMin;
    proto.parsingFlags      = parsingFlags;
    proto.set               = stringSet;
    proto.startOf           = startOf;
    proto.subtract          = subtract;
    proto.toArray           = toArray;
    proto.toObject          = toObject;
    proto.toDate            = toDate;
    proto.toISOString       = toISOString;
    proto.inspect           = inspect;
    proto.toJSON            = toJSON;
    proto.toString          = toString;
    proto.unix              = unix;
    proto.valueOf           = valueOf;
    proto.creationData      = creationData;
    proto.year       = getSetYear;
    proto.isLeapYear = getIsLeapYear;
    proto.weekYear    = getSetWeekYear;
    proto.isoWeekYear = getSetISOWeekYear;
    proto.quarter = proto.quarters = getSetQuarter;
    proto.month       = getSetMonth;
    proto.daysInMonth = getDaysInMonth;
    proto.week           = proto.weeks        = getSetWeek;
    proto.isoWeek        = proto.isoWeeks     = getSetISOWeek;
    proto.weeksInYear    = getWeeksInYear;
    proto.isoWeeksInYear = getISOWeeksInYear;
    proto.date       = getSetDayOfMonth;
    proto.day        = proto.days             = getSetDayOfWeek;
    proto.weekday    = getSetLocaleDayOfWeek;
    proto.isoWeekday = getSetISODayOfWeek;
    proto.dayOfYear  = getSetDayOfYear;
    proto.hour = proto.hours = getSetHour;
    proto.minute = proto.minutes = getSetMinute;
    proto.second = proto.seconds = getSetSecond;
    proto.millisecond = proto.milliseconds = getSetMillisecond;
    proto.utcOffset            = getSetOffset;
    proto.utc                  = setOffsetToUTC;
    proto.local                = setOffsetToLocal;
    proto.parseZone            = setOffsetToParsedOffset;
    proto.hasAlignedHourOffset = hasAlignedHourOffset;
    proto.isDST                = isDaylightSavingTime;
    proto.isLocal              = isLocal;
    proto.isUtcOffset          = isUtcOffset;
    proto.isUtc                = isUtc;
    proto.isUTC                = isUtc;
    proto.zoneAbbr = getZoneAbbr;
    proto.zoneName = getZoneName;
    proto.dates  = deprecate('dates accessor is deprecated. Use date instead.', getSetDayOfMonth);
    proto.months = deprecate('months accessor is deprecated. Use month instead', getSetMonth);
    proto.years  = deprecate('years accessor is deprecated. Use year instead', getSetYear);
    proto.zone   = deprecate('moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/', getSetZone);
    proto.isDSTShifted = deprecate('isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information', isDaylightSavingTimeShifted);

    function createUnix (input) {
        return createLocal(input * 1000);
    }

    function createInZone () {
        return createLocal.apply(null, arguments).parseZone();
    }

    function preParsePostFormat (string) {
        return string;
    }

    var proto$1 = Locale.prototype;

    proto$1.calendar        = calendar;
    proto$1.longDateFormat  = longDateFormat;
    proto$1.invalidDate     = invalidDate;
    proto$1.ordinal         = ordinal;
    proto$1.preparse        = preParsePostFormat;
    proto$1.postformat      = preParsePostFormat;
    proto$1.relativeTime    = relativeTime;
    proto$1.pastFuture      = pastFuture;
    proto$1.set             = set;

    proto$1.months            =        localeMonths;
    proto$1.monthsShort       =        localeMonthsShort;
    proto$1.monthsParse       =        localeMonthsParse;
    proto$1.monthsRegex       = monthsRegex;
    proto$1.monthsShortRegex  = monthsShortRegex;
    proto$1.week = localeWeek;
    proto$1.firstDayOfYear = localeFirstDayOfYear;
    proto$1.firstDayOfWeek = localeFirstDayOfWeek;

    proto$1.weekdays       =        localeWeekdays;
    proto$1.weekdaysMin    =        localeWeekdaysMin;
    proto$1.weekdaysShort  =        localeWeekdaysShort;
    proto$1.weekdaysParse  =        localeWeekdaysParse;

    proto$1.weekdaysRegex       =        weekdaysRegex;
    proto$1.weekdaysShortRegex  =        weekdaysShortRegex;
    proto$1.weekdaysMinRegex    =        weekdaysMinRegex;

    proto$1.isPM = localeIsPM;
    proto$1.meridiem = localeMeridiem;

    function get$1 (format, index, field, setter) {
        var locale = getLocale();
        var utc = createUTC().set(setter, index);
        return locale[field](utc, format);
    }

    function listMonthsImpl (format, index, field) {
        if (isNumber(format)) {
            index = format;
            format = undefined;
        }

        format = format || '';

        if (index != null) {
            return get$1(format, index, field, 'month');
        }

        var i;
        var out = [];
        for (i = 0; i < 12; i++) {
            out[i] = get$1(format, i, field, 'month');
        }
        return out;
    }

    // ()
    // (5)
    // (fmt, 5)
    // (fmt)
    // (true)
    // (true, 5)
    // (true, fmt, 5)
    // (true, fmt)
    function listWeekdaysImpl (localeSorted, format, index, field) {
        if (typeof localeSorted === 'boolean') {
            if (isNumber(format)) {
                index = format;
                format = undefined;
            }

            format = format || '';
        } else {
            format = localeSorted;
            index = format;
            localeSorted = false;

            if (isNumber(format)) {
                index = format;
                format = undefined;
            }

            format = format || '';
        }

        var locale = getLocale(),
            shift = localeSorted ? locale._week.dow : 0;

        if (index != null) {
            return get$1(format, (index + shift) % 7, field, 'day');
        }

        var i;
        var out = [];
        for (i = 0; i < 7; i++) {
            out[i] = get$1(format, (i + shift) % 7, field, 'day');
        }
        return out;
    }

    function listMonths (format, index) {
        return listMonthsImpl(format, index, 'months');
    }

    function listMonthsShort (format, index) {
        return listMonthsImpl(format, index, 'monthsShort');
    }

    function listWeekdays (localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdays');
    }

    function listWeekdaysShort (localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysShort');
    }

    function listWeekdaysMin (localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysMin');
    }

    getSetGlobalLocale('en', {
        dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/,
        ordinal : function (number) {
            var b = number % 10,
                output = (toInt(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });

    // Side effect imports

    hooks.lang = deprecate('moment.lang is deprecated. Use moment.locale instead.', getSetGlobalLocale);
    hooks.langData = deprecate('moment.langData is deprecated. Use moment.localeData instead.', getLocale);

    var mathAbs = Math.abs;

    function abs () {
        var data           = this._data;

        this._milliseconds = mathAbs(this._milliseconds);
        this._days         = mathAbs(this._days);
        this._months       = mathAbs(this._months);

        data.milliseconds  = mathAbs(data.milliseconds);
        data.seconds       = mathAbs(data.seconds);
        data.minutes       = mathAbs(data.minutes);
        data.hours         = mathAbs(data.hours);
        data.months        = mathAbs(data.months);
        data.years         = mathAbs(data.years);

        return this;
    }

    function addSubtract$1 (duration, input, value, direction) {
        var other = createDuration(input, value);

        duration._milliseconds += direction * other._milliseconds;
        duration._days         += direction * other._days;
        duration._months       += direction * other._months;

        return duration._bubble();
    }

    // supports only 2.0-style add(1, 's') or add(duration)
    function add$1 (input, value) {
        return addSubtract$1(this, input, value, 1);
    }

    // supports only 2.0-style subtract(1, 's') or subtract(duration)
    function subtract$1 (input, value) {
        return addSubtract$1(this, input, value, -1);
    }

    function absCeil (number) {
        if (number < 0) {
            return Math.floor(number);
        } else {
            return Math.ceil(number);
        }
    }

    function bubble () {
        var milliseconds = this._milliseconds;
        var days         = this._days;
        var months       = this._months;
        var data         = this._data;
        var seconds, minutes, hours, years, monthsFromDays;

        // if we have a mix of positive and negative values, bubble down first
        // check: https://github.com/moment/moment/issues/2166
        if (!((milliseconds >= 0 && days >= 0 && months >= 0) ||
                (milliseconds <= 0 && days <= 0 && months <= 0))) {
            milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
            days = 0;
            months = 0;
        }

        // The following code bubbles up values, see the tests for
        // examples of what that means.
        data.milliseconds = milliseconds % 1000;

        seconds           = absFloor(milliseconds / 1000);
        data.seconds      = seconds % 60;

        minutes           = absFloor(seconds / 60);
        data.minutes      = minutes % 60;

        hours             = absFloor(minutes / 60);
        data.hours        = hours % 24;

        days += absFloor(hours / 24);

        // convert days to months
        monthsFromDays = absFloor(daysToMonths(days));
        months += monthsFromDays;
        days -= absCeil(monthsToDays(monthsFromDays));

        // 12 months -> 1 year
        years = absFloor(months / 12);
        months %= 12;

        data.days   = days;
        data.months = months;
        data.years  = years;

        return this;
    }

    function daysToMonths (days) {
        // 400 years have 146097 days (taking into account leap year rules)
        // 400 years have 12 months === 4800
        return days * 4800 / 146097;
    }

    function monthsToDays (months) {
        // the reverse of daysToMonths
        return months * 146097 / 4800;
    }

    function as (units) {
        if (!this.isValid()) {
            return NaN;
        }
        var days;
        var months;
        var milliseconds = this._milliseconds;

        units = normalizeUnits(units);

        if (units === 'month' || units === 'quarter' || units === 'year') {
            days = this._days + milliseconds / 864e5;
            months = this._months + daysToMonths(days);
            switch (units) {
                case 'month':   return months;
                case 'quarter': return months / 3;
                case 'year':    return months / 12;
            }
        } else {
            // handle milliseconds separately because of floating point math errors (issue #1867)
            days = this._days + Math.round(monthsToDays(this._months));
            switch (units) {
                case 'week'   : return days / 7     + milliseconds / 6048e5;
                case 'day'    : return days         + milliseconds / 864e5;
                case 'hour'   : return days * 24    + milliseconds / 36e5;
                case 'minute' : return days * 1440  + milliseconds / 6e4;
                case 'second' : return days * 86400 + milliseconds / 1000;
                // Math.floor prevents floating point math errors here
                case 'millisecond': return Math.floor(days * 864e5) + milliseconds;
                default: throw new Error('Unknown unit ' + units);
            }
        }
    }

    // TODO: Use this.as('ms')?
    function valueOf$1 () {
        if (!this.isValid()) {
            return NaN;
        }
        return (
            this._milliseconds +
            this._days * 864e5 +
            (this._months % 12) * 2592e6 +
            toInt(this._months / 12) * 31536e6
        );
    }

    function makeAs (alias) {
        return function () {
            return this.as(alias);
        };
    }

    var asMilliseconds = makeAs('ms');
    var asSeconds      = makeAs('s');
    var asMinutes      = makeAs('m');
    var asHours        = makeAs('h');
    var asDays         = makeAs('d');
    var asWeeks        = makeAs('w');
    var asMonths       = makeAs('M');
    var asQuarters     = makeAs('Q');
    var asYears        = makeAs('y');

    function clone$1 () {
        return createDuration(this);
    }

    function get$2 (units) {
        units = normalizeUnits(units);
        return this.isValid() ? this[units + 's']() : NaN;
    }

    function makeGetter(name) {
        return function () {
            return this.isValid() ? this._data[name] : NaN;
        };
    }

    var milliseconds = makeGetter('milliseconds');
    var seconds      = makeGetter('seconds');
    var minutes      = makeGetter('minutes');
    var hours        = makeGetter('hours');
    var days         = makeGetter('days');
    var months       = makeGetter('months');
    var years        = makeGetter('years');

    function weeks () {
        return absFloor(this.days() / 7);
    }

    var round = Math.round;
    var thresholds = {
        ss: 44,         // a few seconds to seconds
        s : 45,         // seconds to minute
        m : 45,         // minutes to hour
        h : 22,         // hours to day
        d : 26,         // days to month
        M : 11          // months to year
    };

    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
        return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function relativeTime$1 (posNegDuration, withoutSuffix, locale) {
        var duration = createDuration(posNegDuration).abs();
        var seconds  = round(duration.as('s'));
        var minutes  = round(duration.as('m'));
        var hours    = round(duration.as('h'));
        var days     = round(duration.as('d'));
        var months   = round(duration.as('M'));
        var years    = round(duration.as('y'));

        var a = seconds <= thresholds.ss && ['s', seconds]  ||
                seconds < thresholds.s   && ['ss', seconds] ||
                minutes <= 1             && ['m']           ||
                minutes < thresholds.m   && ['mm', minutes] ||
                hours   <= 1             && ['h']           ||
                hours   < thresholds.h   && ['hh', hours]   ||
                days    <= 1             && ['d']           ||
                days    < thresholds.d   && ['dd', days]    ||
                months  <= 1             && ['M']           ||
                months  < thresholds.M   && ['MM', months]  ||
                years   <= 1             && ['y']           || ['yy', years];

        a[2] = withoutSuffix;
        a[3] = +posNegDuration > 0;
        a[4] = locale;
        return substituteTimeAgo.apply(null, a);
    }

    // This function allows you to set the rounding function for relative time strings
    function getSetRelativeTimeRounding (roundingFunction) {
        if (roundingFunction === undefined) {
            return round;
        }
        if (typeof(roundingFunction) === 'function') {
            round = roundingFunction;
            return true;
        }
        return false;
    }

    // This function allows you to set a threshold for relative time strings
    function getSetRelativeTimeThreshold (threshold, limit) {
        if (thresholds[threshold] === undefined) {
            return false;
        }
        if (limit === undefined) {
            return thresholds[threshold];
        }
        thresholds[threshold] = limit;
        if (threshold === 's') {
            thresholds.ss = limit - 1;
        }
        return true;
    }

    function humanize (withSuffix) {
        if (!this.isValid()) {
            return this.localeData().invalidDate();
        }

        var locale = this.localeData();
        var output = relativeTime$1(this, !withSuffix, locale);

        if (withSuffix) {
            output = locale.pastFuture(+this, output);
        }

        return locale.postformat(output);
    }

    var abs$1 = Math.abs;

    function sign(x) {
        return ((x > 0) - (x < 0)) || +x;
    }

    function toISOString$1() {
        // for ISO strings we do not use the normal bubbling rules:
        //  * milliseconds bubble up until they become hours
        //  * days do not bubble at all
        //  * months bubble up until they become years
        // This is because there is no context-free conversion between hours and days
        // (think of clock changes)
        // and also not between days and months (28-31 days per month)
        if (!this.isValid()) {
            return this.localeData().invalidDate();
        }

        var seconds = abs$1(this._milliseconds) / 1000;
        var days         = abs$1(this._days);
        var months       = abs$1(this._months);
        var minutes, hours, years;

        // 3600 seconds -> 60 minutes -> 1 hour
        minutes           = absFloor(seconds / 60);
        hours             = absFloor(minutes / 60);
        seconds %= 60;
        minutes %= 60;

        // 12 months -> 1 year
        years  = absFloor(months / 12);
        months %= 12;


        // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
        var Y = years;
        var M = months;
        var D = days;
        var h = hours;
        var m = minutes;
        var s = seconds ? seconds.toFixed(3).replace(/\.?0+$/, '') : '';
        var total = this.asSeconds();

        if (!total) {
            // this is the same as C#'s (Noda) and python (isodate)...
            // but not other JS (goog.date)
            return 'P0D';
        }

        var totalSign = total < 0 ? '-' : '';
        var ymSign = sign(this._months) !== sign(total) ? '-' : '';
        var daysSign = sign(this._days) !== sign(total) ? '-' : '';
        var hmsSign = sign(this._milliseconds) !== sign(total) ? '-' : '';

        return totalSign + 'P' +
            (Y ? ymSign + Y + 'Y' : '') +
            (M ? ymSign + M + 'M' : '') +
            (D ? daysSign + D + 'D' : '') +
            ((h || m || s) ? 'T' : '') +
            (h ? hmsSign + h + 'H' : '') +
            (m ? hmsSign + m + 'M' : '') +
            (s ? hmsSign + s + 'S' : '');
    }

    var proto$2 = Duration.prototype;

    proto$2.isValid        = isValid$1;
    proto$2.abs            = abs;
    proto$2.add            = add$1;
    proto$2.subtract       = subtract$1;
    proto$2.as             = as;
    proto$2.asMilliseconds = asMilliseconds;
    proto$2.asSeconds      = asSeconds;
    proto$2.asMinutes      = asMinutes;
    proto$2.asHours        = asHours;
    proto$2.asDays         = asDays;
    proto$2.asWeeks        = asWeeks;
    proto$2.asMonths       = asMonths;
    proto$2.asQuarters     = asQuarters;
    proto$2.asYears        = asYears;
    proto$2.valueOf        = valueOf$1;
    proto$2._bubble        = bubble;
    proto$2.clone          = clone$1;
    proto$2.get            = get$2;
    proto$2.milliseconds   = milliseconds;
    proto$2.seconds        = seconds;
    proto$2.minutes        = minutes;
    proto$2.hours          = hours;
    proto$2.days           = days;
    proto$2.weeks          = weeks;
    proto$2.months         = months;
    proto$2.years          = years;
    proto$2.humanize       = humanize;
    proto$2.toISOString    = toISOString$1;
    proto$2.toString       = toISOString$1;
    proto$2.toJSON         = toISOString$1;
    proto$2.locale         = locale;
    proto$2.localeData     = localeData;

    proto$2.toIsoString = deprecate('toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)', toISOString$1);
    proto$2.lang = lang;

    // Side effect imports

    // FORMATTING

    addFormatToken('X', 0, 0, 'unix');
    addFormatToken('x', 0, 0, 'valueOf');

    // PARSING

    addRegexToken('x', matchSigned);
    addRegexToken('X', matchTimestamp);
    addParseToken('X', function (input, array, config) {
        config._d = new Date(parseFloat(input, 10) * 1000);
    });
    addParseToken('x', function (input, array, config) {
        config._d = new Date(toInt(input));
    });

    // Side effect imports


    hooks.version = '2.24.0';

    setHookCallback(createLocal);

    hooks.fn                    = proto;
    hooks.min                   = min;
    hooks.max                   = max;
    hooks.now                   = now;
    hooks.utc                   = createUTC;
    hooks.unix                  = createUnix;
    hooks.months                = listMonths;
    hooks.isDate                = isDate;
    hooks.locale                = getSetGlobalLocale;
    hooks.invalid               = createInvalid;
    hooks.duration              = createDuration;
    hooks.isMoment              = isMoment;
    hooks.weekdays              = listWeekdays;
    hooks.parseZone             = createInZone;
    hooks.localeData            = getLocale;
    hooks.isDuration            = isDuration;
    hooks.monthsShort           = listMonthsShort;
    hooks.weekdaysMin           = listWeekdaysMin;
    hooks.defineLocale          = defineLocale;
    hooks.updateLocale          = updateLocale;
    hooks.locales               = listLocales;
    hooks.weekdaysShort         = listWeekdaysShort;
    hooks.normalizeUnits        = normalizeUnits;
    hooks.relativeTimeRounding  = getSetRelativeTimeRounding;
    hooks.relativeTimeThreshold = getSetRelativeTimeThreshold;
    hooks.calendarFormat        = getCalendarFormat;
    hooks.prototype             = proto;

    // currently HTML5 input type only supports 24-hour formats
    hooks.HTML5_FMT = {
        DATETIME_LOCAL: 'YYYY-MM-DDTHH:mm',             // <input type="datetime-local" />
        DATETIME_LOCAL_SECONDS: 'YYYY-MM-DDTHH:mm:ss',  // <input type="datetime-local" step="1" />
        DATETIME_LOCAL_MS: 'YYYY-MM-DDTHH:mm:ss.SSS',   // <input type="datetime-local" step="0.001" />
        DATE: 'YYYY-MM-DD',                             // <input type="date" />
        TIME: 'HH:mm',                                  // <input type="time" />
        TIME_SECONDS: 'HH:mm:ss',                       // <input type="time" step="1" />
        TIME_MS: 'HH:mm:ss.SSS',                        // <input type="time" step="0.001" />
        WEEK: 'GGGG-[W]WW',                             // <input type="week" />
        MONTH: 'YYYY-MM'                                // <input type="month" />
    };

    return hooks;

})));

},{}]},{},[1]);
