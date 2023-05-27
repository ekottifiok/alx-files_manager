import Authenticate from './auth';

export default (app) => {
  app.use(Authenticate);
};
