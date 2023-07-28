import styles from "./Banner.module.css";
import Scroll from "react-scroll";
import { useScroll, useTransform, motion } from "framer-motion";
import { useRef } from "react";

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

  const { scrollY } = useScroll({
    target: ref,
  });
  const y1 = useTransform(scrollY, (value) => value / 1.5);

  return (
    <ScrollElement id="banner" name="banner">
      <motion.div ref={ref} className={styles.banner} style={{ y: y1 }}>
        <div className={styles.left}>
          <h1 className={styles.title}>
            Seamlessly manage expenses with Expenses Manager - Simple and
            effortless!
          </h1>
          <div className={styles.getButton} onClick={onClickGetAppButton}>
            GET THE APP
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
