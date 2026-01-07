import { Filter } from "bad-words";
import Head from "next/head";
import Image from "next/image";
import { useEffect, useState } from "react";
import DarkModeToggle from "../components/dark-mode-toggle";
import styles from "../styles/Home.module.css";
import Link from "next/link";

const filter = new Filter();

const randomInitialInputValues = [
  "coding",
  "gaming",
  "music",
  "actual work",
  "cleanup",
  "coding",
  "coding",
  "coding",
  "coding",
  "coding",
];

export default function Home() {
  const [darkMode, setDarkMode] = useState(true);
  const [inputValue, setInputValue] = useState(
    randomInitialInputValues[
      Math.floor(Math.random() * randomInitialInputValues.length)
    ]
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDarkMode = localStorage.getItem("darkMode") === "true";
      setDarkMode(isDarkMode);
    }
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`${styles.container} ${darkMode ? "dark" : ""}`}>
      <Head>
        <title>Joe Powers | Full-Stack Developer</title>
        <meta
          name="description"
          content="Joe Powers is a full-stack developer specializing in React, Node.js, and modern web technologies. View projects, resume, and more."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/confused-emote-no-bkgd.png" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://joepowers.dev/" />
        <meta property="og:title" content="Joe Powers | Full-Stack Developer" />
        <meta
          property="og:description"
          content="Joe Powers is a full-stack developer specializing in React, Node.js, and modern web technologies. View projects, resume, and more."
        />
        <meta
          property="og:image"
          content="https://joepowers.dev/confused-emote-no-bkgd.png"
        />

        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta
          name="twitter:title"
          content="Joe Powers | Full-Stack Developer"
        />
        <meta
          name="twitter:description"
          content="Joe Powers is a full-stack developer specializing in React, Node.js, and modern web technologies."
        />
        <meta
          name="twitter:image"
          content="https://joepowers.dev/confused-emote-no-bkgd.png"
        />
      </Head>
      <main>
        <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <h1 className={styles.title}>
          Welcome to <Link href="/">here.</Link>
        </h1>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <p className={styles.description}>
            I&apos;m Joe Powers, a full-stack developer. This is me:
          </p>
          <Image
            src="/confused-emote-no-bkgd.png"
            alt="my confused face"
            onClick={() => {
              alert("ouch, that's my face!");
            }}
            width={50}
            height={50}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "20px",
            marginBottom: "40px",
          }}
        >
          <a
            href="/resume"
            className={styles.card}
            target="_blank"
            rel="noopener noreferrer"
            style={{ width: "100%" }}
          >
            <h3>Resume</h3>
            <p>For the professional types.</p>
          </a>
          <a href="/games" className={styles.card} style={{ width: "100%" }}>
            <h3>Games</h3>
            <p>For the fun types.</p>
          </a>
        </div>
        <p className={styles.description}>
          One day I&apos;m gonna do some{" "}
          <code style={{ color: "black" }}>
            <input
              type="text"
              value={inputValue}
              style={{
                backgroundColor: "transparent",
                border: "none",
                color: "inherit",
              }}
              onChange={e => {
                const cleanValue = filter.clean(e.target.value);
                if (cleanValue.includes("*")) {
                  alert("No bad words allowed!");
                }
                setInputValue(filter.clean(e.target.value));
              }}
            />
          </code>{" "}
          with this site.
        </p>
        <br />
        <p className={styles.description}>For now, here are some projects:</p>
        <div className={styles.grid}>
          <a
            href="https://steamboilerroom.com/"
            className={styles.card}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h3>The Boiler Room</h3>
            <p>A collection of steam utilities.</p>
            <br />
            <p>
              For gamers. By gamer. <br />
              ...it&apos;s me, I&apos;m the gamer.
            </p>
          </a>
          <a
            href="https://branch-out-gvl.herokuapp.com/"
            className={styles.card}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h3>branch.out</h3>
            <p>A site for connecting your music taste, to a music place.</p>
            <br />
            <p>Which is very based.</p>
          </a>
          <a
            href="https://whoisbetter.me"
            className={styles.card}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h3>Whoisbetter.me</h3>
            <p>Used for comparing two things, and deciding which is better.</p>
            <br />
            <p>
              As long as those two things are entrants in start.gg tournaments.
            </p>
          </a>
          <a
            href="https://main.d3oydlksdz52ep.amplifyapp.com/stats"
            className={styles.card}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h3>Slippi Stats</h3>
            <p>
              A half-baked project based on parsing online melee slippi replay
              files.
            </p>
            <br />
            <p>Niche like a quiche.</p>
          </a>
        </div>

        <p className={styles.description}>Non-coding things:</p>
        <div className={styles.grid}>
          <iframe
            src="https://www.youtube.com/embed/o2droJZTYYw?si=l2rr9O9dkhMo0tUb"
            style={{
              width: "90%",
              height: "352px",
              border: "0",
              margin: "10px",
              borderRadius: "10px",
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
          <iframe
            style={{
              width: "90%",
              height: "352px",
              border: "0",
              margin: "10px",
            }}
            src="https://open.spotify.com/embed/artist/4m3Bhxg7otGtBF7xsfTQTV?utm_source=generator"
            loading="lazy"
          />
        </div>
      </main>
      <footer className={styles.footer}>
        Made by Joe Powers{" "}
        <a
          href="https://github.com/ReadySetJoe"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.footerIcon}
        >
          <svg viewBox="0 0 24 24" width="25" height="25">
            <path
              fill="currentColor"
              d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
            />
          </svg>
        </a>
        <a
          href="https://www.twitch.tv/joepowers"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.footerIcon}
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="currentColor"
              d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"
            />
          </svg>
        </a>
        <a
          href="https://www.linkedin.com/in/joe-powers/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.footerIcon}
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="currentColor"
              d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
            />
          </svg>
        </a>
        <a
          href="mailto:joe.powers92@gmail.com"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.footerIcon}
        >
          <svg viewBox="0 0 24 24" width="30" height="30">
            <path
              fill="currentColor"
              d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
            />
          </svg>
        </a>
      </footer>
    </div>
  );
}
