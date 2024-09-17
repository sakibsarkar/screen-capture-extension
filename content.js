let isCapturing = false;
let startX, startY, endX, endY, selectionBox;

function startCapture(e) {
  if (isCapturing) return; // Prevent starting another capture if one is in progress
  isCapturing = true;

  startX = e.clientX;
  startY = e.clientY;

  selectionBox = document.createElement("div");
  selectionBox.style.position = "fixed";
  selectionBox.style.border = "2px dashed #000";
  selectionBox.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
  selectionBox.style.pointerEvents = "none";
  document.body.appendChild(selectionBox);

  document.addEventListener("mousemove", updateSelectionBox);
  document.addEventListener("mouseup", finishCapture);
}

function updateSelectionBox(e) {
  endX = e.clientX;
  endY = e.clientY;

  selectionBox.style.left = `${Math.min(startX, endX)}px`;
  selectionBox.style.top = `${Math.min(startY, endY)}px`;
  selectionBox.style.width = `${Math.abs(endX - startX)}px`;
  selectionBox.style.height = `${Math.abs(endY - startY)}px`;
}

function finishCapture() {
  document.removeEventListener("mousemove", updateSelectionBox);
  document.removeEventListener("mouseup", finishCapture);

  // Dynamically load html2canvas
  loadHtml2Canvas()
    .then(() => {
      html2canvas(document.body, {
        x: Math.min(startX, endX),
        y: Math.min(startY, endY),
        width: Math.abs(endX - startX),
        height: Math.abs(endY - startY),
      }).then((canvas) => {
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          chrome.storage.local.set({ screenshotUrl: url });

          // Download the image
          const a = document.createElement("a");
          a.href = url;
          a.download = "screenshot.png";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          // Remove the selection box and reset capturing state
          if (selectionBox) document.body.removeChild(selectionBox);
          isCapturing = false; // Reset capturing flag

          // Notify the popup.js to reset UI state
          chrome.runtime.sendMessage({ action: "captureFinished" });
        });
      });
    })
    .catch((error) => {
      console.error("Error loading html2canvas:", error);
      isCapturing = false; // Reset on error as well
    });
}

// Load html2canvas dynamically
function loadHtml2Canvas() {
  return new Promise((resolve, reject) => {
    if (window.html2canvas) {
      resolve(); // html2canvas already loaded
    } else {
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load html2canvas"));
      document.head.appendChild(script);
    }
  });
}

// Start capture on mouse down
document.addEventListener("mousedown", (e) => {
  if (!isCapturing) {
    startCapture(e);
  }
});

// Listen for messages from popup.js to reset capturing
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startCapture") {
    isCapturing = false; // Reset capturing state
  }
});
