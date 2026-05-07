import {
    useEffect,
    useState
  } from "react";
  
  import API from "../api/axios";
  import StoryCard from "../components/StoryCard";
  
  const Bookmarks = () => {
    const [stories, setStories] =
      useState([]);
  
    useEffect(() => {
      fetchBookmarks();
    }, []);
  
    const fetchBookmarks = async () => {
      try {
        const { data } =
          await API.get("/bookmarks");
  
        setStories(data);
      } catch (error) {
        console.log(error);
      }
    };
  
    return (
      <div className="container">
        <h1>My Bookmarks</h1>
  
        <div className="stories-grid">
          {stories.map((story) => (
            <StoryCard
              key={story._id}
              story={story}
            />
          ))}
        </div>
      </div>
    );
  };
  
  export default Bookmarks;