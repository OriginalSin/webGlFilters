import ColorMatrix from './ColorMatrix';
import Program from './Program';

class Brightness extends Contrast {
    refreshProgram(val) {
        const {gl, id} = this;
		const b = (val || 0) + 1;
		const {m, shader} = ColorMatrix.chkFS([
			b, 0, 0, 0, 0,
			0, b, 0, 0, 0,
			0, 0, b, 0, 0,
			0, 0, 0, 1, 0
		]);
		this.m = m;
		this.fsSource = shader;
		gl.deleteProgram(id);
		this.init();
// console.log(' __refreshProgram____', val);
    }
}


export default Brightness;

