export default class Bunker {
  constructor(x, y, sprite, maxHp = 2) {
    this.x = x;
  	this.y = y;
    this.sprite = sprite;
    this.hp = maxHp      
    this.maxHp = maxHp  
    this.destroyed = false
  }

    draw(ctx) {
        ctx.drawImage(
        this.sprite.img,
        this.sprite.x, this.sprite.y, this.sprite.w, this.sprite.h,
        this.x, this.y, this.sprite.w, this.sprite.h
        );
  }

    takeDamage(amount = 1) {
        this.hp -= amount;
        if (this.hp <= 0) {
        this.destroyed = true;
        }
  }
}
