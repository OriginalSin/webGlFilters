// import earcut from 'earcut';
// import { getMatrix4fv, project } from './Matrix4fv.js';
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
// const qualityOptions = { anisotropicFiltering: true, mipMapping: true, linearFiltering: true };
let	_anisoExt = null, srcPoints, matrix, glResources, gl;

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
							break;
						default:
							break;
					}
					progs.push(p);
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
// console.log(' ___ setParams ____', pars, glUtils.programsAttr);
	},

    redrawGl: function (pars) {
		let { anchors, clipPolygon } = pars;
		if (!gl) return;
		const progs = gl._nsgx.progs;
		const bitmap = gl._nsgx.bitmap;
		const screenTexture = gl._nsgx.screenTexture;

		gl.clearColor(0, 0, 0, 0);
		gl.viewport(0, 0, bitmap.width, bitmap.height);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		const lnum = progs.length - 1;
		let source = {texture: screenTexture}, target, vertices, params = glUtils.programsAttr;
		for (let i = 0; i < lnum; i++) {
			const p = progs[i];
			let nm = i % 2;
			let flipY = i % 2 == 1;
			target = Program.getTempFramebuffer(gl, bitmap, nm);

			p.apply({...pars, bitmap, source, target, params});

			source = target;
		}
		gl.bindTexture(gl.TEXTURE_2D, source.texture);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, gl._nsgx.screenSize.width, gl._nsgx.screenSize.height);
		progs[lnum].apply({...pars, source, vertices, bitmap});	// imagetransform
    },
};
export default glUtils;

