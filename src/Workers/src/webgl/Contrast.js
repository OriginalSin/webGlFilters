import ColorMatrix from './ColorMatrix';
import Program from './Program';

class Contrast extends ColorMatrix {
    apply(pars) {
		let { source, bitmap, target, params } = pars;
        let parsData = params.ImageFilters;
		if (parsData.changed.contrast) {
			delete parsData.changed.contrast;
			this.refreshProgram(parsData.filters.contrast);
		}
		this.repaint(bitmap, source, target);
    }

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

}

export default Contrast;

