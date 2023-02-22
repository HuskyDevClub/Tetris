// This game shell was happily modified from Googler Seth Ladd's "Bad Aliens" game and his Google IO talk in 2011

class GameEngine {

    static mouse = {x: 0, y: 0, radius: 0, leftClick: false, rightClick: false};

    constructor() {
        // What you will use to draw
        // Documentation: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
        this.ctx = null;
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
        this.currentBlock = null
        this.nextBlock = Blocks.new();
        this.nextYFrameCounter = 0
    };

    start() {
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
            e.preventDefault(); // Prevent Context Menu
        });

        this.ctx.canvas.addEventListener("keydown", event => {
            this.keys[event.code] = true;
        });
        this.ctx.canvas.addEventListener("keyup", event => {
            this.keys[event.code] = false
            this.keysHaveUp[event.code] = true
        });
    };

    drawBlock(_block, offsetX = 0, offsetY = 0) {
        for (let y = 0; y < _block.getHeight(); y++) {
            for (let x = 0; x < _block.data()[y].length; x++) {
                this.ctx.fillStyle = "black"
                if (_block.data()[y][x] === 1) {
                    this.ctx.fillRect(
                        (_block.x + x) * (this.blockPixelWidth + this.paddingX) + offsetX,
                        (_block.y + y) * (this.blockPixelHeight + this.paddingY) + offsetY,
                        this.blockPixelWidth, this.blockPixelHeight
                    );
                }
            }
        }
    }

    draw() {
        // Clear the whole canvas with transparent color (rgba(0, 0, 0, 0))
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        let fontSize = 35
        if (this.currentBlock == null) {
            //title
            this.drawText("Tetris", fontSize * 2, Math.floor((this.ctx.canvas.width - this.measureText("Start", fontSize * 2)) / 2), fontSize * 5, "black")
            // start button
            const paddingT = this.blockPixelWidth / 2
            let _rect = [0, 0, this.measureText("Start", fontSize) + paddingT * 2, fontSize + paddingT]
            _rect[0] = Math.floor((this.ctx.canvas.width - _rect[2]) / 2)
            _rect[1] = Math.floor((this.ctx.canvas.height - _rect[3]) / 2)
            let buttonColor;
            if (GameEngine.mouse.x > _rect[0] && GameEngine.mouse.x < _rect[0] + _rect[2] && GameEngine.mouse.y > _rect[1] && GameEngine.mouse.y < _rect[1] + _rect[3]) {
                buttonColor = "red"
                if (GameEngine.mouse.leftClick) {
                    this.resetCurrentBlock()
                    ASSET_MANAGER.getMusicByPath("./music.mp3").play()
                }
            } else {
                buttonColor = "black"
            }
            this.ctx.strokeStyle = buttonColor;
            this.ctx.strokeRect(_rect[0], _rect[1], _rect[2], _rect[3]);
            this.drawText("Start", fontSize, _rect[0] + paddingT, _rect[1] + fontSize, "white", buttonColor)
        } else {
            for (let y = 0; y < this.map2d.length; y++) {
                for (let x = 0; x < this.map2d[y].length; x++) {
                    if (this.map2d[y][x] === 0) {
                        this.ctx.beginPath();
                        if (y >= this.currentBlock.y + this.currentBlock.getHeight() && x >= this.currentBlock.x && x < this.currentBlock.x + this.currentBlock.getWidth()) {
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

            this.drawBlock(this.currentBlock)
            this.drawBlock(this.nextBlock, this.coloum * (this.blockPixelWidth + this.paddingX) * 1.1, 10 * (this.blockPixelHeight + this.paddingY))

            // render score
            this.drawText("Score:", fontSize, this.coloum * (this.blockPixelWidth + this.paddingX) * 1.05, 3 * (this.blockPixelHeight + this.paddingY))
            this.drawText(this.score, fontSize, this.coloum * (this.blockPixelWidth + this.paddingX) * 1.05, 5 * (this.blockPixelHeight + this.paddingY))
            this.drawText("Next:", fontSize, this.coloum * (this.blockPixelWidth + this.paddingX) * 1.05, 9 * (this.blockPixelHeight + this.paddingY))

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
                if (GameEngine.mouse.x > _rect[0] && GameEngine.mouse.x < _rect[0] + _rect[2] && GameEngine.mouse.y > _rect[1] && GameEngine.mouse.y < _rect[1] + _rect[3]) {
                    buttonColor = "red"
                    if (GameEngine.mouse.leftClick) {
                        this.init(this.ctx)
                        this.resetCurrentBlock()
                        ASSET_MANAGER.getMusicByPath("./music.mp3").play()
                    }
                } else {
                    buttonColor = "black"
                }
                this.ctx.strokeStyle = buttonColor;
                this.ctx.strokeRect(_rect[0], _rect[1], _rect[2], _rect[3]);
                this.drawText("Retry", fontSize, _rect[0] + paddingT, _rect[1] + fontSize, "white", buttonColor)
            }
        }
    };

    measureText(text, fontSize) {
        this.ctx.font = `bold ${fontSize}px arial`
        return this.ctx.measureText(text).width
    }

    drawText(text, fontSize, pixelX, pixelY, _fillStyle = 'white', _strokeStyle = 'black') {
        this.ctx.font = `bold ${fontSize}px arial`
        this.ctx.fillStyle = _fillStyle;
        this.ctx.strokeStyle = _strokeStyle;
        this.ctx.fillText(text, pixelX, pixelY)
        this.ctx.strokeText(text, pixelX, pixelY)
    }

    isCurrentBlockCollidingWithAnything() {
        if (this.currentBlock != null) {
            for (let y = 0; y < this.currentBlock.getHeight(); y++) {
                for (let x = 0; x < this.currentBlock.data()[y].length; x++) {
                    if (this.currentBlock.data()[y][x] === 1 && this.currentBlock.y + y >= 0 && this.map2d[this.currentBlock.y + y][this.currentBlock.x + x] === 1) {
                        return true
                    }
                }
            }
        }
        return false
    }

    resetCurrentBlock() {
        this.currentBlock = this.nextBlock;
        this.nextBlock = Blocks.new();
        this.currentBlock.y = -1
        this.currentBlock.x = getRandomIntInclusive(0, this.coloum - this.currentBlock.getWidth() - 1)
    }

    finishUp() {
        if (this.currentBlock.y >= 0) {
            // update original map matrix
            for (let y = 0; y < this.currentBlock.getHeight(); y++) {
                for (let x = 0; x < this.currentBlock.data()[y].length; x++) {
                    if (this.currentBlock.data()[y][x] === 1) this.map2d[this.currentBlock.y + y][this.currentBlock.x + x] = 1
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
            ASSET_MANAGER.getMusicByPath("./music.mp3").pause()
            ASSET_MANAGER.getMusicByPath("./music.mp3").currentTime = 0
        }
    }

    tryMoveHorizontally(value) {
        const nextX = this.currentBlock.x + value
        if (nextX < 0 || nextX + this.currentBlock.getWidth() > this.coloum) {
            return false;
        } else {
            this.currentBlock.x = nextX
            if (this.isCurrentBlockCollidingWithAnything()) {
                this.currentBlock.x -= value
                return false;
            }
            return true;
        }
    }

    tryMoveDown() {
        const nextY = this.currentBlock.y + 1
        if (this.row + 1 <= nextY + this.currentBlock.getHeight()) {
            return false;
        } else {
            this.currentBlock.y = nextY
            if (this.isCurrentBlockCollidingWithAnything()) {
                this.currentBlock.y -= 1
                return false;
            }
            return true;
        }
    }

    update() {
        if (this.currentBlock != null && !this.gameOver) {
            if (this.keysHaveUp["ArrowDown"] || this.keysHaveUp["KeyS"]) {
                while (this.tryMoveDown()) {
                }// try to move all the way down
                this.finishUp()
                this.keysHaveUp["ArrowDown"] = false;
                this.keysHaveUp["KeyS"] = false;
            } else if (this.keysHaveUp["ArrowUp"] || this.keysHaveUp["KeyW"]) {
                this.currentBlock.rotate()
                if (this.currentBlock.getRight() > this.coloum) {
                    this.currentBlock.setRight(this.coloum)
                }
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
                this.nextYFrameCounter += this.clockTick * 5
                if (this.nextYFrameCounter >= 1) {
                    if (!this.tryMoveDown()) {
                        this.finishUp()
                    }
                    this.nextYFrameCounter = 0
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