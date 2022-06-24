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

    private laneBackgrounds?: Phaser.GameObjects.Rectangle[]
    private laneBackgroundColors: number[] = [
        0x330d09,
        0x333109,
        0x123309,
        0x093325,
        0x091e33,
        0x190933,
        0x33092a
    ]

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

        this.laneBackgrounds = [...Array(7)].map((_, i) => (this.add.rectangle(300 + 100 * i, 360, 100, 720, this.laneBackgroundColors[i], 128)).setDepth(-2))


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

            this.chart.update(this.beat!, this.playingSec!, this.noteSpeed)

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