/**
 * @author André Narquel - 67870
 * @author João Fernandes - 68180
 */

import { pushMatrix, popMatrix, multTranslation, multRotationX, multRotationY, multRotationZ, multScale, modelView, } from "../../libs/stack.js";

/**
 * Represents a node in a scene graph with position, rotation, scale, an optional draw function, and children nodes.
 * The children nodes inherit the transformations
 */
export class sceneNode {
  constructor(name, drawFun = null) {
    this.name = name;
    this.children = [];
    this.translation = [0, 0, 0];
    this.rotation = [0, 0, 0];
    this.scale = [1, 1, 1];
    this.drawFun = drawFun;
    this.worldMatrix = null;
  }

  addChild(child) {
    this.children.push(child);
  }

  draw(gl, program, mode, uploadModelView) {
    pushMatrix();

    multTranslation(this.translation);
    multRotationZ(this.rotation[2]);
    multRotationY(this.rotation[1]);
    multRotationX(this.rotation[0]);
    multScale(this.scale);

    this.worldMatrix = modelView();

    if (this.drawFun) {
      this.drawFun(gl, program, mode, uploadModelView);
    }

    for (let child of this.children) {
      child.draw(gl, program, mode, uploadModelView);
    }

    popMatrix();
  }
}