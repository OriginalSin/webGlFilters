import Program from './Program';
import Texture from './Texture';

const attributes = {
	// aVertCoord: 'aVertCoord', 				// полигон обрезки ()
};
const uniforms = {
	m: 'm',								// матрица трансформации ()
	texture: 'texture', 					// uSampler ()
};
const fss_alpha = `
	precision highp float;
	varying vec2 vUv;
	uniform sampler2D ${uniforms.texture};
	uniform float ${uniforms.m}[20];

	void main(void) {
		vec4 c = texture2D(${uniforms.texture}, vUv);
		gl_FragColor.r = m[0] * c.r + m[1] * c.g + m[2] * c.b + m[3] * c.a + m[4];
		gl_FragColor.g = m[5] * c.r + m[6] * c.g + m[7] * c.b + m[8] * c.a + m[9];
		gl_FragColor.b = m[10] * c.r + m[11] * c.g + m[12] * c.b + m[13] * c.a + m[14];
		gl_FragColor.a = m[15] * c.r + m[16] * c.g + m[17] * c.b + m[18] * c.a + m[19];
	}
`;
const fss = `
	precision highp float;
	varying vec2 vUv;
	uniform sampler2D ${uniforms.texture};
	uniform float ${uniforms.m}[20];

	void main(void) {
		vec4 c = texture2D(${uniforms.texture}, vUv);
		gl_FragColor.r = m[0] * c.r + m[1] * c.g + m[2] * c.b + m[4];
		gl_FragColor.g = m[5] * c.r + m[6] * c.g + m[7] * c.b + m[9];
		gl_FragColor.b = m[10] * c.r + m[11] * c.g + m[12] * c.b + m[14];
		gl_FragColor.a = c.a;
	}
`;
/*
	_filter.colorMatrix = function( matrix ) {
		// Create a Float32 Array and normalize the offset component to 0-1
		var m = new Float32Array(matrix);
		m[4] /= 255;
		m[9] /= 255;
		m[14] /= 255;
		m[19] /= 255;

		// Can we ignore the alpha value? Makes things a bit faster.
		var shader = (1==m[18]&&0==m[3]&&0==m[8]&&0==m[13]&&0==m[15]&&0==m[16]&&0==m[17]&&0==m[19])
			? _filter.colorMatrix.SHADER.WITHOUT_ALPHA
			: _filter.colorMatrix.SHADER.WITH_ALPHA;
		
		var program = _compileShader(shader);
		gl.uniform1fv(program.uniform.m, m);
		_draw();
	};

	_filter.colorMatrix.SHADER = {};
	_filter.colorMatrix.SHADER.WITH_ALPHA = colorMatrixWith_alphaShader;
	_filter.colorMatrix.SHADER.WITHOUT_ALPHA = colorMatrixWithout_alphaShader;

	function chkFS( matrix ) {
console.log(' ___ chkFS ____', matrix);
		matrix = matrix || [
			1, 0, 0, 0, 0,
			0, 1, 0, 0, 0,
			0, 0, 1, 0, 0,
			0, 0, 0, 1, 0
		];
		// Create a Float32 Array and normalize the offset component to 0-1
		var m = new Float32Array(matrix);
		m[4] /= 255;
		m[9] /= 255;
		m[14] /= 255;
		m[19] /= 255;

		// Can we ignore the alpha value? Makes things a bit faster.
		return {
			m,
			shader: (1==m[18]&&0==m[3]&&0==m[8]&&0==m[13]&&0==m[15]&&0==m[16]&&0==m[17]&&0==m[19]) ? fss : fss_alpha
		}
				
		
		// var program = _compileShader(shader);
		// gl.uniform1fv(program.uniform.m, m);
		// _draw();
	};
*/


class ColorMatrix extends Program {
    static chkFS(matrix) {
// console.log(' ___ chkFS ____', matrix);
		matrix = matrix || [
			1, 0, 0, 0, 0,
			0, 1, 0, 0, 0,
			0, 0, 1, 0, 0,
			0, 0, 0, 1, 0
		];
		// Create a Float32 Array and normalize the offset component to 0-1
		var m = new Float32Array(matrix);
		m[4] /= 255;
		m[9] /= 255;
		m[14] /= 255;
		m[19] /= 255;

		// Can we ignore the alpha value? Makes things a bit faster.
		return {
			m,
			shader: (1==m[18]&&0==m[3]&&0==m[8]&&0==m[13]&&0==m[15]&&0==m[16]&&0==m[17]&&0==m[19]) ? fss : fss_alpha
		};
				
		
		// var program = _compileShader(shader);
		// gl.uniform1fv(program.uniform.m, m);
		// _draw();
	};

	constructor(opt, gl) {
		const {m, shader} = ColorMatrix.chkFS(opt.value);
		// opt.gl = gl;
		opt.m = m;
		opt.fsSource = shader;
		super(opt);

	}

    apply(pars) {
		let { source, bitmap, target, vertices, fbo, texture, flipY } = pars;
        let gl = this.gl;
		gl.useProgram(this.id);
console.log(' __apply____', this, source, target);
		// this.bindBuffer(bitmap);
		  var texcoordBuffer = gl.createBuffer();
		  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
		  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
				-1, -1, 0, 1,  1, -1, 1, 1,  -1, 1, 0, 0,
				-1, 1, 0, 0,  1, -1, 1, 1,  1, 1, 1, 0
		  ]), gl.STATIC_DRAW);
  var originalImageTexture = Program.createAndSetupTexture(gl);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
    // make this the framebuffer we are rendering to.
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // Tell the shader the resolution of the framebuffer.
    // gl.uniform2f(resolutionLocation, bitmap.width, bitmap.height);

    // Tell webgl the viewport setting needed for framebuffer.
    gl.viewport(0, 0, bitmap.width, bitmap.height);
    // gl.uniform1fv(kernelLocation, kernels[name]);
    // gl.uniform1f(kernelWeightLocation, computeKernelWeight(kernels[name]));
		this.enableAttribArrays();
gl.uniform1fv(this.fs.uniform['m'].location, this.m);
gl.uniform1f(this.vs.uniform['flipY'].location, (flipY ? -1 : 1) );

    // Draw the rectangle.
		gl.drawArrays(gl.TRIANGLES, 0, 6);

    }
}

export default ColorMatrix;

