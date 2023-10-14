const wgl = {
	lib: nsGmx.libGL,
	options: {
	},
	createGL: opt => {
		wgl.options = opt;
		return wgl.lib.createGL(wgl.options).then(pt => {
// console.log(' ______', pt, wgl);
			// this._ready = true;
			// this._reset();
			return pt;
// this._imageReady();
		});
	},
	redrawGl: pars => {
		let { offscreen, matrix4fv, vertices } = pars;
// console.log(' ______', pars);
		return wgl.lib.redrawGl(pars);
	}

};
var ext = L.extend({
	options: {
    },
	initialize: function (url, anchors, options) { // (String, LatLngs, Object)
		this._ready = false;
		this._url = url;
		L.Util.setOptions(this, L.extend(this.options, options));
		this._anchors = anchors;
		// this.options.clip = null;

		// this._topLeft = L.point(0, 0);
		let _imageClass = 'leaflet-image-layer';
		if (this.options.className) _imageClass += this.options.className;
        this._image = L.DomUtil.create('div', _imageClass);
		this._canvas = L.DomUtil.create('canvas', 'leaflet-canvas-transform', this._image);

		this._offscreen = this._canvas.transferControlToOffscreen();
	},

	onRemove: function () {
		map
			.off('resize', this._onresize, this)
			.off('moveend', this._onmoveend, this);
		L.DomUtil.remove(this._image);
		if (this.options.interactive) { this.removeInteractiveTarget(this._image); }
	},

	onAdd: function (map) {
		var pane = this.getPane();
		pane.insertBefore(this._image, pane.firstChild);
		map
			.on('resize', this._onresize, this)
			.on('moveend', this._onmoveend, this);
		if (this.options.interactive) {
			L.DomUtil.addClass(this._image, 'leaflet-interactive');
			this.addInteractiveTarget(this._image);
		}
		var size = map.getSize();
		this._size = size;
		this._offscreen.width = size.x; this._offscreen.height = size.y;
		L.DomUtil.addClass(this._image, 'leaflet-zoom-' + (this._map.options.zoomAnimation && L.Browser.any3d ? 'animated' : 'hide'));
		if (this.options.zIndex) this._updateZIndex();

		this._wglOptions = {
			canvas: this._offscreen,
			programs: [
				// {
					// key: 'ColorMatrix'
					
				// },
				{
					key: 'Saturation'
					
				},
				{
					key: 'Contrast'
					
				},
				{
					key: 'Brightness'
					
				},
				{
					anchors: this._getAnchors(),
					clipRings: this._pClipPolygon(this.options.clip),
					url: this._url,
					key: 'ImageTransform'
				},
			],
			// anchors: this._getAnchors(),
			// clipRings: this._pClipPolygon(this.options.clip),
			// url: this._url,
			// vsSource: this._shaderVS,
			// fsSource: this._shaderFS
		};
		// if (this.options.clip) this._wglOptions.clipRings = this._pClipPolygon(this.options.clip)
		const pt = wgl.createGL(this._wglOptions).then(pt1 => {
			this._ready = true;
			this._reset();
		});
		this._reset();
	},

	_reset: function () {
		if(this._map && this._ready) {
			// this._wglOptions.anchors = this._getAnchors();
			// if (this.options.clip) this._wglOptions.clipRings = this._pClipPolygon(this.options.clip);
			this.__anchors = this._getAnchors();
			if (this.options.clip) this.__clipRings = this._pClipPolygon(this.options.clip);

			this._redraw();
		}
	},

    _onmoveend: function (e) {
		this._topLeft = this._map.containerPointToLayerPoint([0, 0]);
		L.DomUtil.setTransform(this._image, this._topLeft, 1);
// console.log(' ____onmoveend____', this._topLeft);
		this._reset();
		// setTimeout(this._reset, 250);
	},
	_onresize: function () {
		var size = this._map.getSize();
		this._size = size
		this._offscreen.width = size.x; this._offscreen.height = size.y;
console.log(' ___ _onresize ____', this._topLeft);
		this._onmoveend();
	},

	_animateZoom: function (e) {
        var map = this._map;
console.log(' ___animateZoom____', e.zoom, e.center);
		L.DomUtil.setTransform(this._image,
		    map._latLngBoundsToNewLayerBounds(map.getBounds(), e.zoom, e.center).min,
			map.getZoomScale(e.zoom)
		);
    },

    _ringToPixels: function (ring, isLngLat) {
		const map = this._map,
			tl = this._topLeft || map.containerPointToLayerPoint([0, 0]),
			w = 2 / this._size.x, h = 2 / this._size.y;
		return ring.map(it => {
			const latlng = isLngLat ? L.latLng(it[1], it[0]) : it;
			const lp = map.latLngToLayerPoint(latlng);
			const p = map.layerPointToContainerPoint(lp);
			// const p = map.layerPointToContainerPoint(lp).subtract(tl);
// console.log(' ___ _ringToPixels ____', this._topLeft, p);
			return [w * p.x - 1, 1 - h * p.y];
		});
	},

    _pClipPolygon: function (gjson) {
		if (!gjson) return;
		var coords = gjson.type.toLowerCase() === 'polygon' ? [gjson.coordinates] : gjson.coordinates;

		const _this = this;
		return coords.map(rings => {
			return rings.map(ring => {
				return _this._ringToPixels(ring, true);
			})
		});
	},

    setAnchors: function (anchors) {
		this._anchors = anchors || this._anchors;
		this._reset();
    },
    setClip: function (clip) {
		this.options.clip = clip || this.options.clip;
		this._reset();
	},

    getClip: function () {
        return this.options.clip;
	},
    _getAnchors: function () {
		let	anch = this._ringToPixels(this._anchors);
		return [anch[0][0], anch[0][1], anch[1][0], anch[1][1], anch[2][0], anch[2][1], anch[3][0], anch[3][1]];
	},
    _redraw: function () {
		if (this._map) {
			
			let pars = {
				anchors: this.__anchors,
				// clipPolygon: this.__clipRings,
				// clipPolygon: this._wglOptions.clipRings,
			};
			// if (this.options.clip) pars.clipPolygon = this.__clipRings;
			wgl.redrawGl(pars);
		}
    },
}, {
	// _glResources: null,
	// _gl: null,
    _shaderVS: '\
		attribute vec2 aVertCoord;\
		uniform mat4 uTransformMatrix;\
		varying vec2 vTextureCoord;\
attribute vec4 aVertCoord1;\
		void main(void) {\
			vTextureCoord = aVertCoord;\
			gl_Position = uTransformMatrix * vec4(aVertCoord, 0.0, 1.0);\
		}\
	',
	_shaderFS: '\
		precision mediump float;\
		varying vec2 vTextureCoord;\
		uniform sampler2D uSampler;\
		void main(void) {\
			if (vTextureCoord.x < 0.0 || vTextureCoord.x > 1.0 || vTextureCoord.y < 0.0 || vTextureCoord.y > 1.0)\
				discard;\
			gl_FragColor = texture2D(uSampler, vTextureCoord);\
		}\
	',

});
L.ImageTransformWebGL = L.ImageOverlay.extend(ext);

L.imageTransformWebGL = function (url, bounds, options) {
	return new L.ImageTransformWebGL(url, bounds, options);
};
