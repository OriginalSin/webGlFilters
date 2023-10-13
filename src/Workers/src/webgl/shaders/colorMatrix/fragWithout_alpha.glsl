precision highp float;
varying vec2 vUv;
uniform sampler2D texture;
uniform float m[20];

void main(void) {
	vec4 c = texture2D(texture, vUv);
	gl_FragColor.r = m[0] * c.r + m[1] * c.g + m[2] * c.b + m[4];
	gl_FragColor.g = m[5] * c.r + m[6] * c.g + m[7] * c.b + m[9];
	gl_FragColor.b = m[10] * c.r + m[11] * c.g + m[12] * c.b + m[14];
	gl_FragColor.a = c.a;
}
