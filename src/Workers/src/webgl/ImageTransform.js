import Program from './Program';
import Texture from './Texture';
import { getMatrix4fv, project } from './Matrix4fv.js';
import earcut from 'earcut';

const _getFlatten = ( rings ) => {
	return Array.isArray(rings[0]) ? rings.map(earcut.flatten) : [{ projected: true, dimensions: 2, holes: [], vertices: rings }];
};

const _getClipTriangles = ( clipPolygon, invMatrix ) => {
	let	_clipFlatten = _getFlatten(clipPolygon);

	var vertices = [];

	for (let i = 0, len = _clipFlatten.length; i < len; i++) {
		let data = _clipFlatten[i],
			len1 = data.vertices.length,
			projected = data.projected,
			size = data.dimensions;

		// if (projected) data._pixelClipPoints = data.vertices;
		// else {
			data._pixelClipPoints = new Array(len1);
			for (let j = 0; j < len1; j += size) {
				// let px = projected ? [data.vertices[j], data.vertices[j + 1]] : project(invMatrix, data.vertices[j], data.vertices[j + 1]);
				let px = project(invMatrix, data.vertices[j], data.vertices[j + 1]);
				data._pixelClipPoints[j] = px[0];
				data._pixelClipPoints[j + 1] = px[1];
			}
		// }
	}
	_clipFlatten.forEach(data => {
		let index = earcut(data.vertices, data.holes, data.dimensions);
		index.forEach(it => {
			let ind = 2 * it;
			vertices.push(data._pixelClipPoints[ind], data._pixelClipPoints[ind + 1]);
		});
	});
	return new Float32Array(vertices);
};

// const attributes = {
	// aVertCoord: 'aVertCoord', 				// полигон обрезки ()
// };
// const uniforms = {
	// uTransformMatrix: 'uTransformMatrix',	// матрица трансформации ()
	// uSampler: 'uSampler', 					// uSampler ()
// };
const vss = `
	attribute vec2 aVertCoord;
	uniform mat4 uTransformMatrix;
	varying vec2 vTextureCoord;
	void main(void) {
		vTextureCoord = aVertCoord;
		gl_Position = uTransformMatrix * vec4(aVertCoord, 0.0, 1.0);
	}
`;
const fss = `
	precision mediump float;
	varying vec2 vTextureCoord;
	uniform sampler2D uSampler;
	void main(void) {
		if (vTextureCoord.x < 0.0 || vTextureCoord.x > 1.0 || vTextureCoord.y < 0.0 || vTextureCoord.y > 1.0)
			discard;
		gl_FragColor = texture2D(uSampler, vTextureCoord);
	}
`;

class ImageTransform extends Program {

	constructor(opt) {
		opt.vsSource = vss;
		opt.fsSource = fss;
		super(opt);
		const { anchors, clipPolygon } = opt;
		this.anchors = anchors;
		this.clipPolygon = clipPolygon;
		this.texture = new Texture(opt);

	}

    init() {
        const gl = this.gl;

		const vs = Program.compileShader(gl, this.vsSource, gl.VERTEX_SHADER);
		const fs = Program.compileShader(gl, this.fsSource, gl.FRAGMENT_SHADER);
		const id = gl.createProgram();
		this.id = id;
		this.vs = vs;
		this.fs = fs;
			// this.vertexAttribDivisor = null;
		this._clipVertices = null;	// кэш обрезки
        this._attribArrays = [];

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
	}

  getUrl(url) {	// ??
	return this.texture.getUrl(url);
  }

    enableAttribArrays() {
        let gl = this.gl;
		const vertAttrib = this.vs.attribute['aVertCoord'].location;	// Find and set up the uniforms and attributes
		gl.enableVertexAttribArray(vertAttrib);
		gl.vertexAttribPointer(vertAttrib, 2, gl.FLOAT, false, 0, 0);
    }
    bindTexture(target) {
        let gl = this.gl;
		gl.activeTexture(gl.TEXTURE0);
		if (target) {
			gl.bindTexture(gl.TEXTURE_2D, target.texture);
			if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
				console.warn(gl.FRAMEBUFFER);
			  // these attachments don't work
			}
			const samplerUniform = this.fs.uniform['uSampler'].location;
			gl.uniform1i(samplerUniform, 0);
		} else {
			gl.bindTexture(gl.TEXTURE_2D, this.texture.screenTexture);
			const samplerUniform = this.fs.uniform['uSampler'].location;
			gl.uniform1i(samplerUniform, 0);
		}
    }
    apply(pars) {
		let { anchors, clipPolygon, source, target } = pars;
// console.log(' __apply____', this);
        let gl = this.gl;
		gl.useProgram(this.id);

		let	clipVertices = this._clipVertices;
		if (anchors) {
			const matrix = getMatrix4fv(this.texture.srcPoints, anchors);
			gl.uniformMatrix4fv(this.vs.uniform['uTransformMatrix'].location, false, matrix.matrix4fv);
			if (!clipVertices) {
				clipVertices = clipPolygon ?
					_getClipTriangles(clipPolygon, matrix.invMatrix) :
					_getClipTriangles(this.anchors, matrix.invMatrix);
				// clipVertices = _getClipTriangles(clipPolygon || this.anchors, matrix.invMatrix);
				this._clipVertices = clipVertices;
			}
		}

		if (clipVertices.length) {	// обрезка по полигону
			gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, clipVertices, gl.STATIC_DRAW);
		}

		this.enableAttribArrays();
		this.bindTexture(source);

		gl.drawArrays(gl.TRIANGLES, 0, clipVertices.length / 2);		// draw the triangles
		return this._clipVertices;	// vertex текстуры
    }

}

export default ImageTransform;

