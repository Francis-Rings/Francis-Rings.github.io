document.querySelectorAll(".play-all").forEach((button) => {
  button.addEventListener("click", () => {
    const videos = [...button.closest(".case-card").querySelectorAll("video")];
    const shouldPause = button.dataset.playing === "true";

    videos.forEach((video) => {
      if (shouldPause) {
        video.pause();
      } else {
        video.muted = true;
        video.currentTime = 0;
        video.play().catch(() => {});
      }
    });

    button.dataset.playing = String(!shouldPause);
    button.textContent = shouldPause ? "Play all · muted" : "Pause all";
  });
});

// YouTube rejects embedded playback from file:// pages because there is no
// HTTP Referer. The bundled launcher opens this page through localhost.
if (window.location.protocol === "file:") {
  document.querySelector(".youtube-wrap").hidden = true;
  document.querySelector(".youtube-local-help").hidden = false;
}
