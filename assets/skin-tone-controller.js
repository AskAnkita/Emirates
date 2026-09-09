/*
 * Drives the skin tone control rendered by snippets/skin-tone-controller.liquid.
 *
 * The element owns an SVG filter (already in the DOM inside it); moving the slider
 * rewrites that filter's tone matrix and points its own container's image at it.
 *
 * The masking that keeps the metal and the diamond out of the tone shift lives in the
 * filter itself -- see the snippet for the derivation. All this file does is choose the
 * transform for the skin, interpolated so a drag reads as continuous rather than as five
 * discrete swatches.
 */
if (!customElements.get('skin-tone-controller')) {
  const STORAGE_KEY = 'theme:skin-tone';
  const DEFAULT_VALUE = 50;

  /*
   * A keyword can match several images, so a gallery can show more than one control at
   * once. They are the same choice, not independent ones -- dragging either has to move
   * the rest, or the page reads as broken. Broadcast rather than have each instance hunt
   * for its siblings, so controls in the zoom dialog or a re-rendered gallery join in
   * without any registry to keep current.
   */
  const SYNC_EVENT = 'skin-tone:change';

  /*
   * The tone ramp, as a per-channel affine transform `out = scale * in + offset` that the
   * SVG colour matrix applies to skin pixels. Position 50 is the photograph exactly as
   * shot, so the filter is detached entirely there.
   *
   * The two halves deliberately use different mechanisms, because a single one clips:
   *
   *   - DEEPENING (above 50) is a pure multiply, offset 0. Multiplying moves towards
   *     black, which it can never overshoot, and dropping B fastest is what stops a
   *     darkened photo from reading grey instead of richer.
   *   - LIGHTENING (below 50) is a lift towards white, `scale = 1 - k, offset = k`. Every
   *     lightening stop below therefore keeps `scale + offset === 1` per channel; break
   *     that and the transform stops being a blend towards white and can overshoot.
   *     Multiplying by >1 would blow the red channel out on skin that is already fair
   *     (#F5DCC8 * 1.15 clips to #FFF6D8, a flat yellow patch); lifting cannot clip,
   *     because it interpolates towards white rather than scaling past it.
   */
  /*
   * These ends were deliberately widened once (0.36 lift / 0.25 multiply) and pulled back:
   * a linear ramp stops looking photographic well before it runs out of numerical room.
   * Multiplying far enough to reach genuinely deep skin crushes the shadow side to near
   * black and flattens the midtone separation that reads as skin; lifting far enough to
   * reach porcelain washes the warmth out into grey. Widening THIS transform is the wrong
   * lever -- see the note under the table for the one that would work.
   */
  const STOPS = [
    { at: 0, scale: [0.78, 0.8, 0.84], offset: [0.22, 0.2, 0.16] },
    { at: 25, scale: [0.9, 0.91, 0.93], offset: [0.1, 0.09, 0.07] },
    { at: 50, scale: [1.0, 1.0, 1.0], offset: [0.0, 0.0, 0.0] },
    { at: 75, scale: [0.8, 0.7, 0.6], offset: [0.0, 0.0, 0.0] },
    { at: 100, scale: [0.58, 0.45, 0.34], offset: [0.0, 0.0, 0.0] },
  ];

  /*
   * To extend the range without losing realism the ramp has to stop being linear: a gamma
   * curve (feComponentTransfer type="gamma") moves the midtones while leaving the shadow
   * and highlight ends comparatively alone, which is what keeps the skin reading as lit
   * rather than dimmed. That is a change to the filter in the snippet, not to this table.
   */

  const lerp = (from, to, t) => from.map((channel, index) => channel + (to[index] - channel) * t);

  function toneAt(value) {
    if (value <= STOPS[0].at) return STOPS[0];
    if (value >= STOPS[STOPS.length - 1].at) return STOPS[STOPS.length - 1];

    for (let i = 1; i < STOPS.length; i++) {
      const upper = STOPS[i];
      if (value > upper.at) continue;

      const lower = STOPS[i - 1];
      const t = (value - lower.at) / (upper.at - lower.at);
      return {
        scale: lerp(lower.scale, upper.scale, t),
        offset: lerp(lower.offset, upper.offset, t),
      };
    }

    return STOPS[STOPS.length - 1];
  }

  function isIdentity({ scale, offset }) {
    return scale.every((channel) => Math.abs(channel - 1) < 0.005)
      && offset.every((channel) => Math.abs(channel) < 0.005);
  }

  function labelFor(value) {
    if (value < 20) return 'Light';
    if (value < 40) return 'Fair';
    if (value < 60) return 'Natural';
    if (value < 80) return 'Tan';
    return 'Deep';
  }

  function readStoredValue() {
    try {
      const stored = parseInt(sessionStorage.getItem(STORAGE_KEY) ?? '', 10);
      return Number.isNaN(stored) ? DEFAULT_VALUE : Math.min(100, Math.max(0, stored));
    } catch {
      // Storage can throw outright in private / partitioned contexts.
      return DEFAULT_VALUE;
    }
  }

  function writeStoredValue(value) {
    try {
      sessionStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // Non-fatal: the tone simply will not carry to the next product.
    }
  }

  customElements.define(
    'skin-tone-controller',
    class SkinToneController extends HTMLElement {
      connectedCallback() {
        this.input = this.querySelector('.skin-tone-controller__input');
        this.valueLabel = this.querySelector('.skin-tone-controller__value');
        this.toneMatrix = this.querySelector('[data-tone-matrix]');
        this.filterId = this.getAttribute('filter-id');

        // Scope to the single media container this control lives in, so the filter can
        // never reach the rest of the gallery. Prefer the product photo specifically --
        // the container can also hold badge artwork, which must not be re-toned.
        this.container = this.closest('.media-gallery__grid-item') || this.parentElement;
        this.image = this.container?.querySelector('picture.media img')
          || this.container?.querySelector('img');

        if (!this.input || !this.toneMatrix || !this.image || !this.filterId) {
          this.hidden = true;
          return;
        }

        this.abortController = new AbortController();
        const { signal } = this.abortController;

        this.input.addEventListener('input', () => this.update(true), { signal });

        // A drag or click on the control must not also open the zoom dialog behind it.
        for (const type of ['pointerdown', 'mousedown', 'touchstart', 'click']) {
          this.addEventListener(type, (event) => event.stopPropagation(), { signal });
        }

        document.addEventListener(
          SYNC_EVENT,
          (event) => {
            if (event.detail?.source === this) return;

            const next = String(event.detail?.value ?? '');
            if (next === '' || this.input.value === next) return;

            this.input.value = next;
            // persist: false -- the originating control already stored and broadcast it.
            this.update(false);
          },
          { signal }
        );

        this.input.value = String(readStoredValue());
        this.update(false);
      }

      disconnectedCallback() {
        this.abortController?.abort();
        this.abortController = null;
      }

      update(persist) {
        const value = Number(this.input.value);
        const tone = toneAt(value);

        if (isIdentity(tone)) {
          // Detach the filter completely at the neutral position, so the shopper sees the
          // untouched photograph rather than a filter round-trip of it.
          this.image.style.filter = '';
        } else {
          const [sr, sg, sb] = tone.scale.map((channel) => channel.toFixed(4));
          const [or, og, ob] = tone.offset.map((channel) => channel.toFixed(4));
          this.toneMatrix.setAttribute(
            'values',
            `${sr} 0 0 0 ${or}  0 ${sg} 0 0 ${og}  0 0 ${sb} 0 ${ob}  0 0 0 1 0`
          );
          this.image.style.filter = `url(#${this.filterId})`;
        }

        const label = labelFor(value);
        if (this.valueLabel) this.valueLabel.textContent = label;
        this.input.setAttribute('aria-valuetext', label);

        if (persist) {
          writeStoredValue(value);
          document.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { value, source: this } }));
        }
      }
    }
  );
}
