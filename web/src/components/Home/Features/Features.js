import styles from "./Features.module.css";
import Scroll from "react-scroll";
import { useScroll, useTransform, motion } from "framer-motion";
import { useRef } from "react";

const ScrollElement = Scroll.Element;

export const Features = ({}) => {
  let ref = useRef();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["end end", "start start"],
  });

  const y1 = useTransform(scrollYProgress, (value) => value);

  return (
    <motion.div className={styles.section} ref={ref} style={{ y: y1 }}>
      <ScrollElement id="features" name="features">
        <h1 className={styles.title}>Features offered by us</h1>
        <h5 className={styles.subtitle}>
          Just the right features to help you stay on track!
        </h5>
        <div className={styles.features}>
          <div className={styles.feature}>
            <div className={styles.icon}>
              <i className={`fa-solid fa-mobile-screen`}></i>
            </div>
            <h5 className={styles.title}>Easy to use</h5>
            <p className={styles.subtitle}>
              Experience the ease of logging your transactions within seconds
              with our clean and fast interface!
            </p>
          </div>
          <div className={styles.feature}>
            <div className={styles.icon}>
              <i className={`fa-solid fa-lock`}></i>
            </div>
            <h5 className={styles.title}>Privacy</h5>
            <p className={styles.subtitle}>
              Your data is protected with top-level encryption, ensuring
              exclusive access and preserving your privacy and confidentiality
              as our utmost priority.
            </p>
          </div>

          <div className={styles.feature}>
            <div className={styles.icon}>
              <i className={`fa-solid fa-message`}></i>
            </div>
            <h5 className={styles.title}>Seamless SMS Integration.</h5>
            <p className={styles.subtitle}>
              App automatically reads and displays transactional messages from
              your SMS.Say goodbye to manual input and enjoy seamless financial
              management!
            </p>
          </div>

          <div className={styles.feature}>
            <div className={styles.icon}>
              <i className={`fa-solid fa-qrcode`}></i>
            </div>
            <h5 className={styles.title}>Smart Scan Receipt</h5>
            <p className={styles.subtitle}>
              Effortlessly capture receipts and bills with camera scan.
              Auto-note expenses with category and date recognition.
            </p>
          </div>

          <div className={styles.feature}>
            <div className={styles.icon}>
              <i className={`fa-solid fa-gear`}></i>
            </div>
            <h5 className={styles.title}>Customize</h5>
            <p className={styles.subtitle}>
              Add or edit categories and unlimited number of accounts as you
              like.
            </p>
          </div>
          <div className={styles.feature}>
            <div className={styles.icon}>
              <i className={`fa-solid fa-chart-line`}></i>
            </div>
            <h5 className={styles.title}>Budgets</h5>
            <p className={styles.subtitle}>
              Get deep and meaningful insights of your transactions and compare
              it with your previous data.
            </p>
          </div>
          <div className={styles.feature}>
            <div className={styles.icon}>
              <i className={`fa-solid fa-sync`}></i>
            </div>
            <h5 className={styles.title}>Daily Backup & Restore</h5>
            <p className={styles.subtitle}>
              No need to worry about manual backups. We securely handle daily
              backups at 12:00 AM, and you can restore data from the past 10
              backups.
            </p>
          </div>

          <div className={styles.feature}>
            <div className={styles.icon}>
              <i className={`fa-solid fa-file-export`}></i>
            </div>
            <h5 className={styles.title}>Export Options</h5>
            <p className={styles.subtitle}>
              Effortlessly export your account and transaction data to PDF,
              Excel, and JSON formats for easy access and analysis.
            </p>
          </div>

          <div className={styles.feature}>
            <div className={styles.icon}>
              <i className={`fa-solid fa-dollar-sign`}></i>
            </div>
            <h5 className={styles.title}>Global Currency Expense Manager</h5>
            <p className={styles.subtitle}>
              Easily manage expenses worldwide with support for all
              international currencies and automatic updates for their exchange
              rates.
            </p>
          </div>
        </div>
      </ScrollElement>
    </motion.div>
  );
};
