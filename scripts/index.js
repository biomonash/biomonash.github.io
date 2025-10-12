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
});
