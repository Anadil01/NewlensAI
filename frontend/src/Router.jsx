import {createBrowserRouter} from "react-router-dom";
import AuthLayout from "./layouts/AuthLayout";


import Home from "./pages/Home";
import Login from "./pages/Login";
import Bookmarks from "./pages/Bookmarks";
import Register from "./pages/Register";

const Router = createBrowserRouter([
  {
   element:<AuthLayout/>,
   children:[
      {
         path:"/",
         element:<Home/>,
      },
      {
         path:"/login",
         element:<Login/>
      },
      {
         path:"/register",
         element:<Register/>
      },{
         path:"/bookmarks",
         element:<Bookmarks/>
      }
   ]
  }
]);

export default Router;