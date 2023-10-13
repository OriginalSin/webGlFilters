import earcut from 'earcut';
import { getMatrix4fv, project } from './Matrix4fv.js';
import ImageTransform from './ImageTransform';
import ColorMatrix from './ColorMatrix';

// import ImageFilter from './ImageFilter.js'
// import PolylineRender from './gmx/PolygonsRender.js'
// import PolygonsRender from './gmx/PolygonsRender.js'
// import './viewer.css';
// console.log('gmxWebGL', PolylineRender, gmxWebGL);
// let tileRender = new PolylineRender();

const glOpts = { antialias: true, depth: false, preserveDrawingBuffer: true };
const qualityOptions = { anisotropicFiltering: true, mipMapping: true, linearFiltering: true };
let	_anisoExt = null, srcPoints, matrix, glResources, gl;

const _tempFramebuffers = [null, null];
let _currentFramebufferIndex = -1;
	const _getTempFramebuffer = (gl, index) => {
		_tempFramebuffers[index] = _tempFramebuffers[index] ||  _createFramebufferTexture(gl);
		return _tempFramebuffers[index];
	};

	const _createFramebufferTexture = (gl) => {
		let fbo = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

		let renderbuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);

		let texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.canvas.width, gl.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		return {fbo, texture};
	};

const glUtils = {
	createGL: (pars) => {
		const {canvas, programs=[]} = pars;
		return new Promise(resolve => {
			gl =
				canvas.getContext('webgl', glOpts) ||
				canvas.getContext('experimental-webgl', glOpts);
			const out = {gl};
			if(gl) {
				_anisoExt =
					gl.getExtension('EXT_texture_filter_anisotropic') ||
					gl.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
					gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');

				if(!_anisoExt) {
					console.warn('Your browser doesn`t support anisotropic filtering.  Ordinary MIP mapping will be used.');
				}

				gl.viewport(0, 0, canvas.width, canvas.height);
				gl._nsgx = {};
				let progs = [];
				programs.forEach(pInfo => {
					let key = pInfo.key;
					if (key === 'ImageTransform') {
						let p = new ImageTransform({...pInfo, gl, resolve});
						if (p.vs.shader && p.fs.shader) {
							if (pInfo.url) {
								p.getUrl().then(pt => resolve({ready:true}));
							}
							// p.vertexBuffer = gl.createBuffer();		// Create a buffer to hold the vertices
							progs.push(p);
						}
					} else if (key === 'ColorMatrix') {
						let p = new ColorMatrix({...pInfo, gl});
						progs.push(p);
					}
				});
				gl._nsgx = {progs};
			} else {
				console.warn('Your browser doesn`t seem to support WebGL.');
			}
		});
		return out;
	},

    redrawGl: function (pars) {
		let { anchors, clipPolygon } = pars;

		gl.clearColor(0, 0, 0, 0);
		// gl.viewport(0, 0, offscreen.width, offscreen.height);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		const progs = gl._nsgx.progs;
		const lnum = progs.length - 1;
		let source, target, vertices, bitmap;
		for (let i = 0; i < lnum; i++) {
			const p = progs[i];
		// progs.forEach((p, i) => {
			_currentFramebufferIndex = (_currentFramebufferIndex+1) % 2;
			target = _getTempFramebuffer(gl, _currentFramebufferIndex);
			p.apply({...pars, source, target});
			if (!vertices) vertices = p._clipVertices;
			if (!bitmap) bitmap = p.texture.bitmap;
			source = target;
			// source = _getTempFramebuffer(gl, _currentFramebufferIndex).texture;
console.log(' ___  ____', p);
		}
		progs[lnum].apply({...pars, source, vertices, bitmap});

/*
		const p0 = progs.ImageTransform;
		const texture = p0.texture;
		// const vertAttrib = p0.vs.attribute['aVertCoord'].location;	// Find and set up the uniforms and attributes
		// const samplerUniform = p0.fs.uniform['uSampler'].location;
		const transMatUniform = p0.vs.uniform['uTransformMatrix'].location;
	// srcPoints = p0.texture.srcPoints;
	// matrix = p0.texture.matrix;

		gl.useProgram(p0.id);

		p0.bindBuffer();
			// gl.bindBuffer(gl.ARRAY_BUFFER, p0.vertexBuffer);
		p0.enableAttribArrays();
			// gl.enableVertexAttribArray(vertAttrib);
			// gl.vertexAttribPointer(vertAttrib, 2, gl.FLOAT, false, 0, 0);

		p0.bindTexture();
			// gl.activeTexture(gl.TEXTURE0);
			// gl.bindTexture(gl.TEXTURE_2D, texture.screenTexture);
			// gl.uniform1i(samplerUniform, 0);

console.log(' ___ _ringToPixels ____', gl._nsgx);
		const matrix = getMatrix4fv(texture.srcPoints, anchors);
		gl.uniformMatrix4fv(transMatUniform, false, matrix.matrix4fv);

		let	clipVertices = gl._nsgx._clipVertices || _getClipTriangles(clipPolygon || anchors, matrix.invMatrix);
// console.log(' ___ _ringToPixels ____', gl._nsgx._clipVertices);
		gl._nsgx._clipVertices = clipVertices;

		if (clipVertices.length) {	// обрезка по полигону
			gl.bindBuffer(gl.ARRAY_BUFFER, p0.vertexBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, clipVertices, gl.STATIC_DRAW);
		}
		gl.drawArrays(gl.TRIANGLES, 0, clipVertices.length / 2);		// draw the triangles
		*/
    },
};
export default glUtils;

