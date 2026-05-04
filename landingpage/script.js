/* ═══════════════════════════════════════════════════════
   VaagBanda — style.css
   ═══════════════════════════════════════════════════════ */

/* ── CSS VARIABLES ── */
:root {
  --crimson:       #dc143c;
  --crimson-dark:  #a00e2b;
  --crimson-light: #ff4d6d;
  --blue:          #1a3a6b;
  --blue-mid:      #1e4fa0;
  --blue-light:    #3b82f6;
  --ink:           #08101f;
  --paper:         #f4f6fb;
  --white:         #ffffff;
  --muted:         #8a96b0;
}

/* ── RESET ── */
* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }

body {
  background: var(--ink);
  color: var(--white);
  font-family: 'DM Sans', sans-serif;
  overflow-x: hidden;
}

/* ══════════════════════════════════════
   NAV
══════════════════════════════════════ */
nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 60px;
  background: rgba(8,16,31,0.92);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(220,20,60,0.2);
  animation: fadeDown 0.7s ease both;
}

.nav-logo {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.9rem;
  letter-spacing: 4px;
  background: linear-gradient(135deg, var(--crimson), var(--blue-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-decoration: none;
}

.nav-links { display: flex; gap: 32px; list-style: none; }

.nav-links a {
  color: var(--muted);
  text-decoration: none;
  font-size: 0.82rem;
  font-weight: 500;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  transition: color 0.3s;
}

.nav-links a:hover { color: var(--crimson-light); }

.nav-cta {
  background: linear-gradient(135deg, var(--crimson), var(--crimson-dark)) !important;
  color: white !important;
  padding: 10px 26px;
  border-radius: 4px;
  font-weight: 600 !important;
  transition: opacity 0.3s, transform 0.2s !important;
  -webkit-text-fill-color: white !important;
}

.nav-cta:hover { opacity: 0.9 !important; transform: translateY(-1px); }

/* ══════════════════════════════════════
   HERO
══════════════════════════════════════ */
.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  position: relative;
  padding: 130px 60px 90px;
  overflow: hidden;
}

.hero-bg {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse 60% 60% at 80% 40%, rgba(30,79,160,0.18) 0%, transparent 70%),
    radial-gradient(ellipse 40% 50% at 20% 70%, rgba(220,20,60,0.12) 0%, transparent 70%);
  pointer-events: none;
}

.hero-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px);
  background-size: 56px 56px;
  pointer-events: none;
}

.hero-content { max-width: 660px; position: relative; z-index: 2; }

.hero-badge {
  display: inline-flex; align-items: center; gap: 8px;
  border: 1px solid rgba(220,20,60,0.4);
  border-radius: 40px; padding: 6px 18px;
  font-size: 0.72rem; color: var(--crimson-light);
  letter-spacing: 2px; text-transform: uppercase;
  margin-bottom: 28px;
  animation: fadeUp 0.7s 0.2s ease both;
}

.hero-badge span {
  width: 6px; height: 6px;
  background: var(--crimson); border-radius: 50%;
  animation: pulse 2s infinite;
}

.hero-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(3.8rem, 8.5vw, 7.2rem);
  line-height: 0.93; letter-spacing: 2px;
  animation: fadeUp 0.7s 0.35s ease both;
}

.hero-title .c { color: var(--crimson); }
.hero-title .b { color: var(--blue-light); }

.hero-sub {
  font-size: 1.05rem; color: var(--muted);
  line-height: 1.75; margin: 28px 0 44px;
  max-width: 490px; font-weight: 300;
  animation: fadeUp 0.7s 0.5s ease both;
}

.hero-sub strong { color: var(--white); font-weight: 500; }

.hero-actions {
  display: flex; gap: 14px; flex-wrap: wrap;
  animation: fadeUp 0.7s 0.65s ease both;
}

.btn-crimson {
  background: linear-gradient(135deg, var(--crimson), var(--crimson-dark));
  color: white; padding: 14px 38px; border-radius: 4px;
  font-weight: 600; font-size: 0.9rem; text-decoration: none;
  transition: opacity 0.3s, transform 0.2s, box-shadow 0.3s;
}

.btn-crimson:hover {
  opacity: 0.9; transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(220,20,60,0.35);
}

.btn-blue {
  background: linear-gradient(135deg, var(--blue-mid), var(--blue));
  color: white; padding: 14px 38px; border-radius: 4px;
  font-size: 0.9rem; text-decoration: none;
  transition: opacity 0.3s, transform 0.2s;
}

.btn-blue:hover { opacity: 0.85; transform: translateY(-2px); }

.hero-stats {
  position: absolute; right: 60px; top: 50%;
  transform: translateY(-50%);
  display: flex; flex-direction: column; gap: 16px;
  z-index: 2;
  animation: fadeLeft 0.8s 0.8s ease both;
}

.stat-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(59,130,246,0.18);
  border-radius: 12px; padding: 18px 26px;
  text-align: center; backdrop-filter: blur(8px);
  transition: border-color 0.3s, transform 0.3s;
}

.stat-card:hover { border-color: rgba(220,20,60,0.5); transform: translateX(-4px); }

.stat-num {
  font-family: 'Bebas Neue', sans-serif; font-size: 2.2rem;
  background: linear-gradient(135deg, var(--crimson-light), var(--blue-light));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  letter-spacing: 2px;
}

.stat-label {
  font-size: 0.7rem; color: var(--muted);
  text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px;
}

/* ══════════════════════════════════════
   SHARED SECTION STYLES
══════════════════════════════════════ */
.section-eyebrow {
  font-size: 0.72rem; letter-spacing: 3px;
  text-transform: uppercase; color: var(--crimson);
  font-weight: 600; margin-bottom: 10px;
}

.section-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(2.4rem, 4.5vw, 3.8rem);
  letter-spacing: 1px; color: var(--ink);
  margin-bottom: 14px; line-height: 1;
}

.section-desc {
  color: #666; font-size: 0.95rem; max-width: 460px;
  line-height: 1.75; margin-bottom: 56px; font-weight: 300;
}

/* ══════════════════════════════════════
   FEATURES
══════════════════════════════════════ */
.features { padding: 100px 60px; background: var(--paper); color: var(--ink); }

.features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; }

.feature-card {
  background: white; padding: 38px 32px;
  position: relative; overflow: hidden;
  transition: background 0.35s; cursor: default;
}

.feature-card::after {
  content: ''; position: absolute;
  bottom: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, var(--crimson), var(--blue-light));
  transform: scaleX(0); transform-origin: left;
  transition: transform 0.35s;
}

.feature-card:hover                { background: var(--ink); }
.feature-card:hover::after         { transform: scaleX(1); }
.feature-card:hover .feature-title { color: var(--crimson-light); }
.feature-card:hover .feature-desc  { color: #888; }
.feature-card:hover .feat-num      { color: rgba(220,20,60,0.08); }

.feat-num {
  font-family: 'Bebas Neue', sans-serif; font-size: 4.5rem;
  color: rgba(0,0,0,0.05); position: absolute;
  top: 10px; right: 16px; line-height: 1; transition: color 0.35s;
}

.feature-icon {
  width: 46px; height: 46px;
  background: linear-gradient(135deg, rgba(220,20,60,0.1), rgba(30,79,160,0.1));
  border-radius: 10px; display: flex; align-items: center;
  justify-content: center; font-size: 1.25rem; margin-bottom: 22px;
}

.feature-title {
  font-family: 'Bebas Neue', sans-serif; font-size: 1.45rem;
  letter-spacing: 1px; color: var(--ink);
  margin-bottom: 10px; transition: color 0.35s;
}

.feature-desc {
  font-size: 0.86rem; color: #777;
  line-height: 1.65; font-weight: 300; transition: color 0.35s;
}

/* ══════════════════════════════════════
   HOW IT WORKS
══════════════════════════════════════ */
.how { padding: 100px 60px; background: var(--blue); }
.how .section-title    { color: var(--white); }
.how .section-eyebrow  { color: var(--crimson-light); }

.steps {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 0; margin-top: 60px; position: relative;
}
/* Line 287 in style.css */
.team-grid {
  display: grid; 
  grid-template-columns: repeat(4, 1fr); /* 4 columns = Horizontal */
  gap: 24px; 
  margin-top: 56px;
}

.steps::before {
  content: ''; position: absolute;
  top: 32px; left: 12.5%; width: 75%; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(220,20,60,0.5), rgba(59,130,246,0.5), transparent);
}

.step { padding: 0 20px; text-align: center; }

.step-circle {
  width: 64px; height: 64px; border-radius: 50%;
  background: rgba(220,20,60,0.12);
  border: 1px solid rgba(220,20,60,0.35);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 22px;
  font-family: 'Bebas Neue', sans-serif; font-size: 1.5rem;
  color: var(--crimson-light); position: relative; z-index: 1;
  transition: background 0.3s, border-color 0.3s;
}

.step:hover .step-circle {
  background: rgba(220,20,60,0.25);
  border-color: var(--crimson);
}

.step-title {
  font-family: 'Bebas Neue', sans-serif; font-size: 1.2rem;
  letter-spacing: 1px; color: var(--white); margin-bottom: 10px;
}

.step-desc {
  font-size: 0.82rem; color: rgba(255,255,255,0.55);
  line-height: 1.65; font-weight: 300;
}

/* ══════════════════════════════════════
   TEAM
══════════════════════════════════════ */
.team { padding: 100px 60px; background: var(--ink); }
.team .section-title { color: var(--white); }

.team-grid {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 24px; margin-top: 56px;
}

.team-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(59,130,246,0.15);
  border-radius: 16px; overflow: hidden;
  transition: border-color 0.35s, transform 0.35s; cursor: default;
}

.team-card:hover {
  border-color: rgba(220,20,60,0.5);
  transform: translateY(-6px);
}

.team-photo {
  width: 100%; aspect-ratio: 1/1;
  background: linear-gradient(135deg, rgba(26,58,107,0.6), rgba(220,20,60,0.15));
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  position: relative; overflow: hidden;
}

/* To swap in a real photo, replace the .photo-placeholder div with:
   <img src="assets/name.jpg" alt="Member Name" />              */
.team-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }

.photo-placeholder {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 10px; width: 100%; height: 100%;
}

.photo-icon {
  width: 64px; height: 64px; border-radius: 50%;
  border: 2px dashed rgba(220,20,60,0.5);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.6rem; color: rgba(220,20,60,0.6);
}

.photo-hint {
  font-size: 0.72rem; color: rgba(255,255,255,0.3);
  letter-spacing: 1px; text-transform: uppercase;
}

.team-role-badge {
  position: absolute; top: 12px; right: 12px;
  background: linear-gradient(135deg, var(--crimson), var(--crimson-dark));
  color: white; font-size: 0.65rem; font-weight: 600;
  letter-spacing: 1px; text-transform: uppercase;
  padding: 4px 10px; border-radius: 20px;
}

.team-info { padding: 20px; }

.team-name {
  font-family: 'Bebas Neue', sans-serif; font-size: 1.25rem;
  letter-spacing: 1.5px; color: var(--white); margin-bottom: 4px;
}

.team-name-placeholder {
  font-family: 'Bebas Neue', sans-serif; font-size: 1.25rem;
  letter-spacing: 1.5px; color: rgba(255,255,255,0.25);
  margin-bottom: 4px; font-style: italic;
}

.team-role {
  font-size: 0.78rem; color: var(--blue-light);
  font-weight: 500; letter-spacing: 0.5px; margin-bottom: 12px;
}

.team-bio {
  font-size: 0.8rem; color: var(--muted);
  line-height: 1.6; font-weight: 300;
}

.team-divider {
  width: 32px; height: 2px;
  background: linear-gradient(90deg, var(--crimson), var(--blue-light));
  margin: 12px 0; border-radius: 2px;
}
/* Line 406 in style.css */
@media (max-width: 960px) {
  /* ... other styles ... */
  .team-grid { 
    grid-template-columns: 1fr; /* 1 column = Vertical stack */
  }
}
/* ══════════════════════════════════════
   CTA
══════════════════════════════════════ */
.cta-section {
  padding: 100px 60px;
  background: linear-gradient(135deg, var(--crimson-dark) 0%, var(--blue) 100%);
  text-align: center; position: relative; overflow: hidden;
}

.cta-section::before {
  content: 'VAAGBANDA'; position: absolute;
  font-family: 'Bebas Neue', sans-serif; font-size: 16vw;
  color: rgba(255,255,255,0.04); left: 50%; top: 50%;
  transform: translate(-50%,-50%); white-space: nowrap;
  pointer-events: none; letter-spacing: 8px;
}

.cta-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(2.4rem, 5vw, 4.2rem);
  color: white; letter-spacing: 2px;
  margin-bottom: 14px; position: relative;
}

.cta-sub {
  color: rgba(255,255,255,0.65); font-size: 1rem;
  margin-bottom: 40px; position: relative; font-weight: 300;
}

.btn-white {
  background: white; color: var(--crimson);
  padding: 16px 46px; border-radius: 4px;
  font-weight: 700; font-size: 0.95rem; letter-spacing: 0.5px;
  text-decoration: none; position: relative;
  transition: transform 0.2s, box-shadow 0.3s; display: inline-block;
}

.btn-white:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.3);
}

/* ══════════════════════════════════════
   FOOTER
══════════════════════════════════════ */
footer {
  background: #030810; padding: 36px 60px;
  display: flex; align-items: center; justify-content: space-between;
  border-top: 1px solid rgba(220,20,60,0.12);
}

.footer-logo {
  font-family: 'Bebas Neue', sans-serif; font-size: 1.5rem;
  background: linear-gradient(135deg, var(--crimson), var(--blue-light));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  letter-spacing: 3px;
}

.footer-note { font-size: 0.76rem; color: var(--muted); }
.footer-note span { color: var(--crimson-light); }

/* ══════════════════════════════════════
   ANIMATIONS
══════════════════════════════════════ */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fadeDown {
  from { opacity: 0; transform: translateY(-20px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fadeLeft {
  from { opacity: 0; transform: translate(28px, -50%); }
  to   { opacity: 1; transform: translate(0, -50%); }
}

@keyframes pulse {
  0%,100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.4; transform: scale(1.5); }
}

/* ══════════════════════════════════════
   RESPONSIVE
══════════════════════════════════════ */
@media (max-width: 960px) {
  nav                              { padding: 16px 24px; }
  .nav-links                       { display: none; }
  .hero                            { padding: 110px 24px 80px; }
  .hero-stats                      { display: none; }
  .features,
  .how,
  .team,
  .cta-section                     { padding: 60px 24px; }
  .features-grid                   { grid-template-columns: 1fr; }
  .steps                           { grid-template-columns: repeat(2,1fr); gap: 40px; }
  .steps::before                   { display: none; }
  .team-grid                       { grid-template-columns: repeat(2,1fr); }
  footer                           { flex-direction: column; gap: 10px; text-align: center; padding: 28px 24px; }
}
