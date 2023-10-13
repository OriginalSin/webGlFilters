import { writable } from 'svelte/store';
// import Utils, {prefix} from './Utils.js';

const sUrl = 'VectorLayer/Search.ashx';
const options = {mode: "cors", credentials: "include"};
const serverBasedPrefix = self.serverBase || 'https://maps.kosmosnimki.ru/';
export const _select = writable(null);

export const _userInfo = writable({}, async () => {
	const res = await fetch(serverBasedPrefix + 'User/GetUserInfo.ashx', options);
	_userInfo.set(res?.Result);
});

const keys = {
	_nnetworks: writable([]),
	_raster_legends: writable([]),
	_raster_catalog: writable([]),
	_classification_log: writable([]),
	_classification_tasks: writable([]),
	_training_log: writable([]),
	_nnetwork_category: writable([]),
	_nnetwork_type: writable([]),
	_proba_catalog: writable([])
};

export const _nnetworks = keys._nnetworks;
export const _raster_legends = keys._raster_legends;
export const _raster_catalog = keys._raster_catalog;
export const _classification_log = keys._classification_log;
export const _classification_tasks = keys._classification_tasks;
export const _training_log = keys._training_log;
export const _nnetwork_category = keys._nnetwork_category;
export const _nnetwork_type = keys._nnetwork_type;
export const _proba_catalog = keys._proba_catalog;

const parseRes = (res) => {
	if (res.Status !== 'ok') return [];
	const fields = res.Result.fields;
	return res.Result.values.map(it => it.reduce((a, v, i) => { a[fields[i]] = v; return a; }, {}))
};
const parseLegRes = (res) => {
	if (res.Status !== 'ok') return [];
	const fields = res.Result.fields;
	return res.Result.values.map(it => it.reduce((a, v, i) => {
		let key = fields[i];
		if (key === 'parameters') {
			let item = JSON.parse(v);
			const arr = item.colors.map(c => Utils.rgbToHex(c.rgb));
			a.rgbResult = arr.length > 1 ? 'linear-gradient(90deg, ' + arr.join(',') + ')' : arr[0];
		}
		a[key] = v;
		return a;
	}, {}))
};

export const getDictionary = (names = []) => {
	names.forEach((it = {}) => {
		const key = it.key;
        const fd = new FormData();
        fd.append('WrapStyle', 'None');
		['layer', 'query', 'orderby', 'orderdirection'].forEach(k => { if (it[k]) fd.append(k, it[k]); });
		fetch(sUrl, { ...options, method: 'POST', body: fd }).then(res => res.json())
			.then(data => keys[key].update(() => key === '_raster_legends' ? parseLegRes(data) : parseRes(data)))
			.catch(err => {console.error('Error:', err);});
	});
}
