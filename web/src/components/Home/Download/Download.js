import styles from "./Download.module.css";

import Scroll from "react-scroll";
const ScrollElement = Scroll.Element;

export const Download = (props) => {
  const PLAY_STORE_URL = process.env.REACT_APP_PLAY_STORE_URL;
  const APP_STORE_URL = process.env.REACT_APP_APP_STORE_URL;
  return (
    <ScrollElement className={styles.section} id="download" name="download">
      <div className={styles.androidMock}>
        <img src={require("../../../assets/mocks/android.png")} />
      </div>
      <div className={styles.iosMock}>
        <img src={require("../../../assets/mocks/ios.png")} />
      </div>

      <div className={styles.content}>
        <h1 className={styles.title}>Download now to get started!</h1>
        <h5 className={styles.subtitle}>
          What matters is how much you save. Start tracking your expenses today
          with Expenses Manager by Webwizard!
        </h5>

        <div className={styles.buttons}>
          <a href={PLAY_STORE_URL} target="__blank" className={styles.button}>
            <img src={require("../../../assets/google_play.png")} />
          </a>
          <a href={APP_STORE_URL} target="__blank" className={styles.button}>
            <img src={require("../../../assets/app_store.png")} />
          </a>
        </div>
      </div>
    </ScrollElement>
  );
};
