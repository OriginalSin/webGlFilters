precision highp float;
varying vec2 vUv;
uniform sampler2D texture;

void main(void) {
	gl_FragColor = texture2D(texture, vUv);
}
