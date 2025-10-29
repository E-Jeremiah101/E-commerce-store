import React from 'react';
import { Link } from 'react-router-dom';
import GoBackButton from "../components/GoBackButton";

const WelcomePage = () => {
  return (
    <>
      <div className="bg-white  px-7 h-screen">
        <div className='py-4'><GoBackButton size={20} /></div>
         
        <div className=" justify-center items-center text-4xl bg-white pb-7">
          Welcome to <span className='font-bold'>Eco~Store</span>
        </div>
        <img src="/shopping-landing.jpg" alt="" />

        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black transition hover:bg-gray-800 focus:outline-none    duration-150 ease-in-out disabled:opacity-50 mt-20"
          >
           
            <Link
                          to="/login"
                         
                        > LOGIN</Link>
          </button>
        </div>

        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-4 px-4  text-sm font-medium text-black duration-150 ease-in-out disabled:opacity-50 mt-10"
          >
           
            <Link
                          to="/signup"
    
                        >
                           SIGNUP
                        </Link>
          </button>
        </div>
      </div>
    </>
  );
}

export default WelcomePage