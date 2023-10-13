// import WorkerGL from './webgl/WorkerGL?sharedworker';
import {_hosts, _mapPos, getDictionary, reCheckScreen, getStoreData, getStoreKeys} from './Store';
import FetchUtils from  './FetchUtils.js'
import Utils from './Utils';
// import Requests from './Requests';
import ChkVersion from './ChkVersion';
// import TilesLoader from './TilesLoader';
import Renderer2d from './Renderer2d';
// import Observer from './Observer';
// const workerGL = new SharedWorker(new URL('./webgl/WorkerGL.js', import.meta.url))
// const workerGL = new WorkerGL();

// console.log('WorkerGL', workerGL);
let sharedWorkers = {
};
const CACHE_CLEAR = true;
/**/
let mapAttr, hosts;

let observers = {
};
		// workerGL.postMessage({...observers});

let deferTiles = [
];
const _checkDeferTiles = () => {
console.log('_checkDeferTiles', deferTiles, deferTiles.length);
	deferTiles = deferTiles.filter(it => {
		const {cmd, cmdNum, LayerID, zKey, wrapKey, hostName = FetchUtils.HOST} = it;
		if (!hosts[hostName] || !hosts[hostName][LayerID]) return true;
		const layer = hosts[hostName][LayerID];
		const {icons, styles} = layer._gmx;
		if (!icons || !styles || layer._defer) return true;
		// if (!icons || !styles || !layer.tileItems || layer._defer) return true;
// console.log('_checkDeferTiles', it, layer);
		let _tileCache = layer._tileCache || {};
		// let _tileCache = _tileCache[wrapKey];
		if (!layer._tileCache) {
			_tileCache = {};
			layer._tileCache = _tileCache;
		}
		let bitmap = _tileCache[wrapKey];
		if (!bitmap) bitmap = _getTileBitmap(it);
		let out = {from: {cmd, cmdNum}};
		out.bitmap = bitmap;
		it.resolve(out);

		// if (it.resolver) {
			// it.resolver();
		// }
		return false;
	})
}
const _checkTileCache = (z) => {
	for (let hostName in hosts) {
		for (let LayerID in hosts[hostName]) {
			const layer = hosts[hostName][LayerID];
			let _tileCache = layer._tileCache || {};
			for (let wrapKey in _tileCache) {
				if (wrapKey.split(':').pop() != z) delete _tileCache[wrapKey];
// console.log('_checkTileCache', wrapKey, z);
			}
		}
	}
}

_mapPos.subscribe(value => {
	mapAttr = value;
	if (mapAttr && mapAttr.zoom) {
		_checkTileCache(mapAttr.zoom);
	}
	// console.log('mapAttr', value); // положение карты изменилось
	// reCheckScreen(value);
});

// _hosts.subscribe(value => hosts = value);
_hosts.subscribe(value => {
	hosts = value;
	_checkDeferTiles();
	console.log('hosts', value); // положение карты изменилось
});
// let _getLayerInfoHash = getDictionary([
	// { id: '3D41831BFD4B4D7999AD43DD74780919', key: 'GetLayerInfo', refresh: true },
	// { id: '27802D41BE314A15A96EDAC696A86BE0', key: 'GetLayerInfo',  },
	// { id: 'E2303B7ABE25474DB8B0A70373886AEA', key: 'GetLayerInfo',  },

// ]);

  // console.log('logs arr', _getLayerInfoHash); // logs 0
  
// let hosts = {},
let	hover = {},
    // zoom = -1,
	// dateInterval = {},
    // bbox = null,
mapSize,
	_ctxLabels;
	// dataManagersLinks = {},
    // hostBusy = {},
    // needReq = {}
	


const _getIcons = (styles) => {
	let st = [];
	return Promise.all(styles.map(it => {
		let filter = it.Filter;
		let RenderStyle = it.RenderStyle;
		let iconAngle = RenderStyle.iconAngle;
		let iconUrl = RenderStyle.iconUrl;
		st.push({filter, iconAngle, iconUrl});
		return fetch(iconUrl).then(resp => resp.blob());
	})).then(icons => {
		icons.forEach((it, i) => {
			st[i].blob = it;
		});
// console.log('icons', icons, st);
		return Promise.resolve(st);

		// return st;
	});
};

const observer = async (data) => {
	const {cmd, cmdNum, id, dataSource, remove} = data;
	const out = {from: {cmd, cmdNum}};
	if (id) {
		if (dataSource) ChkVersion.addLayer(dataSource, id);
		else ChkVersion.removeLayer(id);
console.log('observer', id, data, ChkVersion);
		// let _hash = await getDictionary([
			// { id, key: 'GetLayerInfo', dataSource },
			// { id, key: 'search', dataSource, remove: data.remove }
		// ]);
		// observers = {...observers, ..._hash};
// console.log('observer', id, observers, data);

	}
	return Promise.resolve(out);
};

const moveend = async (data) => {
	const {cmd, cmdNum, mapPos} = data;
	const out = {from: {cmd, cmdNum}};
// console.log('moveend', data);
	if (mapPos) {
		const h2 = Math.pow(2, mapPos.zoom + 7);
		const mInPixel = 2 * h2 / Utils.WORLDWIDTHFULL;
		const size = mapPos.size;
		const mw = size.x / mInPixel / 2, mh = size.y / mInPixel / 2;
		const center = mapPos.center;
		const left = center.x - mw, right = center.x + mw;
		const top = center.y + mh, bottom = center.y - mh;
		const matrix = new DOMMatrix([mInPixel, 0, 0, mInPixel, h2 - left, h2 - top]);

		_mapPos.set({
			...mapPos,
			left, right, top, bottom,
			mInPixel,
			matrix: new DOMMatrix([mInPixel, 0, 0, mInPixel, h2 - left, h2 - top])
		});
	}
	return Promise.resolve(out);
};

const drawScreen = async (data) => {
	const {cmd, cmdNum, id, dataSource = {}} = data;
	let out = {from: {cmd, cmdNum}};
// console.log('drawScreen', id, dataSource);
	if (id && dataSource) {
		const info = getStoreData(id);
		const search = getStoreData(id, 'search');
		if (search && search.query !== dataSource.query) {
			let _hash = await getDictionary([
				{ id, key: 'search', dataSource, remove: data.remove }
			]);
			return Promise.resolve(out);
		}

		if (search && info) {
			let res = Renderer2d.drawPoins({search, mapAttr, info});
			out = {...out, ...res};
		}
// if (search && info) console.log('drawScreen', id, data, search , info, out.bitmap);
	}
	return Promise.resolve(out);
};

const mousemove = async (data) => {
	const {cmd, cmdNum, pos, zoom} = data;
	const out = {from: {cmd, cmdNum}};
	const mInPixel = Math.pow(2, zoom + 8) / Utils.WORLDWIDTHFULL;
	const w = 20 / mInPixel;
// if (sharedWorkers.w1) sharedWorkers.w1.postMessage({mInPixel});
// console.log('mousemove ', sharedWorkers.w1, data);

// console.time("answer time");
	const arr = getStoreKeys();
	for (let i = 0, len = arr.length; i < len; i++) {
		let it = arr[i].data;
		if (it) {
			let {points, lenItem} = it;
			for (let j = 0, len = points.length; j < len; j+=lenItem) {
				if (points[j] !== -1) {
					let x = points[j + 1], y = points[j + 2];
					if (Math.abs(pos.x - x) < w && Math.abs(pos.y - y) < w) {
						let pt = it.values[j / lenItem];
						// out.pos = pos;
						// out.item = pt;
						out.gmx_id = pt[it.indexes.gmx_id];
						return Promise.resolve(out);
					}
				}
			}
		}
	}
// console.timeEnd("answer time");
// console.log('mousemove', pos, arr);
	return Promise.resolve(out);
};

const _checkDeferedTiles__ = (layer) => {
	// const {cmd, cmdNum, LayerID, wrapKey, hostName = FetchUtils.HOST} = tile;
	// let out = {from: {cmd, cmdNum}};
	// const host = hosts[hostName] || {};
	// const layer = host[LayerID] || {};
	if (layer) {
		Object.values(layer._deferTiles).forEach(it => {
			if (it.resolver) {
				it.resolver();
			}
		}) ;
	}
};


const tileunload = (tile) => {
	const {cmd, cmdNum, LayerID, zKey, wrapKey, hostName = FetchUtils.HOST} = tile;
	let out = {from: {cmd, cmdNum}};
	deferTiles = deferTiles.filter(it => {
		if (it.LayerID === LayerID && it.zKey === zKey) {
			return false;
		}
		return true;
	});
	const host = hosts[hostName] || {};
	const layer = host[LayerID];
	// if (CACHE_CLEAR) {
		// for (let k in layer._tileCache) {
			// if (k === wrapKey) delete layer._tileCache[k];
		// }
	// }
// console.log('tileunload', Object.keys(layer._tileCache).length,  LayerID, deferTiles, tile, layer);
	return Promise.resolve(out);
}

const _getTileBitmap = (tile) => {
	const {cmd, cmdNum, LayerID, zKey, wrapKey, hostName = FetchUtils.HOST} = tile;
	let out = {from: {cmd, cmdNum}};
	const host = hosts[hostName] || {};
	const layer = host[LayerID];
// console.log('drawTile', LayerID, deferTiles, tile, layer);
	tile.bounds = FetchUtils.bounds(tile.tbounds);
	const attr = {
		tile: tile,
		mapAttr: mapAttr,
		layer: layer
	};
	let _tileCache = layer._tileCache || {};
	if (!layer._tileCache) {
		_tileCache = {};
		layer._tileCache = _tileCache;
	}
	if (tile.repaintFlag) delete _tileCache[wrapKey];
	const bitmap = _tileCache[wrapKey] || Renderer2d.drawPoins(attr);
	_tileCache[wrapKey] = bitmap;

	return bitmap;
			// out.bitmap = _deferTile.bitmap;
			// _deferTile.out = out;
			// _deferTile.resolver = () => {
				// resolve(out);
			// };
	// tile.resolve(out);
}

const drawTile = async (tile) => {
	const {cmd, cmdNum, LayerID, zKey, wrapKey, hostName = FetchUtils.HOST} = tile;
	let out = {from: {cmd, cmdNum}};
	const host = hosts[hostName] || {};
	const layer = host[LayerID];
// console.log('drawTile1', zKey, mapAttr.zoom);

	return new Promise(resolve => {
		if (!layer || layer._defer) {
			tile.resolve = resolve;
			deferTiles.push(tile);
			return;
		}

// console.log('drawTile1', LayerID, deferTiles, tile, layer);
		out.bitmap = _getTileBitmap(tile);
		resolve(out);
// s[zKey] = _deferTile;

	});
};
const sharedWorker = async (data) => {
	const {cmd, cmdNum, name, port} = data;
	sharedWorkers[name] = port;
	port.start();
	let out = {from: {cmd, cmdNum}};
	return Promise.resolve(out);
};

export default {
	sharedWorker,
	drawTile,
	tileunload,
	mousemove,
	moveend,
	observer,
	drawScreen,
	setDateInterval: ChkVersion.setDateInterval,

	// sortLayersData,
	// setHover,
	// drawItem,
	// drawLabels
};