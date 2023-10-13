const HOST = 'maps.kosmosnimki.ru',
    WORLDWIDTHFULL = 40075016.685578496;

	/*
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

	static createBounds(arr) {
		return new Bounds(arr);
	}
};
*/
// let bounds = Bounds.createBounds([1,2,3,4]).addBuffer(0.5);
// console.log('bounds', bounds);

const TS = 256;
const prpScreenTileData = (data) => {
	let coords = data.coords,
		tz = Math.pow(2, coords.z),
		mInPixel = 256 * tz / WORLDWIDTHFULL,
		tpx = 256 * (coords.x % tz - tz/2),
		tpy = 256 * (tz/2 - coords.y % tz);
	// data.scrTile = {
		// matrix: new DOMMatrix([mInPixel, 0, 0, mInPixel, -tpx, tpy ])
	// };

 // console.log('prpScreenTileData :',  data);
	return 	{
		mInPixel,
		tpx,
		tpy,
		matrix: new DOMMatrix([mInPixel, 0, 0, mInPixel, -tpx, tpy ])
	}
};

const utils = {
	_drawPoins: (attr) => {
		const {tile, mapAttr} = attr;
		const layer = attr.layer;
		const tileItems = layer.tileItems;
		const {styles, icons} = layer._gmx;
// console.log("_drawPoins", mapAttr.zoom, mapAttr.mInPixel);
		if (!tile || !styles) return null;
		const tdata = prpScreenTileData(tile);
		const matrix = tdata.matrix;
		
		const {matrix1, mInPixel} = mapAttr;
		const matArr = [mInPixel, 0, 0, mInPixel, tile.bounds.min.x, tile.bounds.max.y];
					// x -= tile.bounds.min.x, y = tile.bounds.max.y - y;
		// const matrix = new DOMMatrix(matArr);

		const mInPixelRev = 1 / mInPixel;
		let iw2 = mInPixelRev * icons[0].w / 2, ih2 = mInPixelRev * icons[0].h / 2;
		const matIconArr = [mInPixelRev, 0, 0, mInPixelRev, 0, 0];
		// let iw2, ih2;
		let iw, ih;
		let sBounds, matIcon;
// if (tile.zKey === "1:0:1") {
// console.log("tile", tile);
// }

		const ts = tile.ts || TS;
		// const ts = tile.ts || TS;
		const mcanvas = new OffscreenCanvas(ts, ts);
		mcanvas.width = mcanvas.height = ts;
		const ctx = mcanvas.getContext('2d');
console.time(tile.zKey);
let cnt = 0;
		ctx.globalAlpha = 1;
		// ctx.setTransform(matrix);

// let mat1 = ctx.getTransform();
// console.log("mat1", mInPixelRev);
// ctx.scale(mInPixel, mInPixel);
// ctx.translate(tile.bounds.min.x, WORLDWIDTHFULL/2 - tile.bounds.max.y);
ctx.strokeText(tile.zKey, 150, 150);
// ctx.strokeText(tile.zKey, tile.bounds.min.x + 150, - tile.bounds.max.y + WORLDWIDTHFULL/2 + 150);
		for (let tKey in tileItems) {
			const {boundsData, lenItem} = tileItems[tKey];
			// const {points, boundsData, lenItem} = tileItems[tKey];
			if (tile.bounds.intersectsWithDelta(boundsData, iw2, ih2)) {
// console.log("_drawPoins", styles, points);
				const points = tileItems[tKey].points;
				const slen = points.length;
				for (let i = 0; i < slen; i += lenItem) {
					const sn = points[i];
					if (sn === -1) continue;
					let x = points[i + 1], y = points[i + 2];
					// x -= tile.bounds.min.x, y = tile.bounds.max.y - y;
					const icon = icons[sn];
					const {w, h, fillColor, path, canvas} = icon;
					// if (w !== iw || w !== iw) {
						// iw = w , ih = h;
		// iw2 = mInPixelRev * iw / 2, ih2 = mInPixelRev * ih / 2;
						// iw2 = iw * mInv / 2, ih2 = ih * mInv / 2;
						// sBounds = tile.bounds.addBuffer(iw2, ih2);
						// matIcon = new DOMMatrix([mInv, 0, 0, mInv, -iw2, -ih2]);
						// matIconArr[4] = x - iw2;
						// matIconArr[5] = y - ih2;
						// matIcon = new DOMMatrix(matIconArr);
					// }
					// if (!sBounds.contains(points, i + 1)) continue;
		// ctx.setTransform(matrix);
					let rad = points[i + 3] || 0;
				 // rad = Math.PI / 2;
				// rad = 0;
					let px = x*tdata.mInPixel - tdata.tpx, py = y*tdata.mInPixel - tdata.tpy;
					let marr = [1, 0, 0, 1, px, -py];
					if (rad) {
						let cos = Math.cos(rad), sin = Math.sin(rad);
						marr[0] = marr[3] = cos;
						marr[1] = sin; marr[2] = -sin;
					}
						
 						
						// ctx.translate(-iw2/mInPixelRev, -ih2/mInPixelRev);
						// ctx.rotate(rad);
						// ctx.translate(-x, -y);
					ctx.fillStyle = fillColor || 'blue';
					if (path) {
cnt++;
						let iPath = new Path2D();
						iPath.addPath(path, new DOMMatrix(marr));
						ctx.fill(iPath);
/*
						const matIconArr = [mInPixelRev, 0, 0, mInPixelRev, x - iw2, y - ih2];
						// matIconArr[4] = x - iw2;
						// matIconArr[5] = y - ih2;
						// const matIcon = new DOMMatrix(matIconArr);
						const point = new DOMPoint(x, y);

						const matIcon = new DOMMatrix([
  Math.cos(rad) * mInPixelRev,
  Math.sin(rad) * mInPixelRev,
  -Math.sin(rad) * mInPixelRev,
  Math.cos(rad) * mInPixelRev,
  // iw2, ih2
 // - iw2,  - 1*ih2
// x  -mInPixelRev * w/2 , y 
x  -mInPixelRev * w/2 , -y + mInPixelRev * h/2
// x  - iw2 * mInPixel, y - ih2* mInPixel
// x  - tile.bounds.min.x , y 
// -x * mInPixel , -y * mInPixel
// x * mInPixel - iw2, y * mInPixel - 1*ih2
// x + iw2/mInPixelRev, y + ih2/mInPixelRev
// x - 1*iw2/mInPixelRev, y - 1*ih2/mInPixelRev
]);
console.log('nnnnnnnn', tile.zKey, x * mInPixel);
// let scale = mInPixelRev;
// let scale = 1;
const transformedPoint = point.matrixTransform(matIcon);
						let iPath = new Path2D();
						iPath.addPath(path, new DOMMatrix([
	Math.cos(rad) * scale,
  Math.sin(rad) * scale,
  -Math.sin(rad) * scale,
  Math.cos(rad) * scale,
  // x*mInPixel, y*mInPixel 
  0, 0
  // px, -py
  // w/2, h/2
  // -w/2, -h/2
  // w/2 * mInPixel, h/2 * mInPixel
  // -w/2 * mInPixel, -h/2 * mInPixel
]));

// let px = (x)*tdata.mInPixel - tdata.tpx, py = tdata.tpy - (y)*tdata.mInPixel;
						let iPath2 = new Path2D();
						iPath2.addPath(iPath, new DOMMatrix([
	mInPixelRev,
  0,
  0,
  mInPixelRev,
  // x - mInPixelRev * w, y - mInPixelRev * h
  // x - mInPixelRev * w/2, y - mInPixelRev * h/2
  // -mInPixelRev * px, py 
  // tdata.tpx - x*tdata.mInPixel, -y*tdata.mInPixel + tdata.tpy
  // x * 1, y * 1
  // x * mInPixelRev, y * mInPixelRev
  // +w/2 / mInPixel, +h/2 / mInPixel
  // -w/2, -h/2
  // 0, 0 
  // x/mInPixel, y/mInPixel 
  x, y 
]));

// let scale = mInPixelRev;
let scale = 1;
let px = x*tdata.mInPixel - tdata.tpx, py = y*tdata.mInPixel - tdata.tpy;
						let iPath1 = new Path2D();
						// iPath1.addPath(iPath2, matrix);
						iPath1.addPath(path, new DOMMatrix([
	Math.cos(rad) * scale,
  Math.sin(rad) * scale,
  -Math.sin(rad) * scale,
  Math.cos(rad) * scale,
	// 1,
  // 0,
  // 0,
  // 1,
  // x - mInPixelRev * w, y - mInPixelRev * h
  // x - mInPixelRev * w/2, y - mInPixelRev * h/2
  // -mInPixelRev * px, py 
  // tdata.tpx - x*tdata.mInPixel, -y*tdata.mInPixel + tdata.tpy
  // x * 1, y * 1
  // x * mInPixelRev, y * mInPixelRev
  // +w/2 / mInPixel, +h/2 / mInPixel
  // -w/2, -h/2
  // 0, 0 
  // x/mInPixel, y/mInPixel 
  px, -py 
]));
						// iPath1.addPath(iPath2, matrix.inverse());

						iPath1.addPath(iPath, new DOMMatrix([
	mInPixelRev,
  0,
  0,
  mInPixelRev,
  // x - mInPixelRev * w, y - mInPixelRev * h
  // x - mInPixelRev * w/2, y - mInPixelRev * h/2
  x , y 
]));
*/
						// ctx.scale(1, 1);
						
						// ctx.fill(path);
					} else { // todo: icon.canvas нет 
						// ctx.translate(x, y);
						// ctx.drawImage(canvas, x - iw2, y - ih2);
						// ctx.drawImage(icon.canvas, x - iw2 * mInv, y - ih2 * mInv);
						// ctx.drawImage(icon.canvas, x * mInv - iw2 * mInv, y * mInv - ih2 * mInv);
					}
					if (rad) {
						// ctx.setTransform(matrix);
						// ctx.resetTransform();
						// ctx.translate(x, y);
						// ctx.rotate(-rad);
						// ctx.translate(-x, y);
					}
					
					// if (rad) ctx.setTransform(matrix);
// let px = (x)*tdata.mInPixel - tdata.tpx, py = tdata.tpy - (y)*tdata.mInPixel;
// ctx.fillRect(px, py, 22, 12);
// ctx.fillRect(x, y, 22/mInPixel, 12/mInPixel);
					
				}
			}

		}
console.timeEnd(tile.zKey);
// console.log(tile.zKey, cnt);

		return mcanvas.transferToImageBitmap();
// console.log("_drawPoins");
		// return {bitmap: bitmap};
	},
	_drawPoinsScreen: (attr) => {
		const {search, mapAttr, info} = attr;
		const {styles, icons} = info._gmx;
		if (!search || !styles) return null;
console.time("_drawPoins");

// console.log('drawPoins', attr);
		const {size, zoom, center, matrix, mInPixel, left,right, top,bottom} = mapAttr;
		const ctbh = center.y + (top - bottom) / 2;
		const mInv = 1 / mInPixel;

		const cw = size.x, ch = size.y;
		const mcanvas = new OffscreenCanvas(cw, ch);
		mcanvas.width = cw; mcanvas.height = ch;
		const ctx = mcanvas.getContext('2d');
				let cnv, ptx;

		const {points, lenItem} = search;
		const slen = points.length;
		ctx.globalAlpha = 1;
		const matrix1 = new DOMMatrix([mInPixel, 0, 0, mInPixel, -0, 0]);
		ctx.setTransform(matrix1);

		let iw2, ih2;
		let iw, ih;
		let sBounds, matIcon;

		for (let i = 0; i < slen; i += lenItem) {
			const sn = points[i];
			if (sn === -1) continue;
			const icon = icons[sn];
			const {w, h, fillColor, path, canvas} = icon;
			if (w !== iw || w !== iw) {
				iw = w , ih = h;
				iw2 = iw * mInv / 2, ih2 = ih * mInv / 2;
				sBounds = Bounds.createBounds([left, top, right, bottom]).addBuffer(iw2, ih2);
				// matIcon = new DOMMatrix([mInv, 0, 0, mInv, -iw2, -ih2]);
				// sBounds = new utils.Bounds([[left, top], [right, bottom]]);
			}
			if (!sBounds.contains(points, i + 1)) continue;
			let x = points[i + 1], y = points[i + 2];
			x -= left, y = ctbh - y;
			let rad = points[i + 3] || 0;
			if (rad) { ctx.translate(x, y); ctx.rotate(rad); ctx.translate(-x, -y); }
			ctx.fillStyle = fillColor || 'blue';
			if (path) {
				const matIcon = new DOMMatrix([mInv, 0, 0, mInv, x - iw2, y - ih2]);
				let iPath = new Path2D();
				iPath.addPath(path, matIcon);
				ctx.fill(iPath);
			} else { // todo: icon.canvas нет 
				// ctx.translate(x, y);
				ctx.drawImage(canvas, x - iw2, y - ih2);
				// ctx.drawImage(icon.canvas, x - iw2 * mInv, y - ih2 * mInv);
				// ctx.drawImage(icon.canvas, x * mInv - iw2 * mInv, y * mInv - ih2 * mInv);
			}
			if (rad) ctx.setTransform(matrix1);
			// ctx.fill();
			// if (i > 1000)				break;
		}
// console.timeEnd("_drawPoins");
		const bitmap = mcanvas.transferToImageBitmap();
console.timeEnd("_drawPoins");
		return {bitmap, center, zoom};
	},
	_drawIcons: (attr) => {
		let {icons = [], mapSize = {x: 400, y: 400}} = attr;
// console.log('drawPoins', attr);
		const w = mapSize.x, h = mapSize.y;
		const canvas = new OffscreenCanvas(w, h);
		canvas.width = w; canvas.height = h;
/**/
		let _ctx = canvas.getContext('2d');
				_ctx.fillStyle = 'blue';
			_ctx.globalAlpha = 1;
		let arr = icons.map(icon => {
			// if (icon instanceof Blob) {
// console.log('_drawIcons', icon);
			// }
			// let p = new Path2D(icon);
				_ctx.fillStyle = icon.fillColor;
			_ctx.fill(icon.path);

		});
// _ctx.rect(10, 10, 100, 100);
_ctx.fill();
		const bitmap = canvas.transferToImageBitmap();
		return bitmap;
	},
}

export default {
	drawIcons: utils._drawIcons,
	drawPoins: utils._drawPoins
};