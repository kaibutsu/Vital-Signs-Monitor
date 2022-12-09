// ECG
const ecgSigContext = document.getElementById("ecgSigCanvas").getContext("2d");
const ecgBufferContext = document.getElementById("ecgBufferCanvas").getContext("2d");
ecgSigContext.canvas.width = ecgSigContext.canvas.parentElement.clientWidth;
ecgSigContext.canvas.height = ecgSigContext.canvas.parentElement.clientHeight;

// SpO2
const spoSigContext = document.getElementById("spoSigCanvas").getContext("2d", { willReadFrequently: true });
const spoBufferContext = document.getElementById("spoBufferCanvas").getContext("2d", { willReadFrequently: true });
spoSigContext.canvas.width = spoSigCanvas.parentElement.clientWidth;
spoSigContext.canvas.height = spoSigCanvas.parentElement.clientHeight;

// General
const signalPixelsPerSecond = 200;

// Theming
fallbackColor = "white";
fallbackWidth = 4;

spoSigContext.strokeStyle = "skyblue";
spoSigContext.lineWidth = fallbackWidth;

ecgSigContext.strokeStyle = "lawngreen";
ecgSigContext.lineWidth = fallbackWidth;


// Initialize Buffer
let spoBufferPointer = {
  pos: 0,
  size: 0,
};
let ecgBufferPointer = {
  pos: 0,
  size: 0,
};
let nIntervId = null;

function drawSignals() {
  animateSignal(ecgSigContext, ecgBufferContext, ecgBufferPointer, "ecg")
  animateSignal(spoSigContext, spoBufferContext, spoBufferPointer, "spo")
}

if (!nIntervId) {
  nIntervId = setInterval(drawSignals, 1000 / signalPixelsPerSecond);
}

function bufferNextCurve(context, bufferContext, bufferPointer, type="spo", eventRate = 60, amplitude = 0.9) {
  // Adapt buffer size to one heart beat:
  let bufferWidth = bufferContext.canvas.width = 60 / eventRate * signalPixelsPerSecond;
  let bufferHeigth = bufferContext.canvas.height = context.canvas.height - context.lineWidth * 2

  // Set line color and width:
  bufferContext.strokeStyle = context.strokeStyle;
  bufferContext.lineWidth = context.lineWidth;

  // pleth signal height could be adjusted later:
  let maxSigHeight = bufferHeigth * amplitude
  let minValue = bufferHeigth - bufferContext.lineWidth
  // calculate points to draw curve
  if (type === "spo") {
    points = [
      { x: 0, y: minValue },
      { x: 0.1 * bufferWidth, y: minValue },
      { x: 0.2 * bufferWidth, y: minValue - maxSigHeight },
      { x: 0.4 * bufferWidth, y: minValue - 0.4 * maxSigHeight },
      { x: 0.7 * bufferWidth, y: minValue - 0.5 * maxSigHeight },
      { x: 0.9 * bufferWidth, y: minValue },
      { x: 1 * bufferWidth, y: minValue },
    ]
  } else {
    points = [
      { x: 0, y: minValue - maxSigHeight },
      { x: 0.03 * bufferWidth, y: minValue - 0.1 * maxSigHeight  },
      { x: 0.1 * bufferWidth, y: minValue - 0.2 * maxSigHeight  },
      { x: 0.2 * bufferWidth, y: minValue - 0.2 * maxSigHeight  },
      { x: 0.275 * bufferWidth, y: minValue - 0.35 * maxSigHeight },
      { x: 0.35 * bufferWidth, y: minValue - 0.2 * maxSigHeight },
      { x: 0.5 * bufferWidth, y: minValue - 0.2 * maxSigHeight },
      { x: 0.625 * bufferWidth, y: minValue - 0.2 * maxSigHeight  },
      { x: 0.7 * bufferWidth, y: minValue - 0.35 * maxSigHeight },
      { x: 0.775 * bufferWidth, y: minValue - 0.2 * maxSigHeight },
      { x: 0.9 * bufferWidth, y: minValue - 0.2 * maxSigHeight  },
      { x: 0.97 * bufferWidth, y: minValue - 0.2 * maxSigHeight  },
      { x: 1 * bufferWidth, y: minValue - maxSigHeight},
    ]
  }
  
  // interpolate curve
  // from: https://stackoverflow.com/questions/7054272/how-to-draw-smooth-curve-through-n-points-using-javascript-html5-canvas
  bufferContext.moveTo(points[0].x, points[0].y);
  for (i = 1; i < points.length - 2; i++) {
    var xc = (points[i].x + points[i + 1].x) / 2;
    var yc = (points[i].y + points[i + 1].y) / 2;
    bufferContext.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
  }
  bufferContext.quadraticCurveTo(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
  bufferContext.stroke();
  bufferPointer.pos = 0;
  bufferPointer.size=bufferWidth;
}

function animateSignal(context, bufferContext, bufferPointer, type="spo") {
  if (!(bufferPointer.pos < bufferPointer.size)) {
    console.log("Buffering new event for", context.canvas.id)
    bufferNextCurve(context, bufferContext, bufferPointer, type);
  }
  bufferContext.save;
  let bufferedCol = bufferContext.getImageData(bufferPointer.pos, 0, 1, context.canvas.height)
  // shift everything to the left:
  oldImageData = context.getImageData(1, 0, context.canvas.width - 1, context.canvas.height)
  context.putImageData(oldImageData, 0, 0);
  // Write buffer column to right end:
  context.putImageData(bufferedCol, context.canvas.width - 1, 0);
  
  bufferPointer.pos = bufferPointer.pos + 1;
  bufferContext.restore()
}
