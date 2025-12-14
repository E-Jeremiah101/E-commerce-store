import {
  FaFacebook,
  FaXTwitter,
  FaInstagram,
  FaWhatsapp,
  FaTiktok,
  FaRegCopyright,
} from "react-icons/fa6";
import { Link } from "react-router-dom";
import ScrollReveal from "./ScrollReveal.jsx";
import { useStoreSettings } from "./StoreSettingsContext.jsx";
const Footer = () => {
  const { settings } = useStoreSettings();

  return (
    <ScrollReveal direction="up" delay={0.8} duration={1}>
      <div className=" text-black ">
        <div className="flex m-0 justify-center  py-16 lg:px-16    overflow-hidden whitespace-nowrap">
          <div>
            <table className="border-separate lg:border-spacing-x-40 border-spacing-x-11  border-spacing-y-4">
              <thead className="text-lg">
                <tr className="">
                  <th className=" ">Links</th>
                  <th className="  ">Support</th>
                  <th className=" ">Socials</th>
                </tr>
              </thead>
              <tbody className="text-black">
                <tr>
                  <td>
                    {" "}
                    <Link to={"/"}>Home</Link>
                  </td>
                  <td>Privacy</td>
                  <td>
                    <FaWhatsapp />
                  </td>
                </tr>
                <tr>
                  <td>
                    <Link to={"/cart"}>Cart</Link>
                  </td>
                  <td>FAQs</td>
                  <td>
                    <FaTiktok />
                  </td>
                </tr>
                <tr>
                  <td>
                    <Link to={"/Personal - info"}>Profile</Link>
                  </td>
                  <td></td>
                  <td>
                    <FaInstagram />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <Link to={"/"} className="flex justify-center items-center mb-3">
          {settings?.logo && (
            <img
              src={settings?.logo}
              alt={settings?.storeName}
              className="h-10 w-auto"
            />
          )}
          <span className="text-black px-2 font-bold text-xl">
            {settings?.storeName}
          </span>
        </Link>
        <hr className="border-1 my-1 border-gray-400" />
        <div className="flex justify-center items-center gap-2 text-sm font-light">
          <FaRegCopyright /> {new Date().getFullYear()}{" "}
          <span className="">All Right Reserved</span>
        </div>
      </div>
    </ScrollReveal>
  );
};

export default Footer;
