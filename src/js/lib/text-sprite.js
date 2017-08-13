// taken from: https://github.com/SeregPie/THREE.TextSprite
import {Math as ThreeMath,
        Mesh,
        Sprite,
        SpriteMaterial,
        Texture } from 'three'
import TextTexture from './text-texture'

let onBeforeRender = function(renderer, a, camera) {
  if (Date.now() > this.lastRedraw + this.redrawInterval) {
    if (this.redrawInterval) {
      setTimeout(() => {
        this.redraw(renderer, camera);
      });
    } else {
      this.redraw(renderer, camera);
    }
  } else {
    this.updateScale();
  }
};

let TextSprite = class extends Sprite {
  
  constructor({
    textSize = 1,
    redrawInterval = 1,
    roundFontSizeToNearestPowerOfTwo = true,
    maxFontSize = Infinity,
    material = {},
    texture = {},
  } = {}) {

    super(new SpriteMaterial(Object.assign({}, material, {map: new TextTexture(texture)})));
    this._textSize = textSize;
    this.redrawInterval = redrawInterval;
    this.roundFontSizeToNearestPowerOfTwo = roundFontSizeToNearestPowerOfTwo;
    this.maxFontSize = maxFontSize;
    this.lastRedraw = 0;

    this._renderMesh = new Mesh();
    this._renderMesh.onBeforeRender = onBeforeRender.bind(this);
    this.add(this._renderMesh);
  }

  updateScale() {
    this.scale.set(this.material.map.aspect, 1, 1).multiplyScalar(this.textSize);
  }

  updateMatrix(...args) {
    this.updateScale();
    return super.updateMatrix(...args);
  }

  get textSize() {
    return this._textSize;
  }

  set textSize(value) {
    if (this._textSize !== value) {
      this._textSize = value;
    }
  }

  computeOptimalFontSize(renderer, camera) {
    if (renderer.domElement.width && renderer.domElement.height && this.material.map.linesCount) {
      let distance = this.getWorldPosition().distanceTo(camera.getWorldPosition());
      if (distance) {
        let heightInPixels = this.getWorldScale().y * renderer.domElement.height / distance;
        if (heightInPixels) {
          return Math.round(heightInPixels / (this.material.map.linesCount + 2 * this.material.map.padding));
        }
      }
    }
    return 0;
  }

  redraw(renderer, camera) {
    this.updateScale();
    let fontSize = this.computeOptimalFontSize(renderer, camera);
    if (this.roundFontSizeToNearestPowerOfTwo) {
      fontSize = ThreeMath.nearestPowerOfTwo(fontSize);
    }
    fontSize = Math.min(fontSize, this.maxFontSize);
    this.material.map.fontSize = fontSize;
    this.lastRedraw = Date.now();
  }

  dispose() {
    this.material.map.dispose();
    this.material.dispose();
  }
};

Object.assign(TextSprite.prototype, { isTextSprite: true })

export default TextSprite




