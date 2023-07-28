import styles from "./Download.module.css";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Scroll from "react-scroll";

const ScrollElement = Scroll.Element;

export const Download = ({}) => {
  const PLAY_STORE_URL = process.env.REACT_APP_PLAY_STORE_URL;
  const APP_STORE_URL = process.env.REACT_APP_APP_STORE_URL;

  return (
    <ScrollElement id="download" name="download">
      <motion.div className={styles.section}>
        <div className={styles.androidMock}>
          <motion.img
            whileHover={{
              scale: 1.2,
              transition: { duration: 0.5 },
            }}
            src={require("../../../assets/webp/mocks/android.webp")}
          />
        </div>
        <div className={styles.iosMock}>
          <motion.img
            whileHover={{
              scale: 1.2,
              transition: { duration: 0.5 },
            }}
            src={require("../../../assets/webp/mocks/ios.webp")}
          />
        </div>

        <div className={styles.content}>
          <h1 className={styles.title}>Download now to get started!</h1>
          <h5 className={styles.subtitle}>
            What matters is how much you save. Start tracking your expenses
            today with Expenses Manager by Webwizard!
          </h5>

          <div className={styles.buttons}>
            <a href={PLAY_STORE_URL} target="__blank" className={styles.button}>
              <motion.img
                whileHover={{
                  scale: 1.2,
                  transition: { duration: 0.5 },
                }}
                src={require("../../../assets/google_play.png")}
              />
            </a>
            <a href={APP_STORE_URL} target="__blank" className={styles.button}>
              <motion.img
                whileHover={{
                  scale: 1.2,
                  transition: { duration: 0.5 },
                }}
                src={require("../../../assets/app_store.png")}
              />
            </a>
          </div>
        </div>
      </motion.div>
    </ScrollElement>
  );
};
