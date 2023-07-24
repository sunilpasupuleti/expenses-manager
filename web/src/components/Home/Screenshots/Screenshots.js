import { Box, Tab, Tabs, Typography } from "@mui/material";
import styles from "./Screenshots.module.css";

import Scroll from "react-scroll";
import { useState } from "react";
import { TabContext, TabList, TabPanel } from "@mui/lab";
const ScrollElement = Scroll.Element;

export const Screenshots = (props) => {
  const [value, setValue] = useState("android");
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  let androidImages = [
    require("../../../assets/screenshots/android/1.png"),
    require("../../../assets/screenshots/android/2.png"),
    require("../../../assets/screenshots/android/3.png"),
    require("../../../assets/screenshots/android/4.png"),
    require("../../../assets/screenshots/android/5.png"),
    require("../../../assets/screenshots/android/6.png"),
    require("../../../assets/screenshots/android/7.png"),
    require("../../../assets/screenshots/android/8.png"),
    require("../../../assets/screenshots/android/9.png"),
  ];

  let iosImages = [
    require("../../../assets/screenshots/ios/1.png"),
    require("../../../assets/screenshots/ios/2.png"),
    require("../../../assets/screenshots/ios/3.png"),
    require("../../../assets/screenshots/ios/4.png"),
    require("../../../assets/screenshots/ios/5.png"),
    require("../../../assets/screenshots/ios/6.png"),
    require("../../../assets/screenshots/ios/7.png"),
    require("../../../assets/screenshots/ios/8.png"),
    require("../../../assets/screenshots/ios/9.png"),
  ];

  return (
    <ScrollElement
      className={styles.section}
      id="screenshots"
      name="screenshots"
    >
      <div className={styles.titleSection}>
        <h1 className={styles.title}>Screenshots</h1>
        <h5 className={styles.subtitle}>Check out what the app looks like!</h5>
      </div>

      <div className={styles.tabs}>
        <TabContext value={value}>
          <TabList
            onChange={handleChange}
            textColor="secondary"
            variant="fullWidth"
            indicatorColor="secondary"
            centered
          >
            <Tab value="android" label="Android" />
            <Tab value="ios" label="iOS" />
          </TabList>
          <TabPanel value={"android"}>
            <div className={styles.images}>
              {androidImages.map((image, index) => {
                return (
                  <div className={styles.image} key={index}>
                    <img src={image} alt="screenshot" />
                  </div>
                );
              })}
            </div>
          </TabPanel>
          <TabPanel value={"ios"}>
            <div className={styles.images}>
              {iosImages.map((image, index) => {
                return (
                  <div className={styles.image} key={index}>
                    <img src={image} alt="screenshot" />
                  </div>
                );
              })}
            </div>
          </TabPanel>
        </TabContext>
      </div>
    </ScrollElement>
  );
};
