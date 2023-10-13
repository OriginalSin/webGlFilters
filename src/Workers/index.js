import libGL from './src/webgl/libGL';
import mWorker from './Worker?worker';
import tiffWorker from './WorkerTiff?worker';
import gWorker from './src/webgl/WorkerGL?worker';
// import shWorker from './src/webgl/WorkerGL?sharedworker';

// const w1Url = new URL('./webgl/webgl/WorkerGL.js');
// const sharedWorker = new SharedWorker(w1Url);

// import sharedWorker from './src/webgl/WorkerGL?sharedworker';
// const sharedWorker = new SharedWorker('./src/webgl/WorkerGL.js');
// const wUrl = new URL('./Worker.js', import.meta.url);

const worker = new mWorker();
let cmdNum = 0;
worker._cmdResolver = {};
worker.onmessage = function(e) {
	const res = e.data || {};
	const from = res.from || {};
	const num = from.cmdNum || res.cmdNum;
	const resolver = worker._cmdResolver[num];
	if (resolver) {
		resolver(res);
		delete worker._cmdResolver[num];
	}
	// else console.warn('worker skip:', res.cmdNum, num, res.cmd);
	// console.log('vwworker received from worker', e.data);
}
worker.sendCmd = (attr) => {
	cmdNum++;
	return new Promise(resolve => {
		worker._cmdResolver[cmdNum] = resolve;
		worker.postMessage({...attr, cmdNum});
	});
}
// cmdNum++;
// glWorker.postMessage({ cmd: 'sharedWorker', cmdNum, name: 'w1'});
// glWorker.postMessage({ cmd: 'sharedWorker', cmdNum, name: 'w1'}, [sharedWorker]);

// Для WebGL фильтров
const glWorker = new gWorker();
glWorker.cmdNum = 0;
glWorker._cmdResolver = {};
glWorker.onmessage = function(e) {
	const res = e.data || {};
	const from = res.from || {};
	const num = from.cmdNum || res.cmdNum;
	const resolver = glWorker._cmdResolver[num];
	if (resolver) {
		resolver(res);
		delete glWorker._cmdResolver[num];
	}
	// else console.warn('worker skip:', res.cmdNum, num, res.cmd);
	// console.log('vwworker received from worker', e.data);
}
glWorker.sendCmd = (attr, canvas) => {
	glWorker.cmdNum++;
	return new Promise(resolve => {
		glWorker._cmdResolver[glWorker.cmdNum] = resolve;
		glWorker.postMessage({...attr, cmdNum: glWorker.cmdNum}, canvas);
	});
}

// Для обработки GeoTiff
const tWorker = new tiffWorker();
tWorker.cmdNum = 0;
tWorker._cmdResolver = {};
tWorker.onmessage = function(e) {
	const res = e.data || {};
	const from = res.from || {};
	const num = from.cmdNum || res.cmdNum;
	const resolver = tWorker._cmdResolver[num];
	if (resolver) {
		resolver(res);
		delete tWorker._cmdResolver[num];
	}
	// else console.warn('worker skip:', res.cmdNum, num, res.cmd);
	// console.log('vwworker received from worker', e.data);
}
tWorker.sendCmd = (attr, canvas) => {
	tWorker.cmdNum++;
	return new Promise(resolve => {
		tWorker._cmdResolver[tWorker.cmdNum] = resolve;
		tWorker.postMessage({...attr, cmdNum: tWorker.cmdNum}, canvas);
	});
}

const nsGmx = window.nsGmx || {};
nsGmx.gmxWorker = worker;
nsGmx.glWorker = glWorker;
nsGmx.tiffWorker = tWorker;
nsGmx.libGL = libGL;

window.nsGmx = nsGmx;
export default worker;
