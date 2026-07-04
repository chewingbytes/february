import Reveal from "@/components/Reveal";

/**
 * A hand-drawn SVG vignette that sits below the Saint-Exupéry quote: four
 * couples gathered around one table, "looking outward together" — dice
 * tumbling, tokens hopping around the board, and a spark of connection
 * rising between each pair. Everything is CSS-animated (no library) and
 * fully stilled under `prefers-reduced-motion`.
 */
const rd = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as React.CSSProperties;
const spin = { transformBox: "fill-box", transformOrigin: "center" } as React.CSSProperties;

// A small heart, drawn around its own centre so it can scale/rise cleanly.
const HEART =
  "M0 4 C -3 -3 -12 -2 -12 5 C -12 11 -4 15 0 19 C 4 15 12 11 12 5 C 12 -2 3 -3 0 4 Z";

export default function GameNightScene() {
  return (
    <Reveal asTrigger className="px-6 pb-24 pt-4 md:pb-32">
      <div className="mx-auto max-w-4xl">
        <div className="rise" style={rd(0)}>
          <svg
            viewBox="0 0 900 620"
            role="img"
            aria-label="Four couples gathered around a table, playing a board game together on a hosted game night"
            className="h-auto w-full select-none"
          >
            <defs>
              <radialGradient id="lampGlow" cx="50%" cy="32%" r="62%">
                <stop offset="0%" stopColor="#E8C9BC" stopOpacity="0.6" />
                <stop offset="45%" stopColor="#E8C9BC" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#E8C9BC" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* warm lamplight, gently breathing */}
            <ellipse
              cx={450}
              cy={300}
              rx={380}
              ry={310}
              fill="url(#lampGlow)"
              className="animate-pulse-soft"
              style={spin}
            />

            {/* pendant lamp above the table */}
            <line x1={450} y1={0} x2={450} y2={70} className="stroke-forest/30" strokeWidth={2.5} />
            <path d="M 423 110 L 436 72 L 464 72 L 477 110 Z" className="fill-forest" />
            <ellipse cx={450} cy={110} rx={27} ry={7} className="fill-forest" />
            <circle cx={450} cy={113} r={7} className="fill-blush animate-pulse-soft" style={spin} />

            {/* floor shadow */}
            <ellipse cx={450} cy={514} rx={300} ry={26} className="fill-forest/10" />

            {/* back couples — seated at the far side, behind the table */}
            <Couple cx={322} y={256} s={0.85} body="fill-sage" head="fill-[#74826C]" heartDelay={0} />
            <Couple cx={578} y={256} s={0.85} body="fill-terracotta" head="fill-[#A5624F]" heartDelay={900} />

            {/* the host — presiding at the head of the table, under the lamp */}
            <Host />

            {/* the table */}
            <ellipse cx={450} cy={420} rx={290} ry={104} className="fill-[#CBBBA9]" />
            <ellipse cx={450} cy={400} rx={290} ry={104} className="fill-clay" />
            <ellipse cx={450} cy={392} rx={252} ry={84} className="fill-card-clay/60" />

            {/* the board */}
            <ellipse cx={450} cy={388} rx={176} ry={62} className="fill-card stroke-stone" strokeWidth={2} />
            <BoardTrack />

            {/* draw pile + tumbling dice at the centre */}
            <rect
              x={396}
              y={362}
              width={40}
              height={54}
              rx={7}
              className="fill-card-clay stroke-stone"
              strokeWidth={2}
              transform="rotate(-10 416 389)"
            />
            <g className="animate-bob">
              <g transform="translate(500 386)">
                <g className="animate-roll" style={spin}>
                  <rect x={-16} y={-16} width={32} height={32} rx={9} className="fill-card stroke-stone" strokeWidth={2} />
                  <Pip x={-8} y={-8} />
                  <Pip x={0} y={0} />
                  <Pip x={8} y={8} />
                </g>
              </g>
              <g transform="translate(466 400) rotate(15)">
                <rect x={-13} y={-13} width={26} height={26} rx={7} className="fill-card stroke-stone" strokeWidth={2} />
                <Pip x={-5} y={-5} r={2.1} />
                <Pip x={5} y={5} r={2.1} />
              </g>
            </g>

            {/* player tokens racing round the board */}
            <g transform="translate(388 404)">
              <g className="animate-hop">
                <Pawn body="fill-sage" head="fill-[#74826C]" />
              </g>
            </g>
            <g transform="translate(548 372)">
              <Pawn body="fill-terracotta" head="fill-[#A5624F]" />
            </g>

            {/* little sparks of play rising off the board */}
            <Spark x={434} y={366} delay={0} className="fill-sage" />
            <Spark x={456} y={360} delay={520} className="fill-blush" />
            <Spark x={476} y={368} delay={1040} className="fill-terracotta/70" />

            {/* front couples — nearest the viewer, at the table's near edge */}
            <Couple cx={300} y={488} s={1.06} body="fill-blush" head="fill-[#CBA594]" heartDelay={450} />
            <Couple cx={600} y={488} s={1.06} body="fill-[#6E7A6B]" head="fill-[#57614F]" heartDelay={1350} />

            {/* chat bubbles drifting up — the banter around the table */}
            <ChatFloat x={248} y={362} s={0.95} delay={200} dot="fill-sage" />
            <ChatFloat x={652} y={344} s={0.95} delay={760} dot="fill-terracotta" />
          </svg>
        </div>

        <p
          className="rise mx-auto mt-5 max-w-md text-center font-serif text-base italic text-forest/55 md:text-lg"
          style={rd(160)}
        >
          Four matches, one table. Everything to play for.
        </p>
      </div>
    </Reveal>
  );
}

/** Two partners sharing a colour (that's the match), with a spark rising between them. */
function Couple({
  cx,
  y,
  s,
  body,
  head,
  heartDelay,
}: {
  cx: number;
  y: number;
  s: number;
  body: string;
  head: string;
  heartDelay: number;
}) {
  const off = 34 * s;
  return (
    <g>
      <Person x={cx - off} y={y} s={s} body={body} head={head} />
      <Person x={cx + off} y={y} s={s} body={body} head={head} />
      <g transform={`translate(${cx} ${y - 48 * s})`}>
        <g transform={`scale(${0.85 * s})`}>
          <path
            d={HEART}
            className="fill-terracotta animate-float-particle"
            style={{ ...spin, animationDelay: `${heartDelay}ms` }}
          />
        </g>
      </g>
    </g>
  );
}

/** A single seated figure — rounded shoulders behind a round head. */
function Person({ x, y, s, body, head }: { x: number; y: number; s: number; body: string; head: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-30 * s} y={4 * s} width={60 * s} height={72 * s} rx={26 * s} className={body} />
      <circle cx={0} cy={-2 * s} r={19 * s} className={head} />
    </g>
  );
}

/** A classic board-game token — a little bell-shaped pawn with a head. */
function Pawn({ body, head }: { body: string; head: string }) {
  return (
    <g>
      <path d="M -9 16 C -9 4 -6 0 0 0 C 6 0 9 4 9 16 Z" className={body} />
      <circle cx={0} cy={-5} r={6} className={head} />
    </g>
  );
}

function Pip({ x, y, r = 2.4 }: { x: number; y: number; r?: number }) {
  return <circle cx={x} cy={y} r={r} className="fill-forest" />;
}

/** A spark rising and fading, like the buzz over a good game. */
function Spark({ x, y, delay, className }: { x: number; y: number; delay: number; className: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={3} className={`${className} animate-float-particle`} style={{ ...spin, animationDelay: `${delay}ms` }} />
    </g>
  );
}

/** The live host — a headset-wearing figure presiding at the head of the table. */
function Host() {
  const x = 450;
  const y = 206;
  const s = 0.94;
  const hy = y - 2 * s; // head centre
  const hr = 19 * s; // head radius
  return (
    <g>
      <rect x={x - 30 * s} y={y + 4 * s} width={60 * s} height={80 * s} rx={26 * s} className="fill-forest" />
      <circle cx={x} cy={hy} r={hr} className="fill-[#3B4A3F]" />
      {/* headset band over the crown */}
      <path
        d={`M ${x - hr - 1} ${hy} A ${hr + 1} ${hr + 1} 0 0 0 ${x + hr + 1} ${hy}`}
        className="stroke-clay"
        strokeWidth={3.5}
        strokeLinecap="round"
        fill="none"
      />
      {/* mic boom curving to the mouth */}
      <path
        d={`M ${x + hr} ${hy} Q ${x + hr + 6} ${hy + 12} ${x + 6} ${hy + 12}`}
        className="stroke-clay"
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />
      <circle cx={x + 6} cy={hy + 12} r={2.6} className="fill-terracotta" />
      {/* the host, hosting */}
      <ChatFloat x={x + 46} y={hy - 22} s={0.9} delay={320} dot="fill-sage" />
    </g>
  );
}

/** A speech bubble with a typing indicator, drifting up and fading (float-particle). */
function ChatBubble({ dot, delay }: { dot: string; delay: number }) {
  return (
    <g className="animate-float-particle" style={{ ...spin, animationDelay: `${delay}ms` }}>
      <path d="M -6 8 L -10 15 L 1 9 Z" className="fill-card" />
      <rect x={-13} y={-10} width={26} height={19} rx={8} className="fill-card stroke-sage/35" strokeWidth={1.5} />
      <circle cx={-6} cy={-0.5} r={1.7} className={dot} />
      <circle cx={0} cy={-0.5} r={1.7} className={dot} />
      <circle cx={6} cy={-0.5} r={1.7} className={dot} />
    </g>
  );
}

/** Positions + scales a chat bubble so its float animation stays centred. */
function ChatFloat({
  x,
  y,
  s = 1,
  delay,
  dot = "fill-sage",
}: {
  x: number;
  y: number;
  s?: number;
  delay: number;
  dot?: string;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g transform={`scale(${s})`}>
        <ChatBubble dot={dot} delay={delay} />
      </g>
    </g>
  );
}

/** The ring of spaces around the board — one square is "live" and pulses. */
function BoardTrack() {
  const dots = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2 - Math.PI / 2;
    return {
      cx: 450 + 140 * Math.cos(a),
      cy: 388 + 44 * Math.sin(a),
      active: i === 4,
      tone: i % 3 === 0 ? "fill-sage/60" : i % 3 === 1 ? "fill-clay" : "fill-terracotta/40",
    };
  });
  return (
    <g>
      {dots.map((d, i) =>
        d.active ? (
          <circle key={i} cx={d.cx} cy={d.cy} r={5.5} className="fill-terracotta animate-pulse-soft" style={spin} />
        ) : (
          <circle key={i} cx={d.cx} cy={d.cy} r={5} className={d.tone} />
        )
      )}
    </g>
  );
}
