import { useEffect, useState, type CSSProperties } from 'react';
import { useTranslation } from '../app/i18n';
import { useSettingsStore, type ColorScheme } from '../stores/settingsStore';
import { isAnimatableSpectatorBackground, spectatorAnimationPresets, spectatorBackgrounds, type SpectatorAnimationPreset, type SpectatorBackground as SpectatorBackgroundId, type SpectatorBackgroundImage } from '../types/tournament';
import { SpectatorBackgroundParticles } from './SpectatorBackgroundParticles';
import arenaDark from '../assets/arena-dark.png';
import arenaLight from '../assets/arena-light.png';
import ribbonsDark from '../assets/ribbons-dark.png';
import ribbonsLight from '../assets/ribbons-light.png';
import contourDark from '../assets/contour-dark.png';
import contourLight from '../assets/contour-light.png';

const backgroundAssets: Partial<Record<SpectatorBackgroundId, Record<ColorScheme, string>>> = {
  'arena-tatami': { dark: arenaDark, light: arenaLight },
  'ribbons-smoke': { dark: ribbonsDark, light: ribbonsLight },
  'contour-fog': { dark: contourDark, light: contourLight },
};

export function SpectatorBackground({ variant, image = null, animated = false, preset = 'arena-dust', preview = false }: { variant: SpectatorBackgroundId; image?: SpectatorBackgroundImage; animated?: boolean; preset?: SpectatorAnimationPreset; preview?: boolean }) {
  const colorScheme = useSettingsStore(state => state.settings.colorScheme);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!query) return;
    const update = () => setReducedMotion(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  if (variant === 'none') return null;
  const source = backgroundAssets[variant]?.[colorScheme] ?? (variant === 'custom' ? image : null);
  const shouldAnimate = animated && isAnimatableSpectatorBackground(variant) && !reducedMotion;
  return <div className={`spectator-background spectator-background--${variant}${source ? ' spectator-background--image' : ''}${shouldAnimate ? ` spectator-background--preset-${preset}` : ''}${preview ? ' spectator-background--preview' : ''}`} style={source ? { '--spectator-image': `url("${source}")` } as CSSProperties : undefined} aria-hidden="true">
    {shouldAnimate && <><SpectatorBackgroundParticles preset={preset}/><span className="spectator-background__glow spectator-background__glow--blue" /><span className="spectator-background__glow spectator-background__glow--red" /><span className="spectator-background__sweep" /><span className="spectator-background__vignette" /></>}
  </div>;
}

export function SpectatorBackgroundPicker({ value, image = null, animated = false, preset = 'arena-dust', timerBackground = true, onChange, onImageChange, onAnimatedChange, onPresetChange, onTimerBackgroundChange }: { value: SpectatorBackgroundId; image?: SpectatorBackgroundImage; animated?: boolean; preset?: SpectatorAnimationPreset; timerBackground?: boolean; onChange: (value: SpectatorBackgroundId) => void; onImageChange?: (image: SpectatorBackgroundImage) => void; onAnimatedChange?: (animated: boolean) => void; onPresetChange?: (preset: SpectatorAnimationPreset) => void; onTimerBackgroundChange?: (visible: boolean) => void }) {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const canAnimate = isAnimatableSpectatorBackground(value);
  const selectBackground = (background: SpectatorBackgroundId) => {
    onChange(background);
    if (!isAnimatableSpectatorBackground(background)) onAnimatedChange?.(false);
  };
  const uploadImage = (file?: File) => {
    setError(null);
    if (!file || !onImageChange) return;
    const extension = file.name.match(/\.([^.]+)$/)?.[1]?.toLowerCase();
    const inferredMime = extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : extension === 'gif' ? 'image/gif' : extension === 'bmp' ? 'image/bmp' : null;
    const supportedMime = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp'].includes(file.type);
    if (!supportedMime && !inferredMime) return setError(t('Background must be a raster image.'));
    if (file.size > 5 * 1024 * 1024) return setError(t('The background must be 5 MB or smaller.'));
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      if (typeof reader.result !== 'string') return;
      onImageChange(reader.result);
      selectBackground('custom');
    });
    reader.readAsDataURL(supportedMime ? file : new File([file], file.name, { type: inferredMime! }));
  };
  return <fieldset className="spectator-background-picker">
    <legend>{t('Spectator background')}</legend>
    <div className="spectator-background-picker__options">
      {spectatorBackgrounds.map(background => background === 'custom' ? <div key={background} className="spectator-background-option spectator-background-option--custom" data-selected={value === background}>
        <label className="spectator-background-option__upload" data-has-image={Boolean(image)}>
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,.png,.jpg,.jpeg,.webp,.gif,.bmp" onChange={event => uploadImage(event.currentTarget.files?.[0])}/>
          {image ? <><span className="spectator-background-option__preview"><SpectatorBackground variant={background} image={image} preview /></span><span className="spectator-background-option__label">{t(`Spectator background: ${background}`)}</span></> : <span>{t('Upload custom background')}</span>}
        </label>
      </div> : <button key={background} type="button" className="spectator-background-option" aria-pressed={value === background} onClick={() => selectBackground(background)}>
        <span className="spectator-background-option__preview"><SpectatorBackground variant={background} image={image} preview /></span>
        <span className="spectator-background-option__label">{t(`Spectator background: ${background}`)}</span>
      </button>)}
    </div>
    <label className="spectator-background-animation">
      <input type="checkbox" checked={canAnimate && animated} disabled={!canAnimate} onChange={event => onAnimatedChange?.(event.currentTarget.checked)}/>
      <span>{t('Animate background')}</span>
    </label>
    <label className="spectator-background-preset">
      <span>{t('Animation')}</span>
      <select value={preset} disabled={!canAnimate || !animated} onChange={event => onPresetChange?.(event.target.value as SpectatorAnimationPreset)}>
        {spectatorAnimationPresets.map(item => <option key={item} value={item}>{t(`Animation preset: ${item}`)}</option>)}
      </select>
    </label>
    <label className="spectator-background-animation">
      <input type="checkbox" checked={timerBackground} onChange={event => onTimerBackgroundChange?.(event.currentTarget.checked)}/>
      <span>{t('Timer background')}</span>
    </label>
    {onImageChange && <small className="spectator-background-upload__hint">{t('Raster image up to 5 MB. The image is saved only on this device.')}</small>}
    {error && <small className="spectator-background-upload__error" role="alert">{error}</small>}
  </fieldset>;
}
