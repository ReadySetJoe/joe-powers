import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import DarkModeToggle from "../components/dark-mode-toggle";
import styles from "../styles/Home.module.css";

export default function Games() {
  const [darkMode, setDarkMode] = useState(true);

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

  const games = [
    {
      title: "The Fourth Wall",
      description:
        "The ball lives inside your browser. Shake things up. (Desktop only)",
      href: "/games/window-ball",
    },
    {
      title: "Angry Ball",
      description:
        "Pull back. Let go. Hope for the best. Physics has opinions about your aim.",
      href: "/games/slingshot",
    },
    {
      title: "Tilt Time",
      description:
        "Gravity goes where you tell it. Mostly. The red ones bite.",
      href: "/games/tilt-maze",
    },
    {
      title: "Safety Net",
      description:
        "Draw some lines. Drop a ball. Pray. Fewer bounces = more bragging rights.",
      href: "/games/trampoline",
    },
    {
      title: "Finite Ink",
      description: "You have one pen. Make it count.",
      href: "/games/draw-path",
    },
    {
      title: "Hot Air",
      description: "Place fans. Pretend you meant to do that.",
      href: "/games/fan-zone",
    },
  ];

  return (
    <div className={`${styles.container} ${darkMode ? "dark" : ""}`}>
      <Head>
        <title>Games | Joe Powers</title>
        <meta
          name="description"
          content="A collection of web-based exercise games to test your reflexes, memory, and skills."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/confused-emote-no-bkgd.png" />
      </Head>
      <main>
        <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <h1 className={styles.title}>Games</h1>
        <p className={styles.description}>
          Just get the ball in the bucket. How hard could that be?
        </p>

        <div className={styles.grid} style={{ marginTop: "2rem" }}>
          {games.map((game, index) => (
            <Link key={index} href={game.href} className={styles.card}>
              <h3>{game.title} &rarr;</h3>
              <p>{game.description}</p>
            </Link>
          ))}
        </div>

        <Link href="/" className={styles.card} style={{ marginTop: "2rem" }}>
          <p>&larr; Back home</p>
        </Link>
      </main>
      <footer className={styles.footer}>Made by Joe Powers</footer>
    </div>
  );
}
