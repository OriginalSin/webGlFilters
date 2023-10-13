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
*/
class ColorMatrix extends Program {

	constructor(opt, gl) {
		// opt.gl = gl;
		opt.fsSource = fss_alpha;
		super(opt);

	}

    init() {
        const gl = this.gl;
		const vs = Program.compileShader(gl, this.vsSource, gl.VERTEX_SHADER);
		const fs = Program.compileShader(gl, this.fsSource, gl.FRAGMENT_SHADER);
		const id = gl.createProgram();
		this.id = id;
		this.vs = vs;
		this.fs = fs;
		gl.attachShader(id, vs.shader);
		gl.attachShader(id, fs.shader);
		gl.linkProgram(id);

		if( !gl.getProgramParameter(id, gl.LINK_STATUS) ) {
			console.warn(gl.getProgramInfoLog(id));
		}
		gl.useProgram(id);
		
		[vs, fs].forEach(it => {
			const {source} = it;
			const pt = ['attribute', 'uniform'].reduce((a, c) => {
				const attr = Program.parseShaderSource(gl, source, c, id);
				// this._attribArrays.push(attr);
				a[c] = attr;
				return a;
			}, {});
			it.attribute = pt.attribute;
			it.uniform = pt.uniform;
		});

		// const { fsSource = fss_alpha} = opt;
// console.log(' __init____', this);

	}

    // bindBuffer() {
        // let gl = this.gl;
		// gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    // }
    // enableAttribArrays() {
        // let gl = this.gl;
		// const vertAttrib = this.vs.attribute['aVertCoord'].location;	// Find and set up the uniforms and attributes
		// gl.enableVertexAttribArray(vertAttrib);
		// gl.vertexAttribPointer(vertAttrib, 2, gl.FLOAT, false, 0, 0);
    // }
    // bindTexture() {
        // let gl = this.gl;
		// gl.activeTexture(gl.TEXTURE0);
		// gl.bindTexture(gl.TEXTURE_2D, this.texture.screenTexture);
		// const samplerUniform = this.fs.uniform['uSampler'].location;
		// gl.uniform1i(samplerUniform, 0);
    // }

    apply(pars) {
		let { source, bitmap, target, vertices } = pars;
        let gl = this.gl;
		gl.useProgram(this.id);
console.log(' __apply____', this, source, target);
		this.bindBuffer();
		this.enableAttribArrays();
		gl.bindTexture(gl.TEXTURE_2D, source.texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); 
			// gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);

		gl.bindFramebuffer(gl.FRAMEBUFFER, target);
// let histogramData = new Float32Array(_width * _height * 4);
// gl.readPixels(0, 0, _width, _height, gl.RGBA, gl.FLOAT, histogramData);

// if (!target) gl.uniformMatrix4fv(_currentProgram.uniform.uTransformMatrix, false, dataAttr._matrix4fv);
			// gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
			// gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
		gl.uniform1f(this.vs.uniform['flipY'].location, 1);
		// gl.uniform1f(this.vs.uniform.flipY, (flipY ? -1 : 1) );
		gl.drawArrays(gl.TRIANGLES, 0, 6);

/*
		let source = null, target = null, flipY = false;

		// Set up the source
		if( _drawCount == 0 ) {
			// First draw call - use the source texture
			source = _sourceTexture;
		}
		else {
			// All following draw calls use the temp buffer last drawn to
			source =  _getTempFramebuffer(_currentFramebufferIndex).texture;
		}
		_drawCount++;

		// Set up the target
		if( _lastInChain && !(flags & DRAW.INTERMEDIATE) ) {
			// Last filter in our chain - draw directly to the WebGL Canvas. We may
			// also have to flip the image vertically now
lastFBO = target;
			target = null;
			flipY = _drawCount % 2 == 0;
		} else {
			// Intermediate draw call - get a temp buffer to draw to
			_currentFramebufferIndex = (_currentFramebufferIndex+1) % 2;
			target = _getTempFramebuffer(_currentFramebufferIndex).fbo;
		}

		// Bind the source and target and draw the two triangles
		gl.bindTexture(gl.TEXTURE_2D, source);
		gl.bindFramebuffer(gl.FRAMEBUFFER, target);
// let histogramData = new Float32Array(_width * _height * 4);
// gl.readPixels(0, 0, _width, _height, gl.RGBA, gl.FLOAT, histogramData);

if (!target) gl.uniformMatrix4fv(_currentProgram.uniform.uTransformMatrix, false, dataAttr._matrix4fv);
		// gl.uniform1f(_currentProgram.uniform.flipY, (flipY ? -1 : 1) );
		gl.drawArrays(gl.TRIANGLES, 0, 6);
		*/
    }

}

export default ColorMatrix;

