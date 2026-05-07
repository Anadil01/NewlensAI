import {
    useEffect,
    useState
  } from "react";
  
  import API from "../api/axios";
  import StoryCard from "../components/StoryCard";
  
  const Home = () => {
    const [stories, setStories] = useState([]);
  
    useEffect(() => {
      fetchStories();
    }, []);
  
    const fetchStories = async () => {
      try {
        const { data } = await API.get("/stories");
  
        setStories(data);
      } catch (error) {
        console.log(error);
      }
    };
  
    return (
      <div className="container">
        <h1>Top Hacker News Stories</h1>
  
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
  
  export default Home;