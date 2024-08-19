import { Moon, Sun } from "lucide-react";
import React from "react";
import styles from "../styles/Home.module.css";

const DarkModeToggle = ({ darkMode, toggleDarkMode }) => {
  return (
    <button
      onClick={toggleDarkMode}
      className={`${styles.darkModeToggle} ${styles.darkModeToggleMobile}`}
      aria-label="Toggle dark mode"
    >
      {darkMode ? <Sun size={24} /> : <Moon size={24} />}
    </button>
  );
};

export default DarkModeToggle;
