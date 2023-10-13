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
