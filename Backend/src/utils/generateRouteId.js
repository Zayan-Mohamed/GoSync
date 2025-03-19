import {v4 as uuidv4} from 'uuid';

const generateRouteId = () => {
  return `ROUTE-${uuidv4()}`;
};  

export default generateRouteId;