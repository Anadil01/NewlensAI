const sleep = (ms) =>
    new Promise((resolve) =>
      setTimeout(resolve, ms)
    );
  
  const retry = async (
    operation,
    {
      retries = 3,
      delay = 1000
    } = {}
  ) => {
    let lastError;
  
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
  
        console.error(
          `Attempt ${attempt}/${retries} failed:`,
          error.message
        );
  
        if (attempt === retries) {
          break;
        }
  
        const retryDelay =
          delay * Math.pow(2, attempt - 1);
  
        console.log(
          `Retrying in ${retryDelay}ms...`
        );
  
        await sleep(retryDelay);
      }
    }
  
    throw lastError;
  };
  
  module.exports = {
    retry
  };