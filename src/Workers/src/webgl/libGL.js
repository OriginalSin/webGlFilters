import earcut from 'earcut';
import { getMatrix4fv, project } from './Matrix4fv.js';
import ImageTransform from './ImageTransform';
import ColorMatrix from './ColorMatrix';
import Brightness from './Brightness';
import Contrast from './Contrast';
import Saturation from './Saturation';
import RgbChange from './RgbChange';
import Rgb from './Rgb';
import Program from './Program';

// import ImageFilter from './ImageFilter.js'
// import PolylineRender from './gmx/PolygonsRender.js'
// import PolygonsRender from './gmx/PolygonsRender.js'
// import './viewer.css';
// console.log('gmxWebGL', PolylineRender, gmxWebGL);
// let tileRender = new PolylineRender();

const glOpts = { antialias: true, depth: false, preserveDrawingBuffer: true };
const qualityOptions = { anisotropicFiltering: true, mipMapping: true, linearFiltering: true };
let	_anisoExt = null, srcPoints, matrix, glResources, gl;
/*
const _tempFramebuffers = [null, null];
  // create 2 textures and attach them to framebuffers.

let _currentFramebufferIndex = -1;
	const _getTempFramebuffer = (gl, bitmap, index) => {
		_tempFramebuffers[index] = _tempFramebuffers[index] ||  _createFramebufferTexture(gl, bitmap);
		return _tempFramebuffers[index];
	};

	const _createFramebufferTexture = (gl, bitmap) => {
		let fbo = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

		let renderbuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);

		let texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		// gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.canvas.width, gl.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, bitmap.width, bitmap.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		return {fbo, texture};
	};
*/
const glUtils = {
	programsAttr: {
	},
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
				const screenSize = {
					width: canvas.width, height: canvas.height
				};
				let progs = [];
				programs.forEach(info => {
					let key = info.key.toLowerCase(),
						// out = glUtils.programsAttr[key] || {},
						p;
					switch (key) {
						case 'rgb':
							p = new Rgb({...info, gl});
							break;
						case 'rgbchange':
							p = new RgbChange({...info, gl});
							break;
						case 'saturation':
							p = new Saturation({...info, gl});
							break;
						case 'contrast':
							p = new Contrast({...info, gl});
							break;
						case 'brightness':
							p = new Brightness({...info, gl});
							// progs.push(p);
							break;
						case 'colormatrix':
							p = new ColorMatrix({...info, gl});
							break;
						case 'imagetransform':
							p = new ImageTransform({...info, gl, resolve});
							// if (p.vs.shader && p.fs.shader) {
								if (info.url) {
									p.getUrl().then(pt => {
										gl._nsgx.bitmap = p.texture.bitmap;
										gl._nsgx.screenTexture = p.texture.screenTexture;
										const { width, height } = p.texture.bitmap;
										// canvas.width = width, canvas.height = height;
		// gl.viewport(0, 0, width, height);

										resolve({ready:true});
									});
								}
								// p.vertexBuffer = gl.createBuffer();		// Create a buffer to hold the vertices
								// progs.push(p);
							// }
							break;
						default:
							break;
					}
					progs.push(p);
					// glUtils.programsAttr[key] = {...out, info, p }; 
				});
				gl._nsgx = {screenSize, canvas, progs};
			} else {
				console.warn('Your browser doesn`t seem to support WebGL.');
			}
		});
		return out;
	},

    setParams: function (pars) {
		const { anchors, clipPolygon, cmd, filters } = pars;
		if (cmd === 'ImageFilters') {
			const prev = glUtils.programsAttr[cmd] || {};
			const changed = prev.changed || {};
			Object.entries(filters).forEach(([k, v]) => {
				if (v !== prev[k]) changed[k] = true;
			});
			glUtils.programsAttr[cmd] = {filters, changed};
			if (Object.keys(changed).length) glUtils.redrawGl({});
		}
console.log(' ___ setParams ____', pars, glUtils.programsAttr);
	},

    redrawGl: function (pars) {
		let { anchors, clipPolygon } = pars;
		if (!gl) return;
		const progs = gl._nsgx.progs;
		const bitmap = gl._nsgx.bitmap;
		const screenTexture = gl._nsgx.screenTexture;
/*
var textures = [];
var framebuffers = [];
for (var ii = 0; ii < 2; ++ii) {
    var texture = Program.createAndSetupTexture(gl);
    textures.push(texture);

    // make the texture the same size as the image
    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, bitmap.width, bitmap.height, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, null);

    // Create a framebuffer
    var fbo = gl.createFramebuffer();
    framebuffers.push(fbo);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // Attach a texture to it.
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
}
*/
		gl.clearColor(0, 0, 0, 0);
		gl.viewport(0, 0, bitmap.width, bitmap.height);

		// gl.viewport(0, 0, offscreen.width, offscreen.height);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		const lnum = progs.length - 1;
		let source = {texture: screenTexture}, target, vertices, params = glUtils.programsAttr;
		for (let i = 0; i < lnum; i++) {
			const p = progs[i];
			let nm = i % 2;
			let flipY = i % 2 == 1;
			target = Program.getTempFramebuffer(gl, bitmap, nm);

			// let fbo = framebuffers[nm];
			// let texture = textures[nm];
			p.apply({...pars, bitmap, source, target, flipY, params});
			// p.apply({...pars, bitmap, source, fbo, texture, flipY});
		// Bind the source and target and draw the two triangles
		// gl.bindTexture(gl.TEXTURE_2D, source);
		// gl.bindFramebuffer(gl.FRAMEBUFFER, target);


		// progs.forEach((p, i) => {
			// _currentFramebufferIndex = (_currentFramebufferIndex+1) % 2;
			// target = _getTempFramebuffer(gl, bitmap, _currentFramebufferIndex);
			// p.apply({...pars, bitmap, source, target});
			// if (!vertices) vertices = p._clipVertices;
			// if (!bitmap) bitmap = p.texture.bitmap;
			source = target;
			// source = _getTempFramebuffer(gl, _currentFramebufferIndex).texture;
console.log(' ___  ____', gl._nsgx.canvas);
		}
		// Bind the source and target and draw the two triangles
		gl.bindTexture(gl.TEXTURE_2D, source.texture);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, gl._nsgx.screenSize.width, gl._nsgx.screenSize.height);
		progs[lnum].apply({...pars, source, vertices, bitmap});	// imagetransform

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

