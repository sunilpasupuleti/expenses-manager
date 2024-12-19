import { useEffect, useState } from "react";
import styles from "./Navbar.module.css";
import Scroll from "react-scroll";
const ScrollLink = Scroll.Link;

export const Navbar = (props) => {
  const [open, setOpen] = useState(false);
  const [sticky, setSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const position = window.scrollY;
      if (position > 50) {
        setSticky(true);
      } else {
        setSticky(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
  }, []);

  const handleClickNavItem = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (open) {
      document.body.classList.add("fixed");
    } else {
      document.body.classList.remove("fixed");
    }
  }, [open]);

  return (
    <nav className={`${styles.navbar} ${sticky ? styles.sticky : ""}`}>
      <div className={styles.content}>
        <div className={styles.logo}>
          <img
            className={styles.logoImage}
            src={require("../../../assets/icon.jpeg")}
            alt="icon"
          />
          <ScrollLink
            to="banner"
            spy={true}
            smooth={true}
            offset={0}
            duration={200}
          >
            Expenses Manager
          </ScrollLink>
        </div>
        <ul className={`${styles.menuList} ${open ? styles.active : ""}`}>
          <div
            onClick={() => setOpen(false)}
            className={`${styles.icon} ${styles.cancelBtn}`}
          >
            <i className={`fas fa-times`}></i>
          </div>
          <li>
            <ScrollLink
              activeClass={styles.active}
              to="download"
              onClick={handleClickNavItem}
              spy={true}
              smooth={true}
              offset={0}
              duration={200}
            >
              DOWNLOAD
            </ScrollLink>
          </li>
          <li>
            <ScrollLink
              activeClass={styles.active}
              onClick={handleClickNavItem}
              to="features"
              spy={true}
              smooth={true}
              offset={0}
              duration={200}
            >
              FEATURES
            </ScrollLink>
          </li>
          <li>
            <ScrollLink
              activeClass={styles.active}
              onClick={handleClickNavItem}
              to="screenshots"
              spy={true}
              smooth={true}
              offset={0}
              duration={200}
            >
              SCREENSHOTS
            </ScrollLink>
          </li>
          <li>
            <ScrollLink
              activeClass={styles.active}
              onClick={handleClickNavItem}
              to="contact"
              spy={true}
              smooth={true}
              offset={0}
              duration={200}
            >
              CONTACT US
            </ScrollLink>
          </li>
        </ul>

        <div
          onClick={() => setOpen(true)}
          className={`${styles.icon} ${styles.menuBtn} ${
            open ? styles.hide : ""
          }`}
        >
          <i className={`fas fa-bars`}></i>
        </div>
      </div>
    </nav>
  );
};
