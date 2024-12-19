import styles from "./Banner.module.css";
import Scroll from "react-scroll";
import { useScroll, useTransform, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const ScrollElement = Scroll.Element;
var scroller = Scroll.scroller;

export const Banner = ({}) => {
  const ref = useRef();
  const onClickGetAppButton = () => {
    scroller.scrollTo("download", {
      duration: 200,
      smooth: true,
    });
  };
  const PLAY_STORE_URL = process.env.REACT_APP_PLAY_STORE_URL;
  const APP_STORE_URL = process.env.REACT_APP_APP_STORE_URL;

  const { scrollY } = useScroll({
    target: ref,
  });
  const y1 = useTransform(scrollY, (value) => value / 1.5);

  const [width, setWidth] = useState(window.innerWidth);

  function handleWindowSizeChange() {
    setWidth(window.innerWidth);
  }

  useEffect(() => {
    window.addEventListener("resize", handleWindowSizeChange);
    return () => {
      window.removeEventListener("resize", handleWindowSizeChange);
    };
  }, []);

  const isMobile = width <= 768;

  return (
    <ScrollElement id="banner" name="banner">
      <motion.div
        ref={ref}
        className={styles.banner}
        style={{ y: isMobile ? 0 : y1 }}
      >
        <div className={styles.left}>
          <h1 className={styles.title}>
            Seamlessly manage expenses with Expenses Manager - Simple and
            effortless!
          </h1>

          <div className={styles.buttonsContainer}>
            <div className={styles.getButton} onClick={onClickGetAppButton}>
              GET THE APP
            </div>

            <a
              href={PLAY_STORE_URL}
              target="__blank"
              className={styles.iconButton}
            >
              <motion.img
                whileHover={{
                  scale: 1.2,
                  transition: { duration: 0.5 },
                }}
                src={require("../../../assets/playstore.png")}
              />
            </a>
            <a
              href={APP_STORE_URL}
              target="__blank"
              className={styles.iconButton}
            >
              <motion.img
                whileHover={{
                  scale: 1.2,
                  transition: { duration: 0.5 },
                }}
                src={require("../../../assets/appstore.png")}
              />
            </a>
          </div>

          <div className={styles.quote}>
            <a
              href="https://webwizard.in"
              target="__blank"
              className={styles.highlight}
            >
              “Expenses Manager - Spend Better!”
            </a>{" "}
            ~webwizard
          </div>
        </div>
        <div className={styles.right}>
          <div className={styles.mock}>
            <motion.img
              // drag
              // dragConstraints={{
              //   top: -20,
              //   left: -20,
              //   right: 20,
              //   bottom: 20,
              // }}
              // whileHover={{
              //   scale: 1.2,
              //   transition: { duration: 0.5 },
              // }}
              src={require("../../../assets/webp/mocks/merged.webp")}
            />
          </div>
        </div>
      </motion.div>
    </ScrollElement>
  );
};
