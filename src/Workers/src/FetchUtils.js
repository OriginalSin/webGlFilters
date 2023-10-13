// import { parse } from 'svg-parser';
const HOST = 'maps.kosmosnimki.ru';

const WORLDWIDTHFULL = 40075016.685578496,
    W2 = WORLDWIDTHFULL / 2;
const KB = 1024;
const TILE_PREFIX = 'gmxAPI._vectorTileReceiver(';
const CONF = {
	prefix: 'https://maps.kosmosnimki.ru/',
	options: {mode: 'cors', credentials: 'include'},
	contenttypes: {
		json: 'application/json',
		form: 'application/x-www-form-urlencoded',
		formData: 'multipart/form-data',
	},
	max_upload_size: 500 * KB * KB
};

const _getIcons1 = (styles) => {
	return Promise.all(styles.map(it => {
		return fetch(it.RenderStyle.iconUrl).then(resp => resp.blob());
	})).then(icons => Promise.resolve(icons));
	// })).then(icons => {
// console.log('icons', icons);
		// return Promise.resolve(icons);
	// });
};

const _parseFilter = (str) => {
	let body = true;
	let test = false;
	if (str) {
		body = str.replace(/[[\]]/g, '"')
			.replace(/"(.+?)" in \((.+?)\)/g, '[$2].includes(props[indexes[\'$1\']])')
			.replace(/"(.+?)"/g, 'props[indexes[\'$1\']]')
			.replace(/([^><])=([^><])/g, '$1 === $2')
			.replace(/! ===/g, '!==')
			.replace(/<>/g, ' !== ')

			.replace(/\bAND\b/ig, '&&')
			.replace(/\bOR\b/ig, '||')
			.replace(/(floor\()/ig, 'Math.$1')
			.replace(/ CONTAINS \'(.+?)\'/ig, '.indexOf(\'$1\') !== -1')
			;
		// test = new Function('props', 'indexes', 'return ' + body + ';');
		// console.log('test', test);
	}
// console.log('__', str, '__', body);

	return {
		filter: str,
		filterParsed: body,
		filterFun: new Function('props', 'indexes', 'return ' + body + ';')
	};
};

const reg = /<(?=rect|polygon)([^>]+)>/g;
const regC = /{fill:([^;]+);}/;
const regWH = /width="(\d+)" height="(\d+)"/;
const regRect = /x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)"/;
const regPoints = /points="([^"]+)"/;

const _getIcons = (styles) => {
	let w = 20, h = 20;
	// let st = [];
	return Promise.all(styles.map((it, nm) => {
		it._pFilter = _parseFilter(it.Filter);
const url = it.RenderStyle.iconUrl.replace('//kosmosnimki.ru/img/weather/svg-wind-color', '/icons');
		return fetch(url).then(resp => resp.text())
			.then(it => {
				const path = new Path2D();
				if (!it) return {fillColor: 0, w: 0,h: 0, path};
				let arr = it.match(regWH);
				if (arr.length > 2) {
					w = Number(arr[1]), h = Number(arr[2]);
				}
				
				arr = it.match(regC);
				const fillColor = arr && arr.length > 1 ? arr[1] : 0;
				// const canvas = new OffscreenCanvas(w, h);
				// canvas.width = w; canvas.height = h;
				// const ctx = canvas.getContext('2d');
				// ctx.fillStyle = fillColor || 'blue';
				// ctx.globalAlpha = 1;
				// path.fillStyle = fillColor || 'blue';
				path.globalAlpha = 1;
// path.arc(w/2, h/2,w);
// path.rect(w/4, 0, w - w/4, h);
path.rect(0, 0, 5, 5);
// ctx.strokeRect(0, 0, 5, 5);
				it.match(reg).forEach(pt => {
					if (pt.substr(0, 5) === '<rect') {
						arr = pt.match(regRect);
						if (arr.length > 4) {
							let x = Number(arr[1]) - w/2, y = Number(arr[2]) - h/2, ww = Number(arr[3]), hh = Number(arr[4]);
							// ctx.fillRect(x, y, ww, hh);
							path.rect(x, y, ww, hh);
						}
					} else if (pt.substr(0, 5) === '<poly') {
// console.log('icons', nm, pt);
						arr = pt.match(regPoints);
						if (arr.length > 1) {
							// ctx.beginPath();
							arr = arr[1].split(' ');
							for (let i = 0, len = arr.length; i < len; i+=2) {
								let x = Number(arr[i]) - w/2, y = Number(arr[i + 1]) - h/2;
								// if (i) ctx.lineTo(x, y);
								// else ctx.moveTo(x, y);
								if (i) path.lineTo(x, y);
								else path.moveTo(x, y);
							}
							// ctx.closePath();
							// ctx.fill();
						}
					}
				});
				// ctx.fill();
				// return {fillColor, canvas};
				return {fillColor, w,h, path,
				// bounds: Utils.bounds([w, h]).addBuffer(iw2, ih2);

				};
				// return {fillColor, w,h, canvas, path};
				// return {fillColor, canvas: canvas.transferToImageBitmap()};
			})
	})).then(icons => {
// console.log('icons', icons);
		return Promise.resolve(icons);
	});
};

class Bounds {
	constructor(arr) {
		this.min = { x: Number.MAX_VALUE, y: Number.MAX_VALUE };
		this.max = { x: -Number.MAX_VALUE, y: -Number.MAX_VALUE };
		this.extendArray(arr);
	}

	addBuffer(dxmin, dymin, dxmax, dymax) {
		this.min.x -= dxmin;
		this.min.y -= dymin || dxmin;
		this.max.x += dxmax || dxmin;
		this.max.y += dymax || dymin || dxmin;
		return this;
	}
	contains(point, i = 0) { // ([x, y]) -> Boolean
		const min = this.min, max = this.max,
			x = point[i], y = point[i + 1];
		return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
	}
	extend(x, y) {
		if (x < this.min.x) this.min.x = x;
		if (x > this.max.x) this.max.x = x;
		if (y < this.min.y) this.min.y = y;
		if (y > this.max.y) this.max.y = y;
		return this;
	}
	extendBounds(bounds) {
		return this.extendArray([[bounds.min.x, bounds.min.y], [bounds.max.x, bounds.max.y]]);
	}
	extendArray(arr) {
		if (!arr || !arr.length) { return this; }
		let i, len;
		if (typeof arr[0] === 'number') {
			for (i = 0, len = arr.length; i < len; i += 2) {
				this.extend(arr[i], arr[i + 1]);
			}
		} else {
			arr.forEach(it => this.extend(it[0], it[1]));
			// for (i = 0, len = arr.length; i < len; i++) {
				// this.extend(arr[i][0], arr[i][1]);
			// }
		}
		return this;
	}
    intersects(bounds) { // (Bounds) -> Boolean
        const min = this.min, max = this.max,
            min2 = bounds.min, max2 = bounds.max;
        return max2.x > min.x && min2.x < max.x && max2.y > min.y && min2.y < max.y;
    }
    intersectsWithDelta(bounds, dx, dy) { // (Bounds, dx, dy) -> Boolean
        const min = this.min, max = this.max,
            x = dx || 0, y = dy || 0,
            min2 = bounds.min, max2 = bounds.max;
        return max2.x + x > min.x && min2.x - x < max.x && max2.y + y > min.y && min2.y - y < max.y;
    }

	static createBounds(arr) {
		return new Bounds(arr);
	}
};


const Utils = {
	HOST,
	W2,
	bounds: (arr) => Bounds.createBounds(arr),
	getUrlEncoded: function(par) {
		return Object.keys(par).map(function(key) { return encodeURIComponent(key) + '=' + encodeURIComponent(par[key]); }).join('&');
	},
	respJsonp: (resp) => {
		if (resp.status === 200) {
			// let out = resp.text();
			return resp.text();
		} else {
			Utils.errorInfo({ErrorInfo: 'Серверная ошибка: ' + resp.status});
			// Utils.notification.view('Серверная ошибка: ' + resp.status, 'error');
		}
	},
	respJson: (resp) => {
		if (resp.status === 200) {
			let out = '';
			if (resp.json) out = resp.json();
			else if (resp.responseText && resp.responseText.substr(0, 1) === '{') out = JSON.parse(resp.responseText);
			return out;
		} else {
			Utils.errorInfo({ErrorInfo: 'Серверная ошибка: ' + resp.status});
			// Utils.notification.view('Серверная ошибка: ' + resp.status, 'error');
		}
	},
	formatBytes: (bytes, dec = 2) => {
		let out = '0'; 
		if (bytes) {
			const i = Math.floor(Math.log(bytes) / Math.log(KB));
			out = parseFloat((bytes / Math.pow(KB, i)).toFixed(dec < 0 ? 0 : dec));
			out += ' ' + CONF.sizes[i];
		}
		return out;
	},

	getJson: (attr = {}) => {
		let {pars = {}, opt = {}, path = 'VectorLayer', cmd = 'Search', ext='.ashx', jsonp=false, host = CONF.prefix} = attr;
		let url = host + path + '/' + cmd + ext;
		if (!pars.WrapStyle) pars.WrapStyle = 'none';
		url += '?' + Object.keys(pars).map(k => k + '=' + pars[k]).join('&');
		return fetch(url, {...CONF.options, ...opt}).then(jsonp ? Utils.respJsonp : Utils.respJson)
			.then(json => {
				if (typeof(json) === 'string') {
					if (json.substr(0, TILE_PREFIX.length) === TILE_PREFIX) {
						json = json.replace(TILE_PREFIX, '');
						json = JSON.parse(json.substr(0, json.length -1));
					}
					return json;
				}
				else if (Array.isArray(json)) return json;
				else if (json.Status !== 'ok') return Utils.errorInfo(json);
				return json.Result;
			});
	},
	postJson: (attr = {}) => {
		const {pars = {}, opt = {}, path = 'VectorLayer', cmd = 'Search', ext='', type='', jsonp=false, host = CONF.prefix} = attr;
		if (typeof(pars) !== 'object') {
			Utils.errorInfo({ErrorInfo: `Неверно задан параметр: <b>pars</b>`});
			// Utils.notification.view(`Неверно задан параметр: <b>pars</b>`, 'error');
		}
		if (!pars.WrapStyle) pars.WrapStyle = 'none';
        let body = '';
		if (type === 'form') {
			if (!opt.headers) opt.headers = { 'Accept': 'application/json', 'Content-Type': CONF.contenttypes[type] };
			body = Utils.getUrlEncoded(pars);
		} else {
			body = new FormData();
			Object.keys(pars).forEach(k => {
				if(pars[k]) body.append(k, pars[k])
			});
		}
		const url = host + path + '/' + cmd + ext;
		return fetch(url, {...CONF.options, method: 'POST', ...opt, body}).then(jsonp ? Utils.respJsonp : Utils.respJson)
			.then(json => {
				if (json.Status !== 'ok' && !attr.hideError) return Utils.errorInfo(json);
				return json.Result;
			});
	},
	errorInfo: (json) => {
		// Utils.notification.view('Серверная ошибка:<br />' + json.ErrorInfo.ErrorMessage, 'error');
		return json.ErrorInfo;
	},
	getIndexes: (fields) => {
		return fields.reduce((a, c, i) => {
			a[c] = i;
			return a;
		}, {});
	},

	delay: timeout => new Promise(resolve => {
		const id = self.setTimeout(() => {
			self.clearTimeout(id);
			resolve({});
		}, timeout);
	}),
	asyncTask: async (TaskID, timeout = 100) => {
		while(true) {
			const data = await Utils.postJson({pars: {TaskID}, cmd: 'AsyncTask', path: '', ext: '.ashx'});
			if (data.Completed) {
				return data.ErrorInfo ? undefined : data.Result;
			}
			await Utils.delay(timeout);
		}
    },
	search: (pars = {}, flag = false) => {
		if (typeof(pars) !== 'object') pars = {layer: pars};
		else if (!pars.layer) pars.layer = undefined;
		if (!pars.out_cs) pars.out_cs = 'epsg:3857';
		return Utils.postJson({pars, ext: '.ashx'})
			.then(items => {
				if (items.ErrorMessage) {
					console.error('Серверная ошибка:<br />', items.ErrorMessage);
					return null;
				}
				if (typeof(items) === 'number') return items;
				if (items.fields) items.indexes = Utils.getIndexes(items.fields);
				return items;
			});
	},

	parseSearchRes: (items, styles) => {
		let {values = [], indexes} = items;
		let len = values.length;
		let slen = styles.length;
		let lenItem = 5;
		let points = new Float32Array(len * lenItem);
		let gInd = indexes.geomixergeojson;
		let idInd = indexes.gmx_id;
		let badCnt = 0;

		let skipCnt = 0;
		let cnt = 0;
		let testID = {};
// console.log('indexes', indexes);
		values.forEach((it, i) => {
			let gmx_id = it[idInd];
			// if (gmx_id !== 89596) return;
			// if (testID[gmx_id]) {
// console.log('gmx_id', it, testID[gmx_id]);
			// }
// testID[gmx_id] = it;
			let geo = it[gInd];
			if (!geo) {
				badCnt++;
				return;
			}
			let pInd = cnt * lenItem;
			if (geo.type === 'POINT') {
				let [x, y] = geo.coordinates;
				if (Math.abs(x) > W2 || Math.abs(y) > W2) {
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
console.log('res ', points.length / lenItem, items.points.length / lenItem, cnt, values.length, {skipCnt, badCnt});
	},

	getQuery: (sql, cmd = 'QueryScalar', format = 'gmx') => {
		return Utils.getJson({
			pars: { sql, format }, cmd, path: 'VectorLayer', ext: ''
		});
	},

	getQueryArea: (attr = {}) => {
		let {query = '', LayerID = ''} = attr;
		if (LayerID) {
			let sql = `select SUM(StArea(gmx_geometry)) as val from [${LayerID}]`;
			if (query) sql += ' where ' + query;
			return Utils.getQuery(sql);
		} else {
			console.log(`Неверно задан параметр: <b>LayerID</b>=${LayerID}`, 'error');
			return Promise.resolve();
		}
	},

	getQuerySelect: (attr = {}) => {
		let {query = '', where = '', select = '*', from = '', format = 'gmx'} = attr;
		if (!from) {
			console.log(`Неверно задан параметр: <b>from</b>=${from}`, 'error');
			return Promise.resolve();
		} else {
			let sql = `select ${select} from ${from}`;
			if (query) sql += ' where ' + query;
			return Utils.getQuery(sql, 'QuerySelect', format);
		}
	},
	
	parseLayerInfo: async (attr = {}, data = {}) => {
		let columns = attr.Columns || [];
		const _gmx = {
			columns: '[' + columns.filter(it => it.ColumnSimpleType !== 'geometry').map(it => `"{Value":"[${it.Name}]"}`).join(',') + ']',
			...data
		};
		if (attr.MetaProperties) {
			let meta = Object.entries(attr.MetaProperties).reduce((a, c) => {
				// let k = c[0], v = c[1].Value;
				a[c[0]] = c[1];
				return a;
			}, {});
			_gmx.meta = meta;
			let dataSource = meta.dataSource;
			let dataSourceMap = meta.dataSourceMap;
			if (dataSource && dataSource.Value && dataSourceMap && dataSourceMap.Value) {
				let LayerName = dataSource.Value;
				let r = await Utils.getJson({pars: {LayerName}, cmd: 'GetLayerInfo', path:'Layer',  ext:'.ashx'});
				_gmx.dataSource = await Utils.parseLayerInfo(r);
				// let mapId = dataSourceMap.Value;
				// let m = await Utils.getJson({pars: {mapId}, cmd: 'GetMapFolder', path:'Map'});
// console.log('mapId ', mapId, m);
				
			}
		}
		if (_gmx.styles) {
			_gmx.icons = await _getIcons(_gmx.styles);
		}
// console.log('parseLayerInfo ', _gmx);

		return {...attr, _gmx};
	},

};

export default Utils;
