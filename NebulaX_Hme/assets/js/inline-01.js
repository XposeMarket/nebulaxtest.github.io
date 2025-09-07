
  window.addEventListener("error", (e) => {
    // Ignore generic cross-origin errors (iframes/CDNs)
    const fromAnotherOrigin = e.message === "Script error." &&
      (!e.filename || (location.origin !== "null" && !e.filename.startsWith(location.origin)));

    if (fromAnotherOrigin) return;

    const box = document.getElementById("err");
    const pre = document.getElementById("err-msg");
    if (box && pre) {
      pre.textContent = (e.error && e.error.stack) ? e.error.stack : (e.message || String(e));
      box.style.display = "block";
    }
  });
