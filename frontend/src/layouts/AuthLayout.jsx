import {Outlet} from "react-router-dom";
import Navbar from "../components/Navbar";
function AuthLayout() {
    return ( 
        <>
         <Navbar/>
         <main className="mx-auto w-full max-w-7xl px-4 pb-14 pt-6 sm:px-6 lg:px-8">
            <Outlet/>
         </main>
        </>
     );
}

export default AuthLayout;