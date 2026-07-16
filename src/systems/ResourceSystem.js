import Phaser from 'phaser';
import ResourceNode from '../entities/ResourceNode.js';
import {
  RESOURCE_NODE_GATHER_RANGE,
  RESOURCE_NODE_GATHER_RATE,
  RESOURCE_NODE_RESPAWN_TIME,
} from '../config/Constants.js';

const POPUP_INTERVAL = 400; // ms - her frame yerine bu aralıkla toplu "+N" popup'ı göster

/**
 * Aktif kaynak toplama sistemi (maden/ağaç node'ları).
 *
 * - Oyuncu bir node'a RESOURCE_NODE_GATHER_RANGE içine girince otomatik toplama başlar,
 *   uzaklaşınca durur (idle/timer YOK - tamamen oyuncunun konumuna bağlı)
 * - Node'un sınırlı kaynağı vardır, tükenince "boşaldı" görünümüne geçer ve bir süre
 *   sonra kendiliğinden yenilenir (bkz. ResourceNode)
 * - Yakında (effectRadius) aktif bir ResourceExtractor varsa toplama hızı çarpılır
 *
 * NOT (Faz 4): Bu sistem artık kendi başına haritaya node dağıtmıyor. Node'lar, bir
 * chunk açıldığında FogOfWarSystem'in çağırdığı addNodesInArea() ile ekleniyor - böylece
 * kilitli/sisli alanlarda hiç obje oluşturulmuyor (performans + "henüz keşfedilmemiş bölgede
 * kaynak olmaz" mantığı).
 */
export default class ResourceSystem {
  constructor(scene, player, buildingSystem) {
    this.scene = scene;
    this.player = player;
    this.buildingSystem = buildingSystem;
    this.nodes = [];

    this.isGathering = false;
    this.activeNode = null;
    this.popupAccumulator = 0;
    this.pendingPopupAmount = 0;
  }

  /** FogOfWarSystem, bir chunk açıldığında o bölgeye rastgele birkaç node eklemek için çağırır */
  addNodesInArea(minX, minY, maxX, maxY, count) {
    for (let i = 0; i < count; i += 1) {
      const x = Phaser.Math.Between(minX, maxX);
      const y = Phaser.Math.Between(minY, maxY);
      const variant = Phaser.Math.Between(0, 1) === 0 ? 'tree' : 'rock';

      this.nodes.push(new ResourceNode(this.scene, x, y, variant));
    }
  }

  update(time, delta) {
    this.updateRespawns(time);
    this.updateGathering(time, delta);
  }

  updateRespawns(time) {
    for (const node of this.nodes) {
      if (node.isDepleted && time - node.depletedAt >= RESOURCE_NODE_RESPAWN_TIME) {
        node.respawn();
      }
    }
  }

  updateGathering(time, delta) {
    const node = this.findGatherableNodeInRange();

    this.isGathering = Boolean(node);
    this.activeNode = node;

    if (!node) {
      return;
    }

    const multiplier = this.getGatherMultiplier(node);
    const amountThisFrame = (RESOURCE_NODE_GATHER_RATE * multiplier * delta) / 1000;
    const gathered = node.extract(amountThisFrame);

    if (gathered > 0) {
      this.player.addResources(gathered);
      this.pendingPopupAmount += gathered;
    }

    this.popupAccumulator += delta;

    if (this.popupAccumulator >= POPUP_INTERVAL) {
      if (this.pendingPopupAmount > 0) {
        this.showGatherPopup(node, Math.round(this.pendingPopupAmount));
      }

      this.popupAccumulator = 0;
      this.pendingPopupAmount = 0;
    }
  }

  findGatherableNodeInRange() {
    let nearest = null;
    let nearestDistance = RESOURCE_NODE_GATHER_RANGE;

    for (const node of this.nodes) {
      if (node.isDepleted) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, node.x, node.y);

      if (distance <= nearestDistance) {
        nearest = node;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  /** Node, aktif bir ResourceExtractor'ın etki alanındaysa toplama hızını çarpar */
  getGatherMultiplier(node) {
    const extractors = this.buildingSystem.getResourceExtractors();

    const boostingExtractor = extractors.find(
      (extractor) => Phaser.Math.Distance.Between(extractor.x, extractor.y, node.x, node.y) <= extractor.effectRadius,
    );

    return boostingExtractor ? boostingExtractor.gatherMultiplier : 1;
  }

  showGatherPopup(node, amount) {
    const text = this.scene.add.text(node.x, node.y - 24, `+${amount}`, {
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#aed581',
      stroke: '#000000',
      strokeThickness: 3,
    });
    text.setOrigin(0.5, 0.5);
    text.setDepth(2000);

    this.scene.tweens.add({
      targets: text,
      y: node.y - 54,
      alpha: 0,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  destroy() {
    for (const node of this.nodes) {
      node.destroy();
    }
    this.nodes = [];
  }
}
