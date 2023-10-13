precision highp float;
varying vec2 vUv;
uniform vec2 size;
uniform sampler2D texture;

vec2 pixelate(vec2 coord, vec2 size) {
	return floor( coord / size ) * size;
}

void main(void) {
	gl_FragColor = vec4(0.0);
	vec2 coord = pixelate(vUv, size);
	gl_FragColor += texture2D(texture, coord);
}
