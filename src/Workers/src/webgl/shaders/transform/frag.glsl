/*
precision highp float;
varying vec2 vUv;
uniform sampler2D texture;

void main(void) {
	gl_FragColor = texture2D(texture, vUv);
}
*/
precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
void main(void) {
	if (vTextureCoord.x < 0.0 || vTextureCoord.x > 1.0 || vTextureCoord.y < 0.0 || vTextureCoord.y > 1.0)
		discard;
	gl_FragColor = texture2D(uSampler, vTextureCoord);
}
