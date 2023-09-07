import Head from "next/head";

import styles from "../styles/Home.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>joepowers.dev</title>
        <link rel="icon" href="/confused-emote-no-bkgd.png" />
      </Head>

      <main>
        <h1 className={styles.title}>
          Welcome to <a href="/">here.</a>
          <img
            src="/confused-emote-no-bkgd.png"
            alt="my confused face"
            width="80"
            height="80"
          />
        </h1>
        <p className={styles.description}>
          One day I'm gonna do some <code>coding</code> here
        </p>
        <br />
        <p className={styles.description}>For now, here are some projects:</p>
        <div className={styles.grid}>
          <a
            href="https://branch-out-gvl.herokuapp.com/"
            className={styles.card}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h3>branch.out</h3>
            <p>A site for connecting you music taste, to a music place.</p>
            <br />
            <p> Which is very based.</p>
          </a>
          <a
            href="https://main.d3oydlksdz52ep.amplifyapp.com/stats"
            className={styles.card}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h3>Slippi Stats</h3>
            <p>
              A half-baked project based on parsing online melee replay files.
            </p>
            <br />
            <p>Niche like a quiche.</p>
          </a>
        </div>

        <p className={styles.description}>Non-coding things:</p>
        <div className={styles.grid}>
          <iframe
            src="https://www.youtube.com/embed/o2droJZTYYw?si=l2rr9O9dkhMo0tUb"
            frameborder="0"
            style={{
              width: "90%",
              height: "352px",
              border: "0",
              margin: "10px",
              borderRadius: "10px",
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
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
      <footer>
        Made by Joe Powers{" "}
        <a
          href="https://github.com/ReadySetJoe"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
            alt="my github"
            width="25"
            height="25"
          />
        </a>
        <a
          href="https://www.twitch.tv/joepowers"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="https://cdns.iconmonstr.com/wp-content/releases/preview/2016/240/iconmonstr-twitch-1.png"
            alt="my twitch"
            width="20"
            height="20"
          />
        </a>
        <a
          href="https://www.linkedin.com/in/joe-powers/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="https://cdns.iconmonstr.com/wp-content/releases/preview/2012/240/iconmonstr-linkedin-3.png"
            alt="my linkedin"
            width="20"
            height="20"
          />
        </a>
        <a
          href="mailto:joe.powers92@gmail.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="https://static.vecteezy.com/system/resources/thumbnails/002/205/854/small/email-icon-free-vector.jpg"
            alt="my email"
            width="30"
            height="30"
          />
        </a>
      </footer>
    </div>
  );
}
