import ColorMatrix from './ColorMatrix';
import Program from './Program';

class Contrast extends ColorMatrix {
    refreshProgram(val) {
        const {gl, id} = this;
		var v = (val || 0) + 1;
		var o = -128 * (v-1);
		
		const {m, shader} = ColorMatrix.chkFS([
			v, 0, 0, 0, o,
			0, v, 0, 0, o,
			0, 0, v, 0, o,
			0, 0, 0, 1, 0
		]);

		this.m = m;
		this.fsSource = shader;
		gl.deleteProgram(id);
		this.init();
// console.log(' __refreshProgram____', val);
    }

    apply(pars) {
		let { source, bitmap, target, vertices, fbo, texture, flipY, params } = pars;
        let parsData = params.ImageFilters;
		if (parsData.changed.contrast) {
			delete parsData.changed.contrast;
			this.refreshProgram(parsData.filters.contrast);
		}
        let gl = this.gl;
		gl.useProgram(this.id);

		this.bindBuffer(bitmap);
		gl.bindTexture(gl.TEXTURE_2D, source.texture);
		gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);	// make this the framebuffer we are rendering to.

    // Tell the shader the resolution of the framebuffer.
    // gl.uniform2f(resolutionLocation, bitmap.width, bitmap.height);

		gl.uniform1fv(this.fs.uniform['m'].location, this.m);

		gl.drawArrays(gl.TRIANGLES, 0, 6);	// Draw the rectangle.
    }

}

export default Contrast;

