import { getMatrix4fv, project } from './Matrix4fv.js';
// import Program from './Program';

const qualityOptions = { anisotropicFiltering: true, mipMapping: true, linearFiltering: true };
let	_anisoExt = null, srcPoints, matrix, glResources, gl;

const _nextHighestPowerOfTwo = ( x ) => {
	--x;
	for (var i = 1; i < 32; i <<= 1) {
		x = x | x >> i;
	}
	return x + 1;
};

class Texture {

  constructor(opt, resolve) {
	const { gl, url, anchors, clipRings } = opt;
    this.gl = gl;
    this.url = url;
    this.anchors = anchors;
    this.clipRings = clipRings;
	this.screenTexture = gl.createTexture();		// Create a texture to use for the screen image
    this.resolve = resolve;

	// this._create();

  }

  async getUrl() {
	const {gl, url, anchors, clipRings } = this;

	const bitmap = await fetch(url).then(resp => resp.blob()).then(createImageBitmap);

	const ww = _nextHighestPowerOfTwo(bitmap.width), hh = _nextHighestPowerOfTwo(bitmap.height);
	const canvas = new OffscreenCanvas(ww, hh);
	canvas.getContext('2d').drawImage(bitmap, 0, 0, ww, hh);

// console.warn(' createTexture.', canvas);

	gl.bindTexture(gl.TEXTURE_2D, this.screenTexture);	// Create a texture to use for the screen image
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
	const mipMapping = qualityOptions.mipMapping;
	if(qualityOptions.linearFiltering) {
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mipMapping ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	} else {
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mipMapping ? gl.NEAREST_MIPMAP_NEAREST : gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	}
	
	if(_anisoExt) {
		// turn the anisotropy knob all the way to 11 (or down to 1 if it is
		// switched off).
		const maxAniso = qualityOptions.anisotropicFiltering ? gl.getParameter(_anisoExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 1;
		gl.texParameterf(gl.TEXTURE_2D, _anisoExt.TEXTURE_MAX_ANISOTROPY_EXT, maxAniso);
	}
	
	if (mipMapping) gl.generateMipmap(gl.TEXTURE_2D);
	
	gl.bindTexture(gl.TEXTURE_2D, null);

	const w = ww / canvas.width, h = hh / canvas.height;
	const srcPoints = new Float32Array([ 0, 0,  0, h,  w, h,  w, 0 ]);	// bl, tl, tr, br
	const matrix = getMatrix4fv(srcPoints, anchors);
    this.matrix = matrix;
    this.srcPoints = srcPoints;
    this.bitmap = bitmap;
    // this.screenTexture = screenTexture;
				// this.resolve({ready:true});

	return {
		bitmap,
		matrix,
		srcPoints
	};
  }
  

}

export default Texture;

