const CardComponent = ({ title, value }) => {
    return (
      <div className="p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-lg font-medium">{title}</h2>
        <p className="text-2xl font-semibold text-[#E65100]">{value}</p>
      </div>
    );
  };
  
  export default CardComponent;
  