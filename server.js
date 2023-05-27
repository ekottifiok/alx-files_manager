import express from 'express';
import routes from './routes';
import middlewares from './middlewares';

const app = express();

app.use(express.json());
const port = 5000;

middlewares(app);
routes(app);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
