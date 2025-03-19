import {v4 as uuidv4} from 'uuid';

const generateStopId = () => {
  return `STOP-${uuidv4()}`;
};

export default generateStopId;