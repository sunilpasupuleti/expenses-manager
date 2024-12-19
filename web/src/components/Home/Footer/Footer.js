import styles from "./Footer.module.css";

import Scroll from "react-scroll";
const ScrollElement = Scroll.Element;

export const Footer = (props) => {
  return (
    <ScrollElement className={styles.section} id="contact" name="contact">
      <nav className={`${styles.navbar} `}>
        <div className={styles.content}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>Expenses Manager</h1>
            <h5 className={styles.subtitle}>
              Expenses Manager has been crafted to keep track of your spending
              effortlessly, with useful features in a simple, intuitive
              interface. And with Back up, it's easy to keep all your expenses
              in sync across your devices.
            </h5>
          </div>
          <div className={styles.contactSection}>
            <h1 className={styles.title}>Contact us</h1>
            <h5 className={styles.subtitle}>
              Do you have a question? Write us a word:{" "}
            </h5>
            <p className={styles.mail}>
              <a href="mailto:expenses-manager@webwizard.in">
                expenses-manager@webwizard.in
              </a>
            </p>

            <div className={styles.socialButtonsContainer}>
              <h1 className={styles.title}>Get in touch with us !</h1>
              <div className={styles.socialButtons}>
                <div className={`${styles.button} ${styles.github}`}>
                  <a href="https://github.com/sunilpasupuleti" target="__blank">
                    <img src={require("../../../assets/icons/github.png")} />
                  </a>
                </div>
                <div className={`${styles.button} ${styles.linkedin}`}>
                  <a
                    href="https://www.linkedin.com/in/sunil-kumar-pasupuleti/"
                    target="__blank"
                  >
                    <img src={require("../../../assets/icons/linkedin.png")} />
                  </a>
                </div>
                <div className={`${styles.button} ${styles.website}`}>
                  <a href="https://webwizard.in" target="__blank">
                    <img src={require("../../../assets/icons/website.png")} />
                  </a>
                </div>

                <div className={`${styles.button} ${styles.website}`}>
                  <a href="https://wa.me/919959907940" target="__blank">
                    <img src={require("../../../assets/icons/whatsapp.png")} />
                  </a>
                </div>
                <div className={`${styles.button} ${styles.website}`}>
                  <a
                    href="https://www.instagram.com/sunil__kumar__pasupuleti/"
                    target="__blank"
                  >
                    <img src={require("../../../assets/icons/instagram.png")} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.copyRightContainer}>
          <p className={styles.copyright}>
            Copyright &#169; 2020-{new Date().getFullYear()} SUNIL KUMAR
            PASUPULETI (Webwizard). All rights reserved
          </p>
          <a
            href={"https://expenses-manager.webwizard.in/privacy_policy.html"}
            target="__blank"
            className={styles.privacyLink}
          >
            Privacy Policy
          </a>
        </div>
      </nav>
    </ScrollElement>
  );
};
