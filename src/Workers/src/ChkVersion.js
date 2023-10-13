import {_hosts, _mapPos, getDictionary, reCheckScreen, getStoreData, getStoreKeys} from './Store';
import { tick } from 'svelte';
// import { writable, get } from 'svelte/store';
import FetchUtils from  './FetchUtils.js'

const HOSTNAME = 'maps.kosmosnimki.ru';
let hosts = {},
	mapPos,
    zoom = -1,
    zoom_prev = null,
    bboxes_prev = null,
    bboxes = null;

	// hover = {},
	// dateInterval = {},
	// _ctxLabels,
	// mapSize,
	// pOrigin,
	// pBounds,

	// topLeftMerc,
    // bboxBounds = null;
	// dataManagersLinks = {},
    // hostBusy = {},
    // needReq = {}

let wrap = (v, p, t) => v > p ? v - t : (v < -p ? v + t : v)
_mapPos.subscribe(value => {
	mapPos = value;
	if (mapPos) {
		zoom = mapPos.zoom;
		let w2 = FetchUtils.W2;
		let ww = 2 * w2;
		
		const bottom = mapPos.bottom < -w2 ? -w2 : mapPos.bottom;
		const top = mapPos.top > w2 ? w2 : mapPos.top;

		let ws = mapPos.right - mapPos.left, ws2 = ws / 2, c = mapPos.center.x % ww;
		c = wrap(c, w2, ww);
		// c = c > w2 ? c - ww : (c < -w2 ? c + ww : c);
		// if (c > w2) c -= ww;
		// else if (c < -w2) c += ww;
		// let l = (c - ws2) % ww, r = (c + ws2) % ww;
		// l = wrap(l, w2, ww);
		// r = wrap(r, w2, ww);
		if (ws > ww) {
			bboxes = `[[${-w2},${bottom},${w2},${top}]]`;
		// } else if (
			// (l < -w2 && r < w2) ||
			// (l > -w2 && r > w2)) {		// todo
			// bboxes = `[[${-w2},${mapPos.bottom},${r},${mapPos.top}], [${l},${mapPos.bottom},${w2},${mapPos.top}]]`;
		} else {
			let l = (c - ws2), r = (c + ws2);
			if (r > w2 || l < -w2) {
				if (l < -w2) l = ww + l;
				if (r > w2) r = r - ww;
				bboxes = `[[${-w2},${bottom},${r},${top}],[${l},${bottom},${w2},${top}]]`;
				
			} else {
			// if (l < -w2) l = ww + l;
			// if (r > w2) r = r - ww;
			// if ((l < 0 && r < w2) || (l > 0 && r > 0)) {
			// if (Math.sign(l) === Math.sign(r)) {
				bboxes = `[[${l},${bottom},${r},${top}]]`;
			}
			// else {
				// bboxes = `[
					// [${-w2},${mapPos.bottom},${r},${mapPos.top}],
					// [${l},${mapPos.bottom},${w2},${mapPos.top}]
				// ]`;
			// }
			// bboxes = `[[${l},${mapPos.bottom},${r},${mapPos.top}]]`;
		}
		// bboxes = `[[${mapPos.left},${mapPos.bottom},${mapPos.right},${mapPos.top}]]`;
		// mapPos.bounds = FetchUtils.bounds([mapPos.left , mapPos.bottom,  mapPos.right, mapPos.top]);

		restartCheckVer();
	}
	console.log('mapPos', bboxes); // logs 0
});

const addLayer = async (data, id) => {
	const {LayerID, hostName = HOSTNAME} = data;
	const host = hosts[hostName] || {};
	if (!host[LayerID]) {
		const res = await FetchUtils.getJson({pars: {LayerName: LayerID}, cmd: 'GetLayerInfo', path:'Layer',  ext:'.ashx'});
		host[LayerID] = await FetchUtils.parseLayerInfo(res, data);
		hosts[hostName] = host;
		_hosts.set(hosts);
	}
	restartCheckVer();
	
// console.log('addLayer:', id, hosts, data);
};

const removeLayer = (id, hostName = HOSTNAME) => {
	let host = hosts[hostName] || {};
	delete host[id];
	hosts[hostName] = host;
	_hosts.set(hosts);
// console.log('removeLayer:', hosts);
};

let intervalID = null,
	// delay = 10000,
    delay = 60000,
    timeoutID = null;

const utils = {
	now: function(msec = 0) {
		if (timeoutID) { clearTimeout(timeoutID); }
		timeoutID = setTimeout(chkVersion, msec);
    },

    stop: function() {
		// console.log('stop:', intervalID, delay);
        if (intervalID) { clearInterval(intervalID); }
        intervalID = null;
    },

    start: function(msec) {
		// console.log('start:', intervalID, msec);
        if (msec) { delay = msec; }
        utils.stop();
        intervalID = setInterval(chkVersion, delay);
    },
};
const restartCheckVer = () => {
	if (!intervalID) { utils.start(); }
	utils.now();
};

const parTileSender = {
	key: '',
	ModeKey: 'tile',
	ftc: 'osm',
	r: 'j',
	srs: 3857,
	sw: 1,
};

const parseTile = (items, tkey, hostName) => {
	if (items) {
		let host = hosts[hostName] || {};
		let {LayerName, isGeneralized, bbox, values} = items;
		items.boundsData = FetchUtils.bounds(bbox);
		items.tkey = tkey;
		let layer = host[LayerName];
	if (!layer) return;
		let {_gmx, tt} = layer;
		let {styles, indexes} = _gmx;
		
		let len = values.length;
		let slen = styles.length;
		
		let rKeys = ['angle', 'speed'];
		let lenItem = rKeys.length + 3;	// + sn, x,y
		let points = new Float32Array(len * lenItem);
		let gInd = indexes.geomixergeojson;
		let idInd = indexes.gmx_id;
		let badCnt = 0, skipCnt = 0, cnt = 0, w2 = FetchUtils.W2;
		values.forEach((it, i) => {
			let gmx_id = it[idInd];
			let geo = it[gInd];
			if (!geo) {
				badCnt++;
				return;
			}
			let pInd = cnt * lenItem;
			if (geo.type === 'POINT') {
				let [x, y] = geo.coordinates;
				if (Math.abs(x) > w2 || Math.abs(y) > w2) {
					badCnt++;
					return;
				}
				points[pInd + 1] = x;
				points[pInd + 2] = y;
				points[pInd] = -1;
			}
			for (let si = 0; si < slen; si++) {
				const st = styles[si];
				const stn = st._pFilter ? st._pFilter.filterFun(it, indexes) : true;
				if (stn) {
					points[pInd] = si; break;
				}
			}
			if (points[pInd] === -1) skipCnt++;
			// points[pInd + 3] = Number(it[indexes.angle]);
			points[pInd + 3] = Number(it[indexes.angle] * Math.PI / 180);
			points[pInd + 4] = it[indexes.speed];
			cnt++;
		});
		
		items.points = points.slice(0, lenItem * cnt);
		items.lenItem = lenItem;
// console.log('bounds', cnt, badCnt, skipCnt, items);

		let tileItems = layer.tileItems || {};
		if (!layer.tileItems) layer.tileItems = tileItems;
		tileItems[tkey] = items;
	// await tick();
	// _hosts.set(hosts);

	}
};

const getTileKeys = (tiles, tilesOrder, LayerName) => {
	const out = {};
	const lent = tilesOrder.length;
	for (let i = 0, len = tiles.length; i < len; i+=lent) {
		let arr1 = [];
		const tHash = tilesOrder.reduce((p, c, j) => {
			if (c === 'Z' || c === 'X' || c === 'Y' || c === 'V') c = c.toLowerCase();
			let v = tiles[i + j];
			p[c] = v;
			arr1.push(v);
			return p;
		}, {...parTileSender, LayerName});
		let tkey = arr1.join('_');
		out[tkey] = tHash;
	}
	return out;
};

const parseProperties = (props, _gmx) => {
	_gmx.props = props;
	_gmx.Version = props.LayerVersion;
	_gmx.indexes = props.attributes.reduce((a, c, i) => { a[c] = i + 1; return a; }, {});
	if (!('geomixergeojson' in _gmx.indexes)) _gmx.indexes.geomixergeojson = props.attributes.length + 1;
	if (!('gmx_id' in _gmx.indexes)) _gmx.indexes.gmx_id = 0;
};

const parseVersion = (arr, hostName) => {
	const host = hosts[hostName] || {};
	let posFlag = false;
	if (zoom_prev !== zoom || bboxes_prev !== bboxes) {
		zoom_prev = zoom;
		bboxes_prev = bboxes;
		posFlag = true;
	}
	arr.forEach(async it => {
		const {properties, tiles, tilesOrder, name} = it;
		const layer = host[name];
		if (properties) parseProperties(properties, layer._gmx);
		const tileItems = layer.tileItems || {};
		const tKeys = getTileKeys(tiles, tilesOrder, name);
// console.log('tt ', tKeys, tileItems);
		for (let tkey in tileItems) if (!tKeys[tkey]) delete tileItems[tkey];
		const tkeyArr = Object.keys(tKeys).filter(k => !tileItems[k]);
		const promArr = tkeyArr.map(k => {
		// Object.entries(tKeys).filter(it =>).forEach(([tkey, pars] = arr) => {
			// if (!tileItems[tkey]) {
				// tkeyArr.push(tkey);
				const pars = tKeys[k];
				return FetchUtils.getJson({
					pars,
					jsonp: true, cmd: 'TileSender', path: '', ext: '.ashx'
				});
			// }
		});
		layer._defer = !!promArr.length;
console.log('parseVersion ', promArr.length, layer._defer, layer._refresh);
		Promise.all(promArr).then(arr => {
			arr.forEach((it, i) => parseTile(it, tkeyArr[i], hostName));
	layer._defer = false;

			if (posFlag || layer._refresh || arr.length) _hosts.set({...hosts});

		});
		// for (let tkey in tKeys) {
			// const pars = tKeys[tkey];
			// if (!tileItems[tkey]) {
				// parseTile(await FetchUtils.getJson({
					// pars,
					// jsonp: true, cmd: 'TileSender', path: '', ext: '.ashx'
				// }), tkey, hostName);
			// }
		// }
	});
	// _hosts.set(hosts);
// console.log('parseRes ', hosts);
};

const chkVersion = async () => {
	for (const hostName in hosts) {
		const pars = {
			layers: JSON.stringify(Object.entries(hosts[hostName]).map(([Name, p]) => {
				p._refresh = false;
				const {Version = -1, dateBegin, dateEnd} = p._gmx;
				const reqStr = JSON.stringify({Version, dateBegin, dateEnd});
				if (p._ChkVersion_reqStr !== reqStr) {
					p._ChkVersion_reqStr = reqStr;
					p._refresh = true;
				}
// console.log('chkVersion ', p._refresh);
				return {Name, Version, dateBegin, dateEnd};
			})),
			ftc: 'osm', srs: '3857', zoom, bboxes
		};
		parseVersion(await FetchUtils.postJson({
			pars,
			cmd: 'CheckVersion', path: 'Layer', ext: '.ashx'
		}), hostName);
	}
};
const setDateInterval = (data) => {
	const {LayerID, dateBegin, dateEnd, hostName = HOSTNAME} = data;
	const host = hosts[hostName];
	const layer = host[LayerID];
	layer._defer = true;
	layer._tileCache = {};
console.log('setDateInterval ', layer._tileCache);
	layer._gmx = {...layer._gmx, dateBegin, dateEnd};
	utils.now(150);
};

export default {
	addLayer,
	removeLayer,
	setDateInterval,
	// restartCheckVer,
	now: utils.now,
	stop: utils.stop,
	// zoom,
	// setBbox,
	// getBound,
	// getZoom,
	// setDateIntervals,
};