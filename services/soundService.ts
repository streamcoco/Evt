
// Simple synthesizer for game sound effects
const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

const playTone = (freq: number, type: OscillatorType, duration: number, delay: number = 0) => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
    
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + delay + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(audioCtx.currentTime + delay);
    osc.stop(audioCtx.currentTime + delay + duration);
};

export const playSound = (type: 'success' | 'levelUp' | 'click' | 'error' | 'buy' | 'beep' | 'whistle') => {
    if (!audioCtx || audioCtx.state === 'suspended') {
        audioCtx?.resume();
    }

    switch (type) {
        case 'success':
            playTone(600, 'sine', 0.1);
            playTone(800, 'sine', 0.3, 0.1);
            break;
        case 'levelUp':
            playTone(400, 'square', 0.1, 0);
            playTone(500, 'square', 0.1, 0.1);
            playTone(600, 'square', 0.1, 0.2);
            playTone(800, 'square', 0.6, 0.3);
            break;
        case 'click':
            playTone(300, 'triangle', 0.05);
            break;
        case 'error':
            playTone(150, 'sawtooth', 0.3);
            break;
        case 'buy':
            playTone(1200, 'sine', 0.1);
            playTone(1600, 'sine', 0.2, 0.1);
            break;
        case 'beep': // Countdown / interval
            playTone(800, 'sine', 0.1);
            break;
        case 'whistle': // Start/End work
            playTone(1500, 'square', 0.1);
            playTone(1000, 'square', 0.3, 0.1);
            break;
    }
};
