export class Chart {
    public lanes: any[][] = new Array()

    constructor(private scene: Phaser.Scene, private chart: any) {
        for (const i of [...Array(7)].map((_, i) => (i))) {
            this.lanes[i] = new Array()
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

        for (const object of chart.objects._objects) {
            let noteIndex: number = replacementNormalNote[parseInt(object.channel)]
            let isLongNote: boolean = false

            if (parseInt(object.channel) in replacementLongNote) {
                noteIndex = replacementLongNote[parseInt(object.channel)]
                isLongNote = true
            }

            let noteColor: number = 0xffffff
            if (noteIndex == 1 || noteIndex == 5) {
                noteColor = 0x2faceb
            } else if (noteIndex == 3) {
                noteColor = 0xebb446
            }

            const note = {
                "beat": this.chart.timeSignatures.measureToBeat(object.measure, object.fraction),
                "rectangle": scene.add.rectangle(200 + 100 * noteIndex, 0, 100, 30, noteColor),
                "isJudged": false,
            }
            if (0 <= noteIndex && noteIndex <= 7) {
                this.lanes[noteIndex].push(note)
            }
        }
        console.log(this.lanes)
    }

    public getLanes(): any {
        return this.lanes
    }
}