// import React, { useState } from 'react'
// import {UserPlus, User, Mail, Lock, Loader, ArrowRight } from "lucide-react";
// import { Link } from "react-router-dom";
// import { motion } from 'framer-motion';
// import {
//   checkRequired,
//   checkLength,
//   checkEmail,
// } from "../utils/validateForm.js";
// import { useUserStore } from '../stores/useUserStore';


// const SignUpPage = () => {
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     password: "",
//     confirmPassword: "",
//   });

//   const [errors, setErrors] = useState({});
//   const [success, setSuccess] = useState({});

//   const [backendError, setBackendError] = useState("");


//   const {signup, loading} = useUserStore();
//  let newErrors = {};
 
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     console.log("Called here");

//     setBackendError("");

//     let nameRequired = checkRequired(formData.name, "Full name");

//     if (nameRequired) {
//       newErrors.name = nameRequired;
//     }

//     let emailRequired = checkRequired(formData.email, "Email");
//     if (emailRequired) {
//       newErrors.email = emailRequired;
//     } else {
//       let emailValid = checkEmail(formData.email);
//       if (emailValid) newErrors.email = emailValid;
//     }
//     let passwordRequired = checkRequired(formData.password, "Password");
//     if (passwordRequired) {
//       newErrors.password = passwordRequired;
//     } else {
//       let passwordLength = checkLength(formData.password, 6, 25, "Password");
//       if (passwordLength) newErrors.password = passwordLength;
//     }

//     if (formData.confirmPassword !== formData.password) {
//       newErrors.confirmPassword = "Password do not match";
//     }

//     // stop if frontend validation fails
//     if (Object.keys(newErrors).length > 0) {
//       setErrors(newErrors);
//       return;
//     }

//     // call backend
//     const result = await signup(formData);

//     if (result?.error) {
//       setBackendError(result.error); // shows under button
//       return;
//     }

//     setErrors(newErrors);
//     setSuccess({
//       name: !newErrors.name,
//       email: !newErrors.email,
//       password: !newErrors.password,
//     });

//     // signup(formData);
//   }
//   return (
//     <div className="flex flex-col justify-center py-12 px-6 sm:px-6 lg:px-8 items-center ">
//       <motion.div
//         className="sm:mx-auto sm:w-full sm:max-w-md"
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.8 }}
//       >
//         <h2 className="mt-6 text-center text-3xl font-extrabold text-black  tracking-widest">
//           Create account
//         </h2>
//       </motion.div>

//       <motion.div
//         className=" mt-8 sm:mx-auto sm:w-full sm:max-w-md"
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.8, delay: 0.2 }}
//       >
//         <div className=" py-8 px-4 shadow-2xl rounded-lg sm:px-10">
//           <form onSubmit={handleSubmit} className="space-y-6">
//             {/* name */}
//             <div
//               className={`form-control ${
//                 success.name ? "success" : errors.name ? "error" : ""
//               }`}
//             >
//               <label
//                 htmlFor="name"
//                 className="block text-sm font-medium text-gray-500"
//               >
//                 Full name
//               </label>
//               <div className="mt-1 relative rounded-md shadow-sm mb-0">
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                   <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
//                 </div>
//                 <input
//                   type="text"
//                   id="name"
//                   value={formData.name}
//                   onChange={(e) =>
//                     setFormData({ ...formData, name: e.target.value })
//                   }
//                   className="block w-full px-3 py-2 pl-10 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:borderblack sm:text-2x1 "
//                   placeholder="John Doe"
//                 />
//               </div>

//               <small>{errors.name}</small>
//             </div>

//             {/* email */}
//             <div
//               className={`form-control ${
//                 success.email ? "success" : errors.email ? "error" : ""
//               }`}
//             >
//               <label
//                 htmlFor="email"
//                 className="block text-sm font-medium text-gray-500"
//               >
//                 Email address
//               </label>
//               <div className="mt-1 relative rounded-md shadow-sm">
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                   <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
//                 </div>
//                 <input
//                   type="text"
//                   id="email"
//                   value={formData.email}
//                   onChange={(e) =>
//                     setFormData({ ...formData, email: e.target.value })
//                   }
//                   className="block w-full px-3 py-2 pl-10 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-2x1 "
//                   placeholder="Johdoe@example.com"
//                 />
//               </div>
//               <small>{errors.email}</small>
//             </div>

//             {/* Password */}
//             <div
//               className={`form-control ${
//                 success.password ? "success" : errors.password ? "error" : ""
//               }`}
//             >
//               <label
//                 htmlFor="password"
//                 className="block text-sm font-medium text-gray-500"
//               >
//                 Password
//               </label>
//               <div className="mt-1 relative rounded-md shadow-sm">
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                   <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
//                 </div>
//                 <input
//                   type="password"
//                   id="password"
//                   autoComplete="new-password"
//                   value={formData.password}
//                   onChange={(e) =>
//                     setFormData({ ...formData, password: e.target.value })
//                   }
//                   className="block w-full px-3 py-2 pl-10 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-2x1 "
//                   placeholder="******"
//                 />
//               </div>
//               <small>{errors.password}</small>
//             </div>

//             {/* confirm password */}
//             <div
//               className={`form-control ${
//                 success.confirmPassword
//                   ? "success"
//                   : errors.confirmPassword
//                   ? "error"
//                   : ""
//               }`}
//             >
//               <label
//                 htmlFor="confirmPassword"
//                 className="block text-sm font-medium text-gray-500"
//               >
//                 Confirm Password
//               </label>
//               <div className="mt-1 relative rounded-md shadow-sm">
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                   <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
//                 </div>
//                 <input
//                   type="password"
//                   id="confirmPassword"
//                   value={formData.confirmPassword}
//                   onChange={(e) =>
//                     setFormData({
//                       ...formData,
//                       confirmPassword: e.target.value,
//                     })
//                   }
//                   className="block w-full px-3 py-2 pl-10 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-2x1"
//                   placeholder="******"
//                 />
//               </div>
//               <small>Password do not match</small>
//             </div>

//             <button
//               type="submit"
//               className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 duration-150 ease-in-out disabled:opacity-50"
//               disabled={loading}
//             >
//               {loading ? (
//                 <>
//                   <Loader
//                     className="mr-2 w-5 animate-spin"
//                     aria-hidden="true"
//                   />
//                   Loading...
//                 </>
//               ) : (
//                 <>
//                   <UserPlus className="mr-2 w-5 " aria-hidden="true" />
//                   Sign Up
//                 </>
//               )}
//             </button>
//             {backendError && (
//               <p className="mt-2 text-sm text-red-400 text-center">
//                 {backendError}
//               </p>
//             )}
//           </form>

//           <p className="mt-8 text-center text-sm text-gray-400">
//             Already have an account?{" "}
//             <Link
//               to="/login"
//               className="font-medium text-black hover:text-gray-800"
//             >
//               Login here <ArrowRight className="inline h-4 w-4" />
//             </Link>
//           </p>
//         </div>
//       </motion.div>
//     </div>
//   );
// }

// export default SignUpPage






import React, { useState } from "react";
import { UserPlus, User, Mail, Lock, Loader, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  checkRequired,
  checkLength,
  checkEmail,
} from "../utils/validateForm.js";
import { useUserStore } from "../stores/useUserStore";

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState({});

  const [backendError, setBackendError] = useState("");

  const { signup, loading } = useUserStore();
  let newErrors = {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Called here");

    setBackendError("");

    let nameRequired = checkRequired(formData.name, "Full name");

    if (nameRequired) {
      newErrors.name = nameRequired;
    }

    let emailRequired = checkRequired(formData.email, "Email");
    if (emailRequired) {
      newErrors.email = emailRequired;
    } else {
      let emailValid = checkEmail(formData.email);
      if (emailValid) newErrors.email = emailValid;
    }
    let passwordRequired = checkRequired(formData.password, "Password");
    if (passwordRequired) {
      newErrors.password = passwordRequired;
    } else {
      let passwordLength = checkLength(formData.password, 6, 25, "Password");
      if (passwordLength) newErrors.password = passwordLength;
    }

    if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Password do not match";
    }

    // stop if frontend validation fails
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // call backend
    const result = await signup(formData);

    if (result?.error) {
      setBackendError(result.error); // shows under button
      return;
    }

    setErrors(newErrors);
    setSuccess({
      name: !newErrors.name,
      email: !newErrors.email,
      password: !newErrors.password,
    });

    // signup(formData);
  };
  return (
    <div className=" py-12 sm:px-6 lg:px-8 items-center no-scroll ">
      <motion.div
        className="sm:mx-auto sm:w-full sm:max-w-md"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="mt-6 text-3xl px-4 text-black  tracking-widest">
          Create Account
        </h2>
      </motion.div>

      <motion.div
        className=" mt-8 no-scroll"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className=" py-8 px-4 no-scroll">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* name */}
            <div
              className={`form-control ${
                success.name ? "success" : errors.name ? "error" : ""
              }`}
            >
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Full name
              </label>
              <div className="mt-1 relative rounded-md shadow-sm mb-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="block text-black w-full px-3 py-4 pl-10  border-b-2 border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-2x1  "
                  placeholder="John Doe"
                />
              </div>

              <small>{errors.name}</small>
            </div>

            {/* email */}
            <div
              className={`form-control ${
                success.email ? "success" : errors.email ? "error" : ""
              }`}
            >
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  id="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="block text-black w-full px-3 py-4 pl-10  border-b-2 border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-2x1  "
                  placeholder="Johdoe@example.com"
                />
              </div>
              <small>{errors.email}</small>
            </div>

            {/* Password */}
            <div
              className={`form-control ${
                success.password ? "success" : errors.password ? "error" : ""
              }`}
            >
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="block text-black w-full px-3 py-4 pl-10  border-b-2 border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-2x1  "
                  placeholder="******"
                />
              </div>
              <small>{errors.password}</small>
            </div>

            {/* confirm password */}
            <div
              className={`form-control ${
                success.confirmPassword
                  ? "success"
                  : errors.confirmPassword
                  ? "error"
                  : ""
              }`}
            >
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-500"
              >
                Confirm Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="block text-black w-full px-3 py-4 pl-10  border-b-2 border-gray-600 rounded-md shadow- placeholder-gray-400 focus:outline-none sm:text-2x1 "
                  placeholder="******"
                />
              </div>
              <small>Password do not match</small>
            </div>

            <div className="px-4">
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 duration-150 ease-in-out disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader
                      className="mr-2 w-5 animate-spin"
                      aria-hidden="true"
                    />
                    Loading...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 w-5 " aria-hidden="true" />
                    Sign Up
                  </>
                )}
              </button>
            </div>

            {backendError && (
              <p className="mt-2 text-sm text-red-400 text-center">
                {backendError}
              </p>
            )}
          </form>

          <p className="mt-8 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-black hover:text-gray-800"
            >
              Login here <ArrowRight className="inline h-4 w-4" />
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SignUpPage;