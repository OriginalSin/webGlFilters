import Worker from './Workers'
import Utils from './Utils';

let libPrefix = '//www.kosmosnimki.ru/lib/geomixer_1.3/';
const quickLooks = [
	{
		anchorsLatLngs: [[47.20627509437822, 37.60396957397461], [47.20802436605374, 37.73983955383301], [47.14804977458752, 37.73271560668945], [47.14495586297567, 37.59993553161621]],	// [lat, lng]
		clipGeoJSON: {
			type: 'MultiPolygon',
			coordinates: [
				[
					[[37.70122338120615,47.206343977765634],[37.59645260839524,47.191123009948875],[37.59605312758839,47.20628386519843],[37.70122338120615,47.206343977765634]]
				],
				[
					[[37.59706103733718,47.16803047231103],[37.64263320052125,47.15858258486256],[37.67685038901948,47.193445372693404],[37.71232674605145,47.2076359237855],[37.71241765555821,47.20763696123541],[37.73495503856385,47.203129477088574],[37.74011990228989,47.19150857168657],[37.72397969191706,47.16439308156757],[37.71042195832301,47.15858258486256],[37.69621860553427,47.15858258486256],[37.68136963355083,47.14696164006479],[37.68120748764205,47.14663734023848],[37.59765024233203,47.14566668950419],[37.59706103733718,47.16803047231103]]
					,
					[[37.6,47.16],[37.54,47.15],[37.62,47.155],[37.6,47.16]]
				]
			]
		},
		src: './examples/img/QuickLookImage1.jpg'
	},
	{	
		anchorsLatLngs: [[56.344192, 136.59558], [55.613245, 136.59558], [55.613245, 137.8782], [56.344192, 137.8782]],// bl, tl, tr, br
		// anchorsLatLngs: [[56.344192, 136.59558], [56.344192, 137.8782], [55.613245, 137.8782], [55.613245, 136.59558]],// bl, br, tr, tl
		clipGeoJSON: {
			type: "Polygon",
			coordinates: [
				[[136.90579, 56.301281],[137.83902, 56.150009],[137.53169, 55.639533],[136.60979, 55.788635]]
				// top-left, top-right, bottom-right, bottom-left
			]
		},
		src: './examples/img/image.jpg'
	}
];

export default {
	start: async (node) => {
		let scr = await Utils.loadScript(libPrefix + 'geomixer-src.js');
if(!scr) {
console.log('scr', scr);
	libPrefix = '/geomixer/';
	await Utils.loadScript(libPrefix + 'geomixer-src.js');
}
		Utils.loadCss(libPrefix + 'geomixer.css');
		// await Utils.loadScript('./src/L.ImageTransform.js');
		await Utils.loadScript('./src/L.ImageTransformWebGL.js');

		let current = quickLooks[1];
		let map = new L.Map(node, {
			center: [0, 0],
			zoom: 5
		}).fitBounds(L.latLngBounds(current.anchorsLatLngs));
window._map = map;
		var layersControl = L.control.layers({
			Google: L.tileLayer('//mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}').addTo(map),
			Map: L.tileLayer.Mercator('//vec03.maps.yandex.net/tiles?l=map&v=17.09.21-1&x={x}&y={y}&z={z}&scale=1&lang=ru_RU', {
				maxZoom: 21,
				maxNativeZoom: 17
			})
		}, {}, {position: 'topleft'}).addTo(map);
        var anchors = current.anchorsLatLngs;//[[64.8642400998, 178.7777782685], [64.8894183647, 182], [63.9034647463, 182], [63.8815237086, 178.9261665166]];
        var clipCoords = null;
        // var image = L.imageTransform('img/proxy.jpg', anchors, { opacity: 0.5, disableSetClip: true }).addTo(map);
        // var image = L.imageTransform('data/image.jpg', anchors, { opacity: 0.5, disableSetClip: true }).addTo(map);
        var externalPolygon = L.polygon(anchors, {fill: false}).addTo(map);
		var image = L.imageTransformWebGL('/data/image.jpg', anchors, { opacity: 0.5, clip: current.clipGeoJSON, disableSetClip: false })
			.addTo(map);

		// map


		// return await fetch(prefix + `Layer/GetLayerJson.ashx?WrapStyle=None&LayerName=${layerId}`).then(resp => resp.json())
		// return await Utils.postJson({pars: {LayerName}, cmd: 'GetLayerJson', ext: '.ashx', path: 'Layer'});
		// if (!data) {
		// 	Utils.notification.view(`Заданный слой не найден: <b>${LayerName}</b>`, 'error');
		// 	return;
		// }
			// .then(res => {
			// 	if (res.Status !== 'ok') return null;
			// 	return res.Result;
			// 	// const identityField = res.Result.properties.identityField;
			// 	// const url = prefix + `VectorLayer/Search.ashx?WrapStyle=None&layer=${layerId}&orderdirection=DESC&orderby=${identityField}`;
			// 	// return fetch(url).then(resp => resp.json())
			// 		// .then(res => {
			// 			// if (res.Status === 'ok') {
			// 				// const fields = res.Result.fields;
			// 				// return {
			// 					// identityField,
			// 					// values: res.Result.values.map(it => it.reduce((a, v, i) => { a[fields[i]] = v; return a; }, {}))
			// 				// }
			// 			// }
			// 		// });
			// });
	},
	search: async (layerId, query, identityField) => {
		if (!identityField) {
			const layer = await Utils.getLayerProps(layerId);
			console.log(layer);
			if (layer) identityField = layer.properties.identityField;
		};
		let url = prefix + `VectorLayer/Search.ashx?WrapStyle=None&layer=${layerId}&orderdirection=DESC&orderby=${identityField}&geometry=true`;
		if (query) url += '&query=' + query;
		const res = await fetch(url).then(resp => resp.json());
		// const res = resp.json();
			// .then(res => {
		if (res.Status !== 'ok') return null;
		const fields = res.Result.fields;
		return {
			identityField,
			values: res.Result.values.map(it => it.reduce((a, v, i) => { a[fields[i]] = v; return a; }, {}))
		};
		// return Promise.resolve({
			// identityField,
			// values: res.Result.values.map(it => it.reduce((a, v, i) => { a[fields[i]] = v; return a; }, {}))
		// });
				// }
			// });
		// return data;
	},
	modifyObject: (layerId, data) => {
		console.log(layerId);
		console.log(data);
        const fd = new FormData();
        fd.append('WrapStyle', 'None');
        fd.append('LayerName', layerId);
        fd.append('objects', JSON.stringify(data));
		return fetch(prefix + 'VectorLayer/ModifyVectorObjects.ashx', {
			method: 'POST', mode: 'cors', credentials: 'include', body: fd
		}).then(resp => resp.json());
	},
	rgbToHex: (rgb) => '#' + [rgb.r, rgb.g, rgb.b].map(x => x.toString(16).padStart(2, '0')).join(''),
	hexToRgb: hex => hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i
		 ,(m, r, g, b) => '#' + r + r + g + g + b + b)
		.substring(1).match(/.{2}/g)
		.map(x => parseInt(x, 16))
};
