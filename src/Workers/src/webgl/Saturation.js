import ColorMatrix from './ColorMatrix';
import Program from './Program';

class Saturation extends Contrast {
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


}

export default Saturation;

