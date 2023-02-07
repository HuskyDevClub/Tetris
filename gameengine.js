// This game shell was happily modified from Googler Seth Ladd's "Bad Aliens" game and his Google IO talk in 2011

class GameEngine {

    static mouse = {x: 0, y: 0, radius: 0, leftClick: false, rightClick: false};

    constructor(options) {
        // What you will use to draw
        // Documentation: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
        this.ctx = null;

        // Information on the input
        this.click = null;

        // Options and the Details
        this.options = options || {
            debugging: false,
        };
    };

    init(ctx) {
        this.ctx = ctx;
        this.startInput();
        this.timer = new Timer();
        this.keys = {};
        this.keysHaveUp = {};
        this.row = 32
        this.coloum = 16
        this.map2d = new Array(this.row).fill(undefined).map(() => new Array(this.coloum).fill(undefined).map(() => 0))
        this.blockPixelWidth = 20
        this.blockPixelHeight = 20
        this.paddingX = 2
        this.paddingY = 2
        this.score = 0
        this.gameOver = false
        this.blocks = [
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

        for (let i = 0; i < this.blocks.length; i++) {
            for (let j = 1; j < 4; j++) {
                this.blocks[i].unshift(this.transpose(this.blocks[i][0]))
            }
        }

        this.currentBlockType = -1
        this.currentBlockVariance = -1

        this.currentX = 0
        this.currentY = -1
        this.nextYCount = 0

        this.resetCurrentBlock()
    };

    start() {
        this.running = true;
        const gameLoop = () => {
            this.loop();
            requestAnimFrame(gameLoop, this.ctx.canvas);
        };
        gameLoop();
    };

    startInput() {
        const getXandY = e => ({
            x: e.clientX - this.ctx.canvas.getBoundingClientRect().left,
            y: e.clientY - this.ctx.canvas.getBoundingClientRect().top
        });

        function mouseListener(e) {
            GameEngine.mouse = {...GameEngine.mouse, ...getXandY(e)};
        }

        function mouseDown(e) {
            switch (e.button) {
                case 0:
                    GameEngine.mouse.leftClick = true
                    break;
                case 2:
                    GameEngine.mouse.rightClick = true;
                    break;
            }
        }

        function mouseUp(e) {
            switch (e.button) {
                case 0:
                    GameEngine.mouse.leftClick = false
                    break;
                case 2:
                    GameEngine.mouse.rightClick = false;
                    break;
            }
        }


        this.ctx.canvas.addEventListener("mousemove", mouseListener);
        this.ctx.canvas.addEventListener("mousedown", mouseDown, false);
        this.ctx.canvas.addEventListener("mouseup", mouseUp, false);
        this.ctx.canvas.addEventListener("contextmenu", e => {
            if (this.options.debugging) {
                console.log("RIGHT_CLICK", getXandY(e));
            }
            e.preventDefault(); // Prevent Context Menu
            this.rightclick = getXandY(e);
        });

        this.ctx.canvas.addEventListener("keydown", event => {
            this.keys[event.code] = true;
        });
        this.ctx.canvas.addEventListener("keyup", event => {
            this.keys[event.code] = false
            this.keysHaveUp[event.code] = true
        });
    };

    getCurrentBlock() {
        return this.currentBlockType >= 0 && this.currentBlockType >= 0 ? this.blocks[this.currentBlockType][this.currentBlockVariance] : null
    }

    draw() {
        // Clear the whole canvas with transparent color (rgba(0, 0, 0, 0))
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        for (let y = 0; y < this.map2d.length; y++) {
            for (let x = 0; x < this.map2d[y].length; x++) {
                if (this.map2d[y][x] === 0) {
                    this.ctx.beginPath();
                    if (y >= this.currentY + this.getCurrentBlock().length && x >= this.currentX && x < this.currentX + this.getCurrentBlock()[0].length) {
                        this.ctx.strokeStyle = "red"
                    } else {
                        this.ctx.strokeStyle = "black"
                    }
                    this.ctx.rect(x * (this.blockPixelWidth + this.paddingX), y * (this.blockPixelHeight + this.paddingY), this.blockPixelWidth, this.blockPixelHeight);
                    this.ctx.stroke();
                } else {
                    this.ctx.fillStyle = "black"
                    this.ctx.fillRect(x * (this.blockPixelWidth + this.paddingX), y * (this.blockPixelHeight + this.paddingY), this.blockPixelWidth, this.blockPixelHeight);
                }
            }
        }

        for (let y = 0; y < this.getCurrentBlock().length; y++) {
            for (let x = 0; x < this.getCurrentBlock()[y].length; x++) {
                this.ctx.fillStyle = "black"
                if (this.getCurrentBlock()[y][x] === 1) {
                    this.ctx.fillRect(
                        (this.currentX + x) * (this.blockPixelWidth + this.paddingX),
                        (this.currentY + y) * (this.blockPixelHeight + this.paddingY),
                        this.blockPixelWidth, this.blockPixelHeight
                    );
                }
            }
        }
        // write score

        let fontSize = 35

        this.drawText(this.score, fontSize, 400, 100)

        if (this.gameOver) {
            const boxWidth = this.blockPixelWidth * 15
            const boxHeight = this.blockPixelHeight * 20


            const boxX = (this.coloum * this.blockPixelWidth - boxWidth) / 2
            const boxY = (this.row * this.blockPixelHeight - boxHeight) / 2


            this.ctx.fillStyle = 'white';
            this.ctx.strokeStyle = 'black';
            this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
            this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

            this.drawText("Game Over", fontSize, (boxWidth - this.ctx.measureText("Game Over").width) / 2, boxY + fontSize * 3)
            this.drawText(`Final Score: ${this.score}`, fontSize, (boxWidth - this.ctx.measureText(`Final Score: ${this.score}`).width) / 2, boxY + fontSize * 6)

            // retry button
            const paddingT = this.blockPixelWidth / 2
            let _rect = [boxX, boxY + fontSize * 3, this.ctx.measureText("Retry").width + paddingT * 2, fontSize + paddingT]
            _rect[0] += Math.floor((boxWidth - _rect[2]) / 2)
            _rect[1] += Math.floor(boxHeight - _rect[3]) / 2
            let buttonColor;
            if (GameEngine.mouse.x > _rect[0] && GameEngine.mouse.x < _rect[0] + _rect[2] && GameEngine.mouse.y > _rect[1] && GameEngine.mouse.x < _rect[1] + _rect[3]) {
                buttonColor = "red"
                if (GameEngine.mouse.leftClick) {
                    this.init(this.ctx)
                }
            } else {
                buttonColor = "black"
            }
            this.ctx.strokeStyle = buttonColor;
            this.ctx.strokeRect(_rect[0], _rect[1], _rect[2], _rect[3]);
            this.drawText("Retry", fontSize, _rect[0] + paddingT, _rect[1] + fontSize, "white", buttonColor)

        }
    };

    drawText(text, fontSize, pixelX, pixelY, _fillStyle = 'white', _strokeStyle = 'black') {
        this.ctx.font = `bold ${fontSize}px arial`
        this.ctx.fillStyle = _fillStyle;
        this.ctx.strokeStyle = _strokeStyle;
        this.ctx.fillText(text, pixelX, pixelY)
        this.ctx.strokeText(text, pixelX, pixelY)
    }

    isCurrentBlockCollidingWithAnything() {
        if (this.getCurrentBlock() != null) {
            for (let y = 0; y < this.getCurrentBlock().length; y++) {
                for (let x = 0; x < this.getCurrentBlock()[y].length; x++) {
                    if (this.getCurrentBlock()[y][x] === 1 && this.map2d[this.currentY + y][this.currentX + x] === 1) {
                        return true
                    }
                }
            }
        }
        return false
    }

    resetCurrentBlock() {
        this.currentBlockType = Math.floor(Math.random() * this.blocks.length)
        this.currentBlockVariance = Math.floor(Math.random() * this.blocks[this.currentBlockType].length)
        this.currentY = -1
        this.currentX = getRandomIntInclusive(0, this.coloum - this.getCurrentBlock()[0].length - 1)
    }

    transpose(a) {
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

    finishUp() {
        if (this.currentY >= 0) {
            // update original map matrix
            for (let y = 0; y < this.getCurrentBlock().length; y++) {
                for (let x = 0; x < this.getCurrentBlock()[y].length; x++) {
                    if (this.getCurrentBlock()[y][x] === 1) this.map2d[this.currentY + y][this.currentX + x] = 1
                }
            }
            // checking if any rows have been cleared
            for (let y = 0; y < this.row; y++) {
                const index = this.map2d[y].indexOf(0);
                if (index < 0) {
                    this.score += 100
                    this.map2d.splice(y, 1)
                    this.map2d.unshift(new Array(this.coloum).fill(undefined).map(() => 0))
                }
            }
            // get a new block
            this.resetCurrentBlock()
        } else {
            this.gameOver = true
        }
    }

    tryMoveHorizontally(value) {
        const nextX = this.currentX + value
        if (nextX < 0 || nextX + this.getCurrentBlock()[0].length > this.coloum) {
            return false;
        } else {
            this.currentX = nextX
            if (this.isCurrentBlockCollidingWithAnything()) {
                this.currentX -= value
                return false;
            }
            return true;
        }
    }

    tryMoveDown() {
        const nextY = this.currentY + 1
        if (this.row + 1 <= nextY + this.getCurrentBlock().length) {
            return false;
        } else {
            this.currentY = nextY
            if (this.isCurrentBlockCollidingWithAnything()) {
                this.currentY -= 1
                return false;
            }
            return true;
        }
    }

    update() {
        if (!this.gameOver) {
            if (this.keysHaveUp["ArrowDown"] || this.keysHaveUp["KeyS"]) {
                while (this.tryMoveDown()) {
                }// try to move all the way down
                this.finishUp()
                this.keysHaveUp["ArrowDown"] = false;
                this.keysHaveUp["KeyS"] = false;
            } else if (this.keysHaveUp["ArrowUp"] || this.keysHaveUp["KeyW"]) {
                this.currentBlockVariance += 1
                this.currentBlockVariance %= this.blocks[this.currentBlockType].length
                this.keysHaveUp["ArrowUp"] = false;
                this.keysHaveUp["KeyW"] = false;
            } else {
                if (this.keysHaveUp["ArrowLeft"] || this.keysHaveUp["KeyA"]) {
                    this.tryMoveHorizontally(-1)
                    this.keysHaveUp["ArrowLeft"] = false;
                    this.keysHaveUp["KeyA"] = false;
                } else if (this.keysHaveUp["ArrowRight"] || this.keysHaveUp["KeyD"]) {
                    this.tryMoveHorizontally(1)
                    this.keysHaveUp["ArrowRight"] = false;
                    this.keysHaveUp["KeyD"] = false;
                }
                this.nextYCount += this.clockTick * 5
                if (this.nextYCount >= 1) {
                    if (!this.tryMoveDown()) {
                        this.finishUp()
                    }
                    this.nextYCount = 0
                }
            }
        }
    };

    loop() {
        this.clockTick = this.timer.tick();
        this.update();
        this.draw();
    };

}

// KV Le was here :)