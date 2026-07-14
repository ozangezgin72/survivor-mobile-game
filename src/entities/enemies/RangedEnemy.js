import Enemy, { EnemyState } from '../Enemy.js';
import {
  RANGED_ENEMY_HEALTH,
  RANGED_ENEMY_MOVE_SPEED,
  RANGED_ENEMY_ATTACK_DAMAGE,
  RANGED_ENEMY_ATTACK_RANGE,
  RANGED_ENEMY_ATTACK_SPEED,
  RANGED_ENEMY_RETREAT_DISTANCE,
  RANGED_ENEMY_GOLD_DROP_MIN,
  RANGED_ENEMY_GOLD_DROP_MAX,
} from '../../config/Constants.js';

/**
 * Menzilli düşman: oyuncuya yaklaşmaya çalışmaz, menzilden vurur. Oyuncu çok yaklaşırsa
 * (retreatDistance'ın altına girerse) geri çekilir - basit bir mesafe koruma/kiting davranışı.
 * Bu, base Enemy'nin updateCombatMovement()'ını override ederek elde ediliyor.
 */
export default class RangedEnemy extends Enemy {
  static textureKey = 'ranged-enemy-placeholder';
  static displayName = 'Menzilli Düşman';

  constructor(scene, x, y) {
    super(scene, x, y, {
      health: RANGED_ENEMY_HEALTH,
      moveSpeed: RANGED_ENEMY_MOVE_SPEED,
      attackDamage: RANGED_ENEMY_ATTACK_DAMAGE,
      attackRange: RANGED_ENEMY_ATTACK_RANGE,
      attackSpeed: RANGED_ENEMY_ATTACK_SPEED,
      goldDropMin: RANGED_ENEMY_GOLD_DROP_MIN,
      goldDropMax: RANGED_ENEMY_GOLD_DROP_MAX,
      textureKey: RangedEnemy.textureKey,
    });

    this.retreatDistance = RANGED_ENEMY_RETREAT_DISTANCE;
  }

  /** oyuncu çok yaklaştı -> geri çekil; menzil içinde -> dur ve vur; menzil dışında -> yaklaş */
  updateCombatMovement(distanceToPlayer, player, delta, blockers) {
    if (distanceToPlayer < this.retreatDistance) {
      this.moveAway(player.x, player.y, this.moveSpeed, delta, blockers);
      this.state = EnemyState.CHASE;
    } else if (distanceToPlayer <= this.attackRange) {
      this.state = EnemyState.ATTACK;
      this.blockedBy = null;
    } else {
      this.moveToward(player.x, player.y, this.moveSpeed, delta, blockers);
      this.state = this.blockedBy ? EnemyState.ATTACK : EnemyState.CHASE;
    }
  }
}
