import GLmain from './GLmain.js';

console.log('GLmain ');
onmessage = function(e) {
	const message = e.data || {};
// console.log('onmessage ', message);
	let res = GLmain(message);
	let transArr = [];
	if (res.bitmap) transArr = [res.bitmap];
	postMessage(res, transArr);
}
export default self;
