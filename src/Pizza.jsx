// let counter = 0;
const Pizza = (props) => {
  // counter = Date.now();
  return (
    <div className="pizza">
      <h1>
        {props.name} 
      </h1>
      <h3>{props.description}</h3>
      <img src={props.image} alt={props.name} />
    </div>
  );
};

export default Pizza;
