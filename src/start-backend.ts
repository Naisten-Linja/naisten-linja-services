process.env.TZ = 'UTC'; // Set the backend application to use UTC time everywhere.
import { getConfig } from './backend/config';
import { createApp } from './backend/app';

const { port } = getConfig();
createApp()
  .then((app) => {
    app.listen(process.env.PORT, () =>
      console.log(`Backend app listening at http://localhost:${port}`),
    );
  })
  .catch((error) => {
    console.error(error);
  });
