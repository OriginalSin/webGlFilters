// import Requests from './Requests';

const HOST = 'maps.kosmosnimki.ru',
    WORLDWIDTHFULL = 40075016.685578496,
	W = WORLDWIDTHFULL / 2,
	WORLDBBOX = [[-W, -W, W, W]],
    SCRIPT = '/Layer/CheckVersion.ashx',
	GMXPROXY = '//maps.kosmosnimki.ru/ApiSave.ashx',
	MINZOOM = 1,
	MAXZOOM = 22,
    STYLEKEYS = {
        marker: {
            server: ['image',   'angle',     'scale',     'minScale',     'maxScale',     'size',         'circle',     'center',     'color'],
            client: ['iconUrl', 'iconAngle', 'iconScale', 'iconMinScale', 'iconMaxScale', 'iconSize', 'iconCircle', 'iconCenter', 'iconColor']
        },
        outline: {
            server: ['color',  'opacity',   'thickness', 'dashes'],
            client: ['color',  'opacity',   'weight',    'dashArray']
        },
        fill: {
            server: ['color',     'opacity',   'image',       'pattern',     'radialGradient',     'linearGradient'],
            client: ['fillColor', 'fillOpacity', 'fillIconUrl', 'fillPattern', 'fillRadialGradient', 'fillLinearGradient']
        },
        label: {
            server: ['text',      'field',      'template',      'color',      'haloColor',      'size',          'spacing',      'align'],
            client: ['labelText', 'labelField', 'labelTemplate', 'labelColor', 'labelHaloColor', 'labelFontSize', 'labelSpacing', 'labelAlign']
        }
    },
    STYLEFUNCKEYS = {
        // iconUrl: 'iconUrlFunction',
        iconSize: 'iconSizeFunction',
        iconAngle: 'rotateFunction',
        iconScale: 'scaleFunction',
        iconColor: 'iconColorFunction',
        opacity: 'opacityFunction',
        fillOpacity: 'fillOpacityFunction',
        color: 'colorFunction',
        fillColor: 'fillColorFunction'
/*
    },

    STYLEFUNCERROR = {
        // iconUrl: function() { return ''; },
        iconSize: function() { return 8; },
        iconAngle: function() { return 0; },
        iconScale: function() { return 1; },
        iconColor: function() { return 0xFF; },
        opacity: function() { return 1; },
        fillOpacity: function() { return 0.5; },
        color: function() { return 0xFF; },
        fillColor: function() { return 0xFF; }
    },
    DEFAULTSTYLES = {
       MinZoom: 1,
       MaxZoom: 21,
       Filter: '',
       Balloon: '',
       DisableBalloonOnMouseMove: true,
       DisableBalloonOnClick: false,
       RenderStyle: {
            point: {    // old = {outline: {color: 255, thickness: 1}, marker:{size: 8}},
                color: 0xFF,
                weight: 1,
                iconSize: 8
            },
            linestring: {    // old = {outline: {color: 255, thickness: 1}},
                color: 0xFF,
                weight: 1
            },
            polygon: {    // old = {outline: {color: 255, thickness: 1}},
                color: 0xFF,
                weight: 1
            }
        }
*/
    };

const utils = {
	HOST: HOST,
    SCRIPT,
	WORLDBBOX,
	WORLDWIDTHFULL,
    getCoordsPixels: function(attr) {
        var coords = attr.coords,
            z = attr.z,
			tpx = attr.tpx,
			tpy = attr.tpy,
            hiddenLines = attr.hiddenLines || [],
            pixels = [],
            hidden = [],
            hiddenFlag = false,
            mInPixel = Math.pow(2, z + 8) / WORLDWIDTHFULL;
			/*
			,
            hash = {
                // gmx: gmx,
				// topLeft: attr.topLeft,
                tpx: tpx,
                tpy: tpy,
                coords: null,
                hiddenLines: null
            };
			*/
        for (var j = 0, len = coords.length; j < len; j++) {
            // var coords1 = coords[j],
                // hiddenLines1 = hiddenLines[j] || [],
                // pixels1 = [], hidden1 = [];
			coords[j].forEach(ringMerc => {
                var res = utils.getRingPixels({
					ringMerc: ringMerc,
					tpx: tpx,
					tpy: tpy,
					mInPixel: mInPixel,
					hiddenLines: hiddenLines
				});
				pixels.push(res.pixels);
				// var tt = res;
			});
			/*
            for (var j1 = 0, len1 = coords1.length; j1 < len1; j1++) {
                hash.ringMerc = coords1[j1];
                hash.hiddenLines = hiddenLines1[j1] || [];
                var res = utils.getRingPixels(hash);
                pixels1.push(res.coords);
                hidden1.push(res.hidden);
                if (res.hidden) {
                    hiddenFlag = true;
                }
            }
            pixels.push(pixels1);
            hidden.push(hidden1);
			*/
        }
// console.log('aaaaaaaaaa', pixels, tpx, tpy)
		
        return {coords: pixels, hidden: hiddenFlag ? hidden : null, z: z};
    },

    getRingPixels: ({ringMerc, tpx, tpy, mInPixel, hiddenLines}) => {
// console.log('getRingPixels', ringMerc, tpx, tpy)
        if (ringMerc.length === 0) {
			return null;
		}
        var cnt = 0, cntHide = 0,
            lastX = null, lastY = null,
            vectorSize = typeof ringMerc[0] === 'number' ? 2 : 1,
            pixels = [], hidden = [];
        for (var i = 0, len = ringMerc.length; i < len; i += vectorSize) {
            var lineIsOnEdge = false;
            if (hiddenLines && i === hiddenLines[cntHide]) {
                lineIsOnEdge = true;
                cntHide++;
            }
            var c = vectorSize === 1 ? ringMerc[i] : [ringMerc[i], ringMerc[i + 1]],
                x1 = Math.round((c[0] + W) * mInPixel), y1 = Math.round((W - c[1]) * mInPixel),
                // x1 = Math.round((c[0] + 0) * mInPixel), y1 = Math.round((0 - c[1]) * mInPixel),
                // x2 = Math.round(x1 - tpx), y2 = Math.round(y1 - tpy);
                x2 = Math.round(c[0] * mInPixel), y2 = Math.round(c[1] * mInPixel);

            if (lastX !== x2 || lastY !== y2) {
                lastX = x2; lastY = y2;
                if (lineIsOnEdge) {
                    hidden.push(cnt);
                }
                pixels[cnt++] = x2;
                pixels[cnt++] = y2;
            }
        }
        return {pixels: pixels, hidden: hidden.length ? hidden : null};
    },
	getHidden: function(coords, tb) {  // массив точек на границах тайлов
        var hiddenLines = [],
            vectorSize = typeof coords[0] === 'number' ? 2 : 1,
            prev = null;
        for (var i = 0, len = coords.length; i < len; i += vectorSize) {
            var p = vectorSize === 1 ? coords[i] : [coords[i], coords[i + 1]];
            if (prev && utils.chkOnEdge(p, prev, tb)) {
                hiddenLines.push(i);
            }
            prev = p;
        }
        return hiddenLines;
    },
   
	now: function() {
		if (timeoutID) { clearTimeout(timeoutID); }
		timeoutID = setTimeout(chkVersion, 0);
    },

    stop: function() {
		console.log('stop:', intervalID, delay);
        if (intervalID) { clearInterval(intervalID); }
        intervalID = null;
    },

    start: function(msec) {
		console.log('start:', intervalID, msec);
        if (msec) { delay = msec; }
        utils.stop();
        intervalID = setInterval(chkVersion, delay);
    },
/*
    parseLayerProps: function(prop) {
		// let ph = utils.getTileAttributes(prop);
		return Requests.extend(
			{
				properties: prop
			},
			utils.getTileAttributes(prop),
			utils.parseStyles(prop),
			utils.parseMetaProps(prop)
		);
    },
*/
    parseFilter: function(str) {
		let body = true;
		let test = false;
		if (str) {
			body = str.replace(/[[\]]/g, '"')
				.replace(/"(.+?)" in \((.+?)\)/g, '[$2].includes(props[indexes[\'$1\']])')
				.replace(/"(.+?)"/g, 'props[indexes[\'$1\']]')
				.replace(/([^><])=([^><])/g, '$1 === $2')
				.replace(/! ===/g, '!==')
				.replace(/<>/g, ' !== ')

				.replace(/\bAND\b/g, '&&')
				.replace(/\bOR\b/g, '||')
				.replace(/(floor\()/g, 'Math.$1')
				.replace(/ CONTAINS \'(.+?)\'/g, '.indexOf(\'$1\') !== -1')
				;
			// test = new Function('props', 'indexes', 'return ' + body + ';');
			// console.log('test', test);
		}
		return {
			filter: str,
			filterParsed: body,
			filterFun: new Function('props', 'indexes', 'return ' + body + ';')
		};
    },

// StyleManager.decodeOldStyles = function(props) {
    // var styles = props.styles,
		// arr = styles || [{MinZoom: 1, MaxZoom: 21, RenderStyle: StyleManager.DEFAULT_STYLE}],
		// type = props.type.toLocaleLowerCase(),
		// gmxStyles = {
			// attrKeys: {},
			// iconsUrl: {}
		// };
	// gmxStyles.styles = arr.map(function(it) {
        // var pt = {
            // Name: it.Name || '',
            // type: type || '',
			// legend: false,
            // MinZoom: it.MinZoom || 0,
            // MaxZoom: it.MaxZoom || 18
        // };
		// pt.labelMinZoom = it.labelMinZoom || pt.MinZoom;
		// pt.labelMaxZoom = it.labelMaxZoom || pt.MaxZoom;

        // if ('Balloon' in it) {
            // pt.Balloon = it.Balloon;
			// var hash = StyleManager.getKeysHash(it.Balloon, 'Balloon');
			// if (Object.keys(hash).length) {
				// L.extend(gmxStyles.attrKeys, hash);
			// }
        // }
        // if (it.RenderStyle) {
            // var rt = StyleManager.decodeOldStyle(it.RenderStyle);
			// L.extend(gmxStyles.attrKeys, rt.attrKeys);
			// if (rt.style.iconUrl) { gmxStyles.iconsUrl[rt.style.iconUrl] = true; }
            // pt.RenderStyle = rt.style;
			// if (it.HoverStyle === undefined) {
				// var hoveredStyle = JSON.parse(JSON.stringify(pt.RenderStyle));
				// if (hoveredStyle.outline) { hoveredStyle.outline.thickness += 1; }
				// pt.HoverStyle = hoveredStyle;
			// } else if (it.HoverStyle === null) {
				// delete pt.HoverStyle;
			// } else {
				// var ht = StyleManager.decodeOldStyle(it.HoverStyle);
				// pt.HoverStyle = ht.style;
			// }
        // } else if (type === 'vector ') {
            // pt.RenderStyle = StyleManager.DEFAULT_STYLE;
		// }

        // if ('DisableBalloonOnMouseMove' in it) {
            // pt.DisableBalloonOnMouseMove = it.DisableBalloonOnMouseMove === false ? false : true;
        // }
        // if ('DisableBalloonOnClick' in it) {
            // pt.DisableBalloonOnClick = it.DisableBalloonOnClick || false;
        // }
        // if ('Filter' in it) {	// TODO: переделать на new Function = function(props, indexes, types)
// /*eslint-disable no-useless-escape */
            // pt.Filter = it.Filter;
            // var ph = L.gmx.Parsers.parseSQL(it.Filter.replace(/[\[\]]/g, '"'));
// /*eslint-enable */
			// TODO: need body for function ƒ (props, indexes, types)
            // if (ph) { pt.filterFunction = ph; }
        // }
		// return pt;
	// });
    // return gmxStyles;
// };

    dec2hex: function(i) {					// convert decimal to hex
        return (i + 0x1000000).toString(16).substr(-6);
    },
    dec2color: function(i, a)   {   // convert decimal to canvas color
        return a < 1 ? this.dec2rgba(i, a) : '#' + this.dec2hex(i);
    },
    dec2rgba: function(i, a)	{				// convert decimal to rgb
        var r = (i >> 16) & 255,
            g = (i >> 8) & 255,
            b = i & 255;
		return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';
	},

	decodeOldStyle: function(style) {   // Style Scanex->leaflet
		let st, i, len, key, key1,
			styleOut = {
				styleHooks: []
			};
			// attrKeys = {},
			// type = '';

		for (key in STYLEKEYS) {
			let keys = STYLEKEYS[key];
			for (i = 0, len = keys.client.length; i < len; i++) {
				key1 = keys.client[i];
				if (key1 in style) {
					styleOut[key1] = style[key1];
				}
			}
			st = style[key];
			if (st && typeof (st) === 'object') {
				for (i = 0, len = keys.server.length; i < len; i++) {
					key1 = keys.server[i];
					if (key1 in st) {
						var newKey = keys.client[i],
							zn = st[key1];
// console.log('sssss ', key, key1, zn, st);
						if (typeof (zn) === 'string') {
							// var hash = StyleManager.getKeysHash(zn, newKey);
							// if (Object.keys(hash).length) {
								// styleOut.common = false;
								// L.extend(attrKeys, hash);
							// }
							if (STYLEFUNCKEYS[newKey]) {
								// if (zn.match(/[^\d\.]/) === null) {
									// zn = Number(zn);
								// } else {
									//var func = L.gmx.Parsers.parseExpression(zn);
									// if (func === null) {
										// zn = STYLEFUNCERROR[newKey]();
									// } else {
										// styleOut[STYLEFUNCKEYS[newKey]] = func;
									// }
								// }
								// L.gmxUtil.getPatternIcon(options)
							} else if (key1 === 'image') {
								let fc = zn.substr(0, 1);
								if (fc !== '/' && fc !== 'h') zn = '/' + zn;
							}
						// } else if (key1 === 'pattern') {
							// zn = utils.getPatternIcon(null, {fillPattern: zn});
// console.log('sssss ', key, key1, zn, st);
						} else if (key1 === 'opacity') {
							zn /= 100;
						} else if (key1 === 'color') {
							zn = utils.dec2rgba(zn, 1);
							// zn = utils.dec2rgba(zn, st.opacity !== undefined ? st.opacity / 100 : 1);
						}
						styleOut[newKey] = zn;
					}
				}
			}
		}
		if (style.marker) {
			st = style.marker;
			if ('dx' in st || 'dy' in st) {
				var dx = st.dx || 0,
					dy = st.dy || 0;
				styleOut.iconAnchor = [-dx, -dy];    // For leaflet type iconAnchor
			}
		}
		const styleHooks = [];
		if (styleOut.labelField) {
			const body = `{
				let tile = pt.tile;
				let itemslabels = tile.itemslabels || [];
				let nm = pt.nm;
				let itemLabel = itemslabels[nm];
				if (itemLabel) {
					pt.itemData.labelValue = itemLabel.value;
					return itemLabel;
				}

				let item = tile.values[nm];
				// let itemData = pt.itemData;
				let name = pt.options.labelField;
				let val = item[pt.indexes[name]];
				let type = pt.types[name] || '';
				// let out = Utils.getDateTime(val);
				let out = type.indexOf('date') === 0 ? Utils.getDateTime(val) : val;
					// itemData.labelValue = out;
				itemLabel = {
					value: out,
					width: Utils.getLabelWidth(out, pt.options)
				};
// console.log('Hooks', nm, pt, out);
				itemslabels[nm] = itemLabel;
				tile.itemslabels = itemslabels;
				return out;
			}`;
			const hook = new Function('pt', 'Utils', body);
			// const hook = new Function('style', 'props', 'indexes', 'Utils', body);
			styleHooks.push(hook);
		}
		styleOut.styleHooks = styleHooks;

// console.log('styleOut ', styleOut);
		for (key in style) {
			if (!STYLEKEYS[key]) {
				styleOut[key] = style[key];
			}
		}
		return styleOut;
/*
		return {
			style: styleOut,			// стиль
			// attrKeys: attrKeys,			// используемые поля атрибутов
			type: type					// 'polygon', 'line', 'circle', 'square', 'image'
		};
*/
	},
    getDateTime: function(utime) {
        var dt = new Date(utime * 1000);

        var out = [
            utils.pad2(dt.getUTCDate()),
            utils.pad2(dt.getUTCMonth() + 1),
            dt.getUTCFullYear()
		].join('.') + ' ' + [
            //gmxAPIutils.pad2(h - new Date().getTimezoneOffset() / 60),
            utils.pad2(dt.getUTCHours()),
            utils.pad2(dt.getUTCMinutes()),
            utils.pad2(dt.getUTCSeconds())
        ].join(':');
        return out;

    },
	pad2: function(t) {
		return (t >= 0 && t < 10) ? ('0' + t) : ('' + t);
	},

    getPatternIcon: function(item, style, indexes) { // получить bitmap стиля pattern
        if (!style.fillPattern) { return null; }
// console.log('getPatternIcon', style);

        var notFunc = true,
            pattern = style.fillPattern,
            prop = item ? item.properties : null,
            step = pattern.step > 0 ? pattern.step : 0,
            patternDefaults = {
                minWidth: 1,
                maxWidth: 1000,
                minStep: 0,
                maxStep: 1000
            };
        if (pattern.patternStepFunction && prop !== null) {
            step = pattern.patternStepFunction(prop, indexes);
            notFunc = false;
        }
        if (step > patternDefaults.maxStep) {
            step = patternDefaults.maxStep;
        }
        else if (step < patternDefaults.minStep) {
            step = patternDefaults.minStep;
        }

        var size = pattern.width > 0 ? pattern.width : 8;
        if (pattern.patternWidthFunction && prop !== null) {
            size = pattern.patternWidthFunction(prop, indexes);
            notFunc = false;
        }
        if (size > patternDefaults.maxWidth) {
            size = patternDefaults.maxWidth;
        } else if (size < patternDefaults.minWidth) {
            size = patternDefaults.minWidth;
        }

        var op = 1;
        // var op = style.fillOpacity;
        if (style.opacityFunction && prop !== null) {
            op = style.opacityFunction(prop, indexes) / 100;
            notFunc = false;
        }

        var rgb = [0xff0000, 0x00ff00, 0x0000ff],
            arr = (pattern.colors != null ? pattern.colors : rgb),
            count = arr.length,
            resColors = [],
            i = 0;

        for (i = 0; i < count; i++) {
            var col = arr[i];
            if (pattern.patternColorsFunction && pattern.patternColorsFunction[i] !== null) {
                col = (prop !== null ? pattern.patternColorsFunction[i](prop, indexes) : rgb[i % 3]);
                notFunc = false;
            }
            resColors.push(col);
        }
        if (count === 0) { resColors = [0]; op = 0; count = 1; }   // pattern without colors

        var delta = size + step,
            allSize = delta * count,
            center = 0,
            //radius,
            rad = 0,
            hh = allSize,				// высота битмапа
            ww = allSize,				// ширина битмапа
            type = pattern.style || 'horizontal',
            flagRotate = false;

        if (type === 'diagonal1' || type === 'diagonal2' || type === 'cross' || type === 'cross1') {
            flagRotate = true;
        } else if (type === 'circle') {
            ww = hh = 2 * delta;
            center = Math.floor(ww / 2);	// центр круга
            //radius = Math.floor(size / 2);	// радиус
            rad = 2 * Math.PI / count;		// угол в рад.
        } else if (type === 'vertical') {
            hh = 1;
        } else if (type === 'horizontal') {
            ww = 1;
        }
        if (ww * hh > patternDefaults.maxWidth) {
            console.log({'func': 'getPatternIcon', 'Error': 'MAX_PATTERN_SIZE', 'alert': 'Bitmap from pattern is too big'});
            return null;
        }

		let canvas = new OffscreenCanvas(ww, hh);
		canvas.width = ww; canvas.height = hh;

        // var canvas = document.createElement('canvas');
        // canvas.width = ww; canvas.height = hh;
        var ptx = canvas.getContext('2d');
        ptx.clearRect(0, 0, canvas.width, canvas.height);
        if (type === 'diagonal2' || type === 'vertical') {
            ptx.translate(ww, 0);
            ptx.rotate(Math.PI / 2);
        }

        for (i = 0; i < count; i++) {
            ptx.beginPath();
            var fillStyle = utils.dec2color(resColors[i], op);
            ptx.fillStyle = fillStyle;

            if (flagRotate) {
                var x1 = i * delta; var xx1 = x1 + size;
                ptx.moveTo(x1, 0); ptx.lineTo(xx1, 0); ptx.lineTo(0, xx1); ptx.lineTo(0, x1); ptx.lineTo(x1, 0);

                x1 += allSize; xx1 = x1 + size;
                ptx.moveTo(x1, 0); ptx.lineTo(xx1, 0); ptx.lineTo(0, xx1); ptx.lineTo(0, x1); ptx.lineTo(x1, 0);
                if (type === 'cross' || type === 'cross1') {
                    x1 = i * delta; xx1 = x1 + size;
                    ptx.moveTo(ww, x1); ptx.lineTo(ww, xx1); ptx.lineTo(ww - xx1, 0); ptx.lineTo(ww - x1, 0); ptx.lineTo(ww, x1);

                    x1 += allSize; xx1 = x1 + size;
                    ptx.moveTo(ww, x1); ptx.lineTo(ww, xx1); ptx.lineTo(ww - xx1, 0); ptx.lineTo(ww - x1, 0); ptx.lineTo(ww, x1);
                }
            } else if (type === 'circle') {
                ptx.arc(center, center, size, i * rad, (i + 1) * rad);
                ptx.lineTo(center, center);
            } else {
                ptx.fillRect(0, i * delta, ww, size);
            }
            ptx.closePath();
            ptx.fill();
        }
 		let canvas1 = new OffscreenCanvas(ww, hh);
		// canvas.width = ww; canvas.height = hh;
       // var canvas1 = document.createElement('canvas');
        canvas1.width = ww; canvas1.height = hh;
        var ptx1 = canvas1.getContext('2d');
        ptx1.drawImage(canvas, 0, 0, ww, hh);
        return {'notFunc': notFunc, 'canvas': canvas1};
    },
    getTileBounds: function(coords) {
		var tileSize = WORLDWIDTHFULL / Math.pow(2, coords.z),
            minx = coords.x * tileSize - W,
            maxy = W - coords.y * tileSize;
        // return Requests.bounds([[minx, maxy - tileSize], [minx + tileSize, maxy]]);
    },

    getTileNumFromLeaflet: function (tilePoint, zoom) {
        if ('z' in tilePoint) {
            zoom = tilePoint.z;
        }
        var pz = Math.pow(2, zoom),
            tx = tilePoint.x % pz + (tilePoint.x < 0 ? pz : 0),
            ty = tilePoint.y % pz + (tilePoint.y < 0 ? pz : 0);
        return {
            z: zoom,
            x: tx % pz - pz / 2,
            y: pz / 2 - 1 - ty % pz
        };
    },

    isItemIntersectBounds: function(geo, bounds) {
        var type = geo.type,
            coords = geo.coordinates;
        if (type === 'POLYGON' || type === 'Polygon') {
			coords = [coords];
		}

		for (var j = 0, len1 = coords.length; j < len1; j++) {
			for (var i = 0, len = coords[j].length; i < len; i++) {
				if (bounds.clipPolygon(coords[j][i]).length) {
					return true;
				}
			}
		}
		return false;
    },

    _getMaxStyleSize: function(zoom, styles) {  // estimete style size for arbitrary object
        var maxSize = 0;
        for (var i = 0, len = styles.length; i < len; i++) {
            var style = styles[i];
            if (zoom > style.MaxZoom || zoom < style.MinZoom) { continue; }
            var RenderStyle = style.RenderStyle;
            if (this._needLoadIcons || !RenderStyle || !('maxSize' in RenderStyle)) {
                maxSize = 128;
                break;
            }
            var maxShift = 0;
            if ('iconAnchor' in RenderStyle && !RenderStyle.iconCenter) {
                maxShift = Math.max(
                    Math.abs(RenderStyle.iconAnchor[0]),
                    Math.abs(RenderStyle.iconAnchor[1])
                );
            }
            maxSize = Math.max(RenderStyle.maxSize + maxShift, maxSize);
        }
        return maxSize;
    },

    parseStyles: (prop) => {
        let styles = prop.styles || [];
			// attr = prop.tileAttributeIndexes,
		// prop._maxStyleSize = 128;
		prop._maxStyleSize = 0;
		prop._styleHooksFlag = false;
		let gmxStyles = [];
		let out = styles.map(it => {
			let renderStyle = it.RenderStyle || {};
			let renderStyleNew = utils.decodeOldStyle(renderStyle);
			let styleHooks = renderStyleNew.styleHooks;
			delete renderStyleNew.styleHooks;
			// if (renderStyle) {
				// renderStyleNew = utils.decodeOldStyle(renderStyle);
			// }
			renderStyleNew.MinZoom = it.MinZoom || MINZOOM;
			renderStyleNew.MaxZoom = it.MaxZoom || MAXZOOM;
			gmxStyles.push({...renderStyleNew});
			return new Promise(resolve => {
				let data = utils.parseFilter(it.Filter || '');
				data.MinZoom = renderStyleNew.MinZoom;
				data.MaxZoom = renderStyleNew.MaxZoom;
				// if (renderStyleNew.fillPattern) {
					// renderStyleNew.canvasPattern = utils.getPatternIcon(null, renderStyleNew);
				// }
				// if (renderStyle) {
					data.renderStyle = renderStyleNew;
					data.renderStyle.styleHooks = styleHooks;
					if (styleHooks.length) prop._styleHooksFlag = true;

				// }

				// let iconUrl = renderStyleNew.iconUrl || renderStyle.iconUrl || (renderStyle.marker && renderStyle.marker.image);
				let iconUrl = renderStyleNew.iconUrl || renderStyle.iconUrl;
				if (iconUrl) {
					iconUrl = iconUrl.replace('//kosmosnimki.ru', '//www.kosmosnimki.ru');
/*
					Requests.getBitMap(iconUrl).then(blob => {
	// .then(function(blob) {
		// return createImageBitmap(blob, {
			// premultiplyAlpha: 'none',
			// colorSpaceConversion: 'none'
		// });
						
						// console.log('dsddd', blob);
						return createImageBitmap(blob, {
							premultiplyAlpha: 'none',
							colorSpaceConversion: 'none'
						}).then(imageBitmap => {
							data.imageBitmap = imageBitmap;
							if (prop._maxStyleSize < imageBitmap.width) { prop._maxStyleSize = imageBitmap.width; }
							if (prop._maxStyleSize < imageBitmap.height) { prop._maxStyleSize = imageBitmap.height; }
							resolve(data);
						}).catch(console.warn);
						// resolve(data);
					});
*/
				} else if (renderStyleNew.fillPattern) {
					let canv = utils.getPatternIcon(null, renderStyleNew);
					canv.canvas.convertToBlob().then(blob => {
						// console.log(blob)
						return createImageBitmap(blob, {
							premultiplyAlpha: 'none',
							colorSpaceConversion: 'none'
						}).then(imageBitmap => {
							data.renderStyle.imageBitmap = imageBitmap;
							resolve(data);
						}).catch(console.warn);
					});
				} else {
					if (prop._maxStyleSize < data.renderStyle.weight) { prop._maxStyleSize = data.renderStyle.weight; }
					resolve(data);
				}
					// offscreen.convertToBlob().then((blob) => console.log(blob));
				// return data;
			})
		});
		prop.gmxStyles = gmxStyles;
		return {
			stylesPromise: Promise.all(out)
		};
    },

    parseMetaProps: function(prop) {
        var meta = prop.MetaProperties || {},
            ph = {};
        ph.dataSource = prop.dataSource || prop.LayerID || '';
		[
			'srs',					// проекция слоя
			'dataSource',			// изменить dataSource через MetaProperties
			'gmxProxy',				// установка прокачивалки
			'filter',				// фильтр слоя
			'isGeneralized',		// флаг generalization
			'isFlatten',			// флаг flatten
			'multiFilters',			// проверка всех фильтров для обьектов слоя
			'showScreenTiles',		// показывать границы экранных тайлов
			'dateBegin',			// фильтр по дате начало периода
			'dateEnd',				// фильтр по дате окончание периода
			'shiftX',				// сдвиг всего слоя
			'shiftY',				// сдвиг всего слоя
			'shiftXfield',			// сдвиг растров объектов слоя
			'shiftYfield',			// сдвиг растров объектов слоя
			'quicklookPlatform',	// тип спутника
			'quicklookX1',			// точки привязки снимка
			'quicklookY1',			// точки привязки снимка
			'quicklookX2',			// точки привязки снимка
			'quicklookY2',			// точки привязки снимка
			'quicklookX3',			// точки привязки снимка
			'quicklookY3',			// точки привязки снимка
			'quicklookX4',			// точки привязки снимка
			'quicklookY4'			// точки привязки снимка
		].forEach((k) => {
			if (k in meta) {
				ph[k] = meta[k].Value || '';
			}
		});
		if (ph.gmxProxy && ph.gmxProxy.toLowerCase() === 'true') {		// проверка прокачивалки
			ph.gmxProxy = GMXPROXY;
		}
		if ('parentLayer' in meta) {					// изменить dataSource через MetaProperties
			ph.dataSource = meta.parentLayer.Value;
		}

        return ph;
    },

    idsFill: function(ids) {
		const prop = ids.properties;
		let tmp = utils.getTileAttributes(prop);
		ids.tileAttributeIndexes = tmp.tileAttributeIndexes;
		ids.tileAttributeTypes = tmp.tileAttributeTypes;
        if (prop.IsRasterCatalog) {
            // gmx.IsRasterCatalog = prop.IsRasterCatalog;
            const layerLink = ids.tileAttributeIndexes.GMX_RasterCatalogID;
           if (layerLink) {
				ids.minZoomRasters =  prop.RCMinZoomForRasters || 0;
				const endPoint = prop.gmxEndPoints ? prop.gmxEndPoints.tileProps : '/TileSender.ashx';
				ids.rasterBGfunc = (x, y, z, item, srs) => {
					srs = srs || ids.srs || '3857';
                    let hostName = ids.hostName || '',
						syncParams = ids.syncParams || '',
						url = '//' + hostName + endPoint + '?ModeKey=tile&ftc=osm' + '&x=' + x + '&y=' + y + '&z=' + z;
					if (srs) url += '&srs=' + srs;
					url += '&LayerName=' + item[layerLink];
					if (ids.sessionKey) url += '&key=' + encodeURIComponent(ids.sessionKey);
					if (ids.syncParams) url += '&' + ids.syncParams;
					if (item.v) url += '&v=' + item.v;
					url += '&sw=1';
					return url;
                };
            }
        }
    },

    getTileAttributes: function(prop) {
        let tileAttributeIndexes = {},
            tileAttributeTypes = {};
        if (prop.attributes) {
            let attrs = prop.attributes,
                attrTypes = prop.attrTypes || null;
            if (prop.identityField) { tileAttributeIndexes[prop.identityField] = 0; }
            for (let a = 0; a < attrs.length; a++) {
                let key = attrs[a];
                tileAttributeIndexes[key] = a + 1;
                tileAttributeTypes[key] = attrTypes ? attrTypes[a] : 'string';
            }
        }
        return {
            tileAttributeTypes: tileAttributeTypes,
            tileAttributeIndexes: tileAttributeIndexes
        };
    },

	getStyleNum: function(itemArr, layerAttr, zoom) {
		let indexes = layerAttr.tileAttributeIndexes;
		if (layerAttr.stylesParsed) {
			for (let i = 0, len = layerAttr.stylesParsed.length; i < len; i++) {
				let st = layerAttr.stylesParsed[i];
				if (zoom && (zoom < st.MinZoom || zoom > st.MaxZoom)) { continue; }
				if (st.filterFun(itemArr, indexes)) { return i; }
			}
		} else {
			return 0;
		}
		return -1;
	},

    isPointInPolygonArr: function(chkPoint, coords) { // Проверка точки на принадлежность полигону в виде массива
        var isIn = false,
            x = chkPoint[0],
            y = chkPoint[1],
            vectorSize = 1,
            p1 = coords[0];

        if (typeof coords[0] === 'number') {
            vectorSize = 2;
            p1 = [coords[0], coords[1]];
        }

        for (var i = vectorSize, len = coords.length; i < len; i += vectorSize) {
            var p2 = vectorSize === 1 ? coords[i] : [coords[i], coords[i + 1]],
                xmin = Math.min(p1[0], p2[0]),
                xmax = Math.max(p1[0], p2[0]),
                ymax = Math.max(p1[1], p2[1]);
            if (x > xmin && x <= xmax && y <= ymax && p1[0] !== p2[0]) {
                var xinters = (x - p1[0]) * (p2[1] - p1[1]) / (p2[0] - p1[0]) + p1[1];
                if (p1[1] === p2[1] || y <= xinters) { isIn = !isIn; }
            }
            p1 = p2;
        }
        return isIn;
    },

    /** Is point in polygon with holes
     * @memberof L.gmxUtil
     * @param {chkPoint} chkPoint - point in [x, y] format
     * @param {coords} coords - polygon from geoJSON coordinates data format
     * @return {Boolean} true if polygon contain chkPoint
    */
    isPointInPolygonWithHoles: function(chkPoint, coords) {
        if (!utils.isPointInPolygonArr(chkPoint, coords[0])) { return false; }
        for (var j = 1, len = coords.length; j < len; j++) {
            if (utils.isPointInPolygonArr(chkPoint, coords[j])) { return false; }
        }
        return true;
    },
	labelCanvasContext: null,
    getLabelWidth: function(txt, style) {   // Get label size Label
        if (style) {
			let ptx = utils.labelCanvasContext;
            if (!ptx) {
				const canvas = new OffscreenCanvas(512, 512);
                canvas.width = canvas.height = 512;
                ptx = utils.labelCanvasContext = canvas.getContext('2d');
            }
            ptx.clearRect(0, 0, 512, 512);

            if (ptx.font !== style.font) ptx.font = style.font;
            //if (ptx.strokeStyle !== style.strokeStyle) { ptx.strokeStyle = style.strokeStyle; }
            if (ptx.fillStyle !== style.fillStyle) ptx.fillStyle = style.fillStyle;
            return txt.split('\n').map(it => {
				ptx.fillText(it, 0, 0);
				return [it, ptx.measureText(it)];
				// return [it, ptx.measureText(it).width];
			});
        }
        return 0;
    },
/*
    setLabel: function(ctx, txt, coord, style) {
        var x = coord[0],
            y = coord[1];

        if (ctx.shadowColor !== style.strokeStyle) { ctx.shadowColor = style.strokeStyle; }
        if (ctx.shadowBlur !== style.shadowBlur) { ctx.shadowBlur = style.shadowBlur; }
        if (ctx.font !== style.font) { ctx.font = style.font; }
		if (L.Browser.gecko) {	// Bug with perfomance in FireFox
			if (ctx.strokeStyle !== style.fillStyle) { ctx.strokeStyle = style.fillStyle; }
		} else {
			if (ctx.strokeStyle !== style.strokeStyle) { ctx.strokeStyle = style.strokeStyle; }
			if (ctx.fillStyle !== style.fillStyle) { ctx.fillStyle = style.fillStyle; }
		}
        ctx.strokeText(txt, x, y);
		if (!L.Browser.gecko) {
			ctx.fillText(txt, x, y);
		}
    },
*/
};
export default utils;
