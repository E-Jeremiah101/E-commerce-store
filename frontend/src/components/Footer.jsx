import {
  FaFacebook,
  FaXTwitter,
  FaInstagram,
  FaWhatsapp,
  FaRegCopyright,
} from "react-icons/fa6";
import { Link } from "react-router-dom";
const Footer = () => {
  return (
    <div className="bg-black text-white ">
      <div className="grid grid-cols-1 md:grid-cols-2 m-0  py-16 lg:px-16    overflow-hidden whitespace-nowrap">
        <div>
          <table className="border-separate lg:border-spacing-x-15 border-spacing-x-11  border-spacing-y-4">
            <thead className="text-lg">
              <tr className="">
                <th className=" ">Links</th>
                <th className="  ">Support</th>
                <th className=" ">Follow Us on:</th>
              </tr>
            </thead>
            <tbody className="text-gray-100">
              <tr>
                <td>
                  {" "}
                  <Link to={"/"}>Home</Link>
                </td>
                <td>Privacy</td>
                <td>
                  <FaFacebook />
                </td>
              </tr>
              <tr>
                <td>
                  <Link to={"/cart"}>Cart</Link>
                </td>
                <td>FAQs</td>
                <td>
                  <FaXTwitter />
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
            <input type="text" className="border-1 px-2 py-1 rounded-sm" />
            <button className="bg-blue-600 px-2 text-sm border-blue-600 rounded-sm border-1 ml-3 py-1.5">
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
