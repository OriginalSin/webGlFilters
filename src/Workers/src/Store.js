import { writable, get } from 'svelte/store';
import FetchUtils from  './FetchUtils.js'
// import Utils from './Utils';

const _observers = {
	layersByID: {
		// id: LayerID || MulLayerID {
			// GetLayerInfo: {}
			// search: {}
		// }
	}
};
// layersByID

export const _hosts = writable({});
export const _mapPos = writable();
export const _layers = writable({});

export const getStoreKeys = (type = 'search') => {
	return Object.entries(_observers.layersByID).map(arr => {
		return {id: arr[0], data: get(arr[1][type])};
	});
}

export const getStore = (LayerID, type = 'GetLayerInfo') => {
	let _layersByID = _observers.layersByID[LayerID];
	return _layersByID && _layersByID[type];
}

export const getStoreData = (LayerID, type = 'GetLayerInfo') => {
	let _layersByID = _observers.layersByID[LayerID];
	return _layersByID && get(_layersByID[type]);
}
export const reCheckScreen = (mapPos) => {
	Object.keys(_observers.layersByID).forEach(async lLayerID => {
		let _layersByID = _observers.layersByID[lLayerID];
		let {search, GetLayerInfo, icons} = _layersByID;
		if (search && GetLayerInfo) {
			let info = get(GetLayerInfo);
			let data = get(search);
			if (!icons) {
				// let st = await _getIcons(dataSource.styles);
			}
			if (info) {
				const {LayerID, query = '', columns = '', icons, styles} = info._gmx;
				if (LayerID && (!data || data.query !== query)) {
				// const pars = {query, columns, layer: LayerID, geometry: true,  crs:''};
					const pars = {query, layer: LayerID, geometry: true,  crs:''};
					let res = await FetchUtils.search(pars, true);
					if (res) {
						FetchUtils.parseSearchRes(res, styles);
						search.set({query: query, ...res});
					}
				}
			}

// console.log('reCheckScreen ', lLayerID, data, mapPos, info, icons);
		}
		// let _sItem = _layersByID && _layersByID[key] || writable();
	});
}

const updateInfo = (id, attr = {}) => {
	const {query = '', LayerID, styles} = attr;
	let _info = getStore(id);
	let info = get(_info);
	const {_gmx} = info;
	if (query !== _gmx.query) {
		_gmx.query = query;
		_info.set(info);
// console.log('updateInfo ', query, info);
	}
	return _gmx;
}

const getDictionaryItem = (attr = {}) => {
	let {key, storeItem, id, dataSource} = attr;
	return new Promise(resolve => {
		switch(key) {
			case 'search':
				if (dataSource) {
					const {query = '', LayerID, dataSourceMap, styles} = dataSource;
					const pars = {query, layer: LayerID, geometry: true};
					FetchUtils.search(pars, true)
						.then(data => {
							let _gmx = updateInfo(id, dataSource);
// console.log('styles ', dataSource);
							FetchUtils.parseSearchRes(data, _gmx.styles);
							storeItem.set({query, ...data});
							resolve(data);
						});
				}
				break;
			case 'GetLayerInfo':
				FetchUtils.getJson({pars: {LayerName: id}, cmd: 'GetLayerInfo', path:'Layer',  ext:'.ashx'})
					.then(async data => {
// console.log('GetLayerInfo ', id);
						data = await FetchUtils.parseLayerInfo(data, dataSource);
						storeItem.update(() => data);
						resolve(data);
					});
				break;
			default:
				resolve();
				break;
		}
	});
}

const getDictionaryItemAttr = (it) => {
	let out = {};
	let {key, id, dataSource, refresh} = it;
	// let LayerID = it.id;
	if (!_observers.layersByID[id]) _observers.layersByID[id] = {};
	let _layersByID = _observers.layersByID[id];
	let storeItem = _layersByID[key] || writable();
	if (!_layersByID[key]) _layersByID[key] = storeItem;
	out[id] = out[id] || {};
	out[id][key] = storeItem;
	return {attr: {key, storeItem, id, dataSource}, out};
}

export const getDictionary = async (arr = []) => {
	if (!Array.isArray(arr)) arr = [arr];
	let out = {};
	let it = arr.shift();
	do {
		let pt = getDictionaryItemAttr(it);
		await getDictionaryItem(pt.attr);
		let h = pt.out;
		out = {...out, ...h};
		it = arr.shift();
	} while (it);
console.log('pData 1`', out);
	return Promise.resolve(out);
/*

	let pData;
	let pt = getDictionaryItemAttr(arr.shift());
	pData = await getDictionaryItem(pt.attr);
	let h = pt.out;
	out = {...out, ...h};
console.log('pData ', pt);

	pt = getDictionaryItemAttr(arr.shift());
	pData = await getDictionaryItem(pt.attr);
	h = pt.out;
	out = {...out, ...h};
	// out = {...out, pt.out};
console.log('pData 1`', pt);
return Promise.resolve(out);

	arr.forEach(async it => {
		let {key, id, dataSource, refresh} = it;
		// let LayerID = it.id;
		if (!_observers.layersByID[id]) _observers.layersByID[id] = {};
		let _layersByID = _observers.layersByID[id];
		let _sItem = _layersByID[key] || writable();
		if (!_layersByID[key]) _layersByID[key] = _sItem;
		out[id] = out[id] || {};
		out[id][key] = _sItem;
		// let refresh = it.refresh;
		
console.log('pData ', key);
		pData = await getDictionaryItem({key, storeItem: _sItem, id, dataSource});
console.log('pData ', pData);

	});
	return out;
*/
}
