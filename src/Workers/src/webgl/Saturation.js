import ColorMatrix from './ColorMatrix';
import Program from './Program';

class Saturation extends ColorMatrix {
    refreshProgram(val) {
        const {gl, id} = this;
		var x = (val || 0) * 2/3 + 1;
		var y = ((x-1) *-0.5);
		
		const {m, shader} = ColorMatrix.chkFS([
			x, y, y, 0, 0,
			y, x, y, 0, 0,
			y, y, x, 0, 0,
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
		if (parsData.changed.saturation) {
			delete parsData.changed.saturation;
			this.refreshProgram(parsData.filters.saturation);
		}
        let gl = this.gl;
		gl.useProgram(this.id);

// console.log(' __apply____', this, source, target, val);
		this.bindBuffer(bitmap);

  var originalImageTexture = Program.createAndSetupTexture(gl);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
    
		gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);	// make this the framebuffer we are rendering to.

    // Tell the shader the resolution of the framebuffer.
    // gl.uniform2f(resolutionLocation, bitmap.width, bitmap.height);
   
		gl.viewport(0, 0, bitmap.width, bitmap.height);		 // Tell webgl the viewport setting needed for framebuffer.
		this.enableAttribArrays();
		gl.uniform1fv(this.fs.uniform['m'].location, this.m);
		// gl.uniform1f(this.vs.uniform['flipY'].location, (flipY ? -1 : 1) );

    
		gl.drawArrays(gl.TRIANGLES, 0, 6);	// Draw the rectangle.
	
		
    }

}

export default Saturation;

