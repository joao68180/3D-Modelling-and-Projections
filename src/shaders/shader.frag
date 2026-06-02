#version 300 es
precision mediump float;

in vec3 v_normal;
uniform vec4 u_color;
out vec4 color;

//Computes the final fragment color with a simple lighting effect based on the normal's Y component.
void main() {
    color = u_color * (0.85f + 0.10f * max(v_normal.y, 0.0f));
}