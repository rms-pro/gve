import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { CSSProperties, FormEvent, ReactNode } from 'react';
import type {
  Algorithm,
  CustomEvent,
  RendererRegistration,
  VisualState,
} from '@gve/core';
import { layoutCells, layoutDiagram, formatValue } from '@gve/renderers';
import { createPlayback, generateTrace } from '@gve/runtime';
import type { ExecutionLimits, Playback, PlaybackOptions } from '@gve/runtime';
import type { Theme, ThemeMode } from '@gve/themes';

export function usePlayback(playback: Playback) {
  return useSyncExternalStore(
    playback.subscribe,
    playback.getSnapshot,
    playback.getSnapshot,
  );
}
export const Visualization = memo(function Visualization({
  state,
}: {
  state: VisualState;
}) {
  if (['graph', 'tree', 'linked', 'recursion'].includes(state.kind)) {
    const diagram = layoutDiagram(state);
    return diagram.nodes.length ? (
      <svg
        className="gve-diagram"
        style={diagram.width > 600 ? { minWidth: diagram.width } : undefined}
        viewBox={`0 0 ${diagram.width} ${diagram.height}`}
        role="img"
        aria-label={`${state.kind} with ${diagram.nodes.length} nodes${
          diagram.nodes.some((node) => node.active)
            ? `; highlighted: ${diagram.nodes
                .filter((node) => node.active)
                .map((node) => node.label)
                .join(', ')}`
            : ''
        }`}
      >
        {diagram.edges.map(({ from, to, active }, i) => (
          <line
            key={i}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            data-active={active}
          />
        ))}
        {diagram.nodes.map((node) => (
          <g key={node.id} data-active={node.active}>
            <title>{node.label}</title>
            <circle cx={node.x} cy={node.y} r={24} />
            <text
              x={node.x}
              y={node.y}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {Array.from(node.label).length > 6
                ? `${Array.from(node.label).slice(0, 5).join('')}…`
                : node.label}
            </text>
          </g>
        ))}
      </svg>
    ) : (
      <p className="gve-empty">No nodes yet</p>
    );
  }
  const rows = layoutCells(state);
  if (!rows.some((row) => row.length))
    return <p className="gve-empty">No values</p>;
  return (
    <div
      className="gve-rows"
      data-kind={state.kind}
      aria-label={state.kind}
      role="group"
    >
      {rows.map((row, i) => (
        <div className="gve-cells" key={i}>
          {row.map((cell) => (
            <div className="gve-cell" key={cell.key}>
              <div
                className="gve-value"
                data-active={cell.active}
                role="group"
                aria-label={
                  cell.active ? `Highlighted: ${cell.label}` : undefined
                }
                style={
                  cell.magnitude === undefined
                    ? undefined
                    : { height: `${28 + cell.magnitude * 126}px` }
                }
              >
                {cell.label}
              </div>
              {state.kind === 'array' && (
                <span className="gve-index">{cell.key}</span>
              )}
              {!!cell.pointers.length && (
                <span className="gve-pointer">{cell.pointers.join(', ')}</span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
});
export function PlaybackControls({ playback }: { playback: Playback }) {
  const { playing, position, length, speed } = usePlayback(playback);
  return (
    <div className="gve-controls">
      <button
        type="button"
        aria-label="Stop and reset"
        disabled={position === 0 && !playing}
        onClick={() => playback.reset()}
      >
        ↺
      </button>
      <button
        type="button"
        aria-label="Previous step"
        disabled={position === 0}
        onClick={() => {
          playback.pause();
          playback.stepBackward();
        }}
      >
        ‹
      </button>
      <button
        type="button"
        className="gve-primary"
        disabled={length === 0}
        onClick={() =>
          playing
            ? playback.pause()
            : position === length
              ? playback.restart()
              : playback.resume()
        }
      >
        {playing
          ? 'Pause'
          : position === length && length > 0
            ? 'Replay'
            : 'Play'}
      </button>
      <button
        type="button"
        aria-label="Next step"
        disabled={position === length}
        onClick={() => {
          playback.pause();
          playback.stepForward();
        }}
      >
        ›
      </button>
      <label className="gve-speed">
        Speed{' '}
        <select
          value={speed}
          onChange={(e) => playback.setSpeed(Number(e.target.value))}
        >
          {[0.25, 0.5, 1, 1.5, 2, 4].map((rate) => (
            <option key={rate} value={rate}>
              {rate}×
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
export function Timeline({ playback }: { playback: Playback }) {
  const { position, length } = usePlayback(playback);
  return (
    <label className="gve-timeline">
      <span>Timeline</span>
      <span className="gve-position" aria-hidden="true">
        {position} / {length} steps
      </span>
      <input
        aria-label="Timeline"
        aria-valuetext={`Step ${position} of ${length}`}
        type="range"
        min={0}
        max={length}
        value={position}
        disabled={!length}
        onChange={(e) => {
          playback.pause();
          playback.seek(Number(e.target.value));
        }}
      />
    </label>
  );
}
export function InputEditor({
  input,
  onApply,
}: {
  input: unknown;
  onApply: (input: unknown) => void;
}) {
  const [draft, setDraft] = useState(() => JSON.stringify(input));
  const [error, setError] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      onApply(JSON.parse(draft));
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }
  return (
    <form className="gve-editor" onSubmit={submit}>
      <label>
        Input JSON
        <textarea
          spellCheck={false}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      </label>
      <button type="submit">Apply input</button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
export function CodePanel({
  code,
  line,
}: {
  code: readonly string[];
  line?: number;
}) {
  return (
    <section className="gve-panel">
      <h3>Pseudocode</h3>
      <ol className="gve-code">
        {code.map((text, i) => (
          <li key={i} aria-current={line === i + 1 ? 'step' : undefined}>
            <code>{text}</code>
          </li>
        ))}
      </ol>
    </section>
  );
}
export function VariablesPanel({ state }: { state: VisualState }) {
  const entries = Object.entries(state.variables ?? {});
  return (
    <section className="gve-panel">
      <h3>Variables</h3>
      <dl className="gve-variables">
        <dt>Size</dt>
        <dd>{state.nodes?.length ?? state.values.length}</dd>
        {entries.flatMap(([name, value]) => [
          <dt key={`${name}-name`}>{name}</dt>,
          <dd key={name}>{formatValue(value)}</dd>,
        ])}
      </dl>
      {!!state.frames?.length && (
        <>
          <h4>Call stack</h4>
          <ol>
            {state.frames.map((frame, index) => (
              <li key={index}>{frame}</li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
export function ExplanationPanel({ explanation }: { explanation: string }) {
  return (
    <section className="gve-panel">
      <h3>Explanation</h3>
      <p>{explanation}</p>
    </section>
  );
}
export interface AlgorithmVisualizerProps<I, R, E extends CustomEvent = never> {
  algorithm: Algorithm<I, R, E>;
  input: I;
  theme?: ThemeMode | Theme;
  showControls?: boolean;
  showCode?: boolean;
  showVariables?: boolean;
  showInput?: boolean;
  limits?: ExecutionLimits;
  playbackOptions?: PlaybackOptions;
  renderers?: readonly RendererRegistration<ReactNode>[];
}
function prepare<I, R, E extends CustomEvent>(
  algorithm: Algorithm<I, R, E>,
  input: unknown,
  limits?: ExecutionLimits,
  options?: PlaybackOptions,
) {
  return createPlayback(
    algorithm,
    generateTrace(algorithm, input, limits),
    options,
  );
}
export function AlgorithmVisualizer<I, R, E extends CustomEvent = never>(
  props: AlgorithmVisualizerProps<I, R, E>,
) {
  const { algorithm, input, limits, playbackOptions } = props;
  const initial = useMemo(() => {
    try {
      return { playback: prepare(algorithm, input, limits, playbackOptions) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [algorithm, input, limits, playbackOptions]);
  const [edit, setEdit] = useState<{
    initial: typeof initial;
    playback: Playback;
  }>();
  const playback = edit?.initial === initial ? edit.playback : initial.playback;
  const theme = props.theme ?? 'auto';
  const colorOverrides =
    typeof theme === 'string'
      ? undefined
      : (Object.fromEntries(
          Object.entries(theme.colors).map(([name, value]) => [
            `--gve-${name}`,
            value,
          ]),
        ) as CSSProperties);
  return (
    <div
      className="gve"
      data-theme={typeof theme === 'string' ? theme : theme.mode}
      style={colorOverrides}
    >
      {playback ? (
        <Player playback={playback} props={props} />
      ) : (
        <p role="alert">{initial.error}</p>
      )}
      {props.showInput && (
        <InputEditor
          key={JSON.stringify(input)}
          input={input}
          onApply={(value) =>
            setEdit({
              initial,
              playback: prepare(algorithm, value, limits, playbackOptions),
            })
          }
        />
      )}
    </div>
  );
}
function Player<I, R, E extends CustomEvent>({
  playback,
  props,
}: {
  playback: Playback;
  props: AlgorithmVisualizerProps<I, R, E>;
}) {
  const { state, playing, position, length } = usePlayback(playback);
  const section = useRef<HTMLElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState('');
  useEffect(() => () => playback.pause(), [playback]);
  useEffect(() => {
    const sync = () =>
      setFullscreen(document.fullscreenElement === section.current);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  const renderer = props.renderers?.find((item) => item.kind === state.kind);
  return (
    <section
      ref={section}
      className="gve-player"
      aria-label={props.algorithm.metadata.title}
    >
      <div className="gve-workspace">
        <div className="gve-stage">
          <div className="gve-stage-head">
            <h3>Visualization</h3>
            <button
              type="button"
              aria-pressed={fullscreen}
              onClick={async () => {
                try {
                  if (fullscreen) await document.exitFullscreen();
                  else await section.current?.requestFullscreen();
                  setFullscreenError('');
                } catch {
                  setFullscreenError('Fullscreen is unavailable.');
                }
              }}
            >
              {fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            </button>
          </div>
          {fullscreenError && <p role="status">{fullscreenError}</p>}
          <div
            className="gve-canvas"
            tabIndex={0}
            aria-label="Visualization canvas. Use arrow keys to step and space to play."
            onKeyDown={(event) => {
              if (
                event.target !== event.currentTarget ||
                props.showControls === false
              )
                return;
              if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault();
                playback.pause();
                if (event.key === 'ArrowLeft') playback.stepBackward();
                else playback.stepForward();
              }
              if (event.key === ' ') {
                event.preventDefault();
                if (playing) playback.pause();
                else if (
                  playback.getSnapshot().position ===
                  playback.getSnapshot().length
                )
                  playback.restart();
                else playback.resume();
              }
            }}
          >
            {renderer ? (
              renderer.render(state)
            ) : (
              <Visualization state={state} />
            )}
          </div>
          <p className="gve-visually-hidden" role="status" aria-atomic="true">
            {playing
              ? 'Playing.'
              : `${length && position === length ? 'Complete' : 'Paused'}. Step ${position} of ${length}. ${state.explanation ?? ''}`}
          </p>
          {props.showControls !== false && (
            <>
              <PlaybackControls playback={playback} />
              <Timeline playback={playback} />
            </>
          )}
        </div>
        <div className="gve-inspector">
          {props.showCode && (
            <CodePanel code={props.algorithm.metadata.code} line={state.line} />
          )}
          {props.showVariables && <VariablesPanel state={state} />}
          <ExplanationPanel
            explanation={
              state.explanation ?? props.algorithm.metadata.description
            }
          />
        </div>
      </div>
    </section>
  );
}
