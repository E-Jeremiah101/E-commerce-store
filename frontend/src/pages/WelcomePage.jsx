import React from 'react';
import { Link } from 'react-router-dom';
import GoBackButton from "../components/GoBackButton";

const WelcomePage = () => {
  return (
    <>
      <div className="bg-white  px-7 sm:h-screen md:flex md:px-0 md:justify-evenly">
        <div className="md:w-full md:flex md:flex-col md:justify-center md:px-7">
          <div className="py-4">
            <GoBackButton size={20} />
          </div>
          <div className="md:text-4xl flex justify-center items-center text-4xl bg-white  md:pb-0 md:tracking-widest">
            <div>
              WELCOME TO <span className="font-bold">ECO~STORE</span>
            </div>
          </div>
          <div>
            <img src="/shopping-landing.jpg" alt="" className="md:w-130" />
          </div>
        </div>

        <div className="md:bg-gradient-to-br from-white via-gray-100 to-gray-300  md:w-full md:flex md:flex-col md:justify-center md:px-7">
          <div>
            <Link to="/login">
            <button
              type="submit"
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black transition hover:bg-gray-800 focus:outline-none    duration-150 ease-in-out disabled:opacity-50 mt-20"
            >
               LOGIN
            </button>
            </Link>
          </div>

          <div>
            <Link to="/signup">
            <button
              type="submit"
              className="w-full flex justify-center py-4 px-4  text-sm font-medium text-black duration-150 ease-in-out disabled:opacity-50 mt-10"
            >
              SIGNUP
            </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default WelcomePage