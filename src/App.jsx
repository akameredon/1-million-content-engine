import { useState } from 'react';

const steps = [
  { title: 'Start with the user', description: 'Name the person, the problem, and the outcome this app must deliver.' },
  { title: 'Ship the smallest useful version', description: 'Keep the first release focused on one end-to-end user journey.' },
  { title: 'Verify before release', description: 'Run checks, test on a phone-sized screen, and verify the deployed preview.' },
];

export default function App() {
  const [checked, setChecked] = useState([]);
  const completed = checked.length;
  function toggleStep(index) {
    setChecked((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
  }
  return (
    <main className="shell">
      <header className="topbar"><a className="brand" href="#home" aria-label="App home"><span className="brand-mark">APP</span><span>New App</span></a><span className="status"><span className="status-dot" /> Starter template</span></header>
      <section className="hero" id="home"><p className="eyebrow">BUILD · VERIFY · SHIP</p><h1>Turn a good idea into a <span>working product.</span></h1><p className="intro">A clean starting point for small, useful software. Keep the scope focused, test the real journey, and improve from evidence.</p><a className="primary-link" href="#checklist">Start the checklist <span aria-hidden="true">→</span></a></section>
      <section className="checklist" id="checklist" aria-labelledby="checklist-title"><div className="section-heading"><div><p className="eyebrow">YOUR FIRST RELEASE</p><h2 id="checklist-title">Build checklist</h2></div><div className="progress" aria-live="polite">{completed} of {steps.length}</div></div><div className="progress-track" role="progressbar" aria-label="Checklist progress" aria-valuemin="0" aria-valuemax={steps.length} aria-valuenow={completed}><span style={{ width: `${(completed / steps.length) * 100}%` }} /></div><div className="steps">{steps.map((step, index) => { const isChecked = checked.includes(index); return <label className={`step ${isChecked ? 'step-done' : ''}`} key={step.title}><input type="checkbox" checked={isChecked} onChange={() => toggleStep(index)} /><span className="step-copy"><strong>{step.title}</strong><span>{step.description}</span></span><span className="step-number">{isChecked ? '✓' : `0${index + 1}`}</span></label>; })}</div></section>
      <footer><span>Made to be adapted—not rebuilt from scratch.</span><span>Free-first · Mobile-ready</span></footer>
    </main>
  );
}
