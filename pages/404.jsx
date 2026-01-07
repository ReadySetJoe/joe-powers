import Head from "next/head";
import Link from "next/link";

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 - Page Not Found | joepowers.dev</title>
        <meta name="description" content="Page not found" />
        <link rel="icon" href="/confused-emote-no-bkgd.png" />
      </Head>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "4rem", marginBottom: "1rem" }}>404</h1>
        <p style={{ fontSize: "1.5rem", marginBottom: "2rem" }}>
          Page not found. You look as confused as me.
        </p>
        <img
          src="/confused-emote-no-bkgd.png"
          alt="Confused face"
          style={{ width: "100px", height: "100px", marginBottom: "2rem" }}
        />
        <Link
          href="/"
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#4f46e5",
            color: "white",
            borderRadius: "0.5rem",
            textDecoration: "none",
          }}
        >
          Go back home
        </Link>
      </div>
    </>
  );
}
