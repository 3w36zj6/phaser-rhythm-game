import { Chart } from '../class/Chart'

const bms = require("bms")
const axios = require("axios")

export class PlayScene extends Phaser.Scene {

    private chart?: any
    private timing?: any
    private timingSignatures?: any

    private timeText?: Phaser.GameObjects.Text

    private judgeLine?: Phaser.GameObjects.Rectangle

    private loadedSec?: number
    private playingSec?: number
    private beat?: number

    private noteSpeed: number = 300

    private keys?: any

    constructor() {
        super("play")
    }

    init() {
        this.keys = this.input.keyboard.addKeys({
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D,
            F: Phaser.Input.Keyboard.KeyCodes.F,
            SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
            J: Phaser.Input.Keyboard.KeyCodes.J,
            K: Phaser.Input.Keyboard.KeyCodes.K,
            L: Phaser.Input.Keyboard.KeyCodes.L
        })

        const url = "./assets/test.bme"
        axios.get(url)
            .then((response: any) => {
                const bmsSource = response.data
                const compileResult = bms.Compiler.compile(bmsSource)

                console.log(compileResult.chart)

                this.chart = new Chart(this, compileResult.chart)

                this.timing = bms.Timing.fromBMSChart(compileResult.chart)

                console.log("ロード完了時間", this.time.now)
                this.loadedSec = this.time.now / 1000
            })
            .catch((error: any) => {
                console.log(error)
            })
            .then()
    }

    create() {
        const { width, height } = this.game.canvas

        this.add.text(0, 0, "play scene")
        this.timeText = this.add.text(0, 50, `ロード中`)

        this.judgeLine = this.add.rectangle(640, 600, 1280, 10, 0xff0000)

        const zone = this.add.zone(width / 2, height / 2, width, height)
        zone.setInteractive({
            useHandCursor: true
        })
        zone.on("pointerdown", () => {
            this.scene.start("title")
        })

    }
    update(time: number, dt: number) {
        if (this.loadedSec != undefined) {
            this.playingSec = this.time.now/1000 - this.loadedSec
            this.beat = this.timing.secondsToBeat(this.playingSec)
            this.timeText!.setText(`${this.beat}`)

            for (const i of [...Array(7)].map((_, i) => (i))) {
                for (const band of this.chart.longNoteBands[i]) {
                    band.rectangle.height = (band.endBeat - band.startBeat) * this.noteSpeed
                    band.rectangle.y = 600 + (this.beat! - band.startBeat) * this.noteSpeed - (band.endBeat - band.startBeat) * this.noteSpeed

                }
                for (const note of this.chart.lanes[i]) {
                    note.rectangle.y = 600 + (this.beat! - note.beat) * this.noteSpeed
                }
            }

            if (Phaser.Input.Keyboard.JustDown(this.keys.S)) {
                this.chart.judge(this.playingSec, 0)
            }
            if (Phaser.Input.Keyboard.JustDown(this.keys.D)) {
                this.chart.judge(this.playingSec, 1)
            }
            if (Phaser.Input.Keyboard.JustDown(this.keys.F)) {
                this.chart.judge(this.playingSec, 2)
            }
            if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
                this.chart.judge(this.playingSec, 3)
            }
            if (Phaser.Input.Keyboard.JustDown(this.keys.J)) {
                this.chart.judge(this.playingSec, 4)
            }
            if (Phaser.Input.Keyboard.JustDown(this.keys.K)) {
                this.chart.judge(this.playingSec, 5)
            }
            if (Phaser.Input.Keyboard.JustDown(this.keys.L)) {
                this.chart.judge(this.playingSec, 6)
            }

        }
    }
}