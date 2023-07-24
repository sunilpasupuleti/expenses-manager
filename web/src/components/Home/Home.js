import { useEffect } from "react";
import { Navbar } from "./Navbar/Navbar";
import { Banner } from "./Banner/Banner";
import { Download } from "./Download/Download";
import { Features } from "./Features/Features";
import { Screenshots } from "./Screenshots/Screenshots";
import { Footer } from "./Footer/Footer";

export const Home = ({ title }) => {
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
