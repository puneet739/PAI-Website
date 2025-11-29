import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => [
  { title: "PAI – Paragliding Association of India" },
];

export default function Index() {
  const year = new Date().getFullYear();
  return (
    <main id="content">
      <header className="site-header">
        <div className="container header-inner">
          <a href="#content" className="brand" aria-label="PAI Home">
            <span className="brand-mark" aria-hidden>
              <svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="24" r="24" fill="url(#g)"/>
                <path d="M39 18c-4-4.5-9.9-7-15-7s-11 2.5-15 7c3.1 2 6.8 3 10.5 3.2 1.3-1.7 2.7-2.8 4.5-2.8 1.8 0 3.2 1.1 4.5 2.8 3.7-.2 7.4-1.2 10.5-3.2Z" fill="#fff"/>
                <defs>
                  <linearGradient id="g" x1="6" y1="42" x2="42" y2="6" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#0ea5e9"/>
                    <stop offset="1" stopColor="#f97316"/>
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <span className="brand-text">PAI</span>
          </a>
          <nav className="nav">
            <a href="#about">About</a>
            <a href="#sites">Flying Sites</a>
            <a href="#training">Training</a>
            <a href="#safety">Safety</a>
            <a href="#events">Events</a>
            <a href="#membership">Membership</a>
            <a href="#contact">Contact</a>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="container">
          <h1>
            Paragliding Association of India
          </h1>
          <p className="lead">
            Advancing the sport of paragliding across India with safety, training, and community.
          </p>
          <div className="cta">
            <a className="btn primary" href="#membership">Join PAI</a>
            <a className="btn ghost" href="#training">Find Training</a>
          </div>
        </div>
        <div className="hero-bg" aria-hidden />
      </section>

      <section id="about" className="section">
        <div className="container two-col">
          <div>
            <h2>About PAI</h2>
            <p>
              PAI is the national body working to promote paragliding in India. We support pilots and schools,
              advocate for responsible flying, and organize training, safety initiatives, and community events.
            </p>
            <ul className="checklist">
              <li>Standards for training and instruction</li>
              <li>Safety guidelines and incident reporting</li>
              <li>Community events and competitions</li>
              <li>Recognition for pilots and schools</li>
            </ul>
          </div>
          <div className="card">
            <h3>Quick Links</h3>
            <ul className="links">
              <li><a href="#membership">Become a member</a></li>
              <li><a href="#training">Accredited schools</a></li>
              <li><a href="#safety">Safety resources</a></li>
              <li><a href="#events">Upcoming events</a></li>
            </ul>
          </div>
        </div>
      </section>

      <section id="sites" className="section alt">
        <div className="container">
          <h2>Popular Flying Sites</h2>
          <div className="grid cards">
            <article className="card">
              <h3>Bir Billing, Himachal</h3>
              <p>The Himalayan mecca for XC and soaring, with world-class conditions.</p>
            </article>
            <article className="card">
              <h3>Kamshet, Maharashtra</h3>
              <p>Training-friendly ridges with reliable winds near Pune and Mumbai.</p>
            </article>
            <article className="card">
              <h3>Nandi Hills, Karnataka</h3>
              <p>Scenic morning flights and ridge soaring near Bengaluru.</p>
            </article>
            <article className="card">
              <h3>Yelagiri, Tamil Nadu</h3>
              <p>Beginner-friendly conditions and a vibrant local community.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="training" className="section">
        <div className="container two-col">
          <div>
            <h2>Training & Certification</h2>
            <p>
              Learn with accredited schools following standardized syllabi. Progress from ground handling to soaring,
              thermalling, and cross-country under experienced instructors.
            </p>
            <div className="badges">
              <span className="badge">Beginner (P1/P2)</span>
              <span className="badge">Intermediate (P3/P4)</span>
              <span className="badge">Advanced (XC/Tandem)</span>
            </div>
          </div>
          <div className="card">
            <h3>How to start</h3>
            <ol>
              <li>Choose an accredited school</li>
              <li>Finish ground school & supervised flights</li>
              <li>Log airtime and progress ratings</li>
              <li>Fly responsibly with a mentor</li>
            </ol>
          </div>
        </div>
      </section>

      <section id="safety" className="section alt">
        <div className="container">
          <h2>Safety First</h2>
          <div className="grid two">
            <div>
              <ul className="checklist">
                <li>Understand weather and micro-meteorology</li>
                <li>Pre-flight checks: wing, lines, harness, reserve</li>
                <li>Radio communication and site briefings</li>
                <li>Progress gradually; avoid flying alone</li>
              </ul>
            </div>
            <div className="callout">
              <strong>Emergency?</strong>
              <p>Contact local authorities and your instructor. File an incident report to help the community learn.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="events" className="section">
        <div className="container">
          <h2>Events & Competitions</h2>
          <p>
            From friendly accuracy meets to XC festivals and national championships, there’s something for every pilot.
          </p>
          <div className="notice">Event calendar coming soon.</div>
        </div>
      </section>

      <section id="membership" className="section alt">
        <div className="container two-col">
          <div>
            <h2>Membership</h2>
            <p>
              Become a PAI member to support safe growth of the sport, get updates, and participate in programs.
            </p>
            <ul className="checklist">
              <li>Community representation</li>
              <li>Safety and training resources</li>
              <li>Newsletter and updates</li>
            </ul>
          </div>
          <div className="card">
            <h3>Join now</h3>
            <p>Membership portal coming soon. Meanwhile, write to us:</p>
            <p><a className="btn primary block" href="mailto:info@pai.org.in">info@pai.org.in</a></p>
          </div>
        </div>
      </section>

      <section id="contact" className="section">
        <div className="container">
          <h2>Contact</h2>
          <p>Have a question? Reach out anytime.</p>
          <div className="contact">
            <a className="btn ghost" href="mailto:info@pai.org.in">Email PAI</a>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container">
          <p>© {year} Paragliding Association of India (PAI). All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
