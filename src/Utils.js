// import fetchProgress from 'fetch-progress';
import Notification from  './Notification/Notification.js'

const KB = 1024;
const prefix = window.serverBase || (location.origin + '/');
const CONF = {
	prefix,
	options: {mode: 'cors', credentials: 'include'},
	contenttypes: {
		json: 'application/json',
		form: 'application/x-www-form-urlencoded',
		formData: 'multipart/form-data',
	},
	
	sizes: ['байт', 'КБ', 'МБ', 'ГБ', 'ТБ'],
	max_upload_size: 500 * KB * KB
};
const cssFiles = [
	'./src/Notification/Notification.css'
];

const Utils = {
	loadCss: async (arr) => {
		if (typeof arr === 'string') arr = [arr];

		arr.forEach(it => {
			let link = document.createElement('link');
			link.rel   = 'stylesheet'; link.type  = 'text/css';
			link.href  = it;
			document.head.appendChild(link);
		});
	},
	loadScript: (url, opt = {async: false, defer: false}) => {
		return new Promise((resolve, reject) => {
			let script = document.createElement('script');
			let windowErrorHandler = (event) =>{
				event.preventDefault();
				window.removeEventListener('error', windowErrorHandler);
				reject(event.error);
			};
			window.addEventListener('error', windowErrorHandler);  
			let rejectHandler = (event) =>{
				window.removeEventListener('error', windowErrorHandler);
			resolve();
				// reject(event.error);                        
			};              
			script.addEventListener('error', rejectHandler);                
			script.addEventListener('abort', rejectHandler);            

			var loadedHandler = (pt) =>{
				window.removeEventListener('error', windowErrorHandler);
				resolve(pt);
			};

			script.type = opt.type || 'text/javascript';
			if (opt.async) script.async = true;
			if (opt.defer) script.defer = true;
			script.src = url;
			script.addEventListener('load', loadedHandler);
			script.onload = loadedHandler;
			try {
				document.head.append(script);
			} catch (error) {
				reject(error);
			}
		// })
		// .catch ((err) => {
			// console.warn('Skip:', url, err.message);
			// resolve();
		});
	},
	runScript: (url, opt = {async: false, defer: false}) => {
			let script = document.createElement('script');
			script.type = opt.type || 'text/javascript';
			if (opt.async) script.async = true;
			if (opt.defer) script.defer = true;
			script.src = url;

			// script.onload = () => resolve(script);
			// script.onerror = (err) => {
				// reject();
			// }

			document.head.append(script);
	},
	getUrlEncoded: function(par) {
		return Object.keys(par).map(function(key) { return encodeURIComponent(key) + '=' + encodeURIComponent(par[key]); }).join('&');
	},
	notification: new Notification({closeIcon: false}),
	respJson: (resp) => {
		if (resp.status === 200) {
			let out = '';
			if (resp.json) out = resp.json();
			else if (resp.responseText && resp.responseText.substr(0, 1) === '{') out = JSON.parse(resp.responseText);
			return out;
		} else {
			Utils.notification.view('Серверная ошибка: ' + resp.status, 'error');
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

	fileDownload: (cmd, folder, fileName) => {
        const fd = new FormData();
        fd.append('FullName', folder + fileName);
		const url = CONF.prefix + 'FileBrowser/' + cmd + '.ashx';
		return fetch(url, {...CONF.options, method: 'POST', body: fd}).then(res => res.blob())
			.then(blob => {
				const a = document.createElement("a");
				a.href = window.URL.createObjectURL(blob);
				a.download = fileName;
				a.click();
			});
	},

	upload: (files, folder, progressbar) => {
        const fd = new FormData();
        let tSize = 0;
        for (let f = 0; f < files.length; f++) {
            const file = files[f];
			tSize += file.size;
			fd.append('rawdata', file);
       }
        
        if (tSize > CONF.max_upload_size) {
			Utils.notification.view('Размер файла превышает 500 Мб. Используйте GeoMixerFileBrowser для загрузки больших файлов.', 'error');
            return Promise.resolve(false);
        }
        
        fd.append('ParentDir', folder);
		fd.append('WrapStyle', 'None');
		let url = CONF.prefix + 'FileBrowser/Upload.ashx';
		return fetch(url, {...CONF.options, method: 'POST', body: fd})
/*			.then(
			  fetchProgress({
				// implement onProgress method
				onProgress(progress) {
					if (progressbar) {
						let p = progress.percentage;
						progressbar.style.width = (100 - p) + '%';
					}
						  console.log('hhhhhhh', progress);
				  // A possible progress report you will get
				  // {
				  //    total: 3333,
				  //    transferred: 3333,
				  //    speed: 3333,
				  //    eta: 33,
				  //    percentage: 33
				  //    remaining: 3333,
				  // }
				},
				onError(err) {
					Utils.notification.view('Серверная ошибка: ' + err, 'error');
					console.log(err);
				},
			  })
			)*/
			.then(Utils.respJson)
			.then(json => {
				if (progressbar) progressbar.style.width = 'unset';
				if (json.Status !== 'ok') return Utils.errorInfo(json);
				return json.Result;
			});
	},

	getJson: (attr = {}) => {
		let {pars = {}, opt = {}, path = 'VectorLayer', cmd = 'Search',  ext='.ashx', host = CONF.prefix} = attr;
		let url = host + path + '/' + cmd + ext;
		if (!pars.WrapStyle) pars.WrapStyle = 'none';
		url += '?' + Object.keys(pars).map(k => k + '=' + pars[k]).join('&');
		return fetch(url, {...CONF.options, ...opt}).then(Utils.respJson)
			.then(json => {
				if (Array.isArray(json)) return json;
				else if (json.Status !== 'ok') return Utils.errorInfo(json);
				return json.Result;
			});
	},
	postJson: (attr = {}) => {
		const {pars = {}, opt = {}, path = 'VectorLayer', cmd = 'Search', ext='', type='', host = CONF.prefix} = attr;
		if (typeof(pars) !== 'object') {
			Utils.notification.view(`Неверно задан параметр: <b>pars</b>`, 'error');
		}
		if (!pars.WrapStyle) pars.WrapStyle = 'none';
        let body = '';
		if (type === 'form') {
			if (!opt.headers) opt.headers = { 'Accept': 'application/json', 'Content-Type': CONF.contenttypes[type] };
			body = Utils.getUrlEncoded(pars);
		} else {
			body = new FormData();
			Object.keys(pars).forEach(k => body.append(k, pars[k]));
		}
		const url = host + path + '/' + cmd + ext;
		return fetch(url, {...CONF.options, method: 'POST', ...opt, body}).then(Utils.respJson)
			.then(json => {
				if (json.Status !== 'ok' && !attr.hideError) return Utils.errorInfo(json);
				return json.Result;
			});
	},
	errorInfo: (json) => {
		Utils.notification.view('Серверная ошибка:<br />' + json.ErrorInfo.ErrorMessage, 'error');
		return json.ErrorInfo;
	},
	getIndexes: (fields) => {
		return fields.reduce((a, c, i) => {
			a[c] = i;
			return a;
		}, {});
	},
	copyToClipboard: async (txt) => {
		try {
			await navigator.clipboard.writeText(txt);
			//console.log('Content copied to clipboard');
		} catch (err) {
			console.error('Failed to copy: ', err);
		}
	},
	delay: timeout => new Promise(resolve => {
		const id = window.setTimeout(() => {
			window.clearTimeout(id);
			resolve({});
		}, timeout);
	}),
	asyncTask: async (TaskID, timeout = 100) => {
		while(true) {
			const data = await Utils.postJson({pars: {TaskID}, cmd: 'AsyncTask', path: '', ext: '.ashx'});
			if (data.Completed) {
				if (data.ErrorInfo) Utils.notification.view(data.ErrorInfo.ErrorMessage || `Ошибка в задании: <b>${TaskID}</b>`, 'error');
				return data.ErrorInfo ? undefined : data.Result;
			}
			await Utils.delay(timeout);
		}
    },
	copyLayer: async (LayerName, attr = {}) => {
		let data = await Utils.postJson({pars: {LayerName}, cmd: 'GetLayerJson', ext: '.ashx', path: 'Layer'});
		if (!data) {
			Utils.notification.view(`Заданный слой не найден: <b>${LayerName}</b>`, 'error');
			return;
		}
		const props = data.properties;
		const Title = attr.title || attr.Title || (props.title + ' copy');
		const TemporalLayer = props.Temporal || false;
		const TemporalColumnName = props.TemporalColumnName || null;
		const IsRasterCatalog = props.IsRasterCatalog || false;
		const pars = {
			Title,
			SourceType: 'Sql',
			Sql: 'select ' + ['[geomixergeojson] as gmx_geometry', ...props.attributes.map(key => `"${key}" as ${key}`)].join(', ') + ` from [${props.LayerID}]`,
			IsRasterCatalog,
			TemporalLayer,
			TemporalColumnName,
			srs: 3857,
			geometrytype: attr?.GeometryType || props.GeometryType,
		};
		const {TaskID} = await Utils.postJson({pars, cmd: 'Insert', ext: '.ashx'});
		data = await Utils.asyncTask(TaskID, 200) || {};
		return data?.properties?.LayerID;
	},
	saveLayer: async (isUpdate, pars = {}) => {
		const {TaskID} = await Utils.postJson({pars, cmd: isUpdate ? 'Update' : 'Insert', ext: '.ashx'});
		data = await Utils.asyncTask(TaskID, 200) || {};
		return data;
	},
	search: (pars = {}) => {
		if (typeof(pars) !== 'object') pars = {layer: pars};
		else if (!pars.layer) pars.layer = undefined;
		return Utils.postJson({pars, ext: '.ashx'})
			.then(items => {
				if (typeof(items) === 'number') return items;
				if (items.fields) items.indexes = Utils.getIndexes(items.fields);
				return items;
			});
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
			Utils.notification.view(`Неверно задан параметр: <b>LayerID</b>=${LayerID}`, 'error');
			return Promise.resolve();
		}
	},

	getQuerySelect: (attr = {}) => {
		let {query = '', where = '', select = '*', from = '', format = 'gmx'} = attr;
		if (!from) {
			Utils.notification.view(`Неверно задан параметр: <b>from</b>=${from}`, 'error');
			return Promise.resolve();
		} else {
			let sql = `select ${select} from ${from}`;
			if (query) sql += ' where ' + query;
			return Utils.getQuery(sql, 'QuerySelect', format);
		}
	},
};
Utils.loadCss(cssFiles);

export default Utils;
