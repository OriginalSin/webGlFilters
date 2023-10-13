import transformVert from './shaders/transform/vert.glsl';
import transformFrag from './shaders/transform/frag.glsl';
import filterShaderVert from './shaders/filters/vert.glsl';
import filterShaderFrag from './shaders/filters/frag.glsl';
import rgbShader from './shaders/rgb/frag.glsl';
import rgbzamShader from './shaders/rgbzam/frag.glsl';
import convolutionShader from './shaders/convolution/frag.glsl';
import blurShader from './shaders/blur/frag.glsl';
import pixelateShader from './shaders/pixelate/frag.glsl';
import colorMatrixWith_alphaShader from './shaders/colorMatrix/fragWith_alpha.glsl';
import colorMatrixWithout_alphaShader from './shaders/colorMatrix/fragWithout_alpha.glsl';


var WebGLProgram = function( gl, vertexSource, fragmentSource ) {

	var _collect = function( source, prefix, collection ) {
		var r = new RegExp('\\b' + prefix + ' \\w+ (\\w+)', 'ig');
		source.replace(r, function(match, name) {
			collection[name] = 0;
			return match;
		});
	};

	var _compile = function( gl, source, type ) {
		var shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		if( !gl.getShaderParameter(shader, gl.COMPILE_STATUS) ) {
			console.log(gl.getShaderInfoLog(shader));
			return null;
		}
		return shader;
	};


	this.uniform = {};
	this.attribute = {};

	var _vsh = _compile(gl, vertexSource, gl.VERTEX_SHADER);
	var _fsh = _compile(gl, fragmentSource, gl.FRAGMENT_SHADER);

	this.id = gl.createProgram();
	gl.attachShader(this.id, _vsh);
	gl.attachShader(this.id, _fsh);
	gl.linkProgram(this.id);

	if( !gl.getProgramParameter(this.id, gl.LINK_STATUS) ) {
		console.log(gl.getProgramInfoLog(this.id));
	}

	gl.useProgram(this.id);

	// Collect attributes
	_collect(vertexSource, 'attribute', this.attribute);
	for( var a in this.attribute ) {
		this.attribute[a] = gl.getAttribLocation(this.id, a);
	}

	// Collect uniforms
	_collect(vertexSource, 'uniform', this.uniform);
	_collect(fragmentSource, 'uniform', this.uniform);
	for( var u in this.uniform ) {
		this.uniform[u] = gl.getUniformLocation(this.id, u);
	}
};

const DRAW = { INTERMEDIATE: 1 };
const shaders = {
	identity: { vert: filterShaderVert, frag: filterShaderVert },
	// identity: { vert: transformVert, frag: transformFrag },
	colorMatrix: { frag: colorMatrixWithout_alphaShader },
	colorMatrixAlpha: { frag: colorMatrixWith_alphaShader },
	convolution: { frag: convolutionShader },
	blur: { frag: blurShader },
	pixelate: { frag: pixelateShader },
	rgbzam: { frag: rgbzamShader },
	rgb: { frag: rgbShader },
};
const _compileShader = (fragmentSource, gl) => {
	let _currentProgram;
	if (_shaderProgramCache[fragmentSource]) {
		_currentProgram = _shaderProgramCache[fragmentSource];
		gl.useProgram(_currentProgram.id);
		return _currentProgram;
	}

	// Compile shaders
	_currentProgram = new WebGLProgram( gl, shaders.identity.vert, fragmentSource );
	// _currentProgram = new WebGLProgram( gl, SHADER.VERTEX_IDENTITY, fragmentSource );
// console.log('_currentProgram ______', _currentProgram);

	const floatSize = Float32Array.BYTES_PER_ELEMENT;
	const vertSize = 4 * floatSize;
	gl.enableVertexAttribArray(_currentProgram.attribute.pos);
	gl.vertexAttribPointer(_currentProgram.attribute.pos, 2, gl.FLOAT, false, vertSize , 0 * floatSize);
	// gl.enableVertexAttribArray(_currentProgram.attribute.uv);
	// gl.vertexAttribPointer(_currentProgram.attribute.uv, 2, gl.FLOAT, false, vertSize, 2 * floatSize);

	_shaderProgramCache[fragmentSource] = _currentProgram;
	return _currentProgram;
};
const colorMatrix = (matrix, gl, draw) => {
		var m = new Float32Array(matrix);
		m[4] /= 255;
		m[9] /= 255;
		m[14] /= 255;
		m[19] /= 255;

		// Can we ignore the alpha value? Makes things a bit faster.
		var shader = (1==m[18]&&0==m[3]&&0==m[8]&&0==m[13]&&0==m[15]&&0==m[16]&&0==m[17]&&0==m[19])
			? shaders.colorMatrix.frag
			: shaders.colorMatrixAlpha.frag;
		
		var program = _compileShader(shader, gl);
		gl.uniform1fv(program.uniform.m, m);
		draw();
};
const saturation = (amount, gl, draw) => {
	var x = (amount || 0) * 2/3 + 1;
	var y = ((x-1) *-0.5);
	colorMatrix([
		x, y, y, 0, 0,
		y, x, y, 0, 0,
		y, y, x, 0, 0,
		0, 0, 0, 1, 0
	], gl, draw);
};
const contrast = (amount, gl, draw) => {
	var v = (amount || 0) + 1;
	var o = -128 * (v-1);
	
	colorMatrix([
		v, 0, 0, 0, o,
		0, v, 0, 0, o,
		0, 0, v, 0, o,
		0, 0, 0, 1, 0
	], gl, draw);
};
const convolution = (matrix, gl, draw) => {
	var m = new Float32Array(matrix);
	var pixelSizeX = 1 / _width;
	var pixelSizeY = 1 / _height;

	var program = _compileShader(shaders.convolution.frag);
	gl.uniform1fv(program.uniform.m, m);
	gl.uniform2f(program.uniform.px, pixelSizeX, pixelSizeY);
	_draw();
};

export default {
	shaders,
	_filter: {
		colorMatrix,					// Color Matrix Filter
			var m = new Float32Array(matrix);
			m[4] /= 255;
			m[9] /= 255;
			m[14] /= 255;
			m[19] /= 255;

			// Can we ignore the alpha value? Makes things a bit faster.
			var shader = (1==m[18]&&0==m[3]&&0==m[8]&&0==m[13]&&0==m[15]&&0==m[16]&&0==m[17]&&0==m[19])
				? shaders.colorMatrix.frag
				: shaders.colorMatrixAlpha.frag;
			
			var program = _compileShader(shader, gl);
			gl.uniform1fv(program.uniform.m, m);
			draw();
		},
		brightness: (brightness, gl, draw) => {
			// console.log(_filter);
			var b = (brightness || 0) + 1;
			colorMatrix([
					b, 0, 0, 0, 0,
					0, b, 0, 0, 0,
					0, 0, b, 0, 0,
					0, 0, 0, 1, 0
			], gl, draw);
		},
		contrast,
		saturation,
		desaturate: (gl, draw) => {
			saturation(-1, gl, draw);
		},
		negative: (gl, draw) => {
			contrast(-2, gl, draw);
		},
		hue: (rotation, gl, draw) => {
			rotation = (rotation || 0)/180 * Math.PI;
			var cos = Math.cos(rotation),
				sin = Math.sin(rotation),
				lumR = 0.213,
				lumG = 0.715,
				lumB = 0.072;

			colorMatrix([
				lumR+cos*(1-lumR)+sin*(-lumR),lumG+cos*(-lumG)+sin*(-lumG),lumB+cos*(-lumB)+sin*(1-lumB),0,0,
				lumR+cos*(-lumR)+sin*(0.143),lumG+cos*(1-lumG)+sin*(0.140),lumB+cos*(-lumB)+sin*(-0.283),0,0,
				lumR+cos*(-lumR)+sin*(-(1-lumR)),lumG+cos*(-lumG)+sin*(lumG),lumB+cos*(1-lumB)+sin*(lumB),0,0,
				0, 0, 0, 1, 0
			], gl, draw);
		},
		desaturateLuminance: (gl, draw) => {
			colorMatrix([
				0.2764723, 0.9297080, 0.0938197, 0, -37.1,
				0.2764723, 0.9297080, 0.0938197, 0, -37.1,
				0.2764723, 0.9297080, 0.0938197, 0, -37.1,
				0, 0, 0, 1, 0
			], gl, draw);
		},
		sepia: (gl, draw) => {
			colorMatrix([
				0.393, 0.7689999, 0.18899999, 0, 0,
				0.349, 0.6859999, 0.16799999, 0, 0,
				0.272, 0.5339999, 0.13099999, 0, 0,
				0,0,0,1,0
			], gl, draw);
		},
		brownie: (gl, draw) => {
			colorMatrix([
				0.5997023498159715,0.34553243048391263,-0.2708298674538042,0,47.43192855600873,
				-0.037703249837783157,0.8609577587992641,0.15059552388459913,0,-36.96841498319127,
				0.24113635128153335,-0.07441037908422492,0.44972182064877153,0,-7.562075277591283,
				0,0,0,1,0
			], gl, draw);
		},
		vintagePinhole: (gl, draw) => {
			colorMatrix([
				0.6279345635605994,0.3202183420819367,-0.03965408211312453,0,9.651285835294123,
				0.02578397704808868,0.6441188644374771,0.03259127616149294,0,7.462829176470591,
				0.0466055556782719,-0.0851232987247891,0.5241648018700465,0,5.159190588235296,
				0,0,0,1,0
			], gl, draw);
		},
		kodachrome: (gl, draw) => {
			colorMatrix([
				1.1285582396593525,-0.3967382283601348,-0.03992559172921793,0,63.72958762196502,
				-0.16404339962244616,1.0835251566291304,-0.05498805115633132,0,24.732407896706203,
				-0.16786010706155763,-0.5603416277695248,1.6014850761964943,0,35.62982807460946,
				0,0,0,1,0
			], gl, draw);
		},
		technicolor: (gl, draw) => {
			colorMatrix([
				1.9125277891456083,-0.8545344976951645,-0.09155508482755585,0,11.793603434377337,
				-0.3087833385928097,1.7658908555458428,-0.10601743074722245,0,-70.35205161461398,
				-0.231103377548616,-0.7501899197440212,1.847597816108189,0,30.950940869491138,
				0,0,0,1,0
			], gl, draw);
		},
		polaroid: (gl, draw) => {
			colorMatrix([
				1.438,-0.062,-0.062,0,0,
				-0.122,1.378,-0.122,0,0,
				-0.016,-0.016,1.483,0,0,
				0,0,0,1,0
			], gl, draw);
		},
		shiftToBGR: (gl, draw) => {
			colorMatrix([
				0,0,1,0,0,
				0,1,0,0,0,
				1,0,0,0,0,
				0,0,0,1,0
			], gl, draw);
		},
		convolution,					// Convolution Filter
		detectEdges: (gl, draw) => {
			convolution([
				0, 1, 0,
				1, -4, 1,
				0, 1, 0
			], gl, draw);
		},
		sobelX: (gl, draw) => {
			convolution([
				-1, 0, 1,
				-2, 0, 2,
				-1, 0, 1
			], gl, draw);
		},
		sobelY: (gl, draw) => {
			convolution([
				-1, -2, -1,
				 0,  0,  0,
				 1,  2,  1
			], gl, draw);
		},
		sharpen: (amount, gl, draw) => {
			var a = amount || 1;
			convolution([
				0, -1*a, 0,
				-1*a, 1 + 4*a, -1*a,
				0, -1*a, 0
			], gl, draw);
		},
		emboss: (size, gl, draw) => {
			var s = size || 1;
			convolution([
				-2*s, -1*s, 0,
				-1*s, 1, 1*s,
				0, 1*s, 2*s
			], gl, draw);
		},
	
		blur: (size, gl, draw) => {		// Blur Filter
			var blurSizeX = (size/7) / _width;
			var blurSizeY = (size/7) / _height;

			var program = _compileShader(shaders.blur.frag);

			// Vertical
			gl.uniform2f(program.uniform.px, 0, blurSizeY);
			_draw(DRAW.INTERMEDIATE);

			// Horizontal
			gl.uniform2f(program.uniform.px, blurSizeX, 0);
			_draw();
		},
		pixelate: (size, gl, draw) => {	// Pixelate Filter

			var blurSizeX = (size) / _width;
			var blurSizeY = (size) / _height;

			var program = _compileShader(shaders.pixelate.frag);

			// Horizontal
			gl.uniform2f(program.uniform.size, blurSizeX, blurSizeY);
			draw();
		},
		rgbzam: (zam = {r: 0, g: 1, b: 2}, gl, draw) => {	// Filter rgbzam замена цвета на другой
			let program = _compileShader(shaders.rgbzam.frag);
			gl.uniform1i(program.uniform.rzam, zam.r);
			gl.uniform1i(program.uniform.gzam, zam.g);
			gl.uniform1i(program.uniform.bzam, zam.b);
			draw();
		},
		rgb: (
			band = {
				r:{min: 0, max: 1},
				g:{min: 0, max: 1},
				b:{min: 0, max: 1},
				all:{min: 0, max: 1}
			}, gl, draw) => {			// Filter RGB обрезка

			let program = _compileShader(shaders.rgb.frag);
			gl.uniform2f(program.uniform.rband, band.r.min, band.r.max);
			gl.uniform2f(program.uniform.gband, band.g.min, band.g.max);
			gl.uniform2f(program.uniform.bband, band.b.min, band.b.max);
			draw();
		}
	}
}




};

