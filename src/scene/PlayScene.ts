import { Chart } from '../class/Chart'

const bms = require("bms")
const axios = require("axios")

export class PlayScene extends Phaser.Scene {

    private chart?: any
    private timing?: any
    private timingSignatures?: any

    private timeText?: Phaser.GameObjects.Text

    private judgeLine?: Phaser.GameObjects.Rectangle

    private loadedTime?: number
    private playingTime?: number
    private beat?: number

    constructor() {
        super("play")
    }

    init() {
        const url = "./assets/test.bme"
        axios.get(url)
            .then((response: any) => {
                const bmsSource = response.data
                const compileResult = bms.Compiler.compile(bmsSource)

                console.log(compileResult.chart)

                this.chart = new Chart(this, compileResult.chart)

                this.timing = bms.Timing.fromBMSChart(compileResult.chart)

                console.log("ロード完了時間", this.time.now)
                this.loadedTime = this.time.now
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
        if (this.loadedTime != undefined) {
            this.playingTime = this.time.now - this.loadedTime
            this.beat = this.timing.secondsToBeat(this.playingTime / 1000)
            this.timeText!.setText(`${this.beat}`)

            for (const i of [...Array(7)].map((_, i) => (i))) {
                for (const note of this.chart.lanes[i]) {
                    note.rectangle.y = 600 + (this.beat! - note.beat) * 200
                }
            }


        }
    }
}