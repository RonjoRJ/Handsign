// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Parallax Stars Background (subtle movement)
gsap.to("#starfield", {
    backgroundPosition: "50% 100vh",
    ease: "none",
    scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 1
    }
});

// --- CLIMBER RIG: Inverse Kinematics via GSAP ---
const maxScrollY = 1000 - 150; // SVG viewport Y bounds
const totalCycles = 25; // Number of climbing "steps" during full scroll

// Global vertical drop
gsap.to("#climber", {
    y: maxScrollY,
    ease: "none",
    scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: true
    }
});

// The mechanical climbing cycle timeline bound directly to the scrub progress
// When user scrolls down, timeline plays forward. When scrolling up, it plays in reverse natively!
const climbingKinematics = gsap.timeline({
    scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: true
    }
});

// Build the timeline loops mathematically
for (let i = 0; i < totalCycles; i++) {
    let t = i * 2; // Time index for the cycle start
    
    // Step 1: Left arm forward, Right arm back, Left leg back, Right leg forward
    climbingKinematics.to("#arm-left", { rotation: -40, transformOrigin: "0px -10px", duration: 1, ease: "power1.inOut" }, t)
                      .to("#arm-right", { rotation: 40, transformOrigin: "0px -10px", duration: 1, ease: "power1.inOut" }, t)
                      .to("#leg-left", { rotation: 40, transformOrigin: "0px 30px", duration: 1, ease: "power1.inOut" }, t)
                      .to("#leg-right", { rotation: -40, transformOrigin: "0px 30px", duration: 1, ease: "power1.inOut" }, t);
                      
    // Step 2: Reverse the limbs
    climbingKinematics.to("#arm-left", { rotation: 40, transformOrigin: "0px -10px", duration: 1, ease: "power1.inOut" }, t + 1)
                      .to("#arm-right", { rotation: -40, transformOrigin: "0px -10px", duration: 1, ease: "power1.inOut" }, t + 1)
                      .to("#leg-left", { rotation: -40, transformOrigin: "0px 30px", duration: 1, ease: "power1.inOut" }, t + 1)
                      .to("#leg-right", { rotation: 40, transformOrigin: "0px 30px", duration: 1, ease: "power1.inOut" }, t + 1);
}


// --- Panel Reveal Logic ---
const panels = gsap.utils.toArray('.panel .content-box');
panels.forEach(panel => {
    gsap.from(panel, {
        opacity: 0,
        y: 80,
        scale: 0.95,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
            trigger: panel,
            start: "top 85%", 
            toggleActions: "play none none reverse"
        }
    });
});

// Glitch effect on title hover
const glitchText = document.querySelector('.glitch');
if(glitchText) {
    glitchText.addEventListener('mouseover', () => {
        gsap.to(glitchText, {
            x: () => Math.random() * 5 - 2.5,
            y: () => Math.random() * 5 - 2.5,
            duration: 0.05,
            yoyo: true,
            repeat: 5,
            onComplete: () => { gsap.set(glitchText, {x: 0, y: 0}); }
        });
    });
}


// --- CAMERA / IDENTITY WEBRTC LOGIC ---
const video = document.getElementById('live-video');
const canvas = document.getElementById('photo-canvas');
const photoPreview = document.getElementById('photo-preview');
const polaroidImg = document.getElementById('polaroid-img');
const btnDownload = document.getElementById('btn-download');

// Sections
const uiInit = document.getElementById('cam-init-ui');
const uiLive = document.getElementById('cam-live-ui');
const uiConfirm = document.getElementById('cam-confirm-ui');
const uiPolaroid = document.getElementById('cam-polaroid-ui');

let localMediaStream = null;

// Hides all UI states and shows the target one
function switchCameraUiState(targetUi) {
    [uiInit, uiLive, uiConfirm, uiPolaroid].forEach(ui => ui.classList.add('hidden'));
    targetUi.classList.remove('hidden');
}

// 1. Init Camera
document.getElementById('btn-init-cam').addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: { ideal: 600 }, height: { ideal: 600 }, facingMode: "user" } 
        });
        localMediaStream = stream;
        video.srcObject = stream;
        switchCameraUiState(uiLive);
    } catch (error) {
        console.error("Camera access denied or error:", error);
        alert("Camera access is required to generate your biometric ID. Please check permissions.");
    }
});

// 2. Capture Snapshot
document.getElementById('btn-capture').addEventListener('click', () => {
    // 1:1 Aspect ratio photo (Canvas sizing)
    const context = canvas.getContext('2d');
    canvas.width = 500;
    canvas.height = 500;
    
    // We want a square crop from the video stream
    const size = Math.min(video.videoWidth, video.videoHeight);
    const xOffset = (video.videoWidth - size) / 2;
    const yOffset = (video.videoHeight - size) / 2;
    
    // Draw and mirror
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, xOffset, yOffset, size, size, 0, 0, canvas.width, canvas.height);
    
    // Export data URL and show confirmation window
    const dataUrl = canvas.toDataURL('image/png');
    photoPreview.src = dataUrl;
    switchCameraUiState(uiConfirm);
});

// 3. Retake handling (Back to Live UI)
document.getElementById('btn-retake').addEventListener('click', () => {
    switchCameraUiState(uiLive);
});

// 4. Proceed logic (Create Frame & Stop Camera)
document.getElementById('btn-proceed').addEventListener('click', () => {
    // Stop the video stream tracks
    if (localMediaStream) {
        localMediaStream.getTracks().forEach(track => track.stop());
    }
    
    const dataUrl = canvas.toDataURL('image/png');
    polaroidImg.src = dataUrl;
    btnDownload.href = dataUrl;
    
    switchCameraUiState(uiPolaroid);
});
