import Program from './Program';

const fss = `
	precision highp float;
	varying vec2 vUv;
	uniform vec2 rband;
	uniform vec2 gband;
	uniform vec2 bband;
	uniform sampler2D texture;

	float band(float c, vec2 b) {
		return step(b[0], c) * step(c, b[1]) * c;
	}

	void main(void) {
		gl_FragColor = texture2D(texture, vUv);
		gl_FragColor.r = band(gl_FragColor.r, rband);
		gl_FragColor.g = band(gl_FragColor.g, gband);
		gl_FragColor.b = band(gl_FragColor.b, bband);
	}
`;

class Rgb extends Program {
	constructor(opt, gl) {
		opt.fsSource = fss;
		super(opt);
	}

    apply(pars) {
		let { source, bitmap, target, vertices, fbo, texture, params } = pars;

        let gl = this.gl;
		gl.useProgram(this.id);
		this.bindBuffer(bitmap);
		gl.bindTexture(gl.TEXTURE_2D, source.texture);	// входная текстура
		gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);	// куда рисуем fbo=null то на экран
		
    // Tell the shader the resolution of the framebuffer. 
    // gl.uniform2f(resolutionLocation, bitmap.width, bitmap.height); 

        let parsData = params.ImageFilters;
        // let changed = parsData.changed;
		let filters = parsData.filters;
// console.log(' ___  ____', filters);
		// gl.uniform2f(this.fs.uniform.rband.location, 0.5, 0.7);
		gl.uniform2f(this.fs.uniform.rband.location, filters.startRed, filters.endRed);
		gl.uniform2f(this.fs.uniform.gband.location, filters.startGreen, filters.endGreen);
		gl.uniform2f(this.fs.uniform.bband.location, filters.startBlue, filters.endBlue);
    
		gl.drawArrays(gl.TRIANGLES, 0, 6);	// Draw the rectangle.
    }
}

export default Rgb;

