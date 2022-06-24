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
        const startTime = new Date()
        this.loadedSec = undefined

        this.keys = [
            this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F),
            this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J),
            this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K),
            this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L)
        ]

        const url = "./assets/test.bme"
        axios.get(url)
            .then((response: any) => {
                const bmsSource = response.data
                const compileResult = bms.Compiler.compile(bmsSource)

                console.log(compileResult.chart)

                this.chart = new Chart(this, compileResult.chart)

                this.timing = bms.Timing.fromBMSChart(compileResult.chart)

                const endTime = new Date()

                this.loadedSec = (this.time.now + endTime.getTime() - startTime.getTime()) / 1000
            })
            .catch((error: any) => {
                console.log(error)
            })
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
            this.playingSec = this.time.now / 1000 - this.loadedSec
            this.beat = this.timing.secondsToBeat(this.playingSec)
            this.timeText!.setText(`${this.chart.judges}`)
            //this.timeText!.setText(`${this.playingSec} ${this.beat}`)

            for (const i of [...Array(7)].map((_, i) => (i))) {
                for (const band of this.chart.longNoteBands[i]) {
                    band.rectangle.height = Math.max((band.endBeat - band.startBeat + Math.min(band.startBeat - (this.beat!),0)) * this.noteSpeed,0)
                    band.rectangle.y = 600 + (this.beat! - band.startBeat) * this.noteSpeed - (band.endBeat - band.startBeat) * this.noteSpeed
                    band.rectangle.y = 600 + Math.min((this.beat! - band.endBeat) * this.noteSpeed,0)
                }
                for (const note of this.chart.lanes[i]) {
                    note.rectangle.y = 600 + Math.min((this.beat! - note.beat) * this.noteSpeed,0)
                    if (!note.isJudged && ((!note.isLongEnd && note.sec + 0.5 < this.playingSec) || (note.isLongEnd && note.sec < this.playingSec))) {
                        note.isJudged = true
                        note.rectangle.visible = false
                        this.chart.isHolds[i] = false
                    }
                }
            }

            // key down
            for (const i of [...Array(7)].map((_, i) => (i))) {
                if (Phaser.Input.Keyboard.JustDown(this.keys[i])) {
                    this.chart.judgeKeyDown(this.playingSec, i)
                }
            }

            // key hold
            for (const i of [...Array(7)].map((_, i) => (i))) {
                if (this.chart.isHolds[i] && !this.keys[i].isDown) {
                    this.chart.judgeKeyHold(this.playingSec, i)

                }
            }

        }
    }
}