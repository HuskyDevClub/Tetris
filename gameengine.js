// This game shell was happily modified from Googler Seth Ladd's "Bad Aliens" game and his Google IO talk in 2011

class GameEngine {
    constructor(options) {
        // What you will use to draw
        // Documentation: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
        this.ctx = null;

        // Information on the input
        this.click = null;
        this.mouse = null;
        this.wheel = null;
        this.keys = {};
        this.row = 32
        this.coloum = 16
        this.map2d = new Array(this.row).fill(undefined).map(() => new Array(this.coloum).fill(undefined).map(() => 0))
        this.blocks = [
            [
                [1, 1, 1, 1]
            ],
            [
                [1, 0, 0],
                [1, 1, 1]
            ], [
                [0, 0, 1],
                [1, 1, 1]
            ], [
                [0, 1, 0],
                [1, 1, 1]
            ], [
                [1, 1],
                [1, 1]
            ], [
                [1, 1, 0],
                [0, 1, 1],
            ], [
                [0, 1, 1],
                [1, 1, 0]
            ],
        ]

        this.currentBlock = null
        this.currentX = 8
        this.currentY = 0

        this.resetCurrentBlock()


        // Options and the Details
        this.options = options || {
            debugging: false,
        };
    };

    init(ctx) {
        this.ctx = ctx;
        this.startInput();
        this.timer = new Timer();
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

        this.ctx.canvas.addEventListener("mousemove", e => {
            if (this.options.debugging) {
                console.log("MOUSE_MOVE", getXandY(e));
            }
            this.mouse = getXandY(e);
        });

        this.ctx.canvas.addEventListener("click", e => {
            if (this.options.debugging) {
                console.log("CLICK", getXandY(e));
            }
            this.click = getXandY(e);
        });


        this.ctx.canvas.addEventListener("contextmenu", e => {
            if (this.options.debugging) {
                console.log("RIGHT_CLICK", getXandY(e));
            }
            e.preventDefault(); // Prevent Context Menu
            this.rightclick = getXandY(e);
        });

        this.ctx.canvas.addEventListener("keydown", event => this.keys[event.code] = true);
        this.ctx.canvas.addEventListener("keyup", event => this.keys[event.code] = false);
    };

    draw() {
        // Clear the whole canvas with transparent color (rgba(0, 0, 0, 0))
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        for (let y = 0; y < this.map2d.length; y++) {
            for (let x = 0; x < this.map2d[y].length; x++) {
                if (this.map2d[y][x] === 0) {
                    this.ctx.beginPath();
                    this.ctx.rect(x * 22, y * 22, 20, 20);
                    this.ctx.stroke();
                } else {
                    this.ctx.fillRect(x * 22, y * 22, 20, 20);
                }
            }
        }

        for (let y = 0; y < this.currentBlock.length; y++) {
            for (let x = 0; x < this.currentBlock[y].length; x++) {
                if (this.currentBlock[y][x] === 1) this.ctx.fillRect(Math.floor(this.currentX + x) * 22, Math.floor(this.currentY + y) * 22, 20, 20);
            }
        }

    };

    checkcollision() {
        if (this.currentBlock != null) {
            for (let y = 0; y < this.currentBlock.length; y++) {
                for (let x = 0; x < this.currentBlock[y].length; x++) {
                    if (this.currentBlock[y][x] === 1 && this.map2d[Math.floor(this.currentY + y)][this.currentX + x] === 1) {
                        return true
                    }
                }
            }
        }
        return false
    }

    checkFallEnded() {
        if (this.currentY > this.row - 1 || this.checkcollision()) {
            for (let y = 0; y < this.currentBlock.length; y++) {
                for (let x = 0; x < this.currentBlock[y].length; x++) {
                    if (this.currentBlock[y][x] === 1) this.map2d[Math.floor(this.currentY + y) - 1][this.currentX + x] = 1
                }
            }
            this.resetCurrentBlock()
            return true
        }
        return false
    }

    resetCurrentBlock() {
        this.currentBlock = this.blocks[Math.floor(Math.random() * this.blocks.length)]
        this.currentY = 0
    }

    update() {

        if (this.keys["ArrowDown"] || this.keys["KeyS"]) {
            for (let y = Math.floor(this.currentY); y < this.row; y++) {
                if (this.checkFallEnded()) {
                    break;
                }
                this.currentY += 1
            }
        } else {
            if (this.keys["ArrowLeft"] || this.keys["KeyA"]) {
                this.currentX -= 1
            } else if (this.keys["ArrowRight"] || this.keys["KeyD"]) {
                this.currentX += 1
            }
            this.currentY += 0.1
            this.currentX = Math.min(Math.max(this.currentX, 0), this.coloum - this.currentBlock[0].length)
            this.checkFallEnded()
        }
    };

    loop() {
        this.clockTick = this.timer.tick();
        this.update();
        this.draw();
    };

};

// KV Le was here :)