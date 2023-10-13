import DataService from './src/DataService';

onmessage = function(e) {
	const message = e.data || {};
	const cmdProv = DataService[message.cmd];
// console.log('onmessage ', message);
	if (!cmdProv) {		// Нет обработчика сообщения
		console.warn('skip ', message.cmd);
		return;
	}
	const promise = cmdProv.call(DataService, message);
	if (promise instanceof Promise) promise.then(res => {
		if (res.bitmap) postMessage(res, res.bitmap);
		else postMessage(res);
	});
	else console.warn('Обработчик должен взвращать Promise:', message); 
}
export default self;
