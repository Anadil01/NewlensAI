import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

const StoryCard = ({ story }) => {
  const { user } = useAuth();

  const bookmarkStory = async () => {
    try {
      await API.post(
        `/stories/${story._id}/bookmark`
      );

      alert("Bookmark updated");
    } catch (error) {
      alert("Login required");
    }
  };

  return (
    <div className="story-card">
      <h3>{story.title}</h3>

      <p>
        👤 {story.author}
      </p>

      <p>
        ⭐ {story.points} points
      </p>

      <a
        href={story.url}
        target="_blank"
      >
        Read Story
      </a>

      {user && (
        <button onClick={bookmarkStory}>
          Bookmark
        </button>
      )}
    </div>
  );
};

export default StoryCard;