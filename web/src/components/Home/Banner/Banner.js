import styles from "./Banner.module.css";
import Scroll from "react-scroll";
const ScrollElement = Scroll.Element;
var scroller = Scroll.scroller;

export const Banner = (props) => {
  const onClickGetAppButton = () => {
    scroller.scrollTo("download", {
      duration: 200,
      smooth: true,
    });
  };
  return (
    <ScrollElement id="banner" name="banner" className={styles.banner}>
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
          <img src={require("../../../assets/webp/mocks/merged.webp")} />
        </div>
      </div>
    </ScrollElement>
  );
};
