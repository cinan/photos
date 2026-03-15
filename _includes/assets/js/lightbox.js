(function () {
	var pictures = document.querySelectorAll("picture");
	if (!pictures.length) return;

	var overlay = document.createElement("div");
	overlay.className = "lightbox";
	overlay.innerHTML =
		'<div class="lightbox__image"></div>' +
		'<button class="lightbox__nav lightbox__nav--prev" aria-label="Previous">\u2039</button>' +
		'<button class="lightbox__nav lightbox__nav--next" aria-label="Next">\u203a</button>' +
		'<button class="lightbox__close" aria-label="Close">\u00d7</button>' +
		'<div class="lightbox__preload"></div>';
	document.body.appendChild(overlay);

	var current = 0;
	var total = pictures.length;
	var hideTimer = null;
	var originalUrl = window.location.pathname;

	function showControls() {
		overlay.classList.add("show-controls");
		clearTimeout(hideTimer);
		hideTimer = setTimeout(function () {
			overlay.classList.remove("show-controls");
		}, 2000);
	}

	overlay.addEventListener("mousemove", showControls);
	var imageContainer = overlay.querySelector(".lightbox__image");
	var preloadContainer = overlay.querySelector(".lightbox__preload");
	var prevBtn = overlay.querySelector(".lightbox__nav--prev");
	var nextBtn = overlay.querySelector(".lightbox__nav--next");

	function clonePicture(index) {
		var clone = pictures[index].cloneNode(true);
		var img = clone.querySelector("img");
		if (img) {
			img.removeAttribute("loading");
			img.classList.add("loaded");
		}
		return clone;
	}

	function preloadAdjacent(index) {
		preloadContainer.innerHTML = "";
		for (var i = index + 1; i < Math.min(total, index + 4); i++) {
			preloadContainer.appendChild(clonePicture(i));
		}
	}

	function show(index) {
		current = index;
		imageContainer.innerHTML = "";
		imageContainer.appendChild(clonePicture(index));
		prevBtn.style.display = index > 0 ? "" : "none";
		nextBtn.style.display = index < total - 1 ? "" : "none";
		preloadAdjacent(index);
		var link = pictures[index].closest("a");
		if (link && link.getAttribute("href")) {
			history.replaceState(null, "", link.getAttribute("href"));
		}
	}

	function open(index) {
		show(index);
		overlay.style.display = "flex";
		requestAnimationFrame(function () {
			overlay.classList.add("is-active");
		});
		document.body.style.overflow = "hidden";
	}

	function close() {
		overlay.classList.remove("is-active");
		overlay.classList.remove("show-controls");
		clearTimeout(hideTimer);
		document.body.style.overflow = "";
		history.replaceState(null, "", originalUrl);
		setTimeout(function () {
			overlay.style.display = "none";
			imageContainer.innerHTML = "";
			preloadContainer.innerHTML = "";
		}, 200);
	}

	function prev() {
		if (current > 0) show(current - 1);
	}

	function next() {
		if (current < total - 1) show(current + 1);
	}

	pictures.forEach(function (pic, i) {
		var link = pic.closest("a");
		var target = link || pic;
		target.addEventListener("click", function (e) {
			if (e.metaKey || e.ctrlKey) return;
			e.preventDefault();
			const isLargeScreen = window.matchMedia("(min-width: 840px)").matches;

			if (isLargeScreen) {
				open(i);
			}
		});
	});

	overlay.querySelector(".lightbox__close").addEventListener("click", close);
	overlay.querySelector(".lightbox__nav--prev").addEventListener("click", function (e) {
		e.stopPropagation();
		prev();
	});
	overlay.querySelector(".lightbox__nav--next").addEventListener("click", function (e) {
		e.stopPropagation();
		next();
	});

	overlay.addEventListener("click", function (e) {
		if (e.target === overlay || e.target === imageContainer) close();
	});

	document.addEventListener("keydown", function (e) {
		if (overlay.style.display !== "flex") return;
		if (e.key === "Escape") close();
		else if (e.key === "ArrowLeft") prev();
		else if (e.key === "ArrowRight") next();
	});

	overlay.style.display = "none";
})();
