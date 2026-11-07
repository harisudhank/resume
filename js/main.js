const hero = document.querySelector(".hero");
const video = document.querySelector(".hero__video");
const revealItems = [...document.querySelectorAll(".hero .reveal")];
const siteHeader = document.querySelector(".site-header");
const skillsSection = document.querySelector(".skills");
const projectsSection = document.querySelector(".projects");
const educationSection = document.querySelector(".education");
const copyrightYear = document.querySelector("#copyright-year");

if (copyrightYear) {
  copyrightYear.textContent = String(new Date().getFullYear());
}

const scrollRevealTargets = document.querySelectorAll(
  ".skills__eyebrow, .skills__title, .skills__group, " +
  ".projects__eyebrow, .projects__title, .project-card, " +
  ".education__title, .education__entry, .contact__panel",
);

if (
  scrollRevealTargets.length > 0 &&
  "IntersectionObserver" in window &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches
) {
  const scrollRevealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-in-view", entry.isIntersecting);
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -24px 0px" },
  );

  const revealGroupIndexes = new Map();

  scrollRevealTargets.forEach((target) => {
    const group = target.closest(".skills__groups, .projects__grid") ?? target.parentElement;
    const index = revealGroupIndexes.get(group) ?? 0;
    revealGroupIndexes.set(group, index + 1);
    target.classList.add("scroll-reveal");
    target.style.setProperty("--scroll-reveal-delay", `${index * 70}ms`);
    scrollRevealObserver.observe(target);
  });
}

if (siteHeader && skillsSection && projectsSection && educationSection) {
  const updateHeaderTheme = () => {
    const headerBottom = siteHeader.getBoundingClientRect().bottom;
    const activeSection = [skillsSection, projectsSection, educationSection].find((section) => {
      const bounds = section.getBoundingClientRect();
      return bounds.top <= headerBottom && bounds.bottom > headerBottom;
    });

    siteHeader.classList.toggle(
      "on-skills",
      activeSection === skillsSection || activeSection === educationSection,
    );
  };

  window.addEventListener("scroll", updateHeaderTheme, { passive: true });
  window.addEventListener("resize", updateHeaderTheme);
  updateHeaderTheme();
}

if (hero && video && revealItems.length > 0) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobileLayout = window.matchMedia("(max-width: 640px)");

  const showAllContent = () => {
    hero.classList.remove("is-syncing");
    revealItems.forEach((item) => item.classList.add("is-visible"));
  };

  const revealMobileContent = () => {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  };

  if (reducedMotion) {
    video.pause();
    showAllContent();
  } else if (mobileLayout.matches) {
    const revealBeforeVideoEnds = () => {
      if (Number.isFinite(video.duration) && video.duration - video.currentTime <= 4) {
        revealMobileContent();
        video.removeEventListener("timeupdate", revealBeforeVideoEnds);
      }
    };

    video.src = video.dataset.mobileSrc;
    video.loop = false;
    video.addEventListener("timeupdate", revealBeforeVideoEnds);
    video.addEventListener("ended", revealMobileContent, { once: true });
    video.addEventListener("error", revealMobileContent, { once: true });
    video.load();
    video.play().catch((error) => {
      console.warn("Unable to autoplay the mobile hero video.", error);
      revealMobileContent();
    });
  } else {
    video.src = video.dataset.desktopSrc;

    const revealWithPlayback = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        return;
      }

      const progress = video.currentTime / video.duration;

      revealItems.forEach((item) => {
        const revealAt = Number(item.dataset.revealAt);
        item.classList.toggle("is-visible", progress >= revealAt);
      });
    };

    const handleLoadedMetadata = () => {
      revealWithPlayback();
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", revealWithPlayback);
    video.addEventListener("seeked", revealWithPlayback);
    video.addEventListener("ended", showAllContent);
    video.addEventListener("error", showAllContent);

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      handleLoadedMetadata();
    }

    video.load();
  }
}
