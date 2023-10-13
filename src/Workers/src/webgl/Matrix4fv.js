const adj = (m) => {			// Compute the adjugate of m
	return [
		m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4],
		m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5],
		m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3]
	];
};

const multmm = (a, b) => {		// multiply two matrices
	const c = Array(9);
	for (let i = 0; i !== 3; ++i) {
		for (let j = 0; j !== 3; ++j) {
			let cij = 0;
			for (let k = 0; k !== 3; ++k) {
				cij += a[3 * i + k] * b[3 * k + j];
			}
			c[3 * i + j] = cij;
		}
	}
	return c;
};

const multmv = (m, v) => {		// multiply matrix and vector
	return [
		m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
		m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
		m[6] * v[0] + m[7] * v[1] + m[8] * v[2]
	];
};

const basisToPoints = (x1, y1, x2, y2, x3, y3, x4, y4) => {
	const m = [
		x1, x2, x3,
		y1, y2, y3,
		1,  1,  1
	];
	const v = multmv(adj(m), [x4, y4, 1]);
	return multmm(m, [
		v[0], 0, 0,
		0, v[1], 0,
		0, 0, v[2]
	]);
};
const general2DProjection = (
		x1s, y1s, x1d, y1d,
		x2s, y2s, x2d, y2d,
		x3s, y3s, x3d, y3d,
		x4s, y4s, x4d, y4d
	) => {
	const s = basisToPoints(x1s, y1s, x2s, y2s, x3s, y3s, x4s, y4s);
	const d = basisToPoints(x1d, y1d, x2d, y2d, x3d, y3d, x4d, y4d);
	return multmm(d, adj(s));
};
const project = (m, x, y) => {
	const v = multmv(m, [x, y, 1]);
	return [v[0] / v[2], v[1] / v[2]];
};


const getMatrix4fv = (s, d) => {		// get transform matrix and it`s inv

   // L.ImageTransform.Utils = {
        // function general2DProjection(
              // x1s, y1s, x1d, y1d,
              // x2s, y2s, x2d, y2d,
              // x3s, y3s, x3d, y3d,
              // x4s, y4s, x4d, y4d
        // ) {
          // var s = basisToPoints(x1s, y1s, x2s, y2s, x3s, y3s, x4s, y4s);
          // var d = basisToPoints(x1d, y1d, x2d, y2d, x3d, y3d, x4d, y4d);
          // return multmm(d, adj(s));
        // },

        // project: function(m, x, y) {
            // var v = multmv(m, [x, y, 1]);
            // return [v[0] / v[2], v[1] / v[2]];
        // },
        // adj: adj
    // }; tl, tr, bl, br
// console.log(' ___ matrix ___', s, d);

	// const m = general2DProjection(
		// s[0], s[1], d[0], d[1],	// top-left
		// s[2], s[3], d[2], d[3],	// top-right
		// s[4], s[5], d[4], d[5],	// bottom-left
		// s[6], s[7], d[6], d[7]	// bottom-right
	// );
	const m = general2DProjection(// bl, tl, tr, br
		s[4], s[5], d[4], d[5],	// bottom-left
		s[0], s[1], d[0], d[1],	// top-left
		s[2], s[3], d[2], d[3],	// top-right
		s[6], s[7], d[6], d[7]	// bottom-right
	);
	const matrix3d = m.slice();
	for (let i = 0; i !== 9; ++i) { m[i] = m[i] / m[8]; }
	const matrix4fv = [
		m[0], m[3],    0, m[6],
		m[1], m[4],    0, m[7],
		   0,    0,    0,    0,
		m[2], m[5],    0,    1
	];
	return {
		matrix3d: m,
		invMatrix: adj(m),
		matrix4fv
	};
/**/
};
export { getMatrix4fv, project };
