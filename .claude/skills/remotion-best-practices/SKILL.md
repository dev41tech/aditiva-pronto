---
name: remotion-best-practices
description: Best practices for creating programmatic videos with Remotion (React-based video framework). Use ONLY when the project involves video generation, motion graphics, or programmatic video creation with Remotion. Do not apply to standard web UI tasks.
license: MIT
metadata:
  author: community
  version: "1.0.0"
  source: github.com/wyn-twotabs/claude-skills
---

# Remotion Best Practices

Domain-specific knowledge for creating videos programmatically in React using Remotion.

## When to Apply

**Only use for:**
- Remotion compositions and sequences
- Programmatic video generation
- Motion graphics with React
- Video exports and rendering pipelines

**Do NOT apply to standard web UI work.**

## Core Concepts

### Composition Structure
```tsx
import { Composition } from 'remotion';

export const RemotionRoot = () => {
  return (
    <Composition
      id="MyVideo"
      component={MyVideo}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
```

### Frame-Based Timing
- Always use `useCurrentFrame()` for time-based animations
- Use `interpolate()` for smooth value transitions
- Use `spring()` for physics-based motion
- Never use `Date.now()` or `setTimeout` — use frame counts

```tsx
const frame = useCurrentFrame();
const opacity = interpolate(frame, [0, 30], [0, 1], {
  extrapolateRight: 'clamp',
});
```

## Animation Rules

### Media & Assets

- **Images**: Use `<Img>` from Remotion, not `<img>` — ensures preloading
- **Videos**: Use `<Video>` from Remotion for embedded video clips
- **Audio**: Use `<Audio>` from Remotion — supports `startFrom`, `endAt`
- **Fonts**: Use `loadFont()` in the root, not CSS `@font-face`
- **GIFs**: Use `<Gif>` from `@remotion/gif` package

### Animations & Timing

- Use `spring()` for enter/exit animations (feels natural)
- Use `interpolate()` for linear value mapping
- Use `Sequence` to layer and offset animations in time
- Use `Series` for sequential content blocks
- Always `clamp` interpolate output to avoid values outside expected range

```tsx
// ✅ Spring animation
const scale = spring({
  frame,
  fps,
  config: { damping: 12, stiffness: 200 },
});

// ✅ Text reveal
const opacity = interpolate(frame, [0, 20], [0, 1], {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
});
```

### Transitions

- Use `@remotion/transitions` for pre-built transitions
- Use `TransitionSeries` for transition between content blocks
- Available transitions: `fade()`, `wipe()`, `flip()`, `slide()`, `clockWipe()`

### Text Animations

- Use `@remotion/media-utils` for word-by-word caption timing
- Use `makeTransform` + `translate` for text slide-ins
- Apply `overflow: 'hidden'` container for text reveal effects

## Audio & Voiceover

```tsx
// ElevenLabs TTS integration
import { useAudioData, visualizeAudio } from '@remotion/media-utils';

// Visualize audio waveform
const audioData = useAudioData(audioSrc);
const visualization = visualizeAudio({ audioData, frame, fps, numberOfSamples: 64 });
```

## 3D & Advanced Effects

- Use `@remotion/three` for Three.js compositions
- Use `@remotion/lottie` for Lottie animation playback
- Use `@remotion/paths` for SVG path animations
- Use `@remotion/shapes` for geometric shape primitives

## Charts & Data Visualization

- Use `@remotion/motion-blur` for motion blur on fast elements
- Animate chart values with `interpolate()` from 0 to final value
- Use `spring()` for bar chart reveal — feels alive
- Keep data-viz accessible: include text labels, not just visual bars

## Performance & Rendering

- Use `delayRender()` and `continueRender()` for async data loading
- Use `prefetch()` for remote media assets
- Keep compositions under 10 minutes for manageable render times
- Use `renderMediaOnLambda()` for parallel cloud rendering (AWS Lambda)

## Rendering Pipeline

```bash
# Preview
npx remotion studio

# Render single file
npx remotion render MyVideo output.mp4

# Render via Lambda (cloud)
npx remotion lambda render --site-name=my-video MyVideo output.mp4
```

## TailwindCSS Integration

Remotion supports Tailwind with `@remotion/tailwind`:
- Add `enableTailwind()` to `remotion.config.ts`
- Use Tailwind classes in compositions normally
- Purge is handled automatically during render
