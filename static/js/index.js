document.addEventListener("DOMContentLoaded", () => {
  let lastScrollTop = 0;
  const navbar = document.querySelector(".navbar");

  window.addEventListener("scroll", () => {
    const currentScroll =
      window.pageYOffset || document.documentElement.scrollTop;

    if (currentScroll > lastScrollTop && currentScroll > 100) {
      navbar.style.backgroundColor = "transparent";
      navbar.classList.add("fade-out");
    } else {
      navbar.classList.remove("fade-out");
    }

    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  });

  AOS.init({
    duration: 800,
    once: true,
    offset: 120,
  });

  // Start the video when it enters the viewport
  const video = document.querySelector("#video iframe");

  if (!video) return;

  const videoUrl = video.dataset.videoUrl;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          video.src = videoUrl + "?autoplay=1";
          observer.unobserve(video);
        }
      });
    },
    {
      threshold: 0.5,
    }
  );

  observer.observe(video);
});