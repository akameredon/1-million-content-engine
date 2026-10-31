import { useEffect, useMemo, useState } from 'react';
import { assessPosts, creatorFrameworks, generatePosts, toCsv } from './contentEngine.js';

const STORAGE_KEY = 'million-content-engine-v1';
const initial = { topic: 'building a profitable business', idea: 'consistent execution and customer feedback', audience: 'global creators and business owners', category: 'Marketing', count: 20 };

export default function App() {
  const [form, setForm] = useState(initial);
  const [posts, setPosts] = useState([]);
  const [notice, setNotice] = useState('Your drafts stay in this browser until you export them.');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(saved)) setPosts(saved);
    } catch { /* Ignore invalid local browser data. */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(posts)); }
    catch { setNotice('Browser storage is full. Export your drafts to keep a copy.'); }
  }, [posts]);

  const readyCount = posts.filter((p) => p.quality === 'ready').length;
  const visiblePosts = useMemo(() => filter === 'all' ? posts : posts.filter((p) => p.quality === filter), [posts, filter]);

  function update(field, value) { setForm((current) => ({ ...current, [field]: value })); }
  function generate(event) {
    event.preventDefault();
    try {
      const batch = assessPosts(generatePosts(form));
      setPosts((current) => [...batch, ...current].slice(0, 10000));
      setNotice(`Generated ${batch.length.toLocaleString()} drafts. Review before publishing.`);
    } catch (error) { setNotice(error.message); }
  }
  function exportCsv() {
    const blob = new Blob([toCsv(posts)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'million-content-drafts.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }
  function copyPost(text) {
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(() => setNotice('Post copied.')).catch(() => setNotice('Copy was blocked by this browser.'));
    else setNotice('Clipboard is not available in this browser.');
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home"><span className="brand-icon">1M</span><span>CONTENT ENGINE</span></a>
        <span className="local-pill"><i /> Local-first workspace</span>
      </header>
      <section className="hero" id="home">
        <p className="eyebrow">RESEARCH THE MECHANICS · CREATE ORIGINAL IDEAS</p>
        <h1>One idea.<br /><em>Thousands of angles.</em></h1>
        <p className="hero-copy">Build a repeatable content system for finance and marketing. Combine proven communication frameworks into fresh drafts, check quality, and keep your publishing decisions in your hands.</p>
        <div className="hero-stats"><div><strong>5</strong><span>starter frameworks</span></div><div><strong>5,000</strong><span>drafts per batch max</span></div><div><strong>0</strong><span>paid APIs required</span></div></div>
      </section>

      <section className="workspace">
        <form className="generator panel" onSubmit={generate}>
          <div className="panel-heading"><div><p className="eyebrow">01 / GENERATOR</p><h2>Give the engine a direction</h2></div><span className="step-tag">INPUT → OUTPUT</span></div>
          <label>Content category<select value={form.category} onChange={(e) => update('category', e.target.value)}><option>Marketing</option><option>Finance</option><option>Business</option><option>Entrepreneurship</option></select></label>
          <label>Topic<input value={form.topic} onChange={(e) => update('topic', e.target.value)} placeholder="e.g. personal finance for beginners" required /></label>
          <label>Core lesson or idea<textarea value={form.idea} onChange={(e) => update('idea', e.target.value)} rows="3" placeholder="What should the audience learn?" required /></label>
          <label>Who is this for?<input value={form.audience} onChange={(e) => update('audience', e.target.value)} placeholder="e.g. first-time founders" /></label>
          <div className="batch-row"><label>Drafts in this batch<input type="number" min="1" max="5000" value={form.count} onChange={(e) => update('count', e.target.value)} /></label><span>Maximum 5,000 per run</span></div>
          <button className="primary-button" type="submit">Generate original drafts <span>↗</span></button>
          <p className="fine-print">This first release uses a transparent, local pattern engine—not live creator scraping or an external AI model.</p>
        </form>

        <aside className="frameworks panel">
          <p className="eyebrow">02 / CONTENT INTELLIGENCE</p><h2>Communication frameworks</h2>
          <p className="muted">Starter structures based on broad teaching and persuasion techniques. They are not copies of any creator's wording or personal voice.</p>
          {creatorFrameworks.map((item, index) => <article className="framework" key={item.name}><span className="framework-number">0{index + 1}</span><div><h3>{item.name}</h3><p>{item.mechanics.join(' · ')}</p></div></article>)}
          <div className="framework-note">Next stage: add researched, sourced creator observations with links, dates, and human review.</div>
        </aside>
      </section>

      <section className="results panel">
        <div className="results-heading"><div><p className="eyebrow">03 / DRAFT LIBRARY</p><h2>Your content inventory</h2><p className="muted" aria-live="polite">{notice}</p></div><button className="secondary-button" onClick={exportCsv} disabled={!posts.length}>Export CSV ↓</button></div>
        <div className="metrics"><div><strong>{posts.length.toLocaleString()}</strong><span>Total drafts</span></div><div><strong>{readyCount.toLocaleString()}</strong><span>Passed basic checks</span></div><div><strong>{(posts.length-readyCount).toLocaleString()}</strong><span>Need review</span></div></div>
        <div className="filter-row"><div className="filter-tabs" aria-label="Filter drafts"><button type="button" className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>All</button><button type="button" className={filter==='ready'?'active':''} onClick={()=>setFilter('ready')}>Ready</button><button type="button" className={filter==='review'?'active':''} onClick={()=>setFilter('review')}>Review</button></div><button className="text-button" type="button" onClick={()=>{setPosts([]);setNotice('Draft library cleared from this browser.');}}>Clear drafts</button></div>
        {!visiblePosts.length ? <div className="empty-state"><span>✳</span><h3>No drafts yet</h3><p>Enter a topic and core idea above to generate your first batch.</p></div> : <div className="post-list">{visiblePosts.slice(0,100).map((post) => <article className="post-card" key={post.id + post.text}><div className="post-meta"><span>{post.category}</span><span>{post.framework}</span><span className={post.quality==='ready'?'quality-ready':'quality-review'}>{post.quality==='ready'?'Basic checks passed':'Review needed'}</span></div><p>{post.text}</p>{post.issues?.length>0 && <small>{post.issues.join(' · ')}</small>}<div className="post-actions"><button type="button" onClick={()=>copyPost(post.text)}>Copy post</button></div></article>)}</div>}
        {visiblePosts.length>100 && <p className="muted">Showing first 100 drafts. Export CSV for the full inventory.</p>}
      </section>

      <section className="roadmap"><p className="eyebrow">THE LONG GAME</p><h2>Generate at scale. Publish with judgment.</h2><div className="roadmap-grid"><div><b>Now</b><h3>Pattern + batch engine</h3><p>Original template-based drafts, local storage, basic checks, CSV export.</p></div><div><b>Next</b><h3>Research + AI providers</h3><p>Source-backed creator research, optional model adapters, stronger originality and factual review.</p></div><div><b>Later</b><h3>Approved publishing</h3><p>Official platform integrations, per-platform limits, scheduling, analytics, and human approval.</p></div></div></section>
      <footer><span>1 Million Content Engine</span><span>Free-first · Original drafts · Human-reviewed publishing</span></footer>
    </main>
  );
}
