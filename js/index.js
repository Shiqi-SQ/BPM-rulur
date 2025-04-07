$(document).ready(function() {
    let audioContext = null;
    const audioBuffers = [];
    let bpm = 0;
    let taps = [];
    let lastTapTime = 0;
    let tapCount = 0;
    let stableTimeout = null;
    let isMuted = false;
    let isMetronomeActive = false;
    let metronomeInterval = null;

    const $tapArea = $('#tap-area');
    const $tapText = $('.tap-text');
    const $decreaseBtn = $('#decrease-btn');
    const $increaseBtn = $('#increase-btn');
    const $muteCheckbox = $('#mute-checkbox');
    const $metronomeBtn = $('#metronome-btn');

    function initAudio() {
        if (audioContext) return;
        try {
            audioContext = new(window.AudioContext || window.webkitAudioContext)();
            loadAudioFiles();
        } catch (e) {
            console.error('Web Audio API不受支持:', e);
        }
    }

    function loadAudioFiles() {
        const audioFiles = ['asset/01.ogg', 'asset/02.ogg'];
        audioFiles.forEach((file, index) => {
            const request = new XMLHttpRequest();
            request.open('GET', file, true);
            request.responseType = 'arraybuffer';
            request.onload = function () {
                audioContext.decodeAudioData(request.response, function (buffer) {
                    audioBuffers[index] = buffer;
                    console.log(`音频文件 ${file} 加载成功`);
                }, function (e) {
                    console.error('解码音频数据失败:', e);
                });
            };
            request.onerror = function () {
                console.error(`加载音频文件 ${file} 失败`);
            };
            request.send();
        });
    }

    function playSound(index) {
        if (!audioContext) {
            console.error('音频上下文未初始化');
            return;
        }
        if (!audioBuffers[index]) {
            console.error(`音频缓冲区 ${index} 未加载`);
            return;
        }
        if (isMuted) {
            console.log('静音状态，不播放音频');
            return;
        }
        try {
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffers[index];
            source.connect(audioContext.destination);
            source.start(0);
            console.log(`播放音频 ${index}`);
        } catch (e) {
            console.error('播放音频失败:', e);
        }
    }

    function playSequenceSound() {
        const sequence = [0, 1, 1, 1, 0, 1, 1, 1];
        const soundIndex = sequence[tapCount % sequence.length];
        playSound(soundIndex);
        tapCount++;
    }

    function updateMetronome() {
        if (!isMetronomeActive || bpm <= 0) return;
        if (metronomeInterval) {
            clearInterval(metronomeInterval);
        }
        const interval = 60000 / bpm;
        metronomeInterval = setInterval(playSequenceSound, interval);
    }

    function updateBPMDisplay() {
        if (bpm === 0) {
            $tapText.text("点击");
            $tapArea.removeClass('tapped stable');
        } else {
            $tapText.text(Math.round(bpm));
        }
    }

    function calculateBPM() {
        if (taps.length < 2) return;
        const lastInterval = taps[taps.length - 1] - taps[taps.length - 2];
        bpm = 60000 / lastInterval;
        bpm = Math.min(Math.max(bpm, 30), 300);
        $tapText.text(Math.round(bpm));
        $tapArea.addClass('tapped').removeClass('stable');
        if (stableTimeout) {
            clearTimeout(stableTimeout);
        }
        stableTimeout = setTimeout(() => {
            $tapArea.removeClass('tapped').addClass('stable');
        }, 1500);
        updateMetronome();
    }

    function simulateTapAreaClick() {
        const now = Date.now();
        if (lastTapTime && (now - lastTapTime) > 2000) {
            taps = [];
        }
        taps.push(now);
        lastTapTime = now;
        playSequenceSound();
        if (taps.length > 8) {
            taps.shift();
        }
        
        $tapArea.addClass('active flash').removeClass('stable');
        $tapText.text("点击");
        
        setTimeout(() => {
            $tapArea.removeClass('flash');
        }, 150);
        
        setTimeout(() => {
            $tapArea.removeClass('active');
            if (taps.length < 2) {
                $tapArea.removeClass('tapped').addClass('stable');
            } else {
                calculateBPM();
            }
        }, 100);
    }

    $tapArea.on('click', function() {
        initAudio();
        simulateTapAreaClick();
    });

    $decreaseBtn.on('click', function() {
        if (bpm <= 0) return;
        bpm = Math.max(30, bpm - 1);
        updateBPMDisplay();
        updateMetronome();
    });

    $increaseBtn.on('click', function() {
        if (bpm <= 0) bpm = 60;
        else bpm = Math.min(300, bpm + 1);
        updateBPMDisplay();
        updateMetronome();
    });

    $muteCheckbox.on('change', function() {
        isMuted = this.checked;
        console.log('静音状态:', isMuted);
    });

    $metronomeBtn.on('click', function() {
        isMetronomeActive = !isMetronomeActive;
        $(this).toggleClass('active', isMetronomeActive);
        
        if (isMetronomeActive) {
            if (bpm <= 0) bpm = 60;
            updateMetronome();
        } else if (metronomeInterval) {
            clearInterval(metronomeInterval);
            metronomeInterval = null;
        }
    });

    $(window).on('keydown', function(e) {
        if (e.key === ' ' || e.keyCode === 32) {
            e.preventDefault();
            initAudio();
            simulateTapAreaClick();
        }
    });

    updateBPMDisplay();
});