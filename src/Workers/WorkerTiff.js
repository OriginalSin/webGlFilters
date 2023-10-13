import Tiff from './src/tiff/tiff.js';

console.log('Tiff ');
onmessage = async function(e) {
	const message = e.data || {};
// console.log('onmessage ', message);
	let transArr = [];
	let res = await Tiff(message);
	// if (res.typedArrays) {
		// transArr = Object.values(res.typedArrays).map(v => v);
	// }
	postMessage(res, transArr);
}
export default self;
