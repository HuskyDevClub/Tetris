class AssetManager {
    constructor() {
        this.successCount = 0;
        this.errorCount = 0;
        this.musicCache = {};
        this.musicDownloadQueue = [];
    };

    queueDownloadMusic(path) {
        this.musicDownloadQueue.push(path);
    }

    isDone() {
        return this.musicDownloadQueue.length === this.successCount + this.errorCount;
    };

    #downloadAllMusic(callback) {
        if (this.musicDownloadQueue.length === 0) setTimeout(callback, 10);
        for (let i = 0; i < this.musicDownloadQueue.length; i++) {
            const audio = new Audio();

            const path = this.musicDownloadQueue[i];

            audio.addEventListener("loadeddata", () => {
                this.successCount++;
                console.log(`${path} loaded`)
                if (this.isDone()) callback();
            });

            audio.addEventListener("error", () => {
                this.errorCount++;
                if (this.isDone()) callback();
            });

            audio.addEventListener("ended", () => {
                audio.pause()
                audio.currentTime = 0
            });

            audio.src = path;
            audio.volume = 0.5
            audio.load()

            this.musicCache[path] = audio;
        }
    };

    downloadAll(callback) {
        this.#downloadAllMusic(callback)
    };

    getMusicByPath(path) {
        return this.musicCache[path];
    };

    playMusic(path) {
        const musicPtr = this.getMusicByPath(path)
        if (document.getElementById("mute").checked) {
            musicPtr.volume = 0
        } else {
            musicPtr.volume = document.getElementById("volume").value
        }
        musicPtr.play()
    }
}

