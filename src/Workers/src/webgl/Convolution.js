import Program from './Program';
import Texture from './Texture';

const fss = `
	precision highp float;
	varying vec2 vUv;
	uniform sampler2D texture;
	uniform vec2 px;
	uniform float m[9];

	void main(void) {
		vec4 c11 = texture2D(texture, vUv - px); // top left
		vec4 c12 = texture2D(texture, vec2(vUv.x, vUv.y - px.y)); // top center
		vec4 c13 = texture2D(texture, vec2(vUv.x + px.x, vUv.y - px.y)); // top right

		vec4 c21 = texture2D(texture, vec2(vUv.x - px.x, vUv.y) ); // mid left
		vec4 c22 = texture2D(texture, vUv); // mid center
		vec4 c23 = texture2D(texture, vec2(vUv.x + px.x, vUv.y) ); // mid right

		vec4 c31 = texture2D(texture, vec2(vUv.x - px.x, vUv.y + px.y) ); // bottom left
		vec4 c32 = texture2D(texture, vec2(vUv.x, vUv.y + px.y) ); // bottom center
		vec4 c33 = texture2D(texture, vUv + px ); // bottom right

		gl_FragColor = 
			c11 * m[0] + c12 * m[1] + c22 * m[2] +
			c21 * m[3] + c22 * m[4] + c23 * m[5] +
			c31 * m[6] + c32 * m[7] + c33 * m[8];
		gl_FragColor.a = c22.a;
	}
`;

class Convolution extends Program {
    static getMatrix(pars, type) {
		let key = type.toLowerCase(), arr, v = pars.ImageFilters?.filters[key] || 1;
		switch(key) {
			case 'sharpen':
				arr = [
					0, -1*v, 0,
					-1*v, 1 + 4*v, -1*v,
					0, -1*v, 0
				];
				break;
			case 'emboss':
				arr = [
					-2*v, -1*v, 0,
					-1*v, 1, 1*v,
					0, 1*v, 2*v
				];
				break;
			case 'detectedges':
				arr = [
					0, 1, 0,
					1, -4, 1,
					0, 1, 0
				];
				break;
			case 'sobelx':
				arr = [
					-1, 0, 1,
					-2, 0, 2,
					-1, 0, 1
				];
				break;
			case 'sobely':
				arr = [
					-1, -2, -1,
					 0,  0,  0,
					 1,  2,  1
				];
				break;
			default:
				break;
		}
console.warn('____', key, pars, arr);
		// return arr;
		return {m: new Float32Array(arr), shader: fss};
	};

	constructor(opt) {
		opt.fsSource = fss;
		opt.type = opt.key;
		super(opt);
		// this.type = opt.key;
		// this.setMatrix(opt);

	}
    setMatrix(pars) {
		const {m, shader} = Convolution.getMatrix(pars, this.type);
		this.m = m;
		this.fsSource = shader;
		// this.gl.deleteProgram(this.id);
	}

    apply(pars) {
		let { source, bitmap, target, params } = pars;
		this.setMatrix(params);

		this.repaint(bitmap, source, target);
    }
    repaint(bitmap, source, target) {
        let gl = this.gl;
		// gl.linkProgram(this.id);
		gl.useProgram(this.id);

		this.bindBuffer(bitmap);
		gl.bindTexture(gl.TEXTURE_2D, source.texture);
		gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);	// make this the framebuffer we are rendering to.

		gl.uniform1fv(this.uniform['m'].location, this.m);
 		gl.uniform2f(this.uniform.px.location, 1/bitmap.width, 1/bitmap.height);
   
		gl.drawArrays(gl.TRIANGLES, 0, 6);	// Draw the rectangle.
    }
}

export default Convolution;

