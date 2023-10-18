import ColorMatrix from './ColorMatrix';
import Program from './Program';

class Hue extends Contrast {
    refreshProgram(val) {
        const {gl, id} = this;
		val = (val || 0)/180 * Math.PI;
		var cos = Math.cos(val),
			sin = Math.sin(val),
			lumR = 0.213,
			lumG = 0.715,
			lumB = 0.072;

		const {m, shader} = ColorMatrix.chkFS([
			lumR+cos*(1-lumR)+sin*(-lumR),lumG+cos*(-lumG)+sin*(-lumG),lumB+cos*(-lumB)+sin*(1-lumB),0,0,
			lumR+cos*(-lumR)+sin*(0.143),lumG+cos*(1-lumG)+sin*(0.140),lumB+cos*(-lumB)+sin*(-0.283),0,0,
			lumR+cos*(-lumR)+sin*(-(1-lumR)),lumG+cos*(-lumG)+sin*(lumG),lumB+cos*(1-lumB)+sin*(lumB),0,0,
			0, 0, 0, 1, 0
		]);
		this.m = m;
		this.fsSource = shader;
		gl.deleteProgram(id);
		this.init();
// console.log(' __refreshProgram____', val);
    }
}

export default Hue;

