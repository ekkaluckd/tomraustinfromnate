import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { SPRITES, spriteCanvas } from './sprites.js'

const SKY = { day: [0x7cc6ff, 0xd8efff], dusk: [0x3a55a0, 0xff9fb0], night: [0x0d1a3a, 0x3a55a0] }

class MainScene extends Phaser.Scene {
  constructor() {
    super('main')
  }

  create() {
    for (const [key, def] of Object.entries(SPRITES)) {
      if (!this.textures.exists(key)) this.textures.addCanvas(key, spriteCanvas(def))
    }
    this.anims.create({ key: 'austin', frames: [{ key: 'austin0' }, { key: 'austin1' }], frameRate: 2, repeat: -1 })
    this.anims.create({ key: 'nate', frames: [{ key: 'nate0' }, { key: 'nate1' }], frameRate: 2, repeat: -1 })

    this.sky = this.add.graphics()
    this.ground = this.add.graphics()
    this.clouds = [0, 1, 2].map((i) =>
      this.add.image(0, 0, 'cloud').setOrigin(0.5).setAlpha(0.95).setData('speed', 6 + i * 4),
    )
    this.nate = this.add.sprite(0, 0, 'nate0').setOrigin(0.5, 1).play('nate')
    this.austin = this.add.sprite(0, 0, 'austin0').setOrigin(0.5, 1).play({ key: 'austin', delay: 250 })
    this.bigHeart = this.add.image(0, 0, 'heart').setOrigin(0.5)
    this.tweens.add({ targets: this.bigHeart, scaleX: '*=1.15', scaleY: '*=1.15', yoyo: true, repeat: -1, duration: 500 })

    this.mood = this.game.registry.get('mood') || 'day'
    this.layout()
    this.scale.on('resize', () => this.layout())

    this.time.addEvent({ delay: 700, loop: true, callback: () => this.ambient() })
    this.game.events.on('mood', (m) => {
      this.mood = m
      this.drawSky()
    })
    this.game.events.on('cheer', () => this.burst())
  }

  layout() {
    const { width: w, height: h } = this.scale
    this.px = Math.max(3, Math.floor(Math.min(h / 34, w / 40)))
    this.groundY = h - this.px * 4
    this.drawSky()
    this.clouds.forEach((c, i) => c.setScale(this.px * 0.8).setPosition((w / 3) * i + 30, this.px * (4 + i * 4)))
    this.nate.setScale(this.px).setPosition(w / 2 - this.px * 11, this.groundY)
    this.austin.setScale(this.px).setPosition(w / 2 + this.px * 11, this.groundY)
    this.bigHeart.setScale(this.px * 0.9).setPosition(w / 2, this.groundY - this.px * 18)
  }

  drawSky() {
    const { width: w, height: h } = this.scale
    const [top, bottom] = SKY[this.mood] || SKY.day
    this.sky.clear()
    this.sky.fillGradientStyle(top, top, bottom, bottom, 1)
    this.sky.fillRect(0, 0, w, h)
    this.ground.clear()
    this.ground.fillStyle(0x22356b).fillRect(0, this.groundY, w, h - this.groundY)
    this.ground.fillStyle(0x4f86d9)
    for (let x = 0; x < w; x += this.px * 4) this.ground.fillRect(x, this.groundY, this.px * 2, this.px)
  }

  update(_, dt) {
    const w = this.scale.width
    for (const c of this.clouds) {
      c.x += (c.getData('speed') * dt) / 1000
      if (c.x - c.displayWidth / 2 > w) c.x = -c.displayWidth / 2
    }
  }

  ambient() {
    const { width: w } = this.scale
    if (this.mood === 'water') {
      for (let i = 0; i < 2; i++) {
        const d = this.add.image(Phaser.Math.Between(0, w), -10, 'drop').setScale(this.px * 0.7)
        this.tweens.add({ targets: d, y: this.groundY, duration: 1400, ease: 'Quad.easeIn', onComplete: () => d.destroy() })
      }
    } else if (this.mood === 'night' || this.mood === 'dusk') {
      const s = this.add.image(Phaser.Math.Between(0, w), Phaser.Math.Between(4, this.groundY * 0.5), 'star')
      s.setScale(this.px * 0.5).setAlpha(0)
      this.tweens.add({ targets: s, alpha: 1, yoyo: true, duration: 900, onComplete: () => s.destroy() })
    } else {
      this.floatHeart(this.scale.width / 2 + Phaser.Math.Between(-this.px * 6, this.px * 6), 0.5)
    }
  }

  floatHeart(x, size = 0.6) {
    const hrt = this.add.image(x, this.groundY - this.px * 16, 'heart').setScale(this.px * size)
    this.tweens.add({
      targets: hrt,
      y: hrt.y - this.px * 14,
      alpha: 0,
      duration: 1600,
      ease: 'Sine.easeOut',
      onComplete: () => hrt.destroy(),
    })
  }

  burst() {
    for (let i = 0; i < 10; i++) {
      this.time.delayedCall(i * 60, () => this.floatHeart(Phaser.Math.Between(0, this.scale.width), 0.7))
    }
    for (const s of [this.nate, this.austin]) {
      this.tweens.add({ targets: s, y: this.groundY - this.px * 4, yoyo: true, duration: 180, repeat: 1 })
    }
  }
}

export default function Stage({ mood, cheer }) {
  const host = useRef(null)
  const game = useRef(null)

  useEffect(() => {
    game.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host.current,
      pixelArt: true,
      transparent: true,
      scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
      scene: MainScene,
      banner: false,
    })
    return () => game.current.destroy(true)
  }, [])

  useEffect(() => {
    game.current?.registry.set('mood', mood)
    game.current?.events.emit('mood', mood)
  }, [mood])

  useEffect(() => {
    if (cheer) game.current?.events.emit('cheer')
  }, [cheer])

  return <div className="stage" ref={host} aria-hidden="true" />
}
