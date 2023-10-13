precision highp float;
varying vec2 vUv;
uniform int rzam;
uniform int gzam;
uniform int bzam;
uniform sampler2D texture;

float getcol(vec4 c, int i) {
	if (i == 0) return c[0];
	else if (i == 1) return c[1];
	return c[2];
}

void main(void) {
	gl_FragColor = texture2D(texture, vUv);
	float r = getcol(gl_FragColor, rzam);
	float g = getcol(gl_FragColor, gzam);
	float b = getcol(gl_FragColor, bzam);
	gl_FragColor.r = r;
	gl_FragColor.g = g;
	gl_FragColor.b = b;
}
