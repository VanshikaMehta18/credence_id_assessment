const API_BASE = 'http://localhost:3000';

let sessionId = null;
let currentStep = 1;
let capturedImages = {
    idFront: null,
    idBack: null,
    selfie: null
};
let faceMatchResult = {
    score: 0,
    result: 'PENDING'
};

let streams = {
    front: null,
    back: null,
    selfie: null
};

let modelsLoaded = false;

async function loadFaceApiModels() {
    if (modelsLoaded) return;

    try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        modelsLoaded = true;
        console.log('Face detection models loaded');
    } catch (error) {
        console.error('Failed to load face detection models:', error);
    }
}

async function compareFaces(idFrontBase64, selfieBase64) {
    try {
        if (!modelsLoaded) {
            await loadFaceApiModels();
        }

        const idImg = await faceapi.fetchImage(idFrontBase64);
        const selfieImg = await faceapi.fetchImage(selfieBase64);

        const idDetection = await faceapi
            .detectSingleFace(idImg)
            .withFaceLandmarks()
            .withFaceDescriptor();

        const selfieDetection = await faceapi
            .detectSingleFace(selfieImg)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!idDetection || !selfieDetection) {
            throw new Error('Face not detected in one or both images');
        }

        const distance = faceapi.euclideanDistance(
            idDetection.descriptor,
            selfieDetection.descriptor
        );

        const score = Math.max(0, 1 - distance);
        const result = score >= 0.6 ? 'PASS' : 'FAIL';

        return { score: parseFloat(score.toFixed(2)), result };
    } catch (error) {
        console.error('Face comparison error:', error);
        throw error;
    }
}


async function initSession() {
    try {
        const response = await fetch(`${API_BASE}/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        sessionId = data.sessionId;
        console.log('Session created:', sessionId);
    } catch (error) {
        showError('Failed to initialize session. Please refresh the page.');
    }
}

function showError(message) {
    const modal = document.getElementById('errorModal');
    const messageEl = document.getElementById('errorMessage');
    messageEl.textContent = message;
    modal.classList.add('active');
}

function hideError() {
    document.getElementById('errorModal').classList.remove('active');
}

function showLoading(message = 'Processing...') {
    const modal = document.getElementById('loadingModal');
    const messageEl = document.getElementById('loadingMessage');
    messageEl.textContent = message;
    modal.classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingModal').classList.remove('active');
}

function updateProgressBar(step) {
    document.querySelectorAll('.progress-step').forEach((el, index) => {
        if (index < step) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });
}

function showStep(step) {
    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
    document.getElementById(`step${step}`).classList.add('active');
    currentStep = step;
    updateProgressBar(step);
}

async function startCamera(videoId, streamKey) {
    try {
        const video = document.getElementById(videoId);
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: streamKey === 'selfie' ? 'user' : 'environment' },
            audio: false
        });
        video.srcObject = stream;
        streams[streamKey] = stream;
    } catch (error) {
        showError('Camera access denied. Please enable camera permissions.');
    }
}

function stopCamera(streamKey) {
    if (streams[streamKey]) {
        streams[streamKey].getTracks().forEach(track => track.stop());
        streams[streamKey] = null;
    }
}

function captureImage(videoId, canvasId) {
    const video = document.getElementById(videoId);
    const canvas = document.getElementById(canvasId);
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.9);
}

function setupIdCapture() {
    const captureFrontBtn = document.getElementById('captureFront');
    const retakeFrontBtn = document.getElementById('retakeFront');
    const captureBackBtn = document.getElementById('captureBack');
    const retakeBackBtn = document.getElementById('retakeBack');
    const nextBtn = document.getElementById('nextToSelfie');

    captureFrontBtn.addEventListener('click', () => {
        capturedImages.idFront = captureImage('frontVideo', 'frontCanvas');
        document.getElementById('frontImg').src = capturedImages.idFront;
        document.getElementById('frontVideo').style.display = 'none';
        document.getElementById('frontPreview').style.display = 'block';
        captureFrontBtn.style.display = 'none';
        retakeFrontBtn.style.display = 'inline-block';
        stopCamera('front');
        checkIdComplete();
    });

    retakeFrontBtn.addEventListener('click', () => {
        capturedImages.idFront = null;
        document.getElementById('frontVideo').style.display = 'block';
        document.getElementById('frontPreview').style.display = 'none';
        captureFrontBtn.style.display = 'inline-block';
        retakeFrontBtn.style.display = 'none';
        startCamera('frontVideo', 'front');
        checkIdComplete();
    });

    captureBackBtn.addEventListener('click', () => {
        capturedImages.idBack = captureImage('backVideo', 'backCanvas');
        document.getElementById('backImg').src = capturedImages.idBack;
        document.getElementById('backVideo').style.display = 'none';
        document.getElementById('backPreview').style.display = 'block';
        captureBackBtn.style.display = 'none';
        retakeBackBtn.style.display = 'inline-block';
        stopCamera('back');
        checkIdComplete();
    });

    retakeBackBtn.addEventListener('click', () => {
        capturedImages.idBack = null;
        document.getElementById('backVideo').style.display = 'block';
        document.getElementById('backPreview').style.display = 'none';
        captureBackBtn.style.display = 'inline-block';
        retakeBackBtn.style.display = 'none';
        startCamera('backVideo', 'back');
        checkIdComplete();
    });

    nextBtn.addEventListener('click', async () => {
        showLoading('Uploading ID images...');
        try {
            const response = await fetch(`${API_BASE}/session/${sessionId}/id`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idFront: capturedImages.idFront,
                    idBack: capturedImages.idBack
                })
            });

            if (!response.ok) {
                throw new Error('Failed to upload ID images');
            }

            hideLoading();
            stopCamera('front');
            stopCamera('back');
            showStep(2);
            startCamera('selfieVideo', 'selfie');
        } catch (error) {
            hideLoading();
            showError('Failed to upload ID images. Please try again.');
        }
    });

    startCamera('frontVideo', 'front');
    startCamera('backVideo', 'back');
}

function checkIdComplete() {
    const nextBtn = document.getElementById('nextToSelfie');
    nextBtn.disabled = !(capturedImages.idFront && capturedImages.idBack);
}

function setupSelfieCapture() {
    const captureSelfieBtn = document.getElementById('captureSelfie');
    const retakeSelfieBtn = document.getElementById('retakeSelfie');
    const nextBtn = document.getElementById('nextToReview');
    const backBtn = document.getElementById('backToId');

    captureSelfieBtn.addEventListener('click', async () => {
        capturedImages.selfie = captureImage('selfieVideo', 'selfieCanvas');
        document.getElementById('selfieImg').src = capturedImages.selfie;
        document.getElementById('selfieVideo').style.display = 'none';
        document.getElementById('selfiePreview').style.display = 'block';
        captureSelfieBtn.style.display = 'none';
        retakeSelfieBtn.style.display = 'inline-block';
        stopCamera('selfie');

        showLoading('Performing face match...');

        try {
            const matchResult = await compareFaces(capturedImages.idFront, capturedImages.selfie);

            const response = await fetch(`${API_BASE}/session/${sessionId}/selfie`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    selfie: capturedImages.selfie,
                    score: matchResult.score,
                    result: matchResult.result
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Face match failed');
            }

            faceMatchResult = data;
            displayMatchResult(data);
            nextBtn.disabled = false;
            hideLoading();
        } catch (error) {
            hideLoading();
            showError(error.message || 'Face matching failed. Please try again.');
            retakeSelfieBtn.click();
        }
    });

    retakeSelfieBtn.addEventListener('click', () => {
        capturedImages.selfie = null;
        document.getElementById('selfieVideo').style.display = 'block';
        document.getElementById('selfiePreview').style.display = 'none';
        captureSelfieBtn.style.display = 'inline-block';
        retakeSelfieBtn.style.display = 'none';
        document.getElementById('matchResult').style.display = 'none';
        nextBtn.disabled = true;
        startCamera('selfieVideo', 'selfie');
    });

    nextBtn.addEventListener('click', () => {
        stopCamera('selfie');
        showReview();
        showStep(3);
    });

    backBtn.addEventListener('click', () => {
        stopCamera('selfie');
        showStep(1);
        startCamera('frontVideo', 'front');
        startCamera('backVideo', 'back');
    });
}

function displayMatchResult(data) {
    const resultEl = document.getElementById('matchResult');
    const scoreEl = document.getElementById('scoreValue');
    const badgeEl = document.getElementById('resultBadge');

    scoreEl.textContent = data.score.toFixed(2);
    badgeEl.textContent = data.result;
    badgeEl.className = 'result-badge ' + data.result.toLowerCase();

    resultEl.style.display = 'block';
}

function showReview() {
    document.getElementById('reviewFront').src = capturedImages.idFront;
    document.getElementById('reviewBack').src = capturedImages.idBack;
    document.getElementById('reviewSelfie').src = capturedImages.selfie;
    document.getElementById('reviewScore').textContent = faceMatchResult.score.toFixed(2);
    document.getElementById('reviewResult').textContent = faceMatchResult.result;

    const resultEl = document.getElementById('reviewResult');
    resultEl.style.color = faceMatchResult.result === 'PASS' ? 'var(--success-color)' : 'var(--danger-color)';
}

function setupReview() {
    const backBtn = document.getElementById('backToSelfie');
    const submitBtn = document.getElementById('submitVerification');

    backBtn.addEventListener('click', () => {
        showStep(2);
        startCamera('selfieVideo', 'selfie');
    });

    submitBtn.addEventListener('click', async () => {
        showLoading('Submitting verification...');

        try {
            const response = await fetch(`${API_BASE}/session/${sessionId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Submission failed');
            }

            hideLoading();
            showCompletion(data);
        } catch (error) {
            hideLoading();
            showError('Failed to submit verification. Please try again.');
        }
    });
}

function showCompletion(data) {
    document.getElementById('completedSessionId').textContent = data.sessionId;
    document.getElementById('completedStatus').textContent = data.status;
    showStep('Complete');
}

function setupCompletion() {
    document.getElementById('startNew').addEventListener('click', () => {
        location.reload();
    });
}

document.getElementById('closeError').addEventListener('click', hideError);

async function init() {
    await initSession();
    setupIdCapture();
    setupSelfieCapture();
    setupReview();
    setupCompletion();
}

init();
