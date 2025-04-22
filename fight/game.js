// --- Canvas Setup ---
const canvas = document.getElementById('gameCanvas');
if (!canvas) {
    throw new Error("Canvas element 'gameCanvas' not found.");
}
const ctx = canvas.getContext('2d');
if (!ctx) {
    throw new Error("Failed to get 2D context from canvas.");
}
const SCREEN_WIDTH = canvas.width;
const SCREEN_HEIGHT = canvas.height;
const FPS = 60; // Used for reference, not scaling

// --- Colors ---
const WHITE = 'white';
const BLACK = 'black';
const RED = 'red';
const GREEN = 'lime';
const BLUE = 'blue';
const YELLOW = 'yellow';
const CYAN = 'cyan';
const MAGENTA = 'magenta';
const ORANGE = 'orange';
const LIGHT_BLUE = '#00B7EB'; // FIX: Added missing LIGHT_BLUE constant

// --- Player Settings ---
const PLAYER_SPEED = 300; // FIX: Removed FPS scaling (pixels per second)
const PLAYER_HP = 10;
const PLAYER_SHOOT_DELAY_BASE = 100; // ms
const PLAYER_SHOOT_COOLDOWN = 1000; // ms
const PLAYER_SHOOT_DURATION = 10000; // ms

// --- Missile Settings ---
const MISSILE_SPEED = 420; // FIX: Removed FPS scaling
const MISSILE_DAMAGE = 3;
const LOCK_ON_TIME = 1000; // ms

// --- Bullet Settings ---
const BULLET_SPEED = 600; // FIX: Removed FPS scaling
const BULLET_DAMAGE = 0.1;
const BULLET_FONT_SIZE = 25;

// --- Enemy Settings ---
const ENEMY_SMALL_HP = 3;
const ENEMY_SMALL_SPEED_X = 120; // FIX: Removed FPS scaling
const ENEMY_SMALL_SHOOT_DELAY = 1500; // ms
const ENEMY_SMALL_BULLET_DAMAGE = 0.5;
const ENEMY_SMALL_SCORE = 10;

const ENEMY_MEDIUM_HP = 5;
const ENEMY_MEDIUM_SPEED_X = 90; // FIX: Removed FPS scaling
const ENEMY_MEDIUM_SHOOT_DELAY = 1200; // ms
const ENEMY_MEDIUM_MISSILE_DELAY = 5000; // ms
const ENEMY_MEDIUM_BULLET_DAMAGE = 0.5;
const ENEMY_MEDIUM_MISSILE_DAMAGE = 3;
const ENEMY_MEDIUM_SCORE = 30;

const ENEMY_BULLET_SPEED = 300; // FIX: Removed FPS scaling
const ENEMY_MISSILE_SPEED = 240; // FIX: Removed FPS scaling

// --- Boss Settings ---
const BOSS_HP = 50;
const BOSS_APPEAR_TIME = 35; // s
const BOSS_SPEED_Y = 180; // FIX: Removed FPS scaling
const BOSS_LASER_DELAY = 3000; // ms
const BOSS_EVADE_DELAY = 10000; // ms
const BOSS_WHIRLWIND_DELAY = 2000; // ms
const BOSS_WHIRLWIND_THRESHOLD = 0.1; // 10% HP
const BOSS_SCORE = 500;
const BOSS_ABSORB_COOLDOWN = 5000; // ms
const BOSS_ABSORB_RANGE = 300; // pixels
const BOSS_EVADE_DURATION = 500; // ms

// --- Powerup Settings ---
const POWERUP_SPAWN_RATE = 4000; // ms
const POWERUP_DURATION = 8000; // ms
const POWERUP_TYPES = ['M', 'S', 'D', 'H', 'L', 'B'];
const POWERUP_SIZE = 20;
const POWERUP_SPEED_Y = 60; // FIX: Removed FPS scaling

// --- Game Settings ---
const GAME_DURATION = 60; // seconds

// --- Font Settings ---
const DEFAULT_FONT_FAMILY = "'Courier New', Courier, monospace";

// --- Utility Functions ---
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}
function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

// --- Base GameObject ---
class GameObject {
    constructor(x, y, width = 0, height = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speedX = 0;
        this.speedY = 0;
        this.shouldRemove = false;
    }

    collidesWith(other) {
        if (!other || !this.width || !this.height || !other.width || !other.height) return false;
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }

    collidesWithTextSprite(other, radiusFactor = 0.6) { // FIX: Adjusted radiusFactor for better balance
        if (!other || !this.width || !this.height || !other.width || !other.height) return false;
        const radius1 = (this.width + this.height) / 4 * radiusFactor;
        const radius2 = (other.width + other.height) / 4 * radiusFactor;
        const dist = distance(this.centerX, this.centerY, other.centerX, other.centerY);
        return dist < radius1 + radius2;
    }

    get centerX() { return this.x + this.width / 2; }
    get centerY() { return this.y + this.height / 2; }
    get left() { return this.x; }
    get right() { return this.x + this.width; }
    get top() { return this.y; }
    get bottom() { return this.y + this.height; }

    update(dt) {
        this.x += this.speedX * dt;
        this.y += this.speedY * dt;
    }

    draw(ctx) {}

    setDimensionsFromText(ctx, text, font) {
        try {
            ctx.font = font;
            const metrics = ctx.measureText(text);
            this.width = metrics.width;
            const fontHeight = parseInt(font.match(/(\d+)px/)[1]);
            this.height = fontHeight * 1.2;
        } catch (e) {
            console.error(`Error setting dimensions for text "${text}":`, e);
        }
    }
}

// --- Explosion Class --- // FIX: Added missing Explosion class
class Explosion extends GameObject {
    constructor(x, y, radius, color, duration) {
        super(x, y, radius * 2, radius * 2);
        this.radius = radius;
        this.color = color;
        this.duration = duration;
        this.startTime = performance.now();
        this.isEffect = true;
    }
    update(dt) {
        if (performance.now() - this.startTime > this.duration) {
            this.shouldRemove = true;
        }
    }
    draw(ctx) {
        const alpha = 1 - (performance.now() - this.startTime) / this.duration;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

// --- Player Class ---
class Player extends GameObject {
    constructor() {
        super(10, SCREEN_HEIGHT / 2);
        this.hp = PLAYER_HP;
        this.maxHp = PLAYER_HP;
        this.speed = PLAYER_SPEED;
        this.lastShotTime = performance.now();
        this.shootingStartTime = performance.now();
        this.isShooting = false;
        this.onCooldown = false;
        this.lockTarget = null;
        this.lockOnStartTime = 0;
        this.lockOnStage = 0;
        this.missileLevel = 0;
        this.shootLevel = 0;
        this.drones = [];
        this.l_stage = 0;
        this.h_rain_active = false;
        this.h_rain_end_time = 0;
        this.b_collected = 0;
        this.shootDelay = PLAYER_SHOOT_DELAY_BASE;
        this.missileLockTime = LOCK_ON_TIME;
        this.currentMissileSpeed = MISSILE_SPEED;
        this.textBody = ">";
        this.textWingL = "<";
        this.textWingR = ">";
        this.fontStyle = `bold 30px ${DEFAULT_FONT_FAMILY}`;
        this.color = CYAN;
        this.wingSpacing = 2;
        this.calculateDimensions(ctx);
        this.y -= this.height / 2;
    }

    calculateDimensions(ctx) {
        ctx.font = this.fontStyle;
        const bodyMetrics = ctx.measureText(this.textBody);
        const wingLMetrics = ctx.measureText(this.textWingL);
        const wingRMetrics = ctx.measureText(this.textWingR);
        this.width = wingLMetrics.width + this.wingSpacing + bodyMetrics.width + this.wingSpacing + wingRMetrics.width;
        const fontSize = parseInt(this.fontStyle.match(/(\d+)px/)[1]);
        this.height = fontSize * 1.2;
        this.wingLOffset = 0;
        this.bodyOffset = wingLMetrics.width + this.wingSpacing;
        this.wingROffset = this.bodyOffset + bodyMetrics.width + this.wingSpacing;
    }

    update(dt) {
        // --- Movement ---
        let targetSpeedX = 0;
        let targetSpeedY = 0;
        if (keysPressed['ArrowLeft'] || keysPressed['a']) targetSpeedX = -this.speed;
        if (keysPressed['ArrowRight'] || keysPressed['d']) targetSpeedX = this.speed;
        if (keysPressed['ArrowUp'] || keysPressed['w']) targetSpeedY = -this.speed;
        if (keysPressed['ArrowDown'] || keysPressed['s']) targetSpeedY = this.speed;
        if (targetSpeedX !== 0 && targetSpeedY !== 0) {
            const factor = 1 / Math.sqrt(2);
            targetSpeedX *= factor;
            targetSpeedY *= factor;
        }
        this.x += targetSpeedX * dt;
        this.y += targetSpeedY * dt;
        this.x = Math.max(0, Math.min(SCREEN_WIDTH - this.width, this.x));
        this.y = Math.max(0, Math.min(SCREEN_HEIGHT - this.height, this.y));

        // --- Shooting Input --- // FIX: Added spacebar input for shooting
        const now = performance.now();
        if (keysPressed[' ']) {
            if (!this.isShooting) {
                this.isShooting = true;
                this.shootingStartTime = now;
            }
        } else {
            this.isShooting = false;
        }

        // --- Shooting Cooldown ---
        if (this.onCooldown && now - this.shootingStartTime > PLAYER_SHOOT_DURATION + PLAYER_SHOOT_COOLDOWN) {
            this.onCooldown = false;
        }
        if (this.isShooting && !this.onCooldown && now - this.shootingStartTime > PLAYER_SHOOT_DURATION) {
            this.onCooldown = true;
        }
        if (this.isShooting && !this.onCooldown && now - this.lastShotTime > this.shootDelay) {
            this.lastShotTime = now;
            this.shoot();
        }

        // --- Lock-on and H-Rain ---
        this._update_lock_on(now);
        if (this.h_rain_active) {
            if (now > this.h_rain_end_time) {
                this.h_rain_active = false;
            } else if (Math.random() < 0.6) {
                const h_bullet = new HRainBullet(getRandomInt(0, SCREEN_WIDTH), 0);
                gameObjects.bullets.player.push(h_bullet);
            }
        }
        this.drones = this.drones.filter(d => !d.shouldRemove);
    }

    shoot() {
        const spawnX = this.right;
        const spawnY = this.centerY;
        if (this.l_stage === 0) {
            gameObjects.bullets.player.push(new Bullet(spawnX, spawnY));
        } else if (this.l_stage === 1) {
            gameObjects.bullets.player.push(new LBullet(spawnX, spawnY));
        } else if (this.l_stage === 2) {
            const offset = 10;
            gameObjects.bullets.player.push(new LBullet(spawnX, spawnY - offset));
            gameObjects.bullets.player.push(new LBullet(spawnX, spawnY + offset));
        } else if (this.l_stage >= 3) {
            const offset = 15;
            gameObjects.bullets.player.push(new LBullet(spawnX, spawnY));
            gameObjects.bullets.player.push(new LBullet(spawnX, spawnY - offset));
            gameObjects.bullets.player.push(new LBullet(spawnX, spawnY + offset));
        }
    }

    _update_lock_on(now) {
        if (this.lockTarget && (this.lockTarget.shouldRemove || this.lockTarget.right < 0)) {
            this._reset_lock();
        }
        if (!this.lockTarget) {
            let closestEnemy = null;
            let min_dist_sq = Infinity;
            const playerFrontX = this.right;
            gameObjects.enemies.forEach(enemy => {
                if (enemy.left > playerFrontX) {
                    const dx = enemy.centerX - this.centerX;
                    const dy = enemy.centerY - this.centerY;
                    const dist_sq = dx * dx + dy * dy;
                    if (dist_sq < (SCREEN_WIDTH * 0.8) ** 2 && dist_sq < min_dist_sq) {
                        min_dist_sq = dist_sq;
                        closestEnemy = enemy;
                    }
                }
            });
            if (closestEnemy) {
                this.lockTarget = closestEnemy;
                this.lockOnStartTime = now;
                this.lockOnStage = 1;
            }
        }
        if (this.lockTarget && this.lockOnStage === 1 && now - this.lockOnStartTime > this.missileLockTime) {
            this.lockOnStage = 2;
            const missile = new Missile(this.centerX, this.centerY, this.lockTarget, this.currentMissileSpeed);
            gameObjects.missiles.player.push(missile);
            this._reset_lock();
        }
    }

    _reset_lock() {
        this.lockTarget = null;
        this.lockOnStage = 0;
        this.lockOnStartTime = 0;
    }

    draw(ctx) {
        ctx.font = this.fontStyle;
        ctx.fillStyle = this.color;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        const drawY = this.centerY;
        ctx.fillText(this.textWingL, this.x + this.wingLOffset, drawY);
        ctx.fillText(this.textBody, this.x + this.bodyOffset, drawY);
        ctx.fillText(this.textWingR, this.x + this.wingROffset, drawY);
    }

    draw_lock_on(ctx) {
        if (this.lockTarget && !this.lockTarget.shouldRemove) {
            const targetPos = [this.lockTarget.centerX, this.lockTarget.centerY];
            const radius = Math.max(this.lockTarget.width, this.lockTarget.height) / 2 + 10;
            const progress = Math.min(1, (performance.now() - this.lockOnStartTime) / this.missileLockTime);
            ctx.lineWidth = 2;
            if (this.lockOnStage === 1) {
                ctx.strokeStyle = YELLOW;
                ctx.beginPath();
                ctx.arc(targetPos[0], targetPos[1], radius, -Math.PI / 2, -Math.PI / 2 + progress * 2 * Math.PI);
                ctx.stroke();
            } else if (this.lockOnStage === 2) {
                ctx.strokeStyle = RED;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(targetPos[0], targetPos[1], radius, 0, 2 * Math.PI);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(targetPos[0] - radius, targetPos[1]);
                ctx.lineTo(targetPos[0] + radius, targetPos[1]);
                ctx.moveTo(targetPos[0], targetPos[1] - radius);
                ctx.lineTo(targetPos[0], targetPos[1] + radius);
                ctx.stroke();
            }
            ctx.lineWidth = 1;
        }
    }

    applyPowerup(type) {
        console.log(`Player got powerup: ${type}`);
        if (type === 'M') {
            if (this.missileLevel < 2) {
                this.missileLevel += 1;
                this.missileLockTime = LOCK_ON_TIME * (0.75 ** this.missileLevel);
                this.currentMissileSpeed = MISSILE_SPEED * (1.2 ** this.missileLevel);
            }
        } else if (type === 'S') {
            if (this.shootLevel < 2) {
                this.shootLevel += 1;
                this.shootDelay = PLAYER_SHOOT_DELAY_BASE * (0.7 ** this.shootLevel);
            }
        } else if (type === 'D') {
            if (this.drones.length < 2) {
                let drone = this.drones.length === 0 ? new Drone(this, -30, -40) : new Drone(this, -30, 40);
                this.drones.push(drone);
                gameObjects.drones.push(drone);
            }
        } else if (type === 'H') {
            this.h_rain_active = true;
            this.h_rain_end_time = performance.now() + 5000;
        } else if (type === 'L') {
            if (this.l_stage < 3) this.l_stage += 1;
            this.hp = this.maxHp;
        } else if (type === 'B') {
            this.b_collected += 1;
            if (this.b_collected >= 3) {
                this.activate_phoenix();
                this.b_collected = 0;
            }
        }
    }

    activate_phoenix() {
        gameObjects.effects.push(new ScreenFlash(ORANGE, 150));
        let killed_count = 0;
        for (let i = gameObjects.enemies.length - 1; i >= 0; i--) {
            const enemy = gameObjects.enemies[i];
            if (!(enemy instanceof Boss)) {
                enemy.shouldRemove = true;
                score += enemy.score_value || 0;
                killed_count++;
                gameObjects.effects.push(new Explosion(enemy.centerX, enemy.centerY, enemy.width * 1.5, enemy.color || ORANGE, 400));
            }
        }
        gameObjects.bullets.enemy = [];
        gameObjects.missiles.enemy = [];
    }

    takeDamage(amount) {
        if (this.shouldRemove) return;
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.shouldRemove = true;
            gameObjects.effects.push(new Explosion(this.centerX, this.centerY, this.width * 2, this.color, 600));
        } else {
            gameObjects.effects.push(new ScreenFlash(RED, 80, 0.3));
        }
    }

    collidesWith(other) { // FIX: Added for text-based collision accuracy
        return this.collidesWithTextSprite(other);
    }
}

// --- Bullet Classes ---
class Bullet extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.speedX = BULLET_SPEED;
        this.damage = BULLET_DAMAGE;
        this.text = ".";
        this.fontStyle = `bold ${BULLET_FONT_SIZE}px ${DEFAULT_FONT_FAMILY}`;
        this.color = WHITE;
        this.setDimensionsFromText(ctx, this.text, this.fontStyle);
        this.y -= this.height / 2;
    }
    update(dt) {
        super.update(dt);
        if (this.left > SCREEN_WIDTH) this.shouldRemove = true;
    }
    draw(ctx) {
        ctx.font = this.fontStyle;
        ctx.fillStyle = this.color;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(this.text, this.x, this.centerY);
    }
}

class LBullet extends Bullet {
    constructor(x, y) {
        super(x, y);
        this.text = "---";
        this.color = LIGHT_BLUE;
        this.damage = BULLET_DAMAGE * 2;
        this.setDimensionsFromText(ctx, this.text, this.fontStyle);
        this.y = y - this.height / 2;
    }
}

class HRainBullet extends Bullet {
    constructor(x, y) {
        super(x, y);
        this.speedX = 0;
        this.speedY = 360; // FIX: Removed FPS scaling
        this.text = ".";
        this.color = YELLOW;
        this.damage = 0.1;
        this.x = x - this.width / 2;
        this.y = y;
    }
    update(dt) {
        this.y += this.speedY * dt;
        if (this.top > SCREEN_HEIGHT) this.shouldRemove = true;
    }
}

class DroneBullet extends Bullet {
    constructor(x, y) {
        super(x, y);
        this.color = GREEN;
        this.damage = BULLET_DAMAGE * 0.8;
        this.y = y - this.height / 2;
    }
}

class Missile extends GameObject {
    constructor(x, y, target, speed) {
        super(x, y);
        this.target = target;
        this.speed = speed;
        this.damage = MISSILE_DAMAGE;
        this.text = ">";
        this.fontStyle = `bold 20px ${DEFAULT_FONT_FAMILY}`;
        this.color = MAGENTA;
        this.speedX = this.speed;
        this.speedY = 0;
        this.setDimensionsFromText(ctx, this.text, this.fontStyle);
        this.x -= this.width / 2;
        this.y -= this.height / 2;
    }

    update(dt) {
        if (this.target && !this.target.shouldRemove) {
            const targetX = this.target.centerX;
            const targetY = this.target.centerY;
            const currentX = this.centerX;
            const currentY = this.centerY;
            const dx = targetX - currentX;
            const dy = targetY - currentY;
            const dist = Math.hypot(dx, dy);
            if (dist < 5) {
                this.shouldRemove = true;
                return;
            }
            this.speedX = (dx / dist) * this.speed;
            this.speedY = (dy / dist) * this.speed;
            super.update(dt);
        } else {
            super.update(dt);
        }
        if (this.x > SCREEN_WIDTH + 100 || this.x < -100 || this.y > SCREEN_HEIGHT + 100 || this.y < -100) {
            this.shouldRemove = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.centerX, this.centerY);
        const angle = Math.atan2(this.speedY, this.speedX);
        ctx.rotate(angle);
        ctx.font = this.fontStyle;
        ctx.fillStyle = this.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.text, 0, 0);
        ctx.restore();
    }
}

// --- Drone Class ---
class Drone extends GameObject {
    constructor(player, offsetX = -30, offsetY = -40) {
        super(player.centerX + offsetX, player.centerY + offsetY);
        this.player = player;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.text = "d";
        this.fontStyle = `20px ${DEFAULT_FONT_FAMILY}`;
        this.color = CYAN;
        this.lastShotTime = performance.now();
        this.shootDelay = 500;
        this.setDimensionsFromText(ctx, this.text, this.fontStyle);
        this.x -= this.width / 2;
        this.y -= this.height / 2;
    }

    update(dt) {
        if (this.player.shouldRemove) {
            this.shouldRemove = true;
            return;
        }
        const targetX = this.player.centerX + this.offsetX - this.width / 2;
        const targetY = this.player.centerY + this.offsetY - this.height / 2;
        this.x = targetX;
        this.y = targetY;
        const now = performance.now();
        if (now - this.lastShotTime > this.shootDelay) {
            this.lastShotTime = now;
            const bullet = new DroneBullet(this.centerX + this.width / 2, this.centerY);
            gameObjects.bullets.player.push(bullet);
        }
    }

    draw(ctx) {
        ctx.font = this.fontStyle;
        ctx.fillStyle = this.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.text, this.centerX, this.centerY);
    }

    collidesWith(other) {
        return this.collidesWithTextSprite(other);
    }
}

// --- Enemy Classes ---
class Enemy extends GameObject {
    constructor(x, y, text, fontStyle, color) {
        super(x, y);
        this.hp = 1;
        this.speedX = 60; // FIX: Adjusted base speed
        this.score_value = 0;
        this.lastShot = performance.now();
        this.shootDelay = 2000;
        this.text = text;
        this.fontStyle = fontStyle;
        this.color = color;
        this.setDimensionsFromText(ctx, this.text, this.fontStyle);
        this.y = y - this.height / 2;
    }

    update(dt) {
        this.x -= this.speedX * dt;
        if (this.right < 0) this.shouldRemove = true;
    }

    shoot() {}

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.shouldRemove = true;
            return true;
        }
        return false;
    }

    draw(ctx) {
        ctx.font = this.fontStyle;
        ctx.fillStyle = this.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.text, this.centerX, this.centerY);
    }

    collidesWith(other) {
        return this.collidesWithTextSprite(other);
    }
}

class EnemySmall extends Enemy {
    constructor() {
        const spawnY = getRandomInt(30, SCREEN_HEIGHT - 30);
        const fontStyle = `25px ${DEFAULT_FONT_FAMILY}`;
        super(SCREEN_WIDTH + getRandomInt(50, 200), spawnY, "E", fontStyle, RED);
        this.hp = ENEMY_SMALL_HP;
        this.maxHp = ENEMY_SMALL_HP;
        this.speedX = ENEMY_SMALL_SPEED_X + getRandomFloat(-30, 30);
        this.score_value = ENEMY_SMALL_SCORE;
        this.shootDelay = ENEMY_SMALL_SHOOT_DELAY + getRandomInt(-200, 200);
    }

    update(dt) {
        super.update(dt);
        const now = performance.now();
        if (this.right < SCREEN_WIDTH && now - this.lastShot > this.shootDelay) {
            this.shoot();
            this.lastShot = now;
        }
    }

    shoot() {
        const bullet = new EnemyBullet(this.left, this.centerY);
        gameObjects.bullets.enemy.push(bullet);
    }
}

class EnemyMedium extends Enemy {
    constructor(targetPlayer) {
        const spawnY = getRandomInt(50, SCREEN_HEIGHT - 50);
        const fontStyle = `35px ${DEFAULT_FONT_FAMILY}`;
        super(SCREEN_WIDTH + getRandomInt(100, 300), spawnY, "M", fontStyle, YELLOW);
        this.targetPlayer = targetPlayer;
        this.hp = ENEMY_MEDIUM_HP;
        this.maxHp = ENEMY_MEDIUM_HP;
        this.speedX = ENEMY_MEDIUM_SPEED_X + getRandomFloat(-18, 18);
        this.score_value = ENEMY_MEDIUM_SCORE;
        this.shootDelay = ENEMY_MEDIUM_SHOOT_DELAY + getRandomInt(-150, 150);
        this.lastMissileShot = performance.now();
        this.missileDelay = ENEMY_MEDIUM_MISSILE_DELAY + getRandomInt(-500, 500);
    }

    update(dt) {
        super.update(dt);
        const now = performance.now();
        if (this.right < SCREEN_WIDTH) {
            if (now - this.lastShot > this.shootDelay) {
                this.shoot();
                this.lastShot = now;
            }
            if (now - this.lastMissileShot > this.missileDelay) {
                this.shoot_missile();
                this.lastMissileShot = now;
            }
        }
    }

    shoot() {
        const bullet = new EnemyBullet(this.left, this.centerY);
        gameObjects.bullets.enemy.push(bullet);
    }

    shoot_missile() {
        if (this.targetPlayer && !this.targetPlayer.shouldRemove) {
            const missile = new EnemyMissile(this.centerX, this.centerY, this.targetPlayer);
            gameObjects.missiles.enemy.push(missile);
        }
    }
}

class EnemyBullet extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.speedX = -ENEMY_BULLET_SPEED;
        this.damage = ENEMY_SMALL_BULLET_DAMAGE;
        this.text = ".";
        this.fontStyle = `bold ${BULLET_FONT_SIZE}px ${DEFAULT_FONT_FAMILY}`;
        this.color = RED;
        this.setDimensionsFromText(ctx, this.text, this.fontStyle);
        this.x = x - this.width;
        this.y = y - this.height / 2;
    }

    update(dt) {
        super.update(dt);
        if (this.right < 0) this.shouldRemove = true;
    }

    draw(ctx) {
        ctx.font = this.fontStyle;
        ctx.fillStyle = this.color;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(this.text, this.x, this.centerY);
    }

    collidesWith(other) {
        return this.collidesWithTextSprite(other);
    }
}

class EnemyMissile extends GameObject {
    constructor(x, y, target) {
        super(x, y);
        this.target = target;
        this.speed = ENEMY_MISSILE_SPEED;
        this.damage = ENEMY_MEDIUM_MISSILE_DAMAGE;
        this.tracking = true;
        this.text = "<";
        this.fontStyle = `bold 20px ${DEFAULT_FONT_FAMILY}`;
        this.color = ORANGE;
        this.velX = -this.speed;
        this.velY = 0;
        this.setDimensionsFromText(ctx, this.text, this.fontStyle);
        this.x -= this.width / 2;
        this.y -= this.height / 2;
    }

    update(dt) {
        if (this.tracking && this.target && !this.target.shouldRemove) {
            if (this.target.right < SCREEN_WIDTH / 3) {
                this.tracking = false;
                this.velX = -this.speed * 1.5;
                this.velY = 0;
            } else {
                const targetPos = [this.target.centerX, this.target.centerY];
                const currentPos = [this.centerX, this.centerY];
                const dx = targetPos[0] - currentPos[0];
                const dy = targetPos[1] - currentPos[1];
                const dist = Math.hypot(dx, dy);
                if (dist < 5) {
                    this.shouldRemove = true;
                    return;
                }
                this.velX = (dx / dist) * this.speed;
                this.velY = (dy / dist) * this.speed;
            }
        } else if (!this.target || this.target.shouldRemove) {
            this.tracking = false;
            this.velX = -this.speed;
            this.velY = 0;
        }
        this.x += this.velX * dt;
        this.y += this.velY * dt;
        if (this.x < -100 || this.x > SCREEN_WIDTH + 100 || this.y < -100 || this.y > SCREEN_HEIGHT + 100) {
            this.shouldRemove = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.centerX, this.centerY);
        const angle = Math.atan2(this.velY, this.velX);
        ctx.rotate(angle);
        ctx.font = this.fontStyle;
        ctx.fillStyle = this.color;
        ctx.textAlign = "center";
        ctx.text