/**
 * Optional local background music. No music is shipped or uploaded:
 * the user picks an audio file from their own device.
 */
export function mountLocalMusic(button: HTMLButtonElement): () => void {
  const picker = document.createElement('input');
  picker.type = 'file';
  picker.accept = 'audio/*';
  picker.hidden = true;
  picker.setAttribute('aria-label', 'Choose music from this device');
  button.after(picker);

  const audio = new Audio();
  audio.loop = true;
  audio.preload = 'none';
  audio.volume = 0.12;
  let objectUrl: string | null = null;

  const reflectState = (): void => {
    const playing = Boolean(objectUrl && !audio.paused);
    button.textContent = playing ? '♫ Music on' : '♫ Music off';
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-label', playing ? 'Pause background music' : objectUrl ? 'Play background music' : 'Choose local background music');
    button.title = objectUrl ? (playing ? 'Pause music' : 'Play selected music') : 'Choose an audio file from this device. Nothing is uploaded.';
  };

  function play(): void {
    // Playback can begin only after a visitor explicitly chooses a file or presses the button.
    void audio.play().then(reflectState).catch(() => {
      audio.pause();
      button.title = 'Could not play this audio file';
      reflectState();
    });
  }

  function onToggle(): void {
    if (!objectUrl) {
      picker.click();
    } else if (audio.paused) {
      play();
    } else {
      audio.pause();
      reflectState();
    }
  }

  function onFileChange(): void {
    const file = picker.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('audio/') && !/\.(mp3|m4a|ogg|wav|aac)$/i.test(file.name)) return;
    audio.pause();
    audio.removeAttribute('src');
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(file);
    audio.src = objectUrl;
    audio.load();
    play();
  }

  button.addEventListener('click', onToggle);
  picker.addEventListener('change', onFileChange);
  audio.addEventListener('ended', reflectState);
  reflectState();

  return () => {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    button.removeEventListener('click', onToggle);
    picker.removeEventListener('change', onFileChange);
    audio.removeEventListener('ended', reflectState);
    picker.remove();
  };
}
