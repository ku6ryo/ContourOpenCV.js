import Stats from "stats.js";

declare global {
  interface Window {
    cv: any;
  }
}
const cv = window.cv

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
  const CAMERA_CANVAS_ID = "cameraCanvas"
  const cameraCanvas = document.createElement("canvas");
  cameraCanvas.id = CAMERA_CANVAS_ID
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
          ideal: 320
        },
        height: {
          ideal: 180
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

  async function process () {
    stats.begin()
    cameraCanvas.getContext("2d")!.drawImage(cameraVideo, 0, 0)
    let src = cv.imread(CAMERA_CANVAS_ID);
    let dst = new cv.Mat();
    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
    cv.threshold(dst, dst, 100, 255, cv.THRESH_OTSU);
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(dst, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);
    const filterd = new cv.MatVector()
    for (let i = 0; i < contours.size(); i++) {
      if (contours.get(i).size().height > 10) {
        filterd.push_back(contours.get(i))

      }
    }
    // console.log(filterd.size())
    // cv.drawContours(src, filterd, -1, [255, 0, 0, 255], 2);
    cv.imshow(MAIN_CANVAS_ID, src);
    for (let i = 0; i < contours.size(); i++) {
      if (contours.get(i).size().height > 10) {
        filterd.push_back(contours.get(i))
        const c = contours.get(i)
        mainContext.beginPath();
        for (let j = 0; j < c.size().height; j++) {
          const x = c.data32S[j * 2]
          const y = c.data32S[j * 2 + 1]
          if (j == 0) {
            mainContext.moveTo(x, y);
          } else {
            mainContext.lineTo(x, y);
          }
        }
        mainContext.closePath();
        mainContext.fill();
      }
    }
    src.delete();
    dst.delete();
    stats.end()
    requestAnimationFrame(process)
  }
}

main()