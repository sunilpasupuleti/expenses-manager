import { useEffect, useRef } from "react";
import { Navbar } from "./Navbar/Navbar";
import { Banner } from "./Banner/Banner";
import { Download } from "./Download/Download";
import { Features } from "./Features/Features";
import { Screenshots } from "./Screenshots/Screenshots";
import { Footer } from "./Footer/Footer";
import { useScroll, useTransform } from "framer-motion";
import { useInView } from "react-intersection-observer";

const Home = ({ title }) => {
  useEffect(() => {
    document.title = title;
  }, []);

  return (
    <>
      <Navbar />
      <Banner />
      <Download />
      <Features />
      <Screenshots />
      <Footer />
    </>
  );
};

export default Home;
