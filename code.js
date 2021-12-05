document.addEventListener("DOMContentLoaded", function () {
  // elements to use
  const video = document.querySelector("#videoElement");
  const artCanvas = document.querySelector("#artCanvas");
  const blockSlider = document.querySelector("#blockSlider");
  const blockSizeSlider = document.querySelector("#blockSizeSlider");

  // variables
  let blocksAcross = 100;
  let blockSize = 10;

  // listeners
  blockSlider.addEventListener("input", onBlockSliderChange);
  blockSlider.addEventListener("change", onBlockSliderChange);
  blockSizeSlider.addEventListener("change", onBlockSizeChange);

  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({
        video: { width: 1280, height: 720 }
      })
      .then(function (stream) {
        video.srcObject = stream;
      })
      .catch(function (error) {
        console.log("video error: ", error);
      });
  }

  // functions
  function onBlockSliderChange(event) {
    const value = event.target.value;
    blocksAcross = value;
  }

  function onBlockSizeChange(event) {
    const value = event.target.value;
    blockSize = value;
  }

  const draw = function () {
    const frameCanvas = document.createElement("canvas");
    frameCanvas.width = 1280;
    frameCanvas.height = 720;
    const frameCtx = frameCanvas.getContext("2d");
    frameCtx.translate(frameCanvas.width, 0);
    frameCtx.scale(-1, 1);
    frameCtx.drawImage(video, 0, 0);

    const c = createInterlacedBlockCanvas(frameCanvas, blocksAcross, blockSize);
    artCanvas.width = c.width;
    artCanvas.height = c.height;
    const ctx = artCanvas.getContext("2d");
    ctx.drawImage(c, 0, 0);

    window.requestAnimationFrame(draw);
  };

  draw();
});

const createInterlacedBlockCanvas = (source, maxWidth, blockSize) => {
  const smallCanvas = createSmallCanvas(source, maxWidth);
  const offCanvs = createOffsetCanvas(smallCanvas);

  const { width: inputW, height: inputH } = smallCanvas;

  const maxSize = blockSize * 1.2;
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = inputW * blockSize;
  outputCanvas.height = inputH * blockSize;
  const outputCtx = outputCanvas.getContext("2d");

  const inputCtx = smallCanvas.getContext("2d");
  let imgData = inputCtx.getImageData(0, 0, inputW, inputH);
  let pixels = imgData.data;

  for (let y = 0; y < inputH; y += 2) {
    for (let x = 0; x < inputW; x++) {
      const i = (y * inputW + x) * 4;

      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      const grey = r * 0.2126 + g * 0.7152 + b * 0.0722;
      const fraction = 1 - grey / 255;

      outputCtx.fillStyle = `rgb(0,0,0)`;
      const brightnessSize = fraction * maxSize;
      const offset = (blockSize - brightnessSize) / 2;

      drawFillCircle({
        ctx: outputCtx,
        cornerX: x * blockSize + offset,
        cornerY: y * blockSize + offset,
        size: brightnessSize,
        colour: "red"
      });
    }
  }

  const offInputCtx = offCanvs.getContext("2d");
  let offImgData = offInputCtx.getImageData(
    0,
    0,
    offCanvs.width,
    offCanvs.height
  );
  let offPixels = offImgData.data;
  const startX = blockSize / 2;

  for (let y = 1; y < offCanvs.height; y += 2) {
    for (let x = 0; x < offCanvs.width; x++) {
      const i = (y * offCanvs.width + x) * 4;

      const r = offPixels[i];
      const g = offPixels[i + 1];
      const b = offPixels[i + 2];

      const grey = r * 0.2126 + g * 0.7152 + b * 0.0722;
      const fraction = 1 - grey / 255;

      outputCtx.fillStyle = `rgb(0,0,0)`;
      const adjustedBlockSize = fraction * maxSize;
      const offset = (blockSize - adjustedBlockSize) / 2;

      drawFillCircle({
        ctx: outputCtx,
        cornerX: x * blockSize + offset + startX,
        cornerY: y * blockSize + offset,
        size: adjustedBlockSize,
        colour: "red"
      });
    }
  }

  return outputCanvas;
};

const createSmallCanvas = (source, maxWidth, maxHeight) => {
  const sourceW = source.width;
  const sourceH = source.height;

  const wToHRatio = sourceH / sourceW;
  const hToWRatio = sourceW / sourceH;

  // allow maxHeight or maxWidth to be null
  if (!maxWidth) maxWidth = source.width;
  if (!maxHeight) maxHeight = source.height;

  let targetW = maxWidth;
  let targetH = targetW * wToHRatio;

  if (sourceH > maxHeight) {
    targetH = maxHeight;
    targetW = targetH * hToWRatio;
  }

  const smallCanvas = document.createElement("canvas");
  const ctx = smallCanvas.getContext("2d");
  smallCanvas.width = targetW;
  smallCanvas.height = targetH;

  ctx.drawImage(source, 0, 0, sourceW, sourceH, 0, 0, targetW, targetH);

  return smallCanvas;
};

const createOffsetCanvas = (source) => {
  const outWidth = source.width - 1;
  const outHeight = source.height - 1;

  const offsetCanvas = document.createElement("canvas");
  offsetCanvas.width = outWidth;
  offsetCanvas.height = outHeight;
  const ctx = offsetCanvas.getContext("2d");
  ctx.drawImage(source, 1, 1, outWidth, outHeight, 0, 0, outWidth, outHeight);

  return offsetCanvas;
};

const drawFillCircle = ({ ctx, cornerX, cornerY, size, colour }) => {
  const radius = size / 2;
  const centerX = cornerX + radius;
  const centerY = cornerY + radius;

  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);

  ctx.fill();
};
