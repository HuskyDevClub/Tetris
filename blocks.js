class Blocks {
    static #BLOCKS = [
        [
            [[1, 1, 1, 1]],
        ],
        [
            [
                [1, 0, 0],
                [1, 1, 1]
            ]
        ], [
            [
                [0, 0, 1],
                [1, 1, 1]
            ]
        ], [
            [
                [0, 1, 0],
                [1, 1, 1]
            ]
        ], [
            [
                [1, 1],
                [1, 1]
            ]
        ], [
            [
                [1, 1, 0],
                [0, 1, 1]
            ]
        ], [
            [
                [0, 1, 1],
                [1, 1, 0]
            ]
        ],
    ]
    static {
        for (let i = 0; i < this.#BLOCKS.length; i++) {
            for (let j = 1; j < 4; j++) {
                this.#BLOCKS[i].unshift(this.#transpose(this.#BLOCKS[i][0]))
            }
        }
    }

    static #transpose(a) {
        let temp = new Array(a[0].length); // number of columns

        for (let i = 0; i < temp.length; i++) {
            temp[i] = [];
        }

        for (let i = 0; i < a.length; i++) {
            for (let j = 0; j < a[0].length; j++) {
                temp[j][i] = a[i][a[i].length - 1 - j];
            }
        }

        return temp;
    }

    static new() {
        const blockType = Math.floor(Math.random() * this.#BLOCKS.length)
        const blockVariance = Math.floor(Math.random() * this.#BLOCKS[blockType].length)
        return new Block(blockType, blockVariance)
    }

    static get(blockType, blockVariance) {
        return this.#BLOCKS[blockType][blockVariance]
    }

    static next(blockType, blockVariance) {
        return (blockVariance + 1) % this.#BLOCKS[blockType].length
    }
}

class Block {
    #type
    #variance

    constructor(_type, _variance) {
        this.#type = _type
        this.#variance = _variance
        this.x = 0
        this.y = 0
    }

    rotate() {
        this.#variance = Blocks.next(this.#type, this.#variance)
    }

    getWidth() {
        return Blocks.get(this.#type, this.#variance)[0].length
    }

    getHeight() {
        return Blocks.get(this.#type, this.#variance).length
    }

    getRight() {
        return this.x + this.getWidth()
    }

    setRight(value) {
        this.x = value - this.getWidth()
    }

    data() {
        return Blocks.get(this.#type, this.#variance)
    }
}