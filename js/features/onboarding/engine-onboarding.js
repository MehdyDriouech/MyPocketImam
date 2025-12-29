export class OnboardingEngine {
  constructor(dependencies) {
    this.state = dependencies.state;
    this.eventBus = dependencies.eventBus;
    this.ONBOARDING_KEY = 'prayerAppOnboardingCompleted';
  }
  
  init() {
    if (!this.hasCompletedOnboarding()) {
        // IMPORTANT: Définir onboardingStep AVANT showOnboarding
        // car showOnboarding déclenche le rendu de la vue
        this.state.set('onboardingStep', 1);
        this.state.set('showOnboarding', true);
    }
  }

  hasCompletedOnboarding() {
    return localStorage.getItem(this.ONBOARDING_KEY) === 'true';
  }

  completeOnboarding() {
    localStorage.setItem(this.ONBOARDING_KEY, 'true');
    this.state.set('showOnboarding', false);
    this.state.set('onboardingStep', 1);
    
    // Trigger reload of prayer times if location was set during onboarding
    const city = this.state.get('city');
    const country = this.state.get('country');
    if (city && country) {
        this.eventBus.emit('settings:location-changed', { city, country });
    }
  }

  skipOnboarding() {
      this.completeOnboarding();
  }

  nextStep() {
      const currentStep = this.state.get('onboardingStep');
      const totalSteps = 3; // Hardcoded based on content
      if (currentStep < totalSteps) {
          this.state.set('onboardingStep', currentStep + 1);
      } else {
          this.completeOnboarding();
      }
  }

  previousStep() {
      const currentStep = this.state.get('onboardingStep');
      if (currentStep > 1) {
          this.state.set('onboardingStep', currentStep - 1);
      }
  }

  updateLocation(city, country) {
      this.state.update({ city, country });
  }
}

