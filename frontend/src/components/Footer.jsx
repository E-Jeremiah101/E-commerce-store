import {
  FaFacebook,
  FaXTwitter,
  FaInstagram,
  FaWhatsapp,
  FaTiktok,
  FaRegCopyright,
} from "react-icons/fa6";
import { Link } from "react-router-dom";
const Footer = () => {
  return (
    <div className=" text-black ">
      <div className="grid grid-cols-1 md:grid-cols-2 m-0  py-16 lg:px-16    overflow-hidden whitespace-nowrap">
        <div>
          <table className="border-separate lg:border-spacing-x-15 border-spacing-x-11  border-spacing-y-4">
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
        <div className="flex justify-center items-center mt-7 md:mt-0">
          <form action="">
            <label htmlFor="" className="block">
              Join our newsletter
            </label>
            <input
              type="text"
              className="border-1 border-gray-500 px-2 py-1 rounded-sm w-fit"
            />
            <button className="bg-gray-500 px-2 text-sm border-gray-500 rounded-lg border-1 ml-2 py-1.5">
              Subscribe
            </button>
          </form>
        </div>
      </div>
      <Link to={"/"} className="flex justify-center items-center mb-3">
        <img src="/logo-buz.jpg" alt="Logo" className="h-10 w-auto " />
        <span className="text-emerald-400 font-bold text-xl">Eco~Store</span>
      </Link>
      <hr className="border-1 my-1" />
      <div className="flex justify-center items-center gap-2 text-sm font-light">
        <FaRegCopyright /> {new Date().getFullYear()}{" "}
        <span className="">All Right Reserved</span>
      </div>
    </div>
  );
};

export default Footer;
