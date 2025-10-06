// feature-audio.js - Audio Management

import { state } from './feature-state.js';
import { getCurrentAudioFile } from './feature-prayers.js';
import { render } from './feature-render.js';

export let audio = new Audio();
export let audioTimeoutId = null;
export let timeoutId = null;

export function playAudio() {
    const audioFile = getCurrentAudioFile();
    if (!audioFile) return;
    
    audio.src = audioFile;
    audio.play().then(() => {
        state.isPlaying = true;
        render();
    }).catch(err => {
        console.error('Erreur de lecture audio:', err);
    });
}

export function stopAudio() {
    audio.pause();
    audio.currentTime = 0;
    state.isPlaying = false;
}

export function setupAudioEndedHandler(nextStepCallback, getCurrentStepsCallback, PRAYERS) {
    audio.onended = () => {
        state.isPlaying = false;
        render();
        
        if (state.scenarioMode) {
            const steps = getCurrentStepsCallback();
            const step = steps[state.currentStepIndex];
            const pauseDuration = step.pauseAfter || 1000;
            
            timeoutId = setTimeout(() => {
                const isLastStep = state.currentRakaat === PRAYERS[state.selectedPrayer].rakaats && 
                                  state.currentStepIndex === steps.length - 1;
                if (!isLastStep) {
                    nextStepCallback();
                }
            }, pauseDuration);
        }
    };
}
