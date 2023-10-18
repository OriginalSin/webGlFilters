import Program from './Program';
// import Texture from './Texture';

const fss = `
	precision highp float;
	varying vec2 vUv;
	uniform int rzam;
	uniform int gzam;
	uniform int bzam;
	uniform sampler2D texture;

	float getcol(vec4 c, int i) {
		if (i == 0) return c[0];
		else if (i == 1) return c[1];
		return c[2];
	}

	void main(void) {
		gl_FragColor = texture2D(texture, vUv);
		float r = getcol(gl_FragColor, rzam);
		float g = getcol(gl_FragColor, gzam);
		float b = getcol(gl_FragColor, bzam);
		gl_FragColor.r = r;
		gl_FragColor.g = g;
		gl_FragColor.b = b;
	}
`;

class RgbChange extends Program {
	constructor(opt, gl) {
		opt.fsSource = fss;
		super(opt);
	}

    apply(pars) {
		let { source, bitmap, target, params } = pars;

        let gl = this.gl;
		gl.useProgram(this.id);
		this.bindBuffer(bitmap);
		gl.bindTexture(gl.TEXTURE_2D, source.texture);	// входная текстура
		gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);	// куда рисуем fbo=null то на экран
		
    // Tell the shader the resolution of the framebuffer. 
    // gl.uniform2f(resolutionLocation, bitmap.width, bitmap.height); 

		let filters = params.ImageFilters.filters;
		gl.uniform1i(this.uniform['rzam'].location, Number(filters.rzam));
		gl.uniform1i(this.uniform['gzam'].location, Number(filters.gzam));
		gl.uniform1i(this.uniform['bzam'].location, Number(filters.bzam));
    
		gl.drawArrays(gl.TRIANGLES, 0, 6);	// Draw the rectangle.
    }
}

export default RgbChange;

