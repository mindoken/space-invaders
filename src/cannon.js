export default class Cannon {
  constructor(x, y, sprite, maxHp = 3) {
    this.x = x;
  	this.y = y;
    this._sprite = sprite;
    this.hp = maxHp;
    this.maxHp = maxHp;
    this.destroyed = false;
  }



  draw(ctx, time) {
    ctx.drawImage(
      this._sprite.img,
      this._sprite.x, this._sprite.y, this._sprite.w, this._sprite.h,
      this.x, this.y, this._sprite.w, this._sprite.h
    );
  }
  takeDamage(amount = 1) {
    if (this.destroyed) return;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.destroyed = true;

    }
  }
}
