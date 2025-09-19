export default class Alien {
  constructor(x, y, [spriteA, spriteB], maxHp = 2) {
    this.x = x;
  	this.y = y;
    this._spriteA = spriteA;
    this._spriteB = spriteB;
    this.hp = maxHp      
    this.maxHp = maxHp  
    this.destroyed = false
  }

  draw(ctx, time) {
    let sp = (Math.ceil(time / 1000) % 2 === 0) ? this._spriteA : this._spriteB;

    ctx.drawImage(
      sp.img,
      sp.x, sp.y, sp.w, sp.h,
      this.x, this.y, sp.w, sp.h
    )
  }

  takeDamage(amount = 1) {
    this.hp -= amount
    if (this.hp <= 0) {
      this.destroyed = true
    }
    }
}
