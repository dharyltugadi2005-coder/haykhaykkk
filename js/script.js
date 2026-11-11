    const loader = document.getElementById("loader");
    window.addEventListener("load", () => setTimeout(() => loader.classList.add("hidden"), 550));

    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");
    menuToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    });
    navLinks.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
    }));

    const audioPlayer = document.querySelector(".audio-player");
    const audioStatus = document.getElementById("audioStatus");
    const audioSource = audioPlayer.querySelector("source");
    const currentTrackName = document.getElementById("currentTrackName");
    const playlistTracks = document.querySelectorAll(".playlist-track");
    const musicCardArt = document.querySelector(".music-card-art");
    const fireWaves = musicCardArt.querySelectorAll(".fire-wave");
    const spotifyDisplay = document.querySelector(".spotify-display");
    const uncleDagsToggle = document.getElementById("uncleDagsToggle");
    const uncleDagsTracks = document.getElementById("uncleDagsTracks");
    const waiianToggle = document.getElementById("waiianToggle");
    const waiianTracks = document.getElementById("waiianTracks");
    let playRequest = 0;
    let audioContext;
    let analyser;
    let audioData;
    let visualizerFrame;

    function updateFireVisualizer() {
      if (!analyser || audioPlayer.paused) return;
      analyser.getByteFrequencyData(audioData);
      fireWaves.forEach((wave, index) => {
        const start = Math.floor(index * 24 / fireWaves.length);
        const end = Math.max(start + 1, Math.floor((index + 1) * 24 / fireWaves.length));
        const level = audioData.slice(start, end).reduce((total, value) => total + value, 0) / (end - start);
        wave.style.setProperty("--audio-scale", (0.72 + level / 255 * 0.9).toFixed(2));
      });
      visualizerFrame = requestAnimationFrame(updateFireVisualizer);
    }

    async function startFireVisualizer() {
      try {
        if (!analyser) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (!AudioContextClass) return;
          audioContext = new AudioContextClass();
          analyser = audioContext.createAnalyser();
          analyser.fftSize = 128;
          audioData = new Uint8Array(analyser.frequencyBinCount);
          audioContext.createMediaElementSource(audioPlayer).connect(analyser);
          analyser.connect(audioContext.destination);
        }
        if (audioContext.state === "suspended") await audioContext.resume();
        musicCardArt.classList.add("is-playing");
        cancelAnimationFrame(visualizerFrame);
        updateFireVisualizer();
      } catch (error) {
        console.error("The audio visualizer could not start.", error);
      }
    }

    async function playCurrentTrack() {
      const request = ++playRequest;
      try {
        await audioPlayer.play();
        await startFireVisualizer();
        if (request === playRequest) audioStatus.textContent = "Now playing.";
      } catch (error) {
        if (request !== playRequest) return;
        audioStatus.textContent = error.name === "NotAllowedError"
          ? "Autoplay was blocked by your browser. Press Play to start this track."
          : "This track could not start. Press Play to try again.";
      }
    }

    function toggleArtistSpotlight(toggle, tracks) {
      const shouldExpand = toggle.getAttribute("aria-expanded") !== "true";
      [uncleDagsToggle, waiianToggle].forEach(item => item.setAttribute("aria-expanded", "false"));
      [uncleDagsTracks, waiianTracks].forEach(item => {
        item.classList.remove("is-open");
        item.setAttribute("aria-hidden", "true");
        item.inert = true;
      });
      if (shouldExpand) {
        toggle.setAttribute("aria-expanded", "true");
        tracks.setAttribute("aria-hidden", "false");
        tracks.inert = false;
        tracks.classList.add("is-open");
      }
      spotifyDisplay.classList.toggle("has-expanded-list", shouldExpand);
    }

    uncleDagsToggle.addEventListener("click", () => {
      toggleArtistSpotlight(uncleDagsToggle, uncleDagsTracks);
    });

    waiianToggle.addEventListener("click", () => {
      toggleArtistSpotlight(waiianToggle, waiianTracks);
    });

    playlistTracks.forEach(track => track.addEventListener("click", () => {
      playlistTracks.forEach(item => {
        const isSelected = item === track;
        item.classList.toggle("is-active", isSelected);
        item.setAttribute("aria-pressed", String(isSelected));
      });
      audioPlayer.pause();
      playRequest++;
      audioSource.src = track.dataset.trackSrc;
      currentTrackName.textContent = track.dataset.trackTitle;
      audioPlayer.load();
      audioStatus.textContent = "Starting track...";
      playCurrentTrack();
    }));

    audioPlayer.addEventListener("play", startFireVisualizer);
    audioPlayer.addEventListener("playing", () => {
      audioStatus.textContent = "Now playing.";
    });
    audioPlayer.addEventListener("pause", () => {
      musicCardArt.classList.remove("is-playing");
      cancelAnimationFrame(visualizerFrame);
      fireWaves.forEach(wave => wave.style.removeProperty("--audio-scale"));
    });

    audioPlayer.addEventListener("ended", () => {
      const activeTrack = Array.from(playlistTracks).find(track => track.classList.contains("is-active"));
      const playlist = activeTrack && activeTrack.closest(".track-list");
      const tracks = playlist ? Array.from(playlist.querySelectorAll(".playlist-track")) : [];
      const currentIndex = tracks.indexOf(activeTrack);
      if (currentIndex < 0 || tracks.length < 2) return;
      tracks[(currentIndex + 1) % tracks.length].click();
    });

    audioPlayer.addEventListener("error", () => {
      audioStatus.textContent = "This track could not be loaded. Please choose another.";
    });

    playCurrentTrack();

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .12 });
    document.querySelectorAll(".reveal").forEach(element => observer.observe(element));

    const canvas = document.getElementById("particles");
    const context = canvas.getContext("2d");
    let particles = [];
    function resizeCanvas() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * ratio;
      canvas.height = window.innerHeight * ratio;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = Array.from({ length: Math.min(110, Math.floor(window.innerWidth / 9)) }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * 1.4 + .5,
        speed: Math.random() * .65 + .18,
        drift: (Math.random() - .5) * .42,
        tail: Math.random() * 7 + 2,
        alpha: Math.random() * .58 + .28,
        color: Math.random() > .65 ? "255, 72, 35" : "255, 165, 65"
      }));
    }
    function drawParticles() {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      particles.forEach(particle => {
        particle.y -= particle.speed;
        particle.x += particle.drift;
        if (particle.y < -particle.tail) {
          particle.y = window.innerHeight + particle.tail;
          particle.x = Math.random() * window.innerWidth;
        }
        context.beginPath();
        context.moveTo(particle.x, particle.y);
        context.lineTo(particle.x - particle.drift * 5, particle.y + particle.tail);
        context.strokeStyle = `rgba(${particle.color}, ${particle.alpha})`;
        context.lineWidth = particle.radius;
        context.lineCap = "round";
        context.shadowColor = `rgba(${particle.color}, .75)`;
        context.shadowBlur = particle.radius * 5;
        context.stroke();
      });
      context.shadowBlur = 0;
      requestAnimationFrame(drawParticles);
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    drawParticles();
