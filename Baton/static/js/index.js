window.HELP_IMPROVE_VIDEOJS = false;

// More Works Dropdown Functionality
function toggleMoreWorks() {
    const dropdown = document.getElementById('moreWorksDropdown');
    const button = document.querySelector('.more-works-btn');
    
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        button.classList.remove('active');
    } else {
        dropdown.classList.add('show');
        button.classList.add('active');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const container = document.querySelector('.more-works-container');
    const dropdown = document.getElementById('moreWorksDropdown');
    const button = document.querySelector('.more-works-btn');
    
    if (container && !container.contains(event.target)) {
        dropdown.classList.remove('show');
        button.classList.remove('active');
    }
});

// Close dropdown on escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const dropdown = document.getElementById('moreWorksDropdown');
        const button = document.querySelector('.more-works-btn');
        dropdown.classList.remove('show');
        button.classList.remove('active');
    }
});

// Copy BibTeX to clipboard
function copyBibTeX() {
    const bibtexElement = document.getElementById('bibtex-code');
    const button = document.querySelector('.copy-bibtex-btn');
    const copyText = button.querySelector('.copy-text');
    
    if (bibtexElement) {
        navigator.clipboard.writeText(bibtexElement.textContent).then(function() {
            // Success feedback
            button.classList.add('copied');
            copyText.textContent = 'Cop';
            
            setTimeout(function() {
                button.classList.remove('copied');
                copyText.textContent = 'Copy';
            }, 2000);
        }).catch(function(err) {
            console.error('Failed to copy: ', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = bibtexElement.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            button.classList.add('copied');
            copyText.textContent = 'Cop';
            setTimeout(function() {
                button.classList.remove('copied');
                copyText.textContent = 'Copy';
            }, 2000);
        });
    }
}

// Scroll to top functionality
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show/hide scroll to top button
window.addEventListener('scroll', function() {
    const scrollButton = document.querySelector('.scroll-to-top');
    if (window.pageYOffset > 300) {
        scrollButton.classList.add('visible');
    } else {
        scrollButton.classList.remove('visible');
    }
});

// Video carousel autoplay when in view (skip Baton 九宫格：由 bindBatonCarouselVideoAdvance 管理)
function setupVideoCarouselAutoplay() {
    const carouselVideos = document.querySelectorAll('.results-carousel video');

    if (carouselVideos.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                video.play().catch(e => {
                    console.log('Autoplay prevented:', e);
                });
            } else {
                video.pause();
            }
        });
    }, {
        threshold: 0.5
    });

    carouselVideos.forEach(video => {
        if (video.closest('.baton-carousel-cell')) return;
        observer.observe(video);
    });
}

// Keep caption box fixed height, shrink font by content length.
function autoFitBatonCaptions() {
    const captions = document.querySelectorAll('.baton-slide-caption:not(.baton-large-caption)');
    captions.forEach(function (caption) {
        const text = (caption.innerText || caption.textContent || '').trim();
        const lineBreakBonus = (text.match(/\n/g) || []).length * 20;
        const score = text.length + lineBreakBonus;

        let size = 0.62;
        // if (score > 220) size = 0.58;
        // if (score > 360) size = 0.52;
        // if (score > 520) size = 0.46;
        // if (score > 700) size = 0.40;
        // if (score > 900) size = 0.36;
        // if (score > 1000) size = 0.32;

        caption.style.setProperty('--caption-font-size', size + 'rem');
    });
}

/**
 * Baton 九宫格：不按时间切页；当前条视频播完触发 ended 再 next()。
 * 依赖 HTML 中视频无 loop，否则会永不 ended。
 */
function bindBatonCarouselVideoAdvance(inst) {
    var root = inst.element;
    var cell = root.closest('.baton-carousel-cell');
    if (!cell) return;

    inst._batonProgrammatic = false;
    inst._batonUserPausedCurrent = false;
    inst._batonLeaveSkipTimer = null;
    inst._batonHoverLockCurrent = false;
    inst._batonCurrentSlideHovered = false;
    inst._batonHoverResumeTimer = null;

    if (inst._autoplay && typeof inst._autoplay.stop === 'function') {
        inst._autoplay.stop();
    }

    function currentSlideIndex() {
        return Math.abs(inst.state.index % inst.state.length);
    }

    function isCurrentSlideVideo(video) {
        var item = video.closest('.slider-item');
        if (!item) return false;
        var slideIdx = parseInt(item.getAttribute('data-slider-index'), 10);
        return !isNaN(slideIdx) && slideIdx === currentSlideIndex();
    }

    root.querySelectorAll('video').forEach(function (video) {
        video.addEventListener('ended', function () {
            var item = video.closest('.slider-item');
            if (!item) return;
            var driver = item.querySelector('video');
            if (driver && video !== driver) return;
            var slideIdx = parseInt(item.getAttribute('data-slider-index'), 10);
            if (isNaN(slideIdx)) return;
            var curIdx = currentSlideIndex();
            if (slideIdx !== curIdx) return;
            if (inst._batonHoverLockCurrent) return;
            inst.next();
        });

        video.addEventListener('pause', function () {
            if (inst._batonProgrammatic) return;
            if (!isCurrentSlideVideo(video)) return;
            if (video.ended) return;
            inst._batonUserPausedCurrent = true;
        });

        video.addEventListener('play', function () {
            if (inst._batonProgrammatic) return;
            if (!isCurrentSlideVideo(video)) return;
            inst._batonUserPausedCurrent = false;
            clearTimeout(inst._batonLeaveSkipTimer);
            inst._batonLeaveSkipTimer = null;
        });
    });

    function playCurrentSlide() {
        inst._batonUserPausedCurrent = false;
        inst._batonHoverLockCurrent = false;
        inst._batonCurrentSlideHovered = false;
        clearTimeout(inst._batonLeaveSkipTimer);
        inst._batonLeaveSkipTimer = null;
        clearTimeout(inst._batonHoverResumeTimer);
        inst._batonHoverResumeTimer = null;

        inst._batonProgrammatic = true;
        root.querySelectorAll('.slider-item video').forEach(function (v) {
            v.pause();
            v.muted = true;
            v.loop = false;
        });
        inst._batonProgrammatic = false;

        if (typeof inst._setClasses === 'function') {
            inst._setClasses();
        }
        var curVideos = root.querySelectorAll('.slider-item.is-current video');
        if (curVideos.length === 0) return;

        curVideos.forEach(function (v) {
            v.currentTime = 0;
        });
        inst._batonProgrammatic = true;
        var plays = Array.prototype.map.call(curVideos, function (cur) {
            return cur.play();
        });
        var settled = Promise.allSettled(plays.filter(function (p) {
            return p !== undefined && typeof p.then === 'function';
        }));
        if (settled && typeof settled.finally === 'function') {
            settled.finally(function () {
                setTimeout(function () {
                    inst._batonProgrammatic = false;
                }, 0);
            });
        } else {
            setTimeout(function () {
                inst._batonProgrammatic = false;
            }, 0);
        }
    }

    // show 时 index 尚未提交；transitioner.end 在 container 的 transform transition 完成后才把 state.index 对齐到 state.next。
    // 因此：优先在 transitionend 后播；若无 transition（极少数路径）用 show 后的定时回退。
    var container = root.querySelector('.slider-container');
    function scheduleFallbackPlayAfterShow() {
        clearTimeout(inst._batonAfterSlideTimer);
        var dur = inst.options && inst.options.duration != null ? inst.options.duration : 300;
        inst._batonAfterSlideTimer = setTimeout(function () {
            inst._batonAfterSlideTimer = null;
            playCurrentSlide();
        }, dur + 80);
    }

    inst.on('show', function () {
        scheduleFallbackPlayAfterShow();
    });

    if (container) {
        container.addEventListener('transitionend', function (e) {
            if (e.target !== container) return;
            if (e.propertyName !== 'transform' && e.propertyName !== '-webkit-transform') return;
            clearTimeout(inst._batonAfterSlideTimer);
            inst._batonAfterSlideTimer = null;
            playCurrentSlide();
        });
    }

    cell.addEventListener('mouseenter', function () {
        clearTimeout(inst._batonLeaveSkipTimer);
        inst._batonLeaveSkipTimer = null;
    });

    cell.addEventListener('mouseleave', function () {
        if (typeof inst._setClasses === 'function') {
            inst._setClasses();
        }
        var v = root.querySelector('.slider-item.is-current video');
        if (!v || !v.paused) return;
        if (!inst._batonUserPausedCurrent) return;
        clearTimeout(inst._batonLeaveSkipTimer);
        inst._batonLeaveSkipTimer = setTimeout(function () {
            inst._batonLeaveSkipTimer = null;
            inst._batonUserPausedCurrent = false;
            inst.next();
        }, 3000);
    });

    playCurrentSlide();

    if (root.querySelector('.baton-comparison-unit') && !inst._batonComparisonHoverBound) {
        inst._batonComparisonHoverBound = true;
        bindBatonComparisonHover(root, inst, isCurrentSlideVideo);
    }
}

/** Prompt + 5-up grid: hover highlights a tile and unmutes that video; siblings stay muted. */
function bindBatonComparisonHover(root, inst, isCurrentSlideVideo) {
    function setCurrentSlideLoop(enabled) {
        root.querySelectorAll('.slider-item.is-current video').forEach(function (v) {
            v.loop = !!enabled;
            if (enabled && v.paused) {
                v.play().catch(function () {});
            }
        });
    }

    function scheduleHoverResume(video) {
        if (!video) return;
        if (!isCurrentSlideVideo(video)) return;
        if (!inst._batonCurrentSlideHovered) return;

        clearTimeout(inst._batonHoverResumeTimer);
        inst._batonHoverResumeTimer = setTimeout(function () {
            inst._batonHoverResumeTimer = null;
            if (inst._batonHoverLockCurrent) return;
            if (!isCurrentSlideVideo(video)) return;
            inst._batonCurrentSlideHovered = false;
            setCurrentSlideLoop(false);
            inst.next();
        }, 3000);
    }

    root.querySelectorAll('.baton-comparison-cell').forEach(function (cell) {
        cell.addEventListener('mouseenter', function () {
            var unit = cell.closest('.baton-comparison-unit');
            if (!unit) return;
            var hv = cell.querySelector('video');
            if (!hv) return;

            if (isCurrentSlideVideo(hv)) {
                inst._batonHoverLockCurrent = true;
                inst._batonCurrentSlideHovered = true;
                clearTimeout(inst._batonHoverResumeTimer);
                inst._batonHoverResumeTimer = null;
                setCurrentSlideLoop(true);
            }

            unit.querySelectorAll('.baton-comparison-cell').forEach(function (c) {
                c.classList.remove('is-focus');
            });
            cell.classList.add('is-focus');
            unit.querySelectorAll('video').forEach(function (v) {
                v.muted = true;
            });
            if (hv) {
                hv.muted = false;
            }
        });
        cell.addEventListener('mouseleave', function (e) {
            if (cell.contains(e.relatedTarget)) return;
            var unit = cell.closest('.baton-comparison-unit');
            if (!unit) return;
            cell.classList.remove('is-focus');
            unit.querySelectorAll('video').forEach(function (v) {
                v.muted = true;
            });

            var hv = cell.querySelector('video');
            if (!hv) return;
            if (!isCurrentSlideVideo(hv)) return;
            inst._batonHoverLockCurrent = false;
            setCurrentSlideLoop(false);
            scheduleHoverResume(hv);
        });
    });

    root.querySelectorAll('.baton-comparison-cell video').forEach(function (video) {
        video.addEventListener('focus', function () {
            var cell = video.closest('.baton-comparison-cell');
            var unit = cell && cell.closest('.baton-comparison-unit');
            if (!cell || !unit) return;
            unit.querySelectorAll('.baton-comparison-cell').forEach(function (c) {
                c.classList.remove('is-focus');
            });
            cell.classList.add('is-focus');
            unit.querySelectorAll('video').forEach(function (v) {
                v.muted = true;
            });
            video.muted = false;
        });
    });
}

/** When a carousel cell (九宫格 or full-width Baton carousels) leaves the viewport, reset all videos inside to muted. */
function bindBatonCarouselCellMuteOnLeaveViewport() {
    var cells = document.querySelectorAll('.baton-carousel-cell');
    if (cells.length === 0) return;

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) return;
            entry.target.querySelectorAll('video').forEach(function (v) {
                v.muted = true;
            });
        });
    }, {
        threshold: 0
    });

    cells.forEach(function (cell) {
        observer.observe(cell);
    });
}

/** Ablation-style static grid: autoplay when in view; pause and mute when scrolled away. */
function setupBatonAblationAutoplay() {
    var videos = document.querySelectorAll('.baton-ablation-section video');
    if (videos.length === 0) return;

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            var video = entry.target;
            if (entry.isIntersecting) {
                if (video.ended) {
                    video.currentTime = 0;
                }
                video.play().catch(function () {});
            } else {
                video.pause();
                video.muted = true;
            }
        });
    }, {
        threshold: 0.5
    });

    videos.forEach(function (video) {
        observer.observe(video);
    });
}

/** Hover preview audio: only hovered tile is unmuted, leave to mute again. */
function bindHoverAudioPreview(selector, scopeSelector) {
    document.querySelectorAll(selector).forEach(function (cell) {
        cell.addEventListener('mouseenter', function () {
            var scope = scopeSelector ? cell.closest(scopeSelector) : null;
            if (!scope) scope = cell.parentElement || document;
            scope.querySelectorAll('video').forEach(function (v) {
                v.muted = true;
            });
            var video = cell.querySelector('video');
            if (video) video.muted = false;
        });

        cell.addEventListener('mouseleave', function () {
            var scope = scopeSelector ? cell.closest(scopeSelector) : null;
            if (!scope) scope = cell.parentElement || document;
            scope.querySelectorAll('video').forEach(function (v) {
                v.muted = true;
            });
        });
    });
}

$(document).ready(function() {
    var commonOpts = {
        slidesToScroll: 1,
        slidesToShow: 1,
        loop: true,
        infinite: true
    };

    document.querySelectorAll('.carousel').forEach(function (el) {
        var isBaton = !!el.closest('.baton-carousel-cell');
        var opts = isBaton
            ? Object.assign({}, commonOpts, {
                autoplay: false,
                pauseOnHover: false,
                onReady: function (inst) {
                    bindBatonCarouselVideoAdvance(inst);
                }
            })
            : Object.assign({}, commonOpts, {
                autoplay: true,
                autoplaySpeed: 5000,
                pauseOnHover: true
            });
        bulmaCarousel.attach(el, opts);
    });

    bulmaSlider.attach();

    setupVideoCarouselAutoplay();
    bindBatonCarouselCellMuteOnLeaveViewport();
    setupBatonAblationAutoplay();
    bindHoverAudioPreview('.baton-ablation-video', '.baton-ablation-cell');
    autoFitBatonCaptions();

    window.addEventListener('resize', function () {
        autoFitBatonCaptions();
    });
})
