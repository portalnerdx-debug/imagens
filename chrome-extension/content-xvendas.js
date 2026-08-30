window.addEventListener("message", event => {
  if (event.source !== window || event.data?.source !== "XVENDAS_CLICK") return;
  chrome.runtime.sendMessage({type:"RUN_CLICK", payload:event.data.payload});
});