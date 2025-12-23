// ===== CUSTOM CURSOR =====
const cursor = document.querySelector('.cursor');
const cursorFollower = document.querySelector('.cursor-follower');

let mouseX = 0, mouseY = 0;
let followerX = 0, followerY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Instant cursor position
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
});

// Smooth follower animation
function animateFollower() {
    followerX += (mouseX - followerX) * 0.15;
    followerY += (mouseY - followerY) * 0.15;

    cursorFollower.style.left = followerX + 'px';
    cursorFollower.style.top = followerY + 'px';

    requestAnimationFrame(animateFollower);
}
animateFollower();

// Cursor hover effects
const interactiveElements = document.querySelectorAll('a, button, .btn, .project-card, .skill-category, .experience-card, .magnetic, .magnetic-card');

interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
        cursorFollower.classList.add('hover');
    });
    el.addEventListener('mouseleave', () => {
        cursorFollower.classList.remove('hover');
    });
});

// Click effect
document.addEventListener('mousedown', () => {
    cursorFollower.classList.add('click');
});
document.addEventListener('mouseup', () => {
    cursorFollower.classList.remove('click');
});

// ===== MAGNETIC BUTTONS =====
const magneticElements = document.querySelectorAll('.magnetic');

magneticElements.forEach(el => {
    el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    });

    el.addEventListener('mouseleave', () => {
        el.style.transform = 'translate(0, 0)';
    });
});

// Magnetic cards (lighter effect)
const magneticCards = document.querySelectorAll('.magnetic-card');

magneticCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        card.style.transform = `perspective(1000px) rotateY(${x * 0.02}deg) rotateX(${-y * 0.02}deg) translateY(-5px)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateY(0) rotateX(0) translateY(0)';
    });
});

// ===== PARTICLES.JS =====
if (typeof particlesJS !== 'undefined') {
    particlesJS('particles-js', {
        particles: {
            number: {
                value: 80,
                density: {
                    enable: true,
                    value_area: 800
                }
            },
            color: {
                value: '#6366f1'
            },
            shape: {
                type: 'circle'
            },
            opacity: {
                value: 0.3,
                random: true,
                anim: {
                    enable: true,
                    speed: 1,
                    opacity_min: 0.1,
                    sync: false
                }
            },
            size: {
                value: 3,
                random: true,
                anim: {
                    enable: true,
                    speed: 2,
                    size_min: 0.5,
                    sync: false
                }
            },
            line_linked: {
                enable: true,
                distance: 150,
                color: '#6366f1',
                opacity: 0.2,
                width: 1
            },
            move: {
                enable: true,
                speed: 1,
                direction: 'none',
                random: true,
                straight: false,
                out_mode: 'out',
                bounce: false,
                attract: {
                    enable: true,
                    rotateX: 600,
                    rotateY: 1200
                }
            }
        },
        interactivity: {
            detect_on: 'canvas',
            events: {
                onhover: {
                    enable: true,
                    mode: 'grab'
                },
                onclick: {
                    enable: true,
                    mode: 'push'
                },
                resize: true
            },
            modes: {
                grab: {
                    distance: 140,
                    line_linked: {
                        opacity: 0.5
                    }
                },
                push: {
                    particles_nb: 4
                }
            }
        },
        retina_detect: true
    });
}

// ===== GSAP ANIMATIONS =====
gsap.registerPlugin(ScrollTrigger);

// Hero sliding text animation on load
window.addEventListener('load', () => {
    const heroTimeline = gsap.timeline({ delay: 0.3 });

    // Animate profile first, then slide in text
    heroTimeline
        .to('.hero__profile', {
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: 'back.out(1.7)'
        })
        .to('.hero__line-inner', {
            y: 0,
            opacity: 1,
            duration: 1,
            stagger: 0.15,
            ease: 'power4.out'
        }, '-=0.3')
        .to('.hero__subtitle', {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out'
        }, '-=0.5')
        .to('.hero__buttons', {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out'
        }, '-=0.5')
        .to('.hero__social', {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out'
        }, '-=0.5')
        .to('.hero__code', {
            opacity: 0.15,
            duration: 1.5,
            ease: 'power2.out'
        }, '-=1');

    // Initial state for floating code (start invisible)
    gsap.set('.hero__code', { opacity: 0 });
});

// Scroll-triggered animations for sections
document.querySelectorAll('.section-title').forEach(title => {
    gsap.to(title, {
        scrollTrigger: {
            trigger: title,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
        },
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out'
    });
});

// Reveal text animations
document.querySelectorAll('.reveal-text').forEach(text => {
    if (!text.closest('.hero__title')) {
        gsap.to(text, {
            scrollTrigger: {
                trigger: text,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            },
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out'
        });
    }
});

// Reveal up animations (cards, grid items)
document.querySelectorAll('.reveal-up').forEach((el, index) => {
    gsap.to(el, {
        scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            toggleActions: 'play none none reverse'
        },
        opacity: 1,
        y: 0,
        duration: 0.6,
        delay: index * 0.1 % 0.5, // Stagger effect within viewport
        ease: 'power3.out'
    });
});

// Parallax effect for floating code
gsap.to('.hero__code--left', {
    scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1
    },
    y: -50,
    ease: 'none'
});

gsap.to('.hero__code--right', {
    scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1
    },
    y: 50,
    ease: 'none'
});

// Nav background on scroll
ScrollTrigger.create({
    trigger: '.hero',
    start: 'top top',
    end: 'bottom top',
    onUpdate: (self) => {
        const nav = document.querySelector('nav');
        if (self.progress > 0.1) {
            nav.style.background = 'rgba(10, 10, 10, 0.95)';
        } else {
            nav.style.background = 'rgba(10, 10, 10, 0.9)';
        }
    }
});

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            gsap.to(window, {
                duration: 1,
                scrollTo: {
                    y: target,
                    offsetY: 80
                },
                ease: 'power3.inOut'
            });
        }
    });
});

// ===== EXPERIENCE CAROUSEL (Scroll-triggered, Stackbyte-style) =====
const expCarousel = {
    track: document.querySelector('.exp-carousel__track'),
    slides: document.querySelectorAll('.exp-slide'),
    dots: document.querySelectorAll('.exp-carousel__dot'),
    section: document.querySelector('.experience-section'),

    init() {
        if (!this.track || this.slides.length === 0 || !this.section) return;

        const slideCount = this.slides.length;

        // Dot click navigation
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToSlide(index));
        });

        // GSAP ScrollTrigger - pin section and animate through slides
        gsap.to(this.track, {
            x: () => -(this.track.scrollWidth - window.innerWidth + (window.innerWidth - this.track.children[0].offsetWidth)),
            ease: 'none',
            scrollTrigger: {
                trigger: this.section,
                start: 'top top',
                end: () => `+=${this.track.scrollWidth}`,
                pin: true,
                scrub: 1,
                snap: {
                    snapTo: 1 / (slideCount - 1),
                    duration: 0.3,
                    ease: 'power2.inOut'
                },
                onUpdate: (self) => {
                    // Update dots based on scroll progress
                    const progress = self.progress;
                    const currentIndex = Math.round(progress * (slideCount - 1));
                    this.updateDots(currentIndex);
                }
            }
        });
    },

    goToSlide(index) {
        const slideCount = this.slides.length;
        const progress = index / (slideCount - 1);

        // Get the ScrollTrigger instance and scroll to position
        const st = ScrollTrigger.getAll().find(t => t.trigger === this.section);
        if (st) {
            const scrollPos = st.start + (st.end - st.start) * progress;
            gsap.to(window, {
                scrollTo: scrollPos,
                duration: 0.6,
                ease: 'power2.inOut'
            });
        }
    },

    updateDots(index) {
        this.dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }
};

// Initialize carousel after GSAP is ready
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    expCarousel.init();
}

// ===== CARD GLOW FOLLOW EFFECT =====
const glowCards = document.querySelectorAll('.project-card, .skill-category');

glowCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        card.style.setProperty('--mouse-x', `${x}%`);
        card.style.setProperty('--mouse-y', `${y}%`);
    });

    card.addEventListener('mouseleave', () => {
        card.style.setProperty('--mouse-x', '50%');
        card.style.setProperty('--mouse-y', '50%');
    });
});

// ===== STAGGERED CARD ENTRANCE (Stackbyte-style) =====
const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -80px 0px'
};

// Cards (projects, skills) with stagger animation
const cardObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            const parent = entry.target.parentElement;
            const siblings = Array.from(parent.querySelectorAll('.' + entry.target.classList[0]));
            const index = siblings.indexOf(entry.target);

            setTimeout(() => {
                entry.target.style.transitionDuration = '0.5s';
                entry.target.style.transitionTimingFunction = 'cubic-bezier(0.4, 0, 0.2, 1)';
                entry.target.classList.add('visible');
            }, index * 100);

            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe cards
document.querySelectorAll('.project-card, .skill-category').forEach(card => {
    cardObserver.observe(card);
});
