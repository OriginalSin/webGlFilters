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
	uniform sampler2D texture;
	uniform float m[20];

	void main(void) {
		vec4 c = texture2D(texture, vUv);
		gl_FragColor.r = m[0] * c.r + m[1] * c.g + m[2] * c.b + m[3] * c.a + m[4];
		gl_FragColor.g = m[5] * c.r + m[6] * c.g + m[7] * c.b + m[8] * c.a + m[9];
		gl_FragColor.b = m[10] * c.r + m[11] * c.g + m[12] * c.b + m[13] * c.a + m[14];
		gl_FragColor.a = m[15] * c.r + m[16] * c.g + m[17] * c.b + m[18] * c.a + m[19];
	}
`;
const fss = `
	precision highp float;
	varying vec2 vUv;
	uniform sampler2D texture;
	uniform float m[20];

	void main(void) {
		vec4 c = texture2D(texture, vUv);
		gl_FragColor.r = m[0] * c.r + m[1] * c.g + m[2] * c.b + m[4];
		gl_FragColor.g = m[5] * c.r + m[6] * c.g + m[7] * c.b + m[9];
		gl_FragColor.b = m[10] * c.r + m[11] * c.g + m[12] * c.b + m[14];
		gl_FragColor.a = c.a;
	}
`;

class ColorMatrix extends Program {
    static chkFS(arr) {
		const m = new Float32Array(arr || [	// Create a Float32 Array and normalize the offset component to 0-1
			1, 0, 0, 0, 0,
			0, 1, 0, 0, 0,
			0, 0, 1, 0, 0,
			0, 0, 0, 1, 0
		]);
		m[4] /= 255;
		m[9] /= 255;
		m[14] /= 255;
		m[19] /= 255;

		// Can we ignore the alpha value? Makes things a bit faster.
		return {
			m,
			shader: (1==m[18]&&0==m[3]&&0==m[8]&&0==m[13]&&0==m[15]&&0==m[16]&&0==m[17]&&0==m[19]) ? fss : fss_alpha
		};
	};
    static getMatrix(pars, type) {
		let key = type.toLowerCase(), arr, v = pars.ImageFilters?.filters[key] || 0;
		switch(key) {
			case 'negative':
				v = -2;
			case 'contrast':
				v += 1;
				const o = -128 * (v - 1);
				
				arr = [
					v, 0, 0, 0, o,
					0, v, 0, 0, o,
					0, 0, v, 0, o,
					0, 0, 0, 1, 0
				];

				break;
			case 'brightness':
				const b = (v || 0) + 1;
				arr = [
					b, 0, 0, 0, 0,
					0, b, 0, 0, 0,
					0, 0, b, 0, 0,
					0, 0, 0, 1, 0
				];

				break;
			case 'desaturate':
				v = -1;
			case 'saturation':
				const x = (v || 0) * 2/3 + 1;
				const y = ((x-1) *-0.5);
				arr = [
					x, y, y, 0, 0,
					y, x, y, 0, 0,
					y, y, x, 0, 0,
					0, 0, 0, 1, 0
				];

				break;
			case 'hue':
				v = v / 180 * Math.PI;
				const cos = Math.cos(v), sin = Math.sin(v),
					lumR = 0.213, lumG = 0.715, lumB = 0.072;

				arr = [
					lumR + cos*(1-lumR) + sin*(-lumR),		lumG+cos*(-lumG)+sin*(-lumG),	lumB+cos*(-lumB)+sin*(1-lumB),	0,0,
					lumR + cos*(-lumR)  + sin*(0.143),		lumG+cos*(1-lumG)+sin*(0.140),	lumB+cos*(-lumB)+sin*(-0.283),	0,0,
					lumR + cos*(-lumR)  + sin*(-(1-lumR)),	lumG+cos*(-lumG)+sin*(lumG),	lumB+cos*(1-lumB)+sin*(lumB),	0,0,
					0, 0, 0, 1, 0
				];
				break;
			case 'desaturateluminance':
				arr = [
					0.2764723, 0.9297080, 0.0938197, 0, -37.1,
					0.2764723, 0.9297080, 0.0938197, 0, -37.1,
					0.2764723, 0.9297080, 0.0938197, 0, -37.1,
					0, 0, 0, 1, 0
				];
				break;
			case 'sepia':
				arr = [
					0.393, 0.7689999, 0.18899999, 0, 0,
					0.349, 0.6859999, 0.16799999, 0, 0,
					0.272, 0.5339999, 0.13099999, 0, 0,
					0,0,0,1,0
				];
				break;
			case 'brownie':
				arr = [
					0.5997023498159715,0.34553243048391263,-0.2708298674538042,0,47.43192855600873,
					-0.037703249837783157,0.8609577587992641,0.15059552388459913,0,-36.96841498319127,
					0.24113635128153335,-0.07441037908422492,0.44972182064877153,0,-7.562075277591283,
					0,0,0,1,0
				];
				break;
			case 'vintagepinhole':
				arr = [
					0.6279345635605994,0.3202183420819367,-0.03965408211312453,0,9.651285835294123,
					0.02578397704808868,0.6441188644374771,0.03259127616149294,0,7.462829176470591,
					0.0466055556782719,-0.0851232987247891,0.5241648018700465,0,5.159190588235296,
					0,0,0,1,0
				];
				break;
			case 'kodachrome':
				arr = [
					1.1285582396593525,-0.3967382283601348,-0.03992559172921793,0,63.72958762196502,
					-0.16404339962244616,1.0835251566291304,-0.05498805115633132,0,24.732407896706203,
					-0.16786010706155763,-0.5603416277695248,1.6014850761964943,0,35.62982807460946,
					0,0,0,1,0
				];
				break;
			case 'technicolor':
				arr = [
					1.9125277891456083,-0.8545344976951645,-0.09155508482755585,0,11.793603434377337,
					-0.3087833385928097,1.7658908555458428,-0.10601743074722245,0,-70.35205161461398,
					-0.231103377548616,-0.7501899197440212,1.847597816108189,0,30.950940869491138,
					0,0,0,1,0
				];
				break;
			case 'polaroid':
				arr = [
					1.438,-0.062,-0.062,0,0,
					-0.122,1.378,-0.122,0,0,
					-0.016,-0.016,1.483,0,0,
					0,0,0,1,0
				];
				break;
			case 'shifttobgr':
				arr = [
					0,0,1,0,0,
					0,1,0,0,0,
					1,0,0,0,0,
					0,0,0,1,0
				];
				break;
			default:
				break;
		}
console.warn('____', key, pars, arr);
		// return arr;
		return ColorMatrix.chkFS(arr);
	};

	constructor(opt) {
		opt.fsSource = fss_alpha;
		opt.type = opt.key;
		super(opt);
		// this.type = opt.key;
		// this.setMatrix(opt);

	}
    setMatrix(pars) {
		const {m, shader} = ColorMatrix.getMatrix(pars, this.type);
		this.m = m;
		this.fsSource = shader;
		// this.gl.deleteProgram(this.id);
	}

    apply(pars) {
		let { source, bitmap, target, params } = pars;
		this.setMatrix(params);
        // let parsData = params.ImageFilters;
		// if (parsData.changed.contrast) {
			// delete parsData.changed.contrast;
			// this.refreshProgram(parsData.filters.contrast);
		// }
		this.repaint(bitmap, source, target);
    }
    repaint(bitmap, source, target) {
        let gl = this.gl;
		// gl.linkProgram(this.id);
		gl.useProgram(this.id);

		this.bindBuffer(bitmap);
		gl.bindTexture(gl.TEXTURE_2D, source.texture);
		gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);	// make this the framebuffer we are rendering to.

    // Tell the shader the resolution of the framebuffer.
    // gl.uniform2f(resolutionLocation, bitmap.width, bitmap.height);

		gl.uniform1fv(this.uniform['m'].location, this.m);
    
		gl.drawArrays(gl.TRIANGLES, 0, 6);	// Draw the rectangle.
    }
}

export default ColorMatrix;

