export class AudioEngine {
  constructor(dependencies) {
    this.state = dependencies.state;
    this.eventBus = dependencies.eventBus;
    this.audio = new Audio();
    
    // Setup event listeners sur l'élément audio
    this.audio.addEventListener('ended', () => this.onAudioEnded());
    this.audio.addEventListener('play', () => this.onAudioPlay());
    this.audio.addEventListener('pause', () => this.onAudioPause());
    this.audio.addEventListener('error', (e) => this.onAudioError(e));
  }
  
  init() {
    // Écouter les événements pour jouer l'audio
    this.eventBus.on('audio:play', (audioFile) => this.play(audioFile));
    this.eventBus.on('audio:pause', () => this.pause());
    this.eventBus.on('audio:stop', () => this.stop());
  }
  
  play(audioFile) {
    if (!audioFile) return;
    
    // Stop current if playing
    if (this.state.get('isPlaying')) {
        this.audio.pause();
    }

    this.audio.src = audioFile;
    this.audio.play().catch(err => {
        console.error('Error playing audio:', err);
        this.eventBus.emit('audio:error', err);
    });
    
    this.state.set('isPlaying', true);
    this.state.set('currentAudio', audioFile);
  }
  
  pause() {
    this.audio.pause();
    this.state.set('isPlaying', false);
  }
  
  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.state.set('isPlaying', false);
    this.state.set('currentAudio', null);
  }
  
  onAudioEnded() {
    this.state.set('isPlaying', false);
    this.eventBus.emit('audio:ended');
  }
  
  onAudioPlay() {
    this.state.set('isPlaying', true);
    this.eventBus.emit('audio:playing');
  }
  
  onAudioPause() {
    this.state.set('isPlaying', false);
    this.eventBus.emit('audio:paused');
  }

  onAudioError(e) {
      console.error('Audio Error:', e);
      this.state.set('isPlaying', false);
  }
  
  isPlaying() {
    return this.state.get('isPlaying');
  }
}

