const bms = require("bms")

export class Chart {
    public lanes: any[][] = new Array()
    public longNoteBands: any[][] = new Array()

    public isHolds = new Array<boolean>(7).fill(false)

    public judges: number[] = [0, 0, 0, 0, 0, 0, 0]

    constructor(private scene: Phaser.Scene, private chart: any) {
        for (const i of [...Array(7)].map((_, i) => (i))) {
            this.lanes[i] = new Array()
            this.longNoteBands[i] = new Array()
        }

        const replacementNormalNote: any = {
            11: 0,
            12: 1,
            13: 2,
            14: 3,
            15: 4,
            18: 5,
            19: 6
        }

        const replacementLongNote: any = {
            51: 0,
            52: 1,
            53: 2,
            54: 3,
            55: 4,
            58: 5,
            59: 6
        }

        let isEndLongNote: boolean[] = new Array<boolean>(7).fill(false)
        let beatEndLongNote: number[] = new Array<number>(7).fill(-1)

        for (const object of chart.objects._objects) {
            let noteIndex: number = replacementNormalNote[parseInt(object.channel)]
            let isLongNoteStart: boolean = false
            let isLongNoteEnd: boolean = false
            const beat = chart.timeSignatures.measureToBeat(object.measure, object.fraction)

            if (parseInt(object.channel) in replacementLongNote) {
                noteIndex = replacementLongNote[parseInt(object.channel)]


                if (!isEndLongNote[noteIndex]) {
                    beatEndLongNote[noteIndex] = beat
                    isLongNoteStart = true
                } else {
                    isLongNoteEnd = true
                }
                isEndLongNote[noteIndex] = true

            }

            let noteColor: number = 0xffffff
            if (noteIndex == 1 || noteIndex == 5) {
                noteColor = 0x2faceb
            } else if (noteIndex == 3) {
                noteColor = 0xebb446
            }

            if (isLongNoteEnd && isEndLongNote[noteIndex] && beatEndLongNote[noteIndex] != beat) {
                noteColor = 0x888888
                isEndLongNote[noteIndex] = false

                const band = {
                    "startBeat": beatEndLongNote[noteIndex],
                    "endBeat": beat,
                    "rectangle": scene.add.rectangle(300 + 100 * noteIndex, 0, 100, 0, 0x888888, 128)
                }

                band.rectangle.depth = -1

                this.longNoteBands[noteIndex].push(band)
                beatEndLongNote[noteIndex] = -1
            }

            const note = {
                "beat": beat,
                "sec": bms.Timing.fromBMSChart(chart).beatToSeconds(beat),
                "rectangle": scene.add.rectangle(300 + 100 * noteIndex, 0, 100, 50, noteColor),
                "isJudged": false,
                "isLongStart": isLongNoteStart,
                "isLongEnd": isLongNoteEnd
            }

            note.rectangle.depth = 1

            if (0 <= noteIndex && noteIndex <= 7) {
                this.lanes[noteIndex].push(note)
            }
        }
        console.log(this.lanes, this.longNoteBands)
    }

    public getLanes(): any {
        return this.lanes
    }
    public getLongNoteBands(): any {
        return this.longNoteBands
    }

    public update(beat: number, playingSec: number, noteSpeed: number) {
        for (const i of [...Array(7)].map((_, i) => (i))) {
            for (const band of this.longNoteBands[i]) {
                band.rectangle.height = Math.max((band.endBeat - band.startBeat + Math.min(band.startBeat - (beat), 0)) * noteSpeed, 0)
                band.rectangle.y = 600 + (beat - band.startBeat) * noteSpeed - (band.endBeat - band.startBeat) * noteSpeed
                band.rectangle.y = 600 + Math.min((beat - band.endBeat) * noteSpeed, 0)
            }
            this.lanes[i].forEach((note: any, noteIndex: number) => {
                note.rectangle.y = 600 + Math.min((beat - note.beat) * noteSpeed, 0)
                if (!note.isJudged && ((!note.isLongEnd && note.sec + 0.5 < playingSec) || (note.isLongEnd && note.sec < playingSec))) {
                    note.isJudged = true
                    note.rectangle.visible = false
                    this.isHolds[i] = false

                    if (note.isLongStart) {
                        this.lanes[i][noteIndex + 1].isJudged = true
                        this.lanes[i][noteIndex + 1].rectangle.visible = false
                        for (const band of this.longNoteBands[i]) {
                            if (band.startBeat == note.beat) {
                                band.rectangle.visible = false
                            }

                        }
                    }

                    if (note.isLongEnd) {
                        this.judges[i]++
                    }
                }
            })
        }
    }

    public judgeKeyDown = (sec: number, laneIndex: number) => {
        for (const note of this.lanes[laneIndex]) {
            if (!note.isJudged && !note.isLongEnd && note.sec - 0.5 <= sec && sec <= note.sec + 0.5) {
                note.isJudged = true
                note.rectangle.visible = false
                this.judges[laneIndex]++

                if (note.isLongStart) {
                    this.isHolds[laneIndex] = true
                }

                return
            }
        }
    }

    public judgeKeyHold = (sec: number, laneIndex: number) => {
        this.isHolds[laneIndex] = false
        for (const note of this.lanes[laneIndex]) {
            if (!note.isJudged && note.isLongEnd) {
                note.isJudged = true
                note.rectangle.visible = false
                this.judges[laneIndex]++
                for (const band of this.longNoteBands[laneIndex]) {
                    if (band.endBeat == note.beat) {
                        band.rectangle.visible = false

                    }
                }
                return
            }
        }
    }
}