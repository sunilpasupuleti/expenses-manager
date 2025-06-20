import { Box, Tab, Tabs, Typography } from "@mui/material";
import styles from "./Screenshots.module.css";
import { useScroll, useTransform, motion } from "framer-motion";
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
    require("../../../assets/webp/screenshots/android/1.webp"),
    require("../../../assets/webp/screenshots/android/2.webp"),
    require("../../../assets/webp/screenshots/android/3.webp"),
    require("../../../assets/webp/screenshots/android/4.webp"),
    require("../../../assets/webp/screenshots/android/5.webp"),
    require("../../../assets/webp/screenshots/android/6.webp"),
    require("../../../assets/webp/screenshots/android/7.webp"),
    require("../../../assets/webp/screenshots/android/8.webp"),
    require("../../../assets/webp/screenshots/android/9.webp"),
    require("../../../assets/webp/screenshots/android/10.webp"),
  ];

  let iosImages = [
    require("../../../assets/webp/screenshots/ios/1.webp"),
    require("../../../assets/webp/screenshots/ios/2.webp"),
    require("../../../assets/webp/screenshots/ios/3.webp"),
    require("../../../assets/webp/screenshots/ios/4.webp"),
    require("../../../assets/webp/screenshots/ios/5.webp"),
    require("../../../assets/webp/screenshots/ios/6.webp"),
    require("../../../assets/webp/screenshots/ios/7.webp"),
    require("../../../assets/webp/screenshots/ios/8.webp"),
    require("../../../assets/webp/screenshots/ios/9.webp"),
    require("../../../assets/webp/screenshots/ios/10.webp"),
    require("../../../assets/webp/screenshots/ios/11.webp"),
    require("../../../assets/webp/screenshots/ios/12.webp"),
  ];

  const animations = {
    initial: { opacity: 0, x: -100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
  };

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
                  <motion.div
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.7,
                    }}
                    initial={{ x: -100, opacity: 0, scale: 0.5 }}
                    whileHover={{ scale: 1.2 }}
                    className={styles.image}
                    key={index}
                  >
                    <img src={image} alt="screenshot" />
                  </motion.div>
                );
              })}
            </div>
          </TabPanel>
          <TabPanel value={"ios"}>
            <div className={styles.images}>
              {iosImages.map((image, index) => {
                return (
                  <motion.div
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.7,
                    }}
                    initial={{ x: -100, opacity: 0, scale: 0.5 }}
                    whileHover={{ scale: 1.2 }}
                    className={styles.image}
                    key={index}
                  >
                    <img src={image} alt="screenshot" />
                  </motion.div>
                );
              })}
            </div>
          </TabPanel>
        </TabContext>
      </div>
    </ScrollElement>
  );
};
