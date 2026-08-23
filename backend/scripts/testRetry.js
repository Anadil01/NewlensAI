const {
    retry
  } = require("../utils/retry");
  
  let attempts = 0;
  
  const run = async () => {
    try {
      const result = await retry(
        async () => {
          attempts++;
  
          console.log(
            `Running operation: attempt ${attempts}`
          );
  
          if (attempts < 3) {
            throw new Error(
              "Simulated temporary failure"
            );
          }
  
          return "Success";
        },
        {
          retries: 3,
          delay: 500
        }
      );
  
      console.log(
        "Final result:",
        result
      );
    } catch (error) {
      console.error(
        "Operation failed:",
        error.message
      );
    }
  };
  
  run();