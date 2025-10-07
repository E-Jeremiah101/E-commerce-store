import React from 'react'
import {
  FaFacebook,
  FaXTwitter,
  FaInstagram,
  FaWhatsapp,
} from "react-icons/fa6";

const Footer = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 m-0  py-16 px-16   bg-black text-white">
      <div>
        <table className="border-separate border-spacing-x-15  border-spacing-y-4">
          <thead className="text-lg">
            <tr className="">
              <th className=" ">
                Links
              </th>
              <th className="  ">Support</th>
              <th className=" ">
                Follow Us on:
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Home</td>
              <td>Privacy</td>
              <td>
                <FaFacebook />
              </td>
            </tr>
            <tr>
              <td>Cart</td>
              <td>FAQs</td>
              <td>
                <FaXTwitter />
              </td>
            </tr>
            <tr>
              <td>Profile</td>
              <td></td>
              <td>
                <FaInstagram />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="flex justify-center items-center mt-7 lg:mt-0">
        <form action="">
          <label htmlFor="" className="block">
            Join our newsletter
          </label>
          <input type="text" className="border-1 px-2 py-1" />
          <button className="bg-blue-600 px-2 border-blue-600 rounded-sm border-1 ml-3 py-1">
            Subscribe
          </button>
          
        </form>
      </div>
      <div className='block border-1 w-full mt-4'></div>
    </div>
  );
}

export default Footer