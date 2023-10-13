/*
attribute vec2 pos;
//attribute vec2 uv;
uniform mat4 uTransformMatrix;
//varying vec2 vTextureCoord;
varying vec2 vUv;
void main(void) {
	vUv = pos;
	//vTextureCoord = pos;
	//gl_Position = uTransformMatrix * vec4(pos, 0.0, 1.0);
	gl_Position = vec4(pos, 0.0, 1.0);
}
*/
attribute vec2 aVertCoord;
uniform mat4 uTransformMatrix;
varying vec2 vTextureCoord;
void main(void) {
	vTextureCoord = aVertCoord;
	gl_Position = uTransformMatrix * vec4(aVertCoord, 0.0, 1.0);
}
