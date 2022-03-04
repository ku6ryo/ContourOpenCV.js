import Stats from "stats.js";
import { PiecesDetector } from "./PiecesDetector";

declare global {
  interface Window {
    cv: any;
  }
}

const stats = new Stats()
document.body.appendChild(stats.dom)

async function main() {
  const mainCanvas = document.createElement("canvas")
  const MAIN_CANVAS_ID = "mainCanvas"
  mainCanvas.id = MAIN_CANVAS_ID
  mainCanvas.style.height = "100vh"
  mainCanvas.style.width = "100vw"
  mainCanvas.style.transform = "scale(-1, 1)"
  const mainContext = mainCanvas.getContext("2d")!
  document.querySelector(".container")!.appendChild(mainCanvas)

  const cameraVideo = document.createElement("video");
  const cameraCanvas = document.createElement("canvas");
  cameraCanvas.style.display = "none"
  document.body.appendChild(cameraCanvas)
  cameraVideo.addEventListener("playing", () => {
    const vw = cameraVideo.videoWidth
    const vh = cameraVideo.videoHeight
    mainCanvas.width = vw
    mainCanvas.height = vh
    mainCanvas.style.maxHeight = `calc(100vw * ${vh / vw})`
    mainCanvas.style.maxWidth = `calc(100vh * ${vw / vh})`
    cameraCanvas.width = vw
    cameraCanvas.height = vh
    requestAnimationFrame(process)
  })
  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: {
          ideal: 640
        },
        height: {
          ideal: 360
        }
      },
    })
    .then(function (stream) {
      cameraVideo.srcObject = stream;
      cameraVideo.play();
    })
    .catch(function (e) {
      console.log(e)
      console.log("Something went wrong!");
    });
  } else {
    alert("getUserMedia not supported on your browser!");
  }

  const detector = new PiecesDetector()
  detector.setProcessRatio(0.5)

  async function process () {
    stats.begin()
    cameraCanvas.getContext("2d")!.drawImage(cameraVideo, 0, 0)
    const boxes = detector.process(cameraCanvas)

    mainContext.drawImage(cameraVideo, 0, 0)
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i]
      const { x, y, width, height, image} = box
      mainContext.drawImage(
        await createImageBitmap(image),
        0, 0, image.width, image.height,
        x, y, width, height
      )
      mainContext.strokeStyle = "red"
      mainContext.strokeRect(x, y, width, height)
    }
    stats.end()
    requestAnimationFrame(process)
  }
}

main()