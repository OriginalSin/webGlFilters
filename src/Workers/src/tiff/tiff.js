import GeoTIFF, { fromUrl, fromUrls, fromArrayBuffer, fromBlob } from 'geotiff';
import * as geokeysToProj4 from "geotiff-geokeys-to-proj4";
import proj4 from "proj4/lib";

/*
const parseTiff = async function (arrBuff, cmdNum) {
	const tiff = await fromArrayBuffer(arrBuff);
	const epsg_code = await get_epsg_code(tiff);
// console.log('tiff______', tiff)
	const imageCount = await tiff.getImageCount();
	const image = await tiff.getImage(); 				// by default, the first image is read.
	const transform = Geotransform(image);
	const raster = await image.readRasters();

	let rgbCnt = [], maxAll = 0;
	raster.forEach((ch, i) => {
		let max = 0;
		// const arr = Object.values(
			// ch.reduce((a, c) => {
				// a[c] = 1 + (a[c] || 0);
				// return a;
			// }, {})
		const arr = ch.reduce((a, c) => {
				a[c] = 1 + (a[c] || 0);
				return a;
			}, []
		).map(v => {
			max = Math.max(max, v);
			return v;
		});
		maxAll = Math.max(maxAll, max);
		rgbCnt.push({ arr, max });
	});

	const histogram = rgbCnt.map(it => {
		const farr = new Float32Array(it.arr.length);
		it.arr.forEach((v, i) => farr[i] = (v || 0)/ maxAll);
		return {
			farr,
			// arr: it.arr.forEach(v => (v || 0)/ maxAll),
			max: it.max
		}
	});
	
console.log('tiff______', maxAll, histogram)
		// const [red, green, blue] = await image.readRasters();
// const [r0, g0, b0, r1, g1, b1] = await image.readRasters({ pool, interleave: true });
		// const { width, height } = data;
	const rgb = await image.readRGB({});
	const width = rgb.width, height = rgb.height;
	const tiffAttr = {
		imageCount,
		images: [
			{
				width: image.getWidth(),
				height: image.getHeight(),
				tileWidth: image.getTileWidth(),
				tileHeight: image.getTileHeight(),
				samplesPerPixel: image.getSamplesPerPixel(),

			// when we are actually dealing with geo-data the following methods return
			// meaningful results:
				// origin: image.getOrigin(), // Error in getOrigin. When the image has no affine transformation
				// resolution: image.getResolution(),
				// bbox: image.getBoundingBox(),
				histogram,
				raster,
				epsg_code,
				transform,
				rgb
			}
		]
	};
console.log('tiffAttr______', tiffAttr, histogram)

	// const typedArrays = [];
	// const typedArrays = histogram.map(it => it.farr);
	// typedArrays.push(rgb);
	// postMessage({
		// transform,
		// width, height,
			// rgb
	// });
	// }, [rgb]);

	// transArr.push(rgb);
	return {
		transform,
		width, height,
			rgb
	};
};
*/

let tiff, tifHeader = {};

const geotransform = (image) => {
	const fd = image.fileDirectory;
	const {ModelTiepoint, ModelPixelScale, ModelTransformation} = fd;
console.log("[geotiff-geotransform] point, pixel, trans", fd, ModelTiepoint, ModelPixelScale, ModelTransformation);
	let out = [];
	if (ModelTransformation) {
		const [a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p] = ModelTransformation;
		out = [d, a, b, h, e, f];
	} else if (ModelTiepoint) {
		const [i, j, k, x, y, z] = ModelTiepoint;
		if (ModelPixelScale) {
			const [scaleX, scaleY, scaleZ] = ModelPixelScale;
			out = [x, scaleX, 0, y, 0, -1 * scaleY];
		} else {
console.log("[geotiff-geotransform] missing ModelPixelScaleTag", );
		}
	} else if (ModelPixelScale) {
console.log("[geotiff-geotransform] missing ModelTiepointTag");
	}
	return out;
}

const pointProject = (x, y, projObj, projection) => {
	let point = {x, y};
	if (projObj.shouldConvertCoordinates)
		point = geokeysToProj4.convertCoordinates(x, y, projObj.coordinatesConversionParameters);

	return projection.forward(point); // Project these coordinates
}

const parseTifHeader = async (aBuff) => {
	tiff = await fromArrayBuffer(aBuff);
	// const epsg_code = await get_epsg_code(tiff);
	let imageCount = await tiff.getImageCount(); // Get image count
	const images = [];
	for (let i = 0; i < imageCount; i++) {
		const image = await tiff.getImage(i); // Get image instance
		const geoKeys = image.getGeoKeys();
		let projObj = geokeysToProj4.toProj4(geoKeys); // Convert geokeys to proj4 string
			// The function above returns an object where proj4 property is a Proj4 string and coordinatesConversionParameters is conversion parameters which we'll use later
		let projection = proj4(projObj.proj4, "WGS84"); // Project our GeoTIFF to WGS84
		
		const width = image.getWidth(),
			height = image.getHeight(),
			origin = image.getOrigin(),
			resolution = image.getResolution();

		images.push({
			tileWidth: image.getTileWidth(),
			tileHeight: image.getTileHeight(),
			samplesPerPixel: image.getSamplesPerPixel(),
			transform: geotransform(image),
			geoKeys,
			resolution,
			origin,
			width,
			height,
			proj4: projObj.proj4,
			anchors: {	// Work with pixels
				// Pixel dimensions for converting image coordinates to source CRS coordinates
				bl: pointProject(origin[0], origin[1], projObj, projection),
				tl: pointProject(origin[0], origin[1] + height * resolution[1], projObj, projection),
				tr: pointProject(origin[0] + width * resolution[0], origin[1] + height * resolution[1], projObj, projection),
				br: pointProject(origin[0] + width * resolution[0], origin[1], projObj, projection)
			}
		});
	}

	tifHeader = {
		imageCount,
		// epsg_code,
		images
	};
	return tifHeader;
};

const parseChunks = async (chunks, receivedLength) => {
	// Шаг 4: соединим фрагменты в общий типизированный массив Uint8Array
	let chunksAll = new Uint8Array(receivedLength); // (4.1)
	let position = 0;
	for(let chunk of chunks) {
	  chunksAll.set(chunk, position); // (4.2)
	  position += chunk.length;
	}
	tiff = await fromArrayBuffer(chunksAll.buffer);
	// imageTransform();
	// const image = await tiff.getImage(); 				// by default, the first image is read.
	// const raster = await image.readRasters();
console.log('parseChunks ______', position)
};

const fetchTif = async (url, opt = {}) => {

	const resp = await fetch(url, opt);
	const contentLength = +resp.headers.get('Content-Length');	// Шаг 2: получаем длину содержимого ответа
	const reader = resp.body.getReader();
	let receivedLength = 0;
	let chunks = []; // массив полученных двоичных фрагментов (составляющих тело ответа)
	return new Promise(resolve => {
		const stream = new ReadableStream({
		  start(controller) {
			return pump();
			function pump() {
			  return reader.read().then(({ done, value }) => {
				if (done) {		// When no more data needs to be consumed, close the stream
	// console.log(`Total: ${contentLength} Chunk: ${receivedLength} .`, done, value);
				  controller.close();
				  parseChunks(chunks, receivedLength);
				  return;
				}
				if (!chunks.length) resolve(parseTifHeader(value.buffer));
				chunks.push(value);
				receivedLength += value.length;
	// console.log(`Total: ${contentLength} Chunk: ${receivedLength} .`, done);

				// Enqueue the next data chunk into our target stream
				controller.enqueue(value);
				return pump();
			  });
			}
		  },
		});
    });

	return Promise.resolve({contentLength});
};

const glMain = async function (params, transArr) {
	let {cmd, cmdNum, src, tiff} = params;
	let out;
	switch(cmd) {
		case 'getTif':
			out = await fetchTif(src);
			break;
		default:
			// out = await parseTiff(tiff, cmdNum);
			break;
	}
console.log('glMain ______', out);
	out.cmdNum = cmdNum;
	return out;
};

export default glMain;
