export const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  
  export const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
  