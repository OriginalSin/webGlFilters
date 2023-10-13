import { getMatrix4fv, project } from './Matrix4fv.js';

const attributes = {
	pos: 'pos', 							// полигон обрезки ()
	uv: 'uv', 							// полигон обрезки ()
};
const uniforms = {
	flipY: 'flipY',	// матрица трансформации ()
	texture: 'texture', 					// uSampler ()
};
const vertices = new Float32Array([
	-1, -1, 0, 1,  1, -1, 1, 1,  -1, 1, 0, 0,
	-1, 1, 0, 0,  1, -1, 1, 1,  1, 1, 1, 0
]);
const floatSize = Float32Array.BYTES_PER_ELEMENT;
const vertSize = 4 * floatSize;

const vss = `
	precision highp float;
	attribute vec2 ${attributes.pos};
	attribute vec2 ${attributes.uv};
	varying vec2 vUv;
	uniform float ${uniforms.flipY};

	void main(void) {
		vUv = uv;
		gl_Position = vec4(${attributes.pos}.x, ${attributes.pos}.y*${uniforms.flipY}, 0.0, 1.);
	}
`;
const fss = `
	precision highp float;
	varying vec2 vUv;
	uniform sampler2D ${uniforms.texture};

	void main(void) {
		gl_FragColor = texture2D(${uniforms.texture}, vUv);
	}
`;

class Program {
	static compileShader( gl, source, type ) {
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		if( !gl.getShaderParameter(shader, gl.COMPILE_STATUS) ) {
			console.warn(gl.getShaderInfoLog(shader));
			return null;
		}
		return {shader, source};
	}
	static parseShaderSource( gl, source, prefix, id ) {
		const r = new RegExp('\\b' + prefix + ' (\\w+) (\\w+)', 'ig');
		return [...source.matchAll(r)].reduce((a, c) => {
			const [st, type, name] = c;
			const location = prefix === 'uniform' ? gl.getUniformLocation(id, name) : gl.getAttribLocation(id, name);
			if (location === -1) console.warn(`Параметр "${name}" не используется`);
			a[name] = { location, type };
			return a;
		}, {});
	}

	constructor(opt) {
		const { vsSource = vss, fsSource = fss, gl, anchors, clipPolygon } = opt;
		this.gl = gl;
		this.vsSource = vsSource;
		this.fsSource = fsSource;
        this.vertexBuffer = gl.createBuffer();		// Create a buffer to hold the vertices
		this.init();


	}

    init() {
        const gl = this.gl;

		const vs = Program.compileShader(gl, this.vsSource, gl.VERTEX_SHADER);
		const fs = Program.compileShader(gl, this.fsSource, gl.FRAGMENT_SHADER);
		const id = gl.createProgram();
		this.id = id;
		this.vs = vs;
		this.fs = fs;
	}

    bindBuffer() {
        let gl = this.gl;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
			// _vertexBuffer = gl.createBuffer(),
			// gl.bindBuffer(gl.ARRAY_BUFFER, _vertexBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
			// Note sure if this is a good idea; at least it makes texture loading
			// in Ejecta instant.
			gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
console.log(' __ bindBuffer ____', vertices);

    }
    enableAttribArrays() {
        let gl = this.gl;
		const vertAttrib = this.vs.attribute['pos'].location;	// Find and set up the uniforms and attributes
		gl.enableVertexAttribArray(vertAttrib);
		gl.vertexAttribPointer(vertAttrib, 2, gl.FLOAT, false, vertSize , 0);
		// gl.vertexAttribPointer(vertAttrib, 2, gl.FLOAT, false, 0, 0);
		const uv = this.vs.attribute['uv'].location;	// Find and set up the uniforms and attributes
		gl.enableVertexAttribArray(uv);
		gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, vertSize, 2 * floatSize);
    }
    bindTexture() {
        let gl = this.gl;
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.texture.screenTexture);
		const samplerUniform = this.fs.uniform['texture'].location;
		gl.uniform1i(samplerUniform, 0);
    }

    apply() {
        let gl = this.gl;
		gl.useProgram(this.id);
console.log(' __apply____', this);


    }

}

export default Program;

