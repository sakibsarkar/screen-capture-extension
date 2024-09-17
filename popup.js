document.getElementById("captureBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // Reset the capture state in content.js before starting a new capture
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        func: () => {
          chrome.runtime.sendMessage({ action: "startCapture" });
        },
      },
      () => {
        // Now start the capture script
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ["content.js"],
        });
      }
    );
  });
});
